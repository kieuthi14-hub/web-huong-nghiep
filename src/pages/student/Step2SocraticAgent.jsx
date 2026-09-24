import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Step2SocraticAgent() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const maxRounds = 4;

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 1. KHỞI TẠO CONTEXT VÀ LỜI CHÀO MỞ MÀN ĐỐI KHÁNG TỪ BƯỚC 1
  useEffect(() => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {
      target_career: "Công nghệ thông tin",
      target_university: "Đại học Bách Khoa",
      confidence_score: "8",
      holland_code: "Nghiên cứu - Kỹ thuật",
      compatibility_analysis: "Lệch pha với môi trường tương tác xã hội"
    };

    if (rawAnchor) {
      try {
        const parsed = JSON.parse(rawAnchor);
        anchor = {
          target_career: parsed.target_career || parsed.target_major || anchor.target_career,
          target_university: parsed.target_university || anchor.target_university,
          confidence_score: String(parsed.confidence_score || parsed.confidence_score_initial || anchor.confidence_score),
          holland_code: parsed.holland_code || (Array.isArray(parsed.holland_codes) ? parsed.holland_codes.join(', ') : anchor.holland_code),
          compatibility_analysis: parsed.compatibility_analysis || parsed.compatibility_status || anchor.compatibility_analysis
        };
      } catch (e) {
        console.warn("Lỗi đọc dữ liệu mỏ neo:", e);
      }
    }

    const initialGreeting = `Chào em. Thầy đã tiếp nhận dữ liệu từ Bước 1: Em chọn ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**. Kết quả Holland của em là nhóm **${anchor.holland_code}**.

Thầy ở đây để cùng em phản biện, làm rõ các góc khuất thực tế mà mạng xã hội thường không nói tới.

Để bắt đầu Vòng 1, em hãy chia sẻ: **Ngoài những hình ảnh năng động thường thấy trên truyền thông, điểm số môn học cụ thể nào hoặc trải nghiệm thực tế nào khiến em tin tưởng ở mức ${anchor.confidence_score}/10 rằng mình có năng lực thực sự để hoàn thành tốt chương trình đào tạo của ngành này?**`;

    setMessages([
      { role: 'model', text: initialGreeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  }, []);

  // Bộ phản biện Socrates dự phòng chuẩn hóa CBAS ViSEF 2026 (Cam kết 100% không bao giờ treo/đứng máy)
  const generateHeuristicSocraticReply = (round, anchor = {}, userReply = '') => {
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'ngành em chọn';

    switch (round) {
      case 2:
        return `Thầy đã ghi nhận phản hồi của em về năng lực nền tảng. Tuy nhiên, một thách thức rất lớn trong 4-5 năm tới là làn sóng tự động hóa từ trí tuệ nhân tạo (AI).\n\nNhiều tác vụ kỹ thuật cơ bản của ngành **${targetCareer}** đang dần bị thay thế nhanh chóng. Em đã tìm hiểu xem đâu là kỹ năng chuyên sâu độc thù, mang tính tư duy chiến lược mà AI không thể thay thế được trong ngành này chưa?`;

      case 3:
        return `Lập luận của em có sự chuẩn bị, nhưng thị trường lao động sau tốt nghiệp luôn biến động khôn lường. Một tấm bằng chuyên ngành không còn là bảo chứng tuyệt đối cho việc làm.\n\nEm đã trang bị Bộ kỹ năng chuyển đổi (như ngoại ngữ chuyên sâu, năng lực số ứng dụng, kỹ năng giao tiếp - đàm phán) và có kế hoạch việc làm linh hoạt như thế nào nếu thị trường ngành **${targetCareer}** bước vào chu kỳ bão hòa khi em ra trường?`;

      case 4:
      default:
        return `Qua các vòng phản biện vừa rồi, Thầy nhận thấy nhận thức của em đã mở rộng hơn, nhưng vẫn còn nhiều khoảng trống thông tin thực tế mang tính sống còn mà em chưa có số liệu chứng minh.\n\nMột quyết định nghề nghiệp trọn đời không thể chỉ dựa trên suy đoán lý thuyết. Em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định!`;
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

    // TẦNG 2: Gọi trực tiếp Google Gemini API với maxOutputTokens 1200 (tránh cộc lốc/thiếu tokens)
    try {
      const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
      const fallbackKey = typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '';
      const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
        || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY)
        || fallbackKey;

      const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

      const systemPrompt = `
BẠN LÀ: Chuyên gia Phản tư Hành vi Socrates (Nghiên cứu CBAS ViSEF 2026).
HỒ SƠ HỌC SINH TỪ BƯỚC 1:
- Ngành: "${anchor.target_career || 'Chưa rõ'}" | Trường: "${anchor.target_university || 'Chưa rõ'}"
- Điểm tự tin: ${anchor.confidence_score || '8'}/10 | Mã Holland: "${anchor.holland_code || 'Chưa rõ'}"

QUY TẮC:
1. KHÔNG khen ngợi, KHÔNG nịnh bợ. Giữ thái độ phản biện khách quan, điềm đạm.
2. Trả lời dưới 120 từ. Mỗi lượt CHỈ ĐẶT ĐÚNG 1 CÂU HỎI.
3. Điều hướng theo tiến trình:
   - Đang ở Vòng 2: Truy vấn về nguy cơ tự động hóa bởi AI trong 4-5 năm tới và kỹ năng chuyên sâu không thể thay thế của ngành ${anchor.target_career || 'đã chọn'}.
   - Đang ở Vòng 3: Truy vấn về Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và kế hoạch việc làm linh hoạt để sinh tồn nếu thị trường biến động sau tốt nghiệp.
   - Đang ở Vòng 4: Tóm lược 2 câu về các khoảng trống nhận thức và yêu cầu học sinh chuyển sang Bước 3 để đối chứng dữ liệu thực tế (Đề án tuyển sinh, học phí, điểm chuẩn).
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
            maxOutputTokens: 1200 // Đủ room cho thinking tokens + câu trả lời hoàn chỉnh
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

  // 3. XỬ LÝ GỬI TIN NHẮN TỪ HỌC SINH
  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading || currentRound > maxRounds) return;

    setErrorMessage('');
    const userMsg = {
      role: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const nextRound = currentRound + 1;
      const aiReply = await callSocraticAPI(messages, text, currentRound);
      
      const aiMsg = {
        role: 'model',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...nextMessages, aiMsg]);
      setCurrentRound(nextRound);

      if (nextRound > maxRounds) {
        localStorage.setItem("cbas_step2_completed", "true");
      }
    } catch (err) {
      console.error("Lỗi AI Socrates:", err);
      // Fallback an toàn không bao giờ làm gián đoạn học sinh
      const rawAnchor = localStorage.getItem("cbas_anchor_data");
      const fallbackReply = generateHeuristicSocraticReply(currentRound, rawAnchor ? JSON.parse(rawAnchor) : {}, text);
      setMessages([...nextMessages, {
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
    navigate('/student/evidence-check');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '88vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER THEO DÕI TIẾN TRÌNH CAN THIỆP */}
      <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px' }}>BƯỚC 2: CAN THIỆP HÀNH VI</span>
          <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', color: '#0f172a' }}>AI Tham Vấn Phản Tư (Socrates)</h2>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
          Tiến trình phản tư: <span style={{ color: '#2563eb' }}>{Math.min(currentRound, maxRounds)}</span> / {maxRounds} vòng
        </div>
      </div>

      {/* KHUNG NỘI DUNG ĐỐI THOẠI */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#64748b' }}>
              🤖 Thầy Socrates đang phân tích luận điểm phản biện của em...
            </div>
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
            {errorMessage}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* MỞ KHÓA BƯỚC 3 SAU KHI HOÀN THÀNH 4 VÒNG */}
      {currentRound > maxRounds && (
        <div style={{ padding: '12px 20px', background: '#ecfdf5', borderTop: '1px solid #a7f3d0', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#065f46', fontWeight: 'bold' }}>
            🎯 Em đã hoàn thành phiên phản tư nhận thức! Hãy bắt tay vào kiểm chứng thực tế.
          </p>
          <button 
            type="button"
            onClick={handleGoToStep3}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Chuyển Sang Bước 3: Đối Chứng Dữ Liệu Tuyển Sinh Thực Tế ➜
          </button>
        </div>
      )}

      {/* Ô NHẬP LIỆU DUY NHẤT (ĐÃ LOẠI BỎ TOÀN BỘ NÚT BẤM SẴN) */}
      <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || currentRound > maxRounds}
            placeholder={currentRound > maxRounds ? "Phiên phản tư đã kết thúc. Em hãy chuyển sang Bước 3." : "Tự tay nhập câu trả lời phản biện của em (VD: Điểm Toán của em là 8.5, em đã tìm hiểu...)"}
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
        <small style={{ display: 'block', marginTop: '6px', color: '#94a3b8', fontSize: '12px' }}>
          *Hệ thống yêu cầu học sinh tự trình bày lập luận để kích hoạt tư duy phản tư sâu sắc nhất.
        </small>
      </div>

    </div>
  );
}
