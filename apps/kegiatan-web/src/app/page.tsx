'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Memuat } from '@/components/ui'

export default function Beranda() {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    router.replace(user ? (user.wajibGantiPassword ? '/ganti-password' : '/program') : '/login')
  }, [user, loading, router])
  return <Memuat />
}
