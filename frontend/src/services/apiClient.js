import axios from 'axios'
import { useAuthStore } from '../store'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8001/api'
    : '/api');

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  // For refresh endpoint, ensure cookies are sent
  if (config.url && config.url.endsWith('/auth/refresh')) {
    config.withCredentials = true
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResp = await api.post('/auth/refresh', {}, { withCredentials: true })
        const newToken = refreshResp.data?.access_token
        if (newToken) {
          localStorage.setItem('token', newToken)
          // update store if available
          try { useAuthStore.getState().setToken(newToken) } catch (e) {}
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken
          processQueue(null, newToken)
          return api(originalRequest)
        }
      } catch (err) {
        processQueue(err, null)
        // clear auth state
        try { useAuthStore.getState().logout() } catch (e) {}
        // Redirect to login
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
