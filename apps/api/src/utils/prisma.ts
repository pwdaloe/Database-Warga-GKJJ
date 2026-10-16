import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Default Prisma: maxWait 2 dtk, timeout 5 dtk — terlalu ketat saat DB/VPS sedang sibuk (error P2028)
    transactionOptions: { maxWait: 10_000, timeout: 30_000 },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
