import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Prisma 7 memakai driver adapter (pg). Satu-satunya tempat `new PrismaClient` (dijaga tests/utils/prismaClient.guard.test.ts).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    transactionOptions: { maxWait: 10_000, timeout: 30_000 },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
