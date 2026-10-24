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

/** Peran yang melihat seluruh program dan dashboard semua unit. */
const PERAN_LIHAT_SEMUA: readonly PeranPengguna[] = ['ADMIN', 'SEKRETARIAT', 'MAJELIS']

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

/** Membuat program baru atau mengubah draft. Admin/sekretariat boleh atas nama unit mana pun. */
export function bolehUbahProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (prog.status !== 'DRAFT') return tolak('Program sudah diajukan. Tarik kembali ke draft untuk mengubahnya.', 409)
  if (bolehKelola(p)) return ya
  if (p.peran !== 'PENGURUS_UPK' || p.unitId === null || prog.unitId !== p.unitId) {
    return tolak('Tidak memiliki izin untuk mengubah program unit ini.')
  }
  if (statusPengajuan !== 'DIBUKA') return tolak('Pengajuan sedang tidak dibuka.', 409)
  return ya
}

/** Mengajukan = mengunci program; syarat peran dan jendela sama dengan mengubah. */
export const bolehAjukanProgram = bolehUbahProgram

export function bolehTarikProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (prog.status !== 'DIAJUKAN') return tolak('Program belum diajukan.', 409)
  if (bolehKelola(p)) return ya
  if (p.peran !== 'PENGURUS_UPK' || p.unitId === null || prog.unitId !== p.unitId) {
    return tolak('Tidak memiliki izin untuk menarik program unit ini.')
  }
  if (statusPengajuan !== 'DIBUKA') return tolak('Pengajuan sudah ditutup; hubungi sekretariat untuk menarik program.', 409)
  return ya
}

export function bolehHapusProgram(p: Pelaku, prog: ProgramRingkas, statusPengajuan: StatusPengajuan): Keputusan {
  if (prog.status !== 'DRAFT') return tolak('Hanya draft yang dapat dihapus. Tarik kembali dulu bila sudah diajukan.', 409)
  return bolehUbahProgram(p, prog, statusPengajuan)
}

/** Membuat draft baru pada unit tertentu. */
export function bolehBuatProgram(p: Pelaku, unitId: number, statusPengajuan: StatusPengajuan): Keputusan {
  return bolehUbahProgram(p, { unitId, status: 'DRAFT' }, statusPengajuan)
}
