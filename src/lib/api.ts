const BASE = '/api'

export function getToken(): string | null {
  return localStorage.getItem('admin_token')
}
export function setToken(token: string): void {
  localStorage.setItem('admin_token', token)
}
export function clearToken(): void {
  localStorage.removeItem('admin_token')
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('No autorizado')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || `Error ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as T
}

export const api = {
  get:    <T>(path: string)               => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH',  path, body),
  del:    <T>(path: string)               => request<T>('DELETE', path),
}
