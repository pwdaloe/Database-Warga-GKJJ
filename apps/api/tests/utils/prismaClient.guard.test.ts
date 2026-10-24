import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Prisma 7 mewajibkan driver adapter. Skrip yang membuat `new PrismaClient()` sendiri gagal di produksi
// ("PrismaClient was instantiated without any options"), dan kegagalannya sempat tertelan oleh skrip deploy
// (seed-master, 23-24 Okt 2026). Semua kode harus memakai klien bersama di src/utils/prisma.ts.
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

  it('menemukan berkas yang diperiksa (penjaga tidak kosong)', () => {
    expect(kode.length).toBeGreaterThan(20)
    expect(kode.some((f) => f.endsWith('prisma/seed-master.ts'))).toBe(true)
    expect(kode.some((f) => f.endsWith('prisma/seed.ts'))).toBe(true)
  })

  it('tidak ada `new PrismaClient(` selain di utils/prisma.ts', () => {
    const pelanggar = kode.filter((f) => f !== BOLEH && /new\s+PrismaClient\s*\(/.test(readFileSync(f, 'utf8')))
    expect(pelanggar.map((f) => path.relative(ROOT, f))).toEqual([])
  })

  it('utils/prisma.ts memasang driver adapter', () => {
    const isi = readFileSync(BOLEH, 'utf8')
    // properti `adapter` sungguhan (bukan sekadar kata di komentar)
    expect(isi).toMatch(/new\s+PrismaClient\(\{[\s\S]*?^\s*adapter\s*[,:]/m)
  })

  it('skrip seed tidak menelan error (exit code 1 saat gagal)', () => {
    const master = readFileSync(path.join(ROOT, 'prisma/seed-master.ts'), 'utf8')
    expect(master).toMatch(/process\.exitCode\s*=\s*1|process\.exit\(1\)/)
    expect(master).not.toMatch(/\.catch\(console\.error\)/)
  })
})
