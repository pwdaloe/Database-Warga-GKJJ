'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { changePasswordRequest } from '@/lib/auth'

const schema = z
  .object({
    passwordLama: z.string().min(1, 'Password sementara wajib diisi'),
    passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
    konfirmasiPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasiPassword'],
  })
  .refine((data) => data.passwordBaru !== data.passwordLama, {
    message: 'Password baru tidak boleh sama dengan password sementara',
    path: ['passwordBaru'],
  })
type FormData = z.infer<typeof schema>

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 sm:py-2.5 rounded-lg border text-base sm:text-sm outline-none transition
    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`

export function ChangePasswordForm() {
  const router = useRouter()
  const { user, loading, refreshUser, logout } = useAuth()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const forced = !!user?.mustChangePassword

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      await changePasswordRequest(data.passwordLama, data.passwordBaru)
      await refreshUser()
      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Terjadi kesalahan, coba lagi'
      setServerError(msg)
    }
  }

  if (loading || !user) {
    return <p className="text-sm text-gray-400">Memuat...</p>
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Buat Password Baru</h2>
      <p className="text-xs text-gray-400 mb-6">
        {forced
          ? 'Demi keamanan, ganti password sementara Anda sebelum melanjutkan.'
          : 'Masukkan password saat ini dan password baru Anda.'}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {forced ? 'Password Sementara' : 'Password Saat Ini'}
          </label>
          <input
            {...register('passwordLama')}
            type="password"
            autoComplete="current-password"
            autoFocus
            className={inputClass(!!errors.passwordLama)}
          />
          {errors.passwordLama && (
            <p className="mt-1 text-xs text-red-600">{errors.passwordLama.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
          <input
            {...register('passwordBaru')}
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            className={inputClass(!!errors.passwordBaru)}
          />
          {errors.passwordBaru && (
            <p className="mt-1 text-xs text-red-600">{errors.passwordBaru.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi Password Baru
          </label>
          <input
            {...register('konfirmasiPassword')}
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            className={inputClass(!!errors.konfirmasiPassword)}
          />
          {errors.konfirmasiPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.konfirmasiPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300
            text-white font-medium py-3 sm:py-2.5 rounded-lg text-sm transition
            flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Memproses...' : 'Simpan Password Baru'}
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full min-h-11 text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          Keluar
        </button>
      </form>
    </>
  )
}
