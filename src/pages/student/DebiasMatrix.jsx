import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  Brain, 
  UserCheck, 
  Search, 
  AlertTriangle, 
  HelpCircle, 
  Save, 
  Sparkles, 
  History, 
  Trash2, 
  MessageSquareCode, 
  Lightbulb, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ShieldCheck, 
  Compass, 
  RefreshCw,
  TrendingUp,
  Scale
} from 'lucide-react'

// =========================================================================
// 1. DỮ LIỆU 4 BÀI TẬP TÁC VỤ TÌNH HUỐNG (4 BEHAVIORAL SCENARIOS)
// =========================================================================
const SCENARIO_QUESTIONS = [
  {
    id: 'sc-1',
    title: 'Tình huống 1: Bẫy Đám Đông & Mạng Xã Hội (TikTok Trend)',
    biasLabel: 'BẪY PHONG TRÀO / HIỆU ỨNG BẦY ĐÀN',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    context: 'Bạn tình cờ lướt thấy video triệu view trên TikTok khẳng định: "Ngành Logistics & Chuỗi cung ứng hiện tại ra trường lương khởi điểm 50 triệu/tháng, chỉ cần biết tiếng Anh cơ bản là các tập đoàn lớn săn đón ngay".',
    question: 'Hành động phản tư khách quan và hợp lý nhất của bạn là gì?',
    options: [
      {
        id: 'A',
        text: 'A. Bấm lưu clip lại và quyết định chọn ngay ngành Logistics làm Nguyện vọng 1 vì tin đây là ngành hái ra tiền của tương lai.',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang mắc Bẫy Đám đông và Bẫy Thiên lệch xác nhận (tin ngay vào thông tin đơn chiều trên mạng xã hội mà chưa đối chứng).'
      },
      {
        id: 'B',
        text: 'B. Tìm xem thêm các video khác của cùng TikToker này để xem thêm những lời khen ngợi tương tự về ngành.',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang tiếp tục tìm kiếm thông tin củng cố kỳ vọng cảm tính thay vì tìm kiếm bằng chứng phản biện khách quan.'
      },
      {
        id: 'C',
        text: 'C. Tra cứu báo cáo thị trường lao động chính thống (VietnamWorks, Navigos, Tổng cục Thống kê), xem chuẩn đầu ra thực tế và tham vấn anh chị sinh viên/chuyên gia đang làm trong ngành.',
        isCorrect: true,
        biasFeedback: '🎉 CHÍNH XÁC! Đây là phản xạ Đối chứng Dữ liệu Khách quan giúp bạn không bị truyền thông mạng xã hội dắt mũi.'
      }
    ]
  },
  {
    id: 'sc-2',
    title: 'Tình huống 2: Bẫy Chi Phí Chìm (Sunk Cost Fallacy)',
    biasLabel: 'BẪY TIẾC CÔNG SỨC ĐÃ BỎ RA',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    context: 'Bạn đã dành gần 3 năm THPT tập trung học và luyện thi khối A00 (Toán - Lý - Hóa) theo định hướng ban đầu. Tuy nhiên, đến học kỳ 1 lớp 12, bạn nhận ra bản thân có tố chất vượt trội về tư duy thẩm mỹ, sáng tạo nội dung và không hề thích công việc kỹ thuật cơ khí thuần túy.',
    question: 'Quyết định phản tư dũng cảm và chuẩn xác nhất là gì?',
    options: [
      {
        id: 'A',
        text: 'A. Cố gượng ép đăng ký ngành Kỹ thuật cơ khí vì tiếc 3 năm ôn thi khối A00 và sợ phí công sức, tiền bạc bố mẹ đã đầu tư.',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang mắc Bẫy Chi phí chìm (Sunk Cost Fallacy): Cố bám víu lấy quá khứ để đưa ra quyết định sai lầm cho 40 năm sự nghiệp phía trước.'
      },
      {
        id: 'B',
        text: 'B. Buông xuôi, chán nản việc học và phó mặc cho việc thi cử đến đâu thì đến.',
        isCorrect: false,
        biasFeedback: '⚠️ Đây là phản ứng tránh né tiêu cực, không giải quyết được bài toán hướng nghiệp thực chất.'
      },
      {
        id: 'C',
        text: 'C. Đánh giá lại năng lực thực chất, tìm kiếm các ngành học giao thoa (như Thiết kế Đồ họa, UI/UX, Truyền thông Đa phương tiện) có sử dụng tổ hợp thế mạnh để chuyển hướng linh hoạt mà không lãng phí kiến thức đã tích lũy.',
        isCorrect: true,
        biasFeedback: '🎉 TUYỆT VỜI! Bạn đã dũng cảm vượt qua Bẫy Chi phí chìm để tái định vị mục tiêu nghề nghiệp thực chất.'
      }
    ]
  },
  {
    id: 'sc-3',
    title: 'Tình huống 3: Bẫy Cảm Xúc & Phim Ảnh (Emotional Bias)',
    biasLabel: 'BẪY CẢM XÚC & CỐ ĐỊNH TƯ DUY',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    context: 'Bạn luôn muốn thi vào ngành Bác sĩ Đa khoa vì từ lớp 6 xem phim y khoa thấy hình ảnh bác sĩ áo trắng rất ngầu và được xã hội kính trọng. Tuy nhiên thực tế bạn lại rất sợ máu và điểm tổng kết môn Sinh học lớp 11, 12 chỉ đạt 6.2.',
    question: 'Bạn nên phản tư và lựa chọn như thế nào?',
    options: [
      {
        id: 'A',
        text: 'A. Bỏ qua điểm Sinh học và nỗi sợ máu, vẫn quyết tâm nộp nguyện vọng 1 Bác sĩ Đa khoa vì nghĩ "chỉ cần có đam mê từ bé là sẽ vượt qua tất cả".',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang bị Bẫy Cảm xúc Cố định che mờ năng lực thực tế. Đam mê không có nền tảng năng lực dễ dẫn tới thất bại hoặc đào thải sớm.'
      },
      {
        id: 'B',
        text: 'B. Tự trấn an bản thân rằng lên Đại học Y sẽ tự hết sợ máu và tin rằng mình sẽ may mắn đạt điểm cao trong kỳ thi.',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang mắc thêm Bẫy Lạc quan tếu (Optimism Bias) khi trông chờ vào may mắn thay vì chuẩn bị phương án thực tế.'
      },
      {
        id: 'C',
        text: 'C. Tách bạch giữa hình tượng phim ảnh với thực tế nghề y; đối chiếu lại năng lực Sinh học để tìm các ngành khối sức khỏe bổ trợ (Quản lý Bệnh viện, Kỹ thuật Y sinh, Thiết bị Y tế) hoặc đặt ngành Y vào nhóm nguyện vọng có phương án dự phòng an toàn.',
        isCorrect: true,
        biasFeedback: '🎉 XUẤT SẮC! Bạn đã biết phân biệt rõ ràng giữa cảm xúc yêu thích nhất thời với năng lực hành nghề thực tế.'
      }
    ]
  },
  {
    id: 'sc-4',
    title: 'Tình huống 4: Bẫy Mặt Trời Màu Hồng (Optimism Bias)',
    biasLabel: 'BẪY CHỈ NHÌN MẶT MÀU HỒNG (PHỚT LỜ RỦI RO)',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    context: 'Một trường đại học tư thục gửi thư mời nhập học với cam kết trên tờ rơi: "100% sinh viên tốt nghiệp có việc làm quốc tế mức lương khởi điểm 1.500 USD", với mức học phí 180 triệu VNĐ/năm.',
    question: 'Hành động của một học sinh có tư duy phản tư là gì?',
    options: [
      {
        id: 'A',
        text: 'A. Thuyết phục gia đình đi vay mượn tiền để đăng ký ngay lập tức vì tin chắc tương lai sẽ nhận lương nghìn đô trả nợ dễ dàng.',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang mắc Bẫy Lạc quan quá mức và phớt lờ rủi ro gánh nặng tài chính của gia đình.'
      },
      {
        id: 'B',
        text: 'B. Tin tưởng tuyệt đối vào lời cam kết in trên tờ rơi quảng cáo mà không cần kiểm tra thêm bất kỳ điều khoản ràng buộc nào.',
        isCorrect: false,
        biasFeedback: '⚠️ Bạn đang thiếu kỹ năng hoài nghi lành mạnh và kiểm chứng thông tin tuyển sinh độc lập.'
      },
      {
        id: 'C',
        text: 'C. Kiểm chứng giấy phép kiểm định chất lượng của Bộ GD&ĐT, đọc kỹ các điều kiện ràng buộc trong hợp đồng cam kết việc làm, tính toán tổng chi phí 4 năm và chuẩn bị phương án tài chính dự phòng cùng gia đình.',
        isCorrect: true,
        biasFeedback: '🎉 CHÍNH XÁC! Luôn luôn soi chiếu mặt tối, rủi ro pháp lý và học phí thực tế trước khi đặt bút cam kết tài chính.'
      }
    ]
  }
]

// =========================================================================
// 2. THUẬT TOÁN CHẨN ĐOÁN BẪY TƯ DUY TỰ ĐỘNG CHO MA TRẬN PHẢN TƯ
// =========================================================================
const getBiasDiagnosis = (matrix) => {
  const { risk_analysis, verified_sources, final_decision, bias_check } = matrix

  const textBiasCheck = (bias_check || '').toLowerCase()
  const textSources = (verified_sources || '').toLowerCase()
  const textRisk = (risk_analysis || '').toLowerCase()

  if (final_decision === 'BACKUP' || final_decision === 'CHANGED') {
    return {
      type: 'DEBIASED_SUCCESS',
      icon: '🎉',
      badge: 'THOÁT BẪY TƯ DUY THÀNH CÔNG',
      title: '🎉 TUYỆT VỜI! BẠN ĐÃ THOÁT BẪY TƯ DUY THÀNH CÔNG',
      message: 'Việc dũng cảm nhìn vào thực tế để điều chỉnh nguyện vọng chính là biểu hiện của Tư duy Phản tư trưởng thành.',
      cardStyle: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      badgeStyle: 'bg-emerald-200 text-emerald-900 border-emerald-300',
      aiHighlight: 'Bạn đã tỉnh táo điều chỉnh nguyện vọng dựa trên phân tích thực tế thay vì cố bám trụ cảm xúc ban đầu.',
      aiWarning: 'Nhận diện rủi ro rất thực tế. Hãy duy trì sự chủ động này khi sắp xếp thứ tự nguyện vọng chính thức.'
    }
  }

  const emotionalKeywords = ["thích từ nhỏ", "đam mê", "ước mơ", "từ bé", "thích từ lâu", "sở thích", "thích"]
  const hasEmotionalBias = emotionalKeywords.some(kw => textBiasCheck.includes(kw))

  if (hasEmotionalBias) {
    return {
      type: 'EMOTIONAL_BIAS',
      icon: '⚠️',
      badge: 'BẪY CẢM XÚC & CỐ ĐỊNH TƯ DUY',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY CẢM XÚC & CỐ ĐỊNH TƯ DUY (THÍCH TỪ BÉ)',
      message: 'Bạn đang chọn nghề dựa vào cảm xúc quen thuộc từ quá khứ. Yêu thích là tốt, nhưng hãy đối chiếu xem ngành này hiện tại có thay đổi hoặc bị AI ảnh hưởng so với hình dung ngày nhỏ của bạn không nhé!',
      cardStyle: 'bg-amber-50 border-amber-300 text-amber-950',
      badgeStyle: 'bg-amber-200 text-amber-900 border-amber-300',
      aiHighlight: 'Bạn có đam mê cá nhân rõ ràng và kiên định với ước mơ ban đầu.',
      aiWarning: 'Đam mê cần gắn liền với năng lực thực tế và bối cảnh thị trường tuyển dụng hiện đại.'
    }
  }

  const bandwagonKeywords = ["bạn bè", "mạng xã hội", "tiktok", "facebook", "nghe đồn", "hot trend", "nhiều người theo", "xu hướng"]
  const hasBandwagonBias = bandwagonKeywords.some(kw => textBiasCheck.includes(kw) || textSources.includes(kw)) || textSources.trim().length < 30

  if (hasBandwagonBias) {
    return {
      type: 'BANDWAGON_BIAS',
      icon: '⚠️',
      badge: 'BẪY PHONG TRÀO / ĐÁM ĐÔNG',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY CHỌN NGHỀ THEO PHONG TRÀO / ĐÁM ĐÔNG',
      message: 'Quyết định của bạn đang bị ảnh hưởng bởi tâm lý đám đông hoặc truyền thông. Hãy tập trung vào năng lực và điểm số thực tế của chính bạn!',
      cardStyle: 'bg-blue-50 border-blue-300 text-blue-950',
      badgeStyle: 'bg-blue-200 text-blue-900 border-blue-300',
      aiHighlight: 'Bạn đã nắm bắt được các ngành học đang nhận được nhiều sự quan tâm của thị trường.',
      aiWarning: 'Cần bổ sung nguồn đối chứng chính thống từ Bộ GD&ĐT thay vì tin vào video mạng xã hội.'
    }
  }

  const isRiskTooShort = textRisk.trim().length < 15
  const optimismKeywords = ["không có", "không rủi ro", "hoàn hảo", "lương cao", "không"]
  const hasOptimismBias = isRiskTooShort || (optimismKeywords.some(kw => textRisk.includes(kw)) && textRisk.trim().length < 25)

  if (hasOptimismBias) {
    return {
      type: 'OPTIMISM_BIAS',
      icon: '⚠️',
      badge: 'BẪY CHỈ NHÌN MẶT MÀU HỒNG',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY CHỈ NHÌN MẶT MÀU HỒNG (PHỚT LỜ RỦI RO)',
      message: 'Không có ngành nghề nào hoàn hảo. Việc phớt lờ rủi ro sẽ khiến bạn dễ bị sốc thực tế khi bước vào Đại học. Hãy tìm hiểu kỹ mặt tối và thách thức thực tế của ngành!',
      cardStyle: 'bg-rose-50 border-rose-300 text-rose-950',
      badgeStyle: 'bg-rose-200 text-rose-900 border-rose-300',
      aiHighlight: 'Bạn có tinh thần tích cực và kỳ vọng lớn vào tương lai sự nghiệp.',
      aiWarning: 'Mọi ngành học đều có áp lực riêng (tỷ lệ đào thải, sự thay đổi công nghệ). Hãy chủ động nhận diện rủi ro.'
    }
  }

  const sunkCostKeywords = ["tiếc", "công sức", "ôn thi", "đã học", "bố mẹ bảo", "gia đình"]
  const hasSunkCostBias = sunkCostKeywords.some(kw => textBiasCheck.includes(kw))

  if (hasSunkCostBias) {
    return {
      type: 'SUNK_COST_BIAS',
      icon: '⚠️',
      badge: 'BẪY TIẾC CÔNG SỨC / CHI PHÍ CHÌM',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY TIẾC CÔNG SỨC (CHI PHÍ CHÌM)',
      message: 'Bạn đang cố bám trụ một ngành vì tiếc thời gian đã ôn thi hoặc vì kỳ vọng của gia đình dù trong lòng không còn phù hợp. Hãy dũng cảm tái định hướng trước khi quá muộn!',
      cardStyle: 'bg-purple-50 border-purple-300 text-purple-950',
      badgeStyle: 'bg-purple-200 text-purple-900 border-purple-300',
      aiHighlight: 'Bạn là người kiên trì và coi trọng công sức đã bỏ ra trong quá khứ.',
      aiWarning: 'Đừng để tiếc nuối 1-2 năm ôn thi làm bạn mắc kẹt trong 40 năm sự nghiệp không phù hợp.'
    }
  }

  return {
    type: 'BALANCED',
    icon: '✨',
    badge: 'TƯ DUY PHẢN TƯ CÂN BẰNG',
    title: '✨ BẠN ĐANG CÓ TƯ DUY PHẢN TƯ TỐT!',
    message: 'Bạn đã biết đối chứng dữ liệu thực tế và nhận diện được rủi ro của ngành. Đây là nền tảng vững chắc để đưa ra quyết định chọn nghề chính xác.',
    cardStyle: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    badgeStyle: 'bg-emerald-200 text-emerald-900 border-emerald-300',
    aiHighlight: 'Thông tin có cơ sở thực tế và phân tích thách thức rất khách quan.',
    aiWarning: 'Hãy duy trì việc đối chứng này khi xem xét các trường đại học cụ thể.'
  }
}

// =========================================================================
// 3. MAIN COMPONENT: NHẬT KÝ PHẢN TƯ (MA TRẬN & TÁC VỤ TÌNH HUỐNG)
// =========================================================================
const DebiasMatrix = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialMajor = searchParams.get('major') || ''

  // 2 Tabs: 'matrix' (Ma trận 4 ô tự điền) | 'scenarios' (4 Bài test tình huống)
  const [activeTab, setActiveTab] = useState('matrix')

  // State cho Tab A: Ma trận tự phản tư
  const [targetMajor, setTargetMajor] = useState(initialMajor)
  const [evidence, setEvidence] = useState('')
  const [verifiedSources, setVerifiedSources] = useState('')
  const [riskAnalysis, setRiskAnalysis] = useState('')
  const [biasCheck, setBiasCheck] = useState('')
  const [finalDecision, setFinalDecision] = useState('CONFIRMED')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [savedMatrices, setSavedMatrices] = useState([])

  // State cho Tab B: Tác vụ tình huống số
  const [scenarioAnswers, setScenarioAnswers] = useState({})
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false)
  const [scenarioScore, setScenarioScore] = useState(0)
  const [isSubmittingScenario, setIsSubmittingScenario] = useState(false)

  useEffect(() => {
    if (initialMajor) {
      setTargetMajor(initialMajor)
    }
  }, [initialMajor])

  useEffect(() => {
    fetchSavedMatrices()
    loadSavedScenarioResult()
  }, [user])

  const fetchSavedMatrices = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('metacognitive_matrix')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSavedMatrices(data)
      }
    } catch (err) {
      console.warn('Lấy lịch sử phản tư:', err)
    }
  }

  const loadSavedScenarioResult = async () => {
    if (!user) return
    try {
      const raw = localStorage.getItem(`scenario_result_${user.id}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        setScenarioAnswers(parsed.answers || {})
        setScenarioScore(parsed.score || 0)
        setScenarioSubmitted(true)
      }
    } catch (e) {
      console.warn('Lỗi đọc local scenario:', e)
    }
  }

  // Lưu Ma Trận Tự Phản Tư (Tab A)
  const handleSaveMatrix = async (e) => {
    e.preventDefault()

    if (!targetMajor.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập tên Ngành học dự định chọn.' })
      return
    }

    if (!evidence.trim() || !verifiedSources.trim() || !riskAnalysis.trim() || !biasCheck.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền đầy đủ cả 4 ô phản tư để hệ thống phân tích chuẩn xác nhất.' })
      return
    }

    setIsSubmitting(true)
    const currentEntry = {
      target_major: targetMajor,
      evidence,
      verified_sources: verifiedSources,
      risk_analysis: riskAnalysis,
      bias_check: biasCheck,
      final_decision: finalDecision
    }

    const diagnosis = getBiasDiagnosis(currentEntry)

    try {
      if (user) {
        const { data, error } = await supabase
          .from('metacognitive_matrix')
          .insert([
            {
              student_id: user.id,
              target_major: targetMajor,
              evidence: evidence,
              verified_sources: verifiedSources,
              risk_analysis: riskAnalysis,
              bias_check: biasCheck,
              detected_bias: diagnosis.type,
              final_decision: finalDecision
            }
          ])
          .select()
          .single()

        if (!error && data) {
          setSavedMatrices(prev => [data, ...prev])
        }
      }

      setToast({ 
        type: 'success', 
        message: 'Lưu bài làm Phản tư & Đồng bộ vào CSDL thành công!' 
      })
    } catch (error) {
      console.error('Lỗi khi lưu bảng phản tư:', error)
      setToast({ type: 'error', message: 'Không thể lưu bảng phản tư.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Nộp Bài Test Tác Vụ Tình Huống (Tab B)
  const handleScenarioOptionSelect = (scenarioId, optionId) => {
    setScenarioAnswers(prev => ({
      ...prev,
      [scenarioId]: optionId
    }))
  }

  const handleSubmitScenarioTest = async () => {
    const answeredCount = Object.keys(scenarioAnswers).length
    if (answeredCount < SCENARIO_QUESTIONS.length) {
      setToast({ 
        type: 'warning', 
        message: `Bạn mới trả lời ${answeredCount}/${SCENARIO_QUESTIONS.length} tình huống. Vui lòng hoàn thành cả 4 câu hỏi!` 
      })
      return
    }

    setIsSubmittingScenario(true)

    let correctCount = 0
    SCENARIO_QUESTIONS.forEach(sc => {
      const chosen = scenarioAnswers[sc.id]
      const correctOpt = sc.options.find(o => o.isCorrect)
      if (chosen === correctOpt?.id) {
        correctCount++
      }
    })

    setScenarioScore(correctCount)
    setScenarioSubmitted(true)

    // Lưu vào LocalStorage
    if (user?.id) {
      const payload = {
        answers: scenarioAnswers,
        score: correctCount,
        total: SCENARIO_QUESTIONS.length,
        submittedAt: new Date().toISOString()
      }
      localStorage.setItem(`scenario_result_${user.id}`, JSON.stringify(payload))
    }

    // Đồng bộ vào Supabase Database
    try {
      if (user?.id) {
        await supabase
          .from('metacognitive_matrix')
          .insert([
            {
              student_id: user.id,
              target_major: `[Tác Vụ Tình Huống] Kết quả: ${correctCount}/${SCENARIO_QUESTIONS.length} Đạt`,
              evidence: `Học sinh đã hoàn thành 4 tình huống nhận diện bẫy thông tin số với điểm số ${correctCount}/4.`,
              verified_sources: 'Bộ câu hỏi tình huống thực nghiệm chuẩn khoa học ViSEF 2026.',
              risk_analysis: 'Đã nhận diện rủi ro truyền thông và tin giả hướng nghiệp.',
              bias_check: `Lựa chọn câu trả lời: ${JSON.stringify(scenarioAnswers)}`,
              detected_bias: correctCount >= 3 ? 'DEBIASED_SUCCESS' : 'BANDWAGON_BIAS',
              final_decision: 'CONFIRMED'
            }
          ])
      }
    } catch (e) {
      console.warn('Lưu kết quả tình huống vào Supabase:', e)
    }

    setIsSubmittingScenario(false)
    setToast({
      type: 'success',
      message: `🎉 Nộp bài thành công! Bạn đạt ${correctCount}/${SCENARIO_QUESTIONS.length} điểm Phản tư!`
    })
  }

  const handleResetScenarioTest = () => {
    setScenarioAnswers({})
    setScenarioSubmitted(false)
    setScenarioScore(0)
    if (user?.id) {
      localStorage.removeItem(`scenario_result_${user.id}`)
    }
  }

  const handleDelete = async (id) => {
    try {
      if (user) {
        await supabase
          .from('metacognitive_matrix')
          .delete()
          .eq('id', id)
      }
    } catch (err) {
      console.warn('Lỗi xóa Supabase:', err)
    }

    const nextList = savedMatrices.filter(m => m.id !== id)
    setSavedMatrices(nextList)
    setToast({ type: 'info', message: 'Đã xóa bản ghi phản tư.' })
  }

  const renderDecisionTag = (decision) => {
    switch (decision) {
      case 'BACKUP':
        return <span className="px-2.5 py-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-sm inline-flex items-center gap-1">🟡 Nguyện vọng Dự phòng</span>
      case 'CHANGED':
        return <span className="px-2.5 py-1 text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 rounded-sm inline-flex items-center gap-1">🔴 Đã Hủy / Đổi Ngành</span>
      case 'CONFIRMED':
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm inline-flex items-center gap-1">🟢 Nguyện vọng Chính thức</span>
    }
  }

  // Kết quả Chẩn đoán Live của bài hiện tại
  const liveDiagnosis = getBiasDiagnosis({
    target_major: targetMajor,
    evidence,
    verified_sources: verifiedSources,
    risk_analysis: riskAnalysis,
    bias_check: biasCheck,
    final_decision: finalDecision
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-reveal font-sans">
      {/* Header Trang Phản Tư */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-50 border border-brand-100 rounded-sm text-brand-600">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                📝 Nhật Ký Phản Tư & Thử Thách Bẫy Nhận Thức
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Công cụ giúp bạn tự soi chiếu năng lực thực tế, nhận diện 4 bẫy tâm lý và rèn luyện kỹ năng chống bẫy thông tin số.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/student/roadmap"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-sm transition-all shadow-2xs"
            >
              <Target className="w-4 h-4 text-brand-600" />
              <span>Lộ trình Mục tiêu (3 Khối lớp)</span>
            </a>
          </div>
        </div>

        {/* Thanh 2 Tabs chuyển đổi cốt lõi */}
        <div className="flex border-b border-slate-200 gap-4 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-brand-600 text-brand-700 bg-brand-50/40 px-3 py-1.5 rounded-t-sm'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Brain className="w-4 h-4 text-brand-600" />
            <span>TAB A: 📝 Ma Trận Tự Phản Tư (Form 4 Ô)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scenarios')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'scenarios'
                ? 'border-amber-500 text-amber-900 bg-amber-50/60 px-3 py-1.5 rounded-t-sm'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>TAB B: 🎯 Thử Thách Tác Vụ Tình Huống (4 Bài Test Bẫy Số)</span>
            {scenarioSubmitted && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-emerald-600 text-white rounded-full">
                {scenarioScore}/4 Đạt
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB A: MA TRẬN TỰ PHẢN TƯ (FORM 4 Ô)
          ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-reveal">
          {/* Banner Cú Hích Giải Thích Bình Dị */}
          <div className="bg-blue-50/80 border border-blue-200 text-blue-950 p-4 rounded-sm flex items-start gap-3 shadow-2xs font-semibold text-xs leading-relaxed">
            <div className="p-1.5 bg-blue-500 text-white rounded-sm flex-shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-blue-900">💡 Phản tư đơn giản là gì?</span> Là việc bạn dành 2 phút "soi" lại xem mình chọn ngành này vì <span className="font-bold uppercase text-blue-900 underline">NĂNG LỰC THỰC TẾ & DỮ LIỆU CHÍNH THỐNG</span> hay chỉ vì cảm xúc nhất thời & xem clip mạng xã hội!
            </div>
          </div>

          {/* Form Điền 4 Ô */}
          <form onSubmit={handleSaveMatrix} className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-2 shadow-sm">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Tên Ngành Học Dự Định Chọn
              </label>
              <input
                type="text"
                placeholder="Nhập tên ngành học bạn đang dự định chọn (Ví dụ: Khoa học máy tính, Marketing, Y khoa...)"
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-bold text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* 4 Ô Ma Trận */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ô 1 */}
              <div className="bg-blue-50/40 border border-blue-200 p-5 rounded-sm space-y-3">
                <div className="flex items-center gap-2.5 text-blue-900 border-b border-blue-100 pb-2.5">
                  <div className="p-1.5 bg-blue-500 text-white rounded-sm">
                    <UserCheck className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    1. Năng lực & Bằng chứng thực tế
                  </h3>
                </div>
                <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
                  Liệt kê ít nhất 2 điểm số, kỹ năng hoặc trải nghiệm thực tế chứng minh bạn phù hợp với ngành này.
                </p>
                <textarea
                  rows={4}
                  placeholder="VD: Điểm học bạ Toán - Lý đều trên 8.5; đã tự học xây dựng website cá nhân bằng HTML/CSS..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-blue-200 focus:border-blue-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
                />
              </div>

              {/* Ô 2 */}
              <div className="bg-indigo-50/40 border border-indigo-200 p-5 rounded-sm space-y-3">
                <div className="flex items-center gap-2.5 text-indigo-900 border-b border-indigo-100 pb-2.5">
                  <div className="p-1.5 bg-indigo-500 text-white rounded-sm">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    2. Dữ liệu đối chứng chính thống
                  </h3>
                </div>
                <p className="text-[11px] text-indigo-700 font-semibold leading-relaxed">
                  Nhập nguồn thông tin/báo cáo thị trường bạn đã tham khảo (tránh thông tin đơn chiều từ mạng xã hội).
                </p>
                <textarea
                  rows={4}
                  placeholder="VD: Báo cáo nhu cầu nhân lực của VietnamWorks 2025; Đã đọc chuẩn đầu ra và học phí 4 năm trên website trường ĐH..."
                  value={verifiedSources}
                  onChange={(e) => setVerifiedSources(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
                />
              </div>

              {/* Ô 3 */}
              <div className="bg-amber-50/40 border border-amber-200 p-5 rounded-sm space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900 border-b border-amber-100 pb-2.5">
                  <div className="p-1.5 bg-amber-500 text-white rounded-sm">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    3. Phân tích Rủi ro & Thách thức
                  </h3>
                </div>
                <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                  Liệt kê 2 thách thức, áp lực hoặc nguy cơ (như bị AI thay thế, tỷ lệ đào thải) mà bạn sẵn sàng đón nhận.
                </p>
                <textarea
                  rows={4}
                  placeholder="VD: Áp lực OT cập nhật kiến thức liên tục; Nguy cơ lập trình viên cấp thấp bị AI thay thế trong 5 năm tới..."
                  value={riskAnalysis}
                  onChange={(e) => setRiskAnalysis(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-amber-200 focus:border-amber-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
                />
              </div>

              {/* Ô 4 */}
              <div className="bg-rose-50/40 border border-rose-200 p-5 rounded-sm space-y-3">
                <div className="flex items-center gap-2.5 text-rose-900 border-b border-rose-100 pb-2.5">
                  <div className="p-1.5 bg-rose-500 text-white rounded-sm">
                    <HelpCircle className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    4. Soi chiếu Bẫy Tâm Lý Chọn Nghề
                  </h3>
                </div>
                <p className="text-[11px] text-rose-800 font-semibold leading-relaxed">
                  Tự hỏi: Mình có đang chọn vì "thích từ bé", "bạn bè rủ", "xem TikTok" hay "tiếc công ôn thi" không?
                </p>
                <textarea
                  rows={4}
                  placeholder="VD: Ban đầu thích vì xem phim hacker, nhưng sau khi đối chiếu thấy cần nhiều tư duy toán học và đã tự học thử thấy phù hợp..."
                  value={biasCheck}
                  onChange={(e) => setBiasCheck(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-rose-200 focus:border-rose-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
                />
              </div>
            </div>

            {/* Khung Quyết Định Cuối Cùng */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-3 shadow-sm">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                🎯 Quyết Định Của Bạn Sau Khi Hoàn Thành Bảng Phản Tư:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`flex items-center gap-3 p-3.5 rounded-sm border cursor-pointer transition-all ${
                  finalDecision === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="CONFIRMED"
                    checked={finalDecision === 'CONFIRMED'}
                    onChange={(e) => setFinalDecision(e.target.value)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-black">🟢 Giữ làm Nguyện Vọng Chính</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Đã đủ bằng chứng và chấp nhận rủi ro</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3.5 rounded-sm border cursor-pointer transition-all ${
                  finalDecision === 'BACKUP' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="BACKUP"
                    checked={finalDecision === 'BACKUP'}
                    onChange={(e) => setFinalDecision(e.target.value)}
                    className="w-4 h-4 text-amber-600"
                  />
                  <div>
                    <p className="text-xs font-black">🟡 Chuyển thành NV Dự Phòng</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Cần tích lũy thêm năng lực thực tế</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3.5 rounded-sm border cursor-pointer transition-all ${
                  finalDecision === 'CHANGED' ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="CHANGED"
                    checked={finalDecision === 'CHANGED'}
                    onChange={(e) => setFinalDecision(e.target.value)}
                    className="w-4 h-4 text-rose-600"
                  />
                  <div>
                    <p className="text-xs font-black">🔴 Đã Hủy & Tìm Ngành Khác</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Nhận thấy hoàn toàn không phù hợp</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Nút Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="font-bold text-xs uppercase tracking-wider py-3 px-8 gap-2 bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang lưu vào CSDL...' : 'LƯU BÀI PHẢN TƯ VÀO HỆ THỐNG'}</span>
              </Button>
            </div>
          </form>

          {/* Lịch Sử Các Bài Làm Phản Tư Đã Lưu */}
          {savedMatrices.length > 0 && (
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-4 h-4 text-brand-600" />
                <span>Lịch Sử Bài Làm Phản Tư Của Bạn ({savedMatrices.length} bản ghi)</span>
              </h3>

              <div className="space-y-3">
                {savedMatrices.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-brand-300 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-xs">{item.target_major}</span>
                        {renderDecisionTag(item.final_decision)}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Đối chứng: <em>{item.verified_sources || 'Chưa ghi nguồn'}</em>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Xóa bài làm này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB B: THỬ THÁCH TÁC VỤ TÌNH HUỐNG (4 BEHAVIORAL SCENARIOS)
          ========================================================================= */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6 animate-reveal">
          {/* Banner Giới Thiệu Tab B */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/5 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-sm shadow-2xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-sm font-black flex-shrink-0 mt-0.5 shadow-xs text-base">
                🎯
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>THỬ THÁCH TÁC VỤ TÌNH HUỐNG: CHỐNG BẪY THÔNG TIN SỐ (4 SCENARIOS)</span>
                </h4>
                <p className="text-xs text-amber-900 font-bold mt-1 leading-relaxed">
                  Hãy đọc kỹ 4 tình huống thực tế thường gặp trên mạng xã hội và chọn cách xử lý thể hiện tư duy phản biện & đối chứng khách quan nhất. Điểm số sẽ được đồng bộ trực tiếp vào Hồ sơ NCKH của bạn!
                </p>
              </div>
            </div>
          </div>

          {/* Kết quả sau khi nộp bài */}
          {scenarioSubmitted && (
            <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-sm shadow-sm space-y-3 animate-reveal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-full font-black">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">
                      🎉 BẠN ĐÃ HOÀN THÀNH THỬ THÁCH! KẾT QUẢ: {scenarioScore}/{SCENARIO_QUESTIONS.length} ĐIỂM
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      {scenarioScore === 4 && 'Xuất sắc! Bạn có năng lực phản tư và kháng bẫy thông tin số hoàn hảo.'}
                      {scenarioScore === 3 && 'Rất tốt! Bạn đã nhận diện được hầu hết các bẫy tâm lý phổ biến.'}
                      {scenarioScore < 3 && 'Hãy xem kỹ các phản hồi bên dưới để rút kinh nghiệm khi tra cứu thông tin thực tế nhé!'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetScenarioTest}
                  className="text-xs font-bold uppercase tracking-wider py-2 px-4 gap-1.5 border-emerald-400 text-emerald-900 hover:bg-emerald-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm lại bài test</span>
                </Button>
              </div>
            </div>
          )}

          {/* 4 Câu Hỏi Tình Huống */}
          <div className="space-y-6">
            {SCENARIO_QUESTIONS.map((sc, idx) => {
              const selectedOption = scenarioAnswers[sc.id]

              return (
                <div key={sc.id} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wider">
                        {sc.title}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-sm border uppercase ${sc.badgeClass}`}>
                      {sc.biasLabel}
                    </span>
                  </div>

                  {/* Ngữ cảnh */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700 font-medium leading-relaxed">
                    <strong>Bối cảnh:</strong> {sc.context}
                  </div>

                  <p className="text-xs font-bold text-slate-900">
                    ❓ {sc.question}
                  </p>

                  {/* 3 Lựa Chọn A, B, C */}
                  <div className="space-y-2.5">
                    {sc.options.map((opt) => {
                      const isSelected = selectedOption === opt.id
                      const showResult = scenarioSubmitted

                      let optionStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      if (isSelected && !showResult) {
                        optionStyle = 'bg-brand-50 border-brand-500 text-brand-950 font-bold ring-1 ring-brand-300'
                      }
                      if (showResult) {
                        if (opt.isCorrect) {
                          optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-400'
                        } else if (isSelected && !opt.isCorrect) {
                          optionStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-1 ring-rose-400'
                        }
                      }

                      return (
                        <div key={opt.id} className="space-y-1.5">
                          <label className={`flex items-start gap-3 p-3.5 rounded-sm border cursor-pointer transition-all ${optionStyle}`}>
                            <input
                              type="radio"
                              name={`scenario_${sc.id}`}
                              value={opt.id}
                              checked={isSelected}
                              disabled={scenarioSubmitted}
                              onChange={() => handleScenarioOptionSelect(sc.id, opt.id)}
                              className="w-4 h-4 text-brand-600 mt-0.5"
                            />
                            <div className="flex-1 text-xs leading-relaxed font-semibold">
                              <span>{opt.text}</span>
                            </div>
                            {showResult && opt.isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            {showResult && isSelected && !opt.isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                          </label>

                          {/* Giải thích sau khi nộp bài */}
                          {showResult && isSelected && (
                            <div className={`p-2.5 rounded-sm text-[11px] font-medium leading-relaxed ${
                              opt.isCorrect ? 'bg-emerald-100/60 text-emerald-900 border border-emerald-300' : 'bg-rose-100/60 text-rose-900 border border-rose-300'
                            }`}>
                              {opt.biasFeedback}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Nút Nộp Bài Test Tình Huống */}
          {!scenarioSubmitted && (
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmitScenarioTest}
                disabled={isSubmittingScenario}
                className="font-bold text-xs uppercase tracking-wider py-3 px-8 gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all border border-amber-400"
              >
                <Award className="w-4 h-4" />
                <span>{isSubmittingScenario ? 'Đang chấm điểm...' : 'NỘP BÀI ĐÁNH GIÁ TÁC VỤ TÌNH HUỐNG'}</span>
              </Button>
            </div>
          )}
        </div>
      )}

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

export default DebiasMatrix
