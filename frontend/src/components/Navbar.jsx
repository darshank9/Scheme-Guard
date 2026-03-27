import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                <span className="logo-icon">🏛️</span>
                <span className="logo-text">Scheme Guard</span>
            </NavLink>
            <div className="navbar-links">
                <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>Home</NavLink>

                {!user && <>
                    <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Sign In</NavLink>
                    <NavLink to="/admin/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Admin Login</NavLink>
                </>}

                {user?.role === 'user' && <>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
                    <NavLink to="/upload" className={({ isActive }) => `nav-link btn-primary${isActive ? ' active' : ''}`}>Upload Docs</NavLink>
                    <button className="nav-link btn-danger" onClick={handleLogout} style={{ background: 'none', cursor: 'pointer', border: 'none', font: 'inherit' }}>Logout</button>
                </>}

                {user?.role === 'admin' && <>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
                    <NavLink to="/admin/schemes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Schemes</NavLink>
                    <NavLink to="/admin/applications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Applications</NavLink>
                    <button className="nav-link btn-danger" onClick={handleLogout} style={{ background: 'none', cursor: 'pointer', border: 'none', font: 'inherit' }}>Logout</button>
                </>}
            </div>
        </nav>
    )
}
