import { describe, it, expect } from 'vitest'
import { isiPesan, tautanDukungan } from './dukungan'

const ctx = { nama: 'Budi Santoso', unit: 'Komisi Pemuda' }
const aktif = { aktif: true, nomor: '6281234567890', pesan: 'Halo, saya {nama} ({unit}). Butuh bantuan.' }

describe('isiPesan', () => {
  it('mengganti {nama} dan {unit}, juga bila muncul berulang', () => {
    expect(isiPesan('{nama} dari {unit}; {nama}', ctx)).toBe('Budi Santoso dari Komisi Pemuda; Budi Santoso')
  })
  it('akun tanpa unit memakai "tanpa unit"; placeholder tak dikenal dibiarkan', () => {
    expect(isiPesan('{unit} {lain}', { nama: 'X', unit: null })).toBe('tanpa unit {lain}')
  })
})

describe('tautanDukungan', () => {
  it('menyusun tautan wa.me dengan pesan ter-encode', () => {
    const t = tautanDukungan(aktif, ctx)!
    expect(t.startsWith('https://wa.me/6281234567890?text=')).toBe(true)
    expect(decodeURIComponent(t.split('?text=')[1]!)).toBe('Halo, saya Budi Santoso (Komisi Pemuda). Butuh bantuan.')
  })
  it('nama berisi karakter khusus tidak merusak tautan', () => {
    const t = tautanDukungan(aktif, { nama: 'A&B=C?D#E', unit: 'U' })!
    expect(t.split('?text=')).toHaveLength(2)
    expect(t).not.toContain('#')
    expect(decodeURIComponent(t.split('?text=')[1]!)).toContain('A&B=C?D#E')
  })
  it.each([
    ['nonaktif', { ...aktif, aktif: false }],
    ['tanpa nomor', { ...aktif, nomor: null }],
    ['nomor bukan format 62', { ...aktif, nomor: '0812345678' }],
    ['nomor berisi huruf', { ...aktif, nomor: '62abc' }],
  ])('null bila %s', (_n, d) => {
    expect(tautanDukungan(d, ctx)).toBeNull()
  })
  it('null bila pengaturan belum ada', () => {
    expect(tautanDukungan(undefined, ctx)).toBeNull()
    expect(tautanDukungan(null, ctx)).toBeNull()
  })
})
