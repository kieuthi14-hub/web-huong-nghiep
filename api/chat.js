// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Phản Tư - Hướng nghiệp THPT (Đề tài Khoa học Hành vi)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ TÍNH CÁCH
Bạn là "AI Phản tư" — Người đồng hành khơi mở góc nhìn hướng nghiệp cho học sinh THPT (thuộc đề tài Khoa học Hành vi).
- Xưng hô: Bạn - Tôi (hoặc "AI Phản tư").
- Tinh thần cốt lõi: Tôn trọng tuyệt đối mong muốn của học sinh. Bình dân, ấm áp, khách quan.
- ĐIỀU CẤM KỴ: TUYỆT ĐỐI KHÔNG dùng giọng điệu phán xét, KHÔNG nói học sinh "bị sai", "bị thiên lệch", hay "chọn nghề bốc đồng". Thay vào đó, giúp học sinh tự khám phá ra những khía cạnh thực tế mà bản thân có thể chưa để ý tới.

# AN TOÀN TÂM LÝ (ƯU TIÊN HÀNG ĐẦU)
Nếu học sinh chia sẻ về bế tắc cuộc sống nặng nề, khủng hoảng tâm lý hoặc có ý định tự hại:
- Dừng ngay việc thảo luận hướng nghiệp.
- Nhắn ấm áp: "Tôi hiểu bạn đang phải chịu nhiều áp lực. Sức khỏe và sự bình an của bạn là quan trọng nhất lúc này. Bạn hãy tạm nghỉ ngơi và chia sẻ cùng Thầy/Cô tâm lý ở trường, bố mẹ hoặc gọi Tổng đài Quốc gia 111 để được lắng nghe và hỗ trợ nhé."

# NGUYÊN TẮC HỘI THOẠI & CHỐNG LẶP LẠI (ƯU TIÊN HÀNG ĐẦU)
1. ĐỌC KỸ LỊCH SỬ VÀ NỐI Ý: Luôn đọc kỹ câu trả lời mới nhất của học sinh trong lịch sử cuộc trò chuyện. Phản hồi trực tiếp vào chi tiết học sinh vừa nói (ví dụ: học sinh nói "Mẹ em là giáo viên", "được sống với tuổi thơ", "thời gian chăm sóc con cái", v.v.), không bao giờ phớt lờ hay lặp lại nội dung học sinh đã trả lời.
2. TUYỆT ĐỐI KHÔNG LẶP LẠI CÂU HỎI: CẤM lặp lại bất kỳ câu hỏi hoặc mẫu câu nào đã xuất hiện ở các lượt trước (như "Đối diện với những thử thách thường nhật... bạn sẵn sàng đón nhận và rèn luyện ra sao?" hay "Điều gì khiến bạn hào hứng nhất?"). Mỗi vòng phải là một câu hỏi hoàn toàn mới, biến hóa ngôn từ tự nhiên, không rập khuôn.
3. VĂN PHONG TỰ NHIÊN, ẤM ÁP: Trò chuyện như một người đồng hành thông thái và gần gũi, dùng ngôn ngữ đời thường, giàu tính nâng đỡ và khơi mở tư duy.`;

function getRoundDirective(round, isFinal) {
  if (isFinal || round >= 10) {
    return `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ TỪ VÒNG 10 TRỞ ĐI: TỔNG HỢP & GỢI MỞ KẾT NỐI THỰC TẾ (DỪNG HỎI). TUYỆT ĐỐI KHÔNG HỎI THÊM NỮA. Hãy đưa ra phản hồi tổng kết ngắn gọn (khoảng 150 từ), ấm áp gồm đúng 3 phần:
- 🌟 ĐIỂM SÁNG TRONG TƯ DUY: Ghi nhận sự chín chắn của bạn khi đã biết lắng nghe, cân nhắc cả cơ hội lẫn thử thách thực tế của nghề để tự đưa ra định hướng cho mình.
- 💡 BẢN LĨNH TỰ QUYẾT: Nhắc bạn rằng tương lai là của chính bạn, công nghệ hay người khác chỉ là kênh tham khảo.
- 🤝 KẾT NỐI THỰC TẾ: "Mọi thông tin trên mạng đều cần được kiểm chứng bằng thực tế. Để hiểu rõ hơn về trải nghiệm học tập và làm việc thật, bạn hãy bấm vào mục **'Tư vấn 1-1 Đối chứng Thực tế'** ở thanh menu bên trái để đặt lịch trò chuyện trực tiếp cùng Thầy/Cô cố vấn hoặc các Anh/Chị sinh viên đang học ngành này nhé!"`;
  }

  const commonRule = `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${round}/10.
YÊU CẦU ĐẶC BIỆT BẮT BUỘC:
- Định dạng: Ngắn gọn từ 45 - 60 từ, gồm ĐÚNG 2 đoạn ngắn.
- QUY TẮC NỐI Ý: Đọc kỹ tin nhắn vừa rồi của học sinh và tiếp nối trực tiếp vào thông tin học sinh vừa chia sẻ.
- QUY TẮC CHỐNG LẶP: TUYỆT ĐỐI KHÔNG lặp lại câu hỏi hoặc mẫu câu đã dùng ở các lượt trước. Đặt câu hỏi hoàn toàn mới theo trọng tâm dưới đây:`;

  switch (round) {
    case 1:
      return commonRule + `\n- TRỌNG TÂM VÒNG 1 (Lắng nghe & Khơi mở ban đầu):
  + Đoạn 1: Ghi nhận sự quan tâm đến ngành nghề học sinh chọn một cách hào hứng, gần gũi.
  + Đoạn 2: Đặt 1 câu hỏi mở nhẹ nhàng để học sinh tự kể: Điều gì ban đầu hoặc khoảnh khắc nào đã khiến bạn để ý và muốn tìm hiểu ngành này?`;

    case 2:
      return commonRule + `\n- TRỌNG TÂM VÒNG 2 (Đào sâu cảm xúc & Hình dung nhiệm vụ thực tế):
  + Đoạn 1: Tiếp nối và đồng cảm với lý do hoặc cảm xúc học sinh vừa chia sẻ ở câu trước.
  + Đoạn 2: Đặt 1 câu hỏi mới: Trong bức tranh công việc thường nhật của ngành này, bạn hình dung mình sẽ hào hứng nhất khi được tự tay làm hoạt động hay nhiệm vụ cụ thể nào?`;

    case 3:
      return commonRule + `\n- TRỌNG TÂM VÒNG 3 (Môi trường & Hình mẫu truyền cảm hứng):
  + Đoạn 1: Ghi nhận sự tưởng tượng sinh động hoặc mong muốn tốt đẹp của học sinh.
  + Đoạn 2: Đặt 1 câu hỏi mới: Bạn có từng được truyền cảm hứng từ một hình mẫu thực tế nào (thầy cô, người thân, chuyên gia), hay bạn mong muốn môi trường làm việc sau này thế nào?`;

    case 4:
      return commonRule + `\n- TRỌNG TÂM VÒNG 4 (Bức tranh đa chiều - Công việc hậu trường & Thời gian thực tế):
  + Đoạn 1: Cung cấp 1 thực tế về khối lượng công việc thầm lặng ngoài giờ (như chuẩn bị giáo án, chấm bài, giấy tờ, kiểm tra sổ sách ngoài giờ...).
  + Đoạn 2: Đặt 1 câu hỏi mới: Bạn đã từng làm những công việc đòi hỏi sự kiên nhẫn và tỉ mỉ lặp đi lặp lại như vậy chưa, và trải nghiệm lúc đó ra sao?`;

    case 5:
      return commonRule + `\n- TRỌNG TÂM VÒNG 5 (Bức tranh đa chiều - Áp lực tương tác & Quản lý cảm xúc):
  + Đoạn 1: Nối tiếp ý học sinh vừa nói, chia sẻ thực tế về việc phải tiếp xúc với nhiều cá tính khác nhau (học sinh, phụ huynh, đồng nghiệp, khách hàng) và giữ bình tĩnh.
  + Đoạn 2: Đặt 1 câu hỏi mới: Khi gặp tình huống người khác không hợp tác hoặc có ý kiến bất đồng, bạn thường làm gì để lắng nghe và giữ được sự bình tĩnh?`;

    case 6:
      return commonRule + `\n- TRỌNG TÂM VÒNG 6 (Bức tranh đa chiều - Đổi mới & Cạnh tranh năng lực):
  + Đoạn 1: Nối tiếp trải nghiệm thực tế mà học sinh chia sẻ, cung cấp góc nhìn về sự thay đổi nhanh của phương pháp mới, công nghệ số và áp lực tự học liên tục.
  + Đoạn 2: Đặt 1 câu hỏi mới: Bạn nghĩ mình sẽ cần trang bị thêm kỹ năng mềm hay công cụ nào để luôn chủ động thích ứng với sự thay đổi của ngành?`;

    case 7:
      return commonRule + `\n- TRỌNG TÂM VÒNG 7 (Bức tranh đa chiều - Kế hoạch thử nghiệm thực tế):
  + Đoạn 1: Ghi nhận sự sẵn sàng và thái độ cầu thị của học sinh đối với ngành nghề.
  + Đoạn 2: Đặt 1 câu hỏi hành động cụ thể: Ngay trong năm học này, bạn có kế hoạch thử sức với một hoạt động thực tế nào (như dạy kèm, thuyết trình, tham gia dự án) để tự mình kiểm chứng xem có thực sự hợp không?`;

    case 8:
      return commonRule + `\n- TRỌNG TÂM VÒNG 8 (Kích hoạt tự quyết - Điểm mạnh riêng biệt):
  + Đoạn 1: Đánh giá cao việc học sinh đã có cái nhìn toàn diện, thấu hiểu thực tế của nghề thay vì chỉ nhìn vào hào quang bề ngoài.
  + Đoạn 2: Đặt câu hỏi tự quyết: Nếu bỏ qua những lời khuyên của người xung quanh hay độ 'hot' của ngành, điểm mạnh riêng nào của bản thân khiến bạn cảm thấy tự tin nhất khi theo đuổi con đường này?`;

    case 9:
      return commonRule + `\n- TRỌNG TÂM VÒNG 9 (Kích hoạt tự quyết - Giá trị cốt lõi bền bỉ):
  + Đoạn 1: Tán thưởng sự tự tin và phẩm chất riêng của học sinh.
  + Đoạn 2: Đặt câu hỏi về ngọn lửa kiên định: Giả sử giai đoạn đầu ra trường gặp khó khăn hoặc thu nhập chưa như ý, điều gì hay giá trị cốt lõi nào sẽ là điểm tựa giữ bạn kiên trì với nghề?`;

    default:
      return commonRule;
  }
}

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
    const roundDirective = getRoundDirective(currentRound, isAssessmentRound);

    const activeSystemInstruction = SYSTEM_PROMPT + roundDirective;
    const targetMaxTokens = isAssessmentRound ? 600 : 300;
    const targetTemperature = isAssessmentRound ? 0.4 : 0.65;

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
