'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { Input, Kartu, Lencana, Pemberitahuan, Tombol } from '../ui'

interface Item { id: number; nama: string; urutan: number; aktif: boolean }

/** Daftar sederhana (satuan, kategori biaya): tambah dan aktif/nonaktifkan. */
export function TabDaftar({ judul, petunjuk, basis, item }: { judul: string; petunjuk: string; basis: string; item: Item[] }) {
  const kirim = useKirimMaster()
  const [nama, setNama] = useState('')
  const [pesan, setPesan] = useState('')

  async function tambah() {
    if (nama.trim().length === 0) return
    try {
      await kirim.mutateAsync({ method: 'post', url: basis, body: { nama: nama.trim(), urutan: item.length, aktif: true } })
      setNama('')
      setPesan('')
    } catch (e) {
      setPesan(pesanGalat(e))
    }
  }

  async function ganti(x: Item) {
    try {
      await kirim.mutateAsync({ method: 'put', url: `${basis}/${x.id}`, body: { nama: x.nama, urutan: x.urutan, aktif: !x.aktif } })
    } catch (e) {
      setPesan(pesanGalat(e))
    }
  }

  return (
    <Kartu judul={judul}>
      <p className="mb-3 text-sm text-gray-500">{petunjuk}</p>
      <ul className="mb-4 flex flex-wrap gap-2">
        {item.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => ganti(x)} className="min-h-[36px]" title={x.aktif ? 'Ketuk untuk menonaktifkan' : 'Ketuk untuk mengaktifkan'}>
              <Lencana nada={x.aktif ? 'hijau' : 'abu'}>{x.nama}{x.aktif ? '' : ' (nonaktif)'}</Lencana>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input placeholder="Tambah baru…" value={nama} onChange={(e) => setNama(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tambah()} maxLength={60} />
        <Tombol varian="sekunder" onClick={tambah} sibuk={kirim.isPending}>Tambah</Tombol>
      </div>
      {pesan && <div className="mt-3"><Pemberitahuan nada="merah">{pesan}</Pemberitahuan></div>}
    </Kartu>
  )
}
