import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicMemberPage from './page'

const get = vi.fn()
vi.mock('@/lib/api', () => ({ api: { get: (...a: any[]) => get(...a) } }))
vi.mock('next/navigation', () => ({ useParams: () => ({ token: '0123456789abcdef0123456789abcdef' }) }))

beforeEach(() => { get.mockReset() })

describe('Halaman publik kartu /m/[token]', () => {
  it('memanggil API dengan token dari URL', async () => {
    get.mockResolvedValue({ data: { data: { id: 1, namaLengkap: 'Ani Wijaya', jenisKelamin: 'P', statusKeanggotaan: 'AKTIF', statusKeluarga: 'ISTRI', sudahBaptis: true, sudahSidi: true } } })
    render(<PublicMemberPage />)
    expect(await screen.findByText('Ani Wijaya')).toBeTruthy()
    expect(get).toHaveBeenCalledWith('/public/member/0123456789abcdef0123456789abcdef')
  })

  it('404 → pesan jelas kartu sudah diperbarui (bukan pesan server)', async () => {
    get.mockRejectedValue({ response: { status: 404, data: { error: 'Anggota tidak ditemukan' } } })
    render(<PublicMemberPage />)
    expect(await screen.findByText(/sudah diperbarui/)).toBeTruthy()
    expect(screen.getByText('Kartu Tidak Tersedia')).toBeTruthy()
  })

  it('error jaringan/server → pesan berbeda dari 404 (tidak menyesatkan)', async () => {
    get.mockRejectedValue({ response: { status: 500 } })
    render(<PublicMemberPage />)
    expect(await screen.findByText(/Tidak dapat memuat kartu/)).toBeTruthy()
    expect(screen.queryByText(/sudah diperbarui/)).toBeNull()
  })
})
