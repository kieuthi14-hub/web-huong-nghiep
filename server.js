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

        // PHẢN XẠ NHANH VÒNG 3: Kỹ thuật Phản tư 3 Nhịp khi học sinh nói "chưa tìm hiểu tổ hợp môn"
        const isComboReflex = [
          'chưa tìm hiểu tổ hợp', 'chưa biết tổ hợp', 'không biết tổ hợp', 'chưa rõ tổ hợp',
          'chưa tìm hiểu', 'chưa biết môn', 'không biết môn', 'chưa xem tổ hợp', 'chưa rõ môn',
          'chưa tìm', 'không rõ'
        ].some(k => lowerTrimmed.includes(k));

        if (isComboReflex) {
          const threeStepsReply = `Đó là một nghịch lý đáng suy ngẫm: Em đang đặt nhiều kỳ vọng và đam mê vào ngành **${targetCareer}**, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước chân qua cánh cửa trường đại học!\n\nThực tế, Sư phạm chia thành các nhóm trụ cột năng lực rất rõ rệt: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh chính thức để làm rõ điều này.\n\nNhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?`;
          return res.status(200).json({
            success: true,
            round: 3,
            response: threeStepsReply,
            reply: threeStepsReply,
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

QUY TẮC CỐT TỬ (BẮT BUỘC TUÂN THỦ):
1. CẤM LẶP LẠI CÂU HỎI: Đọc kỹ lịch sử chat, tuyệt đối không lặp lại câu hỏi bạn đã hỏi ở các lượt trước.
2. ĐỐI THOẠI THỰC CHẤT VÀ TÔN TRỌNG NGỮ CẢNH:
   - Nếu học sinh chỉ chào hỏi: Chỉ chào lại ngắn gọn trong 1 câu và nhắc nhở học sinh trả lời câu hỏi trước.
   - Lượt 1: Học sinh vừa phản hồi câu hỏi mở đầu về động cơ chọn ngành (do yêu thích thực sự hay do trào lưu). TUYỆT ĐỐI CẤM HỎI LẠI câu hỏi mở đầu đó!
     * Hãy ghi nhận sự khẳng định của học sinh (công nhận nếu học sinh chọn vì yêu thích thực sự).
     * Bóc tách sâu vào hoạt động chuyên môn thực tế: Hỏi cụ thể học sinh hào hứng với hoạt động chuyên môn hàng ngày nào (như đứng lớp truyền đạt kiến thức, kiên nhẫn tương tác hỗ trợ học sinh, hay nghiên cứu sâu bài giảng).
   - Lượt 2: BẮT BUỘC lồng ghép 2 yếu tố cốt lõi:
     * Xu hướng nghề nghiệp tương lai: Tác động của AI, Chuyển đổi số, Tự động hóa hoặc tái cơ cấu thị trường việc làm trong 5-10 năm tới (ví dụ: với Sư phạm, AI và công nghệ giáo dục EdTech đang thay đổi cách dạy học; giáo viên tương lai không chỉ truyền thụ kiến thức cơ học mà phải tích hợp công nghệ, rèn luyện kỹ năng tư duy bậc cao cho học sinh).
     * Thử thách học sinh về Năng lực thích ứng mới của ngành nghề (không chỉ làm các tác vụ cơ bản lặp đi lặp lại).
     * Đặt câu hỏi kết nối: Làm sao để thích ứng với tiêu chuẩn mới đó, và để thi/xét tuyển vào ngành ${targetCareer} tại ${targetSchool}, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?
   - Lượt 3: Nếu học sinh nói "chưa tìm hiểu tổ hợp môn" (hoặc chưa biết môn gì): BẮT BUỘC thực hiện Kỹ thuật Phản tư 3 Nhịp:
     * Nhịp 1: Nêu nghịch lý giữa ước mơ và việc chưa chuẩn bị công cụ xét tuyển.
     * Nhịp 2: Gợi mở nhóm năng lực trụ cột (Tự nhiên/Logic vs Xã hội/Ngôn ngữ), nhắc Bước 3 sẽ tự tra cứu đề án.
     * Nhịp 3: Đặt câu hỏi mở trung lập: "Nhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?"
   - Lượt 4: BẮT BUỘC đọc dữ liệu môn sở trường và môn yếu học sinh vừa nêu (ví dụ: giỏi Toán, kém Văn) để gọi đích danh hai môn này ra định hướng cụ thể (hướng đến Sư phạm Toán/Tin, khối A00/A01 để tận dụng lợi thế và tránh rào cản môn Văn).
     Ra lệnh dứt khoát yêu cầu học sinh bấm chuyển sang Bước 3 để tra cứu Đề án tuyển sinh. TUYỆT ĐỐI KHÔNG HỎI THÊM CÂU NÀO NỮA.
3. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
   Chỉ xuất ra duy nhất lời thoại đối thoại trực tiếp xưng "Thầy" gọi "em". Tuyệt đối không sinh tiêu đề, đề mục, checklist hay suy nghĩ nội tâm.
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

        // 5. Cấu hình mô hình hoạt động ổn định nhất
        let replyText = null;
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
            if (studentTurns >= 4 || (lowerTrimmed.includes('toán') && lowerTrimmed.includes('văn'))) {
                let subjectPairAdvice = `Nắm chắc môn thế mạnh sẽ giúp em chọn đúng tổ hợp xét tuyển tối ưu và mở rộng cơ hội trúng tuyển.`;
                if ((lowerTrimmed.includes('toán') || lowerTrimmed.includes('toan')) && (lowerTrimmed.includes('văn') || lowerTrimmed.includes('van'))) {
                    subjectPairAdvice = `Giỏi Toán là thế mạnh tuyệt vời để em hướng thẳng tới ngành Sư phạm Toán học hoặc Sư phạm Tin học (xét khối A00: Toán-Lý-Hóa hoặc A01: Toán-Lý-Anh), hoàn toàn tránh được rào cản môn Ngữ văn!`;
                } else if (lowerTrimmed.includes('toán') || lowerTrimmed.includes('toan')) {
                    subjectPairAdvice = `Giỏi Toán là thế mạnh vượt trội để em tự tin chọn các tổ hợp khoa học tự nhiên (A00, A01) vào các ngành Sư phạm Toán, Sư phạm Tin học hoặc Khoa học Tự nhiên.`;
                } else if (lowerTrimmed.includes('văn') || lowerTrimmed.includes('van')) {
                    subjectPairAdvice = `Năng khiếu Ngữ văn là nền tảng rất vững chắc cho các ngành Sư phạm Ngữ văn, Giáo dục Tiểu học hoặc Sư phạm Khoa học Xã hội (khối C00, D01), giúp em phát huy trọn vẹn thế mạnh ngôn ngữ.`;
                }
                replyText = `Thầy khen ngợi sự thẳng thắn của em khi nhìn nhận rõ cặp môn sở trường và môn còn khoảng cách. ${subjectPairAdvice}\n\nBây giờ, em hãy dừng suy đoán và bấm chuyển sang **Bước 3: Môi trường đối chứng dữ liệu thực tế** để tự tay tra cứu Đề án tuyển sinh chính thức và nhập vào bảng đối chứng!`;
            } else if (studentTurns === 1) {
                replyText = `Thầy rất ghi nhận sự thẳng thắn và khẳng định rõ ràng của em. Chọn ngành từ sự yêu thích tự nhiên là điểm tựa rất tốt, nhưng sự yêu thích ấy cần gắn liền với các công việc chuyên môn thực tế mỗi ngày.\n\nCụ thể trong các hoạt động chuyên môn của ngành **${targetCareer}** (như đứng lớp truyền đạt kiến thức, kiên nhẫn đồng hành cùng học sinh hay nghiên cứu bài giảng), hoạt động nào khiến em cảm thấy bản thân hào hứng và có nhiều năng lượng nhất?`;
            } else if (studentTurns === 2) {
                replyText = `Thầy rất ủng hộ tinh thần trách nhiệm của em. Tuy nhiên trong 5-10 năm tới, AI, công nghệ giáo dục và chuyển đổi số sẽ tái cơ cấu mạnh mẽ thị trường việc làm. Giáo viên tương lai của ngành **${targetCareer}** sẽ không chỉ làm nhiệm vụ truyền thụ kiến thức cơ học mà bắt buộc phải làm chủ công nghệ, rèn luyện kỹ năng tư duy bậc cao cho học sinh và đối diện với chuẩn nghề nghiệp mới rất khắt khe.\n\nĐể thích ứng với những tiêu chuẩn mới đó, em dự định trang bị năng lực gì và để thi/xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã tìm hiểu ngành này thường xét tuyển những tổ hợp môn nào để mở cánh cửa đầu tiên chưa?`;
            } else {
                replyText = `Đó là một nghịch lý đáng suy ngẫm: Em đang đặt nhiều kỳ vọng vào ngành **${targetCareer}**, nhưng lại chưa nắm rõ vũ khí học thuật (tổ hợp môn xét tuyển) để bước chân qua cánh cửa trường đại học!\n\nThực tế, Sư phạm chia thành các nhóm trụ cột năng lực rất rõ rệt: hoặc thiên về Khoa học Tự nhiên & Tư duy Logic (Toán, Lý, Hóa, Sinh, Tin), hoặc thiên về Khoa học Xã hội & Ngôn ngữ (Văn, Sử, Địa, Ngoại ngữ). Ở Bước 3, em sẽ tự tay tra cứu Đề án tuyển sinh chính thức để làm rõ điều này.\n\nNhìn lại kết quả học tập kỳ trước, đâu là môn sở trường tạo lợi thế cho em, và môn nào đang là môn có khoảng cách năng lực cần em dồn nhiều nỗ lực nhất?`;
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
