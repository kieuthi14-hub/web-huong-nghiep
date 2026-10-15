import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  School, 
  Scissors, 
  DollarSign, 
  Clock, 
  Building2, 
  FileCheck, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function Step3VocationalVerification({ profile, onComplete }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Đọc dữ liệu mỏ neo hoặc hồ sơ nếu không truyền trực tiếp qua props
  const initialBudget = profile?.family_budget_limit || (() => {
    try {
      const raw = localStorage.getItem("cbas_anchor_data") || localStorage.getItem("userAnchorData");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.family_budget_limit) return parseFloat(parsed.family_budget_limit);
        if (parsed.familyBudget) return parseFloat(parsed.familyBudget);
      }
    } catch (e) {}
    return 20.0;
  })();

  const fallbackSchoolName = (profile?.target_university || profile?.targetSchool || '').trim();

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('cbas_step3_vocational');
      if (saved) {
        const p = JSON.parse(saved);
        return {
          trainingType: p.trainingType || 'formal',
          academyName: p.academyName || fallbackSchoolName || '',
          tuitionFee: p.tuitionFee || '',
          toolkitCost: p.toolkitCost || '',
          livingCost6Months: p.livingCost6Months || '',
          weeksUntilRealHaircut: p.weeksUntilRealHaircut || '',
          hasWrittenContract: Boolean(p.hasWrittenContract),
          freeRetrainingIfFailed: Boolean(p.freeRetrainingIfFailed),
          startingSalary: p.startingSalary || '',
          experienceYearsBeforeOpening: p.experienceYearsBeforeOpening || '',
          startupBudgetEstimate: p.startupBudgetEstimate || '',
          hasSurveyedCompetitors: Boolean(p.hasSurveyedCompetitors),
        };
      }
    } catch (e) {}
    return {
      trainingType: 'formal', // 'formal': Trường CĐ/TC chính quy | 'private': Cơ sở tư nhân/Salon
      academyName: fallbackSchoolName || '',
      tuitionFee: '',
      toolkitCost: '',
      livingCost6Months: '',
      weeksUntilRealHaircut: '',
      hasWrittenContract: false,
      freeRetrainingIfFailed: false,
      startingSalary: '',
      experienceYearsBeforeOpening: '',
      startupBudgetEstimate: '',
      hasSurveyedCompetitors: false,
    };
  });

  const [warnings, setWarnings] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormal = data.trainingType === 'formal';
  const trainingTypeLabel = isFormal 
    ? 'Trường Cao đẳng/Trung cấp chính quy' 
    : 'Cơ sở đào tạo tư nhân/Salon';

  // Tính toán chi phí Giai đoạn 1 & thâm hụt tài chính
  const tuition = parseFloat(data.tuitionFee || 0);
  const toolkit = parseFloat(data.toolkitCost || 0);
  const living = parseFloat(data.livingCost6Months || 0);
  const totalPhase1Cost = tuition + toolkit + living;
  const userSavings = initialBudget;
  const deficit = totalPhase1Cost - userSavings;
  const hasDeficit = deficit > 0;

  const handleVerify = async () => {
    let currentWarnings = [];

    // Kiểm tra điền thiếu thông tin cơ bản
    if (
      !data.academyName.trim() || 
      !data.tuitionFee || 
      !data.toolkitCost || 
      !data.livingCost6Months || 
      !data.weeksUntilRealHaircut || 
      !data.startingSalary ||
      !data.experienceYearsBeforeOpening ||
      !data.startupBudgetEstimate
    ) {
      currentWarnings.push(
        '⚠️ Vui lòng nhập đầy đủ các thông số: Tên cơ sở/trường, Học phí, Chi phí đồ nghề, Sinh hoạt 6 tháng, Thời gian thực hành, Mức lương khởi điểm, Thời gian tích lũy kinh nghiệm và Dự toán vốn mở tiệm!'
      );
    }

    // 1. Kiểm toán chi phí đào tạo giai đoạn 1 & thâm hụt
    if (totalPhase1Cost > userSavings) {
      currentWarnings.push(
        `🚨 CẢNH BÁO THÂM HỤT TÀI CHÍNH & NGUY CƠ ĐỨT GÃY: Tổng chi phí GĐ1 là ${totalPhase1Cost.toFixed(1)} triệu, vượt quá ${deficit.toFixed(1)} triệu so với vốn hiện có (${userSavings} triệu). Bạn có nguy cơ cao phải bỏ học giữa chừng do thiếu kinh phí sinh hoạt nếu không có phương án bù đắp!`
      );
    }

    // 2. Kiểm tra tính pháp lý của thỏa thuận đào tạo
    if (!data.hasWrittenContract) {
      currentWarnings.push(
        isFormal 
          ? `🚨 BÁO ĐỘNG PHÁP LÝ ĐÀO TẠO: Trường chính quy bắt buộc phải có Giấy báo trúng tuyển / Hợp đồng đào tạo và cam kết văn bằng chuẩn Bộ LĐ-TB&XH!`
          : `🚨 BÁO ĐỘNG RỦI RO HỢP ĐỒNG: Thỏa thuận miệng tiềm ẩn nguy cơ bị chủ cơ sở bóc lột sức lao động (chỉ cho gội đầu, quét nhà, vặt vãnh) mà không được truyền nghề lõi. BẮT BUỘC phải yêu cầu Hợp đồng đào tạo bằng văn bản!`
      );
    }

    // 3. Kiểm tra tiến độ thực hành lâm sàng nghề
    if (parseInt(data.weeksUntilRealHaircut || 0) > 8) {
      currentWarnings.push(
        isFormal
          ? `⚠️ CẢNH BÁO TIẾN ĐỘ THỰC HÀNH: Thời gian chờ thực hành xưởng/thực tập quá muộn (> 8 tuần). Cần kiểm tra kỹ phân bổ giờ lý thuyết và thực hành của chương trình đào tạo!`
          : `⚠️ CẢNH BÁO TIẾN ĐỘ THỰC HÀNH: Thời gian chờ để được thực hành trên mẫu thật quá muộn (> 8 tuần). Cơ sở có dấu hiệu kéo dài thời gian để tận dụng nhân công phụ việc!`
      );
    }

    // 4. Kiểm tra kỳ vọng lương khởi điểm thợ phụ
    const startingSalaryNum = parseFloat(data.startingSalary || 0);
    if (startingSalaryNum > 10.0) {
      currentWarnings.push(
        `⚠️ CẢNH BÁO ẢO TƯỞNG THU NHẬP KHỞI ĐIỂM: Mức lương dự kiến ${startingSalaryNum} triệu/tháng là quá cao đối với thợ phụ / nhân viên học việc mới ra trường. Thực tế thợ phụ/thử việc ban đầu thường dao động từ 4 - 7 triệu đồng/tháng trước khi lên thợ chính!`
      );
    }

    // 5. Kiểm tra thời gian tích lũy kinh nghiệm
    const expNum = parseFloat(data.experienceYearsBeforeOpening);
    if (!isNaN(expNum) && expNum < 1.0) {
      currentWarnings.push(
        `⚠️ CẢNH BÁO RỦI RO MỞ TIỆM QUÁ SỚM: Thời gian tích lũy kinh nghiệm dưới 1 năm là quá ngắn để rèn luyện tay nghề và tạo dựng tập khách hàng quen. Hơn 70% cơ sở tự mở trước 1 năm kinh nghiệm bị thua lỗ do tay nghề chưa vững!`
      );
    }

    // 6. Kiểm tra dự toán vốn mở tiệm
    const startupBudget = parseFloat(data.startupBudgetEstimate || 0);
    if (startupBudget > 0 && startupBudget < 50.0) {
      currentWarnings.push(
        `⚠️ CẢNH BÁO TÍNH KHẢ THI KHỞI NGHIỆP: Dự toán mở cơ sở/tiệm riêng ${startupBudget} triệu là phi thực tế. Chi phí tối thiểu cho cọc mặt bằng, trang thiết bị máy móc, gương đèn và pháp lý địa phương dao động từ 60 - 80 triệu đồng.`
      );
    }

    // 7. Kiểm tra khảo sát đối thủ cạnh tranh & thị trường
    if (!data.hasSurveyedCompetitors) {
      currentWarnings.push(
        isFormal
          ? '⚠️ CẢNH BÁO THIẾU DỮ LIỆU THỊ TRƯỜNG: Bạn chưa khảo sát nhu cầu tuyển dụng thực tế của các doanh nghiệp trong ngành tại khu vực dự định làm việc!'
          : '⚠️ CẢNH BÁO THIẾU DỮ LIỆU ĐỊA BÀN: Bạn chưa khảo sát mật độ tiệm cạnh tranh trong bán kính 2km. Bắt buộc phải quan sát thực tế trước khi đầu tư vốn mở tiệm!'
      );
    }

    setWarnings(currentWarnings);

    // Điều kiện thông qua: Phải điền đủ thông tin, có cam kết văn bản và đã khảo sát thị trường
    if (
      currentWarnings.length === 0 && 
      data.hasWrittenContract && 
      data.hasSurveyedCompetitors &&
      data.academyName.trim()
    ) {
      setIsSubmitting(true);

      const verifiedResult = {
        trainingType: data.trainingType,
        trainingTypeLabel,
        academyName: data.academyName.trim(),
        tuitionFee: tuition,
        toolkitCost: toolkit,
        livingCost6Months: living,
        totalPhase1Cost,
        userSavings,
        deficit: hasDeficit ? parseFloat(deficit.toFixed(1)) : 0,
        weeksUntilRealHaircut: data.weeksUntilRealHaircut,
        hasWrittenContract: data.hasWrittenContract,
        freeRetrainingIfFailed: data.freeRetrainingIfFailed,
        startingSalary: startingSalaryNum,
        experienceYearsBeforeOpening: data.experienceYearsBeforeOpening,
        startupBudgetEstimate: startupBudget,
        hasSurveyedCompetitors: data.hasSurveyedCompetitors,
        verified: true,
        status: 'VOCATIONAL_CALIBRATED',
        timestamp: new Date().toISOString()
      };

      // Bản tóm tắt hồ sơ đối chất nghề chuẩn CBAS
      const profileSummary = [
        `[HỒ SƠ THẨM ĐỊNH NGHỀ THỰC CHIẾN - BƯỚC 3]`,
        `• Loại hình đào tạo: ${trainingTypeLabel}`,
        `• Cơ sở/Trường mục tiêu: ${verifiedResult.academyName}`,
        `• Kiểm toán chi phí GĐ1: Học phí ${verifiedResult.tuitionFee}tr + Đồ nghề ${verifiedResult.toolkitCost}tr + Ăn ở ${verifiedResult.livingCost6Months}tr = Tổng ${verifiedResult.totalPhase1Cost.toFixed(1)}tr (Vốn gia đình: ${userSavings}tr | ${hasDeficit ? `Thâm hụt: -${deficit.toFixed(1)}tr - Cảnh báo nguy cơ đứt gãy việc học` : `Đủ vốn an toàn, dư +${Math.abs(deficit).toFixed(1)}tr`})`,
        `• Tiến độ thực hành: Sau ${verifiedResult.weeksUntilRealHaircut} tuần | Pháp lý hợp đồng: ${verifiedResult.hasWrittenContract ? 'Đã có văn bản cam kết' : 'Chưa có hợp đồng'}`,
        `• Khảo sát thị trường: Lương thợ phụ khởi điểm ${verifiedResult.startingSalary}tr/tháng | Tích lũy kinh nghiệm ${verifiedResult.experienceYearsBeforeOpening} trước khi mở tiệm | Vốn mở tiệm: ${verifiedResult.startupBudgetEstimate}tr | Đã khảo sát thị trường địa bàn: ${verifiedResult.hasSurveyedCompetitors ? 'Đạt yêu cầu' : 'Chưa khảo sát'}`
      ].join('\n');

      const step3Evidence = {
        cutoff_score: isFormal 
          ? 'Xét tuyển học bạ THPT (Trường CĐ/TC chính quy)' 
          : 'Học nghề thực chiến (Không xét điểm chuẩn)',
        tuition: `${verifiedResult.tuitionFee} triệu (Tổng GĐ1: ${verifiedResult.totalPhase1Cost.toFixed(1)} triệu)`,
        employment_rate: `Lương khởi điểm: ${verifiedResult.startingSalary} tr/tháng | Tích lũy: ${verifiedResult.experienceYearsBeforeOpening} | Vốn mở tiệm: ${verifiedResult.startupBudgetEstimate} triệu`,
        vocational: verifiedResult,
        triage: {
          reflectionText: profileSummary,
          pathway: 'vocational',
          triage_code: 'PHAN_LUONG_1'
        },
        timestamp: new Date().toLocaleString(),
        verified_at: new Date().toISOString()
      };

      // 1. Lưu đồng bộ vào LocalStorage
      try {
        localStorage.setItem("cbas_step3_vocational", JSON.stringify(verifiedResult));
        localStorage.setItem("cbas_step3_evidence", JSON.stringify(step3Evidence));
        localStorage.setItem("cbas_step3_reflection", profileSummary);
        localStorage.setItem("career_evidence_task", JSON.stringify({
          cutoffScores: step3Evidence.cutoff_score,
          tuitionFees: step3Evidence.tuition,
          admissionQuota: step3Evidence.employment_rate,
          completedAt: step3Evidence.timestamp
        }));
        const currentMajor = profile?.target_career || profile?.targetMajor || 'Học nghề thực chiến';
        const currentSchool = verifiedResult.academyName || profile?.target_university || profile?.targetSchool || trainingTypeLabel;
        localStorage.setItem("cbas_step3_triage", JSON.stringify({
          triageResult: 'In-depth (20 phút)',
          triage_code: 'PHAN_LUONG_1',
          pathway: 'vocational',
          targetMajor: currentMajor,
          targetSchool: currentSchool,
          reflectionText: profileSummary,
          vocationalData: verifiedResult
        }));
        localStorage.setItem('cbas_step4_active_stage', '4A');
        localStorage.setItem('cbas_step4_active_triage', 'PHAN_LUONG_1');
      } catch (e) {
        console.warn('Lỗi ghi LocalStorage:', e);
      }

      // 2. Lưu trực tiếp vào Supabase (metacognitive_matrix)
      try {
        let activeUserId = user?.id;
        if (!activeUserId) {
          const { data: authData } = await supabase.auth.getUser();
          activeUserId = authData?.user?.id;
        }

        if (activeUserId) {
          await supabase.from('metacognitive_matrix').insert([
            {
              student_id: activeUserId,
              target_major: profile?.target_career || verifiedResult.academyName || 'Học nghề thực chiến',
              evidence: profileSummary,
              verified_sources: `Thẩm định ${trainingTypeLabel} & Kiểm toán kinh tế nghề thực chiến`,
              risk_analysis: hasDeficit 
                ? `Cảnh báo thâm hụt tài chính -${deficit.toFixed(1)} triệu VNĐ (Nguy cơ đứt gãy việc học). Cần phương án vừa học vừa làm hoặc giãn tiến độ đóng học phí.` 
                : 'Ngân sách học tập cân đối an toàn trong hạn mức vốn hiện có của gia đình.',
              bias_check: 'Hóa giải ảo tưởng học nghề nhanh giàu, minh bạch bài toán chi phí thợ phụ và thời gian tích lũy tay nghề trước khi mở tiệm.',
              detected_bias: 'DEBIASED_SYSTEM_2',
              final_decision: 'VOCATIONAL_CALIBRATED'
            }
          ]);
        }
      } catch (dbErr) {
        console.warn('Lỗi ghi Supabase Bước 3 (Vocational):', dbErr);
      }

      setIsSuccess(true);
      setIsSubmitting(false);

      // 3. Tự động điều hướng mượt mà sang Bước 4 (Tham vấn 1-1) kèm tóm tắt hồ sơ
      setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete(verifiedResult);
        } else {
          navigate('/student/counseling');
        }
      }, 700);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl max-w-2xl mx-auto shadow-2xl border border-amber-500/30 transition-all">
      {/* Header Phân hệ */}
      <div className="flex items-center space-x-2.5 mb-2">
        <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded uppercase tracking-wide">
          PHÂN HỆ HỌC NGHỀ THỰC CHIẾN
        </span>
        <h2 className="text-xl font-bold text-amber-400">BƯỚC 3: THẨM ĐỊNH NGHỀ & BÀI TOÁN KINH TẾ</h2>
      </div>

      <p className="text-sm text-slate-300 mb-5 leading-relaxed">
        {isFormal 
          ? 'Hệ thống đào tạo nghề chính quy theo chuẩn Bộ LĐ-TB&XH. Học sinh cần đối chiếu điều kiện xét tuyển học bạ/tốt nghiệp THPT, học phí tín chỉ/kỳ và điều kiện thực hành xưởng/doanh nghiệp:'
          : 'Học nghề tư nhân là tự đầu tư kinh doanh. Hệ thống yêu cầu bạn đối chất các thông số chi phí thực tế và điều khoản thỏa thuận trước khi xuống tiền nộp học phí:'}
      </p>

      {/* LỰA CHỌN LOẠI HÌNH ĐÀO TẠO NGHỀ */}
      <div className="mb-6 p-3 bg-slate-800/90 rounded-xl border border-slate-700">
        <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5">
          🎯 Chọn Loại Hình Đào Tạo Nghề:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setData({ ...data, trainingType: 'formal' })}
            className={`flex items-start space-x-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
              isFormal 
                ? 'bg-amber-500/15 border-amber-400 text-amber-200 ring-2 ring-amber-400/40' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            <School className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isFormal ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-bold text-sm text-white">Trường Cao đẳng / Trung cấp chính quy</div>
              <div className="text-xs text-slate-400 mt-0.5">Bằng chính quy Bộ LĐ-TB&XH • Học phí theo kỳ • Xét tốt nghiệp THPT/học bạ</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setData({ ...data, trainingType: 'private' })}
            className={`flex items-start space-x-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
              !isFormal 
                ? 'bg-amber-500/15 border-amber-400 text-amber-200 ring-2 ring-amber-400/40' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            <Scissors className={`w-5 h-5 flex-shrink-0 mt-0.5 ${!isFormal ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-bold text-sm text-white">Cơ sở đào tạo tư nhân / Salon</div>
              <div className="text-xs text-slate-400 mt-0.5">Truyền nghề thực chiến • Học việc tại chỗ • Yêu cầu hợp đồng tay nghề</div>
            </div>
          </button>
        </div>

        {/* Hướng dẫn ngữ cảnh tương ứng */}
        <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-xs text-slate-300 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>
            {isFormal 
              ? 'Lộ trình chính quy: Tập trung vào chứng chỉ nghề quốc gia, liên thông ĐH và hỗ trợ vay vốn HSSV.' 
              : 'Lộ trình tư nhân: Cần chú trọng thời gian ra mẫu thật, minh bạch chi phí mua sắm đồ nghề và thị trường mở tiệm.'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Nhóm 0: Tên cơ sở / Trường */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>
              {isFormal 
                ? 'Tên Trường Cao đẳng / Trung cấp chính quy:' 
                : 'Tên Cơ sở đào tạo tư nhân / Salon / Học viện:'}
            </span>
            <span className="text-amber-400/80 text-[11px] font-normal lowercase">(bắt buộc)</span>
          </label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-amber-400 focus:outline-none transition-colors"
            placeholder={
              isFormal 
                ? "VD: Cao đẳng Nghề Kỹ thuật Công nghệ, Cao đẳng Du lịch Sài Gòn, Trung cấp Kinh tế - Kỹ thuật..." 
                : "VD: Học viện Tóc Barber Academy, Salon Seoul Spa, Trường Dạy Nghề Á Âu..."
            }
            value={data.academyName}
            onChange={(e) => setData({ ...data, academyName: e.target.value })}
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            {isFormal 
              ? '💡 Lưu ý: Đảm bảo trường có mã ngành chính quy được Tổng cục Giáo dục Nghề nghiệp cấp phép.' 
              : '💡 Lưu ý: Kiểm tra giấy phép hoạt động dạy nghề tư nhân và uy tín thực tế của giảng viên.'}
          </p>
        </div>

        {/* Nhóm 1: Bảng tính chi phí & Cảnh báo thâm hụt */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span>
                {isFormal 
                  ? '1. Bảng Tính Tổng Chi Phí Giai Đoạn 1 (Kỳ 1 / Năm 1 Chính Quy)' 
                  : '1. Bảng Tính Tổng Chi Phí Giai Đoạn 1 (6 Tháng Học Việc Tư Nhân)'}
              </span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">Đơn vị: Triệu VNĐ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {isFormal ? 'Học phí chính quy (kỳ 1/năm 1):' : 'Học phí trọn gói khóa học:'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder={isFormal ? "VD: 10" : "VD: 15"}
                value={data.tuitionFee}
                onChange={(e) => setData({ ...data, tuitionFee: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {isFormal ? 'Đồ nghề / bảo hộ / giáo trình:' : 'Mua bộ đồ nghề chuyên nghiệp:'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder={isFormal ? "VD: 3 (đồ nghề xưởng)" : "VD: 5 (kéo, tông đơ...)"}
                value={data.toolkitCost}
                onChange={(e) => setData({ ...data, toolkitCost: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {isFormal ? 'Sinh hoạt 6 tháng (KTX/Trọ):' : 'Sinh hoạt 6 tháng học việc:'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder="VD: 12 (ăn ở, đi lại)"
                value={data.livingCost6Months}
                onChange={(e) => setData({ ...data, livingCost6Months: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-700 flex flex-wrap justify-between items-center text-xs text-slate-300 gap-2">
            <span>Vốn gia đình hiện có dự kiến: <strong className="text-amber-300 font-bold">{userSavings} triệu</strong></span>
            <span>Tổng chi phí GĐ1: <strong className="text-emerald-400 font-bold">{totalPhase1Cost.toFixed(1)} triệu</strong></span>
          </div>

          {/* CẢNH BÁO ĐỎ NỔI BẬT VỀ THÂM HỤT TÀI CHÍNH & NGUY CƠ ĐỨT GÃY VIỆC HỌC */}
          {hasDeficit && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/95 border-2 border-red-500 shadow-2xl text-red-100 animate-fadeIn space-y-3">
              <div className="flex items-center space-x-2 text-red-400 font-extrabold text-sm uppercase tracking-wide">
                <span className="p-1 bg-red-600 text-white rounded-md text-xs font-black">CẢNH BÁO ĐỎ</span>
                <span>NGUY CƠ ĐỨT GÃY VIỆC HỌC DO THÂM HỤT TÀI CHÍNH</span>
              </div>
              
              <div className="bg-red-900/50 p-3 rounded-lg border border-red-500/50">
                <div className="flex justify-between items-center text-sm font-bold text-white mb-1">
                  <span>Mức thâm hụt tài chính giai đoạn 1:</span>
                  <span className="text-red-300 font-black text-base">-{deficit.toFixed(1)} Triệu VNĐ</span>
                </div>
                <p className="text-xs text-red-200 leading-relaxed">
                  Tổng chi phí GĐ1 (<strong className="text-white">{totalPhase1Cost.toFixed(1)} triệu</strong>) đã vượt quá số vốn hiện có của gia đình (<strong className="text-amber-300">{userSavings} triệu</strong>). 
                  Số tiền thiếu hụt là <strong className="text-red-300 font-bold">-{deficit.toFixed(1)} triệu đồng</strong>.
                </p>
              </div>

              <div className="text-xs text-red-200 space-y-2 leading-relaxed">
                <div className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold text-sm">⚠️</span>
                  <p>
                    <strong className="text-white">Nguy cơ đứt gãy việc học:</strong> Bạn có nguy cơ rất cao phải <strong>bỏ dở việc học giữa chừng</strong> (khi mới theo học 2-3 tháng) do cạn kiệt kinh phí sinh hoạt và không đủ tiền trang trải vật tư, dụng cụ thực hành phát sinh.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold text-sm">💡</span>
                  <div>
                    <strong className="text-white">Phương án thích ứng bắt buộc trước khi nộp tiền:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-red-200">
                      <li>Đàm phán chia nhỏ học phí nộp thành từng tháng hoặc từng đợt thay vì nộp cả cục.</li>
                      <li>Lên kế hoạch vừa học vừa làm thêm ca phụ ngoài giờ (cần bù đắp tối thiểu {Math.ceil(deficit / 6)} triệu/tháng).</li>
                      {isFormal && (
                        <li>Tìm hiểu chính sách miễn giảm học phí và gói vay vốn sinh viên chính sách của Ngân hàng CSXH.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái an toàn vốn */}
          {!hasDeficit && totalPhase1Cost > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center justify-between">
              <span>✅ Vốn hiện có ({userSavings} tr) đáp ứng đủ chi phí GĐ1 ({totalPhase1Cost.toFixed(1)} tr).</span>
              <span className="font-bold text-emerald-400">Dư phòng ngừa rủi ro: +{Math.abs(deficit).toFixed(1)} tr</span>
            </div>
          )}
        </div>

        {/* Nhóm 2: Điều khoản cam kết & Thực hành */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider flex items-center space-x-1.5">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            <span>
              {isFormal 
                ? '2. Chuẩn Đầu Ra & Điều Kiện Thực Hành Xưởng / Doanh Nghiệp' 
                : '2. Cam Kết Tay Nghề Của Cơ Sở Đào Tạo Tư Nhân'}
            </span>
          </h3>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">
              {isFormal 
                ? 'Thời gian bắt đầu được thực hành xưởng / thực tập doanh nghiệp (sau bao nhiêu tuần)?' 
                : 'Sau bao nhiêu tuần học viên được tự tay thực hành trên mẫu người thật?'}
            </label>
            <input
              type="number"
              min="1"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
              placeholder={isFormal ? "VD: 4 (tuần) hoặc 1 (học kỳ)" : "VD: 4 (nếu quá 8 tuần là bất thường)"}
              value={data.weeksUntilRealHaircut}
              onChange={(e) => setData({ ...data, weeksUntilRealHaircut: e.target.value })}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-start space-x-2.5 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasWrittenContract}
                onChange={(e) => setData({ ...data, hasWrittenContract: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-400"
              />
              <span className="font-semibold text-amber-300 text-xs sm:text-sm">
                {isFormal 
                  ? 'Có Giấy báo trúng tuyển / Hợp đồng đào tạo & Cam kết chuẩn đầu ra văn bằng chính quy bằng VĂN BẢN' 
                  : 'Có Hợp đồng đào tạo nghề bằng VĂN BẢN (Tuyệt đối không thỏa thuận miệng)'}
              </span>
            </label>

            <label className="flex items-start space-x-2.5 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={data.freeRetrainingIfFailed}
                onChange={(e) => setData({ ...data, freeRetrainingIfFailed: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs sm:text-sm">
                {isFormal 
                  ? 'Trường có mạng lưới doanh nghiệp đối tác cam kết tiếp nhận thực tập và hỗ trợ việc làm sau tốt nghiệp' 
                  : 'Cơ sở cam kết bổ túc / đào tạo lại miễn phí nếu hết 6 tháng chưa đạt chuẩn tay nghề cứng'}
              </span>
            </label>
          </div>
        </div>

        {/* Nhóm 3: Khảo sát thị trường khởi nghiệp & Lộ trình việc làm */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>
              {isFormal 
                ? '3. Khảo Sát Thị Trường Lao Động & Lộ Trình Phát Triển Sau Tốt Nghiệp' 
                : '3. Khảo Sát Thị Trường Lao Động & Bài Toán Mở Tiệm Riêng'}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Mức lương dự kiến khi làm thợ phụ / nhân viên khởi điểm (Triệu VNĐ/tháng):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder={isFormal ? "VD: 6 (thực tế: 5 - 7 tr)" : "VD: 5 (thực tế: 4 - 6 tr)"}
                value={data.startingSalary}
                onChange={(e) => setData({ ...data, startingSalary: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Thời gian tích lũy kinh nghiệm dự kiến trước khi mở tiệm riêng / lên thợ chính:
              </label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder="VD: 2 - 3 năm (tối thiểu 2 năm)"
                value={data.experienceYearsBeforeOpening}
                onChange={(e) => setData({ ...data, experienceYearsBeforeOpening: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">
              {isFormal 
                ? 'Dự toán tổng số vốn để mở cơ sở / xưởng dịch vụ riêng sau này (Triệu VNĐ):' 
                : 'Dự toán tổng số vốn để mở tiệm riêng sau này (Triệu VNĐ):'}
            </label>
            <input
              type="number"
              step="1"
              min="0"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
              placeholder="Cọc nhà + decor + máy móc (Thực tế tối thiểu: 60 - 80 tr)"
              value={data.startupBudgetEstimate}
              onChange={(e) => setData({ ...data, startupBudgetEstimate: e.target.value })}
            />
          </div>

          <label className="flex items-start space-x-2.5 text-sm text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={data.hasSurveyedCompetitors}
              onChange={(e) => setData({ ...data, hasSurveyedCompetitors: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-400"
            />
            <span className="text-xs sm:text-sm">
              {isFormal 
                ? 'Tôi đã khảo sát nhu cầu tuyển dụng thực tế của doanh nghiệp và mật độ đối thủ cùng nghề trong khu vực' 
                : 'Tôi đã trực tiếp đếm số lượng tiệm cùng nghề trong bán kính 2km tại khu vực dự định làm việc / mở tiệm'}
            </span>
          </label>
        </div>

        {/* Khối Cảnh Báo Lỗi / Rủi Ro Xác Thực */}
        {warnings.length > 0 && (
          <div className="bg-red-950/90 border border-red-500 p-4 rounded-xl space-y-2 text-xs text-red-200 animate-fadeIn shadow-lg">
            <p className="font-bold text-red-400 text-sm flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>DỮ LIỆU ĐANG CẢNH BÁO RỦI RO LỚN CẦN HIỆU CHỈNH:</span>
            </p>
            {warnings.map((w, idx) => (
              <p key={idx} className="leading-relaxed pl-2 border-l-2 border-red-500/60">{w}</p>
            ))}
          </div>
        )}

        {/* Thông báo thành công */}
        {isSuccess && (
          <div className="bg-emerald-950/90 border border-emerald-500 p-4 rounded-xl text-xs text-emerald-200 flex items-center space-x-2 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              ✅ ĐÃ ĐỐI CHẤT THÀNH CÔNG: Toàn bộ điều kiện pháp lý, bài toán kinh tế và rủi ro cạnh tranh đã được thẩm định minh bạch! Đang chuyển sang Bước 4 (Tham vấn 1-1)...
            </span>
          </div>
        )}

        {/* Nút hành động */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleVerify}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-lg uppercase tracking-wider mt-2 cursor-pointer active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isSubmitting ? 'ĐANG LƯU DỮ LIỆU & ĐIỀU HƯỚNG...' : 'XÁC THỰC RỦI RO & HOÀN THIỆN HỒ SƠ NGHỀ'}</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
}
