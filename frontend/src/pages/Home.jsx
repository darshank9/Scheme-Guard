import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSchemes } from '../api'
import { useAuth } from '../context/AuthContext'

const SCHEME_ICONS = { Education: '🎓', Housing: '🏠', Health: '💊', Agriculture: '🌾', General: '📋' }

export default function Home() {
    const { user } = useAuth()
    const [schemes, setSchemes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getSchemes()
            .then(r => setSchemes(r.data))
            .catch((e) => {
                console.error("Failed to fetch schemes:", e)
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="page float-in">
            <div className="hero">
                <div className="hero-tricolor"><div className="saffron" /><div className="white" /><div className="green" /></div>
                <h1 className="hero-title">Scheme Guard</h1>
                <p className="hero-subtitle">
                    AI-powered eligibility verification for Indian government schemes. Upload your documents
                    and instantly know if you qualify.
                </p>
                <div className="hero-badges">
                    <span className="badge badge-info">🤖 AI-Powered</span>
                    <span className="badge badge-success">✅ Instant Results</span>
                    <span className="badge badge-warning">📄 Document Analysis</span>
                    <span className="badge badge-info">🏛️ Government of India</span>
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
                    {!user ? (
                        <>
                            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>🚀 Get Started</Link>
                            <Link to="/login" className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: 16 }}>Sign In</Link>
                        </>
                    ) : (
                        <Link to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>🚀 Go to Dashboard</Link>
                    )}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid-4 mb-8">
                {[
                    { icon: '🏛️', value: schemes.length || 4, label: 'Available Schemes' },
                    { icon: '📄', value: 'AI', label: 'Document Analysis' },
                    { icon: '⚡', value: 'Instant', label: 'Eligibility Check' },
                    { icon: '📝', value: 'Auto', label: 'Appeal Letters' },
                ].map((s, i) => (
                    <div className="stat-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Schemes */}
            <div className="flex-between mb-6">
                <h2 className="section-title" style={{ marginBottom: 0 }}>🗂️ Available Government Schemes</h2>
                {!user && <Link to="/register" className="btn btn-ghost btn-sm">View All →</Link>}
            </div>

            {loading ? (
                <div className="flex-center" style={{ padding: 60 }}>
                    <span className="spin" style={{ fontSize: 32 }}>⏳</span>
                </div>
            ) : (
                <div className="grid-4">
                    {schemes.map(s => (
                        <div className="scheme-card float-in" key={s.id}>
                            <div className="scheme-category">{SCHEME_ICONS[s.category] || '📋'} {s.category}</div>
                            <div className="scheme-name">{s.name}</div>
                            <div className="scheme-desc">{s.description}</div>
                            <div className="scheme-limit">Income limit: ₹{s.income_limit.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📎 {s.required_docs}</div>
                            <Link to={user ? "/upload" : "/register"} className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Check Eligibility →</Link>
                        </div>
                    ))}
                    {schemes.length === 0 && (
                        <div className="card text-center" style={{ gridColumn: '1/-1', padding: 40 }}>
                            <p className="text-muted">No active schemes found. Please try again later.</p>
                        </div>
                    )}
                </div>
            )}

            {/* How it works */}
            <div className="card" style={{ marginTop: 48 }}>
                <h2 className="section-title">📌 How It Works</h2>
                <div className="grid-3">
                    {[
                        { step: '01', icon: '📝', title: 'Register & Login', desc: 'Create your account and securely log into the portal.' },
                        { step: '02', icon: '📤', title: 'Upload Documents', desc: 'Upload your Income Certificate (PDF) for AI analysis.' },
                        { step: '03', icon: '✅', title: 'Get Results', desc: 'View eligibility status and generate appeal letters if needed.' },
                    ].map(s => (
                        <div key={s.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(255,153,51,0.2),rgba(59,130,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--saffron)' }}>
                                {s.step}
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.icon} {s.title}</div>
                                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer style={{ textAlign: 'center', padding: '40px 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                © 2024 Government of India · Scheme Guard Portal · For Academic &amp; Demonstration Use
            </footer>
        </div>
    )
}