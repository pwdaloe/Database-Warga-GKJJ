import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'

// File terpisah: limiter menyimpan hitungan di memori per proses, jadi tes yang sengaja
// menghabiskan kuota tidak boleh berbagi proses dengan tes lain.
const prisma: any = {
  warga: { findUnique: vi.fn().mockResolvedValue(null) },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')

beforeEach(() => { process.env['QR_ALLOW_LEGACY_ID'] = 'true' })

describe('Batas laju halaman publik anggota', () => {
  it('id numerik lama dibatasi lebih ketat (10/menit): permintaan ke-11 → 429', async () => {
    const status: number[] = []
    for (let i = 1; i <= 12; i++) status.push((await request(app).get(`/api/public/member/${i}`)).status)
    expect(status.slice(0, 10).every((s) => s === 404)).toBe(true)
    expect(status[10]).toBe(429)
    expect(status[11]).toBe(429)
  })

  it('penelusuran token acak dibatasi 30/menit (hitungan bersama dengan id lama): akhirnya 429', async () => {
    const token = '0123456789abcdef0123456789abcdef'
    let terakhir = 0
    for (let i = 0; i < 25; i++) terakhir = (await request(app).get(`/api/public/member/${token}`)).status
    // 12 permintaan sebelumnya sudah memakai kuota yang sama; total > 30 sebelum loop selesai
    expect(terakhir).toBe(429)
  })

  it('respons 429 tetap berformat JSON konsisten dan tanpa data anggota', async () => {
    const res = await request(app).get('/api/public/member/0123456789abcdef0123456789abcdef')
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ success: false })
    expect(res.body.data).toBeUndefined()
  })
})
