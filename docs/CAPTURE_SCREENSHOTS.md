# Tugas untuk Claude Code: Tangkapan Layar Panduan Pengguna GKJJ

Buat tangkapan layar aplikasi **Database Warga GKJJ** untuk dipasang di panduan pengguna versi HP. Pakai Playwright (Node.js). Ikuti seluruh aturan di bawah.

## 1. Aturan wajib (UU PDP No. 27/2022)

- **Jangan pernah** memotret data warga asli. Gunakan server **staging/demo** dengan data contoh. Jika hanya ada produksi, berhenti dan tanya saya dulu.
- Sebelum memotret, tutup data sensitif yang masih tampak (NIK, nomor HP, email, alamat, foto wajah) dengan CSS blur:
  `[data-sensitive], .nik, .phone, .email { filter: blur(6px) !important; }`
  Jika selector-nya tidak ada, cari elemen yang tepat di kode aplikasi lalu blur.
- Jangan simpan password di file. Baca dari `.env` (lihat bagian 3) dan pastikan `.env` ada di `.gitignore`.
- Jangan menekan tombol yang mengubah data (Simpan, Validasi, Setujui, Hapus, Mulai Import, Kirim via WhatsApp). Cukup buka layarnya.

## 2. Setup

```bash
npm init -y
npm i -D playwright dotenv
npx playwright install chromium
```

## 3. File `.env`

```
BASE_URL=https://staging.jemaat.gkjjakarta.org
USER_JEMAAT=...        PASS_JEMAAT=...
USER_PENATUA=...       PASS_PENATUA=...
USER_MAJELIS=...       PASS_MAJELIS=...
USER_STAF=...          PASS_STAF=...
USER_ADMIN=...         PASS_ADMIN=...
USER_VIEWER=...        PASS_VIEWER=...
```

Akun demo harus sudah melewati "ganti password pertama kali".

## 4. Ukuran dan format

| Jenis | Viewport | Device scale |
|---|---|---|
| Layar HP (default) | 390 × 844 | 2 |
| Layar desktop (ditandai **D**) | 1280 × 800 | 1 |

- Format **PNG**, simpan di folder `screenshots/` dengan nama persis seperti tabel bagian 5.
- Potret **area layar yang terlihat saja** (bukan full page), kecuali ditandai **full**.
- Tunggu `networkidle` dan matikan animasi sebelum memotret.
- Untuk Login, pastikan form kosong. Untuk form tambah data, biarkan kosong.

## 5. Daftar tangkapan layar

| # | Nama file | Role | Halaman / langkah | Catatan |
|---|---|---|---|---|
| 1 | `01-login-hp.png` | – | `/m/login` | Form kosong |
| 2 | `02-login-desktop.png` | – | `/` (login) **D** | Form kosong |
| 3 | `10-jemaat-profil.png` | Jemaat | Profil Saya, tab Identitas | |
| 4 | `11-jemaat-profil-kontak.png` | Jemaat | Profil Saya, tab Kontak | Blur nomor & email |
| 5 | `20-penatua-data-warga.png` | Penatua | `/m` Data Warga (daftar) | Tombol **+** terlihat |
| 6 | `21-penatua-tambah-warga.png` | Penatua | Ketuk **+** | Form 6 field kosong |
| 7 | `22-penatua-detail-warga.png` | Penatua | Ketuk satu kartu warga | Tombol **Edit** terlihat |
| 8 | `23-penatua-kartu-anggota.png` | Penatua | Kartu Anggota → cari 2 huruf → pilih | Kartu digital + QR |
| 9 | `30-majelis-perpindahan.png` | Majelis | Perpindahan, detail yang menunggu persetujuan | Tombol **Setujui** terlihat, jangan ditekan |
| 10 | `40-staf-validasi.png` | Staf | Validasi Data, tab Perlu Validasi | |
| 11 | `41-staf-tambah-warga.png` | Staf | Data Warga → Tambah Warga, tab Identitas | |
| 12 | `42-staf-kartu-anggota.png` | Staf | Kartu Anggota, kartu terpilih **D** | Tombol Cetak & Kirim WA terlihat |
| 13 | `43-staf-perpindahan-tambah.png` | Staf | Perpindahan → Tambah | Form kosong |
| 14 | `44-staf-import.png` | Staf | Import Data, langkah Upload **D** | |
| 15 | `50-admin-tambah-pengguna.png` | Admin | Pengguna → Tambah Pengguna | Form kosong |
| 16 | `51-admin-wilayah.png` | Admin | Wilayah & Kelompok, satu wilayah terbuka | |
| 17 | `52-admin-log.png` | Admin | Log Aktivitas **D** | Blur kolom IP & username |
| 18 | `53-admin-pengaturan.png` | Admin | Pengaturan | |
| 19 | `60-viewer-dashboard.png` | Viewer | Dashboard **full** | |
| 20 | `70-hubungi.png` | Jemaat | Menu Hubungi | Blur nomor kontak pribadi |

Modal **Info Akun** (password tampil sekali) **tidak perlu** dipotret karena hanya muncul setelah menyimpan pengguna.

## 6. Struktur skrip

Buat `capture.mjs` dengan:

- Fungsi `login(page, role)` yang membaca `USER_<ROLE>`/`PASS_<ROLE>` dari `.env`. Penatua login di `/m/login`, role lain di `/`.
- Satu konteks browser baru per role (agar sesi tidak tercampur).
- Array langkah sesuai tabel bagian 5: `{ file, role, viewport, fullPage, go: async (page) => { ... } }`.
- Sebelum `page.screenshot`, suntikkan CSS blur (bagian 1) dan CSS penonaktif animasi:
  `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`
- Jika satu langkah gagal (selector tidak ditemukan), catat ke `screenshots/_gagal.txt`, lanjutkan langkah berikutnya.
- Cari selector dari kode aplikasi di repo ini. Utamakan teks tombol/label (`getByRole`, `getByText`) agar tidak rapuh.

Jalankan:

```bash
node capture.mjs
```

## 7. Setelah selesai

1. Periksa setiap gambar secara visual: tidak ada data pribadi yang terbaca.
2. Buat `screenshots/_daftar.md` berisi nama file dan satu kalimat isi layarnya.
3. Kompres folder `screenshots/` menjadi `screenshots.zip`.

Saya akan mengunggah `screenshots.zip` ke proyek desain, lalu gambar dipasang di panduan sesuai nomor file.
