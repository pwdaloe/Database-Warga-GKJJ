import { describe, it, expect } from 'vitest'
import { parseCoordinateInput, parseCoordinatePair } from './koordinat'

describe('parseCoordinateInput', () => {
  it.each([
    ['-6.2088', -6.2088],
    ['-6,2088', -6.2088],       // desimal koma (keyboard Indonesia)
    ['  106.8456 ', 106.8456],
    ['−6.2088', -6.2088],       // minus unicode hasil salin
    ['0', 0],
  ])('"%s" → %s', (raw, expected) => {
    expect(parseCoordinateInput(raw)).toEqual({ value: expected, valid: true })
  })

  it('kosong → null tapi valid', () => {
    expect(parseCoordinateInput('')).toEqual({ value: null, valid: true })
    expect(parseCoordinateInput('   ')).toEqual({ value: null, valid: true })
  })

  it.each(['-', '-6.', 'abc', '6.2.1', '1,234.5', '--6', '6,2,1'])('"%s" tidak valid', (raw) => {
    expect(parseCoordinateInput(raw).valid).toBe(false)
  })
})

describe('parseCoordinatePair', () => {
  it.each([
    ['-6.2088, 106.8456', [-6.2088, 106.8456]],   // format Google Maps
    ['-6.2088,106.8456', [-6.2088, 106.8456]],
    ['-6,2088 106,8456', [-6.2088, 106.8456]],
    ['-6.2088; 106.8456', [-6.2088, 106.8456]],
    ['-6,2088; 106,8456', [-6.2088, 106.8456]],
    ['−6.2088, 106.8456', [-6.2088, 106.8456]],
  ])('"%s"', (text, expected) => {
    expect(parseCoordinatePair(text as string)).toEqual(expected)
  })

  it.each(['-6.2088', 'abc, def', '', '1,2,3'])('"%s" bukan pasangan', (text) => {
    expect(parseCoordinatePair(text)).toBeNull()
  })
})
