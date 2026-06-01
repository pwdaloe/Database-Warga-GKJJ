'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus, Search, Users, Pencil, Trash2, Eye, Filter,
  UserPlus, CheckCircle2, Loader2, Crown, AlertCircle,
} from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useWargaList, useWargaMutations } from '@/hooks/useWarga'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { WargaForm, type WargaFormData } from './WargaForm'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { InputField, SelectField } from '@/components/ui/FormField'

// ── Wizard state ──────────────────────────────────────────────
type WizardStep =
  | { step: 1 }
  | { step: 2; kepalaNama: string; keluargaId: number | null; addedAnggota: any[] }

// ── Quick-add form untuk anggota ──────────────────────────────
const anggotaSchema = z.object({
  namaLengkap:    z.string().min(2, 'Nama minimal 2 karakter'),
  jenisKelamin:   z.enum(['L', 'P'], { required_error: 'Pilih jenis kelamin' }),
  statusKeluarga: z.enum(['ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'LAINNYA']),
  tanggalLahir:   z.string().optional().nullable(),
})
type AnggotaData = z.infer<typeof anggotaSchema>

function AnggotaQuickForm({
  keluargaId,
  onAdded,
}: {
  keluargaId: number | null
  onAdded: (anggota: any) => void
}) {
  const { create } = useWargaMutations()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnggotaData>({
    resolver: zodResolver(anggotaSchema),
    defaultValues: { statusKeluarga: 'ANAK' },
  })

  async function onSubmit(data: AnggotaData) {
    const warga = await create.mutateAsync({
      ...data,
      keluargaId,
      statusKeanggotaan: 'AKTIF',
      dataStatus: 'DRAFT',
      tanggalLahir: data.tanggalLahir || null,
    })
    onAdded(warga)
    reset({ statusKeluarga: 'ANAK' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 rounded-xl border p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tambah Anggota</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <InputField
            label="Nama Lengkap" required
            {...register('namaLengkap')}
            error={errors.namaLengkap}
            placeholder="Nama anggota keluarga"
          />
        </div>
        <SelectField
          label="Jenis Kelamin" required
          options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
          placeholder="— Pilih —"
          {...register('jenisKelamin')}
          error={errors.jenisKelamin}
        />
        <SelectField
          label="Status dalam Keluarga" required
          options={[
            { value: 'ISTRI', label: 'Istri' },
            { value: 'ANAK', label: 'Anak' },
            { value: 'MENANTU', label: 'Menantu' },
            { value: 'CUCU', label: 'Cucu' },
            { value: 'LAINNYA', label: 'Lainnya' },
          ]}
          {...register('statusKeluarga')}
          error={errors.statusKeluarga}
        />
        <div className="col-span-2">
          <InputField label="Tanggal Lahir" type="date" {...register('tanggalLahir')} error={errors.tanggalLahir as any} />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700
            disabled:bg-brand-300 text-white text-sm font-medium rounded-lg transition"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {isSubmitting ? 'Menyimpan...' : 'Tambah Anggota'}
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function WargaPage() {
  const { isRole } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [kelompokId, setKelompokId] = useState<number | undefined>()
  const [wilayahId, setWilayahId] = useState<number | undefined>()
  const [statusKeanggotaan, setStatusKeanggotaan] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState('')
  const [dataStatus, setDataStatus] = useState(() => searchParams.get('dataStatus') ?? '')
  const [showFilter, setShowFilter] = useState(() => !!searchParams.get('dataStatus'))

  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [wizard, setWizard] = useState<WizardStep>({ step: 1 })
  const [addingAnakToKeluargaId, setAddingAnakToKeluargaId] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState('')

  const { data, isLoading } = useWargaList({
    page, limit: 25, search, kelompokId, wilayahId,
    statusKeanggotaan: statusKeanggotaan || undefined,
    jenisKelamin: jenisKelamin || undefined,
    dataStatus: dataStatus || undefined,
  })
  const { data: wilayahList = [] } = useWilayahKelompok()
  const { create, update, remove } = useWargaMutations()

  const canEdit = isRole('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK')
  const canDelete = isRole('SUPERADMIN', 'KEPALA_KANTOR')

  function openCreate() {
    setEditData(null)
    setWizard({ step: 1 })
    setSubmitError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditData(null)
    setWizard({ step: 1 })
    setAddingAnakToKeluargaId(null)
    setSubmitError('')
  }

  function handleTambahAnak() {
    const keluargaId = editData?.keluargaId
    if (!keluargaId) return
    setEditData(null)
    setAddingAnakToKeluargaId(keluargaId)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleSubmit(formData: WargaFormData) {
    setSubmitError('')

    const {
      newKelompokId, newAlamat, newRt, newRw, newKelurahan,
      newKecamatan, newKota, newKodePos, newTeleponRumah,
      ...wargaFields
    } = formData

    const sanitized = Object.fromEntries(
      Object.entries(wargaFields).map(([k, v]) => [k, v === '' ? null : v])
    )

    const isNewKepala = sanitized.statusKeluarga === 'KEPALA' && !sanitized.keluargaId

    const payload: any = {
      ...sanitized,
      ...(isNewKepala && newKelompokId ? {
        newKeluarga: {
          kelompokId: newKelompokId,
          alamat: newAlamat || null,
          rt: newRt || null,
          rw: newRw || null,
          kelurahan: newKelurahan || null,
          kecamatan: newKecamatan || null,
          kota: newKota || null,
          kodePos: newKodePos || null,
          teleponRumah: newTeleponRumah || null,
        },
      } : {}),
    }

    try {
      if (editData) {
        await update.mutateAsync({ id: editData.id, data: payload })
        closeModal()
        return
      }

      const warga = await create.mutateAsync(payload)

      if (wargaFields.statusKeluarga === 'KEPALA') {
        setWizard({
          step: 2,
          kepalaNama: warga.namaLengkap,
          keluargaId: warga.keluargaId ?? null,
          addedAnggota: [],
        })
      } else {
        closeModal()
      }
    } catch (err: any) {
      const pesan =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        'Terjadi kesalahan, silakan coba lagi'
      setSubmitError(pesan)
    }
  }

  function handleAnggotaAdded(anggota: any) {
    if (wizard.step !== 2) return
    setWizard({ ...wizard, addedAnggota: [...wizard.addedAnggota, anggota] })
  }

  const wargaList = data?.data ?? []
  const meta = data?.meta

  const modalTitle = editData
    ? `Edit: ${editData.namaLengkap}`
    : addingAnakToKeluargaId
    ? 'Tambah Anak ke Keluarga'
    : wizard.step === 2
    ? 'Tambah Anggota Keluarga'
    : 'Tambah Warga Baru'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Warga</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta ? `${meta.total} warga terdaftar` : 'Memuat...'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
              text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={18} />
            Tambah Warga
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
                placeholder="Cari nama, nomor anggota, NIK, telepon..."
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
              {wilayahList.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
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
            <select
              value={statusKeanggotaan}
              onChange={(e) => { setStatusKeanggotaan(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NON_AKTIF">Non Aktif</option>
              <option value="KATEKUMEN">Katekumen</option>
              <option value="PINDAH_KELUAR">Pindah Keluar</option>
              <option value="MENINGGAL">Meninggal</option>
            </select>
            <select
              value={jenisKelamin}
              onChange={(e) => { setJenisKelamin(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <select
              value={dataStatus}
              onChange={(e) => { setDataStatus(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Semua Status Dokumen</option>
              <option value="DRAFT">Draft (Perlu Validasi)</option>
              <option value="VALIDASI">Validasi</option>
              <option value="AKTIF">Aktif</option>
              <option value="TIDAK_AKTIF">Tidak Aktif</option>
            </select>
            <button
              onClick={() => {
                setWilayahId(undefined); setKelompokId(undefined)
                setStatusKeanggotaan(''); setJenisKelamin('')
                setDataStatus(''); setSearch(''); setSearchInput(''); setPage(1)
              }}
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
        ) : wargaList.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tidak ada data warga</p>
            <p className="text-sm mt-1">Tambahkan warga atau ubah filter pencarian</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Warga</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kelompok</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lahir / Usia</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kontak</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Sakramen</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wargaList.map((w: any) => {
                const usia = w.tanggalLahir
                  ? differenceInYears(new Date(), new Date(w.tanggalLahir))
                  : null
                return (
                  <tr key={w.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                          w.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500',
                        )}>
                          {w.namaLengkap.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{w.namaLengkap}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {w.nomorInduk && (
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {w.nomorInduk}
                              </span>
                            )}
                            {w.namaPanggilan && (
                              <span className="text-xs text-gray-400">&quot;{w.namaPanggilan}&quot;</span>
                            )}
                            <Badge value={w.statusKeluarga} type="statusKeluarga" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {w.keluarga?.kelompok ? (
                        <div>
                          <p className="text-gray-700">{w.keluarga.kelompok.nama}</p>
                          <p className="text-xs text-gray-400">{w.keluarga.kelompok.wilayah?.nama}</p>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {w.tanggalLahir ? (
                        <div>
                          <p className="text-gray-700">
                            {format(new Date(w.tanggalLahir), 'd MMM yyyy', { locale: localeId })}
                          </p>
                          <p className="text-xs text-gray-400">{usia} tahun</p>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{w.whatsapp ?? w.telepon ?? '—'}</p>
                      {w.email && <p className="text-xs text-gray-400 mt-0.5">{w.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-center">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          w.sudahBaptis ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                        )}>Baptis</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          w.sudahSidi ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                        )}>Sidi</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge value={w.dataStatus} type="dataStatus" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/warga/${w.id}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                          title="Lihat detail"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setEditData(w); setWizard({ step: 1 }); setModalOpen(true) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(w)}
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

      {/* Modal Wizard */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
      >
        {/* ── Error banner ── */}
        {submitError && wizard.step === 1 && (
          <div className="flex items-start gap-2.5 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="font-medium">Gagal menyimpan data</p>
              <p className="text-red-600 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Form Warga ── */}
        {wizard.step === 1 && (
          <WargaForm
            key={editData?.id ?? (addingAnakToKeluargaId ? `anak-${addingAnakToKeluargaId}` : 'new')}
            defaultValues={editData ? {
              dataStatus: editData.dataStatus,
              keluargaId: editData.keluargaId,
              nomorInduk: editData.nomorInduk,
              namaLengkap: editData.namaLengkap,
              namaPanggilan: editData.namaPanggilan,
              jenisKelamin: editData.jenisKelamin,
              tempatLahir: editData.tempatLahir,
              tanggalLahir: editData.tanggalLahir?.split('T')[0],
              nik: editData.nik,
              golonganDarah: editData.golonganDarah,
              statusKeluarga: editData.statusKeluarga,
              statusKeanggotaan: editData.statusKeanggotaan,
              sudahBaptis: editData.sudahBaptis,
              tanggalBaptis: editData.tanggalBaptis?.split('T')[0],
              tempatBaptis: editData.tempatBaptis,
              sudahSidi: editData.sudahSidi,
              nomorSidi: editData.nomorSidi,
              tanggalSidi: editData.tanggalSidi?.split('T')[0],
              telepon: editData.telepon,
              whatsapp: editData.whatsapp,
              email: editData.email,
              pendidikanTerakhir: editData.pendidikanTerakhir,
              pekerjaan: editData.pekerjaan,
              fotoUrl: editData.fotoUrl,
              alamatKtp: editData.alamatKtp,
              alamatDomisili: editData.alamatDomisili,
              latitude: editData.latitude,
              longitude: editData.longitude,
              catatan: editData.catatan,
            } : addingAnakToKeluargaId ? { statusKeluarga: 'ANAK' } : undefined}
            keluargaIdFixed={addingAnakToKeluargaId ?? undefined}
            onTambahAnak={editData?.keluargaId ? handleTambahAnak : undefined}
            onSubmit={handleSubmit}
            submitLabel={
              editData ? 'Update Warga'
              : addingAnakToKeluargaId ? 'Simpan Anak'
              : 'Simpan & Lanjutkan →'
            }
          />
        )}

        {/* ── Step 2: Tambah Anggota Keluarga ── */}
        {wizard.step === 2 && (
          <div className="space-y-5">
            {/* Konfirmasi kepala tersimpan */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Data Kepala Keluarga berhasil disimpan
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  <Crown size={11} className="inline mr-1" />
                  {wizard.kepalaNama}
                </p>
              </div>
            </div>

            {/* Daftar anggota yang sudah ditambahkan */}
            {wizard.addedAnggota.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Anggota yang ditambahkan ({wizard.addedAnggota.length})
                </p>
                <div className="divide-y border rounded-xl overflow-hidden">
                  {wizard.addedAnggota.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold',
                        a.jenisKelamin === 'L' ? 'bg-blue-400' : 'bg-pink-400',
                      )}>
                        {a.namaLengkap.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.namaLengkap}</p>
                        <p className="text-xs text-gray-400">{a.statusKeluarga}</p>
                      </div>
                      <Badge value={a.dataStatus} type="dataStatus" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form tambah anggota */}
            <AnggotaQuickForm
              keluargaId={wizard.keluargaId}
              onAdded={handleAnggotaAdded}
            />

            {/* Tombol selesai */}
            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Konfirmasi Hapus */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Konfirmasi Hapus" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">
            Hapus data warga <span className="font-semibold">{confirmDelete?.namaLengkap}</span>?
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
