# Sprint 3 — Reset Password Mandiri: Frontend (Desktop & Mobile)

## Konteks

Sprint ini melanjutkan Sprint 2 (endpoint `POST /api/auth/forgot-password` dan
`POST /api/auth/reset-password` sudah tersedia di backend). **Jangan jalankan sprint ini kalau
Sprint 2 belum selesai/belum lulus verifikasi** — cek `sprints/.current_sprint`, harus sudah ≥ 3.

Pola auth di frontend project ini **tidak** pakai TanStack Query untuk login/auth — cukup fungsi
async biasa di `apps/web/src/lib/auth.ts` (lihat `loginRequest`, `getMeRequest`) yang dipanggil
langsung dari komponen form dengan `react-hook-form` + `zod` (lihat
`apps/web/src/app/(auth)/login/LoginForm.tsx` sebagai referensi pola: struktur form, styling
Tailwind, error handling `err.response.data.error`). Ikuti pola yang sama persis, jangan
memperkenalkan library/state management baru.

## Tasks

### 1. Tambah request functions di `lib/auth.ts`

Edit `apps/web/src/lib/auth.ts`, tambahkan:

```ts
export async function forgotPasswordRequest(usernameOrEmail: string) {
  const res = await api.post<{ success: boolean; data: { message: string } }>(
    '/auth/forgot-password',
    { usernameOrEmail },
  )
  return res.data.data
}

export async function resetPasswordRequest(token: string, passwordBaru: string) {
  const res = await api.post<{ success: boolean; data: { message: string } }>(
    '/auth/reset-password',
    { token, passwordBaru },
  )
  return res.data.data
}
```

### 2. Halaman "Lupa Password" desktop

- Tambah link `<a href="/forgot-password">Lupa password?</a>` di bawah form di
  `apps/web/src/app/(auth)/login/LoginForm.tsx` (styling menyesuaikan, kecil, warna brand)
- Buat `apps/web/src/app/(auth)/forgot-password/page.tsx` + komponen form (boleh 1 file gabungan
  atau pisah `ForgotPasswordForm.tsx` mengikuti pola `LoginForm.tsx`):
  - Satu field `usernameOrEmail`, validasi zod `min(1)`
  - Submit → `forgotPasswordRequest(data.usernameOrEmail)`
  - Setelah sukses, **tampilkan persis message dari response API** (jangan buat pesan sukses
    sendiri yang berbeda) dan sembunyikan form — ini penting supaya pesan generik anti-enumeration
    dari backend benar-benar yang tampil ke user
  - Link kembali ke `/login`

### 3. Halaman "Reset Password" desktop

Buat `apps/web/src/app/(auth)/reset-password/page.tsx`:

- Ambil `token` dari query string dengan `useSearchParams()` (client component, `'use client'`)
- Kalau `token` kosong/tidak ada → tampilkan pesan "Link reset password tidak valid, minta link baru" + link ke `/forgot-password`
- Kalau ada token → form 2 field: `passwordBaru`, `konfirmasiPassword`, validasi zod:
  - `passwordBaru`: min 8 karakter
  - `.refine()` di level object: `passwordBaru === konfirmasiPassword`, error message "Konfirmasi password tidak cocok"
- Submit → `resetPasswordRequest(token, data.passwordBaru)`
- Sukses → tampilkan pesan sukses + tombol/link ke `/login` (pakai `useRouter().push('/login')` opsional auto-redirect setelah beberapa detik, atau cukup tombol manual — pilih yang lebih sederhana untuk diimplementasi)
- Gagal (token invalid/expired dari backend, status 400) → tampilkan `err.response.data.error` seperti pola `LoginForm.tsx`

### 4. Halaman mobile — "Lupa Password" & "Reset Password"

- Tambah link "Lupa password?" di `apps/web/src/app/m/login/page.tsx` menuju `/m/forgot-password`
- Buat `apps/web/src/app/m/forgot-password/page.tsx` dan `apps/web/src/app/m/reset-password/page.tsx`
  dengan **struktur logika identik** ke versi desktop (reuse `forgotPasswordRequest` /
  `resetPasswordRequest` yang sama, reuse skema validasi), tapi styling mengikuti gaya visual mobile
  yang sudah ada di `apps/web/src/app/m/login/page.tsx` (header biru `#1e3a5f`, rounded card, dst)
  supaya konsisten dengan halaman mobile lain

### 5. Test frontend

Tambah test Vitest + React Testing Library (ikuti pola `apps/web/src/components/ui/Badge.test.tsx`
/ `Pagination.test.tsx`) untuk form reset password (desktop atau mobile, pilih salah satu yang jadi
sumber logic utama kalau keduanya berbagi komponen):

- Submit dengan `passwordBaru` < 8 karakter → muncul pesan error validasi, `resetPasswordRequest`
  **tidak** dipanggil (mock modul `lib/auth`)
- Submit dengan `passwordBaru` ≠ `konfirmasiPassword` → muncul pesan error "tidak cocok"
- Submit valid → `resetPasswordRequest` dipanggil dengan token & password yang benar

## Verifikasi

```bash
npm run type-check --workspace=apps/web
npm run test --workspace=apps/web
npm run build --workspace=apps/web
```

Semua harus sukses. `npm run build` penting di sprint ini karena ada route baru dengan
`useSearchParams` — pastikan tidak ada error prerendering Next.js (biasanya butuh dibungkus
`<Suspense>` kalau dipakai di halaman yang di-static-generate).

## Definition of Done

- [ ] Link "Lupa password?" tersedia di halaman login desktop dan mobile
- [ ] Alur lengkap: minta reset → dapat pesan generik → (di mode dev, cek log server untuk link
      reset karena SMTP belum dikonfigurasi) → buka link `/reset-password?token=...` → set password
      baru → berhasil login dengan password baru — flow ini idealnya dicoba manual sekali via
      `npm run dev` di kedua workspace, dicatat hasilnya di ringkasan sprint kalau sempat dicoba
- [ ] Halaman reset-password menolak token kosong/hilang dengan pesan yang jelas
- [ ] Form reset-password memvalidasi panjang password & kecocokan konfirmasi sebelum submit
- [ ] Semua test baru + lama pass, `type-check` dan `build` bersih di `apps/web`
