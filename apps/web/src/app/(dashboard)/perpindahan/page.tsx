'use client'

import { useState } from 'react'
import {
  Plus, Search, ArrowRightLeft, CheckCircle2, ShieldCheck,
  Printer, Mail, MessageCircle, Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { usePerpindahanList, usePerpindahanMutations } from '@/hooks/usePerpindahan'
import { kirimPerpindahanWhatsApp } from '@/lib/perpindahanWhatsapp'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { PerpindahanForm } from './PerpindahanForm'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const JENIS_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'MASUK', label: 'Pindah Masuk' },
  { value: 'KELUAR', label: 'Pindah Keluar' },
  { value: 'MENINGGAL', label: 'Keterangan Kematian' },
]

const JENIS_BADGE: Record<string, string> = {
  MASUK: 'bg-green-100 text-green-700',
  KELUAR: 'bg-orange-100 text-orange-700',
  MENINGGAL: 'bg-gray-200 text-gray-700',
}

const JENIS_LABEL: Record<string, string> = {
  MASUK: 'Pindah Masuk',
  KELUAR: 'Pindah Keluar',
  MENINGGAL: 'Keterangan Kematian',
}

function StatusBadge({ perpindahan }: { perpindahan: any }) {
  if (perpindahan.validatedBy) {
    return (
      <div>
        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
          Divalidasi
        </span>
        {perpindahan.validatedByUser && (
          <p className="text-xs text-gray-400 mt-1">
            oleh {perpindahan.validatedByUser.nama}
            {perpindahan.validatedAt && ` · ${format(new Date(perpindahan.validatedAt), 'd MMM yyyy', { locale: localeId })}`}
          </p>
        )}
      </div>
    )
  }
  if (perpindahan.approvedBy) {
    return (
      <div>
        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
          Disetujui
        </span>
        {perpindahan.approvedByUser && (
          <p className="text-xs text-gray-400 mt-1">
            oleh {perpindahan.approvedByUser.nama}
            {perpindahan.approvedAt && ` · ${format(new Date(perpindahan.approvedAt), 'd MMM yyyy', { locale: localeId })}`}
          </p>
        )}
      </div>
    )
  }
  return (
    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
      Menunggu Approval
    </span>
  )
}

export default function PerpindahanPage() {
  const { isRole } = useAuth()

  const [page, setPage] = useState(1)
  const [jenis, setJenis] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [confirmApprove, setConfirmApprove] = useState<any>(null)
  const [confirmValidate, setConfirmValidate] = useState<any>(null)

  const { data, isLoading } = usePerpindahanList({
    page, limit: 20, jenis: jenis || undefined, search: search || undefined,
  })
  const { approve, validate, remove, kirimEmail } = usePerpindahanMutations()

  const canCatat = isRole('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN')
  const canApprove = isRole('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS')
  const canValidate = isRole('SUPERADMIN', 'KEPALA_KANTOR')
  const canHapus = isRole('SUPERADMIN', 'KEPALA_KANTOR')

  const list = data?.data ?? []
  const meta = data?.meta

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleCetak(id: number) {
    const res = await api.get(`/perpindahan/${id}/surat.pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank')
  }

  async function handleKirimEmail(id: number) {
    try {
      const message = await kirimEmail.mutateAsync(id)
      alert(message)
    } catch (err: any) {
      const pesan = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Gagal mengirim email'
      alert(pesan)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perpindahan Jemaat</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta ? `${meta.total} data perpindahan tercatat` : 'Memuat...'}
          </p>
        </div>
        {canCatat && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
              text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={18} />
            Catat Perpindahan Baru
          </button>
        )}
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl border shadow-sm mb-4 p-4 flex gap-3 items-center flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama warga..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm
                outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition">
            Cari
          </button>
        </form>
        <select
          value={jenis}
          onChange={(e) => { setJenis(e.target.value); setPage(1) }}
          className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
        >
          {JENIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
            Memuat data...
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ArrowRightLeft size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tidak ada data perpindahan</p>
            <p className="text-sm mt-1">Catat perpindahan baru atau ubah filter pencarian</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Warga</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Jenis</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p: any) => {
                const bisaApprove = canApprove && !p.approvedBy
                const bisaValidate = canValidate && p.approvedBy && !p.validatedBy
                const bisaHapus = canHapus && !p.approvedBy
                const bisaKirimEmail = !!p.validatedBy

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.warga?.namaLengkap}</p>
                      {p.warga?.nomorAnggota && (
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {p.warga.nomorAnggota}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block text-xs font-medium px-2.5 py-1 rounded-full', JENIS_BADGE[p.jenis])}>
                        {JENIS_LABEL[p.jenis] ?? p.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.tanggalPerpindahan
                        ? format(new Date(p.tanggalPerpindahan), 'd MMM yyyy', { locale: localeId })
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.nomorSurat || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <StatusBadge perpindahan={p} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {bisaApprove && (
                          <button
                            onClick={() => setConfirmApprove(p)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition"
                            title="Approve"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {bisaValidate && (
                          <button
                            onClick={() => setConfirmValidate(p)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition"
                            title="Validate"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleCetak(p.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                          title="Cetak Surat"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => bisaKirimEmail && handleKirimEmail(p.id)}
                          disabled={!bisaKirimEmail}
                          title={bisaKirimEmail ? 'Kirim Email' : 'Validasi dulu sebelum kirim surat resmi'}
                          className={cn(
                            'p-1.5 rounded-lg transition',
                            bisaKirimEmail
                              ? 'hover:bg-gray-100 text-gray-500 hover:text-brand-600'
                              : 'text-gray-300 cursor-not-allowed',
                          )}
                        >
                          <Mail size={15} />
                        </button>
                        <button
                          onClick={() => kirimPerpindahanWhatsApp(p)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition"
                          title="Kirim WhatsApp"
                        >
                          <MessageCircle size={15} />
                        </button>
                        {bisaHapus && (
                          <button
                            onClick={() => setConfirmDelete(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {meta && meta.total > 0 && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        )}
      </div>

      {/* Modal Catat Perpindahan */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Catat Perpindahan Baru" size="md">
        <PerpindahanForm onSuccess={() => setModalOpen(false)} />
      </Modal>

      {/* Konfirmasi Approve */}
      <Modal open={!!confirmApprove} onClose={() => setConfirmApprove(null)} title="Konfirmasi Approve" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">
            Setujui pengajuan perpindahan <span className="font-semibold">{confirmApprove?.warga?.namaLengkap}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmApprove(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition">
              Batal
            </button>
            <button
              onClick={async () => { await approve.mutateAsync(confirmApprove.id); setConfirmApprove(null) }}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Approve
            </button>
          </div>
        </div>
      </Modal>

      {/* Konfirmasi Validate */}
      <Modal open={!!confirmValidate} onClose={() => setConfirmValidate(null)} title="Konfirmasi Validasi" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">
            Validasi perpindahan <span className="font-semibold">{confirmValidate?.warga?.namaLengkap}</span>?
            Tindakan ini akan mengubah status keanggotaan warga.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmValidate(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition">
              Batal
            </button>
            <button
              onClick={async () => { await validate.mutateAsync(confirmValidate.id); setConfirmValidate(null) }}
              className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Validasi
            </button>
          </div>
        </div>
      </Modal>

      {/* Konfirmasi Hapus */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Konfirmasi Hapus" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">
            Hapus data perpindahan <span className="font-semibold">{confirmDelete?.warga?.namaLengkap}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition">
              Batal
            </button>
            <button
              onClick={async () => { await remove.mutateAsync(confirmDelete.id); setConfirmDelete(null) }}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
