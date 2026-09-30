import React, { useState, useEffect, useRef } from 'react';

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
    /chưa\s+(chọn|biết|định hình)\s+(được\s+)?(môn|sẽ dạy)/i
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
  if (/(tin\s*học|tin\s*hoc|gdcd|gdqp|ktpl|quốc\s*phòng|kinh\s*tế\s*pháp\s*luật|công\s*nghệ|khtn|khxh)/i.test(clean)) return true;

  // 10. Tuyên bố học lực rõ ràng
  const hasExplicitGradeDeclaration = [
    'học đều', 'hoc deu', 'đều đều', 'deu deu', 'học tàn tàn', 'tàn tàn', 'tan tan',
    'các môn như nhau', 'môn nào cũng như nhau', 'môn nào cũng vậy', 'môn nào cũng thế',
    'mất gốc', 'mat goc', 'đuối tất cả', 'kém tất cả', 'yếu tất cả'
  ].some(k => clean.includes(k));

  return hasExplicitGradeDeclaration;
}

export default function Step2SocraticAgent() {
  const [chatStage, setChatStage] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionTelemetry, setSessionTelemetry] = useState(null);

  const maxStages = 4;
  const messagesEndRef = useRef(null);
  const lastAiMsgRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCompleted && lastAiMsgRef.current) {
        lastAiMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, chatStage, isCompleted]);

  // 1. KHỞI TẠO CONTEXT TỪ BƯỚC 1 VÀ PHÂN LUỒNG NHÁNH A / NHÁNH B
  useEffect(() => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    const anchor = rawAnchor ? JSON.parse(rawAnchor) : {
      target_career: "Sư phạm",
      target_university: "ĐH Quy Nhơn",
      confidence_score: "5",
      holland_code: "AEI"
    };
    setStudentProfile(anchor);

    // Dọn sạch trạng thái kẹt cũ của các phiên test trước
    localStorage.removeItem("cbas_step2_messages");
    localStorage.removeItem("cbas_step2_round");
    localStorage.removeItem("cbas_step2_completed");

    const isBranchB = isUndecidedOrVague(anchor.target_career);

    // LỜI CHÀO & CÂU HỎI MỞ ĐẦU CHUẨN VISEF 2026:
    let initialGreeting = '';
    if (isBranchB) {
      // NHÁNH B: HỌC SINH MƠ HỒ, CHƯA CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Thầy đã tiếp nhận kết quả Bước 1 của em với nhóm Holland nổi trội là **${anchor.holland_code}**, và em đang còn nhiều phân vân chưa chọn được ngành học cụ thể.\n\nThầy trò mình cùng trò chuyện cởi mở để khai mở và tìm ra điểm tựa định hướng phù hợp nhất với bản thân em nhé.\n\nSau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`;
    } else {
      // NHÁNH A: HỌC SINH ĐÃ CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Thầy đã tiếp nhận dữ liệu từ Bước 1: Em chọn ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**. Kết quả Holland của em là nhóm nổi trội **${anchor.holland_code}**.\n\nThầy trò mình cùng trò chuyện cởi mở nhé. Em chọn ngành **${anchor.target_career}** vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang 'hot' và được nhiều người khen ngợi?`;
    }

    const initMsg = [{
      role: 'model',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(initMsg);
    try { localStorage.setItem("cbas_step2_messages", JSON.stringify(initMsg)); } catch (e) {}
    setChatStage(1);
    setIsCompleted(false);
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
    const career = profile?.target_career || profile?.targetMajor || "ngành đã chọn";
    const uni = profile?.target_university || "trường đại học mục tiêu";
    const score = profile?.confidence_score || profile?.confidence || "8";
    const holland = profile?.holland_code || profile?.hollandCode || "RIASEC";
    const isBranchB = isUndecidedOrVague(career);

    const specialDirective = specialInstruction ? `\n\nCHỈ DẪN ĐẶC BIỆT KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

    if (!isBranchB) {
      // ==========================================
      // KỊCH BẢN NHÁNH A (ĐÃ CÓ MỤC TIÊU CỤ THỂ)
      // ==========================================
      switch (round) {
        case 1:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (ĐÀO SÂU ĐỘNG CƠ CHỌN NGÀNH - TUYỆT ĐỐI CẤM HỎI LẠI CÂU MỞ ĐẦU):
- Học sinh vừa trả lời câu hỏi mở đầu về động cơ chọn ngành ${career}: "${userText}".
- Nhóm Holland nổi trội của học sinh: ${holland}.
NHIỆM VỤ THỰC HIỆN:
* NẾU HỌC SINH NÊU ĐỘNG CƠ TỪ GIA ĐÌNH / BỐ MẸ ĐỊNH HƯỚNG HOẶC CHỌN HỘ:
  ĐÂY LÀ ĐỘNG CƠ NGOẠI SINH. CẤM TUYỆT ĐỐI không được phản hồi: "Chọn ngành xuất phát từ sự yêu thích tự nhiên...".
  PHẢI PHẢN HỒI ĐÚNG BẢN CHẤT: "Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em. Bản thân em có thực sự tìm thấy sự hứng thú nào với công việc ${career} này không, hay em chỉ đang học để làm hài lòng bố mẹ?"
* NẾU HỌC SINH KHẲNG ĐỊNH TỰ NGUYỆN YÊU THÍCH THỰC SỰ:
  1. Ghi nhận sự khẳng định chân thành của học sinh.
  2. Phân tích rằng sự yêu thích chỉ là điểm khởi đầu, cần gắn liền với các công việc chuyên môn thực tế hàng ngày.
  3. ĐÚNG 01 CÂU HỎI MỚI ĐÀO SÂU: "Cụ thể trong các hoạt động chuyên môn hàng ngày của ngành ${career} (như soạn bài giảng, đứng lớp truyền đạt kiến thức, kiên nhẫn đồng hành hỗ trợ học sinh), hoạt động nào khiến em cảm thấy bản thân hào hứng và có nhiều năng lượng nhất?"
[RÀO CẢN BẮT BUỘC]: TUYỆT ĐỐI CẤM hỏi lại câu: "chọn vì thực sự yêu thích hay vì hot/khen ngợi".
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng đồng hành, chân thành, tôn trọng.`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (ÁP LỰC NGHỀ, XU HƯỚNG TƯƠNG LAI & CHUẨN BỊ TỔ HỢP):
- Ngành: ${career}, mã Holland: ${holland}.
- Học sinh vừa trả lời về động cơ chọn ngành: "${userText}".
NHIỆM VỤ THỰC HIỆN (BẮT BUỘC LỒNG GHÉP 2 YẾU TỐ):
1. Đúng 01 câu ghi nhận và đồng cảm với mong muốn của học sinh.
2. Phân tích thực tế thị trường lao động 5-10 năm tới dưới tác động của AI, Chuyển đổi số, Tự động hóa: Người làm nghề ${career} tương lai không chỉ làm các tác vụ cơ bản lặp đi lặp lại mà phải thích ứng với chuẩn năng lực mới (ví dụ với giáo viên là tích hợp công nghệ EdTech, rèn luyện tư duy cho học sinh).
3. ĐÚNG 01 CÂU HỎI KẾT NỐI VÒNG 3: "Để thích ứng với những tiêu chuẩn mới đó, em dự định trang bị năng lực gì và để thi/xét tuyển vào ngành ${career} tại ${uni}, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?"
Quy chuẩn: Dưới 130 từ. Giữ âm hưởng đồng hành, tôn trọng, không dùng văn mẫu rập khuôn.`;

        case 3:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (ĐỐI CHẤT TỔ HỢP MÔN & HỌC LỰC THỰC TẾ):
- Ngành ${career} tại ${uni}, điểm tự tin ${score}/10.
- Học sinh vừa phản hồi: "${userText}".
NHIỆM VỤ THỰC HIỆN:
* NẾU HỌC SINH PHẢN BIỆN LẠI THẦY (Ví dụ: "đâu có nghịch lý gì thầy ơi", "em thấy bình thường", hoặc giải thích lý do vì chưa định hình môn dạy):
  - [CẤM TUYỆT ĐỐI]: AI TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý phán đoán học sinh "học lực đều đều", KHÔNG ĐƯỢC khuyên học Cao đẳng, và TUYỆT ĐỐI KHÔNG ĐƯỢC kết thúc phiên chat tại đây!
  - [NHIỆM VỤ 3 BƯỚC BẮT BUỘC]:
    (1) Bước a: Công nhận tư duy thực tế và tinh thần phản biện thẳng thắn của học sinh (việc chưa chọn môn dạy thì chưa thể vội tra cứu tổ hợp là hoàn toàn tự nhiên).
    (2) Bước b: Chỉ ra rằng mọi tính toán về nhu cầu thị trường hay lựa chọn môn dạy đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đại học tại ${uni} (24 - 27 điểm).
    (3) Bước c: BẮT BUỘC kết thúc bằng câu hỏi dứt khoát: "Để giúp em tìm ra điểm tựa thực tế nhất: Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?"
* NẾU HỌC SINH NÓI CHƯA BIẾT / CHƯA TÌM HIỂU TỔ HỢP MÔN:
  BẮT BUỘC thực hiện Kỹ thuật 3 Nhịp:
  (1) Thấu cảm / gợi mở 2 trục năng lực (KHTN/Logic vs KHXH/Ngôn ngữ);
  (2) Chỉ ra mức độ cạnh tranh điểm chuẩn 24-27 điểm khắt khe;
  (3) KẾT THÚC BẰNG CÂU HỎI THĂM DÒ ĐỐI CỰC TRUNG LẬP: "Nhìn lại kết quả học tập ở trường, đâu là môn học sở trường tạo lợi thế lớn nhất cho em, và môn nào đang là môn em còn nhiều khoảng cách nhất?"
* NẾU HỌC SINH NÓI "HỌC ĐỀU ĐỀU CÁC MÔN" / "BÌNH THƯỜNG / TÀN TÀN":
  BẮT BUỘC chỉ ra mức độ cạnh tranh điểm chuẩn rất khắt khe (thường từ 24-27 điểm, tức 8-9 điểm/môn) và hỏi mở xem môn nào học sinh có khả năng bứt phá kéo điểm tổ hợp.
* NẾU HỌC SINH ĐÃ NÊU TỔ HỢP/MÔN CỤ THỂ:
  Hỏi đối chiếu điểm học lực thực tế: "Nhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?"
Quy chuẩn: Dưới 130 từ. CẤM kết thúc chat khi học sinh chưa nêu rõ môn học!`;

        case 4:
        default:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (TÁI CẤU TRÚC MỤC TIÊU & MỆNH LỆNH CHUYỂN BƯỚC 3 - TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
- Học sinh vừa trả lời về tương quan điểm số / môn sở trường: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu khen ngợi sự trung thực và bước trưởng thành nhận thức của học sinh qua các vòng đối thoại.
2. BẮT BUỘC PHÂN TÍCH CHÍNH XÁC CẶP MÔN / TÌNH TRẠNG HỌC SINH VỪA NÊU Ở VÒNG 3:
   * NẾU HỌC SINH YẾU CẢ TOÁN VÀ VĂN (HOẶC HỌC LỰC ĐỀU ĐỀU THẤP):
     Phải nhận diện ngay đây là thử thách rất lớn vì phần lớn các ngành Sư phạm tại ${uni} đều xét tuyển có môn Toán hoặc Văn với điểm chuẩn cao (thường từ 24 - 27 điểm).
     Đưa ra giải pháp thích ứng kép:
     (1) Nỗ lực bứt phá các môn sở trường còn lại (Ngoại ngữ, KHTN, Sử, Địa) để kéo điểm tổ hợp;
     (2) Cân nhắc phân khúc vừa sức như hệ Cao đẳng Sư phạm hoặc Cao đẳng Giáo dục nghề nghiệp thực hành để giảm áp lực điểm thi mà vẫn giữ trọn cơ hội làm nghề giáo dục.
   * NẾU HỌC SINH GIỎI TOÁN, YẾU VĂN: Định hướng Sư phạm Toán, Tin (khối A00, A01) để tận dụng Toán và tránh Văn.
   * NẾU HỌC SINH GIỎI VĂN, YẾU TOÁN: Định hướng Sư phạm Ngữ văn, Lịch sử, Tiểu học (khối C00, D01) để phát huy Văn và tránh Toán.
   * NẾU HỌC SINH CÓ THẾ MẠNH MÔN KHÁC (GDQP, KTPL): Định hướng theo đúng môn thế mạnh đó.
3. PHẢI RA LỆNH RÕ RÀNG (TUYỆT ĐỐI KHÔNG HỎI THÊM):
   "Bây giờ, em hãy dừng suy đoán và bấm chuyển sang Bước 3: Môi trường đối chứng dữ liệu thực tế để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!"
Quy chuẩn: Dưới 140 từ. Dứt khoát, trao quyền tự quyết.`;
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
    const career = profile?.target_career || profile?.targetMajor || "Công nghệ thông tin";
    const uni = profile?.target_university || "Đại học Bách Khoa";
    const score = profile?.confidence_score || profile?.confidence || "8";
    const holland = profile?.holland_code || profile?.hollandCode || "RIASEC";
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
        return `Mong muốn có thu nhập tốt và cuộc sống đủ đầy là nhu cầu hoàn toàn chính đáng của mỗi người.\n\nTuy nhiên trong thực tế, để có uy tín và thu hút nhiều người theo học, người làm nghề **${career}** phải có trình độ chuyên môn vượt trội và sự rèn luyện bền bỉ ra sao? Em đã có sự chuẩn bị gì cho năng lực chuyên môn cốt lõi đó?`;
      }

      // 2. Phản xạ tâm lý bất ngờ: Tự ti / hoang mang
      const isInsecure = [
        'dốt', 'kém', 'sợ trượt', 'không biết làm được', 'không biết có làm được', 'lo lắng', 'hoang mang', 'tự ti', 'áp lực', 'sợ không đỗ'
      ].some(k => lowerUser.includes(k));
      if (isInsecure && round <= 3) {
        return `Sự lo lắng và cảm giác hoài nghi bản thân là trạng thái tâm lý rất thật và đáng được tôn trọng khi em đứng trước cánh cửa tương lai quan trọng.\n\nNhìn lại chính mình lúc này, điều gì đang làm em cảm thấy áp lực nhất: khối lượng kiến thức chuyên môn, điểm số thi tuyển, hay áp lực từ sự kỳ vọng của người khác?`;
      }

      switch (round) {
        case 1: {
          const isFamily = [
            'mẹ định hướng', 'me dinh huong', 'bố mẹ', 'ba mẹ', 'cha mẹ', 'gia đình định hướng', 'gia đình muốn',
            'bố mẹ chọn', 'ba mẹ chọn', 'mẹ chọn', 'bố chọn', 'mẹ em chọn', 'bố em chọn', 'ba em chọn',
            'theo ý bố', 'theo ý mẹ', 'theo ý ba', 'nghe lời bố', 'nghe lời mẹ', 'nghe lời ba', 'nghe lời gia đình',
            'bố mẹ bắt', 'ba mẹ bắt', 'mẹ bắt', 'bố bắt', 'gia đình bắt', 'gia đình khuyên', 'bố mẹ khuyên',
            'bố mẹ hướng', 'mẹ hướng', 'ba hướng', 'định hướng của gia đình', 'định hướng từ bố', 'định hướng từ mẹ',
            'bố mẹ muốn', 'ba mẹ muốn', 'mẹ em muốn', 'bố em muốn', 'nhà em muốn', 'ba mẹ định hướng',
            'mẹ em bảo', 'bố em bảo', 'ba em bảo'
          ].some(k => lowerUser.includes(k));

          if (isFamily) {
            return `Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em.\n\n` +
              `Bản thân em có thực sự tìm thấy sự hứng thú nào với công việc **${career}** này không, hay em chỉ đang học để làm hài lòng bố mẹ?`;
          }

          return `Thầy rất ghi nhận niềm yêu thích tự nhiên và sự khẳng định chân thành của em dành cho ngành **${career}**.\n\n` +
            `Tuy nhiên, sự yêu thích chỉ trở thành điểm tựa vững chắc khi em hiểu rõ các công việc chuyên môn thực tế hàng ngày đằng sau nó.\n\n` +
            `Cụ thể trong các hoạt động chuyên môn của nghề (như chuẩn bị bài giảng, đứng lớp truyền đạt kiến thức, kiên nhẫn đồng hành cùng học sinh hay chấm bài), hoạt động nào khiến em cảm thấy bản thân có nhiều năng lượng và hứng thú nhất?`;
        }

        case 2:
          return `Thầy rất ủng hộ tinh thần tích cực và khát vọng của em.\n\n` +
            `Tuy nhiên trong 5-10 năm tới, AI, công nghệ và chuyển đổi số sẽ tái cơ cấu mạnh mẽ thị trường việc làm. Người làm nghề **${career}** tương lai không chỉ thực hiện các tác vụ cơ bản lặp đi lặp lại mà bắt buộc phải thích ứng với chuẩn năng lực mới, làm chủ công nghệ và rèn luyện kỹ năng tư duy bậc cao.\n\n` +
            `Để thích ứng với những tiêu chuẩn mới đó, em dự định trang bị năng lực gì và để thi/xét tuyển vào ngành **${career}** tại **${uni}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?`;

        case 3: {
          const lowerUser = (userText || '').toLowerCase();

          if (isCounterArguing(userText)) {
            return `Thầy rất ghi nhận tinh thần phản biện thẳng thắn và tư duy thực tế của em. Đúng là khi chưa chọn được môn dạy cụ thể thì việc chưa thể tra cứu ngay tổ hợp xét tuyển là hoàn toàn tự nhiên.\n\n` +
              `Tuy nhiên, mọi dự định về môn dạy hay nhu cầu thị trường đều trở nên vô nghĩa nếu không vượt qua được ngưỡng điểm chuẩn đầu vào tại **${uni}** (thường từ 24 đến 27 điểm, tức trung bình 8 đến 9 điểm/môn).\n\n` +
              `Đâu là môn học sở trường có điểm số cao nhất hiện tại của em, và môn nào em đang thấy đuối sức nhất?`;
          }

          const isExplainingUndecided = [
            'chưa định hình', 'chua dinh hinh', 'chưa biết dạy môn', 'chưa biết môn nào',
            'chưa biết dạy gì', 'chưa chọn môn', 'chưa biết sư phạm gì', 'chưa rõ dạy môn',
            'chưa biết là dạy', 'chưa biết sẽ dạy', 'chưa định hình dạy', 'phân vân môn', 'chưa chọn được môn'
          ].some(k => lowerUser.includes(k)) || (lowerUser.includes('dạy môn') && (lowerUser.includes('chưa') || lowerUser.includes('không')));

          if (isExplainingUndecided) {
            return `Thầy rất thấu cảm với lý do của em. Hoàn toàn tự nhiên và hợp lý khi chưa định hình mình muốn dạy môn gì thì rất khó để biết phải tra cứu tổ hợp môn nào!\n\n` +
              `Thực tế trong ngành Sư phạm, môn dạy sau này gắn chặt với nhóm năng lực trụ cột của em: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Lát nữa ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh của trường để kiểm chứng chi tiết.\n\n` +
              `Để giúp em định hình chính xác môn dạy và tổ hợp phù hợp nhất: Nhìn lại kết quả học tập ở trường, đâu là môn học sở trường tạo lợi thế lớn nhất cho em, và môn nào đang là môn em còn nhiều khoảng cách nhất?`;
          }

          const isEvenGrades = [
            'đều đều', 'deu deu', 'học đều', 'hoc deu', 'các môn như nhau',
            'ngang nhau', 'bình thường', 'trung bình', 'không có môn nào nổi',
            'môn nào cũng vậy', 'như nhau'
          ].some(k => lowerUser.includes(k));

          if (isEvenGrades) {
            return `Thầy ghi nhận sự thẳng thắn của em. Tuy nhiên, việc "học đều đều các môn" thường mang lại cảm giác an toàn ảo. Thực tế xét tuyển đại học vào các ngành hot của **${uni}** đòi hỏi điểm chuẩn rất cao (thường từ 24 đến 27 điểm, tức trung bình 8 đến 9 điểm mỗi môn trong tổ hợp).\n\n` +
              `Nếu em học đều nhưng không có môn nào bứt phá đạt ngưỡng 8.5 - 9.0 điểm, em sẽ rất khó cạnh tranh với các bạn có môn sở trường vượt trội.\n\n` +
              `Trong các môn hiện tại, môn nào em cảm thấy có tiềm năng bứt phá điểm số cao nhất nếu được đầu tư ôn luyện nghiêm túc từ bây giờ?`;
          }

          return `Thầy đánh giá cao sự trung thực của em. Nuôi dưỡng ước mơ với ngành **${career}** là bước khởi đầu rất đẹp, nhưng để bước chân qua cánh cổng trường đại học, tổ hợp môn xét tuyển chính là chiếc chìa khóa quyết định mà em không thể bỏ quên!\n\n` +
            `Quy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực đặc thù: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\n` +
            `Nhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?`;
        }

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

          const hasMath = lowerUser.includes('toán') || lowerUser.includes('toan');
          const hasLit = lowerUser.includes('văn') || lowerUser.includes('van');

          // 1. Kiểm tra trường hợp YẾU CẢ TOÁN VÀ VĂN:
          const weakBothPatterns = [
            /(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)[^,.;!?\n]*(văn\s*(và|với|lẫn|\+)\s*toán|toán\s*(và|với|lẫn|\+)\s*văn)/i,
            /(văn\s*(và|với|lẫn|\+)\s*toán|toán\s*(và|với|lẫn|\+)\s*văn)[^,.;!?\n]*(đều|cũng|thì|là môn)?[^,.;!?\n]*(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)/i,
            /(yếu cả|kém cả|đuối cả|sợ cả)[^,.;!?\n]*(toán|văn)/i,
            /(cả toán lẫn văn|cả văn lẫn toán|cả toán và văn|cả văn và toán)[^,.;!?\n]*(đều|cũng)?[^,.;!?\n]*(yếu|kém|đuối|sợ)/i,
            /(hai môn|2 môn|cả hai môn)\s*(toán[^,.;!?\n]*văn|văn[^,.;!?\n]*toán)[^,.;!?\n]*(đều|cũng)?[^,.;!?\n]*(yếu|kém|đuối|sợ)/i
          ];

          if (weakBothPatterns.some(p => p.test(lowerUser))) {
            return `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\n` +
              `Khi yếu cả hai môn cốt lõi là Toán và Ngữ văn, đây là một thử thách rất lớn đối với ước mơ vào ngành Sư phạm tại **${uni}**, bởi vì phần lớn các tổ hợp xét tuyển truyền thống (như A00, B00, C00, D01) đều bắt buộc phải có Toán hoặc Văn với điểm chuẩn rất cao (thường từ 24 - 27 điểm).\n\n` +
              `Tuy nhiên, việc các môn còn lại em học tốt mở ra 2 hướng thích ứng rất cụ thể:\n` +
              `1. **Tận dụng các môn còn lại học tốt**: Nếu em học tốt Tiếng Anh, Lịch sử, Địa lý hay Khoa học Tự nhiên (Hóa, Sinh), em hoàn toàn có thể tìm kiếm các tổ hợp tương ứng (ví dụ: Sư phạm Lịch sử - Địa lý, Sư phạm Tiếng Anh nếu khá ngoại ngữ, hoặc Sư phạm Khoa học Tự nhiên/Sinh học).\n` +
              `2. **Cân nhắc phân khúc vừa sức**: Nếu điểm 2 môn cốt lõi Toán - Văn quá thấp so với điểm chuẩn đại học, em hãy cân nhắc phân khúc hệ **Cao đẳng Sư phạm** hoặc **Cao đẳng Giáo dục nghề nghiệp thực hành** (thời gian đào tạo 2.5 - 3 năm, chú trọng tay nghề, áp lực thi tuyển nhẹ nhàng hơn và vẫn đảm bảo cơ hội làm nghề giáo dục).\n\n` +
              `Bây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
          }

          // Math strong
          const mathStrongPatterns = [
            /(giỏi|tốt|khá|thế mạnh|sở trường|thích|ổn)\s+(môn\s+)?toán/i,
            /toán\s+(thì\s+)?(em\s+)?(học\s+)?(giỏi|tốt|khá|thế mạnh|sở trường|cao|ổn)/i,
            /(sở trường|thế mạnh)[^,.;!?\n]*toán/i
          ];
          // Math weak
          const mathWeakPatterns = [
            /(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)\s+(môn\s+)?toán/i,
            /toán\s+(thì\s+)?(em\s+)?(hơi\s+|học\s+)?(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)/i,
            /(yếu nhất|kém nhất)[^,.;!?\n]*toán/i
          ];

          // Lit strong
          const litStrongPatterns = [
            /(giỏi|tốt|khá|thế mạnh|sở trường|thích|ổn)\s+(môn\s+)?văn/i,
            /văn\s+(thì\s+)?(em\s+)?(học\s+)?(giỏi|tốt|khá|thế mạnh|sở trường|cao|ổn)/i,
            /(sở trường|thế mạnh)[^,.;!?\n]*văn/i
          ];
          // Lit weak
          const litWeakPatterns = [
            /(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)\s+(môn\s+)?văn/i,
            /văn\s+(thì\s+)?(em\s+)?(hơi\s+|học\s+)?(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)/i,
            /(yếu nhất|kém nhất)[^,.;!?\n]*văn/i
          ];

          const mathStrong = mathStrongPatterns.some(p => p.test(lowerUser));
          const mathWeak = mathWeakPatterns.some(p => p.test(lowerUser));
          const litStrong = litStrongPatterns.some(p => p.test(lowerUser));
          const litWeak = litWeakPatterns.some(p => p.test(lowerUser));

          if (mathWeak && litWeak && !mathStrong && !litStrong) {
            return `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\n` +
              `Khi yếu cả hai môn cốt lõi là Toán và Ngữ văn, đây là một thử thách rất lớn đối với ước mơ vào ngành Sư phạm tại **${uni}**, bởi vì phần lớn các tổ hợp xét tuyển truyền thống (như A00, B00, C00, D01) đều bắt buộc phải có Toán hoặc Văn với điểm chuẩn rất cao (thường từ 24 - 27 điểm).\n\n` +
              `Tuy nhiên, việc các môn còn lại em học tốt mở ra 2 hướng thích ứng rất cụ thể:\n` +
              `1. **Tận dụng các môn còn lại học tốt**: Nếu em học tốt Tiếng Anh, Lịch sử, Địa lý hay Khoa học Tự nhiên (Hóa, Sinh), em hoàn toàn có thể tìm kiếm các tổ hợp tương ứng (ví dụ: Sư phạm Lịch sử - Địa lý, Sư phạm Tiếng Anh nếu khá ngoại ngữ, hoặc Sư phạm Khoa học Tự nhiên/Sinh học).\n` +
              `2. **Cân nhắc phân khúc vừa sức**: Nếu điểm 2 môn cốt lõi Toán - Văn quá thấp so với điểm chuẩn đại học, em hãy cân nhắc phân khúc hệ **Cao đẳng Sư phạm** hoặc **Cao đẳng Giáo dục nghề nghiệp thực hành** (thời gian đào tạo 2.5 - 3 năm, chú trọng tay nghề, áp lực thi tuyển nhẹ nhàng hơn và vẫn đảm bảo cơ hội làm nghề giáo dục).\n\n` +
              `Bây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
          }

          if (litStrong && (mathWeak || !mathStrong)) {
            return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Năng khiếu Ngữ văn là nền tảng rất vững chắc cho các ngành Sư phạm Ngữ văn, Giáo dục Tiểu học hoặc Sư phạm Khoa học Xã hội (khối C00, D01), giúp em phát huy trọn vẹn thế mạnh ngôn ngữ và hoàn toàn tránh được rào cản môn Toán!\n\n` +
              `Để tối ưu cơ hội tương lai, em có 2 hướng thích ứng:\n` +
              `1. **Tập trung bứt phá điểm số**: Dồn sức cho môn Văn và các môn xã hội/ngoại ngữ đi kèm để đạt ngưỡng điểm chuẩn đại học (24 - 27 điểm).\n` +
              `2. **Lựa chọn phân khúc vừa sức**: Cân nhắc hệ Cao đẳng Sư phạm thực hành nếu muốn giảm tải áp lực thi cử và sớm có tay nghề đứng lớp.\n\n` +
              `Bây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
          }

          if (mathStrong && (litWeak || !litStrong)) {
            return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00: Toán-Lý-Hóa hoặc A01: Toán-Lý-Anh), hoàn toàn tránh được rào cản môn Ngữ văn!\n\n` +
              `Để tối ưu cơ hội tương lai, em có 2 hướng thích ứng:\n` +
              `1. **Tập trung bứt phá điểm số**: Dồn sức cho môn Toán và các môn tự nhiên đi kèm để đạt ngưỡng điểm chuẩn đại học (24 - 27 điểm).\n` +
              `2. **Lựa chọn phân khúc vừa sức**: Cân nhắc hệ Cao đẳng thực hành nếu muốn giảm tải áp lực thi cử và sớm có tay nghề.\n\n` +
              `Bây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
          }

          return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\n` +
            `Dù theo đuổi ngành nào, em luôn có 2 hướng thích ứng rất rõ ràng:\n` +
            `1. **Bứt phá điểm số**: Tập trung cao độ vào tổ hợp môn có thế mạnh để cạnh tranh vào hệ Đại học chính quy.\n` +
            `2. **Lựa chọn phân khúc vừa sức**: Cân nhắc hệ Cao đẳng nghề/thực hành (2.5 - 3 năm) để sớm gia nhập thị trường việc làm với tay nghề vững chắc.\n\n` +
            `Bây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
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
            `Em vừa tự tay định hình mục tiêu đầu tiên cho bản thân. Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tra cứu Đề án tuyển sinh xem ngành này ở các trường đại học hoặc cao đẳng gần địa phương yêu cầu điều kiện gì nhé!`;
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
        hollandCode: studentProfile?.holland_code || studentProfile?.hollandCode || 'RIASEC',
        targetCareer: studentProfile?.target_career || studentProfile?.targetMajor || 'Sư phạm',
        targetSchool: studentProfile?.target_university || studentProfile?.targetSchool || 'ĐH Quy Nhơn',
        confidenceT0: studentProfile?.confidence_score || studentProfile?.confidence || '5',
        competenceSelfEval: 'Vừa sức'
      },
      chatHistory: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text })),
      userMessage: userText,
      // Hỗ trợ trường tương thích:
      message: userText,
      history: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text })),
      anchor: studentProfile,
      specialInstruction: specialInstruction
    };

    const studentHasDeclaredSubjects = hasDeclaredSubjectsOrGrades(userText);
    let targetNextStage = stage + 1;
    let targetIsCompleted = false;

    if (stage === 1) {
      targetNextStage = 2;
      targetIsCompleted = false;
    } else if (stage === 2) {
      targetNextStage = 3;
      targetIsCompleted = false; // BẮT BUỘC: Khung chat phải giữ mở để học sinh trả lời ở Stage 3!
    } else if (stage >= 3) {
      if (!studentHasDeclaredSubjects) {
        // Học sinh phản biện lại hoặc chưa nêu môn cụ thể: GIỮ NGUYÊN GIAI ĐOẠN 3, CHƯA ĐƯỢC KẾT THÚC!
        targetNextStage = 3;
        targetIsCompleted = false;
      } else {
        // Học sinh ĐÃ nêu rõ môn học: CHÍNH THỨC SANG GIAI ĐOẠN 4 VÀ HOÀN TẤT!
        targetNextStage = 4;
        targetIsCompleted = true;
      }
    }

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
          const replyText = sData?.response || sData?.reply;
          if (replyText && replyText.trim().length >= 25) {
            return {
              replyText: replyText.trim(),
              chatStage: sData?.chatStage || sData?.stage || targetNextStage,
              isCompleted: sData?.isCompleted === true
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
          }
        }
        if (text && text.trim().length >= 25) {
          return {
            replyText: text.trim(),
            chatStage: targetNextStage,
            isCompleted: targetIsCompleted
          };
        }
      }
    } catch (e) {
      console.warn("Direct Gemini call exception:", e);
    }

    // 3.3. Kích hoạt fallback heuristic dự phòng chuẩn CBAS nếu mạng chậm hoặc hết quota
    const fallbackText = generateHeuristicFallback(stage, studentProfile, userText, specialInstruction);
    return {
      replyText: fallbackText,
      chatStage: targetNextStage,
      isCompleted: targetIsCompleted
    };
  };

  // 4. TRÍCH XUẤT VĂN BẢN ĐỐI THOẠI CHUẨN MỰC CHO HỌC SINH
  const generateExportText = () => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    let anchor = {};
    if (rawAnchor) {
      try { anchor = JSON.parse(rawAnchor); } catch (e) {}
    }

    const targetCareer = anchor.target_career || studentProfile?.target_career || 'Sư phạm';
    const targetUniv = anchor.target_university || studentProfile?.target_university || 'ĐH Quy Nhơn';
    const confidence = anchor.confidence_score || studentProfile?.confidence_score || '5';
    const holland = anchor.holland_code || studentProfile?.holland_code || 'AEI';
    const dateStr = new Date().toLocaleString('vi-VN');

    let content = `=================================================================\n`;
    content += `   BIÊN BẢN PHẢN TƯ HƯỚNG NGHIỆP SOCRATES (BƯỚC 2 - CBAS)\n`;
    content += `       Dự án Nghiên cứu Khoa học Hành vi (ViSEF 2026)\n`;
    content += `=================================================================\n\n`;
    content += `📅 Thời gian xuất: ${dateStr}\n`;
    content += `🎯 Ngành mục tiêu: ${targetCareer}\n`;
    content += `🏛️ Trường đại học mục tiêu: ${targetUniv}\n`;
    content += `📊 Mức tự tin ban đầu (Bước 1): ${confidence}/10\n`;
    content += `🧬 Thiên hướng Holland (RIASEC): ${holland}\n`;
    content += `🔄 Tiến trình hoàn thành: ${Math.min(chatStage, maxStages)} / ${maxStages} giai đoạn phản tư${isCompleted ? ' (Đã hoàn thành đầy đủ)' : ''}\n\n`;

    if (sessionTelemetry) {
      content += `-----------------------------------------------------------------\n`;
      content += `KẾT QUẢ ĐO LƯỜNG VÀ GẮN NHÃN HÀNH VI (CHUẨN VISEF 2026):\n`;
      content += `-----------------------------------------------------------------\n`;
      content += `- Bước ngoặt nhận thức (Turning_Point_Detected): ${sessionTelemetry.turning_point_detected}\n`;
      content += `- Phân loại kết quả (Outcome_Category): ${sessionTelemetry.outcome_category}\n`;
      content += `- Phân luồng buổi tư vấn Bước 4 (Triage_Step4): ${sessionTelemetry.triage_step4}\n\n`;
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

    try {
      let aiResult = null;
      if (reflex.directReply) {
        aiResult = {
          replyText: reflex.directReply,
          chatStage: chatStage,
          isCompleted: false
        };
      } else {
        aiResult = await callGeminiSocratic(messages, cleanText, chatStage, reflex.instructionForAI);
      }
      
      const replyContent = aiResult?.replyText || (typeof aiResult === 'string' ? aiResult : '');
      const nextStage = aiResult?.chatStage || (chatStage + 1);
      const isFinished = aiResult?.isCompleted === true;

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
          try { localStorage.setItem("cbas_step2_completed", "true"); } catch (e) {}

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
          if (lastUserMsg.includes('cao đẳng') || lastUserMsg.includes('học nghề') || lastUserMsg.includes('thực hành') || lastUserMsg.includes('nghề')) {
            outcome = 'Segment_Shift';
          } else if (lastUserMsg.includes('chuyển') || lastUserMsg.includes('đổi ngành') || lastUserMsg.includes('ngành khác') || lastUserMsg.includes('phù hợp hơn')) {
            outcome = 'Field_Shift';
          } else if (lastUserMsg.includes('mặc kệ') || lastUserMsg.includes('thích thì') || lastUserMsg.includes('kệ') || lastUserMsg.includes('bất chấp')) {
            outcome = 'Resistance';
          } else {
            outcome = 'Persistent_Calibrated';
          }

          // Bắt buộc phân luồng In-depth (20 phút) nếu có Turning Point, dịch chuyển phân khúc, hoặc bất kỳ khoảng cách năng lực nào
          const triage = (tpDetected || outcome === 'Segment_Shift' || outcome === 'Field_Shift') ? 'In-depth (20 phút)' : 'Fast-track (5 phút)';

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
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '88vh', fontFamily: 'sans-serif' }}>
      
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
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            Tiến trình: <span style={{ color: '#2563eb' }}>{Math.min(chatStage, maxStages)}</span> / {maxStages} giai đoạn
            {isCompleted && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                ✓ Đã hoàn thành 4 giai đoạn phản tư
              </span>
            )}
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
              key={i} 
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
                {m.text}
                <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>{m.time}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }} className="no-print">
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#64748b' }}>
              🤖 Thầy Socrates đang phản biện luận điểm của em...
            </div>
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }} className="no-print">
            {errorMessage}
          </div>
        )}

        {/* THÔNG BÁO HOÀN THÀNH GIAI ĐOẠN 4 GỌN GÀNG (KHÔNG LẤN CHIẾM NỘI DUNG AI) */}
        {isCompleted && (
          <div 
            className="no-print"
            style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              border: '1.5px solid #10b981',
              borderRadius: '12px',
              padding: '14px 18px',
              marginTop: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '22px', lineHeight: 1 }}>🎉</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 3px 0', fontSize: '14.5px', color: '#065f46', fontWeight: 'bold' }}>
                  ✓ Em đã hoàn thành 4 giai đoạn phản tư nhận thức cùng Thầy Socrates!
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#047857', lineHeight: '1.4' }}>
                  Em hãy đọc kỹ lời đúc kết của Thầy ở trên, sau đó bấm <strong>[TIẾP TỤC SANG BƯỚC 3]</strong> bên dưới để tự tay đối chứng số liệu thực tế.
                </p>
              </div>
            </div>

            {sessionTelemetry && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #a7f3d0' }}>
                <span style={{ fontSize: '11.5px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  📌 Bước ngoặt (TP): {sessionTelemetry.turning_point_detected}
                </span>
                <span style={{ fontSize: '11.5px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  🏷️ Kết quả: {sessionTelemetry.outcome_category}
                </span>
                <span style={{ fontSize: '11.5px', background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  ⏱️ Phân luồng Bước 4: {sessionTelemetry.triage_step4}
                </span>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC TIẾP THEO HOẶC KHUNG NHẬP LIỆU */}
      <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)' }} className="no-print">
        {isCompleted ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={() => window.location.href = '/student/evidence-check'}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '13px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14.5px',
                cursor: 'pointer',
                boxShadow: '0 3px 8px rgba(5, 150, 105, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>TIẾP TỤC SANG BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU ĐỀ ÁN</span>
              <span style={{ fontSize: '16px' }}>➔</span>
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              title="Sao chép toàn bộ biên bản đối thoại"
              style={{
                background: copySuccess ? '#059669' : '#f8fafc',
                color: copySuccess ? '#ffffff' : '#065f46',
                border: '1.5px solid #a7f3d0',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {copySuccess ? '✅ Đã chép' : '📋 Chép biên bản'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder="Tự tay nhập câu trả lời phản biện của em..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '0 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !inputValue.trim() ? 0.6 : 1
              }}
            >
              GỬI ➔
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

export { Step2SocraticAgent };
