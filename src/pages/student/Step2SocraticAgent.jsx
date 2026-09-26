import React, { useState, useEffect, useRef } from 'react';

// BỘ LỌC PHẢN XẠ TỰ NHIÊN TRƯỚC KHI CHẠY MÁY TRẠNG THÁI (NATURAL REFLEX FILTER)
export function processStudentMessage(message, currentRound, studentProfile) {
  const lowerMsg = (message || '').toLowerCase().trim();
  const cleanGreeting = lowerMsg.replace(/[!.,?~]/g, '');

  const targetMajor = studentProfile?.target_career || studentProfile?.targetMajor || 'ngành học';
  const confidence = studentProfile?.confidence_score || studentProfile?.confidence || '8';
  const hollandCode = studentProfile?.holland_code || studentProfile?.hollandCode || 'RIASEC';

  // 1. Nếu học sinh chỉ chào hỏi xã giao
  const greetings = [
    "chào thầy", "chao thay", "chào", "chao", "hello", "hi", "xin chào", "xin chao",
    "em chào thầy", "em chao thay", "dạ chào thầy", "da chao thay", "dạ", "da", "chào bạn"
  ];
  if (greetings.includes(cleanGreeting) || lowerMsg === "chào thầy" || lowerMsg === "chào" || lowerMsg === "hello") {
    return {
      advanceRound: false, // KHÔNG nhảy vòng
      reply: `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Em đã chọn ngành ${targetMajor} với mức tự tin ${confidence}/10. Điều gì cụ thể đang khiến em ngập ngừng hoặc lo lắng nhất khi nghĩ về ngành học này?`
    };
  }

  // 2. Nếu học sinh hỏi về một nỗi sợ / rào cản cụ thể (như nói trước đám đông, sợ máu, học yếu toán...)
  if (lowerMsg.includes("tự tin") || lowerMsg.includes("đám đông") || lowerMsg.includes("sợ") || lowerMsg.includes("yếu") || lowerMsg.includes("lo lắng") || lowerMsg.includes("áp lực")) {
    return {
      advanceRound: true,
      instructionForAI: `Học sinh đang bộc lộ nỗi sợ: "${message}". Hãy thấu cảm trước, giải thích rằng kỹ năng này có thể rèn luyện được, NHƯNG đối chiếu với mã Holland ${hollandCode} của học sinh để hỏi xem tính cách sâu bên trong có thực sự phù hợp với đặc thù công việc hay không.`
    };
  }

  // 3. Nếu không thuộc các trường hợp trên, tiếp tục chạy vòng phản biện bình thường
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

  const maxRounds = 4;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 1. KHỞI TẠO CONTEXT TỪ BƯỚC 1 VÀ TẨY SẠCH BỘ NHỚ ĐỆM LỖI
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

    const initialGreeting = `Chào em. Thầy đã tiếp nhận dữ liệu từ Bước 1: Em chọn ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**. Kết quả Holland của em là nhóm **${anchor.holland_code}**.

Thầy ở đây để cùng em phản biện, làm rõ các góc khuất thực tế mà mạng xã hội thường không nói tới.

Để bắt đầu Lượt 1, em hãy chia sẻ thẳng thắn: **Điểm số môn học cụ thể nào hoặc trải nghiệm thực tế nào khiến em tin tưởng (hoặc còn do dự) ở mức ${anchor.confidence_score}/10 rằng mình có năng lực thực sự để theo đuổi ngành ${anchor.target_career}?**`;

    const initMsg = [{
      role: 'model',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(initMsg);
    setCurrentRound(1);
  }, []);

  // CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN CBAS (VISEF 2026)
  const SOCRATIC_PERSONA = `
VAI TRÒ VÀ BẢN SẮC CỐT LÕI:
Bạn là "Thầy Socrates" — một chuyên gia tham vấn hướng nghiệp tâm lý học đường đầy thấu cảm, ấm áp, sâu sắc và tôn trọng tuyệt đối giá trị tự chủ của học sinh THPT. Bạn không phải là một quan tòa phán xét, không phải là một cỗ máy bắt lỗi, mà là một người đồng hành thông thái giúp các em nhận diện rõ những "khoảng cách trải nghiệm" và "nguy cơ tiềm ẩn" trên hành trình lựa chọn tương lai.

NGUYÊN TẮC GIAO TIẾP VÀ ĐẠO ĐỨC NGHIÊN CỨU CBAS (BẮT BUỘC TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG DÁN NHÃN TIÊU CỰC HOẶC PHÁN XÉT:
   - CẤM các từ ngữ: "bẫy nhận thức", "ảo tưởng", "sai lầm", "dốt", "yếu kém", "bị dắt mũi", "mù quáng", "ấu trĩ".
   - BẢN CHẤT HÀNH VI: Học sinh không cố ý mắc bẫy; các em chỉ có mong muốn tự nhiên và tốt đẹp nhưng chưa có cơ hội tiếp cận đầy đủ dữ liệu thực tế và trải nghiệm chuyên sâu.
2. TÁI ĐỊNH KHUNG TỪ NGỮ NÂNG ĐỠ (REFRAMING LEXICON):
   - Thay "Em đang rơi vào bẫy nhận thức..." bằng "Có một khoảng cách rất tự nhiên giữa mong muốn hiện tại và thực tế công việc mà chúng ta cần cùng nhau làm rõ...".
   - Thay "Em đang ảo tưởng/ngộ nhận về ngành..." bằng "Hình ảnh hào nhoáng bề nổi rất dễ khiến chúng ta chưa nhìn thấy hết các áp lực thực tế đằng sau...".
   - Thay "Điểm số của em quá thấp/lỗ hổng lớn..." bằng "Điểm số hiện tại đang gửi cho chúng ta một tín hiệu cảnh báo quan trọng về độ chênh lệch năng lực...".
   - Thay "Em chọn ngành vì bị mỏ neo..." bằng "Những mong đợi từ gia đình/truyền thông là rất dễ hiểu, nhưng liệu nó đã hoàn toàn tương thích với năng lực tự nhiên của em hay chưa?".
3. ĐIỀU CHỈNH ÂM HƯỞNG (TONE OF VOICE):
   - Luôn ghi nhận, khen ngợi phẩm chất tốt đẹp hoặc mong muốn chính đáng của học sinh ở đầu mỗi lượt phản hồi (lòng hiếu thảo, tính cẩn thận, tình yêu thương động vật, sự nhạy bén công nghệ).
   - Tách biệt "con người học sinh" (luôn được tôn trọng) ra khỏi "rủi ro quyết định" (cần được xem xét cẩn trọng).
`;

  const generatePromptForRound = (round, profile, userText, specialInstruction = null) => {
    const career = profile?.target_career || profile?.targetMajor || "ngành đã chọn";
    const uni = profile?.target_university || "trường đại học mục tiêu";
    const score = profile?.confidence_score || profile?.confidence || "8";
    const holland = profile?.holland_code || profile?.hollandCode || "RIASEC";

    const specialDirective = specialInstruction ? `\n\nCHỈ DẪN ĐẶC BIỆT KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

    switch (round) {
      case 1:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (XÁC THỰC CẢM XÚC & ĐỐI CHẤT NĂNG LỰC DỰA TRÊN DỮ LIỆU):
Học sinh chọn ngành ${career} tại ${uni}, điểm tự tin ${score}/10, nhóm Holland là ${holland}.
Học sinh vừa phản hồi: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Ghi nhận mong muốn tốt đẹp, phẩm chất đáng quý hoặc sở thích tự nhiên của học sinh khi hướng tới ngành ${career}.
2. Chỉ ra khoảng cách tự nhiên giữa điểm số/sở thích đời thường với độ khó chuyên môn lâm sàng/học thuật khắt khe và tính kỷ luật chuyên sâu của ngành ${career}.
3. ĐẶT DUY NHẤT 1 CÂU HỎI MỞ ĐỂ HỌC SINH TỰ SOI CHIẾU NĂNG LỰC THỰC TẾ: "Trong 4-5 năm tới, các phần mềm tự động hóa và AI sẽ thay thế phần lớn tác vụ kỹ thuật cơ bản của ngành ${career}. Đâu là năng lực tư duy chuyên sâu hoặc thế mạnh độc bản mà em tin công nghệ không thể thay thế ở bản thân em?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng ấm áp, thấu cảm, tuyệt đối không dán nhãn tiêu cực.`;

      case 2:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (DỰ BÁO XU HƯỚNG TƯƠNG LAI & RỦI RO CÔNG NGHỆ/THỊ TRƯỜNG):
Ngành: ${career}, mã Holland: ${holland}.
Học sinh vừa phản hồi về vũ khí cạnh tranh với AI: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Tôn trọng khát vọng hòa nhập xu thế và nỗ lực của học sinh.
2. Cung cấp góc nhìn khách quan về tự động hóa AI, biến động thị trường hoặc quy luật cạnh tranh khốc liệt về năng suất và chi phí trong ngành ${career}. Nếu có sự lệch pha Holland, phân tích nhẹ nhàng sự khác biệt giữa năng lực chuyên môn cốt lõi và mong muốn cá nhân.
3. ĐẶT DUY NHẤT 1 CÂU HỎI VỀ BỘ KỸ NĂNG CHUYỂN ĐỔI: "Nếu sau khi tốt nghiệp ngành ${career}, thị trường bão hòa hoặc có khoảng trũng việc làm, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm thích ứng nào để duy trì sự bền bỉ và tự nuôi sống bản thân?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng đồng hành, tôn trọng.`;

      case 3:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (KỊCH BẢN THÍCH ỨNG & KẾ HOẠCH B AN TOÀN):
Ngành ${career} tại ${uni}, điểm tự tin ${score}/10.
Học sinh vừa phản hồi về phương án dự phòng: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Đánh giá cao sự dũng cảm khi đối diện với rủi ro và tinh thần chủ động xây dựng kế hoạch dự phòng của học sinh.
2. Chỉ ra điểm cần gia cố trong phương án dự phòng (chuyển từ giả định cảm tính sang cơ sở pháp lý và thị trường vững chắc).
3. ĐẶT DUY NHẤT 1 CÂU HỎI TRUY VẤN DỮ LIỆU THỰC TẾ: "Mức tự tin ${score}/10 cần điểm tựa số liệu pháp lý. Em đã từng tự tay đọc Đề án tuyển sinh chính thức của ${uni}, biết rõ điểm chuẩn 3 năm gần nhất, mức học phí tự chủ từng năm và chỉ tiêu thực tế của ngành ${career} chưa?"
Quy chuẩn: Dưới 85 từ. Súc tích, nâng đỡ, gợi mở.`;

      case 4:
      default:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (TỔNG KẾT NHẬN THỨC & CHUYỂN GIAO NHIỆM VỤ THỰC CHỨNG BƯỚC 3):
Học sinh vừa trả lời câu hỏi dữ liệu tuyển sinh: "${userText}".
NHIỆM VỤ THỰC HIỆN:
1. Khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức của học sinh qua các vòng đối thoại.
2. TÓM TẮT ĐÚNG 3 ĐIỂM LƯU TÂM / RỦI RO TIỀM ẨN mà hai thầy trò đã cùng bóc tách:
   - Điểm 1: Khoảng cách tự nhiên giữa mong muốn/năng lực ban đầu với đòi hỏi chuyên môn học thuật thực tế của ngành ${career}.
   - Điểm 2: Tầm quan trọng của Bộ kỹ năng chuyển đổi và phương án thích ứng trước nguy cơ tự động hóa công nghệ và biến động việc làm.
   - Điểm 3: Sự cần thiết phải tự tay xác thực điểm chuẩn 3 năm, học phí thực tế và đề án tuyển sinh tại ${uni}.
3. TRAO QUYỀN TỰ QUYẾT (TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
   "Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu Đề án tuyển sinh để làm chủ quyết định của chính mình!"
Quy chuẩn: Dưới 135 từ. Ấm áp, truyền cảm hứng tự chủ.`;
    }
  };

  // PHẢN HỒI SOCRATES DỰ PHÒNG CHUẨN CBAS (BẢO HIỂM 100% KHÔNG BAO GIỜ TREO MÁY NẾU MẤT MẠNG HOẶC HẾT QUOTA)
  const generateHeuristicFallback = (round, profile, userText = '', specialInstruction = null) => {
    const career = profile?.target_career || profile?.targetMajor || "Công nghệ thông tin";
    const uni = profile?.target_university || "Đại học Bách Khoa";
    const score = profile?.confidence_score || profile?.confidence || "8";
    const holland = profile?.holland_code || profile?.hollandCode || "RIASEC";

    if (specialInstruction) {
      return `Thầy rất thấu cảm và trân trọng sự trung thực của em khi chia sẻ: "${userText}".\n\n` +
        `Những rào cản kỹ năng như giao tiếp trước đám đông hay áp lực tính toán đều có thể rèn luyện và bồi đắp được theo thời gian. Tuy nhiên, đối chiếu với nhóm tính cách Holland của em (${holland}), điều cốt lõi là em cần lắng nghe xem bản thân có thực sự tìm thấy niềm hứng khởi khi gắn bó với đặc thù công việc của ngành **${career}** hay không?\n\n` +
        `Nếu phải đối diện với tình huống này thường xuyên trong thực tế nghề nghiệp, em dự định sẽ chuẩn bị cho mình điểm tựa tâm lý hoặc kỹ năng gì để vượt qua?`;
    }

    switch (round) {
      case 1:
        return `Thầy rất trân trọng mong muốn tốt đẹp và năng lực mà em vừa chia sẻ: "${userText}".\n\n` +
          `Tuy nhiên, có một khoảng cách rất tự nhiên giữa điểm số môn học phổ thông hay sở thích đời thường với độ khó chuyên môn học thuật khắt khe khi bước vào giảng đường đại học ngành **${career}**.\n\n` +
          `Trong 4-5 năm tới, các phần mềm tự động hóa và AI sẽ thay thế phần lớn tác vụ kỹ thuật cơ bản của ngành ${career}. Đâu là năng lực tư duy chuyên sâu hoặc thế mạnh độc bản mà em tin công nghệ không thể thay thế ở bản thân em?`;

      case 2:
        return `Thầy rất ủng hộ tinh thần tích cực và khát vọng hòa nhập xu thế của em: "${userText}".\n\n` +
          `Dưới góc nhìn khách quan của thị trường 4.0, sự cạnh tranh về năng suất và tối ưu chi phí đang diễn ra rất mạnh mẽ. Để duy trì sự bền bỉ lâu dài, người làm nghề **${career}** cần xây dựng năng lực chuyên môn thực chiến cùng khả năng linh hoạt thích ứng.\n\n` +
          `Nếu sau khi tốt nghiệp ngành ${career}, thị trường bão hòa hoặc có khoảng trũng việc làm, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm thích ứng nào để duy trì sự bền bỉ và tự nuôi sống bản thân?`;

      case 3:
        return `Thầy đánh giá rất cao sự dũng cảm đối diện với rủi ro và ý thức xây dựng phương án dự phòng của em.\n\n` +
          `Để Kế hoạch B thực sự an toàn và vững chắc, mức tự tin ${score}/10 cần điểm tựa số liệu pháp lý cụ thể. Em đã từng tự tay đọc Đề án tuyển sinh chính thức của ${uni}, biết rõ điểm chuẩn 3 năm gần nhất, mức học phí tự chủ từng năm và chỉ tiêu thực tế của ngành ${career} chưa?`;

      case 4:
      default: {
        return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\n` +
          `Chúng ta đã cùng nhau nhận diện 3 điểm lưu tâm quan trọng:\n` +
          `1. Khoảng cách tự nhiên giữa mong muốn/năng lực ban đầu với đòi hỏi chuyên môn học thuật thực tế của ngành ${career}.\n` +
          `2. Tầm quan trọng của Bộ kỹ năng chuyển đổi và phương án thích ứng trước nguy cơ tự động hóa công nghệ và biến động việc làm.\n` +
          `3. Sự cần thiết phải tự tay xác thực điểm chuẩn 3 năm, học phí thực tế và đề án tuyển sinh tại ${uni}.\n\n` +
          `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu Đề án tuyển sinh để làm chủ quyết định của chính mình!`;
      }
    }
  };

  // 3. GỌI API GEMINI VỚI CẤU HÌNH NHIỆT ĐỘ CỐ ĐỊNH CHỐNG ẢO GIÁC
  const callGeminiSocratic = async (historyMessages, userText, round, specialInstruction = null) => {
    // 3.1. Thử gọi Serverless Backend /api/chat nếu có
    try {
      const serverlessCtrl = new AbortController();
      const sTimeout = setTimeout(() => serverlessCtrl.abort(), 5500);

      const serverlessRes = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyMessages.map(m => ({ role: m.role, text: m.text })),
          round: round,
          maxRounds: maxRounds,
          anchor: studentProfile,
          specialInstruction: specialInstruction
        }),
        signal: serverlessCtrl.signal
      });
      clearTimeout(sTimeout);

      if (serverlessRes.ok) {
        const sData = await serverlessRes.json();
        if (sData?.reply && sData.reply.trim().length >= 30) {
          return sData.reply.trim();
        }
      }
    } catch (apiErr) {
      // Tiếp tục chuyển sang gọi trực tiếp
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
            temperature: 0.15,
            maxOutputTokens: 250
          }
        }),
        signal: directCtrl.signal
      });
      clearTimeout(directTimeout);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length >= 20) {
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
      const aiReply = await callGeminiSocratic(messages, cleanText, currentRound, reflex.instructionForAI);
      
      const aiMsg = {
        role: 'model',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...nextHistory, aiMsg]);
      if (reflex.advanceRound !== false) {
        setCurrentRound(prevRound => prevRound + 1);
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
