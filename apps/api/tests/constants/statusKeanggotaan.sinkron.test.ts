import { describe, it, expect } from 'vitest'
import { StatusKeanggotaan } from '../../src/generated/prisma/client.js'
import { STATUS_KEANGGOTAAN_META as API, STATUS_KEANGGOTAAN_VALUES } from '../../src/constants/statusKeanggotaan.js'
// Daftar web murni data (tanpa dependensi), aman diimpor dari tes API untuk menjaga keduanya tetap sama.
import { STATUS_KEANGGOTAAN_META as WEB } from '../../../web/src/lib/statusKeanggotaan.js'

describe('Daftar status keanggotaan: enum DB, API, dan web tidak boleh berselisih', () => {
  it('nilai API sama dengan enum Prisma (urutan tidak diperhitungkan)', () => {
    expect([...STATUS_KEANGGOTAAN_VALUES].sort()).toEqual(Object.values(StatusKeanggotaan).sort())
  })

  it('daftar web sama dengan API: nilai, urutan, label, dan penanda dihitung-aktif', () => {
    expect(WEB.map((s) => ({ value: s.value, label: s.label, dihitungAktif: s.dihitungAktif })))
      .toEqual(API.map((s) => ({ value: s.value, label: s.label, dihitungAktif: s.dihitungAktif })))
  })

  it('tidak ada nilai ganda dan setiap status punya label dan gaya (web)', () => {
    const nilai = WEB.map((s) => s.value)
    expect(new Set(nilai).size).toBe(nilai.length)
    for (const s of WEB) {
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.badge).toMatch(/^bg-.* text-/)
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('hanya AKTIF yang dihitung sebagai anggota aktif', () => {
    expect(API.filter((s) => s.dihitungAktif).map((s) => s.value)).toEqual(['AKTIF'])
  })

  it('Pindah Gereja (atestasi) dan Pindah Agama berlabel jelas dan tidak dihitung aktif', () => {
    const label = Object.fromEntries(API.map((s) => [s.value, s.label]))
    expect(label['PINDAH_GEREJA']).toBe('Pindah Gereja')
    expect(label['PINDAH_KELUAR']).toBe('Pindah Agama')
  })
})
