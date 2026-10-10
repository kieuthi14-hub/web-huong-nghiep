import React from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useAuth, ADMIN_EMAILS } from '../../context/AuthContext'
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
  ChevronRight
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, displayName, studentCode } = useAuth()

  const userEmail = (user?.email || profile?.email || '').toLowerCase().trim()
  const userRole = profile?.role || user?.user_metadata?.role || 'student'
  
  // Quyền Admin: Kiểm tra whitelist email giáo viên hoặc role admin/teacher
  const isTeacherAdmin = Boolean(ADMIN_EMAILS && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) || profile?.role === 'admin' || profile?.role === 'teacher' || user?.user_metadata?.role === 'admin'
  const isInAdminView = location.pathname.startsWith('/admin')

  const studentLinks = [
    { to: '/student/dashboard', label: '📊 Tổng quan Lộ trình', icon: <LayoutDashboard className="w-4 h-4 text-sky-400" /> },
    { to: '/student/holland', label: '1️⃣ Trắc nghiệm Thiên hướng (RIASEC)', icon: <ClipboardList className="w-4 h-4 text-emerald-400" /> },
    { to: '/student/debias-agent', label: '2️⃣ AI Tham vấn Phản tư Socrates', icon: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> },
    { to: '/student/fact-check', label: '3️⃣ Đối chứng Dữ liệu Tuyển sinh', icon: <GraduationCap className="w-4 h-4 text-blue-400" /> },
    { to: '/student/booking', label: '4️⃣ Tham vấn 1-1 Thực tế (Mentor)', icon: <CalendarDays className="w-4 h-4 text-violet-400" /> },
    { to: '/student/reflection', label: '5️⃣ Kế hoạch Hành động & Tam giác NV', icon: <Brain className="w-4 h-4 text-teal-400" /> },
  ]

  const counselorLinks = [
    { to: '/counselor/dashboard', label: 'Quản lý Tư vấn', icon: <UserSquare2 className="w-4 h-4" /> },
  ]

  const adminLinks = [
    { to: '/admin/dashboard', label: '⚙️ Bảng Quản trị ViSEF', icon: <Settings className="w-4 h-4 text-amber-400" /> },
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
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800
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
                <Link
                  to="/admin/dashboard"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase hover:bg-amber-900 transition-colors cursor-pointer"
                  title="Tài khoản Quản trị viên (Bấm để vào Bảng Admin)"
                >
                  ADMIN ⚙️
                </Link>
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
          {links.map((link, idx) => (
            <NavLink 
              key={idx} 
              to={link.to}
              className={({ isActive }) => isActive ? linkActiveStyle : linkInactiveStyle}
              onClick={onClose}
            >
              {link.icon}
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Nút chuyển đổi giao diện dành cho Thầy Cô - CHỈ HIỂN THỊ KHI ĐANG Ở GIAO DIỆN ADMIN */}
        {isTeacherAdmin && isInAdminView && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <Link
              to="/student/dashboard"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm text-xs font-bold transition-all shadow-md bg-sky-600 hover:bg-sky-500 text-white border border-sky-400 text-left group"
            >
              <GraduationCap className="w-4 h-4 text-white flex-shrink-0" />
              <span className="truncate">🎓 Xem Cổng Học Sinh</span>
            </Link>
          </div>
        )}

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
