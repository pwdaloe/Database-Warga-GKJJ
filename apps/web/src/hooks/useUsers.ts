import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AppUser {
  id: number
  nama: string
  username: string
  email: string
  whatsapp: string | null
  mustChangePassword: boolean
  role: string
  aktif: boolean
  kelompokId: number | null
  lastLogin: string | null
  createdAt: string
  kelompok: { id: number; kode: string; nama: string } | null
  warga: { id: number; namaLengkap: string; fotoUrl: string | null; whatsapp: string | null } | null
}

export function useUserList() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.data as AppUser[]
    },
  })
}

export function useUserMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const create = useMutation({
    mutationFn: (data: any) => api.post('/users', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/users/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const toggle = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/toggle`).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const resetPassword = useMutation({
    // password kosong → server membuat password acak dan mengembalikannya (passwordBaru)
    mutationFn: ({ id, password }: { id: number; password?: string }) =>
      api.post(`/users/${id}/reset-password`, password ? { password } : {}).then((r) => r.data.data as { message: string; passwordBaru?: string }),
    onSuccess: invalidate,
  })

  return { create, update, toggle, resetPassword }
}

export type TemplateKode = 'AKUN_BARU' | 'RESET_PASSWORD'
export interface NotifikasiResult { nomor: string; pesan: string; waLink: string }

/** Menyiapkan pesan WhatsApp (render template + tautan wa.me) dan mencatat log (password dimasker) */
export function useNotifikasiAkun() {
  return useMutation({
    mutationFn: ({ id, templateKode, password }: { id: number; templateKode: TemplateKode; password: string }) =>
      api.post(`/users/${id}/notifikasi`, { templateKode, password }).then((r) => r.data.data as NotifikasiResult),
  })
}
