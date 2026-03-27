import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getApplication, generateAppeal, submitAppeal } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Result() {
    const { id } = useParams()
    const { user } = useAuth()
    const [app, setApp] = useState(null)
    const [loading, setLoading] = useState(true)

    // Appeal state
    const [showAppeal, setShowAppeal] = useState(false)
    const [appealForm, setAppealForm] = useState({ rejection_reason: '' })
    const [appealText, setAppealText] = useState('')
    const [appealLoading, setAppealLoading] = useState(false)

    useEffect(() => {
        getApplication(id)
            .then(r => setApp(r.data))
            .catch(() => toast.error('Could not load application.'))
            .finally(() => setLoading(false))
    }, [id])

    const generateLetter = async () => {
        setAppealLoading(true)
        try {
            const { data } = await generateAppeal({
                applicant_name: user?.full_name || user?.username,
                rejection_reason: appealForm.rejection_reason,
                policy_clauses: app.violations.map(v => v.policy_clause).filter(Boolean)
            })
            setAppealText(data.appeal)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate appeal.')
        } finally {
            setAppealLoading(false)
        }
    }

    const handleSubmitAppeal = async () => {
        setAppealLoading(true)
        try {
            await submitAppeal(app.id, { appeal_text: appealText })
            toast.success('Appeal submitted successfully!')
            setApp({ ...app, admin_status: 'Appealed', appeal_text: appealText })
            setShowAppeal(false)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit appeal.')
        } finally {
            setAppealLoading(false)
        }
    }

    if (loading) return <div className="page flex-center" style={{ minHeight: '60vh' }}><span className="spin" style={{ fontSize: 40 }}>⏳</span></div>
    if (!app) return <div className="page"><div className="alert alert-danger">Application not found.</div></div>

    const isEligible = app.eligibility_status === 'Eligible'

    return (
        <div className="page-md float-in">
            <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>← Back to Dashboard</Link>

            <h1 className="page-title">📊 Eligibility Result</h1>

            {/* Result banner */}
            <div className={`card`} style={{
                marginBottom: 24, borderColor: isEligible ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                background: isEligible ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)'
            }}>
                <div className="flex-between flex-wrap gap-4">
                    <div>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{isEligible ? '✅' : '❌'}</div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{isEligible ? 'Eligible' : 'High Risk of Rejection'}</div>
                        <div className="text-muted" style={{ marginTop: 4 }}>{app.scheme_name || 'General Eligibility Check'}</div>
                    </div>
                    <div className="flex-col gap-3">
                        <div>
                            <div className="label">Admin Status</div>
                            <span className={`badge ${app.admin_status === 'Approved' ? 'badge-success' : app.admin_status === 'Rejected' ? 'badge-danger' : app.admin_status === 'Appealed' ? 'badge-info' : 'badge-warning'}`}>{app.admin_status}</span>
                        </div>
                        {app.extracted_income && (
                            <div>
                                <div className="label">Extracted Income</div>
                                <div style={{ fontWeight: 700, color: 'var(--green-light)' }}>₹{app.extracted_income.toLocaleString('en-IN')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document info */}
            <div className="card mb-4">
                <div className="label" style={{ marginBottom: 12 }}>Document Details</div>
                <div className="grid-2" style={{ gap: 12 }}>
                    <div><div className="label">File</div><div>📄 {app.filename}</div></div>
                    <div><div className="label">Submitted</div><div>{new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
                </div>
            </div>

            {/* Violations */}
            {app.violations?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h2 className="section-title">⚠️ Issues Found</h2>
                    {app.violations.map((v, i) => (
                        <div key={i} className="card mb-4" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 24 }}>🚫</span>
                                <div>
                                    <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--danger)' }}>{v.type}</div>
                                    <div style={{ fontSize: 14, marginBottom: 8 }}>{v.reason}</div>
                                    {v.policy_clause && (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid var(--saffron)' }}>
                                            <strong>Policy:</strong> {v.policy_clause}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Appeal section */}
            {isEligible && app.admin_status === 'Rejected' && (
                <div className="card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                    <h2 className="section-title">📝 Generate Appeal Letter</h2>
                    <div className="alert alert-warning">
                        ⚠️ Your application appears to have been rejected despite meeting all eligibility criteria. You may appeal.
                    </div>
                    {!showAppeal ? (
                        <button className="btn btn-saffron" onClick={() => setShowAppeal(true)}>📄 Generate Appeal Letter</button>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Rejection reason (from portal, if known)</label>
                                <input className="form-input" placeholder="e.g. Income limit exceeded" value={appealForm.rejection_reason}
                                    onChange={e => setAppealForm(f => ({ ...f, rejection_reason: e.target.value }))} />
                            </div>
                            <button className="btn btn-saffron" onClick={generateLetter} disabled={appealLoading}>
                                {appealLoading ? '⏳ Generating...' : '✍️ Generate Letter'}
                            </button>
                            {appealText && (
                                <div style={{ marginTop: 24 }}>
                                    <div className="flex-between mb-2">
                                        <div className="label">Generated Appeal Letter</div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(appealText).then(() => toast.success('Copied!'))}>📋 Copy</button>
                                    </div>
                                    <textarea className="appeal-textarea" readOnly value={appealText} />
                                    <button className="btn btn-success" style={{ marginTop: 16, width: "100%" }} onClick={handleSubmitAppeal} disabled={appealLoading}>
                                        {appealLoading ? '⏳ Submitting...' : '📤 Submit Appeal to Admin'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {isEligible && app.admin_status === 'Appealed' && (
                <div className="alert alert-info" style={{ marginTop: 24 }}>
                    ℹ️ You have submitted an appeal for this rejection. The admin will review it shortly.
                </div>
            )}

            {/* No violations */}
            {isEligible && app.admin_status !== 'Rejected' && app.admin_status !== 'Appealed' && (
                <div className="alert alert-success">
                    ✅ All eligibility criteria met. Your application is under review by the admin.
                </div>
            )}
        </div>
    )
}
