import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface KelompokDetail {
  id: number
  kode: string
  nama: string
  penatua_nama_temp: string | null
  keterangan: string | null
  aktif: boolean
  wilayahId: number
  _count: { keluargas: number }
}

export interface WilayahDetail {
  id: number
  kode: string
  nama: string
  keterangan: string | null
  aktif: boolean
  kelompoks: KelompokDetail[]
}

export function useWilayahMaster() {
  return useQuery({
    queryKey: ['wilayah', 'master'],
    queryFn: async () => {
      const res = await api.get('/wilayah', { params: { all: true } })
      return res.data.data as WilayahDetail[]
    },
  })
}

export function useWilayahMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['wilayah'] })
  }

  const createWilayah = useMutation({
    mutationFn: (data: { kode: string; nama: string; keterangan?: string | null }) =>
      api.post('/wilayah', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const updateWilayah = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { kode: string; nama: string; keterangan?: string | null } }) =>
      api.put(`/wilayah/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const toggleWilayah = useMutation({
    mutationFn: (id: number) => api.patch(`/wilayah/${id}/toggle`).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const createKelompok = useMutation({
    mutationFn: (data: { wilayahId: number; kode: string; nama: string; penatua_nama_temp?: string | null; keterangan?: string | null }) =>
      api.post('/kelompok', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const updateKelompok = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { wilayahId: number; kode: string; nama: string; penatua_nama_temp?: string | null; keterangan?: string | null } }) =>
      api.put(`/kelompok/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const toggleKelompok = useMutation({
    mutationFn: (id: number) => api.patch(`/kelompok/${id}/toggle`).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const deleteWilayah = useMutation({
    mutationFn: (id: number) => api.delete(`/wilayah/${id}`),
    onSuccess: invalidate,
  })

  return { createWilayah, updateWilayah, toggleWilayah, deleteWilayah, createKelompok, updateKelompok, toggleKelompok }
}
