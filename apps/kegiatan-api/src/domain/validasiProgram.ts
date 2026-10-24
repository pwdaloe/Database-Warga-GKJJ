import { z } from 'zod'
import { KODE_CHECKLIST } from '../constants/checklist.js'
import { hitungJumlah, jumlahkan, rupiah, volumeSchema } from './rupiah.js'
import { normalizeWa } from '../utils/waNumber.js'

const teks = (maks: number) => z.string().trim().max(maks)
const teksOpsional = (maks: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), teks(maks).nullish())

const tanggal = z
  .preprocess((v) => (v === '' ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').nullish())
  .refine((v) => v == null || !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'Tanggal tidak valid')

export const KATEGORI_WAKTU = ['SEKALI', 'PERIODE', 'RENTANG', 'TAHUN'] as const
export const JENIS_SUMBER_DANA = ['GEREJA', 'SWADAYA', 'PENGGALANGAN', 'DONASI'] as const
export const JENIS_PROGRAM = ['BARU', 'LANJUTAN', 'GABUNGAN'] as const

export const jadwalSchema = z
  .object({
    nama: teks(200).min(1, 'Nama kegiatan wajib diisi'),
    kategoriWaktu: z.enum(KATEGORI_WAKTU),
    tanggalMulai: tanggal,
    tanggalSelesai: tanggal,
    keteranganPeriode: teksOpsional(150),
    lokasi: teksOpsional(150),
    hasilLangsung: teksOpsional(2000),
  })
  .refine((j) => !j.tanggalMulai || !j.tanggalSelesai || j.tanggalSelesai >= j.tanggalMulai, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path: ['tanggalSelesai'],
  })

export const indikatorSchema = z.object({
  indikator: teks(255).min(1, 'Indikator wajib diisi'),
  target: teks(150).min(1, 'Target wajib diisi'),
  bukti: teks(255).min(1, 'Bukti wajib diisi'),
})

export const rabSchema = z.object({
  kategoriId: z.number().int().positive().nullish(),
  uraian: teks(255).min(1, 'Uraian wajib diisi'),
  perhitungan: teksOpsional(255),
  volume: volumeSchema,
  satuan: teks(40).min(1, 'Satuan wajib diisi'),
  hargaSatuan: rupiah,
})

export const sumberDanaSchema = z.object({
  jenis: z.enum(JENIS_SUMBER_DANA),
  nilai: rupiah,
  keterangan: teksOpsional(255),
})

/** Masukan simpan (draft): bentuk harus benar, kelengkapan baru diperiksa saat mengajukan. */
export const simpanProgramSchema = z
  .object({
    judul: teks(200).min(3, 'Judul program minimal 3 karakter'),
    jenisProgram: z.enum(JENIS_PROGRAM).default('BARU'),
    program2026Id: z.number().int().positive().nullish(),
    latarBelakang: teksOpsional(5000),
    kebutuhan: teksOpsional(5000),
    tujuan: teksOpsional(5000),
    sasaranPenerima: teksOpsional(2000),
    targetPeserta: z.number().int().min(0).max(100000).nullish(),
    evaluasi: teksOpsional(5000),
    picNama: teksOpsional(150),
    picWhatsapp: teksOpsional(20),
    acuanIds: z.array(z.number().int().positive()).max(20).default([]),
    jadwal: z.array(jadwalSchema).max(60).default([]),
    indikator: z.array(indikatorSchema).max(30).default([]),
    rab: z.array(rabSchema).max(200).default([]),
    sumberDana: z.array(sumberDanaSchema).max(4).default([]),
    checklist: z.record(z.boolean()).default({}),
  })
  .superRefine((p, ctx) => {
    const jenis = p.sumberDana.map((s) => s.jenis)
    if (new Set(jenis).size !== jenis.length) {
      ctx.addIssue({ code: 'custom', path: ['sumberDana'], message: 'Setiap jenis sumber dana hanya boleh satu baris' })
    }
    if (new Set(p.acuanIds).size !== p.acuanIds.length) {
      ctx.addIssue({ code: 'custom', path: ['acuanIds'], message: 'Acuan visi-misi dobel' })
    }
    try {
      for (const r of p.rab) hitungJumlah(r.volume, r.hargaSatuan)
    } catch {
      ctx.addIssue({ code: 'custom', path: ['rab'], message: 'Jumlah satu baris RAB melebihi batas wajar (1 triliun)' })
    }
  })

export type SimpanProgram = z.infer<typeof simpanProgramSchema>

export function totalRab(rab: Array<{ volume: number; hargaSatuan: number }>): bigint {
  return jumlahkan(rab.map((r) => hitungJumlah(r.volume, r.hargaSatuan)))
}

export function totalSumberDana(sd: Array<{ nilai: number }>): bigint {
  return jumlahkan(sd.map((s) => s.nilai))
}

const kosong = (v: string | null | undefined): boolean => !v || v.trim() === ''

/**
 * Pemeriksaan kelengkapan sebelum mengajukan. Mengembalikan daftar masalah (kosong = lengkap).
 * Aturan uang: total sumber dana HARUS sama dengan total RAB (keduanya dihitung di sini, bukan dari klien).
 */
export function periksaKelengkapan(p: SimpanProgram): string[] {
  const masalah: string[] = []

  if (kosong(p.latarBelakang)) masalah.push('Latar belakang belum diisi.')
  if (kosong(p.kebutuhan)) masalah.push('Rumusan kebutuhan belum diisi.')
  if (kosong(p.tujuan)) masalah.push('Tujuan program belum diisi.')
  if (kosong(p.sasaranPenerima)) masalah.push('Sasaran atau penerima manfaat belum diisi.')
  if (kosong(p.evaluasi)) masalah.push('Rencana evaluasi dan pelaporan belum diisi.')
  if (kosong(p.picNama)) masalah.push('Nama penanggung jawab (PIC) belum diisi.')
  if (kosong(p.picWhatsapp) || !normalizeWa(p.picWhatsapp)) masalah.push('Nomor WhatsApp PIC belum diisi atau tidak valid.')
  if (p.acuanIds.length === 0) masalah.push('Pilih minimal satu acuan visi-misi.')

  if (p.jadwal.length === 0) masalah.push('Tambahkan minimal satu kegiatan pada rencana kegiatan dan jadwal.')
  p.jadwal.forEach((j, i) => {
    const nama = `Kegiatan ${i + 1}`
    if (j.kategoriWaktu === 'SEKALI' && !j.tanggalMulai) masalah.push(`${nama}: tanggal pelaksanaan belum diisi.`)
    if (j.kategoriWaktu === 'RENTANG' && (!j.tanggalMulai || !j.tanggalSelesai)) masalah.push(`${nama}: tanggal mulai dan selesai belum lengkap.`)
    if (j.kategoriWaktu === 'PERIODE' && kosong(j.keteranganPeriode)) masalah.push(`${nama}: keterangan periode belum diisi (mis. setiap bulan).`)
  })

  if (p.indikator.length === 0) masalah.push('Tambahkan minimal satu indikator keberhasilan.')

  if (p.rab.length === 0) {
    masalah.push('Tambahkan minimal satu baris rencana anggaran biaya.')
  } else {
    const rab = totalRab(p.rab)
    const sd = totalSumberDana(p.sumberDana)
    if (rab === 0n) masalah.push('Total anggaran masih Rp 0.')
    if (sd !== rab) {
      masalah.push(`Total sumber dana (Rp ${sd.toLocaleString('id-ID')}) harus sama dengan total anggaran (Rp ${rab.toLocaleString('id-ID')}).`)
    }
  }

  const belum = KODE_CHECKLIST.filter((k) => p.checklist[k] !== true)
  if (belum.length > 0) masalah.push(`Daftar periksa belum lengkap (${belum.length} butir belum dicentang).`)

  return masalah
}
