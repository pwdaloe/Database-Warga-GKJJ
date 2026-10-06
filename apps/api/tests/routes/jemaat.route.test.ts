import 'express-async-errors'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

// ── Store in-memory: kode service/route asli yang diuji, bukan prisma ──────────
let warga: Record<string, any>
let keluarga: Record<string, any>
let catatan: Record<string, any>[]
let audit: any[]
let userRow: Record<string, any> | null

const prisma: any = {
  user: {
    findUnique: vi.fn(async () => userRow),
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: any) => ({ id: 50, ...data })),
  },
  warga: {
    findUnique: vi.fn(async () => ({ ...warga, keluarga: { ...keluarga }, catatanJemaat: [...catatan] })),
    findFirst: vi.fn(async () => null),
    update: vi.fn(async ({ data }: any) => { Object.assign(warga, data); return warga }),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  keluarga: { update: vi.fn(async ({ data }: any) => { Object.assign(keluarga, data); return keluarga }) },
  catatanJemaat: {
    create: vi.fn(async ({ data }: any) => { catatan = [{ id: 1, ...data }] }),
    update: vi.fn(async ({ data }: any) => { catatan = [{ ...catatan[0], ...data }] }),
    delete: vi.fn(async () => { catatan = [] }),
  },
  auditLog: { create: vi.fn(async ({ data }: any) => { audit.push(data) }) },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
  $transaction: vi.fn(async (fn: any) => fn(prisma)),
}
vi.mock('../../src/utils/prisma.js', () => ({ prisma }))

const { default: app } = await import('../../src/app.js')
const { profilUpdateSchema, getProfil } = await import('../../src/services/profil.service.js')

const tok = (role: UserRole, userId = 1) => jwt.sign({ userId, role, kelompokId: null }, process.env.JWT_SECRET!)
let jemaat: string
let admin: string

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ENCRYPTION_KEY = 'test-encryption-key'
  jemaat = tok(UserRole.JEMAAT, 7)
  admin = tok(UserRole.SUPERADMIN, 1)
})

beforeEach(() => {
  vi.clearAllMocks()
  warga = {
    id: 10, namaLengkap: 'Ani Wijaya', nomorAnggota: 'WRG00010', jenisKelamin: 'P', statusKeluarga: 'KEPALA', keluargaId: 3,
    namaPanggilan: 'Ani', tempatLahir: 'Solo', tanggalLahir: new Date('1980-02-03'), nik: null, golonganDarah: 'O',
    telepon: '021111', whatsapp: '081234567890', whatsappBolehDitampilkan: false, email: 'ani@x.id',
    pendidikanTerakhir: 'S1', pekerjaan: 'Guru', alamatKtp: 'Jl. KTP 1', alamatDomisili: null,
    dataStatus: 'AKTIF', diubahMandiriAt: null,
  }
  keluarga = { id: 3, alamat: 'Jl. Melati 3', rt: '001', rw: '002', kelurahan: 'Rawamangun', kecamatan: 'Pulo Gadung', kota: 'Jakarta Timur', kodePos: '13220', teleponRumah: '021-555', dataStatus: 'AKTIF' }
  catatan = []
  audit = []
  userRow = { wargaId: 10 }
  prisma.user.findUnique.mockImplementation(async () => userRow)
  prisma.warga.findFirst.mockImplementation(async () => null)
})

const get = (t = jemaat) => request(app).get('/api/profil-saya').set('Authorization', `Bearer ${t}`)
const put = (body: object, t = jemaat) => request(app).put('/api/profil-saya').set('Authorization', `Bearer ${t}`).send(body)

describe('Pagar global JEMAAT (fail-closed)', () => {
  const dilarang: [string, string][] = [
    ['get', '/api/warga'], ['get', '/api/warga/10'], ['get', '/api/warga/11'], ['put', '/api/warga/10'], ['post', '/api/warga'],
    ['patch', '/api/warga/bulk-status'], ['get', '/api/keluarga'], ['get', '/api/keluarga/3'], ['get', '/api/dashboard/stats'],
    ['get', '/api/dashboard/map'], ['get', '/api/users'], ['post', '/api/users'], ['get', '/api/wilayah'], ['get', '/api/kelompok'],
    ['get', '/api/pengaturan/komisi'], ['get', '/api/pengaturan/template-pesan'], ['get', '/api/pengaturan/kontak-gereja'],
    ['post', '/api/import/warga'], ['get', '/api/logs'], ['get', '/api/perpindahan'], ['post', '/api/hubungi'], ['get', '/api/rute-baru-yang-belum-ada'],
  ]
  it.each(dilarang)('%s %s → 403', async (method, path) => {
    const res = await (request(app) as any)[method](path).set('Authorization', `Bearer ${jemaat}`).send({})
    expect(res.status).toBe(403)
  })

  it('yang diizinkan: Profil Saya, Hubungi (GET), autocomplete kelurahan', async () => {
    prisma.kontakGereja = { findMany: vi.fn().mockResolvedValue([]) }
    prisma.masterKelurahan = { findMany: vi.fn().mockResolvedValue([]) }
    prisma.user.findUnique.mockResolvedValue({ nama: 'Ani', kelompokId: null, warga: null, wargaId: 10 })
    expect((await get()).status).toBe(200)
    expect((await request(app).get('/api/hubungi').set('Authorization', `Bearer ${jemaat}`)).status).toBe(200)
    expect((await request(app).get('/api/pengaturan/kelurahan').set('Authorization', `Bearer ${jemaat}`)).status).toBe(200)
  })

  it('role lain tidak terpengaruh pagar', async () => {
    expect((await request(app).get('/api/profil-saya').set('Authorization', `Bearer ${admin}`)).status).toBe(403) // authorize('JEMAAT')
  })
})

describe('GET /api/profil-saya', () => {
  it('data diri sendiri; NIK dimasker, tidak pernah dikembalikan utuh', async () => {
    const { encryptField } = await import('../../src/utils/crypto.js')
    warga.nik = encryptField('3171234567890001')
    const res = await get()
    expect(res.body.data.namaLengkap).toBe('Ani Wijaya')
    expect(res.body.data.nikMasker).toBe('3171••••••••0001')
    expect(JSON.stringify(res.body)).not.toContain('3171234567890001')
    expect(res.body.data.bolehUbahAlamatKeluarga).toBe(true)
  })

  it('id warga dari akun login, bukan dari parameter', async () => {
    await request(app).get('/api/profil-saya?id=99&wargaId=99').set('Authorization', `Bearer ${jemaat}`)
    expect(prisma.warga.findUnique.mock.calls.every((c: any[]) => c[0].where.id === 10)).toBe(true)
  })

  it('akun tanpa tautan warga → 403 (fail-closed)', async () => {
    userRow = { wargaId: null }
    expect((await get()).status).toBe(403)
  })
})

describe('PUT /api/profil-saya — whitelist', () => {
  it.each([
    ['namaLengkap', 'Orang Lain'], ['dataStatus', 'AKTIF'], ['statusKeanggotaan', 'AKTIF'], ['keluargaId', 99], ['wargaId', 99], ['id', 99],
    ['statusKeluarga', 'LAINNYA'], ['sudahSidi', true], ['nomorAnggota', 'X'], ['konsenPDP', true], ['latitude', 1],
  ])('field %s di luar whitelist → 400 dan tidak ada yang tertulis', async (k, v) => {
    const res = await put({ pekerjaan: 'Dokter', [k]: v })
    expect(res.status).toBe(400)
    expect(prisma.warga.update).not.toHaveBeenCalled()
  })

  it('tulis selalu ke warga milik akun, status kembali DRAFT + penanda diubah mandiri', async () => {
    const res = await put({ pekerjaan: 'Dokter' })
    expect(res.status).toBe(200)
    const call = prisma.warga.update.mock.calls[0][0]
    expect(call.where).toEqual({ id: 10 })
    expect(call.data).toMatchObject({ pekerjaan: 'Dokter', dataStatus: 'DRAFT', validatedBy: null, validatedAt: null, updatedBy: 7 })
    expect(call.data.diubahMandiriAt).toBeInstanceOf(Date)
    expect(res.body.data.menungguVerifikasi).toBe(true)
  })

  it('string kosong → null; domisili null = sama dengan KTP', async () => {
    warga.alamatDomisili = 'Jl. Lama'
    await put({ telepon: '', alamatDomisili: null })
    expect(warga.telepon).toBeNull()
    expect(warga.alamatDomisili).toBeNull()
  })

  it('WhatsApp tidak valid → 400', async () => {
    expect((await put({ whatsapp: '12' })).status).toBe(400)
  })
})

describe('PUT — NIK', () => {
  it('bukan 16 digit → 400', async () => {
    expect((await put({ nik: '123' })).status).toBe(400)
  })
  it('bentrok dengan warga lain → 400, tidak tertulis', async () => {
    prisma.warga.findFirst.mockResolvedValueOnce({ id: 11 })
    expect((await put({ nik: '3171234567890001' })).status).toBe(400)
    expect(prisma.warga.update).not.toHaveBeenCalled()
  })
  it('tersimpan terenkripsi; audit log tidak memuat NIK', async () => {
    const res = await put({ nik: '3171234567890001' })
    expect(res.status).toBe(200)
    expect(warga.nik).toMatch(/^enc:/)
    expect(JSON.stringify(audit)).not.toContain('3171234567890001')
    expect(res.body.data.nikMasker).toBe('3171••••••••0001')
  })
  it('tidak dikirim → NIK tersimpan tidak berubah', async () => {
    warga.nik = 'enc:TERSIMPAN'
    await put({ pekerjaan: 'X' })
    expect(warga.nik).toBe('enc:TERSIMPAN')
  })
})

describe('PUT — Alamat KK hanya kepala keluarga', () => {
  const alamat = { alamat: 'Jl. Baru 9', rt: '003', rw: '004', kelurahan: 'Kebon', kecamatan: 'X', kota: 'Jakarta', kodePos: '1', teleponRumah: '' }

  it('kepala: alamat KK diperbarui, KK ikut DRAFT', async () => {
    const res = await put({ alamatKeluarga: alamat })
    expect(res.status).toBe(200)
    expect(prisma.keluarga.update.mock.calls[0][0].where).toEqual({ id: 3 })
    expect(keluarga).toMatchObject({ alamat: 'Jl. Baru 9', rt: '003', teleponRumah: null, dataStatus: 'DRAFT' })
  })

  it('anggota non-kepala → 403, tidak ada yang tertulis (termasuk field lain di request yang sama)', async () => {
    warga.statusKeluarga = 'ANAK'
    const res = await put({ pekerjaan: 'Siswa', alamatKeluarga: alamat })
    expect(res.status).toBe(403)
    expect(prisma.keluarga.update).not.toHaveBeenCalled()
    expect(prisma.warga.update).not.toHaveBeenCalled()
    expect((await get()).body.data.bolehUbahAlamatKeluarga).toBe(false)
  })

  it('field tak dikenal di alamatKeluarga → 400 (mis. kelompokId)', async () => {
    expect((await put({ alamatKeluarga: { ...alamat, kelompokId: 9 } })).status).toBe(400)
  })
})

describe('Catatan jemaat (terpisah dari catatan internal)', () => {
  it('membuat, mengubah, dan menghapus; Warga.catatan tidak tersentuh', async () => {
    warga.catatan = 'CATATAN INTERNAL STAF'
    await put({ catatanJemaat: 'Mohon dikunjungi' })
    expect(catatan[0]).toMatchObject({ wargaId: 10, jenis: 'CATATAN', isi: 'Mohon dikunjungi' })
    expect((await get()).body.data.catatanJemaat).toBe('Mohon dikunjungi')
    await put({ catatanJemaat: 'Sudah lebih baik' })
    expect(catatan[0].isi).toBe('Sudah lebih baik')
    await put({ catatanJemaat: '' })
    expect(catatan).toEqual([])
    expect(warga.catatan).toBe('CATATAN INTERNAL STAF')
    expect(JSON.stringify((await get()).body)).not.toContain('INTERNAL')
  })
})

describe('Round-trip simpan → muat ulang + jejak audit', () => {
  const SEMUA = {
    namaPanggilan: 'Nia', tempatLahir: 'Bandung', tanggalLahir: '1981-05-06', golonganDarah: 'AB',
    telepon: '0211234', whatsapp: '081299990000', whatsappBolehDitampilkan: true, email: 'nia@x.id',
    pendidikanTerakhir: 'S2', pekerjaan: 'Dosen', alamatKtp: 'Jl. KTP 2', alamatDomisili: 'Jl. Domisili 3',
    catatanJemaat: 'Catatan saya',
    alamatKeluarga: { alamat: 'Jl. Anggrek 1', rt: '009', rw: '010', kelurahan: 'K', kecamatan: 'C', kota: 'Jakarta', kodePos: '99', teleponRumah: '021-9' },
  }

  it('setiap field whitelist kembali sama saat dimuat ulang', async () => {
    const res = await put(SEMUA)
    expect(res.status).toBe(200)
    const d = (await get()).body.data
    const { alamatKeluarga, ...flat } = SEMUA
    expect(d).toMatchObject(flat)
    expect(d.alamatKeluarga).toEqual(alamatKeluarga)
  })

  it('paritas: setiap field skema (selain nik→nikMasker) dikembalikan oleh GET (gagal bila field baru lupa dipetakan)', async () => {
    const skema = Object.keys((profilUpdateSchema as any).shape).filter((k) => k !== 'nik')
    const d = await getProfil(10)
    expect(skema.filter((k) => !(k in d))).toEqual([])
    expect('nikMasker' in d).toBe(true)
  })

  it('audit log: sumber jemaat, nilai lama & baru tercatat', async () => {
    await put({ pekerjaan: 'Dokter' })
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ userId: 7, action: 'UPDATE', tabel: 'warga', recordId: 10 })
    expect(audit[0].dataLama.pekerjaan).toBe('Guru')
    expect(audit[0].dataBaru).toMatchObject({ pekerjaan: 'Dokter', sumber: 'jemaat' })
  })
})

describe('Pembuatan akun role JEMAAT & validasi staf', () => {
  const body = { nama: 'Ani', username: 'ani.w', email: 'ani@x.id', role: 'JEMAAT' }
  it('JEMAAT tanpa tautan warga ditolak', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`).send(body)
    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })
  it('JEMAAT dengan wargaId → 201', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`).send({ ...body, wargaId: 10 })
    expect(res.status).toBe(201)
  })
  it('staf memvalidasi → penanda diubah mandiri dikosongkan', async () => {
    await request(app).patch('/api/warga/bulk-status').set('Authorization', `Bearer ${admin}`).send({ ids: [10], action: 'validate' })
    expect(prisma.warga.updateMany.mock.calls[0][0].data).toMatchObject({ dataStatus: 'AKTIF', diubahMandiriAt: null })
  })
})
