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

// 4 NÃºt gá»£i Ã½ CÃº hÃ­ch Pháº£n tÆ° (Quick Nudge Prompts)
const QUICK_NUDGES = [
  {
    id: 'nudge-1',
    icon: Search,
    color: 'hover:border-amber-400 hover:bg-amber-50/70 text-amber-900',
    iconColor: 'text-amber-600',
    prompt: 'ðŸ” PhÃ¢n tÃ­ch máº·t tá»‘i & rá»§i ro thá»±c táº¿ cá»§a ngÃ nh ',
    isNeedInput: true
  },
  {
    id: 'nudge-2',
    icon: Scale,
    color: 'hover:border-indigo-400 hover:bg-indigo-50/70 text-indigo-900',
    iconColor: 'text-indigo-600',
    prompt: 'âš–ï¸ TÃ´i Ä‘ang chá»n ngÃ nh theo xu hÆ°á»›ng sá»‘ Ä‘Ã´ng, hÃ£y pháº£n biá»‡n giÃºp tÃ´i',
    isNeedInput: false
  },
  {
    id: 'nudge-3',
    icon: BarChart3,
    color: 'hover:border-emerald-400 hover:bg-emerald-50/70 text-emerald-900',
    iconColor: 'text-emerald-600',
    prompt: 'ðŸ“Š TÃ¬m 3 luáº­n Ä‘iá»ƒm Ä‘á»‘i láº­p vá»›i ká»³ vá»ng lÆ°Æ¡ng cao cá»§a ngÃ nh nÃ y',
    isNeedInput: false
  },
  {
    id: 'nudge-4',
    icon: Puzzle,
    color: 'hover:border-rose-400 hover:bg-rose-50/70 text-rose-900',
    iconColor: 'text-rose-600',
    prompt: 'ðŸ§© Soi chiáº¿u xem tÃ´i cÃ³ Ä‘ang máº¯c ThiÃªn lá»‡ch chi phÃ­ chÃ¬m khÃ´ng?',
    isNeedInput: false
  }
]

const INITIAL_MESSAGE = {
  id: 'welcome-msg',
  sender: 'ai',
  text: 'ChÃ o báº¡n! MÃ¬nh lÃ  AI Tham váº¥n Pháº£n tÆ° ðŸŽ¯ â€” mÃ¬nh sáº½ khÃ´ng chá»n nghá» giÃºp báº¡n Ä‘Ã¢u, mÃ  sáº½ Ä‘áº·t cÃ¢u há»i Ä‘á»ƒ báº¡n tá»± nhÃ¬n rÃµ hÆ¡n vá» lá»±a chá»n cá»§a mÃ¬nh. Báº¡n Ä‘ang cÃ¢n nháº¯c ngÃ nh nghá» nÃ o váº­y?',
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

  // Gá»i API backend (Vercel Serverless Function gá»i Ä‘áº¿n Gemini API)
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

    // Cáº­p nháº­t tin nháº¯n ngÆ°á»i dÃ¹ng ngay láº­p tá»©c
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    if (!textToSend) setInputPrompt('')
    setIsLoading(true)

    try {
      // Chuáº©n bá»‹ lá»‹ch sá»­ há»™i thoáº¡i gá»­i lÃªn server (bá» tin nháº¯n chÃ o Ä‘áº§u náº¿u chÆ°a cÃ³ lÆ°á»£t user)
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
        throw new Error(data?.error || `Lá»—i káº¿t ná»‘i AI (${response.status})`)
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages([...newMessages, aiMsg])
    } catch (err) {
      console.error('Lá»—i khi tham váº¥n AI:', err)
      setErrorMessage(err.message || 'KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§ AI. Vui lÃ²ng thá»­ láº¡i sau.')
      
      const errorAiMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `âš ï¸ **Ráº¥t tiáº¿c, Ä‘Ã£ cÃ³ sá»± cá»‘ káº¿t ná»‘i:** ${err.message || 'Há»‡ thá»‘ng AI Ä‘ang báº­n'}. Báº¡n vui lÃ²ng thá»­ gá»­i láº¡i cÃ¢u há»i nhÃ©!`,
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
    if (window.confirm('Báº¡n cÃ³ cháº¯c muá»‘n lÃ m má»›i cuá»™c há»™i thoáº¡i nÃ y khÃ´ng?')) {
      setMessages([{
        ...INITIAL_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setErrorMessage(null)
    }
  }

  // Xuáº¥t & Copy toÃ n bá»™ Ä‘oáº¡n há»™i thoáº¡i
  const handleExportChat = () => {
    const studentName = profile?.full_name || user?.email || 'Há»c sinh'
    const now = new Date().toLocaleString('vi-VN')

    let transcriptText = `=================================================================\n`
    transcriptText += `NHáº¬T KÃ THAM Váº¤N PHáº¢N TÆ¯ CÃ™NG AI (DEBIASING CHATBOT)\n`
    transcriptText += `Há»c sinh: ${studentName}\n`
    transcriptText += `Thá»i gian xuáº¥t: ${now}\n`
    transcriptText += `Tá»•ng sá»‘ lÆ°á»£t trao Ä‘á»•i: ${messages.length}\n`
    transcriptText += `Má»¥c Ä‘Ã­ch: NghiÃªn cá»©u giáº£m thiá»ƒu thiÃªn lá»‡ch nháº­n thá»©c & Nháº­t kÃ½ ra quyáº¿t Ä‘á»‹nh\n`
    transcriptText += `=================================================================\n\n`

    messages.forEach((msg) => {
      const senderLabel = msg.sender === 'user' ? `[Há»c sinh - ${studentName}]` : `[AI Tham váº¥n Pháº£n tÆ°]`
      transcriptText += `${senderLabel} (${msg.timestamp}):\n${msg.text}\n\n`
      transcriptText += `-----------------------------------------------------------------\n\n`
    })

    // 1. Sao chÃ©p vÃ o bá»™ nhá»› táº¡m (Clipboard)
    navigator.clipboard.writeText(transcriptText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }).catch(err => {
      console.warn('Lá»—i khi sao chÃ©p clipboard:', err)
    })

    // 2. Táº£i vá» file text
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
      console.warn('KhÃ´ng thá»ƒ tá»± Ä‘á»™ng táº£i file:', e)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 animate-reveal">
      {/* HEADER TIÃŠU Äá»€ TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-md shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <span>ðŸ¤– AI Tham Váº¥n Pháº£n TÆ°</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
              Debiasing Agent
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Trá»£ lÃ½ trÃ­ tuá»‡ nhÃ¢n táº¡o pháº£n biá»‡n báº«y tÆ° duy tÃ¢m lÃ½ & váº¡ch tráº§n rá»§i ro thá»±c táº¿ trong chá»n nghá».
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* NÃšT XUáº¤T / COPY ÄOáº N Há»˜I THOáº I (YÃŠU Cáº¦U 5) */}
          <Button
            variant="outline"
            onClick={handleExportChat}
            className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 text-brand-700 border-brand-300 bg-brand-50/50 hover:bg-brand-100"
            title="LÆ°u láº¡i toÃ n bá»™ cuá»™c trÃ² chuyá»‡n phá»¥c vá»¥ Nháº­t kÃ½ ra quyáº¿t Ä‘á»‹nh"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">ÄÃ£ sao chÃ©p & Táº£i file!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Xuáº¥t / Copy há»™i thoáº¡i</span>
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
            <span>LÃ m má»›i</span>
          </Button>
        </div>
      </div>

      {/* BANNER NGUYÃŠN Táº®C KHOA Há»ŒC */}
      <div className="bg-amber-50/90 border-2 border-amber-300 p-4 rounded-sm shadow-2xs flex items-start gap-3.5 text-amber-950">
        <div className="p-2 bg-amber-200 text-amber-900 rounded-full shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-extrabold text-xs uppercase tracking-wider block text-amber-900 flex items-center gap-1.5">
            <span>ðŸ’¡ NGUYÃŠN Táº®C PHáº¢N TÆ¯ (METACOGNITIVE DEBIASING)</span>
          </span>
          <p className="text-xs leading-relaxed font-medium text-amber-900/90">
            AI nÃ y <strong>KHÃ”NG</strong> chá»n nghá» thay báº¡n. AI sáº½ Ä‘á»“ng hÃ nh Ä‘áº·t cÃ¢u há»i pháº£n biá»‡n Socratic, chá»‰ ra cÃ¡c báº«y tÃ¢m lÃ½ 
            (ThiÃªn lá»‡ch xÃ¡c nháº­n, Hiá»‡u á»©ng Ä‘Ã¡m Ä‘Ã´ng, Chi phÃ­ chÃ¬m...) Ä‘á»ƒ báº¡n tá»± nhÃ¬n nháº­n khÃ¡ch quan vÃ  Ä‘Æ°a ra quyáº¿t Ä‘á»‹nh vá»¯ng cháº¯c.
          </p>
        </div>
      </div>

      {/* KHUNG Ná»˜I DUNG CHATBOT */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col h-[600px]">
        {/* Lá»ŠCH Sá»¬ CHAT (MESSAGE LIST) */}
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

              {/* Bong bÃ³ng tin nháº¯n */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-sm p-4 text-xs leading-relaxed shadow-2xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Format ná»™i dung tin nháº¯n */}
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

          {/* Äang pháº£n há»“i Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-sm rounded-tl-none text-xs text-slate-600 font-semibold flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>AI Pháº£n tÆ° Ä‘ang suy nghÄ© cÃ¢u há»i pháº£n biá»‡n...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bá»˜ NÃšT Gá»¢I Ã CÃš HÃCH PHáº¢N TÆ¯ (QUICK NUDGE PROMPTS) */}
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Gá»¢I Ã CÃš HÃCH PHáº¢N TÆ¯ (Báº¤M Äá»‚ Há»ŽI NHANH)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Há»— trá»£ nháº­n diá»‡n thiÃªn lá»‡ch</span>
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

        {/* Ã” NHáº¬P Ná»˜I DUNG & Gá»¬I FORM */}
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
            placeholder="Nháº­p suy nghÄ© hoáº·c ngÃ nh há»c báº¡n Ä‘ang cÃ¢n nháº¯c (VD: Em muá»‘n há»c CNTT vÃ¬ tháº¥y báº¡n bÃ¨ báº£o kiáº¿m nhiá»u tiá»n...)"
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
            <span>Gá»¬I</span>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default DebiasAgent