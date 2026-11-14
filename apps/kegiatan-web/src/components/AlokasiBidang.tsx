'use client'

import clsx from 'clsx'
import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { formatKetikRupiah, formatRupiah } from '@/lib/format'
import type { Dashboard, Master } from '@/lib/tipe'
import { Input, Kartu, Lencana, Pemberitahuan, Tombol } from './ui'

/**
 * Alokasi indikatif per UPK dalam satu bidang (panduan ketua bidang, bukan batas keras). Pagu bidang ditetapkan keuangan dan
 * hanya dibaca di sini. Di samping tiap alokasi ditampilkan dana Gereja yang diusulkan, agar kekurangan dan sisa terlihat saat rapat.
 */
export function AlokasiBidang({ master, dashboard, bidangId }: { master: Master; dashboard: Dashboard | undefined; bidangId: number }) {
  const kirim = useKirimMaster()
  const bidang = master.bidang.find((b) => b.id === bidangId)
  const unit = master.unit.filter((u) => u.bidangId === bidangId && u.aktif && u.jenis === 'UPK')
  const [draf, setDraf] = useState<Record<number, string>>(() => Object.fromEntries(unit.map((u) => [u.id, String(u.pagu ?? 0)])))
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)
  const boleh = master.izin.alokasiBidangIds.includes(bidangId)

  if (!bidang) return null
  const paguBidang = master.paguBidang.find((p) => p.bidangId === bidangId)?.nilai ?? 0
  const alokasi = unit.reduce((n, u) => n + Number(draf[u.id] || 0), 0)
  const sisa = paguBidang - alokasi
  const berubah = unit.filter((u) => Number(draf[u.id] || 0) !== (u.pagu ?? 0))
  const barisDash = (id: number) => dashboard?.unit.find((d) => d.unitId === id)
  const barisBidang = dashboard?.bidang.find((b) => b.bidangId === bidangId)

  async function simpan() {
    try {
      for (const u of berubah) {
        await kirim.mutateAsync({ method: 'put', url: '/master/pagu', body: { tahunId: master.tahun.id, unitId: u.id, nilai: Number(draf[u.id] || 0), catatan: 'Alokasi ketua bidang' } })
      }
      setPesan({ nada: 'hijau', teks: `${berubah.length} alokasi tersimpan.` })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Angka label="Pagu bidang" nilai={formatRupiah(paguBidang)} sub="dana Gereja (Kas Jemaat)" />
        <Angka label="Dialokasikan ke UPK" nilai={formatRupiah(alokasi)} />
        <Angka label={sisa >= 0 ? 'Belum dialokasikan' : 'Alokasi melebihi pagu'} nilai={formatRupiah(Math.abs(sisa))} nada={sisa >= 0 ? 'hijau' : 'merah'} />
        <Angka
          label={barisBidang ? (barisBidang.tersedia >= 0 ? 'Sisa setelah usulan' : 'Usulan melebihi pagu') : 'Usulan dana Gereja'}
          nilai={barisBidang ? formatRupiah(Math.abs(barisBidang.tersedia)) : '—'}
          {...(barisBidang ? { nada: barisBidang.tersedia >= 0 ? ('hijau' as const) : ('merah' as const), sub: `usulan ${formatRupiah(barisBidang.gereja)}` } : {})}
        />
      </div>

      {!boleh && <Pemberitahuan nada="kuning">Alokasi hanya dapat diubah ketua bidang pada tahap pra-muker, atau oleh admin. Saat ini Anda dapat melihatnya.</Pemberitahuan>}

      <Kartu judul={`UPK di ${bidang.nama}`}>
        <ul className="space-y-3">
          {unit.map((u) => {
            const d = barisDash(u.id)
            const alok = Number(draf[u.id] || 0)
            const usulan = d?.gereja ?? 0
            const selisih = alok - usulan
            return (
              <li key={u.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{u.nama}</p>
                  {d?.klasifikasi === 'MANDIRI_PENUH' && <Lencana nada="hijau">Berjalan tanpa Kas Jemaat</Lencana>}
                  {d && d.jumlahDiajukan === 0 && <Lencana>Belum mengajukan</Lencana>}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-end">
                  <label className="text-xs text-gray-500">
                    Alokasi indikatif (Rp)
                    <Input inputMode="numeric" className="mt-1 text-right" disabled={!boleh} value={formatKetikRupiah(draf[u.id] ?? '0')} onChange={(e) => setDraf((x) => ({ ...x, [u.id]: e.target.value.replace(/\D/g, '') }))} />
                  </label>
                  <dl className="grid grid-cols-3 gap-2 text-[13px] sm:text-sm [&_dd]:whitespace-nowrap">
                    <div><dt className="text-xs text-gray-500">Usulan Gereja</dt><dd>{formatRupiah(usulan)}</dd></div>
                    <div><dt className="text-xs text-gray-500">Dana mandiri</dt><dd>{formatRupiah(d?.mandiri ?? 0)}</dd></div>
                    <div><dt className="text-xs text-gray-500">{selisih >= 0 ? 'Sisa alokasi' : 'Kurang'}</dt><dd className={clsx('font-medium', selisih < 0 ? 'text-red-700' : 'text-green-700')}>{formatRupiah(Math.abs(selisih))}</dd></div>
                  </dl>
                </div>
              </li>
            )
          })}
          {unit.length === 0 && <li className="text-sm text-gray-500">Belum ada UPK di bidang ini.</li>}
        </ul>
      </Kartu>

      {pesan && <Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan>}
      {boleh && (
        <div className="sticky bottom-[4.25rem] z-20 -mx-4 border-t bg-white/95 px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur sm:bottom-0 sm:mx-0 sm:rounded-xl sm:border">
          <Tombol className="w-full sm:w-auto" onClick={simpan} sibuk={kirim.isPending} disabled={berubah.length === 0}>Simpan alokasi{berubah.length > 0 ? ` (${berubah.length})` : ''}</Tombol>
        </div>
      )}
    </div>
  )
}

function Angka({ label, nilai, sub, nada }: { label: string; nilai: string; sub?: string; nada?: 'hijau' | 'merah' }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={clsx('mt-1 whitespace-nowrap text-base font-bold sm:text-xl', nada === 'hijau' && 'text-green-700', nada === 'merah' && 'text-red-700', !nada && 'text-marine-900')}>{nilai}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
