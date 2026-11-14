import { describe, it, expect } from 'vitest'
import { klasifikasiPendanaan, rasioKemandirian, statusPagu, susunDashboard, type MasukanProgram } from '../../src/domain/dashboard.js'

describe('statusPagu (dana Gereja vs pagu)', () => {
  it('belum ada program diajukan = BELUM_MENGAJUKAN (bukan Under), berapa pun pagunya', () => {
    expect(statusPagu(3_000_000, 0, 0)).toBe('BELUM_MENGAJUKAN')
    expect(statusPagu(0, 0, 0)).toBe('BELUM_MENGAJUKAN')
  })
  it('sudah mengajukan tetapi tanpa dana Gereja = MANDIRI', () => {
    expect(statusPagu(3_000_000, 0, 2)).toBe('MANDIRI')
    expect(statusPagu(0, 0, 1)).toBe('MANDIRI')
  })
  it('di bawah pagu = UNDER, di atas = OVER, sama = SESUAI', () => {
    expect(statusPagu(25_000_000, 19_950_000, 1)).toBe('UNDER')
    expect(statusPagu(50_000_000, 100_440_000, 1)).toBe('OVER')
    expect(statusPagu(3_000_000, 3_000_000, 1)).toBe('SESUAI')
  })
  it('pagu 0 tetapi meminta dana Gereja = OVER', () => {
    expect(statusPagu(0, 1, 1)).toBe('OVER')
  })
})

describe('klasifikasiPendanaan', () => {
  it('mandiri penuh, campuran, bergantung Kas Jemaat; tanpa pendanaan = null', () => {
    expect(klasifikasiPendanaan(0, 5_000_000)).toBe('MANDIRI_PENUH')
    expect(klasifikasiPendanaan(3_000_000, 2_000_000)).toBe('CAMPURAN')
    expect(klasifikasiPendanaan(5_000_000, 0)).toBe('BERGANTUNG_KAS')
    expect(klasifikasiPendanaan(0, 0)).toBeNull()
  })
})

describe('rasioKemandirian', () => {
  it('mandiri / total; null bila total 0', () => {
    expect(rasioKemandirian(7_000_000, 5_000_000)).toBeCloseTo(5 / 12)
    expect(rasioKemandirian(0, 0)).toBeNull()
    expect(rasioKemandirian(100, 0)).toBe(0)
  })
})

const unit = (id: number, bidangId: number, urutan = id, jenis: 'UPK' | 'POS' = 'UPK') => ({ id, kode: `U${id}`, nama: `Unit ${id}`, singkatan: null, jenis, bidangId, urutan })
/** Bawaan: seluruh RAB dari dana Gereja; ubah lewat extra. */
const prog = (id: number, unitId: number, status: 'DRAFT' | 'DIAJUKAN', totalRab: number, extra: Partial<MasukanProgram> = {}): MasukanProgram => ({
  id, unitId, status, totalRab, gereja: totalRab, swadaya: 0, penggalangan: 0, donasi: 0, acuanIds: [], ...extra,
})

describe('susunDashboard', () => {
  const dasar = {
    units: [unit(1, 10), unit(2, 10), unit(3, 20)],
    bidang: [{ id: 10, kode: 'B1', nama: 'Bidang 1', urutan: 1 }, { id: 20, kode: 'B2', nama: 'Bidang 2', urutan: 2 }],
    pagu: new Map([[1, 10_000_000], [2, 5_000_000], [3, 0]]),
    paguBidang: new Map<number, number>(),
    proyeksiKasJemaat: 0,
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

  it('pembanding pagu adalah porsi dana Gereja, bukan total RAB', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [prog(1, 1, 'DIAJUKAN', 30_000_000, { gereja: 8_000_000, swadaya: 22_000_000 })],
    })
    const u1 = h.unit.find((u) => u.unitId === 1)!
    expect(u1.pengajuan).toBe(30_000_000) // RAB penuh tetap dilaporkan
    expect(u1.gereja).toBe(8_000_000)
    expect(u1.tersedia).toBe(2_000_000) // 10 jt - 8 jt dana Gereja
    expect(u1.status).toBe('UNDER')
  })

  it('unit yang hanya punya draft tetap BELUM_MENGAJUKAN', () => {
    const h = susunDashboard({ ...dasar, programs: [prog(1, 2, 'DRAFT', 1_000_000)] })
    expect(h.unit.find((u) => u.unitId === 2)!.status).toBe('BELUM_MENGAJUKAN')
  })

  it('unit yang seluruh programnya mandiri penuh berstatus MANDIRI dan program tanpa Kas Jemaat dihitung', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [
        prog(1, 1, 'DIAJUKAN', 6_000_000, { gereja: 0, swadaya: 4_000_000, penggalangan: 2_000_000 }),
        prog(2, 1, 'DIAJUKAN', 3_000_000, { gereja: 0, donasi: 3_000_000 }),
      ],
    })
    const u1 = h.unit.find((u) => u.unitId === 1)!
    expect(u1.status).toBe('MANDIRI')
    expect(u1.klasifikasi).toBe('MANDIRI_PENUH')
    expect(u1.program).toEqual({ mandiriPenuh: 2, campuran: 0, bergantungKas: 0 })
    expect(u1.rabTanpaKas).toBe(9_000_000)
    expect(u1).toMatchObject({ gereja: 0, swadaya: 4_000_000, penggalangan: 2_000_000, donasi: 3_000_000, mandiri: 9_000_000 })
  })

  it('klasifikasi unit campuran: ada program mandiri penuh sekaligus program yang memakai Kas Jemaat', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [
        prog(1, 1, 'DIAJUKAN', 5_000_000, { gereja: 0, swadaya: 5_000_000 }),
        prog(2, 1, 'DIAJUKAN', 4_000_000), // bergantung Kas Jemaat
        prog(3, 1, 'DIAJUKAN', 6_000_000, { gereja: 2_000_000, penggalangan: 4_000_000 }), // campuran
      ],
    })
    const u1 = h.unit.find((u) => u.unitId === 1)!
    expect(u1.klasifikasi).toBe('CAMPURAN')
    expect(u1.program).toEqual({ mandiriPenuh: 1, campuran: 1, bergantungKas: 1 })
    expect(u1.rabTanpaKas).toBe(5_000_000)
    expect(u1.gereja).toBe(6_000_000)
  })

  it('total, ringkasan status, dan sumber dana gereja vs mandiri', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [
        prog(1, 1, 'DIAJUKAN', 12_000_000, { gereja: 7_000_000, swadaya: 2_000_000, penggalangan: 2_000_000, donasi: 1_000_000 }),
        prog(2, 3, 'DIAJUKAN', 1_000_000),
        prog(3, 2, 'DRAFT', 2_000_000),
      ],
    })
    expect(h.total).toMatchObject({ pengajuan: 13_000_000, draft: 2_000_000, gereja: 8_000_000, mandiri: 5_000_000, jumlahDiajukan: 2, jumlahDraft: 1 })
    expect(h.total.rasioKemandirian).toBeCloseTo(5 / 13)
    expect(h.ringkasStatus).toEqual({ BELUM_MENGAJUKAN: 1, MANDIRI: 0, UNDER: 1, OVER: 1, SESUAI: 0 })
  })

  it('pagu bidang UPK memakai angka keuangan; alokasi UPK hanya panduan dan sisanya "belum dialokasikan"', () => {
    const h = susunDashboard({
      ...dasar,
      paguBidang: new Map([[10, 20_000_000]]), // alokasi UPK = 10 jt + 5 jt = 15 jt
      programs: [prog(1, 1, 'DIAJUKAN', 12_000_000), prog(2, 2, 'DIAJUKAN', 9_000_000)],
    })
    const b1 = h.bidang.find((b) => b.bidangId === 10)!
    expect(b1.pagu).toBe(20_000_000)
    expect(b1.alokasiTerbagi).toBe(15_000_000)
    expect(b1.belumDialokasikan).toBe(5_000_000)
    expect(b1.gereja).toBe(21_000_000)
    // bidang dibandingkan pada pagu bidang (batas keras), bukan alokasi per UPK
    expect(b1.tersedia).toBe(-1_000_000)
    expect(b1.status).toBe('OVER')
    // satu UPK boleh melebihi alokasi indikatifnya selama bidang masih cukup
    const b2 = susunDashboard({ ...dasar, paguBidang: new Map([[10, 30_000_000]]), programs: [prog(1, 1, 'DIAJUKAN', 14_000_000)] })
    expect(b2.unit.find((u) => u.unitId === 1)!.status).toBe('OVER')
    expect(b2.bidang.find((b) => b.bidangId === 10)!.status).toBe('UNDER')
  })

  it('bidang tanpa pagu bidang tersimpan memakai jumlah alokasi; bidang pos memakai jumlah pagu pos', () => {
    const h = susunDashboard({
      units: [unit(1, 10), unit(7, 30, 7, 'POS'), unit(8, 30, 8, 'POS')],
      bidang: [{ id: 10, kode: 'B1', nama: 'B1', urutan: 1 }, { id: 30, kode: 'PTL', nama: 'Penatalayanan', urutan: 2 }],
      pagu: new Map([[1, 4_000_000], [7, 100_000_000], [8, 50_000_000]]),
      paguBidang: new Map([[30, 999]]), // diabaikan untuk bidang pos
      proyeksiKasJemaat: 0,
      programs: [],
      acuan: [],
    })
    expect(h.bidang.find((b) => b.bidangId === 10)!.pagu).toBe(4_000_000)
    const ptl = h.bidang.find((b) => b.bidangId === 30)!
    expect(ptl.pagu).toBe(150_000_000)
    expect(ptl.belumDialokasikan).toBe(0)
  })

  it('total pagu = jumlah pagu bidang; selisih terhadap proyeksi Kas Jemaat (negatif bila pagu melebihi proyeksi)', () => {
    const h = susunDashboard({ ...dasar, paguBidang: new Map([[10, 20_000_000], [20, 8_000_000]]), proyeksiKasJemaat: 25_000_000, programs: [] })
    expect(h.total.pagu).toBe(28_000_000)
    expect(h.total.proyeksiKasJemaat).toBe(25_000_000)
    expect(h.total.selisihProyeksi).toBe(-3_000_000)
  })

  it('urutan unit mengikuti urutan lalu nama', () => {
    const h = susunDashboard({ ...dasar, units: [unit(3, 20, 1), unit(1, 10, 2), unit(2, 10, 2)], programs: [] })
    expect(h.unit.map((u) => u.unitId)).toEqual([3, 1, 2])
  })

  it('per acuan: program dengan beberapa acuan terhitung pada tiap acuan; draft tidak dihitung', () => {
    const h = susunDashboard({
      ...dasar,
      programs: [prog(1, 1, 'DIAJUKAN', 4_000_000, { acuanIds: [100, 101] }), prog(2, 2, 'DIAJUKAN', 1_000_000, { acuanIds: [100] }), prog(3, 3, 'DRAFT', 9_000_000, { acuanIds: [101] })],
    })
    expect(h.acuan.find((a) => a.acuanId === 100)).toMatchObject({ jumlahProgram: 2, totalRabTerkait: 5_000_000 })
    expect(h.acuan.find((a) => a.acuanId === 101)).toMatchObject({ jumlahProgram: 1, totalRabTerkait: 4_000_000 })
  })

  it('unit di luar cakupan (tidak ada di units) tidak ikut terhitung pada acuan', () => {
    const h = susunDashboard({ ...dasar, units: [unit(1, 10)], programs: [prog(1, 1, 'DIAJUKAN', 1_000_000, { acuanIds: [100] }), prog(2, 3, 'DIAJUKAN', 7_000_000, { acuanIds: [100] })] })
    expect(h.acuan.find((a) => a.acuanId === 100)).toMatchObject({ jumlahProgram: 1, totalRabTerkait: 1_000_000 })
  })
})
