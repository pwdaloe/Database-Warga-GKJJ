import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    warga: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
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

describe('GET /api/dashboard/demografi', () => {
  const groupBy = prisma.warga.groupBy as ReturnType<typeof vi.fn>
  const get = (role = 'SUPERADMIN', kelompokId: number | null = null, qs = '') =>
    request(app).get(`/api/dashboard/demografi${qs}`).set('Authorization', `Bearer ${token(role, kelompokId)}`)

  beforeEach(() => {
    groupBy.mockResolvedValue([
      { jenisKelamin: 'L', _count: { _all: 45 } },
      { jenisKelamin: 'P', _count: { _all: 55 } },
    ])
  })

  it('mengembalikan jumlah dan persen Pria/Wanita', async () => {
    const res = await get()
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ total: 100, pria: 45, wanita: 55, persenPria: 45, persenWanita: 55 })
  })

  it('hanya menghitung status keanggotaan AKTIF', async () => {
    await get()
    expect(JSON.stringify(groupBy.mock.calls[0][0].where)).toContain('"statusKeanggotaan":"AKTIF"')
  })

  it('jenis kelamin yang tidak ada → 0, dan total kosong tidak membagi nol', async () => {
    groupBy.mockResolvedValue([])
    const res = await get()
    expect(res.body.data).toEqual({ total: 0, pria: 0, wanita: 0, persenPria: 0, persenWanita: 0 })
  })

  it('persen dibulatkan 1 desimal', async () => {
    groupBy.mockResolvedValue([{ jenisKelamin: 'L', _count: { _all: 1 } }, { jenisKelamin: 'P', _count: { _all: 2 } }])
    const res = await get()
    expect(res.body.data).toMatchObject({ persenPria: 33.3, persenWanita: 66.7 })
  })

  it('penatua dibatasi kelompoknya; tanpa kelompok fail-closed', async () => {
    await get('PENATUA_KELOMPOK', 3)
    expect(JSON.stringify(groupBy.mock.calls[0][0].where)).toContain('"kelompokId":3')
    await get('PENATUA_KELOMPOK', null)
    expect(JSON.stringify(groupBy.mock.calls[1][0].where)).toContain('"id":-1')
  })

  it('filter wilayah/kelompok dari query diteruskan', async () => {
    await get('SUPERADMIN', null, '?wilayahId=2')
    expect(JSON.stringify(groupBy.mock.calls[0][0].where)).toContain('"wilayahId":2')
  })

  it('tanpa token ditolak', async () => {
    expect((await request(app).get('/api/dashboard/demografi')).status).toBe(401)
  })
})
