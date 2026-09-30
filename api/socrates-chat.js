// api/socrates-chat.js - Vercel Serverless Function & Express compatible endpoint
// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// TỰ ĐỘNG CHỐNG LẶP & CÁ NHÂN HÓA 100% THEO MÔN HỌC
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
    'định hình', 'tổ hợp', 'môn'
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

    // 2. Tính số lượt tương tác thực sự của học sinh (LOẠI BỎ TẤT CẢ LƯỢT CHÀO HỎI ĐƠN THUẦN)
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text));
    const studentTurns = body?.round && Number(body.round) > 0 
      ? Number(body.round) 
      : (substantiveUserMsgs.length + 1);

    const trimmedMsg = userMessage.trim();
    const lowerTrimmed = trimmedMsg.toLowerCase();

    const targetCareer = studentProfile?.targetCareer || studentProfile?.target_career || studentProfile?.targetMajor || "Sư phạm";
    const targetSchool = studentProfile?.targetSchool || studentProfile?.target_university || "ĐH Quy Nhơn";
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || "AEI";
    const confidenceT0 = studentProfile?.confidenceT0 || studentProfile?.confidence_score || studentProfile?.confidence || 5;

    // PHẢN XẠ NHANH: Nếu học sinh chỉ chào hỏi
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em. Thầy trò mình cùng tập trung vào nội dung định hướng nhé. Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại!`;
      return res.status(200).json({
        success: true,
        round: Math.min(studentTurns, 4),
        response: greetingReply,
        reply: greetingReply,
        isCompleted: false
      });
    }

// Hàm phân tích ngữ nghĩa chính xác môn sở trường và môn yếu (tránh nhầm lẫn yếu thành giỏi)
function detectSubjectOrientation(text) {
  const lower = (text || '').toLowerCase();
  const hasMath = lower.includes('toán') || lower.includes('toan');
  const hasLit = lower.includes('văn') || lower.includes('van');

  if (!hasMath && !hasLit) {
    return { type: 'OTHER' };
  }

  // 1. Kiểm tra trường hợp YẾU CẢ TOÁN VÀ VĂN:
  const weakBothPatterns = [
    /(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)[^,.;!?\n]*(văn\s*(và|với|lẫn|\+)\s*toán|toán\s*(và|với|lẫn|\+)\s*văn)/i,
    /(văn\s*(và|với|lẫn|\+)\s*toán|toán\s*(và|với|lẫn|\+)\s*văn)[^,.;!?\n]*(đều|cũng|thì|là môn)?[^,.;!?\n]*(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)/i,
    /(yếu cả|kém cả|đuối cả|sợ cả)[^,.;!?\n]*(toán|văn)/i,
    /(cả toán lẫn văn|cả văn lẫn toán|cả toán và văn|cả văn và toán)[^,.;!?\n]*(đều|cũng)?[^,.;!?\n]*(yếu|kém|đuối|sợ)/i,
    /(hai môn|2 môn|cả hai môn)\s*(toán[^,.;!?\n]*văn|văn[^,.;!?\n]*toán)[^,.;!?\n]*(đều|cũng)?[^,.;!?\n]*(yếu|kém|đuối|sợ)/i
  ];

  if (weakBothPatterns.some(p => p.test(lower))) {
    return { type: 'BOTH_MATH_LIT_WEAK' };
  }

  // Math strong
  const mathStrongPatterns = [
    /(giỏi|tốt|khá|thế mạnh|sở trường|thích|ổn)\s+(môn\s+)?toán/i,
    /toán\s+(thì\s+)?(em\s+)?(học\s+)?(giỏi|tốt|khá|thế mạnh|sở trường|cao|ổn)/i,
    /(sở trường|thế mạnh)[^,.;!?\n]*toán/i
  ];
  // Math weak
  const mathWeakPatterns = [
    /(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)\s+(môn\s+)?toán/i,
    /toán\s+(thì\s+)?(em\s+)?(hơi\s+|học\s+)?(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)/i,
    /(yếu nhất|kém nhất)[^,.;!?\n]*toán/i
  ];

  // Lit strong
  const litStrongPatterns = [
    /(giỏi|tốt|khá|thế mạnh|sở trường|thích|ổn)\s+(môn\s+)?văn/i,
    /văn\s+(thì\s+)?(em\s+)?(học\s+)?(giỏi|tốt|khá|thế mạnh|sở trường|cao|ổn)/i,
    /(sở trường|thế mạnh)[^,.;!?\n]*văn/i
  ];
  // Lit weak
  const litWeakPatterns = [
    /(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)\s+(môn\s+)?văn/i,
    /văn\s+(thì\s+)?(em\s+)?(hơi\s+|học\s+)?(yếu|kém|đuối|sợ|thấp|không tốt|mất gốc|tệ)/i,
    /(yếu nhất|kém nhất)[^,.;!?\n]*văn/i
  ];

  const mathStrong = mathStrongPatterns.some(p => p.test(lower));
  const mathWeak = mathWeakPatterns.some(p => p.test(lower));
  const litStrong = litStrongPatterns.some(p => p.test(lower));
  const litWeak = litWeakPatterns.some(p => p.test(lower));

  if (mathStrong && litWeak) {
    return { type: 'MATH_STRONG_LIT_WEAK' };
  }
  if (litStrong && mathWeak) {
    return { type: 'LIT_STRONG_MATH_WEAK' };
  }
  if (mathStrong && !litStrong) {
    return { type: 'MATH_STRONG_LIT_WEAK' };
  }
  if (litStrong && !mathStrong) {
    return { type: 'LIT_STRONG_MATH_WEAK' };
  }
  if (mathWeak && litWeak) {
    return { type: 'BOTH_MATH_LIT_WEAK' };
  }

  return { type: 'GENERAL' };
}

    // PHẢN XẠ NHANH: Nếu học sinh cảm thấy bị hỏi lặp lại ("Dạ em đã nói là thích rồi mà")
    const isAnnoyedRepeat = [
      'đã nói', 'nói rồi', 'hỏi lại', 'đã bảo', 'thầy lại hỏi', 'đã trả lời', 'sao hỏi lại', 'đã nói là'
    ].some(k => lowerTrimmed.includes(k));

    if (isAnnoyedRepeat) {
      const calmReply = `Thầy ghi nhận sự kiên định và khẳng định dứt khoát của em đối với ngành **${targetCareer}**! Thầy trò mình cùng đi thẳng vào thực tế nhé:\n\nTrong 5-10 năm tới, AI, công nghệ giáo dục (EdTech) và chuyển đổi số sẽ tái cơ cấu mạnh mẽ thị trường lao động. Người làm nghề **${targetCareer}** tương lai không chỉ thực hiện các tác vụ cơ bản lặp đi lặp lại mà bắt buộc phải thích ứng với chuẩn năng lực mới, làm chủ công nghệ và rèn luyện kỹ năng tư duy bậc cao cho học sinh.\n\nĐể thích ứng với những tiêu chuẩn mới đó, em dự định trang bị năng lực gì và để thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?`;
      return res.status(200).json({
        success: true,
        round: 2,
        response: calmReply,
        reply: calmReply,
        isCompleted: false
      });
    }

    // PHẢN XẠ NHANH VÒNG 1: Động cơ ngoại sinh từ gia đình / bố mẹ (TUYỆT ĐỐI KHÔNG KHEN "YÊU THÍCH TỰ NHIÊN")
    const familyKeywords = [
      'mẹ định hướng', 'mẹ em định hướng', 'bố định hướng', 'bố em định hướng', 'ba định hướng', 'ba em định hướng',
      'bố mẹ định hướng', 'ba mẹ định hướng', 'cha mẹ định hướng', 'gia đình định hướng', 'gia đình em định hướng',
      'bố mẹ', 'ba mẹ', 'cha mẹ', 'gia đình muốn', 'gia đình em muốn', 'gia đình bảo', 'gia đình em bảo',
      'bố mẹ chọn', 'ba mẹ chọn', 'mẹ chọn', 'bố chọn', 'ba chọn', 'mẹ em chọn', 'bố em chọn', 'ba em chọn',
      'theo ý bố', 'theo ý mẹ', 'theo ý ba', 'theo ý gia đình', 'nghe lời bố', 'nghe lời mẹ', 'nghe lời ba', 'nghe lời gia đình',
      'bố mẹ bắt', 'ba mẹ bắt', 'mẹ bắt', 'bố bắt', 'ba bắt', 'mẹ em bắt', 'bố em bắt', 'ba em bắt', 'gia đình bắt', 'gia đình khuyên', 'bố mẹ khuyên', 'ba mẹ khuyên',
      'bố mẹ hướng', 'mẹ hướng', 'ba hướng', 'bố hướng', 'mẹ em hướng', 'bố em hướng', 'ba em hướng',
      'định hướng của gia đình', 'định hướng từ bố', 'định hướng từ mẹ', 'định hướng từ ba', 'định hướng từ gia đình',
      'bố mẹ muốn', 'ba mẹ muốn', 'mẹ em muốn', 'bố em muốn', 'ba em muốn', 'nhà em muốn', 'nhà muốn',
      'mẹ em bảo', 'bố em bảo', 'ba em bảo', 'mẹ bảo', 'bố bảo', 'ba bảo'
    ];
    const isFamilyExtrinsic = familyKeywords.some(k => lowerTrimmed.includes(k)) ||
      /(mẹ|bố|ba|cha|gia đình|phụ huynh)\s+(em\s+)?(định hướng|chọn|bắt|muốn|khuyên|bảo|hướng|gợi ý)/i.test(lowerTrimmed) ||
      /(định hướng|ý muốn|mong muốn|sự sắp đặt)\s+(của|từ)\s+(gia đình|bố mẹ|ba mẹ|bố|mẹ|ba)/i.test(lowerTrimmed);

    if (isFamilyExtrinsic && studentTurns <= 2) {
      const familyReply = `Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em.\n\nBản thân em có thực sự tìm thấy sự hứng thú nào với công việc **${targetCareer}** này không, hay em chỉ đang học để làm hài lòng bố mẹ?`;
      return res.status(200).json({
        success: true,
        round: 1,
        response: familyReply,
        reply: familyReply,
        isCompleted: false
      });
    }

    // PHẢN XẠ NHANH: Nếu học sinh khẳng định thực sự yêu thích / đam mê (TUYỆT ĐỐI KHÔNG HỎI LẠI CÂU MỞ ĐẦU)
    const isAffirmingInterest = [
      'thực sự yêu thích', 'thực sự thích', 'thật sự yêu thích', 'thật sự thích',
      'yêu thích', 'vì em thích', 'em thích', 'thích thôi', 'do em thích',
      'rất thích', 'thích ngành', 'thích nghề', 'đam mê', 'vì đam mê', 'do đam mê',
      'thích chứ', 'không phải điều gì khác', 'không phải vì hot', 'không phải phong trào'
    ].some(k => lowerTrimmed.includes(k));

    if (isAffirmingInterest && studentTurns <= 2) {
      const interestReply = `Thầy rất ghi nhận niềm yêu thích tự nhiên và sự khẳng định chân thành của em dành cho ngành **${targetCareer}**.\n\nTuy nhiên, sự yêu thích chỉ trở thành điểm tựa vững chắc khi em hiểu rõ các công việc chuyên môn thực tế hàng ngày đằng sau nó.\n\nCụ thể trong các hoạt động chuyên môn của nghề (như chuẩn bị bài giảng, đứng lớp truyền đạt kiến thức, kiên nhẫn đồng hành cùng học sinh hay chấm bài), hoạt động nào khiến em cảm thấy bản thân có nhiều năng lượng và hứng thú nhất?`;
      return res.status(200).json({
        success: true,
        round: 1,
        response: interestReply,
        reply: interestReply,
        isCompleted: false
      });
    }

    // PHẢN XẠ NHANH: Nếu học sinh nói "chưa biết sư phạm môn gì" / "chưa biết môn gì"
    if (lowerTrimmed.includes('chưa biết') && (lowerTrimmed.includes('môn gì') || lowerTrimmed.includes('sư phạm gì') || lowerTrimmed.includes('ngành gì'))) {
      const subjectGroupReply = `Thầy khen ngợi sự thành thật của em. Trong thực tế, Sư phạm chia thành 2 nhóm lớn: nhóm Khoa học Tự nhiên (Toán, Lý, Hóa, Sinh, Tin) và nhóm Khoa học Xã hội / Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ, Giáo dục Tiểu học).\n\nTrong các môn học ở trường, đâu là môn sở trường của em và môn nào em còn nhiều khoảng cách nhất?`;
      return res.status(200).json({
        success: true,
        round: Math.min(studentTurns, 4),
        response: subjectGroupReply,
        reply: subjectGroupReply,
        isCompleted: false
      });
    }

    // PHẢN XẠ NHANH VÒNG 3:
    // 1. Phân luồng đặc biệt: Học sinh giải thích chưa tìm hiểu VÌ CHƯA ĐỊNH HÌNH MÔN DẠY / CHƯA BIẾT DẠY MÔN GÌ
    const isExplainingUndecidedSubject = [
      'chưa định hình', 'chua dinh hinh', 'chưa biết dạy môn', 'chưa biết môn nào',
      'chưa biết dạy gì', 'chưa chọn môn', 'chưa biết sư phạm gì', 'chưa rõ dạy môn',
      'chưa biết là dạy', 'chưa biết sẽ dạy', 'chưa định hình dạy', 'phân vân môn', 'chưa chọn được môn'
    ].some(k => lowerTrimmed.includes(k)) || (lowerTrimmed.includes('dạy môn') && (lowerTrimmed.includes('chưa') || lowerTrimmed.includes('không')));

    if (isExplainingUndecidedSubject) {
      const explainReply = `Thầy rất thấu cảm với lý do của em. Hoàn toàn tự nhiên và hợp lý khi chưa định hình mình muốn dạy môn gì thì rất khó để biết phải tra cứu tổ hợp môn nào!\n\nThực tế trong ngành Sư phạm, môn dạy sau này gắn chặt với nhóm năng lực trụ cột của em: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Lát nữa ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh của trường để kiểm chứng chi tiết.\n\nĐể giúp em định hình chính xác môn dạy và tổ hợp phù hợp nhất: Nhìn lại kết quả học tập ở trường, đâu là môn học sở trường tạo lợi thế lớn nhất cho em, và môn nào đang là môn em còn nhiều khoảng cách nhất?`;
      return res.status(200).json({
        success: true,
        round: 3,
        response: explainReply,
        reply: explainReply,
        isCompleted: false
      });
    }

    // 2. Học sinh nói chung chung là chưa tìm hiểu tổ hợp môn (TUYỆT ĐỐI KHÔNG DÙNG TỪ "NGHỊCH LÝ")
    const isComboReflex = [
      'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
      'chưa tìm hiểu', 'chưa biết môn', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
      'chưa xem tổ hợp', 'chưa rõ môn', 'chưa tìm', 'không rõ'
    ].some(k => lowerTrimmed.includes(k));

    if (isComboReflex) {
      const threeStepsReply = `Thầy đánh giá cao sự trung thực của em. Nuôi dưỡng ước mơ với ngành **${targetCareer}** là bước khởi đầu rất đẹp, nhưng để bước chân qua cánh cổng trường đại học, tổ hợp môn xét tuyển chính là chiếc chìa khóa quyết định mà em không thể bỏ quên!\n\nQuy chế tuyển sinh hiện nay chia ngành nghề thành các nhóm năng lực trụ cột rõ rệt: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh chính thức để làm rõ điều này.\n\nNhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?`;
      return res.status(200).json({
        success: true,
        round: 3,
        response: threeStepsReply,
        reply: threeStepsReply,
        isCompleted: false
      });
    }

    // PHẢN XẠ NHANH VÒNG 4: PHÂN TÍCH CHÍNH XÁC NGỮ NGHĨA MÔN SỞ TRƯỜNG & MÔN YẾU (TUYỆT ĐỐI KHÔNG NHẦM MÔN YẾU THÀNH GIỎI)
    const subjectOrient = detectSubjectOrientation(trimmedMsg);
    if (studentTurns >= 3 && subjectOrient.type === 'BOTH_MATH_LIT_WEAK') {
      const bothWeakReply = `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\nKhi yếu cả hai môn cốt lõi là Toán và Ngữ văn, đây là một thử thách rất lớn đối với ước mơ vào ngành Sư phạm tại **${targetSchool}**, bởi vì phần lớn các tổ hợp xét tuyển truyền thống (như A00, B00, C00, D01) đều bắt buộc phải có Toán hoặc Văn với điểm chuẩn rất cao (thường từ 24 - 27 điểm).\n\nTuy nhiên, việc các môn còn lại em học tốt mở ra 2 hướng thích ứng rất cụ thể:\n1. **Tận dụng các môn còn lại học tốt**: Nếu em học tốt Tiếng Anh, Lịch sử, Địa lý hay Khoa học Tự nhiên (Hóa, Sinh), em hoàn toàn có thể tìm kiếm các tổ hợp tương ứng (ví dụ: Sư phạm Lịch sử - Địa lý, Sư phạm Tiếng Anh nếu khá ngoại ngữ, hoặc Sư phạm Khoa học Tự nhiên/Sinh học).\n2. **Cân nhắc phân khúc vừa sức**: Nếu điểm 2 môn cốt lõi Toán - Văn quá thấp so với điểm chuẩn đại học, em hãy cân nhắc phân khúc hệ **Cao đẳng Sư phạm** hoặc **Cao đẳng Giáo dục nghề nghiệp thực hành** (thời gian đào tạo 2.5 - 3 năm, chú trọng tay nghề, áp lực thi tuyển nhẹ nhàng hơn và vẫn đảm bảo cơ hội làm nghề giáo dục).\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
      return res.status(200).json({
        success: true,
        round: 4,
        response: bothWeakReply,
        reply: bothWeakReply,
        isCompleted: true
      });
    }

    if (studentTurns >= 3 && subjectOrient.type === 'LIT_STRONG_MATH_WEAK') {
      const litStrongReply = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Năng khiếu Ngữ văn là nền tảng rất vững chắc cho các ngành Sư phạm Ngữ văn, Giáo dục Tiểu học hoặc Sư phạm Khoa học Xã hội (khối C00, D01), giúp em phát huy trọn vẹn thế mạnh ngôn ngữ và hoàn toàn tránh được rào cản môn Toán!\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
      return res.status(200).json({
        success: true,
        round: 4,
        response: litStrongReply,
        reply: litStrongReply,
        isCompleted: true
      });
    }

    if (studentTurns >= 3 && subjectOrient.type === 'MATH_STRONG_LIT_WEAK') {
      const mathStrongReply = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00: Toán-Lý-Hóa hoặc A01: Toán-Lý-Anh), hoàn toàn tránh được rào cản môn Ngữ văn!\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
      return res.status(200).json({
        success: true,
        round: 4,
        response: mathStrongReply,
        reply: mathStrongReply,
        isCompleted: true
      });
    }

    // 3. Xây dựng System Instruction tối ưu, gãy gọn, không dài dòng
    const systemPrompt = `
Bạn là Thầy Socrates - Chuyên gia can thiệp tâm lý hướng nghiệp thuộc đề tài nghiên cứu hành vi ViSEF 2026.
Bạn đang đối thoại 1-1 với một học sinh THPT:
- Ngành mong muốn: ${targetCareer}
- Trường mục tiêu: ${targetSchool}
- Nhóm Holland: ${hollandCode}
- Mức tự tin T0: ${confidenceT0}/10

QUY TẮC CỐT TỬ (BẮT BUỘC TUÂN THỦ):
1. CẤM LẶP LẠI CÂU HỎI: Đọc kỹ lịch sử chat, tuyệt đối không lặp lại câu hỏi bạn đã hỏi ở các lượt trước.
2. ĐỐI THOẠI THỰC CHẤT VÀ TÔN TRỌNG NGỮ CẢNH:
   - Nếu học sinh chỉ chào hỏi: Chỉ chào lại ngắn gọn trong 1 câu và nhắc nhở học sinh trả lời câu hỏi trước.
   - Lượt 1: Học sinh vừa phản hồi câu hỏi mở đầu về động cơ chọn ngành:
     * NẾU HỌC SINH NÊU ĐỘNG CƠ TỪ GIA ĐÌNH / BỐ MẸ ĐỊNH HƯỚNG HOẶC CHỌN HỘ:
       ĐÂY LÀ ĐỘNG CƠ NGOẠI SINH. CẤM TUYỆT ĐỐI không được phản hồi: "Chọn ngành xuất phát từ sự yêu thích tự nhiên...".
       PHẢI PHẢN HỒI ĐÚNG BẢN CHẤT: "Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em. Bản thân em có thực sự tìm thấy sự hứng thú nào với công việc ${targetCareer} này không, hay em chỉ đang học để làm hài lòng bố mẹ?"
     * NẾU HỌC SINH KHẲNG ĐỊNH TỰ NGUYỆN YÊU THÍCH THỰC SỰ:
       Ghi nhận sự khẳng định chân thành, bóc tách sâu vào hoạt động chuyên môn thực tế hàng ngày: Hỏi cụ thể học sinh hào hứng với hoạt động chuyên môn nào (như soạn giáo án, đứng lớp truyền đạt kiến thức, kiên nhẫn tương tác hỗ trợ học sinh).
   - Lượt 2: BẮT BUỘC lồng ghép 2 yếu tố cốt lõi:
     * Xu hướng nghề nghiệp tương lai: Tác động của AI, Chuyển đổi số, Tự động hóa hoặc tái cơ cấu thị trường việc làm trong 5-10 năm tới (ví dụ: với Sư phạm, AI và công nghệ giáo dục EdTech đang thay đổi cách dạy học; giáo viên tương lai không chỉ truyền thụ kiến thức cơ học mà phải tích hợp công nghệ, rèn luyện kỹ năng tư duy bậc cao cho học sinh).
     * Thử thách học sinh về Năng lực thích ứng mới của ngành nghề (không chỉ làm các tác vụ cơ bản lặp đi lặp lại).
     * Đặt câu hỏi kết nối: Làm sao để thích ứng với tiêu chuẩn mới đó, và để thi/xét tuyển vào ngành ${targetCareer} tại ${targetSchool}, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?
   - Lượt 3: Khi học sinh phản hồi về tổ hợp môn xét tuyển:
     * NẾU HỌC SINH GIẢI THÍCH CHƯA TÌM HIỂU VÌ CHƯA ĐỊNH HÌNH MÔN DẠY / CHƯA BIẾT DẠY MÔN GÌ:
       BẮT BUỘC phải thấu cảm và khẳng định lý do của học sinh là hoàn toàn tự nhiên và hợp lý (chưa định hình môn dạy thì chưa thể biết tổ hợp môn). TUYỆT ĐỐI CẤM dùng từ "nghịch lý" hay phán xét! Gợi mở rằng môn dạy sẽ xuất phát từ nhóm năng lực trụ cột (Tự nhiên/Logic vs Xã hội/Ngôn ngữ).
     * NẾU HỌC SINH NÓI CHUNG CHUNG CHƯA TÌM HIỂU:
       Đánh giá cao sự trung thực, nhắc nhở tích cực rằng để hiện thực hóa ước mơ thì tổ hợp môn là công cụ thiết yếu. TUYỆT ĐỐI KHÔNG dùng từ "nghịch lý".
     * Gợi mở nhóm năng lực trụ cột (Tự nhiên/Logic vs Xã hội/Ngôn ngữ), nhắc Bước 3 sẽ tự tra cứu đề án.
     * Đặt câu hỏi mở trung lập: "Nhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?"
   - Lượt 4: BẮT BUỘC PHÂN TÍCH CHÍNH XÁC NGỮ NGHĨA MÔN HỌC SINH VỪA NÊU (ĐỌC KỸ TỪ "YẾU", "KÉM", "ĐUỐI", "SỢ" ĐỂ KHÔNG NHẦM VỚI MÔN GIỎI/TỐT/SỞ TRƯỜNG):
     * NẾU HỌC SINH YẾU CẢ TOÁN VÀ VĂN:
       Phải nhận diện ngay đây là thử thách rất lớn vì phần lớn các ngành Sư phạm tại ${targetSchool} đều xét tuyển có môn Toán hoặc Văn (A00, B00, C00, D01) với điểm chuẩn cao (thường từ 24 - 27 điểm).
       Định hướng 2 hướng thích ứng:
       (1) Tận dụng các môn còn lại học tốt (như Tiếng Anh, Sử, Địa, hoặc Hóa, Sinh) để tìm các ngành Sư phạm có tổ hợp tương ứng (ví dụ: Sư phạm Lịch sử - Địa lý, Sư phạm Tiếng Anh nếu khá ngoại ngữ, hoặc Sư phạm KHTN/Sinh học).
       (2) Nếu điểm 2 môn cốt lõi Toán - Văn quá thấp so với điểm chuẩn Sư phạm, cân nhắc phân khúc hệ Cao đẳng Sư phạm hoặc Cao đẳng Giáo dục nghề nghiệp thực hành để vừa sức.
     * NẾU HỌC SINH GIỎI TOÁN, YẾU VĂN: Định hướng Sư phạm Toán, Tin (khối A00, A01) để tận dụng Toán và tránh Văn.
     * NẾU HỌC SINH GIỎI VĂN, YẾU TOÁN: Định hướng Sư phạm Ngữ văn, Lịch sử, Tiểu học (khối C00, D01) để phát huy Văn và tránh Toán.
     * RA LỆNH DỨT KHOÁT: Yêu cầu học sinh bấm chuyển sang Bước 3 để tự tra cứu Đề án tuyển sinh. TUYỆT ĐỐI KHÔNG HỎI THÊM CÂU NÀO NỮA.
3. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
   Chỉ xuất ra duy nhất lời thoại đối thoại trực tiếp xưng "Thầy" gọi "em". Tuyệt đối không sinh tiêu đề, đề mục, checklist hay suy nghĩ nội tâm.
`;

    // 4. Chuẩn bị nội dung gửi lên Gemini API
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

    // 5. Cấu hình mô hình hoạt động ổn định nhất
    const candidateModelNames = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.28,
            topP: 0.85,
            maxOutputTokens: 1200
          }
        });

        const result = await model.generateContent({ contents });
        let resText = result?.response?.text();
        if (resText && resText.trim().length >= 25) {
          let cleaned = resText.trim()
            .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
            .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ).*?\]\s*/gi, '')
            .replace(/^#+.*?\n/gi, '');
          
          const speakStart = cleaned.search(/(?:Chào em|Thầy|Việc|Giỏi|Đó là|Dựa vào|Nắm chắc|Gia đình|Khi yếu)/i);
          if (speakStart > 0 && speakStart < 150) {
            cleaned = cleaned.slice(speakStart);
          }
          replyText = cleaned.trim();
          break;
        }
      } catch (err) {
        // Thử model tiếp theo
      }
    }

    // Heuristic Fallback bảo hiểm nếu các model bận
    if (!replyText) {
      const fallbackSubjectOrient = detectSubjectOrientation(trimmedMsg);

      if (studentTurns >= 4 || fallbackSubjectOrient.type !== 'OTHER') {
        if (fallbackSubjectOrient.type === 'BOTH_MATH_LIT_WEAK') {
          replyText = `Thầy ghi nhận sự trung thực và thẳng thắn rất đáng quý của em khi dũng cảm đối diện với năng lực học tập thực tế.\n\nKhi yếu cả hai môn cốt lõi là Toán và Ngữ văn, đây là một thử thách rất lớn đối với ước mơ vào ngành Sư phạm tại **${targetSchool}**, bởi vì phần lớn các tổ hợp xét tuyển truyền thống (như A00, B00, C00, D01) đều bắt buộc phải có Toán hoặc Văn với điểm chuẩn rất cao (thường từ 24 - 27 điểm).\n\nTuy nhiên, việc các môn còn lại em học tốt mở ra 2 hướng thích ứng rất cụ thể:\n1. **Tận dụng các môn còn lại học tốt**: Nếu em học tốt Tiếng Anh, Lịch sử, Địa lý hay Khoa học Tự nhiên (Hóa, Sinh), em hoàn toàn có thể tìm kiếm các tổ hợp tương ứng (ví dụ: Sư phạm Lịch sử - Địa lý, Sư phạm Tiếng Anh nếu khá ngoại ngữ, hoặc Sư phạm Khoa học Tự nhiên/Sinh học).\n2. **Cân nhắc phân khúc vừa sức**: Nếu điểm 2 môn cốt lõi Toán - Văn quá thấp so với điểm chuẩn đại học, em hãy cân nhắc phân khúc hệ **Cao đẳng Sư phạm** hoặc **Cao đẳng Giáo dục nghề nghiệp thực hành** (thời gian đào tạo 2.5 - 3 năm, chú trọng tay nghề, áp lực thi tuyển nhẹ nhàng hơn và vẫn đảm bảo cơ hội làm nghề giáo dục).\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
        } else if (fallbackSubjectOrient.type === 'LIT_STRONG_MATH_WEAK') {
          replyText = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Năng khiếu Ngữ văn là nền tảng rất vững chắc cho các ngành Sư phạm Ngữ văn, Giáo dục Tiểu học hoặc Sư phạm Khoa học Xã hội (khối C00, D01), giúp em phát huy trọn vẹn thế mạnh ngôn ngữ và hoàn toàn tránh được rào cản môn Toán!\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
        } else if (fallbackSubjectOrient.type === 'MATH_STRONG_LIT_WEAK') {
          replyText = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00: Toán-Lý-Hóa hoặc A01: Toán-Lý-Anh), hoàn toàn tránh được rào cản môn Ngữ văn!\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
        } else {
          replyText = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. Nắm chắc môn thế mạnh sẽ giúp em chọn đúng tổ hợp xét tuyển tối ưu và mở rộng cơ hội trúng tuyển.\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
        }
      } else if (studentTurns === 1) {
        if (isFamilyExtrinsic) {
          replyText = `Gia đình luôn mong muốn điều an toàn cho em, nhưng người trực tiếp học 4 năm và làm nghề suốt đời là chính em.\n\nBản thân em có thực sự tìm thấy sự hứng thú nào với công việc **${targetCareer}** này không, hay em chỉ đang học để làm hài lòng bố mẹ?`;
        } else {
          replyText = `Thầy rất ghi nhận sự thẳng thắn và khẳng định rõ ràng của em. Chọn ngành từ sự yêu thích tự nhiên là điểm tựa rất tốt, nhưng sự yêu thích ấy cần gắn liền với các công việc chuyên môn thực tế mỗi ngày.\n\nCụ thể trong các hoạt động chuyên môn của ngành **${targetCareer}** (như đứng lớp truyền đạt kiến thức, kiên nhẫn đồng hành cùng học sinh hay nghiên cứu bài giảng), hoạt động nào khiến em cảm thấy bản thân hào hứng và có nhiều năng lượng nhất?`;
        }
      } else if (studentTurns === 2) {
        replyText = `Thầy rất ủng hộ tinh thần trách nhiệm của em. Tuy nhiên trong 5-10 năm tới, AI, công nghệ giáo dục và chuyển đổi số sẽ tái cơ cấu mạnh mẽ thị trường việc làm. Giáo viên tương lai của ngành **${targetCareer}** sẽ không chỉ làm nhiệm vụ truyền thụ kiến thức cơ học mà bắt buộc phải làm chủ công nghệ, rèn luyện kỹ năng tư duy bậc cao cho học sinh và đối diện với chuẩn nghề nghiệp mới rất khắt khe.\n\nĐể thích ứng với những tiêu chuẩn mới đó, em dự định trang bị năng lực gì và để thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?`;
      } else {
        const isExplainingUndecided = [
          'chưa định hình', 'chua dinh hinh', 'chưa biết dạy môn', 'chưa biết môn nào',
          'chưa biết dạy gì', 'chưa chọn môn', 'chưa biết sư phạm gì', 'chưa rõ dạy môn',
          'chưa biết là dạy', 'chưa biết sẽ dạy', 'chưa định hình dạy', 'phân vân môn', 'chưa chọn được môn'
        ].some(k => lowerTrimmed.includes(k)) || (lowerTrimmed.includes('dạy môn') && (lowerTrimmed.includes('chưa') || lowerTrimmed.includes('không')));

        if (isExplainingUndecided) {
          replyText = `Thầy rất thấu cảm với lý do của em. Hoàn toàn tự nhiên và hợp lý khi chưa định hình mình muốn dạy môn gì thì rất khó để biết phải tra cứu tổ hợp môn nào!\n\nThực tế trong ngành Sư phạm, môn dạy sau này gắn chặt với nhóm năng lực trụ cột của em: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Lát nữa ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh của trường để kiểm chứng chi tiết.\n\nĐể giúp em định hình chính xác môn dạy và tổ hợp phù hợp nhất: Nhìn lại kết quả học tập ở trường, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn em còn nhiều khoảng cách nhất?`;
        } else {
          replyText = `Thầy đánh giá cao sự trung thực của em. Nuôi dưỡng ước mơ với ngành **${targetCareer}** là bước khởi đầu rất đẹp, nhưng để bước chân qua cánh cổng trường đại học, tổ hợp môn xét tuyển chính là chiếc chìa khóa quyết định mà em không thể bỏ quên!\n\nQuy chế tuyển sinh hiện nay chia ngành nghề thành các nhóm năng lực trụ cột rõ rệt: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh chính thức để làm rõ điều này.\n\nNhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?`;
        }
      }
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
