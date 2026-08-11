import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  Brain, 
  UserCheck, 
  Search, 
  AlertTriangle, 
  HelpCircle, 
  Save, 
  CheckCircle2, 
  Sparkles,
  History,
  Trash2
} from 'lucide-react'

const DebiasMatrix = () => {
  const { user } = useAuth()
  
  const [targetMajor, setTargetMajor] = useState('')
  const [evidence, setEvidence] = useState('')
  const [verifiedSources, setVerifiedSources] = useState('')
  const [riskAnalysis, setRiskAnalysis] = useState('')
  const [biasCheck, setBiasCheck] = useState('')

  const [savedMatrices, setSavedMatrices] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchMatrices()
  }, [user])

  const fetchMatrices = async () => {
    if (!user) return
    setIsLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('metacognitive_matrix')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSavedMatrices(data)
      } else {
        const localData = localStorage.getItem(`debias_matrix_${user.id}`)
        if (localData) setSavedMatrices(JSON.parse(localData))
      }
    } catch (error) {
      console.warn('Tải ma trận phản tư từ LocalStorage:', error)
      const localData = localStorage.getItem(`debias_matrix_${user.id}`)
      if (localData) setSavedMatrices(JSON.parse(localData))
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    // 1. Kiểm tra validation nhập liệu
    if (!targetMajor.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập Tên ngành học bạn đang dự định chọn!' })
      return
    }
    if (!evidence.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 1: Năng lực & Bằng chứng thực tế!' })
      return
    }
    if (!verifiedSources.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 2: Dữ liệu đối chứng chính thống!' })
      return
    }
    if (!riskAnalysis.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 3: Phân tích Rủi ro & Mặt tối!' })
      return
    }
    if (!biasCheck.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 4: Kiểm tra Bẫy Thiên lệch!' })
      return
    }

    setIsSubmitting(true)
    const newEntry = {
      id: `matrix-${Date.now()}`,
      student_id: user?.id,
      target_major: targetMajor,
      evidence,
      verified_sources: verifiedSources,
      risk_analysis: riskAnalysis,
      bias_check: biasCheck,
      created_at: new Date().toISOString()
    }

    try {
      // 2. Lưu vào Supabase Database
      let isSavedToDB = false
      if (user) {
        const { data, error } = await supabase
          .from('metacognitive_matrix')
          .insert({
            student_id: user.id,
            target_major: targetMajor,
            evidence,
            verified_sources: verifiedSources,
            risk_analysis: riskAnalysis,
            bias_check: biasCheck
          })
          .select()
          .maybeSingle()

        if (!error && data) {
          isSavedToDB = true
          setSavedMatrices(prev => [data, ...prev])
        } else {
          console.log('Chưa có bảng metacognitive_matrix trên Supabase DB, lưu dữ liệu dạng Demo:', error)
        }
      }

      if (!isSavedToDB) {
        const nextList = [newEntry, ...savedMatrices]
        setSavedMatrices(nextList)
        if (user) {
          localStorage.setItem(`debias_matrix_${user.id}`, JSON.stringify(nextList))
        }
      }

      // Reset form
      setTargetMajor('')
      setEvidence('')
      setVerifiedSources('')
      setRiskAnalysis('')
      setBiasCheck('')

      setToast({ 
        type: 'success', 
        message: 'Lưu & Khởi tạo Bảng Phản Tư thành công!' 
      })
    } catch (error) {
      console.error('Lỗi khi lưu bảng phản tư:', error)
      setToast({ type: 'error', message: 'Không thể lưu bảng phản tư.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      if (user) {
        await supabase
          .from('metacognitive_matrix')
          .delete()
          .eq('id', id)
      }
    } catch (err) {
      console.warn('Lỗi xóa Supabase:', err)
    }

    const nextList = savedMatrices.filter(m => m.id !== id)
    setSavedMatrices(nextList)
    if (user) {
      localStorage.setItem(`debias_matrix_${user.id}`, JSON.stringify(nextList))
    }
    setToast({ type: 'info', message: 'Đã xóa bản ghi phản tư.' })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-reveal">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-sm text-brand-600">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              🧠 Bảng Ma Trận Phản Tư Chọn Nghề (Metacognitive Matrix)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Công cụ kích hoạt tư duy phản tư giúp bạn nhận diện rủi ro, kiểm chứng thông tin và vượt qua các bẫy thiên lệch nhận thức trước khi ra quyết định.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Khung nhập Tên Ngành học */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-2 shadow-sm">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tên Ngành Học Dự Định Chọn
          </label>
          <input
            type="text"
            placeholder="Nhập tên ngành học em đang dự định chọn (Ví dụ: Khoa học máy tính, Marketing...)"
            value={targetMajor}
            onChange={(e) => setTargetMajor(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-bold text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Bảng Ma Trận 4 Ô (Grid 2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ô 1: Màu xanh dương - Icon UserCheck */}
          <div className="bg-blue-50/40 border border-blue-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-blue-900 border-b border-blue-100 pb-2.5">
              <div className="p-1.5 bg-blue-500 text-white rounded-sm">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                1. Năng lực & Bằng chứng thực tế
              </h3>
            </div>
            <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
              Liệt kê ít nhất 2 điểm số, kỹ năng hoặc trải nghiệm thực tế chứng minh em phù hợp với ngành này.
            </p>
            <textarea
              rows={4}
              placeholder="VD: Điểm học bạ Toán - Lý đều trên 8.5; đã tự học xây dựng website cá nhân bằng HTML/CSS..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-blue-200 focus:border-blue-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>

          {/* Ô 2: Màu tím - Icon Search */}
          <div className="bg-indigo-50/40 border border-indigo-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-900 border-b border-indigo-100 pb-2.5">
              <div className="p-1.5 bg-indigo-500 text-white rounded-sm">
                <Search className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                2. Dữ liệu đối chứng chính thống
              </h3>
            </div>
            <p className="text-[11px] text-indigo-700 font-semibold leading-relaxed">
              Nhập nguồn thông tin/báo cáo thị trường em đã tham khảo (tránh thông tin đơn chiều từ mạng xã hội).
            </p>
            <textarea
              rows={4}
              placeholder="VD: Báo cáo nhu cầu nhân lực của VietnamWorks 2024; Đã đọc chuẩn đầu ra và lộ trình đào tạo trên website chính thức của Đại học..."
              value={verifiedSources}
              onChange={(e) => setVerifiedSources(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>

          {/* Ô 3: Màu cam - Icon AlertTriangle */}
          <div className="bg-amber-50/40 border border-amber-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-amber-900 border-b border-amber-100 pb-2.5">
              <div className="p-1.5 bg-amber-500 text-white rounded-sm">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                3. Phân tích Rủi ro & Mặt tối
              </h3>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              Liệt kê 2 thách thức, áp lực hoặc nguy cơ (như bị AI thay thế, tỷ lệ đào thải) mà em sẵn sàng chấp nhận.
            </p>
            <textarea
              rows={4}
              placeholder="VD: Áp lực OT cập nhật kiến thức công nghệ liên tục; Nguy cơ lập trình viên cấp thấp bị trí tuệ nhân tạo (AI) thay thế trong 5 năm tới..."
              value={riskAnalysis}
              onChange={(e) => setRiskAnalysis(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-amber-200 focus:border-amber-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>

          {/* Ô 4: Màu đỏ/hồng - Icon HelpCircle */}
          <div className="bg-rose-50/40 border border-rose-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-rose-900 border-b border-rose-100 pb-2.5">
              <div className="p-1.5 bg-rose-500 text-white rounded-sm">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                4. Kiểm tra Bẫy Thiên lệch
              </h3>
            </div>
            <p className="text-[11px] text-rose-800 font-semibold leading-relaxed">
              Quyết định chọn ngành này của em có đang bị ảnh hưởng bởi tâm lý đám đông hay các video viral không? Vì sao?
            </p>
            <textarea
              rows={4}
              placeholder="VD: Em ban đầu định chọn theo lời rủ của nhóm bạn thân, nhưng sau khi đối chứng tài năng thì thấy bản thân thực sự đam mê kỹ thuật hơn..."
              value={biasCheck}
              onChange={(e) => setBiasCheck(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-rose-200 focus:border-rose-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>
        </div>

        {/* Nút bấm rực rỡ bên dưới */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="accent"
            isLoading={isSubmitting}
            className="w-full md:w-auto font-bold text-xs uppercase tracking-wider py-3.5 px-8 gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            Lưu & Khởi tạo Bảng Phản Tư
          </Button>
        </div>
      </form>

      {/* Lịch sử các Ma trận Phản tư đã tạo */}
      {savedMatrices.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-brand-600" />
            Các Bảng Phản Tư Đã Khởi Tạo ({savedMatrices.length})
          </h2>

          <div className="space-y-4">
            {savedMatrices.map((matrix) => (
              <div key={matrix.id} className="bg-white border border-slate-200 p-5 rounded-sm space-y-4 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-sm">
                      Ngành mục tiêu
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{matrix.target_major}</h3>
                  </div>
                  <button
                    onClick={() => handleDelete(matrix.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa bản ghi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-sm space-y-1">
                    <p className="font-bold text-blue-900 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> 1. Bằng chứng thực tế:
                    </p>
                    <p className="text-slate-700 leading-relaxed">{matrix.evidence}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-sm space-y-1">
                    <p className="font-bold text-indigo-900 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5" /> 2. Nguồn chính thống:
                    </p>
                    <p className="text-slate-700 leading-relaxed">{matrix.verified_sources}</p>
                  </div>

                  <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-sm space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 3. Rủi ro & Thách thức:
                    </p>
                    <p className="text-slate-700 leading-relaxed">{matrix.risk_analysis}</p>
                  </div>

                  <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-sm space-y-1">
                    <p className="font-bold text-rose-900 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> 4. Kiểm tra bẫy thiên lệch:
                    </p>
                    <p className="text-slate-700 leading-relaxed">{matrix.bias_check}</p>
                  </div>
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

export default DebiasMatrix
