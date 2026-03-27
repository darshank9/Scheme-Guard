import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginUser } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const submit = async e => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await loginUser(form)
            login(data.user, data.access_token)
            toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`)
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-sm float-in">
            <div className="card-glass">
                <div className="text-center mb-8">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                    <h1 className="page-title" style={{ fontSize: 26 }}>User Login</h1>
                    <p className="text-muted">Sign in to your Scheme Guard account</p>
                </div>
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input name="username" type="text" className="form-input" placeholder="Enter username" value={form.username} onChange={handle} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-input" placeholder="Enter password" value={form.password} onChange={handle} required />
                    </div>
                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? '⏳ Signing in...' : '→ Sign In'}
                    </button>
                </form>
                <hr className="divider" />
                <div className="text-center text-muted">
                    Don't have an account? <Link to="/register" style={{ color: 'var(--blue)' }}>Register here</Link>
                </div>
                <div className="text-center text-muted" style={{ marginTop: 8 }}>
                    <Link to="/admin/login" style={{ color: 'var(--text-muted)', fontSize: 12 }}>Admin Login →</Link>
                </div>
            </div>
        </div>
    )
}
