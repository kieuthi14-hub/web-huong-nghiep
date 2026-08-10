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
  ExternalLink, 
  GraduationCap,
  AlertTriangle 
} from 'lucide-react'

const UniversityExplorer = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const uniId = searchParams.get('id')

  const [universities, setUniversities] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)

  const [uniDetail, setUniDetail] = useState(null)
  const [offeredMajors, setOfferedMajors] = useState([])

  const regions = ['Bắc', 'Trung', 'Nam']

  useEffect(() => {
    fetchBookmarks()
    if (uniId) {
      fetchUniDetail(uniId)
    } else {
      fetchUniversities()
    }
  }, [uniId])

  const fetchBookmarks = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('student_id', user.id)
        .eq('item_type', 'university')

      if (data) setBookmarkedIds(new Set(data.map(b => b.item_id)))
    } catch (error) {
      console.warn('Chưa lấy được bookmark trường:', error)
    }
  }

  // Tải danh sách trường đại học thuần 100% từ bảng universities của Supabase DB
  const fetchUniversities = async () => {
    setIsLoading(true)
    setDbError(null)
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        setDbError('Lỗi truy vấn bảng universities từ Supabase DB.')
        setUniversities([])
      } else if (!data || data.length === 0) {
        setDbError('Bảng universities trong CSDL Supabase hiện tại đang rỗng. Thầy vui lòng nạp dữ liệu bằng file schema.sql.')
        setUniversities([])
      } else {
        setUniversities(data)
      }
    } catch (error) {
      console.error('Lỗi fetch trường học:', error)
      setDbError('Không thể kết nối với bảng universities trong Supabase DB.')
      setUniversities([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUniDetail = async (id) => {
    try {
      const { data: uni, error } = await supabase
        .from('universities')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error || !uni) {
        setUniDetail(null)
      } else {
        setUniDetail(uni)
        const { data: mappings } = await supabase
          .from('major_university_map')
          .select('*, major:major_id(*)')
          .eq('university_id', id)

        setOfferedMajors(mappings || [])
      }
    } catch (error) {
      console.error('Lỗi fetch chi tiết trường:', error)
      setUniDetail(null)
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
        setToast({ type: 'success', message: 'Đã bỏ lưu trường đại học.' })
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
        setToast({ type: 'success', message: 'Đã lưu trường đại học vào Supabase DB.' })
      }
    } catch (error) {
      console.error('Lỗi bookmark:', error)
      setToast({ type: 'error', message: 'Lỗi khi lưu trường đại học vào CSDL.' })
    }
  }

  const filteredUnis = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          uni.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion ? uni.region === selectedRegion : true

    return matchesSearch && matchesRegion
  })

  if (uniId && uniDetail) {
    const isBookmarked = bookmarkedIds.has(uniDetail.id)
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-reveal">
        <button 
          onClick={() => setSearchParams({})} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách trường
        </button>

        <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src={uniDetail.logo_url || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=200'} 
                alt={uniDetail.name}
                className="w-16 h-16 object-cover rounded-sm border border-slate-200"
              />
              <div>
                <span className="px-2 py-0.5 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-sm">
                  Khu vực Miền {uniDetail.region}
                </span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1 mb-0.5">
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
              {isBookmarked ? 'Đã lưu mục tiêu' : 'Lưu trường đại học'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-brand-600" />
                Các ngành đào tạo và điểm chuẩn tuyển sinh (từ Supabase DB)
              </h3>
              {offeredMajors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Tên Ngành đào tạo</th>
                        <th className="py-3 px-4">Khối thi</th>
                        <th className="py-3 px-4 text-right">Điểm chuẩn (2024)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offeredMajors.map((item) => (
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
                <p className="text-xs text-slate-500 italic">Chưa có thông tin danh sách ngành đào tạo trong CSDL Supabase.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông tin chung
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Khu vực địa lý</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Miền {uniDetail.region}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Học phí ước tính / năm</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {uniDetail.tuition_fee_per_year 
                        ? `${(uniDetail.tuition_fee_per_year / 1000000).toFixed(0)} triệu VND / năm`
                        : 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                {uniDetail.website && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Website chính thức</p>
                      <a 
                        href={uniDetail.website} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-600 hover:underline block mt-0.5"
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <School className="w-5 h-5 text-brand-600" />
          Danh mục Trường Đại học & Học viện (Supabase DB)
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Khám phá danh sách các cơ sở giáo dục đại học được lưu trữ trực tiếp trong bảng universities của Supabase.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
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
          <Button variant="primary" onClick={fetchUniversities} className="text-xs uppercase font-bold py-2 px-6">
            Thử lại kết nối Supabase
          </Button>
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
          Không tìm thấy trường đại học nào trùng khớp với từ khóa trong CSDL Supabase.
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
