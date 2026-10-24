import { describe, it, expect } from 'vitest'
import { PRISMA_OMIT } from '../../src/utils/prismaOmit.js'

describe('PRISMA_OMIT (secure by default)', () => {
  it('qrToken warga tidak pernah dibaca kecuali diminta eksplisit', () => {
    expect(PRISMA_OMIT).toEqual({ warga: { qrToken: true } })
  })
})
