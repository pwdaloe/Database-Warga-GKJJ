import { Router } from 'express'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { rateLimit } from 'express-rate-limit'
import { ok } from '../utils/response.js'

/**
 * Status sistem untuk banner "pembaruan sedang berlangsung / versi baru tersedia".
 * Publik (tanpa login) dan murni membaca file di folder state deploy — tidak menyentuh database,
 * sehingga tetap menjawab saat deploy sedang mengubah skema.
 *
 * File (ditulis oleh deploy/2-deploy.sh):
 *   <state>/maintenance  — ada selama deploy berlangsung (isi = pesan opsional)
 *   <state>/version      — git SHA pendek versi yang sedang berjalan
 */
export const systemRouter = Router()

/** Flag yang lebih tua dari ini dianggap basi (deploy mati mendadak) dan diabaikan */
const MAINTENANCE_MAX_AGE_MS = Number(process.env.MAINTENANCE_MAX_AGE_MS ?? 30 * 60 * 1000)

function stateDir(): string {
  return process.env.DEPLOY_STATE_DIR ?? path.resolve(process.cwd(), '../../.deploy')
}

async function readText(file: string): Promise<string | null> {
  try {
    return (await readFile(path.join(stateDir(), file), 'utf8')).trim()
  } catch {
    return null
  }
}

async function maintenanceFlag(): Promise<{ active: boolean; message: string | null }> {
  try {
    const file = path.join(stateDir(), 'maintenance')
    const [info, content] = await Promise.all([stat(file), readFile(file, 'utf8')])
    if (Date.now() - info.mtimeMs > MAINTENANCE_MAX_AGE_MS) return { active: false, message: null }
    return { active: true, message: content.trim() || null }
  } catch {
    return { active: false, message: null }
  }
}

// Limiter sendiri: banyak pengguna berbagi satu IP (jaringan gereja) dan polling tidak boleh
// menghabiskan jatah limiter global (200/15 menit) yang dipakai login.
systemRouter.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }))

// GET /api/system/status
systemRouter.get('/status', async (_req, res) => {
  const [flag, version] = await Promise.all([maintenanceFlag(), readText('version')])
  res.set('Cache-Control', 'no-store')
  ok(res, {
    maintenance: flag.active,
    message: flag.message,
    version: version || null,
  })
})
