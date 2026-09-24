// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Chuyên gia Phản tư Hành vi Socrates (Nghiên cứu CBAS - ViSEF Quốc gia 2026)

const FINAL_CHALLENGE_PROMPT = (targetCareer, targetUniversity = 'Đại học Bách Khoa', confidenceScore = '8') => `# CHỈ THỊ LƯỢT 4 - KẾT THÚC PHIÊN (ĐÃ ĐỦ DỮ KIỆN):
TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO.
BẮT BUỘC đưa ra đúng phản hồi đúc kết sau (khoảng 90 - 120 từ), liệt kê 3 khoảng trống nhận thức:

"Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức cốt lõi:
1. **Khoảng trống năng lực & kỳ vọng thu nhập:** Giữa hình ảnh hào nhoáng trên truyền thông với độ khó học thuật và phân hóa thu nhập thực tế của ngành **${targetCareer}**.
2. **Khoảng trống thích ứng công nghệ:** Nguy cơ tự động hóa từ AI đối với các tác vụ cơ bản và sự thiếu hụt Bộ kỹ năng chuyển đổi sinh tồn.
3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa đối chiếu số liệu thực tế về điểm chuẩn, học phí và đề án tuyển sinh tại **${targetUniversity}**.

Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế nhằm xây dựng cơ sở vững chắc cho quyết định của mình!"`;

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

function isEmotionalReasoning(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase();
  const keywords = [
    'kiếm nhiều tiền', 'kiem nhieu tien', 'nhiều tiền', 'nhieu tien', 'lương cao', 'luong cao',
    'lương khủng', 'luong khung', 'thu nhập cao', 'thu nhap cao', 'nghe nói hot', 'nghe noi hot',
    'thấy hot', 'thay hot', 'ngành hot', 'nganh hot', 'nghe đồn', 'nghe don', 'giàu', 'giau',
    'làm giàu', 'lam giau', 'hái ra tiền', 'hai ra tien', 'thu nhập khủng'
  ];
  return keywords.some(k => clean.includes(k));
}

function isVagueEffort(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase();
  const keywords = [
    'cố gắng', 'co gang', 'nỗ lực', 'no luc', 'quyết tâm', 'quyet tam',
    'chăm chỉ', 'cham chi', 'ráng', 'rang', 'kiên trì', 'kien tri',
    'sẽ cố', 'se co', 'cố hết sức', 'co het suc'
  ];
  return keywords.some(k => clean.includes(k));
}

function isAskingTermDefinition(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase();
  const keywords = [
    'là gì', 'la gi', 'nghĩa là gì', 'nghia la gi', 'chưa hiểu', 'chua hieu',
    'ý thầy là sao', 'y thay la sao', 'ý là sao', 'y la sao', 'chưa rõ thuật ngữ',
    'thế nào là', 'the nao la', 'giải thích giúp', 'giai thich giup'
  ];
  return keywords.some(k => clean.includes(k));
}

function isConfusionOrAnxiety(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const anxietyKeywords = [
    'hoang mang', 'lo lắng', 'lo lang', 'bối rối', 'boi roi', 'sợ', 'so hai',
    'băn khoăn', 'ban khoan', 'lo sợ', 'mơ hồ', 'mo ho', 'rối bời', 'roi boi',
    'áp lực', 'ap luc', 'lo quá', 'lo qua', 'em lo', 'hoang mang quá'
  ];
  return anxietyKeywords.some(k => clean.includes(k));
}

function isUncertaintyOrHelpRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~:;\-_]/g, '');
  const keywords = [
    'chưa biết', 'chua biet', 'không biết', 'khong biet', 'chưa rõ', 'chua ro',
    'chưa nghĩ', 'chua nghi', 'chưa tìm hiểu', 'chua tim hieu', 'chưa có', 'chua co',
    'em chịu', 'chịu thôi', 'thầy giúp', 'thay giup', 'nhờ thầy', 'nho thay',
    'giúp em', 'giup em', 'chỉ em với', 'chi em voi', 'tư vấn giúp', 'tu van giup',
    'chưa tính', 'chua tinh', 'không rõ', 'khong ro', 'bí quá', 'em không rõ',
    'chưa thể', 'chua the', 'giúp với', 'giup voi', 'giúp em với', 'giup em voi',
    'chưa xác định', 'chua xac dinh', 'chưa lường', 'chua luong', 'khó quá', 'kho qua',
    'không biết nguồn', 'khong biet nguon', 'chưa biết nguồn', 'chua biet nguon',
    'tìm ở đâu', 'tim o dau', 'không biết tra', 'khong biet tra'
  ];
  return keywords.some(k => clean.includes(k));
}

function isTooShortOrEvasive(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  if (isGreetingOnly(text)) return false;
  if (isUncertaintyOrHelpRequest(text)) return false;
  if (isConfusionOrAnxiety(text)) return false;
  if (isAskingTermDefinition(text)) return false;
  if (isEmotionalReasoning(text)) return false;
  if (isVagueEffort(text)) return false;

  const evasivePhrases = [
    'thích thì học', 'thich thi hoc', 'thích', 'thich', 'tùy', 'tuy', 'sao cũng được',
    'sao cung duoc', 'ok', 'ừ', 'u', 'uh', 'uhm', 'ko', 'k', 'không', 'khong',
    'bình thường', 'binh thuong', 'không có gì', 'khong co gi',
    'thích thế', 'thich the', 'kệ', 'ke', 'ai biết', 'ai biet',
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
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';

  let hollandCode = anchor.holland_code || '';
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    hollandCode = anchor.holland_codes.join(', ');
  } else if (!hollandCode) {
    hollandCode = 'Nghiên cứu - Kỹ thuật';
  }

  const baseDirective = `BẠN LÀ: "Chuyên gia Phản tư Hành vi Socrates" (Nghiên cứu CBAS - ViSEF Quốc gia 2026).
HỒ SƠ HỌC SINH TỪ BƯỚC 1:
- Ngành mục tiêu: ${targetCareer} (BẮT BUỘC dùng đúng tên ngành "${targetCareer}" trong mọi câu phản hồi, TUYỆT ĐỐI KHÔNG dùng cụm từ "ngành em chọn" hay "ngành đã chọn").
- Cơ sở đào tạo: ${targetUniversity}
- Mức tự tin ban đầu: ${confidenceScore}/10
- Mã RIASEC: ${hollandCode}

NGUYÊN TẮC PHẢN TƯ NÂNG CAO (CHẠM ĐỘ CHÍN HỌC THUẬT):
1. BẮT BUỘC ĐỐI THOẠI TRỰC DIỆN VỚI TỪ KHÓA CỦA HỌC SINH:
   - Nếu học sinh nêu lý do cảm tính ("kiếm nhiều tiền", "nghe nói hot"): Hãy bóc tách ngay sự khác biệt giữa "truyền thông quảng cáo" và "thực tế phân hóa thu nhập".
   - Nếu học sinh dùng từ mơ hồ ("cố gắng", "quyết tâm"): Hãy truy vấn xem sự cố gắng đó cụ thể là hành động gì trong tuần này, tháng này.
   - Nếu học sinh hỏi lại thuật ngữ ("...là gì?", "chưa hiểu"): Dành đúng 1 câu định nghĩa bình dân, dễ hiểu nhất cho học sinh THPT, sau đó mới đặt câu hỏi tiếp.

2. CẤU TRÚC PHẢN HỒI CHUẨN MỰC (TỐI ĐA 120 TỪ):
   - Câu 1: Phản hồi/giải nghĩa trực diện điều học sinh vừa nói (không khen ngợi vu vơ).
   - Câu 2: Đưa ra nghịch lý thực tế giữa kỳ vọng và số liệu thị trường của ngành ${targetCareer}.
   - Câu 3: Đặt DUY NHẤT 1 câu hỏi truy vấn sâu theo đúng lộ trình vòng.

3. LỘ TRÌNH 4 VÒNG CAN THIỆP CHẶT CHẼ:
   - Vòng 1 (Năng lực & Thu nhập thực tế): Truy vấn căn cứ khách quan đối lập với hình ảnh hào nhoáng trên mạng xã hội.
   - Vòng 2 (Thách thức công nghệ & Tự động hóa): Truy vấn về khả năng bị AI thay thế đối với các tác vụ cơ bản của ${targetCareer}.
   - Vòng 3 (Kỹ năng chuyển đổi & Sinh tồn linh hoạt): Giải thích ngắn gọn nếu học sinh chưa hiểu, sau đó truy vấn phương án thích ứng nếu thị trường biến động hoặc chưa có việc làm đúng ngành ngay sau tốt nghiệp.
   - Vòng 4 (Đúc kết & Chuyển giao): Tuyệt đối KHÔNG hỏi thêm. Liệt kê 3 khoảng trống nhận thức học sinh đã bộc lộ và chỉ định sang Bước 3 tra cứu số liệu thực tế.

QUY TẮC BỔ TRỢ:
- Tuyệt đối không khen ngợi sáo rỗng.
- Khi học sinh hoang mang / lo lắng: Đưa 1 câu trấn an duy lý: "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm."
- Khi học sinh nói "chưa biết", "không biết nguồn": Công nhận sự trung thực, hướng dẫn đưa vào danh mục chất vấn Mentor tại Bước 4.`;

  let specificDirective = '';
  if (isAskingTermDefinition(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh đang hỏi lại thuật ngữ hoặc nói chưa hiểu. Dành đúng 1 câu định nghĩa bình dân, dễ hiểu nhất cho học sinh THPT, sau đó mới kết nối với câu hỏi tiếp theo.`;
  }
  if (isEmotionalReasoning(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh vừa nêu lý do cảm tính ("kiếm nhiều tiền", "nghe nói hot"). Bóc tách ngay sự khác biệt giữa truyền thông quảng cáo và thực tế phân hóa thu nhập của ngành "${targetCareer}".`;
  }
  if (isVagueEffort(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh vừa dùng từ mơ hồ ("cố gắng", "quyết tâm"). Truy vấn xem sự cố gắng đó cụ thể là hành động gì trong tuần này, tháng này.`;
  }
  if (isConfusionOrAnxiety(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh đang hoang mang/lo lắng. Phải có 1 câu trấn an duy lý: "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm."`;
  }
  if (isUncertaintyOrHelpRequest(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh nói "chưa biết" hoặc "không biết nguồn". Công nhận sự trung thực, không trách móc, hướng dẫn ghi lại để chất vấn Mentor tại Bước 4.`;
  }

  switch (round) {
    case 1:
      return baseDirective + specificDirective + `\n\n[HIỆN TẠI ĐANG Ở VÒNG 1 - NĂNG LỰC & THU NHẬP THỰC TẾ]:
Học sinh vừa trả lời câu hỏi Vòng 1.
Áp dụng đúng cấu trúc 3 câu (dưới 120 từ):
- Câu 1: Phản hồi trực diện điều học sinh vừa nói về năng lực học tập hoặc lý do chọn ngành.
- Câu 2: Đưa ra nghịch lý thực tế giữa kỳ vọng thu nhập/hào nhoáng truyền thông với độ khó học thuật của ngành "${targetCareer}".
- Câu 3: Đặt 1 câu hỏi truy vấn sâu: "Trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành ${targetCareer}, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?"`;

    case 2:
      return baseDirective + specificDirective + `\n\n[HIỆN TẠI ĐANG Ở VÒNG 2 - THÁCH THỨC CÔNG NGHỆ & TỰ ĐỘNG HÓA]:
Học sinh vừa trả lời về AI và kỹ năng trong ngành "${targetCareer}".
Áp dụng đúng cấu trúc 3 câu (dưới 120 từ):
- Câu 1: Phản hồi trực diện nhận thức của học sinh về công nghệ AI.
- Câu 2: Đưa ra nghịch lý thực tế về việc AI đang cắt giảm các tác vụ cơ bản và vị trí thực tập/nhân sự mới trong ngành "${targetCareer}".
- Câu 3: Đặt 1 câu hỏi truy vấn sâu về Bộ kỹ năng chuyển đổi: "Nếu thị trường lao động ngành ${targetCareer} bước vào chu kỳ biến động hoặc bão hòa khi em tốt nghiệp, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để không bị đào thải?"`;

    case 3:
      return baseDirective + specificDirective + `\n\n[HIỆN TẠI ĐANG Ở VÒNG 3 - KỸ NĂNG CHUYỂN ĐỔI & SINH TỒN LINH HOẠT]:
Học sinh vừa trả lời về kỹ năng thích ứng và phương án việc làm.
Áp dụng đúng cấu trúc 3 câu (dưới 120 từ):
- Câu 1: Phản hồi trực diện mức độ chuẩn bị của học sinh (nếu học sinh hỏi thuật ngữ thì định nghĩa ngắn gọn).
- Câu 2: Đưa ra nghịch lý giữa kế hoạch trên lý thuyết với tính khốc liệt của thị trường việc làm và tuyển sinh.
- Câu 3: Đặt 1 câu hỏi chốt về dữ liệu thực tế: "Em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn 3 năm, học phí, chỉ tiêu) của ${targetCareer} tại ${targetUniversity} chưa, hay vẫn dựa trên cảm nhận cá nhân?"`;

    case 4:
    default:
      return FINAL_CHALLENGE_PROMPT(targetCareer, targetUniversity, confidenceScore);
  }
}

function generateSocraticHeuristicReply(round, anchor = {}, userMsg = '', isFinal = false) {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';

  // VÒNG 4 (ĐÚC KẾT & CHUYỂN GIAO - TUYỆT ĐỐI KHÔNG HỎI THÊM)
  if (isFinal || round >= 4) {
    return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức cốt lõi:\n` +
      `1. **Khoảng trống năng lực & kỳ vọng thu nhập:** Giữa hình ảnh hào nhoáng trên truyền thông với độ khó học thuật và phân hóa thu nhập thực tế của ngành **${targetCareer}**.\n` +
      `2. **Khoảng trống thích ứng công nghệ:** Nguy cơ tự động hóa từ AI đối với các tác vụ cơ bản và sự thiếu hụt Bộ kỹ năng chuyển đổi sinh tồn.\n` +
      `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa đối chiếu số liệu thực tế về điểm chuẩn, học phí và đề án tuyển sinh tại **${targetUniversity}**.\n\n` +
      `Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế nhằm xây dựng cơ sở vững chắc cho quyết định của mình!`;
  }

  // 1. KHI HỌC SINH HỎI LẠI THUẬT NGỮ ("...là gì?", "chưa hiểu")
  if (isAskingTermDefinition(userMsg)) {
    if (round === 2) {
      return `"Tác vụ cơ bản" là các công việc mang tính quy chuẩn lặp lại (như viết mã mẫu, dựng layout hay nhập dữ liệu) mà AI hiện nay xử lý nhanh hơn con người.\n\nThực tế cho thấy làn sóng tự động hóa đang trực tiếp cạnh tranh với nhân sự mới vào nghề trong ngành **${targetCareer}**.\n\nĐâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`;
    } else {
      return `"Kỹ năng chuyển đổi" là những năng lực nền tảng cốt lõi (ngoại ngữ, tư duy số, giải quyết vấn đề và giao tiếp) giúp em linh hoạt thích nghi sang các vị trí khác khi thị trường biến động.\n\nThực tế thị trường ngành **${targetCareer}** sau 4-5 năm tới luôn có chu kỳ đào thải khắc nghiệt đối với nhân sự thiếu khả năng đa nhiệm.\n\nEm đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
    }
  }

  // 2. KHI HỌC SINH NÊU LÝ DO CẢM TÍNH ("kiếm nhiều tiền", "nghe nói hot")
  if (isEmotionalReasoning(userMsg)) {
    if (round === 1) {
      return `Truyền thông thường vẽ ra viễn cảnh ngành **${targetCareer}** có mức thu nhập nghìn đô, nhưng đó chỉ là nhóm 5-10% chuyên gia xuất sắc nhất.\n\nThực tế thị trường cho thấy mức lương phân hóa rất mạnh và đòi hỏi năng lực học thuật khắt khe chứ không dễ dàng như quảng cáo.\n\nNgoài kỳ vọng về thu nhập, điểm số môn học cụ thể nào hoặc sản phẩm thực tế nào khiến em tự tin mình đủ sức trụ lại trong ngành này?`;
    }
  }

  // 3. KHI HỌC SINH DÙNG TỪ MƠ HỒ ("cố gắng", "quyết tâm")
  if (isVagueEffort(userMsg)) {
    if (round === 1) {
      return `Sự quyết tâm chỉ có giá trị thực tế khi được chuyển hóa thành các hành động đo đếm được cụ thể mỗi tuần.\n\nĐộ khó học thuật và áp lực đào thải của ngành **${targetCareer}** tại đại học rất lớn, khiến nhiều sự cố gắng cảm tính dễ bị vỡ mộng.\n\nCụ thể trong tuần này hoặc tháng này, em đã có hành động thực tế nào như tự học giáo trình hay giải bài tập chuyên sâu của ngành **${targetCareer}**?`;
    } else if (round === 2) {
      return `Quyết tâm suông không thể ngăn được làn sóng công nghệ thay thế các thao tác kỹ thuật cơ bản nếu em không có kỹ năng khác biệt.\n\nTrong ngành **${targetCareer}**, AI đang ngày càng hoàn thiện các tác vụ thực thi với tốc độ vượt trội con người.\n\nEm đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để không bị đào thải nếu ngành này bão hòa?`;
    }
  }

  // 4. KHI HỌC SINH BỘC LỘ SỰ BỐI RỐI HOẶC NÓI "EM HOANG MANG", "EM LO LẮNG"
  if (isConfusionOrAnxiety(userMsg)) {
    const reassurance = "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm.";
    if (round === 1) {
      return `${reassurance}\n\nChương trình đại học ngành **${targetCareer}** đòi hỏi độ khó học thuật vượt trội hơn nhiều so với kỳ vọng ban đầu.\n\nTrong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin AI không thể thay thế ở bản thân em?`;
    } else if (round === 2) {
      return `${reassurance}\n\nLàn sóng tự động hóa trong ngành **${targetCareer}** đang tái cấu trúc lại các vị trí việc làm cơ bản.\n\nEm đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành này biến động?`;
    } else {
      return `${reassurance}\n\nMột quyết định nghề nghiệp có trách nhiệm cần điểm tựa số liệu vững chắc thay vì cảm tính.\n\nEm đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
    }
  }

  // 5. KHI HỌC SINH NÓI "CHƯA BIẾT" HOẶC "KHÔNG BIẾT NGUỒN"
  if (isUncertaintyOrHelpRequest(userMsg)) {
    const guidance = "Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống thông tin này; em hãy đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.";
    if (round === 1) {
      return `${guidance}\n\nĐộ khó học thuật và nguy cơ tự động hóa của ngành **${targetCareer}** là thách thức sống còn đối với nhân sự mới.\n\nĐâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`;
    } else if (round === 2) {
      return `${guidance}\n\nThị trường tuyển dụng ngành **${targetCareer}** luôn biến động và đòi hỏi khả năng thích ứng cao.\n\nEm đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành này biến động sau tốt nghiệp?`;
    } else {
      return `${guidance}\n\nĐể hoàn thiện cơ sở dữ liệu cho quyết định của mình, em cần kiểm chứng bằng dữ liệu tuyển sinh chính thức.\n\nEm đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
    }
  }

  if (isGreetingOnly(userMsg)) {
    return `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành **${targetCareer}**?`;
  }

  // 6. PHẢN HỒI THEO TIẾN TRÌNH 4 VÒNG CAN THIỆP CHUẨN MỰC (CẤU TRÚC 3 CÂU)
  switch (round) {
    case 1:
      return `Thầy ghi nhận chia sẻ của em về năng lực phổ thông đối với ngành **${targetCareer}**.\n\nTuy nhiên, độ khó học thuật ở bậc đại học và sự phân hóa thu nhập thực tế khắt khe hơn rất nhiều so với những hình ảnh hào nhoáng trên truyền thông.\n\nBên cạnh đó, trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;

    case 2:
      return `Nhận thức của em về tác động của công nghệ trong ngành **${targetCareer}** là điểm khởi đầu cần thiết.\n\nTuy nhiên, các thao tác kỹ thuật lặp lại sẽ bị AI thay thế rất nhanh, tạo nên áp lực đào thải lớn cho nhân sự mới.\n\nEm đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu thị trường ngành **${targetCareer}** biến động khi em tốt nghiệp?`;

    case 3:
      return `Mức độ chuẩn bị cho thấy em đã bắt đầu quan tâm đến khả năng thích ứng linh hoạt trong tương lai.\n\nDù vậy, một quyết định ở mức tự tin **${confidenceScore}/10** đòi hỏi phải được xây dựng trên dữ liệu xác thực chứ không thể chỉ là dự định cảm tính.\n\nEm đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn 3 năm, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;

    case 4:
    default:
      return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức cốt lõi:\n` +
        `1. **Khoảng trống năng lực & kỳ vọng thu nhập:** Giữa hình ảnh hào nhoáng trên truyền thông với độ khó học thuật và phân hóa thu nhập thực tế của ngành **${targetCareer}**.\n` +
        `2. **Khoảng trống thích ứng công nghệ:** Nguy cơ tự động hóa từ AI đối với các tác vụ cơ bản và sự thiếu hụt Bộ kỹ năng chuyển đổi sinh tồn.\n` +
        `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa đối chiếu số liệu thực tế về điểm chuẩn, học phí và đề án tuyển sinh tại **${targetUniversity}**.\n\n` +
        `Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế nhằm xây dựng cơ sở vững chắc cho quyết định của mình!`;
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
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
    const targetUniversity = (anchor.target_university || anchor.target_school || '').trim() || 'đơn vị đào tạo mục tiêu';

    // QUY TẮC 1: Nếu học sinh chỉ chào hỏi (Ví dụ: "chào thầy", "hello", "dạ")
    // Tuyệt đối KHÔNG tính đây là một vòng phản tư, KHÔNG tăng biến đếm vòng.
    if (isGreetingOnly(trimmedMessage)) {
      const greetingReply = currentRound === 1
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành **${targetCareer}**?`
        : currentRound === 2
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy tập trung trả lời câu hỏi ở trên về nguy cơ tự động hóa bởi AI và kỹ năng chuyên sâu đặc thù không thể thay thế của em trong ngành **${targetCareer}**.`
        : currentRound === 3
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy tập trung trả lời câu hỏi ở trên về Bộ kỹ năng chuyển đổi và kế hoạch việc làm linh hoạt để thích ứng nếu ngành **${targetCareer}** biến động.`
        : `Chào em. Cuộc đối thoại đã hoàn thành. Em hãy chuyển sang Bước 3: Tra cứu dữ liệu khách quan để kiểm chứng thông tin nhé.`;

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
        reply: `Câu trả lời này chưa đủ dữ kiện để phản biện. Em hãy đưa ra dẫn chứng cụ thể hơn về ngành **${targetCareer}**.`,
        round: currentRound,
        isFinal: false,
        advanced: false
      });
    }
    
    let activeSystemInstruction = '';
    if (isFinalRound) {
      activeSystemInstruction = FINAL_CHALLENGE_PROMPT(targetCareer, targetUniversity, confidenceScore);
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
                .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
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
