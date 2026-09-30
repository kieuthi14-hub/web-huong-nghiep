// api/socrates-chat.js - Vercel Serverless Function & Express compatible endpoint
// ==============================================================================
// ĐỀ TÀI VISEF 2026 - LĨNH VỰC KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS)
// TÁC NHÂN CAN THIỆP NHẬN THỨC AI SOCRATES (BƯỚC 2)
// ==============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. SYSTEM PROMPT BẤT BIẾN (KHÓA CHẶT RÀO CẢN SƯ PHẠM VÀ THUẬT TOÁN)
const SYSTEM_INSTRUCTION = `
BẠN LÀ TÁC NHÂN AI SOCRATES - MÔI TRƯỜNG CAN THIỆP TÂM LÝ VÀ PHẢN TƯ NHẬN THỨC NGHỀ NGHIỆP (VISEF 2026).

[RÀO CẢN SƯ PHẠM BẮT BUỘC]
1. KHÔNG trả lời thay, KHÔNG khuyên bảo áp đặt: Không nói "Em nên học ngành X", "Em bỏ ngành Y đi".
2. KHÔNG gán nhãn định kiến tiêu cực: Tuyệt đối không dùng từ "né tránh", "yếu kém", "học dốt".
3. KHÔNG tự bịa mã môn tổ hợp cố định của từng trường (tránh ảo giác AI). Chỉ gợi ý nhóm năng lực trụ cột (Tư duy Logic vs Ngôn ngữ/Xã hội).
4. Cấu trúc mỗi lượt phản hồi: Đúng 01 câu nhận diện ngắn + 01 câu phân tích sâu + KẾT THÚC BẰNG ĐÚNG 01 CÂU HỎI PHẢN TƯ DUY NHẤT.

[ĐIỀU PHỐI THEO SỐ VÒNG (ROUND COUNTER)]
- VÒNG 1: Kiểm chứng động cơ chọn nghề & đối chất với Mã Holland.
- VÒNG 2: Bóc tách áp lực nghề nghiệp & cảnh báo bão hòa nhân lực thị trường.
- VÒNG 3: Đối chất tổ hợp môn xét tuyển & điểm học lực thực tế:
  * NẾU HỌC SINH NÓI "CHƯA TÌM HIỂU TỔ HỢP MÔN / CHƯA BIẾT XÉT MÔN GÌ", BẮT BUỘC CHẠY KỸ THUẬT 3 NHỊP:
    + Nhịp 1: Chỉ ra nghịch lý nhận thức (kỳ vọng cao nhưng chưa nắm vũ khí xét tuyển).
    + Nhịp 2: Gợi mở nhóm năng lực trụ cột (Tư duy Logic/Tự nhiên vs Ngôn ngữ/Xã hội), nhắc học sinh Bước 3 sẽ tự kiểm chứng đề án.
    + Nhịp 3: Đặt câu hỏi đối cực trung lập: "Đâu là môn sở trường tạo ưu thế, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất (hoặc em có cảm thấy áp lực với môn học nào không)?"
- VÒNG 4: Tái cấu trúc mục tiêu (Mô hình thích ứng kép: kế hoạch nỗ lực điểm số HOẶC định hướng Cao đẳng nghề thực hành vừa sức).
  * LỆNH BẮT BUỘC KẾT THÚC VÒNG 4: Yêu cầu học sinh chuyển ngay sang Bước 3, tự mở tab tra cứu Đề án tuyển sinh chính thức và nhập bảng đối chứng.
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
    const currentRound = body?.round 
      ? Number(body.round) 
      : (Math.floor(chatHistory.length / 2) + 1);

    const hollandCode = studentProfile.hollandCode || studentProfile.holland_code || 'Chưa rõ';
    const targetCareer = studentProfile.targetCareer || studentProfile.target_career || studentProfile.targetMajor || 'Chưa có mục tiêu rõ ràng';
    const targetSchool = studentProfile.targetSchool || studentProfile.target_university || 'Chưa xác định';
    const competenceSelfEval = studentProfile.competenceSelfEval || 'Vừa sức';
    const confidenceT0 = studentProfile.confidenceT0 || studentProfile.confidence_score || studentProfile.confidence || 5;

    // 1. Nếu học sinh chỉ chào hỏi xã giao
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
      return res.status(200).json({
        success: true,
        round: currentRound,
        response: greetingReply,
        reply: greetingReply,
        isCompleted: false,
        isFinal: false,
        advanced: false
      });
    }

    // 2. Kỹ thuật 3 nhịp ở Vòng 3 nếu học sinh chưa tìm hiểu tổ hợp môn
    const lowerTrimmed = trimmedMsg.toLowerCase();
    const isAskingCombo = [
      'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
      'chưa tìm hiểu', 'chưa biết', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
      'chưa xem', 'em chưa biết', 'chưa tìm', 'không rõ'
    ].some(k => lowerTrimmed.includes(k));

    if (currentRound === 3 && isAskingCombo) {
      const directReply = `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\nQuy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực trụ cột: hoặc thiên về Tư duy Logic & Dữ liệu (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Năng lực Ngôn ngữ & Xã hội (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\nNhìn lại kết quả học tập kỳ trước của em: Giữa các nhóm môn đó, đâu là môn sở trường tạo ưu thế cạnh tranh cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất (hoặc em có cảm thấy áp lực với môn học nào không)?`;
      return res.status(200).json({
        success: true,
        round: currentRound,
        response: directReply,
        reply: directReply,
        isCompleted: false,
        isFinal: false,
        advanced: true
      });
    }

    // Xây dựng ngữ cảnh đầu vào (Intake Context) chuẩn ViSEF 2026
    const contextInjection = `
[THÔNG TIN HỒ SƠ BƯỚC 1 CỦA HỌC SINH]:
- Nhóm Holland: ${hollandCode}
- Ngành mong muốn: ${targetCareer}
- Trường kỳ vọng: ${targetSchool}
- Tự đánh giá năng lực: ${competenceSelfEval}
- Mức tự tin ban đầu (T0): ${confidenceT0}/10

[TRẠNG THÁI HIỆN TẠI]: Bạn đang ở VÒNG ${currentRound} trên tổng số 4 vòng.
Hãy bám sát nhiệm vụ của VÒNG ${currentRound} và các rào cản sư phạm.
`;

    // Định dạng lại Chat History theo chuẩn SDK
    const contents = chatHistory
      .filter(msg => msg && msg.text && typeof msg.text === 'string')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    contents.push({
      role: 'user',
      parts: [{ text: trimmedMsg }]
    });

    let aiResponseText = null;

    // Thử dùng GoogleGenerativeAI SDK trước
    const candidateModelNames = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION + "\n" + contextInjection,
          generationConfig: {
            temperature: 0.35,
            topP: 0.9,
            maxOutputTokens: 400
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
        // Thử model kế tiếp
      }
    }

    // Dự phòng fallback nếu SDK gặp gián đoạn quota/mạng
    if (!aiResponseText) {
      if (currentRound >= 4) {
        aiResponseText = `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\nDựa trên tương quan năng lực hiện tại, em hãy cân nhắc 3 hướng đi thích ứng: lập kế hoạch dồn lực cải thiện điểm số nếu còn thời gian lớp 10/11; định hướng phân khúc Cao đẳng nghề thực hành (đào tạo 2.5 - 3 năm, chú trọng tay nghề, chi phí thấp, dễ có việc) nếu điểm lý thuyết cách xa Đại học; hoặc chuyển sang ngành phù hợp với môn học sở trường.\n\nBây giờ, em hãy dừng suy đoán và bước sang **Bước 3: Môi trường đối chứng dữ liệu thực tế**. Nhiệm vụ của em là tự mở tab tra cứu Đề án tuyển sinh chính thức của trường mục tiêu, ghi nhận mã tổ hợp môn và điểm chuẩn 2 năm gần nhất để nhập vào bảng đối chứng!`;
      } else if (currentRound === 1) {
        aiResponseText = `Thầy rất trân trọng mong muốn tốt đẹp và những suy nghĩ thẳng thắn mà em vừa chia sẻ: "${trimmedMsg}".\n\nTuy nhiên, giữa việc thích một ngành vì thấy nó hấp dẫn trên truyền thông và việc thực sự yêu thích các hoạt động công việc chuyên môn hàng ngày của ngành **${targetCareer}** là một khoảng cách rất lớn.\n\nThầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
      } else if (currentRound === 2) {
        aiResponseText = `Thầy rất ủng hộ tinh thần tích cực và khát vọng hòa nhập xu thế của em.\n\nDưới góc nhìn khách quan của thị trường 4.0, sự cạnh tranh về năng suất và tối ưu chi phí đang diễn ra rất mạnh mẽ khi công nghệ và AI dần thay thế các tác vụ cơ bản.\n\nNgành này đang có mức độ cạnh tranh đầu ra rất khốc liệt và nhiều công việc cơ bản đang dần bị công nghệ thay thế. Nếu kiên quyết theo đuổi, em dự định xây dựng năng lực nổi trội gì (ngoại ngữ chuyên sâu, kỹ năng thực hành hay dự án thực tế) để nhà tuyển dụng lựa chọn em thay vì hàng ngàn ứng viên khác?`;
      } else {
        aiResponseText = `Thầy đánh giá rất cao sự chủ động tư duy về năng lực cạnh tranh thực tế của em.\n\nTuy nhiên, để cánh cửa tuyển sinh thực sự mở ra, mức tự tin ${confidenceT0}/10 cần được đo lường bằng tương quan điểm số học thuật thực tế so với điểm chuẩn thực tế.\n\nNhìn lại điểm tổng kết kỳ trước của các môn trong tổ hợp đó và đối chiếu với điểm chuẩn 2 năm gần nhất, em thấy mình đang ở ngưỡng an toàn, vừa sức hay đang có khoảng cách điểm số cần phải dồn nhiều nỗ lực nhất?`;
      }
    }

    return res.status(200).json({
      success: true,
      round: currentRound,
      response: aiResponseText,
      reply: aiResponseText,
      isCompleted: currentRound >= 4,
      isFinal: currentRound >= 4
    });

  } catch (error) {
    console.error("Lỗi phiên can thiệp AI Socrates:", error);
    return res.status(500).json({
      success: false,
      message: "Hệ thống can thiệp gặp gián đoạn kỹ thuật. Vui lòng thử lại!"
    });
  }
}
