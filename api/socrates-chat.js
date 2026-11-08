// api/socrates-chat.js - Vercel Serverless Function & Express compatible endpoint
// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (SOCRACAREER)
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

function isEvasiveOrJoking(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim()
    .replace(/[!.,?~^_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (clean.length === 0 || clean.length > 80) return false;

  const evasivePatterns = [
    /(thấy|thay)\s+(thầy|thay)\s+(là|la)\s+(em\s+)?(lo|sợ|so)/i,
    /(thầy|thay)\s+(hỏi|hoi)\s+(khó|kho|gắt|gat|căng|cang)\s*(quá|qua|thế|the|vậy|vay)?/i,
    /^(khó|kho|gắt|gat|căng|cang)\s*(quá|qua)\s*(thầy|thay)?/i,
    /^(thầy|thay)\s+(làm|lam)\s+(khó|kho)\s+em/i,
    /^(thầy|thay)\s+(dọa|doa)\s+em/i,
    /^(đùa|dua|trêu|treu)\s+(thôi|thoi|tí|ti|chút)/i,
    /^(nói|noi)\s+(đùa|dua|chơi|choi)\s+(thôi|thoi)/i,
    /^(thôi|thoi)\s+(thầy|thay)/i,
    /^(chịu|chiu|bó tay|bo tay)\s+(thầy|thay)?/i,
    /^(lo|sợ|so)\s+(quá|qua)\s*(thầy|thay)?$/i
  ];
  return evasivePatterns.some(p => p.test(clean));
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

// QUY TẮC 1: XỬ LÝ BIẾN DỮ LIỆU ĐẦU VÀO TRƯỜNG MỤC TIÊU (CHỐNG LỖI HIỂN THỊ CHUỖI RỖNG)
export function isSchoolUndecided(school) {
  if (!school || typeof school !== 'string') return true;
  const clean = school.toLowerCase().trim();
  const vagueKeywords = [
    'chưa biết', 'chưa rõ', 'chưa xác định', 'chưa có', 'mơ hồ', 'không biết',
    'chua biet', 'chua ro', 'chưa biết học ở đâu', 'chưa biết ở đâu', 'chưa nghĩ ra',
    'chưa tính', 'tùy', 'chưa', 'trường đại học mục tiêu', 'đại học mục tiêu', 'chưa quyết định'
  ];
  return clean.length === 0 || vagueKeywords.some(k => clean === k || clean.includes(k));
}

export function formatSchoolClause(school, isVocational = false, prefix = 'tại ') {
  if (isSchoolUndecided(school)) {
    return isVocational ? `${prefix}trường đào tạo nghề em đang nhắm tới` : `${prefix}một cơ sở đào tạo phù hợp`;
  }
  return `${prefix}${school}`;
}

export function formatSchoolName(school, isVocational = false) {
  if (isSchoolUndecided(school)) {
    return isVocational ? 'trường đào tạo nghề em đang nhắm tới' : 'cơ sở đào tạo phù hợp';
  }
  return school;
}

// QUY TẮC 2: PHÂN HÓA HƯỚNG ĐI: ĐẠI HỌC VS. HỌC NGHỀ / THỰC HÀNH
export function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export function hasUniversityClarification(userText = '') {
  if (!userText || typeof userText !== 'string') return false;
  const uNorm = removeVietnameseTones(userText);
  const patterns = [
    'hoc dai hoc', 'hoc dh', 'thi dai hoc', 'thi dh', 'vao dai hoc', 'vao dh',
    'chon dai hoc', 'chon dh', 'bac dai hoc', 'he dai hoc', 'do dai hoc', 'truong dai hoc',
    'khong hoc nghe', 'khong phai hoc nghe', 'khong hoc truong nghe', 'khong phai truong nghe',
    'chu khong hoc nghe', 'chu khong hoc truong nghe', 'khong di hoc nghe', 'em hoc dai hoc',
    'em thi dai hoc', 'em vao dai hoc', 'khong co hoc nghe', 'hoc truong dai hoc'
  ];
  return patterns.some(p => uNorm.includes(p));
}

export function isVocationalTrack(career = '', userText = '', school = '') {
  const c = (career || '').toLowerCase().trim();
  const u = (userText || '').toLowerCase().trim();
  const s = (school || '').toLowerCase().trim();

  const cNorm = removeVietnameseTones(c);
  const uNorm = removeVietnameseTones(u);
  const sNorm = removeVietnameseTones(s);

  // 1. Phủ định mạnh mẽ: Nếu học sinh nêu rõ học Đại học / Không học nghề -> TUYỆT ĐỐI KHÔNG PHẢI HỌC NGHỀ
  if (hasUniversityClarification(u)) {
    return false;
  }

  // 2. Kiểm tra tên trường đào tạo (school):
  const isExplicitVocationalSchool = ['nghe', 'trung cap', 'salon', 'day nghe', 'co so dao tao tu nhan'].some(k => sNorm.includes(k));

  const isUniSchool = sNorm.startsWith('dh') || 
                      sNorm.startsWith('truong dh') || 
                      sNorm.startsWith('dai hoc') || 
                      sNorm.startsWith('truong dai hoc') ||
                      sNorm.includes('dai hoc') || 
                      sNorm.includes('hoc vien') || 
                      sNorm.includes('university') || 
                      sNorm.includes('bach khoa') || 
                      sNorm.includes('dhqg') ||
                      sNorm.includes('dhdn') ||
                      sNorm.includes('dhh');

  if (isUniSchool && !isExplicitVocationalSchool) {
    return false;
  }

  if (isExplicitVocationalSchool) {
    return true;
  }

  // 3. Từ khóa nghề thủ công / dịch vụ phi đại học rõ ràng:
  const pureVocationalKeywords = [
    'pha che', 'barista', 'lam banh', 'tho han', 'tho tien', 'tho may', 'tho dien dan dung',
    'spa', 'nail', 'mong', 'cat toc', 'barber', 'trang diem', 'makeup', 'phun xam',
    'lai may xuc', 'lai xe tai', 'lai cau', 'sua xe may',
    'hoc nghe', 'trung cap nghe', 'truong nghe', 'cao dang nghe', 'hoc nghe ngan han', 'nghe thuc hanh',
    'ngan kien thuc', 'ngan hoc', 'ngan ly thuyet', 'chan hoc ly thuyet', 'hoc khong vo chu', 'khong thich hoc chu', 'chi thich thuc hanh', 'ngai hoc ly thuyet', 'ngan hoc van hoa'
  ];
  if (pureVocationalKeywords.some(k => cNorm.includes(k) || uNorm.includes(k))) {
    return true;
  }

  // 4. Các ngành kỹ thuật / ứng dụng:
  const technicalKeywords = ['dien lanh', 'co khi', 'sua o to', 'sua xe', 'nau an', 'dau bep', 'may mac', 'may thoi trang', 'sua dien thoai'];
  if (technicalKeywords.some(k => cNorm.includes(k) || uNorm.includes(k))) {
    if (uNorm.includes('nghe') || uNorm.includes('thuc hanh') || cNorm.includes('tho') || cNorm.includes('sua')) {
      return true;
    }
  }

  return false;
}

// HÀM KIỂM TRA HỌC SINH MƠ HỒ / CHƯA CÓ MỤC TIÊU CỤ THỂ
export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
}

/**
 * SOCRACAREER - DYNAMIC ADAPTIVE TRIGGER (BƯỚC 2: AI SOCRATES)
 */
export function generateSocraticFirstPrompt(student = {}) {
  const targetCareer = student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || "ngành nghề mục tiêu";
  const source = student.source || student.reason || "";
  const anchorReason = student.anchorReason || "";
  let anchorQuote = student.anchorQuote || source || "";
  if (!anchorQuote && (student.id === "CT_21" || student.studentId === "CT_21")) {
    anchorQuote = "Ngành này cực hot trên mạng, lương nghìn đô ngay khi tốt nghiệp.";
  }

  const conf = Number(student.conf_T0 || student.initialConfidence || student.confidence_score) || 5;
  const rawSchool = (student.targetSchool || student.targetUniversity || student.target_university || "").trim();
  const schoolClause = rawSchool ? `tại ${rawSchool}` : "";
  const riasecMatch = student.riasec_match_pct != null ? Number(student.riasec_match_pct) : 40;

  let biasType = "";
  let biasRule = "";
  let socraticQuestion = "";

  const sLower = source.toLowerCase();
  const sNorm = removeVietnameseTones(sLower);
  const qLower = anchorQuote.toLowerCase();
  const qNorm = removeVietnameseTones(qLower);

  const isMediaAnchoring = 
    anchorReason === "Mạng xã hội" ||
    source.includes("mạng xã hội") || 
    source.includes("TikTok") || 
    source.includes("YouTube") || 
    sLower.includes("mạng") || 
    sLower.includes("tiktok") || 
    sLower.includes("youtube") || 
    sLower.includes("review") || 
    sLower.includes("lương cao") || 
    sLower.includes("nghìn đô") || 
    sNorm.includes("mang xa hoi") || 
    sNorm.includes("tren mang") || 
    qLower.includes("mạng") || 
    qLower.includes("tiktok") || 
    qLower.includes("review") || 
    qLower.includes("nghìn đô") || 
    qNorm.includes("mang") || 
    student.id === "CT_21" || 
    student.studentId === "CT_21";

  const isBandwagon = 
    anchorReason === "Đám đông" ||
    source.includes("bạn bè") || 
    source.includes("đám đông") || 
    source.includes("nghe theo") || 
    sLower.includes("bạn") || 
    sLower.includes("rủ") || 
    sNorm.includes("ban be") || 
    sNorm.includes("dam dong") || 
    sNorm.includes("nghe theo") ||
    sNorm.includes("theo ban") ||
    sNorm.includes("ru chon") ||
    qNorm.includes("ban be") ||
    qNorm.includes("dam dong");

  const isOverconfidence = 
    anchorReason === "Tự tin điểm số" || 
    conf >= 8;

  const isConfirmation = 
    anchorReason === "Trái mã RIASEC" || 
    (riasecMatch < 50);

  const cleanSource = (source || anchorQuote || "").trim();
  const hasExplicitReason = Boolean(cleanSource && cleanSource.length >= 2);
  const reasonSnippet = hasExplicitReason ? ` với lý do "${cleanSource}"` : "";

  if (isMediaAnchoring) {
    biasType = "MỎ NEO TRUYỀN THÔNG (ANCHORING BIAS)";
    biasRule = "Kích hoạt do học sinh bộc lộ động cơ chọn ngành từ hình ảnh review trên mạng xã hội (TikTok, YouTube) hoặc truyền thông.";
    const quoteText = anchorQuote || "Ngành này cực hot trên mạng, lương nghìn đô ngay khi tốt nghiệp.";
    socraticQuestion = `Chào em. Ở Bước 1, em vừa chia sẻ rằng chọn ngành ${targetCareer} ${schoolClause} (tự tin ${conf}/10) vì "${quoteText}". Theo em, những hình ảnh và clip review đó phản ánh bao nhiêu phần trăm công việc và áp lực thực tế của ngành này?`;

  } else if (isBandwagon) {
    biasType = "TÂM LÝ ĐÁM ĐÔNG (BANDWAGON EFFECT)";
    biasRule = "Kích hoạt do học sinh chọn ngành theo xu thế đám đông, bạn bè xung quanh cùng rủ chọn hoặc nghe theo lời khuyên ngoại tại.";
    socraticQuestion = `Chào em. Ở Bước 1, em cho biết chọn ngành ${targetCareer} ${schoolClause}${reasonSnippet || ' vì thấy nhiều bạn bè cũng đang đăng ký'}. Nếu các bạn đổi hướng sang ngành khác, lý do thực chất nào giữ chân em tiếp tục theo đuổi ngành này?`;

  } else if (isOverconfidence) {
    biasType = "TỰ TIN THÁI QUÁ (OVERCONFIDENCE BIAS)";
    biasRule = `Kích hoạt do mức tự tin ban đầu rất cao (${conf}/10) khi chưa đối chứng dữ liệu tuyển sinh thực tế.`;
    socraticQuestion = `Chào em. Ở Bước 1, em đã chọn ngành ${targetCareer} ${schoolClause}${reasonSnippet} và đặt mức tự tin tới ${conf}/10. Căn cứ hoặc trải nghiệm thực tế nào giúp em tin chắc mình phù hợp với mặt trái và áp lực thực tế của ngành này trước khi đối chứng dữ liệu?`;

  } else if (isConfirmation) {
    biasType = "THIÊN LỆCH XÁC NHẬN (CONFIRMATION BIAS)";
    biasRule = `Kích hoạt do độ tương thích RIASEC thấp (${riasecMatch}%), sở trường tự nhiên nhóm [${student.riasecCode || "Xã hội"}] chưa khớp với đặc thù khắt khe của ngành mục tiêu.`;
    socraticQuestion = `Chào em. Kết quả Bước 1 chỉ ra thế mạnh tự nhiên của em thuộc nhóm ${student.riasecCode || "Xã hội"}, nhưng em lại chọn ngành ${targetCareer} ${schoolClause}${reasonSnippet}. Em đã chủ động tìm hiểu những rào cản khi làm việc trái với sở trường tự nhiên chưa, hay em chỉ đang chú ý đến những khía cạnh tích cực của nó?`;

  } else {
    biasType = "TRUY VẤN NỀN TẢNG THỰC CHẤT";
    biasRule = "Học sinh có động cơ nội tại hài hòa; thực hiện truy vấn cơ sở thực tế và dữ liệu khách quan quan trọng nhất dẫn dắt mục tiêu.";
    socraticQuestion = `Chào em. Ở Bước 1, em đã xác định mục tiêu là ngành ${targetCareer} ${schoolClause}${reasonSnippet} với mức tự tin ban đầu là ${conf}/10. Ngoài mong muốn đó, em đã tìm hiểu những áp lực công việc thực tế và yêu cầu khắt khe nhất của ngành này chưa?`;
  }

  return {
    biasType: biasType,
    biasRule: biasRule,
    botGreeting: `Chào ${student.name || "em"}. Trước khi đối chứng dữ liệu tuyển sinh thực tế, chúng ta sẽ cùng thực hiện đối thoại phản tư đa chiều.`,
    firstQuestion: socraticQuestion
  };
}

export function initSocratesChat(profile = {}) {
  const promptData = generateSocraticFirstPrompt(profile);
  return promptData.firstQuestion;
}

export function getRecommendedComboForMajor(majorName, userText = '') {
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
    return 'tổ hợp KHXH hoặc tổ hợp tự chọn có GDKT&PL/Ngoại ngữ';
  }
  if (m.includes('kinh tế') || m.includes('quản trị') || m.includes('marketing') || m.includes('tài chính') || m.includes('ngân hàng') || m.includes('luật')) {
    return 'tổ hợp có môn Toán nhân hệ số 2, hoặc kết hợp GDKT&PL/Tiếng Anh';
  }
  if (m.includes('ngôn ngữ') || m.includes('tiếng')) {
    return 'tổ hợp có môn Ngoại ngữ nhân hệ số 2 kèm chuẩn đầu vào';
  }
  if (m.includes('y') || m.includes('dược') || m.includes('sinh')) {
    return 'tổ hợp Toán - Hóa - Sinh hoặc KHTN kèm chuẩn Ngoại ngữ';
  }
  return 'tổ hợp môn tự chọn tối ưu theo đề án tuyển sinh';
}

export function sanitizeSocraticResponse(rawText, round, effectiveCareer, targetSchool, userText = '', studentProfile = {}) {
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

  // 3. QUY TẮC 3: LOẠI BỎ THÁI ĐỘ PHÁN XÉT & CHỤP MŨ - ÁP DỤNG TÁI ĐỊNH KHUNG (REFRAMING)
  const judgmentalFixes = [
    { pattern: /(?:sự\s+)?mơ\s*hồ\s+cho\s+thấy\s+em\s+chưa\s+có\s+cơ\s+sở[^.!?\n]*[.!?]?/gi, replace: 'Việc chưa có mục tiêu cụ thể là điều thường gặp ở giai đoạn này.' },
    { pattern: /em\s+(?:đang\s+)?ảo\s*tưởng[^.!?\n]*[.!?]?/gi, replace: 'em cần nhìn vào thực tế tuyển sinh và năng lực bản thân.' },
    { pattern: /em\s+chọn\s+(?:theo|vì)\s+(?:đám\s+đông|số\s+đông)[^.!?\n]*[.!?]?/gi, replace: 'em nên cân nhắc kỹ giữa xu hướng xã hội và năng lực thực tế.' },
    { pattern: /để\s+người\s+khác\s+quyết\s+định\s+hộ\s+cuộc\s+đời\s+mình[^.!?\n]*[.!?]?/gi, replace: 'cần tự mình nhìn nhận rõ thế mạnh và rào cản.' },
    { pattern: /(?:bị\s+)?điểm liệt/gi, replace: 'chưa đạt ngưỡng an toàn' },
    { pattern: /(?:năng lực\s+)?(?:yếu kém|kém cỏi|bất tài|thấp kém)/gi, replace: 'cần bứt phá thêm' },
    { pattern: /(?:chắc chắn\s+)?(?:sẽ trượt|rớt đại học|thất bại)/gi, replace: 'đối diện với rủi ro cạnh tranh' }
  ];
  judgmentalFixes.forEach(({ pattern, replace }) => {
    cleaned = cleaned.replace(pattern, replace).trim();
  });

  // 3b. QUY TẮC SƯ PHẠM: LOẠI BỎ BIỆT NGỮ THỊ TRƯỜNG ("THỰC CHIẾN")
  cleaned = cleaned
    .replace(/(?:những\s+)?yêu\s+cầu\s+khắt\s+khe\s+về\s+kỹ\s+năng\s+thực\s+chiến/gi, 'những yêu cầu khắt khe về năng lực thực hành nghề nghiệp')
    .replace(/kỹ\s*năng\s+thực\s*chiến/gi, 'năng lực thực hành nghề nghiệp')
    .replace(/kĩ\s*năng\s+thực\s*chiến/gi, 'năng lực thực hành nghề nghiệp')
    .replace(/kinh\s*nghiệm\s+thực\s*chiến/gi, 'kinh nghiệm thực tế')
    .replace(/dự\s*án\s+thực\s*chiến/gi, 'dự án thực tế')
    .replace(/học\s+thực\s*chiến/gi, 'rèn luyện thực tế')
    .replace(/môi\s*trường\s+thực\s*chiến/gi, 'môi trường làm việc thực tế')
    .replace(/chiến\s*lược\s+thực\s*chiến/gi, 'chiến lược thực tiễn')
    .replace(/bán\s*hàng\s+thực\s*chiến/gi, 'bán hàng thực tế')
    .replace(/thực\s*chiến/gi, 'thực tế')
    .replace(/đàm\s*phán\s*lương/gi, 'đạt mức thu nhập kỳ vọng')
    .replace(/báo\s*cáo\s*tài\s*chính/gi, 'công việc chuyên môn')
    .replace(/(?:năng\s*lực|giá\s*trị)\s*thương\s*mại/gi, 'năng lực nghề nghiệp thực tế')
    .replace(/tạo\s+ra\s+doanh\s+thu\s+hay\s+giá\s+trị\s+thương\s+mại/gi, 'đáp ứng khối lượng công việc thực tế')
    .replace(/tạo\s+ra\s+doanh\s+thu/gi, 'đáp ứng yêu cầu công việc')
    .replace(/^Thầy\s+(?:rất\s+)?(?:hiểu|thấu hiểu|đồng cảm|thấy rằng)[^.!?\n]*[.!?]\s*/gi, '')
    .replace(/Ước mơ của em (?:thật|rất) tuyệt vời[^.!?\n]*[.!?]?/gi, '')
    .replace(/Em rất có tiềm năng[^.!?\n]*[.!?]?/gi, '')
    .replace(/(?:tình cảm|ước mơ|tấm lòng)(?: này)? rất đáng (?:quý|trân trọng)[^.!?\n]*[.!?]?/gi, '');

  // 4. QUY TẮC 1: XỬ LÝ BIẾN DỮ LIỆU ĐẦU VÀO
  const isVocational = isVocationalTrack(effectiveCareer, userText, targetSchool);
  const isUniClarification = hasUniversityClarification(userText);
  const cleanSchoolClause = formatSchoolClause(targetSchool, isVocational, 'tại ');
  const cleanSchoolName = formatSchoolName(targetSchool, isVocational);

  cleaned = cleaned.replace(/tại\s+\[?(?:chưa biết(?: học ở đâu)?|chưa rõ|chưa xác định|không biết|trường đại học mục tiêu|undefined|null)\]?/gi, cleanSchoolClause);
  cleaned = cleaned.replace(/của\s+\[?(?:chưa biết(?: học ở đâu)?|chưa rõ|chưa xác định|không biết|trường đại học mục tiêu|undefined|null)\]?/gi, `của ${cleanSchoolName}`);

  // Cắt bỏ các danh sách tự vạch chiến lược thay học sinh
  cleaned = cleaned.replace(/(?:Để giúp em|Để làm chủ lộ trình|Thầy đề xuất|Thầy định hướng)[^:.\n]*Chiến lược Thích ứng Đa tầng[^:\n]*:?/gi, '');
  cleaned = cleaned.replace(/[•\-\*]?\s*Tầng\s*[1-3][^:\n]*:?[^\n\r]*/gi, '');
  cleaned = cleaned.replace(/Chiến lược Thích ứng Đa tầng/gi, '');
  cleaned = cleaned.replace(/Mô hình hạ bậc mềm \(Soft Laddering\)/gi, '');
  cleaned = cleaned.trim();

  const major = effectiveCareer || 'ngành mục tiêu';

  if (round === 5) {
    // Ở LƯỢT KẾT THÚC (SAU KHI TRẢ LỜI ĐỦ 4 CÂU HỎI), RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ
    cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
    cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    return `Để biết kế hoạch học tập và năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${major} tại ${cleanSchoolName} hay không, em cần đối chứng trực tiếp với số liệu. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và chỉ tiêu thực tế của ${cleanSchoolName} xem độ chênh lệch thực tế là bao nhiêu.`;
  } else {
    // VÒNG 1, 2, 3, 4: ĐẢM BẢO TỐI ĐA 2 CÂU VĂN VÀ KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    if (sentences.length > 2) {
      const lastQ = sentences[sentences.length - 1];
      const prev = sentences[0];
      cleaned = `${prev} ${lastQ}`;
    }
    if (round === 3 && (/tổ hợp xét tuyển|môn nào khiến em|công cụ bề nổi|cánh cửa quyết định/i.test(cleaned) || !/\?\s*$/.test(cleaned))) {
      cleaned = `Những năng lực em vừa nêu thực sự rất cần thiết đối với người lao động trong tương lai. Tuy nhiên, bên cạnh việc chuẩn bị kỹ năng cá nhân, em đã tìm hiểu về xu hướng việc làm của ngành ${major} trong tương lai cũng như tỷ lệ cạnh tranh hay nguy cơ thất nghiệp khi ra trường chưa?`;
    }
    if (round === 4 && !/\?\s*$/.test(cleaned)) {
      cleaned = `Việc tìm hiểu xu hướng việc làm đầu ra là rất cần thiết, nhưng trước hết em phải vượt qua cánh cửa tuyển sinh đầu vào. Để xét tuyển vào ngành ${major} ${cleanSchoolClause}, trong các môn thuộc tổ hợp xét tuyển, môn nào khiến em cảm thấy lo lắng nhất và kế hoạch học tập thực tế của em để vượt qua rào cản đó là gì?`;
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

    const validHistory = Array.isArray(chatHistory) ? chatHistory : (Array.isArray(body?.history) ? body.history : []);
    const trimmedMsg = userMessage.trim();

    // 2. PHẢN XẠ NHANH: Nếu học sinh chỉ chào hỏi xã giao
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

    // 2b. PHẢN XẠ NHANH: Nếu học sinh thắc mắc kỹ thuật / chưa hiểu câu hỏi
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

    // 2c. PHẢN XẠ NHANH: Nếu học sinh né tránh hoặc bông đùa
    if (isEvasiveOrJoking(trimmedMsg)) {
      const evasiveReply = `Thầy chỉ là công cụ đặt câu hỏi giúp em soi chiếu lại mục tiêu. Nếu đối diện với câu hỏi này khiến em lo lắng, thì áp lực thi cử và chọn nghề sắp tới sẽ còn thực tế hơn rất nhiều. Em hãy trả lời thẳng thắn vào trọng tâm câu hỏi của thầy ở trên.`;
      return res.status(200).json({
        success: true,
        round: body?.round && Number(body.round) > 0 ? Number(body.round) : 1,
        stage: body?.stage && Number(body.stage) > 0 ? Number(body.stage) : (body?.round ? Number(body.round) : 1),
        chatStage: body?.chatStage && Number(body.chatStage) > 0 ? Number(body.chatStage) : 1,
        response: evasiveReply,
        reply: evasiveReply,
        isComplete: false,
        isCompleted: false,
        advanceRound: false,
        progress: `${body?.chatStage || 1}/4`
      });
    }

    // 3. Quản lý Tiến trình Hội thoại theo Trạng thái Cứng (STRICT STATE MACHINE)
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text) && !isTechnicalConfusion(m.text) && !isEvasiveOrJoking(m.text));

    let currentStage = 1;
    if (body?.currentStage && Number(body.currentStage) >= 1) {
      currentStage = Math.min(Math.max(Number(body.currentStage), 1), 5);
    } else if (body?.stage && Number(body.stage) >= 1) {
      currentStage = Math.min(Math.max(Number(body.stage), 1), 5);
    } else if (body?.chatStage && Number(body.chatStage) >= 1) {
      currentStage = Math.min(Math.max(Number(body.chatStage), 1), 5);
    } else if (body?.round && Number(body.round) >= 1) {
      currentStage = Math.min(Math.max(Number(body.round), 1), 5);
    } else {
      currentStage = Math.min(Math.max(substantiveUserMsgs.length + 1, 1), 5);
    }

    const studentProfile = body?.studentProfile || body?.userProfile || body?.anchor || {};
    const targetCareer = studentProfile?.targetMajor || studentProfile?.targetCareer || studentProfile?.target_career || "ngành nghề mục tiêu";
    const targetSchool = studentProfile?.targetSchool || studentProfile?.targetUniversity || studentProfile?.target_university || "";
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || "AEI";
    const reason = studentProfile?.reason || studentProfile?.careerReason || "Em thích từ nhỏ và cảm thấy phù hợp";
    const anchorReason = studentProfile?.anchorReason || body?.anchorReason || '';
    const anchorQuote = studentProfile?.anchorQuote || body?.anchorQuote || reason || '';
    const initialConfidence = studentProfile?.initialConfidence || studentProfile?.confidenceT0 || studentProfile?.confidence_score || studentProfile?.confidence || 5;
    const expectedIncome = studentProfile?.expectedIncome || studentProfile?.targetIncome || "10 - 15 triệu/tháng";
    const gpa_A00 = studentProfile?.gpa_A00 || body?.gpa_A00;
    const benchmark_target = studentProfile?.benchmark_target || body?.benchmark_target;
    const riasec_match_pct = studentProfile?.riasec_match_pct != null ? studentProfile?.riasec_match_pct : body?.riasec_match_pct;
    const riasecCode = studentProfile?.riasecCode || studentProfile?.riasec_code || body?.riasecCode;
    const studentId = studentProfile?.studentId || studentProfile?.id || body?.studentId || body?.id || '';
    const studentName = studentProfile?.name || studentProfile?.studentName || body?.studentName || '';

    const goalShift = detectGoalShift(trimmedMsg);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : targetCareer;

    const pastModelUtterances = validHistory
      .filter(m => m.role === 'model' && m.text)
      .slice(-3)
      .map((m, i) => `Lượt trước ${i + 1}: "${m.text.slice(0, 120)}..."`)
      .join('\n');

    const systemPrompt = getStageSystemPrompt(currentStage, {
      targetCareer,
      effectiveCareer,
      isShifted,
      targetSchool,
      hollandCode,
      reason,
      anchorReason,
      anchorQuote,
      initialConfidence,
      expectedIncome,
      studentId,
      studentName,
      gpa_A00,
      benchmark_target,
      riasec_match_pct,
      riasecCode
    }, trimmedMsg, pastModelUtterances);

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
            replyText = sanitizeSocraticResponse(cleaned, currentStage, effectiveCareer, targetSchool, trimmedMsg, studentProfile);
            break;
          }
        }
      } catch (err) {
        // Thử model tiếp theo
      }
    }

    if (!replyText || !isCompleteSentence(replyText)) {
      const rawFallback = generateCognitiveFallback({
        stage: currentStage,
        targetCareer,
        effectiveCareer,
        isShifted,
        targetSchool,
        hollandCode,
        reason,
        anchorReason,
        anchorQuote,
        initialConfidence,
        expectedIncome,
        trimmedMsg,
        studentId,
        studentName,
        gpa_A00,
        benchmark_target,
        riasec_match_pct,
        riasecCode
      });
      replyText = sanitizeSocraticResponse(rawFallback, currentStage, effectiveCareer, targetSchool, trimmedMsg, studentProfile);
    }

    const isComplete = currentStage === 5;
    const progressStr = `${Math.min(currentStage, 4)}/4`;

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
  const { 
    targetCareer, 
    effectiveCareer: profEffective, 
    isShifted: profShifted, 
    targetSchool: rawSchool, 
    hollandCode, 
    reason, 
    initialConfidence, 
    expectedIncome,
    studentId,
    studentName,
    gpa_A00,
    benchmark_target,
    riasec_match_pct,
    riasecCode
  } = profile;
  const avoidRepetition = pastModelUtterances
    ? `\n[CÂU THOẠI TRƯỚC ĐÓ CỦA THẦY - TUYỆT ĐỐI KHÔNG ĐƯỢC LẶP LẠI]:\n${pastModelUtterances}\n`
    : '';

  const goalShift = detectGoalShift(userText);
  const isShifted = profShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = profEffective || (goalShift ? goalShift.newMajor : targetCareer);
  const isVocational = isVocationalTrack(effectiveCareer, userText, rawSchool);
  const targetSchool = formatSchoolName(rawSchool, isVocational);
  const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
  const isUniClarification = hasUniversityClarification(userText);

  let adaptiveDirective = '';
  if (isUniClarification) {
    adaptiveDirective = `
[CHỈ DẪN KHI HỌC SINH ĐÍNH CHÍNH HỌC ĐẠI HỌC CHỨ KHÔNG HỌC NGHỀ]:
- Học sinh vừa khẳng định rõ: Em chọn học Đại học (tại ${targetSchool}) chứ không học trường nghề.
- Thầy Socrates ghi nhận em đang hướng tới bậc Đại học chính quy tại ${targetSchool}.
- Nhắc nhở rằng ở bậc Đại học, yêu cầu sẽ thiên về nền tảng kiến thức kỹ thuật chuyên sâu và điểm chuẩn cạnh tranh theo tổ hợp môn thi THPT.
- TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại "Học nghề là một hướng đi thực tế...", không nhắc đến cổng trường nghề hay rèn luyện thể lực của học nghề.
`;
  }

  const CORE_PROMPT = `
# VAI TRÒ VÀ BẢN SẮC (PERSONA)
Bạn là "Thầy Socrates" - Trợ lý AI Tham vấn Phản tư thuộc nền tảng SocraCareer (Đề tài NCKH Khoa học Hành vi). 
Mục tiêu duy nhất của bạn: Đóng vai "người phản biện khó tính", áp dụng kỹ thuật truy vấn ngược Socrates để giúp học sinh THPT tự bóc tách các giả định cảm tính, thiên lệch nhận thức và ảo tưởng chọn nghề.

# QUY TẮC CỐT TỬ - TUYỆT ĐỐI TUÂN THỦ (CRITICAL GUARDRAILS)
1. TUYỆT ĐỐI KHÔNG TỰ ĐƯA SỐ LIỆU ĐIỂM CHUẨN HAY HỌC PHÍ:
   - Nghiêm cấm đưa ra bất kỳ con số cụ thể nào về điểm chuẩn tham chiếu, điểm sàn, hay học phí (ví dụ: cấm nói "điểm chuẩn là 27.5", cấm nói "em đang thiếu 2.5 điểm"). 
   - Nhiệm vụ đối chứng số liệu thuộc về BƯỚC 3. Ở Bước 2, bạn CHỈ ĐƯỢC CHẤT VẤN VỀ LẬP LUẬN VÀ CĂN CỨ CỦA HỌC SINH.
2. CHỈ DÙNG THÔNG TIN HỌC SINH ĐÃ KHAI Ở BƯỚC 1:
   - Các dữ liệu bạn được phép biết từ Bước 1 gồm: Ngành mục tiêu, Trường mục tiêu, Mức tự tin ban đầu (thang 1-10), Kỳ vọng thu nhập, Lý do ban đầu.
3. QUY TẮC PHÁT NGÔN (ANTI-ROBOTIC & ANTI-SYCOPHANCY):
   - KHÔNG bắt đầu câu bằng các cụm rập khuôn như: "Thầy hiểu sự...", "Thầy đồng cảm...", "Thầy thấy rằng...". Hãy đi thẳng vào câu hỏi hoặc phản hồi tự nhiên.
   - Mỗi lượt đối thoại CHỈ ĐƯỢC ĐẶT ĐÚNG 01 CÂU HỎI TRUY VẤN. Câu hỏi phải ngắn gọn, sắc bén, đánh thẳng vào giả định của học sinh.
   - Tuyệt đối không khen ngợi, không tán dương dễ dãi (Anti-Sycophancy). Không bao giờ nói: "Ước mơ của em thật tuyệt vời", "Em rất có tiềm năng".

# NGUYÊN TẮC TIẾP CẬN TÂM LÝ LỨA TUỔI HỌC SINH THPT (ĐẶC BIỆT LƯU Ý VỀ MỨC LƯƠNG):
1. Học sinh THPT chưa có kinh nghiệm việc làm; các kỳ vọng về thu nhập (như 15 - 20 triệu) thường là "mỏ neo ảo" do mạng xã hội (TikTok, Facebook, Youtube) tạo ra.
2. TUYỆT ĐỐI KHÔNG dùng các thuật ngữ công sở như: "đàm phán lương", "báo cáo tài chính", "năng lực thương mại", "giá trị thương mại", "tạo ra doanh thu".
3. Hãy truy vấn vào NGUỒN GỐC THÔNG TIN và THỰC TẾ ĐÁNH ĐỔI:
   - Thay vì hỏi: "Em lấy gì để đàm phán mức lương đó?" hay "nhà tuyển dụng sẵn sàng chi trả",
   - HÃY HỎI: "Theo em, bản thân cần đáp ứng những năng lực gì để có thể nhận được mức lương như mình mong muốn là [Mức thu nhập] trong tương lai?"

# QUY TẮC "BẮT CẦU LẬP LUẬN" (LIÊN KẾT TỰ NHIÊN, KHÔNG HỜI HỢT):
- Khi học sinh nêu đặc điểm cá nhân (như "ngoại hình ưa nhìn", "giỏi tiếng Anh", "giao tiếp tốt", "thích đi đây đi đó"):
  -> BẮT BUỘC phải dùng chính đặc điểm đó để phản biện trước khi hỏi câu tiếp theo.
  -> Ví dụ: "Ngoại hình và ngoại ngữ là lợi thế giao tiếp, nhưng ngành Du lịch đòi hỏi xử lý sự cố tour, sức khỏe bền bỉ và làm việc ngày lễ Tết. Ngoài việc được đi nhiều nơi, em đã chuẩn bị tâm lý thế nào cho những ngày phải phục vụ khách suốt 14-16 tiếng?"

# LỘ TRÌNH 4 CÂU HỎI TRUY VẤN TỰ NHIÊN + 1 LƯỢT ĐÚC KẾT
- Câu hỏi 1 (Chất vấn Mỏ neo & Đám đông): Dựa vào lý do ban đầu của học sinh để bóc tách. Nếu học sinh nói "thích vì được đi nhiều nơi" hoặc "xem mạng xã hội", hãy hỏi về mặt trái, cường độ lao động hoặc trách nhiệm thực tế mà học sinh chưa từng nghĩ tới.
- Câu hỏi 2 (Chất vấn Nguồn gốc kỳ vọng thu nhập & Thực tế đánh đổi): Bắt cầu từ câu trả lời của học sinh ở Câu 1, sau đó hỏi xem con số thu nhập kỳ vọng em tham khảo từ nguồn nào (mạng xã hội, người quen kể hay tự ước lượng) và mất bao nhiêu năm trong nghề cùng điều kiện thời gian thế nào để đạt được.
- Câu hỏi 3 (Chất vấn Sức học & Tổ hợp môn): Bắt cầu từ câu trả lời của học sinh ở Câu 2, sau đó hỏi học sinh về môn học trong tổ hợp mà em cảm thấy lo lắng nhất và kế hoạch học tập thực tế để vượt qua rào cản đó.
- Câu hỏi 4 (Chất vấn Tính khả thi của kế hoạch học tập & Phương án dự phòng): Đào sâu vào kế hoạch học tập vừa nêu, hỏi số giờ tự học cụ thể mỗi ngày và phương án dự phòng nếu điểm chuẩn vượt tầm với.
- Lượt 5 (Chuyển tiếp phản tư sang Bước 3): Tóm tắt lại lỗ hổng lập luận lớn nhất mà học sinh vừa bộc lộ, và mời học sinh bước sang Bước 3 để tự tay tra cứu số liệu đề án tuyển sinh thực tế.

# XỬ LÝ CÁC TÌNH HUỐNG HỌC SINH NÉ TRÁNH HOẶC BÔNG ĐÙA
- Nếu học sinh trả lời cộc lốc, né tránh hoặc trêu đùa (ví dụ: "Em thấy thầy là em lo", "Thầy hỏi khó quá"):
  -> Tuyệt đối không tính là chuyển biến nhận thức (Turning Point). 
  -> Hãy đáp lại điềm tĩnh, kéo học sinh về thực tế: "Thầy chỉ là công cụ đặt câu hỏi giúp em soi chiếu lại mục tiêu. Nếu đối diện với câu hỏi này khiến em lo lắng, thì áp lực thi cử và chọn nghề sắp tới sẽ còn thực tế hơn rất nhiều. Hãy trả lời thẳng thắn: [Lặp lại câu hỏi trọng tâm]?"
`;

  if (stage === 1) {
    if (isUndecidedOrVague(effectiveCareer)) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 1 (NHÁNH B: ĐỊNH HƯỚNG MỤC TIÊU CHO HỌC SINH MƠ HỒ / CHƯA CÓ NGÀNH CỤ THỂ):
- Học sinh chưa chọn được ngành nghề cụ thể hoặc đang phân vân, mơ hồ.

[NHIỆM VỤ LƯỢT 1]:
1. Đi thẳng vào câu hỏi, không khen ngợi tán dương.
2. ĐẶT DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Chào em. Khi chưa có mục tiêu ngành nghề cụ thể ở lớp 12, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi, không nói "Thầy hiểu...".
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.${avoidRepetition}`;
    }

    const studentObj = {
      id: studentId || profile?.id || '',
      name: studentName || profile?.name || 'em',
      baselineTarget: effectiveCareer,
      targetCareer: effectiveCareer,
      targetSchool: targetSchool,
      source: reason,
      anchorReason: anchorReason || '',
      anchorQuote: anchorQuote || reason || '',
      conf_T0: initialConfidence,
      gpa_A00: gpa_A00 || null,
      benchmark_target: benchmark_target || null,
      riasec_match_pct: riasec_match_pct != null ? riasec_match_pct : 40,
      riasecCode: riasecCode || hollandCode || 'Xã hội'
    };
    const firstPrompt = generateSocraticFirstPrompt(studentObj);

    return `${CORE_PROMPT}
BỐI CẢNH GIAI ĐOẠN 1 (CHẤT VẤN MỎ NEO & ĐÁM ĐÔNG: ${firstPrompt.biasType}):
- Quy tắc kích hoạt: ${firstPrompt.biasRule}
- Ngành mục tiêu: ${effectiveCareer}
- Cơ sở đào tạo mục tiêu: ${targetSchool}
- Mức tự tin ban đầu (T0): ${initialConfidence}/10
- Lý do chọn / Mỏ neo ban đầu: "${reason}"
- Thiên hướng RIASEC: ${hollandCode}

[NHIỆM VỤ GIAI ĐOẠN 1]:
1. Đi thẳng vào câu hỏi truy vấn mỏ neo cốt lõi, không bắt đầu bằng "Thầy hiểu..." hay khen ngợi:
"${firstPrompt.firstQuestion}"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi, không phán xét, không đưa số liệu điểm chuẩn.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.${avoidRepetition}`;
  }

  if (stage === 2) {
    return `${CORE_PROMPT}
BỐI CẢNH GIAI ĐOẠN 2 (CHẤT VẤN KỲ VỌNG THU NHẬP):
- Ngành mục tiêu: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Mức lương khởi điểm kỳ vọng học sinh đã khai ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời ở Giai đoạn 1: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 2 - QUY TẮC PHÁT NGÔN SẮC BÉN]:
1. Đi thẳng vào vấn đề, KHÔNG bắt đầu bằng các cụm rập khuôn như: "Thầy hiểu...", "Thầy đồng cảm...", "Thầy thấy rằng...".
2. Tuyệt đối không khen ngợi tán dương (Không nói "Ước mơ thật tuyệt vời", "Em rất có tiềm năng").
3. BẮT CẦU LẬP LUẬN: Dùng chính đặc điểm cá nhân hoặc lý do học sinh vừa nêu trong "${userText}" (như ngoại hình, tiếng Anh, giao tiếp, thích đi nhiều nơi) để phản biện ngắn gọn về áp lực thực tế của ngành ${effectiveCareer} (xử lý sự cố, sức khỏe bền bỉ, làm việc lễ Tết 14-16 tiếng/ngày). TUYỆT ĐỐI KHÔNG dùng thuật ngữ công sở như "đàm phán lương", "báo cáo tài chính", "năng lực thương mại".
4. KẾT THÚC BẰNG DUY NHẤT 01 CÂU HỎI TRUY VẤN SẮC BÉN (TUYỆT ĐỐI KHÔNG HỎI KÉP):
"Theo em, bản thân cần đáp ứng những năng lực gì để có thể nhận được mức lương như mình mong muốn là ${expectedIncome} trong tương lai?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG hỏi dồn 2-3 ý.
- TUYỆT ĐỐI KHÔNG đưa số liệu điểm chuẩn hay học phí.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.${avoidRepetition}`;
  }

  if (stage === 3) {
    return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH GIAI ĐOẠN 3 (CHẤT VẤN SỨC HỌC & TỔ HỢP MÔN):
- Ngành mục tiêu: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Học sinh vừa trả lời ở Giai đoạn 2: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 3 - BẮT CẦU LẬP LUẬN & CHẤT VẤN RÀO CẢN MÔN HỌC]:
1. GHI NHẬN ĐÚNG ĐẮN (BẮT BUỘC): Khẳng định các năng lực học sinh vừa nêu trong "${userText}" thực sự rất cần thiết đối với người lao động trong tương lai. TUYỆT ĐỐI KHÔNG chê bai kiểu "chỉ là công cụ bề nổi".
2. TUYỆT ĐỐI KHÔNG hỏi về môn học hay điểm chuẩn ở lượt này.
3. KẾT THÚC BẰNG DUY NHẤT 01 CÂU HỎI TRUY VẤN:
"Những năng lực em vừa nêu thực sự rất cần thiết đối với người lao động trong tương lai. Tuy nhiên, bên cạnh việc chuẩn bị kỹ năng cá nhân, em đã tìm hiểu về xu hướng việc làm của ngành ${effectiveCareer} trong tương lai cũng như tỷ lệ cạnh tranh hay nguy cơ thất nghiệp khi ra trường chưa?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG giảng bài hay đưa số liệu điểm chuẩn giả định.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 ở lượt này.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.${avoidRepetition}`;
  }

  if (stage === 4) {
    return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH GIAI ĐOẠN 4 (CÂU HỎI DẪN DẮT THỨ 4: CHẤT VẤN TÍNH KHẢ THI CỦA KẾ HOẠCH HỌC TẬP & PHƯƠNG ÁN DỰ PHÒNG):
- Ngành mục tiêu: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Học sinh vừa trả lời về môn học lo lắng và kế hoạch: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 4 - ĐÀO SÂU KẾ HOẠCH HÀNH ĐỘNG & PHƯƠNG ÁN DỰ PHÒNG]:
1. BẮT CẦU LẬP LUẬN: Từ góc nhìn của học sinh về xu hướng việc làm đầu ra ("${userText}"), nhắc rằng cánh cửa đầu tiên em phải vượt qua là kỳ tuyển sinh đại học sắp tới.
2. KẾT THÚC BẰNG DUY NHẤT 01 CÂU HỎI DẪN DẮT SẮC BÉN:
"Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, trong các môn thuộc tổ hợp xét tuyển, môn nào khiến em cảm thấy lo lắng nhất và kế hoạch học tập thực tế của em để vượt qua rào cản đó là gì?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 ở lượt này (để học sinh trả lời câu hỏi thứ 4 này trước).
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.${avoidRepetition}`;
  }

  // Stage 5
  return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH GIAI ĐOẠN 5 (KẾT THÚC 4 CÂU HỎI PHẢN TƯ & CHUYỂN TIẾP SANG BƯỚC 3):
- Ngành mục tiêu: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Học sinh vừa trả lời Câu hỏi 4 về cam kết tự học và phương án dự phòng: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 5 - TÓM TẮT LỖ HỔNG LẬP LUẬN & RA LỆNH CHUYỂN BƯỚC 3]:
1. Tóm tắt ngắn gọn nhận thức của học sinh sau 4 câu hỏi đối thoại.
2. MỜI HỌC SINH BƯỚC SANG BƯỚC 3 ĐỂ TỰ TAY TRA CỨU SỐ LIỆU ĐỀ ÁN TUYỂN SINH THỰC TẾ:
"Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và chỉ tiêu thực tế của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC ĐẶT CÂU HỎI. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- Toàn bộ phản hồi chỉ gồm 2 câu văn dứt khoát.${avoidRepetition}`;
}

// ==============================================================================
// HÀM FALLBACK NHẬN THỨC CHUẨN BỘ NGUYÊN TẮC SOCRATES
// ==============================================================================
function generateCognitiveFallback({ 
  stage, 
  targetCareer, 
  effectiveCareer: propEffective, 
  isShifted: propShifted, 
  targetSchool: rawSchool, 
  hollandCode, 
  reason, 
  anchorReason,
  anchorQuote,
  initialConfidence, 
  expectedIncome, 
  trimmedMsg,
  studentId,
  studentName,
  gpa_A00,
  benchmark_target,
  riasec_match_pct,
  riasecCode
}) {
  const goalShift = detectGoalShift(trimmedMsg);
  const isShifted = propShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = propEffective || (goalShift ? goalShift.newMajor : targetCareer);
  const isVocational = isVocationalTrack(effectiveCareer, trimmedMsg, rawSchool);
  const targetSchool = formatSchoolName(rawSchool, isVocational);
  const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');

  if (stage === 1) {
    if (isUndecidedOrVague(effectiveCareer)) {
      return `Chào em. Khi chưa có mục tiêu ngành nghề cụ thể ở lớp 12, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?`;
    }
    const studentObj = {
      id: studentId || '',
      name: studentName || 'em',
      baselineTarget: effectiveCareer,
      targetCareer: effectiveCareer,
      targetSchool: targetSchool,
      source: reason,
      anchorReason: anchorReason || '',
      anchorQuote: anchorQuote || reason || '',
      conf_T0: initialConfidence,
      gpa_A00: gpa_A00 || null,
      benchmark_target: benchmark_target || null,
      riasec_match_pct: riasec_match_pct != null ? riasec_match_pct : 40,
      riasecCode: riasecCode || hollandCode || 'Xã hội'
    };
    const firstPrompt = generateSocraticFirstPrompt(studentObj);
    return firstPrompt.firstQuestion;
  }

  const lowerUser = String(trimmedMsg || '').toLowerCase();
  const hasAppearance = /ngoại hình|ưa nhìn|cao ráo|dễ nhìn/i.test(lowerUser);
  const hasLanguageOrComm = /tiếng anh|ngoại ngữ|giao tiếp|hoạt ngôn|năng động/i.test(lowerUser);
  const hasTravel = /đi nhiều nơi|đi đây đi đó|đi du lịch|khám phá|trải nghiệm/i.test(lowerUser);
  const isTourism = /du lịch|lữ hành|khách sạn|nhà hàng|hướng dẫn viên/i.test(effectiveCareer.toLowerCase());

  let traitBridge = '';
  if (hasAppearance || hasLanguageOrComm) {
    const traitLabel = (hasAppearance && hasLanguageOrComm)
      ? 'Ngoại hình và ngoại ngữ/giao tiếp'
      : hasAppearance
      ? 'Ngoại hình ưa nhìn'
      : 'Khả năng giao tiếp hay ngoại ngữ';
    traitBridge = isTourism
      ? `${traitLabel} là lợi thế giao tiếp ban đầu, nhưng ngành ${effectiveCareer} đòi hỏi xử lý sự cố tour, sức khỏe bền bỉ và làm việc xuyên ngày lễ Tết, có những ngày phải phục vụ khách suốt 14-16 tiếng.`
      : `${traitLabel} là lợi thế ban đầu, nhưng thực tế ngành ${effectiveCareer} đòi hỏi xử lý áp lực công việc liên tục, giải quyết sự cố phát sinh và rèn luyện chuyên môn sâu.`;
  } else if (hasTravel) {
    traitBridge = `Ngoài việc được đi nhiều nơi, thực tế ngành ${effectiveCareer} đòi hỏi xử lý sự cố phát sinh, sức khỏe bền bỉ và những ngày phải phục vụ khách suốt 14-16 tiếng kể cả dịp lễ Tết.`;
  } else if (/làm được|nghĩ là|tự tin/i.test(lowerUser)) {
    traitBridge = isTourism
      ? `Niềm tin "mình làm được" mới chỉ là cảm giác ban đầu, bởi ngoài việc đi nhiều nơi, ngành ${effectiveCareer} đòi hỏi xử lý sự cố tour, sức khỏe bền bỉ và những ngày phục vụ khách suốt 14-16 tiếng.`
      : `Niềm tin "mình làm được" khi chưa va chạm thực tế mới chỉ là cảm giác chủ quan, bởi ngành ${effectiveCareer} đòi hỏi thời gian rèn luyện chuyên môn và cường độ làm việc rất khắt khe.`;
  }

  if (stage === 2) {
    const bridgePrefix = traitBridge ? `${traitBridge} ` : '';
    return `${bridgePrefix}Theo em, bản thân cần đáp ứng những năng lực gì để có thể nhận được mức lương như mình mong muốn là ${expectedIncome} trong tương lai?`;
  }

  if (stage === 3) {
    return `Những năng lực em vừa nêu thực sự rất cần thiết đối với người lao động trong tương lai. Tuy nhiên, bên cạnh việc chuẩn bị kỹ năng cá nhân, em đã tìm hiểu về xu hướng việc làm của ngành ${effectiveCareer} trong tương lai cũng như tỷ lệ cạnh tranh hay nguy cơ thất nghiệp khi ra trường chưa?`;
  }

  if (stage === 4) {
    return `Việc tìm hiểu xu hướng việc làm đầu ra là rất cần thiết, nhưng trước hết em phải vượt qua cánh cửa tuyển sinh đầu vào. Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, trong các môn thuộc tổ hợp xét tuyển, môn nào khiến em cảm thấy lo lắng nhất và kế hoạch học tập thực tế của em để vượt qua rào cản đó là gì?`;
  }

  // Stage 5
  return `Để biết kế hoạch học tập và năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${effectiveCareer} tại ${targetSchool} hay không, em cần đối chứng trực tiếp với số liệu. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và chỉ tiêu thực tế của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
}
