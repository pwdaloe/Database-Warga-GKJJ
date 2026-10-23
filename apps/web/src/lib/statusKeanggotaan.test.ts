import { describe, it, expect } from 'vitest'
import {
  STATUS_KEANGGOTAAN_META, STATUS_KEANGGOTAAN_VALUES, STATUS_KEANGGOTAAN_OPTIONS,
  STATUS_KEANGGOTAAN_LABEL, STATUS_KEANGGOTAAN_BADGE, STATUS_KEANGGOTAAN_HEX,
} from './statusKeanggotaan'

describe('daftar status keanggotaan (satu sumber)', () => {
  it('urutan tampil: Pindah Gereja sebelum Pindah Agama, Meninggal terakhir', () => {
    expect(STATUS_KEANGGOTAAN_VALUES).toEqual(['AKTIF', 'NON_AKTIF', 'KATEKUMEN', 'PINDAH_GEREJA', 'PINDAH_KELUAR', 'MENINGGAL'])
  })

  it('opsi form/filter, label, warna lencana, dan warna peta semuanya turunan dari satu daftar', () => {
    expect(STATUS_KEANGGOTAAN_OPTIONS.map((o) => o.value)).toEqual([...STATUS_KEANGGOTAAN_VALUES])
    for (const s of STATUS_KEANGGOTAAN_META) {
      expect(STATUS_KEANGGOTAAN_LABEL[s.value]).toBe(s.label)
      expect(STATUS_KEANGGOTAAN_BADGE[s.value]).toBe(s.badge)
      expect(STATUS_KEANGGOTAAN_HEX[s.value]).toBe(s.hex)
    }
  })

  it('"Pindah Keluar" tidak lagi muncul sebagai label; kodenya tetap PINDAH_KELUAR dengan label Pindah Agama', () => {
    const labels = STATUS_KEANGGOTAAN_META.map((s) => s.label)
    expect(labels).not.toContain('Pindah Keluar')
    expect(STATUS_KEANGGOTAAN_LABEL['PINDAH_KELUAR']).toBe('Pindah Agama')
    expect(STATUS_KEANGGOTAAN_LABEL['PINDAH_GEREJA']).toBe('Pindah Gereja')
  })

  it('warna Pindah Gereja dan Pindah Agama dibedakan (lencana dan peta)', () => {
    expect(STATUS_KEANGGOTAAN_BADGE['PINDAH_GEREJA']).not.toBe(STATUS_KEANGGOTAAN_BADGE['PINDAH_KELUAR'])
    expect(STATUS_KEANGGOTAAN_HEX['PINDAH_GEREJA']).not.toBe(STATUS_KEANGGOTAAN_HEX['PINDAH_KELUAR'])
  })
})
