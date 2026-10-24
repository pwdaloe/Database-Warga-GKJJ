import { describe, it, expect } from 'vitest'
import { buatQrToken, adalahQrTokenValid, samarkanQrTokenDiUrl } from '../../src/utils/qrToken.js'

describe('buatQrToken', () => {
  it('32 karakter hex huruf kecil (128 bit)', () => {
    for (let i = 0; i < 50; i++) expect(buatQrToken()).toMatch(/^[0-9a-f]{32}$/)
  })

  it('tidak ada bentrok pada 10.000 pembangkitan', () => {
    const set = new Set<string>()
    for (let i = 0; i < 10_000; i++) set.add(buatQrToken())
    expect(set.size).toBe(10_000)
  })

  it('tidak berurutan: selisih antar token tidak konstan dan tidak naik monoton', () => {
    const t = Array.from({ length: 20 }, () => BigInt('0x' + buatQrToken()))
    const naik = t.every((v, i) => i === 0 || v > t[i - 1]!)
    expect(naik).toBe(false)
  })
})

describe('adalahQrTokenValid', () => {
  it('menerima token yang dibuat dan UUID tanpa tanda hubung dari DB', () => {
    expect(adalahQrTokenValid(buatQrToken())).toBe(true)
    expect(adalahQrTokenValid('0123456789abcdef0123456789abcdef')).toBe(true)
  })

  it.each([
    ['id numerik', '123'],
    ['kosong', ''],
    ['terlalu pendek', 'abcdef'],
    ['terlalu panjang', 'a'.repeat(33)],
    ['huruf besar', 'ABCDEF0123456789ABCDEF0123456789'],
    ['bukan hex', 'g'.repeat(32)],
    ['ada tanda hubung', '01234567-89ab-cdef-0123-456789abcdef'],
    ['spasi di ujung', '0123456789abcdef0123456789abcde '],
  ])('menolak %s', (_nama, nilai) => {
    expect(adalahQrTokenValid(nilai)).toBe(false)
  })

  it('menolak bukan string', () => {
    expect(adalahQrTokenValid(undefined)).toBe(false)
    expect(adalahQrTokenValid(12345)).toBe(false)
    expect(adalahQrTokenValid(null)).toBe(false)
  })
})

describe('samarkanQrTokenDiUrl (log akses)', () => {
  const t = '0123456789abcdef0123456789abcdef'

  it('menyamarkan token di jalur publik anggota', () => {
    expect(samarkanQrTokenDiUrl(`/api/public/member/${t}`)).toBe('/api/public/member/[token]')
    expect(samarkanQrTokenDiUrl(`/api/public/member/${t}?x=1`)).toBe('/api/public/member/[token]?x=1')
  })

  it('menyamarkan juga id numerik lama', () => {
    expect(samarkanQrTokenDiUrl('/api/public/member/42')).toBe('/api/public/member/[token]')
  })

  it('jalur lain tidak diubah', () => {
    expect(samarkanQrTokenDiUrl('/api/warga/5')).toBe('/api/warga/5')
    expect(samarkanQrTokenDiUrl('/health')).toBe('/health')
  })
})
