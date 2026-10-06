'use client'

import { useState } from 'react'
import { Loader2, Pencil, Plus, Trash2, Power, PowerOff } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import {
  useKontakGereja, useKontakGerejaMutations, type KontakGereja, type JenisKontak,
} from '@/hooks/usePengaturan'
import { cn } from '@/lib/utils'

const JENIS_LABEL: Record<JenisKontak, string> = {
  WA_CENTER: 'GKJ WhatsApp Center',
  KEPALA_KANTOR: 'Kepala Kantor',
  PENDETA: 'Pendeta',
  PENDETA_EMERITUS: 'Pendeta Emeritus',
}
const GRUP: { judul: string; jenis: JenisKontak[] }[] = [
  { judul: 'GKJ WhatsApp Center', jenis: ['WA_CENTER'] },
  { judul: 'Kepala Kantor', jenis: ['KEPALA_KANTOR'] },
  { judul: 'Pendeta', jenis: ['PENDETA', 'PENDETA_EMERITUS'] },
]

function KontakForm({ initial, jenisDefault, onSubmit, onCancel, loading, error }: {
  initial?: KontakGereja; jenisDefault: JenisKontak
  onSubmit: (d: Partial<KontakGereja>) => void; onCancel: () => void; loading: boolean; error: string
}) {
  const [f, setF] = useState({
    jenis: initial?.jenis ?? jenisDefault, nama: initial?.nama ?? '', whatsapp: initial?.whatsapp ?? '',
    keterangan: initial?.keterangan ?? '', urutan: initial?.urutan ?? 0,
  })
  const input = 'w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500'
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, keterangan: f.keterangan || null }) }} className="space-y-4">
      {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis</label>
        <select value={f.jenis} onChange={(e) => setF({ ...f, jenis: e.target.value as JenisKontak })} className={cn(input, 'bg-white')}>
          {(Object.keys(JENIS_LABEL) as JenisKontak[]).map((j) => <option key={j} value={j}>{JENIS_LABEL[j]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama <span className="text-red-500">*</span></label>
        <input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} required minLength={2} className={input} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">No. WhatsApp <span className="text-red-500">*</span></label>
        <input type="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} required placeholder="08xx-xxxx-xxxx" className={input} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
          <input value={f.keterangan} onChange={(e) => setF({ ...f, keterangan: e.target.value })} placeholder="mis. Pendeta Jemaat" className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Urutan</label>
          <input type="number" min={0} value={f.urutan} onChange={(e) => setF({ ...f, urutan: Number(e.target.value) })} className={input} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <button type="button" onClick={onCancel} className="px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg">
          {loading && <Loader2 size={14} className="animate-spin" />} Simpan
        </button>
      </div>
    </form>
  )
}

export function KontakGerejaTab({ canEdit }: { canEdit: boolean }) {
  const { data = [], isLoading } = useKontakGereja()
  const { create, update, toggle, remove } = useKontakGerejaMutations()
  const [form, setForm] = useState<{ initial?: KontakGereja; jenis: JenisKontak } | null>(null)
  const [error, setError] = useState('')

  async function save(d: Partial<KontakGereja>) {
    setError('')
    try {
      if (form?.initial) await update.mutateAsync({ id: form.initial.id, data: d })
      else await create.mutateAsync(d)
      setForm(null)
    } catch (e: any) { setError(e?.response?.data?.error ?? 'Gagal menyimpan') }
  }

  if (isLoading) return <div className="py-10 text-center text-gray-400"><Loader2 className="animate-spin inline" /></div>

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Kontak yang tampil di menu <strong>Hubungi</strong> untuk semua pengguna. Nonaktifkan kontak untuk menyembunyikannya tanpa menghapus.
        Majelis kelompok diambil otomatis dari data kelompok.
      </p>
      {GRUP.map((g) => {
        const rows = data.filter((k) => g.jenis.includes(k.jenis))
        return (
          <section key={g.judul} className="bg-white rounded-xl border shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-900">{g.judul}</h3>
              {canEdit && (
                <button onClick={() => { setError(''); setForm({ jenis: g.jenis[0]! }) }}
                  className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 min-h-11 sm:min-h-0">
                  <Plus size={15} /> Tambah
                </button>
              )}
            </div>
            {rows.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Belum ada kontak.</p>
            ) : (
              <ul className="divide-y">
                {rows.map((k) => (
                  <li key={k.id} className={cn('flex items-center justify-between gap-3 px-4 sm:px-5 py-3', !k.aktif && 'opacity-60')}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {k.nama}
                        {k.jenis === 'PENDETA_EMERITUS' && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">Emeritus</span>}
                        {!k.aktif && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Nonaktif</span>}
                      </p>
                      <p className="text-xs text-gray-500">{k.whatsapp}{k.keterangan ? ` · ${k.keterangan}` : ''}</p>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggle.mutate(k.id)} title={k.aktif ? 'Nonaktifkan' : 'Aktifkan'} aria-label={k.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                          {k.aktif ? <PowerOff size={15} /> : <Power size={15} />}
                        </button>
                        <button onClick={() => { setError(''); setForm({ initial: k, jenis: k.jenis }) }} aria-label="Edit"
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Pencil size={15} /></button>
                        <button onClick={() => { if (confirm(`Hapus kontak ${k.nama}?`)) remove.mutate(k.id) }} aria-label="Hapus"
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.initial ? 'Ubah Kontak' : 'Tambah Kontak'} size="sm">
        {form && (
          <KontakForm initial={form.initial} jenisDefault={form.jenis} onSubmit={save} onCancel={() => setForm(null)}
            loading={create.isPending || update.isPending} error={error} />
        )}
      </Modal>
    </div>
  )
}
