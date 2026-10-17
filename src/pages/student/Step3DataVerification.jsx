import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';

/**
 * MODULE BƯỚC 3: MÔI TRƯỜNG ĐỐI CHỨNG DỮ LIỆU ĐỀ ÁN & THỊ TRƯỜNG LAO ĐỘNG
 * Phân ngành: Khoa học Xã hội và Hành vi (CBAS) - Dự án ViSEF 2026
 * Cơ chế: Guided Empirical Grounding + Algorithmic Cognitive Triage
 */

// Helper làm sạch và chuẩn hóa số liệu người dùng nhập (hỗ trợ số thực, dấu phẩy, chuỗi kèm đơn vị 'triệu', 'tr', '/năm')
const parseNumericInput = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;
  const cleaned = str.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
};

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

  // Đọc đồng bộ dữ liệu đã lưu từ cbas_step3_triage nếu học sinh quay lại hoặc tải lại trang
  const initialSavedData = useMemo(() => {
    try {
      const stored = localStorage.getItem('cbas_step3_triage');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  }, []);

  // 1. STATE DỮ LIỆU KHỐI 1: TỔ HỢP MÔN & ĐIỂM CHUẨN (Khởi tạo trực tiếp từ cache tránh race condition)
  const [targetCombination, setTargetCombination] = useState(() => initialSavedData?.targetCombination || 'A00');
  const [customCombination, setCustomCombination] = useState(() => initialSavedData?.customCombination || '');
  const [customSubject1, setCustomSubject1] = useState(() => initialSavedData?.customSubject1 || '');
  const [customSubject2, setCustomSubject2] = useState(() => initialSavedData?.customSubject2 || '');
  const [customSubject3, setCustomSubject3] = useState(() => initialSavedData?.customSubject3 || '');

  // TỰ ĐỘNG NHẬN DIỆN ĐẠI HỌC NHA TRANG HOẶC TRƯỜNG THANG 40
  const isTargetNhaTrang = useMemo(() => {
    const s = ((userProfile?.targetSchool) || '').toLowerCase();
    return s.includes('nha trang') || s.includes('ntu');
  }, [userProfile?.targetSchool]);

  // CHẾ ĐỘ TÍNH ĐIỂM: 'standard' (Thang 30 chuẩn: M1 + M2 + M3)
  //                   'scale40'  (Thang 40 điểm: Môn chính x 2 + 2 môn còn lại - như ĐH Nha Trang, ĐH Hà Nội...)
  //                   'scale30_converted' (Quy đổi Thang 30: [(Môn chính x 2) + M2 + M3] * 3 / 4 chuẩn Bộ GD&ĐT)
  const [weightMode, setWeightMode] = useState(() => {
    if (initialSavedData?.weightMode && initialSavedData.weightMode !== 'standard') {
      return initialSavedData.weightMode;
    }
    const s = ((userProfile?.targetSchool) || '').toLowerCase();
    if (s.includes('nha trang') || s.includes('ntu')) {
      return 'scale40';
    }
    return initialSavedData?.weightMode || 'standard';
  });
  const [mainSubjectIndex, setMainSubjectIndex] = useState(() => initialSavedData?.mainSubjectIndex || 1);

  // TỰ ĐỘNG KÍCH HOẠT THANG 40 ĐIỂM NẾU HỌC SINH CHỌN ĐH NHA TRANG (ngay cả khi có cache cũ)
  React.useEffect(() => {
    if (isTargetNhaTrang && weightMode === 'standard') {
      setWeightMode('scale40');
    }
  }, [isTargetNhaTrang]);

  const [scoreSubject1, setScoreSubject1] = useState(() => initialSavedData?.scoreSubject1 != null ? String(initialSavedData.scoreSubject1) : '');
  const [scoreSubject2, setScoreSubject2] = useState(() => initialSavedData?.scoreSubject2 != null ? String(initialSavedData.scoreSubject2) : '');
  const [scoreSubject3, setScoreSubject3] = useState(() => initialSavedData?.scoreSubject3 != null ? String(initialSavedData.scoreSubject3) : '');
  const [cutoff2025, setCutoff2025] = useState(() => {
    if (initialSavedData?.cutoff2025 != null) return String(initialSavedData.cutoff2025);
    if (initialSavedData?.cutoff2024 != null) return String(initialSavedData.cutoff2024);
    return '';
  });
  const [cutoff2026, setCutoff2026] = useState(() => initialSavedData?.cutoff2026 != null ? String(initialSavedData.cutoff2026) : '');
  const [tuitionFee, setTuitionFee] = useState(() => initialSavedData?.tuitionFee != null ? String(initialSavedData.tuitionFee) : '');

  // 2. STATE DỮ LIỆU KHỐI 2: THỊ TRƯỜNG VIỆC LÀM
  const [employmentRate, setEmploymentRate] = useState(() => initialSavedData?.employmentRate != null ? String(initialSavedData.employmentRate) : '');
  const [laborMarketTrend, setLaborMarketTrend] = useState(() => initialSavedData?.laborMarketTrend || 'balanced');

  // 3. STATE DỮ LIỆU KHỐI 3: NGUYÊN NHÂN THẤT NGHIỆP & PHẢN TƯ
  const [unemploymentReasons, setUnemploymentReasons] = useState(() => Array.isArray(initialSavedData?.unemploymentReasons) ? initialSavedData.unemploymentReasons : []);
  const [reflectionText, setReflectionText] = useState(() => initialSavedData?.reflectionText || '');

  // 4. STATE ĐIỀU KHIỂN GIAO DIỆN KẾT QUẢ PHÂN LUỒNG
  const [triageResult, setTriageResult] = useState(() => initialSavedData?.triageDecision ? initialSavedData : null);
  const [submitted, setSubmitted] = useState(() => Boolean(initialSavedData?.triageDecision));

  // DANH MỤC TỔ HỢP PHỔ BIẾN THEO CHƯƠNG TRÌNH GDPT 2018 (Bổ sung C14 Toán Văn KTPL, D14, D15)
  const combinationOptions = [
    { code: 'A00', name: 'A00 (Toán, Vật lý, Hóa học)', subjects: ['Toán', 'Vật lý', 'Hóa học'] },
    { code: 'A01', name: 'A01 (Toán, Vật lý, Tiếng Anh)', subjects: ['Toán', 'Vật lý', 'Tiếng Anh'] },
    { code: 'B00', name: 'B00 (Toán, Hóa học, Sinh học)', subjects: ['Toán', 'Hóa học', 'Sinh học'] },
    { code: 'C00', name: 'C00 (Ngữ văn, Lịch sử, Địa lý)', subjects: ['Ngữ văn', 'Lịch sử', 'Địa lý'] },
    { code: 'C14', name: 'C14 (Toán, Ngữ văn, GDKT&PL)', subjects: ['Toán', 'Ngữ văn', 'GDKT&PL'] },
    { code: 'C19', name: 'C19 (Ngữ văn, Lịch sử, GDKT&PL)', subjects: ['Ngữ văn', 'Lịch sử', 'GDKT&PL'] },
    { code: 'C20', name: 'C20 (Ngữ văn, Địa lý, GDKT&PL)', subjects: ['Ngữ văn', 'Địa lý', 'GDKT&PL'] },
    { code: 'D01', name: 'D01 (Toán, Ngữ văn, Tiếng Anh)', subjects: ['Toán', 'Ngữ văn', 'Tiếng Anh'] },
    { code: 'D07', name: 'D07 (Toán, Hóa học, Tiếng Anh)', subjects: ['Toán', 'Hóa học', 'Tiếng Anh'] },
    { code: 'D14', name: 'D14 (Ngữ văn, Lịch sử, Tiếng Anh)', subjects: ['Ngữ văn', 'Lịch sử', 'Tiếng Anh'] },
    { code: 'D15', name: 'D15 (Ngữ văn, Địa lý, Tiếng Anh)', subjects: ['Ngữ văn', 'Địa lý', 'Tiếng Anh'] },
    { code: 'D84', name: 'D84 (Toán, GDKT&PL, Tiếng Anh)', subjects: ['Toán', 'GDKT&PL', 'Tiếng Anh'] },
    { code: 'A10', name: 'A10 (Toán, Vật lý, GDKT&PL)', subjects: ['Toán', 'Vật lý', 'GDKT&PL'] },
    { code: 'TIN', name: 'Tổ hợp Tin học (Toán, Tin học, Tiếng Anh)', subjects: ['Toán', 'Tin học', 'Tiếng Anh'] },
    { code: 'OTHER', name: 'Tổ hợp tự chọn khác (Tự nhập mã & môn)', subjects: ['Môn 1', 'Môn 2', 'Môn 3'] },
  ];

  // TRÍCH XUẤT TÊN 3 MÔN CỦA TỔ HỢP ĐƯỢC CHỌN
  const currentComboObj = useMemo(() => {
    return combinationOptions.find(opt => opt.code === targetCombination) || {
      code: targetCombination,
      name: targetCombination,
      subjects: ['Môn 1', 'Môn 2', 'Môn 3']
    };
  }, [targetCombination]);

  const subjectNames = useMemo(() => {
    if (targetCombination === 'OTHER') {
      return [
        customSubject1.trim() || 'Môn 1',
        customSubject2.trim() || 'Môn 2',
        customSubject3.trim() || 'Môn 3'
      ];
    }
    return currentComboObj.subjects || ['Môn 1', 'Môn 2', 'Môn 3'];
  }, [targetCombination, currentComboObj, customSubject1, customSubject2, customSubject3]);

  // THANG ĐIỂM TỐI ĐA (40 HOẶC 30)
  const maxScale = weightMode === 'scale40' ? 40 : 30;

  // TÍNH TOÁN ĐỘNG CÁC CHỈ SỐ ĐIỂM SỐ & CHI TIẾT CÔNG THỨC
  const { totalStudentScore, calculationDetails, mainSubjectName } = useMemo(() => {
    const s1 = parseNumericInput(scoreSubject1);
    const s2 = parseNumericInput(scoreSubject2);
    const s3 = parseNumericInput(scoreSubject3);

    const m1 = subjectNames[0] || 'Môn 1';
    const m2 = subjectNames[1] || 'Môn 2';
    const m3 = subjectNames[2] || 'Môn 3';

    if (weightMode === 'scale40') {
      let score = 0;
      let formula = '';
      let chosenSubject = m1;
      if (mainSubjectIndex === 1) {
        score = s1 * 2 + s2 + s3;
        formula = `(${m1} × 2) + ${m2} + ${m3} = (${s1} × 2) + ${s2} + ${s3} = ${Number(score.toFixed(2))}đ`;
        chosenSubject = m1;
      } else if (mainSubjectIndex === 2) {
        score = s2 * 2 + s1 + s3;
        formula = `${m1} + (${m2} × 2) + ${m3} = ${s1} + (${s2} × 2) + ${s3} = ${Number(score.toFixed(2))}đ`;
        chosenSubject = m2;
      } else {
        score = s3 * 2 + s1 + s2;
        formula = `${m1} + ${m2} + (${m3} × 2) = ${s1} + ${s2} + (${s3} × 2) = ${Number(score.toFixed(2))}đ`;
        chosenSubject = m3;
      }
      return {
        totalStudentScore: Number(score.toFixed(2)),
        calculationDetails: formula,
        mainSubjectName: chosenSubject
      };
    } else if (weightMode === 'scale30_converted') {
      let weightedSum = 0;
      let formula = '';
      let chosenSubject = m1;
      if (mainSubjectIndex === 1) {
        weightedSum = s1 * 2 + s2 + s3;
        const res = (weightedSum * 3) / 4;
        formula = `[(${m1} × 2) + ${m2} + ${m3}] × 3 / 4 = [(${s1} × 2) + ${s2} + ${s3}] × 3 / 4 = ${Number(res.toFixed(2))}đ`;
        chosenSubject = m1;
        return { totalStudentScore: Number(res.toFixed(2)), calculationDetails: formula, mainSubjectName: chosenSubject };
      } else if (mainSubjectIndex === 2) {
        weightedSum = s2 * 2 + s1 + s3;
        const res = (weightedSum * 3) / 4;
        formula = `[${m1} + (${m2} × 2) + ${m3}] × 3 / 4 = [${s1} + (${s2} × 2) + ${s3}] × 3 / 4 = ${Number(res.toFixed(2))}đ`;
        chosenSubject = m2;
        return { totalStudentScore: Number(res.toFixed(2)), calculationDetails: formula, mainSubjectName: chosenSubject };
      } else {
        weightedSum = s3 * 2 + s1 + s2;
        const res = (weightedSum * 3) / 4;
        formula = `[${m1} + ${m2} + (${m3} × 2)] × 3 / 4 = [${s1} + ${s2} + (${s3} × 2)] × 3 / 4 = ${Number(res.toFixed(2))}đ`;
        chosenSubject = m3;
        return { totalStudentScore: Number(res.toFixed(2)), calculationDetails: formula, mainSubjectName: chosenSubject };
      }
    } else {
      const sum = s1 + s2 + s3;
      return {
        totalStudentScore: Number(sum.toFixed(2)),
        calculationDetails: `${m1} + ${m2} + ${m3} = ${s1} + ${s2} + ${s3} = ${Number(sum.toFixed(2))}đ`,
        mainSubjectName: null
      };
    }
  }, [scoreSubject1, scoreSubject2, scoreSubject3, weightMode, mainSubjectIndex, subjectNames]);

  const avgCutoff = useMemo(() => {
    const c25 = parseNumericInput(cutoff2025);
    const c26 = parseNumericInput(cutoff2026);
    if (c25 > 0 && c26 > 0) return Number(((c25 + c26) / 2).toFixed(2));
    if (c25 > 0) return c25;
    if (c26 > 0) return c26;
    return 0;
  }, [cutoff2025, cutoff2026]);

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

    const c25 = parseNumericInput(cutoff2025);
    const c26 = parseNumericInput(cutoff2026);
    const s1 = parseNumericInput(scoreSubject1);
    const s2 = parseNumericInput(scoreSubject2);
    const s3 = parseNumericInput(scoreSubject3);
    const cleanedTuition = parseNumericInput(tuitionFee);
    const cleanedEmployment = parseNumericInput(employmentRate);

    // 1. Kiểm tra validation tối thiểu (bao gồm cả học phí ước tính)
    if (!c25 || !c26 || !s1 || !s2 || !s3 || cleanedTuition <= 0 || !reflectionText.trim()) {
      alert("Vui lòng tra cứu và điền đầy đủ các thông tin đối chứng bắt buộc (Điểm chuẩn 2 năm, Điểm 3 môn học bạ, Học phí ước tính > 0 và Tự phản tư) để hệ thống phân tích.");
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
    // Nếu điểm thiếu hụt tương ứng ngưỡng an toàn (thang 40 là -2.0đ, thang 30 là -1.5đ) HOẶC có bước ngoặt ở Bước 2 HOẶC có mâu thuẫn ngoại sinh -> Phân luồng In-depth
    const gapThreshold = maxScale === 40 ? -2.0 : -1.5;
    const requiresInDepth = (actualGap < gapThreshold) || turningPoint || hasExternalConflict;

    const resultData = {
      targetCombination: targetCombination === 'OTHER' ? customCombination : targetCombination,
      weightMode,
      mainSubjectIndex,
      mainSubjectName,
      maxScale,
      weightFormulaDesc: calculationDetails,
      scoreSubject1: s1,
      scoreSubject2: s2,
      scoreSubject3: s3,
      customSubject1: targetCombination === 'OTHER' ? customSubject1 : '',
      customSubject2: targetCombination === 'OTHER' ? customSubject2 : '',
      customSubject3: targetCombination === 'OTHER' ? customSubject3 : '',
      totalStudentScore,
      cutoff2025: c25,
      cutoff2026: c26,
      cutoff2024: c25, // Tương thích ngược với các module cũ
      avgCutoff,
      scoreGap: actualGap,
      tuitionFee: cleanedTuition,
      employmentRate: cleanedEmployment,
      laborMarketTrend,
      unemploymentReasons,
      reflectionText: reflectionText.trim(),
      triageDecision: requiresInDepth ? 'In-depth' : 'Fast-Track',
      pathway: 'academic',
      targetMajor: userProfile.targetMajor || 'Chưa xác định',
      targetSchool: userProfile.targetSchool || 'Chưa xác định',
      timestamp: new Date().toISOString()
    };

    // Tự động lưu cache cho bước 4 / bước 5 và tương thích ngược
    try {
      localStorage.setItem('cbas_step3_triage', JSON.stringify(resultData));
      localStorage.removeItem('cbas_step3_vocational');
      localStorage.setItem('cbas_step3_reflection', reflectionText.trim());
      const scaleLabel = `/${maxScale}đ`;
      const weightDesc = weightMode === 'scale40' ? ' (Thang 40)' : (weightMode === 'scale30_converted' ? ' (Quy đổi thang 30)' : '');
      const step3Evidence = {
        cutoff_score: `${resultData.targetCombination}${weightDesc}: ${resultData.totalStudentScore}${scaleLabel} vs Chuẩn TB ${resultData.avgCutoff}${scaleLabel} (Lệch: ${resultData.scoreGap > 0 ? `+${resultData.scoreGap}` : resultData.scoreGap}đ)`,
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
      setCutoff2025('');
      setCutoff2026('');
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
        try {
          localStorage.setItem('cbas_step4_fast_track', 'true');
          localStorage.setItem('cbas_step4_completed', 'true');
        } catch (e) {}
        navigate('/student/reflection');
      } else {
        try {
          localStorage.setItem('cbas_step4_active_stage', '4A');
          localStorage.setItem('cbas_step4_active_triage', 'PHAN_LUONG_1');
        } catch (e) {}
        navigate('/student/booking');
      }
    }
  };

  React.useEffect(() => {
    window.goToStep = (step) => {
      if (step === 5) handleCompleteAction('STEP_5');
      else if (step === 4) handleCompleteAction('STEP_4');
    };
    return () => {
      delete window.goToStep;
    };
  }, [triageResult]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Giai đoạn 3 / Quy trình Can thiệp 5 Bước
          </span>
          <span className="text-xs text-slate-400">SocraCareer KHKT 2026 Protocol</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ hợp môn xét tuyển chính thức:
                </label>
                <select
                  value={targetCombination}
                  onChange={(e) => setTargetCombination(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800"
                >
                  {combinationOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {targetCombination === 'OTHER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhập mã tổ hợp tự chọn:
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

            {targetCombination === 'OTHER' && (
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Tên Môn 1:</span>
                  <input
                    type="text"
                    placeholder="VD: Toán"
                    value={customSubject1}
                    onChange={(e) => setCustomSubject1(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Tên Môn 2:</span>
                  <input
                    type="text"
                    placeholder="VD: Ngữ văn"
                    value={customSubject2}
                    onChange={(e) => setCustomSubject2(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Tên Môn 3:</span>
                  <input
                    type="text"
                    placeholder="VD: Tiếng Anh"
                    value={customSubject3}
                    onChange={(e) => setCustomSubject3(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* CƠ CHẾ TÍNH ĐIỂM & MÔN TRỌNG SỐ (MÔN CHÍNH NHÂN HỆ SỐ 2) */}
            <div className="mb-4 p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              
              {/* BANNER TỰ ĐỘNG CHO ĐẠI HỌC NHA TRANG */}
              {isTargetNhaTrang && (
                <div className="p-3 bg-amber-500/15 border-2 border-amber-400 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <span className="font-extrabold text-amber-900 block text-xs">
                        Đã kích hoạt: Thang điểm 40 cho {userProfile.targetSchool || 'ĐH Nha Trang'} (Môn chính nhân hệ số 2)
                      </span>
                      <span className="text-[11px] text-amber-800">
                        Ngành Marketing & các ngành tại ĐH Nha Trang tính theo thang 40. Điểm học bạ của em sẽ được nhân hệ số 2 môn chính để đối chiếu chuẩn xác.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeightMode('scale40')}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    {weightMode === 'scale40' ? '✓ Đang dùng Thang 40' : '👉 Bấm chuyển Thang 40'}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>⚖️ Chọn quy chế tính điểm xét tuyển của trường (Bấm vào thẻ bên dưới):</span>
                </label>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${
                  weightMode === 'scale40' 
                    ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-200' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  Đang chọn: <strong>Thang {maxScale} điểm</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. THANG 30 CHUẨN */}
                <button
                  type="button"
                  onClick={() => setWeightMode('standard')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                    weightMode === 'standard'
                      ? 'bg-indigo-600 text-white font-bold shadow-md ring-2 ring-indigo-300 border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">📘 Thang 30 chuẩn</span>
                    <span className="text-xs">{weightMode === 'standard' ? '🔘' : '⚪'}</span>
                  </div>
                  <div className={`text-[11px] ${weightMode === 'standard' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    3 môn hệ số 1 (M1 + M2 + M3)
                  </div>
                  <div className={`mt-1.5 text-[10px] font-bold inline-block px-1.5 py-0.5 rounded ${
                    weightMode === 'standard' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {weightMode === 'standard' ? '✓ Đang áp dụng' : 'Bấm để chọn'}
                  </div>
                </button>

                {/* 2. THANG 40 ĐIỂM (ĐH NHA TRANG) */}
                <button
                  type="button"
                  onClick={() => setWeightMode('scale40')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                    weightMode === 'scale40'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg ring-3 ring-amber-300 border-amber-500'
                      : 'bg-white border-amber-300 text-slate-800 hover:border-amber-500 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black">⭐ Thang 40 điểm</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                        weightMode === 'scale40' ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        ĐH Nha Trang
                      </span>
                    </div>
                    <span className="text-xs">{weightMode === 'scale40' ? '🔘' : '⚪'}</span>
                  </div>
                  <div className={`text-[11px] font-medium ${weightMode === 'scale40' ? 'text-slate-900' : 'text-slate-600'}`}>
                    Môn chính × 2 + 2 môn còn lại
                  </div>
                  <div className={`mt-1.5 text-[10px] font-black inline-block px-2 py-0.5 rounded ${
                    weightMode === 'scale40' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {weightMode === 'scale40' ? '✓ ĐANG ÁP DỤNG THANG 40' : '👉 BẤM CHỌN THANG 40'}
                  </div>
                </button>

                {/* 3. QUY ĐỔI THANG 30 */}
                <button
                  type="button"
                  onClick={() => setWeightMode('scale30_converted')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                    weightMode === 'scale30_converted'
                      ? 'bg-sky-600 text-white font-bold shadow-md ring-2 ring-sky-300 border-sky-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black">📐 Quy đổi Thang 30</span>
                    <span className="text-xs">{weightMode === 'scale30_converted' ? '🔘' : '⚪'}</span>
                  </div>
                  <div className={`text-[11px] ${weightMode === 'scale30_converted' ? 'text-sky-100' : 'text-slate-500'}`}>
                    Chuẩn Bộ GD&ĐT: (Mchính x 2 + ...) × 3 / 4
                  </div>
                  <div className={`mt-1.5 text-[10px] font-bold inline-block px-1.5 py-0.5 rounded ${
                    weightMode === 'scale30_converted' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {weightMode === 'scale30_converted' ? '✓ Đang áp dụng' : 'Bấm để chọn'}
                  </div>
                </button>
              </div>

              {/* BỘ CHỌN MÔN CHÍNH KHI ÁP DỤNG HỆ SỐ 2 */}
              {weightMode !== 'standard' && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    👉 Bấm chọn môn trọng số nhân hệ số 2 trong tổ hợp:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((idx) => {
                      const sName = subjectNames[idx - 1] || `Môn ${idx}`;
                      const isSelected = mainSubjectIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMainSubjectIndex(idx)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs ring-2 ring-amber-300'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <div className="truncate font-bold">{sName}</div>
                          <div className="text-[10px] opacity-90 mt-0.5">
                            {isSelected ? '⭐ Hệ số 2' : 'Hệ số 1'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-slate-700 font-bold truncate">
                      1. {subjectNames[0] || 'Môn 1'}
                    </span>
                    {weightMode !== 'standard' && mainSubjectIndex === 1 && (
                      <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                        x2
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="10"
                    placeholder="VD: 7.5"
                    value={scoreSubject1}
                    onChange={(e) => setScoreSubject1(e.target.value)}
                    className={`w-full p-2 bg-white border rounded-lg text-sm text-center font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      weightMode !== 'standard' && mainSubjectIndex === 1
                        ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/20'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-slate-700 font-bold truncate">
                      2. {subjectNames[1] || 'Môn 2'}
                    </span>
                    {weightMode !== 'standard' && mainSubjectIndex === 2 && (
                      <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                        x2
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="10"
                    placeholder="VD: 6.5"
                    value={scoreSubject2}
                    onChange={(e) => setScoreSubject2(e.target.value)}
                    className={`w-full p-2 bg-white border rounded-lg text-sm text-center font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      weightMode !== 'standard' && mainSubjectIndex === 2
                        ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/20'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-slate-700 font-bold truncate">
                      3. {subjectNames[2] || 'Môn 3'}
                    </span>
                    {weightMode !== 'standard' && mainSubjectIndex === 3 && (
                      <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                        x2
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="10"
                    placeholder="VD: 6.0"
                    value={scoreSubject3}
                    onChange={(e) => setScoreSubject3(e.target.value)}
                    className={`w-full p-2 bg-white border rounded-lg text-sm text-center font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      weightMode !== 'standard' && mainSubjectIndex === 3
                        ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/20'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* TỔNG ĐIỂM HỌC BẠ TỰ ĐỘNG & CHI TIẾT CÔNG THỨC */}
              <div className="mt-3 pt-2 border-t border-indigo-100 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-bold">Tổng điểm tổ hợp ước tính của em:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-lg px-3 py-0.5 rounded-lg border shadow-xs ${
                      weightMode === 'scale40'
                        ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                    }`}>
                      {totalStudentScore} / {maxScale} điểm
                    </span>
                    {weightMode === 'scale40' && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                        Thang 40
                      </span>
                    )}
                  </div>
                </div>
                {calculationDetails && (
                  <div className="text-[11px] text-indigo-700 font-mono bg-indigo-50 p-1.5 rounded border border-indigo-100/80 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Công thức: <strong>{calculationDetails}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* ĐIỂM CHUẨN 2 NĂM & HỌC PHÍ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm chuẩn Năm 2025 (Thang {maxScale}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={maxScale}
                  placeholder={weightMode === 'scale40' ? "VD: 28.0 (Thang 40)" : "VD: 25.5"}
                  value={cutoff2025}
                  onChange={(e) => setCutoff2025(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm chuẩn Năm 2026 (Thang {maxScale}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={maxScale}
                  placeholder={weightMode === 'scale40' ? "VD: 28.5 (Thang 40)" : "VD: 26.0"}
                  value={cutoff2026}
                  onChange={(e) => setCutoff2026(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Học phí ước tính (Triệu VNĐ/năm):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="VD: 30"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    className="w-full p-2.5 pr-20 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    triệu/năm
                  </span>
                </div>
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
                      (Điểm chuẩn TB 2 năm (2025 - 2026): {avgCutoff} / {maxScale} điểm)
                    </span>
                  </div>
                  
                  <p className="leading-relaxed">
                    {scoreGap >= 0 ? (
                      `Dữ liệu đối chứng ghi nhận em đang có lợi thế cạnh tranh rất tốt (+${scoreGap} điểm trên thang ${maxScale}) để hiện thực hóa mục tiêu ngành học mong muốn. Tuy nhiên, đề thi tốt nghiệp THPT luôn có độ phân hóa khắt khe hơn học bạ; hãy tiếp tục duy trì kỷ luật ôn tập và rèn luyện tâm lý phòng thi vững vàng để chuyển hóa trọn vẹn ưu thế này thành điểm số thực tế!`
                    ) : (
                      `Điểm học bạ hiện tại (${totalStudentScore} / ${maxScale} điểm) đang thấp hơn điểm chuẩn thực tế ${Math.abs(scoreGap)} điểm. Em cần tập trung bứt phá môn sở trường hoặc kích hoạt phương án nguyện vọng dự phòng vừa sức.`
                    )}
                  </p>
                </div>

                <div className={`font-black text-sm px-3.5 py-2 rounded-lg shrink-0 self-start md:self-center shadow-sm border text-center ${
                  scoreGap >= 0 
                    ? 'bg-white text-emerald-700 border-emerald-200' 
                    : 'bg-white text-rose-700 border-rose-200'
                }`}>
                  <div>{scoreGap > 0 ? `+${scoreGap}` : scoreGap} điểm</div>
                  <div className="text-[10px] text-slate-500 font-normal">Thang {maxScale}</div>
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
                { id: 'lacking_skills', label: 'Sinh viên thiếu ngoại ngữ và kỹ năng ứng dụng công nghệ/AI vào thực tế' },
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
                Phân Luồng 2: Xác Nhận Thực Chứng Tinh Gọn (Fast-track Validation)
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
                Năng Lực & Nhận Thức Của Em Rất Thực Tế!
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
                Dữ liệu đối chứng cho thấy điểm tổ hợp ước tính của em (<span className="font-bold text-slate-900">{triageResult.totalStudentScore}đ</span>) 
                hoàn toàn tương thích với ngưỡng điểm chuẩn an toàn (<span className="font-bold text-slate-900">{triageResult.avgCutoff}đ</span>), 
                đồng thời em đã đạt trạng thái cân bằng nhận thức (CRS tiệm cận 0). 
                Hệ thống tự động kích hoạt <strong>Phân luồng 2 (Xác nhận thực chứng tinh gọn)</strong> tại Bước 4: 
                rà soát độc lập Hồ sơ kinh nghiệm thực tế (Case Dossier) và hoàn thành bảng kiểm phản tư góc khuất nghề nghiệp dưới sự giám sát gián tiếp của Mentor.
              </p>
              {/* THẺ XÁC THỰC PHÂN LUỒNG 2: FAST-TRACK CHUẨN CBAS */}
              <div className="p-5 rounded-2xl bg-teal-50 border-2 border-teal-300 text-xs space-y-3 max-w-xl mx-auto text-left mb-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">✓</span>
                  <span className="font-extrabold text-teal-900 uppercase tracking-wide text-xs">
                    KẾT QUẢ PHÂN LUỒNG: XÁC NHẬN TINH GỌN (FAST-TRACK)
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed font-medium">
                  Dữ liệu đối chứng ghi nhận: Năng lực học bạ và hồ sơ thiên hướng của em đang <strong>tương thích tốt với ngưỡng tham chiếu</strong> của ngành mục tiêu. Hệ thống chuyển tiếp em sang <strong>Bước 4 để Đăng ký lịch hẹn xác nhận cùng Mentor</strong> và rà soát hồ sơ đối chất thực tế trước khi hoàn thiện cam kết hành động.
                </p>

                {/* DỮ LIỆU TÓM TẮT PHỤC VỤ THAM VẤN BƯỚC 4 (FAST-TRACK) */}
                <div className="bg-white/90 p-4 rounded-xl border border-teal-200 text-left text-xs text-slate-700 space-y-1.5 shadow-xs">
                  <div className="font-bold text-teal-900 mb-1">Dữ liệu tóm tắt phục vụ tham vấn Bước 4:</div>
                  <div>• Tổ hợp môn: <span className="font-bold text-slate-900">{triageResult.targetCombination}</span> (Điểm HS: {triageResult.totalStudentScore}/{triageResult.maxScale || 30}đ{triageResult.weightFormulaDesc ? ` [${triageResult.weightFormulaDesc}]` : ''})</div>
                  <div>• Điểm chuẩn TB 2 năm (2025 - 2026): <span className="font-bold text-slate-900">{triageResult.avgCutoff}/{triageResult.maxScale || 30}đ</span> (Chênh lệch: {triageResult.scoreGap > 0 ? `+${triageResult.scoreGap}` : triageResult.scoreGap}đ)</div>
                  <div>• Học phí: <span className="font-bold text-slate-900">{triageResult.tuitionFee} triệu/năm</span></div>
                  {triageResult.employmentRate > 0 && (
                    <div>• Tỷ lệ việc làm sau 1 năm: <span className="font-bold text-slate-900">{triageResult.employmentRate}%</span></div>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCompleteAction('STEP_4')}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl transition shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>TIẾP TỤC BƯỚC 4: ĐẶT LỊCH HẸN VỚI MENTOR ➔</span>
                  </button>
                </div>
              </div>

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
                Phân Luồng 1: Tham Vấn Trực Tiếp Chuyên Sâu (In-depth 1-on-1)
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
                Phát Hiện Khoảng Cách Nhận Thức Cần Tháo Gỡ!
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
                Số liệu đối chứng cho thấy điểm số hiện tại đang có khoảng cách (<span className="font-bold text-rose-600">{triageResult.scoreGap > 0 ? `+${triageResult.scoreGap}` : triageResult.scoreGap} điểm</span>) 
                so với điểm chuẩn thực tế, hoặc có sự băn khoăn lớn về nguy cơ việc làm/áp lực chọn ngành (độ lệch nhận thức CRS lớn). 
                Hệ thống kích hoạt <strong>Phân luồng 1</strong>: bắt buộc tham gia phiên đối chất 1-1 trực tiếp cùng Mentor (20 - 30 phút) 
                để bóc tách các rào cản tâm lý, áp lực định kiến và tái cấu trúc mục tiêu an toàn.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-xl max-w-md mx-auto mb-6 text-left text-xs text-slate-600 space-y-1.5 border border-slate-200">
                <div className="font-bold text-slate-700 mb-1">Dữ liệu tóm tắt phục vụ tham vấn Bước 4:</div>
                <div>• Tổ hợp môn: <span className="font-bold">{triageResult.targetCombination}</span> (Điểm HS: {triageResult.totalStudentScore}/{triageResult.maxScale || 30}đ{triageResult.weightFormulaDesc ? ` [${triageResult.weightFormulaDesc}]` : ''})</div>
                <div>• Điểm chuẩn TB 2 năm (2025 - 2026): <span className="font-bold">{triageResult.avgCutoff}/{triageResult.maxScale || 30}đ</span> (Chênh lệch: {triageResult.scoreGap > 0 ? `+${triageResult.scoreGap}` : triageResult.scoreGap}đ)</div>
                <div>• Học phí: <span className="font-bold">{triageResult.tuitionFee} triệu/năm</span></div>
                {triageResult.employmentRate > 0 && (
                  <div>• Tỷ lệ việc làm sau 1 năm: <span className="font-bold">{triageResult.employmentRate}%</span></div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCompleteAction('STEP_4')}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-sm cursor-pointer"
              >
                TIẾP TỤC BƯỚC 4: ĐẶT LỊCH THAM VẤN 1-1 CHUYÊN SÂU ➔
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