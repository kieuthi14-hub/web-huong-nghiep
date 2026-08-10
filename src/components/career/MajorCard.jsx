import React from 'react'
import { Bookmark, Sparkles, DollarSign, Award, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../common/Button'

const MajorCard = ({ major, isBookmarked = false, onBookmarkToggle, showLink = true }) => {
  const { id, name, code, category, average_salary_range, holland_codes = [], description } = major

  const handleBookmarkClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onBookmarkToggle(id, 'major', isBookmarked)
  }

  const categoryColors = {
    'Kỹ thuật - Công nghệ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Kinh tế - Quản lý': 'bg-amber-50 text-amber-700 border-amber-200',
    'Nghệ thuật - Thiết kế': 'bg-rose-50 text-rose-700 border-rose-200',
    'Giáo dục': 'bg-blue-50 text-blue-700 border-blue-200',
    'Y tế - Sức khỏe': 'bg-sky-50 text-sky-700 border-sky-200'
  }

  const badgeStyle = categoryColors[category] || 'bg-slate-50 text-slate-700 border-slate-200'

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
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 mb-4">
          <div className="flex items-center text-xs text-slate-600 gap-2">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Mức lương:</span>
            <span className="font-semibold text-slate-800">{average_salary_range}</span>
          </div>

          <div className="flex items-center text-xs text-slate-600 gap-2">
            <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Nhóm Holland:</span>
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
        <div className="pt-2">
          <Link to={`/student/majors?id=${id}`} className="w-full">
            <Button variant="outline" className="w-full text-xs font-semibold py-1.5 gap-1 group-hover:bg-brand-500 group-hover:text-white transition-all">
              Xem chi tiết ngành
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default MajorCard
