'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Tutup drawer saat pindah halaman
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Kunci scroll body saat drawer terbuka (mobile)
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Top bar — hanya tampil di mobile/tablet */}
        <header className="lg:hidden sticky top-[var(--banner-h,0px)] z-30 flex items-center gap-3 px-4 h-14 bg-brand-900 text-white shadow">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 active:bg-white/20"
          >
            <Menu size={22} />
          </button>
          <img src="/logo-gkj.jpg" alt="" className="w-7 h-7 rounded-md bg-white object-contain p-0.5" />
          <span className="font-semibold text-sm">Database Warga GKJJ</span>
        </header>

        {children}
      </main>
    </div>
  )
}
