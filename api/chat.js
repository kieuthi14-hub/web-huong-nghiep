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
  const greetings = ['chào thầy', 'chao thay', 'chào bạn', 'chao ban', 'xin chào', 'xin chao', 'chào ai', 'hello', 'hi', 'alo', 'chào', 'chao', 'em chào thầy', 'em chao thay'];
  return greetings.includes(clean);
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

  // 1. Xử lý câu chào hỏi
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
      return baseDirective + `\n- VÒNG 1 (Giải mã thiên hướng Holland & truy vấn mâu thuẫn nhận thức ban đầu):
  Chủ động "giải mã" nhóm tính cách [${hollandCodes.join(', ')}] bằng ngôn ngữ đời thường so với môi trường ngành "${targetCareer}".
  Xoáy thẳng vào điểm lệch pha hoặc mâu thuẫn nhận thức (như ghi trong Đánh giá: ${compatibilityStatus}).
  Hỏi: "Kết quả cho thấy em thuộc nhóm [${hollandCodes.join(', ')}]. So với môi trường làm việc thực tế của ngành ${targetCareer}, điều gì khiến em tin rằng sự tự tin ${confidenceScore}/10 này xuất phát từ bản chất tính cách chứ không phải do hiệu ứng lan truyền từ ${sourceOfInfluence}?"`;

    case 2:
      return baseDirective + `\n- VÒNG 2 (Chất vấn môn học cốt lõi & đối chiếu năng lực thực chất):
  Nêu môn học chuyên sâu hoặc kỹ năng nặng nhất của ngành "${targetCareer}" (Ví dụ: Toán giải tích, thuật toán lập trình, áp lực sáng tạo liên tục, ngoại ngữ chuyên ngành...).
  Đối chiếu xem nhóm tính cách [${hollandCodes.join(', ')}] có dễ nản lòng trước khối lượng bài tập môn này không.
  Hỏi: "Ngành ${targetCareer} đòi hỏi cường độ rất nặng về [môn/kỹ năng cốt lõi]. Điểm số thực tế môn này và thói quen tự học của em ra sao, hay em mới chỉ dừng lại ở sở thích và sự hào nhoáng bề ngoài?"`;

    case 3:
      return baseDirective + `\n- VÒNG 3 (Đối chiếu kỳ vọng thị trường & thu nhập thực tế):
  Nêu thực tế nhiều clip mạng xã hội chỉ khoe thành công vượt trội, trong khi thực tế có tỷ lệ cạnh tranh và làm trái ngành đáng kể.
  Hỏi: "Em có biết tỷ lệ sinh viên ngành này tốt nghiệp làm đúng chuyên ngành hoặc mức thu nhập khởi điểm thực tế cho người mới ra trường hiện nay là bao nhiêu không?"`;

    case 4:
      return baseDirective + `\n- VÒNG 4 (Chất vấn chi phí & học phí tự chủ 4 năm):
  Nêu thực tế học phí đại học tự chủ thường tăng 10-15%/năm kèm theo chi phí sinh hoạt đắt đỏ.
  Hỏi: "Học phí đại học tự chủ hiện nay tăng 10-15% mỗi năm. Em và gia đình đã cùng ngồi lại tính toán kế hoạch tài chính cụ thể cho toàn bộ 4 năm học chưa?"`;

    case 5:
      return baseDirective + `\n- VÒNG 5 (Thách thức thích ứng & nâng cao năng lực cạnh tranh trước AI):
  Nêu áp lực tự động hóa từ công nghệ AI đối với các tác vụ cơ bản của ngành ${targetCareer}.
  Hỏi: "Khi AI đang tự động hóa nhiều công việc cơ bản của ngành này, em dự định rèn luyện thêm năng lực đặc thù nào để tạo ra giá trị khác biệt và duy trì lợi thế cạnh tranh lâu dài?"`;

    default:
      return baseDirective + `\n- VÒNG ĐÀO SÂU (Bóc tách dữ liệu còn mơ hồ):
  Đào sâu vào sự ngập ngừng hoặc thiếu dữ liệu số liệu trong câu trả lời vừa rồi của học sinh, yêu cầu đưa ra bằng chứng thực tế thay vì cảm tính.`;
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

  if (isFinal || round > 4) {
    return `Thầy ghi nhận tinh thần phản biện và sự nghiêm túc của em qua các câu trả lời vừa rồi. Tuy nhiên, một quyết định tương lai không thể chỉ dựa trên suy đoán lý thuyết hay cảm xúc nhất thời.\n\nVẫn còn nhiều dữ liệu thực tế về ngành **${targetCareer}** mà em cần tự tay kiểm chứng. Em hãy bấm nút chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định!`;
  }

  if (isGreetingOnly(userMsg)) {
    return `Chào em! Thầy là Trợ lý AI Tham Vấn Phản Tư Socrates. Dữ liệu ghi nhận em đang hướng tới ngành **${targetCareer}**${univText} với mức tự tin **${confidenceScore}/10** ${codeStr ? `(Mã Holland: ${codeStr})` : ''}.\n\nĐể bắt đầu, em hãy chia sẻ: Ngoài những thông tin chung trên mạng, điều gì cụ thể về kết quả học tập các môn liên quan khiến em tin tưởng ở mức ${confidenceScore}/10 rằng mình sẽ học tốt ngành này?`;
  }

  switch (round) {
    case 1:
      return `Thầy đã đọc lập luận của em về lý do chọn ngành **${targetCareer}**. Tuy nhiên, giữa sự tự tin ban đầu (${confidenceScore}/10) với thực tế môi trường đào tạo chuyên sâu thường có khoảng cách khá lớn.\n\nĐối với ngành **${targetCareer}**, các môn chuyên ngành đòi hỏi tư duy phân tích và áp lực bài tập rất nặng. Điểm số các môn học liên quan hiện tại ở trường THPT và thói quen tự giải quyết vấn đề của em thực chất ra sao?`;

    case 2:
      return `Em đã giải thích về năng lực học tập, nhưng một góc khuất khác là sự tương thích tính cách lâu dài. Đặc thù công việc ngành **${targetCareer}** đòi hỏi sự kiên nhẫn đối mặt với thất bại và áp lực cạnh tranh sau 2-3 năm ra trường.\n\nNếu công việc thực tế không năng động như kỳ vọng mà đòi hỏi sự kiên trì xử lý lỗi chuyên môn và họp hành liên tục, tính cách của em có thực sự phù hợp để trụ lại lâu dài không?`;

    case 3:
      return `Lý do em đưa ra thể hiện sự quyết tâm, nhưng chúng ta cần đối diện với mỏ neo chi phí và rủi ro tuyển sinh. Hiện nay học phí đại học tự chủ ngành **${targetCareer}** tăng 10-15%/năm kèm chi phí sinh hoạt đắt đỏ.\n\nEm và gia đình đã có kế hoạch tài chính cụ thể cho 4 năm học chưa? Và nếu điểm chuẩn năm nay bất ngờ biến động tăng cao, phương án nguyện vọng dự phòng của em là gì?`;

    case 4:
    default:
      return `Qua các vòng trao đổi, thầy nhận thấy em đã bắt đầu nhìn nhận vấn đề nhiều chiều hơn, nhưng vẫn còn nhiều khoảng trống thông tin thực tế chưa có số liệu chứng minh.\n\nMột quyết định nghề nghiệp nghiêm túc đòi hỏi sự kiểm chứng khách quan. Em hãy bấm nút chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn và học phí thực tế nhé!`;
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

    const userHistoryTurns = Array.isArray(history)
      ? history.filter(h => h.role === 'user').length
      : 0;
    const currentRound = Number(round) || (userHistoryTurns + 1);
    const maxRoundsSetting = Number(body?.maxRounds) || 4;
    const isFinalRound = Boolean(isFinal) || currentRound > maxRoundsSetting;
    
    let activeSystemInstruction = '';
    if (isFinalRound) {
      activeSystemInstruction = FINAL_CHALLENGE_PROMPT;
    } else {
      activeSystemInstruction = getSocraticDirective(currentRound, anchor, message.trim());
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
