// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - ĐỀ TÀI NGHIÊN CỨU KHOA HỌC KỸ THUẬT (KHKT)
// HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG (SOCRACAREER)
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
    { patterns: ['y đa khoa', 'bác sĩ', 'điều dưỡn    'chưa rõ tổ hợp', 'chưa biết khối', 'chưa biết tổ hợp'
  ];
  return patterns.some(p => clean.includes(p));
}

// HÀM XÁC ĐỊNH TỔ HỢP MÔN THAM CHIẾU THEO CHƯƠNG TRÌNH GDPT 2018 (KHÔNG ÁP ĐẶT CỨNG NHẮC KHỐI CŨ)
function getRecommendedComboForMajor(majorName, userText = '') {
  const m = (majorName || '').toLowerCase();
  const u = (userText || '').toLowerCase();

  if (m.includes('chính trị') || m.includes('công dân') || u.includes('ktpl') || u.includes('chính trị')) {
    return 'tổ hợp có GDKT&PL (như C19, C20, D84) hoặc C00/D01';
  }
  if (m.includes('tin') || m.includes('cntt') || m.includes('phần mềm') || u.includes('tin học') || u.includes('tin')) {
    return 'tổ hợp có Tin học/Toán trọng số (Toán nhân hệ số 2) hoặc Toán - Lý - Anh';
  }
  if (u.includes('toán') && u.includes('lý') && u.includes('anh')) {
    return 'Toán - Lý - Anh (hoặc tổ hợp có Toán trọng số)';
  }
  if (u.includes('toán') && u.includes('văn') && u.includes('anh')) {
    return 'Toán - Văn - Anh (hoặc tổ hợp có Ngoại ngữ trọng số)';
  }
  if (m.includes('toán') || m.includes('vật lý') || m.includes('hóa') || m.includes('kỹ thuật') || m.includes('công nghệ')) {
    return 'tổ hợp môn KHTN/Tin học với môn Toán nhân hệ số 2';
  }
  if (m.includes('văn') || m.includes('sử') || m.includes('địa') || m.includes('xã hội')) {
    return 'tổ hợp môn KHXH (như C00, C19, C20, D14)';
  }
  if (m.includes('y') || m.includes('dược') || m.includes('sinh') || m.includes('điều dưỡng')) {
    return 'tổ hợp Toán - Hóa - Sinh hoặc KHTN kèm chuẩn Ngoại ngữ';
  }
  return 'tổ hợp môn tự chọn tối ưu theo đề án tuyển sinh';
}

function sanitizeSocraticResponse(rawText, round, effectiveCareer, targetSchool, userText = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // 1. Loại bỏ các tiền tố xưng danh hoặc thẻ hệ thống
  cleaned = cleaned
    .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates|Thầy Socrates)[:\s-]*/i, '')
    .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ).*?\]\s*/gi, '')
    .replace(/^#+.*?\n/gi, '')
    .trim();

  // 2. BỘ NGUYÊN TẮC: TUYỆT ĐỐI CẤM KHEN NGỢI QUÁ ĐÀ, XOA DỊU
  const praisePatterns = [
    /^(Thầy\s+(rất\s+)?(thấu cảm|thấu hiểu|hoan nghênh|khen ngợi|ủng hộ|đánh giá cao)|rất\s+(tuyệt vời|đáng khen|hoan nghênh|đáng khích lệ)|góc nhìn rất tiến bộ|thầy\s+chúc mừng|chúc mừng em)[^.!?\n]*[.!?]\s*/i,
    /(Thầy\s+(rất\s+)?(thấu cảm|thấu hiểu|hoan nghênh|khen ngợi|ủng hộ|đánh giá cao)|rất\s+(tuyệt vời|đáng khen|hoan nghênh|đáng khích lệ)|góc nhìn rất tiến bộ|thầy\s+chúc mừng)[^.!?\n]*[.!?]\s*/gi
  ];
  praisePatterns.forEach(rx => {
    cleaned = cleaned.replace(rx, '').trim();
  });

  // 3. NGUYÊN TẮC CÂN BẰNG: LOẠI BỎ NGÔN TỪ PHÁN XÉT TIÊU CỰC VÔ CĂN CỨ
  const negativeJudgmentPatterns = [
    /(?:bị\s+)?điểm liệt/gi,
    /(?:năng lực\s+)?(?:yếu kém|kém cỏi|bất tài|thấp kém)/gi,
    /(?:chắc chắn\s+)?(?:sẽ trượt|rớt đại học|thất bại)/gi
  ];
  negativeJudgmentPatterns.forEach(rx => {
    cleaned = cleaned.replace(rx, 'cần bứt phá thêm').trim();
  });

  // Cắt bỏ các danh sách tự vạch chiến lược / tầng nấc thay học sinh
  cleaned = cleaned.replace(/(?:Để giúp em|Để làm chủ lộ trình|Thầy đề xuất|Thầy định hướng)[^:.\n]*Chiến lược Thích ứng Đa tầng[^:\n]*:?/gi, '');
  cleaned = cleaned.replace(/[•\-\*]?\s*Tầng\s*[1-3][^:\n]*:?[^\n\r]*/gi, '');
  cleaned = cleaned.replace(/Chiến lược Thích ứng Đa tầng/gi, '');
  cleaned = cleaned.replace(/Mô hình hạ bậc mềm \(Soft Laddering\)/gi, '');
  cleaned = cleaned.trim();

  const combo = getRecommendedComboForMajor(effectiveCareer, userText);
  const school = targetSchool || 'trường đại học mục tiêu';
  const major = effectiveCareer || 'ngành mục tiêu';
  const lowerUser = (userText || '').toLowerCase();
  const { strongSubject, weakSubject } = extractSubjectsFeedback(userText);
  const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');

  if (round === 4) {
    // Ở LƯỢT CUỐI CÙNG, RA LỆNH CHO HỌC SINH TỰ CHỌN TỔ HỢP TỐI ƯU ĐỂ ĐỐI CHỨNG TẠI BƯỚC 3
    const standardDirective = `Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${school} xem độ chênh lệch thực tế là bao nhiêu.`;

    // Cắt bỏ dấu ? ở cuối câu
    cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
    cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
    cleaned = cleaned.trim();

    // Loại bỏ các câu điều hướng cũ nếu có
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    // Rút gọn thành tối đa 1-2 câu nhận định mâu thuẫn trước khi ra lệnh
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    let intro = '';
    if (sentences.length > 0) {
      intro = sentences.slice(0, 2).join(' ').trim();
    } else {
      if (isBalancedGrades) {
        intro = `Học đều các môn là một nền tảng tốt, nhưng điểm chuẩn vào ngành ${major} tại ${school} đòi hỏi điểm số bứt phá ở tổ hợp xét tuyển.`;
      } else if (strongSubject && weakSubject) {
        intro = `Thế mạnh ở môn ${strongSubject} là điểm tựa tốt, nhưng môn ${weakSubject} nếu chưa đạt yêu cầu sẽ là rào cản khi xét tuyển vào ngành ${major} tại ${school}.`;
      } else if (strongSubject) {
        intro = `Môn ${strongSubject} là một điểm tựa, nhưng điểm chuẩn ngành ${major} tại ${school} đòi hỏi cả tổ hợp xét tuyển phải đạt ngưỡng an toàn.`;
      } else {
        intro = `Để biết năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${major} tại ${school} hay không, em cần đối chứng với dữ liệu thực tế.`;
      }
    }

    return `${intro} ${standardDirective}`.trim();
  } else {
    // VÒNG 1, 2, 3: ĐẢM BẢO TỐI ĐA 2-3 CÂU VĂN VÀ KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    if (!cleaned.endsWith('?')) {
      if (round === 1) {
        cleaned += ` Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
      } else if (round === 2) {
        cleaned += ` Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập kỳ vọng đó ngay khi em vừa tốt nghiệp?`;
      } else if (round === 3) {
        cleaned += ` Để xét tuyển vào ngành ${major} tại ${school}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;
      }
    }

    return cleaned.trim();
  }
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
        stage: req.body?.stage && Number(req.body.stage) > 0 ? Number(req.body.stage) : (req.body?.round ? Number(req.body.round) : 1),
        chatStage: req.body?.chatStage && Number(req.body.chatStage) > 0 ? Number(req.body.chatStage) : 1,
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
        round: req.body?.round && Number(req.body.round) > 0 ? Number(req.body.round) : 1,
        stage: req.body?.stage && Number(req.body.stage) > 0 ? Number(req.body.stage) : (req.body?.round ? Number(req.body.round) : 1),
        chatStage: req.body?.chatStage && Number(req.body.chatStage) > 0 ? Number(req.body.chatStage) : 1,
        response: clarifyReply,
        reply: clarifyReply,
        isComplete: false,
        isCompleted: false,
        progress: "1/4"
      });
    }

    // 3. Quản lý Tiến trình Hội thoại theo Trạng thái Cứng (4 Vòng Sư Phạm Chuẩn KHKT)
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text) && !isTechnicalConfusion(m.text));

    let currentStage = 1;
    if (req.body?.currentStage && Number(req.body.currentStage) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.currentStage), 1), 4);
    } else if (req.body?.stage && Number(req.body.stage) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.stage), 1), 4);
    } else if (req.body?.chatStage && Number(req.body.chatStage) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.chatStage), 1), 4);
    } else if (req.body?.round && Number(req.body.round) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.round), 1), 4);
    } else {
      currentStage = Math.min(Math.max(substantiveUserMsgs.length + 1, 1), 4);
    }

    const studentProfile = req.body?.studentProfile || req.body?.userProfile || req.body?.anchor || {};
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

    // 5. TÁCH BIỆT SYSTEM PROMPT CHO TỪNG GIAI ĐOẠN ĐỘC LẬP
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
            replyText = sanitizeSocraticResponse(cleaned, currentStage, effectiveCareer, targetSchool, trimmedMsg);
            break;
          }
        }
      } catch (err) {
        // Thử model tiếp theo trong danh sách candidate
      }
    }

    // 8. Heuristic Fallback Nhận thức (Dự phòng khẩn cấp nếu API gặp sự cố)
    if (!replyText || !isCompleteSentence(replyText)) {
      const rawFallback = generateCognitiveFallback({
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
      replyText = sanitizeSocraticResponse(rawFallback, currentStage, effectiveCareer, targetSchool, trimmedMsg);
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
});

// Hỗ trợ cả endpoint /api/chat để tương thích ngược 100%
app.post('/api/chat', (req, res) => {
  req.url = '/api/socrates-chat';
  app.handle(req, res);
});

// ==============================================================================
// TÁCH BIỆT SYSTEM PROMPT CHO TỪNG GIAI ĐOẠN ĐỘC LẬP - BỘ NGUYÊN TẮC SOCRATES
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
  const recommendedCombo = getRecommendedComboForMajor(effectiveCareer, userText);

  // Chỉ thị thích ứng mục tiêu
  let adaptiveDirective = '';
  if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị') || lowerUser.includes('tin học')) {
    adaptiveDirective = `
[CHỈ DẪN KHI HỌC SINH ĐỔI Ý / NÊU NGÀNH MỚI HOẶC HỎI TỔ HỢP]:
- Ngành học sinh đang hướng tới: "${effectiveCareer}".
- AI CHỈ ĐẶT CÂU HỎI, TUYỆT ĐỐI KHÔNG GIẢNG BÀI hay khẳng định cơ chế điểm chuẩn thay học sinh.
- Ở Lượt 3: Hỏi về môn tự tin nhất và môn lo lắng nhất từ học bạ thực tế.
- Ở Lượt 4: RA LỆNH học sinh tự sang Bước 3 chọn tổ hợp có lợi nhất từ học bạ để đối chứng điểm chuẩn của ${targetSchool}.
`;
  }

  const CORE_PROMPT = `
BẠN LÀ THẦY SOCRATES - TRIẾT GIA PHẢN BIỆN HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC KỸ THUẬT (KHKT) HỌC SINH TRUNG HỌC - HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG (SOCRACAREER).
Bạn đang thực hiện phiên đối thoại phản tư 1-1 với một học sinh THPT nhằm bóc tách thiên kiến nhận thức và mỏ neo nghề nghiệp.

BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES (SOCRACAREER CORE PROMPT - BẮT BUỘC TUÂN THỦ 100%):

1. TUYỆT ĐỐI KHÔNG KHEN NGỢI QUÁ ĐÀ, KHÔNG XOA DỊU:
   - CẤM các mẫu câu tâng bốc, xoa dịu: "Thầy rất thấu hiểu", "Rất tuyệt vời", "Góc nhìn rất tiến bộ", "Thầy khen ngợi", "Thầy ủng hộ", "Rất đáng khích lệ", "vũ khí điểm số", "điểm sáng"...
   - Giữ văn phong trung tính, điềm đạm, sắc sảo của một triết gia phản biện. Không khen ngợi quá đà, không vuốt ve cảm xúc.

2. NGUYÊN TẮC PHẢN TƯ CÂN BẰNG (SOCRATIC CONSTRUCTIVE REFRAMING - BẮT BUỘC TUÂN THỦ):
   - Ghi nhận dữ kiện khách quan: Nếu học sinh đưa ra thế mạnh thực tế (ví dụ: học đều, giỏi Tiếng Anh, học tốt KTPL, tư duy logic...), hãy công nhận nền tảng đó một cách chừng mực, khách quan. Tuyệt đối không bác bỏ vô căn cứ, không chê bai dìm hàng.
   - Tránh ngôn từ mang tính phán xét, tiêu cực: CẤM TỰ SUY DIỄN học sinh "bị điểm liệt", "năng lực yếu kém", "bất tài", "chắc chắn trượt" nếu học sinh chưa khai báo. Giữ thái độ khách quan, tôn trọng sự thật và dữ liệu.
   - Chuyển hóa thách thức thành bài toán đo lường: Đặt câu hỏi hướng học sinh tự đối diện với năng lực học bạ của bản thân để chủ động đối chứng điểm chuẩn tại Bước 3.

3. QUY TẮC "MỘT CÂU HỎI ĐƠN - KHÔNG GIẢNG BÀI - KHÔNG ĐƯA ĐÁP ÁN":
   - AI CHỈ ĐẶT CÂU HỎI, TUYỆT ĐỐI KHÔNG GIẢNG BÀI hay giải thích kiến thức tuyển sinh thay học sinh.
   - Mỗi lượt phản hồi chỉ được đưa ra TỐI ĐA 1-2 CÂU VĂN NHẬN ĐỊNH và KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN RÕ RÀNG (ở Vòng 1, 2, 3). TUYỆT ĐỐI KHÔNG HỎI KÉP, KHÔNG NHỒI 2-3 Ý.
   - Tuyệt đối không tự suy diễn số liệu, không tự khẳng định cơ chế nhân hệ số hay điều kiện chuẩn của các trường cụ thể. Mọi số liệu điểm chuẩn, tổ hợp xét tuyển phải đẩy sang Bước 3 để học sinh tự tra cứu và đối chứng.

4. KỸ THUẬT BÓC TÁCH MÂU THUẪN (ELENCHUS):
   - Nếu học sinh nói mông lung: Hỏi xoáy vào bằng chứng cụ thể.
   - Nếu học sinh tự tin ảo: Đem mâu thuẫn giữa kỳ vọng và thực tế để buộc học sinh tự đối diện.

5. ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ (CHỈ Ở LƯỢT 4):
   - Ở lượt cuối cùng (Lượt 4), TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi (không có dấu ?), không tự đọc số liệu điểm chuẩn, mà ra lệnh dứt khoát:
     "Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của [Trường mục tiêu] xem độ chênh lệch thực tế là bao nhiêu."
`;

  // ● KHI currentStage === 1 (Lượt khởi đầu):
  if (stage === 1) {
    return `${CORE_PROMPT}
BỐI CẢNH VÒNG 1 (ĐỐI CHIẾU MÃ HOLLAND & ĐỘNG CƠ CHỌN NGÀNH):
- Nhóm thiên hướng Holland: ${hollandCode}
- Ngành mong muốn: ${targetCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Mức tự tin ban đầu: ${initialConfidence}/10
- Lý do chọn ngành: "${reason}"

[NHIỆM VỤ LƯỢT 1]:
1. Đối thoại tối đa 2 câu văn trung tính, điềm đạm.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà, không xoa dịu.
- TUYỆT ĐỐI KHÔNG nói về thu nhập, điểm chuẩn, tổ hợp môn hay Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  // ● KHI currentStage === 2 (Lượt thách thức việc làm & thu nhập):
  if (stage === 2) {
    return `${CORE_PROMPT}
BỐI CẢNH VÒNG 2 (BÓC TÁCH MÂU THUẪN GIỮA KỲ VỌNG THU NHẬP & NĂNG LỰC THỰC TẾ):
- Ngành: ${targetCareer}, trường: ${targetSchool}.
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2 - QUY TẮC CÂU HỎI ĐƠN]:
1. Phản hồi ngắn gọn (tối đa 1-2 câu), tập trung vào sự chênh lệch giữa kỳ vọng thu nhập và năng lực thực tế.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN (TUYỆT ĐỐI KHÔNG HỎI KÉP, KHÔNG NHỒI 2-3 Ý):
"Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập ${expectedIncome} ngay khi em vừa tốt nghiệp?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG hỏi dồn 2-3 ý (không nhồi nhét tự động hóa, kỳ vọng gia đình và năng lực cùng lúc).
- TUYỆT ĐỐI KHÔNG giảng bài, không khen ngợi quá đà hay xoa dịu.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  // ● KHI currentStage === 3 (Lượt đối chất tổ hợp môn & học lực thực tế):
  if (stage === 3) {
    return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH VÒNG 3 (BÓC TÁCH MÂU THUẪN HỌC LỰC & MÔN XÉT TUYỂN):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Học sinh vừa phản hồi: "${userText}"

[NHIỆM VỤ LƯỢT 3 - TUÂN THỦ NGUYÊN TẮC CHỈ HỎI, KHÔNG GIẢNG BÀI]:
1. Ghi nhận chừng mực thế mạnh hoặc băn khoăn của học sinh nếu có. Tuyệt đối không phán xét tiêu cực.
2. TUYỆT ĐỐI KHÔNG GIẢNG BÀI về chương trình GDPT 2018, không tự phỏng đoán nhân hệ số 2 hay điều kiện chuẩn của trường (vì mỗi trường có đề án riêng).
3. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN để học sinh tự soi lại năng lực học bạ của mình:
"Để xét tuyển vào ngành ${effectiveCareer} tại ${targetSchool}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG giảng giải lý thuyết tuyển sinh hay phân tích đề án trường. Mọi số liệu để học sinh tự tra ở Bước 3.
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà hay xoa dịu.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 ở lượt này.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  // ● KHI currentStage === 4 (Lượt kết thúc & Điều hướng Bước 3 tự chủ):
  return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH VÒNG 4 (BÓC TÁCH MÂU THUẪN TUYỂN SINH & ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Học sinh vừa trả lời về môn học: "${userText}"

[NHIỆM VỤ LƯỢT 4 - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ]:
1. Đưa ra đúng 1 câu nhận định trung tính: Việc tự tin ở môn thế mạnh là điểm tựa tốt, nhưng điểm chuẩn cạnh tranh vào ngành ${effectiveCareer} tại ${targetSchool} đòi hỏi sự chắc chắn của toàn bộ tổ hợp xét tuyển thực tế.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC (TUYỆT ĐỐI KHÔNG CÓ DẤU ? VÀ KHÔNG NHẮC ĐẾN HỌC PHÍ):
"Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- TUYỆT ĐỐI KHÔNG nhắc đến "học phí", "học phí tự chủ" (Bước 3 chỉ tra cứu điểm chuẩn, tổ hợp và chỉ tiêu).
- TUYỆT ĐỐI KHÔNG giảng bài hay khen ngợi quá đà.
- Toàn bộ phản hồi chỉ gồm 2 câu văn dứt khoát.${avoidRepetition}`;
}

// ==============================================================================
// HÀM FALLBACK NHẬN THỨC CHUẨN BỘ NGUYÊN TẮC SOCRATES
// ==============================================================================
function generateCognitiveFallback({ stage, targetCareer, effectiveCareer: propEffective, isShifted: propShifted, targetSchool, hollandCode, reason, initialConfidence, expectedIncome, trimmedMsg }) {
  const goalShift = detectGoalShift(trimmedMsg);
  const isShifted = propShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = propEffective || (goalShift ? goalShift.newMajor : targetCareer);

  if (stage === 1) {
    return `Em đã chọn ngành ${effectiveCareer} tại ${targetSchool} với lý do: '${reason}'. Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
  }

  if (stage === 2) {
    return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập đó ngay khi em vừa tốt nghiệp?`;
  }

  if (stage === 3) {
    return `Để xét tuyển vào ngành ${effectiveCareer} tại ${targetSchool}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;
  }

  // Stage 4
  const lowerUser = (trimmedMsg || '').toLowerCase();
  const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');
  const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);

  if (isBalancedGrades) {
    return `Học đều các môn là một nền tảng tốt, nhưng điểm chuẩn vào ngành ${effectiveCareer} tại ${targetSchool} đòi hỏi điểm số bứt phá ở tổ hợp xét tuyển. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
  }

  if (strongSubject && weakSubject) {
    return `Thế mạnh ở môn ${strongSubject} là điểm tựa tốt, nhưng môn ${weakSubject} nếu chưa đạt yêu cầu sẽ là rào cản khi xét tuyển vào ngành ${effectiveCareer} tại ${targetSchool}. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
  }

  if (strongSubject && !weakSubject) {
    return `Môn ${strongSubject} là một điểm tựa, nhưng điểm chuẩn ngành ${effectiveCareer} tại ${targetSchool} đòi hỏi cả tổ hợp xét tuyển phải đạt ngưỡng an toàn. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
  }

  return `Để biết năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${effectiveCareer} tại ${targetSchool} hay không, em cần đối chứng với dữ liệu thực tế. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SocraCareer KHKT] Server AI Socrates đang vận hành tại cổng ${PORT}`);
});

module.exports = {
  getRecommendedComboForMajor,
  sanitizeSocraticResponse,
  getStageSystemPrompt,
  generateCognitiveFallback
};� của em! Việc em tự nhìn nhận lại năng lực và chủ động hướng sang ngành **Sư phạm Giáo dục Chính trị** (đào tạo giáo viên dạy môn KTPL và GDCD) là một quyết định rất đáng khích lệ khi em nhận ra thế mạnh của mình.\n\n` +
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[VISEF 2026] Server AI Socrates (CommonJS) đang vận hành tại cổng ${PORT}`);
});
