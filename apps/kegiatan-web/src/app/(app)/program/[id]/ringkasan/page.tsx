'use client'

import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import { useMaster, useProgram } from '@/hooks/useData'
import { formatRupiah, formatTanggal, persen } from '@/lib/format'
import { LABEL_JENIS_PROGRAM, LABEL_SUMBER, LABEL_WAKTU } from '@/lib/programForm'
import { Memuat, Pemberitahuan, Tombol } from '@/components/ui'

function Baris({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <tr className="border-b align-top last:border-0">
      <th className="w-40 bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-700 sm:w-56">{k}</th>
      <td className="px-3 py-2 text-sm whitespace-pre-line">{v || '—'}</td>
    </tr>
  )
}

/** Ringkasan satu halaman untuk Formulir RKA (bagian 10 Contoh Program Kerja) + seluruh isi, siap cetak. */
export default function Ringkasan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const program = useProgram(Number(id))
  const master = useMaster(program.data?.tahun.id)
  if (program.isLoading || master.isLoading) return <Memuat />
  if (!program.data || !master.data) return <Pemberitahuan nada="merah">Program tidak ditemukan.</Pemberitahuan>

  const p = program.data
  const acuan = master.data.acuan.filter((a) => p.acuanIds.includes(a.id)).map((a) => a.nama).join('; ')
  const kegiatan = p.jadwal.map((j) => j.nama).join('; ')

  return (
    <article className="space-y-5 bg-white p-4 sm:p-8">
      <div className="tanpa-cetak flex flex-wrap items-center justify-between gap-2">
        <Link href={`/program/${p.id}`} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-marine-700"><ArrowLeft size={16} /> Kembali ke program</Link>
        <Tombol onClick={() => window.print()}><Printer size={16} /> Cetak / simpan PDF</Tombol>
      </div>

      <header className="border-b pb-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">GKJ Jakarta · Rencana Kerja dan Anggaran {p.tahun.tahun}</p>
        <h1 className="mt-1 text-xl font-bold text-marine-900">{p.judul}</h1>
        <p className="text-sm text-gray-600">{p.unit.nama}{p.nomor ? ` · ${p.nomor}` : ''} · {p.status === 'DIAJUKAN' ? `Diajukan ${formatTanggal(p.diajukanPada)}` : 'Draft (belum diajukan)'}</p>
      </header>

      <section>
        <h2 className="mb-2 font-semibold">Ringkasan untuk Formulir RKA</h2>
        <table className="w-full border text-left">
          <tbody>
            <Baris k="Program" v={p.judul} />
            <Baris k="Kebutuhan" v={p.kebutuhan} />
            <Baris k="Acuan visi–misi" v={acuan} />
            <Baris k="Tujuan" v={p.tujuan} />
            <Baris k="Kegiatan" v={kegiatan} />
            <Baris k="Anggaran" v={<strong>{formatRupiah(p.totalRab)}</strong>} />
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">1. Identitas</h2>
        <table className="w-full border text-left"><tbody>
          <Baris k="UPK / pos" v={p.unit.nama} />
          <Baris k="Jenis program" v={LABEL_JENIS_PROGRAM[p.jenisProgram]} />
          <Baris k="Penanggung jawab" v={[p.picNama, p.picWhatsapp].filter(Boolean).join(' · ')} />
          <Baris k="Sasaran / penerima" v={p.sasaranPenerima} />
          <Baris k="Target peserta" v={p.targetPeserta != null ? `${p.targetPeserta} orang` : ''} />
        </tbody></table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">2–3. Latar belakang dan kebutuhan</h2>
        <table className="w-full border text-left"><tbody>
          <Baris k="Latar belakang" v={p.latarBelakang} />
          <Baris k="Rumusan kebutuhan" v={p.kebutuhan} />
        </tbody></table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">4. Rencana kegiatan dan jadwal</h2>
        <div className="overflow-x-auto"><table className="w-full border text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Kegiatan</th><th className="px-3 py-2 text-left">Waktu</th><th className="px-3 py-2 text-left">Hasil langsung</th></tr></thead>
          <tbody>{p.jadwal.map((j) => (
            <tr key={j.id} className="border-t align-top">
              <td className="px-3 py-2">{j.nama}{j.lokasi ? <span className="block text-xs text-gray-500">{j.lokasi}</span> : null}</td>
              <td className="px-3 py-2">{LABEL_WAKTU[j.kategoriWaktu]}{j.tanggalMulai ? `: ${formatTanggal(j.tanggalMulai)}` : ''}{j.tanggalSelesai ? ` – ${formatTanggal(j.tanggalSelesai)}` : ''}{j.keteranganPeriode ? ` (${j.keteranganPeriode})` : ''}</td>
              <td className="px-3 py-2">{j.hasilLangsung ?? '—'}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">5. Indikator keberhasilan</h2>
        <div className="overflow-x-auto"><table className="w-full border text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Indikator</th><th className="px-3 py-2 text-left">Target</th><th className="px-3 py-2 text-left">Bukti</th></tr></thead>
          <tbody>{p.indikator.map((i) => <tr key={i.id} className="border-t"><td className="px-3 py-2">{i.indikator}</td><td className="px-3 py-2">{i.target}</td><td className="px-3 py-2">{i.bukti}</td></tr>)}</tbody>
        </table></div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">6. Rencana anggaran biaya</h2>
        <div className="overflow-x-auto"><table className="w-full border text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Komponen biaya</th><th className="px-3 py-2 text-left">Perhitungan</th><th className="px-3 py-2 text-right">Jumlah</th></tr></thead>
          <tbody>
            {p.rab.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-3 py-2">{r.uraian}{r.kategori ? <span className="block text-xs text-gray-500">{r.kategori}</span> : null}</td>
                <td className="px-3 py-2">{r.perhitungan ? `${r.perhitungan} — ` : ''}{r.volume} {r.satuan} × {formatRupiah(r.hargaSatuan)}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(r.jumlah)}</td>
              </tr>
            ))}
            <tr className="border-t bg-gray-50 font-semibold"><td className="px-3 py-2" colSpan={2}>TOTAL ANGGARAN</td><td className="px-3 py-2 text-right">{formatRupiah(p.totalRab)}</td></tr>
          </tbody>
        </table></div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">7. Sumber dana</h2>
        <div className="overflow-x-auto"><table className="w-full border text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Sumber</th><th className="px-3 py-2 text-left">Keterangan</th><th className="px-3 py-2 text-right">Jumlah</th></tr></thead>
          <tbody>
            {p.sumberDana.map((s) => <tr key={s.jenis} className="border-t"><td className="px-3 py-2">{LABEL_SUMBER[s.jenis]}</td><td className="px-3 py-2">{s.keterangan ?? '—'}</td><td className="px-3 py-2 text-right">{formatRupiah(s.nilai)}</td></tr>)}
            <tr className="border-t bg-gray-50 font-semibold"><td className="px-3 py-2" colSpan={2}>Total sumber dana ({persen(p.mandiri, p.totalSumberDana)} mandiri)</td><td className="px-3 py-2 text-right">{formatRupiah(p.totalSumberDana)}</td></tr>
          </tbody>
        </table></div>
        {p.selisih !== 0 && <p className="mt-2 text-sm text-red-700">Perhatian: total sumber dana berbeda {formatRupiah(Math.abs(p.selisih))} dari total anggaran.</p>}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">8. Evaluasi dan pelaporan</h2>
        <table className="w-full border text-left"><tbody><Baris k="Rencana evaluasi" v={p.evaluasi} /></tbody></table>
      </section>
    </article>
  )
}
