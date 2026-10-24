import { api, TOKEN_KEY } from './api'
import type { Pengguna } from './tipe'

export const getToken = (): string | null => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY))
export const saveToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

export async function loginRequest(username: string, password: string): Promise<{ token: string; user: Pengguna }> {
  const r = await api.post('/auth/login', { username, password })
  return r.data.data
}

export async function meRequest(): Promise<Pengguna> {
  return (await api.get('/auth/me')).data.data
}
