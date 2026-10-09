import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import StepProgressHeader from '../../components/common/StepProgressHeader'
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
  RefreshCw,
  Printer,
  ClipboardList,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Award,
  Compass,
  RotateCcw
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
    const updated = [session, ...list.filter(s => s.id !== session.id && s.scheduled_at !== session.scheduled_at)]
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(updated))
    localStorage.setItem('counseling_sessions_local', JSON.stringify(updated))
    localStorage.setItem('counseling_sessions', JSON.stringify(updated))
  } catch (e) {
    console.error('Lỗi lưu local session:', e)
  }
}

// =========================================================================
// BƯỚC 4: TƯ VẤN 1-1 ĐỐI CHỨNG THỰC TẾ (CLINICAL TRIAGE & MENTORSHIP WORKFLOW)
// =========================================================================
const CounselingBooking = () => {
  const navigate = useNavigate()
  const { user, profile, studentCode } = useAuth()

  // Mã học sinh ẩn danh theo chuẩn nghiên cứu ViSEF (CT_01 -> CT_30 hoặc mã thử nghiệm) - Tuyệt đối không xuất tên thật
  const displayStudentCode = (() => {
    if (studentCode && /^CT_\d{2}$/i.test(studentCode)) return studentCode.toUpperCase()
    try {
      const local = localStorage.getItem('cbas_student_code')
      if (local && /^CT_\d{2}$/i.test(local)) return local.toUpperCase()
    } catch (e) {}
    const email = (user?.email || profile?.email || '').toLowerCase()
    const ctMatch = email.match(/^ct[_\-]?(\d{1,2})@/)
    if (ctMatch) {
      const n = parseInt(ctMatch[1], 10)
      return `CT_${n < 10 ? '0' + n : n}`
    }
    if (profile?.full_name && /^CT_\d{2}$/i.test(profile.full_name)) {
      return profile.full_name.toUpperCase()
    }
    return studentCode || profile?.student_code || 'CT_01'
  })()

  // 1. Quản lý trạng thái 2 Giai đoạn: 4A (Chuẩn bị & Hồ sơ đối chất) | 4B (Biên bản sau buổi gặp)
  const [currentStage, setCurrentStage] = useState(() => {
    try {
      const saved = localStorage.getItem('cbas_step4_active_stage')
      if (saved === '4B') return '4B'
    } catch (e) {}
    return '4A'
  })

  // Collapsible drawer cho form đặt lịch online (phụ trợ)
  const [showOnlineBooking, setShowOnlineBooking] = useState(false)

  // 2. Dữ liệu Hồ Sơ Đối Chất (Clinical Dossier) được đọc tự động từ Bước 1, 2, 3
  const dossierData = useMemo(() => {
    let userProf = {}
    let anchor = {}
    let triage = {}
    let evidence = {}
    let telemetry = {}

    try {
      const p = localStorage.getItem('cbas_user_profile')
      if (p) userProf = JSON.parse(p)
    } catch (e) {}
    try {
      const a = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData')
      if (a) anchor = JSON.parse(a)
    } catch (e) {}
    try {
      const t = localStorage.getItem('cbas_step3_triage')
      if (t) triage = JSON.parse(t)
    } catch (e) {}
    try {
      const ev = localStorage.getItem('cbas_step3_evidence')
      if (ev) evidence = JSON.parse(ev)
    } catch (e) {}
    try {
      const telem = localStorage.getItem('cbas_step2_telemetry')
      if (telem) telemetry = JSON.parse(telem)
    } catch (e) {}

    const rawMajor = userProf?.targetMajor || anchor?.target_career || anchor?.targetMajor || telemetry?.target_major || ''
    const rawSchool = userProf?.targetSchool || anchor?.target_university || anchor?.targetSchool || telemetry?.target_school || ''
    const targetMajor = (rawMajor && rawMajor !== 'Chưa xác định') ? rawMajor : 'Chưa xác định'
    const targetSchool = (rawSchool && rawSchool !== 'Chưa xác định') ? rawSchool : 'Chưa xác định'
    
    const hollandCode = userProf?.hollandCode || userProf?.holland_code || anchor?.holland_code || anchor?.hollandCode || telemetry?.holland_code || localStorage.getItem('holland_code') || 'RIA'
    const initialConfidence = userProf?.initialConfidence != null ? userProf.initialConfidence : (anchor?.initial_confidence != null ? anchor.initial_confidence : (anchor?.initialConfidence != null ? anchor.initialConfidence : 8))
    
    const targetCombination = triage?.targetCombination || (evidence?.cutoff_score ? evidence.cutoff_score.split(':')[0] : 'A00') || 'A00'
    const totalStudentScore = triage?.totalStudentScore != null ? triage.totalStudentScore : (triage?.scoreSubject1 ? (Number(triage.scoreSubject1) + Number(triage.scoreSubject2) + Number(triage.scoreSubject3)).toFixed(1) : '--')
    const avgCutoff = triage?.avgCutoff != null ? triage.avgCutoff : '--'
    const scoreGap = triage?.scoreGap != null ? triage.scoreGap : null

    let reflectionText = triage?.reflectionText || localStorage.getItem('cbas_step3_reflection') || evidence?.triage?.reflectionText
    if (!reflectionText && triage?.unemploymentReasons?.length) {
      reflectionText = `Quan ngại về rủi ro tuyển sinh & thị trường việc làm: ${triage.unemploymentReasons.join(', ')}`
    }
    if (!reflectionText && (userProf?.reason || anchor?.reason)) {
      reflectionText = userProf?.reason || anchor?.reason
    }
    if (!reflectionText) {
      reflectionText = 'Học sinh đang chuẩn bị câu hỏi đối chất về chênh lệch điểm chuẩn và rủi ro cạnh tranh việc làm thực tế.'
    }

    return {
      targetMajor,
      targetSchool,
      hollandCode,
      initialConfidence,
      targetCombination,
      totalStudentScore,
      avgCutoff,
      scoreGap,
      reflectionText
    }
  }, [])

  const formattedScoreGap = useMemo(() => {
    if (dossierData.scoreGap === null || dossierData.scoreGap === undefined || isNaN(dossierData.scoreGap)) {
      return '--'
    }
    const num = Number(dossierData.scoreGap)
    return num > 0 ? `+${num}đ` : `${num}đ`
  }, [dossierData.scoreGap])

  const isPositiveGap = dossierData.scoreGap !== null && Number(dossierData.scoreGap) >= 0

  // In / Lưu PDF Dossier
  const handlePrintDossier = () => {
    window.print()
  }

  // Kích hoạt hoàn thành 4A và chuyển sang 4B
  const handleComplete4A = () => {
    setCurrentStage('4B')
    try {
      localStorage.setItem('cbas_step4_active_stage', '4B')
      localStorage.setItem('cbas_step4_consultation_completed', 'true')
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Quay lại xem Hồ sơ đối chất 4A
  const handleBackTo4A = () => {
    setCurrentStage('4A')
    try {
      localStorage.setItem('cbas_step4_active_stage', '4A')
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Form states cho đặt lịch online (phụ trợ)
  const [selectedMentor, setSelectedMentor] = useState('')
  const [meetType, setMeetType] = useState('Google Meet')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [studentQuestions, setStudentQuestions] = useState('')
  const [booking, setBooking] = useState(null)
  const [nextStepVisible, setNextStepVisible] = useState(false)
  
  // Feedback Form State (Biên bản sau buổi gặp 4B)
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

  // Lưu biên bản 4B
  const handleSaveFeedback = () => {
    const record = {
      illusion: feedbackIllusion,
      readiness: feedbackReadiness,
      notes: feedbackNotes,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('mentor_feedback_record', JSON.stringify(record))
    localStorage.setItem('cbas_step4_feedback', JSON.stringify(record))
    setFeedbackSaved(record)
    setToast({ type: 'success', message: '🎉 Đã lưu Nhật ký thu hoạch sau buổi tham vấn thành công!' })
  }

  // Làm lại Bước 4B (xóa nhật ký thu hoạch để viết lại)
  const handleResetStep4 = () => {
    if (window.confirm("Em có muốn làm lại Bước 4B (xóa nội dung nhật ký thu hoạch hiện tại để ghi chép lại từ đầu) không?")) {
      try {
        localStorage.removeItem('mentor_feedback_record')
        localStorage.removeItem('cbas_step4_feedback')
        localStorage.removeItem('cbas_student_reflection_log')
      } catch (e) {}
      setFeedbackIllusion('PARTIAL')
      setFeedbackReadiness(7)
      setFeedbackNotes('')
      setFeedbackSaved(null)
      setToast({ type: 'info', message: 'Đã đặt lại nhật ký thu hoạch. Em có thể ghi chép lại từ đầu!' })
    }
  }

  // --- THUẬT TOÁN PHÂN LUỒNG THÍCH ỨNG (ADAPTIVE TRIAGE) ---
  const autoTriageDecision = useMemo(() => {
    try {
      const step3Raw = localStorage.getItem('cbas_step3_triage')
      if (step3Raw) {
        const parsed = JSON.parse(step3Raw)
        if (parsed.triageDecision === 'Fast-Track') return 'PHAN_LUONG_2'
        if (parsed.triageDecision === 'In-depth') return 'PHAN_LUONG_1'
      }
      const scoreGapRaw = localStorage.getItem('cbas_score_gap')
      if (scoreGapRaw !== null && !isNaN(parseFloat(scoreGapRaw))) {
        return parseFloat(scoreGapRaw) >= -1.0 ? 'PHAN_LUONG_2' : 'PHAN_LUONG_1'
      }
    } catch (e) {}
    if (dossierData.scoreGap !== null && !isNaN(Number(dossierData.scoreGap))) {
      return Number(dossierData.scoreGap) >= -1.0 ? 'PHAN_LUONG_2' : 'PHAN_LUONG_1'
    }
    return 'PHAN_LUONG_1'
  }, [dossierData])

  const [activeTriage, setActiveTriage] = useState(() => {
    try {
      const saved = localStorage.getItem('cbas_step4_active_triage')
      if (saved === 'PHAN_LUONG_1' || saved === 'PHAN_LUONG_2') return saved
    } catch (e) {}
    return autoTriageDecision
  })

  useEffect(() => {
    if (!localStorage.getItem('cbas_step4_active_triage')) {
      setActiveTriage(autoTriageDecision)
    }
  }, [autoTriageDecision])

  const handleSelectTriage = (triageType) => {
    setActiveTriage(triageType)
    try {
      localStorage.setItem('cbas_step4_active_triage', triageType)
    } catch (e) {}
  }

  // --- STATE PHÂN LUỒNG 2: XÁC NHẬN THỰC CHỨNG TINH GỌN (FAST-TRACK VALIDATION) ---
  const [fastTrackChecklist, setFastTrackChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('cbas_step4_checklist')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return {
      c1: true, // Nhận thức áp lực học thuật
      c2: true, // Đánh giá chi phí cơ hội & Tài chính
      c3: true, // Nhận diện rủi ro AI & Tự động hóa
      c4: true, // Tính tự chủ ra quyết định
      c5: true  // Phương án dự phòng an toàn
    }
  })

  const [fastTrackReflection, setFastTrackReflection] = useState(() => {
    try {
      return localStorage.getItem('cbas_step4_fast_track_reflection') || ''
    } catch (e) {
      return ''
    }
  })

  const [fastTrackCompleted, setFastTrackCompleted] = useState(() => {
    try {
      return localStorage.getItem('cbas_step4_fast_track') === 'true' || localStorage.getItem('cbas_step4_completed') === 'true'
    } catch (e) {
      return false
    }
  })

  const handleToggleChecklist = (key) => {
    setFastTrackChecklist(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('cbas_step4_checklist', JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
  }

  const handleCompleteFastTrack = async () => {
    const allChecked = Object.values(fastTrackChecklist).every(Boolean)
    if (!allChecked) {
      setToast({
        type: 'warning',
        message: 'Em vui lòng rà soát và tích chọn đủ 5 tiêu chí phản tư góc khuất nghề nghiệp!'
      })
      return
    }

    const timestamp = new Date().toISOString()
    const payload = {
      triage: 'PHAN_LUONG_2_FAST_TRACK',
      illusion: 'cleared',
      readiness: 9,
      notes: fastTrackReflection.trim() || 'Đã hoàn thành rà soát Case Dossier và bảng kiểm phản tư góc khuất nghề nghiệp đạt chuẩn.',
      checklist: fastTrackChecklist,
      savedAt: timestamp
    }

    try {
      localStorage.setItem('mentor_feedback_record', JSON.stringify(payload))
      localStorage.setItem('cbas_step4_feedback', JSON.stringify(payload))
      localStorage.setItem('cbas_step4_fast_track', 'true')
      localStorage.setItem('cbas_step4_completed', 'true')
      if (fastTrackReflection.trim()) {
        localStorage.setItem('cbas_step4_fast_track_reflection', fastTrackReflection.trim())
      }
    } catch (e) {}

    // Đồng bộ Supabase nếu có user
    try {
      if (user?.id) {
        await supabase.from('counseling_sessions').insert([{
          student_id: user.id,
          counselor_id: 'CV_01',
          scheduled_at: timestamp,
          status: 'completed',
          student_notes: `[Phân luồng 2 - Fast-track Validation] Hoàn thành Case Dossier & Bảng kiểm phản tư góc khuất nghề nghiệp. Ghi chú: ${fastTrackReflection.trim() || 'Đạt chuẩn tinh gọn'}`,
          counselor_notes: '[Hệ thống CBAS]: Xác nhận đạt trạng thái cân bằng nhận thức tinh gọn dưới sự giám sát gián tiếp của Mentor.'
        }])
      }
    } catch (err) {
      console.warn('Lỗi Supabase:', err)
    }

    setFastTrackCompleted(true)
    setToast({
      type: 'success',
      message: '🎉 Xác nhận đạt chuẩn Thực chứng Tinh gọn thành công! Đang chuyển tiếp sang Bước 5...'
    })

    setTimeout(() => {
      navigate('/student/reflection')
    }, 1000)
  }

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
    const studentId = user?.id || profile?.id || '738d7200-cf50-444d-94e3-6afb1352e0f0'
    setIsLoading(true)
    const localItems = getLocalSessions(studentId)
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data) && data.length > 0) {
        setMySessions(data)
        const latest = data[0]
        const meetInfo = parseMeetingInfo(latest.counselor_notes)
        const mentorName = latest.student_notes?.match(/\[Chuyên gia\/Mentor:\s*([^\]]+)\]/)?.[1] || mentorMap[latest.counselor_id] || 'Cố vấn Hướng nghiệp'
        const meetTypeVal = latest.student_notes?.match(/\[Hình thức:\s*([^\]]+)\]/)?.[1] || 'Google Meet'

        setBooking({
          id: latest.id,
          mentor_id: latest.counselor_id,
          mentor_name: mentorName,
          meeting_time: latest.scheduled_at,
          meeting_type: meetTypeVal,
          status: latest.status || 'pending',
          meet_url: meetInfo.meetingUrl,
          location: meetInfo.locationText,
          counselor_notes: latest.counselor_notes
        })
        setNextStepVisible(true)
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

    const counselorFullName = mentorMap[mentor] || mentor
    const studentId = user?.id || profile?.id || '738d7200-cf50-444d-94e3-6afb1352e0f0'

    let scheduledTimestamp = time
    try {
      const d = new Date(time)
      if (!isNaN(d.getTime())) {
        scheduledTimestamp = d.toISOString()
      }
    } catch (e) {}

    // Payload chuẩn CSDL Supabase
    const syncPayload = {
      student_id: studentId,
      counselor_id: '11111111-1111-1111-1111-111111111111',
      scheduled_at: scheduledTimestamp,
      status: 'pending',
      student_notes: `[Chuyên gia/Mentor: ${counselorFullName}]\n[Hình thức: ${currentMeetType}]\n${questions}`
    }

    let createdSession = null
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('counseling_sessions')
        .insert(syncPayload)
        .select()

      if (insertError) {
        console.error("Lỗi Supabase khi đặt lịch:", insertError)
      } else if (inserted && inserted.length > 0) {
        createdSession = inserted[0]
        console.log("Đã đồng bộ lên CSDL Supabase thành công:", createdSession)
      }
    } catch (err) {
      console.warn("Lỗi lưu Supabase:", err)
    }

    if (!createdSession) {
      createdSession = {
        id: `local-${Date.now()}`,
        ...syncPayload,
        created_at: new Date().toISOString()
      }
    }

    // Lưu local backup cho cả học sinh và admin
    saveLocalSession(studentId, createdSession)

    const bookingData = {
      id: createdSession.id,
      mentor_id: mentor,
      mentor_name: counselorFullName,
      meeting_time: time,
      meeting_type: currentMeetType,
      questions: questions,
      status: "pending",
      meet_url: null
    }

    localStorage.setItem("cbas_step4_booking", JSON.stringify(bookingData))
    setBooking(bookingData)
    setNextStepVisible(true)

    fetchMySessions()
    setToast({ type: 'success', message: '🎉 Đã gửi lịch hẹn sang Cố vấn/Admin thành công!' })
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
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-sm">
            <XCircle className="w-3 h-3" /> Từ chối / Đổi lịch
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-sm">
            <Clock className="w-3 h-3" /> Chờ phê duyệt
          </span>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* CSS CHO IN ẤN CHUẨN A4 - CHỈ IN THẺ DOSSIER */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #clinical-dossier-card, #clinical-dossier-card * {
            visibility: visible !important;
          }
          #clinical-dossier-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 2px solid #0f172a !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* THANH TIẾN TRÌNH 5 BƯỚC VISEF CBAS */}
      <div className="no-print">
        <StepProgressHeader 
          currentStep={4} 
          title="Bước 4: Tư Vấn 1-1 Đối Chứng Thực Tế" 
          subtitle="Xuất Hồ sơ lâm sàng mang theo gặp Mentor/Cố vấn và ghi lại Nhật ký thu hoạch sau buổi đối thoại." 
        />
      </div>

      {/* HEADER SECTION: BƯỚC 4 TIÊU ĐỀ & CHỈ SỐ TIẾN TRÌNH */}
      <div className="no-print bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Bước 4 / Quy trình Can thiệp 5 Bước
            </span>
            <span className="text-xs text-slate-400">CBAS ViSEF 2026 Protocol</span>
          </div>

          {/* CHỈ BÁO THUẬT TOÁN PHÂN LUỒNG THÍCH ỨNG HIỆN TẠI */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              activeTriage === 'PHAN_LUONG_2'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {activeTriage === 'PHAN_LUONG_2' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Phân Luồng 2: Xác Nhận Tinh Gọn (Fast-track)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Phân Luồng 1: Tham Vấn 1-1 Chuyên Sâu</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            BƯỚC 4: THAM VẤN ĐỐI CHẤT CÓ PHÂN LUỒNG THÍCH ỨNG (ADAPTIVE TRIAGE)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
            Hệ thống tự động kích hoạt thuật toán phân luồng dựa trên mức độ lệch nhận thức (CRS) và đối chứng dữ liệu tại Bước 3 nhằm tối ưu hóa nguồn lực tư vấn học đường.
          </p>
        </div>

        {/* CỤM TAB CHUYỂN ĐỔI 2 PHÂN LUỒNG */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSelectTriage('PHAN_LUONG_1')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTriage === 'PHAN_LUONG_1'
                  ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Phân Luồng 1: Tham Vấn 1-1 Chuyên Sâu (20 - 30 Phút)</span>
              {autoTriageDecision === 'PHAN_LUONG_1' && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded">Hệ thống đề xuất</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectTriage('PHAN_LUONG_2')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTriage === 'PHAN_LUONG_2'
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Phân Luồng 2: Xác Nhận Tinh Gọn (5 - 10 Phút)</span>
              {autoTriageDecision === 'PHAN_LUONG_2' && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">Hệ thống đề xuất</span>
              )}
            </button>
          </div>

          {activeTriage === 'PHAN_LUONG_1' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackTo4A}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentStage === '4A'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>4A. Chuẩn Bị & Xuất Hồ Sơ</span>
                {currentStage === '4A' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
              <span className="text-slate-300">➔</span>
              <button
                type="button"
                onClick={() => {
                  if (currentStage === '4A') handleComplete4A()
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentStage === '4B'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>4B. Nhật Ký Thu Hoạch</span>
                {feedbackSaved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHÂN LUỒNG 1: THAM VẤN TRỰC TIẾP CHUYÊN SÂU (IN-DEPTH 1-ON-1)              */}
      {/* ========================================================================= */}
      {activeTriage === 'PHAN_LUONG_1' && (
        <div className="space-y-6">
          
          {/* BANNER GIẢI THÍCH PHÂN LUỒNG 1 */}
          <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 md:p-6 space-y-2">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                Phân Luồng 1: Tham Vấn Trực Tiếp Chuyên Sâu (In-depth 1-on-1)
              </h3>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
              Số liệu đối chứng cho thấy điểm học bạ của em đang có khoảng cách ({formattedScoreGap}) so với điểm chuẩn thực tế, 
              hoặc em đang chịu áp lực định kiến/băn khoăn lớn (độ lệch nhận thức CRS lớn). 
              Học sinh bắt buộc tham gia phiên đối chất 1-1 trực tiếp cùng Mentor (20 - 30 phút) để bóc tách các rào cản tâm lý, 
              áp lực định kiến và tái cấu trúc mục tiêu an toàn.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* GIAI ĐOẠN 4A: CHUẨN BỊ THAM VẤN & XUẤT HỒ SƠ ĐỐI CHẤT (TRƯỚC KHI GẶP)      */}
          {/* ========================================================================= */}
          {currentStage === '4A' && (
            <div className="space-y-6">
          
          {/* 1. THẺ TÓM TẮT HỒ SƠ ĐỐI CHẤT DỮ LIỆU CÁ NHÂN (CLINICAL DOSSIER CARD) */}
          <div 
            id="clinical-dossier-card"
            className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6 relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                    CBAS VISEF 2026 • CLINICAL DOSSIER
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Dùng để tham vấn trực tiếp 1-1
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                  📋 HỒ SƠ ĐỐI CHẤT DỮ LIỆU CÁ NHÂN (DÙNG ĐỂ THAM VẤN 1-1)
                </h3>
                <p className="text-xs font-black text-indigo-700 mt-1">
                  MÃ HỌC SINH THỰC NGHIỆM: <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-indigo-900">{displayStudentCode}</span>
                </p>
              </div>

              {/* Nút In / Lưu Ảnh Hồ Sơ */}
              <button
                type="button"
                onClick={handlePrintDossier}
                className="no-print inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow transition transform active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In / Lưu Ảnh Hồ Sơ Này Để Cầm Theo 🖨️</span>
              </button>
            </div>

            {/* LƯỚI THÔNG TIN TÓM TẮT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm mb-4">
              {/* Mục tiêu */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  🎯 Mục Tiêu Đào Tạo:
                </span>
                <p className="text-slate-900 font-medium">
                  Ngành <span className="font-bold text-indigo-700 text-sm md:text-base">{dossierData.targetMajor}</span> tại <span className="font-bold text-slate-800 text-sm md:text-base">{dossierData.targetSchool}</span>
                </p>
              </div>

              {/* Thiên hướng & Tự tin */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  🧭 Thiên Hướng & Mức Tự Tin:
                </span>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-600 text-xs">Mã Holland: </span>
                    <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200 text-xs">{dossierData.hollandCode}</span>
                  </div>
                  <div className="border-l border-slate-300 pl-4">
                    <span className="text-slate-600 text-xs">Tự tin ban đầu: </span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">{dossierData.initialConfidence}/10</span>
                  </div>
                </div>
              </div>

              {/* Tổ hợp & Học bạ */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  📚 Tổ Hợp Xét Tuyển & Năng Lực Học Bạ:
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-xs">
                    Tổ hợp: {dossierData.targetCombination}
                  </span>
                  <span className="text-slate-400 text-xs">|</span>
                  <span className="text-slate-700 font-semibold text-xs">
                    Điểm học bạ: <strong className="text-emerald-700 text-sm">{dossierData.totalStudentScore}đ</strong>
                  </span>
                </div>
              </div>

              {/* Điểm chuẩn 2 năm & Chênh lệch */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  ⚖️ Điểm Chuẩn Thực Tế 2 Năm & Độ Lệch:
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-800 font-semibold text-xs">
                    Điểm chuẩn 2 năm: <strong className="text-slate-900 text-sm">{dossierData.avgCutoff}đ</strong>
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                    isPositiveGap 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    Chênh lệch: {formattedScoreGap}
                  </span>
                </div>
              </div>
            </div>

            {/* Băn khoăn cốt lõi */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Băn khoăn cốt lõi của học sinh (Tự phản tư tại Bước 3):
                </span>
              </div>
              <p className="text-xs md:text-sm text-amber-950 font-medium italic leading-relaxed pl-6">
                "{dossierData.reflectionText}"
              </p>
            </div>
          </div>

          {/* 2. HƯỚNG DẪN HỌC SINH ĐẶT CÂU HỎI CHO MENTOR / CỐ VẤN */}
          <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
              <HelpCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-wide">
                💡 Hướng Dẫn Học Sinh Đặt Câu Hỏi Cho Mentor / Cố Vấn (3 Câu Hỏi Then Chốt):
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Khi đối thoại 1-1 cùng Thầy/Cô hoặc Anh/Chị Mentor, em hãy tự tin cầm theo Hồ sơ đối chất phía trên và trực tiếp chất vấn 3 câu hỏi sau để bóc tách toàn diện mọi rủi ro:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Câu 1 */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">1</span>
                    <span>Bứt Phá Điểm Môn Sở Trường</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-bold">
                    "Chiến lược kéo điểm môn sở trường để bù cho môn đang đuối sức."
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-indigo-100 italic">
                  Hỏi cách phân bổ thời gian ôn tập và kỹ năng phòng thi thực chiến để tối ưu hóa điểm số môn thế mạnh.
                </p>
              </div>

              {/* Câu 2 */}
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-sky-700 font-bold mb-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px]">2</span>
                    <span>Trường Dự Phòng Vừa Sức (NV2)</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-bold">
                    "Các trường Đại học nguyện vọng dự phòng vừa sức (ĐH Phú Yên, Khánh Hòa...)."
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-sky-100 italic">
                  Hỏi kinh nghiệm chọn trường có cùng ngành đào tạo với phổ điểm an toàn hơn để lập mạng lưới dự phòng vững vàng.
                </p>
              </div>

              {/* Câu 3 */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">3</span>
                    <span>Thuyết Phục Gia Đình Đồng Thuận</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-bold">
                    "Cách thuyết phục cha mẹ đồng thuận với năng lực thực tế của bản thân."
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-emerald-100 italic">
                  Hỏi phương pháp trình bày số liệu điểm số và cơ hội nghề nghiệp để cha mẹ thấu hiểu thay vì áp đặt kỳ vọng quá lớn.
                </p>
              </div>
            </div>
          </div>

          {/* (TÙY CHỌN PHỤ TRỢ): FORM ĐẶT LỊCH TRỰC TUYẾN / KIỂM TRA LỊCH HẸN */}
          <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <button
              type="button"
              onClick={() => setShowOnlineBooking(!showOnlineBooking)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-indigo-600 transition p-2 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                📅 Đặt Lịch Hẹn Trực Tuyến / Tra Cứu Phòng Họp (Nếu Chưa Gặp Trực Tiếp)
              </span>
              <span>{showOnlineBooking ? '▲ Thu gọn' : '▼ Mở rộng để xem'}</span>
            </button>

            {showOnlineBooking && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Form đặt lịch */}
                <form id="step4BookingForm" onSubmit={handleBookingStep4} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      1. Chọn Cố vấn / Mentor phù hợp ngành nhắm tới: <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="mentorSelect"
                      required
                      value={selectedMentor}
                      onChange={(e) => setSelectedMentor(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
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

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. Hình thức trao đổi:
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="meetType"
                          value="Google Meet"
                          checked={meetType === 'Google Meet'}
                          onChange={(e) => setMeetType(e.target.value)}
                        />
                        <span>💻 Google Meet</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="meetType"
                          value="Trực tiếp"
                          checked={meetType === 'Trực tiếp'}
                          onChange={(e) => setMeetType(e.target.value)}
                        />
                        <span>🏫 Trực tiếp</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      3. Khung thời gian mong muốn: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="appointmentTime"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      4. Câu hỏi chất vấn chuẩn bị trước: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="studentQuestions"
                      required
                      rows={2}
                      value={studentQuestions}
                      onChange={(e) => setStudentQuestions(e.target.value)}
                      placeholder="Ví dụ: Em muốn hỏi về rủi ro điểm chuẩn và các phương án dự phòng..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                  >
                    Xác Nhận Đặt Lịch Hẹn Online
                  </button>
                </form>

                {/* Trạng thái lịch hẹn */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">📌 Trạng Thái Đăng Ký</h4>
                  {booking ? (
                    <div className="text-xs space-y-1.5">
                      <p><strong>Cố vấn:</strong> {booking.mentor_name}</p>
                      <p><strong>Thời gian:</strong> {booking.meeting_time}</p>
                      <p><strong>Hình thức:</strong> {booking.meeting_type}</p>
                      <div className="mt-2">{getStatusBadge(booking.status)}</div>
                      {booking.meet_url && (
                        <a
                          href={booking.meet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-indigo-600 font-bold underline"
                        >
                          🌐 Bấm vào đây để vào Google Meet
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">Chưa có lịch hẹn online nào được gửi.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. NÚT KÍCH HOẠT HOÀN THÀNH BUỔI GẶP */}
          <div className="no-print bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border-2 border-emerald-300 p-6 text-center shadow-sm">
            <div className="max-w-xl mx-auto">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-950 mb-1.5">
                Xác Nhận Đã Trao Đổi Cùng Cố Vấn / Mentor
              </h4>
              <p className="text-xs md:text-sm text-emerald-800 mb-5 font-medium leading-relaxed">
                Sau khi em đã gặp trực tiếp Thầy/Cô hoặc Anh/Chị Cố vấn để trao đổi xong, hãy bấm nút bên dưới để ghi nhận biên bản.
              </p>

              <button
                type="button"
                onClick={handleComplete4A}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm md:text-base rounded-xl shadow-lg hover:shadow-xl transition transform cursor-pointer w-full sm:w-auto"
              >
                <span>TÔI ĐÃ HOÀN THÀNH BUỔI THAM VẤN TRỰC TIẾP</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* GIAI ĐOẠN 4B: GHI NHẬN BIÊN BẢN ĐÁNH GIÁ (CHỈ HIỆN KHI BẤM NÚT Ở 4A)     */}
      {/* ========================================================================= */}
      {currentStage === '4B' && (
        <div className="bg-white rounded-2xl border-2 border-violet-400 shadow-md p-6 md:p-8 mb-6">
          {/* Top bar with back button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-sm">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-violet-100 text-violet-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                    Giai Đoạn 4B
                  </span>
                  {feedbackSaved && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Đã lưu Nhật ký
                    </span>
                  )}
                </div>
                <h3 className="text-base md:text-xl font-extrabold text-slate-900 mt-1 uppercase">
                  GIAI ĐOẠN 4B: NHẬT KÝ THU HOẠCH SAU BUỔI THAM VẤN 1-1 (STUDENT REFLECTION LOG)
                </h3>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Ghi nhận sự chuyển biến nhận thức và đúc kết của em sau khi đối thoại trực tiếp cùng Thầy/Cô/Mentor.
                </p>
              </div>
            </div>

            {/* Nút quay lại xem Dossier */}
            <button
              type="button"
              onClick={handleBackTo4A}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <span>← Xem lại Hồ sơ đối chất 4A</span>
            </button>
          </div>

          <div className="space-y-6 text-xs md:text-sm">
            {/* MỤC 1: Góc nhìn về mục tiêu nghề nghiệp thay đổi */}
            <div className="p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                1. Sau buổi trò chuyện trực tiếp, góc nhìn của em về mục tiêu nghề nghiệp đã thay đổi như thế nào? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { 
                    val: 'persisted', 
                    label: 'Em vẫn giữ nguyên kỳ vọng ban đầu, chưa thực sự sẵn sàng thay đổi phương án.'
                  },
                  { 
                    val: 'reduced', 
                    label: 'Em đã nhìn nhận rõ hơn độ khó của điểm chuẩn/việc làm và bắt đầu cân nhắc các phương án thích ứng.'
                  },
                  { 
                    val: 'cleared', 
                    label: 'Em đã nắm vững bức tranh thực tế và chủ động định hình lộ trình đa tuyến an toàn.'
                  }
                ].map(opt => (
                  <label 
                    key={opt.val} 
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      feedbackIllusion === opt.val
                        ? 'bg-violet-50/80 border-violet-400 text-violet-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackIllusion"
                      value={opt.val}
                      checked={feedbackIllusion === opt.val}
                      onChange={(e) => setFeedbackIllusion(e.target.value)}
                      className="mt-0.5 accent-violet-600"
                    />
                    <div>
                      <span className="font-bold block text-xs md:text-sm leading-relaxed">{opt.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* MỤC 2: Mức độ sẵn sàng vượt khó và đón nhận thực tế */}
            <div className="p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    2. Mức độ sẵn sàng vượt khó và đón nhận thực tế của em lúc này:
                  </label>
                  <span className="px-3 py-1 bg-violet-600 text-white rounded-lg font-black text-sm shadow-sm">
                    {feedbackReadiness}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackReadiness}
                  onChange={(e) => setFeedbackReadiness(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-2 px-1">
                  <span>Còn băn khoăn</span>
                  <span>Đang cân nhắc</span>
                  <span>Sẵn sàng dấn thân</span>
                </div>
              </div>
            </div>

            {/* MỤC 3: Lời khuyên hoặc bài học kinh nghiệm sâu sắc nhất từ Thầy/Cô/Mentor */}
            <div className="p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">
                3. Lời khuyên hoặc bài học kinh nghiệm sâu sắc nhất từ Thầy/Cô/Mentor mà em đúc kết được: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ghi lại 1-2 lời dặn dò then chốt của người tư vấn giúp em định hướng rõ ràng hơn..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            {/* NÚT BẤM HOÀN TẤT */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveFeedback}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow transition transform active:scale-95 text-xs md:text-sm cursor-pointer"
                >
                  Lưu Nhật Ký Thu Hoạch 💾
                </button>
                <button
                  type="button"
                  onClick={handleResetStep4}
                  className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition text-xs md:text-sm cursor-pointer flex items-center gap-1.5"
                  title="Xóa nhật ký thu hoạch để viết lại từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại Bước 4B</span>
                </button>
              </div>

              <button
                type="button"
                onClick={goToStep5}
                className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 text-xs md:text-sm cursor-pointer"
              >
                <span>Sang Bước 5: Thiết Lập Kế Hoạch Hành Động Đa Tuyến</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      )}

      {/* ========================================================================= */}
      {/* PHÂN LUỒNG 2: XÁC NHẬN THỰC CHỨNG TINH GỌN (FAST-TRACK VALIDATION)        */}
      {/* ========================================================================= */}
      {activeTriage === 'PHAN_LUONG_2' && (
        <div className="space-y-6">

          {/* 1. THẺ GIẢI THÍCH PHÂN LUỒNG & TRẠNG THÁI CÂN BẰNG NHẬN THỨC */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                  ✓
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                    Thuật Toán Phân Luồng • Fast-Track Validation
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    Trạng Thái Cân Bằng Nhận Thức (CRS Tiệm Cận 0)
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block">Thời lượng đề xuất:</span>
                <span className="text-sm font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 inline-block mt-0.5">
                  ⏱️ 5 - 10 Phút Tinh Gọn
                </span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
              Số liệu đối chứng tại Bước 3 cho thấy điểm học bạ ước tính của em (<strong className="text-emerald-900">{dossierData.totalStudentScore}đ</strong>) 
              nằm trong vùng an toàn của đề án tuyển sinh (<strong className="text-slate-900">{dossierData.avgCutoff}đ</strong>, chênh lệch {formattedScoreGap}), 
              và mức tự tin phản ánh sát với thực tế. Em không bắt buộc phải tham gia phiên đối chất 1-1 kéo dài 20 - 30 phút, mà thực hiện 
              <strong> rà soát độc lập thông qua Hồ sơ kinh nghiệm thực tế (Case Dossier)</strong> và hoàn thành 
              <strong> Bảng kiểm phản tư góc khuất nghề nghiệp</strong> dưới sự giám sát gián tiếp của Mentor trước khi bước vào lập kế hoạch hành động.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-slate-500 font-bold block mb-0.5">Mục tiêu ngành:</span>
                <span className="font-extrabold text-indigo-700">{dossierData.targetMajor}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-slate-500 font-bold block mb-0.5">Trường mục tiêu:</span>
                <span className="font-extrabold text-slate-800">{dossierData.targetSchool}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <span className="text-slate-500 font-bold block mb-0.5">Độ lệch nhận thức CRS:</span>
                <span className="font-extrabold text-emerald-700">Tiệm cận 0 (Vững vàng)</span>
              </div>
            </div>
          </div>

          {/* 2. HỒ SƠ KINH NGHIỆM THỰC TẾ (CASE DOSSIER) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">
                  1. HỒ SƠ KINH NGHIỆM THỰC TẾ (CASE DOSSIER - NGƯỜI ĐI TRƯỚC TRONG NGÀNH)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đúc kết từ khảo sát thực tế và kinh nghiệm của các Cựu sinh viên & Mentor ngành {dossierData.targetMajor}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Case 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-black">1</span>
                  <span>Cường Độ & Áp Lực Học Tập</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  "Không có chuyện vào đại học là xả hơi. Các môn cơ sở và chuyên ngành đòi hỏi tự học gấp đôi trên lớp, làm việc nhóm cường độ cao và bảo vệ đồ án thực tế."
                </p>
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  ➔ Góc khuất: Phải có thói quen tự học kỷ luật ngay từ năm nhất.
                </p>
              </div>

              {/* Case 2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black">2</span>
                  <span>Thực Tế Tuyển Dụng & Đãi Ngộ</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  "Mức lương khởi điểm thực tế của cử nhân mới tốt nghiệp không hào nhoáng như trên mạng. Nhà tuyển dụng đòi hỏi kỹ năng thực chiến và kinh nghiệm dự án thực tế."
                </p>
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  ➔ Góc khuất: Cần sớm đi thực tập và tích lũy portfolio năng lực.
                </p>
              </div>

              {/* Case 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-cyan-700 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-[10px] font-black">3</span>
                  <span>Làn Sóng AI & Đào Thải</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  "AI đang tự động hóa các tác vụ lặp lại cơ bản. Người làm nghề buộc phải nâng cao tư duy phản biện, kỹ năng giải quyết bài toán phức tạp và thành thạo ứng dụng AI."
                </p>
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  ➔ Góc khuất: Không dừng lại ở kiến thức sách giáo khoa đại cương.
                </p>
              </div>
            </div>
          </div>

          {/* 3. BẢNG KIỂM PHẢN TƯ GÓC KHUẤT NGHỀ NGHIỆP */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">
                  2. BẢNG KIỂM PHẢN TƯ GÓC KHUẤT NGHỀ NGHIỆP (HIDDEN OCCUPATIONAL BIASES CHECKLIST)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rà soát trung thực 5 tiêu chí để đảm bảo em không vướng phải bất kỳ thiên lệch tâm lý nào trước khi chốt kế hoạch:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'c1',
                  title: 'Tiêu chí 1: Nhận thức áp lực học thuật chuyên sâu',
                  desc: 'Em đã tìm hiểu khung chương trình đào tạo 4 năm của ngành và chuẩn bị tâm lý đối mặt với các môn học khó nhất mà sinh viên hay nợ môn.'
                },
                {
                  key: 'c2',
                  title: 'Tiêu chí 2: Chi phí cơ hội & Năng lực tài chính thực tế',
                  desc: 'Em đã nắm rõ mức học phí cả khóa cùng chi phí sinh hoạt hàng tháng; gia đình có khả năng trang trải hoặc em đã có phương án tài chính dự phòng an toàn.'
                },
                {
                  key: 'c3',
                  title: 'Tiêu chí 3: Rủi ro đào thải & Thách thức từ Trí tuệ Nhân tạo (AI)',
                  desc: 'Em nhận thức rõ các tác vụ cơ bản trong ngành có nguy cơ bị AI thay thế và sẵn sàng chủ động rèn luyện kỹ năng công nghệ/kỹ năng mềm thích ứng.'
                },
                {
                  key: 'c4',
                  title: 'Tiêu chí 4: Sự kiên định & Tính tự chủ ra quyết định',
                  desc: 'Lựa chọn ngành nghề này xuất phát từ năng lực thực chất và sở thích bền vững của bản thân, không chạy theo trào lưu ngắn hạn hay áp lực đám đông.'
                },
                {
                  key: 'c5',
                  title: 'Tiêu chí 5: Thiết lập phương án nguyện vọng dự phòng an toàn',
                  desc: 'Em đã có sẵn ít nhất một nguyện vọng dự phòng vừa sức (NV2, NV3) trong cùng khối ngành để bảo đảm 100% cơ hội nếu điểm chuẩn biến động bất ngờ.'
                }
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                    fastTrackChecklist[item.key]
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={fastTrackChecklist[item.key]}
                    onChange={() => handleToggleChecklist(item.key)}
                    className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="font-bold text-xs md:text-sm block text-slate-900">{item.title}</span>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Ô phản tư thu hoạch ngắn */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">
                Ghi chú phản tư nhanh: Một góc khuất thực tế em nhận thức rõ nhất và cách em sẽ vượt qua:
              </label>
              <textarea
                rows={2}
                value={fastTrackReflection}
                onChange={(e) => setFastTrackReflection(e.target.value)}
                placeholder="VD: Em nhận thức rõ môn Toán cao cấp và Lập trình ở năm 1 rất khó, em sẽ dành 60 phút mỗi tối tự luyện bài tập và học nhóm cùng các bạn..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* 4. GIÁM SÁT GIÁN TIẾP CỦA MENTOR & NÚT HOÀN TẤT BƯỚC 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Giám Sát Gián Tiếp:</span>
                  <span className="font-bold text-slate-900 text-xs md:text-sm">
                    Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường (CV_01)
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300 shrink-0 text-center">
                ✓ Đủ điều kiện tinh gọn
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSelectTriage('PHAN_LUONG_1')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold underline cursor-pointer"
              >
                ← Nếu em vẫn còn áp lực tâm lý hoặc muốn đối chất trực tiếp 1-1, bấm vào đây
              </button>

              <button
                type="button"
                onClick={handleCompleteFastTrack}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 text-xs md:text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>XÁC NHẬN ĐẠT CHUẨN THỰC CHỨNG TINH GỌN & TIẾP TỤC BƯỚC 5</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* DANH SÁCH LỊCH HẸN ĐÃ ĐĂNG KÝ (NẾU CÓ DỮ LIỆU) */}
      {mySessions.length > 0 && (
        <div className="no-print mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
            📜 Lịch Sử Đăng Ký Tham Vấn Của Em ({mySessions.length} suất hẹn)
          </h3>
          <div className="space-y-2">
            {mySessions.map((item, idx) => {
              const expert = getCounselorDetails(item?.counselor_id, item?.counselor, item?.student_notes, item?.counselor_name || item?.mentor_id)
              const contact = parseStudentContact(item?.student_notes)
              return (
                <div key={item?.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <strong className="text-slate-900">{expert?.fullName || item?.counselor_name || 'Cố vấn Hướng nghiệp'}</strong>
                    {getStatusBadge(item?.status)}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    🕒 Thời gian: {formatDateTimeFormatted(item?.scheduled_at)}
                  </div>
                  {contact?.question && (
                    <div className="mt-1 text-slate-700 italic text-[11px]">
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
