import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface KeluargaFilter {
  page?: number
  limit?: number
  search?: string
  kelompokId?: number
  wilayahId?: number
  status?: string
  dataStatus?: string
}

export function useKeluargaList(filter: KeluargaFilter) {
  return useQuery({
    queryKey: ['keluarga', filter],
    queryFn: async () => {
      const res = await api.get('/keluarga', { params: filter })
      return res.data as {
        success: boolean
        data: any[]
        meta: { total: number; page: number; limit: number; totalPages: number }
      }
    },
  })
}

export function useKeluargaDetail(id: number | null) {
  return useQuery({
    queryKey: ['keluarga', id],
    queryFn: async () => {
      const res = await api.get(`/keluarga/${id}`)
      return res.data.data
    },
    enabled: id != null,
  })
}

export function useKeluargaMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['keluarga'] })

  const create = useMutation({
    mutationFn: (data: any) => api.post('/keluarga', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/keluarga/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/keluarga/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function useWilayahKelompok() {
  return useQuery({
    queryKey: ['wilayah'],
    queryFn: async () => {
      const res = await api.get('/wilayah')
      return res.data.data as Array<{
        id: number; kode: string; nama: string
        kelompoks: Array<{ id: number; kode: string; nama: string }>
      }>
    },
    staleTime: 5 * 60 * 1000,
  })
}
