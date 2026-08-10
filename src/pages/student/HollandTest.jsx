import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import HollandChart from '../../components/common/HollandChart'
import { ClipboardList, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Award, GraduationCap } from 'lucide-react'

// Bộ 30 câu hỏi Holland RIASEC dự phòng (Fallback Data)
const fallbackQuestions = [
  { id: 1, text: "Tôi thích tự tay lắp ráp đồ đạc, sửa chữa máy móc hoặc các thiết bị điện trong gia đình.", category: "R" },
  { id: 2, text: "Tôi thích các công việc vận động thể chất ngoài trời hoặc làm việc thực địa hơn là ngồi văn phòng.", category: "R" },
  { id: 3, text: "Tôi thích sử dụng các công cụ cầm tay, máy cơ khí hoặc vận hành xe cộ.", category: "R" },
  { id: 4, text: "Tôi thích tham gia hoạt động làm vườn, chăn nuôi hoặc trồng trọt.", category: "R" },
  { id: 5, text: "Tôi cảm thấy hứng thú khi giải quyết các vấn đề kỹ thuật thực tế.", category: "R" },
  
  { id: 6, text: "Tôi thích tìm hiểu các hiện tượng tự nhiên, làm thí nghiệm hóa học hoặc vật lý.", category: "I" },
  { id: 7, text: "Tôi thích giải quyết các bài toán hóc búa, câu đố logic phức tạp.", category: "I" },
  { id: 8, text: "Tôi thích nghiên cứu về lập trình, thuật toán máy tính hoặc cấu trúc dữ liệu.", category: "I" },
  { id: 9, text: "Tôi thích đọc các tài liệu khoa học, bài viết phân tích chuyên sâu về công nghệ.", category: "I" },
  { id: 10, text: "Tôi thích tìm ra bản chất nguyên nhân của một vấn đề khoa học.", category: "I" },
  
  { id: 11, text: "Tôi thích vẽ tranh, phác thảo thiết kế thời trang hoặc đồ họa số.", category: "A" },
  { id: 12, text: "Tôi thích viết lách như sáng tác truyện ngắn, thơ ca hoặc viết blog chia sẻ cảm xúc.", category: "A" },
  { id: 13, text: "Tôi thích chơi nhạc cụ, ca hát hoặc tham gia các hoạt động biểu diễn văn nghệ.", category: "A" },
  { id: 14, text: "Tôi thường nảy ra nhiều ý tưởng trang trí phòng ốc sáng tạo, phá cách.", category: "A" },
  { id: 15, text: "Tôi đánh giá cao vẻ đẹp của nghệ thuật kiến trúc, điện ảnh độc lập.", category: "A" },
  
  { id: 16, text: "Tôi thích giúp đỡ, chăm sóc người khác hoặc tham gia công tác xã hội, từ thiện.", category: "S" },
  { id: 17, text: "Tôi thích giảng dạy, hướng dẫn hoặc truyền đạt kiến thức mới cho bạn bè.", category: "S" },
  { id: 18, text: "Tôi thích tổ chức sự kiện, gắn kết mọi người và điều phối hoạt động đội nhóm.", category: "S" },
  { id: 19, text: "Tôi thích lắng nghe tâm sự, tư vấn và giúp người khác vượt qua khủng hoảng tâm lý.", category: "S" },
  { id: 20, text: "Tôi thích môi trường làm việc cộng đồng, hợp tác thân thiện thay vì cạnh tranh.", category: "S" },
  
  { id: 21, text: "Tôi thích thuyết phục người khác đồng ý với quan điểm cá nhân hoặc ủng hộ dự án của mình.", category: "E" },
  { id: 22, text: "Tôi muốn tự khởi nghiệp kinh doanh, mở cửa hàng hoặc thành lập công ty riêng.", category: "E" },
  { id: 23, text: "Tôi tự tin đảm nhận vai trò trưởng nhóm để điều phối, phân công công việc cho tập thể.", category: "E" },
  { id: 24, text: "Tôi thích tham gia vào quá trình thương lượng, đàm phán hợp đồng hoặc lên chiến dịch marketing.", category: "E" },
  { id: 25, text: "Tôi cảm thấy thoải mái khi trình bày ý kiến, thuyết trình trước đám đông.", category: "E" },
  
  { id: 26, text: "Tôi thích phân loại dữ liệu, sắp xếp hồ sơ, giấy tờ ngăn nắp và có hệ thống.", category: "C" },
  { id: 27, text: "Tôi thích làm việc với các con số, tính toán chi phí và xây dựng bảng tính Excel.", category: "C" },
  { id: 28, text: "Tôi thích tuân thủ một quy trình công việc có hướng dẫn và tiêu chuẩn rõ ràng.", category: "C" },
  { id: 29, text: "Tôi thích kiểm tra tính chính xác của hóa đơn, hợp đồng tài chính.", category: "C" },
  { id: 30, text: "Tôi là người cẩn thận, chú trọng đến từng chi tiết nhỏ trong công việc hàng ngày.", category: "C" }
]

const HollandTest = () => {
  const { user } = useAuth()
  
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  // Trạng thái kết quả
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
        .maybeSingle()

      if (error || !data) {
        console.warn('Chưa tìm thấy bộ đề trong DB (có thể chưa chạy schema.sql), kích hoạt bộ câu hỏi fallback:', error)
        const mockTest = {
          id: '00000000-0000-0000-0000-000000000000',
          title: 'Trắc nghiệm tính cách nghề nghiệp Holland (RIASEC)',
          description: 'Khám phá thế giới nghề nghiệp thông qua 6 nhóm tính cách đặc trưng: Kỹ thuật (R), Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E) và Nghiệp vụ (C). Hãy trả lời thành thật với sở thích của bản thân.',
          type: 'holland',
          questions_json: fallbackQuestions
        }
        setTest(mockTest)
        setQuestions(fallbackQuestions)
        const initialAnswers = {}
        fallbackQuestions.forEach(q => { initialAnswers[q.id] = null })
        setAnswers(initialAnswers)
      } else {
        setTest(data)
        const qList = data.questions_json || fallbackQuestions
        setQuestions(qList)
        const initialAnswers = {}
        qList.forEach(q => { initialAnswers[q.id] = null })
        setAnswers(initialAnswers)
      }
    } catch (error) {
      console.warn('Lỗi khi fetch test, dùng fallback:', error)
      const mockTest = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Trắc nghiệm tính cách nghề nghiệp Holland (RIASEC)',
        description: 'Khám phá thế giới nghề nghiệp thông qua 6 nhóm tính cách đặc trưng.',
        type: 'holland',
        questions_json: fallbackQuestions
      }
      setTest(mockTest)
      setQuestions(fallbackQuestions)
      const initialAnswers = {}
      fallbackQuestions.forEach(q => { initialAnswers[q.id] = null })
      setAnswers(initialAnswers)
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
        .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))

      const primaryCode = sortedCategories.slice(0, 3).map(item => item.category).join('')

      // 3. Gợi ý ngành học phù hợp
      let matchMajors = []
      try {
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
      } catch (err) {
        console.warn('Lỗi lấy ngành học từ DB:', err)
      }

      // Nếu DB rỗng, gợi ý ngành fallback
      if (matchMajors.length === 0) {
        matchMajors = [
          { id: 'm1', name: 'Khoa học Máy tính & Công nghệ Thông tin', category: 'Kỹ thuật - Công nghệ', holland_codes: ['I', 'R', 'C'] },
          { id: 'm2', name: 'Quản trị Kinh doanh', category: 'Kinh tế - Quản lý', holland_codes: ['E', 'S', 'C'] },
          { id: 'm3', name: 'Thiết kế Đồ họa & Truyền thông Đa phương tiện', category: 'Nghệ thuật - Thiết kế', holland_codes: ['A', 'I', 'R'] }
        ]
      }

      const recommendedMajorsNames = matchMajors.map(m => m.name)

      // 4. Lưu kết quả vào DB test_results (Thử lưu, nếu DB chưa có bảng thì bỏ qua lỗi không ném crash)
      if (user && test?.id && test.id !== '00000000-0000-0000-0000-000000000000') {
        try {
          await supabase
            .from('test_results')
            .insert({
              student_id: user.id,
              test_id: test.id,
              scores_json: scores,
              primary_code: primaryCode,
              recommended_majors_json: recommendedMajorsNames
            })
        } catch (dbErr) {
          console.warn('Không thể ghi kết quả vào DB (có thể do FK constraint hoặc RLS):', dbErr)
        }
      }

      setResult({
        scores,
        primaryCode,
        recommendedMajorsNames
      })
      setRecommendedMajors(matchMajors)
      setToast({ type: 'success', message: 'Nộp bài trắc nghiệm thành công!' })
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
                          Holland: {(major.holland_codes || []).join(', ')}
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
