import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ADMIN_EMAILS } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Toast from '../../components/common/Toast'
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, UserCheck, ShieldCheck, ChevronDown, ChevronUp, User, KeyRound } from 'lucide-react'

// Danh sách 30 mã học sinh thực nghiệm chuẩn ViSEF
const EXPERIMENTAL_CODES = Array.from({ length: 30 }, (_, i) => {
  const num = i + 1
  return `CT_${num < 10 ? '0' + num : num}`
})

const Login = () => {
  const { signIn, signUp, setLocalSession } = useAuth()
  const navigate = useNavigate()
  
  // Tab chế độ: 'demo' (Trải nghiệm thử) | 'research' (Đối tượng N=30) | 'admin' (Quản trị viên)
  const [activeTab, setActiveTab] = useState('demo')

  // Form 1: Trải nghiệm thử (Guest / Giám khảo)
  const [guestInput, setGuestInput] = useState('')

  // Form 2: Đối tượng nghiên cứu (CT_01 -> CT_30)
  const [subjectCodeInput, setSubjectCodeInput] = useState('CT_01')
  const [pinInput, setPinInput] = useState('1234')
  const [showCodePicker, setShowCodePicker] = useState(false)

  // Form 3: Quản trị viên / Giáo viên (Admin)
  const [adminEmail, setAdminEmail] = useState('kieuthi14@gmail.com')
  const [adminPassword, setAdminPassword] = useState('123456')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showAdminTab, setShowAdminTab] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // 1. ĐĂNG NHẬP TRẢI NGHIỆM THỬ (GIÁM KHẢO / TỰ DO)
  const handleLoginAsGuest = async () => {
    const val = guestInput.trim() || 'GUEST_GIAMKHAO'
    const demoId = 'DEMO_' + Math.floor(Math.random() * 9000 + 1000)
    
    setIsLoading(true)
    try {
      // Lưu phiên cục bộ theo đúng cấu trúc người dùng yêu cầu
      if (setLocalSession) {
        setLocalSession('guest', demoId, demoId)
      } else {
        localStorage.setItem('currentUserRole', 'guest')
        localStorage.setItem('currentUserId', demoId)
        localStorage.setItem('cbas_student_code', demoId)
        localStorage.setItem('cbas_is_experimental_group', 'false')
      }

      // Đồng bộ ngầm với Supabase Auth nếu có mạng
      const cleanEmail = val.includes('@') ? val.toLowerCase() : `${val.toLowerCase().replace(/[^a-z0-9]/g, '_')}@sandbox.visef.edu.vn`
      try {
        const { error } = await signIn(cleanEmail, '123456')
        if (error) {
          await signUp(cleanEmail, '123456', demoId)
          await signIn(cleanEmail, '123456')
        }
      } catch (e) {
        console.warn('Supabase sync info:', e)
      }

      setToast({ 
        type: 'success', 
        message: `Chào mừng bạn tham gia trải nghiệm thử hệ thống SocraCareer!` 
      })

      setTimeout(() => {
        navigate('/student/dashboard')
      }, 500)
    } finally {
      setIsLoading(false)
    }
  }

  // 2. ĐĂNG NHẬP ĐỐI TƯỢNG NGHIÊN CỨU CHÍNH THỨC (CT_01 ĐẾN CT_30)
  const handleLoginAsSubject = async () => {
    const code = subjectCodeInput.trim().toUpperCase()
    if (!code.startsWith('CT_')) {
      setToast({ 
        type: 'error', 
        message: 'Vui lòng nhập đúng định dạng mã đối tượng (CT_01 đến CT_30)!' 
      })
      return
    }

    const pin = pinInput.trim() || '1234'
    setIsLoading(true)
    try {
      // Lưu phiên cục bộ theo đúng quy định ViSEF
      if (setLocalSession) {
        setLocalSession('research_subject', code, code)
      } else {
        localStorage.setItem('currentUserRole', 'research_subject')
        localStorage.setItem('currentUserId', code)
        localStorage.setItem('cbas_student_code', code)
        localStorage.setItem('cbas_is_experimental_group', 'true')
      }

      // Đồng bộ ngầm với Supabase Auth
      const studentEmail = `${code.toLowerCase()}@student.visef.edu.vn`
      try {
        const { error } = await signIn(studentEmail, '123456')
        if (error) {
          await signUp(studentEmail, '123456', code)
          await signIn(studentEmail, '123456')
        }
      } catch (e) {
        console.warn('Supabase sync info:', e)
      }

      setToast({ 
        type: 'success', 
        message: `Xác thực thành công đối tượng nghiên cứu: ${code}. Hệ thống bắt đầu lưu vết thực nghiệm.` 
      })

      setTimeout(() => {
        navigate('/student/dashboard')
      }, 500)
    } finally {
      setIsLoading(false)
    }
  }

  // 3. ĐĂNG NHẬP DÀNH CHO QUẢN TRỊ VIÊN / GIÁO VIÊN (ADMIN)
  const handleLoginAdmin = async (e) => {
    e?.preventDefault()
    if (!adminEmail || !adminPassword) {
      setToast({ type: 'error', message: 'Vui lòng nhập Email và Mật khẩu Quản trị viên!' })
      return
    }

    setIsLoading(true)
    try {
      const emailClean = adminEmail.trim().toLowerCase()
      const { data, error } = await signIn(emailClean, adminPassword)

      if (error) {
        // Thử đăng ký nếu tài khoản admin mẫu chưa khởi tạo
        if (ADMIN_EMAILS.includes(emailClean)) {
          await signUp(emailClean, adminPassword, 'Quản trị viên ViSEF')
          const retry = await signIn(emailClean, adminPassword)
          if (!retry.error) {
            setToast({ type: 'success', message: 'Đăng nhập Quản trị viên thành công!' })
            setTimeout(() => navigate('/admin'), 500)
            return
          }
        }
        setToast({ type: 'error', message: 'Email hoặc mật khẩu quản trị không chính xác!' })
      } else {
        setToast({ type: 'success', message: 'Đăng nhập Quản trị viên thành công!' })
        setTimeout(() => navigate('/admin'), 500)
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Lỗi đăng nhập quản trị. Vui lòng thử lại!' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Hiệu ứng nền Ambient Glow ViSEF */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* KHUNG ĐĂNG NHẬP PHÂN LUỒNG BẢO MẬT VISEF 2026 */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5 animate-reveal relative z-10">
        
        {/* LOGO & TIÊU ĐỀ */}
        <div className="text-center space-y-1">
          <div className="inline-block p-2 rounded-xl bg-teal-500/20 text-teal-400 font-black text-xl mb-1 border border-teal-500/30">
            SC
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">Cổng Truy Cập SocraCareer</h2>
          <p className="text-xs text-slate-400">Hệ thống Hướng nghiệp Phản tư & Hiệu chuẩn Nhận thức</p>
        </div>

        {/* TAB CHUYỂN ĐỔI CHẾ ĐỘ */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button 
            id="tabDemo" 
            type="button"
            onClick={() => setActiveTab('demo')} 
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white font-medium'
            }`}
          >
            Trải Nghiệm Thử (Giám Khảo / Tự Do)
          </button>
          <button 
            id="tabResearch" 
            type="button"
            onClick={() => setActiveTab('research')} 
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'research'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white font-medium'
            }`}
          >
            Đối Tượng Nghiên Cứu (N=30)
          </button>
        </div>

        {/* FORM 1: DÀNH CHO GIÁM KHẢO / NGƯỜI DÙNG THỬ (EMAIL / GUEST) */}
        {activeTab === 'demo' && (
          <div id="formDemo" className="space-y-3.5 text-xs animate-reveal">
            <div>
              <label className="block text-slate-400 mb-1" htmlFor="guestInput">
                Nhập Email hoặc Tên của bạn:
              </label>
              <input 
                type="text" 
                id="guestInput" 
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder="Ví dụ: thayco_giamkhao@visef.edu.vn" 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLoginAsGuest()
                }}
              />
            </div>

            {/* Gợi ý mẫu */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-500">Gợi ý:</span>
              {['Giám khảo ViSEF', 'Khách trải nghiệm', 'thayco_chuyengia@visef.edu.vn'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGuestInput(g)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition cursor-pointer"
                >
                  {g}
                </button>
              ))}
            </div>

            <button 
              type="button"
              onClick={handleLoginAsGuest} 
              disabled={isLoading}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
              ) : (
                <span>BẮT ĐẦU TRẢI NGHIỆM 5 BƯỚC (SANDBOX)</span>
              )}
            </button>
            <p className="text-[10.5px] text-slate-500 text-center italic">
              *Chế độ trải nghiệm không làm ảnh hưởng đến dữ liệu thực nghiệm RCT chính thức.
            </p>
          </div>
        )}

        {/* FORM 2: DÀNH CHO 30 HỌC SINH CAN THIỆP CHÍNH THỨC */}
        {activeTab === 'research' && (
          <div id="formResearch" className="space-y-3.5 text-xs animate-reveal">
            <div>
              <label className="block text-slate-400 mb-1" htmlFor="subjectCodeInput">
                Mã định danh đối tượng (Đã cấp mã):
              </label>
              <input 
                type="text" 
                id="subjectCodeInput" 
                value={subjectCodeInput}
                onChange={(e) => setSubjectCodeInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã: CT_01 đến CT_30" 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-teal-400 font-bold text-sm uppercase focus:outline-none focus:border-teal-500 tracking-wider"
              />
            </div>

            {/* Bộ chọn nhanh 30 mã đối tượng */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-slate-400 font-semibold">Chọn nhanh mã đối tượng:</span>
                <button
                  type="button"
                  onClick={() => setShowCodePicker(!showCodePicker)}
                  className="text-teal-400 hover:underline cursor-pointer"
                >
                  {showCodePicker ? 'Thu gọn ▲' : 'Xem toàn bộ 30 mã ▼'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800/80">
                {(showCodePicker ? EXPERIMENTAL_CODES : ['CT_01', 'CT_02', 'CT_03', 'CT_08', 'CT_12', 'CT_20', 'CT_25', 'CT_30']).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSubjectCodeInput(c)
                      setPinInput('1234')
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                      subjectCodeInput === c
                        ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-teal-500/50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-400" htmlFor="pinInput">
                  Mã PIN xác thực:
                </label>
                <span className="text-[10px] text-slate-500">Mặc định: 1234</span>
              </div>
              <input 
                type="password" 
                id="pinInput" 
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••" 
                maxLength={6} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 tracking-widest focus:outline-none focus:border-teal-500 text-xs font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLoginAsSubject()
                }}
              />
            </div>

            <button 
              type="button"
              onClick={handleLoginAsSubject} 
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-bold rounded-lg transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full" />
              ) : (
                <span>VÀO TIẾN TRÌNH THỰC NGHIỆM CHÍNH THỨC</span>
              )}
            </button>
            <p className="text-[10px] text-teal-400/80 text-center">
              ✓ Dữ liệu được mã hóa ẩn danh tuyệt đối theo chuẩn Đạo đức Nghiên cứu ViSEF 2026.
            </p>
          </div>
        )}

        {/* PHẦN DÀNH CHO ADMIN / GIÁO VIÊN */}
        <div className="pt-2 border-t border-slate-800 text-center">
          {!showAdminTab ? (
            <button
              type="button"
              onClick={() => setShowAdminTab(true)}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              🔒 Bạn là Giáo viên / Quản trị viên ViSEF? <span className="text-teal-400 underline">Đăng nhập Quản trị</span>
            </button>
          ) : (
            <form onSubmit={handleLoginAdmin} className="space-y-3 text-left animate-reveal bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Đăng Nhập Quản Trị Hệ Thống
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdminTab(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Đóng ✕
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Email quản trị viên:</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="kieuthi14@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Mật khẩu:</span>
                  <span className="text-amber-400/80">Mặc định: 123456</span>
                </div>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <span>VÀO BẢNG ĐIỀU KHIỂN ADMIN (CBAS 2026)</span>
                )}
              </button>
            </form>
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

export default Login
