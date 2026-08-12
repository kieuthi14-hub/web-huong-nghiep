-- ============================================================================
-- SCHEMAS FOR CAREER GUIDANCE APP (SUPABASE POSTGRESQL)
-- ============================================================================

-- 1. BẢNG PROFILES (Lưu thông tin tài khoản & vai trò người dùng)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'counselor', 'admin')),
  grade_level VARCHAR(10) CHECK (grade_level IN ('Grade 10', 'Grade 11', 'Grade 12')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG MAJORS (Danh mục Ngành học)
CREATE TABLE IF NOT EXISTS public.majors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  average_salary_range TEXT,
  required_skills TEXT[],
  career_prospects TEXT,
  holland_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG UNIVERSITIES (Danh mục Trường Đại học)
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region VARCHAR(10) NOT NULL CHECK (region IN ('Bắc', 'Trung', 'Nam')),
  website TEXT,
  tuition_fee_per_year NUMERIC,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG MAJOR_UNIVERSITY_MAP (Liên kết Ngành - Trường & Điểm chuẩn)
CREATE TABLE IF NOT EXISTS public.major_university_map (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  benchmark_scores_json JSONB DEFAULT '{}'::jsonb,
  subject_groups TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(major_id, university_id)
);

-- 5. BẢNG CAREER_TESTS (Bộ đề trắc nghiệm hướng nghiệp)
CREATE TABLE IF NOT EXISTS public.career_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('holland', 'mbti', 'interests')),
  description TEXT,
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG TEST_RESULTS (Lịch sử kết quả làm test của học sinh)
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.career_tests(id) ON DELETE CASCADE,
  scores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_code TEXT,
  recommended_majors_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG METACOGNITIVE_MATRIX (Ma trận Phản tư & Giải thiên lệch chọn nghề)
CREATE TABLE IF NOT EXISTS public.metacognitive_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_major TEXT NOT NULL,
  evidence TEXT NOT NULL,
  verified_sources TEXT NOT NULL,
  risk_analysis TEXT NOT NULL,
  bias_check TEXT NOT NULL,
  final_decision VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (final_decision IN ('CONFIRMED', 'BACKUP', 'CHANGED')),
  detected_bias TEXT DEFAULT 'NONE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bổ sung cột final_decision & detected_bias nếu bảng đã tồn tại sẵn
ALTER TABLE public.metacognitive_matrix ADD COLUMN IF NOT EXISTS final_decision VARCHAR(20) DEFAULT 'CONFIRMED';
ALTER TABLE public.metacognitive_matrix ADD COLUMN IF NOT EXISTS detected_bias TEXT DEFAULT 'NONE';

-- 8. BẢNG CAREER_ROADMAPS (Cột mốc lộ trình hướng nghiệp cá nhân)
CREATE TABLE IF NOT EXISTS public.career_roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BẢNG SAVED_ITEMS (Bookmark Ngành học & Trường học yêu thích)
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('major', 'university')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, item_type, item_id)
);

-- 10. BẢNG COUNSELING_SLOTS (Lịch tư vấn 1-1 của Cố vấn)
CREATE TABLE IF NOT EXISTS public.counseling_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BẢNG BOOKINGS (Lịch hẹn đã đặt của Học sinh)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES public.counseling_slots(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_university_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metacognitive_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy mẫu cho phép đọc dữ liệu công khai
CREATE POLICY "Public Read Majors" ON public.majors FOR SELECT USING (true);
CREATE POLICY "Public Read Universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Public Read Major Map" ON public.major_university_map FOR SELECT USING (true);
CREATE POLICY "Public Read Tests" ON public.career_tests FOR SELECT USING (true);

-- Policy cho người dùng đã đăng nhập (Authenticated Users)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Students manage own test results" ON public.test_results FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students manage own debias matrix" ON public.metacognitive_matrix FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students manage own roadmaps" ON public.career_roadmaps FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students manage saved items" ON public.saved_items FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Counselors manage slots" ON public.counseling_slots FOR ALL USING (auth.uid() = counselor_id);
