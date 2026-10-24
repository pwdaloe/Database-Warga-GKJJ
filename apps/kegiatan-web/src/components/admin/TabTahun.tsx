'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import type { Master, Tahun } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Tombol } from '../ui'

const dateVal = (v: string | null): string => (v ? v.slice(0, 10) : '')
const LABEL_STATUS = { BELUM_DIBUKA: 'Belum dibuka', DIBUKA: 'Dibuka', DITUTUP: 'Ditutup' } as const

function FormTahun({ t }: { t: Tahun }) {
  const kirim = useKirimMaster()
  const [v, setV] = useState({
    nama: t.nama, statusPengajuan: t.statusPengajuan, rencanaBuka: dateVal(t.rencanaBuka), rencanaTutup: dateVal(t.rencanaTutup),
    praMukerTanggal: dateVal(t.praMukerTanggal), mukerTanggal: dateVal(t.mukerTanggal), aktif: t.aktif,
  })
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)

  async function simpan() {
    if (v.statusPengajuan !== t.statusPengajuan) {
      const tindakan = { DIBUKA: 'membuka pengajuan: pengurus UPK dapat mulai mengisi dan mengajukan', DITUTUP: 'menutup pengajuan: pengurus UPK tidak dapat mengubah atau menarik program lagi', BELUM_DIBUKA: 'mengembalikan ke belum dibuka: pengurus UPK tidak dapat mengubah program' }[v.statusPengajuan]
      if (!window.confirm(`Anda akan ${tindakan}. Lanjutkan?`)) return
    }
    try {
      await kirim.mutateAsync({ method: 'put', url: `/master/tahun/${t.id}`, body: { nama: v.nama, statusPengajuan: v.statusPengajuan, rencanaBuka: v.rencanaBuka || null, rencanaTutup: v.rencanaTutup || null, praMukerTanggal: v.praMukerTanggal || null, mukerTanggal: v.mukerTanggal || null, aktif: v.aktif } })
      setPesan({ nada: 'hijau', teks: 'Tersimpan.' })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <Kartu judul={<span>{t.nama} {t.aktif && <Lencana nada="hijau">Aktif</Lencana>}</span>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang label="Nama"><Input value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} /></Bidang>
        <Bidang label="Status pengajuan" petunjuk="Menentukan apakah pengurus UPK boleh mengisi dan mengajukan.">
          <Select value={v.statusPengajuan} onChange={(e) => setV({ ...v, statusPengajuan: e.target.value as Tahun['statusPengajuan'] })}>
            {Object.entries(LABEL_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </Bidang>
        <Bidang label="Rencana buka pengajuan"><Input type="date" value={v.rencanaBuka} onChange={(e) => setV({ ...v, rencanaBuka: e.target.value })} /></Bidang>
        <Bidang label="Rencana tutup pengajuan"><Input type="date" value={v.rencanaTutup} onChange={(e) => setV({ ...v, rencanaTutup: e.target.value })} /></Bidang>
        <Bidang label="Tanggal pra-muker"><Input type="date" value={v.praMukerTanggal} onChange={(e) => setV({ ...v, praMukerTanggal: e.target.value })} /></Bidang>
        <Bidang label="Tanggal muker"><Input type="date" value={v.mukerTanggal} onChange={(e) => setV({ ...v, mukerTanggal: e.target.value })} /></Bidang>
      </div>
      <label className="mt-4 flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.aktif} onChange={(e) => setV({ ...v, aktif: e.target.checked })} /> Tahun aktif (dipakai sebagai bawaan; hanya satu yang aktif)</label>
      <p className="mt-2 text-xs text-gray-500">Rencana buka dan tutup hanya informasi di layar pengurus; yang menentukan adalah <strong>status pengajuan</strong> di atas.</p>
      {pesan && <div className="mt-3"><Pemberitahuan nada={pesan.nada}>{pesan.teks}</Pemberitahuan></div>}
      <div className="mt-4"><Tombol onClick={simpan} sibuk={kirim.isPending}>Simpan</Tombol></div>
    </Kartu>
  )
}

export function TabTahun({ master }: { master: Master }) {
  const kirim = useKirimMaster()
  const [tahun, setTahun] = useState('')
  const [salin, setSalin] = useState(true)
  const [pesan, setPesan] = useState('')

  async function buat() {
    const n = Number(tahun)
    if (!Number.isInteger(n) || n < 2020) return setPesan('Isi tahun yang valid, mis. 2028.')
    try {
      await kirim.mutateAsync({ method: 'post', url: '/master/tahun', body: { tahun: n, nama: `RKA ${n}`, ...(salin ? { salinDariId: master.tahun.id } : {}) } })
      setTahun('')
      setPesan(`Tahun ${n} dibuat${salin ? ` dengan pagu dan acuan disalin dari ${master.tahun.nama}` : ''}. Aktifkan bila sudah siap.`)
    } catch (e) {
      setPesan(pesanGalat(e))
    }
  }

  return (
    <div className="space-y-4">
      {master.tahunList.map((t) => <FormTahun key={`${t.id}-${t.statusPengajuan}-${t.aktif}`} t={t} />)}
      <Kartu judul="Buat tahun anggaran baru">
        <div className="grid gap-3 sm:grid-cols-3">
          <Bidang label="Tahun"><Input type="number" inputMode="numeric" placeholder="2028" value={tahun} onChange={(e) => setTahun(e.target.value)} /></Bidang>
          <label className="flex min-h-[44px] items-end gap-3 pb-2 text-sm sm:col-span-2"><input type="checkbox" className="h-5 w-5" checked={salin} onChange={(e) => setSalin(e.target.checked)} /> Salin pagu dan visi-misi dari {master.tahun.nama} (dapat diedit)</label>
        </div>
        {pesan && <div className="mt-3"><Pemberitahuan>{pesan}</Pemberitahuan></div>}
        <div className="mt-4"><Tombol varian="sekunder" onClick={buat} sibuk={kirim.isPending}>Buat tahun baru</Tombol></div>
      </Kartu>
    </div>
  )
}
