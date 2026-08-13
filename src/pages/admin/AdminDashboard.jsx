import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  
  // Dữ liệu thực tế được ghép nối từ Supabase DB
  const [usersList, setUsersList] = useState([])
  const [matricesList, setMatricesList] = useState([])
  
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
    optimism: 0,
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
      // 1. Truy vấn danh sách tài khoản học sinh từ bảng profiles
      let realUsers = []
      try {
        const { data: usersData, error: uErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!uErr && Array.isArray(usersData)) {
          realUsers = usersData
        }
      } catch (e) {
        console.warn('Lỗi lấy profiles từ DB:', e)
      }

      // 2. Truy vấn danh sách bài làm Phản tư từ bảng metacognitive_matrix
      let realMatrices = []
      try {
        const { data: matrixData, error: mErr } = await supabase
          .from('metacognitive_matrix')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!mErr && Array.isArray(matrixData)) {
          realMatrices = matrixData
        }
      } catch (e) {
        console.warn('Lỗi lấy metacognitive_matrix từ DB:', e)
      }

      setUsersList(realUsers)
      setMatricesList(realMatrices)

      // 3. Tiến hành khớp nối dữ liệu (Data Mapping & Aggregation)
      let successCnt = 0
      let sunkCostCnt = 0
      let bandwagonCnt = 0
      let emotionalCnt = 0
      let optimismCnt = 0
      const majorFrequency = {}

      realMatrices.forEach(item => {
        // Thống kê tên ngành học xuất hiện nhiều nhất
        if (item?.target_major) {
          const majorTrimmed = String(item.target_major).trim()
          if (majorTrimmed) {
            majorFrequency[majorTrimmed] = (majorFrequency[majorTrimmed] || 0) + 1
          }
        }

        const decision = item?.final_decision
        const bias = item?.detected_bias

        // Đếm chính xác lượt và phân loại bẫy tư duy theo thuật toán Siêu nhận thức
        if (decision === 'BACKUP' || decision === 'CHANGED' || bias === 'DEBIASED_SUCCESS' || bias === 'BALANCED') {
          successCnt++
        } else if (bias === 'SUNK_COST_BIAS') {
          sunkCostCnt++
        } else if (bias === 'BANDWAGON_BIAS') {
          bandwagonCnt++
        } else if (bias === 'EMOTIONAL_BIAS') {
          emotionalCnt++
        } else if (bias === 'OPTIMISM_BIAS') {
          optimismCnt++
        } else {
          successCnt++
        }
      })

      // Thống kê Top Ngành được chọn nhiều nhất
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
        optimism: optimismCnt,
        total: totalM
      })

      setStats({
        totalStudents: realUsers.length,
        totalReflections: totalM,
        debiasedSuccessPct: debiasedPct,
        topMajor: topMajorName
      })

      if (isManualRefresh) {
        setToastMessage('Đã làm mới và khớp nối dữ liệu mới nhất từ Supabase DB!')
        setTimeout(() => setToastMessage(null), 3000)
      }

    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực tế Supabase:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Hàm xuất dữ liệu Excel / CSV Thực Tế Đã Khớp Nối
  const handleExportCSV = () => {
    try {
      if (!Array.isArray(matricesList) || matricesList.length === 0) {
        setToastMessage('Chưa có dữ liệu Phản tư thực tế để xuất file.')
        setTimeout(() => setToastMessage(null), 3000)
        return
      }

      // Tạo map từ student_id -> profile để tra cứu nhanh thông tin học sinh
      const userMap = {}
      usersList.forEach(u => {
        if (u?.id) userMap[u.id] = u
      })

      const headers = ['STT,Ho va Ten,Email,Khoi lop,Nganh muc tieu,Bay tu duy chan doan,Quyet dinh sau phan tu,Ngay tao\n']
      const rows = matricesList.map((m, idx) => {
        const sProfile = userMap[m?.student_id || m?.user_id]
        const fullName = sProfile?.full_name || 'Học sinh'
        const email = sProfile?.email || 'N/A'
        const grade = sProfile?.grade_level || 'N/A'
        const targetMajor = m?.target_major || ''
        const bias = m?.detected_bias || 'NONE'
        const decision = m?.final_decision || 'CONFIRMED'
        const createdAt = m?.created_at ? new Date(m.created_at).toLocaleDateString('vi-VN') : ''

        return `"${idx + 1}","${fullName}","${email}","${grade}","${targetMajor}","${bias}","${decision}","${createdAt}"`
      }).join('\n')

      const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Bao_Cao_Phan_Tu_Thuc_Te_ViSEF_${new Date().toISOString().slice(0, 10)}.csv`)
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
      case 'BALANCED':
        return 'Tư Duy Cân Bằng'
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

  const total = debiasStats?.total || 0
  const successPct = total > 0 ? Math.round(((debiasStats?.success || 0) / total) * 100) : 0
  const sunkCostPct = total > 0 ? Math.round(((debiasStats?.sunkCost || 0) / total) * 100) : 0
  const bandwagonPct = total > 0 ? Math.round(((debiasStats?.bandwagon || 0) / total) * 100) : 0
  const emotionalPct = total > 0 ? Math.round(((debiasStats?.emotional || 0) / total) * 100) : 0
  const optimismPct = total > 0 ? Math.round(((debiasStats?.optimism || 0) / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-3 font-sans">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải và khớp nối dữ liệu từ Supabase DB (ViSEF)...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-reveal font-sans">
      {/* Header Trang Admin - Ngữ cảnh ViSEF NCKH */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>⚙️</span> Bảng Quản Trị NCKH Hướng Nghiệp Siêu Nhận Thức (ViSEF)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Hệ thống kết nối trực tiếp CSDL Supabase để tổng hợp lịch sử bài làm Phản tư, chẩn đoán Bẫy Tư duy và khớp nối dữ liệu thực tế giữa bảng <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded">profiles</code> và <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded">metacognitive_matrix</code>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Nút Làm mới Dữ liệu */}
            <button
              type="button"
              onClick={() => fetchRealSupabaseData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              <span>Làm mới dữ liệu</span>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học sinh Thực Tế</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{stats?.totalStudents || 0} HS</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-sm border border-indigo-100 flex items-center justify-center text-xl font-bold">
            🧠
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài Phản Tư Đã Tạo</p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">{stats?.totalReflections || 0} Bài</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100 flex items-center justify-center text-xl font-bold">
            🎉
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% Thoát Bẫy Thành Công</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{stats?.debiasedSuccessPct || 0}%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-sm border border-amber-100 flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Ngành Được Chọn</p>
            <p className="text-xs font-black text-amber-700 mt-1 leading-snug truncate max-w-[120px]">{stats?.topMajor || 'Chưa có'}</p>
          </div>
        </div>
      </div>

      {/* Biểu Đồ Thống Kê Phân Loại 5 Bẫy Tư Duy Chọn Nghề Thực Tế */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Phân Tích Bẫy Tư Duy Thực Tế từ Supabase Database ({debiasStats?.total || 0} lượt)
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm uppercase">
            Supabase Live Data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Bẫy 0: Thoát bẫy thành công */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">🎉 Thoát Bẫy Thành Công</span>
              <span className="text-sm font-black text-emerald-900">{successPct}%</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-semibold">{debiasStats?.success || 0} lượt điều chỉnh NV tỉnh táo</p>
            <div className="w-full bg-emerald-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-sm transition-all duration-500" style={{ width: `${successPct}%` }} />
            </div>
          </div>

          {/* Bẫy 1: Cảm xúc */}
          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950">⚠️ Bẫy Cảm Xúc Từ Nhỏ</span>
              <span className="text-sm font-black text-rose-900">{emotionalPct}%</span>
            </div>
            <p className="text-[11px] text-rose-800 font-semibold">{debiasStats?.emotional || 0} lượt chọn theo hình mẫu cũ</p>
            <div className="w-full bg-rose-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-rose-600 h-full rounded-sm transition-all duration-500" style={{ width: `${emotionalPct}%` }} />
            </div>
          </div>

          {/* Bẫy 2: Đám đông */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">⚠️ Bẫy Theo Đám Đông</span>
              <span className="text-sm font-black text-blue-900">{bandwagonPct}%</span>
            </div>
            <p className="text-[11px] text-blue-800 font-semibold">{debiasStats?.bandwagon || 0} lượt bị ảnh hưởng MXH/bạn bè</p>
            <div className="w-full bg-blue-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-blue-600 h-full rounded-sm transition-all duration-500" style={{ width: `${bandwagonPct}%` }} />
            </div>
          </div>

          {/* Bẫy 3: Chỉ nhìn màu hồng */}
          <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950">⚠️ Bẫy Chỉ Nhìn Màu Hồng</span>
              <span className="text-sm font-black text-purple-900">{optimismPct}%</span>
            </div>
            <p className="text-[11px] text-purple-800 font-semibold">{debiasStats?.optimism || 0} lượt phớt lờ rủi ro nghề</p>
            <div className="w-full bg-purple-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-purple-600 h-full rounded-sm transition-all duration-500" style={{ width: `${optimismPct}%` }} />
            </div>
          </div>

          {/* Bẫy 4: Tiếc công sức */}
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">⚠️ Bẫy Tiếc Công Sức</span>
              <span className="text-sm font-black text-amber-900">{sunkCostPct}%</span>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold">{debiasStats?.sunkCost || 0} lượt tiếc công sức đã học</p>
            <div className="w-full bg-amber-200 h-2 rounded-sm overflow-hidden">
              <div className="bg-amber-500 h-full rounded-sm transition-all duration-500" style={{ width: `${sunkCostPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Học Sinh Thực Tế & Khớp Nối Bài Làm Phản Tư */}
      <div className="bg-white border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📋</span>
            <span>Danh Sách Học Sinh Thực Tế & Khớp Nối Bài Phản Tư ({usersList?.length || 0} Học sinh)</span>
          </h3>
          <span className="text-[11px] font-bold text-brand-600">Profiles ➔ Matrix Data Mapping</span>
        </div>

        {!Array.isArray(usersList) || usersList.length === 0 ? (
          <div className="p-8 text-center bg-blue-50/60 border border-blue-200 rounded-sm space-y-2">
            <div className="text-2xl">💡</div>
            <p className="text-xs font-bold text-blue-950">
              Chưa có dữ liệu Học sinh thực tế trong CSDL Supabase.
            </p>
            <p className="text-[11px] text-blue-700 font-medium">
              Vui lòng đăng ký tài khoản học sinh và làm Bảng Phản tư để dữ liệu xuất hiện tại đây!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Họ và tên Học sinh</th>
                  <th className="py-3 px-4">Email / Khối lớp</th>
                  <th className="py-3 px-4">Ngày tham gia</th>
                  <th className="py-3 px-4">Số bài Phản tư</th>
                  <th className="py-3 px-4">Ngành dự định gần nhất</th>
                  <th className="py-3 px-4">Bẫy tư duy chẩn đoán</th>
                  <th className="py-3 px-4 text-center">Quyết định sau Phản tư</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u, idx) => {
                  const studentId = u?.id
                  // Khớp nối bài làm phản tư với từng học sinh theo student_id / user_id
                  const studentMatrices = matricesList.filter(m => m?.student_id === studentId || m?.user_id === studentId)
                  const latestMatrix = studentMatrices.length > 0 ? studentMatrices[0] : null

                  return (
                    <tr key={u?.id || idx} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {u?.full_name || 'Học sinh'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div>{u?.email || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{u?.grade_level || 'Lớp 12'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500">
                        {u?.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-sm">
                          {studentMatrices.length} bài
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-600">
                        {latestMatrix?.target_major ? (
                          <span>{latestMatrix.target_major}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa tạo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {latestMatrix ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-sm text-[11px]">
                            {formatBiasLabel(latestMatrix.detected_bias)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa chẩn đoán</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {latestMatrix ? (
                          renderDecisionTag(latestMatrix.final_decision)
                        ) : (
                          <span className="text-slate-400 font-normal text-[11px]">—</span>
                        )}
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

