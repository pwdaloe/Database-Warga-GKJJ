// Matriks Evaluasi Program Kerja UPK 2026 untuk RKA 2027 (dokumen resmi gereja, diunggah 24 Okt 2026).
// Dipakai sebagai baseline "Program 2026" (rujukan lanjutan atau baru). Kode unit mengikuti prisma/seed.ts.
export interface Program2026Seed {
  unit: string
  nama: string
  keselarasan: string
  kategori: 'A' | 'B' | 'C' | 'D'
  bersyarat?: boolean
  rekomendasi: string
}

export const PROGRAM_2026: Program2026Seed[] = [
  // A. Komisi Warga Dewasa
  { unit: 'KWD', nama: 'Seminar kanker dan PAP smear gratis', keselarasan: 'Kepedulian sosial dan kesehatan', kategori: 'A', rekomendasi: 'Lanjutkan; perkuat kolaborasi dengan KESPEL.' },
  { unit: 'KWD', nama: 'Bina Pra Perkawinan', keselarasan: 'Pembinaan iman dan keluarga', kategori: 'A', rekomendasi: 'Lanjutkan secara berkala; evaluasi manfaat bagi pasangan.' },
  { unit: 'KWD', nama: 'Pendataan warga jemaat', keselarasan: 'Pelayanan kontekstual dan tepat sasaran', kategori: 'A', rekomendasi: 'Lanjutkan; integrasikan dan perbarui data warga.' },
  { unit: 'KWD', nama: 'Sarasehan persiapan pensiun', keselarasan: 'Pendampingan keluarga dan lintas generasi', kategori: 'A', rekomendasi: 'Lanjutkan; tambahkan tindak lanjut pascakegiatan.' },
  { unit: 'KWD', nama: 'Retret pasangan menikah lebih dari 10 tahun', keselarasan: 'Penguatan keluarga', kategori: 'B', rekomendasi: 'Lanjutkan dengan indikator manfaat bagi relasi pasangan.' },
  // B. KESPEL
  { unit: 'KESPEL', nama: 'Donor darah', keselarasan: 'Kepedulian terhadap sesama', kategori: 'A', rekomendasi: 'Lanjutkan secara berkala dan pertahankan kolaborasi.' },
  { unit: 'KESPEL', nama: 'Perkunjungan lembaga pemasyarakatan', keselarasan: 'Pelayanan kelompok rentan', kategori: 'A', rekomendasi: 'Lanjutkan; evaluasi dampak bantuan dan beasiswa.' },
  { unit: 'KESPEL', nama: 'Pemeriksaan dan pelayanan kesehatan', keselarasan: 'Kepedulian sosial dan kesehatan', kategori: 'A', rekomendasi: 'Lanjutkan; ukur penerima manfaat dan kesinambungan pelayanan.' },
  { unit: 'KESPEL', nama: 'Pelatihan kewirausahaan/Shibori', keselarasan: 'Pemberdayaan ekonomi', kategori: 'B', rekomendasi: 'Lanjutkan jika ada kebutuhan dan tindak lanjut penggunaan keterampilan.' },
  { unit: 'KESPEL', nama: 'Perkunjungan jemaat dan pasien RSPAD', keselarasan: 'Pelayanan kasih dan pendampingan', kategori: 'A', rekomendasi: 'Lanjutkan; pertahankan kesinambungan kunjungan.' },
  // C. Majalah DILAH
  { unit: 'DILAH', nama: 'Penerbitan majalah digital berkala', keselarasan: 'Komunikasi dan pembinaan warga', kategori: 'B', rekomendasi: 'Lanjutkan dengan evaluasi pembaca, relevansi isi, dan efektivitas kanal digital.' },
  // D. PEJ
  { unit: 'PEJ', nama: 'Bakulan PEJ', keselarasan: 'Pemberdayaan ekonomi jemaat', kategori: 'C', rekomendasi: 'Rancang ulang format dan frekuensi; partisipasi anggota masih di bawah 20%.' },
  { unit: 'PEJ', nama: 'Studi banding', keselarasan: 'Pembelajaran dan pengembangan ekonomi', kategori: 'C', rekomendasi: 'Jadikan kegiatan pendukung; lanjutkan bila ada implementasi hasil studi.' },
  { unit: 'PEJ', nama: 'Gebyar promosi', keselarasan: 'Penguatan usaha dan pemasaran', kategori: 'B', rekomendasi: 'Lanjutkan dengan strategi peningkatan partisipasi promosi.' },
  { unit: 'PEJ', nama: 'Pelatihan kewirausahaan', keselarasan: 'Pemberdayaan ekonomi keluarga', kategori: 'B', rekomendasi: 'Lanjutkan dengan target penerapan keterampilan dan tindak lanjut usaha.' },
  { unit: 'PEJ', nama: 'Mentoring usaha', keselarasan: 'Kemandirian ekonomi jemaat', kategori: 'A', rekomendasi: 'Perkuat; tingkatkan administrasi dan pantau perkembangan usaha peserta.' },
  { unit: 'PEJ', nama: 'Rapat anggota dan organisasi', keselarasan: 'Penguatan tata kelola', kategori: 'B', rekomendasi: 'Lanjutkan; tingkatkan kehadiran dan tindak lanjut keputusan rapat.' },
  // E. Komisi Anak
  { unit: 'KOMAN', nama: 'Ibadah Minggu anak dan praremaja', keselarasan: 'Pertumbuhan iman lintas generasi', kategori: 'A', rekomendasi: 'Lanjutkan sebagai program inti.' },
  { unit: 'KOMAN', nama: 'Workshop pelayan anak', keselarasan: 'Pengembangan kompetensi pelayan dan pelayanan inklusif', kategori: 'A', rekomendasi: 'Lanjutkan; perbaiki persiapan dan durasi interaktif.' },
  { unit: 'KOMAN', nama: 'Warta Komisi Anak', keselarasan: 'Komunikasi dan pembinaan anak', kategori: 'B', rekomendasi: 'Lanjutkan jika efektif; evaluasi keterbacaan dan manfaatnya.' },
  { unit: 'KOMAN', nama: 'Aksi sosial Hari Anak Nasional', keselarasan: 'Kepedulian terhadap sesama', kategori: 'A', rekomendasi: 'Lanjutkan; lengkapi dengan refleksi dan pembelajaran anak.' },
  // F. Diaken
  { unit: 'DIAKEN', nama: 'Beasiswa Diaken', keselarasan: 'Kepedulian sosial dan dukungan pendidikan', kategori: 'A', rekomendasi: 'Lanjutkan; evaluasi kebutuhan dan perkembangan penerima.' },
  { unit: 'DIAKEN', nama: 'Bantuan Rimatan', keselarasan: 'Pelayanan warga yang membutuhkan', kategori: 'A', rekomendasi: 'Lanjutkan; lakukan peninjauan kebutuhan secara berkala.' },
  // G. Komisi Pemuda (KOMPA)
  { unit: 'KOMPA', nama: 'Ibadah kategorial', keselarasan: 'Pertumbuhan iman pemuda', kategori: 'A', rekomendasi: 'Lanjutkan; perbaiki koordinasi petugas dan pemusik.' },
  { unit: 'KOMPA', nama: 'Komunitas Sel (Komsel)', keselarasan: 'Pertumbuhan iman dan persekutuan', kategori: 'A', rekomendasi: 'Lanjutkan; pertahankan pertemuan rutin dan evaluasi keterlibatan anggota.' },
  { unit: 'KOMPA', nama: 'Kebaktian Penyegaran Iman (KPI)', keselarasan: 'Pendalaman iman', kategori: 'A', rekomendasi: 'Lanjutkan; sinkronkan kalender kegiatan antarkomisi.' },
  { unit: 'KOMPA', nama: 'Drama musikal lintas komisi', keselarasan: 'Kreativitas dan kolaborasi lintas generasi', kategori: 'B', rekomendasi: 'Lanjutkan secara selektif dengan evaluasi dampak pembinaan dan beban kerja.' },
  { unit: 'KOMPA', nama: 'Visitasi gereja', keselarasan: 'Persekutuan dan pembelajaran antargereja', kategori: 'C', rekomendasi: 'Seleksi berdasarkan tujuan, manfaat, dan prioritas pelayanan internal.' },
  // H. LP4WG
  { unit: 'LP4WG', nama: 'Workshop public speaking untuk majelis', keselarasan: 'Pengembangan kapasitas kepemimpinan', kategori: 'B', rekomendasi: 'Lanjutkan; ukur penerapan keterampilan dalam pelayanan.' },
  { unit: 'LP4WG', nama: 'Komunitas public speaking', keselarasan: 'Pengembangan kapasitas warga', kategori: 'C', rekomendasi: 'Rancang ulang; tetapkan pengelola, kegiatan rutin, dan target partisipasi.' },
  { unit: 'LP4WG', nama: 'Survei ekonomi jemaat', keselarasan: 'Pelayanan kontekstual dan pemberdayaan ekonomi', kategori: 'A', rekomendasi: 'Prioritaskan penyelesaian survei dan pemanfaatan hasilnya dalam RKA 2027.' },
  { unit: 'LP4WG', nama: 'Restrukturisasi organisasi GKJ Jakarta', keselarasan: 'Efektivitas organisasi dan tata kelola', kategori: 'A', bersyarat: true, rekomendasi: 'Prioritaskan tindak lanjut sesuai keputusan dan mandat Majelis.' },
  // I. Komisi Kesenian Gereja (KKG)
  { unit: 'KKG', nama: 'Pertemuan pemusik dan pemandu pujian', keselarasan: 'Kualitas ibadah dan kolaborasi', kategori: 'B', rekomendasi: 'Lanjutkan; perbaiki pengaturan diskusi dan partisipasi.' },
  { unit: 'KKG', nama: 'Workshop pemusik dan kantoria', keselarasan: 'Pengembangan kompetensi pelayanan', kategori: 'B', rekomendasi: 'Lanjutkan dengan jadwal realistis, narasumber, dan target hasil.' },
  { unit: 'KKG', nama: 'Latihan rutin Colibri, Karawitan, dan Keroncong', keselarasan: 'Pengembangan talenta dan pelayanan ibadah', kategori: 'A', rekomendasi: 'Lanjutkan secara rutin.' },
  { unit: 'KKG', nama: 'Ajang apresiasi pemusik', keselarasan: 'Penghargaan dan pengembangan talenta', kategori: 'C', rekomendasi: 'Integrasikan dengan agenda pembinaan atau perayaan gereja bila lebih efisien.' },
  // J. Komisi Remaja (Korem)
  { unit: 'KOREM', nama: 'Tata ruang dan peribadahan rutin', keselarasan: 'Pertumbuhan iman remaja', kategori: 'A', rekomendasi: 'Lanjutkan; benahi kedisiplinan petugas dan partisipasi remaja.' },
  { unit: 'KOREM', nama: 'Vocal Group', keselarasan: 'Pengembangan talenta dan pelayanan', kategori: 'C', rekomendasi: 'Rancang ulang berdasarkan minat dan kehadiran peserta.' },
  { unit: 'KOREM', nama: 'Mading bulanan', keselarasan: 'Komunikasi dan kreativitas remaja', kategori: 'B', rekomendasi: 'Pertahankan dengan evaluasi keterlibatan dan manfaat.' },
  { unit: 'KOREM', nama: 'The Most Active Jesus Worker dan Kuis Alkitab', keselarasan: 'Pembinaan iman dan partisipasi', kategori: 'A', rekomendasi: 'Lanjutkan; benahi rekap, persiapan soal, dan administrasi hadiah.' },
  { unit: 'KOREM', nama: 'Retreat dan LDKK', keselarasan: 'Pembinaan iman, karakter, dan kepemimpinan', kategori: 'A', rekomendasi: 'Lanjutkan; perbaiki susunan acara dan koordinasi panitia.' },
  { unit: 'KOREM', nama: 'Commitment Wall, HUT Korem, Valentine, dan Nobar', keselarasan: 'Persekutuan dan keterlibatan remaja', kategori: 'C', rekomendasi: 'Seleksi dan integrasikan; prioritaskan kegiatan yang paling relevan dan diminati.' },
  { unit: 'KOREM', nama: 'PORSENI', keselarasan: 'Kebersamaan dan pengembangan talenta', kategori: 'B', rekomendasi: 'Lanjutkan dengan sasaran partisipasi dan hasil yang jelas.' },
  { unit: 'KOREM', nama: 'Visitasi', keselarasan: 'Persekutuan dan pembelajaran', kategori: 'C', rekomendasi: 'Lanjutkan secara selektif jika tujuan dan manfaatnya jelas.' },
  { unit: 'KOREM', nama: 'KKR dan Worship Night', keselarasan: 'Pendalaman iman dan persekutuan', kategori: 'B', rekomendasi: 'Lanjutkan secara bersyarat; integrasikan dengan pembinaan iman yang berkelanjutan.' },
  { unit: 'KOREM', nama: 'Pelatihan keyboard', keselarasan: 'Pengembangan keterampilan pelayanan', kategori: 'B', rekomendasi: 'Laksanakan jika kebutuhan, minat peserta, dan pengajar tersedia.' },
]
