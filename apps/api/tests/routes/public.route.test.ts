import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'

const prisma: any = {
  warga: { findUnique: vi.fn() },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

beforeEach(() => { vi.clearAllMocks(); prisma.activityLog.create.mockResolvedValue({}) })

describe('GET /api/public/member/:id (tanpa login, dipakai QR kartu)', () => {
  it('id bukan angka → 400 dan DB tidak dibaca', async () => {
    const res = await request(app).get('/api/public/member/abc')
    expect(res.status).toBe(400)
    expect(prisma.warga.findUnique).not.toHaveBeenCalled()
  })

  it('anggota tidak ada → 404', async () => {
    prisma.warga.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/api/public/member/99')
    expect(res.status).toBe(404)
    expect(prisma.warga.findUnique.mock.calls[0]![0].where).toEqual({ id: 99 })
  })

  it('sukses tanpa token → 200 dengan data yang dikembalikan DB', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 5, namaLengkap: 'Ani', nomorAnggota: 'WRG00005' })
    const res = await request(app).get('/api/public/member/5')
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: 5, namaLengkap: 'Ani' })
  })

  // Batas privasi (UU PDP): endpoint tanpa login hanya boleh meminta kolom ini dari DB.
  // Menambah kolom baru (NIK, telepon, alamat, tanggal lahir, email) harus disengaja dan mengubah tes ini.
  it('hanya memilih kolom terbatas — tidak ada NIK, kontak, alamat, atau tanggal lahir', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 5 })
    await request(app).get('/api/public/member/5')
    const select = prisma.warga.findUnique.mock.calls[0]![0].select
    expect(Object.keys(select).sort()).toEqual([
      'dataStatus', 'fotoUrl', 'id', 'jenisKelamin', 'keluarga', 'namaLengkap', 'namaPanggilan',
      'nomorAnggota', 'nomorInduk', 'statusKeanggotaan', 'statusKeluarga', 'sudahBaptis', 'sudahSidi',
    ])
    for (const terlarang of ['nik', 'telepon', 'whatsapp', 'email', 'alamatKtp', 'alamatDomisili', 'tanggalLahir', 'tempatLahir', 'latitude', 'longitude']) {
      expect(select).not.toHaveProperty(terlarang)
    }
  })
})
