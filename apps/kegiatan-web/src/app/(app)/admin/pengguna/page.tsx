'use client'

import { useState } from 'react'
import { Copy, KeyRound, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMaster } from '@/hooks/useData'
import { type Kredensial, useAkun, useAksiAkun } from '@/hooks/useAdmin'
import { pesanGalat } from '@/lib/api'
import { PERAN_LABEL, type Peran } from '@/lib/tipe'
import { Bidang, Input, Kartu, Lencana, Memuat, Pemberitahuan, Select, Tombol } from '@/components/ui'

const PERAN = PERAN_LABEL
const JABATAN: Record<string, string> = { KETUA: 'Ketua', SEKRETARIS: 'Sekretaris', BENDAHARA: 'Bendahara' }

function KotakKredensial({ k, nama, onTutup }: { k: Kredensial; nama: string; onTutup: () => void }) {
  const [tersalin, setTersalin] = useState(false)
  return (
    <Pemberitahuan nada="kuning" judul={`Password sementara untuk ${nama}`}>
      <p className="mb-2">Password ini <strong>hanya ditampilkan sekali</strong>. Salin atau kirim sekarang; pengguna akan diminta menggantinya saat masuk pertama.</p>
      <p className="mb-3 rounded bg-white px-3 py-2 font-mono text-lg tracking-wider">{k.passwordSementara}</p>
      <div className="flex flex-wrap gap-2">
        <Tombol varian="sekunder" onClick={async () => { await navigator.clipboard.writeText(k.pesanWhatsapp); setTersalin(true) }}><Copy size={16} /> {tersalin ? 'Pesan tersalin' : 'Salin pesan'}</Tombol>
        {k.waLink ? <a href={k.waLink} target="_blank" rel="noreferrer"><Tombol><MessageCircle size={16} /> Kirim lewat WhatsApp</Tombol></a> : <span className="self-center text-xs">Nomor WhatsApp belum diisi, salin pesan saja.</span>}
        <Tombol varian="hantu" onClick={onTutup}>Selesai</Tombol>
      </div>
    </Pemberitahuan>
  )
}

export default function HalamanPengguna() {
  const { adalah, user } = useAuth()
  const akun = useAkun()
  const master = useMaster()
  const aksi = useAksiAkun()
  const [form, setForm] = useState({ peran: 'PENGURUS_UPK' as Peran, username: '', pengurusId: '', bidangId: '', nama: '', whatsapp: '', email: '' })
  const [kred, setKred] = useState<{ k: Kredensial; nama: string } | null>(null)
  const [galat, setGalat] = useState('')

  if (!adalah('ADMIN', 'SEKRETARIAT')) return <Pemberitahuan nada="merah">Halaman ini hanya untuk admin dan sekretariat.</Pemberitahuan>
  if (akun.isLoading || master.isLoading || !master.data) return <Memuat />

  const m = master.data
  const posisiBebas = m.unit.flatMap((u) => (u.pengurus ?? []).filter((p) => !(akun.data ?? []).some((a) => a.pengurus?.id === p.id)).map((p) => ({ ...p, unitNama: u.nama })))
  const peranBoleh = (Object.keys(PERAN) as Peran[]).filter((p) => user?.peran === 'ADMIN' || (p !== 'ADMIN' && p !== 'SEKRETARIAT'))

  async function buat(e: React.FormEvent) {
    e.preventDefault()
    setGalat('')
    try {
      const hasil = await aksi.buat.mutateAsync({
        peran: form.peran, username: form.username.trim().toLowerCase(),
        ...(form.peran === 'PENGURUS_UPK' ? { pengurusId: Number(form.pengurusId) } : {}),
        ...(form.peran === 'KOORDINATOR_BIDANG' ? { bidangId: Number(form.bidangId) } : {}),
        ...(form.nama.trim() ? { nama: form.nama.trim() } : {}),
        ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      })
      setKred({ k: hasil, nama: hasil.pengguna.nama })
      setForm({ ...form, username: '', pengurusId: '', nama: '', whatsapp: '', email: '' })
    } catch (err) {
      setGalat(pesanGalat(err))
    }
  }

  async function reset(id: number, nama: string) {
    if (!window.confirm(`Buat password sementara baru untuk ${nama}? Password lama tidak berlaku lagi.`)) return
    try {
      setKred({ k: await aksi.reset.mutateAsync(id), nama })
    } catch (err) {
      setGalat(pesanGalat(err))
    }
  }

  async function aktifkan(id: number, aktif: boolean) {
    try {
      await aksi.ubah.mutateAsync({ id, body: { aktif } })
    } catch (err) {
      setGalat(pesanGalat(err))
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-marine-900 sm:text-xl">Akun pengguna</h1>
      {kred && <KotakKredensial k={kred.k} nama={kred.nama} onTutup={() => setKred(null)} />}
      {galat && <Pemberitahuan nada="merah">{galat}</Pemberitahuan>}

      <Kartu judul="Buat akun">
        <form onSubmit={buat} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Bidang label="Peran" wajib><Select value={form.peran} onChange={(e) => setForm({ ...form, peran: e.target.value as Peran })}>{peranBoleh.map((p) => <option key={p} value={p}>{PERAN[p]}</option>)}</Select></Bidang>
            <Bidang label="Username" petunjuk="Huruf kecil, angka, titik." wajib><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoCapitalize="none" required minLength={3} /></Bidang>
            {form.peran === 'PENGURUS_UPK' && (
              <Bidang label="Posisi pengurus" petunjuk="Akun dikaitkan ke posisi BPH." wajib>
                <Select value={form.pengurusId} onChange={(e) => setForm({ ...form, pengurusId: e.target.value })} required>
                  <option value="">Pilih posisi…</option>
                  {posisiBebas.map((p) => <option key={p.id} value={p.id}>{p.unitNama} — {JABATAN[p.jabatan]}</option>)}
                </Select>
              </Bidang>
            )}
            {form.peran === 'KOORDINATOR_BIDANG' && (
              <Bidang label="Bidang" wajib><Select value={form.bidangId} onChange={(e) => setForm({ ...form, bidangId: e.target.value })} required><option value="">Pilih bidang…</option>{m.bidang.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</Select></Bidang>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Bidang label="Nama" petunjuk={form.peran === 'PENGURUS_UPK' ? 'Kosongkan untuk memakai nama pada posisi.' : undefined} wajib={form.peran !== 'PENGURUS_UPK'}><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></Bidang>
            <Bidang label="WhatsApp" petunjuk="Untuk mengirim password sementara."><Input type="tel" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Bidang>
            <Bidang label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Bidang>
          </div>
          <Tombol type="submit" sibuk={aksi.buat.isPending}>Buat akun</Tombol>
        </form>
      </Kartu>

      <Kartu judul={`Daftar akun (${akun.data?.length ?? 0})`}>
        <ul className="space-y-2">
          {(akun.data ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.nama} <span className="font-normal text-gray-500">@{a.username}</span></p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <Lencana nada="biru">{PERAN[a.peran]}</Lencana>
                  {a.unit && <span>{a.unit.nama}{a.pengurus ? ` · ${JABATAN[a.pengurus.jabatan]}` : ''}</span>}
                  {!a.aktif && <Lencana nada="merah">Nonaktif</Lencana>}
                  {a.wajibGantiPassword && <Lencana nada="kuning">Belum ganti password</Lencana>}
                  {a.isContoh && <Lencana nada="kuning">Contoh</Lencana>}
                </p>
              </div>
              <div className="flex gap-1">
                <Tombol varian="hantu" onClick={() => reset(a.id, a.nama)} aria-label={`Reset password ${a.nama}`}><KeyRound size={16} /> Reset</Tombol>
                <Tombol varian="hantu" className={a.aktif ? 'text-red-600' : ''} onClick={() => aktifkan(a.id, !a.aktif)}>{a.aktif ? 'Nonaktifkan' : 'Aktifkan'}</Tombol>
              </div>
            </li>
          ))}
        </ul>
      </Kartu>
    </div>
  )
}
