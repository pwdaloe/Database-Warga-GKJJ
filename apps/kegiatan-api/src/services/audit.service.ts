import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../utils/prisma.js'

type Klien = Pick<Prisma.TransactionClient, 'logAudit'>

/** Catatan audit; jangan pernah memasukkan password atau token ke `ringkasan`. */
export async function catatAudit(
  data: { penggunaId: number | null; aksi: string; entitas: string; entitasId?: number | null; ringkasan?: string; ipAddress?: string | null },
  klien: Klien = prisma,
): Promise<void> {
  await klien.logAudit.create({
    data: {
      penggunaId: data.penggunaId,
      aksi: data.aksi,
      entitas: data.entitas,
      entitasId: data.entitasId ?? null,
      ringkasan: data.ringkasan?.slice(0, 500) ?? null,
      ipAddress: data.ipAddress ?? null,
    },
  })
}
