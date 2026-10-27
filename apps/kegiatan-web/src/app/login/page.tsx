'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { pesanGalat } from '@/lib/api'
import Link from 'next/link'
import { useVersi } from '@/hooks/useData'
import { Logo } from '@/components/Logo'
import { Bidang, Input, Kartu, Pemberitahuan, Tombol } from '@/components/ui'

export default function HalamanLogin() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const versi = useVersi()

  async function kirim(e: React.FormEvent) {
    e.preventDefault()
    setSibuk(true)
    setGalat('')
    try {
      const u = await login(username.trim(), password)
      router.replace(u.wajibGantiPassword ? '/ganti-password' : '/program')
    } catch (err) {
      setGalat(pesanGalat(err, 'Tidak dapat masuk. Periksa username dan password.'))
    } finally {
      setSibuk(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-marine-700 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center text-white">
          <Logo ukuran={80} className="mb-3 p-1" />
          <h1 className="text-xl font-bold">Kegiatan GKJ Jakarta</h1>
          <p className="mt-1 text-sm text-marine-100">Pengajuan program kerja dan anggaran UPK</p>
        </div>
        <Kartu>
          <form onSubmit={kirim} className="space-y-4">
            <Bidang label="Username" wajib>
              <Input autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Bidang>
            <Bidang label="Password" wajib>
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Bidang>
            {galat && <Pemberitahuan nada="merah">{galat}</Pemberitahuan>}
            <Tombol type="submit" sibuk={sibuk} className="w-full">Masuk</Tombol>
          </form>
        </Kartu>
        <p className="mt-4 text-center text-xs text-marine-100">Lupa password atau belum punya akun? Hubungi sekretariat gereja.</p>
        {versi.data && (
          <p className="mt-2 text-center text-xs text-marine-100/80">
            <Link href="/versi" className="underline-offset-2 hover:underline">Versi {versi.data.versi} · Apa yang baru</Link>
          </p>
        )}
      </div>
    </main>
  )
}
