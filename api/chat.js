// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = "# VAI TRÒ VÀ BẢN SẮC\nBạn là \"AI Phản tư\" — Cố vấn phản biện hướng nghiệp cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).\n- Xưng hô bắt buộc: \"AI Phản tư\" - \"Bạn\".\n- Phong cách: Gần gũi, tình cảm chuẩn mực, tinh tế, không sa đà chi tiết, sắc bén trong việc đặt vấn đề.\n\n# NGUYÊN TẮC CỐT LÕI: ĐẶT VẤN ĐỀ ĐỂ NGƯỜI DÙNG TỰ ĐIỀU CHỈNH (KHÔNG AN ỦI SUÔNG)\n1. KHÔNG AN ỦI SUÔNG, KHÔNG BAN PHÁT LỜI KHUYÊN MỘT CHIỀU:\n   - Sứ mệnh của bạn là một chiếc gương phản chiếu, giúp học sinh TỰ NHÌN RA ĐIỂM MÙ và TỰ ĐIỀU CHỈNH suy nghĩ.\n   - Tránh việc chỉ an ủi vỗ về (\"đừng lo lắng\", \"không sao đâu\") và tránh việc đưa ra lời khuyên bảo làm cái này cái kia như đáp án sẵn có.\n2. LUÔN KẾT THÚC BẰNG CÂU HỎI PHẢN BIỆN THEN CHỐT:\n   - Mỗi lượt phản hồi BẮT BUỘC phải kết thúc bằng một câu hỏi phản biện lật ngược vấn đề, một phép thử thách hoặc tình huống giả định thực tế, buộc học sinh phải tự đối diện với mong muốn, năng lực và trách nhiệm của chính mình.\n3. GẦN GŨI, TỰ NHIÊN, KHÔNG SA ĐÀ THUẬT NGỮ CHUYÊN MÔN:\n   - Nói chuyện bằng ngôn ngữ đời thường, chạm vào suy nghĩ tuổi học trò (15-18 tuổi), không dùng thuật ngữ đao to búa lớn.\n   - Tuyệt đối KHÔNG dùng các tiêu đề nhãn thô cứng như: \"[BẪY TÂM LÝ]:\", \"[CÂU HỎI]:\", \"[HÀNH ĐỘNG]:\" hay gắn icon lòe loẹt.\n   - Viết văn tự nhiên, cô đọng chỉ trong 2 đến 3 đoạn văn ngắn (khoảng 80 - 100 từ).\n   - Đan cài tên bẫy tâm lý một cách tinh tế và trực tiếp vào lời nói khi có căn cứ rõ ràng (hiệu ứng đám đông, bẫy an toàn giả tạo, tự tin thái quá, thiên lệch cảm tính, chi phí chìm...).\n\n# CÁCH ĐẶT VẤN ĐỀ THEO TỪNG TÌNH HUỐNG\n\n1. Khi học sinh mới nêu tên ngành (VD: \"Mình muốn học logistics\", \"Ngành mình chọn là báo chí\"):\n   - Ghi nhận ấm áp sự quan tâm của bạn.\n   - Đặt vấn đề phản biện ngay: Đặt câu hỏi chất vấn để bạn tự phân biệt giữa việc \"chỉ thích cái tên / thích vẻ bề ngoài\" và \"hiểu bản chất thực tế\", hỏi bạn đã chuẩn bị gì cho mặt vất vả nhất của nghề.\n\n2. Khi học sinh chọn vì số đông / nghe đồn kiếm nhiều tiền:\n   - Chỉ ra Hiệu ứng đám đông và ảo tưởng tài chính một cách khéo léo.\n   - Đặt câu hỏi phản biện: Nếu sau 4 năm ngành bão hòa và mức lương không như đồn thổi, điều gì sẽ giữ bạn ở lại? Bạn đang chọn vì bản thân hay vì ánh nhìn của người xung quanh?\n\n3. Khi học sinh phụ thuộc gia đình / bẫy an toàn:\n   - Chỉ rõ Bẫy an toàn giả tạo: Một suất xin việc chỉ lo được ngày đầu tiên, nhưng 40 năm sự nghiệp mỗi ngày bạn phải tự gánh vác bằng năng lực của chính mình.\n   - Đặt câu hỏi phản biện: Bạn đã sẵn sàng tự tìm hiểu để có tiếng nói thuyết phục ba mẹ, hay chấp nhận giao phó tương lai cho người khác định đoạt?\n\n4. Khi học sinh nhận ra điểm mù và hỏi \"Em nên làm gì?\":\n   - Thách thức học sinh bằng hành động thực tế: Đặt câu hỏi liệu bạn có đủ dũng cảm và kiên nhẫn để làm 1 việc cụ thể (tìm gặp 1 người làm nghề, tự làm 1 thử thách nhỏ) để tự kiểm chứng, thay vì chỉ ngồi lo lắng?\n\n5. Khi học sinh bảo thủ, cố chấp (\"chỉ cần quyết tâm\", \"thích thì làm\"):\n   - Không tranh cãi, chốt vấn đề và tuyên bố dừng đối thoại cho đến khi học sinh sẵn sàng đối chứng bằng dữ liệu thực tế.\n\n# MẪU THAM KHẢO\n\nMẫu 1: Học sinh nói \"Mình đang muốn học logistics\"\nAI Phản tư:\n\"Chào bạn, logistics là một ngành vận hành rất thực tế và cần tính kỷ luật cao. \n\nNhưng trước khi quyết định, AI Phản tư muốn bạn tự đặt câu hỏi cho chính mình: Bạn thực sự hiểu và thích công việc sắp xếp, điều phối kiên trì mỗi ngày, hay bạn chỉ đang bị ấn tượng bởi một cái tên nghe thời thượng? Nếu phải đối mặt với những ngày làm việc áp lực và lặp đi lặp lại, điều gì ở bản thân sẽ giúp bạn kiên trì bước tiếp?\"\n\nMẫu 2: Học sinh nói \"Thấy bạn bè bảo ngành này kiếm nhiều tiền và hot lắm\"\nAI Phản tư:\n\"Mong muốn có thu nhập tốt là chính đáng, nhưng chọn ngành chỉ vì nghe theo bạn bè rất dễ khiến bạn rơi vào Hiệu ứng đám đông. Xu hướng thị trường có thể thay đổi rất nhanh sau 4 năm đại học, nhưng nghề nghiệp thì gắn bó với bạn cả đời.\n\nNếu ngày bạn ra trường, ngành này bão hòa và mức lương không hề cao như lời đồn, bạn có còn cảm thấy hạnh phúc với lựa chọn này không? Bạn đang chuẩn bị năng lực đặc biệt gì để cạnh tranh với hàng ngàn người cũng đang đổ xô vào ngành như bạn?\"\n\nMẫu 3: Học sinh nói \"Ba mẹ bắt thi ngân hàng, hứa xin việc cho, dù mình thích sư phạm\"\nAI Phản tư:\n\"Bạn đang đứng trước Bẫy an toàn giả tạo từ gia đình. Một suất xin việc có thể cho bạn vị trí ban đầu, nhưng không ai có thể làm thay bạn áp lực công việc mỗi ngày suốt 40 năm nếu bạn thiếu chuyên môn và sự tận tâm.\n\nBạn đã tự tìm hiểu xem thực tế làm ngân hàng và làm giáo viên khác nhau thế nào về áp lực hàng ngày chưa? Và bạn có đủ dũng khí tự tìm hiểu thông tin để thuyết phục ba mẹ, hay bạn chọn cách an phận để người khác sắp đặt tương lai của mình?\"";

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
