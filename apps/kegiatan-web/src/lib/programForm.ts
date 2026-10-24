import type { JenisProgram, JenisSumberDana, KategoriWaktu, ProgramDetail } from './tipe'
import { parseRupiah } from './format'

export const JENIS_SUMBER: JenisSumberDana[] = ['GEREJA', 'SWADAYA', 'PENGGALANGAN', 'DONASI']
export const LABEL_SUMBER: Record<JenisSumberDana, string> = {
  GEREJA: 'Alokasi gereja',
  SWADAYA: 'Swadaya peserta',
  PENGGALANGAN: 'Penggalangan dana mandiri',
  DONASI: 'Donasi / sponsor',
}
export const LABEL_WAKTU: Record<KategoriWaktu, string> = {
  SEKALI: 'Sekali diberikan',
  PERIODE: 'Periode (berulang)',
  RENTANG: 'Spesifik rentang tanggal',
  TAHUN: 'Sepanjang tahun',
}
export const LABEL_JENIS_PROGRAM: Record<JenisProgram, string> = {
  BARU: 'Program baru',
  LANJUTAN: 'Lanjutan program 2026',
  GABUNGAN: 'Gabungan beberapa program',
}

let urutanUid = 0
export const uid = (): string => `f${++urutanUid}`

export interface JadwalForm { uid: string; nama: string; kategoriWaktu: KategoriWaktu; tanggalMulai: string; tanggalSelesai: string; keteranganPeriode: string; lokasi: string; hasilLangsung: string }
export interface IndikatorForm { uid: string; indikator: string; target: string; bukti: string }
export interface RabForm { uid: string; kategoriId: number | null; uraian: string; perhitungan: string; volume: string; satuan: string; hargaSatuan: string }
export interface SumberForm { nilai: string; keterangan: string }

export interface FormProgram {
  judul: string
  jenisProgram: JenisProgram
  program2026Id: number | null
  latarBelakang: string
  kebutuhan: string
  tujuan: string
  sasaranPenerima: string
  targetPeserta: string
  evaluasi: string
  picNama: string
  picWhatsapp: string
  acuanIds: number[]
  jadwal: JadwalForm[]
  indikator: IndikatorForm[]
  rab: RabForm[]
  sumber: Record<JenisSumberDana, SumberForm>
  checklist: Record<string, boolean>
}

export const jadwalKosong = (): JadwalForm => ({ uid: uid(), nama: '', kategoriWaktu: 'SEKALI', tanggalMulai: '', tanggalSelesai: '', keteranganPeriode: '', lokasi: '', hasilLangsung: '' })
export const indikatorKosong = (): IndikatorForm => ({ uid: uid(), indikator: '', target: '', bukti: '' })
export const rabKosong = (): RabForm => ({ uid: uid(), kategoriId: null, uraian: '', perhitungan: '', volume: '1', satuan: '', hargaSatuan: '' })

export function formKosong(): FormProgram {
  return {
    judul: '', jenisProgram: 'BARU', program2026Id: null, latarBelakang: '', kebutuhan: '', tujuan: '', sasaranPenerima: '', targetPeserta: '',
    evaluasi: '', picNama: '', picWhatsapp: '', acuanIds: [], jadwal: [jadwalKosong()], indikator: [indikatorKosong()], rab: [rabKosong()],
    sumber: { GEREJA: { nilai: '', keterangan: '' }, SWADAYA: { nilai: '', keterangan: '' }, PENGGALANGAN: { nilai: '', keterangan: '' }, DONASI: { nilai: '', keterangan: '' } },
    checklist: {},
  }
}

const angkaTeks = (n: number): string => (n === 0 ? '' : String(n))

export function dariApi(p: ProgramDetail): FormProgram {
  const sumber = formKosong().sumber
  for (const s of p.sumberDana) sumber[s.jenis] = { nilai: angkaTeks(s.nilai), keterangan: s.keterangan ?? '' }
  return {
    judul: p.judul,
    jenisProgram: p.jenisProgram,
    program2026Id: p.program2026Id,
    latarBelakang: p.latarBelakang ?? '',
    kebutuhan: p.kebutuhan ?? '',
    tujuan: p.tujuan ?? '',
    sasaranPenerima: p.sasaranPenerima ?? '',
    targetPeserta: p.targetPeserta == null ? '' : String(p.targetPeserta),
    evaluasi: p.evaluasi ?? '',
    picNama: p.picNama ?? '',
    picWhatsapp: p.picWhatsapp ?? '',
    acuanIds: [...p.acuanIds],
    jadwal: p.jadwal.length ? p.jadwal.map((j) => ({ uid: uid(), nama: j.nama, kategoriWaktu: j.kategoriWaktu, tanggalMulai: j.tanggalMulai ?? '', tanggalSelesai: j.tanggalSelesai ?? '', keteranganPeriode: j.keteranganPeriode ?? '', lokasi: j.lokasi ?? '', hasilLangsung: j.hasilLangsung ?? '' })) : [jadwalKosong()],
    indikator: p.indikator.length ? p.indikator.map((i) => ({ uid: uid(), indikator: i.indikator, target: i.target, bukti: i.bukti })) : [indikatorKosong()],
    rab: p.rab.length ? p.rab.map((r) => ({ uid: uid(), kategoriId: r.kategoriId, uraian: r.uraian, perhitungan: r.perhitungan ?? '', volume: String(r.volume), satuan: r.satuan, hargaSatuan: String(r.hargaSatuan) })) : [rabKosong()],
    sumber,
    checklist: { ...p.checklist },
  }
}

const kosongKeNull = (s: string): string | null => (s.trim() === '' ? null : s.trim())

/** Baris yang sama sekali kosong tidak dikirim (formulir selalu menyisakan satu baris kosong). */
const jadwalTerisi = (j: JadwalForm): boolean => j.nama.trim() !== '' || j.tanggalMulai !== '' || j.keteranganPeriode.trim() !== '' || j.lokasi.trim() !== '' || j.hasilLangsung.trim() !== ''
const indikatorTerisi = (i: IndikatorForm): boolean => i.indikator.trim() !== '' || i.target.trim() !== '' || i.bukti.trim() !== ''
const rabTerisi = (r: RabForm): boolean => r.uraian.trim() !== '' || r.satuan.trim() !== '' || (parseRupiah(r.hargaSatuan) ?? 1) > 0 || r.perhitungan.trim() !== ''

export type HasilKeApi = { ok: true; body: Record<string, unknown> } | { ok: false; galat: string[] }

/** Mengubah isian formulir ke badan permintaan; mengembalikan galat bentuk (angka tidak valid) sebelum dikirim. */
export function keApi(f: FormProgram): HasilKeApi {
  const galat: string[] = []
  const rab = f.rab.filter(rabTerisi).map((r, i) => {
    const harga = parseRupiah(r.hargaSatuan)
    const volume = Number(r.volume)
    if (harga === null) galat.push(`Baris anggaran ${i + 1}: harga satuan harus berupa angka.`)
    if (!Number.isInteger(volume) || volume < 1) galat.push(`Baris anggaran ${i + 1}: volume harus bilangan bulat minimal 1.`)
    return { kategoriId: r.kategoriId, uraian: r.uraian.trim(), perhitungan: kosongKeNull(r.perhitungan), volume, satuan: r.satuan.trim(), hargaSatuan: harga ?? 0 }
  })
  const sumberDana = JENIS_SUMBER.map((jenis) => {
    const nilai = parseRupiah(f.sumber[jenis].nilai)
    if (nilai === null) galat.push(`${LABEL_SUMBER[jenis]}: nilai harus berupa angka.`)
    return { jenis, nilai: nilai ?? 0, keterangan: kosongKeNull(f.sumber[jenis].keterangan) }
  }).filter((s) => s.nilai > 0)
  const target = f.targetPeserta.trim() === '' ? null : Number(f.targetPeserta)
  if (target !== null && (!Number.isInteger(target) || target < 0)) galat.push('Target peserta harus bilangan bulat.')
  if (galat.length > 0) return { ok: false, galat }

  return {
    ok: true,
    body: {
      judul: f.judul.trim(),
      jenisProgram: f.jenisProgram,
      program2026Id: f.program2026Id,
      latarBelakang: kosongKeNull(f.latarBelakang),
      kebutuhan: kosongKeNull(f.kebutuhan),
      tujuan: kosongKeNull(f.tujuan),
      sasaranPenerima: kosongKeNull(f.sasaranPenerima),
      targetPeserta: target,
      evaluasi: kosongKeNull(f.evaluasi),
      picNama: kosongKeNull(f.picNama),
      picWhatsapp: kosongKeNull(f.picWhatsapp),
      acuanIds: f.acuanIds,
      jadwal: f.jadwal.filter(jadwalTerisi).map((j) => ({
        nama: j.nama.trim(), kategoriWaktu: j.kategoriWaktu, tanggalMulai: j.tanggalMulai || null, tanggalSelesai: j.tanggalSelesai || null,
        keteranganPeriode: kosongKeNull(j.keteranganPeriode), lokasi: kosongKeNull(j.lokasi), hasilLangsung: kosongKeNull(j.hasilLangsung),
      })),
      indikator: f.indikator.filter(indikatorTerisi).map((i) => ({ indikator: i.indikator.trim(), target: i.target.trim(), bukti: i.bukti.trim() })),
      rab,
      sumberDana,
      checklist: f.checklist,
    },
  }
}

/** Jumlah satu baris = volume × harga (angka tidak valid dianggap 0). */
export function jumlahBaris(r: Pick<RabForm, 'volume' | 'hargaSatuan'>): number {
  const v = Number(r.volume)
  const h = parseRupiah(r.hargaSatuan)
  if (!Number.isInteger(v) || v < 1 || h === null) return 0
  return v * h
}

export const totalRab = (f: Pick<FormProgram, 'rab'>): number => f.rab.reduce((n, r) => n + jumlahBaris(r), 0)
export const totalSumber = (f: Pick<FormProgram, 'sumber'>): number => JENIS_SUMBER.reduce((n, j) => n + (parseRupiah(f.sumber[j].nilai) ?? 0), 0)
export const totalMandiri = (f: Pick<FormProgram, 'sumber'>): number => totalSumber(f) - (parseRupiah(f.sumber.GEREJA.nilai) ?? 0)

/** Selisih sumber dana terhadap RAB: negatif = kurang, positif = berlebih. */
export const selisihSumber = (f: FormProgram): number => totalSumber(f) - totalRab(f)

/** Mengisi alokasi gereja dengan sisa kebutuhan (RAB dikurangi sumber mandiri), tidak pernah negatif. */
export function isiSisaKeGereja(f: FormProgram): FormProgram {
  const sisa = Math.max(0, totalRab(f) - totalMandiri(f))
  return { ...f, sumber: { ...f.sumber, GEREJA: { ...f.sumber.GEREJA, nilai: sisa === 0 ? '' : String(sisa) } } }
}

/** Petunjuk kelengkapan di sisi klien (cermin aturan server; server tetap penentu). */
export function masalahLokal(f: FormProgram, kodeChecklist: string[]): string[] {
  const m: string[] = []
  const kosong = (s: string): boolean => s.trim() === ''
  if (kosong(f.latarBelakang)) m.push('Latar belakang belum diisi.')
  if (kosong(f.kebutuhan)) m.push('Rumusan kebutuhan belum diisi.')
  if (kosong(f.tujuan)) m.push('Tujuan program belum diisi.')
  if (kosong(f.sasaranPenerima)) m.push('Sasaran atau penerima manfaat belum diisi.')
  if (kosong(f.evaluasi)) m.push('Rencana evaluasi dan pelaporan belum diisi.')
  if (kosong(f.picNama)) m.push('Nama penanggung jawab (PIC) belum diisi.')
  if (kosong(f.picWhatsapp)) m.push('Nomor WhatsApp PIC belum diisi.')
  if (f.acuanIds.length === 0) m.push('Pilih minimal satu acuan visi-misi.')
  if (!f.jadwal.some(jadwalTerisi)) m.push('Tambahkan minimal satu kegiatan pada rencana kegiatan dan jadwal.')
  if (!f.indikator.some(indikatorTerisi)) m.push('Tambahkan minimal satu indikator keberhasilan.')
  const baris = f.rab.filter(rabTerisi)
  if (baris.length === 0) m.push('Tambahkan minimal satu baris rencana anggaran biaya.')
  else if (totalRab(f) === 0) m.push('Total anggaran masih Rp 0.')
  else if (selisihSumber(f) !== 0) m.push('Total sumber dana harus sama dengan total anggaran.')
  const belum = kodeChecklist.filter((k) => f.checklist[k] !== true).length
  if (belum > 0) m.push(`Daftar periksa belum lengkap (${belum} butir belum dicentang).`)
  return m
}
