import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import * as authService from '../services/auth.service.js'
import { ok, created } from '../utils/response.js'

export const authRouter = Router()

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

const changePasswordSchema = z.object({
  passwordLama: z.string().min(1),
  passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
})

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { username, password } = loginSchema.parse(req.body)
  const result = await authService.login(username, password)
  created(res, result)
})

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req, res) => {
  const user = await authService.getMe(req.user!.userId)
  ok(res, user)
})

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, async (req, res) => {
  const { passwordLama, passwordBaru } = changePasswordSchema.parse(req.body)
  await authService.changePassword(req.user!.userId, passwordLama, passwordBaru)
  ok(res, { message: 'Password berhasil diubah' })
})

// POST /api/auth/logout  (stateless JWT — client cukup hapus token)
authRouter.post('/logout', authenticate, (_req, res) => {
  ok(res, { message: 'Logout berhasil' })
})
