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
  User,
  AlertTriangle 
} from 'lucide-react'

const CounselingBooking = () => {
  const { user } = useAuth()
  const [counselors, setCounselors] = useState([])
  const [mySessions, setMySessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)

  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCounselors()
    fetchMySessions()
  }, [user])

  // Tải danh sách chuyên viên thuần 100% từ bảng profiles với role = counselor
  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('role', 'counselor')

      if (!error && data) {
        setCounselors(data)
      }
    } catch (error) {
      console.error('Lỗi khi fetch danh sách chuyên viên:', error)
    }
  }

  // Tải danh sách các cuộc hẹn của học sinh thuần 100% từ bảng counseling_sessions trong Supabase
  const fetchMySessions = async () => {
    if (!user) return
    setIsLoading(true)
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*, counselor:counselor_id(full_name, email)')
        .eq('student_id', user.id)
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.error('Lỗi truy vấn counseling_sessions:', error)
        setDbError('Chưa nạp bảng counseling_sessions trong CSDL Supabase. Thầy vui lòng thực thi file schema.sql!')
        setMySessions([])
      } else {
        setMySessions(data || [])
      }
    } catch (error) {
      console.error('Lỗi fetch lịch hẹn:', error)
      setDbError('Không thể kết nối bảng counseling_sessions trên Supabase DB.')
      setMySessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Đặt lịch hẹn mới thuần 100% vào Supabase DB
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

    if (!user) {
      setToast({ type: 'error', message: 'Bạn cần đăng nhập để đặt lịch hẹn vào CSDL!' })
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
        .select('*, counselor:counselor_id(full_name, email)')
        .single()

      if (error) {
        console.error('Lỗi insert counseling_sessions Supabase:', error)
        setToast({ 
          type: 'error', 
          message: error.code === '42P01' 
            ? 'Bảng counseling_sessions chưa được tạo trong CSDL. Thầy vui lòng nạp file schema.sql!' 
            : `Lỗi Supabase DB: ${error.message}` 
        })
        return
      }

      setMySessions(prev => [...prev, data])
      setSelectedCounselor('')
      setScheduledAt('')
      setStudentNotes('')
      setToast({ type: 'success', message: 'Đã gửi yêu cầu đăng ký đặt lịch hẹn vào Supabase DB!' })
    } catch (error) {
      console.error('Lỗi đặt lịch hẹn:', error)
      setToast({ type: 'error', message: 'Lỗi khi ghi lịch hẹn vào CSDL Supabase.' })
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
          Đặt lịch Tư vấn Định hướng 1-1 (Supabase DB)
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Đăng ký lịch hẹn tư vấn cá nhân với các chuyên gia lưu trữ trực tiếp trong bảng counseling_sessions.
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
            Gửi đăng ký vào Supabase DB
          </Button>
        </form>

        {/* Danh sách lịch hẹn đã đặt */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
            Danh sách Suất hẹn tư vấn (từ Supabase DB)
          </h3>

          {dbError && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-sm text-center space-y-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-amber-900">{dbError}</p>
              <Button variant="primary" onClick={fetchMySessions} className="text-xs font-bold uppercase py-2 px-6">
                Thử lại kết nối CSDL
              </Button>
            </div>
          )}

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
          ) : !dbError && (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-sm text-xs font-semibold text-slate-500">
              Chưa có dữ liệu suất hẹn tư vấn trong CSDL Supabase. Hãy điền form bên cạnh để đăng ký.
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
