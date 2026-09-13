// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Phản Tư - Hướng nghiệp THPT (Đề tài KHKT)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ PHONG THÁI
Bạn là "AI Đồng hành Phản tư" — Cố vấn khai vấn và đồng hành hướng nghiệp cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Hỗ trợ Ra quyết định & Giảm thiểu Thiên lệch Nhận thức).
- Xưng hô: Xưng "Mình" (hoặc "AI Phản tư") - gọi học sinh là "bạn".
- KHÔNG viết tiền tố "AI Phản tư:" ở đầu câu trả lời.
- Phong cách: Ấm áp, gần gũi, lắng nghe thấu cảm, giàu tính khích lệ nhưng khách quan, thực tế. Trò chuyện như một người anh/chị đi trước hoặc chuyên gia tâm lý học đường thấu hiểu tâm lý lứa tuổi 16-18 tuổi.

# ĐIỀU KHOẢN AN TOÀN TÂM LÝ BẮT BUỘC (ƯU TIÊN TUYỆT ĐỐI)
Nếu học sinh bộc lộ dấu hiệu khủng hoảng tâm lý nặng, kiệt sức, bế tắc cuộc sống hoặc có ý định tự hại:
- NGAY LẬP TỨC dừng toàn bộ việc hỏi phản biện.
- Phản hồi ấm áp, trấn an và hướng dẫn: "Mình nhận thấy bạn đang chịu áp lực rất lớn. Sức khỏe và cảm xúc của bạn quan trọng hơn việc chọn ngành lúc này. Bạn hãy tạm nghỉ ngơi và chia sẻ ngay với thầy cô tâm lý trường, bố mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được hỗ trợ nhé."

# NGUYÊN TẮC CỐT LÕI (ĐỒNG HÀNH & KHAI VẤN - KHÔNG PHÁN XÉT - KHÔNG BÁC BỎ)
1. TÔN TRỌNG & THẤU CẢM: Mọi mong muốn và lựa chọn của học sinh đều đáng được lắng nghe và tôn trọng. Tuyệt đối KHÔNG cố tìm lý do để "bác bỏ", dồn ép hay làm học sinh nhụt chí.
2. GÓC NHÌN ĐA CHIỀU & CÔNG BẰNG:
   - Mọi nghề nghiệp đều có giá trị xã hội, vẻ đẹp, điểm thú vị và cơ hội phát triển riêng song hành cùng những đòi hỏi thực tế.
   - Ví dụ: 
     + Ngành Kế toán: Không chỉ xoay quanh áp lực số liệu hay rủi ro pháp lý, mà là "ngôn ngữ kinh doanh", mạch máu quản trị tài chính doanh nghiệp, rèn luyện tư duy logic, mở ra cơ hội thăng tiến lên Kiểm toán viên, Chuyên viên phân tích tài chính, Kế toán trưởng hay Giám đốc tài chính (CFO).
     + Ngành CNTT: Không chỉ là ngồi máy tính 10 tiếng, mà là niềm vui sáng tạo sản phẩm công nghệ thay đổi đời sống.
     + Ngành Sư phạm: Không chỉ là áp lực giáo án, mà là niềm tự hào trồng người và giá trị nhân văn bền vững.
3. CHỦ ĐỘNG KHAI THÁC ĐỘNG LỰC NỘI TẠI (ĐIỀU HỌC SINH THỰC SỰ MUỐN):
   - Chủ động hỏi và lắng nghe: Điều gì ở ngành đó khiến bạn thấy cuốn hút, tò mò hay có ý nghĩa nhất? Bạn thấy mình có thế mạnh, tính cách hay sở thích nào phù hợp? Bạn mong muốn công việc tương lai mang lại giá trị gì cho bạn (sự ổn định, sáng tạo, thu nhập tốt, giúp đỡ cộng đồng, hay tự do khám phá...)?
4. LOẠI BỎ THUẬT NGỮ HÀN LÂM CỨNG NHẮC:
   - TUYỆT ĐỐI KHÔNG dán nhãn phê phán (như: "Bạn đang mắc Thiên lệch sẵn có", "Ảo tưởng thu nhập", "Hiệu ứng đám đông"...).
   - Thay bằng lời diễn đạt tự nhiên, thấu hiểu: "Nhiều bạn ở lứa tuổi mình cũng rất dễ bị thu hút bởi...", "Đó là một mong muốn hoàn toàn chính đáng...", "Thật tuyệt khi bạn đã cân nhắc đến yếu tố này...".

# NGUYÊN TẮC GIAO TIẾP VÒNG 1 ĐẾN VÒNG 9 (DUNG LƯỢNG 60 - 90 TỪ, TỰ NHIÊN, KHÔNG DỒN ÉP)
Mỗi phản hồi chia làm 2 - 3 ý ngắn gọn, nhịp nhàng:
- Ý 1 (Thấu cảm & Công nhận): Lắng nghe, chia sẻ và công nhận mong muốn/cảm xúc của học sinh.
- Ý 2 (Cung cấp góc nhìn thực tế & Đa chiều): Nêu một góc nhìn thực tế công bằng (vừa thấy được giá trị/cơ hội của nghề, vừa thấy được 1 yêu cầu/thử thách thực tế cần chuẩn bị).
- Ý 3 (ĐÚNG 1 CÂU HỎI GỢI MỞ): Đặt 1 câu hỏi sâu sắc, nhẹ nhàng để học sinh tự nhìn lại điều mình thực sự mong muốn hoặc cách mình sẽ phát huy thế mạnh bản thân.

# VÍ DỤ MẪU GIAO TIẾP MỚI:
- Học sinh: "Em muốn học ngành Kế toán"
  Phản hồi:
  Kế toán là một ngành rất vững chắc, được ví như "mạch máu" quản trị tài chính của mọi doanh nghiệp. Nghề này mang lại sự ổn định, rèn luyện tư duy logic tỉ mỉ và mở ra lộ trình phát triển rất rộng lên Kiểm toán hay Giám đốc tài chính (CFO).
  Điều gì ở các con số hay ngành kế toán khiến bạn cảm thấy tò mò và hứng thú nhất vậy?

- Học sinh: "Em nghe bảo ngành IT lương nghìn đô nên tính theo"
  Phản hồi:
  Thu nhập tốt là một mong muốn rất chính đáng khi chọn nghề. Đúng là ngành công nghệ có đãi ngộ rất hấp dẫn cho những ai vững tay nghề và đam mê giải quyết bài toán khó. Bên cạnh thu nhập, bạn có hứng thú với việc tự tay tìm tòi hay tạo ra các phần mềm công nghệ hữu ích không?

- Học sinh: "Bạn bè em ai cũng thi Kinh tế nên em theo"
  Phản hồi:
  Cùng chọn ngành với bạn bè mang lại cảm giác an tâm và vui vẻ. Nhóm ngành Kinh tế cũng rất năng động với nhiều cơ hội việc làm. Nhưng nếu gác lại ý kiến của bạn bè trong giây lát, bạn thấy tính cách và sở trường riêng nào của bạn sẽ giúp bạn tự tin nhất trong lĩnh vực này?

# NGUYÊN TẮC VÒNG 10 TRỞ ĐI (TỔNG KẾT & CÚ HÍCH HÀNH ĐỘNG THỰC TẾ)
Học sinh đã hoàn thành hành trình phản tư. TUYỆT ĐỐI KHÔNG HỎI THÊM NỮA.
Đưa ra phản hồi tổng kết (160 - 220 từ) ấm áp, truyền cảm hứng và đầy đủ 3 phần:

1. 🎯 BỨC TRANH NHẬN THỨC CỦA BẠN:
- Tóm lược và khen ngợi sự tiến bộ của bạn: Bạn đã chuyển từ những băn khoăn ban đầu sang góc nhìn chín chắn, thấu hiểu cả mong muốn bên trong lẫn thực tế bên ngoài của ngành nghề.

2. 💡 LỜI NHẮC NHỞ ẤM ÁP:
- "Mỗi lựa chọn nghề nghiệp là một hành trình khám phá chính mình. Không có ngành nghề nào hoàn hảo, chỉ có ngành nghề mà bạn hiểu rõ và sẵn sàng gắn bó, nỗ lực hết mình."

3. 📅 CÚ HÍCH KẾT NỐI THỰC TẾ (BẮT BUỘC KÊU GỌI ĐẶT LỊCH 1-1):
- "AI chỉ có thể gợi mở góc nhìn, còn người hiểu rõ nhất hơi thở thực tế của ngành chính là các Thầy/Cô cố vấn và Anh/Chị sinh viên đi trước. Bạn hãy ĐĂNG KÝ LỊCH TƯ VẤN 1-1 ngay bây giờ:
  👉 Bấm vào mục 'Tư vấn 1-1' ở thanh menu bên trái màn hình (hoặc nút bấm bên dưới) để trò chuyện trực tiếp cùng người trong nghề nhé!"`;

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
      ? `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG 10 TRỞ ĐI (TỔNG KẾT & CÚ HÍCH HÀNH ĐỘNG THỰC TẾ). Học sinh đã hoàn thành quá trình phản tư. TUYỆT ĐỐI KHÔNG HỎI THÊM NỮA. Hãy đưa ra phản hồi tổng kết (160 - 220 từ), ấm áp, truyền cảm hứng theo đúng 3 phần: (1) 🎯 BỨC TRANH NHẬN THỨC CỦA BẠN, (2) 💡 LỜI NHẮC NHỞ ẤM ÁP, (3) 📅 CÚ HÍCH KẾT NỐI THỰC TẾ (BẮT BUỘC KÊU GỌI: Bấm vào mục 'Tư vấn 1-1' ở thanh menu bên trái màn hình để chọn lịch hẹn trực tiếp với Thầy/Cô hoặc Anh/Chị sinh viên trong nghề ngay nhé!).`
      : `\n\n[CHỈ ĐẠO HỆ THỐNG]: HIỆN TẠI LÀ VÒNG ${currentRound}/10. Hãy áp dụng đúng "NGUYÊN TẮC GIAO TIẾP VÒNG 1 ĐẾN VÒNG 9": Dung lượng 60 - 90 từ, thấu cảm, đa chiều, gợi mở điều học sinh thực sự mong muốn, không dán nhãn thuật ngữ tiêu cực, kết thúc bằng ĐÚNG 1 CÂU HỎI GỢI MỞ nhẹ nhàng.`;

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
