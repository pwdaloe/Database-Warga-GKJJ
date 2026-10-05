import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    warga: { findMany: vi.fn(), count: vi.fn() },
    keluarga: { count: vi.fn() },
    kelompok: { findUnique: vi.fn() },
    komisiConfig: { findMany: vi.fn() },
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { default: app } = await import('../../src/app.js')
const findMany = prisma.warga.findMany as ReturnType<typeof vi.fn>

const token = (role: string, kelompokId: number | null = null) =>
  jwt.sign({ userId: 1, role, kelompokId }, process.env.JWT_SECRET!)

beforeAll(() => { process.env.JWT_SECRET = 'test-jwt-secret' })
beforeEach(() => {
  vi.clearAllMocks()
  findMany.mockResolvedValue([{ id: 1, namaLengkap: 'A', latitude: -6.2, longitude: 106.8 }])
})

describe('GET /api/dashboard/map', () => {
  it('VIEWER tidak menerima koordinat (kebijakan redaksi) dan tidak query DB', async () => {
    const res = await request(app).get('/api/dashboard/map').set('Authorization', `Bearer ${token('VIEWER')}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(findMany).not.toHaveBeenCalled()
  })

  it.each(['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'])('%s menerima titik peta', async (role) => {
    const res = await request(app).get('/api/dashboard/map').set('Authorization', `Bearer ${token(role)}`)
    expect(res.body.data).toHaveLength(1)
    expect(findMany.mock.calls[0][0].where.keluarga).toBeUndefined()
  })

  it('penatua hanya mendapat titik di kelompoknya', async () => {
    await request(app).get('/api/dashboard/map').set('Authorization', `Bearer ${token('PENATUA_KELOMPOK', 3)}`)
    expect(findMany.mock.calls[0][0].where.keluarga).toEqual({ kelompokId: 3 })
  })

  it('penatua tanpa kelompok tidak mendapat titik apa pun (fail-closed)', async () => {
    await request(app).get('/api/dashboard/map').set('Authorization', `Bearer ${token('PENATUA_KELOMPOK', null)}`)
    expect(findMany.mock.calls[0][0].where.id).toBe(-1)
  })
})
