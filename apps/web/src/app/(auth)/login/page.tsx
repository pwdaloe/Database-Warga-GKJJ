import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <span className="text-3xl">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Database Warga</h1>
          <p className="text-brand-100 text-sm mt-1">Gereja Kristen Jawa Jakarta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Masuk ke Sistem</h2>
          <LoginForm />
        </div>

        <p className="text-center text-brand-200 text-xs mt-6">
          © {new Date().getFullYear()} GKJJ — Sistem Informasi Jemaat
        </p>
      </div>
    </div>
  )
}
