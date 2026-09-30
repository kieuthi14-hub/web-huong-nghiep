// ==============================================================================
// ĐỀ TÀI VISEF 2026 - LĨNH VỰC KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS)
// TÁC NHÂN CAN THIỆP NHẬN THỨC AI SOCRATES (BƯỚC 2)
// File: server.cjs (CommonJS require version - Chạy lệnh: node server.cjs)
// ==============================================================================

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
const fallbackKey = typeof Buffer !== 'undefined'
  ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
  : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

// Khởi tạo API Key (Được lưu trong biến môi trường hoặc fallback key an toàn)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || fallbackKey);

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

// 2. API ENDPOINT TIẾP NHẬN PHIÊN CHAT
app.post('/api/socrates-chat', async (req, res) => {
    try {
        const { 
            studentProfile = {}, // { hollandCode, targetCareer, targetSchool, confidenceT0, competenceSelfEval }
            chatHistory = [],    // Mảng các tin nhắn trước: [{ role: "user"|"model", text: "..." }]
            userMessage = ''     // Tin nhắn học sinh vừa gõ
        } = req.body;

        // Tính toán số vòng đối thoại hiện tại (Turn Counter)
        // Mỗi vòng gồm 1 câu hỏi của AI và 1 câu trả lời của học sinh
        const currentRound = req.body.round 
          ? Number(req.body.round) 
          : (Math.floor((chatHistory.length / 2)) + 1);

        // Xử lý chào hỏi
        const lowerMsg = (userMessage || '').toLowerCase().trim();
        const cleanMsg = lowerMsg.replace(/[!.,?~]/g, '');
        const greetings = ['chào thầy', 'chao thay', 'chào', 'chao', 'hello', 'hi', 'dạ', 'da', 'xin chào'];
        if (greetings.includes(cleanMsg)) {
            const greetingReply = `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${studentProfile.targetCareer || 'ngành đã chọn'}** trong khi nhóm nổi trội của em là **${studentProfile.hollandCode || 'RIASEC'}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
            return res.status(200).json({
                success: true,
                round: currentRound,
                response: greetingReply,
                reply: greetingReply,
                isCompleted: false
            });
        }

        // Kỹ thuật 3 nhịp ở Vòng 3 nếu học sinh chưa tìm hiểu tổ hợp
        const isAskingCombo = [
          'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
          'chưa tìm hiểu', 'chưa biết', 'không biết môn', 'môn gì', 'khối nào', 'tổ hợp nào',
          'chưa xem', 'em chưa biết', 'chưa tìm', 'không rõ'
        ].some(k => lowerMsg.includes(k));

        if (currentRound === 3 && isAskingCombo) {
          const directReply = `Thầy hiểu cảm xúc của em. Nhưng em có nhận thấy một khoảng cách rất lớn: Em đang đặt nhiều kỳ vọng vào ngành này, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước qua cánh cửa tuyển sinh?\n\nQuy chế tuyển sinh hiện nay gắn ngành này với các nhóm năng lực trụ cột: hoặc thiên về Tư duy Logic & Dữ liệu (Toán, Tin học/Khoa học Tự nhiên), hoặc thiên về Năng lực Ngôn ngữ & Xã hội (Ngoại ngữ, Ngữ văn). Lát nữa ở Bước 3, em sẽ tự tay kiểm chứng đề án chính thức của trường mình chọn.\n\nNhìn lại kết quả học tập kỳ trước của em: Giữa các nhóm môn đó, đâu là môn sở trường tạo ưu thế cạnh tranh cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất (hoặc em có cảm thấy áp lực với môn học nào không)?`;
          return res.status(200).json({
            success: true,
            round: currentRound,
            response: directReply,
            reply: directReply,
            isCompleted: false
          });
        }

        // Xây dựng ngữ cảnh đầu vào (Intake Context)
        const contextInjection = `
[THÔNG TIN HỒ SƠ BƯỚC 1 CỦA HỌC SINH]:
- Nhóm Holland: ${studentProfile.hollandCode || "Chưa rõ"}
- Ngành mong muốn: ${studentProfile.targetCareer || "Chưa có mục tiêu rõ ràng"}
- Trường kỳ vọng: ${studentProfile.targetSchool || "Chưa xác định"}
- Tự đánh giá năng lực: ${studentProfile.competenceSelfEval || "Vừa sức"}
- Mức tự tin ban đầu (T0): ${studentProfile.confidenceT0 || 5}/10

[TRẠNG THÁI HIỆN TẠI]: Bạn đang ở VÒNG ${currentRound} trên tổng số 4 vòng.
Hãy bám sát nhiệm vụ của VÒNG ${currentRound} và các rào cản sư phạm.
`;

        // Khởi tạo Model với System Instruction và Temperature chuẩn
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: SYSTEM_INSTRUCTION + "\n" + contextInjection,
            generationConfig: {
                temperature: 0.35, // Cố định 0.35 để chống ảo giác
                topP: 0.9,
                maxOutputTokens: 350
            }
        });

        // Định dạng lại Chat History theo chuẩn SDK
        const contents = chatHistory
          .filter(msg => msg && msg.text && typeof msg.text === 'string')
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));

        // Thêm tin nhắn mới nhất của học sinh
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        // Gọi AI xử lý
        const result = await model.generateContent({ contents });
        const aiResponseText = result.response.text();

        // Gửi kết quả về giao diện người dùng
        return res.status(200).json({
            success: true,
            round: currentRound,
            response: aiResponseText,
            reply: aiResponseText,
            isCompleted: currentRound >= 4 // Đánh dấu hoàn thành Bước 2 khi xong Vòng 4
        });

    } catch (error) {
        console.error("Lỗi phiên can thiệp AI Socrates:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Hệ thống can thiệp gặp gián đoạn kỹ thuật. Vui lòng thử lại!" 
        });
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
