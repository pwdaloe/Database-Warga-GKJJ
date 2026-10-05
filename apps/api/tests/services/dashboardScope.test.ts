import { describe, it, expect } from 'vitest'
import { wargaScope, keluargaScope, isKelompokScoped } from '../../src/services/dashboardScope.js'

describe('dashboardScope', () => {
  it('penatua kelompok dibatasi ke kelompoknya', () => {
    const u = { role: 'PENATUA_KELOMPOK', kelompokId: 7 } as const
    expect(isKelompokScoped(u)).toBe(true)
    expect(wargaScope(u)).toEqual({ keluarga: { kelompokId: 7 } })
    expect(keluargaScope(u)).toEqual({ kelompokId: 7 })
  })

  it('penatua tanpa kelompok tidak melihat data apa pun (fail-closed)', () => {
    const u = { role: 'PENATUA_KELOMPOK', kelompokId: null } as const
    expect(wargaScope(u)).toEqual({ id: -1 })
    expect(keluargaScope(u)).toEqual({ id: -1 })
  })

  it.each(['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'VIEWER'] as const)(
    'role %s melihat semua data meski punya kelompokId',
    (role) => {
      const u = { role, kelompokId: 3 }
      expect(isKelompokScoped(u)).toBe(false)
      expect(wargaScope(u)).toEqual({})
      expect(keluargaScope(u)).toEqual({})
    },
  )
})
