# Career Guidance Platform - Kế hoạch triển khai & Phân rã công việc

Dự án Web App Hướng nghiệp & Tư vấn Khát vọng Nghề nghiệp cho Học sinh sử dụng React (Vite), Tailwind CSS, Supabase.

---

## 📐 Sơ đồ cấu trúc thư mục dự kiến
```
huong-nghiep/
├── vercel.json
├── package.json
├── tailwind.config.js
├── vite.config.js
├── schema.sql
├── .env.example
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── lib/
    │   └── supabase.js
    ├── context/
    │   └── AuthContext.jsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx
    │   │   └── Sidebar.jsx
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── HollandChart.jsx
    │   │   └── Toast.jsx
    │   └── career/
    │       ├── MajorCard.jsx
    │       └── UniversityCard.jsx
    └── pages/
        ├── auth/
        │   ├── Login.jsx
        │   └── Register.jsx
        ├── student/
        │   ├── StudentDashboard.jsx
        │   ├── HollandTest.jsx
        │   ├── MajorExplorer.jsx
        │   ├── UniversityExplorer.jsx
        │   ├── RoadmapBuilder.jsx
        │   └── CounselingBooking.jsx
        ├── counselor/
        │   └── CounselorDashboard.jsx
        └── admin/
            └── AdminManagement.jsx
```

---

## 🛠️ Phân rã công việc chi tiết (Task Breakdown)

### PHẦN 1: THIẾT LẬP CƠ SỞ DỮ LIỆU & AUTHENTICATION (P0)

#### Task 1: Khởi tạo database Supabase
- **Mô tả:** Chạy file `schema.sql` trong SQL Editor của Supabase để tạo các bảng, trigger tự động tạo profile, hàm kiểm tra quyền, các chỉ mục (indexes) và các chính sách bảo mật RLS.
- **Đầu vào (INPUT):** File `schema.sql` hoàn chỉnh chứa cấu trúc 9 bảng và các chính sách RLS.
- **Đầu ra (OUTPUT):** Các bảng và trigger được tạo thành công trên Supabase.
- **Xác thực (VERIFY):** Kiểm tra trong giao diện Supabase Database thấy đầy đủ 9 bảng, RLS được kích hoạt, trigger `on_auth_user_created` được gắn vào bảng `auth.users`.
- **Người thực hiện:** `database-architect` (Skill: `database-design`)

#### Task 2: Cấu hình Seed Data
- **Mô tả:** Chèn dữ liệu mẫu thực tế vào các bảng `career_tests`, `majors`, `universities` và `major_university_map` để đảm bảo ứng dụng có sẵn dữ liệu chạy thử.
- **Đầu vào (INPUT):** Đoạn mã SQL INSERT chứa 30 câu hỏi Holland, 6 ngành học lớn, 5 trường Đại học lớn và bảng ánh xạ.
- **Đầu ra (OUTPUT):** Các dòng dữ liệu được chèn thành công trong database.
- **Xác thực (VERIFY):** Truy vấn thử dữ liệu trong các bảng trên Supabase dashboard trả về kết quả chính xác, không rỗng.
- **Người thực hiện:** `database-architect` (Skill: `database-design`)

---

### PHẦN 2: THIẾT LẬP DỰ ÁN FRONTEND & AUTHENTICATION FLOW (P1)

#### Task 3: Khởi tạo dự án React (Vite) + Tailwind CSS
- **Mô tả:** Tạo dự án React bằng Vite, cài đặt Tailwind CSS, Lucide Icons, React Router DOM, Recharts và Supabase JS client.
- **Đầu vào (INPUT):** File `package.json`, cấu hình `tailwind.config.js` và `vite.config.js`.
- **Đầu ra (OUTPUT):** Thư mục source code React hoàn chỉnh chạy được dev server ở cổng 3000.
- **Xác thực (VERIFY):** Chạy `npm run dev` không lỗi và truy cập được trang chủ hiển thị chữ mặc định.
- **Người thực hiện:** `frontend-specialist` (Skill: `clean-code`, `tailwind-patterns`)

#### Task 4: Tích hợp Supabase Client & Context Auth
- **Mô tả:** Tạo file kết nối `src/lib/supabase.js` và Context `src/context/AuthContext.jsx` để lưu trữ thông tin đăng nhập và vai trò (role) của user toàn cục.
- **Đầu vào (INPUT):** Supabase URL & Anon Key lấy từ môi trường `.env`.
- **Đầu ra (OUTPUT):** `AuthContext` cung cấp `user`, `role`, `loading`, `signIn`, `signUp`, `signOut`.
- **Xác thực (VERIFY):** Đăng nhập thử tài khoản mới, kiểm tra `localStorage` và session được đồng bộ chính xác.
- **Người thực hiện:** `backend-specialist` (Skill: `api-patterns`)

---

### PHẦN 3: XÂY DỰNG GIAO DIỆN & TÍNH NĂNG CHO HỌC SINH (P2)

#### Task 5: Trang làm bài trắc nghiệm Holland (Holland Assessment)
- **Mô tả:** Thiết kế giao diện làm bài chia câu hỏi theo trang, có ProgressBar và lưu trạng thái làm bài tạm thời.
- **Đầu vào (INPUT):** Dữ liệu câu hỏi lấy từ bảng `career_tests` thông qua API của Supabase.
- **Đầu ra (OUTPUT):** Trang làm bài trắc nghiệm tương tác hoàn chỉnh. Khi nộp bài sẽ tự động tính điểm theo RIASEC, lưu kết quả vào `test_results` và chuyển hướng đến trang kết quả.
- **Xác thực (VERIFY):** Nộp bài kiểm tra -> Dữ liệu lưu thành công vào bảng `test_results` kèm biểu đồ Radar hiển thị đúng tỉ lệ điểm số.
- **Người thực hiện:** `frontend-specialist` (Skill: `frontend-design`, `react-best-practices`)

#### Task 6: Trang tra cứu Ngành học & Trường Đại học (Explorer)
- **Mô tả:** Xây dựng trang tra cứu ngành và trường đại học, tích hợp bộ lọc theo vùng miền, mức lương, tổ hợp môn thi và khối Holland tương ứng. Tích hợp nút Bookmark lưu thông tin.
- **Đầu vào (INPUT):** Dữ liệu từ các bảng `majors`, `universities` và `saved_items`.
- **Đầu ra (OUTPUT):** Giao diện tìm kiếm, lọc và lưu trữ ngành học/trường đại học mục tiêu.
- **Xác thực (VERIFY):** Tìm kiếm từ khóa "Công nghệ" -> hiển thị ngành Công nghệ thông tin. Nhấn bookmark -> kiểm tra bảng `saved_items` ghi nhận chính xác.
- **Người thực hiện:** `frontend-specialist` (Skill: `frontend-design`)

#### Task 7: Xây dựng Lộ trình học tập & Đặt lịch tư vấn (Roadmap & Booking)
- **Mô tả:** Cho phép học sinh tạo lộ trình học tập theo năm học lớp 10, 11, 12 và đặt lịch tư vấn 1-1 với Chuyên viên.
- **Đầu vào (INPUT):** Bảng `career_roadmaps` và `counseling_sessions`.
- **Đầu ra (OUTPUT):** Giao diện quản lý Milestone dạng Kanban/Timeline và Form đăng ký tư vấn.
- **Xác thực (VERIFY):** Tạo milestone mới -> lưu đúng trạng thái. Gửi lịch tư vấn -> chuyên viên nhận được yêu cầu trong danh sách chờ.
- **Người thực hiện:** `frontend-specialist` (Skill: `frontend-design`)

---

### PHẦN 4: DÀNH CHO CHUYÊN VIÊN & ADMIN (P3)

#### Task 8: Dashboard của Chuyên viên tư vấn (Counselor Dashboard)
- **Mô tả:** Hiển thị danh sách học sinh thuộc quyền tư vấn, kết quả Holland của học sinh và quản lý các cuộc hẹn tư vấn (Phê duyệt/Từ chối + Nhập ghi chú).
- **Đầu vào (INPUT):** Bảng `counseling_sessions`, `profiles` và `test_results`.
- **Đầu ra (OUTPUT):** Trang quản lý lịch hẹn tư vấn và báo cáo kết quả trắc nghiệm của học sinh.
- **Xác thực (VERIFY):** Counselor cập nhật lịch hẹn thành 'confirmed' -> Trang học sinh hiển thị trạng thái đã xác nhận.
- **Người thực hiện:** `frontend-specialist` (Skill: `react-best-practices`)

#### Task 9: Trang quản trị của Admin (Admin Management)
- **Mô tả:** Admin xem tổng quan hệ thống (số lượng user, số bài test đã làm), quản lý các danh mục Majors, Universities và phân quyền users.
- **Đầu vào (INPUT):** Dữ liệu thống kê tổng hợp từ Supabase.
- **Đầu ra (OUTPUT):** Bảng điều khiển quản trị tối giản, trực quan.
- **Xác thực (VERIFY):** Admin cập nhật vai trò của một học sinh thành counselor -> user đó khi đăng nhập lại sẽ hiển thị giao diện Counselor.
- **Người thực hiện:** `frontend-specialist` (Skill: `react-best-practices`)

---

## 🏁 Xác minh tổng thể dự án (Phase X)
Sau khi hoàn thành code, thực hiện các lệnh sau:
1. Chạy lint và build dự án: `npm run build`.
2. Kiểm tra tính bảo mật của mã nguồn và biến môi trường.
3. Test các kịch bản E2E trên local trước khi deploy lên Vercel.
