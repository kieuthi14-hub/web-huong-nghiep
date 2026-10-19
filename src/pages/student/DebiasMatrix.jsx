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
  Sparkles,
  Type,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ADAPTIVE_COMMITMENTS_BY_GRADE, 
  getGradeCommitmentPlan, 
  DEFAULT_TRIANGLE_DATA,
  CT21_COMMITMENT_DATA,
  CT13_COMMITMENT_DATA,
  CT08_COMMITMENT_DATA,
  getStudentCommitmentData,
  getAdaptiveStep5Data,
  generateStep5Content,
  buildAdaptiveTriadAndPlan
} from '../../data/adaptiveCommitments';
export { ADAPTIVE_COMMITMENTS_BY_GRADE, getGradeCommitmentPlan, DEFAULT_TRIANGLE_DATA, CT21_COMMITMENT_DATA, CT13_COMMITMENT_DATA, CT08_COMMITMENT_DATA, getStudentCommitmentData, getAdaptiveStep5Data, generateStep5Content, buildAdaptiveTriadAndPlan };

// GỢI Ý NHANH CÁC MỤC TIÊU HỌC TẬP THỰC TẾ THEO KHỐI LỚP (CHO HỌC SINH BẤM CHỌN 1 CHẠM)
const QUICK_ACTION_CHIPS = {
  10: {
    item1: [
      'Học chắc Toán & Tiếng Anh từ đầu năm',
      'Mục tiêu điểm tổng kết từ 7.5 trở lên',
      'Hoàn thành bài tập đầy đủ trước khi lên lớp'
    ],
    item2: [
      'Tìm hiểu học phí & cơ hội việc làm của ngành',
      'Học thêm từ vựng tiếng Anh chuyên ngành',
      'Rèn kỹ năng thuyết trình & làm việc nhóm'
    ],
    item3: [
      'Tự giác ngồi vào bàn học đúng giờ mỗi tối',
      'Làm xong bài tập mới giải trí điện thoại',
      'Dán bản cam kết này lên góc học tập'
    ]
  },
  11: {
    item1: [
      'Mục tiêu điểm học bạ cả năm trên 8.0',
      'Ôn chắc kiến thức các môn trong tổ hợp',
      'Luyện làm các câu hỏi vận dụng cuối tuần'
    ],
    item2: [
      'Tìm hiểu công việc thực tế của ngành nghề',
      'Luyện nghe nói tiếng Anh 30 phút mỗi ngày',
      'Tham gia ngày hội tư vấn tuyển sinh'
    ],
    item3: [
      'Duy trì tự học nề nếp 1.5 giờ mỗi tối',
      'Cuối mỗi tháng kiểm tra lại tiến độ ôn tập',
      'Dán bản cam kết này lên góc học tập'
    ]
  },
  12: {
    item1: [
      'Dành 1.5 - 2h mỗi tối luyện đề 3 môn tổ hợp',
      'Ghi chép câu sai sau mỗi lần thi thử để kéo điểm',
      'Ôn kỹ phần lý thuyết còn yếu'
    ],
    item2: [
      'Tự học thêm tiếng Anh & kỹ năng tin học',
      'Trao đổi thẳng thắn cùng ba mẹ về học phí',
      'Tìm hiểu kỹ điểm chuẩn các trường 3 năm gần nhất'
    ],
    item3: [
      'Hạn chế lướt điện thoại sau 10h tối',
      'Giữ vững 3 nấc nguyện vọng (không đổi theo bạn bè)',
      'Dán bản cam kết này trước bàn học để tự nhắc nhở'
    ]
  }
};

/**
 * BƯỚC 5: LỘ TRÌNH KẾ HOẠCH HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG
 * Kế hoạch hành động học tập & Bản cam kết dán góc học tập
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

  // --- 0. HÀM ĐỌC MỎ NEO T0 DUY NHẤT ĐÃ KHAI BÁO ---
  const getDeclaredAnchorData = () => {
    try {
      const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData');
      const rawProfile = localStorage.getItem('cbas_user_profile');
      const rawLegacy = localStorage.getItem('career_initial_anchor');
      const a = rawAnchor ? JSON.parse(rawAnchor) : {};
      const p = rawProfile ? JSON.parse(rawProfile) : {};
      const l = rawLegacy ? JSON.parse(rawLegacy) : {};
      const major = p.targetMajor || a.target_career || a.targetMajor || a.target_major || l.target_career || 'Tiếp viên hàng không';
      const school = p.targetSchool || a.target_university || a.target_school || a.targetSchool || '';
      const grade = Number(p.gradeNum || a.gradeNum || a.grade || 12) || 12;
      const conf = Number(p.initialConfidence || a.confidence_score || a.initialConfidence || 8) || 8;
      const holland = p.hollandCode || a.holland_code || 'RIA';
      return { major, school, grade, conf, holland };
    } catch (e) {
      return { major: 'Tiếp viên hàng không', school: '', grade: 12, conf: 8, holland: 'RIA' };
    }
  };

  const initialAnchor = getDeclaredAnchorData();
  const initialAdaptive = buildAdaptiveTriadAndPlan(initialAnchor.major, initialAnchor.school, initialAnchor.grade);

  // --- 1. DỮ LIỆU ĐỐI CHỨNG CÁC BƯỚC TRƯỚC ---
  const [step1Data, setStep1Data] = useState({
    targetMajor: initialAnchor.major,
    initialConfidence: initialAnchor.conf,
    hollandCode: initialAnchor.holland
  });
  const [step2Data, setStep2Data] = useState(null);
  const [step3Data, setStep3Data] = useState(null);
  const [step4Data, setStep4Data] = useState(null);

  // --- 2. BẢNG HIỆU CHUẨN NHẬN THỨC & NGÀNH MỤC TIÊU ---
  const [targetMajor, setTargetMajor] = useState(initialAnchor.major);
  const [targetSchool, setTargetSchool] = useState(initialAnchor.school);
  const [isEditingMajor, setIsEditingMajor] = useState(true);
  const [confidenceT2, setConfidenceT2] = useState(7);
  const [showConfidenceSlider, setShowConfidenceSlider] = useState(true);
  const [showAiSummary, setShowAiSummary] = useState(false);

  // --- 3. TAM GIÁC NGUYỆN VỌNG 3 NẤC THÍCH ỨNG (SUY RA TỪ DUY NHẤT MỎ NEO T0) ---
  const [triadTiers, setTriadTiers] = useState({
    dream: {
      label: initialAdaptive.triangle.stretchTitle,
      targetScore: 'Tham chiếu: 26.0+ (Ngưỡng cạnh tranh cao)',
      majorSchool: initialAdaptive.triangle.stretchSchool,
      notes: initialAdaptive.triangle.stretchDesc
    },
    realistic: {
      label: initialAdaptive.triangle.realisticTitle,
      targetScore: 'Phong độ an toàn: Dải điểm 21.0 – 24.0',
      majorSchool: initialAdaptive.triangle.realisticSchool,
      notes: initialAdaptive.triangle.realisticDesc
    },
    safe: {
      label: initialAdaptive.triangle.safetyTitle,
      targetScore: 'Vùng đệm an toàn',
      majorSchool: initialAdaptive.triangle.safetySchool,
      notes: initialAdaptive.triangle.safetyDesc
    }
  });
  const [isEditingTriad, setIsEditingTriad] = useState(true);

  // --- 4. MA TRẬN KẾ HOẠCH HÀNH ĐỘNG THEO KHỐI LỚP (SUY RA TỪ MỎ NEO T0) ---
  const [selectedGrade, setSelectedGrade] = useState(initialAnchor.grade);
  const [actionPlans, setActionPlans] = useState(() => {
    const plans = {};
    [10, 11, 12].forEach(g => {
      const gAdaptive = buildAdaptiveTriadAndPlan(initialAnchor.major, initialAnchor.school, g);
      plans[g] = {
        item1: gAdaptive.actions[0].text,
        item2: gAdaptive.actions[1].text,
        item3: gAdaptive.actions[2].text,
        scoreGoal: gAdaptive.actions[0].text,
        weakSubjectsPlan: gAdaptive.actions[1].text,
        studyTimeCommitment: gAdaptive.actions[2].text
      };
    });
    return plans;
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

  // --- 5. LỜI CAM KẾT HÀNH ĐỘNG CÁ NHÂN (VĂN BẢN HỌC SINH TỰ GÕ) ---
  const [personalPledge, setPersonalPledge] = useState(() => {
    try {
      const saved = localStorage.getItem('cbas_step5_personal_pledge');
      if (saved) return saved;
    } catch (e) {}
    return 'Em xin cam kết nỗ lực học tập có kỷ luật mỗi ngày, tập trung cải thiện các môn tổ hợp còn yếu và giữ vững cấu trúc 3 nấc nguyện vọng đã xác lập.';
  });

  const handleUpdatePledge = (text) => {
    setPersonalPledge(text);
    try {
      localStorage.setItem('cbas_step5_personal_pledge', text);
    } catch (e) {}
  };

  // --- 6. CHỮ KÝ CAM KẾT ĐIỆN TỬ (CANVAS & GÕ HỌ TÊN) ---
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' hoặc 'type'
  const [typedSignatureName, setTypedSignatureName] = useState(() => {
    return studentName || displayStudentCode || '';
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [toast, setToast] = useState(null);

  // Áp dụng chữ ký nghệ thuật khi học sinh gõ họ tên
  const applyTypedSignature = (name) => {
    setTypedSignatureName(name);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!name.trim()) {
      setHasSignature(false);
      setSignatureDataUrl('');
      try {
        localStorage.removeItem('cbas_step5_signature');
      } catch (e) {}
      return;
    }
    // Vẽ chữ ký phong cách viết tay nghệ thuật
    ctx.font = 'italic bold 28px "Segoe Script", "Dancing Script", "Brush Script MT", cursive, sans-serif';
    ctx.fillStyle = '#0f766e'; // teal-700
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.trim(), canvas.width / 2, canvas.height / 2);
    try {
      const url = canvas.toDataURL();
      setSignatureDataUrl(url);
      setHasSignature(true);
      localStorage.setItem('cbas_step5_signature', url);
    } catch (e) {}
  };

  // Cập nhật ngành mục tiêu và đồng bộ toàn bộ Tam giác & Ma trận
  const handleUpdateMajor = (newMajor) => {
    setTargetMajor(newMajor);
    setStep1Data(prev => ({ ...prev, targetMajor: newMajor }));
    if (!isEditingTriad) {
      const adaptive = buildAdaptiveTriadAndPlan(newMajor, targetSchool, selectedGrade);
      setTriadTiers({
        dream: {
          label: adaptive.triangle.stretchTitle,
          targetScore: 'Tham chiếu: 26.0+ (Ngưỡng cạnh tranh cao)',
          majorSchool: adaptive.triangle.stretchSchool,
          notes: adaptive.triangle.stretchDesc
        },
        realistic: {
          label: adaptive.triangle.realisticTitle,
          targetScore: 'Phong độ an toàn: Dải điểm 21.0 – 24.0',
          majorSchool: adaptive.triangle.realisticSchool,
          notes: adaptive.triangle.realisticDesc
        },
        safe: {
          label: adaptive.triangle.safetyTitle,
          targetScore: 'Vùng đệm an toàn',
          majorSchool: adaptive.triangle.safetySchool,
          notes: adaptive.triangle.safetyDesc
        }
      });
      setActionPlans(prev => {
        const next = { ...prev };
        [10, 11, 12].forEach(g => {
          const gAdaptive = buildAdaptiveTriadAndPlan(newMajor, targetSchool, g);
          next[g] = {
            item1: gAdaptive.actions[0].text,
            item2: gAdaptive.actions[1].text,
            item3: gAdaptive.actions[2].text,
            scoreGoal: gAdaptive.actions[0].text,
            weakSubjectsPlan: gAdaptive.actions[1].text,
            studyTimeCommitment: gAdaptive.actions[2].text
          };
        });
        return next;
      });
    }
  };

  // Khởi tạo và đọc dữ liệu đã lưu
  useEffect(() => {
    const anchor = getDeclaredAnchorData();
    setStep1Data({
      targetMajor: anchor.major,
      initialConfidence: anchor.conf,
      hollandCode: anchor.holland
    });
    setTargetMajor(anchor.major);
    setTargetSchool(anchor.school);
    setSelectedGrade(anchor.grade);

    const adaptive = buildAdaptiveTriadAndPlan(anchor.major, anchor.school, anchor.grade);
    setTriadTiers({
      dream: {
        label: adaptive.triangle.stretchTitle,
        targetScore: 'Tham chiếu: 26.0+ (Ngưỡng cạnh tranh cao)',
        majorSchool: adaptive.triangle.stretchSchool,
        notes: adaptive.triangle.stretchDesc
      },
      realistic: {
        label: adaptive.triangle.realisticTitle,
        targetScore: 'Phong độ an toàn: Dải điểm 21.0 – 24.0',
        majorSchool: adaptive.triangle.realisticSchool,
        notes: adaptive.triangle.realisticDesc
      },
      safe: {
        label: adaptive.triangle.safetyTitle,
        targetScore: 'Vùng đệm an toàn',
        majorSchool: adaptive.triangle.safetySchool,
        notes: adaptive.triangle.safetyDesc
      }
    });

    setActionPlans(prev => {
      const next = { ...prev };
      [10, 11, 12].forEach(g => {
        const gAdaptive = buildAdaptiveTriadAndPlan(anchor.major, anchor.school, g);
        next[g] = {
          item1: gAdaptive.actions[0].text,
          item2: gAdaptive.actions[1].text,
          item3: gAdaptive.actions[2].text,
          scoreGoal: gAdaptive.actions[0].text,
          weakSubjectsPlan: gAdaptive.actions[1].text,
          studyTimeCommitment: gAdaptive.actions[2].text
        };
      });
      return next;
    });

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
  }, [displayStudentCode]);

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

  // Bổ sung nhanh gợi ý hành động vào ô kế hoạch
  const handleAppendChip = (field, chipText) => {
    const itemIndex = field === 'item1' ? 0 : field === 'item2' ? 1 : 2;
    const current = getPlanItem(selectedGrade, itemIndex) || '';
    const trimmed = current.trim();
    if (!trimmed) {
      handleUpdatePlan(field, chipText);
    } else if (!trimmed.includes(chipText)) {
      handleUpdatePlan(field, `${trimmed}\n- ${chipText}`);
    }
  };

  // Chuyển đổi khối lớp nhanh và đồng bộ hóa Tam giác nguyện vọng & Ma trận ý định
  const handleGradeSwitch = (g) => {
    setSelectedGrade(g);
    if (!isEditingTriad) {
      const adaptive = buildAdaptiveTriadAndPlan(targetMajor, targetSchool, g);
      setTriadTiers({
        dream: {
          label: adaptive.triangle.stretchTitle,
          targetScore: 'Tham chiếu: 26.0+ (Ngưỡng cạnh tranh cao)',
          majorSchool: adaptive.triangle.stretchSchool,
          notes: adaptive.triangle.stretchDesc
        },
        realistic: {
          label: adaptive.triangle.realisticTitle,
          targetScore: 'Phong độ an toàn: Dải điểm 21.0 – 24.0',
          majorSchool: adaptive.triangle.realisticSchool,
          notes: adaptive.triangle.realisticDesc
        },
        safe: {
          label: adaptive.triangle.safetyTitle,
          targetScore: 'Vùng đệm an toàn',
          majorSchool: adaptive.triangle.safetySchool,
          notes: adaptive.triangle.safetyDesc
        }
      });
    }
  };

  // Khôi phục nội dung cam kết mẫu thích ứng theo mỏ neo T0 cho khối lớp đang chọn
  const handleResetToDefaultTemplate = () => {
    const adaptive = buildAdaptiveTriadAndPlan(targetMajor, targetSchool, selectedGrade);
    setTriadTiers({
      dream: {
        label: adaptive.triangle.stretchTitle,
        targetScore: 'Tham chiếu: 26.0+ (Ngưỡng cạnh tranh cao)',
        majorSchool: adaptive.triangle.stretchSchool,
        notes: adaptive.triangle.stretchDesc
      },
      realistic: {
        label: adaptive.triangle.realisticTitle,
        targetScore: 'Phong độ an toàn: Dải điểm 21.0 – 24.0',
        majorSchool: adaptive.triangle.realisticSchool,
        notes: adaptive.triangle.realisticDesc
      },
      safe: {
        label: adaptive.triangle.safetyTitle,
        targetScore: 'Vùng đệm an toàn',
        majorSchool: adaptive.triangle.safetySchool,
        notes: adaptive.triangle.safetyDesc
      }
    });
    setActionPlans(prev => ({
      ...prev,
      [selectedGrade]: {
        item1: adaptive.actions[0].text,
        item2: adaptive.actions[1].text,
        item3: adaptive.actions[2].text,
        scoreGoal: adaptive.actions[0].text,
        weakSubjectsPlan: adaptive.actions[1].text,
        studyTimeCommitment: adaptive.actions[2].text
      }
    }));
    setToast({ message: `Đã khôi phục kế hoạch hành động thích ứng cho ngành ${targetMajor}!`, type: 'success' });
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
      personalPledge,
      hasSignature: Boolean(hasSignature || sigDataUrl),
      signatureDataUrl: sigDataUrl,
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
      personalPledge,
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
    localStorage.setItem('cbas_step5_personal_pledge', personalPledge);

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
          risk_analysis: `[Kỹ năng nghề]: ${getPlanItem(selectedGrade, 1)} | [Vật neo]: ${getPlanItem(selectedGrade, 2)} | [Cam kết]: ${personalPledge}`,
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
      localStorage.removeItem('cbas_step5_personal_pledge');
      handleClearSignature();
      setPersonalPledge('Em xin cam kết nỗ lực học tập có kỷ luật mỗi ngày, tập trung cải thiện các môn tổ hợp còn yếu và giữ vững cấu trúc 3 nấc nguyện vọng đã xác lập.');
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
      a.download = `KHKT_SocraCareer_ActionTriad_${displayStudentCode}.json`;
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
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans antialiased p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

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
          nav {
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
            /* LỀ AN TOÀN BẢO VỆ CHỮ: Trên 12mm, Phải 14mm, Dưới 12mm, Trái 18mm */
            padding: 12mm 14mm 12mm 18mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* ĐẢM BẢO TIÊU ĐỀ & CHÂN TRANG A4 LUÔN HIỂN THỊ ĐẦY ĐỦ 100% TRONG BẢN IN */
          .a4-container .a4-header {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            width: 100% !important;
          }

          .a4-container .a4-footer {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            width: 100% !important;
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
          subtitle="Chuyển hóa nhận thức phản tư thành hành động cụ thể. Xuất bản cam kết dán ở góc học tập."
        />
      </div>

      {/* =========================================================================
          HEADER BƯỚC 5 (ACTION PLAN & COMMITMENTS)
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm no-print">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200 shrink-0">
              5
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Lộ Trình Kế Hoạch Hành Động & Tam Giác Nguyện Vọng
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 hidden sm:inline-block">
              Kế hoạch hành động & Cam kết tự học
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Chuyển hóa nhận thức phản tư thành kế hoạch học tập thực tế mỗi ngày. Xuất bản cam kết hành động dán ở góc học tập.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>KÝ CAM KẾT & XUẤT PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrintPreview(!showPrintPreview)}
            className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showPrintPreview 
                ? 'bg-teal-50 text-teal-800 border-teal-300' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Xem trước mẫu văn bản in A4 dán góc học tập"
          >
            {showPrintPreview ? <EyeOff className="w-3.5 h-3.5 text-teal-600" /> : <Eye className="w-3.5 h-3.5 text-teal-600" />}
            <span>{showPrintPreview ? 'Ẩn Bản In A4' : 'Xem Bản In A4'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            title="Tải dữ liệu nghiên cứu JSON phục vụ Hội đồng ViSEF"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">Tải JSON</span>
          </button>
          <button
            type="button"
            onClick={handleResetStep5}
            className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200"
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
            BẢN ĐỐI CHIẾU & GỢI Ý KHOA HỌC HÀNH VI (CBAS VISEF 2026) - THU GỌN / MỞ RỘNG
            ========================================================================= */}
        <div className="rounded-2xl border border-teal-200 overflow-hidden shadow-xs bg-white">
          <button
            type="button"
            onClick={() => setShowAiSummary(!showAiSummary)}
            className="w-full bg-gradient-to-r from-teal-50 via-slate-50 to-teal-50 px-5 py-3 border-b border-teal-100 flex flex-wrap justify-between items-center gap-2 text-left cursor-pointer hover:bg-teal-100/50 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="font-extrabold text-xs text-teal-950 uppercase tracking-wide block">
                  💡 BẢNG ĐỐI CHIẾU THỰC CHỨNG & GỢI Ý TỪ HỆ THỐNG AI (ViSEF 2026)
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Hệ thống tự động phân tích từ Bước 1 - 4. Bấm để {showAiSummary ? 'thu gọn' : 'xem gợi ý tham khảo'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded font-bold">
                {displayStudentCode} • Khối {selectedGrade}
              </span>
              <span className="text-xs text-teal-700 font-bold flex items-center gap-1">
                {showAiSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showAiSummary ? 'Thu gọn' : 'Xem gợi ý'}</span>
              </span>
            </div>
          </button>
          
          {showAiSummary && (
            <div 
              className="p-5 border-t border-slate-100" 
              dangerouslySetInnerHTML={{ 
                __html: generateStep5Content({
                  id: displayStudentCode,
                  grade: `Khối ${selectedGrade}`,
                  targetMajor: targetMajor,
                  targetSchool: targetSchool,
                  conf_T0: step1Data.initialConfidence || 8,
                  conf_T2: confidenceT2 || 7,
                  crs_T0: (step1Data.initialConfidence - 5.0).toFixed(1),
                  crs_T2: (confidenceT2 - 7.5).toFixed(1),
                  riasec: step1Data.hollandCode || 'RIA'
                }) 
              }} 
            />
          )}
        </div>

        {/* BANNER HƯỚNG DẪN HỌC SINH TỰ CHỦ LẬP KẾ HOẠCH */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Edit3 className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wide">
              BÀN LẬP KẾ HOẠCH HÀNH ĐỘNG CỦA EM (EM TRỰC TIẾP TỰ ĐIỀN & TỰ KÝ)
            </h3>
            <p className="text-[11px] md:text-xs text-slate-600 leading-relaxed font-medium">
              Các thông tin dưới đây đã được hệ thống đề xuất sẵn dựa trên mỏ neo của em ở Bước 1 & 3. 
              <strong> Em hoàn toàn có quyền tự tay chỉnh sửa lại ngành học, kéo chọn độ tự tin thực tế, điều chỉnh 3 nấc nguyện vọng, viết lời cam kết và ký tên của mình</strong> trước khi xuất bản in dán góc học tập!
            </p>
          </div>
        </div>

        {/* =========================================================================
            BẢNG ĐO LƯỜNG VÀ HIỆU CHUẨN NHẬN THỨC
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Ngành mục tiêu */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 print-badge">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-teal-600" />
                <span>1. NGÀNH MỤC TIÊU CHỐT LẠI:</span>
              </span>
            </div>

            <div>
              <input
                type="text"
                value={targetMajor}
                onChange={(e) => handleUpdateMajor(e.target.value)}
                placeholder="Nhập ngành học mục tiêu của em..."
                className="w-full bg-slate-50 border border-teal-300 focus:border-teal-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 font-extrabold focus:outline-none focus:bg-white transition"
              />
            </div>

            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Em có thể tự sửa lại theo nguyện vọng thực tế</span>
            </p>
          </div>

          {/* Box 2: Chỉ số hiệu chuẩn nhận thức (CRS) */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 print-badge">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span>2. ĐỘ TỰ TIN THỰC TẾ (T2):</span>
              </span>
              <span className="font-black text-sm text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {confidenceT2}/10 điểm
              </span>
            </div>

            <div className="pt-1 space-y-1">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={confidenceT2}
                onChange={(e) => setConfidenceT2(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>T0 ban đầu: {step1Data.initialConfidence}/10</span>
                <span>Kéo chọn mức tự tin thực tế</span>
              </div>
            </div>

            <p className="text-[11px] text-cyan-800 font-medium">
              Độ lệch nhận thức CRS: {crsDelta === 0 ? 'Tiệm cận 0 (Cân bằng)' : `${crsDelta > 0 ? `+${crsDelta}` : crsDelta}`}
            </p>
          </div>

          {/* Box 3: Trạng thái ràng buộc */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 print-badge flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                3. TRẠNG THÁI RÀNG BUỘC:
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <PenTool className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold text-sm text-slate-900">
                  {hasSignature ? '✓ Đã ký cam kết điện tử' : 'Chưa ký cam kết'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Ký tên ở Khung cam kết phía dưới để hoàn tất Bước 5
            </p>
          </div>

        </div>

        {/* =========================================================================
            KHỐI 1: TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO)
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 print-sheet">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <Triangle className="w-5 h-5 text-teal-600 font-bold" />
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO)
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Chiến lược dải điểm bậc thang 3 nấc
              </span>
              <button
                type="button"
                onClick={() => setIsEditingTriad(!isEditingTriad)}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold underline cursor-pointer no-print"
              >
                {isEditingTriad ? '✓ Lưu tùy chỉnh' : '✎ Điều chỉnh 3 nấc'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Nấc 1: Ước mơ */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold uppercase text-[10px]">
                  {triadTiers.dream.label}
                </span>
                {isEditingTriad ? (
                  <input
                    type="text"
                    value={triadTiers.dream.targetScore}
                    onChange={(e) => handleUpdateTriad('dream', 'targetScore', e.target.value)}
                    className="w-24 bg-white border border-purple-300 text-purple-800 rounded px-1.5 py-0.5 text-right font-semibold"
                  />
                ) : (
                  <span className="text-purple-700 font-semibold">{triadTiers.dream.targetScore}</span>
                )}
              </div>

              {isEditingTriad ? (
                <input
                  type="text"
                  value={triadTiers.dream.majorSchool}
                  onChange={(e) => handleUpdateTriad('dream', 'majorSchool', e.target.value)}
                  className="w-full bg-white border border-purple-300 text-slate-900 font-bold rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-bold text-slate-900 text-sm">{triadTiers.dream.majorSchool}</p>
              )}

              {isEditingTriad ? (
                <textarea
                  rows={2}
                  value={triadTiers.dream.notes}
                  onChange={(e) => handleUpdateTriad('dream', 'notes', e.target.value)}
                  className="w-full bg-white border border-purple-300 text-slate-800 rounded p-1.5 text-[11px]"
                />
              ) : (
                <p className="text-slate-600 text-[11px] leading-relaxed border-t border-purple-200/80 pt-1.5">{triadTiers.dream.notes}</p>
              )}
            </div>

            {/* Nấc 2: Vừa sức */}
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase text-[10px]">
                  {triadTiers.realistic.label}
                </span>
                {isEditingTriad ? (
                  <input
                    type="text"
                    value={triadTiers.realistic.targetScore}
                    onChange={(e) => handleUpdateTriad('realistic', 'targetScore', e.target.value)}
                    className="w-24 bg-white border border-teal-300 text-teal-800 rounded px-1.5 py-0.5 text-right font-semibold"
                  />
                ) : (
                  <span className="text-teal-700 font-semibold">{triadTiers.realistic.targetScore}</span>
                )}
              </div>

              {isEditingTriad ? (
                <input
                  type="text"
                  value={triadTiers.realistic.majorSchool}
                  onChange={(e) => handleUpdateTriad('realistic', 'majorSchool', e.target.value)}
                  className="w-full bg-white border border-teal-300 text-slate-900 font-bold rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-bold text-slate-900 text-sm">{triadTiers.realistic.majorSchool}</p>
              )}

              {isEditingTriad ? (
                <textarea
                  rows={2}
                  value={triadTiers.realistic.notes}
                  onChange={(e) => handleUpdateTriad('realistic', 'notes', e.target.value)}
                  className="w-full bg-white border border-teal-300 text-slate-800 rounded p-1.5 text-[11px]"
                />
              ) : (
                <p className="text-slate-600 text-[11px] leading-relaxed border-t border-teal-200/80 pt-1.5">{triadTiers.realistic.notes}</p>
              )}
            </div>

            {/* Nấc 3: An toàn */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
                  {triadTiers.safe.label}
                </span>
                {isEditingTriad ? (
                  <input
                    type="text"
                    value={triadTiers.safe.targetScore}
                    onChange={(e) => handleUpdateTriad('safe', 'targetScore', e.target.value)}
                    className="w-24 bg-white border border-slate-300 text-slate-800 rounded px-1.5 py-0.5 text-right font-semibold"
                  />
                ) : (
                  <span className="text-slate-600 font-semibold">{triadTiers.safe.targetScore}</span>
                )}
              </div>

              {isEditingTriad ? (
                <input
                  type="text"
                  value={triadTiers.safe.majorSchool}
                  onChange={(e) => handleUpdateTriad('safe', 'majorSchool', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-bold rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-bold text-slate-900 text-sm">{triadTiers.safe.majorSchool}</p>
              )}

              {isEditingTriad ? (
                <textarea
                  rows={2}
                  value={triadTiers.safe.notes}
                  onChange={(e) => handleUpdateTriad('safe', 'notes', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded p-1.5 text-[11px]"
                />
              ) : (
                <p className="text-slate-600 text-[11px] leading-relaxed border-t border-slate-200 pt-1.5">{triadTiers.safe.notes}</p>
              )}
            </div>

          </div>
        </div>

        {/* =========================================================================
            KHỐI 2: 3 MỤC TIÊU CAM KẾT HÀNH ĐỘNG HỌC TẬP THEO KHỐI LỚP
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 print-sheet">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                <span>3 MỤC TIÊU CAM KẾT HÀNH ĐỘNG HỌC TẬP (MỖI NGÀY)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kế hoạch học tập cụ thể, gần gũi giúp em nâng cao điểm số, chuẩn bị kỹ năng và kiên định với mục tiêu đã chọn.
              </p>
            </div>

            {/* Tab Khối Lớp */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs no-print">
              <button
                type="button"
                onClick={() => handleGradeSwitch(10)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  selectedGrade === 10 ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khối 10
              </button>
              <button
                type="button"
                onClick={() => handleGradeSwitch(11)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  selectedGrade === 11 ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khối 11
              </button>
              <button
                type="button"
                onClick={() => handleGradeSwitch(12)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  selectedGrade === 12 ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-600 hover:text-slate-900'
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
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold">
                    🎯 {gradeInfo.badge}
                  </span>
                  <p className="text-xs text-slate-700 italic flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{gradeInfo.note}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefaultTemplate}
                  className="px-2.5 py-1 text-[11px] rounded bg-white text-teal-800 hover:bg-slate-50 hover:text-teal-900 border border-slate-200 transition flex items-center gap-1 cursor-pointer no-print font-medium"
                  title="Khôi phục lại nội dung gợi ý mẫu cho khối lớp này"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục gợi ý mẫu</span>
                </button>
              </div>
            );
          })()}

          {/* Nội dung mục tiêu chi tiết 3 Mục */}
          <div className="space-y-4 text-xs">
            {/* Mục 1: Điểm số / Học vấn */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[0]?.num}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal no-print">(Em có thể chỉnh sửa trực tiếp)</span>
              </label>
              <textarea
                rows={3}
                value={getPlanItem(selectedGrade, 0)}
                onChange={(e) => handleUpdatePlan('item1', e.target.value)}
                placeholder="Nhập mục tiêu nâng điểm hoặc bấm gợi ý bên dưới..."
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:bg-white focus:border-teal-600 rounded-xl p-3 text-slate-900 font-medium focus:outline-none text-xs leading-relaxed transition-colors shadow-2xs"
              />
              {/* Quick chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 no-print">
                <span className="text-[11px] text-slate-500 font-medium mr-0.5">💡 Chọn nhanh:</span>
                {(QUICK_ACTION_CHIPS[selectedGrade]?.item1 || []).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendChip('item1', chip)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-700 rounded-lg border border-slate-200 transition-all cursor-pointer font-medium active:scale-95"
                  >
                    + {chip}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleUpdatePlan('item1', '')}
                  className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 rounded-lg border border-slate-200 transition-all cursor-pointer ml-auto"
                  title="Xóa nội dung ô này để tự viết hoàn toàn"
                >
                  ✕ Xóa để tự viết
                </button>
              </div>
            </div>

            {/* Mục 2: Kỹ năng nghề / Thích ứng */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[1]?.num}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal no-print">(Em có thể chỉnh sửa trực tiếp)</span>
              </label>
              <textarea
                rows={3}
                value={getPlanItem(selectedGrade, 1)}
                onChange={(e) => handleUpdatePlan('item2', e.target.value)}
                placeholder="Nhập kỹ năng cần chuẩn bị hoặc bấm gợi ý bên dưới..."
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:bg-white focus:border-teal-600 rounded-xl p-3 text-slate-900 font-medium focus:outline-none text-xs leading-relaxed transition-colors shadow-2xs"
              />
              {/* Quick chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 no-print">
                <span className="text-[11px] text-slate-500 font-medium mr-0.5">💡 Chọn nhanh:</span>
                {(QUICK_ACTION_CHIPS[selectedGrade]?.item2 || []).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendChip('item2', chip)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-700 rounded-lg border border-slate-200 transition-all cursor-pointer font-medium active:scale-95"
                  >
                    + {chip}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleUpdatePlan('item2', '')}
                  className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 rounded-lg border border-slate-200 transition-all cursor-pointer ml-auto"
                  title="Xóa nội dung ô này để tự viết hoàn toàn"
                >
                  ✕ Xóa để tự viết
                </button>
              </div>
            </div>

            {/* Mục 3: Kỷ luật tự học & Kiên định mục tiêu */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span>{ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[2]?.num}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal no-print">(Em có thể chỉnh sửa trực tiếp)</span>
              </label>
              <textarea
                rows={3}
                value={getPlanItem(selectedGrade, 2)}
                onChange={(e) => handleUpdatePlan('item3', e.target.value)}
                placeholder="Nhập kỷ luật bản thân hoặc bấm gợi ý bên dưới..."
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:bg-white focus:border-teal-600 rounded-xl p-3 text-slate-900 font-medium focus:outline-none text-xs leading-relaxed transition-colors shadow-2xs"
              />
              {/* Quick chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 no-print">
                <span className="text-[11px] text-slate-500 font-medium mr-0.5">💡 Chọn nhanh:</span>
                {(QUICK_ACTION_CHIPS[selectedGrade]?.item3 || []).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendChip('item3', chip)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-700 rounded-lg border border-slate-200 transition-all cursor-pointer font-medium active:scale-95"
                  >
                    + {chip}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleUpdatePlan('item3', '')}
                  className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 rounded-lg border border-slate-200 transition-all cursor-pointer ml-auto"
                  title="Xóa nội dung ô này để tự viết hoàn toàn"
                >
                  ✕ Xóa để tự viết
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            KHỐI CAM KẾT: LỜI CAM KẾT HÀNH ĐỘNG CỦA HỌC SINH (HỌC SINH TỰ GÕ BẰNG BÀN PHÍM)
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-white border-2 border-teal-300 shadow-sm space-y-3.5 print-sheet">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-teal-600" />
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                ✍️ LỜI CAM KẾT HÀNH ĐỘNG CỦA HỌC SINH (EM TỰ GÕ NỘI DUNG VÀO ĐÂY)
              </h2>
            </div>
            <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Trách nhiệm cá nhân
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Em hãy trực tiếp gõ lời hứa và quyết tâm hành động của mình vào ô bên dưới (ví dụ: mục tiêu tự học mỗi ngày, quyết tâm cải thiện điểm số, lời dặn bản thân). 
            Nội dung này sẽ được in trang trọng lên Bản cam kết dán góc học tập!
          </p>

          <div>
            <textarea
              rows={3}
              value={personalPledge}
              onChange={(e) => handleUpdatePledge(e.target.value)}
              placeholder="VD: Em xin cam kết mỗi tối dành 2 giờ tự học và giải đề Toán, hạn chế dùng điện thoại, quyết tâm đỗ nguyện vọng 1..."
              className="w-full p-3.5 bg-slate-50 border-2 border-teal-200 hover:border-teal-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs md:text-sm text-slate-900 font-semibold leading-relaxed focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Chips gợi ý nhanh lời cam kết */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 block">💡 Bấm để thêm nhanh lời cam kết mẫu:</span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                "Dành 2 giờ tự học mỗi tối có kỷ luật",
                "Tập trung cải thiện điểm môn yếu trong tổ hợp",
                "Kiên quyết giữ vững 3 nấc an toàn, không đổi theo đám đông",
                "Chủ động hỏi Thầy/Cô khi gặp bài khó",
                "Quyết tâm chinh phục mục tiêu đã hiệu chuẩn"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUpdatePledge(personalPledge ? `${personalPledge}. ${chip}` : chip)}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[11px] font-bold border border-teal-200 transition cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleUpdatePledge('')}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition cursor-pointer"
                title="Xóa trắng để em tự gõ từ đầu"
              >
                ✕ Xóa để tự viết
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            KHỐI 4: CHỮ KÝ CAM KẾT ĐIỆN TỬ (VẼ TAY HOẶC GÕ TÊN ĐỀU ĐƯỢC)
            ========================================================================= */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 print-sheet">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-teal-600" />
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                CHỮ KÝ CAM KẾT CÁ NHÂN (COMMITMENT DEVICE)
              </h2>
            </div>

            {/* TAB CHUYỂN ĐỔI CHẾ ĐỘ KÝ: VẼ TAY HOẶC GÕ BÀN PHÍM */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl no-print text-xs">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  signatureMode === 'draw'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Vẽ chữ ký tay</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignatureMode('type');
                  applyTypedSignature(typedSignatureName || studentName || displayStudentCode);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  signatureMode === 'type'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Gõ họ tên để ký</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            {signatureMode === 'draw'
              ? 'Dùng chuột kéo vẽ, hoặc dùng ngón tay vuốt trên màn hình cảm ứng để tạo chữ ký của em.'
              : 'Gõ họ tên của em vào ô bên dưới, hệ thống sẽ tự động tạo chữ ký nghệ thuật lên khung.'}
          </p>

          {/* NẾU CHẾ ĐỘ GÕ TÊN */}
          {signatureMode === 'type' && (
            <div className="no-print space-y-2 p-3 bg-teal-50/60 rounded-xl border border-teal-200">
              <label className="block text-xs font-bold text-teal-900">
                ⌨️ Nhập họ và tên của em để tạo chữ ký tự động:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedSignatureName}
                  onChange={(e) => applyTypedSignature(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  className="w-full p-2.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => applyTypedSignature(typedSignatureName)}
                  className="px-3.5 py-2.5 bg-teal-600 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-xs hover:bg-teal-700 cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* Vùng vẽ / hiển thị chữ ký canvas */}
          <div className="relative border-2 border-dashed border-teal-300 rounded-xl bg-slate-50/70 p-3 flex flex-col items-center justify-center print-canvas">
            <canvas
              ref={canvasRef}
              width={500}
              height={120}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`bg-white rounded-lg max-w-full shadow-2xs border border-slate-200 ${
                signatureMode === 'draw' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
            {!hasSignature && (
              <span className="absolute text-slate-400 text-xs italic pointer-events-none">
                {signatureMode === 'draw' ? '✍️ Ký tên vào đây bằng chuột hoặc ngón tay' : '⌨️ Chữ ký sẽ hiển thị tại đây khi em gõ tên'}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Học sinh cam kết:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-teal-800 font-bold border border-slate-200">
                {typedSignatureName || displayStudentCode}
              </span>
              {hasSignature && (
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã ghi nhận chữ ký</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleClearSignature}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-rose-200 cursor-pointer font-medium"
              >
                Xóa chữ ký làm lại
              </button>
              <button
                type="button"
                onClick={handleSaveAndPrint}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-teal-600/20"
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
        <div className="no-print w-full max-w-[210mm] mb-4 flex justify-between items-center bg-teal-50/90 p-3 rounded-xl border border-teal-200 mx-auto shadow-sm">
          <span className="text-xs text-teal-900 font-medium flex items-center gap-1.5">
            🔍 Chế độ xem trước trang in A4 thực tế (Bản ký tay thực địa)
          </span>
          <button
            type="button"
            onClick={handleSaveAndPrint}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>🖨️ IN NGAY BẢN A4 HOÀN CHỈNH</span>
          </button>
        </div>
      )}

      {/* ==================== KHUNG TRANG IN A4 THỰC TẾ ==================== */}
      <div className={`a4-container bg-white text-slate-900 flex-col justify-between ${showPrintPreview ? 'flex' : 'hidden print:flex'}`}>
        {(() => {
          return (
            <div>
              {/* 1. PHẦN ĐẦU TRANG (HEADER TIÊU CHUẨN CỦA BẢN CAM KẾT A4) */}
              <div className="a4-header border-b-2 border-teal-700 pb-3 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-teal-900 tracking-wider uppercase block">
                      SỞ GD&ĐT KHÁNH HÒA — TRƯỜNG THPT TRẦN QUÝ CÁP
                    </span>
                    <div className="text-xs font-black text-slate-800 mt-0.5">
                      DỰ ÁN NGHIÊN CỨU KHOA HỌC KỸ THUẬT CẤP QUỐC GIA (KHKT 2026)
                    </div>
                    <div className="text-[9.5px] text-slate-600 font-medium">
                      Lĩnh vực: Khoa học Xã hội & Hành vi • Hệ thống Trợ lý AI SocraCareer
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-300 rounded font-bold uppercase text-[9.5px] tracking-wide">
                      NHÓM CAN THIỆP N=30 (SOCRACAREER)
                    </span>
                    <div className="text-[10px] font-bold text-slate-700 mt-1">
                      MÃ ĐỐI TƯỢNG: <span className="text-teal-700 font-black">{displayStudentCode}</span> | KHỐI {selectedGrade} THPT
                    </div>
                  </div>
                </div>

                <div className="text-center mt-2.5">
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG
                  </h1>
                  <p className="text-[10px] italic text-slate-500 mt-0.5">
                    "Bản kế hoạch hành động tự chủ dán tại góc học tập — Thực hiện kỷ luật mỗi ngày để bứt phá."
                  </p>
                </div>
              </div>

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

              {/* 3. KHỐI TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG */}
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
                        {triadTiers.dream?.majorSchool || `${targetMajor} (Trường trọng điểm / Tốp đầu)`}
                      </p>
                    </div>
                    <div className="text-[9.5px] text-slate-600 mt-1.5 pt-1 border-t border-teal-200/60 leading-normal">
                      {triadTiers.dream?.notes || 'Trường Top đầu — Đòi hỏi nỗ lực tối đa để thu hẹp khoảng cách điểm sàn (tham chiếu cạnh tranh cao)'}
                    </div>
                  </div>

                  {/* Nấc 2: Vừa sức */}
                  <div className="p-2.5 rounded-lg border border-cyan-200 bg-cyan-50/50 flex flex-col justify-between">
                    <div>
                      <span className="font-extrabold text-cyan-900 text-[10px] block uppercase tracking-wide">
                        {triadTiers.realistic?.label || '2. NGUYỆN VỌNG VỪA SỨC (REALISTIC)'}
                      </span>
                      <p className="font-bold text-slate-900 mt-1 text-[11.5px]">
                        {triadTiers.realistic?.majorSchool || `${targetMajor} (Hệ chính quy vừa sức / Cơ sở uy tín khu vực)`}
                      </p>
                    </div>
                    <div className="text-[9.5px] text-slate-600 mt-1.5 pt-1 border-t border-cyan-200/60 leading-normal">
                      {triadTiers.realistic?.notes || 'Mục tiêu trọng tâm — Điểm số nằm trong phong độ an toàn (+1.5 đến +2.5 điểm)'}
                    </div>
                  </div>

                  {/* Nấc 3: Bảo toàn rủi ro */}
                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <span className="font-extrabold text-slate-800 text-[10px] block uppercase tracking-wide">
                        {triadTiers.safe?.label || '3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)'}
                      </span>
                      <p className="font-bold text-slate-900 mt-1 text-[11.5px]">
                        {triadTiers.safe?.majorSchool || `${targetMajor} (Hệ Cao đẳng / Chương trình thực hành chất lượng cao)`}
                      </p>
                    </div>
                    <div className="text-[9.5px] text-slate-600 mt-1.5 pt-1 border-t border-slate-200 leading-normal">
                      {triadTiers.safe?.notes || 'Vùng đệm dự phòng rủi ro biến động điểm thi, bảo đảm 100% lộ trình học tập không bị gián đoạn'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 3 MỤC TIÊU CAM KẾT HÀNH ĐỘNG HỌC TẬP */}
              <section className="border border-slate-200 rounded-lg p-3.5 mb-4 text-xs bg-white">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2.5">
                  <div>
                    <h3 className="font-black text-slate-900 uppercase">
                      🎯 3 MỤC TIÊU CAM KẾT HÀNH ĐỘNG HỌC TẬP DÁN GÓC HỌC TẬP
                    </h3>
                    <p className="text-[10px] text-slate-600 italic mt-0.5">
                      {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.note || 'Kế hoạch học tập cụ thể, thực tế giúp em kiên định với mục tiêu đã chọn'}
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-right">
                    {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.badge || `Áp dụng: Khối ${selectedGrade} THPT`}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Mục 1: Điểm số / Học vấn */}
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                      {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[0]?.num || '1. Mục tiêu nâng điểm các môn thi tổ hợp xét tuyển:'}
                    </span>
                    <div 
                      className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 text-[11px] leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: getPlanItem(selectedGrade, 0) }}
                    />
                  </div>

                  {/* Mục 2: Kế hoạch rèn luyện kỹ năng nghề */}
                  <div className="border-t border-dashed border-slate-200 pt-2">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                      {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[1]?.num || '2. Rèn luyện kỹ năng thực tế & Trao đổi tài chính cùng gia đình:'}
                    </span>
                    <div 
                      className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-700 text-[11px] leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: getPlanItem(selectedGrade, 1) }}
                    />
                  </div>

                  {/* Mục 3: Kỷ luật tự học & Kiên định mục tiêu */}
                  <div className="border-t border-dashed border-slate-200 pt-2">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                      {ADAPTIVE_COMMITMENTS_BY_GRADE[selectedGrade]?.items[2]?.num || '3. Kỷ luật tự học & Kiên định mục tiêu (Không lung lay):'}
                    </span>
                    <div 
                      className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-700 text-[11px] leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: getPlanItem(selectedGrade, 2) }}
                    />
                  </div>
                </div>
              </section>

              {/* LỜI CAM KẾT HÀNH ĐỘNG CỦA HỌC SINH TRÊN BẢN IN */}
              {personalPledge && (
                <div className="border border-teal-200 bg-teal-50/60 rounded-lg p-2.5 mb-3 text-xs">
                  <span className="font-black text-teal-900 uppercase text-[10px] block mb-0.5">
                    ✍️ LỜI CAM KẾT HÀNH ĐỘNG CỦA HỌC SINH:
                  </span>
                  <p className="italic text-slate-800 text-[11px] leading-relaxed">
                    "{personalPledge}"
                  </p>
                </div>
              )}

              {/* 5. CHỮ KÝ CAM KẾT CÁ NHÂN (3 BÊN) */}
              <section className="border-t-2 border-slate-900 pt-3 page-break-inside-avoid">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <div className="font-bold text-slate-700 uppercase text-[10.5px]">HỌC SINH CAM KẾT</div>
                    <div className="text-[9.5px] text-slate-500 italic mb-1">(Ký và ghi rõ họ tên)</div>
                    <div className="h-16 border border-dashed border-slate-400 rounded bg-white flex items-center justify-center mb-1 overflow-hidden">
                      {hasSignature && signatureDataUrl ? (
                        <img 
                          src={signatureDataUrl} 
                          alt="Chữ ký học sinh" 
                          className="max-h-14 max-w-[95%] object-contain" 
                        />
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic">
                          (Mã số: {typedSignatureName || displayStudentCode})
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-teal-800 text-[10px]">{typedSignatureName || displayStudentCode}</div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-700 uppercase text-[10.5px]">CỐ VẤN / MENTOR</div>
                    <div className="text-[9.5px] text-slate-500 italic mb-1">(Xác nhận nghiệm thu)</div>
                    <div className="h-16 border border-dashed border-slate-300 rounded bg-slate-50/50 flex items-center justify-center mb-1">
                      <span className="text-[10px] text-emerald-700 font-bold">✓ Đã nghiệm thu</span>
                    </div>
                    <div className="font-bold text-slate-800 text-[10px]">Cố vấn Định hướng</div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-700 uppercase text-[10.5px]">ĐẠI DIỆN PHỤ HUYNH</div>
                    <div className="text-[9.5px] text-slate-500 italic mb-1">(Ký chứng kiến hỗ trợ)</div>
                    <div className="h-16 border border-dashed border-slate-300 rounded bg-slate-50/50 flex items-center justify-center mb-1">
                      <span className="text-[10px] text-slate-500 italic">(Đã thống nhất gia đình)</span>
                    </div>
                    <div className="font-bold text-slate-800 text-[10px]">Đại diện Gia đình</div>
                  </div>
                </div>
              </section>
            </div>
          );
        })()}

        {/* CHÂN TRANG A4 */}
        <div className="a4-footer border-t border-slate-200 pt-2 text-[9.5px] text-slate-400 flex justify-between items-center mt-3">
          <span>SocraCareer — Hệ thống Can thiệp Phản tư & Hiệu chuẩn Nhận thức</span>
          <span>Hội đồng Khoa học KHKT 2026 • SocraCareer Model</span>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG CUỐI TRANG */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 no-print">
        <button
          type="button"
          onClick={() => navigate('/student/booking')}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Quay lại Bước 4 (Tham vấn 1-1)</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer"
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
