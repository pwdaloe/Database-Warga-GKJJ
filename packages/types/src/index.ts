// ============================================================
// Shared Types — @gkjj/types
// ============================================================

export type JenisKelamin = 'L' | 'P'
export type GolonganDarah = 'A' | 'B' | 'AB' | 'O'
export type StatusDalamKeluarga = 'KEPALA' | 'ISTRI' | 'ANAK' | 'MENANTU' | 'CUCU' | 'LAINNYA'
export type StatusKeanggotaan = 'AKTIF' | 'NON_AKTIF' | 'KATEKUMEN' | 'PINDAH_KELUAR' | 'MENINGGAL'
export type StatusKeluarga = 'AKTIF' | 'NON_AKTIF'
export type DataStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'VALIDATED'
export type UserRole = 'SUPERADMIN' | 'KEPALA_KANTOR' | 'MAJELIS' | 'STAF_ADMIN' | 'PENATUA_KELOMPOK' | 'VIEWER'
export type JenisPerpindahan = 'MASUK' | 'KELUAR' | 'MENINGGAL'

// ── Master Data ──────────────────────────────────────────────

export interface Wilayah {
  id: number
  kode: string
  nama: string
  keterangan: string | null
  aktif: boolean
}

export interface Kelompok {
  id: number
  wilayahId: number
  kode: string
  nama: string
  penatamaId: number | null
  aktif: boolean
  wilayah?: Wilayah
  penatua?: Pick<Warga, 'id' | 'namaLengkap'>
}

// ── Jemaat ───────────────────────────────────────────────────

export interface Keluarga {
  id: number
  nomorKeluarga: string | null
  kelompokId: number | null
  alamat: string | null
  rt: string | null
  rw: string | null
  kelurahan: string | null
  kecamatan: string | null
  kota: string | null
  kodePos: string | null
  teleponRumah: string | null
  status: StatusKeluarga
  dataStatus: DataStatus
  catatan: string | null
  kelompok?: Kelompok
  wargas?: Warga[]
}

export interface Warga {
  id: number
  keluargaId: number | null
  nomorAnggota: string | null
  namaLengkap: string
  namaPanggilan: string | null
  jenisKelamin: JenisKelamin
  tempatLahir: string | null
  tanggalLahir: string | null
  nik: string | null
  golonganDarah: GolonganDarah | null
  fotoUrl: string | null
  statusKeluarga: StatusDalamKeluarga
  statusKeanggotaan: StatusKeanggotaan
  sudahBaptis: boolean
  tanggalBaptis: string | null
  tempatBaptis: string | null
  sudahSidi: boolean
  nomorSidi: string | null
  tanggalSidi: string | null
  telepon: string | null
  whatsapp: string | null
  email: string | null
  pendidikanTerakhir: string | null
  pekerjaan: string | null
  dataStatus: DataStatus
  catatan: string | null
  konsenPDP: boolean
  tanggalKonsen: string | null
  keluarga?: Keluarga
}

// ── Auth ─────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  nama: string
  username: string
  email: string
  role: UserRole
  kelompokId: number | null
  wargaId: number | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

// ── API Response wrapper ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  success: false
  error: string
  details?: Array<{ field: string; message: string }>
}

// ── Query params umum ────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

export interface WargaFilterParams extends PaginationParams {
  wilayahId?: number
  kelompokId?: number
  statusKeanggotaan?: StatusKeanggotaan
  jenisKelamin?: JenisKelamin
  dataStatus?: DataStatus
}
