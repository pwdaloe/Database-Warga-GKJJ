import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { PeranPengguna } from '../generated/prisma/client.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from './errorHandler.js'
import type { Pelaku } from '../domain/akses.js'

export interface PenggunaLogin extends Pelaku {
  username: string
  nama: string
  wajibGantiPassword: boolean
}

declare global {
  namespace Express {
    interface Request {
      user?: PenggunaLogin
    }
  }
}

export function rahasiaJwt(): string {
  const rahasia = process.env['JWT_SECRET']
  if (!rahasia) throw new Error('JWT_SECRET tidak dikonfigurasi')
  return rahasia
}

/**
 * Memverifikasi token lalu MEMBACA ULANG pengguna dari database pada setiap permintaan, sehingga akun yang
 * dinonaktifkan atau diubah peran/unitnya berlaku seketika (bukan menunggu token kedaluwarsa).
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Token autentikasi diperlukan')

  let sub: number
  try {
    const payload = jwt.verify(header.slice(7), rahasiaJwt()) as { sub?: unknown }
    if (typeof payload.sub !== 'number') throw new Error('sub tidak valid')
    sub = payload.sub
  } catch {
    throw new AppError(401, 'Token tidak valid atau sudah kedaluwarsa')
  }

  const p = await prisma.pengguna.findUnique({
    where: { id: sub },
    select: { id: true, username: true, nama: true, peran: true, unitId: true, bidangId: true, aktif: true, wajibGantiPassword: true },
  })
  if (!p || !p.aktif) throw new AppError(401, 'Akun tidak ditemukan atau dinonaktifkan')

  req.user = {
    id: p.id,
    username: p.username,
    nama: p.nama,
    peran: p.peran,
    unitId: p.unitId,
    bidangId: p.bidangId,
    wajibGantiPassword: p.wajibGantiPassword,
  }
  next()
}

/** Akun dengan password sementara hanya boleh mengganti password (dan melihat profilnya). */
export function blokirBilaWajibGanti(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.wajibGantiPassword) {
    throw new AppError(403, 'Anda harus mengganti password sementara terlebih dahulu.', { kode: 'GANTI_PASSWORD' })
  }
  next()
}

export function authorize(...peran: PeranPengguna[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, 'Tidak terautentikasi')
    if (!peran.includes(req.user.peran)) throw new AppError(403, 'Tidak memiliki izin untuk aksi ini')
    next()
  }
}

export function pelaku(req: Request): PenggunaLogin {
  if (!req.user) throw new AppError(401, 'Tidak terautentikasi')
  return req.user
}
