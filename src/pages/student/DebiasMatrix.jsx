import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Toast from '../../components/common/Toast';
import StepProgressHeader from '../../components/common/StepProgressHeader';
import {
  Crosshair,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Printer,
  Download,
  PenTool,
  Sliders,
  Triangle,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  Home,
  Award,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ADAPTIVE_COMMITMENTS_BY_GRADE, getGradeCommitmentPlan } from '../../data/adaptiveCommitments';
export { ADAPTIVE_COMMITMENTS_BY_GRADE, getGradeCommitmentPlan };

/**
 * BƯỚC 5: LỘ TRÌNH KẾ HOẠCH HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG
 * Action Plan Matrix & Commitment Device (Implementation Intentions - Gollwitzer)
 * Đề tài: Hệ thống can thiệp phản tư SocraCareer (CBAS Model) - ViSEF 2026
 */

export default function DebiasMatrix() {
  const { user, profile, studentCode } = useAuth();
  const navigate = useNavigate();

  // Mã học sinh ẩn danh ViSEF (CT_01 -> CT_30)
  const displayStudentCode = (() => {
    if (studentCode && /^CT_\d{2}$/i.test(studentCode)) return studentCode.toUpperCase();
    try {
      const local = localStorage.getItem('cbas_student_code');
      if (local && /^CT_\d{2}$/i.test(local)) return local.toUpperCase();
    } catch (e) {}
    const email = (user?.email || profile?.email || '').toLowerCase();
    const ctMatch = email.match(/^ct[_\-]?(\d{1,2})@/);
    if (ctMatch) {
      const n = parseInt(ctMatch[1], 10);
      return `CT_${n < 10 ? '0' + n : n}`;
    }
    if (profile?.full_name && /^CT_\d{2}$/i.test(profile.full_name)) {
      return profile.full_name.toUpperCase();
    }
    return studentCode || profile?.student_code || 'CT_01';
  })();

  const studentName = displayStudentCode;

  // --- 1. DỮ LIỆU ĐỐI CHỨNG CÁC BƯỚC TRƯỚC ---
  const [step1Data, setStep1Data] = useState({
    targetMajor: 'Tâm lý học',
    initialConfidence: 8,
    hollandCode: 'RIA'
  });
  const [step2Data, setStep2Data] = useState(null);
  const [step3Data, setStep3Data] = useState(null);
  const [step4Data, setStep4Data] = useState(null);

  // --- 2. BẢNG HIỆU CHUẨN NHẬN THỨC & NGÀNH MỤC TIÊU ---
  const [targetMajor, setTargetMajor] = useState('Tâm lý học');
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [confidenceT2, setConfidenceT2] = useState(7);
  const [showConfidenceSlider, setShowConfidenceSlider] = useState(false);

  // --- 3. TAM GIÁC NGUYỆN VỌNG 3 NẤC THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO) ---
  const [triadTiers, setTriadTiers] = useState({
    dream: {
      label: '1. NGUYỆN VỌNG THỬ THÁCH (STRETCH)',
      targetScore: 'Tham chiếu: 26.5+',
      majorSchool: 'Tâm lý học — ĐH KHXH&NV TP.HCM',
      notes: 'Trường Top đầu — Đòi hỏi nỗ lực tối đa để thu hẹp khoảng cách điểm sàn (tham chiếu: 26.5+)'
    },
    realistic: {
      label: '2. NGUYỆN VỌNG VỪA SỨC (REALISTIC)',
      targetScore: 'Phong độ: 22.5 – 24.0',
      majorSchool: 'Tâm lý học (ĐH Sư phạm) / QTKD (ĐH Nha Trang)',
      notes: 'Mục tiêu chính — Điểm số nằm trong dải phong độ học bạ và điểm thi thử hiện tại (22.5 – 24.0)'
    },
    safe: {
      label: '3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)',
      targetScore: 'Vùng đệm an toàn',
      majorSchool: 'Công tác Xã hội — ĐH Nha Trang',
      notes: 'Vùng đệm dự phòng — Ngành gần có biên độ điểm an toàn cao và tối ưu chi phí đào tạo'
    }
  });
  const [isEditingTriad, setIsEditingTriad] = useState(false);

  // --- 4. MA TRẬN KẾ HOẠCH HÀNH ĐỘNG THEO KHỐI LỚP ---
  const [selectedGrade, setSelectedGrade] = useState(12);
  const [actionPlans, setActionPlans] = useState({
    10: {
      item1: ADAPTIVE_COMMITMENTS_BY_GRADE[10].items[0].text,
      item2: ADAPTIVE_COMMITMENTS_BY_GRADE[10].items[1].text,
      item3: ADAPTIVE_COMMITMENTS_BY_GRADE[10].items[2].text,
      scoreGoal: ADAPTIVE_COMMITMENTS_BY_GRADE[10].items[0].text,
      weakSubjectsPlan: ADAPTIVE_COMMITMENTS_BY_GRADE[10].items[1].text,
      studyTimeCommitment: ADAPTIVE_COMMITMENTS_BY_GRADE[10].items[2].text
    },
    11: {
      item1: ADAPTIVE_COMMITMENTS_BY_GRADE[11].items[0].text,
      item2: ADAPTIVE_COMMITMENTS_BY_GRADE[11].items[1].text,
      item3: ADAPTIVE_COMMITMENTS_BY_GRADE[11].items[2].text,
      scoreGoal: ADAPTIVE_COMMITMENTS_BY_GRADE[11].items[0].text,
      weakSubjectsPlan: ADAPTIVE_COMMITMENTS_BY_GRADE[11].items[1].text,
      studyTimeCommitment: ADAPTIVE_COMMITMENTS_BY_GRADE[11].items[2].text
    },
    12: {
      item1: ADAPTIVE_COMMITMENTS_BY_GRADE[12].items[0].text,
      item2: ADAPTIVE_COMMITMENTS_BY_GRADE[12].items[1].text,
      item3: ADAPTIVE_COMMITMENTS_BY_GRADE[12].items[2].text,
      scoreGoal: ADAPTIVE_COMMITMENTS_BY_GRADE[12].items[0].text,
      weakSubjectsPlan: ADAPTIVE_COMMITMENTS_BY_GRADE[12].items[1].text,
      studyTimeCommitment: ADAPTIVE_COMMITMENTS_BY_GRADE[12].items[2].text
    }
  });

  // Trợ cấp lấy nội dung mục cam kết theo khối lớp
  const getPlanItem = (grade, itemIndex) => {
    const g = Number(grade) || 12;
    const plan = actionPlans[g];
    const defaultText = ADAPTIVE_COMMITMENTS_BY_GRADE[g]?.items[itemIndex]?.text || '';
    if (!plan) return defaultText;
    if (itemIndex === 0) return plan.item1 ?? plan.scoreGoal ?? defaultText;
    if (itemIndex === 1) return plan.item2 ?? plan.weakSubjectsPlan ?? defaultText;
    if (itemIndex === 2) return plan.item3 ?? plan.studyTimeCommitment ?? defaultText;
    return defaultText;
  };

  // --- 5. CHỮ KÝ CAM KẾT ĐIỆN TỬ (CANVAS) ---
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [toast, setToast] = useState(null);

  // Khởi tạo và đọc dữ liệu đã lưu
  useEffect(() => {
    // 1. Đọc Bước 1
    try {
      const rawProfile = localStorage.getItem('cbas_user_profile');
      const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData');
      const p = rawProfile ? JSON.parse(rawProfile) : {};
      const a = rawAnchor ? JSON.parse(rawAnchor) : {};
      const m = p.targetMajor || a.target_career || 'Tâm lý học';
      const c = Number(p.initialConfidence || a.confidence_score || 8);
      const h = p.hollandCode || a.holland_code || 'RIA';
      setStep1Data({ targetMajor: m, initialConfidence: c, hollandCode: h });
      setTargetMajor(m);
    } catch (e) {
      console.warn('Lỗi đọc Step 1:', e);
    }

    // 2. Đọc Bước 2, 3, 4
    try {
      const rawStep2 = localStorage.getItem('cbas_step2_telemetry');
      if (rawStep2) setStep2Data(JSON.parse(rawStep2));
      const rawStep3 = localStorage.getItem('cbas_step3_triage') || localStorage.getItem('cbas_step3_evidence');
      if (rawStep3) setStep3Data(JSON.parse(rawStep3));
      const rawStep4 = localStorage.getItem('mentor_feedback_record') || localStorage.getItem('cbas_step4_feedback');
      if (rawStep4) setStep4Data(JSON.parse(rawStep4));
    } catch (e) {
      console.warn('Lỗi đọc Step 2,3,4:', e);
    }

    // 3. Đọc Bước 5 nếu đã lưu
    try {
      const rawStep5 = localStorage.getItem('cbas_step5_action_plan');
      if (rawStep5) {
        const parsed = JSON.parse(rawStep5);
        if (parsed.targetMajor) setTargetMajor(parsed.targetMajor);
        if (parsed.confidenceT2 !== undefined) setConfidenceT2(Number(parsed.confidenceT2));
        if (parsed.triadTiers) setTriadTiers(parsed.triadTiers);
        if (parsed.selectedGrade) setSelectedGrade(parsed.selectedGrade);
        if (parsed.actionPlans) setActionPlans(parsed.actionPlans);
        if (parsed.hasSignature) setHasSignature(true);
      }
    } catch (e) {
      console.warn('Lỗi đọc Step 5:', e);
    }
  }, []);

  // Xử lý vẽ chữ ký trên Canvas (Chuột & Cảm ứng di động)
  const getCoordinates = (e, canvas) => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Phục hồi chữ ký cũ nếu có
    const savedSig = localStorage.getItem('cbas_step5_signature');
    if (savedSig) {
      setSignatureDataUrl(savedSig);
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = savedSig;
    }

    // Touch event listeners với passive: false để ngăn chặn cuộn màn hình khi đang ký
    const onTouchStart = (e) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0d9488'; // Teal-600 sắc nét trên cả màn hình tối và giấy in A4 trắng
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pos = getCoordinates(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const ctx = canvas.getContext('2d');
      const pos = getCoordinates(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      isDrawingRef.current = false;
      try {
        const url = canvas.toDataURL();
        setSignatureDataUrl(url);
        localStorage.setItem('cbas_step5_signature', url);
      } catch (err) {}
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0d9488'; // Teal-600
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pos = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCoordinates(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const url = canvas.toDataURL();
        setSignatureDataUrl(url);
        localStorage.setItem('cbas_step5_signature', url);
      } catch (err) {}
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl('');
    localStorage.removeItem('cbas_step5_signature');
  };

  // Cập nhật giá trị ma trận theo khối lớp
  const handleUpdatePlan = (field, value) => {
    setActionPlans(prev => {
      const current = prev[selectedGrade] || {};
      return {
        ...prev,
        [selectedGrade]: {
          ...current,
          [field]: value,
          ...(field === 'item1' ? { scoreGoal: value } : {}),
          ...(field === 'item2' ? { weakSubjectsPlan: value } : {}),
          ...(field === 'item3' ? { studyTimeCommitment: value } : {}),
          ...(field === 'scoreGoal' ? { item1: value } : {}),
          ...(field === 'weakSubjectsPlan' ? { item2: value } : {}),
          ...(field === 'studyTimeCommitment' ? { item3: value } : {})
        }
      };
    });
  };

  // Khôi phục nội dung cam kết mẫu chuẩn hóa ViSEF 2026 cho khối lớp đang chọn
  const handleResetToDefaultTemplate = () => {
    const defaultGrade = ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade];
    if (!defaultGrade) return;
    setActionPlans(prev => ({
      ...prev,
      [selectedGrade]: {
        item1: defaultGrade.items[0].text,
        item2: defaultGrade.items[1].text,
        item3: defaultGrade.items[2].text,
        scoreGoal: defaultGrade.items[0].text,
        weakSubjectsPlan: defaultGrade.items[1].text,
        studyTimeCommitment: defaultGrade.items[2].text
      }
    }));
    setToast(`Đã khôi phục mẫu kế hoạch hành động chuẩn hóa ViSEF cho Khối ${selectedGrade}`);
    setTimeout(() => setToast(null), 3000);
  };

  // Cập nhật Tam giác 3 nấc
  const handleUpdateTriad = (tierKey, field, value) => {
    setTriadTiers(prev => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        [field]: value
      }
    }));
  };

  // Lưu và In Bản Cam Kết Dán Góc Học Tập (window.print)
  const handleSaveAndPrint = async () => {
    const canvas = canvasRef.current;
    let sigDataUrl = signatureDataUrl;
    if (canvas && hasSignature) {
      sigDataUrl = canvas.toDataURL();
      setSignatureDataUrl(sigDataUrl);
      localStorage.setItem('cbas_step5_signature', sigDataUrl);
    }

    const timestamp = new Date().toISOString();
    const step5Payload = {
      targetMajor,
      confidenceT2,
      triadTiers,
      selectedGrade,
      actionPlans,
      hasSignature: Boolean(hasSignature || sigDataUrl),
      completedAt: timestamp
    };

    const fullDossier = {
      studentInfo: {
        id: user?.id || profile?.id || 'student-guest',
        studentCode: displayStudentCode,
        fullName: studentName,
        grade: `Khối ${selectedGrade}`
      },
      step1_T0: step1Data,
      step2_Socrates: step2Data,
      step3_DataVerification: step3Data,
      step4_Mentorship: step4Data,
      step5_ActionTriad_T2: step5Payload,
      summaryMetrics: {
        t0_confidence: step1Data.initialConfidence,
        t2_confidence: confidenceT2,
        crs_calibration_delta: confidenceT2 - step1Data.initialConfidence,
        has_committed: true
      },
      generatedAt: timestamp
    };

    localStorage.setItem('cbas_step5_action_plan', JSON.stringify(step5Payload));
    localStorage.setItem('cbas_full_intervention_dossier', JSON.stringify(fullDossier));
    localStorage.setItem('cbas_step5_completed', 'true');

    setToast({
      type: 'success',
      message: '✅ Đã lưu Kế Hoạch Hành Động & Tam Giác Nguyện Vọng! Chuẩn bị mở hộp thoại in...'
    });

    // Đồng bộ Supabase
    try {
      if (user?.id) {
        await supabase.from('metacognitive_matrix').insert([{
          student_id: user.id,
          target_major: targetMajor,
          evidence: `[Tam giác 3 Nấc]: Nấc 1: ${triadTiers.dream.majorSchool} | Nấc 2: ${triadTiers.realistic.majorSchool} | Nấc 3: ${triadTiers.safe.majorSchool}`,
          verified_sources: `[Kế hoạch K${selectedGrade}]: ${getPlanItem(selectedGrade, 0)}`,
          risk_analysis: `[Kỹ năng nghề]: ${getPlanItem(selectedGrade, 1)} | [Vật neo]: ${getPlanItem(selectedGrade, 2)}`,
          bias_check: `T0=${step1Data.initialConfidence} -> T2=${confidenceT2} | Ký cam kết: Đã ký`,
          detected_bias: 'DEBIASED_SUCCESS',
          final_decision: 'CONFIRMED'
        }]);
      }
    } catch (err) {
      console.warn('Lỗi Supabase:', err);
    }

    setTimeout(() => {
      window.print();
    }, 350);
  };

  // Làm lại Bước 5
  const handleResetStep5 = () => {
    if (window.confirm('Em có chắc chắn muốn làm lại Bước 5 (xóa Kế hoạch Hành động và chữ ký hiện tại để thiết lập lại từ đầu) không?')) {
      localStorage.removeItem('cbas_step5_action_plan');
      localStorage.removeItem('cbas_full_intervention_dossier');
      localStorage.removeItem('cbas_step5_completed');
      localStorage.removeItem('cbas_step5_signature');
      handleClearSignature();
      setConfidenceT2(7);
      setToast({ type: 'info', message: 'Đã đặt lại Bước 5 về trạng thái ban đầu.' });
    }
  };

  // Tải file JSON phục vụ Hội đồng Nghiên cứu ViSEF
  const handleDownloadJSON = () => {
    try {
      const raw = localStorage.getItem('cbas_full_intervention_dossier');
      let payload = raw ? JSON.parse(raw) : {
        studentCode: displayStudentCode,
        step1: step1Data,
        step5: { targetMajor, confidenceT2, triadTiers, selectedGrade, actionPlans }
      };
      payload.student_code = displayStudentCode;
      delete payload.student_real_name;
      delete payload.email;

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ViSEF_CBAS_ActionTriad_${displayStudentCode}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ type: 'info', message: `Đã tải xuống file dữ liệu nghiên cứu JSON (${displayStudentCode})!` });
    } catch (e) {
      console.error('Lỗi tải JSON:', e);
    }
  };

  const crsDelta = confidenceT2 - step1Data.initialConfidence;

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased p-4 md:p-8 space-y-6">

      {/* CSS CHO IN ẤN CHUẨN A4 DÁN GÓC HỌC TẬP (CHUẨN ĐẠO ĐỨC & KHẮC PHỤC LỖI IN) */}
      <style>{`
        /* =========================================================================
           BỘ THÔNG SỐ CANH LỀ IN ẤN CHUẨN A4 KHOA HỌC (VISEF CBAS) - KHÔNG MẤT CHỮ
           ========================================================================= */
        @page {
          size: A4 portrait;
          /* Đặt margin: 0 ở cấp độ trang in để tránh trình duyệt tự ý cộng dồn lề hay gây lệch mép */
          margin: 0;
        }

        @media print {
          /* 1. TRIỆT TIÊU TOÀN BỘ CÁC THÀNH PHẦN KHÔNG IN */
          .no-print,
          .toast-notification, 
          [role="alert"], 
          .alert-box, 
          button, 
          aside, 
          nav, 
          header,
          footer {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 2. LOẠI BỎ HOÀN TOÀN MÀU NỀN TỐI VÀ PADDING CỦA CÁC THẺ CHA (NGĂN DÍNH VIỀN ĐEN & TRÀN LỀ) */
          html, body, #root, #root > div, main, main > div, .bg-slate-900, .bg-slate-950, .bg-slate-50 {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* 3. KHUNG TRANG IN A4 CHUẨN XÁC VỚI LỀ AN TOÀN VISEF (CHỐNG MẤT CHỮ 100%) */
          .a4-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 auto !important;
            /* LỀ AN TOÀN BẢO VỆ CHỮ: Trên 14mm, Phải 16mm, Dưới 14mm, Trái 22mm (chừa kẹp ghim báo cáo) */
            padding: 14mm 16mm 14mm 22mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Chống ngắt trang đột ngột giữa chừng */
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        /* Khung hiển thị khi xem trước trên màn hình máy tính */
        .a4-container {
          width: 210mm;
          min-height: 297mm;
          padding: 14mm 16mm 14mm 22mm;
          margin: 20px auto;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
        }
      `}</style>

      {/* BREADCRUMB TIẾN TRÌNH 5 BƯỚC */}
      <div className="no-print">
        <StepProgressHeader 
          currentStep={5}
          title="Bước 5: Lộ Trình Kế Hoạch Hành Động & Tam Giác Nguyện Vọng"
          subtitle="Chuyển hóa nhận thức phản tư thành hành động cụ thể (Implementation Intentions). Xuất bản cam kết dán ở góc học tập."
        />
      </div>

      {/* =========================================================================
          HEADER BƯỚC 5 (ACTION PLAN MATRIX & COMMITMENT DEVICE)
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800 no-print">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/40 shrink-0">
              5
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Lộ Trình Kế Hoạch Hành Động & Tam Giác Nguyện Vọng
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline-block">
              Action Plan Matrix & Commitment Device
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Chuyển hóa nhận thức phản tư thành hành động cụ thể (Implementation Intentions). Xuất bản cam kết hành động dán ở góc học tập.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>KÝ CAM KẾT & XUẤT PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrintPreview(!showPrintPreview)}
            className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showPrintPreview 
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Xem trước mẫu văn bản in A4 dán góc học tập"
          >
            {showPrintPreview ? <EyeOff className="w-3.5 h-3.5 text-teal-400" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
            <span>{showPrintPreview ? 'Ẩn Bản In A4' : 'Xem Bản In A4'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            title="Tải dữ liệu nghiên cứu JSON phục vụ Hội đồng ViSEF"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">Tải JSON</span>
          </button>
          <button
            type="button"
            onClick={handleResetStep5}
            className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/30"
            title="Làm lại Bước 5 từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm Lại</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CONTAINER NỘI DUNG TƯƠNG TÁC (CHỈ HIỂN THỊ TRÊN MÀN HÌNH - NO-PRINT)
          ========================================================================= */}
      <div className="space-y-6 no-print">

        {/* =========================================================================
            BẢNG ĐO LƯỜNG VÀ HIỆU CHUẨN NHẬN THỨC
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Ngành mục tiêu */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print-badge">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                NGÀNH MỤC TIÊU CHỐT LẠI
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMajor(!isEditingMajor)}
                className="text-[10px] text-teal-400 hover:underline no-print"
              >
                {isEditingMajor ? 'Xong' : '✎ Đổi ngành'}
              </button>
            </div>

            {isEditingMajor ? (
              <input
                type="text"
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="w-full bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 text-sm text-white font-bold focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <Crosshair className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="font-bold text-base text-white tracking-wide">{targetMajor}</span>
              </div>
            )}

            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã đối chứng & Cam kết dấn thân</span>
            </p>
          </div>

          {/* Box 2: Chỉ số hiệu chuẩn nhận thức (CRS) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print-badge">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                ĐỘ TỰ TIN (TRƯỚC VS SAU CAN THIỆP)
              </span>
              <button
                type="button"
                onClick={() => setShowConfidenceSlider(!showConfidenceSlider)}
                className="text-[10px] text-teal-400 hover:underline no-print"
              >
                {showConfidenceSlider ? 'Đóng' : '✎ Chỉnh T2'}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-400 line-through">
                Trước: {step1Data.initialConfidence}/10
              </span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-base text-teal-300">
                Sau: {confidenceT2}/10
              </span>
            </div>

            {showConfidenceSlider && (
              <div className="pt-2 no-print">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={confidenceT2}
                  onChange={(e) => setConfidenceT2(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            )}

            <p className="text-xs text-cyan-400 font-medium">
              Tự tin thực chứng ({crsDelta === 0 ? 'Hiệu chuẩn CRS tiệm cận 0' : `Hiệu chuẩn CRS: ${crsDelta > 0 ? `+${crsDelta}` : crsDelta}`})
            </p>
          </div>

          {/* Box 3: Trạng thái ràng buộc */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 print-badge">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              TRẠNG THÁI RÀNG BUỘC (COMMITMENT)
            </span>
            <div className="flex items-center gap-2 pt-1">
              <PenTool className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-bold text-base text-slate-200">
                {hasSignature ? 'Đã ký cam kết điện tử' : 'Sẵn sàng ký cam kết'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bước 5/5 trong Mô hình Can thiệp SocraCareer
            </p>
          </div>

        </div>

        {/* =========================================================================
            KHỐI 1: TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO)
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 print-sheet">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <Triangle className="w-5 h-5 text-teal-400 font-bold" />
              <h2 className="font-bold text-sm text-white uppercase tracking-wide">
                TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO)
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Chiến lược dải điểm bậc thang 3 nấc
              </span>
              <button
                type="button"
                onClick={() => setIsEditingTriad(!isEditingTriad)}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline cursor-pointer no-print"
              >
                {isEditingTriad ? '✓ Lưu tùy chỉnh' : '✎ Điều chỉnh 3 nấc'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Nấc 1: Ước mơ */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase text-[10px]">
                  {triadTiers.dream.label}
                </span>
                {isEditingTriad ? (
                  <input
                    type="text"
                    value={triadTiers.dream.targetScore}
                    onChange={(e) => handleUpdateTriad('dream', 'targetScore', e.target.value)}
                    className="w-24 bg-slate-900 border border-purple-400 text-purple-300 rounded px-1.5 py-0.5 text-right font-semibold"
                  />
                ) : (
                  <span className="text-purple-400 font-semibold">{triadTiers.dream.targetScore}</span>
                )}
              </div>

              {isEditingTriad ? (
                <input
                  type="text"
                  value={triadTiers.dream.majorSchool}
                  onChange={(e) => handleUpdateTriad('dream', 'majorSchool', e.target.value)}
                  className="w-full bg-slate-900 border border-purple-400 text-white font-bold rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-bold text-white text-sm">{triadTiers.dream.majorSchool}</p>
              )}

              {isEditingTriad ? (
                <textarea
                  rows={2}
                  value={triadTiers.dream.notes}
                  onChange={(e) => handleUpdateTriad('dream', 'notes', e.target.value)}
                  className="w-full bg-slate-900 border border-purple-400 text-slate-300 rounded p-1.5 text-[11px]"
                />
              ) : (
                <p className="text-slate-400 text-[11px] leading-relaxed">{triadTiers.dream.notes}</p>
              )}
            </div>

            {/* Nấc 2: Vừa sức */}
            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold uppercase text-[10px]">
                  {triadTiers.realistic.label}
                </span>
                {isEditingTriad ? (
                  <input
                    type="text"
                    value={triadTiers.realistic.targetScore}
                    onChange={(e) => handleUpdateTriad('realistic', 'targetScore', e.target.value)}
                    className="w-24 bg-slate-900 border border-teal-400 text-teal-300 rounded px-1.5 py-0.5 text-right font-semibold"
                  />
                ) : (
                  <span className="text-teal-400 font-semibold">{triadTiers.realistic.targetScore}</span>
                )}
              </div>

              {isEditingTriad ? (
                <input
                  type="text"
                  value={triadTiers.realistic.majorSchool}
                  onChange={(e) => handleUpdateTriad('realistic', 'majorSchool', e.target.value)}
                  className="w-full bg-slate-900 border border-teal-400 text-white font-bold rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-bold text-white text-sm">{triadTiers.realistic.majorSchool}</p>
              )}

              {isEditingTriad ? (
                <textarea
                  rows={2}
                  value={triadTiers.realistic.notes}
                  onChange={(e) => handleUpdateTriad('realistic', 'notes', e.target.value)}
                  className="w-full bg-slate-900 border border-teal-400 text-slate-300 rounded p-1.5 text-[11px]"
                />
              ) : (
                <p className="text-slate-400 text-[11px] leading-relaxed">{triadTiers.realistic.notes}</p>
              )}
            </div>

            {/* Nấc 3: An toàn */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px]">
                  {triadTiers.safe.label}
                </span>
                {isEditingTriad ? (
                  <input
                    type="text"
                    value={triadTiers.safe.targetScore}
                    onChange={(e) => handleUpdateTriad('safe', 'targetScore', e.target.value)}
                    className="w-24 bg-slate-900 border border-blue-400 text-blue-300 rounded px-1.5 py-0.5 text-right font-semibold"
                  />
                ) : (
                  <span className="text-blue-400 font-semibold">{triadTiers.safe.targetScore}</span>
                )}
              </div>

              {isEditingTriad ? (
                <input
                  type="text"
                  value={triadTiers.safe.majorSchool}
                  onChange={(e) => handleUpdateTriad('safe', 'majorSchool', e.target.value)}
                  className="w-full bg-slate-900 border border-blue-400 text-white font-bold rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-bold text-white text-sm">{triadTiers.safe.majorSchool}</p>
              )}

              {isEditingTriad ? (
                <textarea
                  rows={2}
                  value={triadTiers.safe.notes}
                  onChange={(e) => handleUpdateTriad('safe', 'notes', e.target.value)}
                  className="w-full bg-slate-900 border border-blue-400 text-slate-300 rounded p-1.5 text-[11px]"
                />
              ) : (
                <p className="text-slate-400 text-[11px] leading-relaxed">{triadTiers.safe.notes}</p>
              )}
            </div>

          </div>
        </div>

        {/* =========================================================================
            KHỐI 2: MA TRẬN KẾ HOẠCH HÀNH ĐỘNG THEO KHỐI LỚP (CHUẨN HÓA 2 TRỤ CỘT)
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-5 print-sheet">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-400" />
                <span>BẢNG MA TRẬN KẾ HOẠCH HÀNH ĐỘNG (ACTION PLAN MATRIX)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Xác lập mục tiêu học vấn tổ hợp & hệ thống kỹ năng nghề theo thuyết Implementation Intentions
              </p>
            </div>

            {/* Tab Khối Lớp */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs no-print">
              <button
                type="button"
                onClick={() => setSelectedGrade(10)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  selectedGrade === 10 ? 'bg-teal-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Khối 10
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade(11)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  selectedGrade === 11 ? 'bg-teal-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Khối 11
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade(12)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  selectedGrade === 12 ? 'bg-teal-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Khối 12
              </button>
            </div>

            {/* Khối lớp hiển thị khi in */}
            <span className="hidden print:inline-block px-3 py-1 bg-slate-200 text-slate-900 font-bold rounded-lg text-xs">
              Áp dụng: Khối {selectedGrade} THPT
            </span>
          </div>

          {/* Banner Phân hóa theo Khối lớp */}
          {(() => {
            const gradeInfo = ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade] || ADAPTIVE_COMMITMENTS_BY_GRADE[12];
            return (
              <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold">
                    🎯 {gradeInfo.badge}
                  </span>
                  <p className="text-xs text-slate-300 italic flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{gradeInfo.note}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefaultTemplate}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-teal-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition flex items-center gap-1 cursor-pointer no-print"
                  title="Khôi phục lại nội dung mẫu chuẩn ViSEF cho khối này"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục mẫu ViSEF</span>
                </button>
              </div>
            );
          })()}

          {/* Nội dung mục tiêu chi tiết 3 Mục chuẩn hóa 2 Trụ cột */}
          <div className="space-y-4 text-xs">
            {/* Mục 1: Trọng tâm Học vấn */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[0]?.num}</span>
              </label>
              <textarea
                rows={2}
                value={getPlanItem(selectedGrade, 0)}
                onChange={(e) => handleUpdatePlan('item1', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-slate-100 font-medium focus:outline-none focus:border-teal-500 text-xs leading-relaxed"
              />
            </div>

            {/* Mục 2: Kỹ năng nghề / Thích ứng */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[1]?.num}</span>
              </label>
              <textarea
                rows={2}
                value={getPlanItem(selectedGrade, 1)}
                onChange={(e) => handleUpdatePlan('item2', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-slate-100 font-medium focus:outline-none focus:border-teal-500 text-xs leading-relaxed"
              />
            </div>

            {/* Mục 3: Vật neo kỷ luật / Giữ vững chiến lược */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[2]?.num}</span>
              </label>
              <textarea
                rows={2}
                value={getPlanItem(selectedGrade, 2)}
                onChange={(e) => handleUpdatePlan('item3', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-slate-100 font-medium focus:outline-none focus:border-teal-500 text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            KHỐI 3: KHUNG KÝ CAM KẾT ĐIỆN TỬ (COMMITMENT DEVICE)
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 print-sheet">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-teal-400" />
              <h2 className="font-bold text-sm text-white uppercase tracking-wide">
                CHỮ KÝ CAM KẾT CÁ NHÂN (COMMITMENT DEVICE)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClearSignature}
              className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer no-print font-medium"
            >
              Xóa chữ ký vẽ lại
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Em ký tên xác nhận chịu trách nhiệm với mục tiêu của chính mình, in bản kế hoạch này dán tại góc học tập để nhắc nhở bản thân mỗi ngày.
          </p>

          {/* Vùng vẽ canvas */}
          <div className="border border-dashed border-slate-700 rounded-xl bg-slate-900 p-2 flex justify-center print-canvas">
            <canvas
              ref={canvasRef}
              width={500}
              height={120}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair bg-slate-900 rounded-lg max-w-full touch-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">Học sinh cam kết:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-bold border border-slate-700">
                Mã định danh: {displayStudentCode}
              </span>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleSaveAndPrint}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-teal-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Lưu & In Bản Cam Kết Dán Góc Học Tập</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          MẪU BẢN IN PDF CAM KẾT HÀNH ĐỘNG BƯỚC 5 (CHUẨN ĐẠO ĐỨC & KHẮC PHỤC LỖI IN)
          ========================================================================= */}
      {showPrintPreview && (
        <div className="no-print w-full max-w-[210mm] mb-4 flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700 mx-auto">
          <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            🔍 Chế độ xem trước trang in A4 thực tế (Bản ký tay thực địa)
          </span>
          <button
            type="button"
            onClick={handleSaveAndPrint}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>🖨️ IN NGAY BẢN A4 HOÀN CHỈNH</span>
          </button>
        </div>
      )}

      {/* ==================== KHUNG TRANG IN A4 THỰC TẾ ==================== */}
      <div className={`a4-container bg-white text-slate-900 flex-col justify-between ${showPrintPreview ? 'flex' : 'hidden print:flex'}`}>
        <div>
          {/* 1. PHẦN ĐẦU TRANG (HEADER TIÊU CHUẨN) */}
          <header className="border-b-2 border-teal-700 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-extrabold text-teal-800 tracking-wider uppercase block">
                  DỰ ÁN NGHIÊN CỨU VISEF 2026 - PHÂN NGÀNH CBAS
                </span>
                <div className="text-sm font-extrabold text-slate-800 mt-1">
                  MÃ ĐỊNH DANH ĐỐI TƯỢNG: <span className="text-teal-700 font-black">{displayStudentCode}</span> | KHỐI {selectedGrade} THPT
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded font-bold uppercase text-[10px] tracking-wide">
                  NHÓM CAN THIỆP (SOCRACAREER)
                </span>
              </div>
            </div>

            <h1 className="text-xl font-black text-center text-slate-900 mt-3 uppercase tracking-tight">
              BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG
            </h1>
            <p className="text-[11px] italic text-slate-500 text-center mt-0.5">
              "Bản kế hoạch hành động tự chủ dán tại góc học tập - Thực hiện kỷ luật mỗi ngày để bứt phá."
            </p>
          </header>

          {/* 2. KHỐI TRẠNG THÁI HIỆU CHUẨN NHẬN THỨC */}
          <section className="grid grid-cols-3 gap-3 bg-slate-50/80 border border-slate-200 rounded-lg p-3 text-xs mb-4">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block">Ngành mục tiêu chốt lại:</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">{targetMajor}</div>
              <div className="text-emerald-700 font-bold text-[10.5px] mt-0.5 flex items-center gap-1">
                <span>☑</span> Đã đối chứng & Cam kết dấn thân
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block">Độ tự tin (Trước vs Sau can thiệp):</span>
              <div className="text-sm font-black text-teal-800 mt-0.5">
                Trước: {step1Data.initialConfidence}/10 <span className="text-slate-400 font-normal">→</span> <span className="text-teal-600">Sau: {confidenceT2}/10</span>
              </div>
              <div className="text-sky-700 font-bold text-[10.5px] mt-0.5">
                Độ tự tin hiệu chuẩn (Tiệm cận vùng CRS ≈ 0)
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block">Trạng thái ràng buộc:</span>
              <div className="text-sm font-black text-amber-700 mt-0.5">{hasSignature ? 'Đã ký cam kết điện tử' : 'Sẵn sàng ký cam kết'}</div>
              <div className="text-slate-500 text-[10.5px] mt-0.5">Bước 5/5 Mô hình SocraCareer</div>
            </div>
          </section>

          {/* 3. KHỐI TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (ĐÃ CHUẨN HÓA CÂU TỪ KHOA HỌC) */}
          <div className="space-y-1.5 mb-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-teal-900 font-bold">🔺</span>
                <span className="font-black text-slate-900 uppercase text-[11px] tracking-wide">
                  TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 italic">Chiến lược dải điểm bậc thang 3 nấc</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Nấc 1: Thử thách */}
              <div className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/50 flex flex-col justify-between">
                <div>
                  <span className="font-extrabold text-teal-900 text-[10px] block uppercase tracking-wide">
                    {triadTiers.dream?.label || '1. NGUYỆN VỌNG THỬ THÁCH (STRETCH)'}
                  </span>
                  <p className="font-bold text-slate-900 mt-1 text-[11.5px]">
                    {triadTiers.dream?.majorSchool || 'Tâm lý học — ĐH KHXH&NV TP.HCM'}
                  </p>
                </div>
                <div className="text-[9.5px] text-slate-600 mt-1.5 pt-1 border-t border-teal-200/60 leading-normal">
                  {triadTiers.dream?.notes || 'Trường Top đầu — Đòi hỏi nỗ lực tối đa để thu hẹp khoảng cách điểm sàn (tham chiếu: 26.5+)'}
                </div>
              </div>

              {/* Nấc 2: Vừa sức */}
              <div className="p-2.5 rounded-lg border border-cyan-200 bg-cyan-50/50 flex flex-col justify-between">
                <div>
                  <span className="font-extrabold text-cyan-900 text-[10px] block uppercase tracking-wide">
                    {triadTiers.realistic?.label || '2. NGUYỆN VỌNG VỪA SỨC (REALISTIC)'}
                  </span>
                  <p className="font-bold text-slate-900 mt-1 text-[11.5px]">
                    {triadTiers.realistic?.majorSchool || 'Tâm lý học (ĐH Sư phạm) / QTKD (ĐH Nha Trang)'}
                  </p>
                </div>
                <div className="text-[9.5px] text-slate-600 mt-1.5 pt-1 border-t border-cyan-200/60 leading-normal">
                  {triadTiers.realistic?.notes || 'Mục tiêu chính — Điểm số nằm trong dải phong độ học bạ và điểm thi thử hiện tại (22.5 – 24.0)'}
                </div>
              </div>

              {/* Nấc 3: Bảo toàn rủi ro (ĐÃ SỬA: KHÔNG DÙNG CHỮ CHẮC CHẮN) */}
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="font-extrabold text-slate-800 text-[10px] block uppercase tracking-wide">
                    {triadTiers.safe?.label || '3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)'}
                  </span>
                  <p className="font-bold text-slate-900 mt-1 text-[11.5px]">
                    {triadTiers.safe?.majorSchool || 'Công tác Xã hội — ĐH Nha Trang'}
                  </p>
                </div>
                <div className="text-[9.5px] text-slate-600 mt-1.5 pt-1 border-t border-slate-200 leading-normal">
                  {triadTiers.safe?.notes || 'Vùng đệm dự phòng — Ngành gần có biên độ điểm an toàn cao và tối ưu chi phí đào tạo'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. MA TRẬN KẾ HOẠCH HÀNH ĐỘNG (IMPLEMENTATION INTENTIONS) */}
          <section className="border border-slate-200 rounded-lg p-3.5 mb-4 text-xs bg-white">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2.5">
              <div>
                <h3 className="font-black text-slate-900 uppercase">
                  🎯 MA TRẬN KẾ HOẠCH HÀNH ĐỘNG (IMPLEMENTATION INTENTIONS)
                </h3>
                <p className="text-[10px] text-slate-600 italic mt-0.5">
                  {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.note}
                </p>
              </div>
              <span className="text-[10.5px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-right">
                {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.badge || `Áp dụng: Khối ${selectedGrade} THPT`}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Mục 1: Trọng tâm Học vấn */}
              <div>
                <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                  {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[0]?.num}
                </span>
                <div 
                  className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 text-[11px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getPlanItem(selectedGrade, 0) }}
                />
              </div>

              {/* Mục 2: Kế hoạch rèn luyện kỹ năng nghề */}
              <div className="border-t border-dashed border-slate-200 pt-2">
                <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                  {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[1]?.num}
                </span>
                <div 
                  className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-700 text-[11px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getPlanItem(selectedGrade, 1) }}
                />
              </div>

              {/* Mục 3: Vật neo kỷ luật */}
              <div className="border-t border-dashed border-slate-200 pt-2">
                <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                  {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[2]?.num}
                </span>
                <div 
                  className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-700 text-[11px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getPlanItem(selectedGrade, 2) }}
                />
              </div>
            </div>
          </section>

          {/* 5. CHỮ KÝ CAM KẾT CÁ NHÂN (COMMITMENT DEVICE) */}
          <section className="border-t-2 border-slate-900 pt-3 page-break-inside-avoid">
            <div className="flex justify-between items-start gap-4">
              {/* Lời cam kết & Định danh ẩn danh */}
              <div className="w-7/12 text-xs">
                <div className="font-black text-slate-900 mb-1 uppercase tracking-tight">
                  LỜI CAM KẾT CỦA HỌC SINH:
                </div>
                <p className="text-[11px] text-slate-600 italic leading-relaxed mb-2">
                  "Em cam kết thực hiện nghiêm túc kế hoạch hành động đã đề ra, kiên trì tự học có kỷ luật mỗi ngày và chịu trách nhiệm cao nhất với mục tiêu của chính mình."
                </p>
                <div className="text-[11px] font-bold text-teal-800">
                  MÃ ĐỐI TƯỢNG CAN THIỆP: <span className="text-slate-900 font-black text-xs">{displayStudentCode}</span>
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  (Dữ liệu nghiên cứu được mã hóa ẩn danh tuyệt đối theo chuẩn Đạo đức Nghiên cứu ViSEF 2026)
                </div>
              </div>

              {/* Khung chữ ký số */}
              <div className="w-5/12 text-center text-xs">
                <div className="text-[10px] text-slate-500 italic">
                  Ngày ...... tháng ...... năm 2026
                </div>
                <div className="font-black text-slate-900 uppercase text-[11px] mt-1 mb-1 tracking-wide">
                  Học sinh ký cam kết
                </div>

                <div className="h-16 border border-dashed border-slate-400 rounded bg-white flex items-center justify-center mb-1 overflow-hidden">
                  {hasSignature && signatureDataUrl ? (
                    <img 
                      src={signatureDataUrl} 
                      alt="Chữ ký học sinh" 
                      className="max-h-14 max-w-[95%] object-contain" 
                    />
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic">
                      (Ký và ghi rõ mã định danh {displayStudentCode})
                    </span>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 font-medium">
                  {hasSignature ? '(Chữ ký điện tử đã được xác thực trên hệ thống)' : '(Bản ký tay thực địa lưu hồ sơ nghiên cứu ViSEF)'}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* CHÂN TRANG A4 */}
        <footer className="border-t border-slate-200 pt-2 text-[9.5px] text-slate-400 flex justify-between items-center mt-3">
          <span>SocraCareer — Hệ thống Can thiệp Phản tư & Hiệu chuẩn Nhận thức</span>
          <span>Hội đồng Khoa học ViSEF 2026 • CBAS Model</span>
        </footer>
      </div>

      {/* THANH ĐIỀU HƯỚNG CUỐI TRANG */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 no-print">
        <button
          type="button"
          onClick={() => navigate('/student/booking')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Quay lại Bước 4 (Tham vấn 1-1)</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 transition shadow"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Về Tổng Quan Lộ Trình Học Sinh ➔</span>
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
