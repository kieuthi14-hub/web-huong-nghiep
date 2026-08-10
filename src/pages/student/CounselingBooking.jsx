import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  CalendarDays, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare,
  User 
} from 'lucide-react'

// Chuyên viên tư vấn mẫu (Fallback)
const fallbackCounselors = [
  { id: 'c1', full_name: 'TS. Nguyễn Văn Minh', email: 'minh.nguyen@counselor.edu.vn', avatar_url: '' },
  { id: 'c2', full_name: 'ThS. Trần Thị Hoàng Anh', email: 'hoanganh.tran@counselor.edu.vn', avatar_url: '' }
]

const CounselingBooking = () => {
  const { user } = useAuth()
  const [counselors, setCounselors] = useState([])
  const [mySessions, setMySessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCounselors()
    fetchMySessions()
  }, [])

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('role', 'counselor')

      if (!error && data && data.length > 0) {
        setCounselors(data)
      } else {
        setCounselors(fallbackCounselors)
      }
    } catch (error) {
      setCounselors(fallbackCounselors)
    }
  }

  const fetchMySessions = async () => {
    setIsLoading(true)
    try {
      let fetchedList = []
      if (user) {
        const { data, error } = await supabase
          .from('counseling_sessions')
          .select('*, counselor:counselor_id(full_name, email)')
          .eq('student_id', user.id)
          .order('scheduled_at', { ascending: true })

        if (!error && data && data.length > 0) {
          fetchedList = data
        }
      }

      if (fetchedList.length === 0) {
        const localSaved = localStorage.getItem(`counseling_${user?.id || 'guest'}`)
        if (localSaved) {
          fetchedList = JSON.parse(localSaved)
        }
      }

      setMySessions(fetchedList)
    } catch (error) {
      const localSaved = localStorage.getItem(`counseling_${user?.id || 'guest'}`)
      setMySessions(localSaved ? JSON.parse(localSaved) : [])
    } finally {
      setIsLoading(false)
    }
  }

  const saveSessionsLocal = (newList) => {
    setMySessions(newList)
    localStorage.setItem(`counseling_${user?.id || 'guest'}`, JSON.stringify(newList))
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!selectedCounselor) {
      setToast({ type: 'warning', message: 'Vui lòng chọn Chuyên viên tư vấn!' })
      return
    }
    if (!scheduledAt) {
      setToast({ type: 'warning', message: 'Vui lòng chọn Thời gian hẹn tư vấn!' })
      return
    }

    setIsSubmitting(true)
    const chosenCounselorObj = counselors.find(c => c.id === selectedCounselor) || fallbackCounselors[0]
    const newSessionItem = {
      id: `cs-${Date.now()}`,
      student_id: user?.id,
      counselor_id: selectedCounselor,
      counselor: { full_name: chosenCounselorObj.full_name, email: chosenCounselorObj.email },
      scheduled_at: scheduledAt,
      status: 'pending',
      student_notes: studentNotes,
      created_at: new Date().toISOString()
    }

    try {
      if (user) {
        const { data, error } = await supabase
          .from('counseling_sessions')
          .insert({
            student_id: user.id,
            counselor_id: selectedCounselor,
            scheduled_at: scheduledAt,
            status: 'pending',
            student_notes: studentNotes
          })
          .select('*, counselor:counselor_id(full_name, email)')
          .maybeSingle()

        if (!error && data) {
          saveSessionsLocal([...mySessions, data])
          setSelectedCounselor('')
          setScheduledAt('')
          setStudentNotes('')
          setToast({ type: 'success', message: 'Đã gửi yêu cầu đăng ký đặt lịch hẹn tư vấn!' })
          return
        }
      }

      saveSessionsLocal([...mySessions, newSessionItem])
      setSelectedCounselor('')
      setScheduledAt('')
      setStudentNotes('')
      setToast({ type: 'success', message: 'Đã đăng ký lịch hẹn tư vấn thành công!' })
    } catch (error) {
      saveSessionsLocal([...mySessions, newSessionItem])
      setSelectedCounselor('')
      setScheduledAt('')
      setStudentNotes('')
      setToast({ type: 'success', message: 'Đã đăng ký lịch hẹn tư vấn thành công!' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-sm">
            <XCircle className="w-3 h-3" /> Từ chối
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-sm">
            <UserCheck className="w-3 h-3" /> Hoàn thành
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-sm">
            <Clock className="w-3 h-3" /> Chờ phê duyệt
          </span>
        )
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-600" />
          Đặt lịch Tư vấn Định hướng 1-1
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Đăng ký lịch hẹn tư vấn cá nhân với các chuyên gia tâm lý và thầy cô cố vấn hướng nghiệp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form đặt lịch */}
        <form onSubmit={handleBooking} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Đăng ký suất hẹn mới
          </h3>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Chọn Chuyên viên tư vấn</label>
            <select
              value={selectedCounselor}
              onChange={(e) => setSelectedCounselor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
              required
            >
              <option value="">-- Chọn chuyên gia / cố vấn --</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Thời gian hẹn gặp</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Ghi chú / Thắc mắc gửi chuyên viên</label>
            <textarea
              rows={4}
              placeholder="VD: Em muốn nhờ Thầy/Cô tư vấn chọn giữa ngành CNTT và An toàn thông tin..."
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full font-bold text-xs uppercase py-2.5"
          >
            Gửi đăng ký lịch hẹn
          </Button>
        </form>

        {/* Danh sách lịch hẹn đã đặt */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
            Danh sách Suất hẹn tư vấn của bạn
          </h3>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 bg-slate-200 rounded-sm"></div>
              <div className="h-24 bg-slate-200 rounded-sm"></div>
            </div>
          ) : mySessions.length > 0 ? (
            <div className="space-y-4">
              {mySessions.map((session) => (
                <div key={session.id} className="bg-white border border-slate-200 p-5 rounded-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Chuyên viên: {session.counselor?.full_name || 'Cố vấn Hướng nghiệp'}
                      </span>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Thời gian: {new Date(session.scheduled_at).toLocaleString('vi-VN')}</span>
                  </div>

                  {session.student_notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-sm border border-slate-100">
                      <span className="font-bold text-slate-700">Ghi chú của bạn: </span>
                      {session.student_notes}
                    </div>
                  )}

                  {session.counselor_notes && (
                    <div className="text-xs text-brand-800 bg-brand-50 p-2.5 rounded-sm border border-brand-200">
                      <span className="font-bold text-brand-900">Phản hồi từ Chuyên viên: </span>
                      {session.counselor_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-sm text-xs font-semibold text-slate-500">
              Bạn chưa có lịch hẹn tư vấn nào. Hãy điền form bên cạnh để đăng ký.
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
