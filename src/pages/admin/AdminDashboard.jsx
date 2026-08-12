import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  
  // Dữ liệu thực tế từ Supabase DB
  const [students, setStudents] = useState([])
  const [matrices, setMatrices] = useState([])
  
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalReflections: 0, 
    debiasedSuccessPct: 0, 
    topMajor: 'Chưa có' 
  })
  
  const [debiasStats, setDebiasStats] = useState({ 
    success: 0, 
    sunkCost: 0, 
    bandwagon: 0, 
    emotional: 0, 
    total: 0 
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    fetchRealSupabaseData()
  }, [user])

  const fetchRealSupabaseData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      // 1. Truy vấn danh sách Học sinh từ bảng profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // 2. Truy vấn danh sách Bài làm Phản tư kết hợp Profile học sinh
      const { data: matrixData, error: matrixErr } = await supabase
        .from('metacognitive_matrix')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })

      if (matrixErr) {
        console.warn('Lỗi lấy metacognitive_matrix kèm profiles:', matrixErr)
      }

      const realProfiles = profileData || []
      const realMatrices = matrixData || []

      setStudents(realProfiles)
      setMatrices(realMatrices)

      // 3. Phân tích thống kê thực tế
      let successCnt = 0
      let sunkCostCnt = 0
      let bandwagonCnt = 0
      let emotionalCnt = 0
      const majorFrequency = {}

      realMatrices.forEach(item => {
        if (item.target_major) {
          const majorTrimmed = item.target_major.trim()
          majorFrequency[majorTrimmed] = (majorFrequency[majorTrimmed] || 0) + 1
        }

        if (item.final_decision === 'BACKUP' || item.final_decision === 'CHANGED' || item.detected_bias === 'DEBIASED_SUCCESS') {
          successCnt++
        } else if (item.detected_bias === 'SUNK_COST_BIAS') {
          sunkCostCnt++
        } else if (item.detected_bias === 'BANDWAGON_BIAS') {
          bandwagonCnt++
        } else if (item.detected_bias === 'EMOTIONAL_BIAS') {
          emotionalCnt++
        } else {
          successCnt++
        }
      })

      let topMajorName = 'Chưa có'
      let maxFreq = 0
      Object.keys(majorFrequency).forEach(mName => {
        if (majorFrequency[mName] > maxFreq) {
          maxFreq = majorFrequency[mName]
          topMajorName = mName
        }
      })

      const totalM = realMatrices.length
      const debiasedPct = totalM > 0 ? Math.round((successCnt / totalM) * 100) : 0

      setDebiasStats({
        success: successCnt,
        sunkCost: sunkCostCnt,
        bandwagon: bandwagonCnt,
        emotional: emotionalCnt,
        total: totalM
      })

      setStats({
        totalStudents: realProfiles.length,
        totalReflections: totalM,
        debiasedSuccessPct: debiasedPct,
        topMajor: topMajorName
      })

      if (isManualRefresh) {
        setToastMessage('Đã làm mới dữ liệu thực tế từ Supabase CSDL!')
        setTimeout(() => setToastMessage(null), 3000)
      }

    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực tế Supabase:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Hàm xuất dữ liệu Excel / CSV Thực Tế
  const handleExportCSV = () => {
    try {
      if (matrices.length === 0) {
        setToastMessage('Chưa có dữ liệu Phản tư thực tế để xuất file.')
        setTimeout(() => setToastMessage(null), 3000)
        return
      }

      const headers = ['STT,Học sinh,Khối lớp,Ngành mục tiêu,Bẫy tư duy chẩn đoán,Quyết định sau phản tư,Ngày tạo\n']
      const rows = matrices.map((m, idx) => {
        const studentName = m.profiles?.full_name || 'Học sinh'
        const grade = m.profiles?.grade_level || 'Chưa rõ'
        return `"${idx + 1}","${studentName}","${grade}","${m.target_major || ''}","${m.detected_bias || 'NONE'}","${m.final_decision || 'CONFIRMED'}","${new Date(m.created_at).toLocaleDateString('vi-VN')}"`
      }).join('\n')

      const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Bao_Cao_Phan_Tu_Thuc_Te_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setToastMessage('Đã xuất file báo cáo dữ liệu thực tế CSV/Excel thành công!')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      console.error('Lỗi xuất CSV:', err)
    }
  }

  const formatBiasLabel = (biasType) => {
    switch (biasType) {
      case 'EMOTIONAL_BIAS':
        return 'Bẫy Cảm Xúc (Thích từ nhỏ)'
      case 'BANDWAGON_BIAS':
        return 'Bẫy Chọn Nghề Theo Đám Đông'
      case 'OPTIMISM_BIAS':
        return 'Bẫy Chỉ Nhìn Mặt Màu Hồng'
      case 'SUNK_COST_BIAS':
        return 'Bẫy Tiếc Công Sức (Chi phí chìm)'
      case 'DEBIASED_SUCCESS':
      default:
        return 'Thoát Bẫy Tư Duy Thành Công'
    }
  }

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

  const successPct = debiasStats.total > 0 ? Math.round((debiasStats.success / debiasStats.total) * 100) : 0
  const sunkCostPct = debiasStats.total > 0 ? Math.round((debiasStats.sunkCost / debiasStats.total) * 100) : 0
  const bandwagonPct = debiasStats.total > 0 ? Math.round((debiasStats.bandwagon / debiasStats.total) * 100) : 0
  const emotionalPct = debiasStats.total > 0 ? Math.round((debiasStats.emotional / debiasStats.total) * 100) : 0

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-8 bg-slate-200 w-64 rounded-sm"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
          <div className="h-20 bg-slate-200 rounded-sm"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-sm"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-reveal font-sans">
      {/* Header Trang Admin */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>⚙️</span> Bảng Quản Trị & Báo Cáo Thực Tế (Supabase DB)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Hệ thống kết nối trực tiếp CSDL Supabase để tổng hợp lịch sử bài làm Phản tư, chẩn đoán Bẫy Tư duy và dữ liệu đăng ký thực tế.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Nút Làm mới Dữ liệu */}
            <button
              type="button"
              onClick={() => fetchRealSupabaseData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              <span>Làm mới</span>
            </button>

            {/* Nút Xuất CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-amber-400"
            >
              <span>📊</span>
              <span>XUẤT DỮ LIỆU EXCEL / CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Thực Tế Từ DB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-sm border border-blue-100 flex items-center justify-center text-xl font-bold">
            👥
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học sinh Đã Đăng Ký</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{stats.totalStudents} HS</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-sm border border-indigo-100 flex items-center justify-center text-xl font-bold">
            🧠
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài Phản Tư Đã Khởi Tạo</p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">{stats.totalReflections} Bài</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100 flex items-center justify-center text-xl font-bold">
            🎉
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% Thoát Bẫy Thành Công</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.debiasedSuccessPct}%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-sm border border-amber-100 flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Ngành Được Chọn</p>
            <p className="text-xs font-black text-amber-700 mt-1 leading-snug truncate max-w-[120px]">{stats.topMajor}</p>
          </div>
        </div>
      </div>

      {/* Biểu Đồ Thống Kê 4 Bẫy Tư Duy Chọn Nghề Thực Tế */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Phân Tích Bẫy Tư Duy Thực Tế từ Supabase Database ({debiasStats.total} lượt)
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm uppercase">
            Supabase Live Data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">🎉 Thoát Bẫy Thành Công</span>
              <span className="text-sm font-black text-emerald-900">{successPct}%</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-semibold">{debiasStats.success} lượt điều chỉnh NV tỉnh táo</p>
            <div className="w-full bg-emerald-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-sm transition-all duration-500" style={{ width: `${successPct}%` }} />
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">⚠️ Bẫy Tiếc Công Sức</span>
              <span className="text-sm font-black text-amber-900">{sunkCostPct}%</span>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold">{debiasStats.sunkCost} lượt tiếc công sức đã học</p>
            <div className="w-full bg-amber-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-amber-500 h-full rounded-sm transition-all duration-500" style={{ width: `${sunkCostPct}%` }} />
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">⚠️ Bẫy Theo Đám Đông</span>
              <span className="text-sm font-black text-blue-900">{bandwagonPct}%</span>
            </div>
            <p className="text-[11px] text-blue-800 font-semibold">{debiasStats.bandwagon} lượt bị ảnh hưởng MXH/bạn bè</p>
            <div className="w-full bg-blue-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-blue-600 h-full rounded-sm transition-all duration-500" style={{ width: `${bandwagonPct}%` }} />
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950">⚠️ Bẫy Cảm Xúc Từ Nhỏ</span>
              <span className="text-sm font-black text-rose-900">{emotionalPct}%</span>
            </div>
            <p className="text-[11px] text-rose-800 font-semibold">{debiasStats.emotional} lượt chọn theo hình mẫu cũ</p>
            <div className="w-full bg-rose-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-rose-600 h-full rounded-sm transition-all duration-500" style={{ width: `${emotionalPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Dữ Liệu Phản Tư Thực Tế từ CSDL */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📋</span>
            <span>Danh Sách Bài Phản Tư Thực Tế Từ CSDL ({matrices.length} bản ghi)</span>
          </h3>
          <span className="text-[11px] font-bold text-brand-600">Dữ liệu từ Supabase Matrix</span>
        </div>

        {matrices.length === 0 ? (
          <div className="p-8 text-center bg-blue-50/60 border border-blue-200 rounded-sm space-y-2">
            <div className="text-2xl">💡</div>
            <p className="text-xs font-bold text-blue-950">
              Chưa có dữ liệu học sinh làm Bảng Phản tư thực tế trong CSDL Supabase.
            </p>
            <p className="text-[11px] text-blue-700 font-medium">
              Vui lòng chuyển sang tài khoản học sinh, truy cập mục "Bảng Nhìn Lại & Kiểm Tra Chọn Nghề" để trải nghiệm tạo bài làm đầu tiên. Dữ liệu sẽ tự động xuất hiện tại đây!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Họ và tên Học sinh</th>
                  <th className="py-3 px-4">Lớp / Trường</th>
                  <th className="py-3 px-4">Ngành dự định chọn</th>
                  <th className="py-3 px-4">Bẫy Tư duy Chẩn đoán</th>
                  <th className="py-3 px-4 text-center">Quyết định sau Phản tư</th>
                  <th className="py-3 px-4 text-right">Ngày thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {matrices.map((m, idx) => {
                  const studentName = m.profiles?.full_name || 'Học sinh'
                  const grade = m.profiles?.grade_level || 'Chưa rõ'
                  const school = m.profiles?.school_name || ''

                  return (
                    <tr key={m.id || idx} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {studentName}
                        {m.profiles?.email && (
                          <div className="text-[10px] font-medium text-slate-400">{m.profiles.email}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {grade} {school ? `- ${school}` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-600">{m.target_major}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-sm text-[11px]">
                          {formatBiasLabel(m.detected_bias)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderDecisionTag(m.final_decision)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-400">
                        {new Date(m.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
