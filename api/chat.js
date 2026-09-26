// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Chuyên gia Phản tư Hành vi Socrates (Nghiên cứu CBAS - ViSEF Quốc gia 2026)

const FINAL_CHALLENGE_PROMPT = (targetCareer, targetUniversity = 'Đại học Bách Khoa', confidenceScore = '8') => `# CHỈ THỊ LƯỢT 4 - ĐÚC KẾT PHẢN TƯ (TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO.
Nhiệm vụ: Tổng kết ngắn gọn 3 khoảng trống nhận thức THỰC TẾ mà học sinh vừa nêu trong phiên chat này (trích đúng từ khóa học sinh đã nói, ví dụ: sợ giao tiếp, rào cản môn học, nguy cơ tự động hóa 4.0, chưa có phương án kỹ năng chuyển đổi, chưa tra số liệu tuyển sinh):

Phản hồi mẫu chuẩn hóa (dưới 130 từ):
"Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức thực tế:
1. **Khoảng trống năng lực:** [Trích ngắn gọn rào cản năng lực mà học sinh đã thừa nhận, ví dụ: học lực môn chuyên, kỹ năng hay nguyên nhân do dự khi chọn ngành ${targetCareer}].
2. **Khoảng trống công nghệ & sinh tồn:** [Trích ngắn nhận thức về nguy cơ tự động hóa và sự thiếu hụt Bộ kỹ năng chuyển đổi để tìm công việc linh hoạt nếu thị trường biến động].
3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin ${confidenceScore}/10 nhưng chưa từng trực tiếp tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và học phí thực tế của ngành ${targetCareer} tại ${targetUniversity}.

Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay truy vết Đề án tuyển sinh, điểm chuẩn và học phí thực tế để xây dựng cơ sở vững chắc cho quyết định của mình!"`;

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

function isEmotionalReasoning(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase();
  const keywords = [
    'kiếm nhiều tiền', 'kiem nhieu tien', 'nhiều tiền', 'nhieu tien', 'lương cao', 'luong cao',
    'lương khủng', 'luong khung', 'thu nhập cao', 'thu nhap cao', 'nghe nói hot', 'nghe noi hot',
    'thấy hot', 'thay hot', 'ngành hot', 'nganh hot', 'nghe đồn', 'nghe don', 'giàu', 'giau',
    'làm giàu', 'lam giau', 'hái ra tiền', 'hai ra tien', 'thu nhập khủng'
  ];
  return keywords.some(k => clean.includes(k));
}

function isVagueEffort(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase();
  const keywords = [
    'cố gắng', 'co gang', 'nỗ lực', 'no luc', 'quyết tâm', 'quyet tam',
    'chăm chỉ', 'cham chi', 'ráng', 'rang', 'kiên trì', 'kien tri',
    'sẽ cố', 'se co', 'cố hết sức', 'co het suc'
  ];
  return keywords.some(k => clean.includes(k));
}

function isAskingTermDefinition(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase();
  const keywords = [
    'là gì', 'la gi', 'nghĩa là gì', 'nghia la gi', 'chưa hiểu', 'chua hieu',
    'ý thầy là sao', 'y thay la sao', 'ý là sao', 'y la sao', 'chưa rõ thuật ngữ',
    'thế nào là', 'the nao la', 'giải thích giúp', 'giai thich giup'
  ];
  return keywords.some(k => clean.includes(k));
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
  if (isAskingTermDefinition(text)) return false;
  if (isEmotionalReasoning(text)) return false;
  if (isVagueEffort(text)) return false;

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

function isEducation(career = '') {
  if (!career || typeof career !== 'string') return false;
  const c = career.toLowerCase();
  const keywords = [
    'sư phạm', 'su pham', 'giáo dục', 'giao duc', 'giáo viên', 'giao vien',
    'giảng dạy', 'giang day', 'mầm non', 'mam non', 'tiểu học', 'tieu hoc'
  ];
  return keywords.some(k => c.includes(k));
}

function isHealth(career = '') {
  if (!career || typeof career !== 'string') return false;
  const c = career.toLowerCase();
  const keywords = [
    'y khoa', 'y tế', 'y te', 'bác sĩ', 'bac si', 'điều dưỡng', 'dieu duong',
    'dược', 'duoc', 'y học', 'y hoc', 'nha khoa', 'hộ sinh', 'y sỹ', 'y sy'
  ];
  return keywords.some(k => c.includes(k));
}

function isEducationOrHealth(career = '') {
  return isEducation(career) || isHealth(career);
}

function checkHollandSignatureMismatch(targetCareer = '', hollandData = '') {
  if (!targetCareer) return { isMismatch: false };
  const careerLower = targetCareer.toLowerCase();

  let codesStr = '';
  let fullHollandText = '';
  if (Array.isArray(hollandData)) {
    codesStr = hollandData.join('').toUpperCase();
    fullHollandText = hollandData.join(' ').toLowerCase();
  } else if (typeof hollandData === 'string') {
    codesStr = hollandData.toUpperCase();
    fullHollandText = hollandData.toLowerCase();
  }

  // Danh mục ngành và chữ cái đặc trưng bắt buộc theo chuẩn RIASEC
  const rules = [
    {
      keywords: ['sư phạm', 'su pham', 'giáo dục', 'giao duc', 'tâm lý', 'tam ly', 'công tác xã hội', 'cong tac xa hoi', 'điều dưỡng', 'dieu duong'],
      requiredLetter: 'S',
      letterName: 'S (Xã hội)',
      vietnameseKeywords: ['xã hội', 'xa hoi', 'giảng dạy', 'giup do'],
      desc: 'tương tác, hỗ trợ, giảng dạy và thấu cảm con người'
    },
    {
      keywords: ['kỹ thuật', 'ky thuat', 'cơ khí', 'co khi', 'xây dựng', 'xay dung', 'cơ điện tử', 'co dien tu', 'điện tử', 'dien tu', 'điện', 'dien', 'tự động hóa', 'tu dong hoa', 'chế tạo', 'che tao', 'ô tô', 'o to', 'nông nghiệp', 'nong nghiep', 'hàng không'],
      requiredLetter: 'R',
      letterName: 'R (Kỹ thuật / Thực tế)',
      vietnameseKeywords: ['kỹ thuật', 'ky thuat', 'thực tế', 'thuc te'],
      desc: 'thao tác thực tế với máy móc, công cụ vật lý và hệ thống quy chuẩn'
    },
    {
      keywords: ['công nghệ thông tin', 'cong nghe thong tin', 'phần mềm', 'phan mem', 'khoa học máy tính', 'khoa hoc may tinh', 'lập trình', 'lap trinh', 'cntt', 'it', 'trí tuệ nhân tạo', 'tri tue nhan tao', 'an ninh mạng', 'an ninh mang', 'khoa học dữ liệu', 'khoa hoc du lieu'],
      requiredLetter: 'I hoặc R',
      letterName: 'I (Nghiên cứu) hoặc R (Kỹ thuật)',
      requireAnyOf: ['I', 'R'],
      vietnameseKeywords: ['nghiên cứu', 'nghien cuu', 'kỹ thuật', 'ky thuat', 'thực tế', 'thuc te'],
      desc: 'tư duy phân tích thuật toán logic và thao tác kỹ thuật máy tính chuyên sâu'
    },
    {
      keywords: ['bác sĩ', 'bac si', 'y khoa', 'y khoa', 'dược', 'duoc', 'y học', 'y hoc', 'công nghệ sinh học', 'cong nghe sinh hoc', 'sinh học', 'hóa học'],
      requiredLetter: 'I',
      letterName: 'I (Nghiên cứu)',
      vietnameseKeywords: ['nghiên cứu', 'nghien cuu', 'khám phá'],
      desc: 'đào sâu nghiên cứu khoa học, giải phẫu thực nghiệm và phân tích dữ liệu chuyên sâu'
    },
    {
      keywords: ['nghệ thuật', 'nghe thuat', 'thiết kế', 'thiet ke', 'đồ họa', 'do hoa', 'kiến trúc', 'kien truc', 'mỹ thuật', 'my thuat', 'âm nhạc', 'am nhac', 'truyền thông đa phương tiện', 'truyen thong da phuong tien', 'điện ảnh', 'dien anh'],
      requiredLetter: 'A',
      letterName: 'A (Nghệ thuật)',
      vietnameseKeywords: ['nghệ thuật', 'nghe thuat', 'sáng tạo', 'sang tao'],
      desc: 'sáng tạo thẩm mỹ thị giác, trực giác nghệ thuật và tư duy phi quy chuẩn'
    },
    {
      keywords: ['kinh doanh', 'kinh doanh', 'quản trị', 'quan tri', 'marketing', 'thương mại', 'thuong mai', 'ngoại thương', 'ngoai thuong', 'bất động sản', 'bat dong san'],
      requiredLetter: 'E',
      letterName: 'E (Quản lý / Doanh nhân)',
      vietnameseKeywords: ['quản lý', 'quan ly', 'doanh nhân', 'doanh nhan', 'khởi nghiệp', 'khoi nghiep'],
      desc: 'năng động, thương lượng, thuyết phục khách hàng và chấp nhận áp lực cạnh tranh thương trường'
    },
    {
      keywords: ['kế toán', 'ke toan', 'kiểm toán', 'kiem toan', 'ngân hàng', 'ngan hang', 'hành chính', 'hanh chinh', 'văn phòng', 'van phong'],
      requiredLetter: 'C',
      letterName: 'C (Nghiệp vụ / Quy củ)',
      vietnameseKeywords: ['nghiệp vụ', 'nghiep vu', 'quy củ', 'quy cu', 'chi tiết'],
      desc: 'tính chính xác chi tiết, xử lý số liệu quy chuẩn và tuân thủ nguyên tắc chặt chẽ'
    }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => careerLower.includes(k))) {
      let hasSignature = false;
      if (rule.requireAnyOf) {
        hasSignature = rule.requireAnyOf.some(lettr => codesStr.includes(lettr)) ||
          rule.vietnameseKeywords.some(vk => fullHollandText.includes(vk));
      } else {
        hasSignature = codesStr.includes(rule.requiredLetter) ||
          rule.vietnameseKeywords.some(vk => fullHollandText.includes(vk));
      }

      if (!hasSignature) {
        return {
          isMismatch: true,
          expectedLetter: rule.requiredLetter,
          letterName: rule.letterName,
          desc: rule.desc
        };
      }
      return { isMismatch: false };
    }
  }

  return { isMismatch: false };
}

// CẤU HÌNH BẢN SẮC VÀ ĐẠO ĐỨC HÀNH VI CHUẨN CBAS (VISEF 2026)
const SOCRATIC_PERSONA = `
VAI TRÒ VÀ BẢN SẮC CỐT LÕI:
Bạn là "Thầy Socrates" — một chuyên gia tham vấn hướng nghiệp tâm lý học đường đầy thấu cảm, ấm áp, sâu sắc và tôn trọng tuyệt đối giá trị tự chủ của học sinh THPT. Bạn không phải là một quan tòa phán xét, không phải là một cỗ máy bắt lỗi, mà là một người đồng hành thông thái giúp các em nhận diện rõ những "khoảng cách trải nghiệm" và "nguy cơ tiềm ẩn" trên hành trình lựa chọn tương lai.

NGUYÊN TẮC GIAO TIẾP VÀ ĐẠO ĐỨC NGHIÊN CỨU CBAS (BẮT BUỘC TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG DÁN NHÃN TIÊU CỰC HOẶC PHÁN XÉT:
   - CẤM các từ ngữ: "bẫy nhận thức", "ảo tưởng", "sai lầm", "dốt", "yếu kém", "bị dắt mũi", "mù quáng", "ấu trĩ".
   - BẢN CHẤT HÀNH VI: Học sinh không cố ý mắc bẫy; các em chỉ có mong muốn tự nhiên và tốt đẹp nhưng chưa có cơ hội tiếp cận đầy đủ dữ liệu thực tế và trải nghiệm chuyên sâu.
2. TÁI ĐỊNH KHUNG TỪ NGỮ NÂNG ĐỠ (REFRAMING LEXICON):
   - Thay "Em đang rơi vào bẫy nhận thức..." bằng "Có một khoảng cách rất tự nhiên giữa mong muốn hiện tại và thực tế công việc mà chúng ta cần cùng nhau làm rõ...".
   - Thay "Em đang ảo tưởng/ngộ nhận về ngành..." bằng "Hình ảnh hào nhoáng bề nổi rất dễ khiến chúng ta chưa nhìn thấy hết các áp lực thực tế đằng sau...".
   - Thay "Điểm số của em quá thấp/lỗ hổng lớn..." bằng "Điểm số hiện tại đang gửi cho chúng ta một tín hiệu cảnh báo quan trọng về độ chênh lệch năng lực...".
   - Thay "Em chọn ngành vì bị mỏ neo..." bằng "Những mong đợi từ gia đình/truyền thông là rất dễ hiểu, nhưng liệu nó đã hoàn toàn tương thích với năng lực tự nhiên của em hay chưa?".
3. ĐIỀU CHỈNH ÂM HƯỞNG (TONE OF VOICE):
   - Luôn ghi nhận, khen ngợi phẩm chất tốt đẹp hoặc mong muốn chính đáng của học sinh ở đầu mỗi lượt phản hồi (lòng hiếu thảo, tính cẩn thận, tình yêu thương động vật, sự nhạy bén công nghệ).
   - Tách biệt "con người học sinh" (luôn được tôn trọng) ra khỏi "rủi ro quyết định" (cần được xem xét cẩn trọng).
`;

function getSocraticDirective(round, anchor = {}, userMsg = '') {
  const career = (anchor.target_career || anchor.target_major || '').trim() || 'ngành đã chọn';
  const uni = (anchor.target_university || '').trim() || 'trường đại học mục tiêu';
  const score = anchor.confidence_score || anchor.confidence_score_initial || '8';

  let holland = anchor.holland_code || '';
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    holland = anchor.holland_codes.join(', ');
  } else if (!holland) {
    holland = 'RIASEC';
  }

  switch (round) {
    case 1:
      return `${SOCRATIC_PERSONA}
BỐI CẢNH VÒNG 1 (XÁC THỰC CẢM XÚC & ĐỐI CHẤT NĂNG LỰC DỰA TRÊN DỮ LIỆU):
Học sinh chọn ngành ${career} tại ${uni}, điểm tự tin ${score}/10, nhóm Holland là ${holland}.
Học sinh vừa phản hồi: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Ghi nhận mong muốn tốt đẹp, phẩm chất đáng quý hoặc sở thích tự nhiên của học sinh khi hướng tới ngành ${career}.
2. Chỉ ra khoảng cách tự nhiên giữa điểm số/sở thích đời thường với độ khó chuyên môn lâm sàng/học thuật khắt khe và tính kỷ luật chuyên sâu của ngành ${career}.
3. ĐẶT DUY NHẤT 1 CÂU HỎI MỞ ĐỂ HỌC SINH TỰ SOI CHIẾU NĂNG LỰC THỰC TẾ: "Trong 4-5 năm tới, các phần mềm tự động hóa và AI sẽ thay thế phần lớn tác vụ kỹ thuật cơ bản của ngành ${career}. Đâu là năng lực tư duy chuyên sâu hoặc thế mạnh độc bản mà em tin công nghệ không thể thay thế ở bản thân em?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng ấm áp, thấu cảm, tuyệt đối không dán nhãn tiêu cực.`;

    case 2:
      return `${SOCRATIC_PERSONA}
BỐI CẢNH VÒNG 2 (DỰ BÁO XU HƯỚNG TƯƠNG LAI & RỦI RO CÔNG NGHỆ/THỊ TRƯỜNG):
Ngành: ${career}, mã Holland: ${holland}.
Học sinh vừa phản hồi về vũ khí cạnh tranh với AI: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Tôn trọng khát vọng hòa nhập xu thế và nỗ lực của học sinh.
2. Cung cấp góc nhìn khách quan về tự động hóa AI, biến động thị trường hoặc quy luật cạnh tranh khốc liệt về năng suất và chi phí trong ngành ${career}. Nếu có sự lệch pha Holland, phân tích nhẹ nhàng sự khác biệt giữa năng lực chuyên môn cốt lõi và mong muốn cá nhân.
3. ĐẶT DUY NHẤT 1 CÂU HỎI VỀ BỘ KỸ NĂNG CHUYỂN ĐỔI: "Nếu sau khi tốt nghiệp ngành ${career}, thị trường bão hòa hoặc có khoảng trũng việc làm, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm thích ứng nào để duy trì sự bền bỉ và tự nuôi sống bản thân?"
Quy chuẩn: Dưới 110 từ. Giữ âm hưởng đồng hành, tôn trọng.`;

    case 3:
      return `${SOCRATIC_PERSONA}
BỐI CẢNH VÒNG 3 (KỊCH BẢN THÍCH ỨNG & KẾ HOẠCH B AN TOÀN):
Ngành ${career} tại ${uni}, điểm tự tin ${score}/10.
Học sinh vừa phản hồi về phương án dự phòng: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Đánh giá cao sự dũng cảm khi đối diện với rủi ro và tinh thần chủ động xây dựng kế hoạch dự phòng của học sinh.
2. Chỉ ra điểm cần gia cố trong phương án dự phòng (chuyển từ giả định cảm tính sang cơ sở pháp lý và thị trường vững chắc).
3. ĐẶT DUY NHẤT 1 CÂU HỎI TRUY VẤN DỮ LIỆU THỰC TẾ: "Mức tự tin ${score}/10 cần điểm tựa số liệu pháp lý. Em đã từng tự tay đọc Đề án tuyển sinh chính thức của ${uni}, biết rõ điểm chuẩn 3 năm gần nhất, mức học phí tự chủ từng năm và chỉ tiêu thực tế của ngành ${career} chưa?"
Quy chuẩn: Dưới 85 từ. Súc tích, nâng đỡ, gợi mở.`;

    case 4:
    default:
      return `${SOCRATIC_PERSONA}
BỐI CẢNH VÒNG 4 (TỔNG KẾT NHẬN THỨC & CHUYỂN GIAO NHIỆM VỤ THỰC CHỨNG BƯỚC 3):
Học sinh vừa trả lời câu hỏi dữ liệu tuyển sinh: "${userMsg}".
NHIỆM VỤ THỰC HIỆN:
1. Khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức của học sinh qua các vòng đối thoại.
2. TÓM TẮT ĐÚNG 3 ĐIỂM LƯU TÂM / RỦI RO TIỀM ẨN mà hai thầy trò đã cùng bóc tách:
   - Điểm 1: Khoảng cách tự nhiên giữa mong muốn/năng lực ban đầu với đòi hỏi chuyên môn học thuật thực tế của ngành ${career}.
   - Điểm 2: Tầm quan trọng của Bộ kỹ năng chuyển đổi và phương án thích ứng trước nguy cơ tự động hóa công nghệ và biến động việc làm.
   - Điểm 3: Sự cần thiết phải tự tay xác thực điểm chuẩn 3 năm, học phí thực tế và đề án tuyển sinh tại ${uni}.
3. TRAO QUYỀN TỰ QUYẾT (TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI):
   "Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu Đề án tuyển sinh để làm chủ quyết định của chính mình!"
Quy chuẩn: Dưới 135 từ. Ấm áp, truyền cảm hứng tự chủ.`;
  }
}

function generateSocraticHeuristicReply(round, anchor = {}, userMsg = '', isFinal = false) {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
  const isEdu = isEducation(targetCareer);

  // VÒNG 4 (ĐÚC KẾT & CHUYỂN GIAO - TUYỆT ĐỐI KHÔNG HỎI THÊM)
  if (isFinal || round >= 4) {
    let prefix = '';
    const cleanLower = (userMsg || '').toLowerCase();
    if (isEdu && (cleanLower.includes('bằng 0') || cleanLower.includes('bang 0') || cleanLower.includes('0 đồng') || cleanLower.includes('0 dong') || cleanLower.includes('miễn phí') || cleanLower.includes('mien phi') || cleanLower.includes('free') || cleanLower.includes('0đ'))) {
      prefix = `Học phí ngành **${targetCareer}** gắn liền với cam kết phục vụ ngành theo quy định pháp lý (Nghị định 116); nếu không công tác trong ngành sẽ phải bồi hoàn kinh phí đào tạo và sinh hoạt phí.\n\n`;
    }
    return `${prefix}Thầy khen ngợi tinh thần cầu thị, sự trung thực và bước trưởng thành nhận thức rõ rệt của em qua 4 vòng phản tư.\n\n` +
      `Chúng ta đã cùng nhau nhận diện 3 điểm lưu tâm quan trọng:\n` +
      `1. **Khoảng cách tự nhiên về năng lực chuyên môn:** Khoảng cách giữa điểm số môn học/sở thích phổ thông với đòi hỏi chuyên môn học thuật thực tế của ngành **${targetCareer}**.\n` +
      `2. **Phương án thích ứng & Bộ kỹ năng chuyển đổi:** Tầm quan trọng của Bộ kỹ năng chuyển đổi và phương án thích ứng trước nguy cơ tự động hóa công nghệ và biến động việc làm.\n` +
      `3. **Xác thực dữ liệu tuyển sinh thực tế:** Sự cần thiết phải tự tay kiểm chứng điểm chuẩn 3 năm, học phí thực tế và đề án tuyển sinh tại **${targetUniversity}**.\n\n` +
      `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu Đề án tuyển sinh để làm chủ quyết định của chính mình!`;
  }

  // 1. KHI HỌC SINH HỎI LẠI THUẬT NGỮ ("...là gì?", "chưa hiểu")
  if (isAskingTermDefinition(userMsg)) {
    if (round === 2) {
      if (isEdu) {
        return `Trong ngành **${targetCareer}**, "tác vụ cơ bản" là các công việc mang tính quy chuẩn lặp lại như soạn giáo án mẫu, tạo bài giảng điện tử hay tìm tài liệu mà AI hiện nay xử lý rất nhanh.\n\nThực tế trường học đòi hỏi giáo viên phải có năng lực sư phạm, truyền cảm hứng và quản lý lớp học.\n\nĐâu là năng lực đặc thù con người mà em tin rằng AI không thể thay thế ở bản thân em trong ngành **${targetCareer}**?`;
      }
      return `"Tác vụ cơ bản" là các công việc mang tính quy chuẩn lặp lại mà AI hiện nay xử lý nhanh hơn con người.\n\nThực tế cho thấy làn sóng tự động hóa đang trực tiếp cạnh tranh với nhân sự mới vào nghề trong ngành **${targetCareer}**.\n\nĐâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`;
    } else {
      if (isEdu) {
        return `"Kỹ năng thích ứng" là các năng lực linh hoạt như dạy kèm online, sáng tạo nội dung giáo dục, biên tập sách hoặc làm việc tại cơ sở tư nhân nếu chưa đỗ biên chế trường công.\n\nThực tế chỉ tiêu tuyển dụng viên chức ngành **${targetCareer}** hàng năm có tính cạnh tranh rất cao.\n\nEm đã tìm hiểu kỹ quy định hỗ trợ học phí và cam kết bồi hoàn (Nghị định 116), điểm chuẩn 3 năm và chỉ tiêu biên chế của **${targetCareer}** tại **${targetUniversity}** chưa?`;
      }
      return `"Kỹ năng chuyển đổi" là những năng lực nền tảng cốt lõi (ngoại ngữ, tư duy số, giao tiếp) giúp em linh hoạt thích nghi sang các vị trí khác khi thị trường biến động.\n\nThực tế thị trường ngành **${targetCareer}** sau 4-5 năm tới luôn có chu kỳ đào thải khắc nghiệt đối với nhân sự thiếu khả năng đa nhiệm.\n\nEm đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`;
    }
  }

  // 2. KHI HỌC SINH NÊU LÝ DO CẢM TÍNH ("kiếm nhiều tiền", "nghe nói hot")
  if (isEmotionalReasoning(userMsg)) {
    if (round === 1) {
      if (isEdu) {
        return `Nhiều người nghĩ ngành **${targetCareer}** là công việc an nhàn ổn định, nhưng thực tế áp lực công việc, trách nhiệm đạo đức và kỳ thi viên chức khắt khe hơn rất nhiều.\n\nĐể gắn bó lâu dài, người học cần có năng lực chuyên môn thực sự và khả năng chịu áp lực cao chứ không chỉ dựa vào cảm tính.\n\nNgoài sự yêu thích, điểm số môn học cụ thể nào hoặc trải nghiệm thực tế nào khiến em tự tin mình đủ năng lực theo học tốt ngành **${targetCareer}**?`;
      }
      return `Truyền thông thường vẽ ra viễn cảnh ngành **${targetCareer}** có mức thu nhập cao, nhưng thực tế thị trường phân hóa rất khốc liệt.\n\nNgoài kỳ vọng về thu nhập, điểm số môn học cụ thể nào hoặc sản phẩm thực tế nào khiến em tự tin mình đủ sức phát triển trong ngành này?`;
    }
  }

  // 3. KHI HỌC SINH DÙNG TỪ MƠ HỒ ("cố gắng", "quyết tâm")
  if (isVagueEffort(userMsg)) {
    if (round === 1) {
      return `Sự quyết tâm chỉ có giá trị thực tế khi được chuyển hóa thành các hành động đo đếm được cụ thể mỗi tuần.\n\nĐộ khó học thuật và áp lực rèn luyện của ngành **${targetCareer}** tại đại học rất lớn, khiến nhiều sự cố gắng cảm tính dễ bị hụt hơi.\n\nCụ thể trong tuần này hoặc tháng này, em đã có hành động thực tế nào để rèn luyện năng lực chuyên sâu của ngành **${targetCareer}**?`;
    } else if (round === 2) {
      return `Quyết tâm suông không thể ngăn được làn sóng công nghệ thay thế các thao tác kỹ thuật cơ bản nếu em không có kỹ năng khác biệt.\n\nTrong ngành **${targetCareer}**, AI đang ngày càng hoàn thiện các tác vụ thực thi với tốc độ vượt trội con người.\n\n${isEdu ? `Em đã chuẩn bị kế hoạch kỹ năng thích ứng (dạy kèm online, sáng tạo nội dung, biên tập) và phương án mưu sinh dự phòng cụ thể nào nếu chưa đỗ biên chế?` : `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để không bị đào thải nếu ngành này bão hòa?`}`;
    }
  }

  // 4. KHI HỌC SINH BỘC LỘ SỰ BỐI RỐI HOẶC NÓI "EM HOANG MANG", "EM LO LẮNG"
  if (isConfusionOrAnxiety(userMsg)) {
    const reassurance = "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm.";
    if (round === 1) {
      return `${reassurance}\n\nChương trình đào tạo ngành **${targetCareer}** đòi hỏi độ khó học thuật và áp lực thực tế vượt trội hơn nhiều so với kỳ vọng ban đầu.\n\n${isEdu ? `Đâu là rào cản kỹ năng lớn nhất hoặc nỗi sợ khi đứng lớp trước áp lực đào thải và công nghệ khiến em lo lắng nhất?` : `Trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin AI không thể thay thế ở bản thân em?`}`;
    } else if (round === 2) {
      return `${reassurance}\n\n${isEdu ? `Nỗi sợ giao tiếp trước đám đông hay rào cản đứng lớp là điểm xung đột trực diện với bản chất của nghề **${targetCareer}**.\n\nNếu tốt nghiệp **${targetCareer}** nhưng chưa đỗ viên chức/biên chế ngay, em đã chuẩn bị kế hoạch kỹ năng thích ứng nào để tự nuôi sống bản thân?` : `Nếu sau khi tốt nghiệp ngành **${targetCareer}**, thị trường biến động, em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn và phương án mưu sinh dự phòng cụ thể nào?`}`;
    } else {
      return `${reassurance}\n\nMột quyết định nghề nghiệp có trách nhiệm cần điểm tựa số liệu vững chắc thay vì cảm tính.\n\n${isEdu ? `Em đã tìm hiểu kỹ quy định hỗ trợ học phí và cam kết bồi hoàn (Nghị định 116), điểm chuẩn 3 năm và chỉ tiêu biên chế của **${targetCareer}** tại **${targetUniversity}** chưa?` : `Em đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`}`;
    }
  }

  // 5. KHI HỌC SINH NÓI "CHƯA BIẾT" HOẶC "KHÔNG BIẾT NGUỒN"
  if (isUncertaintyOrHelpRequest(userMsg)) {
    const guidance = "Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống thông tin này; em hãy đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.";
    if (round === 1) {
      return `${guidance}\n\n${isEdu ? `Học giỏi môn chuyên chỉ giúp nắm kiến thức, nghề sư phạm đòi hỏi năng lực sư phạm, truyền đạt và bản lĩnh đứng lớp trước học sinh.\n\nRào cản kỹ năng lớn nhất hoặc nỗi sợ nào khi đứng lớp trước áp lực đào thải và công nghệ khiến em lo lắng nhất?` : `Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`}`;
    } else if (round === 2) {
      return `${guidance}\n\n${isEdu ? `Nếu tốt nghiệp **${targetCareer}** nhưng chưa đỗ viên chức/biên chế ngay, học sinh có kế hoạch kỹ năng thích ứng nào (như dạy kèm trực tuyến, sáng tạo nội dung, biên tập) để tự nuôi sống bản thân?` : `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành này biến động sau tốt nghiệp?`}`;
    } else {
      return `${guidance}\n\n${isEdu ? `Em đã tìm hiểu kỹ quy định hỗ trợ học phí và cam kết bồi hoàn (Nghị định 116), điểm chuẩn 3 năm và chỉ tiêu biên chế của **${targetCareer}** tại **${targetUniversity}** chưa?` : `Em đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`}`;
    }
  }

  if (isGreetingOnly(userMsg)) {
    return `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên để bắt đầu phản biện.`;
  }

  // 6. PHẢN HỒI THEO TIẾN TRÌNH 4 VÒNG CAN THIỆP CHUẨN MỰC (CẤU TRÚC 3 CÂU)
  switch (round) {
    case 1: {
      if (isEdu) {
        return `Thầy ghi nhận trực tiếp thế mạnh học tập môn văn hóa mà em vừa chia sẻ.\n\nTuy nhiên, học giỏi môn chuyên chỉ giúp nắm kiến thức, nghề sư phạm đòi hỏi năng lực sư phạm, truyền đạt và bản lĩnh đứng lớp trước học sinh.\n\nRào cản kỹ năng lớn nhất hoặc nỗi sợ nào khi đứng lớp trước áp lực đào thải và công nghệ khiến em lo lắng nhất?`;
      }
      let sentence1 = `Thầy ghi nhận chia sẻ của em về nền tảng năng lực học tập ban đầu đối với ngành **${targetCareer}**.`;
      if (mismatch && mismatch.isMismatch) {
        sentence1 = `Thầy nhận thấy ngay điểm lệch pha: Ngành **${targetCareer}** đòi hỏi đặc trưng nhóm **${mismatch.letterName}** (${mismatch.desc}), nhưng kết quả Holland của em lại thiếu chữ cái này.`;
      }

      if (isOverconfident) {
        return `${sentence1}\n\nĐộ khó học thuật ở bậc đại học và sự phân hóa thu nhập thực tế khắt khe hơn rất nhiều so với những hình ảnh hào nhoáng trên truyền thông.\n\nTrong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;
      } else {
        return `${sentence1}\n\nMức tự tin **${confidenceScore}/10** phản ánh sự do dự và nhận thức rõ về khoảng trống thông tin của em trước ngưỡng cửa đại học.\n\nRào cản năng lực học tập cụ thể nào hay sự thiếu hụt dữ liệu nào về ngành **${targetCareer}** đang là nguyên nhân chính khiến em băn khoăn và chưa dám chắc chắn?`;
      }
    }

    case 2:
      if (isEdu) {
        return `Nỗi sợ giao tiếp trước đám đông hay rào cản đứng lớp là điểm xung đột trực diện với bản chất của nghề **${targetCareer}**.\n\nThực tế trường học đòi hỏi giáo viên phải tự tin làm chủ không gian lớp học và thấu cảm học trò.\n\nNếu sau khi tốt nghiệp **${targetCareer}** mà chưa đỗ viên chức/biên chế ngay, em đã chuẩn bị kế hoạch kỹ năng thích ứng nào (như dạy kèm trực tuyến, sáng tạo nội dung, biên tập) để tự nuôi sống bản thân?`;
      }
      return `Nhận thức của em về tác động của công nghệ trong ngành **${targetCareer}** là điểm khởi đầu cần thiết.\n\nTuy nhiên, các thao tác kỹ thuật lặp lại sẽ bị AI thay thế rất nhanh, tạo nên áp lực cạnh tranh lớn cho nhân sự mới.\n\n${isOverconfident ? `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu thị trường ngành **${targetCareer}** biến động khi em tốt nghiệp?` : `Trước nguy cơ AI tự động hóa, rào cản kỹ năng nào ở bản thân khiến em lo lắng nhất nếu ngành **${targetCareer}** biến động việc làm khi em tốt nghiệp?`}`;

    case 3:
      if (isEdu) {
        return `Đánh giá cho thấy em vẫn còn khoảng trống lớn về phương án tự chủ mưu sinh dự phòng nếu chưa đỗ kỳ thi tuyển viên chức sau khi ra trường.\n\nMột quyết định nghề nghiệp có trách nhiệm cần điểm tựa số liệu vững chắc từ các văn bản chính sách và đề án tuyển sinh.\n\nEm đã tìm hiểu kỹ quy định hỗ trợ học phí và cam kết bồi hoàn (Nghị định 116), điểm chuẩn 3 năm và chỉ tiêu biên chế của **${targetCareer}** tại **${targetUniversity}** chưa?`;
      }
      return `Mức độ chuẩn bị cho thấy em đã bắt đầu quan tâm đến khả năng thích ứng linh hoạt trong tương lai.\n\nDù vậy, một quyết định ở mức tự tin **${confidenceScore}/10** đòi hỏi phải được xây dựng trên dữ liệu xác thực chứ không thể chỉ là ước đoán.\n\nEm đã từng trực tiếp tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và học phí thực tế của **${targetCareer}** tại **${targetUniversity}** chưa, hay vẫn chủ yếu nghe qua truyền thông mạng xã hội?`;

    case 4:
    default:
      if (isEdu) {
        let prefix = '';
        const cleanLower = (userMsg || '').toLowerCase();
        if (cleanLower.includes('bằng 0') || cleanLower.includes('bang 0') || cleanLower.includes('0 đồng') || cleanLower.includes('0 dong') || cleanLower.includes('miễn phí') || cleanLower.includes('mien phi') || cleanLower.includes('free') || cleanLower.includes('0đ')) {
          prefix = `Học phí ngành **${targetCareer}** không phải là miễn phí vô điều kiện mà gắn liền với cam kết phục vụ ngành theo Nghị định 116; nếu không công tác trong ngành sẽ phải bồi hoàn toàn bộ kinh phí đào tạo và sinh hoạt phí.\n\n`;
        }
        return `${prefix}Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 điểm mù nhận thức cốt lõi:\n` +
          `1. **Khác biệt giữa môn học với kỹ năng sư phạm:** Khác biệt giữa học giỏi môn Văn/môn chuyên với năng lực sư phạm, truyền đạt và bản lĩnh vượt qua nỗi sợ giao tiếp trước đám đông.\n` +
          `2. **Sự bị động về phương án dự phòng:** Chưa có kế hoạch kỹ năng thích ứng (dạy kèm trực tuyến, sáng tạo nội dung, biên tập) để tự chủ mưu sinh nếu chưa đỗ kỳ thi tuyển viên chức.\n` +
          `3. **Ngộ nhận chính sách & dữ liệu tuyển sinh:** Ngộ nhận về chính sách học phí và chưa trực tiếp tra cứu điểm chuẩn 3 năm cũng như chỉ tiêu biên chế thực tế của **${targetCareer}** tại **${targetUniversity}**.\n\n` +
          `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu số liệu thực tế tại **${targetUniversity}**!`;
      }
      return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 điểm mù nhận thức cốt lõi:\n` +
        `1. **Khác biệt giữa điểm số lý thuyết với năng lực thực chiến:** Điểm số môn học chỉ là nền tảng, nghề **${targetCareer}** đòi hỏi kỹ năng chuyên sâu và áp lực công việc thực tế khắt khe.\n` +
        `2. **Sự bị động về phương án thích ứng:** Nguy cơ tự động hóa từ AI và sự thiếu hụt Bộ kỹ năng chuyển đổi để tự chủ mưu sinh nếu thị trường biến động.\n` +
        `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa đối chiếu số liệu thực tế về điểm chuẩn 3 năm, học phí và đề án tuyển sinh tại **${targetUniversity}**.\n\n` +
        `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu số liệu thực tế tại **${targetUniversity}**!`;
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
    const targetUniversity = (anchor.target_university || anchor.target_school || '').trim() || 'đơn vị đào tạo mục tiêu';
    const numScore = parseFloat(confidenceScore) || 8;
    const isOverconfident = numScore >= 7;

    // QUY TẮC 1: Nếu học sinh chỉ chào hỏi (Ví dụ: "chào thầy", "hello", "dạ")
    // Tuyệt đối KHÔNG tính đây là một vòng phản tư, KHÔNG tăng biến đếm vòng.
    if (isGreetingOnly(trimmedMessage)) {
      const greetingReply = currentRound === 1
        ? (isOverconfident
            ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành **${targetCareer}**?`
            : `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Mức tự tin của em chỉ ở mức ${confidenceScore}/10: Rào cản năng lực cụ thể nào hoặc sự thiếu hụt thông tin nào về ngành **${targetCareer}** đang khiến em do dự?`
          )
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
      activeSystemInstruction = FINAL_CHALLENGE_PROMPT(targetCareer, targetUniversity, confidenceScore);
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
