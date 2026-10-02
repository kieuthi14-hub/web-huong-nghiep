// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// MÔ HÌNH NHẬN THỨC LINH HOẠT & TIẾN TRÌNH 4 VÒNG SƯ PHẠM BẤT BIẾN
// File: server.js (ESM Module - Chạy lệnh: node server.js)
// ==============================================================================

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    /chưa\s+(chọn|biết|định hình)\s+(được\s+)?(môn|sẽ dạy)/i
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
  if (/(tin\s*học|tin\s*hoc|gdcd|gdqp|ktpl|quốc\s*phòng|kinh\s*tế\s*pháp\s*luật|công\s*nghệ|khtn|khxh)/i.test(clean)) return true;

  // 10. Tuyên bố học lực rõ ràng
  const hasExplicitGradeDeclaration = [
    'học đều', 'hoc deu', 'đều đều', 'deu deu', 'học tàn tàn', 'tàn tàn', 'tan tan',
    'các môn như nhau', 'môn nào cũng như nhau', 'môn nào cũng vậy', 'môn nào cũng thế',
    'mất gốc', 'mat goc', 'đuối tất cả', 'kém tất cả', 'yếu tất cả'
  ].some(k => clean.includes(k));

  return hasExplicitGradeDeclaration;
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
    // STAGE 4: Tái cấu trúc mục tiêu theo Mô hình Thích ứng Kép & Chốt lệnh chuyển Bước 3 (Hoàn thành)
    
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
    const studentHasDeclaredSubjects = hasDeclaredSubjectsOrGrades(trimmedMsg);
    const studentIsCounterArguing = isCounterArguing(trimmedMsg);

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
- Trạng thái phản tư hiện tại: GIAI ĐOẠN ${incomingStage} / 4

[BẢN CHẤT CỐT LÕI - KHÔNG PHẢI BOT KỊCH BẢN CỨNG NHẮC]:
Bạn KHÔNG PHẢI là một kịch bản bot lặp khuôn hay mẫu câu máy móc. Bạn sở hữu trí tuệ cảm xúc (EQ) cao, khả năng lắng nghe sâu, sự ấm áp của người thầy và nghệ thuật dẫn dắt Socrates giúp học sinh tự nhận thức.

[CƠ CHẾ SUY NGHĨ NỘI TÂM TRƯỚC KHI TRẢ LỜI - BẮT BUỘC]:
Với mỗi tin nhắn của học sinh, hãy tự đặt câu hỏi trong tiềm thức:
1. "Học sinh này đang bộc lộ trạng thái tâm lý gì?" (Ví dụ: Thực dụng vì tiền/thu nhập; Tự ti, hoang mang về học lực; Bị phụ huynh áp đặt/ngoại sinh; Bốc đồng theo trào lưu; hay Tự tin có căn cứ?).
2. "Làm sao để công nhận cảm xúc của em ấy một cách chân thành nhất mà không phán xét?"
3. "Làm sao để dùng chính câu nói bất ngờ đó làm bàn đạp dẫn dắt em ấy về hiện thực nghề nghiệp?"

[QUY TẮC ĐIỀU PHỐI THEO TRẠNG THÁI (FINITE STATE MACHINE - BẮT BUỘC)]:
Hệ thống ĐANG Ở GIAI ĐOẠN ${incomingStage}. Bạn PHẢI tuân thủ nghiêm ngặt quy tắc chuyển trạng thái:

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

* NẾU ĐANG Ở GIAI ĐOẠN 3 (Đối chất Tổ hợp môn & Học lực thực tế - Kích hoạt điểm gãy T1):
${!studentHasDeclaredSubjects ? `
  [TÌNH HUỐNG HIỆN TẠI]: Học sinh CHƯA NÊU RÕ CẶP MÔN THẾ MẠNH / MÔN YẾU, hoặc đang phản biện lại Thầy (Ví dụ: "đâu có nghịch lý gì thầy ơi", "em thấy bình thường", hoặc giải thích lý do):
  - [CẤM TUYỆT ĐỐI]: AI TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý phán đoán học sinh "học lực đều đều", KHÔNG ĐƯỢC khuyên học Cao đẳng, và TUYỆT ĐỐI KHÔNG ĐƯỢC kết thúc phiên chat tại đây!
  - [NHIỆM VỤ 3 BƯỚC BẮT BUỘC]:
    (1) Bước a: Công nhận tư duy phản biện thẳng thắn và góc nhìn thực tế của học sinh.
    (2) Bước b: Chỉ ra rằng mọi tính toán về nhu cầu thị trường hay lựa chọn môn dạy đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại ${targetSchool} (thường từ 24 - 27 điểm).
    (3) Bước c: BẮT BUỘC kết thúc bằng câu hỏi dứt khoát: "Để giúp em tìm ra điểm tựa thực tế nhất: Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?"
` : `
  [TÌNH HUỐNG HIỆN TẠI]: Học sinh ĐÃ NÊU RÕ CÁC MÔN HỌC THẾ MẠNH / MÔN YẾU (hoặc xác nhận học lực thực tế): "${trimmedMsg}".
  - Nhiệm vụ: THỰC HIỆN TOÀN BỘ LỜI TỔNG KẾT VÒNG 4 THEO MÔ HÌNH THÍCH ỨNG KÉP:
    1. Phân tích chính xác cặp môn / học lực học sinh vừa nêu (Ví dụ: yếu cả Toán và Văn; giỏi Toán yếu Văn; giỏi Văn yếu Toán; học lực đều).
    2. Đưa ra Giải pháp Thích ứng Kép: (1) Bứt phá điểm số ở môn thế mạnh để cạnh tranh vào đại học HOẶC (2) Cân nhắc hệ Cao đẳng thực hành vừa sức hơn (2.5 - 3 năm) để sớm có tay nghề vững chắc và giảm áp lực điểm thi.
    3. RA MỆNH LỆNH CHUYỂN BƯỚC DỨT KHOÁT:
       "Bây giờ, em hãy dừng suy đoán và bấm chuyển sang Bước 3: Môi trường đối chứng dữ liệu thực tế để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí chính thức nhé!"
  - [CẢNH BÁO TỐI CAO]: TUYỆT ĐỐI KHÔNG ĐƯỢC HỎI THÊM BẤT KỲ CÂU NÀO NỮA!
`}

* NẾU ĐANG Ở GIAI ĐOẠN 4 (Hoàn thành):
  Khẳng định em đã hoàn thành 4 giai đoạn phản tư và nhắc nhở chuyển sang Bước 3:
  "Bây giờ, em hãy dừng suy đoán và bấm chuyển sang Bước 3: Môi trường đối chứng dữ liệu thực tế để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí chính thức nhé!"
  TUYỆT ĐỐI KHÔNG HỎI THÊM BẤT KỲ CÂU HỎI NÀO NỮA.

[RÀO CẢN CHỐNG LẶP LẠI TUYỆT ĐỐI]:
${pastModelUtterances ? `Dưới đây là các câu trả lời gần nhất của bạn:\n${pastModelUtterances}\nBẠN TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại các cấu trúc câu, từ ngữ chào đón hoặc câu hỏi đã xuất hiện ở trên!` : ''}

[ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]:
- Mỗi phản hồi chỉ từ 2 đến 4 câu ngắn gọn, súc tích, văn phong sư phạm ổn định, điềm tĩnh, ấm áp.
- Kết thúc bằng ĐÚNG 01 câu hỏi phản tư duy nhất (ở Giai đoạn 1, 2), hoặc kết thúc bằng lời trao quyền chuyển bước dứt khoát (ở Giai đoạn 3/4).
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
        incomingStage,
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

  // 4. GIAI ĐOẠN 3 / 4: Đối chất Học lực thực tế & Mô hình thích ứng kép
  const isCounter = studentIsCounterArguing || isCounterArguing(trimmedMsg);
  const hasDeclared = studentHasDeclaredSubjects !== undefined ? studentHasDeclaredSubjects : hasDeclaredSubjectsOrGrades(trimmedMsg);

  // Nếu học sinh phản biện hoặc CHƯA khai báo môn học cụ thể:
  // Giữ nguyên Stage 3, yêu cầu nêu rõ môn mạnh/yếu đối chiếu với 24-27 điểm
  if (!hasDeclared || isCounter) {
    return `Thầy rất ghi nhận tinh thần phản biện thẳng thắn và góc nhìn thực tế của em. Đúng là khi chưa xác định cụ thể thì không nên vội vã đưa ra kết luận cảm tính.\n\nTuy nhiên, mọi tính toán về nhu cầu thị trường hay lựa chọn môn học đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại **${targetSchool}** (thường từ 24 đến 27 điểm).\n\nĐể giúp em tìm ra điểm tựa thực tế nhất: Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?`;
  }

  // CHỈ KHI học sinh ĐÃ nêu rõ môn học: Thực hiện toàn bộ lời tổng kết Vòng 4 theo Mô hình thích ứng kép
  const hasMath = lowerTrimmed.includes('toán') || lowerTrimmed.includes('toan');
  const hasLit = lowerTrimmed.includes('văn') || lowerTrimmed.includes('van');
  const isWeakBoth = (hasMath && hasLit && (lowerTrimmed.includes('yếu') || lowerTrimmed.includes('kém') || lowerTrimmed.includes('sợ'))) ||
    /(yếu|kém|đuối|sợ|thấp)[^,.;!?\n]*(văn\s*(và|với|\+)\s*toán|toán\s*(và|với|\+)\s*văn)/i.test(lowerTrimmed);

  if (isWeakBoth) {
    return `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\nKhi đối diện với ngưỡng điểm chuẩn rất cao của ngành **${targetCareer}** tại **${targetSchool}** (thường từ 24 - 27 điểm), việc có khoảng cách ở cả Toán và Văn mở ra giải pháp thích ứng kép: Em có thể nỗ lực bứt phá các môn sở trường còn lại để tối ưu điểm số tổ hợp, hoặc cân nhắc phân khúc vừa sức như hệ **Cao đẳng thực hành** (2.5 - 3 năm) để sớm có tay nghề và giảm áp lực điểm thi mà vẫn giữ trọn cơ hội phát triển nghề nghiệp.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí chính thức nhé!`;
  }

  if (hasLit && (lowerTrimmed.includes('yếu toán') || lowerTrimmed.includes('kém toán') || lowerTrimmed.includes('sợ toán') || !hasMath)) {
    return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Năng khiếu Ngữ văn và khoa học xã hội là nền tảng rất vững chắc, giúp em phát huy trọn vẹn thế mạnh ngôn ngữ và hoàn toàn tránh được áp lực môn Toán!\n\nĐể tối ưu cơ hội, em có thể dồn lực bứt phá tổ hợp văn/ngoại ngữ vào đại học, hoặc cân nhắc hệ Cao đẳng thực hành vừa sức hơn.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí chính thức nhé!`;
  }

  if (hasMath && (lowerTrimmed.includes('yếu văn') || lowerTrimmed.includes('kém văn') || lowerTrimmed.includes('sợ văn') || !hasLit)) {
    return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới các tổ hợp tự nhiên và công nghệ, hoàn toàn tránh được rào cản môn Ngữ văn!\n\nĐể mở rộng cơ hội trúng tuyển, em có thể dồn lực bứt phá tổ hợp tự nhiên vào đại học, hoặc cân nhắc hệ Cao đẳng thực hành vừa sức hơn.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí chính thức nhé!`;
  }

  return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 giai đoạn phản tư.\n\nDù lựa chọn ngành nào, em luôn có 2 hướng thích ứng rất rõ ràng: Bứt phá điểm số ở môn có thế mạnh để cạnh tranh vào hệ Đại học chính quy, hoặc cân nhắc hệ Cao đẳng thực hành (2.5 - 3 năm) vừa sức để sớm gia nhập thị trường việc làm với tay nghề vững chắc.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí chính thức nhé!`;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[VISEF 2026] Server AI Socrates đang vận hành tại cổng ${PORT}`);
});
