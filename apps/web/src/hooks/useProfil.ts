import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProfilData } from '@/lib/profilPayload'

export function useProfil() {
  return useQuery({
    queryKey: ['profil-saya'],
    queryFn: async () => (await api.get('/profil-saya')).data.data as ProfilData,
  })
}

export function useProfilMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put('/profil-saya', payload).then((r) => r.data.data as ProfilData),
    onSuccess: (data) => qc.setQueryData(['profil-saya'], data),
  })
}
