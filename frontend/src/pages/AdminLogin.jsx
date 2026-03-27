import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminLogin } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const submit = async e => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await adminLogin(form)
            login(data.user, data.access_token)
            toast.success('Admin access granted.')
            navigate('/admin/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid admin credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-sm float-in">
            <div className="card-glass" style={{ borderColor: 'rgba(255,153,51,0.2)' }}>
                <div className="text-center mb-8">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
                    <h1 className="page-title" style={{ fontSize: 26 }}>Admin Portal</h1>
                    <p className="text-muted">Restricted access – authorised personnel only</p>

                </div>
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Admin Username</label>
                        <input name="username" className="form-input" value={form.username} onChange={handle} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-input" value={form.password} onChange={handle} required />
                    </div>
                    <button className="btn btn-saffron btn-full" type="submit" disabled={loading}>
                        {loading ? '⏳ Verifying...' : '🛡️ Admin Login'}
                    </button>
                </form>
                <hr className="divider" />
                <div className="text-center text-muted">
                    <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: 12 }}>← User Login</Link>
                </div>
            </div>
        </div>
    )
}
