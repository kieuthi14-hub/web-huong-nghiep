import React, { useState, useEffect, useRef } from 'react';
import StepProgressHeader from '../../components/common/StepProgressHeader';

// HÀM KIỂM TRA HỌC SINH MƠ HỒ / CHƯA CÓ MỤC TIÊU CỤ THỂ (ĐỂ KÍCH HOẠT NHÁNH B)
export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
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
      reply: `Thầy hỏi để giúp em tự soi chiếu động lực và năng lực thực tế của mình trước khi ra quyết định quan trọng. Em hãy chia sẻ rõ hơn suy nghĩ của mình về câu hỏi của thầy ở trên nhé!`
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
      reply: `Chào em, thầy trò mình cùng bắt đầu nhé! Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại.`
    };
  }

  // 1.3. Tiếp tục đối thoại với AI Cognitive Agent - KHÔNG can thiệp bằng câu trả lời mẫu cứng nhắc (directReply)
  // để mô hình nhận thức linh hoạt tự do lắng nghe, đồng cảm và phản hồi tự nhiên theo thời gian thực!
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

    // LỜI CHÀO & CÂU HỎI MỞ ĐẦU CHUẨN VISEF 2026:
    let initialGreeting = '';
    if (isBranchB) {
      // NHÁNH B: HỌC SINH MƠ HỒ, CHƯA CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Thầy ghi nhận em có thiên hướng Holland **${hollandCode}**, và em đang còn nhiều phân vân chưa chọn được ngành học cụ thể với mức tự tin **${initialConfidence}/10**.\n\nThầy trò mình cùng trò chuyện cởi mở để khai mở và tìm ra điểm tựa định hướng phù hợp nhất với bản thân em nhé.\n\nSau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`;
    } else {
      // NHÁNH A: HỌC SINH ĐÃ CÓ MỤC TIÊU CỤ THỂ (THEO ĐÚNG TIÊU CHUẨN VISEF 2026)
      initialGreeting = `Chào em. Thầy ghi nhận em có thiên hướng Holland **${hollandCode}**, dự định chọn **${targetMajor}** tại **${targetSchool}** với mức tự tin **${initialConfidence}/10** và lý do: '${reason}'.\n\nEm thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
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

  // CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN VISEF 2026 - MÔ HÌNH NHẬN THỨC LINH HOẠT
  const SOCRATIC_PERSONA = `
BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang trò chuyện 1-1 với một học sinh THPT đang đứng trước ngưỡng cửa chọn ngành nghề tương lai.

[BẢN CHẤT CỐT LÕI - KHÔNG PHẢI BOT KỊCH BẢN CỨNG NHẮC]:
Bạn KHÔNG PHẢI là một kịch bản bot lặp khuôn hay mẫu câu máy móc. Bạn sở hữu trí tuệ cảm xúc (EQ) cao, khả năng lắng nghe sâu, sự ấm áp của người thầy và nghệ thuật dẫn dắt Socrates giúp học sinh tự nhận thức.

[CƠ CHẾ SUY NGHĨ NỘI TÂM TRƯỚC KHI TRẢ LỜI - BẮT BUỘC]:
Với mỗi tin nhắn của học sinh, hãy tự đặt câu hỏi trong tiềm thức:
1. "Học sinh này đang bộc lộ trạng thái tâm lý gì?" (Ví dụ: Thực dụng vì tiền/thu nhập; Tự ti, hoang mang về học lực; Bị phụ huynh áp đặt/ngoại sinh; Bốc đồng theo trào lưu; hay Tự tin có căn cứ?).
2. "Làm sao để công nhận cảm xúc của em ấy một cách chân thành nhất mà không phán xét?"
3. "Làm sao để dùng chính câu nói bất ngờ đó làm bàn đạp dẫn dắt em ấy về hiện thực nghề nghiệp?"

[HƯỚNG DẪN XỬ LÝ CÁC TÌNH HUỐNG TÂM LÝ BẤT NGỜ]:
- NẾU HỌC SINH THỰC DỤNG / NÓI VỀ TIỀN (Ví dụ: "Thầy em dạy thêm nhiều tiền", "Ngành này kiếm nhiều tiền", "Em muốn giàu"):
  -> TUYỆT ĐỐI ĐỪNG chê trách hay biến thành đam mê giả tạo. Hãy thừa nhận: "Mong muốn có thu nhập tốt là nhu cầu hoàn toàn chính đáng của cuộc sống." Sau đó đối chất sư phạm: "Nhưng để dạy thêm có nhiều người học và có thu nhập cao, người thầy đó phải có chuyên môn vượt trội và uy tín thế nào? Em đã chuẩn bị gì cho năng lực chuyên môn đó?"
- NẾU HỌC SINH TỰ TI / HOANG MANG (Ví dụ: "Em thấy mình dốt", "Em không biết có làm được không", "Em sợ thi trượt"):
  -> ĐỪNG tuôn lý thuyết vĩ mô. Hãy nâng đỡ cảm xúc: "Sự lo lắng này là rất thật và đáng được tôn trọng khi em đứng trước cánh cửa tương lai." Sau đó bóc tách: "Điều gì đang làm em sợ nhất: khối lượng kiến thức, điểm số thi tuyển, hay sợ sự kỳ vọng của người khác?"
- NẾU HỌC SINH NÊU MÔN HỌC BẤT KỲ (Kể cả môn lạ như GDQP, KTPL, Hoạt động trải nghiệm, hoặc môn phụ):
  -> Hãy đón nhận tự nhiên, đối chiếu xem môn đó có nằm trong các tổ hợp xét tuyển truyền thống của ngành hay không, chỉ ra mức độ cạnh tranh và gợi mở hướng đi thích hợp.
- NẾU HỌC SINH BỊ PHỤ HUYNH ÁP ĐẶT / NGOẠI SINH (Ví dụ: "Mẹ em định hướng", "Bố mẹ chọn", "Ba mẹ bắt thi"):
  -> Thấu cảm: "Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em." Sau đó đối chất: "Bản thân em có thực sự tìm thấy sự hứng thú nào với công việc này không, hay em chỉ đang học để làm hài lòng bố mẹ?"
- NẾU HỌC SINH KHẲNG ĐỊNH THỰC SỰ ĐAM MÊ / YÊU THÍCH:
  -> Ghi nhận sự hào hứng tự nhiên, nhưng bóc tách sâu vào hoạt động chuyên môn thực tế hàng ngày (đứng lớp, soạn bài giảng, kiên nhẫn đồng hành cùng học sinh hay chấm bài) xem hoạt động nào thực sự tạo năng lượng cho em.

[ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]:
- Mỗi phản hồi chỉ từ 2 đến 4 câu ngắn gọn, súc tích, văn phong sư phạm ấm áp, thấu hiểu.
- Kết thúc bằng ĐÚNG 01 câu hỏi phản tư duy nhất (ở Lượt 1, 2, 3), hoặc kết thúc bằng lời trao quyền chuyển bước dứt khoát (ở Lượt 4).
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề, ghi chú hay phân tích kỹ thuật.
`;

  const generatePromptForRound = (round, profile, userText, specialInstruction = null) => {
    const career = profile?.targetMajor || profile?.target_career || "ngành đã chọn";
    const uni = profile?.targetSchool || profile?.target_university || "trường đại học mục tiêu";
    const score = profile?.initialConfidence ?? profile?.confidence_score ?? "5";
    const holland = profile?.hollandCode || profile?.holland_code || "RIASEC";
    const reason = profile?.reason || profile?.source_of_influence || "Em thích từ nhỏ";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    const specialDirective = specialInstruction ? `\n\nCHỈ DẪN ĐẶC BIỆT KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

    if (!isBranchB) {
      // ==========================================
      // KỊCH BẢN NHÁNH A (ĐÃ CÓ MỤC TIÊU CỤ THỂ)
      // ==========================================
      switch (round) {
        case 1:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (LƯỢT KHỞI ĐẦU - ĐỐI CHIẾU MÃ HOLLAND & ĐỘNG CƠ):
- Nhóm thiên hướng Holland (RIASEC): ${holland}
- Ngành mong muốn: ${career}
- Trường đại học mục tiêu: ${uni}
- Mức tự tin ban đầu: ${score}/10
- Lý do chọn ngành ban đầu: "${reason}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 1]:
1. Chào học sinh theo mã Holland [${holland}], ngành [${career}], lý do [${reason}].
2. HỎI ĐÚNG 01 CÂU DUY NHẤT:
"Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG nói về thu nhập hay tiền bạc.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay học bạ.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.
Quy chuẩn: Dưới 120 từ. Giữ âm hưởng đồng hành, chân thành, tôn trọng.`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (LƯỢT THÁCH THỨC VIỆC LÀM & KỲ VỌNG THU NHẬP TRONG KỶ NGUYÊN AI):
- Ngành: ${career}, trường: ${uni}, mã Holland: ${holland}.
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}".
- Học sinh vừa trả lời câu hỏi ở Stage 1: "${userText}".

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 2]:
1. Ghi nhận câu trả lời của học sinh trong 1-2 câu ngắn gọn, ấm áp.
2. Xoáy vào dữ liệu thu nhập [${expectedIncome}] với ĐÚNG CÂU HỎI SAU:
"Em kỳ vọng mức thu nhập sau khi ra trường là ${expectedIncome}. Trong bối cảnh 5-10 năm tới khi AI và chuyển đổi số làm thay đổi thị trường giáo dục, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay học bạ.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Khung chat bắt buộc phải giữ mở để học sinh trả lời tiếp ở Stage 3.
- Kết thúc bằng đúng câu hỏi về thu nhập & AI ở trên.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.
Quy chuẩn: Dưới 130 từ. Giữ âm hưởng đồng hành, tôn trọng.`;

        case 3:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (LƯỢT ĐỐI CHẤT TỔ HỢP MÔN & HỌC LỰC THỰC TẾ):
- Ngành mong muốn: ${career}
- Trường đại học mục tiêu: ${uni}
- Câu trả lời của học sinh ở Stage 2 (về thu nhập/AI/cạnh tranh): "${userText}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 3]:
1. Ghi nhận ngắn gọn góc nhìn của học sinh về việc làm/thu nhập.
2. Dẫn dắt vào bài toán điểm số với ĐÚNG CÂU HỎI SAU:
"Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${career} tại ${uni}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG đưa ra kết luận hay giải pháp hạ bậc ở lượt này.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Khung chat bắt buộc phải giữ mở để học sinh trả lời về môn học ở Stage 4.
- Kết thúc bằng đúng câu hỏi về tổ hợp & môn sở trường/đuối sức ở trên.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.
Quy chuẩn: Dưới 130 từ. Giữ âm hưởng đồng hành, tôn trọng.`;

        case 4:
        default:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (LƯỢT KẾT THÚC & TỔNG KẾT THEO MÔ HÌNH HẠ BẬC MỀM - SOFT LADDERING):
- Ngành mong muốn: ${career}
- Trường đại học mục tiêu: ${uni}
- Câu trả lời của học sinh ở Stage 3 (về tổ hợp môn/môn sở trường/môn đuối sức): "${userText}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 4]:
1. Phân tích môn thế mạnh và môn yếu học sinh vừa nêu trong tin nhắn "${userText}". Ghi nhận môn thế mạnh và chỉ ra rủi ro điểm chuẩn nếu môn yếu kéo tụt tổng điểm tổ hợp xét tuyển vào ${career} tại ${uni} (24 - 27 điểm).
2. Trình bày Chiến lược Thích ứng Đa tầng (3 tầng nấc theo Soft Laddering):
   - Tầng 1 (Nguyện vọng 1): Kế hoạch bứt phá môn thế mạnh để kéo điểm thi vào ${uni}.
   - Tầng 2 (Nguyện vọng 2): Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (ví dụ ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).
   - Tầng 3 (Lưới an toàn): Phương án dự phòng cuối cùng với hệ Cao đẳng thực hành / đào tạo nghề chất lượng cao để đảm bảo luôn có tay nghề vững chắc.
3. KẾT LỆNH BẮT BUỘC:
"Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!"

[CẢNH BÁO TỐI CAO - ĐẶC BIỆT]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt thêm bất kỳ câu hỏi nào. KHÔNG CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.
Quy chuẩn: Dưới 150 từ. Dứt khoát, trao quyền tự quyết.`;
      }
    } else {
      // ==========================================
      // KỊCH BẢN NHÁNH B (MƠ HỒ, CHƯA CÓ MỤC TIÊU)
      // ==========================================
      switch (round) {
        case 1:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (BÓC TÁCH TÂM LÝ BẦY ĐÀN & MỎ NEO MẠNG XÃ HỘI):
- Học sinh chưa có mục tiêu ngành học cụ thể, nhóm Holland nổi trội: ${holland}.
- Học sinh vừa trả lời: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu đồng cảm với cảm giác bối rối khi đứng trước quá nhiều lựa chọn.
2. Đúng 01 câu chỉ ra nguy cơ của việc để mạng xã hội hoặc bạn bè quyết định hộ cuộc đời mình.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Sau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?"
Quy chuẩn: Dưới 110 từ.`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (KHAI QUẬT ĐIỂM TỰA NỘI TẠI TỪ HOLLAND VÀ MÔN HỌC SỞ TRƯỜNG):
- Học sinh vừa phản hồi về nỗi sợ chọn sai nghề: "${userText}". Nhóm Holland: ${holland}.
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu ghi nhận sự tỉnh thức và mong muốn tìm thấy tiếng nói bên trong của học sinh.
2. Đúng 01 câu kết nối nhóm tính cách Holland (${holland}) với các nhiệm vụ học tập thực tế ở trường.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Kết quả Holland cho thấy em có thế mạnh ở nhóm ${holland}. Nhìn lại việc học ở trường, khi làm các nhiệm vụ liên quan đến nhóm năng lực này, em có thấy mình tập trung và có nhiều năng lượng nhất không?"
Quy chuẩn: Dưới 110 từ.`;

        case 3:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (THU HẸP PHỄU LỰA CHỌN XUỐNG 2 KỊCH BẢN NGHỀ NGHIỆP):
- Học sinh vừa chia sẻ về các môn học / nhiệm vụ có năng lượng: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu trân trọng và ghi nhận thế mạnh tự nhiên của học sinh.
2. Đúng 01 câu gợi mở 2 hướng đi cụ thể phù hợp với thế mạnh vừa xác định: 1 hướng thiên về Học thuật đại học, 1 hướng thiên về Thực hành nghề/dịch vụ.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Từ thế mạnh đó, thầy gợi ý 2 hướng đi: Hướng A là ngành học thuật đại học và Hướng B là ngành kỹ thuật/dịch vụ thực hành. Hướng đi nào khiến em cảm thấy tò mò và muốn tìm hiểu sâu hơn?"
Quy chuẩn: Dưới 120 từ.`;

        case 4:
        default:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (TRAO QUYỀN TỰ QUYẾT & ĐIỀU HƯỚNG SANG BƯỚC 3 - TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
- Học sinh vừa chọn hướng nghề nghiệp tò mò muốn tìm hiểu: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu xác nhận lựa chọn sơ bộ của học sinh, khích lệ tính tự chủ.
2. Đúng 01 câu khẳng định việc có mục tiêu ban đầu là bước ngoặt quan trọng để thoát khỏi sự mơ hồ.
3. LỆNH KẾT THÚC PHIÊN CHAT BẮT BUỘC (TUYỆT ĐỐI KHÔNG HỎI THÊM):
   "Em vừa tự tay định hình mục tiêu đầu tiên cho bản thân. Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tra cứu Đề án tuyển sinh xem ngành này ở các trường đại học hoặc cao đẳng gần địa phương yêu cầu điều kiện gì nhé!"
Quy chuẩn: Dưới 120 từ.`;
      }
    }
  };

  // PHẢN HỒI SOCRATES DỰ PHÒNG CHUẨN VISEF 2026 (BẢO HIỂM 100% KHÔNG BAO GIỜ TREO MÁY NẾU MẤT MẠNG HOẶC HẾT QUOTA)
  const generateHeuristicFallback = (round, profile, userText = '', specialInstruction = null) => {
    const career = profile?.targetMajor || profile?.target_career || "Sư phạm";
    const uni = profile?.targetSchool || profile?.target_university || "ĐH Quy Nhơn";
    const score = profile?.initialConfidence ?? profile?.confidence_score ?? "5";
    const holland = profile?.hollandCode || profile?.holland_code || "AEI";
    const reason = profile?.reason || profile?.source_of_influence || "Em thích từ nhỏ";
    const expectedIncome = profile?.expectedIncome || profile?.expected_income || "10 - 15 triệu/tháng";
    const isBranchB = isUndecidedOrVague(career);

    if (specialInstruction) {
      return `Thầy rất thấu cảm và trân trọng sự trung thực của em khi chia sẻ: "${userText}".\n\n` +
        `Những rào cản kỹ năng như giao tiếp trước đám đông hay áp lực tính toán đều có thể rèn luyện và bồi đắp được theo thời gian. Tuy nhiên, đối chiếu với nhóm tính cách Holland của em (${holland}), điều cốt lõi là em cần lắng nghe xem bản thân có thực sự tìm thấy niềm hứng khởi khi gắn bó với đặc thù công việc hay không?\n\n` +
        `Nếu phải đối diện với tình huống này thường xuyên trong thực tế nghề nghiệp, em dự định sẽ chuẩn bị cho mình điểm tựa tâm lý hoặc kỹ năng gì để vượt qua?`;
    }

    if (!isBranchB) {
      const lowerUser = (userText || '').toLowerCase();

      // 1. Phản xạ tâm lý bất ngờ: Thực dụng / nói về tiền / dạy thêm
      const isPragmaticMoney = [
        'nhiều tiền', 'dạy thêm', 'lương', 'thu nhập', 'kiếm tiền', 'kiếm dc nhiều', 'giàu', 'kinh tế'
      ].some(k => lowerUser.includes(k));
      if (isPragmaticMoney && round <= 2) {
        return `Mong muốn có thu nhập tốt và cuộc sống đủ đầy là nhu cầu hoàn toàn chính đáng của mỗi người.\n\n` +
          `Em kỳ vọng mức thu nhập sau khi ra trường là **${expectedIncome}**. Trong bối cảnh 5-10 năm tới khi AI và công nghệ tự động hóa làm thay đổi thị trường việc làm, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?`;
      }

      // 2. Phản xạ tâm lý bất ngờ: Tự ti / hoang mang
      const isInsecure = [
        'dốt', 'kém', 'sợ trượt', 'không biết làm được', 'không biết có làm được', 'lo lắng', 'hoang mang', 'tự ti', 'áp lực', 'sợ không đỗ'
      ].some(k => lowerUser.includes(k));
      if (isInsecure && round <= 3) {
        return `Sự lo lắng và cảm giác hoài nghi bản thân là trạng thái tâm lý rất thật và đáng được tôn trọng khi em đứng trước cánh cửa tương lai quan trọng.\n\nNhìn lại chính mình lúc này, điều gì đang làm em cảm thấy áp lực nhất: khối lượng kiến thức chuyên môn, điểm số thi tuyển, hay áp lực từ sự kỳ vọng của người khác?`;
      }

      switch (round) {
        case 1:
          return `Chào em. Thầy ghi nhận em có thiên hướng Holland **${holland}**, dự định chọn **${career}** tại **${uni}** với mức tự tin **${score}/10** và lý do: '${reason}'.\n\nEm thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;

        case 2:
          return `Thầy rất ghi nhận và thấu cảm với chia sẻ chân thành của em về động cơ chọn ngành.\n\n` +
            `Em kỳ vọng mức thu nhập sau khi ra trường là **${expectedIncome}**. Trong bối cảnh 5-10 năm tới khi AI và chuyển đổi số làm thay đổi thị trường giáo dục, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?`;

        case 3:
          return `Thầy rất ủng hộ tinh thần tích cực và nhận thức thực tế của em về thị trường lao động.\n\n` +
            `Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành **${career}** tại **${uni}**, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?`;

        case 4:
        default: {
          const lowerUser = (userText || '').toLowerCase();

          // Nếu học sinh phản biện hoặc CHƯA khai báo môn học cụ thể:
          // TUYỆT ĐỐI KHÔNG ĐƯỢC kết thúc, không được tự ý phán đoán "đều đều" hay khuyên Cao đẳng!
          if (!hasDeclaredSubjectsOrGrades(userText) || isCounterArguing(userText)) {
            return `Thầy rất ghi nhận tinh thần phản biện thẳng thắn và góc nhìn thực tế của em. Đúng là khi chưa xác định cụ thể thì không nên vội vã đưa ra kết luận cảm tính.\n\n` +
              `Tuy nhiên, mọi tính toán về nhu cầu thị trường hay lựa chọn môn dạy đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại **${uni}** (thường từ 24 đến 27 điểm).\n\n` +
              `Để giúp em tìm ra điểm tựa thực tế nhất: Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?`;
          }

          const { strongSubject, weakSubject } = extractSubjectsFeedback(userText);

          const hasMath = lowerUser.includes('toán') || lowerUser.includes('toan');
          const hasLit = lowerUser.includes('văn') || lowerUser.includes('van');
          const isWeakBoth = (hasMath && hasLit && (lowerUser.includes('yếu') || lowerUser.includes('kém') || lowerUser.includes('sợ'))) ||
            /(yếu|kém|đuối|sợ|thấp)[^,.;!?\n]*(văn\s*(và|với|\+)\s*toán|toán\s*(và|với|\+)\s*văn)/i.test(lowerUser);

          if (isWeakBoth) {
            return `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\n` +
              `Khi đối diện với ngưỡng điểm chuẩn rất cao của ngành **${career}** tại **${uni}** (thường từ 24 - 27 điểm), việc có khoảng cách ở cả Toán và Văn là một rủi ro lớn kéo tụt tổng điểm tổ hợp xét tuyển. Tuy nhiên, thay vì vội vàng từ bỏ, Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
              `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá, nỗ lực tối đa cải thiện hai môn Toán - Văn và tận dụng các môn sở trường còn lại để quyết tâm thi đỗ ${uni}.\n` +
              `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
              `• **Tầng 3 (Lưới an toàn)**: Chuẩn bị phương án dự phòng cuối cùng như hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao để đảm bảo luôn có tay nghề vững chắc.\n\n` +
              `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
          }

          if (strongSubject && weakSubject) {
            return `Thầy khen ngợi sự thẳng thắn và trung thực rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\n` +
              `Có thế mạnh ở môn **${strongSubject}** là điểm tựa rất tốt. Tuy nhiên, nếu môn **${weakSubject}** còn đuối sức, rủi ro lớn nhất là điểm môn này sẽ kéo tụt tổng điểm tổ hợp 3 môn khi xét tuyển vào ngành **${career}** tại **${uni}** (vốn có ngưỡng điểm chuẩn cạnh tranh từ 24 - 27 điểm).\n\n` +
              `Để chủ động làm chủ tương lai và không rơi vào thế bị động, Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
              `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá điểm số, tập trung khắc phục môn ${weakSubject} và phát huy tối đa môn ${strongSubject}, quyết tâm thi đỗ ${uni}.\n` +
              `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
              `• **Tầng 3 (Lưới an toàn)**: Chuẩn bị phương án dự phòng cuối cùng như hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao để luôn có tay nghề vững chắc.\n\n` +
              `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
          }

          if (strongSubject && !weakSubject) {
            return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ môn sở trường. Có thế mạnh ở môn **${strongSubject}** là một lợi thế điểm số rất tốt.\n\n` +
              `Tuy nhiên, để xét tuyển vào ngành **${career}** tại **${uni}** với ngưỡng điểm chuẩn cạnh tranh (24 - 27 điểm), em cần đảm bảo cả 3 môn trong tổ hợp không môn nào bị đuối điểm. Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
              `• **Tầng 1 (Nguyện vọng 1)**: Kế hoạch bứt phá điểm số toàn diện cả tổ hợp, phát huy môn ${strongSubject} để quyết tâm thi vào ${uni}.\n` +
              `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
              `• **Tầng 3 (Lưới an toàn)**: Chuẩn bị phương án dự phòng cuối cùng như hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao.\n\n` +
              `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
          }

          if (weakSubject && !strongSubject) {
            return `Thầy khen ngợi sự trung thực và thẳng thắn của em khi dũng cảm nhìn nhận khó khăn trong học tập.\n\n` +
              `Khi môn **${weakSubject}** còn đuối sức, rủi ro lớn nhất là điểm môn này sẽ kéo tụt tổng điểm xét tuyển vào ngành **${career}** tại **${uni}** (thường từ 24 - 27 điểm). Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
              `• **Tầng 1 (Nguyện vọng 1)**: Lên kế hoạch bứt phá, dồn sức cải thiện môn ${weakSubject} và tối ưu các môn còn lại để quyết tâm thi vào ${uni}.\n` +
              `• **Tầng 2 (Nguyện vọng 2)**: Tìm hiểu các trường Đại học dự phòng có cùng ngành với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
              `• **Tầng 3 (Lưới an toàn)**: Lưới an toàn phương án dự phòng cuối cùng với hệ Cao đẳng thực hành hoặc đào tạo nghề chất lượng cao để sớm có việc làm.\n\n` +
              `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
          }

          return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 giai đoạn phản tư.\n\n` +
            `Trước ngưỡng điểm chuẩn cạnh tranh (thường từ 24 - 27 điểm) của ngành **${career}** tại **${uni}**, Thầy định hướng cho em mô hình hạ bậc mềm (Soft Laddering) với 3 tầng nấc thích ứng:\n\n` +
            `• **Tầng 1 (Nguyện vọng 1)**: Kế hoạch bứt phá điểm số tổ hợp môn thế mạnh, quyết tâm thi vào ${uni}.\n` +
            `• **Tầng 2 (Nguyện vọng 2)**: Nghiên cứu các trường Đại học dự phòng có cùng ngành hoặc ngành liên quan với ngưỡng điểm chuẩn vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên...).\n` +
            `• **Tầng 3 (Lưới an toàn)**: Lưới an toàn phương án dự phòng cuối cùng với hệ Cao đẳng thực hành / đào tạo nghề chất lượng cao để sớm có tay nghề vững chắc.\n\n` +
            `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
        }
      }
    } else {
      switch (round) {
        case 1:
          return `Thầy rất thấu cảm với cảm giác ngập ngừng khi đứng trước quá nhiều thông tin trên mạng xã hội.\n\n` +
            `Việc chưa xác định được ngành là điều tự nhiên, nhưng để người khác quyết định hộ cuộc đời mình là một rủi ro rất lớn.\n\n` +
            `Sau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`;

        case 2:
          return `Thầy ghi nhận sự tỉnh thức và tinh thần trách nhiệm với tương lai của chính bản thân em.\n\n` +
            `Điểm tựa bền vững nhất để chọn nghề không nằm ở lời khen bên ngoài mà xuất phát từ chính thế mạnh tự nhiên và sự hứng khởi bên trong.\n\n` +
            `Kết quả Holland cho thấy em có thế mạnh ở nhóm **${holland}**. Nhìn lại việc học ở trường, khi làm các nhiệm vụ liên quan đến nhóm năng lực này, em có thấy mình tập trung và có nhiều năng lượng nhất không?`;

        case 3:
          return `Thầy đánh giá cao việc em đã tìm thấy những tín hiệu tích cực từ các môn học sở trường của mình.\n\n` +
            `Từ nhóm thế mạnh **${holland}**, thị trường nghề nghiệp thường mở ra 2 ngã rẽ: một hướng thiên về Học thuật đại học và một hướng thiên về Kỹ năng thực hành dịch vụ chuyên sâu.\n\n` +
            `Từ thế mạnh đó, thầy gợi ý 2 hướng đi: Hướng A là ngành nghiên cứu/quản lý học thuật và Hướng B là ngành kỹ thuật/dịch vụ thực hành. Hướng đi nào khiến em cảm thấy tò mò và muốn tìm hiểu sâu hơn?`;

        case 4:
        default:
          return `Thầy chúc mừng em vì đã dũng cảm vượt qua sự mơ hồ ban đầu để tự tay định hình mục tiêu đầu tiên cho bản thân.\n\n` +
            `Sự tự chủ này là chiếc chìa khóa quan trọng nhất giúp em làm chủ hành trình nghề nghiệp tương lai mà không bị cuốn theo đám đông.\n\n` +
            `Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
      }
    }
  };

  // 3. GỌI API GEMINI VỚI CẤU HÌNH NHIỆT ĐỘ CỐ ĐỊNH CHỐNG ẢO GIÁC
  const callGeminiSocratic = async (historyMessages, userText, stage, specialInstruction = null) => {
    // 3.1. Thử gọi Serverless Backend /api/socrates-chat hoặc /api/chat
    const endpointsToTry = ['/api/socrates-chat', '/api/chat'];
    const requestPayload = {
      chatStage: stage,
      stage: stage,
      round: stage,
      studentProfile: {
        hollandCode: studentProfile?.hollandCode || studentProfile?.holland_code || 'RIASEC',
        targetMajor: studentProfile?.targetMajor || studentProfile?.target_career || 'Sư phạm',
        targetSchool: studentProfile?.targetSchool || studentProfile?.target_university || 'ĐH Quy Nhơn',
        reason: studentProfile?.reason || studentProfile?.source_of_influence || 'Em thích từ nhỏ',
        initialConfidence: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        expectedIncome: studentProfile?.expectedIncome || studentProfile?.expected_income || '10 - 15 triệu/tháng',
        // Tương thích ngược:
        targetCareer: studentProfile?.targetMajor || studentProfile?.target_career || 'Sư phạm',
        confidenceT0: studentProfile?.initialConfidence ?? studentProfile?.confidence_score ?? 5,
        competenceSelfEval: 'Vừa sức'
      },
      userProfile: {
        hollandCode: studentProfile?.hollandCode || studentProfile?.holland_code || 'RIASEC',
        targetMajor: studentProfile?.targetMajor || studentProfile?.target_career || 'Sư phạm',
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
      anchor: studentProfile,
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
          if (replyText && replyText.trim().length >= 25) {
            let cleaned = replyText.trim();
            const isReallyComplete = isStage4 && (sData?.isComplete === true || sData?.isCompleted === true || sData?.stage === 4);

            if (isReallyComplete) {
              cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
              cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
              cleaned = cleaned.trim();

              const step3Directive = "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!";
              if (!cleaned.includes("Bước 3") && !cleaned.includes("bước 3")) {
                cleaned = cleaned + "\n\n" + step3Directive;
              }
            } else {
              cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();
            }
            return {
              replyText: cleaned,
              chatStage: isReallyComplete ? 4 : stage,
              isCompleted: isReallyComplete,
              isComplete: isReallyComplete
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
      const systemPrompt = generatePromptForRound(stage, studentProfile, userText, specialInstruction);

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
            text = text
              .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
              .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ).*?\]\s*/i, '')
              .replace(/^#+.*?(CHỈ ĐẠO|CHỈ THỊ).*?\n/i, '')
              .trim();

            const isReallyComplete = isStage4;
            if (isReallyComplete) {
              text = text.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
              text = text.replace(/^[^\n\r?]+\?\s*$/g, '');
              text = text.trim();

              const step3Directive = "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!";
              if (!text.includes("Bước 3") && !text.includes("bước 3")) {
                text = text + "\n\n" + step3Directive;
              }
            } else {
              text = text.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();
            }
            return {
              replyText: text.trim(),
              chatStage: isReallyComplete ? 4 : stage,
              isCompleted: isReallyComplete,
              isComplete: isReallyComplete
            };
          }
        }
      }
    } catch (e) {
      console.warn("Direct Gemini call exception:", e);
    }

    // 3.3. Kích hoạt fallback heuristic dự phòng chuẩn CBAS nếu mạng chậm hoặc hết quota
    let fallbackText = generateHeuristicFallback(stage, studentProfile, userText, specialInstruction);
    const isReallyComplete = isStage4;
    if (isReallyComplete) {
      fallbackText = fallbackText.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
      fallbackText = fallbackText.replace(/^[^\n\r?]+\?\s*$/g, '');
      fallbackText = fallbackText.trim();
      const step3Directive = "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!";
      if (!fallbackText.includes("Bước 3") && !fallbackText.includes("bước 3")) {
        fallbackText = fallbackText + "\n\n" + step3Directive;
      }
    } else {
      fallbackText = fallbackText.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();
    }
    return {
      replyText: fallbackText,
      chatStage: isReallyComplete ? 4 : stage,
      isCompleted: isReallyComplete,
      isComplete: isReallyComplete
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

              if (isExtrinsic || isInsecureOrWeak || isComboIssue) {
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
            lastUserMsg.includes('phù hợp hơn')
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
