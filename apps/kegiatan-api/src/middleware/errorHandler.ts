import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../generated/prisma/client.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validasi gagal',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Data duplikat: nilai tersebut sudah terdaftar.' })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Data tidak ditemukan' })
      return
    }
    if (err.code === 'P2003') {
      res.status(409).json({ success: false, error: 'Data masih dipakai oleh data lain atau rujukannya tidak ada.' })
      return
    }
  }

  // Jangan bocorkan detail internal ke klien; cukup tercatat di log server.
  console.error('[ERROR]', err)
  res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server' })
}
