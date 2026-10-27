import { Router } from 'express'
import { z } from 'zod'
import { authorize, pelaku } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import * as svc from '../services/pengguna.service.js'
import { created, ok } from '../utils/response.js'
import { normalizeWa } from '../utils/waNumber.js'

export const penggunaRouter = Router()
penggunaRouter.use(authorize('ADMIN', 'SEKRETARIAT'))

const ip = (req: { ip?: string | undefined }): string | null => req.ip ?? null
const idParam = (v: unknown): number => {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new AppError(400, 'ID tidak valid')
  return n
}
const opsional = (s: z.ZodTypeAny) => z.preprocess((v) => (v === '' ? null : v), s.nullish())

penggunaRouter.get('/', async (_req, res) => {
  ok(res, await svc.daftarPengguna())
})

penggunaRouter.post('/', async (req, res) => {
  const d = z
    .object({
      username: z.string().trim().toLowerCase().min(3).max(50).regex(/^[a-z0-9._-]+$/, 'Username: huruf kecil, angka, titik, garis bawah, strip'),
      peran: z.enum(['ADMIN', 'SEKRETARIAT', 'KOORDINATOR_BIDANG', 'PENGURUS_UPK', 'MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM']),
      pengurusId: z.number().int().positive().optional(),
      bidangId: z.number().int().positive().optional(),
      nama: z.string().trim().min(2).max(150).optional(),
      email: opsional(z.string().trim().email().max(150)),
      whatsapp: opsional(z.string().trim().max(20)),
    })
    .refine((x) => !x.whatsapp || normalizeWa(x.whatsapp) !== null, { message: 'Nomor WhatsApp tidak valid', path: ['whatsapp'] })
    .parse(req.body)
  created(res, await svc.buatAkun(pelaku(req), d, ip(req)))
})

penggunaRouter.post('/:id/reset-password', async (req, res) => {
  ok(res, await svc.resetPassword(pelaku(req), idParam(req.params['id']), ip(req)))
})

penggunaRouter.put('/:id', async (req, res) => {
  const d = z
    .object({ aktif: z.boolean().optional(), nama: z.string().trim().min(2).max(150).optional(), email: opsional(z.string().trim().email().max(150)), whatsapp: opsional(z.string().trim().max(20)) })
    .parse(req.body)
  ok(res, await svc.ubahAkun(pelaku(req), idParam(req.params['id']), d, ip(req)))
})
