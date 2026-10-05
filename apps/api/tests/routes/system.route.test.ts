import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import request from 'supertest'
import { mkdtempSync, writeFileSync, rmSync, utimesSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

vi.mock('../../src/utils/prisma.js', () => ({ prisma: {} }))

const { default: app } = await import('../../src/app.js')

let dir: string
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  dir = mkdtempSync(path.join(tmpdir(), 'gkjj-deploy-'))
  process.env.DEPLOY_STATE_DIR = dir
})
afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
  delete process.env.DEPLOY_STATE_DIR
})
beforeEach(() => {
  for (const f of ['maintenance', 'version']) rmSync(path.join(dir, f), { force: true })
})

const get = () => request(app).get('/api/system/status')

describe('GET /api/system/status', () => {
  it('publik: tanpa token tetap 200', async () => {
    const res = await get()
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('tanpa file apa pun → tidak maintenance, versi null (fitur belum pernah dideploy)', async () => {
    const res = await get()
    expect(res.body.data).toEqual({ maintenance: false, message: null, version: null })
  })

  it('file versi → versi dikembalikan (spasi/newline dibuang)', async () => {
    writeFileSync(path.join(dir, 'version'), 'a1b2c3d\n')
    expect((await get()).body.data.version).toBe('a1b2c3d')
  })

  it('flag maintenance ada → maintenance true, pesan dari isi file', async () => {
    writeFileSync(path.join(dir, 'maintenance'), 'Deploy a1b2c3d\n')
    const { data } = (await get()).body
    expect(data.maintenance).toBe(true)
    expect(data.message).toBe('Deploy a1b2c3d')
  })

  it('flag maintenance kosong tetap dianggap aktif (pesan null)', async () => {
    writeFileSync(path.join(dir, 'maintenance'), '')
    const { data } = (await get()).body
    expect(data.maintenance).toBe(true)
    expect(data.message).toBeNull()
  })

  it('flag basi (> 30 menit, deploy mati mendadak) diabaikan', async () => {
    const f = path.join(dir, 'maintenance')
    writeFileSync(f, 'basi')
    const lama = new Date(Date.now() - 31 * 60 * 1000)
    utimesSync(f, lama, lama)
    expect(existsSync(f)).toBe(true)
    expect((await get()).body.data.maintenance).toBe(false)
  })

  it('tidak di-cache (selalu fresh)', async () => {
    expect((await get()).headers['cache-control']).toBe('no-store')
  })

  it('folder state tidak ada → tidak error', async () => {
    process.env.DEPLOY_STATE_DIR = path.join(dir, 'tidak-ada')
    const res = await get()
    process.env.DEPLOY_STATE_DIR = dir
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ maintenance: false, message: null, version: null })
  })

  it('polling banyak tidak menghabiskan limiter global (login satu jaringan tidak ikut terblokir)', async () => {
    // limiter global = 200/15 menit per IP. 210 panggilan status harus tidak dihitung di sana:
    // endpoint ini punya limiter sendiri (120/menit) dan dipasang SEBELUM limiter global.
    let diblokirLimiterSendiri = 0
    for (let i = 0; i < 210; i++) {
      const r = await get()
      if (r.status === 429) diblokirLimiterSendiri++
    }
    expect(diblokirLimiterSendiri).toBeGreaterThan(0)          // limiter sendiri bekerja
    expect((await request(app).get('/health')).status).toBe(200)  // limiter global belum tersentuh
  })
})
