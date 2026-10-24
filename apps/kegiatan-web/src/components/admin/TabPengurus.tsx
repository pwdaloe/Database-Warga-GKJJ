'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import type { Master, PengurusBph } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Tombol } from '../ui'

const JABATAN = { KETUA: 'Ketua', SEKRETARIS: 'Sekretaris', BENDAHARA: 'Bendahara' } as const

function BarisPengurus({ p }: { p: PengurusBph }) {
  const kirim = useKirimMaster()
  const [v, setV] = useState({ nama: p.nama, whatsapp: p.whatsapp ?? '', email: p.email ?? '', aktif: p.aktif })
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)

  async function simpan() {
    try {
      await kirim.mutateAsync({ method: 'put', url: `/master/pengurus/${p.id}`, body: { nama: v.nama, whatsapp: v.whatsapp || null, email: v.email || null, aktif: v.aktif } })
      setPesan({ nada: 'hijau', teks: 'Tersimpan.' })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50/60 p-3">
      <p className="text-sm font-medium">{JABATAN[p.jabatan]} {p.isContoh && <Lencana nada="kuning">Nama contoh</Lencana>}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Bidang label="Nama"><Input value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} /></Bidang>
        <Bidang label="WhatsApp"><Input type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} /></Bidang>
        <Bidang label="Email"><Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Bidang>
      </div>
      {pesan && <Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan>}
      <Tombol varian="sekunder" onClick={simpan} sibuk={kirim.isPending}>Simpan</Tombol>
    </div>
  )
}

export function TabPengurus({ master }: { master: Master }) {
  const [buka, setBuka] = useState<number | null>(null)
  const contoh = master.unit.flatMap((u) => u.pengurus ?? []).filter((p) => p.isContoh).length
  return (
    <div className="space-y-3">
      <Pemberitahuan nada="biru">Badan Pengurus Harian per unit: Ketua, Sekretaris, Bendahara. {contoh > 0 ? `${contoh} posisi masih bernama contoh; ganti dengan nama sebenarnya.` : 'Semua posisi sudah terisi.'}</Pemberitahuan>
      {master.unit.map((u) => (
        <Kartu key={u.id} judul={<button type="button" className="text-left" onClick={() => setBuka(buka === u.id ? null : u.id)}>{u.nama} <span className="text-xs font-normal text-gray-500">({(u.pengurus ?? []).filter((p) => !p.isContoh).length}/3 terisi)</span></button>}>
          {buka === u.id ? <div className="space-y-3">{(u.pengurus ?? []).map((p) => <BarisPengurus key={`${p.id}-${p.nama}`} p={p} />)}</div> : <p className="text-sm text-gray-500">{(u.pengurus ?? []).map((p) => `${JABATAN[p.jabatan]}: ${p.nama}`).join(' · ')}</p>}
        </Kartu>
      ))}
    </div>
  )
}
