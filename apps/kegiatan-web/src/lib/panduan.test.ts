import { describe, it, expect } from 'vitest'
import { BAGIAN_FORMULIR, PANDUAN_PERAN, TAHAP_PANDUAN, indeksPeran } from './panduan'
import { tautanMasukanPanduan } from './dukungan'
import { PERAN_LABEL, URUTAN_TAHAP, type Peran } from './tipe'

const aktif = { aktif: true, nomor: '6281234567890', pesan: 'tidak dipakai' }

describe('isi panduan', () => {
  it('formulir terdiri dari bagian 1–10 berurutan, tanpa isian kosong', () => {
    expect(BAGIAN_FORMULIR.map((b) => b.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const b of BAGIAN_FORMULIR) {
      expect(b.judul.length).toBeGreaterThan(3)
      expect(b.cara.length).toBeGreaterThan(0)
      expect(b.kesalahan.length).toBeGreaterThan(0)
    }
  })
  it('setiap peran aplikasi tercakup tepat satu panduan peran', () => {
    for (const peran of Object.keys(PERAN_LABEL) as Peran[]) {
      expect(PANDUAN_PERAN.filter((p) => p.peran.includes(peran))).toHaveLength(1)
    }
  })
  it('tahap panduan mengikuti urutan siklus setelah penetapan pagu', () => {
    expect(TAHAP_PANDUAN.map((t) => t.kode)).toEqual(URUTAN_TAHAP.filter((t) => t !== 'BELUM_DIBUKA'))
  })
  it('tab awal mengikuti peran; belum masuk atau peran asing ke tab pertama', () => {
    expect(PANDUAN_PERAN[indeksPeran('KOORDINATOR_BIDANG')]!.judul).toBe('Ketua Bidang')
    expect(PANDUAN_PERAN[indeksPeran('SEKRETARIAT')]!.judul).toBe('Admin dan Sekretariat')
    expect(indeksPeran(null)).toBe(0)
    expect(indeksPeran('ASING' as Peran)).toBe(0)
  })
})

describe('tautanMasukanPanduan', () => {
  it('pengguna masuk: pesan memuat nama dan unit', () => {
    const t = tautanMasukanPanduan(aktif, { nama: 'Budi', unit: 'Komisi Pemuda' })!
    expect(t.startsWith('https://wa.me/6281234567890?text=')).toBe(true)
    expect(decodeURIComponent(t.split('?text=')[1]!)).toContain('Budi (Komisi Pemuda)')
  })
  it('belum masuk: pesan tanpa nama', () => {
    const p = decodeURIComponent(tautanMasukanPanduan(aktif, null)!.split('?text=')[1]!)
    expect(p).toContain('memberi masukan untuk Panduan')
    expect(p).not.toContain('{nama}')
  })
  it.each([[null], [{ ...aktif, aktif: false }], [{ ...aktif, nomor: null }], [{ ...aktif, nomor: '0812' }]])('nonaktif atau nomor tidak valid → null (%#)', (d) => {
    expect(tautanMasukanPanduan(d as never, null)).toBeNull()
  })
})
