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

  const isUniDetermined = Boolean(
    anchor?.target_university && 
    anchor.target_university.trim() !== '' &&
    !anchor.target_university.toLowerCase().includes('chưa xác định')
  )
  const targetUniDisplay = isUniDetermined ? anchor.target_university.trim() : ''

  const isCareerDetermined = Boolean(
    anchor?.target_career && 
    anchor.target_career.trim() !== '' &&
    !anchor.target_career.toLowerCase().includes('chưa xác định')
  )
  const targetCareerDisplay = isCareerDetermined ? anchor.target_career.trim() : ''

  // Mở tìm kiếm Đề án tuyển sinh kèm học phí
  const openAdmissionPDF = () => {
    const storedData = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData") || localStorage.getItem("career_initial_anchor")
    let uniName = ""
    if (storedData) {
      try {
        const anc = JSON.parse(storedData)
        const raw = anc.target_university || anc.targetUniversity || ""
        if (raw && !raw.toLowerCase().includes('chưa xác định')) {
          uniName = raw.trim()
        }
      } catch (e) {}
    }

    if (!uniName && targetUniDisplay) {
      uniName = targetUniDisplay
    }

    const query = uniName 
      ? encodeURIComponent(`"Đề án tuyển sinh" "${uniName}" "học phí" filetype:pdf`)
      : encodeURIComponent(`"Đề án tuyển sinh" "học phí" filetype:pdf`)
    window.open(`https://www.google.com/search?q=${query}`, "_blank")
  }

  // Xử lý kiểm tra dữ liệu bắt buộc và chuyển tiếp
  const handleCompleteStep3 = async () => {
    const cutoffVal = document.getElementById("cutoffScoreInput")?.value?.trim() || cutoffScore.trim()
    const tuitionVal = document.getElementById("tuitionInput")?.value?.trim() || tuition.trim()
    const employmentVal = document.getElementById("employmentRateInput")?.value?.trim() || employmentRate.trim()

    // Kiểm tra bắt buộc điền cả 3 mục
    if (!cutoffVal || !tuitionVal || !employmentVal) {
      alert("Em bắt buộc phải điền đầy đủ cả 3 mục số liệu để mở khóa Bước 4 nhé!")
      return
    }

    // Đóng gói dữ liệu thực chứng
    const step3Evidence = {
      cutoff_score: cutoffVal,
      tuition: tuitionVal,
      employment_rate: employmentVal,
      timestamp: new Date().toLocaleString(),
      verified_at: new Date().toISOString()
    }

    localStorage.setItem("cbas_step3_evidence", JSON.stringify(step3Evidence))
    
    // Đồng bộ tương thích cho các tính năng cũ (career_evidence_task)
    localStorage.setItem("career_evidence_task", JSON.stringify({
      cutoffScores: cutoffVal,
      tuitionFees: tuitionVal,
      admissionQuota: employmentVal,
      completedAt: step3Evidence.timestamp
    }))

    // Lưu vào Supabase nếu đã đăng nhập (phục vụ nghiên cứu & báo cáo)
    if (user?.id) {
      try {
        await supabase.from('metacognitive_matrix').insert([
          {
            student_id: user.id,
            target_major: targetCareerDisplay || 'Chưa rõ',
            evidence: `[BƯỚC 3 ĐỐI CHỨNG DỮ LIỆU THỰC TẾ]\n1. Điểm chuẩn 3 năm: ${cutoffVal}\n2. Mức học phí thực tế: ${tuitionVal}\n3. Tỷ lệ việc làm & Chuẩn đầu ra: ${employmentVal}`,
            verified_sources: 'Cổng thông tin tuyển sinh và Đề án tuyển sinh công khai các trường ĐH',
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

    alert("Dữ liệu thực chứng đã được ghi nhận thành công! Chuẩn bị chuyển sang Bước 4.")
    navigate('/student/booking')
  }

  // Đăng ký các hàm ra global window để hỗ trợ cả code vanilla inline nếu có
  useEffect(() => {
    window.openAdmissionPDF = openAdmissionPDF
    window.handleCompleteStep3 = handleCompleteStep3
    return () => {
      delete window.openAdmissionPDF
      delete window.handleCompleteStep3
    }
  }, [cutoffScore, tuition, employmentRate, anchor, targetUniDisplay])

  return (
    <div className="py-6 px-4 bg-slate-50 min-h-screen">
      {/* THANH CHUYỂN TAB MỞ RỘNG */}
      <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between gap-2 flex-wrap">
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
            <span>{showGuide ? 'Ẩn Cổng Tra Cứu Khác' : '🔗 Xem Cổng Tuyển Sinh Bộ GD&ĐT'}</span>
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
          {/* CỔNG TRA CỨU KHÁC (KHI BẬT) */}
          {showGuide && (
            <div style={{ maxWidth: '850px', margin: '0 auto 20px auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>🏛️ Cổng Tuyển sinh Chính thức & Đề án mẫu:</strong>
                <a href="https://tuyensinh.moet.gov.vn/" target="_blank" rel="noopener noreferrer" 
                   style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Cổng Bộ GD&ĐT ➜
                </a>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {VERIFICATION_LINKS.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', textDecoration: 'none', padding: '4px 10px', borderRadius: '4px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{item.badge}</span>
                    <ExternalLink style={{ width: '10px', height: '10px', color: '#64748b' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* KHỐI TRA CỨU ĐỐI CHỨNG DỮ LIỆU BƯỚC 3                                     */}
          {/* ========================================================================= */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', maxWidth: '850px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            
            <div style={{ marginBottom: '20px' }}>
              <span style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', fontSize: '12px' }}>BƯỚC 3: BẮT BUỘC THỰC HIỆN</span>
              <h2 style={{ color: '#0f172a', marginTop: '10px', fontSize: '22px' }}>Đối Chứng Dữ Liệu Khách Quan</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Để mở khóa buổi Tư vấn 1-1 (Bước 4), em <strong>bắt buộc phải tra cứu và điền đầy đủ</strong> các số liệu thực tế dưới đây để đối soát với mức độ tự tin ban đầu.
              </p>
            </div>

            {/* BANNER MỎ NEO XUẤT PHÁT ĐIỂM (TỰ ĐỘNG ĐỒNG BỘ TỪ BƯỚC 1) */}
            {targetCareerDisplay && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af', letterSpacing: '0.05em' }}>
                    🎯 Mục tiêu đối chứng từ Bước 1 & Bước 2:
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
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

            {/* CÁC NÚT TRA CỨU ĐÃ ĐƯỢC CHUẨN HÓA ĐƯỜNG DẪN CHÍNH XÁC */}
            <div style={{ background: '#f8fafc', borderLeft: '4px solid #2563eb', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                🔍 Cổng dữ liệu đối chứng trực tiếp (Bấm để tra cứu):
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Nút 1: Vào thẳng cổng tra cứu điểm chuẩn & học phí của VnExpress */}
                <a href="https://diemthi.vnexpress.net/tra-cuu-dai-hoc" target="_blank" rel="noopener noreferrer"
                   style={{ background: '#2563eb', color: '#ffffff', textDecoration: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  📊 Tra cứu Điểm chuẩn & Học phí (VnExpress)
                </a>

                {/* Nút 2: Cổng Tuyensinh247 có lịch sử điểm chuẩn đa năm */}
                <a href="https://diemthi.tuyensinh247.com/diem-chuan.html" target="_blank" rel="noopener noreferrer"
                   style={{ background: '#0284c7', color: '#ffffff', textDecoration: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  📈 Xem Lịch Sử Điểm Chuẩn (Tuyensinh247)
                </a>

                {/* Nút 3: Tìm file Đề án tuyển sinh gốc của trường */}
                <button type="button" onClick={openAdmissionPDF}
                        style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  📑 Tải Đề Án Tuyển Sinh {targetUniDisplay ? `(${targetUniDisplay})` : '(Gốc)'}
                </button>
              </div>
              <small style={{ display: 'block', marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
                *Lưu ý: Học sinh mở các cổng trên để tìm số liệu thật, sau đó điền vào 3 ô bắt buộc bên dưới để mở khóa Bước 4.
              </small>
            </div>

            {/* BIỂU MẪU BẮT BUỘC ĐIỀN (REQUIRED) */}
            <form id="step3Form" onSubmit={(e) => { e.preventDefault(); handleCompleteStep3(); }}>
              
              {/* Mục 1: Điểm chuẩn */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>
                  1. Điểm chuẩn ngành em chọn (Năm gần nhất hoặc so sánh các năm gần đây) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" id="cutoffScoreInput" required
                       value={cutoffScore}
                       onChange={(e) => setCutoffScore(e.target.value)}
                       placeholder="Ví dụ: Năm ngoái lấy 25.5đ, năm trước 24.8đ (Tổ hợp D01)"
                       style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                <small style={{ color: '#64748b', fontSize: '12px' }}>So với học lực hiện tại của em thì đang thừa hay thiếu bao nhiêu điểm?</small>
              </div>

              {/* Mục 2: Học phí */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>
                  2. Mức học phí thực tế của ngành/trường (ước tính 1 năm hoặc cả khóa) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" id="tuitionInput" required
                       value={tuition}
                       onChange={(e) => setTuition(e.target.value)}
                       placeholder="Ví dụ: Khoảng 30 - 35 triệu/năm (Chưa tính chi phí sinh hoạt)"
                       style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                <small style={{ color: '#64748b', fontSize: '12px' }}>Gia đình em có đáp ứng được mức chi phí này trong suốt 4 năm không?</small>
              </div>

              {/* Mục 3: Cơ hội việc làm & Thách thức */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>
                  3. Tỷ lệ việc làm công bố hoặc yêu cầu khắt khe nhất của ngành <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" id="employmentRateInput" required
                       value={employmentRate}
                       onChange={(e) => setEmploymentRate(e.target.value)}
                       placeholder="Ví dụ: Tỷ lệ việc làm 88%, đòi hỏi tiếng Anh tốt và kỹ năng chịu áp lực cao"
                       style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              {/* NÚT BẤM XÁC NHẬN */}
              <div style={{ textAlign: 'right' }}>
                <button type="submit" 
                        style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }}>
                  Xác Nhận Số Liệu & Mở Khóa Bước 4 ➜
                </button>
              </div>
            </form>

          </div>
        </>
      )}
    </div>
  )
}

export default FactCheckHub
