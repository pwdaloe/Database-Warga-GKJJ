'use client'

import { useState } from 'react'
import { useKirimMaster } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { formatKetikRupiah } from '@/lib/format'
import { LABEL_TAHAP, URUTAN_TAHAP, type Master, type Tahun } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Tombol } from '../ui'

const dateVal = (v: string | null): string => (v ? v.slice(0, 10) : '')
const TINDAKAN_TAHAP: Record<Tahun['statusPengajuan'], string> = {
  BELUM_DIBUKA: 'mengembalikan ke penetapan pagu: pengurus UPK tidak dapat mengubah program',
  DIBUKA: 'membuka penyusunan: pengurus UPK dapat mengisi dan mengajukan program',
  DITUTUP: 'menutup penyusunan: pengurus UPK tidak dapat mengubah atau menarik program lagi',
  PRA_MUKER: 'memulai pra-muker: penyusunan UPK dikunci, angka Usulan UPK dipotret dan tidak berubah lagi, lalu ketua bidang dan admin yang mengubah program dan alokasi',
  MUKER: 'memulai muker: perubahan hanya oleh admin atau sekretariat',
  DITETAPKAN: 'menetapkan anggaran: pagu, alokasi, dan seluruh program dikunci untuk semua orang (hanya admin yang dapat membukanya kembali)',
}

function FormTahun({ t }: { t: Tahun }) {
  const kirim = useKirimMaster()
  const [v, setV] = useState({
    nama: t.nama, statusPengajuan: t.statusPengajuan, rencanaBuka: dateVal(t.rencanaBuka), rencanaTutup: dateVal(t.rencanaTutup),
    praMukerTanggal: dateVal(t.praMukerTanggal), mukerTanggal: dateVal(t.mukerTanggal), aktif: t.aktif,
    proyeksi: String(t.proyeksiKasJemaat ?? 0),
  })
  const [pesan, setPesan] = useState<{ nada: 'hijau' | 'merah'; teks: string } | null>(null)

  async function simpan() {
    if (v.statusPengajuan !== t.statusPengajuan) {
      const tindakan = TINDAKAN_TAHAP[v.statusPengajuan]
      if (!window.confirm(`Anda akan ${tindakan}. Lanjutkan?`)) return
    }
    try {
      await kirim.mutateAsync({ method: 'put', url: `/master/tahun/${t.id}`, body: { nama: v.nama, statusPengajuan: v.statusPengajuan, rencanaBuka: v.rencanaBuka || null, rencanaTutup: v.rencanaTutup || null, praMukerTanggal: v.praMukerTanggal || null, mukerTanggal: v.mukerTanggal || null, aktif: v.aktif, proyeksiKasJemaat: Number(v.proyeksi || 0) } })
      setPesan({ nada: 'hijau', teks: 'Tersimpan.' })
    } catch (e) {
      setPesan({ nada: 'merah', teks: pesanGalat(e) })
    }
  }

  return (
    <Kartu judul={<span>{t.nama} {t.aktif && <Lencana nada="hijau">Aktif</Lencana>}</span>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang label="Nama"><Input value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} /></Bidang>
        <Bidang label="Tahap siklus anggaran" petunjuk="Menentukan siapa yang boleh mengubah: UPK (dibuka), ketua bidang dan admin (pra-muker), admin/sekretariat (muker), dikunci (ditetapkan).">
          <Select value={v.statusPengajuan} onChange={(e) => setV({ ...v, statusPengajuan: e.target.value as Tahun['statusPengajuan'] })}>
            {URUTAN_TAHAP.map((k) => <option key={k} value={k}>{LABEL_TAHAP[k]}</option>)}
          </Select>
        </Bidang>
        <Bidang label="Proyeksi Kas Jemaat (Rp)" petunjuk="Perkiraan penerimaan persembahan tahun ini; pembanding total pagu di dashboard.">
          <Input inputMode="numeric" className="text-right" value={formatKetikRupiah(v.proyeksi)} onChange={(e) => setV({ ...v, proyeksi: e.target.value.replace(/\D/g, '') })} />
        </Bidang>
        <Bidang label="Rencana buka pengajuan"><Input type="date" value={v.rencanaBuka} onChange={(e) => setV({ ...v, rencanaBuka: e.target.value })} /></Bidang>
        <Bidang label="Rencana tutup pengajuan"><Input type="date" value={v.rencanaTutup} onChange={(e) => setV({ ...v, rencanaTutup: e.target.value })} /></Bidang>
        <Bidang label="Tanggal pra-muker"><Input type="date" value={v.praMukerTanggal} onChange={(e) => setV({ ...v, praMukerTanggal: e.target.value })} /></Bidang>
        <Bidang label="Tanggal muker"><Input type="date" value={v.mukerTanggal} onChange={(e) => setV({ ...v, mukerTanggal: e.target.value })} /></Bidang>
      </div>
      <label className="mt-4 flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.aktif} onChange={(e) => setV({ ...v, aktif: e.target.checked })} /> Tahun aktif (dipakai sebagai bawaan; hanya satu yang aktif)</label>
      <p className="mt-2 text-xs text-gray-500">Rencana buka dan tutup hanya informasi di layar pengurus; yang menentukan adalah <strong>tahap siklus</strong> di atas.</p>
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
