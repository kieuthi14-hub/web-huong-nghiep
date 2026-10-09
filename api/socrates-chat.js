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

export function getRecommendedComboForMajor(majorName, userText = '') {
  const m = (majorName || '').toLowerCase();
  const u = (userText || '').toLowerCase();

  if (m.includes('chính trị') || m.includes('công dân') || u.includes('ktpl') || u.includes('chính trị')) {
    return 'C19 (Văn - Sử - KTPL) hoặc C00';
  }
  if (u.includes('toán') && u.includes('lý') && u.includes('anh')) {
    return 'Toán - Lý - Anh';
  }
  if (u.includes('toán') && u.includes('văn') && u.includes('anh')) {
    return 'Toán - Văn - Anh';
  }
  if (m.includes('toán') || m.includes('vật lý') || m.includes('hóa') || m.includes('kỹ thuật') || m.includes('công nghệ') || m.includes('cntt') || m.includes('tin học')) {
    if (u.includes('anh') || u.includes('tiếng anh')) return 'Toán - Lý - Anh';
    return 'Toán - Lý - Hóa hoặc Toán - Lý - Anh';
  }
  if (m.includes('văn') || m.includes('sử') || m.includes('địa') || m.includes('xã hội')) {
    return 'Văn - Sử - Địa hoặc Văn - Sử - Anh';
  }
  if (m.includes('kinh tế') || m.includes('quản trị') || m.includes('marketing') || m.includes('tài chính') || m.includes('ngân hàng') || m.includes('luật')) {
    return 'Toán - Văn - Anh hoặc Toán - Lý - Anh';
  }
  if (m.includes('ngôn ngữ') || m.includes('tiếng')) {
    return 'Toán - Văn - Anh hoặc Văn - Sử - Anh';
  }
  if (m.includes('y') || m.includes('dược') || m.includes('sinh')) {
    return 'Toán - Hóa - Sinh';
  }
  return 'Toán - Lý - Anh';
}

export function sanitizeSocraticResponse(rawText, round, effectiveCareer, targetSchool, userText = '') {
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
    // NGUYÊN TẮC 4: Ở LƯỢT CUỐI CÙNG, RA LỆNH CHO HỌC SINH TỰ BƯỚC SANG BƯỚC 3 TRA CỨU
    const standardDirective = `Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${school} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;

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
        intro = `Học đều các môn là một nền tảng học thuật thuận lợi, nhưng điểm chuẩn vào ngành ${major} tại ${school} thường đòi hỏi tổng điểm tổ hợp xét tuyển (${combo}) phải đủ sức bứt phá trước tỷ lệ chọi thực tế.`;
      } else if (strongSubject && weakSubject) {
        intro = `Có thế mạnh ở môn ${strongSubject} là một điểm tựa tốt, nhưng môn ${weakSubject} nếu còn khoảng cách sẽ tạo rủi ro kéo tụt điểm chuẩn vào ngành ${major} tại ${school}.`;
      } else if (strongSubject) {
        intro = `Thế mạnh ở môn ${strongSubject} là một lợi thế khách quan, tuy nhiên ngưỡng điểm chuẩn ngành ${major} tại ${school} đòi hỏi cả 3 môn trong tổ hợp ${combo} đều phải đạt mức an toàn cạnh tranh.`;
      } else {
        intro = `Ngành ${major} tại ${school} đòi hỏi điểm số cạnh tranh của các môn trong tổ hợp xét tuyển (${combo}), việc chỉ dựa vào một môn sở trường sẽ tiềm ẩn rủi ro nếu các môn còn lại chưa đủ vững.`;
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
        cleaned += ` Trong bối cảnh AI và tự động hóa cạnh tranh gay gắt, em dựa vào năng lực chuyên môn vượt trội nào để nhà tuyển dụng trả cho em mức thu nhập kỳ vọng đó ngay khi mới tốt nghiệp?`;
      } else if (round === 3) {
        cleaned += ` Nhìn lại học bạ thực tế, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em đang thấy lo lắng, đuối sức nhất?`;
      }
    }

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) {
      const lastQ = sentences[sentences.length - 1];
      const prevSentences = sentences.slice(0, 2).join(' ');
      cleaned = `${prevSentences} ${lastQ}`;
    }
    return cleaned.trim();
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
}

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
  if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị')) {
    adaptiveDirective = `
[CHỈ DẪN KHI HỌC SINH ĐỔI Ý / NÊU NGÀNH MỚI HOẶC HỎI TỔ HỢP]:
- Ngành học sinh đang hướng tới: "${effectiveCareer}".
- Tổ hợp xét tuyển tham chiếu: ${recommendedCombo}.
- Tuân thủ Nguyên tắc phản tư cân bằng: Công nhận chừng mực thế mạnh học sinh vừa nêu (như KTPL, Văn, Sử...). Tuyệt đối không phán xét tiêu cực ("điểm liệt", "yếu kém").
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà hay xoa dịu. Không tự vạch ra các Tầng 1, Tầng 2, Tầng 3.
- Ở Lượt 3: Đối chất mâu thuẫn giữa yêu cầu tổ hợp ${recommendedCombo} và học lực thực tế.
- Ở Lượt 4: Nhận định rủi ro chênh lệch điểm chuẩn và RA LỆNH học sinh tự sang Bước 3 tra cứu tổ hợp ${recommendedCombo} của ${targetSchool}.
`;
  }

  const CORE_PROMPT = `
BẠN LÀ THẦY SOCRATES - TRIẾT GIA PHẢN BIỆN HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC CBAS (VISEF 2026).
Bạn đang thực hiện phiên đối thoại phản tư 1-1 với một học sinh THPT nhằm bóc tách thiên kiến nhận thức và mỏ neo nghề nghiệp.

BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES (SOCRACAREER CORE PROMPT - BẮT BUỘC TUÂN THỦ 100%):

1. TUYỆT ĐỐI KHÔNG KHEN NGỢI QUÁ ĐÀ, KHÔNG XOA DỊU:
   - CẤM các mẫu câu tâng bốc, xoa dịu: "Thầy rất thấu hiểu", "Rất tuyệt vời", "Góc nhìn rất tiến bộ", "Thầy khen ngợi", "Thầy ủng hộ", "Rất đáng khích lệ", "vũ khí điểm số", "điểm sáng"...
   - Giữ văn phong trung tính, điềm đạm, sắc sảo của một triết gia phản biện. Không khen ngợi quá đà, không vuốt ve cảm xúc.

2. NGUYÊN TẮC PHẢN TƯ CÂN BẰNG (SOCRATIC CONSTRUCTIVE REFRAMING - BẮT BUỘC TUÂN THỦ):
   - Ghi nhận dữ kiện khách quan: Nếu học sinh đưa ra thế mạnh thực tế (ví dụ: học đều, giỏi Tiếng Anh, học tốt KTPL, tư duy logic...), hãy công nhận nền tảng đó một cách chừng mực, khách quan. Tuyệt đối không bác bỏ vô căn cứ, không chê bai dìm hàng.
   - Tránh ngôn từ mang tính phán xét, tiêu cực: CẤM TỰ SUY DIỄN học sinh "bị điểm liệt", "năng lực yếu kém", "bất tài", "chắc chắn trượt" nếu học sinh chưa khai báo. Giữ thái độ khách quan, tôn trọng sự thật và dữ liệu.
   - Chuyển hóa thách thức thành bài toán đo lường: Đặt câu hỏi hướng học sinh dùng chính thế mạnh của mình để đối chiếu với tiêu chuẩn khắt khe của ngành (điểm chuẩn 3 năm, tỉ lệ chọi tuyển sinh), tạo động lực để học sinh chủ động tra cứu ở Bước 3.

3. QUY TẮC "MỘT CÂU HỎI TRUY VẤN - KHÔNG ĐƯA ĐÁP ÁN":
   - Mỗi lượt phản hồi chỉ được đưa ra TỐI ĐA 2-3 CÂU VĂN và KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN (ở Vòng 1, 2, 3).
   - Tuyệt đối không giải thích thay, KHÔNG vạch sẵn chiến lược thay học sinh (CẤM đưa ra các tầng nấc Tầng 1, Tầng 2, Tầng 3).

4. KỸ THUẬT BÓC TÁCH MÂU THUẪN (ELENCHUS):
   - Nếu học sinh nói mông lung: Hỏi xoáy vào bằng chứng cụ thể.
   - Nếu học sinh tự tin ảo: Đem mâu thuẫn giữa kỳ vọng và thực tế để buộc học sinh tự đối diện.

5. ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ (CHỈ Ở LƯỢT 4):
   - Ở lượt cuối cùng (Lượt 4), TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi (không có dấu ?), không tự đọc số liệu điểm chuẩn, mà ra lệnh dứt khoát:
     "Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp [Tổ hợp môn] của [Trường mục tiêu] 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu."
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
BỐI CẢNH VÒNG 2 (BÓC TÁCH MÂU THUẪN THU NHẬP & KỶ NGUYÊN AI):
- Ngành: ${targetCareer}, trường: ${targetSchool}.
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2]:
1. Phản hồi tối đa 2 câu văn trung tính, bóc tách mâu thuẫn giữa kỳ vọng ${expectedIncome} và áp lực cạnh tranh.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Trong bối cảnh AI và tự động hóa cạnh tranh gay gắt, em dựa vào năng lực chuyên môn vượt trội nào để nhà tuyển dụng trả cho em mức thu nhập đó ngay khi mới tốt nghiệp?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà hay xoa dịu.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  // ● KHI currentStage === 3 (Lượt đối chất tổ hợp môn & học lực thực tế):
  if (stage === 3) {
    return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH VÒNG 3 (BÓC TÁCH MÂU THUẪN TỔ HỢP MÔN & HỌC LỰC THỰC TẾ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Tổ hợp môn tham chiếu: ${recommendedCombo}
- Học sinh vừa phản hồi: "${userText}"

[NHIỆM VỤ LƯỢT 3 - ÁP DỤNG NGUYÊN TẮC PHẢN TƯ CÂN BẰNG]:
1. Nếu học sinh nêu thế mạnh (học đều, giỏi Tiếng Anh, giỏi KTPL...): Hãy công nhận nền tảng đó một cách chừng mực, khách quan. Tuyệt đối không phán xét tiêu cực ("điểm liệt", "yếu kém").
2. Chuyển hóa thách thức thành bài toán đo lường: Đặt câu hỏi đối chiếu với sự khắt khe của ngưỡng điểm tuyển sinh ${recommendedCombo} tại ${targetSchool}.
3. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${effectiveCareer} tại ${targetSchool}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà hay xoa dịu.
- TUYỆT ĐỐI KHÔNG đưa ra kết luận hay vạch sẵn chiến lược Tầng 1, 2, 3.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  // ● KHI currentStage === 4 (Lượt kết thúc & Điều hướng Bước 3 tự chủ):
  return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH VÒNG 4 (BÓC TÁCH MÂU THUẪN TUYỂN SINH & ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Tổ hợp xét tuyển tham chiếu: ${recommendedCombo}
- Học sinh vừa trả lời về môn học: "${userText}"

[NHIỆM VỤ LƯỢT 4 - BẮT BUỘC TUÂN THỦ NGUYÊN TẮC 4 & NGUYÊN TẮC CÂN BẰNG]:
1. Đưa ra đúng 1-2 câu nhận định trung tính: Công nhận chừng mực thế mạnh học sinh vừa nêu (học đều, giỏi môn sở trường...), tránh phán xét tiêu cực, chỉ ra thách thức cạnh tranh điểm chuẩn tổ hợp ${recommendedCombo} tại ${targetSchool}.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC:
"Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${recommendedCombo} của ${targetSchool} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà ("Rất tuyệt vời...", "Thầy khen ngợi...").
- TUYỆT ĐỐI KHÔNG dùng từ phán xét tiêu cực ("điểm liệt", "năng lực yếu kém").
- TUYỆT ĐỐI KHÔNG vạch sẵn chiến lược thay học sinh (CẤM đưa ra Tầng 1, Tầng 2, Tầng 3).
- Toàn bộ phản hồi chỉ gồm 2 đến 3 câu văn dứt khoát.${avoidRepetition}`;
}

// ==============================================================================
// HÀM FALLBACK NHẬN THỨC CHUẨN BỘ NGUYÊN TẮC SOCRATES
// ==============================================================================
function generateCognitiveFallback({ stage, targetCareer, effectiveCareer: propEffective, isShifted: propShifted, targetSchool, hollandCode, reason, initialConfidence, expectedIncome, trimmedMsg }) {
  const goalShift = detectGoalShift(trimmedMsg);
  const isShifted = propShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = propEffective || (goalShift ? goalShift.newMajor : targetCareer);
  const combo = getRecommendedComboForMajor(effectiveCareer, trimmedMsg);

  if (stage === 1) {
    return `Em đã chọn ngành ${effectiveCareer} tại ${targetSchool} với lý do: '${reason}'. Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
  }

  if (stage === 2) {
    return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Trong bối cảnh AI và tự động hóa cạnh tranh gay gắt, em dựa vào năng lực chuyên môn vượt trội nào để nhà tuyển dụng trả cho em mức thu nhập đó ngay khi mới tốt nghiệp?`;
  }

  if (stage === 3) {
    return `Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${effectiveCareer} tại ${targetSchool}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?`;
  }

  // Stage 4
  const lowerUser = (trimmedMsg || '').toLowerCase();
  const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');
  const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);

  if (isBalancedGrades) {
    return `Học đều các môn là một nền tảng học thuật thuận lợi, nhưng điểm chuẩn vào ngành ${effectiveCareer} tại ${targetSchool} thường đòi hỏi tổng điểm tổ hợp xét tuyển (${combo}) phải đủ sức bứt phá trước tỷ lệ chọi thực tế. Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${targetSchool} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
  }

  if (strongSubject && weakSubject) {
    return `Có thế mạnh ở môn ${strongSubject} là một điểm tựa tốt, nhưng môn ${weakSubject} nếu còn khoảng cách sẽ tạo rủi ro kéo tụt điểm chuẩn vào ngành ${effectiveCareer} tại ${targetSchool}. Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${targetSchool} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
  }

  if (strongSubject && !weakSubject) {
    return `Thế mạnh ở môn ${strongSubject} là một lợi thế khách quan, tuy nhiên ngưỡng điểm chuẩn ngành ${effectiveCareer} tại ${targetSchool} đòi hỏi cả 3 môn trong tổ hợp ${combo} đều phải đạt mức an toàn cạnh tranh. Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${targetSchool} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
  }

  return `Ngành ${effectiveCareer} tại ${targetSchool} thường có điểm chuẩn cạnh tranh và đòi hỏi điểm số đồng đều của các môn trong tổ hợp xét tuyển (${combo}). Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${targetSchool} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
}
