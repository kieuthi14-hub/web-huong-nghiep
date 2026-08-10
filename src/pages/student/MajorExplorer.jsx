import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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
  Check 
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
    average_salary_range: '15 - 45 triệu VND',
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
    average_salary_range: '12 - 35 triệu VND',
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
    average_salary_range: '10 - 25 triệu VND',
    career_prospects: 'Rộng mở trong các Agency quảng cáo, studio sáng tạo, công ty phát triển game và phòng marketing của mọi doanh nghiệp.',
    holland_codes: ['A', 'I', 'R']
  },
  {
    id: 'm4',
    name: 'Sư phạm Tiếng Anh',
    code: 'SPTA',
    category: 'Giáo dục',
    description: 'Ngành học trang bị kiến thức chuyên sâu về ngôn ngữ Anh cùng phương pháp sư phạm hiện đại. Sinh viên được rèn luyện kỹ năng truyền tải tri thức, thiết kế bài giảng tiếng Anh sinh động.',
    required_skills: ['Ngoại ngữ xuất sắc', 'Truyền đạt kiến thức', 'Kiên nhẫn', 'Soạn thảo giáo án'],
    average_salary_range: '8 - 20 triệu VND',
    career_prospects: 'Làm việc tại hệ thống trường học công lập, trường quốc tế, trung tâm ngoại ngữ.',
    holland_codes: ['S', 'A', 'E']
  },
  {
    id: 'm5',
    name: 'Y khoa (Bác sĩ Đa khoa)',
    code: 'YK',
    category: 'Y tế - Sức khỏe',
    description: 'Đào tạo nhân lực chất lượng cao có kiến thức y học vững vàng để khám, chẩn đoán, điều trị và chăm sóc sức khỏe ban đầu cho bệnh nhân.',
    required_skills: ['Chẩn đoán y khoa', 'Tâm lý học y tế', 'Cẩn trọng', 'Chịu áp lực tốt'],
    average_salary_range: '15 - 50 triệu VND',
    career_prospects: 'Làm việc tại bệnh viện tuyến trung ương đến địa phương, các phòng khám tư nhân chuẩn quốc tế.',
    holland_codes: ['I', 'S', 'R']
  },
  {
    id: 'm6',
    name: 'Kế toán - Kiểm toán',
    code: 'KTKT',
    category: 'Kinh tế - Quản lý',
    description: 'Chuyên ngành phân tích thông tin tài chính, xử lý nghiệp vụ ghi chép sổ sách kế toán, lập báo cáo tài chính và thực hiện kiểm toán thuế đúng quy định pháp luật.',
    required_skills: ['Tính toán chính xác', 'Sử dụng Excel chuyên sâu', 'Cẩn thận chi tiết', 'Tư duy pháp lý'],
    average_salary_range: '9 - 22 triệu VND',
    career_prospects: 'Mọi công ty đều cần kế toán để vận hành hệ thống tài chính.',
    holland_codes: ['C', 'E', 'I']
  }
]

const MajorExplorer = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const majorId = searchParams.get('id')

  const [majors, setMajors] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedHolland, setSelectedHolland] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

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

  const fetchMajors = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name', { ascending: true })

      if (error || !data || data.length === 0) {
        setMajors(fallbackMajorsList)
      } else {
        setMajors(data)
      }
    } catch (error) {
      console.warn('Dùng danh sách ngành fallback:', error)
      setMajors(fallbackMajorsList)
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
        setRelatedUnis([
          { id: 'ru1', university: { id: 'u1', name: 'Đại học Bách khoa Hà Nội', code: 'HUST', region: 'Bắc' }, subject_groups: ['A00', 'A01'], benchmark_scores_json: { 2024: 28.85 } },
          { id: 'ru2', university: { id: 'u2', name: 'Đại học Bách khoa - ĐHQG TP.HCM', code: 'HCMUT', region: 'Nam' }, subject_groups: ['A00', 'A01'], benchmark_scores_json: { 2024: 28.00 } }
        ])
      } else {
        setMajorDetail(major)
        try {
          const { data: mappings } = await supabase
            .from('major_university_map')
            .select('*, university:university_id(*)')
            .eq('major_id', id)

          setRelatedUnis(mappings || [])
        } catch (mErr) {
          console.warn('Lỗi lấy map trường:', mErr)
        }
      }
    } catch (error) {
      const found = fallbackMajorsList[0]
      setMajorDetail(found)
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
        setToast({ type: 'success', message: 'Đã lưu ngành học vào mục tiêu.' })
      }
    } catch (error) {
      console.warn('Lỗi bookmark:', error)
      setToast({ type: 'info', message: 'Đã cập nhật trạng thái mục tiêu.' })
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

        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
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
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
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

            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-brand-600" />
                Triển vọng nghề nghiệp tương lai
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {majorDetail.career_prospects}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <School className="w-4.5 h-4.5 text-brand-600" />
                Trường Đại học đào tạo ngành này
              </h3>
              {relatedUnis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Tên trường</th>
                        <th className="py-3 px-4">Vùng</th>
                        <th className="py-3 px-4">Khối thi</th>
                        <th className="py-3 px-4 text-right">Điểm chuẩn gần nhất (2024)</th>
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
                <p className="text-xs text-slate-500 italic">Chưa có thông tin trường đại học đào tạo ngành này trong CSDL.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông số ngành học
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mức lương trung bình</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{majorDetail.average_salary_range}</p>
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
          Kho cơ sở dữ liệu Ngành học
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Tra cứu, tìm kiếm và lọc danh mục ngành đào tạo dựa trên sở thích, khối thi và mã Holland.
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
          Không tìm thấy ngành học nào trùng khớp với bộ lọc.
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
