import jwt from 'jsonwebtoken'
import { vi } from 'vitest'

export const RAHASIA = 'rahasia-uji-kegiatan'

export interface PenggunaUji {
  id: number
  username: string
  nama: string
  peran: 'ADMIN' | 'SEKRETARIAT' | 'KOORDINATOR_BIDANG' | 'PENGURUS_UPK' | 'MAJELIS' | 'LP4WG' | 'KEPALA_KANTOR' | 'MINISTERIUM'
  unitId: number | null
  bidangId: number | null
  aktif: boolean
  wajibGantiPassword: boolean
}

export const pengguna = (peran: PenggunaUji['peran'], ubah: Partial<PenggunaUji> = {}): PenggunaUji => ({
  id: 1, username: `uji-${peran.toLowerCase()}`, nama: 'Pengguna Uji', peran,
  unitId: peran === 'PENGURUS_UPK' ? 5 : null, bidangId: peran === 'KOORDINATOR_BIDANG' ? 1 : null,
  aktif: true, wajibGantiPassword: false, ...ubah,
})

export const tokenUntuk = (id: number): string => jwt.sign({ sub: id }, RAHASIA)

/** Pasang pengguna agar `authenticate` menemukannya, dan kembalikan header Authorization. */
export function masuk(prisma: { pengguna: { findUnique: ReturnType<typeof vi.fn> } }, u: PenggunaUji): { Authorization: string } {
  prisma.pengguna.findUnique.mockResolvedValue(u)
  return { Authorization: `Bearer ${tokenUntuk(u.id)}` }
}

export const tahunDb = (statusPengajuan: 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP' = 'DIBUKA') => ({
  id: 1, tahun: 2027, nama: 'RKA 2027', statusPengajuan, aktif: true,
})

/** Baris program seperti dikembalikan Prisma (dengan relasi) */
export function programDb(ubah: Record<string, unknown> = {}) {
  const dasar = {
    id: 10, tahunId: 1, unitId: 5, nomor: '2027-U5-0010', judul: 'Program Uji', jenisProgram: 'BARU', program2026Id: null,
    latarBelakang: 'L', kebutuhan: 'K', tujuan: 'T', sasaranPenerima: 'S', targetPeserta: 10, evaluasi: 'E', picNama: 'PIC', picWhatsapp: '081234567890',
    checklist: { identitas: true, kebutuhan: true, selaras: true, sasaran: true, realistis: true, indikator: true, anggaran: true, risiko: true, evaluasi: true },
    status: 'DRAFT', diajukanPada: null, diajukanOleh: null, dibuatOleh: 1, diubahOleh: 1, isContoh: false, createdAt: new Date(), updatedAt: new Date(),
    unit: { id: 5, kode: 'U5', nama: 'Unit 5', singkatan: 'U5', bidangId: 1, jenis: 'UPK' },
    tahun: tahunDb(),
    acuan: [{ acuanId: 100 }],
    jadwal: [{ id: 1, nama: 'Kegiatan', kategoriWaktu: 'TAHUN', tanggalMulai: null, tanggalSelesai: null, keteranganPeriode: null, lokasi: null, hasilLangsung: null, urutan: 0 }],
    indikator: [{ id: 1, indikator: 'I', target: 'T', bukti: 'B', urutan: 0 }],
    rab: [{ id: 1, urutan: 0, kategoriId: null, kategori: null, uraian: 'Konsumsi', perhitungan: null, volume: 10, satuan: 'Orang', hargaSatuan: 100_000n, jumlah: 1_000_000n }],
    sumberDana: [{ id: 1, jenis: 'GEREJA', nilai: 1_000_000n, keterangan: null }],
  }
  return { ...dasar, ...ubah }
}

/** Mock prisma lengkap untuk route kegiatan. `$transaction` menjalankan callback dengan mock yang sama. */
export function buatPrisma() {
  const m = (...nama: string[]) => Object.fromEntries(nama.map((n) => [n, vi.fn()]))
  const prisma: any = {
    pengguna: m('findUnique', 'findFirst', 'findMany', 'create', 'update'),
    pengurus: m('findUnique', 'update'),
    unit: m('findUnique', 'findMany', 'create', 'update'),
    bidang: m('findMany', 'create', 'update'),
    pengaturan: m('findMany', 'upsert'),
    paguUnit: m('findMany', 'upsert', 'createMany'),
    tahunAnggaran: m('findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany'),
    acuanStrategis: m('findMany', 'count', 'create', 'update', 'delete'),
    satuan: m('findMany', 'create', 'update'),
    kategoriBiaya: m('findMany', 'count', 'create', 'update'),
    program2026: m('findMany', 'findUnique'),
    programKerja: m('findUnique', 'findMany', 'create', 'update', 'delete'),
    programAcuan: m('deleteMany', 'count'),
    kegiatanJadwal: m('deleteMany'),
    indikator: m('deleteMany'),
    rabItem: m('deleteMany'),
    sumberDana: m('deleteMany'),
    logAudit: m('create'),
    $transaction: vi.fn(),
  }
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma))
  prisma.logAudit.create.mockResolvedValue({})
  prisma.pengaturan.findMany.mockResolvedValue([])
  prisma.pengaturan.upsert.mockResolvedValue({})
  return prisma
}
