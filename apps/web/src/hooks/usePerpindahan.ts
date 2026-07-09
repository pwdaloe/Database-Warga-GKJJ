import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PerpindahanFilter {
  page?: number
  limit?: number
  jenis?: string
  search?: string
}

export function usePerpindahanList(filter: PerpindahanFilter) {
  return useQuery({
    queryKey: ['perpindahan', filter],
    queryFn: async () => {
      const res = await api.get('/perpindahan', { params: filter })
      return res.data as {
        success: boolean
        data: any[]
        meta: { total: number; page: number; limit: number; totalPages: number }
      }
    },
  })
}

export function usePerpindahanMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['perpindahan'] })
    qc.invalidateQueries({ queryKey: ['warga'] })
  }

  const create = useMutation({
    mutationFn: (data: any) => api.post('/perpindahan', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/perpindahan/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/perpindahan/${id}/approve`).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const validate = useMutation({
    mutationFn: (id: number) => api.post(`/perpindahan/${id}/validate`).then((r) => r.data.data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/perpindahan/${id}`),
    onSuccess: invalidate,
  })

  const kirimEmail = useMutation({
    mutationFn: (id: number) =>
      api.post(`/perpindahan/${id}/kirim-email`).then((r) => r.data.data.message as string),
  })

  return { create, update, approve, validate, remove, kirimEmail }
}
