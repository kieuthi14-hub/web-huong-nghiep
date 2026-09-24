// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Chuyên gia Phản tư Hành vi Socrates (Nghiên cứu Khoa học Hành vi ViSEF 2026)

const FINAL_CHALLENGE_PROMPT = (targetCareer) => `# CHỈ THỊ LƯỢT 4 - KẾT THÚC PHIÊN (ĐÃ ĐỦ DỮ KIỆN):
TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO.
BẮT BUỘC đưa ra đúng phản hồi đúc kết sau:
"Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành ${targetCareer} đến sự thiếu hụt dữ liệu tuyển sinh chính thức.

Bây giờ, em hãy chuyển sang Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế để xây dựng cơ sở vững chắc cho quyết định của mình!"`;

function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const greetings = [
    'chào thầy', 'chao thay', 'chào bạn', 'chao ban', 'xin chào', 'xin chao',
    'chào ai', 'hello', 'hi', 'alo', 'chào', 'chao', 'em chào thầy', 'em chao thay',
    'dạ', 'da', 'dạ thầy', 'da thay', 'vâng', 'vang', 'dạ em chào thầy', 'thầy ơi', 'thay oi',
    'dạ vâng', 'da vang', 'vâng ạ', 'vang a'
  ];
  return greetings.includes(clean);
}

function isConfusionOrAnxiety(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const anxietyKeywords = [
    'hoang mang', 'lo lắng', 'lo lang', 'bối rối', 'boi roi', 'sợ', 'so hai',
    'băn khoăn', 'ban khoan', 'lo sợ', 'mơ hồ', 'mo ho', 'rối bời', 'roi boi',
    'áp lực', 'ap luc', 'lo quá', 'lo qua', 'em lo', 'hoang mang quá'
  ];
  return anxietyKeywords.some(k => clean.includes(k));
}

function isUncertaintyOrHelpRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~:;\-_]/g, '');
  const keywords = [
    'chưa biết', 'chua biet', 'không biết', 'khong biet', 'chưa rõ', 'chua ro',
    'chưa nghĩ', 'chua nghi', 'chưa tìm hiểu', 'chua tim hieu', 'chưa có', 'chua co',
    'em chịu', 'chịu thôi', 'thầy giúp', 'thay giup', 'nhờ thầy', 'nho thay',
    'giúp em', 'giup em', 'chỉ em với', 'chi em voi', 'tư vấn giúp', 'tu van giup',
    'chưa tính', 'chua tinh', 'không rõ', 'khong ro', 'bí quá', 'em không rõ',
    'chưa thể', 'chua the', 'giúp với', 'giup voi', 'giúp em với', 'giup em voi',
    'chưa xác định', 'chua xac dinh', 'chưa lường', 'chua luong', 'khó quá', 'kho qua',
    'không biết nguồn', 'khong biet nguon', 'chưa biết nguồn', 'chua biet nguon',
    'tìm ở đâu', 'tim o dau', 'không biết tra', 'khong biet tra'
  ];
  return keywords.some(k => clean.includes(k));
}

function isTooShortOrEvasive(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  if (isGreetingOnly(text)) return false;
  if (isUncertaintyOrHelpRequest(text)) return false;
  if (isConfusionOrAnxiety(text)) return false;

  const evasivePhrases = [
    'thích thì học', 'thich thi hoc', 'thích', 'thich', 'tùy', 'tuy', 'sao cũng được',
    'sao cung duoc', 'ok', 'ừ', 'u', 'uh', 'uhm', 'ko', 'k', 'không', 'khong',
    'bình thường', 'binh thuong', 'không có gì', 'khong co gi',
    'thích thế', 'thich the', 'kệ', 'ke', 'ai biết', 'ai biet',
    'được', 'duoc', 'chắc thế', 'chac the'
  ];
  if (evasivePhrases.includes(clean)) return true;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 3 || clean.length < 10) {
    return true;
  }
  return false;
}

function getSocraticDirective(round, anchor = {}, userMsg = '') {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';

  let hollandCode = anchor.holland_code || '';
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    hollandCode = anchor.holland_codes.join(', ');
  } else if (!hollandCode) {
    hollandCode = 'Nghiên cứu - Kỹ thuật';
  }

  const baseDirective = `BẠN LÀ: "Chuyên gia Phản tư Hành vi Socrates" (Nghiên cứu Khoa học Hành vi ViSEF 2026).
DỮ LIỆU ĐÃ XÁC THỰC:
- Ngành chọn: ${targetCareer} (BẮT BUỘC dùng đúng tên ngành "${targetCareer}" trong mọi câu phản hồi, TUYỆT ĐỐI KHÔNG dùng cụm từ "ngành em chọn" hay "ngành đã chọn").
- Trường: ${targetUniversity}
- Mức tự tin: ${confidenceScore}/10
- Thiên hướng Holland: ${hollandCode}

QUY TẮC PHẢN ỨNG TÂM LÝ BẮT BUỘC:
1. Khi học sinh bộc lộ sự bối rối hoặc nói "em hoang mang", "em lo lắng":
   - Phải có 1 câu trấn an duy lý: "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm."
   - Tuyệt đối không nói "Thầy ghi nhận kế hoạch thích ứng" khi học sinh chưa đưa ra kế hoạch.
2. Khi học sinh nói "em chưa biết" hoặc "không biết nguồn":
   - Công nhận sự trung thực, không trách móc, không mớm câu trả lời. Hướng dẫn học sinh đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.

QUY TẮC BẮT BUỘC:
1. KHÔNG khen ngợi sáo rỗng, KHÔNG nịnh bợ. Giữ thái độ phản biện khách quan, điềm đạm.
2. Trả lời dưới 100 từ, tối đa 2 đoạn ngắn.
3. Mỗi lượt CHỈ ĐẶT ĐÚNG 1 CÂU HỎI (trừ Lượt 4 thì đưa ra lời đúc kết và DỪNG CÂU HỎI).
4. BẮT BUỘC dùng tên ngành "${targetCareer}".

LỘ TRÌNH ĐỐI THOẠI 4 LƯỢT NGHIÊM NGẶT:
- LƯỢT 1 (Đang xử lý câu trả lời về năng lực): Soi chiếu năng lực phổ thông với độ khó đại học. Chuyển tiếp bằng câu hỏi về nguy cơ tự động hóa của AI đối với ngành ${targetCareer} trong 4-5 năm tới.
- LƯỢT 2 (Đang xử lý câu trả lời về tự động hóa): Đánh giá nhận thức về công nghệ. Đặt câu hỏi về Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt để thích ứng nếu ngành ${targetCareer} biến động.
- LƯỢT 3 (Đang xử lý câu trả lời về kỹ năng thích ứng): Nhận diện mức độ chuẩn bị của học sinh. Đặt câu hỏi chốt: "Em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của ${targetCareer} tại ${targetUniversity} chưa, hay vẫn dựa trên cảm nhận cá nhân?"
- LƯỢT 4 (KẾT THÚC PHIÊN - ĐÃ ĐỦ DỮ KIỆN): 
  TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO.
  Đưa ra phản hồi đúc kết:
  "Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành ${targetCareer} đến sự thiếu hụt dữ liệu tuyển sinh chính thức. 
  Bây giờ, em hãy chuyển sang Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế để xây dựng cơ sở vững chắc cho quyết định của mình!"`;

  if (isConfusionOrAnxiety(userMsg)) {
    return baseDirective + `\n\n[CHỈ THỊ KHI HỌC SINH HOANG MANG / LO LẮNG]:
Học sinh đang bộc lộ bối rối / lo lắng.
BẮT BUỘC mở đầu bằng câu trấn an duy lý: "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm."
TUYỆT ĐỐI KHÔNG nói "Thầy ghi nhận kế hoạch thích ứng" vì học sinh chưa đưa ra kế hoạch.
Sau đó, tiếp tục câu hỏi định hướng của Lượt ${round}.`;
  }

  if (isUncertaintyOrHelpRequest(userMsg)) {
    return baseDirective + `\n\n[CHỈ THỊ KHI HỌC SINH NÓI "CHƯA BIẾT" HOẶC "KHÔNG BIẾT NGUỒN"]:
Công nhận sự trung thực của học sinh, không trách móc, không mớm câu trả lời.
Hướng dẫn học sinh đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.
Sau đó tiếp tục câu hỏi định hướng của Lượt ${round}.`;
  }

  switch (round) {
    case 1:
      return baseDirective + `\n\n[HIỆN TẠI ĐANG Ở LƯỢT 1]:
Học sinh vừa trả lời về năng lực học tập thực tế và điểm số đối với ngành "${targetCareer}".
Nhiệm vụ:
- Soi chiếu năng lực phổ thông với độ khó đại học của ngành "${targetCareer}" (dưới 40 từ, khách quan, không phán xét).
- Chuyển tiếp bằng câu hỏi về nguy cơ tự động hóa của AI đối với ngành "${targetCareer}" trong 4-5 năm tới: "Trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành ${targetCareer}, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?"`;

    case 2:
      return baseDirective + `\n\n[HIỆN TẠI ĐANG Ở LƯỢT 2]:
Học sinh vừa trả lời về nguy cơ AI và kỹ năng chuyên sâu trong ngành "${targetCareer}".
Nhiệm vụ:
- Đánh giá nhận thức về công nghệ của học sinh (dưới 40 từ).
- Đặt câu hỏi về Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt để thích ứng nếu ngành "${targetCareer}" biến động: "Nếu thị trường lao động ngành ${targetCareer} bước vào chu kỳ biến động hoặc bão hòa khi em tốt nghiệp, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng?"`;

    case 3:
      return baseDirective + `\n\n[HIỆN TẠI ĐANG Ở LƯỢT 3]:
Học sinh vừa trả lời về kỹ năng thích ứng và phương án việc làm.
Nhiệm vụ:
- Nhận diện mức độ chuẩn bị của học sinh (dưới 40 từ, TUYỆT ĐỐI KHÔNG nói "Thầy ghi nhận kế hoạch thích ứng" khi học sinh chưa đưa ra kế hoạch cụ thể).
- Đặt câu hỏi chốt: "Em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của ${targetCareer} tại ${targetUniversity} chưa, hay vẫn dựa trên cảm nhận cá nhân?"`;

    case 4:
    default:
      return FINAL_CHALLENGE_PROMPT(targetCareer);
  }
}

function generateSocraticHeuristicReply(round, anchor = {}, userMsg = '', isFinal = false) {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';

  if (isFinal || round >= 4) {
    return `Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành **${targetCareer}** đến sự thiếu hụt dữ liệu tuyển sinh chính thức.\n\nBây giờ, em hãy chuyển sang **Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế** để xây dựng cơ sở vững chắc cho quyết định của mình!`;
  }

  // 1. Phản ứng tâm lý khi học sinh bộc lộ bối rối / hoang mang / lo lắng
  if (isConfusionOrAnxiety(userMsg)) {
    const reassurance = "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm.";
    if (round === 1) {
      return `${reassurance}\n\nBên cạnh độ khó học thuật ở bậc đại học, một thách thức lớn trong 4-5 năm tới là làn sóng tự động hóa từ AI đối với ngành **${targetCareer}**. Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;
    } else if (round === 2) {
      return `${reassurance}\n\nĐể chủ động trước sự phát triển của công nghệ, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành **${targetCareer}** biến động sau khi tốt nghiệp?`;
    } else {
      return `${reassurance}\n\nMột quyết định nghề nghiệp có trách nhiệm cần điểm tựa số liệu vững chắc. Em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
    }
  }

  // 2. Phản ứng tâm lý khi học sinh nói "chưa biết" hoặc "không biết nguồn"
  if (isUncertaintyOrHelpRequest(userMsg)) {
    const guidance = "Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống thông tin này. Em hãy đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.";
    if (round === 1) {
      return `${guidance}\n\nBên cạnh độ khó học thuật ở bậc đại học, một thách thức lớn trong 4-5 năm tới là làn sóng tự động hóa từ AI đối với ngành **${targetCareer}**. Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;
    } else if (round === 2) {
      return `${guidance}\n\nCòn bây giờ, để chuẩn bị cho tương lai nếu ngành **${targetCareer}** biến động, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng?`;
    } else {
      return `${guidance}\n\nĐể hoàn thiện cơ sở dữ liệu cho quyết định của mình, em đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;
    }
  }

  if (isGreetingOnly(userMsg)) {
    return `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành **${targetCareer}**?`;
  }

  // 3. Phản hồi đối thoại 4 lượt chuẩn hóa
  switch (round) {
    case 1:
      return `Thầy đã ghi nhận phản hồi của em về năng lực phổ thông. Tuy nhiên, chương trình đại học ngành **${targetCareer}** đòi hỏi tính tự học và độ khó học thuật vượt trội hơn nhiều.\n\nBên cạnh đó, trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;

    case 2:
      return `Nhận thức về tác động của công nghệ trong ngành **${targetCareer}** là rất cần thiết, nhưng thị trường việc làm luôn biến động khó lường.\n\nEm đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành **${targetCareer}** bước vào chu kỳ biến động hoặc bão hòa khi em tốt nghiệp?`;

    case 3:
      return `Mức độ chuẩn bị cho thấy em đã bắt đầu suy nghĩ về khả năng thích ứng. Tuy nhiên, một quyết định ở mức tự tin **${confidenceScore}/10** cần được xây dựng trên dữ liệu xác thực thay vì ước đoán.\n\nEm đã từng đối chiếu số liệu tuyển sinh thực tế (điểm chuẩn, học phí, chỉ tiêu) của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn dựa trên cảm nhận cá nhân?`;

    case 4:
    default:
      return `Qua 4 vòng đối thoại, em đã dũng cảm nhìn nhận các khoảng trống: từ năng lực thực tế, rủi ro tự động hóa của ngành **${targetCareer}** đến sự thiếu hụt dữ liệu tuyển sinh chính thức.\n\nBây giờ, em hãy chuyển sang **Bước 3: Tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế** để xây dựng cơ sở vững chắc cho quyết định của mình!`;
  }
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
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn('Lỗi parse JSON body:', e);
      }
    }

    const { message, history = [], round, isFinal, anchor = {} } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    const trimmedMessage = message.trim();
    const userHistoryTurns = Array.isArray(history)
      ? history.filter(h => h.role === 'user').length
      : 0;
    const currentRound = Number(round) || (userHistoryTurns + 1);
    const maxRoundsSetting = Number(body?.maxRounds) || 4;
    const isFinalRound = Boolean(isFinal) || currentRound > maxRoundsSetting;

    const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';

    // QUY TẮC 1: Nếu học sinh chỉ chào hỏi (Ví dụ: "chào thầy", "hello", "dạ")
    // Tuyệt đối KHÔNG tính đây là một vòng phản tư, KHÔNG tăng biến đếm vòng.
    if (isGreetingOnly(trimmedMessage)) {
      const greetingReply = currentRound === 1
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành **${targetCareer}**?`
        : currentRound === 2
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy tập trung trả lời câu hỏi ở trên về nguy cơ tự động hóa bởi AI và kỹ năng chuyên sâu đặc thù không thể thay thế của em trong ngành **${targetCareer}**.`
        : currentRound === 3
        ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy tập trung trả lời câu hỏi ở trên về Bộ kỹ năng chuyển đổi và kế hoạch việc làm linh hoạt để thích ứng nếu ngành **${targetCareer}** biến động.`
        : `Chào em. Cuộc đối thoại đã hoàn thành. Em hãy chuyển sang Bước 3: Tra cứu dữ liệu khách quan để kiểm chứng thông tin nhé.`;

      return res.status(200).json({
        reply: greetingReply,
        round: currentRound,
        isFinal: false,
        advanced: false
      });
    }

    // QUY TẮC 2: Nếu học sinh né tránh hoặc trả lời quá ngắn (Dưới 1 câu hoàn chỉnh / < 3 từ / < 10 ký tự)
    // Giữ nguyên câu hỏi và yêu cầu học sinh làm rõ, KHÔNG tăng biến đếm vòng.
    if (isTooShortOrEvasive(trimmedMessage)) {
      return res.status(200).json({
        reply: `Câu trả lời này chưa đủ dữ kiện để phản biện. Em hãy đưa ra dẫn chứng cụ thể hơn về ngành **${targetCareer}**.`,
        round: currentRound,
        isFinal: false,
        advanced: false
      });
    }
    
    let activeSystemInstruction = '';
    if (isFinalRound) {
      activeSystemInstruction = FINAL_CHALLENGE_PROMPT(targetCareer);
    } else {
      activeSystemInstruction = getSocraticDirective(currentRound, anchor, trimmedMessage);
    }

    const targetMaxTokens = 1200; // Đặt 1200 tokens để bao gồm cả thinking tokens (~400) và câu trả lời hoàn chỉnh (~200)
    const targetTemperature = isFinalRound ? 0.3 : 0.4;

    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof Buffer !== 'undefined'
      ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
      : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
    // Thứ tự ưu tiên model có tốc độ phản hồi nhanh nhất và còn quota khả dụng
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3-flash-preview',
      'gemini-flash-latest',
      'gemini-3.5-flash'
    ].filter(Boolean);

    const contents = [];

    // Chỉ giữ lại tối đa 6 lượt chat gần nhất để tránh độ trễ xử lý context dài
    const trimmedHistory = Array.isArray(history) ? history.slice(-6) : [];

    for (const item of trimmedHistory) {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500); // 5.5s mỗi model để đủ thời gian cho thinking và hoàn thành câu

      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
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
              replyText = replyText
                .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
                .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ).*?\]\s*/i, '')
                .replace(/^#+.*?(CHỈ ĐẠO|CHỈ THỊ).*?\n/i, '')
                .trim();
            }
          }
          // Kiểm tra xem phản hồi có bị cắt ngang/cộc lốc không (ít hơn 35 ký tự)
          if (replyText && replyText.length >= 35) {
            console.log(`Successfully responded using model: ${m} (Round ${currentRound}, length: ${replyText.length})`);
            break;
          } else if (replyText) {
            console.warn(`Model ${m} trả lời quá ngắn/bị cắt ngang (${replyText.length} ký tự): "${replyText}". Bỏ qua để dùng câu hoàn chỉnh.`);
            replyText = null;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
          console.warn(`Model ${m} failed (${response.status}):`, lastError);
        }
      } catch (err) {
        lastError = err?.message || String(err);
        console.warn(`Model ${m} request exception:`, lastError);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // Nếu các model Gemini đều bận/hết quota (429/503), kích hoạt bộ phản hồi Socrates dự phòng chuẩn hóa
    if (!replyText) {
      console.warn('Tất cả model Gemini bận/hết quota. Sử dụng Socratic Heuristic Fallback để không làm gián đoạn học sinh.');
      replyText = generateSocraticHeuristicReply(currentRound, anchor, message.trim(), isFinalRound);
    }

    return res.status(200).json({ 
      reply: replyText,
      round: currentRound,
      isFinal: isFinalRound
    });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    // Luôn trả về phản hồi Socrates thay vì lỗi 500 để người dùng không bao giờ bị đứng yên
    const fallbackReply = generateSocraticHeuristicReply(1, {}, '', false);
    return res.status(200).json({ 
      reply: fallbackReply,
      round: 1,
      isFinal: false,
      fallback: true
    });
  }
}
