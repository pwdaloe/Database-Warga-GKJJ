import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MasterKelurahan {
  id: number
  nama: string
  kecamatan: string
  kota: string
  kodePos: string | null
}

export interface KomisiConfig {
  id: number
  nama: string
  minUsia: number
  maxUsia: number | null
  urutan: number
  warna: string
}

export interface KomisiStat extends KomisiConfig {
  jumlah: number
}

// ── Kelurahan ─────────────────────────────────────────────────

export function useMasterKelurahan(search?: string) {
  return useQuery({
    queryKey: ['master-kelurahan', search ?? ''],
    queryFn: async () => {
      const res = await api.get('/pengaturan/kelurahan', { params: search ? { search } : {} })
      return res.data.data as MasterKelurahan[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useKelurahanMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-kelurahan'] })

  const create = useMutation({
    mutationFn: (data: Omit<MasterKelurahan, 'id'>) =>
      api.post('/pengaturan/kelurahan', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<MasterKelurahan, 'id'> }) =>
      api.put(`/pengaturan/kelurahan/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/pengaturan/kelurahan/${id}`),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}

// ── Komisi Config ─────────────────────────────────────────────

export function useKomisiConfig() {
  return useQuery({
    queryKey: ['komisi-config'],
    queryFn: async () => {
      const res = await api.get('/pengaturan/komisi')
      return res.data.data as KomisiConfig[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useKomisiMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['komisi-config'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'komisi-stats'] })
  }
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<KomisiConfig, 'id'> }) =>
      api.put(`/pengaturan/komisi/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  return { update }
}

// ── Dashboard stats ───────────────────────────────────────────

export function useKomisiStats() {
  return useQuery({
    queryKey: ['dashboard', 'komisi-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/komisi-stats')
      return res.data.data as KomisiStat[]
    },
  })
}

export function useDashboardMap(kelurahan?: string) {
  return useQuery({
    queryKey: ['dashboard', 'map', kelurahan ?? ''],
    queryFn: async () => {
      const res = await api.get('/dashboard/map', { params: kelurahan ? { kelurahan } : {} })
      return res.data.data as Array<{
        id: number
        namaLengkap: string
        nomorAnggota: string | null
        latitude: number
        longitude: number
        statusKeanggotaan: string
        keluarga: { kelurahan: string | null; kelompok: { nama: string } | null } | null
      }>
    },
  })
}
