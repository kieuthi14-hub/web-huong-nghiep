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

function isEducationOrHealth(career = '') {
  if (!career || typeof career !== 'string') return false;
  const c = career.toLowerCase();
  const keywords = [
    'sư phạm', 'su pham', 'giáo dục', 'giao duc', 'giáo viên', 'giao vien',
    'giảng dạy', 'giang day', 'mầm non', 'mam non', 'tiểu học', 'tieu hoc',
    'y khoa', 'y khoa', 'y tế', 'y te', 'bác sĩ', 'bac si', 'điều dưỡng', 'dieu duong',
    'dược', 'duoc', 'y học', 'y hoc', 'nha khoa', 'hộ sinh', 'y sỹ', 'y sy'
  ];
  return keywords.some(k => c.includes(k));
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

function getSocraticDirective(round, anchor = {}, userMsg = '') {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
  const numScore = parseFloat(confidenceScore) || 8;
  const isOverconfident = numScore >= 7;
  const isEduOrHealth = isEducationOrHealth(targetCareer);

  let hollandCode = anchor.holland_code || '';
  if (Array.isArray(anchor.holland_codes) && anchor.holland_codes.length > 0) {
    hollandCode = anchor.holland_codes.join(', ');
  } else if (!hollandCode) {
    hollandCode = 'Nghiên cứu - Kỹ thuật';
  }

  const mismatch = checkHollandSignatureMismatch(targetCareer, anchor.holland_code || anchor.holland_codes);

  const baseDirective = `BẠN LÀ: "Chuyên gia Phản tư Hành vi Socrates" (Nghiên cứu CBAS - ViSEF Quốc gia 2026).
HỒ SƠ HỌC SINH TỪ BƯỚC 1:
- Ngành mục tiêu: ${targetCareer} (BẮT BUỘC dùng đúng tên ngành "${targetCareer}" trong mọi câu phản hồi, TUYỆT ĐỐI KHÔNG dùng cụm từ "ngành em chọn" hay "ngành đã chọn").
- Cơ sở đào tạo: ${targetUniversity}
- Mức tự tin ban đầu: ${confidenceScore}/10 (${isOverconfident ? 'Tự tin thái quá' : 'Do dự, mơ hồ'})
- Mã RIASEC: ${hollandCode}

QUY TẮC ĐỐI THOẠI HÀNH VI TỐI CAO:
1. TUYỆT ĐỐI KHÔNG LẶP LẠI CÂU HỎI Ở LƯỢT TRƯỚC: Mỗi lượt phản biện là một nấc thang nhận thức mới, không được hỏi lại nội dung vừa hỏi.
2. PHẢN HỒI THÍCH ỨNG THEO ĐÚNG ĐẶC THÙ NGÀNH:
   - Với ngành Sư phạm/Y tế: Dùng bối cảnh trường học, bệnh viện, biên chế, chỉ tiêu công lập, đạo đức nghề nghiệp; TUYỆT ĐỐI KHÔNG dùng từ "doanh nghiệp", "thị trường kinh doanh" hay "thu nhập hào nhoáng" trừ khi học sinh tự nhắc tới.
   - Với các ngành khác (Công nghệ, Kinh tế, Kỹ thuật,...): Dùng bối cảnh doanh nghiệp, thị trường tuyển dụng, phân hóa thu nhập, dự án thực tế.
3. XỬ LÝ KHI HỌC SINH NÓI "KHÔNG HIỂU" HOẶC BỐI RỐI:
   - Dừng ngay việc dùng thuật ngữ vĩ mô.
   - Giải thích trong đúng 1 câu bình dân ngắn gọn có ví dụ cụ thể phù hợp ngành ${targetCareer} (${isEduOrHealth ? 'Ví dụ Sư phạm: AI soạn giáo án, giảng bài tự động; kỹ năng dự phòng làm gia sư online/trợ giảng nếu chưa có biên chế trường công; Y tế: AI chẩn đoán ảnh/phác đồ mẫu; kỹ năng dự phòng tại cơ sở y tế ngoài công lập/phòng khám tư' : 'Ví dụ: AI tự động hóa viết mã, dựng layout, xử lý dữ liệu; kỹ năng dự phòng xoay trục linh hoạt khi thị trường bão hòa'}).
   - Sau đó đặt câu hỏi tiếp theo theo đúng lộ trình can thiệp.

QUY TẮC RẼ NHÁNH BẮT BUỘC THEO MỨC TỰ TIN & TÍNH CHẤT NGÀNH:
1. SOI CHIẾU MÃ HOLLAND (RIASEC):
${mismatch && mismatch.isMismatch
  ? `⚠️ CẢNH BÁO LỆCH PHA HOLLAND: Học sinh chọn ngành "${targetCareer}" (đòi hỏi chữ cái đặc trưng ${mismatch.letterName} - ${mismatch.desc}), nhưng mã RIASEC của học sinh (${hollandCode}) lại THIẾU chữ cái đặc trưng này!
👉 BẮT BUỘC: Em PHẢI nêu ra điểm lệch pha nhận thức này ngay câu đầu tiên của câu trả lời!`
  : `Mã Holland (${hollandCode}) tương đối phù hợp hoặc có nhóm hỗ trợ cho ngành "${targetCareer}". Tiếp tục soi chiếu năng lực thực tế.`}

2. RẼ NHÁNH THEO MỨC ĐIỂM TỰ TIN (${confidenceScore}/10):
${isOverconfident
  ? `[NHÁNH TỰ TIN THÁI QUÁ (Điểm tự tin >= 7/10 - Hiện tại: ${confidenceScore}/10)]:
- Truy vấn thẳng vào điểm tựa thực tế, bóc tách triệt để ảo tưởng hoặc ${isEduOrHealth ? 'kỳ vọng an nhàn, đối diện với áp lực thi tuyển viên chức khắt khe và độ khó đào tạo' : 'mỏ neo hào nhoáng từ truyền thông mạng xã hội'}.
- Yêu cầu học sinh chỉ ra bằng chứng thực tế đo đếm được (điểm số môn chuyên sâu, giải thưởng, sản phẩm cụ thể) chứng minh mình đủ năng lực vượt qua độ khó đào thải của ngành "${targetCareer}".`
  : `[NHÁNH DO DỰ, MƠ HỒ (Điểm tự tin <= 6/10 - Hiện tại: ${confidenceScore}/10)]:
- TUYỆT ĐỐI KHÔNG chất vấn "tại sao tin" hay "tại sao em tự tin".
- TRUY VẤN THẲNG vào nguyên nhân do dự, rào cản năng lực cụ thể hoặc sự thiếu hụt thông tin: Rào cản nào (học lực môn nào, áp lực chi phí, hay chưa hiểu rõ chỉ tiêu/thị trường việc làm) đang khiến em phân vân và chưa dám khẳng định quyết định của mình?`}

CẤU TRÚC PHẢN HỒI CHUẨN MỰC (ĐÚNG 3 CÂU - DƯỚI 120 TỪ):
- Câu 1: Phản hồi/giải nghĩa trực diện điều học sinh vừa nói ${mismatch && mismatch.isMismatch ? '(BẮT BUỘC nêu điểm lệch pha Holland ngay câu này)' : '(không khen ngợi vu vơ, không lặp lại câu hỏi trước)'}.
- Câu 2: Đưa ra nghịch lý/soi chiếu thực tế đối với độ khó đào tạo và môi trường thực tế của ngành ${targetCareer}.
- Câu 3: Đặt DUY NHẤT 1 câu hỏi truy vấn sâu theo đúng lộ trình can thiệp.

LỘ TRÌNH 4 VÒNG CAN THIỆP CHẶT CHẼ:
- Vòng 1 (Năng lực học tập & Rào cản do dự): Phản hồi trực diện. Chuyển sang Vòng 2 bằng câu 3 hỏi về AI và công nghệ sẽ thay đổi ngành ${targetCareer} như thế nào trong 4-5 năm tới (${isEduOrHealth ? 'Ví dụ: AI soạn giáo án, giảng bài tự động trong Sư phạm; AI chẩn đoán ảnh/phác đồ trong Y tế' : 'Ví dụ: AI tự động hóa viết mã, dựng layout, phân tích dữ liệu'}) và đâu là năng lực con người đặc thù mà AI không thể thay thế ở em.
- Vòng 2 (Kỹ năng đối diện công nghệ): Bình luận ngắn gọn nhận thức về AI (không khen sáo rỗng, tuyệt đối không lặp lại câu hỏi trước). Chuyển sang Vòng 3 bằng câu 3 hỏi về Bộ kỹ năng thích ứng sinh tồn (ngoại ngữ, xử lý tình huống, tự học) và phương án mưu sinh dự phòng cụ thể nếu ra trường ${isEduOrHealth ? 'chưa xin được vị trí chính thức hoặc biên chế tại trường học/bệnh viện công lập' : 'thị trường lao động ngành này biến động hoặc bão hòa'}.
- Vòng 3 (Phương án dự phòng & Dữ liệu thực tế): Bình luận ngắn gọn sự chuẩn bị. Nếu học sinh chưa có phương án/chưa hiểu, ghi nhận khoảng trống nhận thức. Đặt đúng câu chốt tuyển sinh: "Em đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của ${targetCareer} tại ${targetUniversity} chưa?"
- Vòng 4 (Đúc kết & Chuyển giao): TUYỆT ĐỐI KHÔNG ĐẶT THÊM BẤT KỲ CÂU HỎI NÀO. Tổng kết 3 khoảng trống nhận thức thực tế bộc lộ trong phiên, trích dẫn đúng từ khóa của học sinh và chỉ định sang Bước 3: Đối chứng Dữ liệu Khách quan.`;

  let specificDirective = '';
  if (isAskingTermDefinition(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh đang hỏi lại thuật ngữ hoặc nói chưa hiểu. Dừng ngay thuật ngữ vĩ mô. Dành đúng 1 câu định nghĩa bình dân kèm ví dụ cụ thể phù hợp ngành "${targetCareer}", sau đó mới kết nối với câu hỏi tiếp theo theo lộ trình mà không lặp lại câu hỏi trước.`;
  }
  if (isEmotionalReasoning(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh vừa nêu lý do cảm tính. ${isEduOrHealth ? `Bóc tách thực tế áp lực đào tạo, trách nhiệm đạo đức và kỳ thi viên chức khắt khe của ngành "${targetCareer}", tuyệt đối không dùng từ thu nhập hào nhoáng hay thị trường kinh doanh.` : `Bóc tách ngay sự khác biệt giữa truyền thông quảng cáo và thực tế phân hóa thu nhập của ngành "${targetCareer}".`}`;
  }
  if (isVagueEffort(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh vừa dùng từ mơ hồ ("cố gắng", "quyết tâm"). Truy vấn xem sự cố gắng đó cụ thể là hành động gì trong tuần này, tháng này.`;
  }
  if (isConfusionOrAnxiety(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh đang hoang mang/lo lắng. Phải có 1 câu trấn an duy lý: "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm."`;
  }
  if (isUncertaintyOrHelpRequest(userMsg)) {
    specificDirective += `\n[LƯU Ý ĐẶC BIỆT]: Học sinh nói "chưa biết" hoặc "không biết nguồn". Công nhận sự trung thực, không trách móc, hướng dẫn ghi lại để chất vấn Mentor tại Bước 4.`;
  }

  switch (round) {
    case 1:
      return baseDirective + specificDirective + `\n\n[HIỆN TẠI ĐANG Ở LƯỢT 1 - NĂNG LỰC & RÀO CẢN DO DỰ]:
Học sinh vừa trả lời câu hỏi khởi đầu.
Áp dụng đúng cấu trúc 3 câu (dưới 110 từ, không khen ngợi sáo rỗng):
- Câu 1: ${mismatch && mismatch.isMismatch ? `BẮT BUỘC nêu ngay điểm lệch pha Holland: ngành "${targetCareer}" đòi hỏi nhóm ${mismatch.letterName} trong khi mã RIASEC của em (${hollandCode}) lại thiếu chữ cái này.` : `Phản hồi trực diện điều học sinh vừa chia sẻ về năng lực học tập hoặc lý do chọn ngành "${targetCareer}".`}
- Câu 2: ${isOverconfident ? (isEduOrHealth ? `Chỉ ra nghịch lý giữa sự tự tin với áp lực học thuật, chỉ tiêu tuyển sinh và kỳ thi tuyển viên chức cạnh tranh khắt khe của ngành "${targetCareer}".` : `Bóc tách mỏ neo hào nhoáng, đưa ra nghịch lý giữa sự tự tin thái quá với độ khó học thuật và áp lực đào thải của ngành "${targetCareer}".`) : `Bóc tách tâm lý do dự, chỉ ra rằng mức tự tin ${confidenceScore}/10 phản ánh sự thiếu hụt dữ liệu thực chứng và lo ngại rào cản năng lực trong ngành "${targetCareer}".`}
- Câu 3: Đặt 1 câu hỏi truy vấn sâu chuyển tiếp sang Lượt 2: ${isEduOrHealth ? `"Trong 4-5 năm tới, khi AI và tự động hóa có thể đảm nhận các việc như soạn giáo án, giảng bài số (hoặc chẩn đoán hình ảnh, phân tích bệnh án) trong ngành ${targetCareer}, đâu là năng lực chuyên sâu hoặc tư duy đặc thù của bản thân mà em tin rằng công nghệ không thể thay thế?"` : `"Trong 4-5 năm tới, khi AI và tự động hóa có thể đảm nhận các tác vụ cơ bản của ngành ${targetCareer}, đâu là năng lực chuyên sâu hoặc tư duy đặc thù của bản thân mà em tin rằng công nghệ không thể thay thế?"`}`;

    case 2:
      return baseDirective + specificDirective + `\n\n[HIỆN TẠI ĐANG Ở LƯỢT 2 - KỸ NĂNG ĐỐI DIỆN CÔNG NGHỆ]:
Học sinh vừa trả lời về AI và kỹ năng trong ngành "${targetCareer}".
Áp dụng đúng cấu trúc 3 câu (dưới 110 từ, phản biện điềm đạm):
- Câu 1: Phản hồi trực diện nhận thức của học sinh về công nghệ AI (tuyệt đối không khen ngợi sáo rỗng, không lặp lại câu hỏi trước).
- Câu 2: Đưa ra nghịch lý thực tế về việc AI và công nghệ đang tự động hóa các tác vụ quy chuẩn trong ngành "${targetCareer}".
- Câu 3: Đặt 1 câu hỏi truy vấn sâu chuyển tiếp sang Lượt 3: ${isEduOrHealth ? `"Nếu sau khi tốt nghiệp ngành ${targetCareer}, kỳ thi viên chức cạnh tranh gay gắt và em chưa xin được biên chế hay vị trí chính thức tại trường học/bệnh viện công lập, em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn (ngoại ngữ, xử lý tình huống, tự học) và phương án mưu sinh dự phòng cụ thể nào?"` : `"Nếu sau khi tốt nghiệp ${targetCareer}, thị trường biến động hoặc chưa thể tìm được việc làm chuyên môn ngay, em đã chuẩn bị Bộ kỹ năng chuyển đổi nào (ngoại ngữ, kỹ năng số, giao tiếp) để tìm các công việc linh hoạt nhằm tự nuôi sống bản thân?"`}`;

    case 3:
      return baseDirective + specificDirective + `\n\n[HIỆN TẠI ĐANG Ở LƯỢT 3 - PHƯƠNG ÁN DỰ PHÒNG & DỮ LIỆU THỰC TẾ]:
Học sinh vừa trả lời về phương án dự phòng và kỹ năng thích ứng.
Áp dụng đúng cấu trúc 3 câu (dưới 100 từ):
- Câu 1: Phản hồi trực diện mức độ chuẩn bị của học sinh (nếu học sinh hỏi thuật ngữ/chưa có kế hoạch thì ghi nhận khoảng trống nhận thức).
- Câu 2: Đưa ra nghịch lý giữa kế hoạch trên lý thuyết với tính khốc liệt của thực tế tuyển sinh và việc làm.
- Câu 3: Đặt đúng câu chốt truy vấn dữ liệu: "Một quyết định ở mức tự tin ${confidenceScore}/10 cần dựa trên số liệu xác thực. Em đã từng trực tiếp tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và học phí thực tế của ngành ${targetCareer} tại ${targetUniversity} chưa, hay vẫn chủ yếu nghe qua truyền thông mạng xã hội?"`;

    case 4:
    default:
      return FINAL_CHALLENGE_PROMPT(targetCareer, targetUniversity, confidenceScore);
  }
}

function generateSocraticHeuristicReply(round, anchor = {}, userMsg = '', isFinal = false) {
  const targetCareer = (anchor.target_career || anchor.target_major || '').trim() || 'Công nghệ thông tin';
  const targetUniversity = (anchor.target_university || '').trim() || 'Đại học Bách Khoa';
  const confidenceScore = anchor.confidence_score || anchor.confidence_score_initial || '8';
  const numScore = parseFloat(confidenceScore) || 8;
  const isOverconfident = numScore >= 7;
  const isEduOrHealth = isEducationOrHealth(targetCareer);
  const mismatch = checkHollandSignatureMismatch(targetCareer, anchor.holland_code || anchor.holland_codes);

  // VÒNG 4 (ĐÚC KẾT & CHUYỂN GIAO - TUYỆT ĐỐI KHÔNG HỎI THÊM)
  if (isFinal || round >= 4) {
    if (isEduOrHealth) {
      return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức thực tế:\n` +
        `1. **Khoảng trống năng lực:** Giữa nhận thức ban đầu với áp lực học thuật, thi tuyển viên chức và chỉ tiêu biên chế công lập thực tế của ngành **${targetCareer}**.\n` +
        `2. **Khoảng trống công nghệ & sinh tồn:** Nguy cơ tự động hóa từ AI đối với các tác vụ giảng dạy/khám chữa bệnh và sự thiếu hụt phương án mưu sinh dự phòng nếu chưa có biên chế ngay sau tốt nghiệp.\n` +
        `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa từng trực tiếp tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và học phí thực tế của ngành **${targetCareer}** tại **${targetUniversity}**.\n\n` +
        `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay truy vết Đề án tuyển sinh, điểm chuẩn và học phí thực tế để xây dựng cơ sở vững chắc cho quyết định của mình!`;
    }
    return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức thực tế:\n` +
      `1. **Khoảng trống năng lực:** Giữa kỳ vọng ban đầu với độ khó học thuật và áp lực thực tế của ngành **${targetCareer}**.\n` +
      `2. **Khoảng trống công nghệ & sinh tồn:** Nguy cơ tự động hóa từ AI đối với các tác vụ cơ bản và sự thiếu hụt Bộ kỹ năng chuyển đổi sinh tồn để tìm các công việc linh hoạt nếu thị trường biến động.\n` +
      `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa từng trực tiếp tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm gần nhất và học phí thực tế của ngành **${targetCareer}** tại **${targetUniversity}**.\n\n` +
      `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay truy vết Đề án tuyển sinh, điểm chuẩn và học phí thực tế để xây dựng cơ sở vững chắc cho quyết định của mình!`;
  }

  // 1. KHI HỌC SINH HỎI LẠI THUẬT NGỮ ("...là gì?", "chưa hiểu")
  if (isAskingTermDefinition(userMsg)) {
    if (round === 2) {
      if (isEduOrHealth) {
        return `Trong ngành **${targetCareer}**, "tác vụ cơ bản" là các công việc mang tính quy chuẩn lặp lại như soạn giáo án mẫu, tạo bài giảng điện tử hay tra cứu phác đồ bệnh án cơ bản mà AI hiện nay xử lý rất nhanh.\n\nThực tế công nghệ đòi hỏi người làm giáo dục và y tế phải sở hữu năng lực thấu cảm, tương tác và đạo đức nghề nghiệp sâu sắc.\n\nĐâu là năng lực đặc thù con người mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành **${targetCareer}**?`;
      }
      return `"Tác vụ cơ bản" là các công việc mang tính quy chuẩn lặp lại (như viết mã mẫu, dựng layout hay nhập dữ liệu) mà AI hiện nay xử lý nhanh hơn con người.\n\nThực tế cho thấy làn sóng tự động hóa đang trực tiếp cạnh tranh với nhân sự mới vào nghề trong ngành **${targetCareer}**.\n\nĐâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`;
    } else {
      if (isEduOrHealth) {
        return `"Bộ kỹ năng thích ứng sinh tồn" là các năng lực linh hoạt như ngoại ngữ, xử lý tình huống thực tế, kỹ năng số và tự học giúp em có thể làm gia sư online, trợ giảng hoặc làm việc tại các cơ sở ngoài công lập nếu chưa đỗ biên chế.\n\nThực tế chỉ tiêu tuyển dụng viên chức ngành **${targetCareer}** hàng năm luôn có tính cạnh tranh rất cao.\n\nEm đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`;
      }
      return `"Kỹ năng chuyển đổi" là những năng lực nền tảng cốt lõi (ngoại ngữ, tư duy số, giải quyết vấn đề và giao tiếp) giúp em linh hoạt thích nghi sang các vị trí khác khi thị trường biến động.\n\nThực tế thị trường ngành **${targetCareer}** sau 4-5 năm tới luôn có chu kỳ đào thải khắc nghiệt đối với nhân sự thiếu khả năng đa nhiệm.\n\nEm đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`;
    }
  }

  // 2. KHI HỌC SINH NÊU LÝ DO CẢM TÍNH ("kiếm nhiều tiền", "nghe nói hot")
  if (isEmotionalReasoning(userMsg)) {
    if (round === 1) {
      if (isEduOrHealth) {
        return `Nhiều người nghĩ ngành **${targetCareer}** là công việc an nhàn ổn định, nhưng thực tế áp lực công việc, trách nhiệm đạo đức và kỳ thi viên chức khắt khe hơn rất nhiều.\n\nĐể gắn bó lâu dài, người học cần có năng lực chuyên môn thực sự và khả năng chịu áp lực cao chứ không chỉ dựa vào cảm tính.\n\nNgoài sự yêu thích, điểm số môn học cụ thể nào hoặc trải nghiệm thực tế nào khiến em tự tin mình đủ năng lực học tập tốt ngành **${targetCareer}**?`;
      }
      return `Truyền thông thường vẽ ra viễn cảnh ngành **${targetCareer}** có mức thu nhập nghìn đô, nhưng đó chỉ là nhóm 5-10% chuyên gia xuất sắc nhất.\n\nThực tế thị trường cho thấy mức lương phân hóa rất mạnh và đòi hỏi năng lực học thuật khắt khe chứ không dễ dàng như quảng cáo.\n\nNgoài kỳ vọng về thu nhập, điểm số môn học cụ thể nào hoặc sản phẩm thực tế nào khiến em tự tin mình đủ sức trụ lại trong ngành này?`;
    }
  }

  // 3. KHI HỌC SINH DÙNG TỪ MƠ HỒ ("cố gắng", "quyết tâm")
  if (isVagueEffort(userMsg)) {
    if (round === 1) {
      return `Sự quyết tâm chỉ có giá trị thực tế khi được chuyển hóa thành các hành động đo đếm được cụ thể mỗi tuần.\n\nĐộ khó học thuật và áp lực rèn luyện của ngành **${targetCareer}** tại đại học rất lớn, khiến nhiều sự cố gắng cảm tính dễ bị hụt hơi.\n\nCụ thể trong tuần này hoặc tháng này, em đã có hành động thực tế nào như tự học giáo trình hay rèn luyện năng lực chuyên sâu của ngành **${targetCareer}**?`;
    } else if (round === 2) {
      return `Quyết tâm suông không thể ngăn được làn sóng công nghệ thay thế các thao tác kỹ thuật cơ bản nếu em không có kỹ năng khác biệt.\n\nTrong ngành **${targetCareer}**, AI đang ngày càng hoàn thiện các tác vụ thực thi với tốc độ vượt trội con người.\n\n${isEduOrHealth ? `Em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn (ngoại ngữ, xử lý tình huống, tự học) và phương án mưu sinh dự phòng cụ thể nào nếu chưa xin được biên chế hay vị trí chính thức?` : `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để không bị đào thải nếu ngành này bão hòa?`}`;
    }
  }

  // 4. KHI HỌC SINH BỘC LỘ SỰ BỐI RỐI HOẶC NÓI "EM HOANG MANG", "EM LO LẮNG"
  if (isConfusionOrAnxiety(userMsg)) {
    const reassurance = "Sự băn khoăn là phản ứng tự nhiên khi nhận ra khoảng trống thông tin. Nhìn thẳng vào thực tế là bước đầu tiên để em ra quyết định có trách nhiệm.";
    if (round === 1) {
      return `${reassurance}\n\nChương trình đào tạo ngành **${targetCareer}** đòi hỏi độ khó học thuật và áp lực thực tế vượt trội hơn nhiều so với kỳ vọng ban đầu.\n\n${isEduOrHealth ? `Trong 4-5 năm tới khi AI và công nghệ tự động hóa mạnh mẽ các việc như soạn giáo án, bài giảng số (hoặc chẩn đoán hình ảnh, phân tích bệnh án) trong ngành **${targetCareer}**, đâu là năng lực con người đặc thù mà em tin AI không thể thay thế ở bản thân em?` : `Trong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin AI không thể thay thế ở bản thân em?`}`;
    } else if (round === 2) {
      return `${reassurance}\n\nLàn sóng tự động hóa trong ngành **${targetCareer}** đang tái cấu trúc lại các vị trí việc làm cơ bản.\n\n${isEduOrHealth ? `Nếu sau khi tốt nghiệp ngành **${targetCareer}**, kỳ thi viên chức cạnh tranh gay gắt và em chưa xin được biên chế hay vị trí chính thức tại trường học/bệnh viện công lập, em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn và phương án mưu sinh dự phòng cụ thể nào?` : `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành này biến động?`}`;
    } else {
      return `${reassurance}\n\nMột quyết định nghề nghiệp có trách nhiệm cần điểm tựa số liệu vững chắc thay vì cảm tính.\n\nEm đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`;
    }
  }

  // 5. KHI HỌC SINH NÓI "CHƯA BIẾT" HOẶC "KHÔNG BIẾT NGUỒN"
  if (isUncertaintyOrHelpRequest(userMsg)) {
    const guidance = "Thầy ghi nhận sự trung thực của em khi nhìn nhận khoảng trống thông tin này; em hãy đưa câu hỏi này vào danh mục chất vấn Mentor tại Bước 4.";
    if (round === 1) {
      return `${guidance}\n\nĐộ khó học thuật và nguy cơ tự động hóa của ngành **${targetCareer}** là thách thức sống còn đối với nhân sự mới.\n\n${isEduOrHealth ? `Trong 4-5 năm tới khi AI và công nghệ tự động hóa mạnh mẽ các việc như soạn giáo án, bài giảng số (hoặc chẩn đoán hình ảnh, phân tích bệnh án) trong ngành **${targetCareer}**, đâu là năng lực con người đặc thù mà em tin AI không thể thay thế ở bản thân em?` : `Đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em trong ngành này?`}`;
    } else if (round === 2) {
      return `${guidance}\n\nThực tế cho thấy áp lực việc làm ngành **${targetCareer}** luôn đòi hỏi người học phải có phương án thích ứng linh hoạt.\n\n${isEduOrHealth ? `Nếu sau khi tốt nghiệp ngành **${targetCareer}**, kỳ thi viên chức cạnh tranh gay gắt và em chưa xin được biên chế hay vị trí chính thức tại trường học/bệnh viện công lập, em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn và phương án mưu sinh dự phòng cụ thể nào?` : `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu ngành này biến động sau tốt nghiệp?`}`;
    } else {
      return `${guidance}\n\nĐể hoàn thiện cơ sở dữ liệu cho quyết định của mình, em cần kiểm chứng bằng dữ liệu tuyển sinh chính thức.\n\nEm đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`;
    }
  }

  if (isGreetingOnly(userMsg)) {
    return isOverconfident
      ? `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Em hãy trả lời câu hỏi ở trên: Điểm số hay trải nghiệm thực tế cụ thể nào khiến em tự tin ${confidenceScore}/10 vào ngành **${targetCareer}**?`
      : `Chào em. Thầy trò mình hãy đi thẳng vào vấn đề nhé. Mức tự tin của em chỉ ở mức ${confidenceScore}/10: Rào cản năng lực cụ thể nào hoặc sự thiếu hụt thông tin nào về ngành **${targetCareer}** đang khiến em do dự?`;
  }

  // 6. PHẢN HỒI THEO TIẾN TRÌNH 4 VÒNG CAN THIỆP CHUẨN MỰC (CẤU TRÚC 3 CÂU)
  switch (round) {
    case 1: {
      let sentence1 = `Thầy ghi nhận chia sẻ của em về nền tảng năng lực học tập ban đầu đối với ngành **${targetCareer}**.`;
      if (mismatch && mismatch.isMismatch) {
        sentence1 = `Thầy nhận thấy ngay điểm lệch pha: Ngành **${targetCareer}** đòi hỏi đặc trưng nhóm **${mismatch.letterName}** (${mismatch.desc}), nhưng kết quả Holland của em lại thiếu chữ cái này.`;
      }

      if (isOverconfident) {
        if (isEduOrHealth) {
          return `${sentence1}\n\nĐộ khó học thuật ở bậc đại học, áp lực thực tế và kỳ thi tuyển viên chức khắt khe hơn rất nhiều so với những hình dung ban đầu.\n\nTrong 4-5 năm tới khi AI và công nghệ tự động hóa mạnh mẽ các việc như soạn giáo án, bài giảng số (hoặc chẩn đoán hình ảnh, phân tích bệnh án) trong ngành **${targetCareer}**, đâu là năng lực con người đặc thù mà em tin AI không thể thay thế ở bản thân em?`;
        }
        return `${sentence1}\n\nĐộ khó học thuật ở bậc đại học và sự phân hóa thu nhập thực tế khắt khe hơn rất nhiều so với những hình ảnh hào nhoáng trên truyền thông.\n\nTrong 4-5 năm tới khi AI tự động hóa mạnh mẽ các công việc cơ bản của ngành **${targetCareer}**, đâu là kỹ năng chuyên sâu đặc thù mà em tin rằng AI không thể thay thế được ở bản thân em?`;
      } else {
        return `${sentence1}\n\nMức tự tin **${confidenceScore}/10** phản ánh sự do dự và nhận thức rõ về khoảng trống thông tin của em trước ngưỡng cửa đại học.\n\nRào cản năng lực học tập cụ thể nào hay sự thiếu hụt dữ liệu nào về ngành **${targetCareer}** đang là nguyên nhân chính khiến em băn khoăn và chưa dám chắc chắn?`;
      }
    }

    case 2:
      return `Nhận thức của em về tác động của công nghệ trong ngành **${targetCareer}** là điểm khởi đầu cần thiết.\n\nTuy nhiên, các thao tác kỹ thuật lặp lại sẽ bị AI thay thế rất nhanh, tạo nên áp lực cạnh tranh lớn cho nhân sự mới.\n\n${isEduOrHealth ? `Nếu sau khi tốt nghiệp ngành **${targetCareer}**, kỳ thi viên chức cạnh tranh gay gắt và em chưa xin được biên chế hay vị trí chính thức tại trường học/bệnh viện công lập, em đã chuẩn bị Bộ kỹ năng thích ứng sinh tồn (ngoại ngữ, xử lý tình huống, tự học) và phương án mưu sinh dự phòng cụ thể nào?` : (isOverconfident ? `Em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm linh hoạt nào để thích ứng nếu thị trường ngành **${targetCareer}** biến động khi em tốt nghiệp?` : `Trước nguy cơ AI tự động hóa, rào cản kỹ năng nào ở bản thân khiến em lo lắng nhất nếu ngành **${targetCareer}** biến động việc làm khi em tốt nghiệp?`)}`;

    case 3:
      return `Mức độ chuẩn bị cho thấy em đã bắt đầu quan tâm đến khả năng thích ứng linh hoạt trong tương lai.\n\nDù vậy, một quyết định ở mức tự tin **${confidenceScore}/10** đòi hỏi phải được xây dựng trên dữ liệu xác thực chứ không thể chỉ là ước đoán.\n\nEm đã tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}** chưa?`;

    case 4:
    default:
      if (isEduOrHealth) {
        return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức cốt lõi:\n` +
          `1. **Khoảng trống năng lực & yêu cầu khắt khe:** Giữa nhận thức ban đầu với áp lực học thuật, thi tuyển viên chức và chỉ tiêu biên chế công lập thực tế của ngành **${targetCareer}**.\n` +
          `2. **Khoảng trống thích ứng công nghệ & phương án mưu sinh:** Nguy cơ tự động hóa từ AI đối với các tác vụ giảng dạy/khám chữa bệnh và sự thiếu hụt phương án mưu sinh dự phòng nếu chưa có biên chế ngay sau tốt nghiệp.\n` +
          `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa tự tay kiểm chứng Điểm chuẩn 3 năm gần nhất, Học phí thực tế và Chỉ tiêu tuyển sinh của **${targetCareer}** tại **${targetUniversity}**.\n\n` +
          `Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế nhằm xây dựng cơ sở vững chắc cho quyết định của mình!`;
      }
      return `Qua 4 vòng phản tư Socrates, em đã dũng cảm nhìn thẳng vào 3 khoảng trống nhận thức cốt lõi:\n` +
        `1. **Khoảng trống năng lực & kỳ vọng thu nhập:** Giữa hình ảnh hào nhoáng trên truyền thông với độ khó học thuật và phân hóa thu nhập thực tế của ngành **${targetCareer}**.\n` +
        `2. **Khoảng trống thích ứng công nghệ:** Nguy cơ tự động hóa từ AI đối với các tác vụ cơ bản và sự thiếu hụt Bộ kỹ năng chuyển đổi sinh tồn.\n` +
        `3. **Khoảng trống dữ liệu tuyển sinh:** Quyết định ở mức tự tin **${confidenceScore}/10** nhưng vẫn chưa đối chiếu số liệu thực tế về điểm chuẩn 3 năm, học phí và đề án tuyển sinh tại **${targetUniversity}**.\n\n` +
        `Bây giờ, em hãy chuyển sang **Bước 3: Đối chứng Dữ liệu Khách quan** để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế nhằm xây dựng cơ sở vững chắc cho quyết định của mình!`;
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
