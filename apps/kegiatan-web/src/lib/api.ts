import axios from 'axios'

export const TOKEN_KEY = 'kegiatan_token'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4200/api',
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status
      const kode = error.response?.data?.details?.kode
      if (status === 401 && !String(error.config?.url ?? '').includes('/auth/login')) {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = '/login'
      } else if (status === 403 && kode === 'GANTI_PASSWORD' && window.location.pathname !== '/ganti-password') {
        window.location.href = '/ganti-password'
      }
    }
    return Promise.reject(error)
  },
)

/** Pesan galat yang ramah dari respons API. */
export function pesanGalat(e: unknown, bawaan = 'Terjadi kesalahan. Coba lagi.'): string {
  const d = (e as { response?: { data?: { error?: string; details?: unknown } } })?.response?.data
  if (!d) return (e as Error)?.message?.includes('Network') ? 'Tidak dapat terhubung ke server.' : bawaan
  const rincian = d.details
  if (Array.isArray(rincian) && rincian.length > 0) {
    const baris = rincian.map((x: { field?: string; message?: string }) => (x.field ? `${x.field}: ${x.message}` : x.message)).filter(Boolean)
    return `${d.error ?? 'Validasi gagal'}: ${baris.slice(0, 4).join('; ')}`
  }
  return d.error ?? bawaan
}

/** Daftar masalah dari penolakan "program belum lengkap" (details.masalah). */
export function daftarMasalah(e: unknown): string[] {
  const m = (e as { response?: { data?: { details?: { masalah?: unknown } } } })?.response?.data?.details?.masalah
  return Array.isArray(m) ? m.map(String) : []
}
