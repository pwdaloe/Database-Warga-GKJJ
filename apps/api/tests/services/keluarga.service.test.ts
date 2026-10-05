import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    keluarga: {
      findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { listKeluarga, getKeluargaById, createKeluarga, updateKeluarga } =
  await import('../../src/services/keluarga.service.js')

const m = prisma.keluarga as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockedTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
const user = (role: string, kelompokId: number | null = null) => ({ userId: 1, role, kelompokId }) as any

beforeEach(() => {
  vi.clearAllMocks()
  m.findMany.mockResolvedValue([])
  m.count.mockResolvedValue(0)
  m.create.mockImplementation(async (a: any) => ({ id: 1, ...a.data }))
  m.update.mockImplementation(async (a: any) => ({ id: a.where.id, ...a.data }))
  // createKeluarga berjalan dalam transaksi: tx memakai mock yang sama
  m.findUniqueOrThrow.mockResolvedValue({ id: 1, nomorKeluarga: 'KLG00001' })
  mockedTransaction.mockImplementation(async (fn: any) =>
    fn({ keluarga: { create: m.create, update: m.update, findUniqueOrThrow: m.findUniqueOrThrow } }),
  )
})

describe('listKeluarga — scoping penatua', () => {
  it('penatua dengan kelompok → dibatasi ke kelompoknya, filter caller diabaikan', async () => {
    await listKeluarga({ kelompokId: 99 }, user('PENATUA_KELOMPOK', 3))
    expect(m.findMany.mock.calls[0][0].where.kelompokId).toBe(3)
  })

  it('penatua TANPA kelompok → tidak melihat apa pun (fail-closed), bukan semua data', async () => {
    await listKeluarga({}, user('PENATUA_KELOMPOK', null))
    expect(m.findMany.mock.calls[0][0].where.id).toBe(-1)
  })

  it('role lain melihat semua dan boleh memfilter', async () => {
    await listKeluarga({ kelompokId: 5 }, user('STAF_ADMIN'))
    const where = m.findMany.mock.calls[0][0].where
    expect(where.kelompokId).toBe(5)
    expect(where.id).toBeUndefined()
  })
})

describe('getKeluargaById — scoping penatua', () => {
  it('KK kelompok sendiri → lolos', async () => {
    m.findUnique.mockResolvedValue({ id: 1, kelompokId: 3 })
    await expect(getKeluargaById(1, user('PENATUA_KELOMPOK', 3))).resolves.toBeTruthy()
  })
  it('KK kelompok lain → 403', async () => {
    m.findUnique.mockResolvedValue({ id: 1, kelompokId: 9 })
    await expect(getKeluargaById(1, user('PENATUA_KELOMPOK', 3))).rejects.toMatchObject({ statusCode: 403 })
  })
  it('penatua tanpa kelompok → 403 (fail-closed)', async () => {
    m.findUnique.mockResolvedValue({ id: 1, kelompokId: 3 })
    await expect(getKeluargaById(1, user('PENATUA_KELOMPOK', null))).rejects.toMatchObject({ statusCode: 403 })
  })
  it('role lain → lolos', async () => {
    m.findUnique.mockResolvedValue({ id: 1, kelompokId: 9 })
    await expect(getKeluargaById(1, user('MAJELIS'))).resolves.toBeTruthy()
  })
})

describe('createKeluarga / updateKeluarga — batas tulis penatua', () => {
  it('penatua membuat KK di kelompok sendiri → lolos', async () => {
    m.count.mockResolvedValue(0)
    await expect(createKeluarga({ kelompokId: 3 } as any, 1, user('PENATUA_KELOMPOK', 3))).resolves.toBeTruthy()
  })
  it('penatua membuat KK di kelompok lain → 403, tidak ada create', async () => {
    await expect(createKeluarga({ kelompokId: 9 } as any, 1, user('PENATUA_KELOMPOK', 3))).rejects.toMatchObject({ statusCode: 403 })
    expect(m.create).not.toHaveBeenCalled()
  })
  it('penatua membuat KK tanpa kelompok → 403', async () => {
    await expect(createKeluarga({} as any, 1, user('PENATUA_KELOMPOK', 3))).rejects.toMatchObject({ statusCode: 403 })
  })
  it('role lain bebas memilih kelompok; panggilan tanpa user tetap berfungsi', async () => {
    await expect(createKeluarga({ kelompokId: 9 } as any, 1, user('STAF_ADMIN'))).resolves.toBeTruthy()
    await expect(createKeluarga({ kelompokId: 9 } as any, 1)).resolves.toBeTruthy()
  })

  it('penatua mengubah KK kelompok lain → 403', async () => {
    m.findUniqueOrThrow.mockResolvedValue({ id: 1, kelompokId: 9 })
    await expect(updateKeluarga(1, { alamat: 'x' } as any, 1, user('PENATUA_KELOMPOK', 3))).rejects.toMatchObject({ statusCode: 403 })
    expect(m.update).not.toHaveBeenCalled()
  })
  it('penatua memindahkan KK-nya ke kelompok lain → 403', async () => {
    m.findUniqueOrThrow.mockResolvedValue({ id: 1, kelompokId: 3 })
    await expect(updateKeluarga(1, { kelompokId: 9 } as any, 1, user('PENATUA_KELOMPOK', 3))).rejects.toMatchObject({ statusCode: 403 })
  })
  it('penatua mengubah alamat KK sendiri → lolos', async () => {
    m.findUniqueOrThrow.mockResolvedValue({ id: 1, kelompokId: 3 })
    await expect(updateKeluarga(1, { alamat: 'Jl. Baru' } as any, 1, user('PENATUA_KELOMPOK', 3))).resolves.toBeTruthy()
    expect(m.update).toHaveBeenCalled()
  })
})

describe('createKeluarga — penomoran KK berbasis ID', () => {
  it('nomor = KLG + ID baris, tidak memakai count() (yang bisa lebih kecil dari ID setelah ada KK terhapus)', async () => {
    m.count.mockResolvedValue(3)                       // jumlah baris 3, tetapi ID baru 10
    m.create.mockResolvedValue({ id: 10 })
    await createKeluarga({ kelompokId: 3 } as any, 1)

    expect(m.update).toHaveBeenCalledWith({ where: { id: 10 }, data: { nomorKeluarga: 'KLG00010' } })
    expect(m.count).not.toHaveBeenCalled()
  })

  it('create dipanggil tanpa nomorKeluarga (diisi setelah ID diketahui, dalam transaksi yang sama)', async () => {
    m.create.mockResolvedValue({ id: 7 })
    await createKeluarga({ kelompokId: 3, alamat: 'Jl. A' } as any, 9)
    const data = m.create.mock.calls[0][0].data
    expect(data.nomorKeluarga).toBeUndefined()
    expect(data).toMatchObject({ alamat: 'Jl. A', createdBy: 9, updatedBy: 9 })
    expect(mockedTransaction).toHaveBeenCalledTimes(1)
  })

  it('dua pembuatan berurutan menghasilkan nomor berbeda', async () => {
    m.create.mockResolvedValueOnce({ id: 10 }).mockResolvedValueOnce({ id: 11 })
    await createKeluarga({ kelompokId: 3 } as any, 1)
    await createKeluarga({ kelompokId: 3 } as any, 1)
    const nomor = m.update.mock.calls.map((c: any) => c[0].data.nomorKeluarga)
    expect(nomor).toEqual(['KLG00010', 'KLG00011'])
  })

  it('ID besar tidak terpotong dan tetap muat di kolom (VARCHAR 20)', async () => {
    m.create.mockResolvedValue({ id: 123456 })
    await createKeluarga({ kelompokId: 3 } as any, 1)
    const nomor = m.update.mock.calls[0][0].data.nomorKeluarga
    expect(nomor).toBe('KLG123456')
    expect(nomor.length).toBeLessThanOrEqual(20)
  })

  it('mengembalikan KK lengkap (relasi) setelah nomor terisi', async () => {
    m.create.mockResolvedValue({ id: 10 })
    m.findUniqueOrThrow.mockResolvedValue({ id: 10, nomorKeluarga: 'KLG00010', kelompok: { nama: 'X' } })
    const hasil: any = await createKeluarga({ kelompokId: 3 } as any, 1)
    expect(hasil.nomorKeluarga).toBe('KLG00010')
    expect(m.findUniqueOrThrow.mock.calls[0][0].where).toEqual({ id: 10 })
  })
})
