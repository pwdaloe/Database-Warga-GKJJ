'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import type { Acuan, Master } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Textarea, Tombol } from '../ui'

function FormAcuan({ a, master, onSelesai }: { a: Acuan | null; master: Master; onSelesai?: () => void }) {
  const kirim = useKirimMaster()
  const [v, setV] = useState({
    jenis: a?.jenis ?? 'MISI', kode: a?.kode ?? '', nama: a?.nama ?? '', deskripsi: a?.deskripsi ?? '', parentId: a?.parentId ?? null as number | null, urutan: a?.urutan ?? 0, aktif: a?.aktif ?? true,
  })
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)

  async function simpan() {
    try {
      const body = { tahunId: master.tahun.id, jenis: v.jenis, kode: v.kode.trim(), nama: v.nama.trim(), deskripsi: v.deskripsi.trim() || null, parentId: v.parentId, urutan: v.urutan, aktif: v.aktif }
      await kirim.mutateAsync({ method: a ? 'put' : 'post', url: a ? `/master/acuan/${a.id}` : '/master/acuan', body })
      setPesan({ nada: 'hijau', teks: 'Tersimpan.' })
      if (!a) setV({ ...v, kode: '', nama: '', deskripsi: '' })
      onSelesai?.()
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  async function hapus() {
    if (!a || !window.confirm(`Hapus acuan "${a.nama}"? Bila sudah dipakai program, nonaktifkan saja.`)) return
    try {
      await kirim.mutateAsync({ method: 'delete', url: `/master/acuan/${a.id}` })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <Bidang label="Jenis"><Select value={v.jenis} onChange={(e) => setV({ ...v, jenis: e.target.value as Acuan['jenis'] })}><option value="VISI">Visi</option><option value="MISI">Misi / aspek</option><option value="SASARAN">Sasaran strategis</option></Select></Bidang>
        <Bidang label="Kode"><Input value={v.kode} onChange={(e) => setV({ ...v, kode: e.target.value })} maxLength={30} /></Bidang>
        <Bidang label="Nama" className="sm:col-span-2"><Input value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} maxLength={200} /></Bidang>
        <Bidang label="Induk"><Select value={v.parentId ?? ''} onChange={(e) => setV({ ...v, parentId: e.target.value ? Number(e.target.value) : null })}><option value="">—</option>{master.acuan.filter((x) => x.id !== a?.id).map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</Select></Bidang>
        <Bidang label="Urutan"><Input type="number" min={0} value={v.urutan} onChange={(e) => setV({ ...v, urutan: Number(e.target.value) })} /></Bidang>
        <label className="flex min-h-[44px] items-end gap-3 pb-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.aktif} onChange={(e) => setV({ ...v, aktif: e.target.checked })} /> Aktif</label>
      </div>
      <Bidang label="Deskripsi"><Textarea rows={2} value={v.deskripsi} onChange={(e) => setV({ ...v, deskripsi: e.target.value })} /></Bidang>
      {pesan && <Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan>}
      <div className="flex gap-2">
        <Tombol varian="sekunder" onClick={simpan} sibuk={kirim.isPending}>{a ? 'Simpan' : 'Tambah'}</Tombol>
        {a && <Tombol varian="hantu" className="text-red-600" onClick={hapus}>Hapus</Tombol>}
      </div>
    </div>
  )
}

export function TabAcuan({ master }: { master: Master }) {
  const [ubah, setUbah] = useState<number | null>(null)
  const JENIS = { VISI: 'Visi', MISI: 'Misi / aspek', SASARAN: 'Sasaran' } as const
  return (
    <div className="space-y-4">
      <Pemberitahuan nada="biru">Visi, misi, dan sasaran strategis untuk {master.tahun.nama}. Ini menjadi pilihan "Acuan visi dan misi" pada formulir program. Saat tahun baru dibuat, isinya dapat disalin lalu diperbarui.</Pemberitahuan>
      <ul className="space-y-2">
        {master.acuan.map((a) => (
          <li key={a.id} className="rounded-lg border bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm"><Lencana nada={a.jenis === 'VISI' ? 'biru' : a.jenis === 'MISI' ? 'hijau' : 'kuning'}>{JENIS[a.jenis]}</Lencana> <strong className="ml-1">{a.nama}</strong> <span className="text-xs text-gray-500">({a.kode}){!a.aktif ? ' · nonaktif' : ''}</span></p>
              <Tombol varian="hantu" onClick={() => setUbah(ubah === a.id ? null : a.id)}>{ubah === a.id ? 'Tutup' : 'Ubah'}</Tombol>
            </div>
            {a.deskripsi && ubah !== a.id && <p className="mt-1 text-sm text-gray-600">{a.deskripsi}</p>}
            {ubah === a.id && <div className="mt-3"><FormAcuan a={a} master={master} onSelesai={() => setUbah(null)} /></div>}
          </li>
        ))}
      </ul>
      <Kartu judul="Tambah acuan"><FormAcuan a={null} master={master} /></Kartu>
    </div>
  )
}
