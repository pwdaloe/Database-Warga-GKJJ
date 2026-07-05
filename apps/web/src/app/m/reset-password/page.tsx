import { Suspense } from 'react'
import { MobileResetPasswordForm } from './MobileResetPasswordForm'

export default function MobileResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#2d5a9e] flex flex-col items-center justify-center px-6 pb-10">
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center overflow-hidden mb-5">
          <img src="/logo-gkj.jpg" alt="GKJ Jakarta" className="w-20 h-20 object-contain" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-blue-200 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
        <Suspense fallback={<p className="text-sm text-gray-400">Memuat...</p>}>
          <MobileResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
