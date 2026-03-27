import { useEffect, useState } from 'react'
import { getAdminApplications, updateApplicationStatus } from '../api'
import toast from 'react-hot-toast'

export default function ApplicationReview() {
    const [apps, setApps] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ search: '', status: '' })
    const [selectedApp, setSelectedApp] = useState(null)
    const [remarks, setRemarks] = useState('')

    useEffect(() => { load() }, [filter])

    const load = () => {
        setLoading(true)
        getAdminApplications(filter).then(r => setApps(r.data)).catch(() => { }).finally(() => setLoading(false))
    }

    const handleAction = async (id, status) => {
        try {
            await updateApplicationStatus(id, { status, remarks })
            toast.success(`Application ${status}!`)
            setSelectedApp(null)
            setRemarks('')
            load()
        } catch (err) { toast.error('Action failed.') }
    }

    return (
        <div className="page float-in">
            <div className="mb-8">
                <h1 className="page-title">📑 Application Review</h1>
                <p className="page-subtitle">Verify user documents and approve applications</p>
            </div>

            <div className="search-bar">
                <input className="form-input search-input" placeholder="Search by name, email, or username..."
                    value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
                <select className="form-input" style={{ width: 180 }} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
                    <option value="">All Statuses</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Appealed">Appealed</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            <div className="table-wrap">
                {loading ? <div className="text-center p-8">⏳ Loading...</div> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Scheme</th>
                                <th>AI Eligibility</th>
                                <th>Extracted Income</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apps.map(a => (
                                <tr key={a.id}>
                                    <td>
                                        <div><strong>{a.applicant_name}</strong></div>
                                        <div className="text-muted text-sm">{a.applicant_email}</div>
                                    </td>
                                    <td>{a.scheme_name || 'General'}</td>
                                    <td>
                                        <span className={`badge ${a.eligibility_status === 'Eligible' ? 'badge-success' : 'badge-danger'}`}>
                                            {a.eligibility_status}
                                        </span>
                                    </td>
                                    <td>₹{a.extracted_income?.toLocaleString('en-IN') || 'N/A'}</td>
                                    <td>
                                        <span className={`badge ${a.admin_status === 'Approved' ? 'badge-success' : a.admin_status === 'Rejected' ? 'badge-danger' : a.admin_status === 'Appealed' ? 'badge-info' : 'badge-warning'}`}>
                                            {a.admin_status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedApp(a)}>Review</button>
                                    </td>
                                </tr>
                            ))}
                            {apps.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-muted">No applications found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedApp && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 600 }}>
                        <h2 className="modal-title">Review Application #{selectedApp.id}</h2>

                        <div className="grid-2 mb-6" style={{ gap: 20 }}>
                            <div className="card" style={{ padding: 16 }}>
                                <div className="label">Applicant</div>
                                <div className="font-bold">{selectedApp.applicant_name}</div>
                                <div className="text-sm text-muted">{selectedApp.applicant_email}</div>
                            </div>
                            <div className="card" style={{ padding: 16 }}>
                                <div className="label">Scheme</div>
                                <div className="font-bold">{selectedApp.scheme_name}</div>
                            </div>
                        </div>

                        <div className="card mb-6" style={{ padding: 16 }}>
                            <div className="label">Document Analysis (AI)</div>
                            <div className="flex-between mb-2">
                                <span>Result:</span>
                                <span className={`badge ${selectedApp.eligibility_status === 'Eligible' ? 'badge-success' : 'badge-danger'}`}>{selectedApp.eligibility_status}</span>
                            </div>
                            <div className="flex-between">
                                <span>Income:</span>
                                <span className="font-bold text-green-light">₹{selectedApp.extracted_income?.toLocaleString('en-IN')}</span>
                            </div>
                            {selectedApp.violations?.length > 0 && (
                                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)' }}>
                                    <strong>AI Warnings:</strong>
                                    <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                                        {selectedApp.violations.map((v, i) => <li key={i}>{v.reason}</li>)}
                                    </ul>
                                </div>
                            )}
                            {selectedApp.doc_issues?.length > 0 && (
                                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--warning)' }}>
                                    <strong>Document Issues:</strong>
                                    <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                                        {selectedApp.doc_issues.map((v, i) => <li key={`doc-${i}`}>{v.reason || v.type}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {selectedApp.appeal_text && (
                            <div className="card mb-6" style={{ padding: 16, borderColor: 'var(--blue)', background: 'rgba(59,130,246,0.05)' }}>
                                <div className="label" style={{ color: 'var(--blue)' }}>📝 Appeal from Applicant</div>
                                <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                    {selectedApp.appeal_text}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Reviewer Remarks</label>
                            <textarea className="form-input" style={{ height: 80 }} placeholder="Add notes for the applicant..."
                                value={remarks} onChange={e => setRemarks(e.target.value)} />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button className="btn btn-ghost flex-1" onClick={() => { setSelectedApp(null); setRemarks(''); }}>Cancel</button>
                            <button className="btn btn-danger flex-1" onClick={() => handleAction(selectedApp.id, 'Rejected')}>Reject</button>
                            <button className="btn btn-success flex-1" onClick={() => handleAction(selectedApp.id, 'Approved')}>Approve</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
