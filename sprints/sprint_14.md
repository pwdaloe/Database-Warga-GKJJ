# Sprint 14 — Portal Jemaat: Fondasi & Beranda statis

## Konteks

Sprint portal pertama dari `docs/RENCANA_PORTAL_JEMAAT.md`. **Prasyarat: Sprint 13 (perbaikan QR kartu anggota) sudah selesai dan dideploy.** (baca bagian 2 "Keputusan arsitektur" dan 5 "Keamanan & privasi" lebih dulu). Desain acuan: kanvas "Portal Jemaat GKJJ — Desain Beranda" dan salinan markup di `docs/desain-portal/` (Main, Menu, Pendeta, Saya, Desktop).

Sprint ini **tidak menyentuh API, database, maupun produksi**. Hasilnya hanya berjalan di lokal:

| Layanan | Alamat lokal |
|---|---|
| Portal (baru) | `http://localhost:3100` |
| Aplikasi data (`apps/web`) | `http://localhost:3000` |
| API | `http://localhost:4000` |

Alamat akhir `https://my.gkjjakarta.org` (domain sendiri; sementara berisi halaman "sedang disiapkan" dari `deploy/landing/`) baru dipakai di Sprint 17. Portal selalu berjalan di akar domain, jadi **tidak ada `basePath`** (revisi 24 Okt 2026, menggantikan rencana `www.gkjjakarta.org/new`). Alamat situs dan alamat aplikasi data datang dari env.

Keputusan yang mengikat (usulan di rencana, dianggap disetujui bila sprint ini dijalankan):
- `apps/portal` terpisah dari `apps/web` (D1), Next.js 15 + React 19 + Tailwind, TypeScript, Vitest + React Testing Library.
- Render di server (D2). Sprint ini belum memanggil API: konten dari berkas konfigurasi bertipe di `src/content/`, yang diganti API di Sprint 15.
- Portal **tidak** memiliki form password (D3). "Masuk Warga" membuka `${NEXT_PUBLIC_APP_URL}/login`.
- Semua tautan internal lewat `next/link` dan `next/image`/aset bawaan Next (bukan `<a href>` mentah ke rute internal), supaya navigasi tetap sisi klien dan tes tautan mati bisa memeriksanya.
- `noindex` di seluruh halaman dan `robots.txt` melarang semua perayap sampai Sprint 17.
- Tanpa cookie, tanpa skrip analitik, tanpa font/gambar dari CDN pihak ketiga yang melacak (font lewat `next/font`, di-host sendiri).

Aturan: commit dan push hanya dengan konfirmasi user. Tidak ada deploy di sprint ini.

## Tasks

1. **Kerangka `apps/portal`.** Workspace baru: `package.json` (dev di port 3100, `build`, `start`, `type-check`, `test`), `tsconfig`, `next.config.ts` (tanpa `basePath`), Tailwind + PostCSS, `.env.example` (`NEXT_PUBLIC_SITE_URL=http://localhost:3100`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `API_URL=http://localhost:4000`), tambahkan ke `turbo.json` dan skrip root. Penamaan, port, dan PM2 mengikuti `docs/PLATFORM.md` bagian 3. Pastikan `npm install` dari root tidak mengubah versi dependensi `apps/web`/`apps/api`.
2. **Desain sistem.** Token Tailwind dari desain: navy `#0E2A63`, biru `#1458B4`, biru muda `#EAF2FB`, latar `#F4F8FC`, teks `#1B2B45`, teks redup `#55657D` (kontras ≥ 4,5:1), pastel tile per layanan. Font Plus Jakarta Sans lewat `next/font` (di-host sendiri). Komponen dasar: `Card`, `SectionHeader` (judul + tautan "Lihat Semua"), `ServiceTile`, `Button`/`LinkButton` (tinggi sentuh ≥ 44 px), ikon SVG inline (tanpa emoji), `Logo` placeholder.
3. **Layout responsif.** HP (< 1024 px): header + tombol menu, navigasi bawah 5 tab (Beranda, Ibadah, Pelayanan, Renungan, Saya) dengan `aria-current`. Desktop (≥ 1024 px): menu atas + footer, tanpa navigasi bawah. Satu sumber daftar menu (`src/content/navigasi.ts`) dipakai header, menu samping, dan footer.
4. **Menu samping (drawer).** Bisa diakses keyboard: fokus pindah ke panel saat dibuka dan kembali ke tombol saat ditutup, `Esc` menutup, klik latar menutup, fokus terkurung di panel, `aria-modal`, kunci gulir latar, tanpa JS yang berat. Isi menu sesuai desain, dengan "Masuk Warga Jemaat" menuju aplikasi data.
5. **Beranda.** Hero (sapaan, tagline, tombol "Ikuti Ibadah Minggu"), "Apa yang dapat kami bantu?" (8 tile dari konfigurasi + kotak cari yang belum berfungsi dan diberi keterangan jelas, atau disembunyikan sampai Sprint 16), Ibadah Minggu Ini, Kegiatan Mendatang (geser horizontal di HP, daftar vertikal di desktop), Renungan Hari Ini, ajakan "Warga jemaat? Masuk di sini". Data dari `src/content/beranda.ts` dengan **placeholder** untuk hal yang tidak diketahui (tanggal, alamat, nomor WA). Tidak ada angka, nama, atau tanggal karangan yang tampak seperti fakta.
6. **Halaman lain (kerangka).** `/saya` (penjelasan manfaat setelah masuk + tombol ke aplikasi data; tidak ada input password), `/ibadah`, `/pelayanan`, `/renungan`, `/temui-pendeta` sebagai halaman "Segera hadir" yang memakai layout yang sama, agar semua tautan navigasi hidup dan 404 punya halaman sendiri (`not-found`).
7. **Tautan keluar dan env.** Satu fungsi `appUrl(path)` untuk tautan ke aplikasi data (dari `NEXT_PUBLIC_APP_URL`) dan `siteUrl(path)` untuk URL kanonik (dari `NEXT_PUBLIC_SITE_URL`); validasi saat build bahwa kedua env terisi dan berupa URL `http(s)` tanpa garis miring penutup. Tidak ada URL domain yang ditulis langsung di kode.
8. **Privasi & SEO sementara.** `metadata.robots = noindex,nofollow`, `robots.txt` Disallow semua, tanpa `sitemap`. Header keamanan dasar di `next.config` (X-Content-Type-Options, Referrer-Policy, X-Frame-Options/`frame-ancestors`, CSP dasar tanpa `unsafe-eval` di produksi).
9. **Tes (Vitest + RTL), dengan mutation check.**
   - Drawer: terbuka/tertutup, `Esc`, fokus kembali ke pemicu, fokus terkurung, latar menutup.
   - Navigasi bawah: tepat satu `aria-current`, label dan urutan sesuai konfigurasi.
   - Konfigurasi: semua `href` internal ada di daftar rute yang dikenal (tes mencegah tautan mati), semua tile punya label dan tujuan.
   - `appUrl()` dan `siteUrl()`: URL valid, garis miring ganda tidak terjadi, env kosong atau salah format membuat error jelas (bukan `undefined/login`).
   - Beranda: semua bagian ada, tidak ada teks "undefined"/"NaN", placeholder tampil sebagai placeholder.
   - Tidak ada `<input type="password">` di seluruh pohon portal (tes penjaga D3).
10. **Verifikasi di browser.** Jalankan `http://localhost:3100` dan bandingkan dengan kanvas desain di 390 px dan 1360 px: urutan bagian, jarak, kontras, tidak ada gulir horizontal. Periksa kontras teks kecil dan urutan tab keyboard. Catat apa yang belum dicek.
11. **Dokumentasi.** README (bagian Portal: alamat lokal, variabel env, cara menjalankan) dan baris `my` di `docs/PLATFORM.md`, `SETUP.md`, CHANGELOG, tracker sprint. Salin markup acuan desain ke `docs/desain-portal/` bila belum ada.

## Verifikasi

```bash
npm install
npm run type-check --workspace=apps/portal
npm test --workspace=apps/portal
npm run build --workspace=apps/portal
# tidak boleh ada perubahan perilaku pada aplikasi yang sudah ada:
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm test --workspace=apps/api
npm test --workspace=apps/web
```

Jalankan lokal: `npm run dev --workspace=apps/portal` lalu buka `http://localhost:3100`.

## Definition of Done

- Semua task di atas selesai; type-check, tes, dan build lulus; tes API dan web yang sudah ada tidak berubah hasilnya.
- Beranda, menu samping, dan lima halaman kerangka berjalan di `http://localhost:3100` dan sesuai desain di 390 px dan 1360 px (dilihat langsung di browser, bukan hanya tes komponen).
- Tautan keluar ke aplikasi data memakai `NEXT_PUBLIC_APP_URL` (diuji dengan dua nilai berbeda), tidak ada URL domain tertulis di kode.
- Tidak ada form password, cookie, atau permintaan jaringan keluar dari halaman portal (periksa tab Network).
- Tidak ada perubahan di `apps/api`, `prisma/`, dan skrip deploy yang ada (`deploy/landing/` dan Nginx landing sudah dikerjakan terpisah), dan tidak ada commit/push/deploy tanpa konfirmasi user.
- Daftar hal yang belum diverifikasi dicatat apa adanya di CHANGELOG.
