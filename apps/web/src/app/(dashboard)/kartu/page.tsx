'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, CreditCard, MessageCircle, UserPlus,
  X, Loader2, Users, Crown,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useWargaList } from '@/hooks/useWarga'
import { cn, nomorWarga } from '@/lib/utils'
import { STATUS_KEANGGOTAAN_LABEL, kirimWhatsApp } from '@/lib/kartuWhatsapp'
import { STATUS_KEANGGOTAAN_SOFT } from '@/lib/statusKeanggotaan'
import { buildIdCardHtml, avatarInitial, formatTanggal, STATUS_KK_LABEL } from '@/lib/kartuCetak'
import { tautanKartu } from '@/lib/kartuUrl'

// ── Helpers ──────────────────────────────────────────────────

async function cetakIdCard(warga: any) {
  const origin = window.location.origin
  const html = await buildIdCardHtml(warga, origin)
  const win = window.open('', '_blank', 'width=500,height=420')
  if (!win) { alert('Aktifkan popup untuk mencetak kartu.'); return }
  win.document.write(html)
  win.document.close()
}

// ── ID Card preview (on-screen) ──────────────────────────────

function IdCardPreview({ warga }: { warga: any }) {
  const kelompok = warga.keluarga?.kelompok
  const wilayah = kelompok?.wilayah
  const penatua = kelompok?.penatua_nama_temp ?? null
  const validasiDate = (warga.dataStatus === 'AKTIF' || warga.dataStatus === 'VALIDASI') && warga.updatedAt
    ? formatTanggal(warga.updatedAt) : null
  const nomorTampil = warga.nomorInduk || warga.nomorAnggota || '—'
  const statusColor = STATUS_KEANGGOTAAN_SOFT
  const avatarBg = warga.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'

  // QR code state
  const [qrUrl, setQrUrl] = useState('')
  useEffect(() => {
    const url = tautanKartu(window.location.origin, warga)
    if (!url) { setQrUrl(''); return }
    QRCode.toDataURL(url, { width: 80, margin: 0, color: { dark: '#1e3a5f', light: '#ffffff' } })
      .then(setQrUrl)
  }, [warga?.qrToken])

  return (
    <div className="w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-200 select-none">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/logo-gkj.jpg" alt="GKJ" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold tracking-wide">Jemaat GKJJ</p>
          <p className="text-[10px] opacity-70">Gereja Kristen Jawa Jakarta</p>
        </div>
        <span className="text-[10px] opacity-60 text-right leading-tight">Kartu<br/>Anggota</span>
      </div>

      {/* Body */}
      <div className="bg-white px-3 py-3 flex gap-3 items-start">
        {/* Avatar / Foto */}
        {warga.fotoUrl ? (
          <img src={warga.fotoUrl} alt={warga.namaLengkap}
            className="w-14 h-16 rounded-lg object-cover shrink-0 border border-gray-100" />
        ) : (
          <div className={cn('w-14 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shrink-0', avatarBg)}>
            {avatarInitial(warga.namaLengkap)}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight break-words">{warga.namaLengkap}</p>
          {warga.namaPanggilan && (
            <p className="text-xs text-gray-400 italic">"{warga.namaPanggilan}"</p>
          )}
          <p className="text-xs font-mono font-semibold text-indigo-600 mt-0.5">{nomorTampil}</p>
          <div className="mt-1.5 space-y-0.5">
            {[
              { label: 'Kelompok', value: kelompok?.nama },
              { label: 'Wilayah',  value: wilayah?.nama },
              { label: 'Penatua',  value: penatua },
            ].map(({ label, value }) => value ? (
              <p key={label} className="text-xs text-gray-600">
                <span className="text-gray-400 w-16 inline-block">{label}</span>{value}
              </p>
            ) : null)}
            <p className="text-xs">
              <span className="text-gray-400 w-16 inline-block">Status</span>
              <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-semibold', statusColor[warga.statusKeanggotaan] ?? 'text-gray-500 bg-gray-100')}>
                {STATUS_KEANGGOTAAN_LABEL[warga.statusKeanggotaan] ?? warga.statusKeanggotaan}
              </span>
            </p>
            {validasiDate && (
              <p className="text-xs text-gray-600">
                <span className="text-gray-400 w-16 inline-block">Validasi</span>{validasiDate}
              </p>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          {qrUrl ? (
            <img src={qrUrl} alt="QR" className="w-16 h-16 rounded" />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded animate-pulse" />
          )}
          <span className="text-[9px] text-gray-400 text-center leading-tight">Scan kartu<br/>digital</span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex items-center gap-2.5">
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', warga.sudahBaptis ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400')}>
          ✓ Baptis
        </span>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', warga.sudahSidi ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400')}>
          ✓ Sidi
        </span>
        <span className="ml-auto text-[10px] text-gray-400">{STATUS_KK_LABEL[warga.statusKeluarga] ?? ''}</span>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────

export default function KartuPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce 300 ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, isFetching } = useWargaList({
    search: debounced || undefined,
    limit: 8,
    page: 1,
  })

  const results: any[] = debounced.length >= 2 ? (data?.data ?? []) : []

  function selectWarga(w: any) {
    setSelected(w)
    setDropdownOpen(false)
    setQuery(w.namaLengkap)
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    setDebounced('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kartu Anggota</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cari anggota jemaat untuk cetak kartu atau kirim info via WhatsApp
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setDropdownOpen(true)
              if (e.target.value !== selected?.namaLengkap) setSelected(null)
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Ketik nama anggota jemaat..."
            className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-300 text-base sm:text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 bg-white"
          />
          {query && (
            <button onClick={clearSelection} aria-label="Hapus pencarian" className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown hasil */}
        {dropdownOpen && debounced.length >= 2 && !selected && (
          <div className="absolute z-10 w-full mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {isFetching ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Mencari...
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 italic">
                Tidak ada anggota ditemukan untuk "{debounced}"
              </div>
            ) : (
              <ul>
                {results.map((w) => {
                  const kelompok = w.keluarga?.kelompok
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onMouseDown={() => selectWarga(w)}
                        className="w-full flex items-center gap-3 px-4 py-3 min-h-11 hover:bg-gray-50 transition text-left"
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0',
                          w.jenisKelamin === 'L' ? 'bg-blue-400' : 'bg-pink-400',
                        )}>
                          {avatarInitial(w.namaLengkap)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 break-words">
                            {w.namaLengkap}
                            {w.statusKeluarga === 'KEPALA' && <Crown size={11} className="text-yellow-500" />}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {nomorWarga(w) ?? '—'}
                            {kelompok ? ` · ${kelompok.nama}` : ''}
                          </p>
                        </div>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                          w.statusKeanggotaan === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                        )}>
                          {STATUS_KEANGGOTAAN_LABEL[w.statusKeanggotaan] ?? w.statusKeanggotaan}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Tambah warga baru */}
            <div className="border-t border-gray-100">
              <button
                type="button"
                onMouseDown={() => { router.push('/warga'); setDropdownOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-11 text-sm text-brand-600 hover:bg-brand-50 transition"
              >
                <UserPlus size={15} />
                Tambah warga baru di Data Warga
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint awal */}
      {!selected && debounced.length < 2 && (
        <div className="text-center py-10 sm:py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Cari nama anggota</p>
          <p className="text-sm mt-1">Ketik minimal 2 huruf untuk mulai mencari</p>
          <button
            onClick={() => router.push('/warga')}
            className="mt-5 flex items-center gap-2 mx-auto px-4 py-3 sm:py-2 text-sm text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition"
          >
            <UserPlus size={15} />
            Tambah Warga Baru
          </button>
        </div>
      )}

      {/* Kartu & aksi */}
      {selected && (
        <div className="space-y-5 sm:space-y-6">
          <IdCardPreview warga={selected} />

          {/* Aksi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => { cetakIdCard(selected) }}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-11 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
            >
              <CreditCard size={16} />
              Cetak ID Card
            </button>
            <button
              onClick={() => kirimWhatsApp(selected)}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-11 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
            >
              <MessageCircle size={16} />
              Kirim via WhatsApp
            </button>
            <button
              onClick={() => router.push(`/warga/${selected.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-11 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition shadow-sm"
            >
              <UserPlus size={16} />
              Buka Data Warga
            </button>
          </div>

          {/* Info WA jika tidak ada nomor */}
          {!selected.whatsapp && !selected.telepon && (
            <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              Nomor WhatsApp belum terdaftar — lengkapi di Data Warga agar bisa dikirim via WhatsApp.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
