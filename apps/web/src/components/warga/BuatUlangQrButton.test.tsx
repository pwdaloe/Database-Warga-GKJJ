import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BuatUlangQrButton, PERAN_ROTASI_QR } from './BuatUlangQrButton'

const post = vi.fn()
vi.mock('@/lib/api', () => ({ api: { post: (...a: any[]) => post(...a) } }))

function tampil() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <BuatUlangQrButton wargaId={9} nama="Ani Wijaya" />
    </QueryClientProvider>,
  )
}

beforeEach(() => { post.mockReset() })
afterEach(() => { vi.restoreAllMocks() })

describe('BuatUlangQrButton', () => {
  it('dibatalkan di dialog konfirmasi → tidak memanggil API', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    tampil()
    fireEvent.click(screen.getByRole('button', { name: /buat ulang qr/i }))
    // beri kesempatan pada panggilan async (jika ada) untuk terjadi sebelum memeriksa
    await new Promise((r) => setTimeout(r, 30))
    expect(post).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('dikonfirmasi → POST ke rotasi warga yang benar dan menampilkan pesan sukses', async () => {
    const konfirmasi = vi.spyOn(window, 'confirm').mockReturnValue(true)
    post.mockResolvedValue({ data: { data: { qrToken: 'a'.repeat(32) } } })
    tampil()
    fireEvent.click(screen.getByRole('button', { name: /buat ulang qr/i }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/warga/9/qr-token/rotate'))
    expect(konfirmasi.mock.calls[0]![0]).toContain('Ani Wijaya')
    expect(konfirmasi.mock.calls[0]![0]).toContain('tidak berlaku')
    expect((await screen.findByRole('status')).textContent).toContain('QR baru dibuat')
  })

  it('token baru tidak ditampilkan di layar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    post.mockResolvedValue({ data: { data: { qrToken: 'b'.repeat(32) } } })
    const { container } = tampil()
    fireEvent.click(screen.getByRole('button', { name: /buat ulang qr/i }))
    await screen.findByRole('status')
    expect(container.textContent).not.toContain('b'.repeat(32))
  })

  it('gagal → menampilkan pesan error dari server', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    post.mockRejectedValue({ response: { data: { error: 'Data warga tidak ditemukan' } } })
    tampil()
    fireEvent.click(screen.getByRole('button', { name: /buat ulang qr/i }))
    expect((await screen.findByRole('status')).textContent).toContain('Data warga tidak ditemukan')
  })

  it('daftar peran sama dengan penjaga di API', () => {
    expect([...PERAN_ROTASI_QR].sort()).toEqual(['KEPALA_KANTOR', 'STAF_ADMIN', 'SUPERADMIN'])
  })
})
