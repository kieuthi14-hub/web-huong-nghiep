import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getCounselorDetails, formatDateTimeFormatted, mentorMap, parseMeetingInfo, parseStudentContact, COUNSELOR_GROUPS } from '../student/CounselingBooking'
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
  Check,
  Printer,
  Users,
  Download
} from 'lucide-react'

// =========================================================================
// 0. DỮ LIỆU ĐIỀU PHỐI THỰC NGHIỆM CBAS 2026 (N=30 CAN THIỆP)
// =========================================================================
export const INITIAL_CBAS_STUDENTS = [
  { id: 'CT_01', riasec: 'RAI', major: 'Tâm lý học (ĐH KHXH&NV)', deltaScore: '+0.5đ (An toàn)', triage: 'Fast-track (5p)', conf: '6/10 → 7/10', crs: '+1.2 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_02', riasec: 'ECS', major: 'Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)', deltaScore: '-2.5đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '8/10 → (Chưa đo)', crs: '+2.8 → --', unlockedStep5: false, status: 'Pending' },
  { id: 'CT_03', riasec: 'SAE', major: 'Sư phạm Tiếng Anh (ĐH Sư Phạm)', deltaScore: '+1.2đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 7/10', crs: '+0.8 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_04', riasec: 'CES', major: 'Kế toán - Kiểm toán (ĐH Kinh Tế)', deltaScore: '+0.2đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+1.5 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_05', riasec: 'RIE', major: 'Cơ điện tử & Tự động hóa (ĐH Bách Khoa)', deltaScore: '+0.8đ (An toàn)', triage: 'Fast-track (5p)', conf: '6/10 → 8/10', crs: '+1.8 → +0.3', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_06', riasec: 'ASE', major: 'Thiết kế Đồ họa & UI/UX (ĐH Kiến Trúc)', deltaScore: '-0.4đ (Biên giới)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+1.4 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_07', riasec: 'IRS', major: 'Công nghệ Sinh học Y dược (ĐH KHTN)', deltaScore: '+1.5đ (An toàn)', triage: 'Fast-track (5p)', conf: '8/10 → 8/10', crs: '+0.9 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_08', riasec: 'ICR', major: 'Kỹ thuật Phần mềm (ĐH Bách Khoa)', deltaScore: '-1.8đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '9/10 → (Chưa đo)', crs: '+3.1 → --', unlockedStep5: false, status: 'Pending' },
  { id: 'CT_09', riasec: 'EAS', major: 'Truyền thông Đa phương tiện (ĐH KHXH&NV)', deltaScore: '-2.0đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '8/10 → 7/10', crs: '+2.5 → +0.3', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_10', riasec: 'CIS', major: 'Khoa học Dữ liệu (ĐH CNTT - ĐHQG)', deltaScore: '+0.3đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+1.1 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_11', riasec: 'RIC', major: 'An toàn Thông tin (Học viện Kỹ thuật Mật mã)', deltaScore: '-1.6đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '7/10 → 7/10', crs: '+2.2 → +0.4', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_12', riasec: 'SEC', major: 'Marketing & Thương mại Điện tử (ĐH Ngoại Thương)', deltaScore: '+1.0đ (An toàn)', triage: 'Fast-track (5p)', conf: '8/10 → 8/10', crs: '+0.7 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_13', riasec: 'ISR', major: 'Y đa khoa (ĐH Y Dược TP.HCM)', deltaScore: '-2.8đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '9/10 → 7/10', crs: '+3.4 → +0.5', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_14', riasec: 'AES', major: 'Kiến trúc Công trình (ĐH Kiến Trúc TP.HCM)', deltaScore: '-1.7đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '8/10 → 7/10', crs: '+2.4 → +0.3', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_15', riasec: 'ECR', major: 'Logistics & Quản lý Chuỗi Cung Ứng', deltaScore: '+0.7đ (An toàn)', triage: 'Fast-track (5p)', conf: '6/10 → 8/10', crs: '+1.6 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_16', riasec: 'SIR', major: 'Dược học (ĐH Y Dược)', deltaScore: '-1.9đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '7/10 → 7/10', crs: '+2.6 → +0.3', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_17', riasec: 'CSE', major: 'Tài chính - Ngân hàng (ĐH Ngân Hàng)', deltaScore: '+0.4đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 7/10', crs: '+1.0 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_18', riasec: 'IRE', major: 'Trí tuệ Nhân tạo & Robotics (ĐH Bách Khoa)', deltaScore: '-2.2đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '9/10 → 8/10', crs: '+3.0 → +0.4', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_19', riasec: 'SAI', major: 'Tâm lý học Giáo dục (ĐH Sư Phạm)', deltaScore: '+1.4đ (An toàn)', triage: 'Fast-track (5p)', conf: '6/10 → 7/10', crs: '+0.8 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_20', riasec: 'ERC', major: 'Kinh doanh Quốc tế (ĐH Kinh Tế - Luật)', deltaScore: '-1.5đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '8/10 → 7/10', crs: '+2.1 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_21', riasec: 'RCI', major: 'Kỹ thuật Ô tô & Xe điện (ĐH Sư Phạm Kỹ Thuật)', deltaScore: '+0.9đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+1.3 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_22', riasec: 'AIR', major: 'Thiết kế Thời trang (ĐH Mỹ Thuật)', deltaScore: '-2.1đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '8/10 → 7/10', crs: '+2.7 → +0.3', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_23', riasec: 'SCI', major: 'Điều dưỡng Đa khoa (ĐH Y Khoa Phạm Ngọc Thạch)', deltaScore: '+1.8đ (An toàn)', triage: 'Fast-track (5p)', conf: '6/10 → 8/10', crs: '+0.6 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_24', riasec: 'ESI', major: 'Quản trị Khách sạn & Du lịch (ĐH Tôn Đức Thắng)', deltaScore: '+0.6đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 7/10', crs: '+1.2 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_25', riasec: 'IRC', major: 'Kỹ thuật Hàng không & Vũ trụ (ĐH Bách Khoa)', deltaScore: '-2.4đ (Nguy cơ)', triage: 'In-depth (20p)', conf: '9/10 → 8/10', crs: '+3.2 → +0.5', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_26', riasec: 'SAR', major: 'Sư phạm Toán học (ĐH Sư Phạm TP.HCM)', deltaScore: '+1.1đ (An toàn)', triage: 'Fast-track (5p)', conf: '8/10 → 8/10', crs: '+0.7 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_27', riasec: 'CER', major: 'Hệ thống Thông tin Quản lý (ĐH Ngân Hàng)', deltaScore: '-0.2đ (Biên giới)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+1.4 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_28', riasec: 'EAS', major: 'Luật Kinh tế (ĐH Luật TP.HCM)', deltaScore: '+0.8đ (An toàn)', triage: 'Fast-track (5p)', conf: '6/10 → 7/10', crs: '+1.1 → +0.2', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_29', riasec: 'RIS', major: 'Khoa học Môi trường & Khí tượng (ĐH KHTN)', deltaScore: '+1.6đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+0.5 → +0.1', unlockedStep5: true, status: 'Completed' },
  { id: 'CT_30', riasec: 'SER', major: 'Công tác Xã hội & Phát triển Cộng đồng (ĐH KHXH&NV)', deltaScore: '+1.3đ (An toàn)', triage: 'Fast-track (5p)', conf: '7/10 → 8/10', crs: '+0.6 → +0.1', unlockedStep5: true, status: 'Completed' }
]

export const INITIAL_TRIAGE_REQUESTS = [
  {
    id: 'CT_02',
    grade: 'Khối 12 | Mã RIASEC: ECS',
    major: 'QTKD - ĐH Kinh Tế TP.HCM',
    scoreGap: 'Thiếu 2.5 điểm (Học bạ: 23.5 | Chuẩn: 26.0)',
    proposedTime: '10/24/2026 - 14:00 (Trực tiếp)',
    question: 'Điểm chuẩn cao quá em sợ rớt, có nên đổi sang ngành gần không ạ?',
    mentors: [
      'Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường',
      'Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)',
      'Chị V.Q.N - SV Năm 3 Tài chính Ngân hàng (ĐH Ngoại Thương)'
    ],
    selectedMentor: 'Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)',
    approved: false
  },
  {
    id: 'CT_08',
    grade: 'Khối 12 | Mã RIASEC: ICR',
    major: 'Kỹ thuật Phần mềm - ĐH Bách Khoa',
    scoreGap: 'Thiếu 1.8 điểm | Rào cản học phí 45 tr/năm',
    proposedTime: '10/24/2026 - 19:30 (Google Meet)',
    question: 'Môn Toán em chưa đạt 8.5 thì vào năm nhất có bị sốc lập trình không anh?',
    mentors: [
      'Anh T.M.T - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
      'Anh L.T.K - Cựu SV An ninh mạng (ĐH CNTT - ĐHQG TP.HCM)',
      'Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường'
    ],
    selectedMentor: 'Anh T.M.T - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
    approved: false
  }
]

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
    student_notes: '[Chuyên gia/Mentor: [CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)]\n[Liên hệ SĐT/Zalo: 0912345678]\n[Lớp/Trường: Lớp 12A1 - THPT Chuyên Hùng Vương]\nEm muốn nhờ anh tư vấn kỹ hơn về môi trường học thực tế ngành Kỹ thuật Máy tính và AI tại Bách Khoa ạ.',
    created_at: '2026-02-13T10:00:00Z'
  },
  {
    id: 'cs-002',
    student_id: 'usr-002',
    student: { full_name: 'Trần Thị Bích', email: 'tranbich.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '11111111-1111-4111-a111-111111111111',
    mentor_id: '11111111-1111-4111-a111-111111111111',
    counselor_name: 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
    scheduled_at: '2026-02-26T09:00:00Z',
    status: 'confirmed',
    student_notes: '[Chuyên gia/Mentor: Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp]\n[Liên hệ SĐT/Zalo: 0987654321]\n[Lớp/Trường: Lớp 12A2 - THPT Chuyên Hùng Vương]\nNhờ Thầy tư vấn đánh giá phương thức xét tuyển sớm bằng học bạ và thi ĐGNL ĐHQG.',
    created_at: '2026-02-12T15:20:00Z'
  },
  {
    id: 'cs-003',
    student_id: 'usr-003',
    student: { full_name: 'Phạm Hoàng Nam', email: 'hoangnam.visef@gmail.com', grade_level: 'Grade 11' },
    counselor_id: '22222222-2222-2222-2222-222222222222',
    mentor_id: '22222222-2222-2222-2222-222222222222',
    counselor_name: '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
    scheduled_at: '2026-02-27T16:00:00Z',
    status: 'pending',
    student_notes: '[Chuyên gia/Mentor: [Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)]\n[Liên hệ SĐT/Zalo: 0905123456]\n[Lớp/Trường: Lớp 11B3]\nEm muốn tìm hiểu lộ trình thi chứng chỉ và cơ hội thực tập, việc làm ngành du lịch, ngôn ngữ.',
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
    student_notes: '[Chuyên gia/Mentor: Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường]\n[Liên hệ SĐT/Zalo: 0935987654]\n[Lớp/Trường: Lớp 12A5]\nEm đang gặp áp lực tâm lý thi cử từ phía gia đình khi gia đình bắt thi Y khoa.',
    created_at: '2026-02-11T11:00:00Z'
  },
  {
    id: 'cs-005',
    student_id: 'usr-005',
    student: { full_name: 'Lê Minh Khang', email: 'minhkhang.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '11111111-1111-1111-1111-111111111111',
    mentor_id: '[Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)',
    counselor_name: '[Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)',
    scheduled_at: '2026-02-28T08:30:00Z',
    status: 'pending',
    student_notes: '[Chuyên gia/Mentor: [Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)]\n[Liên hệ SĐT/Zalo: 0918765432]\n[Lớp/Trường: Lớp 12A3]\nEm muốn tìm hiểu chương trình đào tạo ngành Kế toán - Kiểm toán và cơ hội việc làm sau khi ra trường ạ.',
    created_at: '2026-02-14T09:00:00Z'
  },
  {
    id: 'cs-006',
    student_id: 'usr-006',
    student: { full_name: 'Vũ Thùy Linh', email: 'thuylinh.visef@gmail.com', grade_level: 'Grade 12' },
    counselor_id: '11111111-1111-1111-1111-111111111111',
    mentor_id: '[Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)',
    counselor_name: '[Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)',
    scheduled_at: '2026-03-01T14:00:00Z',
    status: 'confirmed',
    student_notes: '[Chuyên gia/Mentor: [Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)]\n[Liên hệ SĐT/Zalo: 0976123987]\n[Lớp/Trường: Lớp 12A4]\nNhờ chị tư vấn lộ trình học Sư phạm Sinh học và chính sách hỗ trợ học phí theo Nghị định 116 ạ.',
    counselor_notes: '[Phòng gặp: https://meet.google.com/meet-bio-edu]\nEm chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!',
    created_at: '2026-02-14T10:15:00Z'
  },
  {
    id: 'cs-007',
    student_id: 'usr-007',
    student: { full_name: 'Đặng Hoàng Yến', email: 'hoangyen.visef@gmail.com', grade_level: 'Grade 11' },
    counselor_id: '22222222-2222-2222-2222-222222222222',
    mentor_id: '[Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)',
    counselor_name: '[Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)',
    scheduled_at: '2026-03-02T15:30:00Z',
    status: 'pending',
    student_notes: '[Chuyên gia/Mentor: [Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)]\n[Liên hệ SĐT/Zalo: 0988554433]\n[Lớp/Trường: Lớp 11A1]\nEm muốn hỏi về yêu cầu ngoại ngữ và cơ hội làm việc tại các tổ chức phi chính phủ, cơ quan ngoại giao ngành Quan hệ Quốc tế.',
    created_at: '2026-02-14T11:30:00Z'
  }
]

// =========================================================================
// MAPPING CHUYÊN GIA / MENTOR CHUẨN XÁC TỪ DỮ LIỆU
// =========================================================================
export const ADMIN_MENTOR_MAP = {
  // CBAS VISEF Anonymized Mentors
  'CV_01': 'Thầy/Cô Ban Cố vấn Hướng nghiệp & Tâm lý học đường',
  'MT_IT01': 'Anh T.M.T - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
  'MT_IT02': 'Anh L.T.K - Cựu SV An ninh mạng (ĐH CNTT - ĐHQG TP.HCM)',
  'MT_EE01': 'Anh H.M.Đ - SV Năm 3 Điện tử Vi mạch (ĐH Bách Khoa)',
  'MT_BA01': 'Anh L.Q.B - SV Năm 4 Quản trị Kinh doanh (ĐH Kinh Tế TP.HCM)',
  'MT_FI01': 'Chị V.Q.N - SV Năm 3 Tài chính Ngân hàng (ĐH Ngoại Thương)',
  'MT_MK01': 'Chị L.T.H - Chuyên viên Marketing (Cựu SV ĐH Nha Trang)',
  'MT_MC01': 'Chị H.T.T - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
  'MT_ED01': 'Chị N.H.P - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',

  // Legacy mappings
  '11111111-1111-1111-1111-111111111111': 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
  '22222222-2222-2222-2222-222222222222': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
  '11111111-1111-4111-a111-111111111111': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  '22222222-2222-4222-a222-222222222222': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  '33333333-3333-4333-a333-333333333301': '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
  '33333333-3333-4333-a333-333333333307': '[Sư phạm Tiếng Anh] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
  // 3 Mentor Mới bổ sung theo yêu cầu:
  'Lê Thị Hoa': '[Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)',
  'Chị Lê Thị Hoa': '[Kế toán] Chị Lê Thị Hoa - SV Ngành Kế toán (Nhóm trường Kinh tế)',
  'Bùi Thị Vân Anh': '[Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)',
  'Chị Bùi Thị Vân Anh': '[Sư phạm Sinh học] Chị Bùi Thị Vân Anh - SV Ngành Sư phạm Sinh học (Nhóm trường Sư phạm)',
  'Nguyễn Lê Bảo Trân': '[Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)',
  'Chị Nguyễn Lê Bảo Trân': '[Quan hệ Quốc tế] Chị Nguyễn Lê Bảo Trân - SV Ngành Quan hệ Quốc tế (Nhóm trường KHXH & Nhân văn)',
  // Fallbacks:
  'Thầy Cao Xuân Hải (Bí thư đoàn trường) - Cố vấn Định hướng Nghề nghiệp': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  'Cô Nguyễn Thị Kim Thuận - Chuyên gia Tư vấn Tâm lý Học đường': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  'Chị Hoàng Thu Trang (SV Năm 3 - ĐH KHXH&NV)': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)'
}

// Hàm phân giải tên hiển thị chuẩn xác từ ghi chú học sinh hoặc thông tin chuyên viên, không bao giờ rơi về mặc định sai
export const getDisplayMentorName = (session) => {
  if (!session) return 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'

  // 1. ƯU TIÊN SỐ 1: Bóc tách chính xác từ student_notes theo dòng (tránh lỗi ngoặc vuông lồng nhau)
  const notes = session.student_notes
  if (notes && typeof notes === 'string') {
    const lines = notes.split('\n')
    const mentorLine = lines.find(l => l.trim().startsWith('[Chuyên gia/Mentor:'))
    if (mentorLine) {
      const extracted = mentorLine.trim()
        .replace(/^\[Chuyên gia\/Mentor:\s*/i, '')
        .replace(/\]\s*$/, '')
        .trim()
      if (extracted && extracted !== '11111111-1111-1111-1111-111111111111' && extracted.length > 2) {
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

// Hàm lấy huy hiệu tương ứng cho chuyên gia/mentor (phân biệt Cố vấn trường, Cựu SV, Mentor sinh viên)
export const getMentorBadge = (displayName) => {
  const name = String(displayName || '')
  const isAlumni = name.includes('Cựu SV') || name.includes('Alumni') || name.includes('KTS') || name.includes('Luật sư') || name.includes('Dược sĩ')
  const isTeacher = name.startsWith('Thầy ') || name.startsWith('Cô ') || name.startsWith('TS.') || name.startsWith('ThS.') || name.includes('Cố vấn Trường') || name.includes('Bí thư')
  if (isTeacher) {
    return {
      label: '🎓 Cố vấn Trường',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  }
  if (isAlumni) {
    return {
      label: '💼 Cựu SV (Alumni)',
      className: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  }
  return {
    label: '🚀 Mentor Sinh viên',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  }
}

// =========================================================================
// 3. MAIN COMPONENT: ADMIN DASHBOARD VISEF
// =========================================================================
const AdminDashboard = ({ activeTabDefault = 'cbas_hub' }) => {
  const { user } = useAuth()
  
  // 4 Tabs: 'cbas_hub' | 'experiment' | 'reflections' | 'counseling'
  const [activeTab, setActiveTab] = useState(activeTabDefault)

  // Dữ liệu Thực nghiệm CBAS 2026 (N=30 Đối tượng Can thiệp)
  const [cbasStudents, setCbasStudents] = useState(() => {
    return INITIAL_CBAS_STUDENTS.map(st => {
      const isUnlockedLocal = typeof window !== 'undefined' && localStorage.getItem(`gate_step5_unlocked_${st.id}`) === 'true'
      if (isUnlockedLocal) {
        return {
          ...st,
          unlockedStep5: true,
          conf: st.conf.replace('Chờ TV', '7/10').replace('(Chưa đo)', '7/10'),
          crs: st.crs.replace('--', '+0.3'),
          status: 'Completed'
        }
      }
      return st
    })
  })

  const [triageRequests, setTriageRequests] = useState(INITIAL_TRIAGE_REQUESTS)
  const [previewPdfStudent, setPreviewPdfStudent] = useState(null)
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false)

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

  // Modal Phê duyệt & Thiết lập Phòng gặp (Google Meet / Offline / Điều chỉnh Mentor & Giờ)
  const [approvalModalSession, setApprovalModalSession] = useState(null)
  const [meetingLocation, setMeetingLocation] = useState('https://meet.google.com/new')
  const [meetingMessage, setMeetingMessage] = useState('Em chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!')
  const [modalMentor, setModalMentor] = useState('')
  const [modalScheduledAt, setModalScheduledAt] = useState('')

  // 1. Phê duyệt Lịch hẹn và Gán Mentor từ Admin (Khối 2)
  const handleApproveTriageRequest = (studentId, mentorValue) => {
    setTriageRequests(prev => prev.map(req => {
      if (req.id === studentId) {
        return {
          ...req,
          approved: true,
          assignedMentor: mentorValue || req.selectedMentor
        }
      }
      return req
    }))

    // Đồng bộ sang live counselingSessions nếu có học sinh tương ứng
    const matched = counselingSessions.find(s => {
      const c = parseStudentContact(s.student_notes)
      return c.studentCode === studentId || s.student?.full_name?.includes(studentId)
    })
    if (matched) {
      handleUpdateCounselingStatus(matched.id, 'confirmed', {
        counselor_name: mentorValue,
        counselor_notes: `[Phòng gặp: https://meet.google.com/meet-${studentId.toLowerCase()}]\nMentor phụ trách: ${mentorValue}. Em chuẩn bị sẵn câu hỏi chất vấn để đối thoại nhé!`
      })
    }

    setToastMessage(`[ĐÃ DUYỆT LỊCH] Đối tượng ${studentId} đã được gán mentor phụ trách!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // 2. Xác nhận Hoàn thành Tham vấn & Mở Khóa Cổng Bước 5 (Khối 3)
  const handleConfirmConsultationComplete = (studentId) => {
    setCbasStudents(prev => prev.map(st => {
      if (st.id === studentId) {
        return {
          ...st,
          unlockedStep5: true,
          conf: st.conf.replace('Chờ TV', '7/10').replace('(Chưa đo)', '7/10'),
          crs: st.crs.replace('--', '+0.3'),
          status: 'Completed'
        }
      }
      return st
    }))

    if (typeof window !== 'undefined') {
      localStorage.setItem(`gate_step5_unlocked_${studentId}`, 'true')
      localStorage.setItem('cbas_step4_completed', 'true')
      localStorage.setItem('cbas_step4_consultation_completed', 'true')
      window.dispatchEvent(new Event('storage'))
    }

    const matched = counselingSessions.find(s => {
      const c = parseStudentContact(s.student_notes)
      return c.studentCode === studentId || s.student?.full_name?.includes(studentId)
    })
    if (matched) {
      handleMarkSessionCompleted(matched)
    }

    setToastMessage(`[XÁC NHẬN THÀNH CÔNG] Đã mở khóa Bước 5 cho đối tượng ${studentId}. Học sinh có thể lập Tam giác nguyện vọng và ký cam kết!`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // 3. Xuất toàn bộ dữ liệu thô (CSV) cho Thống kê CBAS (SPSS / R)
  const handleExportRawDataCSV = () => {
    const csvHeader = "Subject_ID,RIASEC,Target_Major,Delta_Score_B3,Triage_Branch,Conf_T0,Conf_T2,CRS_T0,CRS_T2,Step5_Status\n"
    const rows = cbasStudents.map(st => {
      const confParts = st.conf.split('→').map(s => s.trim().replace('/10', ''))
      const confT0 = confParts[0] || '7'
      const confT2 = confParts[1] === '(Chưa đo)' || confParts[1] === '(Chờ TV)' ? 'NA' : (confParts[1] || '7')
      const crsParts = st.crs.split('→').map(s => s.trim())
      const crsT0 = crsParts[0] || '+1.0'
      const crsT2 = crsParts[1] === '--' ? 'NA' : (crsParts[1] || '+0.2')
      const branch = st.triage.includes('Fast-track') ? 'Fast-track' : 'In-depth'
      const deltaClean = st.deltaScore.replace(/[^0-9.\-+]/g, '') || '+0.0'
      const status = st.unlockedStep5 ? 'Completed' : 'Pending'
      return `${st.id},${st.riasec},"${st.major}",${deltaClean},${branch},${confT0},${confT2},${crsT0},${crsT2},${status}`
    }).join('\n')

    const blob = new Blob(['\uFEFF' + csvHeader + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "SocraCareer_Raw_Data_N30.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setToastMessage('Đã tải xuống file CSV Thô SPSS/R (SocraCareer_Raw_Data_N30.csv)!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePreviewStudentPDF = (studentId) => {
    const student = cbasStudents.find(s => s.id === studentId) || {
      id: studentId,
      riasec: 'RAI',
      major: 'Tâm lý học (ĐH KHXH&NV)',
      conf: '6/10 → 7/10',
      crs: '+1.2 → +0.1',
      deltaScore: '+0.5đ (An toàn)'
    }
    setPreviewPdfStudent(student)
  }

  const handleBatchPrintAllPDF = () => {
    setIsBatchPrintModalOpen(true)
  }

  useEffect(() => {
    fetchRealSupabaseData('initial')
    const pollingInterval = setInterval(() => {
      fetchRealSupabaseData('silent')
    }, 8000)
    return () => clearInterval(pollingInterval)
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
              fetchRealSupabaseData('silent')
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

  const fetchRealSupabaseData = async (mode = 'silent') => {
    const isManual = mode === 'manual' || mode === true
    const isInitial = mode === 'initial'

    if (isManual) {
      setIsRefreshing(true)
    } else if (isInitial) {
      // Chỉ hiện spinner loading toàn trang ở lần đầu mở web khi chưa có dữ liệu nào
      if (usersList.length === 0 && counselingSessions.length === 0) {
        setIsLoading(true)
      }
    }
    // Chế độ 'silent': Background polling & Realtime cập nhật âm thầm không chạm vào loading/refreshing

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

    // Luôn ưu tiên hiển thị các suất hẹn thật của học sinh lên đầu, kết hợp cùng các mẫu nghiên cứu ViSEF
    const rawCombined = [
      ...combinedCounseling,
      ...VISEF_SEED_COUNSELING.filter(seed => !combinedCounseling.some(c => c.id === seed.id || c.scheduled_at === seed.scheduled_at))
    ]
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

    if (isManual) {
      setToastMessage(isDbConnected ? 'Đã làm mới dữ liệu Live từ Supabase PostgreSQL DB!' : 'Đã nạp bộ dữ liệu NCKH ViSEF mẫu (N=90)!')
      setTimeout(() => setToastMessage(null), 3000)
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }

  // Duyệt / Từ chối / Hoàn thành Lịch hẹn 1-1 & Thiết lập phòng gặp Google Meet / Offline
  const handleUpdateCounselingStatus = async (sessionId, newStatus, counselorNotes = null, extraUpdates = {}) => {
    setIsUpdatingStatus(true)

    const updatePayload = { status: newStatus, ...extraUpdates }
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

      // Đồng bộ toàn bộ cache local storage (hỗ trợ tức thì trên cùng thiết bị/trình duyệt)
      try {
        const localKeys = ['counseling_sessions_local', 'counseling_sessions']
        if (user?.id) localKeys.push(`counseling_sessions_local_${user.id}`)

        localKeys.forEach(k => {
          const raw = localStorage.getItem(k)
          if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) {
              const updated = list.map(item => item.id === sessionId ? { ...item, ...updatePayload } : item)
              localStorage.setItem(k, JSON.stringify(updated))
            }
          }
        })

        const s4Raw = localStorage.getItem('cbas_step4_booking')
        if (s4Raw) {
          const parsed = JSON.parse(s4Raw)
          if (parsed.id === sessionId || !parsed.id) {
            const meetingInfo = parseMeetingInfo(counselorNotes || '')
            parsed.status = newStatus
            if (meetingInfo.meetingUrl) parsed.meet_url = meetingInfo.meetingUrl
            if (meetingInfo.locationText) parsed.location = meetingInfo.locationText
            if (extraUpdates.scheduled_at) parsed.meeting_time = extraUpdates.scheduled_at
            if (extraUpdates.counselor_id) parsed.mentor_id = extraUpdates.counselor_id
            localStorage.setItem('cbas_step4_booking', JSON.stringify(parsed))
          }
        }

        // Tự động mở khóa Bước 5 khi Admin bấm hoàn thành
        if (newStatus === 'completed') {
          localStorage.setItem('cbas_step4_completed', 'true')
          localStorage.setItem('cbas_step4_consultation_completed', 'true')
          const completedRecord = {
            sessionId: sessionId,
            status: 'completed',
            completedAt: new Date().toISOString(),
            notes: counselorNotes || 'Mentor & Admin đã xác nhận hoàn thành phiên đối chất thực tế 1-1.'
          }
          localStorage.setItem('cbas_step4_feedback', JSON.stringify(completedRecord))
          localStorage.setItem('mentor_feedback_record', JSON.stringify(completedRecord))
        }

        window.dispatchEvent(new Event('storage'))
      } catch (e) {
        console.error('Lỗi lưu local storage:', e)
      }

      let msg = ''
      if (newStatus === 'completed') {
        msg = '🏆 Đã XÁC NHẬN HOÀN THÀNH BƯỚC 4! Đã mở khóa Bước 5 cho học sinh.'
      } else if (newStatus === 'confirmed' || newStatus === 'approved') {
        msg = '🟢 Đã DUYỆT & XẾP LỊCH thành công cho học sinh!'
      } else {
        msg = '🔴 Đã TỪ CHỐI / ĐỔI LỊCH hẹn tư vấn!'
      }

      setToastMessage(msg)
      setTimeout(() => setToastMessage(null), 3500)
    } catch (err) {
      console.error('Lỗi khi thao tác duyệt lịch:', err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Thao tác nhanh: Admin bấm xác nhận hoàn thành Bước 4 sau khi kết thúc buổi họp
  const handleMarkSessionCompleted = async (session) => {
    const studentName = session.student?.full_name || 'học sinh này'
    if (window.confirm(`Xác nhận em ${studentName} đã hoàn thành phiên tham vấn 1-1 để mở khóa Bước 5?`)) {
      const completionNote = session.counselor_notes 
        ? `${session.counselor_notes}\n[Xác nhận hoàn thành B4 lúc: ${new Date().toLocaleTimeString()} - ${new Date().toLocaleDateString()}]`
        : '[Hệ thống CBAS]: Mentor & Admin đã xác nhận hoàn thành phiên đối chất thực tế 1-1. Đã mở khóa Bước 5!'
      await handleUpdateCounselingStatus(session.id, 'completed', completionNote)
    }
  }

  // Xuất file CSV báo cáo ViSEF
  const handleExportCSV = () => {
    try {
      const headers = ['STT,Ma Dinh Danh (ID),Nhom Thuc Nghiem,Nganh Du Dinh,Doi Chung Thuc Te,Soi Bay Tam Ly,Ket Qua Quyet Dinh,Diem Tinh Huong\n']
      const rows = matricesList.map((m, idx) => {
        // Chuẩn hóa mã ẩn danh CT_01 -> CT_30 theo đúng chuẩn nghiên cứu ViSEF CBAS
        const rawName = m.student?.full_name || m.student_name || ''
        const rawEmail = m.student?.email || m.email || ''
        const ctMatch = rawName.match(/^CT_(\d{1,2})/i) || rawEmail.match(/^ct_(\d{1,2})/i)
        let studentCode = ''
        if (ctMatch) {
          const num = parseInt(ctMatch[1], 10)
          studentCode = `CT_${num < 10 ? '0' + num : num}`
        } else {
          const num = (idx % 30) + 1
          studentCode = `CT_${num < 10 ? '0' + num : num}`
        }

        const major = (m.target_major || '').replace(/"/g, '""')
        const sources = (m.verified_sources || '').replace(/\n/g, ' ').replace(/"/g, '""')
        const bias = (m.bias_check || '').replace(/\n/g, ' ').replace(/"/g, '""')
        const decision = m.final_decision || 'CONFIRMED'
        const scenario = m.scenario_score || '4/4 Đạt'

        return `"${idx + 1}","${studentCode}","Nhóm Can Thiệp (n=30)","${major}","${sources}","${bias}","${decision}","${scenario}"`
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
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> 🏆 Đã hoàn thành (B4)
          </span>
        )
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
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
  const completedCount = counselingSessions.filter(c => c.status === 'completed').length
  const rejectedCount = counselingSessions.filter(c => c.status === 'rejected').length

  // Thống kê phân luồng CBAS 2026
  const pendingTriageCount = triageRequests.filter(r => !r.approved).length
  const step5CompletedCount = cbasStudents.filter(s => s.unlockedStep5).length

  // Chỉ hiển thị loading che toàn màn hình nếu chưa có bất kỳ dữ liệu nào được nạp
  if (isLoading && usersList.length === 0 && counselingSessions.length === 0) {
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
              onClick={() => fetchRealSupabaseData('manual')}
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

        {/* Thanh 4 Tabs chuẩn hóa */}
        <div className="flex border-b border-slate-200 gap-6 pt-2 overflow-x-auto">
          {/* TAB CBAS 2026 */}
          <button
            onClick={() => setActiveTab('cbas_hub')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'cbas_hub' 
                ? 'border-teal-600 text-teal-800 bg-teal-50/80 px-3 py-1.5 rounded-t-sm shadow-2xs' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>⚡ 1. Điều Phối CBAS 2026 (N=30)</span>
            {pendingTriageCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-black">
                {pendingTriageCount} chờ duyệt
              </span>
            )}
          </button>

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
            <span>📊 2. Báo Cáo Khoa Học Thực Nghiệm (N=90)</span>
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
            <span>📝 3. Nhật Ký Phản Tư & Tác Vụ Tình Huống ({matricesList.length})</span>
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
            <span>📅 4. Quản Lý Lịch Hẹn Tư Vấn 1-1 ({counselingSessions.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-slate-950 rounded-full font-black">
                {pendingCount} chờ duyệt
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB CBAS 2026: TRUNG TÂM ĐIỀU PHỐI THỰC NGHIỆM CBAS 2026 (N=30)
          ========================================================================= */}
      {activeTab === 'cbas_hub' && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl animate-reveal font-sans">
          
          {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP NAVIGATION) */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 font-extrabold flex items-center justify-center border border-teal-500/30 text-lg shadow-inner">
                SC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-white tracking-wide">SOCRACAREER ADMIN DASHBOARD</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">CBAS-2026</span>
                </div>
                <p className="text-[11px] text-slate-400">Trung Tâm Điều Phối & Giám Sát Thực Nghiệm Hành Vi (N=30 Web Intervention)</p>
              </div>
            </div>

            {/* Nút Xuất Minh Chứng Thực Nghiệm */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportRawDataCSV}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Xuất CSV Thô (SPSS/R)</span>
              </button>
              <button
                type="button"
                onClick={handleBatchPrintAllPDF}
                className="px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Tải 30 Bản Cam Kết (PDF)</span>
              </button>
            </div>
          </div>

          {/* KHỐI 1: TỔNG QUAN TIẾN TRÌNH PHỄU CAN THIỆP (n = 30) */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">B1. Mỏ Neo RIASEC</span>
              <div className="text-xl font-bold text-white mt-1">30 / 30</div>
              <p className="text-[10px] text-emerald-400 mt-0.5">✓ Hoàn thành 100%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">B2. Phản Tư Socrates</span>
              <div className="text-xl font-bold text-white mt-1">30 / 30</div>
              <p className="text-[10px] text-emerald-400 mt-0.5">✓ 26/30 Bộc lộ Turning Point</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">B3. Đối Chứng Điểm</span>
              <div className="text-xl font-bold text-white mt-1">30 / 30</div>
              <p className="text-[10px] text-cyan-400 mt-0.5">✓ 11 HS Thiếu Điểm (Δ &lt; -1.5)</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">B4. Phân Luồng Triage</span>
              <div className="text-xl font-bold text-amber-200 mt-1">
                {30 - pendingTriageCount} / 30
              </div>
              <p className="text-[10px] text-amber-400 mt-0.5">
                {pendingTriageCount > 0 ? `Đang chờ duyệt: ${pendingTriageCount} HS` : '✓ Đã xếp lịch toàn bộ'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/30">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">B5. Cam Kết Hành Động</span>
              <div className="text-xl font-bold text-teal-200 mt-1">
                {step5CompletedCount} / 30
              </div>
              <p className="text-[10px] text-teal-400 mt-0.5">CRS dịch chuyển: +2.1 → +0.2</p>
            </div>
          </section>

          {/* KHỐI 2: TRUNG TÂM PHÊ DUYỆT ĐIỀU PHỐI LỊCH HẸN BƯỚC 4 (CENTRALIZED TRIAGE DISPATCHER) */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  HÀNG ĐỢI PHÊ DUYỆT THAM VẤN 1-1 (IN-DEPTH TRIAGE APPROVAL)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Học sinh đề xuất lịch hẹn sau Bước 3. Admin kiểm tra hồ sơ lệch điểm và gán Mentor phù hợp trước khi mở khóa Bước 5.
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                pendingTriageCount > 0 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {pendingTriageCount > 0 ? `Có ${pendingTriageCount} yêu cầu cần xếp lịch` : '✓ Đã điều phối toàn bộ'}
              </span>
            </div>

            {/* Danh sách thẻ phê duyệt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triageRequests.map((req) => {
                const isApproved = req.approved
                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl bg-slate-950 border space-y-3 transition-all ${
                      isApproved 
                        ? 'border-emerald-500/40 bg-emerald-950/10' 
                        : 'border-rose-500/30'
                    }`}
                  >
                    {isApproved ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-emerald-400">{req.id} - LỊCH ĐÃ ĐƯỢC ADMIN PHÊ DUYỆT</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">Sẵn sàng phiên tham vấn</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2">
                          Mentor phụ trách: <strong className="text-white">{req.assignedMentor || req.selectedMentor}</strong>
                        </p>
                        <p className="text-[11px] text-cyan-400 mt-1">
                          Đã đồng bộ thông báo về giao diện học sinh. Đang chờ hoàn thành phiên 1-1 để mở khóa Bước 5.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-extrabold text-xs">{req.id}</span>
                            <span className="text-xs font-semibold text-slate-300">{req.grade}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">Chờ Admin phê duyệt</span>
                        </div>

                        <div className="text-xs space-y-1 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <p><span className="text-slate-400">Nguyện vọng:</span> <strong className="text-white">{req.major}</strong></p>
                          <p><span className="text-slate-400">Độ lệch Bước 3:</span> <strong className="text-rose-400">{req.scoreGap}</strong></p>
                          <p><span className="text-slate-400">HS đề xuất giờ:</span> <span className="text-slate-200 font-medium">{req.proposedTime}</span></p>
                          <p><span className="text-slate-400">Câu hỏi của HS:</span> <em className="text-amber-200">{req.question}</em></p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <select
                            id={`mentorSelect-${req.id}`}
                            defaultValue={req.selectedMentor}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 flex-1"
                          >
                            {req.mentors.map((m, idx) => (
                              <option key={idx} value={m}>{m}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`mentorSelect-${req.id}`)
                              const val = el ? el.value : req.selectedMentor
                              handleApproveTriageRequest(req.id, val)
                            }}
                            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Duyệt & Gán Lịch
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* KHỐI 3: BẢNG GIÁM SÁT 30 ĐỐI TƯỢNG THỰC NGHIỆM & KHÓA CỔNG BƯỚC 5 */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  BẢNG DỮ LIỆU THỰC NGHIỆM CHI TIẾT (MÃ HÓA ẨN DANH CT_01 → CT_30)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản trị viên xác nhận hoàn thành phiên tham vấn để mở khóa cổng Bước 5 cho đối tượng.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Hiển thị: <strong className="text-white">30 đối tượng can thiệp</strong> (Nhóm đối chứng thu thập ngoại vi)
              </div>
            </div>

            {/* Bảng dữ liệu bảng tính */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/50">
                    <th className="p-3">Mã ĐT</th>
                    <th className="p-3">Mã RIASEC</th>
                    <th className="p-3">Ngành Khai Báo</th>
                    <th className="p-3 text-center">Δ Điểm B3</th>
                    <th className="p-3">Phân Luồng B4</th>
                    <th className="p-3 text-center">Conf (T0 → T2)</th>
                    <th className="p-3 text-center">CRS (T0 → T2)</th>
                    <th className="p-3 text-center">Cổng Bước 5</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {cbasStudents.map((st) => {
                    const isUnlocked = st.unlockedStep5
                    const isDangerous = st.deltaScore.includes('Nguy cơ')
                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-slate-800/40 transition ${
                          !isUnlocked && isDangerous ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className={`p-3 font-bold ${isUnlocked ? 'text-teal-400' : 'text-rose-400'}`}>
                          {st.id}
                        </td>
                        <td className="p-3 text-slate-300">{st.riasec}</td>
                        <td className="p-3 text-white font-semibold">{st.major}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${
                            st.deltaScore.includes('An toàn') 
                              ? 'text-emerald-400' 
                              : st.deltaScore.includes('Biên giới') 
                              ? 'text-amber-400' 
                              : 'text-rose-400'
                          }`}>
                            {st.deltaScore}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            st.triage.includes('Fast-track')
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {st.triage}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-300">{st.conf}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${
                            st.crs.includes('--') ? 'text-amber-400' : 'text-cyan-300'
                          }`}>
                            {st.crs}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {isUnlocked ? (
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                              Đã Mở Khóa B5
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              Đang Khóa Cổng
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handlePreviewStudentPDF(st.id)}
                              className="text-teal-400 hover:text-teal-300 underline text-xs cursor-pointer"
                            >
                              Xem Cam Kết PDF
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConfirmConsultationComplete(st.id)}
                              className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] transition cursor-pointer"
                            >
                              Xác Nhận Đã TV & Mở Khóa B5
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}

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
          TAB 3: QUẢN LÝ LỊCH HẸN TƯ VẤN 1-1 (ADAPTIVE TRIAGE IN-DEPTH MENTORING)
          ========================================================================= */}
      {activeTab === 'counseling' && (
        <div className="space-y-6 animate-reveal">
          {/* Thẻ Thống Kê Nhanh 4 Chỉ Số */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-sm border border-slate-200 flex items-center justify-center text-lg font-bold">
                📅
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đặt Lịch</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{counselingSessions.length} Suất</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-sm flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-sm border border-amber-300 flex items-center justify-center text-lg font-bold">
                ⏳
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Chờ Admin Duyệt</p>
                <p className="text-lg font-black text-amber-700 mt-0.5">{pendingCount} Đơn</p>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-sm flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-sm border border-emerald-300 flex items-center justify-center text-lg font-bold">
                🟢
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Đã Duyệt / Xếp Lịch</p>
                <p className="text-lg font-black text-emerald-700 mt-0.5">{confirmedCount} Đơn</p>
              </div>
            </div>

            <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-sm flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-sm border border-purple-300 flex items-center justify-center text-lg font-bold">
                🏆
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">Đã Hoàn Thành (B4)</p>
                <p className="text-lg font-black text-purple-700 mt-0.5">{completedCount} Đơn</p>
              </div>
            </div>
          </div>

          {/* Bảng Danh sách Yêu cầu Tư vấn 1-1 & Nút Thao tác Admin */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4.5 h-4.5 text-brand-600" />
                  DANH SÁCH YÊU CẦU ĐẶT LỊCH TƯ VẤN 1-1 CẦN PHÊ DUYỆT & XẾP LỊCH
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Admin tiếp nhận hồ sơ Bước 3 (Mã HS, Ngành chọn, Điểm lệch, Câu hỏi), kiểm tra lịch trống của Mentor để Chấp thuận hoặc Điều chỉnh. Sau khi họp xong, bấm [Xác nhận hoàn thành B4] để mở khóa Bước 5.
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
                      <th className="py-3.5 px-4">Mã HS & Hồ Sơ Bước 3</th>
                      <th className="py-3.5 px-4">Chuyên Gia / Mentor & Hình Thức</th>
                      <th className="py-3.5 px-4">Khung Giờ Hẹn Gặp</th>
                      <th className="py-3.5 px-4">Câu Hỏi Chuẩn Bị & Phòng Gặp</th>
                      <th className="py-3.5 px-4">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-center">Thao Tác Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counselingSessions.map((session, sIdx) => {
                      const displayMentorName = getDisplayMentorName(session)
                      const mentorBadge = getMentorBadge(displayMentorName)
                      const studentName = session.student?.full_name || 'Học sinh'
                      const studentEmail = session.student?.email || 'N/A'
                      const contactInfo = parseStudentContact(session.student_notes)
                      const cleanNotes = contactInfo.question || 'Không có ghi chú thêm.'

                      // Mã học sinh định danh chuẩn ViSEF
                      const ctMatch = studentName.match(/^CT_(\d{1,2})/i) || studentEmail.match(/^ct[_\-]?(\d{1,2})/i)
                      let studentCode = contactInfo.studentCode
                      if (!studentCode) {
                        if (ctMatch) {
                          const num = parseInt(ctMatch[1], 10)
                          studentCode = `CT_${num < 10 ? '0' + num : num}`
                        } else {
                          studentCode = `CT_${(sIdx % 30) + 1 < 10 ? '0' + ((sIdx % 30) + 1) : (sIdx % 30) + 1}`
                        }
                      }

                      const targetMajor = contactInfo.targetMajor || 'Kỹ thuật phần mềm'
                      const scoreGap = contactInfo.scoreGap || '--'
                      const meetType = contactInfo.meetType || (session.student_notes?.includes('Trực tiếp') ? 'Trực tiếp' : 'Google Meet')

                      const isConfirmed = session.status === 'confirmed' || session.status === 'approved'
                      const isCompleted = session.status === 'completed'
                      const isRejected = session.status === 'rejected'
                      const isPending = !session.status || session.status === 'pending'

                      const phoneClean = contactInfo.phone ? contactInfo.phone.replace(/[^0-9]/g, '') : null

                      return (
                        <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50/60 text-xs">
                          {/* 1. Mã HS & Hồ sơ Bước 3 */}
                          <td className="py-4 px-4 font-bold text-slate-800">
                            <div className="space-y-1.5">
                              {/* Badge Mã HS chuẩn ViSEF */}
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded font-black text-xs">
                                  {studentCode}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">({studentName})</span>
                              </div>

                              {/* Ngành chọn & Độ lệch điểm B3 */}
                              <div className="bg-slate-50 p-2 rounded border border-slate-200/80 space-y-0.5">
                                <div className="text-[11px] font-bold text-slate-900">
                                  🎯 {targetMajor}
                                </div>
                                <div className="text-[10px] font-extrabold flex items-center gap-1.5">
                                  <span className="text-slate-500">Độ lệch B3:</span>
                                  <span className={`px-1.5 py-0.2 rounded font-black ${
                                    scoreGap.includes('-') ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {scoreGap}
                                  </span>
                                </div>
                              </div>

                              {/* SĐT / Zalo chat */}
                              {contactInfo.phone ? (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <a
                                    href={`tel:${contactInfo.phone}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[10px] transition-colors shadow-2xs"
                                    title="Bấm để gọi điện thoại cho học sinh"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{contactInfo.phone}</span>
                                  </a>
                                  {phoneClean && (
                                    <a
                                      href={`https://zalo.me/${phoneClean}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded font-bold text-[10px] transition-colors shadow-2xs"
                                      title="Bấm để nhắn tin Zalo cho học sinh"
                                    >
                                      <span>💬 Chat Zalo</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  ⚠️ Chưa để lại SĐT
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Chuyên gia / Mentor & Hình thức */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border mb-1 block w-max ${mentorBadge.className}`}>
                              {mentorBadge.label}
                            </span>
                            <span className="font-bold text-slate-800 block text-xs">
                              {displayMentorName || 'Thầy/Cô Ban Cố vấn Hướng nghiệp'}
                            </span>
                            
                            {/* Hình thức gặp */}
                            <div className="mt-1.5">
                              {meetType?.includes('Trực tiếp') ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-bold">
                                  <MapPin className="w-3 h-3 text-sky-600" />
                                  <span>Trực tiếp tại trường</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                                  <Video className="w-3 h-3 text-indigo-600" />
                                  <span>Google Meet (Online)</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Ngày giờ hẹn */}
                          <td className="py-4 px-4 font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs">{formatDateTimeFormatted(session.scheduled_at)}</span>
                            </div>
                          </td>

                          {/* 4. Câu hỏi chuẩn bị của HS & Nền tảng gặp gỡ */}
                          <td className="py-4 px-4 max-w-sm text-slate-600 space-y-2">
                            {/* Trạng thái Nền tảng Google Meet / Trực tiếp khi đã duyệt */}
                            {(isConfirmed || isCompleted) && (() => {
                              const meeting = parseMeetingInfo(session.counselor_notes)
                              if (meeting.meetingUrl) {
                                const isMeet = meeting.meetingUrl.includes('meet.google')
                                return (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <a
                                      href={meeting.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition-colors"
                                    >
                                      <Video className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{isMeet ? '🌐 Google Meet' : '💻 Phòng họp Online'}</span>
                                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                                    </a>
                                  </div>
                                )
                              }
                              if (meeting.locationText) {
                                return (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-300 rounded font-bold text-[11px]">
                                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                      <span>{meeting.locationText}</span>
                                    </span>
                                  </div>
                                )
                              }
                              return null
                            })()}

                            {/* Câu hỏi của học sinh */}
                            {cleanNotes ? (
                              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] leading-relaxed" title={cleanNotes}>
                                <strong className="text-slate-800 font-bold">HS hỏi: </strong>
                                <span className="text-slate-700 italic">{cleanNotes}</span>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic bg-slate-50/60 p-1.5 rounded border border-slate-100">
                                Không có ghi chú thêm
                              </p>
                            )}
                          </td>

                          {/* 5. Trạng thái */}
                          <td className="py-4 px-4">
                            {renderStatusBadge(session.status)}
                          </td>

                          {/* 6. Thao tác Admin trực tiếp */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {/* KHI CHỜ PHÊ DUYỆT (PENDING): [CHẤP THUẬN & XẾP LỊCH] hoặc [ĐIỀU CHỈNH KHUNG GIỜ/MENTOR KHÁC] */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => {
                                      setApprovalModalSession(session)
                                      setModalMentor(session.counselor_id || 'CV_01')
                                      setModalScheduledAt(session.scheduled_at ? session.scheduled_at.slice(0, 16) : '')
                                      const meeting = parseMeetingInfo(session.counselor_notes)
                                      if (meeting.meetingUrl) {
                                        setMeetingLocation(meeting.meetingUrl)
                                      } else if (meeting.locationText) {
                                        setMeetingLocation(meeting.locationText)
                                      } else {
                                        const code = 'meet-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6)
                                        setMeetingLocation('https://meet.google.com/' + code)
                                      }
                                      setMeetingMessage(meeting.cleanMessage || 'Em chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!')
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-extrabold uppercase transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                    title="Bấm để cấp link Google Meet và duyệt ngay"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>✔ Chấp thuận & Xếp lịch</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => {
                                      setApprovalModalSession(session)
                                      setModalMentor(session.counselor_id || 'CV_01')
                                      setModalScheduledAt(session.scheduled_at ? session.scheduled_at.slice(0, 16) : '')
                                      const meeting = parseMeetingInfo(session.counselor_notes)
                                      setMeetingLocation(meeting.meetingUrl || meeting.locationText || 'https://meet.google.com/new')
                                      setMeetingMessage(meeting.cleanMessage || 'Cố vấn đề xuất điều chỉnh lại lịch để phù hợp nhất với em.')
                                    }}
                                    className="w-full px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    title="Bấm để đổi sang Mentor khác hoặc đổi khung giờ hẹn"
                                  >
                                    <Sliders className="w-3 h-3 text-sky-600" />
                                    <span>⚙ Đổi giờ / Mentor</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleUpdateCounselingStatus(session.id, 'rejected')}
                                    className="w-full px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Từ chối</span>
                                  </button>
                                </>
                              )}

                              {/* KHI ĐÃ DUYỆT (CONFIRMED): NÚT NỔI BẬT [XÁC NHẬN HOÀN THÀNH B4] ĐỂ MỞ KHÓA BƯỚC 5 */}
                              {isConfirmed && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleMarkSessionCompleted(session)}
                                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded text-[11px] font-black uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                                    title="Bấm để xác nhận buổi đối thoại 1-1 đã xong và mở khóa Bước 5 cho học sinh"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>🏆 Xác nhận hoàn thành B4</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => {
                                      setApprovalModalSession(session)
                                      setModalMentor(session.counselor_id || 'CV_01')
                                      setModalScheduledAt(session.scheduled_at ? session.scheduled_at.slice(0, 16) : '')
                                      const meeting = parseMeetingInfo(session.counselor_notes)
                                      setMeetingLocation(meeting.meetingUrl || meeting.locationText || '')
                                      setMeetingMessage(meeting.cleanMessage || '')
                                    }}
                                    className="text-[10px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer pt-0.5"
                                  >
                                    Đổi link Meet / giờ
                                  </button>
                                </>
                              )}

                              {/* KHI ĐÃ HOÀN THÀNH (COMPLETED): HIỂN THỊ ĐÃ MỞ KHÓA B5 */}
                              {isCompleted && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded font-black text-[10px]">
                                    ✔ Đã mở khóa Bước 5
                                  </span>
                                  <div>
                                    <button
                                      type="button"
                                      disabled={isUpdatingStatus}
                                      onClick={() => handleUpdateCounselingStatus(session.id, 'confirmed')}
                                      className="text-[9px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                                    >
                                      Hoàn tác về Đã duyệt
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* KHI BỊ TỪ CHỐI (REJECTED) */}
                              {isRejected && (
                                <button
                                  type="button"
                                  disabled={isUpdatingStatus}
                                  onClick={() => {
                                    setApprovalModalSession(session)
                                    setModalMentor(session.counselor_id || 'CV_01')
                                    setModalScheduledAt(session.scheduled_at ? session.scheduled_at.slice(0, 16) : '')
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                                >
                                  Mở lại & Xếp lịch
                                </button>
                              )}
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
          MODAL DUYỆT LỊCH HẸN & CẤP LINK GOOGLE MEET / ĐIỀU CHỈNH MENTOR & KHUNG GIỜ
          ========================================================================= */}
      {approvalModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-reveal">
          <div className="bg-white border border-slate-200 rounded-sm shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4.5 h-4.5 text-emerald-600" />
                  <span>PHÊ DUYỆT & XẾP LỊCH THAM VẤN 1-1 (CBAS PROTOCOL)</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Thiết lập link Google Meet hoặc địa điểm trực tiếp, điều chỉnh Mentor và khung giờ phù hợp để gửi ngay đến học sinh.
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

            {/* Thông tin tóm tắt hồ sơ đối chất Bước 3 của HS */}
            {(() => {
              const modalContact = parseStudentContact(approvalModalSession.student_notes)
              const phoneClean = modalContact.phone ? modalContact.phone.replace(/[^0-9]/g, '') : null
              const studentCode = modalContact.studentCode || 'CT_01'
              const targetMajor = modalContact.targetMajor || 'Kỹ thuật phần mềm'
              const scoreGap = modalContact.scoreGap || '--'

              return (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-xs space-y-2 font-medium text-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded font-black text-xs">
                        {studentCode}
                      </span>
                      <span>Học sinh: <strong className="text-slate-900">{approvalModalSession.student?.full_name || 'Học sinh'}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-brand-700">
                      {formatDateTimeFormatted(approvalModalSession.scheduled_at)}
                    </span>
                  </div>

                  {/* Ngành chọn & Độ lệch điểm B3 */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Ngành chọn mục tiêu:</span>
                      <strong className="text-slate-900 text-xs">🎯 {targetMajor}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Khoảng cách điểm Bước 3:</span>
                      <strong className={`text-xs ${scoreGap.includes('-') ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {scoreGap}
                      </strong>
                    </div>
                  </div>

                  {/* Thông tin liên hệ trực tiếp của HS */}
                  {modalContact.phone && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
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

                  {modalContact.question && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200 font-normal">
                      <strong className="font-semibold text-slate-800">Băn khoăn chuẩn bị của HS:</strong> {modalContact.question}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Điều chỉnh Mentor phụ trách */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                1. Chuyên gia / Mentor phụ trách phiên đối chất 1-1:
              </label>
              <select
                value={modalMentor}
                onChange={(e) => setModalMentor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
              >
                {COUNSELOR_GROUPS.map(group => (
                  <optgroup key={group.groupKey} label={group.groupName}>
                    {group.counselors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Điều chỉnh khung giờ hẹn */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                2. Khung giờ hẹn đối chất (Admin có thể chỉnh lại nếu giờ HS chọn bị trùng):
              </label>
              <input
                type="datetime-local"
                value={modalScheduledAt}
                onChange={(e) => setModalScheduledAt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Nút bấm chọn nhanh hình thức gặp */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                3. Chọn Nhanh Hình Thức & Nền Tảng Gặp Gỡ
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
                  <span className="text-[9px] font-normal text-emerald-700">Tự sinh mã phòng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingLocation('Phòng Tham vấn Tâm lý & Hướng nghiệp - Tầng 2 (Văn phòng Đoàn trường)')}
                  className="p-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-sm font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors text-center"
                >
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>🏛️ Gặp Tại Trường</span>
                  <span className="text-[9px] font-normal text-sky-700">Phòng Tham vấn Tầng 2</span>
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
                rows={2}
                value={meetingMessage}
                onChange={(e) => setMeetingMessage(e.target.value)}
                placeholder="VD: Em chuẩn bị sẵn các câu hỏi băn khoăn về ngành để trao đổi trực tiếp cùng chuyên gia nhé!"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:border-brand-500 focus:outline-none rounded-sm font-medium text-slate-800"
              />
            </div>

            {/* Nút Sao chép Lời mời Meet gửi Zalo / SMS cho HS */}
            <div className="bg-emerald-50/80 border border-emerald-300 p-2.5 rounded-sm flex items-center justify-between gap-3 shadow-2xs">
              <div className="text-[11px] text-emerald-900 font-medium">
                <span className="font-bold block text-emerald-950">Gửi trực tiếp cho HS qua Zalo / SMS:</span>
                Sao chép nhanh tin nhắn hoàn chỉnh chứa Link Google Meet để gửi học sinh.
              </div>
              <button
                type="button"
                onClick={() => {
                  const studentName = approvalModalSession.student?.full_name || 'em'
                  const mentorName = mentorMap[modalMentor] || ADMIN_MENTOR_MAP[modalMentor] || getDisplayMentorName(approvalModalSession)
                  const time = modalScheduledAt ? formatDateTimeFormatted(modalScheduledAt) : formatDateTimeFormatted(approvalModalSession.scheduled_at)
                  const text = `Chào ${studentName},\nLịch hẹn tư vấn 1-1 đối chất dữ liệu thực tế của em đã được duyệt:\n- Chuyên gia/Mentor: ${mentorName}\n- Thời gian: ${time}\n- Link phòng họp: ${meetingLocation}\n- Lời dặn: ${meetingMessage}\nEm nhớ tham gia đúng giờ nhé!`
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

            {/* Nút hành động Modal */}
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
                  let updatedStudentNotes = approvalModalSession.student_notes || ''
                  if (modalMentor) {
                    const newMentorName = mentorMap[modalMentor] || ADMIN_MENTOR_MAP[modalMentor] || modalMentor
                    if (updatedStudentNotes.includes('[Chuyên gia/Mentor:')) {
                      updatedStudentNotes = updatedStudentNotes.replace(/\[Chuyên gia\/Mentor:\s*[^\]]+\]/i, `[Chuyên gia/Mentor: ${newMentorName}]`)
                    } else {
                      updatedStudentNotes = `[Chuyên gia/Mentor: ${newMentorName}]\n` + updatedStudentNotes
                    }
                  }

                  const finalNotes = '[Phòng gặp: ' + meetingLocation.trim() + ']\n' + meetingMessage.trim()
                  const extraUpdates = {
                    counselor_id: modalMentor || approvalModalSession.counselor_id,
                    student_notes: updatedStudentNotes
                  }
                  if (modalScheduledAt) {
                    const d = new Date(modalScheduledAt)
                    if (!isNaN(d.getTime())) {
                      extraUpdates.scheduled_at = d.toISOString()
                    }
                  }

                  await handleUpdateCounselingStatus(approvalModalSession.id, 'confirmed', finalNotes, extraUpdates)
                  setApprovalModalSession(null)
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận Duyệt & Xếp Lịch</span>
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

      {/* =========================================================================
          MODAL XEM TRƯỚC BẢN CAM KẾT HÀNH ĐỘNG A4 (CHUẨN VISEF 2026 CBAS)
          ========================================================================= */}
      {previewPdfStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-reveal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            {/* Thanh điều khiển thao tác (Ẩn khi in) */}
            <div className="no-print flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                <span>📄 Xem trước Bản Cam Kết A4 ({previewPdfStudent.id})</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ IN BẢN A4 NÀY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPdfStudent(null)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Khung tài liệu A4 chuẩn in ấn */}
            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-xl space-y-5 border border-slate-200">
              {/* Header */}
              <div className="border-b-2 border-teal-700 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-extrabold text-teal-800 tracking-wider uppercase block">
                      DỰ ÁN NGHIÊN CỨU VISEF 2026 - PHÂN NGÀNH CBAS
                    </span>
                    <div className="text-sm font-extrabold text-slate-800 mt-1">
                      MÃ ĐỊNH DANH ĐỐI TƯỢNG: <span className="text-teal-700 font-black">{previewPdfStudent.id}</span> | KHỐI 12 THPT
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded font-bold uppercase text-[10px] tracking-wide">
                      NHÓM CAN THIỆP (SOCRACAREER)
                    </span>
                  </div>
                </div>

                <h1 className="text-lg font-black text-center text-slate-900 mt-3 uppercase tracking-tight">
                  BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG
                </h1>
                <p className="text-[11px] italic text-slate-500 text-center mt-0.5">
                  "Bản kế hoạch hành động tự chủ dán tại góc học tập - Thực hiện kỷ luật mỗi ngày để bứt phá."
                </p>
              </div>

              {/* Khối Đo lường & Hiệu chuẩn nhận thức */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Ngành mục tiêu chốt lại:</div>
                  <div className="text-sm font-black text-slate-900 mt-1">{previewPdfStudent.major}</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">☑ Đã đối chứng & Cam kết dấn thân</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Độ tự tin (Trước vs Sau):</div>
                  <div className="text-sm font-black text-teal-800 mt-1">{previewPdfStudent.conf}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Mã RIASEC: <strong className="text-slate-800">{previewPdfStudent.riasec}</strong></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Chỉ số Thiên lệch (CRS):</div>
                  <div className="text-sm font-black text-cyan-800 mt-1">{previewPdfStudent.crs}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Đã hiệu chuẩn thiên lệch</div>
                </div>
              </div>

              {/* Tam giác nguyện vọng thích ứng */}
              <div className="space-y-2 border border-slate-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🔺 TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG (ADAPTIVE ASPIRATION TRIANGLE)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-teal-50/70 p-3 rounded border border-teal-200">
                    <span className="text-[10px] font-bold text-teal-800 uppercase block">1. Nguyện vọng Mơ ước (Aspiration)</span>
                    <strong className="text-slate-900 block mt-1">{previewPdfStudent.major}</strong>
                    <p className="text-[10px] text-slate-600 mt-1">ĐH Top đầu - Điểm sàn cao (Mục tiêu dấn thân nỗ lực cao độ)</p>
                  </div>
                  <div className="bg-sky-50/70 p-3 rounded border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block">2. Nguyện vọng Vừa sức (Realistic)</span>
                    <strong className="text-slate-900 block mt-1">{previewPdfStudent.major} (Trường công lập)</strong>
                    <p className="text-[10px] text-slate-600 mt-1">Điểm xét tuyển nằm trong ngưỡng biên độ an toàn học bạ</p>
                  </div>
                  <div className="bg-slate-100/80 p-3 rounded border border-slate-300">
                    <span className="text-[10px] font-bold text-slate-700 uppercase block">3. Nguyện vọng Dự phòng (Safety)</span>
                    <strong className="text-slate-900 block mt-1">Ngành gần / Chương trình tiêu chuẩn</strong>
                    <p className="text-[10px] text-slate-600 mt-1">Đảm bảo chắc chắn cơ hội trúng tuyển và tối ưu học phí</p>
                  </div>
                </div>
              </div>

              {/* Kế hoạch hành động 30 ngày */}
              <div className="space-y-2 border border-slate-200 rounded-lg p-4 text-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  📋 KẾ HOẠCH HÀNH ĐỘNG 30 NGÀY TỰ CHỦ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">Ngày 1 - 10</span>
                    <p className="text-[11px] text-slate-700 mt-1">Ôn tập trọng tâm các môn xét tuyển còn yếu, làm đề thi ĐGNL mẫu.</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">Ngày 11 - 20</span>
                    <p className="text-[11px] text-slate-700 mt-1">Kiểm tra đề án tuyển sinh, chuẩn bị hồ sơ xét tuyển sớm và chứng chỉ.</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">Ngày 21 - 30</span>
                    <p className="text-[11px] text-slate-700 mt-1">Đối thoại lần cuối cùng chuyên gia/mentor, chốt thứ tự nguyện vọng.</p>
                  </div>
                </div>
              </div>

              {/* Chữ ký 3 bên */}
              <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs border-t border-slate-200">
                <div className="space-y-8">
                  <div className="font-bold text-slate-700">HỌC SINH CAM KẾT</div>
                  <div className="font-black text-teal-800">{previewPdfStudent.id} (Đã ký điện tử)</div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-slate-700">CỐ VẤN / MENTOR</div>
                  <div className="italic text-slate-500 font-semibold">(Xác nhận đồng hành)</div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-slate-700">ĐẠI DIỆN PHỤ HUYNH</div>
                  <div className="italic text-slate-500 font-semibold">(Chứng kiến & Hỗ trợ)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL IN HÀNG LOẠT 30 BẢN CAM KẾT A4 (PHỤ LỤC MINH CHỨNG VISEF 2026)
          ========================================================================= */}
      {isBatchPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-reveal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            {/* Thanh điều khiển thao tác */}
            <div className="no-print flex items-center justify-between bg-slate-800 p-3.5 rounded-xl border border-slate-700 sticky top-0 z-10 shadow-md">
              <div>
                <span className="text-xs text-white font-bold block">
                  📚 TẬP HỒ SƠ 30 BẢN CAM KẾT HÀNH ĐỘNG THỰC NGHIỆM (N=30)
                </span>
                <span className="text-[11px] text-slate-400">
                  Chuẩn A4 dọc phục vụ đóng tập Phụ lục Hồ sơ Dự thi ViSEF 2026
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ IN TOÀN BỘ 30 BẢN (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchPrintModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Danh sách 30 bản in */}
            <div className="space-y-8">
              {cbasStudents.map((st, idx) => (
                <div
                  key={st.id}
                  className="bg-white text-slate-900 p-8 rounded-xl shadow-xl space-y-5 border border-slate-200 page-break-inside-avoid"
                >
                  {/* Header */}
                  <div className="border-b-2 border-teal-700 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-extrabold text-teal-800 tracking-wider uppercase block">
                          DỰ ÁN NGHIÊN CỨU VISEF 2026 - PHÂN NGÀNH CBAS | BẢN #{idx + 1}/30
                        </span>
                        <div className="text-sm font-extrabold text-slate-800 mt-1">
                          MÃ ĐỊNH DANH ĐỐI TƯỢNG: <span className="text-teal-700 font-black">{st.id}</span> | KHỐI 12 THPT
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded font-bold uppercase text-[10px] tracking-wide">
                          NHÓM CAN THIỆP (SOCRACAREER)
                        </span>
                      </div>
                    </div>

                    <h1 className="text-lg font-black text-center text-slate-900 mt-3 uppercase tracking-tight">
                      BẢN CAM KẾT HÀNH ĐỘNG & TAM GIÁC NGUYỆN VỌNG THÍCH ỨNG
                    </h1>
                  </div>

                  {/* Khối Đo lường */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Ngành mục tiêu:</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{st.major}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Độ tự tin & RIASEC:</div>
                      <div className="text-xs font-black text-teal-800 mt-0.5">{st.conf} ({st.riasec})</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Chỉ số CRS:</div>
                      <div className="text-xs font-black text-cyan-800 mt-0.5">{st.crs}</div>
                    </div>
                  </div>

                  {/* Tam giác nguyện vọng */}
                  <div className="grid grid-cols-3 gap-3 text-xs border border-slate-200 rounded-lg p-3">
                    <div className="bg-teal-50 p-2.5 rounded border border-teal-200">
                      <span className="text-[10px] font-bold text-teal-800 uppercase block">1. Mơ ước</span>
                      <strong className="text-slate-900 block mt-0.5 text-[11px]">{st.major}</strong>
                    </div>
                    <div className="bg-sky-50 p-2.5 rounded border border-sky-200">
                      <span className="text-[10px] font-bold text-sky-800 uppercase block">2. Vừa sức</span>
                      <strong className="text-slate-900 block mt-0.5 text-[11px]">{st.major} (Trường công lập)</strong>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded border border-slate-300">
                      <span className="text-[10px] font-bold text-slate-700 uppercase block">3. Dự phòng</span>
                      <strong className="text-slate-900 block mt-0.5 text-[11px]">Ngành gần / Chuẩn đầu ra tương đương</strong>
                    </div>
                  </div>

                  {/* Chữ ký 3 bên */}
                  <div className="grid grid-cols-3 gap-4 pt-3 text-center text-xs border-t border-slate-200">
                    <div>
                      <div className="font-bold text-slate-700">HỌC SINH CAM KẾT</div>
                      <div className="font-black text-teal-800 mt-6">{st.id}</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">CỐ VẤN / MENTOR</div>
                      <div className="italic text-slate-500 font-semibold mt-6">(Xác nhận)</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">ĐẠI DIỆN PHỤ HUYNH</div>
                      <div className="italic text-slate-500 font-semibold mt-6">(Chứng kiến)</div>
                    </div>
                  </div>
                </div>
              ))}
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
