import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const useHubungi = vi.fn()
vi.mock('@/hooks/useHubungi', () => ({ useHubungi: () => useHubungi() }))

import HubungiPage from './page'

const data = {
  waCenter: [{ nama: 'GKJ WhatsApp Center', keterangan: null, link: 'https://wa.me/6281111111111' }],
  majelis: { nama: 'Bpk Penatua', keterangan: 'Kelompok 5', link: 'https://wa.me/6281222222222?text=Shalom' },
  kepalaKantor: [{ nama: 'Bpk Kepala', keterangan: null, link: 'https://wa.me/6281333333333' }],
  pendeta: [
    { nama: 'Pdt. A', keterangan: null, link: 'https://wa.me/6281444444444', emeritus: false },
    { nama: 'Pdt. Em', keterangan: null, link: 'https://wa.me/6281555555555', emeritus: true },
  ],
}

beforeEach(() => useHubungi.mockReset())

describe('Halaman Hubungi', () => {
  it('menampilkan empat kelompok kontak dengan tautan wa.me', () => {
    useHubungi.mockReturnValue({ data, isLoading: false })
    render(<HubungiPage />)
    for (const h of ['GKJ WhatsApp Center', 'Majelis Kelompok', 'Kepala Kantor', 'Pendeta']) {
      expect(screen.getAllByText(h).length).toBeGreaterThan(0)
    }
    const links = screen.getAllByRole('link', { name: /Chat WhatsApp/ }).map((a) => a.getAttribute('href'))
    expect(links).toHaveLength(5)
    expect(links.every((l) => l!.startsWith('https://wa.me/62'))).toBe(true)
    expect(screen.getByText('Emeritus')).toBeInTheDocument()
  })

  it('kontak kosong → pesan pengganti, bukan tautan rusak', () => {
    useHubungi.mockReturnValue({ data: { waCenter: [], majelis: null, kepalaKantor: [], pendeta: [] }, isLoading: false })
    render(<HubungiPage />)
    expect(screen.queryAllByRole('link', { name: /Chat WhatsApp/ })).toHaveLength(0)
    expect(screen.getByText(/majelis kelompok Anda belum tersedia/i)).toBeInTheDocument()
    expect(screen.getAllByText('Belum tersedia.')).toHaveLength(3)
  })
})
