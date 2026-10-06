import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { ok } from '../utils/response.js'
import { prisma } from '../utils/prisma.js'
import { getProfil, updateProfil, profilUpdateSchema } from '../services/profil.service.js'

/**
 * Profil Saya — khusus role JEMAAT. Id warga SELALU diambil dari akun yang login (users.warga_id),
 * tidak pernah dari parameter URL/body, sehingga tidak mungkin membuka atau mengubah warga lain.
 */
export const profilRouter = Router()
profilRouter.use(authenticate, authorize('JEMAAT'))

async function wargaIdSaya(userId: number): Promise<number | null> {
  const u = await prisma.user.findUnique({ where: { id: userId, aktif: true }, select: { wargaId: true } })
  return u?.wargaId ?? null
}

// GET /api/profil-saya
profilRouter.get('/', async (req, res) => {
  ok(res, await getProfil(await wargaIdSaya(req.user!.userId)))
})

// PUT /api/profil-saya
profilRouter.put('/', async (req, res) => {
  const input = profilUpdateSchema.parse(req.body)
  ok(res, await updateProfil(await wargaIdSaya(req.user!.userId), req.user!.userId, input))
})
