import { describe, it, expect } from 'vitest'
import { profilToFormDefaults, buildProfilPayload, type ProfilData } from './profilPayload'

const P: ProfilData = {
  namaLengkap: 'Ani Wijaya', nomorAnggota: 'WRG00010', jenisKelamin: 'P', statusKeluarga: 'KEPALA',
  namaPanggilan: 'Ani', tempatLahir: 'Solo', tanggalLahir: '1980-02-03', nikMasker: '3171••••••••0001', golonganDarah: 'O',
  telepon: '021111', whatsapp: '081234567890', whatsappBolehDitampilkan: true, email: 'ani@x.id',
  pendidikanTerakhir: 'S1', pekerjaan: 'Guru', alamatKtp: 'Jl. KTP 1', alamatDomisili: 'Jl. Domisili 2', catatanJemaat: 'Catatan',
  alamatKeluarga: { alamat: 'Jl. Melati 3', rt: '001', rw: '002', kelurahan: 'R', kecamatan: 'P', kota: 'J', kodePos: '13220', teleponRumah: '021-555' },
  bolehUbahAlamatKeluarga: true, menungguVerifikasi: false,
}

describe('profil: nilai awal ⇄ payload', () => {
  it('tanpa mengubah apa pun, payload sama dengan data yang dimuat (setiap field)', () => {
    const payload: any = buildProfilPayload(profilToFormDefaults(P), true)
    expect(payload).toEqual({
      namaPanggilan: 'Ani', tempatLahir: 'Solo', tanggalLahir: '1980-02-03', golonganDarah: 'O',
      telepon: '021111', whatsapp: '081234567890', whatsappBolehDitampilkan: true, email: 'ani@x.id',
      pendidikanTerakhir: 'S1', pekerjaan: 'Guru', catatanJemaat: 'Catatan',
      alamatKtp: 'Jl. KTP 1', alamatDomisili: 'Jl. Domisili 2',
      alamatKeluarga: P.alamatKeluarga,
    })
  })

  it('NIK: tidak dikirim bila kosong (tersimpan tidak berubah), dikirim bila diisi', () => {
    const f = profilToFormDefaults(P)
    expect('nik' in buildProfilPayload(f, true)).toBe(false)
    expect((buildProfilPayload({ ...f, nik: ' 3171234567890001 ' }, true) as any).nik).toBe('3171234567890001')
  })

  it('domisili tidak dicentang → null walau teks masih ada', () => {
    const f = { ...profilToFormDefaults(P), domisiliBerbeda: false }
    expect((buildProfilPayload(f, true) as any).alamatDomisili).toBeNull()
  })

  it('bukan kepala keluarga → alamatKeluarga tidak pernah dikirim', () => {
    expect('alamatKeluarga' in buildProfilPayload(profilToFormDefaults(P), false)).toBe(false)
  })

  it('string kosong → null; tidak ada field di luar whitelist server', () => {
    const f = { ...profilToFormDefaults(P), telepon: '  ', pekerjaan: '' }
    const payload: any = buildProfilPayload(f, true)
    expect(payload.telepon).toBeNull(); expect(payload.pekerjaan).toBeNull()
    const WHITELIST = new Set(['namaPanggilan', 'tempatLahir', 'tanggalLahir', 'nik', 'golonganDarah', 'telepon', 'whatsapp',
      'whatsappBolehDitampilkan', 'email', 'pendidikanTerakhir', 'pekerjaan', 'alamatKtp', 'alamatDomisili', 'catatanJemaat', 'alamatKeluarga'])
    expect(Object.keys(payload).filter((k) => !WHITELIST.has(k))).toEqual([])
  })
})
