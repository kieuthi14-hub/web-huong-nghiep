// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// TỰ ĐỘNG CHỐNG LẶP & CÁ NHÂN HÓA 100% THEO MÔN HỌC
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

app.post('/api/socrates-chat', async (req, res) => {
    try {
        const { studentProfile, chatHistory, userMessage } = req.body;

        // 1. Kiểm tra an toàn: Lịch sử trò chuyện phải là một mảng
        const validHistory = Array.isArray(chatHistory) ? chatHistory : [];
        
        // 2. Tính số lượt tương tác thực sự của học sinh
        const studentTurns = validHistory.filter(m => m.role === 'user').length + 1;

        const trimmedMsg = (userMessage || '').trim();
        const lowerTrimmed = trimmedMsg.toLowerCase();

        const targetCareer = studentProfile?.targetCareer || "Sư phạm";
        const targetSchool = studentProfile?.targetSchool || "ĐH Quy Nhơn";
        const hollandCode = studentProfile?.hollandCode || "AEI";
        const confidenceT0 = studentProfile?.confidenceT0 || 5;

        // Phản xạ nhanh chào hỏi
        if (isGreetingOnly(trimmedMsg)) {
          return res.status(200).json({
            success: true,
            round: Math.min(studentTurns, 4),
            response: `Chào em. Thầy trò mình cùng tập trung vào nội dung định hướng nhé. Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại!`,
            reply: `Chào em. Thầy trò mình cùng tập trung vào nội dung định hướng nhé. Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại!`,
            isCompleted: false
          });
        }

        // Phản xạ nhanh đam mê
        if (lowerTrimmed === 'vì đam mê' || lowerTrimmed === 'đam mê' || lowerTrimmed.includes('vì đam mê') || lowerTrimmed.includes('do đam mê')) {
          const passionReply = `Thầy rất ghi nhận niềm đam mê của em đối với nghề giáo.\n\nĐam mê cụ thể ở khía cạnh nào: thích truyền đạt kiến thức, thích nghiên cứu bài giảng, hay thích tương tác với học sinh?`;
          return res.status(200).json({
            success: true,
            round: Math.min(studentTurns, 4),
            response: passionReply,
            reply: passionReply,
            isCompleted: false
          });
        }

        // Phản xạ nhanh chưa biết môn gì
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

        // 3. Xây dựng System Instruction tối ưu, gãy gọn, không dài dòng
        const systemPrompt = `
Bạn là Thầy Socrates - Chuyên gia can thiệp tâm lý hướng nghiệp thuộc đề tài nghiên cứu hành vi ViSEF 2026.
Bạn đang đối thoại 1-1 với một học sinh THPT có thông tin:
- Ngành mong muốn: ${targetCareer}
- Trường mục tiêu: ${targetSchool}
- Nhóm Holland: ${hollandCode}
- Mức tự tin T0: ${confidenceT0}/10

QUY TẮC BẮT BUỘC:
1. ĐỌC KỸ LỊCH SỬ CHAT: Tuyệt đối KHÔNG BAO GIỜ lặp lại câu hỏi bạn đã hỏi ở các lượt trước.
2. PHẢN HỒI THỰC SỰ: Phải dựa vào chính xác từ ngữ học sinh vừa nói để đối thoại tiếp.
   - Nếu học sinh chào: Chào lại ngắn gọn trong 1 câu và nhắc trả lời câu hỏi trước.
   - Nếu học sinh nói "vì đam mê": Hỏi sâu: "Đam mê cụ thể ở khía cạnh nào: thích truyền đạt kiến thức, thích nghiên cứu bài giảng, hay thích tương tác với học sinh?"
   - Nếu học sinh nói "chưa biết sư phạm môn gì": Khen ngợi sự thành thật, giải thích ngắn gọn rằng Sư phạm chia thành 2 nhóm lớn (Tự nhiên vs Xã hội/Ngôn ngữ), rồi hỏi: "Trong các môn học ở trường, đâu là môn sở trường của em và môn nào em còn nhiều khoảng cách nhất?"
   - Nếu học sinh nói rõ môn (ví dụ: "giỏi Toán, kém Văn"): BẮT BUỘC phải gọi tên môn Toán và Văn ra để định hướng:
     "Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00, A01), hoàn toàn tránh được rào cản môn Ngữ văn!"

TIẾN TRÌNH THEO LƯỢT CHAT (Hiện tại đang là lượt thứ ${studentTurns} của học sinh):
- Lượt 1: Bóc tách động cơ thật sự (đam mê hay phong trào).
- Lượt 2: Thử thách áp lực nghề giáo thực tế (quản lý học sinh, thi biên chế).
- Lượt 3: Chất vấn tổ hợp môn & bóc tách môn sở trường vs môn yếu.
- Lượt 4: Phân tích trực tiếp dựa trên cặp môn học sinh vừa nêu, chốt định hướng và ra lệnh chuyển sang Bước 3 để tra cứu Đề án tuyển sinh.
`;

        // 4. Chuẩn bị nội dung gửi lên Gemini API
        const contents = validHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        // Đẩy tin nhắn mới nhất vào
        contents.push({
            role: 'user',
            parts: [{ text: trimmedMsg }]
        });

        // 5. Cấu hình mô hình với multi-model fallback
        let replyText = null;
        const candidateModelNames = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
        for (const modelName of candidateModelNames) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt,
                    generationConfig: {
                        temperature: 0.25, // Hạ thấp để bám sát logic, không sáng tác lung tung
                        topP: 0.85,
                        maxOutputTokens: 400
                    }
                });

                const result = await model.generateContent({ contents });
                const resText = result?.response?.text();
                if (resText && resText.trim().length >= 25) {
                    replyText = resText.trim()
                        .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
                        .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ).*?\]\s*/i, '')
                        .replace(/^#+.*?(CHỈ ĐẠO|CHỈ THỊ).*?\n/i, '')
                        .trim();
                    break;
                }
            } catch (err) {
                // Thử model tiếp theo
            }
        }

        // Heuristic Fallback bảo hiểm nếu các model bận
        if (!replyText) {
            if (studentTurns >= 4) {
                let subjectPairAdvice = `Nắm chắc môn thế mạnh sẽ giúp em chọn đúng tổ hợp xét tuyển tối ưu và mở rộng cơ hội trúng tuyển.`;
                if ((lowerTrimmed.includes('toán') || lowerTrimmed.includes('toan')) && (lowerTrimmed.includes('văn') || lowerTrimmed.includes('van'))) {
                    subjectPairAdvice = `Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00, A01), hoàn toàn tránh được rào cản môn Ngữ văn!`;
                }
                replyText = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. ${subjectPairAdvice}\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
            } else if (studentTurns === 1) {
                replyText = `Thầy rất ghi nhận chia sẻ của em. Tuy nhiên, việc thích một ngành vì danh tiếng khác với việc sẵn sàng đối diện với áp lực công việc hàng ngày của ngành **${targetCareer}**.\n\nEm chọn ngành này xuất phát từ đam mê công việc thực tế, hay vì thấy đây là ngành được nhiều người xung quanh khen ngợi?`;
            } else if (studentTurns === 2) {
                replyText = `Thầy rất ủng hộ tinh thần trách nhiệm của em. Thực tế nghề giáo đòi hỏi nghệ thuật truyền cảm hứng, tính kiên nhẫn khi quản lý học sinh cá biệt và kỳ thi tuyển viên chức cạnh tranh rất khắt khe.\n\nĐể thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào chưa?`;
            } else {
                replyText = `Trong các phân ngành sư phạm (Khoa học Tự nhiên vs Khoa học Xã hội/Ngôn ngữ), đâu là môn sở trường tạo ưu thế cho em và môn nào em cảm thấy còn nhiều khoảng cách nhất?`;
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
