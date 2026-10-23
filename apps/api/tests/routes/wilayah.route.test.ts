import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { Prisma, UserRole } from '../../src/generated/prisma/client.js'

const prisma: any = {
  wilayah: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  kelompok: { findMany: vi.fn(), deleteMany: vi.fn() },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

const tok = (role: UserRole) => jwt.sign({ userId: 1, role, kelompokId: null }, process.env.JWT_SECRET!)
let admin: string, kepala: string, staf: string, viewer: string, penatua: string

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  admin = tok(UserRole.SUPERADMIN)
  kepala = tok(UserRole.KEPALA_KANTOR)
  staf = tok(UserRole.STAF_ADMIN)
  viewer = tok(UserRole.VIEWER)
  penatua = tok(UserRole.PENATUA_KELOMPOK)
})
beforeEach(() => { vi.clearAllMocks() })

const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
const tidakDitemukan = () => new Prisma.PrismaClientKnownRequestError('x', { code: 'P2025', clientVersion: 'test' })

describe('Wilayah — otorisasi tulis (hanya SUPERADMIN & KEPALA_KANTOR)', () => {
  const tulis: [string, string, object?][] = [
    ['post', '/api/wilayah', { kode: 'A', nama: 'Rawamangun A' }],
    ['put', '/api/wilayah/1', { kode: 'A', nama: 'Rawamangun A' }],
    ['delete', '/api/wilayah/1'],
    ['patch', '/api/wilayah/1/toggle'],
  ]
  for (const [method, path, body] of tulis) {
    for (const [nama, token] of [['STAF_ADMIN', () => staf], ['VIEWER', () => viewer], ['PENATUA_KELOMPOK', () => penatua]] as const) {
      it(`${method.toUpperCase()} ${path} oleh ${nama} → 403 dan tidak menyentuh DB`, async () => {
        const res = await (request(app) as any)[method](path).set(auth(token())).send(body)
        expect(res.status).toBe(403)
        expect(prisma.wilayah.create).not.toHaveBeenCalled()
        expect(prisma.wilayah.update).not.toHaveBeenCalled()
        expect(prisma.wilayah.delete).not.toHaveBeenCalled()
        expect(prisma.kelompok.deleteMany).not.toHaveBeenCalled()
      })
    }
  }

  it('tanpa token → 401', async () => {
    const res = await request(app).post('/api/wilayah').send({ kode: 'A', nama: 'X' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/wilayah', () => {
  it('default hanya wilayah & kelompok aktif', async () => {
    prisma.wilayah.findMany.mockResolvedValue([])
    const res = await request(app).get('/api/wilayah').set(auth(viewer))
    expect(res.status).toBe(200)
    const arg = prisma.wilayah.findMany.mock.calls[0]![0]
    expect(arg.where).toEqual({ aktif: true })
    expect(arg.include.kelompoks.where).toEqual({ aktif: true })
  })

  it('?all=true menyertakan yang nonaktif (tanpa filter aktif)', async () => {
    prisma.wilayah.findMany.mockResolvedValue([])
    await request(app).get('/api/wilayah?all=true').set(auth(admin))
    const arg = prisma.wilayah.findMany.mock.calls[0]![0]
    expect(arg.where).toBeUndefined()
    expect(arg.include.kelompoks.where).toBeUndefined()
  })
})

describe('POST /api/wilayah', () => {
  it('kode lebih dari 5 karakter → 400', async () => {
    const res = await request(app).post('/api/wilayah').set(auth(admin)).send({ kode: 'ABCDEF', nama: 'X' })
    expect(res.status).toBe(400)
    expect(prisma.wilayah.create).not.toHaveBeenCalled()
  })

  it('nama kosong → 400', async () => {
    const res = await request(app).post('/api/wilayah').set(auth(admin)).send({ kode: 'A', nama: '' })
    expect(res.status).toBe(400)
  })

  it('sukses → 201 dan data tersimpan apa adanya', async () => {
    prisma.wilayah.create.mockResolvedValue({ id: 5, kode: 'D', nama: 'Rawamangun D' })
    const res = await request(app).post('/api/wilayah').set(auth(kepala)).send({ kode: 'D', nama: 'Rawamangun D', keterangan: 'baru' })
    expect(res.status).toBe(201)
    expect(prisma.wilayah.create).toHaveBeenCalledWith({ data: { kode: 'D', nama: 'Rawamangun D', keterangan: 'baru' } })
  })

  it('kode duplikat (P2002) → 409', async () => {
    prisma.wilayah.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('x', { code: 'P2002', clientVersion: 'test', meta: { target: ['kode'] } }))
    const res = await request(app).post('/api/wilayah').set(auth(admin)).send({ kode: 'A', nama: 'X' })
    expect(res.status).toBe(409)
  })
})

describe('PUT /api/wilayah/:id', () => {
  it('memperbarui wilayah yang dimaksud', async () => {
    prisma.wilayah.update.mockResolvedValue({ id: 2 })
    const res = await request(app).put('/api/wilayah/2').set(auth(admin)).send({ kode: 'B', nama: 'Rawamangun B' })
    expect(res.status).toBe(200)
    expect(prisma.wilayah.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { kode: 'B', nama: 'Rawamangun B', keterangan: undefined } })
  })

  it('id tidak ada → 404', async () => {
    prisma.wilayah.update.mockRejectedValue(tidakDitemukan())
    const res = await request(app).put('/api/wilayah/99').set(auth(admin)).send({ kode: 'B', nama: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/wilayah/:id', () => {
  it('wilayah masih punya KK → 400 dengan pesan jumlah KK, tidak ada yang dihapus', async () => {
    prisma.kelompok.findMany.mockResolvedValue([{ _count: { keluargas: 2 } }, { _count: { keluargas: 3 } }])
    const res = await request(app).delete('/api/wilayah/1').set(auth(admin))
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/5 keluarga/)
    expect(prisma.kelompok.deleteMany).not.toHaveBeenCalled()
    expect(prisma.wilayah.delete).not.toHaveBeenCalled()
  })

  it('tanpa KK → kelompok dihapus dulu, lalu wilayah', async () => {
    prisma.kelompok.findMany.mockResolvedValue([{ _count: { keluargas: 0 } }])
    const urutan: string[] = []
    prisma.kelompok.deleteMany.mockImplementation(async () => { urutan.push('kelompok') })
    prisma.wilayah.delete.mockImplementation(async () => { urutan.push('wilayah') })
    const res = await request(app).delete('/api/wilayah/1').set(auth(admin))
    expect(res.status).toBe(200)
    expect(urutan).toEqual(['kelompok', 'wilayah'])
    expect(prisma.kelompok.deleteMany).toHaveBeenCalledWith({ where: { wilayahId: 1 } })
  })
})

describe('PATCH /api/wilayah/:id/toggle', () => {
  it('aktif → nonaktif', async () => {
    prisma.wilayah.findUniqueOrThrow.mockResolvedValue({ id: 1, aktif: true })
    prisma.wilayah.update.mockResolvedValue({ id: 1, aktif: false })
    await request(app).patch('/api/wilayah/1/toggle').set(auth(admin))
    expect(prisma.wilayah.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { aktif: false } })
  })

  it('nonaktif → aktif', async () => {
    prisma.wilayah.findUniqueOrThrow.mockResolvedValue({ id: 1, aktif: false })
    prisma.wilayah.update.mockResolvedValue({ id: 1, aktif: true })
    await request(app).patch('/api/wilayah/1/toggle').set(auth(kepala))
    expect(prisma.wilayah.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { aktif: true } })
  })

  it('id tidak ada → 404', async () => {
    prisma.wilayah.findUniqueOrThrow.mockRejectedValue(tidakDitemukan())
    const res = await request(app).patch('/api/wilayah/99/toggle').set(auth(admin))
    expect(res.status).toBe(404)
  })
})
