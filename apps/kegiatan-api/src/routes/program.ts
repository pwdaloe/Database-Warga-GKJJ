import { Router } from 'express'
import { z } from 'zod'
import { pelaku } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import * as svc from '../services/program.service.js'
import { created, ok } from '../utils/response.js'

export const programRouter = Router()

const ip = (req: { ip?: string | undefined }): string | null => req.ip ?? null
const idParam = (v: unknown): number => {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw new AppError(400, 'ID tidak valid')
  return n
}
const idOpsional = z.coerce.number().int().positive().optional()

programRouter.get('/', async (req, res) => {
  const f = z
    .object({ tahunId: idOpsional, unitId: idOpsional, status: z.enum(['DRAFT', 'DIAJUKAN']).optional() })
    .parse(req.query)
  ok(res, await svc.daftarProgram(pelaku(req), f))
})

programRouter.get('/:id', async (req, res) => {
  ok(res, await svc.detailProgram(pelaku(req), idParam(req.params['id'])))
})

programRouter.post('/', async (req, res) => {
  const { unitId, tahunId, ...isi } = req.body ?? {}
  const meta = z.object({ unitId: idOpsional, tahunId: idOpsional }).parse({ unitId, tahunId })
  created(res, await svc.buatProgram(pelaku(req), meta.unitId, meta.tahunId, isi, ip(req)))
})

programRouter.put('/:id', async (req, res) => {
  const { unitId: _u, tahunId: _t, ...isi } = req.body ?? {} // unit dan tahun tidak dapat dipindah lewat simpan
  ok(res, await svc.simpanProgram(pelaku(req), idParam(req.params['id']), isi, ip(req)))
})

programRouter.post('/:id/ajukan', async (req, res) => {
  ok(res, await svc.ajukanProgram(pelaku(req), idParam(req.params['id']), ip(req)))
})

programRouter.post('/:id/tarik', async (req, res) => {
  ok(res, await svc.tarikProgram(pelaku(req), idParam(req.params['id']), ip(req)))
})

programRouter.delete('/:id', async (req, res) => {
  await svc.hapusProgram(pelaku(req), idParam(req.params['id']), ip(req))
  ok(res, { dihapus: true })
})
