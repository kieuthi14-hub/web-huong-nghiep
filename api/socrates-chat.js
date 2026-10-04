// api/socrates-chat.js - Vercel Serverless Function & Express compatible endpoint
// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// MÔ HÌNH NHẬN THỨC LINH HOẠT & TIẾN TRÌNH 4 VÒNG SƯ PHẠM BẤT BIẾN
// ==============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

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

function detectGoalShift(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.toLowerCase().trim();

  const knownMajors = [
    { patterns: ['sư phạm giáo dục chính trị', 'sp giáo dục chính trị', 'giáo dục chính trị', 'sư phạm gdct', 'sp gdct'], name: 'Sư phạm Giáo dục Chính trị', field: 'soc' },
    { patterns: ['sư phạm giáo dục công dân', 'sp giáo dục công dân', 'giáo dục công dân', 'sư phạm gdcd', 'sp gdcd'], name: 'Sư phạm Giáo dục Công dân', field: 'soc' },
    { patterns: ['sư phạm ngữ văn', 'sư phạm văn', 'sp văn', 'sp ngữ văn'], name: 'Sư phạm Ngữ văn', field: 'soc' },
    { patterns: ['sư phạm tiếng anh', 'sư phạm anh', 'sp tiếng anh', 'sp anh', 'ngôn ngữ anh'], name: 'Sư phạm Tiếng Anh', field: 'lang' },
    { patterns: ['sư phạm lịch sử', 'sư phạm sử', 'sp sử', 'sp lịch sử'], name: 'Sư phạm Lịch sử', field: 'soc' },
    { patterns: ['sư phạm địa lý', 'sư phạm địa', 'sp địa', 'sp địa lý'], name: 'Sư phạm Địa lý', field: 'soc' },
    { patterns: ['sư phạm toán', 'sp toán', 'sư phạm toán học'], name: 'Sư phạm Toán', field: 'sci' },
    { patterns: ['sư phạm vật lý', 'sư phạm lý', 'sp lý', 'sp vật lý'], name: 'Sư phạm Vật lý', field: 'sci' },
    { patterns: ['sư phạm hóa học', 'sư phạm hóa', 'sp hóa'], name: 'Sư phạm Hóa học', field: 'sci' },
    { patterns: ['sư phạm sinh học', 'sư phạm sinh', 'sp sinh'], name: 'Sư phạm Sinh học', field: 'sci' },
    { patterns: ['sư phạm tin học', 'sư phạm tin', 'sp tin'], name: 'Sư phạm Tin học', field: 'tech' },
    { patterns: ['giáo dục tiểu học', 'sp tiểu học', 'sư phạm tiểu học'], name: 'Giáo dục Tiểu học', field: 'edu' },
    { patterns: ['giáo dục mầm non', 'sp mầm non', 'sư phạm mầm non'], name: 'Giáo dục Mầm non', field: 'edu' },
    { patterns: ['công nghệ thông tin', 'cntt', 'khoa học máy tính', 'kỹ thuật phần mềm'], name: 'Công nghệ Thông tin', field: 'tech' },
    { patterns: ['quản trị kinh doanh', 'marketing', 'kinh doanh quốc tế', 'thương mại điện tử'], name: 'Quản trị Kinh doanh', field: 'biz' },
    { patterns: ['tài chính ngân hàng', 'kế toán', 'kiểm toán'], name: 'Tài chính - Ngân hàng', field: 'biz' },
    { patterns: ['luật kinh tế', 'luật dân sự', 'ngành luật', 'học luật', 'khoa luật'], name: 'Ngành Luật', field: 'law' },
    { patterns: ['y đa khoa', 'bác sĩ', 'điều dưỡng', 'dược', 'dược học'], name: 'Y - Dược', field: 'med' },
    { patterns: ['tâm lý học', 'tâm lý giáo dục', 'công tác xã hội'], name: 'Tâm lý học & Xã hội', field: 'soc' }
  ];

  for (const item of knownMajors) {
    if (item.patterns.some(p => clean.includes(p))) {
      return {
        newMajor: item.name,
        field: item.field
      };
    }
  }

  const matchGeneric = clean.match(/(?:dự định|tính|muốn|đổi sang|chuyển sang|thi|học)\s+(?:ngành|chuyên ngành)\s+([a-zà-ỹ\s]{3,30}?)(?:\s+(?:mà|nhưng|tại|ở|ạ|được|có|để|[.,!?]|$))/i);
  if (matchGeneric && matchGeneric[1]) {
    const candidate = matchGeneric[1].trim();
    if (candidate.length >= 3 && !['này', 'đó', 'kia', 'gì', 'nào', 'khác'].includes(candidate)) {
      return {
        newMajor: candidate.charAt(0).toUpperCase() + candidate.slice(1),
        field: 'other'
      };
    }
  }

  return null;
}

function isAskingAboutSubjectsOrCombos(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const patterns = [
    'chưa biết xét môn gì', 'chưa biết thi môn gì', 'xét môn gì', 'thi môn gì', 'tổ hợp gì',
    'xét tổ hợp nào', 'tổ hợp môn nào', 'khối nào', 'xét khối gì', 'gồm những môn nào',
    'chưa rõ tổ hợp', 'chưa biết khối', 'chưa biết tổ hợp'
  ];
  return patterns.some(p => clean.includes(p));
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
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { chatHistory, userMessage } = body || {};

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    // 1. Kiểm tra an toàn: Lịch sử trò chuyện phải là một mảng
    const validHistory = Array.isArray(chatHistory) ? chatHistory : (Array.isArray(body?.history) ? body.history : []);

    const trimmedMsg = userMessage.trim();
    const lowerTrimmed = trimmedMsg.toLowerCase();

    // 2. PHẢN XẠ NHANH: Nếu học sinh chỉ chào hỏi xã giao (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em, thầy trò mình cùng bắt đầu nhé! Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại.`;
      return res.status(200).json({
        success: true,
        round: body?.round && Number(body.round) > 0 ? Number(body.round) : 1,
        stage: body?.stage && Number(body.stage) > 0 ? Number(body.stage) : (body?.round ? Number(body.round) : 1),
        chatStage: body?.chatStage && Number(body.chatStage) > 0 ? Number(body.chatStage) : 1,
        response: greetingReply,
        reply: greetingReply,
        isComplete: false,
        isCompleted: false,
        progress: "1/4"
      });
    }

    // 2b. PHẢN XẠ NHANH: Nếu học sinh thắc mắc kỹ thuật / chưa hiểu câu hỏi (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isTechnicalConfusion(trimmedMsg)) {
      const clarifyReply = `Thầy hỏi để giúp em tự soi chiếu động lực và năng lực thực tế của mình trước khi ra quyết định quan trọng. Em hãy chia sẻ rõ hơn suy nghĩ của mình về câu hỏi của thầy ở trên nhé!`;
      return res.status(200).json({
        success: true,
        round: body?.round && Number(body.round) > 0 ? Number(body.round) : 1,
        stage: body?.stage && Number(body.stage) > 0 ? Number(body.stage) : (body?.round ? Number(body.round) : 1),
        chatStage: body?.chatStage && Number(body.chatStage) > 0 ? Number(body.chatStage) : 1,
        response: clarifyReply,
        reply: clarifyReply,
        isComplete: false,
        isCompleted: false,
        progress: "1/4"
      });
    }

    // 3. Quản lý Tiến trình Hội thoại theo Trạng thái Cứng (STRICT STATE MACHINE - VISEF 2026)
    // Khởi tạo biến: currentStage = 1 (Chỉ số từ 1 đến 4).
    // Mỗi khi học sinh bấm gửi một tin nhắn, currentStage mới được tăng lên 1 đơn vị.
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text) && !isTechnicalConfusion(m.text));

    let currentStage = 1;
    if (body?.currentStage && Number(body.currentStage) >= 1) {
      currentStage = Math.min(Math.max(Number(body.currentStage), 1), 4);
    } else if (body?.stage && Number(body.stage) >= 1) {
      currentStage = Math.min(Math.max(Number(body.stage), 1), 4);
    } else if (body?.chatStage && Number(body.chatStage) >= 1) {
      currentStage = Math.min(Math.max(Number(body.chatStage), 1), 4);
    } else if (body?.round && Number(body.round) >= 1) {
      currentStage = Math.min(Math.max(Number(body.round), 1), 4);
    } else {
      currentStage = Math.min(Math.max(substantiveUserMsgs.length + 1, 1), 4);
    }

    const studentProfile = body?.studentProfile || body?.userProfile || body?.anchor || {};
    const targetCareer = studentProfile?.targetMajor || studentProfile?.targetCareer || studentProfile?.target_career || "Sư phạm";
    const targetSchool = studentProfile?.targetSchool || studentProfile?.targetUniversity || studentProfile?.target_university || "ĐH Quy Nhơn";
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || "AEI";
    const reason = studentProfile?.reason || studentProfile?.careerReason || "Em thích từ nhỏ và cảm thấy phù hợp";
    const initialConfidence = studentProfile?.initialConfidence || studentProfile?.confidenceT0 || studentProfile?.confidence_score || studentProfile?.confidence || 5;
    const expectedIncome = studentProfile?.expectedIncome || studentProfile?.targetIncome || "10 - 15 triệu/tháng";

    // 3b. Nhận diện chuyển biến mục tiêu / thắc mắc ngành mới từ tin nhắn học sinh
    const goalShift = detectGoalShift(trimmedMsg);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : targetCareer;

    // 4. Trích xuất các câu phát ngôn gần nhất của Thầy để chống lặp
    const pastModelUtterances = validHistory
      .filter(m => m.role === 'model' && m.text)
      .slice(-3)
      .map((m, i) => `Lượt trước ${i + 1}: "${m.text.slice(0, 120)}..."`)
      .join('\n');

    // 5. TÁCH BIỆT SYSTEM PROMPT CHO TỪNG GIAI ĐOẠN ĐỘC LẬP (KHÔNG DÙNG 1 PROMPT CHUNG)
    const systemPrompt = getStageSystemPrompt(currentStage, {
      targetCareer,
      effectiveCareer,
      isShifted,
      targetSchool,
      hollandCode,
      reason,
      initialConfidence,
      expectedIncome
    }, trimmedMsg, pastModelUtterances);

    // 6. Chuẩn bị nội dung gửi lên Gemini API
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

    // 7. Cấu hình mô hình hoạt động ổn định
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

          if (isCompleteSentence(cleaned)) {
            if (currentStage === 4) {
              // GIAI ĐOẠN 4: LỌC SẠCH DẤU HỎI ? VÀ ĐẢM BẢO KẾT LỆNH BƯỚC 3
              cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
              cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
              cleaned = cleaned.trim();

              const step3Directive = "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!";
              if (!cleaned.includes("Bước 3") && !cleaned.includes("bước 3")) {
                cleaned = cleaned + "\n\n" + step3Directive;
              }
            } else {
              // GIAI ĐOẠN 1, 2, 3: NGHIÊM CẤM NHẮC ĐẾN BƯỚC 3
              cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();
            }
            replyText = cleaned;
            break;
          }
        }
      } catch (err) {
        // Thử model tiếp theo trong danh sách candidate
      }
    }

    // 8. Heuristic Fallback Nhận thức (Dự phòng khẩn cấp nếu API gặp sự cố)
    if (!replyText || !isCompleteSentence(replyText)) {
      replyText = generateCognitiveFallback({
        stage: currentStage,
        targetCareer,
        effectiveCareer,
        isShifted,
        targetSchool,
        hollandCode,
        reason,
        initialConfidence,
        expectedIncome,
        trimmedMsg
      });
    }

    const isComplete = currentStage === 4;
    const progressStr = `${currentStage}/4`;

    return res.status(200).json({
      success: true,
      stage: currentStage,
      currentStage: currentStage,
      chatStage: currentStage,
      round: currentStage,
      response: replyText,
      reply: replyText,
      isComplete: isComplete,
      isCompleted: isComplete,
      progress: progressStr,
      shiftedMajor: isShifted ? effectiveCareer : null
    });

  } catch (error) {
    console.error("Lỗi Socrates Chat Backend:", error);
    return res.status(500).json({ success: false, message: "Lỗi xử lý máy chủ!" });
  }
}

// ==============================================================================
// TÁCH BIỆT SYSTEM PROMPT CHO TỪNG GIAI ĐOẠN ĐỘC LẬP
// ==============================================================================
function getStageSystemPrompt(stage, profile, userText, pastModelUtterances = '') {
  const { targetCareer, effectiveCareer: profEffective, isShifted: profShifted, targetSchool, hollandCode, reason, initialConfidence, expectedIncome } = profile;
  const avoidRepetition = pastModelUtterances
    ? `\n[CÂU THOẠI TRƯỚC ĐÓ CỦA THẦY - TUYỆT ĐỐI KHÔNG ĐƯỢC LẶP LẠI]:\n${pastModelUtterances}\n`
    : '';

  // Nhận diện chuyển biến mục tiêu / thắc mắc ngành mới từ tin nhắn học sinh
  const goalShift = detectGoalShift(userText);
  const isShifted = profShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = profEffective || (goalShift ? goalShift.newMajor : targetCareer);
  const askingCombo = isAskingAboutSubjectsOrCombos(userText);
  const lowerUser = (userText || '').toLowerCase();

  // Chỉ thị thích ứng mục tiêu (Adaptive Shift Directive)
  let adaptiveDirective = '';
  if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị')) {
    adaptiveDirective = `
[CHỈ DẪN QUAN TRỌNG KHI HỌC SINH ĐỔI Ý / NÊU NGÀNH MỚI HOẶC HỎI TỔ HỢP MÔN]:
- Học sinh vừa đề cập ngành: "${effectiveCareer}" và/hoặc hỏi về tổ hợp môn ("${userText}").
- TUYỆT ĐỐI KHÔNG ÉP HỌC SINH QUAY LẠI NGÀNH CŨ ("${targetCareer}")! Hãy nhiệt liệt hoan nghênh và công nhận bước ngoặt chuyển biến nhận thức (Turning Point) này của học sinh khi em dũng cảm nhìn lại năng lực thực tế.
- NẾU HỌC SINH HỎI VỀ MÔN XÉT TUYỂN HOẶC NHẮC ĐẾN NGÀNH SƯ PHẠM GIÁO DỤC CHÍNH TRỊ / GDCD:
  + Phải giải thích rõ ngành này xét tuyển các tổ hợp: C19 (Ngữ văn, Lịch sử, Giáo dục Kinh tế và Pháp luật - KTPL), C20 (Ngữ văn, Địa lý, KTPL), C00 (Văn, Sử, Địa), D14 (Văn, Sử, Anh), D01 (Toán, Văn, Anh)...
  + Nhấn mạnh: Học tốt môn KTPL là một lợi thế điểm số cực kỳ đắt giá khi xét tuyển tổ hợp C19 hoặc C20!
  + Đối chất thực tế: Chỉ tiêu ngành này thường khá ít, điểm chuẩn thường rất cao (25 - 28 điểm). Để trúng tuyển, không chỉ môn KTPL điểm cao mà môn Văn và môn Sử (hoặc Địa/Anh) đi kèm cũng phải từ 8.0 - 8.5+ điểm, không được để môn nào kéo tụt tổng điểm.
- Chiến lược Thích ứng Đa tầng PHẢI THIẾT LẬP HOÀN TOÀN THEO NGÀNH MỚI "${effectiveCareer}":
  + Tầng 1: Kế hoạch bứt phá tối đa môn thế mạnh (như KTPL) và kéo điểm các môn trong tổ hợp xét tuyển của ngành ${effectiveCareer} để đỗ vào trường đại học mục tiêu.
  + Tầng 2: Chuẩn bị nguyện vọng dự phòng các ngành gần (Khối Khoa học Xã hội, Luật, Quản lý nhà nước, Công tác xã hội hoặc Sư phạm tại các trường lân cận vừa sức).
  + Tầng 3: Lưới an toàn với hệ Cao đẳng Sư phạm hoặc các hệ đào tạo thực hành dịch vụ pháp lý, hành chính.
`;
  }

  // ● KHI currentStage === 1 (Lượt khởi đầu):
  if (stage === 1) {
    return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang bắt đầu phiên đối thoại phản tư với một học sinh THPT.

[HỒ SƠ HỌC SINH]:
- Nhóm thiên hướng Holland (RIASEC): ${hollandCode}
- Ngành mong muốn: ${targetCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Mức tự tin ban đầu: ${initialConfidence}/10
- Lý do chọn ngành ban đầu: "${reason}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 1]:
1. Chào học sinh theo mã Holland [${hollandCode}], ngành [${targetCareer}], lý do [${reason}].
2. HỎI ĐÚNG 01 CÂU DUY NHẤT:
"Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG nói về thu nhập hay tiền bạc.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay học bạ.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
  }

  // ● KHI currentStage === 2 (Lượt thách thức việc làm & thu nhập):
  if (stage === 2) {
    return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang ở Lượt 2 của phiên đối thoại phản tư. Học sinh vừa trả lời câu hỏi ở Stage 1.

[HỒ SƠ HỌC SINH]:
- Ngành mong muốn: ${targetCareer}
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}"
- Câu trả lời của học sinh ở Stage 1: "${userText}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 2]:
1. Ghi nhận câu trả lời của học sinh trong 1-2 câu ngắn gọn, ấm áp.
2. Xoáy vào dữ liệu thu nhập [${expectedIncome}] với ĐÚNG CÂU HỎI SAU:
"Em kỳ vọng mức thu nhập sau khi ra trường là ${expectedIncome}. Trong bối cảnh 5-10 năm tới khi AI và chuyển đổi số làm thay đổi thị trường giáo dục, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay học bạ.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Khung chat bắt buộc phải giữ mở để học sinh trả lời tiếp ở Stage 3.
- Kết thúc bằng đúng câu hỏi về thu nhập & AI ở trên.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
  }

  // ● KHI currentStage === 3 (Lượt đối chất tổ hợp môn & học lực thực tế):
  if (stage === 3) {
    return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang ở Lượt 3 của phiên đối thoại phản tư. Học sinh vừa trả lời câu hỏi ở Stage 2.

[HỒ SƠ HỌC SINH]:
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Câu trả lời của học sinh ở Stage 2 (về thu nhập/AI/cạnh tranh): "${userText}"
${adaptiveDirective}
[NHIỆM VỤ DUY NHẤT Ở LƯỢT 3]:
1. Ghi nhận ngắn gọn góc nhìn của học sinh về việc làm/thu nhập.
2. Dẫn dắt vào bài toán điểm số với ĐÚNG CÂU HỎI SAU:
"Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${effectiveCareer} tại ${targetSchool}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG đưa ra kết luận hay giải pháp hạ bậc ở lượt này.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Khung chat bắt buộc phải giữ mở để học sinh trả lời về môn học ở Stage 4.
- Kết thúc bằng đúng câu hỏi về tổ hợp & môn sở trường/đuối sức ở trên.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
  }

  // ● KHI currentStage === 4 (Lượt kết thúc & Tái cấu trúc 3 tầng nấc):
  return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang ở Lượt 4 (Lượt kết thúc phản tư) của phiên đối thoại. Học sinh vừa trả lời về môn học ở Stage 3.

[HỒ SƠ HỌC SINH]:
- Ngành mong muốn hiện tại: ${effectiveCareer} (Ban đầu: ${targetCareer})
- Trường đại học mục tiêu: ${targetSchool}
- Câu trả lời của học sinh ở Stage 3: "${userText}"
${adaptiveDirective}
[NHIỆM VỤ DUY NHẤT Ở LƯỢT 4]:
1. AI phân tích môn thế mạnh và môn yếu học sinh vừa nêu trong tin nhắn "${userText}".
   - Nếu học sinh đổi ý sang ngành mới "${effectiveCareer}" hoặc hỏi tổ hợp xét tuyển, hãy công nhận ngay sự chuyển biến đó và giải đáp rõ ràng tổ hợp xét tuyển của ngành ${effectiveCareer} (như C19, C20 cho KTPL và Sư phạm Giáo dục Chính trị).
   - Chỉ ra thách thức điểm chuẩn thực tế (25 - 28 điểm) và rủi ro nếu các môn còn lại trong tổ hợp bị đuối điểm.
2. Trình bày Chiến lược Thích ứng Đa tầng (3 tầng nấc) XOAY QUANH NGÀNH ${effectiveCareer}:
   + Tầng 1: Kế hoạch bứt phá môn thế mạnh để kéo điểm thi vào ${effectiveCareer} tại trường mục tiêu.
   + Tầng 2: Chuẩn bị nguyện vọng dự phòng tại các trường Đại học vừa sức hơn hoặc các ngành gần liên quan.
   + Tầng 3: Lưới an toàn với các hệ đào tạo thực hành vững chắc để luôn chủ động.
3. KẾT LỆNH BẮT BUỘC:
"Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!"

[CẢNH BÁO TỐI CAO - ĐẶC BIỆT]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt thêm bất kỳ câu hỏi nào. KHÔNG CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- TUYỆT ĐỐI KHÔNG ép học sinh thi ngành cũ "${targetCareer}" nếu học sinh đã nêu hướng đi mới "${effectiveCareer}".
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
}

// ==============================================================================
// HÀM FALLBACK NHẬN THỨC THEO TỪNG GIAI ĐOẠN ĐỘC LẬP
// ==============================================================================
function generateCognitiveFallback({ stage, targetCareer, effectiveCareer: propEffective, isShifted: propShifted, targetSchool, hollandCode, reason, initialConfidence, expectedIncome, trimmedMsg }) {
  if (stage === 1) {
    return `Chào em. Thầy ghi nhận em có thiên hướng Holland **${hollandCode}**, dự định chọn **${targetCareer}** tại **${targetSchool}** với mức tự tin **${initialConfidence}/10** và lý do: '${reason}'.\n\nEm thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
  }

  if (stage === 2) {
    return `Thầy rất ghi nhận và thấu cảm với chia sẻ chân thành của em về động cơ chọn ngành.\n\nEm kỳ vọng mức thu nhập sau khi ra trường là **${expectedIncome}**. Trong bối cảnh 5-10 năm tới khi AI và chuyển đổi số làm thay đổi thị trường giáo dục, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?`;
  }

  if (stage === 3) {
    return `Thầy rất ủng hộ tinh thần tích cực và nhận thức thực tế của em về thị trường lao động.\n\nDù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành **${propEffective || targetCareer}** tại **${targetSchool}**, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?`;
  }

  // Stage 4
  const lowerMsg = (trimmedMsg || '').toLowerCase();
  const goalShift = detectGoalShift(trimmedMsg);
  const isShifted = propShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = propEffective || (goalShift ? goalShift.newMajor : targetCareer);
  const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);

  // TRƯỜNG HỢP ĐẶC BIỆT: HỌC SINH NÊU NGÀNH SƯ PHẠM GIÁO DỤC CHÍNH TRỊ / GDCD / KTPL
  if (effectiveCareer.toLowerCase().includes('chính trị') || effectiveCareer.toLowerCase().includes('công dân') || lowerMsg.includes('ktpl') || lowerMsg.includes('chính trị')) {
    return `Thầy rất hoan nghênh và ghi nhận bước chuyển biến nhận thức rất thực tế của em! Việc em tự nhìn nhận lại năng lực và chủ động hướng sang ngành **Sư phạm Giáo dục Chính trị** (đào tạo giáo viên dạy môn KTPL và GDCD) là một quyết định rất đáng khích lệ khi em nhận ra thế mạnh của mình.\n\n` +
      `Về tổ hợp xét tuyển, ngành Sư phạm Giáo dục Chính trị hiện nay tuyển sinh các tổ hợp trọng điểm như:\n` +
      `• **C19** (Ngữ văn, Lịch sử, Giáo dục Kinh tế và Pháp luật) hoặc **C20** (Ngữ văn, Địa lý, GDKT&PL).\n` +
      `• **C00** (Ngữ văn, Lịch sử, Địa lý) hoặc **D14** (Ngữ văn, Lịch sử, Tiếng Anh) / **D01** (Toán, Văn, Anh).\n` +
      `Việc em **học tốt môn KTPL** chính là một "vũ khí điểm số" cực kỳ lợi thế nếu em chọn xét tuyển theo tổ hợp C19 hoặc C20!\n\n` +
      `Tuy nhiên, em cần lưu ý rằng ngành Sư phạm Giáo dục Chính trị có chỉ tiêu tuyển sinh thường khá ít, do đó điểm chuẩn trúng tuyển luôn ở mức rất cao (thường từ 25 đến 28 điểm). Để trúng tuyển, chỉ giỏi môn KTPL là chưa đủ mà em cần đảm bảo cả môn Ngữ văn và môn Lịch sử (hoặc Địa lý) cũng phải đạt từ 8 - 8.5 điểm trở lên, không được để môn nào kéo tụt tổng điểm.\n\n` +
      `Để giúp em hiện thực hóa ước mơ trở thành giáo viên một cách vững vàng nhất, Thầy đề xuất Chiến lược Thích ứng Đa tầng như sau:\n\n` +
      `• **Tầng 1 (Nguyện vọng 1 - Bứt phá)**: Tối ưu tối đa điểm môn KTPL (mục tiêu 9+) và lên kế hoạch kéo điểm môn Văn, Sử trong tổ hợp C19 để tự tin cạnh tranh vào ngành Sư phạm Giáo dục Chính trị tại trường đại học mục tiêu.\n\n` +
      `• **Tầng 2 (Nguyện vọng 2 - Dự phòng vừa sức)**: Đăng ký thêm nguyện vọng dự phòng vào các ngành đào tạo gần hoặc cùng khối xã hội như Luật, Quản lý nhà nước, Công tác xã hội hoặc các trường Đại học lân cận có đào tạo sư phạm với điểm chuẩn mềm hơn.\n\n` +
      `• **Tầng 3 (Lưới an toàn)**: Xây dựng lưới an toàn với hệ Cao đẳng Sư phạm hoặc các ngành thực hành dịch vụ pháp lý, hành chính - văn phòng để em luôn chủ động trong mọi tình huống.\n\n` +
      `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm của ngành nhé!`;
  }

  // TRƯỜNG HỢP HỌC SINH ĐỔI SANG NGÀNH KHÁC BẤT KỲ
  if (isShifted) {
    const strongName = strongSubject || 'môn sở trường của em';
    return `Thầy rất hoan nghênh và ghi nhận bước chuyển biến nhận thức rất thực tế của em khi chủ động hướng sang ngành **${effectiveCareer}** phù hợp hơn với năng lực.\n\n` +
      `Có thế mạnh ở ${strongName} là điểm tựa rất tốt. Tuy nhiên, em cần tìm hiểu kỹ các tổ hợp xét tuyển của ngành ${effectiveCareer} để đảm bảo không môn nào trong tổ hợp bị đuối điểm làm kéo tụt tổng điểm chuẩn trúng tuyển.\n\n` +
      `Để làm chủ lộ trình, Thầy định hướng Chiến lược Thích ứng Đa tầng như sau:\n\n` +
      `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá tối đa môn sở trường và các môn trong tổ hợp xét tuyển của ngành ${effectiveCareer}.\n` +
      `• **Tầng 2 (Nguyện vọng 2)**: Chuẩn bị nguyện vọng dự phòng tại các trường Đại học có cùng ngành hoặc ngành liên quan vừa sức hơn.\n` +
      `• **Tầng 3 (Lưới an toàn)**: Lưới an toàn với các hệ đào tạo thực hành chất lượng cao để đảm bảo cơ hội việc làm vững chắc.\n\n` +
      `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
  }

  // Trường hợp thông thường
  const strongName = strongSubject || 'môn sở trường của em';
  const weakName = weakSubject || 'môn học em đang thấy lo lắng';

  return `Thầy phân tích thấy việc có thế mạnh ở môn ${strongName} là điểm tựa rất tốt. Tuy nhiên, nếu môn ${weakName} còn đuối sức, rủi ro điểm chuẩn sẽ kéo tụt tổng điểm cả tổ hợp khi xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**.\n\n` +
    `Để luôn làm chủ lộ trình tương lai, Thầy định hướng cho em Chiến lược Thích ứng Đa tầng với 3 tầng nấc:\n\n` +
    `• **Tầng 1 (Nguyện vọng 1)**: Kế hoạch bứt phá môn thế mạnh để kéo điểm thi vào ${targetSchool}.\n` +
    `• **Tầng 2 (Nguyện vọng 2)**: Chuẩn bị nguyện vọng dự phòng tại các trường Đại học vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên).\n` +
    `• **Tầng 3 (Lưới an toàn)**: Lưới an toàn với các hệ đào tạo thực hành vững chắc để luôn chủ động.\n\n` +
    `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
}
