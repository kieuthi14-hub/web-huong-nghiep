// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Tham Vấn Phản Tư Socrates - Kỹ thuật Socratic Funneling (Khoa học Hành vi)

const SYSTEM_PROMPT = `Bạn là "Trợ lý AI Tham Vấn Phản Tư Socrates" hướng nghiệp dành cho học sinh THPT.
Mục tiêu duy nhất của bạn: Giúp học sinh tự nhận diện các thiên lệch nhận thức (tự tin thái quá, mỏ neo hào nhoáng, bầy đàn) bằng phương pháp truy vấn ngược Socrates, kích hoạt tư duy phân tích sâu.

NGUYÊN TẮC BẮT BUỘC TRONG MỌI PHẢN HỒI:
1. TUYỆT ĐỐI KHÔNG KHEN NGỢI SÁO RỖNG (Triệt tiêu Sycophancy): Không dùng các câu như "Ước mơ tuyệt vời", "Bạn rất hợp với ngành này".
2. TUYỆT ĐỐI KHÔNG CÔNG KÍCH, PHÁN XÉT (Bảo đảm an toàn tâm lý): Cấm dùng từ "ngạo mạn", "sai lầm tuổi trẻ", "ảo tưởng". Giữ phong thái cố vấn điềm tĩnh, tôn trọng, gợi mở.
3. KHÔNG BẮT HỌC SINH NÓI LẠI TÊN NGÀNH VÀ TÊN TRƯỜNG.
4. MỖI LẦN CHỈ ĐẶT 1 ĐẾN 2 CÂU HỎI TRUY VẤN NGẮN GỌN để học sinh tự bóc tách mâu thuẫn lập luận của chính mình.
5. ĐỘ DÀI: Khoảng 70 - 100 từ, chia làm 2 đoạn ngắn gọn, kết thúc bằng câu hỏi truy vấn.

# ĐIỀU KHOẢN AN TOÀN TÂM LÝ BẮT BUỘC (ƯU TIÊN TUYỆT ĐỐI):
Nếu học sinh chia sẻ về bế tắc cuộc sống nghiêm trọng, khủng hoảng tâm lý nặng hoặc có ý định tự hại:
- DỪNG NGAY TOÀN BỘ VIỆC PHẢN BIỆN HƯỚNG NGHIỆP.
- Phản hồi ấm áp: "Thầy hiểu em đang phải chịu nhiều áp lực và mệt mỏi lúc này. Sức khỏe và sự bình an của em là điều quan trọng nhất. Em hãy tạm nghỉ ngơi và chia sẻ ngay với Thầy/Cô tâm lý trường, bố mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được lắng nghe và hỗ trợ nhé."`;

const FINAL_CHALLENGE_PROMPT = `# CHỈ THỊ VÒNG CHỐT - THÁCH THỨC BẰNG CHỨNG THỰC TẾ (DỪNG TOÀN BỘ CÂU HỎI):
Bạn là Trợ lý AI Tham Vấn Phản Tư Socrates. Lúc này cuộc đối thoại đã đủ các vòng chất vấn.
TUYỆT ĐỐI KHÔNG KẾT LUẬN HAY KHUYÊN HỌC SINH NÊN CHỌN HAY BỎ NGÀNH.
Hãy đưa ra một THÁCH THỨC NGHIÊN CỨU chuẩn mực (khoảng 90 - 120 từ) gồm đúng nội dung sau:

"Thầy thấy em có sự quyết tâm nhất định, nhưng qua các câu trả lời vừa rồi, vẫn còn rất nhiều dữ liệu thực tế về ngành này mà em chưa nắm rõ.

Một quyết định tương lai không thể chỉ dựa trên cảm xúc hay thông tin truyền miệng trên mạng xã hội. Em hãy sang **Bước 3: Đối chứng Dữ liệu Khách quan** trên hệ thống để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định cuối cùng!"`;

function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const greetings = [
    'chào thầy', 'chao thay', 'chào bạn', 'chao ban', 'xin chào', 'xin chao',
    'chào ai', 'hello', 'hi', 'alo', 'chào', 'chao', 'em chào thầy', 'em chao thay',
    'dạ', 'da', 'dạ thầy', 'da thay', 'vâng', 'vang', 'dạ em chào thầy', 'thầy ơi', 'thay oi',
    'dạ vâng', 'da vang', 'vâng ạ', 'vang a'
  ];
  return greetings.includes(clean);
}

function isUncertaintyOrHelpRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const keywords = [
    'chưa biết', 'chua biet', 'không biết', 'khong biet', 'chưa rõ', 'chua ro',
    'chưa nghĩ', 'chua nghi', 'chưa tìm hiểu', 'chua tim hieu', 'chưa có', 'chua co',
    'em chịu', 'chịu thôi', 'thầy giúp', 'thay giup', 'nhờ thầy', 'nho thay',
    'giúp em', 'giup em', 'chỉ em với', 'chi em voi', 'tư vấn giúp', 'tu van giup',
    'chưa tính', 'chua tinh', 'không rõ', 'khong ro', 'bí quá', 'em không rõ',
    'chưa thể', 'chua the', 'giúp với', 'giup voi', 'giúp em với', 'giup em voi',
    'chưa xác định', 'chua xac dinh', 'chưa lường', 'chua luong'
  ];
  return keywords.some(k => clean.includes(k));
}

function isTooShortOrEvasive(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  if (isGreetingOnly(text)) return false;
  if (isUncertaintyOrHelpRequest(text)) return false;

  const evasivePhrases = [
    'thích thì học', 'thich thi hoc', 'thích', 'thich', 'tùy', 'tuy', 'sao cũng được',
    'sao cung duoc', 'ok', 'ừ', 'u', 'uh', 'uhm', 'ko', 'k', 'không', 'khong',
    'bình thường', 'binh thuong', 'chả biết', 'cha biet', 'không có gì', 'khong co gi',
    'chịu', 'chiu', 'thích thế', 'thich the', 'kệ', 'ke', 'ai biết', 'ai biet',
    'được', 'duoc', 'chắc thế', 'chac the'
  ];
  if (evasivePhrases.includes(clean)) return true;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 3 || clean.length < 10) {
    return true;
  }
  return false;
}

function getSocraticDirective(round, anchor = {}, userMsg = '') {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'chưa xác định';
  const targetUniversity = (anchor.target_university || '').trim() || 'chưa xác định';
  const sourceOfInfluence = (anchor.source_of_influence || anchor.choice_source || 'mạng xã hội (TikTok, YouTube)').trim();
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';

  let hollandCodes = [];
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    hollandCodes = anchor.holland_codes;
  } else if (typeof anchor.holland_code === 'string') {
    hollandCodes = anchor.holland_code.replace(/[^RIASEC]/gi, '').split('');
  } else if (typeof anchor.primary_code === 'string') {
    hollandCodes = anchor.primary_code.replace(/[^RIASEC]/gi, '').split('');
  }
  if (hollandCodes.length === 0) hollandCodes = ['A', 'S', 'E'];

  let compatibilityStatus = (anchor.compatibility_status || anchor.holland_analysis || '').trim();
  if (!compatibilityStatus) {
    compatibilityStatus = `Tính cách nổi trội [${hollandCodes.join(', ')}] cần đối chiếu xem có tương thích hay lệch pha với đặc thù thực tế của ngành "${targetCareer}".`;
  }

  const hollandMap = {
    R: 'Thực tế / Kỹ thuật (thích máy móc, công cụ, không gian vật lý)',
    I: 'Nghiên cứu (thích tư duy trừu tượng, phân tích dữ liệu, giải quyết vấn đề phức tạp)',
    A: 'Nghệ thuật (thích tự do sáng tạo, thể hiện cái tôi thẩm mỹ)',
    S: 'Xã hội (thích giúp đỡ, giảng dạy, giao tiếp và kết nối con người)',
    E: 'Quản lý / Doanh nhân (thích lãnh đạo, thuyết phục, cạnh tranh mục tiêu)',
    C: 'Nghiệp vụ / Quy củ (thích ngăn nắp, quy trình rõ ràng, tính toán chính xác)'
  };

  const decodedTraits = hollandCodes.map(c => `${c}: ${hollandMap[c] || c}`).join('; ');

  const SYSTEM_INSTRUCTION_STEP2 = `Bạn là Trợ lý AI Tham Vấn Phản Tư Socrates. 
HỒ SƠ TÂM LÝ VÀ MỤC TIÊU CỦA HỌC SINH:
- Ngành học mục tiêu ban đầu: "${targetCareer}" (Mức tự tin: ${confidenceScore}/10)
- Kiểu hình tính cách Holland thực tế đo được: [${hollandCodes.join(', ')}] (${decodedTraits})
- Đánh giá sự tương thích (Analysis): ${compatibilityStatus} 
  (Ví dụ: Lệch pha giữa tính cách Nghiên cứu/Kỹ thuật nhưng lại chọn ngành Quản trị Kinh doanh thiên về giao tiếp/thương mại).
- Trường đại học mục tiêu: "${targetUniversity}"
- Nguồn ảnh hưởng chính: "${sourceOfInfluence}"

NHIỆM VỤ BẮT BUỘC CỦA AI:
1. KHÔNG BAO GIỜ để học sinh đọc biểu đồ trắc nghiệm một cách mơ hồ. AI phải chủ động "giải mã" hộ học sinh bằng ngôn ngữ đời thường nhất (Ví dụ: "Kết quả cho thấy em thuộc nhóm Nghiên cứu, thích ngồi tĩnh lặng phân tích số liệu, trái ngược với môi trường giao tiếp liên tục của ngành Kinh doanh em chọn").
2. Kích hoạt câu hỏi phản tư (Socratic Questioning) xoáy thẳng vào điểm mâu thuẫn này để buộc học sinh phải tự đánh giá lại xem mình có đang chọn ngành theo trào lưu hay thực sự hợp tính cách không.
3. Giữ thái độ khách quan, khoa học, điềm đạm, tuyệt đối không dùng từ ngữ miệt thị hoặc nịnh bợ (Anti-sycophancy).

QUY TẮC BẮT BUỘC TRONG MỌI PHẢN HỒI:
1. TUYỆT ĐỐI KHÔNG KHEN NGỢI SÁO RỖNG (Triệt tiêu Sycophancy): Không dùng các câu như "Ước mơ tuyệt vời", "Bạn rất hợp với ngành này".
2. TUYỆT ĐỐI KHÔNG CÔNG KÍCH, PHÁN XÉT (Bảo đảm an toàn tâm lý): Cấm dùng từ "ngạo mạn", "sai lầm tuổi trẻ", "ảo tưởng". Giữ phong thái cố vấn điềm tĩnh, tôn trọng, gợi mở.
3. KHÔNG BẮT HỌC SINH NÓI LẠI TÊN NGÀNH VÀ TÊN TRƯỜNG.
4. MỖI LẦN CHỈ ĐẶT 1 ĐẾN 2 CÂU HỎI TRUY VẤN NGẮN GỌN để học sinh tự bóc tách mâu thuẫn lập luận của chính mình.
5. ĐỘ DÀI: Khoảng 70 - 100 từ, chia làm 2 đoạn ngắn gọn, kết thúc bằng câu hỏi truy vấn.

# ĐIỀU KHOẢN AN TOÀN TÂM LÝ BẮT BUỘC (ƯU TIÊN TUYỆT ĐỐI):
Nếu học sinh chia sẻ về bế tắc cuộc sống nghiêm trọng, khủng hoảng tâm lý nặng hoặc có ý định tự hại:
- DỪNG NGAY TOÀN BỘ VIỆC PHẢN BIỆN HƯỚNG NGHIỆP.
- Phản hồi ấm áp: "Thầy hiểu em đang phải chịu nhiều áp lực và mệt mỏi lúc này. Sức khỏe và sự bình an của em là điều quan trọng nhất. Em hãy tạm nghỉ ngơi và chia sẻ ngay với Thầy/Cô tâm lý trường, bố mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được lắng nghe và hỗ trợ nhé."`;

  // 1. Xử lý khi học sinh nói "chưa biết" hoặc "nhờ giúp đỡ"
  if (isUncertaintyOrHelpRequest(userMsg)) {
    return SYSTEM_INSTRUCTION_STEP2 + `\n\n[CHỈ THỊ ĐẶC BIỆT KHI HỌC SINH NÓI "CHƯA BIẾT" HOẶC "NHỜ GIÚP ĐỠ"]:
Học sinh vừa phản hồi rằng chưa biết, chưa rõ hoặc cần sự giúp đỡ. BẮT BUỘC TUÂN THỦ 4 ĐIỀU SAU:
- Tuyệt đối KHÔNG lặp lại câu hỏi trước đó.
- KHÔNG khen ngợi sáo rỗng, nhưng công nhận sự trung thực nhận thức của học sinh (Ví dụ: "Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống kiến thức này.").
- Cung cấp một gợi mở tư duy ngắn gọn (DƯỚI 40 TỪ) về sự khác biệt giữa "kỹ năng thao tác kỹ thuật dễ bị AI thay thế" và "năng lực tư duy chiến lược/giao tiếp con người".
- Sau đó: Đặt câu hỏi điều hướng sang vòng tiếp theo (về Bộ kỹ năng thích ứng sinh tồn: ngoại ngữ, năng lực số, giao tiếp linh hoạt nếu ngành ${targetCareer} bão hòa), HOẶC yêu cầu học sinh ghi lại băn khoăn này vào sổ tay để chất vấn trực tiếp chuyên gia ở Bước 4.`;
  }

  // 2. Xử lý câu chào hỏi
  if (isGreetingOnly(userMsg)) {
    if (targetCareer && targetCareer !== 'chưa xác định') {
      return SYSTEM_INSTRUCTION_STEP2 + `\n\n[CHỈ ĐẠO XỬ LÝ LỜI CHÀO]:
Học sinh vừa chào bạn. Hãy chào lại lịch sự, điềm tĩnh:
Nhắc lại việc học sinh đang hướng tới ngành "${targetCareer}"${targetUniversity !== 'chưa xác định' ? ' tại ' + targetUniversity : ''} với mức tự tin ${confidenceScore}/10.
Chủ động giải mã ngắn gọn kiểu hình tính cách [${hollandCodes.join(', ')}] bằng ngôn ngữ đời thường và đối chiếu với ngành "${targetCareer}".
Hỏi câu hỏi mở đầu: "Ngoài những hình ảnh hào nhoáng trên truyền thông, điều gì cụ thể về thói quen học tập hoặc trải nghiệm thực tế khiến em tin tưởng ở mức ${confidenceScore}/10 rằng tính cách của mình thực sự hòa hợp với môi trường làm việc ngành ${targetCareer}?"`;
    } else {
      return SYSTEM_INSTRUCTION_STEP2 + `\n\n[CHỈ ĐẠO XỬ LÝ LỜI CHÀO]:
Học sinh vừa chào bạn nhưng chưa có ngành học mục tiêu. Hãy chào lại thân thiện:
"Chào em! Thầy là Trợ lý AI Tham Vấn Phản Tư Socrates. Em hãy cho Thầy biết: **Ngành học cụ thể và trường đại học em đang mong muốn xét tuyển nhất hiện nay là gì?**"`;
    }
  }

  // 2. Nếu chưa có ngành học
  if (!targetCareer || targetCareer === 'chưa xác định') {
    return SYSTEM_INSTRUCTION_STEP2 + `\n\n[CHỈ ĐẠO KHI CHƯA RÕ NGÀNH]:
Học sinh chưa xác lập ngành học ở Bước 1. Đọc tin nhắn học sinh:
- Nếu học sinh nêu tên ngành: Dùng ngành đó đối chiếu với nhóm tính cách [${hollandCodes.join(', ')}] và chất vấn: "Điều gì cụ thể về năng lực học tập khiến em tự tin mình phù hợp với ngành này?"
- Nếu học sinh chưa nêu: Mời em nêu rõ tên ngành và trường muốn xét tuyển.`;
  }

  // 3. Tiến trình phễu phản tư từng vòng
  const baseDirective = SYSTEM_INSTRUCTION_STEP2 + `\n\n[CHỈ ĐẠO SOCRATES - VÒNG ${round}/8]:
YÊU CẦU: Ngắn gọn (70 - 100 từ), 2 đoạn ngắn, giọng văn khách quan, KHÔNG phán xét, kết thúc bằng 1 đến 2 câu hỏi truy vấn:`;

  switch (round) {
    case 1:
      return baseDirective + `\n- VÒNG 1 (Đã chất vấn xong về Năng lực học tập thực tế ➜ Tiến hành chất vấn Vòng 2 về Nguy cơ tự động hóa 4.0):
  Học sinh vừa trả lời câu hỏi Vòng 1 về điểm số môn học hoặc trải nghiệm thực tế đối với ngành "${targetCareer}".
  Hãy phản hồi ngắn gọn (dưới 40 từ), ghi nhận thực tế của học sinh (KHÔNG khen ngợi sáo rỗng, triệt tiêu sycophancy).
  Sau đó chuyển ngay sang câu hỏi chất vấn Vòng 2: "Trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành ${targetCareer}, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?"`;

    case 2:
      return baseDirective + `\n- VÒNG 2 (Đã chất vấn xong về Nguy cơ tự động hóa 4.0 ➜ Tiến hành chất vấn Vòng 3 về Bộ kỹ năng thích ứng sinh tồn):
  Học sinh vừa trả lời câu hỏi Vòng 2 về nguy cơ AI và kỹ năng chuyên sâu trong ngành "${targetCareer}".
  Hãy phản hồi ngắn gọn (dưới 40 từ), điềm đạm, không phán xét.
  Sau đó chuyển ngay sang câu hỏi chất vấn Vòng 3: "Nếu thị trường lao động ngành ${targetCareer} bước vào chu kỳ biến động hoặc bão hòa khi em tốt nghiệp, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và kế hoạch việc làm linh hoạt nào để không bị đào thải?"`;

    case 3:
      return baseDirective + `\n- VÒNG 3 (Đã chất vấn xong về Bộ kỹ năng sinh tồn ➜ Tiến hành chất vấn Vòng 4 về Đối chứng dữ liệu thực tế):
  Học sinh vừa trả lời câu hỏi Vòng 3 về kỹ năng thích ứng sinh tồn và kế hoạch việc làm của ngành "${targetCareer}".
  Hãy phản hồi ngắn gọn (dưới 40 từ), ghi nhận và giữ thái độ khách quan.
  Sau đó chuyển sang câu hỏi chất vấn Vòng 4: "Để đưa ra quyết định chắc chắn ở mức ${confidenceScore}/10, em đã từng trực tiếp tra cứu các số liệu khách quan như Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và học phí thực tế của ngành ${targetCareer} chưa, hay vẫn chủ yếu dựa trên cảm tính và mạng xã hội?"`;

    case 4:
    default:
      return FINAL_CHALLENGE_PROMPT;
  }
}

function generateSocraticHeuristicReply(round, anchor = {}, userMsg = '', isFinal = false) {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'ngành em chọn';
  const targetUniversity = (anchor.target_university || '').trim();
  const univText = targetUniversity && targetUniversity !== 'chưa xác định' ? ` tại ${targetUniversity}` : '';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
  
  let hollandCodes = [];
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    hollandCodes = anchor.holland_codes;
  } else if (typeof anchor.holland_code === 'string') {
    hollandCodes = anchor.holland_code.replace(/[^RIASEC]/gi, '').split('');
  }
  const codeStr = hollandCodes.length > 0 ? `[${hollandCodes.join(', ')}]` : '';

  if (isFinal || round >= 4) {
    return `Qua 4 vòng phản biện vừa rồi, Thầy nhận thấy em có sự quyết tâm nhất định, nhưng giữa lý thuyết và số liệu thực tế vẫn còn nhiều khoảng trống thông tin mang tính sống còn mà em chưa có dữ liệu chứng minh.\n\nMột quyết định nghề nghiệp trọn đời không thể chỉ dựa trên suy đoán lý thuyết hay truyền thông. Em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định!`;
  }

  // Phản hồi đặc biệt khi học sinh nói "chưa biết" hoặc "nhờ giúp đỡ"
  if (isUncertaintyOrHelpRequest(userMsg)) {
    return `Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống kiến thức này. Các thao tác kỹ thuật lặp lại rất dễ bị AI thay thế; giá trị cốt lõi bền vững thuộc về tư duy chiến lược, năng lực giải quyết vấn đề phức tạp và giao tiếp giữa con người với con người.\n\nEm hãy ghi ngay băn khoăn này vào sổ tay để đối chất trực tiếp cùng cố vấn chuyên môn ở Bước 4. Còn bây giờ, để chuẩn bị cho tương lai, em dự định rèn luyện Bộ kỹ năng thích ứng sinh tồn (ngoại ngữ, năng lực số, giao tiếp) như thế nào để không bị đào thải nếu thị trường ngành **${targetCareer}** biến động sau tốt nghiệp?`;
  }

  if (isGreetingOnly(userMsg)) {
    return `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành này?`;
  }

  switch (round) {
    case 1:
      return `Thầy đã ghi nhận phản hồi của em về năng lực nền tảng và điểm số môn học đối với ngành **${targetCareer}**.\n\nTuy nhiên, một thách thức lớn trong 4-5 năm tới là làn sóng tự động hóa từ Trí tuệ nhân tạo (AI). Nhiều tác vụ kỹ thuật cơ bản của ngành **${targetCareer}** đang dần bị thay thế nhanh chóng. Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`;

    case 2:
      return `Lập luận của em về kỹ năng chuyên sâu có sự chuẩn bị, nhưng thị trường lao động sau tốt nghiệp luôn biến động khôn lường.\n\nNếu thị trường lao động ngành **${targetCareer}** bước vào chu kỳ biến động hoặc bão hòa khi em tốt nghiệp, em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn (ngoại ngữ chuyên sâu, năng lực số ứng dụng, kỹ năng giao tiếp linh hoạt) và kế hoạch việc làm linh hoạt nào để không bị đào thải?`;

    case 3:
      return `Thầy ghi nhận kế hoạch thích ứng linh hoạt của em. Tuy nhiên, một quyết định ở mức tự tin **${confidenceScore}/10** đòi hỏi phải dựa trên số liệu xác thực thay vì ước đoán.\n\nEm đã từng đối chiếu trực tiếp Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và biểu phí đào tạo thực tế của ngành **${targetCareer}** chưa, hay phần lớn thông tin em có vẫn đến từ suy đoán và mạng xã hội?`;

    case 4:
    default:
      return `Qua 4 vòng phản biện vừa rồi, Thầy nhận thấy em có sự quyết tâm nhất định, nhưng giữa lý thuyết và số liệu thực tế vẫn còn nhiều khoảng trống thông tin mang tính sống còn mà em chưa có dữ liệu chứng minh.\n\nMột quyết định nghề nghiệp trọn đời không thể chỉ dựa trên suy đoán lý thuyết hay truyền thông. Em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định!`;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Phương thức không hợp lệ. Chỉ chấp nhận POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn('Lỗi parse JSON body:', e);
      }
    }

    const { message, history = [], round, isFinal, anchor = {} } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    const trimmedMessage = message.trim();
    const userHistoryTurns = Array.isArray(history)
      ? history.filter(h => h.role === 'user').length
      : 0;
    const currentRound = Number(round) || (userHistoryTurns + 1);
    const maxRoundsSetting = Number(body?.maxRounds) || 4;
    const isFinalRound = Boolean(isFinal) || currentRound > maxRoundsSetting;

    const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'ngành em chọn';

    // QUY TẮC 1: Nếu học sinh chỉ chào hỏi (Ví dụ: "chào thầy", "hello", "dạ")
    // Tuyệt đối KHÔNG tính đây là một vòng phản tư, KHÔNG tăng biến đếm vòng.
    if (isGreetingOnly(trimmedMessage)) {
      const greetingReply = currentRound === 1
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành này?`
        : currentRound === 2
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy tập trung trả lời câu hỏi ở trên về nguy cơ tự động hóa bởi AI và kỹ năng chuyên sâu không thể thay thế của em trong ngành ${targetCareer}.`
        : `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy tập trung trả lời câu hỏi ở trên về Bộ kỹ năng chuyển đổi và kế hoạch việc làm linh hoạt để thích ứng sinh tồn.`;

      return res.status(200).json({
        reply: greetingReply,
        round: currentRound,
        isFinal: false,
        advanced: false
      });
    }

    // QUY TẮC 2: Nếu học sinh né tránh hoặc trả lời quá ngắn (Dưới 1 câu hoàn chỉnh / < 3 từ / < 10 ký tự)
    // Giữ nguyên câu hỏi và yêu cầu học sinh làm rõ, KHÔNG tăng biến đếm vòng.
    if (isTooShortOrEvasive(trimmedMessage)) {
      return res.status(200).json({
        reply: `Câu trả lời này chưa đủ dữ kiện để phản biện. Em hãy đưa ra dẫn chứng cụ thể hơn.`,
        round: currentRound,
        isFinal: false,
        advanced: false
      });
    }
    
    let activeSystemInstruction = '';
    if (isFinalRound) {
      activeSystemInstruction = FINAL_CHALLENGE_PROMPT;
    } else {
      activeSystemInstruction = getSocraticDirective(currentRound, anchor, trimmedMessage);
    }

    const targetMaxTokens = 1200; // Đặt 1200 tokens để bao gồm cả thinking tokens (~400) và câu trả lời hoàn chỉnh (~200)
    const targetTemperature = isFinalRound ? 0.3 : 0.4;

    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof Buffer !== 'undefined'
      ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
      : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
    // Thứ tự ưu tiên model có tốc độ phản hồi nhanh nhất và còn quota khả dụng
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3-flash-preview',
      'gemini-flash-latest',
      'gemini-3.5-flash'
    ].filter(Boolean);

    const contents = [];

    // Chỉ giữ lại tối đa 6 lượt chat gần nhất để tránh độ trễ xử lý context dài
    const trimmedHistory = Array.isArray(history) ? history.slice(-6) : [];

    for (const item of trimmedHistory) {
      if (!item || !item.text || typeof item.text !== 'string') continue;
      const role = item.role === 'model' || item.role === 'ai' ? 'model' : 'user';

      if (contents.length === 0 && role === 'model') {
        continue;
      }

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${item.text}`;
      } else {
        contents.push({
          role,
          parts: [{ text: item.text }]
        });
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${message.trim()}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: activeSystemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: targetTemperature,
        maxOutputTokens: targetMaxTokens
      }
    };

    let replyText = null;
    let lastError = null;

    for (const m of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500); // 5.5s mỗi model để đủ thời gian cho thinking và hoàn thành câu

      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts) && parts.length > 0) {
            const cleanParts = parts.filter(p => !p.thought && p.text);
            if (cleanParts.length > 0) {
              replyText = cleanParts.map(p => p.text).join('\n\n').trim();
            } else {
              replyText = parts[0]?.text?.trim();
            }
            if (replyText) {
              replyText = replyText
                .replace(/^(Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
                .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ).*?\]\s*/i, '')
                .replace(/^#+.*?(CHỈ ĐẠO|CHỈ THỊ).*?\n/i, '')
                .trim();
            }
          }
          // Kiểm tra xem phản hồi có bị cắt ngang/cộc lốc không (ít hơn 35 ký tự)
          if (replyText && replyText.length >= 35) {
            console.log(`Successfully responded using model: ${m} (Round ${currentRound}, length: ${replyText.length})`);
            break;
          } else if (replyText) {
            console.warn(`Model ${m} trả lời quá ngắn/bị cắt ngang (${replyText.length} ký tự): "${replyText}". Bỏ qua để dùng câu hoàn chỉnh.`);
            replyText = null;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
          console.warn(`Model ${m} failed (${response.status}):`, lastError);
        }
      } catch (err) {
        lastError = err?.message || String(err);
        console.warn(`Model ${m} request exception:`, lastError);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // Nếu các model Gemini đều bận/hết quota (429/503), kích hoạt bộ phản hồi Socrates dự phòng chuẩn hóa
    if (!replyText) {
      console.warn('Tất cả model Gemini bận/hết quota. Sử dụng Socratic Heuristic Fallback để không làm gián đoạn học sinh.');
      replyText = generateSocraticHeuristicReply(currentRound, anchor, message.trim(), isFinalRound);
    }

    return res.status(200).json({ 
      reply: replyText,
      round: currentRound,
      isFinal: isFinalRound
    });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    // Luôn trả về phản hồi Socrates thay vì lỗi 500 để người dùng không bao giờ bị đứng yên
    const fallbackReply = generateSocraticHeuristicReply(1, {}, '', false);
    return res.status(200).json({ 
      reply: fallbackReply,
      round: 1,
      isFinal: false,
      fallback: true
    });
  }
}
