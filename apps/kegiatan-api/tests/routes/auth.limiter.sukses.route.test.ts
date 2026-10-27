import 'express-async-errors'
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { buatPrisma, pengguna } from '../helpers/harness.js'

// File terpisah dari tes kegagalan: hitungan pembatas laju disimpan per proses.
const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

describe('batas laju login: login berhasil tidak menghabiskan jatah', () => {
  it('30 login berhasil dari satu IP (jaringan gereja) semuanya 200', async () => {
    const hash = await bcrypt.hash('password-benar-1', 4)
    prisma.pengguna.findFirst.mockResolvedValue({ ...pengguna('PENGURUS_UPK'), passwordHash: hash })
    prisma.pengguna.update.mockResolvedValue({})
    const status: number[] = []
    for (let i = 0; i < 30; i++) status.push((await request(app).post('/api/auth/login').send({ username: 'uji-pengurus_upk', password: 'password-benar-1' })).status)
    expect(status.every((s) => s === 200)).toBe(true)
  })
})
