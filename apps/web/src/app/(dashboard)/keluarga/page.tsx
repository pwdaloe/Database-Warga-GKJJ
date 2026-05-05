'use client'

import { useState } from 'react'
import { Plus, Search, MapPin, Users, Pencil, Trash2, Eye, Filter } from 'lucide-react'
import { useKeluargaList, useKeluargaMutations, useWilayahKelompok } from '@/hooks/useKeluarga'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { KeluargaForm } from './KeluargaForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function KeluargaPage() {
  const { isRole } = useAuth()
  const router = useRouter()

  // Filter state
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [kelompokId, setKelompokId] = useState<number | undefined>()
  const [wilayahId, setWilayahId] = useState<number | undefined>()
  const [showFilter, setShowFilter] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)

  const { data, isLoading } = useKeluargaList({ page, limit: 20, search, kelompokId, wilayahId })
  const { data: wilayahList = [] } = useWilayahKelompok()
  const { create, update, remove } = useKeluargaMutations()

  const canEdit = isRole('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK')
  const canDelete = isRole('SUPERADMIN', 'KEPALA_KANTOR')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleSubmit(formData: any) {
    if (editData) {
      await update.mutateAsync({ id: editData.id, data: formData })
    } else {
      await create.mutateAsync(formData)
    }
    setModalOpen(false)
    setEditData(null)
  }

  async function handleDelete(keluarga: any) {
    await remove.mutateAsync(keluarga.id)
    setConfirmDelete(null)
  }

  const keluargaList = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Keluarga</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta ? `${meta.total} keluarga terdaftar` : 'Memuat...'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditData(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
              text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={18} />
            Tambah Keluarga
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border shadow-sm mb-4">
        <div className="p-4 flex gap-3 items-center">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama anggota, alamat, nomor keluarga..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm
                  outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition">
              Cari
            </button>
          </form>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition',
              showFilter ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50',
            )}
          >
            <Filter size={15} />
            Filter
          </button>
        </div>

        {showFilter && (
          <div className="px-4 pb-4 border-t pt-3 flex gap-3 flex-wrap">
            <select
              value={wilayahId ?? ''}
              onChange={(e) => { setWilayahId(e.target.value ? Number(e.target.value) : undefined); setKelompokId(undefined); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Wilayah</option>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>{w.nama}</option>
              ))}
            </select>
            <select
              value={kelompokId ?? ''}
              onChange={(e) => { setKelompokId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Kelompok</option>
              {wilayahList
                .filter((w) => !wilayahId || w.id === wilayahId)
                .flatMap((w) => w.kelompoks.map((k) => (
                  <option key={k.id} value={k.id}>[{k.kode}] {k.nama}</option>
                )))}
            </select>
            <button
              onClick={() => { setWilayahId(undefined); setKelompokId(undefined); setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
            Memuat data...
          </div>
        ) : keluargaList.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tidak ada data keluarga</p>
            <p className="text-sm mt-1">Tambahkan keluarga pertama atau ubah filter pencarian</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">No. Keluarga</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kepala Keluarga</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kelompok</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Alamat</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Anggota</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keluargaList.map((k: any) => {
                const kepala = k.kepalaKeluarga ?? k.wargas?.find((w: any) => w.statusKeluarga === 'KEPALA')
                const alamatPendek = [k.kelurahan, k.kecamatan].filter(Boolean).join(', ')
                return (
                  <tr key={k.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{k.nomorKeluarga ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{kepala?.namaLengkap ?? '(belum ada)'}</p>
                      {k.teleponRumah && <p className="text-xs text-gray-400 mt-0.5">{k.teleponRumah}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {k.kelompok ? (
                        <div>
                          <p className="font-medium text-gray-800">{k.kelompok.nama}</p>
                          <p className="text-xs text-gray-400">{k.kelompok.wilayah?.nama}</p>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-[200px]">{k.alamat ?? '—'}</p>
                      {alamatPendek && <p className="text-xs text-gray-400 mt-0.5">{alamatPendek}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Users size={14} />
                        {k.wargas?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge value={k.dataStatus} type="dataStatus" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/keluarga/${k.id}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                          title="Lihat detail"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setEditData(k); setModalOpen(true) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(k)}
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
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onChange={setPage}
          />
        )}
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null) }}
        title={editData ? 'Edit Data Keluarga' : 'Tambah Keluarga Baru'}
        size="lg"
      >
        <KeluargaForm
          defaultValues={editData ? {
            kelompokId: editData.kelompokId,
            kepalakeluargaId: editData.kepalakeluargaId,
            alamat: editData.alamat,
            rt: editData.rt,
            rw: editData.rw,
            kelurahan: editData.kelurahan,
            kecamatan: editData.kecamatan,
            kota: editData.kota,
            kodePos: editData.kodePos,
            teleponRumah: editData.teleponRumah,
            catatan: editData.catatan,
          } : undefined}
          wargas={editData?.wargas ?? []}
          onSubmit={handleSubmit}
          submitLabel={editData ? 'Update Keluarga' : 'Simpan Keluarga'}
        />
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Hapus keluarga <span className="font-semibold">{confirmDelete?.nomorKeluarga}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={() => handleDelete(confirmDelete)}
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
