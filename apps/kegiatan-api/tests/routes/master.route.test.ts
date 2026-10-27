import 'express-async-errors'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { buatPrisma, masuk, pengguna, tahunDb, type PenggunaUji } from '../helpers/harness.js'

const prisma = buatPrisma()
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))
const { default: app } = await import('../../src/app.js')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.logAudit.create.mockResolvedValue({})
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma))
})

const TANPA_HAK: PenggunaUji['peran'][] = ['MAJELIS', 'KOORDINATOR_BIDANG', 'PENGURUS_UPK', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM']

const tulis: Array<[string, string, string, object?]> = [
  ['post', '/api/master/bidang', 'bidang', { kode: 'BARU', nama: 'Bidang Baru' }],
  ['put', '/api/master/bidang/1', 'bidang', { nama: 'Bidang' }],
  ['put', '/api/master/dukungan', 'pengaturan', { aktif: false, pesan: 'Halo bantuan' }],
  ['put', '/api/master/tahun/1', 'tahun', { nama: 'x' }],
  ['post', '/api/master/tahun', 'tahun', { tahun: 2028, nama: 'RKA 2028' }],
  ['post', '/api/master/unit', 'unit', { kode: 'BARU', nama: 'Unit Baru', bidangId: 1 }],
  ['put', '/api/master/unit/1', 'unit', { nama: 'Unit', bidangId: 1 }],
  ['put', '/api/master/pagu', 'pagu', { tahunId: 1, unitId: 1, nilai: 1000 }],
  ['put', '/api/master/pengurus/1', 'pengurus', { nama: 'Nama Baru' }],
  ['post', '/api/master/acuan', 'acuan', { tahunId: 1, jenis: 'MISI', kode: 'X', nama: 'Acuan X' }],
  ['put', '/api/master/acuan/1', 'acuan', { tahunId: 1, jenis: 'MISI', kode: 'X', nama: 'Acuan X' }],
  ['delete', '/api/master/acuan/1', 'acuan'],
  ['post', '/api/master/satuan', 'satuan', { nama: 'Paket' }],
  ['put', '/api/master/satuan/1', 'satuan', { nama: 'Paket' }],
  ['post', '/api/master/kategori-biaya', 'kategoriBiaya', { nama: 'Baru' }],
  ['put', '/api/master/kategori-biaya/1', 'kategoriBiaya', { nama: 'Baru' }],
]

describe('master: penulisan hanya admin dan sekretariat', () => {
  for (const [method, path, , body] of tulis) {
    for (const peran of TANPA_HAK) {
      it(`${method.toUpperCase()} ${path} oleh ${peran} → 403 dan tidak menulis`, async () => {
        const h = masuk(prisma, pengguna(peran))
        const res = await (request(app) as any)[method](path).set(h).send(body)
        expect(res.status).toBe(403)
        expect(prisma.$transaction).not.toHaveBeenCalled()
        expect(prisma.logAudit.create).not.toHaveBeenCalled()
      })
    }
  }
})

describe('pagu', () => {
  const put = (b: object, peran: PenggunaUji['peran'] = 'SEKRETARIAT') => request(app).put('/api/master/pagu').set(masuk(prisma, pengguna(peran))).send(b)

  it('upsert dengan BigInt dan tercatat audit', async () => {
    prisma.paguUnit.upsert.mockResolvedValue({ id: 1, tahunId: 1, unitId: 2, nilai: 50_000_000n })
    const res = await put({ tahunId: 1, unitId: 2, nilai: 50_000_000 })
    expect(res.status).toBe(200)
    expect(res.body.data.nilai).toBe(50_000_000)
    const arg = prisma.paguUnit.upsert.mock.calls[0]![0]
    expect(arg.where).toEqual({ tahunId_unitId: { tahunId: 1, unitId: 2 } })
    expect(arg.update.nilai).toBe(50_000_000n)
    expect(prisma.logAudit.create.mock.calls[0]![0].data.aksi).toBe('UBAH_PAGU')
  })

  it.each([[-1], [1.5], [1_000_000_000_001], ['1000']])('menolak nilai %j', async (nilai) => {
    expect((await put({ tahunId: 1, unitId: 2, nilai })).status).toBe(400)
    expect(prisma.paguUnit.upsert).not.toHaveBeenCalled()
  })
})

describe('akun hanya dapat dibuat pada pengurus unit; pengurus', () => {
  it('menolak WhatsApp tidak valid dan email salah format', async () => {
    const h = masuk(prisma, pengguna('SEKRETARIAT'))
    expect((await request(app).put('/api/master/pengurus/1').set(h).send({ nama: 'Budi', whatsapp: '123' })).status).toBe(400)
    expect((await request(app).put('/api/master/pengurus/1').set(h).send({ nama: 'Budi', email: 'bukan-email' })).status).toBe(400)
    expect(prisma.pengurus.update).not.toHaveBeenCalled()
  })

  it('menyimpan nama, WhatsApp, email dan menandai bukan contoh lagi', async () => {
    const h = masuk(prisma, pengguna('SEKRETARIAT'))
    prisma.pengurus.update.mockResolvedValue({ id: 1, jabatan: 'KETUA', unitId: 2 })
    expect((await request(app).put('/api/master/pengurus/1').set(h).send({ nama: 'Budi Santoso', whatsapp: '081234567890', email: 'budi@contoh.id' })).status).toBe(200)
    expect(prisma.pengurus.update.mock.calls[0]![0].data).toMatchObject({ nama: 'Budi Santoso', whatsapp: '081234567890', email: 'budi@contoh.id', isContoh: false })
  })
})

describe('tahun anggaran', () => {
  it('mengaktifkan satu tahun menonaktifkan tahun lain', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    prisma.tahunAnggaran.update.mockResolvedValue({ id: 2 })
    await request(app).put('/api/master/tahun/2').set(h).send({ aktif: true })
    expect(prisma.tahunAnggaran.updateMany).toHaveBeenCalledWith({ where: { id: { not: 2 } }, data: { aktif: false } })
  })

  it('status pengajuan hanya BELUM_DIBUKA/DIBUKA/DITUTUP', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    expect((await request(app).put('/api/master/tahun/1').set(h).send({ statusPengajuan: 'TERBUKA' })).status).toBe(400)
  })

  it('tahun baru menyalin pagu dan hierarki acuan dari tahun sumber', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    prisma.tahunAnggaran.create.mockResolvedValue({ id: 2, tahun: 2028 })
    prisma.paguUnit.findMany.mockResolvedValue([{ unitId: 1, nilai: 5n, catatan: null }])
    prisma.acuanStrategis.findMany.mockResolvedValue([
      { id: 10, jenis: 'VISI', kode: 'VISI', nama: 'V', deskripsi: null, urutan: 0, aktif: true, parentId: null },
      { id: 11, jenis: 'MISI', kode: 'IMAN', nama: 'I', deskripsi: null, urutan: 1, aktif: true, parentId: 10 },
    ])
    let n = 100
    prisma.acuanStrategis.create.mockImplementation(async () => ({ id: ++n }))
    prisma.paguUnit.createMany.mockResolvedValue({})
    const res = await request(app).post('/api/master/tahun').set(h).send({ tahun: 2028, nama: 'RKA 2028', salinDariId: 1 })
    expect(res.status).toBe(201)
    expect(prisma.paguUnit.createMany.mock.calls[0]![0].data).toEqual([{ tahunId: 2, unitId: 1, nilai: 5n, catatan: null }])
    // turunan menunjuk ke id acuan BARU (101), bukan id lama (10)
    expect(prisma.acuanStrategis.create.mock.calls[1]![0].data.parentId).toBe(101)
  })
})

describe('acuan', () => {
  it('tidak boleh dihapus bila dipakai program atau punya turunan', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    prisma.programAcuan.count.mockResolvedValue(2)
    expect((await request(app).delete('/api/master/acuan/5').set(h)).status).toBe(409)
    prisma.programAcuan.count.mockResolvedValue(0)
    prisma.acuanStrategis.count.mockResolvedValue(1)
    expect((await request(app).delete('/api/master/acuan/5').set(h)).status).toBe(409)
    expect(prisma.acuanStrategis.delete).not.toHaveBeenCalled()
  })

  it('tidak boleh menjadi induk dirinya sendiri', async () => {
    const h = masuk(prisma, pengguna('ADMIN'))
    expect((await request(app).put('/api/master/acuan/5').set(h).send({ tahunId: 1, jenis: 'MISI', kode: 'X', nama: 'Acuan', parentId: 5 })).status).toBe(400)
  })
})

describe('GET /api/master', () => {
  function siapMaster() {
    prisma.tahunAnggaran.findMany.mockResolvedValue([tahunDb()])
    prisma.bidang.findMany.mockResolvedValue([])
    prisma.unit.findMany.mockResolvedValue([
      { id: 5, nama: 'U5', bidangId: 1 },
      { id: 6, nama: 'U6', bidangId: 2 },
    ])
    prisma.satuan.findMany.mockResolvedValue([])
    prisma.kategoriBiaya.findMany.mockResolvedValue([])
    prisma.acuanStrategis.findMany.mockResolvedValue([])
    prisma.paguUnit.findMany.mockResolvedValue([{ unitId: 5, nilai: 25_000_000n }, { unitId: 6, nilai: 50_000_000n }])
    prisma.program2026.findMany.mockResolvedValue([])
  }

  it('pengurus: pagu hanya unit sendiri (unit lain null), tanpa data pengurus BPH unit', async () => {
    siapMaster()
    const res = await request(app).get('/api/master').set(masuk(prisma, pengguna('PENGURUS_UPK')))
    expect(res.status).toBe(200)
    const pagu = Object.fromEntries(res.body.data.unit.map((u: { id: number; pagu: number | null }) => [u.id, u.pagu]))
    expect(pagu).toEqual({ 5: 25_000_000, 6: null })
    expect(prisma.unit.findMany.mock.calls[0]![0].include).toBeUndefined()
    expect(prisma.program2026.findMany.mock.calls[0]![0].where).toEqual({ unitId: 5 })
  })

  it('admin: semua pagu, pengurus BPH ikut, satuan nonaktif ikut (tanpa filter aktif)', async () => {
    siapMaster()
    const res = await request(app).get('/api/master').set(masuk(prisma, pengguna('ADMIN')))
    const pagu = Object.fromEntries(res.body.data.unit.map((u: { id: number; pagu: number | null }) => [u.id, u.pagu]))
    expect(pagu).toEqual({ 5: 25_000_000, 6: 50_000_000 })
    expect(prisma.unit.findMany.mock.calls[0]![0].include).toBeDefined()
    expect(prisma.satuan.findMany.mock.calls[0]![0].where).toEqual({})
  })

  it('koordinator: pagu hanya unit di bidangnya', async () => {
    siapMaster()
    const res = await request(app).get('/api/master').set(masuk(prisma, pengguna('KOORDINATOR_BIDANG')))
    const pagu = Object.fromEntries(res.body.data.unit.map((u: { id: number; pagu: number | null }) => [u.id, u.pagu]))
    expect(pagu).toEqual({ 5: 25_000_000, 6: null })
  })

  it.each(['PENGURUS_UPK', 'KOORDINATOR_BIDANG', 'MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM'] as const)('%s menerima pengaturan dukungan (nonaktif bila belum diisi)', async (peran) => {
    siapMaster()
    const res = await request(app).get('/api/master').set(masuk(prisma, pengguna(peran)))
    expect(res.status).toBe(200)
    expect(res.body.data.dukungan.aktif).toBe(false)
    expect(res.body.data.dukungan.nomor).toBeNull()
    expect(res.body.data.dukungan.pesan).toContain('{nama}')
  })

  it('dukungan aktif hanya bila nomor valid; nomor rusak membuatnya nonaktif', async () => {
    siapMaster()
    prisma.pengaturan.findMany.mockResolvedValue([{ kunci: 'dukungan_wa_aktif', nilai: 'true' }, { kunci: 'dukungan_wa_nomor', nilai: 'abc' }])
    const rusak = await request(app).get('/api/master').set(masuk(prisma, pengguna('PENGURUS_UPK')))
    expect(rusak.body.data.dukungan.aktif).toBe(false)
    prisma.pengaturan.findMany.mockResolvedValue([{ kunci: 'dukungan_wa_aktif', nilai: 'true' }, { kunci: 'dukungan_wa_nomor', nilai: '6281234567890' }])
    const baik = await request(app).get('/api/master').set(masuk(prisma, pengguna('PENGURUS_UPK')))
    expect(baik.body.data.dukungan).toMatchObject({ aktif: true, nomor: '6281234567890' })
  })

  it('memuat daftar periksa 9 butir dan enum formulir', async () => {
    siapMaster()
    const res = await request(app).get('/api/master').set(masuk(prisma, pengguna('PENGURUS_UPK')))
    expect(res.body.data.checklist).toHaveLength(9)
    expect(res.body.data.enum.kategoriWaktu).toEqual(['SEKALI', 'PERIODE', 'RENTANG', 'TAHUN'])
    expect(res.body.data.enum.sumberDana).toEqual(['GEREJA', 'SWADAYA', 'PENGGALANGAN', 'DONASI'])
  })
})

describe('bidang', () => {
  const kirim = (method: 'post' | 'put', path: string, b: object, peran: PenggunaUji['peran'] = 'SEKRETARIAT') =>
    (request(app) as any)[method](path).set(masuk(prisma, pengguna(peran))).send(b)

  it('menambah bidang dan tercatat audit; kode wajib huruf besar/angka/garis bawah', async () => {
    prisma.bidang.create.mockResolvedValue({ id: 8, kode: 'BARU', nama: 'Bidang Baru', urutan: 8 })
    const res = await kirim('post', '/api/master/bidang', { kode: 'BARU', nama: 'Bidang Baru', urutan: 8 })
    expect(res.status).toBe(201)
    expect(prisma.logAudit.create.mock.calls[0]![0].data.aksi).toBe('BUAT_BIDANG')
    for (const kode of ['baru', 'ada spasi', 'X']) {
      expect((await kirim('post', '/api/master/bidang', { kode, nama: 'Bidang Baru' })).status).toBe(400)
    }
    expect(prisma.bidang.create).toHaveBeenCalledTimes(1)
  })

  it('mengubah nama dan urutan bidang; nama terlalu pendek ditolak', async () => {
    prisma.bidang.update.mockResolvedValue({ id: 1, kode: 'PEMBINAAN1', nama: 'Pembinaan Satu', urutan: 2 })
    expect((await kirim('put', '/api/master/bidang/1', { nama: 'Pembinaan Satu', urutan: 2 })).status).toBe(200)
    expect(prisma.logAudit.create.mock.calls[0]![0].data.aksi).toBe('UBAH_BIDANG')
    expect((await kirim('put', '/api/master/bidang/1', { nama: 'P' })).status).toBe(400)
  })
})

describe('dukungan WhatsApp', () => {
  const put = (b: object, peran: PenggunaUji['peran'] = 'ADMIN') => request(app).put('/api/master/dukungan').set(masuk(prisma, pengguna(peran))).send(b)

  it('menyimpan nomor dalam format internasional dan mencatat audit', async () => {
    prisma.pengaturan.findMany.mockResolvedValue([
      { kunci: 'dukungan_wa_aktif', nilai: 'true' }, { kunci: 'dukungan_wa_nomor', nilai: '6281234567890' }, { kunci: 'dukungan_wa_pesan', nilai: 'Halo {nama}' },
    ])
    const res = await put({ aktif: true, nomor: '0812-3456-7890', pesan: 'Halo {nama}' })
    expect(res.status).toBe(200)
    const nilai = Object.fromEntries(prisma.pengaturan.upsert.mock.calls.map((c: any[]) => [c[0].where.kunci, c[0].update.nilai]))
    expect(nilai).toEqual({ dukungan_wa_aktif: 'true', dukungan_wa_nomor: '6281234567890', dukungan_wa_pesan: 'Halo {nama}' })
    expect(res.body.data).toEqual({ aktif: true, nomor: '6281234567890', pesan: 'Halo {nama}' })
    expect(prisma.logAudit.create.mock.calls[0]![0].data.aksi).toBe('UBAH_DUKUNGAN')
  })

  it.each([
    ['nomor tidak valid', { aktif: false, nomor: '123', pesan: 'Halo bantuan' }],
    ['aktif tanpa nomor', { aktif: true, nomor: '', pesan: 'Halo bantuan' }],
    ['pesan terlalu pendek', { aktif: false, nomor: '081234567890', pesan: 'Hi' }],
    ['pesan terlalu panjang', { aktif: false, nomor: '081234567890', pesan: 'x'.repeat(301) }],
    ['aktif bukan boolean', { aktif: 'ya', nomor: '081234567890', pesan: 'Halo bantuan' }],
  ])('menolak %s dan tidak menulis', async (_n, body) => {
    expect((await put(body)).status).toBe(400)
    expect(prisma.pengaturan.upsert).not.toHaveBeenCalled()
  })

  it('nonaktif tanpa nomor boleh disimpan (nomor dikosongkan)', async () => {
    expect((await put({ aktif: false, nomor: '', pesan: 'Halo bantuan' }, 'SEKRETARIAT')).status).toBe(200)
    const nomor = prisma.pengaturan.upsert.mock.calls.find((c: any[]) => c[0].where.kunci === 'dukungan_wa_nomor')![0]
    expect(nomor.update.nilai).toBe('')
  })
})
