import { describe, it, expect } from 'vitest'
import { deriveBannerState, isChunkLoadError, type SystemStatus } from './appVersion'

const st = (o: Partial<SystemStatus> = {}): SystemStatus => ({ maintenance: false, message: null, version: 'abc1234', ...o })

describe('deriveBannerState', () => {
  it('maintenance menang atas semuanya', () => {
    expect(deriveBannerState(st({ maintenance: true, version: 'zzz' }), 'abc1234', true)).toBe('maintenance')
  })
  it('versi server berbeda dengan versi bundle → versi baru', () => {
    expect(deriveBannerState(st({ version: 'new9999' }), 'abc1234')).toBe('new-version')
  })
  it('versi sama → tidak ada bar', () => {
    expect(deriveBannerState(st(), 'abc1234')).toBeNull()
  })
  it('status belum diketahui (null) → tidak ada bar', () => {
    expect(deriveBannerState(null, 'abc1234')).toBeNull()
  })
  it('server belum punya file versi (null) → tidak ada bar', () => {
    expect(deriveBannerState(st({ version: null }), 'abc1234')).toBeNull()
  })
  it('mode dev tidak pernah menampilkan bar versi baru', () => {
    expect(deriveBannerState(st({ version: 'new9999' }), 'dev')).toBeNull()
  })
  it('chunk gagal dimuat → versi baru, walau status tidak diketahui', () => {
    expect(deriveBannerState(null, 'abc1234', true)).toBe('new-version')
  })
})

describe('isChunkLoadError', () => {
  it.each([
    'ChunkLoadError: Loading chunk 123 failed.',
    'Loading chunk app/page failed.',
    'Failed to fetch dynamically imported module: https://x/_next/static/chunks/a.js',
    { name: 'ChunkLoadError', message: 'timeout' },
  ])('mengenali %j', (v) => expect(isChunkLoadError(v)).toBe(true))

  it.each(['TypeError: x is undefined', { name: 'Error', message: 'Network Error' }, undefined, null])(
    'bukan chunk error: %j',
    (v) => expect(isChunkLoadError(v)).toBe(false),
  )
})
