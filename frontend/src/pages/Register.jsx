import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { registerUser } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const submit = async e => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await registerUser(form)
            login(data.user, data.access_token)
            toast.success('Account created! Welcome to Scheme Guard.')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-sm float-in">
            <div className="card-glass">
                <div className="text-center mb-8">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                    <h1 className="page-title" style={{ fontSize: 26 }}>Create Account</h1>
                    <p className="text-muted">Join Scheme Guard to check your eligibility</p>
                </div>
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input name="full_name" className="form-input" placeholder="e.g. Rahul Sharma" value={form.full_name} onChange={handle} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input name="username" className="form-input" placeholder="Choose a username" value={form.username} onChange={handle} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handle} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handle} required minLength={6} />
                    </div>
                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? '⏳ Creating account...' : '🚀 Create Account'}
                    </button>
                </form>
                <hr className="divider" />
                <div className="text-center text-muted">
                    Already have an account? <Link to="/login" style={{ color: 'var(--blue)' }}>Sign in</Link>
                </div>
            </div>
        </div>
    )
}
