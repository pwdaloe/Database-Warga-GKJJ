import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Prisma 7 mewajibkan driver adapter; semua kode harus memakai klien bersama di src/utils/prisma.ts
// (pelajaran dari seed aplikasi jemaat yang gagal diam-diam).
const ROOT = path.resolve(__dirname, '../..')
const BOLEH = path.join(ROOT, 'src/utils/prisma.ts')

function berkasTs(dir: string): string[] {
  return readdirSync(dir).flatMap((nama) => {
    const p = path.join(dir, nama)
    if (nama === 'generated' || nama === 'node_modules') return []
    return statSync(p).isDirectory() ? berkasTs(p) : p.endsWith('.ts') ? [p] : []
  })
}

describe('Klien Prisma tunggal', () => {
  const kode = ['src', 'scripts', 'prisma'].flatMap((d) => berkasTs(path.join(ROOT, d)))

  it('memeriksa berkas yang benar', () => {
    expect(kode.some((f) => f.endsWith('prisma/seed.ts'))).toBe(true)
    expect(kode.some((f) => f.endsWith('src/app.ts'))).toBe(true)
  })

  it('tidak ada `new PrismaClient(` selain di utils/prisma.ts', () => {
    const pelanggar = kode.filter((f) => f !== BOLEH && /new\s+PrismaClient\s*\(/.test(readFileSync(f, 'utf8')))
    expect(pelanggar.map((f) => path.relative(ROOT, f))).toEqual([])
  })

  it('utils/prisma.ts memasang driver adapter', () => {
    expect(readFileSync(BOLEH, 'utf8')).toMatch(/new\s+PrismaClient\(\{[\s\S]*?^\s*adapter\s*[,:]/m)
  })

  it('seed tidak menelan error (exit code 1 saat gagal)', () => {
    const seed = readFileSync(path.join(ROOT, 'prisma/seed.ts'), 'utf8')
    expect(seed).toMatch(/process\.exitCode\s*=\s*1/)
    expect(seed).not.toMatch(/\.catch\(console\.error\)/)
  })
})
