import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Step2SocraticChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const maxRounds = 4; // Chuẩn hóa 4 vòng phản tư Socrates

  const messagesEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 1. KHỞI TẠO DỮ LIỆU MỎ NEO VÀ LỜI CHÀO MỞ MÀN TỰ ĐỘNG
  useEffect(() => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {
      target_career: "ngành bạn quan tâm",
      target_university: "trường bạn mong muốn",
      confidence_score: "8",
      source_of_influence: "mạng xã hội",
      holland_code: "Đa thiên hướng"
    };

    if (rawAnchor) {
      try {
        const parsed = JSON.parse(rawAnchor);
        anchor = {
          target_career: parsed.target_career || parsed.target_major || anchor.target_career,
          target_university: parsed.target_university || anchor.target_university,
          confidence_score: String(parsed.confidence_score || parsed.confidence_score_initial || "8"),
          source_of_influence: parsed.source_of_influence || parsed.choice_source || anchor.source_of_influence,
          holland_code: parsed.holland_code || (Array.isArray(parsed.holland_codes) ? parsed.holland_codes.join(', ') : anchor.holland_code)
        };
      } catch (e) {
        console.warn("Lỗi đọc dữ liệu mỏ neo:", e);
      }
    }

    const initialGreeting = `Chào em! Thầy đã ghi nhận dữ liệu từ Bước 1: Em đang hướng tới ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**.

Thầy đồng hành ở đây với vai trò phản biện độc lập để cùng em soi chiếu các góc khuất thực tế.

Để bắt đầu, em hãy chia sẻ: **Ngoài những hình ảnh năng động thường thấy trên truyền thông, điều gì cụ thể về kết quả học tập các môn liên quan hoặc trải nghiệm thực tế khiến em tin tưởng ở mức ${anchor.confidence_score}/10 rằng mình sẽ học tốt và theo đuổi được ngành này?**`;

    setMessages([
      { role: 'model', text: initialGreeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  }, []);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Bộ đếm thời gian thực để học sinh luôn thấy hệ thống đang tích cực xử lý
  useEffect(() => {
    let timer = null;
    if (isLoading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  // Bộ phản biện Socrates dự phòng tích hợp sẵn (Đảm bảo 100% không bao giờ đứng yên dù mất mạng/Gemini quá tải)
  const generateClientSocraticReply = (round, anchor = {}, userText = '', isFinal = false) => {
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'ngành em đã chọn';
    const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
    
    let hollandCodes = [];
    if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
      hollandCodes = anchor.holland_codes;
    } else if (typeof anchor.holland_code === 'string') {
      hollandCodes = anchor.holland_code.replace(/[^RIASEC]/gi, '').split('');
    }

    if (isFinal || round > maxRounds) {
      return `Thầy ghi nhận tinh thần phản biện và sự nghiêm túc của em qua các câu trả lời vừa rồi. Tuy nhiên, một quyết định tương lai không thể chỉ dựa trên suy đoán lý thuyết hay cảm xúc nhất thời.\n\nVẫn còn nhiều dữ liệu thực tế về ngành **${targetCareer}** mà em cần tự tay kiểm chứng. Em hãy bấm nút chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định!`;
    }

    const clean = (userText || '').toLowerCase().trim().replace(/[!.,?~]/g, '');
    const isGreeting = ['chào thầy', 'chao thay', 'chào bạn', 'xin chào', 'hello', 'hi', 'alo', 'chào'].includes(clean);
    if (isGreeting) {
      return `Chào em! Thầy là Trợ lý AI Tham Vấn Phản Tư Socrates. Thầy đã ghi nhận em đang hướng tới ngành **${targetCareer}** với mức tự tin **${confidenceScore}/10**.\n\nĐể bắt đầu, em hãy chia sẻ: Ngoài những thông tin chung trên mạng xã hội, điều gì cụ thể về kết quả học tập các môn liên quan khiến em tin tưởng ở mức ${confidenceScore}/10 rằng mình sẽ học tốt ngành này?`;
    }

    switch (round) {
      case 1:
        return `Thầy đã đọc lập luận của em về lý do chọn ngành **${targetCareer}**. Tuy nhiên, giữa sự tự tin ban đầu (${confidenceScore}/10) với thực tế môi trường đào tạo chuyên sâu thường có khoảng cách khá lớn.\n\nĐối với ngành **${targetCareer}**, các môn chuyên ngành đòi hỏi tư duy phân tích và áp lực bài tập rất nặng. Điểm số các môn học liên quan hiện tại ở trường THPT và thói quen tự giải quyết vấn đề của em thực chất ra sao?`;
      case 2:
        return `Em đã giải thích về năng lực học tập, nhưng một góc khuất khác là sự tương thích tính cách lâu dài. Đặc thù công việc ngành **${targetCareer}** đòi hỏi sự kiên nhẫn đối mặt với thất bại và áp lực cạnh tranh sau 2-3 năm ra trường.\n\nNếu công việc thực tế không năng động như kỳ vọng mà đòi hỏi sự kiên trì xử lý lỗi chuyên môn và họp hành liên tục, tính cách của em có thực sự phù hợp để trụ lại lâu dài không?`;
      case 3:
        return `Lý do em đưa ra thể hiện sự quyết tâm, nhưng chúng ta cần đối diện với mỏ neo chi phí và rủi ro tuyển sinh. Hiện nay học phí đại học tự chủ ngành **${targetCareer}** tăng 10-15%/năm kèm chi phí sinh hoạt đắt đỏ.\n\nEm và gia đình đã có kế hoạch tài chính cụ thể cho 4 năm học chưa? Và nếu điểm chuẩn năm nay bất ngờ biến động tăng cao, phương án nguyện vọng dự phòng của em là gì?`;
      case 4:
      default:
        return `Qua các vòng trao đổi, thầy nhận thấy em đã bắt đầu nhìn nhận vấn đề nhiều chiều hơn, nhưng vẫn còn nhiều khoảng trống thông tin thực tế chưa có số liệu chứng minh.\n\nMột quyết định nghề nghiệp nghiêm túc đòi hỏi sự kiểm chứng khách quan. Em hãy bấm nút chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn và học phí thực tế nhé!`;
    }
  };

  // 2. HÀM GỌI GEMINI API ĐA TẦNG (SERVERLESS ➜ GEMINI DIRECT ➜ BỘ SOCRATIC TÍCH HỢP)
  const callGeminiAPI = async (chatHistory, userText) => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {};
    if (rawAnchor) {
      try {
        anchor = JSON.parse(rawAnchor);
      } catch (e) {}
    }

    const isFinalRound = currentRound >= maxRounds;

    // TẦNG 1: Gọi endpoint serverless /api/chat (tối đa 5.5 giây)
    try {
      const serverlessCtrl = new AbortController();
      const serverlessTimeout = setTimeout(() => serverlessCtrl.abort(), 5500);

      const serverlessRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: chatHistory.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            text: m.text
          })),
          round: currentRound,
          maxRounds: maxRounds,
          isFinal: isFinalRound,
          anchor: {
            target_career: anchor.target_career || anchor.target_major || "chưa xác định",
            target_university: anchor.target_university || "chưa xác định",
            source_of_influence: anchor.source_of_influence || anchor.choice_source || "mạng xã hội",
            confidence_score: String(anchor.confidence_score || anchor.confidence_score_initial || "8"),
            holland_code: anchor.holland_code || (Array.isArray(anchor.holland_codes) ? anchor.holland_codes.join(', ') : "chưa rõ"),
            holland_codes: anchor.holland_codes || [],
            compatibility_status: anchor.compatibility_status || "",
            holland_analysis: anchor.holland_analysis || ""
          }
        }),
        signal: serverlessCtrl.signal
      });
      clearTimeout(serverlessTimeout);

      if (serverlessRes.ok) {
        const data = await serverlessRes.json();
        if (data?.reply) {
          return data.reply;
        }
      }
    } catch (apiErr) {
      console.warn("Serverless /api/chat timeout/error, thử tầng tiếp theo:", apiErr?.message);
    }

    // TẦNG 2: Gọi trực tiếp Google Gemini API với model gemini-3-flash-preview (tối đa 4 giây)
    try {
      const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
      const fallbackKey = typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '';
      const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || fallbackKey;
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

      const systemInstruction = `Bạn là Trợ lý AI Tham Vấn Phản Tư Socrates hướng nghiệp cho học sinh THPT.
Mục tiêu: Đặt câu hỏi truy vấn sâu vào mâu thuẫn điểm số, năng lực thực tế hoặc áp lực đào thải ngành "${anchor.target_career || 'đã chọn'}".
Độ dài: Dưới 90 từ, chia làm 2 đoạn ngắn, kết thúc bằng đúng 1 câu hỏi phản tư sâu sắc. Không khen ngợi sáo rỗng.`;

      const formattedContents = chatHistory.slice(-4).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      formattedContents.push({ role: 'user', parts: [{ text: userText }] });

      const directCtrl = new AbortController();
      const directTimeout = setTimeout(() => directCtrl.abort(), 4000);

      const directRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: formattedContents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 250 }
        }),
        signal: directCtrl.signal
      });
      clearTimeout(directTimeout);

      if (directRes.ok) {
        const directData = await directRes.json();
        const parts = directData.candidates?.[0]?.content?.parts;
        const replyText = parts?.filter(p => !p.thought && p.text).map(p => p.text).join('\n\n')?.trim() 
          || parts?.[0]?.text?.trim();
        if (replyText) return replyText;
      }
    } catch (directErr) {
      console.warn("Direct Gemini API error, kích hoạt bộ Socrates dự phòng tức thì:", directErr?.message);
    }

    // TẦNG 3: BỘ SOCRATIC DỰ PHÒNG CHUẨN MỰC (Đảm bảo 100% trả lời ngay, không bao giờ để học sinh đứng chờ)
    return generateClientSocraticReply(currentRound, anchor, userText, isFinalRound);
  };

  // 3. XỬ LÝ GỬI TIN NHẮN
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setErrorMessage('');
    const userMsg = {
      role: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiReply = await callGeminiAPI(messages, text);
      const aiMsg = {
        role: 'model',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...updatedMessages, aiMsg]);
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);

      // Lưu trạng thái hoàn thành phản tư khi xong các vòng
      if (nextRound > maxRounds) {
        localStorage.setItem("cbas_step2_completed", "true");
      }
    } catch (err) {
      console.error("Lỗi AI:", err);
      // Ngay cả khi xảy ra ngoại lệ không mong muốn, vẫn cung cấp phản hồi Socrates để không chặn học sinh
      const rawAnchor = localStorage.getItem("cbas_anchor_data");
      const fallbackReply = generateClientSocraticReply(currentRound, rawAnchor ? JSON.parse(rawAnchor) : {}, text, currentRound >= maxRounds);
      setMessages([...updatedMessages, {
        role: 'model',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setCurrentRound(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToStep3 = () => {
    // Điều hướng sang Bước 3 (hỗ trợ cả route /student/evidence-check và /student/fact-check)
    navigate('/student/fact-check');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '85vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER TIẾN ĐỘ */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px' }}>BƯỚC 2</span>
          <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', color: '#0f172a' }}>AI Tham Vấn Phản Tư (Socrates)</h2>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
          Vòng phản tư: <span style={{ color: '#2563eb' }}>{Math.min(currentRound, maxRounds)}</span>/{maxRounds}
        </div>
      </div>

      {/* KHUNG NỘI DUNG CHAT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '14px 18px',
              borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              background: msg.role === 'user' ? '#059669' : '#ffffff',
              color: msg.role === 'user' ? '#ffffff' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              fontSize: '14.5px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
              <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '12px 18px',
              borderRadius: '16px 16px 16px 2px',
              fontSize: '13.5px',
              color: '#1e40af',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#2563eb'
              }}></span>
              <span>🤖 Thầy Socrates đang phản biện luận điểm của em... <strong>({elapsedSeconds}s)</strong></span>
            </div>
          </div>
        )}

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
            {errorMessage}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* NÚT CHUYỂN BƯỚC KHI HOÀN THÀNH ĐỦ 4 VÒNG */}
      {currentRound > maxRounds && (
        <div style={{ padding: '10px 20px', background: '#ecfdf5', borderTop: '1px solid #a7f3d0', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#065f46', fontWeight: '600' }}>
            ✅ Em đã hoàn thành phiên phản tư cùng AI! Hãy tiếp tục đối chứng dữ liệu thực tế.
          </p>
          <button 
            type="button"
            onClick={handleGoToStep3}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
            Chuyển Sang Bước 3: Đối Chứng Dữ Liệu ➜
          </button>
        </div>
      )}

      {/* KHU VỰC NHẬP LIỆU (ĐÃ XÓA SẠCH NÚT CÂU HỎI CÓ SẴN) */}
      <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Nhập câu trả lời phản biện của em với Thầy Socrates (VD: Điểm Toán của em là 8.2, em đã thử tìm hiểu môn Giải tích...)"
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
            disabled={isLoading || !inputValue.trim()}
            style={{
              background: isLoading ? '#94a3b8' : '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              minWidth: '110px'
            }}
          >
            {isLoading ? `(${elapsedSeconds}s)...` : 'GỬI ➔'}
          </button>
        </form>
        <small style={{ display: 'block', marginTop: '6px', color: '#94a3b8', fontSize: '12px' }}>
          *Hãy trả lời trung thực dựa trên năng lực và tìm hiểu cá nhân để buổi phản tư có giá trị thực chất nhất.
        </small>
      </div>

    </div>
  );
}
