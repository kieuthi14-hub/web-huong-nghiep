// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Chuyên gia Phản tư Hành vi Socrates (Nghiên cứu CBAS - ViSEF Quốc gia 2026)

export function isUndecidedOrVague(career) {
  if (!career || typeof career !== 'string') return true;
  const clean = career.toLowerCase().trim();
  const vagueKeywords = ['chưa biết', 'chưa rõ', 'chưa có', 'mơ hồ', 'phân vân', 'chưa xác định', 'tùy', 'không biết', 'chua biet', 'chua ro', 'mo ho'];
  return clean.length === 0 || vagueKeywords.some(k => clean.includes(k));
}

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

function isTooShortOrEvasive(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  if (isGreetingOnly(text)) return false;

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

// CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN VISEF 2026
const SOCRATIC_PERSONA = `
BẠN LÀ TÁC NHÂN AI SOCRATES - MÔI TRƯỜNG CAN THIỆP TÂM LÝ VÀ PHẢN TƯ NHẬN THỨC NGHỀ NGHIỆP TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC HÀNH VI (CHUẨN VISEF 2026).

[RÀO CẢN SƯ PHẠM VÀ NGUYÊN TẮC HÀNH VI CỐT TỬ - BẮT BUỘC TUÂN THỦ 100%]:
1. Tuyệt đối KHÔNG trả lời thay học sinh, KHÔNG khuyên bảo áp đặt: Không nói "Em nên học ngành X", "Em bỏ ngành Y đi".
2. Tuyệt đối KHÔNG gán nhãn định kiến tiêu cực: CẤM các từ "bẫy nhận thức", "ảo tưởng", "sai lầm", "dốt", "yếu kém", "né tránh", "ấu trĩ".
3. Tuyệt đối KHÔNG khẳng định mã môn tổ hợp tuyển sinh cụ thể của từng trường (ví dụ: không cam kết trường A bắt buộc xét A00 hay D01) nhằm tránh ảo giác dữ liệu (AI Hallucination). Chỉ gợi ý nhóm năng lực trụ cột (Tư duy Logic & Dữ liệu vs Năng lực Ngôn ngữ & Xã hội).
4. Mỗi lượt phản hồi CHỈ GỒM:
   - 01 câu nhận diện/đồng cảm ngắn gọn với câu trả lời trước đó của học sinh.
   - 01 câu phân tích/bóc tách ngắn gọn.
   - Kết thúc bằng ĐÚNG 01 CÂU HỎI PHẢN TƯ DUY NHẤT để học sinh tự trả lời (riêng Vòng 4 là lời khóa phiên chuyển sang Bước 3, tuyệt đối không đặt thêm câu hỏi).
`;

function getSocraticDirective(round, anchor = {}, userMsg = '', specialInstruction = null) {
  const career = (anchor.target_career || anchor.target_major || '').trim() || 'ngành đã chọn';
  const uni = (anchor.target_university || anchor.target_school || '').trim() || 'trường đại học mục tiêu';
  const score = anchor.confidence_score || anchor.confidence_score_initial || '8';
  let holland = anchor.holland_code || 'RIASEC';
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    holland = anchor.holland_codes.join(', ');
  }

  const isBranchB = isUndecidedOrVague(career);
  const specialDirective = specialInstruction ? `\n\nCHỈ DẪN ĐẶC BIỆT KHI HỌC SINH BỘC LỘ RÀO CẢN / NỖI SỢ:\n${specialInstruction}\n` : '';

  if (!isBranchB) {
    // ==========================================
    // KỊCH BẢN NHÁNH A (ĐÃ CÓ MỤC TIÊU CỤ THỂ)
    // ==========================================
    switch (round) {
      case 1:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (KIỂM CHỨNG ĐỘNG CƠ & ĐỐI CHẤT MÃ HOLLAND):
- Học sinh chọn ngành ${career} tại ${uni}, điểm tự tin ${score}/10, nhóm Holland nổi trội: ${holland}.
- Học sinh vừa trả lời: "${userMsg}".
NHIỆM VỤ THỰC HIỆN (Theo đúng cấu trúc 3 phần):
1. Đúng 01 câu nhận diện & đồng cảm với mong muốn học sinh vừa chia sẻ.
2. Đúng 01 câu phân tích/bóc tách sự khác biệt giữa động cơ nội sinh (thực sự hiểu bản chất công việc) vs động cơ ngoại sinh (thích vì mác oai, trào lưu mạng, sĩ diện).
3. ĐÚNG 01 CÂU HỎI CHỐT: "Thầy thấy em chọn ngành ${career} trong khi nhóm nổi trội của em là ${holland}. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang 'hot' và được nhiều người khen ngợi?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng ấm áp, tuyệt đối không dán nhãn tiêu cực.`;

      case 2:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (THỬ THÁCH ÁP LỰC NGHỀ & CẢNH BÁO BÃO HÒA NHÂN LỰC):
- Ngành: ${career}, mã Holland: ${holland}.
- Học sinh vừa trả lời về động cơ chọn ngành: "${userMsg}".
NHIỆM VỤ THỰC HIỆN (Theo đúng cấu trúc 3 phần):
1. Đúng 01 câu đồng cảm và ghi nhận nỗ lực định hướng của học sinh.
2. Đúng 01 câu bóc tách thực tế thị trường: Tỷ lệ cạnh tranh cao, nguy cơ tự động hóa AI, yêu cầu sàng lọc khắt khe.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Ngành này đang có mức độ cạnh tranh đầu ra rất khốc liệt và nhiều công việc cơ bản đang dần bị công nghệ thay thế. Nếu kiên quyết theo đuổi, em dự định xây dựng năng lực nổi trội gì (ngoại ngữ chuyên sâu, kỹ năng thực hành hay dự án thực tế) để nhà tuyển dụng lựa chọn em thay vì hàng ngàn ứng viên khác?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng đồng hành, tôn trọng.`;

      case 3:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (ĐỐI CHẤT TỔ HỢP MÔN & ĐIỂM SỐ THỰC TẾ - KÍCH HOẠT ĐIỂM GÃY TP):
- Ngành ${career} tại ${uni}, điểm tự tin ${score}/10.
- Học sinh vừa trả lời về năng lực nổi trội / kế hoạch cạnh tranh: "${userMsg}".
NHIỆM VỤ THỰC HIỆN (Theo đúng cấu trúc 3 phần):
1. Đúng 01 câu ghi nhận kế hoạch rèn luyện của học sinh.
2. Đúng 01 câu bóc tách sự chênh lệch giữa điểm số thực tế với điểm chuẩn trúng tuyển.
3. ĐÚNG 01 CÂU HỎI CHỐT (Yêu cầu đối chiếu điểm tổng kết kỳ trước với điểm chuẩn 2 năm liền kề):
"Nhìn lại điểm tổng kết kỳ trước của các môn trong tổ hợp đó và đối chiếu với điểm chuẩn 2 năm gần nhất, em thấy mình đang ở ngưỡng an toàn, vừa sức hay đang có khoảng cách điểm số cần phải dồn nhiều nỗ lực nhất?"
Quy chuẩn: Dưới 120 từ. Tuyệt đối KHÔNG khẳng định mã tổ hợp cụ thể của từng trường nhằm tránh ảo giác AI.`;

      case 4:
      default:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (TÁI CẤU TRÚC MỤC TIÊU THEO MÔ HÌNH THÍCH ỨNG KÉP & CHUYỂN GIAO NHIỆM VỤ - TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
- Học sinh vừa trả lời về tương quan điểm số / môn sở trường: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu khen ngợi sự trung thực và bước trưởng thành nhận thức của học sinh qua các vòng đối thoại.
2. Dựa trên phản hồi ở Vòng 3 để định hướng giải pháp thích ứng kép:
   * Nếu còn thời gian (lớp 10/11) có đam mê: Lập kế hoạch bù đắp điểm số các môn trong tổ hợp.
   * Nếu điểm lý thuyết cách xa Đại học: Định hướng sang hệ Cao đẳng nghề thực hành (đào tạo 2.5 - 3 năm, chú trọng tay nghề, chi phí thấp, dễ có việc).
   * Nếu khoảng cách quá lớn hoặc lệch pha: Chuyển sang ngành phù hợp với môn học sở trường.
3. LỆNH KẾT THÚC PHIÊN CHAT BẮT BUỘC (TUYỆT ĐỐI KHÔNG HỎI THÊM):
   "Bây giờ, em hãy dừng suy đoán và bước sang Bước 3: Môi trường đối chứng dữ liệu thực tế. Nhiệm vụ của em là tự mở tab tra cứu Đề án tuyển sinh chính thức của trường mục tiêu, ghi nhận mã tổ hợp môn và điểm chuẩn 2 năm gần nhất để nhập vào bảng đối chứng!"
Quy chuẩn: Dưới 135 từ. Ấm áp, trao quyền tự quyết.`;
    }
  } else {
    // ==========================================
    // KỊCH BẢN NHÁNH B (MƠ HỒ, CHƯA CÓ MỤC TIÊU)
    // ==========================================
    switch (round) {
      case 1:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 1 (BÓC TÁCH TÂM LÝ BẦY ĐÀN & MỎ NEO MẠNG XÃ HỘI):
- Học sinh chưa có mục tiêu ngành học cụ thể, nhóm Holland nổi trội: ${holland}.
- Học sinh vừa trả lời: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu đồng cảm với cảm giác bối rối khi đứng trước quá nhiều lựa chọn.
2. Đúng 01 câu chỉ ra nguy cơ của việc để mạng xã hội hoặc bạn bè quyết định hộ cuộc đời mình.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Sau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?"
Quy chuẩn: Dưới 110 từ.`;

      case 2:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 2 (KHAI QUẬT ĐIỂM TỰA NỘI TẠI TỪ HOLLAND VÀ MÔN HỌC SỞ TRƯỜNG):
- Học sinh vừa phản hồi về nỗi sợ chọn sai nghề: "${userMsg}". Nhóm Holland: ${holland}.
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu ghi nhận sự tỉnh thức và mong muốn tìm thấy tiếng nói bên trong của học sinh.
2. Đúng 01 câu kết nối nhóm tính cách Holland (${holland}) với các nhiệm vụ học tập thực tế ở trường.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Kết quả Holland cho thấy em có thế mạnh ở nhóm ${holland}. Nhìn lại việc học ở trường, khi làm các nhiệm vụ liên quan đến nhóm năng lực này, em có thấy mình tập trung và có nhiều năng lượng nhất không?"
Quy chuẩn: Dưới 110 từ.`;

      case 3:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 3 (THU HẸP PHỄU LỰA CHỌN XUỐNG 2 KỊCH BẢN NGHỀ NGHIỆP):
- Học sinh vừa chia sẻ về các môn học / nhiệm vụ có năng lượng: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu trân trọng và ghi nhận thế mạnh tự nhiên của học sinh.
2. Đúng 01 câu gợi mở 2 hướng đi cụ thể phù hợp với thế mạnh vừa xác định: 1 hướng thiên về Học thuật đại học, 1 hướng thiên về Thực hành nghề/dịch vụ.
3. ĐÚNG 01 CÂU HỎI CHỐT: "Từ thế mạnh đó, thầy gợi ý 2 hướng đi: Hướng A là ngành học thuật đại học và Hướng B là ngành kỹ thuật/dịch vụ thực hành. Hướng đi nào khiến em cảm thấy tò mò và muốn tìm hiểu sâu hơn?"
Quy chuẩn: Dưới 120 từ.`;

      case 4:
      default:
        return `${SOCRATIC_PERSONA}${specialDirective}
BỐI CẢNH VÒNG 4 (TRAO QUYỀN TỰ QUYẾT & ĐIỀU HƯỚNG SANG BƯỚC 3 - TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
- Học sinh vừa chọn hướng nghề nghiệp tò mò muốn tìm hiểu: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Đúng 01 câu xác nhận lựa chọn sơ bộ của học sinh, khích lệ tính tự chủ.
2. Đúng 01 câu khẳng định việc có mục tiêu ban đầu là bước ngoặt quan trọng để thoát khỏi sự mơ hồ.
3. LỆNH KẾT THÚC PHIÊN CHAT BẮT BUỘC (TUYỆT ĐỐI KHÔNG HỎI THÊM):
   "Em vừa tự tay định hình mục tiêu đầu tiên cho bản thân. Bây giờ, em hãy chuyển sang Bước 3 để tự tra cứu Đề án tuyển sinh xem ngành này ở các trường đại học hoặc cao đẳng gần địa phương yêu cầu điều kiện gì nhé!"
Quy chuẩn: Dưới 120 từ.`;
    }
  }
}

function generateSocraticHeuristicReply(round, anchor = {}, userMsg = '', isFinal = false, specialInstruction = null) {
  const career = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const uni = (anchor.target_university || anchor.target_school || '').trim() || 'Đại học Bách Khoa';
  const score = anchor.confidence_score || anchor.confidence_score_initial || '8';
  let holland = anchor.holland_code || 'RIASEC';
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    holland = anchor.holland_codes.join(', ');
  }
  const isBranchB = isUndecidedOrVague(career);

  // Khi học sinh bộc lộ nỗi sợ / rào cản cụ thể
  if (specialInstruction) {
    return `Thầy rất thấu cảm và trân trọng sự trung thực của em khi chia sẻ: "${userMsg}".\n\n` +
      `Những rào cản kỹ năng như giao tiếp trước đám đông hay áp lực tính toán đều có thể rèn luyện và bồi đắp được theo thời gian. Tuy nhiên, đối chiếu với nhóm tính cách Holland của em (${holland}), điều cốt lõi là em cần lắng nghe xem bản thân có thực sự tìm thấy niềm hứng khởi khi gắn bó với đặc thù công việc hay không?\n\n` +
      `Nếu phải đối diện với tình huống này thường xuyên trong thực tế nghề nghiệp, em dự định sẽ chuẩn bị cho mình điểm tựa tâm lý hoặc kỹ năng gì để vượt qua?`;
  }

  if (!isBranchB) {
    // NHÁNH A (ĐÃ CÓ MỤC TIÊU CỤ THỂ)
    if (isFinal || round >= 4) {
      return `Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\n` +
        `Dựa trên tương quan năng lực hiện tại, em hãy cân nhắc 3 hướng đi thích ứng: lập kế hoạch dồn lực cải thiện điểm số nếu còn thời gian lớp 10/11; định hướng phân khúc Cao đẳng nghề thực hành (đào tạo 2.5 - 3 năm, chú trọng tay nghề, chi phí thấp, dễ có việc) nếu điểm lý thuyết cách xa Đại học; hoặc chuyển sang ngành phù hợp với môn học sở trường.\n\n` +
        `Bây giờ, em hãy dừng suy đoán và bước sang **Bước 3: Môi trường đối chứng dữ liệu thực tế**. Nhiệm vụ của em là tự mở tab tra cứu Đề án tuyển sinh chính thức của trường mục tiêu, ghi nhận mã tổ hợp môn và điểm chuẩn 2 năm gần nhất để nhập vào bảng đối chứng!`;
    }

    switch (round) {
      case 1:
        return `Thầy rất trân trọng mong muốn tốt đẹp và những suy nghĩ thẳng thắn mà em vừa chia sẻ: "${userMsg}".\n\n` +
          `Tuy nhiên, giữa việc thích một ngành vì thấy nó hấp dẫn trên truyền thông và việc thực sự yêu thích các hoạt động công việc chuyên môn hàng ngày của ngành **${career}** là một khoảng cách rất lớn.\n\n` +
          `Thầy thấy em chọn ngành **${career}** trong khi nhóm nổi trội của em là **${holland}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;

      case 2:
        return `Thầy rất ủng hộ tinh thần tích cực và khát vọng hòa nhập xu thế của em.\n\n` +
          `Dưới góc nhìn khách quan của thị trường 4.0, sự cạnh tranh về năng suất và tối ưu chi phí đang diễn ra rất mạnh mẽ khi công nghệ và AI dần thay thế các tác vụ cơ bản.\n\n` +
          `Ngành này đang có mức độ cạnh tranh đầu ra rất khốc liệt và nhiều công việc cơ bản đang dần bị công nghệ thay thế. Nếu kiên quyết theo đuổi, em dự định xây dựng năng lực nổi trội gì (ngoại ngữ chuyên sâu, kỹ năng thực hành hay dự án thực tế) để nhà tuyển dụng lựa chọn em thay vì hàng ngàn ứng viên khác?`;

      case 3:
        return `Thầy đánh giá rất cao sự chủ động tư duy về năng lực cạnh tranh thực tế của em.\n\n` +
          `Tuy nhiên, để cánh cửa tuyển sinh thực sự mở ra, mức tự tin ${score}/10 cần được đo lường bằng tương quan điểm số học thuật thực tế so với điểm chuẩn thực tế.\n\n` +
          `Nhìn lại điểm tổng kết kỳ trước của các môn trong tổ hợp đó và đối chiếu với điểm chuẩn 2 năm gần nhất, em thấy mình đang ở ngưỡng an toàn, vừa sức hay đang có khoảng cách điểm số cần phải dồn nhiều nỗ lực nhất?`;

      default:
        return `Thầy ghi nhận chia sẻ của em. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Môi trường đối chứng dữ liệu thực tế**!`;
    }
  } else {
    // NHÁNH B (MƠ HỒ, CHƯA CÓ MỤC TIÊU)
    if (isFinal || round >= 4) {
      return `Thầy chúc mừng em vì đã dũng cảm vượt qua sự mơ hồ ban đầu để tự tay định hình mục tiêu đầu tiên cho bản thân.\n\n` +
        `Sự tự chủ này là chiếc chìa khóa quan trọng nhất giúp em làm chủ hành trình nghề nghiệp tương lai mà không bị cuốn theo đám đông.\n\n` +
        `Em vừa tự tay định hình mục tiêu đầu tiên cho bản thân. Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tra cứu Đề án tuyển sinh xem ngành này ở các trường đại học hoặc cao đẳng gần địa phương yêu cầu điều kiện gì nhé!`;
    }

    switch (round) {
      case 1:
        return `Thầy rất thấu cảm với cảm giác ngập ngừng khi đứng trước quá nhiều thông tin trên mạng xã hội.\n\n` +
          `Việc chưa xác định được ngành là điều tự nhiên, nhưng để người khác quyết định hộ cuộc đời mình là một rủi ro rất lớn.\n\n` +
          `Sau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`;

      case 2:
        return `Thầy ghi nhận sự tỉnh thức và tinh thần trách nhiệm với tương lai của chính bản thân em.\n\n` +
          `Điểm tựa bền vững nhất để chọn nghề không nằm ở lời khen bên ngoài mà xuất phát từ chính thế mạnh tự nhiên và sự hứng khởi bên trong.\n\n` +
          `Kết quả Holland cho thấy em có thế mạnh ở nhóm **${holland}**. Nhìn lại việc học ở trường, khi làm các nhiệm vụ liên quan đến nhóm năng lực này, em có thấy mình tập trung và có nhiều năng lượng nhất không?`;

      case 3:
        return `Thầy đánh giá cao việc em đã tìm thấy những tín hiệu tích cực từ các môn học sở trường của mình.\n\n` +
          `Từ nhóm thế mạnh **${holland}**, thị trường nghề nghiệp thường mở ra 2 ngã rẽ: một hướng thiên về Học thuật đại học và một hướng thiên về Kỹ năng thực hành dịch vụ chuyên sâu.\n\n` +
          `Từ thế mạnh đó, thầy gợi ý 2 hướng đi: Hướng A là ngành nghiên cứu/quản lý học thuật và Hướng B là ngành kỹ thuật/dịch vụ thực hành. Hướng đi nào khiến em cảm thấy tò mò và muốn tìm hiểu sâu hơn?`;

      default:
        return `Thầy ghi nhận phản hồi của em. Giờ là lúc em chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** nhé!`;
    }
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
    const isFinalRound = Boolean(isFinal) || currentRound >= maxRoundsSetting;

    const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
    const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
    const hollandCode = anchor.holland_code || 'RIASEC';
    const isBranchB = isUndecidedOrVague(targetCareer);

    // QUY TẮC 1: Nếu học sinh chỉ chào hỏi (Ví dụ: "chào thầy", "hello", "dạ")
    // Tuyệt đối KHÔNG tính đây là một vòng phản tư, KHÔNG tăng biến đếm vòng.
    if (isGreetingOnly(trimmedMessage)) {
      const greetingReply = isBranchB
        ? `Chào em. Thầy trò mình cùng trò chuyện cởi mở để khai mở bản thân nhé. Sau này người trực tiếp đi học và chịu trách nhiệm với công việc là chính em. Nếu cứ chọn theo trào lưu mà không biết mình muốn gì, em có sợ một ngày thức dậy nhận ra mình đang làm một công việc bản thân không hề yêu thích?`
        : `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;

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

    // QUY TẮC 3 (ĐẶC BIỆT VISEF 2026): Vòng 3 Nhánh A nếu học sinh nói chưa tìm hiểu tổ hợp môn
    const lowerTrimmed = trimmedMessage.toLowerCase();
    const isAskingCombo = [
      'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
      'chưa tìm hiểu', 'chưa biết', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
      'chưa xem', 'em chưa biết', 'chưa tìm', 'không rõ'
    ].some(k => lowerTrimmed.includes(k));

    if (!isBranchB && currentRound === 3 && isAskingCombo) {
      const directReply = `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\nQuy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực trụ cột: hoặc thiên về Tư duy Logic & Dữ liệu (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Năng lực Ngôn ngữ & Xã hội (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\nNhìn lại kết quả học tập kỳ trước của em: Giữa các nhóm môn đó, đâu là môn sở trường tạo ưu thế cạnh tranh cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất (hoặc em có cảm thấy áp lực với môn học nào không)?`;
      return res.status(200).json({
        reply: directReply,
        round: currentRound,
        isFinal: false,
        advanced: true
      });
    }

    // Kiểm tra nếu học sinh bộc lộ nỗi sợ / rào cản cụ thể hoặc có specialInstruction từ client
    const hasFear = lowerTrimmed.includes("tự tin") || lowerTrimmed.includes("đám đông") || lowerTrimmed.includes("sợ") || lowerTrimmed.includes("yếu") || lowerTrimmed.includes("lo lắng") || lowerTrimmed.includes("áp lực");
    const specialInstruction = body?.specialInstruction || (hasFear
      ? `Học sinh đang bộc lộ nỗi sợ: "${trimmedMessage}". Hãy thấu cảm trước trong 1 câu ngắn, giải thích rằng kỹ năng này có thể rèn luyện được, NHƯNG đối chiếu với mã Holland ${hollandCode} của học sinh để hỏi xem tính cách sâu bên trong có thực sự phù hợp với đặc thù công việc hay không.`
      : null);

    const activeSystemInstruction = getSocraticDirective(currentRound, anchor, trimmedMessage, specialInstruction);

    const targetMaxTokens = 1000;
    const targetTemperature = isFinalRound ? 0.3 : 0.4;

    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof Buffer !== 'undefined'
      ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
      : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro'
    ].filter(Boolean);

    const contents = [];
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
      contents[contents.length - 1].parts[0].text += `\n\n${trimmedMessage}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: trimmedMessage }]
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

    for (const m of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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
          if (replyText && replyText.length >= 35) {
            console.log(`Successfully responded using model: ${m} (Round ${currentRound})`);
            break;
          } else if (replyText) {
            console.warn(`Model ${m} trả lời quá ngắn (${replyText.length} ký tự).`);
            replyText = null;
          }
        }
      } catch (err) {
        // Tiếp tục thử model tiếp theo
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!replyText) {
      console.warn('Sử dụng Socratic Heuristic Fallback chuẩn ViSEF 2026.');
      replyText = generateSocraticHeuristicReply(currentRound, anchor, trimmedMessage, isFinalRound, specialInstruction);
    }

    return res.status(200).json({ 
      reply: replyText,
      round: currentRound,
      isFinal: isFinalRound
    });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    const fallbackReply = generateSocraticHeuristicReply(1, {}, '', false);
    return res.status(200).json({ 
      reply: fallbackReply,
      round: 1,
      isFinal: false,
      fallback: true
    });
  }
}
