import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'

export const wilayahRouter = Router()

wilayahRouter.use(authenticate)

// GET /api/wilayah — semua wilayah beserta kelompok
wilayahRouter.get('/', async (_req, res) => {
  const data = await prisma.wilayah.findMany({
    where: { aktif: true },
    include: {
      kelompoks: {
        where: { aktif: true },
        orderBy: { kode: 'asc' },
        select: { id: true, kode: true, nama: true, penatua_nama_temp: true },
      },
    },
    orderBy: { kode: 'asc' },
  })
  ok(res, data)
})
