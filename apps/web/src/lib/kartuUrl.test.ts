import { describe, it, expect } from 'vitest'
import { tautanKartu, adalahQrTokenValid } from './kartuUrl'

const TOKEN = '0123456789abcdef0123456789abcdef'

describe('tautanKartu', () => {
  it('memakai token, bukan id: {origin}/m/{token}', () => {
    expect(tautanKartu('https://jemaat.gkjjakarta.org', { qrToken: TOKEN, id: 5 } as any))
      .toBe(`https://jemaat.gkjjakarta.org/m/${TOKEN}`)
  })

  it('tidak menggandakan garis miring di origin', () => {
    expect(tautanKartu('https://x.org/', { qrToken: TOKEN })).toBe(`https://x.org/m/${TOKEN}`)
  })

  it('tanpa token valid → null, TIDAK jatuh ke id berurutan', () => {
    for (const w of [{ id: 5 }, { id: 5, qrToken: '5' }, { id: 5, qrToken: 'ABC' }, { qrToken: undefined }, { qrToken: null }, null, undefined]) {
      expect(tautanKartu('https://x.org', w as any)).toBeNull()
    }
  })
})

describe('adalahQrTokenValid', () => {
  it('sama ketatnya dengan API', () => {
    expect(adalahQrTokenValid(TOKEN)).toBe(true)
    expect(adalahQrTokenValid(TOKEN.toUpperCase())).toBe(false)
    expect(adalahQrTokenValid(TOKEN + '0')).toBe(false)
    expect(adalahQrTokenValid(12)).toBe(false)
  })
})
