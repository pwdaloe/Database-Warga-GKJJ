import { Response } from 'express'

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  res.json({ success: true, data, ...(meta ? { meta } : {}) })
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data })
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
): void {
  res.json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
