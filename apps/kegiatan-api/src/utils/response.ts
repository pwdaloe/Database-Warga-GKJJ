import { Response } from 'express'

// Uang disimpan sebagai BigInt. JSON tidak mengenal BigInt, jadi diubah ke number bila aman (<= 2^53-1),
// dan ke string bila tidak (tidak akan terjadi: batas rupiah 1 triliun ditegakkan validasi).
function bigintKeNumber(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString()
  }
  return value
}

export function kirimJson(res: Response, status: number, body: unknown): void {
  res.status(status).type('application/json').send(JSON.stringify(body, bigintKeNumber))
}

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  kirimJson(res, 200, { success: true, data, ...(meta ? { meta } : {}) })
}

export function created<T>(res: Response, data: T): void {
  kirimJson(res, 201, { success: true, data })
}
