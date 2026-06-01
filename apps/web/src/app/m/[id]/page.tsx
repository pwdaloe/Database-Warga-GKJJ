'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

const STATUS_LABEL: Record<string, string> = {
  AKTIF: 'Aktif', NON_AKTIF: 'Non Aktif', KATEKUMEN: 'Katekumen',
  PINDAH_KELUAR: 'Pindah Keluar', MENINGGAL: 'Meninggal',
}
const STATUS_KK_LABEL: Record<string, string> = {
  KEPALA: 'Kepala KK', ISTRI: 'Istri', ANAK: 'Anak',
  MENANTU: 'Menantu', CUCU: 'Cucu', LAINNYA: 'Lainnya',
}

export default function PublicMemberPage() {
  const { id } = useParams<{ id: string }>()
  const [warga, setWarga] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/public/member/${id}`)
      .then((r) => setWarga(r.data.data))
      .catch((e) => setError(e?.response?.data?.error ?? 'Anggota tidak ditemukan'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d5a9e] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white/60" />
      </div>
    )
  }

  if (error || !warga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d5a9e] flex items-center justify-center p-6">
        <div className="text-center text-white">
          <XCircle size={48} className="mx-auto mb-4 opacity-60" />
          <p className="text-lg font-semibold">Anggota Tidak Ditemukan</p>
          <p className="text-white/60 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const kelompok  = warga.keluarga?.kelompok
  const wilayah   = kelompok?.wilayah
  const penatua   = kelompok?.penatua_nama_temp
  const nomorTampil = warga.nomorInduk || warga.nomorAnggota || '—'
  const avatarBg  = warga.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'
  const isAktif   = warga.statusKeanggotaan === 'AKTIF'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d5a9e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Kartu */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-[#1e3a5f] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo-gkj.jpg" alt="GKJ" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Jemaat GKJJ</p>
              <p className="text-blue-200 text-[11px]">Gereja Kristen Jawa Jakarta</p>
            </div>
            <div className="ml-auto">
              <span className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-full',
                isAktif ? 'bg-green-400/20 text-green-300 border border-green-400/30'
                        : 'bg-red-400/20 text-red-300 border border-red-400/30',
              )}>
                {STATUS_LABEL[warga.statusKeanggotaan] ?? warga.statusKeanggotaan}
              </span>
            </div>
          </div>

          {/* Profil */}
          <div className="px-5 py-5 flex gap-4 items-start">
            {warga.fotoUrl ? (
              <img src={warga.fotoUrl} alt={warga.namaLengkap}
                className="w-20 h-24 rounded-2xl object-cover shrink-0 shadow-sm border border-gray-100" />
            ) : (
              <div className={cn('w-20 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-sm', avatarBg)}>
                {warga.namaLengkap.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 text-lg leading-tight">{warga.namaLengkap}</h1>
              {warga.namaPanggilan && (
                <p className="text-sm text-gray-400 italic">"{warga.namaPanggilan}"</p>
              )}
              <p className="text-sm font-mono font-semibold text-[#1e3a5f] mt-1.5 bg-blue-50 px-2 py-0.5 rounded-lg inline-block">
                {nomorTampil}
              </p>

              <div className="mt-3 space-y-1">
                {kelompok && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-medium mt-0.5 w-14 shrink-0">Kelompok</span>
                    <span className="text-xs text-gray-700 font-medium">{kelompok.nama}</span>
                  </div>
                )}
                {wilayah && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-medium mt-0.5 w-14 shrink-0">Wilayah</span>
                    <span className="text-xs text-gray-600">{wilayah.nama}</span>
                  </div>
                )}
                {penatua && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-medium mt-0.5 w-14 shrink-0">Penatua</span>
                    <span className="text-xs text-gray-600">{penatua}</span>
                  </div>
                )}
                <div className="flex items-start gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-medium mt-0.5 w-14 shrink-0">Status KK</span>
                  <span className="text-xs text-gray-600">{STATUS_KK_LABEL[warga.statusKeluarga] ?? warga.statusKeluarga}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sakramen */}
          <div className="mx-5 mb-5 grid grid-cols-2 gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
              warga.sudahBaptis ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400',
            )}>
              {warga.sudahBaptis
                ? <CheckCircle2 size={15} className="text-blue-500" />
                : <XCircle size={15} className="text-gray-300" />}
              Baptis
            </div>
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
              warga.sudahSidi ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400',
            )}>
              {warga.sudahSidi
                ? <CheckCircle2 size={15} className="text-purple-500" />
                : <XCircle size={15} className="text-gray-300" />}
              Sidi
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Kartu Digital Anggota Jemaat</p>
            <p className="text-[10px] text-gray-300">GKJJ v1.0</p>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-5">
          © {new Date().getFullYear()} Gereja Kristen Jawa Jakarta
        </p>
      </div>
    </div>
  )
}
