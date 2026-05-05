import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'

export const kelompokRouter = Router()

kelompokRouter.use(authenticate)

// GET /api/kelompok — semua kelompok, bisa filter by wilayahId
kelompokRouter.get('/', async (req, res) => {
  const wilayahId = req.query['wilayahId'] ? Number(req.query['wilayahId']) : undefined
  const data = await prisma.kelompok.findMany({
    where: { aktif: true, ...(wilayahId ? { wilayahId } : {}) },
    include: { wilayah: true },
    orderBy: { kode: 'asc' },
  })
  ok(res, data)
})
