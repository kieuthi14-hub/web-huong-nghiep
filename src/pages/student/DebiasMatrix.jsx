import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import {
  Brain,
  Target,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Printer,
  Download,
  ArrowRight,
  RotateCcw,
  Sliders,
  Scale,
  Award,
  Home,
  BookOpen,
  Search,
  Zap,
  CheckSquare,
  Square
} from 'lucide-react'

// =========================================================================
// BƯỚC 5: KẾ HOẠCH HÀNH ĐỘNG TỰ CHỦ (ACTION TRIAD)
// DỰ ÁN VISEF 2026 - PHÂN NGÀNH KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS MODEL)
// =========================================================================

const getConfidenceFeedback = (score) => {
  if (score <= 3) return { text: 'Còn nhiều hoang mang / Áp lực cao', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' }
  if (score <= 6) return { text: 'Cân nhắc thận trọng / Đang tìm giải pháp', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  if (score <= 8) return { text: 'Tương đối vững vàng / Kế hoạch khả thi', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
  return { text: 'Tự tin vững vàng trên cơ sở thực tế', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
}

const DebiasMatrix = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // --- DỮ LIỆU ĐỐI CHỨNG TỔNG HỢP TỪ CÁC BƯỚC 1, 2, 3, 4 ---
  const [step1Data, setStep1Data] = useState({
    targetMajor: '',
    targetSchool: '',
    hollandCode: 'Chưa xác định',
    initialConfidence: 8,
    reason: ''
  })
  const [step2Data, setStep2Data] = useState(null)
  const [step3Data, setStep3Data] = useState(null)
  const [step4Data, setStep4Data] = useState(null)

  // --- STATE BƯỚC 5: TAM GIÁC HÀNH ĐỘNG THỰC CHIẾN (ACTION TRIAD) ---
  const [confidenceT2, setConfidenceT2] = useState(8)
  const [actionStudy, setActionStudy] = useState('')
  const [actionResearch, setActionResearch] = useState('')
  const [actionSkills, setActionSkills] = useState('')
  const [isCommitted, setIsCommitted] = useState(false)

  // --- TRẠNG THÁI HOÀN TẤT & XUẤT BÁO CÁO ---
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [completedAt, setCompletedAt] = useState(null)

  // 1. Khởi tạo dữ liệu từ LocalStorage qua các bước
  useEffect(() => {
    // Step 1
    try {
      const rawProfile = localStorage.getItem('cbas_user_profile')
      const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData')
      const p = rawProfile ? JSON.parse(rawProfile) : {}
      const a = rawAnchor ? JSON.parse(rawAnchor) : {}
      setStep1Data({
        targetMajor: p.targetMajor || a.target_career || 'Công nghệ Thông tin',
        targetSchool: p.targetSchool || a.target_school || 'Đại học Quốc gia',
        hollandCode: p.hollandCode || a.holland_code || 'RIA',
        initialConfidence: Number(p.initialConfidence || a.confidence_score || 8),
        reason: p.reason || a.reasons || 'Em yêu thích và thấy cơ hội phát triển tốt.'
      })
    } catch (e) {
      console.warn('Lỗi đọc Step 1:', e)
    }

    // Step 2
    try {
      const rawStep2 = localStorage.getItem('cbas_step2_telemetry')
      if (rawStep2) setStep2Data(JSON.parse(rawStep2))
    } catch (e) {
      console.warn('Lỗi đọc Step 2:', e)
    }

    // Step 3
    try {
      const rawStep3 = localStorage.getItem('cbas_step3_triage')
      if (rawStep3) setStep3Data(JSON.parse(rawStep3))
    } catch (e) {
      console.warn('Lỗi đọc Step 3:', e)
    }

    // Step 4
    try {
      const rawBooking = localStorage.getItem('cbas_step4_booking')
      const rawFeedback = localStorage.getItem('mentor_feedback_record') || localStorage.getItem('cbas_step4_feedback')
      const b = rawBooking ? JSON.parse(rawBooking) : null
      const f = rawFeedback ? JSON.parse(rawFeedback) : null
      if (b || f) setStep4Data({ booking: b, feedback: f })
    } catch (e) {
      console.warn('Lỗi đọc Step 4:', e)
    }

    // Kiểm tra xem đã từng lưu Bước 5 chưa
    try {
      const rawStep5 = localStorage.getItem('cbas_step5_action_plan')
      if (rawStep5) {
        const parsed5 = JSON.parse(rawStep5)
        if (parsed5.confidenceT2 !== undefined) setConfidenceT2(Number(parsed5.confidenceT2))
        if (parsed5.actionStudy) setActionStudy(parsed5.actionStudy)
        if (parsed5.actionResearch) setActionResearch(parsed5.actionResearch)
        if (parsed5.actionSkills) setActionSkills(parsed5.actionSkills)
        if (parsed5.isCommitted !== undefined) setIsCommitted(parsed5.isCommitted)
        if (parsed5.completedAt) {
          setCompletedAt(parsed5.completedAt)
          setIsCompleted(true)
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 5:', e)
    }
  }, [])

  // 2. Xử lý Hoàn tất Bước 5 & Đóng gói Báo cáo Tổng thể
  const handleCompleteStep5 = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!actionStudy.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Trụ cột 1: Môn học cần bứt phá & Kế hoạch ôn tập cụ thể!' })
      return
    }

    if (!actionResearch.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Trụ cột 2: Thông tin thực tế cần chủ động đào sâu thêm!' })
      return
    }

    if (!actionSkills.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Trụ cột 3: Kỹ năng cốt lõi cần chuẩn bị để cạnh tranh thời kỳ AI!' })
      return
    }

    if (!isCommitted) {
      setToast({ type: 'warning', message: 'Vui lòng tích chọn cam kết chủ động thực hiện kế hoạch hành động để hoàn tất!' })
      return
    }

    setIsSubmitting(true)
    const timestamp = new Date().toISOString()
    setCompletedAt(timestamp)

    // Đóng gói dữ liệu Bước 5 theo Action Triad
    const step5Payload = {
      confidenceT2,
      actionStudy,
      actionResearch,
      actionSkills,
      isCommitted,
      completedAt: timestamp
    }

    // Đóng gói hồ sơ can thiệp toàn bộ 5 bước
    const fullInterventionDossier = {
      studentInfo: {
        id: user?.id || profile?.id || 'student-guest',
        fullName: profile?.full_name || user?.user_metadata?.full_name || 'Học sinh nghiên cứu',
        email: user?.email || profile?.email || 'student@visef.edu.vn',
        school: profile?.school || 'THPT Đối chứng CBAS',
        grade: profile?.grade || 'Lớp 12'
      },
      step1_T0: step1Data,
      step2_Socrates: step2Data,
      step3_DataVerification: step3Data,
      step4_Mentorship: step4Data,
      step5_ActionTriad_T2: step5Payload,
      summaryMetrics: {
        t0_confidence: step1Data.initialConfidence,
        t2_confidence: confidenceT2,
        confidence_delta: confidenceT2 - step1Data.initialConfidence,
        action_triad_completed: true,
        is_committed: isCommitted,
        intervention_status: 'COMPLETED_DEBIASED'
      },
      generatedAt: timestamp
    }

    // Lưu vào LocalStorage
    localStorage.setItem('cbas_step5_action_plan', JSON.stringify(step5Payload))
    localStorage.setItem('cbas_full_intervention_dossier', JSON.stringify(fullInterventionDossier))

    // Đồng bộ lên Supabase
    try {
      if (user?.id) {
        await supabase
          .from('metacognitive_matrix')
          .insert([
            {
              student_id: user.id,
              target_major: step1Data.targetMajor || 'Mục tiêu nghề nghiệp',
              evidence: `[Trụ cột 1 - Học tập]: ${actionStudy}`,
              verified_sources: `[Trụ cột 2 - Khám phá]: ${actionResearch}`,
              risk_analysis: `[Trụ cột 3 - Kỹ năng AI]: ${actionSkills}`,
              bias_check: `Cam kết: ${isCommitted ? 'Đã cam kết' : 'Chưa'} | T0=${step1Data.initialConfidence} -> T2=${confidenceT2}`,
              detected_bias: 'DEBIASED_SUCCESS',
              final_decision: 'CONFIRMED'
            }
          ])
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ Supabase:', err)
    }

    setIsSubmitting(false)
    setIsCompleted(true)
    setToast({
      type: 'success',
      message: '🎉 Hoàn tất chu trình! Hồ sơ phản tư và Tam giác hành động đã được đóng gói thành công!'
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 3. Tải file JSON phục vụ Hội đồng Nghiên cứu Khoa học
  const handleDownloadJSON = () => {
    try {
      const raw = localStorage.getItem('cbas_full_intervention_dossier')
      if (!raw) return
      const blob = new Blob([raw], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CBAS_ActionTriad_${user?.id ? user.id.slice(0, 8) : 'Student'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast({ type: 'info', message: 'Đã tải xuống file dữ liệu nghiên cứu JSON thành công!' })
    } catch (e) {
      console.error('Lỗi tải JSON:', e)
    }
  }

  const confidenceStatus = getConfidenceFeedback(confidenceT2)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-reveal font-sans text-slate-800">
      
      {/* CSS CHO IN ẤN CHUẨN A4 - BÁO CÁO TỔNG HỢP 5 BƯỚC */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #full-dossier-report, #full-dossier-report * {
            visibility: visible !important;
          }
          #full-dossier-report {
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

      {/* =========================================================================
          1. HEADER BƯỚC 5 (CHUẨN ĐẶC TẢ ACTION TRIAD - VISEF 2026)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-50 to-indigo-50 rounded-full blur-2xl opacity-60 -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-xl text-brand-600 shadow-2xs shrink-0">
              <Brain className="w-8 h-8 text-brand-600" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 border border-brand-200 rounded-md">
                  Chặng Cuối 5/5
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md">
                  Tam Giác Hành Động (Action Triad)
                </span>
                {isCompleted && (
                  <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã Hoàn Tất Chu Trình
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                BƯỚC 5: KẾ HOẠCH HÀNH ĐỘNG TỰ CHỦ (ACTION TRIAD)
              </h1>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                Biến nhận thức sau các vòng phản tư thành hành động cụ thể để bứt phá học tập và chuẩn bị vững vàng cho tương lai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/student/booking')}
              className="text-xs font-bold py-2.5 px-3.5 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem Lại Bước 4</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NẾU ĐÃ HOÀN THÀNH: HIỂN THỊ DASHBOARD CHÚC MỪNG & XUẤT HỒ SƠ 5 BƯỚC (PDF)
          ========================================================================= */}
      {isCompleted ? (
        <div className="space-y-8 animate-reveal">
          
          {/* BANNER CHÚC MỪNG HOÀN TẤT CHU TRÌNH */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 md:p-8 rounded-xl shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-amber-300 shrink-0">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200">
                    Hội Đồng Khoa Học CBAS - VISEF 2026
                  </span>
                  <h2 className="text-lg md:text-2xl font-black tracking-tight mt-1">
                    🎉 CHÚC MỪNG EM ĐÃ HOÀN TẤT TOÀN BỘ 5 BƯỚC CAN THIỆP PHẢN TƯ!
                  </h2>
                  <p className="text-xs md:text-sm text-emerald-100 font-medium mt-1 leading-relaxed max-w-3xl">
                    Em đã chính thức hoàn thành chu trình giải trừ thiên lệch nhận thức, từ điểm neo ban đầu (T0) chuyển hoá thành người tự chủ ra quyết định với Tam Giác Hành Động Thực Chiến (T2).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0 no-print">
                <button
                  type="button"
                  onClick={() => setIsCompleted(false)}
                  className="px-3 py-2 text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Kế Hoạch</span>
                </button>
              </div>
            </div>

            {/* THANH ĐIỀU HƯỚNG TÁC VỤ IN & XUẤT */}
            <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="text-xs text-emerald-100 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Toàn bộ biến số T0, Holland, Chat Socrates, Step 3, Mentor Step 4 & Action Triad Step 5 đã đóng gói.</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-700" />
                  <span>In / Xuất Hồ Sơ Phản Tư 5 Bước (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>Tải Dữ Liệu Nghiên Cứu (JSON)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 THẺ ĐỐI CHỨNG CHỈ SỐ NHẬN THỨC VÀ TAM GIÁC HÀNH ĐỘNG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Thẻ 1: Delta Tự Tin T0 vs T2 */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Biến Số Tự Tin Nhận Thức
                </span>
                <Scale className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400">T0 (Ban đầu):</p>
                  <p className="text-xl font-black text-slate-700">{step1Data.initialConfidence}/10</p>
                </div>
                <div className="text-center font-black text-slate-400">➔</div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-brand-600">T2 (Sau can thiệp):</p>
                  <p className="text-2xl font-black text-emerald-600">{confidenceT2}/10</p>
                </div>
              </div>
              <div className={`p-2 rounded-lg text-xs font-bold text-center ${confidenceStatus.bg} ${confidenceStatus.color}`}>
                {confidenceStatus.text}
              </div>
            </div>

            {/* Thẻ 2: Mô Hình Tam Giác Hành Động */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Mô Hình Hành Động
                </span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-1 text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                  🎯 ACTION TRIAD (3 TRỤ CỘT)
                </span>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  Học gì? - Tìm hiểu gì? - Rèn luyện gì?
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Đã xác lập kế hoạch cụ thể cho từng trụ cột để bứt phá và chuẩn bị thời kỳ AI.
              </p>
            </div>

            {/* Thẻ 3: Trạng Thái Cam Kết Tự Chịu Trách Nhiệm */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Cam Kết Trách Nhiệm
                </span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-1 text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> ĐÃ KÝ CAM KẾT HÀNH ĐỘNG
                </span>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  Chủ động thực hiện mỗi ngày
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Tự chịu trách nhiệm cho quyết định và tương lai của chính mình.
              </p>
            </div>
          </div>

          {/* =========================================================================
              HỒ SƠ PHẢN TƯ TỔNG HỢP TOÀN BỘ 5 BƯỚC (IN ẤN CHUẨN A4 / XUẤT HỘI ĐỒNG)
              ========================================================================= */}
          <div id="full-dossier-report" className="bg-white border-2 border-slate-800 p-6 md:p-10 rounded-2xl shadow-sm space-y-8 text-slate-900">
            
            {/* Header Báo Cáo Khoa Học */}
            <div className="border-b-2 border-slate-800 pb-6 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-600">
                <span className="uppercase tracking-widest text-brand-700 font-black">
                  DỰ ÁN NGHIÊN CỨU VISEF 2026 - PHÂN NGÀNH CBAS
                </span>
                <span>
                  Ngày hoàn thành: {completedAt ? new Date(completedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 uppercase">
                BÁO CÁO KẾT QUẢ CAN THIỆP PHẢN TƯ & KẾ HOẠCH HÀNH ĐỘNG TỰ CHỦ (ACTION TRIAD)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 font-medium text-slate-700">
                <div><strong>Họ và tên:</strong> {profile?.full_name || user?.user_metadata?.full_name || 'Học sinh nghiên cứu'}</div>
                <div><strong>Email/Mã số:</strong> {user?.email || 'student@visef.edu.vn'}</div>
                <div><strong>Trường/Lớp:</strong> {profile?.school || 'THPT'} ({profile?.grade || 'Khối 12'})</div>
              </div>
            </div>

            {/* PHẦN 1: TỔNG HỢP BƯỚC 1 (T0) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">1</span>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900">
                  BƯỚC 1: KHỞI TẠO MỤC TIÊU & ĐIỂM NEO BAN ĐẦU (T0)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500">Ngành & Trường mục tiêu ban đầu:</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{step1Data.targetMajor} tại {step1Data.targetSchool}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Thiên hướng Holland & Điểm tự tin ban đầu (T0):</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    Mã Holland: <span className="text-brand-700">{step1Data.hollandCode}</span> | Mức tự tin T0: <span className="text-brand-700">{step1Data.initialConfidence}/10</span>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-bold text-slate-500">Lý do lựa chọn ban đầu (Điểm neo trực giác):</span>
                  <p className="text-slate-800 font-medium italic mt-0.5">"{step1Data.reason || 'Chưa ghi nhận'}"</p>
                </div>
              </div>
            </div>

            {/* PHẦN 2: TỔNG HỢP BƯỚC 2 (SOCRATES CHAT) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">2</span>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900">
                  BƯỚC 2: PHẢN TƯ TRUY VẤN SOCRATES (AI DIALOGUE TURNING POINT)
                </h3>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-700">Tiến trình đối thoại:</span>
                  <span className="px-2 py-0.5 font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px]">
                    Hoàn tất đủ 4/4 giai đoạn truy vấn độc lập
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  <strong>Đúc kết bước ngoặt:</strong> Học sinh đã nhận diện được các góc khuất nghề nghiệp về yêu cầu đào tạo, thách thức thị trường và rào cản điểm số thay vì chỉ dựa vào hình mẫu cảm xúc ban đầu.
                </p>
              </div>
            </div>

            {/* PHẦN 3: TỔNG HỢP BƯỚC 3 (ĐỐI CHỨNG DỮ LIỆU) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">3</span>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900">
                  BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU KHÁCH QUAN & KHOẢNG CÁCH NĂNG LỰC
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500">Tổ hợp môn & Điểm học bạ:</span>
                  <p className="font-black text-slate-900 mt-0.5">
                    {step3Data?.targetCombination || 'Tổ hợp'} : {step3Data?.totalStudentScore !== null && step3Data?.totalStudentScore !== undefined ? `${step3Data.totalStudentScore}đ` : 'Chưa nhập'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Điểm chuẩn trung bình 2 năm:</span>
                  <p className="font-black text-slate-900 mt-0.5">
                    {step3Data?.avgCutoff !== null && step3Data?.avgCutoff !== undefined ? `${step3Data.avgCutoff}đ` : 'Chưa nhập'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Khoảng cách năng lực (scoreGap):</span>
                  <p className={`font-black mt-0.5 ${step3Data?.scoreGap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {step3Data?.scoreGap !== null && step3Data?.scoreGap !== undefined ? `${step3Data.scoreGap > 0 ? '+' : ''}${step3Data.scoreGap}đ` : 'Chưa tính'}
                    {step3Data?.scoreGap >= 0 ? ' (Lợi thế cạnh tranh)' : ' (Cần giải pháp bứt phá)'}
                  </p>
                </div>
                <div className="md:col-span-3 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500">Tự đánh giá rào cản cá nhân:</span>
                  <p className="text-slate-800 font-medium italic mt-0.5">
                    "{step3Data?.reflectionText || 'Đã đối chứng dữ liệu thực tế và nhận diện rõ rào cản.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* PHẦN 4: TỔNG HỢP BƯỚC 4 (MENTORSHIP & POST-LOG) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">4</span>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900">
                  BƯỚC 4: THAM VẤN 1-1 & NHẬT KÝ THU HOẠCH SAU THAM VẤN
                </h3>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-500">Cố vấn tham vấn:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{step4Data?.booking?.mentor_name || 'Thầy/Cô Cố vấn Chuyên môn'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Hình thức đối thoại:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{step4Data?.booking?.meeting_type || 'Google Meet / Trực tiếp'}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500">Đúc kết chuyển biến sau buổi tham vấn:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {step4Data?.feedback?.notes || 'Đã nhìn nhận rõ bức tranh thực tế về độ khó của điểm chuẩn và cơ hội việc làm, sẵn sàng đón nhận thử thách và hành động cụ thể.'}
                  </p>
                </div>
              </div>
            </div>

            {/* PHẦN 5: BƯỚC 5 - TAM GIÁC HÀNH ĐỘNG TỰ CHỦ (ACTION TRIAD) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center">5</span>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900">
                  BƯỚC 5: KẾ HOẠCH HÀNH ĐỘNG TỰ CHỦ (ACTION TRIAD & T2)
                </h3>
              </div>

              {/* Tự tin T2 */}
              <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-brand-900 uppercase">Mức độ tự tin thực tế lúc này (T2):</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {confidenceT2}/10 — <span className="text-emerald-700">{confidenceStatus.text}</span>
                  </p>
                </div>
                <div className="text-right font-bold text-slate-600">
                  T0: {step1Data.initialConfidence}/10 ➔ T2: {confidenceT2}/10
                </div>
              </div>

              {/* 3 Trụ cột Tam giác hành động */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Trụ cột 1 */}
                <div className="bg-slate-50 border-2 border-emerald-500/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-emerald-200 pb-2">
                    <span className="text-base">📚</span>
                    <h4 className="font-black uppercase tracking-wider text-emerald-950 text-[11px]">
                      1. Học tập thực chiến (Học gì?)
                    </h4>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {actionStudy}
                  </p>
                </div>

                {/* Trụ cột 2 */}
                <div className="bg-slate-50 border-2 border-blue-500/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-blue-200 pb-2">
                    <span className="text-base">🔍</span>
                    <h4 className="font-black uppercase tracking-wider text-blue-950 text-[11px]">
                      2. Khám phá thực tế (Tìm hiểu gì?)
                    </h4>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {actionResearch}
                  </p>
                </div>

                {/* Trụ cột 3 */}
                <div className="bg-slate-50 border-2 border-amber-500/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-amber-200 pb-2">
                    <span className="text-base">⚡</span>
                    <h4 className="font-black uppercase tracking-wider text-amber-950 text-[11px]">
                      3. Kỹ năng tương lai (Rèn luyện gì?)
                    </h4>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {actionSkills}
                  </p>
                </div>
              </div>

              {/* Lời cam kết */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  "Em cam kết chủ động thực hiện kế hoạch hành động này mỗi ngày để chịu trách nhiệm cho tương lai của chính mình."
                </span>
              </div>
            </div>

            {/* Chữ Ký Xác Nhận */}
            <div className="pt-6 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-700">
              <div className="space-y-1">
                <p className="font-bold">Chứng nhận hoàn thành can thiệp CBAS</p>
                <p className="text-slate-500 text-[11px]">Hệ thống Hướng nghiệp & Tự chủ Ra quyết định</p>
              </div>
              <div className="text-center sm:text-right space-y-8">
                <div>
                  <p className="font-bold">Học sinh cam kết thực hiện</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <p className="font-black text-slate-900">{profile?.full_name || user?.user_metadata?.full_name || 'Học sinh'}</p>
              </div>
            </div>

          </div>

          {/* CÁC NÚT ĐIỀU HƯỚNG CUỐI CÙNG */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 no-print">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/student/dashboard')}
              className="font-bold text-xs uppercase tracking-wider py-3 px-6 gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ Học Sinh</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={() => window.print()}
                className="font-bold text-xs uppercase tracking-wider py-3 px-6 gap-2 bg-slate-900 hover:bg-black text-white"
              >
                <Printer className="w-4 h-4" />
                <span>In Bản Báo Cáo Này (PDF)</span>
              </Button>
            </div>
          </div>

        </div>
      ) : (

        /* =========================================================================
            GIAO DIỆN KẾ HOẠCH HÀNH ĐỘNG TINH GỌN 3 TRỤ CỘT (ACTION TRIAD)
            ========================================================================= */
        <form onSubmit={handleCompleteStep5} className="space-y-8 animate-reveal">

          {/* =========================================================================
              PHẦN 1: ĐO LƯỜNG CHỈ SỐ TỰ TIN THỰC TẾ (T2) (BẮT BUỘC)
              ========================================================================= */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Sliders className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  PHẦN 1: ĐO LƯỜNG CHỈ SỐ TỰ TIN THỰC TẾ (T2) (BẮT BUỘC)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Đánh giá lại mức độ tự tin sau khi đã trải qua đối chứng dữ liệu điểm chuẩn và tham vấn chuyên gia.
                </p>
              </div>
            </div>

            {/* Slider Thang đo T2 */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Đánh giá lại mức độ tự tin thực tế của em vào mục tiêu nghề nghiệp lúc này (Thang điểm 1 - 10):</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className={`px-3 py-1 rounded-lg border text-xs font-black inline-flex items-center gap-2 ${confidenceStatus.bg} ${confidenceStatus.color}`}>
                  <span className="text-base font-black">{confidenceT2}/10</span>
                  <span>{confidenceStatus.text}</span>
                </div>
              </div>

              {/* Slider Input */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={confidenceT2}
                  onChange={(e) => setConfidenceT2(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>1 (Còn nhiều hoang mang)</span>
                  <span className="hidden sm:inline">5 (Cân nhắc thận trọng)</span>
                  <span>10 (Tự tin vững vàng trên cơ sở thực tế)</span>
                </div>
              </div>

              {/* Đối chiếu tự động với T0 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between text-slate-600">
                <span>Điểm tự tin ban đầu ở Bước 1 (T0): <strong>{step1Data.initialConfidence}/10</strong></span>
                <span className="font-bold text-brand-700">
                  {confidenceT2 === step1Data.initialConfidence && '→ Giữ nguyên mức tự tin'}
                  {confidenceT2 > step1Data.initialConfidence && `→ Tăng +${confidenceT2 - step1Data.initialConfidence} điểm sau khi có giải pháp`}
                  {confidenceT2 < step1Data.initialConfidence && `→ Điều chỉnh ${step1Data.initialConfidence - confidenceT2} điểm sát thực tế hơn`}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              PHẦN 2: TAM GIÁC HÀNH ĐỘNG THỰC CHIẾN (3 TRỤ CỘT)
              ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Target className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  PHẦN 2: TAM GIÁC HÀNH ĐỘNG THỰC CHIẾN (3 TRỤ CỘT)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Thiết lập 3 trụ cột hành động cụ thể để biến nhận thức phản tư thành kết quả thực tế.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* TRỤ CỘT 1: HỌC TẬP THỰC CHIẾN - HỌC GÌ? */}
              <div className="bg-white border-2 border-emerald-500/80 p-5 md:p-6 rounded-xl space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                        📚
                      </div>
                      <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-950">
                        1. Học Tập Thực Chiến
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 rounded">
                      Học gì?
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    📚 1. Môn học cần bứt phá & Kế hoạch ôn tập cụ thể *
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Xác định rõ môn học sở trường cần tối ưu điểm số hoặc môn còn yếu cần bù điểm trong tổ hợp xét tuyển:
                  </p>

                  <textarea
                    rows={4}
                    value={actionStudy}
                    onChange={(e) => setActionStudy(e.target.value)}
                    placeholder="VD: Cần kéo điểm môn Toán từ 6.5 lên 8.0. Kế hoạch: Mỗi ngày dành 45 phút tự giải chuyên đề và nhờ thầy cô sửa lỗi sai..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-lg font-medium text-slate-800 leading-relaxed"
                  />
                </div>
              </div>

              {/* TRỤ CỘT 2: KHÁM PHÁ THỰC TẾ - TÌM HIỂU GÌ? */}
              <div className="bg-white border-2 border-blue-500/80 p-5 md:p-6 rounded-xl space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-black">
                        🔍
                      </div>
                      <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-blue-950">
                        2. Khám Phá Thực Tế
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-800 rounded">
                      Tìm hiểu gì?
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    🔍 2. Thông tin thực tế cần chủ động đào sâu thêm *
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Em cần tìm hiểu thêm những thông tin khách quan nào về ngành học, trường đào tạo hoặc thị trường việc làm?
                  </p>

                  <textarea
                    rows={4}
                    value={actionResearch}
                    onChange={(e) => setActionResearch(e.target.value)}
                    placeholder="VD: Tìm đọc kỹ chuẩn đầu ra và chương trình học 4 năm của trường; hỏi kinh nghiệm thực tế từ các anh chị sinh viên đang học ngành này..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg font-medium text-slate-800 leading-relaxed"
                  />
                </div>
              </div>

              {/* TRỤ CỘT 3: KỸ NĂNG TƯƠNG LAI - RÈN LUYỆN GÌ? */}
              <div className="bg-white border-2 border-amber-500/80 p-5 md:p-6 rounded-xl space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
                        ⚡
                      </div>
                      <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-950">
                        3. Kỹ Năng Tương Lai
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-800 rounded">
                      Rèn luyện gì?
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    ⚡ 3. Kỹ năng cốt lõi cần chuẩn bị để cạnh tranh thời kỳ AI *
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Để không bị tụt hậu trước sự phát triển của công nghệ và AI, em sẽ rèn luyện kỹ năng nào ngay từ bây giờ?
                  </p>

                  <textarea
                    rows={4}
                    value={actionSkills}
                    onChange={(e) => setActionSkills(e.target.value)}
                    placeholder="VD: Rèn luyện kỹ năng thuyết trình, nâng cao khả năng giao tiếp tiếng Anh và học cách ứng dụng AI hỗ trợ tự học..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded-lg font-medium text-slate-800 leading-relaxed"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              PHẦN 3: CAM KẾT & XUẤT BÁO CÁO TỔNG THỂ 5 BƯỚC
              ========================================================================= */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  PHẦN 3: CAM KẾT & XUẤT BÁO CÁO TỔNG THỂ 5 BƯỚC
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Xác nhận trách nhiệm cá nhân đối với lộ trình học tập và hoàn tất chu trình nghiên cứu.
                </p>
              </div>
            </div>

            {/* Checkbox cam kết */}
            <label className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isCommitted ? 'bg-emerald-50/60 border-emerald-500 text-emerald-950 ring-1 ring-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={isCommitted}
                onChange={(e) => setIsCommitted(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded mt-0.5 cursor-pointer shrink-0"
              />
              <div className="space-y-0.5">
                <p className="text-xs md:text-sm font-bold leading-relaxed">
                  ☑ Em cam kết chủ động thực hiện kế hoạch hành động này mỗi ngày để chịu trách nhiệm cho tương lai của chính mình.
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  (Bắt buộc tích chọn cam kết để hoàn tất chu trình và xuất hồ sơ đối chứng)
                </p>
              </div>
            </label>

            {/* Nút bấm lớn nổi bật (CTA) */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full font-black text-xs md:text-sm uppercase tracking-wider py-4 px-8 gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all rounded-xl cursor-pointer flex items-center justify-center"
              >
                <span>{isSubmitting ? 'ĐANG ĐÓNG GÓI DỮ LIỆU...' : 'HOÀN TẤT CHU TRÌNH & XUẤT HỒ SƠ PHẢN TƯ TOÀN BỘ 5 BƯỚC (PDF) ➔'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </form>
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

export default DebiasMatrix
