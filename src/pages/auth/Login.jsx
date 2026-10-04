import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, UserCheck, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'

// Danh sách 30 mã học sinh thực nghiệm chuẩn ViSEF
const EXPERIMENTAL_CODES = Array.from({ length: 30 }, (_, i) => {
  const num = i + 1
  return `CT_${num < 10 ? '0' + num : num}`
})

const Login = () => {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showQuickSelect, setShowQuickSelect] = useState(false)

  // Hàm chuẩn hóa thông tin đăng nhập: Tên CT_01 -> CT_30, Tên thử nghiệm khác hoặc Email
  const normalizeCredentials = (input, pwd) => {
    const raw = (input || '').trim()
    const rawPwd = (pwd || '').trim()

    // 1. Kiểm tra mã học sinh thực nghiệm: CT_01 đến CT_30 (chấp nhận ct01, CT_1, ct-02,...)
    const ctMatch = raw.match(/^ct[_\-]?(\d{1,2})$/i)
    if (ctMatch) {
      const num = parseInt(ctMatch[1], 10)
      if (num >= 1 && num <= 30) {
        const code = `CT_${num < 10 ? '0' + num : num}`
        const email = `ct_${num < 10 ? '0' + num : num}@student.visef.edu.vn`
        return {
          email,
          password: rawPwd || '123456',
          studentCode: code,
          isExperimental: true
        }
      }
    }

    // 2. Nếu người dùng nhập địa chỉ email có @ (VD: kieuthi14@gmail.com)
    if (raw.includes('@')) {
      return {
        email: raw.toLowerCase(),
        password: rawPwd,
        studentCode: null,
        isExperimental: false
      }
    }

    // 3. Nếu người dùng nhập tên khác để thử web (VD: 'thunghiem_01', 'guest', 'lan_anh')
    const cleanName = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    const code = raw.toUpperCase()
    return {
      email: `${cleanName || 'student_test'}@student.visef.edu.vn`,
      password: rawPwd || '123456',
      studentCode: code,
      isExperimental: false
    }
  }

  const handlePerformLogin = async (rawId, rawPwd) => {
    if (!rawId) {
      setToast({ type: 'error', message: 'Vui lòng nhập mã học sinh (CT_01 - CT_30), tên đăng nhập hoặc email!' })
      return
    }

    const { email, password: finalPassword, studentCode, isExperimental } = normalizeCredentials(rawId, rawPwd)

    if (!finalPassword) {
      setToast({ type: 'error', message: 'Vui lòng nhập mật khẩu (Mật khẩu mặc định là 123456)!' })
      return
    }

    setIsLoading(true)
    try {
      // 1. Thử đăng nhập bình thường
      let { data, error } = await signIn(email, finalPassword)

      // 2. Nếu tài khoản chưa tồn tại trên Supabase Auth (tài khoản thử nghiệm mới):
      if (error && (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed'))) {
        // Tự động khởi tạo tài khoản mới ngay lập tức
        const defaultCode = studentCode || 'Học sinh thử nghiệm'
        const { error: signUpError } = await signUp(email, finalPassword, defaultCode)

        if (!signUpError) {
          // Đăng ký xong -> Đăng nhập lại ngay lập tức
          const retryRes = await signIn(email, finalPassword)
          data = retryRes.data
          error = retryRes.error
        } else if (signUpError.message?.includes('already registered')) {
          // Thử lại với mật khẩu mặc định 123456 nếu tài khoản mẫu đã tạo trước
          const retryDefault = await signIn(email, '123456')
          data = retryDefault.data
          error = retryDefault.error
        }
      }

      if (error) {
        setToast({ 
          type: 'error', 
          message: error.message?.includes('Invalid login credentials') 
            ? 'Thông tin đăng nhập không chính xác. Với mã CT_01 - CT_30, mật khẩu mặc định là 123456!' 
            : (error.message || 'Lỗi đăng nhập!')
        })
      } else {
        // Lưu thông tin ẩn danh mã học sinh vào localStorage
        if (studentCode) {
          localStorage.setItem('cbas_student_code', studentCode)
        }
        localStorage.setItem('cbas_is_experimental_group', isExperimental ? 'true' : 'false')

        setToast({ 
          type: 'success', 
          message: isExperimental 
            ? `🎉 Đăng nhập thành công học sinh thực nghiệm ${studentCode}!` 
            : '🎉 Đăng nhập hệ thống thành công!' 
        })

        setTimeout(() => {
          navigate('/')
        }, 800)
      }
    } catch (err) {
      console.error(err)
      setToast({ type: 'error', message: 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại!' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handlePerformLogin(identifier, password)
  }

  // Bấm nhanh 1 mã học sinh trong danh sách 30 mã
  const handleQuickCodeSelect = (code) => {
    setIdentifier(code)
    setPassword('123456')
    handlePerformLogin(code, '123456')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch font-sans animate-reveal">
      {/* Cột trái: Panel giới thiệu bất đối xứng */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex-col justify-between p-12 relative overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Đề Tài ViSEF 2026 • Phân Ngành CBAS</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            Can thiệp Giảm thiểu<br />
            Thiên lệch Nhận thức<br />
            trong Chọn nghề THPT
          </h1>
          <p className="text-sm text-slate-300 max-w-md font-medium leading-relaxed">
            Hệ thống can thiệp thực nghiệm 5 bước: Khởi tạo mỏ neo ban đầu (T₀), AI Socrates phản biện, đối chứng dữ liệu thực tế và thiết lập Tam giác hành động tự chủ (T₂).
          </p>

          <div className="pt-2 flex items-center gap-3 text-xs text-indigo-200">
            <span className="flex items-center gap-1 font-bold bg-white/10 px-2.5 py-1 rounded-md">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> 30 Học sinh Thực nghiệm (CT_01 - CT_30)
            </span>
            <span className="flex items-center gap-1 font-bold bg-white/10 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Ẩn danh hóa dữ liệu khoa học
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <p>© 2026 ViSEF Behavioral & Social Sciences Project</p>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold">Mã hóa ẩn danh ViSEF</span>
          </div>
        </div>
      </div>

      {/* Cột phải: Form Đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md space-y-6">
          
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="text-lg font-bold text-indigo-700">Career Guidance ViSEF</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đăng Nhập Hệ Thống</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Nhập mã học sinh thực nghiệm (<span className="text-indigo-600 font-bold">CT_01</span> đến <span className="text-indigo-600 font-bold">CT_30</span>), tên thử nghiệm hoặc email.
            </p>
          </div>

          {/* Form chính */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Mã học sinh / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block" htmlFor="identifier">
                Mã học sinh thực nghiệm hoặc Email / Tên thử nghiệm *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all rounded-xl font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                  placeholder="VD: CT_01, CT_02... hoặc tên khác để thử web"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-indigo-600 font-medium">
                  Mặc định: <strong>123456</strong>
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all rounded-xl font-medium"
                  placeholder="•••••••• (để trống sẽ dùng 123456)"
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

            {/* Nút Submit */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-3 text-sm font-extrabold tracking-wide uppercase gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Vào Trải Nghiệm Hệ Thống</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Hộp Chọn Nhanh 30 Mã Học Sinh Thực Nghiệm CT_01 -> CT_30 */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowQuickSelect(!showQuickSelect)}
              className="w-full flex items-center justify-between text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2.5 rounded-xl border border-indigo-200 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ Bấm Chọn Nhanh Mã Học Sinh (CT_01 ➔ CT_30):</span>
              </span>
              {showQuickSelect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showQuickSelect && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-reveal">
                <p className="text-[11px] text-slate-500 font-medium">
                  Bấm vào mã bất kỳ để tự động điền và đăng nhập ngay vào hệ thống:
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {EXPERIMENTAL_CODES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleQuickCodeSelect(code)}
                      className="px-2 py-1.5 text-xs font-black bg-white hover:bg-indigo-600 hover:text-white text-slate-800 border border-slate-200 hover:border-indigo-600 rounded-lg shadow-2xs transition-all text-center cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hộp hướng dẫn ngắn gọn cho người dùng */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600 font-medium leading-relaxed">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <span>💡 Hướng dẫn đăng nhập:</span>
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><strong>Học sinh thực nghiệm:</strong> Nhập mã từ <code>CT_01</code> đến <code>CT_30</code> (Mật khẩu: <code>123456</code>).</li>
              <li><strong>Người dùng thử nghiệm khác:</strong> Nhập bất kỳ tên nào khác để thử web.</li>
              <li><strong>Giáo viên / Quản trị viên:</strong> Đăng nhập bằng email <code>kieuthi14@gmail.com</code>.</li>
            </ul>
          </div>

          <p className="text-center text-xs text-slate-400">
            Hệ thống tự động ẩn danh hóa thông tin theo mã học sinh khi xuất báo cáo.
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
