# Brief Fitur: Temui Pendeta (Buat Janji dengan Pendeta)

| | |
|---|---|
| **Status** | Brief / usulan — belum dikerjakan |
| **Diajukan oleh** | Daru |
| **Tanggal** | 2026-10-10 |
| **Kategori** | Fitur baru (layanan jemaat) |
| **Sumber** | 3 mockup mobile GKJ Jakarta: layar *Temui Pendeta*, menu hamburger, Beranda |
| **Pengguna terdampak** | Jemaat (pemohon), Pendeta (penerima), Staf Admin / Kepala Kantor (pengelola jadwal) |

## 1. Tujuan

Jemaat dapat melihat daftar pendeta, melihat jadwal pelayanannya, lalu **mengajukan janji temu** (konseling, keluarga, pernikahan, kedukaan, dll.) dari aplikasi Database Warga GKJJ, tanpa harus mencari nomor WhatsApp atau menunggu respons manual.

Nilai bagi gereja: permintaan pastoral tercatat rapi, beban koordinasi kantor berkurang, dan jemaat yang ragu bisa diarahkan ke pendeta yang tepat.

## 2. Isi Mockup (yang diminta)

**Layar Temui Pendeta** (fokus brief ini):
- Kolom cari *"Cari pendeta, pelayanan, atau topik…"* dan chip filter: **Semua · Konseling · Keluarga · Pernikahan · Kedukaan** + ikon filter lanjutan.
- Kartu per pendeta: foto, nama, **bidang pelayanan** (mis. Pastoral • Keluarga • Konseling), lencana **"Jadwal tersedia"**, hari + jam, lokasi (GKJ Jakarta – Rawamangun), tombol **Lihat Profil** dan **Buat Janji**.
- Banner bawah *"Tidak yakin dengan siapa harus bertemu? Ceritakan kebutuhan Anda, kami akan membantu mengarahkan."*
- 5 pendeta contoh; satu berstatus Emeritus.

**Layar lain** (menu hamburger, Beranda, tab Ibadah/Renungan) adalah aplikasi publik GKJ Jakarta. Itu **di luar lingkup** brief ini; hanya dipakai sebagai acuan gaya visual (biru GKJ, kartu putih membulat) dan penempatan menu.

## 3. Kondisi Saat Ini (hasil baca kode)

| Hal | Kondisi |
|---|---|
| Kontak pendeta | Sudah ada: `KontakGereja` dengan jenis `PENDETA` / `PENDETA_EMERITUS`, dikelola di Pengaturan → Kontak Gereja (nama, WhatsApp, keterangan, aktif, urutan). |
| Menu Hubungi | `/hubungi` (semua role) menampilkan WA Center, majelis kelompok, Kepala Kantor, Pendeta lewat tautan `wa.me`. Tidak ada jadwal, foto, bidang pelayanan, maupun pencatatan permintaan. |
| Role Jemaat | Hanya Profil Saya + Hubungi. `jemaatGuard` menolak route lain, sehingga **route baru wajib didaftarkan eksplisit** di allowlist `middleware/jemaatGuard.ts`. |
| Notifikasi | Tanpa WhatsApp API: pesan dikirim lewat tautan `wa.me` yang dibuka manual (pola Sprint 10, template configurable di `template_pesan`). |
| Foto | Foto warga sudah didukung (kartu anggota), bisa dijadikan acuan penyimpanan foto pendeta. |
| Pendeta sebagai pengguna | Belum ada role Pendeta. |

Kesimpulan: yang ada hanya **daftar kontak**. Fitur ini menambah **profil pelayanan, jadwal, dan alur permohonan janji**.

## 4. Rancangan Fungsional

### 4.1 Daftar & pencarian (semua role yang login, termasuk Jemaat)
- Halaman baru **Temui Pendeta** (`/temui-pendeta`), mobile-first, tata letak seperti mockup.
- Pencarian teks (nama, bidang, topik) dan filter chip per **bidang pelayanan**; ikon filter lanjutan: hari tersedia, lokasi.
- Hanya pendeta **aktif** yang tampil. Lencana "Jadwal tersedia" bila ada slot terbuka; bila tidak, "Belum ada jadwal" dan tombol Buat Janji diganti **Hubungi** (tautan `wa.me`).
- **Lihat Profil**: foto, nama, gelar/emeritus, bidang pelayanan, bio singkat, jadwal mingguan, lokasi.

### 4.2 Buat Janji (Jemaat / pengguna login)
1. Pilih slot (hari + jam) dari jadwal pendeta, atau pilih "usulkan waktu lain".
2. Isi **topik/kebutuhan** (pilihan bidang + catatan bebas singkat, opsional), nomor WhatsApp (terisi dari profil), dan kesediaan dihubungi.
3. Kirim → status **Diajukan**.

Status janji: `DIAJUKAN → DISETUJUI | DITOLAK | DIJADWALKAN_ULANG → SELESAI`, atau `DIBATALKAN` (oleh jemaat). Pemohon melihat status di bagian **Janji Saya**.

### 4.3 Sisi Pendeta / pengelola
- **Pengelola** (Superadmin, Kepala Kantor, Staf Admin): kelola profil pendeta (foto, bidang, bio, lokasi, aktif) dan **jadwal mingguan** + pengecualian (libur/cuti), serta lihat semua permintaan.
- **Pendeta** (rekomendasi: role baru `PENDETA`, atau dikelola staf atas nama pendeta — lihat keputusan 8.1): setujui/tolak/jadwalkan ulang janji miliknya.
- Notifikasi ke pemohon dan pendeta lewat tautan **wa.me** dari template configurable (kode baru: `JANJI_DIAJUKAN`, `JANJI_DISETUJUI`, `JANJI_DITOLAK`), mengikuti pola Template Pesan yang ada.

### 4.4 "Tidak yakin dengan siapa harus bertemu?"
Form singkat berisi cerita kebutuhan → masuk antrean **Permintaan Pengarahan** yang ditangani Kepala Kantor/WA Center, yang kemudian menautkan ke pendeta yang sesuai. Jaminan: tidak otomatis memilih pendeta.

### 4.5 Di luar lingkup (fase 1)
Pembayaran, video call, sinkronisasi Google Calendar, pengingat otomatis via WA API, aplikasi publik tanpa login, serta halaman Ibadah/Renungan/Beranda dari mockup.

## 5. Rancangan Teknis (ringkas)

**Skema baru (aditif, tanpa mengubah data lama):**

| Tabel | Isi |
|---|---|
| `pendeta` | profil: `nama`, `gelar`, `emeritus`, `fotoUrl`, `bio`, `bidang` (daftar), `lokasi`, `aktif`, `urutan`, relasi opsional ke `KontakGereja` / `User` |
| `jadwal_pendeta` | slot berulang: `pendetaId`, `hariKe`, `jamMulai`, `jamSelesai`, `lokasi`, `aktif`; plus `pengecualian` (tanggal libur) |
| `janji_pendeta` | `pendetaId`, `wargaId`/`userId` pemohon, `waktuMulai`, `waktuSelesai`, `topik`, `catatan` (terenkripsi), `status`, `alasanTolak`, `dibuatAt`, `diprosesOleh` |
| `permintaan_pengarahan` | `userId`, `kebutuhan` (terenkripsi), `status`, `ditanganiOleh`, `pendetaTujuanId` |

**API (`/api/pendeta`, `/api/janji-pendeta`):** `GET /pendeta` (daftar + filter), `GET /pendeta/:id`, `GET /pendeta/:id/slot?minggu=`, `POST /janji-pendeta`, `GET /janji-pendeta/saya`, `PATCH /janji-pendeta/:id` (status), CRUD pendeta/jadwal untuk pengelola.

**Catatan penting:**
- Daftarkan route baru di allowlist `jemaatGuard` (hanya GET pendeta, `POST`/`GET` janji **miliknya sendiri**). Id pemohon selalu dari akun login, bukan parameter — sama seperti Profil Saya.
- Cegah **double booking**: pembuatan janji dalam transaksi dengan cek bentrok slot; tes untuk dua permintaan bersamaan (pelajaran Sprint 9, nomor KK).
- Web: halaman `/temui-pendeta`, `/temui-pendeta/[id]`, `/janji-saya`; menu sidebar (di dekat **Hubungi**) untuk semua role; pengelolaan di **Pengaturan → Pendeta & Jadwal**.
- Tes: round-trip form, tes matriks role (jemaat hanya melihat janjinya), mutation check pada pagar kepemilikan, dan uji visual di browser sebelum rilis (blocker berulang di retro).

## 6. Privasi & Risiko (UU PDP 27/2022)

- **Topik konseling, kedukaan, dan pernikahan bersifat sensitif.** Minimalkan data: catatan bebas opsional, **dienkripsi di database** (mekanisme `crypto.ts`), hanya terlihat oleh pendeta tujuan dan pengelola, tidak masuk log mentah; akses tercatat di `AuditLog`.
- Retensi: tentukan berapa lama catatan janji disimpan (usulan: hapus/anonimkan catatan 12 bulan setelah selesai).
- **Foto dan nama pendeta** hanya dengan persetujuan masing-masing pendeta. Foto di mockup tampak sebagai ilustrasi, bukan aset resmi; **jangan memakai foto mockup**.
- Nomor WA pendeta tidak ditampilkan mentah; tetap lewat tautan `wa.me` seperti Hubungi.
- Risiko beban: janji yang tidak direspons membuat jemaat kecewa. Perlu batas waktu tindak lanjut (mis. otomatis diingatkan ke Kepala Kantor bila 3 hari belum diproses).
- Mockup memuat tanggal contoh tahun 2024; konten dan jadwal harus dari data nyata, bukan salinan mockup.

## 7. Estimasi & Fase

| Fase | Isi | Perkiraan |
|---|---|---|
| 1 | Profil pendeta + jadwal (pengelola), halaman daftar/profil (semua role), tombol **Hubungi** via wa.me | 1 sprint |
| 2 | **Buat Janji** + Janji Saya + proses oleh pendeta/pengelola + template notifikasi | 1–2 sprint |
| 3 | Permintaan Pengarahan, pengingat tindak lanjut, pelaporan (jumlah janji per pendeta/bidang) | 1 sprint |

Fase 1 sendiri sudah memberi nilai (menggantikan daftar kontak polos di Hubungi) dengan risiko rendah karena tidak menyimpan data sensitif jemaat.

## 8. Keputusan yang Dibutuhkan dari Daru

| # | Pertanyaan | Rekomendasi |
|---|---|---|
| 8.1 | Apakah pendeta punya **akun sendiri** (role `PENDETA`) untuk memproses janji, atau staf yang mengelola atas nama pendeta? | Mulai dari **staf mengelola** (fase 1–2), role `PENDETA` menyusul bila pendeta bersedia. |
| 8.2 | Lokasi fitur: hanya di **aplikasi Database Warga (login)** atau juga halaman **publik** seperti mockup (*Login / My GKJ*)? | Di aplikasi ini (login) dulu, karena memakai identitas warga dan menjaga privasi. Publik = proyek terpisah (lihat [[Website GKJ Jakarta]]). |
| 8.3 | Siapa yang menyediakan **data pendeta** (foto, bidang, jadwal) dan menyetujui tampil? | Kepala Kantor mengumpulkan; setiap pendeta menyetujui. |
| 8.4 | **Daftar bidang pelayanan** final (mockup: Pastoral, Keluarga, Konseling, Pernikahan, Kedukaan, Pembinaan, Pemuda, Lansia)? | Dijadikan master data yang bisa diedit di Pengaturan, bukan hardcode. |
| 8.5 | Apakah janji harus **disetujui** pendeta/staf, atau jemaat langsung memesan slot terbuka? | Wajib disetujui (pendeta dan staf bisa menolak/menjadwalkan ulang). |
| 8.6 | Satu janji dibatasi ke **jemaat tertaut warga** saja, atau boleh pengguna tanpa tautan? | Hanya yang tertaut warga (identitas jelas, sejalan dengan role Jemaat). |
| 8.7 | Retensi catatan janji dan siapa yang boleh melihatnya? | Lihat bagian 6. |

## 9. Kriteria Selesai (fase 1)

- Halaman **Temui Pendeta** menampilkan pendeta aktif dengan pencarian dan filter bidang, tampil baik di lebar HP (tanpa scroll horizontal).
- Pengelola dapat menambah/ubah/nonaktifkan pendeta dan jadwal; perubahan langsung tampil di daftar.
- Jemaat (role JEMAAT) dapat membuka daftar dan profil, tetapi **tidak** dapat memanggil endpoint pengelolaan (tes matriks + mutation check lulus).
- Tombol Hubungi membuka `wa.me` dengan nomor terformat benar; nomor mentah tidak ada di respons API.
- `type-check`, `build`, dan seluruh tes lulus; uji visual di browser (Claude in Chrome) dilakukan sebelum rilis.
- README/PANDUAN_PRODUK diperbarui; deploy dijadwalkan saat aplikasi tidak dipakai.
