// ==============================================================================
// ĐỀ TÀI VISEF 2026 - LĨNH VỰC KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS)
// TÁC NHÂN SOCRATES PHẢN TƯ THÍCH ỨNG CHỐNG LẶP & ĐIỀU PHỐI 4 VÒNG TỰ NHIÊN
// File: server.js (ESM Module - Chạy lệnh: node server.js)
// ==============================================================================

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
const fallbackKey = typeof Buffer !== 'undefined'
  ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
  : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || fallbackKey);

// 1. SYSTEM PROMPT BẤT BIẾN (KHÓA CHẶT RÀO CẢN SƯ PHẠM VÀ THUẬT TOÁN)
const SYSTEM_INSTRUCTION = `
BẠN LÀ THẦY SOCRATES - CHUYÊN GIA CAN THIỆP TÂM LÝ VÀ PHẢN TƯ NHẬN THỨC NGHỀ NGHIỆP TRONG ĐỀ TÀI VISEF 2026.
Bạn đang trò chuyện 1-1 với một học sinh THPT.

[RÀO CẢN TUYỆT ĐỐI - VI PHẠM SẼ BỊ HỦY KẾT QUẢ NGHIÊN CỨU]:
1. TUYỆT ĐỐI KHÔNG ĐƯỢC LẶP LẠI CÂU HỎI: Đọc kỹ tin nhắn gần nhất của bạn. Nếu bạn vừa hỏi câu gì ở lượt trước, CẤM TUYỆT ĐỐI không được hỏi lại câu đó dưới bất kỳ hình thức nào!
2. PHẢN HỒI THỰC SỰ THEO Ý HỌC SINH:
   - Nếu học sinh nói "Vì em thích": Hãy hỏi sâu vào việc em thích cụ thể điều gì trong hoạt động chuyên môn (đứng lớp, truyền đạt, chấm bài...), đừng hỏi lại câu hỏi cũ.
   - Nếu học sinh nói "Tùy sư phạm gì thì có tổ hợp đó": Hãy khen học sinh nắm vấn đề rất nhanh, và hỏi ngay: "Vậy cụ thể em đang hướng tới Sư phạm môn gì (Toán, Văn, Anh, Tiểu học...) để xác định nhóm năng lực cần thiết?"
3. KHÔNG TỰ BỊA MÃ TỔ HỢP CỐ ĐỊNH: Không cam kết mã tổ hợp trường nào để tránh ảo giác AI.

[TIẾN TRÌNH 4 VÒNG - BẮT BUỘC TIẾN TRIỂN THEO TỪNG LƯỢT]:
- VÒNG 1 (Động cơ): Làm rõ động cơ nội sinh (thực sự hiểu nghề) vs ngoại sinh (theo trào lưu, gia đình).
- VÒNG 2 (Áp lực & Thách thức nghề): Đưa ra áp lực thực tế đặc thù của nghề (với Sư phạm là: áp lực quản lý học sinh cá biệt, đổi mới phương pháp, thi tuyển viên chức cạnh tranh). Hỏi học sinh chuẩn bị năng lực gì để vượt qua.
- VÒNG 3 (Tổ hợp môn & Năng lực thực tế - ĐIỂM GÃY NHẬN THỨC):
  * Nếu học sinh chưa rõ tổ hợp hoặc chưa chọn môn cụ thể -> BẮT BUỘC DÙNG KỸ THUẬT 3 NHỊP:
    + Nhịp 1: Nêu nghịch lý giữa ước mơ và việc chưa chuẩn bị công cụ xét tuyển.
    + Nhịp 2: Nêu rõ ngành này gắn với nhóm năng lực Tư duy Tự nhiên hay Ngôn ngữ/Xã hội (nhắc Bước 3 sẽ tự tra cứu đề án chính thức).
    + Nhịp 3: Đặt câu hỏi trung lập: "Nhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?"
- VÒNG 4 (Tái cấu trúc mục tiêu & Điều hướng sang Bước 3):
  * Đưa ra giải pháp thích ứng kép (bứt phá điểm số HOẶC chọn ngành theo sở trường).
  * RA LỆNH DỨT KHOÁT: Yêu cầu học sinh bấm chuyển sang Bước 3 để tự tay tra cứu Đề án tuyển sinh và nhập bảng đối chứng!

[CẤU TRÚC PHẢN HỒI MỖI LẦN]:
- 01 câu thấu cảm / ghi nhận trực tiếp ý học sinh vừa nói.
- 01 câu gợi mở / phản biện nhận thức.
- Kết thúc bằng ĐÚNG 01 CÂU HỎI MỚI (Không trùng lặp với bất kỳ câu hỏi nào phía trên).
`;

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

// 2. API ENDPOINT TIẾP NHẬN PHIÊN CHAT
app.post('/api/socrates-chat', async (req, res) => {
    try {
        const { 
            studentProfile = {}, 
            chatHistory = [], 
            userMessage = '' 
        } = req.body;

        const trimmedMsg = (userMessage || '').trim();
        const lowerTrimmed = trimmedMsg.toLowerCase();

        // Đếm chính xác số lượt học sinh đã trả lời để xác định Vòng
        const userTurns = req.body.round 
          ? Number(req.body.round) 
          : (chatHistory.filter(m => m.role === 'user').length + 1);

        const hollandCode = studentProfile.hollandCode || studentProfile.holland_code || 'AEI';
        const targetCareer = studentProfile.targetCareer || studentProfile.target_career || studentProfile.targetMajor || 'Sư phạm';
        const targetSchool = studentProfile.targetSchool || studentProfile.target_university || 'ĐH Quy Nhơn';
        const confidenceT0 = studentProfile.confidenceT0 || studentProfile.confidence_score || studentProfile.confidence || 5;

        // PHẢN XẠ 1: Nếu học sinh thắc mắc "Sao thầy hỏi lại?"
        if (isAskingWhyRepeat(trimmedMsg)) {
            const explainReply = `Thầy hiểu cảm xúc băn khoăn của em. Thầy hỏi lại không phải để lặp lại vô nghĩa, mà muốn hai thầy trò cùng bóc tách sâu hơn vào cảm nhận thực sự của em thay vì câu trả lời thoáng qua.\n\nĐối với ngành **${targetCareer}**, điều gì trong hoạt động chuyên môn hàng ngày khiến em cảm thấy thực sự hứng khởi nhất?`;
            return res.status(200).json({
                success: true,
                round: Math.min(userTurns, 4),
                response: explainReply,
                reply: explainReply,
                isCompleted: false
            });
        }

        // PHẢN XẠ 2: Nếu học sinh nói "Vì em thích" / "Em thích thôi"
        const isBecauseILike = lowerTrimmed === 'vì em thích' || lowerTrimmed === 'em thích' || 
          lowerTrimmed === 'thích thôi' || lowerTrimmed === 'thích' || lowerTrimmed === 'do em thích' ||
          lowerTrimmed.includes('vì em thích') || lowerTrimmed.includes('thích ngành này');

        if (isBecauseILike && userTurns <= 2) {
          const deepLikeReply = `Thầy rất ghi nhận niềm yêu thích tự nhiên của em dành cho ngành **${targetCareer}**.\n\nTuy nhiên, sự yêu thích chỉ trở thành điểm tựa vững chắc khi em hiểu rõ các công việc chuyên môn thực tế hàng ngày đằng sau nó.\n\nCụ thể trong các hoạt động chuyên môn của nghề (như chuẩn bị bài giảng, đứng lớp truyền đạt kiến thức, quản lý lớp học hay chấm bài), hoạt động nào khiến em cảm thấy bản thân có nhiều năng lượng và sự kiên nhẫn nhất?`;
          return res.status(200).json({
            success: true,
            round: Math.min(userTurns, 4),
            response: deepLikeReply,
            reply: deepLikeReply,
            isCompleted: false
          });
        }

        // PHẢN XẠ 3: Nếu học sinh nói "Tùy sư phạm gì thì có tổ hợp đó"
        const isDependsOnSubject = (lowerTrimmed.includes('tùy') || lowerTrimmed.includes('tuy')) && 
          (lowerTrimmed.includes('sư phạm') || lowerTrimmed.includes('su pham') || lowerTrimmed.includes('môn') || lowerTrimmed.includes('ngành'));

        if (isDependsOnSubject) {
          const subjectClarifyReply = `Thầy khen em nắm vấn đề rất nhanh và chính xác: Mỗi phân ngành sư phạm sẽ xét tuyển theo các tổ hợp môn rất khác nhau!\n\nĐể xác định đúng vũ khí học thuật cần chuẩn bị, điều cốt lõi là phải biết rõ môn học cụ thể mà em muốn gắn bó.\n\nVậy cụ thể em đang hướng tới Sư phạm môn gì (Toán, Ngữ văn, Tiếng Anh, Tiểu học...) để xác định nhóm năng lực cần thiết?`;
          return res.status(200).json({
            success: true,
            round: Math.min(userTurns, 4),
            response: subjectClarifyReply,
            reply: subjectClarifyReply,
            isCompleted: false
          });
        }

        // PHẢN XẠ 4: Nếu học sinh chỉ chào hỏi xã giao
        if (isGreetingOnly(trimmedMsg)) {
            const greetingReply = `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
            return res.status(200).json({
                success: true,
                round: Math.min(userTurns, 4),
                response: greetingReply,
                reply: greetingReply,
                isCompleted: false
            });
        }

        // PHẢN XẠ 5: Kỹ thuật 3 nhịp ở Vòng 3 nếu học sinh chưa tìm hiểu tổ hợp môn
        const isAskingCombo = [
          'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
          'chưa tìm hiểu', 'chưa biết', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
          'chưa xem', 'em chưa biết', 'chưa tìm', 'không rõ'
        ].some(k => lowerTrimmed.includes(k));

        if (userTurns === 3 && isAskingCombo) {
          const directReply = `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\nQuy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực Tư duy Tự nhiên hay Ngôn ngữ/Xã hội. Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\nNhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?`;
          return res.status(200).json({
            success: true,
            round: 3,
            response: directReply,
            reply: directReply,
            isCompleted: false
          });
        }

        const currentContext = `
[THÔNG TIN HỌC SINH]:
- Ngành: ${targetCareer} | Trường: ${targetSchool}
- Nhóm Holland: ${hollandCode} | Tự tin ban đầu: ${confidenceT0}/10

[MỤC TIÊU LƯỢT CHAT HIỆN TẠI]:
Bạn đang ở LƯỢT THỨ ${userTurns} của học sinh.
- Nếu lượt 1 hoặc 2: Tập trung giải quyết dứt điểm VÒNG 1 (Động cơ) và VÒNG 2 (Áp lực nghề nghiệp đặc thù: quản lý lớp học, thi viên chức, tự động hóa...). 
- Nếu lượt 3: BẮT BUỘC thực hiện VÒNG 3 (Tổ hợp môn & Năng lực thực tế - Kích hoạt 3 Nhịp).
- Nếu lượt 4 trở đi: BẮT BUỘC chốt VÒNG 4 (3 hướng thích ứng) và ra lệnh chuyển sang Bước 3!

CẢNH BÁO: Đọc kỹ lịch sử trò chuyện. TUYỆT ĐỐI KHÔNG lặp lại câu hỏi đã hỏi!
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: SYSTEM_INSTRUCTION + "\n" + currentContext,
            generationConfig: {
                temperature: 0.35,
                topP: 0.85,
                maxOutputTokens: 350
            }
        });

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

        const result = await model.generateContent({ contents });
        const aiResponseText = result.response.text();

        return res.status(200).json({
            success: true,
            round: Math.min(userTurns, 4),
            response: aiResponseText,
            reply: aiResponseText,
            isCompleted: userTurns >= 4
        });

    } catch (error) {
        console.error("Lỗi:", error);
        return res.status(500).json({ success: false, message: "Lỗi kết nối AI Socrates!" });
    }
});

// Hỗ trợ cả endpoint /api/chat để tương thích ngược 100%
app.post('/api/chat', (req, res) => {
  req.url = '/api/socrates-chat';
  app.handle(req, res);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[VISEF 2026] Server AI Socrates đang vận hành tại cổng ${PORT}`);
});
