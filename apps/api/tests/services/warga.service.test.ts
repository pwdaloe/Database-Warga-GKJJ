import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    warga: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    keluarga: {
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn({
      keluarga: { create: vi.fn(), update: vi.fn() },
      warga: { create: vi.fn(), update: vi.fn() },
    })),
  },
}))

vi.mock('../../src/utils/crypto.js', () => ({
  encryptField: vi.fn((v: string | null | undefined) => (v ? `enc:${v}` : v ?? null)),
  decryptField: vi.fn((v: string | null | undefined) =>
    v ? String(v).replace(/^enc:/, '') : v ?? null,
  ),
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { encryptField } = await import('../../src/utils/crypto.js')
const {
  listWarga,
  getWargaById,
  createWarga,
  updateWarga,
  deleteWarga,
  bulkValidasiWarga,
} = await import('../../src/services/warga.service.js')

const mockedFindUnique = prisma.warga.findUnique as ReturnType<typeof vi.fn>
const mockedFindMany   = prisma.warga.findMany   as ReturnType<typeof vi.fn>
const mockedCount      = prisma.warga.count      as ReturnType<typeof vi.fn>
const mockedCreate     = prisma.warga.create     as ReturnType<typeof vi.fn>
const mockedUpdate     = prisma.warga.update     as ReturnType<typeof vi.fn>
const mockedDelete     = prisma.warga.delete     as ReturnType<typeof vi.fn>
const mockedUpdateMany = prisma.warga.updateMany as ReturnType<typeof vi.fn>
const mockedUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>
const mockedTransaction = prisma.$transaction as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockedTransaction.mockImplementation(async (fn: any) =>
    fn({
      keluarga: { create: vi.fn(), update: vi.fn() },
      warga: { create: vi.fn(), update: vi.fn() },
    }),
  )
})

function baseWarga(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    namaLengkap: 'Budi Santoso',
    nik: 'enc:3171234567890001',
    telepon: '08123456789',
    whatsapp: '08123456789',
    email: 'budi@example.com',
    alamatKtp: 'Jl. Merdeka No. 1',
    latitude: -6.2,
    longitude: 106.8,
    keluarga: { id: 5, kelompokId: 3 },
    statusKeluarga: 'KEPALA',
    konsenPDP: false,
    tanggalKonsen: null,
    ...overrides,
  }
}

function user(role: string, kelompokId: number | null = null) {
  return { userId: 1, role, kelompokId } as any
}

describe('listWarga', () => {
  it('scope otomatis ke kelompok sendiri untuk PENATUA_KELOMPOK, mengabaikan filter caller', async () => {
    mockedCount.mockResolvedValue(0)
    mockedFindMany.mockResolvedValue([])

    await listWarga({ kelompokId: 999, wilayahId: 888 }, user('PENATUA_KELOMPOK', 3))

    const callArgs = mockedFindMany.mock.calls[0][0]
    expect(callArgs.where.keluarga).toEqual({ kelompokId: 3 })
  })

  it('search dengan pola NIK memanggil encryptField dan menambah kondisi exact-match', async () => {
    mockedCount.mockResolvedValue(0)
    mockedFindMany.mockResolvedValue([])

    await listWarga({ search: '3171234567890001' }, user('SUPERADMIN'))

    expect(encryptField).toHaveBeenCalledWith('3171234567890001')
    const callArgs = mockedFindMany.mock.calls[0][0]
    expect(callArgs.where.OR).toEqual(
      expect.arrayContaining([{ nik: 'enc:3171234567890001' }]),
    )
  })

  it('search bukan pola NIK tidak menambah kondisi NIK exact-match', async () => {
    mockedCount.mockResolvedValue(0)
    mockedFindMany.mockResolvedValue([])

    await listWarga({ search: 'Budi' }, user('SUPERADMIN'))

    const callArgs = mockedFindMany.mock.calls[0][0]
    expect(callArgs.where.OR).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ nik: expect.anything() })]),
    )
  })

  it('redaksi field sensitif untuk role VIEWER', async () => {
    mockedCount.mockResolvedValue(1)
    mockedFindMany.mockResolvedValue([baseWarga()])

    const result = await listWarga({}, user('VIEWER'))

    expect(result.data[0].nik).toBeNull()
    expect(result.data[0].alamatKtp).toBeNull()
    expect(result.data[0].telepon).toBeNull()
    expect(result.data[0].whatsapp).toBeNull()
    expect(result.data[0].email).toBeNull()
    expect(result.data[0].latitude).toBeNull()
    expect(result.data[0].longitude).toBeNull()
  })

  it('tidak ada redaksi untuk role SUPERADMIN/KEPALA_KANTOR', async () => {
    mockedCount.mockResolvedValue(1)
    mockedFindMany.mockResolvedValue([baseWarga()])

    const result = await listWarga({}, user('KEPALA_KANTOR'))

    expect(result.data[0].nik).toBe('3171234567890001')
    expect(result.data[0].alamatKtp).toBe('Jl. Merdeka No. 1')
    expect(result.data[0].email).toBe('budi@example.com')
  })
})

describe('getWargaById', () => {
  it('melempar 404 jika data tidak ditemukan', async () => {
    mockedFindUnique.mockResolvedValue(null)
    await expect(getWargaById(999, user('SUPERADMIN'))).rejects.toThrow('Data warga tidak ditemukan')
  })

  it('melempar 403 jika PENATUA_KELOMPOK mengakses warga di luar kelompoknya', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga({ keluarga: { id: 5, kelompokId: 99 } }))
    await expect(getWargaById(1, user('PENATUA_KELOMPOK', 3)))
      .rejects.toThrow('Tidak memiliki akses ke data warga ini')
  })

  it('sukses jika PENATUA_KELOMPOK mengakses warga di kelompoknya sendiri', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga({ keluarga: { id: 5, kelompokId: 3 } }))
    const result = await getWargaById(1, user('PENATUA_KELOMPOK', 3))
    expect(result.id).toBe(1)
  })
})

describe('createWarga', () => {
  it('NIK dienkripsi sebelum create dipanggil', async () => {
    let capturedData: any
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: vi.fn(), update: vi.fn() },
        warga: {
          create: vi.fn(async (args: any) => {
            capturedData = args.data
            return { id: 1, ...args.data }
          }),
          update: vi.fn(async () => ({})),
        },
      }),
    )

    await createWarga({ namaLengkap: 'Budi', nik: '3171234567890001' } as any, 1)

    expect(capturedData.nik).toBe('enc:3171234567890001')
  })

  it('konsenPDP=true mengisi tanggalKonsen dengan tanggal server, bukan dari input client', async () => {
    let capturedData: any
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: vi.fn(), update: vi.fn() },
        warga: {
          create: vi.fn(async (args: any) => {
            capturedData = args.data
            return { id: 1, ...args.data }
          }),
          update: vi.fn(async () => ({})),
        },
      }),
    )

    await createWarga(
      { namaLengkap: 'Budi', konsenPDP: true, tanggalKonsen: new Date('2000-01-01') } as any,
      1,
    )

    expect(capturedData.konsenPDP).toBe(true)
    expect(capturedData.tanggalKonsen).toBeInstanceOf(Date)
    expect(capturedData.tanggalKonsen.getFullYear()).not.toBe(2000)
  })

  it('konsenPDP tidak dikirim → tanggalKonsen tetap null', async () => {
    let capturedData: any
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: vi.fn(), update: vi.fn() },
        warga: {
          create: vi.fn(async (args: any) => {
            capturedData = args.data
            return { id: 1, ...args.data }
          }),
          update: vi.fn(async () => ({})),
        },
      }),
    )

    await createWarga({ namaLengkap: 'Budi' } as any, 1)

    expect(capturedData.konsenPDP).toBe(false)
    expect(capturedData.tanggalKonsen).toBeNull()
  })

  it('membuat keluarga baru dalam transaksi jika newKeluarga diberikan tanpa keluargaId', async () => {
    const keluargaCreate = vi.fn(async () => ({ id: 20 }))
    const keluargaUpdate = vi.fn(async () => ({}))
    const wargaCreate = vi.fn(async (args: any) => ({ id: 1, ...args.data }))
    const wargaUpdate = vi.fn(async () => ({}))
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: keluargaCreate, update: keluargaUpdate },
        warga: { create: wargaCreate, update: wargaUpdate },
      }),
    )

    await createWarga(
      { namaLengkap: 'Budi', statusKeluarga: 'KEPALA' } as any,
      1,
      { kelompokId: 3 },
    )

    expect(keluargaCreate).toHaveBeenCalled()
    expect(keluargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 20 }, data: { nomorKeluarga: 'KLG00020' } }),
    )
  })

  it('statusKeluarga KEPALA → keluarga.kepalakeluargaId di-update ke id warga baru', async () => {
    const keluargaUpdate = vi.fn(async () => ({}))
    const wargaCreate = vi.fn(async (args: any) => ({ id: 42, ...args.data }))
    const wargaUpdate = vi.fn(async () => ({}))
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: vi.fn(), update: keluargaUpdate },
        warga: { create: wargaCreate, update: wargaUpdate },
      }),
    )

    await createWarga(
      { namaLengkap: 'Budi', statusKeluarga: 'KEPALA', keluargaId: 5 } as any,
      1,
    )

    expect(keluargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 }, data: { kepalakeluargaId: 42 } }),
    )
  })

  it('nomorAnggota di-generate dari ID warga setelah insert', async () => {
    const wargaCreate = vi.fn(async (args: any) => ({ id: 7, ...args.data }))
    const wargaUpdate = vi.fn(async () => ({}))
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: vi.fn(), update: vi.fn() },
        warga: { create: wargaCreate, update: wargaUpdate },
      }),
    )

    const result = await createWarga({ namaLengkap: 'Budi' } as any, 1)

    expect(wargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: { nomorAnggota: 'WRG00007' } }),
    )
    expect(result.nomorAnggota).toBe('WRG00007')
  })
})

describe('updateWarga', () => {
  it('transisi konsen belum-setuju → setuju mengisi tanggalKonsen baru', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga({ konsenPDP: false, tanggalKonsen: null }))
    mockedUpdate.mockImplementation(async (args: any) => ({ id: 1, ...args.data }))

    const result = await updateWarga(1, { konsenPDP: true } as any, 1, user('SUPERADMIN'))

    expect(result.tanggalKonsen).toBeInstanceOf(Date)
  })

  it('menarik konsen (konsenPDP=false) mengosongkan tanggalKonsen', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga({ konsenPDP: true, tanggalKonsen: new Date('2026-01-01') }))
    mockedUpdate.mockImplementation(async (args: any) => ({ id: 1, ...args.data }))

    const result = await updateWarga(1, { konsenPDP: false } as any, 1, user('SUPERADMIN'))

    expect(result.tanggalKonsen).toBeNull()
  })

  it('konsen tetap true → true tidak mengubah tanggalKonsen lama', async () => {
    const tanggalLama = new Date('2026-01-01')
    mockedFindUnique.mockResolvedValue(baseWarga({ konsenPDP: true, tanggalKonsen: tanggalLama }))
    mockedUpdate.mockImplementation(async (args: any) => ({ id: 1, ...args.data }))

    const result = await updateWarga(1, { konsenPDP: true } as any, 1, user('SUPERADMIN'))

    expect(result.tanggalKonsen).toBeUndefined()
  })

  it('upgrade jadi KEPALA tanpa keluargaId + newKeluarga → buat KK baru dalam transaksi terpisah', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga({ keluarga: null }))
    const keluargaCreate = vi.fn(async () => ({ id: 30 }))
    const keluargaUpdate = vi.fn(async () => ({}))
    const wargaUpdate = vi.fn(async (args: any) => ({ id: 1, ...args.data }))
    mockedTransaction.mockImplementation(async (fn: any) =>
      fn({
        keluarga: { create: keluargaCreate, update: keluargaUpdate },
        warga: { update: wargaUpdate },
      }),
    )

    await updateWarga(
      1,
      { statusKeluarga: 'KEPALA' } as any,
      1,
      user('SUPERADMIN'),
      { kelompokId: 3 },
    )

    expect(keluargaCreate).toHaveBeenCalled()
    expect(keluargaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 30 }, data: expect.objectContaining({ kepalakeluargaId: 1 }) }),
    )
    expect(mockedUpdate).not.toHaveBeenCalled()
  })
})

describe('deleteWarga', () => {
  it('melempar 404 jika warga tidak ditemukan', async () => {
    mockedFindUnique.mockResolvedValue(null)
    await expect(deleteWarga(999)).rejects.toThrow('Data warga tidak ditemukan')
  })

  it('melempar 400 jika warga punya akun user terkait', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga())
    mockedUserFindUnique.mockResolvedValue({ id: 1, wargaId: 1 })

    await expect(deleteWarga(1)).rejects.toThrow('memiliki akun user')
    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it('sukses menghapus jika tidak ada akun terkait', async () => {
    mockedFindUnique.mockResolvedValue(baseWarga())
    mockedUserFindUnique.mockResolvedValue(null)

    await deleteWarga(1)

    expect(mockedDelete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

describe('bulkValidasiWarga', () => {
  it('melempar 400 jika ids kosong', async () => {
    await expect(bulkValidasiWarga([], 'validate', 1, user('SUPERADMIN')))
      .rejects.toThrow('Tidak ada data yang dipilih')
  })

  it('melempar 400 jika ids lebih dari 500', async () => {
    const ids = Array.from({ length: 501 }, (_, i) => i + 1)
    await expect(bulkValidasiWarga(ids, 'validate', 1, user('SUPERADMIN')))
      .rejects.toThrow('Maksimal 500 data sekaligus')
  })

  it('melempar 403 jika role PENATUA_KELOMPOK', async () => {
    await expect(bulkValidasiWarga([1, 2], 'validate', 1, user('PENATUA_KELOMPOK', 3)))
      .rejects.toThrow('Tidak memiliki akses untuk memvalidasi data')
  })

  it('action validate hanya meng-update warga dengan dataStatus DRAFT', async () => {
    mockedUpdateMany.mockResolvedValue({ count: 2 })

    const result = await bulkValidasiWarga([1, 2], 'validate', 9, user('SUPERADMIN'))

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] }, dataStatus: 'DRAFT' },
      data: expect.objectContaining({ dataStatus: 'AKTIF', validatedBy: 9 }),
    })
    expect(result.updated).toBe(2)
  })

  it('action revert hanya meng-update warga dengan dataStatus AKTIF, mengosongkan validatedBy/validatedAt', async () => {
    mockedUpdateMany.mockResolvedValue({ count: 1 })

    await bulkValidasiWarga([1], 'revert', 9, user('SUPERADMIN'))

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [1] }, dataStatus: 'AKTIF' },
      data: { dataStatus: 'DRAFT', validatedBy: null, validatedAt: null },
    })
  })
})
