import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import HollandChart from '../../components/common/HollandChart'
import { ClipboardList, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Award, GraduationCap } from 'lucide-react'

const HollandTest = () => {
  const { user } = useAuth()
  
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) // { questionId: boolean }
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  // Trạng thái kết quả sau khi nộp
  const [result, setResult] = useState(null)
  const [recommendedMajors, setRecommendedMajors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questionsPerPage = 5

  useEffect(() => {
    fetchTest()
  }, [])

  const fetchTest = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('career_tests')
        .select('*')
        .eq('type', 'holland')
        .single()

      if (error) throw error
      setTest(data)
      setQuestions(data.questions_json || [])
      
      // Reset answers
      const initialAnswers = {}
      data.questions_json.forEach(q => {
        initialAnswers[q.id] = null // null means unanswered, true = Yes, false = No
      })
      setAnswers(initialAnswers)
    } catch (error) {
      console.error('Lỗi khi tải bộ đề trắc nghiệm:', error)
      setToast({ type: 'error', message: 'Không thể tải bộ câu hỏi trắc nghiệm Holland.' })
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
    // Kiểm tra xem đã trả lời hết câu hỏi trang hiện tại chưa
    const unanswered = pageQuestions.some(q => answers[q.id] === null)
    if (unanswered) {
      setToast({ type: 'warning', message: 'Vui lòng trả lời toàn bộ câu hỏi ở trang này!' })
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

  // Tính toán điểm và nộp bài
  const handleSubmit = async () => {
    // Kiểm tra tất cả câu hỏi đã được trả lời chưa
    const unansweredIds = Object.keys(answers).filter(id => answers[id] === null)
    if (unansweredIds.length > 0) {
      setToast({ type: 'warning', message: 'Vui lòng hoàn thành toàn bộ bài trắc nghiệm!' })
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Tính toán điểm RIASEC
      const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
      questions.forEach(q => {
        if (answers[q.id] === true) {
          scores[q.category] = (scores[q.category] || 0) + 1
        }
      })

      // 2. Tìm mã Holland (3 nhóm điểm cao nhất)
      const sortedCategories = Object.keys(scores)
        .map(key => ({ category: key, score: scores[key] }))
        .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category)) // Nếu bằng điểm thì xếp theo alphabet

      const primaryCode = sortedCategories.slice(0, 3).map(item => item.category).join('')

      // 3. Gợi ý ngành học phù hợp từ DB (fetch toàn bộ majors và lọc)
      const { data: majorsData } = await supabase.from('majors').select('*')
      
      // Thuật toán lọc ngành học: ngành nào có chứa ít nhất 1 chữ cái trong mã Holland
      // Và ưu tiên sắp xếp theo số lượng chữ cái trùng khớp
      const matchMajors = (majorsData || [])
        .map(major => {
          const matchCount = major.holland_codes.filter(code => primaryCode.includes(code)).length
          return { ...major, matchCount }
        })
        .filter(major => major.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 4) // Lấy top 4 ngành phù hợp nhất

      const recommendedMajorsNames = matchMajors.map(m => m.name)

      // 4. Lưu kết quả vào DB test_results
      const { data: savedResult, error: saveError } = await supabase
        .from('test_results')
        .insert({
          student_id: user.id,
          test_id: test.id,
          scores_json: scores,
          primary_code: primaryCode,
          recommended_majors_json: recommendedMajorsNames
        })
        .select()
        .single()

      if (saveError) throw saveError

      setResult({
        scores,
        primaryCode,
        recommendedMajorsNames
      })
      setRecommendedMajors(matchMajors)
      setToast({ type: 'success', message: 'Nộp bài trắc nghiệm thành công!' })
      window.scrollTo(0, 0)
    } catch (error) {
      console.error('Lỗi khi lưu kết quả:', error)
      setToast({ type: 'error', message: 'Lỗi lưu kết quả trắc nghiệm vào cơ sở dữ liệu.' })
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

  // Tính phần trăm tiến trình làm bài
  const answeredCount = Object.values(answers).filter(val => val !== null).length
  const progressPercent = Math.round((answeredCount / questions.length) * 100)

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
            Hệ thống đã phân tích câu trả lời của bạn để xây dựng biểu đồ năng lực nghề nghiệp RIASEC.
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
                Gợi ý ngành học phù hợp nhất
              </h3>
              {recommendedMajors.length > 0 ? (
                <div className="space-y-3">
                  {recommendedMajors.map(major => (
                    <div key={major.id} className="p-3 border border-slate-100 bg-slate-50 hover:border-brand-200 rounded-sm transition-all">
                      <p className="text-xs font-bold text-slate-800">{major.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-sm">
                          {major.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">
                          Holland: {major.holland_codes.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Chưa tìm thấy ngành học tương ứng với mã Holland của bạn trong CSDL.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="secondary" onClick={handleReset} className="font-bold py-2.5 px-6 uppercase text-xs tracking-wider gap-2">
            <RefreshCw className="w-4 h-4" />
            Làm lại bài test
          </Button>
          <Link to="/student/dashboard">
            <Button variant="primary" className="font-bold py-2.5 px-6 uppercase text-xs tracking-wider">
              Về bảng điều khiển
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Giao diện làm bài trắc nghiệm
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-600" />
          {test?.title}
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          {test?.description}
        </p>
      </div>

      {/* Tiến độ ProgressBar */}
      <div className="space-y-2 bg-white border border-slate-200 p-4 rounded-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Tiến trình hoàn thành</span>
          <span>{progressPercent}% ({answeredCount}/{questions.length} câu)</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-sm overflow-hidden border border-slate-200">
          <div 
            className="bg-brand-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
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
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleAnswerSelect(q.id, true)}
                  className={`px-6 py-2 border text-xs font-bold rounded-sm transition-all focus:outline-none ${
                    answers[q.id] === true
                      ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Đúng
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswerSelect(q.id, false)}
                  className={`px-6 py-2 border text-xs font-bold rounded-sm transition-all focus:outline-none ${
                    answers[q.id] === false
                      ? 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sai (Không đúng)
                </button>
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
          Trang {currentPage + 1} / {totalPages}
        </span>

        {currentPage === totalPages - 1 ? (
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
