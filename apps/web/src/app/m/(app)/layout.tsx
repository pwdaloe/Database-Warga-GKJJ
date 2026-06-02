'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, CreditCard, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/m/warga', icon: Users,      label: 'Warga' },
  { href: '/m/kartu', icon: CreditCard, label: 'Kartu' },
]

export default function MobileAppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/m/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white/60" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">

      {/* Konten utama */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto flex items-stretch">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                  active ? 'text-[#1e3a5f]' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn('text-[11px] font-medium', active && 'font-semibold')}>
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-10 h-0.5 bg-[#1e3a5f] rounded-full" />
                )}
              </Link>
            )
          })}

          {/* Tombol Keluar */}
          <button
            onClick={() => logout()}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={22} strokeWidth={1.8} />
            <span className="text-[11px] font-medium">Keluar</span>
          </button>
        </div>
        {/* Safe area untuk iPhone */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  )
}
