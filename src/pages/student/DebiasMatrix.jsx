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
  TrendingUp,
  Printer,
  Download,
  ArrowRight,
  RotateCcw,
  Sliders,
  Scale,
  FileText,
  Compass,
  AlertTriangle,
  Award,
  UserCheck,
  Calendar,
  Home,
  Check
} from 'lucide-react'

// =========================================================================
// BƯỚC 5: THIẾT LẬP KẾ HOẠCH HÀNH ĐỘNG ĐA TUYẾN & TỰ CHỦ RA QUYẾT ĐỊNH (T2)
// DỰ ÁN VISEF 2026 - PHÂN NGÀNH KHOA HỌC XÃ HỘI VÀ HÀNH VI (CBAS MODEL)
// =========================================================================

const DECISION_OPTIONS = [
  {
    id: 'maintain',
    label: 'Giữ nguyên ngành/trường mục tiêu ban đầu nhưng nâng cấp lộ trình học tập thực tế.',
    subtext: 'Bứt phá năng lực, cam kết kế hoạch học tập 100 ngày để chạm ngưỡng điểm chuẩn.',
    badge: '🚀 Giữ nguyên & Bứt phá',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'adjust',
    label: 'Điều chỉnh sang ngành hoặc trường khác phù hợp hơn với sở trường và học lực.',
    subtext: 'Thích ứng linh hoạt, chọn phương án có tỷ lệ chọi và điểm chuẩn an toàn hơn.',
    badge: '🔄 Điều chỉnh thích ứng',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'vocational',
    label: 'Lựa chọn hướng đào tạo thực hành / trường có chi phí và thời gian ngắn hơn để sớm tự lập.',
    subtext: 'Tập trung vào tay nghề thực tiễn, giảm gánh nặng tài chính và gia nhập thị trường sớm.',
    badge: '🛠️ Hướng thực hành tự lập',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
  }
]

const getConfidenceLabel = (score) => {
  if (score <= 3) return { text: 'Rất hoang mang / Áp lực cao', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' }
  if (score <= 6) return { text: 'Cân nhắc thận trọng / Đang tìm giải pháp', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  if (score <= 8) return { text: 'Vững vàng / Kế hoạch khả thi', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
  return { text: 'Tuyệt đối vững vàng / Sẵn sàng bứt phá', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
}

const DebiasMatrix = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // --- TRẠNG THÁI BƯỚC 1 (T0) & DỮ LIỆU ĐÃ LƯU TỪ CÁC BƯỚC ---
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

  // --- FORM STATE BƯỚC 5 (T2) ---
  const [decisionChoice, setDecisionChoice] = useState('maintain')
  const [confidenceT2, setConfidenceT2] = useState(8)
  const [trackAMajorSchool, setTrackAMajorSchool] = useState('')
  const [trackAAction100Days, setTrackAAction100Days] = useState('')
  const [trackBMajorSchool, setTrackBMajorSchool] = useState('')
  const [trackBReason, setTrackBReason] = useState('')
  const [careerCommitmentSkills, setCareerCommitmentSkills] = useState('')

  // --- TRẠNG THÁI HOÀN TẤT & DASHBOARD BÁO CÁO ---
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [completedAt, setCompletedAt] = useState(null)

  // 1. Khởi tạo dữ liệu từ LocalStorage qua các bước 1, 2, 3, 4, 5
  useEffect(() => {
    // Step 1
    try {
      const rawProfile = localStorage.getItem('cbas_user_profile')
      const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData')
      const p = rawProfile ? JSON.parse(rawProfile) : {}
      const a = rawAnchor ? JSON.parse(rawAnchor) : {}
      const s1 = {
        targetMajor: p.targetMajor || a.target_career || 'Công nghệ Thông tin',
        targetSchool: p.targetSchool || a.target_school || 'Đại học Quốc gia',
        hollandCode: p.hollandCode || a.holland_code || 'RIA',
        initialConfidence: Number(p.initialConfidence || a.confidence_score || 8),
        reason: p.reason || a.reasons || 'Em đam mê từ nhỏ và thấy cơ hội việc làm rộng mở.'
      }
      setStep1Data(s1)

      // Gán giá trị mặc định cho Tuyến A nếu chưa có
      if (!trackAMajorSchool) {
        const fullDefault = s1.targetMajor + (s1.targetSchool ? ` - ${s1.targetSchool}` : '')
        setTrackAMajorSchool(fullDefault)
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 1:', e)
    }

    // Step 2
    try {
      const rawStep2 = localStorage.getItem('cbas_step2_telemetry')
      if (rawStep2) {
        setStep2Data(JSON.parse(rawStep2))
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 2:', e)
    }

    // Step 3
    try {
      const rawStep3 = localStorage.getItem('cbas_step3_triage')
      if (rawStep3) {
        setStep3Data(JSON.parse(rawStep3))
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 3:', e)
    }

    // Step 4
    try {
      const rawBooking = localStorage.getItem('cbas_step4_booking')
      const rawFeedback = localStorage.getItem('mentor_feedback_record') || localStorage.getItem('cbas_step4_feedback')
      const b = rawBooking ? JSON.parse(rawBooking) : null
      const f = rawFeedback ? JSON.parse(rawFeedback) : null
      if (b || f) {
        setStep4Data({ booking: b, feedback: f })
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 4:', e)
    }

    // Kiểm tra xem đã từng lưu Bước 5 chưa
    try {
      const rawStep5 = localStorage.getItem('cbas_step5_action_plan')
      if (rawStep5) {
        const parsed5 = JSON.parse(rawStep5)
        if (parsed5.decisionChoice) setDecisionChoice(parsed5.decisionChoice)
        if (parsed5.confidenceT2) setConfidenceT2(Number(parsed5.confidenceT2))
        if (parsed5.trackAMajorSchool) setTrackAMajorSchool(parsed5.trackAMajorSchool)
        if (parsed5.trackAAction100Days) setTrackAAction100Days(parsed5.trackAAction100Days)
        if (parsed5.trackBMajorSchool) setTrackBMajorSchool(parsed5.trackBMajorSchool)
        if (parsed5.trackBReason) setTrackBReason(parsed5.trackBReason)
        if (parsed5.careerCommitmentSkills) setCareerCommitmentSkills(parsed5.careerCommitmentSkills)
        if (parsed5.completedAt) {
          setCompletedAt(parsed5.completedAt)
          setIsCompleted(true)
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 5:', e)
    }
  }, [])

  // 2. Xử lý lưu và Hoàn tất Bước 5 & Đóng gói Báo cáo Tổng Thể
  const handleCompleteStep5 = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!trackAMajorSchool.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập Tên Ngành & Trường mục tiêu cao nhất (Tuyến A)!' })
      return
    }

    if (!trackAAction100Days.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập Hành động cụ thể trong 100 ngày tới (Tuyến A)!' })
      return
    }

    if (!trackBMajorSchool.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập Trường hoặc Ngành dự phòng (Tuyến B)!' })
      return
    }

    if (!trackBReason.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập Lý do chọn phương án dự phòng làm lưới an toàn!' })
      return
    }

    if (!careerCommitmentSkills.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập 2 năng lực/kỹ năng cam kết rèn luyện để tránh thất nghiệp!' })
      return
    }

    setIsSubmitting(true)
    const timestamp = new Date().toISOString()
    setCompletedAt(timestamp)

    // Đóng gói kế hoạch Bước 5
    const step5Payload = {
      decisionChoice,
      confidenceT2,
      trackAMajorSchool,
      trackAAction100Days,
      trackBMajorSchool,
      trackBReason,
      careerCommitmentSkills,
      completedAt: timestamp
    }

    // Đóng gói toàn bộ 5 bước can thiệp CBAS
    const fullInterventionDossier = {
      studentInfo: {
        id: user?.id || profile?.id || 'guest-student',
        fullName: profile?.full_name || user?.user_metadata?.full_name || 'Học sinh tham gia can thiệp',
        email: user?.email || profile?.email || 'student@visef.edu.vn',
        school: profile?.school || 'THPT Đối chứng CBAS',
        grade: profile?.grade || 'Lớp 12'
      },
      step1_T0: step1Data,
      step2_Socrates: step2Data,
      step3_DataVerification: step3Data,
      step4_Mentorship: step4Data,
      step5_ActionPlan_T2: step5Payload,
      summaryMetrics: {
        t0_confidence: step1Data.initialConfidence,
        t2_confidence: confidenceT2,
        confidence_delta: confidenceT2 - step1Data.initialConfidence,
        final_decision: decisionChoice,
        intervention_status: 'COMPLETED_DEBIASED'
      },
      generatedAt: timestamp
    }

    // Lưu vào LocalStorage
    localStorage.setItem('cbas_step5_action_plan', JSON.stringify(step5Payload))
    localStorage.setItem('cbas_full_intervention_dossier', JSON.stringify(fullInterventionDossier))

    // Đồng bộ lên Supabase CSDL nghiên cứu
    try {
      if (user?.id) {
        await supabase
          .from('metacognitive_matrix')
          .insert([
            {
              student_id: user.id,
              target_major: trackAMajorSchool,
              evidence: `[Tuyến A: ${trackAMajorSchool}]\nHành động 100 ngày: ${trackAAction100Days}`,
              verified_sources: `[Tuyến B Dự phòng: ${trackBMajorSchool}]\nLý do: ${trackBReason}`,
              risk_analysis: `[Kỹ năng chống thất nghiệp]: ${careerCommitmentSkills}`,
              bias_check: `Quyết định: ${decisionChoice} | Tự tin T0=${step1Data.initialConfidence} -> T2=${confidenceT2}`,
              detected_bias: 'DEBIASED_SUCCESS',
              final_decision: decisionChoice === 'maintain' ? 'CONFIRMED' : (decisionChoice === 'adjust' ? 'CHANGED' : 'BACKUP')
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
      message: '🎉 Chúc mừng! Đã hoàn tất chu trình 5 bước và đóng gói Hồ sơ Phản tư thành công!'
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
      a.download = `CBAS_VISEF2026_Dossier_${user?.id ? user.id.slice(0, 8) : 'Student'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast({ type: 'info', message: 'Đã tải xuống file dữ liệu nghiên cứu JSON thành công!' })
    } catch (e) {
      console.error('Lỗi tải JSON:', e)
    }
  }

  const confidenceStatus = getConfidenceLabel(confidenceT2)
  const selectedDecisionObj = DECISION_OPTIONS.find(d => d.id === decisionChoice) || DECISION_OPTIONS[0]

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
          1. HEADER BƯỚC 5 (CHUẨN ĐẶC TẢ VISEF 2026)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-50 to-indigo-50 rounded-full blur-2xl opacity-60 -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-xl text-brand-600 shadow-2xs shrink-0">
              <Compass className="w-8 h-8 text-brand-600" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 border border-brand-200 rounded-md">
                  Chặng Cuối 5/5
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md">
                  Tự Chủ Ra Quyết Định (T2)
                </span>
                {isCompleted && (
                  <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã Hoàn Tất Chu Trình
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                BƯỚC 5: THIẾT LẬP KẾ HOẠCH HÀNH ĐỘNG ĐA TUYẾN & TỰ CHỦ RA QUYẾT ĐỊNH
              </h1>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                Tổng kết toàn bộ chu trình can thiệp phản tư để xác lập quyết định thực tế và lộ trình bứt phá của bản thân.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/student/counseling')}
              className="text-xs font-bold py-2.5 px-3.5 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem Lại Bước 4</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NẾU ĐÃ HOÀN THÀNH: HIỂN THỊ DASHBOARD CHÚC MỪNG & XUẤT HỒ SƠ 5 BƯỚC
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
                    Em đã chính thức hoàn thành chu trình giải trừ thiên lệch nhận thức, từ trực giác cảm tính (T0) chuyển hoá thành người ra quyết định có cơ sở dữ liệu đối chứng và phương án bảo hiểm đa tuyến an toàn (T2).
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
                <span>Toàn bộ biến số T0, Holland, Chat Socrates, Step 3, Mentor Step 4 & Action Plan Step 5 đã đóng gói.</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-700" />
                  <span>In / Lưu Báo Cáo PDF (A4)</span>
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

          {/* 3 THẺ ĐỐI CHỨNG CHỈ SỐ NHẬN THỨC THEO MÔ HÌNH NGHIÊN CỨU */}
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
                Hiệu chuẩn: {confidenceT2 >= step1Data.initialConfidence ? `Tăng +${confidenceT2 - step1Data.initialConfidence}đ vững tin` : `Điều chỉnh ${confidenceT2 - step1Data.initialConfidence}đ sát thực tế`}
              </div>
            </div>

            {/* Thẻ 2: Quyết định cuối cùng */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Quyết Định Cuối Cùng
                </span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <span className={`inline-block px-3 py-1 text-xs font-black rounded-md border ${selectedDecisionObj.badgeClass}`}>
                  {selectedDecisionObj.badge}
                </span>
                <p className="text-xs text-slate-600 font-semibold line-clamp-2">
                  {selectedDecisionObj.label}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Dựa trên ma trận đối chứng điểm chuẩn và tham vấn 1-1.
              </p>
            </div>

            {/* Thẻ 3: Trạng thái giải trừ thiên lệch */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Đánh Giá Nghiên Cứu CBAS
                </span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-1 text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md">
                  ✨ DEBIASED & CALIBRATED
                </span>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  Đã giải trừ thiên lệch nhận thức
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Học sinh đã thiết lập 2 tuyến mục tiêu đa tuyến an toàn và nhận diện rõ nguy cơ thị trường lao động.
              </p>
            </div>
          </div>

          {/* =========================================================================
              HỒ SƠ PHẢN TƯ TỔNG HỢP TOÀN BỘ 5 BƯỚC (IN ẤN CHUẨN A4 / XUẤT HỘI ĐỒNG)
              ========================================================================= */}
          <div id="full-dossier-report" className="bg-white border-2 border-slate-800 p-6 md:p-10 rounded-2xl shadow-sm space-y-8 text-slate-900">
            
            {/* Header Tài Liệu Khoa Học */}
            <div className="border-b-2 border-slate-800 pb-6 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-600">
                <span className="uppercase tracking-widest text-brand-700 font-black">
                  DỰ ÁN NGHIÊN CỨU VISEF 2026 - PHÂN NGÀNH CBAS
                </span>
                <span>
                  Ngày xuất hồ sơ: {completedAt ? new Date(completedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 uppercase">
                BÁO CÁO KẾT QUẢ CAN THIỆP PHẢN TƯ & KẾ HOẠCH HÀNH ĐỘNG HƯỚNG NGHIỆP
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
                    {step3Data?.scoreGap >= 0 ? ' (Lợi thế cạnh tranh)' : ' (Cần giải pháp bứt phá/dự phòng)'}
                  </p>
                </div>
                <div className="md:col-span-3 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500">Tự đánh giá rào cản và nguy cơ thất nghiệp:</span>
                  <p className="text-slate-800 font-medium italic mt-0.5">
                    "{step3Data?.reflectionText || 'Đã nhận diện nguy cơ thị trường và chuẩn bị phương án khắc phục.'}"
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
                    {step4Data?.feedback?.notes || 'Đã nhìn nhận rõ bức tranh thực tế về độ khó của điểm chuẩn và cơ hội việc làm, sẵn sàng đón nhận thử thách và xây dựng phương án đa tuyến.'}
                  </p>
                </div>
              </div>
            </div>

            {/* PHẦN 5: KẾ HOẠCH HÀNH ĐỘNG ĐA TUYẾN & TỰ CHỦ RA QUYẾT ĐỊNH (T2) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center">5</span>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900">
                  BƯỚC 5: KẾ HOẠCH HÀNH ĐỘNG ĐA TUYẾN & TỰ CHỦ RA QUYẾT ĐỊNH (T2)
                </h3>
              </div>

              {/* Quyết định & Điểm tự tin T2 */}
              <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-xl space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-black text-brand-900 uppercase">Quyết định chính thức:</span>
                  <span className={`px-2.5 py-0.5 font-black rounded border text-[11px] ${selectedDecisionObj.badgeClass}`}>
                    {selectedDecisionObj.badge}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm leading-relaxed">
                  {selectedDecisionObj.label}
                </p>
                <div className="pt-2 border-t border-brand-200/60 flex items-center justify-between text-xs font-bold text-brand-900">
                  <span>Mức độ tự tin thực tế sau chu trình (T2):</span>
                  <span className="text-base text-emerald-700 font-black">{confidenceT2}/10 ({confidenceStatus.text})</span>
                </div>
              </div>

              {/* 2 Tuyến Nguyện Vọng Song Song */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Tuyến A */}
                <div className="bg-slate-50 border-2 border-emerald-500/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="font-black uppercase tracking-wider text-emerald-900">
                      🚀 TUYẾN A: MỤC TIÊU ƯU TIÊN SỐ 1 (BỨT PHÁ)
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Ngành & Trường mục tiêu:</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{trackAMajorSchool}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Hành động cụ thể trong 100 ngày tới:</span>
                    <p className="text-slate-800 font-medium leading-relaxed mt-0.5 whitespace-pre-wrap">{trackAAction100Days}</p>
                  </div>
                </div>

                {/* Tuyến B */}
                <div className="bg-slate-50 border-2 border-blue-500/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="font-black uppercase tracking-wider text-blue-900">
                      🛡️ TUYẾN B: PHƯƠNG ÁN DỰ PHÒNG (LƯỚI AN TOÀN)
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Trường/Ngành dự phòng:</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{trackBMajorSchool}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Lý do chọn làm lưới an toàn:</span>
                    <p className="text-slate-800 font-medium leading-relaxed mt-0.5 whitespace-pre-wrap">{trackBReason}</p>
                  </div>
                </div>
              </div>

              {/* Khối 3 Kỹ năng chống thất nghiệp */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-black uppercase tracking-wider text-slate-800">
                  🎯 CAM KẾT RÈN LUYỆN KỸ NĂNG TRÁNH NGUY CƠ THẤT NGHIỆP:
                </span>
                <p className="text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                  {careerCommitmentSkills}
                </p>
              </div>
            </div>

            {/* Chữ Ký Xác Nhận & Cam Kết Bản Thân */}
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
            GIAO DIỆN KẾ HOẠCH HÀNH ĐỘNG TINH GỌN 3 KHỐI THEO ĐẶC TẢ
            ========================================================================= */
        <form onSubmit={handleCompleteStep5} className="space-y-8 animate-reveal">

          {/* =========================================================================
              KHỐI 1: TÁI ĐỊNH VỊ QUYẾT ĐỊNH & THU THẬP BIẾN SỐ T2 (BẮT BUỘC)
              ========================================================================= */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Target className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  KHỐI 1: TÁI ĐỊNH VỊ QUYẾT ĐỊNH & THU THẬP BIẾN SỐ T2 (BẮT BUỘC)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Đánh giá lại nguyện vọng sau khi đã đối chứng số liệu học bạ, điểm chuẩn và lời khuyên của chuyên gia.
                </p>
              </div>
            </div>

            {/* 1.1 Single-choice Radio */}
            <div className="space-y-3">
              <label className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Sau khi trải qua các vòng phản tư và đối chứng dữ liệu, quyết định cuối cùng của em là:</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 gap-3">
                {DECISION_OPTIONS.map((opt) => {
                  const isSelected = decisionChoice === opt.id
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-50/50 border-brand-500 ring-1 ring-brand-400 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="decisionChoice"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => setDecisionChoice(opt.id)}
                        className="w-4 h-4 text-brand-600 mt-1 shrink-0 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs md:text-sm font-bold text-slate-900 leading-snug">
                            {opt.label}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${opt.badgeClass}`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {opt.subtext}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 1.2 Slider Thang đo T2 (Confidence Score 1 - 10) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-brand-600" />
                  <span>Đánh giá lại mức độ tự tin thực tế của em vào quyết định này (Thang điểm 1 - 10):</span>
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
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>1 (Rất hoang mang)</span>
                  <span className="hidden sm:inline">5 (Cân nhắc thận trọng)</span>
                  <span>10 (Tuyệt đối vững vàng)</span>
                </div>
              </div>

              {/* Thông tin đối chiếu với điểm T0 ban đầu */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between text-slate-600">
                <span>Điểm tự tin ban đầu ở Bước 1 (T0): <strong>{step1Data.initialConfidence}/10</strong></span>
                <span className="font-bold text-brand-700">
                  {confidenceT2 === step1Data.initialConfidence && '→ Giữ nguyên mức tự tin'}
                  {confidenceT2 > step1Data.initialConfidence && `→ Tăng +${confidenceT2 - step1Data.initialConfidence} điểm sau khi có giải pháp`}
                  {confidenceT2 < step1Data.initialConfidence && `→ Giảm ${step1Data.initialConfidence - confidenceT2} điểm để nhìn nhận thực tế hơn`}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              KHỐI 2: LẬP LỘ TRÌNH 2 TUYẾN BẢO HIỂM NGUYỆN VỌNG (MULTI-TRACK ROADMAP)
              ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Scale className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  KHỐI 2: LẬP LỘ TRÌNH 2 TUYẾN BẢO HIỂM NGUYỆN VỌNG (MULTI-TRACK ROADMAP)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Không đặt toàn bộ cược vào một cửa duy nhất — luôn thiết lập sẵn lưới an toàn dự phòng rủi ro.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* THẺ TUYẾN A: MỤC TIÊU ƯU TIÊN SỐ 1 (BỨT PHÁ) */}
              <div className="bg-white border-2 border-emerald-500/80 p-5 md:p-6 rounded-xl space-y-4 shadow-xs relative">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                      🚀
                    </span>
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-900">
                      THẺ TUYẾN A: MỤC TIÊU ƯU TIÊN SỐ 1 (BỨT PHÁ)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 rounded">
                    Nguyện Vọng 1
                  </span>
                </div>

                {/* Input Text Tuyến A */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Tên Ngành & Trường mục tiêu cao nhất: *</span>
                    <span className="text-[10px] font-normal text-slate-400">Cho phép chỉnh sửa</span>
                  </label>
                  <input
                    type="text"
                    value={trackAMajorSchool}
                    onChange={(e) => setTrackAMajorSchool(e.target.value)}
                    placeholder="VD: Khoa học máy tính - ĐH Bách Khoa..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-lg font-bold text-slate-900"
                  />
                </div>

                {/* Textarea Hành động 100 ngày Tuyến A */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Hành động cụ thể trong 100 ngày tới để nâng điểm môn còn yếu/kéo điểm tổ hợp: *
                  </label>
                  <textarea
                    rows={3}
                    value={trackAAction100Days}
                    onChange={(e) => setTrackAAction100Days(e.target.value)}
                    placeholder="VD: Dành 2 tiếng mỗi tối luyện đề Toán phần hàm số và hình học, nhờ bạn kèm thêm..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-lg font-medium text-slate-800 leading-relaxed"
                  />
                </div>
              </div>

              {/* THẺ TUYẾN B: PHƯƠNG ÁN DỰ PHÒNG AN TOÀN (LƯỚI AN TOÀN) */}
              <div className="bg-white border-2 border-blue-500/80 p-5 md:p-6 rounded-xl space-y-4 shadow-xs relative">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-black">
                      🛡️
                    </span>
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-blue-900">
                      THẺ TUYẾN B: PHƯƠNG ÁN DỰ PHÒNG (LƯỚI AN TOÀN)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-800 rounded">
                    Lưới Bảo Hiểm
                  </span>
                </div>

                {/* Input Text Tuyến B */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Trường hoặc Ngành dự phòng (có điểm chuẩn mềm hơn 2 - 3 điểm): *
                  </label>
                  <input
                    type="text"
                    value={trackBMajorSchool}
                    onChange={(e) => setTrackBMajorSchool(e.target.value)}
                    placeholder="VD: Ngành Luật hoặc SP GDCT tại ĐH Phú Yên / ĐH Tây Nguyên / Hệ CĐ..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg font-bold text-slate-900"
                  />
                </div>

                {/* Textarea Lý do chọn Tuyến B */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Lý do lựa chọn phương án này làm lưới an toàn nếu kỳ thi có biến cố: *
                  </label>
                  <textarea
                    rows={3}
                    value={trackBReason}
                    onChange={(e) => setTrackBReason(e.target.value)}
                    placeholder="VD: Điểm chuẩn năm ngoái vừa sức với học lực hiện tại, cơ hội trúng tuyển cao..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg font-medium text-slate-800 leading-relaxed"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              KHỐI 3: KẾ HOẠCH NÂNG CAO NĂNG LỰC TRÁNH NGUY CƠ THẤT NGHIỆP
              ========================================================================= */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Brain className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  KHỐI 3: KẾ HOẠCH NÂNG CAO NĂNG LỰC TRÁNH NGUY CƠ THẤT NGHIỆP
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Đại học chỉ là bước đệm, năng lực thực chiến mới quyết định khả năng có việc làm và thu nhập bền vững.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Để không rơi vào nhóm cử nhân thất nghiệp sau này, em cam kết tự rèn luyện 2 năng lực/kỹ năng cụ thể nào ngay từ bây giờ?</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={careerCommitmentSkills}
                onChange={(e) => setCareerCommitmentSkills(e.target.value)}
                placeholder="VD: Năng lực ứng dụng AI tạo sinh vào tự học và chứng chỉ Tiếng Anh giao tiếp..."
                className="w-full p-4 text-xs md:text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-xl font-medium text-slate-800 leading-relaxed"
              />
            </div>
          </div>

          {/* =========================================================================
              NÚT CHỐT HẠ & XUẤT BÁO CÁO TỔNG THỂ TOÀN BỘ CHU TRÌNH (CTA LỚN)
              ========================================================================= */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Chốt Hạ Toàn Bộ Chu Trình Can Thiệp Phản Tư
              </span>
              <h4 className="text-base md:text-lg font-black tracking-tight">
                Sẵn Sàng Đóng Gói Hồ Sơ Ra Quyết Định Đa Tuyến?
              </h4>
              <p className="text-xs text-slate-300 font-medium max-w-xl">
                Bấm nút bên dưới để đóng gói toàn bộ dữ liệu 5 bước (T0, Holland, Chat Socrates, Step 3, Mentor Step 4 & Action Plan Step 5) và xuất Báo cáo Đối chứng Nghiên cứu.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full md:w-auto font-black text-xs md:text-sm uppercase tracking-wider py-4 px-8 gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl shrink-0 cursor-pointer"
            >
              <span>{isSubmitting ? 'ĐANG ĐÓNG GÓI DỮ LIỆU...' : 'HOÀN TẤT CHU TRÌNH & XUẤT HỒ SƠ PHẢN TƯ TOÀN BỘ 5 BƯỚC (PDF/SUMMARY) ➔'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
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
