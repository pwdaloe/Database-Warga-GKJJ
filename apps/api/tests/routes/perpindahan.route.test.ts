import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

vi.mock('../../src/services/perpindahan.service.js', () => ({
  listPerpindahan: vi.fn(),
  getPerpindahanById: vi.fn(),
  createPerpindahan: vi.fn(),
  updatePerpindahan: vi.fn(),
  approvePerpindahan: vi.fn(),
  validatePerpindahan: vi.fn(),
  deletePerpindahan: vi.fn(),
}))

const perpindahanService = await import('../../src/services/perpindahan.service.js')
const { default: app } = await import('../../src/app.js')

const mockedGetById = perpindahanService.getPerpindahanById as ReturnType<typeof vi.fn>
const mockedValidate = perpindahanService.validatePerpindahan as ReturnType<typeof vi.fn>

let staffToken: string
let majelisToken: string
let superadminToken: string

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  staffToken = jwt.sign({ userId: 1, role: UserRole.STAF_ADMIN, kelompokId: null }, process.env.JWT_SECRET)
  majelisToken = jwt.sign({ userId: 2, role: UserRole.MAJELIS, kelompokId: null }, process.env.JWT_SECRET)
  superadminToken = jwt.sign({ userId: 3, role: UserRole.SUPERADMIN, kelompokId: null }, process.env.JWT_SECRET)
})

beforeEach(() => {
  vi.clearAllMocks()
})

function basePerpindahan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    wargaId: 10,
    jenis: 'KELUAR',
    approvedBy: null,
    approvedAt: null,
    validatedBy: null,
    validatedAt: null,
    warga: { id: 10, namaLengkap: 'Budi Santoso', email: null },
    ...overrides,
  }
}

describe('POST /api/perpindahan', () => {
  it('return 403 jika role tidak sesuai (VIEWER tidak boleh mencatat pengajuan)', async () => {
    const viewerToken = jwt.sign({ userId: 9, role: UserRole.VIEWER, kelompokId: null }, process.env.JWT_SECRET!)
    const res = await request(app)
      .post('/api/perpindahan')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ wargaId: 10, jenis: 'KELUAR' })

    expect(res.status).toBe(403)
  })

  it('return 400 jika body invalid (jenis bukan enum valid)', async () => {
    const res = await request(app)
      .post('/api/perpindahan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ wargaId: 10, jenis: 'TIDAK_VALID' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/perpindahan/:id/validate', () => {
  it('return 403 jika role MAJELIS (hanya KEPALA_KANTOR/SUPERADMIN)', async () => {
    const res = await request(app)
      .post('/api/perpindahan/1/validate')
      .set('Authorization', `Bearer ${majelisToken}`)
      .send({})

    expect(res.status).toBe(403)
    expect(mockedValidate).not.toHaveBeenCalled()
  })

  it('return 200 jika role SUPERADMIN', async () => {
    mockedValidate.mockResolvedValue(basePerpindahan({ approvedBy: 5, validatedBy: 3 }))
    const res = await request(app)
      .post('/api/perpindahan/1/validate')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({})

    expect(res.status).toBe(200)
  })
})

describe('POST /api/perpindahan/:id/kirim-email', () => {
  it('return 400 dengan pesan jelas jika validatedBy masih null', async () => {
    mockedGetById.mockResolvedValue(basePerpindahan({ validatedBy: null }))

    const res = await request(app)
      .post('/api/perpindahan/1/kirim-email')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/belum divalidasi/)
  })

  it('return 400 dengan pesan jelas jika sudah validated tapi warga.email null', async () => {
    mockedGetById.mockResolvedValue(
      basePerpindahan({ validatedBy: 3, warga: { id: 10, namaLengkap: 'Budi Santoso', email: null } }),
    )

    const res = await request(app)
      .post('/api/perpindahan/1/kirim-email')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/belum memiliki alamat email/)
  })
})
