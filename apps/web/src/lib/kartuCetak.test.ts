import { describe, it, expect, vi, beforeEach } from 'vitest'

const toDataURL = vi.fn()
vi.mock('qrcode', () => ({ default: { toDataURL: (...a: any[]) => toDataURL(...a) } }))

const { buildIdCardHtml } = await import('./kartuCetak')

const TOKEN = '0123456789abcdef0123456789abcdef'
const warga = {
  id: 77, namaLengkap: 'Ani Wijaya', jenisKelamin: 'P', statusKeanggotaan: 'AKTIF', statusKeluarga: 'ISTRI',
  nomorAnggota: 'WRG00077', sudahBaptis: true, sudahSidi: true,
  keluarga: { kelompok: { nama: 'Cempaka', wilayah: { nama: 'Barat' } } },
}

beforeEach(() => { toDataURL.mockReset(); toDataURL.mockResolvedValue('data:image/png;base64,QR') })

describe('buildIdCardHtml — QR kartu cetak', () => {
  it('QR berisi {origin}/m/{token}, bukan id berurutan', async () => {
    const html = await buildIdCardHtml({ ...warga, qrToken: TOKEN }, 'https://jemaat.gkjjakarta.org')
    expect(toDataURL).toHaveBeenCalledTimes(1)
    expect(toDataURL.mock.calls[0]![0]).toBe(`https://jemaat.gkjjakarta.org/m/${TOKEN}`)
    expect(toDataURL.mock.calls[0]![0]).not.toContain('/m/77')
    expect(html).toContain('data:image/png;base64,QR')
    expect(html).not.toContain('QR belum')
  })

  it('tanpa token valid: QR tidak dibuat sama sekali dan kartu menyatakan QR belum tersedia (tidak jatuh ke id)', async () => {
    const html = await buildIdCardHtml({ ...warga }, 'https://jemaat.gkjjakarta.org')
    expect(toDataURL).not.toHaveBeenCalled()
    expect(html).toContain('QR belum')
    expect(html).not.toContain('/m/77')
  })

  it('token tidak valid (mis. id numerik) diperlakukan sama seperti tidak ada', async () => {
    await buildIdCardHtml({ ...warga, qrToken: '77' }, 'https://x.org')
    expect(toDataURL).not.toHaveBeenCalled()
  })
})
