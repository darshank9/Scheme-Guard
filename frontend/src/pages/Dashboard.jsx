import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserApplications, getSchemes } from '../api'
import { useAuth } from '../context/AuthContext'

const STATUS_MAP = {
    Eligible: 'badge-success',
    'High Risk': 'badge-danger',
    Pending: 'badge-warning'
}
const ADMIN_MAP = {
    Approved: 'badge-success',
    Rejected: 'badge-danger',
    'Under Review': 'badge-warning'
}

export default function Dashboard() {
    const { user } = useAuth()
    const [applications, setApplications] = useState([])
    const [schemes, setSchemes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([getUserApplications(), getSchemes()])
            .then(([a, s]) => { setApplications(a.data); setSchemes(s.data) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="page float-in">
            <div className="flex-between mb-8">
                <div>
                    <h1 className="page-title">👋 Welcome, {user?.full_name || user?.username}</h1>
                    <p className="page-subtitle">Manage your scheme applications and documents</p>
                </div>
                <Link to="/upload" className="btn btn-primary">📤 New Application</Link>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-8">
                {[
                    { icon: '📄', value: applications.length, label: 'Total Applications' },
                    { icon: '✅', value: applications.filter(a => a.eligibility_status === 'Eligible').length, label: 'Eligible' },
                    { icon: '⚠️', value: applications.filter(a => a.eligibility_status === 'High Risk').length, label: 'High Risk' },
                    { icon: '🕐', value: applications.filter(a => a.admin_status === 'Under Review').length, label: 'Pending Review' },
                ].map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: 32 }}>
                {/* Applications */}
                <div>
                    <h2 className="section-title">📁 My Applications</h2>
                    {loading ? <div className="text-muted">Loading...</div> :
                        applications.length === 0 ? (
                            <div className="card text-center" style={{ padding: 40 }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                                <p className="text-muted">No applications yet.</p>
                                <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>Upload your first document</Link>
                            </div>
                        ) : (
                            <div className="flex-col gap-3">
                                {applications.map(app => (
                                    <Link to={`/result/${app.id}`} key={app.id} style={{ textDecoration: 'none' }}>
                                        <div className="card" style={{ padding: '18px 24px' }}>
                                            <div className="flex-between">
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{app.scheme_name || 'General Application'}</div>
                                                    <div className="text-muted text-sm">📎 {app.filename}</div>
                                                    {app.extracted_income && <div className="text-sm" style={{ color: 'var(--green-light)', marginTop: 4 }}>
                                                        Income: ₹{app.extracted_income.toLocaleString('en-IN')}
                                                    </div>}
                                                </div>
                                                <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                                                    <span className={`badge ${STATUS_MAP[app.eligibility_status] || 'badge-info'}`}>{app.eligibility_status}</span>
                                                    <span className={`badge ${ADMIN_MAP[app.admin_status] || 'badge-info'}`}>{app.admin_status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                </div>

                {/* Available Schemes */}
                <div>
                    <h2 className="section-title">🗂️ Available Schemes</h2>
                    <div className="flex-col gap-3">
                        {schemes.slice(0, 4).map(s => (
                            <div className="card" key={s.id} style={{ padding: '18px 24px' }}>
                                <div className="scheme-category">{s.category}</div>
                                <div style={{ fontWeight: 600, margin: '6px 0' }}>{s.name}</div>
                                <div className="scheme-limit">₹{s.income_limit.toLocaleString('en-IN')} limit</div>
                            </div>
                        ))}
                        <Link to="/upload" className="btn btn-ghost btn-sm" style={{ marginTop: 4 }}>Apply for a scheme →</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
