'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { formatKetikRupiah } from '@/lib/format'
import type { Master } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Tombol } from '../ui'

interface Draf { bidangId: number; pagu: string }

/**
 * Satu layar: posisi unit di dalam bidang, pagu bidang (batas keras dana Gereja bidang berisi UPK), alokasi indikatif per UPK
 * (panduan ketua bidang), dan pagu per pos. Bidang yang hanya berisi pos: pagu bidang = jumlah pagu pos.
 */
export function TabStruktur({ master }: { master: Master }) {
  const kirim = useKirimMaster()
  const awal = (): Record<number, Draf> => Object.fromEntries(master.unit.map((u) => [u.id, { bidangId: u.bidangId, pagu: String(u.pagu ?? 0) }]))
  const [draf, setDraf] = useState<Record<number, Draf>>(awal)
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)
  const [baru, setBaru] = useState({ kode: '', nama: '' })
  const awalBidang = (): Record<number, string> => Object.fromEntries(master.bidang.map((b) => [b.id, String(master.paguBidang.find((p) => p.bidangId === b.id)?.nilai ?? 0)]))
  const [paguB, setPaguB] = useState<Record<number, string>>(awalBidang)
  const paguBidangLama = (id: number): number => master.paguBidang.find((p) => p.bidangId === id)?.nilai ?? 0
  const bidangBerubah = master.bidang.filter((b) => Number(paguB[b.id] || 0) !== paguBidangLama(b.id))
  const jumlahBerubah = (): number => berubah.length + bidangBerubah.length

  const berubah = master.unit.filter((u) => draf[u.id] && (draf[u.id]!.bidangId !== u.bidangId || Number(draf[u.id]!.pagu || 0) !== (u.pagu ?? 0)))
  const set = (id: number, patch: Partial<Draf>) => setDraf((d) => ({ ...d, [id]: { ...d[id]!, ...patch } }))
  const subtotal = (bidangId: number) => master.unit.filter((u) => draf[u.id]?.bidangId === bidangId).reduce((n, u) => n + Number(draf[u.id]!.pagu || 0), 0)
  const adaUpk = (bidangId: number): boolean => master.unit.some((u) => draf[u.id]?.bidangId === bidangId && u.jenis === 'UPK')
  /** Pagu bidang: angka keuangan untuk bidang berisi UPK; jumlah pos untuk bidang pos. */
  const paguBidangEfektif = (bidangId: number): number => (adaUpk(bidangId) ? Number(paguB[bidangId] || 0) : subtotal(bidangId))
  const total = master.bidang.reduce((n, b) => n + paguBidangEfektif(b.id), 0)
  const proyeksi = master.tahun.proyeksiKasJemaat ?? 0

  async function simpan() {
    try {
      for (const b of bidangBerubah) {
        await kirim.mutateAsync({ method: 'put', url: '/master/pagu-bidang', body: { tahunId: master.tahun.id, bidangId: b.id, nilai: Number(paguB[b.id] || 0), catatan: 'Diubah admin' } })
      }
      for (const u of berubah) {
        const d = draf[u.id]!
        if (d.bidangId !== u.bidangId) {
          await kirim.mutateAsync({ method: 'put', url: `/master/unit/${u.id}`, body: { nama: u.nama, singkatan: u.singkatan, alias: u.alias, bidangId: d.bidangId, jenis: u.jenis, urutan: u.urutan, aktif: u.aktif } })
        }
        if (Number(d.pagu || 0) !== (u.pagu ?? 0)) {
          await kirim.mutateAsync({ method: 'put', url: '/master/pagu', body: { tahunId: master.tahun.id, unitId: u.id, nilai: Number(d.pagu || 0), catatan: 'Diubah admin' } })
        }
      }
      setPesan({ nada: 'hijau', teks: `${jumlahBerubah()} perubahan tersimpan.` })
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
        Isi <strong>pagu bidang</strong> {master.tahun.tahun} (batas dana Gereja) untuk bidang berisi UPK, dan <strong>pagu per pos</strong> untuk Penatalayanan, Ministerium, dan Kemajelisan. Alokasi per UPK hanya panduan; ketua bidang membaginya saat pra-muker.
        Total pagu: <strong>Rp {formatKetikRupiah(String(total))}</strong>
        {proyeksi > 0 && <> · proyeksi Kas Jemaat Rp {formatKetikRupiah(String(proyeksi))} ({total <= proyeksi ? `sisa Rp ${formatKetikRupiah(String(proyeksi - total))}` : `melebihi Rp ${formatKetikRupiah(String(total - proyeksi))}`})</>}. Klik Simpan setelah selesai.
      </Pemberitahuan>
      {master.bidang.map((b) => {
        const isi = master.unit.filter((u) => draf[u.id]?.bidangId === b.id)
        return (
          <Kartu key={b.id} judul={<span>{b.nama} <Lencana nada="biru">Pagu Rp {formatKetikRupiah(String(paguBidangEfektif(b.id)))}</Lencana></span>}>
            {adaUpk(b.id) && (
              <div className="mb-3 grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-[14rem_1fr] sm:items-end">
                <Bidang label="Pagu bidang (Rp)" petunjuk="Batas dana Gereja untuk seluruh UPK di bidang ini.">
                  <Input inputMode="numeric" className="text-right" value={formatKetikRupiah(paguB[b.id] ?? '0')} onChange={(e) => setPaguB((d) => ({ ...d, [b.id]: e.target.value.replace(/\D/g, '') }))} />
                </Bidang>
                <p className="text-sm text-gray-600">
                  Alokasi UPK Rp {formatKetikRupiah(String(subtotal(b.id)))} · {Number(paguB[b.id] || 0) - subtotal(b.id) >= 0
                    ? <>belum dialokasikan <strong>Rp {formatKetikRupiah(String(Number(paguB[b.id] || 0) - subtotal(b.id)))}</strong></>
                    : <span className="font-medium text-red-700">alokasi melebihi pagu bidang Rp {formatKetikRupiah(String(subtotal(b.id) - Number(paguB[b.id] || 0)))}</span>}
                </p>
              </div>
            )}
            {isi.length === 0 && <p className="text-sm text-gray-500">Belum ada unit di bidang ini.</p>}
            <ul className="space-y-2">
              {isi.map((u) => (
                <li key={u.id} className="grid grid-cols-[3fr_2fr] items-end gap-x-2 gap-y-1.5 rounded-lg border p-3 sm:grid-cols-[1fr_14rem_11rem] sm:gap-x-3">
                  <p className="col-span-2 text-sm font-medium sm:col-span-1 sm:self-center">{u.nama} <Lencana nada={u.jenis === 'POS' ? 'kuning' : 'biru'}>{u.jenis === 'POS' ? 'Pos' : 'UPK'}</Lencana> {!u.aktif && <Lencana>Nonaktif</Lencana>}</p>
                  <Bidang label="Bidang"><Select value={draf[u.id]!.bidangId} onChange={(e) => set(u.id, { bidangId: Number(e.target.value) })}>{master.bidang.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</Select></Bidang>
                  <Bidang label={u.jenis === 'POS' ? 'Pagu pos (Rp)' : 'Alokasi indikatif (Rp)'}><Input inputMode="numeric" className="text-right" value={formatKetikRupiah(draf[u.id]!.pagu)} onChange={(e) => set(u.id, { pagu: e.target.value.replace(/\D/g, '') })} /></Bidang>
                </li>
              ))}
            </ul>
          </Kartu>
        )
      })}
      {pesan && <Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan>}
      <div className="sticky bottom-[4.25rem] z-20 -mx-4 border-t bg-white/95 px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur sm:bottom-0 sm:mx-0 sm:rounded-xl sm:border"><Tombol className="w-full sm:w-auto" onClick={simpan} sibuk={kirim.isPending} disabled={jumlahBerubah() === 0}>Simpan perubahan{jumlahBerubah() > 0 ? ` (${jumlahBerubah()})` : ''}</Tombol></div>
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
