import { z } from 'zod'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import { encryptField, decryptField } from '../utils/crypto.js'
import { normalizeWa } from '../utils/waNumber.js'

/** 3171234567890001 → 3171••••••••0001 */
export function maskNik(nik: string | null): string | null {
  if (!nik) return null
  return nik.length <= 8 ? '••••' : nik.slice(0, 4) + '•'.repeat(nik.length - 8) + nik.slice(-4)
}

const opt = (max: number) => z.string().max(max).nullable().optional()

const alamatKeluargaSchema = z.object({
  alamat: z.string().max(500).nullable().optional(),
  rt: opt(5), rw: opt(5), kelurahan: opt(100), kecamatan: opt(100), kota: opt(100),
  kodePos: opt(10), teleponRumah: opt(20),
}).strict()

/**
 * Whitelist field yang boleh diubah jemaat. `.strict()` → field lain (nama lengkap, status keanggotaan,
 * sakramen, relasi keluarga, dataStatus, dll.) ditolak 400, bukan diabaikan diam-diam.
 */
export const profilUpdateSchema = z.object({
  namaPanggilan: opt(50),
  tempatLahir: opt(100),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').nullable().optional(),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit').optional(), // kosong/tidak dikirim = tidak diubah
  golonganDarah: z.enum(['A', 'B', 'AB', 'O']).nullable().optional(),
  telepon: opt(20),
  whatsapp: opt(20),
  whatsappBolehDitampilkan: z.boolean().optional(),
  email: z.string().email().max(100).nullable().optional(),
  pendidikanTerakhir: opt(50),
  pekerjaan: opt(100),
  alamatKtp: opt(1000),
  alamatDomisili: opt(1000), // null = sama dengan alamat KTP
  catatanJemaat: z.string().max(2000).nullable().optional(),
  alamatKeluarga: alamatKeluargaSchema.optional(),
}).strict()

export type ProfilUpdate = z.infer<typeof profilUpdateSchema>

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

async function loadOwn(wargaId: number | null | undefined) {
  // Fail-closed: akun jemaat tanpa tautan warga tidak melihat apa pun
  if (!wargaId) throw new AppError(403, 'Akun belum ditautkan ke data warga. Hubungi admin gereja.')
  const w = await prisma.warga.findUnique({
    where: { id: wargaId },
    include: { keluarga: true, catatanJemaat: { where: { jenis: 'CATATAN' }, take: 1 } },
  })
  if (!w) throw new AppError(404, 'Data warga tidak ditemukan')
  return w
}

const isKepala = (w: { statusKeluarga: string; keluargaId: number | null }) =>
  w.statusKeluarga === 'KEPALA' && !!w.keluargaId

export async function getProfil(wargaId: number | null | undefined) {
  const w = await loadOwn(wargaId)
  const k = w.keluarga
  return {
    // Hanya dibaca
    namaLengkap: w.namaLengkap, nomorAnggota: w.nomorAnggota, jenisKelamin: w.jenisKelamin,
    statusKeluarga: w.statusKeluarga,
    // Dapat diubah
    namaPanggilan: w.namaPanggilan, tempatLahir: w.tempatLahir,
    tanggalLahir: w.tanggalLahir ? w.tanggalLahir.toISOString().slice(0, 10) : null,
    nikMasker: maskNik(decryptField(w.nik)), golonganDarah: w.golonganDarah,
    telepon: w.telepon, whatsapp: w.whatsapp, whatsappBolehDitampilkan: w.whatsappBolehDitampilkan,
    email: w.email, pendidikanTerakhir: w.pendidikanTerakhir, pekerjaan: w.pekerjaan,
    alamatKtp: w.alamatKtp, alamatDomisili: w.alamatDomisili,
    catatanJemaat: w.catatanJemaat[0]?.isi ?? null,
    alamatKeluarga: k ? {
      alamat: k.alamat, rt: k.rt, rw: k.rw, kelurahan: k.kelurahan, kecamatan: k.kecamatan,
      kota: k.kota, kodePos: k.kodePos, teleponRumah: k.teleponRumah,
    } : null,
    bolehUbahAlamatKeluarga: isKepala(w),
    menungguVerifikasi: !!w.diubahMandiriAt,
  }
}

export async function updateProfil(wargaId: number | null | undefined, userId: number, input: ProfilUpdate) {
  const w = await loadOwn(wargaId)

  if (input.alamatKeluarga && !isKepala(w)) {
    throw new AppError(403, 'Alamat Kartu Keluarga hanya dapat diubah oleh kepala keluarga')
  }
  if (input.whatsapp && !normalizeWa(input.whatsapp)) throw new AppError(400, 'Nomor WhatsApp tidak valid')

  // Field warga yang akan ditulis (string kosong → null)
  const { nik, catatanJemaat, alamatKeluarga, ...fields } = input
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, emptyToNull(v)]),
  )
  if (data['tanggalLahir']) data['tanggalLahir'] = new Date(data['tanggalLahir'] as string)

  if (nik) {
    const enc = encryptField(nik)
    const dipakai = await prisma.warga.findFirst({ where: { nik: enc, NOT: { id: w.id } }, select: { id: true } })
    if (dipakai) throw new AppError(400, 'NIK sudah terdaftar pada data lain. Hubungi admin gereja.')
    data['nik'] = enc
  }

  const now = new Date()
  // Perubahan mandiri selalu kembali ke antrean Validasi Data
  const verifikasi = { dataStatus: 'DRAFT' as const, validatedBy: null, validatedAt: null, diubahMandiriAt: now, updatedBy: userId }

  // Jejak audit: nilai lama/baru per field yang dikirim; NIK tidak dicatat nilainya
  const lama: Record<string, unknown> = {}
  const baru: Record<string, unknown> = {}
  for (const key of Object.keys(data)) {
    if (key === 'nik') { lama['nik'] = '[tersimpan]'; baru['nik'] = '[diubah oleh jemaat]'; continue }
    lama[key] = (w as Record<string, unknown>)[key] ?? null
    baru[key] = data[key]
  }
  if (alamatKeluarga) {
    lama['alamatKeluarga'] = w.keluarga
      ? Object.fromEntries(Object.keys(alamatKeluarga).map((k) => [k, (w.keluarga as any)[k] ?? null]))
      : null
    baru['alamatKeluarga'] = alamatKeluarga
  }
  if (catatanJemaat !== undefined) { lama['catatanJemaat'] = w.catatanJemaat[0]?.isi ?? null; baru['catatanJemaat'] = catatanJemaat }

  await prisma.$transaction(async (tx) => {
    await tx.warga.update({ where: { id: w.id }, data: { ...data, ...verifikasi } as any })

    if (alamatKeluarga && w.keluargaId) {
      const kd = Object.fromEntries(Object.entries(alamatKeluarga).map(([k, v]) => [k, emptyToNull(v)]))
      await tx.keluarga.update({ where: { id: w.keluargaId }, data: { ...kd, dataStatus: 'DRAFT', updatedBy: userId } as any })
    }

    if (catatanJemaat !== undefined) {
      const isi = (emptyToNull(catatanJemaat) as string | null)
      const ada = w.catatanJemaat[0]
      if (!isi) { if (ada) await tx.catatanJemaat.delete({ where: { id: ada.id } }) }
      else if (ada) await tx.catatanJemaat.update({ where: { id: ada.id }, data: { isi } })
      else await tx.catatanJemaat.create({ data: { wargaId: w.id, jenis: 'CATATAN', isi } })
    }

    await tx.auditLog.create({
      data: {
        userId, action: 'UPDATE', tabel: 'warga', recordId: w.id,
        dataLama: lama as any, dataBaru: { ...baru, sumber: 'jemaat' } as any,
      },
    })
  })

  return getProfil(wargaId)
}
