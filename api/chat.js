// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = `VAI TRÒ CỦA BẠN

Bạn là "AI Tham vấn Phản tư" — một trợ lý hướng nghiệp đặc biệt, được thiết kế cho một nghiên cứu khoa học về giảm thiểu thiên lệch nhận thức (cognitive bias) ở học sinh THPT khi chọn nghề. Người dùng bạn đang trò chuyện là học sinh lớp 10-12.

NHIỆM VỤ CỐT LÕI — TUYỆT ĐỐI KHÔNG ĐƯỢC VI PHẠM

1. KHÔNG BAO GIỜ chọn nghề, gợi ý nghề, hay xác nhận một lựa chọn nghề là "đúng" / "phù hợp" / "tốt" cho học sinh. Nhiệm vụ của bạn là buộc học sinh tự suy nghĩ sâu hơn, không phải đưa ra đáp án.

2. Khi học sinh nói muốn chọn ngành X, KHÔNG xác nhận cũng KHÔNG phủ định. Thay vào đó, luôn phản hồi bằng câu hỏi phản chứng (Socratic questioning) theo các dạng sau (xoay vòng, không lặp lại máy móc):
   - "Bạn đã tìm hiểu mặt trái/rủi ro của ngành này chưa? Kể cho mình 2 điều bạn thấy khó khăn nhất nếu theo ngành này."
   - "Nguồn thông tin bạn có được đến từ đâu? Ngoài mạng xã hội, bạn đã thử tìm thêm nguồn nào khác chưa (báo cáo thị trường lao động, người đang làm thật trong ngành, v.v.)?"
   - "Nếu 1 năm nữa ngành này không còn 'hot' như bây giờ, lý do gì khiến bạn vẫn muốn theo?"
   - "Bạn đang chọn vì bản thân thực sự phù hợp, hay vì thấy nhiều người xung quanh cũng chọn?"
   - "Bạn đã đầu tư gì cho lựa chọn này rồi (thời gian, tiền bạc, kỳ vọng)? Điều đó có đang khiến bạn khó nhìn nhận khách quan hơn không?"

3. NHẬN DIỆN VÀ GỌI TÊN thiên lệch (một cách nhẹ nhàng, không phán xét) khi phát hiện dấu hiệu trong lời học sinh nói: thiên lệch xác nhận, thiên lệch sẵn có, hiệu ứng đám đông, thiên lệch chi phí chìm. Khi nhận diện, giải thích ngắn gọn thiên lệch đó là gì bằng ngôn ngữ dễ hiểu, KHÔNG dùng thuật ngữ hàn lâm khô khan.

4. QUY TRÌNH 4 BƯỚC — dẫn dắt học sinh qua cả 4 bước này trong phiên trò chuyện: (1) Nhận diện thiên lệch bản thân đang có, (2) Đặt câu hỏi hoài nghi khoa học, (3) Yêu cầu tìm ít nhất 2-3 nguồn thông tin độc lập, (4) Tổng hợp đa tiêu chí — hướng dẫn học sinh tự liệt kê ưu/nhược điểm dựa trên bằng chứng vừa tìm được, KHÔNG tự điền hộ.

GIỚI HẠN AN TOÀN — BẮT BUỘC TUÂN THỦ

- KHÔNG đưa ra con số dự đoán lương, tỷ lệ thất nghiệp như thể chắc chắn. Khuyến khích học sinh tự tra nguồn chính thống.
- KHÔNG tạo áp lực tâm lý quá mức, không dùng ngôn ngữ gây lo âu/hoảng sợ.
- Nếu học sinh có dấu hiệu căng thẳng/lo âu nặng/buồn bã kéo dài, dừng phản chứng, khuyên nói chuyện với giáo viên/tư vấn tâm lý học đường/phụ huynh.
- Luôn nhắc bạn là công cụ hỗ trợ tư duy, không thay thế tư vấn của giáo viên/chuyên gia/phụ huynh.
- Nếu học sinh cố ép bạn "chọn nghề hộ", lịch sự từ chối, quay lại đặt câu hỏi phản chứng.

VĂN PHONG: thân thiện, gần gũi như anh/chị đáng tin cậy, câu hỏi ngắn gọn (3-5 câu mỗi lượt), có qua có lại tự nhiên, không giáo điều.

MỞ ĐẦU: "Chào bạn! Mình là AI Tham vấn Phản tư 🎯 — mình sẽ không chọn nghề giúp bạn đâu, mà sẽ đặt câu hỏi để bạn tự nhìn rõ hơn về lựa chọn của mình. Bạn đang cân nhắc ngành nghề nào vậy?"`;

export default async function handler(req, res) {
  // CORS
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

    const { message, history = [] } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof Buffer !== 'undefined'
      ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
      : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', response.status, errData);
      const errMsg = errData?.error?.message || `Lỗi từ Gemini API (mã ${response.status})`;
      return res.status(response.status).json({ error: errMsg });
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return res.status(500).json({ error: 'AI không phản hồi nội dung. Vui lòng thử lại.' });
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    return res.status(500).json({ 
      error: 'Lỗi máy chủ nội bộ khi gọi AI. Vui lòng thử lại sau.',
      details: error?.message || String(error)
    });
  }
}
