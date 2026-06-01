import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok, created } from '../utils/response.js'

export const wilayahRouter = Router()
wilayahRouter.use(authenticate)

const bodySchema = z.object({
  kode:       z.string().min(1).max(5),
  nama:       z.string().min(1).max(100),
  keterangan: z.string().optional().nullable(),
})

// GET /api/wilayah — semua wilayah beserta kelompok + counts
wilayahRouter.get('/', async (req, res) => {
  const all = req.query['all'] === 'true'
  const data = await prisma.wilayah.findMany({
    where: all ? undefined : { aktif: true },
    include: {
      kelompoks: {
        where: all ? undefined : { aktif: true },
        orderBy: { kode: 'asc' },
        include: {
          _count: { select: { keluargas: true } },
        },
      },
    },
    orderBy: { kode: 'asc' },
  })
  ok(res, data)
})

// POST /api/wilayah
wilayahRouter.post(
  '/',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const { kode, nama, keterangan } = bodySchema.parse(req.body)
    const wilayah = await prisma.wilayah.create({ data: { kode, nama, keterangan } })
    created(res, wilayah)
  },
)

// PUT /api/wilayah/:id
wilayahRouter.put(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    const { kode, nama, keterangan } = bodySchema.parse(req.body)
    const wilayah = await prisma.wilayah.update({ where: { id }, data: { kode, nama, keterangan } })
    ok(res, wilayah)
  },
)

// DELETE /api/wilayah/:id — hanya jika tidak ada keluarga terkait
wilayahRouter.delete(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])

    // Cek apakah ada keluarga di kelompok-kelompok wilayah ini
    const kelompoks = await prisma.kelompok.findMany({
      where: { wilayahId: id },
      include: { _count: { select: { keluargas: true } } },
    })
    const totalKK = kelompoks.reduce((s, k) => s + k._count.keluargas, 0)
    if (totalKK > 0) {
      throw Object.assign(
        new Error(`Wilayah tidak dapat dihapus karena masih memiliki ${totalKK} keluarga terdaftar`),
        { status: 400 },
      )
    }

    // Hapus kelompok terlebih dahulu (jika ada), lalu wilayah
    await prisma.kelompok.deleteMany({ where: { wilayahId: id } })
    await prisma.wilayah.delete({ where: { id } })
    ok(res, { message: 'Wilayah berhasil dihapus' })
  },
)

// PATCH /api/wilayah/:id/toggle — aktifkan / nonaktifkan
wilayahRouter.patch(
  '/:id/toggle',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const id = Number(req.params['id'])
    const current = await prisma.wilayah.findUniqueOrThrow({ where: { id } })
    const wilayah = await prisma.wilayah.update({
      where: { id },
      data: { aktif: !current.aktif },
    })
    ok(res, wilayah)
  },
)
