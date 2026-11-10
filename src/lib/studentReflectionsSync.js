import { supabase } from './supabase';

/**
 * Chuẩn hóa mã học sinh (student_code <= 20 ký tự, ví dụ: HS-01, HS-02)
 */
export function resolveStudentCode(preferredCode = '') {
  try {
    const raw = (
      preferredCode ||
      localStorage.getItem('cbas_student_id') ||
      JSON.parse(localStorage.getItem('cbas_user_profile') || '{}')?.studentId ||
      JSON.parse(localStorage.getItem('cbas_anchor_data') || '{}')?.student_code ||
      'HS-01'
    )
      .toString()
      .trim();
    return (raw || 'HS-01').slice(0, 20);
  } catch (e) {
    return 'HS-01';
  }
}

/**
 * Tự động tạo hoặc cập nhật (upsert) dữ liệu tiến trình 5 bước của học sinh
 * vào bảng `public.student_reflections` trên Supabase (kèm lưu dự phòng vào localStorage).
 */
export async function syncStudentReflectionProgress(fields = {}, explicitStudentCode = '') {
  const student_code = resolveStudentCode(explicitStudentCode || fields.student_code);
  const nowIso = new Date().toISOString();

  // Lưu bản sao local để hoạt động mượt cả khi ngoại tuyến
  try {
    const localKey = 'cbas_student_reflections_map';
    const currentMap = JSON.parse(localStorage.getItem(localKey) || '{}');
    currentMap[student_code] = {
      ...(currentMap[student_code] || {}),
      ...fields,
      student_code,
      updated_at: nowIso
    };
    localStorage.setItem(localKey, JSON.stringify(currentMap));
  } catch (e) {}

  if (!supabase || typeof supabase.from !== 'function') {
    return { ok: false, student_code };
  }

  try {
    const payload = {
      student_code,
      ...fields,
      updated_at: nowIso
    };
    const { data, error } = await supabase
      .from('student_reflections')
      .upsert([payload], { onConflict: 'student_code' })
      .select();

    if (error) {
      console.warn('[student_reflections] Supabase upsert warning:', error.message);
      return { ok: false, student_code, error };
    }
    return { ok: true, student_code, data };
  } catch (err) {
    console.warn('[student_reflections] Sync exception:', err);
    return { ok: false, student_code, error: err };
  }
}
