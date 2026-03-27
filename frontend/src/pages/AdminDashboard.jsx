import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAdminStats()
            .then(r => setStats(r.data))
            .catch(() => toast.error('Failed to load stats.'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="page flex-center"><span className="spin" style={{ fontSize: 40 }}>⏳</span></div>

    const statItems = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: 'var(--blue)' },
        { label: 'Applications', value: stats?.total_applications || 0, icon: '📄', color: 'var(--saffron)' },
        { label: 'Active Schemes', value: stats?.total_schemes || 0, icon: '🏛️', color: 'var(--green-light)' },
        { label: 'Pending Review', value: stats?.pending || 0, icon: '🕐', color: 'var(--warning)' },
    ]

    return (
        <div className="page float-in">
            <div className="flex-between mb-8">
                <div>
                    <h1 className="page-title">🛡️ Admin Dashboard</h1>
                    <p className="page-subtitle">System overview and management</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/schemes" className="btn btn-ghost btn-sm">Manage Schemes</Link>
                    <Link to="/admin/applications" className="btn btn-primary btn-sm">Review Applications</Link>
                </div>
            </div>

            <div className="grid-4 mb-8">
                {statItems.map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                <div className="card">
                    <h2 className="section-title">📊 Application Status</h2>
                    <div className="flex-col gap-4">
                        {[
                            { label: 'Approved', count: stats?.approved || 0, pct: stats?.total_applications ? (stats.approved / stats.total_applications * 100) : 0, color: 'var(--success)' },
                            { label: 'Rejected', count: stats?.rejected || 0, pct: stats?.total_applications ? (stats.rejected / stats.total_applications * 100) : 0, color: 'var(--danger)' },
                            { label: 'Under Review', count: stats?.pending || 0, pct: stats?.total_applications ? (stats.pending / stats.total_applications * 100) : 0, color: 'var(--warning)' },
                        ].map(s => (
                            <div key={s.label}>
                                <div className="flex-between mb-2">
                                    <span className="text-sm font-bold">{s.label}</span>
                                    <span className="text-sm text-muted">{s.count}</span>
                                </div>
                                <div className="progress-bar-wrap" style={{ height: 6 }}>
                                    <div className="progress-bar" style={{ width: `${s.pct}%`, background: s.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card flex-col flex-center text-center">
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
                    <h3 style={{ marginBottom: 8 }}>Quick Actions</h3>
                    <p className="text-muted text-sm mb-6">Perform administrative tasks and system updates.</p>
                    <div className="flex-col gap-3 btn-full">
                        <Link to="/admin/schemes" className="btn btn-ghost btn-full">➕ Add New Scheme</Link>
                        <Link to="/admin/applications" className="btn btn-ghost btn-full">🔍 Search Applications</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
