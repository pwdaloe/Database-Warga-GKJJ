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
