import { describe, it, expect } from 'vitest'
import { dariApi, formKosong, isiSisaKeGereja, jumlahBaris, keApi, masalahLokal, rabKosong, selisihSumber, totalMandiri, totalRab, totalSumber } from './programForm'
import type { ProgramDetail } from './tipe'

const KODE = ['a', 'b']
const lengkap = () => {
  const f = formKosong()
  f.judul = 'Retreat'
  f.latarBelakang = 'L'; f.kebutuhan = 'K'; f.tujuan = 'T'; f.sasaranPenerima = 'S'; f.evaluasi = 'E'; f.picNama = 'PIC'; f.picWhatsapp = '0812'
  f.acuanIds = [1]
  f.jadwal[0] = { ...f.jadwal[0]!, nama: 'Retreat', tanggalMulai: '2027-05-01' }
  f.indikator[0] = { ...f.indikator[0]!, indikator: 'Hadir', target: '20', bukti: 'Daftar hadir' }
  f.rab[0] = { ...f.rab[0]!, uraian: 'Konsumsi', volume: '20', satuan: 'Orang', hargaSatuan: '25000' }
  f.sumber.GEREJA.nilai = '300000'
  f.sumber.SWADAYA.nilai = '200000'
  f.checklist = { a: true, b: true }
  return f
}

describe('total dan selisih', () => {
  it('jumlah baris = volume × harga; angka tidak valid = 0', () => {
    expect(jumlahBaris({ volume: '20', hargaSatuan: '25.000' })).toBe(500_000)
    expect(jumlahBaris({ volume: '0', hargaSatuan: '1000' })).toBe(0)
    expect(jumlahBaris({ volume: '2', hargaSatuan: 'abc' })).toBe(0)
    expect(jumlahBaris({ volume: '1,5', hargaSatuan: '100' })).toBe(0)
  })

  it('total RAB, total sumber, mandiri, dan selisih', () => {
    const f = lengkap()
    expect(totalRab(f)).toBe(500_000)
    expect(totalSumber(f)).toBe(500_000)
    expect(totalMandiri(f)).toBe(200_000)
    expect(selisihSumber(f)).toBe(0)
    f.sumber.GEREJA.nilai = '100000'
    expect(selisihSumber(f)).toBe(-200_000)
  })

  it('isiSisaKeGereja: RAB dikurangi sumber mandiri; tidak pernah negatif', () => {
    const f = lengkap()
    f.sumber.GEREJA.nilai = ''
    expect(isiSisaKeGereja(f).sumber.GEREJA.nilai).toBe('300000')
    f.sumber.SWADAYA.nilai = '900000'
    expect(isiSisaKeGereja(f).sumber.GEREJA.nilai).toBe('')
  })
})

describe('keApi', () => {
  it('menghasilkan badan dengan angka bulat dan tanpa baris kosong; tidak mengirim "jumlah"', () => {
    const f = lengkap()
    f.rab.push(rabKosong()) // baris kosong tersisa
    const r = keApi(f)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const rab = r.body['rab'] as Array<Record<string, unknown>>
    expect(rab).toHaveLength(1)
    expect(rab[0]).toEqual({ kategoriId: null, uraian: 'Konsumsi', perhitungan: null, volume: 20, satuan: 'Orang', hargaSatuan: 25_000 })
    expect(rab[0]).not.toHaveProperty('jumlah')
    expect(r.body['sumberDana']).toEqual([{ jenis: 'GEREJA', nilai: 300_000, keterangan: null }, { jenis: 'SWADAYA', nilai: 200_000, keterangan: null }])
  })

  it('harga atau volume tidak valid → galat sebelum dikirim', () => {
    const f = lengkap()
    f.rab[0]!.hargaSatuan = '12x'
    f.rab[0]!.volume = '0'
    const r = keApi(f)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.galat.length).toBe(2)
  })

  it('sumber dana bernilai 0 tidak dikirim; string kosong menjadi null', () => {
    const f = lengkap()
    f.sumber.DONASI.nilai = '0'
    f.latarBelakang = '   '
    const r = keApi(f)
    if (!r.ok) throw new Error('harus ok')
    expect((r.body['sumberDana'] as unknown[]).length).toBe(2)
    expect(r.body['latarBelakang']).toBeNull()
  })
})

describe('masalahLokal', () => {
  it('lengkap → kosong', () => expect(masalahLokal(lengkap(), KODE)).toEqual([]))

  it('mendeteksi sumber dana ≠ RAB, checklist, dan isian kosong', () => {
    const f = lengkap()
    f.sumber.GEREJA.nilai = '1'
    f.checklist = { a: true }
    f.picNama = ''
    const m = masalahLokal(f, KODE)
    expect(m).toContain('Total sumber dana harus sama dengan total anggaran.')
    expect(m.some((x) => x.includes('1 butir'))).toBe(true)
    expect(m.some((x) => x.includes('PIC'))).toBe(true)
  })

  it('formulir baru (semua kosong) tidak melempar dan melaporkan banyak masalah', () => {
    expect(masalahLokal(formKosong(), KODE).length).toBeGreaterThanOrEqual(8)
  })
})

describe('dariApi', () => {
  const api = (): ProgramDetail => ({
    id: 1, nomor: 'N', tahun: { id: 1, tahun: 2027, nama: 'RKA', statusPengajuan: 'DIBUKA' }, unit: { id: 1, kode: 'U', nama: 'U', singkatan: null, bidangId: 1, jenis: 'UPK' },
    judul: 'J', jenisProgram: 'LANJUTAN', program2026Id: 4, latarBelakang: null, kebutuhan: 'K', tujuan: null, sasaranPenerima: null, targetPeserta: 0, evaluasi: null, picNama: null, picWhatsapp: null,
    checklist: { a: true }, status: 'DRAFT', diajukanPada: null, isContoh: false, updatedAt: '', acuanIds: [3],
    jadwal: [], indikator: [], rab: [{ id: 1, kategoriId: 2, kategori: 'x', uraian: 'U', perhitungan: null, volume: 3, satuan: 'Orang', hargaSatuan: 10_000, jumlah: 30_000 }],
    sumberDana: [{ jenis: 'GEREJA', nilai: 30_000, keterangan: null }], totalRab: 30_000, totalSumberDana: 30_000, selisih: 0, gereja: 30_000, mandiri: 0,
  })

  it('null menjadi string kosong, nol target tetap "0", daftar kosong mendapat satu baris kosong', () => {
    const f = dariApi(api())
    expect(f.latarBelakang).toBe('')
    expect(f.targetPeserta).toBe('0')
    expect(f.jadwal).toHaveLength(1)
    expect(f.indikator).toHaveLength(1)
    expect(f.rab[0]).toMatchObject({ volume: '3', hargaSatuan: '10000', kategoriId: 2 })
    expect(f.sumber.GEREJA.nilai).toBe('30000')
    expect(f.sumber.SWADAYA.nilai).toBe('')
  })

  it('putaran balik dariApi → keApi mempertahankan angka', () => {
    const r = keApi(dariApi(api()))
    if (!r.ok) throw new Error('harus ok')
    expect((r.body['rab'] as Array<{ volume: number; hargaSatuan: number }>)[0]).toMatchObject({ volume: 3, hargaSatuan: 10_000 })
    expect(r.body['sumberDana']).toEqual([{ jenis: 'GEREJA', nilai: 30_000, keterangan: null }])
  })
})
