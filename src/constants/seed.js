/**
 * DỮ LIỆU DEMO PERSONA DUY NHẤT & CHUẨN HÓA MỎ NEO T0 (ViSEF CBAS 2026)
 * Đảm bảo 100% tính nhất quán xuyên suốt từ Bước 1 đến Bước 5 và Chatbot AI Socrates
 */

export const DEMO_PERSONA = {
  id: "DEMO_STUDENT",
  studentCode: "CT_DEMO",
  fullName: "Học sinh Trải nghiệm Demo",
  email: "demo@socracareer.edu.vn",
  grade: "Khối 12",
  gradeNum: 12,
  academicRank: "Khá",
  
  // Mỏ neo nghề nghiệp T0 chuẩn hóa
  targetMajor: "Sư phạm",
  target_career: "Sư phạm",
  target_major: "Sư phạm",
  targetCareer: "Sư phạm",
  
  // Cơ sở đào tạo mục tiêu
  targetSchool: "ĐH Quy Nhơn",
  targetUniversity: "ĐH Quy Nhơn",
  target_university: "ĐH Quy Nhơn",
  target_school: "ĐH Quy Nhơn",
  
  // Dữ liệu học lực & tuyển sinh
  targetCombination: "C00",
  academicBenchmark: 24.50,
  academicScore: 23.50,
  academicGap: -1.00,
  
  // Thiên hướng Holland & Lý do
  riasec: "SAE",
  hollandCode: "SAE",
  reason: "Em yêu thích nghề giáo và muốn truyền đạt kiến thức cho học sinh",
  source_of_influence: "Em yêu thích nghề giáo và muốn truyền đạt kiến thức cho học sinh",
  careerReason: "Em yêu thích nghề giáo và muốn truyền đạt kiến thức cho học sinh",
  expectedIncome: "10 - 15 triệu / tháng",
  expected_income: "10 - 15 triệu / tháng",
  
  // Đo lường tâm lý & Hiệu chuẩn nhận thức
  confidenceScore: 8,
  confidence_score: 8,
  initialConfidence: 8,
  confidenceT0: 8,
  conf_T0: 8.0,
  sdq_T0: 5.5,
  crs_T0: 2.5,
  conf_T2: 8.0,
  sdq_T2: 7.8,
  crs_T2: 0.2,
  
  // Phân luồng thích ứng & Trạng thái
  status: "Đã hiệu chuẩn",
  triageFlow: "In-depth",
  triageBranch: "In-depth",
  turningPoint: true,
  isDemo: true
};

/**
 * Helper lấy dữ liệu mỏ neo T0 hiệu dụng:
 * Ưu tiên 1: Dữ liệu người dùng đã khai trong localStorage
 * Fallback: DEMO_PERSONA chuẩn hóa
 */
export function getEffectiveAnchor(customFallback = {}) {
  try {
    const rawAnchor = localStorage.getItem('cbas_anchor_data') || localStorage.getItem('userAnchorData');
    if (rawAnchor) {
      const parsed = JSON.parse(rawAnchor);
      if (parsed && (parsed.target_major || parsed.target_career || parsed.targetMajor)) {
        return {
          ...DEMO_PERSONA,
          ...parsed,
          targetMajor: parsed.target_major || parsed.target_career || parsed.targetMajor || DEMO_PERSONA.targetMajor,
          target_major: parsed.target_major || parsed.target_career || parsed.targetMajor || DEMO_PERSONA.targetMajor,
          target_career: parsed.target_career || parsed.target_major || parsed.targetMajor || DEMO_PERSONA.targetMajor,
          targetSchool: parsed.target_university || parsed.targetSchool || parsed.target_school || DEMO_PERSONA.targetSchool,
          target_university: parsed.target_university || parsed.targetSchool || parsed.target_school || DEMO_PERSONA.targetSchool,
          targetUniversity: parsed.target_university || parsed.targetSchool || parsed.target_school || DEMO_PERSONA.targetSchool,
          reason: parsed.reason || parsed.source_of_influence || DEMO_PERSONA.reason,
          expectedIncome: parsed.expected_income || parsed.expectedIncome || DEMO_PERSONA.expectedIncome,
          confidenceScore: parsed.confidence_score || parsed.confidenceScore || DEMO_PERSONA.confidenceScore
        };
      }
    }

    const rawProfile = localStorage.getItem('cbas_user_profile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && (parsed.targetMajor || parsed.target_career || parsed.target_major)) {
        return {
          ...DEMO_PERSONA,
          ...parsed,
          targetMajor: parsed.targetMajor || parsed.target_career || parsed.target_major || DEMO_PERSONA.targetMajor,
          target_major: parsed.targetMajor || parsed.target_career || parsed.target_major || DEMO_PERSONA.targetMajor,
          target_career: parsed.target_career || parsed.targetMajor || parsed.target_major || DEMO_PERSONA.targetMajor,
          targetSchool: parsed.targetSchool || parsed.target_university || parsed.target_school || DEMO_PERSONA.targetSchool,
          target_university: parsed.targetSchool || parsed.target_university || parsed.target_school || DEMO_PERSONA.targetSchool,
          targetUniversity: parsed.targetSchool || parsed.target_university || parsed.target_school || DEMO_PERSONA.targetSchool,
          reason: parsed.reason || parsed.source_of_influence || DEMO_PERSONA.reason,
          expectedIncome: parsed.expectedIncome || parsed.expected_income || DEMO_PERSONA.expectedIncome,
          confidenceScore: parsed.confidenceScore || parsed.confidence_score || parsed.initialConfidence || DEMO_PERSONA.confidenceScore
        };
      }
    }
  } catch (err) {
    console.warn('[seed] Lỗi đọc mỏ neo T0:', err);
  }

  return {
    ...DEMO_PERSONA,
    ...customFallback
  };
}
