'use client'

import { useState } from 'react'
import { Plus, Search, Users, Pencil, Trash2, Eye, Filter } from 'lucide-react'
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
      setModalOpen(false)
      setEditData(null)
    } else {
      const keluargaBaru = await create.mutateAsync(formData)
      setModalOpen(false)
      router.push(`/keluarga/${keluargaBaru.id}`)
    }
  }

  async function handleDelete(keluarga: any) {
    await remove.mutateAsync(keluarga.id)
    setConfirmDelete(null)
  }

  const keluargaList = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Data Keluarga</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta ? `${meta.total} keluarga terdaftar` : 'Memuat...'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditData(null); setModalOpen(true) }}
            className="shrink-0 whitespace-nowrap flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-brand-600 hover:bg-brand-700
              text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tambah Keluarga</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border shadow-sm mb-4">
        <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 items-center">
          <form onSubmit={handleSearch} className="flex-1 min-w-0 flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama anggota, alamat, nomor keluarga..."
                className="w-full pl-9 pr-4 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm
                  outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button type="submit" className="shrink-0 px-4 py-3 sm:py-2.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition">
              Cari
            </button>
          </form>
          <button
            onClick={() => setShowFilter(!showFilter)}
            aria-label="Filter"
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-3 sm:py-2.5 rounded-lg border text-sm transition',
              showFilter ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50',
            )}
          >
            <Filter size={15} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {showFilter && (
          <div className="px-3 sm:px-4 pb-4 border-t pt-3 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
            <select
              value={wilayahId ?? ''}
              onChange={(e) => { setWilayahId(e.target.value ? Number(e.target.value) : undefined); setKelompokId(undefined); setPage(1) }}
              className="w-full lg:w-auto px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Wilayah</option>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>{w.nama}</option>
              ))}
            </select>
            <select
              value={kelompokId ?? ''}
              onChange={(e) => { setKelompokId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
              className="w-full lg:w-auto px-3 py-3 sm:py-2 rounded-lg border border-gray-300 text-base sm:text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
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
              className="px-3 py-3 sm:py-2 text-sm text-gray-500 hover:text-gray-700 underline sm:col-span-2 lg:col-span-1"
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
          <>
          <ul className="md:hidden divide-y">
            {keluargaList.map((k: any) => {
              const kepala = k.kepalaKeluarga ?? k.wargas?.find((w: any) => w.statusKeluarga === 'KEPALA')
              const alamatPendek = [k.kelurahan, k.kecamatan].filter(Boolean).join(', ')
              return (
                <li key={k.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 break-words">{kepala?.namaLengkap ?? '(belum ada)'}</p>
                      <p className="font-mono text-xs text-gray-500 mt-0.5 break-all">{k.nomorKeluarga ?? '—'}</p>
                    </div>
                    <Badge value={k.dataStatus} type="dataStatus" />
                  </div>
                  <div className="text-sm space-y-0.5">
                    {k.kelompok && (
                      <p className="text-gray-800 break-words">
                        {k.kelompok.nama}
                        {k.kelompok.wilayah?.nama && <span className="text-gray-400"> · {k.kelompok.wilayah.nama}</span>}
                      </p>
                    )}
                    {k.alamat && <p className="text-gray-600 break-words">{k.alamat}</p>}
                    {alamatPendek && <p className="text-xs text-gray-400">{alamatPendek}</p>}
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1 pt-0.5">
                      <Users size={13} />
                      {k.wargas?.length ?? 0} anggota
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/keluarga/${k.id}`)}
                      className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Eye size={16} /> Detail
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => { setEditData(k); setModalOpen(true) }}
                        className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setConfirmDelete(k)}
                        aria-label="Hapus"
                        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="hidden md:block overflow-x-auto">
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
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                          title="Lihat detail"
                          aria-label="Lihat detail"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setEditData(k); setModalOpen(true) }}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                            title="Edit"
                          aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(k)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                            title="Hapus"
                          aria-label="Hapus"
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
          </div>
          </>
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
            dataStatus: editData.dataStatus,
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
          keluargaId={editData?.id}
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
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              onClick={() => setConfirmDelete(null)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={() => handleDelete(confirmDelete)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
