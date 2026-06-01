import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma.js'

// Field yang di-mask dengan *** (nilai diganti, key tetap ada)
const MASK_FIELDS = new Set([
  'password', 'passwordHash', 'passwordBaru', 'passwordLama', 'token',
  'telepon', 'whatsapp', 'email',
])

// Field yang benar-benar dihilangkan dari log (data pribadi spesifik per UU PDP)
const REMOVE_FIELDS = new Set([
  'nik', 'tanggalLahir', 'tempatLahir',
  'alamatKtp', 'alamatDomisili',
  'latitude', 'longitude',
  'fotoUrl',           // base64 bisa ratusan KB — tidak boleh masuk log
  'newAlamat', 'newKelurahan', 'newKecamatan', 'newKota',
  'bodySnapshot',
])

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 3 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.slice(0, 10).map((v) => sanitize(v, depth + 1))
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (REMOVE_FIELDS.has(k)) continue                   // hilangkan sepenuhnya
    result[k] = MASK_FIELDS.has(k) ? '***' : sanitize(v, depth + 1)
  }
  return result
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  // Hanya log operasi yang mengubah data
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next()
    return
  }

  const start = Date.now()

  // Hook ke res.json agar kita tahu status + body respons
  const origJson = res.json.bind(res)
  let responseBody: unknown

  res.json = function (data: unknown) {
    responseBody = data
    return origJson(data)
  }

  res.on('finish', () => {
    const durasiMs = Date.now() - start
    const statusCode = res.statusCode
    const user = (req as any).user

    let errorMessage: string | null = null
    if (statusCode >= 400 && responseBody && typeof responseBody === 'object') {
      errorMessage = (responseBody as any)?.error ?? (responseBody as any)?.message ?? null
    }

    const bodySnapshot = req.body && Object.keys(req.body).length > 0
      ? sanitize(req.body)
      : null

    // Fire-and-forget — jangan block response
    prisma.activityLog.create({
      data: {
        userId:       user?.userId ?? null,
        userNama:     user?.nama   ?? null,
        method:       req.method,
        path:         req.path,
        statusCode,
        errorMessage,
        bodySnapshot: bodySnapshot as any,
        ipAddress:    ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim())
                      ?? req.socket.remoteAddress ?? null,
        durasiMs,
      },
    }).catch(() => {/* jangan crash kalau log gagal */})
  })

  next()
}
