import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import UniversityCard from '../../components/career/UniversityCard'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  Search, 
  School, 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Globe, 
  GraduationCap, 
  Bookmark,
  Check 
} from 'lucide-react'

const UniversityExplorer = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const uniId = searchParams.get('id')

  // Trạng thái danh sách
  const [unis, setUnis] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [maxTuition, setMaxTuition] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Trạng thái chi tiết (nếu có id)
  const [uniDetail, setUniDetail] = useState(null)
  const [relatedMajors, setRelatedMajors] = useState([])
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const regions = ['Bắc', 'Trung', 'Nam']

  useEffect(() => {
    fetchBookmarks()
    if (uniId) {
      fetchUniDetail(uniId)
    } else {
      fetchUnis()
    }
  }, [uniId])

  // Lấy danh sách bookmark trường của user
  const fetchBookmarks = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('student_id', user.id)
        .eq('item_type', 'university')

      if (error) throw error
      setBookmarkedIds(new Set(data.map(b => b.item_id)))
    } catch (error) {
      console.error('Lỗi tải danh sách bookmark:', error)
    }
  }

  // Tải danh sách trường
  const fetchUnis = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setUnis(data || [])
    } catch (error) {
      console.error('Lỗi tải danh sách trường:', error)
      setToast({ type: 'error', message: 'Không thể tải danh sách trường học.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Tải chi tiết trường và các ngành đào tạo
  const fetchUniDetail = async (id) => {
    setIsDetailLoading(true)
    try {
      // 1. Chi tiết trường
      const { data: uni, error: uniError } = await supabase
        .from('universities')
        .select('*')
        .eq('id', id)
        .single()

      if (uniError) throw uniError
      setUniDetail(uni)

      // 2. Các ngành đào tạo (major_university_map join majors)
      const { data: mappings, error: mapError } = await supabase
        .from('major_university_map')
        .select('*, major:major_id(*)')
        .eq('university_id', id)

      if (mapError) throw mapError
      setRelatedMajors(mappings || [])

    } catch (error) {
      console.error('Lỗi tải chi tiết trường:', error)
      setToast({ type: 'error', message: 'Không thể tải chi tiết trường học.' })
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
        setToast({ type: 'success', message: 'Đã bỏ lưu trường học.' })
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
        setToast({ type: 'success', message: 'Đã lưu trường học vào mục tiêu.' })
      }
    } catch (error) {
      console.error('Lỗi cập nhật bookmark:', error)
      setToast({ type: 'error', message: 'Không thể cập nhật trạng thái lưu.' })
    }
  }

  // Định dạng học phí
  const formatTuition = (fee) => {
    if (!fee) return 'Chưa rõ'
    return `${(fee / 1000000).toFixed(0)} triệu VND/năm`
  }

  // Bộ lọc danh sách trường
  const filteredUnis = unis.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          uni.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = selectedRegion ? uni.region === selectedRegion : true
    
    const matchesTuition = maxTuition 
      ? uni.tuition_fee_per_year <= Number(maxTuition) * 1000000 
      : true

    return matchesSearch && matchesRegion && matchesTuition
  })

  // ĐĂNG KÝ TRANG CHI TIẾT TRƯỜNG ĐẠI HỌC
  if (uniId && uniDetail) {
    const isBookmarked = bookmarkedIds.has(uniDetail.id)
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

        {/* Header Chi tiết Trường */}
        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-bold overflow-hidden flex-shrink-0">
                {uniDetail.logo_url ? (
                  <img src={uniDetail.logo_url} alt={uniDetail.name} className="w-full h-full object-cover" />
                ) : (
                  <School className="w-8 h-8" />
                )}
              </div>
              <div>
                <span className="px-2 py-0.5 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-sm">
                  Miền {uniDetail.region}
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-2 mb-1">
                  {uniDetail.name}
                </h1>
                <p className="text-xs text-slate-400 font-bold">Mã trường: {uniDetail.code}</p>
              </div>
            </div>
            <Button
              variant={isBookmarked ? 'accent' : 'outline'}
              onClick={() => handleBookmarkToggle(uniDetail.id, 'university', isBookmarked)}
              className="font-bold text-xs uppercase py-2 px-4 gap-1.5 self-start"
            >
              {isBookmarked ? 'Đã lưu mục tiêu' : 'Lưu trường học'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cột trái: Danh sách ngành đào tạo tại trường */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-brand-600" />
                Các ngành đào tạo trọng điểm
              </h3>
              
              {relatedMajors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Tên ngành</th>
                        <th className="py-3 px-4">Khối thi</th>
                        <th className="py-3 px-4 text-right">Điểm chuẩn gần nhất (2024)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedMajors.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <Link 
                              to={`/student/majors?id=${item.major?.id}`}
                              className="font-bold text-brand-600 hover:underline"
                            >
                              {item.major?.name} ({item.major?.code})
                            </Link>
                          </td>
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
                <p className="text-xs text-slate-500 italic">Chưa có thông tin các ngành đào tạo của trường trong CSDL.</p>
              )}
            </div>
          </div>

          {/* Cột phải: Thông số nhanh */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông số trường học
              </h3>
              
              <div className="space-y-4">
                {/* Khu vực */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Khu vực địa lý</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Miền {uniDetail.region}</p>
                  </div>
                </div>

                {/* Học phí */}
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Học phí trung bình</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{formatTuition(uniDetail.tuition_fee_per_year)}</p>
                  </div>
                </div>

                {/* Website */}
                {uniDetail.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Website chính thức</p>
                      <a 
                        href={uniDetail.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-bold text-brand-600 hover:underline block truncate mt-0.5"
                      >
                        {uniDetail.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )
  }

  // DANH SÁCH TRƯỜNG ĐẠI HỌC (VIEW MẶC ĐỊNH)
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <School className="w-5 h-5 text-brand-600" />
          Kho cơ sở dữ liệu Trường Đại học
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Tra cứu, tìm kiếm và định hướng các trường Đại học/Cao đẳng trọng điểm dựa trên vùng miền và học phí.
        </p>
      </div>

      {/* Bộ lọc Tìm kiếm */}
      <div className="bg-white border border-slate-200 p-4 rounded-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên trường, mã trường..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
          />
        </div>

        {/* Region Filter */}
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-600"
        >
          <option value="">Tất cả khu vực</option>
          {regions.map((reg, idx) => (
            <option key={idx} value={reg}>Miền {reg}</option>
          ))}
        </select>

        {/* Tuition Fee Filter */}
        <select
          value={maxTuition}
          onChange={(e) => setMaxTuition(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-600"
        >
          <option value="">Mọi mức học phí</option>
          <option value="35">Dưới 35 triệu / năm</option>
          <option value="50">Dưới 50 triệu / năm</option>
          <option value="70">Dưới 70 triệu / năm</option>
        </select>
      </div>

      {/* Grid Danh sách Trường */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-sm"></div>
          <div className="h-44 bg-slate-200 rounded-sm"></div>
          <div className="h-44 bg-slate-200 rounded-sm"></div>
        </div>
      ) : filteredUnis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnis.map((uni) => (
            <UniversityCard
              key={uni.id}
              university={uni}
              isBookmarked={bookmarkedIds.has(uni.id)}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-slate-500 font-semibold bg-white border border-slate-200 rounded-sm">
          Không tìm thấy trường đại học nào trùng khớp với bộ lọc.
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

export default UniversityExplorer
