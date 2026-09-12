import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  CalendarDays, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User,
  AlertTriangle,
  GraduationCap,
  Rocket,
  Sparkles
} from 'lucide-react'

// Bản đồ Ánh xạ UUID Chuyên gia / Mentor sang Tên hiển thị thực tế
export const mentorMap = {
  '11111111-1111-1111-1111-111111111111': 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
  '22222222-2222-2222-2222-222222222222': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
  '11111111-1111-4111-a111-111111111111': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  '22222222-2222-4222-a222-222222222222': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  '33333333-3333-4333-a333-333333333301': '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
  '33333333-3333-4333-a333-333333333307': '[Sư phạm Tiếng Anh] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
  // Fallbacks ánh xạ từ dữ liệu cũ:
  'Thầy Cao Xuân Hải (Bí thư đoàn trường) - Cố vấn Định hướng Nghề nghiệp': 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
  'Cô Nguyễn Thị Kim Thuận - Chuyên gia Tư vấn Tâm lý Học đường': 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
  'Chị Hoàng Thu Trang (SV Năm 3 - ĐH KHXH&NV)': '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)'
}

// Cấu hình Danh sách Nhóm Chuyên gia & Mentor Tư vấn 1-1 phân loại logic theo nhóm trường & Cựu SV
export const COUNSELOR_GROUPS = [
  {
    groupKey: 'school_counselors',
    groupName: '🎓 THẦY CÔ CỐ VẤN HƯỚNG NGHIỆP TẠI TRƯỜNG',
    badgeLabel: '🎓 Cố vấn Trường',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: GraduationCap,
    counselors: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Thầy Nguyễn Văn A',
        title: 'Cố vấn Hướng nghiệp (Phụ trách chung)',
        fullName: 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
        groupKey: 'school_counselors',
        badgeLabel: '🎓 Cố vấn Trường',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      {
        id: 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
        name: 'Thầy Cao Xuân Hải',
        title: 'Bí thư Đoàn trường - Cố vấn Hướng nghiệp',
        fullName: 'Thầy Cao Xuân Hải (Bí thư Đoàn trường) - Cố vấn Hướng nghiệp',
        groupKey: 'school_counselors',
        badgeLabel: '🎓 Cố vấn Trường',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      {
        id: 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
        name: 'Cô Nguyễn Thị Kim Thuận',
        title: 'Cố vấn Hướng nghiệp & Tâm lý Học đường',
        fullName: 'Cô Nguyễn Thị Kim Thuận - Cố vấn Hướng nghiệp & Tâm lý Học đường',
        groupKey: 'school_counselors',
        badgeLabel: '🎓 Cố vấn Trường',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      }
    ]
  },
  {
    groupKey: 'tech_engineering',
    groupName: '🏛️ NHÓM TRƯỜNG KỸ THUẬT, CÔNG NGHỆ & AI (ĐH Bách Khoa, ĐH CNTT, ĐH Sư Phạm Kỹ Thuật, HV Bưu Chính)',
    badgeLabel: '🚀 Kỹ thuật & CNTT',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: Rocket,
    counselors: [
      {
        id: '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
        name: 'Anh Trần Minh Triết',
        title: 'SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
        fullName: '[CNTT & Trí tuệ nhân tạo] Anh Trần Minh Triết - SV Năm 3 Kỹ thuật Phần mềm (ĐH Bách Khoa)',
        groupKey: 'tech_engineering',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[CNTT & An toàn thông tin] Anh Lê Tuấn Kiệt - Cựu SV Kỹ sư An ninh mạng (ĐH Công Nghệ Thông Tin - ĐHQG TP.HCM)',
        name: 'Anh Lê Tuấn Kiệt',
        title: 'Cựu SV Kỹ sư An ninh mạng (ĐH CNTT - ĐHQG)',
        fullName: '[CNTT & An toàn thông tin] Anh Lê Tuấn Kiệt - Cựu SV Kỹ sư An ninh mạng (ĐH Công Nghệ Thông Tin - ĐHQG TP.HCM)',
        groupKey: 'tech_engineering',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      {
        id: '[Kỹ thuật & Vi mạch bán dẫn] Anh Hoàng Minh Đức - SV Năm 3 Kỹ thuật Điện - Điện tử (ĐH Bách Khoa)',
        name: 'Anh Hoàng Minh Đức',
        title: 'SV Năm 3 Kỹ thuật Điện - Điện tử (ĐH Bách Khoa)',
        fullName: '[Kỹ thuật & Vi mạch bán dẫn] Anh Hoàng Minh Đức - SV Năm 3 Kỹ thuật Điện - Điện tử (ĐH Bách Khoa)',
        groupKey: 'tech_engineering',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Cơ điện tử & Tự động hóa Robot] Anh Nguyễn Văn Thành - Cựu SV Kỹ sư Tự động hóa (ĐH Sư Phạm Kỹ Thuật)',
        name: 'Anh Nguyễn Văn Thành',
        title: 'Cựu SV Kỹ sư Tự động hóa (ĐH Sư Phạm Kỹ Thuật)',
        fullName: '[Cơ điện tử & Tự động hóa Robot] Anh Nguyễn Văn Thành - Cựu SV Kỹ sư Tự động hóa (ĐH Sư Phạm Kỹ Thuật)',
        groupKey: 'tech_engineering',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'economics_finance',
    groupName: '📊 NHÓM TRƯỜNG KINH TẾ, TÀI CHÍNH, QUẢN TRỊ & LOGISTICS (ĐH Ngoại Thương, ĐH Kinh Tế Quốc Dân, ĐH Kinh Tế TP.HCM, HV Tài Chính, ĐH Nha Trang)',
    badgeLabel: '🚀 Kinh tế & Quản trị',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Rocket,
    counselors: [
      {
        id: '[Kinh tế, Quản trị & Marketing] Anh Lê Quốc Bảo - SV Năm 4 QTKD & Marketing (ĐH Kinh Tế TP.HCM)',
        name: 'Anh Lê Quốc Bảo',
        title: 'SV Năm 4 QTKD & Marketing (ĐH Kinh Tế TP.HCM)',
        fullName: '[Kinh tế, Quản trị & Marketing] Anh Lê Quốc Bảo - SV Năm 4 QTKD & Marketing (ĐH Kinh Tế TP.HCM)',
        groupKey: 'economics_finance',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Tài chính, Ngân hàng & Fintech] Chị Vũ Quỳnh Nga - SV Năm 3 Tài chính - Ngân hàng (ĐH Ngoại Thương)',
        name: 'Chị Vũ Quỳnh Nga',
        title: 'SV Năm 3 Tài chính - Ngân hàng (ĐH Ngoại Thương)',
        fullName: '[Tài chính, Ngân hàng & Fintech] Chị Vũ Quỳnh Nga - SV Năm 3 Tài chính - Ngân hàng (ĐH Ngoại Thương)',
        groupKey: 'economics_finance',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Phân tích Dữ liệu Kinh doanh & Đầu tư] Anh Phạm Đức Anh - Cựu SV Chuyên viên Phân tích Dữ liệu (ĐH Kinh Tế Quốc Dân)',
        name: 'Anh Phạm Đức Anh',
        title: 'Cựu SV Chuyên viên Phân tích Dữ liệu (ĐH Kinh Tế Quốc Dân)',
        fullName: '[Phân tích Dữ liệu Kinh doanh & Đầu tư] Anh Phạm Đức Anh - Cựu SV Chuyên viên Phân tích Dữ liệu (ĐH Kinh Tế Quốc Dân)',
        groupKey: 'economics_finance',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      {
        id: '[Logistics & Chuỗi Cung Ứng Quốc tế] Chị Đoàn Ngọc Yến Vy - Cựu SV Chuyên viên Xuất nhập khẩu (ĐH Nha Trang)',
        name: 'Chị Đoàn Ngọc Yến Vy',
        title: 'Cựu SV Chuyên viên Xuất nhập khẩu (ĐH Nha Trang)',
        fullName: '[Logistics & Chuỗi Cung Ứng Quốc tế] Chị Đoàn Ngọc Yến Vy - Cựu SV Chuyên viên Xuất nhập khẩu (ĐH Nha Trang)',
        groupKey: 'economics_finance',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'medical_health',
    groupName: '🩺 NHÓM TRƯỜNG Y DƯỢC & KHOA HỌC SỨC KHỎE (ĐH Y Dược TP.HCM, ĐH Y Hà Nội, ĐH Dược Hà Nội)',
    badgeLabel: '🚀 Y Dược & Sức khỏe',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    icon: Rocket,
    counselors: [
      {
        id: '[Y Đa khoa & Bác sĩ Lâm sàng] Chị Phạm Khánh Linh - SV Năm 4 Bác sĩ Đa Khoa (ĐH Y Dược TP.HCM)',
        name: 'Chị Phạm Khánh Linh',
        title: 'SV Năm 4 Bác sĩ Đa Khoa (ĐH Y Dược TP.HCM)',
        fullName: '[Y Đa khoa & Bác sĩ Lâm sàng] Chị Phạm Khánh Linh - SV Năm 4 Bác sĩ Đa Khoa (ĐH Y Dược TP.HCM)',
        groupKey: 'medical_health',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Dược học & Nghiên cứu Thuốc] Dược sĩ Phan Thanh Tùng - Cựu SV Chuyên viên Nghiên cứu Dược (ĐH Dược Hà Nội)',
        name: 'Dược sĩ Phan Thanh Tùng',
        title: 'Cựu SV Chuyên viên Nghiên cứu Dược (ĐH Dược Hà Nội)',
        fullName: '[Dược học & Nghiên cứu Thuốc] Dược sĩ Phan Thanh Tùng - Cựu SV Chuyên viên Nghiên cứu Dược (ĐH Dược Hà Nội)',
        groupKey: 'medical_health',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'social_law',
    groupName: '⚖️ NHÓM TRƯỜNG KHOA HỌC XÃ HỘI, NHÂN VĂN & LUẬT (ĐH KHXH&NV, ĐH Luật TP.HCM, ĐH Luật Hà Nội)',
    badgeLabel: '🚀 Xã hội & Luật',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Rocket,
    counselors: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Chị Hoàng Thu Trang',
        title: 'SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
        fullName: '[Báo chí & Truyền thông] Chị Hoàng Thu Trang - SV Năm 3 Báo chí & Truyền thông (ĐH KHXH&NV)',
        groupKey: 'social_law',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Luật Kinh tế & Pháp chế Doanh nghiệp] Luật sư Bùi Tuấn Anh - Cựu SV Chuyên viên Pháp chế (ĐH Luật TP.HCM)',
        name: 'Luật sư Bùi Tuấn Anh',
        title: 'Cựu SV Chuyên viên Pháp chế (ĐH Luật TP.HCM)',
        fullName: '[Luật Kinh tế & Pháp chế Doanh nghiệp] Luật sư Bùi Tuấn Anh - Cựu SV Chuyên viên Pháp chế (ĐH Luật TP.HCM)',
        groupKey: 'social_law',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      {
        id: '[Tâm lý học & Quản trị Nhân sự] Chị Đỗ Minh Thư - Cựu SV Chuyên viên Đào tạo & Tuyển dụng (ĐH KHXH&NV)',
        name: 'Chị Đỗ Minh Thư',
        title: 'Cựu SV Chuyên viên Nhân sự (ĐH KHXH&NV)',
        fullName: '[Tâm lý học & Quản trị Nhân sự] Chị Đỗ Minh Thư - Cựu SV Chuyên viên Đào tạo & Tuyển dụng (ĐH KHXH&NV)',
        groupKey: 'social_law',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'education_languages',
    groupName: '📚 NHÓM TRƯỜNG SƯ PHẠM & NGOẠI NGỮ (ĐH Sư Phạm Hà Nội, ĐH Sư Phạm TP.HCM, ĐH Sư Phạm Quy Nhơn, ĐH Ngoại Ngữ)',
    badgeLabel: '🚀 Sư phạm & Ngôn ngữ',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: Rocket,
    counselors: [
      {
        id: '[Sư phạm & Ngôn ngữ] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
        name: 'Chị Nguyễn Hà Phương',
        title: 'SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
        fullName: '[Sư phạm & Ngôn ngữ] Chị Nguyễn Hà Phương - SV Năm 3 Sư phạm Tiếng Anh (ĐH Sư Phạm Quy Nhơn)',
        groupKey: 'education_languages',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Ngôn ngữ Anh & Biên - Phiên dịch] Thầy Trần Văn Nam - Cựu SV Giảng dạy & Dịch thuật (ĐH Ngoại Ngữ - ĐHQGHN)',
        name: 'Thầy Trần Văn Nam',
        title: 'Cựu SV Giảng dạy & Dịch thuật (ĐH Ngoại Ngữ)',
        fullName: '[Ngôn ngữ Anh & Biên - Phiên dịch] Thầy Trần Văn Nam - Cựu SV Giảng dạy & Dịch thuật (ĐH Ngoại Ngữ - ĐHQGHN)',
        groupKey: 'education_languages',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'architecture_design',
    groupName: '🎨 NHÓM TRƯỜNG KIẾN TRÚC, NGHỆ THUẬT & THIẾT KẾ (ĐH Kiến Trúc TP.HCM/Hà Nội, ĐH Mỹ Thuật)',
    badgeLabel: '🚀 Kiến trúc & Thiết kế',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Rocket,
    counselors: [
      {
        id: '[Thiết kế Đồ họa & UI/UX Sáng tạo] Anh Đỗ Hoàng Nam - SV Năm 3 Thiết kế Đồ họa (ĐH Kiến Trúc TP.HCM)',
        name: 'Anh Đỗ Hoàng Nam',
        title: 'SV Năm 3 Thiết kế Đồ họa (ĐH Kiến Trúc TP.HCM)',
        fullName: '[Thiết kế Đồ họa & UI/UX Sáng tạo] Anh Đỗ Hoàng Nam - SV Năm 3 Thiết kế Đồ họa (ĐH Kiến Trúc TP.HCM)',
        groupKey: 'architecture_design',
        badgeLabel: '🚀 Mentor Sinh viên',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      {
        id: '[Kiến trúc Công trình & Nội thất] KTS. Lê Trọng Nghĩa - Cựu SV Kiến trúc sư Công trình (ĐH Kiến Trúc Hà Nội)',
        name: 'KTS. Lê Trọng Nghĩa',
        title: 'Cựu SV Kiến trúc sư Công trình (ĐH Kiến Trúc Hà Nội)',
        fullName: '[Kiến trúc Công trình & Nội thất] KTS. Lê Trọng Nghĩa - Cựu SV Kiến trúc sư Công trình (ĐH Kiến Trúc Hà Nội)',
        groupKey: 'architecture_design',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'tourism_hospitality',
    groupName: '🏨 NHÓM TRƯỜNG DU LỊCH, NHÀ HÀNG - KHÁCH SẠN & DỊCH VỤ (ĐH Thương Mại, ĐH Du Lịch Huế, ĐH Tài Chính - Marketing)',
    badgeLabel: '🚀 Du lịch & Khách sạn',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Rocket,
    counselors: [
      {
        id: '[Quản trị Du lịch & Khách sạn Quốc tế] Chị Mai Phương Uyên - Cựu SV Quản lý Dịch vụ Khách sạn (ĐH Thương Mại)',
        name: 'Chị Mai Phương Uyên',
        title: 'Cựu SV Quản lý Dịch vụ Khách sạn (ĐH Thương Mại)',
        fullName: '[Quản trị Du lịch & Khách sạn Quốc tế] Chị Mai Phương Uyên - Cựu SV Quản lý Dịch vụ Khách sạn (ĐH Thương Mại)',
        groupKey: 'tourism_hospitality',
        badgeLabel: '💼 Cựu SV (Alumni)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      }
    ]
  },
  {
    groupKey: 'alumni_network',
    groupName: '🌐 MẠNG LƯỚI CỰU HỌC SINH MỞ RỘNG (ĐẶT HẸN TRƯỜNG / NGÀNH THEO YÊU CẦU)',
    badgeLabel: '🌐 Mở rộng',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Rocket,
    counselors: [
      {
        id: '[Khối ngành & Trường khác] Mạng lưới Cựu học sinh toàn quốc (Vui lòng ghi rõ trường & ngành mong muốn trong Ghi chú)',
        name: 'Mạng lưới Cựu học sinh toàn quốc',
        title: 'Vui lòng ghi rõ trường & ngành mong muốn trong Ghi chú',
        fullName: '[Khối ngành & Trường khác] Mạng lưới Cựu học sinh toàn quốc (Vui lòng ghi rõ trường & ngành mong muốn trong Ghi chú)',
        groupKey: 'alumni_network',
        badgeLabel: '🌐 Mở rộng',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300'
      }
    ]
  }
]

// Định dạng thời gian HH:mm - DD/MM/YYYY
export const formatDateTimeFormatted = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} - ${day}/${month}/${year}`
}

// Hàm tra cứu chi tiết thông tin chuyên gia / mentor từ ID hoặc object trả về từ Supabase DB
export const getCounselorDetails = (counselorId, counselorRelation, sessionNotes, sessionCounselorName) => {
  const checkValue = String(counselorId || sessionCounselorName || '').trim()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(checkValue)

  // 0. Nếu ID là 11111111-1111-1111-1111-111111111111
  if (checkValue === '11111111-1111-1111-1111-111111111111') {
    return {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Thầy Nguyễn Văn A',
      title: 'Cố vấn Hướng nghiệp',
      fullName: 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
      groupKey: 'school_counselors',
      badgeLabel: '🎓 Cố vấn Trường',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  }

  // 0b. Tra cứu trực tiếp trong mentorMap
  if (checkValue && mentorMap[checkValue]) {
    const mappedName = mentorMap[checkValue]
    const isAlumni = mappedName.includes('Cựu SV') || mappedName.includes('KTS') || mappedName.includes('Luật sư') || mappedName.includes('Dược sĩ')
    const isTeacher = mappedName.includes('Thầy') || mappedName.includes('Cô')
    return {
      id: checkValue,
      name: mappedName.split('-')[0].trim() || mappedName,
      title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV (Alumni)' : 'Mentor Sinh viên',
      fullName: mappedName,
      groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
      badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV (Alumni)' : '🚀 Mentor Sinh viên',
      badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  }

  // 1. Tìm theo tên/value hoặc ID trong COUNSELOR_GROUPS
  for (const group of COUNSELOR_GROUPS) {
    const found = group.counselors.find(c => 
      c.id === checkValue || 
      c.fullName === checkValue || 
      (checkValue && checkValue.includes(c.name)) ||
      (checkValue && c.fullName.includes(checkValue))
    )
    if (found) return found
  }

  // 2. Tìm trong sessionNotes
  if (sessionNotes && typeof sessionNotes === 'string') {
    const match = sessionNotes.match(/\[Chuyên gia\/Mentor:\s*([^\]]+)\]/)
    if (match && match[1]) {
      const extractedName = match[1].trim()
      if (extractedName === '11111111-1111-1111-1111-111111111111') {
        return {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Thầy Nguyễn Văn A',
          title: 'Cố vấn Hướng nghiệp',
          fullName: 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)',
          groupKey: 'school_counselors',
          badgeLabel: '🎓 Cố vấn Trường',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }
      }
      for (const group of COUNSELOR_GROUPS) {
        const found = group.counselors.find(c => 
          extractedName.includes(c.name) || 
          c.fullName === extractedName ||
          extractedName.includes(c.fullName)
        )
        if (found) return found
      }
      const isAlumni = extractedName.includes('Cựu SV') || extractedName.includes('KTS') || extractedName.includes('Luật sư') || extractedName.includes('Dược sĩ')
      const isTeacher = extractedName.includes('Thầy') || extractedName.includes('Cô')
      const isExtractedUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(extractedName)
      if (!isExtractedUUID && extractedName.length > 2) {
        return {
          id: checkValue || 'custom',
          name: extractedName.split('-')[0].trim() || extractedName,
          title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV (Alumni)' : 'Mentor Sinh viên',
          fullName: extractedName,
          groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
          badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV (Alumni)' : '🚀 Mentor Sinh viên',
          badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
        }
      }
    }
  }

  // 3. Nếu checkValue là chuỗi trực tiếp từ option value (và không phải UUID thô)
  if (checkValue && typeof checkValue === 'string' && checkValue.length > 5 && !isUUID) {
    const isAlumni = checkValue.includes('Cựu SV') || checkValue.includes('KTS') || checkValue.includes('Luật sư') || checkValue.includes('Dược sĩ')
    const isTeacher = checkValue.includes('Thầy') || checkValue.includes('Cô')
    return {
      id: checkValue,
      name: checkValue.split('-')[0].trim() || checkValue,
      title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV (Alumni)' : 'Mentor Sinh viên',
      fullName: checkValue,
      groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
      badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV (Alumni)' : '🚀 Mentor Sinh viên',
      badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  }

  // 4. Mặc định: Nếu chưa có tên hoặc ID là UUID chưa map -> hiển thị Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)
  const dbName = counselorRelation?.full_name || (!isUUID && checkValue.length > 2 ? checkValue : '') || 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'
  const isAlumni = dbName.includes('Cựu SV') || dbName.includes('KTS') || dbName.includes('Luật sư') || dbName.includes('Dược sĩ')
  const isTeacher = dbName.includes('Thầy') || dbName.includes('Cô')
  return {
    id: counselorId || 'unknown',
    name: dbName,
    title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV (Alumni)' : 'Mentor Sinh viên',
    fullName: dbName,
    groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
    badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV (Alumni)' : '🚀 Mentor Sinh viên',
    badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
  }
}

// Quản lý LocalStorage cho suất hẹn tư vấn fallback
const LOCAL_STORAGE_KEY_PREFIX = 'counseling_sessions_local_'

const getLocalSessions = (userId) => {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + userId)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

const saveLocalSession = (userId, session) => {
  if (!userId) return
  try {
    const list = getLocalSessions(userId)
    const updated = [session, ...list]
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(updated))
  } catch (e) {
    console.error('Lỗi lưu local session:', e)
  }
}

const CounselingBooking = () => {
  const { user } = useAuth()
  const [mySessions, setMySessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dbError, setDbError] = useState(null)

  const [selectedCounselor, setSelectedCounselor] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [studentNotes, setStudentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMySessions()
  }, [user])

  // Tải danh sách các cuộc hẹn của học sinh kết hợp Supabase DB + Local Storage
  const fetchMySessions = async () => {
    if (!user) return
    setIsLoading(true)
    setDbError(null)

    const localItems = getLocalSessions(user.id)

    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*, counselor:counselor_id(full_name, email)')
        .eq('student_id', user.id)
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.warn('Lỗi truy vấn counseling_sessions Supabase:', error)
        if (localItems.length > 0) {
          setMySessions(localItems)
        } else {
          setDbError('Chưa nạp bảng counseling_sessions trong CSDL Supabase. Suất hẹn bạn đặt sẽ được tự động lưu tạm trên thiết bị!')
          setMySessions([])
        }
      } else {
        const dbList = data || []
        const dbIds = new Set(dbList.map(item => item.id))
        const uniqueLocal = localItems.filter(item => !dbIds.has(item.id))
        const merged = [...dbList, ...uniqueLocal]
        merged.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        setMySessions(merged)
      }
    } catch (error) {
      console.error('Lỗi fetch lịch hẹn:', error)
      setMySessions(localItems)
    } finally {
      setIsLoading(false)
    }
  }

  // Đặt lịch hẹn mới với xử lý Foreign Key & Local Fallback
  const handleBooking = async (e) => {
    e.preventDefault()
    if (!selectedCounselor) {
      setToast({ type: 'warning', message: 'Vui lòng chọn Chuyên viên hoặc Mentor tư vấn!' })
      return
    }
    if (!scheduledAt) {
      setToast({ type: 'warning', message: 'Vui lòng chọn Thời gian hẹn tư vấn!' })
      return
    }

    if (!user) {
      setToast({ type: 'error', message: 'Bạn cần đăng nhập để đặt lịch hẹn!' })
      return
    }

    setIsSubmitting(true)

    // Lấy thông tin chi tiết Chuyên gia/Mentor đã chọn từ UI list
    const expert = getCounselorDetails(selectedCounselor)
    const counselorFullName = expert ? expert.fullName : ''

    // Ghép thông tin Tên Chuyên gia vào student_notes để bảo toàn thông tin không bao giờ bị thất lạc
    const formattedNotes = counselorFullName 
      ? `[Chuyên gia/Mentor: ${counselorFullName}]\n${studentNotes}`.trim()
      : studentNotes

    // Chuẩn bị item session fallback cho LocalStorage
    const fallbackLocalSession = {
      id: `local-${Date.now()}`,
      student_id: user.id,
      mentor_id: selectedCounselor,
      counselor_id: selectedCounselor,
      counselor_name: counselorFullName,
      scheduled_at: scheduledAt,
      status: 'pending',
      student_notes: formattedNotes,
      created_at: new Date().toISOString(),
      is_local: true
    }

    let insertSuccess = false
    let insertedData = null

    try {
      // 1. Lần thử 1: Thử insert với counselor_id ban đầu và đính kèm thông tin
      const payload1 = {
        student_id: user.id,
        mentor_id: selectedCounselor,
        counselor_id: selectedCounselor,
        counselor_name: counselorFullName,
        scheduled_at: scheduledAt,
        status: 'pending',
        student_notes: formattedNotes
      }

      const { data: res1, error: err1 } = await supabase
        .from('counseling_sessions')
        .insert(payload1)
        .select('*, counselor:counselor_id(full_name, email)')
        .single()

      if (!err1 && res1) {
        insertSuccess = true
        insertedData = res1
      } else {
        console.warn('Insert Supabase Lần 1 thất bại:', err1)

        // Kiểm tra lỗi Foreign Key constraint (code 23503 hoặc message chứa foreign key)
        const isFKError = err1?.code === '23503' || 
                          err1?.message?.includes('foreign key constraint') || 
                          err1?.message?.includes('counselor_id') ||
                          err1?.details?.includes('counselor_id')

        if (isFKError) {
          console.log('Phát hiện lỗi Foreign Key constraint! Tiến hành retry với counselor_id = null...')

          // Lần thử 2: Retry với counselor_id = null
          const payload2 = {
            student_id: user.id,
            counselor_id: null,
            counselor_name: counselorFullName,
            scheduled_at: scheduledAt,
            status: 'pending',
            student_notes: formattedNotes
          }

          const { data: res2, error: err2 } = await supabase
            .from('counseling_sessions')
            .insert(payload2)
            .select('*')
            .single()

          if (!err2 && res2) {
            insertSuccess = true
            insertedData = res2
          } else {
            console.warn('Insert Supabase Lần 2 (counselor_id = null) thất bại:', err2)

            // Lần thử 3: Retry với counselor_id = user.id (nếu DB bắt buộc NOT NULL)
            const payload3 = {
              student_id: user.id,
              counselor_id: user.id,
              counselor_name: counselorFullName,
              scheduled_at: scheduledAt,
              status: 'pending',
              student_notes: formattedNotes
            }

            const { data: res3, error: err3 } = await supabase
              .from('counseling_sessions')
              .insert(payload3)
              .select('*')
              .single()

            if (!err3 && res3) {
              insertSuccess = true
              insertedData = res3
            }
          }
        }
      }
    } catch (error) {
      console.error('Lỗi kết nối Supabase:', error)
    }

    if (insertSuccess && insertedData) {
      setMySessions(prev => [...prev, insertedData])
      setDbError(null)
      setToast({ type: 'success', message: 'Đã gửi yêu cầu đặt lịch thành công!' })
    } else {
      // Fallback lưu Local Storage & Local State nếu Supabase thất bại
      console.log('Lưu vào Local Storage (Fallback mượt mà UI)!')
      saveLocalSession(user.id, fallbackLocalSession)
      setMySessions(prev => [...prev, fallbackLocalSession])
      setDbError(null)
      setToast({ type: 'success', message: 'Đã gửi yêu cầu đặt lịch thành công!' })
    }

    // Reset form inputs
    setSelectedCounselor('')
    setScheduledAt('')
    setStudentNotes('')
    setIsSubmitting(false)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-sm">
            <XCircle className="w-3 h-3" /> Từ chối
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-sm">
            <UserCheck className="w-3 h-3" /> Hoàn thành
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-sm">
            <Clock className="w-3 h-3" /> Chờ phê duyệt
          </span>
        )
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-reveal">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Đã cập nhật: Phân loại theo Nhóm trường & Mạng lưới Cựu SV
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-600" />
          🎓 Tư Vấn 1-1 Đối Chứng Thực Tế Với Chuyên Gia & Mentor
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Đăng ký lịch hẹn tư vấn cá nhân với Thầy Cô Cố vấn trường hoặc Mạng lưới Mentor Sinh viên đối chứng thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form đặt lịch */}
        <form onSubmit={handleBooking} className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Đăng ký suất hẹn mới</span>
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          </h3>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Chọn Chuyên viên / Mentor tư vấn
            </label>
            <select
              name="counselor_id"
              value={selectedCounselor}
              onChange={(e) => setSelectedCounselor(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-800 cursor-pointer transition-colors"
              required
            >
              <option value="">-- Chọn Thầy/Cô Cố Vấn hoặc Mentor Sinh Viên / Cựu SV --</option>
              {COUNSELOR_GROUPS.map((group) => (
                <optgroup key={group.groupKey} label={group.groupName}>
                  {group.counselors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Thời gian hẹn gặp</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold text-slate-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Ghi chú / Thắc mắc gửi chuyên viên</label>
            <textarea
              rows={4}
              placeholder="VD: Em muốn nhờ Thầy/Cô tư vấn chọn giữa ngành CNTT và An toàn thông tin, hoặc tư vấn môi trường học thực tế tại Bách Khoa..."
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-semibold"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full font-bold text-xs uppercase py-2.5"
          >
            GỬI YÊU CẦU ĐẶT LỊCH
          </Button>
        </form>

        {/* Danh sách lịch hẹn đã đặt */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>DANH SÁCH SUẤT HẸN ĐÃ ĐĂNG KÝ</span>
            <span className="text-[11px] font-semibold text-slate-500 normal-case">
              {mySessions.length} suất hẹn
            </span>
          </h3>

          {dbError && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-sm text-center space-y-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-amber-900">{dbError}</p>
              <Button variant="primary" onClick={fetchMySessions} className="text-xs font-bold uppercase py-2 px-6">
                Thử lại kết nối CSDL
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 bg-slate-200 rounded-sm"></div>
              <div className="h-24 bg-slate-200 rounded-sm"></div>
            </div>
          ) : mySessions.length > 0 ? (
            <div className="space-y-4">
              {mySessions.map((item, index) => {
                const expert = getCounselorDetails(item?.mentor_id || item?.counselor_id, item?.counselor, item?.student_notes, item?.counselor_name)
                const rawName = mentorMap[item?.mentor_id] || mentorMap[item?.counselor_id] || expert?.fullName || 'Cố vấn chuyên môn'
                const counselorName = (rawName.includes('11111111') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(rawName))
                  ? 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'
                  : rawName
                const displayNotes = item?.student_notes
                  ? item.student_notes.replace(/\[Chuyên gia\/Mentor:\s*[^\]]+\]\s*/, '')
                  : ''

                return (
                  <div key={item?.id || index} className="bg-white border border-slate-200 p-5 rounded-sm space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Nhãn phân loại chuyên gia / mentor */}
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded border ${expert?.badgeClass || 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                            {expert?.badgeLabel || 'Cố vấn'}
                          </span>
                          {getStatusBadge(item?.status)}
                          {item?.is_local && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-sm" title="Đã lưu tạm trên thiết bị">
                              💾 Đã lưu local
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">
                            Chuyên viên: {counselorName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Thời gian: {formatDateTimeFormatted(item?.scheduled_at)}</span>
                    </div>

                    {displayNotes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-sm border border-slate-100">
                        <span className="font-bold text-slate-700">Ghi chú của bạn: </span>
                        {displayNotes}
                      </div>
                    )}

                    {item?.counselor_notes && (
                      <div className="text-xs text-brand-800 bg-brand-50 p-2.5 rounded-sm border border-brand-200">
                        <span className="font-bold text-brand-900">Phản hồi từ Chuyên viên: </span>
                        {item.counselor_notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : !dbError && (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-sm text-xs font-semibold text-slate-500 space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
              <p>Chưa có dữ liệu suất hẹn tư vấn trong CSDL Supabase.</p>
              <p className="text-[11px] text-slate-400">Hãy chọn Cố vấn hoặc Mentor ở form bên trái để gửi đăng ký.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default CounselingBooking

