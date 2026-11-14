import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { buatPrisma, masuk, pengguna, type PenggunaUji } from '../helpers/harness.js'

const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.logAudit.create.mockResolvedValue({})
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma))
})

const akunDb = (ubah: Record<string, unknown> = {}) => ({
  id: 20, username: 'ketua.koman', nama: 'Ketua Anak', email: null, whatsapp: '081234567890', peran: 'PENGURUS_UPK', unitId: 5, bidangId: null, pengurusId: 3,
  aktif: true, wajibGantiPassword: true, lastLogin: null, isContoh: false, unit: null, pengurus: null, ...ubah,
})

describe('akses ke /api/pengguna', () => {
  for (const peran of ['MAJELIS', 'KOORDINATOR_BIDANG', 'PENGURUS_UPK'] as PenggunaUji['peran'][]) {
    it(`${peran} → 403 untuk semua aksi`, async () => {
      const h = masuk(prisma, pengguna(peran))
      expect((await request(app).get('/api/pengguna').set(h)).status).toBe(403)
      expect((await request(app).post('/api/pengguna').set(h).send({ username: 'abc', peran: 'MAJELIS', nama: 'Abc Def' })).status).toBe(403)
      expect((await request(app).post('/api/pengguna/1/reset-password').set(h)).status).toBe(403)
      expect((await request(app).post('/api/pengguna/1/notifikasi-akses').set(h)).status).toBe(403)
      expect((await request(app).put('/api/pengguna/1').set(h).send({ aktif: false })).status).toBe(403)
      expect(prisma.pengguna.create).not.toHaveBeenCalled()
    })
  }
})

describe('daftar akun', () => {
  it('tidak pernah memilih kolom passwordHash', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    prisma.pengguna.findMany.mockResolvedValue([akunDb()])
    const res = await request(app).get('/api/pengguna').set(h)
    expect(res.status).toBe(200)
    expect(prisma.pengguna.findMany.mock.calls[0]![0].select).not.toHaveProperty('passwordHash')
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
  })
})

describe('membuat akun', () => {
  it('pengurus UPK: dikaitkan ke posisi, unit diambil dari posisi, password acak + tautan WhatsApp, sekali tampil', async () => {
    const h = masuk(prisma, pengguna('SEKRETARIAT'))
    prisma.pengurus.findUnique.mockResolvedValue({ id: 3, unitId: 5, nama: 'Ketua Anak', email: null, whatsapp: '081234567890', pengguna: null })
    prisma.pengguna.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => akunDb({ username: data['username'], unitId: data['unitId'] }))
    const res = await request(app).post('/api/pengguna').set(h).send({ username: 'Ketua.Koman', peran: 'PENGURUS_UPK', pengurusId: 3, unitId: 999 })
    expect(res.status).toBe(201)
    const data = prisma.pengguna.create.mock.calls[0]![0].data
    expect(data.unitId).toBe(5) // dari posisi, bukan dari kiriman
    expect(data.username).toBe('ketua.koman')
    expect(data.wajibGantiPassword).toBe(true)
    const sementara = res.body.data.passwordSementara as string
    expect(sementara).toHaveLength(10)
    expect(data.passwordHash).not.toBe(sementara)
    expect(await bcrypt.compare(sementara, data.passwordHash)).toBe(true)
    expect(res.body.data.waLink).toContain('https://wa.me/6281234567890')
    expect(res.body.data.pesanWhatsapp).toContain(sementara)
    // password tidak boleh masuk audit log
    expect(JSON.stringify(prisma.logAudit.create.mock.calls)).not.toContain(sementara)
    expect(JSON.stringify(res.body.data.pengguna)).not.toContain('passwordHash')
  })

  it('pengurus UPK tanpa posisi → 400; posisi sudah punya akun → 409', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    expect((await request(app).post('/api/pengguna').set(h).send({ username: 'abc', peran: 'PENGURUS_UPK', nama: 'Abc Def' })).status).toBe(400)
    prisma.pengurus.findUnique.mockResolvedValue({ id: 3, unitId: 5, nama: 'K', email: null, whatsapp: null, pengguna: { id: 99 } })
    expect((await request(app).post('/api/pengguna').set(h).send({ username: 'abc', peran: 'PENGURUS_UPK', pengurusId: 3 })).status).toBe(409)
    expect(prisma.pengguna.create).not.toHaveBeenCalled()
  })

  it('koordinator wajib bidang; peran lain mengabaikan unit/bidang', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    prisma.pengguna.create.mockResolvedValue(akunDb({ peran: 'MAJELIS' }))
    expect((await request(app).post('/api/pengguna').set(h).send({ username: 'koord', peran: 'KOORDINATOR_BIDANG', nama: 'Koord Bidang' })).status).toBe(400)
    await request(app).post('/api/pengguna').set(h).send({ username: 'majelis1', peran: 'MAJELIS', nama: 'Majelis Satu', bidangId: 2 })
    const data = prisma.pengguna.create.mock.calls[0]![0].data
    expect(data.unitId).toBeNull()
    expect(data.bidangId).toBeNull()
  })

  it('SEKRETARIAT tidak boleh membuat akun ADMIN/SEKRETARIAT; ADMIN boleh', async () => {
    prisma.pengguna.create.mockResolvedValue(akunDb({ peran: 'ADMIN' }))
    for (const peran of ['ADMIN', 'SEKRETARIAT']) {
      const res = await request(app).post('/api/pengguna').set(masuk(prisma, pengguna('SEKRETARIAT'))).send({ username: 'baru', peran, nama: 'Nama Baru' })
      expect(res.status).toBe(403)
    }
    expect(prisma.pengguna.create).not.toHaveBeenCalled()
    const res = await request(app).post('/api/pengguna').set(masuk(prisma, pengguna('ADMIN'))).send({ username: 'baru', peran: 'SEKRETARIAT', nama: 'Nama Baru' })
    expect(res.status).toBe(201)
  })

  it('username tidak valid → 400', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    for (const username of ['ab', 'ada spasi', 'ADA/slash']) {
      expect((await request(app).post('/api/pengguna').set(h).send({ username, peran: 'MAJELIS', nama: 'Nama Baru' })).status).toBe(400)
    }
  })
})

describe('reset password dan ubah akun', () => {
  it('reset: hash baru, wajib ganti, password sementara dikembalikan sekali', async () => {
    const h = masuk(prisma, pengguna('SEKRETARIAT'))
    prisma.pengguna.findUnique.mockImplementation(async (args: { where: { id: number }; select?: Record<string, unknown> }) =>
      args.where.id === 1 ? pengguna('SEKRETARIAT') : akunDb(),
    )
    prisma.pengguna.update.mockResolvedValue({})
    const res = await request(app).post('/api/pengguna/20/reset-password').set(h)
    expect(res.status).toBe(200)
    const data = prisma.pengguna.update.mock.calls[0]![0].data
    expect(data.wajibGantiPassword).toBe(true)
    expect(await bcrypt.compare(res.body.data.passwordSementara, data.passwordHash)).toBe(true)
    expect(JSON.stringify(prisma.logAudit.create.mock.calls)).not.toContain(res.body.data.passwordSementara)
  })

  it('SEKRETARIAT tidak boleh mereset atau mengubah akun ADMIN', async () => {
    const h = masuk(prisma, pengguna('SEKRETARIAT'))
    prisma.pengguna.findUnique.mockImplementation(async (args: { where: { id: number } }) => (args.where.id === 1 ? pengguna('SEKRETARIAT') : akunDb({ peran: 'ADMIN' })))
    expect((await request(app).post('/api/pengguna/20/reset-password').set(h)).status).toBe(403)
    expect((await request(app).put('/api/pengguna/20').set(h).send({ aktif: false })).status).toBe(403)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })

  it('tidak boleh menonaktifkan akun sendiri', async () => {
    const h = masuk(prisma, pengguna('ADMIN', { id: 20 }))
    prisma.pengguna.findUnique.mockImplementation(async () => ({ ...pengguna('ADMIN', { id: 20 }), peran: 'ADMIN', username: 'admin' }))
    expect((await request(app).put('/api/pengguna/20').set(h).send({ aktif: false })).status).toBe(400)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })
})

describe('notifikasi akses WhatsApp', () => {
  const admin = () => masuk(prisma, pengguna('SEKRETARIAT'))
  const dukungDb = (akun: Record<string, unknown>) =>
    prisma.pengguna.findUnique.mockImplementation(async (args: { where: { id: number } }) => (args.where.id === 1 ? pengguna('SEKRETARIAT') : akunDb(akun)))

  it('belum ganti password: password direset dan ikut di pesan + tautan wa.me', async () => {
    const h = admin()
    dukungDb({ wajibGantiPassword: true })
    prisma.pengguna.update.mockResolvedValue({})
    const res = await request(app).post('/api/pengguna/20/notifikasi-akses').set(h)
    expect(res.status).toBe(200)
    expect(res.body.data.jenis).toBe('DENGAN_PASSWORD')
    const data = prisma.pengguna.update.mock.calls[0]![0].data
    expect(await bcrypt.compare(res.body.data.passwordSementara, data.passwordHash)).toBe(true)
    expect(res.body.data.pesanWhatsapp).toContain('sudah dapat Anda akses')
    expect(res.body.data.pesanWhatsapp).toContain('ketua.koman')
    expect(res.body.data.pesanWhatsapp).toContain(res.body.data.passwordSementara)
    expect(res.body.data.waLink).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/)
    expect(JSON.stringify(prisma.logAudit.create.mock.calls)).not.toContain(res.body.data.passwordSementara)
  })

  it('sudah ganti password: pesan pengingat tanpa password, tidak mengubah akun', async () => {
    const h = admin()
    dukungDb({ wajibGantiPassword: false })
    const res = await request(app).post('/api/pengguna/20/notifikasi-akses').set(h)
    expect(res.status).toBe(200)
    expect(res.body.data.jenis).toBe('TANPA_PASSWORD')
    expect(res.body.data.passwordSementara).toBeNull()
    expect(res.body.data.pesanWhatsapp).not.toContain('Password sementara')
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })

  it('nomor kosong/tidak valid → 400; akun nonaktif → 409; tanpa perubahan apa pun', async () => {
    const h = admin()
    dukungDb({ whatsapp: null })
    expect((await request(app).post('/api/pengguna/20/notifikasi-akses').set(h)).status).toBe(400)
    dukungDb({ whatsapp: '123' })
    expect((await request(app).post('/api/pengguna/20/notifikasi-akses').set(h)).status).toBe(400)
    dukungDb({ aktif: false })
    expect((await request(app).post('/api/pengguna/20/notifikasi-akses').set(h)).status).toBe(409)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })

  it('SEKRETARIAT tidak boleh mengirim akses untuk akun ADMIN', async () => {
    const h = admin()
    dukungDb({ peran: 'ADMIN' })
    expect((await request(app).post('/api/pengguna/20/notifikasi-akses').set(h)).status).toBe(403)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })
})

describe('ubah nomor WhatsApp akun', () => {
  const admin = () => masuk(prisma, pengguna('SEKRETARIAT'))
  const dukungDb = () => prisma.pengguna.findUnique.mockImplementation(async (args: { where: { id: number } }) => (args.where.id === 1 ? pengguna('SEKRETARIAT') : akunDb()))

  it('nomor valid disimpan; kosong menghapus nomor (null)', async () => {
    const h = admin()
    dukungDb()
    prisma.pengguna.update.mockResolvedValue(akunDb())
    expect((await request(app).put('/api/pengguna/20').set(h).send({ whatsapp: '0812-3456-7890' })).status).toBe(200)
    expect(prisma.pengguna.update.mock.calls[0]![0].data.whatsapp).toBe('0812-3456-7890')
    expect((await request(app).put('/api/pengguna/20').set(h).send({ whatsapp: '' })).status).toBe(200)
    expect(prisma.pengguna.update.mock.calls[1]![0].data.whatsapp).toBeNull()
  })

  it('nomor tidak valid → 400 dan tidak menyimpan', async () => {
    const h = admin()
    dukungDb()
    expect((await request(app).put('/api/pengguna/20').set(h).send({ whatsapp: '12345' })).status).toBe(400)
    expect((await request(app).put('/api/pengguna/20').set(h).send({ whatsapp: 'abc' })).status).toBe(400)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })
})
