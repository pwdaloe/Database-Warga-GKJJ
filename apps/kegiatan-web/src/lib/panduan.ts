import type { Peran } from './tipe'

/**
 * Isi halaman Panduan (/panduan). Satu sumber teks; ubah di sini lalu rilis. Menjelaskan alur yang berjalan SAAT INI
 * (hak akses mengikuti apps/kegiatan-api/src/domain/akses.ts). Contoh isian hanya ilustrasi, jangan disalin apa adanya.
 */

export interface TahapPanduan {
  kode: string
  nama: string
  siapa: string
  apa: string
}

export const TAHAP_PANDUAN: readonly TahapPanduan[] = [
  { kode: 'DIBUKA', nama: 'Penyusunan UPK', siapa: 'Pengurus UPK (admin dan sekretariat dapat membantu)', apa: 'Mengisi formulir kegiatan, menyimpan draft, lalu mengajukan. Kegiatan yang sudah diajukan terkunci, tetapi dapat ditarik kembali ke draft selama pengajuan dibuka.' },
  { kode: 'DITUTUP', nama: 'Penyusunan ditutup', siapa: 'Admin dan sekretariat', apa: 'Pengurus UPK tidak dapat lagi mengubah atau menarik kembali. Perbaikan mendesak lewat sekretariat, yang masih dapat membantu mengubah kegiatan.' },
  { kode: 'PRA_MUKER', nama: 'Pra-muker', siapa: 'Ketua bidang (bidangnya sendiri), admin, sekretariat', apa: 'Ketua bidang membahas dan merumuskan kegiatan unit-unitnya dan membagi pagu bidang ke UPK lewat menu Alokasi. Usulan asli UPK disimpan sebagai potret saat tahap ini dimulai.' },
  { kode: 'MUKER', nama: 'Muker', siapa: 'Admin dan sekretariat', apa: 'Hasil pembahasan dicatat. Hanya admin atau sekretariat yang mengubah angka.' },
  { kode: 'DITETAPKAN', nama: 'Ditetapkan', siapa: 'Tidak ada (dikunci)', apa: 'Angka final. Kegiatan dan pagu tidak dapat diubah.' },
]

export interface BagianFormulir {
  no: number
  judul: string
  wajib: boolean
  tujuan: string
  cara: string[]
  contoh?: string
  kesalahan: string[]
}

export const BAGIAN_FORMULIR: readonly BagianFormulir[] = [
  {
    no: 1, judul: 'Identitas kegiatan', wajib: true,
    tujuan: 'Menamai kegiatan, menunjuk penanggung jawab, dan (bila ada) menautkan ke kegiatan 2026.',
    cara: [
      'Nama kegiatan: satu kegiatan = satu hasil utama. Kelompokkan aktivitas yang menuju hasil yang sama; jangan membuat satu kegiatan untuk setiap acara kecil.',
      'Jenis kegiatan: pilih yang paling sesuai (baru, lanjutan, atau perbaikan).',
      'Rujukan kegiatan 2026: pilih bila ini lanjutan atau perbaikan. Evaluasi 2026 (kategori dan rekomendasinya) akan muncul sebagai bahan pertimbangan.',
      'Penanggung jawab (PIC) dan WhatsApp PIC wajib diisi dengan nomor yang valid (08… atau 62…), untuk klarifikasi data.',
      'Admin, sekretariat, dan ketua bidang memilih unit pengusul terlebih dulu. Pengurus UPK otomatis memakai unitnya.',
    ],
    contoh: 'Retret Keluarga Muda 2027 (bukan: "Retret, bazar, dan pelatihan komisi").',
    kesalahan: ['Nama terlalu umum ("Kegiatan komisi").', 'Nomor WhatsApp PIC kosong atau salah format, sehingga kegiatan tidak bisa diajukan.'],
  },
  {
    no: 2, judul: 'Acuan visi dan misi', wajib: true,
    tujuan: 'Menunjukkan kegiatan ini menggerakkan bagian mana dari visi gereja.',
    cara: [
      'Baca kutipan visi di bagian ini, lalu centang minimal satu acuan.',
      'Uji sederhana: jika kegiatan ini berhasil, bagian mana dari visi yang menjadi lebih nyata?',
      'Bila daftar acuan kosong, hubungi sekretariat (acuan diisi per tahun).',
    ],
    kesalahan: ['Mencentang semua acuan agar aman. Pilih yang benar-benar dituju.'],
  },
  {
    no: 3, judul: 'Latar belakang dan kebutuhan', wajib: true,
    tujuan: 'Menjelaskan mengapa kegiatan ini perlu, dengan dasar nyata.',
    cara: [
      'Latar belakang: data, masukan jemaat, atau evaluasi yang mendasari kegiatan.',
      'Rumusan kebutuhan: kebutuhan nyata yang dijawab, bukan sekadar keinginan.',
    ],
    contoh: 'Dari evaluasi 2026, 14 dari 20 keluarga muda menyatakan sulit mendapat waktu bersama untuk berbagi pergumulan. Kebutuhan: ruang pertemuan yang terjadwal dan terarah.',
    kesalahan: ['Hanya menulis "karena rutin setiap tahun".', 'Menulis solusi di kolom kebutuhan.'],
  },
  {
    no: 4, judul: 'Tujuan dan sasaran', wajib: true,
    tujuan: 'Menyatakan perubahan yang diharapkan dan siapa yang dilayani.',
    cara: [
      'Tujuan: perubahan atau manfaat yang diharapkan, bukan daftar aktivitas.',
      'Sasaran atau penerima manfaat: kelompok yang dilayani.',
      'Target jumlah peserta (opsional, tetapi dipakai untuk menghitung biaya per peserta).',
    ],
    kesalahan: ['Tujuan berbunyi "mengadakan retret". Itu aktivitas; tujuannya misalnya "keluarga muda memiliki kebiasaan berbagi pergumulan".'],
  },
  {
    no: 5, judul: 'Rencana aktivitas dan jadwal', wajib: true,
    tujuan: 'Merinci aktivitas yang membentuk kegiatan ini, beserta waktunya.',
    cara: [
      'Tambahkan satu kartu untuk setiap aktivitas (minimal satu).',
      'Kategori waktu menentukan isian: Sekali (satu tanggal), Rentang (tanggal mulai dan selesai), Periode (mis. setiap bulan; isi keterangan periode), atau Sepanjang tahun.',
      'Lokasi dan hasil langsung bersifat opsional, tetapi membantu pembahasan.',
    ],
    kesalahan: ['Kategori Sekali tanpa tanggal, atau Rentang tanpa tanggal selesai, membuat kegiatan belum lengkap untuk diajukan.'],
  },
  {
    no: 6, judul: 'Indikator keberhasilan', wajib: true,
    tujuan: 'Menentukan bagaimana keberhasilan diukur dan dibuktikan.',
    cara: [
      'Minimal satu indikator. Isi indikator, target, dan bukti.',
      'Ukur hasil, bukan hanya aktivitas: berapa, seberapa baik, dan bukti apa.',
    ],
    contoh: 'Indikator: peserta menyatakan terbantu berbagi pergumulan. Target: 80% dari peserta. Bukti: formulir umpan balik akhir retret.',
    kesalahan: ['Indikator "retret terlaksana". Itu aktivitas, belum hasil.', 'Target tanpa angka atau bukti yang tidak bisa diperiksa.'],
  },
  {
    no: 7, judul: 'Rencana anggaran biaya (RAB)', wajib: true,
    tujuan: 'Menghitung kebutuhan biaya dari aktivitas nyata.',
    cara: [
      'Satu baris untuk satu jenis biaya. Isi uraian, volume, satuan, dan harga satuan.',
      'Jumlah per baris dan total anggaran dihitung otomatis dan tidak dapat diketik. Angka ditulis tanpa titik atau koma; titik ribuan muncul sendiri.',
      'Dasar perhitungan membantu pembahasan, mis. "20 orang × 4 pertemuan".',
      'Pilih kategori biaya agar rekapitulasi per kategori benar.',
    ],
    contoh: 'Konsumsi pertemuan | 4 | kali | Rp 600.000 | 20 orang × Rp 30.000.',
    kesalahan: [
      'Menyalin angka contoh tanpa dihitung dari kebutuhan nyata.',
      'Mencampur kebutuhan utama dengan tambahan yang bisa ditunda. Pisahkan agar mudah dipangkas bila perlu.',
      'Total anggaran Rp 0 membuat kegiatan tidak bisa diajukan.',
    ],
  },
  {
    no: 8, judul: 'Sumber dana', wajib: true,
    tujuan: 'Membagi total anggaran ke sumber pendanaannya.',
    cara: [
      'Empat sumber: Dana Gereja (dari Kas Jemaat), Swadaya (kas UPK yang sudah ada), Penggalangan (kegiatan menggalang dana, mis. bazar), dan Donasi (persembahan khusus atau donatur untuk kegiatan ini).',
      'Total keempat sumber harus sama persis dengan total anggaran. Tombol "Isi sisa kebutuhan ke alokasi gereja" menutup selisih ke Dana Gereja.',
      'Kegiatan yang tidak memakai dana Gereja tetap dicatat, dengan sumber Swadaya, Penggalangan, atau Donasi.',
      'Isi keterangan, terutama untuk Penggalangan (cara, penanggung jawab, waktu).',
    ],
    kesalahan: [
      'Menutup selisih ke Dana Gereja tanpa mempertimbangkan pagu. Pembanding pagu adalah porsi Dana Gereja, bukan total anggaran.',
      'Mengisi Penggalangan atau Donasi tanpa rencana yang jelas. Kepastiannya berbeda dengan Swadaya yang sudah ada.',
    ],
  },
  {
    no: 9, judul: 'Evaluasi dan pelaporan', wajib: true,
    tujuan: 'Menetapkan bagaimana hasil dinilai dan dilaporkan.',
    cara: ['Tulis apa yang akan dinilai (tercapai, belum, mengapa selisih, perbaikan berikutnya), siapa melaporkan, dan kapan.'],
    kesalahan: ['Menulis "akan dievaluasi" tanpa siapa dan kapan.'],
  },
  {
    no: 10, judul: 'Daftar periksa sebelum mengajukan', wajib: true,
    tujuan: 'Memastikan rancangan sudah matang sebelum dikunci.',
    cara: [
      'Sembilan butir. Centang hanya bila benar-benar terpenuhi; bila ada yang belum, sempurnakan rancangan dulu.',
      'Semua butir harus dicentang agar kegiatan dapat diajukan.',
    ],
    kesalahan: ['Mencentang semua tanpa membaca. Daftar ini dipakai pembaca saat pra-muker.'],
  },
]

export const LANGKAH_AJUKAN: readonly string[] = [
  'Buka menu Kegiatan, lalu Kegiatan baru (hanya tersedia saat pengajuan dibuka).',
  'Isi bagian 1–10 dari atas ke bawah. Bagian bertanda * wajib. Simpan draft kapan saja dan lanjutkan nanti.',
  'Tekan Ajukan. Bila ada yang kurang, layar menampilkan daftar yang perlu dilengkapi.',
  'Setelah diajukan, kegiatan terkunci. Tarik kembali ke draft bila perlu mengubah (selama pengajuan dibuka), lalu ajukan lagi.',
  'Ringkasan menampilkan versi satu halaman yang dapat dicetak atau disimpan sebagai PDF.',
]

export interface PanduanPeran {
  peran: Peran[]
  judul: string
  intro: string
  langkah: string[]
}

export const PANDUAN_PERAN: readonly PanduanPeran[] = [
  {
    peran: ['PENGURUS_UPK'], judul: 'Pengurus UPK',
    intro: 'Menyusun dan mengajukan kegiatan unit Anda.',
    langkah: [
      'Masuk dengan username dan password sementara dari sekretariat, lalu buat password baru (minimal 10 karakter).',
      'Isi dan ajukan kegiatan saat pengajuan dibuka (lihat bagian Cara mengisi formulir).',
      'Menu Dashboard menampilkan pagu unit Anda dan jumlah yang sudah diajukan. Hanya kegiatan berstatus Diajukan yang dihitung; draft ditampilkan terpisah.',
      'Saat pra-muker, perubahan dilakukan ketua bidang. Hubungi ketua bidang Anda bila ada yang perlu diubah.',
    ],
  },
  {
    peran: ['KOORDINATOR_BIDANG'], judul: 'Ketua Bidang',
    intro: 'Melihat kegiatan seluruh unit di bidang Anda dan membagi pagu bidang.',
    langkah: [
      'Menu Kegiatan dan Dashboard menampilkan unit di bidang Anda saja.',
      'Menu Alokasi: bagikan pagu bidang ke UPK saat pra-muker. Alokasi per UPK hanya panduan; batas keras ada di pagu bidang.',
      'Saat pra-muker Anda dapat mengubah kegiatan unit di bidang Anda, termasuk yang sudah diajukan.',
      'Dashboard membandingkan pagu dengan porsi Dana Gereja yang diminta, dan menandai kegiatan yang dapat berjalan tanpa dana Gereja.',
    ],
  },
  {
    peran: ['ADMIN', 'SEKRETARIAT'], judul: 'Admin dan Sekretariat',
    intro: 'Mengelola master, akun, pagu, dan tahap siklus.',
    langkah: [
      'Master: tahun anggaran (tahap siklus, tanggal, proyeksi Kas Jemaat), struktur dan pagu bidang dan pos, acuan visi-misi, satuan, kategori biaya, dan bantuan WhatsApp.',
      'Akun: buat akun, edit nomor WhatsApp, reset password, dan kirim akses lewat tombol WhatsApp (pada akun yang belum ganti password, tombol ini mereset password).',
      'Memindahkan tahap ke Pra-muker membuat potret Usulan UPK secara otomatis dan tidak dapat diulang. Pindahkan hanya saat jendela UPK benar-benar ditutup.',
      'Anda dapat mengisi dan mengubah kegiatan atas nama unit mana pun, termasuk saat muker.',
    ],
  },
  {
    peran: ['MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM'], judul: 'Penatua, LP4WG, Kepala Kantor, Ministerium',
    intro: 'Melihat seluruh kegiatan dan dashboard (hanya baca).',
    langkah: [
      'Menu Kegiatan: daftar semua kegiatan, dapat disaring per tahun, unit, dan status. Buka satu kegiatan untuk melihat isi lengkap dan Ringkasan cetak.',
      'Menu Dashboard: pagu per bidang dan unit, porsi Dana Gereja yang diminta, selisih terhadap pagu, dan klasifikasi kegiatan (Mandiri penuh, Campuran, Bergantung Kas Jemaat).',
      'Perubahan dilakukan admin, sekretariat, atau ketua bidang sesuai tahap. Sampaikan masukan lewat mereka atau lewat tombol Kirim masukan.',
    ],
  },
]

export interface Istilah { istilah: string; arti: string }

export const ISTILAH: readonly Istilah[] = [
  { istilah: 'Pagu', arti: 'Batas anggaran yang ditetapkan dari Kas Jemaat. Ada pagu per bidang (batas keras) dan per pos (mis. Penatalayanan). Alokasi per UPK hanya panduan.' },
  { istilah: 'Dana Gereja', arti: 'Bagian biaya kegiatan yang diminta dari Kas Jemaat. Inilah yang dibandingkan dengan pagu.' },
  { istilah: 'Swadaya', arti: 'Dana dari kas UPK sendiri yang sudah ada.' },
  { istilah: 'Penggalangan', arti: 'Dana dari kegiatan menggalang dana, misalnya penjualan di bazar. Masih rencana sampai terkumpul.' },
  { istilah: 'Donasi', arti: 'Persembahan khusus atau donatur untuk kegiatan itu. Bergantung pada donatur.' },
  { istilah: 'Mandiri penuh', arti: 'Kegiatan tanpa Dana Gereja; seluruh biaya ditutup Swadaya, Penggalangan, dan Donasi.' },
  { istilah: 'Campuran', arti: 'Sebagian biaya dari Dana Gereja, sebagian dari sumber lain.' },
  { istilah: 'Bergantung Kas Jemaat', arti: 'Seluruh biaya dari Dana Gereja.' },
  { istilah: 'Usulan', arti: 'Isi kegiatan seperti diajukan UPK. Dipotret otomatis saat tahap Pra-muker dimulai.' },
  { istilah: 'Pra-muker, Muker', arti: 'Pra-muker: ketua bidang dan UPK merumuskan kegiatan dan pembagian pagu. Muker: rapat yang menetapkan angka.' },
  { istilah: 'PIC', arti: 'Penanggung jawab kegiatan yang dapat dihubungi untuk klarifikasi.' },
  { istilah: 'RAB', arti: 'Rencana anggaran biaya: rincian biaya kegiatan.' },
]

export interface Tanya { tanya: string; jawab: string }

export const TANYA_JAWAB: readonly Tanya[] = [
  { tanya: 'Tombol Ajukan menampilkan daftar yang kurang. Apa yang dilakukan?', jawab: 'Lengkapi setiap butir pada daftar itu (biasanya nomor WhatsApp PIC, tanggal aktivitas, total sumber dana yang tidak sama dengan anggaran, atau butir daftar periksa), simpan, lalu ajukan lagi.' },
  { tanya: 'Total sumber dana tidak sama dengan total anggaran.', jawab: 'Pada bagian Sumber dana, bagi seluruh anggaran ke empat sumber. Tombol "Isi sisa kebutuhan ke alokasi gereja" menutup selisih ke Dana Gereja; pastikan itu memang yang dimaksud.' },
  { tanya: 'Kegiatan saya sudah diajukan, tetapi ingin diubah.', jawab: 'Selama pengajuan dibuka, tekan Tarik kembali ke draft, ubah, lalu ajukan lagi. Setelah ditutup atau memasuki pra-muker, hubungi sekretariat atau ketua bidang.' },
  { tanya: 'Kegiatan saya tidak memakai dana Gereja. Perlu dicatat?', jawab: 'Ya. Catat dengan sumber Swadaya, Penggalangan, atau Donasi agar seluruh kegiatan tercatat.' },
  { tanya: 'Lupa password atau akun belum bisa masuk.', jawab: 'Hubungi sekretariat lewat tombol Kirim masukan atau ikon WhatsApp; password sementara baru akan dikirim.' },
  { tanya: 'Tombol Kegiatan baru tidak muncul.', jawab: 'Pembuatan kegiatan hanya tersedia saat pengajuan dibuka dan untuk unit Anda. Periksa tahap yang tampil di spanduk atas aplikasi.' },
]

export const PESAN_MASUKAN_PANDUAN = 'Halo, saya {nama} ({unit}). Masukan untuk Panduan aplikasi Kegiatan GKJ Jakarta: '
export const PESAN_MASUKAN_PANDUAN_ANONIM = 'Halo, saya ingin memberi masukan untuk Panduan aplikasi Kegiatan GKJ Jakarta: '

/** Menu Panduan yang dibuka pengguna login dimulai dari tab perannya; peran tak dikenal jatuh ke indeks 0. */
export function indeksPeran(peran: Peran | null | undefined): number {
  if (!peran) return 0
  const i = PANDUAN_PERAN.findIndex((p) => p.peran.includes(peran))
  return i < 0 ? 0 : i
}
