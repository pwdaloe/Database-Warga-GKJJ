import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { Prisma, UserRole } from '../../src/generated/prisma/client.js'

const prisma: any = {
  kelompok: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

const tok = (role: UserRole) => jwt.sign({ userId: 1, role, kelompokId: null }, process.env.JWT_SECRET!)
let admin: string, kepala: string, majelis: string, staf: string, viewer: string, penatua: string

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  admin = tok(UserRole.SUPERADMIN)
  kepala = tok(UserRole.KEPALA_KANTOR)
  majelis = tok(UserRole.MAJELIS)
  staf = tok(UserRole.STAF_ADMIN)
  viewer = tok(UserRole.VIEWER)
  penatua = tok(UserRole.PENATUA_KELOMPOK)
})
beforeEach(() => { vi.clearAllMocks() })

const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
const body = { wilayahId: 1, kode: 'A1', nama: 'Cempaka Baru' }

describe('Kelompok — otorisasi tulis (hanya SUPERADMIN & KEPALA_KANTOR)', () => {
  const tulis: [string, string, object?][] = [
    ['post', '/api/kelompok', body],
    ['put', '/api/kelompok/1', body],
    ['patch', '/api/kelompok/1/toggle'],
  ]
  for (const [method, path, payload] of tulis) {
    for (const [nama, t] of [['MAJELIS', () => majelis], ['STAF_ADMIN', () => staf], ['VIEWER', () => viewer], ['PENATUA_KELOMPOK', () => penatua]] as const) {
      it(`${method.toUpperCase()} ${path} oleh ${nama} → 403 dan tidak menyentuh DB`, async () => {
        const res = await (request(app) as any)[method](path).set(auth(t())).send(payload)
        expect(res.status).toBe(403)
        expect(prisma.kelompok.create).not.toHaveBeenCalled()
        expect(prisma.kelompok.update).not.toHaveBeenCalled()
      })
    }
  }

  it('tanpa token → 401', async () => {
    expect((await request(app).get('/api/kelompok')).status).toBe(401)
  })
})

describe('GET /api/kelompok', () => {
  it('hanya kelompok aktif, dengan relasi wilayah', async () => {
    prisma.kelompok.findMany.mockResolvedValue([])
    const res = await request(app).get('/api/kelompok').set(auth(viewer))
    expect(res.status).toBe(200)
    const arg = prisma.kelompok.findMany.mock.calls[0]![0]
    expect(arg.where).toEqual({ aktif: true })
    expect(arg.include).toEqual({ wilayah: true })
  })

  it('?wilayahId= menyaring per wilayah', async () => {
    prisma.kelompok.findMany.mockResolvedValue([])
    await request(app).get('/api/kelompok?wilayahId=3').set(auth(penatua))
    expect(prisma.kelompok.findMany.mock.calls[0]![0].where).toEqual({ aktif: true, wilayahId: 3 })
  })
})

describe('POST /api/kelompok', () => {
  const kasusTidakValid: [string, object][] = [
    ['wilayahId bukan bilangan bulat positif', { ...body, wilayahId: 0 }],
    ['wilayahId berupa teks', { ...body, wilayahId: '1' }],
    ['kode lebih dari 5 karakter', { ...body, kode: 'ABCDEF' }],
    ['kode kosong', { ...body, kode: '' }],
    ['nama kosong', { ...body, nama: '' }],
    ['nama lebih dari 100 karakter', { ...body, nama: 'x'.repeat(101) }],
  ]
  it.each(kasusTidakValid)('%s → 400', async (_n, payload) => {
    const res = await request(app).post('/api/kelompok').set(auth(admin)).send(payload)
    expect(res.status).toBe(400)
    expect(prisma.kelompok.create).not.toHaveBeenCalled()
  })

  it('sukses → 201 dan data diteruskan ke DB', async () => {
    prisma.kelompok.create.mockResolvedValue({ id: 9, ...body })
    const res = await request(app).post('/api/kelompok').set(auth(kepala)).send({ ...body, penatua_nama_temp: 'Pak Budi' })
    expect(res.status).toBe(201)
    expect(prisma.kelompok.create).toHaveBeenCalledWith({ data: { ...body, penatua_nama_temp: 'Pak Budi' } })
  })

  it('wilayah tidak ada (P2003) → 400', async () => {
    prisma.kelompok.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('x', { code: 'P2003', clientVersion: 'test' }))
    const res = await request(app).post('/api/kelompok').set(auth(admin)).send(body)
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/kelompok/:id', () => {
  it('memperbarui kelompok yang dimaksud', async () => {
    prisma.kelompok.update.mockResolvedValue({ id: 4 })
    const res = await request(app).put('/api/kelompok/4').set(auth(admin)).send(body)
    expect(res.status).toBe(200)
    expect(prisma.kelompok.update).toHaveBeenCalledWith({ where: { id: 4 }, data: body })
  })

  it('body tidak valid → 400, DB tidak disentuh', async () => {
    const res = await request(app).put('/api/kelompok/4').set(auth(admin)).send({ ...body, kode: '' })
    expect(res.status).toBe(400)
    expect(prisma.kelompok.update).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/kelompok/:id/toggle', () => {
  it('aktif → nonaktif', async () => {
    prisma.kelompok.findUniqueOrThrow.mockResolvedValue({ id: 1, aktif: true })
    prisma.kelompok.update.mockResolvedValue({})
    await request(app).patch('/api/kelompok/1/toggle').set(auth(admin))
    expect(prisma.kelompok.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { aktif: false } })
  })

  it('nonaktif → aktif', async () => {
    prisma.kelompok.findUniqueOrThrow.mockResolvedValue({ id: 1, aktif: false })
    prisma.kelompok.update.mockResolvedValue({})
    await request(app).patch('/api/kelompok/1/toggle').set(auth(kepala))
    expect(prisma.kelompok.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { aktif: true } })
  })

  it('id tidak ada → 404', async () => {
    prisma.kelompok.findUniqueOrThrow.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('x', { code: 'P2025', clientVersion: 'test' }))
    expect((await request(app).patch('/api/kelompok/99/toggle').set(auth(admin))).status).toBe(404)
  })
})
