import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface DashboardStats {
  totalWarga: number
  totalKeluarga: number
  wargaDraft: number
  /** Status dokumen AKTIF dan status keanggotaan AKTIF */
  wargaAktifValid: number
  kelompokAktif: number
  /** Terisi hanya untuk pengguna yang dibatasi ke satu kelompok (Penatua Kelompok) */
  kelompok: { id: number; kode: string; nama: string } | null
}

export interface DashboardFilter {
  wilayahId?: number
  kelompokId?: number
}

function filterParams(f: DashboardFilter) {
  return { ...(f.wilayahId ? { wilayahId: f.wilayahId } : {}), ...(f.kelompokId ? { kelompokId: f.kelompokId } : {}) }
}

export function useDashboardStats(f: DashboardFilter = {}) {
  return useQuery({
    queryKey: ['dashboard', 'stats', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', { params: filterParams(f) })
      return res.data.data as DashboardStats
    },
  })
}

export interface SebaranKelompok {
  id: number
  kode: string
  nama: string
  jumlahWarga: number
  jumlahKeluarga: number
}

export interface SebaranWilayah {
  id: number
  kode: string
  nama: string
  jumlahWarga: number
  jumlahKeluarga: number
  /** Hanya kelompok yang sudah memiliki warga */
  kelompok: SebaranKelompok[]
}

export function useDashboardSebaran(f: DashboardFilter = {}) {
  return useQuery({
    queryKey: ['dashboard', 'sebaran', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/sebaran', { params: filterParams(f) })
      return res.data.data as SebaranWilayah[]
    },
  })
}

export interface WargaTerbaru {
  id: number
  namaLengkap: string
  createdAt: string
  dataStatus: string
  kelompok: { kode: string; nama: string } | null
  wilayah: { kode: string; nama: string } | null
  majelis: string | null
}

export function useDashboardTerbaru(f: DashboardFilter = {}) {
  return useQuery({
    queryKey: ['dashboard', 'terbaru', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/terbaru', { params: filterParams(f) })
      return res.data.data as WargaTerbaru[]
    },
  })
}

export interface Demografi {
  total: number
  pria: number
  wanita: number
  persenPria: number
  persenWanita: number
}

export function useDashboardDemografi(f: DashboardFilter = {}) {
  return useQuery({
    queryKey: ['dashboard', 'demografi', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/demografi', { params: filterParams(f) })
      return res.data.data as Demografi
    },
  })
}

export interface KualitasData {
  /** Jumlah warga per status dokumen (semua warga tercatat) */
  corong: { draft: number; validasi: number; aktif: number; tidakAktif: number }
  /** Hanya anggota berstatus AKTIF */
  kelengkapan: {
    totalAktif: number
    tanpaNik: number
    tanpaKontak: number
    tanpaAlamat: number
    tanpaKoordinat: number
    tanpaTanggalLahir: number
    tanpaKeluarga: number
  }
}

export function useDashboardKualitasData(f: DashboardFilter = {}) {
  return useQuery({
    queryKey: ['dashboard', 'kualitas-data', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/kualitas-data', { params: filterParams(f) })
      return res.data.data as KualitasData
    },
  })
}

export type StatusKeanggotaanKey = 'AKTIF' | 'NON_AKTIF' | 'KATEKUMEN' | 'PINDAH_KELUAR' | 'MENINGGAL'

export interface StatusKeanggotaanData {
  total: number
  data: Array<{ status: StatusKeanggotaanKey; jumlah: number }>
}

export function useDashboardStatusKeanggotaan(f: DashboardFilter = {}) {
  return useQuery({
    queryKey: ['dashboard', 'status-keanggotaan', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/status-keanggotaan', { params: filterParams(f) })
      return res.data.data as StatusKeanggotaanData
    },
  })
}
