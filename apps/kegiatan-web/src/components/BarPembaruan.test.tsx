import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BarPembaruan } from './BarPembaruan'

const ok = (data: object) => ({ ok: true, json: async () => ({ success: true, data }) })
const status = (o: object = {}) => ok({ commit: 'abc1234', pemeliharaan: { aktif: false, pesan: null }, ...o })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'https://api.test/api'
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('BarPembaruan', () => {
  it('pemeliharaan → meminta menyimpan pekerjaan dan memuat ulang setelah selesai', async () => {
    fetchMock.mockResolvedValue(status({ pemeliharaan: { aktif: true, pesan: 'Deploy dimulai' } }))
    render(<BarPembaruan versiBundle="abc1234" />)
    expect(await screen.findByText(/Aplikasi sedang diperbarui/)).toBeInTheDocument()
    expect(screen.getByText(/muat ulang halaman/)).toBeInTheDocument()
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.test/api/versi')
  })

  it('versi server berbeda → "Versi baru tersedia" dan tombol Muat ulang memanggil reload', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    fetchMock.mockResolvedValue(status({ commit: 'baru999' }))
    render(<BarPembaruan versiBundle="abc1234" />)
    expect(await screen.findByText(/Versi baru tersedia/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /muat ulang/i }))
    expect(reload).toHaveBeenCalled()
  })

  it.each([
    ['versi sama', 'abc1234', status()],
    ['mode dev', 'dev', status({ commit: 'baru999' })],
  ])('%s → tidak ada bar', async (_n, bundle, res) => {
    fetchMock.mockResolvedValue(res)
    const { container } = render(<BarPembaruan versiBundle={bundle} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('fetch gagal (API sedang restart) → tidak ada bar dan tidak error', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))
    const { container } = render(<BarPembaruan versiBundle="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('respons non-200 → tidak ada bar', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })
    const { container } = render(<BarPembaruan versiBundle="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('galat memuat chunk (tab lama setelah deploy) → "Versi baru tersedia"', async () => {
    fetchMock.mockResolvedValue(status())
    render(<BarPembaruan versiBundle="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    act(() => { window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason: new Error('Loading chunk 9 failed') })) })
    expect(await screen.findByText(/Versi baru tersedia/)).toBeInTheDocument()
  })

  it('polling berulang: pemeliharaan selesai → bar hilang', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fetchMock.mockResolvedValueOnce(status({ pemeliharaan: { aktif: true, pesan: null } })).mockResolvedValue(status())
    render(<BarPembaruan versiBundle="abc1234" jedaMs={1000} />)
    expect(await screen.findByText(/Aplikasi sedang diperbarui/)).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
    await waitFor(() => expect(screen.queryByText(/Aplikasi sedang diperbarui/)).not.toBeInTheDocument())
    vi.useRealTimers()
  })
})
