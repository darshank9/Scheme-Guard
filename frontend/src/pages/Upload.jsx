import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { uploadDocument, getSchemes } from '../api'

export default function Upload() {
    const navigate = useNavigate()
    const fileRef = useRef()
    const [schemes, setSchemes] = useState([])
    const [selectedScheme, setSelectedScheme] = useState('')
    const [file, setFile] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const policyFileRef = useRef()
    const [policyFile, setPolicyFile] = useState(null)
    const [policyDragOver, setPolicyDragOver] = useState(false)
    const [showPolicyUpload, setShowPolicyUpload] = useState(false)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusMsg, setStatusMsg] = useState('')

    useEffect(() => { getSchemes().then(r => setSchemes(r.data)).catch(() => { }) }, [])

    const handleDrop = (e, isPolicy = false) => {
        e.preventDefault()
        if (isPolicy) setPolicyDragOver(false)
        else setDragOver(false)
        
        const f = e.dataTransfer.files[0]
        if (f && f.type === 'application/pdf') {
            if (f.size > 10 * 1024 * 1024) { toast.error('File exceeds the 10 MB limit.'); return }
            if (isPolicy) setPolicyFile(f)
            else setFile(f)
        } else toast.error('Only PDF files are accepted.')
    }

    const handleFile = (e, isPolicy = false) => {
        const f = e.target.files[0]
        if (f) {
            if (f.size > 10 * 1024 * 1024) { toast.error('File exceeds the 10 MB limit.'); e.target.value = ''; return }
            if (isPolicy) setPolicyFile(f)
            else setFile(f)
        }
    }

    const submit = async e => {
        e.preventDefault()
        if (!file) { toast.error('Please select a PDF file.'); return }
        setLoading(true)
        const steps = [
            { msg: '📤 Uploading document...', pct: 20 },
            { msg: '🔍 Extracting information...', pct: 50 },
            { msg: '📑 Validating eligibility...', pct: 80 },
        ]
        for (const s of steps) {
            setStatusMsg(s.msg); setProgress(s.pct)
            await new Promise(r => setTimeout(r, 400))
        }
        try {
            const fd = new FormData()
            fd.append('file', file)
            if (showPolicyUpload && policyFile) fd.append('policy_file', policyFile)
            if (selectedScheme) fd.append('scheme_id', selectedScheme)
            const { data } = await uploadDocument(fd)
            setProgress(100); setStatusMsg('✅ Analysis complete!')
            toast.success('Document analysed successfully!')
            setTimeout(() => navigate(`/result/${data.application.id}`), 600)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed.')
            setLoading(false); setProgress(0); setStatusMsg('')
        }
    }

    const selectedSchemeObj = schemes.find(s => s.id === parseInt(selectedScheme))
    const adminProvidedPolicy = selectedSchemeObj?.guidelines_pdf_path

    return (
        <div className="page-md float-in">
            <h1 className="page-title">📤 Upload Document</h1>
            <p className="page-subtitle">Upload your Income Certificate (PDF) to check scheme eligibility</p>

            <form onSubmit={submit}>
                {/* Scheme selector */}
                <div className="form-group">
                    <label className="form-label">Select Scheme (Optional)</label>
                    <select className="form-input" value={selectedScheme} onChange={e => setSelectedScheme(e.target.value)}>
                        <option value="">— Auto-detect / General Check —</option>
                        {schemes.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.income_limit.toLocaleString('en-IN')})</option>)}
                    </select>
                </div>

                {/* Upload zone */}
                <div style={{ marginBottom: 24 }}>
                    <label className="form-label">Income Certificate <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => handleDrop(e, false)}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e, false)} />
                        <div className="upload-icon">📄</div>
                        {file ? (
                            <>
                                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{file.name}</div>
                                <div className="text-muted text-sm">{(file.size / 1024).toFixed(1)} KB · PDF</div>
                            </>
                        ) : (
                            <>
                                <div className="upload-text"><strong>Drag & drop</strong> your Income Certificate PDF here</div>
                                <div className="text-muted text-sm" style={{ marginTop: 8 }}>or click to browse · PDF files only</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Optional Policy Upload */}
                {!adminProvidedPolicy && (
                    <div className="card" style={{ marginBottom: 24, padding: 16, background: 'var(--surface)' }}>
                        <div className="flex-between" style={{ marginBottom: showPolicyUpload ? 16 : 0 }}>
                            <div>
                                <h4 style={{ fontSize: 15, marginBottom: 4 }}>Optional: Custom Policy Document</h4>
                                <p className="text-sm text-muted">The system doesn't have a specific policy for this scheme. You can upload one for better analysis.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={showPolicyUpload} onChange={e => setShowPolicyUpload(e.target.checked)} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        
                        {showPolicyUpload && (
                            <div
                                className={`upload-zone ${policyDragOver ? 'drag-over' : ''}`}
                                style={{ padding: '24px 16px', minHeight: 'auto', borderStyle: 'dashed' }}
                                onDragOver={e => { e.preventDefault(); setPolicyDragOver(true) }}
                                onDragLeave={() => setPolicyDragOver(false)}
                                onDrop={e => handleDrop(e, true)}
                                onClick={() => policyFileRef.current?.click()}
                            >
                                <input ref={policyFileRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e, true)} />
                                <div className="upload-icon" style={{ fontSize: 24, marginBottom: 8 }}>📜</div>
                                {policyFile ? (
                                    <>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{policyFile.name}</div>
                                        <div className="text-muted text-xs">{(policyFile.size / 1024).toFixed(1)} KB</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="upload-text" style={{ fontSize: 14 }}>Click or drag Policy PDF</div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Progress */}
                {loading && (
                    <div style={{ marginTop: 24 }}>
                        <div className="flex-between mb-2">
                            <span className="text-sm text-muted">{statusMsg}</span>
                            <span className="text-sm" style={{ color: 'var(--blue)' }}>{progress}%</span>
                        </div>
                        <div className="progress-bar-wrap">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                <button className="btn btn-primary btn-full" style={{ marginTop: 24 }} type="submit" disabled={loading || !file}>
                    {loading ? `⏳ ${statusMsg}` : '🔍 Analyse Document'}
                </button>
            </form>

            <div className="card" style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📌 Document Requirements</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Valid Income Certificate from a competent government authority',
                        'File must be in PDF format (Max 10 MB)',
                        'Certificate must have official seal / signature',
                        'Income figure must be clearly visible in the document',
                        'Name on certificate must match your registration name'].map((r, i) => (
                            <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> {r}
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    )
}
