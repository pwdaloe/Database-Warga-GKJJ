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
      kepalaKeluarga: {
        select: { id: true, namaLengkap: true, nomorAnggota: true },
      },
    },
  },
} satisfies Prisma.WargaInclude

const wargaDetailInclude = {
  keluarga: {
    include: {
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
          sudahBaptis: true,
          sudahSidi: true,
          telepon: true,
          whatsapp: true,
          fotoUrl: true,
          nomorAnggota: true,
        },
      },
    },
  },
  perpindahans: { orderBy: { createdAt: 'desc' as const } },
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
    include: wargaDetailInclude,
  })

  if (!warga) throw new AppError(404, 'Data warga tidak ditemukan')

  if (user.role === 'PENATUA_KELOMPOK' && user.kelompokId) {
    if (warga.keluarga?.kelompokId !== user.kelompokId) {
      throw new AppError(403, 'Tidak memiliki akses ke data warga ini')
    }
  }

  return warga
}

export interface NewKeluargaInput {
  kelompokId: number
  alamat?: string | null
  rt?: string | null
  rw?: string | null
  kelurahan?: string | null
  kecamatan?: string | null
  kota?: string | null
  kodePos?: string | null
  teleponRumah?: string | null
}

export async function createWarga(
  data: Prisma.WargaUncheckedCreateInput,
  userId: number,
  newKeluarga?: NewKeluargaInput,
) {
  return prisma.$transaction(async (tx) => {
    let keluargaId = data.keluargaId as number | null | undefined

    // Jika Kepala Keluarga tanpa KK yang ada → buat KK baru
    if (data.statusKeluarga === 'KEPALA' && !keluargaId && newKeluarga) {
      // Buat dulu tanpa nomorKeluarga → pakai ID sebagai nomor (tidak ada race condition)
      const keluarga = await tx.keluarga.create({
        data: {
          ...newKeluarga,
          createdBy: userId,
          updatedBy: userId,
        } as Prisma.KeluargaUncheckedCreateInput,
      })
      const nomorKeluarga = `KLG${String(keluarga.id).padStart(5, '0')}`
      await tx.keluarga.update({ where: { id: keluarga.id }, data: { nomorKeluarga } })
      keluargaId = keluarga.id
    }

    // Buat warga terlebih dahulu, nomorAnggota diisi berdasarkan ID setelah insert
    const warga = await tx.warga.create({
      data: {
        ...data,
        keluargaId,
        nomorAnggota: undefined,   // akan diisi di bawah
        createdBy: userId,
        updatedBy: userId,
      },
      include: wargaInclude,
    })

    // Auto-generate nomorAnggota berbasis ID (dijamin unik)
    if (!data.nomorAnggota) {
      const nomorAnggota = `WRG${String(warga.id).padStart(5, '0')}`
      await tx.warga.update({ where: { id: warga.id }, data: { nomorAnggota } })
      warga.nomorAnggota = nomorAnggota
    }

    // Tandai sebagai kepala keluarga di tabel Keluarga
    if (data.statusKeluarga === 'KEPALA' && keluargaId) {
      await tx.keluarga.update({
        where: { id: keluargaId },
        data: { kepalakeluargaId: warga.id },
      })
    }

    return warga
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
