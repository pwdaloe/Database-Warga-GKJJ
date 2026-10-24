'use client'

import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard, useMaster } from '@/hooks/useData'
import { formatRupiah, persen } from '@/lib/format'
import type { StatusPagu } from '@/lib/tipe'
import { Kartu, Lencana, Memuat, Pemberitahuan } from '@/components/ui'
import { BannerPengajuan } from '@/components/BannerPengajuan'

const STATUS: Record<StatusPagu, { label: string; nada: 'hijau' | 'merah' | 'kuning' | 'abu'; baris: string }> = {
  UNDER: { label: 'Di bawah pagu', nada: 'hijau', baris: 'bg-green-50' },
  OVER: { label: 'Melebihi pagu', nada: 'merah', baris: 'bg-red-50' },
  SESUAI: { label: 'Sesuai pagu', nada: 'kuning', baris: 'bg-yellow-50' },
  BELUM_MENGAJUKAN: { label: 'Belum mengajukan', nada: 'abu', baris: '' },
}

export default function HalamanDashboard() {
  const { adalah } = useAuth()
  const dash = useDashboard()
  const master = useMaster()
  if (dash.isLoading || master.isLoading) return <Memuat />
  if (dash.isError || !dash.data) return <Pemberitahuan nada="merah">Tidak dapat memuat dashboard.</Pemberitahuan>

  const d = dash.data
  const t = d.total
  const semua = adalah('ADMIN', 'SEKRETARIAT', 'MAJELIS')

  return (
    <div className="space-y-5">
      {master.data && <BannerPengajuan tahun={master.data.tahun} />}
      <div>
        <h1 className="text-lg font-bold text-marine-900 sm:text-xl">Pagu dan pengajuan</h1>
        <p className="text-sm text-gray-500">{d.tahun.nama}. Hanya program berstatus <strong>Diajukan</strong> dihitung sebagai pengajuan; draft ditampilkan terpisah.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Ringkas label={semua ? 'Total pagu' : 'Pagu'} nilai={formatRupiah(t.pagu)} />
        <Ringkas label="Total pengajuan" nilai={formatRupiah(t.pengajuan)} sub={`${t.jumlahDiajukan} program diajukan${t.jumlahDraft ? `, ${t.jumlahDraft} draft` : ''}`} />
        <Ringkas label={t.tersedia >= 0 ? 'Budget tersedia' : 'Melebihi pagu'} nilai={formatRupiah(Math.abs(t.tersedia))} nada={t.tersedia >= 0 ? 'hijau' : 'merah'} />
        <Ringkas label="Dana mandiri" nilai={t.rasioKemandirian === null ? '—' : `${Math.round(t.rasioKemandirian * 100)}%`} sub={`${formatRupiah(t.mandiri)} dari ${formatRupiah(t.gereja + t.mandiri)}`} />
      </div>

      {semua && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS) as StatusPagu[]).map((s) => <Lencana key={s} nada={STATUS[s].nada}>{STATUS[s].label}: {d.ringkasStatus[s]}</Lencana>)}
        </div>
      )}

      <Kartu judul="Per unit">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr><th className="py-2 pr-3">Unit</th><th className="px-3 text-right">Pagu</th><th className="px-3 text-right">Pengajuan</th><th className="px-3 text-right">Tersedia</th><th className="px-3 text-right">Draft</th><th className="px-3 text-right">Gereja</th><th className="px-3 text-right">Mandiri</th><th className="pl-3">Status</th></tr>
            </thead>
            <tbody>
              {d.unit.map((u) => (
                <tr key={u.unitId} className={clsx('border-t', STATUS[u.status].baris)}>
                  <td className="py-2 pr-3 font-medium">{u.nama}{u.jenis === 'POS' && <span className="ml-1 text-xs text-gray-500">(pos)</span>}</td>
                  <td className="px-3 text-right">{formatRupiah(u.pagu)}</td>
                  <td className="px-3 text-right">{formatRupiah(u.pengajuan)}</td>
                  <td className={clsx('px-3 text-right font-medium', u.tersedia < 0 && 'text-red-700')}>{formatRupiah(u.tersedia)}</td>
                  <td className="px-3 text-right text-gray-500">{u.jumlahDraft ? formatRupiah(u.draft) : '—'}</td>
                  <td className="px-3 text-right">{formatRupiah(u.gereja)}</td>
                  <td className="px-3 text-right">{formatRupiah(u.mandiri)}</td>
                  <td className="pl-3"><Lencana nada={STATUS[u.status].nada}>{STATUS[u.status].label}</Lencana></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr><td className="py-2 pr-3">Total</td><td className="px-3 text-right">{formatRupiah(t.pagu)}</td><td className="px-3 text-right">{formatRupiah(t.pengajuan)}</td><td className="px-3 text-right">{formatRupiah(t.tersedia)}</td><td className="px-3 text-right">{formatRupiah(t.draft)}</td><td className="px-3 text-right">{formatRupiah(t.gereja)}</td><td className="px-3 text-right">{formatRupiah(t.mandiri)}</td><td /></tr>
            </tfoot>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {d.unit.map((u) => (
            <li key={u.unitId} className={clsx('rounded-lg border p-3', STATUS[u.status].baris)}>
              <div className="flex items-start justify-between gap-2"><p className="font-medium">{u.nama}</p><Lencana nada={STATUS[u.status].nada}>{STATUS[u.status].label}</Lencana></div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-gray-500">Pagu</dt><dd>{formatRupiah(u.pagu)}</dd></div>
                <div><dt className="text-xs text-gray-500">Pengajuan</dt><dd>{formatRupiah(u.pengajuan)}</dd></div>
                <div><dt className="text-xs text-gray-500">Tersedia</dt><dd className={clsx(u.tersedia < 0 && 'font-medium text-red-700')}>{formatRupiah(u.tersedia)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      </Kartu>

      {semua && d.bidang.length > 0 && (
        <Kartu judul="Per bidang">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500"><tr><th className="py-2 pr-3">Bidang</th><th className="px-3 text-right">Unit</th><th className="px-3 text-right">Pagu</th><th className="px-3 text-right">Pengajuan</th><th className="pl-3 text-right">Tersedia</th></tr></thead>
            <tbody>{d.bidang.map((b) => (
              <tr key={b.bidangId} className="border-t"><td className="py-2 pr-3 font-medium">{b.nama}</td><td className="px-3 text-right">{b.jumlahUnit}</td><td className="px-3 text-right">{formatRupiah(b.pagu)}</td><td className="px-3 text-right">{formatRupiah(b.pengajuan)}</td><td className={clsx('pl-3 text-right', b.tersedia < 0 && 'text-red-700')}>{formatRupiah(b.tersedia)}</td></tr>
            ))}</tbody>
          </table></div>
        </Kartu>
      )}

      {d.acuan.length > 0 && (
        <Kartu judul="Keselarasan dengan visi dan misi">
          <p className="mb-3 text-sm text-gray-500">Program yang menaut ke beberapa acuan terhitung penuh pada tiap acuan (jumlahnya tidak boleh dijumlahkan). Acuan tanpa program menandakan celah.</p>
          <ul className="space-y-2">
            {d.acuan.filter((a) => a.jenis !== 'VISI').map((a) => (
              <li key={a.acuanId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <span className="font-medium">{a.nama}</span>
                <span className="text-gray-600">{a.jumlahProgram} program · {formatRupiah(a.totalRabTerkait)} <span className="text-xs text-gray-400">({persen(a.totalRabTerkait, t.pengajuan)} dari pengajuan)</span></span>
              </li>
            ))}
          </ul>
        </Kartu>
      )}
    </div>
  )
}

function Ringkas({ label, nilai, sub, nada }: { label: string; nilai: string; sub?: string; nada?: 'hijau' | 'merah' }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={clsx('mt-1 text-lg font-bold sm:text-xl', nada === 'hijau' && 'text-green-700', nada === 'merah' && 'text-red-700', !nada && 'text-marine-900')}>{nilai}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
