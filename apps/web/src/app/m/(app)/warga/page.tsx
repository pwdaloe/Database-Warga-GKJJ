'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Loader2, Users, ChevronRight } from 'lucide-react'
import { useWargaList } from '@/hooks/useWarga'
import { differenceInYears } from 'date-fns'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  AKTIF:         'bg-green-100 text-green-700',
  NON_AKTIF:     'bg-gray-100 text-gray-500',
  KATEKUMEN:     'bg-blue-100 text-blue-700',
  PINDAH_KELUAR: 'bg-orange-100 text-orange-700',
  MENINGGAL:     'bg-red-100 text-red-600',
}
const STATUS_LABEL: Record<string, string> = {
  AKTIF: 'Aktif', NON_AKTIF: 'Non Aktif', KATEKUMEN: 'Katekumen',
  PINDAH_KELUAR: 'Pindah', MENINGGAL: 'Meninggal',
}

export default function MobileWargaPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')

  const { data, isLoading } = useWargaList({ limit: 100, search: search || undefined })
  const wargaList = data?.data ?? []
  const total     = data?.meta?.total ?? 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <img src="/logo-gkj.jpg" alt="GKJ" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
          <h1 className="text-white text-xl font-bold">Data Warga</h1>
        </div>
        <p className="text-blue-200 text-sm mb-4">
          {isLoading ? 'Memuat...' : `${total} jemaat`}
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                if (!e.target.value) setSearch('')
              }}
              placeholder="Cari nama, nomor anggota..."
              className="w-full h-12 pl-10 pr-4 text-base rounded-2xl bg-white border-0 outline-none shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="h-12 px-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-medium text-sm transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-base">Memuat data warga...</p>
          </div>
        ) : wargaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-base font-medium">Tidak ada data warga</p>
            <p className="text-sm mt-1 text-gray-300">
              {search ? 'Coba kata kunci lain' : 'Tambahkan warga baru'}
            </p>
          </div>
        ) : (
          wargaList.map((w: any) => {
            const usia    = w.tanggalLahir ? differenceInYears(new Date(), new Date(w.tanggalLahir)) : null
            const avatarBg = w.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'
            return (
              <button
                key={w.id}
                onClick={() => router.push(`/m/warga/${w.id}`)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 text-left hover:shadow-md active:scale-[0.98] transition-all"
              >
                {/* Avatar */}
                {w.fotoUrl ? (
                  <img
                    src={w.fotoUrl}
                    alt={w.namaLengkap}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                  />
                ) : (
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0', avatarBg)}>
                    {w.namaLengkap.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-semibold text-gray-900 truncate leading-tight">
                    {w.namaLengkap}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {w.keluarga?.kelompok?.nama ?? '—'}
                    {usia !== null && ` · ${usia} thn`}
                  </p>
                  <span className={cn(
                    'inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                    STATUS_COLOR[w.statusKeanggotaan] ?? 'bg-gray-100 text-gray-500',
                  )}>
                    {STATUS_LABEL[w.statusKeanggotaan] ?? w.statusKeanggotaan}
                  </span>
                </div>

                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              </button>
            )
          })
        )}
      </div>

      {/* FAB Tambah Warga */}
      <button
        onClick={() => router.push('/m/warga/baru')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1e3a5f] hover:bg-[#16304f] text-white rounded-full shadow-lg flex items-center justify-center transition active:scale-95 z-40"
        aria-label="Tambah warga baru"
      >
        <Plus size={26} />
      </button>
    </div>
  )
}
