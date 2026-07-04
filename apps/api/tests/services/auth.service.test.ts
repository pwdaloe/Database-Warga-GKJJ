import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { login, getMe, changePassword } = await import('../../src/services/auth.service.js')

const mockedFindFirst = prisma.user.findFirst as ReturnType<typeof vi.fn>
const mockedFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>
const mockedUpdate = prisma.user.update as ReturnType<typeof vi.fn>

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
})

beforeEach(() => {
  vi.clearAllMocks()
})

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    nama: 'Budi Santoso',
    username: 'budi',
    email: 'budi@example.com',
    passwordHash: bcrypt.hashSync('password123', 4),
    role: UserRole.STAF_ADMIN,
    kelompokId: 3,
    wargaId: null,
    kelompok: { id: 3, kode: 'K3', nama: 'Kelompok 3' },
    warga: null,
    lastLogin: null,
    ...overrides,
  }
}

describe('login', () => {
  it('melempar 401 jika user tidak ditemukan', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await expect(login('tidak-ada', 'apapun')).rejects.toThrow('Username atau password salah')
  })

  it('melempar 401 jika password salah', async () => {
    mockedFindFirst.mockResolvedValue(baseUser())
    await expect(login('budi', 'password-salah')).rejects.toThrow('Username atau password salah')
  })

  it('mengembalikan token dan data user, serta update lastLogin, jika kredensial benar', async () => {
    mockedFindFirst.mockResolvedValue(baseUser())
    mockedUpdate.mockResolvedValue({})

    const result = await login('budi', 'password123')

    expect(result.token).toBeTypeOf('string')
    expect(result.user.username).toBe('budi')
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { lastLogin: expect.any(Date) },
    })
  })
})

describe('getMe', () => {
  it('melempar 401 jika user tidak ditemukan/tidak aktif', async () => {
    mockedFindUnique.mockResolvedValue(null)
    await expect(getMe(99)).rejects.toThrow('Sesi tidak valid')
  })

  it('mengembalikan data user jika ditemukan', async () => {
    mockedFindUnique.mockResolvedValue({ id: 1, username: 'budi' })
    const result = await getMe(1)
    expect(result).toEqual({ id: 1, username: 'budi' })
  })
})

describe('changePassword', () => {
  it('melempar 404 jika user tidak ditemukan', async () => {
    mockedFindUnique.mockResolvedValue(null)
    await expect(changePassword(1, 'lama', 'barubaru')).rejects.toThrow('User tidak ditemukan')
  })

  it('melempar 400 jika password lama salah', async () => {
    mockedFindUnique.mockResolvedValue(baseUser())
    await expect(changePassword(1, 'password-salah', 'barubaru123'))
      .rejects.toThrow('Password lama tidak sesuai')
  })

  it('melempar 400 jika password baru kurang dari 8 karakter', async () => {
    mockedFindUnique.mockResolvedValue(baseUser())
    await expect(changePassword(1, 'password123', 'pendek'))
      .rejects.toThrow('Password baru minimal 8 karakter')
  })

  it('mengubah password jika input valid', async () => {
    mockedFindUnique.mockResolvedValue(baseUser())
    mockedUpdate.mockResolvedValue({})

    await changePassword(1, 'password123', 'passwordBaru123')

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { passwordHash: expect.any(String) },
    })
  })
})
