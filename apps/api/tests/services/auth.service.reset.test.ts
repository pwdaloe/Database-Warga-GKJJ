import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'
import { UserRole } from '@prisma/client'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../../src/services/email.service.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { sendPasswordResetEmail } = await import('../../src/services/email.service.js')
const { requestPasswordReset, resetPassword } = await import('../../src/services/auth.service.js')

const mockedFindFirst = prisma.user.findFirst as ReturnType<typeof vi.fn>
const mockedUpdate = prisma.user.update as ReturnType<typeof vi.fn>
const mockedSendEmail = sendPasswordResetEmail as ReturnType<typeof vi.fn>

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    nama: 'Budi Santoso',
    username: 'budi',
    email: 'budi@example.com',
    passwordHash: 'hash-lama',
    role: UserRole.STAF_ADMIN,
    kelompokId: 3,
    wargaId: null,
    aktif: true,
    resetTokenHash: null,
    resetTokenExpiry: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requestPasswordReset', () => {
  it('menyimpan token & mengirim email jika user ditemukan', async () => {
    mockedFindFirst.mockResolvedValue(baseUser())
    mockedUpdate.mockResolvedValue({})

    const result = await requestPasswordReset('budi')

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        resetTokenHash: expect.any(String),
        resetTokenExpiry: expect.any(Date),
      },
    })
    expect(mockedSendEmail).toHaveBeenCalledTimes(1)
    expect(mockedSendEmail).toHaveBeenCalledWith(
      'budi@example.com',
      'Budi Santoso',
      expect.stringContaining('/reset-password?token='),
    )
    expect(result).toEqual({
      message: 'Jika akun terdaftar, link reset password telah dikirim ke email terkait.',
    })
  })

  it('tidak throw dan tidak mengirim email jika user tidak ditemukan, message tetap sama', async () => {
    mockedFindFirst.mockResolvedValue(null)

    const result = await requestPasswordReset('tidak-ada')

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(mockedSendEmail).not.toHaveBeenCalled()
    expect(result).toEqual({
      message: 'Jika akun terdaftar, link reset password telah dikirim ke email terkait.',
    })
  })
})

describe('resetPassword', () => {
  it('berhasil update password & clear token jika token valid & belum expired', async () => {
    const token = 'raw-token-abc'
    const resetTokenHash = createHash('sha256').update(token).digest('hex')
    mockedFindFirst.mockResolvedValue(
      baseUser({ resetTokenHash, resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000) }),
    )
    mockedUpdate.mockResolvedValue({})

    await resetPassword(token, 'passwordBaru123')

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        passwordHash: expect.any(String),
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    })
  })

  it('melempar 400 jika token tidak ditemukan/sudah expired', async () => {
    mockedFindFirst.mockResolvedValue(null)

    await expect(resetPassword('token-invalid', 'passwordBaru123')).rejects.toThrow(
      'Token reset tidak valid atau sudah kadaluarsa',
    )
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('melempar 400 jika password baru kurang dari 8 karakter', async () => {
    await expect(resetPassword('token-apapun', 'pendek')).rejects.toThrow(
      'Password baru minimal 8 karakter',
    )
    expect(mockedFindFirst).not.toHaveBeenCalled()
  })
})
