import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Kebijakan Privasi (PDP) — Database Warga GKJJ',
}

const DATA_DIKUMPULKAN = [
  { kategori: 'Identitas', contoh: 'Nama lengkap, nama panggilan, jenis kelamin, tempat & tanggal lahir, foto' },
  { kategori: 'Data spesifik (sensitif)', contoh: 'NIK (dienkripsi AES-256), golongan darah, status keanggotaan gereja (data keagamaan)' },
  { kategori: 'Kontak & lokasi', contoh: 'Alamat KTP & domisili, koordinat lokasi, telepon, WhatsApp, email' },
  { kategori: 'Data keanggotaan gereja', contoh: 'Status baptis & sidi, nomor anggota/induk, riwayat kelompok & wilayah' },
  { kategori: 'Data lain', contoh: 'Pendidikan terakhir, pekerjaan' },
]

const HAK_SUBJEK = [
  { hak: 'Hak atas informasi', desc: 'Mengetahui kejelasan identitas, dasar hukum, tujuan pemrosesan sebelum data diproses (Pasal 5).' },
  { hak: 'Hak akses & salinan', desc: 'Melengkapi/memperbarui data pribadi yang tidak akurat (Pasal 6–7).' },
  { hak: 'Hak penghapusan', desc: 'Mengakhiri pemrosesan, menghapus, dan/atau memusnahkan data pribadi sesuai peraturan (Pasal 8).' },
  { hak: 'Hak menarik persetujuan', desc: 'Menarik kembali persetujuan pemrosesan data yang telah diberikan (Pasal 9).' },
  { hak: 'Hak keberatan', desc: 'Mengajukan keberatan atas tindakan pengambilan keputusan otomatis yang berdampak hukum (Pasal 10).' },
  { hak: 'Hak penundaan/pembatasan', desc: 'Menunda atau membatasi pemrosesan data secara proporsional (Pasal 11).' },
  { hak: 'Hak gugatan & kompensasi', desc: 'Menuntut dan menerima ganti rugi atas pelanggaran pemrosesan data pribadi (Pasal 12).' },
]

export default function KebijakanPrivasiPage() {
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
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Kebijakan Privasi &amp; Pelindungan Data Pribadi</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (PDP) · Sistem Informasi
          Jemaat GKJJ · Terakhir diperbarui {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-8">
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">1. Pengendali data</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Gereja Kristen Jawa Jakarta (GKJJ) adalah pengendali data pribadi (<em>data
              controller</em>) untuk data jemaat yang tersimpan dalam sistem ini. Pengelolaan
              teknis dijalankan oleh pengurus/administrator sistem yang ditugaskan oleh gereja.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">2. Data pribadi yang dikumpulkan</h2>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse min-w-[480px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 px-2 font-medium">Kategori</th>
                    <th className="py-2 px-2 font-medium">Contoh data</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_DIKUMPULKAN.map((d) => (
                    <tr key={d.kategori} className="border-b border-gray-100 align-top">
                      <td className="py-3 px-2 font-medium text-gray-700 whitespace-nowrap">{d.kategori}</td>
                      <td className="py-3 px-2 text-gray-600">{d.contoh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              NIK, tanggal lahir, tempat lahir, alamat, koordinat lokasi, dan foto tergolong data
              pribadi yang bersifat spesifik dan diperlakukan dengan perlindungan lebih tinggi
              sesuai Pasal 4 ayat (2) UU PDP.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">3. Dasar &amp; tujuan pemrosesan</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Data pribadi jemaat diproses berdasarkan <strong>persetujuan eksplisit</strong> yang
              diberikan pada saat pendataan, serta <strong>kepentingan yang sah</strong> gereja
              untuk keperluan administrasi keanggotaan, pelayanan pastoral, penerbitan kartu
              keanggotaan, dan pelaporan internal. Data tidak digunakan untuk kepentingan komersial
              dan tidak dibagikan ke pihak ketiga di luar keperluan pelayanan gereja.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">4. Hak Anda sebagai subjek data</h2>
            <ul className="space-y-3">
              {HAK_SUBJEK.map((h) => (
                <li key={h.hak} className="text-sm">
                  <span className="font-medium text-gray-700">{h.hak}.</span>{' '}
                  <span className="text-gray-600">{h.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">5. Keamanan &amp; retensi data</h2>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 space-y-1.5">
              <li>NIK disimpan dalam bentuk terenkripsi (AES-256).</li>
              <li>Akses ke data dibatasi sesuai peran pengguna (role-based access), dengan sejumlah field disamarkan otomatis untuk peran yang tidak berwenang.</li>
              <li>Setiap akses dan perubahan data pribadi sensitif dicatat dalam log audit internal.</li>
              <li>Data disimpan selama jemaat masih berstatus aktif atau sesuai jangka waktu retensi yang ditetapkan gereja, dan dapat dihapus/dimusnahkan atas permintaan sesuai ketentuan yang berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">6. Cara menggunakan hak Anda</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Untuk mengajukan permintaan akses, koreksi, penghapusan data, atau pertanyaan lain
              terkait privasi, silakan hubungi pengurus/administrator gereja melalui{' '}
              <a href="mailto:gkjjkeu@outlook.com" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
                gkjjkeu@outlook.com
              </a>
              . Permintaan akan ditindaklanjuti sesuai ketentuan UU No. 27 Tahun 2022.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">7. Penyimpanan teknis di browser</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Informasi mengenai penyimpanan teknis di sisi browser (local storage, cookie) dijelaskan
              terpisah di{' '}
              <Link href="/kebijakan-cookie" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
                Kebijakan Cookie
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
