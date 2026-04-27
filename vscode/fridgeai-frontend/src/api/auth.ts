import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/me')
    if (error.response?.status === 401 && !error.config._retry && !isAuthCheck) {
      error.config._retry = true
      try {
        await axios.post(
          `/auth/refresh`,
          {},
          { withCredentials: true }
        )
        return api(error.config)
      } catch {
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const getMe = () => api.get('/auth/me').then((r) => r.data)
export const logout = () => api.post('/auth/logout').then((r) => r.data)
export const getGoogleLoginUrl = () =>
  api.get('/auth/google/login').then((r) => r.data.authorization_url)

export default api
