'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Crown, Info, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_DOKUMEN = [
  { value: 'DRAFT',       label: 'Draft',       color: 'bg-gray-100 text-gray-600 ring-gray-300' },
  { value: 'VALIDASI',    label: 'Validasi',    color: 'bg-yellow-100 text-yellow-700 ring-yellow-300' },
  { value: 'AKTIF',       label: 'Aktif',       color: 'bg-green-100 text-green-700 ring-green-300' },
  { value: 'TIDAK_AKTIF', label: 'Tidak Aktif', color: 'bg-red-100 text-red-600 ring-red-300' },
]
import { InputField, TextareaField } from '@/components/ui/FormField'
import { useWilayahKelompok, useKelurahanSearch } from '@/hooks/useKeluarga'


const schema = z.object({
  dataStatus:        z.enum(['DRAFT', 'VALIDASI', 'AKTIF', 'TIDAK_AKTIF']).default('DRAFT'),
  kelompokId:        z.number().int().positive('Pilih kelompok').nullable(),
  kepalakeluargaId:  z.number().int().positive().optional().nullable(),
  alamat:            z.string().max(500).optional().nullable(),
  rt:                z.string().max(5).optional().nullable(),
  rw:                z.string().max(5).optional().nullable(),
  kelurahan:         z.string().max(100).optional().nullable(),
  kecamatan:         z.string().max(100).optional().nullable(),
  kota:              z.string().max(100).optional().nullable(),
  kodePos:           z.string().max(10).optional().nullable(),
  teleponRumah:      z.string().max(20).optional().nullable(),
  catatan:           z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface WargaOption {
  id: number
  namaLengkap: string
  statusKeluarga: string
}

interface Props {
  defaultValues?: Partial<FormData>
  wargas?: WargaOption[]
  onSubmit: (data: FormData) => Promise<void>
  submitLabel?: string
  keluargaId?: number
}

export function KeluargaForm({ defaultValues, wargas = [], onSubmit, submitLabel = 'Simpan', keluargaId }: Props) {
  const isCreate = !keluargaId
  const { data: wilayahList = [] } = useWilayahKelompok()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues },
  })

  const dataStatus = watch('dataStatus')
  const selectedKelompokId = watch('kelompokId')
  const selectedKepalaId = watch('kepalakeluargaId')

  const [kelurahanQuery, setKelurahanQuery] = useState('')
  const [kelurahanDropdown, setKelurahanDropdown] = useState(false)
  const { data: kelurahanResults = [] } = useKelurahanSearch(kelurahanQuery)

  useEffect(() => {
    if (defaultValues?.kelompokId) setValue('kelompokId', defaultValues.kelompokId)
  }, [defaultValues?.kelompokId, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Status Dokumen */}
      <div className="flex items-center justify-between pb-4 border-b">
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

      {/* Kelompok */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Kelompok <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedKelompokId ?? ''}
          onChange={(e) => setValue('kelompokId', e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition bg-white focus:ring-2 focus:ring-brand-500"
        >
          <option value="">— Pilih Kelompok —</option>
          {wilayahList.map((w) => (
            <optgroup key={w.id} label={w.nama}>
              {w.kelompoks.map((k) => (
                <option key={k.id} value={k.id}>
                  [{k.kode}] {k.nama}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.kelompokId && (
          <p className="mt-1 text-xs text-red-600">{errors.kelompokId.message}</p>
        )}
      </div>

      {/* Kepala Keluarga */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <Crown size={14} className="text-yellow-500" />
          Kepala Keluarga
        </label>
        {(() => {
          const candidates = wargas.filter((w) => w.statusKeluarga === 'KEPALA')
          if (candidates.length > 0) {
            return (
              <select
                value={selectedKepalaId ?? ''}
                onChange={(e) => setValue('kepalakeluargaId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Belum ditentukan —</option>
                {candidates.map((w) => (
                  <option key={w.id} value={w.id}>{w.namaLengkap}</option>
                ))}
              </select>
            )
          }
          if (wargas.length > 0) {
            return (
              <p className="text-sm text-gray-400 italic px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                Belum ada anggota berstatus Kepala KK. Ubah status warga melalui halaman{' '}
                <span className="font-medium text-amber-700">Data Warga</span>.
              </p>
            )
          }
          return (
            <p className="text-sm text-gray-400 italic px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
              Kepala keluarga dapat ditentukan setelah anggota keluarga ditambahkan.
            </p>
          )
        })()}
      </div>

      {/* Alamat — hanya tampil di mode edit */}
      {isCreate ? (
        <div className="flex gap-3 items-start rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
          <span>
            Alamat dan nomor telepon rumah dapat dilengkapi di{' '}
            <Link
              href={`/keluarga`}
              className="font-medium underline underline-offset-2 inline-flex items-center gap-0.5 hover:text-blue-900"
            >
              halaman detail keluarga
              <ArrowRight size={12} />
            </Link>{' '}
            setelah data disimpan. Anda akan diarahkan otomatis ke sana setelah klik Simpan.
          </span>
        </div>
      ) : (
        <>
          <TextareaField label="Alamat" {...register('alamat')} error={errors.alamat} rows={2} />

          {/* RT / RW / Kelurahan / Kecamatan */}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="RT" {...register('rt')} error={errors.rt} placeholder="001" />
            <InputField label="RW" {...register('rw')} error={errors.rw} placeholder="005" />
          </div>
          {/* Kelurahan — autocomplete dari master data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kelurahan</label>
              <input
                value={kelurahanQuery || watch('kelurahan') || ''}
                onChange={(e) => {
                  setKelurahanQuery(e.target.value)
                  setValue('kelurahan', e.target.value)
                  setKelurahanDropdown(true)
                }}
                onFocus={() => setKelurahanDropdown(true)}
                onBlur={() => setTimeout(() => setKelurahanDropdown(false), 150)}
                placeholder="Ketik nama kelurahan..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
              {kelurahanDropdown && kelurahanResults.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {kelurahanResults.map((k) => (
                    <li key={k.id}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setValue('kelurahan', k.nama)
                          setValue('kecamatan', k.kecamatan)
                          setValue('kota', k.kota)
                          setValue('kodePos', k.kodePos ?? '')
                          setKelurahanQuery('')
                          setKelurahanDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition"
                      >
                        <span className="font-medium text-gray-800">{k.nama}</span>
                        <span className="text-gray-400 text-xs ml-1.5">· {k.kecamatan} · {k.kodePos}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <InputField label="Kecamatan" {...register('kecamatan')} error={errors.kecamatan} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Kota" {...register('kota')} error={errors.kota} placeholder="Jakarta" />
            <InputField label="Kode Pos" {...register('kodePos')} error={errors.kodePos} placeholder="13210" />
          </div>

          {/* Telepon rumah */}
          <InputField
            label="Telepon Rumah"
            {...register('teleponRumah')}
            error={errors.teleponRumah}
            placeholder="021-XXXXXXX"
            type="tel"
          />
        </>
      )}

      {/* Catatan */}
      <TextareaField label="Catatan" {...register('catatan')} error={errors.catatan} />

      {/* Submit */}
      <div className="flex justify-end pt-2">
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
