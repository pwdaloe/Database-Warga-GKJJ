'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { tautanDukungan } from '@/lib/dukungan'
import type { Master } from '@/lib/tipe'
import { Bidang, Input, Kartu, Pemberitahuan, Textarea, Tombol } from '../ui'

/** Pengaturan ikon WhatsApp pusat bantuan di pojok kanan atas aplikasi. */
export function TabDukungan({ master }: { master: Master }) {
  const kirim = useKirimMaster()
  const d = master.dukungan
  const [aktif, setAktif] = useState(d.aktif)
  const [nomor, setNomor] = useState(d.nomor ? `+${d.nomor}` : '')
  const [pesan, setPesan] = useState(d.pesan)
  const [hasil, setHasil] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)

  const pratinjau = tautanDukungan({ aktif: true, nomor: nomor.replace(/\D/g, '').replace(/^0/, '62') || null, pesan }, { nama: 'Nama Pengguna', unit: 'Komisi Contoh' })

  async function simpan() {
    try {
      await kirim.mutateAsync({ method: 'put', url: '/master/dukungan', body: { aktif, nomor, pesan } })
      setHasil({ nada: 'hijau', teks: 'Tersimpan. Ikon WhatsApp tampil di kanan atas bagi semua pengguna bila diaktifkan.' })
    } catch (e) {
      setHasil({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <Kartu judul="Bantuan WhatsApp (pusat bantuan)">
      <div className="space-y-4">
        <label className="flex min-h-[44px] items-center gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Tampilkan ikon WhatsApp di kanan atas aplikasi
        </label>
        <Bidang label="Nomor WhatsApp" petunjuk="Mis. 0812-3456-7890 atau +62 812 3456 7890. Wajib diisi bila diaktifkan.">
          <Input inputMode="tel" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="08xxxxxxxxxx" />
        </Bidang>
        <Bidang label="Pesan awal" petunjuk="Dapat memuat {nama} dan {unit}; terisi otomatis dari akun yang menekan ikon. Maksimal 300 karakter.">
          <Textarea value={pesan} maxLength={300} onChange={(e) => setPesan(e.target.value)} />
        </Bidang>
        {pratinjau && (
          <p className="text-sm">
            <a href={pratinjau} target="_blank" rel="noopener noreferrer" className="text-marine-700 underline">Coba tautan WhatsApp (contoh nama dan unit)</a>
          </p>
        )}
        {hasil && <Pemberitahuan nada={hasil.nada}>{hasil.teks}</Pemberitahuan>}
        <Tombol onClick={simpan} sibuk={kirim.isPending}>Simpan</Tombol>
      </div>
    </Kartu>
  )
}
