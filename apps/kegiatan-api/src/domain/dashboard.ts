/**
 * Status porsi dana Gereja terhadap pagu. Pembanding pagu adalah dana Gereja (Kas Jemaat), BUKAN total RAB.
 *  - BELUM_MENGAJUKAN: belum ada program diajukan (bukan "Under": belum mengajukan tidak sama dengan hemat).
 *  - MANDIRI: sudah mengajukan tetapi tidak meminta dana Gereja sama sekali.
 */
export type StatusPagu = 'BELUM_MENGAJUKAN' | 'MANDIRI' | 'UNDER' | 'OVER' | 'SESUAI'

export function statusPagu(pagu: number, danaGereja: number, jumlahDiajukan: number): StatusPagu {
  if (jumlahDiajukan === 0) return 'BELUM_MENGAJUKAN'
  if (danaGereja === 0) return 'MANDIRI'
  const tersedia = pagu - danaGereja
  if (tersedia > 0) return 'UNDER'
  if (tersedia < 0) return 'OVER'
  return 'SESUAI'
}

export function tersedia(pagu: number, danaGereja: number): number {
  return pagu - danaGereja
}

/** Rasio kemandirian = (swadaya + penggalangan + donasi) / total sumber dana; null bila total 0. */
export function rasioKemandirian(gereja: number, mandiri: number): number | null {
  const total = gereja + mandiri
  return total === 0 ? null : mandiri / total
}

/**
 * Klasifikasi pendanaan: apakah suatu kegiatan dapat berjalan tanpa Kas Jemaat.
 *  - MANDIRI_PENUH: dana Gereja 0 dan seluruh biaya tertutup swadaya/penggalangan/donasi.
 *  - CAMPURAN: ada dana Gereja dan ada dana mandiri.
 *  - BERGANTUNG_KAS: seluruhnya dari dana Gereja.
 * Tanpa pendanaan sama sekali (0 dan 0) tidak diklasifikasikan.
 */
export type KlasifikasiPendanaan = 'MANDIRI_PENUH' | 'CAMPURAN' | 'BERGANTUNG_KAS'

export function klasifikasiPendanaan(gereja: number, mandiri: number): KlasifikasiPendanaan | null {
  if (gereja === 0 && mandiri === 0) return null
  if (gereja === 0) return 'MANDIRI_PENUH'
  if (mandiri === 0) return 'BERGANTUNG_KAS'
  return 'CAMPURAN'
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
  /** unitId -> pagu pos (POS) atau alokasi indikatif (UPK) */
  pagu: Map<number, number>
  /** bidangId -> pagu bidang yang ditetapkan keuangan (hanya bidang berisi UPK) */
  paguBidang: Map<number, number>
  programs: MasukanProgram[]
  acuan: Array<{ id: number; kode: string; nama: string; jenis: string }>
  proyeksiKasJemaat: number
}

export interface RincianDana {
  gereja: number
  swadaya: number
  penggalangan: number
  donasi: number
  mandiri: number
}

export interface CacahKlasifikasi {
  mandiriPenuh: number
  campuran: number
  bergantungKas: number
}

export interface BarisDashboardUnit extends RincianDana {
  unitId: number
  kode: string
  nama: string
  singkatan: string | null
  jenis: 'UPK' | 'POS'
  bidangId: number
  /** Pos: pagu pos. UPK: alokasi indikatif (panduan, bukan batas keras). */
  pagu: number
  /** Total RAB seluruh kegiatan diajukan (semua sumber dana). */
  pengajuan: number
  draft: number
  tersedia: number
  status: StatusPagu
  jumlahDiajukan: number
  jumlahDraft: number
  klasifikasi: KlasifikasiPendanaan | null
  program: CacahKlasifikasi
  /** Total RAB program yang dapat berjalan tanpa dana Gereja. */
  rabTanpaKas: number
}

export interface BarisDashboardBidang extends RincianDana {
  bidangId: number
  kode: string
  nama: string
  jumlahUnit: number
  /** Batas keras dana Gereja bidang. */
  pagu: number
  /** Jumlah alokasi indikatif UPK; bidang pos saja = pagu. */
  alokasiTerbagi: number
  belumDialokasikan: number
  pengajuan: number
  tersedia: number
  status: StatusPagu
  jumlahDiajukan: number
  program: CacahKlasifikasi
  rabTanpaKas: number
}

const kosongCacah = (): CacahKlasifikasi => ({ mandiriPenuh: 0, campuran: 0, bergantungKas: 0 })

function hitungCacah(ps: MasukanProgram[]): CacahKlasifikasi {
  const c = kosongCacah()
  for (const p of ps) {
    const k = klasifikasiPendanaan(p.gereja, p.swadaya + p.penggalangan + p.donasi)
    if (k === 'MANDIRI_PENUH') c.mandiriPenuh += 1
    else if (k === 'CAMPURAN') c.campuran += 1
    else if (k === 'BERGANTUNG_KAS') c.bergantungKas += 1
  }
  return c
}

const rabTanpaKas = (ps: MasukanProgram[]): number =>
  ps.filter((p) => klasifikasiPendanaan(p.gereja, p.swadaya + p.penggalangan + p.donasi) === 'MANDIRI_PENUH').reduce((n, p) => n + p.totalRab, 0)

function rincian(ps: MasukanProgram[]): RincianDana {
  const gereja = ps.reduce((n, p) => n + p.gereja, 0)
  const swadaya = ps.reduce((n, p) => n + p.swadaya, 0)
  const penggalangan = ps.reduce((n, p) => n + p.penggalangan, 0)
  const donasi = ps.reduce((n, p) => n + p.donasi, 0)
  return { gereja, swadaya, penggalangan, donasi, mandiri: swadaya + penggalangan + donasi }
}

export function susunDashboard(m: MasukanDashboard) {
  const perUnit: BarisDashboardUnit[] = [...m.units]
    .sort((a, b) => a.urutan - b.urutan || a.nama.localeCompare(b.nama))
    .map((u) => {
      const diajukan = m.programs.filter((p) => p.unitId === u.id && p.status === 'DIAJUKAN')
      const draft = m.programs.filter((p) => p.unitId === u.id && p.status === 'DRAFT')
      const pagu = m.pagu.get(u.id) ?? 0
      const r = rincian(diajukan)
      return {
        unitId: u.id,
        kode: u.kode,
        nama: u.nama,
        singkatan: u.singkatan,
        jenis: u.jenis,
        bidangId: u.bidangId,
        pagu,
        pengajuan: diajukan.reduce((n, p) => n + p.totalRab, 0),
        draft: draft.reduce((n, p) => n + p.totalRab, 0),
        tersedia: tersedia(pagu, r.gereja),
        status: statusPagu(pagu, r.gereja, diajukan.length),
        jumlahDiajukan: diajukan.length,
        jumlahDraft: draft.length,
        klasifikasi: klasifikasiPendanaan(r.gereja, r.mandiri),
        program: hitungCacah(diajukan),
        rabTanpaKas: rabTanpaKas(diajukan),
        ...r,
      }
    })

  const perBidang: BarisDashboardBidang[] = [...m.bidang]
    .sort((a, b) => a.urutan - b.urutan)
    .map((b) => {
      const baris = perUnit.filter((u) => u.bidangId === b.id)
      const punyaUpk = baris.some((u) => u.jenis === 'UPK')
      const alokasi = baris.reduce((n, u) => n + u.pagu, 0)
      // Bidang berisi UPK: pagu bidang ditetapkan keuangan (bila belum ada, jumlah alokasi dipakai). Bidang pos: jumlah pos.
      const pagu = punyaUpk ? (m.paguBidang.get(b.id) ?? alokasi) : alokasi
      const diajukan = m.programs.filter((p) => p.status === 'DIAJUKAN' && baris.some((u) => u.unitId === p.unitId))
      const r = rincian(diajukan)
      return {
        bidangId: b.id,
        kode: b.kode,
        nama: b.nama,
        jumlahUnit: baris.length,
        pagu,
        alokasiTerbagi: alokasi,
        belumDialokasikan: punyaUpk ? pagu - alokasi : 0,
        pengajuan: baris.reduce((n, u) => n + u.pengajuan, 0),
        tersedia: tersedia(pagu, r.gereja),
        status: statusPagu(pagu, r.gereja, diajukan.length),
        jumlahDiajukan: diajukan.length,
        program: hitungCacah(diajukan),
        rabTanpaKas: rabTanpaKas(diajukan),
        ...r,
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
      // Kegiatan yang menaut ke beberapa acuan terhitung penuh pada tiap acuan (bukan dibagi).
      totalRabTerkait: terkait.reduce((n, p) => n + p.totalRab, 0),
    }
  })

  const pagu = perBidang.reduce((n, b) => n + b.pagu, 0)
  const r = rincian(diajukanSemua)
  const total = {
    pagu,
    pengajuan: perUnit.reduce((n, u) => n + u.pengajuan, 0),
    draft: perUnit.reduce((n, u) => n + u.draft, 0),
    jumlahDiajukan: perUnit.reduce((n, u) => n + u.jumlahDiajukan, 0),
    jumlahDraft: perUnit.reduce((n, u) => n + u.jumlahDraft, 0),
    tersedia: tersedia(pagu, r.gereja),
    rasioKemandirian: rasioKemandirian(r.gereja, r.mandiri),
    proyeksiKasJemaat: m.proyeksiKasJemaat,
    /** Proyeksi persembahan dikurangi total pagu yang dibagi; negatif berarti pagu melebihi proyeksi. */
    selisihProyeksi: m.proyeksiKasJemaat - pagu,
    program: hitungCacah(diajukanSemua),
    rabTanpaKas: rabTanpaKas(diajukanSemua),
    ...r,
  }

  const ringkasStatus = { BELUM_MENGAJUKAN: 0, MANDIRI: 0, UNDER: 0, OVER: 0, SESUAI: 0 } as Record<StatusPagu, number>
  for (const u of perUnit) ringkasStatus[u.status] += 1

  return { unit: perUnit, bidang: perBidang, acuan: perAcuan, total, ringkasStatus }
}
