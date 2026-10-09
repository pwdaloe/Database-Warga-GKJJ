import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface DashboardStats {
  totalWarga: number
  totalKeluarga: number
  wargaDraft: number
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
