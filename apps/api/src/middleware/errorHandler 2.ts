import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Validation error dari Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validasi gagal',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  // Error yang kita throw sendiri
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    })
    return
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) ?? []
      res.status(409).json({
        success: false,
        error: `Data sudah ada: ${fields.join(', ')}`,
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Data tidak ditemukan',
      })
      return
    }
  }

  // Unexpected error
  console.error('[ERROR]', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message,
  })
}
