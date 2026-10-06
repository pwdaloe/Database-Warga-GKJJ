import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/lib/api', () => ({ api: { post: (...a: any[]) => post(...a) } }))

import { InfoAkunModal } from './InfoAkunModal'

const user: any = { id: 9, nama: 'Budi', username: 'budi.s' }
const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{ui}</QueryClientProvider>)

beforeEach(() => post.mockReset())

describe('InfoAkunModal', () => {
  it('menampilkan password sekali, menyiapkan pesan sekali, tombol WhatsApp memakai wa.me', async () => {
    post.mockResolvedValue({ data: { data: { nomor: '6281', pesan: 'Shalom Budi', waLink: 'https://wa.me/6281?text=Shalom' } } })
    wrap(<InfoAkunModal info={{ user, password: 'Ab3xK9mQpz', templateKode: 'AKUN_BARU' }} onClose={() => {}} />)
    expect(screen.getByText('Ab3xK9mQpz')).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: /Kirim via WhatsApp/ })
    expect(link).toHaveAttribute('href', 'https://wa.me/6281?text=Shalom')
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/users/9/notifikasi', { templateKode: 'AKUN_BARU', password: 'Ab3xK9mQpz' })
  })
})
