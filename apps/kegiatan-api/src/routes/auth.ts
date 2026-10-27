import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { authenticate, pelaku } from '../middleware/auth.js'
import * as auth from '../services/auth.service.js'
import { ok } from '../utils/response.js'

export const authRouter = Router()

// Hanya login yang GAGAL dihitung: banyak pengurus berbagi satu IP (wifi gereja) dan login berhasil tidak boleh
// menghabiskan jatah. 20 kegagalan per 15 menit per IP tetap menahan tebakan password.
const batasLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.' },
})

const ip = (req: { ip?: string | undefined }): string | null => req.ip ?? null

authRouter.post('/login', batasLogin, async (req, res) => {
  const { username, password } = z.object({ username: z.string().trim().min(1).max(150), password: z.string().min(1).max(200) }).parse(req.body)
  ok(res, await auth.login(username, password, ip(req)))
})

authRouter.get('/me', authenticate, async (req, res) => {
  ok(res, await auth.profil(pelaku(req).id))
})

authRouter.post('/ganti-password', authenticate, async (req, res) => {
  const { passwordLama, passwordBaru } = z.object({ passwordLama: z.string().min(1).max(200), passwordBaru: z.string().min(1).max(200) }).parse(req.body)
  await auth.gantiPassword(pelaku(req).id, passwordLama, passwordBaru, ip(req))
  ok(res, { berhasil: true })
})
