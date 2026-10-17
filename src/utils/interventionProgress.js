/**
 * SocraCareer - Quản lý Tiến trình Can thiệp Phản tư & Khóa Chuyển Bước Tuần Tự (CBAS ViSEF 2026)
 * Đảm bảo học sinh thực hiện tuần tự theo quy chuẩn khoa học hành vi, không được "làm tắt":
 * - Bước 1 (Holland RIASEC & Mỏ neo T0) -> mở khóa Bước 2
 * - Bước 2 (AI Socrates Phản biện 3 vòng) -> mở khóa Bước 3
 * - Bước 3 (Đối chứng Dữ liệu Tuyển sinh & Điểm chuẩn) -> mở khóa Bước 4
 * - Bước 4 (Tham vấn 1-1 / Adaptive Triage) -> mở khóa Bước 5
 * - Bước 5 (Kế hoạch Hành động Tự chủ & Tự tin T2)
 */

export const STEPS_META = [
  {
    step: 1,
    to: '/student/holland',
    label: 'Bước 1: Trắc Nghiệm & Mỏ Neo',
    shortLabel: '1. Holland & T0',
    name: 'Bước 1 (Holland RIASEC & Mỏ neo T0)',
    description: 'Xác lập thiên hướng nghề nghiệp và điểm neo ban đầu (T0)'
  },
  {
    step: 2,
    to: '/student/debias-agent',
    label: 'Bước 2: AI Tham Vấn Phản Tư',
    shortLabel: '2. AI Socrates',
    name: 'Bước 2 (AI Socrates Phản biện)',
    description: 'Chất vấn và làm lung lay thiên lệch nhận thức qua 3 vòng đối thoại'
  },
  {
    step: 3,
    to: '/student/fact-check',
    label: 'Bước 3: Đối Chứng Dữ Liệu',
    shortLabel: '3. Đối chứng dữ liệu',
    name: 'Bước 3 (Đối chứng dữ liệu tuyển sinh)',
    description: 'Đối chiếu học bạ với điểm chuẩn, học phí và tỷ lệ việc làm thực tế'
  },
  {
    step: 4,
    to: '/student/booking',
    label: 'Bước 4: Tham Vấn Đối Chất',
    shortLabel: '4. Tham vấn thích ứng',
    name: 'Bước 4 (Tham vấn đối chất thực tế)',
    description: 'Phân luồng thích ứng, gặp gỡ cố vấn hoặc rà soát Case Dossier tinh gọn'
  },
  {
    step: 5,
    to: '/student/reflection',
    label: 'Bước 5: Kế Hoạch Hành Động',
    shortLabel: '5. Hành động (T2)',
    name: 'Bước 5 (Kế hoạch hành động T2)',
    description: 'Đo lường mức tự tin thực tế T2 và thiết lập Tam giác hành động tự chủ'
  }
]

/**
 * Kiểm tra hoàn thành Bước 1
 */
export const isStep1Completed = () => {
  try {
    const raw = localStorage.getItem('cbas_user_profile') || 
                localStorage.getItem('userAnchorData') || 
                localStorage.getItem('cbas_anchor_data') ||
                localStorage.getItem('career_initial_anchor')
    if (!raw) return false
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed) return false
    const career = parsed.targetMajor || parsed.target_career || parsed.target_major
    const code = parsed.hollandCode || parsed.primary_code || parsed.holland_code
    return Boolean(career || code)
  } catch (e) {
    return false
  }
}

/**
 * Kiểm tra hoàn thành Bước 2
 */
export const isStep2Completed = () => {
  try {
    if (localStorage.getItem('cbas_step2_completed') === 'true') return true
    
    const telemetryRaw = localStorage.getItem('cbas_step2_telemetry')
    if (telemetryRaw) {
      const parsed = JSON.parse(telemetryRaw)
      if (parsed && (parsed.outcome_category || parsed.triage_step4)) return true
    }

    const msgsRaw = localStorage.getItem('cbas_step2_messages')
    if (msgsRaw) {
      const parsed = JSON.parse(msgsRaw)
      if (Array.isArray(parsed)) {
        const userCount = parsed.filter(m => m && m.role === 'user').length
        if (userCount >= 3) return true
      }
    }
    return false
  } catch (e) {
    return false
  }
}

/**
 * Kiểm tra hoàn thành Bước 3
 */
export const isStep3Completed = () => {
  try {
    const s3 = localStorage.getItem('cbas_step3_evidence') || 
               localStorage.getItem('career_evidence_task') || 
               localStorage.getItem('cbas_step3_triage') ||
               localStorage.getItem('cbas_score_gap') ||
               localStorage.getItem('cbas_step3_vocational')
    if (!s3) return false
    const parsed = typeof s3 === 'string' ? JSON.parse(s3) : s3
    return Boolean(parsed)
  } catch (e) {
    return false
  }
}

/**
 * Kiểm tra hoàn thành Bước 4
 */
export const isStep4Completed = () => {
  try {
    if (localStorage.getItem('cbas_step4_completed') === 'true') return true
    if (localStorage.getItem('cbas_step4_consultation_completed') === 'true') return true
    if (localStorage.getItem('cbas_step4_fast_track') === 'true') return true
    
    const feedback = localStorage.getItem('cbas_step4_feedback') || 
                     localStorage.getItem('mentor_feedback_record')
    if (feedback) {
      const parsed = JSON.parse(feedback)
      return Boolean(parsed)
    }
    return false
  } catch (e) {
    return false
  }
}

/**
 * Kiểm tra hoàn thành Bước 5
 */
export const isStep5Completed = () => {
  try {
    if (localStorage.getItem('cbas_step5_completed') === 'true') return true
    const plan = localStorage.getItem('cbas_step5_action_plan') || 
                 localStorage.getItem('cbas_full_intervention_dossier')
    if (plan) {
      const parsed = JSON.parse(plan)
      return Boolean(parsed)
    }
    return false
  } catch (e) {
    return false
  }
}

/**
 * Đọc trạng thái hoàn thành cả 5 bước
 */
export const getInterventionProgress = () => {
  return {
    1: isStep1Completed(),
    2: isStep2Completed(),
    3: isStep3Completed(),
    4: isStep4Completed(),
    5: isStep5Completed()
  }
}

/**
 * Kiểm tra xem một bước có được phép truy cập (đã mở khóa) hay không.
 * Quy tắc:
 * - Bước 1: luôn mở.
 * - Bước N (N > 1): chỉ mở khi TẤT CẢ các bước từ 1 đến N-1 đã hoàn thành.
 */
export const isStepUnlocked = (stepNumber, progress = getInterventionProgress()) => {
  const step = Number(stepNumber)
  if (step <= 1) return true
  if (step === 2) return Boolean(progress[1])
  if (step === 3) return Boolean(progress[1] && progress[2])
  if (step === 4) return Boolean(progress[1] && progress[2] && progress[3])
  if (step === 5) return Boolean(progress[1] && progress[2] && progress[3] && progress[4])
  return false
}

/**
 * Tìm bước cao nhất mà học sinh đang có quyền truy cập
 */
export const getHighestUnlockedStep = (progress = getInterventionProgress()) => {
  if (!progress[1]) return 1
  if (!progress[2]) return 2
  if (!progress[3]) return 3
  if (!progress[4]) return 4
  return 5
}

/**
 * Lấy thông tin lý do bước bị khóa và đường dẫn chuyển hướng hợp lệ
 */
export const getStepLockReason = (targetStep, progress = getInterventionProgress()) => {
  const target = Number(targetStep)
  if (isStepUnlocked(target, progress)) return null

  for (let s = 1; s < target; s++) {
    if (!progress[s]) {
      const missingMeta = STEPS_META.find(item => item.step === s)
      const targetMeta = STEPS_META.find(item => item.step === target)
      return {
        missingStep: s,
        targetStep: target,
        missingStepName: missingMeta?.name || `Bước ${s}`,
        targetStepName: targetMeta?.name || `Bước ${target}`,
        redirectPath: missingMeta?.to || '/student/holland',
        message: `Em cần hoàn thành ${missingMeta?.name || `Bước ${s}`} trước khi mở khóa ${targetMeta?.name || `Bước ${target}`}. Chu trình can thiệp ViSEF CBAS yêu cầu thực hiện tuần tự để đối chứng dữ liệu khoa học, tránh làm tắt!`
      }
    }
  }
  return null
}

/**
 * Xóa dữ liệu của một bước cụ thể
 */
export const resetStepData = (stepNumber) => {
  try {
    const s = Number(stepNumber)
    switch (s) {
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
        localStorage.removeItem('cbas_step4_fast_track')
        localStorage.removeItem('cbas_step4_fast_track_reflection')
        localStorage.removeItem('cbas_fast_track_checklist')
        localStorage.removeItem('cbas_fast_track_reflection')
        localStorage.removeItem('cbas_student_reflection_log')
        localStorage.removeItem('counseling_sessions_local')
        localStorage.removeItem('counseling_sessions')
        try {
          Object.keys(localStorage).forEach(k => {
            if (k && (k.startsWith('counseling_sessions_local_') || k.startsWith('cbas_step4_'))) {
              localStorage.removeItem(k)
            }
          })
        } catch (e) {}
        break
      case 5:
        localStorage.removeItem('cbas_step5_action_plan')
        localStorage.removeItem('cbas_full_intervention_dossier')
        localStorage.removeItem('cbas_step5_completed')
        localStorage.removeItem('cbas_step5_signature')
        break
      default:
        break
    }
  } catch (e) {
    console.error('Lỗi khi xóa dữ liệu bước:', e)
  }
}

/**
 * Xóa toàn bộ dữ liệu 5 bước
 */
export const resetAllStepsData = () => {
  [1, 2, 3, 4, 5].forEach(s => resetStepData(s))
}
