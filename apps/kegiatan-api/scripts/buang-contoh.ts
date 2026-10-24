/**
 * Membuang data contoh (isContoh = true): program contoh dan akun contoh.
 * Posisi pengurus BPH TIDAK dihapus (itu master); namanya diganti lewat menu Pengurus.
 *   npm run db:buang-contoh              → hanya menampilkan jumlah (tidak menghapus)
 *   npm run db:buang-contoh -- --ya      → menghapus
 */
import 'dotenv/config'
import { prisma } from '../src/utils/prisma.js'

async function main(): Promise<void> {
  const [program, akun, pengurus] = await Promise.all([
    prisma.programKerja.count({ where: { isContoh: true } }),
    prisma.pengguna.count({ where: { isContoh: true } }),
    prisma.pengurus.count({ where: { isContoh: true } }),
  ])
  console.log(`Data contoh: ${program} program, ${akun} akun; ${pengurus} posisi pengurus masih bernama contoh (tidak dihapus).`)

  if (!process.argv.includes('--ya')) {
    console.log('Tidak ada yang dihapus. Tambahkan --ya untuk menghapus program dan akun contoh.')
    return
  }

  await prisma.$transaction(async (tx) => {
    const akunIds = (await tx.pengguna.findMany({ where: { isContoh: true }, select: { id: true } })).map((a) => a.id)
    // Jejak audit dipertahankan, hanya pelakunya dilepas agar akun bisa dihapus.
    await tx.logAudit.updateMany({ where: { penggunaId: { in: akunIds } }, data: { penggunaId: null } })
    const p = await tx.programKerja.deleteMany({ where: { isContoh: true } })
    const a = await tx.pengguna.deleteMany({ where: { isContoh: true } })
    console.log(`Dihapus: ${p.count} program, ${a.count} akun.`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Gagal:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
