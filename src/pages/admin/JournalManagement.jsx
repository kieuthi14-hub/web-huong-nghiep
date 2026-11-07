import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ROUNDS_CONFIG,
  JOURNAL_QUESTIONS,
  JOURNAL_STATUS_LABELS,
  getAdminJournalsList,
  addMentorFeedback,
  exportJournalsToCsv
} from '../../utils/reflectionJournalService';
import {
  BookOpen,
  Filter,
  Download,
  Search,
  Eye,
  MessageSquare,
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
  History,
  Send,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function JournalManagement() {
  const { user, profile } = useAuth();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCohort, setFilterCohort] = useState('ALL');
  const [filterRound, setFilterRound] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewHistoryMode, setViewHistoryMode] = useState('latest'); // 'latest' | 'all'

  // Modal xem chi tiết & nhận xét
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Tải danh sách
  const loadJournals = async () => {
    setLoading(true);
    try {
      const data = await getAdminJournalsList({
        cohort: filterCohort,
        round: filterRound,
        status: filterStatus,
        studentCode: searchTerm
      });
      setJournals(data);
    } catch (e) {
      console.warn('Lỗi tải nhật ký admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, [filterCohort, filterRound, filterStatus, searchTerm]);

  // Lọc dữ liệu hiển thị theo viewHistoryMode và search
  const filteredJournals = journals.filter(item => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const code = (item.student_code || '').toLowerCase();
      const cohort = (item.cohort_code || '').toLowerCase();
      const actions = (item.q1_actions || '').toLowerCase();
      if (!code.includes(q) && !cohort.includes(q) && !actions.includes(q)) return false;
    }
    if (filterCohort !== 'ALL' && item.cohort_code !== filterCohort) return false;
    if (filterRound !== 'ALL' && item.round !== Number(filterRound)) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  // Nếu chọn xem 'latest', lọc ra phiên bản mới nhất cho mỗi (student_code, round)
  const displayJournals = (() => {
    if (viewHistoryMode === 'all') return filteredJournals;
    const map = new Map();
    filteredJournals.forEach(item => {
      const key = `${item.student_code}_${item.round}`;
      const existing = map.get(key);
      if (!existing || (item.version || 1) > (existing.version || 1)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  })();

  // Thống kê nhanh
  const totalEntries = displayJournals.length;
  const submittedCount = displayJournals.filter(j => j.status === 'submitted').length;
  const draftCount = displayJournals.filter(j => j.status === 'draft').length;
  const withAttachmentsCount = displayJournals.filter(j => j.attachments && j.attachments.length > 0).length;

  // Xử lý gửi nhận xét của Cố vấn
  const handleSendFeedback = async () => {
    if (!selectedJournal || !feedbackInput.trim()) return;
    setFeedbackSending(true);
    setFeedbackMessage('');

    try {
      const fbResult = await addMentorFeedback(selectedJournal.id, feedbackInput.trim(), profile || user);
      
      // Cập nhật lại trong modal
      setSelectedJournal(prev => {
        const curList = prev.journal_mentor_feedbacks || [];
        return {
          ...prev,
          journal_mentor_feedbacks: [...curList, fbResult]
        };
      });

      // Cập nhật lại trong bảng danh sách
      setJournals(prev => prev.map(item => {
        if (item.id === selectedJournal.id) {
          const curList = item.journal_mentor_feedbacks || [];
          return { ...item, journal_mentor_feedbacks: [...curList, fbResult] };
        }
        return item;
      }));

      setFeedbackInput('');
      setFeedbackMessage('✓ Đã gửi nhận xét riêng của Cố vấn thành công!');
    } catch (e) {
      setFeedbackMessage('⚠️ Có lỗi xảy ra khi gửi nhận xét.');
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* HEADER QUẢN LÝ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Phân Hệ Dành Cho Giáo Viên & Người Nghiên Cứu
              </span>
              <span className="text-xs text-indigo-300 font-bold">SocraCareer ViSEF 2026</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Sổ Quản Lý Nhật Ký & Sản Phẩm Phản Tư 5 Vòng
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Theo dõi dữ liệu tự báo cáo trung thực của học sinh, rà soát chứng cứ và sản phẩm đối chứng, 
              đồng thời gửi nhận xét đồng hành độc lập mà không can thiệp làm sai lệch nội dung gốc của học sinh.
            </p>
          </div>

          {/* Nút xuất dữ liệu CSV */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => exportJournalsToCsv(journals, 'latest')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              title="Xuất file CSV chứa các phiên bản mới nhất (chuẩn UTF-8 mở được trên Excel)"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV (Bản Mới Nhất)</span>
            </button>
            <button
              type="button"
              onClick={() => exportJournalsToCsv(journals, 'all')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
              title="Xuất toàn bộ lịch sử tất cả các phiên bản của học sinh"
            >
              <Layers className="w-4 h-4" />
              <span>Xuất Toàn Bộ Lịch Sử</span>
            </button>
          </div>
        </div>

        {/* THẺ THỐNG KÊ NHANH */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
            <span className="text-slate-400 text-[11px] font-bold block">Tổng số bản ghi:</span>
            <span className="text-xl font-black text-white mt-0.5 block">{totalEntries}</span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <span className="text-emerald-300 text-[11px] font-bold block">Đã nộp chính thức:</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{submittedCount}</span>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <span className="text-amber-300 text-[11px] font-bold block">Bản nháp đang viết:</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{draftCount}</span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
            <span className="text-indigo-300 text-[11px] font-bold block">Có tệp đính kèm:</span>
            <span className="text-xl font-black text-indigo-300 mt-0.5 block">{withAttachmentsCount}</span>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ BỘ LỌC */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b pb-2.5">
          <span className="font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Bộ Lọc Dữ Liệu Nghiên Cứu</span>
          </span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewHistoryMode('latest')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewHistoryMode === 'latest' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản mới nhất
            </button>
            <button
              type="button"
              onClick={() => setViewHistoryMode('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewHistoryMode === 'all' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn bộ lịch sử (v1, v2...)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Lọc đợt nghiên cứu */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Đợt nghiên cứu (Cohort):</label>
            <select
              value={filterCohort}
              onChange={(e) => setFilterCohort(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả đợt nghiên cứu</option>
              <option value="CBAS-2026-N30">CBAS-2026-N30 (Nhóm Can thiệp N=30)</option>
              <option value="THPT-TQC-2026">THPT-TQC-2026 (Trường THPT Trần Quý Cáp)</option>
              <option value="DEMO-SANDBOX">DEMO-SANDBOX (Thử nghiệm hệ thống)</option>
            </select>
          </div>

          {/* Lọc Vòng */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Vòng can thiệp:</label>
            <select
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả 5 vòng</option>
              <option value="1">Vòng 1: Trắc nghiệm RIASEC & Mỏ neo</option>
              <option value="2">Vòng 2: AI Socrates Phản biện</option>
              <option value="3">Vòng 3: Đối chứng dữ liệu tuyển sinh</option>
              <option value="4">Vòng 4: Tham vấn đối chất thực tế</option>
              <option value="5">Vòng 5: Kế hoạch hành động T2</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Trạng thái nộp:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="submitted">Đã nộp chính thức</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>

          {/* Tìm kiếm mã học sinh */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Tìm kiếm học sinh:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Mã HS (VD: CT_01, CT_21...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU NHẬT KÝ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p>Đang tải dữ liệu nhật ký phản tư...</p>
          </div>
        ) : displayJournals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600">Không tìm thấy bản ghi nhật ký phù hợp với bộ lọc.</p>
            <p className="text-[11px]">Em hoặc học sinh hãy làm bài và nộp nhật ký tại từng vòng nhé!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Học Sinh</th>
                  <th className="py-3 px-3">Vòng</th>
                  <th className="py-3 px-2">Bản</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3">Hình Thức</th>
                  <th className="py-3 px-3">Thời Gian Nộp</th>
                  <th className="py-3 px-4">Tóm Tắt Nhận Thức (Q1 - Q4)</th>
                  <th className="py-3 px-3">Sản Phẩm & Tệp</th>
                  <th className="py-3 px-3">Nhận Xét Cố Vấn</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayJournals.map((item, idx) => {
                  const config = ROUNDS_CONFIG[item.round] || {};
                  const statusMeta = JOURNAL_STATUS_LABELS[item.status] || JOURNAL_STATUS_LABELS.not_started;
                  const feedbacksCount = item.journal_mentor_feedbacks?.length || 0;
                  const attachmentsCount = item.attachments?.length || 0;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {item.student_code}
                        </span>
                        {item.is_demo && (
                          <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            Demo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-indigo-900">
                        Vòng {item.round}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap font-bold text-slate-600">
                        v{item.version || 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] border ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                        {item.is_paper_entry ? (
                          <span className="text-amber-800 font-semibold" title={item.paper_recorded_date ? `Ngày ghi: ${item.paper_recorded_date}` : ''}>
                            📝 Bản giấy
                          </span>
                        ) : (
                          <span className="text-slate-500">💻 Web</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {item.submitted_at 
                          ? new Date(item.submitted_at).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : new Date(item.updated_at).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
                        }
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 leading-relaxed font-normal">
                          {item.q3_reflection || item.q1_actions || item.q2_evidence || 'Chưa có nội dung ghi chép.'}
                        </p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {attachmentsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            <Paperclip className="w-3 h-3" />
                            <span>{attachmentsCount} tệp</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Văn bản</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {feedbacksCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            <MessageSquare className="w-3 h-3" />
                            <span>{feedbacksCount} góp ý</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa nhận xét</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJournal(item);
                            setFeedbackInput('');
                            setFeedbackMessage('');
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold rounded-lg text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LƯU Ý KHOA HỌC HÀNH VI CHO NGƯỜI NGHIÊN CỨU */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Nguyên tắc khoa học hành vi (SocraCareer ViSEF 2026):</strong> Hệ thống không tự động gán điểm "tiến bộ" hay "hết thiên lệch" trên số lần truy cập hoặc số nhật ký đã nộp. 
          Nhận xét của Giáo viên / Cố vấn được lưu trữ độc lập, phục vụ định hướng đồng hành và phân tích thực chứng định tính.
        </div>
      </div>

      {/* MODAL CHI TIẾT NHẬT KÝ & FORM GỬI NHẬN XÉT CỐ VẤN */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-xs md:text-sm">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-black rounded-lg text-xs border border-indigo-200">
                    Mã HS: {selectedJournal.student_code}
                  </span>
                  <span className="font-bold text-slate-500">
                    Đợt: {selectedJournal.cohort_code || 'CBAS-2026-N30'}
                  </span>
                  <span className="font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                    Vòng {selectedJournal.round} (Bản v{selectedJournal.version || 1})
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-900">
                  {ROUNDS_CONFIG[selectedJournal.round]?.title || `Vòng ${selectedJournal.round}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thời gian nộp: {selectedJournal.submitted_at ? new Date(selectedJournal.submitted_at).toLocaleString('vi-VN') : 'Bản nháp'}
                  {selectedJournal.is_paper_entry && ` • Nhập lại từ bản giấy (Ngày thực tế: ${selectedJournal.paper_recorded_date || 'Không ghi'})`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJournal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* BỐN CÂU HỎI NHẬT KÝ NGUYÊN VĂN */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Nội Dung Trả Lời 4 Câu Hỏi Nhật Ký (Nguyên Văn Học Sinh Viết)</span>
              </h4>

              <div className="space-y-3">
                {JOURNAL_QUESTIONS.map(q => (
                  <div key={q.key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block text-xs">
                      {q.title}
                    </span>
                    <p className="text-slate-900 whitespace-pre-line leading-relaxed font-medium pl-1">
                      {selectedJournal[q.key] || <em className="text-slate-400">Không có nội dung.</em>}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SẢN PHẨM ĐẶC THÙ */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Sản Phẩm & Bằng Chứng Theo Vòng</span>
              </h4>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2 text-xs">
                {selectedJournal.round === 1 && (
                  <div className="space-y-1.5">
                    <p><strong>Nghề ban đầu:</strong> {selectedJournal.artifact_data?.initialCareer || 'Chưa ghi'}</p>
                    <p><strong>Mức tự tin khai báo:</strong> {selectedJournal.artifact_data?.confidenceScore ?? 'Chưa chọn'}/10</p>
                    <p><strong>Lý do chọn nghề:</strong> {selectedJournal.artifact_data?.reason || 'Chưa ghi'}</p>
                  </div>
                )}

                {selectedJournal.round === 2 && (
                  <div className="space-y-1.5">
                    <p><strong>Nhận định cần kiểm chứng:</strong> {selectedJournal.artifact_data?.claimToVerify || 'Chưa ghi'}</p>
                    <p><strong>Trích đoạn đối thoại AI Socrates:</strong></p>
                    <div className="bg-white p-3 rounded border font-mono text-[11px] whitespace-pre-line text-slate-800">
                      {selectedJournal.artifact_data?.conversationExcerpt || 'Không có trích đoạn đính kèm.'}
                    </div>
                  </div>
                )}

                {selectedJournal.round === 3 && (
                  <div className="space-y-2">
                    <p className="font-bold">Danh sách nguồn tài liệu đối chứng:</p>
                    {(selectedJournal.artifact_data?.sources || []).map((s, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="font-bold block text-slate-900">• {s.name || 'Nguồn tin'}</span>
                        <span className="text-[11px] text-indigo-700 block truncate">{s.url}</span>
                        <span className="text-[10px] text-slate-400">Truy cập ngày: {s.accessDate || 'Chưa rõ'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedJournal.round === 4 && (
                  <div className="space-y-1.5">
                    <p><strong>Ghi chép đúc kết từ Mentor:</strong></p>
                    <p className="whitespace-pre-line bg-white p-2.5 rounded border text-slate-800">{selectedJournal.artifact_data?.mentorNotes || 'Chưa có ghi chép.'}</p>
                    <p><strong>Nhiệm vụ nghề đã thử:</strong> {selectedJournal.artifact_data?.taskTrialSummary || 'Chưa thử'}</p>
                  </div>
                )}

                {selectedJournal.round === 5 && (
                  <div className="space-y-1.5">
                    <p><strong>Phương án mục tiêu (NV1):</strong> {selectedJournal.artifact_data?.primaryPlan || 'Chưa ghi'}</p>
                    <p><strong>Phương án dự phòng (Backup):</strong> {selectedJournal.artifact_data?.backupPlan || 'Chưa ghi'}</p>
                    <p><strong>Căn cứ giữ hoặc thay đổi:</strong> {selectedJournal.artifact_data?.decisionRationale || 'Chưa ghi'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* DANH SÁCH TỆP ĐÍNH KÈM */}
            {(selectedJournal.attachments && selectedJournal.attachments.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-teal-600" />
                  <span>Tệp Sản Phẩm Đính Kèm ({selectedJournal.attachments.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedJournal.attachments.map(att => (
                    <div key={att.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <span className="font-bold text-slate-800 block truncate">{att.fileName}</span>
                        <span className="text-[10px] text-slate-400">{(att.fileSize / 1024).toFixed(0)} KB</span>
                      </div>
                      {att.dataUrl && (
                        <a
                          href={att.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-teal-700 font-bold border border-slate-300 rounded text-xs flex items-center gap-1"
                        >
                          <span>Mở tệp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN NHẬN XÉT CỦA CỐ VẤN / GIÁO VIÊN */}
            <div className="pt-4 border-t-2 border-slate-100 space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wide text-purple-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Nhận Xét Riêng Của Cố Vấn / Giáo Viên (Mentor Feedback)</span>
              </h4>

              {/* Lịch sử nhận xét trước đây */}
              {(selectedJournal.journal_mentor_feedbacks && selectedJournal.journal_mentor_feedbacks.length > 0) && (
                <div className="space-y-2">
                  {selectedJournal.journal_mentor_feedbacks.map((fb, idx) => (
                    <div key={idx} className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-950 text-xs">
                      <div className="flex items-center justify-between font-bold text-[11px] text-purple-700 mb-1">
                        <span>{fb.mentor_name}</span>
                        <span>{fb.created_at ? new Date(fb.created_at).toLocaleString('vi-VN') : ''}</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{fb.feedback_text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Form gửi thêm nhận xét mới */}
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Nhập lời nhận xét, góp ý hoặc dặn dò riêng gửi đến học sinh này..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex items-center justify-between">
                  {feedbackMessage && (
                    <span className="text-xs font-bold text-emerald-700">{feedbackMessage}</span>
                  )}
                  <button
                    type="button"
                    disabled={feedbackSending || !feedbackInput.trim()}
                    onClick={handleSendFeedback}
                    className="ml-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{feedbackSending ? 'Đang gửi...' : 'Gửi Nhận Xét'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
