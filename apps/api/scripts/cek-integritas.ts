/**
 * Pemeriksaan integritas data (read-only). Jalankan setelah tiap deploy:
 *   npm run db:integritas --workspace=apps/api
 * Exit code 1 bila ada temuan.
 */
import { cekIntegritas } from '../src/services/integritas.service.js'
import { prisma } from '../src/utils/prisma.js'

async function main() {
  try {
    const hasil = await cekIntegritas()
    let total = 0
    for (const t of hasil) {
      total += t.jumlah
      console.log(`${t.jumlah === 0 ? '✅' : '❌'} ${t.kode} — ${t.judul}: ${t.jumlah}`)
      if (t.jumlah > 0) console.log(JSON.stringify(t.contoh, null, 2))
    }
    process.exitCode = total === 0 ? 0 : 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
