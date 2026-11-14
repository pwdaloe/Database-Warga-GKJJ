import { Router } from 'express'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { RILIS, RILIS_TERBARU } from '../constants/rilis.js'
import { ok } from '../utils/response.js'

export const versiRouter = Router()

/** Folder state deploy (sama dengan aplikasi jemaat); `deploy/3-deploy-kegiatan.sh` menulis `kegiatan-version` di sini. */
function stateDir(): string {
  return process.env['DEPLOY_STATE_DIR'] ?? path.resolve(process.cwd(), '../../.deploy')
}

async function commitBerjalan(): Promise<string | null> {
  try {
    const t = (await readFile(path.join(stateDir(), 'kegiatan-version'), 'utf8')).trim()
    return /^[0-9a-f]{7,40}$/i.test(t) ? t : null
  } catch {
    return null
  }
}

/** Penanda lebih tua dari ini dianggap basi (deploy mati mendadak) dan diabaikan. */
const PEMELIHARAAN_MAKS_UMUR_MS = (): number => Number(process.env['MAINTENANCE_MAX_AGE_MS'] ?? 30 * 60 * 1000)

/** `kegiatan-maintenance` ada selama deploy berlangsung (ditulis/dihapus oleh deploy/3-deploy-kegiatan.sh). */
async function pemeliharaan(): Promise<{ aktif: boolean; pesan: string | null }> {
  try {
    const berkas = path.join(stateDir(), 'kegiatan-maintenance')
    const [info, isi] = await Promise.all([stat(berkas), readFile(berkas, 'utf8')])
    if (Date.now() - info.mtimeMs > PEMELIHARAAN_MAKS_UMUR_MS()) return { aktif: false, pesan: null }
    return { aktif: true, pesan: isi.trim().slice(0, 200) || null }
  } catch {
    return { aktif: false, pesan: null }
  }
}

/** Publik: versi yang berjalan, commit (bila ada), dan seluruh catatan rilis. */
versiRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-store')
  ok(res, { versi: RILIS_TERBARU.versi, tanggal: RILIS_TERBARU.tanggal, commit: await commitBerjalan(), pemeliharaan: await pemeliharaan(), rilis: RILIS })
})
