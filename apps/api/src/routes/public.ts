import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { ok } from '../utils/response.js'

export const publicRouter = Router()

// GET /api/public/member/:id — info terbatas, tanpa autentikasi
// Dipakai oleh halaman publik /m/[id] saat QR kartu anggota di-scan
publicRouter.get('/member/:id', async (req, res) => {
  const id = Number(req.params['id'])
  if (isNaN(id)) { res.status(400).json({ success: false, error: 'ID tidak valid' }); return }

  const warga = await prisma.warga.findUnique({
    where: { id },
    select: {
      id: true,
      nomorAnggota: true,
      nomorInduk: true,
      namaLengkap: true,
      namaPanggilan: true,
      jenisKelamin: true,
      fotoUrl: true,
      statusKeanggotaan: true,
      statusKeluarga: true,
      sudahBaptis: true,
      sudahSidi: true,
      dataStatus: true,
      keluarga: {
        select: {
          kelompok: {
            select: {
              nama: true,
              kode: true,
              penatua_nama_temp: true,
              wilayah: { select: { nama: true } },
            },
          },
        },
      },
    },
  })

  if (!warga) { res.status(404).json({ success: false, error: 'Anggota tidak ditemukan' }); return }

  ok(res, warga)
})
