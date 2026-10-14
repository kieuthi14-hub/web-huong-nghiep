import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, X, KeyRound, GraduationCap } from 'lucide-react'

/**
 * AdminPasswordModal: Modal & Full-page Gate bảo vệ khu vực Quản trị viên
 * Ngăn chặn tuyệt đối học sinh tự ý bấm vào hoặc truy cập Bảng Quản trị CBAS 2026.
 */
const AdminPasswordModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  isGateMode = false // true khi dùng làm Protected Route Gate
}) => {
  const { verifyAdminPassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTeacherHint, setShowTeacherHint] = useState(false)

  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen || isGateMode) {
      setPassword('')
      setError(null)
      setShowTeacherHint(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isGateMode])

  if (!isOpen && !isGateMode) return null

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu quản trị viên!')
      inputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = verifyAdminPassword(password)
    if (result.success) {
      setIsSubmitting(false)
      setPassword('')
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/admin/dashboard')
      }
    } else {
      setIsSubmitting(false)
      setError(result.error || 'Mật khẩu không chính xác! Vui lòng thử lại.')
      inputRef.current?.focus()
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError(null)
    if (onClose) {
      onClose()
    } else {
      navigate('/student/dashboard')
    }
  }

  const content = (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5 animate-reveal relative font-sans">
      
      {/* Nút đóng góc phải (khi ở chế độ modal) */}
      {!isGateMode && onClose && (
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* HEADER BẢO MẬT */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3 h-3" />
            Bảo Mật Quản Trị KHKT 2026
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Xác Thực Quyền Quản Trị Viên
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Khu vực chỉ dành cho Ban Cố Vấn & Giáo Viên Phụ Trách Nghiên Cứu SocraCareer
          </p>
        </div>
      </div>

      {/* CẢNH BÁO PHÂN QUYỀN */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-300 font-semibold">Chống truy cập ngoài ý muốn:</strong> Học sinh và người trải nghiệm tự do vui lòng quay lại Cổng Học Sinh để hoàn thành tiến trình phản tư.
        </p>
      </div>

      {/* FORM NHẬP MẬT KHẨU */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="adminPasswordInput">
            Mật khẩu quản trị viên:
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              id="adminPasswordInput"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Nhập mật khẩu quản trị..."
              className={`w-full bg-slate-950 border rounded-xl pl-3 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition font-mono ${
                error
                  ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/30'
                  : 'border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1"
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* THÔNG BÁO LỖI */}
          {error && (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium mt-2 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* NÚT THAO TÁC */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>XÁC NHẬN MẬT KHẨU & VÀO ADMIN</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition border border-slate-700/80 flex items-center justify-center gap-2 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <span>Quay lại Cổng Học Sinh</span>
          </button>
        </div>

        {/* GỢI Ý KÍN DÀNH CHO GIÁO VIÊN */}
        <div className="pt-2 text-center">
          {!showTeacherHint ? (
            <button
              type="button"
              onClick={() => setShowTeacherHint(true)}
              className="text-[10px] text-slate-500 hover:text-slate-400 transition cursor-pointer underline decoration-dotted"
            >
              Quên mật khẩu hoặc cần hỗ trợ?
            </button>
          ) : (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10.5px] text-slate-400 space-y-1 animate-reveal">
              <p>Mật khẩu mặc định hệ thống KHKT: <code className="text-amber-300 font-bold px-1 bg-amber-950/40 rounded">123456</code> hoặc <code className="text-amber-300 font-bold px-1 bg-amber-950/40 rounded">admin2026</code></p>
              <p className="text-[10px] text-slate-500 italic">*Chỉ cung cấp mã này cho Giáo viên hướng dẫn hoặc Giám khảo nghiệm thu.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  )

  // Nếu ở chế độ Gate (Route bảo vệ): Bọc trong màn hình tối toàn phần
  if (isGateMode) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full flex justify-center">
          {content}
        </div>
      </div>
    )
  }

  // Nếu ở chế độ Modal: Bọc trong backdrop blur
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-reveal">
      {content}
    </div>
  )
}

export default AdminPasswordModal
