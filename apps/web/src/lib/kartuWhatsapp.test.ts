import { describe, it, expect } from 'vitest'
import { buildWhatsAppMessage } from './kartuWhatsapp'

const TOKEN = '0123456789abcdef0123456789abcdef'
const warga = {
  id: 77, namaLengkap: 'Ani Wijaya', nomorAnggota: 'WRG00077', statusKeanggotaan: 'AKTIF',
  sudahBaptis: true, sudahSidi: false, keluarga: { kelompok: { nama: 'Cempaka', wilayah: { nama: 'Barat' } } },
}

describe('buildWhatsAppMessage', () => {
  it('menautkan kartu digital dengan token, tidak memuat id berurutan', () => {
    const msg = buildWhatsAppMessage({ ...warga, qrToken: TOKEN })
    expect(msg).toContain(`${window.location.origin}/m/${TOKEN}`)
    expect(msg).not.toContain('/m/77')
  })

  it('tanpa token: baris kartu digital dihilangkan, pesan tetap utuh', () => {
    const msg = buildWhatsAppMessage(warga)
    expect(msg).not.toContain('/m/')
    expect(msg).not.toContain('Kartu digital')
    expect(msg).toContain('Ani Wijaya')
    expect(msg).not.toMatch(/undefined|null/)
  })
})
