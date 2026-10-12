// DỮ LIỆU CAM KẾT CHUẨN HÓA 2 TRỤ CỘT: HỌC VẤN TỔ HỢP & HỆ THỐNG KỸ NĂNG NGHỀ
export const ADAPTIVE_COMMITMENTS_BY_GRADE = {
  10: {
    badge: "Phân hóa: Khối 10 THPT (Định vị Tổ hợp & Kỹ năng Nền tảng)",
    note: "Giai đoạn định hình phương pháp học và xác lập tổ hợp môn tự chọn",
    items: [
      {
        num: "1. Trọng tâm Học vấn & Tổ hợp:",
        text: "Định vị chính xác nhóm môn trọng tâm trong tổ hợp tự chọn (Toán / KHTN / KHXH); thiết lập kế hoạch học tập cố định mỗi tối để lấp lỗ hổng kiến thức nền tảng của môn còn yếu, bảo đảm phong độ học tập ổn định."
      },
      {
        num: "2. Kế hoạch Rèn luyện Kỹ năng nghề:",
        text: "Xác lập lộ trình rèn luyện hệ thống kỹ năng bổ trợ phù hợp với nhóm ngành mục tiêu: trau dồi năng lực ngoại ngữ nền tảng, kỹ năng ứng dụng công nghệ số và rèn luyện kỹ năng giao tiếp, làm việc nhóm."
      },
      {
        num: "3. Vật neo Kỷ luật góc học tập:",
        text: "Cất điện thoại ngoài tầm với trong suốt khung giờ tự học; dán bản cam kết này trước bàn học để duy trì sự kiên định với tổ hợp môn đã chọn và rèn luyện tính tự giác của học sinh cấp THPT."
      }
    ]
  },
  11: {
    badge: "Phân hóa: Khối 11 THPT (Bứt phá Học bạ & Kỹ năng Chuyên ngành)",
    note: "Giai đoạn then chốt cải thiện điểm học bạ và tích lũy kỹ năng thực tế",
    items: [
      {
        num: "1. Trọng tâm Học vấn & Điểm bạ:",
        text: "Rà soát điểm kiểm tra thường xuyên của 3 môn tổ hợp chính; đặt mục tiêu tăng từ <strong>0.5 đến 1.0 điểm học bạ</strong> trong các kỳ kiểm tra định kỳ để tiệm cận điểm chuẩn thực tế của ngành mục tiêu."
      },
      {
        num: "2. Kế hoạch Rèn luyện Kỹ năng nghề:",
        text: "Chủ động trang bị hệ thống kỹ năng thực chất mà ngành nghề/trường đào tạo yêu cầu: trau dồi ngoại ngữ chuyên ngành, nâng cao năng lực công nghệ/xử lý dữ liệu và rèn luyện tư duy xử lý tình huống thực tế."
      },
      {
        num: "3. Vật neo Kỷ luật góc học tập:",
        text: "Duy trì kỷ luật bàn học không xao nhãng; dán bản cam kết trước góc học tập để định kỳ mỗi tháng tự đối soát kết quả học tập với ngưỡng điểm an toàn tại các trường đào tạo mục tiêu."
      }
    ]
  },
  12: {
    badge: "Phân hóa: Khối 12 THPT (Tối ưu Điểm thi Tuyển sinh & Thích ứng Nghề)",
    note: "Giai đoạn nước rút ôn luyện thi tốt nghiệp và chuẩn hóa hồ sơ",
    items: [
      {
        num: "1. Trọng tâm Ôn luyện Tuyển sinh:",
        text: "Tập trung tối đa thời lượng cho 3 môn tổ hợp xét tuyển; duy trì kỷ luật bấm giờ giải đề thi chuẩn định kỳ hàng tuần nhằm hoàn thiện kỹ năng phòng thi và khắc phục triệt để các dạng bài rào cản."
      },
      {
        num: "2. Kế hoạch Rèn luyện Kỹ năng thích ứng:",
        text: "Trang bị các kỹ năng cốt lõi phục vụ giai đoạn chuyển tiếp: phương pháp tự học độc lập ở bậc đào tạo chuyên nghiệp, kỹ năng quản lý áp lực và tư duy phản biện giải quyết vấn đề."
      },
      {
        num: "3. Vật neo Giữ vững Chiến lược:",
        text: "Dán bản cam kết trước bàn học và thống nhất kế hoạch cùng gia đình; giữ vững chiến lược Tam giác nguyện vọng 3 nấc (Ước mơ – Vừa sức – An toàn), không thay đổi thứ tự theo cảm xúc đám đông."
      }
    ]
  }
};

/**
 * Trợ cấp lấy dữ liệu cam kết theo khối lớp (10, 11, 12)
 * @param {string|number} grade - Giá trị khối lớp (10, 11, 12, 'Khối 10', 'Grade 11', etc.)
 * @returns {object} Thông tin cam kết gồm badge, note, items
 */
export const getGradeCommitmentPlan = (grade) => {
  if (!grade) return ADAPTIVE_COMMITMENTS_BY_GRADE[12];
  const num = typeof grade === 'number' 
    ? grade 
    : parseInt(String(grade).replace(/\D/g, ''), 10);
  return ADAPTIVE_COMMITMENTS_BY_GRADE[num] || ADAPTIVE_COMMITMENTS_BY_GRADE[12];
};

// CẬP NHẬT CHUẨN HÓA DỮ LIỆU CÁC CA TRÊN MÀN HÌNH (KHỐI 12 - THỰC ĐỊA KHÁNH HÒA)
export const UPDATED_STUDENTS_DISPLAY = [
  // CT_21: Học sinh Giỏi thi CNTT (Khớp ĐH Nha Trang)
  {
    id: "CT_21",
    grade: "Khối 12",
    rank: "Giỏi",
    riasec: "IRE",
    target_t0: "Công nghệ Thông tin (ĐH CNTT TP.HCM - 27.5đ)",
    delta: "-2.5đ",
    risk_level: "Nguy cơ",
    triage: "In-depth (20p)",
    target_t2: "Công nghệ Thông tin (ĐH Nha Trang - 22.0đ)",
    crs_display: "+3.8 → -0.5",
    gate: "Đã Mở (PDF)"
  },
  // CT_22: Đổi Kỹ thuật Ô tô về ĐH Nha Trang (thay vì Thiết kế thời trang xa lạ)
  {
    id: "CT_22",
    grade: "Khối 12",
    rank: "Khá",
    riasec: "RIE",
    target_t0: "Kỹ thuật Ô tô (Bách Khoa TP.HCM - 26.5đ)",
    delta: "-2.1đ",
    risk_level: "Nguy cơ",
    triage: "In-depth (20p)",
    target_t2: "Kỹ thuật Kỹ thuật Ô tô (ĐH Nha Trang - 21.0đ)",
    crs_display: "+2.7 → -0.3",
    gate: "Đã Mở (PDF)"
  },
  // CT_23: Điều dưỡng ĐH Y Dược chuyển nấc sang CĐ Y tế Khánh Hòa
  {
    id: "CT_23",
    grade: "Khối 12",
    rank: "Khá",
    riasec: "SCI",
    target_t0: "Điều dưỡng Đa khoa (ĐH Y Dược TP.HCM)",
    delta: "+1.8đ",
    risk_level: "An toàn",
    triage: "Fast-track (5p)",
    target_t2: "Điều dưỡng (ĐH Y Dược / CĐ Y tế Khánh Hòa)",
    crs_display: "+0.6 → -0.1",
    gate: "Đã Mở (PDF)"
  },
  // CT_24: Quản trị Khách sạn (Trọng điểm Khánh Hòa)
  {
    id: "CT_24",
    grade: "Khối 12",
    rank: "Giỏi",
    riasec: "ESI",
    target_t0: "Quản trị Khách sạn & Du lịch (Kinh Tế TP.HCM)",
    delta: "+0.6đ",
    risk_level: "An toàn",
    triage: "Fast-track (5p)",
    target_t2: "Quản trị Du lịch & Khách sạn (ĐH Nha Trang)",
    crs_display: "+1.2 → -0.2",
    gate: "Đã Mở (PDF)"
  },
  // CT_25: ĐÃ SỬA HỌC LỰC GIỎI, ĐỔI TỪ HÀNG KHÔNG VŨ TRỤ SANG KỸ THUẬT CƠ ĐIỆN TỬ ĐH NHA TRANG
  {
    id: "CT_25",
    grade: "Khối 12",
    rank: "Giỏi",
    riasec: "IRC",
    target_t0: "Kỹ thuật Cơ điện tử (Bách Khoa TP.HCM - 26.0đ)",
    delta: "-2.4đ",
    risk_level: "Nguy cơ",
    triage: "In-depth (20p)",
    target_t2: "Kỹ thuật Điện - Điện tử (ĐH Nha Trang - 21.5đ)",
    crs_display: "+3.2 → -0.3", // Đã sửa về âm nhẹ chuẩn hội tụ
    gate: "Đã Mở (PDF)"
  },
  // CT_26: ĐÃ SỬA HỌC LỰC TỪ 'XUẤT SẮC' THÀNH 'GIỎI' ĐỂ KHỚP BÁO CÁO N=90
  {
    id: "CT_26",
    grade: "Khối 12",
    rank: "Giỏi", // SỬA: Bỏ "Xuất sắc", dùng chuẩn "Giỏi"
    riasec: "SAR",
    target_t0: "Sư phạm Toán học (ĐH Sư phạm TP.HCM)",
    delta: "+1.1đ",
    risk_level: "An toàn",
    triage: "Fast-track (5p)",
    target_t2: "Sư phạm Toán học (ĐH Sư phạm / CĐSP)",
    crs_display: "+0.7 → -0.1",
    gate: "Đã Mở (PDF)"
  }
];

