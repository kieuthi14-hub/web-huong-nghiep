// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// MÔ HÌNH NHẬN THỨC LINH HOẠT & TIẾN TRÌNH 4 VÒNG SƯ PHẠM BẤT BIẾN
// File: server.cjs (CommonJS require version - Chạy lệnh: node server.cjs)
// ==============================================================================

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
const fallbackKey = typeof Buffer !== 'undefined'
  ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
  : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
const genAI = new GoogleGenerativeAI(apiKey);

function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim()
    .replace(/[!.,?~^_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (clean.length === 0 || clean.length > 40) return false;

  const careerKeywords = [
    'thích', 'thich', 'mẹ', 'me', 'bố', 'ba', 'chọn', 'chon', 'vì', 'vi', 'do',
    'đam mê', 'dam me', 'toán', 'toan', 'văn', 'van', 'sư phạm', 'su pham',
    'nghề', 'nghe', 'ngành', 'nganh', 'học', 'hoc', 'truyền đạt', 'đứng lớp', 'bắt chước',
    'định hình', 'tổ hợp', 'môn', 'tiền', 'lương', 'dạy thêm', 'sợ', 'dốt', 'kém', 'đều'
  ];
  if (careerKeywords.some(w => clean.includes(w))) return false;

  const greetingPatterns = [
    /^(chào|chao|xin chào|xin chao|hello|hi|alo)(\s+(thầy|thay|cô|co|bạn|ban|ai|bot))?(\s+ạ|\s+a)?$/i,
    /^(em|dạ|da|con)\s+(chào|chao|xin chào|xin chao)(\s+(thầy|thay|cô|co))?(\s+ạ|\s+a)?$/i,
    /^(dạ|da|vâng|vang|dạ vâng|da vang)(\s+thầy|\s+thay|\s+cô|\s+co)?(\s+ạ|\s+a)?$/i,
    /^(thầy ơi|thay oi|cô ơi|co oi|thầy à|thay a)(\s+ạ|\s+a)?$/i,
    /^(chào|chao|hello|hi|alo)$/i
  ];
  return greetingPatterns.some(p => p.test(clean));
}

function isTechnicalConfusion(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim()
    .replace(/[!.,?~^_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (clean.length === 0 || clean.length > 50) return false;

  const confusionPatterns = [
    /^(là sao|la sao|sao vậy|sao the|sao thế|ý thầy là sao|y thay la sao|sao ạ|sao a)(\s+thầy|\s+thay|\s+cô|\s+co)?$/i,
    /^(em chưa hiểu|em chua hieu|chưa hiểu|chua hieu|không hiểu|khong hieu)(\s+thầy|\s+thay|\s+cô|\s+co|\s+ạ|\s+a)?$/i,
    /^(thầy nói gì|thay noi gi|thầy nói thế là sao|thay noi the la sao)(\s+ạ|\s+a)?$/i,
    /^(thầy hỏi lại là sao|sao thầy lại hỏi lại|sao hỏi lại|hỏi lại là sao)(\s+ạ|\s+a)?$/i
  ];
  return confusionPatterns.some(p => p.test(clean));
}

function isCompleteSentence(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 35) return false;
  const terminalPunctuation = /[.!?…"'\)\]*]$/;
  return terminalPunctuation.test(trimmed);
}

function isCounterArguing(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const counterPatterns = [
    /(đâu|không|chẳng|chưa|làm gì)\s+(có\s+)?nghịch\s*(lý|lí)/i,
    /nghịch\s*(lý|lí)\s+(gì|ở đâu|chỗ nào|đâu)/i,
    /sao\s+(lại\s+)?(bảo|nói|cho là|bảo là)\s+(là\s+)?nghịch\s*(lý|lí)/i,
    /(đâu có|làm gì có|không hề|đâu phải)\s+(nghịch|mâu thuẫn)/i,
    /thầy\s+(nói|bảo|phán)\s+(thế|vậy|vậy là)\s+(không đúng|sai|chưa đúng|kỳ|lạ)/i,
    /(em|mình)\s+đã\s+(nói|bảo|giải thích)\s+(rồi|là)/i,
    /(chưa|không)\s+(biết|rõ|chắc|định hình|chọn)\s+.*?(dạy|môn|tổ hợp)/i,
    /(làm sao|sao|thế nào)\s+.*?(tra cứu|biết|chọn|tìm)/i,
    /chưa\s+(chọn|biết|định hình|rõ)\s+(được\s+)?(môn|sẽ dạy|tổ hợp)/i
  ];
  return counterPatterns.some(p => p.test(clean)) || 
    (clean.includes('nghịch') && (clean.includes('đâu') || clean.includes('không') || clean.includes('gì') || clean.includes('sao') || clean.includes('chưa')));
}

function hasDeclaredSubjectsOrGrades(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();

  // 1. Toán
  if (/(môn\s+)?toán/i.test(clean)) return true;

  // 2. Văn / Ngữ văn
  const cleanWithoutPhanVan = clean.replace(/phân vân|phan van|băn khoăn|ban khoan/g, ' ');
  if (/(ngữ\s*văn|ngu\s*van|môn\s*văn|mon\s*van|học\s*văn|hoc\s*van|văn\s*(và|với|\+|lẫn)|yếu\s*văn|kém\s*văn|giỏi\s*văn|sợ\s*văn)/i.test(cleanWithoutPhanVan)) return true;
  if (/\bvăn\b/i.test(cleanWithoutPhanVan) && (cleanWithoutPhanVan.includes('toán') || cleanWithoutPhanVan.includes('anh') || cleanWithoutPhanVan.includes('điểm') || cleanWithoutPhanVan.includes('môn') || cleanWithoutPhanVan.includes('học'))) return true;

  // 3. Tiếng Anh / Ngoại ngữ
  if (/(tiếng\s*anh|tieng\s*anh|ngoại\s*ngữ|ngoai\s*ngu|anh\s*văn|anh\s*van|\bmôn\s*anh\b|\bhọc\s*anh\b)/i.test(clean)) return true;

  // 4. Vật lý / Lý
  const cleanWithoutLyDo = clean.replace(/lý do|ly do|vô lý|vo ly|nghịch lý|nghich ly|nghịch lí|nghich li|hợp lý|hop ly|quản lý|quan ly|tâm lý|tam ly|xử lý|xu ly/g, ' ');
  if (/(vật\s*lý|vat\s*ly|vật\s*lí|vat\s*li|môn\s*lý|môn\s*lí|\blý\b|\blí\b)/i.test(cleanWithoutLyDo)) return true;

  // 5. Hóa học / Hóa
  const cleanWithoutHoaRa = clean.replace(/hóa ra|hoa ra|chuyển hóa|chuyen hoa|thoái hóa|thoai hoa/g, ' ');
  if (/(hóa\s*học|hoa\s*hoc|môn\s*hóa|mon\s*hoa)/i.test(cleanWithoutHoaRa)) return true;
  if (/\bhóa\b/i.test(cleanWithoutHoaRa) && (cleanWithoutHoaRa.includes('toán') || cleanWithoutHoaRa.includes('lý') || cleanWithoutHoaRa.includes('sinh') || cleanWithoutHoaRa.includes('điểm') || cleanWithoutHoaRa.includes('môn') || cleanWithoutHoaRa.includes('học'))) return true;

  // 6. Sinh học / Sinh
  const cleanWithoutHocSinh = clean.replace(/học sinh|hoc sinh|sinh viên|sinh vien|phát sinh|phat sinh|nảy sinh|nay sinh|hy sinh|hi sinh/g, ' ');
  if (/(sinh\s*học|sinh\s*hoc|môn\s*sinh|mon\s*sinh)/i.test(cleanWithoutHocSinh)) return true;

  // 7. Lịch sử / Sử
  const cleanWithoutSuDung = clean.replace(/sử dụng|su dung|đối xử|doi xu|xử sự|xu su/g, ' ');
  if (/(lịch\s*sử|lich\s*su|môn\s*sử|mon\s*su|\bsử\b|\bsu\b)/i.test(cleanWithoutSuDung)) return true;

  // 8. Địa lý / Địa
  const cleanWithoutDiaDiem = clean.replace(/địa điểm|dia diem|địa phương|dia phuong|địa bàn|dia ban|địa chỉ|dia chi/g, ' ');
  if (/(địa\s*lý|dia\s*ly|địa\s*lí|dia\s*li|môn\s*địa|mon\s*dia|\bđịa\b|\bdia\b)/i.test(cleanWithoutDiaDiem)) return true;

  // 9. Tin học / GDCD / GDQP / KTPL / Công nghệ / KHTN / KHXH
  if (/(tin\s*học|tin\s*hoc|gdcd|gdqp|ktpl|quốc\s*phòng|kinh\s*tế\s*pháp\s*luật|công\s*nghệ|khtn|khxh|giáo\s*dục\s*công\s*dân)/i.test(clean)) return true;

  // 10. Tổ hợp / Khối xét tuyển
  if (/(tổ\s*hợp\s*([a-d]\d{2}|[a-d]|khtn|khxh|môn)|khối\s*([a-d]\d{2}|[a-d]|tự\s*nhiên|xã\s*hội)|\b[a-d]\d{2}\b)/i.test(clean)) return true;

  // 11. Từ khóa kết hợp năng lực môn học
  if (/(học\s*tốt|hoc\s*tot|đuối|duoi|học\s*khá|hoc\s*kha|môn\s*mạnh|môn\s*yếu|sở\s*trường|thế\s*mạnh|môn\s*sở\s*trường|môn\s*thế\s*mạnh)/i.test(clean)) return true;

  // 12. Tuyên bố học lực rõ ràng
  const hasExplicitGradeDeclaration = [
    'học đều', 'hoc deu', 'đều đều', 'deu deu', 'học tàn tàn', 'tàn tàn', 'tan tan',
    'các môn như nhau', 'môn nào cũng như nhau', 'môn nào cũng vậy', 'môn nào cũng thế',
    'mất gốc', 'mat goc', 'đuối tất cả', 'kém tất cả', 'yếu tất cả'
  ].some(k => clean.includes(k));

  return hasExplicitGradeDeclaration;
}

function extractSubjectsFeedback(text) {
  const clean = text.toLowerCase();
  
  const subjects = [
    { name: 'Giáo dục Kinh tế và Pháp luật (KTPL)', patterns: ['ktpl', 'kinh tế pháp luật', 'kinh tế và pháp luật'] },
    { name: 'Giáo dục Công dân (GDCD)', patterns: ['gdcd', 'công dân'] },
    { name: 'Toán học', patterns: ['toán', 'toan'] },
    { name: 'Ngữ văn', patterns: ['ngữ văn', 'ngu van', 'văn', 'van'] },
    { name: 'Tiếng Anh', patterns: ['tiếng anh', 'tieng anh', 'ngoại ngữ', 'anh'] },
    { name: 'Lịch sử', patterns: ['lịch sử', 'lich su', 'sử', 'su'] },
    { name: 'Địa lý', patterns: ['địa lý', 'địa lí', 'dia ly', 'địa', 'dia'] },
    { name: 'Vật lý', patterns: ['vật lý', 'vật lí', 'vat ly', 'lý', 'lí'] },
    { name: 'Hóa học', patterns: ['hóa học', 'hoa hoc', 'hóa', 'hoa'] },
    { name: 'Sinh học', patterns: ['sinh học', 'sinh hoc', 'sinh'] },
    { name: 'Tin học', patterns: ['tin học', 'tin hoc', 'tin'] }
  ];

  let strongSubject = '';
  let weakSubject = '';

  for (const sub of subjects) {
    for (const p of sub.patterns) {
      const strongReg = new RegExp('(học tốt|giỏi|khá|thế mạnh|sở trường|mạnh|thích|ổn)\\s*(môn\\s*)?' + p + '|' + p + '\\s*(thì\\s*)?(em\\s*)?(học\\s*)?(giỏi|tốt|khá|cao|ổn|được 8|được 9|8|9)', 'i');
      const weakReg = new RegExp('(hơi đuối|đuối|yếu|kém|dốt|sợ|thấp|lo)\\s*(môn\\s*)?' + p + '|' + p + '\\s*(thì\\s*)?(em\\s*)?(học\\s*|hơi\\s*)?(hơi đuối|đuối|yếu|kém|dốt|sợ|thấp|được 5|được 6|5|6)', 'i');

      if (!strongSubject && strongReg.test(clean)) {
        strongSubject = sub.name;
      }
      if (!weakSubject && weakReg.test(clean)) {
        weakSubject = sub.name;
      }
    }
  }

  return { strongSubject, weakSubject };
}

app.post('/api/socrates-chat', async (req, res) => {
  try {
    const { chatHistory, userMessage } = req.body || {};

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    // 1. Kiểm tra an toàn: Lịch sử trò chuyện phải là một mảng
    const validHistory = Array.isArray(chatHistory) ? chatHistory : (Array.isArray(req.body?.history) ? req.body.history : []);

    const trimmedMsg = userMessage.trim();
    const lowerTrimmed = trimmedMsg.toLowerCase();

    // 2. PHẢN XẠ NHANH: Nếu học sinh chỉ chào hỏi xã giao (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em, thầy trò mình cùng bắt đầu nhé! Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại.`;
      return res.status(200).json({
        success: true,
        round: req.body?.round && Number(req.body.round) > 0 ? Number(req.body.round) : 1,
        response: greetingReply,
        reply: greetingReply,
        isCompleted: false
      });
    }

    // 2b. PHẢN XẠ NHANH: Nếu học sinh thắc mắc kỹ thuật / chưa hiểu câu hỏi (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isTechnicalConfusion(trimmedMsg)) {
      const clarifyReply = `Thầy hỏi để giúp em tự soi chiếu động lực và năng lực thực tế của mình trước khi ra quyết định quan trọng. Em hãy chia sẻ rõ hơn suy nghĩ của mình về câu hỏi của thầy ở trên nhé!`;
      return res.status(200).json({
        success: true,
        round: req.body?.round && Number(req.body.round) > 0 ? Number(req.body.round) : 1,
        response: clarifyReply,
        reply: clarifyReply,
        isCompleted: false
      });
    }

    // 3. Quản lý Tiến trình Hội thoại theo Trạng thái (FINITE STATE MACHINE - VISEF 2026)
    // STAGE 1: Động cơ chọn ngành (Nội sinh vs Ngoại sinh)
    // STAGE 2: Thách thức áp lực nghề & Xu hướng chuyển đổi số tương lai (và hỏi về tổ hợp môn)
    // STAGE 3: Đối chất Tổ hợp môn & Học lực thực tế (Kỹ thuật 3 Nhịp: hỏi môn sở trường vs môn yếu)
    // STAGE 4: Tái cấu trúc mục tiêu theo Mô hình Hạ bậc mềm (Soft Laddering) & Chốt lệnh chuyển Bước 3 (Hoàn thành)
    
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text) && !isTechnicalConfusion(m.text));

    let incomingStage = 1;
    if (req.body?.chatStage && Number(req.body.chatStage) >= 1) {
      incomingStage = Number(req.body.chatStage);
    } else if (req.body?.stage && Number(req.body.stage) >= 1) {
      incomingStage = Number(req.body.stage);
    } else if (req.body?.round && Number(req.body.round) >= 1) {
      incomingStage = Number(req.body.round);
    } else {
      incomingStage = Math.min(substantiveUserMsgs.length + 1, 3);
    }

    // Kiểm tra xem học sinh đã khai báo môn học hoặc học lực cụ thể chưa:
    const studentIsCounterArguing = isCounterArguing(trimmedMsg);
    const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);
    const hasExplicitSubjectFeedback = Boolean(strongSubject || weakSubject);
    const studentHasDeclaredSubjects = (hasExplicitSubjectFeedback || hasDeclaredSubjectsOrGrades(trimmedMsg)) && (!studentIsCounterArguing || hasExplicitSubjectFeedback);

    // Xác định giai đoạn mục tiêu và kiểm soát cờ hiệu isCompleted:
    let targetNextStage = incomingStage + 1;
    let isCompleted = false;

    if (incomingStage === 1) {
      targetNextStage = 2;
      isCompleted = false;
    } else if (incomingStage === 2) {
      targetNextStage = 3;
      isCompleted = false; // BẮT BUỘC: Khung chat phải giữ mở để học sinh trả lời ở Stage 3!
    } else if (incomingStage >= 3) {
      if (!studentHasDeclaredSubjects) {
        // Học sinh phản biện lại hoặc chưa nêu môn cụ thể: GIỮ NGUYÊN GIAI ĐOẠN 3, CHƯA ĐƯỢC KẾT THÚC!
        targetNextStage = 3;
        isCompleted = false;
      } else {
        // Học sinh ĐÃ nêu rõ môn học: CHÍNH THỨC SANG GIAI ĐOẠN 4 VÀ HOÀN TẤT!
        targetNextStage = 4;
        isCompleted = true;
      }
    }

    // Xác định giai đoạn kích hoạt cho System Prompt:
    // Khi học sinh đã khai báo môn ở Stage 3 hoặc đang ở Stage 4, AI BẮT BUỘC thực hiện phản hồi Giai đoạn 4!
    const promptStage = (incomingStage >= 4 || (incomingStage >= 3 && studentHasDeclaredSubjects)) ? 4 : incomingStage;

    const studentProfile = req.body?.studentProfile || req.body?.userProfile || req.body?.anchor || {};
    const targetCareer = studentProfile?.targetMajor || studentProfile?.targetCareer || studentProfile?.target_career || "Sư phạm";
    const targetSchool = studentProfile?.targetSchool || studentProfile?.targetUniversity || studentProfile?.target_university || "ĐH Quy Nhơn";
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || "AEI";
    const reason = studentProfile?.reason || studentProfile?.careerReason || "Em thích từ nhỏ và cảm thấy phù hợp";
    const initialConfidence = studentProfile?.initialConfidence || studentProfile?.confidenceT0 || studentProfile?.confidence_score || studentProfile?.confidence || 5;
    const expectedIncome = studentProfile?.expectedIncome || studentProfile?.targetIncome || "10 - 15 triệu/tháng";

    // 4. Trích xuất các câu phát ngôn gần nhất của Thầy để đưa vào rào cản chống lặp tuyệt đối
    const pastModelUtterances = validHistory
      .filter(m => m.role === 'model' && m.text)
      .slice(-3)
      .map((m, i) => `Lượt trước ${i + 1}: "${m.text.slice(0, 120)}..."`)
      .join('\n');

    // 5. Xây dựng System Instruction theo "MÔ HÌNH NHẬN THỨC LINH HOẠT" (COGNITIVE AGENT ARCHITECTURE)
    const systemPrompt = `
BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang trò chuyện 1-1 với một học sinh THPT đang đứng trước ngưỡng cửa chọn ngành nghề tương lai.

[HỒ SƠ HỌC SINH TẠI BƯỚC 1]:
- Ngành mong muốn: ${targetCareer}
- Trường mục tiêu: ${targetSchool}
- Thiên hướng Holland (RIASEC): ${hollandCode}
- Mức tự tin ban đầu (T0): ${initialConfidence}/10
- Lý do chọn ngành (Bước 1): "${reason}"
- Kỳ vọng thu nhập khởi điểm: "${expectedIncome}"
- Trạng thái phản tư hiện tại: GIAI ĐOẠN ${promptStage} / 4

[BẢN CHẤT CỐT LÕI - KHÔNG PHẢI BOT KỊCH BẢN CỨNG NHẮC]:
Bạn KHÔNG PHẢI là một kịch bản bot lặp khuôn hay mẫu câu máy móc. Bạn sở hữu trí tuệ cảm xúc (EQ) cao, khả năng lắng nghe sâu, sự ấm áp của người thầy và nghệ thuật dẫn dắt Socrates giúp học sinh tự nhận thức.

[CƠ CHẾ SUY NGHĨ NỘI TÂM TRƯỚC KHI TRẢ LỜI - BẮT BUỘC]:
Với mỗi tin nhắn của học sinh, hãy tự đặt câu hỏi trong tiềm thức:
1. "Học sinh này đang bộc lộ trạng thái tâm lý gì?" (Ví dụ: Thực dụng vì tiền/thu nhập; Tự ti, hoang mang về học lực; Bị phụ huynh áp đặt/ngoại sinh; Bốc đồng theo trào lưu; hay Tự tin có căn cứ?).
2. "Làm sao để công nhận cảm xúc của em ấy một cách chân thành nhất mà không phán xét?"
3. "Làm sao để dùng chính câu nói bất ngờ đó làm bàn đạp dẫn dắt em ấy về hiện thực nghề nghiệp?"

[QUY TẮC ĐIỀU PHỐI THEO TRẠNG THÁI (FINITE STATE MACHINE - BẮT BUỘC)]:
Hệ thống ĐANG Ở GIAI ĐOẠN ${promptStage} / 4. Bạn PHẢI tuân thủ nghiêm ngặt quy tắc chuyển trạng thái:

* NẾU ĐANG Ở GIAI ĐOẠN 1 (Động cơ chọn ngành & Đối chiếu Nội sinh vs Ngoại sinh):
  Học sinh vừa phản hồi về câu hỏi mở đầu (về động cơ chọn ngành và lý do: "${reason}").
  - Hãy thấu cảm / ghi nhận động cơ của học sinh (đặc biệt nếu bị phụ huynh định hướng, đam mê thật sự, hay theo trào lưu/tiền bạc).
  - Sau đó CHỦ ĐỘNG DẪN DẮT SANG GIAI ĐOẠN 2: Đối chất trực tiếp với con số kỳ vọng thu nhập [${expectedIncome}] học sinh đã chọn ở Bước 1 trong bối cảnh AI và tự động hóa 5-10 năm tới.
  - KẾT THÚC BẰNG ĐÚNG CÂU HỎI PHẢN TƯ GIAI ĐOẠN 2:
    "Em kỳ vọng mức thu nhập sau khi ra trường là ${expectedIncome}. Trong bối cảnh 5-10 năm tới khi AI và công nghệ tự động hóa làm thay đổi thị trường việc làm, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?"
  - TUYỆT ĐỐI KHÔNG kết thúc phiên chat tại đây!

* NẾU ĐANG Ở GIAI ĐOẠN 2 (Thách thức áp lực nghề, xu hướng AI & Kiểm chứng kỳ vọng thu nhập):
  Học sinh vừa trả lời về áp lực nghề, xu hướng AI và năng lực cạnh tranh cho mức thu nhập ${expectedIncome}.
  - Hãy ghi nhận góc nhìn của học sinh về năng lực và thách thức thị trường.
  - Sau đó CHỦ ĐỘNG DẪN DẮT SANG GIAI ĐOẠN 3: Đưa ra nghịch lý tuyển sinh - dù kỳ vọng thế nào thì chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh vào ${targetCareer} tại ${targetSchool}.
  - KẾT THÚC BẰNG CÂU HỎI ĐỐI CHẤT TỔ HỢP & HỌC LỰC THỰC TẾ:
    "Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${targetCareer} tại ${targetSchool}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?"
  - TUYỆT ĐỐI KHÔNG kết thúc phiên chat tại đây! Khung chat bắt buộc phải giữ mở để học sinh trả lời ở Giai đoạn 3!

* NẾU ĐANG Ở GIAI ĐOẠN 3 (Đối chất Tổ hợp môn & Học lực thực tế - Chưa nêu môn hoặc đang phản biện):
  Học sinh CHƯA NÊU RÕ CẶP MÔN THẾ MẠNH / MÔN YẾU, hoặc đang phản biện lại Thầy (Ví dụ: "đâu có nghịch lý gì thầy ơi", "em thấy bình thường", hoặc giải thích lý do):
  - [CẤM TUYỆT ĐỐI]: AI TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý phán đoán học sinh "học lực đều đều", KHÔNG ĐƯỢC khuyên học Cao đẳng, và TUYỆT ĐỐI KHÔNG ĐƯỢC kết thúc phiên chat tại đây!
  - [NHIỆM VỤ 3 BƯỚC BẮT BUỘC]:
    (1) Bước a: Công nhận tư duy phản biện thẳng thắn và góc nhìn thực tế của học sinh.
    (2) Bước b: Chỉ ra rằng mọi tính toán về nhu cầu thị trường hay lựa chọn môn dạy đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại ${targetSchool} (thường từ 24 - 27 điểm).
    (3) Bước c: BẮT BUỘC kết thúc bằng câu hỏi dứt khoát: "Để giúp em tìm ra điểm tựa thực tế nhất: Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?"

* NẾU ĐANG Ở GIAI ĐOẠN 4 (TỔNG KẾT THEO MÔ HÌNH HẠ BẬC MỀM - SOFT LADDERING - KẾT THÚC BƯỚC 2):
  Học sinh đã chia sẻ về môn học sở trường và môn yếu / học lực thực tế: "${trimmedMsg}".
  Nhiệm vụ của Thầy:
  1. Ghi nhận và khen ngợi môn thế mạnh của học sinh, đồng thời chỉ ra rủi ro điểm chuẩn thực tế nếu môn còn yếu/đuối kéo tụt tổng điểm của cả tổ hợp 3 môn khi xét tuyển vào ${targetCareer} tại ${targetSchool} (ngưỡng điểm chuẩn thường từ 24 - 27 điểm).
  2. Đưa ra MÔ HÌNH HẠ BẬC MỀM (SOFT LADDERING) với 3 tầng nấc thích ứng toàn diện (TUYỆT ĐỐI KHÔNG VỘI VÀNG HẠ NGAY XUỐNG CAO ĐẲNG):
     - Tầng 1 (Nguyện vọng 1): Kế hoạch bứt phá điểm số quyết tâm thi Nguyện vọng 1 trường mục tiêu (${targetSchool}).
     - Tầng 2 (Nguyện vọng 2): Nghiên cứu các trường Đại học dự phòng (Nguyện vọng 2) có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (ví dụ ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).
     - Tầng 3 (Lưới an toàn): Phương án dự phòng cuối cùng với hệ Cao đẳng thực hành / đào tạo nghề chất lượng cao để đảm bảo luôn có tay nghề vững chắc.
  3. CÂU CHỈ DẪN ĐIỀU HƯỚNG CHỐT HẠ BẮT BUỘC:
     "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!"
  - [CẢNH BÁO TỐI CAO]: TUYỆT ĐỐI KHÔNG ĐƯỢC ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO Ở CUỐI GIAI ĐOẠN 4!

[RÀO CẢN CHỐNG LẶP LẠI TUYỆT ĐỐI]:
${pastModelUtterances ? `Dưới đây là các câu trả lời gần nhất của bạn:\n${pastModelUtterances}\nBẠN TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại các cấu trúc câu, từ ngữ chào đón hoặc câu hỏi đã xuất hiện ở trên!` : ''}

[ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]:
- Mỗi phản hồi chỉ từ 2 đến 4 câu ngắn gọn, súc tích, văn phong sư phạm ổn định, điềm tĩnh, ấm áp.
- Kết thúc bằng ĐÚNG 01 câu hỏi phản tư duy nhất (ở Giai đoạn 1, 2, 3), HOẶC kết thúc bằng lời chỉ dẫn điều hướng chuyển bước (ở Giai đoạn 4: "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!").
- Ở Giai đoạn 4: TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi phản tư. BẮT BUỘC kết thúc bằng đúng câu chỉ dẫn điều hướng chuyển sang Bước 3.
- Phải kết thúc bằng dấu chấm câu hoàn chỉnh (. ! ?), tuyệt đối không ngắt quãng lửng lơ.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề, ghi chú hay phân tích kỹ thuật.
- TUYỆT ĐỐI KHÔNG xuất các khối ghi chú suy nghĩ trong dấu ngoặc đơn hoặc dấu sao như *(...)* hay [Suy nghĩ:...]. Bắt đầu ngay bằng lời thoại của Thầy Socrates.
`;

    // 6. Chuẩn bị nội dung gửi lên Gemini API (đảm bảo tin nhắn đầu tiên phải có role là 'user')
    let contents = validHistory
      .filter(msg => msg && msg.text && typeof msg.text === 'string')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: trimmedMsg }]
    });

    let replyText = null;

    // 7. Cấu hình mô hình hoạt động ổn định với Token và Tham số chuẩn ViSEF 2026
    const candidateModelNames = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];

    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.35,
            topP: 0.85,
            maxOutputTokens: 1000
          }
        });

        // Bảo hiểm timeout 6 giây mỗi model để không bao giờ bị nghẽn
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model generation timeout')), 6000)
        );

        const result = await Promise.race([
          model.generateContent({ contents }),
          timeoutPromise
        ]);

        let resText = result?.response?.text();
        if (resText) {
          let cleaned = resText.trim()
            .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
            .replace(/^<thought>[\s\S]*?<\/thought>\s*/gi, '')
            .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ|SUY NGHĨ|THOUGHT).*?\]\s*/gi, '')
            .replace(/^\*\(?[\s\S]*?\)?\*\s*/g, '')
            .replace(/^\[[\s\S]*?\]\s*/g, '')
            .replace(/^\([\s\S]*?\)\s*/g, '')
            .replace(/^#+.*?\n/gi, '')
            .trim();

          // Kiểm tra xem phản hồi có hoàn chỉnh và kết thúc bằng dấu chấm câu không
          if (isCompleteSentence(cleaned)) {
            // RÀO CẢN BẢO VỆ GIAI ĐOẠN 4: Lọc sạch câu hỏi ở cuối và đảm bảo câu kết chuyển sang Bước 3
            if (targetNextStage === 4 || isCompleted || promptStage === 4) {
              cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
              cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
              cleaned = cleaned.trim();

              const step3Directive = "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!";
              if (!cleaned.includes("Bước 3") && !cleaned.includes("bước 3")) {
                cleaned = cleaned + "\n\n" + step3Directive;
              }
            }
            replyText = cleaned;
            break;
          }
        }
      } catch (err) {
        // Thử model tiếp theo trong danh sách candidate
      }
    }

    // 8. Heuristic Fallback Nhận thức (Chỉ kích hoạt nếu toàn bộ API Gemini gặp sự cố hoặc trả về đứt gãy)
    if (!replyText || !isCompleteSentence(replyText)) {
      replyText = generateCognitiveFallback({
        incomingStage: promptStage,
        targetCareer,
        targetSchool,
        hollandCode,
        reason,
        initialConfidence,
        expectedIncome,
        trimmedMsg,
        lowerTrimmed,
        studentHasDeclaredSubjects,
        studentIsCounterArguing
      });
    }

    return res.status(200).json({
      success: true,
      chatStage: targetNextStage,
      stage: targetNextStage,
      round: targetNextStage,
      response: replyText,
      reply: replyText,
      isCompleted: isCompleted
    });

  } catch (error) {
    console.error("Lỗi Socrates Chat Backend:", error);
    return res.status(500).json({ success: false, message: "Lỗi xử lý máy chủ!" });
  }
});

// Hỗ trợ cả endpoint /api/chat để tương thích ngược 100%
app.post('/api/chat', (req, res) => {
  req.url = '/api/socrates-chat';
  app.handle(req, res);
});

// Hàm Fallback Nhận thức Linh hoạt (Dự phòng khẩn cấp chuẩn ViSEF 2026 - 100% Trọn vẹn)
function generateCognitiveFallback({ incomingStage, targetCareer, targetSchool, hollandCode, reason, initialConfidence, expectedIncome, trimmedMsg, lowerTrimmed, studentHasDeclaredSubjects, studentIsCounterArguing }) {
  // 1. Phản xạ tâm lý bất ngờ: Tự ti / hoang mang
  const isInsecure = [
    'dốt', 'kém', 'sợ trượt', 'không biết làm được', 'không biết có làm được', 'lo lắng', 'hoang mang', 'tự ti', 'áp lực', 'sợ không đỗ'
  ].some(k => lowerTrimmed.includes(k));
  if (isInsecure && incomingStage === 1) {
    return `Sự lo lắng và cảm giác hoài nghi bản thân là trạng thái tâm lý rất thật và đáng được tôn trọng khi em đứng trước cánh cửa tương lai quan trọng.\n\nNhìn lại chính mình lúc này, điều gì đang làm em cảm thấy áp lực nhất: khối lượng kiến thức chuyên môn, điểm số thi tuyển, hay áp lực từ sự kỳ vọng của người khác?`;
  }

  // 2. GIAI ĐOẠN 1: Động cơ chọn ngành -> Chuyển sang Giai đoạn 2 (Áp lực nghề & Kiểm chứng kỳ vọng thu nhập)
  if (incomingStage === 1) {
    const isFamily = [
      'mẹ định hướng', 'mẹ em định hướng', 'bố định hướng', 'bố em định hướng', 'ba định hướng', 'ba em định hướng',
      'bố mẹ', 'ba mẹ', 'cha mẹ', 'gia đình muốn', 'bố mẹ chọn', 'ba mẹ chọn', 'bố mẹ bắt', 'ba mẹ bắt'
    ].some(k => lowerTrimmed.includes(k)) || /(mẹ|bố|ba|gia đình)\s+(em\s+)?(định hướng|chọn|bắt|muốn|khuyên|bảo)/i.test(lowerTrimmed);

    const motivationAck = isFamily
      ? `Gia đình luôn mong muốn điều an toàn và ổn định cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em.`
      : `Thầy ghi nhận chia sẻ chân thành của em về động cơ hướng tới ngành **${targetCareer}**.`;

    return `${motivationAck}\n\nEm kỳ vọng mức thu nhập sau khi ra trường là **${expectedIncome}**. Trong bối cảnh 5-10 năm tới khi AI và công nghệ tự động hóa làm thay đổi thị trường việc làm, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?`;
  }

  // 3. GIAI ĐOẠN 2: Kiểm chứng kỳ vọng thu nhập -> Chuyển sang Giai đoạn 3 (Đối chất Tổ hợp & Điểm gãy T1)
  if (incomingStage === 2) {
    return `Thầy rất ủng hộ tinh thần cầu tiến và nhận thức thực tế của em về thị trường lao động.\n\nTuy nhiên, dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?`;
  }

  // 4. GIAI ĐOẠN 3 / 4: Đối chất Học lực thực tế & Mô hình Hạ bậc mềm (Soft Laddering)
  const isCounter = studentIsCounterArguing || isCounterArguing(trimmedMsg);
  const hasDeclared = studentHasDeclaredSubjects !== undefined ? studentHasDeclaredSubjects : hasDeclaredSubjectsOrGrades(trimmedMsg);

  // Nếu học sinh phản biện hoặc CHƯA khai báo môn học cụ thể:
  // Giữ nguyên Stage 3, yêu cầu nêu rõ môn mạnh/yếu đối chiếu với 24-27 điểm
  if (!hasDeclared || (isCounter && !hasDeclared)) {
    return `Thầy rất ghi nhận tinh thần phản biện thẳng thắn và góc nhìn thực tế của em. Đúng là khi chưa xác định cụ thể thì không nên vội vã đưa ra kết luận cảm tính.\n\nTuy nhiên, mọi tính toán về nhu cầu thị trường hay lựa chọn môn học đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại **${targetSchool}** (thường từ 24 đến 27 điểm).\n\nĐể giúp em tìm ra điểm tựa thực tế nhất: Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?`;
  }

  // GIAI ĐOẠN 4: HỌC SINH ĐÃ NÊU MÔN HỌC HOẶC HỌC LỰC -> MÔ HÌNH HẠ BẬC MỀM (SOFT LADDERING)
  const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);

  const hasMath = lowerTrimmed.includes('toán') || lowerTrimmed.includes('toan');
  const hasLit = lowerTrimmed.includes('văn') || lowerTrimmed.includes('van');
  const isWeakBoth = (hasMath && hasLit && (lowerTrimmed.includes('yếu') || lowerTrimmed.includes('kém') || lowerTrimmed.includes('sợ'))) ||
    /(yếu|kém|đuối|sợ|thấp)[^,.;!?\n]*(văn\s*(và|với|\+)\s*toán|toán\s*(và|với|\+)\s*văn)/i.test(lowerTrimmed);

  if (isWeakBoth) {
    return `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\n` +
      `Khi đối diện với ngưỡng điểm chuẩn rất cao của ngành **${targetCareer}** tại **${targetSchool}** (thường từ 24 - 27 điểm), việc có khoảng cách ở cả Toán và Văn là một rủi ro lớn kéo tụt tổng điểm tổ hợp xét tuyển. Tuy nhiên, thay vì vội vàng từ bỏ, Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
      `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá, nỗ lực tối đa cải thiện hai môn Toán - Văn và tận dụng các môn sở trường còn lại để quyết tâm thi đỗ ${targetSchool}.\n` +
      `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
      `• **Tầng 3 (Lưới an toàn)**: Chuẩn bị phương án dự phòng cuối cùng như hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao để đảm bảo luôn có tay nghề vững chắc.\n\n` +
      `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
  }

  if (strongSubject && weakSubject) {
    return `Thầy khen ngợi sự thẳng thắn và trung thực rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\n` +
      `Có thế mạnh ở môn **${strongSubject}** là điểm tựa rất tốt. Tuy nhiên, nếu môn **${weakSubject}** còn đuối sức, rủi ro lớn nhất là điểm môn này sẽ kéo tụt tổng điểm tổ hợp 3 môn khi xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}** (vốn có ngưỡng điểm chuẩn cạnh tranh từ 24 - 27 điểm).\n\n` +
      `Để chủ động làm chủ tương lai và không rơi vào thế bị động, Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
      `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá điểm số, tập trung khắc phục môn ${weakSubject} và phát huy tối đa môn ${strongSubject}, quyết tâm thi đỗ ${targetSchool}.\n` +
      `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
      `• **Tầng 3 (Lưới an toàn)**: Chuẩn bị phương án dự phòng cuối cùng như hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao để luôn có tay nghề vững chắc.\n\n` +
      `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
  }

  if (strongSubject && !weakSubject) {
    return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ môn sở trường. Có thế mạnh ở môn **${strongSubject}** là một lợi thế điểm số rất tốt.\n\n` +
      `Tuy nhiên, để xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}** với ngưỡng điểm chuẩn cạnh tranh (24 - 27 điểm), em cần đảm bảo cả 3 môn trong tổ hợp không môn nào bị đuối điểm. Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
      `• **Tầng 1 (Nguyện vọng 1)**: Kế hoạch bứt phá điểm số toàn diện cả tổ hợp, phát huy môn ${strongSubject} để quyết tâm thi vào ${targetSchool}.\n` +
      `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
      `• **Tầng 3 (Lưới an toàn)**: Chuẩn bị phương án dự phòng cuối cùng như hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao.\n\n` +
      `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
  }

  if (weakSubject && !strongSubject) {
    return `Thầy khen ngợi sự trung thực và thẳng thắn của em khi dũng cảm nhìn nhận khó khăn trong học tập.\n\n` +
      `Khi môn **${weakSubject}** còn đuối sức, rủi ro lớn nhất là điểm môn này sẽ kéo tụt tổng điểm xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}** (thường từ 24 - 27 điểm). Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
      `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá, dồn sức cải thiện môn ${weakSubject} và tối ưu các môn còn lại để quyết tâm thi vào ${targetSchool}.\n` +
      `• **Tầng 2 (Nguyện vọng 2)**: Tìm hiểu các trường Đại học dự phòng có cùng ngành với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
      `• **Tầng 3 (Lưới an toàn)**: Lưới an toàn phương án dự phòng cuối cùng với hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao để sớm có việc làm.\n\n` +
      `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
  }

  return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 giai đoạn phản tư.\n\n` +
    `Trước ngưỡng điểm chuẩn cạnh tranh (thường từ 24 - 27 điểm) của ngành **${targetCareer}** tại **${targetSchool}**, Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
    `• **Tầng 1 (Nguyện vọng 1)**: Kế hoạch bứt phá điểm số tổ hợp môn thế mạnh, quyết tâm thi vào ${targetSchool}.\n` +
    `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
    `• **Tầng 3 (Lưới an toàn)**: Lưới an toàn phương án dự phòng cuối cùng với hệ Cao đẳng thực hành / đào tạo nghề chất lượng cao để sớm có tay nghề vững chắc.\n\n` +
    `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[VISEF 2026] Server AI Socrates (CommonJS) đang vận hành tại cổng ${PORT}`);
});
