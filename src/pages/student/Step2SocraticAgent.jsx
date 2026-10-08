import React, { useState, useEffect, useRef } from 'react';
import StepProgressHeader from '../../components/common/StepProgressHeader';

// HÀM KIỂM TRA HỌC SINH MƠ HỒ / CHƯA CÓ MỤC TIÊU CỤ THỂ (ĐỂ KÍCH HOẠT NHÁNH B)
export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
}

// HÀM XÁC ĐỊNH TỔ HỢP MÔN THAM CHIẾU THEO NGÀNH HỌC (CHUẨN BỘ NGUYÊN TẮC SOCRATES NGUYÊN TẮC 4)
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

// BỘ LỌC PHẢN XẠ TỰ NHIÊN TRƯỚC KHI CHẠY MÁY TRẠNG THÁI (NATURAL REFLEX FILTER)
export function processStudentMessage(message, chatStage, studentProfile) {
  const lowerMsg = (message || '').toLowerCase().trim();
  const cleanGreeting = lowerMsg.replace(/[!.,?~]/g, '');

  const targetMajor = studentProfile?.target_career || studentProfile?.targetMajor || 'Sư phạm';
  const targetUniv = studentProfile?.target_university || studentProfile?.targetSchool || 'ĐH Quy Nhơn';
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

  // 1.3. Tiếp tục đối thoại với AI Cognitive Agent theo BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES
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

  // 2. BỘ NGUYÊN TẮC 1: TUYỆT ĐỐI CẤM KHEN NGỢI, XOA DỊU
  const praisePatterns = [
    /^(Thầy\s+(rất\s+)?(ghi nhận|thấu cảm|thấu hiểu|hoan nghênh|khen ngợi|ủng hộ|đánh giá cao)|rất\s+(tuyệt vời|đáng khen|hoan nghênh|đáng khích lệ)|góc nhìn rất tiến bộ|thầy\s+chúc mừng|chúc mừng em)[^.!?\n]*[.!?]\s*/i,
    /(Thầy\s+(rất\s+)?(ghi nhận|thấu cảm|thấu hiểu|hoan nghênh|khen ngợi|ủng hộ|đánh giá cao)|rất\s+(tuyệt vời|đáng khen|hoan nghênh|đáng khích lệ)|góc nhìn rất tiến bộ|thầy\s+chúc mừng)[^.!?\n]*[.!?]\s*/gi
  ];
  praisePatterns.forEach(rx => {
    cleaned = cleaned.replace(rx, '').trim();
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
      intro = `Ngành ${major} tại ${school} đòi hỏi điểm số đồng đều của các môn trong tổ hợp xét tuyển (${combo}), việc chỉ có thế mạnh ở một môn không bảo đảm an toàn nếu các môn còn lại bị đuối sức.`;
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
    const targetSchool = userProfile?.targetSchool || anchor?.target_university || anchor?.targetSchool || "ĐH Quy Nhơn";
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
    if (isBranchB) {
      // NHÁNH B: HỌC SINH MƠ HỒ, CHƯA CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Việc chọn ngành theo số đông mà không rõ năng lực bản thân sẽ dẫn đến việc lãng phí nhiều năm học tập và làm việc sau này. Nếu chưa biết mình thực sự muốn gì, dựa vào đâu em tin rằng mình sẽ không hối hận khi chọn một ngành chỉ vì người khác khen ngợi?`;
    } else {
      // NHÁNH A: HỌC SINH ĐÃ CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Em đã chọn ngành **${targetMajor}** tại **${targetSchool}** với mức tự tin **${initialConfidence}/10** và lý do: '${reason}'. Công việc chuyên môn thực tế hàng ngày của ngành này có thực sự tương thích với đặc thù tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang được số đông khen ngợi?`;
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

  // CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN CBAS - BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES (SOCRACAREER CORE PROMPT)
  const SOCRATIC_PERSONA = `
BẠN LÀ THẦY SOCRATES - TRIẾT GIA PHẢN BIỆN HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC CBAS (VISEF 2026).
Bạn đang thực hiện phiên đối thoại phản tư 1-1 với một học sinh THPT nhằm bóc tách thiên kiến nhận thức và mỏ neo nghề nghiệp.

BỘ NGUYÊN TẮC PHẢN TƯ SOCRATES (SOCRACAREER CORE PROMPT - BẮT BUỘC TUÂN THỦ 100%):

1. TUYỆT ĐỐI KHÔNG KHEN NGỢI, KHÔNG XOA DỊU:
   - CẤM các mẫu câu: "Thầy rất thấu hiểu", "Thầy ghi nhận", "Góc nhìn rất tiến bộ", "Rất tuyệt vời", "Thầy hoan nghênh", "Thầy khen ngợi", "Thầy ủng hộ", "Rất đáng khích lệ", "vũ khí điểm số", "điểm sáng", "bước tiến bộ"...
   - Giữ văn phong trung tính, điềm đạm, sắc sảo của một triết gia phản biện. Không khen ngợi, không vuốt ve cảm xúc.

2. QUY TẮC "MỘT CÂU HỎI TRUY VẤN - KHÔNG ĐƯA ĐÁP ÁN":
   - Mỗi lượt phản hồi chỉ được đưa ra TỐI ĐA 2-3 CÂU VĂN và KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN (ở Vòng 1, 2, 3).
   - Tuyệt đối không giải thích thay, KHÔNG vạch sẵn chiến lược thay học sinh (CẤM đưa ra các tầng nấc Tầng 1, Tầng 2, Tầng 3).

3. KỸ THUẬT BÓC TÁCH MÂU THUẪN (ELENCHUS):
   - Nếu học sinh nói mông lung: Hỏi xoáy vào bằng chứng cụ thể.
   - Nếu học sinh tự tin ảo: Đem mâu thuẫn giữa kỳ vọng (thu nhập cao, ngành hot) và thực tế (chưa biết chuyên môn, môn thi xét tuyển, học lực) để buộc học sinh tự đối diện.

4. ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ (CHỈ Ở LƯỢT 4):
   - Ở lượt cuối cùng (Lượt 4), TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi (không có dấu ?), không tự đọc số liệu điểm chuẩn, mà ra lệnh dứt khoát:
     "Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp [Tổ hợp môn] của [Trường mục tiêu] 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu."
`;

  const generatePromptForRound = (round, profile, userText, specialInstruction = null) => {
    const career = profile?.targetMajor || profile?.target_career || "ngành đã chọn";
    const uni = profile?.targetSchool || profile?.target_university || "trường đại học mục tiêu";
    const score = profile?.initialConfidence ?? profile?.confidence_score ?? "5";
    const holland = profile?.hollandCode || profile?.holland_code || "RIASEC";
    const reason = profile?.reason || profile?.source_of_influence || "Em thích từ nhỏ";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    // Nhận diện chuyển biến mục tiêu / thắc mắc ngành mới từ tin nhắn học sinh
    const goalShift = detectGoalShift(userText);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== career.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : (profile?.shiftedMajor || career);
    const askingCombo = isAskingAboutSubjectsOrCombos(userText);
    const lowerUser = (userText || '').toLowerCase();
    const recommendedCombo = getRecommendedComboForMajor(effectiveCareer, userText);

    let adaptiveDirective = '';
    if (isShifted || askingCombo || lowerUser.includes('ktpl') || lowerUser.includes('chính trị')) {
      adaptiveDirective = `\n\n[CHỈ DẪN KHI HỌC SINH ĐỔI Ý / NÊU NGÀNH MỚI HOẶC HỎI TỔ HỢP]:\n` +
        `- Ngành học sinh đang hướng tới: "${effectiveCareer}".\n` +
        `- Tổ hợp xét tuyển tham chiếu: ${recommendedCombo}.\n` +
        `- TUYỆT ĐỐI KHÔNG khen ngợi hay xoa dịu. Không tự vạch ra các Tầng 1, Tầng 2, Tầng 3.\n` +
        `- Ở Lượt 3: Đối chất mâu thuẫn giữa yêu cầu tổ hợp ${recommendedCombo} và học lực thực tế.\n` +
        `- Ở Lượt 4: Nhận định rủi ro chênh lệch điểm chuẩn và RA LỆNH học sinh tự sang Bước 3 tra cứu tổ hợp ${recommendedCombo} của ${uni}.\n`;
    }

    const specialDirective = specialInstruction ? `\n\nCHỈ DẪN KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

    if (!isBranchB) {
      // ==========================================
      // KỊCH BẢN NHÁNH A (ĐÃ CÓ MỤC TIÊU CỤ THỂ)
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
- TUYỆT ĐỐI KHÔNG khen ngợi, không xoa dịu ("Thầy rất thấu hiểu", "Thầy ghi nhận", "Rất tuyệt vời"...).
- TUYỆT ĐỐI KHÔNG nói về thu nhập, điểm chuẩn, tổ hợp môn hay Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", tối đa 2-3 câu văn.`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (BÓC TÁCH MÂU THUẪN THU NHẬP & KỶ NGUYÊN AI):
- Ngành: ${career}, trường: ${uni}.
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 2]:
1. Phản hồi tối đa 2 câu văn trung tính, bóc tách mâu thuẫn giữa kỳ vọng ${expectedIncome} và áp lực cạnh tranh.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Trong bối cảnh AI và tự động hóa cạnh tranh gay gắt, em dựa vào năng lực chuyên môn vượt trội nào để nhà tuyển dụng trả cho em mức thu nhập đó ngay khi mới tốt nghiệp?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi hay xoa dịu.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

        case 3:
          return `${SOCRATIC_PERSONA}${specialDirective}${adaptiveDirective}
BỐI CẢNH VÒNG 3 (BÓC TÁCH MÂU THUẪN TỔ HỢP MÔN & HỌC LỰC THỰC TẾ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${uni}
- Tổ hợp môn tham chiếu: ${recommendedCombo}
- Học sinh vừa phản hồi: "${userText}"

[NHIỆM VỤ LƯỢT 3]:
1. Phản hồi tối đa 2 câu văn trung tính về thực tế tuyển sinh.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${effectiveCareer} tại ${uni}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?"

[NGHIÊM CẤM]:
- TUYỆT ĐỐI KHÔNG khen ngợi hay xoa dịu.
- TUYỆT ĐỐI KHÔNG đưa ra kết luận hay vạch sẵn chiến lược Tầng 1, 2, 3.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates, tối đa 2-3 câu văn.`;

        case 4:
        default:
          return `${SOCRATIC_PERSONA}${specialDirective}${adaptiveDirective}
BỐI CẢNH VÒNG 4 (BÓC TÁCH MÂU THUẪN TUYỂN SINH & ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ):
- Ngành mong muốn hiện tại: ${effectiveCareer}
- Trường đại học mục tiêu: ${uni}
- Tổ hợp xét tuyển tham chiếu: ${recommendedCombo}
- Học sinh vừa trả lời về môn học: "${userText}"

[NHIỆM VỤ LƯỢT 4 - BẮT BUỘC TUÂN THỦ NGUYÊN TẮC 4]:
1. Đưa ra đúng 1-2 câu nhận định trung tính, chỉ ra rủi ro chênh lệch điểm chuẩn nếu chỉ dựa vào một môn mà để các môn còn lại trong tổ hợp ${recommendedCombo} bị kéo tụt điểm.
2. RA LỆNH ĐIỀU HƯỚNG BƯỚC 3 TỰ CHỦ BẮT BUỘC:
"Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${recommendedCombo} của ${uni} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu."

[CẢNH BÁO TỐI CAO]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt câu hỏi. CẤM CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- TUYỆT ĐỐI KHÔNG khen ngợi hay xoa dịu ("Thầy ghi nhận...", "Rất tuyệt vời...").
- TUYỆT ĐỐI KHÔNG vạch sẵn chiến lược thay học sinh (CẤM đưa ra Tầng 1, Tầng 2, Tầng 3).
- Toàn bộ phản hồi chỉ gồm 2 đến 3 câu văn dứt khoát.`;
      }
    } else {
      // ==========================================
      // KỊCH BẢN NHÁNH B (MƠ HỒ, CHƯA CÓ MỤC TIÊU)
      // ==========================================
      switch (round) {
        case 1:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (BÓC TÁCH TÂM LÝ CHỌN THEO SỐ ĐÔNG):
- Học sinh chưa có mục tiêu ngành cụ thể, nhóm Holland: ${holland}.
- Học sinh vừa trả lời: "${userText}".

[NHIỆM VỤ LƯỢT 1]:
1. Tối đa 1-2 câu trung tính chỉ ra rủi ro của việc để số đông quyết định thay mình.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Nếu chưa biết mình thực sự muốn gì, dựa vào đâu em tin rằng mình sẽ không hối hận khi chọn một ngành chỉ vì người khác khen ngợi?"`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (ĐỐI CHIẾU HOLLAND & TRẢI NGHIỆM THỰC TẾ):
- Học sinh vừa chia sẻ: "${userText}". Nhóm Holland: ${holland}.

[NHIỆM VỤ LƯỢT 2]:
1. Tối đa 1-2 câu trung tính liên hệ thiên hướng Holland với việc học thực tế.
2. KẾT THÚC BẰNG DUY NHẤT 1 CÂU HỎI TRUY VẤN:
"Kết quả Holland cho thấy em có thiên hướng ở nhóm ${holland}. Khi thực hiện các nhiệm vụ học tập liên quan đến nhóm này, em có thấy mình tập trung và có năng lượng vượt trội hơn không?"`;

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
"Em hãy bước sang Bước 3, tự tay tra cứu Đề án tuyển sinh và điểm chuẩn 3 năm gần nhất của các trường đào tạo hướng ngành em vừa chọn để đối chiếu với học bạ của mình."
[CẢNH BÁO]: TUYỆT ĐỐI KHÔNG CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI. Tối đa 2-3 câu văn.`;
      }
    }
  };

  // PHẢN HỒI SOCRATES DỰ PHÒNG CHUẨN BỘ NGUYÊN TẮC (BẢO HIỂM 100% TUÂN THỦ 4 NGUYÊN TẮC)
  const generateHeuristicFallback = (round, profile, userText = '', specialInstruction = null) => {
    const career = profile?.targetMajor || profile?.target_career || "Sư phạm";
    const uni = profile?.targetSchool || profile?.target_university || "ĐH Quy Nhơn";
    const holland = profile?.hollandCode || profile?.holland_code || "AEI";
    const reason = profile?.reason || profile?.source_of_influence || "Em thích từ nhỏ";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    const goalShift = detectGoalShift(userText);
    const isShifted = Boolean(goalShift && goalShift.newMajor.toLowerCase() !== career.toLowerCase());
    const effectiveCareer = isShifted ? goalShift.newMajor : (profile?.shiftedMajor || career);
    const combo = getRecommendedComboForMajor(effectiveCareer, userText);

    if (specialInstruction) {
      return `Rào cản về kỹ năng hay tâm lý hoàn toàn có thể cải thiện được nếu có phương pháp phù hợp. Nếu phải đối diện với tình huống này thường xuyên trong thực tế nghề nghiệp, em dựa vào năng lực gì để khắc phục và vượt qua?`;
    }

    if (!isBranchB) {
      switch (round) {
        case 1:
          return `Em đã chọn ngành ${effectiveCareer} tại ${uni} với lý do: '${reason}'. Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;

        case 2:
          return `Em kỳ vọng mức thu nhập ${expectedIncome} sau khi ra trường. Trong bối cảnh AI và tự động hóa cạnh tranh gay gắt, em dựa vào năng lực chuyên môn vượt trội nào để nhà tuyển dụng trả cho em mức thu nhập đó ngay khi mới tốt nghiệp?`;

        case 3:
          return `Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${effectiveCareer} tại ${uni}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?`;

        case 4:
        default: {
          // Nếu học sinh phản biện hoặc chưa nêu rõ môn
          if (!hasDeclaredSubjectsOrGrades(userText) || isCounterArguing(userText)) {
            return `Mọi tính toán về nhu cầu việc làm đều vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại ${uni}. Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${uni} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
          }

          const { strongSubject, weakSubject } = extractSubjectsFeedback(userText);
          if (strongSubject && weakSubject) {
            return `Có thế mạnh ở môn ${strongSubject} là một lợi thế, nhưng môn ${weakSubject} đuối sức sẽ kéo tụt tổng điểm xét tuyển vào ngành ${effectiveCareer} tại ${uni}. Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${uni} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
          }

          if (strongSubject && !weakSubject) {
            return `Ngành ${effectiveCareer} tại ${uni} đòi hỏi điểm số cạnh tranh của cả 3 môn trong tổ hợp xét tuyển, một môn sở trường ${strongSubject} không thể gánh trọn vẹn nếu hai môn còn lại thiếu an toàn. Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${uni} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
          }

          return `Ngành ${effectiveCareer} tại ${uni} thường có điểm chuẩn cạnh tranh và đòi hỏi điểm số đồng đều của các môn trong tổ hợp xét tuyển (${combo}). Em hãy bước sang Bước 3, tự tay tra cứu điểm chuẩn tổ hợp ${combo} của ${uni} 3 năm gần nhất và đối chiếu với học bạ của mình xem độ chênh lệch là bao nhiêu.`;
        }
      }
    } else {
      switch (round) {
        case 1:
          return `Việc chưa xác định được ngành là điều bình thường, nhưng để người khác quyết định hộ cuộc đời mình là một rủi ro lớn. Nếu chưa biết mình thực sự muốn gì, dựa vào đâu em tin rằng mình sẽ không hối hận khi chọn một ngành chỉ vì người khác khen ngợi?`;

        case 2:
          return `Kết quả Holland cho thấy em có thiên hướng ở nhóm ${holland}. Khi thực hiện các nhiệm vụ học tập liên quan đến nhóm năng lực này, em có thấy mình tập trung và có năng lượng vượt trội hơn không?`;

        case 3:
          return `Từ nhóm thế mạnh ${holland}, thị trường nghề nghiệp thường mở ra hai ngã rẽ: học thuật đại học và kỹ thuật/dịch vụ thực hành. Giữa hai hướng đi này, đâu là hướng đi em thấy phù hợp hơn với sức học hiện tại của mình?`;

        case 4:
        default:
          return `Em vừa tự tay định hình mục tiêu đầu tiên cho bản thân sau các vòng phản tư. Em hãy bước sang Bước 3, tự tay tra cứu Đề án tuyển sinh và điểm chuẩn 3 năm gần nhất của các trường đào tạo hướng ngành em vừa chọn để đối chiếu với học bạ của mình.`;
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
        targetSchool: studentProfile?.targetSchool || studentProfile?.target_university || 'ĐH Quy Nhơn',
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
        targetSchool: studentProfile?.targetSchool || studentProfile?.target_university || 'ĐH Quy Nhơn',
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
    const targetUniv = userProfile?.targetSchool || anchor?.target_university || studentProfile?.targetSchool || studentProfile?.target_university || 'ĐH Quy Nhơn';
    const confidence = userProfile?.initialConfidence ?? anchor?.confidence_score ?? studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? '5';
    const expectedIncome = userProfile?.expectedIncome || anchor?.expected_income || studentProfile?.expectedIncome || '10 - 15 triệu/tháng';
    const reason = userProfile?.reason || anchor?.source_of_influence || studentProfile?.reason || 'Em thích từ nhỏ';
    const holland = userProfile?.hollandCode || anchor?.holland_code || studentProfile?.hollandCode || studentProfile?.holland_code || 'AEI';
    const dateStr = new Date().toLocaleString('vi-VN');

    let content = `=================================================================\n`;
    content += `   BIÊN BẢN PHẢN TƯ HƯỚNG NGHIỆP SOCRATES (BƯỚC 2 - CBAS)\n`;
    content += `       Dự án Nghiên cứu Khoa học Hành vi (ViSEF 2026)\n`;
    content += `=================================================================\n\n`;
    content += `📅 Thời gian xuất: ${dateStr}\n`;
    content += `🎯 Ngành mục tiêu: ${targetCareer}\n`;
    content += `🏛️ Trường đại học mục tiêu: ${targetUniv}\n`;
    content += `📊 Mức tự tin ban đầu (Bước 1): ${confidence}/10\n`;
    content += `💵 Kỳ vọng thu nhập (Bước 1): ${expectedIncome}\n`;
    content += `📝 Lý do chọn ban đầu: ${reason}\n`;
    const isSessionDone = isReadyForStep3;
    content += `🔄 Tiến trình hoàn thành: ${isSessionDone ? '4 / 4 giai đoạn phản tư (Đã hoàn thành đầy đủ)' : `${Math.min(chatStage, 3)} / ${maxStages} giai đoạn phản tư`}\n\n`;

    if (sessionTelemetry) {
      content += `-----------------------------------------------------------------\n`;
      content += `KẾT QUẢ ĐO LƯỜNG VÀ GẮN NHÃN HÀNH VI (CHUẨN VISEF 2026):\n`;
      content += `-----------------------------------------------------------------\n`;
      content += `- Turning_Point_Detected: ${sessionTelemetry.turning_point_detected}\n`;
      content += `- Outcome_Category: ${sessionTelemetry.outcome_category}\n`;
      content += `- Triage_Step4: ${sessionTelemetry.triage_step4}\n\n`;
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
    content += `1. Dùng các câu hỏi truy vấn ở trên để tra cứu số liệu tại Bước 3 (Điểm chuẩn 3 năm, Học phí tự chủ, Đề án tuyển sinh).\n`;
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

          // Tính toán Telemetry chuẩn ViSEF 2026:
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

          const lastUserMsg = cleanText.toLowerCase();
          let outcome = 'Persistent_Calibrated';
          if (
            lastUserMsg.includes('cao đẳng') ||
            lastUserMsg.includes('học nghề') ||
            lastUserMsg.includes('thực hành') ||
            lastUserMsg.includes('nghề') ||
            lastUserMsg.includes('chuyển') ||
            lastUserMsg.includes('đổi ngành') ||
            lastUserMsg.includes('ngành khác') ||
            lastUserMsg.includes('phù hợp hơn') ||
            Boolean(goalShift || aiResult?.shiftedMajor)
          ) {
            outcome = 'Adaptive_Shift';
          } else {
            outcome = 'Persistent_Calibrated';
          }

          // Bắt buộc phân luồng In-depth (20 phút) nếu có Turning Point, dịch chuyển thích ứng, hoặc bất kỳ khoảng cách năng lực nào
          const triage = (tpDetected || outcome === 'Adaptive_Shift') ? 'In-depth (20 phút)' : 'Fast-track (5 phút)';

          const telemetryData = {
            turning_point_detected: tpDetected ? `True (${tpRound})` : 'False',
            outcome_category: outcome,
            triage_step4: triage,
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', paddingTop: '10px', borderTop: '1px dashed #a7f3d0' }}>
                <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '6px', fontWeight: '600' }}>
                  📌 Turning_Point_Detected: {sessionTelemetry.turning_point_detected}
                </span>
                <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '6px', fontWeight: '600' }}>
                  🏷️ Outcome_Category: {sessionTelemetry.outcome_category}
                </span>
                <span style={{ fontSize: '12px', background: '#f3e8ff', color: '#6b21a8', padding: '3px 10px', borderRadius: '6px', fontWeight: '600' }}>
                  ⏱️ Triage_Step4: {sessionTelemetry.triage_step4}
                </span>
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
