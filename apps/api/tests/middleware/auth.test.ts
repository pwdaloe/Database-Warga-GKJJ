import { describe, it, expect, vi, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { authenticate, authorize } from '../../src/middleware/auth.js'
import { AppError } from '../../src/middleware/errorHandler.js'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret'
})

function reqWithAuth(header?: string) {
  return { headers: { authorization: header } } as any
}

describe('authenticate', () => {
  it('melempar 401 jika header Authorization tidak ada', () => {
    expect(() => authenticate(reqWithAuth(undefined), {} as any, vi.fn()))
      .toThrow(AppError)
  })

  it('melempar 401 jika header tidak berformat Bearer', () => {
    expect(() => authenticate(reqWithAuth('Basic abc123'), {} as any, vi.fn()))
      .toThrow('Token autentikasi diperlukan')
  })

  it('melempar 401 jika token tidak valid', () => {
    expect(() => authenticate(reqWithAuth('Bearer token-palsu'), {} as any, vi.fn()))
      .toThrow('Token tidak valid atau sudah kadaluarsa')
  })

  it('melampirkan req.user dan memanggil next() jika token valid', () => {
    const payload = { userId: 1, role: UserRole.SUPERADMIN, kelompokId: 2 }
    const token = jwt.sign(payload, process.env.JWT_SECRET!)
    const req = reqWithAuth(`Bearer ${token}`)
    const next = vi.fn()

    authenticate(req, {} as any, next)

    expect(req.user).toMatchObject(payload)
    expect(next).toHaveBeenCalledOnce()
  })
})

describe('authorize', () => {
  it('melempar 401 jika req.user belum ada (belum authenticate)', () => {
    const middleware = authorize(UserRole.SUPERADMIN)
    expect(() => middleware({} as any, {} as any, vi.fn())).toThrow('Tidak terautentikasi')
  })

  it('melempar 403 jika role user tidak diizinkan', () => {
    const middleware = authorize(UserRole.SUPERADMIN)
    const req = { user: { userId: 1, role: UserRole.PENATUA_KELOMPOK, kelompokId: 1 } } as any
    expect(() => middleware(req, {} as any, vi.fn())).toThrow('Tidak memiliki izin untuk aksi ini')
  })

  it('memanggil next() jika role user diizinkan', () => {
    const middleware = authorize(UserRole.SUPERADMIN, UserRole.PENATUA_KELOMPOK)
    const req = { user: { userId: 1, role: UserRole.PENATUA_KELOMPOK, kelompokId: 1 } } as any
    const next = vi.fn()

    middleware(req, {} as any, next)

    expect(next).toHaveBeenCalledOnce()
  })
})
