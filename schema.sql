-- =========================================================================
-- KHỞI TẠO CẤU TRÚC DATABASE CAREER GUIDANCE PLATFORM
-- =========================================================================

-- Kích hoạt extension uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Xóa các trigger và bảng cũ nếu có (đảm bảo tính sạch sẽ khi chạy lại)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_counselor();

DROP TABLE IF EXISTS public.counseling_sessions CASCADE;
DROP TABLE IF EXISTS public.career_roadmaps CASCADE;
DROP TABLE IF EXISTS public.saved_items CASCADE;
DROP TABLE IF EXISTS public.major_university_map CASCADE;
DROP TABLE IF EXISTS public.test_results CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.majors CASCADE;
DROP TABLE IF EXISTS public.career_tests CASCADE;

-- 1. BẢNG MAJORS (Ngành học)
CREATE TABLE public.majors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    required_skills TEXT[] DEFAULT '{}',
    average_salary_range TEXT,
    career_prospects TEXT,
    holland_codes TEXT[] DEFAULT '{}', -- e.g. ['I', 'R', 'C']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. BẢNG PROFILES (Mở rộng từ auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'counselor', 'student')),
    grade_level TEXT CHECK (grade_level IN ('Grade 10', 'Grade 11', 'Grade 12')),
    target_major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. BẢNG CAREER TESTS (Bộ đề trắc nghiệm)
CREATE TABLE public.career_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('holland', 'mbti')),
    questions_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. BẢNG UNIVERSITIES (Trường Đại học/Cao đẳng)
CREATE TABLE public.universities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    region TEXT NOT NULL CHECK (region IN ('Bắc', 'Trung', 'Nam')),
    website TEXT,
    tuition_fee_per_year NUMERIC,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. BẢNG TEST RESULTS (Kết quả trắc nghiệm)
CREATE TABLE public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    test_id UUID REFERENCES public.career_tests(id) ON DELETE CASCADE NOT NULL,
    scores_json JSONB NOT NULL, -- Định dạng: {"R": 12, "I": 8, "A": 15, "S": 20, "E": 14, "C": 10}
    primary_code TEXT NOT NULL, -- e.g. "SAE" hoặc "A"
    recommended_majors_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. BẢNG MAP NGÀNH - TRƯỜNG (Ánh xạ 1-n, n-n kèm điểm chuẩn)
CREATE TABLE public.major_university_map (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    benchmark_scores_json JSONB NOT NULL, -- e.g. {"2022": 26.5, "2023": 27.0, "2024": 27.25}
    subject_groups TEXT[] DEFAULT '{}' -- e.g. ['A00', 'A01', 'D01']
);

-- 7. BẢNG SAVED ITEMS (Bookmarks)
CREATE TABLE public.saved_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('major', 'university')),
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (student_id, item_type, item_id)
);

-- 8. BẢNG CAREER ROADMAPS (Lộ trình hướng nghiệp học sinh)
CREATE TABLE public.career_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. BẢNG COUNSELING SESSIONS (Lịch hẹn tư vấn 1-1)
CREATE TABLE public.counseling_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    counselor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    student_notes TEXT,
    counselor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- THIẾT LẬP INDEXES ĐỂ TỐI ƯU HÓA TRUY VẤN
-- =========================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_test_results_student ON public.test_results(student_id);
CREATE INDEX idx_major_university_map_major ON public.major_university_map(major_id);
CREATE INDEX idx_major_university_map_uni ON public.major_university_map(university_id);
CREATE INDEX idx_saved_items_student ON public.saved_items(student_id);
CREATE INDEX idx_career_roadmaps_student ON public.career_roadmaps(student_id);
CREATE INDEX idx_counseling_sessions_student ON public.counseling_sessions(student_id);
CREATE INDEX idx_counseling_sessions_counselor ON public.counseling_sessions(counselor_id);

-- =========================================================================
-- TRIGGER TỰ ĐỘNG KHỞI TẠO PROFILE KHI ĐĂNG KÝ
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Học sinh mới'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- CẤU HÌNH ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================================

-- Bật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_university_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;

-- Hàm kiểm tra vai trò admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hàm kiểm tra vai trò counselor
CREATE OR REPLACE FUNCTION public.is_counselor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'counselor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: PROFILES
CREATE POLICY "Cho phép tất cả user authenticated đọc profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Cho phép user tự cập nhật profile chính mình" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admin có toàn quyền trên profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: CAREER_TESTS
CREATE POLICY "Cho phép tất cả user đọc đề test" ON public.career_tests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chỉ Admin được chỉnh sửa đề test" ON public.career_tests
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: MAJORS
CREATE POLICY "Cho phép tất cả user đọc ngành học" ON public.majors
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chỉ Admin được chỉnh sửa ngành học" ON public.majors
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: UNIVERSITIES
CREATE POLICY "Cho phép tất cả user đọc trường học" ON public.universities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chỉ Admin được chỉnh sửa trường học" ON public.universities
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: MAJOR_UNIVERSITY_MAP
CREATE POLICY "Cho phép tất cả user đọc liên kết ngành - trường" ON public.major_university_map
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chỉ Admin được chỉnh sửa liên kết ngành - trường" ON public.major_university_map
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: TEST_RESULTS
CREATE POLICY "Học sinh tự xem kết quả của mình" ON public.test_results
    FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Counselor xem kết quả của tất cả học sinh" ON public.test_results
    FOR SELECT TO authenticated USING (public.is_counselor());

CREATE POLICY "Học sinh tự lưu kết quả trắc nghiệm" ON public.test_results
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Học sinh tự xóa kết quả trắc nghiệm của mình" ON public.test_results
    FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Admin có toàn quyền trên kết quả trắc nghiệm" ON public.test_results
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: SAVED_ITEMS
CREATE POLICY "Học sinh tự xem bookmark của mình" ON public.saved_items
    FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Học sinh tự thêm bookmark" ON public.saved_items
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Học sinh tự xóa bookmark" ON public.saved_items
    FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- POLICIES: CAREER_ROADMAPS
CREATE POLICY "Học sinh tự quản lý lộ trình cá nhân" ON public.career_roadmaps
    FOR ALL TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Counselor xem lộ trình học sinh" ON public.career_roadmaps
    FOR SELECT TO authenticated USING (public.is_counselor());

CREATE POLICY "Admin có toàn quyền trên lộ trình" ON public.career_roadmaps
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: COUNSELING_SESSIONS
CREATE POLICY "Học sinh xem lịch hẹn tư vấn của mình" ON public.counseling_sessions
    FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Học sinh đăng ký lịch hẹn tư vấn" ON public.counseling_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Học sinh tự cập nhật trạng thái hủy lịch hẹn" ON public.counseling_sessions
    FOR UPDATE TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Counselor quản lý các lịch hẹn tư vấn" ON public.counseling_sessions
    FOR ALL TO authenticated USING (auth.uid() = counselor_id OR public.is_counselor());

CREATE POLICY "Admin có toàn quyền trên các lịch hẹn" ON public.counseling_sessions
    FOR ALL TO authenticated USING (public.is_admin());


-- =========================================================================
-- SEED DATA: DỮ LIỆU MẪU BAN ĐẦU
-- =========================================================================

-- 1. Thêm bộ câu hỏi Holland RIASEC (30 câu hỏi mẫu thực tế)
INSERT INTO public.career_tests (title, description, type, questions_json) VALUES (
    'Trắc nghiệm tính cách nghề nghiệp Holland (RIASEC)',
    'Khám phá thế giới nghề nghiệp thông qua 6 nhóm tính cách đặc trưng: Kỹ thuật (R), Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E) và Nghiệp vụ (C). Hãy trả lời thành thật với sở thích của bản thân.',
    'holland',
    '[
        {"id": 1, "text": "Tôi thích tự tay lắp ráp đồ đạc, sửa chữa máy móc hoặc các thiết bị điện trong gia đình.", "category": "R"},
        {"id": 2, "text": "Tôi thích các công việc vận động thể chất ngoài trời hoặc làm việc thực địa hơn là ngồi văn phòng.", "category": "R"},
        {"id": 3, "text": "Tôi thích sử dụng các công cụ cầm tay, máy cơ khí hoặc vận hành xe cộ.", "category": "R"},
        {"id": 4, "text": "Tôi thích tham gia hoạt động làm vườn, chăn nuôi hoặc trồng trọt.", "category": "R"},
        {"id": 5, "text": "Tôi cảm thấy hứng thú khi giải quyết các vấn đề kỹ thuật thực tế.", "category": "R"},
        
        {"id": 6, "text": "Tôi thích tìm hiểu các hiện tượng tự nhiên, làm thí nghiệm hóa học hoặc vật lý.", "category": "I"},
        {"id": 7, "text": "Tôi thích giải quyết các bài toán hóc búa, câu đố logic phức tạp.", "category": "I"},
        {"id": 8, "text": "Tôi thích nghiên cứu về lập trình, thuật toán máy tính hoặc cấu trúc dữ liệu.", "category": "I"},
        {"id": 9, "text": "Tôi thích đọc các tài liệu khoa học, bài viết phân tích chuyên sâu về công nghệ.", "category": "I"},
        {"id": 10, "text": "Tôi thích tìm ra bản chất nguyên nhân của một vấn đề khoa học.", "category": "I"},
        
        {"id": 11, "text": "Tôi thích vẽ tranh, phác thảo thiết kế thời trang hoặc đồ họa số.", "category": "A"},
        {"id": 12, "text": "Tôi thích viết lách như sáng tác truyện ngắn, thơ ca hoặc viết blog chia sẻ cảm xúc.", "category": "A"},
        {"id": 13, "text": "Tôi thích chơi nhạc cụ, ca hát hoặc tham gia các hoạt động biểu diễn văn nghệ.", "category": "A"},
        {"id": 14, "text": "Tôi thường nảy ra nhiều ý tưởng trang trí phòng ốc sáng tạo, phá cách.", "category": "A"},
        {"id": 15, "text": "Tôi đánh giá cao vẻ đẹp của nghệ thuật kiến trúc, điện ảnh độc lập.", "category": "A"},
        
        {"id": 16, "text": "Tôi thích giúp đỡ, chăm sóc người khác hoặc tham gia công tác xã hội, từ thiện.", "category": "S"},
        {"id": 17, "text": "Tôi thích giảng dạy, hướng dẫn hoặc truyền đạt kiến thức mới cho bạn bè.", "category": "S"},
        {"id": 18, "text": "Tôi thích tổ chức sự kiện, gắn kết mọi người và điều phối hoạt động đội nhóm.", "category": "S"},
        {"id": 19, "text": "Tôi thích lắng nghe tâm sự, tư vấn và giúp người khác vượt qua khủng hoảng tâm lý.", "category": "S"},
        {"id": 20, "text": "Tôi thích môi trường làm việc cộng đồng, hợp tác thân thiện thay vì cạnh tranh.", "category": "S"},
        
        {"id": 21, "text": "Tôi thích thuyết phục người khác đồng ý với quan điểm cá nhân hoặc ủng hộ dự án của mình.", "category": "E"},
        {"id": 22, "text": "Tôi muốn tự khởi nghiệp kinh doanh, mở cửa hàng hoặc thành lập công ty riêng.", "category": "E"},
        {"id": 23, "text": "Tôi tự tin đảm nhận vai trò trưởng nhóm để điều phối, phân công công việc cho tập thể.", "category": "E"},
        {"id": 24, "text": "Tôi thích tham gia vào quá trình thương lượng, đàm phán hợp đồng hoặc lên chiến dịch marketing.", "category": "E"},
        {"id": 25, "text": "Tôi cảm thấy thoải mái khi trình bày ý kiến, thuyết trình trước đám đông.", "category": "E"},
        
        {"id": 26, "text": "Tôi thích phân loại dữ liệu, sắp xếp hồ sơ, giấy tờ ngăn nắp và có hệ thống.", "category": "C"},
        {"id": 27, "text": "Tôi thích làm việc với các con số, tính toán chi phí và xây dựng bảng tính Excel.", "category": "C"},
        {"id": 28, "text": "Tôi thích tuân thủ một quy trình công việc có hướng dẫn và tiêu chuẩn rõ ràng.", "category": "C"},
        {"id": 29, "text": "Tôi thích kiểm tra tính chính xác của hóa đơn, hợp đồng tài chính.", "category": "C"},
        {"id": 30, "text": "Tôi là người cẩn thận, chú trọng đến từng chi tiết nhỏ trong công việc hàng ngày.", "category": "C"}
    ]'::jsonb
);

-- 2. Thêm dữ liệu Ngành học tiêu biểu (Majors)
INSERT INTO public.majors (name, code, category, description, required_skills, average_salary_range, career_prospects, holland_codes) VALUES
(
    'Khoa học Máy tính & Công nghệ Thông tin',
    'CNTT',
    'Kỹ thuật - Công nghệ',
    'Ngành học tập trung vào lập trình, thiết kế hệ thống phần mềm, trí tuệ nhân tạo (AI), an ninh mạng và khoa học dữ liệu. Người học sẽ làm chủ công nghệ để giải quyết các bài toán chuyển đổi số.',
    ARRAY['Tư duy logic', 'Lập trình hệ thống', 'Giải quyết vấn đề', 'Ngoại ngữ'],
    '15 - 45 triệu VND',
    'Nhu cầu nhân lực chất lượng cao vô cùng lớn tại các doanh nghiệp trong nước và quốc tế. Cơ hội thăng tiến lên Tech Lead, Solution Architect hoặc khởi nghiệp công nghệ.',
    ARRAY['I', 'R', 'C']
),
(
    'Quản trị Kinh doanh',
    'QTKD',
    'Kinh tế - Quản lý',
    'Ngành đào tạo kiến thức tổng hợp về quản lý doanh nghiệp, tài chính, nhân sự, marketing và hoạch định chiến lược kinh doanh. Giúp phát triển kỹ năng lãnh đạo toàn diện.',
    ARRAY['Giao tiếp thuyết phục', 'Lập kế hoạch', 'Lãnh đạo đội nhóm', 'Đàm phán'],
    '12 - 35 triệu VND',
    'Cơ hội việc làm đa dạng trong các phòng ban chức năng của doanh nghiệp. Lộ trình thăng tiến rõ ràng lên vị trí Quản lý, Giám đốc bộ phận hoặc điều hành doanh nghiệp riêng.',
    ARRAY['E', 'S', 'C']
),
(
    'Thiết kế Đồ họa & Truyền thông Đa phương tiện',
    'TKDH',
    'Nghệ thuật - Thiết kế',
    'Lĩnh vực kết hợp giữa tư duy nghệ thuật thẩm mỹ và các công cụ công nghệ số để tạo ra các ấn phẩm truyền thông trực quan, nhận diện thương hiệu, thiết kế UX/UI cho web/app và hoạt hình 3D.',
    ARRAY['Sáng tạo nghệ thuật', 'Sử dụng phần mềm Adobe/Figma', 'Tư duy thẩm mỹ', 'Làm việc nhóm'],
    '10 - 25 triệu VND',
    'Rộng mở trong các Agency quảng cáo, studio sáng tạo, công ty phát triển game và phòng marketing của mọi doanh nghiệp. Cơ hội tự do làm việc tự do (Freelance) rất cao.',
    ARRAY['A', 'I', 'R']
),
(
    'Sư phạm Tiếng Anh',
    'SPTA',
    'Giáo dục',
    'Ngành học trang bị kiến thức chuyên sâu về ngôn ngữ Anh cùng phương pháp sư phạm hiện đại. Sinh viên được rèn luyện kỹ năng truyền tải tri thức, thiết kế bài giảng tiếng Anh sinh động.',
    ARRAY['Ngoại ngữ xuất sắc', 'Truyền đạt kiến thức', 'Kiên nhẫn', 'Soạn thảo giáo án'],
    '8 - 20 triệu VND',
    'Làm việc tại hệ thống trường học công lập, trường quốc tế, trung tâm ngoại ngữ. Cơ hội làm biên phiên dịch, nghiên cứu giáo dục hoặc phát triển nội dung số e-learning.',
    ARRAY['S', 'A', 'E']
),
(
    'Y khoa (Bác sĩ Đa khoa)',
    'YK',
    'Y tế - Sức khỏe',
    'Đào tạo nhân lực chất lượng cao có kiến thức y học vững vàng để khám, chẩn đoán, điều trị và chăm sóc sức khỏe ban đầu cho bệnh nhân. Thời gian đào tạo kéo dài 6 năm kèm thực hành lâm sàng.',
    ARRAY['Chẩn đoán y khoa', 'Tâm lý học y tế', 'Cẩn trọng', 'Chịu áp lực tốt'],
    '15 - 50 triệu VND',
    'Làm việc tại bệnh viện tuyến trung ương đến địa phương, các phòng khám tư nhân chuẩn quốc tế. Nhu cầu chăm sóc sức khỏe xã hội tăng cao mở ra lộ trình phát triển bền vững.',
    ARRAY['I', 'S', 'R']
),
(
    'Kế toán - Kiểm toán',
    'KTKT',
    'Kinh tế - Quản lý',
    'Chuyên ngành phân tích thông tin tài chính, xử lý nghiệp vụ ghi chép sổ sách kế toán, lập báo cáo tài chính và thực hiện kiểm toán thuế đúng quy định pháp luật.',
    ARRAY['Tính toán chính xác', 'Sử dụng Excel chuyên sâu', 'Cẩn thiện chi tiết', 'Tư duy pháp lý'],
    '9 - 22 triệu VND',
    'Mọi công ty đều cần kế toán để vận hành hệ thống tài chính. Cơ hội phát triển thành Kế toán trưởng hoặc Kiểm toán viên chuyên nghiệp tại các tổ chức kiểm toán quốc tế (Big 4).',
    ARRAY['C', 'E', 'I']
);

-- 3. Thêm dữ liệu Trường Đại học (Universities)
INSERT INTO public.universities (name, code, region, website, tuition_fee_per_year, logo_url) VALUES
(
    'Đại học Bách khoa Hà Nội',
    'HUST',
    'Bắc',
    'https://hust.edu.vn',
    45000000,
    'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?q=80&w=200&auto=format&fit=crop'
),
(
    'Đại học Ngoại thương',
    'FTU',
    'Bắc',
    'https://ftu.edu.vn',
    35000000,
    'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=200&auto=format&fit=crop'
),
(
    'Đại học Bách khoa - ĐHQG TP.HCM',
    'HCMUT',
    'Nam',
    'https://hcmut.edu.vn',
    60000000,
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=200&auto=format&fit=crop'
),
(
    'Đại học Kinh tế - Luật - ĐHQG TP.HCM',
    'UEL',
    'Nam',
    'https://uel.edu.vn',
    38000000,
    'https://images.unsplash.com/photo-1607237138185-eedd996e5b09?q=80&w=200&auto=format&fit=crop'
),
(
    'Đại học Bách khoa - Đại học Đà Nẵng',
    'DUT',
    'Trung',
    'https://dut.udn.vn',
    32000000,
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?q=80&w=200&auto=format&fit=crop'
),
(
    'Đại học Y Dược TP.HCM',
    'UMP',
    'Nam',
    'https://ump.edu.vn',
    70000000,
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=200&auto=format&fit=crop'
);

-- 4. Ánh xạ Ngành học - Trường học kèm điểm chuẩn và tổ hợp môn thi (major_university_map)
INSERT INTO public.major_university_map (major_id, university_id, benchmark_scores_json, subject_groups)
VALUES
(
    (SELECT id FROM public.majors WHERE code = 'CNTT' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'HUST' LIMIT 1),
    '{"2022": 28.29, "2023": 28.5, "2024": 28.85}'::jsonb,
    ARRAY['A00', 'A01']
),
(
    (SELECT id FROM public.majors WHERE code = 'CNTT' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'HCMUT' LIMIT 1),
    '{"2022": 27.50, "2023": 27.80, "2024": 28.00}'::jsonb,
    ARRAY['A00', 'A01']
),
(
    (SELECT id FROM public.majors WHERE code = 'CNTT' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'DUT' LIMIT 1),
    '{"2022": 25.80, "2023": 26.20, "2024": 26.50}'::jsonb,
    ARRAY['A00', 'A01']
),
(
    (SELECT id FROM public.majors WHERE code = 'QTKD' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'FTU' LIMIT 1),
    '{"2022": 27.80, "2023": 28.05, "2024": 28.20}'::jsonb,
    ARRAY['A00', 'A01', 'D01']
),
(
    (SELECT id FROM public.majors WHERE code = 'QTKD' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'UEL' LIMIT 1),
    '{"2022": 26.20, "2023": 26.50, "2024": 26.85}'::jsonb,
    ARRAY['A00', 'A01', 'D01']
),
(
    (SELECT id FROM public.majors WHERE code = 'TKDH' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'HCMUT' LIMIT 1),
    '{"2022": 24.50, "2023": 25.00, "2024": 25.60}'::jsonb,
    ARRAY['A01', 'D01', 'V01']
),
(
    (SELECT id FROM public.majors WHERE code = 'SPTA' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'FTU' LIMIT 1),
    '{"2022": 27.20, "2023": 27.50, "2024": 27.75}'::jsonb,
    ARRAY['D01', 'D14']
),
(
    (SELECT id FROM public.majors WHERE code = 'YK' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'UMP' LIMIT 1),
    '{"2022": 27.55, "2023": 27.60, "2024": 27.85}'::jsonb,
    ARRAY['B00']
),
(
    (SELECT id FROM public.majors WHERE code = 'KTKT' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'FTU' LIMIT 1),
    '{"2022": 27.60, "2023": 27.85, "2024": 28.05}'::jsonb,
    ARRAY['A00', 'A01', 'D01']
),
(
    (SELECT id FROM public.majors WHERE code = 'KTKT' LIMIT 1),
    (SELECT id FROM public.universities WHERE code = 'UEL' LIMIT 1),
    '{"2022": 25.80, "2023": 26.10, "2024": 26.40}'::jsonb,
    ARRAY['A00', 'A01', 'D01']
);
