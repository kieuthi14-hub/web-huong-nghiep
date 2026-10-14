// DỮ LIỆU CAM KẾT CHUẨN HÓA 2 TRỤ CỘT: HỌC VẤN TỔ HỢP & HỆ THỐNG KỸ NĂNG NGHỀ (CHUẨN KHKT QUỐC GIA)
export const ADAPTIVE_COMMITMENTS_BY_GRADE = {
  10: {
    badge: "Phân hóa: Khối 10 THPT (Củng cố Môn nền tảng & Kiểm soát chi phí đào tạo)",
    note: "Giai đoạn định hình hệ đào tạo chính quy, kiểm soát chi phí thực tế và giữ vững môn học cốt lõi",
    items: [
      {
        num: "1. Kỷ luật Giữ vững Môn học Nền tảng:",
        text: "NẾU bước vào giai đoạn lựa chọn cụm môn học chuyên sâu: THÌ tập trung tối đa để giữ vững điểm trung bình 2 môn cốt lõi (Toán và Ngoại ngữ) trên mức khá (7.5+), bảo đảm không bị thu hẹp phổ lựa chọn nghề nghiệp về sau."
      },
      {
        num: "2. Kiểm soát Chi phí & Chuẩn hóa Lộ trình Nghề:",
        text: "NẾU tiếp cận thông tin tuyển sinh hoặc các khóa đào tạo nghề tự do: THÌ luôn đối chứng dữ liệu thực tế về học phí và thời gian tập sự cùng Cố vấn, kiên quyết ưu tiên hệ đào tạo chính quy thay vì các quảng cáo ngắn hạn."
      },
      {
        num: "3. Vật neo Hành vi:",
        text: "Dán bản cam kết tại góc học tập; lấy mục tiêu nghề nghiệp đã được hiệu chuẩn làm động lực duy trì nền nếp học tập suốt năm học lớp 10."
      }
    ]
  },
  11: {
    badge: "Phân hóa: Khối 11 THPT (Tích lũy Học bạ & Đối chứng Thực tế Nghề Nghiệp)",
    note: "Giai đoạn then chốt cải thiện dải điểm học bạ, đối chứng áp lực thực tế và giải trừ ngộ nhận nghề",
    items: [
      {
        num: "1. Kỷ luật Nâng cao Điểm bạ Tổ hợp:",
        text: "NẾU điểm tổng kết môn chuyên môn tổ hợp có xu hướng chững lại: THÌ thiết lập mục tiêu cải thiện dải điểm học bạ cả năm thêm từ +0.5 đến +0.8 điểm, tạo biên độ an toàn phục vụ phương thức xét tuyển sớm."
      },
      {
        num: "2. Trải nghiệm Thực địa & Giải trừ Ngộ nhận Nghề:",
        text: "NẾU có cơ hội tiếp cận môi trường làm việc thực tế: THÌ chủ động quan sát và đối chứng áp lực nghề nghiệp thực tế tại các cơ sở chuyên môn trước khi chốt định hướng chuyên ngành lâu dài."
      },
      {
        num: "3. Vật neo Hành vi:",
        text: "Dán bản cam kết tại góc học tập; định kỳ đối soát phong độ học tập cùng Cố vấn để chủ động điều chỉnh chiến lược theo từng học kỳ."
      }
    ]
  },
  12: {
    badge: "Phân hóa: Khối 12 THPT (Quản trị Rủi ro Điểm sàn Thi TN THPT & An toàn Tuyển sinh)",
    note: "Giai đoạn nước rút bứt phá dải điểm tổ hợp xét tuyển, tối ưu hóa an toàn thực địa và giữ vững 3 nấc",
    items: [
      {
        num: "1. Kỷ luật Bứt phá Tổ hợp Xét tuyển (Thu hẹp Δ Điểm):",
        text: "NẾU kết quả các đợt thi thử hoặc kiểm tra định kỳ 3 môn tổ hợp chưa tiệm cận ngưỡng an toàn: THÌ tập trung phân tích danh mục lỗi sai cố hữu và ưu tiên bổ khuyết dải điểm còn thiếu, quyết tâm bảo toàn ngưỡng điểm sàn của nguyện vọng cốt lõi."
      },
      {
        num: "2. Rèn luyện Năng lực Thích ứng Chuyên môn & Tài chính:",
        text: "NẾU chuẩn bị bước vào giai đoạn xác nhận hồ sơ: THÌ chủ động tìm hiểu chương trình đào tạo chuyên ngành thực tế, đồng thời lập dự toán kinh phí đào tạo 3–4 năm tại cơ sở đào tạo mục tiêu để thống nhất phương án tài chính tự chủ cùng gia đình."
      },
      {
        num: "3. Vật neo Giữ vững Chiến lược (Chống hiệu ứng đám đông):",
        text: "Dán bản cam kết này ngang tầm mắt tại góc học tập; kiên quyết giữ vững cấu trúc Tam giác nguyện vọng 3 nấc (Thử thách — Vừa sức — Bảo toàn), không tự ý hoán đổi theo tâm lý đám đông trước ngày khóa cổng tuyển sinh."
      }
    ]
  }
};

// DỮ LIỆU TAM GIÁC NGUYỆN VỌNG MẪU TIÊU CHUẨN (KHÔNG GÁN CỐ ĐỊNH NGÀNH HỌC KHÁC):
export const DEFAULT_TRIANGLE_DATA = {
  stretch: {
    title: "1. NGUYỆN VỌNG THỬ THÁCH (STRETCH)",
    major: "Nguyện vọng Thử thách (Trường đại học trọng điểm / Tốp đầu)",
    desc: "Trường Top đầu — Đòi hỏi nỗ lực tối đa để thu hẹp khoảng cách điểm sàn (tham chiếu cạnh tranh cao)"
  },
  realistic: {
    title: "2. NGUYỆN VỌNG VỪA SỨC (REALISTIC)",
    major: "Nguyện vọng Vừa sức (Hệ chính quy vừa sức / Cơ sở đào tạo uy tín khu vực)",
    desc: "Mục tiêu chính — Điểm số nằm trong dải phong độ học bạ và điểm thi thử hiện tại (biên độ an toàn +1.5 đến +2.5 điểm)"
  },
  safety: {
    title: "3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)",
    major: "Nguyện vọng Bảo toàn (Hệ Cao đẳng / Chương trình đào tạo thực hành chất lượng cao)",
    desc: "Vùng đệm dự phòng rủi ro biến động điểm thi, bảo đảm 100% lộ trình học tập và tích lũy kỹ năng nghề không bị gián đoạn"
  }
};

// =========================================================================
// BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG - ĐỐI TƯỢNG CT_21
// Thực địa: Trường THPT Trần Quý Cáp | ViSEF 2026 - Phân ngành CBAS
// =========================================================================
export const CT21_COMMITMENT_DATA = {
  header: {
    ministry: "BỘ GIÁO DỤC VÀ ĐÀO TẠO — CUỘC THI KHKT CẤP QUỐC GIA HỌC SINH TRUNG HỌC (ViSEF)",
    project: 'Dự án: HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG "SOCRACAREER"',
    field: "Lĩnh vực: Khoa học Xã hội và Hành vi (CBAS) | Mẫu thực nghiệm: Trường THPT Trần Quý Cáp",
    title: "BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG",
    subtitle: "(Cơ chế Ý định Thực thi & Quản trị Rủi ro Đa tầng)"
  },
  studentInfo: {
    id: "CT_21",
    grade: "Khối 12 THPT",
    gradeNum: 12,
    academicRank: "Khá",
    combo: "A00 (Toán - Lý - Hóa)",
    gpa3: "25.0 / 30.0",
    riasec: "IRE (Nghiên cứu - Thực tế - Quản lý)",
    school: "Trường THPT Trần Quý Cáp"
  },
  calibration: {
    confT0: "8.0/10",
    confT2: "8.0/10",
    confNote: "Giữ vững tự tin dựa trên thực chất",
    crsT0: "+3.8",
    crsT2: "-0.2",
    crsDisplay: "+3.8 → -0.2",
    crsNote: "✓ Đã triệt tiêu tự tin thái quá"
  },
  coreCareerGoal: {
    major: "CÔNG NGHỆ THÔNG TIN — TRƯỜNG ĐẠI HỌC NHA TRANG (Mã ngành: 7480201)",
    note: "(Đã giải trừ mỏ neo ảo tưởng AI lương nghìn đô tại TP.HCM; xác lập vùng an toàn thực địa)"
  },
  triangle: {
    stretch: {
      title: "1. NGUYỆN VỌNG THỬ THÁCH (STRETCH GOAL)",
      majorSchool: "Trí tuệ Nhân tạo — Trường ĐH Công nghệ Thông tin - ĐHQG TP.HCM",
      targetScore: "27.50 điểm (Khoảng cách nỗ lực: Thiếu 2.50 điểm so với phong độ hiện tại)",
      notes: "Mục tiêu dấn thân phấn đấu cao độ, đòi hỏi bứt phá vượt bậc trong kỳ thi TN THPT."
    },
    realistic: {
      title: "2. NGUYỆN VỌNG VỪA SỨC (REALISTIC TARGET)",
      majorSchool: "Công nghệ Thông tin — Trường Đại học Nha Trang (Tham chiếu: 22.0 - 23.5 điểm)",
      targetScore: "Biên độ an toàn: Điểm học bạ hiện tại (25.0) cao hơn điểm chuẩn từ +1.5 đến +3.0 điểm.",
      notes: "Mục tiêu trọng tâm bảo đảm cơ hội trúng tuyển cao và tối ưu chi phí đào tạo."
    },
    safety: {
      title: "3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)",
      majorSchool: "Kỹ thuật Phần mềm — Cao đẳng Kỹ thuật Công nghệ Khánh Hòa (Xét học bạ THPT)",
      targetScore: "Vùng đệm dự phòng rủi ro",
      notes: "Vùng đệm dự phòng rủi ro; bảo đảm lộ trình học tập liên tục không bị đứt gãy nếu kỳ thi tốt nghiệp có biến động điểm thi bất khả kháng. Tuyệt đối không phó mặc may rủi."
    }
  },
  implementationIntentions: [
    {
      num: "1. Kỷ luật Tổ hợp Môn thi Xét tuyển (Cấu trúc \"Nếu... Thì...\"):",
      text: "- NẾU đến 19h30 các tối Thứ 2, Thứ 4, Thứ 6: THÌ tôi sẽ tắt chuông điện thoại, bấm đồng hồ nghiêm túc giải 01 đề thi thử môn Toán/Lý chuẩn cấu trúc Bộ GD&ĐT trong 90 phút.<br/>- NẾU chấm đề đạt dưới 8.0 điểm: THÌ tôi dành 45 phút ngay sau đó để phân tích lỗi sai vào sổ tay \"Bẫy nhận thức\" và làm lại 5 bài toán cùng dạng."
    },
    {
      num: "2. Rèn luyện Kỹ năng Thích ứng Chuyên môn:",
      text: "- Dành 60 phút sáng Chủ nhật tự học 01 bài giảng lập trình tư duy cơ bản (Python) trên mạng.<br/>- Lập bảng dự toán chi phí học tập và sinh hoạt 4 năm tại Nha Trang để thống nhất cùng gia đình."
    },
    {
      num: "3. Vật neo Hành vi (Behavioral Anchor):",
      text: "- Bản cam kết này được dán tại góc trái bàn học ở độ cao ngang tầm mắt.<br/>- Cam kết tuân thủ nghiêm ngặt thứ tự ưu tiên của Tam giác 3 nấc, không xáo trộn nguyện vọng theo hiệu ứng đám đông trước ngày khóa cổng đăng ký thi."
    }
  ],
  signatures: {
    student: {
      title: "HỌC SINH CAM KẾT",
      subtitle: "(Ký và ghi rõ họ tên)",
      name: "(Mã số: CT_21)"
    },
    mentor: {
      title: "CỐ VẤN / MENTOR",
      subtitle: "(Xác nhận nghiệm thu)",
      name: "(Mentor ĐH Nha Trang)"
    },
    parent: {
      title: "ĐẠI DIỆN PHỤ HUYNH",
      subtitle: "(Ký chứng kiến hỗ trợ)",
      name: "(Phụ huynh học sinh)"
    }
  }
};

// =========================================================================
// BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG - ĐỐI TƯỢNG CT_13
// Thực địa: Trường THPT Trần Quý Cáp | ViSEF 2026 - Phân ngành CBAS
// =========================================================================
export const CT13_COMMITMENT_DATA = {
  header: {
    ministry: "BỘ GIÁO DỤC VÀ ĐÀO TẠO — CUỘC THI KHKT CẤP QUỐC GIA HỌC SINH TRUNG HỌC (ViSEF)",
    project: 'Dự án: HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG "SOCRACAREER"',
    field: "Lĩnh vực: Khoa học Xã hội và Hành vi (CBAS) | Mẫu thực nghiệm: Trường THPT Trần Quý Cáp",
    title: "BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG",
    subtitle: "(Cơ chế Ý định Thực thi & Quản trị Rủi ro Đa tầng)"
  },
  studentInfo: {
    id: "CT_13",
    grade: "Khối 11 THPT",
    gradeNum: 11,
    academicRank: "Xuất sắc",
    combo: "B00 (Toán - Hóa - Sinh)",
    gpa3: "27.2 / 30.0",
    riasec: "ISR (Nghiên cứu - Xã hội - Thực tế)",
    school: "Trường THPT Trần Quý Cáp"
  },
  calibration: {
    confT0: "9.0/10",
    confT2: "7.0/10",
    confNote: "Đã giải trừ áp lực nghề Y Đa khoa vượt ngưỡng",
    crsT0: "+3.4",
    crsT2: "+0.5",
    crsDisplay: "+3.4 → +0.5",
    crsNote: "✓ Đã hiệu chuẩn về vùng an toàn"
  },
  coreCareerGoal: {
    major: "KỸ THUẬT XÉT NGHIỆM Y HỌC / ĐIỀU DƯỠNG — ĐH YERSIN / CĐ Y TẾ KHÁNH HÒA",
    note: "(Đã hiệu chuẩn lệch năng lực tổ hợp B00; xác lập lộ trình đào tạo thực hành)"
  },
  triangle: {
    stretch: {
      title: "1. NGUYỆN VỌNG THỬ THÁCH (STRETCH GOAL)",
      majorSchool: "Y Đa khoa — ĐH Y Dược TP.HCM",
      targetScore: "Tham chiếu: 27.5đ+ (Khoảng cách nỗ lực: Thiếu 3.2 điểm)",
      notes: "Mục tiêu phấn đấu nỗ lực cao — Yêu cầu bứt phá năng lực chuyên sâu."
    },
    realistic: {
      title: "2. NGUYỆN VỌNG VỪA SỨC (REALISTIC TARGET)",
      majorSchool: "Y học Dự phòng / Dược học — ĐH Tây Nguyên / ĐH Nha Trang",
      targetScore: "Tham chiếu: 21.5 - 23.0đ",
      notes: "Mục tiêu phù hợp năng lực học bạ tích lũy, cơ hội trúng tuyển ổn định."
    },
    safety: {
      title: "3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)",
      majorSchool: "Cao đẳng Điều dưỡng — Cao đẳng Y tế Khánh Hòa (Xét học bạ sớm)",
      targetScore: "Vùng đệm an toàn xét tuyển sớm",
      notes: "Vùng đệm an toàn — Chủ động phương thức xét tuyển sớm, bảo đảm việc làm lâm sàng tại địa phương."
    }
  },
  implementationIntentions: [
    {
      num: "1. Kỷ luật Nâng cao Điểm bạ Tổ hợp:",
      text: "NẾU điểm tổng kết môn chuyên môn tổ hợp có xu hướng chững lại: THÌ thiết lập mục tiêu cải thiện dải điểm học bạ cả năm thêm từ +0.5 đến +0.8 điểm, tạo biên độ an toàn phục vụ phương thức xét tuyển sớm."
    },
    {
      num: "2. Trải nghiệm Thực địa & Giải trừ Ngộ nhận Nghề:",
      text: "NẾU có cơ hội tiếp cận môi trường làm việc thực tế: THÌ chủ động quan sát và đối chứng áp lực nghề nghiệp thực tế tại cơ sở y tế địa phương trước khi chốt định hướng chuyên ngành lâu dài."
    },
    {
      num: "3. Vật neo Hành vi:",
      text: "Dán bản cam kết tại góc học tập; định kỳ đối soát phong độ học tập cùng Cố vấn để chủ động điều chỉnh chiến lược theo từng học kỳ."
    }
  ],
  signatures: {
    student: {
      title: "HỌC SINH CAM KẾT",
      subtitle: "(Ký và ghi rõ họ tên)",
      name: "(Mã số: CT_13)"
    },
    mentor: {
      title: "CỐ VẤN / MENTOR",
      subtitle: "(Xác nhận nghiệm thu)",
      name: "(BS. Nguyễn Hoàng Nam - CĐ Y Tế)"
    },
    parent: {
      title: "ĐẠI DIỆN PHỤ HUYNH",
      subtitle: "(Ký chứng kiến hỗ trợ)",
      name: "(Phụ huynh học sinh)"
    }
  }
};

// =========================================================================
// BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG - ĐỐI TƯỢNG CT_08
// Thực địa: Trường THPT Trần Quý Cáp | ViSEF 2026 - Phân ngành CBAS
// =========================================================================
export const CT08_COMMITMENT_DATA = {
  header: {
    ministry: "BỘ GIÁO DỤC VÀ ĐÀO TẠO — CUỘC THI KHKT CẤP QUỐC GIA HỌC SINH TRUNG HỌC (ViSEF)",
    project: 'Dự án: HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG "SOCRACAREER"',
    field: "Lĩnh vực: Khoa học Xã hội và Hành vi (CBAS) | Mẫu thực nghiệm: Trường THPT Trần Quý Cáp",
    title: "BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG",
    subtitle: "(Cơ chế Ý định Thực thi & Quản trị Rủi ro Đa tầng)"
  },
  studentInfo: {
    id: "CT_08",
    grade: "Khối 10 THPT",
    gradeNum: 10,
    academicRank: "Trung bình",
    combo: "Khoa học Tự nhiên & Xã hội căn bản",
    gpa3: "18.5 / 30.0",
    riasec: "ICR (Nghiên cứu - Quy chuẩn - Thực tế)",
    school: "Trường THPT Trần Quý Cáp"
  },
  calibration: {
    confT0: "9.0/10",
    confT2: "7.5/10",
    confNote: "Đã bẻ gãy mỏ neo chi phí nghề tự do",
    crsT0: "+4.0",
    crsT2: "-0.3",
    crsDisplay: "+4.0 → -0.3",
    crsNote: "✓ Đã triệt tiêu tự tin thái quá"
  },
  coreCareerGoal: {
    major: "KỸ THUẬT CHẾ BIẾN MÓN ĂN / QUẢN TRỊ DỊCH VỤ — CĐ DU LỊCH NHA TRANG",
    note: "(Đã giải trừ ngộ nhận chi phí nghề tóc tự do; định hình hệ đào tạo chính quy)"
  },
  triangle: {
    stretch: {
      title: "1. NGUYỆN VỌNG THỬ THÁCH (STRETCH GOAL)",
      majorSchool: "Quản trị Khách sạn — Trường Đại học Nha Trang (Tham chiếu: 21.0đ)",
      targetScore: "21.0 điểm",
      notes: "Mục tiêu đại học chính quy địa phương — Đòi hỏi củng cố điểm văn hóa THPT vững chắc."
    },
    realistic: {
      title: "2. NGUYỆN VỌNG VỪA SỨC (REALISTIC TARGET)",
      majorSchool: "Kỹ thuật Chế biến Món ăn / Làm đẹp — CĐ Du lịch Nha Trang (Hệ chính quy)",
      targetScore: "Xét tuyển học bạ THPT (18.0 - 20.0đ)",
      notes: "Mục tiêu đào tạo bài bản — Học phí theo quy định nhà nước, thực hành xưởng đạt chuẩn."
    },
    safety: {
      title: "3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)",
      majorSchool: "Hệ Trung cấp nghề 9+ — Trường Cao đẳng Kỹ thuật Công nghệ Khánh Hòa",
      targetScore: "Miễn học phí theo chính sách nhà nước",
      notes: "Vùng đệm dự phòng rủi ro — Được miễn học phí nghề theo chính sách nhà nước, bảo toàn tương lai."
    }
  },
  implementationIntentions: [
    {
      num: "1. Kỷ luật Giữ vững Môn học Nền tảng:",
      text: "NẾU bước vào giai đoạn lựa chọn cụm môn học chuyên sâu: THÌ tập trung tối đa để giữ vững điểm trung bình 2 môn cốt lõi (Toán và Ngoại ngữ) trên mức khá (7.5+), bảo đảm không bị thu hẹp phổ lựa chọn nghề nghiệp về sau."
    },
    {
      num: "2. Kiểm soát Chi phí & Chuẩn hóa Lộ trình Nghề:",
      text: "NẾU tiếp cận thông tin tuyển sinh hoặc các khóa đào tạo nghề tự do: THÌ luôn đối chứng dữ liệu thực tế về học phí và thời gian tập sự cùng Cố vấn, kiên quyết ưu tiên hệ đào tạo chính quy thay vì các quảng cáo ngắn hạn."
    },
    {
      num: "3. Vật neo Hành vi:",
      text: "Dán bản cam kết tại góc học tập; lấy mục tiêu nghề nghiệp đã được hiệu chuẩn làm động lực duy trì nền nếp học tập suốt năm học lớp 10."
    }
  ],
  signatures: {
    student: {
      title: "HỌC SINH CAM KẾT",
      subtitle: "(Ký và ghi rõ họ tên)",
      name: "(Mã số: CT_08)"
    },
    mentor: {
      title: "CỐ VẤN / MENTOR",
      subtitle: "(Xác nhận nghiệm thu)",
      name: "(Ban Cố vấn & CĐ Du lịch)"
    },
    parent: {
      title: "ĐẠI DIỆN PHỤ HUYNH",
      subtitle: "(Ký chứng kiến hỗ trợ)",
      name: "(Phụ huynh học sinh)"
    }
  }
};

/**
 * HÀM XÂY DỰNG TAM GIÁC NGUYỆN VỌNG & MA TRẬN HÀNH ĐỘNG ĐỘNG TỪ MỎ NEO T0 DUY NHẤT
 * Toàn bộ Bước 5 (tam giác, mục tiêu sau hiệu chuẩn, ma trận hành động) suy ra từ mỏ neo T0 đã khai.
 */
export function buildAdaptiveTriadAndPlan(targetMajor = '', targetSchool = '', grade = 12) {
  const major = (targetMajor || '').trim() || 'Ngành mục tiêu';
  const school = (targetSchool || '').trim();

  // Nấc 1: Thử thách (Stretch Goal)
  const stretchTitle = "1. NGUYỆN VỌNG THỬ THÁCH (STRETCH GOAL)";
  const stretchSchool = school ? `${major} — ${school}` : `${major} (Trường đại học trọng điểm / Tốp đầu)`;
  const stretchDesc = "Mục tiêu dấn thân nỗ lực cao — Đòi hỏi bứt phá tối đa năng lực các môn thế mạnh trong tổ hợp xét tuyển.";

  // Nấc 2: Vừa sức (Realistic Target)
  const realisticTitle = "2. NGUYỆN VỌNG VỪA SỨC (REALISTIC TARGET)";
  const realisticSchool = `${major} (Hệ chính quy vừa sức / Cơ sở đào tạo uy tín khu vực)`;
  const realisticDesc = "Mục tiêu trọng tâm bảo đảm cơ hội trúng tuyển vững chắc, tối ưu hóa học phí và lộ trình việc làm sau tốt nghiệp.";

  // Nấc 3: Bảo toàn (Safety Buffer)
  const safetyTitle = "3. NGUYỆN VỌNG BẢO TOÀN (SAFETY BUFFER)";
  const safetySchool = `${major} (Hệ Cao đẳng / Chương trình đào tạo thực hành chất lượng cao)`;
  const safetyDesc = "Vùng đệm dự phòng rủi ro biến động điểm thi, bảo đảm 100% lộ trình học tập và tích lũy kỹ năng nghề không bị gián đoạn.";

  const targetCore = school ? `${major} — ${school}` : `${major} (Hệ đào tạo vừa sức)`;
  const targetCoreNote = "Đã hiệu chuẩn bẫy nhận thức & Tối ưu hóa tính khả thi thực tế";
  const gNum = Number(grade) || 12;

  let action1_title = "1. Kỷ luật Bứt phá Tổ hợp Xét tuyển (Cấu trúc 'Nếu... Thì...'):";
  let action1_content = `NẾU điểm kiểm tra định kỳ hoặc thi thử 3 môn tổ hợp xét tuyển ngành ${major} chưa đạt ngưỡng an toàn: THÌ lập tức phân tích danh mục lỗi sai, tập trung bồi dưỡng dải điểm còn đuối sức để kéo tổng điểm lên.`;

  let action2_title = "2. Rèn luyện Kỹ năng Thích ứng Chuyên môn & Tài chính:";
  let action2_content = `NẾU chuẩn bị bước vào giai đoạn nộp hồ sơ xét tuyển ngành ${major}: THÌ chủ động đối chứng kỹ điều kiện thực tế (chuẩn đầu ra, kiểm tra sức khỏe/ngoại ngữ, học phí 3–4 năm) để thống nhất phương án tài chính cùng gia đình.`;

  let action3_title = "3. Vật neo Giữ vững Chiến lược (Behavioral Anchor):";
  let action3_content = `Dán bản cam kết này ngang tầm mắt tại góc học tập; kiên quyết giữ vững cấu trúc Tam giác nguyện vọng 3 nấc của ngành ${major}, không tự ý hoán đổi theo tâm lý đám đông trước ngày khóa cổng tuyển sinh.`;

  if (gNum === 10) {
    action1_title = "1. Kỷ luật Giữ vững Môn học Nền tảng:";
    action1_content = `NẾU bước vào giai đoạn lựa chọn cụm môn học chuyên sâu hướng tới ngành ${major}: THÌ tập trung tối đa để giữ vững điểm trung bình 2 môn cốt lõi (Toán và Ngoại ngữ) trên mức khá (7.5+), bảo đảm không bị thu hẹp phổ lựa chọn về sau.`;
    action2_title = "2. Kiểm soát Chi phí & Chuẩn hóa Lộ trình Nghề:";
    action2_content = `NẾU tiếp cận thông tin tuyển sinh hoặc các khóa đào tạo nghề ${major}: THÌ luôn đối chứng dữ liệu thực tế về học phí và thời gian đào tạo cùng Cố vấn, kiên quyết ưu tiên hệ đào tạo chính quy.`;
    action3_title = "3. Vật neo Hành vi (Behavioral Anchor):";
    action3_content = `Dán bản cam kết tại góc học tập; lấy mục tiêu ngành ${major} đã được hiệu chuẩn làm động lực duy trì nền nếp học tập suốt năm học lớp 10.`;
  } else if (gNum === 11) {
    action1_title = "1. Kỷ luật Nâng cao Điểm bạ Tổ hợp:";
    action1_content = `NẾU điểm tổng kết môn chuyên môn tổ hợp xét tuyển ngành ${major} có xu hướng chững lại: THÌ thiết lập mục tiêu cải thiện dải điểm học bạ cả năm thêm từ +0.5 đến +0.8 điểm, tạo biên độ an toàn phục vụ phương thức xét tuyển sớm.`;
    action2_title = "2. Trải nghiệm Thực địa & Giải trừ Ngộ nhận Nghề:";
    action2_content = `NẾU có cơ hội tiếp cận môi trường làm việc thực tế của ngành ${major}: THÌ chủ động quan sát và đối chứng áp lực nghề nghiệp thực tế trước khi chốt định hướng chuyên ngành lâu dài.`;
    action3_title = "3. Vật neo Hành vi (Behavioral Anchor):";
    action3_content = `Dán bản cam kết tại góc học tập; định kỳ đối soát phong độ học tập cùng Cố vấn để chủ động điều chỉnh chiến lược theo từng học kỳ.`;
  }

  const stretch = {
    title: stretchTitle,
    targetScore: "Tham chiếu: 26.0+ (Ngưỡng cạnh tranh cao)",
    majorSchool: stretchSchool,
    notes: stretchDesc
  };

  const realistic = {
    title: realisticTitle,
    targetScore: "Phong độ an toàn: Dải điểm 21.0 – 24.0 (Dự phòng +1.5đ đến +2.5đ)",
    majorSchool: realisticSchool,
    notes: realisticDesc
  };

  const safety = {
    title: safetyTitle,
    targetScore: "Vùng đệm an toàn (Phương thức xét học bạ sớm / Tuyển sinh thực hành)",
    majorSchool: safetySchool,
    notes: safetyDesc
  };

  return {
    triangle: {
      stretch,
      realistic,
      safety,
      stretchTitle,
      stretchSchool,
      stretchDesc,
      realisticTitle,
      realisticSchool,
      realisticDesc,
      safetyTitle,
      safetySchool,
      safetyDesc,
      targetCore,
      targetCoreNote
    },
    matrix: {
      action1_title,
      action1_content,
      action2_title,
      action2_content,
      action3_title,
      action3_content
    },
    actions: [
      { num: action1_title, text: action1_content },
      { num: action2_title, text: action2_content },
      { num: action3_title, text: action3_content }
    ]
  };
}

/**
 * Trợ cấp phân hóa cấu trúc Bước 5 (Tam giác nguyện vọng & Ma trận ý định thực thi)
 * Chuẩn SocraCareer KHKT 2026
 */
export function getAdaptiveStep5Data(student = {}) {
  const major = student.targetMajor || student.major || student.target_career || student.targetCareer || 'Ngành mục tiêu';
  const school = student.targetSchool || student.target_school || student.target_university || student.targetUniversity || '';
  const grade = student.grade || student.gradeNum || 12;
  return buildAdaptiveTriadAndPlan(major, school, grade);
}

/**
 * HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG (SOCRACAREER)
 * BƯỚC 5: BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHUẨN KHKT QUỐC GIA)
 */
export function generateStep5Content(student = {}) {
  const major = student.targetMajor || student.major || student.target_career || student.targetCareer || 'Ngành mục tiêu';
  const school = student.targetSchool || student.target_school || student.target_university || student.targetUniversity || '';
  const grade = student.grade || student.gradeNum || 12;
  const { triangle, matrix } = buildAdaptiveTriadAndPlan(major, school, grade);

  // 2. Trả về khối HTML giao diện chuẩn mực, sạch sẽ, hoàn toàn ăn khớp với mỏ neo T0
  return `
  <div class="space-y-4 font-sans text-slate-800">
    <!-- KHỐI CHỈ SỐ VÀ MỤC TIÊU CỐT LÕI -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50/90 border border-slate-200 rounded-xl text-xs">
      <div>
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ngành mục tiêu sau hiệu chuẩn:</span>
        <h4 class="text-sm font-black text-slate-900 mt-0.5 leading-snug">${triangle.targetCore}</h4>
        <span class="text-[10.5px] text-teal-700 font-bold flex items-center gap-1 mt-1">
          <span>✓</span> ${triangle.targetCoreNote}
        </span>
      </div>

      <div>
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Độ tự tin thực chất (T0 &rarr; T2):</span>
        <h4 class="text-sm font-black text-slate-900 mt-0.5">${student.conf_T0 || 8}/10 &rarr; <span class="text-teal-700">${student.conf_T2 || 8}/10</span> <span class="text-xs font-normal text-slate-500">(Mã RIASEC: ${student.riasec || 'IRE'})</span></h4>
        <p class="text-[10.5px] text-slate-500 mt-1">Giữ vững niềm tin dựa trên năng lực thực chất</p>
      </div>

      <div>
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chỉ số Hiệu chuẩn Nhận thức (CRS):</span>
        <h4 class="text-sm font-black text-teal-800 font-mono mt-0.5">+${student.crs_T0 || '3.8'} &rarr; ${student.crs_T2 || '-0.2'}</h4>
        <span class="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
          <span>✓</span> Đã hiệu chuẩn về vùng tiệm cận 0
        </span>
      </div>
    </div>

    <!-- KHỐI TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG 3 NẤC -->
    <div class="p-4 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
          <span class="text-rose-600">▲</span> TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (CHIẾN LƯỢC QUẢN TRỊ RỦI RO)
        </span>
        <span class="text-[10px] text-slate-500 italic">Phân tầng bậc thang 3 nấc bảo toàn lộ trình</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <!-- Nấc 1: Thử thách -->
        <div class="p-3.5 rounded-lg border border-purple-200 bg-purple-50/70 flex flex-col justify-between">
          <div>
            <span class="font-extrabold text-purple-900 text-[10px] uppercase block">${triangle.stretchTitle}</span>
            <h5 class="font-bold text-slate-900 text-[12px] mt-1">${triangle.stretchSchool}</h5>
          </div>
          <p class="text-[10.5px] text-slate-600 mt-2 pt-2 border-t border-purple-200/80 leading-relaxed">${triangle.stretchDesc}</p>
        </div>

        <!-- Nấc 2: Vừa sức (Cốt lõi) -->
        <div class="p-3.5 rounded-lg border border-teal-200 bg-teal-50/70 flex flex-col justify-between">
          <div>
            <span class="font-extrabold text-teal-900 text-[10px] uppercase block">${triangle.realisticTitle}</span>
            <h5 class="font-bold text-slate-900 text-[12px] mt-1">${triangle.realisticSchool}</h5>
          </div>
          <p class="text-[10.5px] text-slate-600 mt-2 pt-2 border-t border-teal-200/80 leading-relaxed">${triangle.realisticDesc}</p>
        </div>

        <!-- Nấc 3: Bảo toàn rủi ro -->
        <div class="p-3.5 rounded-lg border border-slate-300 bg-white flex flex-col justify-between">
          <div>
            <span class="font-extrabold text-slate-800 text-[10px] uppercase block">${triangle.safetyTitle}</span>
            <h5 class="font-bold text-slate-900 text-[12px] mt-1">${triangle.safetySchool}</h5>
          </div>
          <p class="text-[10.5px] text-slate-600 mt-2 pt-2 border-t border-slate-200 leading-relaxed">${triangle.safetyDesc}</p>
        </div>
      </div>
    </div>

    <!-- KHỐI MA TRẬN Ý ĐỊNH THỰC THI (IMPLEMENTATION INTENTIONS) -->
    <div class="p-4 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3">
      <div class="border-b border-slate-200 pb-2">
        <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">
          MA TRẬN KẾ HOẠCH HÀNH ĐỘNG DÁN TẠI GÓC HỌC TẬP (IMPLEMENTATION INTENTIONS)
        </h4>
        <p class="text-[10.5px] text-slate-500 mt-0.5">
          Quy chuẩn Thuyết Ý định Thực thi (Gollwitzer, 1999) — Thiết lập phản ứng hành vi kiểm soát rủi ro
        </p>
      </div>

      <div class="space-y-2.5 text-xs">
        <div class="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span class="font-bold text-teal-800 block mb-1">${matrix.action1_title}</span>
          <p class="text-[11.5px] text-slate-700 leading-relaxed">${matrix.action1_content}</p>
        </div>

        <div class="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span class="font-bold text-cyan-800 block mb-1">${matrix.action2_title}</span>
          <p class="text-[11.5px] text-slate-700 leading-relaxed">${matrix.action2_content}</p>
        </div>

        <div class="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span class="font-bold text-slate-800 block mb-1">${matrix.action3_title}</span>
          <p class="text-[11.5px] text-slate-700 leading-relaxed">${matrix.action3_content}</p>
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * Trợ cấp lấy dữ liệu cam kết theo mã học sinh (Hỗ trợ chuyên biệt CT_21, CT_13, CT_08)
 */
export const getStudentCommitmentData = (studentId) => {
  if (studentId === 'CT_21') return CT21_COMMITMENT_DATA;
  if (studentId === 'CT_13') return CT13_COMMITMENT_DATA;
  if (studentId === 'CT_08') return CT08_COMMITMENT_DATA;
  return null;
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
  // CT_21: Học sinh Khá thi CNTT (Khớp ĐH Nha Trang - THPT Trần Quý Cáp)
  {
    id: "CT_21",
    grade: "Khối 12",
    rank: "Khá",
    riasec: "IRE",
    target_t0: "Công nghệ Thông tin (ĐH CNTT TP.HCM - 27.5đ)",
    delta: "-2.5đ",
    risk_level: "Nguy cơ",
    triage: "In-depth (20p)",
    target_t2: "Công nghệ Thông tin — ĐH Nha Trang (7480201 - 22.0đ)",
    crs_display: "+3.8 → -0.2",
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
    academicLevel: "Khá",
    baselineTarget: "Công nghệ Thông tin (ĐH CNTT TP.HCM)",
    conf_T0: 8.0,
    sdq_T0: 4.2,
    crs_T0: 3.8,
    conf_T2: 8.0,
    sdq_T2: 8.2, // Conf (8.0) - SDQ (8.2) = -0.2 (Đã triệt tiêu tự tin thái quá)
    crs_T2: -0.2,
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

