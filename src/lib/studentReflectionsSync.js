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

/**
 * Tính toán các chỉ số thống kê KHKT tương đương với câu lệnh SQL trên bảng `public.student_reflections`
 */
export async function fetchStudentReflectionsSummary() {
  let rows = [];
  if (supabase && typeof supabase.from === 'function') {
    try {
      const { data, error } = await supabase
        .from('student_reflections')
        .select('*')
        .order('updated_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        rows = data;
      }
    } catch (e) {}
  }

  if (rows.length === 0) {
    try {
      const localMap = JSON.parse(localStorage.getItem('cbas_student_reflections_map') || '{}');
      rows = Object.values(localMap);
    } catch (e) {}
  }

  const tong_so_hoc_sinh = rows.length;
  const so_hs_kiem_chung_so_lieu = rows.filter(
    r => r.benchmark_3years != null && String(r.benchmark_3years).trim() !== '' && Number(r.tuition_per_year) > 0
  ).length;
  const ty_le_kiem_chung_pct = tong_so_hoc_sinh > 0
    ? Number(((so_hs_kiem_chung_so_lieu * 100.0) / tong_so_hoc_sinh).toFixed(1))
    : 0;

  const so_hs_co_ke_hoach_b = rows.filter(
    r => r.contingency_plan != null && String(r.contingency_plan).length > 5
  ).length;
  const ty_le_ke_hoach_b_pct = tong_so_hoc_sinh > 0
    ? Number(((so_hs_co_ke_hoach_b * 100.0) / tong_so_hoc_sinh).toFixed(1))
    : 0;

  const so_hs_dieu_chinh_nguyen_vong = rows.filter(r => {
    if (!r.initial_career || !r.priority_choice_1) return false;
    return String(r.initial_career).trim().toLowerCase() !== String(r.priority_choice_1).trim().toLowerCase();
  }).length;
  const ty_le_dieu_chinh_pct = tong_so_hoc_sinh > 0
    ? Number(((so_hs_dieu_chinh_nguyen_vong * 100.0) / tong_so_hoc_sinh).toFixed(1))
    : 0;

  return {
    rows,
    metrics: {
      tong_so_hoc_sinh,
      so_hs_kiem_chung_so_lieu,
      ty_le_kiem_chung_pct,
      so_hs_co_ke_hoach_b,
      ty_le_ke_hoach_b_pct,
      so_hs_dieu_chinh_nguyen_vong,
      ty_le_dieu_chinh_pct
    }
  };
}

