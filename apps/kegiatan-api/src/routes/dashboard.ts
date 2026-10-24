import { Router } from 'express'
import { z } from 'zod'
import { pelaku } from '../middleware/auth.js'
import { dashboardPagu } from '../services/dashboard.service.js'
import { ok } from '../utils/response.js'

export const dashboardRouter = Router()

dashboardRouter.get('/pagu', async (req, res) => {
  const { tahunId } = z.object({ tahunId: z.coerce.number().int().positive().optional() }).parse(req.query)
  ok(res, await dashboardPagu(pelaku(req), tahunId))
})
