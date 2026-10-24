'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { formatKetikRupiah } from '@/lib/format'
import type { Master, UnitMaster } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Tombol } from '../ui'

function BarisUnit({ u, master }: { u: UnitMaster; master: Master }) {
  const kirim = useKirimMaster()
  const [nama, setNama] = useState(u.nama)
  const [singkatan, setSingkatan] = useState(u.singkatan ?? '')
  const [alias, setAlias] = useState(u.alias.join(', '))
  const [bidangId, setBidangId] = useState(u.bidangId)
  const [aktif, setAktif] = useState(u.aktif)
  const [pagu, setPagu] = useState(String(u.pagu ?? 0))
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)

  async function simpan() {
    try {
      await kirim.mutateAsync({ method: 'put', url: `/master/unit/${u.id}`, body: { nama, singkatan: singkatan || null, alias: alias.split(',').map((a) => a.trim()).filter(Boolean), bidangId, jenis: u.jenis, urutan: u.urutan, aktif } })
      await kirim.mutateAsync({ method: 'put', url: '/master/pagu', body: { tahunId: master.tahun.id, unitId: u.id, nilai: Number(pagu || 0), catatan: 'Diubah admin' } })
      setPesan({ nada: 'hijau', teks: 'Tersimpan.' })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <li className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{u.kode} <Lencana nada={u.jenis === 'POS' ? 'kuning' : 'biru'}>{u.jenis === 'POS' ? 'Pos' : 'UPK'}</Lencana> {!aktif && <Lencana>Nonaktif</Lencana>}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Bidang label="Nama resmi"><Input value={nama} onChange={(e) => setNama(e.target.value)} /></Bidang>
        <Bidang label="Singkatan"><Input value={singkatan} onChange={(e) => setSingkatan(e.target.value)} /></Bidang>
        <Bidang label="Nama lain / alias" petunjuk="Pisahkan dengan koma."><Input value={alias} onChange={(e) => setAlias(e.target.value)} /></Bidang>
        <Bidang label="Bidang"><Select value={bidangId} onChange={(e) => setBidangId(Number(e.target.value))}>{master.bidang.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</Select></Bidang>
        <Bidang label={`Pagu ${master.tahun.tahun} (Rp)`}>
          <Input inputMode="numeric" className="text-right" value={formatKetikRupiah(pagu)} onChange={(e) => setPagu(e.target.value.replace(/\D/g, ''))} />
        </Bidang>
        <label className="flex min-h-[44px] items-end gap-3 pb-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={aktif} onChange={(e) => setAktif(e.target.checked)} /> Aktif</label>
      </div>
      {pesan && <Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan>}
      <Tombol varian="sekunder" onClick={simpan} sibuk={kirim.isPending}>Simpan</Tombol>
    </li>
  )
}

export function TabUnit({ master }: { master: Master }) {
  const kirim = useKirimMaster()
  const [baru, setBaru] = useState({ kode: '', nama: '', bidangId: master.bidang[0]?.id ?? 0, jenis: 'UPK' as 'UPK' | 'POS' })
  const [pesan, setPesan] = useState('')

  async function tambah() {
    try {
      await kirim.mutateAsync({ method: 'post', url: '/master/unit', body: { ...baru, kode: baru.kode.toUpperCase(), alias: [] } })
      setBaru({ ...baru, kode: '', nama: '' })
      setPesan('Unit ditambahkan beserta tiga posisi BPH (isi di tab Pengurus).')
    } catch (e) {
      setPesan(pesanGalat(e))
    }
  }

  const total = master.unit.reduce((n, u) => n + (u.pagu ?? 0), 0)
  return (
    <div className="space-y-4">
      <Pemberitahuan nada="biru">Pagu {master.tahun.nama} sementara memakai angka 2026 dan dapat diubah di sini. Total pagu saat ini: <strong>Rp {formatKetikRupiah(String(total))}</strong>.</Pemberitahuan>
      <ul className="space-y-3">{master.unit.map((u) => <BarisUnit key={u.id} u={u} master={master} />)}</ul>
      <Kartu judul="Tambah unit atau pos">
        <div className="grid gap-3 sm:grid-cols-4">
          <Bidang label="Kode" petunjuk="Huruf besar/angka, mis. KOMBAR."><Input value={baru.kode} onChange={(e) => setBaru({ ...baru, kode: e.target.value })} maxLength={20} /></Bidang>
          <Bidang label="Nama resmi" className="sm:col-span-2"><Input value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} /></Bidang>
          <Bidang label="Jenis"><Select value={baru.jenis} onChange={(e) => setBaru({ ...baru, jenis: e.target.value as 'UPK' | 'POS' })}><option value="UPK">UPK</option><option value="POS">Pos biaya</option></Select></Bidang>
          <Bidang label="Bidang" className="sm:col-span-2"><Select value={baru.bidangId} onChange={(e) => setBaru({ ...baru, bidangId: Number(e.target.value) })}>{master.bidang.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</Select></Bidang>
        </div>
        {pesan && <div className="mt-3"><Pemberitahuan>{pesan}</Pemberitahuan></div>}
        <div className="mt-4"><Tombol varian="sekunder" onClick={tambah} sibuk={kirim.isPending}>Tambah</Tombol></div>
      </Kartu>
    </div>
  )
}
