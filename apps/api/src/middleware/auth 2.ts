import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { AppError } from './errorHandler.js'

export interface JwtPayload {
  userId: number
  role: UserRole
  kelompokId: number | null
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Token autentikasi diperlukan')
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET tidak dikonfigurasi')

  try {
    req.user = jwt.verify(token, secret) as JwtPayload
    next()
  } catch {
    throw new AppError(401, 'Token tidak valid atau sudah kadaluarsa')
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, 'Tidak terautentikasi')
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Tidak memiliki izin untuk aksi ini')
    }
    next()
  }
}
