import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import HollandChart from '../../components/common/HollandChart'
import StepProgressHeader from '../../components/common/StepProgressHeader'
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
  ShieldCheck,
  AlertCircle,
  Bot,
  Pencil,
  RotateCcw
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

// Hệ thống ánh xạ mã Holland sang đặc tính môi trường làm việc thực tế:
export const hollandDescriptions = {
  'R': 'Thực tế / Kỹ thuật (Thích làm việc với máy móc, công cụ, không gian vật lý)',
  'I': 'Nghiên cứu (Thích tư duy trừu tượng, phân tích dữ liệu, giải quyết vấn đề phức tạp)',
  'A': 'Nghệ thuật (Thích sáng tạo, tự do, không gian thể hiện cái tôi thẩm mỹ)',
  'S': 'Xã hội (Thích giúp đỡ, giảng dạy, giao tiếp và chăm sóc con người)',
  'E': 'Quản lý / Doanh nhân (Thích lãnh đạo, thuyết phục, cạnh tranh đạt mục tiêu tài chính)',
  'C': 'Nghiệp vụ / Văn phòng (Thích sự ngăn nắp, quy trình rõ ràng, xử lý giấy tờ, con số chính xác)'
};

// Hàm phân tích mức độ tương thích giữa Ngành mong muốn và Kết quả Holland
export function analyzeHollandCompatibility(targetCareer, userHollandCodes) {
  // userHollandCodes là mảng 3 chữ cái RIASEC của học sinh, ví dụ: ['R', 'I', 'A']
  const codes = Array.isArray(userHollandCodes)
    ? userHollandCodes
    : (typeof userHollandCodes === 'string' ? userHollandCodes.replace(/[^RIASEC]/gi, '').split('') : ['A', 'S', 'E']);

  const c1 = codes[0] || 'A';
  const c2 = codes[1] || 'S';

  let analysisResult = `
    📊 KẾT QUẢ GIẢI MÃ THIÊN HƯỚNG HOLLAND CỦA EM:
    - 3 nhóm tính cách nổi trội nhất: ${codes.join(', ')}
    - Ý nghĩa thực tế: 
      + Nhóm chủ đạo (${c1}): ${hollandDescriptions[c1] || c1}
      + Nhóm hỗ trợ (${c2}): ${hollandDescriptions[c2] || c2}
  `;

  if (targetCareer && targetCareer.trim() && targetCareer !== 'chưa xác định') {
    const careerLower = targetCareer.toLowerCase();
    const techKeywords = ['công nghệ', 'phần mềm', 'it', 'kỹ thuật', 'lập trình', 'vi mạch', 'an ninh mạng', 'khoa học máy tính', 'ai', 'robot'];
    const bizKeywords = ['kinh tế', 'quản trị', 'kinh doanh', 'marketing', 'tài chính', 'ngân hàng', 'thương mại', 'logistics', 'kế toán'];
    const artKeywords = ['nghệ thuật', 'thiết kế', 'đồ họa', 'truyền thông', 'báo chí', 'kiến trúc', 'nhiếp ảnh', 'quay phim', 'nội dung'];
    const socialKeywords = ['sư phạm', 'tâm lý', 'xã hội', 'giáo dục', 'y khoa', 'bác sĩ', 'điều dưỡng', 'dược', 'y tế', 'luật'];

    let expectedGroup = '';
    let expectedCodes = [];
    if (techKeywords.some(k => careerLower.includes(k))) { expectedGroup = 'I/R (Nghiên cứu & Kỹ thuật)'; expectedCodes = ['I', 'R']; }
    else if (bizKeywords.some(k => careerLower.includes(k))) { expectedGroup = 'E/C (Quản lý & Nghiệp vụ)'; expectedCodes = ['E', 'C']; }
    else if (artKeywords.some(k => careerLower.includes(k))) { expectedGroup = 'A/S (Nghệ thuật & Xã hội)'; expectedCodes = ['A', 'S']; }
    else if (socialKeywords.some(k => careerLower.includes(k))) { expectedGroup = 'S/I (Xã hội & Nghiên cứu)'; expectedCodes = ['S', 'I']; }

    if (expectedGroup) {
      const isOverlap = expectedCodes.some(c => codes.includes(c));
      const matchStatus = isOverlap ? '✅ Độ tương thích khá tốt' : '⚠️ Có độ lệch pha nhận thức (Cần phản tư)';
      analysisResult += `
    - Đối chiếu ngành "${targetCareer}":
      + Môi trường ngành này thường đòi hỏi: ${expectedGroup}
      + Đánh giá sơ bộ: ${matchStatus}. Em hãy cùng AI Socrates chất vấn sâu các điểm mù này ở Bước 2!`;
    }
  }

  return analysisResult;
}

// Hàm tóm tắt ngắn gọn mức độ tương thích giữa Ngành mong muốn và Kết quả Holland
export function getCompatibilitySummary(targetCareer, userHollandCodes) {
  const codes = Array.isArray(userHollandCodes)
    ? userHollandCodes
    : (typeof userHollandCodes === 'string' ? userHollandCodes.replace(/[^RIASEC]/gi, '').split('') : ['A', 'S', 'E']);

  if (!targetCareer || targetCareer === 'chưa xác định') {
    return 'Chưa xác định ngành học để đối chiếu với nhóm tính cách.';
  }

  const c1 = codes[0] || 'A';
  const c2 = codes[1] || 'S';

  const careerLower = targetCareer.toLowerCase();
  const techKeywords = ['công nghệ', 'phần mềm', 'it', 'kỹ thuật', 'lập trình', 'vi mạch', 'an ninh mạng', 'khoa học máy tính', 'ai', 'robot', 'khoa học dữ liệu', 'điện tử', 'cơ khí'];
  const bizKeywords = ['kinh tế', 'quản trị', 'kinh doanh', 'marketing', 'tài chính', 'ngân hàng', 'thương mại', 'logistics', 'kế toán', 'ngoại thương', 'bất động sản'];
  const artKeywords = ['nghệ thuật', 'thiết kế', 'đồ họa', 'truyền thông', 'báo chí', 'kiến trúc', 'nhiếp ảnh', 'quay phim', 'nội dung', 'âm nhạc', 'mỹ thuật', 'điện ảnh'];
  const socialKeywords = ['sư phạm', 'tâm lý', 'xã hội', 'giáo dục', 'y khoa', 'bác sĩ', 'điều dưỡng', 'dược', 'y tế', 'luật', 'công tác xã hội', 'ngôn ngữ'];

  let expectedGroup = '';
  let expectedCodes = [];
  let expectedDesc = '';

  if (techKeywords.some(k => careerLower.includes(k))) {
    expectedGroup = 'I/R';
    expectedCodes = ['I', 'R'];
    expectedDesc = 'Nghiên cứu & Kỹ thuật (tư duy logic, giải quyết bài toán phức tạp, làm việc máy móc/hệ thống)';
  } else if (bizKeywords.some(k => careerLower.includes(k))) {
    expectedGroup = 'E/C';
    expectedCodes = ['E', 'C'];
    expectedDesc = 'Quản lý & Doanh nhân (giao tiếp thuyết phục, chịu áp lực số liệu, cạnh tranh thị trường)';
  } else if (artKeywords.some(k => careerLower.includes(k))) {
    expectedGroup = 'A/S';
    expectedCodes = ['A', 'S'];
    expectedDesc = 'Nghệ thuật & Xã hội (tự do sáng tạo, ý tưởng thẩm mỹ, thấu cảm người nghe/xem)';
  } else if (socialKeywords.some(k => careerLower.includes(k))) {
    expectedGroup = 'S/I';
    expectedCodes = ['S', 'I'];
    expectedDesc = 'Xã hội & Nghiên cứu (giảng dạy, đồng hành, tư vấn, chăm sóc con người)';
  }

  const codeNames = {
    R: 'Thực tế/Kỹ thuật',
    I: 'Nghiên cứu/Phân tích',
    A: 'Nghệ thuật/Sáng tạo',
    S: 'Xã hội/Giao tiếp',
    E: 'Quản lý/Kinh doanh',
    C: 'Nghiệp vụ/Quy củ'
  };

  const userGroupStr = `${codeNames[c1] || c1}${c2 ? ' & ' + (codeNames[c2] || c2) : ''}`;

  if (!expectedGroup) {
    return `Học sinh có thiên hướng [${codes.join(', ')}] (${userGroupStr}). Cần đối chiếu xem thói quen học tập có tương thích với đặc thù thực tế của ngành ${targetCareer} hay không.`;
  }

  const isOverlap = expectedCodes.some(c => codes.includes(c));
  if (isOverlap) {
    return `Độ tương thích tương đối tốt: Tính cách nổi trội [${codes.join(', ')}] (${userGroupStr}) có nét tương đồng với đặc tính nhóm ${expectedGroup} của ngành ${targetCareer}. Cần đối chất xem học sinh có ngộ nhận giữa sở thích bề nổi và năng lực bền bỉ thực tế.`;
  } else {
    return `Lệch pha nhận thức: Tính cách đo được nổi trội là [${codes.join(', ')}] (${userGroupStr}), trong khi ngành ${targetCareer} lại đòi hỏi đặc tính môi trường nhóm ${expectedGroup} (${expectedDesc}). Nguy cơ chọn ngành theo trào lưu, mạng xã hội hoặc cảm xúc nhất thời.`;
  }
}

const HollandTest = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState(DEFAULT_HOLLAND_QUESTIONS)
  const [answers, setAnswers] = useState({})
  const [currentPage, setCurrentPage] = useState(0) // 0 to 5 for questions (5 questions/page)
  // 3 Giai đoạn cốt lõi theo đặc tả khoa học ViSEF CBAS 2026:
  // 'anchor': Giai đoạn 1 - Bộc lộ mỏ neo chủ quan (T0)
  // 'quiz': Giai đoạn 2 - Khảo sát thiên hướng khách quan (30 câu RIASEC)
  // 'result': Giai đoạn 3 - Phát hiện mâu thuẫn nhận thức & Đối chiếu kết quả
  const [stepPhase, setStepPhase] = useState('anchor')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái Form Mỏ Neo Nhận thức (Initial Anchor - Chuẩn ViSEF 2026: 4 trường bắt buộc)
  const [targetMajor, setTargetMajor] = useState('Sư phạm')
  const [targetSchool, setTargetSchool] = useState('ĐH Quy Nhơn')
  const [targetUniversity, setTargetUniversity] = useState('ĐH Quy Nhơn')
  const [reason, setReason] = useState('Em thích từ nhỏ')
  const [choiceSource, setChoiceSource] = useState('Đam mê từ nhỏ')
  const [customChoiceSource, setCustomChoiceSource] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(8) // 1-10
  const [expectedIncome, setExpectedIncome] = useState('15 - 20 triệu/tháng')
  const [calculatedRiasecCode, setCalculatedRiasecCode] = useState('')
  
  // Trạng thái kết quả sau khi nộp
  const [result, setResult] = useState(null)
  const [recommendedMajors, setRecommendedMajors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questionsPerPage = 5
  const totalQuestionPages = Math.ceil(questions.length / questionsPerPage) // 6 pages for 30 questions

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

      let hasCompleted = false

      // 2. Tải mỏ neo đã lưu từ trước (ưu tiên cbas_user_profile)
      const cachedProfile = localStorage.getItem('cbas_user_profile')
      if (cachedProfile) {
        try {
          const p = JSON.parse(cachedProfile)
          if (p.targetMajor) setTargetMajor(p.targetMajor)
          if (p.targetSchool) {
            setTargetSchool(p.targetSchool)
            setTargetUniversity(p.targetSchool)
          }
          if (p.reason) setReason(p.reason)
          if (p.initialConfidence) setConfidenceScore(Number(p.initialConfidence))
          if (p.expectedIncome) setExpectedIncome(p.expectedIncome)
          if (p.hollandCode) setCalculatedRiasecCode(p.hollandCode)
        } catch (e) {
          console.warn('Lỗi đọc cbas_user_profile:', e)
        }
      }

      const cachedAnchor = localStorage.getItem('career_initial_anchor') || localStorage.getItem('cbas_anchor_data')
      if (cachedAnchor) {
        try {
          const parsed = JSON.parse(cachedAnchor)
          if (parsed.target_major || parsed.target_career) {
            setTargetMajor(parsed.target_major || parsed.target_career)
          }
          if (parsed.target_university) {
            setTargetSchool(parsed.target_university)
            setTargetUniversity(parsed.target_university)
          }
          if (parsed.choice_source || parsed.source_of_influence) {
            setReason(parsed.choice_source || parsed.source_of_influence)
          }
          if (parsed.confidence_score_initial || parsed.confidence_score) {
            setConfidenceScore(Number(parsed.confidence_score_initial || parsed.confidence_score))
          }
          if (parsed.expected_income || parsed.expectedIncome) {
            setExpectedIncome(parsed.expected_income || parsed.expectedIncome)
          }
          if (parsed.holland_code || parsed.primary_code) {
            setCalculatedRiasecCode(parsed.holland_code || parsed.primary_code)
          }
          if (parsed.scores && (parsed.primary_code || parsed.holland_code)) {
            setResult({
              scores: parsed.scores,
              primaryCode: parsed.primary_code || parsed.holland_code,
              anchorData: parsed
            })
            hasCompleted = true
          }
        } catch (e) {
          console.warn('Lỗi đọc mỏ neo từ localStorage:', e)
        }
      }

      // Nếu đã có kết quả hoàn tất trước đó thì hiển thị kết quả (GĐ 3), nếu không bắt đầu từ GĐ 1 (Mỏ neo)
      if (hasCompleted) {
        setStepPhase('result')
      } else {
        setStepPhase('anchor')
      }
    } catch (err) {
      console.warn('Sử dụng bộ 30 câu hỏi Holland mặc định:', err)
      setQuestions(DEFAULT_HOLLAND_QUESTIONS)
      setStepPhase('anchor')
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

  const pageQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  )

  const answeredCount = Object.values(answers).filter(val => val !== null).length
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100)

  // Hàm tính toán điểm RIASEC và mã nổi trội 3 chữ cái
  const calculateRiasecCode = () => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
    questions.forEach(q => {
      const val = answers[q.id]
      if (val === 4) scores[q.category] = (scores[q.category] || 0) + 3
      else if (val === 3) scores[q.category] = (scores[q.category] || 0) + 2
      else if (val === 2) scores[q.category] = (scores[q.category] || 0) + 1
    })

    const sortedCategories = Object.keys(scores)
      .map(key => ({ category: key, score: scores[key] }))
      .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))

    const primaryCode = sortedCategories.slice(0, 3).map(item => item.category).join('')
    return { scores, primaryCode }
  }

  // XỬ LÝ GIAI ĐOẠN 1: XÁC NHẬN MỎ NEO CHỦ QUAN (T0)
  const handleConfirmAnchor = () => {
    if (!targetMajor.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập ngành nghề mục tiêu của em!' })
      return
    }
    if (!reason.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền lý do em chọn ngành nghề này!' })
      return
    }
    if (!expectedIncome) {
      setToast({ type: 'warning', message: 'Vui lòng chọn kỳ vọng mức thu nhập khởi điểm!' })
      return
    }

    const finalSchool = (targetSchool || targetUniversity || 'ĐH Quy Nhơn').trim()
    const tempProfile = {
      targetMajor: targetMajor.trim(),
      targetSchool: finalSchool,
      reason: reason.trim(),
      initialConfidence: Number(confidenceScore),
      expectedIncome: expectedIncome
    }
    const tempAnchorData = {
      target_career: tempProfile.targetMajor,
      target_university: tempProfile.targetSchool,
      source_of_influence: tempProfile.reason,
      confidence_score: String(tempProfile.initialConfidence),
      expected_income: tempProfile.expectedIncome
    }

    // Lưu tạm mỏ neo vào localStorage để bảo toàn dữ liệu
    try {
      localStorage.setItem("cbas_user_profile", JSON.stringify(tempProfile))
      localStorage.setItem("userAnchorData", JSON.stringify(tempAnchorData))
      localStorage.setItem("cbas_anchor_data", JSON.stringify(tempAnchorData))
    } catch(e) {}

    setToast({ type: 'success', message: '✓ Đã ghi nhận Mỏ neo chủ quan (T₀)! Tiếp tục thực hiện 30 câu hỏi trắc nghiệm RIASEC.' })
    setStepPhase('quiz')
    setCurrentPage(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // XỬ LÝ GIAI ĐOẠN 2: CHUYỂN TRANG CÂU HỎI
  const handleNextQuizPage = () => {
    const unanswered = pageQuestions.some(q => answers[q.id] === null)
    if (unanswered) {
      setToast({ type: 'warning', message: 'Vui lòng chọn câu trả lời cho cả 5 câu hỏi ở trang này nhé!' })
      return
    }

    if (currentPage < totalQuestionPages - 1) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Đã hoàn tất 30 câu -> Nộp bài & Phát hiện mâu thuẫn nhận thức (GĐ 3)
      handleSubmitQuizAndDetectConflict()
    }
  }

  const handleBackQuizPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Đang ở trang 0 bấm quay lại -> Trở về Form mỏ neo chủ quan T0
      setStepPhase('anchor')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    window.analyzeHollandCompatibility = analyzeHollandCompatibility;
    return () => {
      delete window.analyzeHollandCompatibility;
    };
  }, []);

  // XỬ LÝ NỘP BÀI TRẮC NGHIỆM & ĐỐI CHIẾU MÂU THUẪN NHẬN THỨC (GIAI ĐOẠN 3)
  const handleSubmitQuizAndDetectConflict = async () => {
    const unansweredCount = questions.filter(q => answers[q.id] === null).length
    if (unansweredCount > 0) {
      setToast({ 
        type: 'warning', 
        message: `Em còn ${unansweredCount} câu trắc nghiệm chưa trả lời. Vui lòng hoàn thành để hệ thống phân tích chính xác nhất!` 
      })
      return
    }

    if (!targetMajor.trim() || !reason.trim() || !expectedIncome) {
      setToast({ type: 'warning', message: 'Vui lòng kiểm tra lại thông tin mỏ neo chủ quan T0!' })
      setStepPhase('anchor')
      return
    }

    setIsSubmitting(true)
    try {
      const { scores, primaryCode } = calculateRiasecCode()
      const effectiveCode = primaryCode || calculatedRiasecCode || "AEI"
      const finalSchool = (targetSchool || targetUniversity || 'ĐH Quy Nhơn').trim()

      const userProfile = {
        hollandCode: effectiveCode,
        targetMajor: targetMajor.trim(),
        targetSchool: finalSchool,
        reason: reason.trim(),
        initialConfidence: Number(confidenceScore),
        expectedIncome: expectedIncome
      }

      const rawCodes = effectiveCode.split('').filter(c => ['R','I','A','S','E','C'].includes(c))
      const compatStatus = getCompatibilitySummary(userProfile.targetMajor, rawCodes)
      const analysisText = analyzeHollandCompatibility(userProfile.targetMajor, rawCodes)

      const userAnchorData = {
        target_career: userProfile.targetMajor,
        target_university: userProfile.targetSchool,
        source_of_influence: userProfile.reason,
        confidence_score: String(userProfile.initialConfidence),
        expected_income: userProfile.expectedIncome,
        holland_codes: rawCodes,
        holland_code: effectiveCode,
        compatibility_status: compatStatus,
        holland_analysis: analysisText
      }

      // Lưu vào LocalStorage
      localStorage.setItem("cbas_user_profile", JSON.stringify(userProfile))
      localStorage.setItem("userAnchorData", JSON.stringify(userAnchorData))
      localStorage.setItem("cbas_anchor_data", JSON.stringify(userAnchorData))
      localStorage.setItem('career_initial_anchor', JSON.stringify({
        ...userProfile,
        target_major: userProfile.targetMajor,
        target_university: userProfile.targetSchool,
        choice_source: userProfile.reason,
        confidence_score_initial: userProfile.initialConfidence,
        expected_income: userProfile.expectedIncome,
        primary_code: effectiveCode,
        scores,
        compatibility_status: compatStatus,
        holland_analysis: analysisText
      }))

      // Lưu vào CSDL Supabase (nếu có kết nối)
      try {
        if (user) {
          await supabase.from('test_results').insert({
            student_id: user.id,
            scores_json: scores,
            primary_code: effectiveCode,
            recommended_majors_json: [userProfile.targetMajor]
          })
        }
      } catch (dbErr) {
        console.warn('Lưu CSDL Supabase (sẽ dùng bộ nhớ offline):', dbErr)
      }

      setResult({
        scores,
        primaryCode: effectiveCode,
        anchorData: {
          ...userProfile,
          target_major: userProfile.targetMajor,
          target_university: userProfile.targetSchool,
          choice_source: userProfile.reason,
          confidence_score_initial: userProfile.initialConfidence,
          scores
        }
      })
      setStepPhase('result')
      setToast({ type: 'success', message: '🎉 Đã hoàn tất Bước 1! Hệ thống đã đối chiếu phát hiện mâu thuẫn nhận thức.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Lỗi nộp bài trắc nghiệm:', error)
      setToast({ type: 'error', message: 'Có lỗi xảy ra khi tính kết quả. Vui lòng thử lại!' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Chuyển sang Bước 2 (AI Tham vấn phản tư Socrates)
  const saveStep1DataAndNext = (customRedirectUrl = '/student/debias-agent') => {
    const { scores, primaryCode } = calculateRiasecCode()
    const effectiveCode = primaryCode || calculatedRiasecCode || result?.primaryCode || "AEI"
    const finalMajor = targetMajor.trim() || "Sư phạm"
    const finalSchool = (targetSchool || targetUniversity || "ĐH Quy Nhơn").trim()
    const finalReason = reason.trim() || "Em thích từ nhỏ"

    const userProfile = {
      hollandCode: effectiveCode,
      targetMajor: finalMajor,
      targetSchool: finalSchool,
      reason: finalReason,
      initialConfidence: Number(confidenceScore),
      expectedIncome: expectedIncome || "15 - 20 triệu/tháng"
    }

    const rawCodes = effectiveCode.split('').filter(c => ['R','I','A','S','E','C'].includes(c))
    const analysisText = analyzeHollandCompatibility(finalMajor, rawCodes)
    const compatStatus = getCompatibilitySummary(finalMajor, rawCodes)

    const userAnchorData = {
      target_career: finalMajor,
      target_university: finalSchool,
      source_of_influence: finalReason,
      confidence_score: String(userProfile.initialConfidence),
      expected_income: userProfile.expectedIncome,
      holland_codes: rawCodes,
      holland_code: effectiveCode,
      compatibility_status: compatStatus,
      holland_analysis: analysisText
    }

    // Lưu đồng bộ các key LocalStorage cho Bước 2 và toàn hệ thống
    localStorage.setItem("cbas_user_profile", JSON.stringify(userProfile))
    localStorage.setItem("userAnchorData", JSON.stringify(userAnchorData))
    localStorage.setItem("cbas_anchor_data", JSON.stringify(userAnchorData))
    localStorage.setItem("career_initial_anchor", JSON.stringify({
      ...userProfile,
      target_major: finalMajor,
      target_university: finalSchool,
      choice_source: finalReason,
      confidence_score_initial: userProfile.initialConfidence,
      expected_income: userProfile.expectedIncome,
      holland_codes: rawCodes,
      holland_code: effectiveCode,
      primary_code: effectiveCode,
      scores: result?.scores || scores,
      compatibility_status: compatStatus,
      holland_analysis: analysisText
    }))

    if (customRedirectUrl.startsWith('http')) {
      window.location.href = customRedirectUrl
    } else {
      navigate(customRedirectUrl)
    }
  }

  // CÁC HÀM ĐIỀU HƯỚNG VÀ LÀM LẠI
  const handleEditAnchor = () => {
    setStepPhase('anchor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleResetQuiz = () => {
    setResult(null)
    setCurrentPage(0)
    const initialAnswers = {}
    questions.forEach(q => { initialAnswers[q.id] = null })
    setAnswers(initialAnswers)
    setStepPhase('quiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setToast({ type: 'info', message: 'Em đang làm lại 30 câu hỏi trắc nghiệm RIASEC.' })
  }

  const handleResetAll = () => {
    try {
      localStorage.removeItem('cbas_user_profile')
      localStorage.removeItem('userAnchorData')
      localStorage.removeItem('cbas_anchor_data')
      localStorage.removeItem('career_initial_anchor')
    } catch (e) {}
    setTargetMajor('')
    setTargetSchool('')
    setTargetUniversity('')
    setReason('')
    setConfidenceScore(7)
    setExpectedIncome('')
    setCalculatedRiasecCode('')
    setResult(null)
    setCurrentPage(0)
    const initialAnswers = {}
    questions.forEach(q => { initialAnswers[q.id] = null })
    setAnswers(initialAnswers)
    setStepPhase('anchor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setToast({ type: 'info', message: 'Đã thiết lập lại Bước 1. Em hãy bắt đầu bằng việc khai báo mỏ neo chủ quan T₀!' })
  }

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
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
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

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-reveal">
      {/* THANH TIẾN TRÌNH 5 BƯỚC VISEF CBAS */}
      <StepProgressHeader 
        currentStep={1} 
        title="Bước 1: Trắc Nghiệm Thiên Hướng (Holland RIASEC) & Mỏ Neo T0" 
        subtitle="Ghi nhận xuất phát điểm nhận thức ban đầu (Initial Anchor) để tạo nguyên liệu cho AI phản biện ở bước sau." 
      />

      {/* KHUNG ĐỊNH HƯỚNG NGHIÊN CỨU CHUẨN VISEF 2026 (3 TRỤ CỘT CỐT LÕI) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-sm shadow-md border-2 border-indigo-400/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/40 rounded-sm text-indigo-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block">
                QUY TRÌNH CAN THIỆP HÀNH VI CBAS (VISEF 2026)
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Bước 1 — Bộc lộ mỏ neo và Khảo sát thiên hướng ban đầu (T₀)
              </h2>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full">
            3 Trụ cột cốt lõi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* TRỤ CỘT 1 */}
          <div 
            onClick={() => setStepPhase('anchor')}
            className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
              stepPhase === 'anchor'
                ? 'bg-amber-950/70 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-bold text-amber-300">
              <div className="flex items-center gap-1.5">
                <Anchor className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-[12px] font-black uppercase tracking-wide">Ghi nhận mỏ neo chủ quan</span>
              </div>
              {stepPhase === 'anchor' && (
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ĐANG MỞ</span>
              )}
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-200">
              Học sinh lập tức khai báo ngành nghề mục tiêu, mức thu nhập kỳ vọng và tự chấm điểm mức độ tự tin (<em>Conf</em>) trước khi tiếp cận bất kỳ thông tin nào khác.
            </p>
          </div>

          {/* TRỤ CỘT 2 */}
          <div 
            onClick={() => setStepPhase('quiz')}
            className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
              stepPhase === 'quiz'
                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/50 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-bold text-emerald-300">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-[12px] font-black uppercase tracking-wide">Khảo sát thiên hướng khách quan</span>
              </div>
              {stepPhase === 'quiz' && (
                <span className="text-[9px] bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ĐANG MỞ</span>
              )}
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-200">
              Thực hiện bài trắc nghiệm sở thích nghề nghiệp RIASEC (theo mô hình Holland chuẩn hóa gồm 30 câu hỏi) để xác định mã thiên hướng tự nhiên của học sinh.
            </p>
          </div>

          {/* TRỤ CỘT 3 */}
          <div 
            onClick={() => {
              if (result) {
                setStepPhase('result')
              } else {
                setToast({ type: 'warning', message: 'Vui lòng hoàn thành trắc nghiệm để mở Trụ cột 3!' })
              }
            }}
            className={`p-3.5 rounded-sm border transition-all ${result ? 'cursor-pointer' : 'opacity-85'} ${
              stepPhase === 'result'
                ? 'bg-sky-950/70 border-sky-400 text-sky-100 ring-2 ring-sky-400/50 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-bold text-sky-300">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="text-[12px] font-black uppercase tracking-wide">Phát hiện mâu thuẫn nhận thức</span>
              </div>
              {stepPhase === 'result' && (
                <span className="text-[9px] bg-sky-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ĐANG MỞ</span>
              )}
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-200">
              Hệ thống đối chiếu chéo giữa ngành mơ ước ban đầu và mã RIASEC thực tế, tạo lập cơ sở dữ liệu xung đột phục vụ truy vấn phản tư tại Bước 2.
            </p>
          </div>
        </div>
      </div>

      {/* THANH CHUYỂN ĐỔI 3 GIAI ĐOẠN TRONG BƯỚC 1 (SUB-STEP PILLS SWITCHER) */}
      <div className="bg-white border border-slate-200 p-2.5 rounded-sm shadow-2xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStepPhase('anchor')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              stepPhase === 'anchor'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>1. Mỏ neo chủ quan (T₀)</span>
          </button>

          <button
            type="button"
            onClick={() => setStepPhase('quiz')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              stepPhase === 'quiz'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>2. Trắc nghiệm 30 câu RIASEC</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
              {answeredCount}/30
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (result) {
                setStepPhase('result')
              } else {
                setToast({ type: 'warning', message: 'Vui lòng hoàn thành 30 câu hỏi trắc nghiệm để mở Giai đoạn 3!' })
              }
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              stepPhase === 'result'
                ? 'bg-sky-600 text-white shadow-xs'
                : result
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Mâu thuẫn nhận thức & Kết quả</span>
            {result && <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-black">✓ Có sẵn</span>}
          </button>
        </div>

        <div className="text-right text-[11px] font-bold text-slate-500 px-2">
          {stepPhase === 'anchor' && '🎯 Chặng 1/3: Khai báo mỏ neo T₀'}
          {stepPhase === 'quiz' && `📋 Chặng 2/3: Câu ${currentPage * 5 + 1} - ${Math.min((currentPage + 1) * 5, 30)}/30`}
          {stepPhase === 'result' && '⚡ Chặng 3/3: Đối chiếu & Chuyển tiếp'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 1: BỘC LỘ MỎ NEO CHỦ QUAN (T0)                                   */}
      {/* ========================================================================= */}
      {stepPhase === 'anchor' && (
        <div className="bg-white border-2 border-amber-300 p-6 rounded-sm space-y-6 shadow-sm animate-reveal">
          <div className="border-b border-amber-200 pb-3 flex items-start gap-3 text-amber-950">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-sm shrink-0 mt-0.5">
              <Anchor className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                GIAI ĐOẠN 1: BỘC LỘ MỎ NEO CHỦ QUAN (T₀) — VISEF 2026
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Khai báo Ngành nghề mục tiêu, Kỳ vọng thu nhập & Tự chấm điểm tự tin (Conf)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Học sinh lập tức khai báo ngành nghề mục tiêu, mức thu nhập kỳ vọng và tự chấm điểm mức độ tự tin (<em>Conf</em>) trước khi tiếp cận bất kỳ thông tin nào khác.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* TRƯỜNG 1: NGÀNH NGHỀ & TRƯỜNG MỤC TIÊU */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                1. Ngành nghề & Trường đại học mục tiêu: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    id="targetCareerInput"
                    type="text"
                    required
                    value={targetMajor}
                    onChange={(e) => setTargetMajor(e.target.value)}
                    placeholder="Ví dụ: Sư phạm, Công nghệ thông tin..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Tên ngành nghề mục tiêu</span>
                </div>
                <div>
                  <input
                    id="targetUniversityInput"
                    type="text"
                    required
                    value={targetSchool}
                    onChange={(e) => {
                      setTargetSchool(e.target.value)
                      setTargetUniversity(e.target.value)
                    }}
                    placeholder="Ví dụ: ĐH Quy Nhơn, ĐH Bách Khoa..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Trường đại học mục tiêu</span>
                </div>
              </div>

              {/* Chips gợi ý nhanh */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-slate-500 font-semibold text-[10px]">Gợi ý nhanh:</span>
                {[
                  { major: 'Sư phạm', school: 'ĐH Quy Nhơn', label: 'Sư phạm - ĐH Quy Nhơn' },
                  { major: 'Công nghệ thông tin', school: 'ĐH Bách Khoa', label: 'CNTT - ĐH Bách Khoa' },
                  { major: 'Quản trị kinh doanh', school: 'ĐH Kinh tế TP.HCM', label: 'Kinh tế - ĐH Kinh tế TP.HCM' },
                  { major: 'Ngôn ngữ Anh', school: 'ĐH Ngoại ngữ', label: 'Ngôn ngữ Anh - ĐH Ngoại ngữ' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTargetMajor(item.major)
                      setTargetSchool(item.school)
                      setTargetUniversity(item.school)
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TRƯỜNG 2: LÝ DO CHỌN NGÀNH */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                2. Lý do em chọn ngành này: <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reasonInput"
                required
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Em thích từ nhỏ, Mẹ định hướng, Thấy trên mạng bảo lương cao và nhiều cơ hội việc làm..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-sm focus:border-brand-500 focus:outline-none bg-white font-medium"
              />
              {/* Chips gợi ý nhanh lý do */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 font-semibold text-[10px]">Chọn nhanh lý do:</span>
                {[
                  'Em thích từ nhỏ',
                  'Mẹ định hướng',
                  'Thấy trên mạng bảo lương cao',
                  'Bạn bè cùng rủ chọn',
                  'Mong muốn có việc làm và thu nhập ổn định'
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(txt)}
                    className={`px-2 py-1 rounded text-[11px] border font-medium transition-colors cursor-pointer ${
                      reason === txt 
                        ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            {/* TRƯỜNG 3: MỨC ĐỘ TỰ TIN TRÚNG TUYỂN VÀ THEO NGHÈ (THANG ĐO T0) */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  3. Mức độ tự tin trúng tuyển và theo nghề (Thang đo T0: 1 - 10 điểm): <span className="text-rose-500">*</span>
                </label>
                <span className="text-sm font-black px-2.5 py-0.5 rounded-sm bg-brand-600 text-white">
                  {confidenceScore} / 10 điểm
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Đánh giá mức độ tự tin hiện tại của em trước khi tiếp cận bất kỳ thông tin nào khác:
              </p>

              {/* Slider tương tác */}
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              {/* 10 nút bấm chọn điểm 1-10 */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                  const isSelected = confidenceScore === score
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setConfidenceScore(score)}
                      className={`py-2 text-xs font-black rounded-sm border transition-all cursor-pointer ${
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
                <span>1: Rất phân vân, lo lắng</span>
                <span>5: Tương đối tự tin</span>
                <span>10: Tuyệt đối tự tin</span>
              </div>
            </div>

            {/* TRƯỜNG 4: KỲ VỌNG MỨC THU NHẬP KHỞI ĐIỂM SAU KHI RA TRƯỜNG */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                4. Kỳ vọng mức thu nhập khởi điểm sau khi ra trường: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { value: 'Dưới 10 triệu/tháng', label: '💵 Dưới 10 triệu/tháng' },
                  { value: '10 - 15 triệu/tháng', label: '💰 10 - 15 triệu/tháng' },
                  { value: '15 - 20 triệu/tháng', label: '💎 15 - 20 triệu/tháng' },
                  { value: 'Trên 20 triệu/tháng', label: '🚀 Trên 20 triệu/tháng' }
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center gap-2 p-2.5 rounded-sm border cursor-pointer transition-all ${
                      expectedIncome === item.value 
                        ? 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-bold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="expected_income"
                      value={item.value}
                      checked={expectedIncome === item.value}
                      onChange={() => setExpectedIncome(item.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hidden inputs phục vụ DOM retrieval chuẩn xác theo ID */}
            <input type="hidden" id="influenceSourceInput" value={reason} />
            <input type="hidden" id="confidenceScoreInput" value={String(confidenceScore)} />
            <input type="hidden" id="hollandResultText" value={calculatedRiasecCode || result?.primaryCode || "AEI"} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-bold">
              🎯 Hoàn thành khai báo mỏ neo chủ quan để bắt đầu 30 câu hỏi RIASEC
            </span>
            <button
              type="button"
              onClick={handleConfirmAnchor}
              className="w-full sm:w-auto py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xác nhận Mỏ neo T₀ ➔ Tiếp tục: Khảo sát RIASEC (30 câu)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 2: KHẢO SÁT THIÊN HƯỚNG KHÁCH QUAN (RIASEC 30 CÂU)              */}
      {/* ========================================================================= */}
      {stepPhase === 'quiz' && (
        <div className="space-y-5 animate-reveal">
          {/* Banner thông báo giai đoạn 2 */}
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                GIAI ĐOẠN 2: KHẢO SÁT THIÊN HƯỚNG KHÁCH QUAN (RIASEC)
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                30 Câu Hỏi Trắc Nghiệm Sở Thích Nghề Nghiệp Holland Chuẩn Hóa
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Thực hiện bài trắc nghiệm sở thích nghề nghiệp RIASEC (30 câu hỏi) để xác định mã thiên hướng tự nhiên của học sinh.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-sm border border-emerald-200 shadow-2xs block">
                Đã trả lời: {answeredCount}/30 câu ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Thanh tiến trình */}
          <div className="bg-white border border-slate-200 p-4 rounded-sm space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Tiến trình trắc nghiệm 30 câu hỏi RIASEC</span>
              <span>
                Trang {currentPage + 1} / {totalQuestionPages} ({answeredCount}/30 câu)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(answeredCount / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Danh sách 5 câu hỏi của trang */}
          <div className="space-y-4">
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

          {/* Điều hướng trang câu hỏi */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={handleBackQuizPage}
              className="text-xs font-bold uppercase tracking-wider gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentPage === 0 ? 'Quay lại Form Mỏ neo T₀' : 'Trang trước'}
            </Button>

            <span className="text-xs text-slate-500 font-bold">
              Trang {currentPage + 1} / {totalQuestionPages}
            </span>

            {currentPage === totalQuestionPages - 1 ? (
              <button
                type="button"
                onClick={handleSubmitQuizAndDetectConflict}
                disabled={isSubmitting}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang xử lý kết quả...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hoàn thành 30 câu & Đối chiếu Mâu thuẫn nhận thức ➔</span>
                  </>
                )}
              </button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNextQuizPage}
                className="text-xs font-bold uppercase tracking-wider gap-1.5"
              >
                Trang tiếp theo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 3: PHÁT HIỆN MÂU THUẪN NHẬN THỨC & ĐỐI CHIẾU KẾT QUẢ              */}
      {/* ========================================================================= */}
      {stepPhase === 'result' && result && (
        <div className="space-y-6 animate-reveal">
          {/* Banner Chúc Mừng & Tóm Tắt Bước 1 */}
          <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-sm text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                BƯỚC 1: XÁC LẬP XUẤT PHÁT ĐIỂM NHẬN THỨC THÀNH CÔNG
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
                ⚓ MỎ NEO NHẬN THỨC BAN ĐẦU (INITIAL ANCHOR T₀) ĐÃ THIẾT LẬP
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
                <span className="text-slate-500 font-semibold block text-[11px]">Ngành & Trường mục tiêu:</span>
                <p className="font-bold text-slate-900 text-sm">{result.anchorData.target_major || targetMajor}</p>
                <p className="text-slate-600 text-[11px]">{result.anchorData.target_university || targetSchool}</p>
              </div>
              <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
                <span className="text-slate-500 font-semibold block text-[11px]">Nguồn gợi mở chọn nghề:</span>
                <p className="font-bold text-amber-800 text-xs">{result.anchorData.choice_source || reason}</p>
              </div>
              <div className="bg-white p-3 rounded-sm border border-amber-200 space-y-1">
                <span className="text-slate-500 font-semibold block text-[11px]">Độ tự tin ban đầu (Conf):</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-brand-600">{result.anchorData.confidence_score_initial || confidenceScore} / 10</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold bg-brand-100 text-brand-800">
                    {(result.anchorData.confidence_score_initial || confidenceScore) >= 8 ? 'Tự tin cao' : 'Khá tự tin'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PHÂN TÍCH RIASEC: BIỂU ĐỒ RADAR KHÔNG MẤT CHỮ */}
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

          {/* KHUNG ĐẶC BIỆT: ⚡ TRỤ CỘT 3: PHÁT HIỆN MÂU THUẪN NHẬN THỨC (COGNITIVE CONFLICT DETECTION) */}
          <div className="bg-sky-50 border-2 border-sky-400 p-5 sm:p-6 rounded-sm shadow-sm space-y-4 text-sky-950">
            <div className="flex items-center gap-2.5 border-b border-sky-200 pb-3">
              <div className="p-2 bg-sky-200 text-sky-800 rounded-sm">
                <Sparkles className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block">
                  TRỤ CỘT 3: CƠ SỞ DỮ LIỆU XUNG ĐỘT (CBAS VISEF 2026)
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Phát Hiện Mâu Thuẫn Nhận Thức Giữa Mỏ Neo Chủ Quan Và Thiên Hướng Khách Quan
                </h3>
              </div>
            </div>

            <p className="text-xs text-sky-900 leading-relaxed font-semibold">
              Hệ thống đối chiếu chéo giữa ngành mơ ước ban đầu và mã RIASEC thực tế, tạo lập cơ sở dữ liệu xung đột phục vụ truy vấn phản tư tại Bước 2.
            </p>

            {/* Bảng đối chiếu chéo 2 chiều */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-white p-4 rounded border border-sky-200 space-y-2 shadow-2xs">
                <span className="text-amber-800 font-black text-[11px] block uppercase tracking-wide">
                  ⚓ Mỏ neo chủ quan ban đầu (T₀)
                </span>
                <p className="text-slate-900 font-bold text-sm">
                  {result?.anchorData?.target_major || targetMajor} ({result?.anchorData?.target_university || targetSchool})
                </p>
                <div className="space-y-1 text-slate-600 text-[11.5px] border-t border-slate-100 pt-1.5">
                  <p>• <strong>Động cơ lựa chọn:</strong> "{result?.anchorData?.choice_source || reason}"</p>
                  <p>• <strong>Độ tự tin khởi điểm (Conf):</strong> <span className="font-black text-brand-700">{result?.anchorData?.confidence_score_initial || confidenceScore}/10</span></p>
                  <p>• <strong>Kỳ vọng thu nhập:</strong> {result?.anchorData?.expected_income || expectedIncome}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-sky-200 space-y-2 shadow-2xs">
                <span className="text-emerald-800 font-black text-[11px] block uppercase tracking-wide">
                  🧭 Thiên hướng khách quan đo lường (RIASEC)
                </span>
                <p className="text-emerald-700 font-black text-base tracking-wider">
                  Mã 3 chữ cái: {result?.primaryCode || calculatedRiasecCode || 'AEI'}
                </p>
                <div className="space-y-1 text-slate-600 text-[11.5px] border-t border-slate-100 pt-1.5 leading-relaxed">
                  <p>+ <strong>Chủ đạo ({result.primaryCode[0]}):</strong> {hollandDescriptions[result.primaryCode[0]]}</p>
                  {result.primaryCode[1] && (
                    <p>+ <strong>Bổ trợ ({result.primaryCode[1]}):</strong> {hollandDescriptions[result.primaryCode[1]]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Đánh giá độ tương thích & Cảnh báo độ vênh nhận thức */}
            <div className="bg-white p-4 rounded border-2 border-sky-300 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Đánh giá sơ bộ độ tương thích & Điểm mù nhận thức:</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {analyzeHollandCompatibility(result?.anchorData?.target_major || targetMajor, (result?.primaryCode || calculatedRiasecCode || 'AEI').split(''))}
              </p>
              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-950 text-[11.5px] leading-relaxed">
                📌 <strong>Cơ sở dữ liệu xung đột cho Bước 2:</strong> Dữ liệu đối chiếu chéo này sẽ được nạp trực tiếp vào <strong>AI Phản Tư Socrates (Bước 2)</strong>. Thầy Socrates sẽ trực tiếp chất vấn các điểm mù thực tế này để kiểm chứng xem quyết định của em có vững chắc hay không!
              </div>
            </div>
          </div>

          {/* NÚT HÀNH ĐỘNG TIẾP THEO: SANG BƯỚC 2 */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl border border-slate-700/80 shadow-xl space-y-5">
            {/* Hàng trên: Tiêu đề & Thông điệp chuyển bước (Full Width) */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800/80">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Bước tiếp theo • 2 / 4
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Can thiệp phản tư hành vi (CBAS VISEF 2026)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Sẵn sàng đối diện với phản biện Socrates từ AI?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  AI sẽ dùng chính mỏ neo ngành <strong className="text-amber-300">"{result?.anchorData?.target_major || targetMajor}"</strong> và mã thiên hướng <strong className="text-emerald-300">{result?.primaryCode || calculatedRiasecCode || 'RIASEC'}</strong> để chất vấn các điểm mù thực tế của bạn.
                </p>
              </div>
            </div>

            {/* Hàng dưới: Nhóm thao tác phụ và Nút hành động chính */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 pt-1">
              {/* Cụm thao tác xem lại / làm lại */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleEditAnchor}
                  className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Chỉnh sửa lại ngành, trường, lý do chọn nghề mà không cần làm lại trắc nghiệm"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-300" />
                  <span>Chỉnh sửa Mỏ neo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Làm lại 30 câu hỏi trắc nghiệm RIASEC"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Làm lại trắc nghiệm</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-rose-900/40 hover:border-rose-800/60 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Xóa kết quả trắc nghiệm và mỏ neo để làm lại từ đầu Bước 1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Làm lại từ đầu</span>
                </button>
              </div>

              {/* Nút hành động chính: Chuyển sang Bước 2 */}
              <button
                type="button"
                onClick={() => saveStep1DataAndNext('/student/debias-agent')}
                className="py-3 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98] shrink-0"
              >
                <Bot className="w-4 h-4 text-slate-950 shrink-0" />
                <span>Hoàn Thành Bước 1 ➔ Sang Bước 2: AI Phản Tư Socrates</span>
                <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
              </button>
            </div>
          </div>
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

export default HollandTest
