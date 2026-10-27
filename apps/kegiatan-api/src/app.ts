import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { authenticate, blokirBilaWajibGanti } from './middleware/auth.js'
import { authRouter } from './routes/auth.js'
import { masterRouter } from './routes/master.js'
import { penggunaRouter } from './routes/pengguna.js'
import { programRouter } from './routes/program.js'
import { dashboardRouter } from './routes/dashboard.js'
import { versiRouter } from './routes/versi.js'

const app = express()

// Percayai 1 hop proxy (Nginx) agar batas laju membaca IP asli dari X-Forwarded-For.
app.set('trust proxy', 1)

app.use(helmet())
app.use(compression())
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3200', credentials: true }))
// Jaringan gereja membuat banyak pengguna berbagi satu IP: batas global dibuat longgar (±5 permintaan per muat halaman).
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 3000, standardHeaders: true, legacyHeaders: false }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/versi', versiRouter) // publik: dipakai halaman login dan footer

// Semua route di bawah memerlukan login; akun ber-password sementara hanya boleh mengganti password.
app.use('/api', authenticate, blokirBilaWajibGanti)
app.use('/api/master', masterRouter)
app.use('/api/pengguna', penggunaRouter)
app.use('/api/program', programRouter)
app.use('/api/dashboard', dashboardRouter)

app.use(notFound)
app.use(errorHandler)

export default app
