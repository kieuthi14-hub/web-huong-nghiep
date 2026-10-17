import React, { useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, ADMIN_EMAILS } from '../../context/AuthContext'
import AdminPasswordModal from '../admin/AdminPasswordModal'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Brain, 
  Sparkles, 
  GraduationCap, 
  School, 
  Milestone, 
  CalendarDays, 
  Settings, 
  UserSquare2, 
  ChevronRight, 
  BarChart3, 
  Lock,
  AlertTriangle
} from 'lucide-react'
import { getInterventionProgress, isStepUnlocked, getStepLockReason } from '../../utils/interventionProgress'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, displayName, studentCode, isAdminVerified } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [sidebarNotice, setSidebarNotice] = useState(null)

  const userEmail = (user?.email || profile?.email || '').toLowerCase().trim()
  const userRole = profile?.role || user?.user_metadata?.role || 'student'
  
  // Quyền Admin: Kiểm tra whitelist email giáo viên hoặc role admin/teacher
  const isTeacherAdmin = Boolean(ADMIN_EMAILS && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) || profile?.role === 'admin' || profile?.role === 'teacher' || user?.user_metadata?.role === 'admin'
  const isInAdminView = location.pathname.startsWith('/admin')

  const progress = getInterventionProgress()

  const studentLinks = [
    { to: '/student/dashboard', label: '📊 Tổng quan Lộ trình', icon: <LayoutDashboard className="w-4 h-4 text-sky-400" /> },
    { step: 1, to: '/student/holland', label: '1️⃣ Trắc nghiệm RIASEC & Mỏ neo', icon: <ClipboardList className="w-4 h-4 text-emerald-400" /> },
    { step: 2, to: '/student/debias-agent', label: '2️⃣ AI Tham vấn Phản tư Socrates', icon: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> },
    { step: 3, to: '/student/fact-check', label: '3️⃣ Đối chứng Dữ liệu Tuyển sinh', icon: <GraduationCap className="w-4 h-4 text-blue-400" /> },
    { step: 4, to: '/student/booking', label: '4️⃣ Tham vấn 1-1 Thực tế (Mentor)', icon: <CalendarDays className="w-4 h-4 text-violet-400" /> },
    { step: 5, to: '/student/reflection', label: '5️⃣ Kế hoạch Hành động & Thang đo T2', icon: <Brain className="w-4 h-4 text-teal-400" /> },
  ]


  const counselorLinks = [
    { to: '/counselor/dashboard', label: 'Quản lý Tư vấn', icon: <UserSquare2 className="w-4 h-4" /> },
  ]

  const adminLinks = [
    { to: '/admin/dashboard', label: '⚙️ Bảng Quản trị KHKT (SocraCareer)', icon: <Settings className="w-4 h-4 text-amber-400" /> },
    { to: '/admin/experiment', label: '📊 Báo Cáo Nhóm Can Thiệp (N=30)', icon: <BarChart3 className="w-4 h-4 text-indigo-400" /> },
    { to: '/admin/reflections', label: '📝 Nhật Ký Phản Tư (Socrates)', icon: <Brain className="w-4 h-4 text-emerald-400" /> },
    { to: '/admin/counseling', label: '📅 Duyệt Lịch Tư vấn 1-1', icon: <CalendarDays className="w-4 h-4 text-violet-400" /> },
  ]

  const getLinksByRole = () => {
    // 1. Khi đang ở Cổng Quản trị Admin: CHỈ hiển thị danh mục của Admin
    if (isInAdminView) {
      return adminLinks
    }
    // 2. Khi là Chuyên viên tư vấn:
    if (userRole === 'counselor' || userRole === 'teacher') return counselorLinks
    // 3. Mặc định ở Cổng Học sinh: CHỈ hiển thị đúng 7 bước học sinh (Tuyệt đối không lẫn mục Admin!)
    return studentLinks
  }

  const links = getLinksByRole()

  const linkActiveStyle = 'flex items-center gap-3 px-4 py-2.5 bg-brand-800 text-white text-sm font-medium border-l-2 border-accent-400 transition-all'
  const linkInactiveStyle = 'flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium border-l-2 border-transparent transition-all'

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        no-print fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800
        transition-transform duration-300 md:translate-x-0 md:static md:h-[calc(100vh-4rem)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header for Mobile */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 md:hidden bg-slate-950">
          <span className="text-lg font-bold text-brand-400 flex items-center gap-1.5">
            <span>Career Guidance</span>
            <span className="text-xl">🎓</span>
          </span>
          <button 
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-slate-800 text-slate-400 focus:outline-none"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-slate-800 flex items-center justify-center text-brand-400 border border-slate-700">
              <span className="font-bold text-sm uppercase">
                {(displayName || profile?.full_name || 'CT').substring(0, 2)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none mb-1">
                {displayName || profile?.full_name || 'Học sinh'}
              </p>
              {isTeacherAdmin ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    if (isAdminVerified) {
                      if (onClose) onClose()
                      navigate('/admin/dashboard')
                    } else {
                      setIsAdminModalOpen(true)
                    }
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase hover:bg-amber-900 transition-colors cursor-pointer"
                  title="Tài khoản Quản trị viên (Bấm để vào Bảng Admin - Yêu cầu mật khẩu)"
                >
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span>ADMIN ⚙️</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-800 uppercase">
                  🛡️ {studentCode || 'CT_01'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {links.map((link, idx) => {
            // Kiểm tra trạng thái khóa nếu là liên kết bước học sinh
            const isStepLink = typeof link.step === 'number'
            const isUnlocked = !isStepLink || isTeacherAdmin || isStepUnlocked(link.step, progress)

            if (!isUnlocked) {
              return (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => {
                    const lockInfo = getStepLockReason(link.step, progress)
                    setSidebarNotice(lockInfo?.message || `Bước ${link.step} chưa mở khóa! Em cần hoàn thành Bước ${link.step - 1} trước theo đúng quy chuẩn can thiệp KHKT.`)
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-slate-500 text-sm font-medium border-l-2 border-transparent cursor-not-allowed opacity-55 hover:opacity-85 hover:bg-slate-800/40 transition-all text-left group"
                  title={`Chưa mở khóa - Cần hoàn thành Bước ${link.step - 1} trước`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="opacity-50 grayscale">{link.icon}</span>
                    <span className="truncate text-slate-400 group-hover:text-slate-300">{link.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400/90 bg-amber-950/70 border border-amber-800/70 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ml-1">
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span>Khóa</span>
                  </span>
                </button>
              )
            }

            return (
              <NavLink 
                key={idx} 
                to={link.to}
                className={({ isActive }) => isActive ? linkActiveStyle : linkInactiveStyle}
                onClick={onClose}
              >
                {link.icon}
                <span className="truncate">{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Thông báo nếu bấm vào mục bị khóa trong sidebar */}
        {sidebarNotice && (
          <div className="mx-3 mb-3 p-3 bg-amber-950/90 border border-amber-700/80 rounded-xl text-xs text-amber-200 animate-reveal relative shadow-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-amber-300 block mb-0.5">Yêu cầu tuần tự:</span>
                <p className="text-[11px] leading-relaxed text-amber-200/90">{sidebarNotice}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarNotice(null)}
              className="absolute top-2 right-2 text-amber-400 hover:text-white p-0.5 text-xs font-bold cursor-pointer"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        )}

        {/* Nút chuyển đổi giao diện linh hoạt giữa Cổng Học Sinh và Bảng Quản Trị Admin */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          {isInAdminView ? (
            <Link
              to="/student/dashboard"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md bg-teal-500 hover:bg-teal-400 text-slate-950 text-center"
            >
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>🎓 Xem Cổng Học Sinh</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                if (isAdminVerified) {
                  if (onClose) onClose()
                  navigate('/admin/dashboard')
                } else {
                  setIsAdminModalOpen(true)
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 hover:border-teal-500/50 text-center cursor-pointer"
              title="Mở Bảng Quản Trị CBAS (Yêu cầu mật khẩu)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>⚙️ Bảng Quản Trị CBAS (Admin)</span>
            </button>
          )}
        </div>

        {/* Modal Nhập Mật Khẩu Quản Trị Viên */}
        <AdminPasswordModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onSuccess={() => {
            setIsAdminModalOpen(false)
            if (onClose) onClose()
            navigate('/admin/dashboard')
          }}
        />

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Career Guidance v1.0.0
          </p>
          <p className="text-[10px] text-slate-600">
            Hệ thống Hướng nghiệp Học sinh
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
