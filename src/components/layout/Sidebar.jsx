import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
  const { user, profile } = useAuth()

  const userEmail = (user?.email || profile?.email || '').toLowerCase().trim()
  const userRole = profile?.role || user?.user_metadata?.role || 'student'
  
  // Kiểm tra quyền Admin bảo mật: Chỉ Admin hoặc Email Whitelist kieuthi14@gmail.com
  const isAdmin = userRole === 'admin' || userEmail === 'kieuthi14@gmail.com'

  const studentLinks = [
    { to: '/student/dashboard', label: 'Bảng tổng quan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/student/roadmap', label: 'Lộ trình Hướng nghiệp', icon: <Milestone className="w-4 h-4" /> },
    { to: '/student/holland-test', label: 'Trắc nghiệm Holland', icon: <ClipboardList className="w-4 h-4" /> },
    { to: '/student/debias-matrix', label: 'Bảng Nhìn Lại & Kiểm Tra Chọn Nghề', icon: <Brain className="w-4 h-4" /> },
    { to: '/student/debias-agent', label: '🤖 AI Tham vấn Phản tư', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { to: '/student/majors', label: 'Tra cứu Ngành học', icon: <GraduationCap className="w-4 h-4" /> },
    { to: '/student/universities', label: 'Tra cứu Trường học', icon: <School className="w-4 h-4" /> },
    { to: '/student/booking', label: 'Tư vấn 1-1', icon: <CalendarDays className="w-4 h-4" /> },
  ]

  const counselorLinks = [
    { to: '/counselor/dashboard', label: 'Quản lý Tư vấn', icon: <UserSquare2 className="w-4 h-4" /> },
  ]

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Bảng Quản trị Admin', icon: <Settings className="w-4 h-4" /> },
    { to: '/admin/counseling', label: 'Duyệt Lịch Tư vấn 1-1', icon: <CalendarDays className="w-4 h-4" /> },
  ]

  const getLinksByRole = () => {
    if (isAdmin) return adminLinks
    if (userRole === 'counselor' || userRole === 'teacher') return counselorLinks
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
                {profile?.full_name?.substring(0, 2) || 'HS'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none mb-1">
                {profile?.full_name || 'Học sinh'}
              </p>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-brand-900/60 text-brand-300 border border-brand-800 uppercase">
                {isAdmin ? 'ADMIN' : userRole.toUpperCase()}
              </span>
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

        {/* Nút bấm Admin cố định nổi bật - CHỈ HIỂN THỊ KHI VÀ CHỈ KHI LÀ ADMIN KHÔNG HARDCODE */}
        {isAdmin && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <Link
              to="/admin/dashboard"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm text-xs font-bold transition-all shadow-md bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 text-left group"
            >
              <Settings className="w-4 h-4 text-slate-950 flex-shrink-0 group-hover:rotate-90 transition-transform" />
              <span className="truncate">⚙️ Quản Lý & Báo Cáo Admin</span>
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
