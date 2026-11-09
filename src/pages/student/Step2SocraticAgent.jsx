import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StepProgressHeader from '../../components/common/StepProgressHeader';
import ReflectionJournalCard from '../../components/reflection/ReflectionJournalCard';
import { resetStepData } from '../../utils/interventionProgress';
import { supabase } from '../../lib/supabase';

export const WORKFLOW_VERSION = 'v2.1_natural_reflective_dialogue_2026';

export const INTERNAL_TOPICS = ['reasons', 'understanding', 'opportunities', 'preparation'];

export const TOPIC_LABELS = {
  reasons: 'Lý do lựa chọn',
  understanding: 'Hiểu biết về nghề',
  opportunities: 'Cơ hội việc làm',
  preparation: 'Sự chuẩn bị'
};

export const TOPIC_STATUS_LABELS = {
  not_started: 'Chưa trao đổi',
  has_content: 'Đã có nội dung',
  needs_verification: 'Học sinh chưa biết/cần kiểm chứng thêm',
  paused: 'Tạm dừng'
};

export const TOPIC_OPENING_QUESTIONS = {
  reasons: 'Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này?',
  understanding: 'Theo em, khó khăn đáng chú ý nhất khi làm nghề này là gì?',
  opportunities: 'Em hình dung cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào?',
  preparation: 'Hiện tại, em đã chuẩn bị được gì để đáp ứng yêu cầu đầu vào của ngành?'
};

export function createInitialTopicStates() {
  return {
    reasons: { status: 'not_started', statements: [], sources: [], subQuestionAsked: false },
    understanding: { status: 'not_started', statements: [], sources: [], subQuestionAsked: false },
    opportunities: { status: 'not_started', statements: [], sources: [], subQuestionAsked: false },
    preparation: { status: 'not_started', statements: [], sources: [], subQuestionAsked: false }
  };
}

export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
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
    return isVocational ? `${prefix}trường đào tạo nghề em đang tìm hiểu` : `${prefix}cơ sở đào tạo dự kiến`;
  }
  return `${prefix}${school}`;
}

export function formatSchoolName(school, isVocational = false) {
  if (isSchoolUndecided(school)) {
    return isVocational ? 'trường đào tạo nghề em đang tìm hiểu' : 'cơ sở đào tạo dự kiến';
  }
  return school;
}

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
    'khong hoc nghe', 'khong phai hoc nghe', 'khong hoc truong nghe', 'khong phai truong nghe'
  ];
  return patterns.some(p => uNorm.includes(p));
}

export function isVocationalTrack(career = '', userText = '', school = '') {
  const cNorm = removeVietnameseTones((career || '').trim());
  const uNorm = removeVietnameseTones((userText || '').trim());
  const sNorm = removeVietnameseTones((school || '').trim());

  if (hasUniversityClarification(userText)) return false;

  const isExplicitVocationalSchool = ['nghe', 'trung cap', 'salon', 'day nghe'].some(k => sNorm.includes(k));
  const isUniSchool = sNorm.includes('dai hoc') || sNorm.startsWith('dh') || sNorm.includes('hoc vien') || sNorm.includes('bach khoa');

  if (isUniSchool && !isExplicitVocationalSchool) return false;
  if (isExplicitVocationalSchool) return true;

  const pureVocationalKeywords = ['pha che', 'barista', 'lam banh', 'tho han', 'spa', 'nail', 'cat toc', 'hoc nghe', 'trung cap nghe', 'truong nghe'];
  return pureVocationalKeywords.some(k => cNorm.includes(k) || uNorm.includes(k));
}

export function isBroadMajorField(major = '', userText = '') {
  const mNorm = removeVietnameseTones((major || '').trim());
  const uNorm = removeVietnameseTones((userText || '').trim());
  if (!mNorm) return true;

  const specificClarifications = [
    'noi khoa', 'ngoai khoa', 'nhi khoa', 'da khoa', 'bac si', 'duoc si', 'duoc hoc', 'dieu duong', 'rang ham mat', 'xet nghiem',
    'su pham toan', 'su pham van', 'su pham ngu van', 'su pham anh', 'su pham tieng anh',
    'su pham ly', 'su pham hoa', 'su pham sinh', 'su pham su', 'su pham dia', 'su pham tin',
    'giao duc tieu hoc', 'giao duc mam non', 'su pham gdcd', 'giao duc chinh tri',
    'quan tri kinh doanh', 'kinh doanh quoc te', 'tai chinh ngan hang', 'ke toan', 'kiem toan', 'marketing', 'thuong mai dien tu', 'logistics',
    'ky thuat phan mem', 'khoa hoc may tinh', 'an toan thong tin', 'tri tue nhan tao', 'he thong thong tin', 'mang may tinh',
    'quan tri dich vu du lich va lu hanh', 'quan tri khach san', 'quan tri nha hang', 'huong dan du lich',
    'ngon ngu anh', 'quan he cong chung', 'bao chi'
  ];
  if (specificClarifications.some(s => mNorm.includes(s) || uNorm.includes(s))) {
    return false;
  }

  const broadExact = [
    'kinh te', 'khoi kinh te', 'nganh kinh te',
    'su pham', 'nganh su pham', 'giao vien', 'nghe giao',
    'ky thuat', 'khoi ky thuat', 'nganh ky thuat', 'cong nghe',
    'y duoc', 'nganh y', 'y te', 'khoi y duoc',
    'it', 'cntt', 'may tinh', 'cong nghe thong tin',
    'du lich', 'nganh du lich', 'dich vu',
    'ngon ngu', 'ngoai ngu', 'nganh ngon ngu',
    'xa hoi', 'khoa hoc xa hoi', 'nhan van', 'luat'
  ];
  return broadExact.includes(mNorm);
}

// NHẬN DIỆN HỌC SINH ĐANG HOANG MANG / LO LẮNG / KHÔNG HIỂU (MỤC 5)
export function isDistressOrOverwhelmed(text = '') {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const uNorm = removeVietnameseTones(clean);
  const patterns = [
    /\b(hoang mang|rối quá|roi qua|mông lung|mong lung|bối rối|boi roi|lo quá|lo lắng quá|sợ quá)\b/i,
    /^(dạ\s+)?(em\s+)?(đang\s+)?(rất\s+|hơi\s+)?(hoang mang|lo|lo lắng|sợ|rối|không hiểu|chưa hiểu|khó hiểu)\s*(quá|lắm|ạ|a|thầy ơi)?$/i,
    /\bem\s+(đang\s+)?(rất\s+|hơi\s+)?(hoang mang|bối rối|mông lung|lo lắng|không hiểu)\b/i
  ];
  return patterns.some(p => p.test(clean) || p.test(uNorm));
}

// NHẬN DIỆN KHI HỌC SINH MUỐN DỪNG / TẠM DỪNG PHIÊN (MỤC 5 & 6)
export function isPauseRequest(text = '') {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const uNorm = removeVietnameseTones(clean);
  const patterns = [
    /\b(muốn dừng|tạm dừng|dừng lại|dừng ở đây|nghỉ đã|để lúc khác|quay lại sau|không muốn trả lời nữa)\b/i,
    /\b(muon dung|tam dung|dung lai|dung o day|de luc khac|quay lai sau)\b/i
  ];
  return patterns.some(p => p.test(clean) || p.test(uNorm));
}

// NHẬN DIỆN KHI HỌC SINH TRẢ LỜI "CHƯA BIẾT" / "CHƯA TÌM HIỂU" (MỤC 4 & 6)
export function isDontKnowResponse(text = '') {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const uNorm = removeVietnameseTones(clean);
  const exactDontKnow = [
    'chua biet', 'khong biet', 'em chua biet', 'em khong biet', 'em ko biet', 'ko biet',
    'chua tim hieu', 'em chua tim hieu', 'chua ro', 'em chua ro', 'khong ro', 'em khong ro',
    'chua co', 'em chua co', 'chua co can cu', 'can cu gi em cung ko biet', 'can cu gi em cung khong biet',
    'chua nghi toi', 'em chua nghi toi', 'chua chuan bi', 'em chua chuan bi', 'chua chuan bi gi'
  ];
  if (exactDontKnow.includes(uNorm)) return true;
  if (clean.split(/\s+/).length <= 8 && /(chua biet|khong biet|ko biet|chua tim hieu|chua ro|chua chuan bi)/i.test(uNorm)) {
    return true;
  }
  return false;
}

// TRÍCH XUẤT NGUỒN THÔNG TIN MÀ HỌC SINH THỰC SỰ NÊU TRONG HỘI THOẠI (MỤC 7)
export function extractExplicitSources(text = '') {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  const lower = clean.toLowerCase();
  if (isDontKnowResponse(clean) || isDistressOrOverwhelmed(clean)) return [];

  const sourceMatchers = [
    { label: 'Đề án tuyển sinh / Website trường', regex: /\b(đề án|website trường|web trường|trang tuyển sinh|cổng thông tin trường|fanpage trường)\b/i },
    { label: 'Báo chí / Thống kê chính thức', regex: /\b(báo|bài báo|vtv|thời sự|bộ giáo dục|bộ y tế|thống kê)\b/i },
    { label: 'Mạng xã hội / Video chia sẻ (TikTok, YouTube, Facebook)', regex: /\b(tiktok|youtube|facebook|mạng xã hội|video|clip|review|vlog)\b/i },
    { label: 'Người thân / Anh chị đi trước', regex: /\b(anh chị|người quen|người nhà|cô chú|bác sĩ quen|cựu sinh viên|người đi làm)\b/i },
    { label: 'Thầy cô / Tư vấn tại trường', regex: /\b(thầy cô|giáo viên|buổi tư vấn|hướng nghiệp ở trường)\b/i },
    { label: 'Kênh tuyển dụng việc làm', regex: /\b(topcv|vietnamworks|itviec|linkedin|tin tuyển dụng|nhà tuyển dụng)\b/i }
  ];

  const found = [];
  for (const item of sourceMatchers) {
    if (item.regex.test(lower)) {
      found.push(item.label);
    }
  }
  return found;
}

/**
 * KHỞI TẠO CÂU HỎI MỞ ĐẦU BƯỚC 2 (MỤC 1 & 2: BỎ NHÃN CHẶNG, CHỈ HỎI 1 CÂU MỞ ĐẦU ĐƠN Ý)
 * Câu mở đầu chuẩn: "Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này?"
 */
export function generateSocraticFirstPrompt(student = {}) {
  const targetCareer = (student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || '').trim();
  const rawSchool = (student.targetSchool || student.targetUniversity || student.target_university || '').trim();
  const schoolClause = rawSchool && !isSchoolUndecided(rawSchool) ? ` tại ${rawSchool}` : '';
  const source = (student.source || student.reason || student.anchorQuote || '').trim();

  let introSentence = '';
  if (isUndecidedOrVague(targetCareer)) {
    introSentence = `Chào em. Ở bước 1, em cho biết mình vẫn đang phân vân về ngành học${source ? ` (${source})` : ''}.`;
  } else {
    introSentence = `Chào em. Ở bước 1, em đã chọn ${targetCareer}${schoolClause}${source ? ` với lý do "${source}"` : ''}.`;
  }

  const firstQuestion = `${introSentence} ${TOPIC_OPENING_QUESTIONS.reasons}`;

  return {
    workflowVersion: WORKFLOW_VERSION,
    biasType: 'Đối thoại phản tư hướng nghiệp',
    biasRule: 'Đối thoại tự nhiên theo câu trả lời thực tế của học sinh.',
    botGreeting: introSentence,
    firstQuestion
  };
}

export function initSocratesChat(profile = {}) {
  return generateSocraticFirstPrompt(profile).firstQuestion;
}

/**
 * HÀM TƯƠNG THÍCH NGƯỢC CHO CÁC MODULE CŨ (ĐÁNH DẤU RÕ `legacy_compatibility_only: true`)
 */
export function evaluateOutcomeCategory(history = [], initialProfile = null, lastUserText = '', goalShift = null) {
  return {
    category: 'Natural_Reflective_Dialogue',
    triageStep4: 'Tham vấn và kiểm chứng với mentor khi cần hỗ trợ',
    rule: 'Ghi nhận theo đúng nội dung hội thoại thực tế; không dán nhãn tâm lý hay ép buộc nhận điểm yếu.',
    hasClearAdmission: null,
    legacy_compatibility_only: true,
    workflow_version: WORKFLOW_VERSION
  };
}

export function getRecommendedComboForMajor(majorName) {
  return `tổ hợp môn xét tuyển của ngành ${majorName || 'mục tiêu'} theo đề án tuyển sinh chính thức`;
}

export function isCounterArguing(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  return /em\s+không\s+đồng\s+ý|không\s+phải\s+vậy|em\s+nghĩ\s+khác/i.test(clean);
}

export function hasDeclaredSubjectsOrGrades(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  return /\b(toán|ngữ\s*văn|môn\s*văn|tiếng\s*anh|ngoại\s*ngữ|vật\s*lý|hóa\s*học|sinh\s*học|lịch\s*sử|địa\s*lý|tin\s*học|ktpl|gdcd|học\s*bạ|điểm\s*thi|tổ\s*hợp|[a-d]\d{2}|ielts)\b/i.test(clean);
}

export function extractSubjectsFeedback(text = '') {
  const clean = String(text || '').toLowerCase();
  const subjects = [
    { name: 'Giáo dục Kinh tế và Pháp luật (KTPL)', patterns: ['ktpl', 'kinh tế pháp luật'] },
    { name: 'Giáo dục Công dân (GDCD)', patterns: ['gdcd', 'công dân'] },
    { name: 'Toán học', patterns: ['toán', 'toan'] },
    { name: 'Ngữ văn', patterns: ['ngữ văn', 'ngu van', 'môn văn'] },
    { name: 'Tiếng Anh', patterns: ['tiếng anh', 'tieng anh', 'ngoại ngữ', 'môn anh'] },
    { name: 'Lịch sử', patterns: ['lịch sử', 'lich su', 'môn sử'] },
    { name: 'Địa lý', patterns: ['địa lý', 'địa lí', 'môn địa'] },
    { name: 'Vật lý', patterns: ['vật lý', 'vật lí', 'môn lý'] },
    { name: 'Hóa học', patterns: ['hóa học', 'hoa hoc', 'môn hóa'] },
    { name: 'Sinh học', patterns: ['sinh học', 'sinh hoc', 'môn sinh'] },
    { name: 'Tin học', patterns: ['tin học', 'tin hoc', 'môn tin'] }
  ];

  let strongSubject = '';
  let weakSubject = '';

  for (const sub of subjects) {
    for (const p of sub.patterns) {
      const strongReg = new RegExp('(học tốt|giỏi|khá|thế mạnh|sở trường|mạnh|ổn|tự tin)\\s*(môn\\s*)?' + p, 'i');
      const weakReg = new RegExp('(hơi đuối|đuối|yếu|kém|chưa tốt|còn thiếu|cần cải thiện)\\s*(môn\\s*)?' + p, 'i');
      if (!strongSubject && strongReg.test(clean)) strongSubject = sub.name;
      if (!weakSubject && weakReg.test(clean)) weakSubject = sub.name;
    }
  }
  return { strongSubject, weakSubject };
}

export function detectGoalShift(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.toLowerCase().trim();

  const knownMajors = [
    { patterns: ['nội khoa', 'bác sĩ nội khoa'], name: 'Bác sĩ Nội khoa (Y khoa)', field: 'med' },
    { patterns: ['ngoại khoa', 'bác sĩ ngoại khoa'], name: 'Bác sĩ Ngoại khoa (Y khoa)', field: 'med' },
    { patterns: ['nhi khoa', 'bác sĩ nhi'], name: 'Bác sĩ Nhi khoa (Y khoa)', field: 'med' },
    { patterns: ['y đa khoa', 'y khoa', 'bác sĩ đa khoa'], name: 'Y khoa (Bác sĩ Đa khoa)', field: 'med' },
    { patterns: ['dược học', 'ngành dược', 'dược sĩ'], name: 'Dược học', field: 'med' },
    { patterns: ['điều dưỡng'], name: 'Điều dưỡng', field: 'med' },
    { patterns: ['răng hàm mặt', 'nha khoa'], name: 'Răng - Hàm - Mặt', field: 'med' },
    { patterns: ['sư phạm toán', 'sp toán'], name: 'Sư phạm Toán', field: 'sci' },
    { patterns: ['sư phạm ngữ văn', 'sư phạm văn', 'sp văn'], name: 'Sư phạm Ngữ văn', field: 'soc' },
    { patterns: ['sư phạm tiếng anh', 'sp anh', 'ngôn ngữ anh'], name: 'Sư phạm Tiếng Anh / Ngôn ngữ Anh', field: 'lang' },
    { patterns: ['giáo dục tiểu học', 'sư phạm tiểu học'], name: 'Giáo dục Tiểu học', field: 'edu' },
    { patterns: ['giáo dục mầm non', 'sư phạm mầm non'], name: 'Giáo dục Mầm non', field: 'edu' },
    { patterns: ['kỹ thuật phần mềm', 'khoa học máy tính', 'an toàn thông tin', 'trí tuệ nhân tạo'], name: 'Kỹ thuật Phần mềm / Khoa học Máy tính', field: 'tech' },
    { patterns: ['quản trị kinh doanh', 'marketing', 'kinh doanh quốc tế', 'thương mại điện tử', 'logistics'], name: 'Quản trị Kinh doanh / Marketing', field: 'biz' },
    { patterns: ['tài chính ngân hàng', 'kế toán', 'kiểm toán'], name: 'Tài chính - Ngân hàng / Kế toán', field: 'biz' },
    { patterns: ['quản trị dịch vụ du lịch và lữ hành', 'quản trị khách sạn', 'quản trị lữ hành', 'hướng dẫn du lịch'], name: 'Quản trị Dịch vụ Du lịch và Lữ hành', field: 'tourism' }
  ];

  for (const item of knownMajors) {
    if (item.patterns.some(p => clean.includes(p))) {
      return { newMajor: item.name, field: item.field };
    }
  }
  return null;
}

export function isAskingAboutSubjectsOrCombos(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  return /xét môn gì|thi môn gì|tổ hợp gì|xét tổ hợp nào|khối nào|chưa rõ tổ hợp/i.test(clean);
}

/**
 * LÀM SẠCH PHẢN HỒI CỦA AI THEO MỤC 1, 2, 3:
 * - Bỏ hoàn toàn chữ "Chặng 1/2/3/4", "Bước sang chặng...", "Đã hoàn thành cả 4 chặng".
 * - Bỏ cụm lặp máy móc "Thầy ghi nhận..." ở đầu câu.
 * - Đảm bảo mỗi lượt chỉ hỏi tối đa 01 câu hỏi đơn ý (tối đa 1 dấu ?).
 */
export function sanitizeSocraticResponse(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  cleaned = cleaned
    .replace(/^(Chuyên gia Phản tư|Trợ lý AI|AI Socrates|Socrates|Thầy Socrates)[:\s-]*/i, '')
    .replace(/^<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/\[?\s*Chặng\s*[1-5]\s*[:\-–—]?\s*[^\]]*\]?/gi, '')
    .replace(/(?:Bước\s+sang|Ở|Tại|Chuyển\s+sang)\s+chặng\s*[1-5][,:;\s]*/gi, '')
    .replace(/qua\s+cả\s+4\s+chặng[^.!?\n]*/gi, 'qua cuộc trò chuyện vừa rồi')
    .replace(/đã\s+hoàn\s+thành\s+(?:cả\s+)?4\s+chặng[^.!?\n]*/gi, 'đã trao đổi qua các chủ đề chính')
    .replace(/^Thầy\s+(?:đã\s+)?ghi\s+nhận\s+(?:rằng\s+|là\s+)?/i, '')
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Loại bỏ các câu gây áp lực bị cấm
  const bannedPatterns = [
    /[^.!?\n]*gánh\s*(?:vác\s*)?(?:ước mơ|kỳ vọng|mong muốn)\s*của\s*người\s*khác[^.!?\n]*[.!?]?/gi,
    /[^.!?\n]*phải\s*thừa\s*nhận\s*điểm\s*yếu[^.!?\n]*[.!?]?/gi,
    /[^.!?\n]*suy\s*nghĩ\s*của\s*em\s*quá\s*đơn\s*giản[^.!?\n]*[.!?]?/gi,
    /[^.!?\n]*em\s*không\s*phù\s*hợp\s*với\s*ngành\s*này[^.!?\n]*[.!?]?/gi,
    /[^.!?\n]*phó\s*mặc\s*tương\s*lai[^.!?\n]*[.!?]?/gi
  ];
  bannedPatterns.forEach(rx => {
    cleaned = cleaned.replace(rx, '').trim();
  });

  // Đảm bảo chỉ có tối đa 1 câu hỏi trong 1 lượt phản hồi
  const sentences = cleaned.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const questionSentences = sentences.filter(s => s.endsWith('?'));
  if (questionSentences.length > 1) {
    const nonQuestions = sentences.filter(s => !s.endsWith('?')).slice(0, 1);
    const firstQuestion = questionSentences[0];
    cleaned = [...nonQuestions, firstQuestion].join(' ').trim();
  }

  // Tách các câu hỏi ghép nhiều vế ", và ...?"
  cleaned = cleaned.replace(
    /([^.!?]+?)\s*(?:,\s*và|\s+và)\s+(?:người mới ra trường|em biết điều đó từ đâu|dựa trên thông tin nào|điều nào quan trọng nhất|trong lĩnh vực)[^?]*\?/gi,
    '$1?'
  );

  return cleaned.trim();
}

/**
 * TÌM CHỦ ĐỀ TIẾP THEO CHƯA TRAO ĐỔI TRONG 4 CHỦ ĐỀ NỘI BỘ
 */
export function findNextUnaddressedTopic(topicStates = {}, currentTopic = 'reasons') {
  const order = INTERNAL_TOPICS;
  const startIdx = Math.max(order.indexOf(currentTopic), 0);
  for (let i = startIdx + 1; i < order.length; i++) {
    const key = order[i];
    const st = topicStates[key]?.status || 'not_started';
    if (st === 'not_started' || st === 'paused') {
      return key;
    }
  }
  for (let i = 0; i < order.length; i++) {
    const key = order[i];
    const st = topicStates[key]?.status || 'not_started';
    if (st === 'not_started') {
      return key;
    }
  }
  return 'completed';
}

/**
 * ĐIỀU PHỐI LƯỢT ĐỐI THOẠI TỰ NHIÊN DỰA TRÊN CÂU TRẢ LỜI GẦN NHẤT CỦA HỌC SINH (MỤC 2, 3, 4, 5, 6)
 * - Không tự tăng tiến trình máy móc sau mỗi tin nhắn.
 * - Không ghép "Em hoang mang" vào dữ liệu chủ đề.
 * - Nối câu tự nhiên theo đúng nội dung học sinh vừa nói.
 */
export function analyzeTurnAndPlanNextStep({
  userText = '',
  activeTopic = 'reasons',
  topicStates = createInitialTopicStates(),
  studentProfile = {},
  wasSupportingDistress = false
}) {
  const clean = (userText || '').trim();
  const lower = clean.toLowerCase();
  const uNorm = removeVietnameseTones(clean);
  const targetCareer = studentProfile?.shiftedMajor || studentProfile?.targetMajor || studentProfile?.target_career || 'ngành này';

  // Bản sao sâu của topicStates để cập nhật bất biến
  const nextTopicStates = JSON.parse(JSON.stringify(topicStates || createInitialTopicStates()));
  if (!nextTopicStates[activeTopic]) {
    nextTopicStates[activeTopic] = { status: 'not_started', statements: [], sources: [], subQuestionAsked: false };
  }

  // 1. Học sinh muốn tạm dừng phiên (Mục 5 & 6)
  if (isPauseRequest(clean)) {
    if (nextTopicStates[activeTopic].status === 'not_started') {
      nextTopicStates[activeTopic].status = 'paused';
    }
    return {
      actionType: 'pause',
      activeTopic,
      nextTopic: activeTopic,
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'paused_early',
      replyText: 'Mình có thể tạm dừng tại đây và lưu lại những nội dung đã trao đổi. Khi nào sẵn sàng, em có thể quay lại tiếp tục hoặc sang bước 3 để tìm hiểu thông tin nhé.'
    };
  }

  // 2. Học sinh bày tỏ sự hoang mang / lo lắng / không hiểu (Mục 5)
  // Tạm dừng chuyển chủ đề, không kết thúc ngay, không ghép "Em hoang mang" vào mục Sự chuẩn bị
  if (isDistressOrOverwhelmed(clean)) {
    if (nextTopicStates[activeTopic].status === 'not_started') {
      nextTopicStates[activeTopic].status = 'paused';
    }
    return {
      actionType: 'distress',
      activeTopic,
      nextTopic: activeTopic,
      nextTopicStates,
      isSupportingDistress: true,
      sessionOutcome: 'in_progress',
      distressNote: clean,
      replyText: 'Em chưa cần quyết định ngay lúc này. Điều gì vừa khiến em hoang mang nhất?'
    };
  }

  // 3. Nếu lượt trước AI vừa hỏi "Điều gì vừa khiến em hoang mang nhất?"
  if (wasSupportingDistress) {
    // Khôi phục chủ đề đang tạm dừng để hỏi nhẹ nhàng hoặc ghi nhận cần kiểm chứng
    const resumeTopic = activeTopic || 'understanding';
    const resumeQuestion = TOPIC_OPENING_QUESTIONS[resumeTopic] || TOPIC_OPENING_QUESTIONS.understanding;
    const reply = isDontKnowResponse(clean)
      ? `Mình có thể ghi lại điều này để tìm hiểu thêm ở bước 3. Bây giờ mình cùng xem tiếp một ý nhỏ nhé: ${resumeQuestion}`
      : `Việc băn khoăn về điều đó là hoàn toàn dễ hiểu khi đứng trước lựa chọn ngành học. Mình sẽ lưu ý điểm này để kiểm tra ở bước 3; bây giờ mình cùng trao đổi tiếp nhé: ${resumeQuestion}`;
    return {
      actionType: 'after_distress',
      activeTopic: resumeTopic,
      nextTopic: resumeTopic,
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'in_progress',
      distressNote: clean,
      replyText: reply
    };
  }

  // 4. Học sinh trả lời "chưa biết" / "không biết" / "chưa tìm hiểu" (Mục 4 & 6)
  if (isDontKnowResponse(clean)) {
    nextTopicStates[activeTopic].status = 'needs_verification';
    nextTopicStates[activeTopic].statements.push(clean);

    // Nếu ở chủ đề Hiểu biết về nghề (understanding) mà câu trước AI vừa hỏi về "lộ trình đào tạo" (câu bắc cầu từ chuyên ngành),
    // và học sinh nói "Chưa biết", ta có thể hỏi tiếp 1 câu trọng tâm về khó khăn của nghề trước khi sang Cơ hội việc làm
    if (activeTopic === 'understanding' && !nextTopicStates.understanding.subQuestionAsked && nextTopicStates.understanding.statements.length === 1) {
      nextTopicStates.understanding.subQuestionAsked = true;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_concrete_difficulty',
        activeTopic: 'understanding',
        nextTopic: 'understanding',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: `Mình có thể ghi lại lộ trình đào tạo để tìm hiểu thêm ở bước 3. ${TOPIC_OPENING_QUESTIONS.understanding}`
      };
    }

    const nextTopic = findNextUnaddressedTopic(nextTopicStates, activeTopic);
    if (nextTopic === 'completed') {
      return {
        actionType: 'closing',
        activeTopic: 'preparation',
        nextTopic: 'completed',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'completed_all_topics',
        replyText: 'Mình có thể ghi lại điều này để tìm hiểu thêm ở bước 3. Em hãy xem lại bảng tóm tắt các nội dung đã trao đổi bên dưới trước khi lưu và chuyển sang bước 3 nhé.'
      };
    }

    const nextQ = TOPIC_OPENING_QUESTIONS[nextTopic];
    return {
      actionType: 'dont_know_next_topic',
      activeTopic,
      nextTopic,
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'in_progress',
      replyText: `Mình có thể ghi lại điều này để tìm hiểu thêm ở bước 3. ${nextQ}`
    };
  }

  // 5. Học sinh có câu trả lời thực chất cho chủ đề hiện tại -> Lưu phát biểu và nguồn (nếu thực sự nêu)
  nextTopicStates[activeTopic].statements.push(clean);
  const explicitSources = extractExplicitSources(clean);
  if (explicitSources.length > 0) {
    const existing = new Set(nextTopicStates[activeTopic].sources || []);
    explicitSources.forEach(s => existing.add(s));
    nextTopicStates[activeTopic].sources = Array.from(existing);
  }

  const alreadyAskedSub = Boolean(nextTopicStates[activeTopic].subQuestionAsked);

  // --- XỬ LÝ CHỦ ĐỀ 1: LÝ DO LỰA CHỌN (reasons) ---
  if (activeTopic === 'reasons') {
    // Ví dụ mẫu 1: Học sinh: "Em muốn chữa bệnh cho mẹ." -> AI: "Em muốn có khả năng chăm sóc và chữa bệnh cho mẹ. Em đang hình dung mình làm công việc gì trong ngành này?"
    if (!alreadyAskedSub && (/chữa bệnh cho mẹ|chăm sóc mẹ|chữa bệnh cho bố|chữa bệnh cho gia đình|chữa bệnh cho người thân/i.test(lower))) {
      nextTopicStates.reasons.subQuestionAsked = true;
      const targetPerson = lower.includes('mẹ') ? 'mẹ' : lower.includes('bố') ? 'bố' : 'người thân';
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_imagined_work_in_field',
        activeTopic: 'reasons',
        nextTopic: 'reasons',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: `Em muốn có khả năng chăm sóc và chữa bệnh cho ${targetPerson}. Em đang hình dung mình làm công việc gì trong ngành này?`
      };
    }

    // Nếu tên ngành còn chung chung (VD: "Y dược", "Kinh tế", "Sư phạm", "CNTT") và học sinh chưa nêu công việc/ngành cụ thể -> hỏi 1 câu làm rõ công việc hình dung
    if (!alreadyAskedSub && isBroadMajorField(targetCareer, clean)) {
      nextTopicStates.reasons.subQuestionAsked = true;
      const prefix = /ba mẹ|bố mẹ|mẹ|gia đình/i.test(lower)
        ? 'Gia đình là một động lực quan trọng trong lựa chọn của em.'
        : `Em đang quan tâm đến lĩnh vực ${targetCareer}.`;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_imagined_work_in_field',
        activeTopic: 'reasons',
        nextTopic: 'reasons',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: `${prefix} Em đang hình dung mình làm công việc gì trong ngành này?`
      };
    }

    // Đã đủ thông tin chủ đề Lý do lựa chọn -> chuyển sang Hiểu biết về nghề (understanding)
    nextTopicStates.reasons.status = 'has_content';

    // Ví dụ mẫu 2: Học sinh: "Em định học nội khoa." -> AI: "Em đang hướng tới công việc bác sĩ nội khoa. Em đã tìm hiểu lộ trình đào tạo để làm công việc này chưa?"
    if (/nội khoa/i.test(lower)) {
      nextTopicStates.understanding.subQuestionAsked = false;
      return {
        actionType: 'ask_next_topic',
        activeTopic: 'reasons',
        nextTopic: 'understanding',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: 'Em đang hướng tới công việc bác sĩ nội khoa. Em đã tìm hiểu lộ trình đào tạo để làm công việc này chưa?'
      };
    }

    if (/ngoại khoa|nhi khoa|đa khoa|răng hàm mặt|dược|điều dưỡng|xét nghiệm/i.test(lower)) {
      const roleClean = clean.replace(/^(dạ\s+|em\s+)?(định\s+|muốn\s+|hướng tới\s+)?(học\s+|làm\s+)?/i, '').replace(/[.!?]+$/, '').trim();
      return {
        actionType: 'ask_next_topic',
        activeTopic: 'reasons',
        nextTopic: 'understanding',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: `Em đang hướng tới công việc thuộc chuyên ngành ${roleClean}. Em đã tìm hiểu lộ trình đào tạo để làm công việc này chưa?`
      };
    }

    const reasonParaphrase = /^(không có|không ạ|dạ không|chỉ vậy thôi)/i.test(lower)
      ? 'Em giữ nguyên lý do lựa chọn ban đầu ở bước 1.'
      : /ba mẹ|bố mẹ|mẹ|gia đình/i.test(lower)
      ? 'Định hướng của gia đình là yếu tố quan trọng trong lựa chọn của em.'
      : `Đó là điều khiến em quan tâm đến ngành ${targetCareer}.`;

    return {
      actionType: 'ask_next_topic',
      activeTopic: 'reasons',
      nextTopic: 'understanding',
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'in_progress',
      replyText: `${reasonParaphrase} ${TOPIC_OPENING_QUESTIONS.understanding}`
    };
  }

  // --- XỬ LÝ CHỦ ĐỀ 2: HIỂU BIẾT VỀ NGHỀ (understanding) ---
  if (activeTopic === 'understanding') {
    const isBareYes = /^(dạ\s+)?(em\s+)?(đã\s+)?(tìm hiểu|biết|xem|đọc)\s*(rồi|sơ qua)?\s*(ạ|a)?$/i.test(lower) || /^(dạ\s+)?(rồi|rồi ạ|có|có ạ)$/i.test(lower);

    if (!alreadyAskedSub && isBareYes) {
      nextTopicStates.understanding.subQuestionAsked = true;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_concrete_difficulty',
        activeTopic: 'understanding',
        nextTopic: 'understanding',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: `Theo em, khó khăn đáng chú ý nhất khi làm nghề này là gì?`
      };
    }

    // Ví dụ mẫu 3: Học sinh: "Khó khăn lớn nhất là phải làm xuyên đêm." -> AI: "Em đã nghĩ đến việc trực đêm. Em biết điều này từ đâu?"
    if (/xuyên đêm|trực đêm|thức đêm|ca đêm/i.test(lower) && explicitSources.length === 0) {
      nextTopicStates.understanding.subQuestionAsked = true;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_source_of_difficulty',
        activeTopic: 'understanding',
        nextTopic: 'understanding',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: 'Em đã nghĩ đến việc trực đêm. Em biết điều này từ đâu?'
      };
    }

    if (!alreadyAskedSub && explicitSources.length === 0) {
      nextTopicStates.understanding.subQuestionAsked = true;
      let paraphrase = 'Em đã bước đầu hình dung về đặc thù và áp lực của nghề.';
      if (/xuyên đêm|trực đêm|thức đêm|ca đêm/i.test(lower)) {
        paraphrase = 'Em đã nghĩ đến việc trực đêm.';
      } else if (/học nặng|nhiều năm|6 năm|lâu năm|áp lực/i.test(lower)) {
        paraphrase = 'Em đã nghĩ đến thời gian học tập và áp lực của nghề.';
      } else if (/đi nhiều|xa nhà|lễ tết|sự cố/i.test(lower)) {
        paraphrase = 'Em đã nghĩ đến cường độ di chuyển và làm việc của nghề.';
      }
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_source_of_difficulty',
        activeTopic: 'understanding',
        nextTopic: 'understanding',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: `${paraphrase} Em biết điều này từ đâu?`
      };
    }

    // Đã có nội dung hiểu biết về nghề -> chuyển sang Cơ hội việc làm (opportunities)
    nextTopicStates.understanding.status = 'has_content';
    const sourceAck = explicitSources.length > 0
      ? `Em biết thông tin đó qua ${explicitSources[0].toLowerCase()}.`
      : 'Đó là góc nhìn hiện tại của em về thực tế công việc.';

    return {
      actionType: 'ask_next_topic',
      activeTopic: 'understanding',
      nextTopic: 'opportunities',
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'in_progress',
      replyText: `${sourceAck} ${TOPIC_OPENING_QUESTIONS.opportunities}`
    };
  }

  // --- XỬ LÝ CHỦ ĐỀ 3: CƠ HỘI VIỆC LÀM (opportunities) ---
  if (activeTopic === 'opportunities') {
    // Ví dụ mẫu 4: Học sinh: "Em nghĩ mình giỏi thì sẽ có nhiều cơ hội." -> AI: "Theo em, ‘giỏi’ trong nghề này cần thể hiện ở năng lực nào?"
    if (!alreadyAskedSub && /giỏi thì|nếu giỏi|học giỏi|tay nghề giỏi|năng lực tốt thì/i.test(lower)) {
      nextTopicStates.opportunities.subQuestionAsked = true;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_what_gioi_means',
        activeTopic: 'opportunities',
        nextTopic: 'opportunities',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: "Theo em, 'giỏi' trong nghề này cần thể hiện ở năng lực nào?"
      };
    }

    if (!alreadyAskedSub && explicitSources.length === 0 && clean.split(/\s+/).length <= 12) {
      nextTopicStates.opportunities.subQuestionAsked = true;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'ask_source_of_opportunity',
        activeTopic: 'opportunities',
        nextTopic: 'opportunities',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: 'Nhận định đó của em về cơ hội việc làm dựa trên thông tin từ đâu?'
      };
    }

    // Đã trao đổi xong chủ đề Cơ hội việc làm -> chuyển sang Sự chuẩn bị (preparation)
    nextTopicStates.opportunities.status = 'has_content';
    return {
      actionType: 'ask_next_topic',
      activeTopic: 'opportunities',
      nextTopic: 'preparation',
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'in_progress',
      replyText: `Đó là những yếu tố em cho rằng cần có khi ra trường. ${TOPIC_OPENING_QUESTIONS.preparation}`
    };
  }

  // --- XỬ LÝ CHỦ ĐỀ 4: SỰ CHUẨN BỊ (preparation) ---
  if (activeTopic === 'preparation') {
    const mentionsOnlySoftSkills = /\b(giao tiep|ngoai hinh|hoat ngon|nang dong|thuyet trinh|lam viec nhom|ky nang mem)\b/i.test(uNorm) &&
      !hasDeclaredSubjectsOrGrades(clean);

    if (!alreadyAskedSub && mentionsOnlySoftSkills) {
      nextTopicStates.preparation.subQuestionAsked = true;
      return {
        actionType: 'follow_up_same_topic',
        followUpType: 'clarify_academic_preparation',
        activeTopic: 'preparation',
        nextTopic: 'preparation',
        nextTopicStates,
        isSupportingDistress: false,
        sessionOutcome: 'in_progress',
        replyText: 'Những kỹ năng đó rất hữu ích khi học và làm nghề. Còn về các môn văn hóa dùng để xét tuyển đầu vào, hiện em đã chuẩn bị được gì?'
      };
    }

    nextTopicStates.preparation.status = 'has_content';
    return {
      actionType: 'closing',
      activeTopic: 'preparation',
      nextTopic: 'completed',
      nextTopicStates,
      isSupportingDistress: false,
      sessionOutcome: 'completed_all_topics',
      replyText: 'Cuộc trò chuyện vừa rồi đã giúp làm rõ hơn những điều em đã tìm hiểu cũng như những thông tin cần tra cứu thêm. Em hãy kiểm tra lại bản tóm tắt bên dưới trước khi lưu và chuyển sang bước 3 nhé.'
    };
  }

  return {
    actionType: 'closing',
    activeTopic: 'preparation',
    nextTopic: 'completed',
    nextTopicStates,
    isSupportingDistress: false,
    sessionOutcome: 'completed_all_topics',
    replyText: 'Cuộc trò chuyện vừa rồi đã giúp làm rõ hơn những điều em đã tìm hiểu và những thông tin cần tra cứu thêm. Em hãy xem lại bản tóm tắt bên dưới trước khi lưu nhé.'
  };
}

// Hàm giữ tương thích cho các script kiểm thử cũ nếu gọi processStudentMessage / evaluateStageProgression
export function processStudentMessage(message, chatStage, studentProfile) {
  const clean = (message || '').trim().toLowerCase();
  if (/^(chào|xin chào|hello|hi)\s*(thầy|ạ)?$/i.test(clean)) {
    return {
      advanceRound: false,
      reply: `Chào em! ${TOPIC_OPENING_QUESTIONS.reasons}`
    };
  }
  return { advanceRound: true };
}

export function evaluateStageProgression(currentStage, userText = '', studentProfile = {}, stageFollowUpUsed = {}) {
  const mapStageToTopic = { 1: 'reasons', 2: 'understanding', 3: 'opportunities', 4: 'preparation' };
  const topic = mapStageToTopic[currentStage] || 'reasons';
  const mockStates = createInitialTopicStates();
  if (stageFollowUpUsed?.[currentStage]) {
    mockStates[topic].subQuestionAsked = true;
  }
  const res = analyzeTurnAndPlanNextStep({
    userText,
    activeTopic: topic,
    topicStates: mockStates,
    studentProfile
  });
  const shouldFollowUp = res.actionType === 'follow_up_same_topic' || res.actionType === 'distress';
  return {
    shouldFollowUp,
    nextStage: shouldFollowUp ? currentStage : Math.min(currentStage + 1, 5),
    followUpReason: res.followUpType || res.actionType
  };
}

/**
 * TÓM TẮT ĐÚNG BẰNG CHỨNG HỘI THOẠI (MỤC 7)
 * - Tách phát biểu của học sinh khỏi gợi ý của AI.
 * - Tuyệt đối không ghép "Em hoang mang" vào mục "Sự chuẩn bị".
 * - Nếu chưa trả lời về sự chuẩn bị (hoặc bất kỳ chủ đề nào), ghi đúng: "Chưa có thông tin trong phiên".
 * - Chỉ ghi nguồn học sinh thực sự nêu; nếu chưa nêu ghi "Chưa nêu nguồn cụ thể trong phiên".
 * - Không kết luận học sinh đã thay đổi nhận thức hoặc đã xác định điều cần kiểm tra nếu chưa có phát biểu tương ứng.
 * - Bỏ nhãn "Chặng" trong biên bản.
 */
export function buildReflectiveSummary(messages = [], studentProfile = {}, topicStatesInput = null, sessionOutcome = 'completed_all_topics') {
  const step1Reason = (studentProfile?.reason || studentProfile?.anchorQuote || '').trim();
  const targetMajor = (studentProfile?.shiftedMajor || studentProfile?.targetMajor || studentProfile?.target_career || 'Ngành mục tiêu').trim();
  const targetSchool = (studentProfile?.targetSchool || studentProfile?.target_university || '').trim();
  const schoolLabel = targetSchool && !isSchoolUndecided(targetSchool) ? targetSchool : 'cơ sở đào tạo dự kiến';

  // Nếu chưa truyền topicStatesInput thì tái tạo từ danh sách messages có gắn nhãn topic
  let topicStates = topicStatesInput ? JSON.parse(JSON.stringify(topicStatesInput)) : createInitialTopicStates();
  const distressMessages = [];

  if (!topicStatesInput && Array.isArray(messages)) {
    let curTopic = 'reasons';
    let wasDistress = false;
    messages.forEach(m => {
      if (m && m.role === 'user' && m.text) {
        if (isDistressOrOverwhelmed(m.text)) {
          distressMessages.push(m.text.trim());
        }
        const tKey = m.topic && INTERNAL_TOPICS.includes(m.topic) ? m.topic : curTopic;
        const stepRes = analyzeTurnAndPlanNextStep({
          userText: m.text,
          activeTopic: tKey,
          topicStates,
          studentProfile,
          wasSupportingDistress: wasDistress
        });
        topicStates = stepRes.nextTopicStates;
        curTopic = stepRes.nextTopic === 'completed' ? 'preparation' : stepRes.nextTopic;
        wasDistress = stepRes.isSupportingDistress;
      }
    });
  } else if (Array.isArray(messages)) {
    messages.forEach(m => {
      if (m && m.role === 'user' && m.text && isDistressOrOverwhelmed(m.text)) {
        distressMessages.push(m.text.trim());
      }
    });
  }

  // Lọc bỏ mọi câu bày tỏ hoang mang khỏi tất cả các chủ đề (đặc biệt là Sự chuẩn bị)
  const getCleanStatements = (topicKey) => {
    const rawList = topicStates?.[topicKey]?.statements || [];
    return rawList.filter(s => s && !isDistressOrOverwhelmed(s) && !isPauseRequest(s));
  };

  const reasonStmts = getCleanStatements('reasons');
  const understandingStmts = getCleanStatements('understanding');
  const opportunityStmts = getCleanStatements('opportunities');
  const preparationStmts = getCleanStatements('preparation');

  // 1. Lý do lựa chọn do học sinh nêu
  const reasonParts = [];
  if (step1Reason) {
    reasonParts.push(`Lý do ở Bước 1: "${step1Reason}"`);
  }
  if (reasonStmts.length > 0) {
    reasonParts.push(`Chia sẻ thêm trong phiên: "${reasonStmts.join(' | ')}"`);
  }
  const studentReasons = reasonParts.length > 0
    ? reasonParts.join('. ')
    : 'Chưa có thông tin trong phiên';

  // 2. Hiểu biết về nghề và nguồn thông tin học sinh thực sự nêu
  const allSources = new Set();
  INTERNAL_TOPICS.forEach(k => {
    (topicStates?.[k]?.sources || []).forEach(src => allSources.add(src));
  });
  const explicitSourceText = allSources.size > 0
    ? Array.from(allSources).join(', ')
    : 'Chưa nêu nguồn cụ thể trong phiên';

  const understandingContent = understandingStmts.length > 0
    ? `"${understandingStmts.join(' | ')}"`
    : 'Chưa có thông tin trong phiên';

  const mentionedInfoAndSources = `Hiểu biết về nghề: ${understandingContent}. Nguồn thông tin học sinh nêu: ${explicitSourceText}.`;

  // 3. Nhận định về cơ hội việc làm
  const jobOpportunityView = opportunityStmts.length > 0
    ? `"${opportunityStmts.join(' | ')}"`
    : 'Chưa có thông tin trong phiên';

  // 4. Sự chuẩn bị do học sinh tự báo cáo (Tuyệt đối không ghép "Em hoang mang"; nếu chưa trả lời ghi "Chưa có thông tin trong phiên")
  const selfReportedPreparation = preparationStmts.length > 0
    ? `"${preparationStmts.join(' | ')}"`
    : 'Chưa có thông tin trong phiên';

  // 5. Những nội dung còn thiếu hoặc học sinh cho biết chưa rõ
  const missingList = [];
  INTERNAL_TOPICS.forEach(k => {
    const st = topicStates?.[k]?.status || 'not_started';
    const label = TOPIC_LABELS[k];
    if (st === 'not_started' || st === 'paused') {
      missingList.push(`${label}: Chưa trao đổi đầy đủ trong phiên`);
    } else if (st === 'needs_verification') {
      missingList.push(`${label}: Học sinh cho biết chưa rõ / cần kiểm chứng thêm`);
    }
  });
  if (allSources.size === 0) {
    missingList.push('Chưa có nguồn dữ liệu độc lập được nêu để đối chiếu');
  }
  const unverifiedOrMissingItems = missingList.length > 0
    ? missingList.join('; ') + '.'
    : 'Các thông tin hiện tại là tự báo cáo của học sinh, cần đối chiếu với nguồn chính thức ở bước 3.';

  // 6. Gợi ý của AI: Tối đa 3 nội dung cần kiểm chứng ở Bước 3
  const questionsForStep3 = [
    {
      id: 'q3_1',
      question: `Phương thức xét tuyển, tổ hợp môn và điểm chuẩn ngành ${targetMajor} tại ${schoolLabel} (cùng phương thức, cùng thang điểm) là bao nhiêu?`,
      suggestedSourceType: 'Đề án tuyển sinh chính thức và công bố điểm chuẩn của trường'
    },
    {
      id: 'q3_2',
      question: `Lộ trình đào tạo và những yêu cầu, khó khăn thực tế khi học ngành ${targetMajor} là gì?`,
      suggestedSourceType: 'Chương trình đào tạo công bố trên website của trường / khoa chuyên môn'
    },
    {
      id: 'q3_3',
      question: `Người mới tốt nghiệp ngành ${targetMajor} cần đáp ứng những yêu cầu năng lực hoặc chứng chỉ gì khi tìm việc?`,
      suggestedSourceType: 'Báo cáo việc làm của trường và thông tin tuyển dụng thực tế'
    }
  ];

  const hasDistress = distressMessages.length > 0;
  const mentorRecommendation = hasDistress
    ? `Học sinh có bày tỏ sự băn khoăn/hoang mang trong phiên ("${distressMessages.join('; ')}"). Đề xuất tham vấn và kiểm chứng với mentor để được hỗ trợ giải đáp.`
    : 'Học sinh có thể tự chủ đối chiếu thông tin tại bước 3 và đăng ký tham vấn, kiểm chứng với mentor nếu cần trao đổi thêm.';

  return {
    studentReasons,
    mentionedInfoAndSources,
    explicitSourceText,
    jobOpportunityView,
    selfReportedPreparation,
    unverifiedOrMissingItems,
    distressNote: hasDistress ? distressMessages.join(' | ') : '',
    topicStatesSnapshot: topicStates,
    sessionOutcome,
    questionsForStep3,
    mentorRecommendation,
    mentorSupportRequested: hasDistress
  };
}

export default function Step2SocraticAgent() {
  const [activeTopic, setActiveTopic] = useState('reasons');
  const [topicStates, setTopicStates] = useState(createInitialTopicStates);
  const [isSupportingDistress, setIsSupportingDistress] = useState(false);
  const [sessionOutcome, setSessionOutcome] = useState('in_progress'); // 'in_progress' | 'completed_all_topics' | 'paused_early'
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChatFinished, setIsChatFinished] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [summaryDraft, setSummaryDraft] = useState(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSummaryConfirmed, setIsSummaryConfirmed] = useState(false);
  const [savedRecordMeta, setSavedRecordMeta] = useState(null);
  const [summaryStatusMsg, setSummaryStatusMsg] = useState('');

  const [isMissingStep1, setIsMissingStep1] = useState(false);
  const isSessionEnded = isCompleted || isChatFinished || sessionOutcome === 'completed_all_topics' || sessionOutcome === 'paused_early';

  const messagesEndRef = useRef(null);
  const step3CtaRef = useRef(null);
  const lastAiMsgRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputFieldRef = useRef(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    const rafId = requestAnimationFrame(() => {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      if (!isSessionEnded) {
        inputFieldRef.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages.length, isLoading, isSessionEnded]);

  // 1. KHỞI TẠO DỮ LIỆU TỪ BƯỚC 1 (KHÔNG SỬA ĐÈ HỘI THOẠI CŨ; GHI PHIÊN BẢN MỚI v2.1)
  useEffect(() => {
    let userProfile = null;
    try {
      const rawProf = localStorage.getItem('cbas_user_profile');
      if (rawProf) userProfile = JSON.parse(rawProf);
    } catch (e) {}

    let anchor = null;
    try {
      const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData') || localStorage.getItem('career_initial_anchor');
      if (rawAnchor) anchor = JSON.parse(rawAnchor);
    } catch (e) {}

    const rawMajor = (userProfile?.targetMajor || anchor?.target_career || anchor?.target_major || anchor?.targetMajor || '').trim();
    const hasStep1Data = Boolean(rawMajor || userProfile?.hollandCode || anchor?.holland_code);

    if (!hasStep1Data) {
      setIsMissingStep1(true);
      setMessages([]);
      return;
    }
    setIsMissingStep1(false);

    const hollandCode = userProfile?.hollandCode || anchor?.holland_code || anchor?.hollandCode || 'AEI';
    const targetMajor = rawMajor;
    const targetSchool = (userProfile?.targetSchool || anchor?.target_university || anchor?.targetSchool || '').trim();
    const reason = (userProfile?.reason || anchor?.source_of_influence || anchor?.reason || anchor?.choice_source || '').trim();
    const initialConfidence = userProfile?.initialConfidence ?? (anchor?.confidence_score ? Number(anchor.confidence_score) : 5);
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || '';
    const studentId = userProfile?.studentId || anchor?.student_code || localStorage.getItem('cbas_student_id') || 'HS_01';
    const studentName = userProfile?.name || anchor?.student_name || '';

    const studentObj = {
      id: studentId,
      name: studentName,
      baselineTarget: targetMajor,
      targetCareer: targetMajor,
      targetSchool,
      source: reason,
      conf_T0: initialConfidence
    };

    const promptTrigger = generateSocraticFirstPrompt(studentObj);

    const resolvedProfile = {
      studentId,
      studentName,
      hollandCode,
      targetMajor,
      targetSchool,
      reason,
      initialConfidence,
      expectedIncome,
      target_career: targetMajor,
      target_university: targetSchool,
      confidence_score: String(initialConfidence),
      holland_code: hollandCode,
      expected_income: expectedIncome
    };
    setStudentProfile(resolvedProfile);

    const currentFingerprint = `${targetMajor}|${targetSchool}|${reason}|${hollandCode}|${initialConfidence}|${WORKFLOW_VERSION}`.toLowerCase().trim();
    const savedFingerprint = localStorage.getItem('cbas_step2_v21_fingerprint');

    let loadedDraft = null;
    if (savedFingerprint === currentFingerprint) {
      try {
        const rawDraft = localStorage.getItem('cbas_step2_v21_draft');
        if (rawDraft) loadedDraft = JSON.parse(rawDraft);
      } catch (e) {}
    } else {
      try {
        localStorage.setItem('cbas_step2_v21_fingerprint', currentFingerprint);
        localStorage.removeItem('cbas_step2_v21_draft');
      } catch (e) {}
    }

    if (loadedDraft && Array.isArray(loadedDraft.messages) && loadedDraft.messages.length > 0) {
      setMessages(loadedDraft.messages);
      setActiveTopic(loadedDraft.activeTopic || 'reasons');
      setTopicStates(loadedDraft.topicStates || createInitialTopicStates());
      setIsSupportingDistress(Boolean(loadedDraft.isSupportingDistress));
      setSessionOutcome(loadedDraft.sessionOutcome || 'in_progress');
      const ended = loadedDraft.sessionOutcome === 'completed_all_topics' || loadedDraft.sessionOutcome === 'paused_early' || Boolean(loadedDraft.isCompleted);
      setIsCompleted(ended);
      setIsChatFinished(ended);
      if (loadedDraft.summaryDraft) {
        setSummaryDraft(loadedDraft.summaryDraft);
      } else if (ended) {
        setSummaryDraft(buildReflectiveSummary(loadedDraft.messages, resolvedProfile, loadedDraft.topicStates, loadedDraft.sessionOutcome));
      }
      setIsSummaryConfirmed(Boolean(loadedDraft.isSummaryConfirmed));
      if (loadedDraft.savedRecordMeta) {
        setSavedRecordMeta(loadedDraft.savedRecordMeta);
      }
    } else {
      const initMsg = [{
        role: 'model',
        topic: 'reasons',
        text: promptTrigger.firstQuestion,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workflowVersion: WORKFLOW_VERSION
      }];
      const initTopics = createInitialTopicStates();
      setMessages(initMsg);
      setActiveTopic('reasons');
      setTopicStates(initTopics);
      setIsSupportingDistress(false);
      setSessionOutcome('in_progress');
      setIsCompleted(false);
      setIsChatFinished(false);
      setSummaryDraft(null);
      setIsSummaryConfirmed(false);
      try {
        localStorage.setItem('cbas_step2_v21_draft', JSON.stringify({
          workflowVersion: WORKFLOW_VERSION,
          fingerprint: currentFingerprint,
          activeTopic: 'reasons',
          topicStates: initTopics,
          isSupportingDistress: false,
          sessionOutcome: 'in_progress',
          isCompleted: false,
          isSummaryConfirmed: false,
          messages: initMsg
        }));
      } catch (e) {}
    }
  }, []);

  const persistDraft = (nextState = {}) => {
    try {
      const payload = {
        workflowVersion: WORKFLOW_VERSION,
        activeTopic: nextState.activeTopic ?? activeTopic,
        topicStates: nextState.topicStates ?? topicStates,
        isSupportingDistress: nextState.isSupportingDistress ?? isSupportingDistress,
        sessionOutcome: nextState.sessionOutcome ?? sessionOutcome,
        isCompleted: nextState.isCompleted ?? isCompleted,
        isSummaryConfirmed: nextState.isSummaryConfirmed ?? isSummaryConfirmed,
        messages: nextState.messages ?? messages,
        summaryDraft: nextState.summaryDraft ?? summaryDraft,
        savedRecordMeta: nextState.savedRecordMeta ?? savedRecordMeta,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('cbas_step2_v21_draft', JSON.stringify(payload));
    } catch (e) {}
  };

  // Gọi API với đầy đủ ngữ cảnh hội thoại và kế hoạch nối câu
  const callAiWithPlan = async (historyMessages, userText, plan, effectiveProfile) => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch('/api/socrates-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
          chatHistory: historyMessages.map(m => ({ role: m.role, text: m.text, topic: m.topic })),
          studentProfile: effectiveProfile,
          dialoguePlan: {
            actionType: plan.actionType,
            followUpType: plan.followUpType || '',
            activeTopic: plan.activeTopic,
            nextTopic: plan.nextTopic
          }
        }),
        signal: ctrl.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const apiReply = data?.response || data?.reply;
        if (apiReply && apiReply.trim().length >= 10) {
          return sanitizeSocraticResponse(apiReply);
        }
      }
    } catch (e) {
      // Sử dụng câu nối chuẩn xác của plan.replyText khi offline hoặc timeout
    }
    return sanitizeSocraticResponse(plan.replyText);
  };

  // Xử lý khi học sinh bấm nút "⏸️ Lưu và tạm dừng" trên giao diện (Mục 5 & 6)
  const handlePauseAndSaveSession = () => {
    const nextTopicStates = JSON.parse(JSON.stringify(topicStates));
    if (nextTopicStates[activeTopic] && nextTopicStates[activeTopic].status === 'not_started') {
      nextTopicStates[activeTopic].status = 'paused';
    }
    const pauseMsg = {
      role: 'model',
      topic: activeTopic,
      text: 'Phiên trò chuyện đã được tạm dừng theo lựa chọn của em. Em có thể kiểm tra và lưu lại những nội dung đã trao đổi bên dưới, hoặc bấm "Tiếp tục trò chuyện" bất cứ lúc nào.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      workflowVersion: WORKFLOW_VERSION
    };
    const updatedHistory = [...messages, pauseMsg];
    const generatedSummary = buildReflectiveSummary(updatedHistory, studentProfile, nextTopicStates, 'paused_early');

    setMessages(updatedHistory);
    setTopicStates(nextTopicStates);
    setSessionOutcome('paused_early');
    setIsCompleted(false);
    setIsChatFinished(true);
    setSummaryDraft(generatedSummary);

    persistDraft({
      topicStates: nextTopicStates,
      sessionOutcome: 'paused_early',
      isCompleted: false,
      messages: updatedHistory,
      summaryDraft: generatedSummary
    });
  };

  // Cho phép học sinh tiếp tục trò chuyện nếu đang ở trạng thái tạm dừng
  const handleResumeSession = () => {
    setSessionOutcome('in_progress');
    setIsChatFinished(false);
    setIsCompleted(false);
    persistDraft({
      sessionOutcome: 'in_progress',
      isCompleted: false
    });
  };

  // Xác nhận và lưu biên bản (không ghi đè các biên bản cũ đã lưu)
  const handleConfirmAndSaveSummary = async (customSummary = null) => {
    const summaryToSave = customSummary || summaryDraft || buildReflectiveSummary(messages, studentProfile, topicStates, sessionOutcome);
    const serverTime = new Date().toISOString();
    const isFullComplete = sessionOutcome === 'completed_all_topics';

    const recordId = `step2_v21_${Date.now()}`;
    const v2Record = {
      record_id: recordId,
      workflow_version: WORKFLOW_VERSION,
      server_timestamp: serverTime,
      session_status: isFullComplete ? 'Đã trao đổi đủ nội dung' : 'Phiên tạm dừng / chưa hoàn tất',
      student_code: studentProfile?.studentId || localStorage.getItem('cbas_student_id') || 'HS_01',
      step1_snapshot: {
        targetMajor: studentProfile?.targetMajor || '',
        shiftedMajor: studentProfile?.shiftedMajor || studentProfile?.targetMajor || '',
        targetSchool: studentProfile?.targetSchool || '',
        initialReason: studentProfile?.reason || '',
        initialConfidence: studentProfile?.initialConfidence ?? 5,
        expectedIncome: studentProfile?.expectedIncome || '',
        hollandCode: studentProfile?.hollandCode || ''
      },
      topic_states: topicStates,
      self_report_unverified_notice: 'Thông tin do học sinh nêu trong hội thoại là dữ liệu tự báo cáo, chưa được xác minh.',
      confirmed_by_student: true,
      confirmed_summary: {
        student_statements: {
          reasons: summaryToSave.studentReasons,
          mentioned_info_and_sources: summaryToSave.mentionedInfoAndSources,
          explicit_sources: summaryToSave.explicitSourceText,
          job_opportunity_view: summaryToSave.jobOpportunityView,
          self_reported_preparation: summaryToSave.selfReportedPreparation,
          unverified_or_missing_items: summaryToSave.unverifiedOrMissingItems,
          distress_note: summaryToSave.distressNote || ''
        },
        ai_suggestions_for_step3: {
          questions_to_verify: summaryToSave.questionsForStep3,
          mentor_consultation_suggestion: summaryToSave.mentorRecommendation,
          student_requests_mentor_support: Boolean(summaryToSave.mentorSupportRequested)
        }
      },
      messages: messages.map(m => ({
        role: m.role,
        topic: m.topic || null,
        text: m.text,
        time: m.time || ''
      }))
    };

    try {
      const existingListRaw = localStorage.getItem('cbas_step2_v2_records');
      const existingList = existingListRaw ? JSON.parse(existingListRaw) : [];
      const updatedList = Array.isArray(existingList) ? [...existingList, v2Record] : [v2Record];
      localStorage.setItem('cbas_step2_v2_records', JSON.stringify(updatedList));
      localStorage.setItem('cbas_step2_v2_latest', JSON.stringify(v2Record));
      if (isFullComplete) {
        localStorage.setItem('cbas_step2_completed', 'true');
      }
    } catch (e) {
      console.warn('Lỗi lưu biên bản vào localStorage:', e);
    }

    try {
      if (supabase) {
        await supabase.from('step2_reflective_records').insert([{
          record_id: recordId,
          student_code: v2Record.student_code,
          workflow_version: WORKFLOW_VERSION,
          step1_snapshot: v2Record.step1_snapshot,
          confirmed_summary: v2Record.confirmed_summary,
          messages: v2Record.messages,
          created_at: serverTime
        }]);
      }
    } catch (e) {}

    const meta = {
      recordId,
      workflowVersion: WORKFLOW_VERSION,
      serverTimestamp: serverTime
    };
    setSavedRecordMeta(meta);
    setSummaryDraft(summaryToSave);
    setIsSummaryConfirmed(true);
    setIsEditingSummary(false);
    setSummaryStatusMsg(`Đã lưu biên bản (${v2Record.session_status} • Phiên bản: ${WORKFLOW_VERSION} • ${new Date(serverTime).toLocaleString('vi-VN')}).`);
    persistDraft({
      summaryDraft: summaryToSave,
      isSummaryConfirmed: true,
      savedRecordMeta: meta
    });
  };

  // XUẤT BIÊN BẢN (MỤC 1, 6, 7: BỎ NHÃN CHẶNG, GHI ĐÚNG TRẠNG THÁI CHỦ ĐỀ & BẰNG CHỨNG HỘI THOẠI)
  const generateExportText = () => {
    let userProfile = null;
    try {
      const rawProf = localStorage.getItem('cbas_user_profile');
      if (rawProf) userProfile = JSON.parse(rawProf);
    } catch (e) {}

    let anchor = null;
    try {
      const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData');
      if (rawAnchor) anchor = JSON.parse(rawAnchor);
    } catch (e) {}

    const studentCode = studentProfile?.studentId || userProfile?.studentId || anchor?.student_code || localStorage.getItem('cbas_student_id') || 'HS_01';
    const targetCareer = studentProfile?.shiftedMajor || userProfile?.targetMajor || anchor?.target_career || studentProfile?.targetMajor || 'Chưa xác định';
    const rawUniv = userProfile?.targetSchool || anchor?.target_university || studentProfile?.targetSchool || '';
    const isVocationalExport = isVocationalTrack(targetCareer, '', rawUniv);
    const targetUniv = formatSchoolName(rawUniv, isVocationalExport);
    const confidence = userProfile?.initialConfidence ?? anchor?.confidence_score ?? studentProfile?.initialConfidence ?? '5';
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || studentProfile?.expectedIncome || 'Chưa khai báo';
    const reason = userProfile?.reason || anchor?.source_of_influence || studentProfile?.reason || 'Chưa ghi nhận lý do';
    const serverTimeStr = savedRecordMeta?.serverTimestamp
      ? new Date(savedRecordMeta.serverTimestamp).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN');

    const activeSummary = summaryDraft || buildReflectiveSummary(messages, studentProfile || {}, topicStates, sessionOutcome);
    const sessionStatusText = sessionOutcome === 'completed_all_topics'
      ? 'Đã trao đổi đủ nội dung'
      : sessionOutcome === 'paused_early'
      ? 'Phiên tạm dừng (chưa hoàn tất)'
      : 'Đang trao đổi (chưa hoàn tất)';

    let content = `=================================================================\n`;
    content += `   BIÊN BẢN ĐỐI THOẠI PHẢN TƯ VỚI AI SOCRATES (BƯỚC 2)\n`;
    content += `   Hệ Thống Hỗ Trợ Ra Quyết Định Nghề Nghiệp Có Căn Cứ (SocraCareer)\n`;
    content += `=================================================================\n\n`;
    content += `🔖 Phiên bản quy trình: ${WORKFLOW_VERSION}\n`;
    content += `📅 Thời gian ghi nhận: ${serverTimeStr}\n`;
    content += `🆔 Mã học sinh: ${studentCode}\n`;
    content += `🎯 Ngành mục tiêu (Bước 1): ${targetCareer}\n`;
    content += `🏛️ Trường / Cơ sở đào tạo dự kiến: ${targetUniv}\n`;
    content += `📊 Mức tự tin ban đầu (Bước 1): ${confidence}/10\n`;
    content += `💵 Kỳ vọng thu nhập ban đầu (Bước 1): ${expectedIncome}\n`;
    content += `📝 Lý do chọn ban đầu (Bước 1): ${reason}\n`;
    content += `🔄 Trạng thái phiên: ${sessionStatusText}\n`;
    content += `ℹ️ Lưu ý: Thông tin do học sinh nêu trong biên bản này là dữ liệu tự báo cáo, chưa được xác minh.\n\n`;

    content += `-----------------------------------------------------------------\n`;
    content += `TRẠNG THÁI CÁC CHỦ ĐỀ TÌM HIỂU:\n`;
    content += `-----------------------------------------------------------------\n`;
    INTERNAL_TOPICS.forEach(k => {
      const st = topicStates?.[k]?.status || 'not_started';
      content += `- ${TOPIC_LABELS[k]}: ${TOPIC_STATUS_LABELS[st] || 'Chưa trao đổi'}\n`;
    });
    content += `\n`;

    content += `-----------------------------------------------------------------\n`;
    content += `TÓM TẮT PHẢN TƯ VÀ NỘI DUNG CẦN KIỂM CHỨNG:\n`;
    content += `(Trạng thái xác nhận: ${isSummaryConfirmed ? 'Học sinh đã xem và xác nhận' : 'Bản tổng hợp chờ học sinh xác nhận'})\n`;
    content += `-----------------------------------------------------------------\n`;
    content += `[A. PHÁT BIỂU CỦA HỌC SINH TRONG PHIÊN (Chưa được xác minh)]\n`;
    content += `- Lý do lựa chọn: ${activeSummary.studentReasons}\n`;
    content += `- Hiểu biết về nghề & nguồn thông tin: ${activeSummary.mentionedInfoAndSources}\n`;
    content += `- Nhận định về cơ hội việc làm: ${activeSummary.jobOpportunityView || 'Chưa có thông tin trong phiên'}\n`;
    content += `- Sự chuẩn bị hiện tại: ${activeSummary.selfReportedPreparation}\n`;
    content += `- Nội dung chưa rõ / cần kiểm chứng thêm: ${activeSummary.unverifiedOrMissingItems}\n`;
    if (activeSummary.distressNote) {
      content += `- Ghi nhận băn khoăn / cần hỗ trợ tâm lý - thông tin: "${activeSummary.distressNote}"\n`;
    }
    content += `\n`;

    content += `[B. ĐỀ XUẤT CỦA AI ĐỂ KIỂM CHỨNG Ở BƯỚC 3 & THAM VẤN MENTOR]\n`;
    (activeSummary.questionsForStep3 || []).slice(0, 3).forEach((q, idx) => {
      content += `   ${idx + 1}. Nội dung cần kiểm chứng: ${q.question}\n`;
      content += `      Loại nguồn gợi ý: ${q.suggestedSourceType}\n`;
    });
    content += `- Đề xuất tham vấn và kiểm chứng với mentor: ${activeSummary.mentorRecommendation}\n\n`;

    content += `-----------------------------------------------------------------\n`;
    content += `CHI TIẾT NỘI DUNG ĐỐI THOẠI:\n`;
    content += `-----------------------------------------------------------------\n\n`;

    messages.forEach((msg) => {
      const sender = msg.role === 'model' ? '🤖 Thầy Socrates (AI)' : '🧑‍🎓 Học sinh';
      content += `[${msg.time || ''}] ${sender}:\n${msg.text}\n\n`;
    });

    content += `=================================================================\n`;
    content += `📌 HƯỚNG DẪN TIẾP THEO DÀNH CHO HỌC SINH:\n`;
    content += `1. Ở Bước 3, hãy đối chiếu các nội dung cần kiểm chứng ở trên với nguồn dữ liệu chính thống phù hợp.\n`;
    content += `2. Sử dụng biên bản này để tham vấn và kiểm chứng với mentor ở Bước 4 khi em cần hỗ trợ thêm.\n`;
    content += `=================================================================\n`;

    return content;
  };

  const handleDownloadTxt = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const careerSlug = (studentProfile?.target_career || 'huong_nghiep')
      .trim().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    link.href = url;
    link.download = `Bien_ban_phan_tu_Buoc2_${careerSlug}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    try {
      const text = generateExportText();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('Lỗi sao chép:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetSession = () => {
    if (window.confirm('Em có muốn bắt đầu lại cuộc trò chuyện mới từ đầu không? (Các biên bản đã lưu trước đó vẫn được giữ nguyên)')) {
      try {
        localStorage.removeItem('cbas_step2_v21_draft');
      } catch (e) {}
      window.location.reload();
    }
  };

  // XỬ LÝ GỬI TIN NHẮN CỦA HỌC SINH
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isLoading || isSessionEnded) return;
    const cleanText = inputValue.trim();
    if (cleanText.length === 0) return;

    const reflex = processStudentMessage(cleanText, 1, studentProfile);
    if (reflex.advanceRound === false && reflex.reply) {
      setErrorMessage('');
      const userMsg = {
        role: 'user',
        topic: activeTopic,
        text: cleanText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const aiMsg = {
        role: 'model',
        topic: activeTopic,
        text: reflex.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const next = [...prev, userMsg, aiMsg];
        persistDraft({ messages: next });
        return next;
      });
      setInputValue('');
      return;
    }

    setErrorMessage('');
    const userMsg = {
      role: 'user',
      topic: activeTopic,
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // Nếu học sinh nêu ngành/chuyên ngành cụ thể (VD: "Em định học nội khoa"), ghi nhận vào shiftedMajor trong phiên
      const goalShift = detectGoalShift(cleanText);
      let updatedProfile = studentProfile;
      if (goalShift?.newMajor && (!studentProfile?.targetMajor || goalShift.newMajor.toLowerCase() !== studentProfile.targetMajor.toLowerCase())) {
        updatedProfile = {
          ...studentProfile,
          shiftedMajor: goalShift.newMajor
        };
        setStudentProfile(updatedProfile);
      }

      const plan = analyzeTurnAndPlanNextStep({
        userText: cleanText,
        activeTopic,
        topicStates,
        studentProfile: updatedProfile,
        wasSupportingDistress: isSupportingDistress
      });

      const replyContent = await callAiWithPlan(nextHistory, cleanText, plan, updatedProfile);

      const nextTopicKey = plan.nextTopic === 'completed' ? 'preparation' : plan.nextTopic;
      const aiMsg = {
        role: 'model',
        topic: nextTopicKey,
        text: replyContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workflowVersion: WORKFLOW_VERSION
      };

      const updatedHistory = [...nextHistory, aiMsg];
      setMessages(updatedHistory);
      setTopicStates(plan.nextTopicStates);
      setActiveTopic(nextTopicKey);
      setIsSupportingDistress(plan.isSupportingDistress);
      setSessionOutcome(plan.sessionOutcome);

      const isEndedNow = plan.sessionOutcome === 'completed_all_topics' || plan.sessionOutcome === 'paused_early';
      if (isEndedNow) {
        setIsCompleted(plan.sessionOutcome === 'completed_all_topics');
        setIsChatFinished(true);
        const generatedSummary = buildReflectiveSummary(updatedHistory, updatedProfile, plan.nextTopicStates, plan.sessionOutcome);
        setSummaryDraft(generatedSummary);
        if (plan.sessionOutcome === 'completed_all_topics') {
          try {
            localStorage.setItem('cbas_step2_completed', 'true');
          } catch (e) {}
        }
        persistDraft({
          activeTopic: nextTopicKey,
          topicStates: plan.nextTopicStates,
          isSupportingDistress: plan.isSupportingDistress,
          sessionOutcome: plan.sessionOutcome,
          isCompleted: plan.sessionOutcome === 'completed_all_topics',
          messages: updatedHistory,
          summaryDraft: generatedSummary
        });
      } else {
        persistDraft({
          activeTopic: nextTopicKey,
          topicStates: plan.nextTopicStates,
          isSupportingDistress: plan.isSupportingDistress,
          sessionOutcome: plan.sessionOutcome,
          isCompleted: false,
          messages: updatedHistory
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('⚠️ Sự cố kết nối AI: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummaryFieldChange = (field, value) => {
    setSummaryDraft(prev => {
      const base = prev || buildReflectiveSummary(messages, studentProfile, topicStates, sessionOutcome);
      return { ...base, [field]: value };
    });
    setIsSummaryConfirmed(false);
  };

  const handleQuestionStep3Change = (idx, key, value) => {
    setSummaryDraft(prev => {
      const base = prev || buildReflectiveSummary(messages, studentProfile, topicStates, sessionOutcome);
      const list = [...(base.questionsForStep3 || [])];
      if (list[idx]) {
        list[idx] = { ...list[idx], [key]: value };
      }
      return { ...base, questionsForStep3: list };
    });
    setIsSummaryConfirmed(false);
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '88vh', fontFamily: 'sans-serif' }}>
      <StepProgressHeader
        currentStep={2}
        onResetStep={handleResetSession}
        title="Bước 2: Đối thoại phản tư với AI Socrates"
        subtitle="Trao đổi tự nhiên để làm rõ lý do chọn ngành, hiểu biết về nghề, cơ hội việc làm và những điều cần kiểm chứng ở Bước 3."
      />

      {isMissingStep1 ? (
        <div style={{ flex: 1, padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ maxWidth: '540px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '36px 24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '26px' }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Em chưa hoàn thành Bước 1
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
              Để cuộc đối thoại phản tư được cá nhân hóa theo lựa chọn ban đầu của em, em cần hoàn thành <strong>Bước 1 (Trắc nghiệm Holland RIASEC & Khai báo lựa chọn ban đầu)</strong> trước.
            </p>
            <Link
              to="/student/holland"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 26px',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13.5px',
                borderRadius: '10px',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
              }}
            >
              <span>👉 Bắt đầu Bước 1 ngay</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #socratic-chat-export-area, #socratic-chat-export-area * {
                visibility: visible;
              }
              #socratic-chat-export-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                background: #ffffff !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* THANH CÔNG CỤ & NÚT LƯU / TẠM DỪNG / XUẤT FILE (BỎ HOÀN TOÀN NHÃN CHẶNG) */}
          <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                position: 'relative',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '24px', lineHeight: 1 }}>🦉</span>
                <span style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  background: '#10b981',
                  borderRadius: '50%',
                  border: '2px solid #ffffff'
                }} title="AI Socrates đang trực tuyến" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#dbeafe', color: '#1e40af', padding: '2px 9px', borderRadius: '12px' }}>
                    BƯỚC 2: ĐỐI THOẠI PHẢN TƯ
                  </span>
                  {sessionOutcome === 'completed_all_topics' && (
                    <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                      ✓ Đã trao đổi đủ nội dung
                    </span>
                  )}
                  {sessionOutcome === 'paused_early' && (
                    <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                      ⏸️ Phiên tạm dừng (chưa hoàn tất)
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '17px', margin: '3px 0 0 0', color: '#0f172a', fontWeight: '800' }}>
                  Trò chuyện phản tư cùng AI Socrates
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} className="no-print">
              {!isSessionEnded && (
                <button
                  type="button"
                  onClick={handlePauseAndSaveSession}
                  title="Tạm dừng cuộc trò chuyện và lưu lại những nội dung đã trao đổi để quay lại sau"
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '6px 11px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#b45309',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⏸️ Lưu & tạm dừng
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyText}
                style={{
                  background: copySuccess ? '#ecfdf5' : '#f8fafc',
                  border: '1px solid ' + (copySuccess ? '#a7f3d0' : '#cbd5e1'),
                  borderRadius: '6px',
                  padding: '6px 11px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: copySuccess ? '#059669' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {copySuccess ? '✅ Đã chép!' : '📋 Sao chép'}
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 11px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                📥 Xuất .TXT
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 11px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                🖨️ Lưu PDF
              </button>

              <button
                type="button"
                onClick={handleResetSession}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '6px 11px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#1d4ed8',
                  cursor: 'pointer'
                }}
              >
                🔄 Bắt đầu lại
              </button>
            </div>
          </div>

          {/* KHUNG NỘI DUNG CHAT & BẢNG TÓM TẮT */}
          <div
            id="socratic-chat-export-area"
            ref={chatContainerRef}
            style={{
              height: isSessionEnded ? 'auto' : '58vh',
              minHeight: '400px',
              maxHeight: isSessionEnded ? 'none' : '560px',
              overflowY: 'auto',
              overflowAnchor: 'none',
              padding: '20px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* THÔNG TIN LỰA CHỌN BƯỚC 1 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '11px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                  🎯 Lựa chọn Bước 1:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                  {studentProfile?.shiftedMajor || studentProfile?.targetMajor || 'Ngành mục tiêu'} {studentProfile?.targetSchool ? `(${studentProfile.targetSchool})` : ''}
                </span>
                {studentProfile?.initialConfidence != null && (
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    Tự tin ban đầu: {studentProfile.initialConfidence}/10
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                💡 Em có thể trả lời ngắn gọn, nói "chưa biết" hoặc bấm tạm dừng bất cứ lúc nào.
              </span>
            </div>

            {messages.map((m, i) => {
              const isLastAi = m.role === 'model' && !messages.slice(i + 1).some(msg => msg.role === 'model');
              const isUser = m.role === 'user';
              return (
                <div
                  key={`msg-${i}`}
                  ref={isLastAi ? lastAiMsgRef : null}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: '10px',
                    scrollMarginTop: '16px'
                  }}
                >
                  {!isUser && (
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)',
                      flexShrink: 0,
                      marginTop: '2px',
                      border: '1.5px solid #e0e7ff'
                    }} title="Thầy Socrates">
                      <span style={{ fontSize: '20px', lineHeight: 1 }}>🦉</span>
                    </div>
                  )}

                  <div style={{
                    maxWidth: '78%',
                    padding: '14px 18px',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '4px 16px 16px 16px',
                    background: isUser ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#ffffff',
                    color: isUser ? '#ffffff' : '#1e293b',
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    boxShadow: isUser ? '0 2px 6px rgba(5, 150, 105, 0.2)' : '0 2px 5px rgba(15, 23, 42, 0.05)',
                    fontSize: '14.5px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {!isUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af' }}>
                          Thầy Socrates
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '700', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                          AI Phản Tư
                        </span>
                      </div>
                    )}
                    <div>{m.text}</div>
                    <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>{m.time}</div>
                  </div>

                  {isUser && (
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: '#d1fae5',
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '16px',
                      flexShrink: 0,
                      marginTop: '2px',
                      border: '1px solid #a7f3d0'
                    }} title="Học sinh">
                      🧑‍🎓
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px' }} className="no-print">
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>🦉</span>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                  ✨ AI đang đọc câu trả lời của em...
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }} className="no-print">
                {errorMessage}
              </div>
            ) : null}

            {/* BẢNG TÓM TẮT BẰNG CHỨNG HỘI THOẠI (MỤC 6 & 7) */}
            {isSessionEnded && summaryDraft ? (
              <div
                ref={step3CtaRef}
                style={{
                  background: '#ffffff',
                  border: '2px solid #0ea5e9',
                  borderRadius: '14px',
                  padding: '20px',
                  marginTop: '8px',
                  boxShadow: '0 4px 16px rgba(14, 165, 233, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      background: sessionOutcome === 'completed_all_topics' ? '#dcfce7' : '#fef3c7',
                      color: sessionOutcome === 'completed_all_topics' ? '#166534' : '#92400e',
                      padding: '3px 9px',
                      borderRadius: '8px'
                    }}>
                      {sessionOutcome === 'completed_all_topics' ? 'Trạng thái: Đã trao đổi đủ nội dung' : 'Trạng thái: Phiên tạm dừng / chưa hoàn tất'}
                    </span>
                    <h3 style={{ margin: '6px 0 4px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                      📋 Tóm tắt phản tư và nội dung cần kiểm chứng
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                      ℹ️ Các thông tin ở Phần A được trích trực tiếp từ câu trả lời của em trong phiên (chưa được xác minh). Em có thể <strong>xem, chỉnh sửa hoặc xác nhận</strong> trước khi lưu.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
                    {sessionOutcome === 'paused_early' && (
                      <button
                        type="button"
                        onClick={handleResumeSession}
                        style={{
                          padding: '7px 13px',
                          borderRadius: '8px',
                          border: '1px solid #93c5fd',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        ▶️ Tiếp tục trò chuyện
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingSummary(prev => !prev)}
                      style={{
                        padding: '7px 13px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: isEditingSummary ? '#f1f5f9' : '#ffffff',
                        color: '#1e293b',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {isEditingSummary ? '👁️ Xem chế độ đọc' : '✏️ Chỉnh sửa tóm tắt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmAndSaveSummary(summaryDraft)}
                      style={{
                        padding: '7px 15px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isSummaryConfirmed ? '#059669' : '#2563eb',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {isSummaryConfirmed ? '✓ Đã xác nhận & lưu' : '✅ Xác nhận & Lưu biên bản'}
                    </button>
                  </div>
                </div>

                {summaryStatusMsg && (
                  <div style={{ marginBottom: '12px', padding: '9px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '12.5px', fontWeight: '600' }}>
                    {summaryStatusMsg}
                  </div>
                )}

                {/* TRẠNG THÁI 4 CHỦ ĐỀ NỘI BỘ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                  {INTERNAL_TOPICS.map(k => {
                    const st = topicStates?.[k]?.status || 'not_started';
                    return (
                      <div key={k} style={{ padding: '8px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{TOPIC_LABELS[k]}</div>
                        <div style={{ color: st === 'has_content' ? '#059669' : st === 'needs_verification' ? '#2563eb' : '#64748b', fontWeight: '600', marginTop: '2px' }}>
                          {TOPIC_STATUS_LABELS[st]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PHẦN A: PHÁT BIỂU CỦA HỌC SINH TRONG PHIÊN */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', textTransform: 'uppercase' }}>
                    🧑‍🎓 Phần A — Phát biểu của học sinh trong phiên (Chưa được xác minh)
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        • Lý do lựa chọn:
                      </label>
                      {isEditingSummary ? (
                        <textarea
                          rows={2}
                          value={summaryDraft.studentReasons || ''}
                          onChange={(e) => handleSummaryFieldChange('studentReasons', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      ) : (
                        <div style={{ fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {summaryDraft.studentReasons}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        • Hiểu biết về nghề và nguồn thông tin đã nêu:
                      </label>
                      {isEditingSummary ? (
                        <textarea
                          rows={2}
                          value={summaryDraft.mentionedInfoAndSources || ''}
                          onChange={(e) => handleSummaryFieldChange('mentionedInfoAndSources', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      ) : (
                        <div style={{ fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {summaryDraft.mentionedInfoAndSources}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        • Nhận định về cơ hội việc làm:
                      </label>
                      {isEditingSummary ? (
                        <textarea
                          rows={2}
                          value={summaryDraft.jobOpportunityView || ''}
                          onChange={(e) => handleSummaryFieldChange('jobOpportunityView', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      ) : (
                        <div style={{ fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {summaryDraft.jobOpportunityView || 'Chưa có thông tin trong phiên'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        • Sự chuẩn bị hiện tại:
                      </label>
                      {isEditingSummary ? (
                        <textarea
                          rows={2}
                          value={summaryDraft.selfReportedPreparation || ''}
                          onChange={(e) => handleSummaryFieldChange('selfReportedPreparation', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      ) : (
                        <div style={{ fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {summaryDraft.selfReportedPreparation}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        • Nội dung chưa rõ hoặc chưa có thông tin trong phiên:
                      </label>
                      {isEditingSummary ? (
                        <textarea
                          rows={2}
                          value={summaryDraft.unverifiedOrMissingItems || ''}
                          onChange={(e) => handleSummaryFieldChange('unverifiedOrMissingItems', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      ) : (
                        <div style={{ fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {summaryDraft.unverifiedOrMissingItems}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PHẦN B: ĐỀ XUẤT CỦA AI (TỐI ĐA 3 NỘI DUNG CẦN KIỂM CHỨNG) */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '10px' }}>
                    🤖 Phần B — Đề xuất của AI: Tối đa 3 nội dung cần kiểm chứng ở Bước 3
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {(summaryDraft.questionsForStep3 || []).slice(0, 3).map((item, idx) => (
                      <div key={item.id || idx} style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '10px 12px' }}>
                        {isEditingSummary ? (
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <strong style={{ fontSize: '12px', color: '#1e40af' }}>Nội dung kiểm chứng {idx + 1}:</strong>
                            <input
                              type="text"
                              value={item.question || ''}
                              onChange={(e) => handleQuestionStep3Change(idx, 'question', e.target.value)}
                              style={{ width: '100%', padding: '6px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <input
                              type="text"
                              value={item.suggestedSourceType || ''}
                              onChange={(e) => handleQuestionStep3Change(idx, 'suggestedSourceType', e.target.value)}
                              style={{ width: '100%', padding: '6px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#475569' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                              {idx + 1}. {item.question}
                            </div>
                            <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
                              🔎 <strong>Loại nguồn gợi ý:</strong> {item.suggestedSourceType}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="no-print">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isSummaryConfirmed) {
                        await handleConfirmAndSaveSummary(summaryDraft);
                      }
                      window.location.href = '/student/fact-check';
                    }}
                    style={{
                      flex: 1,
                      minWidth: '280px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 22px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14.5px',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(5, 150, 105, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>LƯU TÓM TẮT & CHUYỂN SANG BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU</span>
                    <span style={{ fontSize: '18px' }}>➔</span>
                  </button>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* THANH NHẬP LIỆU CHAT */}
          <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)' }} className="no-print">
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                ref={inputFieldRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  if (!isLoading && !isSessionEnded) setInputValue(e.target.value);
                }}
                readOnly={isLoading}
                disabled={isSessionEnded}
                placeholder={
                  isSessionEnded
                    ? 'Hãy xem lại bảng tóm tắt ở trên (hoặc bấm "Tiếp tục trò chuyện" nếu em đang tạm dừng).'
                    : isLoading
                    ? 'AI đang đọc câu trả lời của em...'
                    : 'Nhập câu trả lời của em (có thể ghi "chưa biết", "em hoang mang" hoặc bấm tạm dừng)...'
                }
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: isSessionEnded ? '#f1f5f9' : isLoading ? '#f8fafc' : '#ffffff',
                  color: isSessionEnded ? '#64748b' : '#0f172a',
                  cursor: isSessionEnded ? 'not-allowed' : 'text'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || isSessionEnded}
                style={{
                  background: isSessionEnded ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isLoading || !inputValue.trim() || isSessionEnded ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !inputValue.trim() || isSessionEnded ? 0.6 : 1
                }}
              >
                GỬI ➔
              </button>
            </form>
          </div>

          {/* NHẬT KÝ PHẢN TƯ CÁ NHÂN VÒNG 2 */}
          <div style={{ padding: '12px 16px 28px 16px' }} className="no-print">
            <ReflectionJournalCard
              round={2}
              studentCode={studentProfile?.studentId || ''}
              contextData={{
                targetMajor: studentProfile?.shiftedMajor || studentProfile?.targetMajor || '',
                workflowVersion: WORKFLOW_VERSION,
                verifiedSummaryQuestions: summaryDraft?.questionsForStep3 || []
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export { Step2SocraticAgent };
