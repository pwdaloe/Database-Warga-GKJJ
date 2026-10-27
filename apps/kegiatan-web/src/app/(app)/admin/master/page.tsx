'use client'

import clsx from 'clsx'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMaster } from '@/hooks/useData'
import { Memuat, Pemberitahuan } from '@/components/ui'
import { TabAcuan } from '@/components/admin/TabAcuan'
import { TabDukungan } from '@/components/admin/TabDukungan'
import { TabDaftar } from '@/components/admin/TabDaftar'
import { TabPengurus } from '@/components/admin/TabPengurus'
import { TabStruktur } from '@/components/admin/TabStruktur'
import { TabTahun } from '@/components/admin/TabTahun'
import { TabUnit } from '@/components/admin/TabUnit'

const TAB = [
  { k: 'tahun', l: 'Tahun & jendela' },
  { k: 'struktur', l: 'Struktur & anggaran' },
  { k: 'unit', l: 'Detail unit' },
  { k: 'pengurus', l: 'Pengurus (BPH)' },
  { k: 'acuan', l: 'Visi & misi' },
  { k: 'daftar', l: 'Satuan & kategori' },
  { k: 'dukungan', l: 'Dukungan' },
] as const

export default function MasterAdmin() {
  const { adalah } = useAuth()
  const master = useMaster()
  const [tab, setTab] = useState<(typeof TAB)[number]['k']>('tahun')

  if (!adalah('ADMIN', 'SEKRETARIAT')) return <Pemberitahuan nada="merah">Halaman ini hanya untuk admin dan sekretariat.</Pemberitahuan>
  if (master.isLoading) return <Memuat />
  if (master.isError || !master.data) return <Pemberitahuan nada="merah">Tidak dapat memuat master.</Pemberitahuan>
  const m = master.data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-marine-900 sm:text-xl">Master data</h1>
        <p className="text-sm text-gray-500">Semua isian di sini dapat diubah tanpa mengubah kode. Tahun yang ditampilkan: {m.tahun.nama}.</p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <div role="tablist" className="flex w-max gap-1 rounded-xl bg-gray-100 p-1">
          {TAB.map((t) => (
            <button key={t.k} role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)} className={clsx('min-h-[40px] whitespace-nowrap rounded-lg px-3 text-sm', tab === t.k ? 'bg-white font-medium shadow-sm' : 'text-gray-600')}>{t.l}</button>
          ))}
        </div>
      </div>
      {tab === 'tahun' && <TabTahun master={m} />}
      {tab === 'struktur' && <TabStruktur master={m} />}
      {tab === 'unit' && <TabUnit master={m} />}
      {tab === 'pengurus' && <TabPengurus master={m} />}
      {tab === 'acuan' && <TabAcuan master={m} />}
      {tab === 'dukungan' && <TabDukungan master={m} />}
      {tab === 'daftar' && (
        <div className="space-y-4">
          <TabDaftar judul="Satuan" petunjuk="Muncul sebagai saran pada kolom satuan di RAB. Pengurus tetap dapat mengetik satuan lain." basis="/master/satuan" item={m.satuan} />
          <TabDaftar judul="Kategori biaya" petunjuk="Dipakai untuk rekap biaya per kategori." basis="/master/kategori-biaya" item={m.kategoriBiaya} />
        </div>
      )}
    </div>
  )
}
