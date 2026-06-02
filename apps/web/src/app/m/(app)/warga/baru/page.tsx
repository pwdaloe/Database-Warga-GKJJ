'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle2, MapPin } from 'lucide-react'
import { useWargaMutations } from '@/hooks/useWarga'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const STATUS_KELUARGA = [
  { value: 'LAINNYA',  label: 'Lainnya' },
  { value: 'KEPALA',   label: 'Kepala KK' },
  { value: 'ISTRI',    label: 'Istri' },
  { value: 'ANAK',     label: 'Anak' },
  { value: 'MENANTU',  label: 'Menantu' },
  { value: 'CUCU',     label: 'Cucu' },
]
const STATUS_KEANGGOTAAN = [
  { value: 'NON_AKTIF',     label: 'Non Aktif' },
  { value: 'AKTIF',         label: 'Aktif' },
  { value: 'KATEKUMEN',     label: 'Katekumen' },
  { value: 'PINDAH_KELUAR', label: 'Pindah Keluar' },
  { value: 'MENINGGAL',     label: 'Meninggal' },
]

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-base font-semibold text-gray-700 mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls  = 'w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition'
const selectCls = inputCls + ' appearance-none'

export default function MobileWargaBaru() {
  const router = useRouter()
  const { user } = useAuth()
  const { create } = useWargaMutations()
  const { data: wilayahList = [] } = useWilayahKelompok()

  const isPenatua   = user?.role === 'PENATUA_KELOMPOK'
  const allKelompok = wilayahList.flatMap((w) => w.kelompoks)

  const [form, setForm] = useState({
    namaLengkap:       '',
    jenisKelamin:      '' as 'L' | 'P' | '',
    statusKeluarga:    'LAINNYA',
    kelompokId:        isPenatua && user?.kelompokId ? user.kelompokId : null as number | null,
    statusKeanggotaan: 'NON_AKTIF',
    whatsapp:          '',
  })

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const selectedKelompok = allKelompok.find((k) => k.id === form.kelompokId)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaLengkap.trim())  { setError('Nama lengkap wajib diisi'); return }
    if (!form.jenisKelamin)        { setError('Jenis kelamin wajib dipilih'); return }
    if (!form.kelompokId)          { setError('Kelompok wajib dipilih'); return }
    setError('')

    const payload: any = {
      namaLengkap:       form.namaLengkap.trim(),
      jenisKelamin:      form.jenisKelamin,
      statusKeluarga:    form.statusKeluarga,
      statusKeanggotaan: form.statusKeanggotaan,
      whatsapp:          form.whatsapp.trim() || null,
      dataStatus:        'DRAFT',
      newKeluarga:       { kelompokId: form.kelompokId },
    }

    try {
      await create.mutateAsync(payload)
      setSuccess(true)
      setTimeout(() => router.push('/m/warga'), 1500)
    } catch (err: any) {
      const apiErr = err?.response?.data
      setError(apiErr?.details?.[0]?.message ?? apiErr?.error ?? 'Gagal menyimpan data')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={44} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Data Tersimpan</h2>
        <p className="text-gray-500 text-base mt-2 text-center">
          Warga baru berhasil ditambahkan.<br />Kembali ke daftar...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-5 pt-12 pb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">Tambah Warga Baru</h1>
          <p className="text-blue-200 text-sm">Data awal untuk validasi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">

        {error && (
          <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-base">
            {error}
          </div>
        )}

        {/* 1. Nama Lengkap */}
        <Field label="Nama Lengkap" required>
          <input
            value={form.namaLengkap}
            onChange={(e) => set('namaLengkap', e.target.value)}
            placeholder="Sesuai KTP"
            className={inputCls}
          />
        </Field>

        {/* 2. Jenis Kelamin */}
        <Field label="Jenis Kelamin" required>
          <div className="flex gap-3">
            {[{ v: 'L', label: '♂  Laki-laki' }, { v: 'P', label: '♀  Perempuan' }].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => set('jenisKelamin', v)}
                className={cn(
                  'flex-1 h-14 rounded-2xl text-base font-semibold border-2 transition',
                  form.jenisKelamin === v
                    ? v === 'L'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-pink-500 border-pink-500 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-500',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* 3. Status dalam Keluarga */}
        <Field label="Status dalam Keluarga" required>
          <select
            value={form.statusKeluarga}
            onChange={(e) => set('statusKeluarga', e.target.value)}
            className={selectCls}
          >
            {STATUS_KELUARGA.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        {/* 4. Kelompok */}
        <Field label="Kelompok" required>
          {isPenatua && selectedKelompok ? (
            /* Penatua: kelompok auto dari akun, tidak bisa diubah */
            <div className="h-14 px-4 flex items-center rounded-2xl bg-blue-50 border border-blue-100">
              <div className="flex-1">
                <p className="text-base font-semibold text-[#1e3a5f]">
                  [{selectedKelompok.kode}] {selectedKelompok.nama}
                </p>
              </div>
              <MapPin size={16} className="text-blue-400 shrink-0" />
            </div>
          ) : (
            <select
              value={form.kelompokId ?? ''}
              onChange={(e) => set('kelompokId', e.target.value ? Number(e.target.value) : null)}
              className={selectCls}
            >
              <option value="">— Pilih Kelompok —</option>
              {wilayahList.map((w) => (
                <optgroup key={w.id} label={w.nama}>
                  {w.kelompoks.map((k: any) => (
                    <option key={k.id} value={k.id}>[{k.kode}] {k.nama}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}

          {/* Info penatua setelah kelompok dipilih */}
          {selectedKelompok && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
              <span className="text-sm text-gray-500 shrink-0">Penatua:</span>
              <span className="text-sm font-medium text-gray-700">
                {selectedKelompok.penatua_nama_temp ?? (
                  <span className="text-gray-400 italic">Belum ada pengganti</span>
                )}
              </span>
            </div>
          )}
        </Field>

        {/* 5. Status Keanggotaan */}
        <Field label="Status Keanggotaan" required>
          <select
            value={form.statusKeanggotaan}
            onChange={(e) => set('statusKeanggotaan', e.target.value)}
            className={selectCls}
          >
            {STATUS_KEANGGOTAAN.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-sm text-gray-400 pl-1">
            Default Non Aktif — akan divalidasi oleh staf kantor
          </p>
        </Field>

        {/* 6. WhatsApp */}
        <Field label="Nomor WhatsApp">
          <input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
            placeholder="08xx-xxxx-xxxx"
            inputMode="tel"
            className={inputCls}
          />
        </Field>

        {/* Tombol Simpan */}
        <div className="pt-2 pb-4">
          <button
            type="submit"
            disabled={create.isPending}
            className="w-full h-16 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-gray-200 disabled:text-gray-400 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            {create.isPending && <Loader2 size={20} className="animate-spin" />}
            {create.isPending ? 'Menyimpan...' : 'Simpan Data Warga'}
          </button>
        </div>
      </form>
    </div>
  )
}
