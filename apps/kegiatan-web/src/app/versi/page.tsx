'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useVersi } from '@/hooks/useData'
import { formatTanggal } from '@/lib/format'
import type { JenisPerubahan } from '@/lib/tipe'
import { Logo } from '@/components/Logo'
import { Kartu, Lencana, Memuat, Pemberitahuan } from '@/components/ui'

const JENIS: Record<JenisPerubahan, { label: string; nada: 'hijau' | 'biru' | 'kuning' }> = {
  BARU: { label: 'Baru', nada: 'hijau' },
  PEMBARUAN: { label: 'Pembaruan', nada: 'biru' },
  PERBAIKAN: { label: 'Perbaikan', nada: 'kuning' },
}

/** Publik (tanpa login): riwayat versi supaya setiap pembaruan, penambahan, dan perbaikan dapat dilihat dan dirujuk. */
export default function HalamanVersi() {
  const { user } = useAuth()
  const versi = useVersi()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-marine-700 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Logo ukuran={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base">Apa yang baru</p>
            <p className="truncate text-xs text-marine-100">Kegiatan GKJ Jakarta</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <Link href={user ? '/program' : '/login'} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-marine-700">
          <ArrowLeft size={16} /> {user ? 'Kembali ke aplikasi' : 'Kembali ke halaman masuk'}
        </Link>
        {versi.isLoading && <Memuat />}
        {versi.isError && <Pemberitahuan nada="merah">Tidak dapat memuat catatan versi.</Pemberitahuan>}
        {versi.data && (
          <>
            <p className="text-sm text-gray-600">
              Versi berjalan <strong>{versi.data.versi}</strong> ({formatTanggal(versi.data.tanggal)}){versi.data.commit && <> · kode <span className="font-mono">{versi.data.commit}</span></>}
            </p>
            {versi.data.rilis.map((r) => (
              <Kartu key={r.versi} judul={<span>Versi {r.versi} <span className="text-sm font-normal text-gray-500">· {formatTanggal(r.tanggal)}</span></span>}>
                <p className="mb-3 font-medium text-marine-900">{r.judul}</p>
                <ul className="space-y-2">
                  {r.perubahan.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0"><Lencana nada={JENIS[p.jenis].nada}>{JENIS[p.jenis].label}</Lencana></span>
                      <span>{p.teks}</span>
                    </li>
                  ))}
                </ul>
              </Kartu>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
