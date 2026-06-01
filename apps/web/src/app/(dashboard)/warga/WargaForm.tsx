'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Award, Phone, Users, Crown, MapPin, UserPlus, Camera, X } from 'lucide-react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useWilayahKelompok, useKeluargaList, useKeluargaDetail } from '@/hooks/useKeluarga'
import { cn } from '@/lib/utils'

// ── Status Dokumen ─────────────────────────────────────────────
const STATUS_DOKUMEN = [
  { value: 'DRAFT',       label: 'Draft',       color: 'bg-gray-100 text-gray-600 ring-gray-300' },
  { value: 'VALIDASI',    label: 'Validasi',    color: 'bg-yellow-100 text-yellow-700 ring-yellow-300' },
  { value: 'AKTIF',       label: 'Aktif',       color: 'bg-green-100 text-green-700 ring-green-300' },
  { value: 'TIDAK_AKTIF', label: 'Tidak Aktif', color: 'bg-red-100 text-red-600 ring-red-300' },
]

const PENDIDIKAN = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya']

const STATUS_KELUARGA_LABEL: Record<string, string> = {
  KEPALA: 'Kepala KK',
  ISTRI: 'Istri',
  ANAK: 'Anak',
  MENANTU: 'Menantu',
  CUCU: 'Cucu',
  LAINNYA: 'Lainnya',
}

const STATUS_KEANGGOTAAN_COLOR: Record<string, string> = {
  AKTIF: 'bg-green-100 text-green-700',
  NON_AKTIF: 'bg-gray-100 text-gray-500',
  KATEKUMEN: 'bg-blue-100 text-blue-700',
  PINDAH_KELUAR: 'bg-orange-100 text-orange-700',
  MENINGGAL: 'bg-red-100 text-red-600',
}

// ── Schema ─────────────────────────────────────────────────────
const schema = z.object({
  dataStatus:         z.enum(['DRAFT', 'VALIDASI', 'AKTIF', 'TIDAK_AKTIF']).default('DRAFT'),
  keluargaId:         z.number().int().positive().optional().nullable(),
  // Fields untuk membuat Keluarga baru (hanya saat statusKeluarga = KEPALA)
  newKelompokId:      z.number().int().positive().optional().nullable(),
  newAlamat:          z.string().max(500).optional().nullable(),
  newRt:              z.string().max(5).optional().nullable(),
  newRw:              z.string().max(5).optional().nullable(),
  newKelurahan:       z.string().max(100).optional().nullable(),
  newKecamatan:       z.string().max(100).optional().nullable(),
  newKota:            z.string().max(100).optional().nullable(),
  newKodePos:         z.string().max(10).optional().nullable(),
  newTeleponRumah:    z.string().max(20).optional().nullable(),
  nomorInduk:         z.string().max(30).optional().nullable(),
  namaLengkap:        z.string().min(2, 'Nama minimal 2 karakter').max(150),
  namaPanggilan:      z.string().max(50).optional().nullable(),
  jenisKelamin:       z.enum(['L', 'P'], { required_error: 'Pilih jenis kelamin' }),
  tempatLahir:        z.string().max(100).optional().nullable(),
  tanggalLahir:       z.string().optional().nullable(),
  nik:                z.string().optional().nullable(),
  golonganDarah:      z.preprocess(v => v === '' ? null : v, z.enum(['A', 'B', 'AB', 'O']).optional().nullable()),
  statusKeluarga:     z.enum(['KEPALA', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'LAINNYA']),
  statusKeanggotaan:  z.enum(['AKTIF', 'NON_AKTIF', 'KATEKUMEN', 'PINDAH_KELUAR', 'MENINGGAL']),
  sudahBaptis:        z.boolean().default(false),
  tanggalBaptis:      z.string().optional().nullable(),
  tempatBaptis:       z.string().max(150).optional().nullable(),
  sudahSidi:          z.boolean().default(false),
  nomorSidi:          z.string().max(30).optional().nullable(),
  tanggalSidi:        z.string().optional().nullable(),
  telepon:            z.string().max(20).optional().nullable(),
  whatsapp:           z.string().max(20).optional().nullable(),
  email:              z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  pendidikanTerakhir: z.string().max(50).optional().nullable(),
  pekerjaan:          z.string().max(100).optional().nullable(),
  fotoUrl:            z.string().optional().nullable(),
  alamatKtp:          z.string().optional().nullable(),
  alamatDomisili:     z.string().optional().nullable(),
  latitude:           z.number().optional().nullable(),
  longitude:          z.number().optional().nullable(),
  catatan:            z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.statusKeluarga === 'KEPALA' && !data.keluargaId && !data.newKelompokId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pilih kelompok untuk Kepala Keluarga baru',
      path: ['newKelompokId'],
    })
  }
})

export type WargaFormData = z.infer<typeof schema>

type Tab = 'identitas' | 'keanggotaan' | 'kontak' | 'keluarga' | 'alamat'

interface Props {
  defaultValues?: Partial<WargaFormData>
  keluargaIdFixed?: number
  onTambahAnak?: () => void
  onSubmit: (data: WargaFormData) => Promise<void>
  submitLabel?: string
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 400
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

export function WargaForm({ defaultValues, keluargaIdFixed, onTambahAnak, onSubmit, submitLabel = 'Simpan' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('identitas')
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const [keluargaSearch, setKeluargaSearch] = useState('')
  const { data: wilayahList = [] } = useWilayahKelompok()
  const { data: keluargaData } = useKeluargaList({ limit: 50, search: keluargaSearch || undefined })
  const keluargaList = keluargaData?.data ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WargaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataStatus: 'DRAFT',
      statusKeanggotaan: 'AKTIF',
      statusKeluarga: 'LAINNYA',
      sudahBaptis: false,
      sudahSidi: false,
      jenisKelamin: undefined,
      ...defaultValues,
      ...(keluargaIdFixed ? { keluargaId: keluargaIdFixed } : {}),
    },
  })

  const dataStatus = watch('dataStatus')
  const statusKeluarga = watch('statusKeluarga')
  const sudahBaptis = watch('sudahBaptis')

  // Saat user mengubah statusKeluarga ke KEPALA, clear keluargaId lama
  // agar form menampilkan panel "Keluarga Baru" dan isNewKepala jadi true di submit
  const prevStatusRef = useRef(statusKeluarga)
  useEffect(() => {
    if (prevStatusRef.current !== statusKeluarga && statusKeluarga === 'KEPALA') {
      setValue('keluargaId', null)
    }
    prevStatusRef.current = statusKeluarga
  }, [statusKeluarga, setValue])
  const sudahSidi = watch('sudahSidi')
  const selectedKeluargaId = watch('keluargaId')
  const fotoUrl = watch('fotoUrl')
  const alamatDomisili = watch('alamatDomisili')
  const [domisiliDifferent, setDomisiliDifferent] = useState(
    () => !!(defaultValues?.alamatDomisili)
  )

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setValue('fotoUrl', compressed)
    } catch {
      alert('Gagal memproses foto. Coba foto lain.')
    }
    e.target.value = ''
  }

  // Fetch detail KK terpilih saat search kosong tapi ID sudah ada
  const { data: selectedKeluargaDetail } = useKeluargaDetail(
    !keluargaSearch.trim() && selectedKeluargaId && !keluargaIdFixed ? selectedKeluargaId : null,
  )

  // Fetch detail KK fixed (saat ditambah dari halaman keluarga)
  const { data: fixedKeluargaDetail } = useKeluargaDetail(keluargaIdFixed ?? null)

  const TABS = [
    { key: 'identitas'   as Tab, label: 'Identitas',   icon: User },
    { key: 'keanggotaan' as Tab, label: 'Keanggotaan', icon: Award },
    { key: 'kontak'      as Tab, label: 'Kontak',      icon: Phone },
    { key: 'keluarga'    as Tab, label: 'Keluarga',    icon: Users },
    { key: 'alamat'      as Tab, label: 'Alamat',      icon: MapPin },
  ]

  const tabHasError = (tab: Tab) => {
    if (tab === 'identitas') return !!(errors.namaLengkap || errors.jenisKelamin || errors.nik)
    if (tab === 'keanggotaan') return !!(errors.statusKeluarga || errors.statusKeanggotaan)
    if (tab === 'kontak') return !!(errors.email)
    if (tab === 'keluarga') return !!(errors.newKelompokId)
    return false
  }

  // Resolve keluarga yang aktif (search, fixed, atau default values)
  const activeKeluarga = (() => {
    if (keluargaIdFixed) return fixedKeluargaDetail
    const sel = keluargaList.find((k: any) => k.id === selectedKeluargaId) ?? selectedKeluargaDetail
    return sel ?? null
  })()

  const kepalaAnggota = activeKeluarga?.wargas?.find((w: any) => w.statusKeluarga === 'KEPALA')
  const anggotaList: any[] = activeKeluarga?.wargas ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">

      {/* ── Header: Status Dokumen ─────────────────────────── */}
      <div className="flex items-center justify-between px-1 pb-4 mb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status Dokumen</p>
        <div className="flex gap-1.5">
          {STATUS_DOKUMEN.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setValue('dataStatus', s.value as any)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition ring-1',
                dataStatus === s.value
                  ? s.color + ' ring-2'
                  : 'bg-white text-gray-400 ring-gray-200 hover:ring-gray-300',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab navigation ────────────────────────────────── */}
      <div className="flex border-b mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition',
              activeTab === key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
              tabHasError(key) && activeTab !== key && 'text-red-500',
            )}
          >
            <Icon size={14} />
            {label}
            {tabHasError(key) && <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5" />}
          </button>
        ))}
      </div>

      {/* ── Tab: Identitas ────────────────────────────────── */}
      {activeTab === 'identitas' && (
        <div className="space-y-4">

          {/* Foto */}
          <div className="flex flex-col items-center gap-1.5 pb-2">
            <button
              type="button"
              onClick={() => fotoInputRef.current?.click()}
              className="relative group"
              title="Upload foto"
            >
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto warga"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                />
              ) : (
                <div className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200 shadow-sm',
                  watch('jenisKelamin') === 'P' ? 'bg-pink-400' : 'bg-blue-400',
                )}>
                  {watch('namaLengkap')?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Camera size={22} className="text-white" />
              </div>
            </button>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
            <p className="text-xs text-gray-400">Klik foto untuk upload</p>
            {fotoUrl && (
              <button
                type="button"
                onClick={() => setValue('fotoUrl', null)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition"
              >
                <X size={11} /> Hapus foto
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <InputField
                label="Nama Lengkap" required
                {...register('namaLengkap')}
                error={errors.namaLengkap}
                placeholder="Sesuai KTP"
              />
              <InputField
                label="No. Induk Warga"
                {...register('nomorInduk')}
                error={errors.nomorInduk}
                placeholder="Nomor induk dari gereja"
              />
            </div>
            <InputField label="Nama Panggilan" {...register('namaPanggilan')} error={errors.namaPanggilan} />
            <SelectField
              label="Jenis Kelamin" required
              options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
              placeholder="— Pilih —"
              {...register('jenisKelamin')}
              error={errors.jenisKelamin}
            />
            <InputField label="Tempat Lahir" {...register('tempatLahir')} error={errors.tempatLahir} />
            <InputField label="Tanggal Lahir" type="date" {...register('tanggalLahir')} error={errors.tanggalLahir as any} />
            <InputField label="NIK" {...register('nik')} error={errors.nik} placeholder="16 digit" maxLength={16} />
            <SelectField
              label="Golongan Darah"
              options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'AB', label: 'AB' }, { value: 'O', label: 'O' }]}
              placeholder="— Pilih —"
              {...register('golonganDarah')}
              error={errors.golonganDarah}
            />
          </div>
        </div>
      )}

      {/* ── Tab: Keanggotaan ──────────────────────────────── */}
      {activeTab === 'keanggotaan' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Status dalam Keluarga" required
              options={[
                { value: 'KEPALA', label: 'Kepala Keluarga' },
                { value: 'ISTRI', label: 'Istri' },
                { value: 'ANAK', label: 'Anak' },
                { value: 'MENANTU', label: 'Menantu' },
                { value: 'CUCU', label: 'Cucu' },
                { value: 'LAINNYA', label: 'Lainnya' },
              ]}
              {...register('statusKeluarga')}
              error={errors.statusKeluarga}
            />
            <SelectField
              label="Status Keanggotaan" required
              options={[
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'NON_AKTIF', label: 'Non Aktif' },
                { value: 'KATEKUMEN', label: 'Katekumen' },
                { value: 'PINDAH_KELUAR', label: 'Pindah Keluar' },
                { value: 'MENINGGAL', label: 'Meninggal' },
              ]}
              {...register('statusKeanggotaan')}
              error={errors.statusKeanggotaan}
            />
          </div>

          {/* Baptis */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sudahBaptis" {...register('sudahBaptis')} className="w-4 h-4 rounded text-brand-600" />
              <label htmlFor="sudahBaptis" className="text-sm font-medium text-gray-700">Sudah Baptis</label>
            </div>
            {sudahBaptis && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <InputField label="Tanggal Baptis" type="date" {...register('tanggalBaptis')} error={errors.tanggalBaptis as any} />
                <InputField label="Tempat Baptis" {...register('tempatBaptis')} error={errors.tempatBaptis} />
              </div>
            )}
          </div>

          {/* Sidi */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sudahSidi" {...register('sudahSidi')} className="w-4 h-4 rounded text-brand-600" />
              <label htmlFor="sudahSidi" className="text-sm font-medium text-gray-700">Sudah Sidi</label>
            </div>
            {sudahSidi && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <InputField label="Nomor Sidi" {...register('nomorSidi')} error={errors.nomorSidi} />
                <InputField label="Tanggal Sidi" type="date" {...register('tanggalSidi')} error={errors.tanggalSidi as any} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Kontak ───────────────────────────────────── */}
      {activeTab === 'kontak' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telepon" type="tel" {...register('telepon')} error={errors.telepon} placeholder="08xx-xxxx-xxxx" />
            <InputField label="WhatsApp" type="tel" {...register('whatsapp')} error={errors.whatsapp} placeholder="08xx-xxxx-xxxx" />
            <div className="col-span-2">
              <InputField label="Email" type="email" {...register('email')} error={errors.email} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Pendidikan Terakhir"
              options={PENDIDIKAN.map((p) => ({ value: p, label: p }))}
              placeholder="— Pilih —"
              {...register('pendidikanTerakhir')}
              error={errors.pendidikanTerakhir}
            />
            <InputField label="Pekerjaan" {...register('pekerjaan')} error={errors.pekerjaan} />
          </div>
          <TextareaField label="Catatan" {...register('catatan')} error={errors.catatan} />
        </div>
      )}

      {/* ── Tab: Keluarga ─────────────────────────────────── */}
      {activeTab === 'keluarga' && (
        <div className="space-y-4">
          {/* Kasus: keluarga sudah fixed (tambah anggota dari halaman KK) */}
          {keluargaIdFixed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Users size={15} className="text-brand-500" />
                <span className="text-sm font-semibold text-gray-700">Keluarga</span>
              </div>

              {/* Info keluarga fixed */}
              {fixedKeluargaDetail && (
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={13} className="text-yellow-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kepala Keluarga</span>
                  </div>
                  <p className="text-sm font-medium text-brand-900">
                    {kepalaAnggota?.namaLengkap ?? '(Belum ditentukan)'}
                  </p>
                  <p className="text-xs text-brand-600 mt-0.5">
                    {fixedKeluargaDetail.nomorKeluarga}
                    {fixedKeluargaDetail.kelompok ? ` · ${fixedKeluargaDetail.kelompok.nama}` : ''}
                  </p>
                </div>
              )}

              {/* Tabel anggota */}
              <AnggotaTable anggota={anggotaList} />

              {/* Tambah anak — hanya saat edit warga yg sudah punya KK */}
              {onTambahAnak && activeKeluarga && (
                <TambahAnakButton onClick={onTambahAnak} />
              )}
            </div>
          ) : statusKeluarga === 'KEPALA' ? (
            /* Kasus: warga baru sebagai Kepala KK baru */
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Crown size={15} className="text-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">Keluarga Baru</span>
              </div>

              {/* Kelompok — wajib */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kelompok <span className="text-red-500">*</span>
                </label>
                <select
                  value={watch('newKelompokId') ?? ''}
                  onChange={(e) => setValue('newKelompokId', e.target.value ? Number(e.target.value) : null)}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500',
                    errors.newKelompokId ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
                  )}
                >
                  <option value="">— Pilih Kelompok —</option>
                  {wilayahList.map((w) => (
                    <optgroup key={w.id} label={w.nama}>
                      {w.kelompoks.map((k) => (
                        <option key={k.id} value={k.id}>[{k.kode}] {k.nama}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.newKelompokId && (
                  <p className="mt-1 text-xs text-red-600">{errors.newKelompokId.message}</p>
                )}
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                KK baru akan dibuat otomatis saat disimpan. Detail alamat dapat dilengkapi di tab{' '}
                <strong>Alamat</strong>.
              </div>

              {onTambahAnak && activeKeluarga ? (
                <>
                  <AnggotaTable anggota={anggotaList} />
                  <TambahAnakButton onClick={onTambahAnak} />
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                  <Users size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Belum ada anggota keluarga</p>
                  <p className="text-xs text-gray-300 mt-1">Tambahkan setelah KK berhasil dibuat</p>
                </div>
              )}
            </div>
          ) : (
            /* Kasus: bukan kepala — cari & pilih keluarga */
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Users size={15} className="text-brand-500" />
                <span className="text-sm font-semibold text-gray-700">Bergabung ke Keluarga</span>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cari Keluarga
                </label>
                <input
                  type="text"
                  value={keluargaSearch}
                  onChange={(e) => {
                    setKeluargaSearch(e.target.value)
                    setValue('keluargaId', null)
                  }}
                  placeholder="Ketik nama kepala keluarga atau nomor KK..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Hasil pencarian */}
              {keluargaSearch.trim() && !selectedKeluargaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pilih Keluarga
                    {keluargaList.length > 0 && (
                      <span className="ml-1.5 text-xs text-gray-400">({keluargaList.length} ditemukan)</span>
                    )}
                  </label>
                  {keluargaList.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-2">Tidak ada keluarga ditemukan.</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden divide-y max-h-48 overflow-y-auto">
                      {keluargaList.map((k: any) => {
                        const kepala = k.kepalaKeluarga?.namaLengkap
                          ?? k.wargas?.find((w: any) => w.statusKeluarga === 'KEPALA')?.namaLengkap
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => setValue('keluargaId', k.id)}
                            className="w-full text-left px-3 py-2.5 text-sm bg-white hover:bg-gray-50 transition"
                          >
                            <span className="font-medium text-gray-900">
                              {kepala ?? '(Kepala belum ditentukan)'}
                            </span>
                            <span className="text-gray-400 ml-2 text-xs">
                              {k.nomorKeluarga ?? `KLG-${k.id}`}
                              {k.kelompok ? ` · ${k.kelompok.nama}` : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Keluarga terpilih: kepala + anggota */}
              {selectedKeluargaId && activeKeluarga && (
                <div className="space-y-3">
                  {/* Kepala KK */}
                  <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-lg">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Crown size={12} className="text-yellow-500" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kepala Keluarga</span>
                      </div>
                      <p className="text-sm font-medium text-brand-900">
                        {kepalaAnggota?.namaLengkap ?? 'Belum ditentukan'}
                      </p>
                      <p className="text-xs text-brand-600 mt-0.5">
                        {activeKeluarga.nomorKeluarga}
                        {activeKeluarga.kelompok ? ` · ${activeKeluarga.kelompok.nama}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setValue('keluargaId', null); setKeluargaSearch('') }}
                      className="text-xs text-brand-500 hover:text-brand-700 underline ml-3 shrink-0"
                    >
                      Ubah
                    </button>
                  </div>

                  {/* Tabel anggota */}
                  <AnggotaTable anggota={anggotaList} />

                  {onTambahAnak && (
                    <TambahAnakButton onClick={onTambahAnak} />
                  )}
                </div>
              )}

              {!keluargaSearch.trim() && !selectedKeluargaId && (
                <p className="text-xs text-gray-400">
                  Ketik nama kepala keluarga atau nomor KK untuk mencari.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Alamat ───────────────────────────────────── */}
      {activeTab === 'alamat' && (
        <div className="space-y-5">

          {/* Alamat Rumah Tangga — hanya KEPALA baru */}
          {statusKeluarga === 'KEPALA' && !keluargaIdFixed && (
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-500" />
                <span className="text-sm font-semibold text-blue-800">Alamat Rumah Tangga (KK)</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Alamat</label>
                <textarea
                  {...register('newAlamat')}
                  rows={2}
                  placeholder="Jl. Contoh No. 1"
                  className="w-full px-3 py-2.5 rounded-lg border border-blue-200 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <InputField label="RT" {...register('newRt')} placeholder="001" />
                <InputField label="RW" {...register('newRw')} placeholder="005" />
                <div className="col-span-2">
                  <InputField label="Kelurahan" {...register('newKelurahan')} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Kecamatan" {...register('newKecamatan')} />
                <InputField label="Kota" {...register('newKota')} placeholder="Jakarta" />
                <InputField label="Kode Pos" {...register('newKodePos')} placeholder="13210" />
              </div>
              <InputField label="Telepon Rumah" type="tel" {...register('newTeleponRumah')} placeholder="021-XXXXXXX" />
            </div>
          )}

          {/* ── Alamat KTP ─────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b">
              <span className="text-sm font-semibold text-gray-700">Alamat KTP</span>
              <span className="text-xs text-gray-400">Sesuai Kartu Tanda Penduduk</span>
            </div>
            <textarea
              {...register('alamatKtp')}
              rows={3}
              placeholder="Jl. Nama Jalan No. XX, RT 000/RW 000, Kelurahan, Kecamatan, Kota, Kode Pos"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* ── Alamat Domisili ─────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b">
              <span className="text-sm font-semibold text-gray-700">Alamat Domisili</span>
              <span className="text-xs text-gray-400">Jika berbeda dari KTP</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={domisiliDifferent}
                onChange={(e) => {
                  setDomisiliDifferent(e.target.checked)
                  if (!e.target.checked) setValue('alamatDomisili', null)
                }}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span className="text-sm text-gray-600">Domisili berbeda dari KTP</span>
            </label>
            {domisiliDifferent && (
              <textarea
                {...register('alamatDomisili')}
                rows={3}
                placeholder="Jl. Nama Jalan No. XX, RT 000/RW 000, Kelurahan, Kecamatan, Kota, Kode Pos"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500 resize-none"
              />
            )}
            {domisiliDifferent && alamatDomisili && (
              <p className="text-xs text-gray-400">Domisili: {alamatDomisili}</p>
            )}
          </div>

          {/* ── Titik Rumah ─────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b">
              <span className="text-sm font-semibold text-gray-700">Titik Rumah</span>
              <span className="text-xs text-gray-400">Koordinat Google Maps</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={watch('latitude') ?? ''}
                  onChange={(e) => setValue('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="-6.2088"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={watch('longitude') ?? ''}
                  onChange={(e) => setValue('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="106.8456"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            {/* Link buka maps jika sudah ada koordinat */}
            {watch('latitude') && watch('longitude') ? (
              <a
                href={`https://www.google.com/maps?q=${watch('latitude')},${watch('longitude')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
              >
                <MapPin size={12} />
                Lihat di Google Maps
              </a>
            ) : (
              <p className="text-xs text-gray-400 leading-relaxed">
                Cara mendapatkan koordinat: buka{' '}
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
                  Google Maps
                </a>
                {' '}→ cari lokasi rumah → klik kanan → pilih{' '}
                <strong>"What's here?"</strong> → salin angka koordinat ke field di atas.
              </p>
            )}
          </div>

        </div>
      )}

      {/* ── Navigasi tab + Submit ─────────────────────────── */}
      <div className="flex items-center justify-between pt-5 mt-2 border-t">
        <div className="flex gap-2">
          {activeTab !== 'identitas' && (
            <button
              type="button"
              onClick={() => {
                const idx = TABS.findIndex((t) => t.key === activeTab)
                setActiveTab(TABS[idx - 1].key)
              }}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
            >
              ← Sebelumnya
            </button>
          )}
          {activeTab !== 'alamat' && (
            <button
              type="button"
              onClick={() => {
                const idx = TABS.findIndex((t) => t.key === activeTab)
                setActiveTab(TABS[idx + 1].key)
              }}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
            >
              Selanjutnya →
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700
            disabled:bg-brand-300 text-white text-sm font-medium rounded-lg transition"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Menyimpan...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── Tombol tambah anak ────────────────────────────────────────
function TambahAnakButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5
        border border-dashed border-brand-300 text-brand-600 hover:bg-brand-50
        text-sm font-medium rounded-lg transition"
    >
      <UserPlus size={14} />
      Tambah Anggota Keluarga ke KK Ini
    </button>
  )
}

// ── Komponen tabel anggota keluarga ───────────────────────────
function AnggotaTable({ anggota }: { anggota: any[] }) {
  if (anggota.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Anggota Keluarga ({anggota.length})
      </p>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Nama</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">JK</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Keanggotaan</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {anggota.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 transition">
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-900 leading-tight">{w.namaLengkap}</p>
                  {w.namaPanggilan && (
                    <p className="text-xs text-gray-400">{w.namaPanggilan}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium',
                    w.statusKeluarga === 'KEPALA' ? 'text-yellow-700' : 'text-gray-600',
                  )}>
                    {w.statusKeluarga === 'KEPALA' && <Crown size={10} />}
                    {STATUS_KELUARGA_LABEL[w.statusKeluarga] ?? w.statusKeluarga}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-500">
                  {w.jenisKelamin === 'L' ? 'L' : 'P'}
                </td>
                <td className="px-3 py-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    STATUS_KEANGGOTAAN_COLOR[w.statusKeanggotaan] ?? 'bg-gray-100 text-gray-500',
                  )}>
                    {w.statusKeanggotaan === 'AKTIF' ? 'Aktif'
                      : w.statusKeanggotaan === 'NON_AKTIF' ? 'Non Aktif'
                      : w.statusKeanggotaan === 'KATEKUMEN' ? 'Katekumen'
                      : w.statusKeanggotaan === 'PINDAH_KELUAR' ? 'Pindah'
                      : w.statusKeanggotaan === 'MENINGGAL' ? 'Meninggal'
                      : w.statusKeanggotaan}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
