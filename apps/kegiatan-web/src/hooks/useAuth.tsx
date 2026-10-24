'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { clearToken, getToken, loginRequest, meRequest, saveToken } from '@/lib/auth'
import type { Pengguna, Peran } from '@/lib/tipe'

interface AuthValue {
  user: Pengguna | null
  loading: boolean
  login: (username: string, password: string) => Promise<Pengguna>
  logout: () => void
  muatUlang: () => Promise<void>
  adalah: (...peran: Peran[]) => boolean
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Pengguna | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    meRequest()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await loginRequest(username, password)
    saveToken(token)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    router.push('/login')
  }, [router])

  const muatUlang = useCallback(async () => setUser(await meRequest()), [])
  const adalah = useCallback((...peran: Peran[]) => !!user && peran.includes(user.peran), [user])

  return <AuthContext.Provider value={{ user, loading, login, logout, muatUlang, adalah }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
