import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok, created } from '../utils/response.js'

export const pengaturanRouter = Router()
pengaturanRouter.use(authenticate)

// ── Master Kelurahan ─────────────────────────────────────────

// GET /api/pengaturan/kelurahan?search=
pengaturanRouter.get('/kelurahan', async (req, res) => {
  const search = req.query['search'] as string | undefined
  const data = await prisma.masterKelurahan.findMany({
    where: search ? {
      OR: [
        { nama: { contains: search, mode: 'insensitive' } },
        { kecamatan: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: [{ kecamatan: 'asc' }, { nama: 'asc' }],
    take: search ? 20 : undefined,
  })
  ok(res, data)
})

const kelurahanSchema = z.object({
  nama:      z.string().min(1).max(100),
  kecamatan: z.string().min(1).max(100),
  kota:      z.string().min(1).max(100),
  kodePos:   z.string().max(10).optional().nullable(),
})

// POST /api/pengaturan/kelurahan
pengaturanRouter.post(
  '/kelurahan',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const data = kelurahanSchema.parse(req.body)
    const record = await prisma.masterKelurahan.create({ data })
    created(res, record)
  },
)

// PUT /api/pengaturan/kelurahan/:id
pengaturanRouter.put(
  '/kelurahan/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    const data = kelurahanSchema.parse(req.body)
    const record = await prisma.masterKelurahan.update({ where: { id }, data })
    ok(res, record)
  },
)

// DELETE /api/pengaturan/kelurahan/:id
pengaturanRouter.delete(
  '/kelurahan/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    await prisma.masterKelurahan.delete({ where: { id } })
    ok(res, { message: 'Kelurahan berhasil dihapus' })
  },
)

// ── Komisi Config ────────────────────────────────────────────

// GET /api/pengaturan/komisi
pengaturanRouter.get('/komisi', async (_req, res) => {
  const data = await prisma.komisiConfig.findMany({ orderBy: { urutan: 'asc' } })
  ok(res, data)
})

const komisiSchema = z.object({
  nama:    z.string().min(1).max(100),
  minUsia: z.number().int().min(0),
  maxUsia: z.number().int().positive().optional().nullable(),
  urutan:  z.number().int().default(0),
  warna:   z.string().max(20).default('#6366f1'),
})

// PUT /api/pengaturan/komisi/:id
pengaturanRouter.put(
  '/komisi/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    const data = komisiSchema.parse(req.body)
    const record = await prisma.komisiConfig.update({ where: { id }, data })
    ok(res, record)
  },
)
