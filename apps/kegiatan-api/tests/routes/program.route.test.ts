import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { buatPrisma, masuk, pengguna, programDb, tahunDb, type PenggunaUji } from '../helpers/harness.js'
import { KODE_CHECKLIST } from '../../src/constants/checklist.js'

const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.logAudit.create.mockResolvedValue({})
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma))
})

const pengurus = pengguna('PENGURUS_UPK') // unit 5
const bodyLengkap = (ubah: Record<string, unknown> = {}) => ({
  judul: 'Retreat Remaja', latarBelakang: 'L', kebutuhan: 'K', tujuan: 'T', sasaranPenerima: 'S', evaluasi: 'E', picNama: 'PIC', picWhatsapp: '081234567890',
  acuanIds: [100],
  jadwal: [{ nama: 'Retreat', kategoriWaktu: 'SEKALI', tanggalMulai: '2027-06-01' }],
  indikator: [{ indikator: 'Hadir', target: '20', bukti: 'Daftar hadir' }],
  rab: [{ uraian: 'Konsumsi', volume: 2, satuan: 'Orang', hargaSatuan: 100 }],
  sumberDana: [{ jenis: 'GEREJA', nilai: 200 }],
  checklist: Object.fromEntries(KODE_CHECKLIST.map((k) => [k, true])),
  ...ubah,
})

function siapBuat(status: 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP' = 'DIBUKA') {
  prisma.tahunAnggaran.findFirst.mockResolvedValue(tahunDb(status))
  prisma.unit.findUnique.mockImplementation(async ({ where }: { where: { id: number } }) => ({ id: where.id, kode: `U${where.id}`, aktif: true }))
  prisma.acuanStrategis.count.mockResolvedValue(1)
  prisma.programKerja.create.mockResolvedValue({ id: 10 })
  prisma.programKerja.update.mockResolvedValue({})
  prisma.programKerja.findUnique.mockResolvedValue(programDb())
}

describe('GET /api/program (daftar)', () => {
  it('pengurus: filter dipaksa ke unitnya sendiri', async () => {
    const h = masuk(prisma, pengurus)
    prisma.programKerja.findMany.mockResolvedValue([])
    await request(app).get('/api/program').set(h)
    expect(prisma.programKerja.findMany.mock.calls[0]![0].where.unitId).toBe(5)
  })

  it('pengurus meminta unit lain → kosong dan database tidak dibaca', async () => {
    const h = masuk(prisma, pengurus)
    const res = await request(app).get('/api/program?unitId=6').set(h)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(prisma.programKerja.findMany).not.toHaveBeenCalled()
  })

  it('pengurus tanpa unit → kosong (fail-closed)', async () => {
    const h = masuk(prisma, pengguna('PENGURUS_UPK', { unitId: null }))
    const res = await request(app).get('/api/program').set(h)
    expect(res.body.data).toEqual([])
    expect(prisma.programKerja.findMany).not.toHaveBeenCalled()
  })

  it('koordinator: dibatasi ke bidangnya; majelis dan admin: semua', async () => {
    prisma.programKerja.findMany.mockResolvedValue([])
    await request(app).get('/api/program').set(masuk(prisma, pengguna('KOORDINATOR_BIDANG')))
    expect(prisma.programKerja.findMany.mock.calls[0]![0].where.unit).toEqual({ bidangId: 1 })
    await request(app).get('/api/program').set(masuk(prisma, pengguna('MAJELIS')))
    const w = prisma.programKerja.findMany.mock.calls[1]![0].where
    expect(w.unitId).toBeUndefined()
    expect(w.unit).toBeUndefined()
  })

  it('total dihitung dari baris RAB dan sumber dana (gereja vs mandiri)', async () => {
    const h = masuk(prisma, pengurus)
    prisma.programKerja.findMany.mockResolvedValue([
      programDb({ rab: [{ ...programDb().rab[0], jumlah: 3_000_000n }, { ...programDb().rab[0], id: 2, jumlah: 2_000_000n }],
        sumberDana: [{ id: 1, jenis: 'GEREJA', nilai: 3_000_000n }, { id: 2, jenis: 'SWADAYA', nilai: 1_500_000n }, { id: 3, jenis: 'DONASI', nilai: 500_000n }] }),
    ])
    const res = await request(app).get('/api/program').set(h)
    expect(res.body.data[0]).toMatchObject({ totalRab: 5_000_000, gereja: 3_000_000, mandiri: 2_000_000, selisih: 0 })
  })
})

describe('GET /api/program/:id', () => {
  it('unit sendiri → 200 dengan angka number (bukan string/BigInt)', async () => {
    const h = masuk(prisma, pengurus)
    prisma.programKerja.findUnique.mockResolvedValue(programDb())
    const res = await request(app).get('/api/program/10').set(h)
    expect(res.status).toBe(200)
    expect(res.body.data.totalRab).toBe(1_000_000)
    expect(res.body.data.rab[0].hargaSatuan).toBe(100_000)
    expect(typeof res.body.data.rab[0].jumlah).toBe('number')
  })

  it('unit lain → 404 (bukan 403), keberadaannya tidak terbongkar', async () => {
    const h = masuk(prisma, pengurus)
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ unitId: 6, unit: { id: 6, kode: 'U6', nama: 'U6', singkatan: null, bidangId: 1, jenis: 'UPK' } }))
    expect((await request(app).get('/api/program/10').set(h)).status).toBe(404)
  })

  it('program tidak ada → 404', async () => {
    const h = masuk(prisma, pengurus)
    prisma.programKerja.findUnique.mockResolvedValue(null)
    expect((await request(app).get('/api/program/999').set(h)).status).toBe(404)
    expect((await request(app).put('/api/program/999').set(h).send(bodyLengkap())).status).toBe(404)
    expect((await request(app).post('/api/program/999/ajukan').set(h)).status).toBe(404)
  })

  it('id tidak valid → 400', async () => {
    const h = masuk(prisma, pengurus)
    expect((await request(app).get('/api/program/abc').set(h)).status).toBe(400)
  })
})

describe('POST /api/program (buat draft)', () => {
  it('pengurus: unit dipaksa ke unitnya, mengabaikan unitId di badan', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    const res = await request(app).post('/api/program').set(h).send({ ...bodyLengkap(), unitId: 6 })
    expect(res.status).toBe(201)
    expect(prisma.programKerja.create.mock.calls[0]![0].data.unitId).toBe(5)
  })

  it('jumlah RAB dihitung server dari volume × harga; kiriman "jumlah" klien tidak dipakai', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    await request(app).post('/api/program').set(h).send(bodyLengkap({ rab: [{ uraian: 'x', volume: 3, satuan: 'Orang', hargaSatuan: 1_000_000, jumlah: 1 }] }))
    const item = prisma.programKerja.create.mock.calls[0]![0].data.rab.create[0]
    expect(item.jumlah).toBe(3_000_000n)
    expect(item.hargaSatuan).toBe(1_000_000n)
  })

  it('pengajuan DITUTUP atau BELUM_DIBUKA → 409 dan tidak ada yang ditulis', async () => {
    const h = masuk(prisma, pengurus)
    for (const s of ['DITUTUP', 'BELUM_DIBUKA'] as const) {
      siapBuat(s)
      const res = await request(app).post('/api/program').set(h).send(bodyLengkap())
      expect(res.status).toBe(409)
    }
    expect(prisma.programKerja.create).not.toHaveBeenCalled()
  })

  it('admin boleh membuat atas nama unit saat ditutup; tanpa unit → 400', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    siapBuat('DITUTUP')
    expect((await request(app).post('/api/program').set(h).send({ ...bodyLengkap(), unitId: 7 })).status).toBe(201)
    expect(prisma.programKerja.create.mock.calls[0]![0].data.unitId).toBe(7)
    expect((await request(app).post('/api/program').set(h).send(bodyLengkap())).status).toBe(400)
  })

  it('majelis dan koordinator tidak boleh membuat', async () => {
    siapBuat()
    for (const peran of ['MAJELIS', 'KOORDINATOR_BIDANG'] as const) {
      const h = masuk(prisma, pengguna(peran))
      const res = await request(app).post('/api/program').set(h).send({ ...bodyLengkap(), unitId: 5 })
      expect(res.status).toBe(403)
    }
    expect(prisma.programKerja.create).not.toHaveBeenCalled()
  })

  it('rujukan tidak valid (acuan tahun lain/nonaktif) → 400', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.acuanStrategis.count.mockResolvedValue(0)
    expect((await request(app).post('/api/program').set(h).send(bodyLengkap())).status).toBe(400)
    expect(prisma.programKerja.create).not.toHaveBeenCalled()
  })

  it('program 2026 milik unit lain tidak boleh dirujuk → 400', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.program2026.findUnique.mockResolvedValue({ unitId: 6 })
    expect((await request(app).post('/api/program').set(h).send(bodyLengkap({ program2026Id: 3 }))).status).toBe(400)
  })

  it('validasi bentuk: rupiah desimal/negatif → 400; judul pendek → 400', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    expect((await request(app).post('/api/program').set(h).send(bodyLengkap({ rab: [{ uraian: 'x', volume: 1, satuan: 'a', hargaSatuan: 10.5 }] }))).status).toBe(400)
    expect((await request(app).post('/api/program').set(h).send(bodyLengkap({ judul: 'ab' }))).status).toBe(400)
    expect(prisma.programKerja.create).not.toHaveBeenCalled()
  })

  it('nomor program dibuat dari tahun, kode unit, dan id; audit tercatat', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    await request(app).post('/api/program').set(h).send(bodyLengkap())
    expect(prisma.programKerja.update.mock.calls[0]![0].data.nomor).toBe('2027-U5-0010')
    expect(prisma.logAudit.create.mock.calls[0]![0].data).toMatchObject({ aksi: 'BUAT_PROGRAM', entitas: 'program', entitasId: 10 })
  })
})

describe('PUT /api/program/:id (simpan)', () => {
  it('berhasil: anak program diganti seluruhnya, unit/tahun tidak berubah walau dikirim', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    const res = await request(app).put('/api/program/10').set(h).send({ ...bodyLengkap(), unitId: 99, tahunId: 99 })
    expect(res.status).toBe(200)
    for (const t of ['programAcuan', 'kegiatanJadwal', 'indikator', 'rabItem', 'sumberDana']) expect(prisma[t].deleteMany).toHaveBeenCalledWith({ where: { programId: 10 } })
    const data = prisma.programKerja.update.mock.calls[0]![0].data
    expect(data).not.toHaveProperty('unitId')
    expect(data).not.toHaveProperty('tahunId')
    expect(data.diubahOleh).toBe(1)
  })

  it('program yang sudah DIAJUKAN → 409', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ status: 'DIAJUKAN' }))
    expect((await request(app).put('/api/program/10').set(h).send(bodyLengkap())).status).toBe(409)
    expect(prisma.rabItem.deleteMany).not.toHaveBeenCalled()
  })

  it('pengajuan sudah ditutup → 409', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ tahun: tahunDb('DITUTUP') }))
    expect((await request(app).put('/api/program/10').set(h).send(bodyLengkap())).status).toBe(409)
  })

  it('unit lain → 404 dan tidak ada penghapusan', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ unitId: 6, unit: { id: 6, kode: 'U6', nama: 'U6', singkatan: null, bidangId: 1, jenis: 'UPK' } }))
    expect((await request(app).put('/api/program/10').set(h).send(bodyLengkap())).status).toBe(404)
    expect(prisma.rabItem.deleteMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/program/:id/ajukan', () => {
  it('lengkap (data tersimpan) → DIAJUKAN dengan waktu dan pengaju tercatat', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    const res = await request(app).post('/api/program/10/ajukan').set(h)
    expect(res.status).toBe(200)
    const data = prisma.programKerja.update.mock.calls[0]![0].data
    expect(data).toMatchObject({ status: 'DIAJUKAN', diajukanOleh: 1 })
    expect(data.diajukanPada).toBeInstanceOf(Date)
  })

  it('kelengkapan diperiksa dari DATA TERSIMPAN: sumber dana ≠ RAB → 400 dengan daftar masalah', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ sumberDana: [{ id: 1, jenis: 'GEREJA', nilai: 900_000n, keterangan: null }] }))
    const res = await request(app).post('/api/program/10/ajukan').set(h)
    expect(res.status).toBe(400)
    expect(res.body.details.masalah.some((m: string) => m.includes('sama dengan'))).toBe(true)
    expect(prisma.programKerja.update).not.toHaveBeenCalled()
  })

  it('daftar periksa belum lengkap atau PIC kosong → 400', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ checklist: {}, picNama: null }))
    const res = await request(app).post('/api/program/10/ajukan').set(h)
    expect(res.status).toBe(400)
    expect(res.body.details.masalah.length).toBeGreaterThanOrEqual(2)
  })

  it('sudah diajukan → 409; ditutup → 409; unit lain → 404', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValueOnce(programDb({ status: 'DIAJUKAN' }))
    expect((await request(app).post('/api/program/10/ajukan').set(h)).status).toBe(409)
    prisma.programKerja.findUnique.mockResolvedValueOnce(programDb({ tahun: tahunDb('DITUTUP') }))
    expect((await request(app).post('/api/program/10/ajukan').set(h)).status).toBe(409)
    prisma.programKerja.findUnique.mockResolvedValueOnce(programDb({ unitId: 6, unit: { id: 6, kode: 'U6', nama: 'U6', singkatan: null, bidangId: 1, jenis: 'UPK' } }))
    expect((await request(app).post('/api/program/10/ajukan').set(h)).status).toBe(404)
    expect(prisma.programKerja.update).not.toHaveBeenCalled()
  })

  it('majelis tidak boleh mengajukan', async () => {
    const h = masuk(prisma, pengguna('MAJELIS'))
    siapBuat()
    expect((await request(app).post('/api/program/10/ajukan').set(h)).status).toBe(403)
  })
})

describe('POST /api/program/:id/tarik', () => {
  it('pengurus saat DIBUKA → kembali ke DRAFT dan jejak pengajuan dibersihkan', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ status: 'DIAJUKAN' }))
    expect((await request(app).post('/api/program/10/tarik').set(h)).status).toBe(200)
    expect(prisma.programKerja.update.mock.calls[0]![0].data).toMatchObject({ status: 'DRAFT', diajukanPada: null, diajukanOleh: null })
  })

  it('pengurus saat ditutup → 409; admin tetap bisa', async () => {
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ status: 'DIAJUKAN', tahun: tahunDb('DITUTUP') }))
    expect((await request(app).post('/api/program/10/tarik').set(masuk(prisma, pengurus))).status).toBe(409)
    expect((await request(app).post('/api/program/10/tarik').set(masuk(prisma, pengguna('ADMIN')))).status).toBe(200)
  })

  it('draft tidak bisa ditarik → 409', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    expect((await request(app).post('/api/program/10/tarik').set(h)).status).toBe(409)
  })
})

describe('DELETE /api/program/:id', () => {
  it('draft milik unit sendiri → dihapus; yang sudah diajukan → 409; unit lain → 404', async () => {
    const h = masuk(prisma, pengurus)
    siapBuat()
    prisma.programKerja.delete.mockResolvedValue({})
    expect((await request(app).delete('/api/program/10').set(h)).status).toBe(200)
    expect(prisma.programKerja.delete).toHaveBeenCalledWith({ where: { id: 10 } })

    prisma.programKerja.findUnique.mockResolvedValueOnce(programDb({ status: 'DIAJUKAN' }))
    expect((await request(app).delete('/api/program/10').set(h)).status).toBe(409)
    prisma.programKerja.findUnique.mockResolvedValueOnce(programDb({ unitId: 6, unit: { id: 6, kode: 'U6', nama: 'U6', singkatan: null, bidangId: 1, jenis: 'UPK' } }))
    expect((await request(app).delete('/api/program/10').set(h)).status).toBe(404)
    expect(prisma.programKerja.delete).toHaveBeenCalledTimes(1)
  })
})

describe('matriks peran untuk mengubah program', () => {
  const peranTanpaHak: PenggunaUji['peran'][] = ['MAJELIS', 'KOORDINATOR_BIDANG']
  it.each(peranTanpaHak)('%s: simpan, ajukan, tarik, hapus → 403', async (peran) => {
    const h = masuk(prisma, pengguna(peran))
    siapBuat()
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ status: 'DRAFT' }))
    expect((await request(app).put('/api/program/10').set(h).send(bodyLengkap())).status).toBe(403)
    expect((await request(app).post('/api/program/10/ajukan').set(h)).status).toBe(403)
    expect((await request(app).delete('/api/program/10').set(h)).status).toBe(403)
    prisma.programKerja.findUnique.mockResolvedValue(programDb({ status: 'DIAJUKAN' }))
    expect((await request(app).post('/api/program/10/tarik').set(h)).status).toBe(403)
    expect(prisma.programKerja.update).not.toHaveBeenCalled()
    expect(prisma.programKerja.delete).not.toHaveBeenCalled()
  })
})
