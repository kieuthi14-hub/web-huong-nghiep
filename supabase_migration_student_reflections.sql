-- ============================================================================
-- MIGRATION: BẢNG LƯU TRỮ TIẾN TRÌNH 5 BƯỚC CỦA HỌC SINH (public.student_reflections)
-- Hệ Thống Hỗ Trợ Ra Quyết Định Nghề Nghiệp Có Căn Cứ (SocraCareer)
-- ============================================================================

-- 1. TẠO HOẶC CẬP NHẬT BẢNG LƯU TRỮ TIẾN TRÌNH 5 BƯỚC CỦA HỌC SINH
CREATE TABLE IF NOT EXISTS public.student_reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE, -- Mã học sinh (ví dụ: HS-01, HS-02) để bảo mật danh tính
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TỰ ĐỘNG BỔ SUNG CÁC CỘT DỮ LIỆU CÒN THIẾU (NẾU CHƯA CÓ)
-- Dữ liệu Bước 1: Mỏ neo ban đầu
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS initial_career TEXT;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS initial_confidence INT; -- Thang 1-10
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS initial_reason TEXT;

-- Dữ liệu Bước 3: Đối chứng dữ liệu tuyển sinh thực tế
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS benchmark_3years TEXT;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS tuition_per_year NUMERIC;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS admission_combination TEXT;

-- Dữ liệu Bước 5: Tam giác nguyện vọng & Kế hoạch dự phòng
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS priority_choice_1 TEXT;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS priority_choice_2 TEXT;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS priority_choice_3 TEXT;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS contingency_plan TEXT;

-- Ghi chú của Mentor (Bước 4)
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS mentor_notes TEXT;

-- 3. CẤU HÌNH ROW LEVEL SECURITY (RLS) ĐỂ WEB GHI & ĐỌC DỮ LIỆU TRỰC TIẾP
ALTER TABLE public.student_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read and upsert student_reflections" ON public.student_reflections;
CREATE POLICY "Allow read and upsert student_reflections"
  ON public.student_reflections
  FOR ALL
  USING (true)
  WITH CHECK (true);
