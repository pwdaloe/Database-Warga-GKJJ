import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { JwtPayload } from '../middleware/auth.js'

export interface KeluargaFilter {
  search?: string
  kelompokId?: number
  wilayahId?: number
  status?: string
  dataStatus?: string
  page?: number
  limit?: number
}

const keluargaInclude = {
  kelompok: { include: { wilayah: true } },
  kepalaKeluarga: {
    select: { id: true, namaLengkap: true, nomorAnggota: true },
  },
  wargas: {
    orderBy: [
      { statusKeluarga: 'asc' as const },
      { namaLengkap: 'asc' as const },
    ],
    select: {
      id: true,
      namaLengkap: true,
      namaPanggilan: true,
      jenisKelamin: true,
      tanggalLahir: true,
      statusKeluarga: true,
      statusKeanggotaan: true,
      telepon: true,
      whatsapp: true,
      fotoUrl: true,
    },
  },
} satisfies Prisma.KeluargaInclude

export async function listKeluarga(filter: KeluargaFilter, user: JwtPayload) {
  const { page = 1, limit = 20, search, kelompokId, wilayahId, status, dataStatus } = filter

  const where: Prisma.KeluargaWhereInput = {}

  // Penatua kelompok hanya lihat kelompoknya
  if (user.role === 'PENATUA_KELOMPOK' && user.kelompokId) {
    where.kelompokId = user.kelompokId
  } else {
    if (kelompokId) where.kelompokId = kelompokId
    if (wilayahId) where.kelompok = { wilayahId }
  }

  if (status) where.status = status as any
  if (dataStatus) where.dataStatus = dataStatus as any

  if (search) {
    where.OR = [
      { nomorKeluarga: { contains: search, mode: 'insensitive' } },
      { alamat: { contains: search, mode: 'insensitive' } },
      { kelurahan: { contains: search, mode: 'insensitive' } },
      { wargas: { some: { namaLengkap: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const [total, data] = await Promise.all([
    prisma.keluarga.count({ where }),
    prisma.keluarga.findMany({
      where,
      include: keluargaInclude,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return { data, total, page, limit }
}

export async function getKeluargaById(id: number, user: JwtPayload) {
  const keluarga = await prisma.keluarga.findUnique({
    where: { id },
    include: keluargaInclude,
  })

  if (!keluarga) throw new AppError(404, 'Data keluarga tidak ditemukan')

  if (
    user.role === 'PENATUA_KELOMPOK' &&
    user.kelompokId &&
    keluarga.kelompokId !== user.kelompokId
  ) {
    throw new AppError(403, 'Tidak memiliki akses ke data keluarga ini')
  }

  return keluarga
}

export interface KeluargaBody {
  kelompokId?: number | null
  kepalakeluargaId?: number | null
  alamat?: string | null
  rt?: string | null
  rw?: string | null
  kelurahan?: string | null
  kecamatan?: string | null
  kota?: string | null
  kodePos?: string | null
  teleponRumah?: string | null
  status?: 'AKTIF' | 'NON_AKTIF'
  catatan?: string | null
}

export async function createKeluarga(body: KeluargaBody, userId: number) {
  const count = await prisma.keluarga.count()
  const nomorKeluarga = `KLG${String(count + 1).padStart(5, '0')}`

  return prisma.keluarga.create({
    data: {
      ...body,
      nomorKeluarga,
      createdBy: userId,
      updatedBy: userId,
    } as Prisma.KeluargaUncheckedCreateInput,
    include: keluargaInclude,
  })
}

export async function updateKeluarga(id: number, body: KeluargaBody, userId: number) {
  await prisma.keluarga.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError(404, 'Data keluarga tidak ditemukan')
  })

  return prisma.keluarga.update({
    where: { id },
    data: { ...body, updatedBy: userId } as Prisma.KeluargaUncheckedUpdateInput,
    include: keluargaInclude,
  })
}

export async function deleteKeluarga(id: number) {
  const keluarga = await prisma.keluarga.findUnique({
    where: { id },
    include: { wargas: { select: { id: true } } },
  })
  if (!keluarga) throw new AppError(404, 'Data keluarga tidak ditemukan')
  if (keluarga.wargas.length > 0) {
    throw new AppError(
      400,
      `Keluarga masih memiliki ${keluarga.wargas.length} anggota. Hapus atau pindahkan anggota terlebih dahulu.`,
    )
  }
  await prisma.keluarga.delete({ where: { id } })
}

export async function approveKeluarga(id: number, userId: number) {
  const keluarga = await prisma.keluarga.findUnique({ where: { id } })
  if (!keluarga) throw new AppError(404, 'Data keluarga tidak ditemukan')
  if (keluarga.dataStatus !== 'PENDING') {
    throw new AppError(400, 'Hanya data berstatus PENDING yang dapat di-approve')
  }
  return prisma.keluarga.update({
    where: { id },
    data: { dataStatus: 'APPROVED', updatedBy: userId },
    include: keluargaInclude,
  })
}
