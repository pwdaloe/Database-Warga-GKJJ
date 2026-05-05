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

const app = express()

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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth',      authRouter)
app.use('/api/wilayah',   wilayahRouter)
app.use('/api/kelompok',  kelompokRouter)
app.use('/api/keluarga',  keluargaRouter)
app.use('/api/warga',     wargaRouter)
app.use('/api/import',    importRouter)
app.use('/api/dashboard', dashboardRouter)

// Error handling (harus paling terakhir)
app.use(notFound)
app.use(errorHandler)

export default app
