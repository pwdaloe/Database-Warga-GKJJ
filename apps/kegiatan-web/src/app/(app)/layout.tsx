'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Shell } from '@/components/Shell'
import { Memuat } from '@/components/ui'

export default function LayoutAplikasi({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
    else if (user.wajibGantiPassword) router.replace('/ganti-password')
  }, [user, loading, router])

  if (loading || !user || user.wajibGantiPassword) return <Memuat />
  return <Shell>{children}</Shell>
}
