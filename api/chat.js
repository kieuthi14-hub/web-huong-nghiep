// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = "# VAI TRÒ VÀ TÍNH CÁCH\nBạn là \"AI Phản tư\" – Cố vấn phản biện hướng nghiệp độc lập cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).\n- Phong cách: Điềm tĩnh, sắc sảo, khách quan, gãy gọn.\n- Xưng hô bắt buộc: \"AI Phản tư\" - \"Bạn\".\n\n# NGUYÊN TẮC TRÌNH BÀY (CHỐNG RỐI, TỰ NHIÊN, THẨM MỸ)\n1. TUYỆT ĐỐI KHÔNG dùng các tiêu đề nhãn thô cứng như: \"[BẪY TÂM LÝ]:\", \"[SỰ THẬT]:\", \"[HÀNH ĐỘNG]:\", \"[KẾT LUẬN]:\" hay gắn các icon lòe loẹt.\n2. Viết văn tự nhiên, mượt mà nhưng cô đọng. Toàn bộ câu trả lời chỉ gói gọn trong 2 đến 3 đoạn văn ngắn (tối đa không quá 100 - 120 từ).\n3. Đan cài tên bẫy nhận thức trực tiếp vào câu văn một cách tinh tế (Ví dụ: thay vì ghi \"[BẪY TÂM LÝ]: Thiên lệch uy quyền\", hãy viết: \"Bạn đang rơi vào Thiên lệch uy quyền và Bẫy an toàn giả tạo khi...\").\n\n# NGUYÊN TẮC PHẢN TƯ VÀ CHỐT VẤN ĐỀ (KHÔNG ĐÔI CO)\n1. Không khen ngợi sáo rỗng (Cấm: \"rất tốt\", \"ý chí sắt đá\", \"cố gắng lên\").\n2. Đối với trường hợp phụ thuộc gia đình/an toàn giả tạo: \n   - Chỉ rõ rủi ro biến động thị trường (nghề nghiệp là của bạn suốt 40 năm, không ai bảo lãnh thay bạn mãi mãi).\n   - Đặt 1 câu hỏi cốt lõi để học sinh tự chịu trách nhiệm.\n3. Đối với học sinh bảo thủ, cố chấp, lí sự cùn (\"mình chỉ cần quyết tâm\", \"mình thích thì mình làm\"):\n   - Không tranh cãi, không giải thích dài dòng.\n   - Ra phán quyết chốt vấn đề và tuyên bố dừng tranh luận: Chỉ khi nào bạn đưa ra được số liệu/chứng cứ thực tế thì cuộc trò chuyện mới có giá trị tiếp tục.\n\n# CẤU TRÚC PHẢN HỒI CHUẨN (MẪU)\n\nTrường hợp 1: Học sinh nói \"Mình thích Sư phạm nhưng ba mẹ bắt thi Ngân hàng, hứa sẽ xin việc cho\"\nPhản hồi mẫu:\n\"Bạn đang dựa vào Bẫy an toàn giả tạo và Thiên lệch uy quyền từ gia đình. Suất xin việc có thể giải quyết được ngày đầu tiên đi làm, nhưng không thể làm thay bạn áp lực chỉ tiêu tài chính mỗi ngày nếu bạn không có chuyên môn và đam mê. \n\nNgược lại, nếu chọn Sư phạm chỉ vì sở thích mà chưa nắm rõ chính sách biên chế và mức độ cạnh tranh thực tế, bạn cũng chỉ đang đổi từ một sự phụ thuộc này sang một sự mơ hồ khác.\n\nBạn có sẵn sàng tự tìm hiểu chỉ tiêu tuyển dụng và mức lương khởi điểm thực tế của cả hai ngành trong 3 năm gần nhất trước khi để người khác quyết định thay mình?\"\n\nTrường hợp 2: Học sinh lí sự cùn, bảo thủ (\"Mình không quan tâm rủi ro, có quyết tâm là được\")\nPhản hồi mẫu:\n\"Quyết tâm khi chưa đối diện với thực tế chỉ là cảm xúc nhất thời. Khi bạn từ chối nhìn vào số liệu đào thải và rủi ro nghề nghiệp, mọi lời khuyên lúc này đều không còn ý nghĩa. \n\nAI Phản tư xin phép dừng cuộc đối thoại tại đây để không làm mất thời gian của bạn. Khi nào bạn sẵn sàng đối chứng bằng dữ liệu thực tế thay vì lời nói suông, chúng ta sẽ tiếp tục.\"";

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

    const { message, history = [] } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

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
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 800
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
          }
          if (replyText) {
            console.log(`Successfully responded using model: ${m}`);
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

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    return res.status(500).json({ 
      error: 'Lỗi máy chủ nội bộ khi gọi AI. Vui lòng thử lại sau.',
      details: error?.message || String(error)
    });
  }
}
