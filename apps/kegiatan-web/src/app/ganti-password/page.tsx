'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api, pesanGalat } from '@/lib/api'
import { Bidang, Input, Kartu, Memuat, Pemberitahuan, Tombol } from '@/components/ui'

export default function GantiPassword() {
  const { user, loading, muatUlang } = useAuth()
  const router = useRouter()
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) return <Memuat />

  async function kirim(e: React.FormEvent) {
    e.preventDefault()
    if (baru !== ulang) return setGalat('Konfirmasi password tidak sama.')
    if (baru.length < 10) return setGalat('Password baru minimal 10 karakter.')
    setSibuk(true)
    setGalat('')
    try {
      await api.post('/auth/ganti-password', { passwordLama: lama, passwordBaru: baru })
      await muatUlang()
      router.replace('/program')
    } catch (err) {
      setGalat(pesanGalat(err))
    } finally {
      setSibuk(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <Kartu judul="Ganti password" className="w-full">
        <form onSubmit={kirim} className="space-y-4">
          {user.wajibGantiPassword && <Pemberitahuan nada="kuning">Anda memakai password sementara. Buat password baru sebelum melanjutkan.</Pemberitahuan>}
          <Bidang label="Password saat ini" wajib><Input type="password" autoComplete="current-password" value={lama} onChange={(e) => setLama(e.target.value)} required /></Bidang>
          <Bidang label="Password baru" petunjuk="Minimal 10 karakter." wajib><Input type="password" autoComplete="new-password" value={baru} onChange={(e) => setBaru(e.target.value)} required /></Bidang>
          <Bidang label="Ulangi password baru" wajib><Input type="password" autoComplete="new-password" value={ulang} onChange={(e) => setUlang(e.target.value)} required /></Bidang>
          {galat && <Pemberitahuan nada="merah">{galat}</Pemberitahuan>}
          <Tombol type="submit" sibuk={sibuk} className="w-full">Simpan password</Tombol>
        </form>
      </Kartu>
    </main>
  )
}
