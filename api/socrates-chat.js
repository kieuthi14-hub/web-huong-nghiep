// api/socrates-chat.js - Vercel Serverless Function kết nối Gemini API
// ==============================================================================
// SOCRACAREER - BƯỚC 2: ĐỐI THOẠI PHẢN TƯ TỰ NHIÊN THEO CHỦ ĐỀ (v2.1)
// Đọc câu trả lời gần nhất, phản hồi đúng một ý cụ thể rồi hỏi tiếp một câu ngắn.
// Bỏ nhãn "Chặng", không lặp "Thầy ghi nhận...", xử lý thấu cảm khi học sinh hoang mang.
// ==============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

export const WORKFLOW_VERSION = 'v2.2_anti_repeat_4rounds_2026';

export const INTERNAL_TOPICS = ['reasons', 'understanding', 'opportunities', 'preparation'];

export const TOPIC_LABELS = {
  reasons: 'Vì sao chọn nghề?',
  understanding: 'Em hiểu nghề em chọn đến đâu?',
  opportunities: 'Cơ hội việc làm?',
  preparation: 'Cần chuẩn bị những gì để thi đậu vào ngành đó?'
};

export const TOPIC_OPENING_QUESTIONS = {
  reasons: 'Ngoài lý do đã nêu ở bước 1, còn điều gì khiến em muốn chọn ngành này?',
  understanding: 'Theo em, khó khăn đáng chú ý nhất khi làm nghề này là gì?',
  opportunities: 'Em hình dung cơ hội tìm việc sau khi tốt nghiệp ngành này như thế nào?',
  preparation: 'Hiện tại, em cần chuẩn bị những gì để thi đậu vào ngành này?'
};

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

export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = [
    'chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân',
    'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'
  ];
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

export function isBroadMajorField(career = '', userText = '') {
  const cNorm = removeVietnameseTones(career);
  const uNorm = removeVietnameseTones(userText);
  if (!cNorm) return true;

  const specificIndicators = [
    'noi khoa', 'ngoai khoa', 'nhi khoa', 'da khoa', 'bac si', 'duoc si', 'duoc hoc', 'dieu duong', 'rang ham mat', 'xet nghiem',
    'su pham toan', 'su pham van', 'su pham ngu van', 'su pham anh', 'su pham tieng anh', 'su pham ly', 'su pham hoa', 'su pham sinh', 'su pham su', 'su pham dia', 'su pham tin', 'tieu hoc', 'mam non',
    'quan tri kinh doanh', 'ke toan', 'kiem toan', 'tai chinh ngan hang', 'marketing', 'thuong mai dien tu', 'kinh doanh quoc te', 'logistics',
    'ky thuat phan mem', 'khoa hoc may tinh', 'an toan thong tin', 'tri tue nhan tao', 'he thong thong tin', 'mang may tinh',
    'quan tri khach san', 'quan tri lu hanh', 'huong dan du lich', 'ngon ngu anh'
  ];
  if (specificIndicators.some(k => cNorm.includes(k) || uNorm.includes(k))) {
    return false;
  }

  const broadFields = [
    'kinh te', 'nganh kinh te', 'khoi kinh te',
    'su pham', 'nganh su pham', 'nghe giao', 'giao vien',
    'cntt', 'it', 'cong nghe thong tin', 'may tinh',
    'y duoc', 'nganh y', 'khoi y duoc', 'y te',
    'ky thuat', 'nganh ky thuat', 'cong nghe',
    'du lich', 'nganh du lich', 'dich vu',
    'ngon ngu', 'ngoai ngu', 'xa hoi', 'luat'
  ];
  return broadFields.includes(cNorm);
}

// NHẬN DIỆN KHI HỌC SINH HOANG MANG / LO LẮNG / KHÔNG HIỂU (MỤC 5)
export function isDistressOrOverwhelmed(text = '') {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const uNorm = removeVietnameseTones(clean);
  const patterns = [
    /\b(hoang mang|rối quá|roi qua|mông lung|mong lung|bối rối|boi roi|lo quá|lo lắng quá|sợ quá)\b/i,
    /^(em\s+)?(hoang mang|lo|lo lắng|sợ|rối|không hiểu|chưa hiểu|khó hiểu)\s*(quá|lắm|ạ|a|thầy ơi)?$/i,
    /\bem\s+(đang\s+)?(rất\s+|hơi\s+)?(hoang mang|bối rối|mông lung|lo lắng|không hiểu)\b/i
  ];
  return patterns.some(p => p.test(clean) || p.test(uNorm));
}

// NHẬN DIỆN KHI HỌC SINH MUỐN TẠM DỪNG PHIÊN (MỤC 5 & 6)
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

// NHẬN DIỆN NGUỒN THÔNG TIN MÀ HỌC SINH THỰC SỰ NÊU TRONG CÂU TRẢ LỜI (MỤC 7)
export function extractExplicitSources(text = '') {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  const lower = clean.toLowerCase();
  if (isDontKnowResponse(clean)) return [];

  const sourceMatchers = [
    { label: 'Đề án tuyển sinh / Website trường', regex: /\b(đề án|website trường|web trường|trang tuyển sinh|cổng thông tin trường|fanpage trường)\b/i },
    { label: 'Báo chí / Truyền thông chính thống', regex: /\b(báo|bài báo|vtv|thời sự|bộ giáo dục|bộ y tế|thống kê)\b/i },
    { label: 'Mạng xã hội / Video chia sẻ (TikTok, YouTube, Facebook)', regex: /\b(tiktok|youtube|facebook|mạng xã hội|video|clip|review|KOL|vlog)\b/i },
    { label: 'Người thân / Gia đình / Anh chị đi trước', regex: /\b(mẹ|bố|ba|anh chị|người quen|người thân|cô chú|bác sĩ quen|cựu sinh viên)\b/i },
    { label: 'Thầy cô / Tư vấn hướng nghiệp tại trường', regex: /\b(thầy cô|giáo viên|buổi tư vấn|hướng nghiệp ở trường)\b/i },
    { label: 'Cổng thông tin việc làm / Tin tuyển dụng', regex: /\b(topcv|vietnamworks|itviec|linkedin|tin tuyển dụng|jd|nhà tuyển dụng)\b/i }
  ];

  const found = [];
  for (const item of sourceMatchers) {
    if (item.regex.test(lower)) {
      found.push(item.label);
    }
  }
  return found;
}

// KHỞI TẠO CÂU MỞ ĐẦU BƯỚC 2 (MỤC 1 & 2: BỎ NHÃN CHẶNG, CHỈ HỎI 1 CÂU MỞ ĐẦU NGẮN GỌN)
export function generateSocraticFirstPrompt(student = {}) {
  const targetCareer = (student.baselineTarget || student.targetMajor || student.targetCareer || student.target_career || '').trim();
  const rawSchool = (student.targetSchool || student.targetUniversity || student.target_university || '').trim();
  const schoolClause = isSchoolUndecided(rawSchool) ? '' : ` tại ${rawSchool}`;
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
 * LÀM SẠCH PHẢN HỒI CỦA AI THEO MỤC 1, 2, 3, 5:
 * - Bỏ hoàn toàn nhãn "Chặng 1/2/3/4", "Bước sang chặng...", "Đã hoàn thành cả 4 chặng".
 * - Bỏ cụm lặp máy móc "Thầy ghi nhận..." ở đầu câu.
 * - Đảm bảo mỗi lượt chỉ có tối đa 1 câu hỏi (1 dấu ?).
 */
export function sanitizeSocraticResponse(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // 1. Gỡ bỏ tiền tố hệ thống & nhãn Chặng
  cleaned = cleaned
    .replace(/^(Chuyên gia Phản tư|Trợ lý AI|AI Socrates|Socrates|Thầy Socrates)[:\s-]*/i, '')
    .replace(/^<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/\[?\s*Chặng\s*[1-5]\s*[:\-–—]?\s*[^\]]*\]?/gi, '')
    .replace(/(?:Bước\s+sang|Ở|Tại|Chuyển\s+sang)\s+chặng\s*[1-5][,:;\s]*/gi, '')
    .replace(/qua\s+cả\s+4\s+chặng[^.!?\n]*/gi, 'qua cuộc trò chuyện vừa rồi')
    .replace(/đã\s+hoàn\s+thành\s+(?:cả\s+)?4\s+chặng[^.!?\n]*/gi, 'đã trao đổi qua các chủ đề chính')
    .trim();

  // 2. Bỏ lối lặp máy móc "Thầy ghi nhận..." hoặc giả định học sinh đã có nguồn/kế hoạch khi chưa nêu
  cleaned = cleaned
    .replace(/^Thầy\s+(?:đã\s+)?ghi\s+nhận\s+(?:rằng\s+|là\s+)?/i, '')
    .replace(/^Cảm\s+ơn\s+em\s+đã\s+chia\s+sẻ[.!]\s*/i, '')
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 3. Loại bỏ các câu gây áp lực bị cấm
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

  // 4. Đảm bảo chỉ có tối đa 1 câu hỏi trong 1 lượt phản hồi (Mục 2: Mỗi lượt chỉ hỏi một ý)
  const sentences = cleaned.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const questionSentences = sentences.filter(s => s.endsWith('?'));
  if (questionSentences.length > 1) {
    const nonQuestions = sentences.filter(s => !s.endsWith('?')).slice(0, 1);
    const firstQuestion = questionSentences[0];
    cleaned = [...nonQuestions, firstQuestion].join(' ').trim();
  }

  // Nếu câu hỏi ghép nhiều vế bằng ", và ... gì/nào/như thế nào?" thì tách chỉ giữ vế hỏi đầu tiên
  cleaned = cleaned.replace(
    /([^.!?]+?)\s*(?:,\s*và|\s+và)\s+(?:người mới ra trường|em biết điều đó từ đâu|dựa trên thông tin nào|điều nào quan trọng nhất|trong lĩnh vực)[^?]*\?/gi,
    '$1?'
  );

  return cleaned.trim();
}

/**
 * XÂY DỰNG PHẢN HỒI NỐI CÂU TỰ NHIÊN DỰA TRÊN CÂU TRẢ LỜI GẦN NHẤT CỦA HỌC SINH (MỤC 2, 3, 4, 5)
 * Đảm bảo:
 * - Diễn đạt lại ngắn gọn đúng ý học sinh vừa nói (không dùng "Thầy ghi nhận..." máy móc).
 * - Hỏi đúng 1 câu ngắn tiếp theo.
 * - Xử lý chuẩn xác các tình huống mẫu ở Mục 4 và trạng thái hoang mang ở Mục 5.
 */
export function buildNaturalContextualReply({
  userText = '',
  activeTopic = 'reasons',
  nextTopic = 'understanding',
  actionType = 'ask_next_topic', // 'distress' | 'pause' | 'follow_up_same_topic' | 'dont_know_next_topic' | 'ask_next_topic' | 'closing'
  followUpType = '',
  targetCareer = 'ngành này'
}) {
  const clean = (userText || '').trim();
  const lower = clean.toLowerCase();
  const uNorm = removeVietnameseTones(clean);

  // 1. Học sinh đang hoang mang / lo lắng / không hiểu (Mục 5)
  if (actionType === 'distress') {
    return 'Em chưa cần quyết định ngay lúc này. Điều gì vừa khiến em hoang mang nhất?';
  }

  // 2. Học sinh muốn tạm dừng phiên (Mục 5 & 6)
  if (actionType === 'pause') {
    return 'Mình có thể tạm dừng tại đây và lưu lại những nội dung đã trao đổi. Khi nào sẵn sàng, em có thể quay lại tiếp tục hoặc sang bước 3 để tìm hiểu thông tin nhé.';
  }

  // 3. Học sinh vừa chia sẻ nguyên nhân khiến mình hoang mang (sau lượt hỏi thăm)
  if (actionType === 'after_distress') {
    const nextQ = TOPIC_OPENING_QUESTIONS[nextTopic] || TOPIC_OPENING_QUESTIONS.understanding;
    if (isDontKnowResponse(clean)) {
      return `Mình có thể ghi lại điều này để tìm hiểu thêm ở bước 3. Em muốn mình tiếp tục trao đổi nhẹ nhàng câu tiếp theo hay tạm dừng lưu phiên tại đây?`;
    }
    return `Việc băn khoăn về điều đó là hoàn toàn dễ hiểu khi đứng trước lựa chọn ngành học. Mình có thể ghi lại điểm này để kiểm tra kỹ ở bước 3; bây giờ em có muốn trao đổi tiếp không: ${nextQ}`;
  }

  // 4. Học sinh trả lời "chưa biết" / "không biết" (Mục 4 & 6)
  if (actionType === 'dont_know_next_topic') {
    if (!nextTopic || nextTopic === 'completed') {
      return 'Mình có thể ghi lại điều này để tìm hiểu thêm ở bước 3. Em có thể xem lại bảng tóm tắt bên dưới trước khi lưu nhé.';
    }
    const nextQ = TOPIC_OPENING_QUESTIONS[nextTopic];
    return `Mình có thể ghi lại điều này để tìm hiểu thêm ở bước 3. ${nextQ}`;
  }

  // 5. Hỏi làm rõ thêm 1 câu ngắn trong cùng chủ đề (Mục 3 & 4)
  if (actionType === 'follow_up_same_topic') {
    // Ví dụ mẫu 1: "Em muốn chữa bệnh cho mẹ." -> "Em muốn có khả năng chăm sóc và chữa bệnh cho mẹ. Em đang hình dung mình làm công việc gì trong ngành này?"
    if (/chữa bệnh cho mẹ|chăm sóc mẹ|chữa bệnh cho bố|chữa bệnh cho gia đình|chữa bệnh cho người thân/i.test(lower)) {
      const targetPerson = lower.includes('mẹ') ? 'mẹ' : lower.includes('bố') ? 'bố' : 'người thân';
      return `Em muốn có khả năng chăm sóc và chữa bệnh cho ${targetPerson}. Em đang hình dung mình làm công việc gì trong ngành này?`;
    }

    if (followUpType === 'ask_imagined_work_in_field') {
      if (/mẹ|bố|ba mẹ|gia đình/i.test(lower)) {
        return `Gia đình là một động lực lớn trong lựa chọn của em. Khi nghĩ đến lĩnh vực ${targetCareer}, em đang hình dung mình sẽ làm công việc cụ thể gì?`;
      }
      return `Em đang hướng tới lĩnh vực ${targetCareer}. Em hình dung mình sẽ làm công việc cụ thể gì trong ngành này?`;
    }

    // Ví dụ mẫu 3: "Khó khăn lớn nhất là phải làm xuyên đêm." -> "Em đã nghĩ đến việc trực đêm. Em biết điều này từ đâu?"
    if (followUpType === 'ask_source_of_difficulty') {
      if (/xuyên đêm|trực đêm|thức đêm|ca đêm/i.test(lower)) {
        return 'Em đã nghĩ đến việc trực đêm. Em biết điều này từ đâu?';
      }
      if (/áp lực|vất vả|nhiều năm|học nặng|lâu năm/i.test(lower)) {
        return 'Em đã nghĩ đến áp lực học tập và làm việc của nghề. Em biết điều này từ đâu?';
      }
      return 'Em đã bước đầu hình dung về khó khăn của nghề. Em biết điều này từ đâu?';
    }

    if (followUpType === 'ask_concrete_difficulty') {
      if (isDontKnowResponse(clean)) {
        return `Mình có thể ghi lại lộ trình đào tạo để tìm hiểu thêm ở bước 3. ${TOPIC_OPENING_QUESTIONS.understanding}`;
      }
      return `Theo em, khó khăn đáng chú ý nhất khi làm nghề này là gì?`;
    }

    // Ví dụ mẫu 4: "Em nghĩ mình giỏi thì sẽ có nhiều cơ hội." -> "Theo em, ‘giỏi’ trong nghề này cần thể hiện ở năng lực nào?"
    if (followUpType === 'ask_what_gioi_means') {
      return "Theo em, 'giỏi' trong nghề này cần thể hiện ở năng lực nào?";
    }

    if (followUpType === 'ask_source_of_opportunity') {
      return 'Nhận định đó của em về cơ hội việc làm dựa trên thông tin từ đâu?';
    }

    if (followUpType === 'clarify_academic_preparation') {
      return 'Những kỹ năng đó rất hữu ích khi học và làm nghề. Vậy về các môn văn hóa xét tuyển, em cần chuẩn bị những gì để thi đậu vào ngành này?';
    }
  }

  // 6. Chuyển sang chủ đề tiếp theo với câu nối sát nội dung học sinh vừa nói (Mục 3 & 4)
  if (actionType === 'ask_next_topic') {
    // Ví dụ mẫu 2: "Em định học nội khoa." -> "Em đang hướng tới công việc bác sĩ nội khoa. Em đã tìm hiểu lộ trình đào tạo để làm công việc này chưa?"
    if (nextTopic === 'understanding') {
      if (/nội khoa/i.test(lower)) {
        return 'Em đang hướng tới công việc bác sĩ nội khoa. Em đã tìm hiểu lộ trình đào tạo để làm công việc này chưa?';
      }
      if (/ngoại khoa|nhi khoa|răng hàm mặt|đa khoa|dược|điều dưỡng|xét nghiệm/i.test(lower)) {
        const matchedRole = clean.replace(/^(dạ\s+|em\s+)?(định\s+|muốn\s+|hướng tới\s+)?(học\s+|làm\s+)?/i, '').replace(/[.!?]+$/, '').trim();
        return `Em đang hướng tới chuyên ngành ${matchedRole}. Em đã tìm hiểu lộ trình đào tạo và yêu cầu thực tế để làm công việc này chưa?`;
      }
      if (/^(không có|không ạ|dạ không|chỉ vậy thôi)/i.test(lower) || /(khong co ly do|chi co vay)/i.test(uNorm)) {
        return `Em giữ nguyên lý do lựa chọn ban đầu ở bước 1. ${TOPIC_OPENING_QUESTIONS.understanding}`;
      }
      if (/ba mẹ|bố mẹ|mẹ|gia đình/i.test(lower)) {
        return `Định hướng từ gia đình là một lý do quan trọng với em. ${TOPIC_OPENING_QUESTIONS.understanding}`;
      }
      return `Đó là lý do khiến em quan tâm đến ngành ${targetCareer}. ${TOPIC_OPENING_QUESTIONS.understanding}`;
    }

    if (nextTopic === 'opportunities') {
      const explicitSources = extractExplicitSources(clean);
      const sourceAck = explicitSources.length > 0
        ? `Em biết thông tin đó qua ${explicitSources[0].toLowerCase()}.`
        : 'Đó là góc nhìn hiện tại của em về thực tế công việc.';
      return `${sourceAck} ${TOPIC_OPENING_QUESTIONS.opportunities}`;
    }

    if (nextTopic === 'preparation') {
      return `Đó là những yếu tố em cho rằng cần có khi ra trường. ${TOPIC_OPENING_QUESTIONS.preparation}`;
    }
  }

  // 7. Kết thúc tự nhiên khi đã trao đổi qua các chủ đề
  return 'Cuộc trò chuyện vừa rồi đã giúp làm rõ hơn những điều em đã tìm hiểu và những khoảng trống thông tin cần tra cứu thêm. Em hãy kiểm tra lại bản tóm tắt bên dưới trước khi lưu và chuyển sang bước 3 nhé.';
}

const TOPIC_MARKERS = {
  reasons: /còn điều gì khiến em muốn chọn ngành/i,
  understanding: /khó khăn đáng chú ý nhất/i,
  opportunities: /cơ hội tìm việc/i,
  preparation: /cần chuẩn bị những gì để thi đậu/i
};

// Xác định chủ đề của một tin nhắn AI dựa trên câu hỏi trong đó
export function detectTopicFromAiText(text = '') {
  let found = null;
  let bestPos = -1;
  for (const key of INTERNAL_TOPICS) {
    const m = TOPIC_MARKERS[key].exec(text || '');
    if (m && m.index >= bestPos) { found = key; bestPos = m.index; }
  }
  return found;
}

// Suy ra kế hoạch hội thoại từ lịch sử khi client không gửi dialoguePlan (bản cache cũ)
export function inferPlanFromHistory(chatHistory = []) {
  const aiMsgs = (Array.isArray(chatHistory) ? chatHistory : []).filter(m => m && m.role !== 'user' && typeof m.text === 'string');
  const lastAi = aiMsgs[aiMsgs.length - 1];
  const topic = (lastAi && detectTopicFromAiText(lastAi.text)) || 'reasons';
  const idx = INTERNAL_TOPICS.indexOf(topic);
  if (idx >= INTERNAL_TOPICS.length - 1) {
    return { actionType: 'closing', activeTopic: topic, nextTopic: 'completed' };
  }
  return { actionType: 'ask_next_topic', activeTopic: topic, nextTopic: INTERNAL_TOPICS[idx + 1] };
}

function extractQuestion(text = '') {
  const sentences = (text || '').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  return sentences.filter(s => s.endsWith('?')).pop() || '';
}

// Chống lặp: nếu câu hỏi đã được AI hỏi trước đó, chuyển sang câu hỏi chủ đề chưa hỏi
export function avoidRepeatedQuestion(replyText, chatHistory = []) {
  const q = extractQuestion(replyText);
  if (!q) return { text: replyText, repeated: false };
  const aiTexts = (Array.isArray(chatHistory) ? chatHistory : [])
    .filter(m => m && m.role !== 'user' && typeof m.text === 'string')
    .map(m => m.text);
  if (!aiTexts.some(t => t.includes(q))) return { text: replyText, repeated: false };
  for (const key of INTERNAL_TOPICS) {
    const oq = TOPIC_OPENING_QUESTIONS[key];
    if (!aiTexts.some(t => t.includes(oq))) {
      return { text: `Mình ghi lại ý đó của em. ${oq}`, repeated: true, nextTopic: key };
    }
  }
  return {
    text: 'Cuộc trò chuyện vừa rồi đã giúp làm rõ hơn những điều em đã tìm hiểu và những khoảng trống thông tin cần tra cứu thêm. Em hãy kiểm tra lại bản tóm tắt bên dưới trước khi lưu và chuyển sang bước 3 nhé.',
    repeated: true,
    nextTopic: 'completed'
  };
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

    const { chatHistory, userMessage, dialoguePlan } = body || {};
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    const trimmedMsg = userMessage.trim();
    const serverTimestamp = new Date().toISOString();
    const studentProfile = body?.studentProfile || body?.userProfile || body?.anchor || {};
    const targetCareer = studentProfile?.shiftedMajor || studentProfile?.targetMajor || studentProfile?.targetCareer || 'ngành nghề mục tiêu';
    const targetSchool = studentProfile?.targetSchool || studentProfile?.targetUniversity || '';
    const reason = studentProfile?.reason || 'Chưa nêu chi tiết';

    const plan = (dialoguePlan && dialoguePlan.actionType) ? dialoguePlan : inferPlanFromHistory(chatHistory);
    const actionType = plan.actionType || 'ask_next_topic';
    const activeTopic = plan.activeTopic || 'reasons';
    const nextTopic = plan.nextTopic || 'understanding';
    const followUpType = plan.followUpType || '';

    // Với các tình huống nhạy cảm (hoang mang, tạm dừng, chưa biết, hoặc các mẫu câu nối chuẩn ở Mục 4),
    // ưu tiên phản hồi chuẩn xác để không bị AI hỏi dồn nhiều vế hoặc gán nhãn sai.
    const deterministicReply = buildNaturalContextualReply({
      userText: trimmedMsg,
      activeTopic,
      nextTopic,
      actionType,
      followUpType,
      targetCareer
    });

    if (
      actionType === 'distress' ||
      actionType === 'pause' ||
      actionType === 'after_distress' ||
      actionType === 'dont_know_next_topic' ||
      actionType === 'closing' ||
      followUpType === 'ask_concrete_difficulty' ||
      /chữa bệnh cho mẹ|nội khoa|xuyên đêm|trực đêm|giỏi thì sẽ có nhiều cơ hội/i.test(trimmedMsg)
    ) {
      const guarded = avoidRepeatedQuestion(deterministicReply, chatHistory);
      return res.status(200).json({
        success: true,
        workflowVersion: WORKFLOW_VERSION,
        serverTimestamp,
        actionType,
        activeTopic,
        nextTopic: guarded.nextTopic || nextTopic,
        response: guarded.text,
        reply: guarded.text,
        isComplete: actionType === 'closing' || guarded.nextTopic === 'completed',
        isCompleted: actionType === 'closing' || guarded.nextTopic === 'completed'
      });
    }

    // Với các câu trả lời mở khác, gọi Gemini với đầy đủ lịch sử hội thoại và chỉ thị "1 phản hồi ngắn + đúng 1 câu hỏi đơn ý"
    let replyText = null;
    try {
      const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
      const fallbackKey = Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8');
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || fallbackKey;
      const genAI = new GoogleGenerativeAI(apiKey);

      const targetQuestionHint = deterministicReply;

      const systemPrompt = `Bạn là trợ lý AI đối thoại hướng nghiệp của SocraCareer dành cho học sinh THPT.
THÔNG TIN BƯỚC 1:
- Ngành đang tìm hiểu: ${targetCareer}${targetSchool ? ` (${targetSchool})` : ''}
- Lý do ban đầu ở Bước 1: "${reason}"

QUY TẮC BẮT BUỘC:
1. Đọc kỹ câu trả lời gần nhất của học sinh: "${trimmedMsg}".
2. Câu đầu tiên: Diễn đạt lại ngắn gọn (1 câu) đúng ý cụ thể học sinh vừa nói.
   - TUYỆT ĐỐI KHÔNG bắt đầu bằng "Thầy ghi nhận...", "Bước sang chặng...", "Chặng 1/2/3/4".
   - KHÔNG tự nói học sinh đã có nguồn, đã hiểu yêu cầu hoặc đã có kế hoạch khi học sinh chưa nêu.
3. Câu thứ hai: Chỉ hỏi ĐÚNG MỘT câu ngắn gọn, đơn ý theo hướng sau:
   "${targetQuestionHint}"
   - TUYỆT ĐỐI KHÔNG ghép nhiều câu hỏi hay nhiều chữ "và ... gì/nào" trong một lượt.`;

      const validHistory = Array.isArray(chatHistory) ? chatHistory : [];
      const contents = validHistory
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

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.25,
          topP: 0.85,
          maxOutputTokens: 250
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Model timeout')), 5500)
      );

      const result = await Promise.race([
        model.generateContent({ contents }),
        timeoutPromise
      ]);

      const rawAiText = result?.response?.text();
      if (rawAiText && rawAiText.trim().length >= 15) {
        const cleanedAi = sanitizeSocraticResponse(rawAiText);
        // Nếu đang chuyển sang 1 trong 4 vòng nội dung tiếp theo (ask_next_topic), đảm bảo giữ đúng câu hỏi trọng tâm của vòng đó
        if (actionType === 'ask_next_topic') {
          const aiSentences = cleanedAi.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
          const firstAck = aiSentences.find(s => !s.endsWith('?'));
          const coreQuestion = deterministicReply.split(/(?<=[.!?])\s+/).filter(s => s.endsWith('?')).pop() || TOPIC_OPENING_QUESTIONS[nextTopic];
          replyText = firstAck ? `${firstAck} ${coreQuestion}` : deterministicReply;
        } else if (cleanedAi.endsWith('?')) {
          replyText = cleanedAi;
        }
      }
    } catch (e) {
      // Fallback sang deterministicReply
    }

    if (!replyText) {
      replyText = sanitizeSocraticResponse(deterministicReply);
    }

    const guardedFinal = avoidRepeatedQuestion(replyText, chatHistory);
    replyText = guardedFinal.text;

    return res.status(200).json({
      success: true,
      workflowVersion: WORKFLOW_VERSION,
      serverTimestamp,
      actionType,
      activeTopic,
      nextTopic: guardedFinal.nextTopic || nextTopic,
      response: replyText,
      reply: replyText,
      isComplete: actionType === 'closing' || guardedFinal.nextTopic === 'completed',
      isCompleted: actionType === 'closing' || guardedFinal.nextTopic === 'completed'
    });
  } catch (error) {
    console.error('Lỗi Socrates Chat Backend:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý máy chủ!' });
  }
}
