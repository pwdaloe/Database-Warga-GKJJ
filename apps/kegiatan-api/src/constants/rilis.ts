/**
 * Catatan rilis aplikasi Kegiatan. Tambahkan entri BARU DI ATAS setiap ada pembaruan, penambahan fitur, atau perbaikan bug,
 * dan samakan `versi` dengan "version" di package.json apps/kegiatan-api dan apps/kegiatan-web (dijaga oleh tes).
 * Versi mengikuti semver: MAJOR.MINOR.PATCH (fitur baru = MINOR, perbaikan bug = PATCH).
 */
export type JenisPerubahan = 'BARU' | 'PEMBARUAN' | 'PERBAIKAN'

export interface Rilis {
  versi: string
  /** YYYY-MM-DD */
  tanggal: string
  judul: string
  perubahan: Array<{ jenis: JenisPerubahan; teks: string }>
}

export const RILIS: readonly Rilis[] = [
  {
    versi: '0.4.0',
    tanggal: '2026-11-10',
    judul: 'Pagu bidang, dana Gereja, dan tahap pra-muker',
    perubahan: [
      { jenis: 'BARU', teks: 'Pagu ditetapkan per bidang (batas dana Gereja) dan per pos Penatalayanan, Ministerium, dan Kemajelisan. Alokasi per UPK kini hanya panduan yang dibagi ketua bidang saat pra-muker.' },
      { jenis: 'BARU', teks: 'Proyeksi Kas Jemaat tahun anggaran sebagai pembanding total pagu di dashboard.' },
      { jenis: 'BARU', teks: 'Tahap siklus anggaran: penyusunan UPK, pra-muker (ketua bidang dan admin), muker (admin dan sekretariat), lalu ditetapkan (dikunci). Angka Usulan UPK dipotret otomatis saat pra-muker dimulai.' },
      { jenis: 'BARU', teks: 'Halaman Alokasi untuk ketua bidang: membagi pagu bidang ke UPK dan melihat usulan dana Gereja di samping alokasinya.' },
      { jenis: 'PEMBARUAN', teks: 'Dashboard membandingkan pagu dengan dana Gereja yang diminta (bukan total anggaran), merinci swadaya, penggalangan, dan donasi, serta menandai program yang mandiri penuh, campuran, atau bergantung Kas Jemaat.' },
      { jenis: 'PEMBARUAN', teks: 'Ketua bidang dapat membuat dan mengubah program di bidangnya pada tahap pra-muker; program yang sudah diajukan diubah langsung tanpa ditarik.' },
      { jenis: 'PEMBARUAN', teks: 'Perubahan pagu dan alokasi mencatat nilai lama dan baru di jejak audit.' },
    ],
  },
  {
    versi: '0.3.0',
    tanggal: '2026-10-27',
    judul: 'Pemberitahuan saat aplikasi diperbarui',
    perubahan: [
      { jenis: 'BARU', teks: 'Bar kuning "Aplikasi sedang diperbarui" selama pembaruan berlangsung, meminta pengguna menyimpan pekerjaan dan memuat ulang halaman setelah selesai.' },
      { jenis: 'BARU', teks: 'Bar biru "Versi baru tersedia" dengan tombol Muat ulang bila aplikasi sudah diperbarui, juga bila halaman lama gagal memuat berkas.' },
    ],
  },
  {
    versi: '0.2.0',
    tanggal: '2026-10-27',
    judul: 'Logo, versi aplikasi, dan bantuan WhatsApp',
    perubahan: [
      { jenis: 'BARU', teks: 'Logo GKJ pada halaman masuk dan pojok kiri atas.' },
      { jenis: 'BARU', teks: 'Nomor versi dan halaman "Apa yang baru" yang mencatat setiap pembaruan, penambahan, dan perbaikan.' },
      { jenis: 'BARU', teks: 'Ikon WhatsApp di kanan atas untuk menghubungi pusat bantuan. Nomor dan pesan awalnya diatur admin di Master data > Dukungan.' },
      { jenis: 'PERBAIKAN', teks: 'Batas percobaan masuk kini hanya menghitung login yang gagal, sehingga banyak pengurus yang masuk dari jaringan yang sama tidak saling terkunci.' },
    ],
  },
  {
    versi: '0.1.0',
    tanggal: '2026-10-27',
    judul: 'Rilis pertama di produksi',
    perubahan: [
      { jenis: 'BARU', teks: 'Pengajuan program kerja UPK dengan formulir 10 bagian, rencana anggaran biaya, dan sumber dana.' },
      { jenis: 'BARU', teks: 'Dashboard pagu dan pengajuan per unit, bidang, dan acuan visi-misi.' },
      { jenis: 'BARU', teks: 'Master data: struktur dan anggaran (7 bidang, UPK, dan pos biaya), pengurus, visi-misi, satuan, dan kategori biaya.' },
      { jenis: 'BARU', teks: 'Akun per pengurus unit, Ketua Bidang, dan pengawas (Penatua, LP4WG, Kepala Kantor, Ministerium).' },
    ],
  },
]

export const RILIS_TERBARU: Rilis = RILIS[0]!
