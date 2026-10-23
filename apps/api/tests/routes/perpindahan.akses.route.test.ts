import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../../src/services/perpindahan.service.js', () => ({
  listPerpindahan: vi.fn(), getPerpindahanById: vi.fn(), createPerpindahan: vi.fn(), updatePerpindahan: vi.fn(),
  approvePerpindahan: vi.fn(), validatePerpindahan: vi.fn(), deletePerpindahan: vi.fn(),
}))
vi.mock('../../src/services/surat.service.js', () => ({ generateSuratPerpindahanPdf: vi.fn() }))
vi.mock('../../src/services/email.service.js', () => ({ sendSuratPerpindahanEmail: vi.fn() }))
vi.mock('../../src/utils/prisma.js', () => ({ prisma: { activityLog: { create: vi.fn().mockResolvedValue({}) } } }))

const svc = await import('../../src/services/perpindahan.service.js')
const surat = await import('../../src/services/surat.service.js')
const email = await import('../../src/services/email.service.js')
const { default: app } = await import('../../src/app.js')
const m = (f: unknown) => f as ReturnType<typeof vi.fn>

const tok = (role: string, userId = 1) => jwt.sign({ userId, role, kelompokId: null }, process.env.JWT_SECRET!)
const auth = (role: string, userId = 1) => ({ Authorization: `Bearer ${tok(role, userId)}` })
const adaTulis = () => [svc.createPerpindahan, svc.updatePerpindahan, svc.approvePerpindahan, svc.validatePerpindahan, svc.deletePerpindahan, email.sendSuratPerpindahanEmail]
  .some((f) => m(f).mock.calls.length > 0)

beforeAll(() => { process.env.JWT_SECRET = 'test-jwt-secret' })
beforeEach(() => { vi.clearAllMocks() })

describe('Perpindahan — matriks otorisasi per aksi', () => {
  const kasus: [string, string, string, string][] = [
    ['put', '/api/perpindahan/1', 'VIEWER', 'ubah'],
    ['put', '/api/perpindahan/1', 'PENATUA_KELOMPOK', 'ubah'],
    ['post', '/api/perpindahan/1/approve', 'STAF_ADMIN', 'approve'],
    ['post', '/api/perpindahan/1/approve', 'VIEWER', 'approve'],
    ['post', '/api/perpindahan/1/validate', 'MAJELIS', 'validasi'],
    ['post', '/api/perpindahan/1/validate', 'STAF_ADMIN', 'validasi'],
    ['delete', '/api/perpindahan/1', 'MAJELIS', 'hapus'],
    ['delete', '/api/perpindahan/1', 'STAF_ADMIN', 'hapus'],
    ['post', '/api/perpindahan/1/kirim-email', 'VIEWER', 'kirim email'],
    ['post', '/api/perpindahan/1/kirim-email', 'PENATUA_KELOMPOK', 'kirim email'],
  ]
  it.each(kasus)('%s %s oleh %s (%s) → 403 dan tidak ada efek', async (method, path, role) => {
    const res = await (request(app) as any)[method](path).set(auth(role)).send({})
    expect(res.status).toBe(403)
    expect(adaTulis()).toBe(false)
  })

  it('tanpa token → 401', async () => {
    expect((await request(app).get('/api/perpindahan')).status).toBe(401)
    expect((await request(app).delete('/api/perpindahan/1')).status).toBe(401)
  })
})

describe('Perpindahan — aksi yang diizinkan meneruskan id dan pelaku', () => {
  it('approve oleh MAJELIS: id KK dan userId pelaku', async () => {
    m(svc.approvePerpindahan).mockResolvedValue({ id: 4 })
    const res = await request(app).post('/api/perpindahan/4/approve').set(auth('MAJELIS', 33))
    expect(res.status).toBe(200)
    expect(svc.approvePerpindahan).toHaveBeenCalledWith(4, 33)
  })

  it('hapus → 204 tanpa isi', async () => {
    m(svc.deletePerpindahan).mockResolvedValue(undefined)
    const res = await request(app).delete('/api/perpindahan/6').set(auth('KEPALA_KANTOR'))
    expect(res.status).toBe(204)
    expect(res.text).toBe('')
    expect(svc.deletePerpindahan).toHaveBeenCalledWith(6)
  })

  it('ubah: body parsial diterima, tetapi isi tidak valid ditolak', async () => {
    m(svc.updatePerpindahan).mockResolvedValue({ id: 2 })
    const ok = await request(app).put('/api/perpindahan/2').set(auth('STAF_ADMIN')).send({ nomorSurat: '012/GKJJ/X/2026' })
    expect(ok.status).toBe(200)
    expect(svc.updatePerpindahan).toHaveBeenCalledWith(2, { nomorSurat: '012/GKJJ/X/2026' })
    const buruk = await request(app).put('/api/perpindahan/2').set(auth('STAF_ADMIN')).send({ jenis: 'LAIN', tanggalPerpindahan: '31-12-2026' })
    expect(buruk.status).toBe(400)
    expect(svc.updatePerpindahan).toHaveBeenCalledTimes(1)
  })

  it('buat: tanggal harus format ISO (YYYY-MM-DD) dan wargaId bilangan positif', async () => {
    const dasar = { wargaId: 10, jenis: 'KELUAR' }
    m(svc.createPerpindahan).mockResolvedValue({ id: 1 })
    expect((await request(app).post('/api/perpindahan').set(auth('MAJELIS')).send({ ...dasar, tanggalPerpindahan: '2026-10-23' })).status).toBe(201)
    expect((await request(app).post('/api/perpindahan').set(auth('MAJELIS')).send({ ...dasar, tanggalPerpindahan: '23/10/2026' })).status).toBe(400)
    expect((await request(app).post('/api/perpindahan').set(auth('MAJELIS')).send({ wargaId: 0, jenis: 'KELUAR' })).status).toBe(400)
    expect(svc.createPerpindahan).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/perpindahan', () => {
  it('meneruskan filter ke service sebagai angka/teks', async () => {
    m(svc.listPerpindahan).mockResolvedValue({ data: [], total: 0, page: 2, limit: 5 })
    const res = await request(app).get('/api/perpindahan?page=2&limit=5&jenis=MASUK&search=budi').set(auth('VIEWER'))
    expect(res.status).toBe(200)
    expect(svc.listPerpindahan).toHaveBeenCalledWith({ page: 2, limit: 5, jenis: 'MASUK', search: 'budi' })
  })
})

describe('GET /api/perpindahan/:id/surat.pdf', () => {
  it('mengirim PDF inline dengan nama berkas sesuai id', async () => {
    m(svc.getPerpindahanById).mockResolvedValue({ id: 8, jenis: 'KELUAR', warga: {} })
    m(surat.generateSuratPerpindahanPdf).mockResolvedValue(Buffer.from('%PDF-1.4 contoh'))
    const res = await request(app).get('/api/perpindahan/8/surat.pdf').set(auth('VIEWER'))
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/pdf/)
    expect(res.headers['content-disposition']).toBe('inline; filename="surat-perpindahan-8.pdf"')
    expect(res.body.toString()).toBe('%PDF-1.4 contoh')
  })
})

describe('POST /api/perpindahan/:id/kirim-email', () => {
  const tervalidasi = (over: object = {}) => ({
    id: 3, jenis: 'MENINGGAL', validatedBy: 2, warga: { namaLengkap: 'Budi', email: 'budi@contoh.id' }, ...over,
  })

  it('sukses: email berisi PDF dan label jenis yang benar', async () => {
    m(svc.getPerpindahanById).mockResolvedValue(tervalidasi())
    m(surat.generateSuratPerpindahanPdf).mockResolvedValue(Buffer.from('pdf'))
    const res = await request(app).post('/api/perpindahan/3/kirim-email').set(auth('STAF_ADMIN'))
    expect(res.status).toBe(200)
    expect(email.sendSuratPerpindahanEmail).toHaveBeenCalledWith('budi@contoh.id', 'Budi', 'Keterangan Kematian', Buffer.from('pdf'))
  })

  it.each([['MASUK', 'Keterangan Pindah Masuk'], ['KELUAR', 'Keterangan Pindah Keluar']])('jenis %s → label "%s"', async (jenis, label) => {
    m(svc.getPerpindahanById).mockResolvedValue(tervalidasi({ jenis }))
    m(surat.generateSuratPerpindahanPdf).mockResolvedValue(Buffer.from('pdf'))
    await request(app).post('/api/perpindahan/3/kirim-email').set(auth('MAJELIS'))
    expect(m(email.sendSuratPerpindahanEmail).mock.calls[0]![2]).toBe(label)
  })

  it('kegagalan pengiriman email tidak dilaporkan sukses', async () => {
    m(svc.getPerpindahanById).mockResolvedValue(tervalidasi())
    m(surat.generateSuratPerpindahanPdf).mockResolvedValue(Buffer.from('pdf'))
    m(email.sendSuratPerpindahanEmail).mockRejectedValue(new Error('SMTP down'))
    const res = await request(app).post('/api/perpindahan/3/kirim-email').set(auth('SUPERADMIN'))
    expect(res.status).toBe(500)
  })
})
