-- ============================================================================
-- MIGRATION: HỆ THỐNG NHẬT KÝ & SẢN PHẨM PHẢN TƯ XUYÊN SUỐT 5 VÒNG (SOCRACAREER)
-- Dự án KHKT ViSEF 2026 - Lĩnh vực Khoa học Xã hội & Hành vi
-- ============================================================================

-- 1. BẢNG STUDENT_REFLECTION_JOURNALS (Lưu trữ các phiên bản nhật ký và sản phẩm)
CREATE TABLE IF NOT EXISTS public.student_reflection_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_code VARCHAR(50) NOT NULL DEFAULT 'CT_01',
  cohort_code VARCHAR(50) NOT NULL DEFAULT 'CBAS-2026-N30',
  round SMALLINT NOT NULL CHECK (round BETWEEN 1 AND 5),
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'revised')),
  
  -- 4 Câu hỏi cốt lõi chuẩn mực
  q1_actions TEXT NOT NULL DEFAULT '',
  q2_evidence TEXT NOT NULL DEFAULT '',
  q3_reflection TEXT NOT NULL DEFAULT '',
  q4_unclear TEXT NOT NULL DEFAULT '',
  
  -- Sản phẩm đặc thù theo vòng (dạng JSON linh hoạt)
  -- Vòng 1: { initialCareer, reason, journalConfidence }
  -- Vòng 2: { verifiedClaim, excerpt: { student, ai, context } }
  -- Vòng 3: { sources: [ { name, url, accessDate, notes } ] }
  -- Vòng 4: { mentorNotes, taskTrialSummary }
  -- Vòng 5: { selectedPlan, backupPlan, actionSteps, rationale }
  artifact_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Danh sách tệp đính kèm: [ { fileName, fileSize, fileType, storagePath, publicUrl, uploadedAt } ]
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Nhập liệu từ bản giấy
  is_paper_entry BOOLEAN NOT NULL DEFAULT FALSE,
  paper_recorded_date DATE,
  
  -- Phân biệt dữ liệu thử nghiệm demo vs dữ liệu nghiên cứu chính thức
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Dấu thời gian máy chủ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,

  CONSTRAINT unique_user_round_version UNIQUE (user_id, round, version)
);

-- Chỉ mục tối ưu hóa tìm kiếm và truy vấn báo cáo
CREATE INDEX IF NOT EXISTS idx_srj_user_round ON public.student_reflection_journals(user_id, round);
CREATE INDEX IF NOT EXISTS idx_srj_student_code ON public.student_reflection_journals(student_code);
CREATE INDEX IF NOT EXISTS idx_srj_cohort_status ON public.student_reflection_journals(cohort_code, status);
CREATE INDEX IF NOT EXISTS idx_srj_submitted_at ON public.student_reflection_journals(submitted_at);

-- 2. BẢNG JOURNAL_MENTOR_FEEDBACKS (Nhận xét riêng của Giáo viên / Cố vấn)
CREATE TABLE IF NOT EXISTS public.journal_mentor_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID REFERENCES public.student_reflection_journals(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_name VARCHAR(100) NOT NULL DEFAULT 'Ban Cố Vấn SocraCareer',
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jmf_journal_id ON public.journal_mentor_feedbacks(journal_id);

-- 3. KÍCH HOẠT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.student_reflection_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_mentor_feedbacks ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES CHO STUDENT_REFLECTION_JOURNALS
-- Học sinh: Chỉ xem và chỉnh sửa nhật ký của chính mình
DROP POLICY IF EXISTS "Students can view own journals" ON public.student_reflection_journals;
CREATE POLICY "Students can view own journals"
  ON public.student_reflection_journals
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own journals" ON public.student_reflection_journals;
CREATE POLICY "Students can insert own journals"
  ON public.student_reflection_journals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own journals" ON public.student_reflection_journals;
CREATE POLICY "Students can update own journals"
  ON public.student_reflection_journals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Giáo viên / Admin: Được xem toàn bộ nhật ký trong phân quyền để chấm và nghiên cứu
DROP POLICY IF EXISTS "Teachers and Admins can view journals" ON public.student_reflection_journals;
CREATE POLICY "Teachers and Admins can view journals"
  ON public.student_reflection_journals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher', 'counselor')
    )
  );

-- 5. RLS POLICIES CHO JOURNAL_MENTOR_FEEDBACKS
-- Học sinh: Xem nhận xét trên nhật ký của chính mình
DROP POLICY IF EXISTS "Students can view feedback on their journals" ON public.journal_mentor_feedbacks;
CREATE POLICY "Students can view feedback on their journals"
  ON public.journal_mentor_feedbacks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_reflection_journals
      WHERE student_reflection_journals.id = journal_mentor_feedbacks.journal_id
      AND student_reflection_journals.user_id = auth.uid()
    )
  );

-- Giáo viên / Cố vấn: Tạo và quản lý nhận xét
DROP POLICY IF EXISTS "Mentors can manage feedbacks" ON public.journal_mentor_feedbacks;
CREATE POLICY "Mentors can manage feedbacks"
  ON public.journal_mentor_feedbacks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher', 'counselor')
    )
  );

-- 6. THIẾT LẬP STORAGE BUCKET CHO TỆP ĐÍNH KÈM (REFLECTION-ATTACHMENTS)
-- Chạy trong Supabase Dashboard -> Storage -> Create new bucket 'reflection-attachments' (Private)
-- Policy gợi ý cho Supabase Storage:
-- - Upload: (bucket_id = 'reflection-attachments' AND auth.uid() = (storage.foldername(name))[1]::uuid)
-- - Read: auth.role() = 'authenticated'
