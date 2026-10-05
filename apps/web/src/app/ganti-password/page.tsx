import { ChangePasswordForm } from './ChangePasswordForm'

export default function GantiPasswordPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-lg mb-4 overflow-hidden">
            <img src="/logo-gkj.jpg" alt="Logo GKJ" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Ganti Password</h1>
          <p className="text-brand-100 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
