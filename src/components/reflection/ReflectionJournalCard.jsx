import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ROUNDS_CONFIG,
  JOURNAL_QUESTIONS,
  JOURNAL_STATUS_LABELS,
  getJournalForRound,
  saveJournalDraft,
  submitJournalEntry,
  getJournalVersionsHistory,
  validateAndUploadFile
} from '../../utils/reflectionJournalService';
import {
  BookOpen,
  FileText,
  Save,
  Send,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Sparkles,
  RotateCcw,
  UploadCloud,
  FileCheck2,
  MessageSquare,
  Link2
} from 'lucide-react';

export default function ReflectionJournalCard({
  round = 1,
  studentCode: propStudentCode = '',
  contextData = {},
  onSaved = null
}) {
  const { user, profile, studentCode: authStudentCode } = useAuth();
  const effectiveStudentCode = propStudentCode || authStudentCode || profile?.student_code || 'CT_01';
  const roundNum = Number(round) || 1;
  const config = ROUNDS_CONFIG[roundNum] || ROUNDS_CONFIG[1];

  // States dữ liệu nhật ký
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState(null);

  // States lưu trữ và đồng bộ
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [isServerSynced, setIsServerSynced] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Attachment upload states
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Auto-save timer ref
  const autoSaveTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const contextDataRef = useRef(contextData);
  
  useEffect(() => {
    contextDataRef.current = contextData;
  }, [contextData]);

  // 1. TẢI DỮ LIỆU NHẬT KÝ BAN ĐẦU
  const loadJournalData = useCallback(async (verNum = null) => {
    setLoading(true);
    try {
      const result = await getJournalForRound(roundNum, effectiveStudentCode, user, verNum);
      let jData = result.journal;

      const ctx = contextDataRef.current || {};
      // Tiền điền gợi ý nhẹ từ ngữ cảnh Bước 1 nếu ô còn trống (Ở Vòng 2, AI tuyệt đối không viết thay phần nhật ký cá nhân của học sinh)
      if (roundNum === 1 && !jData.artifact_data?.initialCareer && ctx.targetMajor) {
        jData.artifact_data = {
          ...jData.artifact_data,
          initialCareer: ctx.targetMajor,
          reason: ctx.reason || jData.artifact_data?.reason || ''
        };
      }

      setJournal(jData);
      setIsServerSynced(result.isServerSynced);
      setSelectedVersionNum(jData.version || 1);

      // Tải lịch sử các phiên bản
      const hist = await getJournalVersionsHistory(roundNum, effectiveStudentCode, user);
      setVersions(hist);
    } catch (e) {
      console.warn('Lỗi tải nhật ký:', e);
    } finally {
      setLoading(false);
      isFirstLoadRef.current = false;
    }
  }, [roundNum, effectiveStudentCode, user]);

  useEffect(() => {
    loadJournalData();
  }, [loadJournalData]);

  // 2. CẬP NHẬT TRƯỜNG DỮ LIỆU CÂU HỎI
  const handleAnswerChange = (field, value) => {
    setJournal(prev => {
      const updated = { ...prev, [field]: value };
      triggerAutoSave(updated);
      return updated;
    });
    setValidationError('');
  };

  // 3. CẬP NHẬT SẢN PHẨM ĐẶC THÙ (ARTIFACT DATA)
  const handleArtifactChange = (subField, value) => {
    setJournal(prev => {
      const updatedArtifact = {
        ...(prev.artifact_data || {}),
        [subField]: value
      };
      const updated = { ...prev, artifact_data: updatedArtifact };
      triggerAutoSave(updated);
      return updated;
    });
  };

  // 4. BỔ SUNG GỢI Ý CHIP
  const handleAppendChip = (field, chipText) => {
    if (!journal) return;
    const current = (journal[field] || '').trim();
    let nextVal = '';
    if (!current) {
      nextVal = chipText;
    } else if (!current.includes(chipText)) {
      nextVal = `${current}; ${chipText}`;
    } else {
      return;
    }
    handleAnswerChange(field, nextVal);
  };

  // 5. AUTO-SAVE DEBOUNCE (TỰ ĐỘNG LƯU NHÁP SAU 1.5 GIÂY)
  const triggerAutoSave = (entryToSave) => {
    if (isFirstLoadRef.current) return;
    if (entryToSave.status === 'submitted' && !entryToSave.is_editing_revision) {
      // Đã nộp chính thức thì không tự động ghi đè bản nộp
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus('saving');
    setSaveMessage('Đang lưu nháp...');

    autoSaveTimeoutRef.current = setTimeout(async () => {
      const res = await saveJournalDraft(roundNum, entryToSave, effectiveStudentCode, user);
      if (res.success) {
        setSaveStatus('saved');
        setIsServerSynced(res.isServerSynced);
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setSaveMessage(res.isServerSynced 
          ? `Đã lưu nháp & đồng bộ máy chủ (${timeStr})` 
          : `Đã lưu trên thiết bị (${timeStr})`
        );
      } else {
        setSaveStatus('error');
        setSaveMessage('Lỗi lưu nháp. Nội dung vẫn được giữ trên màn hình.');
      }
    }, 1500);
  };

  // 6. LƯU BẢN NHÁP THỦ CÔNG
  const handleManualSaveDraft = async () => {
    if (!journal) return;
    setSaveStatus('saving');
    setSaveMessage('Đang lưu nháp...');

    try {
      const res = await saveJournalDraft(roundNum, journal, effectiveStudentCode, user);
      if (res.success) {
        setSaveStatus('saved');
        setIsServerSynced(res.isServerSynced);
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setSaveMessage(res.isServerSynced 
          ? `Đã lưu nháp & đồng bộ máy chủ (${timeStr})` 
          : `Đã lưu trên thiết bị (${timeStr})`
        );
        if (onSaved) onSaved(res.data);
      } else {
        setSaveStatus('error');
        setSaveMessage('Lỗi lưu nháp.');
      }
    } catch (e) {
      setSaveStatus('error');
      setSaveMessage('Lỗi kết nối. Nội dung đang nhập vẫn được giữ an toàn.');
    }
  };

  // 7. NỘP CHÍNH THỨC NHẬT KÝ
  const handleSubmitEntry = async () => {
    if (!journal) return;
    setIsSubmitting(true);
    setValidationError('');

    try {
      const res = await submitJournalEntry(roundNum, journal, effectiveStudentCode, user);
      if (!res.success) {
        setValidationError(res.error || 'Vui lòng kiểm tra lại nội dung.');
        setIsSubmitting(false);
        return;
      }

      setJournal(res.data);
      setIsServerSynced(res.isServerSynced);
      setSaveStatus('saved');
      setSaveMessage('Đã nộp nhật ký thành công!');

      // Cập nhật lại danh sách phiên bản
      const hist = await getJournalVersionsHistory(roundNum, effectiveStudentCode, user);
      setVersions(hist);

      if (onSaved) onSaved(res.data);
    } catch (e) {
      setValidationError('Có lỗi xảy ra khi nộp nhật ký. Nội dung của em đã được lưu tạm an toàn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. BẮT ĐẦU BỔ SUNG PHIÊN BẢN MỚI (REVISION)
  const handleStartRevision = () => {
    if (!journal) return;
    const nextVer = (journal.version || 1) + 1;
    setJournal(prev => ({
      ...prev,
      version: nextVer,
      status: 'draft',
      is_editing_revision: true,
      updated_at: new Date().toISOString()
    }));
    setSaveStatus('idle');
    setSaveMessage(`Đang soạn bản bổ sung phiên bản ${nextVer}. Bản cũ vẫn được lưu giữ an toàn.`);
  };

  // 9. XỬ LÝ TỆP ĐÍNH KÈM
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadError('');

    try {
      const attResult = await validateAndUploadFile(file, roundNum, effectiveStudentCode, user);
      setJournal(prev => {
        const currentList = prev.attachments || [];
        const updatedList = [...currentList, attResult];
        const updated = { ...prev, attachments: updatedList };
        triggerAutoSave(updated);
        return updated;
      });
    } catch (err) {
      setUploadError(err.message || 'Lỗi khi tải tệp');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId) => {
    setJournal(prev => {
      const updatedList = (prev.attachments || []).filter(a => a.id !== attId);
      const updated = { ...prev, attachments: updatedList };
      triggerAutoSave(updated);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center gap-3 text-slate-500 text-xs">
        <Clock className="w-4 h-4 animate-spin text-teal-600" />
        <span>Đang kết nối sổ nhật ký Vòng {roundNum}...</span>
      </div>
    );
  }

  if (!journal) return null;

  const currentStatus = journal.status === 'submitted'
    ? (journal.version > 1 ? 'revised' : 'submitted')
    : (journal.q1_actions?.trim() || journal.q2_evidence?.trim() ? 'draft' : 'not_started');

  const statusMeta = JOURNAL_STATUS_LABELS[currentStatus] || JOURNAL_STATUS_LABELS.not_started;
  const isReadOnlySubmitted = journal.status === 'submitted' && !journal.is_editing_revision;

  return (
    <div id={`reflection-journal-card-r${roundNum}`} className="no-print my-6 bg-white rounded-2xl border-2 border-teal-500/30 shadow-md overflow-hidden transition-all">
      {/* HEADER KHỐI NHẬT KÝ */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5 md:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              📝
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/20">
                  Hồ sơ phản tư nghề nghiệp
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                  {statusMeta.label} {journal.version > 1 && `(v${journal.version})`}
                </span>
                {versions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="text-[11px] text-teal-300 hover:text-white underline flex items-center gap-1 cursor-pointer font-medium"
                    title="Xem lại các phiên bản đã nộp"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Lịch sử ({versions.length} bản)</span>
                  </button>
                )}
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mt-1">
                Nhật Ký & Sản Phẩm Phản Tư • {config.shortTitle}
              </h3>
            </div>
          </div>

          {/* Nút liên kết sang trang tổng quan */}
          <Link
            to="/student/reflection-dossier"
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-teal-200 hover:text-white rounded-xl text-xs font-semibold transition border border-white/10 flex items-center gap-1.5"
            title="Mở trang Hồ sơ phản tư của em để theo dõi đủ 5 vòng"
          >
            <span>📁 Hồ sơ 5 vòng của em</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Thông điệp chuẩn mực KHKT */}
        <p className="text-xs text-slate-300 leading-relaxed font-normal bg-black/20 p-2.5 rounded-xl border border-white/5">
          ℹ️ <strong>Mục tiêu:</strong> Sau mỗi vòng, em ghi nhật ký ngắn và lưu sản phẩm để tích lũy thành <em>Hồ sơ ra quyết định nghề nghiệp</em> xuyên suốt 5 vòng. 
          Đây là dữ liệu tự báo cáo trung thực của em, không bắt buộc em phải thay đổi ngành nghề mới hoàn thành vòng.
        </p>
      </div>

      <div className="p-5 md:p-6 space-y-6 text-slate-800 text-xs md:text-sm">
        {/* BANNER NHẮC NHỞ KHÔNG KHÓA TIẾN ĐỘ */}
        <div className="flex items-center justify-between gap-3 p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Lưu ý tiến độ:</strong> Em có thể nộp ngay hoặc lưu nháp để bổ sung sau. Hoạt động tiếp theo sẽ <strong>không bị khóa</strong> chỉ vì em chưa nộp nhật ký.
            </span>
          </div>
          <span className="font-bold text-teal-800 whitespace-nowrap hidden sm:inline">
            Mã HS: {effectiveStudentCode}
          </span>
        </div>

        {/* NỘI DUNG ĐẶC THÙ CỦA BẢN NỘP / BẢN ĐANG SỬA */}
        {isReadOnlySubmitted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Bản nộp chính thức phiên bản {journal.version} đã được ghi nhận vào hệ thống.</span>
              </span>
              <p className="text-emerald-700">
                Thời gian nộp: {journal.submitted_at ? new Date(journal.submitted_at).toLocaleString('vi-VN') : 'Đã ghi nhận'}. Bản nộp này được bảo lưu nguyên vẹn, không bị ghi đè.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartRevision}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bổ sung phiên bản mới (v{(journal.version || 1) + 1})</span>
            </button>
          </div>
        )}

        {/* PHẦN 1: 4 CÂU HỎI NHẬT KÝ */}
        <div className="space-y-5">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Phần 1: Bốn Câu Hỏi Nhật Ký Suy Ngẫm</span>
          </h4>

          {JOURNAL_QUESTIONS.map(q => {
            const val = journal[q.key] || '';
            return (
              <div key={q.key} className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <label className="font-bold text-slate-900 leading-snug">
                    {q.title} <span className="text-rose-500 font-black">*</span>
                  </label>
                  {val.trim() ? (
                    <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      ✓ Đã ghi
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-medium text-slate-400">
                      Chưa có nội dung
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  disabled={isReadOnlySubmitted}
                  value={val}
                  onChange={(e) => handleAnswerChange(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  className={`w-full p-3 bg-white border rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition leading-relaxed ${
                    isReadOnlySubmitted ? 'bg-slate-100 text-slate-700 cursor-not-allowed border-slate-200' : 'border-slate-300'
                  }`}
                />

                {/* Gợi ý trả lời ngắn / quick chips */}
                {!isReadOnlySubmitted && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                    <span className="text-[11px] text-slate-500 font-medium mr-1">💡 Gợi ý nhanh:</span>
                    {q.quickChips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleAppendChip(q.key, chip)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg text-[11px] font-medium transition cursor-pointer active:scale-95 shadow-2xs"
                      >
                        + {chip}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.key, '')}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer ml-auto"
                      title="Xóa trắng ô này để tự viết"
                    >
                      ✕ Xóa ô
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PHẦN 2: SẢN PHẨM PHẢN TƯ THEO VÒNG */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Phần 2: {config.artifactGuideTitle}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {config.artifactGuideDesc}
            </p>
          </div>

          <div className="bg-indigo-50/40 p-4 md:p-5 rounded-xl border border-indigo-200/80 space-y-4">
            {/* VÒNG 1: Nghề ban đầu, lý do, mức tự tin 1-10 */}
            {roundNum === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nghề nghiệp em quan tâm ban đầu:
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlySubmitted}
                      value={journal.artifact_data?.initialCareer || ''}
                      onChange={(e) => handleArtifactChange('initialCareer', e.target.value)}
                      placeholder="VD: Kỹ sư phần mềm, Bác sĩ thú y, Sư phạm..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mức độ tự tin ban đầu (phục vụ nhật ký):
                    </label>
                    <div className="flex items-center gap-3 bg-white p-2 border border-slate-300 rounded-lg">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={isReadOnlySubmitted}
                        value={journal.artifact_data?.confidenceScore ?? 7}
                        onChange={(e) => handleArtifactChange('confidenceScore', Number(e.target.value))}
                        className="flex-1 accent-indigo-600 cursor-pointer"
                      />
                      <span className="font-black text-indigo-800 text-sm w-10 text-center">
                        {journal.artifact_data?.confidenceScore ?? 7}/10
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lý do em lựa chọn hoặc quan tâm đến nghề này:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isReadOnlySubmitted}
                    value={journal.artifact_data?.reason || ''}
                    onChange={(e) => handleArtifactChange('reason', e.target.value)}
                    placeholder="VD: Do em thấy bản thân thích công nghệ, do người thân khuyên, hoặc do thấy thu nhập tốt..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* VÒNG 2: Nhận định cần kiểm chứng & trích đoạn AI (do học sinh tự viết, AI không viết thay) */}
            {roundNum === 2 && (
              <div className="space-y-3">
                {Array.isArray(contextData?.verifiedSummaryQuestions) && contextData.verifiedSummaryQuestions.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs text-slate-700 space-y-1">
                    <div className="font-bold text-indigo-900">
                      📌 Tham khảo danh sách câu hỏi cần kiểm tra ở Bước 3 (từ Bảng tóm tắt phản tư ở trên — AI không tự điền vào nhật ký cá nhân của em):
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {contextData.verifiedSummaryQuestions.map((item, idx) => (
                        <li key={item.id || idx}>
                          <span className="font-medium text-slate-800">{item.question}</span>{' '}
                          <span className="text-[11px] text-indigo-700">({item.suggestedSourceType})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Một nhận định về nghề mà em thấy cần kiểm chứng lại (do chính em tự rút ra):
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnlySubmitted}
                    value={journal.artifact_data?.claimToVerify || ''}
                    onChange={(e) => handleArtifactChange('claimToVerify', e.target.value)}
                    placeholder="VD: Yêu cầu tổ hợp môn xét tuyển hoặc điều kiện làm việc thực tế của ngành..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Ghi chép hoặc trích đoạn trao đổi tiêu biểu mà em tự chọn lưu lại:
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    disabled={isReadOnlySubmitted}
                    value={journal.artifact_data?.conversationExcerpt || ''}
                    onChange={(e) => handleArtifactChange('conversationExcerpt', e.target.value)}
                    placeholder="Tự tay ghi lại điều em tâm đắc hoặc đoạn trao đổi đáng nhớ trong 4 chặng vừa rồi..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500 font-mono text-[12px]"
                  />
                </div>
              </div>
            )}

            {/* VÒNG 3: Bảng đối chiếu nguồn tin */}
            {roundNum === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Bảng danh mục nguồn tin & tài liệu đối chứng đã tra cứu:
                  </span>
                  {!isReadOnlySubmitted && (
                    <button
                      type="button"
                      onClick={() => {
                        const cur = journal.artifact_data?.sources || [];
                        handleArtifactChange('sources', [...cur, { name: '', url: '', accessDate: new Date().toISOString().slice(0, 10), notes: '' }]);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm nguồn tin</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {(journal.artifact_data?.sources || [{ name: '', url: '', accessDate: '', notes: '' }]).map((src, sIdx) => (
                    <div key={sIdx} className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                      <div className="md:col-span-2">
                        <label className="text-[10.5px] font-bold text-slate-500 block mb-0.5">Tên nguồn / Đề án:</label>
                        <input
                          type="text"
                          disabled={isReadOnlySubmitted}
                          placeholder="VD: Đề án tuyển sinh ĐH Nha Trang 2025"
                          value={src.name || ''}
                          onChange={(e) => {
                            const cur = [...(journal.artifact_data?.sources || [])];
                            cur[sIdx] = { ...cur[sIdx], name: e.target.value };
                            handleArtifactChange('sources', cur);
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-500 block mb-0.5">Đường dẫn (URL):</label>
                        <input
                          type="text"
                          disabled={isReadOnlySubmitted}
                          placeholder="https://..."
                          value={src.url || ''}
                          onChange={(e) => {
                            const cur = [...(journal.artifact_data?.sources || [])];
                            cur[sIdx] = { ...cur[sIdx], url: e.target.value };
                            handleArtifactChange('sources', cur);
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-500 block mb-0.5">Ngày truy cập:</label>
                        <input
                          type="date"
                          disabled={isReadOnlySubmitted}
                          value={src.accessDate || ''}
                          onChange={(e) => {
                            const cur = [...(journal.artifact_data?.sources || [])];
                            cur[sIdx] = { ...cur[sIdx], accessDate: e.target.value };
                            handleArtifactChange('sources', cur);
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VÒNG 4: Ghi chép trao đổi với mentor */}
            {roundNum === 4 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chép đúc kết từ buổi đối thoại cùng Mentor (hoặc Thầy/Cô tư vấn):
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnlySubmitted}
                    value={journal.artifact_data?.mentorNotes || ''}
                    onChange={(e) => handleArtifactChange('mentorNotes', e.target.value)}
                    placeholder="Ghi lại 1-2 lời khuyên thực tế nhất mà Mentor đã chia sẻ về ngành học, cơ hội việc làm hoặc cách chọn trường..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kết quả thử làm một nhiệm vụ nhỏ của nghề (nếu có):
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnlySubmitted}
                    value={journal.artifact_data?.taskTrialSummary || ''}
                    onChange={(e) => handleArtifactChange('taskTrialSummary', e.target.value)}
                    placeholder="VD: Thử dịch 1 bài tiếng Anh, thử viết đoạn code nhỏ, thử làm bài tập tình huống... (nếu chưa thử có thể ghi 'Chưa thử')"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* VÒNG 5: Kế hoạch lựa chọn & hành động */}
            {roundNum === 5 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phương án lựa chọn chính (Mục tiêu):
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlySubmitted}
                      value={journal.artifact_data?.primaryPlan || ''}
                      onChange={(e) => handleArtifactChange('primaryPlan', e.target.value)}
                      placeholder="VD: Ngành Công nghệ thông tin - ĐH Nha Trang"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phương án dự phòng an toàn (Backup):
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnlySubmitted}
                      value={journal.artifact_data?.backupPlan || ''}
                      onChange={(e) => handleArtifactChange('backupPlan', e.target.value)}
                      placeholder="VD: Hệ Cao đẳng Kỹ thuật Công nghệ / Xét học bạ trường vừa sức"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lý do em giữ nguyên hay điều chỉnh lựa chọn so với Vòng 1:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isReadOnlySubmitted}
                    value={journal.artifact_data?.decisionRationale || ''}
                    onChange={(e) => handleArtifactChange('decisionRationale', e.target.value)}
                    placeholder="Giải thích ngắn gọn căn cứ thực tế (điểm số, tài chính, sự phù hợp) giúp em kiên định hoặc thay đổi quyết định..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PHẦN 3: TỆP ĐÍNH KÈM (ATTACHMENTS) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-teal-600" />
              <span>Phần 3: Tệp Đính Kèm Sản Phẩm (Không bắt buộc)</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Hỗ trợ JPG, PNG, PDF (≤ 10 MB)</span>
          </div>

          {/* Cảnh báo bảo mật PII */}
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Nhắc nhở bảo mật dữ liệu:</strong> Em vui lòng che hoặc không tải lên các thông tin nhận diện cá nhân nhạy cảm (như số điện thoại, số CCCD, địa chỉ nhà riêng, thông tin tài chính chi tiết của gia đình).
            </span>
          </div>

          {/* Danh sách tệp đã tải */}
          {(journal.attachments && journal.attachments.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {journal.attachments.map(att => (
                <div key={att.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base shrink-0">
                      {att.fileType?.includes('pdf') ? '📄' : '🖼️'}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate" title={att.fileName}>
                        {att.fileName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(att.fileSize / 1024).toFixed(0)} KB • {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {att.dataUrl && (
                      <a
                        href={att.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-teal-700 hover:text-teal-900 cursor-pointer"
                        title="Xem tệp"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!isReadOnlySubmitted && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Gỡ tệp này khỏi bản nháp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Khu vực bấm chọn tải tệp */}
          {!isReadOnlySubmitted && (
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelected}
                className="hidden"
                id={`file-upload-input-r${roundNum}`}
              />
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition border border-slate-300 flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-4 h-4 text-slate-600" />
                <span>{isUploadingFile ? 'Đang kiểm tra & tải tệp...' : '+ Chọn tệp sản phẩm (JPG, PNG, PDF)'}</span>
              </button>
              {uploadError && (
                <span className="text-xs text-rose-600 font-medium">⚠️ {uploadError}</span>
              )}
            </div>
          )}
        </div>

        {/* PHẦN 4: LỰA CHỌN CẬP NHẬT TỪ BẢN GIẤY */}
        <div className="pt-2 border-t border-slate-200">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              disabled={isReadOnlySubmitted}
              checked={Boolean(journal.is_paper_entry)}
              onChange={(e) => {
                const checked = e.target.checked;
                setJournal(prev => {
                  const updated = {
                    ...prev,
                    is_paper_entry: checked,
                    paper_recorded_date: checked ? (prev.paper_recorded_date || new Date().toISOString().slice(0, 10)) : null
                  };
                  triggerAutoSave(updated);
                  return updated;
                });
              }}
              className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
            />
            <span>Nội dung được cập nhật từ bản giấy thực địa</span>
          </label>

          {journal.is_paper_entry && (
            <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Ngày học sinh thực hiện trên bản giấy:</span>
              </span>
              <input
                type="date"
                disabled={isReadOnlySubmitted}
                value={journal.paper_recorded_date || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setJournal(prev => {
                    const updated = { ...prev, paper_recorded_date: val };
                    triggerAutoSave(updated);
                    return updated;
                  });
                }}
                className="p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
              />
              <span className="text-[11px] text-slate-500 italic">
                (Hệ thống lưu riêng ngày thực tế em ghi chép và ngày cập nhật lên web, không làm sai lệch mốc thời gian).
              </span>
            </div>
          )}
        </div>

        {/* THÔNG BÁO LỖI / TRẠNG THÁI NỘP */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* THANH ĐIỀU KHIỂN & LƯU / NỘP */}
        <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Trạng thái lưu nháp */}
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === 'saving' && (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{saveMessage}</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{saveMessage}</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>{saveMessage}</span>
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-slate-400">
                Phiên bản: v{journal.version || 1} • {statusMeta.label}
              </span>
            )}
          </div>

          {/* Các nút hành động */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {!isReadOnlySubmitted ? (
              <>
                <button
                  type="button"
                  onClick={handleManualSaveDraft}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" />
                  <span>Lưu Nháp</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitEntry}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-xl text-xs md:text-sm transition shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang Nộp...' : 'Nộp Nhật Ký Chính Thức 🚀'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartRevision}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bổ Sung Phiên Bản Mới (v{(journal.version || 1) + 1})</span>
              </button>
            )}
          </div>
        </div>

        {/* HIỂN THỊ NHẬN XÉT CỦA GIÁO VIÊN NẾU CÓ */}
        {journal.journal_mentor_feedbacks && journal.journal_mentor_feedbacks.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Góp ý & Nhận xét riêng từ Giáo viên / Mentor:</span>
            </span>
            <div className="space-y-2 pt-1">
              {journal.journal_mentor_feedbacks.map((fb, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200 text-purple-950">
                  <div className="flex items-center justify-between text-[11px] text-purple-700 font-bold mb-1">
                    <span>{fb.mentor_name}</span>
                    <span>{fb.created_at ? new Date(fb.created_at).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">{fb.feedback_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL LỊCH SỬ CÁC PHIÊN BẢN */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>Lịch Sử Các Phiên Bản • Vòng {roundNum}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500">
              Hệ thống bảo lưu nguyên vẹn từng lần nộp, không ghi đè dữ liệu quá khứ. Em có thể bấm vào từng bản để xem lại:
            </p>

            <div className="space-y-2.5">
              {versions.map((ver, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    loadJournalData(ver.version);
                    setShowHistoryModal(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    ver.version === selectedVersionNum
                      ? 'bg-teal-50 border-teal-400 text-teal-950 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">
                      Phiên bản v{ver.version} • {ver.status === 'submitted' ? 'Đã nộp chính thức' : 'Bản nháp'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {ver.submitted_at 
                        ? `Nộp: ${new Date(ver.submitted_at).toLocaleString('vi-VN')}`
                        : `Cập nhật: ${new Date(ver.updated_at).toLocaleString('vi-VN')}`
                      }
                    </span>
                  </div>
                  <span className="text-teal-700 font-bold underline text-[11px]">
                    Xem bản này ➔
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
