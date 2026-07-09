import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMutateAsync = vi.fn()

vi.mock('@/hooks/usePerpindahan', () => ({
  usePerpindahanMutations: () => ({
    create: { mutateAsync: mockMutateAsync, isPending: false },
  }),
}))

vi.mock('@/hooks/useWarga', () => ({
  useWargaList: () => ({
    data: { data: [{ id: 10, namaLengkap: 'Budi Santoso', nomorAnggota: 'WRG00010' }] },
  }),
}))

const { PerpindahanForm } = await import('./PerpindahanForm')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PerpindahanForm', () => {
  it('submit tanpa pilih warga menampilkan error validasi, mutation tidak terpanggil', async () => {
    render(<PerpindahanForm onSuccess={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /simpan/i }))

    expect(await screen.findByText('Pilih warga terlebih dahulu')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('submit tanpa pilih jenis menampilkan error validasi', async () => {
    render(<PerpindahanForm onSuccess={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Cari nama warga...'), { target: { value: 'Budi' } })
    fireEvent.click(await screen.findByText('Budi Santoso'))

    fireEvent.click(screen.getByRole('button', { name: /simpan/i }))

    expect(await screen.findByText('Pilih jenis perpindahan')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('submit dengan data valid memanggil mutation create dengan payload yang benar', async () => {
    mockMutateAsync.mockResolvedValue({ id: 1 })
    const onSuccess = vi.fn()
    render(<PerpindahanForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByPlaceholderText('Cari nama warga...'), { target: { value: 'Budi' } })
    fireEvent.click(await screen.findByText('Budi Santoso'))

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'KELUAR' } })

    fireEvent.click(screen.getByRole('button', { name: /simpan/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ wargaId: 10, jenis: 'KELUAR' }),
      )
    })
    expect(onSuccess).toHaveBeenCalled()
  })
})
