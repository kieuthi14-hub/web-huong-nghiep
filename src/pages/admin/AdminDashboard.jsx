import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getCounselorDetails, formatDateTimeFormatted } from '../student/CounselingBooking'
import { CalendarDays, CheckCircle2, XCircle, Clock, User, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react'

// Bộ Dữ Liệu NCKH Mẫu ViSEF Dự Phòng (Fallback Seed Data khi Vercel chưa kết nối Env DB)
const VISEF_SEED_USERS = [
  { id: 'usr-001', full_name: 'Nguyễn Văn An', email: 'nguyenvanan.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-10T08:30:00Z' },
  { id: 'usr-002', full_name: 'Trần Thị Bích', email: 'tranbich.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-11T09:15:00Z' },
  { id: 'usr-003', full_name: 'Phạm Hoàng Nam', email: 'hoangnam.visef@gmail.com', grade_level: 'Grade 11', created_at: '2026-02-12T10:45:00Z' },
  { id: 'usr-004', full_name: 'Lê Quốc Bảo', email: 'quocbao.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-12T14:20:00Z' },
  { id: 'usr-005', full_name: 'Vũ Thị Mai', email: 'thimai.visef@gmail.com', grade_level: 'Grade 10', created_at: '2026-02-13T11:10:00Z' }
]

const VISEF_SEED_MATRICES = [
  {
    id: 'mat-001',
    student_id: 'usr-001',
    target_major: 'Khoa học máy tính',
    evidence: 'Điểm Toán 9.0, học bạ Kỹ thuật tốt',
    verified_sources: 'Báo cáo nhu cầu nhân lực CNTT 2025',
    risk_analysis: 'Nguy cơ AI thay thế lập trình viên junior',
    bias_check: 'Thích từ nhỏ vì xem phim hacker',
    detected_bias: 'EMOTIONAL_BIAS',
    final_decision: 'CHANGED',
    created_at: '2026-02-10T08:35:00Z'
  },
  {
    id: 'mat-002',
    student_id: 'usr-002',
    target_major: 'Marketing & Truyền thông',
    evidence: 'Tích cực làm nội dung truyền thông cho CLB Trường',
    verified_sources: 'Đã tra cứu chuẩn đầu ra ĐH Kinh tế',
    risk_analysis: 'Áp lực KPI và thay đổi thuật toán mạng xã hội',
    bias_check: 'Xem video TikTok thấy ngành này sang chảnh',
    detected_bias: 'BANDWAGON_BIAS',
    final_decision: 'BACKUP',
    created_at: '2026-02-11T09:20:00Z'
  },
  {
    id: 'mat-003',
    student_id: 'usr-003',
    target_major: 'Kỹ thuật phần mềm',
    evidence: 'Đã giải được các bài tập lập trình C++ nâng cao',
    verified_sources: 'Tham khảo ý kiến anh chị sinh viên khóa trước',
    risk_analysis: 'Áp lực OT và ngồi máy tính liên tục',
    bias_check: 'Nghĩ ngành này hoàn hảo không có rủi ro',
    detected_bias: 'OPTIMISM_BIAS',
    final_decision: 'CONFIRMED',
    created_at: '2026-02-12T10:50:00Z'
  },
  {
    id: 'mat-004',
    student_id: 'usr-004',
    target_major: 'Quản trị kinh doanh',
    evidence: 'Có tố chất giao tiếp tốt và làm nhóm hiệu quả',
    verified_sources: 'Đã tham khảo Cổng thông tin Tuyển sinh Bộ GD&ĐT',
    risk_analysis: 'Tỷ lệ chọi cao, mức độ cạnh tranh gay gắt',
    bias_check: 'Tiếc công sức 2 năm ôn thi khối A01',
    detected_bias: 'SUNK_COST_BIAS',
    final_decision: 'BACKUP',
    created_at: '2026-02-12T14:25:00Z'
  },
  {
    id: 'mat-005',
    student_id: 'usr-005',
    target_major: 'Trí tuệ nhân tạo (AI)',
    evidence: 'Học sinh chuyên Toán, tự học Python cơ bản',
    verified_sources: 'Đọc lộ trình đào tạo ĐH Bách Khoa',
    risk_analysis: 'Yêu cầu kiến thức Toán cao cấp và Thuật toán sâu',
    bias_check: 'Đã kiểm tra kỹ năng lực thực tế, không bị cảm xúc',
    detected_bias: 'DEBIASED_SUCCESS',
    final_decision: 'CONFIRMED',
    created_at: '2026-02-13T11:15:00Z'
  }
]

// Seed Data Lịch Tư Vấn 1-1 cho Admin
const VISEF_SEED_COUNSELING = [
  {
    id: 'cs-001',
    student_id: 'usr-001',
    student: { full_name: 'Nguyễn Văn An', email: 'nguyenvanan.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '33333333-3333-4333-a333-333333333301',
    counselor_name: '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
    scheduled_at: '2026-02-25T14:30:00Z',
    status: 'pending',
    student_notes: '[Chuyên gia/Mentor: [CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)]\nEm muốn nhờ anh tư vấn kỹ hơn về môi trường học thực tế ngành Kỹ thuật Máy tính và AI tại Bách Khoa ạ.',
    created_at: '2026-02-13T10:00:00Z'
  },
  {
    id: 'cs-002',
    student_id: 'usr-002',
    student: { full_name: 'Trần Thị Bích', email: 'tranbich.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '11111111-1111-4111-a111-111111111111',
    counselor_name: 'Thầy Cao Xuân Hải (Bí thư đoàn trường) - Cố vấn Định hướng Nghề nghiệp',
    scheduled_at: '2026-02-26T09:00:00Z',
    status: 'confirmed',
    student_notes: '[Chuyên gia/Mentor: Thầy Cao Xuân Hải (Bí thư đoàn trường) - Cố vấn Định hướng Nghề nghiệp]\nNhờ Thầy tư vấn đánh giá phương thức xét tuyển sớm bằng học bạ và thi ĐGNL ĐHQG.',
    created_at: '2026-02-12T15:20:00Z'
  },
  {
    id: 'cs-003',
    student_id: 'usr-003',
    student: { full_name: 'Phạm Hoàng Nam', email: 'hoangnam.visef@gmail.com', grade_level: 'Grade 11' },
    counselor_id: '33333333-3333-4333-a333-333333333307',
    counselor_name: '[Sư phạm & Ngôn ngữ] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
    scheduled_at: '2026-02-27T16:00:00Z',
    status: 'pending',
    student_notes: '[Chuyên gia/Mentor: [Sư phạm & Ngôn ngữ] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)]\nEm muốn tìm hiểu lộ trình thi chứng chỉ IELTS và cơ hội việc làm ngành Biên dịch tiếng Anh.',
    created_at: '2026-02-13T08:15:00Z'
  },
  {
    id: 'cs-004',
    student_id: 'usr-004',
    student: { full_name: 'Lê Quốc Bảo', email: 'quocbao.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '22222222-2222-4222-a222-222222222222',
    counselor_name: 'Cô Nguyễn Thị Kim Thuận - Chuyên gia Tư vấn Tâm lý Học đường',
    scheduled_at: '2026-02-24T10:30:00Z',
    status: 'rejected',
    student_notes: '[Chuyên gia/Mentor: Cô Nguyễn Thị Kim Thuận - Chuyên gia Tư vấn Tâm lý Học đường]\nEm đang gặp áp lực tâm lý thi cử từ phía gia đình khi gia đình bắt thi Y khoa.',
    created_at: '2026-02-11T11:00:00Z'
  }
]

const AdminDashboard = ({ activeTabDefault = 'counseling' }) => {
  const { user } = useAuth()
  
  // Trạng thái tab hiển thị: 'counseling' | 'reflections' | 'users'
  const [activeTab, setActiveTab] = useState(activeTabDefault)

  // Dữ liệu từ Supabase DB
  const [usersList, setUsersList] = useState([])
  const [matricesList, setMatricesList] = useState([])
  const [counselingSessions, setCounselingSessions] = useState([])
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalReflections: 0, 
    debiasedSuccessPct: 0, 
    topMajor: 'Chưa có' 
  })
  
  const [debiasStats, setDebiasStats] = useState({ 
    success: 0, 
    sunkCost: 0, 
    bandwagon: 0, 
    emotional: 0, 
    optimism: 0,
    total: 0 
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    fetchRealSupabaseData()
  }, [user])

  // Lắng nghe Realtime tự động từ Supabase
  useEffect(() => {
    let channel = null
    try {
      if (supabase && typeof supabase.channel === 'function') {
        channel = supabase
          .channel('public:counseling_sessions_admin')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'counseling_sessions' },
            (payload) => {
              console.log('⚡ [Admin Realtime] Phát hiện thay đổi trong counseling_sessions:', payload)
              fetchRealSupabaseData(false)
            }
          )
          .subscribe()
      }
    } catch (e) {
      console.warn('Realtime subscription warning:', e)
    }

    return () => {
      if (channel && supabase && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchRealSupabaseData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    let realUsers = []
    let realMatrices = []
    let realCounseling = []
    let isDbConnected = false

    try {
      if (supabase && typeof supabase.from === 'function') {
        // 1. Truy vấn Profiles
        const { data: usersData, error: uErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!uErr && Array.isArray(usersData) && usersData.length > 0) {
          realUsers = usersData
          isDbConnected = true
        }

        // 2. Truy vấn metacognitive_matrix
        const { data: matrixData, error: mErr } = await supabase
          .from('metacognitive_matrix')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!mErr && Array.isArray(matrixData) && matrixData.length > 0) {
          realMatrices = matrixData
          isDbConnected = true
        }

        // 3. Truy vấn counseling_sessions kèm quan hệ student & counselor
        const { data: counselingData, error: cErr } = await supabase
          .from('counseling_sessions')
          .select('*, student:student_id(full_name, email, grade_level), counselor:counselor_id(full_name, email)')
          .order('created_at', { ascending: false })

        if (!cErr && Array.isArray(counselingData) && counselingData.length > 0) {
          realCounseling = counselingData
          isDbConnected = true
        }
      }
    } catch (e) {
      console.warn('Supabase DB chưa có dữ liệu hoặc chưa kết nối Env:', e)
    }

    // Đọc thêm dữ liệu LocalStorage (nếu có từ thiết bị)
    let localSessions = []
    try {
      if (user?.id) {
        const raw = localStorage.getItem(`counseling_sessions_local_${user.id}`)
        if (raw) localSessions = JSON.parse(raw)
      }
    } catch (e) {
      console.error('Lỗi đọc local storage:', e)
    }

    // Khớp nối dữ liệu Counseling
    const combinedCounseling = [...realCounseling]
    const dbIds = new Set(realCounseling.map(c => c.id))
    localSessions.forEach(ls => {
      if (!dbIds.has(ls.id)) {
        combinedCounseling.push(ls)
      }
    })

    if (combinedCounseling.length === 0) {
      realCounseling = VISEF_SEED_COUNSELING
    } else {
      realCounseling = combinedCounseling
    }

    // Nếu không kết nối DB -> Dùng Fallback Seed Data
    if (!isDbConnected || (realUsers.length === 0 && realMatrices.length === 0)) {
      realUsers = VISEF_SEED_USERS
      realMatrices = VISEF_SEED_MATRICES
      setIsUsingFallback(true)
    } else {
      setIsUsingFallback(false)
    }

    setUsersList(realUsers)
    setMatricesList(realMatrices)
    setCounselingSessions(realCounseling)

    // Thống kê Phản tư & Bẫy tư duy
    let successCnt = 0
    let sunkCostCnt = 0
    let bandwagonCnt = 0
    let emotionalCnt = 0
    let optimismCnt = 0
    const majorFrequency = {}

    realMatrices.forEach(item => {
      if (item?.target_major) {
        const majorTrimmed = String(item.target_major).trim()
        if (majorTrimmed) {
          majorFrequency[majorTrimmed] = (majorFrequency[majorTrimmed] || 0) + 1
        }
      }

      const decision = item?.final_decision
      const bias = item?.detected_bias

      if (decision === 'BACKUP' || decision === 'CHANGED' || bias === 'DEBIASED_SUCCESS' || bias === 'BALANCED') {
        successCnt++
      } else if (bias === 'SUNK_COST_BIAS') {
        sunkCostCnt++
      } else if (bias === 'BANDWAGON_BIAS') {
        bandwagonCnt++
      } else if (bias === 'EMOTIONAL_BIAS') {
        emotionalCnt++
      } else if (bias === 'OPTIMISM_BIAS') {
        optimismCnt++
      } else {
        successCnt++
      }
    })

    let topMajorName = 'Chưa có'
    let maxFreq = 0
    Object.keys(majorFrequency).forEach(mName => {
      if (majorFrequency[mName] > maxFreq) {
        maxFreq = majorFrequency[mName]
        topMajorName = mName
      }
    })

    const totalM = realMatrices.length
    const debiasedPct = totalM > 0 ? Math.round((successCnt / totalM) * 100) : 0

    setDebiasStats({
      success: successCnt,
      sunkCost: sunkCostCnt,
      bandwagon: bandwagonCnt,
      emotional: emotionalCnt,
      optimism: optimismCnt,
      total: totalM
    })

    setStats({
      totalStudents: realUsers.length,
      totalReflections: totalM,
      debiasedSuccessPct: debiasedPct,
      topMajor: topMajorName
    })

    if (isManualRefresh) {
      setToastMessage(isDbConnected ? 'Đã làm mới dữ liệu Live từ Supabase PostgreSQL DB!' : 'Đã nạp bộ dữ liệu NCKH ViSEF mới nhất!')
      setTimeout(() => setToastMessage(null), 3000)
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }

  // Thao tác Admin: Phê duyệt (Duyệt) hoặc Từ chối Lịch hẹn Đặt lịch 1-1
  const handleUpdateCounselingStatus = async (sessionId, newStatus) => {
    setIsUpdatingStatus(true)

    // 1. Cập nhật ngay lập tức trên Local State (Optimistic UI update)
    setCounselingSessions(prev => 
      prev.map(item => item.id === sessionId ? { ...item, status: newStatus } : item)
    )

    try {
      // 2. Cập nhật trên Supabase Database
      if (supabase && typeof supabase.from === 'function') {
        const { error } = await supabase
          .from('counseling_sessions')
          .update({ status: newStatus })
          .eq('id', sessionId)

        if (error) {
          console.warn('Lỗi khi update Supabase counseling_sessions:', error)
        }
      }

      // 3. Đồng bộ cập nhật vào LocalStorage nếu suất hẹn đó đang lưu local
      if (user?.id) {
        try {
          const raw = localStorage.getItem(`counseling_sessions_local_${user.id}`)
          if (raw) {
            const list = JSON.parse(raw)
            const updated = list.map(item => item.id === sessionId ? { ...item, status: newStatus } : item)
            localStorage.setItem(`counseling_sessions_local_${user.id}`, JSON.stringify(updated))
          }
        } catch (e) {
          console.error('Lỗi lưu local storage:', e)
        }
      }

      const msg = (newStatus === 'confirmed' || newStatus === 'approved')
        ? '🟢 Đã DUYỆT thành công lịch hẹn tư vấn!'
        : '🔴 Đã TỪ CHỐI / ĐỔI LỊCH hẹn tư vấn!'

      setToastMessage(msg)
      setTimeout(() => setToastMessage(null), 3500)
    } catch (err) {
      console.error('Lỗi khi thao tác duyệt lịch:', err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Xuất file CSV báo cáo
  const handleExportCSV = () => {
    try {
      if (!Array.isArray(counselingSessions) || counselingSessions.length === 0) {
        setToastMessage('Chưa có dữ liệu lịch hẹn để xuất file.')
        setTimeout(() => setToastMessage(null), 3000)
        return
      }

      const headers = ['STT,Hoc Sinh,Email,Chuyen Gia Mentor,Thoi Gian Hen,Trang Thai,Ghi Chu\n']
      const rows = counselingSessions.map((c, idx) => {
        const expert = getCounselorDetails(c.counselor_id, c.counselor, c.student_notes, c.counselor_name)
        const studentName = c.student?.full_name || 'Học sinh'
        const studentEmail = c.student?.email || 'N/A'
        const scheduledTime = formatDateTimeFormatted(c.scheduled_at)
        const statusStr = c.status || 'pending'
        const notesStr = (c.student_notes || '').replace(/\n/g, ' ').replace(/"/g, '""')

        return `"${idx + 1}","${studentName}","${studentEmail}","${expert.fullName}","${scheduledTime}","${statusStr}","${notesStr}"`
      }).join('\n')

      const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Bao_Cao_Tu_Van_1-1_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setToastMessage('Đã xuất file báo cáo CSV/Excel Lịch tư vấn thành công!')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      console.error('Lỗi xuất CSV:', err)
    }
  }

  const formatBiasLabel = (biasType) => {
    switch (biasType) {
      case 'EMOTIONAL_BIAS':
        return 'Bẫy Cảm Xúc (Thích từ nhỏ)'
      case 'BANDWAGON_BIAS':
        return 'Bẫy Chọn Nghề Theo Đám Đông'
      case 'OPTIMISM_BIAS':
        return 'Bẫy Chỉ Nhìn Mặt Màu Hồng'
      case 'SUNK_COST_BIAS':
        return 'Bẫy Tiếc Công Sức (Chi phí chìm)'
      case 'BALANCED':
        return 'Tư Duy Cân Bằng'
      case 'DEBIASED_SUCCESS':
      default:
        return 'Thoát Bẫy Tư Duy Thành Công'
    }
  }

  const renderDecisionTag = (decision) => {
    switch (decision) {
      case 'BACKUP':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">🟡 NV Dự phòng</span>
      case 'CHANGED':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 rounded-sm">🔴 Đã Hủy Ngành</span>
      case 'CONFIRMED':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">🟢 NV Chính</span>
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Đã xác nhận
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-sm">
            <XCircle className="w-3.5 h-3.5" /> 🔴 Đã từ chối
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> 🔵 Hoàn thành
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm animate-pulse">
            <Clock className="w-3.5 h-3.5" /> 🟡 Chờ phê duyệt
          </span>
        )
    }
  }

  // Thống kê nhanh số lượng yêu cầu tư vấn
  const pendingCount = counselingSessions.filter(c => !c.status || c.status === 'pending').length
  const confirmedCount = counselingSessions.filter(c => c.status === 'confirmed' || c.status === 'approved').length
  const rejectedCount = counselingSessions.filter(c => c.status === 'rejected').length
  const completedCount = counselingSessions.filter(c => c.status === 'completed').length

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-3 font-sans">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang kết nối CSDL Supabase PostgreSQL & Khớp nối dữ liệu Admin...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal font-sans">
      {/* Header Trang Admin */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>⚙️</span> Bảng Quản Trị Admin & Phê Duyệt Hệ Thống Hướng Nghiệp
              </h1>
              {isUsingFallback ? (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm uppercase">
                  🟡 ViSEF Seed Data
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm uppercase">
                  🟢 Supabase Live DB
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Quản lý toàn bộ danh sách Yêu cầu Tư vấn 1-1, duyệt suất hẹn trực tiếp, theo dõi chỉ số Phản tư NCKH và phân quyền hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => fetchRealSupabaseData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới dữ liệu</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-amber-400"
            >
              <span>📊</span>
              <span>XUẤT BÁO CÁO EXCEL</span>
            </button>
          </div>
        </div>

        {/* Thanh chuyển đổi Tab Admin */}
        <div className="flex border-b border-slate-200 gap-6 pt-2">
          <button
            onClick={() => setActiveTab('counseling')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'counseling' ? 'border-brand-600 text-brand-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>📅 Yêu cầu Tư vấn 1-1</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reflections')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'reflections' ? 'border-brand-600 text-brand-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>📊 Báo cáo NCKH Phản Tư ({matricesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'border-brand-600 text-brand-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span>📋 Danh sách Học sinh ({usersList.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: QUẢN LÝ & PHÊ DUYỆT LỊCH TƯ VẤN 1-1 (YÊU CẦU CHÍNH)
          ========================================================================= */}
      {activeTab === 'counseling' && (
        <div className="space-y-6">
          {/* Thẻ Thống Kê Nhanh Yêu Cầu Đặt Lịch */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-sm border border-slate-200 flex items-center justify-center text-xl font-bold">
                📅
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Yêu Cầu Đặt Lịch</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{counselingSessions.length} Suất</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-sm border border-amber-300 flex items-center justify-center text-xl font-bold">
                ⏳
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Chờ Admin Duyệt</p>
                <p className="text-xl font-black text-amber-700 mt-0.5">{pendingCount} Đơn</p>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-sm border border-emerald-300 flex items-center justify-center text-xl font-bold">
                🟢
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Đã Duyệt / Xác Nhận</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{confirmedCount} Đơn</p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-rose-100 text-rose-800 rounded-sm border border-rose-300 flex items-center justify-center text-xl font-bold">
                🔴
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Từ Chối / Đổi Lịch</p>
                <p className="text-xl font-black text-rose-700 mt-0.5">{rejectedCount} Đơn</p>
              </div>
            </div>
          </div>

          {/* Bảng Danh sách Yêu cầu Tư vấn 1-1 & Nút Thao tác Admin */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4.5 h-4.5 text-brand-600" />
                  DANH SÁCH YÊU CẦU ĐẶT LỊCH TƯ VẤN 1-1 CẦN PHÊ DUYỆT
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Admin có quyền Duyệt trực tiếp hoặc Từ chối yêu cầu của học sinh. Dữ liệu tự động cập nhật Realtime vào CSDL Supabase.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-50 text-brand-800 border border-brand-200 rounded-sm uppercase">
                Realtime Auto Sync
              </span>
            </div>

            {counselingSessions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-sm text-xs font-semibold text-slate-500 space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                <p>Chưa có yêu cầu tư vấn 1-1 nào trong CSDL Supabase.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Tên Học sinh & Contact</th>
                      <th className="py-3.5 px-4">Chuyên gia / Mentor được chọn</th>
                      <th className="py-3.5 px-4">Ngày giờ hẹn gặp</th>
                      <th className="py-3.5 px-4">Ghi chú & Thắc mắc</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-center">Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counselingSessions.map((session) => {
                      const expert = getCounselorDetails(session.counselor_id, session.counselor, session.student_notes, session.counselor_name)
                      const studentName = session.student?.full_name || 'Học sinh'
                      const studentEmail = session.student?.email || 'N/A'
                      const cleanNotes = session.student_notes
                        ? session.student_notes.replace(/\[Chuyên gia\/Mentor:\s*[^\]]+\]\s*/, '')
                        : 'Không có ghi chú.'

                      const isPending = !session.status || session.status === 'pending'
                      const isConfirmed = session.status === 'confirmed' || session.status === 'approved'
                      const isRejected = session.status === 'rejected'

                      return (
                        <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50/60 text-xs">
                          {/* 1. Học sinh */}
                          <td className="py-4 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                              <span>{studentName}</span>
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 mt-0.5 ml-5">
                              {studentEmail}
                            </div>
                          </td>

                          {/* 2. Chuyên gia / Mentor */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border mb-1 block w-max ${expert.badgeClass}`}>
                              {expert.badgeLabel}
                            </span>
                            <span className="font-bold text-slate-800 block text-xs">
                              {expert.fullName}
                            </span>
                          </td>

                          {/* 3. Ngày giờ hẹn */}
                          <td className="py-4 px-4 font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateTimeFormatted(session.scheduled_at)}</span>
                            </div>
                          </td>

                          {/* 4. Ghi chú */}
                          <td className="py-4 px-4 max-w-xs text-slate-600">
                            <p className="line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100 text-[11px] font-medium leading-relaxed" title={cleanNotes}>
                              {cleanNotes}
                            </p>
                          </td>

                          {/* 5. Trạng thái */}
                          <td className="py-4 px-4">
                            {renderStatusBadge(session.status)}
                          </td>

                          {/* 6. Nút thao tác Admin trực tiếp */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Nút 🟢 DUYỆT LỊCH */}
                              <button
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => handleUpdateCounselingStatus(session.id, 'confirmed')}
                                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer border ${
                                  isConfirmed
                                    ? 'bg-emerald-600 text-white border-emerald-700 opacity-90'
                                    : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border-emerald-300'
                                }`}
                                title="Bấm để phê duyệt chính thức lịch hẹn này vào DB"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Duyệt lịch</span>
                              </button>

                              {/* Nút 🔴 TỪ CHỐI */}
                              <button
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => handleUpdateCounselingStatus(session.id, 'rejected')}
                                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer border ${
                                  isRejected
                                    ? 'bg-rose-600 text-white border-rose-700 opacity-90'
                                    : 'bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white border-rose-300'
                                }`}
                                title="Bấm để từ chối hoặc yêu cầu đổi lịch hẹn"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BÁO CÁO NCKH PHẢN TƯ & 5 BẪY TƯ DUY
          ========================================================================= */}
      {activeTab === 'reflections' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Phân Tích Bẫy Tư Duy Thực Tế từ CSDL ({debiasStats?.total || 0} lượt)
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm uppercase">
                ViSEF Live Aggregation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">🎉 Thoát Bẫy Thành Công</span>
                  <span className="text-sm font-black text-emerald-900">
                    {debiasStats.total > 0 ? Math.round((debiasStats.success / debiasStats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 font-semibold">{debiasStats?.success || 0} lượt điều chỉnh NV tỉnh táo</p>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950">⚠️ Bẫy Cảm Xúc Từ Nhỏ</span>
                  <span className="text-sm font-black text-rose-900">
                    {debiasStats.total > 0 ? Math.round((debiasStats.emotional / debiasStats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 font-semibold">{debiasStats?.emotional || 0} lượt chọn theo hình mẫu cũ</p>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950">⚠️ Bẫy Theo Đám Đông</span>
                  <span className="text-sm font-black text-blue-900">
                    {debiasStats.total > 0 ? Math.round((debiasStats.bandwagon / debiasStats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 font-semibold">{debiasStats?.bandwagon || 0} lượt bị ảnh hưởng MXH</p>
              </div>

              <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950">⚠️ Bẫy Chỉ Nhìn Màu Hồng</span>
                  <span className="text-sm font-black text-purple-900">
                    {debiasStats.total > 0 ? Math.round((debiasStats.optimism / debiasStats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-[11px] text-purple-800 font-semibold">{debiasStats?.optimism || 0} lượt phớt lờ rủi ro</p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">⚠️ Bẫy Tiếc Công Sức</span>
                  <span className="text-sm font-black text-amber-900">
                    {debiasStats.total > 0 ? Math.round((debiasStats.sunkCost / debiasStats.total) * 100) : 0}%
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 font-semibold">{debiasStats?.sunkCost || 0} lượt tiếc công sức học</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DANH SÁCH HỌC SINH THỰC TẾ (PROFILES)
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span>
              <span>Danh Sách Học Sinh Thực Tế ({usersList?.length || 0} Học sinh)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Họ và tên Học sinh</th>
                  <th className="py-3.5 px-4">Email / Khối lớp</th>
                  <th className="py-3.5 px-4">Ngày tham gia</th>
                  <th className="py-3.5 px-4">Số bài Phản tư</th>
                  <th className="py-3.5 px-4">Ngành dự định</th>
                  <th className="py-3.5 px-4 text-center">Quyết định</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u, idx) => {
                  const studentId = u?.id
                  const studentMatrices = matricesList.filter(m => m?.student_id === studentId || m?.user_id === studentId)
                  const latestMatrix = studentMatrices.length > 0 ? studentMatrices[0] : null

                  return (
                    <tr key={u?.id || idx} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {u?.full_name || 'Học sinh'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div>{u?.email || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{u?.grade_level || 'Lớp 12'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500">
                        {u?.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-sm">
                          {studentMatrices.length} bài
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-600">
                        {latestMatrix?.target_major ? (
                          <span>{latestMatrix.target_major}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa tạo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {latestMatrix ? (
                          renderDecisionTag(latestMatrix.final_decision)
                        ) : (
                          <span className="text-slate-400 font-normal text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-sm shadow-lg border border-slate-700 animate-reveal">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
