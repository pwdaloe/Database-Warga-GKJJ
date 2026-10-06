'use client'

import { useState } from 'react'
import { Settings, MapPin, Users, MessageSquareText, Phone, Pencil, Trash2, Plus, Loader2, Check, X } from 'lucide-react'
import {
  useMasterKelurahan, useKelurahanMutations,
  useKomisiConfig, useKomisiMutations,
  type MasterKelurahan, type KomisiConfig,
} from '@/hooks/usePengaturan'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { TemplatePesanTab } from './TemplatePesanTab'
import { KontakGerejaTab } from './KontakGerejaTab'

type Tab = 'komisi' | 'kelurahan' | 'template' | 'kontak'

// ── Inline editor untuk KomisiConfig ─────────────────────────
function KomisiRow({ komisi, canEdit }: { komisi: KomisiConfig; canEdit: boolean }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...komisi })
  const { update } = useKomisiMutations()

  async function save() {
    await update.mutateAsync({ id: komisi.id, data: { nama: form.nama, minUsia: form.minUsia, maxUsia: form.maxUsia, urutan: form.urutan, warna: form.warna } })
    setEditing(false)
  }

  if (!editing) {
    return (
      <tr className="hover:bg-gray-50 transition">
        <td className="px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: komisi.warna }} />
            <span className="font-medium text-gray-800 text-sm">{komisi.nama}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 text-center">{komisi.minUsia}</td>
        <td className="px-4 py-3 text-sm text-gray-600 text-center">{komisi.maxUsia ?? '∞'}</td>
        <td className="hidden sm:table-cell px-4 py-3 text-xs text-gray-500 text-center">
          {komisi.maxUsia != null
            ? `${komisi.minUsia}–${komisi.maxUsia} tahun`
            : `≥ ${komisi.minUsia} tahun`}
        </td>
        {canEdit && (
          <td className="px-4 py-3 text-right">
            <button onClick={() => setEditing(true)} aria-label={`Edit ${komisi.nama}`} className="inline-flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition">
              <Pencil size={15} />
            </button>
          </td>
        )}
      </tr>
    )
  }

  return (
    <tr className="bg-brand-50 border-y border-brand-200">
      <td className="px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2">
          <input type="color" value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
          <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="px-2 py-2 sm:py-1 border border-gray-300 rounded-lg text-base sm:text-sm w-32 sm:w-44 outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </td>
      <td className="px-4 py-2 text-center">
        <input type="number" min={0} value={form.minUsia}
          onChange={(e) => setForm({ ...form, minUsia: Number(e.target.value) })}
          className="w-16 px-2 py-2 sm:py-1 border border-gray-300 rounded-lg text-base sm:text-sm text-center outline-none focus:ring-2 focus:ring-brand-400" />
      </td>
      <td className="px-4 py-2 text-center">
        <input type="number" min={1} placeholder="∞"
          value={form.maxUsia ?? ''}
          onChange={(e) => setForm({ ...form, maxUsia: e.target.value ? Number(e.target.value) : null })}
          className="w-16 px-2 py-2 sm:py-1 border border-gray-300 rounded-lg text-base sm:text-sm text-center outline-none focus:ring-2 focus:ring-brand-400" />
      </td>
      <td className="hidden sm:table-cell px-4 py-2" />
      <td className="px-2 sm:px-4 py-2">
        <div className="flex items-center justify-end gap-1">
          <button onClick={save} disabled={update.isPending}
            aria-label="Simpan" className="inline-flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition">
            {update.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          </button>
          <button onClick={() => setEditing(false)} aria-label="Batal" className="inline-flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <X size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Tab Kelurahan ─────────────────────────────────────────────
function TabKelurahan({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('')
  const [kecFilter, setKecFilter] = useState('')
  const { data: allKelurahan = [], isLoading } = useMasterKelurahan()
  const { create, update, remove } = useKelurahanMutations()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState<MasterKelurahan | null>(null)
  const [form, setForm] = useState({ nama: '', kecamatan: '', kota: 'Jakarta Timur', kodePos: '' })
  const [confirmDel, setConfirmDel] = useState<MasterKelurahan | null>(null)

  const kecList = [...new Set(allKelurahan.map((k) => k.kecamatan))].sort()
  const filtered = allKelurahan.filter((k) => {
    const matchSearch = !search || k.nama.toLowerCase().includes(search.toLowerCase()) || k.kecamatan.toLowerCase().includes(search.toLowerCase())
    const matchKec = !kecFilter || k.kecamatan === kecFilter
    return matchSearch && matchKec
  })

  function openAdd() { setEditRow(null); setForm({ nama: '', kecamatan: '', kota: 'Jakarta Timur', kodePos: '' }); setModalOpen(true) }
  function openEdit(k: MasterKelurahan) { setEditRow(k); setForm({ nama: k.nama, kecamatan: k.kecamatan, kota: k.kota, kodePos: k.kodePos ?? '' }); setModalOpen(true) }

  async function handleSave() {
    const data = { ...form, kodePos: form.kodePos || null }
    if (editRow) await update.mutateAsync({ id: editRow.id, data })
    else await create.mutateAsync(data)
    setModalOpen(false)
  }

  const isSaving = create.isPending || update.isPending

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-2.5 sm:gap-3 mb-4 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kelurahan atau kecamatan..."
          className="w-full sm:flex-1 sm:min-w-48 px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        <select value={kecFilter} onChange={(e) => setKecFilter(e.target.value)}
          className="flex-1 sm:flex-none min-w-0 px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Semua Kecamatan</option>
          {kecList.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        {canEdit && (
          <button onClick={openAdd}
            className="shrink-0 whitespace-nowrap min-h-11 sm:min-h-0 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition">
            <Plus size={15} /> Tambah
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 size={18} className="animate-spin" /> Memuat...
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-2 text-xs font-medium text-gray-500">
            {filtered.length} kelurahan {kecFilter ? `· Kec. ${kecFilter}` : ''}
          </div>
          <ul className="md:hidden divide-y max-h-[70vh] overflow-y-auto">
            {filtered.map((k) => (
              <li key={k.id} className="flex items-center gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">{k.nama}</p>
                  <p className="text-xs text-gray-500 truncate">Kec. {k.kecamatan} · {k.kota}</p>
                  {k.kodePos && <p className="text-xs font-mono text-gray-400">{k.kodePos}</p>}
                </div>
                {canEdit && (
                  <div className="flex items-center shrink-0">
                    <button onClick={() => openEdit(k)} aria-label={`Edit ${k.nama}`} className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDel(k)} aria-label={`Hapus ${k.nama}`} className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden md:block overflow-y-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Kelurahan</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Kecamatan</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Kota</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Kode Pos</th>
                  {canEdit && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{k.nama}</td>
                    <td className="px-4 py-2.5 text-gray-600">{k.kecamatan}</td>
                    <td className="px-4 py-2.5 text-gray-600">{k.kota}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-500">{k.kodePos ?? '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(k)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setConfirmDel(k)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal tambah/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="font-semibold text-gray-800">{editRow ? 'Edit Kelurahan' : 'Tambah Kelurahan'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Kelurahan *</label>
                <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kecamatan *</label>
                <input value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
                  list="kec-options"
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                <datalist id="kec-options">
                  {kecList.map((k) => <option key={k} value={k} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kode Pos</label>
                <input value={form.kodePos} onChange={(e) => setForm({ ...form, kodePos: e.target.value })}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Kota *</label>
                <input value={form.kota} onChange={(e) => setForm({ ...form, kota: e.target.value })}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-1">
              <button onClick={() => setModalOpen(false)} className="w-full sm:w-auto py-3 sm:py-2 px-4 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={isSaving || !form.nama || !form.kecamatan}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3 sm:py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg">
                {isSaving && <Loader2 size={14} className="animate-spin" />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-sm p-5 sm:p-6 space-y-4">
            <p className="text-sm text-gray-700">Hapus kelurahan <strong>{confirmDel.nama}</strong>?</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button onClick={() => setConfirmDel(null)} className="w-full sm:w-auto py-3 sm:py-2 px-4 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={async () => { await remove.mutateAsync(confirmDel.id); setConfirmDel(null) }}
                className="w-full sm:w-auto py-3 sm:py-2 px-4 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function PengaturanPage() {
  const { isRole } = useAuth()
  const [tab, setTab] = useState<Tab>('komisi')
  const { data: komisiList = [], isLoading: komisiLoading } = useKomisiConfig()
  const canEdit = isRole('SUPERADMIN', 'KEPALA_KANTOR')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Settings size={22} className="text-gray-500" />
          Pengaturan
        </h1>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi master data dan rentang umur komisi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 border-b overflow-x-auto">
        {([
          { key: 'komisi',    label: 'Rentang Umur Komisi', icon: Users },
          { key: 'kelurahan', label: 'Master Kelurahan',    icon: MapPin },
          { key: 'template',  label: 'Template Pesan',      icon: MessageSquareText },
          { key: 'kontak',    label: 'Kontak Gereja',       icon: Phone },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-2.5 min-h-11 shrink-0 whitespace-nowrap text-sm font-medium border-b-2 -mb-px transition',
              tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Tab: Komisi */}
      {tab === 'komisi' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-sm text-gray-600">Rentang usia menentukan distribusi chart di Dashboard. Klik ikon pensil untuk mengedit.</p>
          </div>
          {komisiLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Memuat...
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Nama Komisi</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Min Usia</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Max Usia</th>
                  <th className="hidden sm:table-cell text-center px-4 py-2.5 text-xs font-medium text-gray-500">Rentang</th>
                  {canEdit && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {komisiList.map((k) => <KomisiRow key={k.id} komisi={k} canEdit={canEdit} />)}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Kelurahan */}
      {tab === 'kelurahan' && <TabKelurahan canEdit={canEdit} />}
      {tab === 'template' && <TemplatePesanTab canEdit={canEdit} />}
      {tab === 'kontak' && <KontakGerejaTab canEdit={canEdit} />}
    </div>
  )
}
