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

// Bộ suy luận Phản tư Chuyên sâu (Debiasing Knowledge Engine) theo khối ngành
const generateDebiasingResponse = (userPrompt) => {
  const text = userPrompt.toLowerCase()

  // 1. Phản biện nhóm ngành CNTT / Trí tuệ nhân tạo / Phần mềm
  if (text.includes('cntt') || text.includes('công nghệ thông tin') || text.includes('ai') || text.includes('lập trình') || text.includes('phần mềm')) {
    return `### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Ngành CNTT & AI đòi hỏi khả năng tự học liên tục, tư duy logic thuật toán khắt khe và sức bền tâm lý trước áp lực công việc (OT, debug, cập nhật công nghệ mới mỗi năm). Thị trường hiện tại đã qua thời kỳ "cứ biết gõ code là lương nghìn đô". Doanh nghiệp hiện tập trung tuyển dụng nhân sự trình độ cao, có năng lực giải quyết bài toán thực tế thay vì lập trình viên sơ cấp.

---

### ⚠️ PHẦN 2: CHỈ RA RỦI RO & BẪY TÂM LÝ BỊ GIẤU KÍN
* **Hiệu ứng Đám đông (Bandwagon Effect):** Bạn có thể đang bị hấp dẫn bởi truyền thông báo chí liên tục giật gân về "lương hàng chục triệu khi mới ra trường", mà bỏ qua tỷ lệ đào thải lên tới 30-40% ở các năm đầu Đại học do ngợp toán rời rạc và thuật toán.
* **Sự đe dọa từ AI & Automation:** Các công cụ AI như ChatGPT, GitHub Copilot đang thay thế trực tiếp các công việc lập trình cơ bản (CRUD, HTML/CSS đơn giản). Nếu chỉ dừng ở mức học vẹt code, bạn sẽ đối mặt với nguy cơ thất nghiệp ngay khi ra trường.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ TỰ SUY NGẪM
1. **Về khả năng chịu đựng áp lực:** *Bạn có sẵn sàng dành 8-10 tiếng mỗi ngày ngồi trước màn hình máy tính để tự mò mẫm sửa lỗi code mà không bỏ cuộc khi không có ai hướng dẫn không?*
2. **Về kế hoạch hành động thực tế:** *Ngoài lý do "thu nhập cao", bạn đã từng tự tay viết một đoạn mã nhỏ hay cài đặt một phần mềm phức tạp để kiểm chứng mức độ thích thú thực sự của mình chưa?*`
  }

  // 2. Phản biện nhóm ngành Y Dược / Bác sĩ / Dược sĩ
  if (text.includes('y') || text.includes('bác sĩ') || text.includes('y dược') || text.includes('dược')) {
    return `### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Ngành Y Dược đòi hỏi thời gian đào tạo kéo dài (6 năm đại học + 18 tháng thực hành chứng chỉ hành nghề + 2-3 năm chuyên khoa 1/thạc sĩ), chi phí học tập cao và cường độ trực đêm dày đặc. Đây là ngành yêu cầu trách nhiệm đạo đức tối cao vì mọi sai sót đều ảnh hưởng trực tiếp đến tính mạng con người.

---

### ⚠️ PHẦN 2: CHỈ RA RỦI RO & BẪY TÂM LÝ BỊ GIẤU KÍN
* **Bẫy Chi Phí Chìm (Sunk Cost Fallacy):** Nhiều học sinh thi Y vì áp lực vọng ước gia đình hoặc vì đã lỡ học chuyên Sinh nhiều năm, dẫu biết bản thân sợ máu hoặc không chịu được áp lực trực đêm.
* **Thực tế thu nhập những năm đầu:** Truyền thông thường tôn vinh thu nhập của các Bác sĩ chuyên khoa lâu năm, nhưng phớt lờ thực tế rằng 6-8 năm đầu tiên sau khi ra trường, mức lương Bác sĩ trẻ tại các bệnh viện công thường chỉ ở mức cơ bản, trong khi khối lượng công việc cực kỳ áp lực.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ TỰ SUY NGẪM
1. **Về khả năng hy sinh cá nhân:** *Bạn có chấp nhận việc bạn bè đồng lứa các ngành khác đã ổn định tài chính và đi du lịch, trong khi bạn vẫn phải thức đêm học bài và đi trực bệnh viện ở tuổi 25-27 không?*
2. **Về tâm lý bền bỉ:** *Động lực lớn nhất giúp bạn vượt qua những đêm trực 24 giờ liên tục là gì — sự công nhận của xã hội hay mong muốn chữa bệnh thực sự?*`
  }

  // 3. Phản biện chọn ngành theo Đám đông / Xu hướng
  if (text.includes('đám đông') || text.includes('xu hướng') || text.includes('số đông') || text.includes('nhiều người')) {
    return `### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Một ngành học "hot" ở thời điểm hiện tại chưa chắc sẽ còn "hot" sau 4-5 năm nữa khi bạn ra trường. Khi hàng ngàn sinh viên cùng ồ ạt đổ xô vào một ngành, thị trường lao động sẽ nhanh chóng chạm ngưỡng bão hòa, dẫn đến cuộc cạnh tranh khốc liệt và giảm giá trị bằng cấp.

---

### ⚠️ PHẦN 2: CHỈ RA RỦI RO & BẪY TÂM LÝ BỊ GIẤU KÍN
* **Thiên lệch Xác nhận (Confirmation Bias):** Bạn có xu hướng chỉ đọc các bài viết khen ngợi ngành này và cố tình phớt lờ các thông báo tuyển dụng đang thắt chặt hoặc bài đăng than thở thất nghiệp của các anh chị đi trước.
* **Đánh tráo khái niệm giữa "Ngành Hot" và "Bản thân Phù hợp":** Sự thành công trong sự nghiệp phụ thuộc 80% vào mức độ giỏi chuyên môn và sự phù hợp cá nhân, chứ không phụ thuộc vào tên ngành có "kêu" hay không.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ TỰ SUY NGẪM
1. **Về tư duy độc lập:** *Nếu ngành này hoàn toàn không còn được báo chí nhắc tới và bạn bè xung quanh không ai đăng ký nữa, bạn có còn muốn học nó không?*
2. **Về năng lực cạnh tranh:** *Trong 1.000 sinh viên cùng tốt nghiệp ngành này với bạn, bạn sẽ dựa vào điểm mạnh đặc biệt nào của bản thân để vượt lên top 10% nhận việc làm tốt?*`
  }

  // 4. Phản biện bẫy Kỳ vọng Lương cao
  if (text.includes('lương') || text.includes('thu nhập') || text.includes('lương cao') || text.includes('tiền')) {
    return `### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Mức lương niêm yết trên các bài báo tuyển dụng thường là con số dành cho Nhân sự xuất sắc (Top 5-10%) có từ 3-5 năm kinh nghiệm thực chiến. Đối với sinh viên mới tốt nghiệp, mức lương khởi điểm phụ thuộc hoàn toàn vào giá trị thực tế bạn đóng góp được cho doanh nghiệp, chứ không phụ thuộc vào bảng tên ngành.

---

### ⚠️ PHẦN 2: CHỈ RA RỦI RO & BẪY TÂM LÝ BỊ GIẤU KÍN
* **Bẫy Kỳ Vọng Phóng Đại (Optimism Bias):** Rất nhiều bạn trẻ lầm tưởng "học ngành X ra chắc chắn lương 20-30 triệu", nhưng không biết rằng để đạt con số đó cần đánh đổi bằng áp lực doanh số (KPI), thời gian làm việc 12 tiếng/ngày và nguy cơ cháy sạch năng lượng (Burnout).
* **Bỏ qua chi phí cơ hội & sự ổn định:** Ngành lương cao thường đi kèm rủi ro đào thải cao và tốc độ lạc hậu kiến thức cực nhanh.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ TỰ SUY NGẪM
1. **Về giá trị lao động:** *Nếu trong 2 năm đầu ra trường mức lương chỉ đủ trang trải cuộc sống cơ bản (7-9 triệu/tháng), bạn có đủ kiên nhẫn để tiếp tục tích lũy năng lực không?*
2. **Về bản chất công việc:** *Bạn chọn ngành này vì công việc hằng ngày của nó làm bạn hứng thú, hay chỉ vì con số thu nhập mà người khác hứa hẹn?*`
  }

  // 5. Phản biện Bẫy Chi phí chìm (Sunk Cost)
  if (text.includes('chi phí chìm') || text.includes('sunk cost') || text.includes('học chuyên') || text.includes('lỡ')) {
    return `### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Chi phí chìm (Sunk Cost) là những thời gian, tiền bạc, công sức bạn đã bỏ ra trong quá khứ và KHÔNG THỂ LẤY LẠI ĐƯỢC. Tiếp tục đầu tư 4 năm Đại học vào một ngành không phù hợp chỉ vì "lỡ học khối này từ cấp 3" sẽ khiến bạn tốn thêm 4 năm tuổi trẻ và hàng trăm triệu đồng phí tổn tương lai.

---

### ⚠️ PHẦN 2: CHỈ RA RỦI RO & BẪY TÂM LÝ BỊ GIẤU KÍN
* **Bẫy Ngụy Biện Tiếc Nuối:** Tư duy "đã lỡ theo thì phải theo tới cùng" là nguyên nhân chính khiến hơn 60% sinh viên ra trường làm trái ngành hoặc rơi vào trạng thái bế tắc công việc.
* **Sự nhầm lẫn giữa Kỹ năng đã học và Đam mê tương lai:** Việc bạn học giỏi một môn ở phổ thông (VD: giỏi Tiếng Anh) chỉ là công cụ hỗ trợ, không đồng nghĩa với việc bạn bắt buộc phải trở thành Giáo viên hay Biên dịch viên nếu không thực sự muốn.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ TỰ SUY NGẪM
1. **Về dũng khí thay đổi:** *Nếu gạt bỏ toàn bộ sự kỳ vọng của bố mẹ và công sức ôn thi khối ngành cũ, ngành học thực sự làm bạn tò mò muốn khám phá nhất là gì?*
2. **Về bài toán tương lai:** *Bạn thà chấp nhận "lãng phí" 1-2 năm cấp 3 để chọn đúng đường, hay thà chấp nhận lãng phí 40 năm làm công việc mình chán ghét?*`
  }

  // 6. Phản biện chung mặc định cho mọi ngành khác
  return `### 📌 PHẦN 1: TÓM TẮT THỰC TẾ KHÁCH QUAN (KHÔNG TÔ HỒNG)
Để đánh giá chính xác ngành học này, bạn cần tách rời bức tranh quảng cáo của các trường đại học với môi trường làm việc thực tế tại doanh nghiệp. Mọi ngành nghề hiện đại đều đòi hỏi sự kết hợp giữa Kiến thức chuyên môn + Kỹ năng mềm (giao tiếp, làm việc nhóm) + Khả năng thích ứng với công nghệ.

---

### ⚠️ PHẦN 2: CHỈ RA RỦI RO & BẪY TÂM LÝ BỊ GIẤU KÍN
* **Bẫy Thiên Lệch Xác Nhận (Confirmation Bias):** Hãy cẩn trọng xem bạn có đang chỉ đi tìm kiếm những thông tin ủng hộ lựa chọn của mình mà cố tình ngó lơ các cảnh báo rủi ro về tỷ lệ cạnh tranh và áp lực nghề nghiệp hay không.
* **Áp lực thích nghi dài hạn:** Không có ngành học nào cho bạn một sự đảm bảo trọn đời. Giá trị của bạn nằm ở năng lực giải quyết vấn đề chứ không chỉ ở tấm bằng cử nhân.

---

### 💡 PHẦN 3: 2 CÂU HỎI PHẢN TƯ TỰ SUY NGẪM
1. **Về minh chứng thực tế:** *Bạn đã tìm hiểu kỹ mô tả công việc (Job Description) thực tế của ngành này trên các trang tuyển dụng để biết người đi làm hằng ngày làm gì chưa?*
2. **Về phương án dự phòng:** *Nếu nguyện vọng 1 ngành này không đạt điểm chuẩn, bạn đã chuẩn bị phương án dự phòng NGUYỆN VỌNG 2 nào thực sự phù hợp với năng lực của mình chưa?*`
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
