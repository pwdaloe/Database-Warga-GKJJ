import bcrypt from 'bcryptjs'
import type { PeranPengguna } from '../generated/prisma/client.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import type { PenggunaLogin } from '../middleware/auth.js'
import { generatePassword } from '../utils/password.js'
import { waLink } from '../utils/waNumber.js'
import { catatAudit } from './audit.service.js'

const PERAN_ISTIMEWA: readonly PeranPengguna[] = ['ADMIN', 'SEKRETARIAT']

const tampil = {
  id: true, username: true, nama: true, email: true, whatsapp: true, peran: true, unitId: true, bidangId: true, pengurusId: true,
  aktif: true, wajibGantiPassword: true, lastLogin: true, isContoh: true,
  unit: { select: { id: true, nama: true, singkatan: true } },
  pengurus: { select: { id: true, jabatan: true } },
} as const

/** Hanya ADMIN yang boleh mengelola akun ADMIN/SEKRETARIAT; SEKRETARIAT mengelola akun lain. */
function pastikanBolehKelolaPeran(pelaku: PenggunaLogin, peran: PeranPengguna): void {
  if (PERAN_ISTIMEWA.includes(peran) && pelaku.peran !== 'ADMIN') {
    throw new AppError(403, 'Hanya admin yang boleh mengelola akun admin atau sekretariat.')
  }
}

function pesanAkun(nama: string, username: string, password: string, tautan: string): string {
  return (
    `Shalom ${nama}, akun Anda di aplikasi Kegiatan GKJ Jakarta sudah dibuat.\n\n` +
    `Alamat: ${tautan}\nUsername: ${username}\nPassword sementara: ${password}\n\n` +
    'Anda akan diminta mengganti password saat masuk pertama kali. Jangan bagikan password ini kepada siapa pun.'
  )
}

export async function daftarPengguna() {
  return prisma.pengguna.findMany({ select: tampil, orderBy: [{ peran: 'asc' }, { username: 'asc' }] })
}

export interface MasukanAkun {
  username: string
  peran: PeranPengguna
  pengurusId?: number | undefined
  unitId?: number | undefined
  bidangId?: number | undefined
  nama?: string | undefined
  email?: string | null | undefined
  whatsapp?: string | null | undefined
}

export async function buatAkun(pelaku: PenggunaLogin, d: MasukanAkun, ip: string | null) {
  pastikanBolehKelolaPeran(pelaku, d.peran)

  let { nama, email, whatsapp, unitId, bidangId } = d
  const pengurusId = d.pengurusId

  if (d.peran === 'PENGURUS_UPK') {
    if (!pengurusId) throw new AppError(400, 'Akun pengurus UPK harus dikaitkan ke posisi pengurus (Ketua/Sekretaris/Bendahara).')
    const pg = await prisma.pengurus.findUnique({ where: { id: pengurusId }, include: { pengguna: { select: { id: true } } } })
    if (!pg) throw new AppError(404, 'Posisi pengurus tidak ditemukan')
    if (pg.pengguna) throw new AppError(409, 'Posisi pengurus ini sudah memiliki akun.')
    unitId = pg.unitId
    bidangId = undefined
    nama = nama ?? pg.nama
    email = email ?? pg.email
    whatsapp = whatsapp ?? pg.whatsapp
  } else if (d.peran === 'KOORDINATOR_BIDANG') {
    if (!bidangId) throw new AppError(400, 'Akun koordinator bidang harus memilih bidang.')
    unitId = undefined
  } else {
    unitId = undefined
    bidangId = undefined
  }
  if (!nama) throw new AppError(400, 'Nama wajib diisi.')

  const password = generatePassword(10)
  const baru = await prisma.$transaction(async (tx) => {
    const p = await tx.pengguna.create({
      data: {
        username: d.username.toLowerCase(), nama, email: email ?? null, whatsapp: whatsapp ?? null, peran: d.peran,
        unitId: unitId ?? null, bidangId: bidangId ?? null,
        pengurusId: d.peran === 'PENGURUS_UPK' ? (pengurusId ?? null) : null,
        passwordHash: await bcrypt.hash(password, 10), wajibGantiPassword: true,
      },
      select: tampil,
    })
    await catatAudit({ penggunaId: pelaku.id, aksi: 'BUAT_AKUN', entitas: 'pengguna', entitasId: p.id, ringkasan: `${p.username} (${p.peran})`, ipAddress: ip }, tx)
    return p
  })
  return { pengguna: baru, ...kredensial(baru.nama, baru.username, baru.whatsapp, password) }
}

function kredensial(nama: string, username: string, whatsapp: string | null, password: string) {
  const tautan = process.env['APP_URL'] ?? 'https://kegiatan.gkjjakarta.org'
  return {
    // Password sementara hanya ditampilkan SEKALI di respons ini; tidak disimpan dan tidak masuk log.
    passwordSementara: password,
    pesanWhatsapp: pesanAkun(nama, username, password, tautan),
    waLink: waLink(whatsapp, pesanAkun(nama, username, password, tautan)),
  }
}

export async function resetPassword(pelaku: PenggunaLogin, id: number, ip: string | null) {
  const target = await prisma.pengguna.findUnique({ where: { id }, select: tampil })
  if (!target) throw new AppError(404, 'Akun tidak ditemukan')
  pastikanBolehKelolaPeran(pelaku, target.peran)
  const password = generatePassword(10)
  await prisma.pengguna.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10), wajibGantiPassword: true } })
  await catatAudit({ penggunaId: pelaku.id, aksi: 'RESET_PASSWORD', entitas: 'pengguna', entitasId: id, ringkasan: target.username, ipAddress: ip })
  return kredensial(target.nama, target.username, target.whatsapp, password)
}

export async function ubahAkun(pelaku: PenggunaLogin, id: number, d: { aktif?: boolean | undefined; nama?: string | undefined; email?: string | null | undefined; whatsapp?: string | null | undefined }, ip: string | null) {
  const target = await prisma.pengguna.findUnique({ where: { id }, select: { peran: true, username: true } })
  if (!target) throw new AppError(404, 'Akun tidak ditemukan')
  pastikanBolehKelolaPeran(pelaku, target.peran)
  if (id === pelaku.id && d.aktif === false) throw new AppError(400, 'Anda tidak dapat menonaktifkan akun Anda sendiri.')
  const p = await prisma.pengguna.update({
    where: { id },
    data: {
      ...(d.aktif !== undefined ? { aktif: d.aktif } : {}),
      ...(d.nama !== undefined ? { nama: d.nama } : {}),
      ...(d.email !== undefined ? { email: d.email } : {}),
      ...(d.whatsapp !== undefined ? { whatsapp: d.whatsapp } : {}),
    },
    select: tampil,
  })
  await catatAudit({ penggunaId: pelaku.id, aksi: 'UBAH_AKUN', entitas: 'pengguna', entitasId: id, ringkasan: target.username, ipAddress: ip })
  return p
}
