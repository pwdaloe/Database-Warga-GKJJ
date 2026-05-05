'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Home,
  MapPin,
  ArrowLeftRight,
  Upload,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER'],
  },
  {
    label: 'Data Warga',
    href: '/warga',
    icon: Users,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'],
  },
  {
    label: 'Data Keluarga',
    href: '/keluarga',
    icon: Home,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'],
  },
  {
    label: 'Wilayah & Kelompok',
    href: '/wilayah',
    icon: MapPin,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS'],
  },
  {
    label: 'Perpindahan',
    href: '/perpindahan',
    icon: ArrowLeftRight,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'],
  },
  {
    label: 'Import Data',
    href: '/import',
    icon: Upload,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'STAF_ADMIN'],
  },
  {
    label: 'Pengaturan',
    href: '/pengaturan',
    icon: Settings,
    roles: ['SUPERADMIN', 'KEPALA_KANTOR'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleNav = NAV.filter((item) => user && item.roles.includes(user.role))

  return (
    <aside className="w-64 min-h-screen bg-brand-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg">
            ✝
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Database Warga</p>
            <p className="text-xs text-brand-200">GKJJ</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white',
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{user.nama}</p>
            <span
              className={cn(
                'inline-block text-xs px-2 py-0.5 rounded-full mt-1',
                ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700',
              )}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              text-brand-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      )}
    </aside>
  )
}
