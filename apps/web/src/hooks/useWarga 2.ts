import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface WargaFilter {
  page?: number
  limit?: number
  search?: string
  kelompokId?: number
  wilayahId?: number
  statusKeanggotaan?: string
  jenisKelamin?: string
  dataStatus?: string
}

export function useWargaList(filter: WargaFilter) {
  return useQuery({
    queryKey: ['warga', filter],
    queryFn: async () => {
      const res = await api.get('/warga', { params: filter })
      return res.data as {
        success: boolean
        data: any[]
        meta: { total: number; page: number; limit: number; totalPages: number }
      }
    },
  })
}

export function useWargaDetail(id: number | null) {
  return useQuery({
    queryKey: ['warga', id],
    queryFn: async () => {
      const res = await api.get(`/warga/${id}`)
      return res.data.data
    },
    enabled: id != null,
  })
}

export function useWargaMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['warga'] })
    qc.invalidateQueries({ queryKey: ['keluarga'] })
  }

  const create = useMutation({
    mutationFn: (data: any) => api.post('/warga', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/warga/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/warga/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
