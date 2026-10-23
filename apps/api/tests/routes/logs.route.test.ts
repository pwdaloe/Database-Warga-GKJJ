import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const prisma: any = {
  activityLog: { count: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

const tok = (role: string) => jwt.sign({ userId: 1, role, kelompokId: null }, process.env.JWT_SECRET!)
const auth = (role: string) => ({ Authorization: `Bearer ${tok(role)}` })

beforeAll(() => { process.env.JWT_SECRET = 'test-jwt-secret' })
beforeEach(() => {
  vi.clearAllMocks()
  prisma.activityLog.create.mockResolvedValue({})
  prisma.activityLog.count.mockResolvedValue(0)
  prisma.activityLog.findMany.mockResolvedValue([])
  prisma.activityLog.deleteMany.mockResolvedValue({ count: 0 })
})

// activityLogger ikut menulis log untuk request ini; yang diuji adalah panggilan dari route
const panggilanBaca = () => prisma.activityLog.findMany.mock.calls.at(-1)![0]

describe('Log aktivitas — hanya SUPERADMIN & KEPALA_KANTOR', () => {
  it.each(['MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER'])('%s tidak boleh membaca → 403', async (role) => {
    const res = await request(app).get('/api/logs').set(auth(role))
    expect(res.status).toBe(403)
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled()
  })

  it.each(['MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER'])('%s tidak boleh menghapus → 403', async (role) => {
    const res = await request(app).delete('/api/logs').set(auth(role))
    expect(res.status).toBe(403)
    expect(prisma.activityLog.deleteMany).not.toHaveBeenCalled()
  })

  it('tanpa token → 401', async () => {
    expect((await request(app).get('/api/logs')).status).toBe(401)
  })
})

describe('GET /api/logs', () => {
  it('default: semua status, halaman 1, 50 per halaman, terbaru dulu', async () => {
    await request(app).get('/api/logs').set(auth('SUPERADMIN'))
    const arg = panggilanBaca()
    expect(arg.where).toEqual({})
    expect(arg.skip).toBe(0)
    expect(arg.take).toBe(50)
    expect(arg.orderBy).toEqual({ createdAt: 'desc' })
  })

  it('status=error → statusCode >= 400; status=success → < 400', async () => {
    await request(app).get('/api/logs?status=error').set(auth('KEPALA_KANTOR'))
    expect(panggilanBaca().where).toEqual({ statusCode: { gte: 400 } })
    await request(app).get('/api/logs?status=success').set(auth('KEPALA_KANTOR'))
    expect(panggilanBaca().where).toEqual({ statusCode: { lt: 400 } })
  })

  it('filter userId dan path (pencarian tidak peka huruf besar)', async () => {
    await request(app).get('/api/logs?userId=7&path=warga').set(auth('SUPERADMIN'))
    expect(panggilanBaca().where).toEqual({ userId: 7, path: { contains: 'warga', mode: 'insensitive' } })
  })

  it('paginasi: halaman 3 dengan 20 per halaman → skip 40', async () => {
    await request(app).get('/api/logs?page=3&limit=20').set(auth('SUPERADMIN'))
    const arg = panggilanBaca()
    expect(arg.skip).toBe(40)
    expect(arg.take).toBe(20)
  })

  it.each([['status=aneh'], ['limit=5'], ['limit=500'], ['page=0'], ['userId=abc']])('query tidak valid (%s) → 400', async (qs) => {
    const res = await request(app).get(`/api/logs?${qs}`).set(auth('SUPERADMIN'))
    expect(res.status).toBe(400)
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled()
  })

  it('id BigInt diserialisasi sebagai string dan meta total dihitung', async () => {
    prisma.activityLog.count.mockResolvedValue(120)
    prisma.activityLog.findMany.mockResolvedValue([{ id: 9007199254740993n, userId: 1, method: 'GET', path: '/api/x', statusCode: 200 }])
    const res = await request(app).get('/api/logs?limit=50').set(auth('SUPERADMIN'))
    expect(res.status).toBe(200)
    expect(res.body.data.data[0].id).toBe('9007199254740993')
    expect(res.body.data.meta).toEqual({ total: 120, page: 1, limit: 50, totalPages: 3 })
  })
})

describe('DELETE /api/logs', () => {
  it('default 90 hari: hanya log yang lebih tua dari batas yang dihapus', async () => {
    prisma.activityLog.deleteMany.mockResolvedValue({ count: 12 })
    const sebelum = Date.now()
    const res = await request(app).delete('/api/logs').set(auth('SUPERADMIN'))
    expect(res.status).toBe(200)
    expect(res.body.data.message).toMatch(/12 log dihapus.*90 hari/)
    const batas: Date = prisma.activityLog.deleteMany.mock.calls[0]![0].where.createdAt.lt
    const selisihHari = (sebelum - batas.getTime()) / 86_400_000
    expect(selisihHari).toBeGreaterThan(89.99)
    expect(selisihHari).toBeLessThan(90.1)
  })

  it('?days=30 memakai batas 30 hari', async () => {
    const sebelum = Date.now()
    await request(app).delete('/api/logs?days=30').set(auth('KEPALA_KANTOR'))
    const batas: Date = prisma.activityLog.deleteMany.mock.calls[0]![0].where.createdAt.lt
    expect((sebelum - batas.getTime()) / 86_400_000).toBeGreaterThan(29.99)
    expect((sebelum - batas.getTime()) / 86_400_000).toBeLessThan(30.1)
  })

  // Hapus massal tidak boleh bisa dipicu oleh nilai konyol: days=0 atau negatif menghapus SEMUA log,
  // days=abc menghasilkan tanggal tidak valid.
  it.each([['0'], ['-5'], ['abc'], ['1.5'], ['0.0001']])('days=%s ditolak → 400 dan tidak ada yang dihapus', async (days) => {
    const res = await request(app).delete(`/api/logs?days=${days}`).set(auth('SUPERADMIN'))
    expect(res.status).toBe(400)
    expect(prisma.activityLog.deleteMany).not.toHaveBeenCalled()
  })
})
