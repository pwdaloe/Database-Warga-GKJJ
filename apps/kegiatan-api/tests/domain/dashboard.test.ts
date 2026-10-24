import { describe, it, expect } from 'vitest'
import { rasioKemandirian, statusPagu, susunDashboard, type MasukanProgram } from '../../src/domain/dashboard.js'

describe('statusPagu', () => {
  it('pengajuan 0 = BELUM_MENGAJUKAN (bukan Under), berapa pun paguya', () => {
    expect(statusPagu(3_000_000, 0)).toBe('BELUM_MENGAJUKAN')
    expect(statusPagu(0, 0)).toBe('BELUM_MENGAJUKAN')
  })
  it('di bawah pagu = UNDER, di atas = OVER, sama = SESUAI', () => {
    expect(statusPagu(25_000_000, 19_950_000)).toBe('UNDER')
    expect(statusPagu(50_000_000, 100_440_000)).toBe('OVER')
    expect(statusPagu(3_000_000, 3_000_000)).toBe('SESUAI')
  })
  it('pagu 0 tetapi ada pengajuan = OVER', () => {
    expect(statusPagu(0, 1)).toBe('OVER')
  })
})

describe('rasioKemandirian', () => {
  it('mandiri / total; null bila total 0', () => {
    expect(rasioKemandirian(7_000_000, 5_000_000)).toBeCloseTo(5 / 12)
    expect(rasioKemandirian(0, 0)).toBeNull()
    expect(rasioKemandirian(100, 0)).toBe(0)
  })
})

const unit = (id: number, bidangId: number, urutan = id) => ({ id, kode: `U${id}`, nama: `Unit ${id}`, singkatan: null, jenis: 'UPK' as const, bidangId, urutan })
const prog = (id: number, unitId: number, status: 'DRAFT' | 'DIAJUKAN', totalRab: number, extra: Partial<MasukanProgram> = {}): MasukanProgram => ({
  id, unitId, status, totalRab, gereja: totalRab, swadaya: 0, penggalangan: 0, donasi: 0, acuanIds: [], ...extra,
})

describe('susunDashboard', () => {
  const dasar = {
    units: [unit(1, 10), unit(2, 10), unit(3, 20)],
    bidang: [{ id: 10, kode: 'B1', nama: 'Bidang 1', urutan: 1 }, { id: 20, kode: 'B2', nama: 'Bidang 2', urutan: 2 }],
    pagu: new Map([[1, 10_000_000], [2, 5_000_000], [3, 0]]),
    acuan: [{ id: 100, kode: 'IMAN', nama: 'Iman', jenis: 'MISI' }, { id: 101, kode: 'KOTA', nama: 'Kota', jenis: 'MISI' }],
  }

  it('hanya program DIAJUKAN dihitung sebagai pengajuan; draft dilaporkan terpisah', () => {
    const h = susunDashboard({ ...dasar, programs: [prog(1, 1, 'DIAJUKAN', 4_000_000), prog(2, 1, 'DRAFT', 9_000_000)] })
    const u1 = h.unit.find((u) => u.unitId === 1)!
    expect(u1.pengajuan).toBe(4_000_000)
    expect(u1.draft).toBe(9_000_000)
    expect(u1.tersedia).toBe(6_000_000)
    expect(u1.status).toBe('UNDER')
    expect(u1.jumlahDiajukan).toBe(1)
    expect(u1.jumlahDraft).toBe(1)
  })

  it('unit yang hanya punya draft tetap BELUM_MENGAJUKAN', () => {
    const h = susunDashboard({ ...dasar, programs: [prog(1, 2, 'DRAFT', 1_000_000)] })
    expect(h.unit.find((u) => u.unitId === 2)!.status).toBe('BELUM_MENGAJUKAN')
  })

  it('total, ringkasan status, dan sumber dana gereja vs mandiri', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [
        prog(1, 1, 'DIAJUKAN', 12_000_000, { gereja: 7_000_000, swadaya: 2_000_000, penggalangan: 2_000_000, donasi: 1_000_000 }),
        prog(2, 2, 'DIAJUKAN', 5_000_000),
      ],
    })
    expect(h.total.pagu).toBe(15_000_000)
    expect(h.total.pengajuan).toBe(17_000_000)
    expect(h.total.tersedia).toBe(-2_000_000)
    expect(h.total.gereja).toBe(12_000_000)
    expect(h.total.mandiri).toBe(5_000_000)
    expect(h.total.rasioKemandirian).toBeCloseTo(5 / 17)
    expect(h.ringkasStatus).toEqual({ BELUM_MENGAJUKAN: 1, UNDER: 0, OVER: 1, SESUAI: 1 })
  })

  it('rekap per bidang menjumlah unit di bidangnya', () => {
    const h = susunDashboard({ ...dasar, programs: [prog(1, 1, 'DIAJUKAN', 3_000_000), prog(2, 3, 'DIAJUKAN', 1_000_000)] })
    const b1 = h.bidang.find((b) => b.bidangId === 10)!
    expect(b1).toMatchObject({ jumlahUnit: 2, pagu: 15_000_000, pengajuan: 3_000_000, tersedia: 12_000_000 })
    expect(h.bidang.find((b) => b.bidangId === 20)).toMatchObject({ pagu: 0, pengajuan: 1_000_000, tersedia: -1_000_000 })
  })

  it('per acuan: program dengan beberapa acuan terhitung pada tiap acuan; draft tidak dihitung', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [prog(1, 1, 'DIAJUKAN', 2_000_000, { acuanIds: [100, 101] }), prog(2, 1, 'DIAJUKAN', 1_000_000, { acuanIds: [100] }), prog(3, 1, 'DRAFT', 9_000_000, { acuanIds: [100] })],
    })
    expect(h.acuan.find((a) => a.acuanId === 100)).toMatchObject({ jumlahProgram: 2, totalRabTerkait: 3_000_000 })
    expect(h.acuan.find((a) => a.acuanId === 101)).toMatchObject({ jumlahProgram: 1, totalRabTerkait: 2_000_000 })
  })

  it('unit di luar cakupan (tidak ada di units) tidak ikut terhitung pada acuan', () => {
    const h = susunDashboard({ ...dasar, units: [unit(1, 10)], programs: [prog(1, 1, 'DIAJUKAN', 1_000_000, { acuanIds: [100] }), prog(2, 99, 'DIAJUKAN', 7_000_000, { acuanIds: [100] })] })
    expect(h.acuan.find((a) => a.acuanId === 100)!.totalRabTerkait).toBe(1_000_000)
    expect(h.total.pengajuan).toBe(1_000_000)
  })

  it('urutan unit mengikuti urutan lalu nama', () => {
    const h = susunDashboard({ ...dasar, units: [unit(3, 20, 1), unit(1, 10, 2), unit(2, 10, 2)], programs: [] })
    expect(h.unit.map((u) => u.unitId)).toEqual([3, 1, 2])
  })
})
