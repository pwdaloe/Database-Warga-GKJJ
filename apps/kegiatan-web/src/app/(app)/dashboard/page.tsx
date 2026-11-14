'use client'

import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard, useMaster } from '@/hooks/useData'
import { formatRupiah, persen } from '@/lib/format'
import { PERAN_LIHAT_SEMUA, type KlasifikasiPendanaan, type StatusPagu } from '@/lib/tipe'
import { Kartu, Lencana, Memuat, Pemberitahuan } from '@/components/ui'
import { BannerPengajuan } from '@/components/BannerPengajuan'

const STATUS: Record<StatusPagu, { label: string; nada: 'hijau' | 'merah' | 'kuning' | 'abu' | 'biru'; baris: string }> = {
  UNDER: { label: 'Di bawah pagu', nada: 'hijau', baris: 'bg-green-50' },
  OVER: { label: 'Melebihi pagu', nada: 'merah', baris: 'bg-red-50' },
  SESUAI: { label: 'Sesuai pagu', nada: 'kuning', baris: 'bg-yellow-50' },
  MANDIRI: { label: 'Tanpa Kas Jemaat', nada: 'hijau', baris: 'bg-emerald-50' },
  BELUM_MENGAJUKAN: { label: 'Belum mengajukan', nada: 'abu', baris: '' },
}

const KLASIFIKASI: Record<KlasifikasiPendanaan, { label: string; nada: 'hijau' | 'kuning' | 'biru' }> = {
  MANDIRI_PENUH: { label: 'Mandiri penuh', nada: 'hijau' },
  CAMPURAN: { label: 'Campuran', nada: 'kuning' },
  BERGANTUNG_KAS: { label: 'Bergantung Kas Jemaat', nada: 'biru' },
}

export default function HalamanDashboard() {
  const { adalah } = useAuth()
  const dash = useDashboard()
  const master = useMaster()
  if (dash.isLoading || master.isLoading) return <Memuat />
  if (dash.isError || !dash.data) return <Pemberitahuan nada="merah">Tidak dapat memuat dashboard.</Pemberitahuan>

  const d = dash.data
  const t = d.total
  const semua = adalah(...PERAN_LIHAT_SEMUA)
  const tanpaKas = d.unit.filter((u) => u.program.mandiriPenuh > 0)

  return (
    <div className="space-y-5">
      {master.data && <BannerPengajuan tahun={master.data.tahun} />}
      <div>
        <h1 className="text-lg font-bold text-marine-900 sm:text-xl">Pagu dan pengajuan</h1>
        <p className="text-sm text-gray-500">{d.tahun.nama}. Pagu dibandingkan dengan <strong>dana Gereja (Kas Jemaat)</strong> yang diminta; biaya yang ditutup swadaya, penggalangan, atau donasi tidak memakai pagu. Hanya program <strong>Diajukan</strong> dihitung.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Ringkas label={semua ? 'Total pagu' : 'Pagu'} nilai={formatRupiah(t.pagu)} {...(semua && t.proyeksiKasJemaat ? { sub: `proyeksi Kas Jemaat ${formatRupiah(t.proyeksiKasJemaat)}` } : {})} />
        <Ringkas label="Dana Gereja diminta" nilai={formatRupiah(t.gereja)} sub={`${t.jumlahDiajukan} program diajukan${t.jumlahDraft ? `, ${t.jumlahDraft} draft` : ''}`} />
        <Ringkas label={t.tersedia >= 0 ? 'Pagu tersedia' : 'Melebihi pagu'} nilai={formatRupiah(Math.abs(t.tersedia))} nada={t.tersedia >= 0 ? 'hijau' : 'merah'} />
        <Ringkas label="Dana mandiri" nilai={formatRupiah(t.mandiri)} {...(t.rasioKemandirian === null ? {} : { sub: `${Math.round(t.rasioKemandirian * 100)}% dari seluruh pendanaan` })} />
      </div>

      {semua && t.selisihProyeksi !== null && t.proyeksiKasJemaat ? (
        <Pemberitahuan nada={t.selisihProyeksi >= 0 ? 'hijau' : 'merah'} judul={t.selisihProyeksi >= 0 ? 'Total pagu masih di bawah proyeksi Kas Jemaat' : 'Total pagu melebihi proyeksi Kas Jemaat'}>
          Selisih {formatRupiah(Math.abs(t.selisihProyeksi))} ({persen(t.pagu, t.proyeksiKasJemaat)} dari proyeksi dipakai sebagai pagu).
        </Pemberitahuan>
      ) : null}

      <Kartu judul="Bisa berjalan tanpa Kas Jemaat?">
        <div className="mb-3 flex flex-wrap gap-2">
          <Lencana nada="hijau">Mandiri penuh: {t.program.mandiriPenuh} program</Lencana>
          <Lencana nada="kuning">Campuran: {t.program.campuran}</Lencana>
          <Lencana nada="biru">Bergantung Kas Jemaat: {t.program.bergantungKas}</Lencana>
        </div>
        <p className="mb-3 text-sm text-gray-500">Program <strong>mandiri penuh</strong> tertutup seluruhnya oleh swadaya (kas UPK), penggalangan dana, atau donasi, tanpa dana Gereja. Nilainya {formatRupiah(t.rabTanpaKas)}.</p>
        {tanpaKas.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada program yang berjalan tanpa dana Gereja.</p>
        ) : (
          <ul className="space-y-2">
            {tanpaKas.map((u) => (
              <li key={u.unitId} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{u.nama}</p>
                  <span className="text-gray-600">{u.program.mandiriPenuh} dari {u.jumlahDiajukan} program mandiri penuh · {formatRupiah(u.rabTanpaKas)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kartu>

      {d.bidang.length > 0 && (
        <Kartu judul="Per bidang">
          <p className="mb-3 text-sm text-gray-500">Pagu bidang adalah batas dana Gereja bidang. Sisa dapat dialokasikan ke kegiatan lain; kekurangan dibahas di muker.</p>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500"><tr><th className="py-2 pr-3">Bidang</th><th className="px-3 text-right">Pagu</th><th className="px-3 text-right">Dialokasikan</th><th className="px-3 text-right">Dana Gereja diminta</th><th className="px-3 text-right">Tersedia</th><th className="px-3 text-right">Mandiri</th><th className="pl-3">Status</th></tr></thead>
              <tbody>{d.bidang.map((b) => (
                <tr key={b.bidangId} className={clsx('border-t', STATUS[b.status].baris)}>
                  <td className="py-2 pr-3 font-medium">{b.nama}</td>
                  <td className="px-3 text-right">{formatRupiah(b.pagu)}</td>
                  <td className="px-3 text-right text-gray-500">{b.belumDialokasikan !== 0 || b.alokasiTerbagi !== b.pagu ? formatRupiah(b.alokasiTerbagi) : '—'}</td>
                  <td className="px-3 text-right">{formatRupiah(b.gereja)}</td>
                  <td className={clsx('px-3 text-right font-medium', b.tersedia < 0 && 'text-red-700')}>{formatRupiah(b.tersedia)}</td>
                  <td className="px-3 text-right">{formatRupiah(b.mandiri)}</td>
                  <td className="pl-3"><Lencana nada={STATUS[b.status].nada}>{STATUS[b.status].label}</Lencana></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {d.bidang.map((b) => (
              <li key={b.bidangId} className={clsx('rounded-lg border p-3', STATUS[b.status].baris)}>
                <div className="flex items-start justify-between gap-2"><p className="font-medium">{b.nama}</p><Lencana nada={STATUS[b.status].nada}>{STATUS[b.status].label}</Lencana></div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-[13px] sm:text-sm [&_dd]:whitespace-nowrap">
                  <div><dt className="text-xs text-gray-500">Pagu</dt><dd>{formatRupiah(b.pagu)}</dd></div>
                  <div><dt className="text-xs text-gray-500">Dana Gereja</dt><dd>{formatRupiah(b.gereja)}</dd></div>
                  <div><dt className="text-xs text-gray-500">Tersedia</dt><dd className={clsx(b.tersedia < 0 && 'font-medium text-red-700')}>{formatRupiah(b.tersedia)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </Kartu>
      )}

      <Kartu judul="Per unit">
        {semua && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(STATUS) as StatusPagu[]).map((s) => <Lencana key={s} nada={STATUS[s].nada}>{STATUS[s].label}: {d.ringkasStatus[s]}</Lencana>)}
          </div>
        )}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr><th className="py-2 pr-3">Unit</th><th className="px-3 text-right">Alokasi / pagu</th><th className="px-3 text-right">Dana Gereja</th><th className="px-3 text-right">Tersedia</th><th className="px-3 text-right">Swadaya</th><th className="px-3 text-right">Penggalangan</th><th className="px-3 text-right">Donasi</th><th className="px-3 text-right">Draft</th><th className="pl-3">Pendanaan</th></tr>
            </thead>
            <tbody>
              {d.unit.map((u) => (
                <tr key={u.unitId} className={clsx('border-t', STATUS[u.status].baris)}>
                  <td className="py-2 pr-3 font-medium">{u.nama}{u.jenis === 'POS' && <span className="ml-1 text-xs text-gray-500">(pos)</span>}</td>
                  <td className="px-3 text-right">{formatRupiah(u.pagu)}</td>
                  <td className="px-3 text-right">{formatRupiah(u.gereja)}</td>
                  <td className={clsx('px-3 text-right font-medium', u.tersedia < 0 && 'text-red-700')}>{formatRupiah(u.tersedia)}</td>
                  <td className="px-3 text-right">{formatRupiah(u.swadaya)}</td>
                  <td className="px-3 text-right">{formatRupiah(u.penggalangan)}</td>
                  <td className="px-3 text-right">{formatRupiah(u.donasi)}</td>
                  <td className="px-3 text-right text-gray-500">{u.jumlahDraft ? formatRupiah(u.draft) : '—'}</td>
                  <td className="pl-3">{u.klasifikasi ? <Lencana nada={KLASIFIKASI[u.klasifikasi].nada}>{KLASIFIKASI[u.klasifikasi].label}</Lencana> : <Lencana nada={STATUS[u.status].nada}>{STATUS[u.status].label}</Lencana>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr><td className="py-2 pr-3">Total</td><td className="px-3 text-right">{formatRupiah(d.unit.reduce((n, u) => n + u.pagu, 0))}</td><td className="px-3 text-right">{formatRupiah(t.gereja)}</td><td className="px-3 text-right">{formatRupiah(t.tersedia)}</td><td className="px-3 text-right">{formatRupiah(t.swadaya)}</td><td className="px-3 text-right">{formatRupiah(t.penggalangan)}</td><td className="px-3 text-right">{formatRupiah(t.donasi)}</td><td className="px-3 text-right">{formatRupiah(t.draft)}</td><td /></tr>
            </tfoot>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {d.unit.map((u) => (
            <li key={u.unitId} className={clsx('rounded-lg border p-3', STATUS[u.status].baris)}>
              <div className="flex items-start justify-between gap-2"><p className="font-medium">{u.nama}</p>{u.klasifikasi ? <Lencana nada={KLASIFIKASI[u.klasifikasi].nada}>{KLASIFIKASI[u.klasifikasi].label}</Lencana> : <Lencana nada={STATUS[u.status].nada}>{STATUS[u.status].label}</Lencana>}</div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-[13px] sm:text-sm [&_dd]:whitespace-nowrap">
                <div><dt className="text-xs text-gray-500">Alokasi</dt><dd>{formatRupiah(u.pagu)}</dd></div>
                <div><dt className="text-xs text-gray-500">Dana Gereja</dt><dd>{formatRupiah(u.gereja)}</dd></div>
                <div><dt className="text-xs text-gray-500">Tersedia</dt><dd className={clsx(u.tersedia < 0 && 'font-medium text-red-700')}>{formatRupiah(u.tersedia)}</dd></div>
              </dl>
              {u.mandiri > 0 && (
                <p className="mt-2 text-xs text-gray-600">Mandiri {formatRupiah(u.mandiri)}: swadaya {formatRupiah(u.swadaya)} · penggalangan {formatRupiah(u.penggalangan)} · donasi {formatRupiah(u.donasi)}</p>
              )}
            </li>
          ))}
        </ul>
      </Kartu>

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
      <p className={clsx('mt-1 whitespace-nowrap text-base font-bold sm:text-xl', nada === 'hijau' && 'text-green-700', nada === 'merah' && 'text-red-700', !nada && 'text-marine-900')}>{nilai}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
