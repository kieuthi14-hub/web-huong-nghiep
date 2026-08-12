import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/common/Toast'
import { 
  ClipboardList, 
  Brain, 
  GraduationCap, 
  School, 
  Milestone, 
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen
} from 'lucide-react'

const StudentDashboard = () => {
  const { user, profile } = useAuth()
  const location = useLocation()
  
  const [hasHolland, setHasHolland] = useState(false)
  const [hasDebias, setHasDebias] = useState(false)
  const [hollandCode, setHollandCode] = useState(null)
  const [debiasCount, setDebiasCount] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (location.state?.unauthorized) {
      setToast({ type: 'warning', message: '⚠️ Bạn không có quyền truy cập trang Quản trị Admin.' })
    }
  }, [location.state])

  useEffect(() => {
    fetchStudentStatus()
  }, [user])

  const fetchStudentStatus = async () => {
    if (!user) return
    try {
      // 1. Kiểm tra bài làm Holland
      const { data: hollandData } = await supabase
        .from('test_results')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (hollandData && hollandData.length > 0) {
        setHasHolland(true)
        setHollandCode(hollandData[0].holland_code || hollandData[0].primary_trait)
      }

      // 2. Kiểm tra số bài Phản tư
      const { data: debiasData } = await supabase
        .from('metacognitive_matrix')
        .select('id')
        .eq('student_id', user.id)

      if (debiasData && debiasData.length > 0) {
        setHasDebias(true)
        setDebiasCount(debiasData.length)
      }
    } catch (err) {
      console.warn('Lấy trạng thái học sinh:', err)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-reveal">
      {/* Banner Chào Mừng */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-8 rounded-sm shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-700/80 text-brand-200 border border-brand-600 rounded-sm uppercase tracking-wider">
            Cổng Hướng Nghiệp Cá Nhân
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Xin chào, {profile?.full_name || 'Học sinh'}! 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
            Hệ thống hỗ trợ bạn đưa ra quyết định chọn ngành nghề chuẩn xác nhất dựa trên Trắc nghiệm Holland, Bảng Phản tư giải bẫy tư duy và Lộ trình Hướng nghiệp 3 khối lớp.
          </p>
        </div>
      </div>

      {/* Grid 4 Thẻ Phối Hợp Tính Năng Cốt Lõi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Thẻ 1: Lộ trình Hướng nghiệp */}
        <Link 
          to="/student/roadmap"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-brand-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-sm w-fit border border-brand-100 group-hover:scale-105 transition-transform">
              <Milestone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                Lộ Trình Hướng Nghiệp
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Chi tiết 3 chặng phát triển dành cho Khối Lớp 10, 11, 12.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-brand-600 gap-1 pt-2 border-t border-slate-100">
            <span>Mở lộ trình</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 2: Trắc nghiệm Holland */}
        <Link 
          to="/student/holland-test"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-brand-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-sm w-fit border border-emerald-100 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Trắc Nghiệm Holland
                </h3>
                {hasHolland && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">
                    {hollandCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Khám phá 6 nhóm thiên hướng tính cách nghề nghiệp.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 gap-1 pt-2 border-t border-slate-100">
            <span>{hasHolland ? 'Làm lại trắc nghiệm' : 'Bắt đầu test ngay'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 3: Bảng Nhìn Lại & Phản Tư */}
        <Link 
          to="/student/debias-matrix"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-amber-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-sm w-fit border border-amber-100 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                  Bảng Phản Tư Chọn Nghề
                </h3>
                {hasDebias && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
                    {debiasCount} Bài
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Nhìn lại rủi ro & giải 4 bẫy tư duy chọn nghề.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-amber-600 gap-1 pt-2 border-t border-slate-100">
            <span>Tạo bài phản tư</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 4: Tra Cứu Ngành Học */}
        <Link 
          to="/student/majors"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-indigo-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-sm w-fit border border-indigo-100 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Tra Cứu Ngành Học
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Thông tin chuẩn đầu ra, điểm chuẩn & trường đào tạo.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-indigo-600 gap-1 pt-2 border-t border-slate-100">
            <span>Khám phá ngay</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
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

export default StudentDashboard
