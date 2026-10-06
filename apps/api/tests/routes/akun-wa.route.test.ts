import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

const prisma = {
  user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  templatePesan: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  notifikasiLog: { create: vi.fn() },
  kontakGereja: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  kelompok: { findUnique: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')
const { TEMPLATE_DEFAULT } = await import('../../src/services/pesan.service.js')

const tok = (role: UserRole, userId = 1, kelompokId: number | null = null) =>
  jwt.sign({ userId, role, kelompokId }, process.env.JWT_SECRET!)
let admin: string
let staf: string
let penatua: string
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  admin = tok(UserRole.SUPERADMIN)
  staf = tok(UserRole.STAF_ADMIN, 2)
  penatua = tok(UserRole.PENATUA_KELOMPOK, 3, 5)
})
beforeEach(() => {
  vi.clearAllMocks()
  prisma.user.findFirst.mockResolvedValue(null)
  prisma.user.findUnique.mockResolvedValue(null)
  prisma.user.create.mockImplementation(async ({ data }: any) => ({ id: 9, ...data, passwordHash: undefined }))
  prisma.templatePesan.findUnique.mockImplementation(async ({ where }: any) =>
    ({ kode: where.kode, nama: 'x', isi: (TEMPLATE_DEFAULT as any)[where.kode].isi }))
})

const baseUser = { nama: 'Budi', username: 'budi.s', email: 'budi@x.id', role: 'STAF_ADMIN', whatsapp: '0812-3456-7890', wargaId: 4 }

describe('POST /api/users — password acak', () => {
  it('tanpa password → acak, mustChangePassword true, passwordAwal dikembalikan sekali, WA ternormalisasi', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`).send(baseUser)
    expect(res.status).toBe(201)
    expect(res.body.data.passwordAwal).toHaveLength(10)
    const data = prisma.user.create.mock.calls[0]![0].data
    expect(data.mustChangePassword).toBe(true)
    expect(data.whatsapp).toBe('6281234567890')
    expect(data.passwordHash).not.toContain(res.body.data.passwordAwal)
  })

  it('password manual → tidak dipaksa ganti, tidak ada passwordAwal', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`)
      .send({ ...baseUser, password: 'rahasia123' })
    expect(res.status).toBe(201)
    expect(res.body.data.passwordAwal).toBeUndefined()
    expect(prisma.user.create.mock.calls[0]![0].data.mustChangePassword).toBe(false)
  })

  it('warga yang sudah punya akun ditolak', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 })
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`).send(baseUser)
    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('nomor WA tidak valid → 400', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`)
      .send({ ...baseUser, whatsapp: '123' })
    expect(res.status).toBe(400)
  })

  it('role non-admin ditolak', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${staf}`).send(baseUser)
    expect(res.status).toBe(403)
  })
})

describe('POST /api/users/:id/reset-password', () => {
  it('tanpa password → acak + mustChangePassword', async () => {
    prisma.user.update.mockResolvedValue({})
    const res = await request(app).post('/api/users/9/reset-password').set('Authorization', `Bearer ${admin}`).send({})
    expect(res.status).toBe(200)
    expect(res.body.data.passwordBaru).toHaveLength(10)
    expect(prisma.user.update.mock.calls[0]![0].data.mustChangePassword).toBe(true)
  })
})

describe('POST /api/users/:id/notifikasi', () => {
  const user = { id: 9, nama: 'Budi', username: 'budi.s', role: 'STAF_ADMIN', whatsapp: null, kelompok: null, warga: { whatsapp: '081234567890' } }
  const send = (body: object, token = admin) =>
    request(app).post('/api/users/9/notifikasi').set('Authorization', `Bearer ${token}`).send(body)

  it('memakai nomor warga bila user belum punya; pesan memuat portal, username, password; tautan wa.me', async () => {
    prisma.user.findUnique.mockResolvedValue(user)
    const res = await send({ templateKode: 'AKUN_BARU', password: 'Ab3xK9mQpz' })
    expect(res.status).toBe(200)
    expect(res.body.data.pesan).toContain('https://jemaat.gkjjakarta.org')
    expect(res.body.data.pesan).toContain('budi.s')
    expect(res.body.data.pesan).toContain('Ab3xK9mQpz')
    expect(res.body.data.waLink).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/)
  })

  it('log tidak menyimpan password maupun nomor utuh', async () => {
    prisma.user.findUnique.mockResolvedValue(user)
    await send({ templateKode: 'AKUN_BARU', password: 'Ab3xK9mQpz' })
    const log = prisma.notifikasiLog.create.mock.calls[0]![0].data
    expect(log.pesanMasker).not.toContain('Ab3xK9mQpz')
    expect(log.pesanMasker).toContain('********')
    expect(log.nomorMasker).not.toContain('6281234567890')
  })

  it('tanpa nomor WA → 400, tidak ada log', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, warga: null })
    const res = await send({ templateKode: 'AKUN_BARU', password: 'x' })
    expect(res.status).toBe(400)
    expect(prisma.notifikasiLog.create).not.toHaveBeenCalled()
  })

  it('role non-admin ditolak', async () => {
    expect((await send({ templateKode: 'AKUN_BARU', password: 'x' }, staf)).status).toBe(403)
  })
})

describe('Template pesan', () => {
  it('menolak placeholder salah ketik', async () => {
    const res = await request(app).put('/api/pengaturan/template-pesan/AKUN_BARU')
      .set('Authorization', `Bearer ${admin}`).send({ isi: 'Halo {{nama}} pass {{pasword}}' })
    expect(res.status).toBe(400)
    expect(prisma.templatePesan.update).not.toHaveBeenCalled()
  })

  it('pratinjau memakai data contoh', async () => {
    const res = await request(app).post('/api/pengaturan/template-pesan/preview')
      .set('Authorization', `Bearer ${admin}`).send({ isi: 'Halo {{nama}} di {{url_portal}}' })
    expect(res.body.data.pesan).toBe('Halo Budi Santoso di https://jemaat.gkjjakarta.org')
  })

  it('staf tidak boleh mengubah template', async () => {
    const res = await request(app).put('/api/pengaturan/template-pesan/AKUN_BARU')
      .set('Authorization', `Bearer ${staf}`).send({ isi: 'Halo {{nama}} terbaru ya' })
    expect(res.status).toBe(403)
  })
})

describe('Kontak Gereja', () => {
  it('menyimpan nomor ternormalisasi; nomor tidak valid ditolak', async () => {
    prisma.kontakGereja.create.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }))
    const ok = await request(app).post('/api/pengaturan/kontak-gereja').set('Authorization', `Bearer ${admin}`)
      .send({ jenis: 'PENDETA_EMERITUS', nama: 'Pdt. Emeritus', whatsapp: '0811 222 3333' })
    expect(ok.status).toBe(201)
    expect(prisma.kontakGereja.create.mock.calls[0]![0].data.whatsapp).toBe('62811222333' + '3')
    const bad = await request(app).post('/api/pengaturan/kontak-gereja').set('Authorization', `Bearer ${admin}`)
      .send({ jenis: 'PENDETA', nama: 'Pdt. X', whatsapp: 'abc' })
    expect(bad.status).toBe(400)
  })

  it('toggle membalik status aktif', async () => {
    prisma.kontakGereja.findUnique.mockResolvedValue({ id: 1, aktif: true })
    prisma.kontakGereja.update.mockResolvedValue({ id: 1, aktif: false })
    await request(app).patch('/api/pengaturan/kontak-gereja/1/toggle').set('Authorization', `Bearer ${admin}`)
    expect(prisma.kontakGereja.update.mock.calls[0]![0].data).toEqual({ aktif: false })
  })
})

describe('GET /api/hubungi (semua role)', () => {
  const kontak = (jenis: string, nama: string, aktif = true) =>
    ({ jenis, nama, whatsapp: '081234567890', keterangan: null, aktif, urutan: 0 })

  beforeEach(() => {
    // Query sudah memfilter aktif:true; mock mengembalikan apa adanya sesuai where
    prisma.kontakGereja.findMany.mockImplementation(async ({ where }: any) =>
      [kontak('WA_CENTER', 'WA Center'), kontak('KEPALA_KANTOR', 'Bpk Kepala'),
       kontak('PENDETA', 'Pdt. A'), kontak('PENDETA_EMERITUS', 'Pdt. Em'), kontak('PENDETA', 'Pdt. Off', false)]
        .filter((k) => !where?.aktif || k.aktif))
    prisma.user.findUnique.mockResolvedValue({ nama: 'Ani', kelompokId: 5, warga: null })
    prisma.kelompok.findUnique.mockResolvedValue({
      nama: 'Kelompok 5',
      penatua: { namaLengkap: 'Bpk Penatua', whatsapp: '081299998888', whatsappBolehDitampilkan: true },
    })
  })

  it('tanpa token → 401', async () => {
    expect((await request(app).get('/api/hubungi')).status).toBe(401)
  })

  it.each([UserRole.STAF_ADMIN, UserRole.VIEWER, UserRole.PENATUA_KELOMPOK, UserRole.MAJELIS])(
    'role %s → 200 dengan empat kelompok kontak', async (role) => {
      const res = await request(app).get('/api/hubungi').set('Authorization', `Bearer ${tok(role, 7, 5)}`)
      expect(res.status).toBe(200)
      const d = res.body.data
      expect(d.waCenter).toHaveLength(1)
      expect(d.kepalaKantor).toHaveLength(1)
      expect(d.majelis.nama).toBe('Bpk Penatua')
      expect(d.majelis.link).toMatch(/^https:\/\/wa\.me\/6281299998888\?text=/)
    })

  it('pendeta nonaktif tidak tampil; emeritus ditandai', async () => {
    const res = await request(app).get('/api/hubungi').set('Authorization', `Bearer ${penatua}`)
    const names = res.body.data.pendeta.map((p: any) => p.nama)
    expect(names).toEqual(['Pdt. A', 'Pdt. Em'])
    expect(res.body.data.pendeta[1].emeritus).toBe(true)
  })

  it('majelis tanpa centang "boleh ditampilkan" tidak muncul', async () => {
    prisma.kelompok.findUnique.mockResolvedValue({
      nama: 'K5', penatua: { namaLengkap: 'P', whatsapp: '081299998888', whatsappBolehDitampilkan: false } })
    const res = await request(app).get('/api/hubungi').set('Authorization', `Bearer ${penatua}`)
    expect(res.body.data.majelis).toBeNull()
  })

  it('tanpa kelompok → majelis null; respons tidak membocorkan nomor mentah', async () => {
    prisma.user.findUnique.mockResolvedValue({ nama: 'Ani', kelompokId: null, warga: null })
    const res = await request(app).get('/api/hubungi').set('Authorization', `Bearer ${admin}`)
    expect(res.body.data.majelis).toBeNull()
    expect(JSON.stringify(res.body)).not.toContain('"whatsapp"')
  })
})
