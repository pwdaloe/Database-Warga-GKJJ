import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ActivityLogEntry {
  id: string
  userId: number | null
  userNama: string | null
  method: string
  path: string
  statusCode: number
  errorMessage: string | null
  bodySnapshot: Record<string, unknown> | null
  ipAddress: string | null
  durasiMs: number | null
  createdAt: string
}

export interface LogFilter {
  status?: 'all' | 'success' | 'error'
  userId?: number
  path?: string
  page?: number
  limit?: number
}

export function useActivityLogs(filter: LogFilter) {
  return useQuery({
    queryKey: ['logs', filter],
    queryFn: async () => {
      const res = await api.get('/logs', { params: filter })
      return res.data.data as {
        data: ActivityLogEntry[]
        meta: { total: number; page: number; limit: number; totalPages: number }
      }
    },
    refetchInterval: 30_000, // auto-refresh tiap 30 detik
  })
}

export function useLogMutations() {
  const qc = useQueryClient()
  const purge = useMutation({
    mutationFn: (days: number) =>
      api.delete('/logs', { params: { days } }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logs'] }),
  })
  return { purge }
}
