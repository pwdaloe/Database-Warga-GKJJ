'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { forgotPasswordRequest } from '@/lib/auth'

const schema = z.object({
  usernameOrEmail: z.string().min(1, 'Username atau email wajib diisi'),
})
type FormData = z.infer<typeof schema>

export default function MobileForgotPasswordPage() {
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const result = await forgotPasswordRequest(data.usernameOrEmail)
      setSuccessMessage(result.message)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Terjadi kesalahan, coba lagi'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#2d5a9e] flex flex-col items-center justify-center px-6 pb-10">
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center overflow-hidden mb-5">
          <img src="/logo-gkj.jpg" alt="GKJ Jakarta" className="w-20 h-20 object-contain" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Lupa Password</h1>
        <p className="text-blue-200 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
        {successMessage ? (
          <>
            <h2 className="text-gray-800 text-xl font-semibold mb-1">Permintaan Terkirim</h2>
            <p className="text-gray-500 text-sm mt-4">{successMessage}</p>
            <a
              href="/m/login"
              className="mt-6 inline-block text-sm text-[#1e3a5f] font-medium hover:underline"
            >
              Kembali ke login
            </a>
          </>
        ) : (
          <>
            <h2 className="text-gray-800 text-xl font-semibold mb-1">Reset Password</h2>
            <p className="text-gray-400 text-sm mb-7">
              Masukkan username atau email akun Anda, kami akan kirimkan link reset password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  {serverError}
                </div>
              )}

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Username atau Email
                </label>
                <input
                  {...register('usernameOrEmail')}
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  placeholder="Masukkan username atau email"
                  className="w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"
                />
                {errors.usernameOrEmail && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.usernameOrEmail.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-gray-200 disabled:text-gray-400 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 transition mt-2"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {isSubmitting ? 'Memproses...' : 'Kirim Link Reset'}
              </button>
            </form>

            <p className="text-center mt-5">
              <a href="/m/login" className="text-sm text-[#1e3a5f] font-medium hover:underline">
                Kembali ke login
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
