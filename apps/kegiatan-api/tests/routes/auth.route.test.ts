import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { buatPrisma, masuk, pengguna, RAHASIA, tokenUntuk } from '../helpers/harness.js'

const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.logAudit.create.mockResolvedValue({})
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma))
})

const hash = bcrypt.hashSync('PasswordBenar123', 4)
const baris = (ubah: Record<string, unknown> = {}) => ({
  id: 7, username: 'ketua.koman', nama: 'Ketua', email: null, whatsapp: null, peran: 'PENGURUS_UPK', unitId: 5, bidangId: null,
  aktif: true, wajibGantiPassword: false, unit: { id: 5, kode: 'KOMAN', nama: 'Komisi Anak', singkatan: 'Anak', jenis: 'UPK', bidangId: 3 }, bidang: null,
  passwordHash: hash, ...ubah,
})

/** findUnique: pencarian untuk authenticate → pengguna; pencarian hash (select passwordHash) → hash. */
function siapkanPengguna(user: ReturnType<typeof pengguna>) {
  prisma.pengguna.findUnique.mockImplementation(async (args: { select?: { passwordHash?: boolean } }) =>
    args.select?.passwordHash ? { passwordHash: hash } : user,
  )
  return { Authorization: `Bearer ${tokenUntuk(user.id)}` }
}

describe('POST /api/auth/login', () => {
  it('berhasil: token berisi sub pengguna, respons tanpa passwordHash', async () => {
    prisma.pengguna.findFirst.mockResolvedValue(baris())
    prisma.pengguna.update.mockResolvedValue({})
    const res = await request(app).post('/api/auth/login').send({ username: 'ketua.koman', password: 'PasswordBenar123' })
    expect(res.status).toBe(200)
    const payload = jwt.verify(res.body.data.token, RAHASIA) as { sub: number }
    expect(payload.sub).toBe(7)
    expect(res.body.data.user.username).toBe('ketua.koman')
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
    expect(JSON.stringify(res.body)).not.toContain(hash)
    expect(prisma.pengguna.update.mock.calls[0]![0].data.lastLogin).toBeInstanceOf(Date)
  })

  it('password salah dan username tidak ada → 401 dengan pesan IDENTIK', async () => {
    prisma.pengguna.findFirst.mockResolvedValueOnce(baris())
    const salahPassword = await request(app).post('/api/auth/login').send({ username: 'ketua.koman', password: 'salah-salah-1' })
    prisma.pengguna.findFirst.mockResolvedValueOnce(null)
    const tidakAda = await request(app).post('/api/auth/login').send({ username: 'tidak.ada', password: 'apa-saja-1234' })
    expect(salahPassword.status).toBe(401)
    expect(tidakAda.status).toBe(401)
    expect(tidakAda.body).toEqual(salahPassword.body)
  })

  it('username tidak ada tetap menjalankan bcrypt.compare (waktu respons tidak membocorkan akun)', async () => {
    const spy = vi.spyOn(bcrypt, 'compare')
    prisma.pengguna.findFirst.mockResolvedValue(null)
    await request(app).post('/api/auth/login').send({ username: 'tidak.ada', password: 'apa-saja-1234' })
    expect(spy).toHaveBeenCalledTimes(1)
    // dibandingkan dengan hash bcrypt SUNGGUHAN (biaya sama); string kosong/rusak akan kembali seketika dan membocorkan waktu
    expect(spy.mock.calls[0]![1]).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)
    spy.mockRestore()
  })

  it('pencarian username tidak peka huruf besar dan hanya akun aktif', async () => {
    prisma.pengguna.findFirst.mockResolvedValue(null)
    await request(app).post('/api/auth/login').send({ username: 'KETUA.KOMAN', password: 'x' })
    const where = prisma.pengguna.findFirst.mock.calls[0]![0].where
    expect(where.aktif).toBe(true)
    expect(where.username).toMatchObject({ mode: 'insensitive' })
  })

  it('badan tidak lengkap → 400', async () => {
    expect((await request(app).post('/api/auth/login').send({ username: 'a' })).status).toBe(400)
  })
})

describe('authenticate', () => {
  it('tanpa token → 401', async () => {
    expect((await request(app).get('/api/program')).status).toBe(401)
  })

  it('token dengan tanda tangan salah → 401', async () => {
    const palsu = jwt.sign({ sub: 1 }, 'rahasia-lain')
    expect((await request(app).get('/api/program').set('Authorization', `Bearer ${palsu}`)).status).toBe(401)
    expect(prisma.pengguna.findUnique).not.toHaveBeenCalled()
  })

  it('token tanpa sub numerik → 401', async () => {
    const t = jwt.sign({ sub: 'x' }, RAHASIA)
    expect((await request(app).get('/api/program').set('Authorization', `Bearer ${t}`)).status).toBe(401)
  })

  it('akun dinonaktifkan setelah token terbit → 401 seketika', async () => {
    prisma.pengguna.findUnique.mockResolvedValue(pengguna('PENGURUS_UPK', { aktif: false }))
    expect((await request(app).get('/api/program').set('Authorization', `Bearer ${tokenUntuk(1)}`)).status).toBe(401)
  })

  it('akun sudah dihapus → 401', async () => {
    prisma.pengguna.findUnique.mockResolvedValue(null)
    expect((await request(app).get('/api/program').set('Authorization', `Bearer ${tokenUntuk(1)}`)).status).toBe(401)
  })

  it('peran dibaca dari database, bukan dari token (token lama tidak menaikkan hak)', async () => {
    const t = jwt.sign({ sub: 1, peran: 'ADMIN' }, RAHASIA)
    prisma.pengguna.findUnique.mockResolvedValue(pengguna('PENGURUS_UPK'))
    const res = await request(app).put('/api/master/pagu').set('Authorization', `Bearer ${t}`).send({ tahunId: 1, unitId: 1, nilai: 1 })
    expect(res.status).toBe(403)
  })
})

describe('password sementara', () => {
  it('akun wajib ganti password: route lain 403 dengan kode GANTI_PASSWORD, /me tetap boleh', async () => {
    const h = masuk(prisma, pengguna('PENGURUS_UPK', { wajibGantiPassword: true }))
    const lain = await request(app).get('/api/program').set(h)
    expect(lain.status).toBe(403)
    expect(lain.body.details).toEqual({ kode: 'GANTI_PASSWORD' })
    expect(prisma.programKerja.findMany).not.toHaveBeenCalled()

    prisma.pengguna.findUnique.mockResolvedValue({ ...baris(), wajibGantiPassword: true })
    expect((await request(app).get('/api/auth/me').set(h)).status).toBe(200)
  })

  it('ganti password: lama salah → 400', async () => {
    const h = siapkanPengguna(pengguna('PENGURUS_UPK'))
    const res = await request(app).post('/api/auth/ganti-password').set(h).send({ passwordLama: 'bukan-yang-lama', passwordBaru: 'PasswordBaru456' })
    expect(res.status).toBe(400)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })

  it.each([['terlalu pendek', 'pendek'], ['sama dengan yang lama', 'PasswordBenar123']])('ganti password: %s → 400', async (_n, baru) => {
    const h = siapkanPengguna(pengguna('PENGURUS_UPK'))
    const res = await request(app).post('/api/auth/ganti-password').set(h).send({ passwordLama: 'PasswordBenar123', passwordBaru: baru })
    expect(res.status).toBe(400)
    expect(prisma.pengguna.update).not.toHaveBeenCalled()
  })

  it('ganti password berhasil: hash baru (bukan teks asli), wajibGantiPassword dimatikan, tercatat audit tanpa password', async () => {
    const h = siapkanPengguna(pengguna('PENGURUS_UPK', { wajibGantiPassword: true }))
    prisma.pengguna.update.mockResolvedValue({})
    const res = await request(app).post('/api/auth/ganti-password').set(h).send({ passwordLama: 'PasswordBenar123', passwordBaru: 'PasswordBaru456' })
    expect(res.status).toBe(200)
    const data = prisma.pengguna.update.mock.calls[0]![0].data
    expect(data.wajibGantiPassword).toBe(false)
    expect(data.passwordHash).not.toBe('PasswordBaru456')
    expect(await bcrypt.compare('PasswordBaru456', data.passwordHash)).toBe(true)
    expect(JSON.stringify(prisma.logAudit.create.mock.calls)).not.toContain('PasswordBaru456')
  })
})
