import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Brain, 
  AlertTriangle, 
  RotateCcw, 
  Search, 
  Scale, 
  BarChart3, 
  Puzzle,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  BookOpen
} from 'lucide-react'

// 4 Nút gợi ý Cú hích Phản tư (Quick Nudge Prompts)
const QUICK_NUDGES = [
  {
    id: 'nudge-1',
    icon: Search,
    color: 'hover:border-amber-400 hover:bg-amber-50/70 text-amber-900',
    iconColor: 'text-amber-600',
    prompt: '🔍 Phân tích mặt tối & rủi ro thực tế của ngành ',
    isNeedInput: true,
    placeholder: 'CNTT / Y Khoa / Marketing...'
  },
  {
    id: 'nudge-2',
    icon: Scale,
    color: 'hover:border-indigo-400 hover:bg-indigo-50/70 text-indigo-900',
    iconColor: 'text-indigo-600',
    prompt: '⚖️ Tôi đang chọn ngành theo xu hướng số đông, hãy phản biện giúp tôi',
    isNeedInput: false
  },
  {
    id: 'nudge-3',
    icon: BarChart3,
    color: 'hover:border-emerald-400 hover:bg-emerald-50/70 text-emerald-900',
    iconColor: 'text-emerald-600',
    prompt: '📊 Tìm 3 luận điểm đối lập với kỳ vọng lương cao của ngành này',
    isNeedInput: false
  },
  {
    id: 'nudge-4',
    icon: Puzzle,
    color: 'hover:border-rose-400 hover:bg-rose-50/70 text-rose-900',
    iconColor: 'text-rose-600',
    prompt: '🧩 Soi chiếu xem tôi có đang mắc Thiên lệch chi phí chìm không?',
    isNeedInput: false
  }
]

// Bộ suy luận Phản tư Chuyên sâu (Debiasing Knowledge Engine) tuân thủ 3 NGUYÊN TẮC VÀNG
const generateDebiasingResponse = (userPrompt) => {
  const text = userPrompt.toLowerCase()

  // TÍNH NĂNG 1: NGUYÊN TẮC TRUNG LẬP TUYỆT ĐỐI
  const neutralDisclaimer = `> ⚖️ **CAM KẾT TRUNG LẬP:** Tôi là AI Phản tư, tôi **KHÔNG BAO GIỜ** khuyên bạn NÊN chọn hay KHÔNG NÊN chọn bất kỳ ngành nào. Quyết định cuối cùng hoàn toàn thuộc về bạn dựa trên sự tự đánh giá năng lực và bằng chứng thực tế.`

  // 1. Nhóm bẫy THIÊN LỆCH CHI PHÍ CHÌM (Sunk Cost Fallacy)
  if (text.includes('chi phí chìm') || text.includes('sunk cost') || text.includes('tiếc') || text.includes('lỡ') || text.includes('chuyên') || text.includes('ôn thi từ')) {
    return `${neutralDisclaimer}

### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Trong tâm lý học quyết định, thời gian, công sức và tiền bạc bạn đã đầu tư trong quá khứ là những khoản **chi phí chìm không thể lấy lại**. Việc một học sinh giỏi khối chuyên hay đã dành 2-3 năm ôn luyện một môn học chỉ chứng minh bạn có khả năng tiếp thu môn học đó ở phổ thông, chứ không đảm bảo bạn sẽ hứng thú hay thành công với môi trường làm việc thực tế của ngành trong 40 năm tới.

---

### ⚠️ PHẦN 2: NHẬN DIỆN BẪY TÂM LÝ & RỦI RO THỰC TẾ
* 🚨 **BẪY TÂM LÝ NHẬN DIỆN: 天 lệch chi phí chìm (Sunk Cost Fallacy)**
  Bạn có thể đang rơi vào tâm lý "tiếc công sức đã lỡ đầu tư" nên cố bám trụ lựa chọn cũ, thay vì dũng cảm đánh giá xem ngành đó có thực sự phù hợp với năng lực và giá trị cuộc sống hiện tại của mình hay không.
* ⚡ **Rủi ro thực tế:** Hơn 60% sinh viên ra trường làm trái ngành hoặc rơi vào trạng thái bế tắc công việc xuất phát từ việc không dám từ bỏ lựa chọn ban đầu khi phát hiện bản thân không phù hợp.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ (SOCRATIC QUESTIONING)
1. **Về đánh giá năng lực thực chất:** *Nếu gạt bỏ hoàn toàn sự tiếc nuối về công sức ôn thi khối ngành cũ, ngành học nào khiến bạn tự tin nhất về khả năng duy trì sự kiên trì trong 4 năm đại học?*
2. **Về đối diện rủi ro nghề nghiệp:** *Bạn thà chấp nhận "lãng phí" một vài năm chuẩn bị ở phổ thông để điều chỉnh đúng hướng, hay chấp nhận rủi ro tốn 4 năm đại học và hàng chục năm làm công việc mình không hề hứng thú?*`
  }

  // 2. Nhóm bẫy HIỆU ỨNG ĐÁM ĐÔNG (Bandwagon Effect)
  if (text.includes('đám đông') || text.includes('bạn bè') || text.includes('xu hướng') || text.includes('số đông') || text.includes('nhiều người') || text.includes('hot trend') || text.includes('chạy theo')) {
    return `${neutralDisclaimer}

### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Thị trường lao động vận hành theo quy luật cung - cầu. Một ngành học đang "hot" ở thời điểm hiện tại thường kéo theo hàng chục ngàn chỉ tiêu tuyển sinh toàn quốc. Khi tất cả cùng tốt nghiệp sau 4 năm, thị trường có nguy cơ chạm ngưỡng bão hòa, dẫn đến tỷ lệ cạnh tranh gay gắt và mức độ đào thải cao đối với nhân sự trung bình.

---

### ⚠️ PHẦN 2: NHẬN DIỆN BẪY TÂM LÝ & RỦI RO THỰC TẾ
* 🚨 **BẪY TÂM LÝ NHẬN DIỆN: Hiệu ứng Đám đông (Bandwagon Effect)**
  Bạn có xu hướng cảm thấy an toàn khi chọn ngành theo số đông hoặc theo quyết định của bạn bè xung quanh, dẫn đến việc nhầm lẫn giữa "sự an toàn giả tạo của trào lưu" với "sự phù hợp năng lực cá nhân".
* ⚡ **Rủi ro thực tế:** Sự thành công trong nghề nghiệp phụ thuộc vào năng lực vượt trội của bản thân trong ngành đó, chứ không phụ thuộc vào độ "hot" của tên ngành trên giấy tờ.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ (SOCRATIC QUESTIONING)
1. **Về tư duy độc lập:** *Nếu ngành học này hoàn toàn không còn được báo chí khen ngợi và bạn bè xung quanh không ai chọn nữa, bản thân bạn có còn động lực tự thân để học nó không?*
2. **Về năng lực cạnh tranh thực chất:** *Trong 1.000 sinh viên cùng tốt nghiệp ngành này với bạn, bạn sẽ dựa vào điểm mạnh cốt lõi nào của bản thân để đứng vào top 10% nhận việc làm tốt?*`
  }

  // 3. Nhóm bẫy THIÊN LỆCH SẴN CÓ (Availability Bias) - Mạng xã hội, TikTok, Tin đồn
  if (text.includes('tiktok') || text.includes('tin đồn') || text.includes('mạng xã hội') || text.includes('xem video') || text.includes('báo chí') || text.includes('nghe nói') || text.includes('youtube')) {
    return `${neutralDisclaimer}

### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Thông tin trên các nền tảng mạng xã hội (TikTok, Facebook, YouTube) thường bị chi phối bởi thuật toán giật gân, tô hồng những câu chuyện thành công cá biệt hoặc đưa ra thông tin một chiều để thu hút lượt xem (view), hoàn toàn không đại diện cho bức tranh toàn cảnh của ngành nghề.

---

### ⚠️ PHẦN 2: NHẬN DIỆN BẪY TÂM LÝ & RỦI RO THỰC TẾ
* 🚨 **BẪY TÂM LÝ NHẬN DIỆN: Thiên lệch sẵn có (Availability Bias)**
  Bạn đang đưa ra đánh giá chọn nghề dựa trên các thông tin quá dễ tiếp cận và ấn tượng mạnh trên mạng xã hội, thay vì dựa trên báo cáo dữ liệu tuyển dụng chính thống từ Bộ GD&ĐT hay thị trường lao động.
* ⚡ **Rủi ro thực tế:** Phớt lờ các mặt tối của ngành như thời gian làm việc OT, áp lực chỉ tiêu KPI, tỷ lệ giữ chân nhân sự và nguy cơ thay đổi công nghệ.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ (SOCRATIC QUESTIONING)
1. **Về kiểm chứng thông tin:** *Bạn đã tìm đọc báo cáo thị trường lao động chính thống hay trò chuyện trực tiếp với ít nhất 2 người đang đi làm 3-5 năm trong ngành này để nghe về khó khăn của họ chưa?*
2. **Về khả năng chịu đựng thực tế:** *Nếu môi trường làm việc thực tế khác xa 80% so với những video lung linh trên mạng xã hội, bạn có kế hoạch ứng phó thế nào?*`
  }

  // 4. Nhóm bẫy THIÊN LỆCH XÁC NHẬN (Confirmation Bias) & Kỳ vọng lương cao
  if (text.includes('lương') || text.includes('thu nhập') || text.includes('lương cao') || text.includes('khen') || text.includes('chỉ thấy') || text.includes('hoàn hảo') || text.includes('đam đam')) {
    return `${neutralDisclaimer}

### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Mức thu nhập cao trong bất kỳ ngành nghề nào cũng luôn đi kèm với yêu cầu trình độ chuyên môn cao, áp lực công việc khốc liệt và thời gian tích lũy kinh nghiệm từ 3-5 năm trở lên. Không có ngành học nào đảm bảo "ra trường mặc nhiên lương hàng chục triệu".

---

### ⚠️ PHẦN 2: NHẬN DIỆN BẪY TÂM LÝ & RỦI RO THỰC TẾ
* 🚨 **BẪY TÂM LÝ NHẬN DIỆN: Thiên lệch xác nhận (Confirmation Bias)**
  Bạn có xu hướng chủ động tìm kiếm những bài viết ca ngợi thu nhập và cố tình phớt lờ những cảnh báo về áp lực đào thải, nguy cơ kiệt sức (burnout) cũng như các kỹ năng khắt khe mà ngành yêu cầu.
* ⚡ **Rủi ro thực tế:** Khi vỡ mộng giữa kỳ vọng thu nhập và thực tế công việc năm nhất đại học, học sinh rất dễ rơi vào trạng thái chán nản và bỏ dở giữa chừng.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ (SOCRATIC QUESTIONING)
1. **Về đánh giá năng lực thích ứng:** *Ngoài yếu tố thu nhập, bạn có thực sự hứng thú với các nhiệm vụ công việc hằng ngày của ngành này khi phải lặp đi lặp lại suốt 8 tiếng mỗi ngày không?*
2. **Về kiên trì giai đoạn đầu:** *Nếu trong 2 năm đầu mới ra trường, mức lương chỉ ở mức cơ bản để tích lũy kinh nghiệm, bạn có đủ sự kiên nhẫn và đam mê để theo đuổi đến cùng không?*`
  }

  // 5. Phản biện nhóm ngành CNTT & AI
  if (text.includes('cntt') || text.includes('công nghệ thông tin') || text.includes('ai') || text.includes('lập trình') || text.includes('phần mềm')) {
    return `${neutralDisclaimer}

### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Ngành CNTT & AI đòi hỏi khả năng tư duy logic thuật toán khắt khe, tính tự học liên tục và sức bền tâm lý trước áp lực công việc (OT, sửa lỗi code, sự thay đổi công nghệ hằng năm). Thị trường hiện nay thắt chặt tuyển dụng lập trình viên trình độ cơ bản và ưu tiên nhân sự chuyên sâu có tư duy giải quyết vấn đề.

---

### ⚠️ PHẦN 2: NHẬN DIỆN BẪY TÂM LÝ & RỦI RO THỰC TẾ
* 🚨 **NHẬN DIỆN BẪY TÂM LÝ: Thiên lệch sẵn có & Hiệu ứng Đám đông**
  Bạn có thể đang bị thu hút bởi các tiêu đề truyền thông "ngành CNTT khát nhân lực lương khủng", mà bỏ qua thực tế tỷ lệ sinh viên bỏ cuộc hoặc chuyển ngành trong 2 năm đầu đại học do không theo nổi các môn Toán rời rạc, Cấu trúc dữ liệu và Giải thuật.
* ⚡ **Rủi ro thực tế:** Sự phát triển của các công cụ AI (GitHub Copilot, ChatGPT) đang tự động hóa mạnh mẽ các công việc gõ code đơn giản.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ (SOCRATIC QUESTIONING)
1. **Về năng lực giải quyết vấn đề:** *Bạn có sẵn sàng ngồi liên tục 6-8 tiếng tự mò mẫm tài liệu tiếng Anh để tìm nguyên nhân một lỗi code nhỏ mà không bỏ cuộc không?*
2. **Về kiểm chứng thực tế:** *Bạn đã từng tự tay thử học một khóa lập trình nhập môn miễn phí để xem bản thân thực sự hứng thú hay mệt mỏi với công việc này chưa?*`
  }

  // 6. Phản biện chung mặc định cho mọi ngành khác
  return `${neutralDisclaimer}

### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Mọi ngành học trong kỷ nguyên số đều có hai mặt: cơ hội phát triển sự nghiệp đi kèm với áp lực cạnh tranh và yêu cầu thích ứng công nghệ. Để đánh giá đúng một ngành, bạn cần tách biệt giữa thông tin quảng cáo tuyển sinh với thực tế công việc hằng ngày của người trong nghề.

---

### ⚠️ PHẦN 2: NHẬN DIỆN BẪY TÂM LÝ & RỦI RO THỰC TẾ
* 🚨 **NHẬN DIỆN BẪY TÂM LÝ: Thiên lệch xác nhận (Confirmation Bias) & Bẫy Đám đông**
  Hãy đối chiếu xem bạn đang chọn ngành dựa trên hiểu biết sâu sắc về năng lực bản thân, hay chỉ vì bị ảnh hưởng bởi lời khuyên của người khác và các thông tin màu hồng thiếu kiểm chứng.
* ⚡ **Rủi ro thực tế:** Việc chọn ngành không dựa trên năng lực cốt lõi sẽ khiến bạn gặp khó khăn trong việc duy trì động lực học tập và tạo dựng lợi thế cạnh tranh sau khi ra trường.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ (SOCRATIC QUESTIONING)
1. **Về đánh giá sự phù hợp:** *Điểm mạnh nhất về năng lực hoặc tính cách của bạn có đóng góp trực tiếp vào công việc hằng ngày của ngành này không?*
2. **Về phương án dự phòng:** *Nếu ngành này có sự thay đổi lớn về nhu cầu tuyển dụng trong 4 năm tới, bạn có phương án dự phòng NGUYỆN VỌNG 2 nào thực sự an toàn và phù hợp không?*`
}

const DebiasAgent = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Xin chào bạn! Tôi là **AI Tham vấn Phản tư Hướng nghiệp (Debiasing Agent)**.

Tôi ở đây không phải để khen ngợi hay chọn nghề thay bạn, mà sẽ cùng bạn **soi chiếu mọi lựa chọn dưới góc nhìn phản biện khách quan**, chỉ ra các **bẫy tư duy tâm lý** và rủi ro thực tế mà truyền thông hay giấu kín.

👉 Bạn đang phân vân ngành học nào, hoặc đang gặp vướng mắc gì trong quyết định chọn nghề? Hãy chia sẻ với tôi nhé!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const [inputPrompt, setInputPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputPrompt
    if (!query.trim()) return

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInputPrompt('')
    setIsLoading(true)

    // Giả lập thời gian phản hồi suy nghĩ của AI Phản tư
    setTimeout(() => {
      const aiReplyText = generateDebiasingResponse(query)
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMsg])
      setIsLoading(false)
    }, 1000)
  }

  const handleQuickNudgeClick = (nudge) => {
    if (nudge.isNeedInput) {
      setInputPrompt(nudge.prompt)
    } else {
      handleSendMessage(nudge.prompt)
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        sender: 'ai',
        text: `Đã làm mới phiên phản tư! Hãy chọn một gợi ý bên dưới hoặc nhập câu hỏi/ngành học bạn muốn tôi phản biện nhé!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 animate-reveal">
      {/* HEADER TIÊU ĐỀ TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-md shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <span>🤖 AI Tham vấn Phản tư Hướng nghiệp</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
              Debiasing Agent
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Trợ lý trí tuệ nhân tạo phản biện bẫy tư duy tâm lý & vạch trần rủi ro thực tế trong chọn nghề.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleResetChat}
          className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 text-slate-600 border-slate-300 hover:bg-slate-100 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Làm mới hội thoại
        </Button>
      </div>

      {/* 1. BANNER CẢNH BÁO NGUYÊN LÝ KHOA HỌC (REQUIREMENT 1) */}
      <div className="bg-amber-50/90 border-2 border-amber-300 p-4 rounded-sm shadow-2xs flex items-start gap-3.5 text-amber-950">
        <div className="p-2 bg-amber-200 text-amber-900 rounded-full shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-extrabold text-xs uppercase tracking-wider block text-amber-900 flex items-center gap-1.5">
            <span>💡 NGUYÊN TẮC PHẢN TƯ (METACOGNITIVE DEBIASING)</span>
          </span>
          <p className="text-xs leading-relaxed font-medium text-amber-900/90">
            AI này <strong>KHÔNG</strong> chọn nghề thay bạn. AI sẽ đồng hành đặt câu hỏi phản biện, chỉ ra các bẫy tâm lý 
            (Thiên lệch xác nhận, Hiệu ứng đám đông...) để giúp bạn tự đưa ra quyết định vững chắc dựa trên bằng chứng thực tế.
          </p>
        </div>
      </div>

      {/* KHUNG NỘI DUNG CHATBOT */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col h-[580px]">
        {/* LỊCH SỬ CHAT (MESSAGE LIST) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Bong bóng tin nhắn */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-sm p-4 text-xs leading-relaxed shadow-2xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Format Markdown giản đơn cho tin nhắn AI */}
                {msg.sender === 'ai' ? (
                  <div className="space-y-3">
                    {msg.text.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('### ')) {
                        const title = paragraph.replace('### ', '')
                        const isPart1 = title.includes('PHẦN 1')
                        const isPart2 = title.includes('PHẦN 2')
                        const isPart3 = title.includes('PHẦN 3')

                        return (
                          <div 
                            key={idx} 
                            className={`font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-sm border ${
                              isPart1 ? 'bg-slate-100 text-slate-800 border-slate-300' :
                              isPart2 ? 'bg-rose-100 text-rose-900 border-rose-300' :
                              'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {title}
                          </div>
                        )
                      }
                      if (paragraph === '---') {
                        return <hr key={idx} className="border-slate-200 my-2" />
                      }
                      return (
                        <p key={idx} className="whitespace-pre-line text-slate-700 font-medium leading-relaxed">
                          {paragraph}
                        </p>
                      )
                    })}
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{msg.text}</p>
                )}

                <div
                  className={`text-[10px] text-right font-medium mt-1 ${
                    msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Đang phản hồi Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-sm rounded-tl-none text-xs text-slate-500 font-semibold flex items-center gap-2 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>AI Phản tư đang phân tích rủi ro & bẫy tâm lý...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 2. BỘ NÚT GỢI Ý CÚ HÍCH PHẢN TƯ (REQUIREMENT 2 - QUICK NUDGE PROMPTS) */}
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>GỢI Ý CÚ HÍCH PHẢN TƯ NHAU (QUICK NUDGE PROMPTS)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Bấm nút để hỏi nhanh</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_NUDGES.map((nudge) => {
              const IconComp = nudge.icon
              return (
                <button
                  key={nudge.id}
                  type="button"
                  onClick={() => handleQuickNudgeClick(nudge)}
                  className={`text-left text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-sm transition-all shadow-2xs flex items-center gap-2 ${nudge.color}`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${nudge.iconColor}`} />
                  <span className="truncate">{nudge.prompt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ô NHẬP NỘI DUNG NHAU & GỬI FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Nhập tên ngành học hoặc quan điểm chọn nghề của bạn để AI phản biện (VD: Em muốn học CNTT vì thấy bạn bè bảo dễ kiếm tiền...)"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-800 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !inputPrompt.trim()}
            className="font-bold text-xs uppercase py-2.5 px-4 shrink-0 flex items-center gap-1.5"
          >
            <span>GỬI CÂU HỎI</span>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default DebiasAgent
