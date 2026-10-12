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
