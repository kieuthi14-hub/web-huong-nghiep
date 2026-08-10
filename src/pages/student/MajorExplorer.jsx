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

const MajorExplorer = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const majorId = searchParams.get('id')

  // Trạng thái danh sách
  const [majors, setMajors] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedHolland, setSelectedHolland] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái chi tiết (nếu có id)
  const [majorDetail, setMajorDetail] = useState(null)
  const [relatedUnis, setRelatedUnis] = useState([])
  const [isDetailLoading, setIsDetailLoading] = useState(false)

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

  // Lấy danh sách bookmark của user
  const fetchBookmarks = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('student_id', user.id)
        .eq('item_type', 'major')

      if (error) throw error
      setBookmarkedIds(new Set(data.map(b => b.item_id)))
    } catch (error) {
      console.error('Lỗi tải danh sách bookmark:', error)
    }
  }

  // Tải danh sách ngành học
  const fetchMajors = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setMajors(data || [])
    } catch (error) {
      console.error('Lỗi tải danh sách ngành:', error)
      setToast({ type: 'error', message: 'Không thể tải danh sách ngành học.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Tải chi tiết ngành học và các trường đào tạo
  const fetchMajorDetail = async (id) => {
    setIsDetailLoading(true)
    try {
      // 1. Chi tiết ngành
      const { data: major, error: majorError } = await supabase
        .from('majors')
        .select('*')
        .eq('id', id)
        .single()

      if (majorError) throw majorError
      setMajorDetail(major)

      // 2. Các trường đào tạo (thông qua major_university_map join universities)
      const { data: mappings, error: mapError } = await supabase
        .from('major_university_map')
        .select('*, university:university_id(*)')
        .eq('major_id', id)

      if (mapError) throw mapError
      setRelatedUnis(mappings || [])

    } catch (error) {
      console.error('Lỗi tải chi tiết ngành:', error)
      setToast({ type: 'error', message: 'Không thể tải chi tiết ngành học.' })
    } finally {
      setIsDetailLoading(false)
    }
  }

  // Xử lý bookmark toggle
  const handleBookmarkToggle = async (itemId, itemType, isBookmarked) => {
    if (!user) return
    try {
      if (isBookmarked) {
        // Xóa bookmark
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('student_id', user.id)
          .eq('item_type', itemType)
          .eq('item_id', itemId)

        if (error) throw error
        setBookmarkedIds(prev => {
          const next = new Set(prev)
          next.delete(itemId)
          return next
        })
        setToast({ type: 'success', message: 'Đã bỏ lưu ngành học.' })
      } else {
        // Thêm bookmark
        const { error } = await supabase
          .from('saved_items')
          .insert({
            student_id: user.id,
            item_type: itemType,
            item_id: itemId
          })

        if (error) throw error
        setBookmarkedIds(prev => {
          const next = new Set(prev)
          next.add(itemId)
          return next
        })
        setToast({ type: 'success', message: 'Đã lưu ngành học vào mục tiêu.' })
      }
    } catch (error) {
      console.error('Lỗi cập nhật bookmark:', error)
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái lưu.' })
    }
  }

  // Bộ lọc danh sách ngành học
  const filteredMajors = majors.filter(major => {
    const matchesSearch = major.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          major.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (major.description && major.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory ? major.category === selectedCategory : true
    const matchesHolland = selectedHolland ? major.holland_codes.includes(selectedHolland) : true

    return matchesSearch && matchesCategory && matchesHolland
  })

  // ĐĂNG KÝ TRANG CHI TIẾT NGÀNH HỌC
  if (majorId && majorDetail) {
    const isBookmarked = bookmarkedIds.has(majorDetail.id)
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-reveal">
        {/* Back Button */}
        <button 
          onClick={() => setSearchParams({})} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>

        {/* Header Chi tiết Ngành */}
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
          {/* Cột trái: Kỹ năng & Cơ hội nghề nghiệp */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Yêu cầu kỹ năng */}
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

            {/* Triển vọng nghề nghiệp */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-brand-600" />
                Triển vọng nghề nghiệp tương lai
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {majorDetail.career_prospects}
              </p>
            </div>

            {/* Danh sách trường đào tạo */}
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

          {/* Cột phải: Thông số nhanh */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông số ngành học
              </h3>
              
              <div className="space-y-4">
                {/* Lương */}
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mức lương trung bình</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{majorDetail.average_salary_range}</p>
                  </div>
                </div>

                {/* Nhóm Holland */}
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

  // ĐĂNG KÝ DANH SÁCH NGÀNH HỌC (VIEW MẶC ĐỊNH)
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

      {/* Bộ lọc Tìm kiếm */}
      <div className="bg-white border border-slate-200 p-4 rounded-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
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

        {/* Category Filter */}
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

        {/* Holland Code Filter */}
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

      {/* Grid Danh sách Ngành */}
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
