/**
 * reflectionJournalService.js
 * Quản lý Dữ liệu Nhật ký & Sản phẩm Phản tư Xuyên suốt 5 Vòng (SocraCareer ViSEF 2026)
 * Tuân thủ chuẩn mực đạo đức KHKT, bảo vệ dữ liệu tự báo cáo, hỗ trợ làm việc offline & đồng bộ Supabase.
 */

import { supabase } from '../lib/supabase';

// ĐỊNH NGHĨA 5 VÒNG CHUẨN MỰC THEO DỰ ÁN SOCRACAREER
export const ROUNDS_CONFIG = {
  1: {
    round: 1,
    step: 1,
    title: 'Vòng 1: Trắc Nghiệm RIASEC & Mỏ Neo Nghề Nghiệp',
    shortTitle: 'Vòng 1: Trắc nghiệm & Mỏ neo',
    stepPath: '/student/holland',
    stepName: 'Bước 1 (Holland RIASEC & Mỏ neo T0)',
    description: 'Xác lập thiên hướng nghề nghiệp và điểm neo ban đầu (T0)',
    artifactGuideTitle: 'Sản phẩm Vòng 1: Lựa chọn nghề ban đầu & Độ tự tin mỏ neo',
    artifactGuideDesc: 'Ghi lại nghề nghiệp em đang hướng tới, lý do em quan tâm và mức độ tự tin hiện tại (1–10). Mức tự tin này phục vụ nhật ký phản tư, không ghi đè kết quả khảo sát T0/T2.',
    defaultArtifact: {
      initialCareer: '',
      reason: '',
      confidenceScore: 7
    }
  },
  2: {
    round: 2,
    step: 2,
    title: 'Vòng 2: AI Tham Vấn Phản Tư Socrates',
    shortTitle: 'Vòng 2: AI Socrates',
    stepPath: '/student/debias-agent',
    stepName: 'Bước 2 (AI Socrates Phản biện 3 vòng)',
    description: 'Chất vấn và làm lung lay thiên lệch nhận thức qua 3 vòng đối thoại',
    artifactGuideTitle: 'Sản phẩm Vòng 2: Nhận định cần kiểm chứng & Trích đoạn đối thoại AI',
    artifactGuideDesc: 'Nêu một nhận định về nghề mà em thấy cần phải kiểm chứng lại. Em có thể chọn trích dẫn 1 đoạn đối thoại tiêu biểu với AI Socrates (không đưa toàn bộ lịch sử trò chuyện).',
    defaultArtifact: {
      claimToVerify: '',
      conversationExcerpt: ''
    }
  },
  3: {
    round: 3,
    step: 3,
    title: 'Vòng 3: Đối Chứng Dữ Liệu Tuyển Sinh & Thị Trường',
    shortTitle: 'Vòng 3: Đối chứng dữ liệu',
    stepPath: '/student/fact-check',
    stepName: 'Bước 3 (Đối chứng dữ liệu tuyển sinh & Điểm chuẩn)',
    description: 'Đối chiếu học bạ với điểm chuẩn, học phí và tỷ lệ việc làm thực tế',
    artifactGuideTitle: 'Sản phẩm Vòng 3: Bảng đối chiếu nguồn tin, năng lực và chi phí',
    artifactGuideDesc: 'Ghi lại ít nhất 1 nguồn tài liệu chính thống (Đề án 3 công khai, trang tuyển sinh chính thức, cổng thông tin việc làm) gồm tên nguồn, đường dẫn và ngày truy cập.',
    defaultArtifact: {
      sources: [
        { name: '', url: '', accessDate: '', notes: '' }
      ]
    }
  },
  4: {
    round: 4,
    step: 4,
    title: 'Vòng 4: Tham Vấn Đối Chất Thực Tế (Mentor)',
    shortTitle: 'Vòng 4: Tham vấn đối chất',
    stepPath: '/student/booking',
    stepName: 'Bước 4 (Tham vấn đối chất thực tế / Adaptive Triage)',
    description: 'Phân luồng thích ứng, gặp gỡ cố vấn hoặc rà soát Case Dossier tinh gọn',
    artifactGuideTitle: 'Sản phẩm Vòng 4: Ghi chép trao đổi với mentor hoặc sản phẩm thử nhiệm vụ nghề',
    artifactGuideDesc: 'Tóm tắt bài học hoặc lời dặn then chốt từ buổi trao đổi với Mentor, hoặc kết quả em tự trải nghiệm một nhiệm vụ thực tế của nghề (không bắt buộc ghi âm/video hay nhận diện người được hỏi).',
    defaultArtifact: {
      mentorNotes: '',
      taskTrialSummary: ''
    }
  },
  5: {
    round: 5,
    step: 5,
    title: 'Vòng 5: Kế Hoạch Lựa Chọn & Tam Giác Nguyện Vọng',
    shortTitle: 'Vòng 5: Kế hoạch hành động',
    stepPath: '/student/reflection',
    stepName: 'Bước 5 (Kế hoạch hành động T2 & Tam giác nguyện vọng)',
    description: 'Đo lường mức tự tin thực tế T2 và thiết lập Tam giác hành động tự chủ',
    artifactGuideTitle: 'Sản phẩm Vòng 5: Kế hoạch lựa chọn, phương án dự phòng và hành động tiếp theo',
    artifactGuideDesc: 'Trình bày ngành/trường mục tiêu đã cân nhắc, phương án dự phòng vừa sức, các hành động cụ thể mỗi ngày và lý do em giữ nguyên hay điều chỉnh lựa chọn.',
    defaultArtifact: {
      primaryPlan: '',
      backupPlan: '',
      actionSteps: '',
      decisionRationale: ''
    }
  }
};

// 4 CÂU HỎI NHẬT KÝ BẮT BUỘC MỖI VÒNG
export const JOURNAL_QUESTIONS = [
  {
    key: 'q1_actions',
    num: 1,
    title: '1. Em đã làm gì trong vòng này?',
    placeholder: 'Mô tả ngắn gọn những hoạt động em đã thực hiện (VD: làm bài trắc nghiệm, trao đổi với AI, tra cứu điểm chuẩn, trao đổi với thầy cô...). Nếu chưa làm, có thể ghi "Chưa làm".',
    quickChips: ['Đã hoàn thành các tác vụ', 'Đang thực hiện từng phần', 'Chưa làm']
  },
  {
    key: 'q2_evidence',
    num: 2,
    title: '2. Em tìm được thông tin hoặc bằng chứng nào? Ghi nguồn hoặc đính kèm sản phẩm; nếu chưa có, hãy ghi rõ.',
    placeholder: 'Ghi lại các dữ liệu thực tế em đã thu thập được (điểm chuẩn, mức học phí, môn học đại cương, cơ hội nghề nghiệp...). Nếu chưa có, hãy ghi rõ "Chưa có".',
    quickChips: ['Đã đối chiếu thông tin chính thức', 'Đã lưu tài liệu tham khảo', 'Chưa có']
  },
  {
    key: 'q3_reflection',
    num: 3,
    title: '3. Thông tin đó khiến em xem xét lại nhận định nào? Nếu chưa thay đổi, hãy giải thích lý do.',
    placeholder: 'Thông tin mới có làm em suy nghĩ lại điều gì trước đây tưởng chừng hiển nhiên không? Nếu vẫn giữ nguyên định hướng, hãy nêu rõ lý do.',
    quickChips: ['Nhìn nhận rõ thách thức thực tế', 'Vẫn giữ định hướng ban đầu vì phù hợp', 'Chưa rõ']
  },
  {
    key: 'q4_unclear',
    num: 4,
    title: '4. Em còn điều gì chưa rõ và sẽ kiểm tra bằng cách nào?',
    placeholder: 'Những điểm em vẫn băn khoăn (môi trường học tập, học phí các năm sau, cơ hội thực tập...) và kế hoạch để tìm hiểu thêm. Nếu đã rõ, có thể ghi rõ "Đã cơ bản nắm rõ".',
    quickChips: ['Cần tìm hiểu thêm học phí và học bổng', 'Cần hỏi thêm anh chị cựu sinh viên', 'Đã cơ bản nắm rõ']
  }
];

// TRẠNG THÁI HIỂN THỊ
export const JOURNAL_STATUS_LABELS = {
  not_started: { label: 'Chưa bắt đầu', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  draft: { label: 'Đang viết', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  submitted: { label: 'Đã nộp', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  revised: { label: 'Đã bổ sung', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' }
};

// HELPER: LẤY KEY LOCALSTORAGE
function getStorageKey(round, studentCode = 'CT_01') {
  return `cbas_reflection_r${round}_${studentCode.toLowerCase()}`;
}

function getVersionsListKey(round, studentCode = 'CT_01') {
  return `cbas_reflection_versions_r${round}_${studentCode.toLowerCase()}`;
}

// 1. LẤY NHẬT KÝ CHO MỘT VÒNG CỤ THỂ
export async function getJournalForRound(round, studentCode = 'CT_01', user = null, versionNum = null) {
  const roundNum = Number(round) || 1;
  const config = ROUNDS_CONFIG[roundNum] || ROUNDS_CONFIG[1];
  const storageKey = getStorageKey(roundNum, studentCode);

  let localData = null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localData = JSON.parse(raw);
  } catch (e) {
    console.warn('Lỗi đọc localStorage:', e);
  }

  // Nếu user đã đăng nhập, thử truy vấn Supabase
  if (user?.id) {
    try {
      let query = supabase
        .from('student_reflection_journals')
        .select(`
          *,
          journal_mentor_feedbacks (*)
        `)
        .eq('user_id', user.id)
        .eq('round', roundNum);

      if (versionNum) {
        query = query.eq('version', versionNum);
      } else {
        query = query.order('version', { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        // Cập nhật lại local cache để đồng bộ
        try {
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {}
        return {
          source: 'server',
          isServerSynced: true,
          journal: data
        };
      }
    } catch (err) {
      console.warn('Supabase query error (falling back to local):', err?.message);
    }
  }

  // Trả về local cache hoặc khung mặc định nếu chưa có gì
  if (localData) {
    return {
      source: 'local',
      isServerSynced: Boolean(localData.is_server_synced),
      journal: localData
    };
  }

  // Khung mặc định trống (Chưa bắt đầu)
  const defaultEntry = {
    id: `local-${roundNum}-${Date.now()}`,
    user_id: user?.id || null,
    student_code: studentCode,
    cohort_code: 'CBAS-2026-N30',
    round: roundNum,
    version: 1,
    status: 'draft',
    is_paper_entry: false,
    paper_recorded_date: null,
    q1_actions: '',
    q2_evidence: '',
    q3_reflection: '',
    q4_unclear: '',
    artifact_data: { ...config.defaultArtifact },
    attachments: [],
    is_demo: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    submitted_at: null,
    is_server_synced: false
  };

  return {
    source: 'empty',
    isServerSynced: false,
    journal: defaultEntry
  };
}

// 2. LẤY TỔNG QUAN TIẾN TRÌNH CẢ 5 VÒNG
export async function getAllRoundsStatus(studentCode = 'CT_01', user = null) {
  const result = {};

  for (let r = 1; r <= 5; r++) {
    const { journal } = await getJournalForRound(r, studentCode, user);
    
    let displayStatus = 'not_started';
    const hasAnyContent = Boolean(
      journal.q1_actions?.trim() || 
      journal.q2_evidence?.trim() || 
      journal.q3_reflection?.trim() || 
      journal.q4_unclear?.trim()
    );

    if (journal.status === 'submitted') {
      displayStatus = journal.version > 1 ? 'revised' : 'submitted';
    } else if (hasAnyContent) {
      displayStatus = 'draft';
    } else {
      displayStatus = 'not_started';
    }

    result[r] = {
      round: r,
      config: ROUNDS_CONFIG[r],
      status: displayStatus,
      rawStatus: journal.status,
      version: journal.version || 1,
      submittedAt: journal.submitted_at,
      updatedAt: journal.updated_at,
      isPaperEntry: journal.is_paper_entry,
      hasAttachments: Boolean(journal.attachments && journal.attachments.length > 0),
      feedbacks: journal.journal_mentor_feedbacks || []
    };
  }

  return result;
}

// 3. LƯU BẢN NHÁP (DRAFT)
export async function saveJournalDraft(round, entryData, studentCode = 'CT_01', user = null) {
  const roundNum = Number(round) || 1;
  const now = new Date().toISOString();
  const storageKey = getStorageKey(roundNum, studentCode);

  const payload = {
    ...entryData,
    round: roundNum,
    student_code: studentCode,
    status: 'draft',
    updated_at: now,
    is_server_synced: false
  };

  // Luôn luôn lưu an toàn vào localStorage trước (Bảo vệ dữ liệu học sinh khi mạng chập chờn)
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (e) {
    console.warn('Lỗi ghi localStorage:', e);
  }

  // Thử đồng bộ lên Supabase nếu có user đăng nhập
  let serverSyncSuccess = false;
  let serverError = null;

  if (user?.id) {
    try {
      const dbPayload = {
        user_id: user.id,
        student_code: studentCode,
        cohort_code: entryData.cohort_code || 'CBAS-2026-N30',
        round: roundNum,
        version: entryData.version || 1,
        status: 'draft',
        is_paper_entry: Boolean(entryData.is_paper_entry),
        paper_recorded_date: entryData.paper_recorded_date || null,
        q1_actions: entryData.q1_actions || '',
        q2_evidence: entryData.q2_evidence || '',
        q3_reflection: entryData.q3_reflection || '',
        q4_unclear: entryData.q4_unclear || '',
        artifact_data: entryData.artifact_data || {},
        attachments: entryData.attachments || [],
        is_demo: Boolean(entryData.is_demo),
        updated_at: now
      };

      const { data, error } = await supabase
        .from('student_reflection_journals')
        .upsert(dbPayload, { onConflict: 'user_id,round,version' })
        .select()
        .single();

      if (!error && data) {
        serverSyncSuccess = true;
        payload.id = data.id;
        payload.is_server_synced = true;
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (e) {}
      } else {
        serverError = error?.message || 'Không thể đồng bộ với bảng máy chủ';
      }
    } catch (err) {
      serverError = err?.message || 'Lỗi mạng khi kết nối máy chủ';
    }
  }

  return {
    success: true,
    isServerSynced: serverSyncSuccess,
    serverError,
    savedAt: now,
    data: payload
  };
}

// 4. NỘP CHÍNH THỨC NHẬT KÝ (SUBMIT)
export async function submitJournalEntry(round, entryData, studentCode = 'CT_01', user = null) {
  const roundNum = Number(round) || 1;
  const now = new Date().toISOString();
  const storageKey = getStorageKey(roundNum, studentCode);
  const versionsKey = getVersionsListKey(roundNum, studentCode);

  // Kiểm tra 4 câu hỏi bắt buộc khi nộp chính thức
  const q1 = (entryData.q1_actions || '').trim();
  const q2 = (entryData.q2_evidence || '').trim();
  const q3 = (entryData.q3_reflection || '').trim();
  const q4 = (entryData.q4_unclear || '').trim();

  if (!q1 || !q2 || !q3 || !q4) {
    return {
      success: false,
      error: 'Em hãy điền đầy đủ cả 4 câu hỏi trước khi nộp chính thức (có thể ghi "Chưa làm", "Chưa có", hoặc "Chưa rõ").'
    };
  }

  const currentVersion = Number(entryData.version) || 1;
  const isRevision = entryData.status === 'submitted' || entryData.is_revision;
  const finalVersion = isRevision ? currentVersion + 1 : currentVersion;

  const payload = {
    ...entryData,
    round: roundNum,
    student_code: studentCode,
    version: finalVersion,
    status: 'submitted',
    submitted_at: now,
    updated_at: now,
    is_server_synced: false
  };

  // Lưu bản nộp vào danh sách lịch sử các phiên bản
  try {
    let history = [];
    const rawHist = localStorage.getItem(versionsKey);
    if (rawHist) history = JSON.parse(rawHist);
    history.push({ ...payload });
    localStorage.setItem(versionsKey, JSON.stringify(history));
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (e) {
    console.warn('Lỗi ghi lịch sử phiên bản vào localStorage:', e);
  }

  // Thử gửi lên máy chủ Supabase
  let serverSyncSuccess = false;
  let serverError = null;

  if (user?.id) {
    try {
      const dbPayload = {
        user_id: user.id,
        student_code: studentCode,
        cohort_code: entryData.cohort_code || 'CBAS-2026-N30',
        round: roundNum,
        version: finalVersion,
        status: 'submitted',
        is_paper_entry: Boolean(entryData.is_paper_entry),
        paper_recorded_date: entryData.paper_recorded_date || null,
        q1_actions: q1,
        q2_evidence: q2,
        q3_reflection: q3,
        q4_unclear: q4,
        artifact_data: entryData.artifact_data || {},
        attachments: entryData.attachments || [],
        is_demo: Boolean(entryData.is_demo),
        submitted_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('student_reflection_journals')
        .upsert(dbPayload, { onConflict: 'user_id,round,version' })
        .select()
        .single();

      if (!error && data) {
        serverSyncSuccess = true;
        payload.id = data.id;
        payload.is_server_synced = true;
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (e) {}
      } else {
        serverError = error?.message || 'Chưa thể ghi nhận lên máy chủ';
      }
    } catch (err) {
      serverError = err?.message || 'Lỗi mạng khi nộp nhật ký';
    }
  }

  return {
    success: true,
    isServerSynced: serverSyncSuccess,
    serverError,
    submittedAt: now,
    version: finalVersion,
    data: payload
  };
}

// 5. LẤY DANH SÁCH TẤT CẢ CÁC PHIÊN BẢN CỦA MỘT VÒNG
export async function getJournalVersionsHistory(round, studentCode = 'CT_01', user = null) {
  const roundNum = Number(round) || 1;
  const versionsKey = getVersionsListKey(roundNum, studentCode);

  let localVersions = [];
  try {
    const raw = localStorage.getItem(versionsKey);
    if (raw) localVersions = JSON.parse(raw);
  } catch (e) {}

  if (user?.id) {
    try {
      const { data, error } = await supabase
        .from('student_reflection_journals')
        .select(`
          *,
          journal_mentor_feedbacks (*)
        `)
        .eq('user_id', user.id)
        .eq('round', roundNum)
        .order('version', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {}
  }

  return localVersions.sort((a, b) => (b.version || 1) - (a.version || 1));
}

// 6. XỬ LÝ TỆP ĐÍNH KÈM (JPG, PNG, PDF <= 10MB)
export async function validateAndUploadFile(file, round, studentCode = 'CT_01', user = null) {
  if (!file) throw new Error('Vui lòng chọn tệp hợp lệ');

  // Kiểm tra kích thước (Max 10MB)
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('Dung lượng tệp vượt quá giới hạn 10 MB!');
  }

  // Kiểm tra định dạng
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'pdf'];

  if (!allowedTypes.includes(file.type) && !validExts.includes(ext)) {
    throw new Error('Định dạng tệp không được hỗ trợ! Vui lòng chỉ tải tệp JPG, PNG hoặc PDF.');
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `${studentCode.toLowerCase()}/round_${round}/${timestamp}_${cleanFileName}`;

  // Thử tải lên Supabase Storage nếu có tài khoản
  if (user?.id) {
    try {
      const { data, error } = await supabase.storage
        .from('reflection-attachments')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (!error && data) {
        return {
          id: `att-${timestamp}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || ext,
          storagePath: data.path,
          uploadedAt: new Date().toISOString(),
          isServerStored: true
        };
      }
    } catch (e) {
      console.warn('Storage bucket upload failed (falling back to local):', e);
    }
  }

  // Fallback: Lưu trữ cục bộ dạng Base64 (nếu dưới 2MB) hoặc tạo Object URL
  let fileDataUrl = '';
  if (file.size <= 2 * 1024 * 1024) {
    fileDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  return {
    id: `local-att-${timestamp}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || ext,
    storagePath,
    dataUrl: fileDataUrl,
    uploadedAt: new Date().toISOString(),
    isServerStored: false
  };
}

// 7. LẤY TOÀN BỘ NHẬT KÝ CHO GIÁO VIÊN / NGƯỜI NGHIÊN CỨU (KÈM BỘ LỌC)
export async function getAdminJournalsList(filters = {}) {
  const { cohort, group, studentCode, round, status } = filters;

  try {
    let query = supabase
      .from('student_reflection_journals')
      .select(`
        *,
        journal_mentor_feedbacks (*)
      `)
      .order('round', { ascending: true })
      .order('version', { ascending: false });

    if (cohort && cohort !== 'ALL') query = query.eq('cohort_code', cohort);
    if (studentCode && studentCode !== 'ALL') query = query.ilike('student_code', `%${studentCode}%`);
    if (round && round !== 'ALL') query = query.eq('round', Number(round));
    if (status && status !== 'ALL') query = query.eq('status', status);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('Admin fetch from Supabase failed, using demo/local seed:', e);
  }

  // Tải danh sách từ localStorage hoặc tạo dữ liệu mẫu thực tế N=30
  const allJournals = [];
  for (let r = 1; r <= 5; r++) {
    for (let i = 1; i <= 30; i++) {
      const sCode = `CT_${i < 10 ? '0' + i : i}`;
      const sKey = getStorageKey(r, sCode);
      try {
        const raw = localStorage.getItem(sKey);
        if (raw) {
          allJournals.push(JSON.parse(raw));
        }
      } catch (e) {}
    }
  }

  // Nếu local chưa có, trả về danh sách mẫu thực tế phục vụ kiểm thử
  if (allJournals.length === 0) {
    return generateDemoJournals();
  }

  return allJournals;
}

// 8. THÊM NHẬN XÉT CỦA GIÁO VIÊN / CỐ VẤN
export async function addMentorFeedback(journalId, feedbackText, mentor = null) {
  if (!journalId || !feedbackText?.trim()) {
    throw new Error('Vui lòng nhập nội dung nhận xét');
  }

  const now = new Date().toISOString();
  const mentorName = mentor?.full_name || mentor?.name || 'Ban Cố Vấn SocraCareer';

  const feedbackObj = {
    id: `fb-${Date.now()}`,
    journal_id: journalId,
    mentor_id: mentor?.id || null,
    mentor_name: mentorName,
    feedback_text: feedbackText.trim(),
    created_at: now
  };

  try {
    const { data, error } = await supabase
      .from('journal_mentor_feedbacks')
      .insert({
        journal_id: journalId,
        mentor_id: mentor?.id || null,
        mentor_name: mentorName,
        feedback_text: feedbackText.trim()
      })
      .select()
      .single();

    if (!error && data) return data;
  } catch (e) {}

  // Fallback: Lưu vào localStorage kèm theo journal
  return feedbackObj;
}

// 9. XUẤT DỮ LIỆU SANG CSV UTF-8 (BẢO VỆ CHỐNG CSV INJECTION & GIỮ NGUYÊN TIẾNG VIỆT)
export function exportJournalsToCsv(journalsList = [], exportMode = 'latest') {
  let records = [...journalsList];

  if (exportMode === 'latest') {
    // Chỉ lấy phiên bản lớn nhất của từng học sinh ở từng vòng
    const map = new Map();
    records.forEach(item => {
      const key = `${item.student_code}_R${item.round}`;
      const existing = map.get(key);
      if (!existing || (item.version || 1) > (existing.version || 1)) {
        map.set(key, item);
      }
    });
    records = Array.from(map.values());
  }

  // Header cột chuẩn nghiên cứu khoa học hành vi
  const headers = [
    'Mã học sinh',
    'Đợt nghiên cứu',
    'Vòng',
    'Tên vòng',
    'Phiên bản',
    'Trạng thái',
    'Hình thức nhập',
    'Ngày thực hiện (Bản giấy)',
    'Thời gian nộp (Hệ thống)',
    'C1. Đã làm gì',
    'C2. Bằng chứng & Nguồn',
    'C3. Nhận định xem xét lại',
    'C4. Điều chưa rõ & Cách kiểm tra',
    'Dữ liệu sản phẩm đặc thù',
    'Số lượng tệp đính kèm',
    'Nhận xét của Giáo viên / Mentor'
  ];

  // Hàm làm sạch chuỗi chống CSV Formula Injection (=, +, -, @)
  const sanitizeCell = (text) => {
    if (text === null || text === undefined) return '""';
    let str = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Nếu bắt đầu bằng ký tự công thức, thêm dấu nháy đơn
    if (/^[\=\+\-\@\t\r]/.test(str)) {
      str = "'" + str;
    }
    // Escape dấu ngoặc kép đôi
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map(item => {
    const config = ROUNDS_CONFIG[item.round] || {};
    const mentorFeedbackText = Array.isArray(item.journal_mentor_feedbacks) 
      ? item.journal_mentor_feedbacks.map(f => `[${f.mentor_name} - ${f.created_at?.slice(0, 10)}]: ${f.feedback_text}`).join(' | ')
      : '';

    return [
      sanitizeCell(item.student_code),
      sanitizeCell(item.cohort_code || 'CBAS-2026-N30'),
      sanitizeCell(item.round),
      sanitizeCell(config.shortTitle || `Vòng ${item.round}`),
      sanitizeCell(`v${item.version || 1}`),
      sanitizeCell(JOURNAL_STATUS_LABELS[item.status]?.label || item.status),
      sanitizeCell(item.is_paper_entry ? 'Nhập lại từ bản giấy' : 'Nhập trực tiếp trên web'),
      sanitizeCell(item.paper_recorded_date || ''),
      sanitizeCell(item.submitted_at || item.updated_at || ''),
      sanitizeCell(item.q1_actions),
      sanitizeCell(item.q2_evidence),
      sanitizeCell(item.q3_reflection),
      sanitizeCell(item.q4_unclear),
      sanitizeCell(JSON.stringify(item.artifact_data || {})),
      sanitizeCell(item.attachments?.length || 0),
      sanitizeCell(mentorFeedbackText)
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) giúp Excel mở trực tiếp file tiếng Việt không bị lỗi font
  const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Nhat_Ky_Phan_Tu_SocraCareer_${exportMode}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 10. GENERATE DEMO DATA (PHỤC VỤ KIỂM THỬ TRƯỚC KHI THU THẬP THỰC TẾ)
function generateDemoJournals() {
  const demo = [];
  const sampleStudents = ['CT_01', 'CT_02', 'CT_08', 'CT_13', 'CT_21', 'CT_30'];

  sampleStudents.forEach(sCode => {
    // Vòng 1
    demo.push({
      id: `demo-1-${sCode}`,
      student_code: sCode,
      cohort_code: 'CBAS-2026-N30',
      round: 1,
      version: 1,
      status: 'submitted',
      is_paper_entry: false,
      q1_actions: 'Làm trắc nghiệm sở thích RIASEC 30 câu và chọn ngành mỏ neo ban đầu.',
      q2_evidence: 'Kết quả nhóm mã RIASEC và điểm số 3 môn tổ hợp lớp 10, 11.',
      q3_reflection: 'Em nhận thấy nhóm tính cách nổi trội của mình hợp với nghiên cứu và công nghệ hơn là quản lý.',
      q4_unclear: 'Chưa rõ chương trình đào tạo đại học thực tế gồm những môn nào.',
      artifact_data: { initialCareer: 'Kỹ sư phần mềm', reason: 'Yêu thích máy tính và công nghệ', confidenceScore: 8 },
      attachments: [],
      is_demo: true,
      created_at: '2026-10-10T08:00:00Z',
      submitted_at: '2026-10-10T08:30:00Z'
    });

    // Vòng 2
    demo.push({
      id: `demo-2-${sCode}`,
      student_code: sCode,
      cohort_code: 'CBAS-2026-N30',
      round: 2,
      version: 1,
      status: 'submitted',
      is_paper_entry: false,
      q1_actions: 'Đối thoại 3 vòng chất vấn phản tư cùng AI Socrates.',
      q2_evidence: 'Đoạn phân tích của AI về áp lực ngồi máy tính 10h/ngày và rủi ro đào thải công nghệ.',
      q3_reflection: 'Nhận thức được mức lương nghìn đô chỉ dành cho top dẫn đầu, không phải ai ra trường cũng đạt được.',
      q4_unclear: 'Cần tìm hiểu thực tế điểm chuẩn xét tuyển và học phí các trường công lập.',
      artifact_data: {
        claimToVerify: 'Ngành CNTT luôn dễ kiếm việc lương cao ngay sau khi tốt nghiệp',
        conversationExcerpt: 'Học sinh: Em nghĩ học IT ra trường là có lương 20 triệu.\nAI Socrates: Nếu 80% sinh viên đều có bằng cử nhân, điều gì giúp em tạo lợi thế cạnh tranh với những người có kinh nghiệm thực chiến?'
      },
      attachments: [],
      is_demo: true,
      created_at: '2026-10-12T09:00:00Z',
      submitted_at: '2026-10-12T09:45:00Z'
    });

    // Vòng 3
    demo.push({
      id: `demo-3-${sCode}`,
      student_code: sCode,
      cohort_code: 'CBAS-2026-N30',
      round: 3,
      version: 1,
      status: 'submitted',
      is_paper_entry: false,
      q1_actions: 'Tra cứu Đề án tuyển sinh 3 công khai và bảng điểm chuẩn 3 năm gần nhất.',
      q2_evidence: 'Đề án tuyển sinh ĐH Bách Khoa và ĐH Nha Trang năm 2025.',
      q3_reflection: 'Điểm tổ hợp của em hiện đang thiếu 2.0 điểm so với chuẩn NV1, cần có phương án vừa sức.',
      q4_unclear: 'Chưa rõ mức học phí từng năm có tăng theo lộ trình tự chủ đại học không.',
      artifact_data: {
        sources: [
          { name: 'Đề án tuyển sinh ĐH Bách Khoa 2025', url: 'https://hust.edu.vn/tuyensinh', accessDate: '2026-10-14', notes: 'Điểm chuẩn 27.5, học phí 35tr/năm' },
          { name: 'Cổng thông tin ĐH Nha Trang', url: 'https://ntu.edu.vn', accessDate: '2026-10-14', notes: 'Điểm chuẩn 22.0, học phí 18tr/năm' }
        ]
      },
      attachments: [],
      is_demo: true,
      created_at: '2026-10-14T14:00:00Z',
      submitted_at: '2026-10-14T14:40:00Z'
    });
  });

  return demo;
}
