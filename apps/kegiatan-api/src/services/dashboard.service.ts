import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { PenggunaLogin } from '../middleware/auth.js'
import { cakupanDari } from '../domain/akses.js'
import { susunDashboard, type MasukanProgram } from '../domain/dashboard.js'

export async function dashboardPagu(user: PenggunaLogin, tahunId?: number) {
  const tahun = tahunId
    ? await prisma.tahunAnggaran.findUnique({ where: { id: tahunId } })
    : await prisma.tahunAnggaran.findFirst({ where: { aktif: true }, orderBy: { tahun: 'desc' } })
  if (!tahun) throw new AppError(404, 'Tahun anggaran tidak ditemukan')

  const cak = cakupanDari(user)
  const whereUnit =
    cak.jenis === 'semua' ? { aktif: true }
    : cak.jenis === 'unit' ? { aktif: true, id: cak.unitId }
    : cak.jenis === 'bidang' ? { aktif: true, bidangId: cak.bidangId }
    : { id: -1 }

  const [units, bidang, pagu, programs, acuan] = await Promise.all([
    prisma.unit.findMany({ where: whereUnit, select: { id: true, kode: true, nama: true, singkatan: true, jenis: true, bidangId: true, urutan: true } }),
    prisma.bidang.findMany({ select: { id: true, kode: true, nama: true, urutan: true } }),
    prisma.paguUnit.findMany({ where: { tahunId: tahun.id } }),
    prisma.programKerja.findMany({
      where: { tahunId: tahun.id, unit: whereUnit },
      select: { id: true, unitId: true, status: true, rab: { select: { jumlah: true } }, sumberDana: { select: { jenis: true, nilai: true } }, acuan: { select: { acuanId: true } } },
    }),
    prisma.acuanStrategis.findMany({ where: { tahunId: tahun.id, aktif: true }, orderBy: [{ jenis: 'asc' }, { urutan: 'asc' }], select: { id: true, kode: true, nama: true, jenis: true } }),
  ])

  const masukanProgram: MasukanProgram[] = programs.map((p) => {
    const per = { GEREJA: 0, SWADAYA: 0, PENGGALANGAN: 0, DONASI: 0 }
    for (const s of p.sumberDana) per[s.jenis] += Number(s.nilai)
    return {
      id: p.id, unitId: p.unitId, status: p.status,
      totalRab: p.rab.reduce((n, r) => n + Number(r.jumlah), 0),
      gereja: per.GEREJA, swadaya: per.SWADAYA, penggalangan: per.PENGGALANGAN, donasi: per.DONASI,
      acuanIds: p.acuan.map((a) => a.acuanId),
    }
  })

  const hasil = susunDashboard({
    units: units as Array<(typeof units)[number] & { jenis: 'UPK' | 'POS' }>,
    bidang,
    pagu: new Map(pagu.map((p) => [p.unitId, Number(p.nilai)])),
    programs: masukanProgram,
    acuan,
  })

  // Bidang tanpa unit dalam cakupan tidak ditampilkan bagi pengurus/koordinator.
  const bidangTampil = cak.jenis === 'semua' ? hasil.bidang : hasil.bidang.filter((b) => b.jumlahUnit > 0)
  return { tahun: { id: tahun.id, tahun: tahun.tahun, nama: tahun.nama, statusPengajuan: tahun.statusPengajuan }, ...hasil, bidang: bidangTampil }
}
