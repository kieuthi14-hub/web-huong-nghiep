import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  CheckCircle2, 
  ArrowRight, 
  ClipboardList, 
  Sparkles, 
  GraduationCap, 
  CalendarDays, 
  Brain, 
  ChevronRight, 
  Home,
  RotateCcw,
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react'

/**
 * Danh mục 5 bước can thiệp phản tư ViSEF CBAS
 */
export const STEPS = [
  {
    step: 1,
    to: '/student/holland',
    label: 'Bước 1: Trắc Nghiệm & Mỏ Neo',
    shortLabel: '1. Holland & T0',
    icon: ClipboardList,
    color: 'emerald',
    badge: 'Xuất phát điểm T0'
  },
  {
    step: 2,
    to: '/student/debias-agent',
    label: 'Bước 2: AI Tham Vấn Phản Tư',
    shortLabel: '2. AI Socrates',
    icon: Sparkles,
    color: 'amber',
    badge: 'Chất vấn bẫy tư duy'
  },
  {
    step: 3,
    to: '/student/fact-check',
    label: 'Bước 3: Đối Chứng Dữ Liệu',
    shortLabel: '3. Đối chứng dữ liệu',
    icon: GraduationCap,
    color: 'blue',
    badge: 'Điểm chuẩn & Học phí'
  },
  {
    step: 4,
    to: '/student/booking',
    label: 'Bước 4: Tư Vấn 1-1 Thực Tế',
    shortLabel: '4. Tư vấn 1-1',
    icon: CalendarDays,
    color: 'violet',
    badge: 'Hồ sơ lâm sàng & 4B'
  },
  {
    step: 5,
    to: '/student/reflection',
    label: 'Bước 5: Kế Hoạch Hành Động',
    shortLabel: '5. Hành động (T2)',
    icon: Brain,
    color: 'rose',
    badge: 'Tam giác Action Triad'
  }
]

/**
 * Hàm xóa dữ liệu của từng bước riêng biệt trong localStorage
 */
export const resetStepData = (stepNumber) => {
  try {
    switch (Number(stepNumber)) {
      case 1:
        localStorage.removeItem('cbas_user_profile')
        localStorage.removeItem('userAnchorData')
        localStorage.removeItem('cbas_anchor_data')
        localStorage.removeItem('career_initial_anchor')
        break
      case 2:
        localStorage.removeItem('cbas_step2_messages')
        localStorage.removeItem('cbas_step2_round')
        localStorage.removeItem('cbas_step2_completed')
        localStorage.removeItem('cbas_step2_telemetry')
        break
      case 3:
        localStorage.removeItem('cbas_step3_evidence')
        localStorage.removeItem('career_evidence_task')
        localStorage.removeItem('cbas_step3_triage')
        localStorage.removeItem('cbas_score_gap')
        localStorage.removeItem('cbas_step3_vocational')
        localStorage.removeItem('cbas_step3_reflection')
        break
      case 4:
        localStorage.removeItem('cbas_step4_feedback')
        localStorage.removeItem('mentor_feedback_record')
        localStorage.removeItem('cbas_step4_booking')
        localStorage.removeItem('cbas_step4_completed')
        localStorage.removeItem('cbas_step4_active_stage')
        localStorage.removeItem('cbas_step4_consultation_completed')
        localStorage.removeItem('cbas_student_reflection_log')
        break
      case 5:
        localStorage.removeItem('cbas_step5_action_plan')
        localStorage.removeItem('cbas_full_intervention_dossier')
        localStorage.removeItem('cbas_step5_completed')
        break
      default:
        break
    }
  } catch (e) {
    console.error('Lỗi khi xóa dữ liệu bước:', e)
  }
}

/**
 * Hàm xóa toàn bộ dữ liệu cả 5 bước (Khởi động lại từ đầu)
 */
export const resetAllStepsData = () => {
  [1, 2, 3, 4, 5].forEach(s => resetStepData(s))
}

const getStepResetDescription = (step) => {
  switch (step) {
    case 1:
      return 'Xóa kết quả trắc nghiệm Holland và mỏ neo ban đầu để làm lại 30 câu hỏi và chọn lại ngành mục tiêu.'
    case 2:
      return 'Xóa toàn bộ lịch sử trò chuyện phản biện với AI Socrates để bắt đầu đối thoại lại từ Vòng 1.'
    case 3:
      return 'Xóa dữ liệu điểm học bạ, điểm chuẩn và học phí đã đối chứng để nhập và phân tích lại.'
    case 4:
      return 'Xóa nhật ký thu hoạch sau buổi tham vấn (Giai đoạn 4B) để cập nhật hoặc viết lại.'
    case 5:
      return 'Xóa bản Kế hoạch Hành động Tự chủ (Action Triad) và thang đo T2 để thiết lập lại.'
    default:
      return 'Làm mới dữ liệu của bước hiện tại để thực hiện lại.'
  }
}

/**
 * StepProgressHeader - Thanh tiến trình 5 bước can thiệp phản tư ViSEF CBAS
 * Tích hợp tính năng "Làm lại bước này" và "Khởi động lại toàn bộ 5 bước"
 */
export const StepProgressHeader = ({ currentStep = 1, title, subtitle, onResetStep }) => {
  const [completedSteps, setCompletedSteps] = useState({})
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetMode, setResetMode] = useState('CURRENT') // 'CURRENT' | 'ALL'

  useEffect(() => {
    // Đọc trạng thái hoàn thành từ localStorage
    const status = {}

    // Step 1: Holland test done or anchor set
    try {
      const s1 = localStorage.getItem('cbas_user_profile') || 
                 localStorage.getItem('userAnchorData') || 
                 localStorage.getItem('cbas_anchor_data')
      if (s1) status[1] = true
    } catch (e) {}

    // Step 2: Socratic chat finished
    try {
      const s2 = localStorage.getItem('cbas_step2_completed') || 
                 localStorage.getItem('cbas_step2_telemetry')
      if (s2) status[2] = true
    } catch (e) {}

    // Step 3: Fact check evidence recorded
    try {
      const s3 = localStorage.getItem('cbas_step3_evidence') || 
                 localStorage.getItem('career_evidence_task') || 
                 localStorage.getItem('cbas_score_gap')
      if (s3) status[3] = true
    } catch (e) {}

    // Step 4: Mentorship post-log recorded
    try {
      const s4 = localStorage.getItem('cbas_step4_feedback') || 
                 localStorage.getItem('mentor_feedback_record')
      if (s4) status[4] = true
    } catch (e) {}

    // Step 5: Action plan saved
    try {
      const s5 = localStorage.getItem('cbas_step5_action_plan') || 
                 localStorage.getItem('cbas_full_intervention_dossier')
      if (s5) status[5] = true
    } catch (e) {}

    setCompletedSteps(status)
  }, [currentStep])

  const completedCount = Object.keys(completedSteps).length
  const progressPercent = Math.round((completedCount / 5) * 100)

  // Xử lý xác nhận làm lại
  const handleConfirmReset = () => {
    if (resetMode === 'ALL') {
      resetAllStepsData()
      setShowResetModal(false)
      window.location.href = '/student/holland'
    } else {
      resetStepData(currentStep)
      setShowResetModal(false)
      if (typeof onResetStep === 'function') {
        onResetStep(currentStep)
      } else {
        const targetPath = STEPS[currentStep - 1]?.to || '/student/dashboard'
        if (window.location.pathname === targetPath) {
          window.location.reload()
        } else {
          window.location.href = targetPath
        }
      }
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-6 animate-reveal">
      {/* Hàng trên: Breadcrumb điều hướng + Nút Làm lại + Thanh % Tiến độ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
          <Link 
            to="/student/dashboard" 
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-2 py-1 rounded-md border border-slate-200"
            title="Quay về Tổng quan Lộ trình"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tổng quan</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold uppercase tracking-wider text-[11px] bg-slate-100 px-2.5 py-1 rounded-md">
            Chu trình can thiệp ViSEF CBAS
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-indigo-700 font-black text-[11px] bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            Chặng {currentStep} / 5
          </span>
        </div>

        {/* Cụm hành động: NÚT LÀM LẠI BƯỚC NÀY & Thanh tiến độ */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* NÚT LÀM LẠI BƯỚC NÀY */}
          <button
            type="button"
            onClick={() => {
              setResetMode('CURRENT')
              setShowResetModal(true)
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title={`Làm lại dữ liệu Bước ${currentStep}`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Làm lại Bước {currentStep}</span>
          </button>

          {/* Thanh hiển thị phần trăm */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Tiến độ: </span>
              <span className="text-xs font-black text-indigo-600">{completedCount}/5 bước ({progressPercent}%)</span>
            </div>
            <div className="w-20 sm:w-28 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hàng giữa: 5 Nút Tiến trình (Stepper Bar) */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 pt-4">
        {STEPS.map((s) => {
          const isCurrent = s.step === currentStep
          const isDone = Boolean(completedSteps[s.step])
          const Icon = s.icon

          // Phối màu cho từng bước khi Active
          let activeBg = 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
          if (s.color === 'emerald') activeBg = 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
          if (s.color === 'amber') activeBg = 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200'
          if (s.color === 'blue') activeBg = 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
          if (s.color === 'violet') activeBg = 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
          if (s.color === 'rose') activeBg = 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200'

          return (
            <Link
              key={s.step}
              to={s.to}
              className={`
                group relative flex flex-col items-center text-center p-2 sm:p-2.5 rounded-xl border transition-all duration-200
                ${isCurrent 
                  ? `${activeBg} scale-[1.02] ring-2 ring-offset-2 ring-indigo-400 font-bold z-10` 
                  : isDone
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }
              `}
              title={`${s.label}${isDone ? ' (Bấm để xem lại hoặc làm lại)' : ''}`}
            >
              {/* Icon & Số thứ tự */}
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black
                  ${isCurrent 
                    ? 'bg-white/20 text-white' 
                    : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }
                `}>
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    s.step
                  )}
                </span>
                <Icon className={`w-3.5 h-3.5 hidden sm:inline ${isCurrent ? 'text-white' : isDone ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>

              {/* Tên bước */}
              <span className={`text-[10px] sm:text-xs font-bold leading-tight line-clamp-1 ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                {s.shortLabel}
              </span>

              {/* Badge phụ hiển thị trên màn hình lớn */}
              <span className={`hidden md:block text-[9px] mt-0.5 truncate max-w-full font-medium ${isCurrent ? 'text-white/80' : isDone ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {isDone && !isCurrent ? '✓ Đã xong (Xem/Làm lại)' : s.badge}
              </span>

              {/* Con trỏ chỉ báo tam giác khi đang ở bước hiện tại */}
              {isCurrent && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-inherit rotate-45 border-r border-b border-inherit" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Tùy chọn Tiêu đề & Phụ đề nếu được cung cấp */}
      {(title || subtitle) && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{title}</span>
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XÁC NHẬN LÀM LẠI BƯỚC / KHỞI ĐỘNG LẠI CHU TRÌNH
          ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Xác Nhận Làm Lại Bước
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Chọn phạm vi dữ liệu em muốn làm lại
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách lựa chọn phạm vi làm lại */}
            <div className="space-y-2.5 pt-1">
              <label 
                onClick={() => setResetMode('CURRENT')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  resetMode === 'CURRENT'
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input 
                  type="radio" 
                  name="resetMode" 
                  checked={resetMode === 'CURRENT'} 
                  onChange={() => setResetMode('CURRENT')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900">
                    Chỉ làm lại Bước {currentStep}: {STEPS[currentStep - 1]?.shortLabel}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {getStepResetDescription(currentStep)}
                  </p>
                </div>
              </label>

              <label 
                onClick={() => setResetMode('ALL')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  resetMode === 'ALL'
                    ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input 
                  type="radio" 
                  name="resetMode" 
                  checked={resetMode === 'ALL'} 
                  onChange={() => setResetMode('ALL')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-rose-900">
                    Làm lại TOÀN BỘ 5 BƯỚC (Khởi động lại từ đầu)
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Xóa toàn bộ dữ liệu cả 5 bước và quay về Bước 1 để thực hiện lại chu trình từ đầu.
                  </p>
                </div>
              </label>
            </div>

            {/* Nút hành động modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className={`px-4 py-2 text-xs font-black text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  resetMode === 'ALL'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xác nhận làm lại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StepProgressHeader
