import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ROUNDS_CONFIG,
  JOURNAL_STATUS_LABELS,
  getAllRoundsStatus
} from '../../utils/reflectionJournalService';
import ReflectionJournalCard from '../../components/reflection/ReflectionJournalCard';
import StepProgressHeader from '../../components/common/StepProgressHeader';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Printer,
  FileCheck2,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function StudentReflectionDossier() {
  const { user, profile, studentCode } = useAuth();
  const effectiveStudentCode = studentCode || profile?.student_code || 'CT_01';
  const location = useLocation();

  // Đọc tab vòng được chọn từ URL param hoặc state nếu có
  const [activeRound, setActiveRound] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    const r = parseInt(searchParams.get('round'), 10);
    return r >= 1 && r <= 5 ? r : 1;
  });

  const [roundsStatus, setRoundsStatus] = useState({});
  const [loading, setLoading] = useState(true);

  // Tải trạng thái 5 vòng
  const loadStatuses = async () => {
    setLoading(true);
    try {
      const data = await getAllRoundsStatus(effectiveStudentCode, user);
      setRoundsStatus(data);
    } catch (e) {
      console.warn('Lỗi tải trạng thái 5 vòng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, [effectiveStudentCode, user]);

  // Đếm số vòng đã nộp
  const submittedCount = Object.values(roundsStatus).filter(
    r => r.status === 'submitted' || r.status === 'revised'
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* BREADCRUMB / HEADER TIẾN TRÌNH */}
      <StepProgressHeader 
        currentStep={null}
        title="Hồ Sơ Nhật Ký & Sản Phẩm Phản Tư Của Em"
        subtitle="Hồ sơ ra quyết định nghề nghiệp tích lũy xuyên suốt 5 vòng can thiệp SocraCareer"
      />

      {/* BANNER TỔNG QUAN TIẾN ĐỘ 5 VÒNG */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-teal-500/30 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-teal-300 bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/20">
                Hồ Sơ Định Hướng Nghề Nghiệp Xuyên Suốt 5 Vòng
              </span>
              <span className="text-xs font-bold text-slate-300">
                Mã học sinh: <strong className="text-teal-400">{effectiveStudentCode}</strong>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Hành Trình Tự Báo Cáo & Xây Dựng Hồ Sơ Phản Tư
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mỗi vòng hoàn thành, em hãy ghi chép lại các hoạt động, chứng cứ đã đối soát và nhận thức đã được xem xét lại. 
              Các ghi nhận này hình thành minh chứng tự chủ cho quyết định nghề nghiệp của em.
            </p>
          </div>

          {/* Vòng tròn tiến độ */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-full bg-teal-500/20 border-2 border-teal-400 flex flex-col items-center justify-center font-black text-lg text-teal-300 shadow-xs">
              <span>{submittedCount}</span>
              <span className="text-[9px] -mt-1 font-bold text-slate-300">/ 5 vòng</span>
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-extrabold text-white block">Trạng thái hồ sơ:</span>
              <span className="text-teal-300 font-bold">
                {submittedCount === 5 ? '✓ Đã hoàn thành trọn vẹn 5 vòng' : `Đã nộp ${submittedCount}/5 vòng`}
              </span>
              <p className="text-[11px] text-slate-400">
                Không bắt buộc nộp hết mới được chuyển bước
              </p>
            </div>
          </div>
        </div>

        {/* BẢNG TIẾN TRÌNH 5 NÚT BẤM CHỌN VÒNG (TABS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
          {[1, 2, 3, 4, 5].map(r => {
            const st = roundsStatus[r] || {};
            const config = ROUNDS_CONFIG[r];
            const isActive = activeRound === r;
            const meta = JOURNAL_STATUS_LABELS[st.status] || JOURNAL_STATUS_LABELS.not_started;

            return (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRound(r)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-white text-slate-900 border-teal-400 shadow-lg scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-teal-100 text-teal-900 font-black' : 'bg-white/10 text-slate-300'
                    }`}>
                      Vòng {r}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? meta.badgeClass : 'bg-black/30 text-slate-300'
                    }`}>
                      {meta.label}
                    </span>
                  </div>
                  <span className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-slate-900' : 'text-slate-200'}`}>
                    {config.shortTitle.split(':')[1] || config.shortTitle}
                  </span>
                </div>
                <div className={`mt-2 pt-2 border-t text-[11px] font-medium flex items-center justify-between ${
                  isActive ? 'border-slate-200 text-teal-700' : 'border-white/10 text-slate-400'
                }`}>
                  <span>{st.version > 1 ? `Bản v${st.version}` : 'Xem chi tiết'}</span>
                  <span>➔</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* THANH THÔNG TIN VÒNG HIỆN TẠI & NÚT TRUY CẬP TRANG CHÍNH */}
      {(() => {
        const currentConfig = ROUNDS_CONFIG[activeRound];
        const currentStatus = roundsStatus[activeRound] || {};
        const meta = JOURNAL_STATUS_LABELS[currentStatus.status] || JOURNAL_STATUS_LABELS.not_started;

        return (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-black text-sm shrink-0">
                {activeRound}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm md:text-base font-extrabold text-slate-900">
                    {currentConfig.title}
                  </h2>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {currentConfig.description}
                </p>
              </div>
            </div>

            <Link
              to={currentConfig.stepPath}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <span>Mở trang làm bài Vòng {activeRound}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })()}

      {/* COMPONENT NHẬT KÝ CHI TIẾT CỦA VÒNG ĐANG CHỌN */}
      <ReflectionJournalCard 
        key={`dossier-round-${activeRound}`}
        round={activeRound}
        studentCode={effectiveStudentCode}
        onSaved={() => loadStatuses()}
      />

      {/* HƯỚNG DẪN QUY CHUẨN ĐẠO ĐỨC KHOA HỌC HÀNH VI */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
        <h4 className="font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Quy Chuẩn Khoa Học & Tính Bảo Mật Của Nhật Ký Phản Tư (ViSEF 2026)</span>
        </h4>
        <ul className="space-y-1 pl-4 list-disc leading-relaxed text-slate-600">
          <li><strong>Dữ liệu tự báo cáo:</strong> Toàn bộ nhật ký và sản phẩm do học sinh tự điền và tự nộp. Hệ thống AI không tự động viết hay thay đổi nội dung của em.</li>
          <li><strong>Bảo vệ quyền riêng tư:</strong> Dữ liệu được mã hóa bằng mã học sinh ẩn danh (như CT_01, CT_02...), không công khai ra bên ngoài.</li>
          <li><strong>Tính linh hoạt:</strong> Em được quyền cập nhật thêm phiên bản mới sau khi có nhận thức sâu hơn. Hệ thống bảo lưu các bản cũ để đối chiếu quá trình tiến triển.</li>
        </ul>
      </div>
    </div>
  );
}
