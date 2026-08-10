import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { Lock, Mail, ArrowRight, User, Eye, EyeOff, CheckCircle } from 'lucide-react'

const Register = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password || !confirmPassword) {
      setToast({ type: 'error', message: 'Vui lòng điền đầy đủ tất cả thông tin!' })
      return
    }

    if (password.length < 6) {
      setToast({ type: 'error', message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' })
      return
    }

    if (password !== confirmPassword) {
      setToast({ type: 'error', message: 'Xác nhận mật khẩu không trùng khớp!' })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await signUp(email, password, fullName)
      if (error) {
        setToast({ type: 'error', message: error.message || 'Lỗi đăng ký tài khoản!' })
      } else {
        setIsSuccess(true)
        setToast({ type: 'success', message: 'Đăng ký tài khoản học sinh thành công!' })
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Có lỗi xảy ra, vui lòng thử lại!' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch font-sans animate-reveal">
      {/* Cột trái: Panel giới thiệu */}
      <div className="hidden lg:flex w-1/2 bg-brand-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Career Guidance</span>
            <span className="text-3xl">🎓</span>
          </span>
        </Link>

        {/* Info */}
        <div className="relative z-10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-300">Gia nhập thế giới hướng nghiệp</span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Khởi đầu hành trình<br />
            xác định tương lai<br />
            ngày hôm nay.
          </h1>
          <p className="text-sm text-slate-300 max-w-md font-medium leading-relaxed">
            Tạo tài khoản học sinh miễn phí để thực hiện trắc nghiệm, lưu trữ các ngành học, trường đại học mục tiêu và lên kế hoạch hành động cụ thể cho bản thân.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-brand-300">
          <p>© 2026 Career Guidance Platform</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Điều khoản</a>
            <a href="#" className="hover:underline">Bảo mật</a>
          </div>
        </div>
      </div>

      {/* Cột phải: Form Đăng ký */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {isSuccess ? (
            <div className="text-center space-y-4 py-8 animate-reveal">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đăng ký thành công!</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tài khoản học sinh của bạn đã được khởi tạo thành công. Vui lòng kiểm tra email để xác nhận (nếu có) hoặc nhấn vào liên kết bên dưới để đăng nhập ngay.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="primary" className="px-6 py-2.5 gap-2 font-bold uppercase text-xs tracking-wider">
                    Chuyển sang Đăng nhập
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="lg:hidden flex items-center gap-2 mb-6">
                  <span className="text-2xl">🎓</span>
                  <span className="text-lg font-bold text-brand-700">Career Guidance</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đăng ký tài khoản học sinh</h2>
                <p className="text-sm text-slate-500 mt-1">Điền đầy đủ thông tin bên dưới để bắt đầu</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4.5">
                  {/* Họ tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="fullName">
                      Họ và tên học sinh
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all rounded-sm font-medium"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="email">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all rounded-sm font-medium"
                        placeholder="student@example.com"
                      />
                    </div>
                  </div>

                  {/* Mật khẩu */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                      Mật khẩu (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all rounded-sm font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="confirmPassword">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all rounded-sm font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full py-3 text-sm font-bold tracking-wide uppercase gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-sm"
                  >
                    Đăng ký tài khoản
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-slate-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-bold text-brand-600 hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
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

export default Register
