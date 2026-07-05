import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
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

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

const forgotPasswordSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username atau email wajib diisi'),
})
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
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

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { usernameOrEmail } = forgotPasswordSchema.parse(req.body)
  const result = await authService.requestPasswordReset(usernameOrEmail)
  ok(res, result)
})

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res) => {
  const { token, passwordBaru } = resetPasswordSchema.parse(req.body)
  await authService.resetPassword(token, passwordBaru)
  ok(res, { message: 'Password berhasil direset, silakan login' })
})
