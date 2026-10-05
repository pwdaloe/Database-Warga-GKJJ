'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  UserCog, Plus, Pencil, Power, PowerOff, KeyRound,
  Loader2, Shield, CheckCircle2, XCircle, Upload,
} from 'lucide-react'
import { useUserList, useUserMutations, type AppUser } from '@/hooks/useUsers'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { Modal } from '@/components/ui/Modal'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { ImportPenggunaModal } from './ImportPenggunaModal'

const ROLES = [
  'SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS',
  'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER',
] as const

// ── Form user ─────────────────────────────────────────────────
function UserForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: AppUser
  onSubmit: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const { data: wilayahList = [] } = useWilayahKelompok()
  const [form, setForm] = useState({
    nama:       initial?.nama       ?? '',
    username:   initial?.username   ?? '',
    email:      initial?.email      ?? '',
    password:   '',
    role:       initial?.role       ?? 'VIEWER',
    kelompokId: initial?.kelompokId ?? null as number | null,
  })

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        {!initial && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
              required={!initial} minLength={8} autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
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
  onConfirm: (password: string) => void
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
          Password Baru <span className="text-red-500">*</span>
        </label>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter"
          className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <button onClick={onCancel} className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button
          onClick={() => pw.length >= 8 && onConfirm(pw)}
          disabled={pw.length < 8 || loading}
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

  async function handleSave(formData: any) {
    setServerError('')
    try {
      if (editUser) {
        await update.mutateAsync({ id: editUser.id, data: formData })
      } else {
        await create.mutateAsync(formData)
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

  async function handleReset(password: string) {
    if (!resetUser) return
    await resetPassword.mutateAsync({ id: resetUser.id, password })
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
            {users.length} akun terdaftar · {aktifCount} aktif · {nonAktifCount} nonaktif
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
        ) : (
          <>
          <ul className="md:hidden divide-y">
            {users.map((u) => (
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
              {users.map((u) => (
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

      {/* Modal import excel */}
      <ImportPenggunaModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
