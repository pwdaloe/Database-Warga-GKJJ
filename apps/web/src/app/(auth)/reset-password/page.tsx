import { Suspense } from 'react'
import { ResetPasswordForm } from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-lg mb-4 overflow-hidden">
            <img src="/logo-gkj.jpg" alt="Logo GKJ" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">Reset Password</h1>
          <p className="text-brand-100 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense fallback={<p className="text-sm text-gray-400">Memuat...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
