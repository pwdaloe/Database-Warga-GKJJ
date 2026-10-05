import type { Prisma } from '@prisma/client'
import type { JwtPayload } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

/**
 * Cakupan data dashboard per pengguna.
 * Penatua Kelompok hanya melihat data kelompoknya sendiri. Penatua yang belum
 * punya kelompok dibatasi ke "tidak ada data" (fail-closed), bukan semua data.
 * Role lain melihat seluruh data.
 */
export function isKelompokScoped(user: Pick<JwtPayload, 'role'>): boolean {
  return user.role === 'PENATUA_KELOMPOK'
}

const NO_MATCH_ID = -1

export function wargaScope(user: Pick<JwtPayload, 'role' | 'kelompokId'>): Prisma.WargaWhereInput {
  if (!isKelompokScoped(user)) return {}
  if (!user.kelompokId) return { id: NO_MATCH_ID }
  return { keluarga: { kelompokId: user.kelompokId } }
}

/** Penatua hanya boleh menyentuh data di kelompoknya sendiri; tanpa kelompok → tidak boleh apa pun. */
export function assertKelompokPenatua(
  user: Pick<JwtPayload, 'role' | 'kelompokId'> | undefined,
  kelompokId: number | null | undefined,
  pesan = 'Tidak memiliki akses ke kelompok ini',
): void {
  if (!user || !isKelompokScoped(user)) return
  if (!user.kelompokId || kelompokId !== user.kelompokId) throw new AppError(403, pesan)
}

export function keluargaScope(user: Pick<JwtPayload, 'role' | 'kelompokId'>): Prisma.KeluargaWhereInput {
  if (!isKelompokScoped(user)) return {}
  if (!user.kelompokId) return { id: NO_MATCH_ID }
  return { kelompokId: user.kelompokId }
}
