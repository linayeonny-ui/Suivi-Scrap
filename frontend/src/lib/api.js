import axios from 'axios'

const API_BASE = 'https://fatilina.pythonanywhere.com/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          })
          localStorage.setItem('access_token', res.data.access_token)
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/admin/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  changePassword: (old_password, new_password) =>
    api.post('/auth/change-password', { old_password, new_password }),
}

// ── QR Codes ────────────────────────────────────────────────────────────────
export const qrAPI = {
  list: (params) => api.get('/qr-codes/', { params }),
  get: (id) => api.get(`/qr-codes/${id}`),
  create: (data) => api.post('/qr-codes/', data),
  update: (id, data) => api.put(`/qr-codes/${id}`, data),
  delete: (id) => api.delete(`/qr-codes/${id}`),
  getImage: (id, baseUrl) => api.get(`/qr-codes/${id}/image`, { params: { base_url: baseUrl } }),
  scan: (code) => api.get(`/qr-codes/${code}/scan`),
}

// ── Scrap ────────────────────────────────────────────────────────────────────
export const scrapAPI = {
  verifyOperatorCode: (code) => api.post('/scrap/verify-code', { code }),
  createSession: (qr_code_id, operator_code) => api.post('/scrap/session', { qr_code_id, operator_code }),
  getSession: (id) => api.get(`/scrap/session/${id}`),
  addEntry: (sessionId, data) => api.post(`/scrap/session/${sessionId}/entry`, data),
  addEntriesBatch: (sessionId, data) => api.post(`/scrap/session/${sessionId}/entries-batch`, data),
  deleteEntry: (sessionId, entryId) => api.delete(`/scrap/session/${sessionId}/entry/${entryId}`),
  completeSession: (sessionId, total_weight) =>
    api.post(`/scrap/session/${sessionId}/complete`, { total_weight }),
  searchWire: (q) => api.get('/scrap/wire-search', { params: { q } }),
  getPostesByArea: (areaId) => api.get(`/scrap/postes-by-area/${areaId}`),
}

// ── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  listSessions: (params) => api.get('/admin/sessions', { params }),
  getSession: (id) => api.get(`/admin/sessions/${id}`),
  updateSession: (id, data) => api.put(`/admin/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/admin/sessions/${id}`),
  listEntries: (params) => api.get('/admin/entries', { params }),
  updateEntry: (id, data) => api.put(`/admin/entries/${id}`, data),
  deleteEntry: (id) => api.delete(`/admin/entries/${id}`),
  listUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  exportData: (params) => api.get('/admin/export', { params, responseType: 'blob' }),
  listOperatorCodes: () => api.get('/admin/operator-codes'),
  createOperatorCode: (data) => api.post('/admin/operator-codes', data),
  updateOperatorCode: (id, data) => api.put(`/admin/operator-codes/${id}`, data),
  deleteOperatorCode: (id) => api.delete(`/admin/operator-codes/${id}`),
  generateOperatorCode: (label) => api.post('/admin/operator-codes/generate', { label }),
}

// ── Reference Data ──────────────────────────────────────────────────────────
export const refAPI = {
  listAreas: () => api.get('/reference/areas'),
  createArea: (data) => api.post('/reference/areas', data),
  updateArea: (id, data) => api.put(`/reference/areas/${id}`, data),
  deleteArea: (id) => api.delete(`/reference/areas/${id}`),
  listPostes: (areaId) => api.get('/reference/postes', { params: { area_id: areaId } }),
  createPoste: (data) => api.post('/reference/postes', data),
  updatePoste: (id, data) => api.put(`/reference/postes/${id}`, data),
  deletePoste: (id) => api.delete(`/reference/postes/${id}`),
  listTypeScraps: () => api.get('/reference/type-scraps'),
  createTypeScrap: (data) => api.post('/reference/type-scraps', data),
  updateTypeScrap: (id, data) => api.put(`/reference/type-scraps/${id}`, data),
  deleteTypeScrap: (id) => api.delete(`/reference/type-scraps/${id}`),
  listRaisons: () => api.get('/reference/raisons'),
  createRaison: (data) => api.post('/reference/raisons', data),
  updateRaison: (id, data) => api.put(`/reference/raisons/${id}`, data),
  deleteRaison: (id) => api.delete(`/reference/raisons/${id}`),
}

// ── Uploads ─────────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadWireMapping: (file, mode) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode || 'replace')
    return api.post('/uploads/wire-mapping', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listWireMappings: (params) => api.get('/uploads/wire-mapping', { params }),
  deleteWireMapping: (id) => api.delete(`/uploads/wire-mapping/${id}`),
  clearWireMappings: () => api.post('/uploads/wire-mapping/clear'),
}

export default api
