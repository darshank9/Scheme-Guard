import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        setIsMenuOpen(false)
        navigate('/')
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
                <span className="logo-icon">🏛️</span>
                <span className="logo-text">Scheme Guard</span>
            </NavLink>

            <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
                {isMenuOpen ? '✕' : '☰'}
            </button>

            <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
                <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end onClick={closeMenu}>Home</NavLink>

                {!user && <>
                    <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>Sign In</NavLink>
                    <NavLink to="/admin/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>Admin Login</NavLink>
                </>}

                {user?.role === 'user' && <>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>Dashboard</NavLink>
                    <NavLink to="/upload" className={({ isActive }) => `nav-link btn-primary${isActive ? ' active' : ''}`} onClick={closeMenu}>Upload Docs</NavLink>
                    <button className="nav-link btn-danger" onClick={handleLogout} style={{ background: 'none', cursor: 'pointer', border: 'none', font: 'inherit' }}>Logout</button>
                </>}

                {user?.role === 'admin' && <>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>Dashboard</NavLink>
                    <NavLink to="/admin/schemes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>Schemes</NavLink>
                    <NavLink to="/admin/applications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>Applications</NavLink>
                    <button className="nav-link btn-danger" onClick={handleLogout} style={{ background: 'none', cursor: 'pointer', border: 'none', font: 'inherit' }}>Logout</button>
                </>}
            </div>
        </nav>
    )
}
