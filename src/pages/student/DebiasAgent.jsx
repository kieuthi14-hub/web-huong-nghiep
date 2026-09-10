import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  Search, 
  Scale, 
  BarChart3, 
  Puzzle, 
  Copy, 
  Check, 
  Download, 
  Brain, 
  Flame,
  AlertCircle
} from 'lucide-react'

// 4 Nút gợi ý Cú hích Phản tư (Quick Nudge Prompts)
const QUICK_NUDGES = [
  {
    id: 'nudge-1',
    icon: Search,
    color: 'hover:border-amber-400 hover:bg-amber-50/70 text-amber-900',
    iconColor: 'text-amber-600',
    prompt: '🔍 Phân tích mặt tối & rủi ro thực tế của ngành ',
    isNeedInput: true
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

const INITIAL_MESSAGE = {
  id: 'welcome-msg',
  sender: 'ai',
  text: 'Chào bạn! AI Phản tư sẽ không chọn nghề giúp bạn, mà sẽ đặt câu hỏi phản biện để bạn tự nhìn rõ hơn về lựa chọn của mình. Bạn đang cân nhắc ngành nghề nào vậy?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const DebiasAgent = () => {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Gọi API backend (Vercel Serverless Function gọi đến Gemini API)
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputPrompt).trim()
    if (!query || isLoading) return

    setErrorMessage(null)

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Cập nhật tin nhắn người dùng ngay lập tức
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    if (!textToSend) setInputPrompt('')
    setIsLoading(true)

    try {
      // Chuẩn bị lịch sử hội thoại gửi lên server (bỏ tin nhắn chào đầu nếu chưa có lượt user)
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-msg')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || `Lỗi kết nối AI (${response.status})`)
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages([...newMessages, aiMsg])
    } catch (err) {
      console.error('Lỗi khi tham vấn AI:', err)
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ AI. Vui lòng thử lại sau.')
      
      const errorAiMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Rất tiếc, đã có sự cố kết nối:** ${err.message || 'Hệ thống AI đang bận'}. Bạn vui lòng thử gửi lại câu hỏi nhé!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }
      setMessages([...newMessages, errorAiMsg])
    } finally {
      setIsLoading(false)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleQuickNudgeClick = (nudge) => {
    if (nudge.isNeedInput) {
      setInputPrompt(nudge.prompt)
      if (inputRef.current) inputRef.current.focus()
    } else {
      handleSendMessage(nudge.prompt)
    }
  }

  const handleResetChat = () => {
    if (window.confirm('Bạn có chắc muốn làm mới cuộc hội thoại này không?')) {
      setMessages([{
        ...INITIAL_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setErrorMessage(null)
    }
  }

  // Xuất & Copy toàn bộ đoạn hội thoại
  const handleExportChat = () => {
    const studentName = profile?.full_name || user?.email || 'Học sinh'
    const now = new Date().toLocaleString('vi-VN')

    let transcriptText = `=================================================================\n`
    transcriptText += `NHẬT KÝ THAM VẤN PHẢN TƯ CÙNG AI (DEBIASING CHATBOT)\n`
    transcriptText += `Học sinh: ${studentName}\n`
    transcriptText += `Thời gian xuất: ${now}\n`
    transcriptText += `Tổng số lượt trao đổi: ${messages.length}\n`
    transcriptText += `Mục đích: Nghiên cứu giảm thiểu thiên lệch nhận thức & Nhật ký ra quyết định\n`
    transcriptText += `=================================================================\n\n`

    messages.forEach((msg) => {
      const senderLabel = msg.sender === 'user' ? `[Học sinh - ${studentName}]` : `[AI Phản Tư]`
      transcriptText += `${senderLabel} (${msg.timestamp}):\n${msg.text}\n\n`
      transcriptText += `-----------------------------------------------------------------\n\n`
    })

    // 1. Sao chép vào bộ nhớ tạm (Clipboard)
    navigator.clipboard.writeText(transcriptText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }).catch(err => {
      console.warn('Lỗi khi sao chép clipboard:', err)
    })

    // 2. Tải về file text
    try {
      const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `Nhat-ky-phan-tu-AI-${dateStr}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.warn('Không thể tự động tải file:', e)
    }
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
            <span>🤖 AI Tham Vấn Phản Tư</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
              Debiasing Agent
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Trợ lý trí tuệ nhân tạo phản biện bẫy tư duy tâm lý & vạch trần rủi ro thực tế trong chọn nghề.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* NÚT XUẤT / COPY ĐOẠN HỘI THOẠI (YÊU CẦU 5) */}
          <Button
            variant="outline"
            onClick={handleExportChat}
            className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 text-brand-700 border-brand-300 bg-brand-50/50 hover:bg-brand-100"
            title="Lưu lại toàn bộ cuộc trò chuyện phục vụ Nhật ký ra quyết định"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép & Tải file!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Xuất / Copy hội thoại</span>
                <Download className="w-3 h-3 text-slate-400 ml-0.5" />
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleResetChat}
            className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 text-slate-600 border-slate-300 hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* BANNER NGUYÊN TẮC KHOA HỌC */}
      <div className="bg-amber-50/90 border-2 border-amber-300 p-4 rounded-sm shadow-2xs flex items-start gap-3.5 text-amber-950">
        <div className="p-2 bg-amber-200 text-amber-900 rounded-full shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-extrabold text-xs uppercase tracking-wider block text-amber-900 flex items-center gap-1.5">
            <span>💡 NGUYÊN TẮC PHẢN TƯ (METACOGNITIVE DEBIASING)</span>
          </span>
          <p className="text-xs leading-relaxed font-medium text-amber-900/90">
            AI này <strong>KHÔNG</strong> chọn nghề thay bạn. AI sẽ đồng hành đặt câu hỏi phản biện Socratic, chỉ ra các bẫy tâm lý 
            (Thiên lệch xác nhận, Hiệu ứng đám đông, Chi phí chìm...) để bạn tự nhìn nhận khách quan và đưa ra quyết định vững chắc.
          </p>
        </div>
      </div>

      {/* KHUNG NỘI DUNG CHATBOT */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col h-[600px]">
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
                    : msg.isError
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : msg.isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Bong bóng tin nhắn */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-sm p-4 text-xs leading-relaxed shadow-2xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Format nội dung tin nhắn */}
                <div className="whitespace-pre-line font-medium leading-relaxed space-y-2">
                  {msg.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-slate-800">
                      {paragraph}
                    </p>
                  ))}
                </div>

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
              <div className="bg-white border border-slate-200 p-3.5 rounded-sm rounded-tl-none text-xs text-slate-600 font-semibold flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>AI Phản tư đang suy nghĩ câu hỏi phản biện...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BỘ NÚT GỢI Ý CÚ HÍCH PHẢN TƯ (QUICK NUDGE PROMPTS) */}
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>GỢI Ý CÚ HÍCH PHẢN TƯ (BẤM ĐỂ HỎI NHANH)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ nhận diện thiên lệch</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_NUDGES.map((nudge) => {
              const IconComp = nudge.icon
              return (
                <button
                  key={nudge.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickNudgeClick(nudge)}
                  className={`text-left text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-sm transition-all shadow-2xs flex items-center gap-2 ${nudge.color} disabled:opacity-50`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${nudge.iconColor}`} />
                  <span className="truncate">{nudge.prompt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ô NHẬP NỘI DUNG & GỬI FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Nhập suy nghĩ hoặc ngành học bạn đang cân nhắc (VD: Em muốn học CNTT vì thấy bạn bè bảo kiếm nhiều tiền...)"
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
            <span>GỬI</span>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default DebiasAgent
