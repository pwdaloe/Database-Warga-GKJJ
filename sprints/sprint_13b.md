# Sprint 13B — Absensi Kegiatan via QR Kartu Anggota (MVP)

## Konteks

Keputusan user (24 Okt 2026, diskusi QR absensi):
1. Uji coba untuk **kelompok kecil, ±100 orang**: Pendalaman Alkitab di kelompok, rapat-rapat, ibadah kecil.
2. Sinyal di lokasi **terbatas pada paket data smartphone** (tanpa Wi-Fi andal).
3. **Kartu fisik belum dicetak**: QR memakai token dari Sprint 13 tanpa masa transisi yang panjang.
4. Kehadiran dipakai **sebagai rekap kegiatan saja**, belum menjadi syarat apa pun (sertifikat, hak suara).

> **Jadwal (keputusan user 24 Okt 2026): dikerjakan SETELAH Sprint 14 (portal fondasi) mulai dikerjakan**, bukan sebelumnya. Sprint 13 (token QR) sudah dideploy (`241e2da`), jadi prasyarat teknis terpenuhi.

**Prasyarat: Sprint 13 (token QR) selesai.** Absensi memakai `qr_token`, bukan id warga. Sprint portal (14) tidak bergantung pada sprint ini dan boleh berjalan paralel setelah Sprint 13.

### Prinsip rancangan

- **Memindai kamera biasa tidak mencatat apa pun.** QR tetap membuka halaman info publik. Kehadiran hanya dicatat oleh **petugas yang login** lewat mode Absensi di aplikasi mobile (`/m`), supaya orang lain tidak bisa mengabsenkan siapa pun.
- **Pola yang dipilih: petugas memindai kartu warga, dengan cari manual sebagai cadangan, dan tamu non-warga dihitung jumlahnya** (opsi D di diskusi). Warga memindai sendiri (opsi B) dan kios tablet (opsi C) ditunda.
- Dibangun di aplikasi jemaat yang sudah ada (`/m`, login dan peran sudah ada), **bukan** di `kegiatan.gkjjakarta.org`, sehingga tidak menunggu SSO (`docs/PLATFORM.md` P1) maupun aplikasi `kegiatan`. Tabel baru bersifat aditif. Kelak `kegiatan` membaca data ini lewat API.
- Penamaan: **"Sesi Absensi"** (bukan "Kegiatan") agar tidak bentrok dengan modul perencanaan kegiatan di produk `kegiatan`.
- **Online dengan antrean kirim ulang.** Sinyal paket data cukup untuk kirim kecil, tetapi bisa putus sebentar: pemindaian disimpan dulu di perangkat dan dikirim ulang otomatis. Mode offline penuh (unduh daftar peserta sebelum acara) **di luar sprint ini**.

## Rancangan data (aditif, tanpa mengubah tabel yang ada)

| Tabel | Kolom utama | Catatan |
|---|---|---|
| `sesi_absensi` | id, nama, jenis (`PENDALAMAN_ALKITAB`, `RAPAT`, `IBADAH`, `PELATIHAN`, `LAINNYA`), tanggal, mulai, selesai (opsional), lokasi (opsional), `kelompok_id` (opsional; kosong = seluruh jemaat), `jumlah_tamu` (default 0), status (`DIBUKA`, `DITUTUP`), `dibuat_oleh`, timestamps | Kelak diberi kolom opsional untuk menaut ke kegiatan di produk `kegiatan` (id luar, bukan FK) |
| `kehadiran` | id, `sesi_id`, `warga_id`, `dicatat_pada`, `dicatat_oleh` (user), `metode` (`SCAN`, `MANUAL`) | **Unik** (`sesi_id`, `warga_id`): hadir dua kali tidak menggandakan |

Migrasi hanya menambah tabel dan enum; `db push` di skrip deploy menanganinya (backup otomatis tetap berjalan).

## Hak akses

| Peran | Buat/tutup sesi | Pindai/catat hadir | Lihat rekap |
|---|---|---|---|
| Superadmin, Kepala Kantor, Staf Admin | Semua | Semua sesi | Semua sesi |
| Majelis | Semua | Semua sesi | Semua sesi |
| Penatua Kelompok | Hanya sesi kelompoknya sendiri | Sesi kelompoknya | Sesi kelompoknya |
| Viewer, Jemaat | Tidak | Tidak | Tidak |

Warga **lintas kelompok** boleh dipindai di sesi mana pun (tamu dari kelompok lain). Respons pemindaian hanya memuat nama, foto, kelompok, dan status kehadiran, **tidak** NIK, alamat, atau kontak.

## Tasks

1. **Skema.** Dua model dan dua enum di atas, `@@map` konsisten dengan tabel lain.
2. **API sesi.** `GET /api/absensi/sesi` (daftar, disaring per peran), `POST /api/absensi/sesi`, `PATCH /api/absensi/sesi/:id` (ubah nama/lokasi/tamu, tutup, buka kembali oleh peran tinggi), `GET /api/absensi/sesi/:id` (rinci + jumlah hadir). Validasi Zod; Penatua dibatasi ke kelompoknya di server, bukan hanya di UI.
3. **API kehadiran.** `POST /api/absensi/sesi/:id/hadir` dengan `{ token }` (SCAN) atau `{ wargaId }` (MANUAL, lewat pencarian); idempoten: pemindaian ulang mengembalikan `200` dengan `sudahHadir: true` dan waktu sebelumnya, tanpa catatan baru. Token tidak dikenal dan token salah sama-sama `404` dengan pesan identik. Sesi `DITUTUP` menolak pencatatan (`409`). `DELETE /api/absensi/sesi/:id/hadir/:wargaId` untuk membatalkan salah catat (tercatat di audit log). Pembatas laju khusus.
4. **Pencarian peserta.** `GET /api/absensi/cari?q=` mengembalikan hanya id, nama, nomor anggota, foto kecil, nama kelompok (maksimal 20 hasil, minimal 3 huruf), **tanpa** pembatasan kelompok agar tamu lintas kelompok bisa dicari, namun tanpa data sensitif.
5. **Rekap (tampil di layar saja).** `GET /api/absensi/sesi/:id/rekap`: daftar hadir (nama, kelompok, waktu, metode, lencana status keanggotaan), jumlah hadir + tamu, dan **untuk sesi berkelompok daftar anggota aktif yang tidak hadir**. Ekspor Excel **tidak** dikerjakan di sprint ini (keputusan user 24 Okt), dicatat sebagai lanjutan.
6. **Web: layar Absensi di `/m`.**
   - Tab baru "Absensi" di navigasi bawah `/m`.
   - Daftar sesi + tombol Buat Sesi (formulir singkat).
   - Layar sesi: kamera pemindai (izin kamera, penjelasan jika ditolak), hasil pindai besar (foto, nama, kelompok) dengan getaran/bunyi singkat, penanda "sudah hadir", penghitung hadir dan tamu (+/−), daftar hadir terbaru, kotak cari manual, tombol tutup sesi.
   - Pemindai hanya menerima kode berbentuk `…/m/<token>` yang valid; kode lain ditolak dengan pesan jelas.
   - **Antrean kirim ulang**: pemindaian yang gagal terkirim disimpan di perangkat (IndexedDB atau `localStorage` bila IndexedDB tak tersedia), dikirim ulang otomatis saat online, ditampilkan "N menunggu terkirim", tidak hilang bila halaman ditutup.
   - Pustaka pemindai dipilih di awal sprint (perlu kompatibel dengan iOS Safari yang belum punya `BarcodeDetector`; periksa lisensi, ukuran bundel, dan umur versi sebelum dipakai).
7. **Privasi dan PDP.** Perbarui `kebijakan-privasi` (kehadiran kegiatan dicatat: tujuan, siapa melihat). Usulan retensi **3 tahun** (konfirmasi user); skrip purge menyusul. Token tidak pernah masuk log. Kehadiran tidak diekspor oleh peran yang tidak berhak.
8. **Tes (dengan mutation check).**
   - Otorisasi per peran (matriks di atas); Penatua tidak bisa membuat atau mencatat di sesi kelompok lain; Viewer dan Jemaat 403.
   - Idempotensi: pindai dua kali → satu catatan; konkurensi dua permintaan serentak tidak menimbulkan duplikat (kendala unik).
   - Token salah dan token tak ada → 404 identik; sesi ditutup → 409; respons pindai tidak memuat NIK/alamat/kontak (kunci daftar field).
   - Rekap: hitungan hadir, tamu, dan daftar tidak hadir benar untuk sesi berkelompok; anggota non-aktif tidak masuk daftar tidak hadir.
   - Web: pemindai menolak kode di luar format; antrean mengirim ulang setelah gagal dan tidak menggandakan; komponen hasil pindai.
9. **Verifikasi nyata di lokal**: buat sesi, cetak QR dari halaman Kartu (token Sprint 13), pindai layar dengan kamera HP nyata (bukan hanya dekode gambar), putus jaringan lalu sambung lagi untuk menguji antrean, uji di iOS Safari dan Chrome Android bila perangkat ada. Catat apa yang belum dicoba.
10. **Dokumentasi**: panduan petugas singkat (cara buka sesi, memindai, kartu hilang, salah catat), README, API_REFERENCE, PANDUAN_PRODUK, CHANGELOG, `docs/PLATFORM.md` (P7 → diputuskan).

## Di luar sprint ini (dicatat sebagai lanjutan)

- Warga memindai QR kegiatan dari HP sendiri (opsi B) dan QR kios/tablet (opsi C).
- Mode offline penuh (daftar peserta diunduh sebelum acara).
- Kehadiran sebagai syarat (sertifikat, hak suara) dan QR dinamis anti-palsu.
- **Ekspor Excel** rekap kehadiran (`exceljs` sudah ada).
- **Notifikasi ke Penatua kelompok** saat warga kelompoknya (atau warga berstatus non-aktif) tercatat hadir; perlu saluran notifikasi (WhatsApp `wa.me` seperti fitur akun, atau notifikasi dalam aplikasi) dan aturan privasi.
- Menaut sesi ke perencanaan di produk `kegiatan`; laporan tren kehadiran; menu desktop khusus.

## Verifikasi

```bash
npm run db:generate --workspace=apps/api
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm test --workspace=apps/api
npm test --workspace=apps/web
npm run build --workspace=apps/web
```

## Rencana deploy (untuk user)

1. Deploy kode (tabel baru ditambahkan oleh `db push`; backup otomatis berjalan). Hanya menambah, tidak mengubah tabel yang ada.
2. `npm run db:integritas --workspace=apps/api` tetap bersih.
3. Uji coba satu kelompok kecil dengan satu atau dua petugas sebelum diperluas.
4. Rollback: aplikasi lama tidak bergantung pada tabel baru; menyembunyikan tab Absensi sudah cukup.

## Definition of Done

- Semua task selesai; type-check, tes, dan build lulus; tes baru terbukti menangkap mutasi.
- Di lokal: sesi dibuat, kartu dipindai dengan kamera nyata, hadir tercatat tepat sekali, pindai ulang tidak menggandakan, antrean mengirim ulang setelah koneksi pulih, rekap benar.
- Penatua tidak bisa menjangkau sesi kelompok lain; tidak ada NIK, alamat, atau kontak di respons pemindaian; tidak ada token di log.
- Tidak ada deploy atau perubahan data produksi tanpa konfirmasi user.

## Keputusan user (24 Okt 2026)

1. **Retensi catatan kehadiran: 3 tahun.** Skrip purge dikerjakan sebagai lanjutan.
2. **Warga non-aktif atau berstatus lain yang dipindai tetap dicatat** (dengan lencana status), tidak ditolak. Lanjutan: notifikasi ke Penatua kelompoknya.
3. **Rekap cukup tampil di layar**; ekspor Excel dicatat sebagai pengembangan.
4. Tautan WhatsApp lama `/m/{id}` yang sudah terkirim pada skala uji coba **boleh diabaikan** (tidak perlu masa transisi): lihat Sprint 13.
