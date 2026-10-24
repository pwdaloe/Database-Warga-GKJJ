import { describe, it, expect } from 'vitest'
import { formatAngka, formatKetikRupiah, formatRupiah, formatTanggal, parseRupiah, persen } from './format'

describe('format dan parse rupiah', () => {
  it('format dengan pemisah ribuan titik', () => {
    expect(formatAngka(1_500_000)).toBe('1.500.000')
    expect(formatRupiah(300_000_000)).toBe('Rp 300.000.000')
    expect(formatRupiah(-2_000_000)).toBe('−Rp 2.000.000')
    expect(formatRupiah(0)).toBe('Rp 0')
  })

  it('parse: menerima titik, Rp, spasi; kosong = 0; selain angka = null', () => {
    expect(parseRupiah('1.500.000')).toBe(1_500_000)
    expect(parseRupiah('Rp 25.000')).toBe(25_000)
    expect(parseRupiah('1500000')).toBe(1_500_000)
    expect(parseRupiah('')).toBe(0)
    expect(parseRupiah('12,5')).toBeNull()
    expect(parseRupiah('-5')).toBeNull()
    expect(parseRupiah('abc')).toBeNull()
    expect(parseRupiah('99999999999999999999')).toBeNull()
  })

  it('format saat mengetik: hanya angka, nol di depan dibuang', () => {
    expect(formatKetikRupiah('1500000')).toBe('1.500.000')
    expect(formatKetikRupiah('Rp 12a3')).toBe('123')
    expect(formatKetikRupiah('007')).toBe('7')
    expect(formatKetikRupiah('')).toBe('')
    expect(formatKetikRupiah('0')).toBe('0')
  })

  it('tanggal tanpa pergeseran zona waktu; persen aman dibagi nol', () => {
    expect(formatTanggal('2027-04-10')).toBe('10 April 2027')
    expect(formatTanggal('2026-11-22T00:00:00.000Z')).toBe('22 November 2026')
    expect(formatTanggal(null)).toBe('—')
    expect(persen(1, 4)).toBe('25%')
    expect(persen(1, 0)).toBe('—')
  })
})
