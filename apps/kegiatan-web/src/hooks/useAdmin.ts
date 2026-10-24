import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Peran } from '@/lib/tipe'

/** Penulisan master: kirim lalu segarkan master, dashboard, dan daftar program. */
export function useKirimMaster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ method, url, body }: { method: 'post' | 'put' | 'delete'; url: string; body?: unknown }) =>
      (await api.request({ method, url, data: body })).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['master'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export interface AkunRow {
  id: number
  username: string
  nama: string
  email: string | null
  whatsapp: string | null
  peran: Peran
  unitId: number | null
  bidangId: number | null
  aktif: boolean
  wajibGantiPassword: boolean
  lastLogin: string | null
  isContoh: boolean
  unit: { id: number; nama: string; singkatan: string | null } | null
  pengurus: { id: number; jabatan: string } | null
}

export function useAkun() {
  return useQuery({ queryKey: ['akun'], queryFn: async () => (await api.get('/pengguna')).data.data as AkunRow[] })
}

export interface Kredensial {
  passwordSementara: string
  pesanWhatsapp: string
  waLink: string | null
  pengguna?: AkunRow
}

export function useAksiAkun() {
  const qc = useQueryClient()
  const segarkan = () => void qc.invalidateQueries({ queryKey: ['akun'] })
  return {
    buat: useMutation({
      mutationFn: async (b: Record<string, unknown>) => (await api.post('/pengguna', b)).data.data as Kredensial & { pengguna: AkunRow },
      onSuccess: segarkan,
    }),
    reset: useMutation({
      mutationFn: async (id: number) => (await api.post(`/pengguna/${id}/reset-password`)).data.data as Kredensial,
      onSuccess: segarkan,
    }),
    ubah: useMutation({
      mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => (await api.put(`/pengguna/${id}`, body)).data.data as AkunRow,
      onSuccess: segarkan,
    }),
  }
}
