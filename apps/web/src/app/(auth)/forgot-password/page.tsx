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

export default function ForgotPasswordPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-lg mb-4 overflow-hidden">
            <img src="/logo-gkj.jpg" alt="Logo GKJ" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">Lupa Password</h1>
          <p className="text-brand-100 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {successMessage ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Permintaan Terkirim</h2>
              <p className="text-sm text-gray-600 mt-4">{successMessage}</p>
              <a
                href="/login"
                className="mt-6 inline-block text-sm text-brand-600 hover:text-brand-700 hover:underline"
              >
                Kembali ke halaman login
              </a>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Reset Password</h2>
              <p className="text-xs text-gray-400 mb-6">
                Masukkan username atau email akun Anda, kami akan kirimkan link reset password.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {serverError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Username atau Email
                  </label>
                  <input
                    {...register('usernameOrEmail')}
                    type="text"
                    autoComplete="username"
                    autoFocus
                    placeholder="Masukkan username atau email"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
                      focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                      ${errors.usernameOrEmail ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  />
                  {errors.usernameOrEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.usernameOrEmail.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300
                    text-white font-medium py-2.5 rounded-lg text-sm transition
                    flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Memproses...' : 'Kirim Link Reset'}
                </button>

                <p className="text-center">
                  <a
                    href="/login"
                    className="text-sm text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Kembali ke login
                  </a>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
