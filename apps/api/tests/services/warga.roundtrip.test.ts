/**
 * Tes round-trip per peran: baca (tersaring peran) → payload seperti dikirim form
 * (field yang tidak terlihat = null) → updateWarga → baca ulang.
 * Menggunakan store in-memory sehingga kode service asli (sanitizeForRole + proteksi tulis) yang diuji.
 * Kelas bug yang dicegah: data tersimpan terhapus diam-diam saat role terbatas mengedit warga.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let store: Record<string, any>

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    warga: {
      findUnique: vi.fn(async () => ({ ...store })),
      update: vi.fn(async ({ data }: any) => {
        Object.assign(store, data)
        return { ...store }
      }),
    },
    keluarga: { findUnique: vi.fn(async () => ({ kelompokId: 3 })) },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../src/utils/crypto.js', () => ({
  encryptField: vi.fn((v: string | null | undefined) => (v ? `enc:${v}` : v ?? null)),
  decryptField: vi.fn((v: string | null | undefined) => (v ? String(v).replace(/^enc:/, '') : v ?? null)),
}))

const { getWargaById, updateWarga } = await import('../../src/services/warga.service.js')

const ASLI = {
  id: 1,
  namaLengkap: 'Soenarto',
  jenisKelamin: 'L',
  statusKeluarga: 'ANAK',
  statusKeanggotaan: 'AKTIF',
  keluargaId: 5,
  keluarga: { id: 5, kelompokId: 3 },
  nik: 'enc:3171234567890001',
  alamatKtp: 'Jl. KTP No. 1',
  alamatDomisili: 'Jl. Domisili 2',
  latitude: -6.2088,
  longitude: 106.8456,
  telepon: '0812000111',
  whatsapp: '0812000111',
  email: 'soenarto@example.com',
  catatan: 'lama',
  konsenPDP: false,
  tanggalKonsen: null,
}

const ROLES = [
  { role: 'SUPERADMIN', kelompokId: null, lihat: { nik: true, alamatKtp: true, koordinat: true } },
  { role: 'KEPALA_KANTOR', kelompokId: null, lihat: { nik: true, alamatKtp: true, koordinat: true } },
  { role: 'MAJELIS', kelompokId: null, lihat: { nik: true, alamatKtp: true, koordinat: true } },
  { role: 'STAF_ADMIN', kelompokId: null, lihat: { nik: true, alamatKtp: true, koordinat: true } },
  { role: 'PENATUA_KELOMPOK', kelompokId: 3, lihat: { nik: false, alamatKtp: false, koordinat: true } },
] as const

/** Meniru WargaForm: kirim kembali semua field yang dimuat (null untuk yang tidak terlihat) */
function payloadDariForm(dilihat: Record<string, any>, ubah: Record<string, any>) {
  const { id, keluarga, tanggalKonsen, ...field } = dilihat
  return { ...field, ...ubah }
}

beforeEach(() => {
  store = { ...ASLI }
})

describe.each(ROLES)('round-trip edit warga sebagai $role', ({ role, kelompokId, lihat }) => {
  const user = { userId: 9, role, kelompokId } as any

  it('mengedit satu field tidak mengubah/menghapus field lain di penyimpanan', async () => {
    const dilihat = await getWargaById(1, user)
    await updateWarga(1, payloadDariForm(dilihat, { catatan: 'baru' }) as any, 9, user)

    expect(store.catatan).toBe('baru')                       // yang diedit berubah
    expect(store.nik).toBe(ASLI.nik)                         // NIK utuh (terlihat atau tidak)
    expect(store.alamatKtp).toBe(ASLI.alamatKtp)
    expect(store.alamatDomisili).toBe(ASLI.alamatDomisili)
    expect(store.latitude).toBe(ASLI.latitude)
    expect(store.longitude).toBe(ASLI.longitude)
    expect(store.telepon).toBe(ASLI.telepon)
    expect(store.email).toBe(ASLI.email)
  })

  it('matriks redaksi: field terlihat/tersembunyi sesuai peran', async () => {
    const dilihat = await getWargaById(1, user)
    expect(dilihat.nik).toBe(lihat.nik ? '3171234567890001' : null)
    expect(dilihat.alamatKtp).toBe(lihat.alamatKtp ? ASLI.alamatKtp : null)
    expect(dilihat.latitude).toBe(lihat.koordinat ? ASLI.latitude : null)
    expect(dilihat.longitude).toBe(lihat.koordinat ? ASLI.longitude : null)
  })

  it('baca ulang setelah simpan menampilkan data yang sama (selain yang diedit)', async () => {
    const sebelum = await getWargaById(1, user)
    await updateWarga(1, payloadDariForm(sebelum, { catatan: 'baru' }) as any, 9, user)
    const sesudah = await getWargaById(1, user)
    expect(sesudah).toEqual({ ...sebelum, catatan: 'baru', updatedBy: 9 })
  })

  it('koordinat yang diisi/diubah tersimpan dan terbaca kembali', async () => {
    await updateWarga(1, { latitude: -6.3, longitude: 106.9 } as any, 9, user)
    const dilihat = await getWargaById(1, user)
    expect(dilihat.latitude).toBe(-6.3)
    expect(dilihat.longitude).toBe(106.9)
  })
})

describe('round-trip — hak hapus vs ubah', () => {
  it('SUPERADMIN sengaja mengosongkan NIK/Alamat KTP/koordinat → benar-benar terhapus', async () => {
    await updateWarga(1, { nik: null, alamatKtp: null, latitude: null, longitude: null } as any, 9,
      { userId: 9, role: 'SUPERADMIN', kelompokId: null } as any)
    expect(store.nik).toBeNull()
    expect(store.alamatKtp).toBeNull()
    expect(store.latitude).toBeNull()
  })

  it('PENATUA bisa mengisi/mengubah NIK & Alamat KTP (terenkripsi) namun tidak bisa menghapusnya', async () => {
    const penatua = { userId: 9, role: 'PENATUA_KELOMPOK', kelompokId: 3 } as any
    await updateWarga(1, { nik: '3171000000000002', alamatKtp: 'Jl. Baru 9' } as any, 9, penatua)
    expect(store.nik).toBe('enc:3171000000000002')
    expect(store.alamatKtp).toBe('Jl. Baru 9')

    await updateWarga(1, { nik: null, alamatKtp: '' } as any, 9, penatua)   // kosong dari form → diabaikan
    expect(store.nik).toBe('enc:3171000000000002')
    expect(store.alamatKtp).toBe('Jl. Baru 9')
  })
})
