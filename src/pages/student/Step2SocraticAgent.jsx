import React, { useState, useEffect, useRef } from 'react';

export default function Step2SocraticAgent() {
  const [currentRound, setCurrentRound] = useState(1);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const maxRounds = 4;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 1. KHỞI TẠO CONTEXT TỪ BƯỚC 1 VÀ TẨY SẠCH BỘ NHỚ ĐỆM LỖI
  useEffect(() => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    const anchor = rawAnchor ? JSON.parse(rawAnchor) : {
      target_career: "Công nghệ thông tin",
      target_university: "Đại học Bách Khoa",
      confidence_score: "8",
      holland_code: "Nghiên cứu - Kỹ thuật"
    };
    setStudentProfile(anchor);

    // Dọn sạch trạng thái kẹt cũ của các phiên test trước
    localStorage.removeItem("cbas_step2_messages");
    localStorage.removeItem("cbas_step2_round");

    const initialGreeting = `Chào em. Thầy đã tiếp nhận dữ liệu từ Bước 1: Em chọn ngành **${anchor.target_career}** tại **${anchor.target_university}** với mức tự tin **${anchor.confidence_score}/10**. Kết quả Holland của em là nhóm **${anchor.holland_code}**.

Thầy ở đây để cùng em phản biện, làm rõ các góc khuất thực tế mà mạng xã hội thường không nói tới.

Để bắt đầu Lượt 1, em hãy chia sẻ thẳng thắn: **Điểm số môn học cụ thể nào hoặc trải nghiệm thực tế nào khiến em tin tưởng (hoặc còn do dự) ở mức ${anchor.confidence_score}/10 rằng mình có năng lực thực sự để theo đuổi ngành ${anchor.target_career}?**`;

    const initMsg = [{
      role: 'model',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(initMsg);
    setCurrentRound(1);
  }, []);

  // 2. BỘ ĐIỀU PHỐI PROMPT 4 VÒNG TÁCH BIỆT (CHẠM ĐỘ CHÍN CBAS)
  const generatePromptForRound = (round, profile, userText) => {
    const career = profile?.target_career || "ngành đã chọn";
    const uni = profile?.target_university || "trường đại học mục tiêu";
    const score = profile?.confidence_score || "8";
    const holland = profile?.holland_code || "RIASEC";

    switch (round) {
      case 1:
        return `BẠN LÀ: Chuyên gia Phản tư Hành vi Socrates (Dự án ViSEF 2026 - CBAS).
BỐI CẢNH: Học sinh chọn ngành ${career} tại ${uni}, điểm tự tin ${score}/10, mã RIASEC: ${holland}.
HỌC SINH VỪA NÊU CĂN CỨ NĂNG LỰC: "${userText}".
NHIỆM VỤ VÒNG 1:
1. Đọc kỹ câu trả lời của học sinh: Trích dẫn và phản hồi trực tiếp vào dữ kiện học sinh vừa nêu (ví dụ: điểm môn học, trải nghiệm bán hàng, ngoại giao, sở thích). Tuyệt đối KHÔNG dùng văn mẫu sáo rỗng như "hình ảnh hào nhoáng truyền thông" nếu học sinh không hề nhắc tới.
2. Đối chiếu thực chứng: Phân tích sự khác biệt giữa năng lực phổ thông/trải nghiệm cá nhân đơn giản với độ khó học thuật, tính chuẩn mực pháp lý và áp lực chuyên môn thực tế của ngành ${career}.
3. CUỐI PHẢN HỒI, ĐẶT DUY NHẤT 1 CÂU HỎI DẪN SANG VÒNG 2: "Trong 4-5 năm tới, các phần mềm tự động hóa và AI sẽ thay thế phần lớn các tác vụ xử lý kỹ thuật cơ bản của ngành ${career}. Đâu là năng lực tư duy chuyên sâu hoặc kỹ năng đặc thù mà em tin công nghệ không thể làm thay ở bản thân em?"
Quy chuẩn: Dưới 110 từ. Giữ thái độ phản biện nghiêm cẩn.`;

      case 2:
        return `BẠN LÀ: Chuyên gia Phản tư Hành vi Socrates (Dự án ViSEF 2026 - CBAS).
BỐI CẢNH: Ngành ${career}, mã RIASEC của học sinh là ${holland}.
HỌC SINH PHẢN HỒI VỀ NĂNG LỰC CẠNH TRANH VỚI AI: "${userText}".
NHIỆM VỤ VÒNG 2:
1. Nhận diện xung đột nhận thức:
   - Nếu học sinh nêu các yếu tố như "trực giác, EQ, lãnh đạo, truyền cảm hứng" trong khi ngành lại đòi hỏi tính chính xác, tuân thủ kỷ luật (như Kế toán, Kỹ thuật): Hãy bóc tách sự nhầm lẫn giữa chuyên môn cốt lõi của ngành ${career} với vai trò Quản trị/Kinh doanh.
   - Nếu học sinh nói "cố gắng sẽ vượt qua" hoặc "AI không thay thế được con người/cảm xúc": Hãy chỉ rõ sự cạnh tranh gay gắt về năng suất và chi phí của thị trường lao động.
   - Tuyệt đối KHÔNG nói câu văn mẫu: "Sự băn khoăn là phản ứng tự nhiên..." nếu học sinh đang thể hiện sự tự tin.
2. CUỐI PHẢN HỒI, ĐẶT DUY NHẤT 1 CÂU HỎI DẪN SANG VÒNG 3: "Nếu sau khi tốt nghiệp ngành ${career}, thị trường bão hòa hoặc có khoảng trũng việc làm, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm thích ứng nào để tự nuôi sống bản thân?"
Quy chuẩn: Dưới 110 từ. Không lặp lại câu hỏi trước.`;

      case 3:
        return `BẠN LÀ: Chuyên gia Phản tư Hành vi Socrates (Dự án ViSEF 2026 - CBAS).
BỐI CẢNH: Ngành ${career} tại ${uni}, điểm tự tin ban đầu ${score}/10.
HỌC SINH PHẢN HỒI VỀ KẾ HOẠCH DỰ PHÒNG & THÍCH ỨNG: "${userText}".
NHIỆM VỤ VÒNG 3:
1. Đánh giá tính thực tế của phương án học sinh vừa nêu (chỉ rõ sự chủ động hay còn mang tính phỏng đoán).
2. CUỐI PHẢN HỒI, ĐẶT DUY NHẤT 1 CÂU HỎI TRUY VẤN DỮ LIỆU TUYỂN SINH THỰC TẾ: "Mức tự tin ${score}/10 cần dựa trên những con số pháp lý cụ thể. Em đã từng tự tay đọc Đề án tuyển sinh chính thức của ${uni}, nắm rõ điểm chuẩn 3 năm gần nhất, mức học phí tự chủ từng năm và chỉ tiêu thực tế của ngành ${career} chưa?"
Quy chuẩn: Dưới 85 từ. Súc tích, đanh thép.`;

      case 4:
        return `BẠN LÀ: Chuyên gia Phản tư Hành vi Socrates (Dự án ViSEF 2026 - CBAS).
BỐI CẢNH: ĐÂY LÀ VÒNG ĐÚC KẾT CUỐI CÙNG (KẾT THÚC BƯỚC 2).
HỌC SINH VỪA TRẢ LỜI CÂU HỎI DỮ LIỆU: "${userText}".
NHIỆM VỤ VÒNG 4:
1. Ghi nhận trung thực phản hồi: 
   - Dù học sinh nói "dạ rồi", "đã kiểm tra", "học phí bằng 0" hay "chưa": Nhấn mạnh rằng mọi hiểu biết cần được đối chiếu trực tiếp với văn bản pháp lý chính thống của nhà trường (Đề án tuyển sinh, Nghị định 116 nếu là Sư phạm).
2. TỔNG KẾT ĐỘNG 3 ĐIỂM KHOẢNG TRỐNG NHẬN THỨC dựa trên chính diễn biến cuộc trò chuyện:
   - Điểm 1: Năng lực nền tảng ban đầu so với tính kỷ luật học thuật và bản chất nghề nghiệp thực tế của ${career}.
   - Điểm 2: Thách thức tự động hóa công nghệ và mức độ sẵn sàng của Bộ kỹ năng thích ứng dự phòng.
   - Điểm 3: Sự cần thiết phải kiểm chứng chính xác các số liệu tuyển sinh, học phí thực tế tại ${uni}.
3. LỜI KẾT BẮT BUỘC (TUYỆT ĐỐI KHÔNG ĐẶT THÊM CÂU HỎI, KHÔNG YÊU CẦU DẪN CHỨNG):
   "Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu Đề án tuyển sinh để hoàn thiện cơ sở vững chắc cho quyết định của mình!"
Quy chuẩn: Dưới 130 từ.`;

      default:
        return "";
    }
  };

  // PHẢN HỒI SOCRATES DỰ PHÒNG CHUẨN CBAS (BẢO HIỂM 100% KHÔNG BAO GIỜ TREO MÁY NẾU MẤT MẠNG HOẶC HẾT QUOTA)
  const generateHeuristicFallback = (round, profile, userText = '') => {
    const career = profile?.target_career || "Công nghệ thông tin";
    const uni = profile?.target_university || "Đại học Bách Khoa";
    const score = profile?.confidence_score || "8";
    const cleanLower = userText.toLowerCase();

    switch (round) {
      case 1:
        return `Thầy ghi nhận căn cứ năng lực mà em vừa nêu: "${userText}".\n\n` +
          `Tuy nhiên, điểm số môn học phổ thông hay trải nghiệm cá nhân ban đầu chỉ là nền tảng sơ khởi. Khi bước vào giảng đường và môi trường nghề nghiệp thực tế của ngành **${career}**, em sẽ đối mặt với độ khó học thuật chuyên sâu, tính chuẩn mực pháp lý nghiêm ngặt và áp lực chuyên môn rất khắt khe.\n\n` +
          `Trong 4-5 năm tới, các phần mềm tự động hóa và AI sẽ thay thế phần lớn các tác vụ xử lý kỹ thuật cơ bản của ngành ${career}. Đâu là năng lực tư duy chuyên sâu hoặc kỹ năng đặc thù mà em tin công nghệ không thể làm thay ở bản thân em?`;

      case 2:
        return `Thầy ghi nhận chia sẻ của em về năng lực cạnh tranh: "${userText}".\n\n` +
          `Thực tế thị trường lao động cho thấy áp lực cạnh tranh về năng suất và chi phí ngày càng gay gắt. Các kỹ năng chung chung hay sự cố gắng cảm tính khó có thể thay thế chuyên môn kỹ thuật cốt lõi và năng lực số chuyên sâu của ngành **${career}**.\n\n` +
          `Nếu sau khi tốt nghiệp ngành ${career}, thị trường bão hòa hoặc có khoảng trũng việc làm, em đã chuẩn bị Bộ kỹ năng chuyển đổi (ngoại ngữ, năng lực số, giao tiếp) và phương án việc làm thích ứng nào để tự nuôi sống bản thân?`;

      case 3:
        return `Kế hoạch thích ứng dự phòng em nêu thể hiện bước đầu ý thức sinh tồn, nhưng tính khả thi vẫn còn nhiều khoảng trống phỏng đoán.\n\n` +
          `Mức tự tin ${score}/10 cần dựa trên những con số pháp lý cụ thể. Em đã từng tự tay đọc Đề án tuyển sinh chính thức của ${uni}, nắm rõ điểm chuẩn 3 năm gần nhất, mức học phí tự chủ từng năm và chỉ tiêu thực tế của ngành ${career} chưa?`;

      case 4:
      default: {
        const isFreeMention = cleanLower.includes('bằng 0') || cleanLower.includes('0 đồng') || cleanLower.includes('miễn phí') || cleanLower.includes('free');
        const prefix = isFreeMention
          ? `Lưu ý rằng chính sách hỗ trợ học phí ngành ${career} (như Nghị định 116 nếu là Sư phạm) gắn liền với cam kết phục vụ trong ngành, nếu không sẽ phải bồi hoàn toàn bộ kinh phí đào tạo.\n\n`
          : '';

        return `${prefix}Qua 4 vòng đối thoại, em đã dũng cảm đối diện với 3 khoảng trống nhận thức cốt lõi:\n` +
          `1. Điểm số môn học phổ thông so với tính kỷ luật học thuật và bản chất nghề nghiệp thực tế của ngành ${career}.\n` +
          `2. Thách thức tự động hóa công nghệ và mức độ sẵn sàng của Bộ kỹ năng thích ứng dự phòng khi thị trường bão hòa.\n` +
          `3. Sự cần thiết phải kiểm chứng chính xác các số liệu tuyển sinh, điểm chuẩn 3 năm và học phí thực tế tại ${uni}.\n\n` +
          `Phiên phản tư nhận thức kết thúc tại đây. Giờ là lúc em rời màn hình đối thoại để bước sang **Bước 3: Đối chứng Dữ liệu Khách quan**, tự tay tra cứu Đề án tuyển sinh để hoàn thiện cơ sở vững chắc cho quyết định của mình!`;
      }
    }
  };

  // 3. GỌI API GEMINI VỚI CẤU HÌNH NHIỆT ĐỘ CỐ ĐỊNH CHỐNG ẢO GIÁC
  const callGeminiSocratic = async (historyMessages, userText, round) => {
    // 3.1. Thử gọi Serverless Backend /api/chat nếu có
    try {
      const serverlessCtrl = new AbortController();
      const sTimeout = setTimeout(() => serverlessCtrl.abort(), 5500);

      const serverlessRes = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyMessages.map(m => ({ role: m.role, text: m.text })),
          round: round,
          maxRounds: maxRounds,
          anchor: studentProfile
        }),
        signal: serverlessCtrl.signal
      });
      clearTimeout(sTimeout);

      if (serverlessRes.ok) {
        const sData = await serverlessRes.json();
        if (sData?.reply && sData.reply.trim().length >= 30) {
          return sData.reply.trim();
        }
      }
    } catch (apiErr) {
      // Tiếp tục chuyển sang gọi trực tiếp
    }

    // 3.2. Gọi trực tiếp Gemini API (Hỗ trợ cả Vite import.meta và process.env an toàn)
    try {
      const DEFAULT_ENCODED = 'QVEuQWI4Uk42S001OHFsaDJITEU0WktpSkt2dmZQVE1vd0ZLUjRHRU9GbE92X01iVERaRHc=';
      const fallbackKey = typeof atob !== 'undefined' ? atob(DEFAULT_ENCODED) : '';
      const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
        || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY)
        || fallbackKey;

      const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      const systemPrompt = generatePromptForRound(round, studentProfile, userText);

      const formattedContents = historyMessages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      formattedContents.push({
        role: 'user',
        parts: [{ text: userText }]
      });

      const directCtrl = new AbortController();
      const directTimeout = setTimeout(() => directCtrl.abort(), 6000);

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: formattedContents,
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 250
          }
        }),
        signal: directCtrl.signal
      });
      clearTimeout(directTimeout);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length >= 20) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn("Direct Gemini call exception:", e);
    }

    // 3.3. Kích hoạt fallback heuristic dự phòng chuẩn CBAS nếu mạng chậm hoặc hết quota
    return generateHeuristicFallback(round, studentProfile, userText);
  };

  // 4. TRÍCH XUẤT VĂN BẢN ĐỐI THOẠI CHUẨN MỰC CHO HỌC SINH
  const generateExportText = () => {
    const rawAnchor = localStorage.getItem("cbas_anchor_data");
    let anchor = {};
    if (rawAnchor) {
      try { anchor = JSON.parse(rawAnchor); } catch (e) {}
    }

    const targetCareer = anchor.target_career || studentProfile?.target_career || 'Công nghệ thông tin';
    const targetUniv = anchor.target_university || studentProfile?.target_university || 'Đại học Bách Khoa';
    const confidence = anchor.confidence_score || studentProfile?.confidence_score || '8';
    const holland = anchor.holland_code || studentProfile?.holland_code || 'Nghiên cứu - Kỹ thuật';
    const dateStr = new Date().toLocaleString('vi-VN');

    let content = `=================================================================\n`;
    content += `   BIÊN BẢN PHẢN TƯ HƯỚNG NGHIỆP SOCRATES (BƯỚC 2 - CBAS)\n`;
    content += `       Dự án Nghiên cứu Khoa học Hành vi (ViSEF 2026)\n`;
    content += `=================================================================\n\n`;
    content += `📅 Thời gian xuất: ${dateStr}\n`;
    content += `🎯 Ngành mục tiêu: ${targetCareer}\n`;
    content += `🏛️ Trường đại học mục tiêu: ${targetUniv}\n`;
    content += `📊 Mức tự tin ban đầu (Bước 1): ${confidence}/10\n`;
    content += `🧬 Thiên hướng Holland (RIASEC): ${holland}\n`;
    content += `🔄 Tiến trình hoàn thành: ${Math.min(currentRound, maxRounds)} / ${maxRounds} vòng phản tư${currentRound > maxRounds ? ' (Đã hoàn thành đầy đủ)' : ''}\n\n`;
    content += `-----------------------------------------------------------------\n`;
    content += `CHI TIẾT NỘI DUNG ĐỐI THOẠI PHẢN BIỆN SOCRATES:\n`;
    content += `-----------------------------------------------------------------\n\n`;

    messages.forEach((msg) => {
      const sender = msg.role === 'model' ? '🤖 Thầy Socrates (AI)' : '🧑‍🎓 Học sinh';
      content += `[${msg.time || ''}] ${sender}:\n${msg.text}\n\n`;
    });

    content += `=================================================================\n`;
    content += `📌 HƯỚNG DẪN TIẾP THEO DÀNH CHO HỌC SINH:\n`;
    content += `1. Dùng các câu hỏi truy vấn ở trên để tra cứu số liệu tại Bước 3 (Điểm chuẩn 3 năm, Học phí tự chủ, Đề án tuyển sinh).\n`;
    content += `2. Mang biên bản này đối chất trực tiếp với Cố vấn / Sinh viên trong buổi Tư vấn 1-1 ở Bước 4.\n`;
    content += `=================================================================\n`;

    return content;
  };

  // 4.1. Tải về file văn bản (.txt)
  const handleDownloadTxt = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const careerSlug = (studentProfile?.target_career || 'huong_nghiep')
      .trim().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    
    link.href = url;
    link.download = `Nhat_ky_phan_tu_Socrates_${careerSlug}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4.2. Sao chép vào bộ nhớ tạm (Clipboard)
  const handleCopyText = async () => {
    try {
      const text = generateExportText();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('Lỗi sao chép:', err);
    }
  };

  // 4.3. In hoặc Lưu file PDF chuẩn
  const handlePrint = () => {
    window.print();
  };

  // 4.4. Bắt đầu lại cuộc trò chuyện từ đầu (Phục vụ thử nghiệm)
  const handleResetSession = () => {
    if (window.confirm("Em có muốn xóa dữ liệu phiên hiện tại và bắt đầu lại cuộc trò chuyện từ Vòng 1 không?")) {
      localStorage.removeItem("cbas_step2_messages");
      localStorage.removeItem("cbas_step2_round");
      window.location.reload();
    }
  };

  // 5. BỘ LỌC ĐẦU VÀO THÔNG MINH - CHẤP NHẬN CÂU TRẢ LỜI NGẮN Ở VÒNG CUỐI
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanText = inputValue.trim();

    // RÀNG BUỘC THÔNG MINH:
    // Vòng 1, 2 bắt buộc lập luận (tối thiểu 5 ký tự)
    // Vòng 3 trở đi chấp nhận câu trả lời ngắn ("dạ rồi", "chưa", "em đã xem")
    if (currentRound <= 2 && cleanText.length < 5) {
      setErrorMessage("⚠️ Câu trả lời của em quá ngắn. Hãy chia sẻ cụ thể trải nghiệm hoặc suy nghĩ của mình để Thầy phản biện nhé!");
      return;
    }

    if (cleanText.length === 0) return;

    setErrorMessage('');
    const userMsg = {
      role: 'user',
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiReply = await callGeminiSocratic(messages, cleanText, currentRound);
      
      const aiMsg = {
        role: 'model',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...nextHistory, aiMsg]);
      setCurrentRound(prevRound => prevRound + 1);

    } catch (err) {
      console.error(err);
      setErrorMessage("⚠️ Sự cố kết nối AI: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '88vh', fontFamily: 'sans-serif' }}>
      
      {/* CSS CHO CHẾ ĐỘ IN / LƯU FILE PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #socratic-chat-export-area, #socratic-chat-export-area * {
            visibility: visible;
          }
          #socratic-chat-export-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* THANH TIẾN TRÌNH & CỤM NÚT THAO TÁC / XUẤT FILE */}
      <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px' }}>BƯỚC 2: CAN THIỆP HÀNH VI</span>
          <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', color: '#0f172a' }}>AI Tham Vấn Phản Tư (Socrates)</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            Tiến trình: <span style={{ color: '#2563eb' }}>{Math.min(currentRound, maxRounds)}</span> / {maxRounds} vòng
            {currentRound > maxRounds && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px' }}>
                ✓ Đã hoàn thành
              </span>
            )}
          </div>

          {/* CỤM NÚT SAO CHÉP, XUẤT FILE & BẮT ĐẦU LẠI */}
          <div style={{ display: 'flex', gap: '6px' }} className="no-print">
            <button
              type="button"
              onClick={handleCopyText}
              title="Sao chép toàn bộ nội dung trò chuyện vào bộ nhớ tạm"
              style={{
                background: copySuccess ? '#ecfdf5' : '#f8fafc',
                border: '1px solid ' + (copySuccess ? '#a7f3d0' : '#cbd5e1'),
                borderRadius: '6px',
                padding: '6px 11px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: copySuccess ? '#059669' : '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copySuccess ? '✅ Đã chép!' : '📋 Sao chép'}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải biên bản đối thoại phản tư (.txt)"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 11px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📥 Xuất .TXT
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="In hoặc Lưu file PDF chuẩn"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 11px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🖨️ Lưu PDF
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              title="Bắt đầu lại cuộc trò chuyện từ Vòng 1"
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '6px 11px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#1d4ed8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔄 Bắt đầu lại
            </button>
          </div>
        </div>
      </div>

      {/* KHUNG NỘI DUNG CHAT (VÙNG IN VÀ HIỂN THỊ) */}
      <div id="socratic-chat-export-area" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%',
              padding: '14px 18px',
              borderRadius: m.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              background: m.role === 'user' ? '#059669' : '#ffffff',
              color: m.role === 'user' ? '#ffffff' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              fontSize: '14.5px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
              <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right', opacity: 0.7 }}>{m.time}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }} className="no-print">
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#64748b' }}>
              🤖 Thầy Socrates đang phản biện luận điểm của em...
            </div>
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }} className="no-print">
            {errorMessage}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* KHỐI HOÀN THÀNH - CHUYỂN SANG BƯỚC 3 & CÁC NÚT XUẤT NỔI BẬT */}
      {currentRound > maxRounds && (
        <div style={{ padding: '16px 20px', background: '#ecfdf5', borderTop: '1px solid #a7f3d0' }} className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14.5px', color: '#065f46', fontWeight: 'bold' }}>
                🎯 Em đã hoàn thành đủ 4 vòng phản tư nhận thức Socrates!
              </p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#047857' }}>
                Em có thể sao chép hoặc xuất biên bản đối thoại này để làm minh chứng cho buổi Tham vấn 1-1 ở Bước 4.
              </p>
            </div>

            {/* CỤM NÚT XUẤT CUỐI VÒNG 4 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyText}
                style={{
                  background: copySuccess ? '#059669' : '#ffffff',
                  color: copySuccess ? '#ffffff' : '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {copySuccess ? '✅ Đã sao chép!' : '📋 Sao chép biên bản'}
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 Tải file .TXT
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🖨️ Lưu file PDF
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={handleResetSession}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              🔄 Bắt đầu lại từ đầu
            </button>
            <button 
              type="button"
              onClick={() => window.location.href = '/student/evidence-check'}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
              }}
            >
              Chuyển Sang Bước 3: Đối Chứng Dữ Liệu Tuyển Sinh Thực Tế ➜
            </button>
          </div>
        </div>
      )}

      {/* Ô NHẬP LIỆU DUY NHẤT */}
      <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }} className="no-print">
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || currentRound > maxRounds}
            placeholder={currentRound > maxRounds ? "Phiên phản tư đã kết thúc. Mời em sao chép/xuất biên bản hoặc chuyển sang Bước 3." : "Tự tay nhập câu trả lời phản biện của em..."}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || currentRound > maxRounds}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: isLoading || currentRound > maxRounds ? 'not-allowed' : 'pointer',
              opacity: isLoading || !inputValue.trim() || currentRound > maxRounds ? 0.6 : 1
            }}
          >
            GỬI ➔
          </button>
        </form>
      </div>

    </div>
  );
}

export { Step2SocraticAgent };
