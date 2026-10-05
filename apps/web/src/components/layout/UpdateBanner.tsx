'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  APP_VERSION, deriveBannerState, isChunkLoadError, type SystemStatus,
} from '@/lib/appVersion'

interface Props {
  /** Versi yang tertanam di bundle ini (default: dari env build). Bisa di-override untuk tes. */
  appVersion?: string
  /** Interval polling status; default 60 detik */
  intervalMs?: number
}

/**
 * Bar di atas halaman:
 *  - "Pembaruan sistem sedang berlangsung" selama deploy,
 *  - "Versi baru tersedia" + tombol Muat ulang bila versi di server lebih baru.
 * Non-blocking: pengguna tetap bisa menyelesaikan pekerjaannya.
 */
export function UpdateBanner({ appVersion = APP_VERSION, intervalMs = 60_000 }: Props) {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [chunkError, setChunkError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Polling status (juga saat tab kembali aktif). Gagal fetch = "tidak tahu", tampilan tidak berubah.
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`${base}/system/status`, { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && json?.data) setStatus(json.data as SystemStatus)
      } catch {
        // jaringan putus / API sedang restart → abaikan
      }
    }

    poll()
    const timer = setInterval(poll, intervalMs)
    const onVisible = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  // Jaring pengaman: file JS lama sudah tidak ada setelah deploy → anggap ada versi baru
  useEffect(() => {
    const onError = (e: ErrorEvent) => { if (isChunkLoadError(e.error ?? e.message)) setChunkError(true) }
    const onRejection = (e: PromiseRejectionEvent) => { if (isChunkLoadError(e.reason)) setChunkError(true) }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  const state = deriveBannerState(status, appVersion, chunkError)

  // Beri tahu elemen sticky lain (mis. header mobile) tinggi bar agar tidak tertutup
  useEffect(() => {
    const root = document.documentElement
    if (!state || !ref.current) {
      root.style.setProperty('--banner-h', '0px')
      return
    }
    const el = ref.current
    const apply = () => root.style.setProperty('--banner-h', `${el.offsetHeight}px`)
    apply()
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
      root.style.setProperty('--banner-h', '0px')
    }
  }, [state])

  if (!state) return null

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        'sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2 text-sm font-medium text-center',
        state === 'maintenance' ? 'bg-amber-500 text-white' : 'bg-brand-700 text-white',
      )}
    >
      {state === 'maintenance' ? (
        <>
          <Wrench size={15} className="shrink-0" aria-hidden="true" />
          <span>Pembaruan sistem sedang berlangsung. Simpan pekerjaan Anda; halaman mungkin terputus sebentar.</span>
        </>
      ) : (
        <>
          <span>Versi baru tersedia.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 min-h-8 font-semibold"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Muat ulang
          </button>
        </>
      )}
    </div>
  )
}
