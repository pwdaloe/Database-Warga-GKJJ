import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'
import { waLink } from '../utils/waNumber.js'

/**
 * Menu "Hubungi" — untuk semua role. Hanya mengembalikan nama + tautan wa.me
 * (bukan record warga/pengguna) dan hanya kontak yang aktif / diizinkan tampil.
 */
export const hubungiRouter = Router()
hubungiRouter.use(authenticate)

const TEKS_AWAL = 'Shalom, saya'

function kontak(k: { nama: string; whatsapp: string; keterangan: string | null; jenis?: string }, teks?: string) {
  return { nama: k.nama, keterangan: k.keterangan, link: waLink(k.whatsapp, teks) }
}

// GET /api/hubungi
hubungiRouter.get('/', async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      nama: true,
      kelompokId: true,
      warga: { select: { keluarga: { select: { kelompokId: true } } } },
    },
  })
  const teks = me ? `${TEKS_AWAL} ${me.nama}.` : undefined

  const aktif = await prisma.kontakGereja.findMany({
    where: { aktif: true },
    orderBy: [{ urutan: 'asc' }, { nama: 'asc' }],
  })
  const by = (jenis: string) => aktif.filter((k) => k.jenis === jenis)

  // Majelis kelompok: dari kelompok pengguna, atau kelompok keluarga warga yang tertaut
  const kelompokId = me?.kelompokId ?? me?.warga?.keluarga?.kelompokId ?? null
  let majelis: { nama: string; keterangan: string | null; link: string } | null = null
  if (kelompokId) {
    const kelompok = await prisma.kelompok.findUnique({
      where: { id: kelompokId },
      select: {
        nama: true,
        penatua: { select: { namaLengkap: true, whatsapp: true, whatsappBolehDitampilkan: true } },
      },
    })
    const p = kelompok?.penatua
    const link = p?.whatsappBolehDitampilkan ? waLink(p.whatsapp, teks) : null
    if (p && link) majelis = { nama: p.namaLengkap, keterangan: kelompok!.nama, link }
  }

  const valid = <T extends { link: string | null }>(l: T[]) => l.filter((x) => x.link)

  ok(res, {
    waCenter: valid(by('WA_CENTER').map((k) => kontak(k, teks))),
    majelis,
    kepalaKantor: valid(by('KEPALA_KANTOR').map((k) => kontak(k, teks))),
    pendeta: valid(
      aktif.filter((k) => k.jenis === 'PENDETA' || k.jenis === 'PENDETA_EMERITUS')
        .map((k) => ({ ...kontak(k, teks), emeritus: k.jenis === 'PENDETA_EMERITUS' })),
    ),
  })
})
