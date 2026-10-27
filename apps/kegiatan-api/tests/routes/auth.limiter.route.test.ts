import 'express-async-errors'
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { buatPrisma } from '../helpers/harness.js'

// File terpisah: pembatas laju menyimpan hitungan di memori per proses.
const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

describe('batas laju login', () => {
  it('hanya login GAGAL yang dihitung: 20 kegagalan lolos 401, yang ke-21 dan seterusnya 429', async () => {
    prisma.pengguna.findFirst.mockResolvedValue(null)
    const status: number[] = []
    for (let i = 0; i < 22; i++) status.push((await request(app).post('/api/auth/login').send({ username: 'x', password: 'salah-salah-1' })).status)
    expect(status.slice(0, 20).every((s) => s === 401)).toBe(true)
    expect(status[20]).toBe(429)
    expect(status[21]).toBe(429)
  })
})
