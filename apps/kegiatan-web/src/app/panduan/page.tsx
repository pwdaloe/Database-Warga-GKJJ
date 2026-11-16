'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronDown, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDukunganPublik } from '@/hooks/useData'
import { tautanMasukanPanduan } from '@/lib/dukungan'
import { BAGIAN_FORMULIR, ISTILAH, LANGKAH_AJUKAN, PANDUAN_PERAN, TAHAP_PANDUAN, TANYA_JAWAB, indeksPeran } from '@/lib/panduan'
import { Logo } from '@/components/Logo'
import { Shell } from '@/components/Shell'
import { Kartu, Lencana, Pemberitahuan } from '@/components/ui'

const BAGIAN_NAV = [
  { id: 'mulai', label: 'Mulai di sini' },
  { id: 'formulir', label: 'Cara mengisi formulir' },
  { id: 'peran', label: 'Per peran' },
  { id: 'istilah', label: 'Pertanyaan dan istilah' },
  { id: 'masukan', label: 'Kirim masukan' },
] as const

/** Dapat dibuka tanpa masuk. Pengguna yang sudah masuk melihatnya di dalam kerangka aplikasi (menu tetap ada). */
export default function HalamanPanduan() {
  const { user } = useAuth()
  const masuk = !!user && !user.wajibGantiPassword
  const isi = <IsiPanduan />
  if (masuk) return <Shell>{isi}</Shell>
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-marine-700 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Logo ukuran={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base">Panduan</p>
            <p className="truncate text-xs text-marine-100">Kegiatan GKJ Jakarta</p>
          </div>
        </div>
      </header>
      <div className="px-4 py-5">
        <Link href={user ? '/ganti-password' : '/login'} className="mx-auto mb-2 flex min-h-[44px] max-w-3xl items-center gap-1.5 text-sm text-marine-700">
          <ArrowLeft size={16} /> {user ? 'Kembali' : 'Kembali ke halaman masuk'}
        </Link>
        {isi}
      </div>
    </div>
  )
}

function IsiPanduan() {
  const { user } = useAuth()
  const masuk = !!user && !user.wajibGantiPassword
  const dukungan = useDukunganPublik()
  const [tab, setTab] = useState(0)
  useEffect(() => { if (masuk) setTab(indeksPeran(user?.peran)) }, [masuk, user?.peran])

  const wa = tautanMasukanPanduan(dukungan.data, masuk && user ? { nama: user.nama, unit: user.unit?.nama ?? null } : null)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-marine-900">Panduan</h1>
        <p className="mt-1 text-sm text-gray-600">Alur siklus anggaran dan cara mengisi formulir kegiatan RKA 2027, sesuai aplikasi yang berjalan sekarang.</p>
      </div>

      <nav aria-label="Isi panduan" className="flex flex-wrap gap-2">
        {BAGIAN_NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} className="inline-flex min-h-[44px] items-center rounded-full border bg-white px-3.5 text-sm text-marine-700 hover:bg-marine-50">{n.label}</a>
        ))}
      </nav>

      <section id="mulai" className="scroll-mt-20 space-y-3">
        <Kartu judul="Mulai di sini: alur siklus anggaran">
          <p className="mb-3 text-sm text-gray-600">Tahap tampil di spanduk atas aplikasi. Siapa yang boleh mengubah kegiatan bergantung pada tahap.</p>
          <ol className="space-y-3">
            {TAHAP_PANDUAN.map((t, i) => (
              <li key={t.kode} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marine-700 text-xs font-semibold text-white">{i + 1}</span>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-marine-900">{t.nama}</p>
                  <p className="text-gray-500">Yang mengubah: {t.siapa}</p>
                  <p className="mt-0.5">{t.apa}</p>
                </div>
              </li>
            ))}
          </ol>
        </Kartu>
        <Kartu judul="Langkah singkat mengajukan kegiatan">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {LANGKAH_AJUKAN.map((l) => <li key={l}>{l}</li>)}
          </ol>
          <p className="mt-3 text-sm">
            <Link href={masuk ? '/program/baru' : '/login'} className="font-medium text-marine-700 underline-offset-2 hover:underline">
              {masuk ? 'Buka formulir Kegiatan baru' : 'Masuk untuk membuka formulir'}
            </Link>
          </p>
        </Kartu>
      </section>

      <section id="formulir" className="scroll-mt-20 space-y-3">
        <h2 className="text-base font-semibold text-marine-900">Cara mengisi formulir</h2>
        <p className="text-sm text-gray-600">Satu kartu untuk setiap bagian di formulir, urut dari 1 sampai 10. Ketuk judul untuk membuka. Contoh hanya ilustrasi; hitung dan tulis dari kebutuhan kegiatan Anda sendiri.</p>
        {BAGIAN_FORMULIR.map((b) => (
          <details key={b.no} className="group rounded-xl border bg-white shadow-sm open:shadow">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marine-700 text-xs font-semibold text-white">{b.no}</span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-marine-900 sm:text-base">{b.judul}{b.wajib && <span className="ml-1 text-red-600" aria-label="wajib">*</span>}</span>
              <ChevronDown size={18} className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-3 border-t px-4 py-4 text-sm">
              <p><span className="font-medium">Tujuan: </span>{b.tujuan}</p>
              <div>
                <p className="mb-1 font-medium">Cara mengisi</p>
                <ul className="list-disc space-y-1 pl-5">{b.cara.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
              {b.contoh && <Pemberitahuan nada="hijau" judul="Contoh (ilustrasi)">{b.contoh}</Pemberitahuan>}
              <div>
                <p className="mb-1 font-medium">Kesalahan yang sering terjadi</p>
                <ul className="list-disc space-y-1 pl-5 text-gray-700">{b.kesalahan.map((k) => <li key={k}>{k}</li>)}</ul>
              </div>
            </div>
          </details>
        ))}
      </section>

      <section id="peran" className="scroll-mt-20 space-y-3">
        <h2 className="text-base font-semibold text-marine-900">Per peran</h2>
        <div role="tablist" aria-label="Pilih peran" className="flex flex-wrap gap-2">
          {PANDUAN_PERAN.map((p, i) => (
            <button key={p.judul} role="tab" id={`tab-peran-${i}`} aria-selected={tab === i} aria-controls="panel-peran" onClick={() => setTab(i)}
              className={clsx('min-h-[44px] rounded-full border px-3.5 text-sm', tab === i ? 'border-marine-700 bg-marine-700 text-white' : 'bg-white text-marine-700 hover:bg-marine-50')}>
              {p.judul}
            </button>
          ))}
        </div>
        {PANDUAN_PERAN[tab] && (
          <Kartu judul={<span>{PANDUAN_PERAN[tab].judul}{masuk && user && PANDUAN_PERAN[tab].peran.includes(user.peran) && <span className="ml-2 align-middle"><Lencana nada="hijau">Peran Anda</Lencana></span>}</span>}>
            <div role="tabpanel" id="panel-peran" aria-labelledby={`tab-peran-${tab}`}>
              <p className="mb-2 text-sm text-gray-600">{PANDUAN_PERAN[tab].intro}</p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">{PANDUAN_PERAN[tab].langkah.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          </Kartu>
        )}
      </section>

      <section id="istilah" className="scroll-mt-20 space-y-3">
        <h2 className="text-base font-semibold text-marine-900">Pertanyaan dan istilah</h2>
        <Kartu judul="Pertanyaan yang sering muncul">
          <div className="divide-y">
            {TANYA_JAWAB.map((t) => (
              <div key={t.tanya} className="py-3 first:pt-0 last:pb-0 text-sm">
                <p className="font-medium text-marine-900">{t.tanya}</p>
                <p className="mt-1 text-gray-700">{t.jawab}</p>
              </div>
            ))}
          </div>
        </Kartu>
        <Kartu judul="Istilah">
          <dl className="divide-y">
            {ISTILAH.map((s) => (
              <div key={s.istilah} className="py-3 first:pt-0 last:pb-0 text-sm sm:grid sm:grid-cols-[11rem_1fr] sm:gap-3">
                <dt className="font-medium text-marine-900">{s.istilah}</dt>
                <dd className="mt-0.5 text-gray-700 sm:mt-0">{s.arti}</dd>
              </div>
            ))}
          </dl>
        </Kartu>
      </section>

      <section id="masukan" className="scroll-mt-20 pb-6">
        <Kartu judul="Kirim masukan">
          <p className="text-sm text-gray-700">Ada bagian yang kurang jelas, salah, atau belum ada? Kirim masukan lewat WhatsApp pusat bantuan; pesan awalnya sudah disiapkan, tinggal Anda lengkapi.</p>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-marine-700 px-4 text-sm font-medium text-white hover:bg-marine-600">
              <MessageCircle size={18} /> Kirim masukan lewat WhatsApp
            </a>
          ) : (
            <p className="mt-3 text-sm text-gray-500">{dukungan.isLoading ? 'Memuat…' : 'Bantuan WhatsApp belum diaktifkan. Sampaikan masukan langsung kepada sekretariat.'}</p>
          )}
        </Kartu>
      </section>
    </div>
  )
}
