'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { formatKetikRupiah } from '@/lib/format'
import type { Master } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Tombol } from '../ui'

interface Draf { bidangId: number; pagu: string }

/** Satu layar: posisi unit di dalam bidang dan pagu per unit. Pagu bidang = jumlah pagu unit di dalamnya. */
export function TabStruktur({ master }: { master: Master }) {
  const kirim = useKirimMaster()
  const awal = (): Record<number, Draf> => Object.fromEntries(master.unit.map((u) => [u.id, { bidangId: u.bidangId, pagu: String(u.pagu ?? 0) }]))
  const [draf, setDraf] = useState<Record<number, Draf>>(awal)
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)
  const [baru, setBaru] = useState({ kode: '', nama: '' })

  const berubah = master.unit.filter((u) => draf[u.id] && (draf[u.id]!.bidangId !== u.bidangId || Number(draf[u.id]!.pagu || 0) !== (u.pagu ?? 0)))
  const set = (id: number, patch: Partial<Draf>) => setDraf((d) => ({ ...d, [id]: { ...d[id]!, ...patch } }))
  const subtotal = (bidangId: number) => master.unit.filter((u) => draf[u.id]?.bidangId === bidangId).reduce((n, u) => n + Number(draf[u.id]!.pagu || 0), 0)
  const total = master.unit.reduce((n, u) => n + Number(draf[u.id]?.pagu || 0), 0)

  async function simpan() {
    try {
      for (const u of berubah) {
        const d = draf[u.id]!
        if (d.bidangId !== u.bidangId) {
          await kirim.mutateAsync({ method: 'put', url: `/master/unit/${u.id}`, body: { nama: u.nama, singkatan: u.singkatan, alias: u.alias, bidangId: d.bidangId, jenis: u.jenis, urutan: u.urutan, aktif: u.aktif } })
        }
        if (Number(d.pagu || 0) !== (u.pagu ?? 0)) {
          await kirim.mutateAsync({ method: 'put', url: '/master/pagu', body: { tahunId: master.tahun.id, unitId: u.id, nilai: Number(d.pagu || 0), catatan: 'Diubah admin' } })
        }
      }
      setPesan({ nada: 'hijau', teks: `${berubah.length} unit tersimpan.` })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  async function tambahBidang() {
    try {
      await kirim.mutateAsync({ method: 'post', url: '/master/bidang', body: { kode: baru.kode.toUpperCase(), nama: baru.nama, urutan: master.bidang.length + 1 } })
      setBaru({ kode: '', nama: '' })
      setPesan({ nada: 'hijau', teks: 'Bidang ditambahkan.' })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <div className="space-y-4">
      <Pemberitahuan nada="biru">
        Atur posisi unit dengan memilih bidangnya, dan isi pagu {master.tahun.tahun} per unit. Pagu bidang adalah jumlah pagu unitnya. Total pagu: <strong>Rp {formatKetikRupiah(String(total))}</strong>. Klik Simpan setelah selesai.
      </Pemberitahuan>
      {master.bidang.map((b) => {
        const isi = master.unit.filter((u) => draf[u.id]?.bidangId === b.id)
        return (
          <Kartu key={b.id} judul={<span>{b.nama} <Lencana nada="biru">Rp {formatKetikRupiah(String(subtotal(b.id)))}</Lencana></span>}>
            {isi.length === 0 && <p className="text-sm text-gray-500">Belum ada unit di bidang ini.</p>}
            <ul className="space-y-2">
              {isi.map((u) => (
                <li key={u.id} className="grid grid-cols-[3fr_2fr] items-end gap-x-2 gap-y-1.5 rounded-lg border p-3 sm:grid-cols-[1fr_14rem_11rem] sm:gap-x-3">
                  <p className="col-span-2 text-sm font-medium sm:col-span-1 sm:self-center">{u.nama} <Lencana nada={u.jenis === 'POS' ? 'kuning' : 'biru'}>{u.jenis === 'POS' ? 'Pos' : 'UPK'}</Lencana> {!u.aktif && <Lencana>Nonaktif</Lencana>}</p>
                  <Bidang label="Bidang"><Select value={draf[u.id]!.bidangId} onChange={(e) => set(u.id, { bidangId: Number(e.target.value) })}>{master.bidang.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</Select></Bidang>
                  <Bidang label="Pagu (Rp)"><Input inputMode="numeric" className="text-right" value={formatKetikRupiah(draf[u.id]!.pagu)} onChange={(e) => set(u.id, { pagu: e.target.value.replace(/\D/g, '') })} /></Bidang>
                </li>
              ))}
            </ul>
          </Kartu>
        )
      })}
      {pesan && <Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan>}
      <div className="sticky bottom-[4.25rem] z-20 -mx-4 border-t bg-white/95 px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur sm:bottom-0 sm:mx-0 sm:rounded-xl sm:border"><Tombol className="w-full sm:w-auto" onClick={simpan} sibuk={kirim.isPending} disabled={berubah.length === 0}>Simpan perubahan{berubah.length > 0 ? ` (${berubah.length})` : ''}</Tombol></div>
      <Kartu judul="Tambah bidang">
        <div className="grid gap-3 sm:grid-cols-3">
          <Bidang label="Kode" petunjuk="Huruf besar/angka."><Input value={baru.kode} onChange={(e) => setBaru({ ...baru, kode: e.target.value })} maxLength={20} /></Bidang>
          <Bidang label="Nama bidang" className="sm:col-span-2"><Input value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} /></Bidang>
        </div>
        <div className="mt-4"><Tombol varian="sekunder" onClick={tambahBidang} sibuk={kirim.isPending}>Tambah bidang</Tombol></div>
      </Kartu>
    </div>
  )
}
