import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok, created } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'
import { generatePassword } from '../utils/password.js'
import { normalizeWa, waLink, maskWa } from '../utils/waNumber.js'
import { getTemplate, renderTemplate, portalUrl, TEMPLATE_KODE } from '../services/pesan.service.js'

export const usersRouter = Router()
usersRouter.use(authenticate)
usersRouter.use(authorize('SUPERADMIN', 'KEPALA_KANTOR'))

export const ROLES = ['SUPERADMIN','KEPALA_KANTOR','MAJELIS','STAF_ADMIN','PENATUA_KELOMPOK','VIEWER'] as const

const userSelect = {
  id: true, nama: true, username: true, email: true, whatsapp: true,
  mustChangePassword: true,
  role: true, aktif: true, kelompokId: true, lastLogin: true,
  createdAt: true,
  kelompok: { select: { id: true, kode: true, nama: true } },
  warga:    { select: { id: true, namaLengkap: true, fotoUrl: true, whatsapp: true } },
}

// GET /api/users
usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: [{ aktif: 'desc' }, { nama: 'asc' }],
  })
  ok(res, users)
})

const waField = z.string().max(25).optional().nullable()

/** Normalisasi nomor WA dari input; kosong → null; tidak valid → 400. */
function parseWa(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null
  const n = normalizeWa(input)
  if (!n) throw new AppError(400, 'Nomor WhatsApp tidak valid')
  return n
}

const createSchema = z.object({
  nama:        z.string().min(2).max(150),
  username:    z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, 'Hanya huruf, angka, titik, underscore, strip'),
  email:       z.string().email().max(100),
  whatsapp:    waField,
  // Kosong → dibuat acak oleh server (dan akun wajib ganti password saat login pertama)
  password:    z.string().min(8, 'Password minimal 8 karakter').optional(),
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

  if (data.wargaId) {
    const taken = await prisma.user.findUnique({ where: { wargaId: data.wargaId } })
    if (taken) throw new AppError(400, 'Warga ini sudah memiliki akun pengguna')
  }

  const generated = !data.password
  const password = data.password ?? generatePassword()
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      nama: data.nama,
      username: data.username,
      email: data.email,
      whatsapp: parseWa(data.whatsapp),
      passwordHash,
      mustChangePassword: generated,
      role: data.role,
      kelompokId: data.kelompokId ?? null,
      wargaId: data.wargaId ?? null,
    },
    select: userSelect,
  })
  // Password acak hanya dikembalikan sekali ini; tidak disimpan dalam bentuk apa pun.
  created(res, generated ? { ...user, passwordAwal: password } : user)
})

const updateSchema = z.object({
  nama:       z.string().min(2).max(150),
  username:   z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  email:      z.string().email().max(100),
  whatsapp:   waField,
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
      whatsapp: parseWa(data.whatsapp),
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

// POST /api/users/:id/reset-password — password kosong → acak + wajib ganti saat login berikutnya
usersRouter.post('/:id/reset-password', async (req, res) => {
  const id = Number(req.params['id'])
  const { password } = z.object({
    password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  }).parse(req.body)

  const generated = !password
  const baru = password ?? generatePassword()
  const passwordHash = await bcrypt.hash(baru, 12)
  await prisma.user.update({
    where: { id },
    data: { passwordHash, ...(generated ? { mustChangePassword: true } : {}) },
  })
  ok(res, generated
    ? { message: 'Password berhasil direset', passwordBaru: baru }
    : { message: 'Password berhasil direset' })
})

// POST /api/users/:id/notifikasi — render pesan WhatsApp + tautan wa.me, catat log (password dimasker)
usersRouter.post('/:id/notifikasi', async (req, res) => {
  const id = Number(req.params['id'])
  const { templateKode, password } = z.object({
    templateKode: z.enum(TEMPLATE_KODE),
    password: z.string().min(1).max(100),
  }).parse(req.body)

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nama: true, username: true, role: true, whatsapp: true,
      kelompok: { select: { nama: true } }, warga: { select: { whatsapp: true } } },
  })
  if (!user) throw new AppError(404, 'Pengguna tidak ditemukan')

  const nomor = normalizeWa(user.whatsapp) ?? normalizeWa(user.warga?.whatsapp)
  if (!nomor) throw new AppError(400, 'Pengguna belum memiliki nomor WhatsApp yang valid')

  const tpl = await getTemplate(templateKode)
  const data = {
    nama: user.nama, username: user.username, url_portal: portalUrl(),
    role: user.role, kelompok: user.kelompok?.nama ?? '',
  }
  const pesan = renderTemplate(tpl.isi, { ...data, password })
  await prisma.notifikasiLog.create({
    data: {
      userId: user.id, templateKode, nomorMasker: maskWa(nomor),
      pesanMasker: renderTemplate(tpl.isi, { ...data, password: '********' }),
      createdBy: req.user!.userId,
    },
  })
  ok(res, { nomor, pesan, waLink: waLink(nomor, pesan) })
})
