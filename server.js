// ==============================================================================
// ĐỀ TÀI VISEF 2026 - LĨNH VỰC KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS)
// TÁC NHÂN SOCRATES PHẢN TƯ THÍCH ỨNG THEO TIẾN TRÌNH THỰC
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

        // Đếm số lượt tương tác thực tế từ học sinh
        const studentTurns = req.body.round 
          ? Number(req.body.round) 
          : (chatHistory.filter(m => m.role === 'user').length + 1);

        const hollandCode = studentProfile.hollandCode || studentProfile.holland_code || 'Chưa rõ';
        const targetCareer = studentProfile.targetCareer || studentProfile.target_career || studentProfile.targetMajor || 'Chưa rõ';
        const targetSchool = studentProfile.targetSchool || studentProfile.target_university || 'Chưa rõ';
        const competenceSelfEval = studentProfile.competenceSelfEval || 'Vừa sức';
        const confidenceT0 = studentProfile.confidenceT0 || studentProfile.confidence_score || studentProfile.confidence || 5;

        // 1. Thắc mắc "Sao thầy hỏi lại?"
        if (isAskingWhyRepeat(trimmedMsg)) {
            const explainReply = `Thầy hiểu cảm xúc băn khoăn của em. Thầy hỏi lại không phải để làm khó hay kiểm tra trí nhớ của em, mà muốn hai thầy trò cùng soi chiếu vấn đề từ một góc nhìn sâu sắc hơn, giúp em nhận diện rõ động lực thực sự của mình trước khi ra quyết định quan trọng.\n\nĐối với ngành **${targetCareer}**, điều gì trong công việc hàng ngày thực sự tạo cho em cảm hứng lâu dài nhất?`;
            return res.status(200).json({
                success: true,
                round: Math.min(studentTurns, 4),
                response: explainReply,
                reply: explainReply,
                isCompleted: false
            });
        }

        // 2. Chào hỏi xã giao
        if (isGreetingOnly(trimmedMsg)) {
            const greetingReply = `Chào em. Thầy trò mình cùng trò chuyện cởi mở nhé. Thầy thấy em chọn ngành **${targetCareer}** trong khi nhóm nổi trội của em là **${hollandCode}**. Em chọn ngành này vì thực sự yêu thích các hoạt động công việc hàng ngày của nó, hay vì thấy ngành này đang "hot" và được nhiều người khen ngợi?`;
            return res.status(200).json({
                success: true,
                round: Math.min(studentTurns, 4),
                response: greetingReply,
                reply: greetingReply,
                isCompleted: false
            });
        }

        // 3. Kỹ thuật 3 nhịp ở Vòng 3 nếu học sinh chưa tìm hiểu tổ hợp môn
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
            isCompleted: false
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
${studentTurns === 1 ? `- VÒNG 1: Khai thác động cơ nội sinh vs ngoại sinh (Tại sao thích ngành ${targetCareer}?).` : ""}
${studentTurns === 2 ? `- VÒNG 2: Đưa ra thách thức thực tế của ngành nghề ${targetCareer} (không dùng văn mẫu chung chung, gắn với áp lực thực tế).` : ""}
${studentTurns === 3 ? `- VÒNG 3: Hỏi về tổ hợp môn xét tuyển: "Để thi/xét tuyển vào ngành ${targetCareer}, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?". Nếu học sinh nói chưa biết/chưa tìm hiểu, BẮT BUỘC kích hoạt ngay Kỹ thuật 3 Nhịp.` : ""}
${studentTurns >= 4 ? `- VÒNG 4: Tái cấu trúc mục tiêu và kết thúc bằng mệnh lệnh điều hướng sang Bước 3.` : ""}

Hãy trả lời học sinh một cách tự nhiên, thấu cảm, sâu sắc và kết thúc bằng đúng 01 câu hỏi phản tư (riêng Vòng 4 kết thúc bằng mệnh lệnh chuyển sang Bước 3, tuyệt đối không hỏi thêm).
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: SYSTEM_INSTRUCTION + "\n" + dynamicPrompt,
            generationConfig: {
                temperature: 0.3,
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
            round: Math.min(studentTurns, 4),
            response: aiResponseText,
            reply: aiResponseText,
            isCompleted: studentTurns >= 4
        });

    } catch (error) {
        console.error("Lỗi:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
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
