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
      const FIELD_LABELS: Record<string, string> = {
        nik:            'NIK',
        nomor_anggota:  'Nomor Anggota',
        nomor_induk:    'No. Induk Warga',
        nomor_keluarga: 'Nomor Keluarga',
        email:          'Email',
        username:       'Username',
        kode:           'Kode',
      }
      const raw = (err.meta?.target as string[] | string) ?? []
      const cols = Array.isArray(raw) ? raw : [raw]
      const labels = cols.map((c) => FIELD_LABELS[c] ?? c).join(', ')
      res.status(409).json({
        success: false,
        error: `Data duplikat: ${labels} sudah terdaftar di sistem. Periksa kembali data yang dimasukkan.`,
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
    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        error: 'Data referensi tidak valid — pastikan relasi yang dipilih sudah ada.',
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
