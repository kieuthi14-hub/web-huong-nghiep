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

  // 2. HÀM GỌI GEMINI API (ƯU TIÊN ROUTE /api/chat TỐC ĐỘ CAO + FALLBACK GEMINI TRỰC TIẾP)
  const callGeminiAPI = async (chatHistory, userText) => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor");
    let anchor = {};
    if (rawAnchor) {
      try {
        anchor = JSON.parse(rawAnchor);
      } catch (e) {}
    }

    // Ưu tiên 1: Gọi endpoint serverless /api/chat (đã tối ưu 2-3s với gemini-3.5-flash & thinkingBudget: 0)
    try {
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
          isFinal: currentRound >= maxRounds,
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
        })
      });

      if (serverlessRes.ok) {
        const data = await serverlessRes.json();
        if (data?.reply) {
          return data.reply;
        }
      }
    } catch (apiErr) {
      console.warn("Serverless /api/chat error, thử fallback trực tiếp:", apiErr);
    }

    // Ưu tiên 2: Fallback trực tiếp Gemini API chuẩn v1beta
    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '';
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || fallbackKey;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;

    const systemInstruction = `
Bạn là "Trợ lý AI Tham Vấn Phản Tư Socrates" hướng nghiệp độc lập cho học sinh THPT trong nghiên cứu Khoa học Hành vi (CBAS).
HỒ SƠ HỌC SINH:
- Ngành mục tiêu: "${anchor.target_career || anchor.target_major || 'Chưa rõ'}"
- Trường: "${anchor.target_university || 'Chưa rõ'}"
- Mức tự tin ban đầu: ${anchor.confidence_score || anchor.confidence_score_initial || '8'}/10
- Thiên hướng Holland: "${anchor.holland_code || (Array.isArray(anchor.holland_codes) ? anchor.holland_codes.join(', ') : 'Chưa rõ')}"

QUY TẮC PHẢN BIỆN SOCRATES (BẮT BUỘC):
1. Tuyệt đối không khen ngợi cảm tính (Anti-sycophancy). Không khen "ước mơ hay", "em rất giỏi".
2. Giữ thái độ khách quan, tôn trọng, không miệt thị, không công kích.
3. Không bắt học sinh khai báo lại tên ngành.
4. Không trả lời thay hoặc khuyên học sinh nên bỏ hay nên theo.
5. Mỗi lượt chỉ đặt DUY NHẤT 1 câu hỏi truy vấn sâu vào: điểm số thực tế, áp lực đào thải, học phí, hoặc phương án dự phòng.
    `;

    // Chuyển đổi lịch sử chat sang định dạng của Gemini API (giữ tối đa 6 lượt gần nhất)
    const formattedContents = chatHistory.slice(-6).map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: userText }]
    });

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 250,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Lỗi HTTP: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought && p.text).map(p => p.text).join('\n\n')?.trim() 
      || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!replyText) throw new Error("Không nhận được phản hồi từ AI");
    return replyText;
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
      setErrorMessage("⚠️ Sự cố kết nối tạm thời tới máy chủ AI. Em hãy bấm nút gửi lại nhé!");
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
            <div style={{ background: '#fff', padding: '12px 18px', borderRadius: '16px', fontSize: '13px', color: '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              🤖 Thầy Socrates đang phân tích luận điểm của em...
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
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading || !inputValue.trim() ? 0.6 : 1
            }}
          >
            GỬI ➔
          </button>
        </form>
        <small style={{ display: 'block', marginTop: '6px', color: '#94a3b8', fontSize: '12px' }}>
          *Hãy trả lời trung thực dựa trên năng lực và tìm hiểu cá nhân để buổi phản tư có giá trị thực chất nhất.
        </small>
      </div>

    </div>
  );
}
