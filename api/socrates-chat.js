// api/socrates-chat.js - Vercel Serverless Function & Express compatible endpoint
// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// MÔ HÌNH NHẬN THỨC LINH HOẠT & TIẾN TRÌNH 4 VÒNG SƯ PHẠM BẤT BIẾN
// ==============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
const fallbackKey = typeof Buffer !== 'undefined'
  ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
  : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
const genAI = new GoogleGenerativeAI(apiKey);

function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim()
    .replace(/[!.,?~^_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (clean.length === 0 || clean.length > 40) return false;

  const careerKeywords = [
    'thích', 'thich', 'mẹ', 'me', 'bố', 'ba', 'chọn', 'chon', 'vì', 'vi', 'do',
    'đam mê', 'dam me', 'toán', 'toan', 'văn', 'van', 'sư phạm', 'su pham',
    'nghề', 'nghe', 'ngành', 'nganh', 'học', 'hoc', 'truyền đạt', 'đứng lớp', 'bắt chước',
    'định hình', 'tổ hợp', 'môn', 'tiền', 'lương', 'dạy thêm', 'sợ', 'dốt', 'kém', 'đều'
  ];
  if (careerKeywords.some(w => clean.includes(w))) return false;

  const greetingPatterns = [
    /^(chào|chao|xin chào|xin chao|hello|hi|alo)(\s+(thầy|thay|cô|co|bạn|ban|ai|bot))?(\s+ạ|\s+a)?$/i,
    /^(em|dạ|da|con)\s+(chào|chao|xin chào|xin chao)(\s+(thầy|thay|cô|co))?(\s+ạ|\s+a)?$/i,
    /^(dạ|da|vâng|vang|dạ vâng|da vang)(\s+thầy|\s+thay|\s+cô|\s+co)?(\s+ạ|\s+a)?$/i,
    /^(thầy ơi|thay oi|cô ơi|co oi|thầy à|thay a)(\s+ạ|\s+a)?$/i,
    /^(chào|chao|hello|hi|alo)$/i
  ];
  return greetingPatterns.some(p => p.test(clean));
}

function isTechnicalConfusion(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim()
    .replace(/[!.,?~^_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (clean.length === 0 || clean.length > 50) return false;

  const confusionPatterns = [
    /^(là sao|la sao|sao vậy|sao the|sao thế|ý thầy là sao|y thay la sao|sao ạ|sao a)(\s+thầy|\s+thay|\s+cô|\s+co)?$/i,
    /^(em chưa hiểu|em chua hieu|chưa hiểu|chua hieu|không hiểu|khong hieu)(\s+thầy|\s+thay|\s+cô|\s+co|\s+ạ|\s+a)?$/i,
    /^(thầy nói gì|thay noi gi|thầy nói thế là sao|thay noi the la sao)(\s+ạ|\s+a)?$/i,
    /^(thầy hỏi lại là sao|sao thầy lại hỏi lại|sao hỏi lại|hỏi lại là sao)(\s+ạ|\s+a)?$/i
  ];
  return confusionPatterns.some(p => p.test(clean));
}

function isCompleteSentence(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 35) return false;
  const terminalPunctuation = /[.!?…"'\)\]*]$/;
  return terminalPunctuation.test(trimmed);
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

    const { studentProfile, chatHistory, userMessage } = body || {};

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    // 1. Kiểm tra an toàn: Lịch sử trò chuyện phải là một mảng
    const validHistory = Array.isArray(chatHistory) ? chatHistory : (Array.isArray(body?.history) ? body.history : []);

    const trimmedMsg = userMessage.trim();
    const lowerTrimmed = trimmedMsg.toLowerCase();

    // 2. PHẢN XẠ NHANH: Nếu học sinh chỉ chào hỏi xã giao (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em, thầy trò mình cùng bắt đầu nhé! Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại.`;
      return res.status(200).json({
        success: true,
        round: body?.round && Number(body.round) > 0 ? Number(body.round) : 1,
        response: greetingReply,
        reply: greetingReply,
        isCompleted: false
      });
    }

    // 2b. PHẢN XẠ NHANH: Nếu học sinh thắc mắc kỹ thuật / chưa hiểu câu hỏi (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isTechnicalConfusion(trimmedMsg)) {
      const clarifyReply = `Thầy hỏi để giúp em tự soi chiếu động lực và năng lực thực tế của mình trước khi ra quyết định quan trọng. Em hãy chia sẻ rõ hơn suy nghĩ của mình về câu hỏi của thầy ở trên nhé!`;
      return res.status(200).json({
        success: true,
        round: body?.round && Number(body.round) > 0 ? Number(body.round) : 1,
        response: clarifyReply,
        reply: clarifyReply,
        isCompleted: false
      });
    }

    // 3. Tính số lượt tương tác thực sự của học sinh (LOẠI BỎ TẤT CẢ LƯỢT CHÀO HỎI & LỖI KỸ THUẬT)
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text) && !isTechnicalConfusion(m.text));
    const studentTurns = body?.round && Number(body.round) > 0 
      ? Number(body.round) 
      : (substantiveUserMsgs.length + 1);

    const targetCareer = studentProfile?.targetCareer || studentProfile?.target_career || studentProfile?.targetMajor || "Sư phạm";
    const targetSchool = studentProfile?.targetSchool || studentProfile?.target_university || "ĐH Quy Nhơn";
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || "AEI";
    const confidenceT0 = studentProfile?.confidenceT0 || studentProfile?.confidence_score || studentProfile?.confidence || 5;

    // 4. Trích xuất các câu phát ngôn gần nhất của Thầy để đưa vào rào cản chống lặp tuyệt đối
    const pastModelUtterances = validHistory
      .filter(m => m.role === 'model' && m.text)
      .slice(-3)
      .map((m, i) => `Lượt trước ${i + 1}: "${m.text.slice(0, 120)}..."`)
      .join('\n');

    // 5. Xây dựng System Instruction theo "MÔ HÌNH NHẬN THỨC LINH HOẠT" (COGNITIVE AGENT ARCHITECTURE)
    const systemPrompt = `
BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang trò chuyện 1-1 với một học sinh THPT đang đứng trước ngưỡng cửa chọn ngành nghề tương lai.

[HỒ SƠ HỌC SINH TẠI BƯỚC 1]:
- Ngành mong muốn: ${targetCareer}
- Trường mục tiêu: ${targetSchool}
- Thiên hướng Holland (RIASEC): ${hollandCode}
- Mức tự tin ban đầu (T0): ${confidenceT0}/10
- Tiến trình hiện tại: Mục tiêu ${Math.min(studentTurns, 4)} / 4

[BẢN CHẤT CỐT LÕI - KHÔNG PHẢI BOT KỊCH BẢN CỨNG NHẮC]:
Bạn KHÔNG PHẢI là một kịch bản bot lặp khuôn hay mẫu câu máy móc. Bạn sở hữu trí tuệ cảm xúc (EQ) cao, khả năng lắng nghe sâu, sự ấm áp của người thầy và nghệ thuật dẫn dắt Socrates giúp học sinh tự nhận thức.

[CƠ CHẾ SUY NGHĨ NỘI TÂM TRƯỚC KHI TRẢ LỜI - BẮT BUỘC]:
Với mỗi tin nhắn của học sinh, hãy tự đặt câu hỏi trong tiềm thức:
1. "Học sinh này đang bộc lộ trạng thái tâm lý gì?" (Ví dụ: Thực dụng vì tiền/thu nhập; Tự ti, hoang mang về học lực; Bị phụ huynh áp đặt/ngoại sinh; Bốc đồng theo trào lưu; hay Tự tin có căn cứ?).
2. "Làm sao để công nhận cảm xúc của em ấy một cách chân thành nhất mà không phán xét?"
3. "Làm sao để dùng chính câu nói bất ngờ đó làm bàn đạp dẫn dắt em ấy về hiện thực nghề nghiệp?"

[HƯỚNG DẪN XỬ LÝ CÁC TÌNH HUỐNG TÂM LÝ BẤT NGỜ]:
- NẾU HỌC SINH THỰC DỤNG / NÓI VỀ TIỀN (Ví dụ: "Thầy em dạy thêm nhiều tiền", "Ngành này kiếm nhiều tiền", "Em muốn giàu"):
  -> TUYỆT ĐỐI ĐỪNG chê trách hay biến thành đam mê giả tạo. Hãy thừa nhận: "Mong muốn có thu nhập tốt là nhu cầu hoàn toàn chính đáng của cuộc sống." Sau đó đối chất sư phạm: "Nhưng để dạy thêm có nhiều người học và có thu nhập cao, người thầy đó phải có chuyên môn vượt trội và uy tín thế nào? Em đã chuẩn bị gì cho năng lực chuyên môn đó?"
- NẾU HỌC SINH TỰ TI / HOANG MANG (Ví dụ: "Em thấy mình dốt", "Em không biết có làm được không", "Em sợ thi trượt"):
  -> ĐỪNG tuôn lý thuyết vĩ mô. Hãy nâng đỡ cảm xúc: "Sự lo lắng này là rất thật và đáng được tôn trọng khi em đứng trước cánh cửa tương lai." Sau đó bóc tách: "Điều gì đang làm em sợ nhất: khối lượng kiến thức, điểm số thi tuyển, hay sợ sự kỳ vọng của người khác?"
- NẾU HỌC SINH NÊU MÔN HỌC BẤT KỲ (Kể cả môn lạ như GDQP, KTPL, Hoạt động trải nghiệm, hoặc môn phụ):
  -> Hãy đón nhận tự nhiên, đối chiếu xem môn đó có nằm trong các tổ hợp xét tuyển truyền thống của ngành hay không, chỉ ra mức độ cạnh tranh và gợi mở hướng đi thích hợp.
- NẾU HỌC SINH BỊ PHỤ HUYNH ÁP ĐẶT / NGOẠI SINH (Ví dụ: "Mẹ em định hướng", "Bố mẹ chọn", "Ba mẹ bắt thi"):
  -> Thấu cảm: "Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em." Sau đó đối chất: "Bản thân em có thực sự tìm thấy sự hứng thú nào với công việc ${targetCareer} này không, hay em chỉ đang học để làm hài lòng bố mẹ?"
- NẾU HỌC SINH KHẲNG ĐỊNH THỰC SỰ ĐAM MÊ / YÊU THÍCH:
  -> Ghi nhận sự hào hứng tự nhiên, nhưng bóc tách sâu vào hoạt động chuyên môn thực tế hàng ngày (đứng lớp, soạn bài giảng, kiên nhẫn đồng hành cùng học sinh hay chấm bài) xem hoạt động nào thực sự tạo năng lượng cho em.

[TIẾN TRÌNH 4 MỤC TIÊU SƯ PHẠM BẤT BIẾN CHUẨN VISEF 2026]:
- VÒNG 1 (Động cơ): Khám phá động cơ thật (nội sinh vs ngoại sinh, đam mê vs tiền bạc/dạy thêm vs áp lực gia đình/trào lưu).
- VÒNG 2 (Xu hướng & Thách thức): Đặt người học trước bối cảnh nghề nghiệp 5-10 năm tới dưới tác động của AI, Chuyển đổi số, EdTech/Tự động hóa (chuẩn năng lực thích ứng mới, không chỉ làm tác vụ lặp lại) và kết nối với việc chuẩn bị tổ hợp môn xét tuyển để mở cánh cửa đầu tiên.
- VÒNG 3 (Tổ hợp môn & Năng lực thực tế):
  * Nếu học sinh nói "chưa biết/chưa tìm hiểu tổ hợp môn": BẮT BUỘC thực hiện Kỹ thuật 3 Nhịp:
    (1) Chỉ ra nghịch lý giữa ước vọng nghề nghiệp và việc chưa chuẩn bị công cụ xét tuyển;
    (2) Cung cấp giàn giáo phân định 2 trục năng lực (Khoa học Tự nhiên/Logic vs Khoa học Xã hội/Ngôn ngữ);
    (3) Thăm dò đối cực trung lập về môn sở trường và môn có khoảng cách năng lực cần nỗ lực nhất.
  * Nếu học sinh nói "học đều đều các môn" / "môn nào cũng bình thường / tàn tàn": BẮT BUỘC chỉ ra mức độ cạnh tranh điểm chuẩn đại học rất khắt khe (thường từ 24-27 điểm, tức trung bình 8-9 điểm/môn) và hỏi mở xem môn nào học sinh có khả năng bứt phá kéo điểm tổ hợp.
  * Nếu học sinh đã giải thích lý do vì chưa định hình môn dạy: Thấu cảm trước, gợi mở 2 trục năng lực trụ cột và hỏi về môn sở trường / môn yếu.
- VÒNG 4 (Tái cấu trúc & Lời kết dứt khoát):
  * Phân tích chính xác cặp môn / tình trạng học sinh vừa nêu ở Vòng 3.
  * Đưa ra giải pháp thích ứng kép: (1) Nỗ lực bứt phá môn mạnh HOẶC (2) Cân nhắc phân khúc vừa sức như hệ Cao đẳng Sư phạm / Cao đẳng Giáo dục nghề nghiệp thực hành để giảm áp lực điểm thi mà vẫn giữ trọn cơ hội làm nghề giáo dục.
  * Ra lệnh dứt khoát: "Bây giờ, em hãy dừng suy đoán và bấm chuyển sang Bước 3: Môi trường đối chứng dữ liệu thực tế để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!"
  * TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO MỚI Ở CUỐI VÒNG 4!

[RÀO CẢN CHỐNG LẶP LẠI TUYỆT ĐỐI]:
${pastModelUtterances ? `Dưới đây là các câu trả lời gần nhất của bạn:\n${pastModelUtterances}\nBẠN TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại các cấu trúc câu, từ ngữ chào đón hoặc câu hỏi đã xuất hiện ở trên!` : ''}

[ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]:
- Mỗi phản hồi chỉ từ 2 đến 4 câu ngắn gọn, súc tích, văn phong sư phạm ổn định, điềm tĩnh, ấm áp.
- Kết thúc bằng ĐÚNG 01 câu hỏi phản tư duy nhất (ở Vòng 1, 2, 3), hoặc kết thúc bằng lời trao quyền chuyển bước dứt khoát (ở Vòng 4).
- Phải kết thúc bằng dấu chấm câu hoàn chỉnh (. ! ?), tuyệt đối không ngắt quãng lửng lơ.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề, ghi chú hay phân tích kỹ thuật.
- TUYỆT ĐỐI KHÔNG xuất các khối ghi chú suy nghĩ trong dấu ngoặc đơn hoặc dấu sao như *(...)* hay [Suy nghĩ:...]. Bắt đầu ngay bằng lời thoại của Thầy Socrates.
`;

    // 6. Chuẩn bị nội dung gửi lên Gemini API
    const contents = validHistory
      .filter(msg => msg && msg.text && typeof msg.text === 'string')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    
    contents.push({
      role: 'user',
      parts: [{ text: trimmedMsg }]
    });

    let replyText = null;

    // 7. Cấu hình mô hình hoạt động ổn định với Token và Tham số chuẩn ViSEF 2026
    const candidateModelNames = [
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite'
    ];

    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.35,
            topP: 0.85,
            maxOutputTokens: 1000
          }
        });

        const result = await model.generateContent({ contents });
        let resText = result?.response?.text();
        if (resText) {
          let cleaned = resText.trim()
            .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
            .replace(/^<thought>[\s\S]*?<\/thought>\s*/gi, '')
            .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ|SUY NGHĨ|THOUGHT).*?\]\s*/gi, '')
            .replace(/^\*\(?[\s\S]*?\)?\*\s*/g, '')
            .replace(/^\[[\s\S]*?\]\s*/g, '')
            .replace(/^\([\s\S]*?\)\s*/g, '')
            .replace(/^#+.*?\n/gi, '')
            .trim();

          // Kiểm tra xem phản hồi có hoàn chỉnh và kết thúc bằng dấu chấm câu không
          if (isCompleteSentence(cleaned)) {
            replyText = cleaned;
            break;
          }
        }
      } catch (err) {
        // Thử model tiếp theo trong danh sách candidate
      }
    }

    // 8. Heuristic Fallback Nhận thức (Chỉ kích hoạt nếu toàn bộ API Gemini gặp sự cố hoặc trả về đứt gãy)
    if (!replyText || !isCompleteSentence(replyText)) {
      replyText = generateCognitiveFallback({
        studentTurns,
        targetCareer,
        targetSchool,
        trimmedMsg,
        lowerTrimmed
      });
    }

    return res.status(200).json({
      success: true,
      round: Math.min(studentTurns, 4),
      response: replyText,
      reply: replyText,
      isCompleted: studentTurns >= 4
    });

  } catch (error) {
    console.error("Lỗi Socrates Chat Backend:", error);
    return res.status(500).json({ success: false, message: "Lỗi xử lý máy chủ!" });
  }
}

// Hàm Fallback Nhận thức Linh hoạt (Dự phòng khẩn cấp chuẩn ViSEF 2026 - 100% Trọn vẹn)
function generateCognitiveFallback({ studentTurns, targetCareer, targetSchool, trimmedMsg, lowerTrimmed }) {
  // 1. Phản xạ tâm lý bất ngờ: Thực dụng / nói về tiền / dạy thêm
  const isPragmaticMoney = [
    'nhiều tiền', 'dạy thêm', 'lương', 'thu nhập', 'kiếm tiền', 'kiếm dc nhiều', 'giàu', 'kinh tế'
  ].some(k => lowerTrimmed.includes(k));
  if (isPragmaticMoney && studentTurns <= 2) {
    return `Mong muốn có thu nhập tốt và cuộc sống đủ đầy là nhu cầu hoàn toàn chính đáng của mỗi người.\n\nTuy nhiên trong thực tế, để có uy tín và thu hút nhiều người theo học, người làm nghề **${targetCareer}** phải có trình độ chuyên môn vượt trội và sự rèn luyện bền bỉ ra sao? Em đã có sự chuẩn bị gì cho năng lực chuyên môn cốt lõi đó?`;
  }

  // 2. Phản xạ tâm lý bất ngờ: Tự ti / hoang mang
  const isInsecure = [
    'dốt', 'kém', 'sợ trượt', 'không biết làm được', 'không biết có làm được', 'lo lắng', 'hoang mang', 'tự ti', 'áp lực', 'sợ không đỗ'
  ].some(k => lowerTrimmed.includes(k));
  if (isInsecure && studentTurns <= 3) {
    return `Sự lo lắng và cảm giác hoài nghi bản thân là trạng thái tâm lý rất thật và đáng được tôn trọng khi em đứng trước cánh cửa tương lai quan trọng.\n\nNhìn lại chính mình lúc này, điều gì đang làm em cảm thấy áp lực nhất: khối lượng kiến thức chuyên môn, điểm số thi tuyển, hay áp lực từ sự kỳ vọng của người khác?`;
  }

  // 3. Phản xạ tâm lý: Bị gia đình áp đặt / ngoại sinh
  const isFamily = [
    'mẹ định hướng', 'mẹ em định hướng', 'bố định hướng', 'bố em định hướng', 'ba định hướng', 'ba em định hướng',
    'bố mẹ', 'ba mẹ', 'cha mẹ', 'gia đình muốn', 'bố mẹ chọn', 'ba mẹ chọn', 'bố mẹ bắt', 'ba mẹ bắt'
  ].some(k => lowerTrimmed.includes(k)) || /(mẹ|bố|ba|gia đình)\s+(em\s+)?(định hướng|chọn|bắt|muốn|khuyên|bảo)/i.test(lowerTrimmed);
  if (isFamily && studentTurns <= 2) {
    return `Gia đình luôn mong muốn điều an toàn và ổn định cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em.\n\nBản thân em có thực sự tìm thấy sự hứng thú nào với công việc **${targetCareer}** này không, hay em chỉ đang học để làm hài lòng bố mẹ?`;
  }

  // 4. Theo tiến trình 4 mục tiêu sư phạm chuẩn mực:
  if (studentTurns >= 4) {
    const hasMath = lowerTrimmed.includes('toán') || lowerTrimmed.includes('toan');
    const hasLit = lowerTrimmed.includes('văn') || lowerTrimmed.includes('van');
    const isWeakBoth = (hasMath && hasLit && (lowerTrimmed.includes('yếu') || lowerTrimmed.includes('kém') || lowerTrimmed.includes('sợ'))) ||
      /(yếu|kém|đuối|sợ|thấp)[^,.;!?\n]*(văn\s*(và|với|\+)\s*toán|toán\s*(và|với|\+)\s*văn)/i.test(lowerTrimmed);

    const isEvenGrades = ['đều đều', 'deu deu', 'học đều', 'hoc deu', 'tàn tàn', 'tan tan', 'bình thường', 'binh thuong', 'như nhau', 'ngang nhau'].some(k => lowerTrimmed.includes(k));

    if (isWeakBoth || isEvenGrades) {
      return `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\nKhi đối diện với ngưỡng điểm chuẩn rất cao của ngành **${targetCareer}** tại **${targetSchool}** (thường từ 24 - 27 điểm), việc có khoảng cách năng lực mở ra giải pháp thích ứng kép: Em có thể nỗ lực bứt phá các môn sở trường còn lại để tối ưu điểm số tổ hợp, hoặc cân nhắc phân khúc vừa sức như hệ **Cao đẳng Sư phạm** / **Cao đẳng nghề thực hành** để vừa sức hơn mà vẫn giữ trọn cơ hội làm nghề giáo dục.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
    }

    if (lowerTrimmed.includes('gdqp') || lowerTrimmed.includes('ktpl') || lowerTrimmed.includes('quốc phòng') || lowerTrimmed.includes('kinh tế pháp luật')) {
      return `Thầy đánh giá cao việc em thẳng thắn nhận diện năng lực ở môn Giáo dục Quốc phòng và Kinh tế Pháp luật. Mặc dù các môn này hiện nay ít xuất hiện trong tổ hợp truyền thống của ngành **${targetCareer}** tại **${targetSchool}**, nhưng tư duy pháp luật và tác phong kỷ luật là phẩm chất rất tốt để em rèn luyện.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và đối chứng các tổ hợp môn được chấp nhận nhé!`;
    }

    if (hasLit && (lowerTrimmed.includes('yếu toán') || lowerTrimmed.includes('kém toán') || lowerTrimmed.includes('sợ toán'))) {
      return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Năng khiếu Ngữ văn là nền tảng rất vững chắc cho các ngành Sư phạm Ngữ văn, Giáo dục Tiểu học hoặc Khoa học Xã hội, giúp em phát huy trọn vẹn thế mạnh ngôn ngữ và hoàn toàn tránh được rào cản môn Toán!\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
    }

    if (hasMath && (lowerTrimmed.includes('yếu văn') || lowerTrimmed.includes('kém văn') || lowerTrimmed.includes('sợ văn'))) {
      return `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00, A01), hoàn toàn tránh được rào cản môn Ngữ văn!\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
    }

    return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\nNắm chắc môn thế mạnh sẽ giúp em chọn đúng tổ hợp xét tuyển tối ưu và mở rộng cơ hội trúng tuyển.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
  }

  if (studentTurns === 1) {
    return `Thầy rất ghi nhận niềm yêu thích tự nhiên và sự khẳng định chân thành của em dành cho ngành **${targetCareer}**.\n\nTuy nhiên, sự yêu thích chỉ trở thành điểm tựa vững chắc khi em hiểu rõ các công việc chuyên môn thực tế hàng ngày đằng sau nó. Cụ thể trong các hoạt động chuyên môn của nghề (như chuẩn bị bài giảng, đứng lớp truyền đạt kiến thức, kiên nhẫn đồng hành cùng học sinh hay chấm bài), hoạt động nào khiến em cảm thấy bản thân có nhiều năng lượng và hứng thú nhất?`;
  }

  if (studentTurns === 2) {
    return `Trong 5-10 năm tới, AI, công nghệ giáo dục (EdTech) và chuyển đổi số sẽ tái cơ cấu mạnh mẽ thị trường lao động. Người làm nghề **${targetCareer}** tương lai không chỉ thực hiện các tác vụ cơ bản lặp đi lặp lại mà bắt buộc phải thích ứng với chuẩn năng lực mới, làm chủ công nghệ và rèn luyện kỹ năng tư duy bậc cao cho học sinh.\n\nĐể thích ứng với những tiêu chuẩn mới đó, em dự định trang bị năng lực gì và để thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?`;
  }

  // studentTurns === 3:
  const isEvenGrades = ['đều đều', 'deu deu', 'học đều', 'hoc deu', 'tàn tàn', 'tan tan', 'bình thường', 'binh thuong', 'như nhau', 'ngang nhau'].some(k => lowerTrimmed.includes(k));
  if (isEvenGrades) {
    return `Thầy ghi nhận sự nhìn nhận khách quan của em về học lực. Tuy nhiên, điểm chuẩn trúng tuyển vào các ngành Sư phạm tại **${targetSchool}** luôn có tính cạnh tranh rất cao, thường dao động từ 24 đến 27 điểm (tức trung bình mỗi môn trong tổ hợp phải đạt từ 8 đến 9 điểm trở lên).\n\nNếu tất cả các môn chỉ dừng ở mức đều đều, em sẽ gặp rất nhiều rủi ro. Nhìn nhận lại quá trình học tập, đâu là môn học em cảm thấy bản thân có nhiều khả năng bứt phá nhất để trở thành môn kéo điểm cho cả tổ hợp?`;
  }

  return `Thầy đánh giá cao sự trung thực của em. Nuôi dưỡng ước mơ với ngành **${targetCareer}** là bước khởi đầu rất đẹp, nhưng thật nghịch lý nếu muốn bước chân qua cánh cổng trường đại học mà tổ hợp môn xét tuyển - chiếc chìa khóa quyết định - lại chưa được em chuẩn bị!\n\nQuy chế tuyển sinh hiện nay phân định rõ 2 trục năng lực: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Lát nữa ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh chính thức để kiểm chứng.\n\nNhìn lại kết quả học tập ở trường, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?`;
}
