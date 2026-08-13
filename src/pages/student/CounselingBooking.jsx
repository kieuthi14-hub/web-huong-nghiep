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
  User,
  AlertTriangle,
  GraduationCap,
  Rocket,
  Sparkles
} from 'lucide-react'

// Cấu hình Danh sách 2 Nhóm Chuyên gia & Mentor Tư vấn 1-1
export const COUNSELOR_GROUPS = [
  {
    groupKey: 'school_counselors',
    groupName: '🎓 THẦY CÔ CỐ VẤN TẠI TRƯỜNG',
    badgeLabel: '🎓 Cố vấn Trường',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: GraduationCap,
    counselors: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Thầy Nguyễn Văn Minh',
        title: 'Cố vấn Hướng nghiệp',
        fullName: 'Thầy Nguyễn Văn Minh - Cố vấn Hướng nghiệp',
        groupKey: 'school_counselors',
        badgeLabel: '🎓 Cố vấn Trường',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Cô Lê Thị Mai',
        title: 'Tâm lý học đường',
        fullName: 'Cô Lê Thị Mai - Tâm lý học đường',
        groupKey: 'school_counselors',
        badgeLabel: '🎓 Cố vấn Trường',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      }
    ]
  },
  {
    groupKey: 'student_mentors',
    groupName: '🚀 MẠNG LƯỚI MENTOR SINH VIÊN',
    badgeLabel: '🚀 Mentor Sinh viên',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Rocket,
    counselors: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Anh Trần Minh Triết',
        title: 'SV CNTT ĐH Bách Khoa',
        fullName: 'Anh Trần Minh Triết - SV CNTT ĐH Bách Khoa',
        groupKey: 'student_mentors',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Chị Nguyễn Hà Phương',
        title: 'SV Sư phạm Tiếng Anh',
        fullName: 'Chị Nguyễn Hà Phương - SV Sư phạm Tiếng Anh',
        groupKey: 'student_mentors',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Anh Lê Quốc Bảo',
        title: 'SV Quản trị Kinh doanh',
        fullName: 'Anh Lê Quốc Bảo - SV Quản trị Kinh doanh',
        groupKey: 'student_mentors',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        name: 'Chị Phạm Khánh Linh',
        title: 'SV Y Đa Khoa',
        fullName: 'Chị Phạm Khánh Linh - SV Y Đa Khoa',
        groupKey: 'student_mentors',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      }
    ]
  }
]

// Định dạng thời gian HH:mm - DD/MM/YYYY
export const formatDateTimeFormatted = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} - ${day}/${month}/${year}`
}

// Hàm tra cứu chi tiết thông tin chuyên gia / mentor từ ID hoặc object trả về từ Supabase DB
export const getCounselorDetails = (counselorId, counselorRelation) => {
  // 1. Tìm theo ID chính xác trong danh sách cố định
  for (const group of COUNSELOR_GROUPS) {
    const found = group.counselors.find(c => c.id === counselorId)
    if (found) return found
  }

  // 2. Tìm theo tên trùng khớp với thông tin DB
  const dbName = counselorRelation?.full_name || ''
  for (const group of COUNSELOR_GROUPS) {
    const found = group.counselors.find(c => dbName.includes(c.name) || c.name.includes(dbName))
    if (found) return found
  }

  if (dbName.includes('Cao Xuân Hải') || dbName.includes('Nguyễn Văn Minh')) {
    return COUNSELOR_GROUPS[0].counselors[0]
  }
  if (dbName.includes('Kim Thuận') || dbName.includes('Lê Thị Mai')) {
    return COUNSELOR_GROUPS[0].counselors[1]
  }

  // 3. Phân loại suy luận từ từ khóa nếu là chuyên gia khác từ DB
  const isMentor = dbName.includes('Mentor') || dbName.includes('SV') || dbName.includes('Anh') || dbName.includes('Chị')
  return {
    id: counselorId || 'unknown',
    name: dbName || 'Chuyên viên Tư vấn',
    title: isMentor ? 'Mentor Sinh viên' : 'Cố vấn Hướng nghiệp',
    fullName: dbName || 'Chuyên viên Tư vấn Hướng nghiệp',
    groupKey: isMentor ? 'student_mentors' : 'school_counselors',
    badgeLabel: isMentor ? '🚀 Mentor Sinh viên' : '🎓 Cố vấn Trường',
    badgeClass: isMentor ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
}

const CounselingBooking = () => {
  const { user } = useAuth()
  const [mySessions, setMySessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)

  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMySessions()
  }, [user])

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
      setToast({ type: 'warning', message: 'Vui lòng chọn Chuyên viên hoặc Mentor tư vấn!' })
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
      setToast({ type: 'success', message: 'Đã gửi yêu cầu đăng ký đặt lịch hẹn thành công!' })
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
          📅 Đặt Lịch Tư Vấn Định Hướng 1-1 Với Chuyên Gia
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Đăng ký lịch hẹn tư vấn cá nhân với Thầy Cô Cố vấn trường hoặc Mạng lưới Mentor Sinh viên từ Supabase DB.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form đặt lịch */}
        <form onSubmit={handleBooking} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Đăng ký suất hẹn mới</span>
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          </h3>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Chọn Chuyên viên / Mentor tư vấn
            </label>
            <select
              value={selectedCounselor}
              onChange={(e) => setSelectedCounselor(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-800 cursor-pointer transition-colors"
              required
            >
              <option value="">-- Chọn chuyên gia / mentor tư vấn --</option>
              {COUNSELOR_GROUPS.map((group) => (
                <optgroup key={group.groupKey} label={group.groupName} className="font-bold text-slate-900 bg-slate-100">
                  {group.counselors.map((counselor) => (
                    <option key={counselor.id} value={counselor.id} className="font-normal text-slate-700 bg-white py-1">
                      {counselor.fullName}
                    </option>
                  ))}
                </optgroup>
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
              placeholder="VD: Em muốn nhờ Thầy/Cô tư vấn chọn giữa ngành CNTT và An toàn thông tin, hoặc tư vấn môi trường học thực tế tại Bách Khoa..."
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
            GỬI YÊU CẦU ĐẶT LỊCH
          </Button>
        </form>

        {/* Danh sách lịch hẹn đã đặt */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>DANH SÁCH SUẤT HẸN ĐÃ ĐĂNG KÝ</span>
            <span className="text-[11px] font-semibold text-slate-500 normal-case">
              {mySessions.length} suất hẹn
            </span>
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
              {mySessions.map((session) => {
                const expert = getCounselorDetails(session.counselor_id, session.counselor)
                return (
                  <div key={session.id} className="bg-white border border-slate-200 p-5 rounded-sm space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Nhãn phân loại chuyên gia / mentor */}
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded border ${expert.badgeClass}`}>
                            {expert.badgeLabel}
                          </span>
                          {getStatusBadge(session.status)}
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">
                            Chuyên viên: {expert.fullName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Thời gian: {formatDateTimeFormatted(session.scheduled_at)}</span>
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
                )
              })}
            </div>
          ) : !dbError && (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-sm text-xs font-semibold text-slate-500 space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
              <p>Chưa có dữ liệu suất hẹn tư vấn trong CSDL Supabase.</p>
              <p className="text-[11px] text-slate-400">Hãy chọn Cố vấn hoặc Mentor ở form bên trái để gửi đăng ký.</p>
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

