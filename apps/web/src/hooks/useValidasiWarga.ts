import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useWargaList } from './useWarga'

export type ValidasiAction = 'validate' | 'revert'

export function useValidasiWargaList(filter: Parameters<typeof useWargaList>[0]) {
  return useWargaList({ ...filter, dataStatus: 'DRAFT' })
}

export function useValidasiMutations() {
  const qc = useQueryClient()

  const bulkStatus = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: ValidasiAction }) =>
      api.patch('/warga/bulk-status', { ids, action }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warga'] })
    },
  })

  return { bulkStatus }
}
