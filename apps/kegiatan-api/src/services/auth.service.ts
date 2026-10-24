import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import { rahasiaJwt } from '../middleware/auth.js'
import { catatAudit } from './audit.service.js'

// Hash palsu untuk menyamakan waktu respons saat username tidak ada (mencegah enumerasi akun lewat waktu).
const HASH_PALSU = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.1n2o5gH3h8yW7yH2m1G8X4tq3m5K'

export const ringkasPengguna = {
  id: true,
  username: true,
  nama: true,
  email: true,
  whatsapp: true,
  peran: true,
  unitId: true,
  bidangId: true,
  wajibGantiPassword: true,
  unit: { select: { id: true, kode: true, nama: true, singkatan: true, jenis: true, bidangId: true } },
  bidang: { select: { id: true, kode: true, nama: true } },
} as const

export async function login(username: string, password: string, ip: string | null) {
  const user = await prisma.pengguna.findFirst({
    where: { username: { equals: username, mode: 'insensitive' }, aktif: true },
    select: { ...ringkasPengguna, passwordHash: true },
  })

  const cocok = await bcrypt.compare(password, user?.passwordHash ?? HASH_PALSU)
  if (!user || !cocok) throw new AppError(401, 'Username atau password salah')

  await prisma.pengguna.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
  await catatAudit({ penggunaId: user.id, aksi: 'LOGIN', entitas: 'pengguna', entitasId: user.id, ipAddress: ip })

  const token = jwt.sign({ sub: user.id }, rahasiaJwt(), {
    expiresIn: (process.env['JWT_EXPIRES_IN'] ?? '12h') as jwt.SignOptions['expiresIn'],
  })
  const { passwordHash: _hash, ...publik } = user
  return { token, user: publik }
}

export async function profil(id: number) {
  const user = await prisma.pengguna.findUnique({ where: { id }, select: ringkasPengguna })
  if (!user) throw new AppError(404, 'Akun tidak ditemukan')
  return user
}

export const MIN_PASSWORD = 10

export async function gantiPassword(id: number, lama: string, baru: string, ip: string | null) {
  if (baru.length < MIN_PASSWORD) throw new AppError(400, `Password baru minimal ${MIN_PASSWORD} karakter`)
  const user = await prisma.pengguna.findUnique({ where: { id }, select: { passwordHash: true } })
  if (!user || !(await bcrypt.compare(lama, user.passwordHash))) throw new AppError(400, 'Password lama salah')
  if (await bcrypt.compare(baru, user.passwordHash)) throw new AppError(400, 'Password baru tidak boleh sama dengan yang lama')
  await prisma.pengguna.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(baru, 10), wajibGantiPassword: false },
  })
  await catatAudit({ penggunaId: id, aksi: 'GANTI_PASSWORD', entitas: 'pengguna', entitasId: id, ipAddress: ip })
}
