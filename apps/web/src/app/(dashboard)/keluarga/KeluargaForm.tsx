'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useWilayahKelompok } from '@/hooks/useKeluarga'

const schema = z.object({
  kelompokId:   z.number().int().positive('Pilih kelompok').nullable(),
  alamat:       z.string().max(500).optional().nullable(),
  rt:           z.string().max(5).optional().nullable(),
  rw:           z.string().max(5).optional().nullable(),
  kelurahan:    z.string().max(100).optional().nullable(),
  kecamatan:    z.string().max(100).optional().nullable(),
  kota:         z.string().max(100).optional().nullable(),
  kodePos:      z.string().max(10).optional().nullable(),
  teleponRumah: z.string().max(20).optional().nullable(),
  catatan:      z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<FormData>
  onSubmit: (data: FormData) => Promise<void>
  submitLabel?: string
}

export function KeluargaForm({ defaultValues, onSubmit, submitLabel = 'Simpan' }: Props) {
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

  const selectedKelompokId = watch('kelompokId')

  useEffect(() => {
    if (defaultValues?.kelompokId) setValue('kelompokId', defaultValues.kelompokId)
  }, [defaultValues?.kelompokId, setValue])

  // Flatten semua kelompok untuk dropdown
  const allKelompok = wilayahList.flatMap((w) =>
    w.kelompoks.map((k) => ({
      value: k.id,
      label: `[${k.kode}] ${k.nama} — ${w.nama}`,
    })),
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Alamat */}
      <TextareaField label="Alamat" {...register('alamat')} error={errors.alamat} rows={2} />

      {/* RT / RW / Kelurahan / Kecamatan */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="RT" {...register('rt')} error={errors.rt} placeholder="001" />
        <InputField label="RW" {...register('rw')} error={errors.rw} placeholder="005" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Kelurahan" {...register('kelurahan')} error={errors.kelurahan} />
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
