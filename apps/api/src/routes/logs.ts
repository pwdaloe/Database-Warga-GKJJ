import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'

export const logsRouter = Router()
logsRouter.use(authenticate)
logsRouter.use(authorize('SUPERADMIN', 'KEPALA_KANTOR'))

// GET /api/logs?status=error&userId=&path=&limit=&page=
logsRouter.get('/', async (req, res) => {
  const { status, userId, path, page, limit } = z.object({
    status: z.enum(['all', 'success', 'error']).default('all'),
    userId: z.coerce.number().int().optional(),
    path:   z.string().optional(),
    page:   z.coerce.number().int().positive().default(1),
    limit:  z.coerce.number().int().min(10).max(200).default(50),
  }).parse(req.query)

  const where: any = {}
  if (status === 'error')   where.statusCode = { gte: 400 }
  if (status === 'success') where.statusCode = { lt: 400 }
  if (userId) where.userId = userId
  if (path)   where.path   = { contains: path, mode: 'insensitive' }

  const [total, data] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true, userNama: true,
        method: true, path: true,
        statusCode: true, errorMessage: true,
        bodySnapshot: true,
        ipAddress: true, durasiMs: true,
        createdAt: true,
      },
    }),
  ])

  const serialized = data.map((row) => ({ ...row, id: row.id.toString() }))

  ok(res, { data: serialized, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
})

// DELETE /api/logs — hapus log lebih tua dari N hari (default 90)
logsRouter.delete('/', async (req, res) => {
  const days = Number(req.query['days'] ?? 90)
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const { count } = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  ok(res, { message: `${count} log dihapus (lebih lama dari ${days} hari)` })
})
