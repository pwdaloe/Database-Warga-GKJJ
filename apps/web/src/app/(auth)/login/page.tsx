import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-lg mb-4 overflow-hidden">
            <img
              src="/logo-gkj.jpg"
              alt="Logo GKJ"
              className="w-20 h-20 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-white leading-tight">
            Database Warga
          </h1>
          <p className="text-brand-100 text-sm mt-1">
            Gereja Kristen Jawa Jakarta
          </p>

          {/* Versi */}
          <div className="flex items-center justify-center mt-2.5">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-brand-100 border border-white/20 tracking-wide">
              Versi 1.0
            </span>
          </div>
        </div>

        {/* Card login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Masuk ke Sistem</h2>
          <p className="text-xs text-gray-400 mb-6">Silakan masukkan kredensial Anda</p>
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-1.5">
          <p className="text-brand-200 text-xs">
            © {new Date().getFullYear()} GKJJ — Sistem Informasi Jemaat
          </p>
          <p className="text-brand-300 text-xs">
            Butuh bantuan?{' '}
            <a
              href="mailto:gkjjkeu@outlook.com"
              className="text-white underline underline-offset-2 hover:text-brand-100 transition-colors"
            >
              gkjjkeu@outlook.com
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
