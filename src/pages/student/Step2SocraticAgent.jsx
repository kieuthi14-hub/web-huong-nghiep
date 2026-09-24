import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Step2SocraticAgent() {
  const navigate = useNavigate();
  // KHỞI TẠO LUÔN TỪ VÒNG 1 (KHÔNG ĐỌC BỪA BÃI TỪ CACHE CŨ NẾU CHƯA CÓ DỮ LIỆU THẬT)
  const [currentRound, setCurrentRound] = useState(1);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const maxRounds = 4;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 1. KHỞI TẠO DỮ LIỆU ĐÚNG CHUẨN
  useEffect(() => {
    // Đọc dữ liệu mỏ neo từ Bước 1
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {
      target_career: "Công nghệ thông tin",
      target_university: "Đại học Bách Khoa",
      confidence_score: "8",
      holland_code: "Nghiên cứu - Kỹ thuật"
    };

    if (rawAnchor) {
      try {
        const parsed = JSON.parse(rawAnchor);
        anchor = {
          target_career: parsed.target_career || parsed.target_major || anchor.target_career,
          target_university: parsed.target_university || anchor.target_university,
          confidence_score: String(parsed.confidence_score || parsed.confidence_score_initial || anchor.confidence_score),
          holland_code: parsed.holland_code || (Array.isArray(parsed.holland_codes) ? parsed.holland_codes.join(', ') : anchor.holland_code)
        };
      } catch (e) {
        console.warn("Lỗi đọc dữ liệu mỏ neo:", e);
      }
    }

    // Kiểm tra xem học sinh này ĐÃ THỰC SỰ HOÀN THÀNH trước đó chưa
    // Chỉ phục hồi trạng thái cũ NẾU trong storage có biên bản đầy đủ tin nhắn (> 2 tin nhắn)
    const savedChat = localStorage.getItem("cbas_step2_messages");
    const savedRound = localStorage.getItem("cbas_step2_round");

    if (savedChat && savedRound) {
      try {
        const parsedChat = JSON.parse(savedChat);
        const parsedRound = parseInt(savedRound, 10);
        if (Array.isArray(parsedChat) && parsedChat.length > 2) {
          // Nếu đã có dữ liệu tương tác thực sự từ trước
          setMessages(parsedChat);
          setCurrentRound(isNaN(parsedRound) ? 1 : parsedRound);
          return;
        }
      } catch (e) {
        console.warn("Lỗi đọc cache tin nhắn cũ:", e);
      }
    }

    // PHIÊN MỚI: BẮT BUỘC ĐẶT LẠI VỀ VÒNG 1 VÀ XÓA DỮ LIỆU KẸT CŨ
    setCurrentRound(1);
    localStorage.setItem("cbas_step2_round", "1");
    localStorage.removeItem("cbas_step2_completed");

    const initialGreeting = `Chào em. Thầy đã tiếp nhận dữ liệu từ Bước 1: Em chọn ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**. Kết quả Holland của em là nhóm **${anchor.holland_code}**.

Thầy ở đây để cùng em phản biện, làm rõ các góc khuất thực tế mà mạng xã hội thường không nói tới.

Để bắt đầu Lượt 1, em hãy chia sẻ: **Ngoài những hình ảnh hào nhoáng thường thấy trên truyền thông, điểm số môn học cụ thể nào hoặc trải nghiệm thực tế nào khiến em tin tưởng ở mức ${anchor.confidence_score}/10 rằng mình có năng lực thực sự để hoàn thành tốt chương trình đào tạo của ngành ${anchor.target_career}?**`;

    const initialMessages = [
      { role: 'model', text: initialGreeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setMessages(initialMessages);
    localStorage.setItem("cbas_step2_messages", JSON.stringify(initialMessages));
  }, []);

  function isConfusionOrAnxiety(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.toLowerCase().trim();
    const anxietyKeywords = [
      'hoang mang', 'lo lắng', 'lo lang', 'bối rối', 'boi roi', 'sợ', 'so hai',
      'băn khoăn', 'ban khoan', 'lo sợ', 'mơ hồ', 'mo ho', 'rối bời', 'roi boi',
      'áp lực', 'ap luc', 'lo quá', 'lo qua', 'em lo', 'hoang mang quá'
    ];
    return anxietyKeywords.some(k => clean.includes(k));
  }

  function isUncertaintyOrHelpRequest(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.toLowerCase().trim().replace(/[!.,?~:;\-_]/g, '');
    const keywords = [
      'chưa biết', 'chua biet', 'không biết', 'khong biet', 'chưa rõ', 'chua ro',
      'chưa nghĩ', 'chua nghi', 'chưa tìm hiểu', 'chua tim hieu', 'chưa có', 'chua co',
      'em chịu', 'chịu thôi', 'thầy giúp', 'thay giup', 'nhờ thầy', 'nho thay',
      'giúp em', 'giup em', 'chỉ em với', 'chi em voi', 'tư vấn giúp', 'tu van giup',
      'chưa tính', 'chua tinh', 'không rõ', 'khong ro', 'bí quá', 'em không rõ',
      'chưa thể', 'chua the', 'giúp với', 'giup voi', 'giúp em với', 'giup em voi',
      'chưa xác định', 'chua xac dinh', 'chưa lường', 'chua luong', 'khó quá', 'kho qua',
      'không biết nguồn', 'khong biet nguon', 'chưa biết nguồn', 'chua biet nguon',
      'tìm ở đâu', 'tim o dau', 'không biết tra', 'khong biet tra'
    ];
    return keywords.some(k => clean.includes(k));
  }

  // 2. CHỐT CHẶN KIỂM DUYỆT TIN NHẮN ĐẦU VÀO (CHỐNG SPAM / CHỐNG CHÀO HỎI RỖNG)
  const validateInput = (text) => {
    const cleanText = text.trim();
    if (!cleanText) {
      return "⚠️ Vui lòng nhập câu trả lời của em.";
    }
    // Cho phép học sinh bộc lộ sự bối rối, lo lắng hoặc nói chưa biết
    if (isUncertaintyOrHelpRequest(cleanText) || isConfusionOrAnxiety(cleanText)) {
      return null;
    }
    if (cleanText.length < 5) {
      return "⚠️ Câu trả lời của em quá ngắn. Hãy chia sẻ cụ thể hơn để Thầy Socrates phản biện nhé!";
    }
    const pureSpamPhrases = ["chào thầy", "hello", "hi", "dạ", "ok", "ừ", "chao thay", "da", "u", "uhm"];
    if (pureSpamPhrases.includes(cleanText.toLowerCase().replace(/[!.,?~]/g, ''))) {
      return "⚠️ Em hãy đi thẳng vào câu hỏi truy vấn ở trên, đưa ra dẫn chứng thay vì chỉ chào hỏi nhé!";
    }
    return null;
  };

  // Bộ phản biện Socrates dự phòng chuẩn hóa CBAS ViSEF 2026 (Cam kết 100% không bao giờ treo/đứng máy)
  const generateHeuristicSocraticReply = (round, anchor = {}, userReply = '') => {
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
    const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
    const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';

    if (round >= 4) {
      return `Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành **${targetCareer}** đến sự thiếu hụt dữ liệu tuyển sinh chính thức.\n\nBây giờ, em hãy chuyển sang **Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế** để xây dựng cơ sở vững chắc cho quyết định của mình!`;
    }

    // 1. Phản ứng tâm lý khi học sinh bộc lộ sự bối rối hoặc nói "em hoang mang", "em lo lắng"
    if (isConfusionOrAnxiety(userReply)) {
      const reassurance = "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm.";
      if (round === 1) {
        return `${reassurance}\n\nBên cạnh độ khó học thuật ở bậc đại học, một thách thức lớn trong 4-5 năm tới là làn sóng tự động hóa từ AI đối với ngành **${targetCareer}**. Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;
      } else if (round === 2) {
        return `${reassurance}\n\nĐể chủ động trước sự phát triển của công nghệ, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành **${targetCareer}** biến động sau khi tốt nghiệp?`;
      } else {
        return `${reassurance}\n\nMột quyết định nghề nghiệp có trách nhiệm cần điểm tựa số liệu vững chắc. Em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
      }
    }

    // 2. Phản ứng tâm lý khi học sinh nói "em chưa biết" hoặc "không biết nguồn"
    if (isUncertaintyOrHelpRequest(userReply)) {
      const guidance = "Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống thông tin này. Em hãy đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.";
      if (round === 1) {
        return `${guidance}\n\nBên cạnh độ khó học thuật ở bậc đại học, một thách thức lớn trong 4-5 năm tới là làn sóng tự động hóa từ AI đối với ngành **${targetCareer}**. Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;
      } else if (round === 2) {
        return `${guidance}\n\nCòn bây giờ, để chuẩn bị cho tương lai nếu ngành **${targetCareer}** biến động, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng?`;
      } else {
        return `${guidance}\n\nĐể hoàn thiện cơ sở dữ liệu cho quyết định của mình, em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
      }
    }

    // 3. Phản hồi chuẩn hóa theo 4 Lượt
    switch (round) {
      case 1:
        return `Thầy đã ghi nhận phản hồi của em về năng lực phổ thông. Tuy nhiên, chương trình đại học ngành **${targetCareer}** đòi hỏi tính tự học và độ khó học thuật vượt trội hơn nhiều.\n\nBên cạnh đó, trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;

      case 2:
        return `Nhận thức về tác động của công nghệ trong ngành **${targetCareer}** là rất cần thiết, nhưng thị trường việc làm luôn biến động khó lường.\n\nEm đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành **${targetCareer}** bước vào chu kỳ biến động hoặc bão hòa khi em tốt nghiệp?`;

      case 3:
        return `Mức độ chuẩn bị cho thấy em đã bắt đầu suy nghĩ về khả năng thích ứng. Tuy nhiên, một quyết định ở mức tự tin **${confidenceScore}/10** cần được xây dựng trên dữ liệu xác thực thay vì ước đoán.\n\nEm đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;

      case 4:
      default:
        return `Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành **${targetCareer}** đến sự thiếu hụt dữ liệu tuyển sinh chính thức.\n\nBây giờ, em hãy chuyển sang **Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế** để xây dựng cơ sở vững chắc cho quyết định của mình!`;
    }
  };

  // 2. HÀM GỌI GEMINI API CHUẨN HÓA CBAS (ĐA TẦNG: SERVERLESS ➜ DIRECT ➜ BỘ NỘI BỘ)
  const callSocraticAPI = async (chatHistory, userReply, round) => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {};
    if (rawAnchor) {
      try {
        anchor = JSON.parse(rawAnchor);
      } catch (e) {}
    }

    const isFinalRound = round >= maxRounds;

    // TẦNG 1: Gọi endpoint serverless /api/chat với timeout 5.5s
    try {
      const serverlessCtrl = new AbortController();
      const serverlessTimeout = setTimeout(() => serverlessCtrl.abort(), 5500);

      const serverlessRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userReply,
          history: chatHistory.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            text: m.text
          })),
          round: round,
          maxRounds: maxRounds,
          isFinal: isFinalRound,
          anchor: {
            target_career: anchor.target_career || anchor.target_major || "Công nghệ thông tin",
            target_university: anchor.target_university || "Đại học Bách Khoa",
            confidence_score: String(anchor.confidence_score || "8"),
            holland_code: anchor.holland_code || "Nghiên cứu - Kỹ thuật"
          }
        }),
        signal: serverlessCtrl.signal
      });
      clearTimeout(serverlessTimeout);

      if (serverlessRes.ok) {
        const data = await serverlessRes.json();
        if (data?.reply && data.reply.trim().length >= 35) {
          return data.reply.trim();
        }
      }
    } catch (apiErr) {
      console.warn("Serverless /api/chat failover to direct:", apiErr?.message);
    }

    // TẦNG 2: Gọi trực tiếp Google Gemini API với maxOutputTokens 1200
    try {
      const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
      const fallbackKey = typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '';
      const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
        || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY)
        || fallbackKey;

      const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

      const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || "Công nghệ thông tin";
      const targetUniversity = (anchor.target_university || '').trim() || "Đại học Bách Khoa";
      const confidenceScore = anchor.confidence_score || "8";
      const hollandCode = anchor.holland_code || "Nghiên cứu - Kỹ thuật";

      const systemPrompt = `
BẠN LÀ: "Chuyên gia Phản tư Hành vi Socrates" (Nghiên cứu Khoa học Hành vi ViSEF 2026).
DỮ LIỆU ĐÃ XÁC THỰC:
- Ngành chọn: ${targetCareer} (BẮT BUỘC dùng đúng tên ngành "${targetCareer}" trong mọi câu phản hồi, TUYỆT ĐỐI KHÔNG dùng cụm từ "ngành em chọn" hay "ngành đã chọn").
- Trường: ${targetUniversity}
- Mức tự tin: ${confidenceScore}/10
- Thiên hướng Holland: ${hollandCode}

QUY TẮC PHẢN ỨNG TÂM LÝ BẮT BUỘC:
1. Khi học sinh bộc lộ sự bối rối hoặc nói "em hoang mang", "em lo lắng":
   - Phải có 1 câu trấn an duy lý: "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm."
   - Tuyệt đối không nói "Thầy ghi nhận kế hoạch thích ứng" khi học sinh chưa đưa ra kế hoạch.
2. Khi học sinh nói "em chưa biết" hoặc "không biết nguồn":
   - Công nhận sự trung thực, không trách móc, không mớm câu trả lời. Hướng dẫn học sinh đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.

LỘ TRÌNH ĐỐI THOẠI 4 LƯỢT NGHIÊM NGẶT:
- LƯỢT 1 (Đang xử lý câu trả lời về năng lực): Soi chiếu năng lực phổ thông với độ khó đại học. Chuyển tiếp bằng câu hỏi về nguy cơ tự động hóa của AI đối với ngành ${targetCareer} trong 4-5 năm tới.
- LƯỢT 2 (Đang xử lý câu trả lời về tự động hóa): Đánh giá nhận thức về công nghệ. Đặt câu hỏi về Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt để thích ứng nếu ngành ${targetCareer} biến động.
- LƯỢT 3 (Đang xử lý câu trả lời về kỹ năng thích ứng): Nhận diện mức độ chuẩn bị của học sinh. Đặt câu hỏi chốt: "Em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của ${targetCareer} tại ${targetUniversity} chưa, hay vẫn dựa trên cảm nhận cá nhân?"
- LƯỢT 4 (KẾT THÚC PHIÊN - ĐÃ ĐỦ DỮ KIỆN): 
  TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO.
  Đưa ra phản hồi đúc kết:
  "Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành ${targetCareer} đến sự thiếu hụt dữ liệu tuyển sinh chính thức. 
  Bây giờ, em hãy chuyển sang Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế để xây dựng cơ sở vững chắc cho quyết định của mình!"

QUY TẮC BẮT BUỘC:
1. KHÔNG khen ngợi sáo rỗng, KHÔNG nịnh bợ. Giữ thái độ phản biện khách quan, điềm đạm.
2. Trả lời dưới 100 từ, tối đa 2 đoạn ngắn.
3. Mỗi lượt CHỈ ĐẶT ĐÚNG 1 CÂU HỎI (trừ Lượt 4 thì đưa ra lời đúc kết và DỪNG CÂU HỎI).
4. BẮT BUỘC dùng đúng tên ngành "${targetCareer}".
      `;

      const contents = chatHistory.slice(-4).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      contents.push({
        role: 'user',
        parts: [{ text: `[HỌC SINH PHẢN HỒI VÒNG ${round}]: ${userReply}` }]
      });

      const directCtrl = new AbortController();
      const directTimeout = setTimeout(() => directCtrl.abort(), 5000);

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200
          }
        }),
        signal: directCtrl.signal
      });
      clearTimeout(directTimeout);

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts;
        const replyText = parts?.filter(p => !p.thought && p.text).map(p => p.text).join('\n\n')?.trim() 
          || parts?.[0]?.text?.trim();

        if (replyText && replyText.length >= 35) {
          return replyText;
        }
      }
    } catch (directErr) {
      console.warn("Direct API call error, kích hoạt bộ Socrates dự phòng tức thì:", directErr?.message);
    }

    // TẦNG 3: BỘ PHẢN BIỆN SOCRATES DỰ PHÒNG CHUẨN MỰC
    return generateHeuristicSocraticReply(round, anchor, userReply);
  };

  // 3. XỬ LÝ GỬI VÀ TĂNG VÒNG CHÍNH XÁC
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const errorCheck = validateInput(inputValue);
    if (errorCheck) {
      setErrorMessage(errorCheck);
      return;
    }

    setErrorMessage('');
    const userText = inputValue.trim();
    const userMsg = {
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {
      target_career: "Công nghệ thông tin",
      target_university: "Đại học Bách Khoa",
      confidence_score: "8",
      holland_code: "Nghiên cứu - Kỹ thuật"
    };
    if (rawAnchor) {
      try {
        const parsed = JSON.parse(rawAnchor);
        anchor = {
          target_career: parsed.target_career || parsed.target_major || anchor.target_career,
          target_university: parsed.target_university || anchor.target_university,
          confidence_score: String(parsed.confidence_score || parsed.confidence_score_initial || anchor.confidence_score),
          holland_code: parsed.holland_code || (Array.isArray(parsed.holland_codes) ? parsed.holland_codes.join(', ') : anchor.holland_code)
        };
      } catch (e) {}
    }

    try {
      // GỌI HÀM API ĐỐI THOẠI (Truyền currentRound vào)
      const aiReply = await callSocraticAPI(updatedMessages, userText, currentRound);
      
      const aiMsg = {
        role: 'model',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      
      // TĂNG VÒNG SAU KHI ĐÃ CÓ 1 LƯỢT HỎI - ĐÁP HỢP LỆ
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);

      // CẬP NHẬT STORAGE AN TOÀN
      localStorage.setItem("cbas_step2_messages", JSON.stringify(finalMessages));
      localStorage.setItem("cbas_step2_round", nextRound.toString());

      if (nextRound > maxRounds) {
        localStorage.setItem("cbas_step2_completed", "true");
      }
    } catch (err) {
      console.error("Lỗi AI Socrates:", err);
      const fallbackReply = generateHeuristicSocraticReply(currentRound, anchor, userText);
      const finalMessages = [...updatedMessages, {
        role: 'model',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      setMessages(finalMessages);
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      localStorage.setItem("cbas_step2_messages", JSON.stringify(finalMessages));
      localStorage.setItem("cbas_step2_round", nextRound.toString());
      if (nextRound > maxRounds) {
        localStorage.setItem("cbas_step2_completed", "true");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Nút khẩn cấp để Reset phiên phản tư khi cần test lại
  const handleResetSession = () => {
    if (window.confirm("Em có muốn xóa dữ liệu phiên hiện tại và bắt đầu lại cuộc trò chuyện từ Lượt 1 không?")) {
      localStorage.removeItem("cbas_step2_messages");
      localStorage.removeItem("cbas_step2_round");
      localStorage.removeItem("cbas_step2_completed");
      window.location.reload();
    }
  };

  const [copySuccess, setCopySuccess] = useState(false);

  // Hàm trích xuất và định dạng toàn bộ nhật ký phản tư thành văn bản chuẩn mực
  const generateExportText = () => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {};
    if (rawAnchor) {
      try { anchor = JSON.parse(rawAnchor); } catch (e) {}
    }

    const targetCareer = anchor.target_career || anchor.target_major || 'Công nghệ thông tin';
    const targetUniv = anchor.target_university || 'Đại học Bách Khoa';
    const confidence = anchor.confidence_score || '8';
    const holland = anchor.holland_code || 'Nghiên cứu - Kỹ thuật';
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

    messages.forEach((msg, idx) => {
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

  // 1. Tải về file văn bản (.txt)
  const handleDownloadTxt = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    let careerSlug = 'huong_nghiep';
    if (rawAnchor) {
      try {
        careerSlug = (JSON.parse(rawAnchor).target_career || '').trim().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_') || careerSlug;
      } catch(e) {}
    }
    
    link.href = url;
    link.download = `Nhat_ky_phan_tu_Socrates_${careerSlug}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Sao chép vào bộ nhớ tạm (Clipboard)
  const handleCopyText = async () => {
    try {
      const text = generateExportText();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('Lỗi sao chép:', err);
    }
  };

  // 3. In hoặc Lưu file PDF chuẩn A4
  const handlePrint = () => {
    window.print();
  };

  const handleGoToStep3 = () => {
    navigate('/student/evidence-check');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '88vh', fontFamily: 'sans-serif' }}>
      
      {/* CSS CHO CHẾ ĐỘ IN / LƯU PDF */}
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

      {/* HEADER THEO DÕI TIẾN TRÌNH CAN THIỆP & CỤM NÚT XUẤT */}
      <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px' }}>BƯỚC 2: CAN THIỆP HÀNH VI</span>
          <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', color: '#0f172a' }}>AI Tham Vấn Phản Tư (Socrates)</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            Tiến trình: <span style={{ color: '#2563eb' }}>{Math.min(currentRound, maxRounds)}</span> / {maxRounds} vòng
            {currentRound >= maxRounds && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#059669', fontWeight: 'normal', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                ✓ Hoàn thành đủ 4 vòng
              </span>
            )}
          </div>

          <button 
            type="button"
            onClick={handleResetSession} 
            title="Bắt đầu lại cuộc trò chuyện từ Lượt 1"
            style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              marginLeft: '6px', 
              color: '#1d4ed8', 
              background: '#eff6ff', 
              border: '1px solid #bfdbfe', 
              borderRadius: '6px', 
              padding: '5px 12px', 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
            🔄 Bắt đầu lại từ đầu
          </button>
          
          {/* CỤM NÚT XUẤT DỮ LIỆU NHANH TRÊN HEADER */}
          <div style={{ display: 'flex', gap: '6px' }} className="no-print">
            <button
              type="button"
              onClick={handleCopyText}
              title="Sao chép toàn bộ nhật ký đối thoại vào bộ nhớ tạm"
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {copySuccess ? '✅ Đã chép' : '📋 Sao chép'}
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải file nhật ký phản tư (.txt) về máy"
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              📥 Tải .TXT
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Mở hộp thoại in hoặc Lưu file PDF"
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              🖨️ Lưu PDF
            </button>
          </div>
        </div>
      </div>

      {/* KHUNG NỘI DUNG ĐỐI THOẠI (VÙNG IN VÀ HIỂN THỊ) */}
      <div id="socratic-chat-export-area" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
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
              🤖 Thầy Socrates đang phân tích luận điểm phản biện của em...
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

      {/* CHỈ HIỆN KHỐI BƯỚC 3 KHI ĐÃ QUA VÒNG 4 */}
      {currentRound > maxRounds && (
        <div style={{ padding: '16px 20px', background: '#ecfdf5', borderTop: '1px solid #a7f3d0' }} className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#065f46', fontWeight: 'bold' }}>
                🎯 Em đã hoàn thành đủ 4 vòng phản tư nhận thức Socrates!
              </p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#047857' }}>
                Em có thể xuất biên bản này để làm tài liệu chuẩn bị cho buổi tư vấn 1-1 ở Bước 4.
              </p>
            </div>
            
            {/* CỤM NÚT XUẤT FILE NỔI BẬT */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyText}
                style={{ background: '#ffffff', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                {copySuccess ? '✅ Đã sao chép!' : '📋 Sao chép'}
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                style={{ background: '#ffffff', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                📥 Tải File .TXT
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{ background: '#ffffff', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                🖨️ Lưu File PDF
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button 
              type="button"
              onClick={handleResetSession}
              style={{ background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', padding: '11px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              🔄 Bắt đầu lại từ đầu (Thử nghiệm)
            </button>
            <button 
              type="button"
              onClick={handleGoToStep3}
              style={{ background: '#059669', color: '#fff', border: 'none', padding: '11px 26px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.2)' }}>
              Chuyển Sang Bước 3: Đối Chứng Dữ Liệu Tuyển Sinh Thực Tế ➜
            </button>
          </div>
        </div>
      )}

      {/* Ô NHẬP LIỆU DUY NHẤT (ĐÃ LOẠI BỎ TOÀN BỘ NÚT BẤM SẴN) */}
      <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={isLoading || currentRound > maxRounds}
            placeholder={currentRound > maxRounds ? "Phiên phản tư đã kết thúc. Em hãy chuyển sang Bước 3 hoặc bấm 'Bắt đầu lại'." : "Tự tay nhập câu trả lời phản biện của em (VD: Điểm Toán của em là 8.5, em đã tìm hiểu...)"}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: errorMessage ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <small style={{ color: '#94a3b8', fontSize: '12px' }}>
            *Hệ thống yêu cầu học sinh tự trình bày lập luận để kích hoạt tư duy phản tư sâu sắc nhất.
          </small>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleResetSession}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '2px 4px'
              }}>
              🔄 Bắt đầu lại từ Lượt 1
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
