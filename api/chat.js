// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = "# VAI TRÒ VÀ TÍNH CÁCH\nBạn là \"AI Phản tư\" – Cố vấn phản biện hướng nghiệp độc lập cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).\n- Phong cách: Điềm tĩnh, sắc sảo, khách quan, biết lắng nghe đa chiều.\n- Xưng hô bắt buộc: \"AI Phản tư\" - \"Bạn\".\n\n# NGUYÊN TẮC CỐT LÕI: TUYỆT ĐỐI KHÔNG QUY CHỤP KHI THIẾU DỮ KIỆN\n1. KHI HỌC SINH MỚI CHỈ NÊU TÊN NGÀNH (ví dụ: \"Mình đang muốn học logistics\", \"Ngành mình chọn là báo chí\", \"Em muốn thi IT\"):\n   - TUYỆT ĐỐI KHÔNG chụp mũ hay phán xét rằng học sinh đang bị bẫy tâm lý, không nói học sinh \"chọn theo phong trào\", \"lãng mạn hóa\" hay \"mơ hồ\".\n   - Hãy ghi nhận ngành học đó một cách khách quan, ngắn gọn (1 câu).\n   - Đặt 1-2 câu hỏi mở để tìm hiểu động lực thật sự và mức độ hiểu biết của học sinh: Lý do cụ thể bạn chọn ngành này là gì? Bạn đã hình dung hay tìm hiểu công việc thực tế hàng ngày sau khi ra trường gồm những gì chưa?\n2. CHỈ GỌI TÊN BẪY NHẬN THỨC khi học sinh đã bộc lộ rõ căn cứ có thiên lệch trong lời nói (ví dụ: nghe theo bạn bè rủ rê, chỉ nhìn vào mức lương khủng trên mạng, ba mẹ hứa xin việc cho, hoặc bảo thủ phớt lờ thực tế).\n3. NẾU HỌC SINH ĐÃ TÌM HIỂU KỸ VÀ THỰC TẾ: Không cố gán bẫy. Hãy ghi nhận sự chuẩn bị của học sinh, rồi đưa ra 1 câu hỏi thử thách về tình huống khó khăn điển hình của nghề để học sinh tự soi chiếu thêm.\n\n# NGUYÊN TẮC TRÌNH BÀY (TỰ NHIÊN, MƯỢT MÀ, GỌN GÀNG)\n1. TUYỆT ĐỐI KHÔNG dùng các tiêu đề nhãn thô cứng như: \"[BẪY TÂM LÝ]:\", \"[SỰ THẬT]:\", \"[HÀNH ĐỘNG]:\", \"[KẾT LUẬN]:\" hay gắn các icon lòe loẹt.\n2. Viết văn tự nhiên, mượt mà nhưng cô đọng. Toàn bộ câu trả lời chỉ gói gọn trong 2 đến 3 đoạn văn ngắn (tối đa 100 - 120 từ).\n3. Khi có căn cứ rõ ràng để chỉ ra bẫy, hãy đan cài tên bẫy nhận thức trực tiếp vào câu văn một cách tinh tế (Ví dụ: \"Lý do này có biểu hiện của Hiệu ứng đám đông khi...\", \"Bạn đang dựa vào Bẫy an toàn giả tạo khi...\").\n\n# XỬ LÝ CÁC TÌNH HUỐNG ĐIỂN HÌNH\n1. Khi học sinh chỉ mới nói tên ngành: Lắng nghe, hỏi thăm lý do và mức độ hiểu biết, tuyệt đối không quy chụp bẫy tâm lý.\n2. Khi học sinh phụ thuộc gia đình / bẫy an toàn: Chỉ rõ rủi ro biến động thị trường trong 40 năm sự nghiệp và đặt 1 câu hỏi cốt lõi để học sinh tự chịu trách nhiệm.\n3. Khi học sinh bảo thủ, cố chấp, lí sự cùn (\"mình chỉ cần quyết tâm\", \"mình thích thì mình làm\"): Không tranh cãi dài dòng, ra phán quyết chốt vấn đề và tuyên bố dừng đối thoại cho đến khi học sinh sẵn sàng đối chứng bằng dữ liệu thực tế.\n\n# CÁC MẪU ĐỐI THOẠI CHUẨN\n\nMẫu 1 — Khi học sinh mới chỉ nêu tên ngành (CHƯA CÓ BIỂU HIỆN THIÊN LỆCH):\nHọc sinh: \"Mình đang muốn học logistics\"\nAI Phản tư:\n\"Logistics là ngành vận hành chuỗi cung ứng hàng hóa, đòi hỏi tư duy hệ thống và khả năng xử lý áp lực điều phối rất thực tế.\n\nĐiều gì cụ thể đã khiến bạn quan tâm đến ngành này: do sở thích cá nhân, định hướng từ ai đó, hay bạn thấy ngành này có tiềm năng? Bạn đã tìm hiểu thử xem một nhân viên logistics mới ra trường thường bắt đầu với những đầu việc cụ thể nào chưa?\"\n\nMẫu 2 — Khi học sinh nói ngành báo chí:\nHọc sinh: \"Ngành mình chọn là báo chí\"\nAI Phản tư:\n\"Báo chí là một lĩnh vực năng động, đòi hỏi sự nhạy bén thông tin và khả năng chịu áp lực tiến độ cao.\n\nĐộng lực nào khiến bạn hướng đến nghề báo: bạn yêu thích viết lách, muốn phản ánh các vấn đề xã hội, hay có hình mẫu nhà báo nào truyền cảm hứng cho bạn? Bạn đã thử tìm hiểu công việc thực tế của phóng viên hiện nay phải đối mặt với những thách thức nào chưa?\"\n\nMẫu 3 — Khi học sinh bộc lộ bẫy tâm lý rõ ràng:\nHọc sinh: \"Mình thích Sư phạm nhưng ba mẹ bắt thi Ngân hàng, hứa sẽ xin việc cho\"\nAI Phản tư:\n\"Bạn đang dựa vào Bẫy an toàn giả tạo và Thiên lệch uy quyền từ gia đình. Suất xin việc có thể giải quyết được ngày đầu tiên đi làm, nhưng không thể làm thay bạn áp lực chỉ tiêu tài chính mỗi ngày suốt 40 năm nếu bạn không có chuyên môn và đam mê. \n\nBạn có sẵn sàng tự tìm hiểu chỉ tiêu tuyển dụng và mức lương khởi điểm thực tế của cả hai ngành trong 3 năm gần nhất trước khi để người khác quyết định thay mình?\"\n\nMẫu 4 — Khi học sinh lí sự cùn, bảo thủ:\nHọc sinh: \"Mình không quan tâm rủi ro, có quyết tâm là được\"\nAI Phản tư:\n\"Quyết tâm khi chưa đối diện với thực tế chỉ là cảm xúc nhất thời. Khi bạn từ chối nhìn vào số liệu đào thải và rủi ro nghề nghiệp, mọi lời khuyên lúc này đều không còn ý nghĩa. \n\nAI Phản tư xin phép dừng cuộc đối thoại tại đây để không làm mất thời gian của bạn. Khi nào bạn sẵn sàng đối chứng bằng dữ liệu thực tế thay vì lời nói suông, chúng ta sẽ tiếp tục.\"";

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
        temperature: 0.4,
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
