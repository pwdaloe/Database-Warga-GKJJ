import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const svc = {
  createWarga: vi.fn(async (d: any) => ({ id: 1, ...d })),
  updateWarga: vi.fn(async (_id: number, d: any) => ({ id: 1, ...d })),
}
vi.mock('../../src/services/warga.service.js', async (orig) => ({ ...(await orig<any>()), ...svc }))
vi.mock('../../src/utils/prisma.js', () => ({
  prisma: { activityLog: { create: vi.fn().mockResolvedValue({}) }, auditLog: { create: vi.fn().mockResolvedValue({}) } },
}))

const { default: app } = await import('../../src/app.js')

const token = () => jwt.sign({ userId: 1, role: 'SUPERADMIN', kelompokId: null }, process.env.JWT_SECRET!)
const base = { namaLengkap: 'Budi Santoso', jenisKelamin: 'L' }
const put = (body: object) => request(app).put('/api/warga/1').set('Authorization', `Bearer ${token()}`).send({ ...base, ...body })
const post = (body: object) => request(app).post('/api/warga').set('Authorization', `Bearer ${token()}`).send({ ...base, ...body })
const dataDiService = () => svc.updateWarga.mock.calls[0]![1] as Record<string, any>

beforeAll(() => { process.env.JWT_SECRET = 'test-jwt-secret' })
beforeEach(() => vi.clearAllMocks())

describe('Keanggotaan: Sidi/Baptis Dewasa + Menikah (pemberkatan gereja)', () => {
  it('menyimpan tempat sidi serta status, tanggal, dan gereja pemberkatan nikah', async () => {
    const res = await put({
      sudahSidi: true, tanggalSidi: '1975-06-01', tempatSidi: 'GKJ Jakarta',
      sudahMenikah: true, tanggalMenikah: '1985-08-17', tempatMenikah: 'GKJ Pondok Gede',
    })
    expect(res.status).toBe(200)
    expect(dataDiService()).toMatchObject({
      tempatSidi: 'GKJ Jakarta', sudahMenikah: true, tempatMenikah: 'GKJ Pondok Gede',
      tanggalMenikah: new Date('1985-08-17'), tanggalSidi: new Date('1975-06-01'),
    })
  })

  it('tanggal/gereja nikah terisi tanpa centang Menikah → ditolak 400 (bukan 500 dari CHECK DB)', async () => {
    const res = await put({ sudahMenikah: false, tanggalMenikah: '1985-08-17' })
    expect(res.status).toBe(400)
    expect(svc.updateWarga).not.toHaveBeenCalled()
    expect((await post({ tempatMenikah: 'GKJ X' })).status).toBe(400)
    expect(svc.createWarga).not.toHaveBeenCalled()
  })

  it('Menikah dicabut (false) → tanggal & gereja dikosongkan di data yang disimpan', async () => {
    await put({ sudahMenikah: false })
    expect(dataDiService()).toMatchObject({ sudahMenikah: false, tanggalMenikah: null, tempatMenikah: null })
  })

  it('edit sebagian (mis. dari /m) tidak menghapus tanggal yang tidak dikirim', async () => {
    await put({ sudahBaptis: true })
    const d = dataDiService()
    for (const k of ['tanggalLahir', 'tanggalBaptis', 'tanggalSidi', 'tanggalMenikah']) expect(k in d).toBe(false)
  })

  it('tanggal yang sengaja dikosongkan (null) tetap dikosongkan', async () => {
    await put({ sudahSidi: false, tanggalSidi: null })
    expect(dataDiService().tanggalSidi).toBeNull()
  })

  it('tanggal tidak valid ditolak', async () => {
    expect((await put({ sudahMenikah: true, tanggalMenikah: '17-08-1985' })).status).toBe(400)
  })

  it('gereja lebih dari 150 karakter ditolak', async () => {
    expect((await put({ tempatSidi: 'x'.repeat(151) })).status).toBe(400)
  })
})
