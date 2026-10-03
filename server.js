// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - VISEF 2026 (CBAS)
// MÔ HÌNH NHẬN THỨC LINH HOẠT & TIẾN TRÌNH 4 VÒNG SƯ PHẠM BẤT BIẾN
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
    'định hình', 'tổ hợp', 'môn', 'tiền', 'lương', 'dạy thêm', 'sợ', 'dốt', 'kém', 'đều'
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

function isTechnicalConfusion(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim()
    .replace(/[!.,?~^_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (clean.length === 0 || clean.length > 50) return false;

  const confusionPatterns = [
    /^(là sao|la sao|sao vậy|sao the|sao thế|ý thầy là sao|y thay la sao|sao ạ|sao a)(\s+thầy|\s+thay|\s+cô|\s+co)?$/i,
    /^(em chưa hiểu|em chua hieu|chưa hiểu|chua hieu|không hiểu|khong hieu)(\s+thầy|\s+thay|\s+cô|\s+co|\s+ạ|\s+a)?$/i,
    /^(thầy nói gì|thay noi gi|thầy nói thế là sao|thay noi the la sao)(\s+ạ|\s+a)?$/i,
    /^(thầy hỏi lại là sao|sao thầy lại hỏi lại|sao hỏi lại|hỏi lại là sao)(\s+ạ|\s+a)?$/i
  ];
  return confusionPatterns.some(p => p.test(clean));
}

function isCompleteSentence(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 35) return false;
  const terminalPunctuation = /[.!?…"'\)\]*]$/;
  return terminalPunctuation.test(trimmed);
}

function isCounterArguing(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();
  const counterPatterns = [
    /(đâu|không|chẳng|chưa|làm gì)\s+(có\s+)?nghịch\s*(lý|lí)/i,
    /nghịch\s*(lý|lí)\s+(gì|ở đâu|chỗ nào|đâu)/i,
    /sao\s+(lại\s+)?(bảo|nói|cho là|bảo là)\s+(là\s+)?nghịch\s*(lý|lí)/i,
    /(đâu có|làm gì có|không hề|đâu phải)\s+(nghịch|mâu thuẫn)/i,
    /thầy\s+(nói|bảo|phán)\s+(thế|vậy|vậy là)\s+(không đúng|sai|chưa đúng|kỳ|lạ)/i,
    /(em|mình)\s+đã\s+(nói|bảo|giải thích)\s+(rồi|là)/i,
    /(chưa|không)\s+(biết|rõ|chắc|định hình|chọn)\s+.*?(dạy|môn|tổ hợp)/i,
    /(làm sao|sao|thế nào)\s+.*?(tra cứu|biết|chọn|tìm)/i,
    /chưa\s+(chọn|biết|định hình|rõ)\s+(được\s+)?(môn|sẽ dạy|tổ hợp)/i
  ];
  return counterPatterns.some(p => p.test(clean)) || 
    (clean.includes('nghịch') && (clean.includes('đâu') || clean.includes('không') || clean.includes('gì') || clean.includes('sao') || clean.includes('chưa')));
}

function hasDeclaredSubjectsOrGrades(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim();

  // 1. Toán
  if (/(môn\s+)?toán/i.test(clean)) return true;

  // 2. Văn / Ngữ văn
  const cleanWithoutPhanVan = clean.replace(/phân vân|phan van|băn khoăn|ban khoan/g, ' ');
  if (/(ngữ\s*văn|ngu\s*van|môn\s*văn|mon\s*van|học\s*văn|hoc\s*van|văn\s*(và|với|\+|lẫn)|yếu\s*văn|kém\s*văn|giỏi\s*văn|sợ\s*văn)/i.test(cleanWithoutPhanVan)) return true;
  if (/\bvăn\b/i.test(cleanWithoutPhanVan) && (cleanWithoutPhanVan.includes('toán') || cleanWithoutPhanVan.includes('anh') || cleanWithoutPhanVan.includes('điểm') || cleanWithoutPhanVan.includes('môn') || cleanWithoutPhanVan.includes('học'))) return true;

  // 3. Tiếng Anh / Ngoại ngữ
  if (/(tiếng\s*anh|tieng\s*anh|ngoại\s*ngữ|ngoai\s*ngu|anh\s*văn|anh\s*van|\bmôn\s*anh\b|\bhọc\s*anh\b)/i.test(clean)) return true;

  // 4. Vật lý / Lý
  const cleanWithoutLyDo = clean.replace(/lý do|ly do|vô lý|vo ly|nghịch lý|nghich ly|nghịch lí|nghich li|hợp lý|hop ly|quản lý|quan ly|tâm lý|tam ly|xử lý|xu ly/g, ' ');
  if (/(vật\s*lý|vat\s*ly|vật\s*lí|vat\s*li|môn\s*lý|môn\s*lí|\blý\b|\blí\b)/i.test(cleanWithoutLyDo)) return true;

  // 5. Hóa học / Hóa
  const cleanWithoutHoaRa = clean.replace(/hóa ra|hoa ra|chuyển hóa|chuyen hoa|thoái hóa|thoai hoa/g, ' ');
  if (/(hóa\s*học|hoa\s*hoc|môn\s*hóa|mon\s*hoa)/i.test(cleanWithoutHoaRa)) return true;
  if (/\bhóa\b/i.test(cleanWithoutHoaRa) && (cleanWithoutHoaRa.includes('toán') || cleanWithoutHoaRa.includes('lý') || cleanWithoutHoaRa.includes('sinh') || cleanWithoutHoaRa.includes('điểm') || cleanWithoutHoaRa.includes('môn') || cleanWithoutHoaRa.includes('học'))) return true;

  // 6. Sinh học / Sinh
  const cleanWithoutHocSinh = clean.replace(/học sinh|hoc sinh|sinh viên|sinh vien|phát sinh|phat sinh|nảy sinh|nay sinh|hy sinh|hi sinh/g, ' ');
  if (/(sinh\s*học|sinh\s*hoc|môn\s*sinh|mon\s*sinh)/i.test(cleanWithoutHocSinh)) return true;

  // 7. Lịch sử / Sử
  const cleanWithoutSuDung = clean.replace(/sử dụng|su dung|đối xử|doi xu|xử sự|xu su/g, ' ');
  if (/(lịch\s*sử|lich\s*su|môn\s*sử|mon\s*su|\bsử\b|\bsu\b)/i.test(cleanWithoutSuDung)) return true;

  // 8. Địa lý / Địa
  const cleanWithoutDiaDiem = clean.replace(/địa điểm|dia diem|địa phương|dia phuong|địa bàn|dia ban|địa chỉ|dia chi/g, ' ');
  if (/(địa\s*lý|dia\s*ly|địa\s*lí|dia\s*li|môn\s*địa|mon\s*dia|\bđịa\b|\bdia\b)/i.test(cleanWithoutDiaDiem)) return true;

  // 9. Tin học / GDCD / GDQP / KTPL / Công nghệ / KHTN / KHXH
  if (/(tin\s*học|tin\s*hoc|gdcd|gdqp|ktpl|quốc\s*phòng|kinh\s*tế\s*pháp\s*luật|công\s*nghệ|khtn|khxh|giáo\s*dục\s*công\s*dân)/i.test(clean)) return true;

  // 10. Tổ hợp / Khối xét tuyển
  if (/(tổ\s*hợp\s*([a-d]\d{2}|[a-d]|khtn|khxh|môn)|khối\s*([a-d]\d{2}|[a-d]|tự\s*nhiên|xã\s*hội)|\b[a-d]\d{2}\b)/i.test(clean)) return true;

  // 11. Từ khóa kết hợp năng lực môn học
  if (/(học\s*tốt|hoc\s*tot|đuối|duoi|học\s*khá|hoc\s*kha|môn\s*mạnh|môn\s*yếu|sở\s*trường|thế\s*mạnh|môn\s*sở\s*trường|môn\s*thế\s*mạnh)/i.test(clean)) return true;

  // 12. Tuyên bố học lực rõ ràng
  const hasExplicitGradeDeclaration = [
    'học đều', 'hoc deu', 'đều đều', 'deu deu', 'học tàn tàn', 'tàn tàn', 'tan tan',
    'các môn như nhau', 'môn nào cũng như nhau', 'môn nào cũng vậy', 'môn nào cũng thế',
    'mất gốc', 'mat goc', 'đuối tất cả', 'kém tất cả', 'yếu tất cả'
  ].some(k => clean.includes(k));

  return hasExplicitGradeDeclaration;
}

function extractSubjectsFeedback(text) {
  const clean = text.toLowerCase();
  
  const subjects = [
    { name: 'Giáo dục Kinh tế và Pháp luật (KTPL)', patterns: ['ktpl', 'kinh tế pháp luật', 'kinh tế và pháp luật'] },
    { name: 'Giáo dục Công dân (GDCD)', patterns: ['gdcd', 'công dân'] },
    { name: 'Toán học', patterns: ['toán', 'toan'] },
    { name: 'Ngữ văn', patterns: ['ngữ văn', 'ngu van', 'văn', 'van'] },
    { name: 'Tiếng Anh', patterns: ['tiếng anh', 'tieng anh', 'ngoại ngữ', 'anh'] },
    { name: 'Lịch sử', patterns: ['lịch sử', 'lich su', 'sử', 'su'] },
    { name: 'Địa lý', patterns: ['địa lý', 'địa lí', 'dia ly', 'địa', 'dia'] },
    { name: 'Vật lý', patterns: ['vật lý', 'vật lí', 'vat ly', 'lý', 'lí'] },
    { name: 'Hóa học', patterns: ['hóa học', 'hoa hoc', 'hóa', 'hoa'] },
    { name: 'Sinh học', patterns: ['sinh học', 'sinh hoc', 'sinh'] },
    { name: 'Tin học', patterns: ['tin học', 'tin hoc', 'tin'] }
  ];

  let strongSubject = '';
  let weakSubject = '';

  for (const sub of subjects) {
    for (const p of sub.patterns) {
      const strongReg = new RegExp('(học tốt|giỏi|khá|thế mạnh|sở trường|mạnh|thích|ổn)\\s*(môn\\s*)?' + p + '|' + p + '\\s*(thì\\s*)?(em\\s*)?(học\\s*)?(giỏi|tốt|khá|cao|ổn|được 8|được 9|8|9)', 'i');
      const weakReg = new RegExp('(hơi đuối|đuối|yếu|kém|dốt|sợ|thấp|lo)\\s*(môn\\s*)?' + p + '|' + p + '\\s*(thì\\s*)?(em\\s*)?(học\\s*|hơi\\s*)?(hơi đuối|đuối|yếu|kém|dốt|sợ|thấp|được 5|được 6|5|6)', 'i');

      if (!strongSubject && strongReg.test(clean)) {
        strongSubject = sub.name;
      }
      if (!weakSubject && weakReg.test(clean)) {
        weakSubject = sub.name;
      }
    }
  }

  return { strongSubject, weakSubject };
}

app.post('/api/socrates-chat', async (req, res) => {
  try {
    const { chatHistory, userMessage } = req.body || {};

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    // 1. Kiểm tra an toàn: Lịch sử trò chuyện phải là một mảng
    const validHistory = Array.isArray(chatHistory) ? chatHistory : (Array.isArray(req.body?.history) ? req.body.history : []);

    const trimmedMsg = userMessage.trim();
    const lowerTrimmed = trimmedMsg.toLowerCase();

    // 2. PHẢN XẠ NHANH: Nếu học sinh chỉ chào hỏi xã giao (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isGreetingOnly(trimmedMsg)) {
      const greetingReply = `Chào em, thầy trò mình cùng bắt đầu nhé! Em hãy trả lời câu hỏi của thầy ở trên để tiếp tục đối thoại.`;
      return res.status(200).json({
        success: true,
        round: req.body?.round && Number(req.body.round) > 0 ? Number(req.body.round) : 1,
        stage: req.body?.stage && Number(req.body.stage) > 0 ? Number(req.body.stage) : (req.body?.round ? Number(req.body.round) : 1),
        chatStage: req.body?.chatStage && Number(req.body.chatStage) > 0 ? Number(req.body.chatStage) : 1,
        response: greetingReply,
        reply: greetingReply,
        isComplete: false,
        isCompleted: false,
        progress: "1/4"
      });
    }

    // 2b. PHẢN XẠ NHANH: Nếu học sinh thắc mắc kỹ thuật / chưa hiểu câu hỏi (KHÔNG TÍNH VÀO TIẾN TRÌNH VÒNG)
    if (isTechnicalConfusion(trimmedMsg)) {
      const clarifyReply = `Thầy hỏi để giúp em tự soi chiếu động lực và năng lực thực tế của mình trước khi ra quyết định quan trọng. Em hãy chia sẻ rõ hơn suy nghĩ của mình về câu hỏi của thầy ở trên nhé!`;
      return res.status(200).json({
        success: true,
        round: req.body?.round && Number(req.body.round) > 0 ? Number(req.body.round) : 1,
        stage: req.body?.stage && Number(req.body.stage) > 0 ? Number(req.body.stage) : (req.body?.round ? Number(req.body.round) : 1),
        chatStage: req.body?.chatStage && Number(req.body.chatStage) > 0 ? Number(req.body.chatStage) : 1,
        response: clarifyReply,
        reply: clarifyReply,
        isComplete: false,
        isCompleted: false,
        progress: "1/4"
      });
    }

    // 3. Quản lý Tiến trình Hội thoại theo Trạng thái Cứng (STRICT STATE MACHINE - VISEF 2026)
    // Khởi tạo biến: currentStage = 1 (Chỉ số từ 1 đến 4).
    // Mỗi khi học sinh bấm gửi một tin nhắn, currentStage mới được tăng lên 1 đơn vị.
    const substantiveUserMsgs = validHistory.filter(m => m.role === 'user' && !isGreetingOnly(m.text) && !isTechnicalConfusion(m.text));

    let currentStage = 1;
    if (req.body?.currentStage && Number(req.body.currentStage) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.currentStage), 1), 4);
    } else if (req.body?.stage && Number(req.body.stage) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.stage), 1), 4);
    } else if (req.body?.chatStage && Number(req.body.chatStage) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.chatStage), 1), 4);
    } else if (req.body?.round && Number(req.body.round) >= 1) {
      currentStage = Math.min(Math.max(Number(req.body.round), 1), 4);
    } else {
      currentStage = Math.min(Math.max(substantiveUserMsgs.length + 1, 1), 4);
    }

    const studentProfile = req.body?.studentProfile || req.body?.userProfile || req.body?.anchor || {};
    const targetCareer = studentProfile?.targetMajor || studentProfile?.targetCareer || studentProfile?.target_career || "Sư phạm";
    const targetSchool = studentProfile?.targetSchool || studentProfile?.targetUniversity || studentProfile?.target_university || "ĐH Quy Nhơn";
    const hollandCode = studentProfile?.hollandCode || studentProfile?.holland_code || "AEI";
    const reason = studentProfile?.reason || studentProfile?.careerReason || "Em thích từ nhỏ và cảm thấy phù hợp";
    const initialConfidence = studentProfile?.initialConfidence || studentProfile?.confidenceT0 || studentProfile?.confidence_score || studentProfile?.confidence || 5;
    const expectedIncome = studentProfile?.expectedIncome || studentProfile?.targetIncome || "10 - 15 triệu/tháng";

    // 4. Trích xuất các câu phát ngôn gần nhất của Thầy để chống lặp
    const pastModelUtterances = validHistory
      .filter(m => m.role === 'model' && m.text)
      .slice(-3)
      .map((m, i) => `Lượt trước ${i + 1}: "${m.text.slice(0, 120)}..."`)
      .join('\n');

    // 5. TÁCH BIỆT SYSTEM PROMPT CHO TỪNG GIAI ĐOẠN ĐỘC LẬP (KHÔNG DÙNG 1 PROMPT CHUNG)
    const systemPrompt = getStageSystemPrompt(currentStage, {
      targetCareer,
      targetSchool,
      hollandCode,
      reason,
      initialConfidence,
      expectedIncome
    }, trimmedMsg, pastModelUtterances);

    // 6. Chuẩn bị nội dung gửi lên Gemini API
    let contents = validHistory
      .filter(msg => msg && msg.text && typeof msg.text === 'string')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: trimmedMsg }]
    });

    let replyText = null;

    // 7. Cấu hình mô hình hoạt động ổn định
    const candidateModelNames = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];

    for (const modelName of candidateModelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.35,
            topP: 0.85,
            maxOutputTokens: 1000
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model generation timeout')), 6000)
        );

        const result = await Promise.race([
          model.generateContent({ contents }),
          timeoutPromise
        ]);

        let resText = result?.response?.text();
        if (resText) {
          let cleaned = resText.trim()
            .replace(/^(Chuyên gia Phản tư Hành vi Socrates|Trợ lý AI Tham Vấn Phản Tư Socrates|AI Tham Vấn Phản Tư Socrates|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
            .replace(/^<thought>[\s\S]*?<\/thought>\s*/gi, '')
            .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ|BỐI CẢNH|NHIỆM VỤ|SUY NGHĨ|THOUGHT).*?\]\s*/gi, '')
            .replace(/^\*\(?[\s\S]*?\)?\*\s*/g, '')
            .replace(/^\[[\s\S]*?\]\s*/g, '')
            .replace(/^\([\s\S]*?\)\s*/g, '')
            .replace(/^#+.*?\n/gi, '')
            .trim();

          if (isCompleteSentence(cleaned)) {
            if (currentStage === 4) {
              // GIAI ĐOẠN 4: LỌC SẠCH DẤU HỎI ? VÀ ĐẢM BẢO KẾT LỆNH BƯỚC 3
              cleaned = cleaned.replace(/(?:[\n\r]+|[.!?]\s+)[^.!?\n\r]+\?\s*$/g, '.');
              cleaned = cleaned.replace(/^[^\n\r?]+\?\s*$/g, '');
              cleaned = cleaned.trim();

              const step3Directive = "Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!";
              if (!cleaned.includes("Bước 3") && !cleaned.includes("bước 3")) {
                cleaned = cleaned + "\n\n" + step3Directive;
              }
            } else {
              // GIAI ĐOẠN 1, 2, 3: NGHIÊM CẤM NHẮC ĐẾN BƯỚC 3
              cleaned = cleaned.replace(/[^\n\r.!?]*bước 3[^\n\r.!?]*[.!?]?/gi, '').trim();
            }
            replyText = cleaned;
            break;
          }
        }
      } catch (err) {
        // Thử model tiếp theo trong danh sách candidate
      }
    }

    // 8. Heuristic Fallback Nhận thức (Dự phòng khẩn cấp nếu API gặp sự cố)
    if (!replyText || !isCompleteSentence(replyText)) {
      replyText = generateCognitiveFallback({
        stage: currentStage,
        targetCareer,
        targetSchool,
        hollandCode,
        reason,
        initialConfidence,
        expectedIncome,
        trimmedMsg
      });
    }

    const isComplete = currentStage === 4;
    const progressStr = `${currentStage}/4`;

    return res.status(200).json({
      success: true,
      stage: currentStage,
      currentStage: currentStage,
      chatStage: currentStage,
      round: currentStage,
      response: replyText,
      reply: replyText,
      isComplete: isComplete,
      isCompleted: isComplete,
      progress: progressStr
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

// ==============================================================================
// TÁCH BIỆT SYSTEM PROMPT CHO TỪNG GIAI ĐOẠN ĐỘC LẬP
// ==============================================================================
function getStageSystemPrompt(stage, profile, userText, pastModelUtterances = '') {
  const { targetCareer, targetSchool, hollandCode, reason, initialConfidence, expectedIncome } = profile;
  const avoidRepetition = pastModelUtterances
    ? `\n[CÂU THOẠI TRƯỚC ĐÓ CỦA THẦY - TUYỆT ĐỐI KHÔNG ĐƯỢC LẶP LẠI]:\n${pastModelUtterances}\n`
    : '';

  // ● KHI currentStage === 1 (Lượt khởi đầu):
  if (stage === 1) {
    return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang bắt đầu phiên đối thoại phản tư với một học sinh THPT.

[HỒ SƠ HỌC SINH]:
- Nhóm thiên hướng Holland (RIASEC): ${hollandCode}
- Ngành mong muốn: ${targetCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Mức tự tin ban đầu: ${initialConfidence}/10
- Lý do chọn ngành ban đầu: "${reason}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 1]:
1. Chào học sinh theo mã Holland [${hollandCode}], ngành [${targetCareer}], lý do [${reason}].
2. HỎI ĐÚNG 01 CÂU DUY NHẤT:
"Em thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG nói về thu nhập hay tiền bạc.
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay học bạ.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
  }

  // ● KHI currentStage === 2 (Lượt thách thức việc làm & thu nhập):
  if (stage === 2) {
    return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang ở Lượt 2 của phiên đối thoại phản tư. Học sinh vừa trả lời câu hỏi ở Stage 1.

[HỒ SƠ HỌC SINH]:
- Ngành mong muốn: ${targetCareer}
- Kỳ vọng thu nhập khởi điểm đã chọn ở Bước 1: "${expectedIncome}"
- Câu trả lời của học sinh ở Stage 1: "${userText}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 2]:
1. Ghi nhận câu trả lời của học sinh trong 1-2 câu ngắn gọn, ấm áp.
2. Xoáy vào dữ liệu thu nhập [${expectedIncome}] với ĐÚNG CÂU HỎI SAU:
"Em kỳ vọng mức thu nhập sau khi ra trường là ${expectedIncome}. Trong bối cảnh 5-10 năm tới khi AI và chuyển đổi số làm thay đổi thị trường giáo dục, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG nói về điểm chuẩn, tổ hợp môn hay học bạ.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Khung chat bắt buộc phải giữ mở để học sinh trả lời tiếp ở Stage 3.
- Kết thúc bằng đúng câu hỏi về thu nhập & AI ở trên.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
  }

  // ● KHI currentStage === 3 (Lượt đối chất tổ hợp môn & học lực thực tế):
  if (stage === 3) {
    return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang ở Lượt 3 của phiên đối thoại phản tư. Học sinh vừa trả lời câu hỏi ở Stage 2.

[HỒ SƠ HỌC SINH]:
- Ngành mong muốn: ${targetCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Câu trả lời của học sinh ở Stage 2 (về thu nhập/AI/cạnh tranh): "${userText}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 3]:
1. Ghi nhận ngắn gọn góc nhìn của học sinh về việc làm/thu nhập.
2. Dẫn dắt vào bài toán điểm số với ĐÚNG CÂU HỎI SAU:
"Dù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành ${targetCareer} tại ${targetSchool}, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?"

[NGHIÊM CẤM TUYỆT ĐỐI]:
- TUYỆT ĐỐI KHÔNG đưa ra kết luận hay giải pháp hạ bậc ở lượt này.
- TUYỆT ĐỐI KHÔNG nhắc đến Bước 3 hay kết thúc phiên chat.
- Khung chat bắt buộc phải giữ mở để học sinh trả lời về môn học ở Stage 4.
- Kết thúc bằng đúng câu hỏi về tổ hợp & môn sở trường/đuối sức ở trên.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
  }

  // ● KHI currentStage === 4 (Lượt kết thúc & Tái cấu trúc 3 tầng nấc):
  return `BẠN LÀ THẦY SOCRATES - NHÀ THAM VẤN TÂM LÝ GIÁO DỤC VÀ CAN THIỆP HÀNH VI TRONG ĐỀ TÀI NGHIÊN CỨU KHOA HỌC VISEF 2026.
Bạn đang ở Lượt 4 (Lượt kết thúc phản tư) của phiên đối thoại. Học sinh vừa trả lời về môn học ở Stage 3.

[HỒ SƠ HỌC SINH]:
- Ngành mong muốn: ${targetCareer}
- Trường đại học mục tiêu: ${targetSchool}
- Câu trả lời của học sinh ở Stage 3 (về tổ hợp môn/môn sở trường/môn đuối sức): "${userText}"

[NHIỆM VỤ DUY NHẤT Ở LƯỢT 4]:
1. AI phân tích môn thế mạnh và môn yếu học sinh vừa nêu trong tin nhắn "${userText}". Ghi nhận môn thế mạnh và chỉ ra rủi ro điểm chuẩn nếu môn yếu kéo tụt tổng điểm tổ hợp xét tuyển vào ${targetCareer} tại ${targetSchool}.
2. Trình bày Chiến lược Thích ứng Đa tầng (3 tầng nấc):
   + Tầng 1: Kế hoạch bứt phá môn thế mạnh để kéo điểm thi vào ${targetSchool}.
   + Tầng 2: Chuẩn bị nguyện vọng dự phòng tại các trường Đại học vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên).
   + Tầng 3: Lưới an toàn với các hệ đào tạo thực hành vững chắc để luôn chủ động.
3. KẾT LỆNH BẮT BUỘC:
"Bây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!"

[CẢNH BÁO TỐI CAO - ĐẶC BIỆT]:
- TUYỆT ĐỐI KHÔNG ĐƯỢC đặt thêm bất kỳ câu hỏi nào. KHÔNG CÓ DẤU HỎI (?) Ở CUỐI PHẢN HỒI.
- Chỉ xuất ra trực tiếp lời thoại của Thầy Socrates xưng "Thầy" gọi "em", không kèm tiêu đề hay phân tích kỹ thuật.${avoidRepetition}`;
}

// ==============================================================================
// HÀM FALLBACK NHẬN THỨC THEO TỪNG GIAI ĐOẠN ĐỘC LẬP
// ==============================================================================
function generateCognitiveFallback({ stage, targetCareer, targetSchool, hollandCode, reason, initialConfidence, expectedIncome, trimmedMsg }) {
  if (stage === 1) {
    return `Chào em. Thầy ghi nhận em có thiên hướng Holland **${hollandCode}**, dự định chọn **${targetCareer}** tại **${targetSchool}** với mức tự tin **${initialConfidence}/10** và lý do: '${reason}'.\n\nEm thấy công việc chuyên môn thực tế hàng ngày của ngành này có thực sự khớp với tính cách tự nhiên của em không, hay em chọn vì thấy ngành này đang hot và được nhiều người khen ngợi?`;
  }

  if (stage === 2) {
    return `Thầy rất ghi nhận và thấu cảm với chia sẻ chân thành của em về động cơ chọn ngành.\n\nEm kỳ vọng mức thu nhập sau khi ra trường là **${expectedIncome}**. Trong bối cảnh 5-10 năm tới khi AI và chuyển đổi số làm thay đổi thị trường giáo dục, theo em một sinh viên mới tốt nghiệp ngành này có dễ dàng tìm việc để đạt ngay mức thu nhập đó không? Em nghĩ mình cần năng lực gì vượt trội để cạnh tranh?`;
  }

  if (stage === 3) {
    return `Thầy rất ủng hộ tinh thần tích cực và nhận thức thực tế của em về thị trường lao động.\n\nDù kỳ vọng thế nào, chiếc chìa khóa đầu tiên là phải vượt qua ngưỡng cửa tuyển sinh. Để xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**, em đã nắm rõ tổ hợp môn xét tuyển gồm những môn nào chưa? Nhìn lại học bạ kỳ vừa rồi, đâu là môn sở trường tạo lợi thế điểm số cho em và môn nào em thấy lo lắng, đuối sức nhất?`;
  }

  // Stage 4
  const { strongSubject, weakSubject } = extractSubjectsFeedback(trimmedMsg);
  const strongName = strongSubject || 'môn sở trường của em';
  const weakName = weakSubject || 'môn học em đang thấy lo lắng';

  return `Thầy phân tích thấy việc có thế mạnh ở môn ${strongName} là điểm tựa rất tốt. Tuy nhiên, nếu môn ${weakName} còn đuối sức, rủi ro điểm chuẩn sẽ kéo tụt tổng điểm cả tổ hợp khi xét tuyển vào ngành **${targetCareer}** tại **${targetSchool}**.\n\nĐể luôn làm chủ lộ trình tương lai, Thầy định hướng cho em Chiến lược Thích ứng Đa tầng với 3 tầng nấc:\n\n• **Tầng 1 (Nguyện vọng 1)**: Kế hoạch bứt phá môn thế mạnh để kéo điểm thi vào ${targetSchool}.\n• **Tầng 2 (Nguyện vọng 2)**: Chuẩn bị nguyện vọng dự phòng tại các trường Đại học vừa sức hơn (như ĐH Phú Yên, ĐH Khánh Hòa, ĐH Tây Nguyên).\n• **Tầng 3 (Lưới an toàn)**: Lưới an toàn với các hệ đào tạo thực hành vững chắc để luôn chủ động.\n\nBây giờ, em hãy bấm chuyển sang Bước 3 để tự tay đối chứng số liệu điểm chuẩn và thị trường việc làm nhé!`;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[VISEF 2026] Server AI Socrates đang vận hành tại cổng ${PORT}`);
});
