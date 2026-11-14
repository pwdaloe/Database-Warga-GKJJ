import { describe, it, expect } from 'vitest'
import { galatMemuatChunk, turunkanStatusBar } from './appVersion'

const status = (o: { aktif?: boolean; commit?: string | null } = {}) => ({ pemeliharaan: { aktif: o.aktif ?? false, pesan: null }, commit: o.commit === undefined ? 'abc1234' : o.commit })

describe('turunkanStatusBar', () => {
  it('pemeliharaan menang atas semua (juga atas versi berbeda)', () => {
    expect(turunkanStatusBar(status({ aktif: true, commit: 'baru999' }), 'abc1234')).toBe('pemeliharaan')
  })
  it('commit server berbeda → versi-baru', () => {
    expect(turunkanStatusBar(status({ commit: 'baru999' }), 'abc1234')).toBe('versi-baru')
  })
  it('commit sama → tidak ada bar', () => {
    expect(turunkanStatusBar(status(), 'abc1234')).toBeNull()
  })
  it('mode dev tidak pernah menampilkan versi-baru', () => {
    expect(turunkanStatusBar(status({ commit: 'baru999' }), 'dev')).toBeNull()
  })
  it('commit server belum diketahui (null) → tidak ada bar', () => {
    expect(turunkanStatusBar(status({ commit: null }), 'abc1234')).toBeNull()
  })
  it('status belum ada/gagal dimuat → tidak ada bar', () => {
    expect(turunkanStatusBar(null, 'abc1234')).toBeNull()
  })
  it('galat chunk → versi-baru walau status sama; pemeliharaan tetap menang', () => {
    expect(turunkanStatusBar(status(), 'abc1234', true)).toBe('versi-baru')
    expect(turunkanStatusBar(status({ aktif: true }), 'abc1234', true)).toBe('pemeliharaan')
  })
})

describe('galatMemuatChunk', () => {
  it.each(['ChunkLoadError: Loading chunk 123 failed', 'Loading chunk app/page failed.', 'Failed to fetch dynamically imported module: /_next/x.js'])('mengenali %s', (t) => {
    expect(galatMemuatChunk(t)).toBe(true)
    expect(galatMemuatChunk(new Error(t))).toBe(true)
  })
  it('galat lain bukan chunk', () => {
    expect(galatMemuatChunk('Network Error')).toBe(false)
    expect(galatMemuatChunk(new TypeError('x is undefined'))).toBe(false)
    expect(galatMemuatChunk(undefined)).toBe(false)
  })
})
