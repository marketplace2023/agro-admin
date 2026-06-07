import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, getToken, setToken, clearToken } from '@/lib/api'

export interface AdminUser {
  id: number
  name: string
  email: string
  roles?: string[]
}

interface AuthState {
  user: AdminUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState>(null!)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setIsLoading(false); return }
    api.get<AdminUser>('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string }>('/auth/login', { email, password })
    setToken(res.token)
    const me = await api.get<AdminUser>('/auth/me')
    setUser(me)
  }

  function logout() {
    clearToken()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AuthContext)
}
