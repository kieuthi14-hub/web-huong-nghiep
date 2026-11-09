import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StepProgressHeader from '../../components/common/StepProgressHeader';
import ReflectionJournalCard from '../../components/reflection/ReflectionJournalCard';
import { resetStepData } from '../../utils/interventionProgress';
import { supabase } from '../../lib/supabase';

export const WORKFLOW_VERSION = 'v2.0_reflective_4stages_2026';

export const STAGE_DEFINITIONS = {
  1: {
    stage: 1,
    title: 'Chặng 1: Làm rõ lý do lựa chọn',
    shortLabel: 'Chặng 1 • Lý do lựa chọn',
    mainQuestion: 'Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này? Điều nào quan trọng nhất với em?'
  },
  2: {
    stage: 2,
    title: 'Chặng 2: Xem xét hiểu biết về ngành',
    shortLabel: 'Chặng 2 • Hiểu biết về ngành',
    mainQuestion: 'Em đã tìm hiểu những yêu cầu và khó khăn thực tế nào khi học và làm nghề này? Em biết những điều đó từ đâu?'
  },
  3: {
    stage: 3,
    title: 'Chặng 3: Xem xét cơ hội việc làm',
    shortLabel: 'Chặng 3 • Cơ hội việc làm',
    mainQuestion: 'Em đánh giá cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào? Nhận định đó dựa trên thông tin nào, và người mới ra trường cần đáp ứng những yêu cầu gì?'
  },
  4: {
    stage: 4,
    title: 'Chặng 4: Đối chiếu sự chuẩn bị',
    shortLabel: 'Chặng 4 • Đối chiếu chuẩn bị',
    mainQuestion: 'So với yêu cầu tuyển sinh và học tập của ngành, em đã chuẩn bị được gì về môn học và kỹ năng? Điều gì còn thiếu hoặc chưa rõ mà em cần kiểm tra ở bước 3?'
  }
};

export const FINAL_CLOSING_SENTENCE = 'Em đã xác định được những điều cần kiểm tra thêm. Ở bước 3, hãy đối chiếu chúng với nguồn dữ liệu phù hợp để xem lựa chọn của mình đã có căn cứ đến đâu.';

// HÀM KIỂM TRA HỌC SINH MƠ HỒ / CHƯA CÓ MỤC TIÊU CỤ THỂ (ĐỂ KÍCH HOẠT NHÁNH B)
export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
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
    return isVocational ? `${prefix}trường đào tạo nghề em đang tìm hiểu` : `${prefix}cơ sở đào tạo phù hợp`;
  }
  return `${prefix}${school}`;
}

export function formatSchoolName(school, isVocational = false) {
  if (isSchoolUndecided(school)) {
    return isVocational ? 'trường đào tạo nghề em đang tìm hiểu' : 'cơ sở đào tạo phù hợp';
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

  if (hasUniversityClarification(u)) {
    return false;
  }

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

  const technicalKeywords = ['dien lanh', 'co khi', 'sua o to', 'sua xe', 'nau an', 'dau bep', 'may mac', 'may thoi trang', 'sua dien thoai'];
  if (technicalKeywords.some(k => cNorm.includes(k) || uNorm.includes(k))) {
    if (uNorm.includes('nghe') || uNorm.includes('thuc hanh') || cNorm.includes('tho') || cNorm.includes('sua')) {
      return true;
    }
  }

  return false;
}

// NHẬN DIỆN TÊN NGÀNH CÒN CHUNG CHUNG Ở CHẶNG 1 (ĐỂ LÀM RÕ NGÀNH CỤ THỂ TRƯỚC KHI HỎI YÊU CẦU TUYỂN SINH / NGHỀ NGHIỆP)
export function isBroadMajorField(major = '', userText = '') {
  const mNorm = removeVietnameseTones((major || '').trim());
  const uNorm = removeVietnameseTones((userText || '').trim());
  if (!mNorm) return true;

  // Nếu trong câu trả lời học sinh đã nêu rõ ngành cụ thể thì không còn chung chung nữa
  const specificClarifications = [
    'su pham toan', 'su pham van', 'su pham ngu van', 'su pham anh', 'su pham tieng anh',
    'su pham ly', 'su pham hoa', 'su pham sinh', 'su pham su', 'su pham dia', 'su pham tin',
    'giao duc tieu hoc', 'giao duc mam non', 'su pham gdcd', 'giao duc chinh tri',
    'quan tri kinh doanh', 'kinh doanh quoc te', 'tai chinh ngan hang', 'ke toan', 'kiem toan', 'marketing', 'thuong mai dien tu', 'logistics',
    'ky thuat phan mem', 'khoa hoc may tinh', 'an toan thong tin', 'tri tue nhan tao', 'he thong thong tin', 'mang may tinh',
    'y da khoa', 'y khoa', 'duoc hoc', 'dieu duong', 'rang ham mat', 'xet nghiem y hoc', 'ky thuat hinh anh',
    'quan tri dich vu du lich va lu hanh', 'quan tri khach san', 'quan tri nha hang', 'huong dan du lich',
    'ky thuat co khi', 'ky thuat dien', 'ky thuat o to', 'co dien tu', 'tu dong hoa',
    'ngon ngu anh', 'ngon ngu trung', 'ngon ngu nhat', 'ngon ngu han', 'quan he cong chung', 'bao chi', 'truyen thong da phuong tien'
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
    'xa hoi', 'khoa hoc xa hoi', 'nhan van',
    'nghe thuat', 'thiet ke', 'truyen thong',
    'nong lam', 'moi truong', 'luat'
  ];
  return broadExact.includes(mNorm);
}

// KIỂM TRA HỌC SINH CHỈ TRẢ LỜI "RỒI" Ở CHẶNG 2 MÀ CHƯA NÊU VÍ DỤ CỤ THỂ / NGUỒN
export function isBareAffirmationInStage2(userText = '') {
  const clean = (userText || '').trim().toLowerCase().replace(/[!.,?~]/g, '');
  const uNorm = removeVietnameseTones(clean);
  const words = clean.split(/\s+/).filter(Boolean);
  const affirmList = [
    'roi', 'da roi', 'em tim hieu roi', 'tim hieu roi', 'em biet roi', 'biet roi',
    'da tim hieu', 'em da tim hieu', 'co tim hieu', 'em co tim hieu', 'co roi', 'da xem roi', 'xem roi', 'roi a', 'da roi a'
  ];
  if (affirmList.includes(uNorm)) return true;
  if (words.length <= 5 && (uNorm.includes('roi') || uNorm === 'co' || uNorm === 'da co')) {
    return true;
  }
  return false;
}

// KIỂM TRA HỌC SINH CHƯA NÊU NGUỒN ĐỘC LẬP HOẶC CHỈ DỰA VÀO VIDEO / NGƯỜI QUEN / AI Ở CHẶNG 3
export function needsStage3SourceFollowUp(userText = '') {
  const uNorm = removeVietnameseTones((userText || '').trim());
  const words = uNorm.split(/\s+/).filter(Boolean);
  const onlyInformalSource = /(tiktok|youtube|facebook|mang xa hoi|video|clip|review|nguoi quen|anh chi|ban be|nghe noi|ai noi|chatgpt)/i.test(uNorm) &&
    !/(de an|thong ke|bao cao|cong thong tin|website truong|bo giao duc|khao sat|tuyen dung|vietnamworks|topcv|chinh thong)/i.test(uNorm);
  const missingSourceOrReq = words.length <= 8 && !/(chua biet|khong biet|chua tim hieu|chua ro|chua co)/i.test(uNorm);
  return onlyInformalSource || missingSourceOrReq;
}

// KIỂM TRA HỌC SINH NHẦM LẪN KỸ NĂNG MỀM LÀ TIÊU CHÍ TUYỂN SINH HOẶC NHẦM TỔ HỢP/PHƯƠNG THỨC Ở CHẶNG 4
export function hasStage4AdmissionConfusion(userText = '') {
  const uNorm = removeVietnameseTones((userText || '').trim());
  const mentionsSoftSkillsOnly = /\b(giao tiep|ngoai hinh|hoat ngon|nang dong|thuyet trinh|lam viec nhom|ky nang mem)\b/i.test(uNorm) &&
    !/\b(toan|ngu van|mon van|tieng anh|mon anh|ngoai ngu|vat ly|mon ly|hoa hoc|mon hoa|sinh hoc|mon sinh|lich su|mon su|dia ly|mon dia|tin hoc|mon tin|ktpl|gdcd|hoc ba|diem thi|to hop|phuong thuc|dgnl|ielts)\b/i.test(uNorm);
  const mentionsMethodConfusion = /(xet ky nang mem|tuyen sinh bang giao tiep|xet tuyen bang ngoai hinh|diem chuan 30|lech thang diem|khac thang diem)/i.test(uNorm);
  return mentionsSoftSkillsOnly || mentionsMethodConfusion;
}

/**
 * KHỞI TẠO CÂU HỎI MỞ ĐẦU BƯỚC 2 THEO CHẶNG 1 (4 CHẶNG PHẢN TƯ HỖ TRỢ XEM XÉT CĂN CỨ & TÔN TRỌNG TỰ QUYẾT)
 * Không gán nhãn thiên lệch thành kết luận tâm lý; sử dụng dữ liệu Bước 1 để cá nhân hóa.
 */
export function generateSocraticFirstPrompt(student = {}) {
  const targetCareer = (student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || '').trim();
  const rawSchool = (student.targetSchool || student.targetUniversity || student.target_university || '').trim();
  const isVocational = isVocationalTrack(targetCareer, '', rawSchool);
  const schoolClause = rawSchool && !isSchoolUndecided(rawSchool) ? `tại ${rawSchool}` : '';
  const source = (student.source || student.reason || student.anchorQuote || '').trim();
  const conf = Number(student.conf_T0 || student.initialConfidence || student.confidence_score) || 5;
  const studentName = (student.name || student.studentName || '').trim();

  const isUndecided = isUndecidedOrVague(targetCareer);
  const isBroad = !isUndecided && isBroadMajorField(targetCareer, '');

  const topicLabel = 'CHẶNG 1: LÀM RÕ LÝ DO LỰA CHỌN';
  const topicRule = 'Cá nhân hóa từ dữ liệu Bước 1; hỗ trợ học sinh làm rõ lý do lựa chọn và điều quan trọng nhất với bản thân trên tinh thần tôn trọng quyền tự quyết.';

  let firstQuestion = '';
  const greetingName = studentName ? `Chào ${studentName}` : 'Chào em';

  if (isUndecided) {
    firstQuestion = `${greetingName}. Ở Bước 1, thầy thấy em vẫn đang phân vân và chưa chọn một ngành cụ thể${source ? ` (chia sẻ ban đầu: "${source}")` : ''}. Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này? Điều nào quan trọng nhất với em?`;
  } else {
    const careerWithSchool = schoolClause ? `${targetCareer} ${schoolClause}` : targetCareer;
    const reasonText = source ? ` với lý do "${source}"` : '';
    firstQuestion = `${greetingName}. Ở Bước 1, em đã chọn ngành ${careerWithSchool}${reasonText} (mức độ tự tin hiện tại: ${conf}/10). Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này? Điều nào quan trọng nhất với em?`;
  }

  return {
    biasType: topicLabel,
    biasRule: topicRule,
    botGreeting: `${greetingName}. Ở Bước 2 này, thầy trò mình sẽ cùng đi qua 4 chặng ngắn để làm rõ lý do chọn ngành, hiểu biết thực tế, cơ hội việc làm và những nội dung cần kiểm chứng ở Bước 3.`,
    firstQuestion,
    isVocational
  };
}

export function initSocratesChat(profile = {}) {
  const promptData = generateSocraticFirstPrompt(profile);
  return promptData.firstQuestion;
}

/**
 * HÀM TƯƠNG THÍCH NGƯỢC CHO CÁC MODULE CŨ (ĐÁNH DẤU RÕ `legacy_compatibility_only: true`)
 * Không suy diễn "né tránh", "chưa hiệu chuẩn", "tự tin thái quá" hay "không thừa nhận điểm yếu".
 * Không dùng để bắt buộc phân luồng đối chất.
 */
export function evaluateOutcomeCategory(history = [], initialProfile = null, lastUserText = '', goalShift = null) {
  const userMessages = (history || []).filter(m => m && m.role === 'user').map(m => m.text || '');
  const allUserText = `${userMessages.join(' ')} ${lastUserText || ''}`.toLowerCase();

  const wantsMentorSupport = /(muốn gặp mentor|cần hỏi thêm|cần tư vấn|muốn tham vấn|chưa rõ|cần kiểm chứng|phân vân)/i.test(allUserText);

  return {
    category: 'Reflective_Inquiry_Completed',
    triageStep4: wantsMentorSupport ? 'Đề xuất tham vấn và kiểm chứng với mentor (theo nhu cầu hỗ trợ)' : 'Tự chủ đối chứng ở Bước 3 & Tham vấn mentor khi cần',
    rule: 'Ghi nhận hoàn thành 4 chặng phản tư theo quy trình mới; không dán nhãn thiên lệch nhận thức hay ép buộc nhận điểm yếu.',
    hasClearAdmission: null,
    legacy_compatibility_only: true,
    workflow_version: WORKFLOW_VERSION
  };
}

// HÀM XÁC ĐỊNH TỔ HỢP MÔN THAM CHIẾU THEO CHƯƠNG TRÌNH GDPT 2018 (KHÔNG ÁP ĐẶT CỨNG NHẮC)
export function getRecommendedComboForMajor(majorName, userText = '') {
  const m = (majorName || '').toLowerCase();
  const u = (userText || '').toLowerCase();

  if (m.includes('chính trị') || m.includes('công dân') || u.includes('ktpl') || u.includes('chính trị')) {
    return 'tổ hợp có GDKT&PL hoặc C00/D01 theo đề án của trường';
  }
  if (m.includes('tin') || m.includes('cntt') || m.includes('phần mềm') || u.includes('tin học') || u.includes('tin')) {
    return 'tổ hợp có Toán/Tin học hoặc Toán - Lý - Anh theo đề án của trường';
  }
  if (m.includes('kinh tế') || m.includes('quản trị') || m.includes('marketing') || m.includes('tài chính') || m.includes('ngân hàng') || m.includes('luật')) {
    return 'tổ hợp xét tuyển của ngành theo đề án tuyển sinh chính thức của trường';
  }
  return 'tổ hợp môn xét tuyển theo đề án tuyển sinh chính thức của trường';
}

/**
 * BỘ LỌC PHẢN XẠ TỰ NHIÊN (THÂN THIỆN, TRUNG LẬP, CHẤP NHẬN CÂU TRẢ LỜI NGẮN / "CHƯA BIẾT" / BẤT ĐỒNG)
 * Không ép buộc học sinh, không gán nhãn "gánh ước mơ của người khác".
 */
export function processStudentMessage(message, chatStage, studentProfile) {
  const lowerMsg = (message || '').toLowerCase().trim();

  // 1. Nếu học sinh hỏi lại vì chưa rõ câu hỏi (ngắn <= 10 từ)
  const isConfusion = [
    'là sao', 'sao vậy', 'sao thế', 'ý thầy là sao', 'y thay la sao',
    'em chưa hiểu câu hỏi', 'không hiểu câu hỏi', 'thầy giải thích câu hỏi'
  ].some(k => lowerMsg.includes(k));

  if (isConfusion && lowerMsg.split(/\s+/).length <= 10) {
    const stageDef = STAGE_DEFINITIONS[chatStage] || STAGE_DEFINITIONS[1];
    return {
      advanceRound: false,
      reply: `Để thầy diễn đạt lại ngắn gọn hơn cho em nhé: ${stageDef.mainQuestion} (Nếu em chưa tìm hiểu hoặc chưa có thông tin, em cứ trả lời "chưa biết" hoặc "chưa tìm hiểu" nhé).`
    };
  }

  // 2. Nếu học sinh chỉ chào xã giao thuần túy mà chưa trả lời nội dung
  const isPureGreeting = (() => {
    const gPatterns = [
      /^(chào|xin chào|chao|hello|hi|alo|hé lô)\b/i,
      /^(dạ\s+|da\s+)?(em\s+)?(chào|xin chào|chao|kính chào)\s*(thầy|thay|ạ|a)?$/i
    ];
    if (gPatterns.some(p => p.test(lowerMsg)) && lowerMsg.split(/\s+/).length <= 5) {
      return true;
    }
    return false;
  })();

  if (isPureGreeting) {
    const stageDef = STAGE_DEFINITIONS[chatStage] || STAGE_DEFINITIONS[1];
    return {
      advanceRound: false,
      reply: `Chào em! Chúng ta đang ở ${stageDef.title}. ${stageDef.mainQuestion}`
    };
  }

  return { advanceRound: true };
}

export function isCounterArguing(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const counterPatterns = [
    /thầy\s+(nói|bảo|cho rằng)\s+(thế|vậy|như vậy)\s+(không đúng|chưa đúng|sai)/i,
    /em\s+không\s+đồng\s+ý/i,
    /không\s+phải\s+vậy/i,
    /em\s+nghĩ\s+khác/i
  ];
  return counterPatterns.some(p => p.test(clean));
}

export function hasDeclaredSubjectsOrGrades(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  if (/(môn\s+)?(toán|ngữ\s*văn|môn\s*văn|tiếng\s*anh|ngoại\s*ngữ|vật\s*lý|hóa\s*học|sinh\s*học|lịch\s*sử|địa\s*lý|tin\s*học|ktpl|gdcd)/i.test(clean)) return true;
  if (/(tổ\s*hợp\s*([a-d]\d{2}|môn)|khối\s*[a-d]\d{2}|\b[a-d]\d{2}\b|học\s*bạ|điểm\s*thi|đgnl|ielts)/i.test(clean)) return true;
  return false;
}

export function extractSubjectsFeedback(text = '') {
  const clean = String(text || '').toLowerCase();
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
      const strongReg = new RegExp('(học tốt|giỏi|khá|thế mạnh|sở trường|mạnh|thích|ổn|tự tin)\\s*(môn\\s*)?' + p + '|' + p + '\\s*(thì\\s*)?(em\\s*)?(học\\s*)?(giỏi|tốt|khá|cao|ổn|được 8|được 9)', 'i');
      const weakReg = new RegExp('(hơi đuối|đuối|yếu|kém|chưa tốt|còn thiếu|cần cải thiện|lo)\\s*(môn\\s*)?' + p + '|' + p + '\\s*(thì\\s*)?(em\\s*)?(học\\s*|hơi\\s*)?(hơi đuối|đuối|yếu|kém|chưa vững|thấp|được 5|được 6)', 'i');

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

export function detectGoalShift(text) {
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
    { patterns: ['công nghệ thông tin', 'cntt', 'khoa học máy tính', 'kỹ thuật phần mềm', 'an toàn thông tin', 'trí tuệ nhân tạo'], name: 'Kỹ thuật Phần mềm / Công nghệ Thông tin', field: 'tech' },
    { patterns: ['quản trị kinh doanh', 'marketing', 'kinh doanh quốc tế', 'thương mại điện tử', 'logistics'], name: 'Quản trị Kinh doanh / Marketing', field: 'biz' },
    { patterns: ['tài chính ngân hàng', 'kế toán', 'kiểm toán'], name: 'Tài chính - Ngân hàng / Kế toán', field: 'biz' },
    { patterns: ['quản trị dịch vụ du lịch và lữ hành', 'quản trị khách sạn', 'quản trị lữ hành', 'hướng dẫn du lịch'], name: 'Quản trị Dịch vụ Du lịch và Lữ hành', field: 'tourism' },
    { patterns: ['luật kinh tế', 'luật dân sự', 'ngành luật', 'học luật', 'khoa luật'], name: 'Ngành Luật', field: 'law' },
    { patterns: ['y đa khoa', 'y khoa', 'bác sĩ đa khoa'], name: 'Y khoa (Bác sĩ Đa khoa)', field: 'med' },
    { patterns: ['dược học', 'ngành dược', 'dược sĩ'], name: 'Dược học', field: 'med' },
    { patterns: ['điều dưỡng'], name: 'Điều dưỡng', field: 'med' },
    { patterns: ['tâm lý học', 'tâm lý giáo dục', 'công tác xã hội'], name: 'Tâm lý học', field: 'soc' }
  ];

  for (const item of knownMajors) {
    if (item.patterns.some(p => clean.includes(p))) {
      return {
        newMajor: item.name,
        field: item.field
      };
    }
  }

  const matchGeneric = clean.match(/(?:dự định|tính|muốn|đổi sang|chuyển sang|thi|học|hướng tới|nhắm tới)\s+(?:ngành|chuyên ngành)\s+([a-zà-ỹ\s]{3,35}?)(?:\s+(?:mà|nhưng|tại|ở|ạ|được|có|để|[.,!?]|$))/i);
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

export function isAskingAboutSubjectsOrCombos(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const patterns = [
    'chưa biết xét môn gì', 'chưa biết thi môn gì', 'xét môn gì', 'thi môn gì', 'tổ hợp gì',
    'xét tổ hợp nào', 'tổ hợp môn nào', 'khối nào', 'xét khối gì', 'gồm những môn nào',
    'chưa rõ tổ hợp', 'chưa biết khối', 'chưa biết tổ hợp'
  ];
  return patterns.some(p => clean.includes(p));
}

/**
 * LÀM SẠCH VÀ CHUẨN HÓA PHẢN HỒI CỦA AI THEO MỤC 2, 3, 4:
 * - Loại bỏ tuyệt đối các câu gây áp lực: "Em đang gánh ước mơ của người khác", "Em phải thừa nhận điểm yếu", "Suy nghĩ của em quá đơn giản", "Em không phù hợp với ngành này".
 * - Đảm bảo giọng điệu thân thiện, trung lập, ngắn gọn, phù hợp học sinh THPT.
 * - Khi kết thúc 4 chặng (round === 5), luôn kết thúc bằng câu chuẩn của Mục 4.
 */
export function sanitizeSocraticResponse(rawText, round, effectiveCareer, targetSchool, userText = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  cleaned = cleaned
    .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates|Thầy Socrates)[:\s-]*/i, '')
    .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ).*?\]\s*/gi, '')
    .replace(/^#+.*?\n/gi, '')
    .trim();

  // LOẠI BỎ TUYỆT ĐỐI CÁC CÂU GÂY ÁP LỰC HOẶC CHỤP MŨ THEO YÊU CẦU MỤC 3:
  const bannedPressureFixes = [
    {
      pattern: /[^.!?\n]*(?:gánh\s+ước\s+mơ\s+của\s+người\s+khác|gánh\s+vác\s+mong\s+muốn\s+của\s+người\s+khác|sống\s+hộ\s+ước\s+mơ)[^.!?\n]*[.!?]?/gi,
      replace: 'Định hướng từ gia đình là một nguồn tham khảo đáng quý để em cân nhắc thêm cùng mong muốn của bản thân.'
    },
    {
      pattern: /[^.!?\n]*(?:phải\s+thừa\s+nhận\s+điểm\s+yếu|buộc\s+phải\s+thừa\s+nhận|không\s+chịu\s+thừa\s+nhận\s+điểm\s+yếu)[^.!?\n]*[.!?]?/gi,
      replace: 'Việc xác định những phần đã chuẩn bị và những phần cần kiểm tra thêm sẽ giúp em chủ động hơn.'
    },
    {
      pattern: /[^.!?\n]*(?:suy\s+nghĩ\s+của\s+em\s+quá\s+đơn\s+giản|suy\s+nghĩ\s+quá\s+đơn\s+giản|nhận\s+thức\s+quá\s+đơn\s+giản|suy\s+nghĩ\s+vu\s+vơ)[^.!?\n]*[.!?]?/gi,
      replace: 'Góc nhìn hiện tại của em là điểm khởi đầu để mình tiếp tục đối chiếu thêm thông tin thực tế.'
    },
    {
      pattern: /[^.!?\n]*(?:em\s+không\s+phù\s+hợp\s+với\s+ngành\s+này|không\s+hề\s+phù\s+hợp\s+với\s+ngành)[^.!?\n]*[.!?]?/gi,
      replace: 'Mức độ phù hợp với ngành là điều em có thể kiểm chứng thêm qua các thông tin cụ thể ở bước tiếp theo.'
    },
    {
      pattern: /[^.!?\n]*(?:một\s+dạng\s+ảo\s+tưởng|đang\s+ảo\s+tưởng|chỉ\s+là\s+công\s+cụ\s+bề\s+nổi)[^.!?\n]*[.!?]?/gi,
      replace: ''
    },
    {
      pattern: /đối\s+chất\s+với\s+mentor/gi,
      replace: 'tham vấn và kiểm chứng với mentor'
    }
  ];

  bannedPressureFixes.forEach(({ pattern, replace }) => {
    cleaned = cleaned.replace(pattern, replace).trim();
  });

  // Thay thế thuật ngữ công sở nặng nề
  cleaned = cleaned
    .replace(/kỹ\s*năng\s+thực\s*chiến/gi, 'kỹ năng thực hành nghề nghiệp')
    .replace(/thực\s*chiến/gi, 'thực tế')
    .replace(/đàm\s*phán\s*lương/gi, 'đáp ứng yêu cầu công việc')
    .replace(/báo\s*cáo\s*tài\s*chính/gi, 'công việc chuyên môn')
    .replace(/(?:năng\s*lực|giá\s*trị)\s*thương\s*mại/gi, 'năng lực nghề nghiệp')
    .trim();

  const isVocational = isVocationalTrack(effectiveCareer, userText, targetSchool);
  const cleanSchoolClause = formatSchoolClause(targetSchool, isVocational, 'tại ');
  const cleanSchoolName = formatSchoolName(targetSchool, isVocational);

  cleaned = cleaned.replace(/tại\s+\[?(?:chưa biết(?: học ở đâu)?|chưa rõ|chưa xác định|không biết|trường đại học mục tiêu|undefined|null)\]?/gi, cleanSchoolClause);
  cleaned = cleaned.replace(/của\s+\[?(?:chưa biết(?: học ở đâu)?|chưa rõ|chưa xác định|không biết|trường đại học mục tiêu|undefined|null)\]?/gi, `của ${cleanSchoolName}`);

  if (round === 5) {
    // Ở LƯỢT KẾT THÚC 4 CHẶNG: Luôn kết thúc bằng câu chuẩn của Mục 4
    cleaned = cleaned.replace(new RegExp(FINAL_CLOSING_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
    cleaned = cleaned.replace(/[^\n\r.!?]*Ở bước 3,\s*hãy đối chiếu[^\n\r.!?]*[.!?]?/gi, '').trim();
    cleaned = cleaned.replace(/[^\n\r.!?]*Em hãy bước sang Bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

    // Bỏ câu hỏi ở lượt chốt
    cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.').trim();
    if (cleaned.endsWith('?')) {
      cleaned = cleaned.slice(0, -1) + '.';
    }

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const summaryIntro = sentences.length > 0
      ? sentences.slice(0, 2).join(' ').trim()
      : `Cảm ơn em đã chia sẻ thẳng thắn qua cả 4 chặng phản tư về ngành ${effectiveCareer || 'mục tiêu'}. Thầy đã tổng hợp lại các lý do, thông tin, sự chuẩn bị và những điểm cần kiểm chứng của em ở bảng tóm tắt bên dưới.`;

    return `${summaryIntro} ${FINAL_CLOSING_SENTENCE}`.trim();
  }

  return cleaned.trim();
}

/**
 * QUYẾT ĐỊNH CHUYỂN CHẶNG HOẶC HỎI BỔ SUNG NGẮN (TỐI ĐA 1 CÂU BỔ SUNG MỖI CHẶNG)
 * Tuân thủ Mục 2 & Mục 3:
 * - Chấp nhận "chưa biết", "chưa tìm hiểu", "chưa có căn cứ", câu trả lời ngắn hoặc không đồng ý với AI.
 * - Mỗi chặng chỉ hỏi bổ sung tối đa 1 câu. Nếu vẫn còn thiếu thông tin, ghi nhận khoảng trống đó và chuyển sang chặng tiếp theo.
 */
export function evaluateStageProgression(currentStage, userText = '', studentProfile = {}, stageFollowUpUsed = {}) {
  const alreadyFollowedUp = Boolean(stageFollowUpUsed?.[currentStage]);
  const clean = (userText || '').trim();
  const uNorm = removeVietnameseTones(clean);
  const targetMajor = studentProfile?.shiftedMajor || studentProfile?.targetMajor || studentProfile?.target_career || '';

  // Nếu học sinh đã trả lời câu hỏi bổ sung ở chặng này rồi -> BẮT BUỘC ghi nhận và chuyển sang chặng tiếp theo
  if (alreadyFollowedUp) {
    return {
      shouldFollowUp: false,
      nextStage: Math.min(currentStage + 1, 5),
      followUpReason: null
    };
  }

  // Nếu học sinh trả lời "chưa biết", "chưa tìm hiểu", "chưa có căn cứ", "không có" -> Chấp nhận là câu trả lời hợp lệ, ghi nhận khoảng trống và chuyển chặng ngay
  const isValidDontKnowOrNone = /^(khong co|khong co gi them|chua biet|khong biet|chua tim hieu|em chua tim hieu|chua ro|em chua ro|chua co can cu|khong ro|da khong|khong a)$/i.test(uNorm) ||
    /(chua tim hieu|chua biet|chua co can cu|khong co ly do nao khac|chi co vay thoi)/i.test(uNorm);

  if (isValidDontKnowOrNone) {
    // Riêng ở Chặng 1 nếu tên ngành quá chung chung và học sinh chưa nêu ngành cụ thể thì hỏi 1 câu ngắn để làm rõ ngành cụ thể
    if (currentStage === 1 && isBroadMajorField(targetMajor, clean)) {
      return {
        shouldFollowUp: true,
        nextStage: 1,
        followUpReason: 'clarify_broad_major'
      };
    }
    return {
      shouldFollowUp: false,
      nextStage: Math.min(currentStage + 1, 5),
      followUpReason: null
    };
  }

  if (currentStage === 1) {
    // Nếu tên ngành còn chung chung (VD: "Kinh tế", "Sư phạm", "CNTT", "Y dược", "Du lịch") và học sinh chưa làm rõ ngành cụ thể
    if (isBroadMajorField(targetMajor, clean)) {
      return {
        shouldFollowUp: true,
        nextStage: 1,
        followUpReason: 'clarify_broad_major'
      };
    }
    return {
      shouldFollowUp: false,
      nextStage: 2,
      followUpReason: null
    };
  }

  if (currentStage === 2) {
    // Nếu học sinh chỉ trả lời "rồi" / "đã tìm hiểu rồi" mà chưa nêu ví dụ cụ thể hoặc nguồn -> hỏi 1 câu bổ sung ngắn
    if (isBareAffirmationInStage2(clean)) {
      return {
        shouldFollowUp: true,
        nextStage: 2,
        followUpReason: 'ask_stage2_example'
      };
    }
    return {
      shouldFollowUp: false,
      nextStage: 3,
      followUpReason: null
    };
  }

  if (currentStage === 3) {
    // Nếu học sinh chỉ dựa vào video, người quen hoặc AI, hoặc chưa nêu nguồn/yêu cầu với người mới ra trường -> hỏi 1 câu bổ sung ngắn
    if (needsStage3SourceFollowUp(clean)) {
      return {
        shouldFollowUp: true,
        nextStage: 3,
        followUpReason: 'ask_stage3_independent_source'
      };
    }
    return {
      shouldFollowUp: false,
      nextStage: 4,
      followUpReason: null
    };
  }

  if (currentStage === 4) {
    // Nếu học sinh nhầm kỹ năng mềm là điều kiện tuyển sinh hoặc nhầm phương thức/tổ hợp -> hỏi 1 câu bổ sung ngắn phân biệt rõ
    if (hasStage4AdmissionConfusion(clean)) {
      return {
        shouldFollowUp: true,
        nextStage: 4,
        followUpReason: 'clarify_stage4_admission_vs_skills'
      };
    }
    return {
      shouldFollowUp: false,
      nextStage: 5,
      followUpReason: null
    };
  }

  return {
    shouldFollowUp: false,
    nextStage: Math.min(currentStage + 1, 5),
    followUpReason: null
  };
}

/**
 * TỔNG HỢP TÓM TẮT PHẢN TƯ 5 PHẦN TỪ NỘI DUNG HỘI THOẠI THỰC TẾ (MỤC 4 & MỤC 5)
 * Chỉ tổng hợp từ những gì đã trao đổi, phân biệt rõ phát biểu tự báo cáo của học sinh (Mục 1-4) và gợi ý của AI (Mục 5).
 */
export function buildReflectiveSummary(messages = [], studentProfile = {}) {
  const step1Reason = (studentProfile?.reason || studentProfile?.anchorQuote || '').trim();
  const targetMajor = (studentProfile?.shiftedMajor || studentProfile?.targetMajor || studentProfile?.target_career || 'Ngành mục tiêu').trim();
  const targetSchool = (studentProfile?.targetSchool || studentProfile?.target_university || '').trim();
  const schoolLabel = targetSchool && !isSchoolUndecided(targetSchool) ? targetSchool : 'cơ sở đào tạo dự kiến';

  const userMsgs = (messages || []).filter(m => m && m.role === 'user');
  const byStage = { 1: [], 2: [], 3: [], 4: [] };

  userMsgs.forEach((m, idx) => {
    const st = m.stage && m.stage >= 1 && m.stage <= 4 ? m.stage : Math.min(idx + 1, 4);
    if (m.text && m.text.trim()) {
      byStage[st].push(m.text.trim());
    }
  });

  const stage1Text = byStage[1].join(' | ');
  const stage2Text = byStage[2].join(' | ');
  const stage3Text = byStage[3].join(' | ');
  const stage4Text = byStage[4].join(' | ');
  const allUserCombined = userMsgs.map(m => m.text).join(' ');
  const allNorm = removeVietnameseTones(allUserCombined);

  // 1. Lý do lựa chọn do học sinh nêu
  const reasonParts = [];
  if (step1Reason) {
    reasonParts.push(`Lý do khai báo ở Bước 1: "${step1Reason}"`);
  }
  if (stage1Text) {
    reasonParts.push(`Chia sẻ tại Chặng 1: "${stage1Text}"`);
  }
  const studentReasons = reasonParts.length > 0
    ? reasonParts.join('. ')
    : 'Học sinh giữ nguyên lý do lựa chọn ban đầu ở Bước 1, chưa bổ sung lý do khác.';

  // 2. Thông tin và nguồn học sinh đã đề cập
  const infoParts = [];
  if (stage2Text) {
    infoParts.push(`Hiểu biết về việc học & làm nghề (Chặng 2): "${stage2Text}"`);
  }
  if (stage3Text) {
    infoParts.push(`Nhận định về cơ hội việc làm & nguồn tham khảo (Chặng 3): "${stage3Text}"`);
  }
  const mentionedInfoAndSources = infoParts.length > 0
    ? infoParts.join('. ')
    : 'Học sinh báo cáo chưa tìm hiểu sâu thông tin chi tiết hoặc chưa nêu nguồn đối chiếu cụ thể.';

  // 3. Sự chuẩn bị do học sinh tự báo cáo
  const prepParts = [];
  if (stage4Text) {
    prepParts.push(`Chia sẻ tại Chặng 4: "${stage4Text}"`);
  }
  const { strongSubject, weakSubject } = extractSubjectsFeedback(allUserCombined);
  if (strongSubject) {
    prepParts.push(`Môn học tự báo cáo có thế mạnh: ${strongSubject}`);
  }
  if (weakSubject) {
    prepParts.push(`Môn học tự báo cáo cần củng cố thêm: ${weakSubject}`);
  }
  const selfReportedPreparation = prepParts.length > 0
    ? prepParts.join('. ')
    : 'Học sinh chưa nêu chi tiết về tổ hợp môn hoặc kỹ năng đã chuẩn bị.';

  // 4. Những nội dung còn thiếu hoặc chưa được kiểm chứng
  const missingItems = [];
  if (!stage2Text || /(chua tim hieu|chua biet|khong biet|chua ro|moi nghe noi)/i.test(removeVietnameseTones(stage2Text))) {
    missingItems.push(`Chưa đối chiếu chương trình đào tạo và yêu cầu học tập thực tế của ngành ${targetMajor} từ nguồn chính thức của ${schoolLabel}`);
  } else {
    missingItems.push(`Thông tin về yêu cầu học tập và thực tế nghề ${targetMajor} hiện là tự báo cáo, cần đối chiếu thêm với chương trình đào tạo chính thức`);
  }

  if (!stage3Text || /(tiktok|youtube|facebook|mang xa hoi|video|nguoi quen|nghe noi|chua biet|chua tim hieu|chua ro)/i.test(removeVietnameseTones(stage3Text))) {
    missingItems.push(`Nhận định về cơ hội việc làm và yêu cầu tuyển dụng cho sinh viên mới tốt nghiệp ngành ${targetMajor} cần được kiểm chứng thêm bằng nguồn dữ liệu độc lập`);
  }

  if (!stage4Text || /(chua biet|chua ro|khong biet|chua tim hieu|to hop|diem chuan)/i.test(removeVietnameseTones(stage4Text)) || hasStage4AdmissionConfusion(stage4Text)) {
    missingItems.push(`Cần kiểm tra chính xác phương thức xét tuyển, tổ hợp môn xét tuyển và điểm chuẩn cùng thang điểm của ngành ${targetMajor} tại ${schoolLabel}`);
  } else {
    missingItems.push(`Cần đối chiếu điểm học tập hiện tại với điểm chuẩn và điều kiện xét tuyển chính thức của ngành ${targetMajor} (${schoolLabel}) theo đúng phương thức và thang điểm`);
  }

  const unverifiedOrMissingItems = missingItems.join('; ') + '.';

  // 5. Danh sách từ 1 đến 3 câu hỏi cần kiểm tra ở Bước 3, mỗi câu kèm gợi ý loại nguồn phù hợp (không bịa đường dẫn hoặc số liệu)
  const questionsForStep3 = [
    {
      id: 'q3_1',
      question: `Ngành ${targetMajor} tại ${schoolLabel} xét tuyển theo những phương thức nào, dùng tổ hợp môn gì và điểm chuẩn các năm gần nhất (cùng phương thức, cùng thang điểm) là bao nhiêu?`,
      suggestedSourceType: 'Đề án tuyển sinh chính thức và công bố điểm chuẩn trên Cổng thông tin tuyển sinh của trường / Bộ GD&ĐT'
    },
    {
      id: 'q3_2',
      question: `Chương trình đào tạo ngành ${targetMajor} gồm những học phần cốt lõi nào, điều kiện tốt nghiệp và yêu cầu thực hành/thực tập thực tế ra sao?`,
      suggestedSourceType: 'Khung chương trình đào tạo và Chuẩn đầu ra công bố trên website Khoa/Trường đào tạo'
    },
    {
      id: 'q3_3',
      question: `Nhà tuyển dụng hiện yêu cầu những kỹ năng chuyên môn, ngoại ngữ hay chứng chỉ gì đối với sinh viên mới tốt nghiệp ngành ${targetMajor}?`,
      suggestedSourceType: 'Báo cáo tình hình việc làm của sinh viên tốt nghiệp (Ba công khai của trường) và bản mô tả công việc thực tế trên các cổng việc làm uy tín'
    }
  ];

  // Đề xuất tham vấn và kiểm chứng với mentor dựa trên vấn đề cần hỗ trợ (không bắt buộc vì học sinh "chưa nhận lỗi")
  const hasOpenQuestionsOrSupportNeed = /(chua biet|chua tim hieu|chua ro|phan van|lo lang|muon hoi|can tu van)/i.test(allNorm);
  const mentorRecommendation = hasOpenQuestionsOrSupportNeed
    ? 'Đề xuất tham vấn và kiểm chứng với mentor: Học sinh có một số nội dung về yêu cầu ngành học, cơ hội việc làm hoặc phương thức tuyển sinh cần được hỗ trợ tra cứu và giải đáp thêm.'
    : 'Đề xuất tham vấn và kiểm chứng với mentor: Học sinh có thể tự chủ đối chiếu dữ liệu tại Bước 3 và đăng ký tham vấn, kiểm chứng thêm với mentor nếu muốn trao đổi sâu hơn về trải nghiệm thực tế.';

  return {
    studentReasons,
    mentionedInfoAndSources,
    selfReportedPreparation,
    unverifiedOrMissingItems,
    questionsForStep3,
    mentorRecommendation,
    mentorSupportRequested: hasOpenQuestionsOrSupportNeed,
    unverifiedSelfReportNotice: 'Lưu ý: Các thông tin do học sinh nêu tại Bước 2 là dữ liệu tự báo cáo, chưa được xác minh và sẽ được đối chiếu với nguồn chính thống tại Bước 3.'
  };
}

// Prompt hệ thống cho AI theo chuẩn 4 chặng (Mục 1, 2, 3, 4)
const REFLECTIVE_4STAGES_PERSONA = `
# VAI TRÒ VÀ MỤC TIÊU BƯỚC 2
Bạn là "Thầy Socrates" - Trợ lý AI đối thoại phản tư hướng nghiệp của hệ thống SocraCareer dành cho học sinh THPT.
Mục tiêu của Bước 2 là giúp học sinh tự làm rõ:
1. Vì sao mình chọn ngành.
2. Mình đã hiểu yêu cầu học tập và thực tế nghề nghiệp đến đâu.
3. Nhận định về cơ hội việc làm dựa trên căn cứ nào.
4. Mình đã chuẩn bị được gì và cần kiểm chứng điều gì ở Bước 3.

QUAN TRỌNG: Không đặt mục tiêu buộc học sinh nhận mình sai, giảm tự tin hoặc đổi ngành. Bạn hỗ trợ học sinh xem xét căn cứ và tôn trọng quyền tự quyết của học sinh.

# NGUYÊN TẮC PHẢN HỒI CỦA AI
- Giọng điệu thân thiện, trung lập, ngắn gọn (2-3 câu), phù hợp với học sinh THPT.
- Phản hồi dựa trên nội dung học sinh vừa trả lời; không suy diễn động cơ ẩn.
- Có thể dùng các cách nói như: "Em đang cho rằng...", "Căn cứ nào giúp em nhận định như vậy?", "Điều này mình cần kiểm tra thêm".
- TUYỆT ĐỐI KHÔNG dùng các câu gây áp lực:
  * "Em đang gánh ước mơ của người khác"
  * "Em phải thừa nhận điểm yếu"
  * "Suy nghĩ của em quá đơn giản"
  * "Em không phù hợp với ngành này"
- Chấp nhận "chưa biết", "chưa tìm hiểu", "chưa có căn cứ" là câu trả lời hợp lệ; ghi nhận trung lập là nội dung cần kiểm chứng ở Bước 3, không trách móc hay giảng giải dài.
- Không tự đưa ra tỷ lệ việc làm, mức lương, dự báo thị trường, tổ hợp môn, điểm chuẩn, thời gian đào tạo hoặc yêu cầu của trường nếu chưa có nguồn kiểm chứng chính thức.
- Mỗi lượt chỉ hỏi đúng 01 câu trọng tâm.
`;

export default function Step2SocraticAgent() {
  const [chatStage, setChatStage] = useState(1);
  const [stageFollowUpUsed, setStageFollowUpUsed] = useState({ 1: false, 2: false, 3: false, 4: false });
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChatFinished, setIsChatFinished] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // State Tóm tắt phản tư & Nội dung cần kiểm chứng (học sinh xem, chỉnh sửa và xác nhận trước khi lưu)
  const [summaryDraft, setSummaryDraft] = useState(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSummaryConfirmed, setIsSummaryConfirmed] = useState(false);
  const [savedRecordMeta, setSavedRecordMeta] = useState(null);
  const [summaryStatusMsg, setSummaryStatusMsg] = useState('');

  const [sessionTelemetry, setSessionTelemetry] = useState(() => {
    try {
      const raw = localStorage.getItem('cbas_step2_telemetry');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  });
  const [activeBiasType, setActiveBiasType] = useState(() => {
    try {
      return localStorage.getItem('cbas_step2_primary_bias') || 'CHẶNG 1: LÀM RÕ LÝ DO LỰA CHỌN';
    } catch (e) {
      return 'CHẶNG 1: LÀM RÕ LÝ DO LỰA CHỌN';
    }
  });
  const [activeBiasRule, setActiveBiasRule] = useState(() => {
    try {
      return localStorage.getItem('cbas_step2_bias_rule') || '';
    } catch (e) {
      return '';
    }
  });

  const [isMissingStep1, setIsMissingStep1] = useState(false);
  const maxStages = 4;
  const isReadyForStep3 = chatStage >= 5 && (isCompleted || isChatFinished);
  const messagesEndRef = useRef(null);
  const step3CtaRef = useRef(null);
  const lastAiMsgRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputFieldRef = useRef(null);
  const isInitialMountRef = useRef(true);

  // Tự động cuộn nội bộ trong khung chat khi có tin nhắn mới
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
      if (!isReadyForStep3) {
        inputFieldRef.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages.length, isLoading, isReadyForStep3]);

  // 1. KHỞI TẠO DỮ LIỆU TỪ BƯỚC 1 (KHÔNG SỬA HOẶC GHI ĐÈ BIÊN BẢN ĐÃ LƯU TRƯỚC ĐÓ)
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
    const studentId = userProfile?.studentId || anchor?.student_code || localStorage.getItem('cbas_student_id') || 'HS_ ẩn danh';
    const studentName = userProfile?.name || anchor?.student_name || '';
    const anchorReason = userProfile?.anchorReason || anchor?.anchorReason || '';
    const anchorQuote = userProfile?.anchorQuote || anchor?.anchorQuote || reason || '';

    const studentObj = {
      id: studentId,
      name: studentName,
      baselineTarget: targetMajor,
      targetCareer: targetMajor,
      targetSchool,
      source: reason,
      anchorReason,
      anchorQuote,
      conf_T0: initialConfidence,
      riasecCode: hollandCode
    };

    const promptTrigger = generateSocraticFirstPrompt(studentObj);
    setActiveBiasType(promptTrigger.biasType);
    setActiveBiasRule(promptTrigger.biasRule);

    const resolvedProfile = {
      studentId,
      studentName,
      hollandCode,
      targetMajor,
      targetSchool,
      reason,
      anchorReason,
      anchorQuote,
      initialConfidence,
      expectedIncome,
      primaryBias: promptTrigger.biasType,
      primaryBiasRule: promptTrigger.biasRule,
      target_career: targetMajor,
      target_university: targetSchool,
      confidence_score: String(initialConfidence),
      holland_code: hollandCode,
      expected_income: expectedIncome
    };
    setStudentProfile(resolvedProfile);

    // Kiểm tra bản nháp hoặc bản đã lưu của quy trình mới (v2) mà KHÔNG sửa hay ghi đè các biên bản cũ đã lưu
    const currentFingerprint = `${targetMajor}|${targetSchool}|${reason}|${hollandCode}|${initialConfidence}|${WORKFLOW_VERSION}`.toLowerCase().trim();
    const savedV2Fingerprint = localStorage.getItem('cbas_step2_v2_fingerprint');

    let loadedV2Draft = null;
    if (savedV2Fingerprint === currentFingerprint) {
      try {
        const rawDraft = localStorage.getItem('cbas_step2_v2_draft');
        if (rawDraft) loadedV2Draft = JSON.parse(rawDraft);
      } catch (e) {}
    } else {
      try {
        localStorage.setItem('cbas_step2_v2_fingerprint', currentFingerprint);
        localStorage.removeItem('cbas_step2_v2_draft');
      } catch (e) {}
    }

    if (loadedV2Draft && Array.isArray(loadedV2Draft.messages) && loadedV2Draft.messages.length > 0) {
      setMessages(loadedV2Draft.messages);
      setChatStage(loadedV2Draft.chatStage || 1);
      setStageFollowUpUsed(loadedV2Draft.stageFollowUpUsed || { 1: false, 2: false, 3: false, 4: false });
      const done = Boolean(loadedV2Draft.isCompleted && loadedV2Draft.chatStage >= 5);
      setIsCompleted(done);
      setIsChatFinished(done);
      if (loadedV2Draft.summaryDraft) {
        setSummaryDraft(loadedV2Draft.summaryDraft);
      } else if (done) {
        setSummaryDraft(buildReflectiveSummary(loadedV2Draft.messages, resolvedProfile));
      }
      setIsSummaryConfirmed(Boolean(loadedV2Draft.isSummaryConfirmed));
      if (loadedV2Draft.savedRecordMeta) {
        setSavedRecordMeta(loadedV2Draft.savedRecordMeta);
      }
    } else {
      const initMsg = [{
        role: 'model',
        stage: 1,
        text: promptTrigger.firstQuestion,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workflowVersion: WORKFLOW_VERSION
      }];
      setMessages(initMsg);
      setChatStage(1);
      setStageFollowUpUsed({ 1: false, 2: false, 3: false, 4: false });
      setIsCompleted(false);
      setIsChatFinished(false);
      setSummaryDraft(null);
      setIsSummaryConfirmed(false);
      try {
        localStorage.setItem('cbas_step2_v2_draft', JSON.stringify({
          workflowVersion: WORKFLOW_VERSION,
          fingerprint: currentFingerprint,
          chatStage: 1,
          stageFollowUpUsed: { 1: false, 2: false, 3: false, 4: false },
          isCompleted: false,
          isSummaryConfirmed: false,
          messages: initMsg
        }));
        // Chỉ khởi tạo cbas_step2_messages nếu chưa có biên bản cũ đã hoàn thành (bảo toàn biên bản cũ)
        const existingLegacyCompleted = localStorage.getItem('cbas_step2_completed') === 'true';
        if (!existingLegacyCompleted) {
          localStorage.setItem('cbas_step2_messages', JSON.stringify(initMsg));
        }
      } catch (e) {}
    }
  }, []);

  // Lưu nháp tiến trình v2 mỗi khi state hội thoại hoặc bản tóm tắt thay đổi
  const persistV2Draft = (nextState = {}) => {
    try {
      const payload = {
        workflowVersion: WORKFLOW_VERSION,
        chatStage: nextState.chatStage ?? chatStage,
        stageFollowUpUsed: nextState.stageFollowUpUsed ?? stageFollowUpUsed,
        isCompleted: nextState.isCompleted ?? isCompleted,
        isSummaryConfirmed: nextState.isSummaryConfirmed ?? isSummaryConfirmed,
        messages: nextState.messages ?? messages,
        summaryDraft: nextState.summaryDraft ?? summaryDraft,
        savedRecordMeta: nextState.savedRecordMeta ?? savedRecordMeta,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('cbas_step2_v2_draft', JSON.stringify(payload));
    } catch (e) {}
  };

  // Tạo prompt gửi tới Gemini trực tiếp theo 4 chặng (hoặc câu hỏi bổ sung của chặng hiện tại)
  const generatePromptForRound = (targetStage, profile, userText, followUpReason = null) => {
    const career = profile?.shiftedMajor || profile?.targetMajor || profile?.target_career || 'ngành đã chọn';
    const rawSchool = profile?.targetSchool || profile?.target_university || '';
    const isVocational = isVocationalTrack(career, userText, rawSchool);
    const uni = formatSchoolName(rawSchool, isVocational);
    const reason = profile?.reason || 'Chưa nêu chi tiết';
    const conf = profile?.initialConfidence ?? 5;

    const baseContext = `${REFLECTIVE_4STAGES_PERSONA}
THÔNG TIN BƯỚC 1 CỦA HỌC SINH:
- Ngành mục tiêu: ${career}
- Trường / Cơ sở đào tạo dự kiến: ${uni}
- Lý do ban đầu ở Bước 1: "${reason}"
- Mức tự tin ban đầu: ${conf}/10
- Phản hồi vừa rồi của học sinh: "${userText}"
`;

    if (followUpReason === 'clarify_broad_major') {
      return `${baseContext}
[NHIỆM VỤ LƯỢT PHẢN HỒI BỔ SUNG CHẶNG 1 (LÀM RÕ NGÀNH CỤ THỂ)]:
- Ghi nhận ngắn gọn, trung lập ý kiến vừa nêu của học sinh (không mặc định định hướng của cha mẹ hay bạn bè là tiêu cực).
- Vì tên lĩnh vực "${career}" còn khá rộng, hãy đặt 01 câu hỏi ngắn giúp học sinh làm rõ ngành cụ thể đang hướng tới trước khi xem xét yêu cầu học tập và nghề nghiệp.`;
    }

    if (followUpReason === 'ask_stage2_example') {
      return `${baseContext}
[NHIỆM VỤ LƯỢT PHẢN HỒI BỔ SUNG CHẶNG 2 (HỎI VÍ DỤ CỤ THỂ & NGUỒN)]:
- Học sinh vừa cho biết đã tìm hiểu về ngành "${career}".
- Hãy đặt 01 câu hỏi ngắn, thân thiện mời học sinh nêu 1 ví dụ cụ thể về yêu cầu học tập hoặc khó khăn/cơ hội thực tế của ngành và cho biết em tìm hiểu thông tin đó từ nguồn nào.`;
    }

    if (followUpReason === 'ask_stage3_independent_source') {
      return `${baseContext}
[NHIỆM VỤ LƯỢT PHẢN HỒI BỔ SUNG CHẶNG 3 (HỎI NGUỒN ĐỘC LẬP ĐỐI CHIẾU & YÊU CẦU NGƯỜI MỚI RA TRƯỜNG)]:
- Ghi nhận trung lập nguồn thông tin học sinh vừa nêu (không mặc định video, người quen hay AI là sai).
- Đặt 01 câu hỏi ngắn: Em có thể đối chiếu thêm với nguồn độc lập nào (như đề án tuyển sinh, báo cáo việc làm của trường hoặc thông tin tuyển dụng thực tế), và theo em người mới ra trường cần đáp ứng những yêu cầu gì?`;
    }

    if (followUpReason === 'clarify_stage4_admission_vs_skills') {
      return `${baseContext}
[NHIỆM VỤ LƯỢT PHẢN HỒI BỔ SUNG CHẶNG 4 (PHÂN BIỆT ĐIỀU KIỆN TUYỂN SINH & KỸ NĂNG HỌC TẬP/HÀNH NGHỀ)]:
- Ghi nhận những kỹ năng học sinh vừa nêu là hữu ích cho quá trình học tập và làm nghề.
- Lưu ý nhẹ nhàng sự khác biệt giữa kỹ năng mềm và điều kiện xét tuyển đầu vào (môn học trong tổ hợp xét tuyển, phương thức xét tuyển).
- Đặt 01 câu hỏi ngắn: Về các môn học phục vụ xét tuyển vào ngành ${career} và những thông tin tuyển sinh cần kiểm tra ở Bước 3, em đã chuẩn bị được gì và còn điều gì chưa rõ?`;
    }

    switch (targetStage) {
      case 2:
        return `${baseContext}
[NHIỆM VỤ CHUYỂN SANG CHẶNG 2 – XEM XÉT HIỂU BIẾT VỀ NGÀNH]:
1. Ghi nhận trung lập chia sẻ của học sinh ở Chặng 1 (nếu học sinh không có lý do khác hoặc chọn theo định hướng gia đình/bạn bè, ghi nhận trung lập, không phán xét).
2. Đặt câu hỏi chính của Chặng 2:
"Em đã tìm hiểu những yêu cầu và khó khăn thực tế nào khi học và làm nghề này? Em biết những điều đó từ đâu?"`;

      case 3:
        return `${baseContext}
[NHIỆM VỤ CHUYỂN SANG CHẶNG 3 – XEM XÉT CƠ HỘI VIỆC LÀM]:
1. Ghi nhận trung lập câu trả lời ở Chặng 2 (nếu học sinh chưa tìm hiểu, ghi nhận nhẹ nhàng đó là nội dung sẽ kiểm chứng ở Bước 3, không trách móc hay giảng giải dài; xem xét cân bằng cả cơ hội và yêu cầu thực tế).
2. Đặt câu hỏi chính của Chặng 3:
"Em đánh giá cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào? Nhận định đó dựa trên thông tin nào, và người mới ra trường cần đáp ứng những yêu cầu gì?"`;

      case 4:
        return `${baseContext}
[NHIỆM VỤ CHUYỂN SANG CHẶNG 4 – ĐỐI CHIẾU SỰ CHUẨN BỊ]:
1. Ghi nhận trung lập nhận định của học sinh ở Chặng 3 (không dẫn dắt theo hướng ngành chắc chắn dễ xin việc hoặc thất nghiệp cao; không tự đưa ra số liệu tỷ lệ việc làm hay mức lương).
2. Đặt câu hỏi chính của Chặng 4:
"So với yêu cầu tuyển sinh và học tập của ngành, em đã chuẩn bị được gì về môn học và kỹ năng? Điều gì còn thiếu hoặc chưa rõ mà em cần kiểm tra ở bước 3?"`;

      case 5:
      default:
        return `${baseContext}
[NHIỆM VỤ TỔNG KẾT 4 CHẶNG VÀ CHUYỂN SANG BƯỚC 3]:
1. Ghi nhận ngắn gọn những điểm chính học sinh đã chia sẻ qua 4 chặng (kể cả những nội dung học sinh báo cáo chưa biết hoặc cần kiểm tra thêm).
2. Kết thúc bằng đúng câu sau:
"${FINAL_CLOSING_SENTENCE}"`;
    }
  };

  // Phản hồi dự phòng trung lập, bám sát 100% câu trả lời thực tế của học sinh và đúng cấu trúc 4 chặng
  const generateHeuristicFallback = (targetStage, profile, userText = '', followUpReason = null) => {
    const career = profile?.shiftedMajor || profile?.targetMajor || profile?.target_career || 'ngành đã chọn';
    const rawSchool = profile?.targetSchool || profile?.target_university || '';
    const isVocational = isVocationalTrack(career, userText, rawSchool);
    const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
    const cleanUser = (userText || '').trim();
    const uNorm = removeVietnameseTones(cleanUser);

    const isDontKnow = /(chua biet|khong biet|chua tim hieu|chua ro|chua co can cu|khong ro)/i.test(uNorm);
    const isParentReason = /(ba me|bo me|cha me|gia dinh|phu huynh|dinh huong)/i.test(uNorm);
    const isDisagree = isCounterArguing(cleanUser);

    if (followUpReason === 'clarify_broad_major') {
      const ack = isParentReason
        ? 'Thầy ghi nhận định hướng và sự đồng hành từ gia đình là một điểm tựa quan trọng với em.'
        : 'Thầy đã ghi nhận chia sẻ của em về lý do lựa chọn.';
      return `${ack} Vì lĩnh vực "${career}" có nhiều ngành đào tạo khác nhau, em đang hướng tới ngành cụ thể nào trong lĩnh vực này (ví dụ một chuyên ngành cụ thể ${schoolClause}) để mình tiện đối chiếu yêu cầu học tập ở các chặng tiếp theo?`;
    }

    if (followUpReason === 'ask_stage2_example') {
      return `Thầy ghi nhận là em đã bước đầu tìm hiểu về ngành ${career}. Em có thể chia sẻ thêm một ví dụ cụ thể về yêu cầu học tập hoặc công việc thực tế của ngành mà em ấn tượng nhất, và em biết thông tin đó từ nguồn nào không?`;
    }

    if (followUpReason === 'ask_stage3_independent_source') {
      return `Thầy ghi nhận nhận định và thông tin tham khảo em vừa nêu về cơ hội việc làm ngành ${career}. Để có thêm góc nhìn khách quan, theo em mình có thể đối chiếu thêm với nguồn độc lập nào (như báo cáo việc làm của trường, đề án tuyển sinh hay tin tuyển dụng thực tế), và người mới ra trường cần đáp ứng những yêu cầu gì?`;
    }

    if (followUpReason === 'clarify_stage4_admission_vs_skills') {
      return `Những kỹ năng em vừa nêu là nền tảng hữu ích cho quá trình học tập và làm nghề sau này. Tuy nhiên, điều kiện tuyển sinh đầu vào của trường thường dựa trên các môn văn hóa trong tổ hợp xét tuyển hoặc phương thức xét tuyển cụ thể; vậy về các môn học phục vụ xét tuyển và những điều kiện đầu vào cần kiểm tra ở Bước 3, em đã chuẩn bị được gì và còn điều gì chưa rõ?`;
    }

    if (targetStage === 2) {
      let ack = `Thầy đã ghi nhận lý do lựa chọn và điều quan trọng nhất mà em vừa chia sẻ đối với ngành ${career}.`;
      if (isParentReason) {
        ack = `Thầy ghi nhận định hướng của gia đình cùng suy nghĩ của em khi lựa chọn ngành ${career}.`;
      } else if (isDontKnow || /^(khong co|khong)$/i.test(uNorm)) {
        ack = `Thầy ghi nhận em giữ nguyên lý do lựa chọn đã nêu ở Bước 1 cho ngành ${career}.`;
      } else if (isDisagree) {
        ack = `Thầy tôn trọng góc nhìn và lập luận riêng của em về lý do chọn ngành ${career}.`;
      }
      return `${ack} Bước sang Chặng 2, em đã tìm hiểu những yêu cầu và khó khăn thực tế nào khi học và làm nghề này? Em biết những điều đó từ đâu?`;
    }

    if (targetStage === 3) {
      let ack = `Thầy đã ghi nhận những thông tin và nguồn tìm hiểu của em về yêu cầu học tập cũng như thực tế công việc ngành ${career}.`;
      if (isDontKnow) {
        ack = `Việc em chưa tìm hiểu chi tiết các yêu cầu học tập và thực tế nghề ${career} ở thời điểm này là hoàn toàn bình thường; thầy sẽ ghi nhận đây là nội dung cần kiểm chứng ở Bước 3.`;
      }
      return `${ack} Ở Chặng 3 này, em đánh giá cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào? Nhận định đó dựa trên thông tin nào, và người mới ra trường cần đáp ứng những yêu cầu gì?`;
    }

    if (targetStage === 4) {
      let ack = `Thầy đã ghi nhận góc nhìn của em về cơ hội việc làm và yêu cầu đối với người mới tốt nghiệp ngành ${career}.`;
      if (isDontKnow) {
        ack = `Thầy ghi nhận phần thông tin về cơ hội việc làm và yêu cầu tuyển dụng của ngành ${career} là nội dung mình sẽ đối chiếu thêm với nguồn dữ liệu ở Bước 3.`;
      }
      return `${ack} Bước sang Chặng 4, so với yêu cầu tuyển sinh và học tập của ngành, em đã chuẩn bị được gì về môn học và kỹ năng? Điều gì còn thiếu hoặc chưa rõ mà em cần kiểm tra ở bước 3?`;
    }

    // Chặng 5: Tổng kết và chuyển sang Bước 3
    return `Cảm ơn em đã trao đổi thẳng thắn qua cả 4 chặng để làm rõ lý do chọn ngành ${career}, mức độ hiểu biết về ngành, góc nhìn về cơ hội việc làm cũng như sự chuẩn bị hiện tại của bản thân. ${FINAL_CLOSING_SENTENCE}`;
  };

  // Gọi API phản tư
  const callGeminiSocratic = async (historyMessages, userText, targetStage, currentStage, followUpReason = null, currentFollowUpCount = 0) => {
    const goalShift = detectGoalShift(userText);
    const curMajor = studentProfile?.shiftedMajor || studentProfile?.targetMajor || studentProfile?.target_career || 'ngành mục tiêu';
    const effectiveMajor = (goalShift && goalShift.newMajor) ? goalShift.newMajor : curMajor;
    const effectiveProfile = {
      ...studentProfile,
      targetMajor: effectiveMajor,
      target_career: effectiveMajor,
      targetCareer: effectiveMajor,
      shiftedMajor: effectiveMajor
    };

    const requestPayload = {
      chatStage: followUpReason ? currentStage : targetStage,
      stage: followUpReason ? currentStage : targetStage,
      round: followUpReason ? currentStage : targetStage,
      isFollowUp: Boolean(followUpReason),
      followUpCount: followUpReason ? 0 : 1,
      followUpReason,
      studentProfile: {
        hollandCode: effectiveProfile.hollandCode || 'RIASEC',
        targetMajor: effectiveMajor,
        targetSchool: effectiveProfile.targetSchool || '',
        reason: effectiveProfile.reason || '',
        initialConfidence: effectiveProfile.initialConfidence ?? 5,
        expectedIncome: effectiveProfile.expectedIncome || '',
        studentId: effectiveProfile.studentId || ''
      },
      chatHistory: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text, stage: m.stage })),
      userMessage: userText,
      message: userText,
      history: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text, stage: m.stage }))
    };

    const isStage5 = !followUpReason && targetStage === 5;

    // 1. Thử gọi endpoint /api/socrates-chat
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch('/api/socrates-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: ctrl.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const sData = await res.json();
        const replyText = sData?.response || sData?.reply;
        if (replyText && replyText.trim().length >= 15) {
          const sanitized = sanitizeSocraticResponse(replyText, isStage5 ? 5 : targetStage, effectiveMajor, effectiveProfile.targetSchool, userText);
          return {
            replyText: sanitized,
            chatStage: isStage5 ? 5 : targetStage,
            isCompleted: isStage5,
            isComplete: isStage5,
            shiftedMajor: sData?.shiftedMajor || (goalShift ? goalShift.newMajor : null),
            serverTimestamp: sData?.serverTimestamp || new Date().toISOString()
          };
        }
      }
    } catch (e) {
      // Chuyển sang fallback
    }

    // 2. Sử dụng phản hồi chuẩn mực theo cấu trúc 4 chặng (đảm bảo câu hỏi chính xác từng chặng)
    const fallbackText = generateHeuristicFallback(targetStage, effectiveProfile, userText, followUpReason);
    const sanitizedFallback = sanitizeSocraticResponse(fallbackText, isStage5 ? 5 : targetStage, effectiveMajor, effectiveProfile.targetSchool, userText);

    return {
      replyText: sanitizedFallback,
      chatStage: isStage5 ? 5 : targetStage,
      isCompleted: isStage5,
      isComplete: isStage5,
      shiftedMajor: goalShift ? goalShift.newMajor : null,
      serverTimestamp: new Date().toISOString()
    };
  };

  // Xử lý lưu & xác nhận biên bản phản tư (Mục 4, 5, 6)
  const handleConfirmAndSaveSummary = async (customSummary = null) => {
    const summaryToSave = customSummary || summaryDraft || buildReflectiveSummary(messages, studentProfile);
    const serverTime = new Date().toISOString();

    const recordId = `step2_v2_${Date.now()}`;
    const v2Record = {
      record_id: recordId,
      workflow_version: WORKFLOW_VERSION,
      server_timestamp: serverTime,
      student_code: studentProfile?.studentId || localStorage.getItem('cbas_student_id') || 'CT_01',
      step1_snapshot: {
        targetMajor: studentProfile?.targetMajor || '',
        shiftedMajor: studentProfile?.shiftedMajor || studentProfile?.targetMajor || '',
        targetSchool: studentProfile?.targetSchool || '',
        initialReason: studentProfile?.reason || '',
        initialConfidence: studentProfile?.initialConfidence ?? 5,
        expectedIncome: studentProfile?.expectedIncome || '',
        hollandCode: studentProfile?.hollandCode || ''
      },
      stages_completed: 4,
      self_report_unverified_notice: 'Thông tin do học sinh nêu trong hội thoại là dữ liệu tự báo cáo, chưa được xác minh.',
      confirmed_by_student: true,
      confirmed_summary: {
        student_statements: {
          reasons: summaryToSave.studentReasons,
          mentioned_info_and_sources: summaryToSave.mentionedInfoAndSources,
          self_reported_preparation: summaryToSave.selfReportedPreparation,
          unverified_or_missing_items: summaryToSave.unverifiedOrMissingItems
        },
        ai_suggestions_for_step3: {
          questions_to_verify: summaryToSave.questionsForStep3,
          mentor_consultation_suggestion: summaryToSave.mentorRecommendation,
          student_requests_mentor_support: Boolean(summaryToSave.mentorSupportRequested)
        }
      },
      messages: messages.map(m => ({
        role: m.role,
        stage: m.stage || null,
        text: m.text,
        time: m.time || ''
      }))
    };

    try {
      // 1. Lưu thêm vào danh sách biên bản v2 (append-only, KHÔNG ghi đè các biên bản đã lưu trước đó)
      const existingListRaw = localStorage.getItem('cbas_step2_v2_records');
      const existingList = existingListRaw ? JSON.parse(existingListRaw) : [];
      const updatedList = Array.isArray(existingList) ? [...existingList, v2Record] : [v2Record];
      localStorage.setItem('cbas_step2_v2_records', JSON.stringify(updatedList));
      localStorage.setItem('cbas_step2_v2_latest', JSON.stringify(v2Record));
      localStorage.setItem('cbas_step2_completed', 'true');

      // 2. Nếu chưa có cbas_step2_telemetry cũ thì mới lưu bản tương thích ngược có đánh dấu legacy_compatibility_only: true
      const existingLegacyTelemetry = localStorage.getItem('cbas_step2_telemetry');
      const compatTelemetry = {
        workflow_version: WORKFLOW_VERSION,
        legacy_compatibility_only: true,
        summary_title: 'Tóm tắt phản tư và nội dung cần kiểm chứng',
        student_reasons: summaryToSave.studentReasons,
        mentioned_info_and_sources: summaryToSave.mentionedInfoAndSources,
        self_reported_preparation: summaryToSave.selfReportedPreparation,
        unverified_or_missing_items: summaryToSave.unverifiedOrMissingItems,
        questions_for_step3: summaryToSave.questionsForStep3,
        mentor_recommendation: summaryToSave.mentorRecommendation,
        self_report_unverified: true,
        // Trường tương thích ngược cho các trang đọc cũ (được đánh dấu legacy_compatibility_only):
        turning_point_detected: 'Legacy_Deprecated',
        outcome_category: 'Reflective_Inquiry_Completed',
        triage_step4: summaryToSave.mentorSupportRequested
          ? 'Tham vấn và kiểm chứng với mentor (theo nhu cầu hỗ trợ)'
          : 'Tự chủ đối chứng ở Bước 3 & Tham vấn mentor khi cần',
        timestamp: serverTime
      };
      setSessionTelemetry(compatTelemetry);
      if (!existingLegacyTelemetry) {
        localStorage.setItem('cbas_step2_telemetry', JSON.stringify(compatTelemetry));
      }
      if (!localStorage.getItem('cbas_step2_messages')) {
        localStorage.setItem('cbas_step2_messages', JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Lỗi lưu biên bản vào localStorage:', e);
    }

    // 3. Thử đồng bộ biên bản phiên bản mới lên Supabase (nếu có kết nối, không ghi đè bản cũ)
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
    } catch (e) {
      // Bỏ qua nếu bảng chưa tạo hoặc đang offline
    }

    const meta = {
      recordId,
      workflowVersion: WORKFLOW_VERSION,
      serverTimestamp: serverTime
    };
    setSavedRecordMeta(meta);
    setSummaryDraft(summaryToSave);
    setIsSummaryConfirmed(true);
    setIsEditingSummary(false);
    setSummaryStatusMsg(`Đã xác nhận và lưu biên bản phản tư (Phiên bản quy trình: ${WORKFLOW_VERSION} • ${new Date(serverTime).toLocaleString('vi-VN')}).`);
    persistV2Draft({
      summaryDraft: summaryToSave,
      isSummaryConfirmed: true,
      savedRecordMeta: meta
    });
  };

  // 4. TRÍCH XUẤT BIÊN BẢN ĐỐI THOẠI CHUẨN MỰC (MỤC 5 & MỤC 6)
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

    const studentCode = studentProfile?.studentId || userProfile?.studentId || anchor?.student_code || localStorage.getItem('cbas_student_id') || 'CT_01';
    const targetCareer = studentProfile?.shiftedMajor || userProfile?.targetMajor || anchor?.target_career || studentProfile?.targetMajor || 'Chưa xác định';
    const rawUniv = userProfile?.targetSchool || anchor?.target_university || studentProfile?.targetSchool || '';
    const isVocationalExport = isVocationalTrack(targetCareer, '', rawUniv);
    const targetUniv = formatSchoolName(rawUniv, isVocationalExport);
    const confidence = userProfile?.initialConfidence ?? anchor?.confidence_score ?? studentProfile?.initialConfidence ?? '5';
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || studentProfile?.expectedIncome || 'Chưa khai báo';
    const reason = userProfile?.reason || anchor?.source_of_influence || studentProfile?.reason || 'Chưa ghi nhận lý do';
    const holland = userProfile?.hollandCode || anchor?.holland_code || studentProfile?.hollandCode || 'AEI';
    const serverTimeStr = savedRecordMeta?.serverTimestamp
      ? new Date(savedRecordMeta.serverTimestamp).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN');

    const activeSummary = summaryDraft || buildReflectiveSummary(messages, studentProfile || {});

    let content = `=================================================================\n`;
    content += `   BIÊN BẢN ĐỐI THOẠI PHẢN TƯ VỚI AI SOCRATES (BƯỚC 2)\n`;
    content += `   Hệ Thống Hỗ Trợ Ra Quyết Định Nghề Nghiệp Có Căn Cứ (SocraCareer)\n`;
    content += `=================================================================\n\n`;
    content += `🔖 Phiên bản quy trình: ${WORKFLOW_VERSION}\n`;
    content += `📅 Thời gian ghi nhận (Server Timestamp): ${serverTimeStr}\n`;
    content += `🆔 Mã học sinh: ${studentCode}\n`;
    content += `🎯 Ngành mục tiêu (Bước 1): ${targetCareer}\n`;
    content += `🏛️ Trường / Cơ sở đào tạo dự kiến: ${targetUniv}\n`;
    content += `🧭 Tổ hợp thiên hướng Holland (Bước 1): ${holland}\n`;
    content += `📊 Mức tự tin ban đầu (Bước 1): ${confidence}/10\n`;
    content += `💵 Kỳ vọng thu nhập ban đầu (Bước 1): ${expectedIncome}\n`;
    content += `📝 Lý do chọn ban đầu (Bước 1): ${reason}\n`;
    content += `🔄 Tiến trình: ${isReadyForStep3 ? '4 / 4 chặng phản tư (Đã hoàn thành)' : `${Math.min(chatStage, 4)} / 4 chặng phản tư`}\n`;
    content += `ℹ️ Lưu ý: Thông tin do học sinh nêu trong biên bản này là dữ liệu tự báo cáo, chưa được xác minh.\n\n`;

    content += `-----------------------------------------------------------------\n`;
    content += `TÓM TẮT PHẢN TƯ VÀ NỘI DUNG CẦN KIỂM CHỨNG:\n`;
    content += `(Trạng thái: ${isSummaryConfirmed ? 'Học sinh đã xem và xác nhận' : 'Bản tổng hợp chờ học sinh xác nhận'})\n`;
    content += `-----------------------------------------------------------------\n`;
    content += `[A. PHẦN PHÁT BIỂU TỰ BÁO CÁO CỦA HỌC SINH (Chưa được xác minh)]\n`;
    content += `1. Lý do lựa chọn do học sinh nêu:\n   - ${activeSummary.studentReasons}\n`;
    content += `2. Thông tin và nguồn học sinh đã đề cập:\n   - ${activeSummary.mentionedInfoAndSources}\n`;
    content += `3. Sự chuẩn bị do học sinh tự báo cáo:\n   - ${activeSummary.selfReportedPreparation}\n`;
    content += `4. Những nội dung còn thiếu hoặc chưa được kiểm chứng:\n   - ${activeSummary.unverifiedOrMissingItems}\n\n`;

    content += `[B. PHẦN GỢI Ý CỦA AI ĐỂ KIỂM CHỨNG Ở BƯỚC 3 & THAM VẤN MENTOR]\n`;
    content += `5. Danh sách câu hỏi cần kiểm tra ở Bước 3 (kèm loại nguồn gợi ý):\n`;
    (activeSummary.questionsForStep3 || []).forEach((q, idx) => {
      content += `   5.${idx + 1}. Câu hỏi: ${q.question}\n`;
      content += `        Gợi ý loại nguồn phù hợp: ${q.suggestedSourceType}\n`;
    });
    content += `- Đề xuất tham vấn và kiểm chứng với mentor:\n   * ${activeSummary.mentorRecommendation}\n\n`;

    content += `-----------------------------------------------------------------\n`;
    content += `CHI TIẾT NỘI DUNG ĐỐI THOẠI THEO 4 CHẶNG:\n`;
    content += `-----------------------------------------------------------------\n\n`;

    messages.forEach((msg) => {
      const sender = msg.role === 'model' ? '🤖 Thầy Socrates (AI)' : '🧑‍🎓 Học sinh';
      const stageTag = msg.stage ? ` [Chặng ${Math.min(msg.stage, 4)}]` : '';
      content += `[${msg.time || ''}]${stageTag} ${sender}:\n${msg.text}\n\n`;
    });

    content += `=================================================================\n`;
    content += `📌 HƯỚNG DẪN TIẾP THEO DÀNH CHO HỌC SINH:\n`;
    content += `1. Ở Bước 3, hãy đối chiếu các câu hỏi cần kiểm tra ở trên với nguồn dữ liệu chính thống phù hợp để xem lựa chọn của mình đã có căn cứ đến đâu.\n`;
    content += `2. Sử dụng biên bản này để tham vấn và kiểm chứng với mentor trong buổi trao đổi ở Bước 4 khi em cần hỗ trợ thêm.\n`;
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
    link.download = `Bien_ban_phan_tu_Bước2_${careerSlug}_${new Date().toISOString().slice(0, 10)}.txt`;
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

  // Làm lại phiên nháp hiện tại (KHÔNG xóa danh sách biên bản cbas_step2_v2_records đã lưu trước đó)
  const handleResetSession = () => {
    if (window.confirm('Em có muốn bắt đầu lại phiên đối thoại mới từ Chặng 1 không? (Các biên bản đã xác nhận và lưu trước đó vẫn được bảo toàn)')) {
      try {
        localStorage.removeItem('cbas_step2_v2_draft');
      } catch (e) {}
      window.location.reload();
    }
  };

  // 5. XỬ LÝ GỬI TIN NHẮN THEO 4 CHẶNG PHẢN TƯ
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isLoading || isReadyForStep3) return;
    const cleanText = inputValue.trim();
    if (cleanText.length === 0) return;

    const reflex = processStudentMessage(cleanText, chatStage, studentProfile);

    if (reflex.advanceRound === false && reflex.reply) {
      setErrorMessage('');
      const userMsg = {
        role: 'user',
        stage: chatStage,
        text: cleanText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const aiMsg = {
        role: 'model',
        stage: chatStage,
        text: reflex.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const next = [...prev, userMsg, aiMsg];
        persistV2Draft({ messages: next });
        return next;
      });
      setInputValue('');
      return;
    }

    setErrorMessage('');
    const userMsg = {
      role: 'user',
      stage: chatStage,
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsLoading(true);

    // Đánh giá chuyển chặng hoặc hỏi bổ sung (tối đa 1 câu bổ sung mỗi chặng)
    const progression = evaluateStageProgression(chatStage, cleanText, studentProfile, stageFollowUpUsed);
    const nextFollowUpState = { ...stageFollowUpUsed };
    if (progression.shouldFollowUp) {
      nextFollowUpState[chatStage] = true;
      setStageFollowUpUsed(nextFollowUpState);
    }

    const targetStage = progression.shouldFollowUp ? chatStage : progression.nextStage;

    try {
      const aiResult = await callGeminiSocratic(
        nextHistory,
        cleanText,
        targetStage,
        chatStage,
        progression.followUpReason,
        stageFollowUpUsed[chatStage] ? 1 : 0
      );

      // Nếu học sinh làm rõ ngành cụ thể (ví dụ từ "Kinh tế" -> "Quản trị Kinh doanh"), cập nhật shiftedMajor trong phiên Bước 2 mà KHÔNG ghi đè dữ liệu gốc Bước 1
      const goalShift = detectGoalShift(cleanText);
      const newMajor = goalShift?.newMajor || aiResult?.shiftedMajor;
      let updatedProfile = studentProfile;
      if (newMajor && (!studentProfile?.targetMajor || newMajor.toLowerCase() !== studentProfile.targetMajor.toLowerCase())) {
        updatedProfile = {
          ...studentProfile,
          shiftedMajor: newMajor
        };
        setStudentProfile(updatedProfile);
      }

      const replyContent = aiResult?.replyText || (typeof aiResult === 'string' ? aiResult : '');
      const isFinished = targetStage === 5 && !progression.shouldFollowUp;
      const nextStageNum = isFinished ? 5 : targetStage;

      const aiMsg = {
        role: 'model',
        stage: isFinished ? 4 : nextStageNum,
        text: replyContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workflowVersion: WORKFLOW_VERSION
      };

      const updatedHistory = [...nextHistory, aiMsg];
      setMessages(updatedHistory);
      setChatStage(nextStageNum);

      // Cập nhật tiêu đề chặng hiển thị
      const stageMeta = STAGE_DEFINITIONS[Math.min(nextStageNum, 4)];
      if (stageMeta) {
        setActiveBiasType(stageMeta.title.toUpperCase());
      }

      if (isFinished) {
        setIsCompleted(true);
        setIsChatFinished(true);
        const generatedSummary = buildReflectiveSummary(updatedHistory, updatedProfile);
        setSummaryDraft(generatedSummary);
        try {
          localStorage.setItem('cbas_step2_completed', 'true');
        } catch (e) {}
        persistV2Draft({
          chatStage: 5,
          stageFollowUpUsed: nextFollowUpState,
          isCompleted: true,
          messages: updatedHistory,
          summaryDraft: generatedSummary
        });
      } else {
        persistV2Draft({
          chatStage: nextStageNum,
          stageFollowUpUsed: nextFollowUpState,
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

  // Cập nhật trường trong bản tóm tắt khi học sinh chỉnh sửa
  const handleSummaryFieldChange = (field, value) => {
    setSummaryDraft(prev => {
      const base = prev || buildReflectiveSummary(messages, studentProfile);
      return {
        ...base,
        [field]: value
      };
    });
    setIsSummaryConfirmed(false);
  };

  const handleQuestionStep3Change = (idx, key, value) => {
    setSummaryDraft(prev => {
      const base = prev || buildReflectiveSummary(messages, studentProfile);
      const list = [...(base.questionsForStep3 || [])];
      if (list[idx]) {
        list[idx] = { ...list[idx], [key]: value };
      }
      return {
        ...base,
        questionsForStep3: list
      };
    });
    setIsSummaryConfirmed(false);
  };

  const handleAddQuestionStep3 = () => {
    setSummaryDraft(prev => {
      const base = prev || buildReflectiveSummary(messages, studentProfile);
      const list = [...(base.questionsForStep3 || [])];
      if (list.length >= 3) return base;
      list.push({
        id: `q3_${Date.now()}`,
        question: '',
        suggestedSourceType: 'Đề án tuyển sinh chính thức của trường / Cổng thông tin việc làm'
      });
      return {
        ...base,
        questionsForStep3: list
      };
    });
    setIsSummaryConfirmed(false);
  };

  const handleRemoveQuestionStep3 = (idx) => {
    setSummaryDraft(prev => {
      const base = prev || buildReflectiveSummary(messages, studentProfile);
      const list = [...(base.questionsForStep3 || [])];
      if (list.length <= 1) return base;
      list.splice(idx, 1);
      return {
        ...base,
        questionsForStep3: list
      };
    });
    setIsSummaryConfirmed(false);
  };

  const currentStageMeta = STAGE_DEFINITIONS[Math.min(chatStage, 4)] || STAGE_DEFINITIONS[1];

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '88vh', fontFamily: 'sans-serif' }}>
      <StepProgressHeader
        currentStep={2}
        onResetStep={handleResetSession}
        title="Bước 2: Đối thoại phản tư với AI Socrates"
        subtitle="Làm rõ lý do chọn ngành, hiểu biết thực tế, cơ hội việc làm và những nội dung cần kiểm chứng ở Bước 3."
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
              Để AI Socrates cá nhân hóa cuộc đối thoại phản tư dựa trên ngành nghề và lý do lựa chọn ban đầu của em, em cần hoàn thành <strong>Bước 1 (Trắc nghiệm Holland RIASEC & Khai báo lựa chọn ban đầu)</strong> trước.
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
          {/* CSS CHO CHẾ ĐỘ IN / LƯU FILE PDF */}
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

          {/* THANH TIẾN TRÌNH 4 CHẶNG & CỤM NÚT THAO TÁC / XUẤT FILE */}
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
                    BƯỚC 2: ĐỐI THOẠI PHẢN TƯ 4 CHẶNG
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '8px', fontWeight: '600' }}>
                    Quy trình: {WORKFLOW_VERSION}
                  </span>
                </div>
                <h2 style={{ fontSize: '17px', margin: '3px 0 0 0', color: '#0f172a', fontWeight: '800' }}>
                  Đối thoại phản tư với AI Socrates
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span>Tiến trình:</span>
                <span style={{ color: '#2563eb' }}>{isReadyForStep3 ? 4 : Math.min(chatStage, 4)}</span>
                <span>/ {maxStages} chặng</span>
                {isReadyForStep3 ? (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                    ✓ Đã hoàn thành 4 chặng
                  </span>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: '6px' }} className="no-print">
                <button
                  type="button"
                  onClick={handleCopyText}
                  title="Sao chép toàn bộ biên bản phản tư vào bộ nhớ tạm"
                  style={{
                    background: copySuccess ? '#ecfdf5' : '#f8fafc',
                    border: '1px solid ' + (copySuccess ? '#a7f3d0' : '#cbd5e1'),
                    borderRadius: '6px',
                    padding: '6px 11px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: copySuccess ? '#059669' : '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copySuccess ? '✅ Đã chép!' : '📋 Sao chép'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  title="Tải biên bản phản tư (.txt)"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 11px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📥 Xuất .TXT
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  title="In hoặc Lưu file PDF chuẩn"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 11px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🖨️ Lưu PDF
                </button>

                <button
                  type="button"
                  onClick={handleResetSession}
                  title="Bắt đầu lại cuộc trò chuyện từ Chặng 1"
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '6px 11px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔄 Bắt đầu lại
                </button>
              </div>
            </div>
          </div>

          {/* THANH CHỈ BÁO 4 CHẶNG RÕ RÀNG */}
          <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }} className="no-print">
            {[1, 2, 3, 4].map((st) => {
              const def = STAGE_DEFINITIONS[st];
              const isDone = isReadyForStep3 || chatStage > st;
              const isCurrent = !isReadyForStep3 && chatStage === st;
              return (
                <div
                  key={st}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    border: isCurrent ? '1.5px solid #2563eb' : isDone ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                    background: isCurrent ? '#eff6ff' : isDone ? '#ecfdf5' : '#ffffff',
                    color: isCurrent ? '#1d4ed8' : isDone ? '#065f46' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{isDone ? '✓' : `${st}.`}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.shortLabel}</span>
                </div>
              );
            })}
          </div>

          {/* KHUNG NỘI DUNG CHAT & BẢNG TÓM TẮT PHẢN TƯ (VÙNG IN VÀ HIỂN THỊ) */}
          <div
            id="socratic-chat-export-area"
            ref={chatContainerRef}
            style={{
              height: isReadyForStep3 ? 'auto' : '56vh',
              minHeight: '400px',
              maxHeight: isReadyForStep3 ? 'none' : '560px',
              overflowY: 'auto',
              overflowAnchor: 'none',
              padding: '20px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* BANNER THÔNG TIN BƯỚC 1 & MỤC TIÊU BƯỚC 2 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎯 Lựa chọn Bước 1:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                  {studentProfile?.shiftedMajor || studentProfile?.targetMajor || 'Ngành mục tiêu'} {studentProfile?.targetSchool ? `(${studentProfile.targetSchool})` : ''}
                </span>
                {studentProfile?.initialConfidence != null && (
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    Mức tự tin ban đầu: {studentProfile.initialConfidence}/10
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                  🧭 Trọng tâm hiện tại:
                </span>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '600',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #dbeafe'
                }}>
                  {isReadyForStep3 ? 'Tổng kết phản tư & Nội dung cần kiểm chứng' : currentStageMeta.title}
                </span>
              </div>
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
                    }} title="Thầy Socrates (AI Phản Tư)">
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af' }}>
                          Thầy Socrates
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '700', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                          AI Phản Tư
                        </span>
                        {m.stage && (
                          <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
                            • Chặng {Math.min(m.stage, 4)}
                          </span>
                        )}
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
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#475569', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  ✨ Thầy Socrates đang ghi nhận và chuẩn bị câu hỏi phản tư tiếp theo...
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }} className="no-print">
                {errorMessage}
              </div>
            ) : null}

            {/* BẢNG TÓM TẮT PHẢN TƯ VÀ NỘI DUNG CẦN KIỂM CHỨNG (MỤC 4 & MỤC 5: CHO PHÉP XEM, CHỈNH SỬA, XÁC NHẬN VÀ PHÂN BIỆT RÕ PHÁT BIỂU HỌC SINH VỚI GỢI Ý AI) */}
            {isReadyForStep3 && summaryDraft ? (
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
                    <span style={{ fontSize: '11px', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '3px 9px', borderRadius: '8px', textTransform: 'uppercase' }}>
                      Tổng kết 4 chặng • Phiên bản {WORKFLOW_VERSION}
                    </span>
                    <h3 style={{ margin: '6px 0 4px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                      📋 Tóm tắt phản tư và nội dung cần kiểm chứng
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                      ℹ️ <strong>Lưu ý:</strong> Các thông tin ở Mục 1–4 là dữ liệu tự báo cáo của em trong cuộc trò chuyện (chưa được xác minh). Em có thể <strong>xem lại, chỉnh sửa hoặc xác nhận</strong> bản tóm tắt này trước khi lưu biên bản và chuyển sang Bước 3.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="no-print">
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
                      {isSummaryConfirmed ? '✓ Đã xác nhận & lưu biên bản' : '✅ Xác nhận & Lưu biên bản'}
                    </button>
                  </div>
                </div>

                {summaryStatusMsg && (
                  <div style={{ marginBottom: '12px', padding: '9px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '12.5px', fontWeight: '600' }}>
                    {summaryStatusMsg}
                  </div>
                )}

                {/* PHẦN A: PHÁT BIỂU TỰ BÁO CÁO CỦA HỌC SINH (MỤC 1 - 4) */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    🧑‍🎓 Phần A — Phát biểu tự báo cáo của học sinh (Chưa được xác minh)
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        1. Lý do lựa chọn do học sinh nêu:
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
                        2. Thông tin và nguồn học sinh đã đề cập:
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
                        3. Sự chuẩn bị do học sinh tự báo cáo:
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
                        4. Những nội dung còn thiếu hoặc chưa được kiểm chứng:
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

                {/* PHẦN B: GỢI Ý CỦA AI CHO BƯỚC 3 & THAM VẤN MENTOR (MỤC 5) */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      🤖 Phần B — Gợi ý của AI: 1–3 câu hỏi cần kiểm tra ở Bước 3 & Loại nguồn phù hợp
                    </span>
                    {isEditingSummary && (summaryDraft.questionsForStep3 || []).length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddQuestionStep3}
                        style={{ fontSize: '11.5px', fontWeight: '700', padding: '4px 9px', borderRadius: '6px', border: '1px solid #93c5fd', background: '#ffffff', color: '#1d4ed8', cursor: 'pointer' }}
                      >
                        + Thêm câu hỏi (tối đa 3)
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {(summaryDraft.questionsForStep3 || []).map((item, idx) => (
                      <div key={item.id || idx} style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '10px 12px' }}>
                        {isEditingSummary ? (
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '12px', color: '#1e40af' }}>Câu hỏi kiểm chứng {idx + 1}:</strong>
                              {(summaryDraft.questionsForStep3 || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestionStep3(idx)}
                                  style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={item.question || ''}
                              onChange={(e) => handleQuestionStep3Change(idx, 'question', e.target.value)}
                              placeholder="Nhập câu hỏi cần kiểm tra ở Bước 3..."
                              style={{ width: '100%', padding: '6px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <input
                              type="text"
                              value={item.suggestedSourceType || ''}
                              onChange={(e) => handleQuestionStep3Change(idx, 'suggestedSourceType', e.target.value)}
                              placeholder="Loại nguồn phù hợp để đối chiếu..."
                              style={{ width: '100%', padding: '6px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#475569' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                              {idx + 1}. {item.question}
                            </div>
                            <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
                              🔎 <strong>Loại nguồn gợi ý đối chiếu:</strong> {item.suggestedSourceType}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Đề xuất tham vấn và kiểm chứng với mentor */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #bfdbfe', fontSize: '12.5px', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      🤝 <strong>Tham vấn và kiểm chứng với mentor:</strong> {summaryDraft.mentorRecommendation}
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: '#ffffff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #93c5fd' }} className="no-print">
                      <input
                        type="checkbox"
                        checked={Boolean(summaryDraft.mentorSupportRequested)}
                        onChange={(e) => handleSummaryFieldChange('mentorSupportRequested', e.target.checked)}
                      />
                      <span>Em muốn đăng ký tham vấn và kiểm chứng thêm với mentor ở Bước 4</span>
                    </label>
                  </div>
                </div>

                {/* CỤM NÚT CHUYỂN SANG BƯỚC 3 (CHO PHÉP CHUYỂN NGAY CẢ KHI HỌC SINH VẪN CÒN NỘI DUNG CHƯA BIẾT / CHƯA ĐỦ CĂN CỨ) */}
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
                      minWidth: '300px',
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
                    <span>XÁC NHẬN TÓM TẮT & TIẾP TỤC SANG BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU</span>
                    <span style={{ fontSize: '18px' }}>➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyText}
                    style={{
                      background: copySuccess ? '#059669' : '#ffffff',
                      color: copySuccess ? '#ffffff' : '#065f46',
                      border: '1.5px solid #a7f3d0',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copySuccess ? '✅ Đã sao chép' : '📋 Sao chép biên bản'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    style={{
                      background: '#ffffff',
                      color: '#334155',
                      border: '1.5px solid #cbd5e1',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Tải .TXT
                  </button>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* THANH NHẬP LIỆU PHẢN TƯ */}
          <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)' }} className="no-print">
            <form
              onSubmit={handleSendMessage}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                ref={inputFieldRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  if (!isLoading && !isReadyForStep3) setInputValue(e.target.value);
                }}
                readOnly={isLoading}
                disabled={isReadyForStep3}
                placeholder={
                  isReadyForStep3
                    ? 'Em đã hoàn thành 4 chặng. Hãy xem, chỉnh sửa hoặc xác nhận bảng tóm tắt ở trên để sang Bước 3.'
                    : isLoading
                    ? 'Thầy Socrates đang ghi nhận câu trả lời của em...'
                    : `Nhập câu trả lời của em cho ${currentStageMeta.shortLabel} (có thể ghi "chưa biết" hoặc "chưa tìm hiểu" nếu em chưa rõ)...`
                }
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: isReadyForStep3 ? '#f1f5f9' : isLoading ? '#f8fafc' : '#ffffff',
                  color: isReadyForStep3 ? '#64748b' : '#0f172a',
                  cursor: isReadyForStep3 ? 'not-allowed' : 'text'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || isReadyForStep3}
                style={{
                  background: isReadyForStep3 ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isLoading || !inputValue.trim() || isReadyForStep3 ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !inputValue.trim() || isReadyForStep3 ? 0.6 : 1
                }}
              >
                GỬI ➔
              </button>
            </form>
          </div>

          {/* MỤC NHẬT KÝ CÁ NHÂN VÒNG 2 (AI KHÔNG VIẾT THAY PHẦN NHẬT KÝ CÁ NHÂN CỦA HỌC SINH) */}
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
