'use client'

import { use } from 'react'
import { useMaster, useProgram } from '@/hooks/useData'
import { Memuat, Pemberitahuan } from '@/components/ui'
import { ProgramForm } from '@/components/ProgramForm'
import { pesanGalat } from '@/lib/api'

export default function DetailProgram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const program = useProgram(Number(id))
  const master = useMaster(program.data?.tahun.id)

  if (program.isLoading) return <Memuat />
  if (program.isError || !program.data) return <Pemberitahuan nada="merah">{pesanGalat(program.error, 'Program tidak ditemukan.')}</Pemberitahuan>
  if (master.isLoading || !master.data) return <Memuat />
  // key: formulir dipasang ulang saat status berubah (diajukan/ditarik); simpan biasa tidak memasang ulang
  return <ProgramForm key={`${program.data.id}-${program.data.status}`} master={master.data} awal={program.data} />
}
