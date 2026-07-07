import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const customerToken = localStorage.getItem('customer_token')
  const adminToken = localStorage.getItem('admin_token')
  const isAdminRoute = config.url?.startsWith('/admin')

  const token = isAdminRoute ? adminToken : customerToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      if (url.includes('/admin')) {
        localStorage.removeItem('admin_token')
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login'
        }
      } else if (!url.includes('/auth/')) {
        localStorage.removeItem('customer_token')
        localStorage.removeItem('customer')
      }
    }
    return Promise.reject(error)
  }
)

export default api
