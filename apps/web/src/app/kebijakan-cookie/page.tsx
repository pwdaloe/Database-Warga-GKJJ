import Link from 'next/link'
import { ArrowLeft, Cookie } from 'lucide-react'

export const metadata = {
  title: 'Kebijakan Cookie — Database Warga GKJJ',
}

const KATEGORI = [
  {
    nama: 'Esensial',
    wajib: true,
    contoh: 'Token sesi login (disimpan di local storage browser, bukan cookie)',
    tujuan: 'Menjaga status login dan keamanan akses ke sistem',
    durasi: 'Sampai logout atau token kedaluwarsa (7 hari)',
    dasar: 'Kepentingan yang sah — diperlukan agar sistem dapat berfungsi',
  },
  {
    nama: 'Fungsional',
    wajib: false,
    contoh: 'Preferensi tampilan (belum digunakan saat ini)',
    tujuan: 'Mengingat pengaturan tampilan antar sesi',
    durasi: 'Hingga preferensi diubah atau dihapus manual',
    dasar: 'Persetujuan pengguna',
  },
  {
    nama: 'Analitik / Pelacakan',
    wajib: false,
    contoh: 'Belum digunakan — disiapkan untuk kebutuhan mendatang',
    tujuan: 'Memahami penggunaan sistem untuk perbaikan layanan',
    durasi: 'Sesuai konfigurasi penyedia layanan analitik',
    dasar: 'Persetujuan eksplisit pengguna (wajib diminta sebelum aktif)',
  },
  {
    nama: 'Pihak Ketiga',
    wajib: false,
    contoh: 'Tidak ada saat ini',
    tujuan: '—',
    durasi: '—',
    dasar: 'Persetujuan eksplisit pengguna (wajib diminta sebelum aktif)',
  },
]

export default function KebijakanCookiePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mb-6"
        >
          <ArrowLeft size={15} />
          Kembali ke halaman login
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Cookie size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Kebijakan Cookie</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Berlaku untuk Sistem Informasi Jemaat GKJJ (Database Warga GKJJ) · Terakhir diperbarui {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-8">
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">1. Ringkasan</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sistem ini <strong>tidak memasang cookie pelacakan atau analitik pihak ketiga</strong>.
              Untuk menjaga sesi login, sistem menggunakan <em>local storage</em> browser (bukan
              cookie) untuk menyimpan token akses. Halaman ini kami sediakan untuk transparansi
              penuh mengenai penyimpanan data di sisi browser Anda, dan sebagai kerangka kebijakan
              apabila di masa depan kami menambahkan cookie fungsional atau analitik.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">2. Kategori penyimpanan &amp; cookie</h2>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 px-2 font-medium">Kategori</th>
                    <th className="py-2 px-2 font-medium">Contoh</th>
                    <th className="py-2 px-2 font-medium">Tujuan</th>
                    <th className="py-2 px-2 font-medium">Durasi</th>
                    <th className="py-2 px-2 font-medium">Dasar pemrosesan</th>
                  </tr>
                </thead>
                <tbody>
                  {KATEGORI.map((k) => (
                    <tr key={k.nama} className="border-b border-gray-100 align-top">
                      <td className="py-3 px-2 font-medium text-gray-700 whitespace-nowrap">
                        {k.nama}
                        {k.wajib && (
                          <span className="block text-[10px] font-normal text-gray-400 mt-0.5">wajib</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{k.contoh}</td>
                      <td className="py-3 px-2 text-gray-600">{k.tujuan}</td>
                      <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{k.durasi}</td>
                      <td className="py-3 px-2 text-gray-600">{k.dasar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">3. Pilihan Anda</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Saat pertama kali mengakses sistem, Anda dapat memilih <strong>&ldquo;Hanya
              Esensial&rdquo;</strong> atau <strong>&ldquo;Terima Semua&rdquo;</strong> melalui
              banner persetujuan. Karena saat ini tidak ada cookie non-esensial yang aktif, kedua
              pilihan memiliki efek yang sama — pilihan Anda tersimpan di local storage browser dan
              akan digunakan begitu kategori non-esensial diaktifkan di masa depan. Anda dapat
              menghapus pilihan ini kapan saja melalui pengaturan browser (hapus data situs) untuk
              melihat banner kembali.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">4. Data pribadi</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Kebijakan ini hanya membahas penyimpanan teknis di browser. Untuk informasi mengenai
              bagaimana data pribadi jemaat dikumpulkan, digunakan, dan dilindungi sesuai UU No.
              27 Tahun 2022 tentang Pelindungan Data Pribadi, silakan baca{' '}
              <Link href="/kebijakan-privasi" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
                Kebijakan Privasi (PDP)
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">5. Kontak</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Pertanyaan mengenai kebijakan ini dapat disampaikan ke{' '}
              <a href="mailto:gkjjkeu@outlook.com" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
                gkjjkeu@outlook.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
