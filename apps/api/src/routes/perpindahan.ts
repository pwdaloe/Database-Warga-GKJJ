import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import * as perpindahanService from '../services/perpindahan.service.js'
import * as suratService from '../services/surat.service.js'
import * as emailService from '../services/email.service.js'
import { ok, created, paginated } from '../utils/response.js'

export const perpindahanRouter = Router()

perpindahanRouter.use(authenticate)

const JENIS_LABEL: Record<string, string> = {
  MASUK: 'Keterangan Pindah Masuk',
  KELUAR: 'Keterangan Pindah Keluar',
  MENINGGAL: 'Keterangan Kematian',
}

const bodySchema = z.object({
  wargaId: z.number().int().positive(),
  jenis: z.enum(['MASUK', 'KELUAR', 'MENINGGAL']),
  gerejaAsalTujuan: z.string().max(200).optional().nullable(),
  tanggalPerpindahan: z.string().date().optional().nullable(),
  nomorSurat: z.string().max(50).optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

// GET /api/perpindahan
perpindahanRouter.get('/', async (req, res) => {
  const { page, limit, jenis, search } = req.query
  const result = await perpindahanService.listPerpindahan({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    jenis: jenis as string | undefined,
    search: search as string | undefined,
  })
  paginated(res, result.data, result.total, result.page, result.limit)
})

// GET /api/perpindahan/:id
perpindahanRouter.get('/:id', async (req, res) => {
  const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params['id']))
  ok(res, perpindahan)
})

// POST /api/perpindahan
perpindahanRouter.post(
  '/',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'),
  async (req, res) => {
    const data = bodySchema.parse(req.body)
    const perpindahan = await perpindahanService.createPerpindahan(data)
    created(res, perpindahan)
  },
)

// PUT /api/perpindahan/:id
perpindahanRouter.put(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'),
  async (req, res) => {
    const data = bodySchema.partial().parse(req.body)
    const perpindahan = await perpindahanService.updatePerpindahan(Number(req.params['id']), data)
    ok(res, perpindahan)
  },
)

// POST /api/perpindahan/:id/approve
perpindahanRouter.post(
  '/:id/approve',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS'),
  async (req, res) => {
    const result = await perpindahanService.approvePerpindahan(Number(req.params['id']), req.user!.userId)
    ok(res, result)
  },
)

// POST /api/perpindahan/:id/validate
perpindahanRouter.post(
  '/:id/validate',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    const result = await perpindahanService.validatePerpindahan(Number(req.params['id']), req.user!.userId)
    ok(res, result)
  },
)

// DELETE /api/perpindahan/:id
perpindahanRouter.delete(
  '/:id',
  authorize('SUPERADMIN', 'KEPALA_KANTOR'),
  async (req, res) => {
    await perpindahanService.deletePerpindahan(Number(req.params['id']))
    res.status(204).send()
  },
)

// GET /api/perpindahan/:id/surat.pdf
perpindahanRouter.get('/:id/surat.pdf', async (req, res) => {
  const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params['id']))
  const pdfBuffer = await suratService.generateSuratPerpindahanPdf(perpindahan)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="surat-perpindahan-${req.params['id']}.pdf"`)
  res.send(pdfBuffer)
})

// POST /api/perpindahan/:id/kirim-email
perpindahanRouter.post(
  '/:id/kirim-email',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'),
  async (req, res) => {
    const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params['id']))
    if (!perpindahan.validatedBy) throw new AppError(400, 'Perpindahan belum divalidasi, surat belum bisa dikirim')
    if (!perpindahan.warga.email) throw new AppError(400, 'Warga ini belum memiliki alamat email terdaftar')
    const pdfBuffer = await suratService.generateSuratPerpindahanPdf(perpindahan)
    const jenisLabel = JENIS_LABEL[perpindahan.jenis]!
    await emailService.sendSuratPerpindahanEmail(perpindahan.warga.email, perpindahan.warga.namaLengkap, jenisLabel, pdfBuffer)
    ok(res, { message: 'Surat berhasil dikirim ke email warga' })
  },
)
