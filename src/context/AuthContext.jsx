import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Danh sách Whitelist Email Admin được phép truy cập Quản trị
export const ADMIN_EMAILS = [
  'kieuthi14@gmail.com',
  'admin@gmail.com',
  'admin@cbas.edu.vn',
  'cbas.admin@gmail.com'
]

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Lấy session hiện tại khi ứng dụng khởi chạy
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user)
        } else {
          // Kiểm tra phiên đăng nhập cục bộ cho Giám khảo (Guest) hoặc Đối tượng (CT_01 -> CT_30)
          const localRole = typeof window !== 'undefined' ? localStorage.getItem('currentUserRole') : null
          const localId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
          if (localRole && localId) {
            const isGuest = localRole === 'guest'
            const mockUser = {
              id: localId,
              email: isGuest ? `${localId.toLowerCase()}@sandbox.visef.edu.vn` : `${localId.toLowerCase()}@student.visef.edu.vn`,
              user_metadata: {
                role: isGuest ? 'guest' : 'student',
                student_code: localId
              }
            }
            setUser(mockUser)
            setProfile({
              id: localId,
              email: mockUser.email,
              full_name: localId,
              role: isGuest ? 'guest' : 'student',
              student_code: localId
            })
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy session ban đầu:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 2. Lắng nghe thay đổi trạng thái Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id, session.user)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Hàm tải thông tin profile thuần 100% từ bảng profiles trong Supabase DB
  const fetchProfile = async (userId, userObj = null) => {
    const currentUser = userObj || user
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Lỗi khi lấy profile từ bảng profiles của Supabase:', error)
      }

      const userEmail = currentUser?.email?.toLowerCase().trim() || ''
      const isWhitelistedAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)

      // Nhận diện mã học sinh thực nghiệm CT_01 -> CT_30 hoặc mã do học sinh tự điền
      let detectedStudentCode = null
      const ctMatch = userEmail.match(/^ct[_\-]?(\d{1,3})@/)
      if (ctMatch) {
        const n = parseInt(ctMatch[1], 10)
        detectedStudentCode = `CT_${n < 10 ? '0' + n : n}`
      } else if (currentUser?.user_metadata?.student_code) {
        detectedStudentCode = currentUser.user_metadata.student_code
      } else if (data?.student_code) {
        detectedStudentCode = data.student_code
      }

      // Kiểm tra localStorage (mã học sinh đã nhập lúc đăng nhập hoặc tự đổi)
      if (!detectedStudentCode) {
        try {
          const local = localStorage.getItem('cbas_student_code')
          if (local && local.trim()) {
            detectedStudentCode = local.trim().toUpperCase()
          }
        } catch (e) {}
      }

      // Mặc định đối với học sinh: Mã hóa ẩn danh bảo vệ danh tính tuyệt đối
      if (!isWhitelistedAdmin && !detectedStudentCode) {
        detectedStudentCode = 'CT_01'
      }

      if (!data && currentUser) {
        const newProfile = {
          id: userId,
          email: currentUser.email,
          full_name: isWhitelistedAdmin ? (currentUser.user_metadata?.full_name || 'Quản trị viên') : detectedStudentCode,
          role: isWhitelistedAdmin ? 'admin' : (currentUser.user_metadata?.role || 'student'),
          student_code: isWhitelistedAdmin ? null : detectedStudentCode
        }
        
        const { data: createdData } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle()

        setProfile(createdData || newProfile)
      } else {
        if (isWhitelistedAdmin && data) {
          data.role = 'admin'
        }
        if (!isWhitelistedAdmin && data) {
          // Bắt buộc ẩn danh hóa đối với học sinh: Tuyệt đối không để lộ email hoặc tên mail
          data.student_code = detectedStudentCode || data.student_code || 'CT_01'
          const isEmailLike = !data.full_name || data.full_name.includes('@') || data.full_name.toLowerCase() === userEmail.split('@')[0]
          if (isEmailLike || detectedStudentCode) {
            data.full_name = detectedStudentCode || data.student_code || 'CT_01'
          }

          // Tự động chữa lành dữ liệu cũ trong Supabase nếu database đang lưu tên mail
          if (isEmailLike && detectedStudentCode && data.id) {
            supabase.from('profiles').update({
              full_name: detectedStudentCode,
              student_code: detectedStudentCode
            }).eq('id', data.id).then(() => {}).catch(() => {})
          }
        }
        setProfile(data)
      }
    } catch (error) {
      console.error('Lỗi ngoại lệ khi fetch profile:', error)
    }
  }

  // Đăng ký
  const signUp = async (email, password, fullName) => {
    const isWhitelisted = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email?.toLowerCase().trim() || '')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: isWhitelisted ? 'admin' : 'student'
        }
      }
    })
    return { data, error }
  }

  // Đăng nhập
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  // Đăng xuất
  const signOut = async () => {
    try {
      localStorage.removeItem('currentUserRole')
      localStorage.removeItem('currentUserId')
    } catch (e) {}
    setUser(null)
    setProfile(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Thiết lập phiên đăng nhập cục bộ cho Giám khảo / Đối tượng thực nghiệm
  const setLocalSession = (role, userId, code) => {
    const isGuest = role === 'guest'
    const targetCode = (code || userId || 'CT_01').toUpperCase()
    try {
      localStorage.setItem('currentUserRole', role)
      localStorage.setItem('currentUserId', userId)
      localStorage.setItem('cbas_student_code', targetCode)
      localStorage.setItem('cbas_is_experimental_group', isGuest ? 'false' : 'true')
    } catch (e) {}

    const mockUser = {
      id: userId,
      email: isGuest ? `${userId.toLowerCase()}@sandbox.visef.edu.vn` : `${userId.toLowerCase()}@student.visef.edu.vn`,
      user_metadata: {
        role: isGuest ? 'guest' : 'student',
        student_code: targetCode
      }
    }
    setUser(mockUser)
    setProfile({
      id: userId,
      email: mockUser.email,
      full_name: targetCode,
      role: isGuest ? 'guest' : 'student',
      student_code: targetCode
    })
  }

  // Cập nhật profile vào Supabase DB
  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('Chưa đăng nhập') }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('Lỗi khi cập nhật profile:', error)
      return { data: null, error }
    }
  }

  // Mã học sinh ẩn danh (ưu tiên localStorage do học sinh tự điền hoặc chọn)
  const studentCode = (() => {
    try {
      const local = localStorage.getItem('cbas_student_code')
      if (local && local.trim()) return local.trim().toUpperCase()
    } catch (e) {}

    const email = (user?.email || profile?.email || '').toLowerCase().trim()
    const ctMatch = email.match(/^ct[_\-]?(\d{1,3})@/)
    if (ctMatch) {
      const n = parseInt(ctMatch[1], 10)
      return `CT_${n < 10 ? '0' + n : n}`
    }
    if (profile?.student_code) return profile.student_code
    if (profile?.full_name && /^CT_\d{1,3}$/i.test(profile.full_name)) {
      return profile.full_name.toUpperCase()
    }
    return 'CT_01'
  })()

  // Tên hiển thị chuẩn đạo đức ViSEF: Tuyệt đối KHÔNG hiển thị email hoặc tên email đối với học sinh
  const displayName = (() => {
    const userEmail = (user?.email || profile?.email || '').toLowerCase().trim()
    const isWhitelistedAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)
    if (isWhitelistedAdmin) {
      return profile?.full_name || 'Admin Quản trị viên'
    }
    // Đối với học sinh: 100% hiển thị mã ẩn danh (VD: CT_01)
    return studentCode || 'CT_01'
  })()

  // Hàm cho phép học sinh tự đổi mã ẩn danh (VD: CT_01 -> CT_02,...) ngay trên giao diện
  const updateStudentCode = async (newCode) => {
    const formatted = (newCode || 'CT_01').trim().toUpperCase()
    localStorage.setItem('cbas_student_code', formatted)
    
    if (user?.id) {
      try {
        await supabase.from('profiles').update({
          full_name: formatted,
          student_code: formatted
        }).eq('id', user.id)
      } catch (err) {
        console.warn('Lỗi updateStudentCode:', err)
      }
    }

    setProfile(prev => prev ? {
      ...prev,
      full_name: formatted,
      student_code: formatted
    } : prev)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      studentCode,
      displayName,
      updateStudentCode,
      setLocalSession,
      loading, 
      signIn, 
      signUp, 
      signOut, 
      updateProfile, 
      refreshProfile: () => fetchProfile(user?.id, user) 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
