import 'express-async-errors'
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { buatPrisma } from '../helpers/harness.js'

// File terpisah: pembatas laju menyimpan hitungan di memori per proses.
const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

describe('batas laju login', () => {
  it('percobaan ke-11 dalam 15 menit → 429 (juga untuk username yang tidak ada)', async () => {
    prisma.pengguna.findFirst.mockResolvedValue(null)
    const status: number[] = []
    for (let i = 0; i < 12; i++) status.push((await request(app).post('/api/auth/login').send({ username: 'x', password: 'salah-salah-1' })).status)
    expect(status.slice(0, 10).every((s) => s === 401)).toBe(true)
    expect(status[10]).toBe(429)
    expect(status[11]).toBe(429)
  })
})
