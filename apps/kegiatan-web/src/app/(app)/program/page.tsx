'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMaster, useProgramList } from '@/hooks/useData'
import { formatRupiah } from '@/lib/format'
import { Kartu, Lencana, Memuat, Pemberitahuan, Select, Tombol } from '@/components/ui'
import { BannerPengajuan } from '@/components/BannerPengajuan'

export default function DaftarProgram() {
  const { user, adalah } = useAuth()
  const master = useMaster()
  const [unitId, setUnitId] = useState<number | undefined>()
  const [status, setStatus] = useState<string>('')
  const daftar = useProgramList({ ...(master.data ? { tahunId: master.data.tahun.id } : {}), ...(unitId ? { unitId } : {}), ...(status ? { status } : {}) })

  if (master.isLoading || !user) return <Memuat />
  if (master.isError || !master.data) return <Pemberitahuan nada="merah">Tidak dapat memuat data master.</Pemberitahuan>

  const m = master.data
  const bisaBuat = adalah('PENGURUS_UPK', 'ADMIN', 'SEKRETARIAT') && (adalah('ADMIN', 'SEKRETARIAT') || m.tahun.statusPengajuan === 'DIBUKA')
  const lihatBanyakUnit = !adalah('PENGURUS_UPK')

  return (
    <div className="space-y-4">
      <BannerPengajuan tahun={m.tahun} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-marine-900 sm:text-xl">{adalah('PENGURUS_UPK') ? 'Program kerja saya' : 'Program kerja'}</h1>
          <p className="text-sm text-gray-500">{m.tahun.nama}</p>
        </div>
        {bisaBuat && (
          <Link href="/program/baru">
            <Tombol><Plus size={18} /> Program baru</Tombol>
          </Link>
        )}
      </div>

      {lihatBanyakUnit && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Select aria-label="Filter unit" value={unitId ?? ''} onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">Semua unit</option>
            {m.unit.map((u) => <option key={u.id} value={u.id}>{u.singkatan ?? u.nama}</option>)}
          </Select>
          <Select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua status</option>
            <option value="DRAFT">Draft</option>
            <option value="DIAJUKAN">Diajukan</option>
          </Select>
        </div>
      )}

      {daftar.isLoading ? <Memuat /> : daftar.isError ? (
        <Pemberitahuan nada="merah">Tidak dapat memuat daftar program.</Pemberitahuan>
      ) : daftar.data && daftar.data.length === 0 ? (
        <Kartu>
          <p className="py-6 text-center text-sm text-gray-500">
            Belum ada program.{bisaBuat ? ' Mulai dengan menekan "Program baru".' : ''}
          </p>
        </Kartu>
      ) : (
        <ul className="space-y-3">
          {daftar.data?.map((p) => (
            <li key={p.id}>
              <Link href={`/program/${p.id}`} className="block rounded-xl border bg-white p-4 shadow-sm transition hover:border-marine-500">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{p.judul}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{p.unit.nama}{p.nomor ? ` · ${p.nomor}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {p.isContoh && <Lencana nada="kuning">Contoh</Lencana>}
                    <Lencana nada={p.status === 'DIAJUKAN' ? 'hijau' : 'abu'}>{p.status === 'DIAJUKAN' ? 'Diajukan' : 'Draft'}</Lencana>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-xs text-gray-500">Anggaran</dt><dd className="font-medium">{formatRupiah(p.totalRab)}</dd></div>
                  <div><dt className="text-xs text-gray-500">Gereja</dt><dd>{formatRupiah(p.gereja)}</dd></div>
                  <div><dt className="text-xs text-gray-500">Mandiri</dt><dd>{formatRupiah(p.mandiri)}</dd></div>
                </dl>
                {p.selisih !== 0 && p.status === 'DRAFT' && <p className="mt-2 text-xs text-amber-700">Sumber dana belum sama dengan anggaran.</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
