import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok, created } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'
import { normalizeWa } from '../utils/waNumber.js'
import {
  TEMPLATE_KODE, TEMPLATE_DEFAULT, PLACEHOLDERS, getTemplate, renderTemplate, unknownPlaceholders, portalUrl,
} from '../services/pesan.service.js'

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

// ── Template Pesan WhatsApp ──────────────────────────────────

const kodeSchema = z.enum(TEMPLATE_KODE)
const SAMPLE = { nama: 'Budi Santoso', username: 'budi.santoso', password: 'Ab3xK9mQpz', role: 'Staf Admin', kelompok: 'Kelompok 1' }

// GET /api/pengaturan/template-pesan
pengaturanRouter.get('/template-pesan', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (_req, res) => {
  const list = await Promise.all(TEMPLATE_KODE.map((k) => getTemplate(k)))
  ok(res, { templates: list, placeholders: PLACEHOLDERS, urlPortal: portalUrl() })
})

const templateSchema = z.object({ isi: z.string().min(10).max(2000) })

function assertPlaceholders(isi: string) {
  const bad = unknownPlaceholders(isi)
  if (bad.length) throw new AppError(400, `Placeholder tidak dikenal: ${bad.map((b) => `{{${b}}}`).join(', ')}`)
}

// PUT /api/pengaturan/template-pesan/:kode
pengaturanRouter.put('/template-pesan/:kode', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  const kode = kodeSchema.parse(req.params['kode'])
  const { isi } = templateSchema.parse(req.body)
  assertPlaceholders(isi)
  await getTemplate(kode)
  ok(res, await prisma.templatePesan.update({ where: { kode }, data: { isi, updatedBy: req.user!.userId } }))
})

// POST /api/pengaturan/template-pesan/:kode/default — kembalikan ke teks bawaan
pengaturanRouter.post('/template-pesan/:kode/default', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  const kode = kodeSchema.parse(req.params['kode'])
  await getTemplate(kode)
  ok(res, await prisma.templatePesan.update({
    where: { kode }, data: { isi: TEMPLATE_DEFAULT[kode].isi, updatedBy: req.user!.userId },
  }))
})

// POST /api/pengaturan/template-pesan/preview — render dengan data contoh (tanpa menyimpan)
pengaturanRouter.post('/template-pesan/preview', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  const { isi } = templateSchema.parse(req.body)
  assertPlaceholders(isi)
  ok(res, { pesan: renderTemplate(isi, { ...SAMPLE, url_portal: portalUrl() }) })
})

// ── Kontak Gereja (WA Center, Kepala Kantor, Pendeta, Pendeta Emeritus) ──

const kontakSchema = z.object({
  jenis:      z.enum(['WA_CENTER', 'KEPALA_KANTOR', 'PENDETA', 'PENDETA_EMERITUS']),
  nama:       z.string().min(2).max(150),
  whatsapp:   z.string().min(5).max(25),
  keterangan: z.string().max(150).optional().nullable(),
  aktif:      z.boolean().optional(),
  urutan:     z.number().int().min(0).max(9999).optional(),
})

function kontakData(body: unknown) {
  const d = kontakSchema.parse(body)
  const whatsapp = normalizeWa(d.whatsapp)
  if (!whatsapp) throw new AppError(400, 'Nomor WhatsApp tidak valid')
  return { ...d, whatsapp, keterangan: d.keterangan?.trim() || null }
}

// GET /api/pengaturan/kontak-gereja
pengaturanRouter.get('/kontak-gereja', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (_req, res) => {
  ok(res, await prisma.kontakGereja.findMany({ orderBy: [{ jenis: 'asc' }, { urutan: 'asc' }, { nama: 'asc' }] }))
})

// POST /api/pengaturan/kontak-gereja
pengaturanRouter.post('/kontak-gereja', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  created(res, await prisma.kontakGereja.create({ data: kontakData(req.body) }))
})

// PUT /api/pengaturan/kontak-gereja/:id
pengaturanRouter.put('/kontak-gereja/:id', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  ok(res, await prisma.kontakGereja.update({ where: { id: Number(req.params['id']) }, data: kontakData(req.body) }))
})

// PATCH /api/pengaturan/kontak-gereja/:id/toggle — aktifkan / nonaktifkan
pengaturanRouter.patch('/kontak-gereja/:id/toggle', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  const id = Number(req.params['id'])
  const cur = await prisma.kontakGereja.findUnique({ where: { id } })
  if (!cur) throw new AppError(404, 'Kontak tidak ditemukan')
  ok(res, await prisma.kontakGereja.update({ where: { id }, data: { aktif: !cur.aktif } }))
})

// DELETE /api/pengaturan/kontak-gereja/:id
pengaturanRouter.delete('/kontak-gereja/:id', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  await prisma.kontakGereja.delete({ where: { id: Number(req.params['id']) } })
  ok(res, { message: 'Kontak dihapus' })
})
