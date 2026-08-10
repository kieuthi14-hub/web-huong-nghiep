import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { CalendarDays, Send, Clock, User, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'

const CounselingBooking = () => {
  const { user } = useAuth()
  const [counselors, setCounselors] = useState([])
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái Form
  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCounselors()
      fetchSessions()
    }
  }, [user])

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('role', 'counselor')

      if (error) throw error
      setCounselors(data || [])
      if (data && data.length > 0) {
        setSelectedCounselor(data[0].id)
      }
    } catch (error) {
      console.error('Lỗi khi tải chuyên viên tư vấn:', error)
    }
  }

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*, counselor:counselor_id(full_name, email, avatar_url)')
        .eq('student_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Lỗi tải danh sách lịch hẹn:', error)
      setToast({ type: 'error', message: 'Không thể tải lịch hẹn tư vấn.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!selectedCounselor || !scheduledAt || !studentNotes) {
      setToast({ type: 'error', message: 'Vui lòng chọn chuyên viên, thời gian và đặt câu hỏi!' })
      return
    }

    // Đảm bảo thời gian đặt lớn hơn thời gian hiện tại
    if (new Date(scheduledAt) <= new Date()) {
      setToast({ type: 'error', message: 'Thời gian tư vấn phải lớn hơn thời điểm hiện tại!' })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .insert({
          student_id: user.id,
          counselor_id: selectedCounselor,
          scheduled_at: scheduledAt,
          status: 'pending',
          student_notes: studentNotes
        })
        .select('*, counselor:counselor_id(full_name, email, avatar_url)')
        .single()

      if (error) throw error

      setSessions(prev => [data, ...prev])
      setToast({ type: 'success', message: 'Đăng ký lịch hẹn tư vấn thành công!' })
      setStudentNotes('')
      setScheduledAt('')
    } catch (error) {
      console.error('Lỗi đăng ký tư vấn:', error)
      setToast({ type: 'error', message: 'Không thể đăng ký lịch tư vấn.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
      confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse-glow',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-blue-50 text-blue-700 border-blue-200'
    }
    const labels = {
      pending: 'Chờ phê duyệt',
      confirmed: 'Đã xác nhận',
      rejected: 'Từ chối',
      completed: 'Đã hoàn thành'
    }
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-reveal">
      {/* Cột Trái: Form Đăng ký lịch tư vấn */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand-600" />
              Đặt lịch tư vấn 1-1
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Gặp gỡ Chuyên viên/Giáo viên hướng nghiệp để tháo gỡ khó khăn định hướng.
            </p>
          </div>

          <form onSubmit={handleBooking} className="space-y-4 pt-2">
            {/* Chọn chuyên viên */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Chọn chuyên viên</label>
              <select
                required
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-600"
              >
                {counselors.length > 0 ? (
                  counselors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có chuyên viên nào</option>
                )}
              </select>
            </div>

            {/* Chọn thời gian */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Thời gian hẹn</label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
              />
            </div>

            {/* Vấn đề cần giải đáp */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Vấn đề / Câu hỏi cần giải đáp</label>
              <textarea
                required
                rows={4}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Ví dụ: Em phân vân giữa ngành CNTT của Bách Khoa và Công nghệ phần mềm của KHTN..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
              />
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full py-2.5 text-xs font-bold tracking-wide uppercase gap-2"
              disabled={counselors.length === 0}
            >
              Gửi yêu cầu đặt lịch
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Cột Giữa & Phải: Danh sách lịch hẹn */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-brand-600" />
            Lịch sử yêu cầu tư vấn
          </h2>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-200 rounded-sm"></div>
              <div className="h-24 bg-slate-200 rounded-sm"></div>
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 border border-slate-100 bg-slate-50/50 hover:bg-white rounded-sm space-y-3.5 transition-all">
                  {/* Status & Date */}
                  <div className="flex items-center justify-between gap-4">
                    {getStatusBadge(session.status)}
                    <span className="text-xs font-semibold text-slate-400">
                      Thời gian: {new Date(session.scheduled_at).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Counselor Info */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-500">Chuyên viên phụ trách:</span>
                    <span className="font-bold text-slate-700">{session.counselor?.full_name}</span>
                  </div>

                  {/* Notes mapping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Yêu cầu của bạn:</span>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-sm">
                        {session.student_notes}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phản hồi / Ghi chú từ Chuyên viên:</span>
                      {session.counselor_notes ? (
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-sm">
                          {session.counselor_notes}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-white border border-slate-100 p-2.5 rounded-sm">
                          Chưa có phản hồi từ chuyên viên tư vấn.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-500 font-semibold">
              Bạn chưa đăng ký tư vấn lần nào. Hãy hoàn thành biểu mẫu bên trái để đặt lịch.
            </div>
          )}
        </div>
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

export default CounselingBooking
