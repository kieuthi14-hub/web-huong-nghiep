import React, { useState, useEffect, useRef } from 'react';
import StepProgressHeader from '../../components/common/StepProgressHeader';

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
export function isVocationalTrack(career, userText = '') {
  const text = `${career || ''} ${userText || ''}`.toLowerCase();
  const vocationalKeywords = [
    'nấu ăn', 'đầu bếp', 'pha chế', 'barista', 'bếp', 'làm bánh', 'ẩm thực',
    'sửa xe', 'sửa chữa ô tô', 'sửa ô tô', 'cơ khí', 'điện lạnh', 'sửa điện thoại', 'thợ hàn', 'thợ tiện', 'thợ máy', 'thợ',
    'làm đẹp', 'spa', 'nail', 'móng', 'cắt tóc', 'tóc', 'barber', 'trang điểm', 'makeup', 'phun xăm',
    'lái xe', 'lái máy', 'may mặc', 'may thời trang',
    'học nghề', 'trung cấp nghề', 'trường nghề', 'cao đẳng nghề', 'học nghề ngắn hạn', 'nghề thực hành',
    'ngán kiến thức', 'ngán học', 'ngán lý thuyết', 'chán học', 'học dở', 'học dở các môn', 'sợ học', 'học không vô', 'không thích học chữ', 'chỉ thích thực hành', 'ngại học lý thuyết'
  ];
  return vocationalKeywords.some(k => text.includes(k));
}

// QUY TẮC 4: PHÂN LOẠI HÀNH VI (OUTCOME_CATEGORY) CHUẨN KHKT
export function evaluateOutcomeCategory(history = [], initialProfile = null, lastUserText = '', goalShift = null) {
  const initCareer = (initialProfile?.targetMajor || initialProfile?.target_career || '').toLowerCase().trim();
  const initIsVocational = isVocationalTrack(initCareer);

  let hasActualShift = false;
  let hasAwarenessShift = false;
  let hasResistance = false;

  const userMessages = history.filter(m => m.role === 'user').map(m => m.text);
  const allUserText = `${userMessages.join(' ')} ${lastUserText || ''}`.toLowerCase();

  // 1. Dịch chuyển mục tiêu sang ngành mới khác ngành ban đầu:
  if (goalShift && goalShift.newMajor && goalShift.newMajor.toLowerCase() !== initCareer) {
    hasActualShift = true;
  }

  // 2. Chuyển hướng từ Đại học sang Học nghề (khi ban đầu KHÔNG chọn học nghề):
  if (!initIsVocational && (
    allUserText.includes('học nghề') || 
    allUserText.includes('học nghề ngắn hạn') || 
    allUserText.includes('cao đẳng nghề') || 
    allUserText.includes('trung cấp nghề') || 
    allUserText.includes('thực hành nghề')
  )) {
    hasActualShift = true;
  }

  // 3. Tín hiệu THỰC SỰ thay đổi nhận thức, nhận ra rủi ro hoặc điều chỉnh phương án xét tuyển:
  const shiftPatterns = [
    'em sẽ đổi sang', 'em đổi sang', 'chuyển sang', 'đổi nguyện vọng', 'hạ nguyện vọng',
    'chọn trường vừa sức', 'chọn ngành vừa sức', 'xét học bạ thay vì', 'phương án dự phòng',
    'em nhận ra', 'em thấy rủi ro', 'nghĩ lại thì', 'thầy nói đúng', 'em sẽ cân nhắc lại',
    'em chưa lường trước', 'cần chuẩn bị thêm', 'cần rèn luyện thể lực', 'tập trung thi tốt nghiệp',
    'phải thi đỗ tốt nghiệp', 'phải cố gắng hơn', 'em sẽ điều chỉnh', 'suy nghĩ lại'
  ];
  if (shiftPatterns.some(p => allUserText.includes(p))) {
    hasAwarenessShift = true;
  }

  // 4. Tín hiệu phản kháng, né tránh hoặc bảo lưu thiếu căn cứ (Resistance):
  const resistancePatterns = [
    'không sao đâu', 'không quan tâm', 'mặc kệ', 'kệ', 'thầy cứ lo xa', 'lo xa quá',
    'em chắc chắn làm được', 'chẳng cần', 'không cần thi', 'không cần học', 'dễ mà',
    'chẳng có gì khó', 'học nghề cần gì học', 'em bảo lưu', 'không thay đổi', 'vẫn cứ thích',
    'không nghe', 'thầy phán sai'
  ];
  if (resistancePatterns.some(p => allUserText.includes(p))) {
    hasResistance = true;
  }

  // Đánh giá nhãn theo chuẩn KHKT:
  if (hasActualShift || hasAwarenessShift) {
    return {
      category: 'Adaptive_Shift',
      rule: 'Phân loại Dịch chuyển thích ứng (Adaptive Shift): Học sinh thực sự có chuyển biến nhận thức, nhận ra rủi ro hoặc chủ động điều chỉnh mục tiêu/phương án xét tuyển.'
    };
  }

  if (hasResistance) {
    return {
      category: 'Resistance_Observed',
      rule: 'Phân loại Ghi nhận phản kháng (Resistance Observed): Học sinh bảo lưu quan điểm ban đầu nhưng né tránh hoặc chưa đối diện trực tiếp với rủi ro/điều kiện thực tế.'
    };
  }

  return {
    category: 'Consistent_Stance',
    rule: 'Phân loại Kiên định lập trường (Consistent Stance): Học sinh duy trì mục tiêu ban đầu trên cơ sở hiểu rõ thách thức và có sự chuẩn bị thực tế.'
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

  const targetMajor = studentProfile?.target_career || studentProfile?.targetMajor || 'Sư phạm';
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

  // 4. QUY TẮC 1: XỬ LÝ BIẾN DỮ LIỆU ĐẦU VÀO (CHỐNG LỖI HIỂN THỊ CHUỖI RỖNG / "tại [chưa biết]")
  const isVocational = isVocationalTrack(effectiveCareer, userText);
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

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    let intro = '';
    if (sentences.length > 0) {
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
    const standardDirective = isVocational
      ? `Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${cleanSchoolName} để đối chiếu với hồ sơ của mình.`
      : `Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${cleanSchoolName} xem độ chênh lệch thực tế là bao nhiêu.`;

    return `${intro} ${standardDirective}`.trim();
  } else {
    // VÒNG 1, 2, 3: ĐẢM BẢO TỐI ĐA 2-3 CÂU VĂN VÀ KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN
    cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();

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
      if (isVocational) {
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
  const [sessionTelemetry, setSessionTelemetry] = useState(null);

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

    const hollandCode = userProfile?.hollandCode || anchor?.holland_code || anchor?.hollandCode || "AEI";
    const targetMajor = userProfile?.targetMajor || anchor?.target_career || anchor?.targetMajor || "Sư phạm";
    const targetSchool = userProfile?.targetSchool || anchor?.target_university || anchor?.targetSchool || "";
    const reason = userProfile?.reason || anchor?.source_of_influence || anchor?.reason || "Em thích từ nhỏ";
    const initialConfidence = userProfile?.initialConfidence ?? (anchor?.confidence_score ? Number(anchor.confidence_score) : 5);
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || "10 - 15 triệu/tháng";

    const resolvedProfile = {
      hollandCode,
      targetMajor,
      targetSchool,
      reason,
      initialConfidence,
      expectedIncome,
      // Tương thích ngược:
      target_career: targetMajor,
      target_university: targetSchool,
      confidence_score: String(initialConfidence),
      holland_code: hollandCode,
      expected_income: expectedIncome
    };
    setStudentProfile(resolvedProfile);

    let savedMessages = null;
    let savedCompleted = false;
    try {
      const rawMsgs = localStorage.getItem("cbas_step2_messages");
      if (rawMsgs) savedMessages = JSON.parse(rawMsgs);
      savedCompleted = localStorage.getItem("cbas_step2_completed") === "true";
    } catch (e) {}

    const isBranchB = isUndecidedOrVague(targetMajor);

    // LỜI CHÀO & CÂU HỎI MỞ ĐẦU CHUẨN BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES:
    let initialGreeting = '';
    const isVocationalInit = isVocationalTrack(targetMajor);
    const schoolClauseInit = isSchoolUndecided(targetSchool) 
      ? (isVocationalInit ? 'với định hướng tìm trường đào tạo nghề phù hợp' : 'với định hướng tìm cơ sở đào tạo phù hợp')
      : `tại **${targetSchool}**`;

    if (isBranchB) {
      // NHÁNH B: HỌC SINH MƠ HỒ, CHƯA CÓ MỤC TIÊU CỤ THỂ (ÁP DỤNG REFRAMING ĐỒNG CẢM)
      initialGreeting = `Chào em. Thầy hiểu ở thời điểm này, việc chưa chọn được một ngành cụ thể là tâm lý rất bình thường của nhiều học sinh lớp 12. Khi chưa có mục tiêu rõ ràng, đâu là điều khiến em băn khoăn nhất: là chưa hiểu rõ sở thích bản thân, hay đang lo lắng về năng lực học tập của mình?`;
    } else if (isVocationalInit) {
      // NHÁNH A - HỌC NGHỀ / THỰC HÀNH: TIẾP CẬN THỰC TẾ & KHÔNG ÁP ĐẶT ĐẠI HỌC
      initialGreeting = `Chào em. Em đã chọn hướng ngành **${targetMajor}** ${schoolClauseInit} với mức tự tin **${initialConfidence}/10** và lý do: '${reason}'. Thầy hiểu học nghề là một lựa chọn thực tế và có lộ trình việc làm rõ ràng. Khi tìm hiểu công việc thực tế hàng ngày của nghề này, em thấy điểm nào thu hút em nhất và đâu là điều em cảm thấy cần chuẩn bị kỹ nhất?`;
    } else {
      // NHÁNH A - ĐẠI HỌC / HỌC THUẬT: ĐỐI THOẠI TRUNG TÍNH, KHÔNG CHỤP MŨ
      initialGreeting = `Chào em. Em đã chọn ngành **${targetMajor}** ${schoolClauseInit} với mức tự tin **${initialConfidence}/10** và lý do: '${reason}'. Nhìn vào thực tế công việc chuyên môn hàng ngày của ngành này, em thấy điểm nào tương thích nhất với tính cách tự nhiên của em và đâu là điều em cảm thấy cần bứt phá nhất?`;
    }

    if (Array.isArray(savedMessages) && savedMessages.length > 0) {
      setMessages(savedMessages);
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      setMessages(initMsg);
      try { localStorage.setItem("cbas_step2_messages", JSON.stringify(initMsg)); } catch (e) {}
      setChatStage(1);
      setIsCompleted(false);
      setIsChatFinished(false);
    }
  }, []);

  // CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN KHKT - BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES (SOCRACAREER CORE PROMPT)
  const SOCRATIC_PERSONA = `
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
     + Đồng cảm trước: "Thầy hiểu cảm giác áp lực khi các môn lý thuyết không phải là thế mạnh của em...", "Thầy hiểu học nghề là một lựa chọn thực tế...", "Thầy hiểu việc chưa chọn được ngành ở lớp 12 là điều tự nhiên..."
     + Cung cấp sự thật khách quan: "Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực ca kíp, kỷ luật nghề..."
     + Một câu hỏi duy nhất: "Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?"

4. QUY TẮC "MỘT CÂU HỎI ĐƠN - KHÔNG GIẢNG BÀI - KHÔNG ĐƯA ĐÁP ÁN":
   - AI CHỈ ĐẶT CÂU HỎI, TUYỆT ĐỐI KHÔNG GIẢNG BÀI hay giải thích kiến thức tuyển sinh thay học sinh.
   - Mỗi lượt phản hồi chỉ được đưa ra TỐI ĐA 1-2 CÂU VĂN NHẬN ĐỊNH và KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN RÕ RÀNG (ở Vòng 1, 2, 3). TUYỆT ĐỐI KHÔNG HỎI KÉP, KHÔNG NHỒI 2-3 Ý.
   - Tuyệt đối không tự suy diễn số liệu điểm chuẩn, mọi số liệu đối chứng đẩy sang Bước 3 để học sinh tự tra cứu.

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
    const isVocational = isVocationalTrack(effectiveCareer, userText);
    const uni = formatSchoolName(rawSchool, isVocational);
    const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
    const askingCombo = isAskingAboutSubjectsOrCombos(userText);
    const lowerUser = (userText || '').toLowerCase();
    const careerLower = (effectiveCareer || '').toLowerCase();
    const recommendedCombo = getRecommendedComboForMajor(effectiveCareer, userText);

    const isFamilyOrAltruistic = ['ba mẹ', 'bố mẹ', 'cha mẹ', 'gia đình', 'chữa bệnh', 'từ nhỏ', 'từ bé', 'ước mơ từ nhỏ', 'thích từ nhỏ', 'giúp đỡ', 'cứu người', 'yêu trẻ', 'người thân', 'ông bà', 'hiếu thảo'].some(k => lowerUser.includes(k));
    const isMedicalCareer = ['bác sĩ', 'y khoa', 'y đa khoa', 'y dược', 'y tế', 'điều dưỡng', 'dược', 'dược học', 'nha khoa', 'răng hàm mặt'].some(k => careerLower.includes(k) || lowerUser.includes(k));
    const isVagueOrUncertain = ['không rõ', 'chưa rõ', 'không biết', 'chưa biết', 'chưa tìm hiểu', 'nghĩ vậy', 'cảm thấy', 'tùy'].some(k => lowerUser.includes(k));
    const isSalaryFocused = ['tiền', 'lương', 'thu nhập', 'giàu', 'kiếm tiền', 'kinh tế', 'triệu', 'ổn định'].some(k => lowerUser.includes(k));

    let adaptiveDirective = '';
    if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị') || lowerUser.includes('tin học')) {
      adaptiveDirective = `\n\n[CHỈ DẪN KHI HỌC SINH ĐỔI Ý / NÊU NGÀNH MỚI HOẶC HỎI TỔ HỢP]:\n` +
        `- Ngành học sinh đang hướng tới: "${effectiveCareer}".\n` +
        `- AI CHỈ ĐẶT CÂU HỎI, TUYỆT ĐỐI KHÔNG GIẢNG BÀI hay khẳng định cơ chế điểm chuẩn thay học sinh.\n` +
        `- Ở Lượt 3: Hỏi về môn tự tin nhất và môn lo lắng nhất từ học bạ thực tế.\n` +
        `- Ở Lượt 4: RA LỆNH học sinh tự sang Bước 3 chọn tổ hợp có lợi nhất từ học bạ để đối chứng điểm chuẩn của ${uni}.\n`;
    }

    const specialDirective = specialInstruction ? `\n\nCHỈ DẪN KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

    if (!isBranchB) {
      if (isVocational) {
        // =========================================================================
        // KỊCH BẢN PHÂN HÓA HỌC NGHỀ / THỰC HÀNH (TUÂN THỦ 2 NẤC NHẬN THỨC)
        // =========================================================================
        switch (round) {
          case 1:
            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (HỌC NGHỀ / THỰC HÀNH - ĐỘNG CƠ & SỰ PHÙ HỢP THỰC TẾ):
- Ngành nghề thực hành: ${effectiveCareer}
- Cơ sở đào tạo mục tiêu: ${uni}
- Mức tự tin ban đầu: ${score}/10
- Lý do chọn: "${reason}"

[NHIỆM VỤ LƯỢT 1]:
1. Đối thoại 1-2 câu trung tính, công nhận học nghề là một lựa chọn thực tế và có định hướng việc làm rõ ràng.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Thầy hiểu học nghề là một lựa chọn thực tế và có lộ trình việc làm rõ ràng. Khi tìm hiểu công việc thực tế hàng ngày của nghề này, em thấy đặc thù công việc có thực sự phù hợp với tính cách và năng lực hành động của em không?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG ép so sánh điểm chuẩn đại học hay xét tổ hợp môn phức tạp.
- TUYỆT ĐỐI KHÔNG dùng từ ngữ phán xét như "ảo tưởng", "chọn vì đám đông".
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

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
        // KỊCH BẢN NHÁNH A (ĐẠI HỌC / HỌC THUẬT)
        // ==========================================
        switch (round) {
          case 1:
            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (ĐỐI CHIẾU MÃ HOLLAND & ĐỘNG CƠ CHỌN NGÀNH):
- Nhóm thiên hướng Holland: ${holland}
- Ngành mong muốn: ${career}
- Trường đại học mục tiêu: ${uni}
- Mức tự tin ban đầu: ${score}/10
- Lý do chọn ngành: "${reason}"

[NHIỆM VỤ LƯỢT 1]:
1. Đối thoại tối đa 2 câu văn trung tính, điềm đạm.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi quá đà, không phán xét chụp mũ.
- TUYỆT ĐỐI KHÔNG nói về thu nhập, điểm chuẩn, tổ hợp môn hay Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", tối đa 2-3 câu văn.`;

          case 2:
            if (isMedicalCareer && isFamilyOrAltruistic) {
              return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (NGÀNH Y/BÁC SĨ - ĐỐI CHẤT ƯỚC MƠ HIẾU THẢO VỚI HIỆN THỰC ĐÀO TẠO KHỐC LIỆT):
- Ngành: ${career}, trường: ${uni}.
- Học sinh vừa chia sẻ động cơ tình cảm/gia đình: "${userText}".

[NHIỆM VỤ LƯỢT 2 - CẦU NỐI TỰ NHIÊN, TUYỆT ĐỐI KHÔNG QUAY XE SANG TIỀN LƯƠNG]:
1. Đồng cảm chân thành với tấm lòng hiếu thảo/ước mơ từ nhỏ muốn chữa bệnh cho ba mẹ.
2. TUYỆT ĐỐI KHÔNG hỏi về tiền lương khởi điểm hay "nhà tuyển dụng trả 15-20 triệu ngay khi ra trường" (vì ngành Y đào tạo 6 năm + 18 tháng thực hành lâm sàng, áp lực không nằm ở lương khởi điểm của nhà tuyển dụng tư nhân).
3. ĐỐI CHẤT VỚI HIỆN THỰC ĐÀO TẠO & SỨC BỀN: Ngành Y đòi hỏi tối thiểu 6 năm học đại học áp lực cực lớn, những đêm trực trắng tại bệnh viện và thêm 18 tháng thực hành lâm sàng áp lực sinh tử trước khi được cấp chứng chỉ hành nghề.
4. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Ước mơ chữa bệnh cho ba mẹ là một tấm lòng rất đáng quý. Nhưng ngành Y đòi hỏi tối thiểu 6 năm học đại học áp lực cực lớn, những đêm trực trắng tại bệnh viện và thêm 18 tháng thực hành lâm sàng trước khi có thể độc lập hành nghề. Khi nghĩ về chặng đường dài và nhiều áp lực sinh tử đó, điều gì khiến em tin mình có đủ sức bền và sự kiên trì để đi đến cùng?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG quay xe sang hỏi tiền lương hay nhà tuyển dụng.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;
            }

            if (isFamilyOrAltruistic) {
              return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (ĐỐI CHẤT ƯỚC MƠ CẢM XÚC VỚI HIỆN THỰC KHẮC NGHIỆT CỦA NGHỀ):
- Ngành: ${career}, trường: ${uni}.
- Học sinh vừa chia sẻ động cơ cảm xúc/gia đình/ước mơ từ nhỏ: "${userText}".

[NHIỆM VỤ LƯỢT 2 - CẦU NỐI TỰ NHIÊN, TUYỆT ĐỐI KHÔNG QUAY XE SANG TIỀN LƯƠNG]:
1. Công nhận vẻ đẹp của ước mơ/tình cảm đó một cách chân thành và điềm đạm.
2. TUYỆT ĐỐI KHÔNG quay xe đột ngột sang hỏi chuyện tiền bạc/nhà tuyển dụng trả bao nhiêu tiền.
3. Tạo cầu nối sang thực tế: Việc yêu thích cảm giác làm nghề rất khác với việc chịu đựng được những áp lực, góc khuất và tính kỷ luật khắt khe của công việc hàng ngày.
4. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Ước mơ từ nhỏ là một điểm tựa đẹp, nhưng việc yêu thích nghề rất khác với việc chịu đựng được những áp lực và góc khuất thực tế của công việc hàng ngày. Em đã tìm hiểu xem những khó khăn lớn nhất mà một người làm ngành này phải đối mặt là gì chưa?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG đổi chủ đề sang tiền bạc một cách đột ngột.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;
            }

            if (isVagueOrUncertain) {
              return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (ĐỐI CHẤT SỰ MƠ HỒ CẢM TÍNH VỚI NHU CẦU DỮ LIỆU THỰC TẾ):
- Ngành: ${career}, trường: ${uni}.
- Học sinh vừa thừa nhận sự mơ hồ/chưa rõ: "${userText}".

[NHIỆM VỤ LƯỢT 2 - CẦU NỐI MỀM MẠI]:
1. Ghi nhận sự thẳng thắn: Thừa nhận "chưa rõ" là một khởi đầu tốt để bắt đầu tìm hiểu nghiêm túc.
2. Tạo cầu nối: Nếu chọn nghề chỉ dựa vào cảm tính mà chưa từng tìm hiểu công việc thực tế hay hỏi người trong nghề, rủi ro vỡ mộng khi bước vào trường đại học sẽ rất lớn.
3. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Sự thẳng thắn thừa nhận 'chưa rõ' là một khởi đầu tốt. Nhưng nếu chọn nghề chỉ theo cảm tính mà chưa từng đối chiếu với công việc thực tế hay hỏi chuyện người trong nghề, rủi ro vỡ mộng sẽ rất lớn. Em nghĩ điều gì đang cản trở em tìm hiểu sâu hơn về ngành này?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG dùng từ ngữ phán xét.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;
            }

            return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (BÓC TÁCH MÂU THUẪN GIỮA KỲ VỌNG THU NHẬP & NĂNG LỰC THỰC TẾ):
- Ngành: ${career}, trường: ${uni}.
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2 - QUY TẮC CÂU HỎI ĐƠN]:
1. Phản hồi ngắn gọn (tối đa 1-2 câu), bắt nhịp tự nhiên từ câu trả lời của học sinh rồi mới chuyển tiếp sang yêu cầu năng lực thực tế để đạt mức thu nhập ${expectedIncome}.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN (TUYỆT ĐỐI KHÔNG HỎI KÉP):
"Em dựa vào năng lực chuyên môn thực tế nào của bản thân để tin rằng nhà tuyển dụng sẽ sẵn sàng trả mức thu nhập ${expectedIncome} ngay khi em vừa tốt nghiệp?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG hỏi dồn 2-3 ý.
- TUYỆT ĐỐI KHÔNG giảng bài, không phán xét chụp mũ ("em đang ảo tưởng...").
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

          case 3:
            return `${SOCRATIC_PERSONA}${specialDirective}${adaptiveDirective}
BỐI CẢNH VÒNG 3 (BÓC TÁCH MÂU THUẪN HỌC LỰC & MÔN XÉT TUYỂN):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${uni}
- Học sinh vừa phản hồi: "${userText}"

[NHIỆM VỤ LƯỢT 3 - TUÂN THỦ NGUYÊN TẮC CHỈ HỎI, KHÔNG GIẢNG BÀI]:
1. Ghi nhận chừng mực thế mạnh hoặc băn khoăn của học sinh nếu có. Tuyệt đối không phán xét tiêu cực.
2. TUYỆT ĐỐI KHÔNG GIẢNG BÀI về chương trình GDPT 2018, không tự phỏng đoán nhân hệ số 2 hay điều kiện chuẩn của trường.
3. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN để học sinh tự soi lại năng lực học bạ của mình:
"Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG giảng giải lý thuyết tuyển sinh hay phân tích đề án trường.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 ở lượt này.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

          case 4:
          default:
            return `${SOCRATIC_PERSONA}${specialDirective}${adaptiveDirective}
BỐI CẢNH VÒNG 4 (BÓC TÁCH MÂU THUẪN TUYỂN SINH & ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${uni}
- Học sinh vừa trả lời về môn học: "${userText}"

[NHIỆM VỤ LƯỢT 4 - ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ]:
1. Đưa ra đúng 1 câu nhận định trung tính: Việc tự tin ở môn thế mạnh là điểm tựa tốt, nhưng điểm chuẩn cạnh tranh vào ngành ${effectiveCareer} ${schoolClause} đòi hỏi sự chắc chắn của toàn bộ tổ hợp xét tuyển thực tế.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC (TUYỆT ĐỐI KHÔNG CÓ DẤU ? VÀ KHÔNG NHẮC ĐẾN HỌC PHÍ):
"Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${uni} xem độ chênh lệch thực tế là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
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
    const career = profile?.targetMajor || profile?.target_career || "Sư phạm";
    const rawSchool = profile?.targetSchool || profile?.target_university || "";
    const holland = profile?.hollandCode || profile?.holland_code || "AEI";
    const reason = profile?.reason || profile?.source_of_influence || "Em thích từ nhỏ";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    const goalShift = detectGoalShift(userText);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== career.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : (profile?.shiftedMajor || career);
    const isVocational = isVocationalTrack(effectiveCareer, userText);
    const uni = formatSchoolName(rawSchool, isVocational);
    const schoolClause = formatSchoolClause(rawSchool, isVocational, 'tại ');
    const lowerUser = (userText || '').toLowerCase();
    const isBalancedGrades = lowerUser.includes('học đều') || lowerUser.includes('đều đều') || lowerUser.includes('như nhau');

    if (specialInstruction) {
      return `Rào cản về kỹ năng hay tâm lý hoàn toàn có thể cải thiện được nếu có phương pháp phù hợp. Nếu phải đối diện với tình huống này thường xuyên trong thực tế nghề nghiệp, em dựa vào năng lực gì để khắc phục và vượt qua?`;
    }

    if (!isBranchB) {
      if (isVocational) {
        // Fallback cho hướng học nghề / thực hành
        switch (round) {
          case 1:
            return `Em đã chọn hướng ngành ${effectiveCareer} ${schoolClause} với lý do: '${reason}'. Thầy hiểu học nghề là một lựa chọn thực tế và có lộ trình việc làm rõ ràng. Khi tìm hiểu công việc thực tế hàng ngày của nghề này, em thấy đặc thù công việc có thực sự phù hợp với tính cách và năng lực hành động của em không?`;

          case 2:
            return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Thị trường quả thực thiếu nhân lực tay nghề cao, nhưng mức thu nhập luôn gắn liền với tay nghề thực tế và khả năng chịu được áp lực môi trường làm việc (như đứng liên tục nhiều giờ, chịu nhiệt độ, áp lực thời gian và ca kíp). Để đạt được mục tiêu đó, em đã chuẩn bị gì cho kỳ thi tốt nghiệp sắp tới và sức bền thể lực cho công việc này?`;

          case 3:
            return `Học nghề không đồng nghĩa với việc có thể buông xuôi việc học lớp 12, vì các trường nghề uy tín đều yêu cầu điều kiện tiên quyết: phải thi đỗ Tốt nghiệp THPT và đạt chuẩn học bạ. Nhìn lại sức học hiện tại của mình, em đã có kế hoạch ôn thi thế nào để đảm bảo tấm bằng tốt nghiệp THPT làm tấm vé vào trường nghề?`;

          case 4:
          default:
            return `Học nghề là một hướng đi thực tế, nhưng bằng tốt nghiệp THPT và sự rèn luyện thể lực là điều kiện tiên quyết. Em hãy bước sang Bước 3, tự tay kiểm tra điều kiện xét tuyển học bạ, chỉ tiêu và tiêu chuẩn đầu vào của ${uni} để đối chiếu với hồ sơ của mình.`;
        }
      } else {
        // Fallback cho hướng Đại học / Học thuật
        switch (round) {
          case 1:
            return `Em đã chọn ngành ${effectiveCareer} ${schoolClause} với lý do: '${reason}'. Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;

          case 2: {
            const isFamily = ['ba mẹ', 'bố mẹ', 'cha mẹ', 'gia đình', 'chữa bệnh', 'từ nhỏ', 'từ bé', 'ước mơ từ nhỏ', 'thích từ nhỏ', 'giúp đỡ', 'cứu người', 'yêu trẻ', 'hiếu thảo'].some(k => lowerUser.includes(k));
            const isMed = ['bác sĩ', 'y khoa', 'y đa khoa', 'y dược', 'y tế', 'điều dưỡng', 'dược'].some(k => effectiveCareer.toLowerCase().includes(k) || lowerUser.includes(k));
            const isVague = ['không rõ', 'chưa rõ', 'không biết', 'chưa biết', 'chưa tìm hiểu', 'nghĩ vậy', 'cảm thấy', 'tùy'].some(k => lowerUser.includes(k));

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

          case 3:
            return `Để xét tuyển vào ngành ${effectiveCareer} ${schoolClause}, nhìn lại học bạ và sức học thực tế của mình, đâu là môn em tự tin nhất và môn nào khiến em lo lắng nhất?`;

          case 4:
          default: {
            const { strongSubject, weakSubject } = extractSubjectsFeedback(userText);
            if (isBalancedGrades) {
              return `Học đều các môn là một nền tảng tốt, nhưng điểm chuẩn vào ngành ${effectiveCareer} ${schoolClause} đòi hỏi điểm số bứt phá ở tổ hợp xét tuyển. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${uni} xem độ chênh lệch thực tế là bao nhiêu.`;
            }

            if (strongSubject && weakSubject) {
              return `Thế mạnh ở môn ${strongSubject} là điểm tựa tốt, nhưng môn ${weakSubject} nếu chưa đạt yêu cầu sẽ là rào cản khi xét tuyển vào ngành ${effectiveCareer} ${schoolClause}. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${uni} xem độ chênh lệch thực tế là bao nhiêu.`;
            }

            if (strongSubject && !weakSubject) {
              return `Môn ${strongSubject} là một điểm tựa, nhưng điểm chuẩn ngành ${effectiveCareer} ${schoolClause} đòi hỏi cả tổ hợp xét tuyển phải đạt ngưỡng an toàn. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${uni} xem độ chênh lệch thực tế là bao nhiêu.`;
            }

            return `Để biết năng lực thực tế có đáp ứng được ngưỡng tuyển sinh của ngành ${effectiveCareer} ${schoolClause} hay không, em cần đối chứng với dữ liệu thực tế. Em hãy bước sang Bước 3, tự tay chọn tổ hợp môn có lợi nhất từ học bạ của mình để đối chứng với điểm chuẩn 3 năm gần nhất của ${uni} xem độ chênh lệch thực tế là bao nhiêu.`;
          }
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
    const curMajor = studentProfile?.targetMajor || studentProfile?.target_career || 'Sư phạm';
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
        initialConfidence: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        expectedIncome: studentProfile?.expectedIncome || studentProfile?.expected_income || '10 - 15 triệu/tháng',
        // Tương thích ngược:
        targetCareer: effectiveMajor,
        confidenceT0: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        competenceSelfEval: 'Vừa sức'
      },
      userProfile: {
        hollandCode: studentProfile?.hollandCode || studentProfile?.holland_code || 'RIASEC',
        targetMajor: effectiveMajor,
        targetSchool: studentProfile?.targetSchool || studentProfile?.target_university || '',
        reason: studentProfile?.reason || studentProfile?.source_of_influence || 'Em thích từ nhỏ',
        initialConfidence: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        expectedIncome: studentProfile?.expectedIncome || studentProfile?.expected_income || '10 - 15 triệu/tháng'
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

    const targetCareer = userProfile?.targetMajor || anchor?.target_career || studentProfile?.targetMajor || studentProfile?.target_career || 'Sư phạm';
    const rawUniv = userProfile?.targetSchool || anchor?.target_university || studentProfile?.targetSchool || studentProfile?.target_university || '';
    const isVocationalExport = isVocationalTrack(targetCareer);
    const targetUniv = formatSchoolName(rawUniv, isVocationalExport);
    const confidence = userProfile?.initialConfidence ?? anchor?.confidence_score ?? studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? '5';
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || studentProfile?.expectedIncome || '10 - 15 triệu/tháng';
    const reason = userProfile?.reason || anchor?.source_of_influence || studentProfile?.reason || 'Em thích từ nhỏ';
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

    if (sessionTelemetry) {
      content += `-----------------------------------------------------------------\n`;
      content += `KẾT QUẢ ĐO LƯỜNG VÀ GẮN NHÃN HÀNH VI (QUY CHUẨN KHKT):\n`;
      content += `-----------------------------------------------------------------\n`;
      content += `- Turning_Point_Detected: ${sessionTelemetry.turning_point_detected}\n`;
      content += `  * Quy tắc kích hoạt: ${sessionTelemetry.turning_point_rule || 'Phát hiện khi học sinh bộc lộ động cơ ngoại tại (áp lực gia đình, tài chính), tự ti năng lực môn học, hoặc có tín hiệu dịch chuyển mục tiêu ngành.'}\n`;
      content += `- Outcome_Category: ${sessionTelemetry.outcome_category}\n`;
      content += `  * Quy tắc kích hoạt: ${sessionTelemetry.outcome_rule || (sessionTelemetry.outcome_category === 'Adaptive_Shift' ? 'Học sinh thực sự có chuyển biến nhận thức, nhận ra rủi ro hoặc điều chỉnh mục tiêu/phương án xét tuyển.' : 'Học sinh kiên định với mục tiêu sau khi đã đối diện với thách thức và điều chuẩn nhận thức.')}\n`;
      content += `- Triage_Step4: ${sessionTelemetry.triage_step4}\n`;
      content += `  * Quy tắc kích hoạt: ${sessionTelemetry.triage_rule || (sessionTelemetry.triage_step4?.includes('In-depth') ? 'Chỉ định tham vấn sâu 20 phút do có biến động nhận thức (Turning Point) hoặc dịch chuyển mục tiêu cần cố vấn can thiệp.' : 'Chỉ định phiên định hướng nhanh 5 phút do nhận thức thực tế đã tương đối vững vàng.')}\n\n`;
    }

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
      localStorage.removeItem("cbas_step2_messages");
      localStorage.removeItem("cbas_step2_round");
      localStorage.removeItem("cbas_step2_completed");
      localStorage.removeItem("cbas_step2_telemetry");
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

          // Tính toán Telemetry chuẩn KHKT (SocraCareer):
          let tpDetected = false;
          let tpRound = 'Không';
          let userTurnCount = 0;

          updatedHistory.forEach((m) => {
            if (m.role === 'user') {
              userTurnCount++;
              const lower = m.text.toLowerCase();
              const isExtrinsic = ['bố mẹ', 'ba mẹ', 'cha mẹ', 'gia đình', 'tiền', 'thu nhập', 'dạy thêm', 'kiếm tiền', 'trào lưu', 'hot', 'ổn định', 'bắt ép'].some(k => lower.includes(k));
              const isInsecureOrWeak = ['chưa', 'lo', 'sợ', 'áp lực', 'không biết', 'khó', 'đuối', 'kém', 'yếu', 'dốt', 'thấp', 'mất gốc', 'tệ', 'không giỏi', 'không chắc'].some(k => lower.includes(k));
              const isComboIssue = ['chưa tìm hiểu', 'chưa biết tổ hợp', 'chưa định hình', 'đều đều', 'deu deu', 'trung bình', 'ngang nhau', 'bằng nhau', 'không có môn nổi trội'].some(k => lower.includes(k));
              const isGoalShiftTurn = Boolean(detectGoalShift(m.text));

              if (isExtrinsic || isInsecureOrWeak || isComboIssue || isGoalShiftTurn) {
                if (!tpDetected) {
                  tpDetected = true;
                  tpRound = `Giai đoạn ${Math.min(userTurnCount, 4)}`;
                }
              }
            }
          });

          // QUY TẮC 4: PHÂN LOẠI HÀNH VI (OUTCOME_CATEGORY) CHUẨN KHKT
          const outcomeAnalysis = evaluateOutcomeCategory(updatedHistory, studentProfile, cleanText, goalShift);
          const outcome = outcomeAnalysis.category;
          const outcomeRule = outcomeAnalysis.rule;

          // Phân luồng Tham vấn Bước 4:
          const isNeedInDepth = tpDetected || outcome === 'Adaptive_Shift' || outcome === 'Resistance_Observed';
          const triage = isNeedInDepth ? 'In-depth (20 phút)' : 'Fast-track (5 phút)';

          const tpRule = tpDetected 
            ? `Phát hiện điểm xoay nhận thức tại ${tpRound}: học sinh bộc lộ áp lực/động cơ ngoại tại hoặc thừa nhận rào cản năng lực thực tế.`
            : 'Không phát hiện điểm xoay đột ngột: học sinh giữ lập trường tự tin ổn định qua các vòng phản tư.';

          const triageRule = isNeedInDepth
            ? 'Phân luồng Tham vấn Chuyên sâu (In-depth 20 phút): Do có biến động nhận thức (Turning Point), phản kháng hoặc dịch chuyển mục tiêu cần cố vấn can thiệp.'
            : 'Phân luồng Rà soát Nhanh (Fast-track 5 phút): Học sinh kiên định lập trường, tâm thế vững vàng, chỉ cần rà soát nhanh phương án đối chứng.';

          const telemetryData = {
            turning_point_detected: tpDetected ? `True (${tpRound})` : 'False',
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
        title="Bước 2: AI Tham Vấn Phản Tư (Socratic Agent)" 
        subtitle="Đối thoại phản biện cùng Trợ lý AI để bóc tách điểm mù tư duy và bẫy tâm lý chọn nghề." 
      />
      
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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
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

            {sessionTelemetry ? (
              <div style={{ marginTop: '12px', marginBottom: '14px', paddingTop: '12px', borderTop: '1px dashed #a7f3d0' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  📊 KẾT QUẢ ĐO LƯỜNG & GẮN NHÃN HÀNH VI (QUY CHUẨN THỰC NGHIỆM KHKT):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '9px 12px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e40af', marginBottom: '3px' }}>
                      📌 Turning Point: {sessionTelemetry.turning_point_detected}
                    </div>
                    <div style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: '1.4' }}>
                      <strong>Tiêu chí kích hoạt:</strong> {sessionTelemetry.turning_point_rule || 'Phát hiện khi học sinh bộc lộ động cơ ngoại tại (áp lực gia đình, tài chính), tự ti năng lực môn học, hoặc có tín hiệu dịch chuyển mục tiêu ngành.'}
                    </div>
                  </div>

                  <div style={{ 
                    background: sessionTelemetry.outcome_category === 'Adaptive_Shift' ? '#f0fdf4' : (sessionTelemetry.outcome_category === 'Resistance_Observed' ? '#fffbeb' : '#eff6ff'), 
                    border: `1px solid ${sessionTelemetry.outcome_category === 'Adaptive_Shift' ? '#bbf7d0' : (sessionTelemetry.outcome_category === 'Resistance_Observed' ? '#fde68a' : '#bfdbfe')}`, 
                    borderRadius: '8px', 
                    padding: '9px 12px' 
                  }}>
                    <div style={{ 
                      fontSize: '12.5px', 
                      fontWeight: '700', 
                      color: sessionTelemetry.outcome_category === 'Adaptive_Shift' ? '#166534' : (sessionTelemetry.outcome_category === 'Resistance_Observed' ? '#92400e' : '#1e40af'), 
                      marginBottom: '3px' 
                    }}>
                      🏷️ Phân loại: {sessionTelemetry.outcome_category}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: sessionTelemetry.outcome_category === 'Adaptive_Shift' ? '#14532d' : (sessionTelemetry.outcome_category === 'Resistance_Observed' ? '#78350f' : '#1e3a8a'), 
                      lineHeight: '1.4' 
                    }}>
                      <strong>Tiêu chí kích hoạt:</strong> {sessionTelemetry.outcome_rule || (sessionTelemetry.outcome_category === 'Adaptive_Shift' ? 'Học sinh thực sự có chuyển biến nhận thức, nhận ra rủi ro hoặc điều chỉnh mục tiêu/phương án xét tuyển.' : 'Học sinh kiên định với mục tiêu sau khi đã đối diện với thách thức và điều chuẩn nhận thức.')}
                    </div>
                  </div>

                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '9px 12px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#6b21a8', marginBottom: '3px' }}>
                      ⏱️ Phân luồng Bước 4: {sessionTelemetry.triage_step4}
                    </div>
                    <div style={{ fontSize: '11px', color: '#581c87', lineHeight: '1.4' }}>
                      <strong>Tiêu chí kích hoạt:</strong> {sessionTelemetry.triage_rule || (sessionTelemetry.triage_step4?.includes('In-depth') ? 'Chỉ định tham vấn sâu 20 phút do có biến động nhận thức (Turning Point) hoặc dịch chuyển mục tiêu cần cố vấn can thiệp.' : 'Chỉ định phiên định hướng nhanh 5 phút do nhận thức thực tế đã tương đối vững vàng.')}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

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

    </div>
  );
}

export { Step2SocraticAgent };
