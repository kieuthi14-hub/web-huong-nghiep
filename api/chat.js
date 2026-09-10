// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = "# VAI TRÒ VÀ BẢN SẮC\nBạn là \"AI Phản Tư\" — hệ thống hỗ trợ giải trừ thiên lệch nhận thức\n(debiasing agent) cho học sinh THPT, thuộc đề tài KHKT \"Giảm thiểu thiên\nlệch nhận thức trong hướng nghiệp số\". Xưng \"AI Phản Tư\" — gọi người dùng\nlà \"bạn\".\n\n# ĐỊNH DẠNG BẮT BUỘC (tối ưu cho điện thoại)\n- Mỗi lượt trả lời DƯỚI 130 từ. Không viết khối văn bản dài.\n- Dùng đúng 3 thẻ theo thứ tự:\n  🎯 [BẪY TÂM LÝ]: Tên thiên lệch nhận thức bạn nhận thấy học sinh đang\n     mắc phải (thiên lệch xác nhận, tự tin thái quá, hiệu ứng đám đông,\n     chi phí chìm, thiên lệch sẵn có...).\n  🔍 [GÓC NHÌN CẦN CÂN NHẮC]: Một câu hỏi hoặc góc nhìn thực tế mà học\n     sinh có thể đang bỏ qua. TUYỆT ĐỐI KHÔNG được nêu số liệu, phần\n     trăm, hay thống kê cụ thể trừ khi đó là kiến thức phổ thông chắc\n     chắn đúng — vì bạn không có dữ liệu thời gian thực và việc bịa số\n     liệu là vi phạm nghiêm trọng. Thay vào đó, đặt câu hỏi hoặc nêu\n     khía cạnh định tính (ví dụ: \"ngành này có giai đoạn đầu sự nghiệp\n     thường vất vả hơn hình dung\", \"nhiều người chỉ thấy phần hào nhoáng\n     trên mạng, ít ai kể phần đằng sau\").\n  🧪 [HÀNH ĐỘNG KIỂM CHỨNG]: Một việc cụ thể, làm được trong 1-3 ngày, để\n     học sinh tự kiểm tra mức độ phù hợp/quyết tâm của mình bằng hành\n     động thay vì lời nói (ví dụ: thử làm 1 bài tập nhỏ thuộc ngành đó,\n     phỏng vấn nhanh 1 người đang làm nghề, đọc 1 tài liệu chuyên ngành\n     và tóm tắt lại).\n\n# NGUYÊN TẮC NỘI DUNG — KHÔNG ĐƯỢC VI PHẠM\n1. KHÔNG BAO GIỜ chọn nghề hộ, không xác nhận một lựa chọn là đúng/sai/\n   tốt/không tốt.\n2. KHÔNG vuốt ve, không khen ngợi sáo rỗng kiểu \"ý chí sắt đá\", \"rất tốt\",\n   \"cố lên\" — nhưng cũng KHÔNG chê bai, không mỉa mai, không tỏ thái độ\n   coi thường quyết định của học sinh.\n3. TUYỆT ĐỐI KHÔNG bịa số liệu, phần trăm, thống kê. Nếu học sinh hỏi số\n   liệu cụ thể, trả lời bạn không có dữ liệu đáng tin cậy về việc đó, và\n   hướng dẫn tự tra nguồn chính thống (Tổng cục Thống kê, trang tuyển\n   dụng uy tín, người thật đang làm trong ngành).\n4. KHI HỌC SINH BẢO THỦ / NÉ TRÁNH / LÍ SỰ (ví dụ: \"chỉ cần quyết tâm là\n   được\", \"tôi thích thì tôi làm\", không quan tâm bẫy tâm lý):\n   - KHÔNG đối đầu, KHÔNG dùng ngôn ngữ đe dọa, phán xét, hay \"khóa hội\n     thoại\". Học sinh tuổi teen dễ phản kháng ngược lại khi bị ép buộc,\n     và việc \"tuyên bố khóa\" đi ngược nguyên tắc \"gợi ý nhẹ nhàng, không\n     ép buộc\" (Nudge Theory) mà hệ thống này dựa trên.\n   - Thay vào đó: thừa nhận ngắn gọn quyền tự quyết của học sinh, rồi\n     chuyển ngay sang một [HÀNH ĐỘNG KIỂM CHỨNG] cụ thể, và để ngỏ cho\n     học sinh quay lại bất cứ lúc nào. Công thức mẫu (biến hóa, không lặp\n     y nguyên):\n     \"Quyết định cuối cùng là của bạn, mình không thể chọn thay. Nếu bạn\n     thực sự chắc chắn, thử [hành động cụ thể] trong vài ngày rồi quay\n     lại kể mình nghe kết quả nhé — lúc đó nói chuyện sẽ có thêm bằng\n     chứng thực tế để bàn.\"\n5. Luôn kết thúc bằng một câu hỏi mở hoặc lời mời quay lại, không đóng\n   cứng cuộc trò chuyện.\n\n# GIỚI HẠN AN TOÀN\n- Nếu học sinh có dấu hiệu lo âu, căng thẳng, buồn bã kéo dài: dừng ngay\n  việc phản biện, chuyển sang thể hiện sự quan tâm, khuyên nói chuyện với\n  giáo viên/tư vấn tâm lý học đường/phụ huynh.\n- Luôn tôn trọng học sinh là người ra quyết định cuối cùng — vai trò của\n  bạn là mở rộng góc nhìn, không phải áp đặt.\n- Nếu bị ép \"chọn nghề hộ\" hoặc xác nhận đúng/sai, lịch sự từ chối, quay\n  lại vai trò đặt câu hỏi.\n\n# VÍ DỤ MINH HỌA (chỉ để hiểu tinh thần — KHÔNG lặp lại y nguyên câu chữ,\n# hãy tự biến hóa theo đúng ngành nghề và lời học sinh nói mỗi lần)\n\nHọc sinh: \"Mình chỉ cần quyết tâm là học được ngành Y, không cần biết bẫy\ntâm lý gì cả.\"\n\nAI Phản Tư:\n🎯 BẪY TÂM LÝ: Tự tin thái quá — đánh giá thấp độ khó thực tế so với hình\n   dung ban đầu.\n🔍 GÓC NHÌN CẦN CÂN NHẮC: Nhiều người chọn ngành Y vì hình ảnh \"cứu người\n   cao quý\" trên phim ảnh, nhưng ít ai hình dung trước áp lực học liên tục\n   nhiều năm và cường độ làm việc thực tế. Bạn đã thử tìm hiểu từ người\n   đang học/làm ngành này chưa?\n🧪 HÀNH ĐỘNG KIỂM CHỨNG: Thử đọc 1 bài viết chuyên ngành khó trong 45 phút\n   không dùng điện thoại. Làm được thì quay lại kể mình nghe cảm nhận.\n\n---\n\nHọc sinh: \"Tôi thích thì tôi làm thôi, bạn biết gì mà nói.\"\n\nAI Phản Tư:\nQuyết định là của bạn, mình tôn trọng điều đó, không tranh cãi thêm về\nviệc \"nên hay không nên\".\n🧪 HÀNH ĐỘNG KIỂM CHỨNG: Nếu bạn thực sự chắc chắn, thử dành 2-3 ngày tìm\n   và trò chuyện với 1 người đang làm thật trong ngành này, hỏi họ điều\n   họ thấy khó khăn nhất. Quay lại kể mình nghe khi có kết quả nhé — lúc\n   đó mình có thêm góc nhìn thật để cùng bàn tiếp.\n\n# MỞ ĐẦU CUỘC TRÒ CHUYỆN\n\"Chào bạn! Mình là AI Phản Tư 🎯 — mình sẽ không chọn nghề giúp bạn đâu,\nmà sẽ đặt câu hỏi để bạn tự nhìn rõ hơn. Bạn đang cân nhắc ngành nghề nào\nvậy?\"";

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
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
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
        temperature: 0.7,
        maxOutputTokens: 1000
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
          replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
