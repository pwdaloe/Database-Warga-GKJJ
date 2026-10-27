'use client'

import { useAuth } from '@/hooks/useAuth'
import { useMaster } from '@/hooks/useData'
import { Memuat, Pemberitahuan } from '@/components/ui'
import { ProgramForm } from '@/components/ProgramForm'

export default function ProgramBaru() {
  const { user, adalah } = useAuth()
  const master = useMaster()
  if (master.isLoading || !user) return <Memuat />
  if (!adalah('PENGURUS_UPK', 'ADMIN', 'SEKRETARIAT')) return <Pemberitahuan nada="kuning">Peran Anda hanya dapat melihat program. Pembuatan program dilakukan oleh pengurus unit.</Pemberitahuan>
  if (master.isError || !master.data) return <Pemberitahuan nada="merah">Tidak dapat memuat data master.</Pemberitahuan>
  if (user.peran === 'PENGURUS_UPK' && !user.unitId) return <Pemberitahuan nada="merah">Akun Anda belum terhubung ke unit. Hubungi sekretariat.</Pemberitahuan>
  return <ProgramForm master={master.data} awal={null} {...(user.unitId ? { unitIdBaru: user.unitId } : {})} />
}
