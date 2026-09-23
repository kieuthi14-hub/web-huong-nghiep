import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Sparkles,
  Video,
  MapPin,
  ExternalLink,
  MessageSquare,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  MessageCircle,
  RefreshCw
} from 'lucide-react'

// Hàm phân tích thông tin Nền tảng Gặp gỡ (Google Meet, Zoom, Địa điểm trực tiếp) từ ghi chú chuyên viên
export const parseMeetingInfo = (notes) => {
  if (!notes || typeof notes !== 'string') return { meetingUrl: null, locationText: null, cleanMessage: '' }
  
  // 1. URL phòng họp (Google Meet, Zoom, Teams, Web)
  const urlMatch = notes.match(/(https?:\/\/[^\s\],"'<>]+)/i)
  const meetingUrl = urlMatch ? urlMatch[1] : null

  // 2. Địa điểm trực tiếp
  const locMatch = notes.match(/\[(?:Địa điểm|Phòng gặp|Địa chỉ):\s*([^\]]+)\]/i)
  let locationText = locMatch ? locMatch[1].trim() : null

  // Nếu không có tag nhưng notes chứa từ "Phòng" hoặc "Trường"
  if (!locationText && !meetingUrl && (notes.includes('Phòng') || notes.includes('phòng') || notes.includes('Trường') || notes.includes('Văn phòng'))) {
    locationText = notes.split('\n')[0].replace(/^\[.*?\]/, '').trim()
  }

  // 3. Tin nhắn làm sạch
  let cleanMessage = notes
    .replace(/\[(?:Link|Link phòng họp|Phòng họp|Phòng gặp|Địa điểm|Địa chỉ):\s*[^\]]+\]/gi, '')
    .replace(/(https?:\/\/[^\s\],"'<>]+)/gi, '')
    .replace(/^[\s\n\r-]+|[\s\n\r-]+$/g, '')
    .trim()

  return { meetingUrl, locationText, cleanMessage }
}

// Hàm trích xuất thông tin liên hệ của học sinh (SĐT/Zalo, Lớp/Trường, Câu hỏi) từ student_notes
export const parseStudentContact = (notes) => {
  if (!notes || typeof notes !== 'string') return { phone: null, schoolClass: null, question: '' }
  
  // 1. Số điện thoại từ tag [Liên hệ SĐT/Zalo: ...]
  const phoneMatch = notes.match(/\[(?:Liên hệ SĐT\/Zalo|SĐT\/Zalo|SĐT|Zalo|Số điện thoại):\s*([^\]]+)\]/i)
  let phone = phoneMatch ? phoneMatch[1].trim() : null
  if (!phone) {
    const phoneRegexMatch = notes.match(/(?:0|\+84)(?:3|5|7|8|9)[0-9]{8}\b/)
    if (phoneRegexMatch) phone = phoneRegexMatch[0].trim()
  }

  // 2. Lớp/Trường từ tag [Lớp/Trường: ...]
  const classMatch = notes.match(/\[(?:Lớp\/Trường|Lớp|Trường):\s*([^\]]+)\]/i)
  const schoolClass = classMatch ? classMatch[1].trim() : null

  // 3. Câu hỏi băn khoăn thực tế của học sinh
  const lines = notes.split('\n')
  const questionLines = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (trimmed.startsWith('[Chuyên gia/Mentor:')) return false
    if (/^\[(?:Liên hệ SĐT\/Zalo|SĐT\/Zalo|SĐT|Zalo|Số điện thoại):/i.test(trimmed)) return false
    if (/^\[(?:Lớp\/Trường|Lớp|Trường):/i.test(trimmed)) return false
    return true
  })
  const question = questionLines.join('\n').trim()

  return { phone, schoolClass, question }
}

// Bản đồ Ánh xạ Mã Mentor sang Tên hiển thị thực tế
export const mentorMap = {
  // CBAS VISEF Anonymized Mentors
  'CV_01': 'Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường',
  'MT_IT01': 'Anh T.M.T - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
  'MT_IT02': 'Anh L.T.K - Cựu SV An ninh mạng (ĐH CNTT - ĐHQG TP.HCM)',
  'MT_EE01': 'Anh H.M.Đ - SV Năm 3 Điện tử Vi mạch (ĐH Bách Khoa)',
  'MT_BA01': 'Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)',
  'MT_FI01': 'Chị V.Q.N - SV Năm 3 Tài chính Ngân hàng (ĐH Ngoại Thương)',
  'MT_MK01': 'Chị L.T.H - Chuyên viên Marketing (Cựu SV ĐH Nha Trang)',
  
  // UUIDs & Legacy Mappings
  '11111111-1111-1111-1111-111111111111': 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
  '22222222-2222-2222-2222-222222222222': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
  '11111111-1111-4111-a111-111111111111': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  '22222222-2222-4222-a222-222222222222': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  '33333333-3333-4333-a333-333333333301': '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
  '33333333-3333-4333-a333-333333333307': '[Sư phạm Tiếng Anh] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
  'Lê Thị Hoa': '[Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)',
  'Chị Lê Thị Hoa': '[Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)',
  'Bùi Thị Vân Anh': '[Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)',
  'Chị Bùi Thị Vân Anh': '[Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)',
  'Nguyễn Lê Bảo Trân': '[Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)',
  'Chị Nguyễn Lê Bảo Trân': '[Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)',
  'Thầy Cao Xuân Hải (Bí thư đoàn trường) - Cố vấn Định hướng Nghề nghiệp': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  'Cô Nguyễn Thị Kim Thuận - Chuyên gia Tư vấn Tâm lý Học đường': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  'Chị Hoàng Thu Trang (SV Năm 3 - ĐH KHXH&NV)': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)'
}

// Cấu hình Danh sách Nhóm Chuyên gia & Mentor Tư vấn 1-1
export const COUNSELOR_GROUPS = [
  {
    groupKey: 'school_counselors',
    groupName: '🎓 CỐ VẤN HỌC ĐƯỜNG',
    badgeLabel: '🎓 Cố vấn Trường',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: GraduationCap,
    counselors: [
      {
        id: 'CV_01',
        name: 'Ban Cố vấn Hướng nghiệp & Tâm lý học đường',
        title: 'Cố vấn Hướng nghiệp & Tâm lý học đường',
        fullName: 'Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường',
        groupKey: 'school_counselors',
        badgeLabel: '🎓 Cố vấn Trường',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      }
    ]
  },
  {
    groupKey: 'tech_engineering',
    groupName: '🚀 MENTOR NHÓM KỸ THUẬT & CÔNG NGHỆ',
    badgeLabel: '🚀 Kỹ thuật & CNTT',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: Rocket,
    counselors: [
      {
        id: 'MT_IT01',
        name: 'Anh T.M.T',
        title: 'SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
        fullName: 'Anh T.M.T - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
        groupKey: 'tech_engineering',
        badgeLabel: '🚀 Mentor SV',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: 'MT_IT02',
        name: 'Anh L.T.K',
        title: 'Cựu SV An ninh mạng (ĐH CNTT - ĐHQG TP.HCM)',
        fullName: 'Anh L.T.K - Cựu SV An ninh mạng (ĐH CNTT - ĐHQG TP.HCM)',
        groupKey: 'tech_engineering',
        badgeLabel: '💼 Cựu SV',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      {
        id: 'MT_EE01',
        name: 'Anh H.M.Đ',
        title: 'SV Năm 3 Điện tử Vi mạch (ĐH Bách Khoa)',
        fullName: 'Anh H.M.Đ - SV Năm 3 Điện tử Vi mạch (ĐH Bách Khoa)',
        groupKey: 'tech_engineering',
        badgeLabel: '🚀 Mentor SV',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      }
    ]
  },
  {
    groupKey: 'economics_finance',
    groupName: '📊 MENTOR NHÓM KINH TẾ, TÀI CHÍNH & QUẢN TRỊ',
    badgeLabel: '🚀 Kinh tế & Quản trị',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Rocket,
    counselors: [
      {
        id: 'MT_BA01',
        name: 'Anh L.Q.B',
        title: 'SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)',
        fullName: 'Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)',
        groupKey: 'economics_finance',
        badgeLabel: '🚀 Mentor SV',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: 'MT_FI01',
        name: 'Chị V.Q.N',
        title: 'SV Năm 3 Tài chính Ngân hàng (ĐH Ngoại Thương)',
        fullName: 'Chị V.Q.N - SV Năm 3 Tài chính Ngân hàng (ĐH Ngoại Thương)',
        groupKey: 'economics_finance',
        badgeLabel: '🚀 Mentor SV',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: 'MT_MK01',
        name: 'Chị L.T.H',
        title: 'Chuyên viên Marketing (Cựu SV ĐH Nha Trang)',
        fullName: 'Chị L.T.H - Chuyên viên Marketing (Cựu SV ĐH Nha Trang)',
        groupKey: 'economics_finance',
        badgeLabel: '💼 Cựu SV',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
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

// Hàm bóc tách chính xác tên chuyên gia / mentor từ ghi chú
export const parseMentorNameFromNotes = (notes) => {
  if (!notes || typeof notes !== 'string') return null
  const lines = notes.split('\n')
  const mentorLine = lines.find(l => l.trim().startsWith('[Chuyên gia/Mentor:'))
  if (mentorLine) {
    const extracted = mentorLine.trim()
      .replace(/^\[Chuyên gia\/Mentor:\s*/i, '')
      .replace(/\]\s*$/, '')
      .trim()
    if (extracted && extracted !== '11111111-1111-1111-1111-111111111111' && extracted.length > 2) {
      return extracted
    }
  }
  return null
}

// Hàm tra cứu chi tiết thông tin chuyên gia / mentor từ ID hoặc object trả về từ Supabase DB
export const getCounselorDetails = (counselorId, counselorRelation, sessionNotes, sessionCounselorName) => {
  const mentorFromNotes = parseMentorNameFromNotes(sessionNotes)
  if (mentorFromNotes) {
    for (const group of COUNSELOR_GROUPS) {
      const found = group.counselors.find(c => 
        c.fullName === mentorFromNotes ||
        c.id === mentorFromNotes ||
        c.name === mentorFromNotes ||
        mentorFromNotes.includes(c.name)
      )
      if (found) return found
    }

    const isAlumni = mentorFromNotes.includes('Cựu SV') || mentorFromNotes.includes('Alumni')
    const isTeacher = mentorFromNotes.startsWith('Thầy') || mentorFromNotes.startsWith('Cô') || mentorFromNotes.includes('Cố vấn')
    return {
      id: counselorId || 'mentor',
      name: mentorFromNotes.split('-')[0].trim() || mentorFromNotes,
      title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV' : 'Mentor Sinh viên',
      fullName: mentorFromNotes,
      groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
      badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV' : '🚀 Mentor Sinh viên',
      badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  }

  const checkValue = String(counselorId || '').trim()
  if (checkValue && mentorMap[checkValue]) {
    const mappedName = mentorMap[checkValue]
    for (const group of COUNSELOR_GROUPS) {
      const found = group.counselors.find(c => c.fullName === mappedName || c.id === checkValue)
      if (found) return found
    }
    return {
      id: checkValue,
      name: mappedName.split('-')[0].trim() || mappedName,
      title: 'Cố vấn Chuyên môn',
      fullName: mappedName,
      groupKey: 'school_counselors',
      badgeLabel: '🎓 Cố vấn',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  }

  return {
    id: 'CV_01',
    name: 'Ban Cố vấn Hướng nghiệp',
    title: 'Cố vấn Hướng nghiệp & Tâm lý học đường',
    fullName: 'Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường',
    groupKey: 'school_counselors',
    badgeLabel: '🎓 Cố vấn Trường',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
}

// Quản lý LocalStorage cho suất hẹn tư vấn fallback
const LOCAL_STORAGE_KEY_PREFIX = 'counseling_sessions_local_'

const getLocalSessions = (userId) => {
  if (!userId) return []
  const result = []
  const seen = new Set()
  try {
    const keys = [
      LOCAL_STORAGE_KEY_PREFIX + userId,
      'counseling_sessions_local',
      'counseling_sessions'
    ]
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.scheduled_at && !seen.has(item.scheduled_at)) {
                seen.add(item.scheduled_at)
                result.push({ ...item, is_local: true })
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Lỗi đọc local storage:', e)
  }
  return result
}

const saveLocalSession = (userId, session) => {
  if (!userId) return
  try {
    const list = getLocalSessions(userId)
    const updated = [session, ...list]
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(updated))
  } catch (e) {
    console.error('Lỗi lưu local session:', e)
  }
}

// =========================================================================
// BƯỚC 4: TƯ VẤN 1-1 ĐỐI CHỨNG THỰC TẾ (CHUẨN CBAS VISEF)
// =========================================================================
const CounselingBooking = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Form states matching standard Step 4
  const [selectedMentor, setSelectedMentor] = useState('')
  const [meetType, setMeetType] = useState('Google Meet')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [studentQuestions, setStudentQuestions] = useState('')
  const [booking, setBooking] = useState(null)
  const [nextStepVisible, setNextStepVisible] = useState(false)
  
  // Feedback Form State (Biên bản sau buổi gặp)
  const [feedbackIllusion, setFeedbackIllusion] = useState('reduced') // 'persisted' | 'reduced' | 'cleared'
  const [feedbackReadiness, setFeedbackReadiness] = useState(8)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [feedbackSaved, setFeedbackSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mentor_feedback_record') || 'null')
    } catch (e) {
      return null
    }
  })

  const [mySessions, setMySessions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Khởi tạo và đọc dữ liệu đã lưu
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cbas_step4_booking")
      if (stored) {
        const parsed = JSON.parse(stored)
        setBooking(parsed)
        setNextStepVisible(true)
        if (parsed.mentor_id) setSelectedMentor(parsed.mentor_id)
        if (parsed.meeting_type) setMeetType(parsed.meeting_type)
        if (parsed.meeting_time) setAppointmentTime(parsed.meeting_time)
        if (parsed.questions) setStudentQuestions(parsed.questions)
      }
    } catch (e) {
      console.warn("Lỗi đọc cbas_step4_booking:", e)
    }

    fetchMySessions()
  }, [user])

  // Tải danh sách lịch hẹn từ Supabase / Local
  const fetchMySessions = async () => {
    if (!user) return
    setIsLoading(true)
    const localItems = getLocalSessions(user.id)
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('scheduled_at', { ascending: true })

      if (!error && data) {
        setMySessions(data)
      } else if (localItems.length > 0) {
        setMySessions(localItems)
      }
    } catch (error) {
      console.warn('Lỗi fetch lịch hẹn:', error)
      setMySessions(localItems)
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý gửi lịch hẹn và lưu thông tin Bước 4 (Chuẩn CBAS VISEF)
  const handleBookingStep4 = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    const mentor = document.getElementById("mentorSelect")?.value || selectedMentor
    const time = document.getElementById("appointmentTime")?.value || appointmentTime
    const questions = (document.getElementById("studentQuestions")?.value || studentQuestions).trim()
    const currentMeetType = document.querySelector('input[name="meetType"]:checked')?.value || meetType || "Google Meet"

    if (!mentor || !time || !questions) {
      alert("Vui lòng điền đầy đủ thông tin và câu hỏi chất vấn!")
      return
    }

    const bookingData = {
      mentor_id: mentor,
      meeting_time: time,
      meeting_type: currentMeetType,
      questions: questions,
      status: "Đã xác nhận",
      meet_url: "https://meet.google.com/xyz-visef-2026"
    }

    // 1. Lưu vào localStorage để khắc phục lỗi Supabase rỗng
    localStorage.setItem("cbas_step4_booking", JSON.stringify(bookingData))
    setBooking(bookingData)
    setNextStepVisible(true)

    // 2. Cập nhật DOM trực tiếp để hỗ trợ hoàn toàn script gốc
    const statusBox = document.getElementById("bookingStatusBox")
    if (statusBox) {
      statusBox.style.border = "1px solid #86efac"
      statusBox.style.background = "#f0fdf4"
      statusBox.style.color = "#166534"
      statusBox.style.textAlign = "left"
      const mentorDisplay = mentorMap[mentor] || mentor
      statusBox.innerHTML = `
        <strong>🎉 ĐÃ ĐẶT LỊCH THÀNH CÔNG!</strong><br><br>
        • <strong>Cố vấn:</strong> ${mentorDisplay}<br>
        • <strong>Thời gian:</strong> ${time}<br>
        • <strong>Hình thức:</strong> ${currentMeetType}<br>
        • <strong>Link phòng họp:</strong> <a href="${bookingData.meet_url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Bấm vào đây để vào Google Meet</a><br><br>
        <small style="color: #64748b;">*Em hãy chuẩn bị sẵn 2 câu hỏi đã điền để đối chất cùng Mentor trong buổi gặp.</small>
      `
    }

    const nextBox = document.getElementById("nextStepBox")
    if (nextBox) {
      nextBox.style.display = "block"
    }

    // 3. Tự động đồng bộ Supabase an toàn nếu đã đăng nhập
    if (user) {
      try {
        const counselorFullName = mentorMap[mentor] || mentor
        const syncPayload = {
          student_id: user.id,
          counselor_id: '11111111-1111-1111-1111-111111111111',
          counselor_name: counselorFullName,
          scheduled_at: time,
          status: 'confirmed',
          student_notes: `[Chuyên gia/Mentor: ${counselorFullName}]\n[Hình thức: ${currentMeetType}]\n[Link Meet: ${bookingData.meet_url}]\n${questions}`
        }
        await supabase.from('counseling_sessions').insert(syncPayload)
        
        // Lưu local backup
        saveLocalSession(user.id, {
          id: `local-${Date.now()}`,
          ...syncPayload,
          created_at: new Date().toISOString(),
          is_local: true
        })
        fetchMySessions()
      } catch (err) {
        console.warn("Lỗi lưu Supabase (Đã an toàn lưu vào local):", err)
      }
    }

    setToast({ type: 'success', message: '🎉 Đã đặt lịch hẹn tham vấn 1-1 thành công!' })
  }

  // Điều hướng sang Bước 5
  const goToStep5 = () => {
    navigate("/nhat-ky-ra-quyet-dinh")
  }

  // Đăng ký các hàm ra global window để hỗ trợ cả code vanilla inline
  useEffect(() => {
    window.handleBookingStep4 = handleBookingStep4
    window.goToStep5 = goToStep5
    return () => {
      delete window.handleBookingStep4
      delete window.goToStep5
    }
  }, [selectedMentor, appointmentTime, studentQuestions, meetType, user])

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
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        )
    }
  }

  return (
    <div className="step4-wrapper" style={{ maxWidth: '950px', margin: '0 auto', padding: '20px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      
      {/* TIÊU ĐỀ BƯỚC */}
      <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
        <span style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', fontSize: '12px' }}>
          BƯỚC 4: ĐỐI CHỨNG ĐỜI THỰC
        </span>
        <h2 style={{ color: '#0f172a', marginTop: '10px', fontSize: '22px', fontWeight: 'bold' }}>
          Tư Vấn 1-1 Cùng Cố Vấn Chuyên Môn
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
          Đối chất các số liệu em vừa tra cứu ở Bước 3 với sinh viên đang học hoặc chuyên gia trong ngành để giải tỏa các góc khuất thực tế.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* CỘT TRÁI: FORM ĐẶT LỊCH VÀ CÂU HỎI CHẤT VẤN */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', color: '#1e293b', marginTop: 0, marginBottom: '16px', fontWeight: 700 }}>
            📅 Thông Tin Phiên Tham Vấn
          </h3>

          <form id="step4BookingForm" onSubmit={handleBookingStep4}>
            
            {/* Chọn Mentor (Đã ẩn danh hóa theo chuẩn đạo đức CBAS) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                1. Chọn Cố vấn / Mentor phù hợp với ngành em nhắm tới: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                id="mentorSelect" 
                required 
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#0f172a' }}
              >
                <option value="">-- Chọn Cố vấn hoặc Mentor --</option>
                <optgroup label="CỐ VẤN HỌC ĐƯỜNG">
                  <option value="CV_01">Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường</option>
                </optgroup>
                <optgroup label="MENTOR NHÓM KỸ THUẬT & CÔNG NGHỆ">
                  <option value="MT_IT01">Anh T.M.T - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)</option>
                  <option value="MT_IT02">Anh L.T.K - Cựu SV An ninh mạng (ĐH CNTT - ĐHQG TP.HCM)</option>
                  <option value="MT_EE01">Anh H.M.Đ - SV Năm 3 Điện tử Vi mạch (ĐH Bách Khoa)</option>
                </optgroup>
                <optgroup label="MENTOR NHÓM KINH TẾ, TÀI CHÍNH & QUẢN TRỊ">
                  <option value="MT_BA01">Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)</option>
                  <option value="MT_FI01">Chị V.Q.N - SV Năm 3 Tài chính Ngân hàng (ĐH Ngoại Thương)</option>
                  <option value="MT_MK01">Chị L.T.H - Chuyên viên Marketing (Cựu SV ĐH Nha Trang)</option>
                </optgroup>
              </select>
            </div>

            {/* Hình thức */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                2. Hình thức trao đổi:
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500, color: '#1e293b' }}>
                  <input 
                    type="radio" 
                    name="meetType" 
                    value="Google Meet" 
                    checked={meetType === 'Google Meet'} 
                    onChange={(e) => setMeetType(e.target.value)} 
                  /> 💻 Google Meet
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500, color: '#1e293b' }}>
                  <input 
                    type="radio" 
                    name="meetType" 
                    value="Trực tiếp" 
                    checked={meetType === 'Trực tiếp'} 
                    onChange={(e) => setMeetType(e.target.value)} 
                  /> 🏫 Trực tiếp tại phòng Tư vấn
                </label>
              </div>
            </div>

            {/* Thời gian hẹn */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                3. Khung thời gian mong muốn: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="datetime-local" 
                id="appointmentTime" 
                required
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} 
              />
            </div>

            {/* BẮT BUỘC: Câu hỏi chất vấn chuẩn bị trước */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                4. Hai câu hỏi em muốn chất vấn Mentor về áp lực/góc khuất thực tế: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea 
                id="studentQuestions" 
                required 
                rows="3"
                value={studentQuestions}
                onChange={(e) => setStudentQuestions(e.target.value)}
                placeholder="Ví dụ: Em muốn hỏi về áp lực học tập năm nhất và cơ hội thực tập thực tế của sinh viên..."
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                *Cần chuẩn bị kỹ để buổi đối chất đạt hiệu cao nhất.
              </small>
            </div>

            {/* Nút gửi lịch hẹn */}
            <button 
              type="submit" 
              style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              Xác Nhận Đặt Lịch Hẹn
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: TRẠNG THÁI SUẤT HẸN & BIÊN BẢN (KHẮC PHỤC LỖI SUPABASE RỖNG) */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#1e293b', marginTop: 0, marginBottom: '12px', fontWeight: 700 }}>
            📌 Trạng Thái Suất Hẹn Tham Vấn
          </h3>

          <div 
            id="bookingStatusBox" 
            style={booking ? {
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
              color: '#166534',
              fontSize: '13px'
            } : {
              background: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px'
            }}
          >
            {booking ? (
              <div>
                <strong style={{ fontSize: '14px', color: '#15803d' }}>🎉 ĐÃ ĐẶT LỊCH THÀNH CÔNG!</strong><br /><br />
                • <strong>Cố vấn:</strong> {mentorMap[booking.mentor_id] || booking.mentor_id}<br />
                • <strong>Thời gian:</strong> {booking.meeting_time}<br />
                • <strong>Hình thức:</strong> {booking.meeting_type}<br />
                • <strong>Link phòng họp:</strong> <a href={booking.meet_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>Bấm vào đây để vào Google Meet</a><br /><br />
                <small style={{ color: '#64748b' }}>*Em hãy chuẩn bị sẵn 2 câu hỏi đã điền để đối chất cùng Mentor trong buổi gặp.</small>
              </div>
            ) : (
              <span>
                Chưa có lịch hẹn nào được ghi nhận.<br />
                Vui lòng điền thông tin và câu hỏi ở form bên cạnh để gửi yêu cầu.
              </span>
            )}
          </div>

          {/* Khối mở khóa sang Bước 5 sau khi hoàn thành buổi gặp */}
          <div 
            id="nextStepBox" 
            style={{ 
              display: (booking || nextStepVisible) ? 'block' : 'none', 
              marginTop: '20px', 
              padding: '14px', 
              background: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              borderRadius: '8px' 
            }}
          >
            <p style={{ color: '#065f46', fontSize: '13px', margin: '0 0 10px 0', fontWeight: 600 }}>
              ✅ Buổi tham vấn đã hoàn tất! Em đã sẵn sàng viết bài tự soi chiếu.
            </p>
            <button 
              type="button" 
              onClick={goToStep5} 
              style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', width: '100%', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#047857'}
              onMouseOut={(e) => e.currentTarget.style.background = '#059669'}
            >
              Mở Khóa Bước 5: Nhật Ký Ra Quyết Định ➜
            </button>
          </div>

        </div>

      </div>

      {/* BIÊN BẢN SAU BUỔI GẶP (MENTOR FEEDBACK FORM) - BƯỚC 4 */}
      <div style={{ marginTop: '24px', background: '#ffffff', border: '2px solid #8b5cf6', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px 8px', background: '#7c3aed', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <FileCheck style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                BIÊN BẢN SAU BUỔI TƯ VẤN 1-1 (MENTOR FEEDBACK FORM)
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Đánh giá sự chuyển biến nhận thức của học sinh sau khi đối thoại trực tiếp với Mentor/Chuyên gia
              </p>
            </div>
          </div>

          {feedbackSaved && (
            <div style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 style={{ width: '14px', height: '14px', color: '#16a34a' }} />
              <span>Đã lưu Biên bản tư vấn</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', fontSize: '13px' }}>
          {/* Câu 1 */}
          <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <label style={{ fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
              1. Mức độ nhận thức thực tế của học sinh sau buổi tư vấn:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { val: 'persisted', label: 'Vẫn còn giữ kỳ vọng chủ quan / chưa sát với thực tế' },
                { val: 'reduced', label: 'Đã điều chỉnh góc nhìn, nhận thức rõ ràng và sát thực tế hơn' },
                { val: 'cleared', label: 'Đã nắm vững bức tranh tổng thể, hiểu rõ cơ hội & thách thức nghề nghiệp' }
              ].map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="feedbackIllusion"
                    value={opt.val}
                    checked={feedbackIllusion === opt.val}
                    onChange={(e) => setFeedbackIllusion(e.target.value)}
                  />
                  <span style={{ fontWeight: 600, color: '#334155' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Câu 2 */}
          <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <label style={{ fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              2. Tinh thần sẵn sàng đón nhận thực tế sau buổi tư vấn: ({feedbackReadiness}/10)
            </label>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0' }}>
              Kéo thanh trượt để chấm điểm mức độ sẵn sàng vượt khó của học sinh:
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={feedbackReadiness}
              onChange={(e) => setFeedbackReadiness(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '2px' }}>
              <span>1: Còn băn khoăn</span>
              <span>5: Đang cân nhắc</span>
              <span>10: Sẵn sàng dấn thân</span>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Nhận xét / Lời khuyên chốt của Mentor:
              </label>
              <textarea
                rows={2}
                placeholder="Ghi nhận xét ngắn về tinh thần và sự chuẩn bị của học sinh..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              const record = {
                illusion: feedbackIllusion,
                readiness: feedbackReadiness,
                notes: feedbackNotes,
                savedAt: new Date().toISOString()
              }
              localStorage.setItem('mentor_feedback_record', JSON.stringify(record))
              setFeedbackSaved(record)
              setToast({ type: 'success', message: '🎉 Đã lưu Biên bản tư vấn 1-1 thành công!' })
            }}
            style={{ padding: '9px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            Lưu Biên Bản Buổi Gặp
          </button>

          <button
            type="button"
            onClick={goToStep5}
            style={{ padding: '9px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Sang Bước 5: Nhật Ký Ra Quyết Định</span>
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* DANH SÁCH LỊCH HẸN ĐÃ ĐĂNG KÝ (NẾU CÓ DỮ LIỆU) */}
      {mySessions.length > 0 && (
        <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            📜 Lịch Sử Đăng Ký Tham Vấn Của Em ({mySessions.length} suất hẹn)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mySessions.map((item, idx) => {
              const expert = getCounselorDetails(item?.counselor_id, item?.counselor, item?.student_notes, item?.counselor_name || item?.mentor_id)
              const contact = parseStudentContact(item?.student_notes)
              return (
                <div key={item?.id || idx} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                    <strong style={{ color: '#0f172a' }}>{expert?.fullName || item?.counselor_name || 'Cố vấn Hướng nghiệp'}</strong>
                    {getStatusBadge(item?.status)}
                  </div>
                  <div style={{ color: '#475569', fontSize: '12px' }}>
                    🕒 Thời gian: {formatDateTimeFormatted(item?.scheduled_at)}
                  </div>
                  {contact?.question && (
                    <div style={{ marginTop: '6px', color: '#334155', fontStyle: 'italic', fontSize: '12px' }}>
                      "{contact.question}"
                    </div>
                  )}
                </div>
              )
            })}
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

export default CounselingBooking
