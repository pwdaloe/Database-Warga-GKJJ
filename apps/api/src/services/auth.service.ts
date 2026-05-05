import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { JwtPayload } from '../middleware/auth.js'

export async function login(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
      aktif: true,
    },
    include: {
      kelompok: { select: { id: true, kode: true, nama: true } },
      warga: { select: { id: true, namaLengkap: true, fotoUrl: true } },
    },
  })

  if (!user) throw new AppError(401, 'Username atau password salah')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Username atau password salah')

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
    kelompokId: user.kelompokId,
  }

  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET tidak dikonfigurasi')

  const token = jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  })

  return {
    token,
    user: {
      id: user.id,
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
      kelompokId: user.kelompokId,
      kelompok: user.kelompok,
      wargaId: user.wargaId,
      warga: user.warga,
    },
  }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId, aktif: true },
    select: {
      id: true,
      nama: true,
      username: true,
      email: true,
      role: true,
      kelompokId: true,
      kelompok: { select: { id: true, kode: true, nama: true } },
      wargaId: true,
      warga: { select: { id: true, namaLengkap: true, fotoUrl: true } },
      lastLogin: true,
    },
  })

  if (!user) throw new AppError(401, 'Sesi tidak valid')
  return user
}

export async function changePassword(
  userId: number,
  passwordLama: string,
  passwordBaru: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User tidak ditemukan')

  const valid = await bcrypt.compare(passwordLama, user.passwordHash)
  if (!valid) throw new AppError(400, 'Password lama tidak sesuai')

  if (passwordBaru.length < 8) {
    throw new AppError(400, 'Password baru minimal 8 karakter')
  }

  const passwordHash = await bcrypt.hash(passwordBaru, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}
