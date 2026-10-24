import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'
import { adalahQrTokenValid } from '../utils/qrToken.js'

export const publicRouter = Router()

const TIDAK_DITEMUKAN = 'Anggota tidak ditemukan'

// Batas laju khusus halaman publik anggota (di samping limiter global 200/15 menit),
// supaya penelusuran massal tidak praktis. Tebakan token 128 bit tidak mungkin; ini pagar tambahan
// untuk jalur id numerik lama dan untuk penelusuran sembarang.
const limiterAnggota = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
})
const limiterIdLama = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
})

// Jalur id numerik lama (QR/tautan sebelum token) hanya hidup bila env persis "true".
// Nilai lain, termasuk kosong atau salah ketik, dianggap mati (aman secara bawaan).
const idLamaDiizinkan = () => process.env['QR_ALLOW_LEGACY_ID'] === 'true'
const adalahIdNumerik = (nilai: string) => /^\d{1,9}$/.test(nilai)

// Respons anggota tidak boleh disimpan cache bersama atau diindeks mesin pencari
publicRouter.use('/member', (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  res.set('X-Robots-Tag', 'noindex, nofollow')
  next()
})

publicRouter.use('/member/:token', limiterAnggota, (req, res, next) => {
  if (adalahIdNumerik(String(req.params['token']))) { limiterIdLama(req, res, next); return }
  next()
})

// GET /api/public/member/:token — info terbatas, tanpa autentikasi
// Dipakai oleh halaman publik /m/[token] saat QR kartu anggota di-scan.
// Token tidak valid dan token tidak ditemukan sama-sama 404 dengan pesan identik (tanpa "oracle").
publicRouter.get('/member/:token', async (req, res) => {
  const param = String(req.params['token'])

  let where: { qrToken: string } | { id: number } | null = null
  if (adalahQrTokenValid(param)) where = { qrToken: param }
  else if (adalahIdNumerik(param) && idLamaDiizinkan()) where = { id: Number(param) }

  const warga = where
    ? await prisma.warga.findUnique({
        where,
        select: {
          id: true,
          nomorAnggota: true,
          nomorInduk: true,
          namaLengkap: true,
          namaPanggilan: true,
          jenisKelamin: true,
          fotoUrl: true,
          statusKeanggotaan: true,
          statusKeluarga: true,
          sudahBaptis: true,
          sudahSidi: true,
          dataStatus: true,
          keluarga: {
            select: {
              kelompok: {
                select: {
                  nama: true,
                  kode: true,
                  penatua_nama_temp: true,
                  wilayah: { select: { nama: true } },
                },
              },
            },
          },
        },
      })
    : null

  if (!warga) { res.status(404).json({ success: false, error: TIDAK_DITEMUKAN }); return }

  ok(res, warga)
})
