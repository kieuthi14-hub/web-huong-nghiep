import React, { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import MajorCard from '../../components/career/MajorCard'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  Search, 
  GraduationCap, 
  ArrowLeft, 
  DollarSign, 
  Award, 
  BookOpen, 
  TrendingUp, 
  School,
  Check,
  AlertTriangle,
  Brain,
  Lightbulb,
  ExternalLink 
} from 'lucide-react'

// Danh sách ngành học dự phòng (Fallback Data)
const fallbackMajorsList = [
  {
    id: 'm1',
    name: 'Khoa học Máy tính & Công nghệ Thông tin',
    code: 'CNTT',
    category: 'Kỹ thuật - Công nghệ',
    description: 'Ngành học tập trung vào lập trình, thiết kế hệ thống phần mềm, trí tuệ nhân tạo (AI), an ninh mạng và khoa học dữ liệu. Người học sẽ làm chủ công nghệ để giải quyết các bài toán chuyển đổi số.',
    required_skills: ['Tư duy logic', 'Lập trình hệ thống', 'Giải quyết vấn đề', 'Ngoại ngữ'],
    average_salary_range: 'Khởi điểm: 9 - 14 triệu | Sau 3-5 năm: 18 - 35 triệu+',
    career_prospects: 'Nhu cầu nhân lực chất lượng cao vô cùng lớn tại các doanh nghiệp trong nước và quốc tế. Cơ hội thăng tiến lên Tech Lead, Solution Architect hoặc khởi nghiệp công nghệ.',
    holland_codes: ['I', 'R', 'C']
  },
  {
    id: 'm2',
    name: 'Quản trị Kinh doanh',
    code: 'QTKD',
    category: 'Kinh tế - Quản lý',
    description: 'Ngành đào tạo kiến thức tổng hợp về quản lý doanh nghiệp, tài chính, nhân sự, marketing và hoạch định chiến lược kinh doanh. Giúp phát triển kỹ năng lãnh đạo toàn diện.',
    required_skills: ['Giao tiếp thuyết phục', 'Lập kế hoạch', 'Lãnh đạo đội nhóm', 'Đàm phán'],
    average_salary_range: 'Khởi điểm: 8 - 12 triệu | Sau 3-5 năm: 15 - 28 triệu+',
    career_prospects: 'Cơ hội việc làm đa dạng trong các phòng ban chức năng của doanh nghiệp. Lộ trình thăng tiến rõ ràng lên vị trí Quản lý, Giám đốc bộ phận.',
    holland_codes: ['E', 'S', 'C']
  },
  {
    id: 'm3',
    name: 'Thiết kế Đồ họa & Truyền thông Đa phương tiện',
    code: 'TKDH',
    category: 'Nghệ thuật - Thiết kế',
    description: 'Lĩnh vực kết hợp giữa tư duy nghệ thuật thẩm mỹ và các công cụ công nghệ số để tạo ra các ấn phẩm truyền thông trực quan, nhận diện thương hiệu, thiết kế UX/UI cho web/app và hoạt hình 3D.',
    required_skills: ['Sáng tạo nghệ thuật', 'Sử dụng phần mềm Adobe/Figma', 'Tư duy thẩm mỹ', 'Làm việc nhóm'],
    average_salary_range: 'Khởi điểm: 7 - 11 triệu | Sau 3-5 năm: 14 - 25 triệu+',
    career_prospects: 'Rộng mở trong các Agency quảng cáo, studio sáng tạo, công ty phát triển game và phòng marketing của mọi doanh nghiệp.',
    holland_codes: ['A', 'I', 'R']
  }
]

const MajorExplorer = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const majorId = searchParams.get('id')

  const [majors, setMajors] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedHolland, setSelectedHolland] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)

  const [majorDetail, setMajorDetail] = useState(null)
  const [relatedUnis, setRelatedUnis] = useState([])

  const categories = [
    'Kỹ thuật - Công nghệ',
    'Kinh tế - Quản lý',
    'Nghệ thuật - Thiết kế',
    'Giáo dục',
    'Y tế - Sức khỏe'
  ]

  const hollandCodes = ['R', 'I', 'A', 'S', 'E', 'C']

  useEffect(() => {
    fetchBookmarks()
    if (majorId) {
      fetchMajorDetail(majorId)
    } else {
      fetchMajors()
    }
  }, [majorId])

  const fetchBookmarks = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('student_id', user.id)
        .eq('item_type', 'major')

      if (data) setBookmarkedIds(new Set(data.map(b => b.item_id)))
    } catch (error) {
      console.warn('Chưa lấy được bookmark:', error)
    }
  }

  // Tải ngành học thuần 100% từ bảng majors của Supabase DB
  const fetchMajors = async () => {
    setIsLoading(true)
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        setDbError('Lỗi truy vấn bảng majors từ Supabase DB.')
        setMajors([])
      } else if (!data || data.length === 0) {
        setDbError('Bảng majors trong CSDL Supabase hiện tại đang rỗng. Thầy vui lòng nạp dữ liệu bằng file schema.sql.')
        setMajors([])
      } else {
        setMajors(data)
      }
    } catch (error) {
      console.error('Lỗi khi fetch majors:', error)
      setDbError('Không thể kết nối với bảng majors trong Supabase DB.')
      setMajors([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMajorDetail = async (id) => {
    try {
      const { data: major, error } = await supabase
        .from('majors')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error || !major) {
        const found = fallbackMajorsList.find(m => m.id === id) || fallbackMajorsList[0]
        setMajorDetail(found)
      } else {
        setMajorDetail(major)
        const { data: mappings } = await supabase
          .from('major_university_map')
          .select('*, university:university_id(*)')
          .eq('major_id', id)

        setRelatedUnis(mappings || [])
      }
    } catch (error) {
      console.error('Lỗi fetch chi tiết ngành:', error)
      setMajorDetail(fallbackMajorsList[0])
    }
  }

  const handleBookmarkToggle = async (itemId, itemType, isBookmarked) => {
    if (!user) return
    try {
      if (isBookmarked) {
        await supabase
          .from('saved_items')
          .delete()
          .eq('student_id', user.id)
          .eq('item_type', itemType)
          .eq('item_id', itemId)

        setBookmarkedIds(prev => {
          const next = new Set(prev)
          next.delete(itemId)
          return next
        })
        setToast({ type: 'success', message: 'Đã bỏ lưu ngành học.' })
      } else {
        await supabase
          .from('saved_items')
          .insert({
            student_id: user.id,
            item_type: itemType,
            item_id: itemId
          })

        setBookmarkedIds(prev => {
          const next = new Set(prev)
          next.add(itemId)
          return next
        })
        setToast({ type: 'success', message: 'Đã lưu ngành học vào Supabase DB.' })
      }
    } catch (error) {
      console.error('Lỗi bookmark:', error)
      setToast({ type: 'error', message: 'Lỗi khi lưu ngành học vào CSDL.' })
    }
  }

  const filteredMajors = majors.filter(major => {
    const matchesSearch = major.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          major.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (major.description && major.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory ? major.category === selectedCategory : true
    const matchesHolland = selectedHolland ? (major.holland_codes || []).includes(selectedHolland) : true

    return matchesSearch && matchesCategory && matchesHolland
  })

  if (majorId && majorDetail) {
    const isBookmarked = bookmarkedIds.has(majorDetail.id)
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-reveal">
        <button 
          onClick={() => setSearchParams({})} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>

        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <span className="px-2 py-0.5 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-sm">
                {majorDetail.category}
              </span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-2 mb-1">
                {majorDetail.name}
              </h1>
              <p className="text-xs text-slate-400 font-bold">Mã ngành đào tạo: {majorDetail.code}</p>
            </div>
            <Button
              variant={isBookmarked ? 'accent' : 'outline'}
              onClick={() => handleBookmarkToggle(majorDetail.id, 'major', isBookmarked)}
              className="font-bold text-xs uppercase py-2 px-4 gap-1.5 self-start"
            >
              {isBookmarked ? 'Đã lưu mục tiêu' : 'Lưu ngành học'}
            </Button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed pt-2">
            {majorDetail.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Các kỹ năng cốt lõi */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-brand-600" />
                Các kỹ năng cốt lõi cần có
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {majorDetail.required_skills && majorDetail.required_skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 border border-slate-50 bg-slate-50/50 rounded-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Triển vọng nghề nghiệp */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-brand-600" />
                Triển vọng nghề nghiệp tương lai
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {majorDetail.career_prospects}
              </p>
            </div>

            {/* Khung "Thách thức & Mặt tối thực tế" (Risk Analysis Section) */}
            <div className="bg-amber-50/70 border border-amber-200 p-6 rounded-sm space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200/60 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                ⚠️ Thách thức & Mặt tối thực tế của ngành
              </h3>

              <div className="space-y-2.5 text-xs text-amber-950 font-medium">
                <div className="flex items-start gap-2 bg-white/80 p-3 rounded-sm border border-amber-200/60">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Áp lực cập nhật kiến thức & công nghệ cực cao, nguy cơ bị tụt hậu nếu không có tinh thần tự học liên tục.</span>
                </div>
                <div className="flex items-start gap-2 bg-white/80 p-3 rounded-sm border border-amber-200/60">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Nguy cơ bị tối ưu hóa và tự động hóa bởi trí tuệ nhân tạo (AI) trong 3-5 năm tới đối với các tác vụ cơ bản.</span>
                </div>
                <div className="flex items-start gap-2 bg-white/80 p-3 rounded-sm border border-amber-200/60">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Tỷ lệ cạnh tranh đào thải khốc liệt giữa các nhân sự cấp thấp (Junior) trên thị trường lao động.</span>
                </div>
              </div>
            </div>

            {/* Trường Đại học đào tạo & Hướng dẫn tra cứu */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <School className="w-4.5 h-4.5 text-brand-600" />
                🏫 MỘT SỐ TRƯỜNG THAM KHẢO TIÊU BIỂU & HƯỚNG DẪN TRA CỨU
              </h3>

              {relatedUnis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Tên trường</th>
                        <th className="py-3 px-4">Vùng</th>
                        <th className="py-3 px-4">Khối thi</th>
                        <th className="py-3 px-4 text-right">ĐIỂM CHUẨN THAM KHẢO (2025)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedUnis.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <Link 
                              to={`/student/universities?id=${item.university?.id}`}
                              className="font-bold text-brand-600 hover:underline"
                            >
                              {item.university?.name} ({item.university?.code})
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-600">Miền {item.university?.region}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {item.subject_groups && item.subject_groups.map((g, idx) => (
                                <span key={idx} className="px-1 py-0.5 text-[9px] font-bold bg-slate-100 border rounded-sm text-slate-600 uppercase">
                                  {g}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            {item.benchmark_scores_json && (item.benchmark_scores_json['2024'] || item.benchmark_scores_json['2023'])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Chưa có thông tin trường đại học đào tạo ngành này trong CSDL Supabase.</p>
              )}

              {/* Khung Chỉ dẫn học sinh tự tra cứu trọn bộ các trường */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-sm space-y-4 text-xs text-emerald-950 mt-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-emerald-200/60 pb-2.5">
                  <Lightbulb className="w-4.5 h-4.5 text-emerald-700 flex-shrink-0" />
                  <h4 className="font-bold text-emerald-900 uppercase tracking-wider">
                    💡 Hướng dẫn học sinh tự tra cứu đầy đủ danh sách các trường trên toàn quốc:
                  </h4>
                </div>

                {/* Cú pháp tìm kiếm chuẩn */}
                <div className="bg-white p-3 rounded-sm border border-emerald-200/80 font-bold text-emerald-900 leading-relaxed shadow-2xs">
                  👉 Cú pháp tìm chuẩn trên Google: <span className="text-brand-700">{majorDetail.name}</span> + Điểm chuẩn 2025 + [Tên trường bạn quan tâm]
                </div>

                {/* 3 Nguyên tắc phản tư khi chọn trường */}
                <div className="space-y-2">
                  <p className="font-bold text-emerald-900">3 Nguyên tắc phản tư khi chọn trường:</p>
                  <div className="space-y-1.5 leading-relaxed">
                    <p className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-700">1.</span>
                      <span><strong className="text-emerald-900">Không chỉ nhìn điểm chuẩn 1 năm:</strong> Hãy xem xu hướng biến động điểm trong 3 năm gần nhất (2023 - 2025).</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-700">2.</span>
                      <span><strong className="text-emerald-900">Đối chiếu thực tế:</strong> So sánh kỹ khung chương trình đào tạo, mức học phí và cơ sở vật chất giữa các trường.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-700">3.</span>
                      <span><strong className="text-emerald-900">Yếu tố địa lý & Việc làm:</strong> Đánh giá cơ hội thực tập, mạng lưới doanh nghiệp kết nối tại khu vực trường đặt trụ sở.</span>
                    </p>
                  </div>
                </div>

                {/* Nút Bấm Tra Cứu Mở Rộng mở Cổng Tuyển sinh Bộ GD&ĐT */}
                <div className="pt-2 border-t border-emerald-200/60">
                  <a 
                    href="https://tuyensinh.thi.moet.gov.vn" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 shadow-sm transition-all text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    🔗 Mở Cổng thông tin Tuyển sinh chính thức Bộ GD&ĐT (tuyensinh.thi.moet.gov.vn) để xem trọn bộ danh sách
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Thông số ngành học bên phải */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông số ngành học
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mức lương lộ trình thực tế</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                      {majorDetail.average_salary_range || 'Khởi điểm: 8 - 12 triệu | Sau 3-5 năm: 15 - 30 triệu+'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mã Holland liên quan</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {majorDetail.holland_codes && majorDetail.holland_codes.map((code, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs font-bold bg-slate-100 border border-slate-200 rounded-sm uppercase text-slate-700">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nút Kích hoạt Phản tư (Debias Action Button) */}
                <div className="pt-3 border-t border-slate-100">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/student/debias-matrix?major=${encodeURIComponent(majorDetail.name)}`)}
                    className="w-full font-bold text-xs uppercase tracking-wider py-3 px-4 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  >
                    <Brain className="w-4 h-4" />
                    🧠 Đưa ngành này vào Bảng Phản Tư
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          Kho cơ sở dữ liệu Ngành học (Supabase DB)
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Tra cứu, tìm kiếm và lọc danh mục ngành đào tạo trực tiếp từ bảng majors trong PostgreSQL Supabase.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên ngành, mã ngành..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-600"
        >
          <option value="">Tất cả nhóm ngành</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedHolland}
          onChange={(e) => setSelectedHolland(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-600"
        >
          <option value="">Tất cả mã Holland</option>
          {hollandCodes.map((code, idx) => (
            <option key={idx} value={code}>Nhóm {code}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-60 bg-slate-200 rounded-sm"></div>
          <div className="h-60 bg-slate-200 rounded-sm"></div>
          <div className="h-60 bg-slate-200 rounded-sm"></div>
        </div>
      ) : dbError ? (
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-sm text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-xs font-bold text-amber-900">{dbError}</p>
          <Button variant="primary" onClick={fetchMajors} className="text-xs uppercase font-bold py-2 px-6">
            Thử lại kết nối Supabase
          </Button>
        </div>
      ) : filteredMajors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMajors.map((major) => (
            <MajorCard
              key={major.id}
              major={major}
              isBookmarked={bookmarkedIds.has(major.id)}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-slate-500 font-semibold bg-white border border-slate-200 rounded-sm">
          Không tìm thấy ngành học nào trùng khớp với bộ lọc trong CSDL Supabase.
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

export default MajorExplorer
