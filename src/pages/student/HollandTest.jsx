import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import HollandChart from '../../components/common/HollandChart'
import { 
  ClipboardList, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Award, 
  GraduationCap, 
  Lightbulb,
  Sparkles,
  Anchor,
  HelpCircle,
  TrendingUp,
  Brain,
  ShieldCheck
} from 'lucide-react'

// BỘ 30 CÂU HỎI RIASEC CHUẨN KHOA HỌC HÀNH VI (5 CÂU / NHÓM)
export const DEFAULT_HOLLAND_QUESTIONS = [
  // Realistic (R) - Kỹ thuật
  { id: 1, category: 'R', text: 'Thích lắp ráp, sửa chữa hoặc tháo rời các thiết bị điện tử, đồ gia dụng trong nhà.' },
  { id: 2, category: 'R', text: 'Thích các hoạt động thể chất ngoài trời hoặc làm việc với công cụ, máy móc cơ khí.' },
  { id: 3, category: 'R', text: 'Thích tự tay chế tạo hoặc đóng một món đồ gỗ, mô hình lắp ghép thủ công.' },
  { id: 4, category: 'R', text: 'Thích làm việc thực tế với cây cối, động vật hoặc môi trường tự nhiên.' },
  { id: 5, category: 'R', text: 'Thích vận hành, điều khiển các thiết bị kỹ thuật đòi hỏi sự khéo léo của đôi tay.' },

  // Investigative (I) - Nghiên cứu
  { id: 6, category: 'I', text: 'Thích tìm hiểu nguyên lý khoa học đằng sau các hiện tượng tự nhiên và công nghệ mới.' },
  { id: 7, category: 'I', text: 'Thích giải quyết các bài toán hóc búa, câu đố logic hoặc thử thách phân tích phức tạp.' },
  { id: 8, category: 'I', text: 'Thích đọc tài liệu khoa học, sách chuyên ngành hoặc xem các video giải thích chuyên sâu.' },
  { id: 9, category: 'I', text: 'Thích quan sát, thu thập số liệu và rút ra kết luận dựa trên bằng chứng xác thực.' },
  { id: 10, category: 'I', text: 'Thích làm các thí nghiệm hóa học, vật lý hoặc phân tích dữ liệu trên máy tính.' },

  // Artistic (A) - Nghệ thuật
  { id: 11, category: 'A', text: 'Thích sáng tạo nội dung, viết lách, làm thơ hoặc chia sẻ câu chuyện giàu cảm xúc.' },
  { id: 12, category: 'A', text: 'Thích vẽ tranh, thiết kế đồ họa, chụp ảnh nghệ thuật hoặc quay dựng video.' },
  { id: 13, category: 'A', text: 'Thích chơi nhạc cụ, ca hát hoặc tham gia các hoạt động biểu diễn nghệ thuật.' },
  { id: 14, category: 'A', text: 'Thích tự do thể hiện phong cách cá nhân, không muốn bị gò bó vào quy tắc rập khuôn.' },
  { id: 15, category: 'A', text: 'Thích trang trí không gian sống, thiết kế thời trang hoặc phối màu thẩm mỹ.' },

  // Social (S) - Xã hội
  { id: 16, category: 'S', text: 'Thích giảng giải, hướng dẫn hoặc kèm cặp người khác khi họ gặp khó khăn trong học tập.' },
  { id: 17, category: 'S', text: 'Thích lắng nghe, thấu cảm và giúp bạn bè giải tỏa những áp lực tâm lý.' },
  { id: 18, category: 'S', text: 'Thích tham gia các hoạt động thiện nguyện, phong trào thanh niên vì cộng đồng.' },
  { id: 19, category: 'S', text: 'Thích làm việc trong tập thể nơi mọi người hợp tác thân thiện và hỗ trợ lẫn nhau.' },
  { id: 20, category: 'S', text: 'Thích chăm sóc sức khỏe, hỗ trợ người yếu thế hoặc dạy dỗ các em nhỏ.' },

  // Enterprising (E) - Quản lý
  { id: 21, category: 'E', text: 'Thích thuyết phục người khác đồng tình với quan điểm hoặc dự án của mình.' },
  { id: 22, category: 'E', text: 'Thích làm nhóm trưởng, đứng ra tổ chức sự kiện hoặc dẫn dắt tập thể.' },
  { id: 23, category: 'E', text: 'Thích kinh doanh, mua bán, đàm phán hoặc thử nghiệm các ý tưởng kiếm thêm thu nhập.' },
  { id: 24, category: 'E', text: 'Thích đặt ra mục tiêu tham vọng và dám chấp nhận thử thách để đạt thành công lớn.' },
  { id: 25, category: 'E', text: 'Thích thuyết trình trước đám đông, truyền cảm hứng và tạo ảnh hưởng tích cực.' },

  // Conventional (C) - Nghiệp vụ
  { id: 26, category: 'C', text: 'Thích sắp xếp tài liệu, tập tin, góc học tập ngăn nắp và có hệ thống khoa học.' },
  { id: 27, category: 'C', text: 'Thích làm việc với bảng tính Excel, hóa đơn, số liệu rõ ràng và tính toán chính xác.' },
  { id: 28, category: 'C', text: 'Thích tuân thủ đúng các quy trình, thời hạn (deadline) và hướng dẫn chi tiết.' },
  { id: 29, category: 'C', text: 'Thích rà soát kỹ lưỡng các chi tiết để tránh xảy ra sai sót trong văn bản, bài làm.' },
  { id: 30, category: 'C', text: 'Thích công việc có kế hoạch làm việc cố định, rõ ràng và ổn định lâu dài.' }
]

const HollandTest = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState(DEFAULT_HOLLAND_QUESTIONS)
  const [answers, setAnswers] = useState({})
  const [currentPage, setCurrentPage] = useState(0) // 0 to 5 for questions, 6 for Anchor form
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  // Trạng thái Form Mỏ Neo Nhận thức (Initial Anchor)
  const [targetMajor, setTargetMajor] = useState('')
  const [targetUniversity, setTargetUniversity] = useState('')
  const [choiceSource, setChoiceSource] = useState('TikTok')
  const [customChoiceSource, setCustomChoiceSource] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(8) // 1-10
  
  // Trạng thái kết quả sau khi nộp
  const [result, setResult] = useState(null)
  const [recommendedMajors, setRecommendedMajors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questionsPerPage = 5
  const totalQuestionPages = Math.ceil(questions.length / questionsPerPage) // 6 pages for 30 questions
  const totalStages = totalQuestionPages + 1 // Page 0-5: Questions, Page 6: Anchor Form

  useEffect(() => {
    fetchTestAndInitialAnchor()
  }, [user])

  const fetchTestAndInitialAnchor = async () => {
    setIsLoading(true)
    try {
      // 1. Tải câu hỏi từ Supabase (nếu có), nếu không dùng mặc định 30 câu
      const { data, error } = await supabase
        .from('career_tests')
        .select('*')
        .eq('type', 'holland')
        .maybeSingle()

      let qList = DEFAULT_HOLLAND_QUESTIONS
      if (!error && data && Array.isArray(data.questions_json) && data.questions_json.length >= 10) {
        qList = data.questions_json
      }
      setQuestions(qList)

      const initialAnswers = {}
      qList.forEach(q => { initialAnswers[q.id] = null })
      setAnswers(initialAnswers)

      // 2. Tải mỏ neo đã lưu từ trước (nếu có)
      const cachedAnchor = localStorage.getItem('career_initial_anchor')
      if (cachedAnchor) {
        try {
          const parsed = JSON.parse(cachedAnchor)
          if (parsed.target_major) setTargetMajor(parsed.target_major)
          if (parsed.target_university) setTargetUniversity(parsed.target_university)
          if (parsed.choice_source) setChoiceSource(parsed.choice_source)
          if (parsed.confidence_score_initial) setConfidenceScore(Number(parsed.confidence_score_initial))
        } catch (e) {
          console.warn('Lỗi đọc mỏ neo từ localStorage:', e)
        }
      }
    } catch (err) {
      console.warn('Sử dụng bộ 30 câu hỏi Holland mặc định:', err)
      setQuestions(DEFAULT_HOLLAND_QUESTIONS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const isAnchorPage = currentPage === totalQuestionPages

  const pageQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  )

  const handleNext = () => {
    if (!isAnchorPage) {
      const unanswered = pageQuestions.some(q => answers[q.id] === null)
      if (unanswered) {
        setToast({ type: 'warning', message: 'Vui lòng chọn câu trả lời cho cả 5 câu hỏi ở trang này nhé!' })
        return
      }
    }

    if (currentPage < totalStages - 1) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Đặt đoạn code này vào hàm xử lý khi bấm nút "Hoàn thành Bước 1"
  const saveStep1DataAndNext = (customRedirectUrl = '/student/debias-agent') => {
    const finalChoiceSource = choiceSource === 'Khác' && customChoiceSource.trim() 
      ? customChoiceSource.trim() 
      : choiceSource;

    const userAnchorData = {
      // Lấy giá trị từ các ô input học sinh vừa nhập:
      target_career: document.getElementById("targetCareerInput")?.value || targetMajor.trim() || "Truyền thông đa phương tiện",
      target_university: document.getElementById("targetUniversityInput")?.value || targetUniversity.trim() || "Đại học Khoa học Xã hội và Nhân văn",
      source_of_influence: document.getElementById("influenceSourceInput")?.value || finalChoiceSource || "Mạng xã hội (TikTok, YouTube)",
      confidence_score: document.getElementById("confidenceScoreInput")?.value || String(confidenceScore) || "8",
      holland_code: document.getElementById("hollandResultText")?.value || result?.primaryCode || "Nghệ thuật (A) - Xã hội (S)"
    };

    // Lưu tạm vào bộ nhớ trình duyệt để Bước 2 lấy dùng (đồng bộ cả 2 key)
    localStorage.setItem("userAnchorData", JSON.stringify(userAnchorData));
    localStorage.setItem("cbas_anchor_data", JSON.stringify(userAnchorData));
    localStorage.setItem("career_initial_anchor", JSON.stringify({
      target_major: userAnchorData.target_career,
      target_university: userAnchorData.target_university,
      choice_source: userAnchorData.source_of_influence,
      confidence_score_initial: Number(userAnchorData.confidence_score),
      holland_code: userAnchorData.holland_code,
      primary_code: userAnchorData.holland_code
    }));

    // Chuyển hướng sang trang Bước 2 (AI Tham vấn phản tư)
    if (customRedirectUrl.startsWith('http')) {
      window.location.href = customRedirectUrl;
    } else {
      navigate(customRedirectUrl);
    }
  };

  // Nộp bài và lưu Mỏ Neo + Kết quả RIASEC
  const handleSubmit = async () => {
    // 1. Kiểm tra toàn bộ câu hỏi đã làm
    const unansweredIds = Object.keys(answers).filter(id => answers[id] === null)
    if (unansweredIds.length > 0) {
      setToast({ type: 'warning', message: 'Bạn chưa hoàn thành đầy đủ 30 câu hỏi trắc nghiệm!' })
      setCurrentPage(0)
      return
    }

    // 2. Kiểm tra Form Mỏ Neo
    if (!targetMajor.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập ngành học cụ thể mà em đang nhắm tới nhất!' })
      return
    }

    const finalChoiceSource = choiceSource === 'Khác' && customChoiceSource.trim() 
      ? customChoiceSource.trim() 
      : choiceSource

    setIsSubmitting(true)
    try {
      // 1. Tính toán điểm RIASEC
      const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
      questions.forEach(q => {
        const val = answers[q.id]
        if (val === 4) scores[q.category] = (scores[q.category] || 0) + 3
        else if (val === 3) scores[q.category] = (scores[q.category] || 0) + 2
        else if (val === 2) scores[q.category] = (scores[q.category] || 0) + 1
      })

      // 2. Tìm mã Holland (3 nhóm điểm cao nhất)
      const sortedCategories = Object.keys(scores)
        .map(key => ({ category: key, score: scores[key] }))
        .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))

      const primaryCode = sortedCategories.slice(0, 3).map(item => item.category).join('')

      // 3. Đóng gói đối tượng mỏ neo
      const anchorData = {
        target_major: targetMajor.trim(),
        target_university: targetUniversity.trim() || 'Chưa xác định',
        choice_source: finalChoiceSource,
        confidence_score_initial: Number(confidenceScore),
        primary_code: primaryCode,
        scores,
        timestamp: new Date().toISOString()
      }

      // 4. Lưu vào localStorage cả 2 key (userAnchorData và career_initial_anchor)
      const userAnchorData = {
        target_career: anchorData.target_major,
        target_university: anchorData.target_university,
        source_of_influence: anchorData.choice_source,
        confidence_score: String(anchorData.confidence_score_initial),
        holland_code: primaryCode
      };
      localStorage.setItem("userAnchorData", JSON.stringify(userAnchorData));
      localStorage.setItem('career_initial_anchor', JSON.stringify(anchorData))

      // 5. Lưu vào CSDL Supabase (nếu có kết nối)
      try {
        if (user) {
          await supabase.from('test_results').insert({
            student_id: user.id,
            scores_json: scores,
            primary_code: primaryCode,
            recommended_majors_json: [anchorData.target_major]
          })
        }
      } catch (dbErr) {
        console.warn('Lưu CSDL Supabase (sẽ dùng bộ nhớ offline):', dbErr)
      }

      setResult({
        scores,
        primaryCode,
        anchorData
      })
      setToast({ type: 'success', message: '🎉 Đã xác lập Mỏ neo & Hoàn thành trắc nghiệm Holland thành công!' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Lỗi nộp bài trắc nghiệm:', error)
      setToast({ type: 'error', message: 'Có lỗi xảy ra khi tính kết quả. Vui lòng thử lại!' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setCurrentPage(0)
    fetchTestAndInitialAnchor()
  }

  const answeredCount = Object.values(answers).filter(val => val !== null).length
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100)

  const getHollandDescription = (code) => {
    const descriptions = {
      R: 'Kỹ thuật (Realistic): Khéo tay, thích làm việc thực tế với máy móc, công cụ, vật liệu hoặc môi trường tự nhiên.',
      I: 'Nghiên cứu (Investigative): Tư duy logic, thích quan sát, phân tích số liệu và giải quyết bài toán phức tạp.',
      A: 'Nghệ thuật (Artistic): Sáng tạo, độc lập, nhạy cảm thẩm mỹ, thích tự do thể hiện bản thân.',
      S: 'Xã hội (Social): Thích giao tiếp, lắng nghe, chăm sóc, chia sẻ và giúp đỡ mọi người phát triển.',
      E: 'Quản lý (Enterprising): Năng động, thích đàm phán, thuyết phục, lãnh đạo và hướng đến kết quả cụ thể.',
      C: 'Nghiệp vụ (Conventional): Cẩn thận, chi tiết, thích làm việc có quy trình, sắp xếp hệ thống số liệu rõ ràng.'
    }
    return code.split('').map(c => descriptions[c] || c)
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-64 rounded-sm"></div>
        <div className="h-4 bg-slate-200 w-full rounded-sm"></div>
        <div className="space-y-4 pt-6">
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
        </div>
      </div>
    )
  }

  // GIAO DIỆN KẾT QUẢ VÀ CHUYỂN BƯỚC 2
  if (result) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-reveal">
        {/* Banner Chúc Mừng & Tóm Tắt Bước 1 */}
        <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-sm text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
              BƯỚC 1: XÁC LẬP XUẤT PHÁT ĐIỂM NHẬN THỨC
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Đã ghi nhận Mỏ neo nhận thức & Kết quả Holland thành công!
            </h1>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
              Mã thiên hướng và mỏ neo ban đầu của bạn đã sẵn sàng. Dữ liệu này sẽ được nạp thẳng vào AI Phản tư ở Bước 2 để chất vấn sâu các điểm mù.
            </p>
          </div>
        </div>

        {/* THẺ TÓM TẮT MỎ NEO NHẬN THỨC (INITIAL ANCHOR SUMMARY) */}
        <div className="bg-amber-50/90 border-2 border-amber-300 p-5 rounded-sm shadow-xs space-y-3 text-amber-950">
          <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
            <Anchor className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
              ⚓ MỎ NEO NHẬN THỨC BAN ĐẦU (INITIAL ANCHOR) ĐÃ THIẾT LẬP
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Ngành & Trường mục tiêu:</span>
              <p className="font-bold text-slate-900 text-sm">{result.anchorData.target_major}</p>
              <p className="text-slate-600 text-[11px]">{result.anchorData.target_university}</p>
            </div>
            <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Nguồn gợi mở chọn nghề:</span>
              <p className="font-bold text-amber-800 text-xs">{result.anchorData.choice_source}</p>
            </div>
            <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Độ tự tin ban đầu (Overconfidence):</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-brand-600">{result.anchorData.confidence_score_initial} / 10</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold bg-brand-100 text-brand-800">
                  {result.anchorData.confidence_score_initial >= 8 ? 'Tự tin cao' : 'Khá tự tin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PHÂN TÍCH RIASEC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Biểu đồ 6 nhóm tính cách Holland
            </h3>
            <HollandChart scores={result.scores} type="radar" />
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-4 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mã Holland 3 nhóm nổi trội</span>
              <p className="text-3xl font-black text-brand-600 tracking-tight mt-1">{result.primaryCode}</p>
            </div>
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {getHollandDescription(result.primaryCode).map((desc, idx) => (
                <p key={idx} className="text-xs text-slate-700 leading-relaxed font-medium">
                  • {desc}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* NÚT HÀNH ĐỘNG TIẾP THEO: SANG BƯỚC 2 */}
        <div className="p-4 bg-slate-900 text-white rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Bước tiếp theo trong tiến trình</span>
            <p className="text-sm font-bold text-white">Sẵn sàng đối diện với phản biện Socrates từ AI?</p>
            <p className="text-xs text-slate-300">AI sẽ dùng chính mỏ neo ngành "{result.anchorData.target_major}" để chất vấn các điểm mù thực tế của bạn.</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button variant="secondary" onClick={handleReset} className="text-xs font-bold py-2.5 px-3">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Làm lại
            </Button>
            <button
              type="button"
              onClick={() => saveStep1DataAndNext('/student/debias-agent')}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>🤖 Hoàn Thành Bước 1 ➔ Sang Bước 2: AI Phản Tư Socrates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // GIAO DIỆN LÀM BÀI TRẮC NGHIỆM VÀ FORM MỎ NEO
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 animate-reveal">
      {/* TIÊU ĐỀ BƯỚC 1 */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            BƯỚC 1 / 6: XÁC LẬP MỎ NEO NHẬN THỨC
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <span>Trắc Nghiệm Thiên Hướng (Holland RIASEC 30 Câu)</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Ghi nhận xuất phát điểm nhận thức ban đầu (Initial Anchor) để tạo nguyên liệu cho AI phản biện ở bước sau.
          </p>
        </div>
      </div>

      {/* THANH TIẾN TRÌNH */}
      <div className="bg-white border border-slate-200 p-4 rounded-sm space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Tiến trình trắc nghiệm & Thiết lập mỏ neo</span>
          <span>
            {isAnchorPage 
              ? '🎯 Chặng cuối: Form xác lập mỏ neo' 
              : `Trang ${currentPage + 1} / ${totalQuestionPages} (${answeredCount}/30 câu)`}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: isAnchorPage ? '100%' : `${(answeredCount / 30) * 100}%` }}
          />
        </div>
      </div>

      {/* NỘI DUNG TRANG: HOẶC 5 CÂU HỎI TRẮC NGHIỆM HOẶC FORM MỎ NEO */}
      {!isAnchorPage ? (
        <div className="space-y-5">
          {pageQuestions.map((q, idx) => {
            const globalIdx = currentPage * questionsPerPage + idx + 1
            return (
              <div 
                key={q.id} 
                className="bg-white border border-slate-200 p-5 rounded-sm space-y-3.5 hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 border border-slate-300">
                    {globalIdx}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed pt-0.5">
                    {q.text}
                  </p>
                </div>
                
                {/* 4 mức đo lường Likert */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pl-8">
                  {[
                    { value: 1, label: '1. Rất không đúng' },
                    { value: 2, label: '2. Không đúng lắm' },
                    { value: 3, label: '3. Khá đúng' },
                    { value: 4, label: '4. Rất đúng' }
                  ].map((opt) => {
                    const isSelected = answers[q.id] === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleAnswerSelect(q.id, opt.value)}
                        className={`py-2 px-2.5 border text-xs font-bold rounded-sm transition-all focus:outline-none text-center cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* FORM XÁC LẬP MỎ NEO NHẬN THỨC (INITIAL ANCHOR FORM - BẮT BUỘC) */
        <div className="bg-white border-2 border-amber-300 p-6 rounded-sm space-y-6 shadow-sm animate-reveal">
          <div className="border-b border-amber-200 pb-3 flex items-start gap-3 text-amber-950">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-sm shrink-0 mt-0.5">
              <Anchor className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                BẮT BUỘC ĐỂ HOÀN TẤT BƯỚC 1
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Form Xác Lập Mỏ Neo Nhận Thức Ban Đầu (Initial Anchor)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Các câu trả lời dưới đây ghi nhận xuất phát điểm của bạn trước khi bước vào các vòng phản tư với AI.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* CÂU HỎI 1 */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                1. Ngành học cụ thể và Trường đại học em đang mong muốn xét tuyển nhất là gì? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    id="targetCareerInput"
                    type="text"
                    value={targetMajor}
                    onChange={(e) => setTargetMajor(e.target.value)}
                    placeholder="Ví dụ: Kế toán, Sư phạm Tiếng Anh, CNTT..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Tên ngành học cụ thể</span>
                </div>
                <div>
                  <input
                    id="targetUniversityInput"
                    type="text"
                    value={targetUniversity}
                    onChange={(e) => setTargetUniversity(e.target.value)}
                    placeholder="Ví dụ: ĐH Kinh tế TP.HCM, ĐH Bách Khoa..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Trường Đại học mục tiêu (không bắt buộc)</span>
                </div>
              </div>
            </div>

            {/* CÂU HỎI 2 */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                2. Nguồn nào khiến em muốn chọn ngành này? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'TikTok', label: '📱 Xem clip TikTok / Mạng xã hội / Review' },
                  { id: 'Bạn bè', label: '👥 Bạn bè rủ / Thấy nhiều bạn cùng chọn' },
                  { id: 'Ba mẹ', label: '👨‍👩‍👧 Ba mẹ định hướng / Gia đình khuyên' },
                  { id: 'Đam mê từ nhỏ', label: '❤️ Đam mê và ấp ủ từ nhỏ' },
                  { id: 'Khác', label: '💡 Tự tìm hiểu tài liệu / Lý do khác' }
                ].map((item) => (
                  <label 
                    key={item.id}
                    className={`flex items-center gap-2 p-2.5 rounded-sm border cursor-pointer transition-all ${
                      choiceSource === item.id 
                        ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-bold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="choice_source"
                      value={item.id}
                      checked={choiceSource === item.id}
                      onChange={() => setChoiceSource(item.id)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {choiceSource === 'Khác' && (
                <input
                  type="text"
                  value={customChoiceSource}
                  onChange={(e) => setCustomChoiceSource(e.target.value)}
                  placeholder="Ghi rõ lý do khác của em..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium mt-2"
                />
              )}
            </div>

            
            {/* Hidden inputs phục vụ DOM retrieval chuẩn xác theo ID */}
            <input type="hidden" id="influenceSourceInput" value={choiceSource === 'Khác' && customChoiceSource ? customChoiceSource : choiceSource} />
            <input type="hidden" id="confidenceScoreInput" value={String(confidenceScore)} />
            <input type="hidden" id="hollandResultText" value={result?.primaryCode || "Nghệ thuật (A) - Xã hội (S)"} />

            {/* CÂU HỎI 3: OVERCONFIDENCE BIAS MEASURE */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  3. Trên thang điểm 1–10, em tự tin bao nhiêu điểm rằng mình sẽ theo học tốt và thành công với ngành này? <span className="text-rose-500">*</span>
                </label>
                <span className="text-sm font-black px-2 py-0.5 rounded-sm bg-brand-600 text-white">
                  {confidenceScore} / 10
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Đánh giá mức độ tự tin hiện tại của em trước khi nhận phản biện từ AI và chuyên gia:
              </p>

              {/* 10 nút bấm chọn điểm 1-10 */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                  const isSelected = confidenceScore === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setConfidenceScore(score)}
                      className={`py-2.5 text-xs font-black rounded-sm border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm scale-105' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {score}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1 pt-1">
                <span>1: Rất phân vân, chưa chắc chắn</span>
                <span>5: Khá tự tin</span>
                <span>10: Tuyệt đối tự tin</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ĐIỀU HƯỚNG TRANG / NỘP BÀI */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentPage === 0}
          className="text-xs font-bold uppercase tracking-wider gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>

        <span className="text-xs text-slate-500 font-bold">
          {isAnchorPage ? '🎯 Bước xác lập mỏ neo' : `Trang ${currentPage + 1} / ${totalQuestionPages}`}
        </span>

        {isAnchorPage ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang lưu mỏ neo...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn tất & Lưu mỏ neo</span>
              </>
            )}
          </button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            className="text-xs font-bold uppercase tracking-wider gap-1.5"
          >
            {currentPage === totalQuestionPages - 1 ? 'Tiếp sang Form mỏ neo' : 'Tiếp theo'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default HollandTest
