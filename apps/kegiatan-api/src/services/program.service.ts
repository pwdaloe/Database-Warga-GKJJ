import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { PenggunaLogin } from '../middleware/auth.js'
import {
  bolehAjukanProgram, bolehBuatProgram, bolehHapusProgram, bolehLihatProgram, bolehTarikProgram, bolehUbahProgram,
  cakupanDari, type Keputusan,
} from '../domain/akses.js'
import { hitungJumlah, jumlahkan } from '../domain/rupiah.js'
import { periksaKelengkapan, simpanProgramSchema, type SimpanProgram } from '../domain/validasiProgram.js'
import { catatAudit } from './audit.service.js'

const tolakBila = (k: Keputusan): void => {
  if (!k.boleh) throw new AppError(k.kode ?? 403, k.alasan ?? 'Tidak diizinkan')
}

const sertakan = {
  unit: { select: { id: true, kode: true, nama: true, singkatan: true, bidangId: true, jenis: true } },
  tahun: { select: { id: true, tahun: true, nama: true, statusPengajuan: true } },
  acuan: { select: { acuanId: true } },
  jadwal: { orderBy: { urutan: 'asc' as const } },
  indikator: { orderBy: { urutan: 'asc' as const } },
  rab: { orderBy: { urutan: 'asc' as const }, include: { kategori: { select: { id: true, nama: true } } } },
  sumberDana: true,
} satisfies Prisma.ProgramKerjaInclude

type ProgramDb = Prisma.ProgramKerjaGetPayload<{ include: typeof sertakan }>

const tgl = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null)
const num = (n: bigint): number => Number(n)

function jumlahPerJenis(sd: ProgramDb['sumberDana']) {
  const per = { GEREJA: 0, SWADAYA: 0, PENGGALANGAN: 0, DONASI: 0 }
  for (const s of sd) per[s.jenis] += num(s.nilai)
  return per
}

/** Bentuk respons: tanggal 'YYYY-MM-DD', uang number, total dihitung dari baris (bukan kolom tersimpan). */
export function serialisasiProgram(p: ProgramDb) {
  const totalRab = num(jumlahkan(p.rab.map((r) => r.jumlah)))
  const per = jumlahPerJenis(p.sumberDana)
  const totalSumber = per.GEREJA + per.SWADAYA + per.PENGGALANGAN + per.DONASI
  return {
    id: p.id,
    nomor: p.nomor,
    tahun: p.tahun,
    unit: p.unit,
    judul: p.judul,
    jenisProgram: p.jenisProgram,
    program2026Id: p.program2026Id,
    latarBelakang: p.latarBelakang,
    kebutuhan: p.kebutuhan,
    tujuan: p.tujuan,
    sasaranPenerima: p.sasaranPenerima,
    targetPeserta: p.targetPeserta,
    evaluasi: p.evaluasi,
    picNama: p.picNama,
    picWhatsapp: p.picWhatsapp,
    checklist: (p.checklist ?? {}) as Record<string, boolean>,
    status: p.status,
    diajukanPada: p.diajukanPada,
    isContoh: p.isContoh,
    updatedAt: p.updatedAt,
    acuanIds: p.acuan.map((a) => a.acuanId),
    jadwal: p.jadwal.map((j) => ({
      id: j.id, nama: j.nama, kategoriWaktu: j.kategoriWaktu, tanggalMulai: tgl(j.tanggalMulai),
      tanggalSelesai: tgl(j.tanggalSelesai), keteranganPeriode: j.keteranganPeriode, lokasi: j.lokasi, hasilLangsung: j.hasilLangsung,
    })),
    indikator: p.indikator.map((i) => ({ id: i.id, indikator: i.indikator, target: i.target, bukti: i.bukti })),
    rab: p.rab.map((r) => ({
      id: r.id, kategoriId: r.kategoriId, kategori: r.kategori?.nama ?? null, uraian: r.uraian, perhitungan: r.perhitungan,
      volume: r.volume, satuan: r.satuan, hargaSatuan: num(r.hargaSatuan), jumlah: num(r.jumlah),
    })),
    sumberDana: p.sumberDana.map((s) => ({ jenis: s.jenis, nilai: num(s.nilai), keterangan: s.keterangan })),
    totalRab,
    totalSumberDana: totalSumber,
    selisih: totalRab - totalSumber,
    gereja: per.GEREJA,
    mandiri: per.SWADAYA + per.PENGGALANGAN + per.DONASI,
  }
}

/** Ubah program dari database ke bentuk masukan simpan, untuk menjalankan pemeriksaan kelengkapan dari DATA TERSIMPAN. */
export function keBentukSimpan(p: ProgramDb): SimpanProgram {
  const s = serialisasiProgram(p)
  return {
    judul: s.judul,
    jenisProgram: s.jenisProgram,
    program2026Id: s.program2026Id,
    latarBelakang: s.latarBelakang,
    kebutuhan: s.kebutuhan,
    tujuan: s.tujuan,
    sasaranPenerima: s.sasaranPenerima,
    targetPeserta: s.targetPeserta,
    evaluasi: s.evaluasi,
    picNama: s.picNama,
    picWhatsapp: s.picWhatsapp,
    acuanIds: s.acuanIds,
    jadwal: s.jadwal.map((j) => ({ ...j })),
    indikator: s.indikator.map((i) => ({ indikator: i.indikator, target: i.target, bukti: i.bukti })),
    rab: s.rab.map((r) => ({ kategoriId: r.kategoriId, uraian: r.uraian, perhitungan: r.perhitungan, volume: r.volume, satuan: r.satuan, hargaSatuan: r.hargaSatuan })),
    sumberDana: s.sumberDana.map((d) => ({ jenis: d.jenis, nilai: d.nilai, keterangan: d.keterangan })),
    checklist: s.checklist,
  }
}

async function muatProgram(id: number): Promise<ProgramDb> {
  const p = await prisma.programKerja.findUnique({ where: { id }, include: sertakan })
  if (!p) throw new AppError(404, 'Program tidak ditemukan')
  return p
}

/** 404 (bukan 403) bila tidak boleh melihat, agar keberadaan program unit lain tidak terbongkar. */
async function muatProgramDilihat(user: PenggunaLogin, id: number): Promise<ProgramDb> {
  const p = await muatProgram(id)
  if (!bolehLihatProgram(user, { unitId: p.unitId, status: p.status, unit: p.unit })) throw new AppError(404, 'Program tidak ditemukan')
  return p
}

export interface FilterProgram {
  tahunId?: number | undefined
  unitId?: number | undefined
  status?: 'DRAFT' | 'DIAJUKAN' | undefined
}

export async function daftarProgram(user: PenggunaLogin, f: FilterProgram) {
  const cak = cakupanDari(user)
  if (cak.jenis === 'kosong') return []

  const where: Prisma.ProgramKerjaWhereInput = {
    ...(f.tahunId ? { tahunId: f.tahunId } : {}),
    ...(f.unitId ? { unitId: f.unitId } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(cak.jenis === 'unit' ? { unitId: cak.unitId } : {}),
    ...(cak.jenis === 'bidang' ? { unit: { bidangId: cak.bidangId } } : {}),
  }
  // Pengurus yang meminta unit lain: penyaring unit ikut dipaksa ke unitnya sendiri (hasil kosong, bukan bocor).
  if (cak.jenis === 'unit' && f.unitId && f.unitId !== cak.unitId) return []

  const rows = await prisma.programKerja.findMany({ where, include: sertakan, orderBy: [{ unitId: 'asc' }, { id: 'asc' }] })
  return rows.map((p) => {
    const s = serialisasiProgram(p)
    return {
      id: s.id, nomor: s.nomor, judul: s.judul, unit: s.unit, status: s.status, jenisProgram: s.jenisProgram,
      totalRab: s.totalRab, gereja: s.gereja, mandiri: s.mandiri, selisih: s.selisih,
      jumlahKegiatan: s.jadwal.length, diajukanPada: s.diajukanPada, updatedAt: s.updatedAt, isContoh: s.isContoh,
    }
  })
}

export async function detailProgram(user: PenggunaLogin, id: number) {
  return serialisasiProgram(await muatProgramDilihat(user, id))
}

/** Memastikan rujukan (acuan, kategori biaya, program 2026) ada dan sah, sebelum ditulis. */
async function periksaRujukan(tx: Prisma.TransactionClient, tahunId: number, unitId: number, d: SimpanProgram): Promise<void> {
  if (d.acuanIds.length > 0) {
    const ada = await tx.acuanStrategis.count({ where: { id: { in: d.acuanIds }, tahunId, aktif: true } })
    if (ada !== d.acuanIds.length) throw new AppError(400, 'Acuan visi-misi tidak valid untuk tahun anggaran ini.')
  }
  const kategori = [...new Set(d.rab.map((r) => r.kategoriId).filter((k): k is number => typeof k === 'number'))]
  if (kategori.length > 0 && (await tx.kategoriBiaya.count({ where: { id: { in: kategori } } })) !== kategori.length) {
    throw new AppError(400, 'Kategori biaya tidak valid.')
  }
  if (d.program2026Id) {
    const lama = await tx.program2026.findUnique({ where: { id: d.program2026Id }, select: { unitId: true } })
    if (!lama || lama.unitId !== unitId) throw new AppError(400, 'Program 2026 yang dirujuk tidak ditemukan pada unit ini.')
  }
}

const dateOrNull = (s: string | null | undefined): Date | null => (s ? new Date(`${s}T00:00:00Z`) : null)

function anakProgram(d: SimpanProgram) {
  return {
    acuan: { create: d.acuanIds.map((acuanId) => ({ acuanId })) },
    jadwal: {
      create: d.jadwal.map((j, i) => ({
        urutan: i, nama: j.nama, kategoriWaktu: j.kategoriWaktu, tanggalMulai: dateOrNull(j.tanggalMulai),
        tanggalSelesai: dateOrNull(j.tanggalSelesai), keteranganPeriode: j.keteranganPeriode ?? null,
        lokasi: j.lokasi ?? null, hasilLangsung: j.hasilLangsung ?? null,
      })),
    },
    indikator: { create: d.indikator.map((x, i) => ({ urutan: i, indikator: x.indikator, target: x.target, bukti: x.bukti })) },
    rab: {
      create: d.rab.map((r, i) => ({
        urutan: i, kategoriId: r.kategoriId ?? null, uraian: r.uraian, perhitungan: r.perhitungan ?? null, volume: r.volume,
        satuan: r.satuan, hargaSatuan: BigInt(r.hargaSatuan),
        // jumlah SELALU dihitung server dari volume x harga; kiriman klien tidak dipercaya.
        jumlah: hitungJumlah(r.volume, r.hargaSatuan),
      })),
    },
    sumberDana: {
      create: d.sumberDana.filter((s) => s.nilai > 0).map((s) => ({ jenis: s.jenis, nilai: BigInt(s.nilai), keterangan: s.keterangan ?? null })),
    },
  }
}

function skalar(d: SimpanProgram) {
  return {
    judul: d.judul,
    jenisProgram: d.jenisProgram,
    program2026Id: d.program2026Id ?? null,
    latarBelakang: d.latarBelakang ?? null,
    kebutuhan: d.kebutuhan ?? null,
    tujuan: d.tujuan ?? null,
    sasaranPenerima: d.sasaranPenerima ?? null,
    targetPeserta: d.targetPeserta ?? null,
    evaluasi: d.evaluasi ?? null,
    picNama: d.picNama ?? null,
    picWhatsapp: d.picWhatsapp ?? null,
    checklist: d.checklist,
  }
}

async function tahunUntuk(tahunId: number | undefined) {
  const t = tahunId
    ? await prisma.tahunAnggaran.findUnique({ where: { id: tahunId } })
    : await prisma.tahunAnggaran.findFirst({ where: { aktif: true }, orderBy: { tahun: 'desc' } })
  if (!t) throw new AppError(404, 'Tahun anggaran tidak ditemukan')
  return t
}

export async function buatProgram(user: PenggunaLogin, unitIdMasukan: number | undefined, tahunId: number | undefined, mentah: unknown, ip: string | null) {
  const d = simpanProgramSchema.parse(mentah)
  const unitId = user.peran === 'PENGURUS_UPK' ? user.unitId : unitIdMasukan
  if (!unitId) throw new AppError(400, 'Unit pengusul wajib dipilih.')
  const tahun = await tahunUntuk(tahunId)
  const unit = await prisma.unit.findUnique({ where: { id: unitId }, select: { id: true, kode: true, aktif: true } })
  if (!unit || !unit.aktif) throw new AppError(400, 'Unit tidak ditemukan atau tidak aktif.')

  tolakBila(bolehBuatProgram(user, unitId, tahun.statusPengajuan))

  const id = await prisma.$transaction(async (tx) => {
    await periksaRujukan(tx, tahun.id, unitId, d)
    const baru = await tx.programKerja.create({
      data: { ...skalar(d), tahunId: tahun.id, unitId, dibuatOleh: user.id, diubahOleh: user.id, ...anakProgram(d) },
      select: { id: true },
    })
    await tx.programKerja.update({ where: { id: baru.id }, data: { nomor: `${tahun.tahun}-${unit.kode}-${String(baru.id).padStart(4, '0')}` } })
    await catatAudit({ penggunaId: user.id, aksi: 'BUAT_PROGRAM', entitas: 'program', entitasId: baru.id, ringkasan: d.judul, ipAddress: ip }, tx)
    return baru.id
  })
  return serialisasiProgram(await muatProgram(id))
}

export async function simpanProgram(user: PenggunaLogin, id: number, mentah: unknown, ip: string | null) {
  const d = simpanProgramSchema.parse(mentah)
  const lama = await muatProgramDilihat(user, id)
  tolakBila(bolehUbahProgram(user, { unitId: lama.unitId, status: lama.status, unit: lama.unit }, lama.tahun.statusPengajuan))

  await prisma.$transaction(async (tx) => {
    await periksaRujukan(tx, lama.tahunId, lama.unitId, d)
    await Promise.all([
      tx.programAcuan.deleteMany({ where: { programId: id } }),
      tx.kegiatanJadwal.deleteMany({ where: { programId: id } }),
      tx.indikator.deleteMany({ where: { programId: id } }),
      tx.rabItem.deleteMany({ where: { programId: id } }),
      tx.sumberDana.deleteMany({ where: { programId: id } }),
    ])
    await tx.programKerja.update({ where: { id }, data: { ...skalar(d), diubahOleh: user.id, ...anakProgram(d) } })
    await catatAudit({ penggunaId: user.id, aksi: 'UBAH_PROGRAM', entitas: 'program', entitasId: id, ringkasan: d.judul, ipAddress: ip }, tx)
  })
  return serialisasiProgram(await muatProgram(id))
}

export async function ajukanProgram(user: PenggunaLogin, id: number, ip: string | null) {
  const p = await muatProgramDilihat(user, id)
  tolakBila(bolehAjukanProgram(user, { unitId: p.unitId, status: p.status, unit: p.unit }, p.tahun.statusPengajuan))

  // Kelengkapan diperiksa dari DATA TERSIMPAN, bukan dari kiriman klien.
  const masalah = periksaKelengkapan(keBentukSimpan(p))
  if (masalah.length > 0) throw new AppError(400, 'Program belum lengkap untuk diajukan.', { masalah })

  await prisma.$transaction(async (tx) => {
    await tx.programKerja.update({ where: { id }, data: { status: 'DIAJUKAN', diajukanPada: new Date(), diajukanOleh: user.id, diubahOleh: user.id } })
    await catatAudit({ penggunaId: user.id, aksi: 'AJUKAN_PROGRAM', entitas: 'program', entitasId: id, ringkasan: p.judul, ipAddress: ip }, tx)
  })
  return serialisasiProgram(await muatProgram(id))
}

export async function tarikProgram(user: PenggunaLogin, id: number, ip: string | null) {
  const p = await muatProgramDilihat(user, id)
  tolakBila(bolehTarikProgram(user, { unitId: p.unitId, status: p.status, unit: p.unit }, p.tahun.statusPengajuan))
  await prisma.$transaction(async (tx) => {
    await tx.programKerja.update({ where: { id }, data: { status: 'DRAFT', diajukanPada: null, diajukanOleh: null, diubahOleh: user.id } })
    await catatAudit({ penggunaId: user.id, aksi: 'TARIK_PROGRAM', entitas: 'program', entitasId: id, ringkasan: p.judul, ipAddress: ip }, tx)
  })
  return serialisasiProgram(await muatProgram(id))
}

export async function hapusProgram(user: PenggunaLogin, id: number, ip: string | null) {
  const p = await muatProgramDilihat(user, id)
  tolakBila(bolehHapusProgram(user, { unitId: p.unitId, status: p.status, unit: p.unit }, p.tahun.statusPengajuan))
  await prisma.$transaction(async (tx) => {
    await tx.programKerja.delete({ where: { id } })
    await catatAudit({ penggunaId: user.id, aksi: 'HAPUS_PROGRAM', entitas: 'program', entitasId: id, ringkasan: p.judul, ipAddress: ip }, tx)
  })
}
