import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import MajorExplorer from './MajorExplorer'
import UniversityExplorer from './UniversityExplorer'
import { 
  FileCheck2, 
  ExternalLink, 
  BookOpen, 
  Building2, 
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// Danh sách Cổng dữ liệu khách quan & Link Đề án Tuyển sinh 3 Công Khai
const VERIFICATION_LINKS = [
  {
    name: 'Cổng Tuyển sinh Quốc gia (Bộ GD&ĐT)',
    category: 'Chính thống Nhà nước',
    desc: 'Tra cứu thông tin tuyển sinh, quy chế, danh mục trường và mã ngành toàn quốc.',
    url: 'https://tuyensinh.moet.gov.vn/',
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

  // 1. Đọc Mỏ neo nhận thức ban đầu (tương thích cả cbas_anchor_data, userAnchorData và career_initial_anchor)
  const [anchor, setAnchor] = useState(() => {
    try {
      const cbas = localStorage.getItem('cbas_anchor_data')
      if (cbas) return JSON.parse(cbas)
      const userAnc = localStorage.getItem('userAnchorData')
      if (userAnc) return JSON.parse(userAnc)
      const legacy = localStorage.getItem('career_initial_anchor')
      if (legacy) {
        const parsed = JSON.parse(legacy)
        return {
          target_career: parsed.target_major,
          target_university: parsed.target_university,
          source_of_influence: parsed.choice_source,
          confidence_score: parsed.confidence_score_initial,
          holland_code: parsed.primary_code
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc anchor:', e)
    }
    return {
      target_career: 'Chưa xác định',
      target_university: '',
      source_of_influence: 'Mạng xã hội',
      confidence_score: '8',
      holland_code: 'Chưa rõ'
    }
  })

  // 2. Đọc dữ liệu đã lưu từ cbas_step3_evidence hoặc career_evidence_task
  const [cutoffScore, setCutoffScore] = useState(() => {
    try {
      const s3 = localStorage.getItem('cbas_step3_evidence')
      if (s3) return JSON.parse(s3).cutoff_score || ''
      const old = localStorage.getItem('career_evidence_task')
      if (old) return JSON.parse(old).cutoffScores || ''
    } catch (e) {}
    return ''
  })

  const [tuition, setTuition] = useState(() => {
    try {
      const s3 = localStorage.getItem('cbas_step3_evidence')
      if (s3) return JSON.parse(s3).tuition || ''
      const old = localStorage.getItem('career_evidence_task')
      if (old) return JSON.parse(old).tuitionFees || ''
    } catch (e) {}
    return ''
  })

  const [employmentRate, setEmploymentRate] = useState(() => {
    try {
      const s3 = localStorage.getItem('cbas_step3_evidence')
      if (s3) return JSON.parse(s3).employment_rate || ''
      const old = localStorage.getItem('career_evidence_task')
      if (old) return JSON.parse(old).admissionQuota || ''
    } catch (e) {}
    return ''
  })

  const [activeTab, setActiveTab] = useState('hub') // 'hub' | 'majors_db' | 'unis_db'
  const [showGuide, setShowGuide] = useState(false)

  // Hàm hỗ trợ tìm kiếm nhanh đề án tuyển sinh theo ngành/trường đã lưu từ Bước 1
  const searchUniversityAdmission = () => {
    let uniName = ''
    try {
      const storedData = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData') || localStorage.getItem('career_initial_anchor')
      if (storedData) {
        const anc = JSON.parse(storedData)
        uniName = anc.target_university || anc.targetUniversity || ''
      }
    } catch (e) {}

    if (!uniName && anchor?.target_university) {
      uniName = anchor.target_university
    }

    const queryTerm = uniName ? `Đề án tuyển sinh ${uniName} filetype:pdf` : 'Đề án tuyển sinh đại học filetype:pdf'
    const searchQuery = encodeURIComponent(queryTerm)
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank')
  }

  // Hàm mở thẳng tìm kiếm file PDF Đề án tuyển sinh chính thức của trường
  const openAdmissionPDF = () => {
    let uniName = ''
    try {
      const storedData = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData') || localStorage.getItem('career_initial_anchor')
      if (storedData) {
        const anc = JSON.parse(storedData)
        uniName = anc.target_university || anc.targetUniversity || ''
      }
    } catch (e) {}

    if (!uniName && anchor?.target_university) {
      uniName = anchor.target_university
    }

    // Mở thẳng tìm kiếm file PDF chính thức của trường
    const query = encodeURIComponent(`"Đề án tuyển sinh" "${uniName}" filetype:pdf`)
    window.open(`https://www.google.com/search?q=${query}`, '_blank')
  }

  // Hàm lưu dữ liệu thực chứng và chuyển tiếp sang Bước 4 (Tư vấn 1-1)
  const handleCompleteStep3 = async () => {
    const cutoffInput = document.getElementById('cutoffScoreInput')?.value?.trim() || cutoffScore.trim()
    const tuitionInput = document.getElementById('tuitionInput')?.value?.trim() || tuition.trim()
    const employmentInput = document.getElementById('employmentRateInput')?.value?.trim() || employmentRate.trim()

    // Kiểm tra tính hoàn thiện dữ liệu
    if (!cutoffInput || !tuitionInput) {
      alert('Em hãy tra cứu và điền đầy đủ thông tin điểm chuẩn và học phí để tiếp tục nhé!')
      return
    }

    // Thu thập dữ liệu Bước 3
    const step3EvidenceData = {
      cutoff_score: cutoffInput,
      tuition: tuitionInput,
      employment_rate: employmentInput || 'Chưa có số liệu',
      verified_at: new Date().toISOString()
    }

    // Lưu vào localStorage theo chuẩn cbas_step3_evidence
    localStorage.setItem('cbas_step3_evidence', JSON.stringify(step3EvidenceData))

    // Đồng bộ tương thích cho các tính năng cũ (career_evidence_task)
    localStorage.setItem('career_evidence_task', JSON.stringify({
      cutoffScores: cutoffInput,
      tuitionFees: tuitionInput,
      admissionQuota: employmentInput || 'Chưa có số liệu',
      completedAt: step3EvidenceData.verified_at
    }))

    // Lưu vào Supabase nếu đã đăng nhập (phục vụ nghiên cứu & báo cáo)
    if (user?.id) {
      try {
        await supabase.from('metacognitive_matrix').insert([
          {
            student_id: user.id,
            target_major: anchor?.target_career || 'Chưa rõ',
            evidence: `[BƯỚC 3 ĐỐI CHỨNG DỮ LIỆU THỰC TẾ]\n1. Điểm chuẩn 3 năm: ${cutoffInput}\n2. Mức học phí thực tế: ${tuitionInput}\n3. Tỷ lệ việc làm & Chuẩn đầu ra: ${employmentInput || 'Chưa có số liệu'}`,
            verified_sources: 'Cổng tuyển sinh Bộ GD&ĐT và Đề án tuyển sinh công khai các trường ĐH',
            risk_analysis: 'Đã hoàn thành đối chứng số liệu thực tế qua Đề án tuyển sinh.',
            bias_check: 'Chuyển hóa từ trực giác cảm tính sang phân tích định lượng (System 2).',
            detected_bias: 'DEBIASED_SYSTEM_2',
            final_decision: 'PENDING_CONSULTATION'
          }
        ])
      } catch (dbErr) {
        console.warn('Lỗi ghi Supabase Bước 3:', dbErr)
      }
    }

    // Chuyển hướng sang Bước 4
    alert('Đã lưu dữ liệu đối chứng thực tế thành công!')
    
    // Điều hướng sang Bước 4
    navigate('/student/booking')
  }

  // Đăng ký các hàm ra global window để hỗ trợ cả code vanilla inline nếu có
  useEffect(() => {
    window.searchUniversityAdmission = searchUniversityAdmission
    window.openAdmissionPDF = openAdmissionPDF
    window.handleCompleteStep3 = handleCompleteStep3
    return () => {
      delete window.searchUniversityAdmission
      delete window.openAdmissionPDF
      delete window.handleCompleteStep3
    }
  }, [cutoffScore, tuition, employmentRate, anchor])

  const targetUniDisplay = anchor?.target_university || ''
  const targetCareerDisplay = anchor?.target_career || ''

  return (
    <div className="py-6 px-4 bg-slate-50 min-h-screen">
      {/* THANH CHUYỂN TAB MỞ RỘNG */}
      <div className="max-w-[900px] mx-auto mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'hub' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📋 Bàn Đối Chứng Dữ Liệu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('majors_db')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'majors_db' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📚 Thư Viện Ngành Nghề
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unis_db')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'unis_db' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🏫 Danh Sách Trường ĐH
          </button>
        </div>

        {activeTab === 'hub' && (
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showGuide ? 'Ẩn Hướng Dẫn Đọc Đề Án' : '📖 Xem Mẹo Đọc Đề Án Tuyển Sinh'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {activeTab === 'majors_db' && (
        <div className="max-w-[1100px] mx-auto">
          <MajorExplorer />
        </div>
      )}

      {activeTab === 'unis_db' && (
        <div className="max-w-[1100px] mx-auto">
          <UniversityExplorer />
        </div>
      )}

      {activeTab === 'hub' && (
        <>
          {/* ========================================================================= */}
          {/* BƯỚC 3: ĐỐI CHỨNG DỮ LIỆU KHÁCH QUAN (CHUẨN HÓA KHOA HỌC HÀNH VI)        */}
          {/* ========================================================================= */}
          <div className="step3-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
            
            {/* TIÊU ĐỀ BƯỚC 3 */}
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', fontSize: '13px' }}>BƯỚC 3</span>
              <h2 style={{ color: '#0f172a', marginTop: '12px', fontSize: '24px' }}>Đối Chứng Dữ Liệu Khách Quan</h2>
              <p style={{ color: '#64748b', fontSize: '15px', margin: '4px 0 0 0' }}>
                Sau khi phản tư cùng AI, hãy kiểm chứng lại lựa chọn của mình bằng các số liệu chính thức từ đề án tuyển sinh để đưa ra quyết định vững chắc.
              </p>
            </div>

            {/* BANNER MỎ NEO XUẤT PHÁT ĐIỂM (TỰ ĐỘNG ĐỒNG BỘ TỪ BƯỚC 1) */}
            {targetCareerDisplay && targetCareerDisplay !== 'Chưa xác định' && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af', letterSpacing: '0.05em' }}>
                    🎯 Mục tiêu đối chứng từ Bước 1 & Bước 2:
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    Ngành: <span style={{ color: '#2563eb' }}>{targetCareerDisplay}</span>
                    {targetUniDisplay && <span> — Trường: <span style={{ color: '#0d9488' }}>{targetUniDisplay}</span></span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Độ tự tin ban đầu: <strong>{anchor?.confidence_score || '8'}/10</strong> | Nguồn ảnh hưởng: <em>{anchor?.source_of_influence || 'Mạng xã hội'}</em>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/student/debias-agent')}
                  style={{ background: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Xem lại đối thoại AI (Bước 2)</span>
                  <ExternalLink style={{ width: '12px', height: '12px' }} />
                </button>
              </div>
            )}

            {/* KHỐI 1: CÁC NGUỒN TRA CỨU CÔNG KHAI (KHÔNG CẦN TÀI KHOẢN ĐĂNG NHẬP) */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', color: '#1e293b', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔗 Cổng Thông Tin Tuyển Sinh & Đề Án Chính Thức
              </h3>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                Học sinh bấm vào liên kết bên dưới để tra cứu thông tin công khai mà không cần đăng nhập:
              </p>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="https://tuyensinh.moet.gov.vn/" target="_blank" rel="noopener noreferrer" 
                   style={{ background: '#2563eb', color: '#ffffff', textDecoration: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  🏛️ Cổng Tuyển sinh Bộ GD&ĐT
                </a>
                
                <button type="button" onClick={searchUniversityAdmission} 
                        style={{ background: '#ffffff', border: '1px solid #0284c7', color: '#0284c7', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  🔍 Tìm Đề Án Tuyển Sinh {targetUniDisplay ? `(${targetUniDisplay})` : 'Của Trường'}
                </button>
              </div>
              <small style={{ display: 'block', marginTop: '10px', color: '#64748b', fontSize: '12px' }}>
                *Mẹo: Tìm file PDF <strong>"Đề án tuyển sinh"</strong> của trường để xem chính xác bảng học phí từng kỳ và tỷ lệ sinh viên có việc làm.
              </small>
            </div>

            {/* MẸO HƯỚNG DẪN 3 BƯỚC ĐỌC SỐ LIỆU ĐỀ ÁN (COLLAPSIBLE HOẶC HIỂN THỊ KHI BẬT) */}
            {showGuide && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', color: '#0f172a', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                  <span>Hướng Dẫn 3 Bước Đọc Báo Cáo 3 Công Khai & Đề Án Tuyển Sinh</span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '13px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                    <strong style={{ color: '#0f172a' }}>1. Học phí thực tế & Lộ trình tăng:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#475569', lineHeight: 1.5 }}>
                      Tìm bảng học phí trong đề án (xem theo tín chỉ hoặc theo năm). Chú ý lộ trình tăng tối đa 10 - 15%/năm theo Nghị định 97. Đừng quên cộng chi phí sinh hoạt 4 năm (4-5 triệu/tháng tại TP lớn).
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <strong style={{ color: '#0f172a' }}>2. Tỷ lệ việc làm ĐÚNG NGÀNH:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#475569', lineHeight: 1.5 }}>
                      Xem tỷ lệ sinh viên có việc làm sau 1 năm tốt nghiệp. Đặc biệt chú ý con số làm <strong>đúng chuyên ngành đào tạo</strong> và các chuẩn đầu ra bắt buộc (ngoại ngữ IELTS/TOEIC, tin học).
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                    <strong style={{ color: '#0f172a' }}>3. Điểm chuẩn 3 năm gần nhất:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#475569', lineHeight: 1.5 }}>
                      Tra cứu điểm trúng tuyển 3 năm liên tiếp theo đúng tổ hợp em định xét (A00, A01, D01...). So sánh với điểm thi thử hiện tại để biết khoảng cách an toàn.
                    </p>
                  </div>
                </div>

                {/* Các link đại học tiêu biểu */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                    Một số Cổng Tuyển sinh & Đề án trực tiếp:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {VERIFICATION_LINKS.slice(1).map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '11px', textDecoration: 'none', padding: '4px 10px', borderRadius: '4px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>{item.badge}</span>
                        <ExternalLink style={{ width: '10px', height: '10px', color: '#64748b' }} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* KHỐI HỖ TRỢ TRA CỨU NHANH BƯỚC 3 */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ color: '#166534', marginTop: 0, fontSize: '16px' }}>
                🎯 Hướng Dẫn Tìm Nhanh Số Liệu Thực Tế (Không Lo Bị Giấu)
              </h3>
              
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '14px' }}>
                Các trường thường giấu học phí và tỷ lệ việc làm trong file đề án PDF. Hãy làm theo 2 cách dưới đây để lấy số liệu chính xác:
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {/* Nút 1: Xem điểm chuẩn 3 năm trên trang thống kê */}
                <a href="https://diemthi.tuyensinh247.com/diem-chuan.html" target="_blank" rel="noopener noreferrer"
                   style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  📊 Tra cứu Điểm chuẩn 3 năm gần nhất
                </a>

                {/* Nút 2: Tự động mở Google tìm file Đề án tuyển sinh */}
                <button type="button" onClick={openAdmissionPDF}
                        style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  📑 Tải Đề án tuyển sinh {targetUniDisplay ? `(${targetUniDisplay})` : ''} (Xem Học phí & Việc làm)
                </button>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                <strong>💡 Mẹo tìm nhanh trong file Đề án (PDF):</strong><br />
                • Nhấn <strong>Ctrl + F</strong> và gõ chữ <code>học phí</code> để xem mức thu thực tế từng năm.<br />
                • Nhấn <strong>Ctrl + F</strong> và gõ chữ <code>việc làm</code> để xem bảng khảo sát sinh viên ra trường.
              </div>
            </div>

            {/* KHỐI 2: BIỂU MẪU NHIỆM VỤ THỰC CHỨNG (HỌC SINH TỰ ĐIỀN) */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '17px', color: '#0f172a', marginTop: 0, marginBottom: '18px' }}>
                📝 Xác Nhận Số Liệu Thực Tế
              </h3>

              {/* Câu 1: Điểm chuẩn */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
                  1. Điểm chuẩn 3 năm gần nhất của ngành em chọn là bao nhiêu?
                </label>
                <input 
                  type="text" 
                  id="cutoffScoreInput" 
                  value={cutoffScore}
                  onChange={(e) => setCutoffScore(e.target.value)}
                  placeholder="Ví dụ: 2023: 25.5đ | 2024: 26.0đ | 2025: 25.8đ (Tổ hợp A00)" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
                <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  So sánh với học lực hiện tại: Em đang thừa hay thiếu bao nhiêu điểm?
                </small>
              </div>

              {/* Câu 2: Khung học phí */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
                  2. Mức học phí thực tế của trường (năm nhất và dự kiến toàn khóa):
                </label>
                <input 
                  type="text" 
                  id="tuitionInput" 
                  value={tuition}
                  onChange={(e) => setTuition(e.target.value)}
                  placeholder="Ví dụ: Khoảng 28 triệu/năm, tăng tối đa 10%/năm theo đề án" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              {/* Câu 3: Tỷ lệ việc làm & chuẩn đầu ra */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
                  3. Tỷ lệ sinh viên có việc làm đúng ngành hoặc chuẩn đầu ra yêu cầu:
                </label>
                <input 
                  type="text" 
                  id="employmentRateInput" 
                  value={employmentRate}
                  onChange={(e) => setEmploymentRate(e.target.value)}
                  placeholder="Ví dụ: Tỷ lệ việc làm công bố 89%, yêu cầu chuẩn tiếng Anh IELTS 5.5" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              {/* NÚT BẤM HOÀN THÀNH BƯỚC 3 */}
              <div style={{ textAlign: 'right' }}>
                <button 
                  type="button" 
                  onClick={handleCompleteStep3} 
                  style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  Lưu Dữ Liệu & Tiếp Tục Sang Bước 4 ➜
                </button>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}

export default FactCheckHub
