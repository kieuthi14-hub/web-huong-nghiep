// api/chat.js - Vercel Serverless Function kết nối Gemini API
// ==============================================================================
// ĐỀ TÀI VISEF 2026 - LĨNH VỰC KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS)
// TÁC NHÂN SOCRATES PHẢN TƯ THÍCH ỨNG THEO TIẾN TRÌNH THỰC
// ==============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. SYSTEM PROMPT BẤT BIẾN (KHÓA CHẶT RÀO CẢN SƯ PHẠM VÀ THUẬT TOÁN)
const SYSTEM_INSTRUCTION = `
BẠN LÀ NHÀ CAN THIỆP TÂM LÝ SOCRATES TRONG ĐỀ TÀI NGHIÊN CỨU HÀNH VI (VISEF 2026).
Nhiệm vụ: Dẫn dắt học sinh tự nhận thức mục tiêu học tập thông qua đối thoại phản tư 4 vòng.

[RÀO CẢN HÀNH VI BẮT BUỘC]
1. LẮNG NGHE THỰC SỰ: Luôn hồi đáp trực tiếp vào câu nói gần nhất của học sinh. Nếu học sinh thắc mắc (ví dụ "Sao thầy hỏi lại?"), phải nhẹ nhàng giải thích trước khi đi tiếp. Tuyệt đối KHÔNG BAO GIỜ lặp lại nguyên văn câu hỏi đã hỏi ở lượt trước!
2. KHÔNG DÙNG VĂN MẪU RẬP KHUÔN: Không áp dụng máy móc luận điểm "tối ưu chi phí doanh nghiệp" cho những ngành đặc thù như Sư phạm, Y khoa, Nghệ thuật. Phải gắn câu hỏi với bản chất nghề thực tế (Ví dụ: Sư phạm thì gắn với áp lực quản lý lớp học, đổi mới giáo dục, tâm lý học sinh).
3. ĐIỀU PHỐI VÒNG 3 (TỔ HỢP MÔN & HỌC LỰC):
   - ĐẦU TIÊN PHẢI HỎI: "Để thi/xét tuyển vào ngành [Ngành mục tiêu], em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?"
   - NẾU HỌC SINH NÓI "CHƯA TÌM HIỂU / CHƯA BIẾT": BẮT BUỘC KÍCH HOẠT QUY TRÌNH 3 NHỊP:
     + Nhịp 1: Nêu nghịch lý (kỳ vọng cao nhưng chưa nắm công cụ xét tuyển).
     + Nhịp 2: Gợi ý nhóm năng lực đặc thù (Khoa học Tự nhiên vs Khoa học Xã hội/Ngôn ngữ), nhắc học sinh sẽ tự kiểm chứng ở Bước 3.
     + Nhịp 3: Hỏi trung lập: "Nhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?"
4. KẾT THÚC VÒNG 4: Sau khi phân tích xong 3 hướng đi thích ứng (Nỗ lực bứt phá điểm / Hệ Cao đẳng nghề thực hành / Chọn ngành theo sở trường), PHẢI RA LỆNH RÕ RÀNG: Yêu cầu học sinh bấm chuyển sang Bước 3 để tự tra cứu Đề án tuyển sinh thực tế.
`;

const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
const fallbackKey = typeof Buffer !== 'undefined'
  ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
  : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
const genAI = new GoogleGenerativeAI(apiKey);

function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const greetings = [
    'chào thầy', 'chao thay', 'chào bạn', 'chao ban', 'xin chào', 'xin chao',
    'chào ai', 'hello', 'hi', 'alo', 'chào', 'chao', 'em chào thầy', 'em chao thay',
    'dạ chào thầy', 'da chao thay', 'dạ', 'da', 'dạ thầy', 'da thay', 'vâng', 'vang',
    'dạ em chào thầy', 'thầy ơi', 'thay oi', 'dạ vâng', 'da vang', 'vâng ạ', 'vang a'
  ];
  return greetings.includes(clean);
}

function isAskingWhyRepeat(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return lower.includes('hỏi lại') || lower.includes('hoi lai') || 
         lower.includes('hỏi gì kì') || lower.includes('hỏi gì kỳ') ||
         lower.includes('trùng câu hỏi') || lower.includes('vừa hỏi xong') ||
         lower.includes('sao hỏi lại');
}

export default async function handler(req, res) {
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
      try { body = JSON.parse(body); } catch (e) {}
    }

    const studentProfile = body?.studentProfile || body?.anchor || {};
    const chatHistory = body?.chatHistory || body?.history || [];
    const userMessage = body?.userMessage || body?.message || '';

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    const trimmedMsg = userMessage.trim();

    // Đếm số lượt tương tác thực tế từ học sinh
    const studentTurns = body?.round 
      ? Number(body.round) 
      : (chatHistory.filter(m => m.role === 'user').length + 1);

    const hollandCode = studentProfile.hollandCode || studentProfile.holland_code || 'Chưa rõ';
    const targetCareer = studentProfile.targetCareer || studentProfile.target_career || studentProfile.targetMajor || 'Chưa rõ';
    const targetSchool = studentProfile.targetSchool || studentProfile.target_university || 'Chưa rõ';
    const competenceSelfEval = studentProfile.competenceSelfEval || 'Vừa sức';
    const confidenceT0 = studentProfile.confidenceT0 || studentProfile.confidence_score || studentProfile.confidence || 5;

    // 1. Nếu học sinh thắc mắc "Sao thầy hỏi lại?"
    if (isAskingWhyRepeat(trimmedMsg)) {
      const explainReply = `Thầy hiểu cảm xúc băn khoăn của em. Thầy hỏi lại không phải để làm khó hay kiểm tra trí nhớ của em, mà muốn hai thầy trò cùng soi chiếu vấn đề từ một góc nhìn sâu sắc hơn, giúp em nhận diện rõ động lực thực sự của mình trước khi ra quyết định quan trọng.\n\nĐối với ngành **${targetCareer}**, điều gì trong công việc hàng ngày thực sự tạo cho em cảm hứng lâu dài nhất?`;
      return res.status(200).json({
        success: true,
        round: Math.min(studentTurns, 4),
        response: explainReply,
        reply: explainReply,
        isCompleted: false,
        advanced: false
      });
    }

    // 2. Nếu học sinh chỉ chào hỏi xã giao
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
      return res.status(200).json({
        success: true,
        round: Math.min(studentTurns, 4),
        response: greetingReply,
        reply: greetingReply,
        isCompleted: false,
        advanced: false
      });
    }

    // 3. Kỹ thuật 3 nhịp ở Vòng 3 nếu học sinh nói "chưa tìm hiểu / chưa biết tổ hợp môn"
    const lowerTrimmed = trimmedMsg.toLowerCase();
    const isAskingCombo = [
      'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
      'chưa tìm hiểu', 'chưa biết', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
      'chưa xem', 'em chưa biết', 'chưa tìm', 'không rõ'
    ].some(k => lowerTrimmed.includes(k));

    if (studentTurns === 3 && isAskingCombo) {
      const directReply = `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\nQuy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực đặc thù: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\nNhìn lại việc học, đâu là môn sở trường của em và môn nào em cảm thấy còn khoảng cách năng lực cần nhiều nỗ lực nhất?`;
      return res.status(200).json({
        success: true,
        round: 3,
        response: directReply,
        reply: directReply,
        isCompleted: false,
        advanced: true
      });
    }

    const dynamicPrompt = `
[DỮ LIỆU HỌC SINH TỪ BƯỚC 1]:
- Ngành mong muốn: ${targetCareer}
- Trường mục tiêu: ${targetSchool}
- Nhóm Holland: ${hollandCode}
- Tự đánh giá năng lực: ${competenceSelfEval}
- Điểm tự tin ban đầu (T0): ${confidenceT0}/10

[MỤC TIÊU VÒNG HIỆN TẠI - LƯỢT HỌC SINH THỨ ${studentTurns}]:
${studentTurns === 1 ? `- VÒNG 1: Khai thác động cơ nội sinh vs ngoại sinh (Tại sao thích ngành ${targetCareer}?). Đối chất với mã Holland ${hollandCode}.` : ""}
${studentTurns === 2 ? `- VÒNG 2: Đưa ra thách thức thực tế của ngành nghề ${targetCareer} (không dùng văn mẫu chung chung; nếu là Sư phạm thì gắn với áp lực quản lý lớp học/tâm lý học sinh/thi viên chức; nếu là Y tế gắn với trách nhiệm sinh mạng/trực đêm; nếu là Kỹ thuật/CNTT gắn với tự động hóa/tư duy giải thuật).` : ""}
${studentTurns === 3 ? `- VÒNG 3: Hỏi về tổ hợp môn xét tuyển: "Để thi/xét tuyển vào ngành ${targetCareer}, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?". Nếu học sinh nói chưa biết/chưa tìm hiểu, BẮT BUỘC kích hoạt ngay Kỹ thuật 3 Nhịp.` : ""}
${studentTurns >= 4 ? `- VÒNG 4: Tái cấu trúc mục tiêu (3 hướng: nỗ lực bứt phá điểm / Cao đẳng nghề thực hành 2.5-3 năm / đổi ngành theo sở trường) và KẾT THÚC BẰNG MỆNH LỆNH RÕ RÀNG: Yêu cầu học sinh bấm chuyển sang Bước 3 để tự tra cứu Đề án tuyển sinh thực tế.` : ""}

Hãy trả lời học sinh một cách tự nhiên, thấu cảm, sâu sắc và kết thúc bằng đúng 01 câu hỏi phản tư (riêng Vòng 4 kết thúc bằng mệnh lệnh chuyển sang Bước 3, tuyệt đối không hỏi thêm).
`;

    const contents = chatHistory
      .filter(msg => msg && msg.text && typeof msg.text === 'string')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    contents.push({ role: 'user', parts: [{ text: trimmedMsg }] });

    let aiResponseText = null;

    const candidateModelNames = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION + "\n" + dynamicPrompt,
          generationConfig: {
            temperature: 0.3,
            topP: 0.85,
            maxOutputTokens: 350
          }
        });

        const result = await model.generateContent({ contents });
        const resText = result?.response?.text();
        if (resText && resText.trim().length >= 25) {
          aiResponseText = resText.trim()
            .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
            .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ).*?\]\s*/i, '')
            .replace(/^#+.*?(CHỈ ĐẠO|CHỈ THỊ).*?\n/i, '')
            .trim();
          break;
        }
      } catch (err) {
        // Thử model tiếp theo
      }
    }

    if (!aiResponseText) {
      if (studentTurns >= 4) {
        aiResponseText = `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\nDựa trên tương quan năng lực hiện tại, em hãy cân nhắc 3 hướng đi thích ứng: nỗ lực bứt phá điểm số các môn trong tổ hợp nếu còn thời gian lớp 10/11; định hướng phân khúc Cao đẳng nghề thực hành (đào tạo 2.5 - 3 năm, chú trọng tay nghề, chi phí thấp, dễ có việc) nếu điểm lý thuyết cách xa Đại học; hoặc chọn ngành phù hợp với môn học sở trường.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự mở tab tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
      } else if (studentTurns === 1) {
        aiResponseText = `Thầy rất trân trọng mong muốn tốt đẹp và những suy nghĩ thẳng thắn mà em vừa chia sẻ: "${trimmedMsg}".\n\nTuy nhiên, giữa việc thích một ngành vì thấy nó hấp dẫn trên truyền thông và việc thực sự yêu thích các hoạt động công việc chuyên môn hàng ngày của ngành **${targetCareer}** là một khoảng cách rất lớn.\n\nThầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
      } else if (studentTurns === 2) {
        aiResponseText = `Thầy rất ủng hộ tinh thần tích cực và khát vọng hòa nhập xu thế của em.\n\nDưới góc nhìn khách quan của thị trường nghề nghiệp thực tế, áp lực rèn luyện chuyên môn và yêu cầu đào tạo của ngành **${targetCareer}** khắt khe hơn rất nhiều so với hình dung ban đầu.\n\nĐể thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?`;
      } else {
        aiResponseText = `Để thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?`;
      }
    }

    return res.status(200).json({
      success: true,
      round: Math.min(studentTurns, 4),
      response: aiResponseText,
      reply: aiResponseText,
      isCompleted: studentTurns >= 4
    });

  } catch (error) {
    console.error("Lỗi API /api/chat:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống!"
    });
  }
}
