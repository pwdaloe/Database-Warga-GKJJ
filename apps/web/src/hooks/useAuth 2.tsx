'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  loginRequest,
  getMeRequest,
  logoutRequest,
  saveToken,
  clearToken,
  getToken,
  type AuthUser,
} from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Cek sesi yang sudah ada saat pertama load
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMeRequest()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user } = await loginRequest(username, password)
    saveToken(token)
    setUser(user)
    router.push('/dashboard')
  }, [router])

  const logout = useCallback(async () => {
    await logoutRequest()
    clearToken()
    setUser(null)
    router.push('/login')
  }, [router])

  const isRole = useCallback(
    (...roles: string[]) => !!user && roles.includes(user.role),
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
