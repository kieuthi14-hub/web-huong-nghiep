import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, ADMIN_EMAILS } from '../../context/AuthContext'
import { LogOut, User, Menu, ShieldCheck, X } from 'lucide-react'

const Navbar = ({ onToggleSidebar }) => {
  const { profile, signOut, displayName, studentCode, updateStudentCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCodeInput, setNewCodeInput] = useState('')

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

  const userEmail = (profile?.email || '').toLowerCase().trim()
  const isTeacherAdmin = Boolean(ADMIN_EMAILS && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail))
  const isInAdminView = location.pathname.startsWith('/admin')

  const handleSaveCode = async (e) => {
    e.preventDefault()
    if (!newCodeInput.trim()) return
    await updateStudentCode(newCodeInput.trim().toUpperCase())
    setIsModalOpen(false)
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

      <div className="flex items-center gap-3">
        {/* Nút chuyển đổi giao diện linh hoạt giữa Admin và Học sinh */}
        {isInAdminView ? (
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Chuyển sang xem giao diện học sinh"
          >
            <span>🎓 Xem Cổng Học Sinh</span>
          </Link>
        ) : (
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold text-xs shadow-sm transition-all border border-slate-700 hover:border-teal-500/50 cursor-pointer"
            title="Mở Bảng Quản Trị Thực Nghiệm CBAS 2026"
          >
            <span>⚙️ Bảng Quản Trị (Admin)</span>
          </Link>
        )}

        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {displayName || profile.full_name || 'Học sinh'}
                </p>
                {!isTeacherAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewCodeInput(studentCode || 'CT_01')
                      setIsModalOpen(true)
                    }}
                    className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
                    title="Bấm để đổi mã định danh ẩn danh (CT_01, CT_02...)"
                  >
                    ✎ Đổi mã
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center justify-end gap-1">
                {!isTeacherAdmin && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    🛡️ Ẩn danh ViSEF
                  </span>
                )}
                <span>{roleLabels[profile.role] || 'Thành viên'}</span>
              </p>
            </div>
            
            <div className="w-9 h-9 rounded-sm bg-brand-100 flex items-center justify-center text-brand-700 border border-brand-200 font-extrabold text-xs uppercase">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={displayName} 
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <span>{(displayName || 'CT').substring(0, 2)}</span>
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

      {/* Modal Đổi Mã Ẩn Danh ViSEF */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-reveal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>MÃ HÓA DANH TÍNH HỌC SINH</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Theo chuẩn Đạo đức Nghiên cứu ViSEF 2026, hệ thống hiển thị mã định danh (VD: <strong className="text-indigo-600">CT_01</strong>) thay vì email cá nhân để ẩn danh hóa hoàn toàn dữ liệu.
            </p>

            <form onSubmit={handleSaveCode} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="studentCodeModal">
                  Mã học sinh của em:
                </label>
                <input
                  id="studentCodeModal"
                  type="text"
                  required
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none rounded-xl font-black text-indigo-950 tracking-wider"
                  placeholder="VD: CT_01, CT_08..."
                />
              </div>

              {/* Gợi ý 1 số mã nhanh */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500">Mã nhanh:</span>
                {['CT_01', 'CT_02', 'CT_03', 'CT_05', 'CT_08', 'CT_10', 'CT_15', 'CT_20'].map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setNewCodeInput(code)}
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      newCodeInput === code
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer"
                >
                  Xác Nhận & Lưu Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
