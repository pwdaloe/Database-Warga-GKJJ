import { describe, it, expect } from 'vitest'
import { buildWargaPayload, alamatKeluargaDefaults } from './wargaPayload'

const alamat = { newAlamat: 'Jl. Melati 3', newRt: '001', newRw: '', newKelurahan: 'Rawamangun', newKecamatan: '', newKota: 'Jakarta Timur', newKodePos: '', newTeleponRumah: '' }

describe('buildWargaPayload', () => {
  it('Kepala baru tanpa KK → newKeluarga berisi kelompok & alamat', () => {
    const p: any = buildWargaPayload({ namaLengkap: 'A', statusKeluarga: 'KEPALA', keluargaId: null, newKelompokId: 7, ...alamat })
    expect(p.newKeluarga).toEqual({ kelompokId: 7, alamat: 'Jl. Melati 3', rt: '001', rw: null, kelurahan: 'Rawamangun', kecamatan: null, kota: 'Jakarta Timur', kodePos: null, teleponRumah: null })
    expect(p.alamatKeluarga).toBeUndefined()
  })

  it('Kepala yang sudah punya KK → alamatKeluarga (bukan newKeluarga)', () => {
    const p: any = buildWargaPayload({ namaLengkap: 'A', statusKeluarga: 'KEPALA', keluargaId: 5, newKelompokId: 7, ...alamat })
    expect(p.alamatKeluarga).toMatchObject({ alamat: 'Jl. Melati 3', rt: '001', rw: null })
    expect(p.newKeluarga).toBeUndefined()
  })

  it('bukan Kepala → tidak ada alamat KK terkirim', () => {
    const p: any = buildWargaPayload({ namaLengkap: 'B', statusKeluarga: 'ISTRI', keluargaId: 5, ...alamat })
    expect(p.alamatKeluarga).toBeUndefined()
    expect(p.newKeluarga).toBeUndefined()
  })

  it('field new* tidak bocor ke payload warga, string kosong jadi null', () => {
    const p: any = buildWargaPayload({ namaLengkap: 'A', statusKeluarga: 'ISTRI', keluargaId: 5, email: '', ...alamat, newKelompokId: 7 })
    expect(Object.keys(p).some((k) => k.startsWith('new'))).toBe(false)
    expect(p.email).toBeNull()
  })
})

describe('alamatKeluargaDefaults', () => {
  it('memetakan data KK ke nilai awal form', () => {
    expect(alamatKeluargaDefaults({ alamat: 'Jl. X', rt: '002', kelurahan: 'Utan Kayu' })).toMatchObject({ newAlamat: 'Jl. X', newRt: '002', newRw: '', newKelurahan: 'Utan Kayu' })
  })
  it('KK tidak ada → semua kosong', () => {
    expect(alamatKeluargaDefaults(null).newAlamat).toBe('')
  })
})
