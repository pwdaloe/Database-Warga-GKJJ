import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'

export const dashboardRouter = Router()
dashboardRouter.use(authenticate)

// GET /api/dashboard/stats — total warga, keluarga, draft
dashboardRouter.get('/stats', async (_req, res) => {
  const [totalWarga, totalKeluarga, wargaDraft] = await Promise.all([
    prisma.warga.count(),
    prisma.keluarga.count(),
    prisma.warga.count({ where: { dataStatus: 'DRAFT' } }),
  ])
  ok(res, { totalWarga, totalKeluarga, wargaDraft })
})

// GET /api/dashboard/komisi-stats — distribusi umur per komisi
dashboardRouter.get('/komisi-stats', async (_req, res) => {
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
  const kelurahan = req.query['kelurahan'] as string | undefined

  const wargaList = await prisma.warga.findMany({
    where: {
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
