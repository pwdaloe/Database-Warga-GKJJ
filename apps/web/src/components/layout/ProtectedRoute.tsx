'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

// Halaman yang boleh dibuka akun Jemaat (pagar sebenarnya ada di API; ini hanya agar tidak melihat halaman kosong/galat)
const HALAMAN_JEMAAT = ['/profil-saya', '/hubungi', '/ganti-password']
const bolehJemaat = (path: string) => HALAMAN_JEMAAT.some((p) => path === p || path.startsWith(p + '/'))

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (user.mustChangePassword) {
      router.replace('/ganti-password')
      return
    }
    if (user.role === 'JEMAAT' && !bolehJemaat(pathname)) {
      router.replace('/profil-saya')
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard')
    }
  }, [user, loading, allowedRoles, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user || user.mustChangePassword) return null
  if (user.role === 'JEMAAT' && !bolehJemaat(pathname)) return null
  if (allowedRoles && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
