import { describe, it, expect } from 'vitest'
import { KODE_CHECKLIST } from '../../src/constants/checklist.js'
import { periksaKelengkapan, simpanProgramSchema, totalRab, totalSumberDana } from '../../src/domain/validasiProgram.js'

const checklistLengkap = Object.fromEntries(KODE_CHECKLIST.map((k) => [k, true]))

/** Program yang lolos semua pemeriksaan; tiap tes merusak SATU hal. */
function lengkap(ubah: Record<string, unknown> = {}) {
  return simpanProgramSchema.parse({
    judul: 'Pendampingan Usaha Kecil',
    latarBelakang: 'Latar', kebutuhan: 'Kebutuhan', tujuan: 'Tujuan', sasaranPenerima: 'Pelaku usaha jemaat', targetPeserta: 20,
    evaluasi: 'Evaluasi akhir', picNama: 'Penanggung jawab', picWhatsapp: '081234567890',
    acuanIds: [1],
    jadwal: [{ nama: 'Pelatihan', kategoriWaktu: 'SEKALI', tanggalMulai: '2027-04-10' }],
    indikator: [{ indikator: 'Peserta hadir', target: '16 orang', bukti: 'Daftar hadir' }],
    rab: [{ uraian: 'Konsumsi', volume: 20, satuan: 'Orang', hargaSatuan: 25_000 }, { uraian: 'Narasumber', volume: 2, satuan: 'Sesi', hargaSatuan: 500_000 }],
    sumberDana: [{ jenis: 'GEREJA', nilai: 1_000_000 }, { jenis: 'SWADAYA', nilai: 500_000 }],
    checklist: checklistLengkap,
    ...ubah,
  })
}

describe('periksaKelengkapan', () => {
  it('program lengkap → tanpa masalah (total RAB 1.500.000 = sumber dana 1.500.000)', () => {
    expect(periksaKelengkapan(lengkap())).toEqual([])
  })

  it('total sumber dana kurang dari RAB → masalah dengan angka kedua sisi', () => {
    const m = periksaKelengkapan(lengkap({ sumberDana: [{ jenis: 'GEREJA', nilai: 1_000_000 }] }))
    expect(m).toHaveLength(1)
    expect(m[0]).toContain('sama dengan')
  })

  it('total sumber dana melebihi RAB → masalah', () => {
    expect(periksaKelengkapan(lengkap({ sumberDana: [{ jenis: 'GEREJA', nilai: 2_000_000 }] }))).toHaveLength(1)
  })

  it('tanpa sumber dana sama sekali → masalah', () => {
    expect(periksaKelengkapan(lengkap({ sumberDana: [] })).some((x) => x.includes('sumber dana'))).toBe(true)
  })

  it.each([
    ['latarBelakang', 'Latar belakang'], ['kebutuhan', 'kebutuhan'], ['tujuan', 'Tujuan'], ['sasaranPenerima', 'Sasaran'],
    ['evaluasi', 'evaluasi'], ['picNama', 'PIC'],
  ])('%s kosong → masalah', (kolom, kata) => {
    const m = periksaKelengkapan(lengkap({ [kolom]: '   ' }))
    expect(m.some((x) => x.toLowerCase().includes(kata.toLowerCase()))).toBe(true)
  })

  it('WhatsApp PIC tidak valid → masalah', () => {
    expect(periksaKelengkapan(lengkap({ picWhatsapp: '123' })).some((x) => x.includes('WhatsApp'))).toBe(true)
  })

  it('tanpa acuan visi-misi, jadwal, indikator, atau RAB → masalah masing-masing', () => {
    expect(periksaKelengkapan(lengkap({ acuanIds: [] })).some((x) => x.includes('acuan'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ jadwal: [] })).some((x) => x.includes('kegiatan'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ indikator: [] })).some((x) => x.includes('indikator'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ rab: [], sumberDana: [] })).some((x) => x.includes('anggaran biaya'))).toBe(true)
  })

  it('jadwal: SEKALI butuh tanggal, RENTANG butuh dua tanggal, PERIODE butuh keterangan', () => {
    expect(periksaKelengkapan(lengkap({ jadwal: [{ nama: 'A', kategoriWaktu: 'SEKALI' }] })).some((x) => x.includes('tanggal pelaksanaan'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ jadwal: [{ nama: 'A', kategoriWaktu: 'RENTANG', tanggalMulai: '2027-01-01' }] })).some((x) => x.includes('mulai dan selesai'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ jadwal: [{ nama: 'A', kategoriWaktu: 'PERIODE' }] })).some((x) => x.includes('keterangan periode'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ jadwal: [{ nama: 'A', kategoriWaktu: 'TAHUN' }] }))).toEqual([])
  })

  it('daftar periksa: satu butir saja yang belum → masalah; checklist kosong → masalah', () => {
    const satuKurang = { ...checklistLengkap, [KODE_CHECKLIST[3]!]: false }
    expect(periksaKelengkapan(lengkap({ checklist: satuKurang })).some((x) => x.includes('1 butir'))).toBe(true)
    expect(periksaKelengkapan(lengkap({ checklist: {} })).some((x) => x.includes('9 butir'))).toBe(true)
  })

  it('RAB total Rp 0 → masalah', () => {
    const m = periksaKelengkapan(lengkap({ rab: [{ uraian: 'Gratis', volume: 1, satuan: 'Paket', hargaSatuan: 0 }], sumberDana: [] }))
    expect(m.some((x) => x.includes('Rp 0'))).toBe(true)
  })
})

describe('simpanProgramSchema (bentuk, untuk draft)', () => {
  it('draft minimal hanya butuh judul', () => {
    expect(simpanProgramSchema.safeParse({ judul: 'Abc' }).success).toBe(true)
    expect(simpanProgramSchema.safeParse({ judul: 'Ab' }).success).toBe(false)
  })

  it('kiriman "jumlah" dari klien pada RAB diabaikan (dihitung server)', () => {
    const p = simpanProgramSchema.parse({ judul: 'Abc', rab: [{ uraian: 'x', volume: 2, satuan: 'Orang', hargaSatuan: 100, jumlah: 999_999 }] })
    expect(p.rab[0]).not.toHaveProperty('jumlah')
    expect(totalRab(p.rab)).toBe(200n)
  })

  it('menolak: sumber dana dobel, acuan dobel, rupiah desimal/negatif, tanggal selesai sebelum mulai', () => {
    expect(simpanProgramSchema.safeParse({ judul: 'Abc', sumberDana: [{ jenis: 'GEREJA', nilai: 1 }, { jenis: 'GEREJA', nilai: 2 }] }).success).toBe(false)
    expect(simpanProgramSchema.safeParse({ judul: 'Abc', acuanIds: [1, 1] }).success).toBe(false)
    expect(simpanProgramSchema.safeParse({ judul: 'Abc', rab: [{ uraian: 'x', volume: 1, satuan: 'a', hargaSatuan: 10.5 }] }).success).toBe(false)
    expect(simpanProgramSchema.safeParse({ judul: 'Abc', rab: [{ uraian: 'x', volume: 1, satuan: 'a', hargaSatuan: -5 }] }).success).toBe(false)
    expect(
      simpanProgramSchema.safeParse({ judul: 'Abc', jadwal: [{ nama: 'a', kategoriWaktu: 'RENTANG', tanggalMulai: '2027-05-10', tanggalSelesai: '2027-05-09' }] }).success,
    ).toBe(false)
  })

  it('menolak jumlah satu baris yang melebihi 1 triliun', () => {
    expect(simpanProgramSchema.safeParse({ judul: 'Abc', rab: [{ uraian: 'x', volume: 1_000_000, satuan: 'a', hargaSatuan: 2_000_000 }] }).success).toBe(false)
  })

  it('total dihitung dari baris', () => {
    const p = lengkap()
    expect(totalRab(p.rab)).toBe(1_500_000n)
    expect(totalSumberDana(p.sumberDana)).toBe(1_500_000n)
  })
})
