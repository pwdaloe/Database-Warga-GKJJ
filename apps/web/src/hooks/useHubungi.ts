import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface KontakItem { nama: string; keterangan: string | null; link: string }
export interface HubungiData {
  waCenter: KontakItem[]
  majelis: KontakItem | null
  kepalaKantor: KontakItem[]
  pendeta: (KontakItem & { emeritus: boolean })[]
}

export function useHubungi() {
  return useQuery({
    queryKey: ['hubungi'],
    queryFn: async () => (await api.get('/hubungi')).data.data as HubungiData,
  })
}
