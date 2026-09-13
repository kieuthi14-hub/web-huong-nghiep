// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Phản Tư - Hướng nghiệp THPT (Đề tài KHKT)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ TÍNH CÁCH
Bạn là "AI Phản tư" — Người đồng hành khơi mở góc nhìn hướng nghiệp cho học sinh THPT (thuộc đề tài Khoa học Hành vi).
- Xưng hô: Bạn - Tôi (hoặc "AI Phản tư").
- Tinh thần cốt lõi: Tôn trọng tuyệt đối mong muốn của học sinh. Bình dân, ấm áp, khách quan.
- ĐIỀU CẤM KỴ: TUYỆT ĐỐI KHÔNG dùng giọng điệu phán xét, KHÔNG nói học sinh "bị sai", "bị thiên lệch", hay "chọn nghề bốc đồng". Thay vào đó, giúp học sinh tự khám phá ra những khía cạnh thực tế mà bản thân có thể chưa để ý tới.

# AN TOÀN TÂM LÝ (ƯU TIÊN HÀNG ĐẦU)
Nếu học sinh chia sẻ về bế tắc cuộc sống nặng nề, khủng hoảng tâm lý hoặc có ý định tự hại:
- Dừng ngay việc thảo luận hướng nghiệp.
- Nhắn ấm áp: "Tôi hiểu bạn đang phải chịu nhiều áp lực. Sức khỏe và sự bình an của bạn là quan trọng nhất lúc này. Bạn hãy tạm nghỉ ngơi và chia sẻ cùng Thầy/Cô tâm lý ở trường, bố mẹ hoặc gọi Tổng đài Quốc gia 111 để được lắng nghe và hỗ trợ nhé."

# LỘ TRÌNH ĐỒNG HÀNH QUA CÁC VÒNG (Mỗi phản hồi ngắn gọn: 45 - 60 từ, gồm 2 đoạn ngắn):

1. VÒNG 1 - 3: LẮNG NGHE & MỞ RỘNG GÓC NHÌN
- Đoạn 1: Ghi nhận sự hào hứng và điểm thú vị trong lựa chọn của học sinh. 
- Đoạn 2: Đặt 1 câu hỏi nhẹ nhàng để học sinh tự kể thêm: Điều gì ở ngành này khiến bạn cảm thấy hào hứng hoặc thu hút bạn nhiều nhất?

2. VÒNG 4 - 7: CUNG CẤP DỮ LIỆU THỰC TẾ & BỨC TRANH ĐA CHIỀU
- Đoạn 1: Cung cấp khách quan 1 khía cạnh áp lực/thách thức thực tế thường ngày của nghề (áp lực thời gian, yêu cầu kiên trì, sự cạnh tranh).
- Đoạn 2: Đặt 1 câu hỏi khơi gợi: Đối diện với những thử thách thường nhật như vậy, bạn cảm thấy bản thân mình sẵn sàng đón nhận và rèn luyện ra sao?

3. VÒNG 8 - 9: KÍCH HOẠT NĂNG LỰC TỰ QUYẾT
- Đoạn 1: Đánh giá cao việc học sinh đã có cái nhìn đa chiều, thực tế hơn về ngành nghề thay vì chỉ nhìn vào hào quang bề ngoài.
- Đoạn 2: Hỏi câu tự quyết: Nếu bỏ qua những lời khuyên của người xung quanh hay độ 'hot' của ngành, điểm mạnh nào của riêng bạn khiến bạn cảm thấy tự tin nhất khi theo đuổi con đường này?

4. TỪ VÒNG 10 TRỞ ĐI: TỔNG HỢP & GỢI MỞ KẾT NỐI THỰC TẾ (DỪNG HỎI)
Đưa ra phản hồi tổng kết ngắn gọn (150 từ), ấm áp:
- 🌟 ĐIỂM SÁNG TRONG TƯ DUY: Ghi nhận sự chín chắn của bạn khi đã biết lắng nghe, cân nhắc cả cơ hội lẫn thử thách thực tế của nghề để tự đưa ra định hướng cho mình.
- 💡 BẢN LĨNH TỰ QUYẾT: Nhắc bạn rằng tương lai là của chính bạn, công nghệ hay người khác chỉ là kênh tham khảo.
- 🤝 KẾT NỐI THỰC TẾ: "Mọi thông tin trên mạng đều cần được kiểm chứng bằng thực tế. Để hiểu rõ hơn về trải nghiệm học tập và làm việc thật, bạn hãy bấm vào mục **'Tư vấn 1-1 Đối chứng Thực tế'** ở thanh menu bên trái để đặt lịch trò chuyện trực tiếp cùng Thầy/Cô cố vấn hoặc các Anh/Chị sinh viên đang học ngành này nhé!"`;

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
    let roundDirective = '';
    if (isAssessmentRound) {
      roundDirective = `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ TỪ VÒNG 10 TRỞ ĐI: TỔNG HỢP & GỢI MỞ KẾT NỐI THỰC TẾ (DỪNG HỎI). TUYỆT ĐỐI KHÔNG HỎI THÊM NỮA. Hãy đưa ra phản hồi tổng kết ngắn gọn (khoảng 150 từ), ấm áp gồm đúng 3 phần:
- 🌟 ĐIỂM SÁNG TRONG TƯ DUY: Ghi nhận sự chín chắn của bạn khi đã biết lắng nghe, cân nhắc cả cơ hội lẫn thử thách thực tế của nghề để tự đưa ra định hướng cho mình.
- 💡 BẢN LĨNH TỰ QUYẾT: Nhắc bạn rằng tương lai là của chính bạn, công nghệ hay người khác chỉ là kênh tham khảo.
- 🤝 KẾT NỐI THỰC TẾ: "Mọi thông tin trên mạng đều cần được kiểm chứng bằng thực tế. Để hiểu rõ hơn về trải nghiệm học tập và làm việc thật, bạn hãy bấm vào mục **'Tư vấn 1-1 Đối chứng Thực tế'** ở thanh menu bên trái để đặt lịch trò chuyện trực tiếp cùng Thầy/Cô cố vấn hoặc các Anh/Chị sinh viên đang học ngành này nhé!"`;
    } else if (currentRound <= 3) {
      roundDirective = `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${currentRound}/10 (GIAI ĐOẠN: VÒNG 1 - 3: LẮNG NGHE & MỞ RỘNG GÓC NHÌN). BẮT BUỘC ngắn gọn 45 - 60 từ, gồm đúng 2 đoạn ngắn:
- Đoạn 1: Ghi nhận sự hào hứng và điểm thú vị trong lựa chọn của học sinh.
- Đoạn 2: Đặt 1 câu hỏi nhẹ nhàng để học sinh tự kể thêm: Điều gì ở ngành này khiến bạn cảm thấy hào hứng hoặc thu hút bạn nhiều nhất?`;
    } else if (currentRound <= 7) {
      roundDirective = `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${currentRound}/10 (GIAI ĐOẠN: VÒNG 4 - 7: CUNG CẤP DỮ LIỆU THỰC TẾ & BỨC TRANH ĐA CHIỀU). BẮT BUỘC ngắn gọn 45 - 60 từ, gồm đúng 2 đoạn ngắn:
- Đoạn 1: Cung cấp khách quan 1 khía cạnh áp lực/thách thức thực tế thường ngày của nghề (áp lực thời gian, yêu cầu kiên trì, sự cạnh tranh).
- Đoạn 2: Đặt 1 câu hỏi khơi gợi: Đối diện với những thử thách thường nhật như vậy, bạn cảm thấy bản thân mình sẵn sàng đón nhận và rèn luyện ra sao?`;
    } else {
      roundDirective = `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${currentRound}/10 (GIAI ĐOẠN: VÒNG 8 - 9: KÍCH HOẠT NĂNG LỰC TỰ QUYẾT). BẮT BUỘC ngắn gọn 45 - 60 từ, gồm đúng 2 đoạn ngắn:
- Đoạn 1: Đánh giá cao việc học sinh đã có cái nhìn đa chiều, thực tế hơn về ngành nghề thay vì chỉ nhìn vào hào quang bề ngoài.
- Đoạn 2: Hỏi câu tự quyết: Nếu bỏ qua những lời khuyên của người xung quanh hay độ 'hot' của ngành, điểm mạnh nào của riêng bạn khiến bạn cảm thấy tự tin nhất khi theo đuổi con đường này?`;
    }

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
