import { describe, it, expect } from 'vitest'
import { buildPerpindahanWhatsAppMessage } from './perpindahanWhatsapp'

function basePerpindahan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    jenis: 'KELUAR',
    nomorSurat: 'SK-001',
    gerejaAsalTujuan: 'GKJ Lain',
    warga: { namaLengkap: 'Budi Santoso', namaPanggilan: 'Budi' },
    ...overrides,
  }
}

describe('buildPerpindahanWhatsAppMessage', () => {
  it('mengandung nama, jenis, dan nomor surat yang benar', () => {
    const msg = buildPerpindahanWhatsAppMessage(basePerpindahan())

    expect(msg).toContain('Budi')
    expect(msg).toContain('Budi Santoso')
    expect(msg).toContain('Pindah Keluar')
    expect(msg).toContain('SK-001')
  })

  it('memetakan label jenis dengan benar untuk MASUK dan MENINGGAL', () => {
    expect(buildPerpindahanWhatsAppMessage(basePerpindahan({ jenis: 'MASUK' }))).toContain('Pindah Masuk')
    expect(buildPerpindahanWhatsAppMessage(basePerpindahan({ jenis: 'MENINGGAL' }))).toContain('Keterangan Kematian')
  })

  it('fallback ke "-" jika nomorSurat kosong', () => {
    const msg = buildPerpindahanWhatsAppMessage(basePerpindahan({ nomorSurat: null }))
    expect(msg).toContain('Nomor Surat:* -')
  })

  it('menggunakan namaLengkap jika namaPanggilan tidak ada', () => {
    const msg = buildPerpindahanWhatsAppMessage(
      basePerpindahan({ warga: { namaLengkap: 'Siti Aminah', namaPanggilan: null } }),
    )
    expect(msg).toContain('Halo Siti Aminah!')
  })
})
