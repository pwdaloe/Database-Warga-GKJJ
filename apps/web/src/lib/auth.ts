import { api } from './api'

export interface AuthUser {
  id: number
  nama: string
  username: string
  email: string
  role: string
  kelompokId: number | null
  kelompok: { id: number; kode: string; nama: string } | null
  wargaId: number | null
  warga: { id: number; namaLengkap: string; fotoUrl: string | null } | null
  lastLogin: string | null
}

export async function loginRequest(username: string, password: string) {
  const res = await api.post<{ success: boolean; data: { token: string; user: AuthUser } }>(
    '/auth/login',
    { username, password },
  )
  return res.data.data
}

export async function getMeRequest(): Promise<AuthUser> {
  const res = await api.get<{ success: boolean; data: AuthUser }>('/auth/me')
  return res.data.data
}

export async function logoutRequest() {
  await api.post('/auth/logout').catch(() => {})
}

export async function forgotPasswordRequest(usernameOrEmail: string) {
  const res = await api.post<{ success: boolean; data: { message: string } }>(
    '/auth/forgot-password',
    { usernameOrEmail },
  )
  return res.data.data
}

export async function resetPasswordRequest(token: string, passwordBaru: string) {
  const res = await api.post<{ success: boolean; data: { message: string } }>(
    '/auth/reset-password',
    { token, passwordBaru },
  )
  return res.data.data
}

export function saveToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  KEPALA_KANTOR: 'Kepala Kantor',
  MAJELIS: 'Majelis',
  STAF_ADMIN: 'Staf Administrasi',
  PENATUA_KELOMPOK: 'Penatua Kelompok',
  VIEWER: 'Viewer',
}

export const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-red-100 text-red-700',
  KEPALA_KANTOR: 'bg-purple-100 text-purple-700',
  MAJELIS: 'bg-blue-100 text-blue-700',
  STAF_ADMIN: 'bg-green-100 text-green-700',
  PENATUA_KELOMPOK: 'bg-yellow-100 text-yellow-700',
  VIEWER: 'bg-gray-100 text-gray-700',
}
