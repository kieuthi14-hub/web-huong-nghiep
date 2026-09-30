import React, { useState, useEffect, useRef } from 'react';

// HÀM KIỂM TRA HỌC SINH MƠ HỒ / CHƯA CÓ MỤC TIÊU CỤ THỂ (ĐỂ KÍCH HOẠT NHÁNH B)
export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
}

// BỘ LỌC PHẢN XẠ TỰ NHIÊN TRƯỚC KHI CHẠY MÁY TRẠNG THÁI (NATURAL REFLEX FILTER)
export function processStudentMessage(message, currentRound, studentProfile) {
  const lowerMsg = (message || '').toLowerCase().trim();
  const cleanGreeting = lowerMsg.replace(/[!.,?~]/g, '');

  const targetMajor = studentProfile?.target_career || studentProfile?.targetMajor || 'ngành học';
  const confidence = studentProfile?.confidence_score || studentProfile?.confidence || '8';
  const hollandCode = studentProfile?.holland_code || studentProfile?.hollandCode || 'RIASEC';
  const isBranchB = isUndecidedOrVague(targetMajor);

  // 1.1. Nếu học sinh thắc mắc "Sao thầy hỏi lại?"
  if (lowerMsg.includes('hỏi lại') || lowerMsg.includes('sao hỏi lại') || lowerMsg.includes('hỏi gì kỳ') || lowerMsg.includes('hỏi gì kì') || lowerMsg.includes('trùng câu hỏi') || lowerMsg.includes('vừa hỏi xong')) {
    return {
      advanceRound: false,
      reply: `Thầy hiểu cảm xúc băn khoăn của em. Thầy hỏi lại không phải để làm khó hay kiểm tra trí nhớ của em, mà muốn hai thầy trò cùng soi chiếu vấn đề từ một góc nhìn sâu sắc hơn, giúp em nhận diện rõ động lực thực sự của mình trước khi ra quyết định quan trọng.\n\nĐối với ngành **${targetMajor}**, điều gì trong công việc hàng ngày thực sự tạo cho em cảm hứng lâu dài nhất?`
    };
  }

  // 1.2. Nếu học sinh chỉ chào hỏi xã giao
  const greetings = [
    "chào thầy", "chao thay", "chào", "chao", "hello", "hi", "xin chào", "xin chao",
    "em chào thầy", "em chao thay", "dạ chào thầy", "da chao thay", "dạ", "da", "chào bạn"
  ];
  if (greetings.includes(cleanGreeting) || lowerMsg === "chào thầy" || lowerMsg === "chào" || lowerMsg === "hello") {
    return {
      advanceRound: false, // KHÔNG nhảy vòng
      reply: isBranchB 
        ? `Chào em. Thầy trò mình cùng trò chuyện cởi mở để khai mở bản thân nhé. Sau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`
        : `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${targetMajor}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`
    };
  }

  // 2. Nếu ở Vòng 3 của Nhánh A mà học sinh nói "chưa tìm hiểu tổ hợp môn gồm những môn gì" (hoặc từ khóa chưa biết/chưa tìm hiểu tổ hợp môn):
  const isAskingCombo = [
    'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
    'chưa tìm hiểu', 'chưa biết', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
    'chưa xem', 'em chưa biết', 'chưa tìm', 'không rõ'
  ].some(k => lowerMsg.includes(k));

  if (!isBranchB && currentRound === 3 && isAskingCombo) {
    return {
      advanceRound: true,
      directReply: `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\nQuy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực đặc thù: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\nNhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?`
    };
  }

  // 3. Nếu học sinh hỏi về một nỗi sợ / rào cản cụ thể (như nói trước đám đông, sợ máu, học yếu toán...)
  if (lowerMsg.includes("tự tin") || lowerMsg.includes("đám đông") || lowerMsg.includes("sợ") || lowerMsg.includes("yếu") || lowerMsg.includes("lo lắng") || lowerMsg.includes("áp lực")) {
    return {
      advanceRound: true,
      instructionForAI: `Học sinh đang bộc lộ nỗi sợ: "${message}". Hãy thấu cảm trước trong 1 câu ngắn, giải thích rằng kỹ năng này có thể rèn luyện được, NHƯNG đối chiếu với mã Holland ${hollandCode} của học sinh để hỏi xem tính cách sâu bên trong có thực sự phù hợp với đặc thù công việc hay không.`
    };
  }

  // 4. Nếu không thuộc các trường hợp trên, tiếp tục chạy vòng phản biện bình thường
  return { advanceRound: true };
}

export default function Step2SocraticAgent() {
  const [currentRound, setCurrentRound] = useState(1);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionTelemetry, setSessionTelemetry] = useState(null);

  const maxRounds = 4;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 1. KHỞI TẠO CONTEXT TỪ BƯỚC 1 VÀ PHÂN LUỒNG NHÁNH A / NHÁNH B
  useEffect(() => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    const anchor = rawAnchor ? JSON.parse(rawAnchor) : {
      target_career: "Công nghệ thông tin",
      target_university: "Đại học Bách Khoa",
      confidence_score: "8",
      holland_code: "Nghiên cứu - Kỹ thuật"
    };
    setStudentProfile(anchor);

    // Dọn sạch trạng thái kẹt cũ của các phiên test trước
    localStorage.removeItem("cbas_step2_messages");
    localStorage.removeItem("cbas_step2_round");

    const isBranchB = isUndecidedOrVague(anchor.target_career);

    // LỜI CHÀO & CÂU HỎI MỞ ĐẦU CHUẨN VISEF 2026:
    let initialGreeting = '';
    if (isBranchB) {
      // NHÁNH B: HỌC SINH MƠ HỒ, CHƯA CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Thầy đã tiếp nhận kết quả Bước 1 của em với nhóm Holland nổi trội là **${anchor.holland_code}**, và em đang còn nhiều phân vân chưa chọn được ngành học cụ thể.\n\nThầy trò mình cùng trò chuyện cởi mở để khai mở và tìm ra điểm tựa định hướng phù hợp nhất với bản thân em nhé.\n\nSau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`;
    } else {
      // NHÁNH A: HỌC SINH ĐÃ CÓ MỤC TIÊU CỤ THỂ
      initialGreeting = `Chào em. Thầy đã tiếp nhận dữ liệu từ Bước 1: Em chọn ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**. Kết quả Holland của em là nhóm nổi trội **${anchor.holland_code}**.\n\nThầy trò mình cùng trò chuyện cởi mở để làm rõ bản chất công việc thực tế nhé.\n\nThầy thấy em chọn ngành **${anchor.target_career}** trong khi nhóm nổi trội của em là **${anchor.holland_code}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
    }

    const initMsg = [{
      role: 'model',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(initMsg);
    setCurrentRound(1);
  }, []);

  // CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN VISEF 2026
  const SOCRATIC_PERSONA = `
BẠN LÀ TÁC NHÂN AI SOCRATES - MÔI TRƯỜNG CAN THIỆP TÂM LÝ VÀ PHẢN TƯ NHẬN THỨC NGHỀ NGHIỆP TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC HÀNH VI (CHUẨN VISEF 2026).

[RÀO CẢN SƯ PHẠM VÀ NGUYÊN TẮC HÀNH VI CỐT TỬ - BẮT BUỘC TUÂN THỦ 100%]:
1. Tuyệt đối KHÔNG trả lời thay học sinh, KHÔNG khuyên bảo áp đặt: Không nói "Em nên học ngành X", "Em bỏ ngành Y đi".
2. Tuyệt đối KHÔNG gán nhãn định kiến tiêu cực: CẤM các từ "bẫy nhận thức", "ảo tưởng", "sai lầm", "dốt", "yếu kém", "né tránh", "ấu trĩ".
3. Tuyệt đối KHÔNG khẳng định mã môn tổ hợp tuyển sinh cụ thể của từng trường (ví dụ: không cam kết trường A bắt buộc xét A00 hay D01) nhằm tránh ảo giác dữ liệu (AI Hallucination). Chỉ gợi ý nhóm năng lực trụ cột (Tư duy Logic & Dữ liệu vs Năng lực Ngôn ngữ & Xã hội).
4. Mỗi lượt phản hồi CHỈ GỒM:
   - 01 câu nhận diện/đồng cảm ngắn gọn với câu trả lời trước đó của học sinh.
   - 01 câu phân tích/bóc tách ngắn gọn.
   - Kết thúc bằng ĐÚNG 01 CÂU HỎI PHẢN TƯ DUY NHẤT để học sinh tự trả lời (riêng Vòng 4 là lời khóa phiên chuyển sang Bước 3, tuyệt đối không đặt thêm câu hỏi).
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
BỐI CẢNH VÒNG 1 (KIỂM CHỨNG ĐỘNG CƠ & ĐỐI CHẤT MÃ HOLLAND):
- Học sinh chọn ngành ${career} tại ${uni}, điểm tự tin ${score}/10, nhóm Holland nổi trội: ${holland}.
- Học sinh vừa trả lời: "${userText}".
NHIỆM VỤ THỰC HIỆN (Theo đúng cấu trúc 3 phần):
1. Đúng 01 câu nhận diện & đồng cảm với mong muốn học sinh vừa chia sẻ.
2. Đúng 01 câu phân tích/bóc tách sự khác biệt giữa động cơ nội sinh (thực sự hiểu bản chất công việc) vs động cơ ngoại sinh (thích vì mác oai, trào lưu mạng, sĩ diện).
3. ĐÚNG 01 CÂU HỎI CHỐT: "Thầy thấy em chọn ngành ${career} trong khi nhóm nổi trội của em là ${holland}. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang 'hot' và được nhiều người khen ngợi?"
Quy chuẩn: Dưới 110 từ. Tuyệt đối không dán nhãn tiêu cực.`;

        case 2:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (THỬ THÁCH ÁP LỰC NGHỀ & CHUẨN BỊ MỞ ĐẦU VÒNG 3 TỔ HỢP):
- Ngành: ${career}, mã Holland: ${holland}.
- Học sinh vừa trả lời về động cơ chọn ngành: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu đồng cảm và ghi nhận nỗ lực định hướng của học sinh.
2. Đúng 01 câu bóc tách thực tế thị trường: Thách thức áp lực nghề nghiệp thực tế của ngành ${career} (không dùng văn mẫu rập khuôn).
3. ĐÚNG 01 CÂU HỎI MỞ ĐẦU VÒNG 3 TỔ HỢP MÔN: "Để thi/xét tuyển vào ngành ${career} tại ${uni}, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng đồng hành, tôn trọng.`;

        case 3:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (ĐỐI CHẤT TỔ HỢP MÔN & ĐIỂM SỐ THỰC TẾ - KÍCH HOẠT QUY TRÌNH 3 NHỊP NẾU CHƯA BIẾT):
- Ngành ${career} tại ${uni}, điểm tự tin ${score}/10.
- Học sinh vừa trả lời về tổ hợp môn: "${userText}".
NHIỆM VỤ THỰC HIỆN:
* NẾU HỌC SINH NÓI CHƯA TÌM HIỂU / CHƯA BIẾT: BẮT BUỘC CHẠY KỸ THUẬT 3 NHỊP:
  + Nhịp 1: Nêu nghịch lý (kỳ vọng cao nhưng chưa nắm công cụ xét tuyển).
  + Nhịp 2: Gợi ý nhóm năng lực đặc thù (Khoa học Tự nhiên vs Khoa học Xã hội/Ngôn ngữ), nhắc học sinh sẽ tự kiểm chứng ở Bước 3.
  + Nhịp 3: Hỏi trung lập: "Nhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?"
* NẾU HỌC SINH ĐÃ NÊU TỔ HỢP/MÔN:
  Hỏi đối chiếu điểm học lực thực tế: "Nhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?"
Quy chuẩn: Dưới 120 từ. Tuyệt đối KHÔNG khẳng định mã tổ hợp cụ thể của từng trường nhằm tránh ảo giác AI.`;

        case 4:
        default:
          return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (TÁI CẤU TRÚC MỤC TIÊU & MỆNH LỆNH CHUYỂN BƯỚC 3 - TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
- Học sinh vừa trả lời về tương quan điểm số / môn sở trường: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu khen ngợi sự trung thực và bước trưởng thành nhận thức của học sinh qua các vòng đối thoại.
2. Phân tích xong 3 hướng đi thích ứng:
   * Nỗ lực bứt phá điểm số các môn trong tổ hợp nếu còn thời gian lớp 10/11.
   * Hệ Cao đẳng nghề thực hành (đào tạo 2.5 - 3 năm, chú trọng tay nghề, chi phí thấp, dễ có việc) nếu điểm lý thuyết cách xa Đại học.
   * Chọn ngành phù hợp với môn học sở trường.
3. PHẢI RA LỆNH RÕ RÀNG (TUYỆT ĐỐI KHÔNG HỎI THÊM):
   "Bây giờ, em hãy dừng suy đoán và bấm chuyển sang Bước 3 để tự tra cứu Đề án tuyển sinh chính thức và nhập bảng đối chứng!"
Quy chuẩn: Dưới 135 từ. Ấm áp, trao quyền tự quyết.`;
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
      switch (round) {
        case 1:
          return `Thầy rất trân trọng mong muốn tốt đẹp và những suy nghĩ thẳng thắn mà em vừa chia sẻ: "${userText}".\n\n` +
            `Tuy nhiên, giữa việc thích một ngành vì thấy nó hấp dẫn trên truyền thông và việc thực sự yêu thích các hoạt động công việc chuyên môn hàng ngày của ngành **${career}** là một khoảng cách rất lớn.\n\n` +
            `Thầy thấy em chọn ngành **${career}** trong khi nhóm nổi trội của em là **${holland}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;

        case 2:
          return `Thầy rất ủng hộ tinh thần tích cực và khát vọng hòa nhập xu thế của em.\n\n` +
            `Dưới góc nhìn khách quan của thị trường nghề nghiệp thực tế, áp lực rèn luyện chuyên môn và yêu cầu đào tạo của ngành **${career}** khắt khe hơn rất nhiều so với hình dung ban đầu.\n\n` +
            `Để thi/xét tuyển vào ngành **${career}** tại **${uni}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?`;

        case 3:
          return `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\n` +
            `Quy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực đặc thù: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\n` +
            `Nhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?`;

        case 4:
        default:
          return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\n` +
            `Dựa trên tương quan năng lực hiện tại, em hãy cân nhắc 3 hướng đi thích ứng: nỗ lực bứt phá điểm số các môn trong tổ hợp nếu còn thời gian lớp 10/11; định hướng phân khúc Cao đẳng nghề thực hành (đào tạo 2.5 - 3 năm, chú trọng tay nghề, chi phí thấp, dễ có việc) nếu điểm lý thuyết cách xa Đại học; hoặc chọn ngành phù hợp với môn học sở trường.\n\n` +
            `Bây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự mở tab tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
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
  const callGeminiSocratic = async (historyMessages, userText, round, specialInstruction = null) => {
    // 3.1. Thử gọi Serverless Backend /api/socrates-chat hoặc /api/chat
    const endpointsToTry = ['/api/socrates-chat', '/api/chat'];
    const requestPayload = {
      studentProfile: {
        hollandCode: studentProfile?.holland_code || studentProfile?.hollandCode || 'RIASEC',
        targetCareer: studentProfile?.target_career || studentProfile?.targetMajor || 'Công nghệ thông tin',
        targetSchool: studentProfile?.target_university || studentProfile?.targetSchool || 'Đại học Bách Khoa',
        confidenceT0: studentProfile?.confidence_score || studentProfile?.confidence || '8',
        competenceSelfEval: 'Vừa sức'
      },
      chatHistory: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text })),
      userMessage: userText,
      // Hỗ trợ trường tương thích:
      message: userText,
      history: historyMessages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', text: m.text })),
      round: round,
      maxRounds: maxRounds,
      anchor: studentProfile,
      specialInstruction: specialInstruction
    };

    for (const ep of endpointsToTry) {
      try {
        const serverlessCtrl = new AbortController();
        const sTimeout = setTimeout(() => serverlessCtrl.abort(), 6500);

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
            return replyText.trim();
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

      const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      const systemPrompt = generatePromptForRound(round, studentProfile, userText, specialInstruction);

      const formattedContents = historyMessages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      formattedContents.push({
        role: 'user',
        parts: [{ text: userText }]
      });

      const directCtrl = new AbortController();
      const directTimeout = setTimeout(() => directCtrl.abort(), 6000);

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: formattedContents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600
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
          return text.trim();
        }
      }
    } catch (e) {
      console.warn("Direct Gemini call exception:", e);
    }

    // 3.3. Kích hoạt fallback heuristic dự phòng chuẩn CBAS nếu mạng chậm hoặc hết quota
    return generateHeuristicFallback(round, studentProfile, userText, specialInstruction);
  };

  // 4. TRÍCH XUẤT VĂN BẢN ĐỐI THOẠI CHUẨN MỰC CHO HỌC SINH
  const generateExportText = () => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    let anchor = {};
    if (rawAnchor) {
      try { anchor = JSON.parse(rawAnchor); } catch (e) {}
    }

    const targetCareer = anchor.target_career || studentProfile?.target_career || 'Công nghệ thông tin';
    const targetUniv = anchor.target_university || studentProfile?.target_university || 'Đại học Bách Khoa';
    const confidence = anchor.confidence_score || studentProfile?.confidence_score || '8';
    const holland = anchor.holland_code || studentProfile?.holland_code || 'Nghiên cứu - Kỹ thuật';
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
    content += `🔄 Tiến trình hoàn thành: ${Math.min(currentRound, maxRounds)} / ${maxRounds} vòng phản tư${currentRound > maxRounds ? ' (Đã hoàn thành đầy đủ)' : ''}\n\n`;

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
    if (window.confirm("Em có muốn xóa dữ liệu phiên hiện tại và bắt đầu lại cuộc trò chuyện từ Vòng 1 không?")) {
      localStorage.removeItem("cbas_step2_messages");
      localStorage.removeItem("cbas_step2_round");
      window.location.reload();
    }
  };

  // 5. BỘ LỌC ĐẦU VÀO THÔNG MINH & ĐIỀU PHỐI VÒNG PHẢN TƯ
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanText = inputValue.trim();
    if (cleanText.length === 0) return;

    // 5.1. Chạy bộ lọc phản xạ tự nhiên trước khi chạy máy trạng thái
    const reflex = processStudentMessage(cleanText, currentRound, studentProfile);

    // Nếu học sinh chỉ chào hỏi xã giao: Trả lời ấm áp, KHÔNG nhảy vòng
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
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setInputValue('');
      return;
    }

    // RÀNG BUỘC THÔNG MINH CHO CÁC LƯỢT TIẾP THEO:
    // Vòng 1, 2 bắt buộc lập luận (tối thiểu 5 ký tự)
    // Vòng 3 trở đi chấp nhận câu trả lời ngắn ("dạ rồi", "chưa", "em đã xem")
    if (currentRound <= 2 && cleanText.length < 5) {
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
      let aiReply = reflex.directReply;
      if (!aiReply) {
        aiReply = await callGeminiSocratic(messages, cleanText, currentRound, reflex.instructionForAI);
      }
      
      const aiMsg = {
        role: 'model',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedHistory = [...nextHistory, aiMsg];
      setMessages(updatedHistory);
      if (reflex.advanceRound !== false) {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        if (nextR > maxRounds) {
          // Tính toán Telemetry chuẩn ViSEF 2026:
          let tpDetected = false;
          let tpRound = 'Không';
          updatedHistory.forEach((m, idx) => {
            if (m.role === 'user') {
              const lower = m.text.toLowerCase();
              if (lower.includes('chưa') || lower.includes('lo') || lower.includes('sợ') || lower.includes('áp lực') || lower.includes('không biết') || lower.includes('khó')) {
                if (!tpDetected) {
                  tpDetected = true;
                  tpRound = idx <= 3 ? 'Vòng 2' : 'Vòng 3';
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
          } else if (lastUserMsg.includes('mặc kệ') || lastUserMsg.includes('thích thì') || lastUserMsg.includes('kệ')) {
            outcome = 'Resistance';
          } else {
            outcome = 'Persistent_Calibrated';
          }

          const triage = (outcome === 'Segment_Shift' || outcome === 'Field_Shift' || tpDetected) ? 'In-depth (20 phút)' : 'Fast-track (5 phút)';

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
            Tiến trình: <span style={{ color: '#2563eb' }}>{Math.min(currentRound, maxRounds)}</span> / {maxRounds} vòng
            {currentRound > maxRounds && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                ✓ Đã hoàn thành
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
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
        ))}

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

        <div ref={messagesEndRef} />
      </div>

      {/* KHỐI HOÀN THÀNH - CHUYỂN SANG BƯỚC 3 & CÁC NÚT XUẤT NỔI BẬT */}
      {currentRound > maxRounds && (
        <div style={{ padding: '16px 20px', background: '#ecfdf5', borderTop: '1px solid #a7f3d0' }} className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14.5px', color: '#065f46', fontWeight: 'bold' }}>
                🎯 Em đã hoàn thành đủ 4 vòng phản tư nhận thức Socrates!
              </p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#047857' }}>
                Em có thể sao chép hoặc xuất biên bản đối thoại này để làm minh chứng cho buổi Tham vấn 1-1 ở Bước 4.
              </p>
              {sessionTelemetry && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    📌 TP: {sessionTelemetry.turning_point_detected}
                  </span>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    🏷️ Kết quả: {sessionTelemetry.outcome_category}
                  </span>
                  <span style={{ fontSize: '11px', background: '#f3e8ff', color: '#6b21a8', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    ⏱️ Phân luồng Bước 4: {sessionTelemetry.triage_step4}
                  </span>
                </div>
              )}
            </div>

            {/* CỤM NÚT XUẤT CUỐI VÒNG 4 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyText}
                style={{
                  background: copySuccess ? '#059669' : '#ffffff',
                  color: copySuccess ? '#ffffff' : '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {copySuccess ? '✅ Đã sao chép!' : '📋 Sao chép biên bản'}
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 Tải file .TXT
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🖨️ Lưu file PDF
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={handleResetSession}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              🔄 Bắt đầu lại từ đầu
            </button>
            <button 
              type="button"
              onClick={() => window.location.href = '/student/evidence-check'}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
              }}
            >
              Chuyển Sang Bước 3: Đối Chứng Dữ Liệu Tuyển Sinh Thực Tế ➜
            </button>
          </div>
        </div>
      )}

      {/* Ô NHẬP LIỆU DUY NHẤT */}
      <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }} className="no-print">
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || currentRound > maxRounds}
            placeholder={currentRound > maxRounds ? "Phiên phản tư đã kết thúc. Mời em sao chép/xuất biên bản hoặc chuyển sang Bước 3." : "Tự tay nhập câu trả lời phản biện của em..."}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || currentRound > maxRounds}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: isLoading || currentRound > maxRounds ? 'not-allowed' : 'pointer',
              opacity: isLoading || !inputValue.trim() || currentRound > maxRounds ? 0.6 : 1
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
