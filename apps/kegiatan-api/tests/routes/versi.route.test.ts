import 'express-async-errors'
import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { mkdtempSync, writeFileSync, rmSync, utimesSync } from 'node:fs'
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

describe('GET /api/versi: penanda pemeliharaan (deploy sedang berlangsung)', () => {
  const siapkan = (isi?: string, umurMs = 0) => {
    dir = mkdtempSync(path.join(tmpdir(), 'versi-'))
    process.env['DEPLOY_STATE_DIR'] = dir
    if (isi !== undefined) {
      const berkas = path.join(dir, 'kegiatan-maintenance')
      writeFileSync(berkas, isi)
      const t = new Date(Date.now() - umurMs)
      utimesSync(berkas, t, t)
    }
  }

  it('tanpa penanda → tidak sedang pemeliharaan', async () => {
    siapkan()
    expect((await request(app).get('/api/versi')).body.data.pemeliharaan).toEqual({ aktif: false, pesan: null })
  })

  it('penanda ada → aktif, dengan pesan dari isi berkas', async () => {
    siapkan('Deploy dimulai 2026-10-28 10:00:00\n')
    expect((await request(app).get('/api/versi')).body.data.pemeliharaan).toEqual({ aktif: true, pesan: 'Deploy dimulai 2026-10-28 10:00:00' })
  })

  it('penanda basi (deploy mati mendadak, >30 menit) diabaikan', async () => {
    siapkan('Deploy dimulai', 31 * 60 * 1000)
    expect((await request(app).get('/api/versi')).body.data.pemeliharaan.aktif).toBe(false)
  })

  it('penanda 29 menit masih dianggap berlangsung', async () => {
    siapkan('Deploy dimulai', 29 * 60 * 1000)
    expect((await request(app).get('/api/versi')).body.data.pemeliharaan.aktif).toBe(true)
  })

  it('pesan dipotong 200 karakter', async () => {
    siapkan('x'.repeat(500))
    expect((await request(app).get('/api/versi')).body.data.pemeliharaan.pesan).toHaveLength(200)
  })
})

