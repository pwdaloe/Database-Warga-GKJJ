'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Award, Phone, Users } from 'lucide-react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useWilayahKelompok, useKeluargaList } from '@/hooks/useKeluarga'
import { cn } from '@/lib/utils'

// ── Status Dokumen ─────────────────────────────────────────────
const STATUS_DOKUMEN = [
  { value: 'DRAFT',       label: 'Draft',       color: 'bg-gray-100 text-gray-600 ring-gray-300' },
  { value: 'VALIDASI',    label: 'Validasi',    color: 'bg-yellow-100 text-yellow-700 ring-yellow-300' },
  { value: 'AKTIF',       label: 'Aktif',       color: 'bg-green-100 text-green-700 ring-green-300' },
  { value: 'TIDAK_AKTIF', label: 'Tidak Aktif', color: 'bg-red-100 text-red-600 ring-red-300' },
]

const PENDIDIKAN = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya']

// ── Schema ─────────────────────────────────────────────────────
const schema = z.object({
  dataStatus:         z.enum(['DRAFT', 'VALIDASI', 'AKTIF', 'TIDAK_AKTIF']).default('DRAFT'),
  keluargaId:         z.number().int().positive().optional().nullable(),
  nomorInduk:         z.string().max(30).optional().nullable(),
  namaLengkap:        z.string().min(2, 'Nama minimal 2 karakter').max(150),
  namaPanggilan:      z.string().max(50).optional().nullable(),
  jenisKelamin:       z.enum(['L', 'P'], { required_error: 'Pilih jenis kelamin' }),
  tempatLahir:        z.string().max(100).optional().nullable(),
  tanggalLahir:       z.string().optional().nullable(),
  nik:                z.string().optional().nullable(),
  golonganDarah:      z.enum(['A', 'B', 'AB', 'O']).optional().nullable(),
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
  catatan:            z.string().optional().nullable(),
})

export type WargaFormData = z.infer<typeof schema>

type Tab = 'identitas' | 'keanggotaan' | 'kontak' | 'keluarga'

interface Props {
  defaultValues?: Partial<WargaFormData>
  keluargaIdFixed?: number
  onSubmit: (data: WargaFormData) => Promise<void>
  submitLabel?: string
}

export function WargaForm({ defaultValues, keluargaIdFixed, onSubmit, submitLabel = 'Simpan' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('identitas')
  const { data: wilayahList = [] } = useWilayahKelompok()
  const { data: keluargaData } = useKeluargaList({ limit: 200 })
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
  const sudahBaptis = watch('sudahBaptis')
  const sudahSidi = watch('sudahSidi')
  const selectedKeluargaId = watch('keluargaId')

  const TABS = [
    { key: 'identitas' as Tab,   label: 'Identitas',    icon: User },
    { key: 'keanggotaan' as Tab, label: 'Keanggotaan',  icon: Award },
    { key: 'kontak' as Tab,      label: 'Kontak',       icon: Phone },
    { key: 'keluarga' as Tab,    label: 'Keluarga',     icon: Users },
  ]

  const currentStatus = STATUS_DOKUMEN.find((s) => s.value === dataStatus) ?? STATUS_DOKUMEN[0]

  const tabHasError = (tab: Tab) => {
    if (tab === 'identitas') return !!(errors.namaLengkap || errors.jenisKelamin || errors.nik)
    if (tab === 'keanggotaan') return !!(errors.statusKeluarga || errors.statusKeanggotaan)
    if (tab === 'kontak') return !!(errors.email)
    return false
  }

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
      {activeTab === 'keluarga' && !keluargaIdFixed && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kelompok
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500"
              defaultValue=""
              disabled
            >
              <option value="">— Diatur melalui data Keluarga —</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Kelompok ditentukan dari data Keluarga (KK) yang dipilih di bawah.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nomor KK / Keluarga
            </label>
            <select
              value={selectedKeluargaId ?? ''}
              onChange={(e) => setValue('keluargaId', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Belum ditentukan —</option>
              {keluargaList.map((k: any) => {
                const kepala = k.kepalaKeluarga?.namaLengkap
                  ?? k.wargas?.find((w: any) => w.statusKeluarga === 'KEPALA')?.namaLengkap
                return (
                  <option key={k.id} value={k.id}>
                    {k.nomorKeluarga ?? `KLG-${k.id}`}
                    {kepala ? ` — ${kepala}` : ''}
                    {k.kelompok ? ` (${k.kelompok.nama})` : ''}
                  </option>
                )
              })}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Jika warga ini adalah Kepala Keluarga baru, kosongkan — data KK akan dibuat otomatis setelah disimpan.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'keluarga' && keluargaIdFixed && (
        <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-700">
          Warga ini akan langsung tergabung dalam keluarga yang sedang aktif.
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
          {activeTab !== 'keluarga' && (
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
