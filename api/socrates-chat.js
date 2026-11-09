// api/socrates-chat.js - Vercel Serverless Function kết nối Gemini API
// ==============================================================================
// SOCRACAREER - BƯỚC 2: ĐỐI THOẠI PHẢN TƯ VỚI AI SOCRATES (4 CHẶNG)
// Phiên bản quy trình: v2.0_reflective_4stages_2026
// Mục tiêu: Giúp học sinh làm rõ lý do chọn ngành, hiểu biết về ngành,
// căn cứ đánh giá cơ hội việc làm, sự chuẩn bị và những điều cần kiểm chứng ở Bước 3.
// Tôn trọng quyền tự quyết, không gây áp lực, không bịa đặt số liệu/nguồn tin.
// ==============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

export const WORKFLOW_VERSION = 'v2.0_reflective_4stages_2026';

const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
const fallbackKey = typeof Buffer !== 'undefined'
  ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
  : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

const apiKey = process.env.GEMINI_API_KEY
  || process.env.VITE_GEMINI_API_KEY
  || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  || fallbackKey;

const genAI = new GoogleGenerativeAI(apiKey);

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
    return isVocational ? `${prefix}cơ sở đào tạo nghề em đang quan tâm` : `${prefix}cơ sở đào tạo em đang hướng tới`;
  }
  return `${prefix}${school}`;
}

export function formatSchoolName(school, isVocational = false) {
  if (isSchoolUndecided(school)) {
    return isVocational ? 'cơ sở đào tạo nghề em đang quan tâm' : 'cơ sở đào tạo em đang hướng tới';
  }
  return school;
}

export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = [
    'chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân',
    'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho',
    'ngành nghề mục tiêu', 'ngành đã chọn'
  ];
  return clean.length === 0 || vagueKeywords.some(k => clean === k || clean.includes(k));
}

export function isBroadMajorField(career) {
  if (isUndecidedOrVague(career)) return true;
  const norm = removeVietnameseTones(career);
  const exactBroadFields = [
    'kinh te', 'nhom nganh kinh te', 'khoi kinh te', 'linh vuc kinh te',
    'ky thuat', 'nhom nganh ky thuat', 'khoi ky thuat', 'linh vuc ky thuat',
    'cong nghe', 'nhom nganh cong nghe', 'khoi cong nghe',
    'y duoc', 'khoi y duoc', 'nhom nganh y duoc', 'suc khoe', 'y te',
    'su pham', 'khoi su pham', 'nhom nganh su pham', 'giao duc',
    'ngon ngu', 'ngoai ngu', 'khoi ngon ngu',
    'xa hoi', 'khoa hoc xa hoi', 'nhan van',
    'truyen thong', 'dich vu', 'kinh doanh', 'nghe thuat', 'nong nghiep', 'luat'
  ];
  return exactBroadFields.includes(norm);
}

export function hasUniversityClarification(userText = '') {
  if (!userText || typeof userText !== 'string') return false;
  const uNorm = removeVietnameseTones(userText);
  const patterns = [
    'hoc dai hoc', 'hoc dh', 'thi dai hoc', 'thi dh', 'vao dai hoc', 'vao dh',
    'chon dai hoc', 'chon dh', 'bac dai hoc', 'he dai hoc', 'do dai hoc', 'truong dai hoc',
    'khong hoc nghe', 'khong phai hoc nghe', 'khong hoc truong nghe', 'khong phai truong nghe'
  ];
  return patterns.some(p => uNorm.includes(p));
}

export function isVocationalTrack(career = '', userText = '', school = '') {
  const cNorm = removeVietnameseTones(career);
  const uNorm = removeVietnameseTones(userText);
  const sNorm = removeVietnameseTones(school);

  if (hasUniversityClarification(userText)) return false;

  const isExplicitVocationalSchool = ['nghe', 'trung cap', 'salon', 'day nghe'].some(k => sNorm.includes(k));
  const isUniSchool = ['dh', 'dai hoc', 'hoc vien', 'university', 'bach khoa'].some(k => sNorm.includes(k));

  if (isUniSchool && !isExplicitVocationalSchool) return false;
  if (isExplicitVocationalSchool) return true;

  const pureVocationalKeywords = [
    'pha che', 'barista', 'lam banh', 'tho han', 'tho tien', 'tho may',
    'spa', 'nail', 'cat toc', 'barber', 'trang diem', 'makeup',
    'hoc nghe', 'trung cap nghe', 'truong nghe', 'cao dang nghe'
  ];
  return pureVocationalKeywords.some(k => cNorm.includes(k) || uNorm.includes(k));
}

export function detectGoalShift(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.toLowerCase().trim();

  const knownMajors = [
    { patterns: ['sư phạm giáo dục chính trị', 'giáo dục chính trị'], name: 'Sư phạm Giáo dục Chính trị', field: 'soc' },
    { patterns: ['sư phạm ngữ văn', 'sư phạm văn'], name: 'Sư phạm Ngữ văn', field: 'soc' },
    { patterns: ['sư phạm tiếng anh', 'sư phạm anh'], name: 'Sư phạm Tiếng Anh', field: 'lang' },
    { patterns: ['ngôn ngữ anh', 'tiếng anh thương mại'], name: 'Ngôn ngữ Anh', field: 'lang' },
    { patterns: ['sư phạm toán'], name: 'Sư phạm Toán', field: 'sci' },
    { patterns: ['giáo dục tiểu học', 'sư phạm tiểu học'], name: 'Giáo dục Tiểu học', field: 'edu' },
    { patterns: ['giáo dục mầm non', 'sư phạm mầm non'], name: 'Giáo dục Mầm non', field: 'edu' },
    { patterns: ['kỹ thuật phần mềm', 'công nghệ phần mềm'], name: 'Kỹ thuật Phần mềm', field: 'tech' },
    { patterns: ['khoa học máy tính'], name: 'Khoa học Máy tính', field: 'tech' },
    { patterns: ['an toàn thông tin', 'an ninh mạng'], name: 'An toàn Thông tin', field: 'tech' },
    { patterns: ['công nghệ thông tin', 'cntt'], name: 'Công nghệ Thông tin', field: 'tech' },
    { patterns: ['quản trị kinh doanh', 'qtkd'], name: 'Quản trị Kinh doanh', field: 'biz' },
    { patterns: ['marketing', 'tiếp thị'], name: 'Marketing', field: 'biz' },
    { patterns: ['kinh doanh quốc tế', 'xuất nhập khẩu', 'logistics'], name: 'Kinh doanh Quốc tế / Logistics', field: 'biz' },
    { patterns: ['thương mại điện tử'], name: 'Thương mại Điện tử', field: 'biz' },
    { patterns: ['tài chính ngân hàng'], name: 'Tài chính - Ngân hàng', field: 'biz' },
    { patterns: ['kế toán', 'kiểm toán'], name: 'Kế toán - Kiểm toán', field: 'biz' },
    { patterns: ['quản trị dịch vụ du lịch và lữ hành', 'quản trị du lịch', 'quản trị lữ hành'], name: 'Quản trị Dịch vụ Du lịch và Lữ hành', field: 'service' },
    { patterns: ['quản trị khách sạn', 'quản trị nhà hàng'], name: 'Quản trị Khách sạn - Nhà hàng', field: 'service' },
    { patterns: ['luật kinh tế'], name: 'Luật Kinh tế', field: 'law' },
    { patterns: ['y khoa', 'y đa khoa', 'bác sĩ đa khoa'], name: 'Y khoa (Bác sĩ Đa khoa)', field: 'med' },
    { patterns: ['dược học', 'ngành dược', 'dược sĩ'], name: 'Dược học', field: 'med' },
    { patterns: ['điều dưỡng'], name: 'Điều dưỡng', field: 'med' },
    { patterns: ['răng hàm mặt', 'nha khoa'], name: 'Răng - Hàm - Mặt', field: 'med' },
    { patterns: ['tâm lý học'], name: 'Tâm lý học', field: 'soc' }
  ];

  for (const item of knownMajors) {
    if (item.patterns.some(p => clean.includes(p))) {
      return { newMajor: item.name, field: item.field };
    }
  }

  const matchGeneric = clean.match(/(?:nhắm tới|chọn|hướng tới|học|thi)\s+(?:ngành|chuyên ngành)\s+([a-zà-ỹ\s]{3,35}?)(?:\s+(?:mà|nhưng|tại|ở|ạ|vì|do|[.,!?]|$))/i);
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

export function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 6) return false;
  const greetingPatterns = [
    /^(chào|xin chào|chao|hello|hi|alo)\b/i,
    /^(dạ\s+|da\s+)?(em\s+)?(chào|xin chào|chao)\s*(thầy|thay|ai|ạ|a)?$/i,
    /^(dạ|da|vâng|dạ vâng|thưa thầy|thầy ơi)$/i
  ];
  const substantiveWords = [
    'thích', 'vì', 'ngành', 'môn', 'tổ hợp', 'trường', 'đam mê', 'học',
    'điểm', 'thi', 'xét', 'nghề', 'lương', 'việc', 'rồi', 'chưa', 'không', 'biết', 'tìm hiểu'
  ];
  if (substantiveWords.some(w => clean.includes(w))) return false;
  return greetingPatterns.some(p => p.test(clean));
}

export function isBareAffirmationInStage2(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 7) return false;
  const bareYesPatterns = [
    /^(dạ\s+)?(em\s+)?(đã\s+)?(tìm hiểu|biết|xem|đọc|nghe)\s*(rồi|sơ qua|một chút)?\s*(ạ|a)?$/i,
    /^(dạ\s+)?(rồi|có|biết rồi|rồi ạ|có ạ|em biết rồi)$/i
  ];
  return bareYesPatterns.some(p => p.test(clean));
}

export function isUncertainOrDontKnow(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const patterns = [
    'chưa biết', 'chua biet', 'không biết', 'khong biet',
    'chưa tìm hiểu', 'chua tim hieu', 'chưa rõ', 'chua ro',
    'chưa có căn cứ', 'chua co can cu', 'chưa có thông tin',
    'em chưa xem', 'chưa tra cứu', 'không rõ', 'chưa nghĩ tới', 'chưa chuẩn bị'
  ];
  return patterns.some(p => clean.includes(p));
}

export function needsStage3SourceFollowUp(text) {
  if (!text || typeof text !== 'string') return false;
  if (isUncertainOrDontKnow(text)) return false;
  const clean = text.toLowerCase().trim();
  const mentionsInformalOnly = /tiktok|youtube|facebook|mạng xã hội|clip|video|người quen|người nhà|bạn bè|anh chị kể|nghe nói|ai nói|chatgpt/i.test(clean);
  const mentionsOfficialSource = /đề án|báo cáo|thống kê|nhà trường|website trường|cổng thông tin|bộ gd|tuyển dụng|job|jd|doanh nghiệp/i.test(clean);
  const mentionsGradReqs = /yêu cầu|kỹ năng|ngoại ngữ|chuyên môn|kinh nghiệm|chứng chỉ|thái độ|kiến thức|bằng cấp|cần có|đáp ứng/i.test(clean);

  if (mentionsInformalOnly && !mentionsOfficialSource) return true;
  if (clean.split(/\s+/).length <= 8 && !mentionsGradReqs) return true;
  return false;
}

export function hasStage4AdmissionConfusion(text) {
  if (!text || typeof text !== 'string') return false;
  if (isUncertainOrDontKnow(text)) return false;
  const clean = text.toLowerCase().trim();
  const softSkillAsAdmission = /(xét tuyển|trúng tuyển|đậu đại học|đỗ đại học|điểm xét tuyển).*?(giao tiếp|thuyết trình|ngoại hình|làm việc nhóm|kỹ năng mềm)|(giao tiếp|thuyết trình|ngoại hình|kỹ năng mềm).*?(để xét tuyển|để đậu|để đỗ)/i.test(clean);
  const scaleOrMethodConfusion = /(học bạ|điểm thi).*?(giống nhau|như nhau)|không cần tổ hợp|tổ hợp nào cũng được|thang điểm 40.*?2[0-9]\s*điểm là đậu/i.test(clean);
  return softSkillAsAdmission || scaleOrMethodConfusion;
}

/**
 * KHỞI TẠO CÂU HỎI MỞ ĐẦU CHẶNG 1 (LÀM RÕ LÝ DO LỰA CHỌN)
 * Cá nhân hóa từ dữ liệu Bước 1, không gắn nhãn thiên lệch tâm lý.
 */
export function generateSocraticFirstPrompt(student = {}) {
  const targetCareer = (student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || '').trim();
  const rawSchool = (student.targetSchool || student.targetUniversity || student.target_university || '').trim();
  const isVoc = isVocationalTrack(targetCareer, '', rawSchool);
  const schoolClause = isSchoolUndecided(rawSchool) ? '' : `tại ${rawSchool}`;
  const source = (student.source || student.reason || student.anchorQuote || '').trim();

  const hasExplicitReason = Boolean(source && source.length >= 2);
  const reasonSnippet = hasExplicitReason ? ` với lý do ban đầu là "${source}"` : '';

  const inquiryTopic = 'Làm rõ lý do lựa chọn, hiểu biết về ngành, cơ hội việc làm và sự chuẩn bị';
  const topicDescription = 'Đối thoại phản tư 4 chặng giúp học sinh rà soát căn cứ hiện có và xác định những thông tin cần kiểm chứng thêm ở Bước 3.';

  let firstQuestion = '';
  if (isUndecidedOrVague(targetCareer)) {
    firstQuestion = `Chào em. Ở Bước 1, em cho biết mình vẫn đang phân vân và chưa xác định một ngành cụ thể${reasonSnippet}. Hiện tại em đang quan tâm đến lĩnh vực hoặc nhóm ngành cụ thể nào nhất? Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn hướng đi này và điều nào quan trọng nhất với em?`;
  } else if (isBroadMajorField(targetCareer)) {
    firstQuestion = `Chào em. Ở Bước 1, em đã chọn lĩnh vực ${targetCareer}${schoolClause ? ` ${schoolClause}` : ''}${reasonSnippet}. Vì "${targetCareer}" là một lĩnh vực rộng gồm nhiều ngành đào tạo khác nhau, em đang hướng tới ngành cụ thể nào? Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này và điều nào quan trọng nhất với em?`;
  } else {
    firstQuestion = `Chào em. Ở Bước 1, em đã chọn ngành ${targetCareer}${schoolClause ? ` ${schoolClause}` : ''}${reasonSnippet}. Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này? Điều nào quan trọng nhất với em?`;
  }

  return {
    workflowVersion: WORKFLOW_VERSION,
    inquiryTopic,
    topicDescription,
    // Giữ thuộc tính tương thích hệ thống cũ (không mang nhãn phán xét thiên lệch):
    biasType: inquiryTopic,
    biasRule: topicDescription,
    botGreeting: `Chào ${student.name || 'em'}. Chúng ta sẽ cùng trao đổi qua 4 chặng ngắn để làm rõ lý do chọn ngành, mức độ hiểu biết thực tế, cơ hội việc làm và những điều cần kiểm chứng ở Bước 3.`,
    firstQuestion
  };
}

export function initSocratesChat(profile = {}) {
  return generateSocraticFirstPrompt(profile).firstQuestion;
}

/**
 * LÀM SẠCH & ĐẢM BẢO NGUYÊN TẮC PHẢN HỒI TRUNG LẬP, THÂN THIỆN, KHÔNG GÂY ÁP LỰC
 */
export function sanitizeSocraticResponse(rawText, stage, effectiveCareer, targetSchool, userText = '', isFollowUp = false) {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // 1. Gỡ bỏ tiền tố hệ thống nếu có
  cleaned = cleaned
    .replace(/^(Chuyên gia Phản tư|Trợ lý AI|AI Socrates|Socrates|Thầy Socrates)[:\s-]*/i, '')
    .replace(/^<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ|CHẶNG).*?\]\s*/gi, '')
    .replace(/^#+.*?\n/gi, '')
    .trim();

  // 2. Tuyệt đối loại bỏ các câu gây áp lực bị cấm theo Mục 3
  const forbiddenPressureReplacements = [
    {
      pattern: /[^.!?\n]*gánh\s*(?:vác\s*)?(?:ước mơ|kỳ vọng|mong muốn)\s*của\s*người\s*khác[^.!?\n]*[.!?]?/gi,
      replace: 'Định hướng từ gia đình hoặc người thân là một nguồn tham khảo đáng ghi nhận trong quá trình em cân nhắc lựa chọn.'
    },
    {
      pattern: /[^.!?\n]*phải\s*thừa\s*nhận\s*điểm\s*yếu[^.!?\n]*[.!?]?/gi,
      replace: 'Việc xác định những phần đã chuẩn bị và những phần cần bổ sung sẽ giúp em chủ động hơn.'
    },
    {
      pattern: /[^.!?\n]*suy\s*nghĩ\s*của\s*em\s*quá\s*đơn\s*giản[^.!?\n]*[.!?]?/gi,
      replace: 'Góc nhìn hiện tại của em là điểm khởi đầu để mình tiếp tục tìm hiểu sâu hơn.'
    },
    {
      pattern: /[^.!?\n]*em\s*không\s*phù\s*hợp\s*với\s*ngành\s*này[^.!?\n]*[.!?]?/gi,
      replace: 'Mức độ phù hợp sẽ rõ ràng hơn khi em đối chiếu thêm các thông tin thực tế ở Bước 3.'
    },
    {
      pattern: /[^.!?\n]*(?:ảo tưởng|suy nghĩ vu vơ|mỏ neo ảo|chưa hiệu chuẩn|né tránh chất vấn)[^.!?\n]*[.!?]?/gi,
      replace: 'Điều này mình có thể ghi nhận để kiểm tra thêm bằng số liệu cụ thể ở Bước 3.'
    }
  ];

  forbiddenPressureReplacements.forEach(({ pattern, replace }) => {
    cleaned = cleaned.replace(pattern, replace).trim();
  });

  const major = effectiveCareer || 'ngành đã chọn';

  // 3. Nếu là Chặng 5 (Tổng kết & Chuyển sang Bước 3), đảm bảo kết thúc bằng đúng câu dẫn quy định
  if (stage === 5) {
    const requiredClosing = 'Em đã xác định được những điều cần kiểm tra thêm. Ở bước 3, hãy đối chiếu chúng với nguồn dữ liệu phù hợp để xem lựa chọn của mình đã có căn cứ đến đâu.';
    cleaned = cleaned.replace(/Em hãy bước sang Bước 3[^]*$/i, '').trim();
    if (!cleaned.includes('Em đã xác định được những điều cần kiểm tra thêm')) {
      cleaned = cleaned ? `${cleaned}\n\n${requiredClosing}` : requiredClosing;
    }
    return cleaned.trim();
  }

  return cleaned.trim();
}

/**
 * TẠO SYSTEM PROMPT THEO ĐÚNG 4 CHẶNG (MỤC 1, 2, 3, 4)
 */
function getStageSystemPrompt(stage, profile, userText, isFollowUp = false, followUpReason = '') {
  const {
    effectiveCareer,
    targetSchool: rawSchool,
    reason,
    initialConfidence,
    expectedIncome,
    hollandCode
  } = profile;

  const isVoc = isVocationalTrack(effectiveCareer, userText, rawSchool);
  const schoolName = formatSchoolName(rawSchool, isVoc);

  const CORE_GUIDELINES = `
# VAI TRÒ & MỤC TIÊU BƯỚC 2 (ĐỐI THOẠI PHẢN TƯ VỚI AI SOCRATES)
Bạn là Trợ lý AI đồng hành phản tư hướng nghiệp trên nền tảng SocraCareer dành cho học sinh THPT.
Mục tiêu Bước 2 là giúp học sinh làm rõ:
1. Vì sao mình chọn ngành.
2. Mình đã hiểu yêu cầu học tập và thực tế nghề nghiệp đến đâu.
3. Nhận định về cơ hội việc làm dựa trên căn cứ nào.
4. Mình đã chuẩn bị được gì và cần kiểm chứng điều gì.
Lưu ý cốt tử: KHÔNG đặt mục tiêu buộc học sinh nhận mình sai, giảm tự tin hoặc đổi ngành. AI hỗ trợ xem xét căn cứ và tôn trọng quyền tự quyết của học sinh.

# NGUYÊN TẮC PHẢN HỒI CỦA AI (BẮT BUỘC TUÂN THỦ):
- Giọng thân thiện, trung lập, ngắn gọn (2-3 câu), phù hợp học sinh THPT.
- Phản hồi dựa trên điều học sinh thực sự nói; không suy diễn động cơ.
- Có thể dùng cách diễn đạt: "Em đang cho rằng...", "Căn cứ nào giúp em nhận định như vậy?", "Điều này mình cần kiểm tra thêm".
- TUYỆT ĐỐI KHÔNG sử dụng các câu gây áp lực như:
  * "Em đang gánh ước mơ của người khác"
  * "Em phải thừa nhận điểm yếu"
  * "Suy nghĩ của em quá đơn giản"
  * "Em không phù hợp với ngành này"
- Không đồng thuận chỉ để làm hài lòng, cũng không phản đối chỉ để tỏ ra phản biện.
- Chấp nhận "chưa biết", "chưa tìm hiểu", "chưa có căn cứ" là câu trả lời hợp lệ; ghi nhận trung lập đó là nội dung cần kiểm chứng ở Bước 3 rồi chuyển sang câu hỏi chặng tiếp theo.
- Không tự đưa ra tỷ lệ việc làm, mức lương, điểm chuẩn, tổ hợp xét tuyển, thời gian đào tạo hoặc yêu cầu của một trường nếu chưa có nguồn chính thức phù hợp.

# THÔNG TIN BƯỚC 1 CỦA HỌC SINH:
- Ngành/lĩnh vực mục tiêu: ${effectiveCareer}
- Trường/Cơ sở đào tạo: ${schoolName}
- Lý do ban đầu ở Bước 1: "${reason}"
- Mức tự tin ban đầu: ${initialConfidence}/10 | Kỳ vọng thu nhập: ${expectedIncome} | Mã Holland: ${hollandCode}
`;

  if (stage === 1 && isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ LƯỢT BỔ SUNG CHẶNG 1 - LÀM RÕ NGÀNH CỤ THỂ]:
- Học sinh vừa trả lời: "${userText}".
- Tên ngành hiện tại ("${effectiveCareer}") còn đang là lĩnh vực chung.
- Hãy ghi nhận ngắn gọn ý của học sinh, và đặt 01 câu hỏi ngắn giúp học sinh làm rõ ngành cụ thể đang nhắm tới trước khi đi vào yêu cầu tuyển sinh/nghề nghiệp.`;
  }

  if (stage === 2 && !isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ CHUYỂN SANG CHẶNG 2 - XEM XÉT HIỂU BIẾT VỀ NGÀNH]:
- Học sinh vừa trả lời Chặng 1 (Lý do lựa chọn): "${userText}".
- Hướng dẫn xử lý:
  * Ghi nhận trung lập câu trả lời của học sinh (nếu học sinh chọn theo định hướng cha mẹ/bạn bè hoặc không có lý do nào khác ngoài Bước 1, ghi nhận trung lập và tôn trọng, tuyệt đối không phán xét tiêu cực).
  * Đặt câu hỏi chính của Chặng 2:
    "Em đã tìm hiểu những yêu cầu và khó khăn thực tế nào khi học và làm nghề này? Em biết những điều đó từ đâu?"`;
  }

  if (stage === 2 && isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ CÂU HỎI BỔ SUNG CHẶNG 2]:
- Học sinh vừa trả lời ngắn ("${userText}") rằng đã tìm hiểu nhưng chưa nêu ví dụ hoặc nguồn tin cụ thể.
- Hãy hỏi ngắn gọn 01 câu bổ sung: Mời học sinh nêu một ví dụ cụ thể về yêu cầu học tập hoặc thực tế công việc/cơ hội của ngành ${effectiveCareer} mà em biết, và em biết thông tin đó từ nguồn nào.`;
  }

  if (stage === 3 && !isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ CHUYỂN SANG CHẶNG 3 - XEM XÉT CƠ HỘI VIỆC LÀM]:
- Học sinh vừa trả lời Chặng 2 (Hiểu biết về ngành): "${userText}".
- Hướng dẫn xử lý:
  * Nếu học sinh trả lời "chưa tìm hiểu" / "chưa biết", hãy ghi nhận nhẹ nhàng đó là nội dung cần kiểm chứng ở Bước 3, không trách móc hay giảng giải dài.
  * Nếu học sinh đã nêu thông tin, phản hồi ngắn gọn cân bằng (không chỉ nhấn mạnh mặt khó khăn mà xem xét cả cơ hội và yêu cầu thực tế).
  * Đặt câu hỏi chính của Chặng 3:
    "Em đánh giá cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào? Nhận định đó dựa trên thông tin nào, và người mới ra trường cần đáp ứng những yêu cầu gì?"`;
  }

  if (stage === 3 && isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ CÂU HỎI BỔ SUNG CHẶNG 3]:
- Học sinh vừa trả lời ở Chặng 3: "${userText}" (${followUpReason}).
- Hướng dẫn xử lý:
  * Không mặc định thông tin từ video, người quen hoặc AI là sai, và không dẫn dắt ngành chắc chắn dễ xin việc hay thất nghiệp cao.
  * Đặt 01 câu hỏi bổ sung ngắn: Hỏi xem học sinh có thể dùng thêm nguồn độc lập nào (như báo cáo việc làm của trường, đề án tuyển sinh, bản mô tả công việc của nhà tuyển dụng) để đối chiếu ở Bước 3, và người mới ra trường cần đáp ứng những yêu cầu gì.`;
  }

  if (stage === 4 && !isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ CHUYỂN SANG CHẶNG 4 - ĐỐI CHIẾU SỰ CHUẨN BỊ]:
- Học sinh vừa trả lời Chặng 3 (Cơ hội việc làm): "${userText}".
- Hướng dẫn xử lý:
  * Ghi nhận trung lập nhận định hoặc những điểm học sinh cần kiểm tra thêm về cơ hội việc làm.
  * Đặt câu hỏi chính của Chặng 4:
    "So với yêu cầu tuyển sinh và học tập của ngành, em đã chuẩn bị được gì về môn học và kỹ năng? Điều gì còn thiếu hoặc chưa rõ mà em cần kiểm tra ở bước 3?"`;
  }

  if (stage === 4 && isFollowUp) {
    return `${CORE_GUIDELINES}
[NHIỆM VỤ CÂU HỎI BỔ SUNG CHẶNG 4]:
- Học sinh vừa trả lời ở Chặng 4: "${userText}".
- Hướng dẫn xử lý:
  * Giúp học sinh phân biệt rõ giữa điều kiện trúng tuyển đầu vào (tổ hợp môn xét tuyển, phương thức xét tuyển, điểm chuẩn quy đổi cùng ngành/phương thức/thang điểm) với năng lực cần để học tập và làm nghề (kỹ năng mềm, giao tiếp...). Không mặc định kỹ năng mềm là điều kiện xét tuyển, và không tự khẳng định tổ hợp hay điểm chuẩn khi chưa có nguồn chính thức.
  * Hỏi ngắn gọn 01 câu: Về các môn văn hóa dự kiến dùng để xét tuyển và điều kiện tuyển sinh của trường, em đã chuẩn bị tới đâu và cần kiểm tra thông tin gì ở Bước 3?`;
  }

  return `${CORE_GUIDELINES}
[NHIỆM VỤ TỔNG KẾT SAU 4 CHẶNG & CHUYỂN SANG BƯỚC 3]:
- Học sinh vừa trả lời Chặng 4 (Sự chuẩn bị): "${userText}".
- Hãy ghi nhận ngắn gọn nỗ lực chia sẻ của học sinh qua 4 chặng (nhắc lại 1-2 câu trung lập về những gì học sinh đã nêu và những khoảng trống thông tin sẽ được kiểm chứng tiếp).
- BẮT BUỘC kết thúc bằng đúng nguyên văn câu dẫn sau:
"Em đã xác định được những điều cần kiểm tra thêm. Ở bước 3, hãy đối chiếu chúng với nguồn dữ liệu phù hợp để xem lựa chọn của mình đã có căn cứ đến đâu."`;
}

/**
 * PHẢN HỒI DỰ PHÒNG CHUẨN MỰC (FALLBACK KHI MẠNG CHẬP CHỜN HOẶC HẾT QUOTA)
 * Đảm bảo 100% đúng câu hỏi 4 chặng, trung lập, tôn trọng học sinh.
 */
export function generateCognitiveFallback({
  stage,
  effectiveCareer,
  targetSchool: rawSchool,
  trimmedMsg = '',
  isFollowUp = false
}) {
  const isVoc = isVocationalTrack(effectiveCareer, trimmedMsg, rawSchool);
  const schoolClause = isSchoolUndecided(rawSchool) ? '' : `tại ${formatSchoolName(rawSchool, isVoc)}`;
  const uncertain = isUncertainOrDontKnow(trimmedMsg);
  const lower = String(trimmedMsg || '').toLowerCase();

  if (stage === 1 && isFollowUp) {
    return `Thầy ghi nhận chia sẻ của em. Vì "${effectiveCareer}" là một lĩnh vực khá rộng với nhiều hướng đào tạo khác nhau, em đã nhắm tới ngành học cụ thể nào chưa, hay em cần tìm hiểu thêm để chọn ngành cụ thể ở Bước 3?`;
  }

  if (stage === 2 && !isFollowUp) {
    let ack = `Thầy ghi nhận những lý do và ưu tiên em vừa chia sẻ đối với ngành ${effectiveCareer}.`;
    if (/ba mẹ|bố mẹ|cha mẹ|gia đình|bạn bè/i.test(lower)) {
      ack = `Thầy ghi nhận định hướng từ gia đình/người thân là một cơ sở tham khảo của em khi lựa chọn ngành ${effectiveCareer}.`;
    } else if (/không có|không còn|chỉ vậy|hết rồi/i.test(lower)) {
      ack = `Thầy ghi nhận lý do em đã nêu ở Bước 1 là động lực chính của em hiện tại.`;
    }
    return `${ack} Bước sang Chặng 2, em đã tìm hiểu những yêu cầu và khó khăn thực tế nào khi học và làm nghề này? Em biết những điều đó từ đâu?`;
  }

  if (stage === 2 && isFollowUp) {
    return `Em có thể chia sẻ cụ thể một ví dụ về yêu cầu học tập hoặc thực tế công việc của ngành ${effectiveCareer} mà em đã biết, và em tìm hiểu điều đó từ nguồn nào không?`;
  }

  if (stage === 3 && !isFollowUp) {
    const ack = uncertain
      ? `Việc em chưa tìm hiểu sâu các yêu cầu thực tế ở thời điểm này là hoàn toàn bình thường; mình sẽ ghi nhận nội dung này để kiểm chứng thêm ở Bước 3.`
      : `Thầy ghi nhận những thông tin và nguồn tham khảo mà em đã tìm hiểu về quá trình học tập cũng như thực tế công việc của ngành ${effectiveCareer}.`;
    return `${ack} Ở Chặng 3, em đánh giá cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào? Nhận định đó dựa trên thông tin nào, và người mới ra trường cần đáp ứng những yêu cầu gì?`;
  }

  if (stage === 3 && isFollowUp) {
    return `Thông tin em vừa nêu là một góc nhìn tham khảo ban đầu. Để kiểm chứng đầy đủ hơn ở Bước 3, theo em mình có thể đối chiếu thêm với nguồn độc lập nào (như báo cáo việc làm của trường, đề án tuyển sinh hay thông tin tuyển dụng thực tế), và người mới ra trường cần đáp ứng những yêu cầu gì?`;
  }

  if (stage === 4 && !isFollowUp) {
    const ack = uncertain
      ? `Thầy ghi nhận phần thông tin về cơ hội việc làm và yêu cầu tuyển dụng là nội dung em cần tra cứu thêm ở Bước 3.`
      : `Thầy ghi nhận góc nhìn của em về cơ hội việc làm và các yêu cầu đối với người mới ra trường ngành ${effectiveCareer}.`;
    return `${ack} Bước sang Chặng 4, so với yêu cầu tuyển sinh và học tập của ngành ${effectiveCareer}${schoolClause ? ` ${schoolClause}` : ''}, em đã chuẩn bị được gì về môn học và kỹ năng? Điều gì còn thiếu hoặc chưa rõ mà em cần kiểm tra ở bước 3?`;
  }

  if (stage === 4 && isFollowUp) {
    return `Kỹ năng mềm và năng lực cá nhân rất hữu ích cho quá trình học tập và làm nghề, nhưng xét tuyển đầu vào được tính theo tổ hợp môn và phương thức tuyển sinh riêng của từng trường (cần đối chiếu cùng ngành, cùng phương thức và cùng thang điểm). Về các môn văn hóa dùng để xét tuyển và điều kiện tuyển sinh, em đã chuẩn bị được gì và còn điều gì cần kiểm tra ở bước 3?`;
  }

  // Stage 5: Tổng kết & Chuyển sang Bước 3
  return `Cảm ơn em đã trao đổi thẳng thắn qua cả 4 chặng về lý do chọn ngành, hiểu biết thực tế, cơ hội việc làm và sự chuẩn bị của bản thân. Bản tóm tắt phản tư bên dưới đã tổng hợp lại đúng những nội dung em nêu cùng các câu hỏi gợi ý để em xem và chỉnh sửa trước khi lưu. Em đã xác định được những điều cần kiểm tra thêm. Ở bước 3, hãy đối chiếu chúng với nguồn dữ liệu phù hợp để xem lựa chọn của mình đã có căn cứ đến đâu.`;
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

    const trimmedMsg = userMessage.trim();
    const serverTimestamp = new Date().toISOString();

    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = 'Chào em! Chúng ta cùng bắt đầu nhé. Em hãy chia sẻ suy nghĩ của mình về câu hỏi ở trên để tiếp tục.';
      return res.status(200).json({
        success: true,
        workflowVersion: WORKFLOW_VERSION,
        serverTimestamp,
        stage: Number(body?.stage || body?.chatStage || 1),
        chatStage: Number(body?.chatStage || body?.stage || 1),
        round: Number(body?.round || body?.stage || 1),
        response: greetingReply,
        reply: greetingReply,
        isComplete: false,
        isCompleted: false,
        advanceRound: false
      });
    }

    const currentStage = Math.min(Math.max(Number(body?.stage || body?.chatStage || body?.round || 2), 1), 5);
    const isFollowUp = Boolean(body?.isFollowUp || body?.followUpReason);
    const followUpReason = String(body?.followUpReason || '');

    const studentProfile = body?.studentProfile || body?.userProfile || body?.anchor || {};
    const targetCareer = studentProfile?.targetMajor || studentProfile?.targetCareer || studentProfile?.target_career || 'ngành nghề mục tiêu';
    const targetSchool = studentProfile?.targetSchool || studentProfile?.targetUniversity || studentProfile?.target_university || '';
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || 'RIASEC';
    const reason = studentProfile?.reason || studentProfile?.careerReason || 'Chưa nêu lý do cụ thể';
    const initialConfidence = studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5;
    const expectedIncome = studentProfile?.expectedIncome || studentProfile?.expected_income || 'Chưa xác định';

    const goalShift = detectGoalShift(trimmedMsg);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== targetCareer.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : targetCareer;

    const systemPrompt = getStageSystemPrompt(currentStage, {
      targetCareer,
      effectiveCareer,
      targetSchool,
      hollandCode,
      reason,
      initialConfidence,
      expectedIncome
    }, trimmedMsg, isFollowUp, followUpReason);

    const validHistory = Array.isArray(chatHistory) ? chatHistory : (Array.isArray(body?.history) ? body.history : []);
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
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.3,
            topP: 0.85,
            maxOutputTokens: 700
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model generation timeout')), 6500)
        );

        const result = await Promise.race([
          model.generateContent({ contents }),
          timeoutPromise
        ]);

        const resText = result?.response?.text();
        if (resText && resText.trim().length >= 15) {
          replyText = sanitizeSocraticResponse(resText, currentStage, effectiveCareer, targetSchool, trimmedMsg, isFollowUp);
          break;
        }
      } catch (err) {
        // Chuyển sang model tiếp theo hoặc fallback
      }
    }

    if (!replyText) {
      const fallbackRaw = generateCognitiveFallback({
        stage: currentStage,
        effectiveCareer,
        targetSchool,
        trimmedMsg,
        isFollowUp
      });
      replyText = sanitizeSocraticResponse(fallbackRaw, currentStage, effectiveCareer, targetSchool, trimmedMsg, isFollowUp);
    }

    const isComplete = currentStage === 5;

    return res.status(200).json({
      success: true,
      workflowVersion: WORKFLOW_VERSION,
      serverTimestamp,
      stage: currentStage,
      currentStage,
      chatStage: currentStage,
      round: currentStage,
      isFollowUp,
      response: replyText,
      reply: replyText,
      isComplete,
      isCompleted: isComplete,
      progress: `${Math.min(currentStage, 4)}/4`,
      shiftedMajor: isShifted ? effectiveCareer : null
    });
  } catch (error) {
    console.error('Lỗi Socrates Chat Backend:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý máy chủ!' });
  }
}
