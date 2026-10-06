'use client'

import { useEffect, useState } from 'react'
import { Loader2, UserRound, Phone, MapPin, Info, CheckCircle2 } from 'lucide-react'
import { useProfil, useProfilMutation } from '@/hooks/useProfil'
import { buildProfilPayload, profilToFormDefaults, type ProfilForm, type AlamatKeluarga } from '@/lib/profilPayload'
import { cn } from '@/lib/utils'

type Tab = 'identitas' | 'kontak' | 'alamat'
const GOLDAR = ['A', 'B', 'AB', 'O']
const PENDIDIKAN = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']
const input = 'w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export default function ProfilSayaPage() {
  const { data: profil, isLoading } = useProfil()
  const simpan = useProfilMutation()
  const [tab, setTab] = useState<Tab>('identitas')
  const [form, setForm] = useState<ProfilForm | null>(null)
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null)

  // Muat ulang nilai awal setiap data server berubah (setelah simpan)
  useEffect(() => { if (profil) setForm(profilToFormDefaults(profil)) }, [profil])

  if (isLoading || !profil || !form) return <div className="p-8 text-center text-gray-400"><Loader2 className="animate-spin inline" /></div>

  const set = <K extends keyof ProfilForm>(k: K, v: ProfilForm[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const setKk = (k: keyof AlamatKeluarga, v: string) => setForm((f) => (f ? { ...f, kk: { ...f.kk, [k]: v } } : f))
  const bolehKk = profil.bolehUbahAlamatKeluarga

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPesan(null)
    try {
      await simpan.mutateAsync(buildProfilPayload(form!, bolehKk))
      setPesan({ ok: true, teks: 'Perubahan tersimpan dan menunggu verifikasi staf gereja.' })
    } catch (err: any) {
      const d = err?.response?.data
      setPesan({ ok: false, teks: d?.details?.map((x: any) => x.message).join(' · ') ?? d?.error ?? 'Gagal menyimpan' })
    }
  }

  const tabs = [
    { key: 'identitas' as Tab, label: 'Identitas', icon: UserRound },
    { key: 'kontak' as Tab, label: 'Kontak', icon: Phone },
    { key: 'alamat' as Tab, label: 'Alamat', icon: MapPin },
  ]

  return (
    <form onSubmit={onSubmit} className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">{profil.namaLengkap}{profil.nomorAnggota ? ` · ${profil.nomorAnggota}` : ''}</p>
      </div>

      {profil.menungguVerifikasi && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <Info size={16} className="mt-0.5 shrink-0" /> Perubahan terakhir Anda sedang menunggu verifikasi staf gereja.
        </div>
      )}
      {pesan && (
        <div className={cn('flex items-start gap-2 px-4 py-3 rounded-lg border text-sm',
          pesan.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700')}>
          {pesan.ok && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />} {pesan.teks}
        </div>
      )}

      <div className="flex gap-1 border-b overflow-x-auto" role="tablist">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-2 px-4 py-3 min-h-11 shrink-0 text-sm font-medium border-b-2 -mb-px',
              tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        {tab === 'identitas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap" hint="Hanya dapat diubah oleh admin gereja"><input value={profil.namaLengkap} disabled className={input} /></Field>
            <Field label="Nama Panggilan"><input value={form.namaPanggilan} onChange={(e) => set('namaPanggilan', e.target.value)} maxLength={50} className={input} /></Field>
            <Field label="Tempat Lahir"><input value={form.tempatLahir} onChange={(e) => set('tempatLahir', e.target.value)} maxLength={100} className={input} /></Field>
            <Field label="Tanggal Lahir"><input type="date" value={form.tanggalLahir} onChange={(e) => set('tanggalLahir', e.target.value)} className={input} /></Field>
            <Field label="NIK" hint={profil.nikMasker ? `Tersimpan: ${profil.nikMasker}. Kosongkan jika tidak diubah.` : '16 digit'}>
              <input value={form.nik} onChange={(e) => set('nik', e.target.value.replace(/\D/g, '').slice(0, 16))} inputMode="numeric"
                placeholder={profil.nikMasker ?? ''} autoComplete="off" className={cn(input, 'font-mono')} />
            </Field>
            <Field label="Golongan Darah">
              <select value={form.golonganDarah} onChange={(e) => set('golonganDarah', e.target.value)} className={cn(input, 'bg-white')}>
                <option value="">— Pilih —</option>
                {GOLDAR.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
        )}

        {tab === 'kontak' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telepon"><input type="tel" value={form.telepon} onChange={(e) => set('telepon', e.target.value)} className={input} /></Field>
            <div>
              <Field label="WhatsApp"><input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="08xx-xxxx-xxxx" className={input} /></Field>
              <label className="mt-2 flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.whatsappBolehDitampilkan} onChange={(e) => set('whatsappBolehDitampilkan', e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-brand-600" />
                <span>Boleh ditampilkan ke jemaat lain (menu Hubungi, bila Anda bertugas sebagai majelis)</span>
              </label>
            </div>
            <div className="sm:col-span-2"><Field label="Email"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={input} /></Field></div>
            <Field label="Pendidikan Terakhir">
              <select value={form.pendidikanTerakhir} onChange={(e) => set('pendidikanTerakhir', e.target.value)} className={cn(input, 'bg-white')}>
                <option value="">— Pilih —</option>
                {[...new Set([...PENDIDIKAN, form.pendidikanTerakhir].filter(Boolean))].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Pekerjaan"><input value={form.pekerjaan} onChange={(e) => set('pekerjaan', e.target.value)} className={input} /></Field>
            <div className="sm:col-span-2">
              <Field label="Catatan / kebutuhan Anda" hint="Dapat dibaca staf gereja. Bukan catatan internal.">
                <textarea value={form.catatanJemaat} onChange={(e) => set('catatanJemaat', e.target.value)} rows={3} maxLength={2000} className={input} />
              </Field>
            </div>
          </div>
        )}

        {tab === 'alamat' && (
          <div className="space-y-5">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Alamat Rumah Tangga (Kartu Keluarga)</h2>
              {!bolehKk && (
                <p className="text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
                  Alamat KK dipakai seluruh anggota keluarga, sehingga hanya dapat diubah oleh kepala keluarga.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Field label="Alamat"><textarea value={form.kk.alamat} onChange={(e) => setKk('alamat', e.target.value)} disabled={!bolehKk} rows={2} className={input} /></Field></div>
                <Field label="RT"><input value={form.kk.rt} onChange={(e) => setKk('rt', e.target.value)} disabled={!bolehKk} maxLength={5} className={input} /></Field>
                <Field label="RW"><input value={form.kk.rw} onChange={(e) => setKk('rw', e.target.value)} disabled={!bolehKk} maxLength={5} className={input} /></Field>
                <Field label="Kelurahan"><input value={form.kk.kelurahan} onChange={(e) => setKk('kelurahan', e.target.value)} disabled={!bolehKk} className={input} /></Field>
                <Field label="Kecamatan"><input value={form.kk.kecamatan} onChange={(e) => setKk('kecamatan', e.target.value)} disabled={!bolehKk} className={input} /></Field>
                <Field label="Kota"><input value={form.kk.kota} onChange={(e) => setKk('kota', e.target.value)} disabled={!bolehKk} className={input} /></Field>
                <Field label="Kode Pos"><input value={form.kk.kodePos} onChange={(e) => setKk('kodePos', e.target.value)} disabled={!bolehKk} maxLength={10} className={input} /></Field>
                <Field label="Telepon Rumah"><input type="tel" value={form.kk.teleponRumah} onChange={(e) => setKk('teleponRumah', e.target.value)} disabled={!bolehKk} className={input} /></Field>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Alamat KTP</h2>
              <textarea aria-label="Alamat KTP" value={form.alamatKtp} onChange={(e) => set('alamatKtp', e.target.value)} rows={2} className={input} />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.domisiliBerbeda} onChange={(e) => set('domisiliBerbeda', e.target.checked)} className="w-4 h-4 rounded text-brand-600" />
                Alamat domisili berbeda dengan alamat KTP
              </label>
              {form.domisiliBerbeda && (
                <textarea aria-label="Alamat Domisili" value={form.alamatDomisili} onChange={(e) => set('alamatDomisili', e.target.value)} rows={2} className={input} />
              )}
            </section>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={simpan.isPending}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg">
          {simpan.isPending && <Loader2 size={14} className="animate-spin" />} Simpan Perubahan
        </button>
      </div>
    </form>
  )
}
