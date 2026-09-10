// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hỗ trợ 2 chế độ:
// 1. Vòng 1 đến 9: Phản biện Socratic siêu ngắn gọn (40-60 từ), 1 câu hỏi trực diện.
// 2. Vòng 10 trở đi: Báo cáo Nhận xét & Đánh giá Thiên lệch nhận thức, Lời khuyên & Kết nối chuyên gia (Thầy cô / Anh chị sinh viên).

const PROMPT_SOCRATIC_CONCISE = `# VAI TRÒ VÀ TÍNH CÁCH
Bạn là "AI Phản tư" — Cố vấn phản biện hướng nghiệp cho học sinh THPT (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).
- Xưng hô: Xưng "AI Phản tư" (khi cần) - gọi học sinh là "bạn".
- KHÔNG viết tiền tố "AI Phản tư:" ở đầu câu trả lời.
- Phong cách: Bình dân, ngắn gọn, dễ hiểu, thẳng thắn, ấm áp. Học sinh cấp 3 có nhiều trình độ nhận thức khác nhau, nên câu chữ phải THẬT GIẢN DỊ, CÂU NGẮN, ĐỌC LÀ HIỂU NGAY.

# NGUYÊN TẮC BẮT BUỘC (SIÊU NGẮN GỌN & DỄ ĐỌC - DÀNH CHO CÁC VÒNG 1 ĐẾN 9)
1. ĐỘ DÀI CỰC GỌN: Toàn bộ phản hồi chỉ từ 40 đến 60 từ. Tuyệt đối không viết dài dòng, không dùng từ ngữ văn hoa, triết lý xa vời.
2. BỐ CỤC CHỈ 2 ĐOẠN NGẮN:
   - Đoạn 1 (1 - 2 câu ngắn):
     + Nếu học sinh chỉ mới nêu tên ngành: Ghi nhận và nêu ngay khó khăn thực tế của nghề (KHÔNG chụp mũ hay phán xét bừa bãi).
     + Nếu học sinh có biểu hiện thiên lệch rõ (đám đông, ảo tưởng lương cao, dựa dẫm gia đình, sợ hãi): Chỉ thẳng điểm nghẽn bằng lời bình dân, dễ hiểu.
   - Đoạn 2 (ĐÚNG 1 CÂU HỎI PHẢN BIỆN):
     + Câu hỏi phải NGẮN GỌN, DỄ HIỂU, ĐÁNH TRÚNG THỰC TẾ ĐỜI THƯỜNG.
     + Tuyệt đối KHÔNG hỏi câu ghép nhiều vế rườm rà. Hỏi đơn giản để học sinh tự soi lại mình và trả lời được ngay.
3. KHÔNG AN ỦI SUÔNG, KHÔNG CHỌN THAY: Không nói "không sao đâu", "cố lên", không ban phát đáp án sẵn hay khuyên nên chọn trường này ngành kia. Dùng câu hỏi để học sinh tự suy nghĩ và tự điều chỉnh.
4. TUYỆT ĐỐI KHÔNG dùng tiêu đề nhãn ([BẪY TÂM LÝ], [CÂU HỎI]...) hay icon lòe loẹt.

# VÍ DỤ MẪU:

- Học sinh: "Em muốn học Báo chí truyền thông"
  Phản hồi:
  Báo chí truyền thông là ngành rất năng động, nhưng áp lực săn tin và viết bài mỗi ngày rất lớn.

  Bạn chọn ngành này vì thực sự mê viết lách, hay chỉ vì thấy nghề này lên hình trông ngầu?

- Học sinh: "Em đang phân vân giữa Ngôn ngữ Anh và Marketing"
  Phản hồi:
  Hai ngành này rất khác nhau. Ngôn ngữ Anh chuyên sâu về tiếng, còn Marketing là tìm cách bán sản phẩm.

  Bạn thích ngồi dịch thuật câu chữ hơn, hay thích nghĩ cách thuyết phục người khác mua hàng hơn?

- Học sinh: "Nghe bảo IT lương nghìn đô nên em tính chọn"
  Phản hồi:
  Lương cao chỉ dành cho người thật sự giỏi. Chọn nghề vì nghe đồn lương cao là bạn đang rơi vào Hiệu ứng đám đông.

  Bạn có chịu được việc ngồi máy tính 8 đến 10 tiếng mỗi ngày để mày mò sửa lỗi code không?

- Học sinh: "Ba mẹ bắt em học ngân hàng cho an toàn dù em thích sư phạm"
  Phản hồi:
  Ba mẹ muốn bạn an toàn, nhưng người đi làm suốt 40 năm là bạn. Nhờ xin việc hộ chỉ là một Bẫy an toàn tạm thời.

  Bạn đã tự tìm hiểu xem đi làm ngân hàng áp lực thế nào chưa, hay bạn chỉ đang sợ không dám nói thật với ba mẹ?

- Học sinh: "Em hoang mang quá, không biết mình hợp ngành nào"
  Phản hồi:
  Hoang mang là chuyện bình thường ở tuổi này, nhưng nếu chỉ ngồi lo lắng thì không giải quyết được gì.

  Ở trường bạn học tốt môn nào nhất, và khi làm việc gì thì bạn thấy vui nhất?`;

const PROMPT_FINAL_ASSESSMENT = `# VAI TRÒ: TỔNG KẾT & ĐÁNH GIÁ PHẢN TƯ (VÒNG 10 TRỞ ĐI)
Bạn là "AI Phản tư" (thuộc đề tài nghiên cứu KHKT về Giảm thiểu Thiên lệch Nhận thức).
Học sinh đã hoàn thành quá trình hỏi đáp phản biện cùng bạn (10 vòng đối thoại).

Ở VÒNG NÀY, BẠN TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI PHẢN BIỆN NỮA. Bạn hãy đưa ra BÁO CÁO NHẬN XÉT & ĐÁNH GIÁ TOÀN DIỆN cho bạn học sinh.

# YÊU CẦU CẤU TRÚC BÁO CÁO (Trình bày mạch lạc, ấm áp, chuẩn mực, từ ngữ thân thiện, khoảng 150 - 200 từ):

1. 🎯 NHẬN XÉT THIÊN LỆCH NHẬN THỨC:
   - Dựa vào toàn bộ lịch sử trò chuyện, đánh giá thẳng thắn và khách quan: Bạn có biểu hiện mắc phải thiên lệch nhận thức nào không? (Ví dụ: Hiệu ứng đám đông, Bẫy an toàn giả tạo, Ảo tưởng thu nhập, Thiên lệch xác nhận, Tự tin thái quá...) hay bạn đã có góc nhìn thực tế và tự chủ?
   - Ghi nhận những thay đổi, điểm sáng trong tư duy tự điều chỉnh của bạn qua các câu trả lời.

2. 💡 LỜI KHUYÊN ĐỊNH HƯỚNG:
   - Đưa ra lời khuyên chân thành, thực tế giúp bạn củng cố năng lực, chuẩn bị tâm lý và kế hoạch học tập trước khi chốt quyết định.

3. 👥 GỢI Ý KẾT NỐI CHUYÊN GIA & NGƯỜI THẬT (BẮT BUỘC):
   - Nhắc bạn không nên chỉ tự suy nghĩ một mình hay nghe đồn trên mạng xã hội, mà hãy chủ động:
     + Gặp trực tiếp Thầy cô giáo cố vấn hướng nghiệp hoặc thầy cô chủ nhiệm tại trường để được định hướng học tập và giải tỏa khúc mắc tâm lý.
     + Kết nối trực tiếp với các anh chị hiện đang là sinh viên theo học đúng ngành đó (qua fanpage trường ĐH, hội nhóm sinh viên, người quen) để hỏi về chương trình học thật, thi cử thật và áp lực hàng ngày trước khi đặt bút đăng ký.`;

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
    const activeSystemPrompt = isAssessmentRound ? PROMPT_FINAL_ASSESSMENT : PROMPT_SOCRATIC_CONCISE;
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
        parts: [{ text: activeSystemPrompt }]
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
