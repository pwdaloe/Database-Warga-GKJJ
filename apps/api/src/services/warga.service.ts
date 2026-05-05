import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { JwtPayload } from '../middleware/auth.js'

export interface WargaFilter {
  search?: string
  kelompokId?: number
  wilayahId?: number
  statusKeanggotaan?: string
  jenisKelamin?: string
  dataStatus?: string
  sudahSidi?: boolean
  sudahBaptis?: boolean
  page?: number
  limit?: number
}

const wargaInclude = {
  keluarga: {
    include: {
      kelompok: { include: { wilayah: true } },
    },
  },
} satisfies Prisma.WargaInclude

export async function listWarga(filter: WargaFilter, user: JwtPayload) {
  const {
    page = 1,
    limit = 20,
    search,
    kelompokId,
    wilayahId,
    statusKeanggotaan,
    jenisKelamin,
    dataStatus,
    sudahSidi,
    sudahBaptis,
  } = filter

  const where: Prisma.WargaWhereInput = {}

  // Scope penatua kelompok
  if (user.role === 'PENATUA_KELOMPOK' && user.kelompokId) {
    where.keluarga = { kelompokId: user.kelompokId }
  } else {
    if (kelompokId) where.keluarga = { kelompokId }
    else if (wilayahId) where.keluarga = { kelompok: { wilayahId } }
  }

  if (statusKeanggotaan) where.statusKeanggotaan = statusKeanggotaan as any
  if (jenisKelamin) where.jenisKelamin = jenisKelamin as any
  if (dataStatus) where.dataStatus = dataStatus as any
  if (sudahSidi !== undefined) where.sudahSidi = sudahSidi
  if (sudahBaptis !== undefined) where.sudahBaptis = sudahBaptis

  if (search) {
    where.OR = [
      { namaLengkap: { contains: search, mode: 'insensitive' } },
      { namaPanggilan: { contains: search, mode: 'insensitive' } },
      { nomorInduk: { contains: search, mode: 'insensitive' } },
      { nomorAnggota: { contains: search, mode: 'insensitive' } },
      { nik: { contains: search, mode: 'insensitive' } },
      { telepon: { contains: search, mode: 'insensitive' } },
      { whatsapp: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, data] = await Promise.all([
    prisma.warga.count({ where }),
    prisma.warga.findMany({
      where,
      include: wargaInclude,
      orderBy: { namaLengkap: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return { data, total, page, limit }
}

export async function getWargaById(id: number, user: JwtPayload) {
  const warga = await prisma.warga.findUnique({
    where: { id },
    include: {
      ...wargaInclude,
      perpindahans: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!warga) throw new AppError(404, 'Data warga tidak ditemukan')

  if (user.role === 'PENATUA_KELOMPOK' && user.kelompokId) {
    if (warga.keluarga?.kelompokId !== user.kelompokId) {
      throw new AppError(403, 'Tidak memiliki akses ke data warga ini')
    }
  }

  return warga
}

export async function createWarga(
  data: Prisma.WargaUncheckedCreateInput,
  userId: number,
) {
  // Auto-generate nomor anggota
  if (!data.nomorAnggota) {
    const count = await prisma.warga.count()
    data.nomorAnggota = `WRG${String(count + 1).padStart(5, '0')}`
  }

  return prisma.warga.create({
    data: { ...data, createdBy: userId, updatedBy: userId },
    include: wargaInclude,
  })
}

export async function updateWarga(
  id: number,
  data: Prisma.WargaUncheckedUpdateInput,
  userId: number,
  user: JwtPayload,
) {
  await getWargaById(id, user)

  return prisma.warga.update({
    where: { id },
    data: { ...data, updatedBy: userId },
    include: wargaInclude,
  })
}

export async function deleteWarga(id: number) {
  const warga = await prisma.warga.findUnique({ where: { id } })
  if (!warga) throw new AppError(404, 'Data warga tidak ditemukan')

  const hasUser = await prisma.user.findUnique({ where: { wargaId: id } })
  if (hasUser) throw new AppError(400, 'Warga ini memiliki akun user. Nonaktifkan akun terlebih dahulu.')

  await prisma.warga.delete({ where: { id } })
}

export async function getWargaUlangTahunBulanIni() {
  const bulan = new Date().getMonth() + 1
  return prisma.warga.findMany({
    where: {
      statusKeanggotaan: 'AKTIF',
      tanggalLahir: { not: null },
      AND: [
        { tanggalLahir: { gte: new Date(`2000-${String(bulan).padStart(2, '0')}-01`) } },
        { tanggalLahir: { lt: new Date(`2000-${String(bulan + 1).padStart(2, '0')}-01`) } },
      ],
    },
    select: {
      id: true,
      namaLengkap: true,
      tanggalLahir: true,
      telepon: true,
      whatsapp: true,
      keluarga: { include: { kelompok: true } },
    },
    orderBy: { tanggalLahir: 'asc' },
  })
}
