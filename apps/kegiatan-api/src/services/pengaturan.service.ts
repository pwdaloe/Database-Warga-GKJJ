import { prisma } from '../utils/prisma.js'
import { normalizeWa } from '../utils/waNumber.js'

export const KUNCI_DUKUNGAN = { aktif: 'dukungan_wa_aktif', nomor: 'dukungan_wa_nomor', pesan: 'dukungan_wa_pesan' } as const

export const PESAN_DUKUNGAN_AWAL = 'Halo, saya {nama} ({unit}). Saya membutuhkan bantuan pada aplikasi Kegiatan GKJ Jakarta.'

export interface Dukungan {
  aktif: boolean
  /** Format internasional tanpa plus (62812…), atau null bila belum diisi */
  nomor: string | null
  pesan: string
}

/** Pengaturan bantuan WhatsApp. Dianggap nonaktif bila nomor kosong atau tidak valid. */
export async function ambilDukungan(): Promise<Dukungan> {
  const baris = await prisma.pengaturan.findMany({ where: { kunci: { in: Object.values(KUNCI_DUKUNGAN) } } })
  const nilai = new Map(baris.map((b) => [b.kunci, b.nilai]))
  const nomor = normalizeWa(nilai.get(KUNCI_DUKUNGAN.nomor))
  return {
    aktif: nilai.get(KUNCI_DUKUNGAN.aktif) === 'true' && nomor !== null,
    nomor,
    pesan: nilai.get(KUNCI_DUKUNGAN.pesan)?.trim() || PESAN_DUKUNGAN_AWAL,
  }
}

export async function simpanDukungan(d: { aktif: boolean; nomor: string | null; pesan: string }): Promise<void> {
  const simpan = (kunci: string, nilai: string) =>
    prisma.pengaturan.upsert({ where: { kunci }, create: { kunci, nilai }, update: { nilai } })
  await Promise.all([
    simpan(KUNCI_DUKUNGAN.aktif, d.aktif ? 'true' : 'false'),
    simpan(KUNCI_DUKUNGAN.nomor, d.nomor ?? ''),
    simpan(KUNCI_DUKUNGAN.pesan, d.pesan),
  ])
}
