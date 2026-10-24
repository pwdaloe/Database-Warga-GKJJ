import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { UserRole } from '../../src/generated/prisma/client.js'

const prisma: any = {
  warga: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

const KELOMPOK = 5
const TOKEN_QR = '0123456789abcdef0123456789abcdef'
const tok = (role: UserRole) => jwt.sign({ userId: 7, role, kelompokId: role === UserRole.PENATUA_KELOMPOK ? KELOMPOK : null }, process.env.JWT_SECRET!)
const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
let t: Record<string, string>

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  t = Object.fromEntries(Object.values(UserRole).map((r) => [r, tok(r)]))
})
beforeEach(() => {
  vi.clearAllMocks()
  prisma.auditLog.create.mockResolvedValue({})
  prisma.activityLog.create.mockResolvedValue({})
})

const baris = (extra: object = {}) => ({
  id: 9, namaLengkap: 'Ani', nik: null, qrToken: TOKEN_QR,
  keluarga: { kelompokId: KELOMPOK, kelompok: { id: KELOMPOK } },
  ...extra,
})

describe('Redaksi qrToken per peran (daftar dan detail warga)', () => {
  const BOLEH = ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK']
  const TIDAK = ['VIEWER']

  it('daftar meminta kolom token dari DB secara eksplisit (omit global mematikannya)', async () => {
    prisma.warga.count.mockResolvedValue(0)
    prisma.warga.findMany.mockResolvedValue([])
    await request(app).get('/api/warga').set(auth(t.SUPERADMIN!))
    expect(prisma.warga.findMany.mock.calls[0]![0].omit).toEqual({ qrToken: false })
  })

  for (const role of BOLEH) {
    it(`daftar: ${role} menerima qrToken`, async () => {
      prisma.warga.count.mockResolvedValue(1)
      prisma.warga.findMany.mockResolvedValue([baris()])
      const res = await request(app).get('/api/warga').set(auth(t[role]!))
      expect(res.status).toBe(200)
      expect(res.body.data[0].qrToken).toBe(TOKEN_QR)
    })

    it(`detail: ${role} menerima qrToken`, async () => {
      prisma.warga.findUnique.mockResolvedValue(baris())
      const res = await request(app).get('/api/warga/9').set(auth(t[role]!))
      expect(res.status).toBe(200)
      expect(res.body.data.qrToken).toBe(TOKEN_QR)
    })
  }

  for (const role of TIDAK) {
    it(`daftar: ${role} TIDAK menerima qrToken meski DB mengembalikannya`, async () => {
      prisma.warga.count.mockResolvedValue(1)
      prisma.warga.findMany.mockResolvedValue([baris()])
      const res = await request(app).get('/api/warga').set(auth(t[role]!))
      expect(res.status).toBe(200)
      expect(res.body.data[0]).not.toHaveProperty('qrToken')
      expect(JSON.stringify(res.body)).not.toContain(TOKEN_QR)
    })

    it(`detail: ${role} TIDAK menerima qrToken`, async () => {
      prisma.warga.findUnique.mockResolvedValue(baris())
      const res = await request(app).get('/api/warga/9').set(auth(t[role]!))
      expect(res.status).toBe(200)
      expect(JSON.stringify(res.body)).not.toContain(TOKEN_QR)
    })
  }
})

describe('POST /api/warga/:id/qr-token/rotate', () => {
  const rotate = (id: number | string, token?: string) => {
    const r = request(app).post(`/api/warga/${id}/qr-token/rotate`)
    return token ? r.set(auth(token)) : r
  }

  it('tanpa login → 401', async () => {
    expect((await rotate(9)).status).toBe(401)
  })

  for (const role of ['MAJELIS', 'PENATUA_KELOMPOK', 'VIEWER', 'JEMAAT']) {
    it(`${role} → 403 dan DB tidak disentuh`, async () => {
      const res = await rotate(9, t[role]!)
      expect(res.status).toBe(403)
      expect(prisma.warga.update).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })
  }

  for (const role of ['SUPERADMIN', 'KEPALA_KANTOR', 'STAF_ADMIN']) {
    it(`${role} → 200, token baru berformat benar, berbeda dari yang lama`, async () => {
      prisma.warga.findUnique.mockResolvedValue({ id: 9 })
      prisma.warga.update.mockImplementation(async ({ data }: any) => ({ qrToken: data.qrToken }))
      const res = await rotate(9, t[role]!)
      expect(res.status).toBe(200)
      expect(res.body.data.qrToken).toMatch(/^[0-9a-f]{32}$/)
      expect(res.body.data.qrToken).not.toBe(TOKEN_QR)
      const arg = prisma.warga.update.mock.calls[0]![0]
      expect(arg.where).toEqual({ id: 9 })
      expect(arg.data.qrToken).toBe(res.body.data.qrToken)
    })
  }

  it('warga tidak ada → 404 dan tidak ada update', async () => {
    prisma.warga.findUnique.mockResolvedValue(null)
    const res = await rotate(99, t.SUPERADMIN!)
    expect(res.status).toBe(404)
    expect(prisma.warga.update).not.toHaveBeenCalled()
  })

  it('id bukan angka positif → 400', async () => {
    for (const id of ['abc', '0', '-3']) expect((await rotate(id, t.SUPERADMIN!)).status).toBe(400)
    expect(prisma.warga.update).not.toHaveBeenCalled()
  })

  it('audit log mencatat aksi tanpa menulis token (lama maupun baru)', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 9 })
    prisma.warga.update.mockImplementation(async ({ data }: any) => ({ qrToken: data.qrToken }))
    const res = await rotate(9, t.STAF_ADMIN!)
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
    const data = prisma.auditLog.create.mock.calls[0]![0].data
    expect(data).toMatchObject({ userId: 7, action: 'UPDATE', tabel: 'warga', recordId: 9 })
    const dump = JSON.stringify(data)
    expect(dump).not.toContain(res.body.data.qrToken)
    expect(dump).not.toContain(TOKEN_QR)
  })

  it('bentrok unik (P2002) diulang dengan token lain, bukan 500', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 9 })
    prisma.warga.update
      .mockRejectedValueOnce(Object.assign(new Error('unik'), { code: 'P2002' }))
      .mockImplementation(async ({ data }: any) => ({ qrToken: data.qrToken }))
    const res = await rotate(9, t.SUPERADMIN!)
    expect(res.status).toBe(200)
    expect(prisma.warga.update).toHaveBeenCalledTimes(2)
    const [a, b] = prisma.warga.update.mock.calls.map((c: any) => c[0].data.qrToken)
    expect(a).not.toBe(b)
  })

  it('error DB selain bentrok unik tidak ditelan', async () => {
    prisma.warga.findUnique.mockResolvedValue({ id: 9 })
    prisma.warga.update.mockRejectedValue(Object.assign(new Error('mati'), { code: 'P1001' }))
    const res = await rotate(9, t.SUPERADMIN!)
    expect(res.status).toBeGreaterThanOrEqual(500)
    expect(prisma.warga.update).toHaveBeenCalledTimes(1)
  })

  it('log aktivitas tidak menyimpan token dari badan permintaan (qrToken dibuang)', async () => {
    // Pengaman berlapis: seandainya suatu mutasi menerima qrToken di badan, tidak boleh masuk activity_log.
    prisma.warga.findUnique.mockResolvedValue({ id: 9 })
    prisma.warga.update.mockImplementation(async ({ data }: any) => ({ qrToken: data.qrToken }))
    await request(app).post('/api/warga/9/qr-token/rotate').set(auth(t.SUPERADMIN!)).send({ qrToken: TOKEN_QR, token: 'rahasia' })
    await new Promise((r) => setTimeout(r, 20))
    const calls = prisma.activityLog.create.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const dump = JSON.stringify(calls.map((c: any) => c[0].data))
    expect(dump).not.toContain(TOKEN_QR)
    expect(dump).not.toContain('rahasia')
  })
})
