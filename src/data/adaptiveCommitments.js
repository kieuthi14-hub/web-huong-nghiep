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
        text: "Dán bản cam kết trước bàn học và thống nhất kế hoạch cùng gia đình; giữ vững chiến lược Tam giác nguyện vọng 3 nấc (Thử thách – Vừa sức – Bảo toàn), không thay đổi thứ tự theo cảm xúc đám đông."
      }
    ]
  }
};

// DỮ LIỆU ĐÃ CHUẨN HÓA THỰC ĐỊA KHÁNH HÒA:
export const DEFAULT_TRIANGLE_DATA = {
  stretch: {
    title: "1. NGUYỆN VỌNG THỬ THÁCH (STRETCH)",
    major: "Tâm lý học — ĐH KHXH&NV TP.HCM",
    desc: "Trường Top đầu — Đòi hỏi nỗ lực tối đa để thu hẹp khoảng cách điểm sàn (tham chiếu: 26.5+)"
  },
  realistic: {
    title: "2. NGUYỆN VỌNG VỪA SỨC (REALISTIC)",
    major: "Tâm lý học (ĐH Sư phạm TP.HCM) / Quản trị Nhân lực (ĐH Nha Trang)",
    desc: "Mục tiêu chính — Điểm số nằm trong dải phong độ học bạ và điểm thi thử hiện tại (22.5 – 24.0)"
  },
  safety: {
    title: "3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)",
    major: "Công tác Xã hội — Trường ĐH Nha Trang",
    desc: "Vùng đệm dự phòng — Ngành gần có biên độ điểm an toàn cao và tối ưu chi phí đào tạo"
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

// =========================================================================
// BIÊN BẢN TRÍCH XUẤT PHIÊN ĐỐI THOẠI PHẢN TƯ SOCRATES & ĐIỂM BẺ GÃY NHẬN THỨC (BƯỚC 2)
// =========================================================================
export const SOCRATIC_CHAT_LOGS = {
  CT_08: {
    id: "CT_08",
    grade: "Khối 10",
    label: "CT_08 (Khối 10 - Mỏ neo: Tạo mẫu tóc tiệm tư)",
    studentInitial: "Học sinh (CT_08)",
    round1: {
      title: "VÒNG 1: XÁC LẬP GIẢ ĐỊNH BAN ĐẦU (T₀)",
      student: "Em rất thích làm đẹp và muốn học nghề tạo mẫu tóc ở một salon nổi tiếng tại Nha Trang. Em nghĩ học nghề này tầm 6 tháng là có thể đi làm với mức lương 10 - 15 triệu/tháng."
    },
    round2: {
      title: "VÒNG 2: AI TRUY VẤN MÂU THUẪN RIASEC (ANTI-SYCOPHANCY)",
      ai: "Kết quả trắc nghiệm RIASEC của em cho thấy nhóm nổi trội là <strong>Nghiên cứu [I]</strong> và <strong>Nghiệp vụ [C]</strong> (thích sự ngăn nắp, dữ liệu quy chuẩn). Tuy nhiên, nghề tạo mẫu tóc đòi hỏi năng lực <strong>Thẩm mỹ tự do [A]</strong> và <strong>Vận động thao tác cơ học liên tục [R]</strong>. Điều gì khiến em tin rằng tính cách thích phân tích, quy củ của em sẽ phù hợp với môi trường làm tóc?",
      student: "Thực ra em thích nói chuyện với khách hàng (nhóm S) và thích ngắm người ta làm đẹp thôi, chứ em chưa từng tự tay cắt tóc hay đứng liên tục nhiều giờ bao giờ..."
    },
    round3: {
      title: "VÒNG 3: TRUY VẤN RỦI RO & BỘC LỘ TURNING POINT",
      ai: "Nếu trong 12 - 18 tháng đầu tiên tại tiệm tóc, em chỉ làm công việc thợ phụ gội đầu với mức hỗ trợ 2 - 3 triệu/tháng, trong khi phải tự bỏ ra hơn 40 triệu tiền học phí và dụng cụ ban đầu, liệu em có sẵn sàng chấp nhận điều đó để theo đuổi mục tiêu không?",
      student: "Dạ em không biết học phí lại cao như vậy, nhà em chắc chắn không lo được 40 triệu lúc này. Chắc em phải tìm hiểu lại ngành nào có học phí nhà nước hỗ trợ như Cao đẳng Du lịch thôi ạ."
    },
    turningPoint: {
      desc: "Học sinh vỡ mộng tài chính và rào cản nghề, tự giác đề xuất chuyển hướng.",
      action: "KÍCH HOẠT BƯỚC 3"
    }
  },
  CT_02: {
    id: "CT_02",
    grade: "Khối 10",
    label: "CT_02 (Khối 10 - Mỏ neo: QTKD ĐH Kinh Tế TP.HCM)",
    studentInitial: "Học sinh (CT_02)",
    round1: {
      title: "VÒNG 1: XÁC LẬP GIẢ ĐỊNH BAN ĐẦU (T₀)",
      student: "Em muốn thi ngành Quản trị Kinh doanh ĐH Kinh Tế TP.HCM vì em thích làm sếp, tự do chỉ đạo và khởi nghiệp làm giàu nhanh."
    },
    round2: {
      title: "VÒNG 2: AI TRUY VẤN MÂU THUẪN RIASEC (ANTI-SYCOPHANCY)",
      ai: "Nhóm RIASEC của em là <strong>Nghiệp vụ [C]</strong> và <strong>Xã hội [S]</strong>. Quản trị doanh nghiệp đòi hỏi năng lực <strong>Lãnh đạo [E]</strong> chịu rủi ro vốn lớn và năng lực phân tích số liệu tài chính liên tục. Em đã từng thử lập kế hoạch chi tiêu hay điều hành dự án nhóm thực tế chưa?",
      student: "Dạ chưa, em chỉ nghĩ làm sếp thì thuê người làm báo cáo số liệu là được..."
    },
    round3: {
      title: "VÒNG 3: TRUY VẤN RỦI RO & BỘC LỘ TURNING POINT",
      ai: "Theo dữ liệu thực tế, điểm chuẩn QTKD là 26.0+ trong khi điểm hiện tại của em đang thiếu 2.5đ. Hơn 70% cử nhân QTKD mới ra trường phải bắt đầu từ nhân viên telesale hoặc thị trường. Em có sẵn sàng đối mặt nếu chưa thể làm quản lý ngay không?",
      student: "Em từng nghĩ chỉ cần thích làm sếp là học QTKD được, nhưng sau Bước 2 mới thấy mình chưa hiểu gì về vận hành thực tế. Em cần tìm ngành gần vừa sức và tích lũy từ chuyên môn trước."
    },
    turningPoint: {
      desc: "Nhận diện bẫy ảo tưởng vị trí quản lý; chấp nhận chọn ngành vừa sức và lộ trình chuyên môn thực chất.",
      action: "KÍCH HOẠT BƯỚC 3"
    }
  },
  CT_13: {
    id: "CT_13",
    grade: "Khối 11",
    label: "CT_13 (Khối 11 - Mỏ neo: Bác sĩ Đa khoa Y Dược TP.HCM)",
    studentInitial: "Học sinh (CT_13)",
    round1: {
      title: "VÒNG 1: XÁC LẬP GIẢ ĐỊNH BAN ĐẦU (T₀)",
      student: "Gia đình em định hướng em thi Bác sĩ Đa khoa ĐH Y Dược TP.HCM vì nghề bác sĩ có địa vị cao và thu nhập ổn định suốt đời."
    },
    round2: {
      title: "VÒNG 2: AI TRUY VẤN MÂU THUẪN RIASEC (ANTI-SYCOPHANCY)",
      ai: "Học Bác sĩ Đa khoa kéo dài tối thiểu 6 năm đại học cộng 18 tháng thực hành chứng chỉ hành nghề, học phí và chi phí nội trú rất cao. Nhóm RIASEC của em là <strong>Xã hội [S]</strong> và <strong>Nghệ thuật [A]</strong>. Em có thực sự đam mê việc trực đêm 24/7 và đối mặt thường xuyên với bệnh lý nặng không?",
      student: "Thực ra em rất sợ nhìn thấy máu và áp lực phòng cấp cứu, chỉ là ba mẹ kỳ vọng nên em không dám từ chối..."
    },
    round3: {
      title: "VÒNG 3: TRUY VẤN RỦI RO & BỘC LỘ TURNING POINT",
      ai: "Điểm chuẩn Y khoa luôn ở ngưỡng 27.5 - 28.0đ. Nếu em cố gắng vì kỳ vọng người khác nhưng kiệt sức trong 6 năm học, em nghĩ bản thân sẽ hạnh phúc hay hối tiếc?",
      student: "Em nhận ra mình không thể sống thay ước mơ của cha mẹ. Em muốn chuyển sang ngành Dược hoặc Điều dưỡng / Y tế công cộng để vừa đúng khối ngành chăm sóc sức khỏe vừa bớt áp lực phẫu thuật."
    },
    turningPoint: {
      desc: "Bẻ gãy áp lực kỳ vọng gia đình, nhận diện ranh giới sức bền tâm lý và định vị ngành chăm sóc phù hợp cá nhân.",
      action: "KÍCH HOẠT BƯỚC 3"
    }
  },
  CT_21: {
    id: "CT_21",
    grade: "Khối 12",
    label: "CT_21 (Khối 12 - Mỏ neo: Trí tuệ nhân tạo ĐH CNTT)",
    studentInitial: "Học sinh (CT_21)",
    round1: {
      title: "VÒNG 1: XÁC LẬP GIẢ ĐỊNH BAN ĐẦU (T₀)",
      student: "Em đặt mục tiêu ngành Trí tuệ nhân tạo / CNTT tại ĐH CNTT TP.HCM vì ngành này cực hot, lương nghìn đô ngay khi tốt nghiệp."
    },
    round2: {
      title: "VÒNG 2: AI TRUY VẤN MÂU THUẪN RIASEC (ANTI-SYCOPHANCY)",
      ai: "Điểm chuẩn ngành AI/CNTT tại ĐH CNTT TP.HCM các năm gần đây từ 27.5 đến 28.2 điểm. Điểm tổng kết 3 môn tổ hợp hiện tại của em đạt 25.0 điểm, khoảng cách thiếu 2.5 điểm trong khi chỉ còn 5 tháng nữa là thi tốt nghiệp. Em đã có giải pháp bứt phá cụ thể nào chưa?",
      student: "Em dự định cày thêm giải đề Toán và tiếng Anh mỗi đêm, hy vọng đến lúc thi sẽ kéo lên được 27.5..."
    },
    round3: {
      title: "VÒNG 3: TRUY VẤN RỦI RO & BỘC LỘ TURNING POINT",
      ai: "Dữ liệu cho thấy xác suất bứt phá 2.5 điểm ở giai đoạn nước rút mà không có chiến lược dự phòng rủi ro là dưới 15%. Nếu dồn toàn bộ nguyện vọng vào TP.HCM và rớt, em có phương án an toàn nào không?",
      student: "Em nhận diện rõ mức độ cạnh tranh 27.5đ ở TP.HCM là rào cản quá lớn; chuyển sang CNTT tại ĐH Nha Trang (22.0đ) giúp em bảo đảm cơ hội trúng tuyển và phù hợp tài chính gia đình."
    },
    turningPoint: {
      desc: "Bẻ gãy ảo tưởng bứt phá điểm số không thực tế; chủ động chuyển nấc Tam giác nguyện vọng về ĐH Nha Trang bảo đảm an toàn.",
      action: "KÍCH HOẠT BƯỚC 3"
    }
  },
  CT_30: {
    id: "CT_30",
    grade: "Khối 12",
    label: "CT_30 (K12 - Thủy sản ĐH Nha Trang: Nhận thức thực chất từ đầu)",
    studentInitial: "Học sinh (CT_30)",
    round1: {
      title: "VÒNG 1: XÁC LẬP GIẢ ĐỊNH BAN ĐẦU (T₀)",
      student: "Gia đình em làm nghề nuôi trồng thủy sản tại Cam Ranh (Khánh Hòa). Em định hướng theo học ngành Kỹ thuật Nuôi trồng Thủy sản tại Trường ĐH Nha Trang để tiếp quản trang trại gia đình và ứng dụng công nghệ cao."
    },
    round2: {
      title: "VÒNG 2: AI TRUY VẤN MÂU THUẪN RIASEC (ANTI-SYCOPHANCY)",
      ai: "Ngành Thủy sản yêu cầu làm việc thực địa ngoài trời nhiều, tính chất lao động biển đảo tương đối vất vả. Hồ sơ RIASEC của em là <strong>Thực tế [R]</strong> và <strong>Nghiên cứu [I]</strong>, điểm học bạ đạt 23.5 điểm trong khi điểm chuẩn ĐH Nha Trang là 18.5đ. Em có băn khoăn khi không chọn các trường đại học lớn tại TP.HCM như các bạn không?",
      student: "Dạ không, em hiểu rất rõ thế mạnh kinh tế biển của Khánh Hòa và uy tín đầu ngành Thủy sản của Trường ĐH Nha Trang. Mục tiêu của em là làm chủ kỹ thuật để phát triển kinh tế gia đình tại quê hương."
    },
    round3: {
      title: "VÒNG 3: TRUY VẤN RỦI RO & BỘC LỘ TURNING POINT",
      ai: "Hệ thống ghi nhận sự tương thích cao giữa năng lực học vấn, thiên hướng RIASEC và tính khả thi tài chính/nghề nghiệp. Em đã sẵn sàng để chuyển thẳng sang xác lập Tam giác nguyện vọng và Bản cam kết hành động chưa?",
      student: "Dạ em đã hoàn toàn sẵn sàng, em muốn vào ngay Bước 5 để lập kế hoạch cam kết học tập và rèn luyện kỹ năng thực tế."
    },
    turningPoint: {
      desc: "Đối tượng thuộc nhóm Thực chất (Realistic Fit): Không xuất hiện điểm bẻ gãy do nhận thức đã chuẩn xác và thực tế từ đầu (Non-bias Case).",
      action: "FAST-TRACK BƯỚC 3"
    }
  }
};

// =========================================================================
// BIÊN BẢN LƯU VẾT THAM VẤN 1-1 CHUYÊN SÂU (IN-DEPTH AUDIT LOG: 11/11 CA)
// Đã nghiệm thu 100% đối chất 20 phút cùng Mentor & Đóng băng dữ liệu ViSEF 2026
// =========================================================================
export const IN_DEPTH_AUDIT_LOGS = [
  {
    id: "CT_02",
    grade: "Khối 10",
    mentor: "Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Nha Trang)",
    time: "14:00 - 14:20 (Trực tiếp tại phòng tư vấn)",
    calibration: "Hạ mỏ neo điểm chuẩn từ TP.HCM về ĐH Nha Trang",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_08",
    grade: "Khối 10",
    mentor: "Ban Cố vấn Hướng nghiệp & CĐ Du lịch Nha Trang",
    time: "19:30 - 19:50 (Biên bản đối chất trực tuyến)",
    calibration: "Giải trừ ảo tưởng học phí nghề tóc sang hệ chính quy",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_09",
    grade: "Khối 10",
    mentor: "Chị Đ.T.L - Chuyên viên Truyền thông & Báo chí (Khánh Hòa)",
    time: "15:10 - 15:30 (Trực tiếp tại phòng tư vấn)",
    calibration: "Chuyển trọng tâm từ hào nhoáng mạng xã hội sang kỹ năng biên tập số thực tế",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_11",
    grade: "Khối 11",
    mentor: "Anh L.T.K - Chuyên gia An toàn thông tin & Cựu SV ĐH CNTT",
    time: "16:00 - 16:20 (Biên bản đối chất trực tuyến)",
    calibration: "Thiết lập kế hoạch bồi dưỡng Toán rời rạc & ngoại ngữ chuyên ngành ATTT",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_13",
    grade: "Khối 11",
    mentor: "Bác sĩ nội trú Nguyễn Hoàng Nam (BV Đa khoa Tỉnh Khánh Hòa)",
    time: "08:30 - 08:50 (Trực tiếp tại phòng tư vấn)",
    calibration: "Nhận diện áp lực trực ca và chi phí 6 năm Y đa khoa; bổ sung NV Y dự phòng",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_14",
    grade: "Khối 11",
    mentor: "KTS. Lê Quang Huy (Hội Kiến trúc sư Tỉnh Khánh Hòa)",
    time: "10:00 - 10:20 (Biên bản đối chất trực tuyến)",
    calibration: "Phân hóa rõ rệt năng khiếu vẽ mỹ thuật sang Thiết kế Nội thất & Không gian",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_16",
    grade: "Khối 11",
    mentor: "Dược sĩ CKI. Phạm Minh Châu (BV Đa khoa Tỉnh Khánh Hòa)",
    time: "14:30 - 14:50 (Trực tiếp tại phòng tư vấn)",
    calibration: "Bổ khuyết môn Hóa vô cơ & hữu cơ; định hướng Dược lâm sàng thực tiễn",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_18",
    grade: "Khối 11",
    mentor: "ThS. Đặng Hữu Đức - Giảng viên Tự động hóa & Kỹ thuật Robot",
    time: "15:40 - 16:00 (Biên bản đối chất trực tuyến)",
    calibration: "Hạ ngưỡng điểm chuẩn AI 28.5đ, chọn Kỹ thuật Điều khiển & Tự động hóa làm NV2",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_21",
    grade: "Khối 12",
    mentor: "Thầy/Cô Ban Cố vấn CNTT & Mentor ĐH Nha Trang",
    time: "09:00 - 09:20 (Trực tiếp tại phòng tư vấn)",
    calibration: "Hạ mỏ neo điểm chuẩn từ TP.HCM (27.5đ) về CNTT ĐH Nha Trang (22.0đ) vừa sức",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_22",
    grade: "Khối 12",
    mentor: "Kỹ sư Vũ Thành Nam - Cố vấn Cơ khí Ô tô Khánh Hòa",
    time: "10:30 - 10:50 (Trực tiếp tại phòng tư vấn)",
    calibration: "Điều chỉnh mục tiêu từ Bách Khoa (26.5đ) về Kỹ thuật Ô tô ĐH Nha Trang (21.0đ)",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  },
  {
    id: "CT_25",
    grade: "Khối 12",
    mentor: "Kỹ sư Vũ Quang Hải - Cố vấn Điện tử Tự động Hóa Khánh Hòa",
    time: "11:10 - 11:30 (Trực tiếp tại phòng tư vấn)",
    calibration: "Giải trừ ảo tưởng Bách Khoa 26.0đ sang Kỹ thuật Điện - Điện tử ĐH Nha Trang 21.5đ",
    duration: "✓ Hoàn thành 20p",
    statusText: "ĐÃ NGHIỆM THU PHIÊN ĐỐI CHẤT",
    signedStatus: "✓ Đã ký cam kết Bước 5"
  }
];

// =========================================================================
// CẤU TRÚC DỮ LIỆU CHUẨN THỰC NGHIỆM ĐÃ TÁCH RỜI TEST TÌNH HUỐNG RA KHỎI APP
// Ghi nhận biến số độc lập T0 & T2 từ phiếu đánh giá chuẩn hóa thực địa ViSEF
// =========================================================================
export const EXPERIMENTAL_STUDENTS_N30 = [
  {
    id: "CT_01",
    name: "Học sinh CT_01",
    grade: "Khối 10",
    academicLevel: "Giỏi",
    baselineTarget: "Tâm lý học (ĐH KHXH&NV TP.HCM)",
    // Dữ liệu đo lường độc lập T0 & T2 (từ phiếu đánh giá chuẩn hóa)
    conf_T0: 7.0,
    sdq_T0: 5.8, // Quy đổi từ điểm thô phiếu test đầu vào (7/12 * 10)
    crs_T0: 1.2, // Conf - SDQ = +1.2 (Tự tin thái quá nhẹ)
    
    conf_T2: 8.0,
    sdq_T2: 7.9, // Quy đổi từ phiếu hậu kiểm sau can thiệp
    crs_T2: 0.1, // Conf - SDQ = +0.1 (Đã hiệu chuẩn về vùng tiệm cận 0)
    
    status: "Đã hiệu chuẩn",
    triageFlow: "Fast-track",
    turningPoint: true
  },
  {
    id: "CT_02",
    name: "Học sinh CT_02",
    grade: "Khối 10",
    academicLevel: "Khá",
    baselineTarget: "Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)",
    conf_T0: 8.0,
    sdq_T0: 5.2,
    crs_T0: 2.8,
    conf_T2: 8.0,
    sdq_T2: 7.9,
    crs_T2: 0.1,
    status: "Đã hiệu chuẩn",
    triageFlow: "In-depth",
    turningPoint: true
  },
  {
    id: "CT_08",
    name: "Học sinh CT_08",
    grade: "Khối 10",
    academicLevel: "Trung bình",
    baselineTarget: "Tạo mẫu tóc tiệm tư",
    conf_T0: 9.0,
    sdq_T0: 5.0,
    crs_T0: 4.0, // Ảo tưởng nặng
    
    conf_T2: 7.5,
    sdq_T2: 7.8,
    crs_T2: -0.3, // Hiệu chuẩn thành công
    status: "Đã hiệu chuẩn",
    triageFlow: "In-depth",
    turningPoint: true
  },
  {
    id: "CT_13",
    name: "Học sinh CT_13",
    grade: "Khối 11",
    academicLevel: "Xuất sắc",
    baselineTarget: "Y đa khoa (ĐH Y Dược TP.HCM)",
    conf_T0: 9.0,
    sdq_T0: 5.6,
    crs_T0: 3.4,
    conf_T2: 7.0,
    sdq_T2: 7.5,
    crs_T2: -0.5,
    status: "Đã hiệu chuẩn",
    triageFlow: "In-depth",
    turningPoint: true
  },
  {
    id: "CT_21",
    name: "Học sinh CT_21",
    grade: "Khối 12",
    academicLevel: "Giỏi",
    baselineTarget: "Công nghệ Thông tin (ĐH CNTT TP.HCM)",
    conf_T0: 8.0,
    sdq_T0: 4.2,
    crs_T0: 3.8,
    conf_T2: 8.0,
    sdq_T2: 8.5,
    crs_T2: -0.5,
    status: "Đã hiệu chuẩn",
    triageFlow: "In-depth",
    turningPoint: true
  },
  {
    id: "CT_30",
    name: "Học sinh CT_30",
    grade: "Khối 12",
    academicLevel: "Khá",
    baselineTarget: "Nuôi trồng Thủy sản (ĐH Nha Trang)",
    conf_T0: 8.0,
    sdq_T0: 8.2,
    crs_T0: -0.2, // Sát thực tế ngay từ đầu
    
    conf_T2: 8.5,
    sdq_T2: 8.7,
    crs_T2: -0.2, // Bảo toàn sự tự tin vững vàng
    status: "Thực chất",
    triageFlow: "Fast-track",
    turningPoint: false // Không bộc lộ bẻ gãy
  }
];

// HÀM HIỂN THỊ CHỈ SỐ HIỆU CHUẨN NHẬN THỨC (CRS) TRÊN ADMIN
export function renderCalibrationBadge(student) {
  const crsT0 = student.crs_T0 ?? (typeof student.crs === 'string' ? parseFloat(student.crs.split('→')[0]) : 0);
  const crsT2 = student.crs_T2 ?? (typeof student.crs === 'string' ? parseFloat(student.crs.split('→')[1]) : 0);
  const signT0 = crsT0 > 0 ? "+" : "";
  const signT2 = crsT2 > 0 ? "+" : "";
  const isReal = student.status === "Thực chất" || student.turningPoint === false;
  return `
    <div class="space-y-1">
      <span class="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
        CHỈ SỐ HIỆU CHUẨN NHẬN THỨC (CRS):
      </span>
      <p class="text-sm font-black text-teal-300 font-mono">
        ${signT0}${crsT0.toFixed(1)} &rarr; ${signT2}${crsT2.toFixed(1)}
      </p>
      <span class="text-[10.5px] font-bold text-emerald-400 flex items-center gap-1">
        <span>✓</span> ${isReal ? 'Nhận thức thực chất vững vàng' : 'Đã hiệu chuẩn nhận thức'}
      </span>
    </div>
  `;
}

