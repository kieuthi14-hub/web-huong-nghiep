import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import HollandChart from '../../components/common/HollandChart'
import Button from '../../components/common/Button'
import { 
  ClipboardList, 
  GraduationCap, 
  School, 
  Milestone, 
  CalendarDays, 
  ChevronRight, 
  Award, 
  Bookmark, 
  TrendingUp, 
  UserCircle,
  ArrowRight
} from 'lucide-react'

const StudentDashboard = () => {
  const { user, profile } = useAuth()
  const [latestResult, setLatestResult] = useState(null)
  const [savedMajors, setSavedMajors] = useState([])
  const [savedUniversities, setSavedUniversities] = useState([])
  const [roadmaps, setRoadmaps] = useState([])
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // 1. Kết quả test gần nhất
      const { data: testData } = await supabase
        .from('test_results')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (testData && testData.length > 0) {
        setLatestResult(testData[0])
      }

      // 2. Danh sách lưu yêu thích (bookmark)
      const { data: bookmarks } = await supabase
        .from('saved_items')
        .select('*')
        .eq('student_id', user.id)

      if (bookmarks) {
        const majorIds = bookmarks.filter(b => b.item_type === 'major').map(b => b.item_id)
        const uniIds = bookmarks.filter(b => b.item_type === 'university').map(b => b.item_id)

        if (majorIds.length > 0) {
          const { data: majors } = await supabase.from('majors').select('*').in('id', majorIds)
          setSavedMajors(majors || [])
        }
        if (uniIds.length > 0) {
          const { data: unis } = await supabase.from('universities').select('*').in('id', uniIds)
          setSavedUniversities(unis || [])
        }
      }

      // 3. Lộ trình hướng nghiệp
      const { data: roadmapData } = await supabase
        .from('career_roadmaps')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setRoadmaps(roadmapData || [])

      // 4. Lịch hẹn tư vấn sắp tới
      const { data: sessionData } = await supabase
        .from('counseling_sessions')
        .select('*, counselor:counselor_id(full_name, avatar_url)')
        .eq('student_id', user.id)
        .neq('status', 'completed')
        .neq('status', 'rejected')
        .order('scheduled_at', { ascending: true })
        .limit(3)
      setSessions(sessionData || [])

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHollandGroupName = (code) => {
    const groups = {
      R: 'Kỹ thuật (Realistic)',
      I: 'Nghiên cứu (Investigative)',
      A: 'Nghệ thuật (Artistic)',
      S: 'Xã hội (Social)',
      E: 'Quản lý (Enterprising)',
      C: 'Nghiệp vụ (Conventional)'
    }
    return code.split('').map(c => groups[c] || c).join(', ')
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 w-64 rounded-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-200 rounded-sm"></div>
            <div className="h-64 bg-slate-200 rounded-sm"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-200 rounded-sm"></div>
            <div className="h-48 bg-slate-200 rounded-sm"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-reveal">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 to-brand-800 text-white p-6 rounded-sm border border-brand-950">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">
            Chào {profile?.full_name || 'Học sinh'}! 👋
          </h1>
          <p className="text-xs text-brand-200 font-medium">
            Hôm nay bạn muốn tiếp tục khám phá bản thân hay xây dựng lộ trình mục tiêu?
          </p>
        </div>
        <div className="flex gap-2">
          {!latestResult && (
            <Link to="/student/holland-test">
              <Button variant="accent" className="font-bold text-xs uppercase px-4 py-2.5 shadow-sm">
                Làm trắc nghiệm ngay
              </Button>
            </Link>
          )}
          <Link to="/student/roadmap">
            <Button variant="outline" className="text-white border-white hover:bg-white/10 font-bold text-xs uppercase px-4 py-2.5">
              Cập nhật lộ trình
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI & GIỮA: KẾT QUẢ & LỘ TRÌNH */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Kết quả trắc nghiệm Holland gần nhất */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-600" />
                Kết quả trắc nghiệm Holland gần nhất
              </h2>
              {latestResult && (
                <Link to="/student/holland-test" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                  Làm lại bài test
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {latestResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <HollandChart scores={latestResult.scores_json} type="radar" />
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nhóm tính cách nổi trội</span>
                    <p className="text-2xl font-black text-brand-700 tracking-tight mt-1 mb-2">
                      Mã Holland: {latestResult.primary_code}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Tính cách của bạn thuộc nhóm: <span className="font-bold text-slate-800">{getHollandGroupName(latestResult.primary_code)}</span>. 
                      Đây là những nhóm ngành nghề phù hợp nhất với cấu trúc sở thích tự nhiên của bạn.
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">Ngành học đề xuất cho bạn:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {latestResult.recommended_majors_json && latestResult.recommended_majors_json.slice(0, 3).map((majorName, idx) => (
                        <span key={idx} className="px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 rounded-sm">
                          {majorName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <p className="text-sm text-slate-500 font-medium">
                  Bạn chưa thực hiện bài trắc nghiệm tính cách Holland nào.
                </p>
                <Link to="/student/holland-test">
                  <Button variant="primary" className="text-xs font-bold uppercase tracking-wider gap-2">
                    Bắt đầu làm trắc nghiệm
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Section 2: Tiến trình lộ trình hướng nghiệp */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Milestone className="w-4 h-4 text-brand-600" />
                Mục tiêu & Cột mốc học tập
              </h2>
              <Link to="/student/roadmap" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                Quản lý lộ trình
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {roadmaps.length > 0 ? (
              <div className="space-y-4">
                {roadmaps.map((milestone) => {
                  const statusColors = {
                    not_started: 'bg-slate-100 text-slate-600 border-slate-200',
                    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
                    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }
                  const statusLabels = {
                    not_started: 'Chưa làm',
                    in_progress: 'Đang thực hiện',
                    completed: 'Đã hoàn thành'
                  }
                  return (
                    <div 
                      key={milestone.id}
                      className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all rounded-sm"
                    >
                      <div className="space-y-1 pr-4">
                        <p className="text-sm font-bold text-slate-700">{milestone.title}</p>
                        {milestone.notes && <p className="text-xs text-slate-500 line-clamp-1">{milestone.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {milestone.target_date && (
                          <span className="text-[11px] text-slate-400 font-medium">Hạn: {new Date(milestone.target_date).toLocaleDateString('vi-VN')}</span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm ${statusColors[milestone.status]}`}>
                          {statusLabels[milestone.status]}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500 font-medium">
                Chưa có mục tiêu nào được thiết lập. Hãy thiết lập cột mốc học tập (ví dụ: Học IELTS, ôn khối A00) để theo đuổi mục tiêu định hướng.
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: BOOKMARKS & LỊCH HẸN TƯ VẤN */}
        <div className="space-y-8">
          
          {/* Section 3: Lịch hẹn tư vấn sắp tới */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-brand-600" />
                Lịch tư vấn 1-1
              </h2>
              <Link to="/student/booking" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                Đặt lịch mới
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const statusColors = {
                    pending: 'bg-slate-100 text-slate-600 border-slate-200',
                    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    rejected: 'bg-red-50 text-red-700 border-red-200'
                  }
                  const statusLabels = {
                    pending: 'Chờ duyệt',
                    confirmed: 'Đã xác nhận',
                    rejected: 'Từ chối'
                  }
                  return (
                    <div key={session.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm ${statusColors[session.status]}`}>
                          {statusLabels[session.status]}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {new Date(session.scheduled_at).toLocaleString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center border border-brand-200 text-brand-700">
                          <UserCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Chuyên viên tư vấn</p>
                          <p className="text-xs text-slate-500 font-semibold">{session.counselor?.full_name || 'Đang cập nhật'}</p>
                        </div>
                      </div>
                      {session.student_notes && (
                        <p className="text-xs text-slate-500 italic bg-white p-2 border border-slate-100 rounded-sm line-clamp-2">
                          "{session.student_notes}"
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 font-medium">
                Bạn chưa có lịch tư vấn nào sắp tới. Gặp khó khăn trong chọn ngành? Hãy đặt lịch hẹn với Chuyên viên ngay.
              </div>
            )}
          </div>

          {/* Section 4: Danh sách mục tiêu đã lưu (Saved Items) */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-brand-600" />
                Mục tiêu của tôi
              </h2>
            </div>

            <div className="space-y-6">
              {/* Ngành lưu */}
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-2.5 uppercase tracking-wide">Ngành học yêu thích ({savedMajors.length})</span>
                {savedMajors.length > 0 ? (
                  <div className="space-y-2">
                    {savedMajors.map(major => (
                      <Link 
                        key={major.id} 
                        to={`/student/majors?id=${major.id}`}
                        className="flex items-center gap-2.5 p-2 border border-slate-100 hover:border-brand-200 rounded-sm bg-slate-50/30 hover:bg-white transition-all"
                      >
                        <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 line-clamp-1">{major.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Chưa lưu ngành học nào. <Link to="/student/majors" className="text-brand-600 hover:underline">Tìm kiếm</Link></p>
                )}
              </div>

              {/* Trường lưu */}
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-2.5 uppercase tracking-wide">Trường ĐH/CĐ mục tiêu ({savedUniversities.length})</span>
                {savedUniversities.length > 0 ? (
                  <div className="space-y-2">
                    {savedUniversities.map(uni => (
                      <Link 
                        key={uni.id} 
                        to={`/student/universities?id=${uni.id}`}
                        className="flex items-center gap-2.5 p-2 border border-slate-100 hover:border-brand-200 rounded-sm bg-slate-50/30 hover:bg-white transition-all"
                      >
                        <School className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 line-clamp-1">{uni.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Chưa lưu trường học nào. <Link to="/student/universities" className="text-brand-600 hover:underline">Tìm kiếm</Link></p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
