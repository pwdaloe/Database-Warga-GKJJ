import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'
import {
  isKelompokScoped, parseDashboardFilter, wargaWhere, keluargaWhere,
} from '../services/dashboardScope.js'

export const dashboardRouter = Router()
dashboardRouter.use(authenticate)

// GET /api/dashboard/stats?wilayahId=&kelompokId= — total warga, keluarga, draft, kelompok aktif
dashboardRouter.get('/stats', async (req, res) => {
  const user = req.user!
  const f = parseDashboardFilter(req.query)
  const [totalWarga, totalKeluarga, wargaDraft, kelompokAktif, kelompok] = await Promise.all([
    prisma.warga.count({ where: wargaWhere(user, f) }),
    prisma.keluarga.count({ where: keluargaWhere(user, f) }),
    prisma.warga.count({ where: { AND: [wargaWhere(user, f), { dataStatus: 'DRAFT' }] } }),
    prisma.kelompok.count({
      where: { aktif: true, ...(f.wilayahId ? { wilayahId: f.wilayahId } : {}), ...(f.kelompokId ? { id: f.kelompokId } : {}) },
    }),
    isKelompokScoped(user) && user.kelompokId
      ? prisma.kelompok.findUnique({
          where: { id: user.kelompokId },
          select: { id: true, kode: true, nama: true },
        })
      : null,
  ])
  // `kelompok` terisi hanya untuk pengguna yang dibatasi ke satu kelompok
  ok(res, { totalWarga, totalKeluarga, wargaDraft, kelompokAktif, kelompok })
})

// GET /api/dashboard/sebaran?wilayahId=&kelompokId= — jumlah warga & keluarga per wilayah dan per kelompok.
// Kelompok yang belum punya warga tidak ditampilkan; wilayah tetap tampil.
dashboardRouter.get('/sebaran', async (req, res) => {
  const user = req.user!
  const f = parseDashboardFilter(req.query)
  const [wilayahList, wargaList, keluargaList] = await Promise.all([
    prisma.wilayah.findMany({
      where: f.wilayahId ? { id: f.wilayahId } : undefined,
      orderBy: { kode: 'asc' },
      select: {
        id: true, kode: true, nama: true,
        kelompoks: { where: f.kelompokId ? { id: f.kelompokId } : undefined, orderBy: { kode: 'asc' }, select: { id: true, kode: true, nama: true } },
      },
    }),
    prisma.warga.findMany({
      where: wargaWhere(user, f),
      select: { keluarga: { select: { kelompokId: true } } },
    }),
    prisma.keluarga.groupBy({
      by: ['kelompokId'],
      where: keluargaWhere(user, f),
      _count: { _all: true },
    }),
  ])

  const wargaPerKelompok = new Map<number, number>()
  for (const w of wargaList) {
    const kid = w.keluarga?.kelompokId
    if (kid != null) wargaPerKelompok.set(kid, (wargaPerKelompok.get(kid) ?? 0) + 1)
  }
  const keluargaPerKelompok = new Map<number, number>()
  for (const k of keluargaList) {
    if (k.kelompokId != null) keluargaPerKelompok.set(k.kelompokId, k._count._all)
  }

  const data = wilayahList
    .map((w) => {
      const kelompok = w.kelompoks
        .map((k) => ({
          id: k.id,
          kode: k.kode,
          nama: k.nama,
          jumlahWarga: wargaPerKelompok.get(k.id) ?? 0,
          jumlahKeluarga: keluargaPerKelompok.get(k.id) ?? 0,
        }))
        .filter((k) => k.jumlahWarga > 0)
      return {
        id: w.id,
        kode: w.kode,
        nama: w.nama,
        jumlahWarga: kelompok.reduce((a, k) => a + k.jumlahWarga, 0),
        jumlahKeluarga: kelompok.reduce((a, k) => a + k.jumlahKeluarga, 0),
        kelompok,
      }
    })
    // Penatua Kelompok hanya melihat wilayah yang memuat kelompoknya
    .filter((w) => !(isKelompokScoped(user) || f.wilayahId || f.kelompokId) || w.kelompok.length > 0)

  ok(res, data)
})

// GET /api/dashboard/terbaru?wilayahId=&kelompokId= — 5 warga yang terakhir dientry
dashboardRouter.get('/terbaru', async (req, res) => {
  const user = req.user!
  const list = await prisma.warga.findMany({
    where: wargaWhere(user, parseDashboardFilter(req.query)),
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      namaLengkap: true,
      createdAt: true,
      dataStatus: true,
      keluarga: {
        select: {
          kelompok: {
            select: {
              kode: true,
              nama: true,
              penatua_nama_temp: true,
              penatua: { select: { namaLengkap: true } },
              wilayah: { select: { kode: true, nama: true } },
            },
          },
        },
      },
    },
  })

  ok(res, list.map((w) => {
    const k = w.keluarga?.kelompok
    return {
      id: w.id,
      namaLengkap: w.namaLengkap,
      createdAt: w.createdAt,
      dataStatus: w.dataStatus,
      kelompok: k ? { kode: k.kode, nama: k.nama } : null,
      wilayah: k?.wilayah ?? null,
      majelis: k?.penatua?.namaLengkap ?? k?.penatua_nama_temp ?? null,
    }
  }))
})

// GET /api/dashboard/komisi-stats — distribusi umur per komisi
dashboardRouter.get('/komisi-stats', async (req, res) => {
  const user = req.user!
  const f = parseDashboardFilter(req.query)
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
          ...wargaWhere(user, f),
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
      ...wargaWhere(req.user!, parseDashboardFilter(req.query)),
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
