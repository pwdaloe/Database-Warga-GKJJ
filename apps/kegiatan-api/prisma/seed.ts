/**
 * Seed idempoten untuk kegiatan.gkjjakarta.org.
 *   npm run db:seed            → master (tahun 2027, bidang, unit, pagu, pengurus BPH, acuan visi, satuan, kategori biaya,
 *                                program 2026) + akun admin (butuh SEED_ADMIN_PASSWORD)
 *   npm run db:seed:contoh     → tambah AKUN dan PROGRAM CONTOH (isContoh = true; butuh SEED_CONTOH_PASSWORD), hanya untuk lokal/uji
 * Data contoh dapat dibuang: npm run db:buang-contoh -- --ya
 * Tidak ada data pribadi nyata di sini: nama pengurus adalah posisi (contoh), email memakai domain .invalid, tanpa nomor WhatsApp.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/utils/prisma.js'
import { PROGRAM_2026 } from './data/program2026.js'

const BIDANG = [
  { kode: 'PERIBADAHAN', nama: 'Peribadahan', urutan: 1 },
  { kode: 'PEMBINAAN1', nama: 'Pembinaan 1', urutan: 2 },
  { kode: 'PEMBINAAN2', nama: 'Pembinaan 2', urutan: 3 },
  { kode: 'KESAKSIAN', nama: 'Kesaksian & Pelayanan', urutan: 4 },
  { kode: 'PENATALAYANAN', nama: 'Penatalayanan', urutan: 5 },
  { kode: 'MINISTERIUM', nama: 'Ministerium', urutan: 6 },
  { kode: 'KEMAJELISAN', nama: 'Kemajelisan', urutan: 7 },
]

// Pemetaan unit → bidang adalah USULAN (belum dikonfirmasi) dan dapat diubah admin. Pagu = angka 2026 (Rp), field master.
const UNIT = [
  { kode: 'IBADAH', nama: 'Komisi Ibadah', singkatan: 'Ibadah', alias: [], bidang: 'PERIBADAHAN', pagu: 59_000_000 },
  { kode: 'KKG', nama: 'Komisi Kesenian Gerejawi', singkatan: 'KKG', alias: ['Komisi Kesenian Gereja'], bidang: 'PERIBADAHAN', pagu: 20_000_000 },
  { kode: 'KWD', nama: 'Komisi Warga Dewasa', singkatan: 'KWD', alias: ['Komisi Dewasa'], bidang: 'PEMBINAAN1', pagu: 15_000_000 },
  { kode: 'KPA', nama: 'Komisi Pemahaman Alkitab', singkatan: 'KPA', alias: ['Komisi PA'], bidang: 'PEMBINAAN1', pagu: 3_000_000 },
  { kode: 'ADIYUSWA', nama: 'Komisi Adiyuswa', singkatan: 'Adiyuswa', alias: ['Komisi Adiyuswo'], bidang: 'PEMBINAAN1', pagu: 25_000_000 },
  { kode: 'DILAH', nama: 'Majalah Dilah', singkatan: 'Dilah', alias: ['Majalah DILAH'], bidang: 'PEMBINAAN1', pagu: 4_000_000 },
  { kode: 'PERPUS', nama: 'Perpustakaan Aksara Kita', singkatan: 'Aksara Kita', alias: [], bidang: 'PEMBINAAN1', pagu: 3_000_000 },
  { kode: 'KOMAN', nama: 'Komisi Anak', singkatan: 'Anak', alias: [], bidang: 'PEMBINAAN2', pagu: 25_000_000 },
  { kode: 'KOREM', nama: 'Komisi Remaja', singkatan: 'Korem', alias: [], bidang: 'PEMBINAAN2', pagu: 50_000_000 },
  { kode: 'KOMPA', nama: 'Komisi Pemuda', singkatan: 'Komisi Pemuda', alias: [], bidang: 'PEMBINAAN2', pagu: 25_000_000 },
  { kode: 'DIAKEN', nama: 'Diaken', singkatan: 'Diaken', alias: [], bidang: 'KESAKSIAN', pagu: 3_000_000 },
  { kode: 'KESPEL', nama: 'Komisi Kespel', singkatan: 'KESPEL', alias: ['Kesehatan dan Pelayanan Masyarakat'], bidang: 'KESAKSIAN', pagu: 50_000_000 },
  { kode: 'PEJ', nama: 'Pengembangan Ekonomi Jemaat', singkatan: 'PEJ', alias: ['Pengembangan Ekonomi'], bidang: 'KESAKSIAN', pagu: 15_000_000 },
  { kode: 'LP4WG', nama: 'LP4WG', singkatan: 'LP4WG', alias: [], bidang: 'KESAKSIAN', pagu: 3_000_000 },
] as const

// Penatalayanan, Ministerium, Kemajelisan bukan UPK: pos biaya. Nilai pagu diisi admin lewat master data (Struktur & anggaran).
const POS = [
  { kode: 'POS_GAJI', nama: 'Biaya Hidup Pendeta dan Karyawan', singkatan: 'Biaya Hidup', alias: [], bidang: 'PENATALAYANAN', pagu: 0 },
  { kode: 'POS_OPS', nama: 'Biaya Operasional Kantor', singkatan: 'Operasional Kantor', alias: [], bidang: 'PENATALAYANAN', pagu: 0 },
  { kode: 'POS_RT', nama: 'Biaya Pemeliharaan Rumah Tangga', singkatan: 'Rumah Tangga', alias: [], bidang: 'PENATALAYANAN', pagu: 0 },
  { kode: 'POS_SEKRE', nama: 'Kesekretariatan', singkatan: 'Sekretariat', alias: [], bidang: 'PENATALAYANAN', pagu: 0 },
  { kode: 'POS_MINISTERIUM', nama: 'Ministerium', singkatan: 'Ministerium', alias: [], bidang: 'MINISTERIUM', pagu: 0 },
  { kode: 'POS_MAJELIS', nama: 'Kemajelisan', singkatan: 'Kemajelisan', alias: [], bidang: 'KEMAJELISAN', pagu: 0 },
] as const

const SATUAN = ['Kegiatan', 'Orang', 'Paket', 'Sesi', 'Kali', 'Hari', 'Bulan', 'Jam', 'Buah', 'Set', 'Unit', 'Lembar', 'Eksemplar', 'Terbitan', 'Lembaga', 'Penerima']
const KATEGORI_BIAYA = [
  'Konsumsi', 'Narasumber/fasilitator', 'Bahan dan modul', 'Perlengkapan', 'Dokumentasi dan evaluasi',
  'Transportasi', 'Sewa tempat/peralatan', 'Publikasi dan cetak', 'Bantuan/penyaluran', 'Lain-lain',
]

const ACUAN_VISI = 'Menjadi gereja Kristus yang bertumbuh dalam iman, peduli terhadap sesama dan ciptaan, serta relevan di tengah dunia urban.'
const ACUAN_MISI = [
  { kode: 'IMAN', nama: 'Bertumbuh dalam iman', deskripsi: 'Membina iman yang berakar pada Firman dan menjangkau lintas generasi.' },
  { kode: 'SESAMA', nama: 'Peduli sesama', deskripsi: 'Menghadirkan kasih melalui pelayanan sosial dan pemberdayaan.' },
  { kode: 'CIPTAAN', nama: 'Peduli ciptaan', deskripsi: 'Mendorong kepedulian ekologis dan pengelolaan sumber daya.' },
  { kode: 'KOTA', nama: 'Relevan di tengah dunia urban', deskripsi: 'Menjawab kebutuhan nyata keluarga dan masyarakat urban.' },
]

const JABATAN = ['KETUA', 'SEKRETARIS', 'BENDAHARA'] as const

async function seedMaster(): Promise<void> {
  console.log('🌱 Master kegiatan...')

  const tahun = await prisma.tahunAnggaran.upsert({
    where: { tahun: 2027 },
    update: {},
    create: {
      tahun: 2027, nama: 'RKA 2027', aktif: true,
      rencanaBuka: new Date('2026-11-02T00:00:00Z'), rencanaTutup: new Date('2026-11-10T00:00:00Z'),
      praMukerTanggal: new Date('2026-11-15T00:00:00Z'), mukerTanggal: new Date('2026-11-22T00:00:00Z'),
    },
  })

  const bidangId = new Map<string, number>()
  for (const b of BIDANG) {
    const row = await prisma.bidang.upsert({ where: { kode: b.kode }, update: {}, create: b })
    bidangId.set(b.kode, row.id)
  }

  const semua = [
    ...UNIT.map((u, i) => ({ ...u, jenis: 'UPK' as const, urutan: i + 1 })),
    ...POS.map((u, i) => ({ ...u, jenis: 'POS' as const, urutan: 100 + i })),
  ]
  for (const u of semua) {
    const unit = await prisma.unit.upsert({
      where: { kode: u.kode },
      update: {},
      create: { kode: u.kode, nama: u.nama, singkatan: u.singkatan, alias: [...u.alias], jenis: u.jenis, urutan: u.urutan, bidangId: bidangId.get(u.bidang)! },
    })
    // Pagu awal hanya bila belum ada (tidak menimpa suntingan admin)
    await prisma.paguUnit.upsert({
      where: { tahunId_unitId: { tahunId: tahun.id, unitId: unit.id } },
      update: {},
      create: { tahunId: tahun.id, unitId: unit.id, nilai: BigInt(u.pagu), catatan: 'Sementara = angka 2026' },
    })
    for (const jabatan of JABATAN) {
      await prisma.pengurus.upsert({
        where: { unitId_jabatan: { unitId: unit.id, jabatan } },
        update: {},
        create: {
          unitId: unit.id, jabatan, isContoh: true,
          nama: `(contoh) ${jabatan[0]}${jabatan.slice(1).toLowerCase()} ${u.singkatan}`,
          email: `${jabatan.toLowerCase()}.${u.kode.toLowerCase().replace(/_/g, '-')}@contoh.invalid`,
        },
      })
    }
  }

  const visi = await prisma.acuanStrategis.upsert({
    where: { tahunId_kode: { tahunId: tahun.id, kode: 'VISI' } },
    update: {},
    create: { tahunId: tahun.id, jenis: 'VISI', kode: 'VISI', nama: 'Visi GKJ Jakarta', deskripsi: ACUAN_VISI, urutan: 0 },
  })
  for (const [i, m] of ACUAN_MISI.entries()) {
    await prisma.acuanStrategis.upsert({
      where: { tahunId_kode: { tahunId: tahun.id, kode: m.kode } },
      update: {},
      create: { tahunId: tahun.id, jenis: 'MISI', kode: m.kode, nama: m.nama, deskripsi: m.deskripsi, parentId: visi.id, urutan: i + 1 },
    })
  }

  // Dukungan WhatsApp: nilai awal nonaktif; admin mengisinya di Master data > Dukungan (tidak menimpa isian admin).
  for (const [kunci, nilai] of [['dukungan_wa_aktif', 'false'], ['dukungan_wa_nomor', ''], ['dukungan_wa_pesan', 'Halo, saya {nama} ({unit}). Saya membutuhkan bantuan pada aplikasi Kegiatan GKJ Jakarta.']] as const) {
    await prisma.pengaturan.upsert({ where: { kunci }, update: {}, create: { kunci, nilai } })
  }

  for (const [i, nama] of SATUAN.entries()) await prisma.satuan.upsert({ where: { nama }, update: {}, create: { nama, urutan: i } })
  for (const [i, nama] of KATEGORI_BIAYA.entries()) await prisma.kategoriBiaya.upsert({ where: { nama }, update: {}, create: { nama, urutan: i } })

  if ((await prisma.program2026.count()) === 0) {
    const unitByKode = new Map((await prisma.unit.findMany({ select: { id: true, kode: true } })).map((u) => [u.kode, u.id]))
    await prisma.program2026.createMany({
      data: PROGRAM_2026.map((p) => {
        const unitId = unitByKode.get(p.unit)
        if (!unitId) throw new Error(`Unit ${p.unit} tidak ditemukan untuk program ${p.nama}`)
        return { unitId, nama: p.nama, keselarasan: p.keselarasan, kategori: p.kategori, bersyarat: p.bersyarat ?? false, rekomendasi: p.rekomendasi }
      }),
    })
  }
  console.log(`  ✓ tahun 2027, ${BIDANG.length} bidang, ${semua.length} unit (14 UPK + 6 pos), pagu, BPH, acuan, satuan, kategori, ${PROGRAM_2026.length} program 2026`)
}

function wajibEnv(nama: string): string {
  const v = process.env[nama]
  if (!v || v.length < 12) throw new Error(`${nama} wajib diisi di environment (minimal 12 karakter)`)
  return v
}

async function seedAdmin(): Promise<void> {
  const hash = await bcrypt.hash(wajibEnv('SEED_ADMIN_PASSWORD'), 10)
  await prisma.pengguna.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', nama: 'Administrator', peran: 'ADMIN', passwordHash: hash, wajibGantiPassword: true },
  })
  console.log('  ✓ akun admin (username: admin) — ganti password saat masuk pertama')
}

async function seedContoh(): Promise<void> {
  console.log('🧪 Data contoh (isContoh = true)...')
  const hash = await bcrypt.hash(wajibEnv('SEED_CONTOH_PASSWORD'), 10)
  const tahun = await prisma.tahunAnggaran.findUniqueOrThrow({ where: { tahun: 2027 } })

  const akun = async (username: string, nama: string, peran: 'SEKRETARIAT' | 'MAJELIS' | 'KOORDINATOR_BIDANG' | 'PENGURUS_UPK' | 'LP4WG' | 'KEPALA_KANTOR' | 'MINISTERIUM', extra: { unitId?: number; bidangId?: number; pengurusId?: number } = {}) =>
    prisma.pengguna.upsert({
      where: { username },
      update: { nama },
      create: { username, nama, peran, passwordHash: hash, wajibGantiPassword: false, isContoh: true, ...extra },
    })

  // Pengawas (hanya lihat): Penatua = peran MAJELIS; Ketua Bidang = KOORDINATOR_BIDANG per bidang.
  await akun('sekretariat', '(contoh) Sekretariat', 'SEKRETARIAT')
  await akun('penatua', '(contoh) Penatua', 'MAJELIS')
  await akun('lp4wg', '(contoh) LP4WG', 'LP4WG')
  await akun('kepala.kantor', '(contoh) Kepala Kantor', 'KEPALA_KANTOR')
  await akun('ministerium', '(contoh) Ministerium', 'MINISTERIUM')
  for (const b of await prisma.bidang.findMany()) await akun(`ketua.bidang.${b.kode.toLowerCase()}`, `(contoh) Ketua Bidang ${b.nama}`, 'KOORDINATOR_BIDANG', { bidangId: b.id })
  // Entry data per unit: Ketua, Sekretaris, Bendahara masing-masing satu akun (melihat dan mengisi program unitnya).
  for (const pg of await prisma.pengurus.findMany({ include: { unit: true } })) {
    await akun(`${pg.jabatan.toLowerCase()}.${pg.unit.kode.toLowerCase().replace(/_/g, '-')}`, pg.nama, 'PENGURUS_UPK', { unitId: pg.unitId, pengurusId: pg.id })
  }

  const unit = async (kode: string) => prisma.unit.findUniqueOrThrow({ where: { kode } })
  const acuan = async (kode: string) => (await prisma.acuanStrategis.findUniqueOrThrow({ where: { tahunId_kode: { tahunId: tahun.id, kode } } })).id
  const admin = await prisma.pengguna.findUniqueOrThrow({ where: { username: 'admin' } })

  if ((await prisma.programKerja.count({ where: { isContoh: true } })) > 0) {
    console.log('  ✓ program contoh sudah ada')
    return
  }

  type Rab = { uraian: string; volume: number; satuan: string; harga: number }
  const buat = async (kodeUnit: string, judul: string, status: 'DRAFT' | 'DIAJUKAN', rab: Rab[], sumber: Record<string, number>, lengkap: boolean) => {
    const u = await unit(kodeUnit)
    const p = await prisma.programKerja.create({
      data: {
        tahunId: tahun.id, unitId: u.id, judul, jenisProgram: 'LANJUTAN', isContoh: true, status,
        dibuatOleh: admin.id, diubahOleh: admin.id, diajukanPada: status === 'DIAJUKAN' ? new Date() : null, diajukanOleh: status === 'DIAJUKAN' ? admin.id : null,
        latarBelakang: '(CONTOH) Kegiatan ini dilaksanakan setiap tahun dan dinilai bermanfaat.',
        kebutuhan: '(CONTOH) Warga membutuhkan ruang pembinaan yang teratur.',
        tujuan: '(CONTOH) Meningkatkan keterlibatan peserta.',
        sasaranPenerima: '(CONTOH) Peserta sesuai komisi.', targetPeserta: 30,
        evaluasi: '(CONTOH) Evaluasi di akhir tahun melalui daftar hadir dan umpan balik.',
        picNama: lengkap ? '(contoh) Penanggung jawab' : null, picWhatsapp: lengkap ? '081200000000' : null,
        checklist: lengkap ? { identitas: true, kebutuhan: true, selaras: true, sasaran: true, realistis: true, indikator: true, anggaran: true, risiko: true, evaluasi: true } : {},
        acuan: { create: [{ acuanId: await acuan('IMAN') }] },
        jadwal: { create: [{ urutan: 0, nama: '(CONTOH) Pertemuan rutin', kategoriWaktu: 'PERIODE', keteranganPeriode: 'Setiap bulan' }] },
        indikator: { create: [{ urutan: 0, indikator: '(CONTOH) Kehadiran peserta', target: 'Minimal 20 orang per pertemuan', bukti: 'Daftar hadir' }] },
        rab: { create: rab.map((r, i) => ({ urutan: i, uraian: r.uraian, volume: r.volume, satuan: r.satuan, hargaSatuan: BigInt(r.harga), jumlah: BigInt(r.volume * r.harga) })) },
        sumberDana: { create: Object.entries(sumber).map(([jenis, nilai]) => ({ jenis: jenis as 'GEREJA', nilai: BigInt(nilai) })) },
      },
    })
    await prisma.programKerja.update({ where: { id: p.id }, data: { nomor: `2027-${kodeUnit}-${String(p.id).padStart(4, '0')}` } })
  }

  // Angka di bawah hanya ILUSTRASI untuk menguji tampilan; bukan data gereja.
  await buat('KOMAN', '(CONTOH) Ibadah Minggu Anak', 'DIAJUKAN', [{ uraian: 'Konsumsi', volume: 40, satuan: 'Orang', harga: 25_000 }, { uraian: 'Bahan peraga', volume: 10, satuan: 'Sesi', harga: 150_000 }], { GEREJA: 2_000_000, SWADAYA: 500_000 }, true)
  await buat('KOREM', '(CONTOH) Retreat Remaja', 'DIAJUKAN', [{ uraian: 'Akomodasi', volume: 30, satuan: 'Orang', harga: 600_000 }, { uraian: 'Narasumber', volume: 3, satuan: 'Sesi', harga: 1_000_000 }], { GEREJA: 14_000_000, SWADAYA: 7_000_000 }, true)
  await buat('PEJ', '(CONTOH) Mentoring Usaha', 'DRAFT', [{ uraian: 'Modul', volume: 20, satuan: 'Eksemplar', harga: 50_000 }], { GEREJA: 500_000 }, false)
  console.log('  ✓ akun contoh (sekretariat, penatua, lp4wg, kepala kantor, ministerium, ketua bidang, ketua/sekretaris/bendahara per unit) dan 3 program contoh')
}

async function main(): Promise<void> {
  await seedMaster()
  await seedAdmin()
  if (process.argv.includes('--contoh')) await seedContoh()
  console.log('✅ Seed selesai.')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
