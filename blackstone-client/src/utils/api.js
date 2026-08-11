const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

function getToken() {
  return localStorage.getItem('bc_token')
}

async function request(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers }

  if (auth) {
    const token = getToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null

  if (!res.ok) {
    const message = data?.message || res.statusText
    throw new Error(message)
  }

  return data
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}

export const auth = {
  register: (payload) => api.post('/auth/register', payload, { auth: false }),
  login: (payload) => api.post('/auth/login', payload, { auth: false }),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.patch('/auth/me', payload),
  changePassword: (payload) => api.patch('/auth/password', payload),
}

export const vehicles = {
  list: () => api.get('/vehicles', { auth: false }),
  create: (payload) => api.post('/vehicles', payload),
  update: (id, payload) => api.patch(`/vehicles/${id}`, payload),
  remove: (id) => api.delete(`/vehicles/${id}`),
}

export const bookings = {
  create: (payload) => api.post('/bookings', payload),
  createProvider: (payload) => api.post('/bookings/provider', payload),
  parseWhatsapp: (text) => api.post('/bookings/parse-whatsapp', { text }),
  confirm: (payload) => api.post('/bookings/confirm', payload),
  my: (query = '') => api.get(`/bookings/my${query}`),
  all: (query = '') => api.get(`/bookings/all${query}`),
  updateDetails: (id, payload) => api.patch(`/bookings/${id}`, payload),
  assignDriver: (id, driverId, driverPrice) => api.patch(`/bookings/${id}/assign-driver`, { driverId, driverPrice }),
  drivers: () => api.get('/bookings/drivers'),
  providers: () => api.get('/bookings/providers'),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  setPaymentStatus: (id, status) => api.patch(`/bookings/${id}/payment-status`, { status }),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  remove: (id) => api.delete(`/bookings/${id}`),
  driver: () => api.get('/bookings/driver'),
  downloadInvoice: (id) => downloadFile(`/bookings/${id}/invoice`, `invoice-${id}.pdf`),
  downloadMyReport: (query = '') => downloadFile(`/bookings/my/report${query}`, 'my-bookings.pdf'),
  downloadAllReport: (query = '') => downloadFile(`/bookings/all/report${query}`, 'all-bookings.pdf'),
}

// Fetches a protected binary (PDF) endpoint with the auth header attached —
// a plain <a href> can't send an Authorization header, so this fetches the
// file as a blob and triggers the browser's save dialog manually.
async function downloadFile(path, filename) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || 'Download failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const enquiries = {
  submit: (payload) => api.post('/enquiries', payload, { auth: false }),
}

export const reviews = {
  get: () => api.get('/reviews', { auth: false }),
}

export const admin = {
  users: () => api.get('/admin/users'),
  createUser: (payload) => api.post('/admin/users', payload),
  approveUser: (id) => api.patch(`/admin/users/${id}/approve`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  vehicles: () => api.get('/admin/vehicles'),
  stats: (role, userId) => api.get(`/admin/stats?role=${role}${userId ? `&user_id=${userId}` : ''}`),
  providerPayments: (providerId) => api.get(`/admin/provider-payments/${providerId}`),
  setProviderPayment: (payload) => api.patch('/admin/provider-payments', payload),
}

export const permissions = {
  get: () => api.get('/permissions'),
  update: (payload) => api.patch('/permissions', payload),
}

export { getToken }
