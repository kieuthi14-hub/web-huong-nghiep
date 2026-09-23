import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  Milestone, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  School,
  Sprout,
  Rocket,
  Download,
  FileCheck,
  Target,
  BookOpen,
  Award,
  ShieldCheck,
  TrendingUp,
  Brain,
  FileSignature
} from 'lucide-react'

// Bộ Lộ trình Mẫu chuẩn hóa linh hoạt cho cả 3 Khối Lớp
const standardRoadmaps = {
  '10': [
    {
      step: 'Chặng 1',
      title: '🧠 Trắc nghiệm Holland: Khám phá nhóm tính cách & thiên hướng nghề nghiệp ban đầu',
      description: 'Thực hiện bài kiểm tra trắc nghiệm hướng nghiệp Holland để tìm hiểu nhóm tính cách nghề nghiệp nổi trội (RIASEC) của bản thân.',
      actionLink: '/student/holland',
      actionText: '🧠 Làm trắc nghiệm ngay'
    },
    {
      step: 'Chặng 2',
      title: '🔍 Bảng Nhìn Lại (Phản tư): Soi lại thực tế năng lực để chọn Tổ hợp môn xét tuyển phù hợp (A00, B00, D01...), tránh chọn theo cảm xúc hay bạn bè',
      description: 'Dành 2 phút soi lại năng lực thực tế các môn học để chọn tổ hợp xét tuyển phù hợp nhất với thế mạnh thay vì chạy theo số đông.',
      actionLink: '/student/reflection',
      actionText: '🔍 Thực hiện Bảng Nhìn Lại'
    },
    {
      step: 'Chặng 3',
      title: '🚀 Xây dựng phương pháp học tập trọng tâm & Tham gia hoạt động trải nghiệm thực tế',
      description: 'Xây dựng thói quen quản lý thời gian, rèn luyện kỹ năng tự học các môn tổ hợp và chủ động tham gia các câu lạc bộ, hoạt động ngoại khóa.',
      actionLink: '/student/fact-check',
      actionText: '🔍 Khám phá Ngành học'
    }
  ],
  '11': [
    {
      step: 'Chặng 1',
      title: '🧠 Trắc nghiệm Holland (Làm lại): Tái đánh giá sự thay đổi tính cách/sở thích để chọn 2-3 ngành mục tiêu',
      description: 'Thực hiện lại bài trắc nghiệm Holland sau 1 năm để đánh giá độ ổn định hoặc chuyển biến trong xu hướng nghề nghiệp của bản thân.',
      actionLink: '/student/holland',
      actionText: '🧠 Làm lại trắc nghiệm'
    },
    {
      step: 'Chặng 2',
      title: '🔍 AI Socrates Phản tư: Đưa ngành mục tiêu vào kiểm chứng rủi ro, thách thức & mặt tối thực tế của nghề',
      description: 'Đưa ngành học tiềm năng vào đối thoại phễu Socrates để nhận diện điểm mù, tỷ lệ đào thải và nguy cơ tự động hóa bởi AI.',
      actionLink: '/student/debias-agent',
      actionText: '🤖 Đối thoại Socrates'
    },
    {
      step: 'Chặng 3',
      title: '🚀 Đánh giá lực học các môn trong tổ hợp xét tuyển & Tìm hiểu phương thức xét tuyển mở rộng (ĐGNL, ĐGTD, Học bạ...)',
      description: 'Nắm bắt cấu trúc đề thi Đánh giá năng lực / Đánh giá tư duy và quy chế xét tuyển sớm của các trường Đại học mục tiêu.',
      actionLink: '/student/fact-check',
      actionText: '🏫 Tra cứu Phương thức xét tuyển'
    }
  ],
  '12': [
    {
      step: 'Chặng 1',
      title: '🧠 Trắc nghiệm Holland Chốt chặn & Đối chứng Điểm chuẩn 3 năm',
      description: 'Tái kiểm tra thiên hướng nghề nghiệp lần cuối kết hợp đối chiếu tổng điểm thi thử 3 môn tổ hợp để xác định khoảng năng lực thực tế.',
      actionLink: '/student/fact-check',
      actionText: '📊 Đối chứng Dữ liệu Khách quan'
    },
    {
      step: 'Chặng 2',
      title: '🎓 Gặp Mentor 1-1 & Lập Nhật Ký Ra Quyết Định',
      description: 'Loại bỏ hoàn toàn tâm lý đám đông, áp lực gia đình và bẫy hào quang nghề nghiệp trước khi chốt danh sách nguyện vọng.',
      actionLink: '/student/booking',
      actionText: '🎓 Đặt lịch Tư vấn 1-1'
    },
    {
      step: 'Chặng 3',
      title: '🚀 Chiến thuật xếp 3 Tầng Nguyện vọng & Chốt thứ tự chính thức trên Cổng của Bộ GD&ĐT',
      description: 'Phân loại danh sách nguyện vọng theo 3 tầng chiến thuật (An toàn - Vừa sức - Bứt phá) và đăng ký chính thức trên Cổng tuyển sinh Bộ GD&ĐT.',
      actionLink: 'https://thisinh.thitotnghiepthpt.edu.vn',
      actionText: '🔗 Mở Cổng Bộ GD&ĐT'
    }
  ]
}

const RoadmapBuilder = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  // Tab khối lớp hiện tại
  const [activeGradeTab, setActiveGradeTab] = useState('12')
  
  // Đọc dữ liệu các bước trước
  const [anchor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('career_initial_anchor') || 'null')
    } catch (e) {
      return null
    }
  })

  const [decisionJournal] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('decision_reflection_journal') || 'null')
    } catch (e) {
      return null
    }
  })

  const [evidenceData] = useState(() => {
    try {
      const cbas = localStorage.getItem('cbas_step3_evidence')
      if (cbas) {
        const s = JSON.parse(cbas)
        return {
          cutoffScores: s.cutoff_score,
          tuitionFees: s.tuition,
          admissionQuota: s.employment_rate
        }
      }
      return JSON.parse(localStorage.getItem('career_evidence_task') || 'null')
    } catch (e) {
      return null
    }
  })

  // State Ma Trận Kế Hoạch Hành Động (Action Plan Matrix)
  const [actionPlanMatrix, setActionPlanMatrix] = useState(() => {
    try {
      const saved = localStorage.getItem('action_plan_matrix')
      if (saved) return JSON.parse(saved)
    } catch (e) {}

    return {
      targetSubjectScores: 'Toán: 8.5+ | Môn thứ hai (Lý/Hóa/Văn): 8.2+ | Tiếng Anh: 8.0+ (Tổng tổ hợp: 25.0+ điểm)',
      remediationPlan: 'Tập trung ôn luyện lại phần kiến thức môn còn yếu (Toán Giải tích / Tiếng Anh Ngữ pháp); làm tối thiểu 2 đề thi thử chuẩn cấu trúc mỗi tuần.',
      selfStudySkills: 'Hoàn thành khóa học Tin học cơ bản (Excel/Python cơ bản); tự học giao tiếp Tiếng Anh 30 phút mỗi ngày; rèn luyện kỹ năng quản lý thời gian.'
    }
  })

  const [roadmaps, setRoadmaps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const [newRoadmap, setNewRoadmap] = useState({
    title: '',
    target_date: '',
    status: 'not_started',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.grade_level) {
      if (profile.grade_level === 'Grade 10') setActiveGradeTab('10')
      else if (profile.grade_level === 'Grade 11') setActiveGradeTab('11')
      else if (profile.grade_level === 'Grade 12') setActiveGradeTab('12')
    }
  }, [profile])

  useEffect(() => {
    fetchRoadmaps()
  }, [user])

  const fetchRoadmaps = async () => {
    if (!user) return
    setIsLoading(true)
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('career_roadmaps')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Lỗi bảng career_roadmaps:', error)
        setRoadmaps([])
      } else {
        setRoadmaps(data || [])
      }
    } catch (error) {
      console.warn('Lỗi fetch lộ trình:', error)
      setRoadmaps([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleActionClick = (link) => {
    if (!link) return
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else {
      navigate(link)
    }
  }

  const handleMatrixChange = (field, value) => {
    setActionPlanMatrix(prev => {
      const updated = { ...prev, [field]: value }
      localStorage.setItem('action_plan_matrix', JSON.stringify(updated))
      return updated
    })
  }

  // Xuất file PDF Bản Kế Hoạch & Ký Cam Kết Hành Động
  const handleExportPDF = async () => {
    const certElement = document.getElementById('commitment-action-plan-certificate')
    if (!certElement) {
      setToast({ type: 'warning', message: 'Không tìm thấy khung Bản cam kết để xuất file!' })
      return
    }

    setIsExportingPDF(true)
    try {
      const canvas = await html2canvas(certElement, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const studentNameClean = (profile?.full_name || user?.email || 'Hoc-Sinh').replace(/[^a-zA-Z0-9]/g, '_')
      pdf.save(`Ban-Ke-Hoach-Huong-Nghiep-${studentNameClean}.pdf`)

      setToast({
        type: 'success',
        message: '🎉 Đã xuất Bản Kế Hoạch Hướng Nghiệp & Ký Cam Kết Hành Động PDF thành công!'
      })
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err)
      setToast({ type: 'error', message: 'Không thể tạo file PDF. Vui lòng thử lại.' })
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Thêm mục tiêu cá nhân
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newRoadmap.title.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập tên mục tiêu cá nhân.' })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('career_roadmaps')
        .insert([
          {
            student_id: user.id,
            title: newRoadmap.title,
            target_date: newRoadmap.target_date || null,
            status: newRoadmap.status,
            notes: newRoadmap.notes
          }
        ])
        .select()
        .single()

      if (error) throw error

      setRoadmaps(prev => [data, ...prev])
      setShowAddForm(false)
      setNewRoadmap({ title: '', target_date: '', status: 'not_started', notes: '' })
      setToast({ type: 'success', message: 'Đã thêm mục tiêu cá nhân thành công!' })
    } catch (error) {
      console.error('Lỗi khi nộp lộ trình:', error)
      setToast({ type: 'error', message: 'Không thể lưu mục tiêu vào Supabase DB.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('career_roadmaps')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      setRoadmaps(prev => prev.map(rm => rm.id === id ? { ...rm, status: newStatus } : rm))
      setToast({ type: 'success', message: 'Đã cập nhật trạng thái mục tiêu.' })
    } catch (err) {
      console.error('Lỗi update status:', err)
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái.' })
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('career_roadmaps')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRoadmaps(prev => prev.filter(rm => rm.id !== id))
      setToast({ type: 'info', message: 'Đã xóa mục tiêu khỏi danh sách.' })
    } catch (err) {
      console.error('Lỗi xóa mục tiêu:', err)
      setToast({ type: 'error', message: 'Lỗi khi xóa mục tiêu.' })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-sm">
            <Clock className="w-3 h-3" /> Đang thực hiện
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-sm">
            <AlertCircle className="w-3 h-3" /> Chưa bắt đầu
          </span>
        )
    }
  }

  const currentStandardSteps = standardRoadmaps[activeGradeTab] || standardRoadmaps['12']
  const studentFinalMajor = decisionJournal?.chosenMajor || anchor?.targetMajor || 'Chưa xác định'
  const studentInitialConf = anchor?.confidenceScore || 8
  const studentPostConf = decisionJournal?.postConfidenceScore || 7

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-reveal font-sans">
      {/* HEADER TIÊU ĐỀ BƯỚC 6 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-cyan-600 text-white rounded-md shadow-xs">
              <Milestone className="w-5 h-5" />
            </div>
            <span>6️⃣ Lộ Trình Mục Tiêu Cá Nhân</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-900 border border-cyan-300 px-2.5 py-0.5 rounded-full">
              Action Plan Matrix & Commitment Device
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Chuyển hóa nhận thức sau 5 bước thành hành động cụ thể (Implementation Intentions). Xuất bản cam kết hành động để in và dán ở góc học tập.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="primary"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="text-xs font-black uppercase tracking-wider py-2.5 px-4 bg-cyan-700 hover:bg-cyan-800 text-white gap-2 shadow-xs cursor-pointer animate-pulse"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPDF ? 'Đang tạo PDF...' : 'Ký Cam Kết & Xuất PDF'}</span>
          </Button>

          <Button
            variant={showAddForm ? 'secondary' : 'outline'}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-bold uppercase tracking-wider py-2.5 px-3 gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Đóng' : '+ Thêm Mục Tiêu'}</span>
          </Button>
        </div>
      </div>

      {/* TỔNG KẾT HÀNH TRÌNH 5 BƯỚC TRƯỚC */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ngành Mục Tiêu Chốt Lại
          </span>
          <p className="text-sm font-extrabold text-brand-900 truncate">
            🎯 {studentFinalMajor}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {decisionJournal?.finalDecisionChoice === 'CHANGE' ? '🔄 Đã chuyển ngành mới' : '✅ Giữ nguyên & Cam kết dấn thân'}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Độ Tự Tin (Trước vs Sau)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Trước: {studentInitialConf}/10</span>
            <span className="text-xs text-slate-400">➔</span>
            <span className="text-xs font-extrabold text-emerald-700">Sau: {studentPostConf}/10</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tự tin thực chứng, hiểu rõ thử thách
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Trạng Thái Cam Kết
          </span>
          <p className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <FileSignature className="w-4 h-4 text-cyan-600" />
            <span>Sẵn Sàng Ký Cam Kết</span>
          </p>
          <span className="text-[11px] text-cyan-700 font-semibold">
            Bước 6/6 trong Mô hình Can thiệp
          </span>
        </div>
      </div>

      {/* BẢNG MA TRẬN KẾ HOẠCH HÀNH ĐỘNG (ACTION PLAN MATRIX) */}
      <div className="bg-white border-2 border-cyan-500/80 rounded-sm p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-600 text-white rounded-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                BẢNG MA TRẬN KẾ HOẠCH HÀNH ĐỘNG (ACTION PLAN MATRIX)
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Điền mục tiêu điểm số và kế hoạch bồi dưỡng kiến thức để tự cam kết hành động
              </p>
            </div>
          </div>

          {/* Chọn Tab Khối lớp */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200 text-xs font-bold">
            {['10', '11', '12'].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setActiveGradeTab(grade)}
                className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                  activeGradeTab === grade
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khối Lớp {grade}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Ô 1: Điểm tổng kết tổ hợp */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-700" />
              <span>1. Điểm tổng kết tổ hợp xét tuyển cần đạt (Mục tiêu 3 môn chính):</span>
            </label>
            <input
              type="text"
              value={actionPlanMatrix.targetSubjectScores}
              onChange={(e) => handleMatrixChange('targetSubjectScores', e.target.value)}
              placeholder="VD: Toán: 8.5+ | Lý: 8.0+ | Anh: 8.5+ (Tổng tổ hợp A01: 25.0+ điểm)"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm font-semibold text-xs text-slate-800 focus:outline-none focus:border-cyan-600"
            />
          </div>

          {/* Ô 2: Kế hoạch bù đắp môn yếu */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>2. Kế hoạch bù đắp lỗ hổng kiến thức & Môn còn yếu cần cải thiện ngay:</span>
            </label>
            <textarea
              rows={2}
              value={actionPlanMatrix.remediationPlan}
              onChange={(e) => handleMatrixChange('remediationPlan', e.target.value)}
              placeholder="VD: Môn Toán phần Hình học không gian còn yếu; dành 45 phút mỗi tối làm thêm bài tập nâng cao và làm đề thi thử vào sáng Chủ nhật..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm font-semibold text-xs text-slate-800 focus:outline-none focus:border-cyan-600"
            />
          </div>

          {/* Ô 3: Kỹ năng thực tế tự học */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>3. Kỹ năng thực tế tự rèn luyện (Tin học, Ngoại ngữ, Kỹ năng mềm, Dự án):</span>
            </label>
            <textarea
              rows={2}
              value={actionPlanMatrix.selfStudySkills}
              onChange={(e) => handleMatrixChange('selfStudySkills', e.target.value)}
              placeholder="VD: Luyện nghe Tiếng Anh qua TED Talks 20 phút/ngày; học cách dùng phần mềm văn phòng Word/Excel; tham gia CLB truyền thông của trường..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm font-semibold text-xs text-slate-800 focus:outline-none focus:border-cyan-600"
            />
          </div>
        </div>
      </div>

      {/* KHUNG XÁC NHẬN & KÝ CAM KẾT HÀNH ĐỘNG (XUẤT PDF) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              BẢN KẾ HOẠCH HƯỚNG NGHIỆP & CAM KẾT HÀNH ĐỘNG CÁ NHÂN (XUẤT PDF)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Bấm "Ký Cam Kết & Xuất PDF" ở trên hoặc dưới để tải file
          </span>
        </div>

        {/* PHẦN CHỨNG CHỈ ĐƯỢC CHỤP BỞI HTML2CANVAS SANG PDF */}
        <div 
          id="commitment-action-plan-certificate"
          className="bg-white border-4 border-slate-900 p-8 rounded-sm shadow-md space-y-6 text-slate-900 relative"
          style={{ fontFamily: 'sans-serif' }}
        >
          {/* Header Trang trọng của Bản Cam kết */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
              ĐỀ TÀI NGHIÊN CỨU KHOA HỌC HÀNH VI — HƯỚNG NGHIỆP GIẢM THIÊN LỆCH NHẬN THỨC
            </span>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
              BẢN KẾ HOẠCH HƯỚNG NGHIỆP & CAM KẾT HÀNH ĐỘNG CÁ NHÂN
            </h2>
            <p className="text-xs italic text-slate-600">
              (Commitment Device & Implementation Intentions — Áp dụng Thuyết Tự Quyết SDT)
            </p>
          </div>

          {/* Thông tin học sinh */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Họ và tên học sinh</span>
              <span className="font-black text-slate-900 text-sm">{profile?.full_name || user?.email || 'Học sinh THPT'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Khối lớp hiện tại</span>
              <span className="font-bold text-slate-900">Khối Lớp {activeGradeTab}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Ngày lập cam kết</span>
              <span className="font-bold text-slate-900">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Chỉ số tự tin thực chứng</span>
              <span className="font-black text-emerald-700">{studentPostConf}/10 (Sau phản tư)</span>
            </div>
          </div>

          {/* Ngành mục tiêu & 3 Rủi ro đã nhận diện */}
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-sm">
              <span className="font-black text-brand-900 block text-xs uppercase mb-1">
                🎯 NGÀNH HỌC MỤC TIÊU ĐÃ KIỂM CHỨNG & CHỐT QUYẾT ĐỊNH:
              </span>
              <p className="text-sm font-black text-slate-900">
                {studentFinalMajor} {anchor?.targetUniversity ? `— [${anchor.targetUniversity}]` : ''}
              </p>
            </div>

            {decisionJournal?.riskAcademic && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                  <strong className="text-slate-900 block mb-1">1. Thách thức học thuật:</strong>
                  <p className="text-slate-700">{decisionJournal.riskAcademic}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                  <strong className="text-slate-900 block mb-1">2. Thách thức tài chính:</strong>
                  <p className="text-slate-700">{decisionJournal.riskFinancial}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                  <strong className="text-slate-900 block mb-1">3. Thách thức đào thải / AI:</strong>
                  <p className="text-slate-700">{decisionJournal.riskMarket}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ma trận hành động */}
          <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
            <h4 className="font-black uppercase tracking-wider text-slate-900 text-xs">
              📋 MA TRẬN KẾ HOẠCH HÀNH ĐỘNG CỤ THỂ:
            </h4>
            <div className="space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-black text-cyan-800 min-w-36">Điểm số mục tiêu:</span>
                <span className="font-semibold text-slate-800">{actionPlanMatrix.targetSubjectScores}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-emerald-800 min-w-36">Kế hoạch khắc phục:</span>
                <span className="font-medium text-slate-800">{actionPlanMatrix.remediationPlan}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-amber-800 min-w-36">Kỹ năng tự rèn luyện:</span>
                <span className="font-medium text-slate-800">{actionPlanMatrix.selfStudySkills}</span>
              </div>
            </div>
          </div>

          {/* Lời Tuyên Thệ Cam Kết & Khung Ký Tên */}
          <div className="border-t-2 border-slate-900 pt-4 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-300 text-center text-xs font-bold text-amber-950 italic">
              "Tôi xác nhận đã trải qua trọn vẹn 6 bước phản tư khoa học, nhìn thẳng vào các khó khăn và rủi ro thực tế. Tôi cam kết tự giác thực hiện kế hoạch hành động này, chủ động rèn luyện mỗi ngày và hoàn toàn chịu trách nhiệm về tương lai của chính mình."
            </div>

            <div className="grid grid-cols-2 text-center pt-2 text-xs">
              <div className="space-y-12">
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Xác nhận của Cố vấn Hướng nghiệp</span>
                  <span className="italic text-[11px] text-slate-600">(Đã đối chứng thực tế)</span>
                </div>
                <p className="font-bold text-slate-800">Ban Cố Vấn Hướng Nghiệp</p>
              </div>

              <div className="space-y-12">
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Học sinh ký cam kết</span>
                  <span className="italic text-[11px] text-slate-600">(Ký và ghi rõ họ tên)</span>
                </div>
                <p className="font-black text-slate-900 uppercase">
                  {profile?.full_name || user?.email || 'Học sinh'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nút Xuất PDF dưới chân bản cam kết */}
        <div className="text-center pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{isExportingPDF ? 'Đang xuất PDF...' : '📜 XÁC NHẬN & TẢI BẢN CAM KẾT HÀNH ĐỘNG (FILE PDF)'}</span>
          </Button>
        </div>
      </div>

      {/* FORM THÊM MỤC TIÊU CÁ NHÂN */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-brand-500 p-6 rounded-sm space-y-4 shadow-sm animate-reveal">
          <h3 className="text-xs font-black text-brand-900 uppercase tracking-wider border-b border-brand-100 pb-2">
            Thêm Mục Tiêu Hành Động Mới
          </h3>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">Tên Mục Tiêu / Tác Vụ</label>
            <input
              type="text"
              placeholder="VD: Ôn luyện phần Hàm số đạt 9 điểm trong bài kiểm tra 1 tiết..."
              value={newRoadmap.title}
              onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">Hạn Chót (Target Date)</label>
              <input
                type="date"
                value={newRoadmap.target_date}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, target_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">Trạng Thái</label>
              <select
                value={newRoadmap.status}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold cursor-pointer"
              >
                <option value="not_started">Chưa bắt đầu</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">Ghi Chú Kế Hoạch</label>
            <textarea
              rows={2}
              placeholder="Ghi chú phương pháp học tập hoặc tài liệu cần tham khảo..."
              value={newRoadmap.notes}
              onChange={(e) => setNewRoadmap({ ...newRoadmap, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold uppercase py-2 px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="text-xs font-bold uppercase py-2 px-6"
            >
              Lưu Mục Tiêu
            </Button>
          </div>
        </form>
      )}

      {/* DANH SÁCH 3 CHẶNG CHIẾN LƯỢC MẪU CHO KHỐI LỚP */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
          <span>LỘ TRÌNH CHIẾN LƯỢC ĐỀ XUẤT CHO HỌC SINH KHỐI {activeGradeTab}</span>
          <span className="text-[11px] text-cyan-700 font-bold normal-case">3 Chặng then chốt</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentStandardSteps.map((step, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-sm shadow-2xs space-y-3 flex flex-col justify-between hover:border-cyan-400 transition-colors">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-sm inline-block">
                  {step.step}
                </span>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleActionClick(step.actionLink)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-cyan-800 font-bold text-xs rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{step.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DANH SÁCH MỤC TIÊU CÁ NHÂN TỰ ĐẶT */}
      {roadmaps.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>MỤC TIÊU CÁ NHÂN ĐÃ THÊM</span>
            <span className="text-[11px] text-slate-500 font-semibold">{roadmaps.length} mục tiêu</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roadmaps.map((rm) => (
              <div key={rm.id} className="bg-white border border-slate-200 p-4 rounded-sm shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{rm.title}</h4>
                  <button
                    type="button"
                    onClick={() => handleDelete(rm.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {rm.notes && (
                  <p className="text-[11px] text-slate-600 font-medium">{rm.notes}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-500">
                    {rm.target_date ? `Hạn: ${new Date(rm.target_date).toLocaleDateString('vi-VN')}` : 'Không có hạn'}
                  </span>
                  <div>{getStatusBadge(rm.status)}</div>
                </div>
              </div>
            ))}
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

export default RoadmapBuilder
