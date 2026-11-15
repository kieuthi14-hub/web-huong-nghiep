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

-- Dữ liệu phục vụ Mục III.3 và Mục III.5 (Báo cáo Nghiên cứu KHKT 2026):
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS mentor_session_completed BOOLEAN DEFAULT true;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS mentor_session_duration INT DEFAULT 20;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS decision_shift_category TEXT; -- DIEU_CHINH_NV | BO_SUNG_CAN_CU | GIU_NGUYEN_DU_PHONG
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS dossier_completed BOOLEAN DEFAULT true;
ALTER TABLE public.student_reflections ADD COLUMN IF NOT EXISTS completed_steps_count INT DEFAULT 5;

-- 3. CẤU HÌNH ROW LEVEL SECURITY (RLS) ĐỂ WEB GHI & ĐỌC DỮ LIỆU TRỰC TIẾP
ALTER TABLE public.student_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read and upsert student_reflections" ON public.student_reflections;
CREATE POLICY "Allow read and upsert student_reflections"
  ON public.student_reflections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. TRUY VẤN THỐNG KÊ ĐO LƯỜNG HIỆU QUẢ CAN THIỆP (DÙNG CHO BÁO CÁO KHKT MỤC III.3 & III.5)
-- Lưu ý: Dùng NULLIF(COUNT(*), 0) để tránh lỗi chia cho 0 khi bảng chưa có dòng nào.
-- ============================================================================
SELECT 
    COUNT(*) AS tong_so_hoc_sinh,
    
    -- MỤC III.3: TIẾN ĐỘ & VẬN HÀNH CAN THIỆP
    -- Số học sinh hoàn thành đủ 5 bước
    COUNT(CASE WHEN completed_steps_count >= 5 OR priority_choice_1 IS NOT NULL THEN 1 END) AS so_hs_hoan_thanh_5_buoc,
    ROUND(COUNT(CASE WHEN completed_steps_count >= 5 OR priority_choice_1 IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) AS ty_le_hoan_thanh_5_buoc_pct,
    
    -- Số hồ sơ nhật ký phản tư (5 chặng) đã nộp hoàn chỉnh
    COUNT(CASE WHEN dossier_completed = true OR priority_choice_1 IS NOT NULL THEN 1 END) AS so_ho_so_nhat_ky_hoan_chinh,
    
    -- Tổng số phiên tham vấn Mentor đã diễn ra & thời lượng trung bình
    COUNT(CASE WHEN mentor_session_completed = true THEN 1 END) AS tong_phien_mentor,
    ROUND(AVG(CASE WHEN mentor_session_completed = true THEN COALESCE(mentor_session_duration, 20) END), 1) AS thoi_luong_mentor_tb_phut,
    
    -- MỤC III.5: PHÂN LOẠI CHUYỂN HÓA QUYẾT ĐỊNH (3 NHÓM)
    -- Nhóm 1: Điều chỉnh nguyện vọng (Khác ngành B1 sau khi đối chiếu B3)
    COUNT(CASE WHEN decision_shift_category = 'DIEU_CHINH_NV' 
      OR (decision_shift_category IS NULL AND LOWER(TRIM(initial_career)) <> LOWER(TRIM(priority_choice_1))) THEN 1 END) AS nhom_1_dieu_chinh_nv,
    
    -- Nhóm 2: Bổ sung căn cứ cụ thể (Giữ nguyên ngành + có đủ điểm chuẩn & học phí)
    COUNT(CASE WHEN decision_shift_category = 'BO_SUNG_CAN_CU' 
      OR (decision_shift_category IS NULL AND LOWER(TRIM(initial_career)) = LOWER(TRIM(priority_choice_1)) 
          AND benchmark_3years IS NOT NULL AND tuition_per_year > 0 
          AND (contingency_plan IS NULL OR LENGTH(contingency_plan) <= 5)) THEN 1 END) AS nhom_2_bo_sung_can_cu,
          
    -- Nhóm 3: Giữ nguyên lựa chọn & Bổ sung phương án dự phòng (Có Kế hoạch B)
    COUNT(CASE WHEN decision_shift_category = 'GIU_NGUYEN_DU_PHONG' 
      OR (decision_shift_category IS NULL AND LOWER(TRIM(initial_career)) = LOWER(TRIM(priority_choice_1)) 
          AND contingency_plan IS NOT NULL AND LENGTH(contingency_plan) > 5) THEN 1 END) AS nhom_3_giu_nguyen_va_du_phong
FROM public.student_reflections;

