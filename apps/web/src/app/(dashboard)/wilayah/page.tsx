'use client'

import { useState } from 'react'
import { MapPin, Plus, Pencil, PowerOff, Power, Users, Loader2, ChevronDown, ChevronRight, Home, Trash2 } from 'lucide-react'
import { useWilayahMaster, useWilayahMutations, type WilayahDetail, type KelompokDetail } from '@/hooks/useWilayah'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// ── Form Wilayah ─────────────────────────────────────────────
function WilayahForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: { kode: string; nama: string; keterangan?: string | null }
  onSubmit: (data: { kode: string; nama: string; keterangan: string }) => void
  onCancel: () => void
  loading: boolean
}) {
  const [kode, setKode] = useState(initial?.kode ?? '')
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? '')

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ kode, nama, keterangan }) }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kode <span className="text-red-500">*</span>
          </label>
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            maxLength={5}
            required
            placeholder="mis. RWA"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500 uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama <span className="text-red-500">*</span>
          </label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            maxLength={100}
            required
            placeholder="mis. Rawamangun A"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          rows={2}
          placeholder="Deskripsi wilayah (opsional)"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  )
}

// ── Form Kelompok ────────────────────────────────────────────
function KelompokForm({
  wilayahId,
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  wilayahId: number
  initial?: KelompokDetail
  onSubmit: (data: { wilayahId: number; kode: string; nama: string; penatua_nama_temp: string; keterangan: string }) => void
  onCancel: () => void
  loading: boolean
}) {
  const [kode, setKode] = useState(initial?.kode ?? '')
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [penatua, setPenatua] = useState(initial?.penatua_nama_temp ?? '')
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? '')

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ wilayahId, kode, nama, penatua_nama_temp: penatua, keterangan }) }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kode <span className="text-red-500">*</span>
          </label>
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            maxLength={5}
            required
            placeholder="mis. K01"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500 uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama <span className="text-red-500">*</span>
          </label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            maxLength={100}
            required
            placeholder="mis. Kelompok 1"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Penatua / PJ</label>
        <input
          value={penatua}
          onChange={(e) => setPenatua(e.target.value)}
          maxLength={150}
          placeholder="Nama penatua atau penanggung jawab"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          rows={2}
          placeholder="Deskripsi kelompok (opsional)"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  )
}

// ── Card satu Wilayah ────────────────────────────────────────
function WilayahCard({
  wilayah,
  canEdit,
  onEditWilayah,
  onToggleWilayah,
  onDeleteWilayah,
  onAddKelompok,
  onEditKelompok,
  onToggleKelompok,
}: {
  wilayah: WilayahDetail
  canEdit: boolean
  onEditWilayah: (w: WilayahDetail) => void
  onToggleWilayah: (id: number) => void
  onDeleteWilayah: (w: WilayahDetail) => void
  onAddKelompok: (wilayahId: number) => void
  onEditKelompok: (k: KelompokDetail) => void
  onToggleKelompok: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const totalKK = wilayah.kelompoks.reduce((s, k) => s + k._count.keluargas, 0)

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm overflow-hidden',
      !wilayah.aktif && 'opacity-60',
    )}>
      {/* Header wilayah */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <span className="font-mono text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded">
          {wilayah.kode}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{wilayah.nama}</p>
          {wilayah.keterangan && (
            <p className="text-xs text-gray-400 truncate">{wilayah.keterangan}</p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 mr-2">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {wilayah.kelompoks.length} kelompok
          </span>
          <span className="flex items-center gap-1">
            <Home size={12} />
            {totalKK} KK
          </span>
        </div>

        {!wilayah.aktif && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
            Non-aktif
          </span>
        )}

        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAddKelompok(wilayah.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition"
            >
              <Plus size={12} />
              Kelompok
            </button>
            <button
              onClick={() => onEditWilayah(wilayah)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
              title="Edit wilayah"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onToggleWilayah(wilayah.id)}
              className={cn(
                'p-1.5 rounded-lg transition',
                wilayah.aktif
                  ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                  : 'hover:bg-green-50 text-gray-400 hover:text-green-600',
              )}
              title={wilayah.aktif ? 'Nonaktifkan' : 'Aktifkan'}
            >
              {wilayah.aktif ? <PowerOff size={14} /> : <Power size={14} />}
            </button>
            <button
              onClick={() => onDeleteWilayah(wilayah)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
              title="Hapus wilayah"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tabel kelompok */}
      {expanded && (
        wilayah.kelompoks.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <MapPin size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada kelompok</p>
            {canEdit && (
              <button
                onClick={() => onAddKelompok(wilayah.id)}
                className="mt-3 text-xs text-brand-600 hover:underline"
              >
                + Tambah kelompok pertama
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Kode</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Nama</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Penatua / PJ</th>
                <th className="px-5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">KK</th>
                {canEdit && <th className="px-5 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {wilayah.kelompoks.map((k) => (
                <tr
                  key={k.id}
                  className={cn(
                    'hover:bg-gray-50 transition',
                    !k.aktif && 'opacity-50',
                  )}
                >
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      {k.kode}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {k.nama}
                    {!k.aktif && (
                      <span className="ml-2 text-xs text-red-500 font-normal">(non-aktif)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {k.penatua_nama_temp ?? <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
                      <Users size={12} />
                      {k._count.keluargas}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditKelompok(k)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => onToggleKelompok(k.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition',
                            k.aktif
                              ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                              : 'hover:bg-green-50 text-gray-400 hover:text-green-600',
                          )}
                          title={k.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {k.aktif ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function WilayahPage() {
  const { isRole } = useAuth()
  const { data: wilayahList = [], isLoading } = useWilayahMaster()
  const { createWilayah, updateWilayah, toggleWilayah, deleteWilayah, createKelompok, updateKelompok, toggleKelompok } = useWilayahMutations()

  const canEdit = isRole('SUPERADMIN', 'KEPALA_KANTOR')

  // Modal state
  const [wilayahModal, setWilayahModal] = useState<{ open: boolean; data?: WilayahDetail }>({ open: false })
  const [kelompokModal, setKelompokModal] = useState<{ open: boolean; wilayahId?: number; data?: KelompokDetail }>({ open: false })
  const [confirmDelete, setConfirmDelete] = useState<WilayahDetail | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function handleDeleteWilayah() {
    if (!confirmDelete) return
    setDeleteError('')
    try {
      await deleteWilayah.mutateAsync(confirmDelete.id)
      setConfirmDelete(null)
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error ?? err?.message ?? 'Gagal menghapus wilayah')
    }
  }

  async function handleSaveWilayah(formData: { kode: string; nama: string; keterangan: string }) {
    if (wilayahModal.data) {
      await updateWilayah.mutateAsync({ id: wilayahModal.data.id, data: formData })
    } else {
      await createWilayah.mutateAsync(formData)
    }
    setWilayahModal({ open: false })
  }

  async function handleSaveKelompok(formData: { wilayahId: number; kode: string; nama: string; penatua_nama_temp: string; keterangan: string }) {
    if (kelompokModal.data) {
      await updateKelompok.mutateAsync({ id: kelompokModal.data.id, data: formData })
    } else {
      await createKelompok.mutateAsync(formData)
    }
    setKelompokModal({ open: false })
  }

  const isSavingWilayah = createWilayah.isPending || updateWilayah.isPending
  const isSavingKelompok = createKelompok.isPending || updateKelompok.isPending

  const totalKelompok = wilayahList.reduce((s, w) => s + w.kelompoks.length, 0)
  const totalKK = wilayahList.reduce((s, w) => s + w.kelompoks.reduce((sk, k) => sk + k._count.keluargas, 0), 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wilayah &amp; Kelompok</h1>
          {!isLoading && (
            <p className="text-gray-500 text-sm mt-1">
              {wilayahList.length} wilayah · {totalKelompok} kelompok · {totalKK} KK terdaftar
            </p>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => setWilayahModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={18} />
            Tambah Wilayah
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-24 text-center text-gray-400">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-brand-600" />
          Memuat data...
        </div>
      ) : wilayahList.length === 0 ? (
        <div className="py-24 text-center text-gray-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Belum ada wilayah</p>
          {canEdit && (
            <button
              onClick={() => setWilayahModal({ open: true })}
              className="mt-4 text-sm text-brand-600 hover:underline"
            >
              Tambah wilayah pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {wilayahList.map((w) => (
            <WilayahCard
              key={w.id}
              wilayah={w}
              canEdit={canEdit}
              onEditWilayah={(wil) => setWilayahModal({ open: true, data: wil })}
              onToggleWilayah={(id) => toggleWilayah.mutate(id)}
              onDeleteWilayah={(wil) => { setDeleteError(''); setConfirmDelete(wil) }}
              onAddKelompok={(wId) => setKelompokModal({ open: true, wilayahId: wId })}
              onEditKelompok={(k) => setKelompokModal({ open: true, wilayahId: k.wilayahId, data: k })}
              onToggleKelompok={(id) => toggleKelompok.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal Wilayah */}
      <Modal
        open={wilayahModal.open}
        onClose={() => setWilayahModal({ open: false })}
        title={wilayahModal.data ? 'Edit Wilayah' : 'Tambah Wilayah'}
        size="md"
      >
        <WilayahForm
          initial={wilayahModal.data}
          onSubmit={handleSaveWilayah}
          onCancel={() => setWilayahModal({ open: false })}
          loading={isSavingWilayah}
        />
      </Modal>

      {/* Modal Kelompok */}
      <Modal
        open={kelompokModal.open}
        onClose={() => setKelompokModal({ open: false })}
        title={kelompokModal.data ? 'Edit Kelompok' : 'Tambah Kelompok'}
        size="md"
      >
        {kelompokModal.wilayahId && (
          <KelompokForm
            wilayahId={kelompokModal.wilayahId}
            initial={kelompokModal.data}
            onSubmit={handleSaveKelompok}
            onCancel={() => setKelompokModal({ open: false })}
            loading={isSavingKelompok}
          />
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus Wilayah */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus Wilayah"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Hapus wilayah{' '}
            <span className="font-semibold">{confirmDelete?.kode} — {confirmDelete?.nama}</span>?
            {confirmDelete && confirmDelete.kelompoks.length === 0 && (
              <span className="block text-gray-400 text-xs mt-1">Wilayah ini tidak memiliki kelompok.</span>
            )}
          </p>
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteWilayah}
              disabled={deleteWilayah.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg"
            >
              {deleteWilayah.isPending && <Loader2 size={14} className="animate-spin" />}
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
