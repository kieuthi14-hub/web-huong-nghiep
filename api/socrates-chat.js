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
    // Nếu nhắm vào trường Đại học (như ĐH Nha Trang, ĐH Bách Khoa, ĐH Sư phạm Kỹ thuật...),
    // đây là bậc đào tạo Kỹ sư / Cử nhân đại học chính quy, TUYỆT ĐỐI KHÔNG ĐƯỢC COI LÀ HỌC NGHỀ!
    return false;
  }

  if (isExplicitVocationalSchool) {
    return true;
  }

  // 3. Từ khóa nghề thủ công / dịch vụ phi đại học rõ ràng (không đào tạo cử nhân đại học):
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

  // 4. Các ngành kỹ thuật / ứng dụng (cơ khí, điện lạnh, sửa ô tô, đầu bếp, nấu ăn, may mặc):
  // Chỉ coi là học nghề khi KHÔNG có trường đại học và có dấu hiệu học nghề hoặc học sinh bộc lộ ngán lý thuyết
  const technicalKeywords = ['dien lanh', 'co khi', 'sua o to', 'sua xe', 'nau an', 'dau bep', 'may mac', 'may thoi trang', 'sua dien thoai'];
  if (technicalKeywords.some(k => cNorm.includes(k) || uNorm.includes(k))) {
    if (uNorm.includes('nghe') || uNorm.includes('thuc hanh') || cNorm.includes('tho') || cNorm.includes('sua')) {
      return true;
    }
  }

  return false;
}

// HÀM KIỂM TRA HỌC SINH MƠ HỒ / CHƯA CÓ MỤC TIÊU CỤ THỂ (ĐỂ KÍCH HOẠT NHÁNH B)
export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
}

/**
 * SOCRACAREER - DYNAMIC ADAPTIVE TRIGGER (BƯỚC 2: AI SOCRATES)
 * Thuật toán kích hoạt Vòng 1 linh hoạt dựa trên 4 Thiên lệch nhận thức cốt lõi
 */
export function generateSocraticFirstPrompt(student = {}) {
  // 1. Thu thập các chỉ số mỏ neo từ Bước 1
  const targetCareer = student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || "ngành nghề mục tiêu";
  const source = student.source || student.reason || ""; // "Mạng xã hội", "Bạn bè/Người thân", "Tự tìm hiểu"
  const anchorReason = student.anchorReason || "";
  let anchorQuote = student.anchorQuote || source || "";
  if (!anchorQuote && (student.id === "CT_21" || student.studentId === "CT_21")) {
    anchorQuote = "Ngành này cực hot trên mạng, lương nghìn đô ngay khi tốt nghiệp.";
  }

  const conf = Number(student.conf_T0 || student.initialConfidence || student.confidence_score) || 5; // Độ tự tin từ 1 - 10
  const gpa = Number(student.gpa_A00) || 25.0; // Điểm học bạ tổ hợp
  const benchmark = Number(student.benchmark_target) || 27.5; // Điểm chuẩn trường mục tiêu
  const deltaScore = gpa - benchmark; // Khoảng cách điểm sàn
  const riasecMatch = student.riasec_match_pct != null ? Number(student.riasec_match_pct) : 40; // % Tương thích RIASEC

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
    (conf >= 8 && deltaScore <= -2.0);

  const isConfirmation = 
    anchorReason === "Trái mã RIASEC" || 
    (riasecMatch < 50);

  // 2. Cây quyết định thích ứng (Adaptive Decision Tree) để chọn đúng thiên lệch nổi trội
  if (isMediaAnchoring) {
    // THIÊN LỆCH 1: MỎ NEO TRUYỀN THÔNG (Anchoring Bias)
    biasType = "MỎ NEO TRUYỀN THÔNG (ANCHORING BIAS)";
    biasRule = "Kích hoạt do học sinh bộc lộ động cơ chọn ngành từ hình ảnh review trên mạng xã hội (TikTok, YouTube) hoặc thuộc mẫu kiểm thử mỏ neo truyền thông.";
    const quoteText = anchorQuote || "Ngành này cực hot trên mạng, lương nghìn đô ngay khi tốt nghiệp.";
    socraticQuestion = `Chào em. Em vừa chia sẻ rằng chọn ngành ${targetCareer} vì "${quoteText}". Theo em, những clip review thu nhập nghìn đô đó phản ánh bao nhiêu phần trăm áp lực học tập và tỷ lệ đào thải thực tế của ngành này?`;

  } else if (isBandwagon) {
    // THIÊN LỆCH 2: TÂM LÝ ĐÁM ĐÔNG (Bandwagon Effect)
    biasType = "TÂM LÝ ĐÁM ĐÔNG (BANDWAGON EFFECT)";
    biasRule = "Kích hoạt do học sinh chọn ngành theo xu thế đám đông, bạn bè xung quanh cùng rủ chọn hoặc nghe theo lời khuyên ngoại tại.";
    socraticQuestion = `Chào em. Em cho biết chọn ngành ${targetCareer} vì thấy nhiều bạn bè cũng đang đăng ký. Nếu các bạn đổi hướng sang ngành khác, lý do thực chất nào giữ chân em tiếp tục theo đuổi ngành này?`;

  } else if (isOverconfidence) {
    // THIÊN LỆCH 3: TỰ TIN THÁI QUÁ (Overconfidence Bias)
    biasType = "TỰ TIN THÁI QUÁ (OVERCONFIDENCE BIAS)";
    biasRule = `Kích hoạt do mức tự tin trúng tuyển rất cao (${conf}/10) trong khi điểm học bạ tổ hợp (${gpa} điểm) còn cách điểm chuẩn tham chiếu (${benchmark} điểm) một khoảng khá xa (${deltaScore.toFixed(1)} điểm).`;
    socraticQuestion = `Chào em. Em đang đặt mức tự tin tới ${conf}/10 vào khả năng trúng tuyển, trong khi điểm học bạ tổ hợp hiện tại (${gpa} điểm) còn cách điểm chuẩn tham chiếu (${benchmark} điểm) một khoảng khá xa (${deltaScore.toFixed(1)} điểm). Căn cứ cụ thể nào giúp em tin chắc mình sẽ bù đắp được khoảng cách này trong thời gian nước rút?`;

  } else if (isConfirmation) {
    // THIÊN LỆCH 4: THIÊN LỆCH XÁC NHẬN (Confirmation Bias)
    biasType = "THIÊN LỆCH XÁC NHẬN (CONFIRMATION BIAS)";
    biasRule = `Kích hoạt do độ tương thích RIASEC thấp (${riasecMatch}%), sở trường tự nhiên nhóm [${student.riasecCode || "Xã hội"}] chưa khớp với đặc thù khắt khe của ngành mục tiêu.`;
    socraticQuestion = `Chào em. Kết quả trắc nghiệm RIASEC chỉ ra thế mạnh tự nhiên của em thuộc nhóm ${student.riasecCode || "Xã hội"}, nhưng ngành ${targetCareer} lại đòi hỏi đặc tính rất khắt khe về kỹ thuật thực hành. Em đã chủ động tìm hiểu những rào cản khi làm việc trái với sở trường tự nhiên chưa, hay em chỉ đang chú ý đến những khía cạnh tích cực của nó?`;

  } else {
    // TRƯỜNG HỢP MẶC ĐỊNH / NHÓM THỰC CHẤT
    biasType = "TRUY VẤN NỀN TẢNG THỰC CHẤT";
    biasRule = "Học sinh có động cơ nội tại hài hòa; thực hiện truy vấn cơ sở thực tế và dữ liệu khách quan quan trọng nhất dẫn dắt mục tiêu.";
    socraticQuestion = `Chào em. Em hãy chia sẻ lý do cốt lõi và dữ liệu thực tế quan trọng nhất đã dẫn dắt em lựa chọn mục tiêu ngành ${targetCareer}?`;
  }

  // 3. Trả về cấu trúc hiển thị Vòng 1 cho giao diện Web
  return {
    biasType: biasType,
    biasRule: biasRule,
    botGreeting: `Chào ${student.name || "em"}. Trước khi đối chứng dữ liệu tuyển sinh thực tế, chúng ta sẽ cùng thực hiện đối thoại phản tư đa chiều.`,
    firstQuestion: socraticQuestion
  };
}

/**
 * BƯỚC 2: AI SOCRATES SỬ DỤNG TRỰC TIẾP DỮ LIỆU TỪ BƯỚC 1 ĐỂ KHỞI TẠO CÂU HỎI ĐẦU TIÊN
 */
export function initSocratesChat(profile = {}) {
  const promptData = generateSocraticFirstPrompt(profile);
  return promptData.firstQuestion;
}

// HÀM XÁC ĐỊNH TỔ HỢP MÔN THAM CHIẾU THEO CHƯƠNG TRÌNH GDPT 2018 (KHÔNG ÁP ĐẶT CỨNG NHẮC KHỐI CŨ)
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
    .replace(/thực\s*chiến/gi, 'thực tế');

  // 4. QUY TẮC 1: XỬ LÝ BIẾN DỮ LIỆU ĐẦU VÀO (CHỐNG LỖI HIỂN THỊ CHUỖI RỖNG / "tại [chưa biết]")
  const isVocational = isVocationalTrack(effectiveCareer, userText, targetSchool);
  const isUniClarification = hasUniversityClarification(userText);
  const cleanSchoolClause = formatSchoolClause(targetSchool, isVocational, 'tại ');
  const cleanSchoolName = formatSchoolName(targetSchool, isVocational);

  cleaned = cleaned.replace(/tại\s+\[?(?:chưa biết(?: học ở đâu)?|chưa rõ|chưa xác định|không biết|trường đại học mục tiêu|undefined|null)\]?/gi, cleanSchoolClause);
  cleaned = cleaned.replace(/của\s+\[?(?:chưa biết(?: học ở đâu)?|chưa rõ|chưa xác định|không biết|trường đại học mục tiêu|undefined|null)\]?/gi, `của ${cleanSchoolName}`);

  // Cắt bỏ các danh sách tự vạch chiến lược / tầng nấc thay học sinh
  cleaned = cleaned.replace(/(?:Để giúp em|Để làm chủ lộ trình|Thầy đề xuất|Thầy định hướng)[^:.\n]*Chiến lược Thích ứng Đa tầng[^:\n]*:?/gi, '');
  cleaned = cleaned.replace(/[•\-\*]?\s*Tầng\s*[1-3][^:\n]*:?[^\n\r]*/gi, '');
  cleaned = cleaned.replace(/Chiến lược Thích ứng Đa tầng/gi, '');
  cleaned = cleaned.replace(/Mô hình hạ bậc mềm \(Soft Laddering\)/gi, '');
  cleaned = cleaned.trim();

  const major = effectiveCareer || 'ngành mục tiêu';
  const lowerUser = (userText || '').toLowerCase();
  const { strongSubject, weakSubject } = extractSubjectsFeedback(userText);
  const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');

  if (round === 4) {
    // Ở LƯỢT CUỐI CÙNG, RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ
    // Cắt bỏ dấu ? ở cuối câu
    cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
    cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
    cleaned = cleaned.trim();

    // Loại bỏ các câu điều hướng cũ nếu có
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    // Nếu học sinh đã đính chính học Đại học hoặc đây là hướng Đại học,
    // TUYỆT ĐỐI CẤM để lọt cụm từ "học nghề" / "cổng trường nghề" trong câu nhận định!
    if (!isVocational || isUniClarification) {
      cleaned = cleaned.replace(/Học nghề là một hướng đi thực tế[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.replace(/[^.!?\n]*cổng trường nghề[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.replace(/[^.!?\n]*trường nghề[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.replace(/[^.!?\n]*chuẩn bị về thể lực[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.trim();
    }

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    let intro = '';
    if (isUniClarification) {
      intro = `Thầy ghi nhận em đang hướng tới bậc Đại học chính quy ngành ${major} ${cleanSchoolClause} chứ không phải học nghề. Với bậc Đại học, yêu cầu sẽ thiên về nền tảng kiến thức kỹ thuật chuyên sâu và điểm chuẩn cạnh tranh theo tổ hợp môn.`;
    } else if (sentences.length > 0) {
      intro = sentences.slice(0, 2).join(' ').trim();
    } else {
      if (isVocational) {
        intro = `Học nghề là một hướng đi thực tế, nhưng việc thi đỗ tốt nghiệp THPT và chuẩn bị thể lực bền bỉ là điều kiện tiên quyết.`;
      } else if (isBalancedGrades) {
        intro = `Học đều các môn là một nền tảng tốt, nhưng điểm chuẩn vào ngành ${major} ${cleanSchoolClause} đòi hỏi điểm số bứt phá ở tổ hợp xét tuyển.`;
      } else if (strongSubject && weakSubject) {
        intro = `Thế mạnh ở môn ${strongSubject} là điểm tựa tốt, nhưng môn ${weakSubject} nếu chưa đạt yêu cầu sẽ là rào cản khi xét tuyển vào ngành ${major} ${cleanSchoolClause}.`;
      } else if (strongSubject) {
        intro = `Môn ${strongSubject} là một điểm tựa, nhưng điểm chuẩn ngành ${major} ${cleanSchoolClause} đòi hỏi cả tổ hợp xét tuyển phải đạt ngưỡng an toàn.`;
      } else {
        intro = `Để biết năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${major} ${cleanSchoolClause} hay không, em cần đối chứng với dữ liệu thực tế.`;
      }
    }

    // QUY TẮC 2: PHÂN HÓA HƯỚNG ĐI ĐẠI HỌC VS HỌC NGHỀ
    const standardDirective = (isVocational && !isUniClarification)
      ? `Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${cleanSchoolName} để đối chiếu với hồ sơ của mình.`
      : `Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${cleanSchoolName} xem độ chênh lệch thực tế là bao nhiêu.`;

    return `${intro} ${standardDirective}`.trim();
  } else {
    // VÒNG 1, 2, 3: ĐẢM BẢO TỐI ĐA 2-3 CÂU VĂN VÀ KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    // Nếu học sinh đã đính chính học Đại học hoặc đây là hướng Đại học,
    // TUYỆT ĐỐI CẤM để lọt cụm từ "học nghề" / "cổng trường nghề"
    if (!isVocational || isUniClarification) {
      cleaned = cleaned.replace(/Học nghề là một hướng đi thực tế[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.replace(/[^.!?\n]*cổng trường nghề[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.replace(/[^.!?\n]*trường nghề[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.replace(/[^.!?\n]*chuẩn bị về thể lực[^.!?\n]*[.!?]?/gi, '');
      cleaned = cleaned.trim();
    }

    // QUY TẮC 6: CHỐNG QUAY XE ĐỘT NGỘT SANG TIỀN LƯƠNG KHI HỌC SINH NÊU ĐỘNG CƠ CẢM XÚC/GIA ĐÌNH/ƯỚC MƠ
    const isFamilyOrAltruisticUser = ['ba mẹ', 'bố mẹ', 'cha mẹ', 'gia đình', 'chữa bệnh', 'từ nhỏ', 'từ bé', 'ước mơ từ nhỏ', 'thích từ nhỏ', 'giúp đỡ', 'cứu người', 'yêu trẻ', 'hiếu thảo'].some(k => lowerUser.includes(k));
    const isMedicalCareerUser = ['bác sĩ', 'y khoa', 'y đa khoa', 'y dược', 'y tế', 'điều dưỡng', 'dược'].some(k => major.toLowerCase().includes(k) || lowerUser.includes(k));

    if (round === 2 && isFamilyOrAltruisticUser && (cleaned.includes('thị trường lao động') || cleaned.includes('nhà tuyển dụng') || cleaned.includes('mức thu nhập') || cleaned.includes('khởi điểm 15') || cleaned.includes('15 - 20 triệu'))) {
      if (isMedicalCareerUser) {
        cleaned = `Thầy hiểu tình cảm và mong muốn hiếu thảo muốn chữa bệnh cho ba mẹ là động lực rất thiêng liêng của em. Tuy nhiên, ngành Y đòi hỏi tối thiểu 6 năm học đại học áp lực cực lớn, những đêm trực trắng tại bệnh viện và thêm 18 tháng thực hành lâm sàng trước khi có thể độc lập hành nghề. Khi nghĩ về chặng đường dài và nhiều áp lực sinh tử đó, điều gì khiến em tin mình có đủ sức bền và sự kiên trì để đi đến cùng?`;
      } else {
        cleaned = `Thầy hiểu ước mơ và tình cảm dành cho gia đình là động lực rất đáng trân trọng của em. Tuy nhiên, việc yêu thích một ngành nghề rất khác với việc chịu đựng được những áp lực và kỷ luật khắt khe của công việc thực tế hàng ngày. Khi tìm hiểu về ngành này, em đã lường trước những khó khăn lớn nhất mà mình sẽ phải đối mặt chưa?`;
      }
    }

    if (!cleaned.endsWith('?')) {
      if (round === 1) {
        const studentObj = {
          id: studentProfile?.studentId || studentProfile?.id || '',
          name: studentProfile?.name || studentProfile?.studentName || 'em',
          baselineTarget: major,
          targetCareer: major,
          targetSchool: targetSchool,
          source: studentProfile?.reason || '',
          anchorReason: studentProfile?.anchorReason || '',
          anchorQuote: studentProfile?.anchorQuote || studentProfile?.reason || '',
          conf_T0: studentProfile?.initialConfidence || 5,
          gpa_A00: studentProfile?.gpa_A00 || 25.0,
          benchmark_target: studentProfile?.benchmark_target || 27.5,
          riasec_match_pct: studentProfile?.riasec_match_pct ?? 40,
          riasecCode: studentProfile?.riasecCode || 'Xã hội'
        };
        const firstPrompt = generateSocraticFirstPrompt(studentObj);
        cleaned += ` ${firstPrompt.firstQuestion}`;
      } else if (isVocational && !isUniClarification) {
        if (round === 2) {
          cleaned += ` Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (đứng nhiều giờ, ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?`;
        } else if (round === 3) {
          cleaned += ` Học nghề vẫn đòi hỏi điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ để vào các trường nghề uy tín. Nhìn lại sức học hiện tại, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm vé tốt nghiệp này?`;
        }
      } else {
        if (round === 2) {
          if (isFamilyOrAltruisticUser) {
            if (isMedicalCareerUser) {
              cleaned += ` Nhìn vào chặng đường 6 năm đại học và 18 tháng thực hành lâm sàng đầy áp lực của ngành Y, điều gì khiến em tin mình có đủ sức bền để đi đến cùng?`;
            } else {
              cleaned += ` Nhìn vào áp lực và kỷ luật khắt khe của nghề này, em đã chuẩn bị gì cho những khó khăn thực tế phía trước?`;
            }
          } else {
            cleaned += ` Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập kỳ vọng đó ngay khi em vừa tốt nghiệp?`;
          }
        } else if (round === 3) {
          cleaned += ` Để xét tuyển vào ngành ${major} ${cleanSchoolClause}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;
        }
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
            replyText = sanitizeSocraticResponse(cleaned, currentStage, effectiveCareer, targetSchool, trimmedMsg, studentProfile);
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

  // Nhận diện chuyển biến mục tiêu / thắc mắc ngành mới từ tin nhắn học sinh
  const goalShift = detectGoalShift(userText);
  const isShifted = profShifted || Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
  const effectiveCareer = profEffective || (goalShift ? goalShift.newMajor : targetCareer);
  const isVocational = isVocationalTrack(effectiveCareer, userText, rawSchool);
  const targetSchool = formatSchoolName(rawSchool, isVocational);
  const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
  const askingCombo = isAskingAboutSubjectsOrCombos(userText);
  const lowerUser = (userText || '').toLowerCase();
  const careerLower = (effectiveCareer || '').toLowerCase();
  const isFamilyOrAltruistic = ['ba mẹ', 'bố mẹ', 'cha mẹ', 'gia đình', 'chữa bệnh', 'từ nhỏ', 'từ bé', 'ước mơ từ nhỏ', 'thích từ nhỏ', 'giúp đỡ', 'cứu người', 'yêu trẻ', 'người thân', 'ông bà', 'hiếu thảo'].some(k => lowerUser.includes(k));
  const isMedicalCareer = ['bác sĩ', 'y khoa', 'y đa khoa', 'y dược', 'y tế', 'điều dưỡng', 'dược', 'dược học', 'nha khoa', 'răng hàm mặt'].some(k => careerLower.includes(k) || lowerUser.includes(k));
  const isVagueOrUncertain = ['không rõ', 'chưa rõ', 'không biết', 'chưa biết', 'chưa tìm hiểu', 'nghĩ vậy', 'cảm thấy', 'tùy'].some(k => lowerUser.includes(k));
  const isSalaryFocused = ['tiền', 'lương', 'thu nhập', 'giàu', 'kiếm tiền', 'kinh tế', 'triệu', 'ổn định'].some(k => lowerUser.includes(k));
  const isUniClarification = hasUniversityClarification(userText);

  // Chỉ thị thích ứng mục tiêu
  let adaptiveDirective = '';
  if (isUniClarification) {
    adaptiveDirective = `
[CHỈ DẪN KHI HỌC SINH ĐÍNH CHÍNH HỌC ĐẠI HỌC CHỨ KHÔNG HỌC NGHỀ]:
- Học sinh vừa khẳng định rõ: Em chọn học Đại học (tại ${targetSchool}) chứ không học trường nghề.
- Thầy Socrates PHẢI GHI NHẬN NGAY sự đính chính này một cách điềm đạm và tích cực: Ghi nhận em đang hướng tới bậc Đại học chính quy tại ${targetSchool}.
- Nhắc nhở rằng ở bậc Đại học, yêu cầu sẽ thiên về nền tảng kiến thức kỹ thuật chuyên sâu và điểm chuẩn cạnh tranh theo tổ hợp môn thi THPT.
- Ở Lượt 3: Hỏi về môn tự tin nhất và môn lo lắng nhất trong tổ hợp môn xét tuyển học bạ/thi THPT.
- Ở Lượt 4: RA LỆNH học sinh tự sang Bước 3 chọn tổ hợp có lợi nhất từ học bạ để đối chứng điểm chuẩn của ${targetSchool}.
- TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại "Học nghề là một hướng đi thực tế...", không nhắc đến cổng trường nghề hay rèn luyện thể lực của học nghề.
`;
  } else if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị') || lowerUser.includes('tin học')) {
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

1. QUY TẮC XỬ LÝ BIẾN DỮ LIỆU ĐẦU VÀO (CHỐNG LỖI HIỂN THỊ CHUỖI RỖNG):
   - Biến [TRƯỜNG MỤC TIÊU]:
     + Nếu học sinh điền: "chưa biết", "chưa rõ", "chưa xác định" hoặc để trống: TUYỆT ĐỐI KHÔNG ghép thành cụm từ vô nghĩa như "tại [chưa biết học ở đâu]" hay "tại chưa biết".
     + Thay bằng cách diễn đạt tự nhiên: "một cơ sở đào tạo phù hợp", "trường đào tạo nghề em đang nhắm tới", hoặc bỏ hẳn vế nhắc tên trường nếu chưa cần thiết.

2. QUY TẮC PHÂN HÓA HƯỚNG ĐI: ĐẠI HỌC VS. HỌC NGHỀ / THỰC HÀNH:
   - Khi học sinh chọn hướng Học nghề (nấu ăn, sửa chữa, làm đẹp, kỹ thuật, lái xe...) hoặc bộc lộ tâm lý "ngán kiến thức / học dở các môn":
     + KHÔNG ép học sinh so sánh "điểm chuẩn 3 năm gần nhất của đại học" hay xét tổ hợp môn phức tạp.
     + Tiếp cận thực tế theo đúng 2 nấc nhận thức:
       * Nấc 1 (Điều kiện pháp lý & đầu vào): Công nhận học nghề là lựa chọn thực tế, nhưng nhắc nhở điều kiện tiên quyết: PHẢI THI ĐỖ TỐT NGHIỆP THPT VÀ ĐẠT CHUẨN HỌC BẠ để được vào các trường nghề uy tín. Tránh để học sinh ngộ nhận rằng chọn học nghề là có thể buông xuôi hoàn toàn việc học lớp 12.
       * Nấc 2 (Thực tế công việc & sức bền): Đặt câu hỏi phản tư vào kỷ luật nghề, thể lực, môi trường làm việc khắc nghiệt (đứng liên tục nhiều giờ, chịu nóng, chịu áp lực thời gian, làm ca kíp...) để đo lường độ sẵn sàng hành động.

3. CHỈNH SỬA VĂN PHONG (LOẠI BỎ THÁI ĐỘ PHÁN XÉT & CHỤP MŨ - KỸ THUẬT REFRAMING):
   - CẤM CÁC CÂU BẮT LỖI GẮNG GƯỢNG NHƯ: "Sự mơ hồ cho thấy em chưa có cơ sở...", "Em đang ảo tưởng...", "Em chọn vì đám đông...", "Em lãng phí...", "người khác quyết định hộ...".
   - BẮT BUỘC DÙNG KỸ THUẬT TÁI ĐỊNH KHUNG (REFRAMING) THEO 3 BƯỚC:
     + Đồng cảm trước: "Thầy hiểu cảm giác áp lực khi các môn lý thuyết không phải là thế mạnh của em...", "Thầy hiểu học nghề là lựa chọn thực tế...", "Thầy hiểu việc chưa chọn được ngành ở lớp 12 là điều tự nhiên..."
     + Cung cấp sự thật khách quan: "Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực ca kíp, kỷ luật nghề..."
     + Một câu hỏi duy nhất: "Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?"

4. QUY TẮC "MỘT CÂU HỎI ĐƠN - KHÔNG GIẢNG BÀI - KHÔNG ĐƯA ĐÁP ÁN":
   - AI CHỈ ĐẶT CÂU HỎI, TUYỆT ĐỐI KHÔNG GIẢNG BÀI hay giải thích kiến thức tuyển sinh thay học sinh.
   - Mỗi lượt phản hồi chỉ được đưa ra TỐI ĐA 1-2 CÂU VĂN NHẬN ĐỊNH và KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN RÕ RÀNG (ở Vòng 1, 2, 3). TUYỆT ĐỐI KHÔNG HỎI KÉP, KHÔNG NHỒI 2-3 Ý.
   - Mọi số liệu điểm chuẩn, tổ hợp xét tuyển phải đẩy sang Bước 3 để học sinh tự tra cứu và đối chứng.

5. ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ (CHỈ Ở LƯỢT 4):
   - Ở lượt cuối cùng (Lượt 4), TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi (không có dấu ?), ra lệnh dứt khoát chuyển sang Bước 3.

6. QUY TẮC CẦU NỐI TỰ NHIÊN & CHỐNG "QUAY XE" ĐỘT NGỘT (ANTI-ABRUPT PIVOT & SEAMLESS BRIDGE):
   - Phản hồi của Thầy Socrates BẮT BUỘC phải tiếp nối mạch suy nghĩ trực tiếp của học sinh (Follow-the-lead). TUYỆT ĐỐI KHÔNG được gật đầu chiếu lệ rồi bẻ lái 180 độ sang tra khảo chủ đề khác (đặc biệt là tiền lương / nhà tuyển dụng khi học sinh chưa hề nhắc tới).
   - Khi học sinh chia sẻ về TÌNH CẢM GIA ĐÌNH / ƯỚC MƠ TỪ NHỎ / GIÁ TRỊ NHÂN VĂN (như "chữa bệnh cho ba mẹ", "thích từ bé", "muốn giúp người", "yêu trẻ", "đam mê"):
     + TUYỆT ĐỐI CẤM: Không được hỏi câu hỏi tiền lương hay "nhà tuyển dụng trả bao nhiêu tiền ngay khi tốt nghiệp".
     + CẦU NỐI PHẢN TƯ: Công nhận sự thiêng liêng/đẹp đẽ của tình cảm đó, nhưng đối chất ngay vào TÍNH KHỐC LIỆT CỦA THỰC TẾ ĐÀO TẠO & SỨC BỀN:
       * Với ngành Y/Bác sĩ: 6 năm học đại học áp lực lớn, trực đêm liên tục và 18 tháng thực hành lâm sàng áp lực sinh tử trước khi được cấp chứng chỉ hành nghề. Hỏi xem em đã chuẩn bị tâm lý và sức bền thế nào cho chặng đường dài nhiều hy sinh này.
       * Với các ngành khác: Đối chất giữa "thích cảm giác làm nghề" và "chịu đựng được áp lực, kỷ luật và khó khăn thực tế hàng ngày".
   - Khi học sinh thừa nhận "EM CŨNG KHÔNG RÕ" / "CHƯA RÕ" / CẢM TÍNH:
     + Khen ngợi sự trung thực, đối chất vào rủi ro "vỡ mộng" khi chọn nghề bằng cảm tính mà thiếu dữ liệu thực tế.
   - Chỉ khi học sinh NÓI RÕ VỀ MỨC LƯƠNG / LÀM GIÀU thì mới hỏi về mức thu nhập cạnh tranh trên thị trường.

7. CHUẨN MỰC TỪ NGỮ SƯ PHẠM (TUYỆT ĐỐI CẤM BIỆT NGỮ THỊ TRƯỜNG "THỰC CHIẾN"):
   - TUYỆT ĐỐI CẤM sử dụng từ "thực chiến", "kỹ năng thực chiến", "kinh nghiệm thực chiến", "dự án thực chiến" trong mọi phát ngôn của Thầy Socrates. Đây là biệt ngữ thương mại/tiếp thị của các khóa đào tạo ngắn hạn ngoài thị trường, không phù hợp với chuẩn mực học thuật, sư phạm của đề tài nghiên cứu KHKT.
   - BẮT BUỘC thay thế bằng ngôn ngữ sư phạm chuẩn mực:
     + Thay "kỹ năng thực chiến" bằng: "năng lực thực hành nghề nghiệp", "kỹ năng chuyên môn thực tế" hoặc "năng lực nghề nghiệp thực tế".
     + Thay "kinh nghiệm thực chiến" bằng: "kinh nghiệm thực tế" hoặc "kinh nghiệm cọ xát thực tế".
     + Thay "dự án thực chiến" bằng: "dự án thực tế" hoặc "sản phẩm thực tế".
     + Thay "môi trường thực chiến" bằng: "môi trường làm việc thực tế".
`;

  if (stage === 1) {
    if (isUndecidedOrVague(effectiveCareer)) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 1 (NHÁNH B: ĐỊNH HƯỚNG MỤC TIÊU CHO HỌC SINH MƠ HỒ / CHƯA CÓ NGÀNH CỤ THỂ):
- Học sinh chưa chọn được ngành nghề cụ thể hoặc đang phân vân, mơ hồ.
- Thầy Socrates áp dụng kỹ thuật Re-framing đồng cảm trước, không phán xét.

[NHIỆM VỤ LƯỢT 1]:
1. Đồng cảm: Chào em và khẳng định việc chưa chọn được ngành ở lớp 12 là điều tự nhiên.
2. ĐẶT DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Chào em. Thầy hiểu ở thời điểm này, việc chưa chọn được một ngành cụ thể là tâm lý rất bình thường của nhiều học sinh lớp 12. Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG phán xét hay chê trách sự mơ hồ của học sinh.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
    }

    const studentObj = {
      id: studentId || profile?.id || '',
      name: studentName || profile?.name || 'em',
      baselineTarget: effectiveCareer,
      targetCareer: effectiveCareer,
      targetSchool: targetSchool,
      source: reason,
      anchorReason: profile?.anchorReason || '',
      anchorQuote: profile?.anchorQuote || reason || '',
      conf_T0: initialConfidence,
      gpa_A00: gpa_A00 || 25.0,
      benchmark_target: benchmark_target || 27.5,
      riasec_match_pct: riasec_match_pct != null ? riasec_match_pct : 40,
      riasecCode: riasecCode || hollandCode || 'Xã hội'
    };
    const firstPrompt = generateSocraticFirstPrompt(studentObj);

    return `${CORE_PROMPT}
BỐI CẢNH VÒNG 1 (THIÊN LỆCH NHẬN THỨC KÍCH HOẠT: ${firstPrompt.biasType}):
- Quy tắc kích hoạt: ${firstPrompt.biasRule}
- Ngành mục tiêu: ${effectiveCareer}
- Cơ sở đào tạo mục tiêu: ${targetSchool}
- Mức tự tin ban đầu (T0): ${initialConfidence}/10
- Lý do chọn / Mỏ neo ban đầu: "${reason}"
- Thiên hướng RIASEC: ${hollandCode}

[NHIỆM VỤ LƯỢT 1 - KÍCH HOẠT PHẢN TƯ THÍCH ỨNG THEO ĐÚNG THIÊN LỆCH]:
1. Bắt đầu bằng lời chào điềm đạm, trung tính:
"${firstPrompt.botGreeting}"
2. ĐẶT ĐÚNG CÂU HỎI TRUY VẤN MỎ NEO CỐT LÕI ĐÃ ĐƯỢC THIẾT KẾ:
"${firstPrompt.firstQuestion}"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà, không phán xét hay chụp mũ học sinh.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay bảo học sinh sang Bước 3 ở Lượt 1.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  if (isVocational) {
    // =========================================================================
    // KỊCH BẢN PHÂN HÓA HỌC NGHỀ / THỰC HÀNH (TUÂN THỦ 2 NẤC NHẬN THỨC)
    // =========================================================================
    if (stage === 2) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 2 (HỌC NGHỀ - NẤC 2: THỰC TẾ CÔNG VIỆC, KỶ LUẬT & SỨC BỀN):
- Ngành nghề: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Kỳ vọng thu nhập: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2 - NẤC 2: THỰC TẾ CÔNG VIỆC & SỨC BỀN]:
1. Áp dụng kỹ thuật Tái định khung: Công nhận thị trường cần nhân lực, nhưng khẳng định mức thu nhập gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường khắc nghiệt (như đứng liên tục nhiều giờ, nhiệt độ nóng, áp lực thời gian, ca kíp).
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập ${expectedIncome} luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (như đứng liên tục nhiều giờ, chịu nhiệt độ, áp lực thời gian và ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG phán xét hay chụp mũ.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
    }

    if (stage === 3) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 3 (HỌC NGHỀ - NẤC 1: ĐIỀU KIỆN PHÁP LÝ & BẰNG TỐT NGHIỆP THPT):
- Ngành nghề: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Học sinh vừa phản hồi: "${userText}".

[NHIỆM VỤ LƯỢT 3 - NẤC 1: ĐIỀU KIỆN PHÁP LÝ & ĐẦU VÀO]:
1. Nhắc nhở điều kiện tiên quyết: Phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ để được xét tuyển vào các trường nghề uy tín. Tránh để học sinh ngộ nhận rằng chọn học nghề là có thể buông xuôi hoàn toàn việc học lớp 12.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Nhiều bạn nghĩ học nghề là có thể buông xuôi việc học lớp 12, nhưng thực tế các trường nghề uy tín đều yêu cầu điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ. Nhìn lại sức học hiện tại của mình, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm bằng tốt nghiệp THPT làm tấm vé vào trường nghề?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG ép so sánh điểm chuẩn 3 năm của đại học.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
    }

    // stage === 4
    return `${CORE_PROMPT}
BỐI CẢNH VÒNG 4 (HỌC NGHỀ - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành nghề: ${effectiveCareer}, cơ sở đào tạo: ${targetSchool}.
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 4 - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ CHO HỌC NGHỀ]:
1. Đưa ra đúng 1 câu nhận định trung tính: Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự rèn luyện thể lực là điều kiện tiên quyết.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC (TUYỆT ĐỐI KHÔNG CÓ DẤU ? VÀ KHÔNG NHẮC ĐẾN HỌC PHÍ):
"Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự chuẩn bị về thể lực là điều kiện tiên quyết. Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${targetSchool} để đối chiếu với hồ sơ của mình."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- Toàn bộ phản hồi chỉ gồm 2 câu văn dứt khoát.${avoidRepetition}`;
  }

  // ==========================================
  // KỊCH BẢN ĐẠI HỌC / HỌC THUẬT
  // ==========================================
  if (stage === 2) {
    if (isMedicalCareer && isFamilyOrAltruistic) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 2 (NGÀNH Y/BÁC SĨ - ĐỐI CHẤT ƯỚC MƠ HIẾU THẢO VỚI HIỆN THỰC ĐÀO TẠO KHỐC LIỆT):
- Ngành: ${targetCareer}, trường: ${targetSchool}.
- Học sinh vừa chia sẻ động cơ tình cảm/gia đình: "${userText}".

[NHIỆM VỤ LƯỢT 2 - CẦU NỐI TỰ NHIÊN, TUYỆT ĐỐI KHÔNG QUAY XE SANG TIỀN LƯƠNG]:
1. Đồng cảm chân thành với tấm lòng hiếu thảo/ước mơ từ nhỏ muốn chữa bệnh cho ba mẹ.
2. TUYỆT ĐỐI KHÔNG hỏi về tiền lương khởi điểm hay "nhà tuyển dụng trả 15-20 triệu ngay khi ra trường" (vì ngành Y đào tạo 6 năm + 18 tháng thực hành lâm sàng, áp lực không nằm ở lương khởi điểm của nhà tuyển dụng tư nhân).
3. ĐỐI CHẤT VỚI HIỆN THỰC ĐÀO TẠO & SỨC BỀN: Ngành Y đòi hỏi tối thiểu 6 năm học đại học áp lực cực lớn, những đêm trực trắng tại bệnh viện và thêm 18 tháng thực hành lâm sàng áp lực sinh tử trước khi được cấp chứng chỉ hành nghề.
4. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Ước mơ chữa bệnh cho ba mẹ là một tấm lòng rất đáng quý. Nhưng ngành Y đòi hỏi tối thiểu 6 năm học đại học áp lực cực lớn, những đêm trực trắng tại bệnh viện và thêm 18 tháng thực hành lâm sàng trước khi có thể độc lập hành nghề. Khi nghĩ về chặng đường dài và nhiều áp lực sinh tử đó, điều gì khiến em tin mình có đủ sức bền và sự kiên trì để đi đến cùng?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG quay xe sang hỏi tiền lương hay nhà tuyển dụng.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
    }

    if (isFamilyOrAltruistic) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 2 (ĐỐI CHẤT ƯỚC MƠ CẢM XÚC VỚI HIỆN THỰC KHẮC NGHIỆT CỦA NGHỀ):
- Ngành: ${targetCareer}, trường: ${targetSchool}.
- Học sinh vừa chia sẻ động cơ cảm xúc/gia đình/ước mơ từ nhỏ: "${userText}".

[NHIỆM VỤ LƯỢT 2 - CẦU NỐI TỰ NHIÊN, TUYỆT ĐỐI KHÔNG QUAY XE SANG TIỀN LƯƠNG]:
1. Công nhận vẻ đẹp của ước mơ/tình cảm đó một cách chân thành và điềm đạm.
2. TUYỆT ĐỐI KHÔNG quay xe đột ngột sang hỏi chuyện tiền bạc/nhà tuyển dụng trả bao nhiêu tiền.
3. Tạo cầu nối sang thực tế: Việc yêu thích cảm giác làm nghề rất khác với việc chịu đựng được những áp lực, góc khuất và tính kỷ luật khắt khe của công việc hàng ngày.
4. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Ước mơ từ nhỏ là một điểm tựa đẹp, nhưng việc yêu thích nghề rất khác với việc chịu đựng được những áp lực và góc khuất thực tế của công việc hàng ngày. Em đã tìm hiểu xem những khó khăn lớn nhất mà một người làm ngành này phải đối mặt là gì chưa?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG đổi chủ đề sang tiền bạc một cách đột ngột.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
    }

    if (isVagueOrUncertain) {
      return `${CORE_PROMPT}
BỐI CẢNH VÒNG 2 (ĐỐI CHẤT SỰ MƠ HỒ CẢM TÍNH VỚI NHU CẦU DỮ LIỆU THỰC TẾ):
- Ngành: ${targetCareer}, trường: ${targetSchool}.
- Học sinh vừa thừa nhận sự mơ hồ/chưa rõ: "${userText}".

[NHIỆM VỤ LƯỢT 2 - CẦU NỐI MỀM MẠI]:
1. Ghi nhận sự thẳng thắn: Thừa nhận "chưa rõ" là một khởi đầu tốt để bắt đầu tìm hiểu nghiêm túc.
2. Tạo cầu nối: Nếu chọn nghề chỉ dựa vào cảm tính mà chưa từng tìm hiểu công việc thực tế hay hỏi người trong nghề, rủi ro vỡ mộng khi bước vào trường đại học sẽ rất lớn.
3. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Sự thẳng thắn thừa nhận 'chưa rõ' là một khởi đầu tốt. Nhưng nếu chọn nghề chỉ theo cảm tính mà chưa từng đối chiếu với công việc thực tế hay hỏi chuyện người trong nghề, rủi ro vỡ mộng sẽ rất lớn. Em nghĩ điều gì đang cản trở em tìm hiểu sâu hơn về ngành này?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG dùng từ ngữ phán xét.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
    }

    return `${CORE_PROMPT}
BỐI CẢNH VÒNG 2 (BÓC TÁCH MÂU THUẪN GIỮA KỲ VỌNG THU NHẬP & NĂNG LỰC THỰC TẾ):
- Ngành: ${targetCareer}, trường: ${targetSchool}.
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2 - QUY TẮC CÂU HỎI ĐƠN]:
1. Phản hồi ngắn gọn (tối đa 1-2 câu), bắt nhịp tự nhiên từ câu trả lời của học sinh rồi mới chuyển tiếp sang yêu cầu năng lực thực tế để đạt mức thu nhập ${expectedIncome}.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN (TUYỆT ĐỐI KHÔNG HỎI KÉP):
"Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập ${expectedIncome} ngay khi em vừa tốt nghiệp?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG hỏi dồn 2-3 ý.
- TUYỆT ĐỐI KHÔNG giảng bài, không phán xét chụp mũ.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  if (stage === 3) {
    return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH VÒNG 3 (BÓC TÁCH MÂU THUẪN HỌC LỰC & MÔN XÉT TUYỂN):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Học sinh vừa phản hồi: "${userText}"

[NHIỆM VỤ LƯỢT 3 - TUÂN THỦ NGUYÊN TẮC CHỈ HỎI, KHÔNG GIẢNG BÀI]:
1. Ghi nhận chừng mực thế mạnh hoặc băn khoăn của học sinh nếu có. Tuyệt đối không phán xét tiêu cực.
2. TUYỆT ĐỐI KHÔNG GIẢNG BÀI về chương trình GDPT 2018, không tự phỏng đoán nhân hệ số 2 hay điều kiện chuẩn của trường.
3. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN để học sinh tự soi lại năng lực học bạ của mình:
"Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG giảng giải lý thuyết tuyển sinh hay phân tích đề án trường.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 ở lượt này.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.${avoidRepetition}`;
  }

  // Stage 4
  return `${CORE_PROMPT}${adaptiveDirective}
BỐI CẢNH VÒNG 4 (BÓC TÁCH MÂU THUẪN TUYỂN SINH & ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Học sinh vừa trả lời về môn học: "${userText}"

[NHIỆM VỤ LƯỢT 4 - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ]:
1. Đưa ra đúng 1 câu nhận định trung tính: Việc tự tin ở môn thế mạnh là điểm tựa tốt, nhưng điểm chuẩn cạnh tranh vào ngành ${effectiveCareer} ${schoolClause} đòi hỏi sự chắc chắn của toàn bộ tổ hợp xét tuyển thực tế.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC (TUYỆT ĐỐI KHÔNG CÓ DẤU ? VÀ KHÔNG NHẮC ĐẾN HỌC PHÍ):
"Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
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
  const isUniClarification = hasUniversityClarification(trimmedMsg);
  const targetSchool = formatSchoolName(rawSchool, isVocational);
  const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');

  if (stage === 1) {
    if (isUndecidedOrVague(effectiveCareer)) {
      return `Chào em. Thầy hiểu ở thời điểm này, việc chưa chọn được một ngành cụ thể là tâm lý rất bình thường của nhiều học sinh lớp 12. Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?`;
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
      gpa_A00: gpa_A00 || 25.0,
      benchmark_target: benchmark_target || 27.5,
      riasec_match_pct: riasec_match_pct != null ? riasec_match_pct : 40,
      riasecCode: riasecCode || hollandCode || 'Xã hội'
    };
    const firstPrompt = generateSocraticFirstPrompt(studentObj);
    return firstPrompt.firstQuestion;
  }

  if (isUniClarification) {
    if (stage === 4) {
      return `Thầy ghi nhận em đang hướng tới bậc Đại học chính quy ngành ${effectiveCareer} ${schoolClause} chứ không phải học nghề. Với bậc Đại học, yêu cầu sẽ thiên về nền tảng kiến thức kỹ thuật chuyên sâu và điểm chuẩn cạnh tranh theo tổ hợp môn. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
    }
    if (stage === 3) {
      return `Thầy ghi nhận em đang hướng tới bậc Đại học chính quy ngành ${effectiveCareer} ${schoolClause} chứ không phải học nghề. Để xét tuyển vào trường, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;
    }
    if (stage === 2) {
      return `Thầy ghi nhận em hướng tới bậc Đại học chính quy ngành ${effectiveCareer} ${schoolClause}. Em kỳ vọng mức thu nhập ${expectedIncome} sau khi tốt nghiệp. Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập đó ngay khi ra trường?`;
    }
  }

  if (isVocational) {
    if (stage === 2) {
      return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (như đứng liên tục nhiều giờ, chịu nhiệt độ, áp lực thời gian và ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?`;
    }
    if (stage === 3) {
      return `Học nghề không đồng nghĩa với việc có thể buông xuôi việc học lớp 12, vì các trường nghề uy tín đều yêu cầu điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ. Nhìn lại sức học hiện tại của mình, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm bằng tốt nghiệp THPT làm tấm vé vào trường nghề?`;
    }
    return `Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự rèn luyện thể lực là điều kiện tiên quyết. Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${targetSchool} để đối chiếu với hồ sơ của mình.`;
  }

  if (stage === 2) {
    const lowerMsg = (trimmedMsg || '').toLowerCase();
    const isFamily = ['ba mẹ', 'bố mẹ', 'cha mẹ', 'gia đình', 'chữa bệnh', 'từ nhỏ', 'từ bé', 'ước mơ từ nhỏ', 'thích từ nhỏ', 'giúp đỡ', 'cứu người', 'yêu trẻ', 'hiếu thảo'].some(k => lowerMsg.includes(k));
    const isMed = ['bác sĩ', 'y khoa', 'y đa khoa', 'y dược', 'y tế', 'điều dưỡng', 'dược'].some(k => effectiveCareer.toLowerCase().includes(k) || lowerMsg.includes(k));
    const isVague = ['không rõ', 'chưa rõ', 'không biết', 'chưa biết', 'chưa tìm hiểu', 'nghĩ vậy', 'cảm thấy', 'tùy'].some(k => lowerMsg.includes(k));

    if (isMed && isFamily) {
      return `Thầy hiểu tình cảm và mong muốn hiếu thảo muốn chữa bệnh cho ba mẹ là động lực rất thiêng liêng của em. Tuy nhiên, ngành Y đòi hỏi tối thiểu 6 năm học đại học áp lực cực lớn, những đêm trực trắng tại bệnh viện và thêm 18 tháng thực hành lâm sàng trước khi có thể độc lập hành nghề. Khi nghĩ về chặng đường dài và nhiều áp lực sinh tử đó, điều gì khiến em tin mình có đủ sức bền và sự kiên trì để đi đến cùng?`;
    }
    if (isFamily) {
      return `Thầy hiểu ước mơ và tình cảm dành cho gia đình là động lực rất đáng trân trọng của em. Tuy nhiên, việc yêu thích một ngành nghề rất khác với việc chịu đựng được những áp lực và kỷ luật khắt khe của công việc thực tế hàng ngày. Khi tìm hiểu về ngành này, em đã lường trước những khó khăn lớn nhất mà mình sẽ phải đối mặt chưa?`;
    }
    if (isVague) {
      return `Sự thẳng thắn thừa nhận 'chưa rõ' là một khởi đầu tốt để nhìn lại. Nhưng nếu chỉ chọn nghề theo cảm tính từ nhỏ mà chưa từng đối chiếu với công việc thực tế hay hỏi chuyện người trong nghề, rủi ro vỡ mộng sẽ rất lớn. Em nghĩ điều gì đang cản trở em tìm hiểu thực tế về ngành này?`;
    }
    return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập đó ngay khi em vừa tốt nghiệp?`;
  }

  if (stage === 3) {
    return `Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;
  }

  // Stage 4
  const lowerUser = (trimmedMsg || '').toLowerCase();
  const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');
  const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);

  if (isBalancedGrades) {
    return `Học đều các môn là một nền tảng tốt, nhưng điểm chuẩn vào ngành ${effectiveCareer} ${schoolClause} đòi hỏi điểm số bứt phá ở tổ hợp xét tuyển. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
  }

  if (strongSubject && weakSubject) {
    return `Thế mạnh ở môn ${strongSubject} là điểm tựa tốt, nhưng môn ${weakSubject} nếu chưa đạt yêu cầu sẽ là rào cản khi xét tuyển vào ngành ${effectiveCareer} ${schoolClause}. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
  }

  if (strongSubject && !weakSubject) {
    return `Môn ${strongSubject} là một điểm tựa, nhưng điểm chuẩn ngành ${effectiveCareer} ${schoolClause} đòi hỏi cả tổ hợp xét tuyển phải đạt ngưỡng an toàn. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
  }

  return `Để biết năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${effectiveCareer} ${schoolClause} hay không, em cần đối chứng với dữ liệu thực tế. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${targetSchool} xem độ chênh lệch thực tế là bao nhiêu.`;
}
