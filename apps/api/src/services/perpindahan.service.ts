import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'

const PERPINDAHAN_INCLUDE = {
  warga: { select: { id: true, namaLengkap: true, namaPanggilan: true, email: true, whatsapp: true, telepon: true, statusKeanggotaan: true, nomorAnggota: true, nomorInduk: true } },
  approvedByUser: { select: { id: true, nama: true, role: true } },
  validatedByUser: { select: { id: true, nama: true, role: true } },
} satisfies Prisma.PerpindahanInclude

export type PerpindahanWithRelations = Prisma.PerpindahanGetPayload<{ include: typeof PERPINDAHAN_INCLUDE }>

const STATUS_KEANGGOTAAN_MAP: Record<string, 'AKTIF' | 'PINDAH_KELUAR' | 'MENINGGAL'> = {
  MASUK: 'AKTIF',
  KELUAR: 'PINDAH_KELUAR',
  MENINGGAL: 'MENINGGAL',
}

export interface PerpindahanFilter {
  page?: number
  limit?: number
  jenis?: string
  search?: string
}

export async function listPerpindahan(filter: PerpindahanFilter) {
  const { page = 1, limit = 20, jenis, search } = filter

  const where: Prisma.PerpindahanWhereInput = {}
  if (jenis) where.jenis = jenis as any
  if (search) where.warga = { namaLengkap: { contains: search, mode: 'insensitive' } }

  const [total, data] = await Promise.all([
    prisma.perpindahan.count({ where }),
    prisma.perpindahan.findMany({
      where,
      include: PERPINDAHAN_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return { data, total, page, limit }
}

export async function getPerpindahanById(id: number) {
  const perpindahan = await prisma.perpindahan.findUnique({
    where: { id },
    include: PERPINDAHAN_INCLUDE,
  })
  if (!perpindahan) throw new AppError(404, 'Data perpindahan tidak ditemukan')
  return perpindahan
}

export interface CreatePerpindahanInput {
  wargaId: number
  jenis: string
  gerejaAsalTujuan?: string | null
  tanggalPerpindahan?: string | null
  nomorSurat?: string | null
  keterangan?: string | null
}

export async function createPerpindahan(data: CreatePerpindahanInput) {
  const warga = await prisma.warga.findUnique({ where: { id: data.wargaId } })
  if (!warga) throw new AppError(404, 'Warga tidak ditemukan')

  return prisma.perpindahan.create({
    data: data as Prisma.PerpindahanUncheckedCreateInput,
    include: PERPINDAHAN_INCLUDE,
  })
}

export async function updatePerpindahan(id: number, data: Partial<CreatePerpindahanInput>) {
  const existing = await getPerpindahanById(id)
  if (existing.approvedBy) throw new AppError(400, 'Perpindahan yang sudah di-approve tidak bisa diubah')

  return prisma.perpindahan.update({
    where: { id },
    data: data as Prisma.PerpindahanUncheckedUpdateInput,
    include: PERPINDAHAN_INCLUDE,
  })
}

export async function approvePerpindahan(id: number, userId: number) {
  const existing = await getPerpindahanById(id)
  if (existing.approvedBy) throw new AppError(400, 'Perpindahan ini sudah di-approve sebelumnya')

  return prisma.perpindahan.update({
    where: { id },
    data: { approvedBy: userId, approvedAt: new Date() },
    include: PERPINDAHAN_INCLUDE,
  })
}

export async function validatePerpindahan(id: number, userId: number) {
  const existing = await getPerpindahanById(id)
  if (!existing.approvedBy) throw new AppError(400, 'Perpindahan harus di-approve terlebih dahulu sebelum divalidasi')
  if (existing.validatedBy) throw new AppError(400, 'Perpindahan ini sudah divalidasi sebelumnya')

  const statusKeanggotaan = STATUS_KEANGGOTAAN_MAP[existing.jenis]

  const [, perpindahan] = await prisma.$transaction([
    prisma.warga.update({
      where: { id: existing.wargaId },
      data: { statusKeanggotaan },
    }),
    prisma.perpindahan.update({
      where: { id },
      data: { validatedBy: userId, validatedAt: new Date() },
      include: PERPINDAHAN_INCLUDE,
    }),
  ])

  return perpindahan
}

export async function deletePerpindahan(id: number) {
  const existing = await getPerpindahanById(id)
  if (existing.approvedBy) throw new AppError(400, 'Perpindahan yang sudah di-approve tidak bisa dihapus')

  await prisma.perpindahan.delete({ where: { id } })
}
