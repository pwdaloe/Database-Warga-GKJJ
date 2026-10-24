import 'express-async-errors'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'

const prisma: any = {
  warga: { findUnique: vi.fn() },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

const TOKEN = '0123456789abcdef0123456789abcdef'
const TOKEN_LAIN = 'fedcba9876543210fedcba9876543210'
const ENV_ASLI = process.env['QR_ALLOW_LEGACY_ID']

beforeEach(() => {
  vi.clearAllMocks()
  prisma.activityLog.create.mockResolvedValue({})
  delete process.env['QR_ALLOW_LEGACY_ID']
})
afterEach(() => {
  if (ENV_ASLI === undefined) delete process.env['QR_ALLOW_LEGACY_ID']
  else process.env['QR_ALLOW_LEGACY_ID'] = ENV_ASLI
})

describe('GET /api/public/member/:token (tanpa login, dipakai QR kartu)', () => {
  it('token valid → 200, DB dicari lewat qrToken (bukan id)', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 5, namaLengkap: 'Ani', nomorAnggota: 'WRG00005' })
    const res = await request(app).get(`/api/public/member/${TOKEN}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: 5, namaLengkap: 'Ani' })
    expect(prisma.warga.findUnique.mock.calls[0]![0].where).toEqual({ qrToken: TOKEN })
  })

  it('token berformat benar tapi tidak ada di DB → 404', async () => {
    prisma.warga.findUnique.mockResolvedValue(null)
    const res = await request(app).get(`/api/public/member/${TOKEN_LAIN}`)
    expect(res.status).toBe(404)
  })

  it('token berformat salah → 404 dan DB tidak dibaca', async () => {
    for (const salah of ['abc', 'ABCDEF0123456789ABCDEF0123456789', 'x'.repeat(32), `${TOKEN}0`]) {
      const res = await request(app).get(`/api/public/member/${salah}`)
      expect(res.status).toBe(404)
    }
    expect(prisma.warga.findUnique).not.toHaveBeenCalled()
  })

  it('token salah format dan token tak ada → 404 dengan badan respons IDENTIK (tanpa oracle)', async () => {
    prisma.warga.findUnique.mockResolvedValue(null)
    const tidakAda = await request(app).get(`/api/public/member/${TOKEN_LAIN}`)
    const salahFormat = await request(app).get('/api/public/member/abc')
    const idLamaMati = await request(app).get('/api/public/member/5')
    expect(tidakAda.body).toEqual(salahFormat.body)
    expect(tidakAda.body).toEqual(idLamaMati.body)
  })

  it('respons tidak boleh di-cache dan tidak boleh diindeks', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 5 })
    const ok = await request(app).get(`/api/public/member/${TOKEN}`)
    const gagal = await request(app).get('/api/public/member/abc')
    for (const res of [ok, gagal]) {
      expect(res.headers['cache-control']).toBe('no-store')
      expect(res.headers['x-robots-tag']).toContain('noindex')
    }
  })

  // Batas privasi (UU PDP): endpoint tanpa login hanya boleh meminta kolom ini dari DB.
  // Menambah kolom baru (NIK, telepon, alamat, tanggal lahir, email) harus disengaja dan mengubah tes ini.
  it('hanya memilih kolom terbatas — tidak ada NIK, kontak, alamat, tanggal lahir, atau token', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 5 })
    await request(app).get(`/api/public/member/${TOKEN}`)
    const select = prisma.warga.findUnique.mock.calls[0]![0].select
    expect(Object.keys(select).sort()).toEqual([
      'dataStatus', 'fotoUrl', 'id', 'jenisKelamin', 'keluarga', 'namaLengkap', 'namaPanggilan',
      'nomorAnggota', 'nomorInduk', 'statusKeanggotaan', 'statusKeluarga', 'sudahBaptis', 'sudahSidi',
    ])
    for (const terlarang of ['nik', 'telepon', 'whatsapp', 'email', 'alamatKtp', 'alamatDomisili', 'tanggalLahir', 'tempatLahir', 'latitude', 'longitude', 'qrToken']) {
      expect(select).not.toHaveProperty(terlarang)
    }
  })
})

describe('Jalur id numerik lama (sakelar QR_ALLOW_LEGACY_ID)', () => {
  it('env tidak diset → id numerik 404 dan DB tidak dibaca (aman secara bawaan)', async () => {
    const res = await request(app).get('/api/public/member/5')
    expect(res.status).toBe(404)
    expect(prisma.warga.findUnique).not.toHaveBeenCalled()
  })

  it('env "true" → id numerik masih dilayani lewat where id', async () => {
    process.env['QR_ALLOW_LEGACY_ID'] = 'true'
    prisma.warga.findUnique.mockResolvedValue({ id: 5, namaLengkap: 'Ani' })
    const res = await request(app).get('/api/public/member/5')
    expect(res.status).toBe(200)
    expect(prisma.warga.findUnique.mock.calls[0]![0].where).toEqual({ id: 5 })
  })

  it('env "false" → id numerik 404', async () => {
    process.env['QR_ALLOW_LEGACY_ID'] = 'false'
    expect((await request(app).get('/api/public/member/5')).status).toBe(404)
    expect(prisma.warga.findUnique).not.toHaveBeenCalled()
  })

  it.each(['TRUE', '1', 'yes', ' true', 'true ', ''])('nilai env tidak valid %j → dianggap mati', async (nilai) => {
    process.env['QR_ALLOW_LEGACY_ID'] = nilai
    expect((await request(app).get('/api/public/member/5')).status).toBe(404)
    expect(prisma.warga.findUnique).not.toHaveBeenCalled()
  })

  it('env "true" tidak membuka jalur lain: token salah format tetap 404', async () => {
    process.env['QR_ALLOW_LEGACY_ID'] = 'true'
    expect((await request(app).get('/api/public/member/abc')).status).toBe(404)
    expect(prisma.warga.findUnique).not.toHaveBeenCalled()
  })
})
