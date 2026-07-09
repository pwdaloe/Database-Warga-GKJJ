'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Search, User, X, AlertCircle } from 'lucide-react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useWargaList } from '@/hooks/useWarga'
import { usePerpindahanMutations } from '@/hooks/usePerpindahan'
import { cn } from '@/lib/utils'

const schema = z.object({
  wargaId: z.number({ required_error: 'Pilih warga terlebih dahulu' }).int().positive(),
  jenis: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['MASUK', 'KELUAR', 'MENINGGAL'], { required_error: 'Pilih jenis perpindahan' }),
  ),
  gerejaAsalTujuan: z.string().max(200).optional().nullable(),
  tanggalPerpindahan: z.string().optional().nullable(),
  nomorSurat: z.string().max(50).optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

export type PerpindahanFormData = z.infer<typeof schema>

const JENIS_OPTIONS = [
  { value: 'MASUK', label: 'Pindah Masuk' },
  { value: 'KELUAR', label: 'Pindah Keluar' },
  { value: 'MENINGGAL', label: 'Keterangan Kematian' },
]

interface Props {
  onSuccess: () => void
}

export function PerpindahanForm({ onSuccess }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWarga, setSelectedWarga] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { data } = useWargaList({ search: searchTerm, limit: 8 })
  const wargaOptions = searchTerm.length >= 2 && !selectedWarga ? (data?.data ?? []) : []

  const { create } = usePerpindahanMutations()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PerpindahanFormData>({
    resolver: zodResolver(schema),
  })

  function selectWarga(w: any) {
    setSelectedWarga(w)
    setValue('wargaId', w.id, { shouldValidate: true })
    setSearchTerm(w.namaLengkap)
    setShowDropdown(false)
  }

  function clearWarga() {
    setSelectedWarga(null)
    setSearchTerm('')
    setValue('wargaId', undefined as unknown as number, { shouldValidate: false })
  }

  async function onFormSubmit(formData: PerpindahanFormData) {
    setSubmitError('')
    try {
      await create.mutateAsync({
        ...formData,
        gerejaAsalTujuan: formData.gerejaAsalTujuan || null,
        tanggalPerpindahan: formData.tanggalPerpindahan || null,
        nomorSurat: formData.nomorSurat || null,
        keterangan: formData.keterangan || null,
      })
      onSuccess()
    } catch (err: any) {
      const pesan =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        'Terjadi kesalahan, silakan coba lagi'
      setSubmitError(pesan)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {submitError && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p>{submitError}</p>
        </div>
      )}

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Warga<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setSelectedWarga(null)
              setValue('wargaId', undefined as unknown as number, { shouldValidate: false })
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Cari nama warga..."
            className={cn(
              'w-full pl-9 pr-8 py-2.5 rounded-lg border text-sm outline-none transition',
              'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              errors.wargaId ? 'border-red-400 bg-red-50' : 'border-gray-300',
            )}
          />
          {selectedWarga && (
            <button
              type="button"
              onClick={clearWarga}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {showDropdown && wargaOptions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {wargaOptions.map((w: any) => (
              <button
                type="button"
                key={w.id}
                onClick={() => selectWarga(w)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <User size={13} className="text-gray-400" />
                <span>{w.namaLengkap}</span>
                {w.nomorAnggota && <span className="text-xs text-gray-400">({w.nomorAnggota})</span>}
              </button>
            ))}
          </div>
        )}
        {errors.wargaId && <p className="mt-1 text-xs text-red-600">{errors.wargaId.message}</p>}
      </div>

      <SelectField
        label="Jenis Perpindahan"
        required
        options={JENIS_OPTIONS}
        placeholder="— Pilih —"
        {...register('jenis')}
        error={errors.jenis}
      />

      <InputField
        label="Gereja Asal/Tujuan"
        {...register('gerejaAsalTujuan')}
        error={errors.gerejaAsalTujuan as any}
        placeholder="Nama gereja asal atau tujuan"
      />

      <InputField
        label="Tanggal Perpindahan"
        type="date"
        {...register('tanggalPerpindahan')}
        error={errors.tanggalPerpindahan as any}
      />

      <InputField
        label="Nomor Surat"
        {...register('nomorSurat')}
        error={errors.nomorSurat as any}
        placeholder="Opsional, bisa diisi kemudian"
      />

      <TextareaField
        label="Keterangan"
        {...register('keterangan')}
        error={errors.keterangan as any}
      />

      <div className="flex justify-end pt-2 border-t">
        <button
          type="submit"
          disabled={isSubmitting || create.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700
            disabled:bg-brand-300 text-white text-sm font-medium rounded-lg transition"
        >
          {(isSubmitting || create.isPending) && <Loader2 size={14} className="animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  )
}
