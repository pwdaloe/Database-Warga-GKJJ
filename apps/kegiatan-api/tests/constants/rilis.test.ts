import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { RILIS, RILIS_TERBARU } from '../../src/constants/rilis.js'

const semver = (v: string): number[] => v.split('.').map(Number)
const paket = (relatif: string): { version: string } => JSON.parse(readFileSync(new URL(relatif, import.meta.url), 'utf8'))

describe('catatan rilis', () => {
  it('versi terbaru sama dengan version di package.json API dan web (tidak boleh lupa menaikkan)', () => {
    expect(paket('../../package.json').version).toBe(RILIS_TERBARU.versi)
    expect(paket('../../../kegiatan-web/package.json').version).toBe(RILIS_TERBARU.versi)
  })

  it('setiap versi berformat MAJOR.MINOR.PATCH, unik, dan terurut menurun (terbaru di atas)', () => {
    for (const r of RILIS) expect(r.versi).toMatch(/^\d+\.\d+\.\d+$/)
    expect(new Set(RILIS.map((r) => r.versi)).size).toBe(RILIS.length)
    for (let i = 1; i < RILIS.length; i++) {
      const [a, b] = [semver(RILIS[i - 1]!.versi), semver(RILIS[i]!.versi)]
      const lebihBaru = a[0]! !== b[0]! ? a[0]! > b[0]! : a[1]! !== b[1]! ? a[1]! > b[1]! : a[2]! > b[2]!
      expect(lebihBaru).toBe(true)
    }
  })

  it('tanggal valid (YYYY-MM-DD), tidak menurun ke masa depan, dan tiap rilis memuat perubahan berjenis sah', () => {
    for (let i = 0; i < RILIS.length; i++) {
      const r = RILIS[i]!
      expect(r.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(r.tanggal))).toBe(false)
      if (i > 0) expect(r.tanggal >= RILIS[i]!.tanggal && RILIS[i - 1]!.tanggal >= r.tanggal).toBe(true)
      expect(r.judul.length).toBeGreaterThan(3)
      expect(r.perubahan.length).toBeGreaterThan(0)
      for (const p of r.perubahan) {
        expect(['BARU', 'PEMBARUAN', 'PERBAIKAN']).toContain(p.jenis)
        expect(p.teks.length).toBeGreaterThan(10)
      }
    }
  })
})
