import axios from 'axios'

const getBaseURL = () => {
    const url = import.meta.env.VITE_API_URL
    if (!url) return '/api'
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`
}

const api = axios.create({
    baseURL: getBaseURL(),
    headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token automatically
api.interceptors.request.use(config => {
    const token = localStorage.getItem('sg_access_token') // Changed from 'sg_token' to 'sg_access_token'
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auth
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const adminLogin = (data) => api.post('/auth/admin/login', data)

// Schemes
export const getSchemes = () => api.get('/schemes/')
export const getAllSchemes = () => api.get('/schemes/all')
export const createScheme = (data) => api.post('/schemes/', data)
export const updateScheme = (id, data) => api.put(`/schemes/${id}`, data)
export const deleteScheme = (id) => api.delete(`/schemes/${id}`)
export const uploadSchemeGuidelines = (id, formData) => api.post(`/admin/schemes/${id}/guidelines`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// Documents / Applications
export const uploadDocument = (formData) =>
    api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getUserApplications = () => api.get('/applications')
export const getApplication = (id) => api.get(`/applications/${id}`)
export const generateAppeal = (data) => api.post('/appeal', data)
export const submitAppeal = (id, data) => api.post(`/applications/${id}/appeal`, data)

// Admin
export const getAdminStats = () => api.get('/admin/stats')
export const getAdminApplications = (params) => api.get('/admin/applications', { params })
export const updateApplicationStatus = (id, data) => api.put(`/admin/applications/${id}/status`, data)

export default api
