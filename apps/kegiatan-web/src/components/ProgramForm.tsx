'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileText, Plus, Trash2, Undo2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAksiProgram } from '@/hooks/useData'
import { daftarMasalah, pesanGalat } from '@/lib/api'
import { formatKetikRupiah, formatRupiah, persen } from '@/lib/format'
import {
  type FormProgram, JENIS_SUMBER, LABEL_JENIS_PROGRAM, LABEL_SUMBER, LABEL_WAKTU, dariApi, formKosong, indikatorKosong, isiSisaKeGereja,
  jadwalKosong, jumlahBaris, keApi, masalahLokal, rabKosong, selisihSumber, totalMandiri, totalRab, totalSumber,
} from '@/lib/programForm'
import type { KategoriWaktu, Master, ProgramDetail } from '@/lib/tipe'
import { ambilPesanKilat, setPesanKilat } from '@/lib/pesanKilat'
import { Bidang, Input, Kartu, Lencana, Pemberitahuan, Select, Textarea, Tombol } from './ui'

interface Props {
  master: Master
  /** Program yang sedang dibuka; null untuk program baru. */
  awal: ProgramDetail | null
  /** Unit pengusul untuk program baru. */
  unitIdBaru?: number
}

function Bagian({ no, judul, petunjuk, children }: { no: number; judul: string; petunjuk?: string; children: React.ReactNode }) {
  return (
    <Kartu judul={<span><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-marine-700 text-xs text-white">{no}</span>{judul}</span>}>
      {petunjuk && <p className="mb-4 text-sm text-gray-500">{petunjuk}</p>}
      <div className="space-y-4">{children}</div>
    </Kartu>
  )
}

function InputRupiah({ nilai, onChange, ...rest }: { nilai: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
      <Input {...rest} inputMode="numeric" className="pl-9 text-right" value={formatKetikRupiah(nilai)} onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} />
    </div>
  )
}

export function ProgramForm({ master, awal, unitIdBaru }: Props) {
  const { user, adalah } = useAuth()
  const router = useRouter()
  const aksi = useAksiProgram()
  const [f, setF] = useState<FormProgram>(() => (awal ? dariApi(awal) : formKosong()))
  const [unitId, setUnitId] = useState<number | undefined>(awal?.unit.id ?? unitIdBaru)
  const [kotor, setKotor] = useState(false)
  const [galat, setGalat] = useState('')
  const [masalahServer, setMasalahServer] = useState<string[]>([])
  const [info, setInfo] = useState(() => ambilPesanKilat())
  const [sibuk, setSibuk] = useState<'' | 'simpan' | 'ajukan' | 'tarik' | 'hapus'>('')

  const tahun = awal?.tahun ?? master.tahun
  const unit = master.unit.find((u) => u.id === unitId)
  const kodeChecklist = useMemo(() => master.checklist.map((c) => c.kode), [master.checklist])

  const diajukan = awal?.status === 'DIAJUKAN'
  const kelola = adalah('ADMIN', 'SEKRETARIAT')
  const milikUnit = adalah('PENGURUS_UPK') && user?.unitId === unitId
  const bolehUbah = !diajukan && (kelola || (milikUnit && tahun.statusPengajuan === 'DIBUKA'))
  const bolehTarik = diajukan && (kelola || (milikUnit && tahun.statusPengajuan === 'DIBUKA'))

  useEffect(() => {
    if (!kotor) return
    const cegah = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', cegah)
    return () => window.removeEventListener('beforeunload', cegah)
  }, [kotor])

  const ubah = <K extends keyof FormProgram>(k: K, v: FormProgram[K]) => {
    setF((s) => ({ ...s, [k]: v }))
    setKotor(true)
  }
  const ubahSumber = (j: (typeof JENIS_SUMBER)[number], bagian: 'nilai' | 'keterangan', v: string) => {
    setF((s) => ({ ...s, sumber: { ...s.sumber, [j]: { ...s.sumber[j], [bagian]: v } } }))
    setKotor(true)
  }

  const rab = totalRab(f)
  const sumber = totalSumber(f)
  const mandiri = totalMandiri(f)
  const selisih = selisihSumber(f)
  const target = Number(f.targetPeserta)
  const masalah = useMemo(() => masalahLokal(f, kodeChecklist), [f, kodeChecklist])

  const program2026Unit = master.program2026.filter((p) => p.unitId === unitId)
  const acuanPilihan = master.acuan.filter((a) => a.jenis !== 'VISI' && a.aktif)
  const visi = master.acuan.find((a) => a.jenis === 'VISI')
  const rujukan2026 = master.program2026.find((p) => p.id === f.program2026Id)

  /** Menyimpan draft; mengembalikan id program bila berhasil. */
  async function simpan(): Promise<number | null> {
    setGalat('')
    setMasalahServer([])
    setInfo('')
    if (f.judul.trim().length < 3) { setGalat('Judul program minimal 3 karakter.'); return null }
    if (!awal && !unitId) { setGalat('Pilih unit pengusul terlebih dahulu.'); return null }
    const hasil = keApi(f)
    if (!hasil.ok) { setGalat(hasil.galat.join(' ')); return null }
    try {
      if (awal) {
        await aksi.simpan.mutateAsync({ id: awal.id, body: hasil.body })
        setKotor(false)
        return awal.id
      }
      const baru = await aksi.buat.mutateAsync({ ...hasil.body, unitId })
      setKotor(false)
      return baru.id
    } catch (e) {
      setGalat(pesanGalat(e))
      return null
    }
  }

  async function klikSimpan() {
    setSibuk('simpan')
    const id = await simpan()
    setSibuk('')
    if (id === null) return
    if (!awal) {
      setPesanKilat('Draft tersimpan.')
      router.replace(`/program/${id}`)
    } else setInfo('Draft tersimpan.')
  }

  async function klikAjukan() {
    setSibuk('ajukan')
    const id = await simpan()
    if (id === null) { setSibuk(''); return }
    try {
      setPesanKilat('Program berhasil diajukan.')
      await aksi.ajukan.mutateAsync(id)
      if (!awal) router.replace(`/program/${id}`)
    } catch (e) {
      setPesanKilat('')
      const daftar = daftarMasalah(e)
      if (daftar.length > 0) setMasalahServer(daftar)
      else setGalat(pesanGalat(e))
      if (!awal) router.replace(`/program/${id}`)
    } finally {
      setSibuk('')
    }
  }

  async function klikTarik() {
    if (!awal || !window.confirm('Tarik program ini kembali menjadi draft? Anda perlu mengajukannya lagi setelah selesai diubah.')) return
    setSibuk('tarik')
    try {
      setPesanKilat('Program ditarik kembali menjadi draft.')
      await aksi.tarik.mutateAsync(awal.id)
    } catch (e) {
      setPesanKilat('')
      setGalat(pesanGalat(e))
    } finally {
      setSibuk('')
    }
  }

  async function klikHapus() {
    if (!awal || !window.confirm('Hapus draft ini? Tindakan ini tidak dapat dibatalkan.')) return
    setSibuk('hapus')
    try {
      await aksi.hapus.mutateAsync(awal.id)
      setKotor(false)
      router.replace('/program')
    } catch (e) {
      setGalat(pesanGalat(e))
      setSibuk('')
    }
  }

  return (
    <div className="space-y-4 pb-36 sm:pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-marine-900 sm:text-xl">{awal ? 'Program kerja' : 'Program kerja baru'}</h1>
          <p className="text-sm text-gray-500">
            {tahun.nama}{unit ? ` · ${unit.nama}` : ''}{awal?.nomor ? ` · ${awal.nomor}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {awal?.isContoh && <Lencana nada="kuning">Contoh</Lencana>}
          {awal && <Lencana nada={diajukan ? 'hijau' : 'abu'}>{diajukan ? 'Diajukan' : 'Draft'}</Lencana>}
          {awal && (
            <Link href={`/program/${awal.id}/ringkasan`} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border bg-white px-3 text-sm hover:bg-gray-50">
              <FileText size={16} /> Ringkasan
            </Link>
          )}
        </div>
      </div>

      {diajukan && (
        <Pemberitahuan nada="hijau" judul="Program sudah diajukan">
          {bolehTarik ? 'Untuk mengubahnya, tarik kembali menjadi draft terlebih dahulu.' : tahun.statusPengajuan === 'DITUTUP' ? 'Pengajuan sudah ditutup; hubungi sekretariat bila perlu perubahan.' : 'Isi program ini terkunci.'}
        </Pemberitahuan>
      )}
      {!diajukan && !bolehUbah && (
        <Pemberitahuan nada="kuning" judul="Program tidak dapat diubah">
          {tahun.statusPengajuan !== 'DIBUKA' ? 'Pengajuan sedang tidak dibuka.' : 'Anda tidak memiliki izin mengubah program unit ini.'}
        </Pemberitahuan>
      )}
      {info && <Pemberitahuan nada="hijau">{info}</Pemberitahuan>}
      {galat && <Pemberitahuan nada="merah">{galat}</Pemberitahuan>}
      {masalahServer.length > 0 && (
        <Pemberitahuan nada="merah" judul="Program belum lengkap untuk diajukan">
          <ul className="list-disc space-y-0.5 pl-5">{masalahServer.map((m) => <li key={m}>{m}</li>)}</ul>
        </Pemberitahuan>
      )}

      <fieldset disabled={!bolehUbah || sibuk !== ''} className="space-y-4 disabled:opacity-90">
        {/* 1. Identitas */}
        <Bagian no={1} judul="Identitas program">
          {!awal && (kelola ? (
            <Bidang label="Unit pengusul" wajib>
              <Select value={unitId ?? ''} onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Pilih unit…</option>
                {master.unit.filter((u) => u.aktif).map((u) => <option key={u.id} value={u.id}>{u.nama}{u.jenis === 'POS' ? ' (pos)' : ''}</option>)}
              </Select>
            </Bidang>
          ) : null)}
          <Bidang label="Nama program" petunjuk="Satu program = satu hasil utama yang jelas." wajib>
            <Input value={f.judul} onChange={(e) => ubah('judul', e.target.value)} maxLength={200} />
          </Bidang>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Jenis program">
              <Select value={f.jenisProgram} onChange={(e) => ubah('jenisProgram', e.target.value as FormProgram['jenisProgram'])}>
                {master.enum.jenisProgram.map((j) => <option key={j} value={j}>{LABEL_JENIS_PROGRAM[j]}</option>)}
              </Select>
            </Bidang>
            <Bidang label="Rujukan program 2026" petunjuk="Bila lanjutan atau perbaikan program yang sudah ada.">
              <Select value={f.program2026Id ?? ''} onChange={(e) => ubah('program2026Id', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— tidak ada —</option>
                {program2026Unit.map((p) => <option key={p.id} value={p.id}>{p.nama} ({p.kategori}{p.bersyarat ? '*' : ''})</option>)}
              </Select>
            </Bidang>
          </div>
          {rujukan2026 && (
            <Pemberitahuan nada="biru" judul={`Evaluasi 2026: kategori ${rujukan2026.kategori}${rujukan2026.bersyarat ? '*' : ''}`}>
              {rujukan2026.rekomendasi}
            </Pemberitahuan>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Penanggung jawab (PIC)" wajib><Input value={f.picNama} onChange={(e) => ubah('picNama', e.target.value)} maxLength={150} /></Bidang>
            <Bidang label="WhatsApp PIC" petunjuk="Untuk klarifikasi data." wajib><Input type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" value={f.picWhatsapp} onChange={(e) => ubah('picWhatsapp', e.target.value)} maxLength={20} /></Bidang>
          </div>
        </Bagian>

        {/* 2. Acuan visi-misi */}
        <Bagian no={2} judul="Acuan visi dan misi" petunjuk="Uji sederhana: jika program ini berhasil, bagian mana dari visi gereja yang menjadi lebih nyata?">
          {visi?.deskripsi && <blockquote className="rounded-lg bg-marine-50 p-3 text-sm italic text-marine-900">“{visi.deskripsi}”</blockquote>}
          <div className="space-y-2" role="group" aria-label="Acuan visi-misi">
            {acuanPilihan.map((a) => (
              <label key={a.id} className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-marine-500 has-[:checked]:bg-marine-50">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={f.acuanIds.includes(a.id)}
                  onChange={(e) => ubah('acuanIds', e.target.checked ? [...f.acuanIds, a.id] : f.acuanIds.filter((x) => x !== a.id))} />
                <span><span className="block text-sm font-medium">{a.nama}</span>{a.deskripsi && <span className="block text-xs text-gray-500">{a.deskripsi}</span>}</span>
              </label>
            ))}
            {acuanPilihan.length === 0 && <p className="text-sm text-gray-500">Belum ada acuan visi-misi untuk tahun ini. Hubungi sekretariat.</p>}
          </div>
        </Bagian>

        {/* 3-5. Latar belakang, kebutuhan, tujuan */}
        <Bagian no={3} judul="Latar belakang dan kebutuhan">
          <Bidang label="Latar belakang" petunjuk="Data, masukan, atau evaluasi yang mendasari program." wajib><Textarea rows={4} value={f.latarBelakang} onChange={(e) => ubah('latarBelakang', e.target.value)} maxLength={5000} /></Bidang>
          <Bidang label="Rumusan kebutuhan" petunjuk="Kebutuhan nyata yang hendak dijawab, bukan hanya keinginan." wajib><Textarea rows={3} value={f.kebutuhan} onChange={(e) => ubah('kebutuhan', e.target.value)} maxLength={5000} /></Bidang>
        </Bagian>

        <Bagian no={4} judul="Tujuan dan sasaran">
          <Bidang label="Tujuan program" petunjuk="Perubahan atau manfaat yang diharapkan, bukan hanya aktivitas." wajib><Textarea rows={3} value={f.tujuan} onChange={(e) => ubah('tujuan', e.target.value)} maxLength={5000} /></Bidang>
          <div className="grid gap-4 sm:grid-cols-3">
            <Bidang label="Sasaran / penerima manfaat" petunjuk="Siapa yang dilayani." wajib className="sm:col-span-2"><Textarea rows={2} value={f.sasaranPenerima} onChange={(e) => ubah('sasaranPenerima', e.target.value)} maxLength={2000} /></Bidang>
            <Bidang label="Target jumlah peserta"><Input type="number" inputMode="numeric" min={0} value={f.targetPeserta} onChange={(e) => ubah('targetPeserta', e.target.value)} /></Bidang>
          </div>
        </Bagian>

        {/* 6. Jadwal */}
        <Bagian no={5} judul="Rencana kegiatan dan jadwal" petunjuk="Tambahkan setiap kegiatan yang termasuk dalam program ini.">
          {f.jadwal.map((j, i) => {
            const set = (patch: Partial<typeof j>) => ubah('jadwal', f.jadwal.map((x) => (x.uid === j.uid ? { ...x, ...patch } : x)))
            return (
              <div key={j.uid} className="space-y-3 rounded-lg border bg-gray-50/60 p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">Kegiatan {i + 1}</p>
                  {f.jadwal.length > 1 && <button type="button" aria-label={`Hapus kegiatan ${i + 1}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-red-600" onClick={() => ubah('jadwal', f.jadwal.filter((x) => x.uid !== j.uid))}><Trash2 size={18} /></button>}
                </div>
                <Bidang label="Nama kegiatan" wajib><Input value={j.nama} onChange={(e) => set({ nama: e.target.value })} maxLength={200} /></Bidang>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Bidang label="Kategori waktu" wajib>
                    <Select value={j.kategoriWaktu} onChange={(e) => set({ kategoriWaktu: e.target.value as KategoriWaktu })}>
                      {master.enum.kategoriWaktu.map((k) => <option key={k} value={k}>{LABEL_WAKTU[k]}</option>)}
                    </Select>
                  </Bidang>
                  {j.kategoriWaktu !== 'TAHUN' && <Bidang label={j.kategoriWaktu === 'RENTANG' ? 'Tanggal mulai' : j.kategoriWaktu === 'PERIODE' ? 'Mulai (opsional)' : 'Tanggal pelaksanaan'} wajib={j.kategoriWaktu !== 'PERIODE'}><Input type="date" value={j.tanggalMulai} onChange={(e) => set({ tanggalMulai: e.target.value })} /></Bidang>}
                  {j.kategoriWaktu === 'RENTANG' && <Bidang label="Tanggal selesai" wajib><Input type="date" value={j.tanggalSelesai} min={j.tanggalMulai || undefined} onChange={(e) => set({ tanggalSelesai: e.target.value })} /></Bidang>}
                  {j.kategoriWaktu === 'PERIODE' && <Bidang label="Keterangan periode" petunjuk="Mis. setiap bulan, tiap Minggu ke-2." wajib><Input value={j.keteranganPeriode} onChange={(e) => set({ keteranganPeriode: e.target.value })} maxLength={150} /></Bidang>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Bidang label="Lokasi"><Input value={j.lokasi} onChange={(e) => set({ lokasi: e.target.value })} maxLength={150} /></Bidang>
                  <Bidang label="Hasil langsung"><Input value={j.hasilLangsung} onChange={(e) => set({ hasilLangsung: e.target.value })} maxLength={500} /></Bidang>
                </div>
              </div>
            )
          })}
          <Tombol type="button" varian="sekunder" onClick={() => ubah('jadwal', [...f.jadwal, jadwalKosong()])}><Plus size={16} /> Tambah kegiatan</Tombol>
        </Bagian>

        {/* 7. Indikator */}
        <Bagian no={6} judul="Indikator keberhasilan" petunjuk="Ukur hasil, bukan hanya kegiatan: berapa, seberapa baik, dan bukti apa.">
          {f.indikator.map((x, i) => {
            const set = (patch: Partial<typeof x>) => ubah('indikator', f.indikator.map((y) => (y.uid === x.uid ? { ...y, ...patch } : y)))
            return (
              <div key={x.uid} className="space-y-3 rounded-lg border bg-gray-50/60 p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">Indikator {i + 1}</p>
                  {f.indikator.length > 1 && <button type="button" aria-label={`Hapus indikator ${i + 1}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-red-600" onClick={() => ubah('indikator', f.indikator.filter((y) => y.uid !== x.uid))}><Trash2 size={18} /></button>}
                </div>
                <Bidang label="Indikator" wajib><Input value={x.indikator} onChange={(e) => set({ indikator: e.target.value })} maxLength={255} /></Bidang>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Bidang label="Target" wajib><Input value={x.target} onChange={(e) => set({ target: e.target.value })} maxLength={150} /></Bidang>
                  <Bidang label="Bukti" wajib><Input value={x.bukti} onChange={(e) => set({ bukti: e.target.value })} maxLength={255} /></Bidang>
                </div>
              </div>
            )
          })}
          <Tombol type="button" varian="sekunder" onClick={() => ubah('indikator', [...f.indikator, indikatorKosong()])}><Plus size={16} /> Tambah indikator</Tombol>
        </Bagian>

        {/* 8. RAB */}
        <Bagian no={7} judul="Rencana anggaran biaya (RAB)" petunjuk="Hitung dari aktivitas nyata. Total dihitung otomatis dan tidak dapat diketik.">
          {f.rab.map((r, i) => {
            const set = (patch: Partial<typeof r>) => ubah('rab', f.rab.map((y) => (y.uid === r.uid ? { ...y, ...patch } : y)))
            return (
              <div key={r.uid} className="space-y-3 rounded-lg border bg-gray-50/60 p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">Baris {i + 1}</p>
                  {f.rab.length > 1 && <button type="button" aria-label={`Hapus baris anggaran ${i + 1}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-red-600" onClick={() => ubah('rab', f.rab.filter((y) => y.uid !== r.uid))}><Trash2 size={18} /></button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Bidang label="Uraian biaya" wajib className="sm:col-span-2"><Input value={r.uraian} onChange={(e) => set({ uraian: e.target.value })} maxLength={255} /></Bidang>
                  <Bidang label="Kategori biaya">
                    <Select value={r.kategoriId ?? ''} onChange={(e) => set({ kategoriId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">—</option>
                      {master.kategoriBiaya.filter((k) => k.aktif).map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </Select>
                  </Bidang>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Bidang label="Volume" wajib><Input type="number" inputMode="numeric" min={1} value={r.volume} onChange={(e) => set({ volume: e.target.value })} /></Bidang>
                  <Bidang label="Satuan" wajib>
                    <Input list="daftar-satuan" value={r.satuan} onChange={(e) => set({ satuan: e.target.value })} maxLength={40} />
                  </Bidang>
                  <Bidang label="Harga satuan" wajib className="col-span-2"><InputRupiah nilai={r.hargaSatuan} onChange={(v) => set({ hargaSatuan: v })} /></Bidang>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Bidang label="Dasar perhitungan" petunjuk="Mis. 20 orang × 4 pertemuan." className="sm:col-span-2"><Input value={r.perhitungan} onChange={(e) => set({ perhitungan: e.target.value })} maxLength={255} /></Bidang>
                  <div className="flex items-end justify-between rounded-lg bg-white px-3 py-2 sm:flex-col sm:items-end sm:justify-center">
                    <span className="text-xs text-gray-500">Jumlah</span>
                    <span className="font-semibold">{formatRupiah(jumlahBaris(r))}</span>
                  </div>
                </div>
              </div>
            )
          })}
          <datalist id="daftar-satuan">{master.satuan.filter((s) => s.aktif).map((s) => <option key={s.id} value={s.nama} />)}</datalist>
          <Tombol type="button" varian="sekunder" onClick={() => ubah('rab', [...f.rab, rabKosong()])}><Plus size={16} /> Tambah baris anggaran</Tombol>
          <div className="flex items-center justify-between rounded-lg bg-marine-50 px-4 py-3">
            <span className="font-medium text-marine-900">Total anggaran</span>
            <span className="text-lg font-bold text-marine-900" data-testid="total-rab">{formatRupiah(rab)}</span>
          </div>
        </Bagian>

        {/* 9. Sumber dana */}
        <Bagian no={8} judul="Sumber dana" petunjuk="Total sumber dana harus sama dengan total anggaran. Pisahkan yang berasal dari kas gereja dan yang digalang mandiri.">
          {JENIS_SUMBER.map((j) => (
            <div key={j} className="grid gap-3 rounded-lg border bg-gray-50/60 p-3 sm:grid-cols-3">
              <Bidang label={LABEL_SUMBER[j]}><InputRupiah nilai={f.sumber[j].nilai} onChange={(v) => ubahSumber(j, 'nilai', v)} /></Bidang>
              <Bidang label="Keterangan" petunjuk={j === 'PENGGALANGAN' ? 'Cara, penanggung jawab, waktu.' : undefined} className="sm:col-span-2"><Input value={f.sumber[j].keterangan} onChange={(e) => ubahSumber(j, 'keterangan', e.target.value)} maxLength={255} /></Bidang>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <Tombol type="button" varian="sekunder" onClick={() => { setF(isiSisaKeGereja(f)); setKotor(true) }}>Isi sisa kebutuhan ke alokasi gereja</Tombol>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-marine-50 p-4 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-gray-600">Total anggaran</dt><dd className="font-semibold">{formatRupiah(rab)}</dd></div>
            <div><dt className="text-xs text-gray-600">Total sumber dana</dt><dd className="font-semibold">{formatRupiah(sumber)}</dd></div>
            <div><dt className="text-xs text-gray-600">Dana mandiri</dt><dd className="font-semibold">{formatRupiah(mandiri)} <span className="font-normal text-gray-500">({persen(mandiri, sumber)})</span></dd></div>
            <div><dt className="text-xs text-gray-600">Biaya per peserta</dt><dd className="font-semibold">{Number.isFinite(target) && target > 0 ? formatRupiah(Math.round(rab / target)) : '—'}</dd></div>
          </dl>
          {selisih === 0 && rab > 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 size={16} /> Sumber dana sama dengan anggaran.</p>
          ) : rab > 0 || sumber > 0 ? (
            <p className="text-sm text-red-700" role="status">{selisih < 0 ? `Sumber dana kurang ${formatRupiah(-selisih)} dari anggaran.` : `Sumber dana berlebih ${formatRupiah(selisih)} dari anggaran.`}</p>
          ) : null}
        </Bagian>

        {/* 10. Evaluasi */}
        <Bagian no={9} judul="Evaluasi dan pelaporan">
          <Bidang label="Rencana evaluasi dan pelaporan" petunjuk="Apa yang tercapai, apa yang belum, mengapa selisih, dan perbaikan berikutnya; siapa melaporkan dan kapan." wajib>
            <Textarea rows={4} value={f.evaluasi} onChange={(e) => ubah('evaluasi', e.target.value)} maxLength={5000} />
          </Bidang>
        </Bagian>

        {/* Daftar periksa */}
        <Bagian no={10} judul="Daftar periksa sebelum mengajukan" petunjuk="Jika ada jawaban “belum”, sempurnakan rancangan sebelum diajukan.">
          <div className="space-y-2">
            {master.checklist.map((c) => (
              <label key={c.kode} className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:bg-green-50">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={f.checklist[c.kode] === true} onChange={(e) => ubah('checklist', { ...f.checklist, [c.kode]: e.target.checked })} />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
        </Bagian>
      </fieldset>

      {bolehUbah && masalah.length > 0 && (
        <Pemberitahuan nada="kuning" judul={`${masalah.length} hal perlu dilengkapi sebelum diajukan`}>
          <ul className="list-disc space-y-0.5 pl-5">{masalah.map((m) => <li key={m}>{m}</li>)}</ul>
        </Pemberitahuan>
      )}

      {(bolehUbah || bolehTarik) && (
        <div className="tanpa-cetak fixed inset-x-0 bottom-14 z-20 border-t bg-white/95 px-4 py-3 backdrop-blur sm:bottom-0">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p className="hidden text-sm text-gray-600 sm:block">{kotor ? 'Ada perubahan yang belum disimpan.' : 'Tidak ada perubahan.'} Total anggaran <strong>{formatRupiah(rab)}</strong></p>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              {bolehUbah && awal && <Tombol varian="hantu" onClick={klikHapus} sibuk={sibuk === 'hapus'} className="text-red-600"><Trash2 size={16} /> Hapus</Tombol>}
              {bolehUbah && <Tombol varian="sekunder" onClick={klikSimpan} sibuk={sibuk === 'simpan'}>Simpan draft</Tombol>}
              {bolehUbah && <Tombol onClick={klikAjukan} sibuk={sibuk === 'ajukan'}>Ajukan</Tombol>}
              {bolehTarik && <Tombol varian="sekunder" onClick={klikTarik} sibuk={sibuk === 'tarik'}><Undo2 size={16} /> Tarik kembali ke draft</Tombol>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
