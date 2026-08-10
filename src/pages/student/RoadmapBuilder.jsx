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
  Edit, 
  Flag 
} from 'lucide-react'

// Cột mốc mặc định ban đầu nếu chưa có dữ liệu
const initialRoadmaps = [
  {
    id: 'rm-1',
    title: 'Xác định khối thi THPT và ngành học mục tiêu',
    target_date: '2025-06-30',
    status: 'completed',
    notes: 'Đã hoàn thành trắc nghiệm Holland và chốt nhóm ngành Kỹ thuật - Công nghệ (A00, A01).'
  },
  {
    id: 'rm-2',
    title: 'Đạt chứng chỉ Tiếng Anh IELTS 6.5+',
    target_date: '2025-12-15',
    status: 'in_progress',
    notes: 'Tập trung luyện kỹ năng Speaking & Writing tại trung tâm.'
  },
  {
    id: 'rm-3',
    title: 'Ôn thi Đánh giá Năng lực (ĐGNL) ĐHQG',
    target_date: '2026-03-20',
    status: 'not_started',
    notes: 'Giải đề thi mẫu các năm trước và ôn tập phần Tư duy logic.'
  }
]

const RoadmapBuilder = () => {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [toast, setToast] = useState(null)

  const [newRoadmap, setNewRoadmap] = useState({
    title: '',
    target_date: '',
    status: 'not_started',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const fetchRoadmaps = async () => {
    setIsLoading(true)
    try {
      let fetchedList = []
      if (user) {
        const { data, error } = await supabase
          .from('career_roadmaps')
          .select('*')
          .eq('student_id', user.id)
          .order('target_date', { ascending: true })

        if (!error && data && data.length > 0) {
          fetchedList = data
        }
      }

      if (fetchedList.length === 0) {
        const localSaved = localStorage.getItem(`roadmaps_${user?.id || 'guest'}`)
        if (localSaved) {
          fetchedList = JSON.parse(localSaved)
        } else {
          fetchedList = initialRoadmaps
        }
      }

      setRoadmaps(fetchedList)
    } catch (error) {
      console.warn('Dùng dữ liệu lộ trình dự phòng:', error)
      const localSaved = localStorage.getItem(`roadmaps_${user?.id || 'guest'}`)
      setRoadmaps(localSaved ? JSON.parse(localSaved) : initialRoadmaps)
    } finally {
      setIsLoading(false)
    }
  }

  const saveToLocalAndState = (updatedList) => {
    setRoadmaps(updatedList)
    localStorage.setItem(`roadmaps_${user?.id || 'guest'}`, JSON.stringify(updatedList))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newRoadmap.title.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập tên mục tiêu!' })
      return
    }

    setIsSubmitting(true)
    const newId = `rm-${Date.now()}`
    const newItem = {
      id: newId,
      student_id: user?.id,
      title: newRoadmap.title,
      target_date: newRoadmap.target_date || null,
      status: newRoadmap.status,
      notes: newRoadmap.notes,
      created_at: new Date().toISOString()
    }

    try {
      // 1. Thử insert vào Supabase DB
      if (user) {
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
          .maybeSingle()

        if (!error && data) {
          saveToLocalAndState([...roadmaps, data])
          setShowAddForm(false)
          setNewRoadmap({ title: '', target_date: '', status: 'not_started', notes: '' })
          setToast({ type: 'success', message: 'Đã thêm cột mốc mới thành công!' })
          return
        }
      }

      // 2. Fallback sang LocalStorage nếu DB chưa có bảng hoặc bị lỗi RLS
      const nextList = [...roadmaps, newItem]
      saveToLocalAndState(nextList)
      setShowAddForm(false)
      setNewRoadmap({ title: '', target_date: '', status: 'not_started', notes: '' })
      setToast({ type: 'success', message: 'Đã lưu cột mốc vào lộ trình mục tiêu!' })
    } catch (error) {
      console.warn('Lưu vào LocalStorage làm fallback:', error)
      const nextList = [...roadmaps, newItem]
      saveToLocalAndState(nextList)
      setShowAddForm(false)
      setNewRoadmap({ title: '', target_date: '', status: 'not_started', notes: '' })
      setToast({ type: 'success', message: 'Đã lưu cột mốc vào lộ trình mục tiêu!' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (user) {
        await supabase
          .from('career_roadmaps')
          .update({ status: newStatus })
          .eq('id', id)
      }
    } catch (err) {
      console.warn('Lỗi update status DB:', err)
    }

    const nextList = roadmaps.map(rm => rm.id === id ? { ...rm, status: newStatus } : rm)
    saveToLocalAndState(nextList)
    setToast({ type: 'success', message: 'Đã cập nhật trạng thái cột mốc.' })
  }

  const handleDelete = async (id) => {
    try {
      if (user) {
        await supabase
          .from('career_roadmaps')
          .delete()
          .eq('id', id)
      }
    } catch (err) {
      console.warn('Lỗi xóa DB:', err)
    }

    const nextList = roadmaps.filter(rm => rm.id !== id)
    saveToLocalAndState(nextList)
    setToast({ type: 'info', message: 'Đã xóa cột mốc khỏi lộ trình.' })
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
            Lộ trình Hướng nghiệp cá nhân
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Xây dựng và theo dõi tiến độ các cột mốc học tập chuẩn bị cho kỳ thi THPT và chọn ngành.
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
              Lưu lại
            </Button>
          </div>
        </form>
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
      ) : (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm text-xs font-semibold text-slate-500 space-y-2">
          <p>Chưa thiết lập cột mốc lộ trình nào. Hãy bấm "Thêm mục tiêu mới" phía trên để khởi tạo lộ trình học tập hướng nghiệp cá nhân.</p>
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
