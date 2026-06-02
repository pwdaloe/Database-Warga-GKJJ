'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useWargaMutations } from '@/hooks/useWarga'
import { useKeluargaList } from '@/hooks/useKeluarga'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const STATUS_KELUARGA = [
  { value: 'KEPALA',   label: 'Kepala KK' },
  { value: 'ISTRI',    label: 'Istri' },
  { value: 'ANAK',     label: 'Anak' },
  { value: 'MENANTU',  label: 'Menantu' },
  { value: 'CUCU',     label: 'Cucu' },
  { value: 'LAINNYA',  label: 'Lainnya' },
]
const STATUS_KEANGGOTAAN = [
  { value: 'AKTIF',         label: 'Aktif' },
  { value: 'NON_AKTIF',     label: 'Non Aktif' },
  { value: 'KATEKUMEN',     label: 'Katekumen' },
  { value: 'PINDAH_KELUAR', label: 'Pindah Keluar' },
  { value: 'MENINGGAL',     label: 'Meninggal' },
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-base font-semibold text-gray-700 mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"
const selectCls = inputCls + " appearance-none"

export default function MobileWargaBaru() {
  const router = useRouter()
  const { user } = useAuth()
  const { create } = useWargaMutations()

  const [form, setForm] = useState({
    namaLengkap:       '',
    jenisKelamin:      '' as 'L' | 'P' | '',
    tanggalLahir:      '',
    statusKeluarga:    'KEPALA',
    statusKeanggotaan: 'AKTIF',
    whatsapp:          '',
    sudahBaptis:       false,
    sudahSidi:         false,
    alamatDomisili:    '',
    keluargaId:        null as number | null,
  })

  const [keluargaSearch, setKeluargaSearch] = useState('')
  const { data: keluargaData } = useKeluargaList({
    limit: 20,
    search: keluargaSearch.trim() || undefined,
  })
  const keluargaList = keluargaData?.data ?? []

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const isNewKepala = form.statusKeluarga === 'KEPALA'

  function set(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaLengkap.trim() || !form.jenisKelamin) {
      setError('Nama dan jenis kelamin wajib diisi')
      return
    }
    if (!isNewKepala && !form.keluargaId) {
      setError('Pilih keluarga yang dituju')
      return
    }
    setError('')

    const payload: any = {
      namaLengkap:       form.namaLengkap.trim(),
      jenisKelamin:      form.jenisKelamin,
      tanggalLahir:      form.tanggalLahir || null,
      statusKeluarga:    form.statusKeluarga,
      statusKeanggotaan: form.statusKeanggotaan,
      whatsapp:          form.whatsapp.trim() || null,
      sudahBaptis:       form.sudahBaptis,
      sudahSidi:         form.sudahSidi,
      alamatDomisili:    form.alamatDomisili.trim() || null,
      dataStatus:        'DRAFT',
      keluargaId:        form.keluargaId,
      ...(isNewKepala && user?.kelompokId ? {
        newKeluarga: { kelompokId: user.kelompokId },
      } : {}),
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
        <p className="text-gray-500 text-base mt-2">Kembali ke daftar warga...</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-5 pt-12 pb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">Tambah Warga Baru</h1>
          <p className="text-blue-200 text-sm">Isi data yang diperlukan</p>
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
            {[{ v: 'L', label: '♂ Laki-laki' }, { v: 'P', label: '♀ Perempuan' }].map(({ v, label }) => (
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

        {/* 3. Tanggal Lahir */}
        <Field label="Tanggal Lahir">
          <input
            type="date"
            value={form.tanggalLahir}
            onChange={(e) => set('tanggalLahir', e.target.value)}
            className={inputCls}
            max={new Date().toISOString().split('T')[0]}
          />
        </Field>

        {/* 4. Status dalam Keluarga */}
        <Field label="Status dalam Keluarga" required>
          <select
            value={form.statusKeluarga}
            onChange={(e) => { set('statusKeluarga', e.target.value); set('keluargaId', null); setKeluargaSearch('') }}
            className={selectCls}
          >
            {STATUS_KELUARGA.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        {/* 5. Keluarga / Kelompok */}
        {isNewKepala ? (
          <div className="px-4 py-3.5 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-blue-800 text-sm font-medium">
              Kartu Keluarga baru akan dibuat otomatis untuk kelompok Anda.
            </p>
          </div>
        ) : (
          <Field label="Pilih Keluarga" required>
            <input
              value={keluargaSearch}
              onChange={(e) => { setKeluargaSearch(e.target.value); set('keluargaId', null) }}
              placeholder="Ketik nama kepala keluarga..."
              className={inputCls}
            />
            {keluargaSearch.trim() && !form.keluargaId && keluargaList.length > 0 && (
              <div className="mt-2 rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">
                {keluargaList.map((k: any) => {
                  const kepala = k.kepalaKeluarga?.namaLengkap ?? '(Belum ada kepala)'
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => { set('keluargaId', k.id); setKeluargaSearch(kepala) }}
                      className="w-full px-4 py-3.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-base font-medium text-gray-900">{kepala}</p>
                      <p className="text-sm text-gray-400">{k.nomorKeluarga} · {k.kelompok?.nama}</p>
                    </button>
                  )
                })}
              </div>
            )}
            {form.keluargaId && (
              <p className="mt-2 text-sm text-green-600 font-medium pl-1">✓ Keluarga dipilih</p>
            )}
          </Field>
        )}

        {/* 6. Status Keanggotaan */}
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
        </Field>

        {/* 7. WhatsApp */}
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

        {/* 8 & 9. Sakramen */}
        <div>
          <label className="block text-base font-semibold text-gray-700 mb-3">Sakramen</label>
          <div className="flex gap-3">
            {[
              { key: 'sudahBaptis', label: 'Sudah Baptis', color: 'blue' },
              { key: 'sudahSidi',   label: 'Sudah Sidi',   color: 'purple' },
            ].map(({ key, label, color }) => {
              const active = form[key as keyof typeof form] as boolean
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(key, !active)}
                  className={cn(
                    'flex-1 h-14 rounded-2xl border-2 text-base font-semibold flex items-center justify-center gap-2 transition',
                    active
                      ? color === 'blue'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-purple-500 border-purple-500 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-500',
                  )}
                >
                  {active && '✓ '}
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 10. Alamat Domisili */}
        <Field label="Alamat Domisili">
          <textarea
            value={form.alamatDomisili}
            onChange={(e) => set('alamatDomisili', e.target.value)}
            placeholder="Jl. nama jalan, RT/RW, kelurahan"
            rows={3}
            className="w-full px-4 py-3.5 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition resize-none"
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
