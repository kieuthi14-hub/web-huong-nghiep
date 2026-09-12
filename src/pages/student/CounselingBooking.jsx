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
  Sparkles,
  Video,
  MapPin,
  ExternalLink,
  MessageSquare
} from 'lucide-react'

// Hàm phân tích thông tin Nền tảng Gặp gỡ (Google Meet, Zoom, Địa điểm trực tiếp) từ ghi chú chuyên viên
export const parseMeetingInfo = (notes) => {
  if (!notes || typeof notes !== 'string') return { meetingUrl: null, locationText: null, cleanMessage: '' }
  
  // 1. URL phòng họp (Google Meet, Zoom, Teams, Web)
  const urlMatch = notes.match(/(https?:\/\/[^\s\],"'<>]+)/i)
  const meetingUrl = urlMatch ? urlMatch[1] : null

  // 2. Địa điểm trực tiếp
  const locMatch = notes.match(/\[(?:Địa điểm|Phòng gặp|Địa chỉ):\s*([^\]]+)\]/i)
  let locationText = locMatch ? locMatch[1].trim() : null

  // Nếu không có tag nhưng notes chứa từ "Phòng" hoặc "Trường"
  if (!locationText && !meetingUrl && (notes.includes('Phòng') || notes.includes('phòng') || notes.includes('Trường') || notes.includes('Văn phòng'))) {
    locationText = notes.split('\n')[0].replace(/^\[.*?\]/, '').trim()
  }

  // 3. Tin nhắn làm sạch
  let cleanMessage = notes
    .replace(/\[(?:Link|Link phòng họp|Phòng họp|Phòng gặp|Địa điểm|Địa chỉ):\s*[^\]]+\]/gi, '')
    .replace(/(https?:\/\/[^\s\],"'<>]+)/gi, '')
    .replace(/^[\s\n\r-]+|[\s\n\r-]+$/g, '')
    .trim()

  return { meetingUrl, locationText, cleanMessage }
}

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
  // 1. ƯU TIÊN SỐ 1: Bóc tách chính xác từ sessionNotes nếu có tag [Chuyên gia/Mentor: ...]
  if (sessionNotes && typeof sessionNotes === 'string') {
    const match = sessionNotes.match(/^\[Chuyên gia\/Mentor:\s*([\s\S]+?)\](?:\r?\n|$)/) ||
                  sessionNotes.match(/\[Chuyên gia\/Mentor:\s*([\s\S]+?)\]/)
    if (match && match[1]) {
      const extracted = match[1].trim()
      // Tìm trong COUNSELOR_GROUPS
      for (const group of COUNSELOR_GROUPS) {
        const found = group.counselors.find(c => 
          c.fullName === extracted ||
          c.id === extracted ||
          c.name === extracted ||
          extracted.includes(c.name)
        )
        if (found) return found
      }
      if (extracted === '11111111-1111-1111-1111-111111111111') {
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
      const isAlumni = extracted.includes('Cựu SV') || extracted.includes('KTS') || extracted.includes('Luật sư') || extracted.includes('Dược sĩ')
      const isTeacher = extracted.includes('Thầy') || extracted.includes('Cô')
      return {
        id: counselorId || 'mentor',
        name: extracted.split('-')[0].trim() || extracted,
        title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV (Alumni)' : 'Mentor Sinh viên',
        fullName: extracted,
        groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
        badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV (Alumni)' : '🚀 Mentor Sinh viên',
        badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
      }
    }
  }

  // 2. ƯU TIÊN SỐ 2: Kiểm tra sessionCounselorName nếu có tên người thực
  if (sessionCounselorName && typeof sessionCounselorName === 'string' && sessionCounselorName.length > 3) {
    if (!sessionCounselorName.includes('11111111') && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(sessionCounselorName)) {
      for (const group of COUNSELOR_GROUPS) {
        const found = group.counselors.find(c => 
          c.fullName === sessionCounselorName || c.name === sessionCounselorName || sessionCounselorName.includes(c.name)
        )
        if (found) return found
      }
      const isAlumni = sessionCounselorName.includes('Cựu SV') || sessionCounselorName.includes('KTS') || sessionCounselorName.includes('Luật sư') || sessionCounselorName.includes('Dược sĩ')
      const isTeacher = sessionCounselorName.includes('Thầy') || sessionCounselorName.includes('Cô')
      return {
        id: counselorId || 'counselor',
        name: sessionCounselorName.split('-')[0].trim() || sessionCounselorName,
        title: isTeacher ? 'Cố vấn Hướng nghiệp' : isAlumni ? 'Cựu SV (Alumni)' : 'Mentor Sinh viên',
        fullName: sessionCounselorName,
        groupKey: isTeacher ? 'school_counselors' : 'student_mentors',
        badgeLabel: isTeacher ? '🎓 Cố vấn Trường' : isAlumni ? '💼 Cựu SV (Alumni)' : '🚀 Mentor Sinh viên',
        badgeClass: isTeacher ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isAlumni ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
      }
    }
  }

  // 3. ƯU TIÊN SỐ 3: Kiểm tra counselorId (khi chọn từ dropdown lúc đặt lịch mới)
  const checkValue = String(counselorId || '').trim()
  if (checkValue) {
    for (const group of COUNSELOR_GROUPS) {
      const found = group.counselors.find(c => c.id === checkValue || c.fullName === checkValue)
      if (found) return found
    }
    if (mentorMap[checkValue]) {
      const mappedName = mentorMap[checkValue]
      for (const group of COUNSELOR_GROUPS) {
        const found = group.counselors.find(c => c.fullName === mappedName || mappedName.includes(c.name))
        if (found) return found
      }
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(checkValue)
    if (!isUUID && checkValue.length > 5) {
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
  }

  // 4. Mặc định
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

// Hàm chuẩn hóa counselor_id sang UUID hợp lệ trong bảng profiles (1111... hoặc 2222...)
const getValidCounselorId = (id) => {
  if (id === '22222222-2222-2222-2222-222222222222') return '22222222-2222-2222-2222-222222222222'
  return '11111111-1111-1111-1111-111111111111'
}

// Quản lý LocalStorage cho suất hẹn tư vấn fallback
const LOCAL_STORAGE_KEY_PREFIX = 'counseling_sessions_local_'

const getLocalSessions = (userId) => {
  if (!userId) return []
  const result = []
  const seen = new Set()
  try {
    const keys = [
      LOCAL_STORAGE_KEY_PREFIX + userId,
      'counseling_sessions_local',
      'counseling_sessions'
    ]
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.scheduled_at && !seen.has(item.scheduled_at)) {
                seen.add(item.scheduled_at)
                result.push({ ...item, is_local: true })
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Lỗi đọc local storage:', e)
  }
  return result
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

  // Tải danh sách các cuộc hẹn của học sinh kết hợp Supabase DB + Tự động đồng bộ
  const fetchMySessions = async () => {
    if (!user) return
    setIsLoading(true)
    setDbError(null)

    const localItems = getLocalSessions(user.id)

    try {
      // 1. Đảm bảo profile học sinh tồn tại trong Supabase profiles để không vướng foreign key
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Học sinh',
          role: 'student'
        }, { onConflict: 'id' })
      } catch (profErr) {
        console.warn('Profile upsert check:', profErr)
      }

      // 2. Tải danh sách thực tế từ Supabase
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('*')
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
        let dbList = data || []
        const dbScheduledAts = new Set(dbList.map(item => item.scheduled_at))

        // 3. Tự động đồng bộ các suất hẹn local chưa kịp gửi lên Supabase
        const unsynced = localItems.filter(item => (item.is_local || String(item.id).startsWith('local-')) && !dbScheduledAts.has(item.scheduled_at))
        if (unsynced.length > 0) {
          console.log('⚡ Phát hiện suất hẹn local chưa đồng bộ, đang gửi lên Supabase...', unsynced.length)
          const syncedIds = new Set()
          for (const item of unsynced) {
            try {
              const mentorName = item.counselor_name || item.mentor_id || ''
              let notes = item.student_notes || ''
              if (mentorName && !notes.includes('[Chuyên gia/Mentor:')) {
                notes = `[Chuyên gia/Mentor: ${mentorName}]\n${notes}`.trim()
              }
              const syncPayload = {
                student_id: user.id,
                counselor_id: getValidCounselorId(item.counselor_id),
                scheduled_at: item.scheduled_at,
                status: item.status || 'pending',
                student_notes: notes
              }
              const { data: syncedData, error: syncErr } = await supabase
                .from('counseling_sessions')
                .insert(syncPayload)
                .select()
              if (!syncErr && syncedData && syncedData.length > 0) {
                syncedIds.add(item.id)
                dbList.push(syncedData[0])
              } else {
                console.warn('Sync item error:', syncErr)
              }
            } catch (err) {
              console.warn('Lỗi đồng bộ local session:', err)
            }
          }
          // Dọn dẹp local storage các item đã đồng bộ thành công
          try {
            const remaining = localItems.filter(li => !syncedIds.has(li.id))
            if (remaining.length > 0) {
              localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + user.id, JSON.stringify(remaining))
            } else {
              localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + user.id)
            }
          } catch (e) {}
        }

        dbList.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        setMySessions(dbList)
      }
    } catch (error) {
      console.error('Lỗi fetch lịch hẹn:', error)
      setMySessions(localItems)
    } finally {
      setIsLoading(false)
    }
  }

  // Đặt lịch hẹn mới: Lưu trực tiếp vào Supabase CSDL để Admin duyệt
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
    const counselorFullName = expert ? expert.fullName : selectedCounselor

    // Ghép thông tin Tên Chuyên gia vào student_notes để bảo toàn thông tin 100% trong CSDL Supabase
    const formattedNotes = `[Chuyên gia/Mentor: ${counselorFullName}]\n${studentNotes}`.trim()

    // Chuẩn hóa counselor_id sang UUID hợp lệ trong profiles
    const validCounselorId = getValidCounselorId(selectedCounselor)

    // 1. Đảm bảo profile của học sinh tồn tại trong bảng profiles của Supabase để không vi phạm FK
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Học sinh',
        role: 'student'
      }, { onConflict: 'id' })
    } catch (profErr) {
      console.warn('Upsert profile notice:', profErr)
    }

    // Chuẩn bị payload CHỈ chứa các cột tồn tại trong CSDL Supabase:
    // (student_id, counselor_id, scheduled_at, status, student_notes)
    const payload = {
      student_id: user.id,
      counselor_id: validCounselorId,
      scheduled_at: scheduledAt,
      status: 'pending',
      student_notes: formattedNotes
    }

    let insertSuccess = false
    let insertedData = null

    try {
      const { data: resData, error: resError } = await supabase
        .from('counseling_sessions')
        .insert(payload)
        .select()

      if (!resError && Array.isArray(resData) && resData.length > 0) {
        insertSuccess = true
        insertedData = {
          ...resData[0],
          counselor: { full_name: counselorFullName, email: 'counselor@edu.vn' }
        }
      } else {
        console.error('Lỗi khi ghi lịch hẹn vào Supabase:', resError)
      }
    } catch (error) {
      console.error('Lỗi ngoại lệ khi ghi Supabase:', error)
    }

    if (insertSuccess && insertedData) {
      setMySessions(prev => [insertedData, ...prev])
      setDbError(null)
      setToast({ type: 'success', message: '🎉 Đã gửi yêu cầu đặt lịch hẹn thành công lên hệ thống để Admin duyệt!' })
    } else {
      // Fallback lưu Local Storage nếu mạng mất kết nối
      const fallbackLocalSession = {
        id: `local-${Date.now()}`,
        student_id: user.id,
        counselor_id: validCounselorId,
        counselor_name: counselorFullName,
        scheduled_at: scheduledAt,
        status: 'pending',
        student_notes: formattedNotes,
        created_at: new Date().toISOString(),
        is_local: true
      }
      saveLocalSession(user.id, fallbackLocalSession)
      setMySessions(prev => [fallbackLocalSession, ...prev])
      setToast({ type: 'warning', message: 'Hệ thống đã lưu tạm suất hẹn trên thiết bị do kết nối CSDL gián đoạn. Suất hẹn sẽ tự động đồng bộ khi tải lại trang!' })
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

  const localUnsyncedCount = mySessions.filter(s => s.is_local || String(s.id).startsWith('local-')).length

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

      {localUnsyncedCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-sm flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>
              Có <strong>{localUnsyncedCount}</strong> suất hẹn đang lưu tạm trên thiết bị do kết nối CSDL trước đó gián đoạn.
            </span>
          </div>
          <button
            type="button"
            onClick={fetchMySessions}
            disabled={isLoading}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer whitespace-nowrap shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ ngay lên Admin</span>
          </button>
        </div>
      )}

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
                const expert = getCounselorDetails(item?.counselor_id, item?.counselor, item?.student_notes, item?.counselor_name || item?.mentor_id)
                const counselorName = expert?.fullName || 'Thầy Nguyễn Văn A (Cố vấn Hướng nghiệp)'
                const displayNotes = item?.student_notes
                  ? item.student_notes.replace(/^\[Chuyên gia\/Mentor:\s*[\s\S]+?\](?:\r?\n|$)/, '').trim()
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

                    {/* NỀN TẢNG GẶP GỠ: GOOGLE MEET / PHÒNG TRỰC TIẾP */}
                    {item?.status === 'confirmed' || item?.status === 'approved' || item?.status === 'completed' ? (() => {
                      const meetingInfo = parseMeetingInfo(item?.counselor_notes)
                      const isOnline = Boolean(meetingInfo.meetingUrl)

                      if (isOnline) {
                        const isGoogleMeet = meetingInfo.meetingUrl.includes('meet.google')
                        const isZoom = meetingInfo.meetingUrl.includes('zoom.us')

                        return (
                          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-sm space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                                <Video className="w-4 h-4 text-emerald-600 animate-pulse" />
                                Nền tảng Gặp gỡ Trực tuyến (1-1 Online)
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 border border-emerald-300 rounded uppercase">
                                {isGoogleMeet ? '🌐 Google Meet' : isZoom ? '💻 Zoom Meeting' : '🌐 Phòng họp Online'}
                              </span>
                            </div>
                            
                            <p className="text-xs text-emerald-800 font-medium">
                              Buổi tư vấn định hướng sẽ diễn ra qua phòng họp trực tuyến. Đến khung giờ đã hẹn, bạn hãy bấm nút bên dưới để vào gặp Chuyên gia/Mentor:
                            </p>

                            <div className="flex items-center gap-3 pt-1 flex-wrap">
                              <a
                                href={meetingInfo.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all cursor-pointer"
                              >
                                <Video className="w-4 h-4" />
                                <span>{isGoogleMeet ? '👉 Tham gia phòng Google Meet' : isZoom ? '👉 Tham gia phòng Zoom' : '👉 Vào phòng họp trực tuyến'}</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                              </a>
                            </div>

                            {meetingInfo.cleanMessage && (
                              <div className="text-[11px] text-emerald-900 pt-2 border-t border-emerald-200 font-semibold flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                <span>Hướng dẫn từ Chuyên viên: {meetingInfo.cleanMessage}</span>
                              </div>
                            )}
                          </div>
                        )
                      }

                      if (meetingInfo.locationText) {
                        return (
                          <div className="bg-sky-50 border border-sky-300 p-4 rounded-sm space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5 uppercase tracking-wider">
                                <MapPin className="w-4 h-4 text-sky-600" />
                                Địa điểm Gặp mặt Trực tiếp tại Trường (Offline)
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-200 text-sky-900 border border-sky-300 rounded uppercase">
                                🏛️ Phòng Tham vấn trường
                              </span>
                            </div>
                            <div className="text-xs text-sky-900 font-bold flex items-center gap-2 bg-white/70 p-2.5 rounded border border-sky-200">
                              <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                              <span>{meetingInfo.locationText}</span>
                            </div>
                            {meetingInfo.cleanMessage && (
                              <div className="text-[11px] text-sky-800 pt-1 font-medium flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                                <span>Lời nhắn: {meetingInfo.cleanMessage}</span>
                              </div>
                            )}
                          </div>
                        )
                      }

                      // Mặc định nếu đã duyệt nhưng chưa nhập link/phòng
                      return (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-sm text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Lịch hẹn đã được Admin xác nhận. Chuyên viên sẽ liên hệ và gửi link Google Meet trước giờ hẹn.</span>
                        </div>
                      )
                    })() : item?.status === 'rejected' ? (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-sm text-xs text-rose-700 font-semibold flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Yêu cầu hẹn đã bị từ chối hoặc cần đổi lịch. Bạn có thể chọn thời gian hoặc Chuyên viên khác để đăng ký lại.</span>
                      </div>
                    ) : (
                      <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-sm text-xs text-amber-800 font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Đang chờ Admin phê duyệt & thiết lập phòng gặp (Google Meet / Trực tiếp).</span>
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

