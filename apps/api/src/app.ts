import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { authRouter } from './routes/auth.js'
import { wilayahRouter } from './routes/wilayah.js'
import { kelompokRouter } from './routes/kelompok.js'
import { keluargaRouter } from './routes/keluarga.js'
import { wargaRouter } from './routes/warga.js'
import { importRouter } from './routes/import.js'
import { dashboardRouter } from './routes/dashboard.js'
import { pengaturanRouter } from './routes/pengaturan.js'
import { usersRouter } from './routes/users.js'
import { publicRouter } from './routes/public.js'
import { logsRouter } from './routes/logs.js'
import { perpindahanRouter } from './routes/perpindahan.js'
import { activityLogger } from './middleware/activityLogger.js'

const app = express()

// Percayai 1 hop proxy (Nginx) — diperlukan agar express-rate-limit baca IP dari X-Forwarded-For
app.set('trust proxy', 1)

// Security & compression
app.use(helmet())
app.use(compression())

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  }),
)

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

// Body parsing & logging
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Activity logger — harus sebelum routes agar menangkap semua mutasi
app.use(activityLogger)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth',       authRouter)
app.use('/api/wilayah',    wilayahRouter)
app.use('/api/kelompok',   kelompokRouter)
app.use('/api/keluarga',   keluargaRouter)
app.use('/api/warga',      wargaRouter)
app.use('/api/import',     importRouter)
app.use('/api/dashboard',  dashboardRouter)
app.use('/api/pengaturan', pengaturanRouter)
app.use('/api/users',      usersRouter)
app.use('/api/public',     publicRouter)
app.use('/api/logs',       logsRouter)
app.use('/api/perpindahan', perpindahanRouter)

// Error handling (harus paling terakhir)
app.use(notFound)
app.use(errorHandler)

export default app
