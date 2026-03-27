import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Result from './pages/Result'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import SchemeManagement from './pages/SchemeManagement'
import ApplicationReview from './pages/ApplicationReview'

function ProtectedRoute({ children, role }) {
    const { user } = useAuth()
    if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />
    if (role && user.role !== role) return <Navigate to="/" replace />
    return children
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" toastOptions={{
                    style: { background: '#1e2a3a', color: '#fff', border: '1px solid #2d4a6b' }
                }} />
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute role="user"><Dashboard /></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute role="user"><Upload /></ProtectedRoute>} />
                    <Route path="/result/:id" element={<ProtectedRoute role="user"><Result /></ProtectedRoute>} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/schemes" element={<ProtectedRoute role="admin"><SchemeManagement /></ProtectedRoute>} />
                    <Route path="/admin/applications" element={<ProtectedRoute role="admin"><ApplicationReview /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
