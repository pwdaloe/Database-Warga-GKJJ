import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UpdateBanner } from './UpdateBanner'

const ok = (data: object) => ({ ok: true, json: async () => ({ success: true, data }) })
const status = (o: object = {}) => ok({ maintenance: false, message: null, version: 'abc1234', ...o })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'https://api.test/api'
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UpdateBanner', () => {
  it('maintenance → menampilkan teks pembaruan sedang berlangsung', async () => {
    fetchMock.mockResolvedValue(status({ maintenance: true }))
    render(<UpdateBanner appVersion="abc1234" />)
    expect(await screen.findByText(/Pembaruan sistem sedang berlangsung/)).toBeInTheDocument()
    expect(screen.getByText(/Simpan pekerjaan Anda/)).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/system/status')
  })

  it('versi server berbeda → "Versi baru tersedia" + tombol Muat ulang memanggil reload', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    fetchMock.mockResolvedValue(status({ version: 'new9999' }))
    render(<UpdateBanner appVersion="abc1234" />)
    expect(await screen.findByText('Versi baru tersedia.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /muat ulang/i }))
    expect(reload).toHaveBeenCalled()
  })

  it('versi sama → tidak ada bar', async () => {
    fetchMock.mockResolvedValue(status())
    const { container } = render(<UpdateBanner appVersion="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('mode dev: versi berbeda tidak memunculkan bar', async () => {
    fetchMock.mockResolvedValue(status({ version: 'new9999' }))
    const { container } = render(<UpdateBanner appVersion="dev" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('fetch gagal (API sedang restart) → tidak ada bar dan tidak error', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))
    const { container } = render(<UpdateBanner appVersion="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('respons non-200 (mis. 502) diabaikan', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => ({}) })
    const { container } = render(<UpdateBanner appVersion="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('transisi: pembaruan berlangsung → versi baru tersedia (urutan yang dilihat tab lama)', async () => {
    fetchMock
      .mockResolvedValueOnce(status({ maintenance: true }))
      .mockResolvedValue(status({ maintenance: false, version: 'new9999' }))
    render(<UpdateBanner appVersion="abc1234" intervalMs={30} />)
    expect(await screen.findByText(/Pembaruan sistem sedang berlangsung/)).toBeInTheDocument()
    expect(await screen.findByText('Versi baru tersedia.')).toBeInTheDocument()
    expect(screen.queryByText(/Pembaruan sistem sedang berlangsung/)).not.toBeInTheDocument()
  })

  it('bar hilang bila status kembali normal (flag dihapus tanpa perubahan versi)', async () => {
    fetchMock
      .mockResolvedValueOnce(status({ maintenance: true }))
      .mockResolvedValue(status())
    render(<UpdateBanner appVersion="abc1234" intervalMs={30} />)
    expect(await screen.findByText(/Pembaruan sistem sedang berlangsung/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/Pembaruan sistem/)).not.toBeInTheDocument())
  })

  it('ChunkLoadError di window → bar versi baru, walau status server tidak diketahui', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<UpdateBanner appVersion="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    act(() => {
      window.dispatchEvent(new ErrorEvent('error', { message: 'ChunkLoadError: Loading chunk 7 failed.' }))
    })
    expect(await screen.findByText('Versi baru tersedia.')).toBeInTheDocument()
  })

  it('tanpa NEXT_PUBLIC_API_URL → tidak melakukan fetch', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    const { container } = render(<UpdateBanner appVersion="abc1234" />)
    await act(async () => {})
    expect(fetchMock).not.toHaveBeenCalled()
    expect(container).toBeEmptyDOMElement()
  })

  it('memeriksa ulang saat tab kembali aktif', async () => {
    fetchMock.mockResolvedValue(status())
    render(<UpdateBanner appVersion="abc1234" intervalMs={60_000} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('tidak menyisakan offset header ketika tidak ada bar', async () => {
    fetchMock.mockResolvedValue(status())
    render(<UpdateBanner appVersion="abc1234" />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(document.documentElement.style.getPropertyValue('--banner-h')).toBe('0px')
  })
})
