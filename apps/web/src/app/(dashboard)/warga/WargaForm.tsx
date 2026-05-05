'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const schema = z.object({
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

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<FormData>
  keluargaIdFixed?: number
  onSubmit: (data: FormData) => Promise<void>
  submitLabel?: string
}

const PENDIDIKAN = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya']

export function WargaForm({ defaultValues, keluargaIdFixed, onSubmit, submitLabel = 'Simpan' }: Props) {
  const { data: wilayahList = [] } = useWilayahKelompok()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      statusKeanggotaan: 'AKTIF',
      statusKeluarga: 'LAINNYA',
      sudahBaptis: false,
      sudahSidi: false,
      jenisKelamin: undefined,
      ...defaultValues,
      ...(keluargaIdFixed ? { keluargaId: keluargaIdFixed } : {}),
    },
  })

  const sudahBaptis = watch('sudahBaptis')
  const sudahSidi = watch('sudahSidi')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── Identitas Pribadi ─────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
          Identitas Pribadi
        </h3>
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
          <InputField
            label="Nama Panggilan"
            {...register('namaPanggilan')}
            error={errors.namaPanggilan}
          />
          <SelectField
            label="Jenis Kelamin" required
            options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
            placeholder="— Pilih —"
            {...register('jenisKelamin')}
            error={errors.jenisKelamin}
          />
          <InputField
            label="Tempat Lahir"
            {...register('tempatLahir')}
            error={errors.tempatLahir}
          />
          <InputField
            label="Tanggal Lahir"
            type="date"
            {...register('tanggalLahir')}
            error={errors.tanggalLahir as any}
          />
          <InputField
            label="NIK"
            {...register('nik')}
            error={errors.nik}
            placeholder="16 digit"
            maxLength={16}
          />
          <SelectField
            label="Golongan Darah"
            options={[
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'AB', label: 'AB' },
              { value: 'O', label: 'O' },
            ]}
            placeholder="— Pilih —"
            {...register('golonganDarah')}
            error={errors.golonganDarah}
          />
        </div>
      </section>

      {/* ── Status Keanggotaan ────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
          Status Keanggotaan
        </h3>
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
      </section>

      {/* ── Sakramen ─────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
          Sakramen
        </h3>
        <div className="space-y-4">
          {/* Baptis */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sudahBaptis"
              {...register('sudahBaptis')}
              className="w-4 h-4 rounded text-brand-600"
            />
            <label htmlFor="sudahBaptis" className="text-sm font-medium text-gray-700">
              Sudah Baptis
            </label>
          </div>
          {sudahBaptis && (
            <div className="grid grid-cols-2 gap-4 pl-7">
              <InputField
                label="Tanggal Baptis"
                type="date"
                {...register('tanggalBaptis')}
                error={errors.tanggalBaptis as any}
              />
              <InputField
                label="Tempat Baptis"
                {...register('tempatBaptis')}
                error={errors.tempatBaptis}
              />
            </div>
          )}

          {/* Sidi */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sudahSidi"
              {...register('sudahSidi')}
              className="w-4 h-4 rounded text-brand-600"
            />
            <label htmlFor="sudahSidi" className="text-sm font-medium text-gray-700">
              Sudah Sidi
            </label>
          </div>
          {sudahSidi && (
            <div className="grid grid-cols-2 gap-4 pl-7">
              <InputField
                label="Nomor Sidi"
                {...register('nomorSidi')}
                error={errors.nomorSidi}
              />
              <InputField
                label="Tanggal Sidi"
                type="date"
                {...register('tanggalSidi')}
                error={errors.tanggalSidi as any}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Kontak ───────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
          Kontak
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Telepon"
            type="tel"
            {...register('telepon')}
            error={errors.telepon}
            placeholder="08xx-xxxx-xxxx"
          />
          <InputField
            label="WhatsApp"
            type="tel"
            {...register('whatsapp')}
            error={errors.whatsapp}
            placeholder="08xx-xxxx-xxxx"
          />
          <div className="col-span-2">
            <InputField
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email}
            />
          </div>
        </div>
      </section>

      {/* ── Lainnya ──────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
          Lainnya
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Pendidikan Terakhir"
            options={PENDIDIKAN.map((p) => ({ value: p, label: p }))}
            placeholder="— Pilih —"
            {...register('pendidikanTerakhir')}
            error={errors.pendidikanTerakhir}
          />
          <InputField
            label="Pekerjaan"
            {...register('pekerjaan')}
            error={errors.pekerjaan}
          />
          <div className="col-span-2">
            <TextareaField label="Catatan" {...register('catatan')} error={errors.catatan} />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end pt-2 border-t">
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
