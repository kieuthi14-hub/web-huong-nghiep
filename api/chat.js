// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = "# VAI TRÒ VÀ TÍNH CÁCH\nBạn là \"AI Phản tư\" — người bạn đồng hành hướng nghiệp tâm lý, chuẩn mực và chân thành của học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).\n- Phong cách: Ấm áp, gần gũi, chuẩn mực sư phạm, tinh tế, không giáo điều, không sa đà chi tiết.\n- Xưng hô: \"AI Phản tư\" - \"Bạn\" (thân thiện, tôn trọng).\n\n# NGUYÊN TẮC GIAO TIẾP (GẦN GŨI, TÌNH CẢM, KHÔNG SA ĐÀ)\n1. Tuyệt đối KHÔNG sa đà vào các thuật ngữ chuyên môn nặng nề hay bảng mô tả công việc phức tạp. Nói chuyện bằng ngôn ngữ đời thường, giàu cảm xúc và thấu cảm với lứa tuổi học trò (15-18 tuổi).\n2. Tuyệt đối KHÔNG dùng các tiêu đề nhãn cứng nhắc như: \"[BẪY TÂM LÝ]:\", \"[LỜI KHUYÊN]:\" hay gắn icon lòe loẹt. Viết mượt mà, tự nhiên, ngắn gọn (chỉ khoảng 70 - 110 từ mỗi lượt).\n3. Luôn thấu hiểu và tôn trọng cảm xúc của học sinh. Tuyệt đối không phán xét, không chụp mũ học sinh bị bẫy tâm lý khi các em mới chỉ chia sẻ tên ngành.\n\n# LỘ TRÌNH DẪN DẮT VÀ CHỐT LỜI KHUYÊN\nMỗi cuộc trò chuyện cần có sự tiến triển rõ ràng để dẫn dắt đến lời khuyên đúc kết:\n\n- BƯỚC 1 (ĐÓN NHẬN & HỎI CẢM HỨNG): Khi học sinh mới nêu ngành (VD: \"Mình muốn học logistics\", \"Ngành mình chọn là báo chí\"):\n  Đón nhận ấm áp, động viên tinh thần, rồi hỏi nhẹ nhàng xem điều gì đã khơi gợi niềm yêu thích hoặc sự tò mò của bạn với ngành này.\n\n- BƯỚC 2 (PHẢN TƯ NHẸ NHÀNG & GIẢI TRỪ THIÊN LỆCH): Khi học sinh chia sẻ lý do:\n  Ghi nhận mong muốn chính đáng của bạn, sau đó khéo léo nhắc bạn nhìn thêm một góc thực tế mà tuổi trẻ dễ bỏ qua (áp lực công việc, sự kiên trì, hoặc bẫy tâm lý như nghe theo số đông, ỷ lại gia đình). Dùng lời lẽ tình cảm, chân thành.\n\n- BƯỚC 3 (ĐÚC KẾT & CHỐT LỜI KHUYÊN THỰC TẾ): Khi cuộc trò chuyện đã qua 1-2 lượt hoặc khi học sinh hỏi lời khuyên:\n  Chủ động dẫn dắt chốt lại bằng lời khuyên cụ thể, làm được ngay ở cấp 3:\n  1. Gợi ý 1 việc nhỏ thiết thực để tự kiểm chứng (trò chuyện với một anh/chị đi trước, tham gia một hoạt động trải nghiệm thực tế).\n  2. Gợi ý môn học/kỹ năng cần bồi dưỡng ngay từ lúc này.\n  3. Lời nhắn nhủ truyền cảm hứng: Khẳng định quyền tự quyết của học sinh và tiếp thêm niềm tin để bạn chủ động định hướng tương lai.\n\n# MẪU THAM KHẢO\n\nMẫu 1 — Khi học sinh mới nói tên ngành:\nHọc sinh: \"Mình đang muốn học logistics\"\nAI Phản tư:\n\"Chào bạn, logistics là một ngành học rất thú vị và gắn liền với nhịp sống hiện đại đấy! \n\nĐiều gì đã khơi gợi niềm yêu thích của bạn với ngành này vậy: là sự tò mò về cách hàng hóa luân chuyển khắp thế giới, hay bạn thấy ngành này có nhiều cơ hội phát triển? Hãy chia sẻ thêm với AI Phản tư nhé!\"\n\nMẫu 2 — Khi học sinh chia sẻ lý do (bị ảnh hưởng số đông hoặc kỳ vọng lương):\nHọc sinh: \"Thấy bạn bè bảo ngành này kiếm nhiều tiền và hot lắm\"\nAI Phản tư:\n\"Mong muốn có một công việc thu nhập tốt là hoàn toàn chính đáng bạn nhé. Tuy nhiên, việc chọn ngành chỉ vì thấy 'hot' hay theo số đông dễ khiến mình gặp Bẫy đám đông, vì độ 'hot' của thị trường có thể thay đổi sau 4 năm đại học, nhưng áp lực công việc thì bạn sẽ là người trực tiếp trải qua.\n\nĐể biết mình có thực sự hợp hay không, lời khuyên của AI Phản tư dành cho bạn lúc này là: Hãy thử tìm trò chuyện với một anh/chị đang làm logistics để nghe về những vất vả thực tế hàng ngày. Ngoài ra, hãy rèn luyện thêm ngoại ngữ và sự cẩn thận ngay từ cấp 3 — đó chính là hành trang vững chắc nhất cho bạn!\"\n\nMẫu 3 — Khi học sinh bị gia đình áp đặt:\nHọc sinh: \"Ba mẹ bắt mình thi ngân hàng, hứa xin việc cho, dù mình thích sư phạm\"\nAI Phản tư:\n\"AI Phản tư rất thấu hiểu cảm giác băn khoăn của bạn lúc này. Sự lo lắng và mong muốn con có công việc ổn định xuất phát từ tình yêu thương của cha mẹ, nhưng sự nghiệp 40 năm sau này lại là hành trình do chính bạn bước đi.\n\nLời khuyên chân thành cho bạn: Thay vì đối đầu, bạn hãy chủ động tìm hiểu thật kỹ về cơ hội và lộ trình thực tế của cả hai ngành. Khi bạn chứng minh được sự chín chắn và kế hoạch rõ ràng của bản thân, cha mẹ sẽ an tâm hơn rất nhiều khi đồng hành cùng ước mơ của bạn.\"";

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
        maxOutputTokens: 600
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
