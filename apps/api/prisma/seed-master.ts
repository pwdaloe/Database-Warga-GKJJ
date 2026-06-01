import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KELURAHAN_JAKARTA_TIMUR = [
  // Kecamatan Cakung
  { nama: 'Cakung Barat',    kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13910' },
  { nama: 'Cakung Timur',    kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13910' },
  { nama: 'Jatinegara',      kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13930' },
  { nama: 'Penggilingan',    kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13940' },
  { nama: 'Pulo Gebang',     kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13950' },
  { nama: 'Rawa Terate',     kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13920' },
  { nama: 'Ujung Menteng',   kecamatan: 'Cakung',       kota: 'Jakarta Timur', kodePos: '13960' },
  // Kecamatan Cipayung
  { nama: 'Bambu Apus',      kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13890' },
  { nama: 'Ceger',           kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13820' },
  { nama: 'Cilangkap',       kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13870' },
  { nama: 'Cipayung',        kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13840' },
  { nama: 'Lubang Buaya',    kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13810' },
  { nama: 'Munjul',          kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13850' },
  { nama: 'Setu',            kecamatan: 'Cipayung',     kota: 'Jakarta Timur', kodePos: '13880' },
  // Kecamatan Ciracas
  { nama: 'Cibubur',         kecamatan: 'Ciracas',      kota: 'Jakarta Timur', kodePos: '13720' },
  { nama: 'Ciracas',         kecamatan: 'Ciracas',      kota: 'Jakarta Timur', kodePos: '13740' },
  { nama: 'Kelapa Dua Wetan',kecamatan: 'Ciracas',      kota: 'Jakarta Timur', kodePos: '13730' },
  { nama: 'Susukan',         kecamatan: 'Ciracas',      kota: 'Jakarta Timur', kodePos: '13750' },
  // Kecamatan Duren Sawit
  { nama: 'Duren Sawit',     kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13440' },
  { nama: 'Klender',         kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13470' },
  { nama: 'Malaka Jaya',     kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13460' },
  { nama: 'Malaka Sari',     kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13460' },
  { nama: 'Pondok Bambu',    kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13430' },
  { nama: 'Pondok Kelapa',   kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13450' },
  { nama: 'Pondok Kopi',     kecamatan: 'Duren Sawit',  kota: 'Jakarta Timur', kodePos: '13460' },
  // Kecamatan Jatinegara
  { nama: 'Bali Mester',               kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13310' },
  { nama: 'Bidara Cina',               kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13330' },
  { nama: 'Cipinang Besar Selatan',    kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13410' },
  { nama: 'Cipinang Besar Utara',      kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13400' },
  { nama: 'Cipinang Cempedak',         kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13340' },
  { nama: 'Cipinang Melayu',           kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13620' },
  { nama: 'Kampung Melayu',            kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13320' },
  { nama: 'Rawa Bunga',                kecamatan: 'Jatinegara', kota: 'Jakarta Timur', kodePos: '13350' },
  // Kecamatan Kramat Jati
  { nama: 'Batu Ampar',      kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13520' },
  { nama: 'Balekambang',     kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13530' },
  { nama: 'Cawang',          kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13340' },
  { nama: 'Cililitan',       kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13540' },
  { nama: 'Dukuh',           kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13550' },
  { nama: 'Kramat Jati',     kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13510' },
  { nama: 'Tengah',          kecamatan: 'Kramat Jati',  kota: 'Jakarta Timur', kodePos: '13560' },
  // Kecamatan Makasar
  { nama: 'Halim Perdana Kusuma', kecamatan: 'Makasar', kota: 'Jakarta Timur', kodePos: '13610' },
  { nama: 'Kebon Pala',           kecamatan: 'Makasar', kota: 'Jakarta Timur', kodePos: '13650' },
  { nama: 'Makasar',              kecamatan: 'Makasar', kota: 'Jakarta Timur', kodePos: '13570' },
  { nama: 'Pinang Ranti',         kecamatan: 'Makasar', kota: 'Jakarta Timur', kodePos: '13560' },
  { nama: 'Cipinang Melayu',      kecamatan: 'Makasar', kota: 'Jakarta Timur', kodePos: '13620' },
  // Kecamatan Matraman
  { nama: 'Kayu Manis',      kecamatan: 'Matraman',     kota: 'Jakarta Timur', kodePos: '13150' },
  { nama: 'Kebon Manggis',   kecamatan: 'Matraman',     kota: 'Jakarta Timur', kodePos: '13150' },
  { nama: 'Palmeriam',       kecamatan: 'Matraman',     kota: 'Jakarta Timur', kodePos: '13140' },
  { nama: 'Pisangan Baru',   kecamatan: 'Matraman',     kota: 'Jakarta Timur', kodePos: '13110' },
  { nama: 'Utan Kayu Selatan', kecamatan: 'Matraman',   kota: 'Jakarta Timur', kodePos: '13120' },
  { nama: 'Utan Kayu Utara', kecamatan: 'Matraman',     kota: 'Jakarta Timur', kodePos: '13130' },
  // Kecamatan Pasar Rebo
  { nama: 'Cijantung',       kecamatan: 'Pasar Rebo',   kota: 'Jakarta Timur', kodePos: '13770' },
  { nama: 'Gedong',          kecamatan: 'Pasar Rebo',   kota: 'Jakarta Timur', kodePos: '13760' },
  { nama: 'Kalisari',        kecamatan: 'Pasar Rebo',   kota: 'Jakarta Timur', kodePos: '13790' },
  { nama: 'Pekayon',         kecamatan: 'Pasar Rebo',   kota: 'Jakarta Timur', kodePos: '13710' },
  { nama: 'Baru',            kecamatan: 'Pasar Rebo',   kota: 'Jakarta Timur', kodePos: '13780' },
  // Kecamatan Pulo Gadung
  { nama: 'Jati',            kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13220' },
  { nama: 'Jatinegara Kaum', kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13250' },
  { nama: 'Kayu Putih',      kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13210' },
  { nama: 'Pisangan Timur',  kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13230' },
  { nama: 'Pulo Gadung',     kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13260' },
  { nama: 'Rawamangun',      kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13220' },
  { nama: 'Cipinang',        kecamatan: 'Pulo Gadung',  kota: 'Jakarta Timur', kodePos: '13240' },
]

const KOMISI_CONFIG = [
  { nama: 'Komisi Anak',       minUsia: 0,  maxUsia: 11,  urutan: 1, warna: '#60a5fa' },
  { nama: 'Komisi Pra-Remaja', minUsia: 12, maxUsia: 14,  urutan: 2, warna: '#34d399' },
  { nama: 'Komisi Remaja',     minUsia: 15, maxUsia: 18,  urutan: 3, warna: '#fbbf24' },
  { nama: 'Komisi Pemuda',     minUsia: 19, maxUsia: 35,  urutan: 4, warna: '#a78bfa' },
  { nama: 'Komisi Dewasa',     minUsia: 36, maxUsia: 59,  urutan: 5, warna: '#fb923c' },
  { nama: 'Komisi Adiyuswa',   minUsia: 60, maxUsia: null, urutan: 6, warna: '#94a3b8' },
]

async function main() {
  console.log('Seeding master kelurahan Jakarta Timur...')

  // Skip if already seeded
  const existing = await prisma.masterKelurahan.count()
  if (existing === 0) {
    await prisma.masterKelurahan.createMany({ data: KELURAHAN_JAKARTA_TIMUR })
    console.log(`  ✓ ${KELURAHAN_JAKARTA_TIMUR.length} kelurahan inserted`)
  } else {
    console.log(`  ⚠ Kelurahan already seeded (${existing} records), skipping`)
  }

  console.log('Seeding komisi config...')
  const existingKomisi = await prisma.komisiConfig.count()
  if (existingKomisi === 0) {
    await prisma.komisiConfig.createMany({ data: KOMISI_CONFIG })
    console.log(`  ✓ ${KOMISI_CONFIG.length} komisi config inserted`)
  } else {
    console.log(`  ⚠ Komisi config already seeded (${existingKomisi} records), skipping`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
