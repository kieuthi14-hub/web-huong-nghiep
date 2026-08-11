import React from 'react'
import { Bookmark, DollarSign, Award, ChevronRight, AlertTriangle, Brain } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../common/Button'

const MajorCard = ({ major, isBookmarked = false, onBookmarkToggle, showLink = true }) => {
  const { id, name, code, category, average_salary_range, holland_codes = [], description } = major
  const navigate = useNavigate()

  const handleBookmarkClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onBookmarkToggle(id, 'major', isBookmarked)
  }

  const handleDebiasClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/student/debias-matrix?major=${encodeURIComponent(name)}`)
  }

  const categoryColors = {
    'Kỹ thuật - Công nghệ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Kinh tế - Quản lý': 'bg-amber-50 text-amber-700 border-amber-200',
    'Nghệ thuật - Thiết kế': 'bg-rose-50 text-rose-700 border-rose-200',
    'Giáo dục': 'bg-blue-50 text-blue-700 border-blue-200',
    'Y tế - Sức khỏe': 'bg-sky-50 text-sky-700 border-sky-200'
  }

  const badgeStyle = categoryColors[category] || 'bg-slate-50 text-slate-700 border-slate-200'

  // Thuật toán hiển thị Mức lương thực tế phân chia theo Lộ trình (tránh tô hồng)
  const getSalaryProgression = () => {
    if (category === 'Kỹ thuật - Công nghệ') return 'Khởi điểm: 9 - 14 triệu | Sau 3-5 năm: 18 - 35 triệu+'
    if (category === 'Kinh tế - Quản lý') return 'Khởi điểm: 8 - 12 triệu | Sau 3-5 năm: 15 - 28 triệu+'
    if (category === 'Nghệ thuật - Thiết kế') return 'Khởi điểm: 7 - 11 triệu | Sau 3-5 năm: 14 - 25 triệu+'
    if (category === 'Y tế - Sức khỏe') return 'Khởi điểm: 10 - 15 triệu | Sau 3-5 năm: 20 - 45 triệu+'
    if (category === 'Giáo dục') return 'Khởi điểm: 7 - 10 triệu | Sau 3-5 năm: 12 - 20 triệu+'
    return 'Khởi điểm: 8 - 12 triệu | Sau 3-5 năm: 15 - 30 triệu+'
  }

  // Thuật toán xác định Khung Cảnh Báo Rủi Ro (Risk Indicator) theo ngành
  const getRiskWarning = () => {
    if (name.includes('Máy tính') || name.includes('Công nghệ') || name.includes('An toàn')) {
      return '⚠️ Thách thức chính: Tỷ lệ đào thải cao & nguy cơ tự động hóa bởi AI trong 3-5 năm tới.'
    }
    if (name.includes('Quản trị') || name.includes('Kinh doanh') || name.includes('PR') || name.includes('Truyền thông')) {
      return '⚠️ Thách thức chính: Áp lực chạy KPI doanh số cao & tính cạnh tranh đào thải nhân lực gay gắt.'
    }
    if (name.includes('Thiết kế') || name.includes('Đồ họa')) {
      return '⚠️ Thách thức chính: Nguy cơ bị công cụ Generative AI thay thế các tác vụ thiết kế cơ bản.'
    }
    if (name.includes('Kế toán') || name.includes('Kiểm toán')) {
      return '⚠️ Thách thức chính: Các công việc nhập liệu thủ công đang bị phần mềm tự động hóa thay thế nhanh chóng.'
    }
    return '⚠️ Thách thức chính: Áp lực cạnh tranh nhân lực chất lượng cao & yêu cầu liên tục cập nhật kỹ năng.'
  }

  return (
    <div className="bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between p-5 rounded-sm relative group animate-reveal">
      <div>
        {/* Category & Bookmark */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className={`px-2 py-0.5 text-xs font-semibold border rounded-sm ${badgeStyle}`}>
            {category}
          </span>
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-sm border transition-colors ${
              isBookmarked 
                ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:border-amber-600' 
                : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200'
            }`}
            title={isBookmarked ? 'Bỏ lưu ngành học' : 'Lưu ngành học'}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Major Title */}
        <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-brand-600 transition-colors mb-1.5">
          {name}
        </h3>
        <p className="text-xs text-slate-400 font-semibold mb-3">Mã ngành: {code}</p>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
          {description}
        </p>

        {/* Khung Cảnh Báo Rủi Ro (Risk Indicator) */}
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-2.5 rounded-sm mb-4">
          <p className="text-[11px] font-bold leading-relaxed flex items-start gap-1">
            <span>{getRiskWarning()}</span>
          </p>
        </div>

        {/* Meta Info */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 mb-4">
          <div className="flex items-start text-xs text-slate-600 gap-2">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-500">Mức lương thực tế:</span>
              <p className="font-bold text-slate-800 text-[11px] mt-0.5 leading-snug">
                {getSalaryProgression()}
              </p>
            </div>
          </div>

          <div className="flex items-center text-xs text-slate-600 gap-2">
            <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium text-slate-500">Nhóm Holland:</span>
            <div className="flex gap-1">
              {holland_codes.map((code, idx) => (
                <span 
                  key={idx} 
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-sm border border-slate-200 uppercase"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLink && (
        <div className="pt-2 flex items-center gap-2">
          {/* Nút Phản tư nhanh màu xanh/tím */}
          <button
            onClick={handleDebiasClick}
            className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-sm transition-all flex items-center justify-center gap-1 shadow-sm"
            title="Đưa ngành học này vào Bảng Phản Tư để phân tích rủi ro"
          >
            <span>🧠 Đưa vào Phản Tư</span>
          </button>

          {/* Nút Xem chi tiết */}
          <Link to={`/student/majors?id=${id}`}>
            <Button variant="outline" className="text-[11px] font-semibold py-1.5 px-3 gap-1 hover:bg-slate-100">
              Chi tiết
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default MajorCard
