import 'express-async-errors'
import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buatPrisma } from '../helpers/harness.js'
import { RILIS_TERBARU } from '../../src/constants/rilis.js'

const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

let dir: string | null = null
afterEach(() => {
  delete process.env['DEPLOY_STATE_DIR']
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = null
})

describe('GET /api/versi (publik)', () => {
  it('dapat dibuka tanpa login dan memuat versi terbaru serta seluruh catatan rilis', async () => {
    process.env['DEPLOY_STATE_DIR'] = path.join(tmpdir(), 'tidak-ada-folder-ini')
    const res = await request(app).get('/api/versi')
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.body.data.versi).toBe(RILIS_TERBARU.versi)
    expect(res.body.data.tanggal).toBe(RILIS_TERBARU.tanggal)
    expect(res.body.data.commit).toBeNull()
    expect(res.body.data.rilis.length).toBeGreaterThanOrEqual(2)
    expect(res.body.data.rilis[0].perubahan.length).toBeGreaterThan(0)
  })

  it('commit dibaca dari berkas deploy bila ada dan berformat hash', async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'versi-'))
    process.env['DEPLOY_STATE_DIR'] = dir
    writeFileSync(path.join(dir, 'kegiatan-version'), 'ffc5bd5\n')
    expect((await request(app).get('/api/versi')).body.data.commit).toBe('ffc5bd5')
  })

  it('isi berkas yang bukan hash diabaikan (tidak membocorkan teks sembarang)', async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'versi-'))
    process.env['DEPLOY_STATE_DIR'] = dir
    writeFileSync(path.join(dir, 'kegiatan-version'), 'rahasia; rm -rf /')
    expect((await request(app).get('/api/versi')).body.data.commit).toBeNull()
  })

  it('tidak menyentuh database', async () => {
    await request(app).get('/api/versi')
    expect(prisma.pengguna.findUnique).not.toHaveBeenCalled()
  })
})
