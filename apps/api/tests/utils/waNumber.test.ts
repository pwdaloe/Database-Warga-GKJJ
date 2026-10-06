import { describe, it, expect } from 'vitest'
import { normalizeWa, waLink, maskWa } from '../../src/utils/waNumber.js'
import { generatePassword } from '../../src/utils/password.js'
import { renderTemplate, unknownPlaceholders } from '../../src/services/pesan.service.js'

describe('normalizeWa', () => {
  it.each([
    ['0812-3456-7890', '6281234567890'],
    ['+62 812 3456 7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['81234567890', '6281234567890'],
    ['(0812) 3456 7890', '6281234567890'],
  ])('%s → %s', (input, expected) => expect(normalizeWa(input)).toBe(expected))

  it.each([[''], [null], [undefined], ['abc'], ['0812'], ['021-5551234567890123']])(
    '%s → null', (input) => expect(normalizeWa(input as any)).toBeNull(),
  )
})

describe('waLink & maskWa', () => {
  it('membentuk tautan wa.me, teks di-encode', () => {
    expect(waLink('0812-3456-7890')).toBe('https://wa.me/6281234567890')
    expect(waLink('0812-3456-7890', 'Shalom & salam')).toBe('https://wa.me/6281234567890?text=Shalom%20%26%20salam')
  })
  it('nomor tidak valid → null, bukan tautan rusak', () => expect(waLink('xx')).toBeNull())
  it('maskWa menyembunyikan bagian tengah', () => expect(maskWa('081234567890')).toBe('62812*****890'))
})

describe('generatePassword', () => {
  it('10 karakter, tanpa karakter ambigu, berbeda tiap panggilan', () => {
    const a = generatePassword(); const b = generatePassword()
    expect(a).toHaveLength(10)
    expect(a).not.toMatch(/[0O1lI]/)
    expect(a).not.toBe(b)
  })
})

describe('renderTemplate', () => {
  it('mengganti placeholder dikenal; yang tidak ada datanya dibiarkan', () => {
    expect(renderTemplate('Halo {{nama}} / {{ username }} / {{x}} / {{role}}', { nama: 'Budi', username: 'budi' }))
      .toBe('Halo Budi / budi / {{x}} / {{role}}')
  })
  it('unknownPlaceholders mendeteksi placeholder salah ketik', () => {
    expect(unknownPlaceholders('{{nama}} {{pasword}} {{pasword}}')).toEqual(['pasword'])
  })
})
