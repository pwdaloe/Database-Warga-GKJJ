import type { PeranPengguna, StatusPengajuan, StatusProgram } from '../generated/prisma/client.js'

export interface Pelaku {
  id: number
  peran: PeranPengguna
  unitId: number | null
  bidangId: number | null
}

export interface ProgramRingkas {
  unitId: number
  status: StatusProgram
  unit?: { bidangId: number } | null
}

/** Peran yang mengelola master dan akun. */
export const PERAN_KELOLA: readonly PeranPengguna[] = ['ADMIN', 'SEKRETARIAT']

export const bolehKelola = (p: Pelaku): boolean => PERAN_KELOLA.includes(p.peran)

/** Peran yang melihat seluruh kegiatan dan dashboard semua unit (supervisor, hanya-lihat kecuali admin/sekretariat). */
const PERAN_LIHAT_SEMUA: readonly PeranPengguna[] = ['ADMIN', 'SEKRETARIAT', 'MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM']

export function bolehLihatProgram(p: Pelaku, prog: ProgramRingkas): boolean {
  if (PERAN_LIHAT_SEMUA.includes(p.peran)) return true
  if (p.peran === 'KOORDINATOR_BIDANG') return p.bidangId !== null && prog.unit?.bidangId === p.bidangId
  if (p.peran === 'PENGURUS_UPK') return p.unitId !== null && prog.unitId === p.unitId
  return false
}

/** Cakupan daftar/dashboard: 'semua', atau penyaring unit/bidang. Fail-closed untuk pengurus tanpa unit. */
export type Cakupan = { jenis: 'semua' } | { jenis: 'unit'; unitId: number } | { jenis: 'bidang'; bidangId: number } | { jenis: 'kosong' }

export function cakupanDari(p: Pelaku): Cakupan {
  if (PERAN_LIHAT_SEMUA.includes(p.peran)) return { jenis: 'semua' }
  if (p.peran === 'KOORDINATOR_BIDANG') return p.bidangId !== null ? { jenis: 'bidang', bidangId: p.bidangId } : { jenis: 'kosong' }
  if (p.peran === 'PENGURUS_UPK') return p.unitId !== null ? { jenis: 'unit', unitId: p.unitId } : { jenis: 'kosong' }
  return { jenis: 'kosong' }
}

export interface Keputusan {
  boleh: boolean
  /** Pesan untuk pengguna bila ditolak. */
  alasan?: string
  kode?: 403 | 409
}

const ya: Keputusan = { boleh: true }
const tolak = (alasan: string, kode: 403 | 409 = 403): Keputusan => ({ boleh: false, alasan, kode })

/**
 * Siklus anggaran (StatusPengajuan):
 *  - BELUM_DIBUKA, DIBUKA, DITUTUP: penyusunan oleh UPK. Mengubah hanya pada DRAFT; pengurus UPK hanya saat DIBUKA.
 *  - PRA_MUKER: ketua bidang (bidangnya) dan admin/sekretariat mengubah kegiatan berstatus apa pun; pengurus UPK tidak.
 *  - MUKER: hanya admin/sekretariat.
 *  - DITETAPKAN: dikunci untuk semua.
 */
export const TAHAP_RUMUSAN: readonly StatusPengajuan[] = ['PRA_MUKER', 'MUKER', 'DITETAPKAN']
export const sudahRumusan = (s: StatusPengajuan): boolean => TAHAP_RUMUSAN.includes(s)

const adalahKetuaBidangDari = (p: Pelaku, prog: ProgramRingkas): boolean =>
  p.peran === 'KOORDINATOR_BIDANG' && p.bidangId !== null && prog.unit?.bidangId === p.bidangId

/** Membuat program baru atau mengubah isi. Admin/sekretariat boleh atas nama unit mana pun. */
export function bolehUbahProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (statusPengajuan === 'DITETAPKAN') return tolak('Anggaran sudah ditetapkan; kegiatan tidak dapat diubah.', 409)
  if (statusPengajuan === 'MUKER') return bolehKelola(p) ? ya : tolak('Sedang tahap muker; perubahan hanya oleh admin atau sekretariat.', 409)
  if (statusPengajuan === 'PRA_MUKER') {
    if (bolehKelola(p) || adalahKetuaBidangDari(p, prog)) return ya
    if (p.peran === 'PENGURUS_UPK') return tolak('Sedang tahap pra-muker; perubahan oleh ketua bidang. Hubungi ketua bidang Anda.', 409)
    return tolak('Tidak memiliki izin untuk mengubah kegiatan unit ini.')
  }
  if (prog.status !== 'DRAFT') return tolak('Kegiatan sudah diajukan. Tarik kembali ke draft untuk mengubahnya.', 409)
  if (bolehKelola(p)) return ya
  if (p.peran !== 'PENGURUS_UPK' || p.unitId === null || prog.unitId !== p.unitId) {
    return tolak('Tidak memiliki izin untuk mengubah kegiatan unit ini.')
  }
  if (statusPengajuan !== 'DIBUKA') return tolak('Pengajuan sedang tidak dibuka.', 409)
  return ya
}

/** Mengajukan = mengunci program pada penyusunan UPK; syarat peran dan jendela sama dengan mengubah. */
export function bolehAjukanProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (prog.status !== 'DRAFT') return tolak('Kegiatan sudah diajukan.', 409)
  return bolehUbahProgram(p, prog, statusPengajuan)
}

export function bolehTarikProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (prog.status !== 'DIAJUKAN') return tolak('Kegiatan belum diajukan.', 409)
  if (sudahRumusan(statusPengajuan)) return tolak('Tahap pra-muker dan sesudahnya: ubah isi kegiatan langsung, tidak perlu menarik kembali.', 409)
  if (bolehKelola(p)) return ya
  if (p.peran !== 'PENGURUS_UPK' || p.unitId === null || prog.unitId !== p.unitId) {
    return tolak('Tidak memiliki izin untuk menarik kegiatan unit ini.')
  }
  if (statusPengajuan !== 'DIBUKA') return tolak('Pengajuan sudah ditutup; hubungi sekretariat untuk menarik kegiatan.', 409)
  return ya
}

export function bolehHapusProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (prog.status !== 'DRAFT') return tolak('Hanya draft yang dapat dihapus. Tarik kembali dulu bila sudah diajukan.', 409)
  return bolehUbahProgram(p, prog, statusPengajuan)
}

/** Membuat draft baru pada unit tertentu (`bidangId` unit diperlukan agar ketua bidang dapat menilai haknya). */
export function bolehBuatProgram(p: Pelaku, unitId: number, statusPengajuan: StatusPengajuan, bidangUnit?: number | null): Keputusan {
  return bolehUbahProgram(p, { unitId, status: 'DRAFT', unit: bidangUnit == null ? null : { bidangId: bidangUnit } }, statusPengajuan)
}

/** Pagu bidang dan pagu pos (keuangan): admin/sekretariat sampai ditetapkan. */
export function bolehUbahPagu(p: Pelaku, statusPengajuan: StatusPengajuan): Keputusan {
  if (!bolehKelola(p)) return tolak('Pagu hanya dapat diubah oleh admin atau sekretariat.')
  if (statusPengajuan === 'DITETAPKAN') return tolak('Anggaran sudah ditetapkan; pagu tidak dapat diubah.', 409)
  return ya
}

/** Alokasi indikatif per UPK dalam bidang: admin/sekretariat (sampai ditetapkan) atau ketua bidang itu saat pra-muker. */
export function bolehUbahAlokasi(p: Pelaku, bidangId: number, statusPengajuan: StatusPengajuan): Keputusan {
  if (statusPengajuan === 'DITETAPKAN') return tolak('Anggaran sudah ditetapkan; alokasi tidak dapat diubah.', 409)
  if (bolehKelola(p)) return ya
  if (p.peran === 'KOORDINATOR_BIDANG' && p.bidangId === bidangId) {
    return statusPengajuan === 'PRA_MUKER' ? ya : tolak('Alokasi per UPK dapat diubah ketua bidang pada tahap pra-muker.', 409)
  }
  return tolak('Tidak memiliki izin mengubah alokasi bidang ini.')
}
