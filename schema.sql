-- ====================================================================
-- CAREER GUIDANCE PLATFORM - COMPLETE SUPABASE DATABASE SCHEMA & SEED DATA
-- Chạy toàn bộ file này trong Supabase SQL Editor để khởi tạo DB 100%
-- ====================================================================

-- 1. KÍCH HOẠT EXTENSION VÀ XÓA CẤU TRÚC CŨ (NẾU CÓ)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.counseling_sessions CASCADE;
DROP TABLE IF EXISTS public.career_roadmaps CASCADE;
DROP TABLE IF EXISTS public.saved_items CASCADE;
DROP TABLE IF EXISTS public.major_university_map CASCADE;
DROP TABLE IF EXISTS public.test_results CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;
DROP TABLE IF EXISTS public.career_tests CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.majors CASCADE;

-- ====================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU
-- ====================================================================

-- 2.1 Bảng Ngành học (majors)
CREATE TABLE public.majors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    required_skills TEXT[] DEFAULT '{}',
    average_salary_range TEXT,
    career_prospects TEXT,
    holland_codes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 Bảng Hồ sơ người dùng (profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'counselor', 'student')),
    grade_level TEXT CHECK (grade_level IN ('Grade 10', 'Grade 11', 'Grade 12')),
    target_major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.3 Bảng Bài trắc nghiệm (career_tests)
CREATE TABLE public.career_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('holland', 'mbti')),
    questions_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.4 Bảng Trường Đại học (universities)
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

-- 2.5 Bảng Kết quả trắc nghiệm (test_results)
CREATE TABLE public.test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    test_id UUID REFERENCES public.career_tests(id) ON DELETE CASCADE NOT NULL,
    scores_json JSONB NOT NULL,
    primary_code TEXT NOT NULL,
    recommended_majors_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.6 Bảng Ánh xạ Ngành - Trường (major_university_map)
CREATE TABLE public.major_university_map (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    benchmark_scores_json JSONB NOT NULL,
    subject_groups TEXT[] DEFAULT '{}'
);

-- 2.7 Bảng Mục tiêu đã lưu (saved_items)
CREATE TABLE public.saved_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('major', 'university')),
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (student_id, item_type, item_id)
);

-- 2.8 Bảng Lộ trình học tập (career_roadmaps)
CREATE TABLE public.career_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.9 Bảng Lịch hẹn tư vấn (counseling_sessions)
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

-- ====================================================================
-- 3. THIẾT LẬP TRIGGER TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ AUTH
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Học sinh mới'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- 4. BẬT ROW LEVEL SECURITY (RLS) VÀ PHÂN QUYỀN MỞ RỘNG
-- ====================================================================
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_university_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai danh mục công khai
CREATE POLICY "Allow public read on majors" ON public.majors FOR SELECT USING (true);
CREATE POLICY "Allow public read on universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Allow public read on career_tests" ON public.career_tests FOR SELECT USING (true);
CREATE POLICY "Allow public read on major_university_map" ON public.major_university_map FOR SELECT USING (true);
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);

-- Phân quyền cho user đã đăng nhập thao tác dữ liệu cá nhân
CREATE POLICY "Allow authenticated full profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full test_results" ON public.test_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full saved_items" ON public.saved_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full career_roadmaps" ON public.career_roadmaps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full counseling_sessions" ON public.counseling_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage majors" ON public.majors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage universities" ON public.universities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ====================================================================
-- 5. NẠP DỮ LIỆU MẪU CHUẨN (SEED DATA)
-- ====================================================================

-- 5.1 Seed Data Chuyên viên tư vấn mẫu trong Profiles
INSERT INTO public.profiles (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'minh.nguyen@counselor.edu.vn', 'TS. Nguyễn Văn Minh (Cố vấn Hướng nghiệp)', 'counselor'),
('22222222-2222-2222-2222-222222222222', 'hoanganh.tran@counselor.edu.vn', 'ThS. Trần Thị Hoàng Anh (Chuyên gia Tâm lý)', 'counselor')
ON CONFLICT (id) DO NOTHING;

-- 5.2 Seed Data Bài trắc nghiệm Holland (30 câu RIASEC)
INSERT INTO public.career_tests (id, title, description, type, questions_json) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Trắc nghiệm tính cách nghề nghiệp Holland (RIASEC)',
    'Khám phá thế giới nghề nghiệp thông qua 6 nhóm tính cách đặc trưng: Kỹ thuật (R), Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E) và Nghiệp vụ (C). Hãy chọn Đúng hoặc Sai thành thật với bản thân.',
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
) ON CONFLICT (id) DO NOTHING;

-- 5.3 Seed Data 10 Ngành học mẫu (majors)
INSERT INTO public.majors (id, name, code, category, description, required_skills, average_salary_range, career_prospects, holland_codes) VALUES
(
    'b1111111-1111-1111-1111-111111111111',
    'Khoa học Máy tính & Công nghệ Thông tin',
    'CNTT',
    'Kỹ thuật - Công nghệ',
    'Ngành học tập trung vào lập trình, thiết kế hệ thống phần mềm, trí tuệ nhân tạo (AI), an ninh mạng và khoa học dữ liệu.',
    ARRAY['Tư duy logic', 'Lập trình hệ thống', 'Giải quyết vấn đề', 'Ngoại ngữ'],
    '15 - 45 triệu VND',
    'Nhu cầu nhân lực chất lượng cao vô cùng lớn tại các tập đoàn công nghệ trong và ngoài nước.',
    ARRAY['I', 'R', 'C']
),
(
    'b2222222-2222-2222-2222-222222222222',
    'Quản trị Kinh doanh',
    'QTKD',
    'Kinh tế - Quản lý',
    'Ngành đào tạo kiến thức tổng hợp về quản lý doanh nghiệp, tài chính, nhân sự, marketing và hoạch định chiến lược kinh doanh.',
    ARRAY['Giao tiếp thuyết phục', 'Lập kế hoạch', 'Lãnh đạo đội nhóm', 'Đàm phán'],
    '12 - 35 triệu VND',
    'Cơ hội việc làm đa dạng tại mọi phòng ban của doanh nghiệp, lộ trình thăng tiến lên cấp Quản lý.',
    ARRAY['E', 'S', 'C']
),
(
    'b3333333-3333-3333-3333-333333333333',
    'Thiết kế Đồ họa & Truyền thông Đa phương tiện',
    'TKDH',
    'Nghệ thuật - Thiết kế',
    'Lĩnh vực kết hợp tư duy nghệ thuật thẩm mỹ và công cụ công nghệ để tạo ra ấn phẩm quảng cáo, UX/UI web/app và đồ họa 3D.',
    ARRAY['Sáng tạo nghệ thuật', 'Sử dụng phần mềm thiết kế', 'Tư duy thẩm mỹ', 'Làm việc nhóm'],
    '10 - 25 triệu VND',
    'Rộng mở tại các Agency quảng cáo, studio sáng tạo, công ty phát triển game và phòng Marketing.',
    ARRAY['A', 'I', 'R']
),
(
    'b4444444-4444-4444-4444-444444444444',
    'Sư phạm Tiếng Anh',
    'SPTA',
    'Giáo dục',
    'Ngành đào tạo kiến thức ngôn ngữ Anh và phương pháp sư phạm hiện đại để giảng dạy tại các cấp học.',
    ARRAY['Ngoại ngữ xuất sắc', 'Truyền đạt kiến thức', 'Kiên nhẫn', 'Soạn thảo giáo án'],
    '8 - 20 triệu VND',
    'Làm việc tại hệ thống trường học công lập, trường quốc tế và trung tâm ngoại ngữ.',
    ARRAY['S', 'A', 'E']
),
(
    'b5555555-5555-5555-5555-555555555555',
    'Y khoa (Bác sĩ Đa khoa)',
    'YK',
    'Y tế - Sức khỏe',
    'Đào tạo bác sĩ có kiến thức y học vững vàng để khám, chẩn đoán, điều trị và chăm sóc sức khỏe bệnh nhân.',
    ARRAY['Chẩn đoán y khoa', 'Tâm lý học y tế', 'Cẩn trọng', 'Chịu áp lực cao'],
    '15 - 50 triệu VND',
    'Làm việc tại bệnh viện tuyến trung ương đến địa phương, các phòng khám tư nhân quốc tế.',
    ARRAY['I', 'S', 'R']
),
(
    'b6666666-6666-6666-6666-666666666666',
    'Kế toán - Kiểm toán',
    'KTKT',
    'Kinh tế - Quản lý',
    'Chuyên ngành phân tích thông tin tài chính, xử lý nghiệp vụ ghi chép sổ sách kế toán và kiểm toán thuế.',
    ARRAY['Tính toán chính xác', 'Sử dụng Excel chuyên sâu', 'Cẩn thận chi tiết', 'Tư duy pháp lý'],
    '9 - 22 triệu VND',
    'Nhu cầu không thể thiếu tại mọi doanh nghiệp, ngân hàng và cơ quan quản lý nhà nước.',
    ARRAY['C', 'E', 'I']
),
(
    'b7777777-7777-7777-7777-777777777777',
    'Truyền thông & Quan hệ Công chúng',
    'PR',
    'Nghệ thuật - Thiết kế',
    'Xây dựng và bảo vệ hình ảnh thương hiệu, quản trị khủng hoảng truyền thông và tổ chức sự kiện.',
    ARRAY['Viết lách sáng tạo', 'Quan hệ báo chí', 'Nhạy bén thông tin', 'Xử lý khủng hoảng'],
    '11 - 28 triệu VND',
    'Cơ hội lớn tại các công ty PR, truyền thông, tập đoàn đa quốc gia.',
    ARRAY['E', 'A', 'S']
),
(
    'b8888888-8888-8888-8888-888888888888',
    'An toàn Thông tin / Bảo mật',
    'ATTT',
    'Kỹ thuật - Công nghệ',
    'Bảo vệ hệ thống mạng, hạ tầng dữ liệu của tổ chức trước các đợt tấn công cyber và mã độc.',
    ARRAY['Mã hóa dữ liệu', 'Phân tích lỗ hổng', 'Lập trình Python/C++', 'Tư duy phòng thủ'],
    '18 - 50 triệu VND',
    'Nhu cầu cực cao tại các ngân hàng, công ty tài chính, chính phủ và tập đoàn công nghệ.',
    ARRAY['I', 'C', 'R']
)
ON CONFLICT (id) DO NOTHING;

-- 5.4 Seed Data 6 Trường Đại học tiêu biểu (universities)
INSERT INTO public.universities (id, name, code, region, website, tuition_fee_per_year, logo_url) VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    'Đại học Bách khoa Hà Nội',
    'HUST',
    'Bắc',
    'https://hust.edu.vn',
    30000000,
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=200'
),
(
    'c2222222-2222-2222-2222-222222222222',
    'Đại học Bách khoa - ĐHQG TP.HCM',
    'HCMUT',
    'Nam',
    'https://hcmut.edu.vn',
    32000000,
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=200'
),
(
    'c3333333-3333-3333-3333-333333333333',
    'Đại học Kinh tế Quốc dân',
    'NEU',
    'Bắc',
    'https://neu.edu.vn',
    28000000,
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=200'
),
(
    'c4444444-4444-4444-4444-444444444444',
    'Đại học Kinh tế TP.HCM',
    'UEH',
    'Nam',
    'https://ueh.edu.vn',
    35000000,
    'https://images.unsplash.com/photo-1592280771190-3e2e4957185e?auto=format&fit=crop&q=80&w=200'
),
(
    'c5555555-5555-5555-5555-555555555555',
    'Đại học Ngoại thương (Hà Nội & TP.HCM)',
    'FTU',
    'Bắc',
    'https://ftu.edu.vn',
    25000000,
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=200'
),
(
    'c6666666-6666-6666-6666-666666666666',
    'Đại học Bách khoa - Đại học Đà Nẵng',
    'DUT',
    'Trung',
    'https://dut.udn.vn',
    24000000,
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=200'
)
ON CONFLICT (id) DO NOTHING;

-- 5.5 Seed Data Ánh xạ Điểm chuẩn (major_university_map)
INSERT INTO public.major_university_map (major_id, university_id, subject_groups, benchmark_scores_json) VALUES
(
    'b1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    ARRAY['A00', 'A01'],
    '{"2022": 28.29, "2023": 29.42, "2024": 28.85}'::jsonb
),
(
    'b1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    ARRAY['A00', 'A01'],
    '{"2022": 27.50, "2023": 28.00, "2024": 28.20}'::jsonb
),
(
    'b2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    ARRAY['A00', 'A01', 'D01', 'D07'],
    '{"2022": 27.45, "2023": 27.80, "2024": 27.50}'::jsonb
),
(
    'b2222222-2222-2222-2222-222222222222',
    'c4444444-4444-4444-4444-444444444444',
    ARRAY['A00', 'A01', 'D01'],
    '{"2022": 26.80, "2023": 27.20, "2024": 27.00}'::jsonb
),
(
    'b3333333-3333-3333-3333-333333333333',
    'c4444444-4444-4444-4444-444444444444',
    ARRAY['A00', 'A01', 'D01', 'V00'],
    '{"2022": 26.50, "2023": 26.90, "2024": 26.75}'::jsonb
);

-- ====================================================================
-- THÀNH CÔNG! HỆ THỐNG CƠ SỞ DỮ LIỆU ĐÃ ĐƯỢC NẠP 100% HOÀN CHỈNH.
-- ====================================================================
