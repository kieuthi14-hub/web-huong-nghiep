import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
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
  Rocket
} from 'lucide-react'

// Bộ Lộ trình Mẫu chuẩn hóa linh hoạt cho từng Khối Lớp
const standardRoadmaps = {
  '10': [
    {
      step: 'Chặng 1',
      title: 'Làm trắc nghiệm Holland & Khám phá các nhóm ngành phù hợp',
      description: 'Thực hiện bài kiểm tra trắc nghiệm hướng nghiệp Holland để tìm hiểu nhóm tính cách nghề nghiệp nổi trội (RIASEC) của bản thân.',
      actionLink: '/student/holland-test',
      actionText: '🧠 Làm trắc nghiệm ngay'
    },
    {
      step: 'Chặng 2',
      title: 'Xác định các Tổ hợp môn xét tuyển trọng tâm (VD: A00, B00, D01...) khớp với ngành dự định để tập trung học tốt',
      description: 'Đối chiếu danh mục ngành học để lựa chọn tổ hợp môn phù hợp nhất với thế mạnh cá nhân ngay từ năm lớp 10.',
      actionLink: '/student/majors',
      actionText: '🔍 Tra cứu Tổ hợp Ngành'
    },
    {
      step: 'Chặng 3',
      title: 'Rèn luyện phương pháp tự học và tham gia các hoạt động trải nghiệm thực tế',
      description: 'Xây dựng thói quen quản lý thời gian, rèn luyện kỹ năng tự học và chủ động tham gia các câu lạc bộ, hoạt động ngoại khóa.',
      actionLink: null,
      actionText: null
    }
  ],
  '11': [
    {
      step: 'Chặng 1',
      title: 'Thu hẹp danh sách xuống 2-3 ngành mục tiêu & Thực hiện Bảng Nhìn Lại (Phản tư) để soi rủi ro/mặt tối thực tế',
      description: 'Nhận diện các thiên lệch nhận thức, kiểm chứng thông tin chính thống và đánh giá thách thức nghề nghiệp thực tế.',
      actionLink: '/student/debias-matrix',
      actionText: '🔍 Thực hiện Bảng Nhìn Lại'
    },
    {
      step: 'Chặng 2',
      title: 'Đánh giá lực học thực tế các môn trong tổ hợp xét tuyển để lập kế hoạch bứt phá kiến thức',
      description: 'Phân tích điểm số học kỳ để bồi dưỡng các môn còn yếu, duy trì phong độ các môn thế mạnh trong tổ hợp xét tuyển.',
      actionLink: null,
      actionText: null
    },
    {
      step: 'Chặng 3',
      title: 'Tìm hiểu các phương thức xét tuyển mở rộng (ĐGNL, ĐGTD, Xét học bạ, Chứng chỉ...)',
      description: 'Chủ động nắm bắt cấu trúc đề thi Đánh giá năng lực / Đánh giá tư duy và quy chế xét tuyển sớm của các trường Đại học.',
      actionLink: '/student/universities',
      actionText: '🏫 Tra cứu Phương thức xét tuyển'
    }
  ],
  '12': [
    {
      step: 'Chặng 1',
      title: 'Rà soát điểm số & Lập danh sách 3 tầng nguyện vọng (An toàn - Vừa sức - Bứt phá)',
      description: 'Phân loại nguyện vọng theo 3 tầng chiến thuật dựa trên tổng điểm thi dự kiến và điểm chuẩn 3 năm gần nhất của các trường.',
      actionLink: '/student/universities',
      actionText: '🎯 Phân loại Nguyện vọng'
    },
    {
      step: 'Chặng 2',
      title: 'Tập trung tối ưu điểm số tổ hợp xét tuyển & Hoàn thiện hồ sơ xét tuyển sớm',
      description: 'Nộp hồ sơ xét tuyển học bạ/ĐGNL đợt đầu và luyện đề chuyên sâu các môn thi tốt nghiệp THPT trọng điểm.',
      actionLink: null,
      actionText: null
    },
    {
      step: 'Chặng 3',
      title: 'Bật Bảng Nhìn Lại (Phản tư) kiểm tra lần cuối trước khi chốt thứ tự NV trên Cổng của Bộ GD&ĐT',
      description: 'Rà soát lại danh sách nguyện vọng lần cuối cùng để đảm bảo không bị ảnh hưởng bởi tâm lý đám đông trước khi đăng ký chính thức.',
      actionLink: '/student/debias-matrix',
      actionText: '🧠 Bật Bảng Nhìn Lại lần cuối'
    }
  ]
}

const RoadmapBuilder = () => {
  const { user, profile } = useAuth()
  
  // Tab khối lớp hiện tại (mặc định '12' hoặc tự động nhận diện từ profile)
  const [activeGradeTab, setActiveGradeTab] = useState('12')
  
  const [roadmaps, setRoadmaps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)

  const [newRoadmap, setNewRoadmap] = useState({
    title: '',
    target_date: '',
    status: 'not_started',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tự động nhận diện khối lớp của học sinh từ dữ liệu tài khoản
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

  // Tải danh sách mục tiêu cá nhân từ bảng career_roadmaps trong Supabase
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
        console.error('Lỗi truy vấn bảng career_roadmaps:', error)
        setDbError('Chưa nạp bảng career_roadmaps trong CSDL Supabase. Thầy vui lòng nạp file schema.sql.')
        setRoadmaps([])
      } else {
        setRoadmaps(data || [])
      }
    } catch (error) {
      console.error('Lỗi fetch lộ trình từ Supabase:', error)
      setDbError('Không thể kết nối bảng career_roadmaps trên Supabase DB.')
      setRoadmaps([])
    } finally {
      setIsLoading(false)
    }
  }

  // Tạo mục tiêu cá nhân mới thuần 100% vào Supabase DB
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newRoadmap.title.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập tên mục tiêu!' })
      return
    }

    if (!user) {
      setToast({ type: 'error', message: 'Bạn cần đăng nhập để lưu lộ trình vào CSDL!' })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('career_roadmaps')
        .insert({
          student_id: user.id,
          title: newRoadmap.title,
          target_date: newRoadmap.target_date || null,
          status: newRoadmap.status,
          notes: newRoadmap.notes
        })
        .select()
        .single()

      if (error) {
        console.error('Lỗi insert Supabase DB:', error)
        setToast({ 
          type: 'error', 
          message: `Lỗi Supabase DB: ${error.message}` 
        })
        return
      }

      setRoadmaps(prev => [data, ...prev])
      setShowAddForm(false)
      setNewRoadmap({ title: '', target_date: '', status: 'not_started', notes: '' })
      setToast({ type: 'success', message: 'Đã thêm mục tiêu cá nhân thành công vào Supabase DB!' })
    } catch (error) {
      console.error('Lỗi khi nộp lộ trình:', error)
      setToast({ type: 'error', message: 'Không thể lưu mục tiêu vào Supabase DB.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cập nhật trạng thái thuần 100% vào Supabase DB
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
      console.error('Lỗi update status Supabase:', err)
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái.' })
    }
  }

  // Xóa cột mốc khỏi Supabase DB
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
      console.error('Lỗi xóa mục tiêu Supabase:', err)
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-reveal">
      {/* Header Trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Milestone className="w-5 h-5 text-brand-600" />
            Lộ trình Hướng nghiệp Tối ưu theo Khối lớp
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Hệ thống định hướng chiến lược học tập và chốt nguyện vọng phù hợp với từng giai đoạn học THPT.
          </p>
        </div>

        <Button
          variant={showAddForm ? 'secondary' : 'primary'}
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold uppercase tracking-wider py-2.5 px-4 gap-1.5 self-start flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Đóng Form' : '+ THÊM MỤC TIÊU CÁ NHÂN'}
        </Button>
      </div>

      {/* Banner Hướng Dẫn Xanh Nhẹ */}
      <div className="bg-blue-50/80 border border-blue-200 text-blue-950 p-4 rounded-sm flex items-start gap-3 shadow-2xs font-semibold text-xs leading-relaxed">
        <div className="p-1 bg-blue-500 text-white rounded-sm flex-shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-blue-900">💡 Lời nhắn hệ thống:</span> Hệ thống đang hiển thị Lộ trình chuẩn hóa cho khối lớp của bạn. Bạn có thể bấm chọn các Tab khối lớp khác để tham khảo lộ trình tổng thể trong 3 năm THPT.
        </div>
      </div>

      {/* Thanh Chọn Khối Lớp (Grade Navigation Tabs) Kích thước lớn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveGradeTab('10')}
          className={`p-4 rounded-sm border text-left transition-all duration-200 flex items-center gap-3 ${
            activeGradeTab === '10'
              ? 'bg-brand-600 border-brand-600 text-white shadow-md ring-2 ring-brand-200'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className={`p-2 rounded-sm ${activeGradeTab === '10' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">🏫 Khối Lớp 10</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${activeGradeTab === '10' ? 'text-brand-100' : 'text-slate-500'}`}>
              Khám phá & Chọn Tổ hợp
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveGradeTab('11')}
          className={`p-4 rounded-sm border text-left transition-all duration-200 flex items-center gap-3 ${
            activeGradeTab === '11'
              ? 'bg-brand-600 border-brand-600 text-white shadow-md ring-2 ring-brand-200'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className={`p-2 rounded-sm ${activeGradeTab === '11' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">🌱 Khối Lớp 11</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${activeGradeTab === '11' ? 'text-brand-100' : 'text-slate-500'}`}>
              Tập trung & Kiểm chứng Phản tư
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveGradeTab('12')}
          className={`p-4 rounded-sm border text-left transition-all duration-200 flex items-center gap-3 ${
            activeGradeTab === '12'
              ? 'bg-brand-600 border-brand-600 text-white shadow-md ring-2 ring-brand-200'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className={`p-2 rounded-sm ${activeGradeTab === '12' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">🚀 Khối Lớp 12</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${activeGradeTab === '12' ? 'text-brand-100' : 'text-slate-500'}`}>
              Tối ưu & Thực chiến Xét tuyển
            </p>
          </div>
        </button>
      </div>

      {/* Form thêm mục tiêu cá nhân mới */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 animate-reveal shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Thiết lập Mục tiêu cá nhân mới
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tên mục tiêu cá nhân</label>
              <input
                type="text"
                placeholder="VD: Đạt 8.5 điểm môn Toán thi Học kỳ 2; Thi chứng chỉ IELTS 6.5..."
                value={newRoadmap.title}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Hạn hoàn thành (Dự kiến)</label>
              <input
                type="date"
                value={newRoadmap.target_date}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, target_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Trạng thái khởi tạo</label>
              <select
                value={newRoadmap.status}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
              >
                <option value="not_started">Chưa bắt đầu</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Ghi chú chi tiết</label>
              <input
                type="text"
                placeholder="VD: Tài liệu ôn tập lưu trong thư mục Drive..."
                value={newRoadmap.notes}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold uppercase py-2 px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="accent"
              isLoading={isSubmitting}
              className="text-xs font-bold uppercase py-2 px-4"
            >
              Lưu Mục tiêu vào CSDL
            </Button>
          </div>
        </form>
      )}

      {/* Thông báo nếu DB chưa nạp bảng */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-sm text-center space-y-3">
          <AlertTriangle className="w-7 h-7 text-amber-600 mx-auto" />
          <p className="text-xs font-bold text-amber-900">{dbError}</p>
          <Button variant="primary" onClick={fetchRoadmaps} className="text-xs font-bold uppercase py-2 px-6">
            Thử lại kết nối CSDL
          </Button>
        </div>
      )}

      {/* Khối Lộ trình Chuẩn hóa theo Khối Lớp được chọn */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Khung Lộ trình Chuẩn hóa - Khối Lớp {activeGradeTab}</span>
          <span className="text-xs text-brand-600 font-semibold normal-case">
            {activeGradeTab === '10' && 'Giai đoạn Định hình & Chọn Khối môn'}
            {activeGradeTab === '11' && 'Giai đoạn Tích lũy & Kiểm chứng Phản tư'}
            {activeGradeTab === '12' && 'Giai đoạn Tối ưu & Chốt Nguyện vọng'}
          </span>
        </h2>

        <div className="space-y-4 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-brand-100">
          {currentStandardSteps.map((step, idx) => (
            <div 
              key={idx} 
              className="relative pl-12 p-4 bg-slate-50/70 border border-slate-200/80 rounded-sm space-y-2 hover:border-brand-300 transition-all"
            >
              <div className="absolute left-3.5 top-4.5 w-3.5 h-3.5 rounded-full border-2 border-brand-600 bg-white" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-100 text-brand-800 rounded-sm uppercase">
                    {step.step}
                  </span>
                  <h3 className="text-xs font-bold text-slate-800 leading-snug">{step.title}</h3>
                </div>

                {step.actionLink && (
                  <a
                    href={step.actionLink}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex-shrink-0"
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách Mục tiêu Cá nhân đã lưu vào Supabase DB */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>🎯 Danh sách Mục tiêu Cá nhân của bạn ({roadmaps.length})</span>
        </h2>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-slate-100 rounded-sm"></div>
            <div className="h-16 bg-slate-100 rounded-sm"></div>
          </div>
        ) : roadmaps.length > 0 ? (
          <div className="space-y-3">
            {roadmaps.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className="bg-slate-50 border border-slate-200 p-4 rounded-sm hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-sm">
                      Mục tiêu cá nhân
                    </span>
                    <h3 className="text-xs font-bold text-slate-800">{item.title}</h3>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="text-[11px] font-bold py-1 px-2 bg-white border border-slate-200 rounded-sm text-slate-600 focus:outline-none"
                    >
                      <option value="not_started">Chưa bắt đầu</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Xóa mục tiêu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-2.5 rounded-sm border border-slate-100">
                    {item.notes}
                  </p>
                )}

                {item.target_date && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hạn mục tiêu: {new Date(item.target_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-sm text-xs font-semibold text-slate-500">
            Bạn chưa thêm mục tiêu cá nhân nào. Hãy bấm nút <span className="font-bold text-brand-600">+ THÊM MỤC TIÊU CÁ NHÂN</span> phía trên để bổ sung kế hoạch riêng!
          </div>
        )}
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

export default RoadmapBuilder
