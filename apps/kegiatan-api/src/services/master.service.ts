import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { PenggunaLogin } from '../middleware/auth.js'
import { bolehKelola, cakupanDari } from '../domain/akses.js'
import { CHECKLIST_AJUKAN } from '../constants/checklist.js'
import { ambilDukungan } from './pengaturan.service.js'
import { KATEGORI_WAKTU, JENIS_SUMBER_DANA, JENIS_PROGRAM } from '../domain/validasiProgram.js'

/** Seluruh master yang dibutuhkan formulir dan layar admin. Pagu dan pengurus hanya untuk yang berhak. */
export async function ambilMaster(user: PenggunaLogin, tahunId?: number) {
  const tahunList = await prisma.tahunAnggaran.findMany({ orderBy: { tahun: 'desc' } })
  const tahun = tahunId ? tahunList.find((t) => t.id === tahunId) : (tahunList.find((t) => t.aktif) ?? tahunList[0])
  if (!tahun) throw new AppError(404, 'Tahun anggaran belum dibuat')

  const cak = cakupanDari(user)
  const kelola = bolehKelola(user)

  const [bidang, units, satuan, kategoriBiaya, acuan, pagu, program2026] = await Promise.all([
    prisma.bidang.findMany({ orderBy: { urutan: 'asc' } }),
    prisma.unit.findMany({
      orderBy: [{ urutan: 'asc' }, { nama: 'asc' }],
      include: kelola ? { pengurus: { orderBy: { jabatan: 'asc' } } } : undefined,
    }),
    prisma.satuan.findMany({ where: kelola ? {} : { aktif: true }, orderBy: [{ urutan: 'asc' }, { nama: 'asc' }] }),
    prisma.kategoriBiaya.findMany({ where: kelola ? {} : { aktif: true }, orderBy: [{ urutan: 'asc' }, { nama: 'asc' }] }),
    prisma.acuanStrategis.findMany({ where: { tahunId: tahun.id, ...(kelola ? {} : { aktif: true }) }, orderBy: [{ jenis: 'asc' }, { urutan: 'asc' }] }),
    prisma.paguUnit.findMany({ where: { tahunId: tahun.id } }),
    prisma.program2026.findMany({
      where: cak.jenis === 'unit' ? { unitId: cak.unitId } : cak.jenis === 'bidang' ? { unit: { bidangId: cak.bidangId } } : cak.jenis === 'semua' ? {} : { id: -1 },
      orderBy: [{ unitId: 'asc' }, { id: 'asc' }],
    }),
  ])

  const dukungan = await ambilDukungan()
  const paguMap = new Map(pagu.map((p) => [p.unitId, Number(p.nilai)]))
  const bolehLihatPagu = (unitId: number): boolean =>
    cak.jenis === 'semua' || (cak.jenis === 'unit' && cak.unitId === unitId) || (cak.jenis === 'bidang' && units.find((u) => u.id === unitId)?.bidangId === cak.bidangId)

  return {
    tahun,
    tahunList,
    dukungan,
    bidang,
    unit: units.map((u) => ({ ...u, pagu: bolehLihatPagu(u.id) ? (paguMap.get(u.id) ?? 0) : null })),
    satuan,
    kategoriBiaya,
    acuan,
    program2026,
    checklist: CHECKLIST_AJUKAN,
    enum: { kategoriWaktu: KATEGORI_WAKTU, sumberDana: JENIS_SUMBER_DANA, jenisProgram: JENIS_PROGRAM },
  }
}
