# Sprint 4 — Perpindahan Jemaat: Backend (CRUD, Approval, Surat PDF, Email)

## Konteks

Model `Perpindahan` **sudah ada** di `apps/api/prisma/schema.prisma` (migration sudah applied,
lihat `warga.service.ts` baris `perpindahans: { orderBy: { createdAt: 'desc' as const } }` di
`WARGA_INCLUDE`). Enum `JenisPerpindahan` punya 3 nilai: `MASUK`, `KELUAR`, `MENINGGAL`. Field
`approvedBy`/`validatedBy` merujuk ke `Warga` (bukan `User`) — pola ini sudah dipakai untuk
`validatedBy` di model `Warga` sendiri (lihat `warga.service.ts` baris ~314), jadi ikuti pola yang
sama.

Sidebar frontend **sudah** punya link ke `/perpindahan` (lihat
`apps/web/src/components/layout/Sidebar.tsx`, grup "Utilitas") untuk role `SUPERADMIN`,
`KEPALA_KANTOR`, `MAJELIS`, `STAF_ADMIN` — tapi route API dan halamannya belum ada. Sprint ini
membangun API-nya; Sprint 5 membangun halamannya.

Ini fitur pencatatan status keanggotaan jemaat (bukan pindah alamat/domisili):
- `MASUK` — jemaat pindah masuk dari gereja lain (surat keterangan pindah dari gereja asal)
- `KELUAR` — jemaat pindah keluar ke gereja lain (perlu diterbitkan surat keterangan pindah)
- `MENINGGAL` — jemaat meninggal dunia (surat keterangan meninggal untuk keperluan administrasi)

**Keputusan desain — baca sebelum implementasi:**

1. **Role**: `STAF_ADMIN` (dan di atasnya: `MAJELIS`, `KEPALA_KANTOR`, `SUPERADMIN`) boleh mencatat
   pengajuan perpindahan. Hanya `MAJELIS`, `KEPALA_KANTOR`, `SUPERADMIN` yang boleh approve. Hapus
   hanya untuk `KEPALA_KANTOR`/`SUPERADMIN`, dan **hanya** kalau belum di-approve (`approvedBy`
   masih null) — data yang sudah resmi/approved tidak boleh dihapus, biar jejak administratif utuh.
2. **Sinkronisasi status keanggotaan**: saat perpindahan di-approve, update
   `warga.statusKeanggotaan` otomatis dalam satu transaksi:
   - `MASUK` → `AKTIF`
   - `KELUAR` → `PINDAH_KELUAR`
   - `MENINGGAL` → `MENINGGAL`
3. **Surat PDF**: pakai `pdfkit` (ringan, pure JS, tanpa headless browser) untuk generate "Surat
   Keterangan Pindah/Meninggal Jemaat" secara server-side. Ini dipakai untuk 2 hal: (a) endpoint
   view/download PDF langsung di browser (dipakai tombol "Cetak" di Sprint 6, browser native
   print-to-PDF dari situ), dan (b) lampiran email di task 6.
4. **Activity log otomatis**: `apps/api/src/middleware/activityLogger.ts` sudah global untuk semua
   method mutasi (`POST`/`PUT`/`PATCH`/`DELETE`) — tidak perlu tambahan logging manual di route baru.

## Tasks

### 1. Tambah dependency `pdfkit`

```bash
npm install pdfkit --workspace=apps/api
npm install -D @types/pdfkit --workspace=apps/api
```

### 2. Buat Zod schema & service `perpindahan.service.ts`

Buat `apps/api/src/services/perpindahan.service.ts`. Ikuti pola `listWarga`/pagination di
`warga.service.ts` (`Promise.all([prisma.perpindahan.count(...), prisma.perpindahan.findMany(...)])`,
lalu return lewat helper `paginated()`).

Include standar untuk setiap query:

```ts
const PERPINDAHAN_INCLUDE = {
  warga: { select: { id: true, namaLengkap: true, namaPanggilan: true, email: true, whatsapp: true, telepon: true, statusKeanggotaan: true } },
  approvedByWarga: { select: { id: true, namaLengkap: true } },
  validatedByWarga: { select: { id: true, namaLengkap: true } },
} satisfies Prisma.PerpindahanInclude
```

Fungsi yang dibutuhkan:

- `listPerpindahan(filter: { page?, limit?, jenis?, search? })` — `search` mencari di
  `warga.namaLengkap` (`contains`, `insensitive`) via relasi. Sort default `createdAt desc`.
- `getPerpindahanById(id: number)` — `include: PERPINDAHAN_INCLUDE`, throw `AppError(404, 'Data perpindahan tidak ditemukan')` kalau null.
- `createPerpindahan(data, userId)` — body: `wargaId`, `jenis`, `gerejaAsalTujuan?`,
  `tanggalPerpindahan?`, `nomorSurat?`, `keterangan?`. Validasi `wargaId` ada di tabel `warga`
  (kalau tidak, `AppError(404, 'Warga tidak ditemukan')`). **Tidak** set `approvedBy`/`validatedBy`
  saat create (status awal = pending approval).
- `approvePerpindahan(id: number, approverWargaId: number)`:
  - Ambil perpindahan by id, kalau `approvedBy` sudah terisi → `AppError(400, 'Perpindahan ini sudah di-approve sebelumnya')`
  - `prisma.$transaction([...])`: update `perpindahan.approvedBy = approverWargaId`, DAN update
    `warga.statusKeanggotaan` sesuai mapping `jenis` di Keputusan Desain #2 di atas
  - Catatan: `approverWargaId` di sini adalah `Warga.id` milik user yang approve, **bukan** `User.id`
    dari JWT. Kalau user login tidak punya baris `Warga` terkait (banyak akun staf mungkin tidak
    terhubung ke data warga), izinkan `approvedBy` tetap null dan **jangan** throw — cukup jalankan
    update status keanggotaan saja. Cek relasi `User` ↔ `Warga` di schema untuk field penghubungnya
    sebelum implementasi (kemungkinan tidak ada — kalau begitu set `approvedBy: null` selalu, ini
    field opsional by design).
- `deletePerpindahan(id: number)` — kalau `approvedBy` sudah terisi → `AppError(400, 'Perpindahan yang sudah di-approve tidak bisa dihapus')`.

### 3. Buat service PDF `surat.service.ts`

Buat `apps/api/src/services/surat.service.ts`, fungsi `generateSuratPerpindahanPdf(perpindahan): Promise<Buffer>` pakai `pdfkit`:

- Kop surat: nama gereja (`GKJ Jakarta` / "Gereja Kristen Jawa Jakarta" — cek `README.md`/kop yang
  sudah dipakai di tempat lain kalau ada referensi, kalau tidak ada gunakan teks generik "Gereja
  Kristen Jawa Jakarta (GKJJ)"), alamat placeholder secukupnya
- Judul sesuai jenis: "SURAT KETERANGAN PINDAH KELUAR JEMAAT" / "SURAT KETERANGAN PINDAH MASUK
  JEMAAT" / "SURAT KETERANGAN KEMATIAN"
- Nomor surat (`nomorSurat` atau "-" kalau kosong), tanggal (`tanggalPerpindahan`, format Indonesia
  `date-fns` + locale `id` seperti dipakai di frontend, atau format manual di backend kalau
  `date-fns` belum ada di `apps/api` — cek dulu, install `date-fns` ke `apps/api` kalau belum ada)
- Isi: data warga (nama lengkap, nomor induk/anggota), jenis perpindahan, gereja asal/tujuan
  (`gerejaAsalTujuan`), keterangan tambahan
- Placeholder tanda tangan majelis di bagian bawah (nama `approvedByWarga.namaLengkap` kalau ada,
  kalau tidak tulis "_______________")
- Return sebagai `Buffer` (kumpulkan chunks dari `doc.on('data', ...)`, resolve di `doc.on('end', ...)`, panggil `doc.end()`)

### 4. Extend `email.service.ts`

Tambahkan fungsi baru (jangan ubah `sendPasswordResetEmail` yang sudah ada):

```ts
export async function sendSuratPerpindahanEmail(
  to: string,
  namaWarga: string,
  jenisLabel: string,
  pdfBuffer: Buffer,
) {
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? 'GKJJ <no-reply@gkjjakarta.org>',
    to,
    subject: `Surat ${jenisLabel} — Database Warga GKJJ`,
    text: `Halo ${namaWarga},\n\nTerlampir surat ${jenisLabel.toLowerCase()} Anda. Simpan email ini sebagai arsip.`,
    html: `<p>Halo ${namaWarga},</p><p>Terlampir surat ${jenisLabel.toLowerCase()} Anda. Simpan email ini sebagai arsip.</p>`,
    attachments: [
      { filename: `surat-${jenisLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
    ],
  })
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV EMAIL] Surat ${jenisLabel} untuk ${to} (attachment ${pdfBuffer.length} bytes, tidak benar-benar terkirim)`)
  }
  return info
}
```

Reuse `getTransporter()` yang sudah ada di file yang sama (jangan duplikasi).

### 5. Buat route `perpindahan.ts`

Buat `apps/api/src/routes/perpindahan.ts`, ikuti pola `kelompok.ts` (Zod body schema, `ok`/`created`/`paginated` helper, `authenticate` + `authorize`):

```ts
perpindahanRouter.use(authenticate)

// GET /api/perpindahan — semua role yang punya akses menu (termasuk VIEWER, read-only)
perpindahanRouter.get('/', async (req, res) => { ... paginated(...) })

// GET /api/perpindahan/:id
perpindahanRouter.get('/:id', async (req, res) => { ... ok(...) })

// POST /api/perpindahan
perpindahanRouter.post('/', authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'), async (req, res) => { ... created(...) })

// PUT /api/perpindahan/:id — edit sebelum approved (validasi approvedBy null di service atau di sini)
perpindahanRouter.put('/:id', authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'), async (req, res) => { ... ok(...) })

// POST /api/perpindahan/:id/approve
perpindahanRouter.post('/:id/approve', authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS'), async (req, res) => { ... ok(...) })

// DELETE /api/perpindahan/:id
perpindahanRouter.delete('/:id', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => { ... res.status(204).send() })

// GET /api/perpindahan/:id/surat.pdf — stream PDF, authenticate saja (semua role yang bisa lihat menu)
perpindahanRouter.get('/:id/surat.pdf', async (req, res) => {
  const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params.id))
  const pdfBuffer = await suratService.generateSuratPerpindahanPdf(perpindahan)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="surat-perpindahan-${req.params.id}.pdf"`)
  res.send(pdfBuffer)
})

// POST /api/perpindahan/:id/kirim-email
perpindahanRouter.post('/:id/kirim-email', authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'), async (req, res) => {
  const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params.id))
  if (!perpindahan.warga.email) throw new AppError(400, 'Warga ini belum memiliki alamat email terdaftar')
  const pdfBuffer = await suratService.generateSuratPerpindahanPdf(perpindahan)
  const jenisLabel = { MASUK: 'Keterangan Pindah Masuk', KELUAR: 'Keterangan Pindah Keluar', MENINGGAL: 'Keterangan Kematian' }[perpindahan.jenis]
  await emailService.sendSuratPerpindahanEmail(perpindahan.warga.email, perpindahan.warga.namaLengkap, jenisLabel, pdfBuffer)
  ok(res, { message: 'Surat berhasil dikirim ke email warga' })
})
```

Sesuaikan detail Zod schema body (`wargaId: z.number().int().positive()`, `jenis: z.enum(['MASUK','KELUAR','MENINGGAL'])`, dst) mengikuti gaya `kelompok.ts`/`keluarga.ts`.

### 6. Daftarkan router di `app.ts`

Tambahkan import dan `app.use('/api/perpindahan', perpindahanRouter)` mengikuti pola router lain di `apps/api/src/app.ts`.

### 7. Test service (mock prisma)

Buat `apps/api/tests/services/perpindahan.service.test.ts`, ikuti pola mocking di
`apps/api/tests/services/auth.service.test.ts`. Cover minimal:

- `createPerpindahan`: sukses membuat record dengan `approvedBy: null`
- `createPerpindahan`: `wargaId` tidak ditemukan → throw `AppError` 404
- `approvePerpindahan`: sukses → `warga.statusKeanggotaan` ter-update sesuai mapping jenis (test ketiga jenis: MASUK/KELUAR/MENINGGAL)
- `approvePerpindahan`: sudah pernah di-approve → throw `AppError` 400, tidak ada update kedua yang jalan
- `deletePerpindahan`: sudah approved → throw `AppError` 400

### 8. Test route (supertest, mock service seperti pola `auth.reset.route.test.ts`)

Buat `apps/api/tests/routes/perpindahan.route.test.ts`. Cover:

- `POST /api/perpindahan` tanpa role yang sesuai → 403
- `POST /api/perpindahan` body invalid (jenis bukan enum valid) → 400
- `POST /api/perpindahan/:id/kirim-email` dengan `warga.email` null → 400 dengan pesan yang jelas

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run test --workspace=apps/api
npm run build --workspace=apps/api
```

Semua harus sukses.

## Definition of Done

- [ ] `apps/api/src/services/perpindahan.service.ts` dengan list/get/create/update/approve/delete
- [ ] `apps/api/src/services/surat.service.ts` menghasilkan PDF valid (bisa dibuka di PDF viewer, bukan cuma buffer kosong)
- [ ] `email.service.ts` punya `sendSuratPerpindahanEmail` dengan lampiran PDF, reuse transporter yang ada
- [ ] Approve perpindahan mengupdate `warga.statusKeanggotaan` sesuai mapping jenis dalam satu transaksi
- [ ] Perpindahan yang sudah approved tidak bisa dihapus atau di-approve ulang
- [ ] Endpoint `GET /api/perpindahan/:id/surat.pdf` mengembalikan PDF yang bisa dibuka langsung di browser
- [ ] Endpoint `POST /api/perpindahan/:id/kirim-email` menolak dengan pesan jelas kalau warga belum punya email
- [ ] Semua test baru + lama pass, type-check dan build bersih di `apps/api`
