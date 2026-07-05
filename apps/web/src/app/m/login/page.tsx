'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function MobileLoginPage() {
  const { user, login } = useAuth()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (user) router.replace('/m/warga')
  }, [user, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      router.replace('/m/warga')
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#2d5a9e] flex flex-col items-center justify-center px-6 pb-10">

      {/* Logo & Judul */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center overflow-hidden mb-5">
          <img src="/logo-gkj.jpg" alt="GKJ Jakarta" className="w-20 h-20 object-contain" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">GKJJ Jemaat</h1>
        <p className="text-blue-200 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
        <h2 className="text-gray-800 text-xl font-semibold mb-1">Masuk</h2>
        <p className="text-gray-400 text-sm mb-7">Masukkan akun yang diberikan gereja</p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              placeholder="Masukkan username"
              className="w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="w-full h-14 px-4 pr-12 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full h-14 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-gray-200 disabled:text-gray-400 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 transition mt-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center mt-5">
          <a href="/m/forgot-password" className="text-sm text-[#1e3a5f] font-medium hover:underline">
            Lupa password?
          </a>
        </p>
      </div>

      <p className="text-blue-200/60 text-xs mt-8 text-center">
        © {new Date().getFullYear()} GKJJ · Dilindungi UU PDP No. 27/2022
      </p>
    </div>
  )
}
