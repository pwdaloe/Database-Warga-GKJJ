import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok, created } from '../utils/response.js'

export const usersRouter = Router()
usersRouter.use(authenticate)
usersRouter.use(authorize('SUPERADMIN', 'KEPALA_KANTOR'))

const ROLES = ['SUPERADMIN','KEPALA_KANTOR','MAJELIS','STAF_ADMIN','PENATUA_KELOMPOK','VIEWER'] as const

const userSelect = {
  id: true, nama: true, username: true, email: true,
  role: true, aktif: true, kelompokId: true, lastLogin: true,
  createdAt: true,
  kelompok: { select: { id: true, kode: true, nama: true } },
  warga:    { select: { id: true, namaLengkap: true, fotoUrl: true } },
}

// GET /api/users
usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: [{ aktif: 'desc' }, { nama: 'asc' }],
  })
  ok(res, users)
})

const createSchema = z.object({
  nama:        z.string().min(2).max(150),
  username:    z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, 'Hanya huruf, angka, titik, underscore, strip'),
  email:       z.string().email().max(100),
  password:    z.string().min(8, 'Password minimal 8 karakter'),
  role:        z.enum(ROLES),
  kelompokId:  z.number().int().positive().optional().nullable(),
  wargaId:     z.number().int().positive().optional().nullable(),
})

// POST /api/users
usersRouter.post('/', async (req, res) => {
  const data = createSchema.parse(req.body)

  // Cek duplikat username / email
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  })
  if (existing) {
    const field = existing.username === data.username ? 'Username' : 'Email'
    throw new Error(`${field} sudah digunakan`)
  }

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await prisma.user.create({
    data: {
      nama: data.nama,
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
      kelompokId: data.kelompokId ?? null,
      wargaId: data.wargaId ?? null,
    },
    select: userSelect,
  })
  created(res, user)
})

const updateSchema = z.object({
  nama:       z.string().min(2).max(150),
  username:   z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  email:      z.string().email().max(100),
  role:       z.enum(ROLES),
  kelompokId: z.number().int().positive().optional().nullable(),
  wargaId:    z.number().int().positive().optional().nullable(),
})

// PUT /api/users/:id
usersRouter.put('/:id', async (req, res) => {
  const id = Number(req.params['id'])
  const data = updateSchema.parse(req.body)

  // Cek duplikat (kecuali diri sendiri)
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
      NOT: { id },
    },
  })
  if (existing) {
    const field = existing.username === data.username ? 'Username' : 'Email'
    throw new Error(`${field} sudah digunakan oleh pengguna lain`)
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      nama: data.nama,
      username: data.username,
      email: data.email,
      role: data.role,
      kelompokId: data.kelompokId ?? null,
      wargaId: data.wargaId ?? null,
    },
    select: userSelect,
  })
  ok(res, user)
})

// PATCH /api/users/:id/toggle — aktifkan / nonaktifkan
usersRouter.patch('/:id/toggle', async (req, res) => {
  const id = Number(req.params['id'])
  const current = await prisma.user.findUniqueOrThrow({ where: { id } })
  const user = await prisma.user.update({
    where: { id },
    data: { aktif: !current.aktif },
    select: userSelect,
  })
  ok(res, user)
})

// POST /api/users/:id/reset-password
usersRouter.post('/:id/reset-password', async (req, res) => {
  const id = Number(req.params['id'])
  const { password } = z.object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
  }).parse(req.body)

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })
  ok(res, { message: 'Password berhasil direset' })
})
