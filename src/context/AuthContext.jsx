import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Danh sách Whitelist Email Admin được phép truy cập tự động
export const ADMIN_EMAILS = ['kieuthi14@gmail.com']

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
      } font-sans
      finally {
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

      const userEmail = currentUser?.email?.toLowerCase() || ''
      const isWhitelistedAdmin = ADMIN_EMAILS.includes(userEmail)

      if (!data && currentUser) {
        const newProfile = {
          id: userId,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || 'Học sinh',
          role: isWhitelistedAdmin ? 'admin' : (currentUser.user_metadata?.role || 'student')
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
        setProfile(data)
      }
    } catch (error) {
      console.error('Lỗi ngoại lệ khi fetch profile:', error)
    }
  }

  // Đăng ký
  const signUp = async (email, password, fullName) => {
    const isWhitelisted = ADMIN_EMAILS.includes(email?.toLowerCase())
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
    const { error } = await supabase.auth.signOut()
    return { error }
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
