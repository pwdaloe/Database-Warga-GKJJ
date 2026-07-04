import { describe, it, expect, vi, afterEach } from 'vitest'
import { ZodError, z } from 'zod'
import { Prisma } from '@prisma/client'
import { errorHandler, AppError } from '../../src/middleware/errorHandler.js'

function mockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

function zodErrorFrom(schema: z.ZodTypeAny, value: unknown): ZodError {
  const result = schema.safeParse(value)
  if (result.success) throw new Error('expected schema to fail')
  return result.error
}

describe('errorHandler', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    process.env.NODE_ENV = 'test'
  })

  it('menangani ZodError dengan status 400 dan detail field', () => {
    const schema = z.object({ nama: z.string().min(1) })
    const err = zodErrorFrom(schema, { nama: '' })
    const res = mockRes()

    errorHandler(err, {} as any, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    const body = res.json.mock.calls[0][0]
    expect(body.success).toBe(false)
    expect(body.error).toBe('Validasi gagal')
    expect(body.details[0].field).toBe('nama')
  })

  it('menangani AppError dengan status code kustom', () => {
    const res = mockRes()
    errorHandler(new AppError(403, 'Tidak memiliki izin'), {} as any, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Tidak memiliki izin' })
  })

  it('menangani Prisma P2002 (duplikat) dengan status 409 dan label field yang manusiawi', () => {
    const res = mockRes()
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.1.0',
      meta: { target: ['nik'] },
    })

    errorHandler(err, {} as any, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json.mock.calls[0][0].error).toContain('NIK')
  })

  it('menangani Prisma P2025 (data tidak ditemukan) dengan status 404', () => {
    const res = mockRes()
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '6.1.0',
    })

    errorHandler(err, {} as any, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('menangani Prisma P2003 (relasi tidak valid) dengan status 400', () => {
    const res = mockRes()
    const err = new Prisma.PrismaClientKnownRequestError('FK violation', {
      code: 'P2003',
      clientVersion: '6.1.0',
    })

    errorHandler(err, {} as any, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('menyembunyikan pesan error asli di production untuk error tak terduga', () => {
    process.env.NODE_ENV = 'production'
    const res = mockRes()
    errorHandler(new Error('stack trace sensitif'), {} as any, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json.mock.calls[0][0].error).toBe('Terjadi kesalahan server')
  })

  it('menampilkan pesan error asli di luar production', () => {
    process.env.NODE_ENV = 'development'
    const res = mockRes()
    errorHandler(new Error('detail teknis'), {} as any, res, vi.fn())

    expect(res.json.mock.calls[0][0].error).toBe('detail teknis')
  })
})
