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

export function MobileResetPasswordForm() {
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
        <h2 className="text-gray-800 text-xl font-semibold mb-1">Link Tidak Valid</h2>
        <p className="text-gray-500 text-sm mt-4">
          Link reset password tidak valid, minta link baru.
        </p>
        <a
          href="/m/forgot-password"
          className="mt-6 inline-block text-sm text-[#1e3a5f] font-medium hover:underline"
        >
          Minta link reset baru
        </a>
      </>
    )
  }

  if (successMessage) {
    return (
      <>
        <h2 className="text-gray-800 text-xl font-semibold mb-1">Password Berhasil Direset</h2>
        <p className="text-gray-500 text-sm mt-4">{successMessage}</p>
        <button
          type="button"
          onClick={() => router.push('/m/login')}
          className="w-full h-14 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-base font-semibold rounded-2xl mt-6 transition"
        >
          Ke halaman login
        </button>
      </>
    )
  }

  return (
    <>
      <h2 className="text-gray-800 text-xl font-semibold mb-1">Reset Password</h2>
      <p className="text-gray-400 text-sm mb-7">Masukkan password baru Anda.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Password Baru</label>
          <input
            {...register('passwordBaru')}
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            className="w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"
          />
          {errors.passwordBaru && (
            <p className="mt-1.5 text-sm text-red-600">{errors.passwordBaru.message}</p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Konfirmasi Password
          </label>
          <input
            {...register('konfirmasiPassword')}
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            className="w-full h-14 px-4 text-base rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition"
          />
          {errors.konfirmasiPassword && (
            <p className="mt-1.5 text-sm text-red-600">{errors.konfirmasiPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-[#1e3a5f] hover:bg-[#16304f] disabled:bg-gray-200 disabled:text-gray-400 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 transition mt-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {isSubmitting ? 'Memproses...' : 'Reset Password'}
        </button>
      </form>
    </>
  )
}
