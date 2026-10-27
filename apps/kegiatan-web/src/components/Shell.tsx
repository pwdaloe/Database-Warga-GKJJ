'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ClipboardList, LogOut, Settings, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { PERAN_LABEL } from '@/lib/tipe'
import { Lencana } from './ui'


export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, adalah } = useAuth()
  const path = usePathname()
  if (!user) return null

  const menu = [
    { href: '/program', label: 'Program', ikon: ClipboardList, tampil: true },
    { href: '/dashboard', label: 'Dashboard', ikon: BarChart3, tampil: true },
    { href: '/admin/master', label: 'Master', ikon: Settings, tampil: adalah('ADMIN', 'SEKRETARIAT') },
    { href: '/admin/pengguna', label: 'Akun', ikon: Users, tampil: adalah('ADMIN', 'SEKRETARIAT') },
  ].filter((m) => m.tampil)

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="tanpa-cetak sticky top-0 z-30 border-b bg-marine-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base">Kegiatan GKJ Jakarta</p>
            <p className="truncate text-xs text-marine-100">{user.unit ? user.unit.nama : user.bidang ? `Bidang ${user.bidang.nama}` : PERAN_LABEL[user.peran]}</p>
          </div>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Menu utama">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className={clsx('rounded-lg px-3 py-2 text-sm', path.startsWith(m.href) ? 'bg-white/15 font-medium' : 'hover:bg-white/10')}>
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block"><Lencana nada="biru">{PERAN_LABEL[user.peran]}</Lencana></span>
            <button onClick={logout} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-white/10" aria-label="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">{children}</main>

      <nav className="tanpa-cetak fixed inset-x-0 bottom-0 z-30 grid border-t bg-white sm:hidden" style={{ gridTemplateColumns: `repeat(${menu.length}, 1fr)` }} aria-label="Menu utama">
        {menu.map((m) => {
          const Ikon = m.ikon
          const aktif = path.startsWith(m.href)
          return (
            <Link key={m.href} href={m.href} aria-current={aktif ? 'page' : undefined} className={clsx('flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs', aktif ? 'font-semibold text-marine-700' : 'text-gray-500')}>
              <Ikon size={20} />
              {m.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
