import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import * as svc from '../services/keluarga.service.js'
import { ok, created, paginated } from '../utils/response.js'

export const keluargaRouter = Router()

keluargaRouter.use(authenticate)

const bodySchema = z.object({
  kelompokId:        z.number().int().positive().optional().nullable(),
  kepalakeluargaId:  z.number().int().positive().optional().nullable(),
  alamat:            z.string().max(500).optional().nullable(),
  rt:           z.string().max(5).optional().nullable(),
  rw:           z.string().max(5).optional().nullable(),
  kelurahan:    z.string().max(100).optional().nullable(),
  kecamatan:    z.string().max(100).optional().nullable(),
  kota:         z.string().max(100).optional().nullable(),
  kodePos:      z.string().max(10).optional().nullable(),
  teleponRumah: z.string().max(20).optional().nullable(),
  status:       z.enum(['AKTIF', 'NON_AKTIF']).optional(),
  dataStatus:   z.enum(['DRAFT', 'VALIDASI', 'AKTIF', 'TIDAK_AKTIF']).optional(),
  catatan:      z.string().optional().nullable(),
})

// GET /api/keluarga
keluargaRouter.get('/', async (req, res) => {
  const { page, limit, search, kelompokId, wilayahId, status, dataStatus } = req.query
  const result = await svc.listKeluarga(
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
      kelompokId: kelompokId ? Number(kelompokId) : undefined,
      wilayahId: wilayahId ? Number(wilayahId) : undefined,
      status: status as string | undefined,
      dataStatus: dataStatus as string | undefined,
    },
    req.user!,
  )
  paginated(res, result.data, result.total, result.page, result.limit)
})

// GET /api/keluarga/:id
keluargaRouter.get('/:id', async (req, res) => {
  const keluarga = await svc.getKeluargaById(Number(req.params['id']), req.user!)
  ok(res, keluarga)
})

// POST /api/keluarga
keluargaRouter.post(
  '/',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'),
  async (req, res) => {
    const data = bodySchema.parse(req.body)
    const keluarga = await svc.createKeluarga(data, req.user!.userId)
    created(res, keluarga)
  },
)

// PUT /api/keluarga/:id
keluargaRouter.put(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'),
  async (req, res) => {
    const data = bodySchema.parse(req.body)
    const keluarga = await svc.updateKeluarga(Number(req.params['id']), data, req.user!.userId)
    ok(res, keluarga)
  },
)

// DELETE /api/keluarga/:id
keluargaRouter.delete(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    await svc.deleteKeluarga(Number(req.params['id']))
    ok(res, { message: 'Data keluarga berhasil dihapus' })
  },
)

// POST /api/keluarga/:id/approve
keluargaRouter.post(
  '/:id/approve',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const keluarga = await svc.approveKeluarga(Number(req.params['id']), req.user!.userId)
    ok(res, keluarga)
  },
)
