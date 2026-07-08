import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    perpindahan: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    warga: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const {
  createPerpindahan,
  approvePerpindahan,
  validatePerpindahan,
  deletePerpindahan,
} = await import('../../src/services/perpindahan.service.js')

const mockedPerpindahanFindUnique = prisma.perpindahan.findUnique as ReturnType<typeof vi.fn>
const mockedPerpindahanCreate = prisma.perpindahan.create as ReturnType<typeof vi.fn>
const mockedPerpindahanUpdate = prisma.perpindahan.update as ReturnType<typeof vi.fn>
const mockedPerpindahanDelete = prisma.perpindahan.delete as ReturnType<typeof vi.fn>
const mockedWargaFindUnique = prisma.warga.findUnique as ReturnType<typeof vi.fn>
const mockedWargaUpdate = prisma.warga.update as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

function basePerpindahan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    wargaId: 10,
    jenis: 'KELUAR',
    gerejaAsalTujuan: 'GKJ Lain',
    tanggalPerpindahan: new Date('2026-01-01'),
    nomorSurat: null,
    approvedBy: null,
    approvedAt: null,
    validatedBy: null,
    validatedAt: null,
    keterangan: null,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('createPerpindahan', () => {
  it('sukses membuat record dengan approvedBy dan validatedBy null', async () => {
    mockedWargaFindUnique.mockResolvedValue({ id: 10 })
    mockedPerpindahanCreate.mockResolvedValue(basePerpindahan())

    const result = await createPerpindahan({ wargaId: 10, jenis: 'KELUAR' })

    expect(result.approvedBy).toBeNull()
    expect(result.validatedBy).toBeNull()
    expect(mockedPerpindahanCreate).toHaveBeenCalled()
  })

  it('melempar 404 jika wargaId tidak ditemukan', async () => {
    mockedWargaFindUnique.mockResolvedValue(null)
    await expect(createPerpindahan({ wargaId: 999, jenis: 'KELUAR' }))
      .rejects.toThrow('Warga tidak ditemukan')
  })
})

describe('approvePerpindahan', () => {
  it('sukses meng-isi approvedBy/approvedAt tanpa mengubah statusKeanggotaan warga', async () => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan())
    mockedPerpindahanUpdate.mockResolvedValue(basePerpindahan({ approvedBy: 5, approvedAt: new Date() }))

    const result = await approvePerpindahan(1, 5)

    expect(result.approvedBy).toBe(5)
    expect(result.approvedAt).not.toBeNull()
    expect(mockedWargaUpdate).not.toHaveBeenCalled()
    expect(mockedPerpindahanUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ approvedBy: 5 }),
      }),
    )
  })

  it('melempar 400 jika sudah pernah di-approve', async () => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan({ approvedBy: 5 }))
    await expect(approvePerpindahan(1, 5)).rejects.toThrow('sudah di-approve sebelumnya')
  })
})

describe('validatePerpindahan', () => {
  it('melempar 400 jika belum di-approve, dan tidak ada update yang jalan', async () => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan())
    await expect(validatePerpindahan(1, 7)).rejects.toThrow('harus di-approve terlebih dahulu')
    expect(mockedWargaUpdate).not.toHaveBeenCalled()
    expect(mockedPerpindahanUpdate).not.toHaveBeenCalled()
  })

  it('melempar 400 jika sudah pernah divalidasi, dan tidak ada update kedua yang jalan', async () => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan({ approvedBy: 5, validatedBy: 7 }))
    await expect(validatePerpindahan(1, 7)).rejects.toThrow('sudah divalidasi sebelumnya')
    expect(mockedWargaUpdate).not.toHaveBeenCalled()
    expect(mockedPerpindahanUpdate).not.toHaveBeenCalled()
  })

  it.each([
    ['MASUK', 'AKTIF'],
    ['KELUAR', 'PINDAH_KELUAR'],
    ['MENINGGAL', 'MENINGGAL'],
  ])('sukses divalidasi untuk jenis %s dan meng-update statusKeanggotaan warga ke %s', async (jenis, statusExpected) => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan({ jenis, approvedBy: 5 }))
    mockedWargaUpdate.mockResolvedValue({})
    mockedPerpindahanUpdate.mockResolvedValue(
      basePerpindahan({ jenis, approvedBy: 5, validatedBy: 7, validatedAt: new Date() }),
    )

    const result = await validatePerpindahan(1, 7)

    expect(result.validatedBy).toBe(7)
    expect(mockedWargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: { statusKeanggotaan: statusExpected },
      }),
    )
  })
})

describe('deletePerpindahan', () => {
  it('melempar 400 jika sudah approved (dengan atau tanpa validated)', async () => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan({ approvedBy: 5 }))
    await expect(deletePerpindahan(1)).rejects.toThrow('sudah di-approve tidak bisa dihapus')
    expect(mockedPerpindahanDelete).not.toHaveBeenCalled()
  })

  it('sukses menghapus jika belum di-approve', async () => {
    mockedPerpindahanFindUnique.mockResolvedValue(basePerpindahan())
    mockedPerpindahanDelete.mockResolvedValue({})

    await deletePerpindahan(1)

    expect(mockedPerpindahanDelete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
