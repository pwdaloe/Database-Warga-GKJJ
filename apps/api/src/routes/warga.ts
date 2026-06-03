import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import * as svc from '../services/warga.service.js'
import { ok, created, paginated } from '../utils/response.js'
import { prisma } from '../utils/prisma.js'

export const wargaRouter = Router()

wargaRouter.use(authenticate)

const newKeluargaSchema = z.object({
  kelompokId:   z.number().int().positive(),
  alamat:       z.string().max(500).optional().nullable(),
  rt:           z.string().max(5).optional().nullable(),
  rw:           z.string().max(5).optional().nullable(),
  kelurahan:    z.string().max(100).optional().nullable(),
  kecamatan:    z.string().max(100).optional().nullable(),
  kota:         z.string().max(100).optional().nullable(),
  kodePos:      z.string().max(10).optional().nullable(),
  teleponRumah: z.string().max(20).optional().nullable(),
})

const bodySchema = z.object({
  keluargaId:         z.number().int().positive().optional().nullable(),
  newKeluarga:        newKeluargaSchema.optional(),
  nomorInduk:         z.string().max(30).optional().nullable(),
  namaLengkap:        z.string().min(2, 'Nama minimal 2 karakter').max(150),
  namaPanggilan:      z.string().max(50).optional().nullable(),
  jenisKelamin:       z.enum(['L', 'P']),
  tempatLahir:        z.string().max(100).optional().nullable(),
  tanggalLahir:       z.string().date().optional().nullable(),
  nik:                z.string().length(16).optional().nullable(),
  golonganDarah:      z.enum(['A', 'B', 'AB', 'O']).optional().nullable(),
  statusKeluarga:     z.enum(['KEPALA', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'LAINNYA']).optional(),
  statusKeanggotaan:  z.enum(['AKTIF', 'NON_AKTIF', 'KATEKUMEN', 'PINDAH_KELUAR', 'MENINGGAL']).optional(),
  dataStatus:         z.enum(['DRAFT', 'VALIDASI', 'AKTIF', 'TIDAK_AKTIF']).optional(),
  sudahBaptis:        z.boolean().optional(),
  tanggalBaptis:      z.string().date().optional().nullable(),
  tempatBaptis:       z.string().max(150).optional().nullable(),
  sudahSidi:          z.boolean().optional(),
  nomorSidi:          z.string().max(30).optional().nullable(),
  tanggalSidi:        z.string().date().optional().nullable(),
  telepon:            z.string().max(20).optional().nullable(),
  whatsapp:           z.string().max(20).optional().nullable(),
  email:              z.string().email().max(100).optional().nullable(),
  pendidikanTerakhir: z.string().max(50).optional().nullable(),
  pekerjaan:          z.string().max(100).optional().nullable(),
  fotoUrl:            z.string().optional().nullable(),
  alamatKtp:          z.string().optional().nullable(),
  alamatDomisili:     z.string().optional().nullable(),
  latitude:           z.number().optional().nullable(),
  longitude:          z.number().optional().nullable(),
  catatan:            z.string().optional().nullable(),
})

// GET /api/warga
wargaRouter.get('/', async (req, res) => {
  const { page, limit, search, kelompokId, wilayahId, statusKeanggotaan, jenisKelamin, dataStatus, sudahSidi, sudahBaptis } = req.query
  const result = await svc.listWarga(
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
      kelompokId: kelompokId ? Number(kelompokId) : undefined,
      wilayahId: wilayahId ? Number(wilayahId) : undefined,
      statusKeanggotaan: statusKeanggotaan as string | undefined,
      jenisKelamin: jenisKelamin as string | undefined,
      dataStatus: dataStatus as string | undefined,
      sudahSidi: sudahSidi === 'true' ? true : sudahSidi === 'false' ? false : undefined,
      sudahBaptis: sudahBaptis === 'true' ? true : sudahBaptis === 'false' ? false : undefined,
    },
    req.user!,
  )
  paginated(res, result.data, result.total, result.page, result.limit)
})

// GET /api/warga/ulang-tahun
wargaRouter.get('/ulang-tahun', async (_req, res) => {
  const data = await svc.getWargaUlangTahunBulanIni()
  ok(res, data)
})

// PATCH /api/warga/bulk-status
wargaRouter.patch(
  '/bulk-status',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'STAF_ADMIN'),
  async (req, res) => {
    const schema = z.object({
      ids:    z.array(z.number().int().positive()).min(1).max(500),
      action: z.enum(['validate', 'revert']),
    })
    const { ids, action } = schema.parse(req.body)
    const result = await svc.bulkValidasiWarga(ids, action, req.user!.userId, req.user!)
    ok(res, result)
  },
)

// GET /api/warga/:id
wargaRouter.get('/:id', async (req, res) => {
  const id = Number(req.params['id'])
  const warga = await svc.getWargaById(id, req.user!)

  // Audit trail akses data pribadi sensitif (UU PDP Pasal 16 & 49)
  prisma.auditLog.create({
    data: {
      userId:    req.user!.userId,
      action:    'ACCESS',
      tabel:     'warga',
      recordId:  id,
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                 ?? req.socket.remoteAddress ?? null,
    },
  }).catch(() => {/* jangan crash kalau log gagal */})

  ok(res, warga)
})

// POST /api/warga
wargaRouter.post(
  '/',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'),
  async (req, res) => {
    const { newKeluarga, ...rest } = bodySchema.parse(req.body)
    const warga = await svc.createWarga(
      {
        ...rest,
        tanggalLahir: rest.tanggalLahir ? new Date(rest.tanggalLahir) : null,
        tanggalBaptis: rest.tanggalBaptis ? new Date(rest.tanggalBaptis) : null,
        tanggalSidi: rest.tanggalSidi ? new Date(rest.tanggalSidi) : null,
      } as any,
      req.user!.userId,
      newKeluarga,
    )
    created(res, warga)
  },
)

// PUT /api/warga/:id
wargaRouter.put(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'),
  async (req, res) => {
    const { newKeluarga, ...rest } = bodySchema.parse(req.body)
    const warga = await svc.updateWarga(
      Number(req.params['id']),
      {
        ...rest,
        tanggalLahir: rest.tanggalLahir ? new Date(rest.tanggalLahir) : null,
        tanggalBaptis: rest.tanggalBaptis ? new Date(rest.tanggalBaptis) : null,
        tanggalSidi: rest.tanggalSidi ? new Date(rest.tanggalSidi) : null,
      } as any,
      req.user!.userId,
      req.user!,
      newKeluarga,
    )
    ok(res, warga)
  },
)

// DELETE /api/warga/:id
wargaRouter.delete(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    await svc.deleteWarga(Number(req.params['id']))
    ok(res, { message: 'Data warga berhasil dihapus' })
  },
)
