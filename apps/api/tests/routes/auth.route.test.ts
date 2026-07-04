import 'express-async-errors'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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
const mockedFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
})

beforeEach(() => {
  vi.clearAllMocks()
  prisma.activityLog.create = vi.fn().mockResolvedValue({})
})

describe('POST /api/auth/login', () => {
  it('return 400 jika payload tidak valid', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: '' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('return 401 jika kredensial salah', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'tidak-ada', password: 'apapun' })

    expect(res.status).toBe(401)
  })

  it('return 201 dengan token jika kredensial benar', async () => {
    mockedFindFirst.mockResolvedValue({
      id: 1,
      nama: 'Budi',
      username: 'budi',
      email: 'budi@example.com',
      passwordHash: bcrypt.hashSync('password123', 4),
      role: UserRole.STAF_ADMIN,
      kelompokId: null,
      wargaId: null,
      kelompok: null,
      warga: null,
    })
    prisma.user.update = vi.fn().mockResolvedValue({})

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'budi', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.data.token).toBeTypeOf('string')
  })
})

describe('GET /api/auth/me', () => {
  it('return 401 jika tanpa token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('return 401 jika token tidak valid', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/change-password', () => {
  it('return 401 jika tanpa token', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ passwordLama: 'a', passwordBaru: 'barubaru123' })
    expect(res.status).toBe(401)
  })
})
