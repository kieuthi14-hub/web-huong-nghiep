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

      {/* Banner Cú Hích Trọng Tâm */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/5 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-sm shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-sm font-black flex-shrink-0 mt-0.5 shadow-xs text-base">
            💡
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>MÔ HÌNH CAN THIỆP GIẢM THIÊN LỆCH NHẬN THỨC (DEBIASING FRAMEWORK)</span>
            </h4>
            <p className="text-xs text-amber-900 font-bold mt-1 leading-relaxed">
              Tránh bẫy chọn nghề theo trào lưu số đông hoặc thiên lệch cảm xúc. Hãy lần lượt đi qua các bước: Trắc nghiệm thiên hướng ➔ AI Phản tư ➔ Đối chứng dữ liệu thực tế ➔ Tư vấn chuyên gia ➔ Nhật ký ra quyết định.
            </p>
          </div>
        </div>
      </div>

      {/* Grid 6 Thẻ Phối Hợp Trụ Cột Can Thiệp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Thẻ 1: Trắc nghiệm Holland */}
        <Link 
          to="/student/holland"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-emerald-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-sm w-fit border border-emerald-100 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm uppercase tracking-wider">
                Bước 1
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  🧭 Trắc Nghiệm Thiên Hướng (Holland)
                </h3>
                {hasHolland && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">
                    {hollandCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Khám phá 6 nhóm thiên hướng tính cách nghề nghiệp chuẩn khoa học.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 gap-1 pt-2 border-t border-slate-100">
            <span>{hasHolland ? 'Xem lại kết quả & Làm lại' : 'Bắt đầu trắc nghiệm ngay'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 2: AI Tham vấn Phản tư */}
        <Link 
          to="/student/debias-agent"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-amber-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-sm w-fit border border-amber-100 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-sm uppercase tracking-wider">
                Bước 2
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                🤖 AI Tham Vấn Phản Tư
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Trò chuyện phản biện, bóc tách rủi ro thực tế & bẫy tâm lý chọn nghề.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-amber-600 gap-1 pt-2 border-t border-slate-100">
            <span>Tham vấn cùng AI ngay</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 3: Đối chứng Dữ liệu Khách quan */}
        <Link 
          to="/student/fact-check"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-blue-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-sm w-fit border border-blue-100 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-sm uppercase tracking-wider">
                Bước 3
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                🔍 Đối Chứng Dữ Liệu Khách Quan
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Thư viện tra cứu chuẩn đầu ra ngành, học phí & điểm chuẩn trường đại học.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-600 gap-1 pt-2 border-t border-slate-100">
            <span>Tra cứu & Đối chứng</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 4: Tư vấn 1-1 Đối chứng Thực tế */}
        <Link 
          to="/student/booking"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-violet-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-sm w-fit border border-violet-100 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-violet-100 text-violet-800 rounded-sm uppercase tracking-wider">
                Bước 4
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-violet-600 transition-colors">
                🎓 Tư Vấn 1-1 Đối Chứng Thực Tế
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Đặt lịch trao đổi trực tiếp với Thầy Cô Cố vấn và Mentor Sinh viên.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-violet-600 gap-1 pt-2 border-t border-slate-100">
            <span>Đặt lịch tư vấn 1-1</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 5: Bảng Nhật ký Phản tư Ra Quyết định */}
        <Link 
          to="/student/reflection"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-rose-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-sm w-fit border border-rose-100 group-hover:scale-105 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-sm uppercase tracking-wider">
                Bước 5
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                  📝 Nhật Ký Phản Tư Ra Quyết Định
                </h3>
                {hasDebias && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-sm">
                    {debiasCount} Bài
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Soi chiếu năng lực thực tế, nhận diện rủi ro & chốt nguyện vọng vững chắc.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-rose-600 gap-1 pt-2 border-t border-slate-100">
            <span>Mở nhật ký phản tư</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Thẻ 6: Lộ trình Hướng nghiệp 3 Khối Lớp */}
        <Link 
          to="/student/roadmap"
          className="bg-white border border-slate-200 p-5 rounded-sm hover:border-brand-500 transition-all shadow-sm group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-sm w-fit border border-brand-100 group-hover:scale-105 transition-transform">
                <Milestone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-brand-100 text-brand-800 rounded-sm uppercase tracking-wider">
                Bước 6
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                🎯 Lộ Trình Mục Tiêu Cá Nhân
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Khung lộ trình chuẩn hóa và theo dõi tiến độ hoàn thành mục tiêu 3 khối lớp.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-brand-600 gap-1 pt-2 border-t border-slate-100">
            <span>Theo dõi lộ trình</span>
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
