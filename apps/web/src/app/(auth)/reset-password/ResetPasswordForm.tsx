'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { resetPasswordRequest } from '@/lib/auth'

const schema = z
  .object({
    passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
    konfirmasiPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasiPassword'],
  })
type FormData = z.infer<typeof schema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!token) return
    setServerError('')
    try {
      const result = await resetPasswordRequest(token, data.passwordBaru)
      setSuccessMessage(result.message)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Terjadi kesalahan, coba lagi'
      setServerError(msg)
    }
  }

  if (!token) {
    return (
      <>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Link Tidak Valid</h2>
        <p className="text-sm text-gray-600 mt-4">
          Link reset password tidak valid, minta link baru.
        </p>
        <a
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-brand-600 hover:text-brand-700 hover:underline"
        >
          Minta link reset baru
        </a>
      </>
    )
  }

  if (successMessage) {
    return (
      <>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Password Berhasil Direset</h2>
        <p className="text-sm text-gray-600 mt-4">{successMessage}</p>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-6 w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
        >
          Ke halaman login
        </button>
      </>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Reset Password</h2>
      <p className="text-xs text-gray-400 mb-6">Masukkan password baru Anda.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
          <input
            {...register('passwordBaru')}
            type="password"
            autoComplete="new-password"
            autoFocus
            placeholder="Minimal 8 karakter"
            className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
              focus:ring-2 focus:ring-brand-500 focus:border-brand-500
              ${errors.passwordBaru ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
          />
          {errors.passwordBaru && (
            <p className="mt-1 text-xs text-red-600">{errors.passwordBaru.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi Password
          </label>
          <input
            {...register('konfirmasiPassword')}
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
              focus:ring-2 focus:ring-brand-500 focus:border-brand-500
              ${errors.konfirmasiPassword ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
          />
          {errors.konfirmasiPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.konfirmasiPassword.message}</p>
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
          {isSubmitting ? 'Memproses...' : 'Reset Password'}
        </button>
      </form>
    </>
  )
}
