import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * MODULE BƯỚC 3: MÔI TRƯỜNG ĐỐI CHỨNG DỮ LIỆU ĐỀ ÁN & THỊ TRƯỜNG LAO ĐỘNG
 * Phân ngành: Khoa học Xã hội và Hành vi (CBAS) - Dự án ViSEF 2026
 * Cơ chế: Guided Empirical Grounding + Algorithmic Cognitive Triage
 */

export default function Step3DataVerification({ 
  userProfile: propUserProfile = {}, 
  step2Summary: propStep2Summary = { turningPoint: false }, 
  onComplete 
}) {
  const navigate = useNavigate();

  // Đọc fallback từ localStorage nếu props chưa truyền hoặc thiếu trường
  const userProfile = useMemo(() => {
    let storedProfile = {};
    let storedAnchor = {};
    try {
      const p = localStorage.getItem('cbas_user_profile');
      if (p) storedProfile = JSON.parse(p);
      const a = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData');
      if (a) storedAnchor = JSON.parse(a);
    } catch (e) {}

    const rawMajor = propUserProfile?.targetMajor || storedProfile?.targetMajor || storedAnchor?.target_career || storedAnchor?.targetMajor || '';
    const rawSchool = propUserProfile?.targetSchool || storedProfile?.targetSchool || storedAnchor?.target_university || storedAnchor?.targetSchool || '';
    const cleanMajor = (rawMajor && rawMajor !== 'Chưa xác định') ? rawMajor : '';
    const cleanSchool = (rawSchool && rawSchool !== 'Chưa xác định') ? rawSchool : '';

    return {
      reason: propUserProfile?.reason || storedProfile?.reason || storedAnchor?.source_of_influence || storedAnchor?.reason || '',
      expectedIncome: propUserProfile?.expectedIncome || storedProfile?.expectedIncome || storedAnchor?.expected_income || 'Chưa xác định',
      ...propUserProfile,
      targetMajor: cleanMajor,
      targetSchool: cleanSchool,
    };
  }, [propUserProfile]);

  const step2Summary = useMemo(() => {
    if (propStep2Summary && propStep2Summary.turningPoint) {
      return propStep2Summary;
    }
    try {
      const telem = localStorage.getItem('cbas_step2_telemetry');
      if (telem) {
        const parsed = JSON.parse(telem);
        const tp = Boolean(parsed.turning_point_detected && parsed.turning_point_detected.toString().startsWith('True'));
        return { turningPoint: tp, ...parsed };
      }
    } catch (e) {}
    return propStep2Summary || { turningPoint: false };
  }, [propStep2Summary]);
  // 1. STATE DỮ LIỆU KHỐI 1: TỔ HỢP MÔN & ĐIỂM CHUẨN
  const [targetCombination, setTargetCombination] = useState('A00');
  const [customCombination, setCustomCombination] = useState('');
  const [scoreSubject1, setScoreSubject1] = useState('');
  const [scoreSubject2, setScoreSubject2] = useState('');
  const [scoreSubject3, setScoreSubject3] = useState('');
  const [cutoff2024, setCutoff2024] = useState('');
  const [cutoff2025, setCutoff2025] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');

  // 2. STATE DỮ LIỆU KHỐI 2: THỊ TRƯỜNG VIỆC LÀM
  const [employmentRate, setEmploymentRate] = useState('');
  const [laborMarketTrend, setLaborMarketTrend] = useState('balanced');

  // 3. STATE DỮ LIỆU KHỐI 3: NGUYÊN NHÂN THẤT NGHIỆP & PHẢN TƯ
  const [unemploymentReasons, setUnemploymentReasons] = useState([]);
  const [reflectionText, setReflectionText] = useState('');

  // 4. STATE ĐIỀU KHIỂN GIAO DIỆN KẾT QUẢ PHÂN LUỒNG
  const [triageResult, setTriageResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // DANH MỤC TỔ HỢP PHỔ BIẾN THEO CHƯƠNG TRÌNH GDPT 2018
  const combinationOptions = [
    { code: 'A00', name: 'A00 (Toán, Vật lý, Hóa học)' },
    { code: 'A01', name: 'A01 (Toán, Vật lý, Tiếng Anh)' },
    { code: 'B00', name: 'B00 (Toán, Hóa học, Sinh học)' },
    { code: 'C00', name: 'C00 (Ngữ văn, Lịch sử, Địa lý)' },
    { code: 'C19', name: 'C19 (Ngữ văn, Lịch sử, GDKT&PL)' },
    { code: 'C20', name: 'C20 (Ngữ văn, Địa lý, GDKT&PL)' },
    { code: 'D01', name: 'D01 (Toán, Ngữ văn, Tiếng Anh)' },
    { code: 'D07', name: 'D07 (Toán, Hóa học, Tiếng Anh)' },
    { code: 'D84', name: 'D84 (Toán, GDKT&PL, Tiếng Anh)' },
    { code: 'A10', name: 'A10 (Toán, Vật lý, GDKT&PL)' },
    { code: 'TIN', name: 'Tổ hợp Tin học (Toán, Tin học, Ngoại ngữ / KHTN)' },
    { code: 'OTHER', name: 'Tổ hợp tự chọn khác (Tự nhập mã)' },
  ];

  // TÍNH TOÁN ĐỘNG CÁC CHỈ SỐ ĐIỂM SỐ
  const totalStudentScore = useMemo(() => {
    const s1 = parseFloat(scoreSubject1) || 0;
    const s2 = parseFloat(scoreSubject2) || 0;
    const s3 = parseFloat(scoreSubject3) || 0;
    return Number((s1 + s2 + s3).toFixed(2));
  }, [scoreSubject1, scoreSubject2, scoreSubject3]);

  const avgCutoff = useMemo(() => {
    const c24 = parseFloat(cutoff2024) || 0;
    const c25 = parseFloat(cutoff2025) || 0;
    if (c24 > 0 && c25 > 0) return Number(((c24 + c25) / 2).toFixed(2));
    if (c24 > 0) return c24;
    if (c25 > 0) return c25;
    return 0;
  }, [cutoff2024, cutoff2025]);

  // Khoảng cách điểm: Âm nghĩa là điểm học sinh còn thiếu so với điểm chuẩn
  const scoreGap = useMemo(() => {
    if (avgCutoff === 0 || totalStudentScore === 0) return null;
    return Number((totalStudentScore - avgCutoff).toFixed(2));
  }, [totalStudentScore, avgCutoff]);

  // XỬ LÝ CHỌN CHECKBOX LÝ DO THẤT NGHIỆP (TỐI ĐA 2)
  const handleReasonToggle = (reason) => {
    if (unemploymentReasons.includes(reason)) {
      setUnemploymentReasons(unemploymentReasons.filter(r => r !== reason));
    } else {
      if (unemploymentReasons.length < 2) {
        setUnemploymentReasons([...unemploymentReasons, reason]);
      }
    }
  };

  // THUẬT TOÁN PHÂN LUỒNG NHẬN THỨC (COGNITIVE TRIAGE ALGORITHM)
  const handleProcessTriage = (e) => {
    e.preventDefault();

    // 1. Kiểm tra validation tối thiểu
    if (!cutoff2024 || !cutoff2025 || !scoreSubject1 || !scoreSubject2 || !scoreSubject3 || !reflectionText.trim()) {
      alert("Vui lòng tra cứu và điền đầy đủ các thông tin đối chứng bắt buộc để hệ thống phân tích.");
      return;
    }

    // 2. Trích xuất biến số sàng lọc
    const turningPoint = step2Summary.turningPoint || false;
    const actualGap = scoreGap !== null ? scoreGap : 0;
    const reasonText = (userProfile.reason || '').toLowerCase();
    
    // Nhận diện yếu tố ngoại sinh/ép buộc từ gia đình hoặc trào lưu mạng
    const hasExternalConflict = 
      reasonText.includes('mẹ') || 
      reasonText.includes('bố') || 
      reasonText.includes('gia đình') || 
      reasonText.includes('theo bạn') || 
      reasonText.includes('trend') || 
      reasonText.includes('mạng');

    // 3. Quy tắc phân luồng can thiệp
    // Nếu điểm thiếu hụt > 1.5 điểm HOẶC có bước ngoặt ở Bước 2 HOẶC có mâu thuẫn ngoại sinh -> Phân luồng In-depth
    const requiresInDepth = (actualGap < -1.5) || turningPoint || hasExternalConflict;

    const resultData = {
      targetCombination: targetCombination === 'OTHER' ? customCombination : targetCombination,
      scoreSubject1: parseFloat(scoreSubject1),
      scoreSubject2: parseFloat(scoreSubject2),
      scoreSubject3: parseFloat(scoreSubject3),
      totalStudentScore,
      cutoff2024: parseFloat(cutoff2024),
      cutoff2025: parseFloat(cutoff2025),
      avgCutoff,
      scoreGap: actualGap,
      tuitionFee: parseFloat(tuitionFee) || 0,
      employmentRate: parseFloat(employmentRate) || 0,
      laborMarketTrend,
      unemploymentReasons,
      reflectionText: reflectionText.trim(),
      triageDecision: requiresInDepth ? 'In-depth' : 'Fast-Track',
      timestamp: new Date().toISOString()
    };

    // Tự động lưu cache cho bước 4 / bước 5 và tương thích ngược
    try {
      localStorage.setItem('cbas_step3_triage', JSON.stringify(resultData));
      localStorage.setItem('cbas_step3_reflection', reflectionText.trim());
      const step3Evidence = {
        cutoff_score: `${resultData.targetCombination}: ${resultData.totalStudentScore}đ vs Chuẩn TB ${resultData.avgCutoff}đ (Lệch: ${resultData.scoreGap}đ)`,
        tuition: `${resultData.tuitionFee} triệu/năm`,
        employment_rate: `${resultData.employmentRate}% (Xu thế: ${resultData.laborMarketTrend})`,
        triage: resultData,
        timestamp: new Date().toLocaleString(),
        verified_at: new Date().toISOString()
      };
      localStorage.setItem('cbas_step3_evidence', JSON.stringify(step3Evidence));
      localStorage.setItem('career_evidence_task', JSON.stringify({
        cutoffScores: step3Evidence.cutoff_score,
        tuitionFees: step3Evidence.tuition,
        admissionQuota: step3Evidence.employment_rate,
        completedAt: step3Evidence.timestamp
      }));
    } catch (saveErr) {
      console.warn('Lỗi lưu Step 3 evidence vào localStorage:', saveErr);
    }

    setTriageResult(resultData);
    setSubmitted(true);
  };

  const handleResetStep3 = () => {
    if (window.confirm("Em có muốn làm lại Bước 3 (xóa số liệu đối chứng hiện tại để nhập lại từ đầu) không?")) {
      try {
        localStorage.removeItem('cbas_step3_evidence');
        localStorage.removeItem('career_evidence_task');
        localStorage.removeItem('cbas_step3_triage');
        localStorage.removeItem('cbas_score_gap');
        localStorage.removeItem('cbas_step3_vocational');
        localStorage.removeItem('cbas_step3_reflection');
      } catch (e) {}
      setScoreSubject1('');
      setScoreSubject2('');
      setScoreSubject3('');
      setCutoff2024('');
      setCutoff2025('');
      setTuitionFee('');
      setEmploymentRate('');
      setLaborMarketTrend('balanced');
      setUnemploymentReasons([]);
      setReflectionText('');
      setTriageResult(null);
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteAction = (targetStep) => {
    if (typeof onComplete === 'function') {
      onComplete(triageResult, targetStep);
    } else {
      if (targetStep === 'STEP_5') {
        navigate('/student/roadmap');
      } else {
        navigate('/student/booking');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Giai đoạn 3 / Quy trình Can thiệp 5 Bước
          </span>
          <span className="text-xs text-slate-400">CBAS ViSEF 2026 Protocol</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          Đối Chứng Dữ Liệu Đề Án Tuyển Sinh & Thị Trường Lao Động
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Thay vì suy đoán chủ quan, em hãy tạm rời trang web, mở tab mới để tra cứu các nguồn dữ liệu chính thức, 
          sau đó cập nhật số liệu khách quan vào biểu mẫu đối chứng dưới đây.
        </p>

        {/* HỘP HƯỚNG DẪN TRA CỨU GOOGLE DỰA TRÊN DỮ LIỆU HỒ SƠ */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              🔍 Hướng Dẫn Tra Cứu Dữ Liệu Thực Tế Trên Google:
            </p>
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              Mở Google Trong Tab Mới ↗
            </a>
          </div>
          
          <p className="text-xs text-slate-500 mb-2.5">
            Em hãy mở tab mới và tìm kiếm bằng các từ khóa gợi ý bên dưới để có số liệu chính xác nhất:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {/* Gợi ý 1: Điểm chuẩn & Học phí */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="font-bold text-indigo-700 block mb-1">
                1. Tra cứu Điểm chuẩn & Học phí:
              </span>
              <code className="text-[11px] bg-slate-100 text-slate-800 px-2 py-1 rounded block font-mono">
                "Điểm chuẩn Đề án tuyển sinh {userProfile.targetMajor || 'ngành học'} {userProfile.targetSchool || 'trường đại học'}"
              </code>
            </div>

            {/* Gợi ý 2: Báo cáo việc làm */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="font-bold text-emerald-700 block mb-1">
                2. Tra cứu Tỷ lệ Việc làm & Khảo sát sinh viên:
              </span>
              <code className="text-[11px] bg-slate-100 text-slate-800 px-2 py-1 rounded block font-mono">
                "Báo cáo ba công khai việc làm {userProfile.targetSchool || 'trường đại học'}"
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* FORM INPUTS SECTION */}
      {!submitted ? (
        <form onSubmit={handleProcessTriage} className="space-y-6">
          
          {/* KHỐI 1: HIỆN THỰC ĐIỂM CHUẨN & NĂNG LỰC TỔ HỢP */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mr-2">1</span>
              Hiện Thực Điểm Chuẩn & Năng Lực Tổ Hợp Xét Tuyển
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Ngành mục tiêu: <span className="font-bold text-slate-800">{userProfile.targetMajor || 'Chưa xác định'}</span> tại <span className="font-bold text-slate-800">{userProfile.targetSchool || 'Chưa xác định'}</span>
            </p>

            {/* LƯU Ý CƠ CHẾ TUYỂN SINH MỚI THEO GDPT 2018 */}
            <div className="mb-4 p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">💡</span>
              <div className="space-y-0.5">
                <span className="font-bold">Cơ chế tuyển sinh mới theo Chương trình GDPT 2018:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Các trường đại học mở rộng nhiều tổ hợp tự chọn (như Tin học, GDKT&PL). Nếu ngành em chọn áp dụng <strong>môn trọng số nhân hệ số 2</strong> (Toán ở khối Kinh tế/Kỹ thuật, Ngoại ngữ ở khối Ngôn ngữ/Sư phạm) hoặc <strong>chuẩn điều kiện môn Ngoại ngữ</strong>, hãy đối chứng trực tiếp với đề án tuyển sinh 3 năm gần nhất để chọn tổ hợp có lợi thế điểm số cao nhất cho học bạ của mình.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ hợp môn xét tuyển chính thức:
                </label>
                <select
                  value={targetCombination}
                  onChange={(e) => setTargetCombination(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {combinationOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {targetCombination === 'OTHER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhập mã tổ hợp môn cụ thể:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: C01, B08..."
                    value={customCombination}
                    onChange={(e) => setCustomCombination(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              )}
            </div>

            {/* ĐIỂM 3 MÔN TRONG TỔ HỢP */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
              <label className="block text-xs font-bold text-indigo-900 mb-2">
                Nhập điểm trung bình học kỳ gần nhất của 3 môn thuộc tổ hợp trên:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Môn 1:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="VD: 7.5"
                    value={scoreSubject1}
                    onChange={(e) => setScoreSubject1(e.target.value)}
                    className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Môn 2:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="VD: 6.5"
                    value={scoreSubject2}
                    onChange={(e) => setScoreSubject2(e.target.value)}
                    className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Môn 3:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="VD: 6.0"
                    value={scoreSubject3}
                    onChange={(e) => setScoreSubject3(e.target.value)}
                    className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* TỔNG ĐIỂM HỌC BẠ TỰ ĐỘNG */}
              <div className="mt-3 flex justify-between items-center pt-2 border-t border-indigo-100 text-xs">
                <span className="text-slate-600 font-medium">Tổng điểm tổ hợp ước tính của em:</span>
                <span className="font-extrabold text-base text-indigo-700">{totalStudentScore} / 30 điểm</span>
              </div>
            </div>

            {/* ĐIỂM CHUẨN 2 NĂM & HỌC PHÍ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm chuẩn Năm 2024:
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  placeholder="VD: 25.5"
                  value={cutoff2024}
                  onChange={(e) => setCutoff2024(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm chuẩn Năm 2025/2026:
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  placeholder="VD: 26.0"
                  value={cutoff2025}
                  onChange={(e) => setCutoff2025(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Học phí ước tính (Triệu VNĐ/năm):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="VD: 18"
                  value={tuitionFee}
                  onChange={(e) => setTuitionFee(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* REAL-TIME VISUAL INDICATOR (KHOẢNG CÁCH ĐIỂM) */}
            {scoreGap !== null && (
              <div className={`mt-4 p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                scoreGap >= 0 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-2 mb-1">
                    {scoreGap >= 0 ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        🌟 LỢI THẾ CẠNH TRANH RÕ RỆT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700">
                        ⚠️ CẢNH BÁO KHOẢNG CÁCH ĐIỂM SỐ
                      </span>
                    )}
                    <span className="font-normal text-xs text-slate-500">
                      (Điểm chuẩn TB 2 năm: {avgCutoff} điểm)
                    </span>
                  </div>
                  
                  <p className="leading-relaxed">
                    {scoreGap >= 0 ? (
                      `Dữ liệu đối chứng ghi nhận em đang có lợi thế cạnh tranh rất tốt (+${scoreGap} điểm) để hiện thực hóa mục tiêu ngành học mong muốn. Tuy nhiên, đề thi tốt nghiệp THPT luôn có độ phân hóa khắt khe hơn học bạ; hãy tiếp tục duy trì kỷ luật ôn tập và rèn luyện tâm lý phòng thi vững vàng để chuyển hóa trọn vẹn ưu thế này thành điểm số thực tế!`
                    ) : (
                      `Điểm học bạ hiện tại (${totalStudentScore} điểm) đang thấp hơn điểm chuẩn thực tế ${Math.abs(scoreGap)} điểm. Em cần tập trung bứt phá môn sở trường hoặc kích hoạt phương án nguyện vọng dự phòng vừa sức.`
                    )}
                  </p>
                </div>

                <div className={`font-black text-sm px-3.5 py-2 rounded-lg shrink-0 self-start md:self-center shadow-sm border ${
                  scoreGap >= 0 
                    ? 'bg-white text-emerald-700 border-emerald-200' 
                    : 'bg-white text-rose-700 border-rose-200'
                }`}>
                  {scoreGap > 0 ? `+${scoreGap}` : scoreGap} điểm
                </div>
              </div>
            )}
          </div>

          {/* KHỐI 2: TÌNH TRẠNG VIỆC LÀM & NHU CẦU THỊ TRƯỜNG */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mr-2">2</span>
              Hiện Thực Việc Làm & Xu Thế Nhân Lực
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Đối chiếu với kỳ vọng thu nhập ban đầu của em: <span className="font-bold text-slate-800">{userProfile.expectedIncome || 'Chưa xác định'}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tỷ lệ sinh viên có việc làm sau 1 năm (theo Báo cáo 3 công khai):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="VD: 85"
                    value={employmentRate}
                    onChange={(e) => setEmploymentRate(e.target.value)}
                    className="w-full p-2.5 pr-8 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xu thế nhu cầu nhân lực trong 3-5 năm tới:
                </label>
                <select
                  value={laborMarketTrend}
                  onChange={(e) => setLaborMarketTrend(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="shortage">Đang thiếu hụt nhân lực tay nghề cao, tuyển dụng rộng mở</option>
                  <option value="balanced">Cân bằng, cạnh tranh theo năng lực thực chất</option>
                  <option value="saturated">Đang bão hòa, tỷ lệ cạnh tranh đào thải rất gay gắt</option>
                  <option value="ai_risk">Nguy cơ cao bị AI và tự động hóa thay thế các tác vụ cơ bản</option>
                </select>
              </div>
            </div>
          </div>

          {/* KHỐI 3: PHÂN TÍCH RỦI RO THẤT NGHIỆP & PHẢN TƯ TỰ THÂN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mr-2">3</span>
              Bóc Tách Rủi Ro Thất Nghiệp & Nhìn Nhận Thực Tế
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Chọn tối đa 2 nguyên nhân cốt lõi khiến cử nhân ngành này ra trường thất nghiệp hoặc làm trái ngành:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
              {[
                { id: 'theory_only', label: 'Chương trình đào tạo nặng lý thuyết sách vở, thiếu kỹ năng nghề thực hành' },
                { id: 'oversupply', label: 'Nhiều trường mở ngành ồ ạt dẫn đến cung vượt quá cầu thực tế của doanh nghiệp' },
                { id: 'lacking_skills', label: 'Sinh viên thiếu ngoại ngữ và kỹ năng ứng dụng công nghệ/AI thực chiến' },
                { id: 'low_adaptability', label: 'Kỳ vọng mức lương quá cao, không chấp nhận bắt đầu từ vị trí cơ bản' }
              ].map((item) => (
                <label 
                  key={item.id}
                  className={`flex items-start p-3 rounded-xl border text-xs cursor-pointer transition ${
                    unemploymentReasons.includes(item.id)
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={unemploymentReasons.includes(item.id)}
                    onChange={() => handleReasonToggle(item.id)}
                    className="mt-0.5 mr-2.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {/* Ô PHẢN TƯ TỰ THÂN BẮT BUỘC */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sau khi tự mình tìm kiếm và nhìn thấy các số liệu trên, con số nào khiến em bất ngờ nhất và mục tiêu của em có còn hoàn toàn "màu hồng" hay không? (Tự phản tư ngắn gọn):
              </label>
              <textarea
                rows="3"
                placeholder="VD: Em bất ngờ vì điểm chuẩn ngành này lấy đến 26 điểm mà điểm Toán Văn Anh của em mới được 20 điểm. Em cũng nhận ra ngành này cạnh tranh việc làm rất lớn..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* NÚT SUBMIT ĐỐI CHỨNG VÀ KÍCH HOẠT THUẬT TOÁN TRIAGE */}
          <div className="text-center pt-2">
            <button
              type="submit"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition transform active:scale-95 text-sm"
            >
              HOÀN TẤT ĐỐI CHỨNG & PHÂN TÍCH NHẬN THỨC ➔
            </button>
          </div>
        </form>
      ) : (
        /* KẾT QUẢ PHÂN LUỒNG NHẬN THỨC THUẬT TOÁN (COGNITIVE TRIAGE SCREEN) */
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center animate-fade-in">
          {triageResult.triageDecision === 'Fast-Track' ? (
            /* NHÁNH A: FAST-TRACK */
            <div>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ✓
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
                Phân Luồng: Tự Chủ Vững Vàng (Fast-Track)
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
                Năng Lực & Nhận Thức Của Em Rất Thực Tế!
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
                Dữ liệu đối chứng cho thấy điểm tổ hợp ước tính của em (<span className="font-bold text-slate-900">{triageResult.totalStudentScore}đ</span>) 
                hoàn toàn tương thích với ngưỡng điểm chuẩn an toàn (<span className="font-bold text-slate-900">{triageResult.avgCutoff}đ</span>), 
                đồng thời em đã thấu hiểu các rủi ro việc làm. Em đủ điều kiện chuyển thẳng sang Bước 5 để lập Kế hoạch hành động mà không cần qua tham vấn 1-1.
              </p>
              <button
                type="button"
                onClick={() => handleCompleteAction('STEP_5')}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
              >
                TIẾP TỤC BƯỚC 5: THIẾT LẬP KẾ HOẠCH HÀNH ĐỘNG ĐA TUYẾN ➔
              </button>
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
                >
                  ✎ Điều chỉnh số liệu đối chứng
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleResetStep3}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại Bước 3 (Nhập lại từ đầu)</span>
                </button>
              </div>
            </div>
          ) : (
            /* NHÁNH B: IN-DEPTH MENTORSHIP */
            <div>
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ⚠️
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase">
                Phân Luồng: Tham Vấn Chuyên Sâu (In-depth Mentorship)
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
                Phát Hiện Khoảng Cách Nhận Thức Cần Tháo Gỡ!
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
                Số liệu đối chứng cho thấy điểm số hiện tại đang có khoảng cách (<span className="font-bold text-rose-600">{triageResult.scoreGap} điểm</span>) 
                so với điểm chuẩn thực tế, hoặc có sự băn khoăn lớn về nguy cơ việc làm/áp lực chọn ngành. 
                Hệ thống đề xuất em tham gia phiên tham vấn 1-1 cùng Thầy/Cô hoặc Cố vấn tại Bước 4 để được định hướng an toàn.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-xl max-w-md mx-auto mb-6 text-left text-xs text-slate-600 space-y-1.5 border border-slate-200">
                <div className="font-bold text-slate-700 mb-1">Dữ liệu tóm tắt phục vụ tham vấn Bước 4:</div>
                <div>• Tổ hợp môn: <span className="font-bold">{triageResult.targetCombination}</span> (Điểm HS: {triageResult.totalStudentScore}đ)</div>
                <div>• Điểm chuẩn 2 năm: <span className="font-bold">{triageResult.avgCutoff}đ</span> (Chênh lệch: {triageResult.scoreGap}đ)</div>
                <div>• Học phí: <span className="font-bold">{triageResult.tuitionFee} triệu/năm</span></div>
                {triageResult.employmentRate > 0 && (
                  <div>• Tỷ lệ việc làm sau 1 năm: <span className="font-bold">{triageResult.employmentRate}%</span></div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCompleteAction('STEP_4')}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
              >
                TIẾP TỤC BƯỚC 4: XUẤT HỒ SƠ & ĐẶT LỊCH THAM VẤN 1-1 ➔
              </button>
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
                >
                  ✎ Điều chỉnh số liệu đối chứng
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleResetStep3}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại Bước 3 (Nhập lại từ đầu)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}