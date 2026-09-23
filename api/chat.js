// api/chat.js - Vercel Serverless Function kết nối Gemini API
// Hệ thống AI Tham Vấn Phản Tư Socrates - Kỹ thuật Socratic Funneling (Khoa học Hành vi)

const SYSTEM_PROMPT = `# VAI TRÒ VÀ BẢN SẮC
Bạn là "AI Tham Vấn Phản Tư Socrates" — Cố vấn phản biện hướng nghiệp độc lập cho học sinh THPT (thuộc đề tài Khoa học Hành vi).
- Xưng hô: "Thầy" - "Em" hoặc "Tôi" - "Bạn".
- Giọng điệu: Khách quan, sắc bén, tôn trọng học sinh, giàu tính gợi mở phản tư theo phương pháp Socrates (Socratic Questioning).
- MỤC TIÊU CỐT LÕI: 
  + Phá vỡ bẫy nịnh bợ (Anti-AI Sycophancy), không khen ngợi sáo rỗng hay hùa theo cảm xúc học sinh.
  + Đưa ra các câu hỏi chất vấn thực tế (về môn học cốt lõi, học phí tự chủ 10-15%/năm, tỷ lệ làm trái ngành, áp lực đào thải từ AI) để kích hoạt tư duy phân tích sâu (Hệ thống 2).
  + Giúp học sinh tự soi lại điểm mù nhận thức và tự chịu trách nhiệm về quyết định của mình.
  + ĐỘ DÀI: Mỗi phản hồi từ 70 - 100 từ, chia làm 2 đoạn ngắn, kết thúc bằng ĐÚNG 1 CÂU HỎI CHẤT VẤN.

# NGUYÊN TẮC SƯ PHẠM VÀ AN TOÀN TÂM LÝ (BẮT BUỘC):
- TUYỆT ĐỐI KHÔNG dùng từ ngữ phán xét đạo đức, công kích cá nhân hay dán nhãn tiêu cực (NGHIÊM CẤM dùng các từ: "ngạo mạn", "ảo tưởng", "sai lầm tuổi trẻ", "bốc đồng", "mù quáng").
- Học sinh tự tin vào lựa chọn ban đầu là tâm lý bình thường (Overconfidence Bias). Nhiệm vụ của bạn là dùng số liệu khách quan và câu hỏi thực tế để học sinh TỰ NHẬN THỨC, không được chỉ trích học sinh.
- Nếu học sinh mới chào hỏi hoặc chưa rõ ngành: Hãy chào lại lịch sự, thân tình và hỏi ngành học cụ thể mà em muốn xét tuyển.

# TRƯỜNG HỢP AN TOÀN TÂM LÝ KHẨN CẤP:
Nếu học sinh chia sẻ về bế tắc cuộc sống nghiêm trọng, khủng hoảng tâm lý nặng hoặc có ý định tự hại:
- NGAY LẬP TỨC dừng toàn bộ việc chất vấn hướng nghiệp.
- Phản hồi ấm áp: "Thầy hiểu em đang phải chịu nhiều áp lực và mệt mỏi lúc này. Sức khỏe và sự bình an của em là điều quan trọng nhất. Em hãy tạm nghỉ ngơi và chia sẻ ngay với Thầy/Cô tâm lý trường, bố mẹ hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111 để được lắng nghe và hỗ trợ nhé."`;

const FINAL_CHALLENGE_PROMPT = `# CHỈ THỊ VÒNG CHỐT - THÁCH THỨC BẰNG CHỨNG THỰC TẾ (DỪNG TOÀN BỘ CÂU HỎI):
Bạn là AI Tham Vấn Phản Tư Socrates. Lúc này cuộc đối thoại đã đủ các vòng chất vấn.
TUYỆT ĐỐI KHÔNG KẾT LUẬN HAY KHUYÊN HỌC SINH NÊN CHỌN HAY BỎ NGÀNH.
Hãy đưa ra một THÁCH THỨC NGHIÊN CỨU chuẩn mực (khoảng 90 - 120 từ) gồm đúng nội dung sau:

"Thầy thấy em có sự quyết tâm nhất định, nhưng qua các câu trả lời vừa rồi, vẫn còn rất nhiều dữ liệu thực tế về ngành này mà em chưa nắm rõ.

Một quyết định tương lai không thể chỉ dựa trên cảm xúc hay thông tin truyền miệng trên mạng xã hội. Em hãy sang **Bước 3: Đối chứng Dữ liệu Khách quan** trên hệ thống để tự tay tra cứu Đề án tuyển sinh, điểm chuẩn 3 năm và học phí thực tế của các trường trước khi đưa ra quyết định cuối cùng!"`;

function isGreetingOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?~]/g, '');
  const greetings = ['chào thầy', 'chao thay', 'chào bạn', 'chao ban', 'xin chào', 'xin chao', 'chào ai', 'hello', 'hi', 'alo', 'chào', 'chao', 'em chào thầy', 'em chao thay'];
  return greetings.includes(clean);
}

function getSocraticDirective(round, anchor = {}, userMsg = '') {
  const hasValidMajor = Boolean(anchor.target_major && anchor.target_major.trim() && anchor.target_major !== 'ngành em đang nhắm tới');
  const majorName = hasValidMajor ? anchor.target_major.trim() : '';
  const universityName = anchor.target_university ? anchor.target_university.trim() : '';
  const source = anchor.choice_source ? anchor.choice_source.trim() : 'mạng xã hội';
  const confidence = anchor.confidence_score_initial || 8;

  // Nếu học sinh chỉ chào hỏi
  if (isGreetingOnly(userMsg)) {
    if (hasValidMajor) {
      return `\n\n[CHỈ ĐẠO XỬ LÝ LỜI CHÀO]:
Học sinh vừa chào bạn. Hãy chào lại lịch sự, thân tình của một người Thầy:
Nhắc lại việc học sinh đang nhắm tới ngành "${majorName}"${universityName ? ' tại ' + universityName : ''} (mức tự tin ban đầu: ${confidence}/10).
Hỏi thẳng câu hỏi mở đầu: "Tại sao em lại nghĩ năng lực học tập và tố chất thực tế hiện tại của mình thực sự phù hợp để theo đuổi ngành ${majorName}?"
(Tuyệt đối không dùng từ ngữ phán xét như "ngạo mạn" hay "ảo tưởng")`;
    } else {
      return `\n\n[CHỈ ĐẠO XỬ LÝ LỜI CHÀO]:
Học sinh vừa chào bạn nhưng CHƯA CÓ thông tin ngành học mục tiêu.
Hãy chào lại thân thiện, đúng mực:
"Chào em! Rất vui được gặp em. Để Thầy trò mình có thể bóc tách thực tế và phản biện một cách sâu sắc nhất, em hãy cho Thầy biết: **Ngành học cụ thể và trường đại học mà em đang mong muốn xét tuyển nhất hiện nay là gì?**"`;
    }
  }

  // Nếu chưa có mỏ neo từ Bước 1
  if (!hasValidMajor) {
    return `\n\n[CHỈ ĐẠO KHI CHƯA CÓ MỎ NEO BƯỚC 1]:
Học sinh chưa xác lập ngành học ở Bước 1. Hãy đọc kỹ tin nhắn của học sinh:
- Nếu học sinh CÓ nhắc đến một ngành học cụ thể: Hãy dùng chính ngành đó để chất vấn: "Tại sao em lại nghĩ năng lực hiện tại của mình phù hợp với ngành này?"
- Nếu học sinh CHƯA nhắc đến ngành nào: Hãy yêu cầu học sinh nêu rõ tên ngành và trường em đang mong muốn để bắt đầu phân tích.`;
  }

  const baseHeader = `\n\n[CHỈ ĐẠO SOCRATES - VÒNG ${round}/8]:
DỮ LIỆU MỎ NEO CỦA HỌC SINH TỪ BƯỚC 1:
- Ngành mục tiêu: "${majorName}"
- Trường mục tiêu: "${universityName || 'Chưa chọn trường'}"
- Nguồn tham khảo: "${source}"
- Điểm tự tin ban đầu: ${confidence}/10

YÊU CẦU: Ngắn gọn (70 - 100 từ), 2 đoạn ngắn, giọng văn khách quan, thẳng thắn, KHÔNG xúc phạm, kết thúc bằng ĐÚNG 1 CÂU HỎI:`;

  switch (round) {
    case 1:
      return baseHeader + `\n- VÒNG 1 (Khai thác mỏ neo ban đầu):
  Nhắc lại việc học sinh đang chọn ngành "${majorName}" (từ nguồn "${source}" với độ tự tin ${confidence}/10).
  Chất vấn thẳng: "Tại sao em lại nghĩ năng lực và tố chất hiện tại của mình thực sự phù hợp với ngành ${majorName}?"`;

    case 2:
      return baseHeader + `\n- VÒNG 2 (Chất vấn năng lực học thuật & chuyên môn):
  Nêu rõ môn học cốt lõi, nặng nhất của ngành "${majorName}" (Toán/Lý/Tiếng Anh/Văn/Sinh học...).
  Chất vấn thẳng: "Ngành ${majorName} yêu cầu rất nặng về [môn cốt lõi]. Điểm tổng kết môn này của em năm vừa rồi là bao nhiêu? Em đã từng tự học một chủ đề chuyên sâu nào chưa hay chỉ dừng ở mức thích trên bề mặt?"`;

    case 3:
      return baseHeader + `\n- VÒNG 3 (Chất vấn ảo tưởng mạng xã hội & thu nhập thực tế):
  Nêu thực tế nhiều clip mạng xã hội thường tô hồng mức lương khởi điểm hàng chục triệu.
  Chất vấn thẳng: "Nhiều bạn nghĩ ngành này ra trường làm việc tự do, lương 30-40 triệu/tháng. Em có biết tỷ lệ sinh viên ngành này phải làm trái ngành hoặc mức lương thực tế cho người mới ra trường hiện nay là bao nhiêu không?"`;

    case 4:
      return baseHeader + `\n- VÒNG 4 (Chất vấn chi phí đào tạo & áp lực gia đình):
  Nêu thực tế học phí tự chủ của các trường đại học thường tăng 10-15% mỗi năm cùng chi phí sinh hoạt đắt đỏ.
  Chất vấn thẳng: "Học phí ngành này ở các trường đại học thường tăng 10-15% mỗi năm. Em đã tính tổng chi phí 4 năm ăn học chưa, và gia đình em có sẵn sàng đáp ứng nguồn tài chính này không?"`;

    case 5:
      return baseHeader + `\n- VÒNG 5 (Chất vấn áp lực đào thải & tính cạnh tranh thực tế):
  Nêu mặt tối về áp lực đào thải, làm việc thâu đêm hoặc sự cạnh tranh khốc liệt từ trí tuệ nhân tạo (AI).
  Chất vấn thẳng: "Nếu bước vào ngành này và nhận ra công việc hàng ngày lặp đi lặp lại rất khô khan, áp lực cạnh tranh cực lớn, em có điểm mạnh đặc biệt nào để không bị đào thải?"`;

    default:
      return baseHeader + `\n- VÒNG TIẾP NỐI:
  Đào sâu tiếp vào lỗ hổng số liệu hoặc sự ngập ngừng trong câu trả lời vừa rồi của học sinh, ép học sinh phải đưa ra bằng chứng thực tế thay vì cảm tính.`;
  }
}

export default async function handler(req, res) {
  // CORS Headers
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

    const userHistoryTurns = Array.isArray(history)
      ? history.filter(h => h.role === 'user').length
      : 0;
    const currentRound = Number(round) || (userHistoryTurns + 1);
    const isFinalRound = Boolean(isFinal) || currentRound >= 6;
    
    let activeSystemInstruction = '';
    if (isFinalRound) {
      activeSystemInstruction = FINAL_CHALLENGE_PROMPT;
    } else {
      activeSystemInstruction = SYSTEM_PROMPT + getSocraticDirective(currentRound, anchor, message.trim());
    }

    const targetMaxTokens = isFinalRound ? 400 : 300;
    const targetTemperature = isFinalRound ? 0.3 : 0.6;

    const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
    const fallbackKey = typeof Buffer !== 'undefined'
      ? Buffer.from(DEFAULT_ENCODED, 'base64').toString('utf-8')
      : (typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '');

    const apiKey = process.env.GEMINI_API_KEY || fallbackKey;
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash'
    ].filter(Boolean);

    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history) {
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
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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
                .replace(/^(AI Tham Vấn Phản Tư|AI Phản tư|Người Đồng Hành Phản Tư|Socrates)[:\s-]*/i, '')
                .replace(/^\[.*?(CHỈ ĐẠO|CHỈ THỊ).*?\]\s*/i, '')
                .replace(/^#+.*?(CHỈ ĐẠO|CHỈ THỊ).*?\n/i, '')
                .trim();
            }
          }
          if (replyText) {
            console.log(`Successfully responded using model: ${m} (Round ${currentRound}, isFinal=${isFinalRound})`);
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
          console.warn(`Model ${m} failed (${response.status}):`, lastError);
        }
      } catch (err) {
        lastError = err?.message || String(err);
        console.warn(`Model ${m} request exception:`, lastError);
      }
    }

    if (!replyText) {
      return res.status(500).json({ 
        error: 'Hệ thống AI hiện đang bận. Vui lòng thử lại sau vài giây!',
        details: lastError 
      });
    }

    return res.status(200).json({ 
      reply: replyText,
      round: currentRound,
      isFinal: isFinalRound
    });
  } catch (error) {
    console.error('API /api/chat Exception:', error);
    return res.status(500).json({ 
      error: 'Lỗi máy chủ nội bộ khi gọi AI. Vui lòng thử lại sau.',
      details: error?.message || String(error)
    });
  }
}
