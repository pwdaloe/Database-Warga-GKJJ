'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { api } from '@/lib/api'

export interface WargaPilihan {
  id: number
  namaLengkap: string
  whatsapp: string | null
  email: string | null
  nomorAnggota?: string | null
}

/** Cari warga untuk ditautkan ke akun pengguna; warga yang sudah punya akun tidak bisa dipilih. */
export function WargaPicker({
  selected, usedWargaIds, onSelect, onClear,
}: {
  selected: { id: number; namaLengkap: string } | null
  usedWargaIds: Set<number>
  onSelect: (w: WargaPilihan) => void
  onClear: () => void
}) {
  const [q, setQ] = useState('')
  const term = q.trim()
  const { data = [], isFetching } = useQuery({
    queryKey: ['warga-picker', term],
    enabled: term.length >= 2,
    queryFn: async () => (await api.get('/warga', { params: { search: term, limit: 8 } })).data.data as WargaPilihan[],
  })

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-brand-200 bg-brand-50 text-sm">
        <span className="min-w-0 truncate">Tertaut ke warga: <strong>{selected.namaLengkap}</strong></span>
        <button type="button" onClick={onClear} aria-label="Lepas tautan warga"
          className="p-1 rounded hover:bg-brand-100 text-gray-500"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
        placeholder="Cari nama warga untuk mengisi data otomatis…"
        aria-label="Cari warga"
        className="w-full pl-9 pr-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />
      {term.length >= 2 && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border rounded-lg shadow-lg">
          {isFetching && <li className="px-3 py-2 text-xs text-gray-400">Mencari…</li>}
          {!isFetching && data.length === 0 && <li className="px-3 py-2 text-xs text-gray-400">Tidak ada warga yang cocok</li>}
          {data.map((w) => {
            const dipakai = usedWargaIds.has(w.id)
            return (
              <li key={w.id}>
                <button
                  type="button" disabled={dipakai}
                  onClick={() => { onSelect(w); setQ('') }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium">{w.namaLengkap}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {w.whatsapp ?? 'tanpa WA'}{dipakai ? ' · sudah punya akun' : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
