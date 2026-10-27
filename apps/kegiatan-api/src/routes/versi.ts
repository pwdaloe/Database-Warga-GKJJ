import { Router } from 'express'
import { readFile } from 'node:fs/promises'
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

/** Publik: versi yang berjalan, commit (bila ada), dan seluruh catatan rilis. */
versiRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-store')
  ok(res, { versi: RILIS_TERBARU.versi, tanggal: RILIS_TERBARU.tanggal, commit: await commitBerjalan(), rilis: RILIS })
})
