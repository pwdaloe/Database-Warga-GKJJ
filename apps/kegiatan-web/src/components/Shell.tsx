'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, ClipboardList, LogOut, MessageCircle, Settings, Users, Wallet } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMaster, useVersi } from '@/hooks/useData'
import { tautanDukungan } from '@/lib/dukungan'
import { Logo } from './Logo'
import { PERAN_LABEL } from '@/lib/tipe'
import { Lencana } from './ui'


export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, adalah } = useAuth()
  const path = usePathname()
  const master = useMaster()
  const versi = useVersi()
  if (!user) return null
  const wa = tautanDukungan(master.data?.dukungan, { nama: user.nama, unit: user.unit?.nama ?? null })

  const menu = [
    { href: '/program', label: 'Kegiatan', ikon: ClipboardList, tampil: true },
    { href: '/dashboard', label: 'Dashboard', ikon: BarChart3, tampil: true },
    { href: '/alokasi', label: 'Alokasi', ikon: Wallet, tampil: adalah('KOORDINATOR_BIDANG') },
    { href: '/admin/master', label: 'Master', ikon: Settings, tampil: adalah('ADMIN', 'SEKRETARIAT') },
    { href: '/admin/pengguna', label: 'Akun', ikon: Users, tampil: adalah('ADMIN', 'SEKRETARIAT') },
    { href: '/panduan', label: 'Panduan', ikon: BookOpen, tampil: true },
  ].filter((m) => m.tampil)

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="tanpa-cetak sticky z-30 border-b bg-marine-700 text-white" style={{ top: 'var(--banner-h, 0px)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo ukuran={38} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">Kegiatan GKJ Jakarta</p>
              <p className="truncate text-xs text-marine-100">{user.unit ? user.unit.nama : user.bidang ? `Bidang ${user.bidang.nama}` : PERAN_LABEL[user.peran]}</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Menu utama">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className={clsx('rounded-lg px-3 py-2 text-sm', path.startsWith(m.href) ? 'bg-white/15 font-medium' : 'hover:bg-white/10')}>
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Hubungi pusat bantuan lewat WhatsApp" title="Bantuan WhatsApp" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-white/10">
                <MessageCircle size={20} />
              </a>
            )}
            <span className="hidden sm:block"><Lencana nada="biru">{PERAN_LABEL[user.peran]}</Lencana></span>
            <button onClick={logout} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-white/10" aria-label="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">{children}</main>

      <footer className="tanpa-cetak pb-4 text-center text-xs text-gray-400">
        Kegiatan GKJ Jakarta{versi.data && <> · <Link href="/versi" className="underline-offset-2 hover:underline">Versi {versi.data.versi}</Link></>}
      </footer>

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
