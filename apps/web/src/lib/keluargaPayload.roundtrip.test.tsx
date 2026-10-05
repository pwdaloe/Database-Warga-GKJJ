/**
 * Tes round-trip KeluargaForm: data KK dari API → nilai awal → submit tanpa ubah → payload API.
 * Sama dengan tes form Warga: mencegah field tampil di form tetapi tidak dimuat / tidak terkirim.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { keluargaToFormDefaults, buildKeluargaPayload } from './keluargaPayload'

vi.mock('@/hooks/useKeluarga', () => ({
  useWilayahKelompok: () => ({ data: [{ id: 1, nama: 'Wilayah A', kelompoks: [{ id: 3, kode: 'A1', nama: 'Rawamangun Barat' }] }] }),
  useKelurahanSearch: () => ({ data: [] }),
}))

const { KeluargaForm, keluargaFormSchema } = await import('../app/(dashboard)/keluarga/KeluargaForm')

// Bentuk respons API untuk KK dengan SEMUA field terisi
const KK_LENGKAP = {
  id: 5,
  nomorKeluarga: 'KLG00005',
  dataStatus: 'VALIDASI',
  kelompokId: 3,
  kepalakeluargaId: 11,
  alamat: 'Jl. Melati No. 3',
  rt: '001',
  rw: '005',
  kelurahan: 'Rawamangun',
  kecamatan: 'Pulo Gadung',
  kota: 'Jakarta Timur',
  kodePos: '13220',
  teleponRumah: '021-555',
  catatan: 'Catatan KK',
  kelompok: { id: 3, nama: 'Rawamangun Barat' },
  wargas: [{ id: 11, namaLengkap: 'Soenarto', statusKeluarga: 'KEPALA' }],
}

async function submit(kk: any, ubah?: () => void) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(
    <KeluargaForm
      defaultValues={keluargaToFormDefaults(kk)}
      wargas={kk.wargas}
      keluargaId={kk.id}
      onSubmit={onSubmit}
      submitLabel="Update Keluarga"
    />,
  )
  ubah?.()
  fireEvent.click(screen.getByRole('button', { name: /update keluarga/i }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  return buildKeluargaPayload(onSubmit.mock.calls[0][0])
}

describe('round-trip KeluargaForm', () => {
  it('setiap field yang dimuat kembali sama di payload', async () => {
    const payload = await submit(KK_LENGKAP)
    expect(payload).toMatchObject({
      dataStatus: 'VALIDASI', kelompokId: 3, kepalakeluargaId: 11,
      alamat: 'Jl. Melati No. 3', rt: '001', rw: '005', kelurahan: 'Rawamangun',
      kecamatan: 'Pulo Gadung', kota: 'Jakarta Timur', kodePos: '13220',
      teleponRumah: '021-555', catatan: 'Catatan KK',
    })
  })

  it('kolom yang dikosongkan terkirim sebagai null, bukan string kosong', async () => {
    const payload = await submit(KK_LENGKAP, () => {
      fireEvent.change(screen.getByDisplayValue('Jl. Melati No. 3'), { target: { value: '' } })
      fireEvent.change(screen.getByDisplayValue('021-555'), { target: { value: '' } })
    })
    expect(payload.alamat).toBeNull()
    expect(payload.teleponRumah).toBeNull()
    expect(payload.kota).toBe('Jakarta Timur')   // yang tidak diubah tetap
  })

  it('nilai awal dimuat ke kolom saat edit', () => {
    render(
      <KeluargaForm defaultValues={keluargaToFormDefaults(KK_LENGKAP)} wargas={KK_LENGKAP.wargas} keluargaId={5} onSubmit={vi.fn()} />,
    )
    expect(screen.getByDisplayValue('Jl. Melati No. 3')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13220')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Catatan KK')).toBeInTheDocument()
  })
})

describe('paritas skema form ↔ nilai awal', () => {
  it('setiap field di skema form dipetakan oleh keluargaToFormDefaults (gagal bila ada field baru yang lupa dipetakan)', () => {
    const skema = Object.keys((keluargaFormSchema as any).shape)
    const dipetakan = new Set(Object.keys(keluargaToFormDefaults(KK_LENGKAP)))
    expect(skema.filter((f) => !dipetakan.has(f))).toEqual([])
  })

  it('buildKeluargaPayload: string kosong → null, nilai lain utuh', () => {
    expect(buildKeluargaPayload({ a: '', b: 'x', c: 0, d: null, e: false }))
      .toEqual({ a: null, b: 'x', c: 0, d: null, e: false })
  })
})
