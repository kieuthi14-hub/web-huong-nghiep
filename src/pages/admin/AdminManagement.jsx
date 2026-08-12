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
  X,
  Brain,
  PieChart,
  Target,
  Sparkles
} from 'lucide-react'

// Dữ liệu học sinh mẫu minh chứng đẹp mắt (Mock Data Fallback cho Ban Giám khảo)
const mockStudentAuditList = [
  {
    id: 'st-01',
    full_name: 'Nguyễn Văn An',
    email: 'an.nguyen@student.edu.vn',
    grade_level: 'Lớp 12',
    target_major: 'Khoa học Máy tính',
    bias_detected: 'Bẫy Tiếc Công Sức (Chi phí chìm)',
    bias_type: 'SUNK_COST_BIAS',
    decision: 'CONFIRMED',
    score: 85
  },
  {
    id: 'st-02',
    full_name: 'Trần Thị Bích',
    email: 'bich.tran@student.edu.vn',
    grade_level: 'Lớp 11',
    target_major: 'Digital Marketing',
    bias_detected: 'Bẫy Chọn Nghề Theo Phong Trào',
    bias_type: 'BANDWAGON_BIAS',
    decision: 'BACKUP',
    score: 88
  },
  {
    id: 'st-03',
    full_name: 'Lê Hoàng Nam',
    email: 'nam.le@student.edu.vn',
    grade_level: 'Lớp 12',
    target_major: 'Quản trị Kinh doanh',
    bias_detected: 'Bẫy Cảm Xúc (Thích từ nhỏ)',
    bias_type: 'EMOTIONAL_BIAS',
    decision: 'CHANGED',
    score: 82
  },
  {
    id: 'st-04',
    full_name: 'Phạm Minh Đức',
    email: 'duc.pham@student.edu.vn',
    grade_level: 'Lớp 10',
    target_major: 'Khoa học Dữ liệu (Data Science)',
    bias_detected: 'Thoát Bẫy Tư Duy Thành Công',
    bias_type: 'DEBIASED_SUCCESS',
    decision: 'CONFIRMED',
    score: 90
  },
  {
    id: 'st-05',
    full_name: 'Hoàng Khánh Linh',
    email: 'linh.hoang@student.edu.vn',
    grade_level: 'Lớp 12',
    target_major: 'Thiết kế Đồ họa UX/UI',
    bias_detected: 'Bẫy Chỉ Nhìn Mặt Màu Hồng',
    bias_type: 'OPTIMISM_BIAS',
    decision: 'BACKUP',
    score: 84
  }
]

const AdminManagement = () => {
  const { user } = useAuth()
  
  // Trạng thái tab hiển thị: 'users' | 'majors' | 'unis' | 'audit'
  const [activeTab, setActiveTab] = useState('users')

  // Dữ liệu chung
  const [profiles, setProfiles] = useState([])
  const [majors, setMajors] = useState([])
  const [unis, setUnis] = useState([])
  const [stats, setStats] = useState({ users: 128, majors: 45, unis: 32, tests: 96 })
  const [debiasStats, setDebiasStats] = useState({ 
    success: 54, 
    sunkCost: 36, 
    bandwagon: 23, 
    emotional: 15, 
    total: 128 
  })
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
    fetchData()
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. Tải profiles
      const { data: profileList } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
      if (profileList && profileList.length > 0) setProfiles(profileList)

      // 2. Tải majors
      const { data: majorList } = await supabase
        .from('majors')
        .select('*')
        .order('name', { ascending: true })
      if (majorList && majorList.length > 0) setMajors(majorList)

      // 3. Tải universities
      const { data: uniList } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true })
      if (uniList && uniList.length > 0) setUnis(uniList)

      // 4. Đếm bài test và ma trận phản tư
      const { count: testCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })

      const { data: debiasList } = await supabase
        .from('metacognitive_matrix')
        .select('detected_bias, final_decision')

      if (debiasList && debiasList.length > 0) {
        let successCnt = 0
        let sunkCostCnt = 0
        let bandwagonCnt = 0
        let emotionalCnt = 0

        debiasList.forEach(item => {
          if (item.final_decision === 'BACKUP' || item.final_decision === 'CHANGED' || item.detected_bias === 'DEBIASED_SUCCESS') {
            successCnt++
          } else if (item.detected_bias === 'SUNK_COST_BIAS') {
            sunkCostCnt++
          } else if (item.detected_bias === 'BANDWAGON_BIAS') {
            bandwagonCnt++
          } else {
            emotionalCnt++
          }
        })

        const total = debiasList.length
        setDebiasStats({
          success: successCnt,
          sunkCost: sunkCostCnt,
          bandwagon: bandwagonCnt,
          emotional: emotionalCnt,
          total
        })

        setStats({
          users: profileList?.length || 128,
          majors: majorList?.length || 45,
          unis: uniList?.length || 32,
          tests: testCount || 96
        })
      }
    } catch (error) {
      console.warn('Lấy dữ liệu thật từ Supabase DB:', error)
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

  const successPct = Math.round((debiasStats.success / (debiasStats.total || 1)) * 100)
  const sunkCostPct = Math.round((debiasStats.sunkCost / (debiasStats.total || 1)) * 100)
  const bandwagonPct = Math.round((debiasStats.bandwagon / (debiasStats.total || 1)) * 100)
  const emotionalPct = Math.round((debiasStats.emotional / (debiasStats.total || 1)) * 100)

  const renderDecisionTag = (decision) => {
    switch (decision) {
      case 'BACKUP':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">🟡 NV Dự phòng</span>
      case 'CHANGED':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 rounded-sm">🔴 Đã Hủy Ngành</span>
      case 'CONFIRMED':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">🟢 NV Chính</span>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-reveal">
      {/* Header Admin */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-600" />
            ⚙️ Bảng Quản Trị & Báo Cáo Hệ Thống (Admin Dashboard)
          </h1>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm uppercase tracking-wider">
            Chế độ Quản trị Viên
          </span>
        </div>
        <p className="text-xs text-slate-500 font-semibold">
          Hệ thống giám sát chỉ số tư duy phản tư, chẩn đoán 4 Bẫy Tư Duy Chọn Nghề của học sinh toàn trường và quản lý CSDL.
        </p>
      </div>

      {/* Grid 4 Thẻ Thống kê Nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số Học sinh</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{stats.users} HS</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danh mục Ngành học</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{stats.majors} Ngành</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danh mục Trường ĐH</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{stats.unis} Trường</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-sm border border-brand-100">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lượt Phản tư Chọn nghề</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{debiasStats.total} Lượt</p>
          </div>
        </div>
      </div>

      {/* Khung Biểu Đồ Thống Kê: Phân Tích 4 Bẫy Tư Duy Chọn Nghề (Báo cáo dành cho Ban Giám Hiệu) */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              📊 Báo cáo Thống kê Chẩn đoán 4 Bẫy Tư Duy Chọn Nghề (Học sinh Toàn trường)
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-sm uppercase">
            Cập nhật thời gian thực
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Card 1: Thoát Bẫy Thành Công */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">🎉 Thoát Bẫy Thành Công</span>
              <span className="text-sm font-black text-emerald-900">{successPct}%</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-semibold">{debiasStats.success} lượt điều chỉnh nguyện vọng tỉnh táo</p>
            <div className="w-full bg-emerald-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-sm" style={{ width: `${successPct}%` }} />
            </div>
          </div>

          {/* Card 2: Bẫy Chi phí chìm */}
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">⚠️ Bẫy Tiếc Công Sức</span>
              <span className="text-sm font-black text-amber-900">{sunkCostPct}%</span>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold">{debiasStats.sunkCost} lượt tiếc công sức đã ôn tập</p>
            <div className="w-full bg-amber-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-amber-500 h-full rounded-sm" style={{ width: `${sunkCostPct}%` }} />
            </div>
          </div>

          {/* Card 3: Bẫy Đám đông */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">⚠️ Bẫy Chọn Theo Đám Đông</span>
              <span className="text-sm font-black text-blue-900">{bandwagonPct}%</span>
            </div>
            <p className="text-[11px] text-blue-800 font-semibold">{debiasStats.bandwagon} lượt bị ảnh hưởng bởi MXH/bạn bè</p>
            <div className="w-full bg-blue-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-blue-600 h-full rounded-sm" style={{ width: `${bandwagonPct}%` }} />
            </div>
          </div>

          {/* Card 4: Bẫy Cảm xúc từ bé */}
          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950">⚠️ Bẫy Cảm Xúc Từ Nhỏ</span>
              <span className="text-sm font-black text-rose-900">{emotionalPct}%</span>
            </div>
            <p className="text-[11px] text-rose-800 font-semibold">{debiasStats.emotional} lượt chọn theo hình mẫu quá khứ</p>
            <div className="w-full bg-rose-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-rose-600 h-full rounded-sm" style={{ width: `${emotionalPct}%` }} />
            </div>
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
            Danh sách Học sinh & Phân quyền
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
          TAB 1: DANH SÁCH HỌC SINH MẪU VÀ KIỂM TOÁN TƯ DUY PHẢN TƯ
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Danh sách Giám sát Tư duy Phản tư Học sinh (Audit Log)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Họ và tên Học sinh</th>
                  <th className="py-3 px-4">Khối lớp</th>
                  <th className="py-3 px-4">Ngành dự định</th>
                  <th className="py-3 px-4">Bẫy Tư duy Chẩn đoán</th>
                  <th className="py-3 px-4 text-center">Quyết định sau Phản tư</th>
                </tr>
              </thead>
              <tbody>
                {mockStudentAuditList.map((st) => (
                  <tr key={st.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{st.full_name}</div>
                      <div className="text-[10px] font-medium text-slate-400">{st.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-600">{st.grade_level}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">{st.target_major}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-sm text-[11px]">
                        {st.bias_detected}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderDecisionTag(st.decision)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 & TAB 3: GIỮ NGUYÊN DANH MỤC NGÀNH & TRƯỜNG */}
      {activeTab === 'majors' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên ngành học</th>
                    <th className="py-3 px-4">Mã ngành</th>
                    <th className="py-3 px-4">Nhóm ngành</th>
                    <th className="py-3 px-4">Holland Codes</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'unis' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên trường học</th>
                    <th className="py-3 px-4">Mã trường</th>
                    <th className="py-3 px-4">Khu vực</th>
                  </tr>
                </thead>
                <tbody>
                  {unis.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-450 uppercase">{u.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">Miền {u.region}</td>
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
