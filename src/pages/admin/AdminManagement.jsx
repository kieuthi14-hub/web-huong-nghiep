import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  Settings, 
  Users, 
  GraduationCap, 
  School, 
  ClipboardList, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  Check, 
  X 
} from 'lucide-react'

const AdminManagement = () => {
  const { user } = useAuth()
  
  // Trạng thái tab hiển thị: 'users' | 'majors' | 'unis'
  const [activeTab, setActiveTab] = useState('users')

  // Dữ liệu chung
  const [profiles, setProfiles] = useState([])
  const [majors, setMajors] = useState([])
  const [unis, setUnis] = useState([])
  const [stats, setStats] = useState({ users: 0, majors: 0, unis: 0, tests: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái modal/form thêm ngành học
  const [showMajorForm, setShowMajorForm] = useState(false)
  const [majorName, setMajorName] = useState('')
  const [majorCode, setMajorCode] = useState('')
  const [majorCategory, setMajorCategory] = useState('Kỹ thuật - Công nghệ')
  const [majorDesc, setMajorDesc] = useState('')
  const [majorSalary, setMajorSalary] = useState('10 - 25 triệu VND')
  const [majorSkills, setMajorSkills] = useState('')
  const [majorProspects, setMajorProspects] = useState('')
  const [majorHolland, setMajorHolland] = useState('')

  // Trạng thái modal/form thêm trường học
  const [showUniForm, setShowUniForm] = useState(false)
  const [uniName, setUniName] = useState('')
  const [uniCode, setUniCode] = useState('')
  const [uniRegion, setUniRegion] = useState('Bắc')
  const [uniWebsite, setUniWebsite] = useState('')
  const [uniTuition, setUniTuition] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. Tải profiles
      const { data: profileList } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
      setProfiles(profileList || [])

      // 2. Tải majors
      const { data: majorList } = await supabase
        .from('majors')
        .select('*')
        .order('name', { ascending: true })
      setMajors(majorList || [])

      // 3. Tải universities
      const { data: uniList } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true })
      setUnis(uniList || [])

      // 4. Đếm số lượng test đã làm
      const { count: testCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })

      setStats({
        users: profileList?.length || 0,
        majors: majorList?.length || 0,
        unis: uniList?.length || 0,
        tests: testCount || 0
      })
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Admin:', error)
      setToast({ type: 'error', message: 'Lỗi tải dữ liệu hệ thống.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Thay đổi quyền (Role) của User
  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
      setToast({ type: 'success', message: 'Cập nhật phân quyền người dùng thành công!' })
    } catch (error) {
      console.error('Lỗi phân quyền:', error)
      setToast({ type: 'error', message: 'Không thể cập nhật phân quyền.' })
    }
  }

  // Thêm ngành học mới
  const handleAddMajor = async (e) => {
    e.preventDefault()
    if (!majorName || !majorCode || !majorDesc) {
      setToast({ type: 'error', message: 'Vui lòng điền các trường bắt buộc!' })
      return
    }

    setIsSubmitting(true)
    try {
      const skillsArray = majorSkills ? majorSkills.split(',').map(s => s.trim()) : []
      const hollandArray = majorHolland ? majorHolland.split(',').map(h => h.trim().toUpperCase()) : []

      const { data, error } = await supabase
        .from('majors')
        .insert({
          name: majorName,
          code: majorCode.toUpperCase(),
          category: majorCategory,
          description: majorDesc,
          average_salary_range: majorSalary,
          required_skills: skillsArray,
          career_prospects: majorProspects,
          holland_codes: hollandArray
        })
        .select()
        .single()

      if (error) throw error

      setMajors(prev => [data, ...prev])
      setStats(prev => ({ ...prev, majors: prev.majors + 1 }))
      setToast({ type: 'success', message: 'Thêm ngành học mới thành công!' })
      
      // Reset form
      setMajorName('')
      setMajorCode('')
      setMajorDesc('')
      setMajorSalary('10 - 25 triệu VND')
      setMajorSkills('')
      setMajorProspects('')
      setMajorHolland('')
      setShowMajorForm(false)
    } catch (error) {
      console.error('Lỗi thêm ngành:', error)
      setToast({ type: 'error', message: error.message || 'Lỗi lưu ngành học mới.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xóa ngành học
  const handleDeleteMajor = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ngành học này? Mọi liên kết ngành - trường liên quan sẽ bị xóa.')) return
    try {
      const { error } = await supabase.from('majors').delete().eq('id', id)
      if (error) throw error

      setMajors(prev => prev.filter(m => m.id !== id))
      setStats(prev => ({ ...prev, majors: prev.majors - 1 }))
      setToast({ type: 'success', message: 'Đã xóa ngành học.' })
    } catch (error) {
      console.error('Lỗi khi xóa ngành:', error)
      setToast({ type: 'error', message: 'Không thể xóa ngành học.' })
    }
  }

  // Thêm trường học mới
  const handleAddUni = async (e) => {
    e.preventDefault()
    if (!uniName || !uniCode || !uniRegion) {
      setToast({ type: 'error', message: 'Vui lòng điền các trường bắt buộc!' })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('universities')
        .insert({
          name: uniName,
          code: uniCode.toUpperCase(),
          region: uniRegion,
          website: uniWebsite || null,
          tuition_fee_per_year: uniTuition ? Number(uniTuition) : null
        })
        .select()
        .single()

      if (error) throw error

      setUnis(prev => [data, ...prev])
      setStats(prev => ({ ...prev, unis: prev.unis + 1 }))
      setToast({ type: 'success', message: 'Thêm trường học mới thành công!' })

      // Reset form
      setUniName('')
      setUniCode('')
      setUniRegion('Bắc')
      setUniWebsite('')
      setUniTuition('')
      setShowUniForm(false)
    } catch (error) {
      console.error('Lỗi thêm trường:', error)
      setToast({ type: 'error', message: error.message || 'Lỗi lưu trường học mới.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xóa trường học
  const handleDeleteUni = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa trường đại học này? Mọi liên kết ngành - trường liên quan sẽ bị xóa.')) return
    try {
      const { error } = await supabase.from('universities').delete().eq('id', id)
      if (error) throw error

      setUnis(prev => prev.filter(u => u.id !== id))
      setStats(prev => ({ ...prev, unis: prev.unis - 1 }))
      setToast({ type: 'success', message: 'Đã xóa trường học.' })
    } catch (error) {
      console.error('Lỗi khi xóa trường:', error)
      setToast({ type: 'error', message: 'Không thể xóa trường học.' })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-64 rounded-sm"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
        </div>
        <div className="h-96 bg-slate-200 rounded-sm"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          Bảng quản trị Hệ thống Career Guidance
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Cấu hình danh mục Ngành học, Trường đại học, phân chia vai trò người dùng và xem số liệu thống kê hệ thống.
        </p>
      </div>

      {/* Grid thống kê nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng người dùng</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.users}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngành học CSDL</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.majors}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trường ĐH CSDL</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.unis}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài test đã làm</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.tests}</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation & Controls */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'users' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Quản lý tài khoản
          </button>
          <button
            onClick={() => setActiveTab('majors')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'majors' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Danh mục Ngành học
          </button>
          <button
            onClick={() => setActiveTab('unis')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'unis' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Danh mục Trường học
          </button>
        </div>

        {activeTab === 'majors' && (
          <Button 
            onClick={() => setShowMajorForm(!showMajorForm)} 
            variant="primary" 
            className="text-[10px] py-1.5 px-3.5 gap-1.5 uppercase font-bold tracking-wider mb-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {showMajorForm ? 'Đóng form' : 'Thêm ngành mới'}
          </Button>
        )}

        {activeTab === 'unis' && (
          <Button 
            onClick={() => setShowUniForm(!showUniForm)} 
            variant="primary" 
            className="text-[10px] py-1.5 px-3.5 gap-1.5 uppercase font-bold tracking-wider mb-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {showUniForm ? 'Đóng form' : 'Thêm trường mới'}
          </Button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: QUẢN LÝ NGƯỜI DÙNG (USERS)
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vai trò hiện tại</th>
                  <th className="py-3 px-4 text-center">Thay đổi vai trò</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.full_name || 'Học sinh mới'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-500">{p.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm ${
                        p.role === 'admin' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : p.role === 'counselor' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      } uppercase`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.id === user.id ? (
                        <span className="text-[10px] text-slate-400 font-semibold italic">Tài khoản hiện tại</span>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleRoleChange(p.id, 'student')}
                            disabled={p.role === 'student'}
                            className="px-2 py-1 border text-[10px] font-bold uppercase rounded-sm hover:bg-slate-50 disabled:opacity-40"
                          >
                            Học sinh
                          </button>
                          <button
                            onClick={() => handleRoleChange(p.id, 'counselor')}
                            disabled={p.role === 'counselor'}
                            className="px-2 py-1 border text-[10px] font-bold uppercase rounded-sm hover:bg-emerald-50 text-emerald-700 border-emerald-200 disabled:opacity-40"
                          >
                            Tư vấn viên
                          </button>
                          <button
                            onClick={() => handleRoleChange(p.id, 'admin')}
                            disabled={p.role === 'admin'}
                            className="px-2 py-1 border text-[10px] font-bold uppercase rounded-sm hover:bg-rose-50 text-rose-700 border-rose-200 disabled:opacity-40"
                          >
                            Admin
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: QUẢN LÝ NGÀNH HỌC (MAJORS)
          ========================================================================= */}
      {activeTab === 'majors' && (
        <div className="space-y-6">
          {/* Form thêm ngành mới */}
          {showMajorForm && (
            <form onSubmit={handleAddMajor} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 animate-reveal">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Khai báo ngành học mới
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tên ngành học *</label>
                  <input
                    type="text"
                    required
                    value={majorName}
                    onChange={(e) => setMajorName(e.target.value)}
                    placeholder="Ví dụ: Khoa học máy tính"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Mã ngành viết tắt *</label>
                  <input
                    type="text"
                    required
                    value={majorCode}
                    onChange={(e) => setMajorCode(e.target.value)}
                    placeholder="Ví dụ: KHMT"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Phân loại lĩnh vực</label>
                  <select
                    value={majorCategory}
                    onChange={(e) => setMajorCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium text-slate-650"
                  >
                    <option value="Kỹ thuật - Công nghệ">Kỹ thuật - Công nghệ</option>
                    <option value="Kinh tế - Quản lý">Kinh tế - Quản lý</option>
                    <option value="Nghệ thuật - Thiết kế">Nghệ thuật - Thiết kế</option>
                    <option value="Giáo dục">Giáo dục</option>
                    <option value="Y tế - Sức khỏe">Y tế - Sức khỏe</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Mức lương trung bình</label>
                  <input
                    type="text"
                    value={majorSalary}
                    onChange={(e) => setMajorSalary(e.target.value)}
                    placeholder="10 - 20 triệu VND"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Kỹ năng cốt lõi (Cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={majorSkills}
                    onChange={(e) => setMajorSkills(e.target.value)}
                    placeholder="Tư duy logic, Lập trình..."
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Holland Code liên quan (Cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={majorHolland}
                    onChange={(e) => setMajorHolland(e.target.value)}
                    placeholder="I, R"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Mô tả chi tiết ngành *</label>
                <textarea
                  required
                  rows={3}
                  value={majorDesc}
                  onChange={(e) => setMajorDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Triển vọng nghề nghiệp</label>
                <textarea
                  rows={3}
                  value={majorProspects}
                  onChange={(e) => setMajorProspects(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowMajorForm(false)} className="text-xs">Hủy</Button>
                <Button type="submit" isLoading={isSubmitting} variant="accent" className="text-xs">Lưu ngành học</Button>
              </div>
            </form>
          )}

          {/* Bảng danh sách ngành */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên ngành học</th>
                    <th className="py-3 px-4">Mã ngành</th>
                    <th className="py-3 px-4">Nhóm ngành</th>
                    <th className="py-3 px-4">Holland Codes</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {majors.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{m.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-450 uppercase">{m.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{m.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {m.holland_codes && m.holland_codes.map((code, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 border border-slate-200 rounded-sm uppercase text-slate-600">
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteMajor(m.id)}
                          className="p-1 rounded-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-150"
                          title="Xóa ngành học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: QUẢN LÝ TRƯỜNG ĐẠI HỌC (UNIS)
          ========================================================================= */}
      {activeTab === 'unis' && (
        <div className="space-y-6">
          {/* Form thêm trường mới */}
          {showUniForm && (
            <form onSubmit={handleAddUni} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 animate-reveal">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Khai báo trường Đại học mới
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tên trường *</label>
                  <input
                    type="text"
                    required
                    value={uniName}
                    onChange={(e) => setUniName(e.target.value)}
                    placeholder="Ví dụ: Đại học Bách khoa Hà Nội"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Mã trường *</label>
                  <input
                    type="text"
                    required
                    value={uniCode}
                    onChange={(e) => setUniCode(e.target.value)}
                    placeholder="Ví dụ: HUST"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Khu vực địa lý *</label>
                  <select
                    value={uniRegion}
                    onChange={(e) => setUniRegion(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium text-slate-650"
                  >
                    <option value="Bắc">Bắc</option>
                    <option value="Trung">Trung</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Học phí trung bình (VND / Năm)</label>
                  <input
                    type="number"
                    value={uniTuition}
                    onChange={(e) => setUniTuition(e.target.value)}
                    placeholder="Ví dụ: 30000000"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Địa chỉ Website chính thức</label>
                  <input
                    type="url"
                    value={uniWebsite}
                    onChange={(e) => setUniWebsite(e.target.value)}
                    placeholder="https://example.edu.vn"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setShowUniForm(false)} className="text-xs">Hủy</Button>
                <Button type="submit" isLoading={isSubmitting} variant="accent" className="text-xs">Lưu trường học</Button>
              </div>
            </form>
          )}

          {/* Bảng danh sách trường */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên trường học</th>
                    <th className="py-3 px-4">Mã trường</th>
                    <th className="py-3 px-4">Khu vực</th>
                    <th className="py-3 px-4">Website</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {unis.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-450 uppercase">{u.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">Miền {u.region}</td>
                      <td className="py-3 px-4 font-medium text-brand-600 truncate max-w-xs">
                        <a href={u.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {u.website}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteUni(u.id)}
                          className="p-1 rounded-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-150"
                          title="Xóa trường học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

export default AdminManagement
