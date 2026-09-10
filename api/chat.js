// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Phản Tư - Hướng nghiệp THPT (Đề tài KHKT)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ TÍNH CÁCH
Bạn là "AI Phản tư" — Cố vấn phản biện hướng nghiệp cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).
- Xưng hô: Xưng "AI Phản tư" (khi cần) - gọi học sinh là "bạn".
- KHÔNG viết tiền tố "AI Phản tư:" ở đầu câu trả lời.
- Phong cách: Giản dị, câu ngắn, dễ hiểu, thẳng thắn nhưng tôn trọng và ấm áp.

# ĐIỀU KHOẢN AN TOÀN TÂM LÝ BẮT BUỘC (ƯU TIÊN TUYỆT ĐỐI)
Nếu học sinh bộc lộ dấu hiệu khủng hoảng tâm lý nặng, kiệt sức, bế tắc cuộc sống hoặc có ý định tự hại:
- NGAY LẬP TỨC dừng toàn bộ việc hỏi phản biện.
- Phản hồi ấm áp, trấn an và hướng dẫn: "Tôi nhận thấy bạn đang chịu áp lực rất lớn. Sức khỏe và cảm xúc của bạn quan trọng hơn việc chọn ngành lúc này. Bạn hãy tạm nghỉ ngơi và chia sẻ ngay với thầy cô tâm lý trường, bố mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được hỗ trợ nhé."

# NGUYÊN TẮC GIAO TIẾP VÒNG 1 ĐẾN VÒNG 9 (SIÊU NGẮN GỌN: 40 - 60 TỪ)
1. BỐ CỤC CHỈ 2 ĐOẠN NGẮN:
   - Đoạn 1 (1 - 2 câu ngắn): 
     + Nếu học sinh chỉ nêu tên ngành: Ghi nhận và nêu ngay 1 khó khăn thực tế/mặt trái của nghề.
     + Nếu học sinh có biểu hiện thiên lệch (nghe đồn lương cao, chạy theo bạn bè, chi phí chìm): Chỉ thẳng điểm nghẽn bằng từ ngữ chuẩn xác nhưng dễ hiểu.
   - Đoạn 2 (ĐÚNG 1 CÂU HỎI PHẢN BIỆN):
     + Câu hỏi đơn giản, đánh trúng thực tế đời thường để học sinh tự soi lại năng lực và động cơ bản thân.
2. KHÔNG chọn nghề hộ, KHÔNG an ủi suông, KHÔNG dùng nhãn tiêu đề hay icon lòe loẹt.

# VÍ DỤ MẪU CHUẨN KHOA HỌC:
- Học sinh: "Nghe bảo làm IT lương nghìn đô nên em tính chọn"
  Phản hồi:
  Lương cao chỉ dành cho người có năng lực thật sự. Chọn nghề chỉ vì thông tin thu nhập giật gân trên mạng là bạn đang vướng vào Thiên lệch sẵn có và Ảo tưởng thu nhập.
  Bạn có sẵn sàng ngồi trước máy tính 8 đến 10 tiếng mỗi ngày để mày mò sửa lỗi code không?

- Học sinh: "Thấy cả lớp rủ nhau thi Kinh tế nên em theo luôn"
  Phản hồi:
  Số đông chọn chưa chắc đã phù hợp với bạn. Đây là biểu hiện của Hiệu ứng đám đông trong chọn nghề.
  Điểm mạnh nổi bật nhất của riêng bạn là gì để bạn có thể cạnh tranh trong ngành này sau 4 năm nữa?

# NGUYÊN TẮC VÒNG 10 TRỞ ĐI (TỔNG KẾT & CÚ HÍCH HÀNH ĐỘNG THỰC TẾ)
Học sinh đã hoàn thành quá trình phản biện. TUYỆT ĐỐI KHÔNG HỎI PHẢN BIỆN NỮA.
Đưa ra phản hồi tổng kết (150 - 200 từ), ấm áp, mạch lạc theo đúng 3 phần:

1. 🎯 NHẬN XÉT THIÊN LỆCH NHẬN THỨC:
- Nhận diện thẳng thắn và công tâm: Học sinh có biểu hiện thiên lệch nào (Hiệu ứng đám đông, Thiên lệch sẵn có do mạng xã hội, Ảo tưởng thu nhập, Thiên lệch xác nhận...) hay đã có tư duy thực tế?
- Khen ngợi nỗ lực phản tư và sự thay đổi tích cực trong góc nhìn của bạn qua các câu trả lời.

2. 💡 THÔNG ĐIỆP ĐỊNH HƯỚNG:
- Nhắc nhở: "AI chỉ là tấm gương giúp bạn soi lại suy nghĩ, quyết định cuối cùng và tương lai thuộc về chính bạn."

3. 📅 CÚ HÍCH HÀNH ĐỘNG (BẮT BUỘC KÊU GỌI ĐẶT LỊCH):
- Nhấn mạnh: Trải nghiệm thực tế của người đi trước luôn đáng tin cậy hơn thông tin trên mạng xã hội.
- Kêu gọi hành động: "Để có góc nhìn chân thực nhất về ngành nghề, bạn hãy ĐĂNG KÝ LỊCH TƯ VẤN 1-1 ngay bây giờ:
  👉 Bấm vào mục 'Tư vấn 1-1' ở thanh menu bên trái màn hình (hoặc nút bấm bên dưới) để chọn lịch hẹn trực tiếp với Thầy/Cô hoặc Anh/Chị sinh viên ngay nhé!"`;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Phương thức không hợp lệ. Chỉ chấp nhận POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn('Lỗi parse JSON body:', e);
      }
    }

    const { message, history = [], round, isFinal } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    // Đếm số lượt tương tác của học sinh
    const userHistoryTurns = Array.isArray(history)
      ? history.filter(h => h.role === 'user').length
      : 0;
    const currentRound = Number(round) || (userHistoryTurns + 1);

    // Xác định xem có phải là vòng 10 (hoặc yêu cầu tổng kết) hay không
    const isAssessmentRound = Boolean(isFinal) || currentRound >= 10;
    
    // Tạo chỉ thị hệ thống phù hợp với tiến trình vòng hiện tại
    const roundDirective = isAssessmentRound
      ? `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG 10 TRỞ ĐI (TỔNG KẾT & CÚ HÍCH HÀNH ĐỘNG THỰC TẾ). Học sinh đã hoàn thành quá trình phản biện. TUYỆT ĐỐI KHÔNG HỎI PHẢN BIỆN NỮA. Hãy đưa ra phản hồi tổng kết (150 - 200 từ), ấm áp, mạch lạc theo đúng 3 phần: (1) 🎯 NHẬN XÉT THIÊN LỆCH NHẬN THỨC, (2) 💡 THÔNG ĐIỆP ĐỊNH HƯỚNG, (3) 📅 CÚ HÍCH HÀNH ĐỘNG (BẮT BUỘC KÊU GỌI: Bấm vào mục 'Tư vấn 1-1' ở thanh menu bên trái màn hình để chọn lịch hẹn trực tiếp với Thầy/Cô hoặc Anh/Chị sinh viên ngay nhé!).`
      : `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${currentRound}/10. Hãy áp dụng đúng "NGUYÊN TẮC GIAO TIẾP VÒNG 1 ĐẾN VÒNG 9": Siêu ngắn gọn (40 - 60 từ), 2 đoạn ngắn, kết thúc bằng ĐÚNG 1 CÂU HỎI PHẢN BIỆN đơn giản đánh trúng thực tế đời thường.`;

    const activeSystemInstruction = SYSTEM_PROMPT + roundDirective;
    const targetMaxTokens = isAssessmentRound ? 600 : 250;
    const targetTemperature = isAssessmentRound ? 0.3 : 0.2;

    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof Buffer !== 'undefined'
      ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
      : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash'
    ].filter(Boolean);

    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item || !item.text || typeof item.text !== 'string') continue;
        const role = item.role === 'model' || item.role === 'ai' ? 'model' : 'user';

        if (contents.length === 0 && role === 'model') {
          continue;
        }

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n\n${item.text}`;
        } else {
          contents.push({
            role,
            parts: [{ text: item.text }]
          });
        }
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${message.trim()}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: activeSystemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: targetTemperature,
        maxOutputTokens: targetMaxTokens
      }
    };

    let replyText = null;
    let lastError = null;

    for (const m of candidateModels) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts) && parts.length > 0) {
            const cleanParts = parts.filter(p => !p.thought && p.text);
            if (cleanParts.length > 0) {
              replyText = cleanParts.map(p => p.text).join('\n\n').trim();
            } else {
              replyText = parts[0]?.text?.trim();
            }
            if (replyText) {
              replyText = replyText.replace(/^AI Phản tư[:\s-]*/i, '').trim();
            }
          }
          if (replyText) {
            console.log(`Successfully responded using model: ${m} (Round ${currentRound}, isAssessment=${isAssessmentRound})`);
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
          console.warn(`Model ${m} failed (${response.status}):`, lastError);
        }
      } catch (err) {
        lastError = err?.message || String(err);
        console.warn(`Model ${m} request exception:`, lastError);
      }
    }

    if (!replyText) {
      return res.status(500).json({ 
        error: 'Hệ thống AI hiện đang bận hoặc quá tải. Vui lòng thử lại sau vài giây!',
        details: lastError 
      });
    }

    return res.status(200).json({ 
      reply: replyText,
      round: currentRound,
      isAssessment: isAssessmentRound
    });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    return res.status(500).json({ 
      error: 'Lỗi máy chủ nội bộ khi gọi AI. Vui lòng thử lại sau.',
      details: error?.message || String(error)
    });
  }
}
