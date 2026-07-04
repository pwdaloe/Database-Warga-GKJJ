# Sprint 2 — Reset Password Mandiri: Backend (Migration, Email Service, Endpoint)

## Konteks

Saat ini **tidak ada** fitur "lupa password" self-service. Satu-satunya cara reset password adalah
lewat admin (`POST /api/users/:id/reset-password`, hanya `SUPERADMIN`/`KEPALA_KANTOR`, lihat
`apps/api/src/routes/users.ts`). Tidak ada library email terpasang di `apps/api` sama sekali, dan
tidak ada kredensial SMTP di `.env.example` — sprint ini menambahkan infrastrukturnya dari nol.

**Penting untuk eksekusi otomatis di malam hari (tanpa kredensial SMTP asli):** desain email
service di bawah **wajib** punya fallback ketika `SMTP_HOST` belum diisi di `.env` — pakai
`nodemailer` dengan `jsonTransport: true` (tidak benar-benar mengirim email lewat jaringan, cukup
menyusun pesan lalu di-log ke console). Ini membuat seluruh alur bisa diimplementasi dan ditest end
-to-end malam ini tanpa perlu akun email sungguhan. Kredensial SMTP produksi tinggal ditambahkan ke
`.env` nanti oleh pemilik project — tidak perlu ubah kode lagi saat itu terjadi.

**Prasyarat sebelum mulai:** pastikan Postgres dev jalan (`docker compose up -d` kalau project ini
pakai docker-compose untuk DB lokal) karena sprint ini butuh menjalankan migration Prisma.

## Tasks

### 1. Tambah dependency `nodemailer`

```bash
npm install nodemailer --workspace=apps/api
npm install -D @types/nodemailer --workspace=apps/api
```

### 2. Tambah kolom reset token ke model `User`

Edit `apps/api/prisma/schema.prisma`, tambahkan ke `model User` (dekat `passwordHash`):

```prisma
resetTokenHash   String?   @map("reset_token_hash")
resetTokenExpiry DateTime? @map("reset_token_expiry")
```

Jalankan migration:

```bash
cd apps/api && npx prisma migrate dev --name add_password_reset_token && cd ../..
npm run db:generate --workspace=apps/api
```

### 3. Tambah env vars baru

Tambahkan ke `apps/api/.env.example` (dan ke `apps/api/.env` lokal kalau ada, isi dummy/kosong):

```bash
# Email (reset password) — kosongkan SMTP_HOST untuk mode dev (email di-log ke console, tidak
# benar-benar terkirim). Isi dengan kredensial SMTP asli untuk production.
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="GKJJ <no-reply@gkjjakarta.org>"

# URL frontend, dipakai untuk compose link reset password di email
APP_URL="http://localhost:3000"
```

### 4. Buat email service

Buat `apps/api/src/services/email.service.ts`:

```ts
import nodemailer from 'nodemailer'

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true })
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export async function sendPasswordResetEmail(to: string, nama: string, resetLink: string) {
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? 'GKJJ <no-reply@gkjjakarta.org>',
    to,
    subject: 'Reset Password — Database Warga GKJJ',
    text: `Halo ${nama},\n\nKlik link berikut untuk reset password Anda (berlaku 30 menit):\n${resetLink}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
    html: `<p>Halo ${nama},</p><p>Klik link berikut untuk reset password Anda (berlaku 30 menit):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Jika Anda tidak meminta ini, abaikan email ini.</p>`,
  })
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV EMAIL] Reset link untuk ${to}: ${resetLink}`)
  }
  return info
}
```

### 5. Tambah fungsi service di `auth.service.ts`

Edit `apps/api/src/services/auth.service.ts`, tambahkan:

- Import `randomBytes, createHash` dari `'crypto'` dan `sendPasswordResetEmail` dari
  `'./email.service.js'`
- `requestPasswordReset(usernameOrEmail: string)`:
  - Cari user aktif dengan `OR: [{ username }, { email }]` (pola sama seperti `login()`)
  - **Kalau user ditemukan**: generate `token = randomBytes(32).toString('hex')`, hash dengan
    `createHash('sha256').update(token).digest('hex')`, simpan `resetTokenHash` +
    `resetTokenExpiry` (`new Date(Date.now() + 30*60*1000)`) ke user tsb, compose
    `resetLink = \`${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}\``,
    panggil `sendPasswordResetEmail(user.email, user.nama, resetLink)`
  - **Kalau user tidak ditemukan**: jangan lakukan apa-apa, jangan throw error
  - **Selalu** return `{ message: 'Jika akun terdaftar, link reset password telah dikirim ke email terkait.' }`
    di kedua kasus — ini mencegah user enumeration (orang luar tidak bisa tahu username/email mana
    yang terdaftar dari respons API)
- `resetPassword(token: string, passwordBaru: string)`:
  - Validasi `passwordBaru.length >= 8`, kalau tidak `throw new AppError(400, 'Password baru minimal 8 karakter')`
  - Hash token yang diterima dengan SHA-256, cari user dengan `resetTokenHash` cocok DAN
    `resetTokenExpiry: { gt: new Date() }`
  - Kalau tidak ketemu: `throw new AppError(400, 'Token reset tidak valid atau sudah kadaluarsa')`
  - Kalau ketemu: hash password baru (`bcrypt.hash(passwordBaru, 12)`, sama seperti
    `changePassword`), update `passwordHash` DAN set `resetTokenHash: null, resetTokenExpiry: null`
    dalam satu `prisma.user.update`

### 6. Tambah endpoint di `auth.ts`

Edit `apps/api/src/routes/auth.ts`:

```ts
import rateLimit from 'express-rate-limit'

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

const forgotPasswordSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username atau email wajib diisi'),
})
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
})

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { usernameOrEmail } = forgotPasswordSchema.parse(req.body)
  const result = await authService.requestPasswordReset(usernameOrEmail)
  ok(res, result)
})

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res) => {
  const { token, passwordBaru } = resetPasswordSchema.parse(req.body)
  await authService.resetPassword(token, passwordBaru)
  ok(res, { message: 'Password berhasil direset, silakan login' })
})
```

Endpoint ini **tidak** pakai `authenticate` middleware (user belum login saat lupa password) —
pastikan didaftarkan sebelum/di luar rute yang butuh auth, sama seperti `/login`.

### 7. Test service (mock prisma & email service)

Buat `apps/api/tests/services/auth.service.reset.test.ts`, ikuti pola mocking di
`apps/api/tests/services/auth.service.test.ts` yang sudah ada. Kasus yang wajib dicover:

- `requestPasswordReset`: user ditemukan → `prisma.user.update` dipanggil dengan
  `resetTokenHash`/`resetTokenExpiry`, `sendPasswordResetEmail` (mock modul `email.service`)
  dipanggil sekali
- `requestPasswordReset`: user tidak ditemukan → tidak throw, `sendPasswordResetEmail` **tidak**
  dipanggil, return message tetap sama dengan kasus di atas (assert isinya identik)
- `resetPassword`: token valid & belum expired → password berhasil diupdate, token di-clear
- `resetPassword`: token tidak ditemukan/sudah expired → throw `AppError` status 400
- `resetPassword`: password baru < 8 karakter → throw `AppError` status 400

### 8. Test route end-to-end (supertest)

Buat `apps/api/tests/routes/auth.reset.route.test.ts`, ikuti pola
`apps/api/tests/routes/auth.route.test.ts`. Cover: body invalid → 400 (Zod), body valid untuk
kedua endpoint → 200/201 sesuai konvensi `ok()`/`created()` yang dipakai endpoint lain.

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run test --workspace=apps/api
```

Semua test (lama + baru) harus pass, type-check bersih.

## Definition of Done

- [ ] Migration `add_password_reset_token` berhasil diterapkan, Prisma Client ter-generate ulang
- [ ] `email.service.ts` dibuat dengan fallback `jsonTransport` ketika `SMTP_HOST` kosong
- [ ] `requestPasswordReset` tidak pernah membocorkan apakah suatu username/email terdaftar
      (response message identik untuk kedua kasus)
- [ ] `resetPassword` menolak token invalid/expired dan password < 8 karakter
- [ ] Endpoint `POST /api/auth/forgot-password` (dengan rate limit lebih ketat) dan
      `POST /api/auth/reset-password` berfungsi, tidak butuh auth
- [ ] Semua test baru + test lama pass (`npm run test --workspace=apps/api`)
- [ ] `npm run type-check --workspace=apps/api` bersih
- [ ] `.env.example` diupdate dengan variabel SMTP baru
