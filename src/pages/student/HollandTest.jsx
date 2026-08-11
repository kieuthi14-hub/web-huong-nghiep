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
  AlertTriangle,
  Lightbulb 
} from 'lucide-react'

const HollandTest = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)
  
  // Trạng thái kết quả
  const [result, setResult] = useState(null)
  const [recommendedMajors, setRecommendedMajors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questionsPerPage = 5

  useEffect(() => {
    fetchTest()
  }, [])

  // Tải bộ đề trắc nghiệm thuần 100% từ bảng career_tests của Supabase DB
  const fetchTest = async () => {
    setIsLoading(true)
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('career_tests')
        .select('*')
        .eq('type', 'holland')
        .maybeSingle()

      if (error || !data) {
        setDbError('Chưa nạp bộ đề trắc nghiệm Holland trong CSDL Supabase. Thầy vui lòng thực thi file schema.sql trong SQL Editor của Supabase để tải dữ liệu thực.')
        setTest(null)
        setQuestions([])
      } else {
        setTest(data)
        const qList = data.questions_json || []
        setQuestions(qList)
        const initialAnswers = {}
        qList.forEach(q => { initialAnswers[q.id] = null })
        setAnswers(initialAnswers)
      }
    } catch (error) {
      console.error('Lỗi khi lấy bộ đề Holland từ Supabase DB:', error)
      setDbError('Không thể kết nối đến cơ sở dữ liệu Supabase.')
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

  const totalPages = Math.ceil(questions.length / questionsPerPage)
  const pageQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  )

  const handleNext = () => {
    const unanswered = pageQuestions.some(q => answers[q.id] === null)
    if (unanswered) {
      setToast({ type: 'warning', message: 'Vui lòng chọn phản hồi cho toàn bộ câu hỏi ở trang này!' })
      return
    }
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  // Nộp bài và lưu thuần 100% vào Supabase DB
  const handleSubmit = async () => {
    const unansweredIds = Object.keys(answers).filter(id => answers[id] === null)
    if (unansweredIds.length > 0) {
      setToast({ type: 'warning', message: 'Vui lòng hoàn thành toàn bộ bài trắc nghiệm!' })
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Tính toán điểm RIASEC dựa trên thang đo 4 mức Likert (1=0đ, 2=1đ, 3=2đ, 4=3đ)
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

      // 3. Gợi ý ngành học phù hợp từ bảng majors trong Supabase
      let matchMajors = []
      const { data: majorsData } = await supabase.from('majors').select('*')
      if (majorsData && majorsData.length > 0) {
        matchMajors = majorsData
          .map(major => {
            const matchCount = (major.holland_codes || []).filter(code => primaryCode.includes(code)).length
            return { ...major, matchCount }
          })
          .filter(major => major.matchCount > 0)
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 4)
      }

      const recommendedMajorsNames = matchMajors.map(m => m.name)

      // 4. Lưu trực tiếp kết quả vào bảng test_results trong Supabase DB
      if (user && test?.id) {
        const { error: insertErr } = await supabase
          .from('test_results')
          .insert({
            student_id: user.id,
            test_id: test.id,
            scores_json: scores,
            primary_code: primaryCode,
            recommended_majors_json: recommendedMajorsNames
          })

        if (insertErr) {
          console.error('Lỗi khi ghi kết quả vào Supabase test_results:', insertErr)
          setToast({ type: 'error', message: 'Lỗi khi lưu kết quả vào Supabase Database.' })
          return
        }
      }

      setResult({
        scores,
        primaryCode,
        recommendedMajorsNames
      })
      setRecommendedMajors(matchMajors)
      setToast({ type: 'success', message: 'Nộp bài trắc nghiệm thành công và đã lưu vào Supabase!' })
      window.scrollTo(0, 0)
    } catch (error) {
      console.error('Lỗi tính toán bài test:', error)
      setToast({ type: 'error', message: 'Lỗi tính toán kết quả trắc nghiệm.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setRecommendedMajors([])
    setCurrentPage(0)
    fetchTest()
  }

  const answeredCount = Object.values(answers).filter(val => val !== null).length
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100)

  const getHollandDescription = (code) => {
    const descriptions = {
      R: 'Kỹ thuật (Realistic): Thích làm việc với công cụ, máy móc, bản vẽ kỹ thuật, động thực vật hoặc các hoạt động thể chất ngoài trời.',
      I: 'Nghiên cứu (Investigative): Thích quan sát, tìm hiểu, phân tích, đánh giá và giải quyết các vấn đề học thuật hoặc logic phức tạp.',
      A: 'Nghệ thuật (Artistic): Thích làm việc sáng tạo, giàu trí tưởng tượng, độc lập, không rập khuôn và thể hiện bản thân qua nghệ thuật.',
      S: 'Xã hội (Social): Thích giúp đỡ, hỗ trợ, giảng dạy, chăm sóc người khác hoặc tham gia các hoạt động cộng đồng, xã hội.',
      E: 'Quản lý (Enterprising): Thích thuyết phục, dẫn dắt, quản lý, kinh doanh, sẵn sàng mạo hiểm và hướng tới mục tiêu hiệu quả kinh tế.',
      C: 'Nghiệp vụ (Conventional): Thích làm việc với số liệu, quy trình rõ ràng, cẩn thận, sắp xếp hệ thống và chú trọng chi tiết.'
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

  // Thông báo nếu DB chưa có dữ liệu bộ đề
  if (dbError || !test) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-reveal">
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-amber-900">Chưa nạp dữ liệu bộ đề trong Supabase Database</h2>
          <p className="text-xs text-amber-800 leading-relaxed max-w-lg mx-auto">
            {dbError}
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={fetchTest} className="text-xs font-bold uppercase py-2 px-6">
              Thử lại kết nối Supabase
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Giao diện hiển thị kết quả sau khi nộp
  if (result) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-8 animate-reveal">
        <div className="text-center space-y-3 bg-emerald-50 border border-emerald-100 p-8 rounded-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hoàn thành trắc nghiệm Holland!</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Kết quả đã được lưu trực tiếp vào Supabase Database của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Biểu đồ */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Biểu đồ nhóm tính cách
            </h3>
            <HollandChart scores={result.scores} type="radar" />
          </div>

          {/* Phân tích mã */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-brand-600" />
                Mã Holland nổi trội của bạn
              </h3>
              <p className="text-3xl font-black text-brand-600 tracking-tight">
                {result.primaryCode}
              </p>
              <div className="space-y-2 pt-2">
                {getHollandDescription(result.primaryCode).map((desc, idx) => (
                  <p key={idx} className="text-xs text-slate-600 font-semibold leading-relaxed">
                    • {desc}
                  </p>
                ))}
              </div>
            </div>

            {/* Ngành học gợi ý */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-brand-600" />
                Gợi ý ngành học phù hợp nhất từ Supabase DB
              </h3>
              {recommendedMajors.length > 0 ? (
                <div className="space-y-3">
                  {recommendedMajors.map(major => (
                    <div key={major.id} className="p-3 border border-slate-100 bg-slate-50 hover:border-brand-200 rounded-sm transition-all flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{major.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-sm">
                            {major.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase">
                            Holland: {(major.holland_codes || []).join(', ')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/student/debias-matrix?major=${encodeURIComponent(major.name)}`)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-sm transition-all flex items-center gap-1 shadow-sm flex-shrink-0"
                        title="Đưa ngành học này vào Bảng Phản Tư để phân tích rủi ro"
                      >
                        🧠 Phản tư ngay
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Chưa có ngành học tương ứng trong CSDL Supabase.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="secondary" onClick={handleReset} className="font-bold py-2.5 px-6 uppercase text-xs tracking-wider gap-2">
            <RefreshCw className="w-4 h-4" />
            Làm lại bài test
          </Button>
          <a href="/student/dashboard">
            <Button variant="primary" className="font-bold py-2.5 px-6 uppercase text-xs tracking-wider">
              Về bảng điều khiển
            </Button>
          </a>
        </div>
      </div>
    )
  }

  // Giao diện làm bài trắc nghiệm
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-600" />
          {test?.title}
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          {test?.description}
        </p>
      </div>

      {/* Khung Lời Nhắc Phản Tư (Metacognitive Prompt) */}
      <div className="bg-blue-50 border border-blue-200 text-blue-950 p-4 rounded-sm flex items-start gap-3 shadow-sm">
        <div className="p-1.5 bg-blue-500 text-white rounded-sm flex-shrink-0 mt-0.5">
          <Lightbulb className="w-4.5 h-4.5" />
        </div>
        <p className="text-xs font-semibold leading-relaxed text-blue-950">
          <span className="font-bold text-blue-900">💡 Lời khuyên Phản tư:</span> Hãy chọn câu trả lời dựa trên trải nghiệm và năng lực <span className="font-bold uppercase underline">THỰC TẾ</span> bạn đã từng làm, tránh trả lời theo "hình mẫu mơ ước" hoặc cảm xúc nhất thời.
        </p>
      </div>

      {/* Tiến độ ProgressBar */}
      <div className="space-y-2 bg-white border border-slate-200 p-4 rounded-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Tiến trình hoàn thành</span>
          <span>{isNaN(progressPercent) ? 0 : progressPercent}% ({answeredCount}/{questions.length} câu)</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-sm overflow-hidden border border-slate-200">
          <div 
            className="bg-brand-500 h-full transition-all duration-300"
            style={{ width: `${isNaN(progressPercent) ? 0 : progressPercent}%` }}
          />
        </div>
      </div>

      {/* Danh sách câu hỏi của trang hiện tại */}
      <div className="space-y-6">
        {pageQuestions.map((q, idx) => {
          const globalIdx = currentPage * questionsPerPage + idx + 1
          return (
            <div 
              key={q.id} 
              className="bg-white border border-slate-200 p-5 rounded-sm space-y-4 hover:border-slate-300 transition-colors animate-reveal"
            >
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                Câu {globalIdx}: {q.text}
              </p>
              
              {/* Thang đo 4 tùy chọn Likert Scale */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
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
                      className={`py-2.5 px-3 border text-xs font-bold rounded-sm transition-all focus:outline-none text-center ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm ring-2 ring-brand-300'
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

      {/* Điều hướng trang */}
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
          Trang {currentPage + 1} / {totalPages || 1}
        </span>

        {currentPage === (totalPages || 1) - 1 ? (
          <Button
            variant="accent"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="text-xs font-bold uppercase tracking-wider"
          >
            Nộp bài thi
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            className="text-xs font-bold uppercase tracking-wider gap-1.5"
          >
            Tiếp theo
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
