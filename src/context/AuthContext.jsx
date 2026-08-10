import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

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

  // Hàm tải thông tin profile từ database kèm fallback an toàn
  const fetchProfile = async (userId, userObj = null) => {
    const currentUser = userObj || user
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        console.warn('Chưa tìm thấy profile trong DB (có thể chưa chạy schema.sql hoặc RLS chưa cấp quyền), tự động sử dụng thông tin fallback từ Auth metadata:', error)
        setProfile({
          id: userId,
          email: currentUser?.email || '',
          full_name: currentUser?.user_metadata?.full_name || 'Học sinh mới',
          role: currentUser?.user_metadata?.role || 'student'
        })
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.warn('Ngoại lệ khi tải profile, dùng fallback:', error)
      setProfile({
        id: userId,
        email: currentUser?.email || '',
        full_name: currentUser?.user_metadata?.full_name || 'Học sinh mới',
        role: currentUser?.user_metadata?.role || 'student'
      })
    }
  }

  // Đăng ký (mặc định role = student)
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student'
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
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Cập nhật profile thủ công
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
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
