import { Router } from 'express'
import { z } from 'zod'
import { authorize, pelaku } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { prisma } from '../utils/prisma.js'
import { ambilMaster } from '../services/master.service.js'
import { catatAudit } from '../services/audit.service.js'
import { created, ok } from '../utils/response.js'
import { rupiah } from '../domain/rupiah.js'
import { normalizeWa } from '../utils/waNumber.js'

export const masterRouter = Router()

const kelola = authorize('ADMIN', 'SEKRETARIAT')
const ip = (req: { ip?: string | undefined }): string | null => req.ip ?? null
const idParam = (v: unknown): number => {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new AppError(400, 'ID tidak valid')
  return n
}
const tanggal = z.preprocess(
  (v) => (v === '' ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').nullable().optional(),
)
const keDate = (s: string | null | undefined): Date | null | undefined => (s === undefined ? undefined : s === null ? null : new Date(`${s}T00:00:00Z`))

masterRouter.get('/', async (req, res) => {
  const { tahunId } = z.object({ tahunId: z.coerce.number().int().positive().optional() }).parse(req.query)
  ok(res, await ambilMaster(pelaku(req), tahunId))
})

// ── Tahun anggaran ───────────────────────────────────────────

masterRouter.put('/tahun/:id', kelola, async (req, res) => {
  const id = idParam(req.params['id'])
  const d = z
    .object({
      nama: z.string().trim().min(1).max(100).optional(),
      statusPengajuan: z.enum(['BELUM_DIBUKA', 'DIBUKA', 'DITUTUP']).optional(),
      rencanaBuka: tanggal, rencanaTutup: tanggal, praMukerTanggal: tanggal, mukerTanggal: tanggal,
      aktif: z.boolean().optional(),
    })
    .parse(req.body)
  const t = await prisma.$transaction(async (tx) => {
    if (d.aktif === true) await tx.tahunAnggaran.updateMany({ where: { id: { not: id } }, data: { aktif: false } })
    const hasil = await tx.tahunAnggaran.update({
      where: { id },
      data: {
        ...(d.nama !== undefined ? { nama: d.nama } : {}),
        ...(d.statusPengajuan ? { statusPengajuan: d.statusPengajuan } : {}),
        ...(d.aktif !== undefined ? { aktif: d.aktif } : {}),
        ...(d.rencanaBuka !== undefined ? { rencanaBuka: keDate(d.rencanaBuka) } : {}),
        ...(d.rencanaTutup !== undefined ? { rencanaTutup: keDate(d.rencanaTutup) } : {}),
        ...(d.praMukerTanggal !== undefined ? { praMukerTanggal: keDate(d.praMukerTanggal) } : {}),
        ...(d.mukerTanggal !== undefined ? { mukerTanggal: keDate(d.mukerTanggal) } : {}),
      },
    })
    await catatAudit({ penggunaId: pelaku(req).id, aksi: 'UBAH_TAHUN', entitas: 'tahun', entitasId: id, ringkasan: JSON.stringify(d).slice(0, 400), ipAddress: ip(req) }, tx)
    return hasil
  })
  ok(res, t)
})

/** Tahun baru; opsional menyalin pagu dan acuan (hierarki) dari tahun lain sebagai nilai awal yang dapat diedit. */
masterRouter.post('/tahun', kelola, async (req, res) => {
  const d = z.object({ tahun: z.number().int().min(2020).max(2100), nama: z.string().trim().min(1).max(100), salinDariId: z.number().int().positive().optional() }).parse(req.body)
  const hasil = await prisma.$transaction(async (tx) => {
    const baru = await tx.tahunAnggaran.create({ data: { tahun: d.tahun, nama: d.nama } })
    if (d.salinDariId) {
      const pagu = await tx.paguUnit.findMany({ where: { tahunId: d.salinDariId } })
      await tx.paguUnit.createMany({ data: pagu.map((p) => ({ tahunId: baru.id, unitId: p.unitId, nilai: p.nilai, catatan: p.catatan })) })
      const acuan = await tx.acuanStrategis.findMany({ where: { tahunId: d.salinDariId }, orderBy: { id: 'asc' } })
      const peta = new Map<number, number>()
      for (const a of acuan) {
        const dibuat = await tx.acuanStrategis.create({
          data: { tahunId: baru.id, jenis: a.jenis, kode: a.kode, nama: a.nama, deskripsi: a.deskripsi, urutan: a.urutan, aktif: a.aktif, parentId: a.parentId ? (peta.get(a.parentId) ?? null) : null },
        })
        peta.set(a.id, dibuat.id)
      }
    }
    await catatAudit({ penggunaId: pelaku(req).id, aksi: 'BUAT_TAHUN', entitas: 'tahun', entitasId: baru.id, ringkasan: `${d.tahun}`, ipAddress: ip(req) }, tx)
    return baru
  })
  created(res, hasil)
})

// ── Bidang ───────────────────────────────────────────────────

const bidangSchema = z.object({ nama: z.string().trim().min(2).max(100), urutan: z.number().int().min(0).max(999).default(0) })

masterRouter.post('/bidang', kelola, async (req, res) => {
  const d = bidangSchema.extend({ kode: z.string().trim().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Kode: huruf besar, angka, garis bawah') }).parse(req.body)
  const b = await prisma.bidang.create({ data: d })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'BUAT_BIDANG', entitas: 'bidang', entitasId: b.id, ringkasan: d.nama, ipAddress: ip(req) })
  created(res, b)
})

masterRouter.put('/bidang/:id', kelola, async (req, res) => {
  const id = idParam(req.params['id'])
  const d = bidangSchema.parse(req.body)
  const b = await prisma.bidang.update({ where: { id }, data: d })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'UBAH_BIDANG', entitas: 'bidang', entitasId: id, ringkasan: d.nama, ipAddress: ip(req) })
  ok(res, b)
})

// ── Unit, pagu, pengurus ─────────────────────────────────────

const unitSchema = z.object({
  nama: z.string().trim().min(2).max(150),
  singkatan: z.string().trim().max(30).nullish(),
  alias: z.array(z.string().trim().min(1).max(150)).max(10).default([]),
  bidangId: z.number().int().positive(),
  jenis: z.enum(['UPK', 'POS']).default('UPK'),
  urutan: z.number().int().min(0).max(999).default(0),
  aktif: z.boolean().default(true),
})

masterRouter.post('/unit', kelola, async (req, res) => {
  const d = unitSchema.extend({ kode: z.string().trim().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Kode: huruf besar, angka, garis bawah') }).parse(req.body)
  const unit = await prisma.$transaction(async (tx) => {
    const baru = await tx.unit.create({ data: { ...d, singkatan: d.singkatan ?? null } })
    // Tiga posisi BPH selalu tersedia; nama diisi kemudian.
    await tx.pengurus.createMany({ data: (['KETUA', 'SEKRETARIS', 'BENDAHARA'] as const).map((j) => ({ unitId: baru.id, jabatan: j, nama: `(belum diisi) ${j.toLowerCase()}` })) })
    await catatAudit({ penggunaId: pelaku(req).id, aksi: 'BUAT_UNIT', entitas: 'unit', entitasId: baru.id, ringkasan: d.nama, ipAddress: ip(req) }, tx)
    return baru
  })
  created(res, unit)
})

masterRouter.put('/unit/:id', kelola, async (req, res) => {
  const id = idParam(req.params['id'])
  const d = unitSchema.parse(req.body)
  const unit = await prisma.unit.update({ where: { id }, data: { ...d, singkatan: d.singkatan ?? null } })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'UBAH_UNIT', entitas: 'unit', entitasId: id, ringkasan: d.nama, ipAddress: ip(req) })
  ok(res, unit)
})

masterRouter.put('/pagu', kelola, async (req, res) => {
  const d = z.object({ tahunId: z.number().int().positive(), unitId: z.number().int().positive(), nilai: rupiah, catatan: z.string().trim().max(255).nullish() }).parse(req.body)
  const pagu = await prisma.paguUnit.upsert({
    where: { tahunId_unitId: { tahunId: d.tahunId, unitId: d.unitId } },
    create: { tahunId: d.tahunId, unitId: d.unitId, nilai: BigInt(d.nilai), catatan: d.catatan ?? null },
    update: { nilai: BigInt(d.nilai), catatan: d.catatan ?? null },
  })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'UBAH_PAGU', entitas: 'unit', entitasId: d.unitId, ringkasan: `tahun ${d.tahunId}: ${d.nilai}`, ipAddress: ip(req) })
  ok(res, pagu)
})

masterRouter.put('/pengurus/:id', kelola, async (req, res) => {
  const id = idParam(req.params['id'])
  const d = z
    .object({
      nama: z.string().trim().min(2).max(150),
      whatsapp: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(20).nullish()),
      email: z.preprocess((v) => (v === '' ? null : v), z.string().trim().email('Format email tidak valid').max(150).nullish()),
      aktif: z.boolean().default(true),
    })
    .refine((x) => !x.whatsapp || normalizeWa(x.whatsapp) !== null, { message: 'Nomor WhatsApp tidak valid', path: ['whatsapp'] })
    .parse(req.body)
  const p = await prisma.pengurus.update({ where: { id }, data: { nama: d.nama, whatsapp: d.whatsapp ?? null, email: d.email ?? null, aktif: d.aktif, isContoh: false } })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'UBAH_PENGURUS', entitas: 'pengurus', entitasId: id, ringkasan: `${p.jabatan} unit ${p.unitId}`, ipAddress: ip(req) })
  ok(res, p)
})

// ── Acuan visi-misi, satuan, kategori biaya ──────────────────

const acuanSchema = z.object({
  tahunId: z.number().int().positive(),
  jenis: z.enum(['VISI', 'MISI', 'SASARAN']),
  kode: z.string().trim().min(1).max(30),
  nama: z.string().trim().min(2).max(200),
  deskripsi: z.string().trim().max(3000).nullish(),
  parentId: z.number().int().positive().nullish(),
  urutan: z.number().int().min(0).max(999).default(0),
  aktif: z.boolean().default(true),
})

masterRouter.post('/acuan', kelola, async (req, res) => {
  const d = acuanSchema.parse(req.body)
  const a = await prisma.acuanStrategis.create({ data: { ...d, deskripsi: d.deskripsi ?? null, parentId: d.parentId ?? null } })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'BUAT_ACUAN', entitas: 'acuan', entitasId: a.id, ringkasan: d.nama, ipAddress: ip(req) })
  created(res, a)
})

masterRouter.put('/acuan/:id', kelola, async (req, res) => {
  const id = idParam(req.params['id'])
  const { tahunId: _t, ...d } = acuanSchema.parse(req.body) // tahun tidak dapat dipindah
  if (d.parentId === id) throw new AppError(400, 'Acuan tidak boleh menjadi induk dirinya sendiri.')
  const a = await prisma.acuanStrategis.update({ where: { id }, data: { ...d, deskripsi: d.deskripsi ?? null, parentId: d.parentId ?? null } })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'UBAH_ACUAN', entitas: 'acuan', entitasId: id, ringkasan: d.nama, ipAddress: ip(req) })
  ok(res, a)
})

masterRouter.delete('/acuan/:id', kelola, async (req, res) => {
  const id = idParam(req.params['id'])
  const dipakai = await prisma.programAcuan.count({ where: { acuanId: id } })
  if (dipakai > 0) throw new AppError(409, `Acuan dipakai ${dipakai} program. Nonaktifkan saja, jangan dihapus.`)
  const anak = await prisma.acuanStrategis.count({ where: { parentId: id } })
  if (anak > 0) throw new AppError(409, 'Acuan masih memiliki turunan. Pindahkan atau hapus turunannya dulu.')
  await prisma.acuanStrategis.delete({ where: { id } })
  await catatAudit({ penggunaId: pelaku(req).id, aksi: 'HAPUS_ACUAN', entitas: 'acuan', entitasId: id, ipAddress: ip(req) })
  ok(res, { dihapus: true })
})

const masterSederhana = z.object({ nama: z.string().trim().min(1).max(60), urutan: z.number().int().min(0).max(999).default(0), aktif: z.boolean().default(true) })

masterRouter.post('/satuan', kelola, async (req, res) => {
  created(res, await prisma.satuan.create({ data: masterSederhana.parse(req.body) }))
})
masterRouter.put('/satuan/:id', kelola, async (req, res) => {
  ok(res, await prisma.satuan.update({ where: { id: idParam(req.params['id']) }, data: masterSederhana.parse(req.body) }))
})
masterRouter.post('/kategori-biaya', kelola, async (req, res) => {
  created(res, await prisma.kategoriBiaya.create({ data: masterSederhana.parse(req.body) }))
})
masterRouter.put('/kategori-biaya/:id', kelola, async (req, res) => {
  ok(res, await prisma.kategoriBiaya.update({ where: { id: idParam(req.params['id']) }, data: masterSederhana.parse(req.body) }))
})
