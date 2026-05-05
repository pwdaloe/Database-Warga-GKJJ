import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding master data...')

  // ── Wilayah ────────────────────────────────────────────────
  const [wilayahA, wilayahB, wilayahC] = await Promise.all([
    prisma.wilayah.upsert({
      where: { kode: 'A' },
      update: {},
      create: { kode: 'A', nama: 'Rawamangun A' },
    }),
    prisma.wilayah.upsert({
      where: { kode: 'B' },
      update: {},
      create: { kode: 'B', nama: 'Rawamangun B' },
    }),
    prisma.wilayah.upsert({
      where: { kode: 'C' },
      update: {},
      create: { kode: 'C', nama: 'Rawamangun C' },
    }),
  ])
  console.log('  ✓ 3 wilayah')

  // ── Kelompok ───────────────────────────────────────────────
  const kelompokData = [
    // Wilayah A
    { wilayahId: wilayahA.id, kode: 'A1', nama: 'Cempaka Baru',          penatua_nama_temp: 'Pramudya Hardjito' },
    { wilayahId: wilayahA.id, kode: 'A2', nama: 'Utan Kayu',             penatua_nama_temp: 'Louise Reyna E. Mauruh Maskat' },
    { wilayahId: wilayahA.id, kode: 'A3', nama: 'Kebon Kelapa',          penatua_nama_temp: 'Dahlia C. Sinaga' },
    { wilayahId: wilayahA.id, kode: 'A4', nama: 'Menteng',               penatua_nama_temp: 'Tri Eka Wahyuni' },
    { wilayahId: wilayahA.id, kode: 'A5', nama: 'Percetakan Negara',     penatua_nama_temp: 'Ernanto Prabowo' },
    { wilayahId: wilayahA.id, kode: 'A6', nama: 'Kemayoran I / Sunter',  penatua_nama_temp: 'Jakub Handoko' },
    { wilayahId: wilayahA.id, kode: 'A7', nama: 'Ksatrian',              penatua_nama_temp: 'Yashinta Triwati' },
    { wilayahId: wilayahA.id, kode: 'A8', nama: 'Sari Cempaka',          penatua_nama_temp: 'Teguh Tri Santoso' },
    // Wilayah B
    { wilayahId: wilayahB.id, kode: 'B1', nama: 'Rawabadung',            penatua_nama_temp: 'Suparyanto' },
    { wilayahId: wilayahB.id, kode: 'B2', nama: 'Cipinang Baru',         penatua_nama_temp: 'Lydia' },
    { wilayahId: wilayahB.id, kode: 'B3', nama: 'Kelapa Gading',         penatua_nama_temp: 'Firnaningati' },
    { wilayahId: wilayahB.id, kode: 'B4', nama: 'Kampung Ambon',         penatua_nama_temp: 'Aryo Aditomo' },
    { wilayahId: wilayahB.id, kode: 'B5', nama: 'Penggilingan',          penatua_nama_temp: 'Maryono' },
    { wilayahId: wilayahB.id, kode: 'B6', nama: 'Rawamangun Timur',      penatua_nama_temp: 'Martha Ken Larasati' },
    { wilayahId: wilayahB.id, kode: 'B7', nama: 'Marenco',               penatua_nama_temp: 'Dwiwanto Presantoro' },
    { wilayahId: wilayahB.id, kode: 'B8', nama: 'Cipinang Kebembem',     penatua_nama_temp: 'Efi Pujiastuti' },
    { wilayahId: wilayahB.id, kode: 'B9', nama: 'Rawamangun Barat',      penatua_nama_temp: 'Sanjung Purna' },
    // Wilayah C
    { wilayahId: wilayahC.id, kode: 'C1', nama: 'Cipinang Muara',              penatua_nama_temp: 'Eko Sutrisno' },
    { wilayahId: wilayahC.id, kode: 'C2', nama: 'Pondok Kopi',                 penatua_nama_temp: 'Pratelaningsihmirmo' },
    { wilayahId: wilayahC.id, kode: 'C3', nama: 'Duren Sawit - Pondok Kelapa', penatua_nama_temp: 'Wisnu Priambudi' },
    { wilayahId: wilayahC.id, kode: 'C4', nama: 'Pondok Bambu I',              penatua_nama_temp: 'Bambang Tugianto' },
    { wilayahId: wilayahC.id, kode: 'C5', nama: 'Pondok Bambu II',             penatua_nama_temp: 'Kurida B. Budiantoro' },
  ]

  for (const k of kelompokData) {
    await prisma.kelompok.upsert({
      where: { kode: k.kode },
      update: {},
      create: k,
    })
  }
  console.log(`  ✓ ${kelompokData.length} kelompok`)

  // ── Superadmin default ─────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@GKJJ2025!', 12)
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      nama: 'Super Administrator',
      username: 'superadmin',
      email: 'admin@gkjj.org',
      passwordHash,
      role: 'SUPERADMIN',
    },
  })
  console.log('  ✓ Superadmin user (username: superadmin)')
  console.log('  ⚠️  Ganti password superadmin segera setelah login pertama!')

  console.log('\n✅ Seeding selesai.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding gagal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
