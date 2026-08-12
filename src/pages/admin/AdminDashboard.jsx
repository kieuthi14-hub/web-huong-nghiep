import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Danh sách dữ liệu học sinh mẫu minh chứng NCKH chuẩn hóa
const mockStudentAuditList = [
  {
    id: 'st-01',
    full_name: 'Nguyễn Văn An',
    email: 'an.nguyen@student.edu.vn',
    grade_level: 'Lớp 12',
    target_major: 'Khoa học Máy tính',
    bias_detected: 'Bẫy Tiếc Công Sức (Chi phí chìm)',
    decision: 'CONFIRMED',
    score: 85
  },
  {
    id: 'st-02',
    full_name: 'Trần Thị Bích',
    email: 'bich.tran@student.edu.vn',
    grade_level: 'Lớp 11',
    target_major: 'Digital Marketing',
    bias_detected: 'Bẫy Chọn Nghề Theo Phong Trào',
    decision: 'BACKUP',
    score: 88
  },
  {
    id: 'st-03',
    full_name: 'Lê Hoàng Nam',
    email: 'nam.le@student.edu.vn',
    grade_level: 'Lớp 12',
    target_major: 'Quản trị Kinh doanh',
    bias_detected: 'Bẫy Cảm Xúc (Thích từ nhỏ)',
    decision: 'CHANGED',
    score: 82
  },
  {
    id: 'st-04',
    full_name: 'Phạm Minh Đức',
    email: 'duc.pham@student.edu.vn',
    grade_level: 'Lớp 10',
    target_major: 'Khoa học Dữ liệu (Data Science)',
    bias_detected: 'Thoát Bẫy Tư Duy Thành Công',
    decision: 'CONFIRMED',
    score: 90
  },
  {
    id: 'st-05',
    full_name: 'Hoàng Khánh Linh',
    email: 'linh.hoang@student.edu.vn',
    grade_level: 'Lớp 12',
    target_major: 'Thiết kế Đồ họa UX/UI',
    bias_detected: 'Bẫy Chỉ Nhìn Mặt Màu Hồng',
    decision: 'BACKUP',
    score: 84
  }
]

const AdminDashboard = () => {
  const { user } = useAuth()
  
  // Dữ liệu thống kê
  const [stats, setStats] = useState({ 
    totalStudents: 128, 
    riskRecognizedPct: 84, 
    adjustedDecisionPct: 42, 
    topMajor: 'Khoa học Máy tính' 
  })
  
  const [debiasStats, setDebiasStats] = useState({ 
    success: 54, 
    sunkCost: 36, 
    bandwagon: 23, 
    emotional: 15, 
    total: 128 
  })
  
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    fetchRealStats()
  }, [user])

  const fetchRealStats = async () => {
    try {
      if (!user) return
      const { data: debiasList } = await supabase
        .from('metacognitive_matrix')
        .select('detected_bias, final_decision')

      if (debiasList && debiasList.length > 0) {
        let successCnt = 0
        let sunkCostCnt = 0
        let bandwagonCnt = 0
        let emotionalCnt = 0

        debiasList.forEach(item => {
          if (item.final_decision === 'BACKUP' || item.final_decision === 'CHANGED' || item.detected_bias === 'DEBIASED_SUCCESS') {
            successCnt++
          } else if (item.detected_bias === 'SUNK_COST_BIAS') {
            sunkCostCnt++
          } else if (item.detected_bias === 'BANDWAGON_BIAS') {
            bandwagonCnt++
          } else {
            emotionalCnt++
          }
        })

        const total = debiasList.length
        setDebiasStats({
          success: successCnt,
          sunkCost: sunkCostCnt,
          bandwagon: bandwagonCnt,
          emotional: emotionalCnt,
          total
        })

        const adjustedPct = Math.round((successCnt / total) * 100)
        setStats(prev => ({
          ...prev,
          totalStudents: total,
          adjustedDecisionPct: adjustedPct
        }))
      }
    } catch (err) {
      console.warn('Sử dụng dữ liệu mẫu cho Admin Dashboard:', err)
    }
  }

  // Hàm xuất dữ liệu Excel / CSV thuần
  const handleExportCSV = () => {
    try {
      const headers = ['ID,Ho va ten,Email,Khoi lop,Nganh muc tiêu,Bay tu duy chan doan,Quyet dinh sau phan tu,Diem phan tu\n']
      const rows = mockStudentAuditList.map(st => 
        `"${st.id}","${st.full_name}","${st.email}","${st.grade_level}","${st.target_major}","${st.bias_detected}","${st.decision}",${st.score}`
      ).join('\n')

      const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Bao_Cao_Nghien_Cuu_Phan_Tu_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setToastMessage('Đã xuất file báo cáo dữ liệu CSV/Excel thành công!')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      console.error('Lỗi xuất CSV:', err)
    }
  }

  const successPct = Math.round((debiasStats.success / (debiasStats.total || 1)) * 100)
  const sunkCostPct = Math.round((debiasStats.sunkCost / (debiasStats.total || 1)) * 100)
  const bandwagonPct = Math.round((debiasStats.bandwagon / (debiasStats.total || 1)) * 100)
  const emotionalPct = Math.round((debiasStats.emotional / (debiasStats.total || 1)) * 100)

  const renderDecisionTag = (decision) => {
    switch (decision) {
      case 'BACKUP':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">🟡 NV Dự phòng</span>
      case 'CHANGED':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 rounded-sm">🔴 Đã Hủy Ngành</span>
      case 'CONFIRMED':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm">🟢 NV Chính</span>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-reveal font-sans">
      {/* Header Trang Admin */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>⚙️</span> Bảng Quản Trị & Báo Cáo NCKH Admin
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Hệ thống giám sát chỉ số tư duy phản tư, chẩn đoán 4 Bẫy Tư Duy Chọn Nghề của học sinh toàn trường và xuất dữ liệu minh chứng.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto border border-amber-400"
          >
            <span>📊</span>
            <span>XUẤT DỮ LIỆU EXCEL / CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Chỉ Số NCKH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-sm border border-blue-100 flex items-center justify-center text-xl font-bold">
            👥
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học sinh Tham Gia</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{stats.totalStudents} HS</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-sm border border-amber-100 flex items-center justify-center text-xl font-bold">
            🎯
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% Nhận Diện Rủi Ro</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{stats.riskRecognizedPct}%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100 flex items-center justify-center text-xl font-bold">
            🎉
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% Điều Chỉnh NV Tỉnh Táo</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.adjustedDecisionPct}%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-sm border border-indigo-100 flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Ngành Quan Tâm</p>
            <p className="text-xs font-black text-indigo-700 mt-1 leading-snug">{stats.topMajor}</p>
          </div>
        </div>
      </div>

      {/* Biểu Đồ Phân Tích 4 Bẫy Tư Duy Chọn Nghề (Thuần HTML / Progress Bar) */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Báo cáo Phân Tích 4 Bẫy Tư Duy Chọn Nghề (Nghiên cứu Khoa học)
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-sm uppercase">
            Cập nhật thời gian thực
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Card 1: Thoát Bẫy Thành Công */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">🎉 Thoát Bẫy Thành Công</span>
              <span className="text-sm font-black text-emerald-900">{successPct}%</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-semibold">{debiasStats.success} lượt điều chỉnh nguyện vọng tỉnh táo</p>
            <div className="w-full bg-emerald-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-sm transition-all duration-500" style={{ width: `${successPct}%` }} />
            </div>
          </div>

          {/* Card 2: Bẫy Tiếc Công Sức */}
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">⚠️ Bẫy Tiếc Công Sức</span>
              <span className="text-sm font-black text-amber-900">{sunkCostPct}%</span>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold">{debiasStats.sunkCost} lượt tiếc công sức đã ôn tập</p>
            <div className="w-full bg-amber-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-amber-500 h-full rounded-sm transition-all duration-500" style={{ width: `${sunkCostPct}%` }} />
            </div>
          </div>

          {/* Card 3: Bẫy Đám Đông */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">⚠️ Bẫy Chọn Theo Đám Đông</span>
              <span className="text-sm font-black text-blue-900">{bandwagonPct}%</span>
            </div>
            <p className="text-[11px] text-blue-800 font-semibold">{debiasStats.bandwagon} lượt bị ảnh hưởng bởi MXH/bạn bè</p>
            <div className="w-full bg-blue-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-blue-600 h-full rounded-sm transition-all duration-500" style={{ width: `${bandwagonPct}%` }} />
            </div>
          </div>

          {/* Card 4: Bẫy Cảm Xúc Từ Nhỏ */}
          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950">⚠️ Bẫy Cảm Xúc Từ Nhỏ</span>
              <span className="text-sm font-black text-rose-900">{emotionalPct}%</span>
            </div>
            <p className="text-[11px] text-rose-800 font-semibold">{debiasStats.emotional} lượt chọn theo hình mẫu quá khứ</p>
            <div className="w-full bg-rose-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-rose-600 h-full rounded-sm transition-all duration-500" style={{ width: `${emotionalPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Học Sinh Giám Sát Phản Tư (Audit Log Table) */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📋</span>
            <span>Bảng Giám Sát Kiểm Toán Tư Duy Phản Tư Học Sinh (Audit Log)</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-500">Hiển thị mẫu 5 bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Họ và tên Học sinh</th>
                <th className="py-3 px-4">Khối lớp</th>
                <th className="py-3 px-4">Ngành dự định</th>
                <th className="py-3 px-4">Bẫy Tư duy Chẩn đoán</th>
                <th className="py-3 px-4 text-center">Chỉ số Phản tư</th>
                <th className="py-3 px-4 text-center">Quyết định sau Phản tư</th>
              </tr>
            </thead>
            <tbody>
              {mockStudentAuditList.map((st) => (
                <tr key={st.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div>{st.full_name}</div>
                    <div className="text-[10px] font-medium text-slate-400">{st.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">{st.grade_level}</td>
                  <td className="py-3.5 px-4 font-bold text-brand-600">{st.target_major}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-sm text-[11px]">
                      {st.bias_detected}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                    {st.score}/100
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderDecisionTag(st.decision)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-sm shadow-lg border border-slate-700 animate-reveal">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
