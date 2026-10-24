import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Dashboard, Master, ProgramDetail, ProgramRingkas } from '@/lib/tipe'

export function useMaster(tahunId?: number) {
  return useQuery({
    queryKey: ['master', tahunId ?? 'aktif'],
    queryFn: async () => (await api.get('/master', { params: tahunId ? { tahunId } : {} })).data.data as Master,
  })
}

export function useProgramList(f: { tahunId?: number; unitId?: number; status?: string }) {
  return useQuery({
    queryKey: ['program', 'daftar', f],
    queryFn: async () => (await api.get('/program', { params: f })).data.data as ProgramRingkas[],
  })
}

export function useProgram(id: number | null) {
  return useQuery({
    queryKey: ['program', id],
    enabled: id !== null,
    queryFn: async () => (await api.get(`/program/${id}`)).data.data as ProgramDetail,
  })
}

export function useDashboard(tahunId?: number) {
  return useQuery({
    queryKey: ['dashboard', tahunId ?? 'aktif'],
    queryFn: async () => (await api.get('/dashboard/pagu', { params: tahunId ? { tahunId } : {} })).data.data as Dashboard,
  })
}

/** Aksi pada program; semua membatalkan cache daftar, detail, dan dashboard. */
export function useAksiProgram() {
  const qc = useQueryClient()
  const segarkan = () => {
    void qc.invalidateQueries({ queryKey: ['program'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  return {
    buat: useMutation({
      mutationFn: async (b: Record<string, unknown>) => (await api.post('/program', b)).data.data as ProgramDetail,
      onSuccess: segarkan,
    }),
    simpan: useMutation({
      mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => (await api.put(`/program/${id}`, body)).data.data as ProgramDetail,
      onSuccess: segarkan,
    }),
    ajukan: useMutation({
      mutationFn: async (id: number) => (await api.post(`/program/${id}/ajukan`)).data.data as ProgramDetail,
      onSuccess: segarkan,
    }),
    tarik: useMutation({
      mutationFn: async (id: number) => (await api.post(`/program/${id}/tarik`)).data.data as ProgramDetail,
      onSuccess: segarkan,
    }),
    hapus: useMutation({
      mutationFn: async (id: number) => (await api.delete(`/program/${id}`)).data,
      onSuccess: segarkan,
    }),
  }
}
