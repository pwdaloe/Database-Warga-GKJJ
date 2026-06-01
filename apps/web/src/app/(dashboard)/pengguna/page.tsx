'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  UserCog, Plus, Pencil, Power, PowerOff, KeyRound,
  Loader2, Shield, CheckCircle2, XCircle,
} from 'lucide-react'
import { useUserList, useUserMutations, type AppUser } from '@/hooks/useUsers'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { Modal } from '@/components/ui/Modal'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'

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
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
          <input value={form.nama} onChange={(e) => set('nama', e.target.value)} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
          <input value={form.username} onChange={(e) => set('username', e.target.value)} required
            autoComplete="off"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {!initial && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
              required={!initial} minLength={8} autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500">
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
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
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

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg">
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
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button
          onClick={() => pw.length >= 8 && onConfirm(pw)}
          disabled={pw.length < 8 || loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 rounded-lg"
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
      setServerError(err?.response?.data?.error ?? err?.message ?? 'Terjadi kesalahan')
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

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <UserCog size={22} className="text-gray-500" />
            Manajemen Pengguna
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} akun terdaftar · {aktifCount} aktif · {nonAktifCount} nonaktif
          </p>
        </div>
        <button
          onClick={() => { setEditUser(null); setServerError(''); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={18} /> Tambah Pengguna
        </button>
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditUser(u); setServerError(''); setModalOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setResetUser(u)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => toggle.mutate(u.id)}
                        className={cn(
                          'p-1.5 rounded-lg transition',
                          u.aktif
                            ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                            : 'hover:bg-green-50 text-gray-400 hover:text-green-600',
                        )}
                        title={u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.aktif ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  )
}
