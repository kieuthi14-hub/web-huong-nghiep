import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

// Danh sách Cổng dữ liệu khách quan & Link Đề án Tuyển sinh 3 Công Khai (Công cụ tra cứu phụ trợ)
const VERIFICATION_LINKS = [
  {
    name: 'Cổng Tuyển sinh Quốc gia (Bộ GD&ĐT)',
    badge: 'Bộ GD&ĐT',
    url: 'https://tuyensinh.moet.gov.vn/'
  },
  {
    name: 'Đề án TS ĐH Bách Khoa (ĐHQG)',
    badge: 'Bách Khoa',
    url: 'https://ts.hcmut.edu.vn'
  },
  {
    name: 'Đề án TS ĐH Kinh Tế (UEH)',
    badge: 'Kinh tế UEH',
    url: 'https://tuyensinh.ueh.edu.vn'
  },
  {
    name: 'Báo cáo Tuyển sinh ĐH Y Dược TP.HCM',
    badge: 'Y Dược',
    url: 'https://ump.edu.vn'
  },
  {
    name: 'Cổng Tuyển sinh ĐH Sư Phạm TP.HCM / Quy Nhơn',
    badge: 'Sư phạm',
    url: 'https://tuyensinh.hnue.edu.vn'
  },
  {
    name: 'Đề án TS ĐH KHXH&NV TP.HCM (ĐHQG)',
    badge: 'KHXH&NV',
    url: 'https://hcmussh.edu.vn/tuyensinh'
  }
];

export default function FactCheckHub() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. ĐỌC DỮ LIỆU MỎ NEO BAN ĐẦU (T0) TỪ BƯỚC 1 & BƯỚC 2
  const anchor = useMemo(() => {
    try {
      const cbas = localStorage.getItem('cbas_anchor_data');
      if (cbas) return JSON.parse(cbas);
      const userAnc = localStorage.getItem('userAnchorData');
      if (userAnc) return JSON.parse(userAnc);
      const profile = localStorage.getItem('cbas_user_profile');
      if (profile) return JSON.parse(profile);
      const legacy = localStorage.getItem('career_initial_anchor');
      if (legacy) return JSON.parse(legacy);
    } catch (e) {
      console.warn('Lỗi đọc mỏ neo T0:', e);
    }
    return {
      target_career: 'Tâm lý học',
      target_major: 'Tâm lý học',
      target_university: 'ĐH KHXH&NV TP.HCM (Tổ hợp D14)',
      target_school: 'ĐH KHXH&NV TP.HCM (Tổ hợp D14)',
      source_of_influence: 'Em thích từ nhỏ, nghĩ học nhanh',
      reason: 'Em thích từ nhỏ, nghĩ học nhanh',
      expected_income: '10 - 15 triệu / tháng',
      confidence_score: 8
    };
  }, []);

  const studentCode = user?.user_metadata?.student_code || localStorage.getItem('cbas_student_code') || 'CT_01';

  // 2. TỰ ĐỘNG PHÁT HIỆN PHÂN HỆ BAN ĐẦU TỪ MỎ NEO NGHỀ
  const initialMode = useMemo(() => {
    try {
      const text = `${anchor?.target_major || anchor?.target_career || ''} ${anchor?.target_university || ''}`.toLowerCase();
      const vocationalKeywords = ['tóc', 'cắt tóc', 'barber', 'salon', 'spa', 'thẩm mỹ', 'nail', 'móng', 'học nghề', 'nghề', 'thợ', 'pha chế', 'trang điểm'];
      return vocationalKeywords.some(kw => text.includes(kw)) ? 'vocational' : 'academic';
    } catch (e) {
      return 'academic';
    }
  }, [anchor]);

  const [currentMode, setCurrentMode] = useState(initialMode);

  // 3. STATE NHÁNH 1: ĐỐI CHỨNG ĐẠI HỌC / CAO ĐẲNG
  const academicTargetDisplay = useMemo(() => {
    const major = anchor?.target_major || anchor?.target_career || 'Tâm lý học';
    const school = anchor?.target_university || anchor?.target_school || 'ĐH KHXH&NV TP.HCM (Tổ hợp D14)';
    if (major.toLowerCase().includes('tóc') || major.toLowerCase().includes('spa')) {
      return 'Tâm lý học - ĐH KHXH&NV TP.HCM (Tổ hợp D14)';
    }
    return school ? `${major} - ${school}` : `${major} (Tổ hợp xét tuyển chính quy)`;
  }, [anchor]);

  const academicBenchmark = 26.50; // Điểm chuẩn chuẩn hóa benchmark
  const [academicScore, setAcademicScore] = useState(25.0); // Điểm học bạ nhập vào

  const academicGap = Number((academicScore - academicBenchmark).toFixed(2));

  // 4. STATE NHÁNH 2: ĐỐI CHỨNG HỌC NGHỀ TƯ NHÂN (SPA / TÓC)
  const targetVocationalCareer = useMemo(() => {
    const raw = anchor?.target_career || anchor?.target_major;
    if (raw && (raw.toLowerCase().includes('tóc') || raw.toLowerCase().includes('spa'))) {
      return raw;
    }
    return 'Tạo mẫu tóc (Spa nổi tiếng)';
  }, [anchor]);

  const vocReason = anchor?.reason || anchor?.source_of_influence || 'Em thích từ nhỏ, nghĩ học nhanh';
  const vocExpectedIncome = anchor?.expected_income || '10 - 15 triệu / tháng';

  const [vocBudget, setVocBudget] = useState('not_ready'); // 'ready' | 'not_ready' | 'part_time'
  const [vocCommitment, setVocCommitment] = useState('disagree'); // 'agree' | 'disagree'

  // Tiện ích tra cứu cổng đề án Bộ GD&ĐT
  const [showGuide, setShowGuide] = useState(false);

  // 5. TÍNH TOÁN KẾT QUẢ PHÂN LUỒNG TRIAGE TỰ ĐỘNG
  const triageResult = useMemo(() => {
    if (currentMode === 'academic') {
      if (academicGap < -1.5) {
        return {
          type: 'in_depth',
          title: 'Nhánh A: Tham Vấn 1-1 Chuyên Sâu (In-depth 20 phút)',
          desc: `Mục tiêu đang thiếu trên 1.5 điểm so với điểm chuẩn thực tế (${academicGap} điểm). Cần phân luồng gặp Mentor 1-1 để tái định hướng hoặc xây dựng kế hoạch bứt phá.`,
          riskBadge: 'Nguy cơ trượt cao (Cần tham vấn sâu 1-1)'
        };
      } else if (academicGap < 0) {
        return {
          type: 'in_depth',
          title: 'Nhánh A: Tham Vấn 1-1 Chuyên Sâu (In-depth 20 phút)',
          desc: `Học sinh nằm trong vùng rủi ro điểm số (${academicGap} điểm). Cần tham vấn để lập kế hoạch bứt phá.`,
          riskBadge: 'Sát ngưỡng (Cần ma trận bứt phá)'
        };
      } else {
        return {
          type: 'fast_track',
          title: 'Nhánh B: Xác Nhận Tinh Gọn (Fast-track 5 phút)',
          desc: `Điểm số nằm trong vùng an toàn (+${academicGap} điểm). Học sinh được chuyển sang nhánh rà soát tinh gọn.`,
          riskBadge: 'Điểm số an toàn'
        };
      }
    } else {
      // Nhánh Vocational
      if (vocBudget === 'not_ready' || vocCommitment === 'disagree') {
        return {
          type: 'in_depth',
          title: 'Nhánh A: Tham Vấn 1-1 Chuyên Sâu (In-depth 20 phút)',
          desc: 'Xung đột nhận thức: Học sinh chưa chuẩn bị ngân sách học nghề thực tế hoặc kỳ vọng thu nhập sai lệch với giai đoạn thợ phụ. Bắt buộc tham vấn 1-1.',
          riskBadge: 'Bất hòa nhận thức cao'
        };
      } else {
        return {
          type: 'fast_track',
          title: 'Nhánh B: Xác Nhận Tinh Gọn (Fast-track 5 phút)',
          desc: 'Học sinh đã nhận thức rõ chi phí thực tế và chấp nhận thời gian học việc. Chuyển sang rà soát tinh gọn.',
          riskBadge: 'Đã sẵn sàng thực tế'
        };
      }
    }
  }, [currentMode, academicGap, vocBudget, vocCommitment]);

  // Cập nhật lưu trữ tức thì
  useEffect(() => {
    try {
      const branchLabel = triageResult.type === 'in_depth' ? 'In-depth' : 'Fast-track';
      localStorage.setItem('triage_branch_CT01', branchLabel);
      localStorage.setItem('cbas_triage_branch', branchLabel);
      localStorage.setItem('cbas_triage_mode', currentMode);
    } catch (e) {}
  }, [triageResult, currentMode]);

  // 6. TIẾP TỤC SANG BƯỚC 4
  const proceedToStep4 = async () => {
    const branchLabel = triageResult.type === 'in_depth' ? 'In-depth' : 'Fast-track';

    const step3Evidence = {
      studentCode,
      mode: currentMode,
      branch: branchLabel,
      academicMajor: academicTargetDisplay,
      academicBenchmark,
      academicScore,
      academicGap,
      vocCareer: targetVocationalCareer,
      vocBudget,
      vocCommitment,
      triageDecision: branchLabel,
      triageReason: triageResult.desc,
      timestamp: new Date().toLocaleString(),
      verified_at: new Date().toISOString()
    };

    localStorage.setItem('triage_branch_CT01', branchLabel);
    localStorage.setItem('cbas_triage_branch', branchLabel);
    localStorage.setItem('cbas_triage_mode', currentMode);
    localStorage.setItem('cbas_step3_evidence', JSON.stringify(step3Evidence));
    localStorage.setItem('cbas_triage_result', JSON.stringify(step3Evidence));

    if (user?.id) {
      try {
        await supabase.from('metacognitive_matrix').insert([
          {
            student_id: user.id,
            target_major: currentMode === 'academic' ? academicTargetDisplay : targetVocationalCareer,
            evidence: `[BƯỚC 3 ĐỐI CHỨNG DỮ LIỆU THỰC CHỨNG]\nChế độ: ${currentMode === 'academic' ? 'Đại học/Cao đẳng' : 'Học nghề tư nhân'}\nĐộ lệch: ${currentMode === 'academic' ? `${academicGap} điểm` : `Ngân sách: ${vocBudget}, Cam kết: ${vocCommitment}`}\nPhân luồng: ${branchLabel}\nLý do: ${triageResult.desc}`,
            verified_sources: currentMode === 'academic' ? 'Đề án tuyển sinh & Điểm chuẩn 3 năm' : 'Khung thực tế thị trường học nghề tự do (Baseline)',
            risk_analysis: triageResult.desc,
            bias_check: 'Empirical Grounding + Algorithmic Cognitive Triage',
            detected_bias: triageResult.type === 'in_depth' ? 'COGNITIVE_GAP_DETECTED' : 'CALIBRATED_REALISTIC',
            final_decision: triageResult.type === 'in_depth' ? 'IN_DEPTH_MENTORSHIP' : 'FAST_TRACK_ROADMAP'
          }
        ]);
      } catch (dbErr) {
        console.warn('Lỗi ghi Supabase Bước 3:', dbErr);
      }
    }

    alert('Đã lưu kết quả phân luồng Bước 3 vào hồ sơ thực nghiệm! Hệ thống tự động chuyển tiếp đối tượng sang Bước 4.');
    navigate('/student/booking');
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-4 md:p-8 flex flex-col items-center justify-start font-sans antialiased">
      
      {/* KHUNG NỘI DUNG CHÍNH (CHUẨN FORM VISEF CBAS 2026) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* HEADER BƯỚC 3 */}
        <div className="border-b border-slate-800 pb-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
                BƯỚC 3 / 5: ĐỐI CHỨNG DỮ LIỆU THỰC CHỨNG
              </span>
              <span className="text-xs text-slate-400">
                Mã ĐT: <strong className="text-teal-400 font-bold">{studentCode}</strong>
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white mt-1">
              Đối Soát Thực Tế Đào Tạo & Rào Cản Nghề Nghiệp
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bóc tách độ vênh giữa kỳ vọng chủ quan (T₀) và mặt bằng tuyển sinh / chi phí thị trường thực tế.
            </p>
          </div>

          {/* CHUYỂN ĐỔI CHẾ ĐỘ THÍCH ỨNG (DEMO ĐIỀU HƯỚNG TỰ ĐỘNG) */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
            <button
              id="btnTabUni"
              type="button"
              onClick={() => setCurrentMode('academic')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentMode === 'academic'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              Đại học / Cao đẳng
            </button>
            <button
              id="btnTabVoc"
              type="button"
              onClick={() => setCurrentMode('vocational')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentMode === 'vocational'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              Học nghề tư nhân (Spa / Tóc)
            </button>
          </div>
        </div>

        {/* ==================== NHÁNH 1: ĐỐI CHỨNG ĐẠI HỌC / CAO ĐẲNG CHÍNH QUY ==================== */}
        {currentMode === 'academic' && (
          <div id="sectionAcademic" className="space-y-5 animate-fadeIn">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <i className="ph ph-university text-teal-400 text-base"></i>
                <span>Nguyện vọng trường xét tuyển:</span>
                <strong className="text-white">{academicTargetDisplay}</strong>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Điểm chuẩn 3 năm gần nhất:</span>
                  <span className="text-base font-bold text-rose-400 mt-1 block">
                    {academicBenchmark.toFixed(2)} điểm
                  </span>
                  <span className="text-[10px] text-slate-500">Mức độ cạnh tranh top đầu</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Điểm học bạ hiện tại (D14):</span>
                  <input
                    type="number"
                    id="academicScoreInput"
                    step="0.1"
                    min="0"
                    max="30"
                    value={academicScore}
                    onChange={(e) => setAcademicScore(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-teal-300 font-bold text-sm mt-1 focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500">Văn + Sử + Anh</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Độ vênh điểm số (ΔĐiểm):</span>
                  <span
                    id="academicDeltaDisplay"
                    className={`text-base font-black mt-1 block ${
                      academicGap < -1.5 
                        ? 'text-rose-400' 
                        : academicGap < 0 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                    }`}
                  >
                    {academicGap >= 0 ? `+${academicGap.toFixed(2)}` : `${academicGap.toFixed(2)}`} điểm
                  </span>
                  <span
                    id="academicRiskNotice"
                    className={`text-[10px] font-medium ${
                      academicGap < -1.5 
                        ? 'text-rose-400' 
                        : academicGap < 0 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                    }`}
                  >
                    {triageResult.riskBadge}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== NHÁNH 2: ĐỐI CHỨNG HỌC NGHỀ TƯ NHÂN (SPA / TÓC / TỰ DO) ==================== */}
        {currentMode === 'vocational' && (
          <div id="sectionVocational" className="space-y-5 animate-fadeIn">
            {/* THÔNG BÁO BỐC TÁCH MỎ NEO */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <i className="ph ph-warning-circle text-amber-400 text-xl shrink-0 mt-0.5"></i>
              <div className="text-xs space-y-1">
                <div className="font-bold text-amber-300">CẢNH BÁO MÙ MỜ THÔNG TIN ĐÀO TẠO NGHỀ TƯ NHÂN:</div>
                <p className="text-slate-300 leading-relaxed">
                  Các tiệm Salon / Spa tư nhân thường không công bố học phí công khai và dễ gây hiểu lầm rằng <em>"học việc là có lương ngay"</em>. Hệ thống cung cấp <strong>Khung Dữ Liệu Thực Tế Thị Trường (Baseline)</strong> để học sinh đối soát trực diện trước khi ra quyết định.
                </p>
              </div>
            </div>

            {/* BẢNG ĐỐI CHIẾU 2 CỘT MỎ NEO VS THỰC TẾ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Cột Mỏ neo học sinh */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <i className="ph ph-anchor text-teal-400 text-base"></i>
                  <span className="font-bold text-white uppercase text-[11px]">Mỏ neo chủ quan ban đầu (T₀)</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <p>
                    <span className="text-slate-400">Ngành nghề chọn:</span>{' '}
                    <strong className="text-white">{targetVocationalCareer}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Động cơ:</span>{' '}
                    <em className="text-amber-200">"{vocReason}"</em>
                  </p>
                  <p>
                    <span className="text-slate-400">Kỳ vọng thu nhập:</span>{' '}
                    <strong className="text-teal-400">{vocExpectedIncome}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Ước tính học phí:</span>{' '}
                    <span className="text-slate-400 italic">Chưa tìm hiểu (nghĩ tiệm lo)</span>
                  </p>
                </div>
              </div>

              {/* Cột Thực tế thị trường */}
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <i className="ph ph-chart-line-up text-rose-400 text-base"></i>
                  <span className="font-bold text-rose-300 uppercase text-[11px]">Thực tế đào tạo thị trường tự do</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <p>
                    <span className="text-slate-400">Học phí trọn gói:</span>{' '}
                    <strong className="text-white">25 - 45 triệu VNĐ</strong> (chưa kể kéo/máy)
                  </p>
                  <p>
                    <span className="text-slate-400">Chi phí đồ nghề ban đầu:</span>{' '}
                    <strong className="text-amber-300">8 - 15 triệu VNĐ</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Thời gian làm thợ phụ:</span>{' '}
                    <strong className="text-rose-400">12 - 18 tháng</strong> (gội đầu, quét dọn)
                  </p>
                  <p>
                    <span className="text-slate-400">Thu nhập năm đầu:</span>{' '}
                    <strong className="text-slate-200">2 - 4 triệu / tháng</strong> (chỉ có phụ cấp)
                  </p>
                </div>
              </div>
            </div>

            {/* PHẦN HỌC SINH TỰ XÁC NHẬN BẤT HÒA NHẬN THỨC */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-200 uppercase text-[11px] block">
                ⚡ Bài toán đối chất năng lực thực tế:
              </span>

              <div className="space-y-2">
                <label className="block text-slate-300">
                  1. Gia đình hoặc bản thân em đã sẵn sàng ngân sách đầu tư ban đầu (~35 - 50 triệu) chưa?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <label className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="voc_budget"
                      value="ready"
                      checked={vocBudget === 'ready'}
                      onChange={() => setVocBudget('ready')}
                      className="text-teal-500 focus:ring-0 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-slate-300 text-[11px]">Đã sẵn sàng</span>
                  </label>
                  <label className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="voc_budget"
                      value="not_ready"
                      checked={vocBudget === 'not_ready'}
                      onChange={() => setVocBudget('not_ready')}
                      className="text-teal-500 focus:ring-0 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-rose-300 text-[11px]">Chưa có, tưởng học miễn phí</span>
                  </label>
                  <label className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="voc_budget"
                      value="part_time"
                      checked={vocBudget === 'part_time'}
                      onChange={() => setVocBudget('part_time')}
                      className="text-teal-500 focus:ring-0 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-slate-300 text-[11px]">Cần làm thêm tích lũy</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-slate-300">
                  2. Em có cam kết chịu được 1 năm đầu làm thợ phụ gội đầu với mức phụ cấp chỉ 2 - 4 triệu/tháng?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="voc_commitment"
                      value="agree"
                      checked={vocCommitment === 'agree'}
                      onChange={() => setVocCommitment('agree')}
                      className="text-teal-500 focus:ring-0 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-slate-300 text-[11px]">Chấp nhận cam kết để học nghề</span>
                  </label>
                  <label className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="voc_commitment"
                      value="disagree"
                      checked={vocCommitment === 'disagree'}
                      onChange={() => setVocCommitment('disagree')}
                      className="text-teal-500 focus:ring-0 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-rose-300 text-[11px]">Không chấp nhận, muốn có lương 10tr ngay</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== KẾT QUẢ PHÂN LUỒNG TỰ ĐỘNG CỦA HỆ THỐNG SANG BƯỚC 4 ==================== */}
        <div
          id="triageResultBox"
          className={`p-4 rounded-xl flex flex-wrap justify-between items-center gap-3 text-xs transition-all ${
            triageResult.type === 'in_depth'
              ? 'bg-rose-950/20 border border-rose-500/40 text-rose-300'
              : 'bg-emerald-950/20 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider ${
                  triageResult.type === 'in_depth'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                KẾT QUẢ PHÂN LUỒNG BƯỚC 4
              </span>
              <span id="triageStatusTitle" className="font-bold text-white text-xs">
                {triageResult.title}
              </span>
            </div>
            <p id="triageStatusDesc" className="text-slate-300 text-[11px] mt-1 leading-relaxed">
              {triageResult.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={proceedToStep4}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Tiếp tục sang Bước 4 (Đặt lịch Mentor)</span>
            <i className="ph ph-arrow-right font-bold text-sm"></i>
          </button>
        </div>

      </div>

      {/* CÔNG CỤ PHỤ TRỢ: TRA CỨU ĐỀ ÁN TUYỂN SINH BỘ GD&ĐT */}
      <div className="w-full max-w-4xl mt-4 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs font-semibold text-slate-400 hover:text-teal-300 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
          <span>{showGuide ? 'Ẩn Cổng Tra Cứu Bộ GD&ĐT' : '🔗 Xem Cổng Tra Cứu Đề Án 3 Công Khai (Bộ GD&ĐT)'}</span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showGuide && (
          <div className="w-full mt-2.5 bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">🏛️ Cổng Tuyển sinh Chính thức & Đề án 3 Công khai:</span>
              <a
                href="https://tuyensinh.moet.gov.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
              >
                <span>Cổng Bộ GD&ĐT</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2 flex-wrap">
              {VERIFICATION_LINKS.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <span>{item.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
