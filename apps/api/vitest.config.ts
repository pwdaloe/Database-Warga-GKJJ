import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Kunci uji saja (bukan rahasia). Dulu tes import diam-diam bergantung pada .env yang otomatis dimuat Prisma 6.
    env: { ENCRYPTION_KEY: '0000000000000000000000000000000000000000000000000000000000000001' },
    // Tes route memakai supertest yang membuka server sementara per permintaan; pada mesin sibuk (build/run
    // paralel) kadang `socket hang up`. Kegagalan deterministik tetap gagal 3x, jadi bug sungguhan tidak tertutup.
    retry: 2,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
  },
})
