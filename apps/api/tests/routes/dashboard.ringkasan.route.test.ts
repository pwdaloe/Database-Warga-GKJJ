import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const prisma: any = {
  warga: { count: vi.fn(), findMany: vi.fn() },
  keluarga: { count: vi.fn(), groupBy: vi.fn() },
  kelompok: { count: vi.fn(), findUnique: vi.fn() },
  wilayah: { findMany: vi.fn() },
  komisiConfig: { findMany: vi.fn() },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

const tok = (role: string, kelompokId: number | null = null) => jwt.sign({ userId: 1, role, kelompokId }, process.env.JWT_SECRET!)
const get = (path: string, role = 'SUPERADMIN', kelompokId: number | null = null) =>
  request(app).get(path).set('Authorization', `Bearer ${tok(role, kelompokId)}`)

beforeAll(() => { process.env.JWT_SECRET = 'test-jwt-secret' })
beforeEach(() => {
  vi.clearAllMocks()
  prisma.activityLog.create.mockResolvedValue({})
  prisma.warga.count.mockResolvedValue(0)
  prisma.warga.findMany.mockResolvedValue([])
  prisma.keluarga.count.mockResolvedValue(0)
  prisma.keluarga.groupBy.mockResolvedValue([])
  prisma.kelompok.count.mockResolvedValue(0)
  prisma.kelompok.findUnique.mockResolvedValue(null)
  prisma.wilayah.findMany.mockResolvedValue([])
  prisma.komisiConfig.findMany.mockResolvedValue([])
})

describe('GET /api/dashboard/* tanpa token', () => {
  it.each(['stats', 'sebaran', 'terbaru', 'demografi', 'komisi-stats', 'map'])('%s → 401', async (ep) => {
    expect((await request(app).get(`/api/dashboard/${ep}`)).status).toBe(401)
  })
})

describe('GET /api/dashboard/stats', () => {
  it('mengembalikan empat angka ringkasan; kelompok null untuk non-penatua', async () => {
    prisma.warga.count.mockResolvedValueOnce(76).mockResolvedValueOnce(74)   // total, lalu draft
    prisma.keluarga.count.mockResolvedValue(7)
    prisma.kelompok.count.mockResolvedValue(23)
    const res = await get('/api/dashboard/stats')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ totalWarga: 76, totalKeluarga: 7, wargaDraft: 74, kelompokAktif: 23, kelompok: null })
    expect(prisma.kelompok.findUnique).not.toHaveBeenCalled()
  })

  it('penghitung "draft" dibatasi dataStatus DRAFT dan cakupan pengguna', async () => {
    await get('/api/dashboard/stats', 'PENATUA_KELOMPOK', 3)
    const draftWhere = prisma.warga.count.mock.calls[1]![0].where
    expect(JSON.stringify(draftWhere)).toContain('"dataStatus":"DRAFT"')
    expect(JSON.stringify(draftWhere)).toContain('"kelompokId":3')
  })

  it('filter wilayah/kelompok membatasi hitungan kelompok aktif; filter tidak valid diabaikan', async () => {
    await get('/api/dashboard/stats?wilayahId=2&kelompokId=9')
    expect(prisma.kelompok.count.mock.calls[0]![0].where).toEqual({ aktif: true, wilayahId: 2, id: 9 })
    await get('/api/dashboard/stats?wilayahId=abc&kelompokId=-1')
    expect(prisma.kelompok.count.mock.calls[1]![0].where).toEqual({ aktif: true })
  })

  it('penatua menerima identitas kelompoknya sendiri', async () => {
    prisma.kelompok.findUnique.mockResolvedValue({ id: 3, kode: 'A1', nama: 'Cempaka Baru' })
    const res = await get('/api/dashboard/stats', 'PENATUA_KELOMPOK', 3)
    expect(res.body.data.kelompok).toEqual({ id: 3, kode: 'A1', nama: 'Cempaka Baru' })
    expect(prisma.kelompok.findUnique.mock.calls[0]![0].where).toEqual({ id: 3 })
  })

  it('penatua tanpa kelompok: angka dibatasi ke "tidak ada data" (fail-closed)', async () => {
    await get('/api/dashboard/stats', 'PENATUA_KELOMPOK', null)
    expect(prisma.warga.count.mock.calls[0]![0].where.id).toBe(-1)
    expect(prisma.keluarga.count.mock.calls[0]![0].where.id).toBe(-1)
  })
})

describe('GET /api/dashboard/sebaran', () => {
  const wilayah = [
    { id: 1, kode: 'A', nama: 'Rawamangun A', kelompoks: [{ id: 11, kode: 'A1', nama: 'Cempaka' }, { id: 12, kode: 'A2', nama: 'Kosong' }] },
    { id: 2, kode: 'B', nama: 'Rawamangun B', kelompoks: [{ id: 21, kode: 'B1', nama: 'Cipinang' }] },
  ]

  it('menjumlah warga/KK per kelompok, menyembunyikan kelompok kosong, wilayah tetap tampil', async () => {
    prisma.wilayah.findMany.mockResolvedValue(wilayah)
    prisma.warga.findMany.mockResolvedValue([
      { keluarga: { kelompokId: 11 } }, { keluarga: { kelompokId: 11 } }, { keluarga: { kelompokId: 11 } },
      { keluarga: null }, { keluarga: { kelompokId: null } },   // tanpa KK/kelompok tidak dihitung
    ])
    prisma.keluarga.groupBy.mockResolvedValue([{ kelompokId: 11, _count: { _all: 2 } }, { kelompokId: null, _count: { _all: 4 } }])
    const res = await get('/api/dashboard/sebaran')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([
      { id: 1, kode: 'A', nama: 'Rawamangun A', jumlahWarga: 3, jumlahKeluarga: 2, kelompok: [{ id: 11, kode: 'A1', nama: 'Cempaka', jumlahWarga: 3, jumlahKeluarga: 2 }] },
      { id: 2, kode: 'B', nama: 'Rawamangun B', jumlahWarga: 0, jumlahKeluarga: 0, kelompok: [] },
    ])
  })

  it('penatua hanya melihat wilayah yang memuat kelompoknya (wilayah kosong disembunyikan)', async () => {
    prisma.wilayah.findMany.mockResolvedValue(wilayah)
    prisma.warga.findMany.mockResolvedValue([{ keluarga: { kelompokId: 11 } }])
    prisma.keluarga.groupBy.mockResolvedValue([{ kelompokId: 11, _count: { _all: 1 } }])
    const res = await get('/api/dashboard/sebaran', 'PENATUA_KELOMPOK', 11)
    expect(res.body.data.map((w: any) => w.kode)).toEqual(['A'])
  })

  it('filter wilayah/kelompok diteruskan ke query wilayah', async () => {
    await get('/api/dashboard/sebaran?wilayahId=2&kelompokId=21')
    const arg = prisma.wilayah.findMany.mock.calls[0]![0]
    expect(arg.where).toEqual({ id: 2 })
    expect(arg.select.kelompoks.where).toEqual({ id: 21 })
  })
})

describe('GET /api/dashboard/terbaru', () => {
  it('mengambil 5 warga terbaru dan menyusun majelis: penatua terdaftar lebih diutamakan dari nama sementara', async () => {
    prisma.warga.findMany.mockResolvedValue([
      { id: 1, namaLengkap: 'A', createdAt: new Date('2026-10-01'), dataStatus: 'DRAFT',
        keluarga: { kelompok: { kode: 'A1', nama: 'Cempaka', penatua_nama_temp: 'Sementara', penatua: { namaLengkap: 'Pak Resmi' }, wilayah: { kode: 'A', nama: 'Rawamangun A' } } } },
      { id: 2, namaLengkap: 'B', createdAt: new Date('2026-09-01'), dataStatus: 'AKTIF',
        keluarga: { kelompok: { kode: 'B1', nama: 'Cipinang', penatua_nama_temp: 'Bu Sementara', penatua: null, wilayah: { kode: 'B', nama: 'Rawamangun B' } } } },
      { id: 3, namaLengkap: 'C', createdAt: new Date('2026-08-01'), dataStatus: 'AKTIF', keluarga: null },
    ])
    const res = await get('/api/dashboard/terbaru')
    const arg = prisma.warga.findMany.mock.calls[0]![0]
    expect(arg.take).toBe(5)
    expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    expect(res.body.data.map((w: any) => w.majelis)).toEqual(['Pak Resmi', 'Bu Sementara', null])
    expect(res.body.data[2]).toMatchObject({ kelompok: null, wilayah: null })
    expect(res.body.data[0]).toMatchObject({ kelompok: { kode: 'A1', nama: 'Cempaka' }, wilayah: { kode: 'A', nama: 'Rawamangun A' } })
  })

  it('penatua dibatasi ke kelompoknya', async () => {
    await get('/api/dashboard/terbaru', 'PENATUA_KELOMPOK', 4)
    expect(JSON.stringify(prisma.warga.findMany.mock.calls[0]![0].where)).toContain('"kelompokId":4')
  })
})

describe('GET /api/dashboard/komisi-stats', () => {
  it('menghitung warga AKTIF per komisi dengan rentang tanggal lahir dari usia min/maks', async () => {
    prisma.komisiConfig.findMany.mockResolvedValue([
      { id: 1, nama: 'Anak', warna: '#111', minUsia: 0, maxUsia: 11, urutan: 1 },
      { id: 2, nama: 'Adiyuswa', warna: '#222', minUsia: 60, maxUsia: null, urutan: 2 },
    ])
    prisma.warga.count.mockResolvedValueOnce(4).mockResolvedValueOnce(9)
    const res = await get('/api/dashboard/komisi-stats')
    expect(res.body.data).toEqual([
      { id: 1, nama: 'Anak', jumlah: 4, warna: '#111', minUsia: 0, maxUsia: 11 },
      { id: 2, nama: 'Adiyuswa', jumlah: 9, warna: '#222', minUsia: 60, maxUsia: null },
    ])
    const [anak, adiyuswa] = prisma.warga.count.mock.calls.map((c: any) => c[0].where)
    expect(anak.statusKeanggotaan).toBe('AKTIF')
    expect(anak.tanggalLahir.gt).toBeInstanceOf(Date)       // batas bawah ada karena maxUsia terisi
    expect(adiyuswa.tanggalLahir.gt).toBeUndefined()        // tanpa batas atas usia
    const tahun = new Date().getFullYear()
    expect(adiyuswa.tanggalLahir.lte.getFullYear()).toBe(tahun - 60)
    expect(anak.tanggalLahir.gt.getFullYear()).toBe(tahun - 11 - 1)
  })

  it('penatua tanpa kelompok: hitungan dibatasi fail-closed', async () => {
    prisma.komisiConfig.findMany.mockResolvedValue([{ id: 1, nama: 'Anak', warna: '#111', minUsia: 0, maxUsia: 11, urutan: 1 }])
    await get('/api/dashboard/komisi-stats', 'PENATUA_KELOMPOK', null)
    expect(prisma.warga.count.mock.calls[0]![0].where.id).toBe(-1)
  })
})
