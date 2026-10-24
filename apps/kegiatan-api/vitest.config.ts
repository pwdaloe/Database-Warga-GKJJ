import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Tes route memakai supertest (server sementara per permintaan); pada mesin sibuk kadang `socket hang up`.
    // Kegagalan deterministik tetap gagal 3x, jadi bug sungguhan tidak tertutup.
    retry: 2,
    include: ['tests/**/*.test.ts'],
    env: { JWT_SECRET: 'rahasia-uji-kegiatan' },
  },
})
