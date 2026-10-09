import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MasterKelurahan {
  id: number
  nama: string
  kecamatan: string
  kota: string
  kodePos: string | null
}

export interface KomisiConfig {
  id: number
  nama: string
  minUsia: number
  maxUsia: number | null
  urutan: number
  warna: string
}

export interface KomisiStat extends KomisiConfig {
  jumlah: number
}

// ── Kelurahan ─────────────────────────────────────────────────

export function useMasterKelurahan(search?: string) {
  return useQuery({
    queryKey: ['master-kelurahan', search ?? ''],
    queryFn: async () => {
      const res = await api.get('/pengaturan/kelurahan', { params: search ? { search } : {} })
      return res.data.data as MasterKelurahan[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useKelurahanMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-kelurahan'] })

  const create = useMutation({
    mutationFn: (data: Omit<MasterKelurahan, 'id'>) =>
      api.post('/pengaturan/kelurahan', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<MasterKelurahan, 'id'> }) =>
      api.put(`/pengaturan/kelurahan/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/pengaturan/kelurahan/${id}`),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}

// ── Komisi Config ─────────────────────────────────────────────

export function useKomisiConfig() {
  return useQuery({
    queryKey: ['komisi-config'],
    queryFn: async () => {
      const res = await api.get('/pengaturan/komisi')
      return res.data.data as KomisiConfig[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useKomisiMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['komisi-config'] })
    qc.invalidateQueries({ queryKey: ['dashboard', 'komisi-stats'] })
  }
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<KomisiConfig, 'id'> }) =>
      api.put(`/pengaturan/komisi/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  return { update }
}

// ── Dashboard stats ───────────────────────────────────────────

export function useKomisiStats(f: { wilayahId?: number; kelompokId?: number } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'komisi-stats', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/komisi-stats', { params: f })
      return res.data.data as KomisiStat[]
    },
  })
}

export function useDashboardMap(kelurahan?: string, f: { wilayahId?: number; kelompokId?: number } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'map', kelurahan ?? '', f],
    queryFn: async () => {
      const res = await api.get('/dashboard/map', { params: { ...(kelurahan ? { kelurahan } : {}), ...f } })
      return res.data.data as Array<{
        id: number
        namaLengkap: string
        nomorAnggota: string | null
        nomorInduk: string | null
        latitude: number
        longitude: number
        statusKeanggotaan: string
        keluarga: { kelurahan: string | null; kelompok: { nama: string } | null } | null
      }>
    },
  })
}


// ── Template pesan WhatsApp ───────────────────────────────────
export interface TemplatePesan { id: number; kode: 'AKUN_BARU' | 'RESET_PASSWORD'; nama: string; isi: string; updatedAt: string }

export function useTemplatePesan() {
  return useQuery({
    queryKey: ['template-pesan'],
    queryFn: async () => {
      const res = await api.get('/pengaturan/template-pesan')
      return res.data.data as { templates: TemplatePesan[]; placeholders: string[]; urlPortal: string }
    },
  })
}

export function useTemplatePesanMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['template-pesan'] })
  const save = useMutation({
    mutationFn: ({ kode, isi }: { kode: string; isi: string }) =>
      api.put(`/pengaturan/template-pesan/${kode}`, { isi }).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const reset = useMutation({
    mutationFn: (kode: string) => api.post(`/pengaturan/template-pesan/${kode}/default`).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const preview = useMutation({
    mutationFn: (isi: string) =>
      api.post('/pengaturan/template-pesan/preview', { isi }).then((r) => r.data.data.pesan as string),
  })
  return { save, reset, preview }
}

// ── Kontak Gereja ─────────────────────────────────────────────
export type JenisKontak = 'WA_CENTER' | 'KEPALA_KANTOR' | 'PENDETA' | 'PENDETA_EMERITUS'
export interface KontakGereja {
  id: number; jenis: JenisKontak; nama: string; whatsapp: string
  keterangan: string | null; aktif: boolean; urutan: number
}

export function useKontakGereja() {
  return useQuery({
    queryKey: ['kontak-gereja'],
    queryFn: async () => (await api.get('/pengaturan/kontak-gereja')).data.data as KontakGereja[],
  })
}

export function useKontakGerejaMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['kontak-gereja'] })
    qc.invalidateQueries({ queryKey: ['hubungi'] })
  }
  const create = useMutation({
    mutationFn: (data: Partial<KontakGereja>) => api.post('/pengaturan/kontak-gereja', data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<KontakGereja> }) =>
      api.put(`/pengaturan/kontak-gereja/${id}`, data).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const toggle = useMutation({
    mutationFn: (id: number) => api.patch(`/pengaturan/kontak-gereja/${id}/toggle`).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/pengaturan/kontak-gereja/${id}`).then((r) => r.data.data),
    onSuccess: invalidate,
  })
  return { create, update, toggle, remove }
}
