export type StatusPagu = 'BELUM_MENGAJUKAN' | 'UNDER' | 'OVER' | 'SESUAI'

/**
 * Status perbandingan pagu vs pengajuan satu unit. `pengajuan` hanya program berstatus DIAJUKAN.
 * Pengajuan 0 = BELUM_MENGAJUKAN (bukan "Under": belum mengajukan tidak sama dengan hemat).
 */
export function statusPagu(pagu: number, pengajuan: number): StatusPagu {
  if (pengajuan === 0) return 'BELUM_MENGAJUKAN'
  const tersedia = pagu - pengajuan
  if (tersedia > 0) return 'UNDER'
  if (tersedia < 0) return 'OVER'
  return 'SESUAI'
}

export interface BarisUnit {
  unitId: number
  bidangId: number
  pagu: number
  pengajuan: number
}

export function tersedia(pagu: number, pengajuan: number): number {
  return pagu - pengajuan
}

/** Rasio kemandirian = (swadaya + penggalangan + donasi) / total sumber dana; null bila total 0. */
export function rasioKemandirian(gereja: number, mandiri: number): number | null {
  const total = gereja + mandiri
  return total === 0 ? null : mandiri / total
}

// ── Penyusunan dashboard (murni, tanpa database; mudah dites) ────────────────────────────────────

export interface MasukanUnit {
  id: number
  kode: string
  nama: string
  singkatan: string | null
  jenis: 'UPK' | 'POS'
  bidangId: number
  urutan: number
}

export interface MasukanProgram {
  id: number
  unitId: number
  status: 'DRAFT' | 'DIAJUKAN'
  totalRab: number
  gereja: number
  swadaya: number
  penggalangan: number
  donasi: number
  acuanIds: number[]
}

export interface MasukanDashboard {
  units: MasukanUnit[]
  bidang: Array<{ id: number; kode: string; nama: string; urutan: number }>
  pagu: Map<number, number> // unitId -> pagu
  programs: MasukanProgram[]
  acuan: Array<{ id: number; kode: string; nama: string; jenis: string }>
}

export interface BarisDashboardUnit {
  unitId: number
  kode: string
  nama: string
  singkatan: string | null
  jenis: 'UPK' | 'POS'
  bidangId: number
  pagu: number
  pengajuan: number
  draft: number
  tersedia: number
  status: StatusPagu
  jumlahDiajukan: number
  jumlahDraft: number
  gereja: number
  mandiri: number
}

export function susunDashboard(m: MasukanDashboard) {
  const perUnit: BarisDashboardUnit[] = [...m.units]
    .sort((a, b) => a.urutan - b.urutan || a.nama.localeCompare(b.nama))
    .map((u) => {
      const diajukan = m.programs.filter((p) => p.unitId === u.id && p.status === 'DIAJUKAN')
      const draft = m.programs.filter((p) => p.unitId === u.id && p.status === 'DRAFT')
      const pagu = m.pagu.get(u.id) ?? 0
      const pengajuan = diajukan.reduce((n, p) => n + p.totalRab, 0)
      return {
        unitId: u.id,
        kode: u.kode,
        nama: u.nama,
        singkatan: u.singkatan,
        jenis: u.jenis,
        bidangId: u.bidangId,
        pagu,
        pengajuan,
        draft: draft.reduce((n, p) => n + p.totalRab, 0),
        tersedia: tersedia(pagu, pengajuan),
        status: statusPagu(pagu, pengajuan),
        jumlahDiajukan: diajukan.length,
        jumlahDraft: draft.length,
        gereja: diajukan.reduce((n, p) => n + p.gereja, 0),
        mandiri: diajukan.reduce((n, p) => n + p.swadaya + p.penggalangan + p.donasi, 0),
      }
    })

  const perBidang = [...m.bidang]
    .sort((a, b) => a.urutan - b.urutan)
    .map((b) => {
      const baris = perUnit.filter((u) => u.bidangId === b.id)
      const pagu = baris.reduce((n, u) => n + u.pagu, 0)
      const pengajuan = baris.reduce((n, u) => n + u.pengajuan, 0)
      return {
        bidangId: b.id,
        kode: b.kode,
        nama: b.nama,
        jumlahUnit: baris.length,
        pagu,
        pengajuan,
        tersedia: tersedia(pagu, pengajuan),
        gereja: baris.reduce((n, u) => n + u.gereja, 0),
        mandiri: baris.reduce((n, u) => n + u.mandiri, 0),
      }
    })

  const diajukanSemua = m.programs.filter((p) => p.status === 'DIAJUKAN' && perUnit.some((u) => u.unitId === p.unitId))
  const perAcuan = m.acuan.map((a) => {
    const terkait = diajukanSemua.filter((p) => p.acuanIds.includes(a.id))
    return {
      acuanId: a.id,
      kode: a.kode,
      nama: a.nama,
      jenis: a.jenis,
      jumlahProgram: terkait.length,
      // Program yang menaut ke beberapa acuan terhitung penuh pada tiap acuan (bukan dibagi).
      totalRabTerkait: terkait.reduce((n, p) => n + p.totalRab, 0),
    }
  })

  const total = perUnit.reduce(
    (t, u) => ({
      pagu: t.pagu + u.pagu,
      pengajuan: t.pengajuan + u.pengajuan,
      draft: t.draft + u.draft,
      gereja: t.gereja + u.gereja,
      mandiri: t.mandiri + u.mandiri,
      jumlahDiajukan: t.jumlahDiajukan + u.jumlahDiajukan,
      jumlahDraft: t.jumlahDraft + u.jumlahDraft,
    }),
    { pagu: 0, pengajuan: 0, draft: 0, gereja: 0, mandiri: 0, jumlahDiajukan: 0, jumlahDraft: 0 },
  )

  const ringkasStatus = { BELUM_MENGAJUKAN: 0, UNDER: 0, OVER: 0, SESUAI: 0 } as Record<StatusPagu, number>
  for (const u of perUnit) ringkasStatus[u.status] += 1

  return {
    unit: perUnit,
    bidang: perBidang,
    acuan: perAcuan,
    total: { ...total, tersedia: tersedia(total.pagu, total.pengajuan), rasioKemandirian: rasioKemandirian(total.gereja, total.mandiri) },
    ringkasStatus,
  }
}
