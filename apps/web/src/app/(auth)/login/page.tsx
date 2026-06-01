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

        {/* Badge PDP Compliance */}
        <div className="mt-5 bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            {/* Shield icon */}
            <div className="shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-300" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 1.5a.75.75 0 0 1 .675.423l2.25 4.5a.75.75 0 0 1-.675 1.077H9.75a.75.75 0 0 1-.675-1.077l2.25-4.5A.75.75 0 0 1 12 1.5ZM12 3.621 10.829 6h2.342L12 3.621Z" clipRule="evenodd" />
                <path d="M12 2.25c-.966 0-1.878.19-2.71.532a.75.75 0 0 0 .546 1.393A8.217 8.217 0 0 1 12 3.75c4.556 0 8.25 3.694 8.25 8.25s-3.694 8.25-8.25 8.25S3.75 16.556 3.75 12c0-.88.138-1.728.394-2.522a.75.75 0 1 0-1.43-.452A9.719 9.719 0 0 0 2.25 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-white tracking-wide">
                  Sistem Informasi Jemaat GKJJ
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-400/20 border border-green-400/40 text-green-300 text-[10px] font-semibold tracking-wider uppercase">
                  ✓ PDP Compliant
                </span>
              </div>
              <p className="text-brand-100 text-[11px] leading-relaxed">
                Sistem ini telah memenuhi ketentuan{' '}
                <span className="text-white font-medium">UU No. 27 Tahun 2022</span>{' '}
                tentang Perlindungan Data Pribadi (PDP). Setiap data jemaat yang
                tersimpan diproses atas dasar persetujuan (<em>consent</em>) yang sah,
                dienkripsi, dan hanya dapat diakses oleh pengguna berwenang sesuai perannya.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center space-y-1.5">
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
