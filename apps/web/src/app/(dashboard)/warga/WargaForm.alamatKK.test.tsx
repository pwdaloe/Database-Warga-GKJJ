import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { buildWargaPayload, wargaToFormDefaults } from '@/lib/wargaPayload'

vi.mock('@/hooks/useKeluarga', () => ({
  useWilayahKelompok: () => ({ data: [] }),
  useKeluargaList: () => ({ data: { data: [] } }),
  useKeluargaDetail: () => ({ data: { id: 5, nomorKeluarga: 'KLG00005', kelompok: { nama: 'Rawamangun Barat' }, wargas: [] } }),
}))

const { WargaForm } = await import('./WargaForm')

// Data seperti yang dikembalikan API untuk Kepala Keluarga yang sudah punya KK
const kepala = {
  id: 1, namaLengkap: 'Soenarto', jenisKelamin: 'L', statusKeluarga: 'KEPALA', statusKeanggotaan: 'AKTIF',
  keluargaId: 5, latitude: null, longitude: null, alamatKtp: 'Jl. KTP 1',
  keluarga: { id: 5, alamat: 'Jl. Melati 3', rt: '001', rw: '005', kelurahan: 'Rawamangun', kecamatan: 'Pulo Gadung', kota: 'Jakarta Timur', kodePos: '13220', teleponRumah: '021-123' },
}

describe('WargaForm — alamat KK untuk Kepala Keluarga yang sudah punya KK', () => {
  it('alamat KK tersimpan dimuat ke tab Alamat saat edit (tidak kosong)', () => {
    render(<WargaForm defaultValues={wargaToFormDefaults(kepala)} onSubmit={vi.fn()} submitLabel="Update Warga" />)
    fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
    expect(screen.getByDisplayValue('Jl. Melati 3')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rawamangun')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13220')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jl. KTP 1')).toBeInTheDocument()
  })

  it('mengubah alamat KK → payload memuat alamatKeluarga (bukan newKeluarga) dengan nilai baru', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<WargaForm defaultValues={wargaToFormDefaults(kepala)} onSubmit={onSubmit} submitLabel="Update Warga" />)
    fireEvent.click(screen.getByRole('button', { name: /alamat/i }))
    fireEvent.change(screen.getByDisplayValue('Jl. Melati 3'), { target: { value: 'Jl. Mawar 9' } })
    fireEvent.click(screen.getByRole('button', { name: /update warga/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())

    const payload = buildWargaPayload(onSubmit.mock.calls[0][0])
    expect(payload.alamatKeluarga).toMatchObject({ alamat: 'Jl. Mawar 9', rt: '001', kelurahan: 'Rawamangun', kodePos: '13220' })
    expect(payload.newKeluarga).toBeUndefined()
    expect(payload.keluargaId).toBe(5)
  })

  it('tab Keluarga untuk Kepala yang sudah punya KK tidak lagi menyebut "KK baru akan dibuat"', () => {
    render(<WargaForm defaultValues={wargaToFormDefaults(kepala)} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /keluarga/i }))
    expect(screen.queryByText(/KK baru akan dibuat/i)).not.toBeInTheDocument()
    expect(screen.getByText(/KLG00005/)).toBeInTheDocument()
  })
})
