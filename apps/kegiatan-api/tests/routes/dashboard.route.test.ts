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
    expect(u5).toMatchObject({ kode: 'U5', pagu: 10_000_000, pengajuan: 5_000_000, tersedia: 5_000_000, status: 'UNDER', gereja: 3_000_000, mandiri: 2_000_000 })
    expect(u6).toMatchObject({ kode: 'U6', pagu: 3_000_000, pengajuan: 5_000_000, tersedia: -2_000_000, status: 'OVER' })
    expect(res.body.data.total).toMatchObject({ pagu: 13_000_000, pengajuan: 10_000_000, tersedia: 3_000_000 })
    expect(prisma.unit.findMany.mock.calls[0]![0].where).toEqual({ aktif: true })
  })

  it('pengurus: kueri unit dan program dibatasi ke unitnya; bidang lain tidak tampil', async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: 5, kode: 'U5', nama: 'Unit 5', singkatan: null, jenis: 'UPK', bidangId: 1, urutan: 1 }])
    const res = await request(app).get('/api/dashboard/pagu').set(masuk(prisma, pengguna('PENGURUS_UPK')))
    expect(prisma.unit.findMany.mock.calls[0]![0].where).toEqual({ aktif: true, id: 5 })
    expect(prisma.programKerja.findMany.mock.calls[0]![0].where.unit).toEqual({ aktif: true, id: 5 })
    expect(res.body.data.bidang.map((b: { kode: string }) => b.kode)).toEqual(['B1'])
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
