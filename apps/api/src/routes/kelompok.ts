import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok, created } from '../utils/response.js'

export const kelompokRouter = Router()
kelompokRouter.use(authenticate)

const bodySchema = z.object({
  wilayahId:        z.number().int().positive(),
  kode:             z.string().min(1).max(5),
  nama:             z.string().min(1).max(100),
  penatua_nama_temp: z.string().max(150).optional().nullable(),
  keterangan:       z.string().optional().nullable(),
})

// GET /api/kelompok — semua kelompok, bisa filter by wilayahId
kelompokRouter.get('/', async (req, res) => {
  const wilayahId = req.query['wilayahId'] ? Number(req.query['wilayahId']) : undefined
  const data = await prisma.kelompok.findMany({
    where: { aktif: true, ...(wilayahId ? { wilayahId } : {}) },
    include: { wilayah: true },
    orderBy: { kode: 'asc' },
  })
  ok(res, data)
})

// POST /api/kelompok
kelompokRouter.post(
  '/',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const data = bodySchema.parse(req.body)
    const kelompok = await prisma.kelompok.create({ data })
    created(res, kelompok)
  },
)

// PUT /api/kelompok/:id
kelompokRouter.put(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    const data = bodySchema.parse(req.body)
    const kelompok = await prisma.kelompok.update({ where: { id }, data })
    ok(res, kelompok)
  },
)

// PATCH /api/kelompok/:id/toggle — aktifkan / nonaktifkan
kelompokRouter.patch(
  '/:id/toggle',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    const current = await prisma.kelompok.findUniqueOrThrow({ where: { id } })
    const kelompok = await prisma.kelompok.update({
      where: { id },
      data: { aktif: !current.aktif },
    })
    ok(res, kelompok)
  },
)
