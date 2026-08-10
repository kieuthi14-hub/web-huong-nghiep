import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User, Menu } from 'lucide-react'

const Navbar = ({ onToggleSidebar }) => {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  const roleLabels = {
    admin: 'Quản trị viên',
    counselor: 'Chuyên viên tư vấn',
    student: 'Học sinh'
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-1 rounded-sm hover:bg-slate-100 text-slate-600 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-brand-700 flex items-center gap-1.5">
            <span>Career Guidance</span>
            <span className="text-2xl">🎓</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {profile.full_name || 'Học sinh'}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {roleLabels[profile.role] || 'Thành viên'}
              </p>
            </div>
            
            <div className="w-9 h-9 rounded-sm bg-brand-100 flex items-center justify-center text-brand-700 border border-brand-200">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name} 
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
