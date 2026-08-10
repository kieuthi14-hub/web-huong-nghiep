import React from 'react'
import { Bookmark, School, MapPin, DollarSign, Globe, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../common/Button'

const UniversityCard = ({ university, isBookmarked = false, onBookmarkToggle, showLink = true }) => {
  const { id, name, code, region, website, tuition_fee_per_year, logo_url } = university

  const handleBookmarkClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onBookmarkToggle(id, 'university', isBookmarked)
  }

  const formatTuition = (fee) => {
    if (!fee) return 'Chưa có thông tin'
    return `${(fee / 1000000).toFixed(0)} triệu VND / năm`
  }

  const regionStyles = {
    'Bắc': 'bg-sky-50 text-sky-700 border-sky-200',
    'Trung': 'bg-amber-50 text-amber-700 border-amber-200',
    'Nam': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  const badgeStyle = regionStyles[region] || 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <div className="bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between p-5 rounded-sm relative group animate-reveal">
      <div>
        {/* Region & Bookmark */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className={`px-2 py-0.5 text-xs font-semibold border rounded-sm ${badgeStyle}`}>
            Miền {region}
          </span>
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-sm border transition-colors ${
              isBookmarked 
                ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:border-amber-600' 
                : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200'
            }`}
            title={isBookmarked ? 'Bỏ lưu trường học' : 'Lưu trường học'}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* University Logo & Info Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-sm bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
            {logo_url ? (
              <img src={logo_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <School className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
              {name}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Mã trường: {code}</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 mb-4">
          <div className="flex items-center text-xs text-slate-600 gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Khu vực:</span>
            <span className="font-semibold text-slate-800">Miền {region}</span>
          </div>

          <div className="flex items-center text-xs text-slate-600 gap-2">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Học phí TB:</span>
            <span className="font-semibold text-slate-800">{formatTuition(tuition_fee_per_year)}</span>
          </div>

          {website && (
            <div className="flex items-center text-xs text-slate-600 gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-medium">Website:</span>
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-600 font-semibold hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {website.replace('https://', '').replace('www.', '')}
              </a>
            </div>
          )}
        </div>
      </div>

      {showLink && (
        <div className="pt-2">
          <Link to={`/student/universities?id=${id}`} className="w-full">
            <Button variant="outline" className="w-full text-xs font-semibold py-1.5 gap-1 group-hover:bg-brand-500 group-hover:text-white transition-all">
              Xem chi tiết trường
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default UniversityCard
