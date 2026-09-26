import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Step3VocationalVerification({ profile, onComplete }) {
  const navigate = useNavigate();

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

  const [data, setData] = useState({
    academyName: '', // Tên salon/cơ sở đào tạo tư nhân
    tuitionFee: '', // Học phí (triệu VNĐ)
    toolkitCost: '', // Chi phí mua bộ đồ nghề chuyên nghiệp (triệu VNĐ)
    livingCost6Months: '', // Chi phí ăn ở, đi lại trong 6 tháng học việc
    weeksUntilRealHaircut: '', // Sau bao nhiêu tuần thì được cắt trên người thật?
    hasWrittenContract: false, // Có hợp đồng cam kết tay nghề bằng văn bản không?
    freeRetrainingIfFailed: false, // Có cam kết đào tạo lại miễn phí nếu chưa cứng nghề không?
    startupBudgetEstimate: '', // Dự toán vốn mở tiệm riêng sau này (triệu VNĐ)
    hasSurveyedCompetitors: false, // Đã đếm số lượng tiệm cạnh tranh trong bán kính 2km chưa?
  });

  const [warnings, setWarnings] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerify = () => {
    let currentWarnings = [];
    const userSavings = initialBudget; // Vốn hiện có của gia đình (triệu)

    // Kiểm tra điền thiếu thông tin cơ bản
    if (!data.academyName.trim() || !data.tuitionFee || !data.toolkitCost || !data.livingCost6Months || !data.weeksUntilRealHaircut || !data.startupBudgetEstimate) {
      currentWarnings.push(
        '⚠️ Vui lòng nhập đầy đủ các thông số: Tên cơ sở, Học phí, Chi phí đồ nghề, Sinh hoạt 6 tháng, Thời gian thực hành mẫu thật và Dự toán mở tiệm!'
      );
    }

    // 1. Kiểm toán chi phí đào tạo giai đoạn 1
    const totalPhase1Cost = parseFloat(data.tuitionFee || 0) + 
                            parseFloat(data.toolkitCost || 0) + 
                            parseFloat(data.livingCost6Months || 0);

    if (totalPhase1Cost > userSavings) {
      currentWarnings.push(
        `⚠️ CẢNH BÁO THÂM HỤT VỐN HỌC NGHỀ: Tổng chi phí học nghề giai đoạn 1 (Học phí + Đồ nghề + Ăn ở) là ${totalPhase1Cost.toFixed(1)} triệu, vượt quá số tiền gia đình hiện có (${userSavings} triệu). Bạn cần lên phương án làm thêm ca tối hoặc đàm phán trả góp học phí!`
      );
    }

    // 2. Kiểm tra tính pháp lý của thỏa thuận học việc
    if (!data.hasWrittenContract) {
      currentWarnings.push(
        `🚨 BÁO ĐỘNG RỦI RO HỢP ĐỒNG: Thỏa thuận miệng tiềm ẩn nguy cơ bị chủ cơ sở bóc lột sức lao động (chỉ cho gội đầu, quét nhà, vặt vãnh) mà không được truyền nghề lõi. BẮT BUỘC phải yêu cầu Hợp đồng đào tạo bằng văn bản!`
      );
    }

    // 3. Kiểm tra tiến độ thực hành lâm sàng nghề
    if (parseInt(data.weeksUntilRealHaircut || 0) > 8) {
      currentWarnings.push(
        `⚠️ CẢNH BÁO TIẾN ĐỘ THỰC HÀNH: Thời gian chờ để được thực hành trên mẫu thật quá muộn (> 8 tuần). Cơ sở có dấu hiệu kéo dài thời gian để tận dụng nhân công phụ việc!`
      );
    }

    // 4. Kiểm tra ảo tưởng vốn mở tiệm
    const startupBudget = parseFloat(data.startupBudgetEstimate || 0);
    if (startupBudget > 0 && startupBudget < 50.0) {
      currentWarnings.push(
        `⚠️ CẢNH BÁO TÍNH KHẢ THI KHỞI NGHIỆP: Dự toán mở tiệm ${startupBudget} triệu là phi thực tế. Chi phí tối thiểu cho mặt bằng, ghế cắt/dụng cụ, gương đèn, máy móc và pháp lý tại địa phương dao động từ 60 - 80 triệu đồng.`
      );
    }

    // 5. Kiểm tra khảo sát đối thủ cạnh tranh
    if (!data.hasSurveyedCompetitors) {
      currentWarnings.push(
        '⚠️ CẢNH BÁO THIẾU DỮ LIỆU ĐỊA BÀN: Bạn chưa khảo sát mật độ tiệm cạnh tranh trong bán kính 2km. Bắt buộc phải quan sát thực tế trước khi đầu tư vốn mở tiệm!'
      );
    }

    setWarnings(currentWarnings);

    // Điều kiện thông qua: Phải giải quyết hết rủi ro cốt lõi và có cam kết văn bản
    if (
      currentWarnings.length === 0 && 
      data.hasWrittenContract && 
      data.hasSurveyedCompetitors &&
      data.academyName.trim()
    ) {
      setIsSuccess(true);
      const verifiedResult = {
        ...data,
        totalPhase1Cost,
        userSavings,
        verified: true,
        status: 'VOCATIONAL_CALIBRATED',
        timestamp: new Date().toISOString()
      };

      if (onComplete) {
        onComplete(verifiedResult);
      } else {
        // Lưu dự phòng vào localStorage
        localStorage.setItem("cbas_step3_vocational", JSON.stringify(verifiedResult));
        alert("🎉 Đã hoàn thành thẩm định nghề thực chiến! Đang chuyển sang Bước 4.");
        navigate('/student/booking');
      }
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl max-w-2xl mx-auto shadow-2xl border border-amber-500/30">
      <div className="flex items-center space-x-2 mb-2">
        <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded uppercase">
          PHÂN HỆ HỌC NGHỀ THỰC CHIẾN
        </span>
        <h2 className="text-xl font-bold text-amber-400">BƯỚC 3: THẨM ĐỊNH NGHỀ & BÀI TOÁN KINH TẾ</h2>
      </div>
      <p className="text-sm text-slate-300 mb-6">
        Học nghề tư nhân là tự đầu tư kinh doanh. Hệ thống yêu cầu bạn đối chất các thông số chi phí thực tế và điều khoản thỏa thuận trước khi xuống tiền nộp học phí:
      </p>

      <div className="space-y-4">
        {/* Nhóm 0: Tên cơ sở / Salon / Học viện */}
        <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
          <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            Tên Cơ sở đào tạo / Salon / Học viện tư nhân:
          </label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
            placeholder="VD: Học viện Tóc Barber Academy, Salon Seoul Spa, Trường Dạy Nghề Á Âu..."
            value={data.academyName}
            onChange={(e) => setData({ ...data, academyName: e.target.value })}
          />
        </div>

        {/* Nhóm 1: Minh bạch chi phí */}
        <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
            1. Bảng Tính Tổng Chi Phí Giai Đoạn 1 (6 Tháng Học Việc)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Học phí trọn gói (Triệu):</label>
              <input
                type="number"
                step="0.5"
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder="VD: 15"
                value={data.tuitionFee}
                onChange={(e) => setData({ ...data, tuitionFee: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mua bộ đồ nghề (Triệu):</label>
              <input
                type="number"
                step="0.5"
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder="VD: 5 (kéo, máy móc...)"
                value={data.toolkitCost}
                onChange={(e) => setData({ ...data, toolkitCost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sinh hoạt 6 tháng (Triệu):</label>
              <input
                type="number"
                step="0.5"
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
                placeholder="VD: 12 (ăn ở, xăng xe)"
                value={data.livingCost6Months}
                onChange={(e) => setData({ ...data, livingCost6Months: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between items-center">
            <span>Vốn gia đình hiện có dự kiến: <strong className="text-amber-300">{initialBudget} triệu</strong></span>
            <span>Tổng chi phí GĐ1: <strong className="text-emerald-400">{(parseFloat(data.tuitionFee || 0) + parseFloat(data.toolkitCost || 0) + parseFloat(data.livingCost6Months || 0)).toFixed(1)} triệu</strong></span>
          </div>
        </div>

        {/* Nhóm 2: Điều khoản cam kết */}
        <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
            2. Cam Kết Tay Nghề Của Cơ Sở Đào Tạo Tư Nhân
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">
              Sau bao nhiêu tuần học viên được tự tay thực hành trên mẫu người thật?
            </label>
            <input
              type="number"
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
              placeholder="VD: 4 (nếu quá 8 tuần là bất thường)"
              value={data.weeksUntilRealHaircut}
              onChange={(e) => setData({ ...data, weeksUntilRealHaircut: e.target.value })}
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasWrittenContract}
                onChange={(e) => setData({ ...data, hasWrittenContract: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-400"
              />
              <span className="font-semibold text-amber-300">
                Có Hợp đồng đào tạo nghề bằng VĂN BẢN (Không thỏa thuận miệng)
              </span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={data.freeRetrainingIfFailed}
                onChange={(e) => setData({ ...data, freeRetrainingIfFailed: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-400"
              />
              <span>Cơ sở cam kết bổ túc tay nghề miễn phí nếu hết 6 tháng chưa đạt chuẩn</span>
            </label>
          </div>
        </div>

        {/* Nhóm 3: Bài toán mở tiệm */}
        <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
            3. Khảo Sát Thị Trường Khởi Nghiệp Tương Lai
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">
              Dự toán tổng số vốn để mở tiệm riêng sau này (Triệu VNĐ):
            </label>
            <input
              type="number"
              step="1"
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-amber-400 focus:outline-none"
              placeholder="Cọc nhà + decor + máy móc (Thực tế: 60 - 80 tr)"
              value={data.startupBudgetEstimate}
              onChange={(e) => setData({ ...data, startupBudgetEstimate: e.target.value })}
            />
          </div>

          <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={data.hasSurveyedCompetitors}
              onChange={(e) => setData({ ...data, hasSurveyedCompetitors: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-amber-500 focus:ring-amber-400"
            />
            <span>Tôi đã đếm số lượng tiệm cùng nghề trong bán kính 2km tại khu vực dự định mở tiệm</span>
          </label>
        </div>

        {/* Cảnh báo bất hòa nhận thức */}
        {warnings.length > 0 && (
          <div className="bg-red-950/90 border border-red-500 p-4 rounded-lg space-y-2 text-xs text-red-200 animate-fadeIn">
            <p className="font-bold text-red-400 text-sm">🚨 DỮ LIỆU ĐANG CẢNH BÁO RỦI RO LỚN:</p>
            {warnings.map((w, idx) => (
              <p key={idx} className="leading-relaxed">{w}</p>
            ))}
          </div>
        )}

        {isSuccess && (
          <div className="bg-emerald-950/90 border border-emerald-500 p-4 rounded-lg text-xs text-emerald-200">
            ✅ ĐÃ ĐỐI CHẤT THÀNH CÔNG: Toàn bộ điều kiện pháp lý, bài toán kinh tế và rủi ro cạnh tranh đã được thẩm định minh bạch!
          </div>
        )}

        <button
          type="button"
          onClick={handleVerify}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all shadow-lg uppercase tracking-wide mt-2 cursor-pointer active:scale-[0.99]"
        >
          XÁC THỰC RỦI RO & HOÀN THIỆN HỒ SƠ NGHỀ
        </button>
      </div>
    </div>
  );
}
