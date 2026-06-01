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
  CreditCard,
  UserCog,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'

// ── Tipe & data navigasi ─────────────────────────────────────
interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Beranda',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER'],
      },
    ],
  },
  {
    label: 'Data Jemaat',
    items: [
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
        label: 'Kartu Anggota',
        href: '/kartu',
        icon: CreditCard,
        roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK'],
      },
    ],
  },
  {
    label: 'Organisasi',
    items: [
      {
        label: 'Wilayah & Kelompok',
        href: '/wilayah',
        icon: MapPin,
        roles: ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS'],
      },
    ],
  },
  {
    label: 'Utilitas',
    items: [
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
    ],
  },
  {
    label: 'Sistem',
    items: [
      {
        label: 'Pengguna',
        href: '/pengguna',
        icon: UserCog,
        roles: ['SUPERADMIN', 'KEPALA_KANTOR'],
      },
      {
        label: 'Log Aktivitas',
        href: '/log',
        icon: Activity,
        roles: ['SUPERADMIN', 'KEPALA_KANTOR'],
      },
      {
        label: 'Pengaturan',
        href: '/pengaturan',
        icon: Settings,
        roles: ['SUPERADMIN', 'KEPALA_KANTOR'],
      },
    ],
  },
]

// ── Komponen Sidebar ─────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => user && item.roles.includes(user.role)),
  })).filter((group) => group.items.length > 0)

  return (
    <aside className="w-64 min-h-screen bg-brand-900 text-white flex flex-col">

      {/* ── Logo & versi ─────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <img
              src="/logo-gkj.jpg"
              alt="Logo GKJ"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight text-white">Database Warga</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-brand-200 font-medium">GKJJ</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-700 text-brand-200 border border-brand-600 leading-none">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigasi bergroup ────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {/* Section header */}
            <p className="px-3 mb-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              {group.label}
            </p>

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                      active
                        ? 'bg-white/20 text-white font-semibold shadow-sm'
                        : 'text-brand-200 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <item.icon size={16} className={cn(active ? 'text-white' : 'text-brand-300')} />
                    <span className="flex-1 leading-tight">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white leading-none">
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight size={13} className="opacity-70" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User info + logout ───────────────────────────── */}
      {user && (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="px-3 py-2.5 rounded-lg bg-white/5 mb-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {user.warga?.namaLengkap ?? user.nama}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  'inline-block text-[10px] px-2 py-0.5 rounded-full font-medium leading-none',
                  ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700',
                )}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              text-brand-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      )}
    </aside>
  )
}
