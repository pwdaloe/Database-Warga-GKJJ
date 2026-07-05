import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createHash } from 'crypto'
import { UserRole } from '@prisma/client'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { default: app } = await import('../../src/app.js')

const mockedFindFirst = prisma.user.findFirst as ReturnType<typeof vi.fn>
const mockedUpdate = prisma.user.update as ReturnType<typeof vi.fn>

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
})

beforeEach(() => {
  vi.clearAllMocks()
  prisma.activityLog.create = vi.fn().mockResolvedValue({})
})

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    nama: 'Budi Santoso',
    username: 'budi',
    email: 'budi@example.com',
    aktif: true,
    resetTokenHash: null,
    resetTokenExpiry: null,
    role: UserRole.STAF_ADMIN,
    kelompokId: null,
    wargaId: null,
    ...overrides,
  }
}

describe('POST /api/auth/forgot-password', () => {
  it('return 400 jika payload tidak valid', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ usernameOrEmail: '' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('return 200 dengan pesan generik meskipun user tidak ditemukan', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ usernameOrEmail: 'tidak-ada' })

    expect(res.status).toBe(200)
    expect(res.body.data.message).toBe(
      'Jika akun terdaftar, link reset password telah dikirim ke email terkait.',
    )
  })

  it('return 200 dengan pesan generik yang sama jika user ditemukan', async () => {
    mockedFindFirst.mockResolvedValue(baseUser())
    mockedUpdate.mockResolvedValue({})

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ usernameOrEmail: 'budi' })

    expect(res.status).toBe(200)
    expect(res.body.data.message).toBe(
      'Jika akun terdaftar, link reset password telah dikirim ke email terkait.',
    )
  })
})

describe('POST /api/auth/reset-password', () => {
  it('return 400 jika payload tidak valid', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: '', passwordBaru: 'pendek' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('return 400 jika token tidak valid/expired', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'token-invalid', passwordBaru: 'passwordBaru123' })

    expect(res.status).toBe(400)
  })

  it('return 200 jika token valid', async () => {
    const token = 'raw-token-xyz'
    const resetTokenHash = createHash('sha256').update(token).digest('hex')
    mockedFindFirst.mockResolvedValue(
      baseUser({ resetTokenHash, resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000) }),
    )
    mockedUpdate.mockResolvedValue({})

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, passwordBaru: 'passwordBaru123' })

    expect(res.status).toBe(200)
    expect(res.body.data.message).toBe('Password berhasil direset, silakan login')
  })
})
