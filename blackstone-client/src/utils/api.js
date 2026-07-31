const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
}

export const vehicles = {
  list: () => api.get('/vehicles', { auth: false }),
  create: (payload) => api.post('/vehicles', payload),
  update: (id, payload) => api.patch(`/vehicles/${id}`, payload),
  remove: (id) => api.delete(`/vehicles/${id}`),
}

export const bookings = {
  create: (payload) => api.post('/bookings', payload),
  confirm: (payload) => api.post('/bookings/confirm', payload),
  my: () => api.get('/bookings/my'),
  all: (query = '') => api.get(`/bookings/all${query}`),
  assignDriver: (id, driverId) => api.patch(`/bookings/${id}/assign-driver`, { driverId }),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  driver: () => api.get('/bookings/driver'),
}

export const enquiries = {
  submit: (payload) => api.post('/enquiries', payload, { auth: false }),
}

export const admin = {
  users: () => api.get('/admin/users'),
  approveUser: (id) => api.patch(`/admin/users/${id}/approve`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
}

export { getToken }
