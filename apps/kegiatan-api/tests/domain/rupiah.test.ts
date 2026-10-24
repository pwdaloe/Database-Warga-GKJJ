import { describe, it, expect } from 'vitest'
import { hitungJumlah, jumlahkan, MAKS_RUPIAH, rupiah, volumeSchema } from '../../src/domain/rupiah.js'

describe('hitungJumlah (BigInt)', () => {
  it('volume × harga tepat, tanpa pembulatan', () => {
    expect(hitungJumlah(40, 25_000)).toBe(1_000_000n)
    expect(hitungJumlah(3, 1_000_000)).toBe(3_000_000n)
  })

  it('tetap tepat di atas batas int32 (2,1 miliar)', () => {
    expect(hitungJumlah(1000, 3_000_000)).toBe(3_000_000_000n)
  })

  it('melempar bila hasil melebihi 1 triliun', () => {
    expect(() => hitungJumlah(1_000_000, 2_000_000)).toThrow(RangeError)
    expect(hitungJumlah(1_000_000, 1_000_000)).toBe(1_000_000_000_000n) // tepat di batas masih sah
  })
})

describe('jumlahkan', () => {
  it('menjumlah campuran bigint dan number; kosong = 0', () => {
    expect(jumlahkan([1n, 2, 3n])).toBe(6n)
    expect(jumlahkan([])).toBe(0n)
  })
})

describe('skema rupiah', () => {
  it.each([[0], [1], [MAKS_RUPIAH]])('menerima %d', (n) => expect(rupiah.safeParse(n).success).toBe(true))
  it.each([[-1], [1.5], [MAKS_RUPIAH + 1], [NaN], ['100'], [null]])('menolak %j', (n) => expect(rupiah.safeParse(n).success).toBe(false))
  it('volume: bilangan bulat 1..1.000.000', () => {
    expect(volumeSchema.safeParse(1).success).toBe(true)
    for (const v of [0, -1, 2.5, 1_000_001]) expect(volumeSchema.safeParse(v).success).toBe(false)
  })
})
