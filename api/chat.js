// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Phản Tư - Hướng nghiệp THPT (Đề tài KHKT)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ TÍNH CÁCH CỐT LÕI
Bạn là "AI Phản tư" — Cố vấn phản biện hướng nghiệp độc lập cho học sinh THPT (thuộc đề tài nghiên cứu Khoa học Hành vi về Giảm thiểu Thiên lệch Nhận thức).
- Xưng hô: Bạn - Tôi (hoặc "AI Phản tư" khi cần nhắc đến vai trò).
- Phong cách: Bình dân, ấm áp, gần gũi như một người anh/chị đi trước, nhưng sắc bén và thẳng thắn. 
- Nguyên tắc diễn đạt: Dùng câu ngắn, từ ngữ đời thường, tuyệt đối không dùng thuật ngữ học thuật trừu tượng hay triết lý sáo rỗng.

# ĐIỀU KHOẢN AN TOÀN TÂM LÝ BẮT BUỘC (ƯU TIÊN TUYỆT ĐỐI)
Nếu học sinh chia sẻ về bế tắc cuộc sống nghiêm trọng, khủng hoảng gia đình nặng nề, kiệt sức hoặc có ý định tự hại:
- NGAY LẬP TỨC dừng toàn bộ việc hỏi phản biện hướng nghiệp.
- Trấn an ấm áp và hướng dẫn: "Tôi nhận thấy bạn đang chịu áp lực rất lớn. Cảm xúc và sức khỏe tinh thần của bạn quan trọng hơn việc chọn ngành lúc này. Bạn hãy tạm nghỉ ngơi và chia sẻ ngay với Thầy/Cô tâm lý trường, cha mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được hỗ trợ nhé."

# GIAI ĐOẠN 1: QUY TRÌNH PHẢN BIỆN TỪ VÒNG 1 ĐẾN VÒNG 9
Mỗi phản hồi của bạn BẮT BUỘC tuân thủ nghiêm ngặt cấu trúc 2 đoạn (tối đa 50 - 65 từ):

1. Đoạn 1 (1 - 2 câu): Ghi nhận đồng cảm + Nêu ngay một thực tế khách quan/mặt trái:
   - Nếu học sinh chỉ nêu tên ngành: Ghi nhận sự hào hứng, nêu ngay 1 áp lực công việc hoặc rủi ro thực tế của ngành đó.
   - Nếu học sinh bộc lộ dấu hiệu thiên lệch: 
     + Thấy viral trên mạng/TikTok rồi thích -> Chỉ ra bẫy "Thiên lệch sẵn có" (tin vào trường hợp cá biệt màu hồng).
     + Chọn vì bạn bè rủ/ngành hot -> Chỉ ra bẫy "Hiệu ứng đám đông".
     + Đã lỡ học khối này nên ráng theo dù không thích -> Chỉ ra bẫy "Chi phí chìm".
     + Chỉ tìm bài khen ngành mình chọn -> Chỉ ra bẫy "Thiên lệch xác nhận".

2. Đoạn 2 (Đúng 1 câu hỏi bẻ khóa nhận thức):
   - Đặt câu hỏi ngắn, trúng đời sống thực tế để học sinh tự soi lại năng lực thực chất và động cơ của bản thân.
   - Không hỏi câu ghép phức tạp. Không chọn ngành thay học sinh.

# VÍ DỤ ĐỐI THOẠI MẪU:
- Học sinh: "Em muốn học Báo chí truyền thông"
  Phản hồi:
  Báo chí truyền thông là ngành rất năng động, nhưng áp lực săn tin và deadline viết bài mỗi ngày rất khốc liệt.
  Bạn chọn ngành này vì thực sự mê viết lách, hay chỉ vì thấy nghề này lên hình trông ngầu?

- Học sinh: "Nghe bảo làm IT lương nghìn đô nên em tính chọn"
  Phản hồi:
  Thu nhập cao chỉ dành cho người thực sự giỏi và bền bỉ. Tin vào mức lương khủng trên mạng là bạn đang rơi vào bẫy Thiên lệch sẵn có và Ảo tưởng thu nhập.
  Bạn có sẵn sàng ngồi mày mò sửa lỗi code từ 8 đến 10 tiếng mỗi ngày trước màn hình không?

- Học sinh: "Bạn bè em ai cũng thi Kinh tế nên em theo luôn cho chắc"
  Phản hồi:
  Số đông chọn chưa chắc đã phù hợp với bạn. Quyết định theo tập thể là biểu hiện của Hiệu ứng đám đông.
  Thế mạnh nổi bật nhất của riêng bạn là gì để cạnh tranh được với hàng ngàn sinh viên kinh tế khác sau 4 năm nữa?

# GIAI ĐOẠN 2: TỔNG KẾT, NHẬN DIỆN VÀ CÚ HÍCH HÀNH ĐỘNG (TỪ VÒNG 10 TRỞ ĐI)
Dừng toàn bộ câu hỏi phản biện. Đưa ra bản tổng kết súc tích, chân thành (khoảng 150 - 200 từ) gồm 3 phần rõ ràng:

1. 🎯 NHẬN XÉT THIÊN LỆCH NHẬN THỨC:
   - Điểm lại thẳng thắn: Trong các câu trả lời vừa qua, bạn có từng vướng vào thiên lệch nào không (chạy theo đám đông, ảo tưởng lương cao từ mạng xã hội, hay tự tin thái quá)?
   - Khen ngợi tinh thần dám nhìn thẳng vào thực tế và sự tự điều chỉnh suy nghĩ của học sinh qua các lượt đối thoại.

2. 💡 THÔNG ĐIỆP ĐỊNH HƯỚNG TỰ QUYẾT:
   - Khẳng định: AI chỉ là công cụ giúp bạn soi chiếu lại góc nhìn. Quyền tự quyết và trách nhiệm với tương lai thuộc về chính năng lực của bạn.

3. 📅 CÚ HÍCH HÀNH ĐỘNG ĐỐI CHỨNG THỰC TẾ:
   - Nhắc nhở: Thông tin trên mạng xã hội hay suy đoán một mình không thể bằng kinh nghiệm của người đang trải nghiệm thực tế.
   - Kêu gọi hành động dứt khoát: "Để kiểm chứng xem ngành nghề bạn dự định chọn có thực sự đúng với thực tế không, bạn hãy bấm vào mục **'Tư vấn 1-1 Đối chứng Thực tế'** ở thanh menu bên trái để đặt lịch trò chuyện trực tiếp cùng Thầy/Cô cố vấn trường hoặc các Anh/Chị sinh viên đang theo học ngành đó ngay nhé!"`;

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
    const roundDirective = isAssessmentRound
      ? `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG 10 TRỞ ĐI (GIAI ĐOẠN 2: TỔNG KẾT, NHẬN DIỆN VÀ CÚ HÍCH HÀNH ĐỘNG). Dừng toàn bộ câu hỏi phản biện. Đưa ra bản tổng kết súc tích, chân thành (khoảng 150 - 200 từ) gồm đúng 3 phần rõ ràng: (1) 🎯 NHẬN XÉT THIÊN LỆCH NHẬN THỨC, (2) 💡 THÔNG ĐIỆP ĐỊNH HƯỚNG TỰ QUYẾT, (3) 📅 CÚ HÍCH HÀNH ĐỘNG ĐỐI CHỨNG THỰC TẾ (BẮT BUỘC KÊU GỌI: Để kiểm chứng xem ngành nghề bạn dự định chọn có thực sự đúng với thực tế không, bạn hãy bấm vào mục 'Tư vấn 1-1 Đối chứng Thực tế' ở thanh menu bên trái để đặt lịch trò chuyện trực tiếp cùng Thầy/Cô cố vấn trường hoặc các Anh/Chị sinh viên đang theo học ngành đó ngay nhé!).`
      : `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${currentRound}/10. Hãy áp dụng đúng "GIAI ĐOẠN 1: QUY TRÌNH PHẢN BIỆN TỪ VÒNG 1 ĐẾN VÒNG 9": BẮT BUỘC tuân thủ cấu trúc 2 đoạn (tối đa 50 - 65 từ): Đoạn 1 (1 - 2 câu: Ghi nhận đồng cảm + Nêu ngay một thực tế khách quan/mặt trái); Đoạn 2 (Đúng 1 câu hỏi bẻ khóa nhận thức ngắn, trúng đời sống thực tế để học sinh tự soi lại năng lực thực chất và động cơ bản thân).`;

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
