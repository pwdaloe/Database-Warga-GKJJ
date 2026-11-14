import type { Prisma } from '../generated/prisma/client.js'
import { sertakan, serialisasiProgram } from './program.service.js'

type Tx = Prisma.TransactionClient

/**
 * Potret "Usulan UPK" untuk setiap program berstatus DIAJUKAN yang belum punya potret USULAN. Dijalankan saat
 * penyusunan dikunci (masuk pra-muker). Tidak pernah menimpa potret yang sudah ada, sehingga bolak-balik tahap
 * tidak merusak angka usulan asli.
 */
export async function potretUsulanTahun(tx: Tx, tahunId: number, penggunaId: number): Promise<number> {
  const programs = await tx.programKerja.findMany({
    where: { tahunId, status: 'DIAJUKAN', versi: { none: { tahap: 'USULAN' } } },
    include: sertakan,
  })
  for (const p of programs) {
    const s = serialisasiProgram(p)
    await tx.programVersi.create({
      data: {
        programId: p.id,
        tahap: 'USULAN',
        data: JSON.parse(JSON.stringify(s, (_k, v: unknown) => (typeof v === 'bigint' ? Number(v) : v))) as Prisma.InputJsonValue,
        totalRab: BigInt(s.totalRab),
        danaGereja: BigInt(s.gereja),
        dibuatOleh: penggunaId,
      },
    })
  }
  return programs.length
}
