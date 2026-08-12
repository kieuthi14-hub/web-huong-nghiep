import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Toast from '../../components/common/Toast'
import { 
  Brain, 
  UserCheck, 
  Search, 
  AlertTriangle, 
  HelpCircle, 
  Save, 
  Sparkles,
  History,
  Trash2,
  MessageSquareCode,
  Lightbulb,
  Target
} from 'lucide-react'

// Thuật toán Chẩn đoán Bẫy Tư Duy Chọn Nghề Tự Động
const getBiasDiagnosis = (matrix) => {
  const { risk_analysis, verified_sources, final_decision, bias_check } = matrix

  const textBiasCheck = (bias_check || '').toLowerCase()
  const textSources = (verified_sources || '').toLowerCase()
  const textRisk = (risk_analysis || '').toLowerCase()

  // TH 0: Học sinh chủ động chuyển thành Dự phòng hoặc Hủy ngành -> Thoát bẫy thành công
  if (final_decision === 'BACKUP' || final_decision === 'CHANGED') {
    return {
      type: 'DEBIASED_SUCCESS',
      icon: '🎉',
      badge: 'THOÁT BẪY TƯ DUY THÀNH CÔNG',
      title: '🎉 TUYỆT VỜI! BẠN ĐÃ THOÁT BẪY TƯ DUY THÀNH CÔNG',
      message: 'Việc dũng cảm nhìn vào thực tế để điều chỉnh nguyện vọng chính là biểu hiện của Tư duy Phản tư trưởng thành.',
      cardStyle: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      badgeStyle: 'bg-emerald-200 text-emerald-900 border-emerald-300',
      aiHighlight: 'Bạn đã tỉnh táo điều chỉnh nguyện vọng dựa trên phân tích thực tế thay vì cố bám trụ cảm xúc ban đầu.',
      aiWarning: 'Nhận diện rủi ro rất thực tế. Hãy duy trì sự chủ động này khi sắp xếp thứ tự nguyện vọng chính thức.'
    }
  }

  // BẪY 1: BẪY CẢM XÚC & CỐ ĐỊNH TƯ DUY (Thích từ bé)
  const emotionalKeywords = ["thích từ nhỏ", "đam mê", "ước mơ", "từ bé", "thích từ lâu", "sở thích", "thích"]
  const hasEmotionalBias = emotionalKeywords.some(kw => textBiasCheck.includes(kw))

  if (hasEmotionalBias) {
    return {
      type: 'EMOTIONAL_BIAS',
      icon: '⚠️',
      badge: 'BẪY CẢM XÚC & CỐ ĐỊNH TƯ DUY',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY CẢM XÚC & CỐ ĐỊNH TƯ DUY (THÍCH TỪ BÉ)',
      message: 'Bạn đang chọn nghề dựa vào cảm xúc quen thuộc từ quá khứ. Yêu thích là tốt, nhưng hãy đối chiếu xem ngành này hiện tại có thay đổi hoặc bị AI ảnh hưởng so với hình dung ngày nhỏ của bạn không nhé!',
      cardStyle: 'bg-amber-50 border-amber-300 text-amber-950',
      badgeStyle: 'bg-amber-200 text-amber-900 border-amber-300',
      aiHighlight: 'Bạn có đam mê cá nhân rõ ràng và kiên định với ước mơ ban đầu.',
      aiWarning: 'Đam mê cần gắn liền với năng lực thực tế và bối cảnh thị trường tuyển dụng hiện đại.'
    }
  }

  // BẪY 2: BẪY CHỌN NGHỀ THEO PHONG TRÀO / ĐÁM ĐÔNG
  const bandwagonKeywords = ["bạn bè", "mạng xã hội", "tiktok", "facebook", "nghe đồn", "hot trend", "nhiều người theo", "xu hướng"]
  const hasBandwagonBias = bandwagonKeywords.some(kw => textBiasCheck.includes(kw) || textSources.includes(kw)) || textSources.trim().length < 30

  if (hasBandwagonBias) {
    return {
      type: 'BANDWAGON_BIAS',
      icon: '⚠️',
      badge: 'BẪY PHONG TRÀO / ĐÁM ĐÔNG',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY CHỌN NGHỀ THEO PHONG TRÀO / ĐÁM ĐÔNG',
      message: 'Quyết định của bạn đang bị ảnh hưởng bởi tâm lý đám đông hoặc truyền thông. Hãy tập trung vào năng lực và điểm số thực tế của chính bạn!',
      cardStyle: 'bg-blue-50 border-blue-300 text-blue-950',
      badgeStyle: 'bg-blue-200 text-blue-900 border-blue-300',
      aiHighlight: 'Bạn đã nắm bắt được các ngành học đang nhận được nhiều sự quan tâm của thị trường.',
      aiWarning: 'Cần bổ sung nguồn đối chứng chính thống từ Bộ GD&ĐT thay vì tin vào video mạng xã hội.'
    }
  }

  // BẪY 3: BẪY CHỈ NHÌN MẶT MÀU HỒNG
  const isRiskTooShort = textRisk.trim().length < 15
  const optimismKeywords = ["không có", "không rủi ro", "hoàn hảo", "lương cao", "không"]
  const hasOptimismBias = isRiskTooShort || (optimismKeywords.some(kw => textRisk.includes(kw)) && textRisk.trim().length < 25)

  if (hasOptimismBias) {
    return {
      type: 'OPTIMISM_BIAS',
      icon: '⚠️',
      badge: 'BẪY CHỈ NHÌN MẶT MÀU HỒNG',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY CHỈ NHÌN MẶT MÀU HỒNG (PHỚT LỜ RỦI RO)',
      message: 'Không có ngành nghề nào hoàn hảo. Việc phớt lờ rủi ro sẽ khiến bạn dễ bị sốc thực tế khi bước vào Đại học. Hãy tìm hiểu kỹ mặt tối và thách thức thực tế của ngành!',
      cardStyle: 'bg-rose-50 border-rose-300 text-rose-950',
      badgeStyle: 'bg-rose-200 text-rose-900 border-rose-300',
      aiHighlight: 'Bạn có tinh thần tích cực và kỳ vọng lớn vào tương lai sự nghiệp.',
      aiWarning: 'Mọi ngành học đều có áp lực riêng (tỷ lệ đào thải, sự thay đổi công nghệ). Hãy chủ động nhận diện rủi ro.'
    }
  }

  // BẪY 4: BẪY TIẾC CÔNG SỨC / CHI PHÍ CHÌM
  const sunkCostKeywords = ["lỡ học", "đã ôn", "tiếc", "theo từ lâu"]
  const hasSunkCostKeywords = sunkCostKeywords.some(kw => textBiasCheck.includes(kw))
  const isSunkCostBias = (final_decision === 'CONFIRMED' && textRisk.length > 30) || hasSunkCostKeywords

  if (isSunkCostBias) {
    return {
      type: 'SUNK_COST_BIAS',
      icon: '⚠️',
      badge: 'BẪY TIẾC CÔNG SỨC (CHI PHÍ CHÌM)',
      title: '⚠️ BẠN CÓ THỂ ĐANG MẮC BẪY TIẾC CÔNG SỨC (CHI PHÍ CHÌM)',
      message: 'Có thể bạn đang cố bám trụ ngành này chỉ vì tiếc thời gian/công sức đã lỡ đầu tư ôn tập. Hãy dũng cảm điều chỉnh nếu ngành không còn thực sự phù hợp!',
      cardStyle: 'bg-amber-50 border-amber-300 text-amber-950',
      badgeStyle: 'bg-amber-200 text-amber-900 border-amber-300',
      aiHighlight: 'Bạn đã liệt kê rủi ro rất trung thực và nhận diện rõ độ khó của ngành.',
      aiWarning: 'Nên cân nhắc đưa ngành này xuống làm Nguyện vọng Dự phòng để giảm thiểu rủi ro trúng tuyển.'
    }
  }

  return {
    type: 'BALANCED',
    icon: '🟢',
    badge: 'TƯ DUY PHẢN TƯ CÂN BẰNG',
    title: '🟢 TƯ DUY PHẢN TƯ CÂN BẰNG',
    message: 'Bạn đã phân tích toàn diện giữa năng lực thực tế, rủi ro nghề nghiệp và nguồn đối chứng chính thống.',
    cardStyle: 'bg-slate-50 border-slate-200 text-slate-800',
    badgeStyle: 'bg-slate-200 text-slate-800 border-slate-300',
    aiHighlight: 'Bạn đã cân bằng tốt giữa đam mê và năng lực thực tế.',
    aiWarning: 'Tiếp tục duy trì góc nhìn đa chiều trước khi chốt danh sách nguyện vọng cuối cùng.'
  }
}

const DebiasMatrix = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const majorParam = searchParams.get('major')
  
  const [targetMajor, setTargetMajor] = useState('')
  const [evidence, setEvidence] = useState('')
  const [verifiedSources, setVerifiedSources] = useState('')
  const [riskAnalysis, setRiskAnalysis] = useState('')
  const [biasCheck, setBiasCheck] = useState('')
  
  // Trạng thái Quyết định sau Phản tư: 'CONFIRMED' | 'BACKUP' | 'CHANGED'
  const [finalDecision, setFinalDecision] = useState('CONFIRMED')

  const [savedMatrices, setSavedMatrices] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (majorParam) {
      setTargetMajor(majorParam)
    }
  }, [majorParam])

  useEffect(() => {
    fetchMatrices()
  }, [user])

  const fetchMatrices = async () => {
    if (!user) return
    setIsLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('metacognitive_matrix')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSavedMatrices(data)
      } else {
        const localData = localStorage.getItem(`debias_matrix_${user.id}`)
        if (localData) setSavedMatrices(JSON.parse(localData))
      }
    } catch (error) {
      console.warn('Tải ma trận phản tư từ LocalStorage:', error)
      const localData = localStorage.getItem(`debias_matrix_${user.id}`)
      if (localData) setSavedMatrices(JSON.parse(localData))
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    // 1. Validation nhập liệu
    if (!targetMajor.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng nhập Tên ngành học bạn đang dự định chọn!' })
      return
    }
    if (!evidence.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 1: Năng lực & Bằng chứng thực tế!' })
      return
    }
    if (!verifiedSources.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 2: Dữ liệu đối chứng chính thống!' })
      return
    }
    if (!riskAnalysis.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 3: Phân tích Rủi ro & Mặt tối!' })
      return
    }
    if (!biasCheck.trim()) {
      setToast({ type: 'warning', message: 'Vui lòng điền Ô 4: Kiểm tra Bẫy Tư Duy!' })
      return
    }

    setIsSubmitting(true)

    // Chẩn đoán Bẫy Tư Duy
    const biasDiagnosis = getBiasDiagnosis({
      risk_analysis: riskAnalysis,
      verified_sources: verifiedSources,
      final_decision: finalDecision,
      bias_check: biasCheck
    })

    try {
      // 2. Lưu trực tiếp vào Supabase Database
      if (user) {
        const { data, error } = await supabase
          .from('metacognitive_matrix')
          .insert({
            student_id: user.id,
            target_major: targetMajor,
            evidence,
            verified_sources: verifiedSources,
            risk_analysis: riskAnalysis,
            bias_check: biasCheck,
            final_decision: finalDecision,
            detected_bias: biasDiagnosis.type
          })
          .select()
          .maybeSingle()

        if (error) {
          console.error('Lỗi Insert Supabase DB:', error)
        } else if (data) {
          setSavedMatrices(prev => [data, ...prev])
        }
      }

      // Reset form
      setTargetMajor('')
      setEvidence('')
      setVerifiedSources('')
      setRiskAnalysis('')
      setBiasCheck('')
      setFinalDecision('CONFIRMED')

      setToast({ 
        type: 'success', 
        message: 'Lưu bài làm Phản tư & Đồng bộ dữ liệu thành công!' 
      })
    } catch (error) {
      console.error('Lỗi khi lưu bảng phản tư:', error)
      setToast({ type: 'error', message: 'Không thể lưu bảng phản tư.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      if (user) {
        await supabase
          .from('metacognitive_matrix')
          .delete()
          .eq('id', id)
      }
    } catch (err) {
      console.warn('Lỗi xóa Supabase:', err)
    }

    const nextList = savedMatrices.filter(m => m.id !== id)
    setSavedMatrices(nextList)
    setToast({ type: 'info', message: 'Đã xóa bản ghi.' })
  }

  const calculateMetacognitiveScore = (matrix) => {
    const totalLength = (matrix.evidence?.length || 0) + 
                        (matrix.verified_sources?.length || 0) + 
                        (matrix.risk_analysis?.length || 0) + 
                        (matrix.bias_check?.length || 0)
    
    if (totalLength > 300) return 88
    if (totalLength > 150) return 85
    return 82
  }

  const renderDecisionBadge = (decision) => {
    switch (decision) {
      case 'BACKUP':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm inline-flex items-center gap-1">
            🟡 Chuyển thành Nguyện vọng Dự phòng
          </span>
        )
      case 'CHANGED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-sm inline-flex items-center gap-1">
            🔴 Đã hủy chọn & Tìm ngành khác
          </span>
        )
      case 'CONFIRMED':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm inline-flex items-center gap-1">
            🟢 Giữ nguyên làm Nguyện vọng chính
          </span>
        )
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-reveal">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-sm text-brand-600">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              🧠 Bảng Nhìn Lại & Kiểm Tra Chọn Nghề (Phản tư)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Công cụ kích hoạt tư duy nhìn lại giúp bạn nhận diện rủi ro, kiểm chứng thông tin và vượt qua các Bẫy Tư Duy Chọn Nghề trước khi ra quyết định.
            </p>
          </div>
        </div>

        {/* Banner giải thích bình dị */}
        <div className="bg-blue-50/80 border border-blue-200 text-blue-950 p-3.5 rounded-sm flex items-start gap-3 shadow-2xs font-semibold text-xs leading-relaxed">
          <div className="p-1 bg-blue-500 text-white rounded-sm flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-blue-900">💡 Phản tư đơn giản là gì?</span> Là việc bạn dành 2 phút "soi" lại xem mình chọn nghề này vì <span className="font-bold uppercase text-blue-900 underline">NĂNG LỰC THỰC TẾ</span> hay chỉ vì cảm xúc nhất thời & xem video mạng xã hội!
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Khung nhập Tên Ngành học */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-2 shadow-sm">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tên Ngành Học Dự Định Chọn
          </label>
          <input
            type="text"
            placeholder="Nhập tên ngành học em đang dự định chọn (Ví dụ: Khoa học máy tính, Marketing...)"
            value={targetMajor}
            onChange={(e) => setTargetMajor(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none rounded-sm font-bold text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Bảng Ma Trận 4 Ô (Grid 2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ô 1: Màu xanh dương */}
          <div className="bg-blue-50/40 border border-blue-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-blue-900 border-b border-blue-100 pb-2.5">
              <div className="p-1.5 bg-blue-500 text-white rounded-sm">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                1. Năng lực & Bằng chứng thực tế
              </h3>
            </div>
            <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
              Liệt kê ít nhất 2 điểm số, kỹ năng hoặc trải nghiệm thực tế chứng minh em phù hợp với ngành này.
            </p>
            <textarea
              rows={4}
              placeholder="VD: Điểm học bạ Toán - Lý đều trên 8.5; đã tự học xây dựng website cá nhân bằng HTML/CSS..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-blue-200 focus:border-blue-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>

          {/* Ô 2: Màu tím */}
          <div className="bg-indigo-50/40 border border-indigo-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-900 border-b border-indigo-100 pb-2.5">
              <div className="p-1.5 bg-indigo-500 text-white rounded-sm">
                <Search className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                2. Dữ liệu đối chứng chính thống
              </h3>
            </div>
            <p className="text-[11px] text-indigo-700 font-semibold leading-relaxed">
              Nhập nguồn thông tin/báo cáo thị trường em đã tham khảo (tránh thông tin đơn chiều từ mạng xã hội).
            </p>
            <textarea
              rows={4}
              placeholder="VD: Báo cáo nhu cầu nhân lực của VietnamWorks 2024; Đã đọc chuẩn đầu ra và lộ trình đào tạo trên website chính thức của Đại học..."
              value={verifiedSources}
              onChange={(e) => setVerifiedSources(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>

          {/* Ô 3: Màu cam */}
          <div className="bg-amber-50/40 border border-amber-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-amber-900 border-b border-amber-100 pb-2.5">
              <div className="p-1.5 bg-amber-500 text-white rounded-sm">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                3. Phân tích Rủi ro & Mặt tối
              </h3>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              Liệt kê 2 thách thức, áp lực hoặc nguy cơ (như bị AI thay thế, tỷ lệ đào thải) mà em sẵn sàng chấp nhận.
            </p>
            <textarea
              rows={4}
              placeholder="VD: Áp lực OT cập nhật kiến thức công nghệ liên tục; Nguy cơ lập trình viên cấp thấp bị trí tuệ nhân tạo (AI) thay thế trong 5 năm tới..."
              value={riskAnalysis}
              onChange={(e) => setRiskAnalysis(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-amber-200 focus:border-amber-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>

          {/* Ô 4: Màu đỏ/hồng */}
          <div className="bg-rose-50/40 border border-rose-200 p-5 rounded-sm space-y-3">
            <div className="flex items-center gap-2.5 text-rose-900 border-b border-rose-100 pb-2.5">
              <div className="p-1.5 bg-rose-500 text-white rounded-sm">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                4. Kiểm tra Bẫy Tư Duy
              </h3>
            </div>
            <p className="text-[11px] text-rose-800 font-semibold leading-relaxed">
              Quyết định chọn ngành này của em có đang bị ảnh hưởng bởi bẫy cảm xúc thích từ bé hay phong trào mạng xã hội không? Vì sao?
            </p>
            <textarea
              rows={4}
              placeholder="VD: Em thích từ nhỏ nhưng sau khi đối chứng tài năng thì thấy bản thân thực sự hợp với kỹ thuật thực tế hơn là hình dung mơ ước..."
              value={biasCheck}
              onChange={(e) => setBiasCheck(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-rose-200 focus:border-rose-500 focus:outline-none rounded-sm font-medium text-slate-700 leading-relaxed"
            />
          </div>
        </div>

        {/* Khung XÁC NHẬN QUYẾT ĐỊNH SAU PHẢN TƯ */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-3 shadow-sm">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-600" />
            🎯 Sau khi đối chứng rủi ro & bằng chứng ở 4 ô trên, quyết định của bạn là gì?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setFinalDecision('CONFIRMED')}
              className={`p-3.5 border rounded-sm text-left transition-all flex items-start gap-2.5 ${
                finalDecision === 'CONFIRMED'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200 font-bold shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span className="text-base leading-none">🟢</span>
              <div>
                <p className="text-xs font-bold leading-snug">Giữ nguyên quyết định</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">(Nguyện vọng chính)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFinalDecision('BACKUP')}
              className={`p-3.5 border rounded-sm text-left transition-all flex items-start gap-2.5 ${
                finalDecision === 'BACKUP'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-200 font-bold shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span className="text-base leading-none">🟡</span>
              <div>
                <p className="text-xs font-bold leading-snug">Chuyển thành Dự phòng</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">(Nguyện vọng dự bị)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFinalDecision('CHANGED')}
              className={`p-3.5 border rounded-sm text-left transition-all flex items-start gap-2.5 ${
                finalDecision === 'CHANGED'
                  ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-200 font-bold shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span className="text-base leading-none">🔴</span>
              <div>
                <p className="text-xs font-bold leading-snug">Hủy chọn ngành này</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">(Tìm ngành học khác)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Nút bấm Lưu & Khởi tạo Bảng Nhìn Lại */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="accent"
            isLoading={isSubmitting}
            className="w-full md:w-auto font-bold text-xs uppercase tracking-wider py-3.5 px-8 gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            Lưu & Khởi tạo Bảng Nhìn Lại
          </Button>
        </div>
      </form>

      {/* Lịch sử các Bảng Nhìn Lại đã tạo */}
      {savedMatrices.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-brand-600" />
            Các Bảng Nhìn Lại Đã Khởi Tạo ({savedMatrices.length})
          </h2>

          <div className="space-y-6">
            {savedMatrices.map((matrix) => {
              const score = calculateMetacognitiveScore(matrix)
              const biasDiagnosis = getBiasDiagnosis(matrix)

              return (
                <div 
                  key={matrix.id} 
                  className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-sm">
                          Ngành mục tiêu
                        </span>
                        <h3 className="text-base font-bold text-slate-800 mt-1">{matrix.target_major}</h3>
                      </div>
                      {renderDecisionBadge(matrix.final_decision)}
                    </div>
                    <button
                      onClick={() => handleDelete(matrix.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors self-start md:self-auto"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-sm space-y-1">
                      <p className="font-bold text-blue-900 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> 1. Bằng chứng thực tế:
                      </p>
                      <p className="text-slate-700 leading-relaxed">{matrix.evidence}</p>
                    </div>

                    <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-sm space-y-1">
                      <p className="font-bold text-indigo-900 flex items-center gap-1">
                        <Search className="w-3.5 h-3.5" /> 2. Nguồn chính thống:
                      </p>
                      <p className="text-slate-700 leading-relaxed">{matrix.verified_sources}</p>
                    </div>

                    <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-sm space-y-1">
                      <p className="font-bold text-amber-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 3. Rủi ro & Thách thức:
                      </p>
                      <p className="text-slate-700 leading-relaxed">{matrix.risk_analysis}</p>
                    </div>

                    <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-sm space-y-1">
                      <p className="font-bold text-rose-900 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> 4. Kiểm tra bẫy tư duy:
                      </p>
                      <p className="text-slate-700 leading-relaxed">{matrix.bias_check}</p>
                    </div>
                  </div>

                  {/* THẺ PHẢN HỒI CHẨN ĐOÁN BẪY TƯ DUY TỰ ĐỘNG */}
                  <div className={`p-4 rounded-sm border space-y-2 leading-relaxed shadow-2xs ${biasDiagnosis.cardStyle}`}>
                    <div className="flex items-center justify-between border-b border-current/20 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span>{biasDiagnosis.icon}</span>
                        <span>{biasDiagnosis.title}</span>
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-sm border uppercase ${biasDiagnosis.badgeStyle}`}>
                        {biasDiagnosis.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{biasDiagnosis.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default DebiasMatrix
