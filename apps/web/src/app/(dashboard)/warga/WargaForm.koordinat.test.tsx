import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useKeluarga', () => ({
  useWilayahKelompok: () => ({ data: [] }),
  useKeluargaList: () => ({ data: { data: [] } }),
  useKeluargaDetail: () => ({ data: undefined }),
}))

const { WargaForm } = await import('./WargaForm')

const base = {
  namaLengkap: 'Soenarto',
  jenisKelamin: 'L' as const,
  statusKeluarga: 'ANAK' as const,
  statusKeanggotaan: 'AKTIF' as const,
}

async function isiKoordinatDanSubmit(defaults: any, lat: string, lng: string) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<WargaForm defaultValues={defaults} onSubmit={onSubmit} submitLabel="Update Warga" />)
  fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
  fireEvent.change(screen.getByPlaceholderText('-6.2088'), { target: { value: lat } })
  fireEvent.change(screen.getByPlaceholderText('106.8456'), { target: { value: lng } })
  fireEvent.click(screen.getByRole('button', { name: /update warga/i }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  return onSubmit.mock.calls[0][0]
}

describe('WargaForm — koordinat rumah', () => {
  it('latitude & longitude yang diisi ikut terkirim saat submit (edit)', async () => {
    const data = await isiKoordinatDanSubmit({ ...base, latitude: null, longitude: null }, '-6.2088', '106.8456')
    expect(data.latitude).toBe(-6.2088)
    expect(data.longitude).toBe(106.8456)
  })

  it('latitude & longitude juga terkirim saat form dibuka tanpa defaultValues koordinat', async () => {
    const data = await isiKoordinatDanSubmit({ ...base }, '-6.2', '106.8')
    expect(data.latitude).toBe(-6.2)
    expect(data.longitude).toBe(106.8)
  })

  it('koordinat tersimpan sebelumnya dimuat ke kolom saat edit', async () => {
    render(<WargaForm defaultValues={{ ...base, latitude: -6.25, longitude: 106.9 }} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
    expect((screen.getByPlaceholderText('-6.2088') as HTMLInputElement).value).toBe('-6.25')
    expect((screen.getByPlaceholderText('106.8456') as HTMLInputElement).value).toBe('106.9')
  })

  it('desimal koma (keyboard Indonesia) diterima: "-6,2088" → -6.2088', async () => {
    const data = await isiKoordinatDanSubmit({ ...base }, '-6,2088', '106,8456')
    expect(data.latitude).toBe(-6.2088)
    expect(data.longitude).toBe(106.8456)
  })

  it('menempel "lat, lng" dari Google Maps di kolom Latitude mengisi kedua kolom', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<WargaForm defaultValues={{ ...base }} onSubmit={onSubmit} submitLabel="Update Warga" />)
    fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
    fireEvent.paste(screen.getByPlaceholderText('-6.2088'), {
      clipboardData: { getData: () => '-6.2088, 106.8456' },
    })
    expect((screen.getByPlaceholderText('106.8456') as HTMLInputElement).value).toBe('106.8456')
    fireEvent.click(screen.getByRole('button', { name: /update warga/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ latitude: -6.2088, longitude: 106.8456 })
  })

  it('input bukan angka memblokir submit dan menampilkan pesan (tidak diam-diam kosong)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<WargaForm defaultValues={{ ...base }} onSubmit={onSubmit} submitLabel="Update Warga" />)
    fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
    fireEvent.change(screen.getByPlaceholderText('-6.2088'), { target: { value: 'enam koma dua' } })
    fireEvent.click(screen.getByRole('button', { name: /update warga/i }))
    expect(await screen.findByText(/Latitude harus berupa angka/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('latitude di luar -90..90 ditolak', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<WargaForm defaultValues={{ ...base }} onSubmit={onSubmit} submitLabel="Update Warga" />)
    fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
    fireEvent.change(screen.getByPlaceholderText('-6.2088'), { target: { value: '106.8' } })
    fireEvent.click(screen.getByRole('button', { name: /update warga/i }))
    expect(await screen.findByText(/Latitude harus antara -90 dan 90/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('mengosongkan kolom mengirim null (koordinat dihapus sengaja)', async () => {
    const data = await isiKoordinatDanSubmit({ ...base, latitude: -6.2, longitude: 106.8 }, '', '')
    expect(data.latitude).toBeNull()
    expect(data.longitude).toBeNull()
  })
})
