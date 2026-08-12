import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth, ADMIN_EMAILS } from './context/AuthContext'

// Layouts
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'

// Public Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import HollandTest from './pages/student/HollandTest'
import DebiasMatrix from './pages/student/DebiasMatrix'
import MajorExplorer from './pages/student/MajorExplorer'
import UniversityExplorer from './pages/student/UniversityExplorer'
import RoadmapBuilder from './pages/student/RoadmapBuilder'
import CounselingBooking from './pages/student/CounselingBooking'

// Counselor Pages
import CounselorDashboard from './pages/counselor/CounselorDashboard'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'

// Route Bảo vệ chung dựa trên phân quyền (RBAC Route Guard)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang kết nối hệ thống...</span>
        </div>
      </div>
    )
  }

  // 1. Chưa đăng nhập -> Chuyển về login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Vai trò hiện tại của user
  const userEmail = user?.email?.toLowerCase() || ''
  const isWhitelistedAdmin = ADMIN_EMAILS.includes(userEmail)
  const userRole = isWhitelistedAdmin ? 'admin' : (profile?.role || user?.user_metadata?.role || 'student')

  // 3. Đã đăng nhập nhưng truy cập trang không thuộc quyền
  if (allowedRoles && !allowedRoles.includes(userRole) && !isWhitelistedAdmin) {
    if (userRole === 'admin' && location.pathname !== '/admin/management' && location.pathname !== '/admin/dashboard') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (userRole === 'counselor' && location.pathname !== '/counselor/dashboard') {
      return <Navigate to="/counselor/dashboard" replace />
    } else if (userRole === 'student' && location.pathname !== '/student/dashboard') {
      return <Navigate to="/student/dashboard" state={{ unauthorized: true }} replace />
    }
  }

  return children
}

// Guard riêng bảo vệ trang Admin Dashboard (ROLE-BASED ACCESS CONTROL + EMAIL WHITELIST)
const AdminProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  const userEmail = user?.email?.toLowerCase() || ''
  const isWhitelistedAdmin = ADMIN_EMAILS.includes(userEmail)
  const userRole = isWhitelistedAdmin ? 'admin' : (profile?.role || user?.user_metadata?.role || 'student')

  // Nếu không phải admin và không nằm trong Whitelist -> Redirect về student/dashboard
  if (userRole === 'student' && !isWhitelistedAdmin) {
    return <Navigate to="/student/dashboard" state={{ unauthorized: true }} replace />
  }

  return children
}

// Wrapper Layout cho các trang Dashboard
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

// Chuyển hướng thông minh trang chủ '/' dựa vào vai trò
const HomeRedirect = () => {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  const userEmail = user?.email?.toLowerCase() || ''
  const isWhitelistedAdmin = ADMIN_EMAILS.includes(userEmail)
  const role = isWhitelistedAdmin ? 'admin' : (profile?.role || user?.user_metadata?.role || 'student')

  if (role === 'admin' || isWhitelistedAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  } else if (role === 'counselor' || role === 'teacher') {
    return <Navigate to="/counselor/dashboard" replace />
  } else {
    return <Navigate to="/student/dashboard" replace />
  }
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Home Redirect */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['student', 'counselor', 'teacher', 'admin']}>
                <HomeRedirect />
              </ProtectedRoute>
            } 
          />

          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <StudentDashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/holland-test" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <HollandTest />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/debias-matrix" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <DebiasMatrix />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/majors" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <MajorExplorer />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/universities" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <UniversityExplorer />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/roadmap" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <RoadmapBuilder />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/booking" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <CounselingBooking />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* Counselor Routes */}
          <Route 
            path="/counselor/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['counselor', 'teacher']}>
                <MainLayout>
                  <CounselorDashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes - WHITELIST EMAIL CHO PHÉP TRUY CẬP TỰ ĐỘNG */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/management" 
            element={
              <AdminProtectedRoute>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </AdminProtectedRoute>
            } 
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
