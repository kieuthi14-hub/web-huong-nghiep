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
  AlertTriangle 
} from 'lucide-react'

const RoadmapBuilder = () => {
  const { user } = useAuth()
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

  useEffect(() => {
    fetchRoadmaps()
  }, [user])

  // Tải danh sách lộ trình thuần 100% từ bảng career_roadmaps trong Supabase
  const fetchRoadmaps = async () => {
    if (!user) return
    setIsLoading(true)
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('career_roadmaps')
        .select('*')
        .eq('student_id', user.id)
        .order('target_date', { ascending: true })

      if (error) {
        console.error('Lỗi truy vấn bảng career_roadmaps:', error)
        setDbError('Chưa nạp bảng career_roadmaps trong CSDL Supabase. Thầy vui lòng nạp file schema.sql trong SQL Editor của Supabase.')
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

  // Tạo cột mốc mới thuần 100% vào Supabase DB
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
          message: error.code === '42P01' 
            ? 'Bảng career_roadmaps chưa được tạo trên Supabase. Thầy vui lòng thực thi file schema.sql!' 
            : `Lỗi Supabase DB: ${error.message}` 
        })
        return
      }

      setRoadmaps(prev => [...prev, data])
      setShowAddForm(false)
      setNewRoadmap({ title: '', target_date: '', status: 'not_started', notes: '' })
      setToast({ type: 'success', message: 'Đã thêm cột mốc mới thành công vào Supabase DB!' })
    } catch (error) {
      console.error('Lỗi khi nộp lộ trình:', error)
      setToast({ type: 'error', message: 'Không thể lưu cột mốc vào Supabase DB.' })
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
      setToast({ type: 'success', message: 'Đã cập nhật trạng thái cột mốc trong Supabase DB.' })
    } catch (err) {
      console.error('Lỗi update status Supabase:', err)
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái trong CSDL.' })
    }
  }

  // Xóa cột mốc thuần 100% khỏi Supabase DB
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('career_roadmaps')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRoadmaps(prev => prev.filter(rm => rm.id !== id))
      setToast({ type: 'info', message: 'Đã xóa cột mốc khỏi CSDL Supabase.' })
    } catch (err) {
      console.error('Lỗi xóa cột mốc Supabase:', err)
      setToast({ type: 'error', message: 'Lỗi khi xóa cột mốc khỏi CSDL.' })
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Milestone className="w-5 h-5 text-brand-600" />
            Lộ trình Hướng nghiệp cá nhân (Supabase DB)
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Xây dựng và lưu trữ tiến độ các cột mốc học tập trực tiếp trong bảng career_roadmaps của PostgreSQL.
          </p>
        </div>

        <Button
          variant={showAddForm ? 'secondary' : 'primary'}
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold uppercase tracking-wider py-2.5 px-4 gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Đóng Form' : 'Thêm mục tiêu mới'}
        </Button>
      </div>

      {/* Form thêm cột mốc mới */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 animate-reveal">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Thiết lập cột mốc học tập mục tiêu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tên cột mốc / Mục tiêu</label>
              <input
                type="text"
                placeholder="VD: Đạt 8.5 điểm môn Toán thi Học kỳ 2"
                value={newRoadmap.title}
                onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Hạn hoàn thành</label>
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
                placeholder="VD: Tài liệu ôn thi trong thư mục Drive..."
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
              Lưu lại vào Supabase
            </Button>
          </div>
        </form>
      )}

      {/* Thông báo nếu DB chưa có bảng */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-sm text-center space-y-3">
          <AlertTriangle className="w-7 h-7 text-amber-600 mx-auto" />
          <p className="text-xs font-bold text-amber-900">{dbError}</p>
          <Button variant="primary" onClick={fetchRoadmaps} className="text-xs font-bold uppercase py-2 px-6">
            Thử lại kết nối CSDL
          </Button>
        </div>
      )}

      {/* Danh sách Timeline lộ trình */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
        </div>
      ) : roadmaps.length > 0 ? (
        <div className="space-y-4 relative before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {roadmaps.map((item, idx) => (
            <div 
              key={item.id || idx} 
              className="relative pl-14 bg-white border border-slate-200 p-5 rounded-sm hover:border-slate-300 transition-all space-y-2 group"
            >
              <div className="absolute left-4 top-5 w-4 h-4 rounded-full border-2 border-brand-500 bg-white group-hover:bg-brand-500 transition-colors" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="text-[11px] font-bold py-1 px-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-600 focus:outline-none"
                  >
                    <option value="not_started">Chưa bắt đầu</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa cột mốc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.notes && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-sm border border-slate-100">
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
      ) : !dbError && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm text-xs font-semibold text-slate-500 space-y-2">
          <p>Chưa thiết lập cột mốc lộ trình nào trong bảng career_roadmaps của Supabase DB. Hãy bấm "Thêm mục tiêu mới" phía trên để khởi tạo.</p>
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
