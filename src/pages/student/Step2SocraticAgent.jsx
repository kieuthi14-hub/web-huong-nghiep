import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StepProgressHeader from '../../components/common/StepProgressHeader';
import ReflectionJournalCard from '../../components/reflection/ReflectionJournalCard';
import { resetStepData } from '../../utils/interventionProgress';

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

/**
 * SOCRACAREER - DYNAMIC ADAPTIVE TRIGGER (BƯỚC 2: AI SOCRATES)
 * Thuật toán kích hoạt Vòng 1 linh hoạt dựa trên 4 Thiên lệch nhận thức cốt lõi
 */
export function generateSocraticFirstPrompt(student = {}) {
  // 1. Thu thập các chỉ số mỏ neo thực tế từ Bước 1
  const targetCareer = student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || "ngành nghề mục tiêu";
  const rawSchool = (student.targetSchool || student.targetUniversity || student.target_university || "").trim();
  const schoolClause = rawSchool ? `tại ${rawSchool}` : "";
  const source = student.source || student.reason || ""; // "Mạng xã hội", "Bạn bè/Người thân", "Tự tìm hiểu"
  const anchorReason = student.anchorReason || "";
  let anchorQuote = student.anchorQuote || source || "";
  if (!anchorQuote && (student.id === "CT_21" || student.studentId === "CT_21")) {
    anchorQuote = "Ngành này cực hot trên mạng, lương nghìn đô ngay khi tốt nghiệp.";
  }

  const conf = Number(student.conf_T0 || student.initialConfidence || student.confidence_score) || 5; // Độ tự tin từ 1 - 10
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

  // Mức tự tin rất cao (T0 >= 8/10) khi vừa mới bắt đầu quy trình
  const isHighConfidence = conf >= 8;

  const isConfirmation = 
    anchorReason === "Trái mã RIASEC" || 
    (riasecMatch < 50 && student.compatibility_status && (student.compatibility_status.includes('Mâu thuẫn') || student.compatibility_status.includes('Lệch')));

  // 2. Cây quyết định phản tư thích ứng chuẩn mực sư phạm (KHÔNG BỊA ĐẶT ĐIỂM SỐ HỌC BẠ / ĐIỂM CHUẨN)
  if (isMediaAnchoring) {
    // THIÊN LỆCH 1: MỎ NEO TRUYỀN THÔNG (Anchoring Bias)
    biasType = "MỎ NEO TRUYỀN THÔNG (ANCHORING BIAS)";
    biasRule = "Kích hoạt do học sinh bộc lộ động cơ chọn ngành từ hình ảnh review trên mạng xã hội (TikTok, YouTube) hoặc truyền thông.";
    const quoteText = anchorQuote || "Ngành này cực hot trên mạng, lương nghìn đô ngay khi tốt nghiệp.";
    socraticQuestion = `Chào em. Em vừa chia sẻ rằng chọn ngành ${targetCareer} ${schoolClause} vì "${quoteText}". Theo em, những hình ảnh và clip review đó phản ánh bao nhiêu phần trăm công việc và áp lực thực tế của ngành này?`;

  } else if (isBandwagon) {
    // THIÊN LỆCH 2: TÂM LÝ ĐÁM ĐÔNG (Bandwagon Effect)
    biasType = "TÂM LÝ ĐÁM ĐÔNG (BANDWAGON EFFECT)";
    biasRule = "Kích hoạt do học sinh chọn ngành theo xu thế đám đông, bạn bè xung quanh cùng rủ chọn hoặc nghe theo lời khuyên ngoại tại.";
    socraticQuestion = `Chào em. Em cho biết chọn ngành ${targetCareer} ${schoolClause} vì thấy nhiều bạn bè cũng đang đăng ký. Nếu các bạn đổi hướng sang ngành khác, lý do thực chất nào giữ chân em tiếp tục theo đuổi ngành này?`;

  } else if (isHighConfidence) {
    // THIÊN LỆCH 3: TỰ TIN THÁI QUÁ (Overconfidence Bias) - PHẢN TƯ THỰC CHẤT, KHÔNG DÙNG ĐIỂM GIẢ LẬP
    biasType = "TỰ TIN THÁI QUÁ (OVERCONFIDENCE BIAS)";
    biasRule = `Kích hoạt do mức tự tin ban đầu rất cao (${conf}/10) khi chưa đối chứng dữ liệu tuyển sinh thực tế.`;
    socraticQuestion = `Chào em. Thầy thấy em đang đặt mức tự tin tới ${conf}/10 vào lựa chọn ngành ${targetCareer} ${schoolClause}. Căn cứ hoặc trải nghiệm thực tế nào của bản thân giúp em tin chắc vào sự phù hợp của mình với ngành này trước khi đối chứng dữ liệu?`;

  } else if (isConfirmation) {
    // THIÊN LỆCH 4: THIÊN LỆCH XÁC NHẬN (Confirmation Bias)
    biasType = "THIÊN LỆCH XÁC NHẬN (CONFIRMATION BIAS)";
    biasRule = `Kích hoạt do độ tương thích RIASEC thấp, sở trường tự nhiên nhóm [${student.riasecCode || "Xã hội"}] chưa khớp với đặc thù khắt khe của ngành mục tiêu.`;
    socraticQuestion = `Chào em. Kết quả trắc nghiệm RIASEC chỉ ra thế mạnh tự nhiên của em thuộc nhóm ${student.riasecCode || "Xã hội"}, nhưng ngành ${targetCareer} lại đòi hỏi đặc tính khác. Em đã chủ động tìm hiểu những rào cản khi làm việc trái với sở trường tự nhiên chưa, hay em chỉ đang chú ý đến những khía cạnh tích cực của nó?`;

  } else {
    // TRƯỜNG HỢP MẶC ĐỊNH / NHÓM THỰC CHẤT
    biasType = "TRUY VẤN NỀN TẢNG THỰC CHẤT";
    biasRule = "Học sinh có động cơ nội tại hài hòa; thực hiện truy vấn cơ sở thực tế và dữ liệu khách quan quan trọng nhất dẫn dắt mục tiêu.";
    socraticQuestion = `Chào em. Em đã xác định mục tiêu là ngành ${targetCareer} ${schoolClause} với mức tự tin ban đầu là ${conf}/10. Em hãy chia sẻ lý do cốt lõi và trải nghiệm thực tế quan trọng nhất đã dẫn dắt em lựa chọn mục tiêu này?`;
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

// QUY TẮC 4: PHÂN LOẠI HÀNH VI (OUTCOME_CATEGORY) CHUẨN KHKT SOCRACAREER
export function evaluateOutcomeCategory(history = [], initialProfile = null, lastUserText = '', goalShift = null) {
  const initCareer = (initialProfile?.targetMajor || initialProfile?.target_career || '').toLowerCase().trim();
  const userMessages = history.filter(m => m.role === 'user').map(m => m.text);
  const allUserText = `${userMessages.join(' ')} ${lastUserText || ''}`.toLowerCase();
  
  // 1. Kiểm tra Turning Point rõ ràng theo đúng tiêu chuẩn đề tài:
  // "CHỈ set thành True nếu học sinh RÕ RÀNG thừa nhận: 'Em nhận ra mình chưa tìm hiểu kỹ', 'Em thấy mức lương đó chưa thực tế', hoặc 'Em lo môn Toán của em không đủ kéo điểm'. Nếu học sinh né tránh/đùa, BẮT BUỘC là False."
  const clearTurningPointPatterns = [
    'chưa tìm hiểu kỹ', 'chua tim hieu ky', 'chưa tìm hiểu sâu',
    'chưa thực tế', 'chua thuc te', 'chưa hợp lý', 'chưa đúng',
    'em nhận ra', 'nghĩ lại thì', 'thầy nói đúng',
    'không đủ kéo điểm', 'không kéo nổi điểm', 'kéo điểm không nổi',
    'lo môn', 'sợ môn', 'đuối môn', 'kém môn', 'mất gốc môn',
    'chưa tự tin môn', 'rủi ro', 'áp lực lớn'
  ];

  const avoidantOrJokingPatterns = [
    'thấy thầy là em lo', 'thay thay la em lo', 'thầy hỏi khó', 'hỏi khó quá',
    'gắt quá', 'căng quá', 'đùa thôi', 'đùa tí', 'nói chơi thôi', 'thôi thầy', 'bó tay'
  ];

  const hasClearAdmission = clearTurningPointPatterns.some(p => allUserText.includes(p));
  const hasAvoidance = avoidantOrJokingPatterns.some(p => allUserText.includes(p));

  // 2. Phân loại Outcome_Category:
  // - "Reconsidering": Học sinh chủ động muốn xem xét lại ngành khác.
  const reconsideringPatterns = [
    'đổi sang', 'chuyển sang', 'xem xét lại', 'cân nhắc ngành khác', 'chọn ngành khác',
    'đổi nguyện vọng', 'nghĩ lại chắc chọn', 'không học ngành này nữa'
  ];
  const isGoalShiftTurn = Boolean(goalShift && goalShift.newMajor && goalShift.newMajor.toLowerCase() !== initCareer);
  const hasReconsidering = isGoalShiftTurn || reconsideringPatterns.some(p => allUserText.includes(p));

  // - "Persistent_Calibrated": Học sinh giữ mục tiêu nhưng đã nhận thức rõ rào cản và nêu được giải pháp thực tế.
  const realisticPlanPatterns = [
    'kế hoạch', 'ôn tập', 'học thêm', 'cày thêm', 'luyện đề', 'khởi điểm',
    'học việc', 'thực tập', 'cố gắng kéo điểm', 'rèn luyện', 'học bạ', 'tập trung'
  ];
  const hasRealisticPlan = realisticPlanPatterns.some(p => allUserText.includes(p));

  // - "Uncalibrated_Avoidant": Học sinh vẫn giữ tự tin ảo, né tránh câu hỏi, không đưa ra được căn cứ.
  const uncalibratedPatterns = [
    'không sao đâu', 'chắc chắn làm được', 'dễ mà', 'kệ', 'mặc kệ', 'thầy cứ lo xa',
    'chẳng cần', 'không cần học', 'vẫn thích', 'tiền nhiều là được'
  ];
  const hasUncalibrated = hasAvoidance || uncalibratedPatterns.some(p => allUserText.includes(p));

  let category = 'Persistent_Calibrated';
  let rule = '';

  if (hasReconsidering) {
    category = 'Reconsidering';
    rule = 'Học sinh chủ động muốn xem xét lại ngành khác sau khi nhận ra rào cản hoặc sự không phù hợp.';
  } else if (hasUncalibrated || (!hasClearAdmission && !hasRealisticPlan && userMessages.length <= 2)) {
    category = 'Uncalibrated_Avoidant';
    rule = 'Học sinh vẫn giữ tự tin ảo, né tránh câu hỏi hoặc không đưa ra được căn cứ thực tế.';
  } else {
    category = 'Persistent_Calibrated';
    rule = 'Học sinh giữ mục tiêu nhưng đã nhận thức rõ rào cản và nêu được giải pháp thực tế.';
  }

  return {
    category,
    rule,
    hasClearAdmission: hasClearAdmission && !hasAvoidance
  };
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

// BỘ LỌC PHẢN XẠ TỰ NHIÊN TRƯỚC KHI CHẠY MÁY TRẠNG THÁI (NATURAL REFLEX FILTER)
export function processStudentMessage(message, chatStage, studentProfile) {
  const lowerMsg = (message || '').toLowerCase().trim();
  const cleanGreeting = lowerMsg.replace(/[!.,?~]/g, '');

  const targetMajor = studentProfile?.target_career || studentProfile?.targetMajor || '';
  const targetUniv = studentProfile?.target_university || studentProfile?.targetSchool || '';
  const confidence = studentProfile?.confidence_score || studentProfile?.confidence || '5';
  const hollandCode = studentProfile?.holland_code || studentProfile?.hollandCode || 'AEI';
  const isBranchB = isUndecidedOrVague(targetMajor);

  // 1.1. Nếu học sinh thắc mắc kỹ thuật / câu hỏi lặp lại / không hiểu câu hỏi
  const isConfusion = [
    'là sao', 'sao vậy', 'sao thế', 'sao the', 'ý thầy là sao', 'y thay la sao',
    'em chưa hiểu', 'chưa hiểu', 'không hiểu', 'thầy nói gì', 'thầy nói thế là sao',
    'hỏi lại', 'sao hỏi lại', 'hỏi gì kỳ', 'hỏi gì kì', 'trùng câu hỏi', 'vừa hỏi xong'
  ].some(k => lowerMsg.includes(k));

  if (isConfusion && lowerMsg.split(/\s+/).length <= 10) {
    return {
      advanceRound: false,
      reply: `Thầy đặt câu hỏi để buộc em phải tự đối diện với động lực và năng lực thực tế của mình trước khi ra quyết định. Em hãy trả lời thẳng vào câu hỏi của thầy ở trên.`
    };
  }

  // 1.1b. Xử lý các tình huống học sinh né tránh hoặc bông đùa (theo quy chuẩn đề tài):
  const isEvasiveOrJoking = (() => {
    const ePatterns = [
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
    return ePatterns.some(p => p.test(lowerMsg)) && lowerMsg.split(/\s+/).length <= 12;
  })();

  if (isEvasiveOrJoking) {
    return {
      advanceRound: false,
      reply: `Thầy chỉ là công cụ đặt câu hỏi giúp em soi chiếu lại mục tiêu. Nếu đối diện với câu hỏi này khiến em lo lắng, thì áp lực thi cử và chọn nghề sắp tới sẽ còn thực tế hơn rất nhiều. Em hãy trả lời thẳng thắn vào trọng tâm câu hỏi của thầy ở trên.`
    };
  }

  // 1.2. Nếu học sinh chỉ chào hỏi xã giao: Chào lại ngắn gọn và nhắc nhở, KHÔNG tăng vòng!
  const isPureGreeting = (() => {
    const gPatterns = [
      /^(chào|xin chào|chao|hello|hi|alo|hé lô)\b/i,
      /^(dạ\s+|da\s+)?(em\s+)?(chào|xin chào|chao|kính chào)\b/i,
      /^(dạ|da|vâng|dạ vâng|thưa thầy|thầy ơi|thay oi)$/i
    ];
    if (gPatterns.some(p => p.test(lowerMsg)) && lowerMsg.split(/\s+/).length <= 6) {
      const substantiveWords = ['thích', 'vì', 'sư phạm', 'ngành', 'môn', 'tổ hợp', 'trường', 'đam mê', 'học', 'điểm', 'thi', 'xét', 'nghề', 'lương', 'việc', 'tiền', 'dạy thêm', 'sợ', 'dốt', 'kém', 'đều'];
      if (!substantiveWords.some(w => lowerMsg.includes(w))) {
        return true;
      }
    }
    return false;
  })();

  if (isPureGreeting) {
    return {
      advanceRound: false, // KHÔNG nhảy vòng
      reply: `Chào em. Em hãy tập trung trả lời câu hỏi phản tư của thầy ở trên để chúng ta tiếp tục.`
    };
  }

  // 1.3. BÓC TÁCH ÁP LỰC GIA ĐÌNH / CÂU TRẢ LỜI NGẮN DO DỰ (KHÔNG NHẢY VÒNG, HỎI SÂU XUNG ĐỘT TÂM LÝ)
  const familyKeywords = ['bố mẹ', 'ba mẹ', 'cha mẹ', 'gia đình', 'phụ huynh', 'kỳ vọng', 'bắt ép', 'ép', 'áp lực', 'bảo thi', 'bảo học', 'muốn em học', 'muốn em thi', 'định hướng'];
  const hesitationKeywords = ['không chắc', 'không biết', 'chưa chắc', 'chưa rõ', 'phân vân', 'áp lực', 'lo', 'sợ', 'ép buộc', 'tùy'];
  const hasFamily = familyKeywords.some(k => lowerMsg.includes(k));
  const hasHesitation = hesitationKeywords.some(k => lowerMsg.includes(k));
  const wordCount = lowerMsg.split(/\s+/).filter(Boolean).length;

  if (hasFamily && (hasHesitation || wordCount <= 8)) {
    return {
      advanceRound: false, // KHÔNG tăng vòng khi học sinh đang bộc lộ mâu thuẫn ngoại tại
      reply: `Khi sự lựa chọn này phần lớn đến từ kỳ vọng của ba mẹ mà bản thân em chưa thực sự chắc chắn, em có nghĩ rằng mình đang gánh ước mơ của người khác thay vì tương lai của chính mình không?`
    };
  }

  // 1.4. Tiếp tục đối thoại với AI Cognitive Agent theo BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES
  return { advanceRound: true };
}

export function isCounterArguing(text) {
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

export function hasDeclaredSubjectsOrGrades(text) {
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

export function extractSubjectsFeedback(text) {
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

  // 3c. QUY TẮC PHÁT NGÔN CHUẨN SOCRACAREER (ANTI-ROBOTIC & ANTI-SYCOPHANCY):
  // KHÔNG bắt đầu bằng: "Thầy hiểu...", "Thầy đồng cảm...", "Thầy thấy rằng..."
  // Tuyệt đối không khen ngợi: "Ước mơ của em thật tuyệt vời", "Em rất có tiềm năng"
  cleaned = cleaned
    .replace(/^Thầy\s+(?:rất\s+)?(?:hiểu|thấu hiểu|đồng cảm|thấy rằng)[^.!?\n]*[.!?]\s*/gi, '')
    .replace(/Ước mơ của em (?:thật|rất) tuyệt vời[^.!?\n]*[.!?]?/gi, '')
    .replace(/Em rất có tiềm năng[^.!?\n]*[.!?]?/gi, '')
    .replace(/(?:tình cảm|ước mơ|tấm lòng)(?: này)? rất đáng (?:quý|trân trọng)[^.!?\n]*[.!?]?/gi, '')
    .trim();

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
      if (isVocational && !isUniClarification) {
        if (round === 1) {
          cleaned += ` Thầy hiểu học nghề là lựa chọn thực tế và có lộ trình việc làm rõ ràng. Khi tìm hiểu công việc thực tế hàng ngày của nghề này, em thấy đặc thù công việc có thực sự phù hợp với tính cách và năng lực hành động của em không?`;
        } else if (round === 2) {
          cleaned += ` Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (đứng nhiều giờ, ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?`;
        } else if (round === 3) {
          cleaned += ` Học nghề vẫn đòi hỏi điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ để vào các trường nghề uy tín. Nhìn lại sức học hiện tại, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm vé tốt nghiệp này?`;
        }
      } else {
        if (round === 1) {
          cleaned += ` Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
        } else if (round === 2) {
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

export default function Step2SocraticAgent() {
  const [chatStage, setChatStage] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChatFinished, setIsChatFinished] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionTelemetry, setSessionTelemetry] = useState(() => {
    try {
      const raw = localStorage.getItem('cbas_step2_telemetry');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  });
  const [activeBiasType, setActiveBiasType] = useState(() => {
    try {
      return localStorage.getItem('cbas_step2_primary_bias') || '';
    } catch (e) {
      return '';
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
  const isReadyForStep3 = chatStage === 4 && (isCompleted || isChatFinished);
  const messagesEndRef = useRef(null);
  const step3CtaRef = useRef(null);
  const lastAiMsgRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isReadyForStep3) {
        step3CtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, isLoading, chatStage, isCompleted, isChatFinished, isReadyForStep3]);

  // 1. KHỞI TẠO CONTEXT TỪ BƯỚC 1 VÀ PHÂN LUỒNG NHÁNH A / NHÁNH B
  useEffect(() => {
    // Tự động quét sạch triệt để bộ nhớ đệm nếu dính câu hỏi giả định điểm số cũ (25 điểm, 27.5 điểm)
    try {
      const rawMsgs = localStorage.getItem("cbas_step2_messages");
      if (rawMsgs && (rawMsgs.includes('27.5') || rawMsgs.includes('25 điểm') || rawMsgs.includes('khoảng cách khá xa') || rawMsgs.includes('bù đắp được khoảng cách'))) {
        localStorage.removeItem("cbas_step2_messages");
        localStorage.removeItem("cbas_step2_round");
        localStorage.removeItem("cbas_step2_completed");
        localStorage.removeItem("cbas_step2_telemetry");
      }
    } catch (e) {}

    let userProfile = null;
    try {
      const rawProf = localStorage.getItem("cbas_user_profile");
      if (rawProf) userProfile = JSON.parse(rawProf);
    } catch (e) {}

    let anchor = null;
    try {
      const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
      if (rawAnchor) anchor = JSON.parse(rawAnchor);
    } catch (e) {}

    const rawMajor = (userProfile?.targetMajor || anchor?.target_career || anchor?.target_major || anchor?.targetMajor || "").trim();
    const hasStep1Data = Boolean(rawMajor || userProfile?.hollandCode || anchor?.holland_code);

    // NẾU HỌC SINH CHƯA LÀM HOẶC VỪA BẤM LÀM LẠI BƯỚC 1: KHÔNG TỰ BỊA ĐẶT DỮ LIỆU CŨ ("Sư phạm")
    if (!hasStep1Data) {
      setIsMissingStep1(true);
      setMessages([]);
      try {
        localStorage.removeItem("cbas_step2_messages");
        localStorage.removeItem("cbas_step2_round");
        localStorage.removeItem("cbas_step2_completed");
        localStorage.removeItem("cbas_step2_telemetry");
        localStorage.removeItem("cbas_step2_anchor_fingerprint");
      } catch (e) {}
      return;
    }
    setIsMissingStep1(false);

    const hollandCode = userProfile?.hollandCode || anchor?.holland_code || anchor?.hollandCode || "AEI";
    const targetMajor = rawMajor;
    const targetSchool = (userProfile?.targetSchool || anchor?.target_university || anchor?.targetSchool || "").trim();
    const reason = (userProfile?.reason || anchor?.source_of_influence || anchor?.reason || anchor?.choice_source || "").trim();
    const initialConfidence = userProfile?.initialConfidence ?? (anchor?.confidence_score ? Number(anchor.confidence_score) : 5);
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || "";

    // Thu thập các chỉ số học bạ và điểm chuẩn (nếu có từ phiên trước, không tự bịa đặt)
    let gpa_A00 = null;
    let benchmark_target = null;
    try {
      const triageRaw = localStorage.getItem('cbas_step3_triage');
      if (triageRaw) {
        const t = JSON.parse(triageRaw);
        if (t.totalStudentScore && !isNaN(Number(t.totalStudentScore))) gpa_A00 = Number(t.totalStudentScore);
        if (t.avgCutoff && !isNaN(Number(t.avgCutoff))) benchmark_target = Number(t.avgCutoff);
      }
      if (userProfile?.gpa && !isNaN(Number(userProfile.gpa))) gpa_A00 = Number(userProfile.gpa);
      if (anchor?.gpa && !isNaN(Number(anchor.gpa))) gpa_A00 = Number(anchor.gpa);
      if (userProfile?.benchmark && !isNaN(Number(userProfile.benchmark))) benchmark_target = Number(userProfile.benchmark);
      if (anchor?.benchmark && !isNaN(Number(anchor.benchmark))) benchmark_target = Number(anchor.benchmark);
    } catch (e) {}

    // Xác định nhóm RIASEC và % tương thích nghề
    const codeStr = String(hollandCode || 'AEI').toUpperCase();
    const primaryChar = codeStr[0] || 'S';
    const nameMap = {
      'R': 'Kỹ thuật / Thực tế',
      'I': 'Nghiên cứu / Phân tích',
      'A': 'Nghệ thuật / Sáng tạo',
      'S': 'Xã hội / Hỗ trợ con người',
      'E': 'Quản lý / Kinh doanh',
      'C': 'Nghiệp vụ / Quy trình'
    };
    const riasecGroupName = nameMap[primaryChar] || 'Xã hội';

    let riasecMatchPct = 40;
    if (anchor?.riasec_match_pct && !isNaN(Number(anchor.riasec_match_pct))) {
      riasecMatchPct = Number(anchor.riasec_match_pct);
    } else if (anchor?.compatibility_status) {
      if (anchor.compatibility_status.includes('Tương thích cao')) riasecMatchPct = 85;
      else if (anchor.compatibility_status.includes('Mâu thuẫn') || anchor.compatibility_status.includes('Lệch')) riasecMatchPct = 35;
      else riasecMatchPct = 50;
    } else {
      const cNorm = removeVietnameseTones(targetMajor);
      const techCareers = ['ky thuat', 'dien lanh', 'co khi', 'it', 'phan mem', 'oto', 'lap trinh', 'xay dung'];
      const isTech = techCareers.some(k => cNorm.includes(k));
      if (isTech) {
        if (primaryChar === 'S' || primaryChar === 'A') riasecMatchPct = 35;
        else if (primaryChar === 'R' || primaryChar === 'I') riasecMatchPct = 85;
        else riasecMatchPct = 45;
      }
    }

    const studentName = userProfile?.name || anchor?.student_name || '';
    const anchorReason = userProfile?.anchorReason || anchor?.anchorReason || '';
    const anchorQuote = userProfile?.anchorQuote || anchor?.anchorQuote || reason || '';

    const studentObj = {
      id: localStorage.getItem('cbas_student_id') || '',
      name: studentName,
      baselineTarget: targetMajor,
      targetCareer: targetMajor,
      targetSchool: targetSchool,
      source: reason,
      anchorReason,
      anchorQuote,
      conf_T0: initialConfidence,
      gpa_A00: gpa_A00,
      benchmark_target: benchmark_target,
      riasec_match_pct: riasecMatchPct,
      riasecCode: riasecGroupName
    };

    const promptTrigger = generateSocraticFirstPrompt(studentObj);
    setActiveBiasType(promptTrigger.biasType);
    setActiveBiasRule(promptTrigger.biasRule);
    try {
      localStorage.setItem('cbas_step2_primary_bias', promptTrigger.biasType);
      localStorage.setItem('cbas_step2_bias_rule', promptTrigger.biasRule);
    } catch (e) {}

    const resolvedProfile = {
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
      gpa_A00,
      benchmark_target,
      riasec_match_pct: riasecMatchPct,
      riasecCode: riasecGroupName,
      studentId: localStorage.getItem('cbas_student_id') || '',
      // Tương thích ngược:
      target_career: targetMajor,
      target_university: targetSchool,
      confidence_score: String(initialConfidence),
      holland_code: hollandCode,
      expected_income: expectedIncome
    };
    setStudentProfile(resolvedProfile);

    // KIỂM TRA FINGERPRINT ĐỂ PHÁT HIỆN SỰ THAY ĐỔI MỎ NEO TỪ BƯỚC 1
    const currentFingerprint = `${targetMajor}|${targetSchool}|${reason}|${hollandCode}`.toLowerCase().trim();
    const savedFingerprint = localStorage.getItem("cbas_step2_anchor_fingerprint");

    let savedMessages = null;
    let savedCompleted = false;

    if (savedFingerprint && savedFingerprint !== currentFingerprint) {
      // Khi học sinh đã thay đổi ngành hoặc lý do ở Bước 1, xóa toàn bộ hội thoại cũ
      try {
        localStorage.removeItem("cbas_step2_messages");
        localStorage.removeItem("cbas_step2_round");
        localStorage.removeItem("cbas_step2_completed");
        localStorage.removeItem("cbas_step2_telemetry");
        localStorage.removeItem("cbas_step2_reflection");
      } catch (e) {}
    } else {
      try {
        const rawMsgs = localStorage.getItem("cbas_step2_messages");
        if (rawMsgs) savedMessages = JSON.parse(rawMsgs);
        savedCompleted = localStorage.getItem("cbas_step2_completed") === "true";
      } catch (e) {}
    }

    try {
      localStorage.setItem("cbas_step2_anchor_fingerprint", currentFingerprint);
    } catch (e) {}

    const isBranchB = isUndecidedOrVague(targetMajor);

    // LỜI CHÀO & CÂU HỎI MỞ ĐẦU CHUẨN THUẬT TOÁN KÍCH HOẠT LINH HOẠT SOCRACAREER:
    let initialGreeting = '';
    if (isBranchB) {
      // NHÁNH B: HỌC SINH MƠ HỒ, CHƯA CÓ MỤC TIÊU CỤ THỂ (ÁP DỤNG REFRAMING ĐỒNG CẢM)
      initialGreeting = `Chào em. Thầy hiểu ở thời điểm này, việc chưa chọn được một ngành cụ thể là tâm lý rất bình thường của nhiều học sinh lớp 12. Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?`;
      setActiveBiasType("ĐỊNH HƯỚNG MỤC TIÊU (CHƯA XÁC ĐỊNH NGÀNH)");
      setActiveBiasRule("Học sinh chưa xác định được ngành nghề cụ thể; kích hoạt phản tư làm rõ sở thích và năng lực.");
    } else {
      // DYNAMIC ADAPTIVE TRIGGER DỰA TRÊN 4 THIÊN LỆCH NHẬN THỨC CỐT LÕI
      initialGreeting = promptTrigger.firstQuestion;
    }

    if (Array.isArray(savedMessages) && savedMessages.length > 0) {
      const sanitizedSaved = savedMessages.map((m, idx) => {
        let textVal = m.text || '';
        // Tự động chữa lành triệt để nếu tin nhắn cũ bị lưu dính số liệu bịa đặt (25 điểm, 27.5 điểm, -2.5 điểm)
        if (m.role === 'model' && idx === 0 && (textVal.includes('25 điểm') || textVal.includes('27.5 điểm') || textVal.includes('-2.5 điểm') || textVal.includes('bù đắp được khoảng cách này'))) {
          textVal = initialGreeting;
        }

        if (m.role === 'model' && textVal && /thực\s*chiến/i.test(textVal)) {
          textVal = textVal
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
        }
        return {
          ...m,
          text: textVal
        };
      });
      setMessages(sanitizedSaved);
      try { localStorage.setItem("cbas_step2_messages", JSON.stringify(sanitizedSaved)); } catch (e) {}
      const userMsgCount = savedMessages.filter(m => m.role === 'user').length;
      const lastMsg = savedMessages[savedMessages.length - 1];
      const hasStep3InLast = Boolean(lastMsg?.role === 'model' && lastMsg?.text && (
        lastMsg.text.includes("chuyển sang Bước 3") || 
        lastMsg.text.includes("chuyển sang bước 3") || 
        lastMsg.text.includes("Bước 3") || 
        lastMsg.text.includes("bước 3")
      ));
      if (userMsgCount >= 3 && (savedCompleted || hasStep3InLast)) {
        setIsCompleted(true);
        setIsChatFinished(true);
        setChatStage(4);
      } else {
        const resolvedStage = Math.min(userMsgCount + 1, 4);
        setChatStage(resolvedStage);
        setIsCompleted(false);
        setIsChatFinished(false);
      }
    } else {
      const initMsg = [{
        role: 'model',
        text: initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        biasType: promptTrigger?.biasType || (isBranchB ? "ĐỊNH HƯỚNG MỤC TIÊU (CHƯA XÁC ĐỊNH NGÀNH)" : "")
      }];
      setMessages(initMsg);
      try { localStorage.setItem("cbas_step2_messages", JSON.stringify(initMsg)); } catch (e) {}
      setChatStage(1);
      setIsCompleted(false);
      setIsChatFinished(false);
    }
  }, []);

  // CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN KHKT - SOCRACAREER (SOCRATIC PERSONA)
  const SOCRATIC_PERSONA = `
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

# LỘ TRÌNH 4 GIAI ĐOẠN TRUY VẤN TỰ NHIÊN (4 PHIÊN HỘI THOẠI)
- Giai đoạn 1 (Chất vấn Mỏ neo & Đám đông): Dựa vào lý do ban đầu của học sinh để bóc tách. Nếu học sinh nói "thích vì được đi nhiều nơi" hoặc "xem mạng xã hội", hãy hỏi về mặt trái, cường độ lao động hoặc trách nhiệm thực tế mà học sinh chưa từng nghĩ tới.
- Giai đoạn 2 (Chất vấn Kỳ vọng thu nhập): So sánh mức lương kỳ vọng học sinh khai với năng lực khởi điểm thực tế của một cử nhân mới ra trường. Hỏi xem học sinh có bằng chứng hay kỹ năng vượt trội nào để nhà tuyển dụng trả mức lương đó.
- Giai đoạn 3 (Chất vấn Sức học & Tổ hợp môn): Hỏi học sinh về môn học trong tổ hợp mà em cảm thấy lo lắng nhất, và kế hoạch học tập thực tế để vượt qua rào cản đó.
- Giai đoạn 4 (Chuyển tiếp phản tư sang Bước 3): Tóm tắt lại lỗ hổng lập luận lớn nhất mà học sinh vừa bộc lộ, và mời học sinh bước sang Bước 3 để tự tay tra cứu số liệu đề án tuyển sinh thực tế.

# XỬ LÝ CÁC TÌNH HUỐNG HỌC SINH NÉ TRÁNH HOẶC BÔNG ĐÙA
- Nếu học sinh trả lời cộc lốc, né tránh hoặc trêu đùa (ví dụ: "Em thấy thầy là em lo", "Thầy hỏi khó quá"):
  -> Tuyệt đối không tính là chuyển biến nhận thức (Turning Point). 
  -> Hãy đáp lại điềm tĩnh, kéo học sinh về thực tế: "Thầy chỉ là công cụ đặt câu hỏi giúp em soi chiếu lại mục tiêu. Nếu đối diện với câu hỏi này khiến em lo lắng, thì áp lực thi cử và chọn nghề sắp tới sẽ còn thực tế hơn rất nhiều. Hãy trả lời thẳng thắn: [Lặp lại câu hỏi trọng tâm]?"
`;

  const generatePromptForRound = (round, profile, userText, specialInstruction = null) => {
    const career = profile?.targetMajor || profile?.target_career || "ngành đã chọn";
    const rawSchool = profile?.targetSchool || profile?.target_university || "";
    const score = profile?.initialConfidence ?? profile?.confidence_score ?? "5";
    const holland = profile?.hollandCode || profile?.holland_code || "RIASEC";
    const reason = profile?.reason || profile?.source_of_influence || "Em thích từ nhỏ";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    // Nhận diện chuyển biến mục tiêu / thắc mắc ngành mới từ tin nhắn học sinh
    const goalShift = detectGoalShift(userText);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== career.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : (profile?.shiftedMajor || career);
    const isVocational = isVocationalTrack(effectiveCareer, userText, rawSchool);
    const uni = formatSchoolName(rawSchool, isVocational);
    const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
    const askingCombo = isAskingAboutSubjectsOrCombos(userText);
    const lowerUser = (userText || '').toLowerCase();
    const careerLower = (effectiveCareer || '').toLowerCase();
    const recommendedCombo = getRecommendedComboForMajor(effectiveCareer, userText);
    const isUniClarification = hasUniversityClarification(userText);

    const isFamilyOrAltruistic = ['ba mẹ', 'bố mẹ', 'cha mẹ', 'gia đình', 'chữa bệnh', 'từ nhỏ', 'từ bé', 'ước mơ từ nhỏ', 'thích từ nhỏ', 'giúp đỡ', 'cứu người', 'yêu trẻ', 'người thân', 'ông bà', 'hiếu thảo'].some(k => lowerUser.includes(k));
    const isMedicalCareer = ['bác sĩ', 'y khoa', 'y đa khoa', 'y dược', 'y tế', 'điều dưỡng', 'dược', 'dược học', 'nha khoa', 'răng hàm mặt'].some(k => careerLower.includes(k) || lowerUser.includes(k));
    const isVagueOrUncertain = ['không rõ', 'chưa rõ', 'không biết', 'chưa biết', 'chưa tìm hiểu', 'nghĩ vậy', 'cảm thấy', 'tùy'].some(k => lowerUser.includes(k));
    const isSalaryFocused = ['tiền', 'lương', 'thu nhập', 'giàu', 'kiếm tiền', 'kinh tế', 'triệu', 'ổn định'].some(k => lowerUser.includes(k));

    let adaptiveDirective = '';
    if (isUniClarification) {
      adaptiveDirective = `\n\n[CHỈ DẪN KHI HỌC SINH ĐÍNH CHÍNH HỌC ĐẠI HỌC CHỨ KHÔNG HỌC NGHỀ]:\n` +
        `- Học sinh vừa khẳng định rõ: Em chọn học Đại học (tại ${uni}) chứ không học trường nghề.\n` +
        `- Thầy Socrates PHẢI GHI NHẬN NGAY sự đính chính này một cách điềm đạm và tích cực: Ghi nhận em đang hướng tới bậc Đại học chính quy tại ${uni}.\n` +
        `- Nhắc nhở rằng ở bậc Đại học, yêu cầu sẽ thiên về nền tảng kiến thức kỹ thuật chuyên sâu và điểm chuẩn cạnh tranh theo tổ hợp môn thi THPT.\n` +
        `- Ở Lượt 3: Hỏi về môn tự tin nhất và môn lo lắng nhất trong tổ hợp môn xét tuyển học bạ/thi THPT.\n` +
        `- Ở Lượt 4: RA LỆNH học sinh tự sang Bước 3 chọn tổ hợp có lợi nhất từ học bạ để đối chứng điểm chuẩn của ${uni}.\n` +
        `- TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại "Học nghề là một hướng đi thực tế...", không nhắc đến cổng trường nghề hay rèn luyện thể lực của học nghề.\n`;
    } else if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị') || lowerUser.includes('tin học')) {
      adaptiveDirective = `\n\n[CHỈ DẪN KHI HỌC SINH ĐỔI Ý / NÊU NGÀNH MỚI HOẶC HỎI TỔ HỢP]:\n` +
        `- Ngành học sinh đang hướng tới: "${effectiveCareer}".\n` +
        `- AI CHỈ ĐẶT CÂU HỎI, TUYỆT ĐỐI KHÔNG GIẢNG BÀI hay khẳng định cơ chế điểm chuẩn thay học sinh.\n` +
        `- Ở Lượt 3: Hỏi về môn tự tin nhất và môn lo lắng nhất từ học bạ thực tế.\n` +
        `- Ở Lượt 4: RA LỆNH học sinh tự sang Bước 3 chọn tổ hợp có lợi nhất từ học bạ để đối chứng điểm chuẩn của ${uni}.\n`;
    }

    const specialDirective = specialInstruction ? `\n\nCHỈ DẪN KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

    if (round === 1) {
      if (isBranchB) {
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (NHÁNH B: ĐỊNH HƯỚNG MỤC TIÊU CHO HỌC SINH MƠ HỒ / CHƯA CÓ NGÀNH CỤ THỂ):
- Học sinh chưa chọn được ngành nghề cụ thể hoặc đang phân vân, mơ hồ.
- Thầy Socrates áp dụng kỹ thuật Re-framing đồng cảm trước, không phán xét.

[NHIỆM VỤ LƯỢT 1]:
1. Đồng cảm: Chào em và khẳng định việc chưa chọn được ngành ở lớp 12 là điều tự nhiên.
2. ĐẶT DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Chào em. Thầy hiểu ở thời điểm này, việc chưa chọn được một ngành cụ thể là tâm lý rất bình thường của nhiều học sinh lớp 12. Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG phán xét hay chê trách sự mơ hồ của học sinh.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;
      }

      const studentObj = {
        id: profile?.studentId || profile?.id || localStorage.getItem('cbas_student_id') || '',
        name: profile?.studentName || profile?.name || userProfile?.name || 'em',
        baselineTarget: effectiveCareer,
        targetCareer: effectiveCareer,
        targetSchool: uni,
        source: reason,
        anchorReason: profile?.anchorReason || '',
        anchorQuote: profile?.anchorQuote || reason || '',
        conf_T0: score,
        gpa_A00: profile?.gpa_A00 || null,
        benchmark_target: profile?.benchmark_target || null,
        riasec_match_pct: profile?.riasec_match_pct ?? 40,
        riasecCode: profile?.riasecCode || holland || 'Xã hội'
      };
      const promptTrigger = generateSocraticFirstPrompt(studentObj);

      return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (THIÊN LỆCH NHẬN THỨC KÍCH HOẠT: ${promptTrigger.biasType}):
- Quy tắc kích hoạt: ${promptTrigger.biasRule}
- Ngành mục tiêu: ${effectiveCareer}
- Cơ sở đào tạo mục tiêu: ${uni}
- Mức tự tin ban đầu (T0): ${score}/10
- Lý do chọn / Mỏ neo ban đầu: "${reason}"
- Thiên hướng RIASEC: ${holland}

[NHIỆM VỤ LƯỢT 1 - KÍCH HOẠT PHẢN TƯ THÍCH ỨNG THEO ĐÚNG THIÊN LỆCH]:
1. Bắt đầu bằng lời chào điềm đạm, trung tính:
"${promptTrigger.botGreeting}"
2. ĐẶT ĐÚNG CÂU HỎI TRUY VẤN MỎ NEO CỐT LÕI ĐÃ ĐƯỢC THIẾT KẾ:
"${promptTrigger.firstQuestion}"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà, không phán xét hay chụp mũ học sinh.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay bảo học sinh sang Bước 3 ở Lượt 1.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;
    }

    if (!isBranchB) {
      if (isVocational) {
        // =========================================================================
        // KỊCH BẢN PHÂN HÓA HỌC NGHỀ / THỰC HÀNH (TUÂN THỦ 2 NẤC NHẬN THỨC)
        // =========================================================================
        switch (round) {
          case 2:
            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (HỌC NGHỀ - NẤC 2: THỰC TẾ CÔNG VIỆC, KỶ LUẬT & SỨC BỀN):
- Ngành nghề: ${effectiveCareer}, cơ sở đào tạo: ${uni}.
- Kỳ vọng thu nhập: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2 - NẤC 2: THỰC TẾ CÔNG VIỆC & SỨC BỀN]:
1. Áp dụng kỹ thuật Tái định khung: Công nhận thị trường cần nhân lực, nhưng khẳng định mức thu nhập gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường khắc nghiệt (như đứng liên tục nhiều giờ, nhiệt độ nóng, áp lực thời gian, ca kíp).
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập ${expectedIncome} luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (như đứng liên tục nhiều giờ, chịu nhiệt độ, áp lực thời gian và ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG phán xét hay chụp mũ.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

          case 3:
            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (HỌC NGHỀ - NẤC 1: ĐIỀU KIỆN PHÁP LÝ & BẰNG TỐT NGHIỆP THPT):
- Ngành nghề: ${effectiveCareer}, cơ sở đào tạo: ${uni}.
- Học sinh vừa phản hồi: "${userText}".

[NHIỆM VỤ LƯỢT 3 - NẤC 1: ĐIỀU KIỆN PHÁP LÝ & ĐẦU VÀO]:
1. Nhắc nhở điều kiện tiên quyết: Phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ để được xét tuyển vào các trường nghề uy tín. Tránh để học sinh ngộ nhận rằng chọn học nghề là có thể buông xuôi hoàn toàn việc học lớp 12.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Nhiều bạn nghĩ học nghề là có thể buông xuôi việc học lớp 12, nhưng thực tế các trường nghề uy tín đều yêu cầu điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ. Nhìn lại sức học hiện tại của mình, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm bằng tốt nghiệp THPT làm tấm vé vào trường nghề?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG ép so sánh điểm chuẩn 3 năm của đại học.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

          case 4:
          default:
            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (HỌC NGHỀ - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành nghề: ${effectiveCareer}, cơ sở đào tạo: ${uni}.
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 4 - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ CHO HỌC NGHỀ]:
1. Đưa ra đúng 1 câu nhận định trung tính: Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự rèn luyện thể lực là điều kiện tiên quyết.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC (TUYỆT ĐỐI KHÔNG CÓ DẤU ? VÀ KHÔNG NHẮC ĐẾN HỌC PHÍ):
"Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự chuẩn bị về thể lực là điều kiện tiên quyết. Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${uni} để đối chiếu với hồ sơ của mình."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- Toàn bộ phản hồi chỉ gồm 2 câu văn dứt khoát.`;
        }
      } else {
        // ==========================================
        // KỊCH BẢN 4 GIAI ĐOẠN TRUY VẤN TỰ NHIÊN SOCRACAREER
        // ==========================================
        switch (round) {
          case 2:
            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH GIAI ĐOẠN 2 (CHẤT VẤN KỲ VỌNG THU NHẬP):
- Ngành mục tiêu: ${effectiveCareer}, trường mục tiêu: ${uni}.
- Mức lương khởi điểm kỳ vọng học sinh đã khai ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời ở Giai đoạn 1: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 2 - QUY TẮC PHÁT NGÔN SẮC BÉN]:
1. Đi thẳng vào vấn đề, KHÔNG bắt đầu câu bằng các cụm rập khuôn như: "Thầy hiểu...", "Thầy đồng cảm...", "Thầy thấy rằng...".
2. Tuyệt đối không khen ngợi tán dương (Không nói "Ước mơ thật tuyệt vời", "Em rất có tiềm năng").
3. So sánh mức lương kỳ vọng "${expectedIncome}" với năng lực khởi điểm thực tế của một cử nhân mới ra trường.
4. KẾT THÚC BẰNG DUY NHẤT 01 CÂU HỎI TRUY VẤN SẮC BÉN (TUYỆT ĐỐI KHÔNG HỎI KÉP):
"Với mức lương khởi điểm kỳ vọng là ${expectedIncome}, em có bằng chứng hoặc kỹ năng chuyên môn vượt trội nào để tin rằng nhà tuyển dụng sẵn sàng chi trả mức này cho một sinh viên mới tốt nghiệp ra trường?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG hỏi dồn 2-3 ý.
- TUYỆT ĐỐI KHÔNG đưa số liệu điểm chuẩn hay học phí.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.`;

          case 3:
            return `${SOCRATIC_PERSONA}${specialDirective}${adaptiveDirective}
BỐI CẢNH GIAI ĐOẠN 3 (CHẤT VẤN SỨC HỌC & TỔ HỢP MÔN):
- Ngành mục tiêu: ${effectiveCareer}, trường mục tiêu: ${uni}.
- Học sinh vừa trả lời ở Giai đoạn 2: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 3 - CHẤT VẤN RÀO CẢN MÔN HỌC & KẾ HOẠCH]:
1. Đi thẳng vào vấn đề, KHÔNG dùng các câu rập khuôn "Thầy hiểu...", không khen ngợi dễ dãi.
2. TUYỆT ĐỐI KHÔNG TỰ ĐƯA SỐ LIỆU ĐIỂM CHUẨN HAY HỌC PHÍ (cấm nói 27.5, cấm nói thiếu bao nhiêu điểm). Việc đối chứng số liệu thuộc về Bước 3.
3. KẾT THÚC BẰNG DUY NHẤT 01 CÂU HỎI TRUY VẤN:
"Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, trong các môn thuộc tổ hợp xét tuyển, môn nào khiến em cảm thấy lo lắng nhất và kế hoạch học tập thực tế của em để vượt qua rào cản đó là gì?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG giảng bài hay đưa số liệu điểm chuẩn giả định.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 ở lượt này.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2 câu văn.`;

          case 4:
          default:
            return `${SOCRATIC_PERSONA}${specialDirective}${adaptiveDirective}
BỐI CẢNH GIAI ĐOẠN 4 (CHUYỂN TIẾP PHẢN TƯ SANG BƯỚC 3):
- Ngành mục tiêu: ${effectiveCareer}, trường mục tiêu: ${uni}.
- Học sinh vừa trả lời về môn học và kế hoạch ôn tập: "${userText}".

[NHIỆM VỤ GIAI ĐOẠN 4 - TÓM TẮT LỖ HỔNG LẬP LUẬN & RA LỆNH CHUYỂN BƯỚC 3]:
1. Tóm tắt ngắn gọn lỗ hổng lập luận lớn nhất mà học sinh vừa bộc lộ qua 3 lượt đối thoại (về kỳ vọng thu nhập chưa gắn với kỹ năng vượt trội, hoặc môn xét tuyển còn yếu chưa có giải pháp cụ thể).
2. MỜI HỌC SINH BƯỚC SANG BƯỚC 3 ĐỂ TỰ TAY TRA CỨU SỐ LIỆU ĐỀ ÁN TUYỂN SINH THỰC TẾ:
"Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất, chỉ tiêu và đề án tuyển sinh thực tế của ${uni} xem độ chênh lệch thực tế là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC ĐẶT CÂU HỎI. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- Toàn bộ phản hồi chỉ gồm 2 câu văn dứt khoát.`;
        }
      }
    } else {
      // ==========================================
      // KỊCH BẢN NHÁNH B (MƠ HỒ, CHƯA CÓ MỤC TIÊU)
      // ==========================================
      switch (round) {
        case 1:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (ĐỒNG CẢM & BÓC TÁCH NGUYÊN NHÂN MƠ HỒ):
- Học sinh chưa có mục tiêu ngành cụ thể, nhóm Holland: ${holland}.
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 1]:
1. Tối đa 1 câu đồng cảm trung tính, khẳng định việc chưa chọn được ngành ở lớp 12 là điều bình thường.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?"`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (ĐỐI CHIẾU HOLLAND & TRẢI NGHIỆM THỰC TẾ):
- Học sinh vừa chia sẻ: "${userText}". Nhóm Holland: ${holland}.

[NHIỆM VỤ LƯỢT 2]:
1. Tối đa 1-2 câu trung tính liên hệ thiên hướng Holland với việc học thực tế.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Kết quả Holland cho thấy em có thiên hướng ở nhóm ${holland}. Khi thực hiện các nhiệm vụ học tập hoặc hoạt động thực tế liên quan đến nhóm này, em có thấy mình tập trung và có năng lượng vượt trội hơn không?"`;

        case 3:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (BÓC TÁCH HỌC THUẬT VS THỰC HÀNH NGHỀ):
- Học sinh vừa chia sẻ: "${userText}".

[NHIỆM VỤ LƯỢT 3]:
1. Tối đa 1-2 câu phân định giữa hướng học thuật đại học và kỹ thuật/dịch vụ thực hành.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Từ thế mạnh đó, giữa hướng đi đại học học thuật và hướng đi kỹ thuật/dịch vụ thực hành, đâu là hướng đi em thấy phù hợp hơn với sức học hiện tại của mình?"`;

        case 4:
        default:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Học sinh vừa chọn hướng đi: "${userText}".

[NHIỆM VỤ LƯỢT 4]:
1. Đúng 1 câu xác nhận lựa chọn sơ bộ của học sinh.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ:
"Em hãy bước sang Bước 3, tự tay tra cứu Đề án tuyển sinh và tiêu chuẩn đầu vào của các cơ sở đào tạo phù hợp với hướng đi em vừa chọn để đối chiếu với học bạ của mình."
[CẢNH BÁO]: TUYỆT ĐỐI KHÔNG CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI. Tối đa 2 câu văn.`;
      }
    }
  };

  // PHẢN HỒI SOCRATES DỰ PHÒNG CHUẨN BỘ NGUYÊN TẮC (BẢO HIỂM 100% TUÂN THỦ NGUYÊN TẮC CÂN BẰNG)
  const generateHeuristicFallback = (round, profile, userText = '', specialInstruction = null) => {
    const career = profile?.targetMajor || profile?.target_career || "ngành nghề mục tiêu";
    const rawSchool = profile?.targetSchool || profile?.target_university || "";
    const holland = profile?.hollandCode || profile?.holland_code || "AEI";
    const reason = profile?.reason || profile?.source_of_influence || "nguyện vọng bản thân";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    const goalShift = detectGoalShift(userText);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== career.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : (profile?.shiftedMajor || career);
    const isVocational = isVocationalTrack(effectiveCareer, userText, rawSchool);
    const isUniClarification = hasUniversityClarification(userText);
    const uni = formatSchoolName(rawSchool, isVocational);
    const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
    const lowerUser = (userText || '').toLowerCase();
    const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');

    if (specialInstruction) {
      return `Rào cản về kỹ năng hay tâm lý hoàn toàn có thể cải thiện được nếu có phương pháp phù hợp. Nếu phải đối diện với tình huống này thường xuyên trong thực tế nghề nghiệp, em dựa vào năng lực gì để khắc phục và vượt qua?`;
    }

    if (isUniClarification) {
      if (round === 4) {
        return `Thầy ghi nhận em đang hướng tới bậc Đại học chính quy ngành ${effectiveCareer} ${schoolClause} chứ không phải học nghề. Với bậc Đại học, yêu cầu sẽ thiên về nền tảng kiến thức kỹ thuật chuyên sâu và điểm chuẩn cạnh tranh theo tổ hợp môn. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${uni} xem độ chênh lệch thực tế là bao nhiêu.`;
      }
      if (round === 3) {
        return `Thầy ghi nhận em đang hướng tới bậc Đại học chính quy ngành ${effectiveCareer} ${schoolClause} chứ không phải học nghề. Để xét tuyển vào trường, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;
      }
      if (round === 2) {
        return `Thầy ghi nhận em hướng tới bậc Đại học chính quy ngành ${effectiveCareer} ${schoolClause}. Em kỳ vọng mức thu nhập ${expectedIncome} sau khi tốt nghiệp. Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập đó ngay khi ra trường?`;
      }
    }

    if (round === 1) {
      if (isBranchB) {
        return `Chào em. Thầy hiểu ở thời điểm này, việc chưa chọn được một ngành cụ thể là tâm lý rất bình thường của nhiều học sinh lớp 12. Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?`;
      }
      const studentObj = {
        id: profile?.studentId || profile?.id || localStorage.getItem('cbas_student_id') || '',
        name: profile?.studentName || profile?.name || userProfile?.name || 'em',
        baselineTarget: effectiveCareer,
        targetCareer: effectiveCareer,
        targetSchool: uni,
        source: reason,
        anchorReason: profile?.anchorReason || '',
        anchorQuote: profile?.anchorQuote || reason || '',
        conf_T0: score,
        gpa_A00: profile?.gpa_A00 || null,
        benchmark_target: profile?.benchmark_target || null,
        riasec_match_pct: profile?.riasec_match_pct ?? 40,
        riasecCode: profile?.riasecCode || holland || 'Xã hội'
      };
      const firstPrompt = generateSocraticFirstPrompt(studentObj);
      return firstPrompt.firstQuestion;
    }

    if (!isBranchB) {
      if (isVocational) {
        // Fallback cho hướng học nghề / thực hành
        switch (round) {
          case 2:
            return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (như đứng liên tục nhiều giờ, chịu nhiệt độ, áp lực thời gian và ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?`;

          case 3:
            return `Học nghề không đồng nghĩa với việc có thể buông xuôi việc học lớp 12, vì các trường nghề uy tín đều yêu cầu điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ. Nhìn lại sức học hiện tại của mình, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm bằng tốt nghiệp THPT làm tấm vé vào trường nghề?`;

          case 4:
          default:
            return `Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự rèn luyện thể lực là điều kiện tiên quyết. Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${uni} để đối chiếu với hồ sơ của mình.`;
        }
      } else {
        // Fallback cho hướng Đại học / Học thuật (Chuẩn 4 Giai đoạn SocraCareer)
        switch (round) {
          case 2:
            return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. So với mức lương khởi điểm bình quân của một cử nhân mới tốt nghiệp, em có bằng chứng hay kỹ năng chuyên môn vượt trội nào để tin rằng nhà tuyển dụng sẵn sàng chi trả mức thu nhập này?`;

          case 3:
            return `Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, trong các môn thuộc tổ hợp xét tuyển, môn nào khiến em cảm thấy lo lắng nhất và kế hoạch học tập thực tế của em để vượt qua rào cản đó là gì?`;

          case 4:
          default:
            return `Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và chỉ tiêu thực tế của ${uni} xem độ chênh lệch thực tế là bao nhiêu.`;
        }
      }
    } else {
      switch (round) {
        case 1:
          return `Việc chưa xác định được ngành ở lớp 12 là điều rất bình thường. Khi chưa có mục tiêu cụ thể, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?`;

        case 2:
          return `Kết quả Holland cho thấy em có thiên hướng ở nhóm ${holland}. Khi thực hiện các nhiệm vụ học tập liên quan đến nhóm năng lực này, em có thấy mình tập trung và có năng lượng vượt trội hơn không?`;

        case 3:
          return `Từ nhóm thế mạnh ${holland}, thị trường nghề nghiệp thường mở ra hai ngã rẽ: học thuật đại học và kỹ thuật/dịch vụ thực hành. Giữa hai hướng đi này, đâu là hướng đi em thấy phù hợp hơn với sức học hiện tại của mình?`;

        case 4:
        default:
          return `Em vừa tự tay định hình mục tiêu đầu tiên cho bản thân sau các vòng phản tư. Em hãy bước sang Bước 3, tự tay tra cứu Đề án tuyển sinh và tiêu chuẩn đầu vào của các cơ sở đào tạo phù hợp với hướng đi em vừa chọn để đối chiếu với học bạ của mình.`;
      }
    }
  };

  // 3. GỌI API GEMINI VỚI CẤU HÌNH NHIỆT ĐỘ CỐ ĐỊNH CHỐNG ẢO GIÁC
  const callGeminiSocratic = async (historyMessages, userText, stage, specialInstruction = null) => {
    const goalShift = detectGoalShift(userText);
    const curMajor = studentProfile?.targetMajor || studentProfile?.target_career || 'ngành mục tiêu';
    const effectiveMajor = (goalShift && goalShift.newMajor) ? goalShift.newMajor : (studentProfile?.shiftedMajor || curMajor);
    const effectiveProfile = {
      ...studentProfile,
      targetMajor: effectiveMajor,
      target_career: effectiveMajor,
      targetCareer: effectiveMajor,
      shiftedMajor: effectiveMajor
    };

    // 3.1. Thử gọi Serverless Backend /api/socrates-chat hoặc /api/chat
    const endpointsToTry = ['/api/socrates-chat', '/api/chat'];
    const requestPayload = {
      chatStage: stage,
      stage: stage,
      round: stage,
      studentProfile: {
        hollandCode: studentProfile?.hollandCode || studentProfile?.holland_code || 'RIASEC',
        targetMajor: effectiveMajor,
        targetSchool: studentProfile?.targetSchool || studentProfile?.target_university || '',
        reason: studentProfile?.reason || studentProfile?.source_of_influence || 'Em thích từ nhỏ',
        anchorReason: studentProfile?.anchorReason || '',
        anchorQuote: studentProfile?.anchorQuote || studentProfile?.reason || '',
        initialConfidence: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        expectedIncome: studentProfile?.expectedIncome || studentProfile?.expected_income || '10 - 15 triệu/tháng',
        // Tương thích ngược & chỉ số thích ứng:
        targetCareer: effectiveMajor,
        confidenceT0: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        competenceSelfEval: 'Vừa sức',
        gpa_A00: studentProfile?.gpa_A00,
        benchmark_target: studentProfile?.benchmark_target,
        riasec_match_pct: studentProfile?.riasec_match_pct,
        riasecCode: studentProfile?.riasecCode,
        studentId: studentProfile?.studentId || localStorage.getItem('cbas_student_id') || ''
      },
      userProfile: {
        hollandCode: studentProfile?.hollandCode || studentProfile?.holland_code || 'RIASEC',
        targetMajor: effectiveMajor,
        targetSchool: studentProfile?.targetSchool || studentProfile?.target_university || '',
        reason: studentProfile?.reason || studentProfile?.source_of_influence || 'Em thích từ nhỏ',
        anchorReason: studentProfile?.anchorReason || '',
        anchorQuote: studentProfile?.anchorQuote || studentProfile?.reason || '',
        initialConfidence: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        expectedIncome: studentProfile?.expectedIncome || studentProfile?.expected_income || '10 - 15 triệu/tháng',
        gpa_A00: studentProfile?.gpa_A00,
        benchmark_target: studentProfile?.benchmark_target,
        riasec_match_pct: studentProfile?.riasec_match_pct,
        riasecCode: studentProfile?.riasecCode,
        studentId: studentProfile?.studentId || localStorage.getItem('cbas_student_id') || ''
      },
      chatHistory: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text })),
      userMessage: userText,
      // Hỗ trợ trường tương thích:
      message: userText,
      history: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text })),
      anchor: effectiveProfile,
      specialInstruction: specialInstruction
    };

    const isStage4 = stage === 4;

    for (const ep of endpointsToTry) {
      try {
        const serverlessCtrl = new AbortController();
        const sTimeout = setTimeout(() => serverlessCtrl.abort(), 12000);

        const serverlessRes = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
          signal: serverlessCtrl.signal
        });
        clearTimeout(sTimeout);

        if (serverlessRes.ok) {
          const sData = await serverlessRes.json();
          let replyText = sData?.response || sData?.reply;
          if (replyText && replyText.trim().length >= 15) {
            const isReallyComplete = isStage4 && (sData?.isComplete === true || sData?.isCompleted === true || sData?.stage === 4);
            const sanitized = sanitizeSocraticResponse(replyText, stage, effectiveMajor, studentProfile?.targetSchool, userText);

            return {
              replyText: sanitized,
              chatStage: isReallyComplete ? 4 : stage,
              isCompleted: isReallyComplete,
              isComplete: isReallyComplete,
              shiftedMajor: sData?.shiftedMajor || (goalShift ? goalShift.newMajor : null)
            };
          }
        }
      } catch (apiErr) {
        // Thử endpoint tiếp theo
      }
    }

    // 3.2. Gọi trực tiếp Gemini API (Hỗ trợ cả Vite import.meta và process.env an toàn)
    try {
      const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
      const fallbackKey = typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '';
      const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
        || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY)
        || fallbackKey;

      const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;
      const systemPrompt = generatePromptForRound(stage, effectiveProfile, userText, specialInstruction);

      const formattedContents = historyMessages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      formattedContents.push({
        role: 'user',
        parts: [{ text: userText }]
      });

      const directCtrl = new AbortController();
      const directTimeout = setTimeout(() => directCtrl.abort(), 12000);

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: formattedContents,
          generationConfig: {
            temperature: 0.35,
            topP: 0.85,
            maxOutputTokens: 1000
          }
        }),
        signal: directCtrl.signal
      });
      clearTimeout(directTimeout);

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts;
        let text = null;
        if (Array.isArray(parts) && parts.length > 0) {
          const cleanParts = parts.filter(p => !p.thought && p.text);
          if (cleanParts.length > 0) {
            text = cleanParts.map(p => p.text).join('\n\n').trim();
          } else {
            text = parts[0]?.text?.trim();
          }
          if (text) {
            const isReallyComplete = isStage4;
            const sanitized = sanitizeSocraticResponse(text, stage, effectiveMajor, studentProfile?.targetSchool, userText);

            return {
              replyText: sanitized,
              chatStage: isReallyComplete ? 4 : stage,
              isCompleted: isReallyComplete,
              isComplete: isReallyComplete,
              shiftedMajor: goalShift ? goalShift.newMajor : null
            };
          }
        }
      }
    } catch (e) {
      console.warn("Direct Gemini call exception:", e);
    }

    // 3.3. Kích hoạt fallback heuristic dự phòng chuẩn CBAS nếu mạng chậm hoặc hết quota
    let fallbackText = generateHeuristicFallback(stage, effectiveProfile, userText, specialInstruction);
    const isReallyComplete = isStage4;
    const sanitizedFallback = sanitizeSocraticResponse(fallbackText, stage, effectiveMajor, studentProfile?.targetSchool, userText);

    return {
      replyText: sanitizedFallback,
      chatStage: isReallyComplete ? 4 : stage,
      isCompleted: isReallyComplete,
      isComplete: isReallyComplete,
      shiftedMajor: goalShift ? goalShift.newMajor : null
    };
  };

  // 4. TRÍCH XUẤT VĂN BẢN ĐỐI THOẠI CHUẨN MỰC CHO HỌC SINH
  const generateExportText = () => {
    let userProfile = null;
    try {
      const rawProf = localStorage.getItem("cbas_user_profile");
      if (rawProf) userProfile = JSON.parse(rawProf);
    } catch (e) {}

    let anchor = null;
    try {
      const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData");
      if (rawAnchor) anchor = JSON.parse(rawAnchor);
    } catch (e) {}

    const targetCareer = userProfile?.targetMajor || anchor?.target_career || studentProfile?.targetMajor || studentProfile?.target_career || 'Chưa xác định';
    const rawUniv = userProfile?.targetSchool || anchor?.target_university || studentProfile?.targetSchool || studentProfile?.target_university || '';
    const isVocationalExport = isVocationalTrack(targetCareer, '', rawUniv);
    const targetUniv = formatSchoolName(rawUniv, isVocationalExport);
    const confidence = userProfile?.initialConfidence ?? anchor?.confidence_score ?? studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? '5';
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || studentProfile?.expectedIncome || '10 - 15 triệu/tháng';
    const reason = userProfile?.reason || anchor?.source_of_influence || studentProfile?.reason || 'Chưa ghi nhận lý do';
    const holland = userProfile?.hollandCode || anchor?.holland_code || studentProfile?.hollandCode || studentProfile?.holland_code || 'AEI';
    const dateStr = new Date().toLocaleString('vi-VN');

    let content = `=================================================================\n`;
    content += `   BIÊN BẢN PHẢN TƯ HƯỚNG NGHIỆP SOCRATES (BƯỚC 2)\n`;
    content += `   Hệ Thống Điều Chuẩn Nhận Thức Nghề Nghiệp Thích Ứng (SocraCareer)\n`;
    content += `       Đề tài Nghiên cứu Khoa học Kỹ thuật (KHKT) Học sinh Trung học\n`;
    content += `=================================================================\n\n`;
    content += `📅 Thời gian xuất: ${dateStr}\n`;
    content += `🎯 Ngành mục tiêu: ${targetCareer}\n`;
    content += `🏛️ Trường / Cơ sở đào tạo mục tiêu: ${targetUniv}\n`;
    content += `📊 Mức tự tin ban đầu (Bước 1): ${confidence}/10\n`;
    content += `💵 Kỳ vọng thu nhập (Bước 1): ${expectedIncome}\n`;
    content += `📝 Lý do chọn ban đầu: ${reason}\n`;
    const isSessionDone = isReadyForStep3;
    content += `🔄 Tiến trình hoàn thành: ${isSessionDone ? '4 / 4 giai đoạn phản tư (Đã hoàn thành đầy đủ)' : `${Math.min(chatStage, 3)} / ${maxStages} giai đoạn phản tư`}\n\n`;

    const effectiveBias = activeBiasType || sessionTelemetry?.primary_bias || localStorage.getItem('cbas_step2_primary_bias') || 'TRUY VẤN NỀN TẢNG THỰC CHẤT';
    const effectiveBiasRule = activeBiasRule || sessionTelemetry?.primary_bias_rule || localStorage.getItem('cbas_step2_bias_rule') || 'Kích hoạt Vòng 1 thích ứng dựa trên phân tích mỏ neo lý do lựa chọn, độ tự tin T0, khoảng cách điểm học bạ và độ tương thích RIASEC.';

    content += `-----------------------------------------------------------------\n`;
    content += `KẾT QUẢ ĐO LƯỜNG VÀ GẮN NHÃN HÀNH VI (QUY CHUẨN KHKT):\n`;
    content += `-----------------------------------------------------------------\n`;
    content += `- Primary_Cognitive_Bias: ${effectiveBias}\n`;
    content += `  * Quy tắc kích hoạt: ${effectiveBiasRule}\n`;
    if (sessionTelemetry) {
      content += `- Turning_Point_Detected: ${sessionTelemetry.turning_point_detected}\n`;
      content += `  * Quy tắc kích hoạt: ${sessionTelemetry.turning_point_rule || 'Phát hiện khi học sinh bộc lộ động cơ ngoại tại (áp lực gia đình, tài chính), tự ti năng lực môn học, hoặc có tín hiệu dịch chuyển mục tiêu ngành.'}\n`;
      content += `- Outcome_Category: ${sessionTelemetry.outcome_category}\n`;
      content += `  * Quy tắc kích hoạt: ${sessionTelemetry.outcome_rule || (sessionTelemetry.outcome_category === 'Adaptive_Shift' ? 'Học sinh thực sự có chuyển biến nhận thức, nhận ra rủi ro hoặc điều chỉnh mục tiêu/phương án xét tuyển.' : 'Học sinh kiên định với mục tiêu sau khi đã đối diện với thách thức và điều chuẩn nhận thức.')}\n`;
      content += `- Triage_Step4: ${sessionTelemetry.triage_step4}\n`;
      content += `  * Quy tắc kích hoạt: ${sessionTelemetry.triage_rule || (sessionTelemetry.triage_step4?.includes('In-depth') ? 'Chỉ định tham vấn sâu 20 phút do có biến động nhận thức (Turning Point) hoặc dịch chuyển mục tiêu cần cố vấn can thiệp.' : 'Chỉ định phiên định hướng nhanh 5 phút do nhận thức thực tế đã tương đối vững vàng.')}\n`;
    }
    content += `\n`;

    content += `-----------------------------------------------------------------\n`;
    content += `CHI TIẾT NỘI DUNG ĐỐI THOẠI PHẢN BIỆN SOCRATES:\n`;
    content += `-----------------------------------------------------------------\n\n`;

    messages.forEach((msg) => {
      const sender = msg.role === 'model' ? '🤖 Thầy Socrates (AI)' : '🧑‍🎓 Học sinh';
      content += `[${msg.time || ''}] ${sender}:\n${msg.text}\n\n`;
    });

    content += `=================================================================\n`;
    content += `📌 HƯỚNG DẪN TIẾP THEO DÀNH CHO HỌC SINH:\n`;
    content += `1. Dùng các câu hỏi truy vấn ở trên để tra cứu số liệu tại Bước 3 (Điểm chuẩn trúng tuyển 3 năm gần nhất, Độ chênh lệch điểm học bạ, Tổ hợp xét tuyển thực tế và Chỉ tiêu tuyển sinh).\n`;
    content += `2. Mang biên bản này đối chất trực tiếp với Cố vấn / Sinh viên trong buổi Tư vấn 1-1 ở Bước 4.\n`;
    content += `=================================================================\n`;

    return content;
  };

  // 4.1. Tải về file văn bản (.txt)
  const handleDownloadTxt = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const careerSlug = (studentProfile?.target_career || 'huong_nghiep')
      .trim().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    
    link.href = url;
    link.download = `Nhat_ky_phan_tu_Socrates_${careerSlug}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4.2. Sao chép vào bộ nhớ tạm (Clipboard)
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

  // 4.3. In hoặc Lưu file PDF chuẩn
  const handlePrint = () => {
    window.print();
  };

  // 4.4. Bắt đầu lại cuộc trò chuyện từ đầu (Phục vụ thử nghiệm)
  const handleResetSession = () => {
    if (window.confirm("Em có muốn xóa dữ liệu phiên hiện tại và bắt đầu lại cuộc trò chuyện từ Giai đoạn 1 không?")) {
      resetStepData(2);
      window.location.reload();
    }
  };

  // 5. BỘ LỌC ĐẦU VÀO THÔNG MINH & ĐIỀU PHỐI GIAI ĐOẠN PHẢN TƯ
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanText = inputValue.trim();
    if (cleanText.length === 0) return;

    // 5.1. Chạy bộ lọc phản xạ tự nhiên trước khi chạy máy trạng thái
    const reflex = processStudentMessage(cleanText, chatStage, studentProfile);

    // Nếu học sinh chỉ chào hỏi xã giao: Trả lời ấm áp, KHÔNG nhảy giai đoạn
    if (reflex.advanceRound === false && reflex.reply) {
      setErrorMessage('');
      const userMsg = {
        role: 'user',
        text: cleanText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const aiMsg = {
        role: 'model',
        text: reflex.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const next = [...prev, userMsg, aiMsg];
        try { localStorage.setItem("cbas_step2_messages", JSON.stringify(next)); } catch (e) {}
        return next;
      });
      setInputValue('');
      return;
    }

    // RÀNG BUỘC THÔNG MINH CHO CÁC LƯỢT TIẾP THEO:
    // Giai đoạn 1, 2 bắt buộc lập luận (tối thiểu 5 ký tự)
    // Giai đoạn 3 trở đi chấp nhận câu trả lời ngắn ("dạ rồi", "chưa", "em đã xem")
    if (chatStage <= 2 && cleanText.length < 5) {
      setErrorMessage("⚠️ Câu trả lời của em quá ngắn. Hãy chia sẻ cụ thể trải nghiệm hoặc suy nghĩ của mình để Thầy phản biện nhé!");
      return;
    }

    setErrorMessage('');
    const userMsg = {
      role: 'user',
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsLoading(true);

    const targetStage = Math.min(chatStage + 1, 4);

    try {
      let aiResult = null;
      if (reflex.directReply) {
        aiResult = {
          replyText: reflex.directReply,
          chatStage: targetStage,
          isCompleted: false,
          isComplete: false
        };
      } else {
        aiResult = await callGeminiSocratic(nextHistory, cleanText, targetStage, reflex.instructionForAI);
      }

      // ĐỒNG BỘ CHUYỂN BIẾN MỤC TIÊU (GOAL SHIFT / TURNING POINT) VÀO PROFILE & LOCALSTORAGE:
      const goalShift = detectGoalShift(cleanText);
      const newMajor = goalShift?.newMajor || aiResult?.shiftedMajor;
      if (newMajor && (!studentProfile?.targetMajor || newMajor.toLowerCase() !== studentProfile.targetMajor.toLowerCase())) {
        setStudentProfile(prev => ({
          ...prev,
          targetMajor: newMajor,
          target_career: newMajor,
          shiftedMajor: newMajor
        }));
        try {
          const rawProf = localStorage.getItem("cbas_user_profile");
          const profObj = rawProf ? JSON.parse(rawProf) : {};
          profObj.targetMajor = newMajor;
          profObj.target_career = newMajor;
          profObj.shiftedMajor = newMajor;
          localStorage.setItem("cbas_user_profile", JSON.stringify(profObj));
        } catch (e) {}
        try {
          const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData");
          if (rawAnchor) {
            const anchorObj = JSON.parse(rawAnchor);
            anchorObj.target_career = newMajor;
            anchorObj.targetMajor = newMajor;
            anchorObj.shiftedMajor = newMajor;
            localStorage.setItem("cbas_anchor_data", JSON.stringify(anchorObj));
          }
        } catch (e) {}
      }
      
      const replyContent = aiResult?.replyText || (typeof aiResult === 'string' ? aiResult : '');
      const isFinished = targetStage === 4 && (aiResult?.isComplete === true || aiResult?.isCompleted === true);
      const nextStage = isFinished ? 4 : targetStage;

      const aiMsg = {
        role: 'model',
        text: replyContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedHistory = [...nextHistory, aiMsg];
      setMessages(updatedHistory);
      try { localStorage.setItem("cbas_step2_messages", JSON.stringify(updatedHistory)); } catch (e) {}

      if (reflex.advanceRound !== false) {
        setChatStage(nextStage);
        if (isFinished) {
          setIsCompleted(true);
          setIsChatFinished(true);
          try { localStorage.setItem("cbas_step2_completed", "true"); } catch (e) {}

          // Tự động cuộn xuống đúng vị trí nút bấm
          setTimeout(() => {
            step3CtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 100);

          // QUY TẮC 4: PHÂN LOẠI HÀNH VI (OUTCOME_CATEGORY) & TELEMETRY CHUẨN KHKT SOCRACAREER
          const outcomeAnalysis = evaluateOutcomeCategory(updatedHistory, studentProfile, cleanText, goalShift);
          const outcome = outcomeAnalysis.category;
          const outcomeRule = outcomeAnalysis.rule;
          const tpDetected = outcomeAnalysis.hasClearAdmission;

          // Phân luồng Tham vấn Bước 4:
          // - "In-depth (20 phút)": Dành cho học sinh có Turning Point hoặc Uncalibrated_Avoidant hoặc Reconsidering.
          // - "Brief (10 phút)": Dành cho học sinh lập luận vững vàng, không có mâu thuẫn lớn (Persistent_Calibrated).
          const isNeedInDepth = tpDetected || outcome === 'Uncalibrated_Avoidant' || outcome === 'Reconsidering';
          const triage = isNeedInDepth ? 'In-depth (20 phút)' : 'Brief (10 phút)';

          const tpRule = tpDetected 
            ? `Học sinh thừa nhận rõ ràng rào cản năng lực thực tế hoặc sự chưa thực tế của kỳ vọng ban đầu.`
            : 'Không phát hiện điểm xoay nhận thức đột ngột (học sinh giữ lập trường tự tin hoặc né tránh câu hỏi).';

          const triageRule = isNeedInDepth
            ? 'Chỉ định phiên Tham vấn Chuyên sâu (In-depth 20 phút): Do có điểm xoay nhận thức (Turning Point), né tránh chất vấn (Uncalibrated Avoidant) hoặc đang cân nhắc đổi ngành (Reconsidering).'
            : 'Chỉ định phiên Định hướng Nhanh (Brief 10 phút): Học sinh lập luận vững vàng, đã hiệu chuẩn nhận thức thực tế và có giải pháp rõ ràng (Persistent Calibrated).';

          const telemetryData = {
            primary_bias: activeBiasType || localStorage.getItem('cbas_step2_primary_bias') || 'TRUY VẤN NỀN TẢNG THỰC CHẤT',
            primary_bias_rule: activeBiasRule || localStorage.getItem('cbas_step2_bias_rule') || 'Kích hoạt Vòng 1 thích ứng dựa trên phân tích mỏ neo lý do lựa chọn và độ tự tin T0.',
            turning_point_detected: tpDetected ? 'True' : 'False',
            turning_point_rule: tpRule,
            outcome_category: outcome,
            outcome_rule: outcomeRule,
            triage_step4: triage,
            triage_rule: triageRule,
            timestamp: new Date().toISOString()
          };
          setSessionTelemetry(telemetryData);
          localStorage.setItem('cbas_step2_telemetry', JSON.stringify(telemetryData));
        }
      }

    } catch (err) {
      console.error(err);
      setErrorMessage("⚠️ Sự cố kết nối AI: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '88vh', fontFamily: 'sans-serif' }}>
      <StepProgressHeader 
        currentStep={2} 
        onResetStep={() => { resetStepData(2); window.location.reload(); }}
        title="Bước 2: AI Tham Vấn Phản Tư (Socratic Agent)" 
        subtitle="Đối thoại phản biện cùng Trợ lý AI để bóc tách điểm mù tư duy và bẫy tâm lý chọn nghề." 
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
              Để Trợ lý AI Socrates có dữ liệu bộc lộ mỏ neo và thiên hướng nghề nghiệp cá nhân hóa chính xác cho em, em cần hoàn thành <strong>Bước 1 (Trắc nghiệm Holland RIASEC & Khai báo Mỏ neo T₀)</strong> trước.
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
            height: auto;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* THANH TIẾN TRÌNH & CỤM NÚT THAO TÁC / XUẤT FILE */}
      <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px' }}>BƯỚC 2: CAN THIỆP HÀNH VI</span>
          <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', color: '#0f172a' }}>AI Tham Vấn Phản Tư (Socrates)</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span>Tiến trình:</span>
            <span style={{ color: '#2563eb' }}>{isReadyForStep3 ? 4 : Math.min(chatStage, 3)}</span>
            <span>/ {maxStages} giai đoạn</span>
            {isReadyForStep3 ? (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                ✓ Đã hoàn thành 4 giai đoạn phản tư
              </span>
            ) : null}
          </div>

          {/* CỤM NÚT SAO CHÉP, XUẤT FILE & BẮT ĐẦU LẠI */}
          <div style={{ display: 'flex', gap: '6px' }} className="no-print">
            <button
              type="button"
              onClick={handleCopyText}
              title="Sao chép toàn bộ nội dung trò chuyện vào bộ nhớ tạm"
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
              title="Tải biên bản đối thoại phản tư (.txt)"
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
              title="Bắt đầu lại cuộc trò chuyện từ Vòng 1"
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

      {/* KHUNG NỘI DUNG CHAT (VÙNG IN VÀ HIỂN THỊ) */}
      <div id="socratic-chat-export-area" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* BANNER THÔNG TIN MỎ NEO & THIÊN LỆCH NHẬN THỨC KÍCH HOẠT VÒNG 1 */}
        {activeBiasType && (
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
                🎯 Mỏ neo Bước 1:
              </span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                {studentProfile?.targetMajor || 'Ngành mục tiêu'} {studentProfile?.targetSchool ? `(${studentProfile.targetSchool})` : ''}
              </span>
              {studentProfile?.initialConfidence != null && (
                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                  Tự tin T₀: {studentProfile.initialConfidence}/10
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                💡 Trọng tâm phản tư Vòng 1:
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
                {activeBiasType.includes('MỎ NEO TRUYỀN THÔNG') ? 'Phản tư thông tin truyền thông & mạng xã hội' :
                 activeBiasType.includes('TÂM LÝ ĐÁM ĐÔNG') ? 'Phản tư động cơ tự chủ vs. xu hướng xung quanh' :
                 activeBiasType.includes('TỰ TIN THÁI QUÁ') ? 'Khảo sát căn cứ thực tế của mức độ tự tin T₀' :
                 activeBiasType.includes('THIÊN LỆCH XÁC NHẬN') ? 'Đối chiếu sở trường RIASEC & đặc thù nghề' :
                 'Khảo sát cơ sở thực tế & động lực cốt lõi'}
              </span>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLastAi = m.role === 'model' && !messages.slice(i + 1).some(msg => msg.role === 'model');
          return (
            <div 
              key={`msg-${i}`} 
              ref={isLastAi ? lastAiMsgRef : null}
              style={{ 
                display: 'flex', 
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                scrollMarginTop: '16px'
              }}
            >
              <div style={{
                maxWidth: '78%',
                padding: '14px 18px',
                borderRadius: m.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: m.role === 'user' ? '#059669' : '#ffffff',
                color: m.role === 'user' ? '#ffffff' : '#1e293b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                fontSize: '14.5px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                <div>{m.text}</div>
                <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>{m.time}</div>
              </div>
            </div>
          );
        })}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }} className="no-print">
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#64748b' }}>
              🤖 Thầy Socrates đang phản biện luận điểm của em...
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }} className="no-print">
            {errorMessage}
          </div>
        ) : null}

        {/* CALLOUT BOX TINH GỌN NGAY DƯỚI TIN NHẮN CUỐI CÙNG CỦA AI */}
        {/* HỘP ĐIỀU HƯỚNG CỐ ĐỊNH / THẺ NỔI BẬT NGAY DƯỚI TIN NHẮN CUỐI CÙNG */}
        {isReadyForStep3 ? (
          <div 
            ref={step3CtaRef}
            className="no-print"
            style={{
              background: '#f0fdf4',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '18px 22px',
              marginTop: '12px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '26px', lineHeight: 1 }}>🎯</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15.5px', color: '#065f46', fontWeight: 'bold' }}>
                  ✓ Em đã hoàn thành 4 giai đoạn phản tư nhận thức cùng Thầy Socrates.
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: '1.4' }}>
                  Em hãy đọc kỹ lời phân tích và định hướng thích ứng của Thầy ở trên, sau đó bấm nút bên dưới để chuyển sang Bước 3 tự tay đối chứng số liệu thực tế từ Đề án tuyển sinh.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => window.location.href = '/student/fact-check'}
                style={{
                  flex: 1,
                  minWidth: '320px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 22px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(5, 150, 105, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>BẤM VÀO ĐÂY ĐỂ TIẾP TỤC SANG BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU ĐỀ ÁN</span>
                <span style={{ fontSize: '18px' }}>➔</span>
              </button>

              <button
                type="button"
                onClick={handleResetSession}
                title="Bắt đầu lại cuộc trò chuyện từ Vòng 1"
                style={{
                  background: '#fff1f2',
                  color: '#be123c',
                  border: '1.5px solid #fecdd3',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔄 Làm lại Bước 2</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                title="Sao chép toàn bộ biên bản đối thoại"
                style={{
                  background: copySuccess ? '#059669' : '#ffffff',
                  color: copySuccess ? '#ffffff' : '#065f46',
                  border: '1.5px solid #a7f3d0',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {copySuccess ? '✅ Đã sao chép' : '📋 Sao chép biên bản'}
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                title="Tải biên bản đối thoại (.txt)"
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                📥 Tải .TXT
              </button>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* THANH NHẬP LIỆU PHẢN BIỆN (KHÓA KHI ĐÃ HOÀN TẤT) */}
      <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)' }} className="no-print">
        <form 
          onSubmit={handleSendMessage} 
          style={{ display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || isReadyForStep3}
            placeholder={isReadyForStep3 ? "Phiên phản tư Bước 2 đã hoàn tất. Vui lòng bấm tiếp tục bên dưới." : "Tự tay nhập câu trả lời phản biện của em..."}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: isReadyForStep3 ? '#f1f5f9' : '#ffffff',
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

      {/* MỤC NHẬT KÝ VÀ SẢN PHẨM PHẢN TƯ VÒNG 2 */}
      <div style={{ padding: '12px 16px 28px 16px' }} className="no-print">
        <ReflectionJournalCard 
          round={2}
          contextData={{
            targetMajor: studentProfile?.targetMajor || '',
            activeBiasType: activeBiasType || '',
            conversationExcerpt: (messages || []).filter(m => m.role === 'model').slice(-1)[0]?.text || ''
          }}
        />
      </div>
        </>
      )}

    </div>
  );
}

export { Step2SocraticAgent };
