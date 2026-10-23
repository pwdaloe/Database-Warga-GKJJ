import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { UserRole } from '../../src/generated/prisma/client.js'

vi.mock('../../src/services/keluarga.service.js', () => ({
  listKeluarga: vi.fn(),
  getKeluargaById: vi.fn(),
  createKeluarga: vi.fn(),
  updateKeluarga: vi.fn(),
  deleteKeluarga: vi.fn(),
  approveKeluarga: vi.fn(),
}))
vi.mock('../../src/utils/prisma.js', () => ({ prisma: { activityLog: { create: vi.fn().mockResolvedValue({}) } } }))

const svc = await import('../../src/services/keluarga.service.js')
const { default: app } = await import('../../src/app.js')
const m = (f: unknown) => f as ReturnType<typeof vi.fn>

const tok = (role: UserRole, userId = 1, kelompokId: number | null = null) =>
  jwt.sign({ userId, role, kelompokId }, process.env.JWT_SECRET!)
let admin: string, kepala: string, majelis: string, staf: string, penatua: string, viewer: string

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  admin = tok(UserRole.SUPERADMIN, 1)
  kepala = tok(UserRole.KEPALA_KANTOR, 2)
  majelis = tok(UserRole.MAJELIS, 3)
  staf = tok(UserRole.STAF_ADMIN, 4)
  penatua = tok(UserRole.PENATUA_KELOMPOK, 5, 7)
  viewer = tok(UserRole.VIEWER, 6)
})
beforeEach(() => { vi.clearAllMocks() })

const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
const sentuhTulis = () => [svc.createKeluarga, svc.updateKeluarga, svc.deleteKeluarga, svc.approveKeluarga]
  .some((f) => m(f).mock.calls.length > 0)

describe('Keluarga — matriks otorisasi', () => {
  const kasus: [string, string, string, () => string, number][] = [
    ['post', '/api/keluarga', 'VIEWER', () => viewer, 403],
    ['put', '/api/keluarga/1', 'VIEWER', () => viewer, 403],
    ['delete', '/api/keluarga/1', 'VIEWER', () => viewer, 403],
    ['post', '/api/keluarga/1/approve', 'VIEWER', () => viewer, 403],
    ['delete', '/api/keluarga/1', 'PENATUA_KELOMPOK', () => penatua, 403],
    ['delete', '/api/keluarga/1', 'STAF_ADMIN', () => staf, 403],
    ['delete', '/api/keluarga/1', 'MAJELIS', () => majelis, 403],
    ['post', '/api/keluarga/1/approve', 'PENATUA_KELOMPOK', () => penatua, 403],
    ['post', '/api/keluarga/1/approve', 'STAF_ADMIN', () => staf, 403],
    ['post', '/api/keluarga/1/approve', 'MAJELIS', () => majelis, 403],
  ]
  it.each(kasus)('%s %s oleh %s → %i dan service tidak dipanggil', async (method, path, _peran, token, status) => {
    const res = await (request(app) as any)[method](path).set(auth(token())).send({})
    expect(res.status).toBe(status)
    expect(sentuhTulis()).toBe(false)
  })

  it('tanpa token → 401', async () => {
    expect((await request(app).get('/api/keluarga')).status).toBe(401)
  })

  it('hapus dan approve hanya SUPERADMIN & KEPALA_KANTOR', async () => {
    m(svc.deleteKeluarga).mockResolvedValue(undefined)
    m(svc.approveKeluarga).mockResolvedValue({ id: 1 })
    expect((await request(app).delete('/api/keluarga/1').set(auth(admin))).status).toBe(200)
    expect((await request(app).delete('/api/keluarga/2').set(auth(kepala))).status).toBe(200)
    expect((await request(app).post('/api/keluarga/3/approve').set(auth(kepala))).status).toBe(200)
    expect(svc.deleteKeluarga).toHaveBeenNthCalledWith(1, 1)
    expect(svc.deleteKeluarga).toHaveBeenNthCalledWith(2, 2)
    expect(svc.approveKeluarga).toHaveBeenCalledWith(3, 2)   // id KK, userId kepala
  })
})

describe('GET /api/keluarga', () => {
  it('meneruskan filter sebagai angka/teks dan identitas pengguna ke service', async () => {
    m(svc.listKeluarga).mockResolvedValue({ data: [], total: 0, page: 2, limit: 10 })
    const res = await request(app)
      .get('/api/keluarga?page=2&limit=10&search=KLG0049&kelompokId=7&wilayahId=3&status=AKTIF&dataStatus=DRAFT')
      .set(auth(penatua))
    expect(res.status).toBe(200)
    const [filter, user] = m(svc.listKeluarga).mock.calls[0]!
    expect(filter).toEqual({ page: 2, limit: 10, search: 'KLG0049', kelompokId: 7, wilayahId: 3, status: 'AKTIF', dataStatus: 'DRAFT' })
    expect(user).toMatchObject({ userId: 5, role: 'PENATUA_KELOMPOK', kelompokId: 7 })
  })

  it('tanpa query → semua filter undefined', async () => {
    m(svc.listKeluarga).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    await request(app).get('/api/keluarga').set(auth(viewer))
    expect(m(svc.listKeluarga).mock.calls[0]![0]).toEqual({
      page: undefined, limit: undefined, search: undefined, kelompokId: undefined,
      wilayahId: undefined, status: undefined, dataStatus: undefined,
    })
  })
})

describe('GET /api/keluarga/:id', () => {
  it('meneruskan id numerik dan pengguna (penegakan cakupan ada di service)', async () => {
    m(svc.getKeluargaById).mockResolvedValue({ id: 12 })
    const res = await request(app).get('/api/keluarga/12').set(auth(penatua))
    expect(res.status).toBe(200)
    expect(m(svc.getKeluargaById).mock.calls[0]![0]).toBe(12)
    expect(m(svc.getKeluargaById).mock.calls[0]![1]).toMatchObject({ role: 'PENATUA_KELOMPOK', kelompokId: 7 })
  })
})

describe('POST /api/keluarga (buat)', () => {
  it.each([['SUPERADMIN'], ['KEPALA_KANTOR'], ['MAJELIS'], ['STAF_ADMIN'], ['PENATUA_KELOMPOK']])('%s boleh membuat → 201', async (peran) => {
    m(svc.createKeluarga).mockResolvedValue({ id: 1 })
    const res = await request(app).post('/api/keluarga').set(auth(tok(peran as UserRole, 11, 7))).send({ kelompokId: 7, alamat: 'Jl. Melati 3' })
    expect(res.status).toBe(201)
    expect(m(svc.createKeluarga).mock.calls[0]![1]).toBe(11)    // userId pembuat
  })

  const tidakValid: [string, object][] = [
    ['kelompokId bukan bilangan positif', { kelompokId: 0 }],
    ['rt lebih dari 5 karakter', { rt: '123456' }],
    ['kodePos lebih dari 10 karakter', { kodePos: '12345678901' }],
    ['status di luar enum', { status: 'HAPUS' }],
    ['dataStatus di luar enum', { dataStatus: 'SELESAI' }],
    ['alamat lebih dari 500 karakter', { alamat: 'x'.repeat(501) }],
  ]
  it.each(tidakValid)('%s → 400, service tidak dipanggil', async (_n, payload) => {
    const res = await request(app).post('/api/keluarga').set(auth(admin)).send(payload)
    expect(res.status).toBe(400)
    expect(svc.createKeluarga).not.toHaveBeenCalled()
  })
})

describe('PUT /api/keluarga/:id (ubah)', () => {
  it('meneruskan id, body, userId, dan pengguna', async () => {
    m(svc.updateKeluarga).mockResolvedValue({ id: 8 })
    const res = await request(app).put('/api/keluarga/8').set(auth(staf)).send({ alamat: 'Jl. Baru 1', dataStatus: 'VALIDASI' })
    expect(res.status).toBe(200)
    const [id, data, userId, user] = m(svc.updateKeluarga).mock.calls[0]!
    expect(id).toBe(8)
    expect(data).toMatchObject({ alamat: 'Jl. Baru 1', dataStatus: 'VALIDASI' })
    expect(userId).toBe(4)
    expect(user).toMatchObject({ role: 'STAF_ADMIN' })
  })

  it('body tidak valid → 400', async () => {
    const res = await request(app).put('/api/keluarga/8').set(auth(admin)).send({ status: 'X' })
    expect(res.status).toBe(400)
    expect(svc.updateKeluarga).not.toHaveBeenCalled()
  })
})
