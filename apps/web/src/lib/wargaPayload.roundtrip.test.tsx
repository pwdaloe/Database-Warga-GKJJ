/**
 * Tes round-trip form: data warga dari API → nilai awal form → submit tanpa mengubah apa pun →
 * payload API. Semua field yang dimuat harus kembali sama. Mencegah kelas bug "field tampil di UI
 * tetapi tidak dimuat / tidak terkirim" (alamat KK, koordinat, foto, alamat KTP, dst.).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { wargaToFormDefaults, buildWargaPayload } from './wargaPayload'

vi.mock('@/hooks/useKeluarga', () => ({
  useWilayahKelompok: () => ({ data: [] }),
  useKeluargaList: () => ({ data: { data: [] } }),
  useKeluargaDetail: () => ({ data: { id: 5, nomorKeluarga: 'KLG00005', kelompok: { nama: 'Rawamangun Barat' }, wargas: [] } }),
}))

const { WargaForm, wargaFormSchema } = await import('../app/(dashboard)/warga/WargaForm')

// Bentuk respons API untuk Kepala Keluarga dengan SEMUA field terisi
const WARGA_LENGKAP = {
  id: 1,
  dataStatus: 'VALIDASI',
  keluargaId: 5,
  nomorInduk: 'IND-001',
  namaLengkap: 'Soenarto',
  namaPanggilan: 'Narto',
  jenisKelamin: 'L',
  tempatLahir: 'Semarang',
  tanggalLahir: '1960-05-17T00:00:00.000Z',
  nik: '3171234567890001',
  golonganDarah: 'O',
  statusKeluarga: 'KEPALA',
  statusKeanggotaan: 'AKTIF',
  sudahBaptis: true,
  tanggalBaptis: '1961-01-01T00:00:00.000Z',
  tempatBaptis: 'GKJ Semarang',
  sudahSidi: true,
  nomorSidi: 'SD-77',
  tanggalSidi: '1975-06-01T00:00:00.000Z',
  telepon: '0211234567',
  whatsapp: '0812000111',
  email: 'soenarto@example.com',
  pendidikanTerakhir: 'S1',
  pekerjaan: 'Pensiunan',
  fotoUrl: 'data:image/jpeg;base64,AAAA',
  alamatKtp: 'Jl. KTP No. 1',
  alamatDomisili: 'Jl. Domisili No. 2',
  latitude: -6.2088,
  longitude: 106.8456,
  catatan: 'Catatan uji',
  konsenPDP: true,
  keluarga: {
    id: 5, alamat: 'Jl. Melati 3', rt: '001', rw: '005', kelurahan: 'Rawamangun',
    kecamatan: 'Pulo Gadung', kota: 'Jakarta Timur', kodePos: '13220', teleponRumah: '021-555',
  },
}

async function submitTanpaUbah(warga: any) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<WargaForm defaultValues={wargaToFormDefaults(warga)} onSubmit={onSubmit} submitLabel="Update Warga" />)
  fireEvent.click(screen.getByRole('button', { name: /update warga/i }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  return buildWargaPayload(onSubmit.mock.calls[0][0])
}

describe('round-trip WargaForm — Kepala Keluarga dengan semua field terisi', () => {
  it('setiap field yang dimuat kembali sama di payload', async () => {
    const payload = await submitTanpaUbah(WARGA_LENGKAP)

    const tglDatang = (v: string) => v.split('T')[0]
    expect(payload).toMatchObject({
      dataStatus: 'VALIDASI', keluargaId: 5, nomorInduk: 'IND-001', namaLengkap: 'Soenarto',
      namaPanggilan: 'Narto', jenisKelamin: 'L', tempatLahir: 'Semarang',
      tanggalLahir: tglDatang(WARGA_LENGKAP.tanggalLahir), nik: '3171234567890001', golonganDarah: 'O',
      statusKeluarga: 'KEPALA', statusKeanggotaan: 'AKTIF',
      sudahBaptis: true, tanggalBaptis: tglDatang(WARGA_LENGKAP.tanggalBaptis), tempatBaptis: 'GKJ Semarang',
      sudahSidi: true, nomorSidi: 'SD-77', tanggalSidi: tglDatang(WARGA_LENGKAP.tanggalSidi),
      telepon: '0211234567', whatsapp: '0812000111', email: 'soenarto@example.com',
      pendidikanTerakhir: 'S1', pekerjaan: 'Pensiunan', fotoUrl: 'data:image/jpeg;base64,AAAA',
      alamatKtp: 'Jl. KTP No. 1', alamatDomisili: 'Jl. Domisili No. 2',
      latitude: -6.2088, longitude: 106.8456, catatan: 'Catatan uji', konsenPDP: true,
    })
  })

  it('alamat KK dimuat dan dikirim sebagai alamatKeluarga (bukan newKeluarga)', async () => {
    const payload: any = await submitTanpaUbah(WARGA_LENGKAP)
    expect(payload.alamatKeluarga).toEqual({
      alamat: 'Jl. Melati 3', rt: '001', rw: '005', kelurahan: 'Rawamangun',
      kecamatan: 'Pulo Gadung', kota: 'Jakarta Timur', kodePos: '13220', teleponRumah: '021-555',
    })
    expect(payload.newKeluarga).toBeUndefined()
  })

  it('tidak ada kunci internal form (new*) yang bocor ke payload warga', async () => {
    const payload = await submitTanpaUbah(WARGA_LENGKAP)
    expect(Object.keys(payload).filter((k) => k.startsWith('new'))).toEqual([])
  })
})

describe('paritas skema form ↔ nilai awal', () => {
  it('setiap field di skema form dipetakan oleh wargaToFormDefaults (gagal bila ada field baru yang lupa dipetakan)', () => {
    const skemaFields = Object.keys((wargaFormSchema as any)._def.schema.shape)
    // field yang memang bukan data warga tersimpan: dikelola form sendiri / diturunkan dari KK
    const dikecualikan = new Set([
      'newKelompokId', 'newAlamat', 'newRt', 'newRw', 'newKelurahan', 'newKecamatan', 'newKota', 'newKodePos', 'newTeleponRumah',
    ])
    const dipetakan = new Set(Object.keys(wargaToFormDefaults(WARGA_LENGKAP)))
    const hilang = skemaFields.filter((f) => !dikecualikan.has(f) && !dipetakan.has(f))
    expect(hilang).toEqual([])
  })

  it('alamat KK (new*) dipetakan dari data KK', () => {
    const d = wargaToFormDefaults(WARGA_LENGKAP)
    expect(d).toMatchObject({ newAlamat: 'Jl. Melati 3', newRt: '001', newKota: 'Jakarta Timur', newTeleponRumah: '021-555' })
  })
})
