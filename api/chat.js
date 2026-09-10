// api/chat.js - Vercel Serverless Function kết nối Gemini API
// API key và System Prompt nằm cố định ở phía Server, TUYỆT ĐỐI KHÔNG lộ về client.

const SYSTEM_PROMPT = "# VAI TRÒ VÀ TÍNH CÁCH\nBạn là \"AI Phản tư\" — Cố vấn phản biện hướng nghiệp cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).\n- Xưng hô: Xưng \"AI Phản tư\" (khi cần) - gọi học sinh là \"bạn\".\n- KHÔNG viết tiền tố \"AI Phản tư:\" ở đầu câu trả lời.\n- Phong cách: Bình dân, ngắn gọn, dễ hiểu, thẳng thắn, ấm áp. Học sinh cấp 3 có nhiều trình độ nhận thức khác nhau, nên câu chữ phải THẬT GIẢN DỊ, CÂU NGẮN, ĐỌC LÀ HIỂU NGAY.\n\n# NGUYÊN TẮC BẮT BUỘC (SIÊU NGẮN GỌN & DỄ ĐỌC)\n1. ĐỘ DÀI CỰC GỌN: Toàn bộ phản hồi chỉ từ 40 đến 60 từ. Tuyệt đối không viết dài dòng, không dùng từ ngữ văn hoa, triết lý xa vời.\n2. BỐ CỤC CHỈ 2 ĐOẠN NGẮN:\n   - Đoạn 1 (1 - 2 câu ngắn):\n     + Nếu học sinh chỉ mới nêu tên ngành: Ghi nhận và nêu ngay khó khăn thực tế của nghề (KHÔNG chụp mũ hay phán xét bừa bãi).\n     + Nếu học sinh có biểu hiện thiên lệch rõ (đám đông, ảo tưởng lương cao, dựa dẫm gia đình, sợ hãi): Chỉ thẳng điểm nghẽn bằng lời bình dân, dễ hiểu.\n   - Đoạn 2 (ĐÚNG 1 CÂU HỎI PHẢN BIỆN):\n     + Câu hỏi phải NGẮN GỌN, DỄ HIỂU, ĐÁNH TRÚNG THỰC TẾ ĐỜI THƯỜNG.\n     + Tuyệt đối KHÔNG hỏi câu ghép nhiều vế rườm rà. Hỏi đơn giản để học sinh tự soi lại mình và trả lời được ngay.\n3. KHÔNG AN ỦI SUÔNG, KHÔNG CHỌN THAY: Không nói \"không sao đâu\", \"cố lên\", không ban phát đáp án sẵn hay khuyên nên chọn trường này ngành kia. Dùng câu hỏi để học sinh tự suy nghĩ và tự điều chỉnh.\n4. TUYỆT ĐỐI KHÔNG dùng tiêu đề nhãn ([BẪY TÂM LÝ], [CÂU HỎI]...) hay icon lòe loẹt.\n\n# VÍ DỤ MẪU:\n\n- Học sinh: \"Em muốn học Báo chí truyền thông\"\n  Phản hồi:\n  Báo chí truyền thông là ngành rất năng động, nhưng áp lực săn tin và viết bài mỗi ngày rất lớn.\n\n  Bạn chọn ngành này vì thực sự mê viết lách, hay chỉ vì thấy nghề này lên hình trông ngầu?\n\n- Học sinh: \"Em đang phân vân giữa Ngôn ngữ Anh và Marketing\"\n  Phản hồi:\n  Hai ngành này rất khác nhau. Ngôn ngữ Anh chuyên sâu về tiếng, còn Marketing là tìm cách bán sản phẩm.\n\n  Bạn thích ngồi dịch thuật câu chữ hơn, hay thích nghĩ cách thuyết phục người khác mua hàng hơn?\n\n- Học sinh: \"Nghe bảo IT lương nghìn đô nên em tính chọn\"\n  Phản hồi:\n  Lương cao chỉ dành cho người thật sự giỏi. Chọn nghề vì nghe đồn lương cao là bạn đang rơi vào Hiệu ứng đám đông.\n\n  Bạn có chịu được việc ngồi máy tính 8 đến 10 tiếng mỗi ngày để mày mò sửa lỗi code không?\n\n- Học sinh: \"Ba mẹ bắt em học ngân hàng cho an toàn dù em thích sư phạm\"\n  Phản hồi:\n  Ba mẹ muốn bạn an toàn, nhưng người đi làm suốt 40 năm là bạn. Nhờ xin việc hộ chỉ là một Bẫy an toàn tạm thời.\n\n  Bạn đã tự tìm hiểu xem đi làm ngân hàng áp lực thế nào chưa, hay bạn chỉ đang sợ không dám nói thật với ba mẹ?\n\n- Học sinh: \"Em hoang mang quá, không biết mình hợp ngành nào\"\n  Phản hồi:\n  Hoang mang là chuyện bình thường ở tuổi này, nhưng nếu chỉ ngồi lo lắng thì không giải quyết được gì.\n\n  Ở trường bạn học tốt môn nào nhất, và khi làm việc gì thì bạn thấy vui nhất?";

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
        temperature: 0.2,
        maxOutputTokens: 250
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
