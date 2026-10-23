import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Prisma 7 memakai driver adapter (pg). Default pg tidak punya connection timeout, jadi diset 10 dtk agar
// request tidak menggantung saat DB sibuk (Prisma 6 memakai 5 dtk).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Default Prisma: maxWait 2 dtk, timeout 5 dtk — terlalu ketat saat DB/VPS sedang sibuk (error P2028)
    transactionOptions: { maxWait: 10_000, timeout: 30_000 },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
