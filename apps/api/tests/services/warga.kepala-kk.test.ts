/**
 * Kasus produksi 2026-10-07 (Tri Endah Sulantari): warga Kepala KK dipindah ke KK lain / dijadikan Kepala KK baru.
 * KK lama (kosong) tetap menunjuk dia sebagai kepala → Data Keluarga menampilkan dua baris dengan kepala yang sama.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let warga: Record<string, any>
const tx: any = {
  keluarga: {
    create: vi.fn(async ({ data }: any) => ({ id: 105, ...data })),
    update: vi.fn(async () => ({})),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  warga: { update: vi.fn(async ({ data }: any) => ({ ...warga, ...data })) },
}
const prisma: any = {
  warga: {
    findUnique: vi.fn(async () => ({ ...warga })),
    update: vi.fn(async ({ data }: any) => ({ ...warga, ...data })),
  },
  keluarga: { updateMany: vi.fn(), findUnique: vi.fn(async () => ({ kelompokId: 12 })) },
  $transaction: vi.fn(async (fn: any) => fn(tx)),
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
vi.mock('../../src/utils/crypto.js', () => ({ encryptField: (v: any) => v, decryptField: (v: any) => v }))

const { updateWarga } = await import('../../src/services/warga.service.js')
const admin: any = { userId: 1, role: 'SUPERADMIN', kelompokId: null }

beforeEach(() => {
  vi.clearAllMocks()
  warga = { id: 145, namaLengkap: 'Tri Endah', statusKeluarga: 'KEPALA', keluargaId: 87, konsenPDP: false, keluarga: { kelompokId: 12 } }
})

const lepasDipanggil = () => tx.keluarga.updateMany.mock.calls.map((c: any[]) => c[0])

describe('Kepala KK yang meninggalkan KK-nya tidak boleh tetap tercatat sebagai kepala di KK lama', () => {
  it('dipindah ke KK lain (jadi LAINNYA di KK 70) → penunjuk kepala KK 87 dikosongkan', async () => {
    await updateWarga(145, { statusKeluarga: 'LAINNYA', keluargaId: 70 } as any, 1, admin)
    expect(lepasDipanggil()).toEqual([{ where: { id: 87, kepalakeluargaId: 145 }, data: { kepalakeluargaId: null } }])
    expect(tx.warga.update.mock.calls[0][0].data).toMatchObject({ keluargaId: 70 })
  })

  it('status berubah dari KEPALA ke ISTRI di KK yang sama → penunjuk dikosongkan', async () => {
    await updateWarga(145, { statusKeluarga: 'ISTRI' } as any, 1, admin)
    expect(lepasDipanggil()).toHaveLength(1)
    expect(lepasDipanggil()[0].where).toEqual({ id: 87, kepalakeluargaId: 145 })
  })

  it('Kepala KK 87 membentuk KK baru (KK 105) → KK lama dilepas, KK baru ditunjuk sebagai miliknya', async () => {
    await updateWarga(145, { statusKeluarga: 'KEPALA', keluargaId: null } as any, 1, admin,
      { kelompokId: 12, alamat: 'Jl. Kayu Jati V No.31' } as any)
    expect(lepasDipanggil()[0].where).toEqual({ id: 87, kepalakeluargaId: 145 })
    expect(tx.keluarga.update.mock.calls[0][0].data).toMatchObject({ kepalakeluargaId: 145 })
    expect(tx.warga.update.mock.calls[0][0].data).toMatchObject({ keluargaId: 105 })
  })

  it('bukan Kepala (anggota biasa) pindah KK → tidak menyentuh penunjuk kepala KK mana pun', async () => {
    warga.statusKeluarga = 'ANAK'
    await updateWarga(145, { keluargaId: 70 } as any, 1, admin)
    expect(tx.keluarga.updateMany).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('tetap Kepala di KK yang sama (edit biasa) → tidak ada pelepasan, tanpa transaksi tambahan', async () => {
    await updateWarga(145, { pekerjaan: 'Guru' } as any, 1, admin)
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.warga.update).toHaveBeenCalled()
  })

  it('hanya mengosongkan bila warga ini memang kepalanya (where memuat kepalakeluargaId = id warga)', async () => {
    await updateWarga(145, { statusKeluarga: 'LAINNYA', keluargaId: 70 } as any, 1, admin)
    expect(lepasDipanggil()[0].where.kepalakeluargaId).toBe(145)
  })
})
