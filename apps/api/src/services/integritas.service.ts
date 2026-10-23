import { prisma } from '../utils/prisma.js'

/**
 * Pemeriksaan integritas relasi Keluarga ↔ Warga (read-only).
 * Dipakai untuk menangkap KK kosong / penunjuk kepala basi yang pernah muncul di produksi
 * (kasus Tri Endah, 2026-10-07). Jalankan terhadap produksi setelah tiap deploy.
 */
export interface TemuanIntegritas {
  kode: 'KK_KOSONG' | 'KEPALA_TIDAK_COCOK' | 'KEPALA_TANPA_KK' | 'KK_KEPALA_GANDA' | 'DUPLIKAT_NAMA_LAHIR'
  judul: string
  jumlah: number
  contoh: Record<string, unknown>[]
}

const BATAS_CONTOH = 20

type Baris = Record<string, unknown>

const PEMERIKSAAN: { kode: TemuanIntegritas['kode']; judul: string; sql: string }[] = [
  {
    kode: 'KK_KOSONG',
    judul: 'KK tanpa anggota sama sekali',
    sql: `SELECT k.id, k.nomor_keluarga FROM keluarga k
          WHERE NOT EXISTS (SELECT 1 FROM warga w WHERE w.keluarga_id = k.id)
          ORDER BY k.id`,
  },
  {
    kode: 'KEPALA_TIDAK_COCOK',
    judul: 'kepala_keluarga_id menunjuk warga yang bukan anggota KK itu atau bukan berstatus KEPALA',
    sql: `SELECT k.id, k.nomor_keluarga, k.kepala_keluarga_id, w.keluarga_id AS keluarga_kepala, w.status_keluarga
          FROM keluarga k JOIN warga w ON w.id = k.kepala_keluarga_id
          WHERE w.keluarga_id IS DISTINCT FROM k.id OR w.status_keluarga <> 'KEPALA'
          ORDER BY k.id`,
  },
  {
    kode: 'KEPALA_TANPA_KK',
    judul: 'warga berstatus KEPALA tanpa KK, atau KK-nya tidak menunjuk dia sebagai kepala',
    sql: `SELECT w.id, w.nama_lengkap, w.keluarga_id FROM warga w
          LEFT JOIN keluarga k ON k.id = w.keluarga_id
          WHERE w.status_keluarga = 'KEPALA'
            AND w.status_keanggotaan = 'AKTIF'
            AND (w.keluarga_id IS NULL OR k.kepala_keluarga_id IS DISTINCT FROM w.id)
          ORDER BY w.id`,
  },
  {
    kode: 'KK_KEPALA_GANDA',
    judul: 'KK dengan lebih dari satu anggota aktif berstatus KEPALA',
    sql: `SELECT keluarga_id AS id, COUNT(*)::int AS jumlah_kepala FROM warga
          WHERE status_keluarga = 'KEPALA' AND status_keanggotaan = 'AKTIF' AND keluarga_id IS NOT NULL
          GROUP BY keluarga_id HAVING COUNT(*) > 1
          ORDER BY keluarga_id`,
  },
  {
    kode: 'DUPLIKAT_NAMA_LAHIR',
    judul: 'kemungkinan duplikat: nama dan tanggal lahir sama (NIK sudah unik di DB)',
    sql: `SELECT LOWER(TRIM(nama_lengkap)) AS nama, tanggal_lahir, COUNT(*)::int AS jumlah, ARRAY_AGG(id ORDER BY id) AS id_warga
          FROM warga WHERE tanggal_lahir IS NOT NULL
          GROUP BY LOWER(TRIM(nama_lengkap)), tanggal_lahir HAVING COUNT(*) > 1
          ORDER BY nama`,
  },
]

export async function cekIntegritas(): Promise<TemuanIntegritas[]> {
  const hasil: TemuanIntegritas[] = []
  for (const p of PEMERIKSAAN) {
    const baris = (await prisma.$queryRawUnsafe(p.sql)) as Baris[]
    hasil.push({ kode: p.kode, judul: p.judul, jumlah: baris.length, contoh: baris.slice(0, BATAS_CONTOH) })
  }
  return hasil
}

export const DAFTAR_PEMERIKSAAN = PEMERIKSAAN.map(({ kode, judul }) => ({ kode, judul }))
