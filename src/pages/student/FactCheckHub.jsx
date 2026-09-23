import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import MajorExplorer from './MajorExplorer'
import UniversityExplorer from './UniversityExplorer'
import { 
  FileCheck2, 
  ExternalLink, 
  HelpCircle, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Building2, 
  GraduationCap, 
  Coins, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Compass,
  FileSpreadsheet,
  BookOpen,
  Info
} from 'lucide-react'

// Danh sách Cổng dữ liệu khách quan & Link Đề án Tuyển sinh 3 Công Khai
const VERIFICATION_LINKS = [
  {
    name: 'Cổng Tuyển sinh Quốc gia (Bộ GD&ĐT)',
    category: 'Chính thống Nhà nước',
    desc: 'Tra cứu thông tin tuyển sinh, quy chế, danh mục trường và mã ngành toàn quốc.',
    url: 'https://thisinh.thitotnghiepthpt.edu.vn',
    badge: 'Bộ GD&ĐT',
    color: 'border-blue-300 bg-blue-50/70 text-blue-900'
  },
  {
    name: 'Báo cáo 3 Công khai & Đề án TS ĐH Bách Khoa (ĐHQG)',
    category: 'Khối Kỹ thuật - Công nghệ',
    desc: 'Xem học phí thực tế từng học kỳ, chỉ tiêu từng phương thức và kiểm định quốc tế.',
    url: 'https://ts.hcmut.edu.vn',
    badge: 'Bách Khoa',
    color: 'border-sky-300 bg-sky-50/70 text-sky-900'
  },
  {
    name: 'Đề án Tuyển sinh & Học phí ĐH Kinh Tế (UEH / NEU)',
    category: 'Khối Kinh tế - Quản lý',
    desc: 'Minh bạch học phí chương trình chuẩn và tiếng Anh, lộ trình tăng học phí tự chủ 10-15%/năm.',
    url: 'https://tuyensinh.ueh.edu.vn',
    badge: 'Kinh tế',
    color: 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
  },
  {
    name: 'Báo cáo Tuyển sinh ĐH Y Dược (TP.HCM / Hà Nội)',
    category: 'Khối Y - Dược - Sức khỏe',
    desc: 'Học phí tự chủ mới nhất, tỷ lệ đào thải thực tập viện và điểm chuẩn qua các năm.',
    url: 'https://ump.edu.vn',
    badge: 'Y Dược',
    color: 'border-rose-300 bg-rose-50/70 text-rose-900'
  },
  {
    name: 'Cổng Tuyển sinh ĐH Sư Phạm (HN / TP.HCM / Quy Nhơn)',
    category: 'Khối Sư phạm - Giáo dục',
    desc: 'Chính sách hỗ trợ sinh hoạt phí theo Nghị định 116 và cam kết cống hiến ngành.',
    url: 'https://tuyensinh.hnue.edu.vn',
    badge: 'Sư phạm',
    color: 'border-amber-300 bg-amber-50/70 text-amber-900'
  },
  {
    name: 'Đề án TS ĐH Khoa học Xã hội & Nhân văn (ĐHQG)',
    category: 'Khối KHXH & Nhân văn',
    desc: 'Số liệu việc làm cử nhân sau 1 năm tốt nghiệp và điểm chuẩn từng tổ hợp C00, D01, D14.',
    url: 'https://hcmussh.edu.vn/tuyensinh',
    badge: 'KHXH&NV',
    color: 'border-purple-300 bg-purple-50/70 text-purple-900'
  }
]

const FactCheckHub = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // 1. Đọc Mỏ neo ban đầu (Bước 1)
  const [anchor, setAnchor] = useState(() => {
    try {
      const saved = localStorage.getItem('career_initial_anchor')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  // 2. Nhiệm vụ thực chứng (3 ô số liệu)
  const [evidenceData, setEvidenceData] = useState(() => {
    try {
      const saved = localStorage.getItem('career_evidence_task')
      return saved ? JSON.parse(saved) : {
        cutoffScores: '',
        tuitionFees: '',
        admissionQuota: ''
      }
    } catch (e) {
      return { cutoffScores: '', tuitionFees: '', admissionQuota: '' }
    }
  })

  const [activeTab, setActiveTab] = useState('split_hub') // 'split_hub' | 'majors_db' | 'unis_db'
  const [toast, setToast] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // Kiểm tra xem đã điền đủ cả 3 ô chưa
  useEffect(() => {
    const valid = Boolean(
      evidenceData.cutoffScores?.trim().length >= 10 &&
      evidenceData.tuitionFees?.trim().length >= 10 &&
      evidenceData.admissionQuota?.trim().length >= 10
    )
    setIsUnlocked(valid)
  }, [evidenceData])

  const handleInputChange = (field, value) => {
    setEvidenceData(prev => {
      const updated = { ...prev, [field]: value }
      localStorage.setItem('career_evidence_task', JSON.stringify(updated))
      return updated
    })
  }

  // Lưu & Chuyển sang Bước 4
  const handleCompleteEvidenceTask = async () => {
    if (!isUnlocked) {
      setToast({
        type: 'warning',
        message: 'Em cần tự tay tra cứu và điền đầy đủ cả 3 ô số liệu thực chứng để mở khóa Bước 4!'
      })
      return
    }

    setIsSaving(true)
    try {
      localStorage.setItem('career_evidence_task', JSON.stringify({
        ...evidenceData,
        verifiedAt: new Date().toISOString()
      }))

      if (user?.id) {
        // Lưu kèm vào metacognitive_matrix hoặc logs nếu có thể
        try {
          await supabase.from('metacognitive_matrix').insert([
            {
              student_id: user.id,
              target_major: anchor?.targetMajor || 'Chưa rõ',
              evidence: `[BƯỚC 3 ĐỐI CHỨNG DỮ LIỆU THỰC TẾ]\n1. Điểm chuẩn 3 năm: ${evidenceData.cutoffScores}\n2. Học phí dự kiến 4 năm: ${evidenceData.tuitionFees}\n3. Chỉ tiêu & Cạnh tranh: ${evidenceData.admissionQuota}`,
              verified_sources: 'Cổng tuyển sinh Bộ GD&ĐT và Đề án 3 công khai các trường ĐH',
              risk_analysis: 'Đã hoàn thành bước phân tích số liệu thực tế.',
              bias_check: 'Chuyển đổi từ trực giác cảm tính sang phân tích định lượng.',
              detected_bias: 'DEBIASED_SYSTEM_2',
              final_decision: 'PENDING_CONSULTATION'
            }
          ])
        } catch (dbErr) {
          console.warn('Lỗi ghi Supabase Bước 3:', dbErr)
        }
      }

      setToast({
        type: 'success',
        message: '🎉 Xuất sắc! Đã hoàn thành nhiệm vụ thực chứng. Đang chuyển sang Bước 4: Tư vấn 1-1!'
      })

      setTimeout(() => {
        navigate('/student/booking')
      }, 1200)
    } catch (err) {
      console.error('Lỗi khi hoàn thành Bước 3:', err)
      setToast({ type: 'error', message: 'Có lỗi xảy ra, vui lòng thử lại.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-reveal">
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* HEADER TIÊU ĐỀ BƯỚC 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-md shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span>3️⃣ Đối chứng Dữ liệu Khách quan</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full">
              System 2 Verification Hub
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kích hoạt tư duy phân tích số liệu (Hệ thống 2): Tự tay tra cứu Đề án tuyển sinh & Báo cáo 3 công khai để kiểm chứng những cảnh báo của AI ở Bước 2.
          </p>
        </div>

        {/* Tab switch giữa Split Screen Hub và Tra cứu mở rộng */}
        <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-sm text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('split_hub')}
            className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'split_hub' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📋 Bàn Thực Chứng (2 Cột)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('majors_db')}
            className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'majors_db' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📚 Thư Viện Ngành Nghề
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unis_db')}
            className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'unis_db' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🏫 Danh Sách Trường ĐH
          </button>
        </div>
      </div>

      {activeTab === 'majors_db' && <MajorExplorer />}
      {activeTab === 'unis_db' && <UniversityExplorer />}

      {activeTab === 'split_hub' && (
        <div className="space-y-6">
          {/* MỎ NEO BAN ĐẦU CẦN ĐỐI CHỨNG */}
          {anchor?.targetMajor && (
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-sm shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 text-blue-200 rounded-sm uppercase tracking-wider">
                  MỤC TIÊU CẦN THỰC CHỨNG TỪ BƯỚC 1 & BƯỚC 2:
                </span>
                <h3 className="text-base font-extrabold tracking-tight">
                  Ngành: <span className="text-amber-300">{anchor.targetMajor}</span>
                  {anchor.targetUniversity && <span> — Trường: <span className="text-blue-200">{anchor.targetUniversity}</span></span>}
                </h3>
                <p className="text-xs text-blue-200 font-medium">
                  Độ tự tin ban đầu: <strong>{anchor.confidenceScore || 8}/10</strong>. Hãy dùng các nguồn dữ liệu bên dưới để chứng minh niềm tin này có dựa trên sự thật hay không!
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/student/debias-agent')}
                className="text-xs font-bold px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-sm shrink-0 transition-all flex items-center gap-1.5"
              >
                <span>Xem lại chất vấn AI (Bước 2)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* BỐ CỤC 2 CỘT (SPLIT SCREEN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI: CỔNG DỮ LIỆU KHÁCH QUAN (VERIFICATION HUB) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <div className="p-1.5 bg-blue-100 text-blue-800 rounded-sm">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      1. HƯỚNG DẪN 3 BƯỚC ĐỌC SỐ LIỆU THẬT
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Bí quyết tránh bẫy truyền thông và thông tin tô hồng trên mạng
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Hướng dẫn 1 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">Cách đọc Báo cáo 3 Công khai để xem Học phí thật</h4>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        Tìm mục <strong>"Công khai cam kết chất lượng đào tạo & thu chi tài chính"</strong> trên website trường. Chú ý bảng học phí từng kỳ và điều khoản <em>"Lộ trình tăng học phí tối đa 10-15% mỗi năm học"</em> theo Nghị định 97/2023. Hãy nhân tổng số tín chỉ (thường 130 - 150 tín chỉ) với đơn giá tín chỉ để ra số tiền thật.
                      </p>
                    </div>
                  </div>

                  {/* Hướng dẫn 2 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">Cách xem Tỷ lệ có Việc làm ĐÚNG NGÀNH sau 1 năm</h4>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        Nhiều trường công bố con số 95-98% có việc làm, nhưng đó là <em>tổng số có việc làm chung (bao gồm chạy xe công nghệ, bán hàng online, làm trái ngành)</em>. Em phải kéo xuống bảng chi tiết: Tỷ lệ sinh viên làm <strong>đúng chuyên ngành đào tạo</strong> và mức thu nhập bình quân thực tế.
                      </p>
                    </div>
                  </div>

                  {/* Hướng dẫn 3 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">Cách đối chiếu Điểm chuẩn 3 năm gần nhất</h4>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        Ghi lại điểm chuẩn của ngành theo đúng tổ hợp xét tuyển em nhắm tới (A00, B00, D01...) trong 3 năm liên tiếp. So sánh với <strong>điểm thi thử thực tế hiện tại</strong> của em. Nếu điểm chuẩn cao hơn năng lực hiện tại từ 2.5 - 3 điểm trở lên, em bắt buộc phải có phương án nguyện vọng dự phòng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH LINK ĐỐI CHỨNG CHÍNH THỐNG */}
              <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                        2. CỔNG DỮ LIỆU CHÍNH THỐNG & ĐỀ ÁN 3 CÔNG KHAI
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Bấm để mở trực tiếp tài liệu tuyển sinh chính thức
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {VERIFICATION_LINKS.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 border rounded-sm transition-all hover:shadow-xs flex items-start justify-between gap-3 group ${item.color}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold group-hover:underline">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-white/80 border border-current">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: NHIỆM VỤ THỰC CHỨNG (EVIDENCE TASK) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-white border-2 border-blue-400 rounded-sm p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-sm">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                        NHIỆM VỤ THỰC CHỨNG (BẮT BUỘC ĐIỀN 3 Ô)
                      </h2>
                      <p className="text-[11px] text-blue-700 font-semibold">
                        Tự tay điền 3 số liệu thực tế để kích hoạt Hệ thống 2 & mở khóa Bước 4
                      </p>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-sm text-[11px] font-extrabold flex items-center gap-1 border ${
                    isUnlocked 
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isUnlocked ? 'ĐÃ ĐỦ ĐIỀU KIỆN' : 'CHƯA MỞ KHÓA'}</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Ô 1: Điểm chuẩn 3 năm */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span>Ô 1: Điểm chuẩn 3 năm gần nhất của ngành em chọn là bao nhiêu?</span>
                      </span>
                      <span className="text-[10px] text-rose-500 font-bold">* Bắt buộc</span>
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ghi rõ điểm chuẩn từng năm (VD: Năm 2023: 26.5; Năm 2024: 27.2; Năm 2025: 27.0) và so sánh cụ thể với điểm thi thử hiện tại của em (thiếu bao nhiêu điểm?).
                    </p>
                    <textarea
                      rows={3}
                      value={evidenceData.cutoffScores}
                      onChange={(e) => handleInputChange('cutoffScores', e.target.value)}
                      placeholder="VD: Điểm chuẩn ngành CNTT trường Bách Khoa: 2023: 27.5; 2024: 28.1; 2025: 27.8. Lực học thi thử của em tổ hợp A00 hiện tại đạt khoảng 24.5 điểm, đang cách điểm chuẩn 3.3 điểm..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-sm focus:border-blue-600 focus:bg-white focus:outline-none font-medium text-slate-800 leading-relaxed placeholder:text-slate-400"
                    />
                  </div>

                  {/* Ô 2: Học phí năm nhất & 4 năm */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-600" />
                        <span>Ô 2: Học phí năm nhất và dự kiến tổng 4 năm là bao nhiêu tiền?</span>
                      </span>
                      <span className="text-[10px] text-rose-500 font-bold">* Bắt buộc</span>
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tính toán sau khi cộng mức tăng học phí tự chủ 10-15%/năm + chi phí ăn ở sinh hoạt tại thành phố lớn.
                    </p>
                    <textarea
                      rows={3}
                      value={evidenceData.tuitionFees}
                      onChange={(e) => handleInputChange('tuitionFees', e.target.value)}
                      placeholder="VD: Học phí năm nhất là 32 triệu/năm. Với lộ trình tăng 10%/năm, tổng 4 năm học phí khoảng 150 triệu. Chi phí ăn ở ký túc xá/trọ khoảng 4-5 triệu/tháng. Tổng kinh phí 4 năm rơi vào khoảng 350-400 triệu đồng. Gia đình em đã thảo luận và chuẩn bị nguồn lực..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-sm focus:border-blue-600 focus:bg-white focus:outline-none font-medium text-slate-800 leading-relaxed placeholder:text-slate-400"
                    />
                  </div>

                  {/* Ô 3: Chỉ tiêu tuyển sinh & Tỷ lệ cạnh tranh */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>Ô 3: Chỉ tiêu tuyển sinh năm nay và tỷ lệ cạnh tranh thực tế?</span>
                      </span>
                      <span className="text-[10px] text-rose-500 font-bold">* Bắt buộc</span>
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Số chỉ tiêu dành cho phương thức em xét tuyển (Điểm thi tốt nghiệp THPT, ĐGNL, hay Học bạ)?
                    </p>
                    <textarea
                      rows={3}
                      value={evidenceData.admissionQuota}
                      onChange={(e) => handleInputChange('admissionQuota', e.target.value)}
                      placeholder="VD: Tổng chỉ tiêu ngành là 300 sinh viên, trong đó xét điểm thi tốt nghiệp THPT chỉ còn 40% (khoảng 120 chỉ tiêu), còn lại xét ĐGNL và chứng chỉ quốc tế. Tỷ lệ cạnh tranh rất cao..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-sm focus:border-blue-600 focus:bg-white focus:outline-none font-medium text-slate-800 leading-relaxed placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* BANNER HƯỚNG DẪN HOÀN THÀNH */}
                <div className={`p-3 rounded-sm text-xs border flex items-start gap-2.5 ${
                  isUnlocked 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    {isUnlocked 
                      ? 'Em đã hoàn thành xuất sắc 3 bài toán số liệu thực tế! Hệ thống đã ghi nhận tư duy phản tư định lượng của em. Hãy bấm nút dưới đây để sang Bước 4.'
                      : 'Học sinh cần điền đầy đủ, chi tiết cả 3 ô số liệu (tối thiểu 10 ký tự mỗi ô) để mở khóa nút Chuyển sang Bước 4.'}
                  </p>
                </div>

                {/* NÚT CHUYỂN SANG BƯỚC 4 */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!isUnlocked || isSaving}
                    onClick={handleCompleteEvidenceTask}
                    className={`w-full py-3 px-4 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm shadow-xs transition-all ${
                      isUnlocked 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer animate-pulse' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{isSaving ? 'Đang lưu số liệu...' : 'Xác Nhận Số Liệu & Sang Bước 4: Tư Vấn 1-1 Đối Chứng Thực Tế'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FactCheckHub
