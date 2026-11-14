'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Wrench } from 'lucide-react'
import { APP_VERSION, galatMemuatChunk, turunkanStatusBar, type StatusSistem } from '@/lib/appVersion'

/**
 * Bar di atas semua halaman (juga halaman masuk):
 *  - kuning "Pembaruan sedang berlangsung" selama deploy,
 *  - biru "Versi baru tersedia" + tombol Muat ulang setelah deploy.
 * Tidak memblokir: pengurus tetap bisa menyimpan pekerjaannya. Muat ulang pada formulir yang belum disimpan
 * memicu peringatan bawaan browser (lihat ProgramForm), jadi draf tidak hilang tanpa sepengetahuan pengguna.
 */
export function BarPembaruan({ versiBundle = APP_VERSION, jedaMs = 60_000 }: { versiBundle?: string; jedaMs?: number }) {
  const [status, setStatus] = useState<StatusSistem | null>(null)
  const [galatChunk, setGalatChunk] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Polling (juga saat tab kembali aktif). Gagal = "tidak tahu": tampilan tidak berubah.
  useEffect(() => {
    const dasar = process.env.NEXT_PUBLIC_API_URL
    if (!dasar) return
    let batal = false
    async function tarik() {
      try {
        const res = await fetch(`${dasar}/versi`, { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (!batal && json?.data) setStatus({ pemeliharaan: json.data.pemeliharaan, commit: json.data.commit })
      } catch {
        // jaringan putus / API sedang restart → abaikan
      }
    }
    void tarik()
    const timer = setInterval(() => void tarik(), jedaMs)
    const saatTampak = () => { if (document.visibilityState === 'visible') void tarik() }
    document.addEventListener('visibilitychange', saatTampak)
    return () => {
      batal = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', saatTampak)
    }
  }, [jedaMs])

  // Jaring pengaman: file JS lama sudah hilang setelah deploy → anggap ada versi baru
  useEffect(() => {
    const saatGalat = (e: ErrorEvent) => { if (galatMemuatChunk(e.error ?? e.message)) setGalatChunk(true) }
    const saatDitolak = (e: PromiseRejectionEvent) => { if (galatMemuatChunk(e.reason)) setGalatChunk(true) }
    window.addEventListener('error', saatGalat)
    window.addEventListener('unhandledrejection', saatDitolak)
    return () => {
      window.removeEventListener('error', saatGalat)
      window.removeEventListener('unhandledrejection', saatDitolak)
    }
  }, [])

  const bar = turunkanStatusBar(status, versiBundle, galatChunk)

  // Beri tahu elemen sticky lain (header) tinggi bar agar tidak tertutup
  useEffect(() => {
    const root = document.documentElement
    if (!bar || !ref.current) {
      root.style.setProperty('--banner-h', '0px')
      return
    }
    const el = ref.current
    const terapkan = () => root.style.setProperty('--banner-h', `${el.offsetHeight}px`)
    terapkan()
    window.addEventListener('resize', terapkan)
    return () => {
      window.removeEventListener('resize', terapkan)
      root.style.setProperty('--banner-h', '0px')
    }
  }, [bar])

  if (!bar) return null

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={`tanpa-cetak sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2 text-center text-sm font-medium text-white ${bar === 'pemeliharaan' ? 'bg-amber-600' : 'bg-marine-900'}`}
    >
      {bar === 'pemeliharaan' ? (
        <>
          <Wrench size={15} className="shrink-0" aria-hidden="true" />
          <span>Aplikasi sedang diperbarui. Simpan pekerjaan Anda; halaman bisa terputus sebentar. Setelah selesai, muat ulang halaman.</span>
        </>
      ) : (
        <>
          <span>Versi baru tersedia. Simpan pekerjaan Anda, lalu muat ulang halaman.</span>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-white/20 px-3 py-1.5 font-semibold hover:bg-white/30">
            <RefreshCw size={14} aria-hidden="true" />
            Muat ulang
          </button>
        </>
      )}
    </div>
  )
}
