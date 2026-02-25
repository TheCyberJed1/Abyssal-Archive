import axios from 'axios'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.detail || err.message
    return Promise.reject(new Error(message))
  }
)

export const api = {
  knowledge: {
    list: (params) => http.get('/knowledge/', { params }),
    get: (id) => http.get(`/knowledge/${id}`),
    create: (data) => http.post('/knowledge/', data),
    update: (id, data) => http.patch(`/knowledge/${id}`, data),
    delete: (id) => http.delete(`/knowledge/${id}`),
    search: (data) => http.post('/knowledge/search/semantic', data),
  },
  graph: {
    full: (params) => http.get('/graph/', { params }),
    entry: (id, depth) => http.get(`/graph/entry/${id}`, { params: { depth } }),
    mitre: () => http.get('/graph/mitre'),
  },
  archivist: {
    chat: (data) => http.post('/archivist/chat', data),
    autoTag: (content) => http.post('/archivist/auto-tag', { content }),
    skillGap: (techniques) => http.post('/archivist/skill-gap', { mitre_techniques: techniques }),
    convertNotes: (content) => http.post('/archivist/convert', { content }),
  },
  ingest: {
    submit: (data) => http.post('/ingest/', data),
    listJobs: () => http.get('/ingest/jobs'),
    getJob: (id) => http.get(`/ingest/jobs/${id}`),
  },
  health: () => http.get('/health'),
  export: {
    ndjson: () => window.open('/api/v1/export/ndjson', '_blank'),
  },
}
