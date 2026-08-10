import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { Milestone, Plus, Trash2, Calendar, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

const RoadmapBuilder = () => {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái form thêm mới
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [status, setStatus] = useState('not_started')
  const [notes, setNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRoadmaps()
    }
  }, [user])

  const fetchRoadmaps = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('career_roadmaps')
        .select('*')
        .eq('student_id', user.id)
        .order('target_date', { ascending: true })

      if (error) throw error
      setRoadmaps(data || [])
    } catch (error) {
      console.error('Lỗi khi tải lộ trình:', error)
      setToast({ type: 'error', message: 'Không thể tải lộ trình hướng nghiệp.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMilestone = async (e) => {
    e.preventDefault()
    if (!title) {
      setToast({ type: 'error', message: 'Vui lòng nhập tiêu đề cột mốc!' })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('career_roadmaps')
        .insert({
          student_id: user.id,
          title,
          target_date: targetDate || null,
          status,
          notes
        })
        .select()
        .single()

      if (error) throw error
      
      setRoadmaps(prev => [...prev, data].sort((a, b) => {
        if (!a.target_date) return 1
        if (!b.target_date) return -1
        return new Date(a.target_date) - new Date(b.target_date)
      }))

      setToast({ type: 'success', message: 'Thêm cột mốc mới thành công!' })
      setTitle('')
      setTargetDate('')
      setStatus('not_started')
      setNotes('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Lỗi thêm cột mốc:', error)
      setToast({ type: 'error', message: 'Không thể lưu cột mốc mới.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cập nhật nhanh trạng thái
  const handleStatusChange = async (id, currentStatus) => {
    const statusCycle = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed: 'not_started'
    }
    const nextStatus = statusCycle[currentStatus]

    try {
      const { error } = await supabase
        .from('career_roadmaps')
        .update({ status: nextStatus })
        .eq('id', id)

      if (error) throw error

      setRoadmaps(prev => prev.map(m => m.id === id ? { ...m, status: nextStatus } : m))
      setToast({ type: 'success', message: 'Cập nhật trạng thái thành công!' })
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error)
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái cột mốc.' })
    }
  }

  // Xóa cột mốc
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cột mốc hướng nghiệp này?')) return
    try {
      const { error } = await supabase
        .from('career_roadmaps')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRoadmaps(prev => prev.filter(m => m.id !== id))
      setToast({ type: 'success', message: 'Đã xóa cột mốc.' })
    } catch (error) {
      console.error('Lỗi khi xóa cột mốc:', error)
      setToast({ type: 'error', message: 'Không thể xóa cột mốc.' })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" />
      case 'in_progress':
        return <Circle className="w-5 h-5 text-amber-500 fill-amber-50 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" />
      case 'not_started':
      default:
        return <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" />
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          variant="primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold uppercase py-2.5 px-4 gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Đóng Form' : 'Thêm mục tiêu mới'}
        </Button>
      </div>

      {/* Form Thêm cột mốc mới */}
      {showAddForm && (
        <form onSubmit={handleAddMilestone} className="bg-white border border-slate-200 p-5 rounded-sm space-y-4 animate-reveal">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Thiết lập cột mốc học tập mục tiêu
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tên cột mốc / Mục tiêu</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Đạt IELTS 6.5, Ôn thi khối A00"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạn hoàn thành</label>
              <input 
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái khởi tạo</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium text-slate-600"
              >
                <option value="not_started">Chưa bắt đầu</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ghi chú chi tiết</label>
              <input 
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Phương pháp ôn luyện, tài liệu cần đọc..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowAddForm(false)} className="text-xs py-1.5 px-3">Hủy</Button>
            <Button type="submit" isLoading={isSubmitting} variant="accent" className="text-xs py-1.5 px-4">Lưu lại</Button>
          </div>
        </form>
      )}

      {/* Giao diện Timeline */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-slate-200 rounded-sm"></div>
          <div className="h-16 bg-slate-200 rounded-sm"></div>
          <div className="h-16 bg-slate-200 rounded-sm"></div>
        </div>
      ) : roadmaps.length > 0 ? (
        <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
          {roadmaps.map((milestone) => {
            const statusBg = {
              completed: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-50/70',
              in_progress: 'bg-amber-50 border-amber-100 hover:bg-amber-50/70',
              not_started: 'bg-white border-slate-200 hover:bg-slate-50/50'
            }
            return (
              <div 
                key={milestone.id}
                className={`relative p-4 border rounded-sm shadow-sm transition-all flex items-start justify-between gap-4 animate-reveal ${statusBg[milestone.status]}`}
              >
                {/* Dot indicator on vertical line */}
                <span className="absolute -left-[31px] top-4.5 bg-white p-0.5 rounded-full z-10 border border-slate-200">
                  {getStatusIcon(milestone.status)}
                </span>

                {/* Content */}
                <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => handleStatusChange(milestone.id, milestone.status)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{milestone.title}</p>
                    <span className="text-[10px] text-slate-400 font-semibold italic">
                      (Click biểu tượng/vùng để đổi trạng thái)
                    </span>
                  </div>
                  {milestone.notes && <p className="text-xs text-slate-600 leading-relaxed font-medium">{milestone.notes}</p>}
                  
                  {milestone.target_date && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Hạn: {new Date(milestone.target_date).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDelete(milestone.id)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors self-start flex-shrink-0"
                  title="Xóa cột mốc"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-slate-500 font-semibold bg-white border border-slate-200 rounded-sm">
          Chưa thiết lập cột mốc lộ trình nào. Hãy bấm "Thêm mục tiêu mới" phía trên để khởi tạo lộ trình học tập hướng nghiệp cá nhân.
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
