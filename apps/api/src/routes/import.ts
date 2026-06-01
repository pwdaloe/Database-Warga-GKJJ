import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'

export const importRouter = Router()
importRouter.use(authenticate)

// ── Helpers ──────────────────────────────────────────────────

function parseDate(raw: string | number | undefined | null): Date | null {
  if (!raw) return null
  if (typeof raw === 'number') {
    // Excel serial number → JS Date
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000))
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(raw).trim()
  if (!s) return null
  const attempt = new Date(s.replace(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/, '$3-$2-$1'))
  return isNaN(attempt.getTime()) ? null : attempt
}

function normBool(v: unknown): boolean {
  return ['Y', 'YA', 'YES', 'TRUE', '1', 'SUDAH', 'IYA'].includes(
    String(v ?? '').trim().toUpperCase(),
  )
}

function normJK(v: unknown): 'L' | 'P' | null {
  const s = String(v ?? '').trim().toUpperCase()
  if (['L', 'LAKI', 'LAKI-LAKI', 'MALE', 'M'].includes(s)) return 'L'
  if (['P', 'PEREMPUAN', 'WANITA', 'FEMALE', 'F'].includes(s)) return 'P'
  return null
}

function normEnum(v: unknown, allowed: string[], def: string): string {
  const s = String(v ?? '').trim().toUpperCase().replace(/[^A-Z_]/g, '')
  return allowed.find((a) => a === s) ?? def
}

// Row schema
const rowSchema = z.object({
  namaLengkap:        z.string().optional(),
  namaPanggilan:      z.string().optional(),
  jenisKelamin:       z.string().optional(),
  nomorInduk:         z.string().optional(),
  nik:                z.string().optional(),
  tempatLahir:        z.string().optional(),
  tanggalLahir:       z.union([z.string(), z.number()]).optional(),
  golonganDarah:      z.string().optional(),
  statusKeluarga:     z.string().optional(),
  statusKeanggotaan:  z.string().optional(),
  sudahBaptis:        z.union([z.string(), z.boolean(), z.number()]).optional(),
  tanggalBaptis:      z.union([z.string(), z.number()]).optional(),
  tempatBaptis:       z.string().optional(),
  sudahSidi:          z.union([z.string(), z.boolean(), z.number()]).optional(),
  nomorSidi:          z.string().optional(),
  tanggalSidi:        z.union([z.string(), z.number()]).optional(),
  telepon:            z.string().optional(),
  whatsapp:           z.string().optional(),
  email:              z.string().optional(),
  pendidikanTerakhir: z.string().optional(),
  pekerjaan:          z.string().optional(),
  kelompokKode:       z.string().optional(),
  catatan:            z.string().optional(),
  _rowIndex:          z.number(),
})

// POST /api/import/warga — batch import (maks 200 rows per call)
importRouter.post(
  '/warga',
  authorize('SUPERADMIN', 'KEPALA_KANTOR', 'STAF_ADMIN'),
  async (req, res) => {
    const rawRows = z.array(rowSchema).max(200).parse(req.body.rows)

    type LogEntry = {
      baris: number; status: 'berhasil' | 'gagal'
      nama: string; nomorAnggota?: string; alasan?: string
    }
    const log: LogEntry[] = []
    const kelompokCache: Record<string, number | null> = {}

    for (const raw of rawRows) {
      const baris = raw._rowIndex
      const namaDisplay = String(raw.namaLengkap ?? '(kosong)').trim()

      try {
        // ── Validasi wajib ──────────────────────────────────
        const namaLengkap = String(raw.namaLengkap ?? '').trim()
        if (namaLengkap.length < 2)
          throw new Error('Nama lengkap wajib diisi (minimal 2 karakter)')

        const jk = normJK(raw.jenisKelamin)
        if (!jk)
          throw new Error(`Jenis kelamin tidak valid: "${raw.jenisKelamin}" — isi L atau P`)

        // ── Cek duplikat NIK ────────────────────────────────
        const nik = raw.nik ? String(raw.nik).replace(/\s/g, '') : null
        if (nik && nik.length > 0) {
          const ex = await prisma.warga.findUnique({ where: { nik } })
          if (ex) throw new Error(`NIK sudah terdaftar pada: ${ex.namaLengkap}`)
        }

        // ── Cek duplikat nomorInduk ─────────────────────────
        const nomorInduk = raw.nomorInduk ? String(raw.nomorInduk).trim() : null
        if (nomorInduk) {
          const ex = await prisma.warga.findFirst({ where: { nomorInduk } })
          if (ex) throw new Error(`No. Induk "${nomorInduk}" sudah dipakai oleh: ${ex.namaLengkap}`)
        }

        // ── Resolve kelompok & keluarga ─────────────────────
        let keluargaId: number | null = null
        const kodeStr = raw.kelompokKode ? String(raw.kelompokKode).trim().toUpperCase() : ''

        if (kodeStr) {
          if (!(kodeStr in kelompokCache)) {
            const klp = await prisma.kelompok.findFirst({
              where: { kode: kodeStr }, select: { id: true },
            })
            kelompokCache[kodeStr] = klp?.id ?? null
          }
          const kelompokId = kelompokCache[kodeStr]
          if (!kelompokId)
            throw new Error(`Kode kelompok "${kodeStr}" tidak ditemukan`)

          const statusKK = normEnum(raw.statusKeluarga,
            ['KEPALA','ISTRI','ANAK','MENANTU','CUCU','LAINNYA'], 'LAINNYA')

          if (statusKK === 'KEPALA') {
            // Buat dulu tanpa nomorKeluarga → pakai ID (bebas race condition)
            const kk = await prisma.keluarga.create({
              data: { kelompokId, createdBy: req.user!.userId, updatedBy: req.user!.userId },
            })
            const nomorKK = `KLG${String(kk.id).padStart(5, '0')}`
            await prisma.keluarga.update({ where: { id: kk.id }, data: { nomorKeluarga: nomorKK } })
            keluargaId = kk.id
          } else {
            const kk = await prisma.keluarga.findFirst({
              where: { kelompokId }, orderBy: { id: 'desc' },
            })
            if (kk) keluargaId = kk.id
          }
        }

        // ── Normalisasi ─────────────────────────────────────
        const statusKK = normEnum(raw.statusKeluarga,
          ['KEPALA','ISTRI','ANAK','MENANTU','CUCU','LAINNYA'], 'LAINNYA')
        const statusAnggota = normEnum(raw.statusKeanggotaan,
          ['AKTIF','NON_AKTIF','KATEKUMEN','PINDAH_KELUAR','MENINGGAL'], 'AKTIF')
        const golDarah = ['A','B','AB','O'].includes(
          String(raw.golonganDarah ?? '').trim().toUpperCase())
          ? String(raw.golonganDarah).trim().toUpperCase() as any
          : null

        // Buat warga dulu tanpa nomorAnggota → set berdasar ID setelah insert
        const warga = await prisma.warga.create({
          data: {
            keluargaId, nomorInduk, namaLengkap,
            namaPanggilan:     raw.namaPanggilan ? String(raw.namaPanggilan).trim() || null : null,
            jenisKelamin:      jk,
            nik:               nik || null,
            tempatLahir:       raw.tempatLahir  ? String(raw.tempatLahir).trim()  || null : null,
            tanggalLahir:      parseDate(raw.tanggalLahir  as any),
            golonganDarah:     golDarah,
            statusKeluarga:    statusKK    as any,
            statusKeanggotaan: statusAnggota as any,
            sudahBaptis:       normBool(raw.sudahBaptis),
            tanggalBaptis:     parseDate(raw.tanggalBaptis as any),
            tempatBaptis:      raw.tempatBaptis  ? String(raw.tempatBaptis).trim()  || null : null,
            sudahSidi:         normBool(raw.sudahSidi),
            nomorSidi:         raw.nomorSidi     ? String(raw.nomorSidi).trim()     || null : null,
            tanggalSidi:       parseDate(raw.tanggalSidi   as any),
            telepon:           raw.telepon       ? String(raw.telepon).trim()       || null : null,
            whatsapp:          raw.whatsapp      ? String(raw.whatsapp).trim()      || null : null,
            email:             raw.email         ? String(raw.email).trim().toLowerCase() || null : null,
            pendidikanTerakhir: raw.pendidikanTerakhir ? String(raw.pendidikanTerakhir).trim() || null : null,
            pekerjaan:         raw.pekerjaan     ? String(raw.pekerjaan).trim()     || null : null,
            catatan:           raw.catatan       ? String(raw.catatan).trim()       || null : null,
            dataStatus:        'DRAFT',
            createdBy:         req.user!.userId,
            updatedBy:         req.user!.userId,
          },
        })

        // Set nomorAnggota berbasis ID (dijamin unik, bebas race condition)
        const nomorAnggota = `WRG${String(warga.id).padStart(5, '0')}`
        await prisma.warga.update({ where: { id: warga.id }, data: { nomorAnggota } })

        // Tandai kepala di tabel keluarga
        if (keluargaId && statusKK === 'KEPALA') {
          await prisma.keluarga.update({
            where: { id: keluargaId },
            data:  { kepalakeluargaId: warga.id },
          })
        }

        log.push({ baris, status: 'berhasil', nama: namaLengkap, nomorAnggota })
      } catch (err: any) {
        log.push({ baris, status: 'gagal', nama: namaDisplay, alasan: err.message ?? 'Kesalahan tidak diketahui' })
      }
    }

    const berhasil = log.filter((l) => l.status === 'berhasil').length
    const gagal    = log.filter((l) => l.status === 'gagal').length
    ok(res, { total: rawRows.length, berhasil, gagal, log })
  },
)
