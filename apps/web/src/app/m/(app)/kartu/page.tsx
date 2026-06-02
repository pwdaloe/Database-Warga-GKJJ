'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
import { useWargaList } from '@/hooks/useWarga'
import { cn } from '@/lib/utils'

export default function MobileKartuPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')

  const { data, isLoading, isFetching } = useWargaList({
    limit: 20,
    search: search || undefined,
  })
  const wargaList = data?.data ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim().length >= 2) setSearch(searchInput.trim())
  }

  return (
    <div className="min-h-full bg-gray-50">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo-gkj.jpg" alt="GKJ" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
          <div>
            <h1 className="text-white text-xl font-bold">Kartu Anggota</h1>
            <p className="text-blue-200 text-sm">Cari jemaat untuk tampilkan kartu</p>
          </div>
        </div>

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
              placeholder="Ketik nama atau nomor anggota..."
              autoFocus
              className="w-full h-12 pl-10 pr-4 text-base rounded-2xl bg-white border-0 outline-none shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searchInput.trim().length < 2}
            className="h-12 px-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-2xl font-medium text-sm transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Hasil pencarian */}
      <div className="px-4 py-4">
        {!search ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <CreditCard size={56} className="mb-4 opacity-40" />
            <p className="text-base font-medium text-gray-400 text-center">
              Ketik minimal 2 huruf<br />untuk mencari jemaat
            </p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-base">Mencari...</p>
          </div>
        ) : wargaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-base font-medium">Tidak ditemukan</p>
            <p className="text-sm mt-1 text-gray-300">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 font-medium px-1">
              {wargaList.length} hasil ditemukan
            </p>
            {wargaList.map((w: any) => {
              const avatarBg = w.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'
              return (
                <button
                  key={w.id}
                  onClick={() => router.push(`/m/${w.id}`)}
                  className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 text-left hover:shadow-md active:scale-[0.98] transition-all"
                >
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
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-semibold text-gray-900 truncate">{w.namaLengkap}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {w.nomorInduk || w.nomorAnggota || '—'}
                    </p>
                    <p className="text-sm text-gray-400 truncate mt-0.5">
                      {w.keluarga?.kelompok?.nama ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <CreditCard size={18} className="text-[#1e3a5f]" />
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
