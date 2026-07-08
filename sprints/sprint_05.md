# Sprint 5 — Perpindahan Jemaat: Backend (CRUD, Approval, Surat PDF, Email)

## Konteks

Model `Perpindahan` **sudah ada** di `apps/api/prisma/schema.prisma` (migration awal
`20260504140814_init` sudah applied — **tabel ini masih 0 baris**, belum pernah dipakai, jadi aman
diubah lewat migration baru). Enum `JenisPerpindahan` punya 3 nilai: `MASUK`, `KELUAR`, `MENINGGAL`.

> **Keputusan produk (dikonfirmasi user sebelum sprint ini dimulai)**:
> 1. Proses perpindahan jemaat butuh **2 tahap sign-off** sebelum resmi — approve (persetujuan
>    awal) lalu validate (finalisasi administratif) — supaya `validatedBy` yang sudah ada di schema
>    tidak jadi field mati seperti `retensiHingga` sebelumnya.
> 2. **Nama & tanggal approver/validator wajib muncul di surat PDF** (mis. "Disetujui oleh: Budi
>    Santoso, Majelis, pada 8 Juli 2026"). Field `approvedBy`/`validatedBy` di schema **saat ini
>    menunjuk ke `Warga`, bukan `User`** — ini tidak bisa diandalkan karena staf yang approve belum
>    tentu punya baris `Warga` terkait (cek: 0 dari 24 akun user di database dev saat ini terhubung
>    ke `Warga` lewat `wargaId`). Skema juga **belum punya field tanggal approve/validate sama
>    sekali** (`createdAt` cuma tanggal record dibuat, bukan tanggal approve). Ini diperbaiki di
>    Task 1 sebagai migration baru — lihat detail di bawah.
> 3. Role yang boleh approve/validate **tetap** `MAJELIS`/`KEPALA_KANTOR`/`SUPERADMIN` (approve) dan
>    `KEPALA_KANTOR`/`SUPERADMIN` (validate) — `PENATUA_KELOMPOK` **tidak** ditambahkan ke alur ini
>    (fitur ini tetap desktop-only, tidak ada perubahan scope mobile).
> 4. Kop surat PDF pakai placeholder generik dulu (alamat resmi gereja belum tersedia), gampang
>    diganti templatenya nanti.

Sidebar frontend **sudah** punya link ke `/perpindahan` (lihat
`apps/web/src/components/layout/Sidebar.tsx`, grup "Utilitas") untuk role `SUPERADMIN`,
`KEPALA_KANTOR`, `MAJELIS`, `STAF_ADMIN` — tapi route API dan halamannya belum ada. Sprint ini
membangun API-nya; Sprint 6 membangun halamannya.

Ini fitur pencatatan status keanggotaan jemaat (bukan pindah alamat/domisili):
- `MASUK` — jemaat pindah masuk dari gereja lain (surat keterangan pindah dari gereja asal)
- `KELUAR` — jemaat pindah keluar ke gereja lain (perlu diterbitkan surat keterangan pindah)
- `MENINGGAL` — jemaat meninggal dunia (surat keterangan meninggal untuk keperluan administrasi)

**Keputusan desain — baca sebelum implementasi:**

1. **Role & 2 tahap approval**:
   - `STAF_ADMIN` (dan di atasnya: `MAJELIS`, `KEPALA_KANTOR`, `SUPERADMIN`) boleh mencatat pengajuan
     perpindahan (create/update selama belum di-approve).
   - **Tahap 1 — Approve**: `MAJELIS`, `KEPALA_KANTOR`, `SUPERADMIN` boleh approve. Ini persetujuan
     awal/pastoral, mengisi `approvedBy`. **Belum** mengubah `statusKeanggotaan` warga.
   - **Tahap 2 — Validate**: hanya `KEPALA_KANTOR`, `SUPERADMIN` yang boleh validate — finalisasi
     administratif, mengisi `validatedBy`. **Wajib sudah approved dulu** (`approvedBy` tidak null),
     kalau belum → `AppError(400, 'Perpindahan harus di-approve terlebih dahulu sebelum divalidasi')`.
     Validate-lah yang memicu sinkronisasi status keanggotaan (lihat poin 2).
   - Hapus hanya untuk `KEPALA_KANTOR`/`SUPERADMIN`, dan **hanya** kalau belum di-approve
     (`approvedBy` masih null) — begitu masuk tahap approve (approved atau approved+validated),
     data tidak boleh dihapus, biar jejak administratif utuh.
2. **Sinkronisasi status keanggotaan**: saat perpindahan **divalidasi** (bukan saat approve), update
   `warga.statusKeanggotaan` otomatis dalam satu transaksi bersama `validatedBy`:
   - `MASUK` → `AKTIF`
   - `KELUAR` → `PINDAH_KELUAR`
   - `MENINGGAL` → `MENINGGAL`

   Alasan dipindah ke tahap validate: approve tahap 1 adalah persetujuan awal (bisa dibatalkan
   konsepnya kalau ada revisi), perubahan status keanggotaan resmi jemaat sebaiknya baru terjadi
   di finalisasi administratif terakhir.
3. **Surat PDF**: pakai `pdfkit` (ringan, pure JS, tanpa headless browser) untuk generate "Surat
   Keterangan Pindah/Meninggal Jemaat" secara server-side. Ini dipakai untuk 2 hal: (a) endpoint
   view/download PDF langsung di browser (dipakai tombol "Cetak" di Sprint 6, browser native
   print-to-PDF dari situ, tersedia kapan saja untuk preview draft), dan (b) lampiran email di task
   5 — **hanya bisa dikirim setelah validated** (lihat task 6, endpoint `kirim-email`).
4. **Kop surat PDF**: nama gereja + placeholder alamat generik (tidak ada alamat/kop resmi
   tersimpan di repo ini saat ini) — sudah dikonfirmasi user, template gampang diganti nanti begitu
   ada detail resmi. Jangan blocking sprint ini menunggu itu.
5. **Activity log otomatis**: `apps/api/src/middleware/activityLogger.ts` sudah global untuk semua
   method mutasi (`POST`/`PUT`/`PATCH`/`DELETE`) — tidak perlu tambahan logging manual di route baru.

## Tasks

### 1. Migration schema: `approvedBy`/`validatedBy` ke `User` + tambah `approvedAt`/`validatedAt`

**Kerjakan ini lebih dulu sebelum task lain** — task 3 (service) dan 4 (PDF) bergantung pada field
hasil migration ini. Tabel `perpindahan` masih 0 baris (belum pernah dipakai di production), jadi
migration ini aman tanpa perlu rencana backfill.

Ubah `apps/api/prisma/schema.prisma`, model `Perpindahan`:

```prisma
model Perpindahan {
  id                  Int              @id @default(autoincrement())
  wargaId             Int              @map("warga_id")
  jenis               JenisPerpindahan
  gerejaAsalTujuan    String?          @db.VarChar(200) @map("gereja_asal_tujuan")
  tanggalPerpindahan  DateTime?        @db.Date @map("tanggal_perpindahan")
  nomorSurat          String?          @db.VarChar(50) @map("nomor_surat")
  approvedBy          Int?             @map("approved_by")
  approvedAt          DateTime?        @map("approved_at")
  validatedBy         Int?             @map("validated_by")
  validatedAt         DateTime?        @map("validated_at")
  keterangan          String?          @db.Text
  createdAt           DateTime         @default(now()) @map("created_at")

  warga               Warga            @relation("WargaPerpindahan", fields: [wargaId], references: [id])
  approvedByUser      User?            @relation("PerpindahanApprovedBy", fields: [approvedBy], references: [id])
  validatedByUser     User?            @relation("PerpindahanValidatedBy", fields: [validatedBy], references: [id])

  @@map("perpindahan")
}
```

Alasan pindah dari `Warga` ke `User`: approver/validator adalah **staf yang sedang login**
(identitasnya selalu tersedia lewat `req.user.userId` dari JWT), bukan warga jemaat. Field lama
menunjuk ke `Warga` tidak reliable karena staf belum tentu punya baris `Warga` terkait — dengan
menunjuk ke `User`, nama (`User.nama`) dan role (`User.role`, untuk label jabatan di surat) selalu
tersedia tanpa syarat tambahan apa pun.

Di model `Warga`, **hapus** 2 baris relasi balik yang sekarang tidak dipakai:
```prisma
perpindahanApproved    Perpindahan[]        @relation("PerpindahanApprovedBy")
perpindahanValidated   Perpindahan[]        @relation("PerpindahanValidatedBy")
```

Di model `User`, **tambah** relasi balik baru (dekat `wargasValidated` yang sudah ada):
```prisma
perpindahanApproved  Perpindahan[] @relation("PerpindahanApprovedBy")
perpindahanValidated Perpindahan[] @relation("PerpindahanValidatedBy")
```

Jalankan migration:

```bash
cd apps/api
npx prisma migrate dev --name perpindahan_approver_ke_user
cd ../..
```

### 2. Tambah dependency `pdfkit`

```bash
npm install pdfkit --workspace=apps/api
npm install -D @types/pdfkit --workspace=apps/api
```

### 3. Buat Zod schema & service `perpindahan.service.ts`

Buat `apps/api/src/services/perpindahan.service.ts`. Ikuti pola `listWarga`/pagination di
`warga.service.ts` (`Promise.all([prisma.perpindahan.count(...), prisma.perpindahan.findMany(...)])`,
lalu return lewat helper `paginated()`).

Include standar untuk setiap query:

```ts
const PERPINDAHAN_INCLUDE = {
  warga: { select: { id: true, namaLengkap: true, namaPanggilan: true, email: true, whatsapp: true, telepon: true, statusKeanggotaan: true } },
  approvedByUser: { select: { id: true, nama: true, role: true } },
  validatedByUser: { select: { id: true, nama: true, role: true } },
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
- `approvePerpindahan(id: number, userId: number)`:
  - Ambil perpindahan by id, kalau `approvedBy` sudah terisi → `AppError(400, 'Perpindahan ini sudah di-approve sebelumnya')`
  - Update `perpindahan.approvedBy = userId`, `approvedAt = new Date()` — **tidak** menyentuh
    `statusKeanggotaan` warga di tahap ini (itu terjadi di `validatePerpindahan`).
  - `userId` di sini adalah `User.id` langsung dari `req.user!.userId` (JWT) — **tidak ada lagi**
    ketergantungan ke baris `Warga` staf, selalu terisi.
- `validatePerpindahan(id: number, userId: number)`:
  - Ambil perpindahan by id. Kalau `approvedBy` masih null → `AppError(400, 'Perpindahan harus di-approve terlebih dahulu sebelum divalidasi')`.
    Kalau `validatedBy` sudah terisi → `AppError(400, 'Perpindahan ini sudah divalidasi sebelumnya')`.
  - `prisma.$transaction([...])`: update `perpindahan.validatedBy = userId`, `validatedAt = new Date()`,
    DAN update `warga.statusKeanggotaan` sesuai mapping `jenis` di Keputusan Desain #2 di atas.
- `deletePerpindahan(id: number)` — kalau `approvedBy` sudah terisi (approved dan/atau validated) → `AppError(400, 'Perpindahan yang sudah di-approve tidak bisa dihapus')`.

### 4. Buat service PDF `surat.service.ts`

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
- **2 baris tanda tangan di bagian bawah, masing-masing dengan nama + jabatan + tanggal** (ini
  requirement eksplisit dari user, jangan cuma nama polos):
  - "Disetujui oleh: `{approvedByUser.nama}`, `{label jabatan}`, pada `{approvedAt, format tanggal Indonesia}`"
    — kalau `approvedByUser` null (belum di-approve, PDF di-generate untuk preview draft), tulis "_______________"
  - "Divalidasi oleh: `{validatedByUser.nama}`, `{label jabatan}`, pada `{validatedAt, format tanggal Indonesia}`"
    — sama, "_______________" kalau belum divalidasi
  - Label jabatan dari `role` (`SUPERADMIN`/`KEPALA_KANTOR`/`MAJELIS`/dst) — buat mapping Indonesia
    di `surat.service.ts` sendiri (mirror `ROLE_LABELS` di `apps/web/src/lib/auth.ts`, jangan impor
    lintas-workspace, cukup duplikasi map kecil ini): `{ SUPERADMIN: 'Super Admin', KEPALA_KANTOR:
    'Kepala Kantor', MAJELIS: 'Majelis', STAF_ADMIN: 'Staf Administrasi', PENATUA_KELOMPOK: 'Penatua
    Kelompok', VIEWER: 'Viewer' }`
  - Format tanggal: `date-fns` `format(date, 'd MMMM yyyy', { locale: id })` — cek dulu apakah
    `date-fns` sudah ada di `apps/api` (dipakai di frontend, belum tentu di backend), install ke
    `apps/api` kalau belum ada
- Return sebagai `Buffer` (kumpulkan chunks dari `doc.on('data', ...)`, resolve di `doc.on('end', ...)`, panggil `doc.end()`)

### 5. Extend `email.service.ts`

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

### 6. Buat route `perpindahan.ts`

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

// POST /api/perpindahan/:id/approve — tahap 1, pakai req.user!.userId (bukan lagi Warga.id)
perpindahanRouter.post('/:id/approve', authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS'), async (req, res) => {
  const result = await perpindahanService.approvePerpindahan(Number(req.params.id), req.user!.userId)
  ok(res, result)
})

// POST /api/perpindahan/:id/validate — tahap 2, lebih ketat dari approve (tanpa MAJELIS)
perpindahanRouter.post('/:id/validate', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => {
  const result = await perpindahanService.validatePerpindahan(Number(req.params.id), req.user!.userId)
  ok(res, result)
})

// DELETE /api/perpindahan/:id
perpindahanRouter.delete('/:id', authorize('SUPERADMIN', 'KEPALA_KANTOR'), async (req, res) => { ... res.status(204).send() })

// GET /api/perpindahan/:id/surat.pdf — stream PDF, authenticate saja, tersedia kapan saja (preview draft)
perpindahanRouter.get('/:id/surat.pdf', async (req, res) => {
  const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params.id))
  const pdfBuffer = await suratService.generateSuratPerpindahanPdf(perpindahan)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="surat-perpindahan-${req.params.id}.pdf"`)
  res.send(pdfBuffer)
})

// POST /api/perpindahan/:id/kirim-email — HANYA setelah validated (surat resmi, bukan draft)
perpindahanRouter.post('/:id/kirim-email', authorize('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN'), async (req, res) => {
  const perpindahan = await perpindahanService.getPerpindahanById(Number(req.params.id))
  if (!perpindahan.validatedBy) throw new AppError(400, 'Perpindahan belum divalidasi, surat belum bisa dikirim')
  if (!perpindahan.warga.email) throw new AppError(400, 'Warga ini belum memiliki alamat email terdaftar')
  const pdfBuffer = await suratService.generateSuratPerpindahanPdf(perpindahan)
  const jenisLabel = { MASUK: 'Keterangan Pindah Masuk', KELUAR: 'Keterangan Pindah Keluar', MENINGGAL: 'Keterangan Kematian' }[perpindahan.jenis]
  await emailService.sendSuratPerpindahanEmail(perpindahan.warga.email, perpindahan.warga.namaLengkap, jenisLabel, pdfBuffer)
  ok(res, { message: 'Surat berhasil dikirim ke email warga' })
})
```

Sesuaikan detail Zod schema body (`wargaId: z.number().int().positive()`, `jenis: z.enum(['MASUK','KELUAR','MENINGGAL'])`, dst) mengikuti gaya `kelompok.ts`/`keluarga.ts`.

### 7. Daftarkan router di `app.ts`

Tambahkan import dan `app.use('/api/perpindahan', perpindahanRouter)` mengikuti pola router lain di `apps/api/src/app.ts`.

### 8. Test service (mock prisma)

Buat `apps/api/tests/services/perpindahan.service.test.ts`, ikuti pola mocking di
`apps/api/tests/services/auth.service.test.ts`. Cover minimal:

- `createPerpindahan`: sukses membuat record dengan `approvedBy: null`, `validatedBy: null`
- `createPerpindahan`: `wargaId` tidak ditemukan → throw `AppError` 404
- `approvePerpindahan`: sukses → `approvedBy`/`approvedAt` terisi, `warga.statusKeanggotaan` **tidak berubah**
- `approvePerpindahan`: sudah pernah di-approve → throw `AppError` 400
- `validatePerpindahan`: belum di-approve (`approvedBy` null) → throw `AppError` 400, tidak ada update yang jalan
- `validatePerpindahan`: sudah approved, sukses divalidasi → `validatedBy`/`validatedAt` terisi DAN `warga.statusKeanggotaan` ter-update sesuai mapping jenis (test ketiga jenis: MASUK/KELUAR/MENINGGAL)
- `validatePerpindahan`: sudah pernah divalidasi → throw `AppError` 400, tidak ada update kedua yang jalan
- `deletePerpindahan`: sudah approved (dengan atau tanpa validated) → throw `AppError` 400

### 9. Test route (supertest, mock service seperti pola `auth.reset.route.test.ts`)

Buat `apps/api/tests/routes/perpindahan.route.test.ts`. Cover:

- `POST /api/perpindahan` tanpa role yang sesuai → 403
- `POST /api/perpindahan` body invalid (jenis bukan enum valid) → 400
- `POST /api/perpindahan/:id/validate` dengan role `MAJELIS` → 403 (hanya `KEPALA_KANTOR`/`SUPERADMIN`)
- `POST /api/perpindahan/:id/kirim-email` dengan `validatedBy` masih null → 400 dengan pesan jelas ("belum divalidasi")
- `POST /api/perpindahan/:id/kirim-email` sudah validated tapi `warga.email` null → 400 dengan pesan yang jelas

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run test --workspace=apps/api
npm run build --workspace=apps/api
```

Semua harus sukses.

## Definition of Done

- [ ] Migration baru diterapkan: `Perpindahan.approvedBy`/`validatedBy` menunjuk ke `User` (bukan `Warga`), field `approvedAt`/`validatedAt` tersedia
- [ ] `apps/api/src/services/perpindahan.service.ts` dengan list/get/create/update/approve/validate/delete
- [ ] `apps/api/src/services/surat.service.ts` menghasilkan PDF valid (bisa dibuka di PDF viewer, bukan cuma buffer kosong), dengan 2 baris tanda tangan berisi **nama + jabatan + tanggal** (approve dan validate)
- [ ] `email.service.ts` punya `sendSuratPerpindahanEmail` dengan lampiran PDF, reuse transporter yang ada
- [ ] Approve mengisi `approvedBy`/`approvedAt` dari `req.user!.userId`, **tidak** mengubah `statusKeanggotaan`
- [ ] Validate mengisi `validatedBy`/`validatedAt` DAN mengupdate `warga.statusKeanggotaan` sesuai mapping jenis dalam satu transaksi — hanya bisa dijalankan setelah approved
- [ ] Perpindahan yang sudah approved tidak bisa dihapus, di-approve ulang, atau divalidasi ulang
- [ ] Endpoint `POST /api/perpindahan/:id/validate` dibatasi role `KEPALA_KANTOR`/`SUPERADMIN` (lebih ketat dari approve)
- [ ] Endpoint `GET /api/perpindahan/:id/surat.pdf` mengembalikan PDF yang bisa dibuka langsung di browser, tersedia sebelum maupun sesudah validated
- [ ] Endpoint `POST /api/perpindahan/:id/kirim-email` menolak dengan pesan jelas kalau belum divalidasi ATAU warga belum punya email
- [ ] Semua test baru + lama pass, type-check dan build bersih di `apps/api`
