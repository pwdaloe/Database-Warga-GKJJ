import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    warga: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    keluarga: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    kelompok: {
      findFirst: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const bcrypt = (await import('bcryptjs')).default
const { default: app } = await import('../../src/app.js')

const mockedWargaFindUnique = prisma.warga.findUnique as ReturnType<typeof vi.fn>
const mockedWargaFindFirst  = prisma.warga.findFirst  as ReturnType<typeof vi.fn>
const mockedWargaCreate     = prisma.warga.create     as ReturnType<typeof vi.fn>
const mockedWargaUpdate     = prisma.warga.update     as ReturnType<typeof vi.fn>
const mockedKeluargaFindFirst = prisma.keluarga.findFirst as ReturnType<typeof vi.fn>
const mockedKeluargaCreate    = prisma.keluarga.create    as ReturnType<typeof vi.fn>
const mockedKeluargaUpdate    = prisma.keluarga.update    as ReturnType<typeof vi.fn>
const mockedKelompokFindFirst = prisma.kelompok.findFirst as ReturnType<typeof vi.fn>
const mockedUserFindFirst = prisma.user.findFirst as ReturnType<typeof vi.fn>
const mockedUserCreate    = prisma.user.create    as ReturnType<typeof vi.fn>

let staffToken: string
let superadminToken: string
let viewerToken: string
let kepalaKantorToken: string

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  staffToken = jwt.sign({ userId: 1, role: UserRole.STAF_ADMIN, kelompokId: null }, process.env.JWT_SECRET)
  superadminToken = jwt.sign({ userId: 2, role: UserRole.SUPERADMIN, kelompokId: null }, process.env.JWT_SECRET)
  viewerToken = jwt.sign({ userId: 3, role: UserRole.VIEWER, kelompokId: null }, process.env.JWT_SECRET)
  kepalaKantorToken = jwt.sign({ userId: 4, role: UserRole.KEPALA_KANTOR, kelompokId: null }, process.env.JWT_SECRET)
})

beforeEach(() => {
  vi.clearAllMocks()
  // Default: tidak ada duplikat / kelompok ditemukan kecuali override per-test
  mockedWargaFindUnique.mockResolvedValue(null)
  mockedWargaFindFirst.mockResolvedValue(null)
  mockedUserFindFirst.mockResolvedValue(null)
})

function baseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    namaLengkap: 'Budi Santoso',
    jenisKelamin: 'L',
    _rowIndex: 2,
    ...overrides,
  }
}

describe('POST /api/import/warga', () => {
  it('return 403 jika role tidak diizinkan (VIEWER)', async () => {
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ rows: [baseRow()] })

    expect(res.status).toBe(403)
    expect(mockedWargaCreate).not.toHaveBeenCalled()
  })

  it('gagal jika namaLengkap kurang dari 2 karakter', async () => {
    mockedWargaCreate.mockResolvedValue({ id: 1 })
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow({ namaLengkap: 'A' })] })

    expect(res.status).toBe(200)
    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].status).toBe('gagal')
    expect(res.body.data.log[0].alasan).toMatch(/Nama lengkap wajib diisi/)
  })

  it('gagal jika jenisKelamin tidak valid', async () => {
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow({ jenisKelamin: 'X' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Jenis kelamin tidak valid/)
    expect(res.body.data.log[0].alasan).toMatch(/X/)
  })

  it('gagal jika NIK sudah terdaftar', async () => {
    mockedWargaFindUnique.mockResolvedValue({ namaLengkap: 'Warga Lama' })
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow({ nik: '3171234567890001' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/NIK sudah terdaftar pada: Warga Lama/)
    expect(mockedWargaCreate).not.toHaveBeenCalled()
  })

  it('gagal jika nomorInduk sudah dipakai', async () => {
    mockedWargaFindFirst.mockResolvedValue({ namaLengkap: 'Warga Lain' })
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow({ nomorInduk: 'INV-001' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/No\. Induk "INV-001" sudah dipakai oleh: Warga Lain/)
    expect(mockedWargaCreate).not.toHaveBeenCalled()
  })

  it('gagal jika kelompokKode tidak ditemukan', async () => {
    mockedKelompokFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow({ kelompokKode: 'ZZZ' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Kode kelompok "ZZZ" tidak ditemukan/)
  })

  it('sukses membuat keluarga baru saat statusKeluarga KEPALA dengan kelompokKode valid', async () => {
    mockedKelompokFindFirst.mockResolvedValue({ id: 5 })
    mockedKeluargaCreate.mockResolvedValue({ id: 20 })
    mockedWargaCreate.mockResolvedValue({ id: 100 })

    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow({ kelompokKode: 'K1', statusKeluarga: 'KEPALA' })] })

    expect(res.body.data.berhasil).toBe(1)
    expect(mockedKeluargaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kelompokId: 5 }) }),
    )
    expect(mockedKeluargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 20 }, data: { nomorKeluarga: 'KLG00020' } }),
    )
    expect(mockedWargaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ keluargaId: 20 }) }),
    )
    // Ditandai sebagai kepala keluarga
    expect(mockedKeluargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 20 }, data: { kepalakeluargaId: 100 } }),
    )
    // nomorAnggota di-generate dari ID
    expect(mockedWargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 100 }, data: { nomorAnggota: 'WRG00100' } }),
    )
  })

  it('sukses tanpa kelompokKode → keluargaId null', async () => {
    mockedWargaCreate.mockResolvedValue({ id: 7 })
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [baseRow()] })

    expect(res.body.data.berhasil).toBe(1)
    expect(mockedKeluargaCreate).not.toHaveBeenCalled()
    expect(mockedWargaCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ keluargaId: null }) }),
    )
  })

  it('1 baris gagal + 1 baris sukses dalam 1 request → log mencerminkan keduanya', async () => {
    mockedWargaCreate.mockResolvedValue({ id: 1 })

    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        rows: [
          baseRow({ namaLengkap: 'A', _rowIndex: 2 }),
          baseRow({ namaLengkap: 'Warga Valid', _rowIndex: 3 }),
        ],
      })

    expect(res.body.data.total).toBe(2)
    expect(res.body.data.berhasil).toBe(1)
    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log).toHaveLength(2)
    expect(res.body.data.log.find((l: any) => l.baris === 2).status).toBe('gagal')
    expect(res.body.data.log.find((l: any) => l.baris === 3).status).toBe('berhasil')
  })

  it('return 400 kalau rows lebih dari 200', async () => {
    const rows = Array.from({ length: 201 }, (_, i) => baseRow({ _rowIndex: i + 2 }))
    const res = await request(app)
      .post('/api/import/warga')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows })

    expect(res.status).toBe(400)
  })
})

function basePenggunaRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    namaLengkap: 'Budi Santoso',
    username: 'budi.santoso',
    email: 'budi@example.com',
    password: 'password123',
    role: 'STAF_ADMIN',
    _rowIndex: 2,
    ...overrides,
  }
}

describe('POST /api/import/pengguna', () => {
  it('return 403 jika role bukan SUPERADMIN/KEPALA_KANTOR', async () => {
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rows: [basePenggunaRow()] })

    expect(res.status).toBe(403)
  })

  it('gagal jika username kurang dari 3 karakter setelah normalisasi', async () => {
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ rows: [basePenggunaRow({ username: 'ab' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Username tidak valid/)
  })

  it('gagal jika email tidak valid', async () => {
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ rows: [basePenggunaRow({ email: 'bukan-email' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Email tidak valid/)
  })

  it('gagal jika password kurang dari 8 karakter', async () => {
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ rows: [basePenggunaRow({ password: 'short' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Password wajib diisi/)
  })

  it('gagal jika role tidak valid', async () => {
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ rows: [basePenggunaRow({ role: 'BUKAN_ROLE' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Role tidak valid/)
  })

  it('gagal jika username atau email sudah dipakai', async () => {
    mockedUserFindFirst.mockResolvedValue({ nama: 'Pengguna Lama', username: 'budi.santoso', email: 'lain@example.com' })
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ rows: [basePenggunaRow()] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Username sudah digunakan oleh: Pengguna Lama/)
  })

  it('gagal jika kelompokKode diisi tapi tidak ditemukan', async () => {
    mockedKelompokFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${kepalaKantorToken}`)
      .send({ rows: [basePenggunaRow({ kelompokKode: 'ZZZ' })] })

    expect(res.body.data.gagal).toBe(1)
    expect(res.body.data.log[0].alasan).toMatch(/Kode kelompok "ZZZ" tidak ditemukan/)
  })

  it('sukses membuat user dengan password ter-hash, bukan plaintext', async () => {
    mockedUserCreate.mockResolvedValue({ id: 1 })
    const res = await request(app)
      .post('/api/import/pengguna')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ rows: [basePenggunaRow()] })

    expect(res.body.data.berhasil).toBe(1)
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
    expect(mockedUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'hashed:password123',
          role: 'STAF_ADMIN',
        }),
      }),
    )
    const createCall = mockedUserCreate.mock.calls[0][0]
    expect(createCall.data.password).toBeUndefined()
  })
})
