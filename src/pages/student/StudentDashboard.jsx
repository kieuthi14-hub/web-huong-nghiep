import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/common/Toast'
import { 
  ClipboardList, 
  Brain, 
  GraduationCap, 
  CalendarDays,
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Compass,
  TrendingUp,
  Award,
  Zap,
  Target,
  Flame,
  Check,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react'

const StudentDashboard = () => {
  const { user, profile, displayName, studentCode } = useAuth()
  const location = useLocation()
  const [toast, setToast] = useState(null)

  // Trạng thái & biến số thu hoạch của từng bước can thiệp
  const [stepData, setStepData] = useState({
    // Bước 1: Holland & Mỏ neo T0
    step1Done: false,
    hollandCode: null,
    targetMajor: null,
    targetSchool: null,
    confidenceT0: null,

    // Bước 2: AI Socrates
    step2Done: false,
    step2Triage: null,
    step2Outcome: null,

    // Bước 3: Đối chứng dữ liệu
    step3Done: false,
    scoreGap: null,
    cutoffScore: null,

    // Bước 4: Tư vấn 1-1
    step4Done: false,
    readinessScore: null,

    // Bước 5: Kế hoạch Hành động T2
    step5Done: false,
    confidenceT2: null,
    hasActionPlan: false
  })

  useEffect(() => {
    if (location.state?.unauthorized) {
      setToast({ type: 'warning', message: '⚠️ Bạn không có quyền truy cập trang Quản trị Admin.' })
    }
  }, [location.state])

  useEffect(() => {
    fetchStudentStatus()
  }, [user])

  const fetchStudentStatus = async () => {
    const nextState = { ...stepData }

    // ==========================================
    // 1. KIỂM TRA BƯỚC 1: HOLLAND & MỎ NEO T0
    // ==========================================
    try {
      // Đọc từ LocalStorage trước
      const localAnchor = localStorage.getItem('cbas_anchor_data') || 
                          localStorage.getItem('userAnchorData') || 
                          localStorage.getItem('cbas_user_profile') ||
                          localStorage.getItem('career_initial_anchor')
      if (localAnchor) {
        const parsed = JSON.parse(localAnchor)
        nextState.step1Done = true
        nextState.hollandCode = parsed.hollandCode || parsed.primary_code || parsed.holland_code || 'Chưa rõ'
        nextState.targetMajor = parsed.targetMajor || parsed.target_career || parsed.target_major
        nextState.targetSchool = parsed.targetSchool || parsed.target_university
        nextState.confidenceT0 = parsed.initialConfidence || parsed.confidence_score || parsed.confidence_score_initial
      }

      // Đối chứng thêm từ Supabase DB
      if (user) {
        const { data: hollandDb } = await supabase
          .from('test_results')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (hollandDb && hollandDb.length > 0) {
          nextState.step1Done = true
          if (!nextState.hollandCode || nextState.hollandCode === 'Chưa rõ') {
            nextState.hollandCode = hollandDb[0].holland_code || hollandDb[0].primary_trait
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc Bước 1:', e)
    }

    // ==========================================
    // 2. KIỂM TRA BƯỚC 2: AI SOCRATES
    // ==========================================
    try {
      const step2Local = localStorage.getItem('cbas_step2_completed') || 
                         localStorage.getItem('cbas_step2_telemetry')
      if (step2Local) {
        nextState.step2Done = true
        try {
          const parsed = JSON.parse(step2Local)
          nextState.step2Triage = parsed.triage_step4
          nextState.step2Outcome = parsed.outcome_category
        } catch (e) {}
      }

      // Kiểm tra thêm Supabase DB
      if (user) {
        const { data: debiasDb } = await supabase
          .from('metacognitive_matrix')
          .select('id, student_arguments')
          .eq('student_id', user.id)
          .limit(1)

        if (debiasDb && debiasDb.length > 0) {
          nextState.step2Done = true
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc Bước 2:', e)
    }

    // ==========================================
    // 3. KIỂM TRA BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU
    // ==========================================
    try {
      const step3Local = localStorage.getItem('cbas_step3_evidence') || 
                         localStorage.getItem('career_evidence_task') ||
                         localStorage.getItem('cbas_score_gap')
      if (step3Local) {
        nextState.step3Done = true
        try {
          const parsed = JSON.parse(step3Local)
          nextState.scoreGap = parsed.score_gap || parsed.scoreGap
          nextState.cutoffScore = parsed.cutoff_score || parsed.cutoffScores
        } catch (e) {
          if (!isNaN(parseFloat(step3Local))) {
            nextState.scoreGap = parseFloat(step3Local)
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc Bước 3:', e)
    }

    // ==========================================
    // 4. KIỂM TRA BƯỚC 4: TƯ VẤN 1-1
    // ==========================================
    try {
      const step4Local = localStorage.getItem('cbas_step4_feedback') || 
                         localStorage.getItem('mentor_feedback_record')
      if (step4Local) {
        nextState.step4Done = true
        try {
          const parsed = JSON.parse(step4Local)
          nextState.readinessScore = parsed.readiness || parsed.readinessScore
        } catch (e) {}
      }

      if (user) {
        const { data: bookingDb } = await supabase
          .from('counseling_appointments')
          .select('id, status')
          .eq('student_id', user.id)
          .limit(1)

        if (bookingDb && bookingDb.length > 0) {
          nextState.step4Done = true
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc Bước 4:', e)
    }

    // ==========================================
    // 5. KIỂM TRA BƯỚC 5: KẾ HOẠCH HÀNH ĐỘNG T2
    // ==========================================
    try {
      const step5Local = localStorage.getItem('cbas_step5_action_plan') || 
                         localStorage.getItem('cbas_full_intervention_dossier')
      if (step5Local) {
        nextState.step5Done = true
        nextState.hasActionPlan = true
        try {
          const parsed = JSON.parse(step5Local)
          nextState.confidenceT2 = parsed.confidenceT2 || parsed.confidence_post
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Lỗi đọc Bước 5:', e)
    }

    setStepData(nextState)
  }

  // Tính số bước đã hoàn thành & tỷ lệ %
  const completedList = [
    stepData.step1Done,
    stepData.step2Done,
    stepData.step3Done,
    stepData.step4Done,
    stepData.step5Done
  ]
  const completedCount = completedList.filter(Boolean).length
  const progressPercent = Math.round((completedCount / 5) * 100)

  // Xác định bước tiếp theo cần thực hiện (1 -> 5)
  const getNextActiveStep = () => {
    if (!stepData.step1Done) return 1
    if (!stepData.step2Done) return 2
    if (!stepData.step3Done) return 3
    if (!stepData.step4Done) return 4
    if (!stepData.step5Done) return 5
    return 5 // Đã làm hết
  }
  const nextActiveStep = getNextActiveStep()
  const isAllCompleted = completedCount === 5

  // Cấu hình dữ liệu chi tiết cho 5 thẻ bước
  const stepsConfig = [
    {
      step: 1,
      to: '/student/holland',
      title: 'Bước 1: Trắc Nghiệm Thiên Hướng (Holland RIASEC)',
      shortTitle: '1. Holland & Mỏ Neo T0',
      subtitle: 'Xác lập xuất phát điểm nhận thức ban đầu (Initial Anchor T0) và khám phá 6 nhóm tính cách nghề nghiệp.',
      icon: ClipboardList,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50/80',
      borderDone: 'border-emerald-300',
      textAccent: 'text-emerald-600',
      badgeAccent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      numeral: '01',
      isDone: stepData.step1Done,
      isActive: nextActiveStep === 1,
      metrics: stepData.step1Done ? [
        { label: 'Mã RIASEC', value: stepData.hollandCode || 'Đã hoàn thành' },
        { label: 'Mục tiêu T0', value: stepData.targetMajor || 'Đã xác lập' },
        { label: 'Tự tin ban đầu', value: stepData.confidenceT0 ? `${stepData.confidenceT0}/10` : 'Đã ghi nhận' }
      ] : null,
      ctaText: stepData.step1Done ? 'Xem Lại Xuất Phát Điểm T0' : 'Bắt Đầu Làm Trắc Nghiệm Ngay'
    },
    {
      step: 2,
      to: '/student/debias-agent',
      title: 'Bước 2: AI Tham Vấn Phản Tư (Socratic Agent)',
      shortTitle: '2. AI Socrates',
      subtitle: 'Đối thoại phản biện cùng Trợ lý AI để bóc tách các điểm mù tư duy, trào lưu số đông và khoảng cách năng lực.',
      icon: Sparkles,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50/80',
      borderDone: 'border-amber-300',
      textAccent: 'text-amber-600',
      badgeAccent: 'bg-amber-100 text-amber-800 border-amber-200',
      numeral: '02',
      isDone: stepData.step2Done,
      isActive: nextActiveStep === 2,
      metrics: stepData.step2Done ? [
        { label: 'Hội thoại Socratic', value: '4 Giai đoạn hoàn tất' },
        { label: 'Phân luồng tư vấn', value: stepData.step2Triage || 'Đã sàng lọc' }
      ] : null,
      ctaText: stepData.step2Done ? 'Xem Lại Biên Bản Phản Tư' : 'Bắt Đầu Đối Thoại Cùng AI'
    },
    {
      step: 3,
      to: '/student/fact-check',
      title: 'Bước 3: Đối Chứng Dữ Liệu Khách Quan',
      shortTitle: '3. Đối Chứng Dữ Liệu',
      subtitle: 'Nhập điểm học bạ, đối chiếu điểm chuẩn thực tế 2 năm và phân tích khoảng cách điểm số (scoreGap).',
      icon: GraduationCap,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50/80',
      borderDone: 'border-blue-300',
      textAccent: 'text-blue-600',
      badgeAccent: 'bg-blue-100 text-blue-800 border-blue-200',
      numeral: '03',
      isDone: stepData.step3Done,
      isActive: nextActiveStep === 3,
      metrics: stepData.step3Done ? [
        { label: 'Chênh lệch điểm', value: stepData.scoreGap !== null ? `${stepData.scoreGap > 0 ? '+' : ''}${stepData.scoreGap}đ` : 'Đã tính' },
        { label: 'Điểm chuẩn 2 năm', value: stepData.cutoffScore ? `${stepData.cutoffScore}đ` : 'Đã đối chứng' }
      ] : null,
      ctaText: stepData.step3Done ? 'Xem Lại Dữ Liệu Điểm Số' : 'Tra Cứu & Đối Chứng Dữ Liệu'
    },
    {
      step: 4,
      to: '/student/booking',
      title: 'Bước 4: Tư Vấn 1-1 Đối Chứng Thực Tế',
      shortTitle: '4. Tư Vấn 1-1 Thực Tế',
      subtitle: 'Xuất Hồ sơ lâm sàng mang theo gặp Mentor/Cố vấn và ghi lại Nhật ký thu hoạch sau buổi đối thoại.',
      icon: CalendarDays,
      color: 'violet',
      gradient: 'from-violet-600 to-purple-600',
      bgLight: 'bg-violet-50/80',
      borderDone: 'border-violet-300',
      textAccent: 'text-violet-600',
      badgeAccent: 'bg-violet-100 text-violet-800 border-violet-200',
      numeral: '04',
      isDone: stepData.step4Done,
      isActive: nextActiveStep === 4,
      metrics: stepData.step4Done ? [
        { label: 'Hồ sơ đối chất 4A', value: 'Đã sẵn sàng in/lưu' },
        { label: 'Nhật ký thu hoạch 4B', value: 'Đã hoàn tất đúc kết' }
      ] : null,
      ctaText: stepData.step4Done ? 'Xem Hồ Sơ & Nhật Ký 4B' : 'Chuẩn Bị Gặp Cố Vấn 1-1'
    },
    {
      step: 5,
      to: '/student/reflection',
      title: 'Bước 5: Kế Hoạch Hành Động Tự Chủ (Action Triad)',
      shortTitle: '5. Hành Động & Tự Tin T2',
      subtitle: 'Đo lường mức tự tin thực tế T2, thiết lập Tam giác hành động 3 trụ cột và xuất Hồ sơ Phản tư toàn diện A4/PDF.',
      icon: Brain,
      color: 'rose',
      gradient: 'from-rose-600 to-pink-600',
      bgLight: 'bg-rose-50/80',
      borderDone: 'border-rose-300',
      textAccent: 'text-rose-600',
      badgeAccent: 'bg-rose-100 text-rose-800 border-rose-200',
      numeral: '05',
      isDone: stepData.step5Done,
      isActive: nextActiveStep === 5,
      metrics: stepData.step5Done ? [
        { label: 'Tự tin thực tế T2', value: stepData.confidenceT2 ? `${stepData.confidenceT2}/10` : 'Đã đo lường' },
        { label: 'Tam giác hành động', value: 'Đã cam kết thực hiện' },
        { label: 'Hồ sơ tổng thể A4', value: 'Sẵn sàng in/tải' }
      ] : null,
      ctaText: stepData.step5Done ? 'Xem Hồ Sơ Toàn Diện 5 Bước' : 'Thiết Lập Kế Hoạch Bứt Phá'
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-reveal">
      
      {/* ======================================================== */}
      {/* 1. HERO BANNER CHUYÊN NGHIỆP: CHU TRÌNH PHẢN TƯ VISEF CBAS */}
      {/* ======================================================== */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Glow Effects nền trang trí */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Nghiên Cứu ViSEF 2026 • Phân Ngành CBAS</span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                Mô Hình Can Thiệp Giảm Thiên Lệch Nhận Thức
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Mã hóa ẩn danh: {displayName || studentCode || 'CT_01'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Xin chào, {displayName || studentCode || 'Học sinh'}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Chào mừng em đến với chu trình can thiệp phản tư khoa học 5 bước. Hãy lần lượt hoàn thành từng chặng từ việc xác lập điểm neo ban đầu (<span className="text-emerald-400 font-bold">T₀</span>), chất vấn bẫy nhận thức, đối chứng dữ liệu thực tế đến thiết lập Tam giác hành động tự chủ (<span className="text-rose-400 font-bold">T₂</span>).
            </p>
          </div>

          {/* Khối Thẻ Widget Tiến Trình Tổng Thể */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 sm:p-6 lg:w-84 shrink-0 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Tiến Độ Can Thiệp</span>
              </span>
              <span className="text-sm font-black text-amber-400">
                {completedCount} / 5 Bước ({progressPercent}%)
              </span>
            </div>

            {/* Thanh tiến độ đa sắc */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 transition-all duration-700 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Trạng thái hiện tại */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Trạng thái:</span>
              {isAllCompleted ? (
                <span className="font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành 100% 🎉
                </span>
              ) : (
                <span className="font-extrabold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3 text-amber-400" /> Đang ở Bước {nextActiveStep}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THANH LỘ TRÌNH LIÊN KẾT 5 BƯỚC (CONNECTED ROADMAP PIPELINE) */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <span>Lộ Trình Chu Trình Can Thiệp Phản Tư (5 Chặng Liên Hoàn)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Học sinh tiến hành tuần tự từ Bước 1 đến Bước 5 để đảm bảo tính chuẩn xác của kết quả can thiệp hành vi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Quy trình chuẩn ViSEF
            </span>
          </div>
        </div>

        {/* Cụm 5 Nút Lộ Trình Nối Dây (Horizontal Connected Pipeline) */}
        <div className="relative">
          {/* Đường line kết nối chạy ngầm */}
          <div className="hidden md:block absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-100 -z-0 rounded-full" />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 relative z-10">
            {stepsConfig.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.step}
                  to={s.to}
                  className={`
                    flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 relative group
                    ${s.isDone 
                      ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100/60 shadow-xs' 
                      : s.isActive
                        ? 'bg-white border-amber-400 ring-4 ring-amber-400/20 shadow-lg scale-102'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-500'
                    }
                  `}
                >
                  {/* Vòng tròn số thứ tự */}
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm mb-2 shadow-xs transition-transform duration-300 group-hover:scale-110
                    ${s.isDone 
                      ? 'bg-emerald-600 text-white' 
                      : s.isActive
                        ? `bg-gradient-to-br ${s.gradient} text-white ring-4 ring-amber-300/50`
                        : 'bg-slate-200 text-slate-600'
                    }
                  `}>
                    {s.isDone ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <span>{s.numeral}</span>
                    )}
                  </div>

                  <span className={`text-xs font-black leading-tight line-clamp-1 mb-1 ${s.isDone ? 'text-emerald-950' : s.isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                    {s.shortTitle}
                  </span>

                  {/* Badge trạng thái thu nhỏ */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.isDone 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : s.isActive 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                        : 'bg-slate-200/70 text-slate-600'
                  }`}>
                    {s.isDone ? '✓ Đã xong' : s.isActive ? '⚡ Đến lượt' : 'Chờ làm'}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. CHI TIẾT HỆ THỐNG 5 THẺ BƯỚC NỔI BẬT & CAO CẤP */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>Chi Tiết Từng Bước Can Thiệp Hành Vi</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Bấm vào từng thẻ để bắt đầu hoặc xem lại
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stepsConfig.map((s, index) => {
            const Icon = s.icon
            const isSpanFull = index === 4 // Cho thẻ Bước 5 trải rộng trên layout hoặc canh chỉnh đẹp mắt

            return (
              <Link 
                key={s.step}
                to={s.to}
                className={`
                  group relative bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between overflow-hidden
                  ${isSpanFull ? 'md:col-span-2 lg:col-span-1' : ''}
                  ${s.isDone 
                    ? `border-emerald-200 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b from-white to-emerald-50/20` 
                    : s.isActive
                      ? `border-amber-400 ring-4 ring-amber-400/20 shadow-2xl hover:-translate-y-1.5 scale-[1.01] bg-gradient-to-b from-white via-amber-50/20 to-white`
                      : `border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 bg-white`
                  }
                `}
              >
                {/* Số thứ tự chìm nghệ thuật góc trên bên phải */}
                <span className="absolute -top-3 -right-2 text-7xl font-black text-slate-100 select-none pointer-events-none group-hover:text-slate-200/80 transition-colors">
                  {s.numeral}
                </span>

                <div className="relative z-10 space-y-4">
                  {/* Hàng Header thẻ: Icon & Badge Trạng thái */}
                  <div className="flex items-center justify-between gap-2">
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105
                      bg-gradient-to-br ${s.gradient}
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Badge trạng thái */}
                    <div>
                      {s.isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐÃ HOÀN THÀNH</span>
                        </span>
                      ) : s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-400 text-slate-950 border border-amber-500 shadow-md animate-pulse">
                          <Zap className="w-3.5 h-3.5" />
                          <span>BƯỚC TIẾP THEO</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          CHỜ THỰC HIỆN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tiêu đề & Diễn giải */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      CHẶNG {s.step} / 5
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {s.subtitle}
                    </p>
                  </div>

                  {/* Hộp dữ liệu thu hoạch (nếu đã hoàn thành) */}
                  {s.metrics && (
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        📊 Dữ liệu thu hoạch được:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {s.metrics.map((m, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                            <span className="text-[10px] text-slate-400 font-bold block">{m.label}</span>
                            <span className="font-extrabold text-slate-800 truncate block">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hàng Footer thẻ: Nút bấm CTA Hành Động */}
                <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-black flex items-center gap-1.5 transition-colors ${
                    s.isDone 
                      ? 'text-emerald-700' 
                      : s.isActive
                        ? 'text-amber-600'
                        : 'text-slate-600 group-hover:text-indigo-600'
                  }`}>
                    <span>{s.ctaText}</span>
                  </span>
                  
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 shadow-xs
                    ${s.isDone 
                      ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white' 
                      : s.isActive
                        ? 'bg-amber-400 text-slate-950 group-hover:bg-amber-500'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white'
                    }
                  `}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. KHỐI TÀI NGUYÊN BỔ TRỢ & ĐỀ ÁN KHOA HỌC CBAS */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-3xl p-6 sm:p-7 border border-indigo-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-indigo-200 text-indigo-900 rounded-full inline-block">
            Đề án Nghiên cứu Khoa học Kỹ thuật 2026
          </span>
          <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            Hiệu quả can thiệp giảm thiểu thiên lệch nhận thức trong chọn nghề
          </h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Học sinh hoàn thành chu trình 5 bước sẽ được hội đồng khoa học ghi nhận đầy đủ các biến số đo lường thực nghiệm: Điểm neo ban đầu ($T_0$), Chuyển biến chất vấn Socrates ($TP$), Độ lệch điểm chuẩn ($scoreGap$), Đúc kết tham vấn thực tế và Chỉ số tự tin vững vàng ($T_2$).
          </p>
        </div>

        <Link
          to="/student/reflection"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all hover:shadow-indigo-300 hover:scale-102"
        >
          <FileText className="w-4 h-4" />
          <span>Xuất Báo Cáo Phản Tư Toàn Diện ➔</span>
        </Link>
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

export default StudentDashboard
