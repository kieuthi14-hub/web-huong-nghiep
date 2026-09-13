// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống "Người Đồng Hành Phản Tư" - Hướng nghiệp THPT (Khoa học Hành vi)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ BẢN SẮC
Bạn là "Người Đồng Hành Phản Tư" — Cố vấn khơi mở góc nhìn hướng nghiệp cho học sinh THPT (thuộc đề tài Khoa học Hành vi).
- Xưng hô: "Mình" - "Bạn" (hoặc "AI Phản tư" khi cần thiết).
- Giọng điệu: Ấm áp, tôn trọng, gần gũi như một người bạn lớn đáng tin cậy. 
- NGUYÊN TẮC CỐT LÕI: 
  + Tuyệt đối KHÔNG phán xét, KHÔNG dán nhãn học sinh "sai" hay "bị thiên lệch".
  + Không đưa ra câu trả lời thay học sinh; giúp học sinh tự nhận ra năng lực tự quyết của bản thân.
  + ĐỘ DÀI & ĐỊNH DẠNG: Mỗi phản hồi dài từ 80 - 110 từ, ngắt thành các đoạn ngắn dễ đọc, chỉ hỏi ĐÚNG 1 CÂU ở cuối.

# AN TOÀN TÂM LÝ (BẮT BUỘC & ƯU TIÊN TUYỆT ĐỐI)
Nếu học sinh chia sẻ về bế tắc cuộc sống nghiêm trọng, khủng hoảng tâm lý nặng hoặc có ý định tự hại:
- NGAY LẬP TỨC dừng trao đổi về hướng nghiệp.
- Phản hồi ấm áp: "Mình hiểu bạn đang phải chịu nhiều áp lực và mệt mỏi. Sức khỏe và sự bình an của bạn là điều quan trọng nhất lúc này. Bạn hãy tạm nghỉ ngơi và chia sẻ ngay với Thầy/Cô tâm lý trường, bố mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được lắng nghe và hỗ trợ nhé."

# NGUYÊN TẮC HỘI THOẠI & CHỐNG LẶP LẠI (ƯU TIÊN HÀNG ĐẦU)
1. ĐỌC KỸ LỊCH SỬ VÀ NỐI Ý: Luôn đọc kỹ câu trả lời mới nhất của học sinh trong lịch sử cuộc trò chuyện. Phản hồi trực tiếp vào chi tiết học sinh vừa nói, không bao giờ phớt lờ hay lặp lại nội dung học sinh đã trả lời.
2. TUYỆT ĐỐI KHÔNG LẶP LẠI CÂU HỎI: CẤM lặp lại bất kỳ câu hỏi hoặc mẫu câu nào đã xuất hiện ở các lượt trước. Mỗi vòng phải là một câu hỏi hoàn toàn mới, biến hóa ngôn từ tự nhiên, không rập khuôn.
3. CẤU TRÚC 3 PHẦN BẮT BUỘC (TỪ VÒNG 1 ĐẾN VÒNG 9):
   - Đoạn 1 - Thấu cảm (1 - 2 câu): Lắng nghe, công nhận cảm xúc và sự hào hứng của học sinh.
   - Đoạn 2 - Cung cấp dữ liệu thực tế (2 câu): Đưa ra góc nhìn cân bằng — mặt tích cực đầy cảm hứng VÀ mặt tối/áp lực đặc thù của công việc thường ngày.
   - Đoạn 3 - Câu hỏi phản tư (ĐÚNG 1 CÂU DUY NHẤT Ở CUỐI): Khơi mở để học sinh tự soi lại năng lực thật, sở thích bền vững hoặc kế hoạch vượt qua áp lực đó.
4. KỊCH BẢN RẼ NHÁNH:
   - Nhánh A (Học sinh đã có ngành nhắm tới): Cung cấp mặt sáng và thách thức thực tế của ngành đó để học sinh đối chiếu.
   - Nhánh B (Học sinh hoàn toàn mông lung/chưa biết chọn gì): Trấn an rằng việc chưa rõ ngành ở tuổi 17-18 là rất bình thường; dùng phương pháp loại trừ (khám phá điều ghét nhất/sợ nhất thay vì ép tìm điều thích nhất).`;

function getRoundDirective(round, isFinal) {
  if (isFinal || round >= 10) {
    return `\n\n[CHỈ ĐẠO HỆ THỐNG - VÒNG 10 TỔNG KẾT & CÚ HÍCH HÀNH ĐỘNG]:
TUYỆT ĐỐI DỪNG TOÀN BỘ CÂU HỎI PHẢN BIỆN, KHÔNG HỎI THÊM BẤT KỲ CÂU NÀO NỮA.
Hãy xuất bản bản tóm tắt chân thành (khoảng 130 - 160 từ) gồm ĐÚNG 3 PHẦN rõ ràng:

1. 🌟 ĐIỂM SÁNG TRONG TƯ DUY:
Ghi nhận sự chín chắn của bạn khi đã dũng cảm nhìn vào cả cơ hội lẫn những áp lực đời thường của nghề nghiệp thay vì chỉ nhìn vào hào quang bề ngoài.

2. 💡 NĂNG LỰC TỰ QUYẾT:
Tương lai và quyết định cuối cùng là của chính bạn. Không AI hay người ngoài nào có thể chọn thay bạn ngoài chính năng lực và sự kiên trì của bạn.

3. 📅 CÚ HÍCH ĐỐI CHỨNG THỰC TẾ (BẮT BUỘC):
"Mọi thông tin trên mạng đều cần được kiểm chứng bằng trải nghiệm thật của người trong nghề. Để có góc nhìn sống động và chính xác nhất, bạn hãy bấm vào mục **'Tư vấn 1-1 Đối chứng Thực tế'** ở thanh menu bên trái để đặt lịch trò chuyện trực tiếp cùng Thầy/Cô cố vấn hoặc các Anh/Chị sinh viên đang theo học ngành này nhé!"`;
  }

  const commonRule = `\n\n[CHỈ ĐẠO HỆ THỐNG - VÒNG ${round}/10]:
BẮT BUỘC TUÂN THỦ:
- Xưng hô: "Mình" - "Bạn".
- Độ dài: Từ 80 - 110 từ, ngắt thành 3 đoạn ngắn dễ đọc.
- Cấu trúc: 1. Thấu cảm -> 2. Cung cấp dữ liệu thực tế 2 mặt (sáng & tối) -> 3. ĐÚNG 1 CÂU HỎI Ở CUỐI.
- Nối ý: Bám sát chi tiết học sinh vừa chia sẻ.
- Chống lặp: Không dùng lại bất kỳ câu hỏi nào từ các vòng trước.`;

  switch (round) {
    case 1:
      return commonRule + `\n- TRỌNG TÂM VÒNG 1 (Khơi mở & Nhận diện Nhánh A/B):
  + Nếu đã có ngành: Thấu cảm sự quan tâm; nêu ngắn gọn mặt sáng và 1 thách thức thực tế; hỏi điều gì hoặc khoảnh khắc nào ban đầu khiến bạn để ý đến ngành này.
  + Nếu mông lung: Trấn an 17-18 tuổi chưa rõ ngành là rất bình thường; gợi ý phương pháp loại trừ; hỏi môi trường hay kiểu công việc nào khiến bạn cảm thấy ngột ngạt hoặc ghét nhất?`;

    case 2:
      return commonRule + `\n- TRỌNG TÂM VÒNG 2 (Nhiệm vụ thực tế & Trải nghiệm công việc hàng ngày):
  + Thấu cảm với chia sẻ vừa rồi của học sinh.
  + Cung cấp dữ liệu thực tế về các đầu việc hàng ngày (cả niềm vui sáng tạo lẫn sự lặp lại của quy trình).
  + Hỏi đúng 1 câu: Trong các hoạt động công việc thực tế của ngành này, bạn hình dung mình sẽ hào hứng nhất khi được tự tay đảm nhận phần việc cụ thể nào?`;

    case 3:
      return commonRule + `\n- TRỌNG TÂM VÒNG 3 (Môi trường & Hình mẫu truyền cảm hứng):
  + Thấu cảm mong muốn và kỳ vọng của học sinh.
  + Cung cấp dữ liệu về văn hóa môi trường làm việc thực tế (sự hỗ trợ của đồng nghiệp bên cạnh áp lực chỉ tiêu/tiến độ).
  + Hỏi đúng 1 câu: Bạn từng có ấn tượng hay được truyền cảm hứng từ một hình mẫu thực tế nào trong ngành, hay bạn mong muốn môi trường làm việc sau này sẽ như thế nào?`;

    case 4:
      return commonRule + `\n- TRỌNG TÂM VÒNG 4 (Bức tranh đa chiều - Công việc hậu trường & Thời gian ngoài giờ):
  + Thấu cảm góc nhìn của học sinh.
  + Cung cấp dữ liệu thực tế về khối lượng công việc thầm lặng ngoài giờ (chuẩn bị tài liệu, xử lý hồ sơ, trực ca, chạy deadline về đêm).
  + Hỏi đúng 1 câu: Bạn đã từng trải qua công việc nào đòi hỏi sự kiên nhẫn, tỉ mỉ lặp đi lặp lại như vậy chưa, và cảm xúc lúc đó của bạn thế nào?`;

    case 5:
      return commonRule + `\n- TRỌNG TÂM VÒNG 5 (Bức tranh đa chiều - Tương tác con người & Quản lý cảm xúc):
  + Thấu cảm chia sẻ của học sinh (như về gia đình, thời gian, sự sẵn sàng).
  + Cung cấp dữ liệu thực tế về áp lực khi phải giao tiếp với nhiều cá tính khác nhau (khách hàng, học sinh, phụ huynh, đồng nghiệp) và giữ bình tĩnh.
  + Hỏi đúng 1 câu: Khi gặp phải tình huống người khác không hợp tác hoặc có ý kiến trái ngược hoàn toàn với mình, bạn thường làm gì để vừa giữ bình tĩnh vừa thấu hiểu họ?`;

    case 6:
      return commonRule + `\n- TRỌNG TÂM VÒNG 6 (Bức tranh đa chiều - Đổi mới công nghệ & Cạnh tranh chuyên môn):
  + Thấu cảm góc nhìn thực tế của học sinh.
  + Cung cấp dữ liệu về nhịp độ thay đổi của công nghệ số, phương pháp mới và yêu cầu tự học liên tục trong thời đại hiện nay.
  + Hỏi đúng 1 câu: Bạn nghĩ mình sẽ cần chủ động trang bị thêm kỹ năng mềm hay công cụ số nào để không bị bỡ ngỡ trước sự chuyển dịch nhanh chóng đó?`;

    case 7:
      return commonRule + `\n- TRỌNG TÂM VÒNG 7 (Bức tranh đa chiều - Kế hoạch thử nghiệm thực tế):
  + Thấu cảm tinh thần sẵn sàng và thái độ cầu thị của học sinh.
  + Cung cấp dữ liệu về tầm quan trọng của việc kiểm chứng bằng trải nghiệm thật sớm trước khi đặt bút đăng ký nguyện vọng.
  + Hỏi đúng 1 câu: Ngay trong năm học này, bạn có dự định thử sức với một hoạt động thực tế nào (như làm dự án nhỏ, thực hành dạy kèm, hay tham gia câu lạc bộ chuyên môn) để tự mình cảm nhận xem có thực sự hợp không?`;

    case 8:
      return commonRule + `\n- TRỌNG TÂM VÒNG 8 (Kích hoạt tự quyết - Điểm mạnh riêng biệt độc bản):
  + Thấu cảm và đánh giá cao việc học sinh đã thấu hiểu cả hai mặt sáng và tối của nghề nghiệp.
  + Cung cấp góc nhìn rằng mỗi cá nhân đều có một thế mạnh riêng biệt tạo nên sự khác biệt bền vững.
  + Hỏi đúng 1 câu: Nếu gác lại những lời khuyên của người xung quanh hay độ 'hot' của ngành, điểm mạnh hoặc phẩm chất nào của riêng bạn khiến bạn cảm thấy tự tin nhất khi bước vào con đường này?`;

    case 9:
      return commonRule + `\n- TRỌNG TÂM VÒNG 9 (Kích hoạt tự quyết - Giá trị cốt lõi & Ngọn lửa bền bỉ):
  + Thấu cảm và ngợi khen phẩm chất tự thân mà học sinh vừa nêu.
  + Cung cấp góc nhìn về chặng đường dài phía trước, nơi đam mê ban đầu cần được nuôi dưỡng bằng giá trị cốt lõi.
  + Hỏi đúng 1 câu: Giả sử những năm đầu bước vào nghề gặp nhiều bỡ ngỡ hoặc thu nhập chưa như mong muốn, điều gì hay giá trị cốt lõi nào sẽ là điểm tựa giữ bạn kiên định bước tiếp?`;

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
    const targetMaxTokens = isAssessmentRound ? 600 : 350;
    const targetTemperature = isAssessmentRound ? 0.35 : 0.65;

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
              replyText = replyText.replace(/^(Người Đồng Hành Phản Tư|AI Phản tư)[:\s-]*/i, '').trim();
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
