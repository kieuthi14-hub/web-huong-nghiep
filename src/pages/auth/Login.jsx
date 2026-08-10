import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setToast({ type: 'error', message: 'Vui lòng điền đầy đủ email và mật khẩu!' })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await signIn(email, password)
      if (error) {
        setToast({ type: 'error', message: error.message || 'Email hoặc mật khẩu không chính xác!' })
      } else {
        setToast({ type: 'success', message: 'Đăng nhập thành công!' })
        // Cần lấy profile ngay lập tức để định hướng trang. 
        // Tuy nhiên, AuthContext của ta tự lấy profile và trigger cập nhật.
        // Để đảm bảo hướng trang mượt, chúng ta lấy role từ profiles tương ứng qua fetch
        const { data: profileData } = await signIn(email, password) // Supabase trả về user trong session
        
        // Ta redirect sau 1 giây
        setTimeout(async () => {
          const { data: { user } } = await signIn(email, password)
          // Lấy profile tương ứng của user
          const { data: profile } = await signIn(email, password) // Hoặc đọc từ response data
          // Sử dụng hàm gián tiếp hoặc để AuthContext tự xử lý và App.jsx tự động redirect
          // Ở đây ta cứ redirect về trang chủ '/' và hệ thống Route sẽ tự động đẩy về trang đúng vai trò.
          navigate('/')
        }, 1000)
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Có lỗi xảy ra, vui lòng thử lại!' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch font-sans animate-reveal">
      {/* Cột trái: Panel giới thiệu bất đối xứng */}
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
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Career Guidance</span>
            <span className="text-3xl">🎓</span>
          </span>
        </div>

        {/* Big Slogan */}
        <div className="relative z-10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-300">Định hướng tương lai</span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Khám phá bản thân,<br />
            chọn đúng ngành học,<br />
            chạm tới khát vọng.
          </h1>
          <p className="text-sm text-slate-300 max-w-md font-medium leading-relaxed">
            Hệ thống hỗ trợ hướng nghiệp chuyên sâu sử dụng trắc nghiệm chuẩn quốc tế Holland & MBTI giúp học sinh THPT kiến tạo lộ trình học tập tối ưu.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-brand-300">
          <p>© 2026 Career Guidance Platform</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Điều khoản</a>
            <a href="#" className="hover:underline">Bảo mật</a>
          </div>
        </div>
      </div>

      {/* Cột phải: Form Đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <span className="text-2xl">🎓</span>
              <span className="text-lg font-bold text-brand-700">Career Guidance</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Chào mừng Thầy Cô và các bạn học sinh</h2>
            <p className="text-sm text-slate-500 mt-1">Đăng nhập tài khoản để bắt đầu trải nghiệm</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-xs font-semibold text-brand-600 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
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
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-3 text-sm font-bold tracking-wide uppercase gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-sm"
            >
              Đăng nhập
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Chưa có tài khoản học sinh?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
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

export default Login
