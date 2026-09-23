import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  AlertCircle,
  CalendarDays,
  ArrowRight,
  ShieldAlert,
  Target,
  FileCheck2,
  Lock
} from 'lucide-react'
import { getCompatibilitySummary, hollandDescriptions } from './HollandTest'

// 4 Nút gợi ý Cú hích Phản tư Socrates (Socratic Funneling Quick Nudges)
const QUICK_NUDGES = [
  {
    id: 'nudge-1',
    icon: Search,
    color: 'hover:border-amber-400 hover:bg-amber-50/70 text-amber-900',
    iconColor: 'text-amber-600',
    prompt: '🔍 Thầy có thể chỉ rõ những điểm mù và áp lực nặng nề nhất của ngành này không?',
    isNeedInput: false
  },
  {
    id: 'nudge-2',
    icon: Scale,
    color: 'hover:border-indigo-400 hover:bg-indigo-50/70 text-indigo-900',
    iconColor: 'text-indigo-600',
    prompt: '⚖️ Em thích ngành này nhưng chưa rõ môn học cốt lõi nào sẽ quyết định khả năng tốt nghiệp?',
    isNeedInput: false
  },
  {
    id: 'nudge-3',
    icon: BarChart3,
    color: 'hover:border-emerald-400 hover:bg-emerald-50/70 text-emerald-900',
    iconColor: 'text-emerald-600',
    prompt: '📊 Nhiều clip nói ra trường lương vài chục triệu, thực tế tỷ lệ làm trái ngành là bao nhiêu?',
    isNeedInput: false
  },
  {
    id: 'nudge-4',
    icon: Puzzle,
    color: 'hover:border-rose-400 hover:bg-rose-50/70 text-rose-900',
    iconColor: 'text-rose-600',
    prompt: '💰 Học phí đại học tự chủ tăng 10-15%/năm, áp lực tài chính 4 năm thực tế sẽ như thế nào?',
    isNeedInput: false
  }
]

const getInitialGreeting = (anc) => {
  const targetCareer = anc?.target_career || anc?.targetMajor;
  const targetUniversity = anc?.target_university || anc?.targetUniversity;
  const sourceOfInfluence = anc?.source_of_influence || anc?.choiceSource || 'Mạng xã hội (TikTok, YouTube)';
  const confidenceScore = anc?.confidence_score || anc?.confidenceScore || '8';

  let hollandCodes = [];
  if (Array.isArray(anc?.holland_codes) && anc?.holland_codes.length > 0) {
    hollandCodes = anc.holland_codes;
  } else if (typeof anc?.holland_code === 'string') {
    hollandCodes = anc.holland_code.replace(/[^RIASEC]/gi, '').split('');
  }
  if (hollandCodes.length === 0) hollandCodes = ['A', 'S', 'E'];

  const hollandMap = {
    R: 'Thực tế / Kỹ thuật (thích máy móc, công cụ, không gian vật lý)',
    I: 'Nghiên cứu (thích tư duy trừu tượng, phân tích số liệu, giải quyết vấn đề phức tạp)',
    A: 'Nghệ thuật (thích sáng tạo tự do, thể hiện cái tôi thẩm mỹ)',
    S: 'Xã hội (thích giúp đỡ, giảng dạy, giao tiếp và kết nối con người)',
    E: 'Quản lý / Doanh nhân (thích lãnh đạo, thuyết phục, cạnh tranh mục tiêu)',
    C: 'Nghiệp vụ / Quy củ (thích ngăn nắp, quy trình rõ ràng, tính toán chính xác)'
  };

  const primaryGroup = hollandMap[hollandCodes[0]] || hollandDescriptions?.[hollandCodes[0]] || hollandCodes[0];
  const secondaryGroup = hollandCodes[1] ? (hollandMap[hollandCodes[1]] || hollandDescriptions?.[hollandCodes[1]] || hollandCodes[1]) : '';

  if (targetCareer && targetCareer !== 'chưa xác định') {
    return `Chào em! Thầy là **Trợ lý AI Tham Vấn Phản Tư Socrates**.

Thầy đã ghi nhận hồ sơ xuất phát điểm của em từ Bước 1:
- **Ngành học mục tiêu ban đầu:** "${targetCareer}"${targetUniversity && targetUniversity !== 'chưa xác định' ? ` tại ${targetUniversity}` : ''}
- **Mức độ tự tin ban đầu:** ${confidenceScore}/10 (Nguồn ảnh hưởng: ${sourceOfInfluence})
- **Kiểu hình tính cách Holland thực tế:** [${hollandCodes.join(', ')}]
  + *Nhóm chủ đạo (${hollandCodes[0]}):* ${primaryGroup}
  ${secondaryGroup ? `+ *Nhóm hỗ trợ (${hollandCodes[1]}):* ${secondaryGroup}` : ''}

${anc?.compatibility_status ? `🔍 **Đánh giá sự tương thích (Analysis):**\n${anc.compatibility_status}\n\n` : ''}Thầy đồng hành ở đây không phải để đánh giá đam mê này đúng hay sai, mà để giúp em soi chiếu lại những góc nhìn thực tế trước khi đưa ra quyết định.

Để bắt đầu, em hãy chia sẻ thẳng thắn: **Nhìn vào đặc tính thiên hướng tính cách thực tế vừa đo được ở trên so với môi trường làm việc thật của ngành "${targetCareer}", điều gì cụ thể về thói quen học tập và trải nghiệm thực tế khiến em tin tưởng ở mức ${confidenceScore}/10 rằng mình thực sự hợp ngành này chứ không phải chọn theo cảm tính hay xu hướng mạng xã hội?**`;
  }

  return `Chào em! Thầy là **Trợ lý AI Tham Vấn Phản Tư Socrates** hướng nghiệp dành cho học sinh THPT.

Thầy ở đây để cùng em đối chiếu đặc tính tính cách Holland thực tế với yêu cầu môi trường nghề nghiệp trước khi đưa ra quyết định.

Em hãy cho Thầy biết: **Ngành học cụ thể và trường đại học em đang mong muốn xét tuyển nhất hiện nay là gì?**`;
};

// 1. Lấy dữ liệu mỏ neo đã lưu từ Bước 1
const getStoredUserAnchor = () => {
  try {
    const raw = localStorage.getItem("userAnchorData") || localStorage.getItem("cbas_anchor_data") || localStorage.getItem("career_initial_anchor");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        const targetCareer = (parsed.target_career || parsed.target_major || "").trim() || "chưa xác định";
        const targetUniversity = (parsed.target_university || "").trim() || "chưa xác định";
        const sourceOfInfluence = (parsed.source_of_influence || parsed.choice_source || "").trim() || "mạng xã hội (TikTok, YouTube)";
        const confidenceScore = String(parsed.confidence_score || parsed.confidence_score_initial || "8");

        let hollandCodes = [];
        if (Array.isArray(parsed.holland_codes) && parsed.holland_codes.length > 0) {
          hollandCodes = parsed.holland_codes;
        } else if (typeof parsed.holland_code === 'string') {
          hollandCodes = parsed.holland_code.replace(/[^RIASEC]/gi, '').split('');
        } else if (typeof parsed.primary_code === 'string') {
          hollandCodes = parsed.primary_code.replace(/[^RIASEC]/gi, '').split('');
        }
        if (hollandCodes.length === 0) hollandCodes = ['A', 'S', 'E'];

        const compatibilityStatus = (parsed.compatibility_status || getCompatibilitySummary(targetCareer, hollandCodes)).trim();

        return {
          target_career: targetCareer,
          target_university: targetUniversity,
          source_of_influence: sourceOfInfluence,
          confidence_score: confidenceScore,
          holland_codes: hollandCodes,
          holland_code: hollandCodes.join(''),
          compatibility_status: compatibilityStatus,
          holland_analysis: parsed.holland_analysis || "",
          targetMajor: targetCareer,
          targetUniversity: targetUniversity,
          choiceSource: sourceOfInfluence,
          confidenceScore: Number(confidenceScore)
        };
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc userAnchorData:", e);
  }
  return {
    target_career: "chưa xác định",
    target_university: "chưa xác định",
    source_of_influence: "mạng xã hội",
    confidence_score: "8",
    holland_codes: ["A", "S", "E"],
    holland_code: "ASE",
    compatibility_status: "Chưa xác định",
    holland_analysis: "",
    targetMajor: "",
    targetUniversity: "",
    choiceSource: "",
    confidenceScore: 8
  };
};

const DebiasAgent = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  // 1. Đọc Mỏ neo nhận thức ban đầu (Initial Anchor) từ Bước 1
  const [anchor, setAnchor] = useState(() => getStoredUserAnchor())

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: getInitialGreeting(anchor),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const [inputPrompt, setInputPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Cập nhật lại tin nhắn chào đầu nếu anchor được load trễ
  useEffect(() => {
    if (!anchor) {
      const parsed = getStoredUserAnchor();
      if (parsed) {
        setAnchor(parsed);
        setMessages([
          {
            id: 'welcome-msg',
            sender: 'ai',
            text: getInitialGreeting(parsed),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }
  }, [])

  // Đếm số lượt tương tác của học sinh (vòng phản tư)
  const userRoundCount = messages.filter(m => m.sender === 'user').length
  const MIN_REQUIRED_ROUNDS = 6
  const TARGET_ROUNDS = 8
  const isReadyForStep3 = userRoundCount >= MIN_REQUIRED_ROUNDS

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Gọi API backend Vercel Serverless kết nối Gemini API (Socratic Funneling)
  const handleSendMessage = async (textToSend, forceAssessment = false) => {
    const query = (textToSend || inputPrompt).trim()
    if (!query || isLoading) return

    setErrorMessage(null)
    const nextRound = userRoundCount + 1

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    if (!textToSend) setInputPrompt('')
    setIsLoading(true)

    try {
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
          history: historyPayload,
          round: nextRound,
          isFinal: forceAssessment || nextRound >= TARGET_ROUNDS,
          anchor: {
            target_career: anchor.target_career || anchor.targetMajor,
            target_university: anchor.target_university || anchor.targetUniversity,
            source_of_influence: anchor.source_of_influence || anchor.choiceSource,
            confidence_score: String(anchor.confidence_score || anchor.confidenceScore || "8"),
            holland_codes: anchor.holland_codes || [],
            holland_code: anchor.holland_code || "",
            compatibility_status: anchor.compatibility_status || "",
            holland_analysis: anchor.holland_analysis || "",
            target_major: anchor.target_career || anchor.targetMajor,
            choice_source: anchor.source_of_influence || anchor.choiceSource,
            confidence_score_initial: Number(anchor.confidence_score || anchor.confidenceScore || 8)
          }
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFinalChallenge: data.isFinal || nextRound >= TARGET_ROUNDS
      }

      setMessages([...newMessages, aiMsg])
    } catch (err) {
      console.error('Lỗi khi tham vấn AI:', err)
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ AI. Vui lòng thử lại sau.')
      
      const errorAiMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Sự cố kết nối AI:** ${err.message || 'Hệ thống AI đang bận'}. Em vui lòng gửi lại câu trả lời nhé!`,
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
    if (window.confirm('Em có chắc muốn làm mới phiên đối thoại Socrates để phản biện một ngành nghề khác?')) {
      setMessages([{
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: getInitialGreeting(anchor),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setErrorMessage(null)
    }
  }

  // Xuất file và copy nhật ký phản tư
  const handleExportChat = () => {
    if (messages.length <= 1) {
      alert('Chưa có nội dung đối thoại để xuất!')
      return
    }

    const studentName = profile?.fullName || user?.email || 'Học sinh THPT'
    const now = new Date().toLocaleString('vi-VN')

    let transcriptText = `=================================================================\n`
    transcriptText += `NHẬT KÝ THAM VẤN PHẢN TƯ SOCRATES (KHOA HỌC HÀNH VI - DEBIASING)\n`
    transcriptText += `Học sinh: ${studentName}\n`
    transcriptText += `Thời gian xuất: ${now}\n`
    transcriptText += `Mỏ neo ban đầu: Ngành ${anchor?.targetMajor || 'Chưa ghi'} - Trường ${anchor?.targetUniversity || 'Chưa ghi'}\n`
    transcriptText += `Độ tự tin ban đầu (Overconfidence): ${anchor?.confidenceScore || 8}/10\n`
    transcriptText += `Tổng số vòng chất vấn: ${userRoundCount} / ${TARGET_ROUNDS}\n`
    transcriptText += `=================================================================\n\n`

    messages.forEach((msg) => {
      const senderLabel = msg.sender === 'user' ? `[Học sinh - ${studentName}]` : `[AI Tham Vấn Phản Tư Socrates]`
      transcriptText += `${senderLabel} (${msg.timestamp}):\n${msg.text}\n\n`
      transcriptText += `-----------------------------------------------------------------\n\n`
    })

    navigator.clipboard.writeText(transcriptText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }).catch(err => console.warn('Lỗi clipboard:', err))

    try {
      const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `Nhat-ky-Socrates-Debiasing-${dateStr}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {}
  }

  const renderFormattedText = (text, isUser) => {
    return text.split('\n\n').map((paragraph, pIdx) => {
      const parts = paragraph.split(/(\*\*.*?\*\*)/g)
      return (
        <p key={pIdx} className={isUser ? "text-white" : "text-slate-800"}>
          {parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={idx} className={isUser ? "font-bold text-white" : "font-bold text-slate-900"}>
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return part
          })}
        </p>
      )
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 animate-reveal">
      {/* HEADER TIÊU ĐỀ BƯỚC 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-md shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <span>2️⃣ AI Tham Vấn Phản Tư Socrates</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
              Socratic Funneling
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kỹ thuật chất vấn phễu Socrates: Phá vỡ bẫy nịnh bợ (Anti-Sycophancy), kích hoạt tư duy phân tích sâu (Hệ thống 2) và bóc tách các điểm mù nghề nghiệp.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportChat}
            className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 text-brand-700 border-brand-300 bg-brand-50/50 hover:bg-brand-100"
            title="Lưu lại nhật ký phản tư"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã lưu & Tải file!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Xuất Nhật ký</span>
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

      {/* BANNER MỎ NEO NHẬN THỨC BAN ĐẦU (INITIAL ANCHOR TỪ BƯỚC 1) */}
      {anchor?.targetMajor ? (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-sm shadow-2xs space-y-2.5 text-amber-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-sm shrink-0 mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-extrabold uppercase tracking-wider text-amber-900 block">
                  🎯 MỎ NEO NHẬN THỨC BAN ĐẦU CỦA BẠN (TỪ BƯỚC 1):
                </span>
                <p className="font-semibold text-amber-950">
                  Ngành nhắm tới: <strong className="text-brand-900">{anchor.targetMajor}</strong>
                  {anchor.targetUniversity && <span> — Trường: <strong>{anchor.targetUniversity}</strong></span>}
                  {' | '}Nguồn tham khảo: <span className="italic">{anchor.choiceSource || 'Mạng xã hội'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-white/90 border border-amber-300 px-3 py-1.5 rounded-sm">
              <span className="text-[11px] font-bold text-slate-600">Độ tự tin ban đầu:</span>
              <span className="text-xs font-black px-2 py-0.5 bg-amber-100 text-amber-900 rounded-sm">
                {anchor.confidenceScore || 8}/10
              </span>
            </div>
          </div>

          {/* DÒNG ĐỐI CHIẾU KIỂU HÌNH TÍNH CÁCH HOLLAND VÀ ĐÁNH GIÁ TƯƠNG THÍCH */}
          {anchor?.holland_codes && anchor.holland_codes.length > 0 && (
            <div className="pt-2 border-t border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-900">Kiểu hình Holland thực tế:</span>
                <div className="flex items-center gap-1">
                  {anchor.holland_codes.map((code, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-amber-200 text-amber-950 font-black rounded-xs text-xs border border-amber-300">
                      {code}
                    </span>
                  ))}
                </div>
                {anchor.compatibility_status && (
                  <span className="text-slate-800 font-medium text-[11px] bg-white/70 px-2 py-0.5 rounded border border-amber-200">
                    {anchor.compatibility_status}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-sm text-xs text-blue-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Chưa xác lập mỏ neo? Em có thể hoàn thành Bước 1 (Holland + Mỏ neo) để nhận chất vấn cá nhân hóa chính xác nhất.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/holland')}
            className="text-[11px] font-bold text-blue-700 hover:underline shrink-0"
          >
            Làm Bước 1 ➔
          </button>
        </div>
      )}

      {/* KHUNG NỘI DUNG CHATBOT SOCRATES */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col h-[650px]">
        {/* THANH TIẾN TRÌNH 6-8 VÒNG ĐỐI THOẠI SOCRATES */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isReadyForStep3 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>Tiến trình phản tư Socrates:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${
                isReadyForStep3 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                Vòng {userRoundCount} / {TARGET_ROUNDS} (Tối thiểu {MIN_REQUIRED_ROUNDS} vòng)
              </span>
            </div>

            <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
              {isReadyForStep3 
                ? '✅ Đã hoàn thành các vòng chất vấn! Em có thể bấm nút bên phải để sang Bước 3.' 
                : `(Cần thêm ${MIN_REQUIRED_ROUNDS - userRoundCount} vòng trao đổi thực chất để mở khóa Bước 3)`}
            </span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {/* Nút Chuyển sang Bước 3 (Chặn nếu chưa đủ số vòng) */}
            {isReadyForStep3 ? (
              <button
                type="button"
                onClick={() => navigate('/student/fact-check')}
                className="text-xs font-bold py-1.5 px-3 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer animate-pulse"
                title="Chuyển sang Bước 3: Đối chứng Dữ liệu Khách quan"
              >
                <span>Sang Bước 3: Đối chứng Dữ liệu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div 
                className="text-[11px] font-bold py-1.5 px-2.5 rounded-sm bg-slate-200 text-slate-500 flex items-center gap-1.5 cursor-not-allowed"
                title={`Em cần trao đổi thêm ${MIN_REQUIRED_ROUNDS - userRoundCount} lượt để bẻ gãy các thiên lệch nhận thức trước khi sang Bước 3`}
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Bước 3 (Khóa: Cần {MIN_REQUIRED_ROUNDS - userRoundCount} vòng)</span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-24 sm:w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isReadyForStep3 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min((userRoundCount / TARGET_ROUNDS) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* LỊCH SỬ CHAT (MESSAGE LIST) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white'
                    : msg.isError
                    ? 'bg-rose-500 text-white'
                    : msg.isFinalChallenge
                    ? 'bg-purple-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : msg.isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : msg.isFinalChallenge ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-sm p-4 text-xs leading-relaxed shadow-2xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                    : msg.isFinalChallenge
                    ? 'bg-purple-50/90 border-2 border-purple-300 text-slate-900 rounded-tl-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.isFinalChallenge && (
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>🏛️ THÁCH THỨC VÒNG CHỐT - TỰ TAY TÌM KIẾM BẰNG CHỨNG SỐ LIỆU</span>
                  </div>
                )}

                <div className="whitespace-pre-line font-medium leading-relaxed space-y-2">
                  {renderFormattedText(msg.text, msg.sender === 'user')}
                </div>

                {msg.isFinalChallenge && (
                  <div className="pt-3 border-t border-purple-200 mt-3">
                    <button
                      type="button"
                      onClick={() => navigate('/student/fact-check')}
                      className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-sm font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4 text-purple-200" />
                      <span>📊 BƯỚC 3: Mở Cổng Dữ liệu Khách quan & Nhập 3 Bằng chứng Thực tế ➔</span>
                    </button>
                  </div>
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

          {/* Banner kích hoạt chuyển sang Bước 3 khi đủ điều kiện */}
          {isReadyForStep3 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-sm text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-200 text-emerald-900 rounded-full shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900 text-sm">
                    🎉 Đã hoàn thành các vòng phản tư chất vấn Socrates!
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Bây giờ, em hãy chuyển từ suy nghĩ cảm tính sang phân tích số liệu thực tế bằng cách tra cứu Đề án tuyển sinh, học phí 4 năm và tỷ lệ việc làm ở Bước 3.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => navigate('/student/fact-check')}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Sang Bước 3: Đối chứng Dữ liệu</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Đang phản hồi Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-sm rounded-tl-none text-xs text-slate-600 font-semibold flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>AI Socrates đang phân tích lỗ hổng nhận thức và chuẩn bị câu hỏi chất vấn tiếp theo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BỘ NÚT GỢI Ý CÚ HÍCH PHẢN TƯ SOCRATES */}
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>GỢI Ý CÂU HỎI PHẢN TƯ (BẤM ĐỂ HỎI NHANH)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Vòng {userRoundCount}/{TARGET_ROUNDS}</span>
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
            placeholder="Nhập câu trả lời phản biện của em với Thầy Socrates (VD: Điểm Toán của em là 8.2, em đã thử học code Python...)"
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
