import axios from 'axios'

// URL vide = appels relatifs → proxy Vite achemine vers le backend (Docker ou dev)
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return api.post('/api/auth/token', form)
  },
  me: () => api.get('/api/auth/me'),
}

export const internalApi = {
  latest: () => api.get('/api/internal/latest'),
  history: (hours = 24, limit = 500) => api.get(`/api/internal/history?hours=${hours}&limit=${limit}`),
  stats: (hours = 24) => api.get(`/api/internal/stats?hours=${hours}`),
}

export const externalApi = {
  latest: () => api.get('/api/external/latest'),
  history: (hours = 24, limit = 200) => api.get(`/api/external/history?hours=${hours}&limit=${limit}`),
}

export const devicesApi = {
  list: () => api.get('/api/devices/'),
  updateStatus: (id: string, status: string) => api.patch(`/api/devices/${id}/status`, { status }),
  summary: () => api.get('/api/devices/summary'),
}

export const alertsApi = {
  list: (limit = 50, unacknowledgedOnly = false) =>
    api.get(`/api/alerts/?limit=${limit}&unacknowledged_only=${unacknowledgedOnly}`),
  acknowledge: (id: number) => api.post(`/api/alerts/${id}/acknowledge`),
  stats: () => api.get('/api/alerts/stats'),
}

// WS relatif : ws:// + même host que le navigateur → proxy Vite achemine vers backend
const _wsBase = import.meta.env.VITE_WS_URL
  || (typeof window !== 'undefined'
    ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
    : 'ws://localhost:3000')
export const WS_URL = _wsBase + '/ws/live'
