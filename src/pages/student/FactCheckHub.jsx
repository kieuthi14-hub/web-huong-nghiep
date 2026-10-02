import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import MajorExplorer from './MajorExplorer'
import UniversityExplorer from './UniversityExplorer'
import Step3VocationalVerification from './Step3VocationalVerification'
import Step3DataVerification from './Step3DataVerification'
import { 
  FileCheck2, 
  ExternalLink, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  GraduationCap,
  Scissors
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

  // Phân hệ kiểm chứng: 'academic' (Đại học/CĐ) hoặc 'vocational' (Học nghề thực chiến)
  const [pathwayMode, setPathwayMode] = useState(() => {
    try {
      const storedVocational = localStorage.getItem('cbas_step3_vocational');
      if (storedVocational) return 'vocational';
      const text = `${anchor?.target_career || ''} ${anchor?.target_university || ''}`.toLowerCase();
      const vocationalKeywords = ['tóc', 'cắt tóc', 'barber', 'salon', 'spa', 'nail', 'móng', 'học nghề', 'nghề', 'thợ', 'pha chế', 'barista', 'đầu bếp', 'nấu ăn', 'sửa xe', 'sửa chữa ô tô', 'trang điểm', 'makeup', 'lái xe'];
      return vocationalKeywords.some(kw => text.includes(kw)) ? 'vocational' : 'academic';
    } catch (e) {
      return 'academic';
    }
  });

  // Xử lý hoàn thành phân hệ Học nghề thực chiến
  const handleVocationalComplete = async (vocationalResult) => {
    localStorage.setItem("cbas_step3_vocational", JSON.stringify(vocationalResult));
    
    const step3Evidence = {
      cutoff_score: 'Học nghề thực chiến (Không xét điểm chuẩn)',
      tuition: `${vocationalResult.tuitionFee} triệu (Tổng GĐ1: ${vocationalResult.totalPhase1Cost} triệu)`,
      employment_rate: `Thực hành khách sau ${vocationalResult.weeksUntilRealHaircut} tuần | Dự toán mở tiệm: ${vocationalResult.startupBudgetEstimate} triệu`,
      vocational: vocationalResult,
      timestamp: new Date().toLocaleString(),
      verified_at: new Date().toISOString()
    };

    localStorage.setItem("cbas_step3_evidence", JSON.stringify(step3Evidence));
    localStorage.setItem("career_evidence_task", JSON.stringify({
      cutoffScores: step3Evidence.cutoff_score,
      tuitionFees: step3Evidence.tuition,
      admissionQuota: step3Evidence.employment_rate,
      completedAt: step3Evidence.timestamp
    }));

    if (user?.id) {
      try {
        await supabase.from('metacognitive_matrix').insert([
          {
            student_id: user.id,
            target_major: targetCareerDisplay || vocationalResult.academyName || 'Học nghề tư nhân',
            evidence: `[BƯỚC 3 ĐỐI CHỨNG HỌC NGHỀ THỰC CHIẾN]\n1. Cơ sở/Salon: ${vocationalResult.academyName}\n2. Tổng chi phí GĐ1: ${vocationalResult.totalPhase1Cost} triệu (Vốn gia đình: ${vocationalResult.userSavings} triệu)\n3. Hợp đồng đào tạo văn bản: ${vocationalResult.hasWrittenContract ? 'Có' : 'Không'}\n4. Thời gian thực hành mẫu thật: ${vocationalResult.weeksUntilRealHaircut} tuần\n5. Dự toán vốn mở tiệm: ${vocationalResult.startupBudgetEstimate} triệu`,
            verified_sources: 'Khảo sát cơ sở đào tạo tư nhân & Thẩm định bài toán kinh tế mở tiệm',
            risk_analysis: 'Đã hoàn thành kiểm toán chi phí giai đoạn 1, pháp lý hợp đồng đào tạo và tính khả thi thị trường.',
            bias_check: 'Hóa giải ảo tưởng học nghề nhanh giàu, minh bạch hóa bài toán tài chính & cạnh tranh.',
            detected_bias: 'DEBIASED_SYSTEM_2',
            final_decision: 'VOCATIONAL_CALIBRATED'
          }
        ]);
      } catch (dbErr) {
        console.warn('Lỗi ghi Supabase Bước 3 (Vocational):', dbErr);
      }
    }

    alert("🎉 Hồ sơ thẩm định học nghề thực chiến đã được hiệu chỉnh thành công! Chuẩn bị chuyển sang Bước 4.");
    navigate('/student/booking');
  };

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

  // Xử lý hoàn thành phân hệ Đại học / Cao Đẳng (CBAS Step 3 Empirical Grounding & Cognitive Triage)
  const handleAcademicComplete = async (triageResult, nextStep) => {
    // Lưu vào Supabase nếu đã đăng nhập (phục vụ nghiên cứu & báo cáo CBAS)
    if (user?.id) {
      try {
        await supabase.from('metacognitive_matrix').insert([
          {
            student_id: user.id,
            target_major: targetCareerDisplay || 'Chưa rõ',
            evidence: `[BƯỚC 3 ĐỐI CHỨNG DỮ LIỆU ĐỀ ÁN & THỊ TRƯỜNG LAO ĐỘNG]\n1. Tổ hợp (${triageResult?.targetCombination}): ${triageResult?.totalStudentScore}/30 so với Điểm chuẩn TB (${triageResult?.avgCutoff})\n2. Khoảng cách: ${triageResult?.scoreGap} điểm\n3. Học phí: ${triageResult?.tuitionFee} triệu/năm\n4. Tỷ lệ việc làm: ${triageResult?.employmentRate}%\n5. Xu thế: ${triageResult?.laborMarketTrend}\n6. Lý do thất nghiệp: ${triageResult?.unemploymentReasons?.join(', ')}\n7. Phản tư: ${triageResult?.reflectionText}`,
            verified_sources: 'Đề án tuyển sinh 3 công khai & Báo cáo thị trường lao động (Bộ GD&ĐT, Bộ LĐ-TB&XH)',
            risk_analysis: `Phân luồng: ${triageResult?.triageDecision}. ${triageResult?.triageDecision === 'Fast-Track' ? 'Năng lực và nhận thức phù hợp, chuyển thẳng Bước 5.' : 'Có khoảng cách điểm số hoặc mâu thuẫn ngoại sinh, cần tham vấn Bước 4.'}`,
            bias_check: 'Empirical Grounding + Algorithmic Cognitive Triage',
            detected_bias: triageResult?.triageDecision === 'Fast-Track' ? 'CALIBRATED_REALISTIC' : 'COGNITIVE_GAP_DETECTED',
            final_decision: triageResult?.triageDecision === 'Fast-Track' ? 'FAST_TRACK_ROADMAP' : 'IN_DEPTH_MENTORSHIP'
          }
        ]);
      } catch (dbErr) {
        console.warn('Lỗi ghi Supabase Bước 3:', dbErr);
      }
    }

    if (nextStep === 'STEP_5') {
      navigate('/student/roadmap');
    } else {
      navigate('/student/booking');
    }
  };

  // Đăng ký các hàm ra global window để hỗ trợ nếu cần
  useEffect(() => {
    window.openAdmissionPDF = openAdmissionPDF;
    return () => {
      delete window.openAdmissionPDF;
    };
  }, [anchor, targetUniDisplay]);

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

          {/* THANH CHUYỂN PHÂN HỆ ĐÀO TẠO (ĐẠI HỌC vs HỌC NGHỀ THỰC CHIẾN) */}
          <div style={{ maxWidth: '850px', margin: '0 auto 16px auto', display: 'flex', gap: '8px', padding: '6px', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setPathwayMode('academic')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: 'none',
                background: pathwayMode === 'academic' ? '#2563eb' : 'transparent',
                color: pathwayMode === 'academic' ? '#ffffff' : '#475569',
                boxShadow: pathwayMode === 'academic' ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <GraduationCap style={{ width: '18px', height: '18px' }} />
              <span>Khối Đại Học / Cao Đẳng (Đề án 3 Công khai)</span>
            </button>
            <button
              type="button"
              onClick={() => setPathwayMode('vocational')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: 'none',
                background: pathwayMode === 'vocational' ? '#d97706' : 'transparent',
                color: pathwayMode === 'vocational' ? '#ffffff' : '#475569',
                boxShadow: pathwayMode === 'vocational' ? '0 2px 4px rgba(217,119,6,0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Scissors style={{ width: '18px', height: '18px' }} />
              <span>Phân Hệ Học Nghề Thực Chiến (Bài Toán Kinh Tế)</span>
            </button>
          </div>

          {pathwayMode === 'vocational' ? (
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              <Step3VocationalVerification 
                profile={anchor} 
                onComplete={handleVocationalComplete} 
              />
            </div>
          ) : (
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              <Step3DataVerification 
                userProfile={{
                  targetMajor: targetCareerDisplay,
                  targetSchool: targetUniDisplay,
                  reason: anchor?.source_of_influence || anchor?.reason || '',
                  expectedIncome: anchor?.expected_income || ''
                }}
                onComplete={handleAcademicComplete}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FactCheckHub
