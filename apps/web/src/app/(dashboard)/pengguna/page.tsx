'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  UserCog, Plus, Pencil, Power, PowerOff, KeyRound,
  Loader2, Shield, CheckCircle2, XCircle, Upload, Search, Filter, X,
} from 'lucide-react'
import { useUserList, useUserMutations, type AppUser } from '@/hooks/useUsers'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { Modal } from '@/components/ui/Modal'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { ImportPenggunaModal } from './ImportPenggunaModal'
import { WargaPicker } from './WargaPicker'
import { InfoAkunModal, type InfoAkun } from './InfoAkunModal'

const ROLES = [
  'SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS',
  'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER',
] as const

// ── Form user ─────────────────────────────────────────────────
function UserForm({
  initial,
  usedWargaIds,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: AppUser
  usedWargaIds: Set<number>
  onSubmit: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const { data: wilayahList = [] } = useWilayahKelompok()
  const [form, setForm] = useState({
    nama:       initial?.nama       ?? '',
    username:   initial?.username   ?? '',
    email:      initial?.email      ?? '',
    whatsapp:   initial?.whatsapp   ?? '',
    wargaId:    initial?.warga?.id  ?? null as number | null,
    password:   '',
    role:       initial?.role       ?? 'VIEWER',
    kelompokId: initial?.kelompokId ?? null as number | null,
  })

  const [wargaTertaut, setWargaTertaut] = useState(initial?.warga ?? null)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  // Payload: password kosong tidak dikirim (server membuat password acak); WA kosong → null
  function submit() {
    const { password, whatsapp, ...rest } = form
    onSubmit({ ...rest, whatsapp: whatsapp.trim() || null, ...(password ? { password } : {}) })
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit() }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tautkan ke Warga</label>
          <WargaPicker
            selected={wargaTertaut}
            usedWargaIds={new Set([...usedWargaIds].filter((id) => id !== initial?.warga?.id))}
            onSelect={(w) => {
              setWargaTertaut({ id: w.id, namaLengkap: w.namaLengkap } as any)
              setForm((f) => ({
                ...f, wargaId: w.id, nama: w.namaLengkap,
                whatsapp: w.whatsapp ?? f.whatsapp, email: w.email ?? f.email,
              }))
            }}
            onClear={() => { setWargaTertaut(null); set('wargaId', null) }}
          />
          <p className="mt-1 text-xs text-gray-400">Nama, WhatsApp, dan email terisi otomatis dari data warga; tetap bisa diubah.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
          <input value={form.nama} onChange={(e) => set('nama', e.target.value)} required
            className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
          <input value={form.username} onChange={(e) => set('username', e.target.value)} required
            autoComplete="off" placeholder="contoh: penatua.rama"
            pattern="[a-zA-Z0-9._-]+" title="Hanya huruf, angka, titik, underscore, strip — tanpa spasi"
            className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500" />
          <p className="mt-1 text-xs text-gray-400">Huruf, angka, titik, underscore, strip — tanpa spasi</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
            className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">No. WhatsApp</label>
          <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)}
            placeholder="08xx-xxxx-xxxx"
            className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {!initial && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
              minLength={form.password ? 8 : undefined} autoComplete="new-password"
              placeholder="Kosongkan = dibuat acak"
              className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            <p className="mt-1 text-xs text-gray-400">Kosong: password acak, wajib diganti saat login pertama.</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}
            className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500">
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kelompok</label>
          <select
            value={form.kelompokId ?? ''}
            onChange={(e) => set('kelompokId', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— Semua Kelompok —</option>
            {wilayahList.map((w) => (
              <optgroup key={w.id} label={w.nama}>
                {w.kelompoks.map((k) => (
                  <option key={k.id} value={k.id}>[{k.kode}] {k.nama}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
        <button type="button" onClick={onCancel}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  )
}

// ── Reset password modal ──────────────────────────────────────
function ResetPasswordModal({
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  user: AppUser
  onConfirm: (password?: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [pw, setPw] = useState('')
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Reset password untuk <strong>{user.nama}</strong> ({user.username})
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password Baru
        </label>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          minLength={pw ? 8 : undefined} autoComplete="new-password" placeholder="Kosongkan = dibuat acak"
          className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-gray-400">
          Kosong: password acak dibuat otomatis, pengguna wajib menggantinya saat login, lalu Anda dapat mengirimnya via WhatsApp.
        </p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <button onClick={onCancel} className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button
          onClick={() => onConfirm(pw || undefined)}
          disabled={(pw.length > 0 && pw.length < 8) || loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 rounded-lg"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          <KeyRound size={14} /> Reset Password
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function PenggunaPage() {
  const { data: users = [], isLoading } = useUserList()
  const { create, update, toggle, resetPassword } = useUserMutations()

  const [modalOpen, setModalOpen]           = useState(false)
  const [editUser, setEditUser]             = useState<AppUser | null>(null)
  const [resetUser, setResetUser]           = useState<AppUser | null>(null)
  const [serverError, setServerError]       = useState('')
  const [importOpen, setImportOpen]         = useState(false)
  const [infoAkun, setInfoAkun]             = useState<InfoAkun | null>(null)

  // Search & filter (client-side — daftar pengguna kecil dan sudah dimuat penuh)
  const [search, setSearch]           = useState('')
  const [roleFilter, setRoleFilter]   = useState('')
  const [kelompokFilter, setKelompokFilter] = useState('')   // '' = semua, 'NONE' = tanpa kelompok, atau id kelompok
  const [statusFilter, setStatusFilter] = useState('')       // '' | 'aktif' | 'nonaktif'
  const [showFilter, setShowFilter]   = useState(false)

  const kelompokOptions = useMemo(() => {
    const map = new Map<number, { id: number; kode: string; nama: string }>()
    users.forEach((u) => { if (u.kelompok) map.set(u.kelompok.id, u.kelompok) })
    return Array.from(map.values()).sort((a, b) => a.kode.localeCompare(b.kode))
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (q) {
        const haystack = [
          u.nama, u.username, u.email,
          u.kelompok ? `${u.kelompok.kode} ${u.kelompok.nama}` : '',
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (roleFilter && u.role !== roleFilter) return false
      if (kelompokFilter === 'NONE' && u.kelompok) return false
      if (kelompokFilter && kelompokFilter !== 'NONE' && u.kelompok?.id !== Number(kelompokFilter)) return false
      if (statusFilter === 'aktif' && !u.aktif) return false
      if (statusFilter === 'nonaktif' && u.aktif) return false
      return true
    })
  }, [users, search, roleFilter, kelompokFilter, statusFilter])

  const activeFilterCount = [roleFilter, kelompokFilter, statusFilter].filter(Boolean).length
  const isFiltering = !!search.trim() || activeFilterCount > 0

  function resetFilters() {
    setSearch(''); setRoleFilter(''); setKelompokFilter(''); setStatusFilter('')
  }

  async function handleSave(formData: any) {
    setServerError('')
    try {
      if (editUser) {
        await update.mutateAsync({ id: editUser.id, data: formData })
      } else {
        const baru = await create.mutateAsync(formData)
        if (baru.passwordAwal) {
          setInfoAkun({ user: baru, password: baru.passwordAwal, templateKode: 'AKUN_BARU' })
        }
      }
      setModalOpen(false)
      setEditUser(null)
    } catch (err: any) {
      const apiError = err?.response?.data
      if (apiError?.details?.length) {
        const msgs = (apiError.details as { field: string; message: string }[])
          .map((d) => `${d.field}: ${d.message}`)
          .join(' · ')
        setServerError(msgs)
      } else {
        setServerError(apiError?.error ?? err?.message ?? 'Terjadi kesalahan')
      }
    }
  }

  async function handleReset(password?: string) {
    if (!resetUser) return
    const hasil = await resetPassword.mutateAsync({ id: resetUser.id, password })
    if (hasil.passwordBaru) {
      setInfoAkun({ user: resetUser, password: hasil.passwordBaru, templateKode: 'RESET_PASSWORD' })
    }
    setResetUser(null)
  }

  const isSaving = create.isPending || update.isPending

  const aktifCount    = users.filter((u) => u.aktif).length
  const nonAktifCount = users.filter((u) => !u.aktif).length

  function renderAksi(u: AppUser, mobile = false) {
    const btn = mobile ? 'flex-1 min-h-11 flex items-center justify-center border ' : 'p-1.5 '
    const sz = mobile ? 18 : 14
    return (
      <div className={mobile ? 'flex items-stretch gap-2' : 'flex items-center justify-end gap-1'}>
        <button
          onClick={() => { setEditUser(u); setServerError(''); setModalOpen(true) }}
          className={cn(btn, 'rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition')}
          title="Edit"
          aria-label="Edit"
        >
          <Pencil size={sz} />
        </button>
        <button
          onClick={() => setResetUser(u)}
          className={cn(btn, 'rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition')}
          title="Reset password"
          aria-label="Reset password"
        >
          <KeyRound size={sz} />
        </button>
        <button
          onClick={() => toggle.mutate(u.id)}
          className={cn(
            btn + 'rounded-lg transition',
            u.aktif
              ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
              : 'hover:bg-green-50 text-gray-400 hover:text-green-600',
          )}
          title={u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
          aria-label={u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {u.aktif ? <PowerOff size={sz} /> : <Power size={sz} />}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <UserCog size={22} className="text-gray-500" />
            Manajemen Pengguna
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isFiltering ? `${filteredUsers.length} dari ${users.length} akun · ` : `${users.length} akun terdaftar · `}
            {aktifCount} aktif · {nonAktifCount} nonaktif
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setImportOpen(true)}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap min-h-11 sm:min-h-0 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium border rounded-lg transition"
          >
            <Upload size={16} /> Import Excel
          </button>
          <button
            onClick={() => { setEditUser(null); setServerError(''); setModalOpen(true) }}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap min-h-11 sm:min-h-0 flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={18} /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border shadow-sm mb-4">
        <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, username, email, kelompok..."
              aria-label="Cari pengguna"
              className="w-full pl-9 pr-9 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm
                outline-none focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            aria-label="Filter"
            className={cn(
              'flex items-center gap-2 px-3 py-3 sm:py-2.5 rounded-lg border text-sm transition',
              showFilter || activeFilterCount > 0
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50',
            )}
          >
            <Filter size={15} />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="text-[11px] font-semibold bg-brand-600 text-white rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilter && (
          <div className="px-3 sm:px-4 pb-4 border-t pt-3 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter role"
              className="w-full lg:w-auto px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Role</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
            </select>
            <select
              value={kelompokFilter}
              onChange={(e) => setKelompokFilter(e.target.value)}
              aria-label="Filter kelompok"
              className="w-full lg:w-auto px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Kelompok</option>
              <option value="NONE">Tanpa kelompok (akses semua)</option>
              {kelompokOptions.map((k) => (
                <option key={k.id} value={k.id}>[{k.kode}] {k.nama}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status"
              className="w-full lg:w-auto px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <button
              onClick={resetFilters}
              disabled={!isFiltering}
              className="px-3 py-2.5 sm:py-2 text-sm text-gray-500 hover:text-gray-700 underline text-left sm:text-center disabled:opacity-40 disabled:no-underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Memuat data...
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <UserCog size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Belum ada pengguna</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Search size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tidak ada pengguna yang cocok</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-brand-600 hover:underline">
              Reset pencarian &amp; filter
            </button>
          </div>
        ) : (
          <>
          <ul className="md:hidden divide-y">
            {filteredUsers.map((u) => (
              <li key={u.id} className={cn('p-4 space-y-3', !u.aktif && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                    u.aktif ? 'bg-brand-500' : 'bg-gray-400',
                  )}>
                    {u.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 leading-tight break-words">{u.nama}</p>
                    <p className="text-xs text-gray-400 break-all">{u.email}</p>
                    <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">{u.username}</p>
                  </div>
                  {u.aktif ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                      <CheckCircle2 size={13} /> Aktif
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                      <XCircle size={13} /> Nonaktif
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                    ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600',
                  )}>
                    <Shield size={10} />
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  {u.kelompok && (
                    <span className="text-xs text-gray-500">[{u.kelompok.kode}] {u.kelompok.nama}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Login terakhir:{' '}
                  {u.lastLogin
                    ? format(new Date(u.lastLogin), 'd MMM yyyy, HH:mm', { locale: localeId })
                    : <span className="italic">Belum pernah</span>}
                </p>
                {renderAksi(u, true)}
              </li>
            ))}
          </ul>
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Pengguna</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Kelompok</th>
                <th className="text-center px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Login Terakhir</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((u) => (
                <tr key={u.id} className={cn('transition hover:bg-gray-50', !u.aktif && 'opacity-60')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                        u.aktif ? 'bg-brand-500' : 'bg-gray-400',
                      )}>
                        {u.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 leading-tight">{u.nama}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{u.username}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                      ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600',
                    )}>
                      <Shield size={10} />
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {u.kelompok ? `[${u.kelompok.kode}] ${u.kelompok.nama}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {u.aktif ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                        <CheckCircle2 size={13} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                        <XCircle size={13} /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {u.lastLogin
                      ? format(new Date(u.lastLogin), 'd MMM yyyy, HH:mm', { locale: localeId })
                      : <span className="italic">Belum pernah</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {renderAksi(u)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>

      {/* Modal tambah/edit */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditUser(null) }}
        title={editUser ? `Edit: ${editUser.nama}` : 'Tambah Pengguna Baru'}
        size="md"
      >
        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}
        <UserForm
          initial={editUser ?? undefined}
          usedWargaIds={new Set(users.flatMap((u) => (u.warga ? [u.warga.id] : [])))}
          onSubmit={handleSave}
          onCancel={() => { setModalOpen(false); setEditUser(null) }}
          loading={isSaving}
        />
      </Modal>

      {/* Modal reset password */}
      <Modal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title="Reset Password"
        size="sm"
      >
        {resetUser && (
          <ResetPasswordModal
            user={resetUser}
            onConfirm={handleReset}
            onCancel={() => setResetUser(null)}
            loading={resetPassword.isPending}
          />
        )}
      </Modal>

      {/* Modal info akun (password sekali tampil + kirim WhatsApp) */}
      <InfoAkunModal info={infoAkun} onClose={() => setInfoAkun(null)} />

      {/* Modal import excel */}
      <ImportPenggunaModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
