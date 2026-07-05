import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockGet = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}))

vi.mock('@/lib/auth', () => ({
  resetPasswordRequest: vi.fn(),
}))

const { resetPasswordRequest } = await import('@/lib/auth')
const { ResetPasswordForm } = await import('./ResetPasswordForm')

const mockedResetPasswordRequest = resetPasswordRequest as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockReturnValue('valid-token-abc')
})

describe('ResetPasswordForm', () => {
  it('menampilkan error validasi jika password baru kurang dari 8 karakter, tidak memanggil resetPasswordRequest', async () => {
    render(<ResetPasswordForm />)

    fireEvent.input(screen.getByPlaceholderText('Minimal 8 karakter'), { target: { value: 'pendek' } })
    fireEvent.input(screen.getByPlaceholderText('Ulangi password baru'), { target: { value: 'pendek' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('Password baru minimal 8 karakter')).toBeInTheDocument()
    expect(mockedResetPasswordRequest).not.toHaveBeenCalled()
  })

  it('menampilkan error "tidak cocok" jika konfirmasi password berbeda', async () => {
    render(<ResetPasswordForm />)

    fireEvent.input(screen.getByPlaceholderText('Minimal 8 karakter'), { target: { value: 'passwordBaru123' } })
    fireEvent.input(screen.getByPlaceholderText('Ulangi password baru'), { target: { value: 'beda123456' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('Konfirmasi password tidak cocok')).toBeInTheDocument()
    expect(mockedResetPasswordRequest).not.toHaveBeenCalled()
  })

  it('memanggil resetPasswordRequest dengan token & password yang benar saat submit valid', async () => {
    mockedResetPasswordRequest.mockResolvedValue({ message: 'Password berhasil direset, silakan login' })
    render(<ResetPasswordForm />)

    fireEvent.input(screen.getByPlaceholderText('Minimal 8 karakter'), { target: { value: 'passwordBaru123' } })
    fireEvent.input(screen.getByPlaceholderText('Ulangi password baru'), { target: { value: 'passwordBaru123' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(mockedResetPasswordRequest).toHaveBeenCalledWith('valid-token-abc', 'passwordBaru123')
    })
    expect(await screen.findByText('Password berhasil direset, silakan login')).toBeInTheDocument()
  })

  it('menampilkan pesan link tidak valid jika token kosong', () => {
    mockGet.mockReturnValue(null)
    render(<ResetPasswordForm />)

    expect(screen.getByText('Link Tidak Valid')).toBeInTheDocument()
  })
})
