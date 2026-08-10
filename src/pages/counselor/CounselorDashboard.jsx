import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import HollandChart from '../../components/common/HollandChart'
import { Calendar, User, Clipboard, FileText, Check, X, Award, HelpCircle, GraduationCap } from 'lucide-react'

const CounselorDashboard = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái modal xem chi tiết học sinh & kết quả test
  const [activeStudent, setActiveStudent] = useState(null) // { id, name, email }
  const [studentTestResult, setStudentTestResult] = useState(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  // Trạng thái modal phê duyệt/nhập ghi chú hoàn thành
  const [activeSession, setActiveSession] = useState(null) // session object
  const [counselorNotes, setCounselorNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      // Đọc các counseling_sessions dành cho counselor_id = user.id
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*, student:student_id(id, full_name, email)')
        .eq('counselor_id', user.id)
        .order('scheduled_at', { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Lỗi tải danh sách lịch hẹn:', error)
      setToast({ type: 'error', message: 'Không thể tải lịch hẹn tư vấn.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Phê duyệt nhanh lịch hẹn (chuyển sang confirmed hoặc rejected)
  const handleUpdateStatus = async (sessionId, status) => {
    try {
      const { error } = await supabase
        .from('counseling_sessions')
        .update({ status })
        .eq('id', sessionId)

      if (error) throw error

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s))
      setToast({ type: 'success', message: `Đã cập nhật trạng thái lịch hẹn thành ${status === 'confirmed' ? 'Xác nhận' : 'Từ chối'}.` })
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error)
      setToast({ type: 'error', message: 'Lỗi khi cập nhật trạng thái lịch hẹn.' })
    }
  }

  // Mở modal hoàn thành buổi tư vấn và nhập ghi chú định hướng
  const openCompleteModal = (session) => {
    setActiveSession(session)
    setCounselorNotes(session.counselor_notes || '')
  }

  const handleCompleteSession = async (e) => {
    e.preventDefault()
    if (!counselorNotes.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập ghi chú định hướng tư vấn trước khi hoàn thành!' })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('counseling_sessions')
        .update({ 
          status: 'completed',
          counselor_notes: counselorNotes
        })
        .eq('id', activeSession.id)

      if (error) throw error

      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, status: 'completed', counselor_notes: counselorNotes } : s))
      setToast({ type: 'success', message: 'Đã lưu ghi chú định hướng và hoàn thành buổi tư vấn!' })
      setActiveSession(null)
      setCounselorNotes('')
    } catch (error) {
      console.error('Lỗi hoàn thành buổi tư vấn:', error)
      setToast({ type: 'error', message: 'Không thể cập nhật buổi tư vấn.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xem kết quả trắc nghiệm của học sinh
  const viewStudentResults = async (student) => {
    setActiveStudent(student)
    setIsTestLoading(true)
    setStudentTestResult(null)
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      if (data && data.length > 0) {
        setStudentTestResult(data[0])
      }
    } catch (error) {
      console.error('Lỗi khi tải kết quả test của học sinh:', error)
    } finally {
      setIsTestLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          Dashboard Chuyên viên tư vấn Hướng nghiệp
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Quản lý các buổi hẹn tư vấn trực tiếp với học sinh, phân tích kết quả trắc nghiệm Holland và đưa ra lộ trình mục tiêu phù hợp.
        </p>
      </div>

      {/* Danh sách lịch hẹn */}
      <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
          <Clipboard className="w-4.5 h-4.5 text-brand-600" />
          Danh sách lịch hẹn phụ trách
        </h2>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-slate-200 rounded-sm"></div>
            <div className="h-20 bg-slate-200 rounded-sm"></div>
          </div>
        ) : sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Tên học sinh</th>
                  <th className="py-3 px-4">Thời gian hẹn</th>
                  <th className="py-3 px-4">Vấn đề thắc mắc</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const statusLabels = {
                    pending: 'Chờ duyệt',
                    confirmed: 'Đã xác nhận',
                    rejected: 'Từ chối',
                    completed: 'Hoàn thành'
                  }
                  const statusColors = {
                    pending: 'text-slate-600 bg-slate-100 border-slate-200',
                    confirmed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    rejected: 'text-red-700 bg-red-50 border-red-200',
                    completed: 'text-blue-700 bg-blue-50 border-blue-200'
                  }
                  return (
                    <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-xs">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => viewStudentResults(session.student)}
                          className="font-bold text-brand-600 hover:underline flex items-center gap-1.5 focus:outline-none"
                        >
                          <User className="w-3.5 h-3.5" />
                          {session.student?.full_name}
                        </button>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{session.student?.email}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {new Date(session.scheduled_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-600" title={session.student_notes}>
                        {session.student_notes}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm ${statusColors[session.status]}`}>
                          {statusLabels[session.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {session.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(session.id, 'confirmed')}
                                className="p-1 rounded-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                                title="Xác nhận lịch hẹn"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(session.id, 'rejected')}
                                className="p-1 rounded-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                title="Từ chối lịch hẹn"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {session.status === 'confirmed' && (
                            <Button 
                              onClick={() => openCompleteModal(session)} 
                              variant="primary" 
                              className="text-[10px] py-1 px-2.5 font-bold uppercase tracking-wider"
                            >
                              Tư vấn xong
                            </Button>
                          )}
                          {session.status === 'completed' && (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Đã lưu ghi chú</span>
                          )}
                          {session.status === 'rejected' && (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Đã hủy lịch</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 font-semibold py-8 text-center bg-slate-50/50 border border-slate-100 rounded-sm">
            Chưa có lịch hẹn tư vấn nào dành cho Thầy/Cô.
          </p>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT HỌC SINH & KẾT QUẢ TRẮC NGHIỆM HOLLAND */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-reveal relative">
            <button 
              onClick={() => setActiveStudent(null)} 
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-sm focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Thông tin hồ sơ hướng nghiệp</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">{activeStudent.full_name}</h3>
              <p className="text-xs text-slate-500 font-semibold">{activeStudent.email}</p>
            </div>

            {/* Thống kê Holland */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-600" />
                Kết quả trắc nghiệm Holland RIASEC gần nhất
              </h4>

              {isTestLoading ? (
                <div className="h-48 bg-slate-100 animate-pulse rounded-sm"></div>
              ) : studentTestResult ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <HollandChart scores={studentTestResult.scores_json} type="radar" />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mã Holland</span>
                      <p className="text-xl font-black text-brand-700 tracking-tight mt-1">
                        {studentTestResult.primary_code}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">
                        Ngày làm bài: {new Date(studentTestResult.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                        Ngành học gợi ý tự động:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {studentTestResult.recommended_majors_json && studentTestResult.recommended_majors_json.map((majorName, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-[10px] font-bold bg-brand-50 border border-brand-200 text-brand-700 rounded-sm">
                            {majorName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Học sinh chưa thực hiện bài trắc nghiệm tính cách Holland nào trong hệ thống.</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setActiveStudent(null)} className="text-xs font-bold px-4 py-2 uppercase">Đóng</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HOÀN THÀNH BUỔI TƯ VẤN & NHẬP GHI CHÚ ĐỊNH HƯỚNG */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm w-full max-w-lg p-6 space-y-4 animate-reveal relative">
            <button 
              onClick={() => setActiveSession(null)} 
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-sm focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-brand-600" />
                Ghi chú Định hướng Tư vấn
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Nhập phản hồi, tài liệu học tập, hoặc lời khuyên hướng nghiệp gửi trực tiếp tới học sinh <span className="font-bold text-slate-700">{activeSession.student?.full_name}</span>.
              </p>
            </div>

            <form onSubmit={handleCompleteSession} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nội dung câu hỏi của học sinh:</label>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-150 p-2.5 rounded-sm italic leading-relaxed">
                  "{activeSession.student_notes}"
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhập ghi chú / Lời khuyên định hướng của Thầy Cô:</label>
                <textarea
                  required
                  rows={5}
                  value={counselorNotes}
                  onChange={(e) => setCounselorNotes(e.target.value)}
                  placeholder="Ví dụ: Em nên tập trung ôn tập khối thi D01, cải thiện điểm số môn Tiếng Anh và có thể đăng ký thi IELTS vào cuối năm lớp 11 để tăng cơ hội xét tuyển sớm..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setActiveSession(null)} className="text-xs py-1.5 px-3">Hủy</Button>
                <Button type="submit" isLoading={isSubmitting} variant="primary" className="text-xs py-1.5 px-4 font-bold uppercase">Hoàn thành buổi tư vấn</Button>
              </div>
            </form>
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

export default CounselorDashboard
