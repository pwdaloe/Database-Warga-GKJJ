import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { buatPrisma, masuk, pengguna, tahunDb } from '../helpers/harness.js'

const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.logAudit.create.mockResolvedValue({})
  prisma.tahunAnggaran.findFirst.mockResolvedValue(tahunDb())
  prisma.bidang.findMany.mockResolvedValue([{ id: 1, kode: 'B1', nama: 'Bidang 1', urutan: 1 }, { id: 2, kode: 'B2', nama: 'Bidang 2', urutan: 2 }])
  prisma.unit.findMany.mockResolvedValue([
    { id: 5, kode: 'U5', nama: 'Unit 5', singkatan: null, jenis: 'UPK', bidangId: 1, urutan: 1 },
    { id: 6, kode: 'U6', nama: 'Unit 6', singkatan: null, jenis: 'UPK', bidangId: 2, urutan: 2 },
  ])
  prisma.paguUnit.findMany.mockResolvedValue([{ unitId: 5, nilai: 10_000_000n }, { unitId: 6, nilai: 3_000_000n }])
  prisma.paguBidang.findMany.mockResolvedValue([{ bidangId: 1, nilai: 12_000_000n }, { bidangId: 2, nilai: 4_000_000n }])
  prisma.acuanStrategis.findMany.mockResolvedValue([])
  prisma.programKerja.findMany.mockResolvedValue([
    { id: 1, unitId: 5, status: 'DIAJUKAN', rab: [{ jumlah: 4_000_000n }, { jumlah: 1_000_000n }], sumberDana: [{ jenis: 'GEREJA', nilai: 3_000_000n }, { jenis: 'SWADAYA', nilai: 2_000_000n }], acuan: [] },
    { id: 2, unitId: 6, status: 'DIAJUKAN', rab: [{ jumlah: 5_000_000n }], sumberDana: [{ jenis: 'GEREJA', nilai: 5_000_000n }], acuan: [] },
  ])
})

describe('GET /api/dashboard/pagu', () => {
  it('admin/majelis: semua unit; angka pagu vs pengajuan dan statusnya', async () => {
    const res = await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('MAJELIS')))
    expect(res.status).toBe(200)
    const [u5, u6] = res.body.data.unit
    // pembanding pagu = dana Gereja (3 jt dari RAB 5 jt)
    expect(u5).toMatchObject({ kode: 'U5', pagu: 10_000_000, pengajuan: 5_000_000, tersedia: 7_000_000, status: 'UNDER', gereja: 3_000_000, mandiri: 2_000_000, klasifikasi: 'CAMPURAN' })
    expect(u6).toMatchObject({ kode: 'U6', pagu: 3_000_000, pengajuan: 5_000_000, tersedia: -2_000_000, status: 'OVER', klasifikasi: 'BERGANTUNG_KAS' })
    // total pagu = jumlah pagu bidang (12 jt + 4 jt)
    expect(res.body.data.total).toMatchObject({ pagu: 16_000_000, pengajuan: 10_000_000, gereja: 8_000_000, tersedia: 8_000_000, proyeksiKasJemaat: 0 })
    expect(res.body.data.bidang.map((b: { kode: string; pagu: number }) => [b.kode, b.pagu])).toEqual([['B1', 12_000_000], ['B2', 4_000_000]])
    expect(prisma.unit.findMany.mock.calls[0]![0].where).toEqual({ aktif: true })
  })

  it('pengurus: kueri unit dan program dibatasi ke unitnya; bidang lain tidak tampil', async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: 5, kode: 'U5', nama: 'Unit 5', singkatan: null, jenis: 'UPK', bidangId: 1, urutan: 1 }])
    const res = await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('PENGURUS_UPK')))
    expect(prisma.unit.findMany.mock.calls[0]![0].where).toEqual({ aktif: true, id: 5 })
    expect(prisma.programKerja.findMany.mock.calls[0]![0].where.unit).toEqual({ aktif: true, id: 5 })
    // pengurus UPK tidak menerima baris bidang maupun proyeksi; total memakai pagu unitnya sendiri, bukan pagu bidang
    expect(res.body.data.bidang).toEqual([])
    expect(res.body.data.total.pagu).toBe(10_000_000)
    expect(res.body.data.total.proyeksiKasJemaat).toBeNull()
  })

  it('ketua bidang melihat baris bidangnya dengan pagu bidang, tanpa proyeksi Kas Jemaat', async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: 5, kode: 'U5', nama: 'Unit 5', singkatan: null, jenis: 'UPK', bidangId: 1, urutan: 1 }])
    const res = await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('KOORDINATOR_BIDANG')))
    expect(res.body.data.bidang.map((b: { kode: string; pagu: number }) => [b.kode, b.pagu])).toEqual([['B1', 12_000_000]])
    expect(res.body.data.total.proyeksiKasJemaat).toBeNull()
  })

  it('proyeksi Kas Jemaat dan selisihnya hanya untuk peran yang melihat seluruh pagu', async () => {
    prisma.tahunAnggaran.findFirst.mockResolvedValue({ ...tahunDb(), proyeksiKasJemaat: 20_000_000n })
    const res = await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('LP4WG')))
    expect(res.body.data.total).toMatchObject({ proyeksiKasJemaat: 20_000_000, selisihProyeksi: 4_000_000 })
  })

  it('koordinator dibatasi ke bidangnya; pengurus tanpa unit tidak mendapat unit mana pun', async () => {
    await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('KOORDINATOR_BIDANG')))
    expect(prisma.unit.findMany.mock.calls[0]![0].where).toEqual({ aktif: true, bidangId: 1 })
    await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('PENGURUS_UPK', { unitId: null })))
    expect(prisma.unit.findMany.mock.calls[1]![0].where).toEqual({ id: -1 })
  })

  it('tahun tidak ada → 404', async () => {
    prisma.tahunAnggaran.findFirst.mockResolvedValue(null)
    expect((await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('ADMIN')))).status).toBe(404)
  })
})
