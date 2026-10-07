import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Fungsi biasa (bukan vi.fn): Vitest 4 menandai promise tertolak yang dikembalikan vi.fn sebagai galat tes
// walau sudah ditangani komponen. Panggilan dicatat manual.
const panggilan: number[] = []
let tolakDengan: unknown = null
const mutateAsync = async (id: number) => { panggilan.push(id); if (tolakDengan) throw tolakDengan; return {} }
vi.mock('@/hooks/useKeluarga', () => ({ useKeluargaMutations: () => ({ remove: { mutateAsync, isPending: false } }) }))

import { HapusKeluargaModal } from './HapusKeluargaModal'

beforeEach(() => { panggilan.length = 0; tolakDengan = null })
const kosong = { id: 87, nomorKeluarga: 'KLG00087', wargas: [] }

describe('HapusKeluargaModal', () => {
  it('KK kosong: tombol Hapus memanggil API dengan id KK, lalu menutup dan memberi tahu pemanggil', async () => {
    const onClose = vi.fn(); const onDeleted = vi.fn()
    render(<HapusKeluargaModal keluarga={kosong} onClose={onClose} onDeleted={onDeleted} />)
    expect(screen.getByText('KLG00087')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Hapus/ }))
    await waitFor(() => expect(panggilan).toEqual([87]))
    expect(onClose).toHaveBeenCalled(); expect(onDeleted).toHaveBeenCalled()
  })

  it('KK masih punya anggota: tombol Hapus nonaktif dan alasan ditampilkan; API tidak dipanggil', () => {
    render(<HapusKeluargaModal keluarga={{ ...kosong, wargas: [{}, {}] }} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: /Hapus/ })).toBeDisabled()
    expect(screen.getByText(/masih memiliki 2 anggota/)).toBeInTheDocument()
    expect(panggilan).toEqual([])
  })

  it('server menolak: pesan galat tampil di modal (tidak diam), modal tetap terbuka', async () => {
    tolakDengan = { response: { data: { error: 'Keluarga masih memiliki 1 anggota.' } } }
    const onClose = vi.fn(); const onDeleted = vi.fn()
    render(<HapusKeluargaModal keluarga={kosong} onClose={onClose} onDeleted={onDeleted} />)
    fireEvent.click(screen.getByRole('button', { name: /Hapus/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Keluarga masih memiliki 1 anggota.')
    expect(onClose).not.toHaveBeenCalled(); expect(onDeleted).not.toHaveBeenCalled()
  })

  it('tanpa KK terpilih: tidak merender apa pun', () => {
    render(<HapusKeluargaModal keluarga={null} onClose={() => {}} />)
    expect(screen.queryByText('Konfirmasi Hapus')).toBeNull()
  })
})
