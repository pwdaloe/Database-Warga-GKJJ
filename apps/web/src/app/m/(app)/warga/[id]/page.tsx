'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Pencil, CheckCircle2, X, MessageCircle } from 'lucide-react'
import { useWargaDetail, useWargaMutations } from '@/hooks/useWarga'
import { differenceInYears, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { kirimWhatsApp } from '@/lib/kartuWhatsapp'

const STATUS_LABEL: Record<string, string> = {
  AKTIF: 'Aktif', NON_AKTIF: 'Non Aktif', KATEKUMEN: 'Katekumen',
  PINDAH_KELUAR: 'Pindah Keluar', MENINGGAL: 'Meninggal',
}
const STATUS_KK: Record<string, string> = {
  KEPALA: 'Kepala KK', ISTRI: 'Istri', ANAK: 'Anak',
  MENANTU: 'Menantu', CUCU: 'Cucu', LAINNYA: 'Lainnya',
}
const STATUS_KEANGGOTAAN_OPT = [
  { value: 'AKTIF', label: 'Aktif' }, { value: 'NON_AKTIF', label: 'Non Aktif' },
  { value: 'KATEKUMEN', label: 'Katekumen' }, { value: 'PINDAH_KELUAR', label: 'Pindah Keluar' },
  { value: 'MENINGGAL', label: 'Meninggal' },
]

const inputCls = "w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"

export default function MobileWargaDetail() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const { data: warga, isLoading } = useWargaDetail(Number(id))
  const { update } = useWargaMutations()

  const [editMode, setEditMode] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState<any>({})

  useEffect(() => {
    if (warga) {
      setForm({
        namaLengkap:       warga.namaLengkap,
        whatsapp:          warga.whatsapp ?? '',
        tanggalLahir:      warga.tanggalLahir ? warga.tanggalLahir.split('T')[0] : '',
        statusKeanggotaan: warga.statusKeanggotaan,
        sudahBaptis:       warga.sudahBaptis,
        sudahSidi:         warga.sudahSidi,
        alamatDomisili:    warga.alamatDomisili ?? '',
      })
    }
  }, [warga])

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setError('')
    try {
      await update.mutateAsync({
        id: Number(id),
        data: {
          ...form,
          whatsapp:       form.whatsapp.trim() || null,
          tanggalLahir:   form.tanggalLahir || null,
          alamatDomisili: form.alamatDomisili.trim() || null,
        },
      })
      setSaved(true)
      setEditMode(false)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white/60" />
      </div>
    )
  }

  if (!warga) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <X size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500 text-lg">Data tidak ditemukan</p>
        <button onClick={() => router.back()} className="mt-4 text-[#1e3a5f] font-medium text-base underline">
          Kembali
        </button>
      </div>
    )
  }

  const usia       = warga.tanggalLahir ? differenceInYears(new Date(), new Date(warga.tanggalLahir)) : null
  const avatarBg   = warga.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'
  const kelompok   = warga.keluarga?.kelompok

  return (
    <div className="min-h-full bg-gray-50">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            disabled={update.isPending}
            className="flex items-center gap-2 h-10 px-4 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition"
          >
            {update.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : editMode ? (
              <CheckCircle2 size={16} />
            ) : (
              <Pencil size={16} />
            )}
            {update.isPending ? 'Menyimpan...' : editMode ? 'Simpan' : 'Edit'}
          </button>
        </div>

        {/* Profil */}
        <div className="flex items-center gap-4">
          {warga.fotoUrl ? (
            <img src={warga.fotoUrl} alt={warga.namaLengkap}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shrink-0" />
          ) : (
            <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0', avatarBg)}>
              {warga.namaLengkap.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-white text-xl font-bold leading-tight">{warga.namaLengkap}</h1>
            {(warga.nomorInduk || warga.nomorAnggota) && (
              <p className="text-blue-200 text-sm font-mono mt-0.5">
                {warga.nomorInduk ?? warga.nomorAnggota}
              </p>
            )}
            <p className="text-blue-200 text-sm mt-1">
              {STATUS_KK[warga.statusKeluarga]} · {usia !== null ? `${usia} tahun` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Kirim Kartu via WhatsApp */}
      {!editMode && (
        <div className="px-5 mt-4">
          <button
            onClick={() => kirimWhatsApp(warga)}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <MessageCircle size={18} />
            Kirim Kartu via WhatsApp
          </button>
        </div>
      )}

      {/* Notifikasi */}
      {saved && (
        <div className="mx-5 mt-4 px-4 py-3 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-2 text-green-700 text-base">
          <CheckCircle2 size={18} /> Data berhasil disimpan
        </div>
      )}
      {error && (
        <div className="mx-5 mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-base">
          {error}
        </div>
      )}

      <div className="px-5 py-5 space-y-5">

        {/* Info tidak bisa diedit */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Informasi Tetap</p>
          {[
            ['Kelompok', kelompok?.nama ?? '—'],
            ['Wilayah', kelompok?.wilayah?.nama ?? '—'],
            ['Jenis Kelamin', warga.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
              <span className="text-base text-gray-500">{label}</span>
              <span className="text-base font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Field yang bisa diedit */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Data yang Dapat Diperbarui</p>

          {/* Status Keanggotaan */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Status Keanggotaan</label>
            {editMode ? (
              <select
                value={form.statusKeanggotaan}
                onChange={(e) => set('statusKeanggotaan', e.target.value)}
                className={inputCls + ' appearance-none'}
              >
                {STATUS_KEANGGOTAAN_OPT.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <p className="text-base text-gray-800 font-medium h-14 flex items-center px-4 bg-gray-50 rounded-2xl">
                {STATUS_LABEL[warga.statusKeanggotaan]}
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Nomor WhatsApp</label>
            {editMode ? (
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                inputMode="tel"
                className={inputCls}
              />
            ) : (
              <p className="text-base text-gray-800 font-medium h-14 flex items-center px-4 bg-gray-50 rounded-2xl">
                {warga.whatsapp ?? <span className="text-gray-400 font-normal">Belum diisi</span>}
              </p>
            )}
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Tanggal Lahir</label>
            {editMode ? (
              <input
                type="date"
                value={form.tanggalLahir}
                onChange={(e) => set('tanggalLahir', e.target.value)}
                className={inputCls}
                max={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <p className="text-base text-gray-800 font-medium h-14 flex items-center px-4 bg-gray-50 rounded-2xl">
                {warga.tanggalLahir
                  ? format(new Date(warga.tanggalLahir), 'd MMMM yyyy', { locale: localeId })
                  : <span className="text-gray-400 font-normal">Belum diisi</span>}
              </p>
            )}
          </div>

          {/* Sakramen */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">Sakramen</label>
            <div className="flex gap-3">
              {[
                { key: 'sudahBaptis', label: 'Baptis',  color: 'blue'   },
                { key: 'sudahSidi',   label: 'Sidi',    color: 'purple' },
              ].map(({ key, label, color }) => {
                const active = editMode ? form[key] : warga[key]
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!editMode}
                    onClick={() => editMode && set(key, !form[key])}
                    className={cn(
                      'flex-1 h-14 rounded-2xl border-2 text-base font-semibold flex items-center justify-center gap-2 transition',
                      active
                        ? color === 'blue'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-purple-500 border-purple-500 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-400',
                      !editMode && 'cursor-default',
                    )}
                  >
                    {active ? '✓ ' : ''}{label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Alamat Domisili */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Alamat Domisili</label>
            {editMode ? (
              <textarea
                value={form.alamatDomisili}
                onChange={(e) => set('alamatDomisili', e.target.value)}
                placeholder="Jl. nama jalan, RT/RW, kelurahan"
                rows={3}
                className="w-full px-4 py-3.5 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition resize-none"
              />
            ) : (
              <p className="text-base text-gray-800 font-medium min-h-14 px-4 py-3.5 bg-gray-50 rounded-2xl leading-relaxed">
                {warga.alamatDomisili ?? <span className="text-gray-400 font-normal">Belum diisi</span>}
              </p>
            )}
          </div>
        </div>

        {/* Tombol simpan bawah (hanya saat edit) */}
        {editMode && (
          <div className="pb-2">
            <button
              onClick={handleSave}
              disabled={update.isPending}
              className="w-full h-16 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-gray-200 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {update.isPending && <Loader2 size={20} className="animate-spin" />}
              {update.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              onClick={() => { setEditMode(false); setError('') }}
              className="w-full h-14 mt-3 text-gray-500 text-base font-medium rounded-2xl border border-gray-200 hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
