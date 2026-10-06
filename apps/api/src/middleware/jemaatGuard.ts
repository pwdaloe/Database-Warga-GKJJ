import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler.js'

/**
 * Pagar global untuk role JEMAAT (fail-closed).
 *
 * Banyak route lama hanya memakai `authenticate` tanpa `authorize` (mis. GET /warga, /keluarga, /dashboard),
 * sehingga role baru otomatis lolos ke sana. Pagar ini menolak JEMAAT di SEMUA route kecuali daftar izin di bawah,
 * sebelum router mana pun dijalankan. Route baru otomatis tertutup bagi JEMAAT sampai ditambahkan ke daftar ini.
 */
const IZIN: { method?: string; prefix: string }[] = [
  { prefix: '/api/profil-saya' },
  { prefix: '/api/hubungi', method: 'GET' },
  { prefix: '/api/auth' },
  { prefix: '/api/system' },
  { prefix: '/api/public' },
  { prefix: '/api/pengaturan/kelurahan', method: 'GET' }, // autocomplete alamat
]

export function jemaatGuard(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  const secret = process.env.JWT_SECRET
  if (!auth?.startsWith('Bearer ') || !secret) return next() // tanpa token valid: authenticate yang menolak

  let role: string | undefined
  try {
    role = (jwt.verify(auth.slice(7), secret) as { role?: string }).role
  } catch {
    return next()
  }
  if (role !== 'JEMAAT') return next()

  const path = req.originalUrl.split('?')[0]!
  const boleh = IZIN.some(
    (i) => (path === i.prefix || path.startsWith(i.prefix + '/')) && (!i.method || i.method === req.method),
  )
  if (!boleh) throw new AppError(403, 'Akses ditolak untuk akun jemaat')
  next()
}
