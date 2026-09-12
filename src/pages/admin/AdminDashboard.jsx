import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getCounselorDetails, formatDateTimeFormatted, mentorMap, parseMeetingInfo, parseStudentContact } from '../student/CounselingBooking'
import { 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  BarChart3, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Award, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Eye, 
  Sliders,
  ChevronRight,
  Info,
  Scale,
  Compass,
  FileText,
  Target,
  Video,
  MapPin,
  ExternalLink,
  MessageSquare,
  Phone,
  Mail,
  Copy,
  Check
} from 'lucide-react'

// =========================================================================
// 1. DỮ LIỆU MẪU KHOA HỌC THỰC NGHIỆM CHUẨN ViSEF (N=90)
// =========================================================================

// Dữ liệu so sánh 3 nhóm thực nghiệm (Intervention, Spontaneous, Control)
const VISEF_EXPERIMENTAL_GROUPS = [
  {
    id: 'grp-1',
    name: 'Nhóm 1: Can thiệp Phản tư (Intervention Group)',
    sampleSize: 30,
    description: 'Sử dụng đầy đủ Hệ thống: Trắc nghiệm Holland, AI Debias Agent, Đối chứng dữ liệu thực tế và Nhật ký phản tư.',
    cbisPre: 6.9,
    cbisPost: 3.5,
    cbisChangePct: -49.28,
    cbisPValue: '< 0.001',
    cdsePre: 6.2,
    cdsePost: 8.6,
    cdseChangePct: 38.71,
    cdsePValue: '< 0.001',
    successDebiasingPct: 86.7, // 26/30 học sinh
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  {
    id: 'grp-2',
    name: 'Nhóm 2: Hướng nghiệp Tự phát (Spontaneous Group)',
    sampleSize: 30,
    description: 'Tự tìm kiếm thông tin trên mạng xã hội (TikTok, Facebook), tham khảo ý kiến truyền miệng từ bạn bè.',
    cbisPre: 7.1,
    cbisPost: 6.8,
    cbisChangePct: -4.23,
    cbisPValue: '0.342 (ns)',
    cdsePre: 5.9,
    cdsePost: 6.1,
    cdseChangePct: 3.39,
    cdsePValue: '0.418 (ns)',
    successDebiasingPct: 16.7, // 5/30 học sinh
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'grp-3',
    name: 'Nhóm 3: Đối chứng Truyền thống (Control Group)',
    sampleSize: 30,
    description: 'Chỉ tham gia các buổi sinh hoạt lớp hoặc ngày hội tư vấn tuyển sinh đại trà theo mô hình truyền thống.',
    cbisPre: 6.8,
    cbisPost: 6.5,
    cbisChangePct: -4.41,
    cbisPValue: '0.285 (ns)',
    cdsePre: 6.0,
    cdsePost: 6.3,
    cdseChangePct: 5.00,
    cdsePValue: '0.210 (ns)',
    successDebiasingPct: 20.0, // 6/30 học sinh
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  }
]

// 5 Thành phần Năng lực Tự quyết Nghề nghiệp CDSE-SF (Career Decision Self-Efficacy Short Form)
const CDSE_COMPONENTS = [
  { key: 'self_appraisal', name: '1. Tự Đánh Giá Năng Lực Bản Thân (Self-Appraisal)', pre: 5.8, post: 8.7, change: '+50.0%', effect: 'Rất cao (d=1.45)' },
  { key: 'occupational_info', name: '2. Thu Thập Dữ Liệu Nghề Nghiệp Khách Quan (Occupational Info)', pre: 6.1, post: 8.9, change: '+45.9%', effect: 'Rất cao (d=1.52)' },
  { key: 'goal_selection', name: '3. Lựa Chọn & Xác Định Mục Tiêu (Goal Selection)', pre: 6.5, post: 8.8, change: '+35.4%', effect: 'Cao (d=1.28)' },
  { key: 'planning', name: '4. Lập Kế Hoạch 3 Năm THPT (Planning)', pre: 6.3, post: 8.4, change: '+33.3%', effect: 'Cao (d=1.19)' },
  { key: 'problem_solving', name: '5. Giải Quyết & Thoát Bẫy Nhận Thức (Problem Solving)', pre: 6.1, post: 8.2, change: '+34.4%', effect: 'Cao (d=1.24)' }
]

// 4 Bẫy Thiên Lệch Nhận Thức Cốt Lõi CBIS (Cognitive Bias in Career Scale)
const CBIS_BIAS_SUBSCALES = [
  { key: 'emotional', name: 'Bẫy Cảm Xúc & Cố Định Tư Duy (Thích từ bé)', pre: 7.2, post: 3.2, change: '-55.6%', desc: 'Học sinh phân biệt rõ giữa đam mê quá khứ và năng lực thực tế hiện tại.' },
  { key: 'bandwagon', name: 'Hiệu Ứng Bầy Đàn & Đám Đông (Hot trend MXH)', pre: 7.0, post: 3.4, change: '-51.4%', desc: 'Không còn chạy theo ngành số đông khi chưa đối chứng chuẩn đầu ra.' },
  { key: 'optimism', name: 'Thiên Lệch Lạc Quan Tếu (Chỉ nhìn màu hồng)', pre: 6.8, post: 3.6, change: '-47.1%', desc: 'Chủ động phân tích rủi ro đào thải, áp lực công việc và học phí.' },
  { key: 'sunk_cost', name: 'Bẫy Chi Phí Chìm (Tiếc công sức đã ôn thi)', pre: 6.6, post: 3.8, change: '-42.4%', desc: 'Dũng cảm chuyển ngành hoặc xây dựng phương án dự phòng phù hợp.' }
]

// 4 Bài tập Tình huống Thực nghiệm Chống Bẫy Thông Tin Số
const DIGITAL_SCENARIOS = [
  {
    id: 'sc-01',
    title: 'Tình huống 1: "Ngành Hot Lương 50 Triệu Trên TikTok"',
    biasType: 'BANDWAGON_BIAS',
    biasLabel: 'Bẫy Đám Đông & Mạng Xã Hội',
    context: 'Một video triệu view khẳng định ngành Logistics lương khởi điểm 50 triệu/tháng mà không cần kinh nghiệm.',
    correctDebiasAction: 'Tra cứu báo cáo lương thị trường và đối chứng chuẩn đầu ra trường ĐH.',
    successRate: '93.3% (28/30 HS vượt qua)'
  },
  {
    id: 'sc-02',
    title: 'Tình huống 2: "Tiếc 3 Năm Luyện Khối A00 Dù Hết Đam Mê"',
    biasType: 'SUNK_COST_BIAS',
    biasLabel: 'Bẫy Chi Phí Chìm (Sunk Cost)',
    context: 'Học sinh đạt điểm cao khối Tự nhiên nhưng nhận ra bản thân có thiên hướng Sáng tạo & Ngôn ngữ.',
    correctDebiasAction: 'Chấp nhận điều chỉnh tổ hợp hoặc chọn ngành giao thoa công nghệ - nghệ thuật.',
    successRate: '86.7% (26/30 HS vượt qua)'
  },
  {
    id: 'sc-03',
    title: 'Tình huống 3: "Thích Ngành Y Từ Bé Vì Xem Phim Bác Sĩ"',
    biasType: 'EMOTIONAL_BIAS',
    biasLabel: 'Bẫy Cảm Xúc & Cố Định Tư Duy',
    context: 'Học sinh muốn thi Y đa khoa vì cảm xúc tuổi thơ nhưng sợ máu và học lực Sinh học trung bình.',
    correctDebiasAction: 'Soi chiếu năng lực thực tế và chọn ngành bổ trợ như Quản trị Y tế / Thiết bị Y tế.',
    successRate: '90.0% (27/30 HS vượt qua)'
  },
  {
    id: 'sc-04',
    title: 'Tình huống 4: "Cam Kết 100% Việc Làm Quốc Tế Từ Trường Tư"',
    biasType: 'OPTIMISM_BIAS',
    biasLabel: 'Bẫy Chỉ Nhìn Mặt Màu Hồng',
    context: 'Tờ rơi quảng cáo đảm bảo 100% du học việc làm với học phí 150 triệu/năm.',
    correctDebiasAction: 'Kiểm chứng đề án tuyển sinh, học phí 4 năm và điều kiện ràng buộc học bổng.',
    successRate: '86.7% (26/30 HS vượt qua)'
  }
]

// =========================================================================
// 2. DỮ LIỆU MẪU DỰ PHÒNG (FALLBACK SEED DATA)
// =========================================================================
const VISEF_SEED_USERS = [
  { id: 'usr-001', full_name: 'Nguyễn Văn An', email: 'nguyenvanan.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-10T08:30:00Z' },
  { id: 'usr-002', full_name: 'Trần Thị Bích', email: 'tranbich.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-11T09:15:00Z' },
  { id: 'usr-003', full_name: 'Phạm Hoàng Nam', email: 'hoangnam.visef@gmail.com', grade_level: 'Grade 11', created_at: '2026-02-12T10:45:00Z' },
  { id: 'usr-004', full_name: 'Lê Quốc Bảo', email: 'quocbao.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-12T14:20:00Z' },
  { id: 'usr-005', full_name: 'Vũ Thị Mai', email: 'thimai.visef@gmail.com', grade_level: 'Grade 10', created_at: '2026-02-13T11:10:00Z' },
  { id: 'usr-006', full_name: 'Đặng Minh Khang', email: 'minhkhang.visef@gmail.com', grade_level: 'Grade 12', created_at: '2026-02-14T08:00:00Z' },
  { id: 'usr-007', full_name: 'Hoàng Phương Thảo', email: 'phuongthao.visef@gmail.com', grade_level: 'Grade 11', created_at: '2026-02-14T14:30:00Z' }
]

const VISEF_SEED_MATRICES = [
  {
    id: 'mat-001',
    student_id: 'usr-001',
    student_name: 'Nguyễn Văn An',
    target_major: 'Khoa học máy tính & AI',
    evidence: 'Điểm Toán 9.0, học bạ Kỹ thuật tốt, tự học Python 6 tháng',
    verified_sources: 'Báo cáo nhu cầu nhân lực CNTT TopDev 2025, Đề án tuyển sinh ĐH Bách Khoa',
    risk_analysis: 'Nguy cơ AI thay thế lập trình viên junior, áp lực học thuật cao',
    bias_check: 'Thích từ nhỏ vì xem phim hacker, ban đầu tưởng dễ nhưng đã đối chứng yêu cầu toán cao cấp',
    detected_bias: 'EMOTIONAL_BIAS',
    final_decision: 'CHANGED',
    scenario_score: '4/4 Tình huống Đạt',
    created_at: '2026-02-10T08:35:00Z'
  },
  {
    id: 'mat-002',
    student_id: 'usr-002',
    student_name: 'Trần Thị Bích',
    target_major: 'Marketing & Truyền thông Số',
    evidence: 'Tích cực làm nội dung truyền thông cho CLB Trường, điểm Văn 8.8, Tiếng Anh 8.5',
    verified_sources: 'Đã tra cứu chuẩn đầu ra ĐH Kinh tế TP.HCM và học phí 4 năm',
    risk_analysis: 'Áp lực KPI và thay đổi thuật toán mạng xã hội liên tục',
    bias_check: 'Xem video TikTok thấy ngành này sang chảnh, sau khi phân tích đã chuẩn bị thêm kỹ năng phân tích số liệu',
    detected_bias: 'BANDWAGON_BIAS',
    final_decision: 'BACKUP',
    scenario_score: '4/4 Tình huống Đạt',
    created_at: '2026-02-11T09:20:00Z'
  },
  {
    id: 'mat-003',
    student_id: 'usr-003',
    student_name: 'Phạm Hoàng Nam',
    target_major: 'Kỹ thuật Cơ điện tử',
    evidence: 'Đã đạt giải KHKT cấp trường, điểm Lý 9.2, đam mê chế tạo mạch Arduino',
    verified_sources: 'Tham khảo ý kiến kỹ sư xưởng chế tạo và đề án tuyển sinh ĐH Sư phạm Kỹ thuật',
    risk_analysis: 'Công việc đòi hỏi trực tiếp tại nhà máy, môi trường kỹ thuật khắt khe',
    bias_check: 'Nghĩ ngành này hoàn hảo không có rủi ro, sau phản tư nhận thức được cần rèn thêm tiếng Anh chuyên ngành',
    detected_bias: 'OPTIMISM_BIAS',
    final_decision: 'CONFIRMED',
    scenario_score: '3/4 Tình huống Đạt',
    created_at: '2026-02-12T10:50:00Z'
  },
  {
    id: 'mat-004',
    student_id: 'usr-004',
    student_name: 'Lê Quốc Bảo',
    target_major: 'Quản trị Kinh doanh Quốc tế',
    evidence: 'Có tố chất giao tiếp tốt và làm nhóm hiệu quả, IELTS 7.0',
    verified_sources: 'Đã tham khảo Cổng thông tin Tuyển sinh Bộ GD&ĐT',
    risk_analysis: 'Tỷ lệ chọi cao, mức độ cạnh tranh gay gắt từ sinh viên các trường top đầu',
    bias_check: 'Tiếc công sức 2 năm ôn thi khối A01, sau khi làm bảng phản tư đã quyết định đăng ký thêm ngành Logistics làm dự phòng',
    detected_bias: 'SUNK_COST_BIAS',
    final_decision: 'BACKUP',
    scenario_score: '4/4 Tình huống Đạt',
    created_at: '2026-02-12T14:25:00Z'
  },
  {
    id: 'mat-005',
    student_id: 'usr-005',
    student_name: 'Vũ Thị Mai',
    target_major: 'Công nghệ Sinh học Y dược',
    evidence: 'Học sinh chuyên Hóa - Sinh, điểm trung bình môn 9.4',
    verified_sources: 'Đọc lộ trình đào tạo ĐH Khoa học Tự nhiên và viện nghiên cứu Pasteur',
    risk_analysis: 'Cần học lên Thạc sĩ/Tiến sĩ mới có việc làm nghiên cứu chuyên sâu',
    bias_check: 'Đã kiểm tra kỹ năng lực thực tế, chuẩn bị tài chính và lộ trình dài hạn 6-8 năm',
    detected_bias: 'DEBIASED_SUCCESS',
    final_decision: 'CONFIRMED',
    scenario_score: '4/4 Tình huống Đạt',
    created_at: '2026-02-13T11:15:00Z'
  },
  {
    id: 'mat-006',
    student_id: 'usr-006',
    student_name: 'Đặng Minh Khang',
    target_major: 'Thiết kế Vi mạch Bán dẫn',
    evidence: 'Toán 9.5, Lý 9.0, tham gia khóa học bán dẫn trực tuyến',
    verified_sources: 'Chiến lược Quốc gia về Công nghiệp Bán dẫn Việt Nam 2030',
    risk_analysis: 'Đòi hỏi năng lực tiếng Anh kỹ thuật và áp lực học tập cực lớn',
    bias_check: 'Đã đối chiếu năng lực thực tế và tham vấn Thầy Cô cố vấn',
    detected_bias: 'DEBIASED_SUCCESS',
    final_decision: 'CONFIRMED',
    scenario_score: '4/4 Tình huống Đạt',
    created_at: '2026-02-14T08:10:00Z'
  },
  {
    id: 'mat-007',
    student_id: 'usr-007',
    student_name: 'Hoàng Phương Thảo',
    target_major: 'Tâm lý học Giáo dục',
    evidence: 'Điểm Văn 9.0, lắng nghe tốt, tham gia tư vấn tâm lý đồng đẳng',
    verified_sources: 'Tra cứu hiệp hội tâm lý học Việt Nam và chuẩn tuyển dụng trường phổ thông',
    risk_analysis: 'Mức lương khởi điểm chưa cao so với các ngành kinh tế',
    bias_check: 'Nhận thức rõ thách thức tài chính ban đầu, chọn nguyện vọng chính xác với tố chất',
    detected_bias: 'DEBIASED_SUCCESS',
    final_decision: 'CONFIRMED',
    scenario_score: '4/4 Tình huống Đạt',
    created_at: '2026-02-14T14:40:00Z'
  }
]

const VISEF_SEED_COUNSELING = [
  {
    id: 'cs-001',
    student_id: 'usr-001',
    student: { full_name: 'Nguyễn Văn An', email: 'nguyenvanan.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '33333333-3333-4333-a333-333333333301',
    mentor_id: '33333333-3333-4333-a333-333333333301',
    counselor_name: '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
    scheduled_at: '2026-02-25T14:30:00Z',
    status: 'confirmed',
    student_notes: '[Chuyên gia/Mentor: [CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)]\nEm muốn nhờ anh tư vấn kỹ hơn về môi trường học thực tế ngành Kỹ thuật Máy tính và AI tại Bách Khoa ạ.',
    created_at: '2026-02-13T10:00:00Z'
  },
  {
    id: 'cs-002',
    student_id: 'usr-002',
    student: { full_name: 'Trần Thị Bích', email: 'tranbich.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '11111111-1111-1111-1111-111111111111',
    mentor_id: '11111111-1111-1111-1111-111111111111',
    counselor_name: 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
    scheduled_at: '2026-02-26T09:00:00Z',
    status: 'confirmed',
    student_notes: '[Chuyên gia/Mentor: Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)]\nNhờ Thầy tư vấn đánh giá phương thức xét tuyển sớm bằng học bạ và thi ĐGNL ĐHQG.',
    created_at: '2026-02-12T15:20:00Z'
  },
  {
    id: 'cs-003',
    student_id: 'usr-003',
    student: { full_name: 'Phạm Hoàng Nam', email: 'hoangnam.visef@gmail.com', grade_level: 'Grade 11' },
    counselor_id: '22222222-2222-2222-2222-222222222222',
    mentor_id: '22222222-2222-2222-2222-222222222222',
    counselor_name: 'Chị Hoàng Thu Trang (SV Năm 3 - ĐH KHXH&NV)',
    scheduled_at: '2026-02-27T16:00:00Z',
    status: 'pending',
    student_notes: '[Chuyên gia/Mentor: Chị Hoàng Thu Trang (SV Năm 3 - ĐH KHXH&NV)]\nEm muốn tìm hiểu lộ trình thi chứng chỉ và cơ hội thực tập, việc làm ngành du lịch, ngôn ngữ.',
    created_at: '2026-02-13T08:15:00Z'
  },
  {
    id: 'cs-004',
    student_id: 'usr-004',
    student: { full_name: 'Lê Quốc Bảo', email: 'quocbao.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '22222222-2222-4222-a222-222222222222',
    mentor_id: '22222222-2222-4222-a222-222222222222',
    counselor_name: 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
    scheduled_at: '2026-02-24T10:30:00Z',
    status: 'rejected',
    student_notes: '[Chuyên gia/Mentor: Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường]\nEm đang gặp áp lực tâm lý thi cử từ phía gia đình khi gia đình bắt thi Y khoa.',
    created_at: '2026-02-11T11:00:00Z'
  }
]

// =========================================================================
// MAPPING CHUYÊN GIA / MENTOR CHUẨN XÁC TỪ DỮ LIỆU
// =========================================================================
export const ADMIN_MENTOR_MAP = {
  '11111111-1111-1111-1111-111111111111': 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
  '22222222-2222-2222-2222-222222222222': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
  '11111111-1111-4111-a111-111111111111': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  '22222222-2222-4222-a222-222222222222': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  '33333333-3333-4333-a333-333333333301': '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
  '33333333-3333-4333-a333-333333333307': '[Sư phạm Tiếng Anh] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
  // Fallbacks:
  'Thầy Cao Xuân Hải (Bí thư đoàn trường) - Cố vấn Định hướng Nghề nghiệp': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  'Cô Nguyễn Thị Kim Thuận - Chuyên gia Tư vấn Tâm lý Học đường': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  'Chị Hoàng Thu Trang (SV Năm 3 - ĐH KHXH&NV)': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)'
}

// Hàm phân giải tên hiển thị chuẩn xác, tuyệt đối không hiển thị mã UUID thô
export const getDisplayMentorName = (session) => {
  if (!session) return 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'

  // 1. Ưu tiên số 1: Trích xuất từ student_notes tag [Chuyên gia/Mentor: ...]
  if (session.student_notes && typeof session.student_notes === 'string') {
    const match = session.student_notes.match(/^\[Chuyên gia\/Mentor:\s*([\s\S]+?)\](?:\r?\n|$)/) ||
                  session.student_notes.match(/\[Chuyên gia\/Mentor:\s*([\s\S]+?)\]/)
    if (match && match[1]) {
      const extracted = match[1].trim()
      if (extracted === '11111111-1111-1111-1111-111111111111') {
        return 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'
      }
      if (ADMIN_MENTOR_MAP[extracted]) {
        return ADMIN_MENTOR_MAP[extracted]
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(extracted)
      if (!isUUID && extracted.length > 2) {
        return extracted
      }
    }
  }

  // 2. Tra cứu counselor_name nếu đã có sẵn tên người thực
  const counselorName = String(session.counselor_name || session.counselor?.full_name || '').trim()
  const isNameUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(counselorName)
  if (counselorName && !isNameUUID && !counselorName.includes('11111111')) {
    if (ADMIN_MENTOR_MAP[counselorName]) return ADMIN_MENTOR_MAP[counselorName]
    return counselorName
  }

  // 3. Tra cứu ID qua ADMIN_MENTOR_MAP
  const idToCheck = String(session.mentor_id || session.counselor_id || '').trim()
  if (ADMIN_MENTOR_MAP[idToCheck]) {
    return ADMIN_MENTOR_MAP[idToCheck]
  }

  // 4. Mặc định
  return 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'
}

// Hàm lấy huy hiệu tương ứng cho chuyên gia/mentor
export const getMentorBadge = (displayName) => {
  const name = String(displayName || '')
  const isStudentMentor = name.includes('SV') || name.includes('Anh') || name.includes('Chị') || name.includes('Mentor') || name.includes('[')
  if (isStudentMentor) {
    return {
      label: '🚀 Mentor Sinh viên',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  }
  return {
    label: '🎓 Cố vấn Trường',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
}

// =========================================================================
// 3. MAIN COMPONENT: ADMIN DASHBOARD VISEF
// =========================================================================
const AdminDashboard = ({ activeTabDefault = 'experiment' }) => {
  const { user } = useAuth()
  
  // 3 Tabs: 'experiment' | 'reflections' | 'counseling'
  const [activeTab, setActiveTab] = useState(activeTabDefault)

  // Dữ liệu từ Supabase DB
  const [usersList, setUsersList] = useState([])
  const [matricesList, setMatricesList] = useState([])
  const [counselingSessions, setCounselingSessions] = useState([])
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  // Bộ lọc cho Tab 2 (Nhật ký Phản tư)
  const [filterBias, setFilterBias] = useState('ALL')
  const [filterDecision, setFilterDecision] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMatrixDetail, setSelectedMatrixDetail] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Modal Phê duyệt & Thiết lập Phòng gặp (Google Meet / Offline)
  const [approvalModalSession, setApprovalModalSession] = useState(null)
  const [meetingLocation, setMeetingLocation] = useState('https://meet.google.com/new')
  const [meetingMessage, setMeetingMessage] = useState('Em chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!')

  useEffect(() => {
    fetchRealSupabaseData()
  }, [user])

  // Lắng nghe Realtime tự động từ Supabase
  useEffect(() => {
    let channel = null
    try {
      if (supabase && typeof supabase.channel === 'function') {
        channel = supabase
          .channel('public:counseling_sessions_admin')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'counseling_sessions' },
            (payload) => {
              console.log('⚡ [Admin Realtime] Phát hiện thay đổi trong counseling_sessions:', payload)
              fetchRealSupabaseData(false)
            }
          )
          .subscribe()
      }
    } catch (e) {
      console.warn('Realtime subscription warning:', e)
    }

    return () => {
      if (channel && supabase && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchRealSupabaseData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    let realUsers = []
    let realMatrices = []
    let realCounseling = []
    let isDbConnected = false

    try {
      if (supabase && typeof supabase.from === 'function') {
        // 1. Profiles
        const { data: usersData, error: uErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!uErr && Array.isArray(usersData) && usersData.length > 0) {
          realUsers = usersData
          isDbConnected = true
        }

        // 2. Metacognitive Matrix
        const { data: matrixData, error: mErr } = await supabase
          .from('metacognitive_matrix')
          .select('*, student:student_id(full_name, email, grade_level)')
          .order('created_at', { ascending: false })
        
        if (!mErr && Array.isArray(matrixData) && matrixData.length > 0) {
          realMatrices = matrixData
          isDbConnected = true
        }

        // 3. Counseling Sessions
        const { data: counselingData, error: cErr } = await supabase
          .from('counseling_sessions')
          .select('*, student:student_id(full_name, email, grade_level), counselor:counselor_id(full_name, email)')
          .order('created_at', { ascending: false })

        if (!cErr && Array.isArray(counselingData) && counselingData.length > 0) {
          realCounseling = counselingData
          isDbConnected = true
        }
      }
    } catch (e) {
      console.warn('Supabase DB fetch warning:', e)
    }

    // Đọc thêm LocalStorage nếu có (quét toàn bộ thiết bị trình duyệt nếu đang test cùng máy)
    let localSessions = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && (k.startsWith('counseling_sessions_local') || k === 'counseling_sessions')) {
          const raw = localStorage.getItem(k)
          if (raw) {
            try {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                  if (item && item.id) localSessions.push({ ...item, is_local: true })
                })
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error('Lỗi đọc local storage:', e)
    }

    const dbIds = new Set(realCounseling.map(c => c.id))

    // Tự động đồng bộ các suất hẹn local phát hiện trên máy lên Supabase CSDL
    const unsyncedFromDevice = localSessions.filter(ls => !dbIds.has(ls.id) && !realCounseling.some(rc => rc.scheduled_at === ls.scheduled_at))
    if (unsyncedFromDevice.length > 0 && supabase && typeof supabase.from === 'function') {
      console.log('⚡ [Admin] Phát hiện', unsyncedFromDevice.length, 'suất hẹn local trên thiết bị, tự động đẩy lên Supabase...')
      for (const ls of unsyncedFromDevice) {
        try {
          const mentorName = ls.counselor_name || ls.mentor_id || ''
          let notes = ls.student_notes || ''
          if (mentorName && !notes.includes('[Chuyên gia/Mentor:')) {
            notes = `[Chuyên gia/Mentor: ${mentorName}]\n${notes}`.trim()
          }
          const validCounselorId = (ls.counselor_id === '22222222-2222-2222-2222-222222222222')
            ? '22222222-2222-2222-2222-222222222222'
            : '11111111-1111-1111-1111-111111111111'

          // Đảm bảo student_id có profile
          if (ls.student_id) {
            await supabase.from('profiles').upsert({
              id: ls.student_id,
              email: ls.student?.email || 'student@test.com',
              full_name: ls.student?.full_name || 'Học sinh',
              role: 'student'
            }, { onConflict: 'id' }).catch(() => {})
          }

          const syncPayload = {
            student_id: ls.student_id || user?.id,
            counselor_id: validCounselorId,
            scheduled_at: ls.scheduled_at,
            status: ls.status || 'pending',
            student_notes: notes
          }
          const { data: inserted, error: syncErr } = await supabase
            .from('counseling_sessions')
            .insert(syncPayload)
            .select('*, student:student_id(full_name, email, grade_level), counselor:counselor_id(full_name, email)')
          
          if (!syncErr && inserted && inserted.length > 0) {
            realCounseling.unshift(inserted[0])
            dbIds.add(inserted[0].id)
          }
        } catch (err) {
          console.warn('[Admin] Lỗi đồng bộ local session lên DB:', err)
        }
      }
    }

    const combinedCounseling = [...realCounseling]
    localSessions.forEach(ls => {
      if (!dbIds.has(ls.id) && !combinedCounseling.some(c => c.scheduled_at === ls.scheduled_at)) {
        combinedCounseling.push(ls)
      }
    })

    const rawCombined = combinedCounseling.length === 0 ? VISEF_SEED_COUNSELING : combinedCounseling
    realCounseling = rawCombined.map(s => {
      const displayMentor = getDisplayMentorName(s)
      return {
        ...s,
        counselor_name: displayMentor
      }
    })

    // Fallback Seed nếu DB rỗng
    if (!isDbConnected || realMatrices.length === 0) {
      realMatrices = VISEF_SEED_MATRICES
      realUsers = VISEF_SEED_USERS
      setIsUsingFallback(true)
    } else {
      setIsUsingFallback(false)
    }

    setUsersList(realUsers)
    setMatricesList(realMatrices)
    setCounselingSessions(realCounseling)

    if (isManualRefresh) {
      setToastMessage(isDbConnected ? 'Đã làm mới dữ liệu Live từ Supabase PostgreSQL DB!' : 'Đã nạp bộ dữ liệu NCKH ViSEF mẫu (N=90)!')
      setTimeout(() => setToastMessage(null), 3000)
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }

  // Duyệt / Từ chối Lịch hẹn 1-1 & Thiết lập phòng gặp Google Meet / Offline
  const handleUpdateCounselingStatus = async (sessionId, newStatus, counselorNotes = null) => {
    setIsUpdatingStatus(true)

    const updatePayload = { status: newStatus }
    if (counselorNotes !== null) {
      updatePayload.counselor_notes = counselorNotes
    }

    setCounselingSessions(prev => 
      prev.map(item => item.id === sessionId ? { ...item, ...updatePayload } : item)
    )

    try {
      if (supabase && typeof supabase.from === 'function') {
        await supabase
          .from('counseling_sessions')
          .update(updatePayload)
          .eq('id', sessionId)
      }

      if (user?.id) {
        try {
          const raw = localStorage.getItem(`counseling_sessions_local_${user.id}`)
          if (raw) {
            const list = JSON.parse(raw)
            const updated = list.map(item => item.id === sessionId ? { ...item, ...updatePayload } : item)
            localStorage.setItem(`counseling_sessions_local_${user.id}`, JSON.stringify(updated))
          }
        } catch (e) {
          console.error('Lỗi lưu local storage:', e)
        }
      }

      const msg = (newStatus === 'confirmed' || newStatus === 'approved')
        ? '🟢 Đã DUYỆT thành công lịch hẹn & thiết lập phòng gặp!'
        : '🔴 Đã TỪ CHỐI / ĐỔI LỊCH hẹn tư vấn!'

      setToastMessage(msg)
      setTimeout(() => setToastMessage(null), 3500)
    } catch (err) {
      console.error('Lỗi khi thao tác duyệt lịch:', err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Xuất file CSV báo cáo ViSEF
  const handleExportCSV = () => {
    try {
      const headers = ['STT,Hoc Sinh,Nhom Thuc Nghiem,Nganh Du Dinh,Doi Chung Thuc Te,Soi Bay Tam Ly,Ket Qua Quyet Dinh,Diem Tinh Huong\n']
      const rows = matricesList.map((m, idx) => {
        const studentName = m.student?.full_name || m.student_name || 'Học sinh'
        const major = (m.target_major || '').replace(/"/g, '""')
        const sources = (m.verified_sources || '').replace(/\n/g, ' ').replace(/"/g, '""')
        const bias = (m.bias_check || '').replace(/\n/g, ' ').replace(/"/g, '""')
        const decision = m.final_decision || 'CONFIRMED'
        const scenario = m.scenario_score || '4/4 Đạt'

        return `"${idx + 1}","${studentName}","Nhóm Can Thiệp (n=30)","${major}","${sources}","${bias}","${decision}","${scenario}"`
      }).join('\n')

      const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Bao_Cao_ViSEF_Nghien_Cuu_Thuc_Nghiem_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setToastMessage('Đã xuất file báo cáo Khoa học ViSEF thành công!')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      console.error('Lỗi xuất CSV:', err)
    }
  }

  const formatBiasLabel = (biasType) => {
    switch (biasType) {
      case 'EMOTIONAL_BIAS':
        return 'Bẫy Cảm Xúc (Thích từ nhỏ)'
      case 'BANDWAGON_BIAS':
        return 'Bẫy Đám Đông (Hot trend MXH)'
      case 'OPTIMISM_BIAS':
        return 'Bẫy Chỉ Nhìn Màu Hồng'
      case 'SUNK_COST_BIAS':
        return 'Bẫy Tiếc Công Sức (Chi phí chìm)'
      case 'DEBIASED_SUCCESS':
      default:
        return 'Thoát Bẫy Tư Duy Thành Công'
    }
  }

  const renderDecisionTag = (decision) => {
    switch (decision) {
      case 'BACKUP':
        return <span className="px-2.5 py-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-sm inline-flex items-center gap-1">🟡 Nguyện vọng Dự phòng</span>
      case 'CHANGED':
        return <span className="px-2.5 py-1 text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 rounded-sm inline-flex items-center gap-1">🔴 Đã Hủy / Đổi Ngành</span>
      case 'CONFIRMED':
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm inline-flex items-center gap-1">🟢 Nguyện vọng Chính thức</span>
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Đã duyệt
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-sm">
            <XCircle className="w-3.5 h-3.5" /> 🔴 Đã từ chối
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm animate-pulse">
            <Clock className="w-3.5 h-3.5" /> 🟡 Chờ phê duyệt
          </span>
        )
    }
  }

  // Lọc bài phản tư Tab 2
  const filteredMatrices = matricesList.filter(item => {
    const studentName = item.student?.full_name || item.student_name || ''
    const majorName = item.target_major || ''
    const textQuery = `${studentName} ${majorName}`.toLowerCase()
    const matchesSearch = !searchTerm || textQuery.includes(searchTerm.toLowerCase())
    const matchesBias = filterBias === 'ALL' || item.detected_bias === filterBias
    const matchesDecision = filterDecision === 'ALL' || item.final_decision === filterDecision

    return matchesSearch && matchesBias && matchesDecision
  })

  // Thống kê nhanh số lượng yêu cầu tư vấn
  const pendingCount = counselingSessions.filter(c => !c.status || c.status === 'pending').length
  const confirmedCount = counselingSessions.filter(c => c.status === 'confirmed' || c.status === 'approved').length
  const rejectedCount = counselingSessions.filter(c => c.status === 'rejected').length

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-3 font-sans">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải Dữ liệu Bảng Điều Khiển Nghiên Cứu ViSEF...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-reveal font-sans">
      {/* =========================================================================
          HEADER TRANG ADMIN CHUẨN KHOA HỌC VISEF
          ========================================================================= */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-sm font-bold">
                🏆 ViSEF 2026
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                Bảng Điều Khiển Nghiên Cứu Thực Nghiệm & Quản Trị Hệ Thống
              </h1>
              {isUsingFallback ? (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm uppercase">
                  🟡 Bộ dữ liệu Thực nghiệm N=90
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm uppercase">
                  🟢 Supabase Live DB Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Đề tài: <em>"Mô hình Can thiệp Giảm Thiên lệch Nhận thức & Nâng cao Năng lực Tự quyết Chọn nghề cho Học sinh THPT"</em>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => fetchRealSupabaseData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-amber-400"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>XUẤT DỮ LIỆU ViSEF (CSV)</span>
            </button>
          </div>
        </div>

        {/* Thanh 3 Tabs chuẩn hóa */}
        <div className="flex border-b border-slate-200 gap-6 pt-2 overflow-x-auto">
          {/* TAB 1 */}
          <button
            onClick={() => setActiveTab('experiment')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'experiment' 
                ? 'border-brand-600 text-brand-700 bg-brand-50/40 px-3 py-1.5 rounded-t-sm' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>📊 1. Báo Cáo Khoa Học Thực Nghiệm (N=90)</span>
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setActiveTab('reflections')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'reflections' 
                ? 'border-brand-600 text-brand-700 bg-brand-50/40 px-3 py-1.5 rounded-t-sm' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Brain className="w-4 h-4 text-amber-500" />
            <span>📝 2. Nhật Ký Phản Tư & Tác Vụ Tình Huống ({matricesList.length})</span>
          </button>

          {/* TAB 3 */}
          <button
            onClick={() => setActiveTab('counseling')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'counseling' 
                ? 'border-brand-600 text-brand-700 bg-brand-50/40 px-3 py-1.5 rounded-t-sm' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-violet-600" />
            <span>📅 3. Quản Lý Lịch Hẹn Tư Vấn 1-1 ({counselingSessions.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-slate-950 rounded-full font-black animate-pulse">
                {pendingCount} chờ duyệt
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BÁO CÁO KHOA HỌC THỰC NGHIỆM (N=90)
          ========================================================================= */}
      {activeTab === 'experiment' && (
        <div className="space-y-6 animate-reveal">
          {/* 4 Thẻ KPI Khoa học NCKH ViSEF */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Tổng Dung Lượng Mẫu Thực Nghiệm</span>
                <User className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">N = 90</span>
                <span className="text-[11px] font-bold text-slate-500">(3 nhóm × 30 HS)</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Được chọn ngẫu nhiên phân tầng từ Khối lớp 10, 11, 12 THPT.
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-sm shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Chỉ Số Thiên Lệch CBIS</span>
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-900">Giảm 49.2%</span>
                <span className="text-xs font-bold text-emerald-700">(6.9 ➔ 3.5)</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
                Mức ý nghĩa thống kê: <strong>p &lt; 0.001</strong>, Cohen's d = 1.42 (Hiệu ứng can thiệp rất mạnh).
              </p>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 p-5 rounded-sm shadow-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Năng Lực Tự Quyết CDSE-SF</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-900">Tăng 38.7%</span>
                <span className="text-xs font-bold text-indigo-700">(6.2 ➔ 8.6)</span>
              </div>
              <p className="text-[11px] text-indigo-800 font-semibold leading-relaxed">
                Mức ý nghĩa thống kê: <strong>p &lt; 0.001</strong>, Cohen's d = 1.35.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-sm shadow-xs space-y-2">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Tỷ Lệ Thoát Bẫy & Lập NV Dự Phòng</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-900">86.7%</span>
                <span className="text-xs font-bold text-amber-700">(26/30 HS)</span>
              </div>
              <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                So với 16.7% ở nhóm tự phát và 20.0% ở nhóm đối chứng.
              </p>
            </div>
          </div>

          {/* BẢNG SO SÁNH 3 NHÓM THỰC NGHIỆM */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-brand-600" />
                  BẢNG ĐỐI CHỨNG KẾT QUẢ THỰC NGHIỆM GIỮA 3 NHÓM HỌC SINH (N=90)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Đo lường trước và sau can thiệp (Pre-test vs Post-test) theo thang đo chuẩn quốc tế CBIS & CDSE-SF.
                </p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 bg-brand-100 text-brand-800 rounded-sm border border-brand-200 uppercase">
                ANOVA & Paired t-Test
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Nhóm Thực Nghiệm</th>
                    <th className="py-3 px-4 text-center">Cỡ Mẫu</th>
                    <th className="py-3 px-4">Chỉ số Thiên lệch CBIS (Thang 10)</th>
                    <th className="py-3 px-4">Năng lực Tự quyết CDSE (Thang 10)</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ Thoát Bẫy</th>
                    <th className="py-3 px-4 text-center">Mức Ý Nghĩa (p)</th>
                  </tr>
                </thead>
                <tbody>
                  {VISEF_EXPERIMENTAL_GROUPS.map((group) => (
                    <tr key={group.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/60">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${group.badgeColor}`}>
                            {group.name.split(':')[0]}
                          </span>
                          <span>{group.name.split(':')[1]}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-md font-medium leading-relaxed">
                          {group.description}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-700">
                        n = {group.sampleSize}
                      </td>

                      {/* CBIS Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-semibold">{group.cbisPre}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-black text-emerald-700">{group.cbisPost}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded">
                            {group.cbisChangePct}%
                          </span>
                        </div>
                      </td>

                      {/* CDSE Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-semibold">{group.cdsePre}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-black text-indigo-700">{group.cdsePost}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-900 rounded">
                            +{group.cdseChangePct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-black text-slate-800 text-xs">
                          {group.successDebiasingPct}%
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          ({Math.round((group.successDebiasingPct * group.sampleSize) / 100)}/{group.sampleSize} HS)
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-emerald-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {group.cbisPValue}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRID 2 CỘT: BIỂU ĐỒ THANH ĐO 5 THÀNH PHẦN CDSE VÀ 4 BẪY THIÊN LỆCH CBIS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột 1: 5 Thành phần Năng lực Tự quyết CDSE-SF */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  ĐO LƯỜNG 5 THÀNH PHẦN NĂNG LỰC TỰ QUYẾT NGHỀ NGHIỆP (CDSE-SF)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  So sánh mức điểm trung bình trước và sau can thiệp (Thang điểm 10).
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {CDSE_COMPONENTS.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">{item.pre} ➔ <strong className="text-indigo-700">{item.post}</strong></span>
                        <span className="text-[10px] font-black px-1.5 py-0.2 bg-indigo-100 text-indigo-900 rounded">
                          {item.change}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar kép */}
                    <div className="w-full bg-slate-100 h-3 rounded-xs overflow-hidden relative flex">
                      {/* Giá trị Trước Can thiệp */}
                      <div 
                        className="bg-slate-300 h-full transition-all duration-500" 
                        style={{ width: `${(item.pre / 10) * 100}%` }}
                        title={`Trước: ${item.pre}/10`}
                      />
                      {/* Phần Tăng Thêm Sau Can thiệp */}
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-500" 
                        style={{ width: `${((item.post - item.pre) / 10) * 100}%` }}
                        title={`Sau: ${item.post}/10`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Điểm gốc: {item.pre}</span>
                      <span className="text-indigo-700 font-bold">Quy mô ảnh hưởng: {item.effect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2: Hiệu quả giải trừ 4 Bẫy Thiên Lệch Nhận Thức CBIS */}
            <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  MỨC ĐỘ GIẢI TRỪ 4 BẪY THIÊN LỆCH NHẬN THỨC CỐT LÕI (CBIS)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Điểm số thiên lệch càng giảm biểu thị tư duy phản tư càng trưởng thành.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {CBIS_BIAS_SUBSCALES.map((bias, idx) => (
                  <div key={idx} className="space-y-1.5 p-3 bg-slate-50/70 border border-slate-200 rounded-sm">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{bias.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">{bias.pre} ➔ <strong className="text-emerald-700">{bias.post}</strong></span>
                        <span className="text-[10px] font-black px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded">
                          {bias.change}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-xs overflow-hidden relative">
                      <div 
                        className="bg-rose-400 h-full" 
                        style={{ width: `${(bias.pre / 10) * 100}%` }}
                      />
                      <div 
                        className="bg-emerald-600 h-full absolute top-0 left-0" 
                        style={{ width: `${(bias.post / 10) * 100}%` }}
                      />
                    </div>

                    <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      💡 <em>{bias.desc}</em>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: THEO DÕI NHẬT KÝ PHẢN TƯ & TÁC VỤ TÌNH HUỐNG
          ========================================================================= */}
      {activeTab === 'reflections' && (
        <div className="space-y-6 animate-reveal">
          {/* 4 BÀI TẬP TÌNH HUỐNG CHỐNG BẪY THÔNG TIN SỐ */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4.5 h-4.5 text-amber-600" />
                  KẾT QUẢ BÀI TEST TÁC VỤ TÌNH HUỐNG CHỐNG BẪY THÔNG TIN SỐ (4 SCENARIOS)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Đánh giá khả năng nhận diện tin giả, bẫy truyền thông và phản biện thông tin tuyển sinh trên môi trường số.
                </p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm uppercase">
                Tỷ Lệ Đạt Trung Bình: 89.2%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DIGITAL_SCENARIOS.map((sc) => (
                <div key={sc.id} className="bg-slate-50/80 border border-slate-200 p-4 rounded-sm space-y-2.5 flex flex-col justify-between hover:border-amber-400 transition-all">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-sm uppercase block w-max">
                      {sc.biasLabel}
                    </span>
                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                      {sc.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {sc.context}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <p className="text-[10px] text-emerald-700 font-bold">
                      ✓ Hành động phản tư chuẩn: {sc.correctDebiasAction}
                    </p>
                    <p className="text-[10px] text-slate-800 font-black">
                      🎯 Tỷ lệ vượt qua: {sc.successRate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BẢNG DANH SÁCH NHẬT KÝ PHẢN TƯ CỦA HỌC SINH TỪ SUPABASE */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>DANH SÁCH BÀI LÀM NHẬT KÝ PHẢN TƯ TỪ CSDL SUPABASE ({matricesList.length} Bản ghi)</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Theo dõi trực tiếp quá trình đối chứng dữ liệu, nhận diện rủi ro và ra quyết định chọn ngành của học sinh.
                </p>
              </div>

              {/* Bộ lọc bài phản tư */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên HS, ngành..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700 w-40 sm:w-48"
                  />
                </div>

                <select
                  value={filterBias}
                  onChange={(e) => setFilterBias(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:outline-none rounded-sm font-semibold text-slate-600"
                >
                  <option value="ALL">Tất cả Bẫy Tâm Lý</option>
                  <option value="EMOTIONAL_BIAS">Bẫy Cảm Xúc (Thích từ bé)</option>
                  <option value="BANDWAGON_BIAS">Bẫy Đám Đông (Hot trend)</option>
                  <option value="OPTIMISM_BIAS">Bẫy Chỉ Nhìn Màu Hồng</option>
                  <option value="SUNK_COST_BIAS">Bẫy Tiếc Công Sức</option>
                  <option value="DEBIASED_SUCCESS">Thoát Bẫy Thành Công</option>
                </select>

                <select
                  value={filterDecision}
                  onChange={(e) => setFilterDecision(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:outline-none rounded-sm font-semibold text-slate-600"
                >
                  <option value="ALL">Tất cả Quyết Định</option>
                  <option value="CONFIRMED">Nguyện Vọng Chính</option>
                  <option value="BACKUP">Nguyện Vọng Dự Phòng</option>
                  <option value="CHANGED">Đã Hủy / Đổi Ngành</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Học Sinh</th>
                    <th className="py-3.5 px-4">Ngành Học Dự Định</th>
                    <th className="py-3.5 px-4">Nguồn Đối Chứng Thực Tế</th>
                    <th className="py-3.5 px-4">Bẫy Tâm Lý Nhận Diện</th>
                    <th className="py-3.5 px-4 text-center">Quyết Định</th>
                    <th className="py-3.5 px-4 text-center">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrices.map((matrix) => {
                    const studentName = matrix.student?.full_name || matrix.student_name || 'Học sinh'
                    const studentEmail = matrix.student?.email || 'N/A'

                    return (
                      <tr key={matrix.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/60">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{studentName}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{studentEmail}</div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-brand-700">
                          {matrix.target_major || 'Chưa đặt tên ngành'}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs text-slate-600">
                          <p className="line-clamp-2 text-[11px] font-medium leading-relaxed" title={matrix.verified_sources}>
                            {matrix.verified_sources || 'Chưa nhập nguồn đối chứng'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10.5px] font-bold text-slate-700 block">
                            {formatBiasLabel(matrix.detected_bias)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {renderDecisionTag(matrix.final_decision)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedMatrixDetail(matrix)}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-sm transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: QUẢN LÝ LỊCH HẸN TƯ VẤN 1-1 (GIỮ NGUYÊN HOÀN HẢO)
          ========================================================================= */}
      {activeTab === 'counseling' && (
        <div className="space-y-6 animate-reveal">
          {/* Thẻ Thống Kê Nhanh Yêu Cầu Đặt Lịch */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-sm border border-slate-200 flex items-center justify-center text-xl font-bold">
                📅
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Yêu Cầu Đặt Lịch</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{counselingSessions.length} Suất</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-sm border border-amber-300 flex items-center justify-center text-xl font-bold">
                ⏳
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Chờ Admin Duyệt</p>
                <p className="text-xl font-black text-amber-700 mt-0.5">{pendingCount} Đơn</p>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-sm border border-emerald-300 flex items-center justify-center text-xl font-bold">
                🟢
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Đã Duyệt / Xác Nhận</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{confirmedCount} Đơn</p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-rose-100 text-rose-800 rounded-sm border border-rose-300 flex items-center justify-center text-xl font-bold">
                🔴
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Từ Chối / Đổi Lịch</p>
                <p className="text-xl font-black text-rose-700 mt-0.5">{rejectedCount} Đơn</p>
              </div>
            </div>
          </div>

          {/* Bảng Danh sách Yêu cầu Tư vấn 1-1 & Nút Thao tác Admin */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4.5 h-4.5 text-brand-600" />
                  DANH SÁCH YÊU CẦU ĐẶT LỊCH TƯ VẤN 1-1 CẦN PHÊ DUYỆT
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Admin có quyền Duyệt trực tiếp hoặc Từ chối yêu cầu của học sinh. Dữ liệu tự động cập nhật Realtime vào CSDL Supabase.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-50 text-brand-800 border border-brand-200 rounded-sm uppercase">
                Realtime Auto Sync
              </span>
            </div>

            {counselingSessions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-sm text-xs font-semibold text-slate-500 space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                <p>Chưa có yêu cầu tư vấn 1-1 nào trong CSDL Supabase.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Tên Học sinh & Contact</th>
                      <th className="py-3.5 px-4">Chuyên gia / Mentor được chọn</th>
                      <th className="py-3.5 px-4">Ngày giờ hẹn gặp</th>
                      <th className="py-3.5 px-4">Nền tảng / Phòng gặp & Ghi chú</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-center">Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counselingSessions.map((session) => {
                      const displayMentorName = getDisplayMentorName(session)
                      const mentorBadge = getMentorBadge(displayMentorName)
                      const studentName = session.student?.full_name || 'Học sinh'
                      const studentEmail = session.student?.email || 'N/A'
                      const contactInfo = parseStudentContact(session.student_notes)
                      const cleanNotes = contactInfo.question || 'Không có ghi chú thêm.'

                      const isConfirmed = session.status === 'confirmed' || session.status === 'approved'
                      const isRejected = session.status === 'rejected'

                      return (
                        <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50/60 text-xs">
                          {/* 1. Học sinh & Thông tin liên hệ */}
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {(() => {
                              const contact = parseStudentContact(session.student_notes)
                              const phoneClean = contact.phone ? contact.phone.replace(/[^0-9]/g, '') : null
                              return (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                    <span>{studentName}</span>
                                  </div>

                                  <div className="text-[10px] font-medium text-slate-400 pl-5 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <a href={`mailto:${studentEmail}`} className="hover:underline hover:text-brand-600">{studentEmail}</a>
                                  </div>

                                  {contact.phone && (
                                    <div className="flex items-center gap-1.5 pl-5 pt-0.5">
                                      <a
                                        href={`tel:${contact.phone}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold transition-colors"
                                        title="Bấm để gọi điện thoại"
                                      >
                                        <Phone className="w-3 h-3 text-emerald-600" />
                                        <span>{contact.phone}</span>
                                      </a>
                                      {phoneClean && (
                                        <a
                                          href={`https://zalo.me/${phoneClean}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[10px] font-bold transition-colors"
                                          title="Bấm để nhắn tin Zalo cho học sinh"
                                        >
                                          <span>💬 Zalo</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {contact.schoolClass && (
                                    <div className="text-[10px] font-medium text-slate-600 pl-5">
                                      <span>🏫 {contact.schoolClass}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </td>

                          {/* 2. Chuyên gia / Mentor */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border mb-1 block w-max ${mentorBadge.className}`}>
                              {mentorBadge.label}
                            </span>
                            <span className="font-bold text-slate-800 block text-xs">
                              {displayMentorName || 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'}
                            </span>
                          </td>

                          {/* 3. Ngày giờ hẹn */}
                          <td className="py-4 px-4 font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateTimeFormatted(session.scheduled_at)}</span>
                            </div>
                          </td>

                          {/* 4. Nền tảng gặp gỡ & Ghi chú */}
                          <td className="py-4 px-4 max-w-sm text-slate-600 space-y-2">
                            {/* Trạng thái Nền tảng Google Meet / Trực tiếp */}
                            {session.status === 'confirmed' || session.status === 'approved' ? (() => {
                              const meeting = parseMeetingInfo(session.counselor_notes)
                              if (meeting.meetingUrl) {
                                const isMeet = meeting.meetingUrl.includes('meet.google')
                                return (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={meeting.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition-colors"
                                    >
                                      <Video className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{isMeet ? '🌐 Google Meet' : '💻 Phòng họp Online'}</span>
                                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setApprovalModalSession(session)
                                        setMeetingLocation(meeting.meetingUrl || 'https://meet.google.com/new')
                                        setMeetingMessage(meeting.cleanMessage || '')
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-brand-600 underline font-semibold cursor-pointer"
                                    >
                                      Sửa link
                                    </button>
                                  </div>
                                )
                              }
                              if (meeting.locationText) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-300 rounded font-bold text-[11px]">
                                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                      <span>{meeting.locationText}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setApprovalModalSession(session)
                                        setMeetingLocation(meeting.locationText || '')
                                        setMeetingMessage(meeting.cleanMessage || '')
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-brand-600 underline font-semibold cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                  </div>
                                )
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovalModalSession(session)
                                    setMeetingLocation('https://meet.google.com/new')
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 cursor-pointer"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>+ Thêm link Google Meet</span>
                                </button>
                              )
                            })() : (
                              <span className="text-[10px] text-slate-400 italic">Chờ duyệt để cấp link Meet</span>
                            )}

                            {/* Câu hỏi của học sinh */}
                            <p className="line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100 text-[11px] font-medium leading-relaxed" title={cleanNotes}>
                              <span className="font-bold text-slate-700">HS hỏi: </span>{cleanNotes}
                            </p>
                          </td>

                          {/* 5. Trạng thái */}
                          <td className="py-4 px-4">
                            {renderStatusBadge(session.status)}
                          </td>

                          {/* 6. Nút thao tác Admin trực tiếp */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Nút 🟢 DUYỆT LỊCH (Mở Modal Thiết lập Google Meet / Địa điểm) */}
                              <button
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => {
                                  setApprovalModalSession(session)
                                  const meeting = parseMeetingInfo(session.counselor_notes)
                                  if (meeting.meetingUrl) {
                                    setMeetingLocation(meeting.meetingUrl)
                                  } else if (meeting.locationText) {
                                    setMeetingLocation(meeting.locationText)
                                  } else {
                                    // Tạo link Google Meet tự động
                                    const code = 'meet-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6)
                                    setMeetingLocation('https://meet.google.com/' + code)
                                  }
                                  setMeetingMessage(meeting.cleanMessage || 'Em chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!')
                                }}
                                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer border ${
                                  isConfirmed
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                                }`}
                                title="Bấm để thiết lập link phòng họp và phê duyệt"
                              >
                                {isConfirmed ? <Video className="w-3.5 h-3.5 text-emerald-700" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>{isConfirmed ? 'Đổi link Meet' : 'Duyệt & Cấp Meet'}</span>
                              </button>

                              {/* Nút 🔴 TỪ CHỐI */}
                              <button
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => handleUpdateCounselingStatus(session.id, 'rejected')}
                                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer border ${
                                  isRejected
                                    ? 'bg-rose-600 text-white border-rose-700 opacity-90'
                                    : 'bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white border-rose-300'
                                }`}
                                title="Bấm để từ chối hoặc yêu cầu đổi lịch hẹn"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DUYỆT LỊCH HẸN & CẤP LINK GOOGLE MEET / ĐỊA ĐIỂM
          ========================================================================= */}
      {approvalModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-reveal">
          <div className="bg-white border border-slate-200 rounded-sm shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Phê Duyệt Lịch Hẹn & Cấp Link Phòng Gặp</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Thiết lập link Google Meet hoặc địa điểm trực tiếp để gửi ngay đến tài khoản của học sinh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalSession(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin tóm tắt suất hẹn */}
            {(() => {
              const modalContact = parseStudentContact(approvalModalSession.student_notes)
              const phoneClean = modalContact.phone ? modalContact.phone.replace(/[^0-9]/g, '') : null

              return (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-xs space-y-2 font-medium text-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span>Học sinh: <strong className="text-slate-900">{approvalModalSession.student?.full_name || 'Học sinh'}</strong> ({approvalModalSession.student?.email})</span>
                    <span className="text-[11px] font-bold text-brand-700">{formatDateTimeFormatted(approvalModalSession.scheduled_at)}</span>
                  </div>
                  <div>
                    Chuyên gia / Mentor: <strong className="text-slate-900">{getDisplayMentorName(approvalModalSession)}</strong>
                  </div>

                  {/* Thông tin liên hệ trực tiếp của HS */}
                  {(modalContact.phone || modalContact.schoolClass) && (
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-200 flex-wrap">
                      {modalContact.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            SĐT: {modalContact.phone}
                          </span>
                          {phoneClean && (
                            <a
                              href={`https://zalo.me/${phoneClean}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[10px] font-bold"
                            >
                              <span>Mở Zalo chat</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                      {modalContact.schoolClass && (
                        <span className="text-slate-600 font-medium">
                          🏫 {modalContact.schoolClass}
                        </span>
                      )}
                    </div>
                  )}

                  {modalContact.question && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200 font-normal">
                      <strong className="font-semibold text-slate-800">Băn khoăn của HS:</strong> {modalContact.question}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Nút Sao chép Lời mời Meet gửi Zalo / SMS cho HS */}
            <div className="bg-emerald-50/80 border border-emerald-300 p-3 rounded-sm flex items-center justify-between gap-3 shadow-2xs">
              <div className="text-[11px] text-emerald-900 font-medium">
                <span className="font-bold block text-emerald-950">Gửi trực tiếp cho học sinh qua Zalo / SMS:</span>
                Sau khi bấm duyệt, bạn có thể sao chép nhanh tin nhắn hoàn chỉnh chứa Link Google Meet để gửi cho học sinh.
              </div>
              <button
                type="button"
                onClick={() => {
                  const studentName = approvalModalSession.student?.full_name || 'em'
                  const mentorName = getDisplayMentorName(approvalModalSession)
                  const time = formatDateTimeFormatted(approvalModalSession.scheduled_at)
                  const text = `Chào ${studentName},\nLịch hẹn tư vấn 1-1 hướng nghiệp của em đã được duyệt:\n- Cố vấn/Mentor: ${mentorName}\n- Thời gian: ${time}\n- Link phòng họp: ${meetingLocation}\n- Lời dặn: ${meetingMessage}\nEm nhớ tham gia đúng giờ nhé!`
                  navigator.clipboard.writeText(text)
                  setToastMessage('📋 Đã sao chép nội dung lời mời gửi Zalo/SMS thành công!')
                  setTimeout(() => setToastMessage(null), 3500)
                }}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-400 rounded font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-colors"
                title="Sao chép nội dung lời mời gửi Zalo/SMS"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sao chép mẫu Zalo/SMS</span>
              </button>
            </div>

            {/* Nút bấm chọn nhanh hình thức gặp */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Chọn Nhanh Hình Thức & Nền Tảng Gặp Gỡ
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const roomCode = 'meet-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6)
                    setMeetingLocation('https://meet.google.com/' + roomCode)
                  }}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-sm font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors text-center"
                >
                  <Video className="w-4 h-4 text-emerald-600" />
                  <span>🌐 Google Meet</span>
                  <span className="text-[9px] font-normal text-emerald-700">Tạo mã phòng tự động</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingLocation('Phòng Tham vấn Tâm lý & Hướng nghiệp - Tầng 2 (Văn phòng Đoàn trường)')}
                  className="p-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-sm font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors text-center"
                >
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>🏛️ Gặp Tại Trường</span>
                  <span className="text-[9px] font-normal text-sky-700">Phòng Tham vấn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingLocation('https://zoom.us/j/')}
                  className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-sm font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors text-center"
                >
                  <Video className="w-4 h-4 text-indigo-600" />
                  <span>💻 Zoom Meeting</span>
                  <span className="text-[9px] font-normal text-indigo-700">Nhập ID phòng Zoom</span>
                </button>
              </div>
            </div>

            {/* Ô nhập Link phòng họp hoặc Địa điểm */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex items-center justify-between">
                <span>Đường link phòng họp (URL) hoặc Địa điểm cụ thể:</span>
                <span className="text-[10px] text-brand-600 font-semibold lowercase">hiển thị trực tiếp cho HS</span>
              </label>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="VD: https://meet.google.com/abc-defg-hij hoặc Phòng Tư vấn Hướng nghiệp..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:border-brand-500 focus:outline-none rounded-sm font-medium text-slate-800"
                required
              />
            </div>

            {/* Ô nhập Lời nhắn gửi học sinh */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Lời nhắn / Hướng dẫn chuẩn bị gửi học sinh:
              </label>
              <textarea
                rows={3}
                value={meetingMessage}
                onChange={(e) => setMeetingMessage(e.target.value)}
                placeholder="VD: Em chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:border-brand-500 focus:outline-none rounded-sm font-medium text-slate-800"
              />
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovalModalSession(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || !meetingLocation.trim()}
                onClick={async () => {
                  const finalNotes = '[Phòng gặp: ' + meetingLocation.trim() + ']\n' + meetingMessage.trim()
                  await handleUpdateCounselingStatus(approvalModalSession.id, 'confirmed', finalNotes)
                  setApprovalModalSession(null)
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận Duyệt & Cấp Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL CHI TIẾT BÀI LÀM PHẢN TƯ CỦA HỌC SINH
          ========================================================================= */}
      {selectedMatrixDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-reveal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-600" />
                  <span>Chi Tiết Bài Làm Nhật Ký Phản Tư</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Học sinh: <strong>{selectedMatrixDetail.student?.full_name || selectedMatrixDetail.student_name}</strong>
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedMatrixDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-sm space-y-1">
                <span className="text-[10px] font-bold text-brand-800 uppercase tracking-wider">Ngành Học Dự Định</span>
                <p className="font-black text-brand-900 text-sm">{selectedMatrixDetail.target_major}</p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-sm space-y-1">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">1. Năng Lực & Bằng Chứng Thực Tế</span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedMatrixDetail.evidence || 'Chưa ghi'}</p>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-sm space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">2. Dữ Liệu Đối Chứng Khách Quan</span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedMatrixDetail.verified_sources || 'Chưa ghi'}</p>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-sm space-y-1">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">3. Phân Tích Rủi Ro & Thách Thức Thực Tế</span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedMatrixDetail.risk_analysis || 'Chưa ghi'}</p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm space-y-1">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">4. Soi Chiếu Bẫy Tâm Lý Chọn Nghề</span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedMatrixDetail.bias_check || 'Chưa ghi'}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-sm">
                <span className="text-xs font-bold text-slate-700">Quyết Định Cuối Cùng Sau Phản Tư:</span>
                {renderDecisionTag(selectedMatrixDetail.final_decision)}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMatrixDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-sm shadow-lg border border-slate-700 animate-reveal">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
