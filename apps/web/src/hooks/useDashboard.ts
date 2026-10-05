import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface DashboardStats {
  totalWarga: number
  totalKeluarga: number
  wargaDraft: number
  /** Terisi hanya untuk pengguna yang dibatasi ke satu kelompok (Penatua Kelompok) */
  kelompok: { id: number; kode: string; nama: string } | null
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data.data as DashboardStats
    },
  })
}
