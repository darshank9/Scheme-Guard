import { useEffect, useState, useRef } from 'react'
import { getAllSchemes, createScheme, updateScheme, deleteScheme, uploadSchemeGuidelines } from '../api'
import toast from 'react-hot-toast'

export default function SchemeManagement() {
    const [schemes, setSchemes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState({ name: '', description: '', income_limit: 450000, category: 'General', required_docs: '', is_active: true })
    const fileInputRef = useRef(null)
    const [uploadingId, setUploadingId] = useState(null)

    useEffect(() => { load() }, [])

    const load = () => {
        setLoading(true)
        getAllSchemes().then(r => setSchemes(r.data)).catch(() => { }).finally(() => setLoading(false))
    }

    const handleOpen = (s = null) => {
        if (s) {
            setEditId(s.id)
            setForm({ ...s })
        } else {
            setEditId(null)
            setForm({ name: '', description: '', income_limit: 450000, category: 'General', required_docs: '', is_active: true })
        }
        setShowModal(true)
    }

    const submit = async e => {
        e.preventDefault()
        try {
            if (editId) await updateScheme(editId, form)
            else await createScheme(form)
            toast.success(`Scheme ${editId ? 'updated' : 'created'} successfully!`)
            setShowModal(false)
            load()
        } catch (err) { toast.error('Failed to save scheme.') }
    }

    const remove = async id => {
        if (!confirm('Are you sure you want to delete this scheme?')) return
        try {
            await deleteScheme(id)
            toast.success('Scheme deleted.')
            load()
        } catch (err) { toast.error('Delete failed.') }
    }

    const handleUploadClick = (id) => {
        setUploadingId(id)
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !uploadingId) return

        if (file.type !== 'application/pdf') {
            toast.error("Please upload a PDF file.")
            e.target.value = ''
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        const loadingToast = toast.loading('Uploading and building AI Index...')
        try {
            await uploadSchemeGuidelines(uploadingId, formData)
            toast.success('Guidelines indexed successfully!', { id: loadingToast })
            load()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to upload guidelines.', { id: loadingToast })
        } finally {
            e.target.value = ''
            setUploadingId(null)
        }
    }

    return (
        <div className="page float-in">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf"
                onChange={handleFileChange}
            />
            <div className="flex-between mb-8">
                <div>
                    <h1 className="page-title">🏛️ Scheme Management</h1>
                    <p className="page-subtitle">Add, edit, or remove government schemes</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpen()}>➕ Add New Scheme</button>
            </div>

            <div className="table-wrap">
                {loading ? <div className="text-center p-8">⏳ Loading...</div> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Scheme Name</th>
                                <th>Category</th>
                                <th>Income Limit</th>
                                <th>Docs Required</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schemes.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.name}</strong></td>
                                    <td><span className="badge badge-info">{s.category}</span></td>
                                    <td>₹{Number(s.income_limit).toLocaleString('en-IN')}</td>
                                    <td style={{ maxWidth: 200, fontSize: 12 }}>{s.required_docs}</td>
                                    <td>
                                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(s)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>Delete</button>
                                            <button
                                                className="btn btn-saffron btn-sm"
                                                title="Upload Guidelines PDF for AI Verification"
                                                onClick={() => handleUploadClick(s.id)}
                                                disabled={uploadingId === s.id}
                                            >
                                                {uploadingId === s.id ? '⏳' : (s.guidelines_pdf_path ? '🔄 Update PDF' : '📄 Upload PDF')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 className="modal-title">{editId ? 'Edit Scheme' : 'Add New Scheme'}</h2>
                        <form onSubmit={submit}>
                            <div className="form-group">
                                <label className="form-label">Scheme Name</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {['Education', 'Housing', 'Health', 'Agriculture', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Income Limit (Annual ₹)</label>
                                <input type="number" className="form-input" value={form.income_limit} onChange={e => setForm({ ...form, income_limit: Number(e.target.value) })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" style={{ height: 80 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Required Documents (Comma separated)</label>
                                <input className="form-input" value={form.required_docs} onChange={e => setForm({ ...form, required_docs: e.target.value })} />
                            </div>
                            <div className="form-group flex gap-2" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0 }}>Keep Scheme Active</label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Save Scheme</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
