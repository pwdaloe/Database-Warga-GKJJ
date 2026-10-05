import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'
import { isKelompokScoped, wargaScope, keluargaScope } from '../services/dashboardScope.js'

export const dashboardRouter = Router()
dashboardRouter.use(authenticate)

// GET /api/dashboard/stats — total warga, keluarga, draft
dashboardRouter.get('/stats', async (req, res) => {
  const user = req.user!
  const [totalWarga, totalKeluarga, wargaDraft, kelompok] = await Promise.all([
    prisma.warga.count({ where: wargaScope(user) }),
    prisma.keluarga.count({ where: keluargaScope(user) }),
    prisma.warga.count({ where: { ...wargaScope(user), dataStatus: 'DRAFT' } }),
    isKelompokScoped(user) && user.kelompokId
      ? prisma.kelompok.findUnique({
          where: { id: user.kelompokId },
          select: { id: true, kode: true, nama: true },
        })
      : null,
  ])
  // `kelompok` terisi hanya untuk pengguna yang dibatasi ke satu kelompok
  ok(res, { totalWarga, totalKeluarga, wargaDraft, kelompok })
})

// GET /api/dashboard/komisi-stats — distribusi umur per komisi
dashboardRouter.get('/komisi-stats', async (req, res) => {
  const user = req.user!
  const komisiList = await prisma.komisiConfig.findMany({ orderBy: { urutan: 'asc' } })
  const today = new Date()

  const stats = await Promise.all(
    komisiList.map(async (k) => {
      // Hitung warga yang tanggalLahirnya masuk rentang usia
      const minDate = k.maxUsia != null
        ? new Date(today.getFullYear() - k.maxUsia - 1, today.getMonth(), today.getDate() + 1)
        : null
      const maxDate = new Date(today.getFullYear() - k.minUsia, today.getMonth(), today.getDate())

      const jumlah = await prisma.warga.count({
        where: {
          ...wargaScope(user),
          tanggalLahir: {
            ...(minDate ? { gt: minDate } : {}),
            lte: maxDate,
          },
          statusKeanggotaan: 'AKTIF',
        },
      })
      return { id: k.id, nama: k.nama, jumlah, warna: k.warna, minUsia: k.minUsia, maxUsia: k.maxUsia }
    }),
  )

  ok(res, stats)
})

// GET /api/dashboard/map?kelurahan= — koordinat warga untuk peta
dashboardRouter.get('/map', async (req, res) => {
  // Koordinat rumah disembunyikan untuk VIEWER (read-only), sama dengan sanitizeForRole
  if (req.user!.role === 'VIEWER') return ok(res, [])

  const kelurahan = req.query['kelurahan'] as string | undefined

  const wargaList = await prisma.warga.findMany({
    where: {
      ...wargaScope(req.user!),
      latitude: { not: null },
      longitude: { not: null },
      ...(kelurahan
        ? { keluarga: { kelurahan: { equals: kelurahan, mode: 'insensitive' } } }
        : {}),
    },
    select: {
      id: true,
      namaLengkap: true,
      nomorAnggota: true,
      nomorInduk: true,
      latitude: true,
      longitude: true,
      statusKeanggotaan: true,
      keluarga: {
        select: {
          kelurahan: true,
          kelompok: { select: { nama: true } },
        },
      },
    },
    take: 500,
  })

  ok(res, wargaList)
})
