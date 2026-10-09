# Database Warga GKJJ

Aplikasi manajemen data jemaat **Gereja Kristen Jawa Jakarta (GKJJ)** berbasis web.  
Dibangun dengan arsitektur monorepo untuk mengelola data warga, keluarga, kelompok, wilayah, dan aktivitas gereja secara terpusat.

**Versi:** `v1.5` · **Terakhir diperbarui:** 5 Oktober 2026

---

## Daftar Isi

- [Fitur](#fitur)
- [Tampilan Responsif (Mobile Browser)](#tampilan-responsif-mobile-browser)
- [Aplikasi Mobile (PWA) untuk Penatua Kelompok](#aplikasi-mobile-pwa-untuk-penatua-kelompok)
- [Pengujian (Testing)](#pengujian-testing)
- [Keamanan & Kepatuhan PDP](#keamanan--kepatuhan-pdp)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Persyaratan](#persyaratan)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Role & Hak Akses](#role--hak-akses)
- [Halaman Publik](#halaman-publik)
- [Kontak & Bantuan](#kontak--bantuan)

---

## Fitur

### Beranda

#### Dashboard
- Statistik ringkasan: **Total Warga**, **Total Keluarga**, **Kelompok Aktif** (dihitung dari data kelompok berstatus aktif), **Perlu Divalidasi** (status Draft)
- **Filter Wilayah & Kelompok** — dropdown di atas dashboard; hasil filter berlaku untuk kartu statistik, sebaran, jemaat baru, chart komisi, dan peta (`?wilayahId=&kelompokId=` pada endpoint `/api/dashboard/*`). Disembunyikan untuk Penatua Kelompok
- **Sebaran Jemaat per Wilayah & Kelompok** — jumlah warga dan KK per wilayah, dengan rincian kelompok yang sudah memiliki warga saja (kelompok kosong tidak ditampilkan). Klik kelompok membuka daftar Warga terfilter (`/warga?kelompokId=`)
- **Jemaat Baru Dientry** — 5 warga terakhir yang dientry: nama, tanggal, kelompok, wilayah, dan majelis kelompok
- Setiap kartu statistik bisa diklik untuk navigasi langsung ke halaman terkait
- **Chart distribusi komisi** — bar chart warna-warni menampilkan jumlah anggota per komisi berdasarkan rentang usia (Recharts), rentang usia dapat dikonfigurasi di Pengaturan
- **Peta lokasi warga** — pin interaktif berbasis OpenStreetMap (Leaflet) untuk warga yang memiliki koordinat rumah, dengan filter per kelurahan; popup pin menampilkan **No. Induk Warga** (cadangan: No. Anggota otomatis `WRG…` jika No. Induk belum diisi)
- **Dibatasi per kelompok untuk Penatua Kelompok** — Total Warga, Total Keluarga, Perlu Divalidasi, chart komisi, dan peta hanya menghitung/menampilkan kelompok milik pengguna (di-enforce di backend). Penatua melihat label "Data kelompok Anda: [kode] · nama" dan kartu "Kelompok Aktif" disembunyikan. Penatua yang belum punya kelompok melihat angka 0 (fail-closed). Role lain melihat seluruh jemaat

---

### Data Jemaat

#### Data Warga
- Tambah, edit, hapus data warga dengan form multi-tab:
  - **Tab Identitas** — nama, foto, NIK, tempat/tanggal lahir, golongan darah
  - **Tab Keanggotaan** — status keluarga (Kepala KK, Istri, Anak, dll.), status keanggotaan, sakramen baptis & sidi
  - **Tab Kontak** — telepon, WhatsApp (dengan centang **boleh ditampilkan ke jemaat**, dipakai menu Hubungi untuk majelis kelompok), email, pendidikan, pekerjaan
  - **Tab Keluarga** — pilih/cari keluarga, atau buat keluarga baru otomatis saat warga sebagai Kepala KK (dengan validasi wajib pilih kelompok). Untuk Kepala yang sudah punya KK, tab ini menampilkan ringkasan keluarga dan anggotanya
  - **Tab Alamat** — blok **Alamat Rumah Tangga (KK)** untuk Kepala Keluarga (dimuat dari data KK; perubahan disimpan ke KK dan data warga dalam satu transaksi), Alamat KTP, Alamat Domisili (jika berbeda), koordinat GPS (latitude/longitude). Kolom koordinat menerima desimal koma (`-6,2088`), dan menempel `-6.2088, 106.8456` dari Google Maps mengisi kedua kolom sekaligus; input tidak valid ditolak dengan pesan (rentang −90..90 / −180..180). Koordinat tampil di **Detail Warga** (tautan Google Maps) dan di peta Dashboard
- **Foto warga** — upload foto, dikompres otomatis di browser (max 400px, JPEG 80%), disimpan sebagai base64
- **Filter & pencarian** — cari nama, filter per wilayah, kelompok, status keanggotaan, jenis kelamin, status dokumen
- **Status dokumen** — alur Draft → Validasi → Aktif → Tidak Aktif
- **Detail warga** — halaman biodata lengkap, tampilkan foto asli jika ada
- **Nomor warga yang ditampilkan** — di Dashboard (peta), Kartu Anggota, Perpindahan, Detail Warga/Keluarga, dan Validasi Data, sistem menampilkan **No. Induk Warga** bila sudah diisi; jika belum, memakai No. Anggota otomatis `WRG` + ID sebagai nomor sementara
- **Wizard tambah warga** — setelah input Kepala KK, lanjut ke step 2 untuk tambah anggota keluarga

#### Validasi Data
- Dua tab: **Perlu Validasi** (status Draft) dan **Sudah Divalidasi** (status Aktif)
- Search + filter wilayah/kelompok (untuk Penatua Kelompok, filter otomatis terkunci ke kelompoknya sendiri)
- Pilih satu/banyak baris (checkbox) → **Validasi Terpilih** atau **Batalkan Validasi**, dengan dialog konfirmasi
- Setiap validasi di-stamp: `validatedBy` (siapa) dan `validatedAt` (kapan) pada data warga
- Hak validasi/batal-validasi hanya untuk **Superadmin, Kepala Kantor, Staf Admin** — Penatua Kelompok bisa melihat status data warga di kelompoknya tapi tidak bisa menekan tombol validasi (double-guard di frontend & backend)

#### Data Keluarga
- Tambah, edit, hapus data kepala keluarga (KK)
- Form keluarga baru dengan pemisahan: field Kelompok (wajib, muncul di tab Keluarga) dan Alamat (tab Alamat) — tidak ada duplikasi input
- Detail halaman: info kepala keluarga, tabel anggota, edit alamat inline
- **Autocomplete kelurahan** — ketik nama kelurahan, otomatis isi kecamatan, kota, dan kode pos dari master data
- Aksi: Lihat detail, Edit, Hapus, Approve

#### Kartu Anggota
- Search anggota (minimal 2 huruf) dengan hasil real-time
- **ID Card digital** menampilkan:
  - Logo GKJ Jakarta
  - Foto atau avatar inisial berwarna (biru = laki-laki, pink = perempuan)
  - Nomor induk warga (prioritas `nomorInduk`, fallback ke `nomorAnggota`)
  - Kelompok, wilayah, penatua, status keanggotaan, tanggal validasi
  - Badge Baptis & Sidi
  - **QR Code** yang mengarah ke halaman kartu digital publik
- **Cetak ID Card** — buka jendela print dengan layout 85.6 × 72mm (ukuran kartu), logo GKJ, QR code, siap cetak
- **Kirim via WhatsApp** — buka `wa.me` dengan pesan terformat berisi data keanggotaan + link kartu digital; peringatan jika nomor tidak tersedia
- **Buka Data Warga** — navigasi langsung ke detail biodata

---

### Organisasi

#### Wilayah & Kelompok
- Tampilan accordion per wilayah, expand/collapse
- Setiap wilayah: badge kode, nama, jumlah kelompok, jumlah KK
- Tabel kelompok di dalam setiap wilayah: kode, nama, penatua/PJ, jumlah KK
- Operasi per wilayah: **Edit**, **Aktifkan/Nonaktifkan**, **Hapus** (hanya jika tidak ada KK terdaftar)
- Operasi per kelompok: **Edit**, **Aktifkan/Nonaktifkan**
- Tambah kelompok langsung dari dalam card wilayah

---

### Utilitas

#### Import Data
Wizard 5 langkah untuk import massal data warga dari file Excel:

1. **Upload** — drag & drop atau klik, accept `.xlsx` (format `.xls` lama tidak didukung — simpan ulang sebagai `.xlsx`)
2. **Mapping kolom** — tabel pemetaan header Excel ke field sistem, dengan **auto-mapping otomatis** (50+ pola nama kolom)
3. **Preview & validasi** — tampilkan 10 baris pertama, highlight baris bermasalah, summary valid/invalid
4. **Processing** — kirim per batch 100 baris, progress bar real-time
5. **Hasil** — summary sukses/gagal, log per baris dengan alasan kegagalan, download log Excel

**Template Excel** (tombol "Download Template"):
- **Sheet 1 — Data Warga**: 23 kolom, header field wajib ditandai `*`, 2 baris contoh data
- **Sheet 2 — Petunjuk Pengisian**: tabel format & nilai yang diterima per field
- **Sheet 3 — Referensi Kelompok**: daftar kode, nama kelompok, wilayah, dan penatua dari database

#### Import Pengguna
Modal upload Excel di halaman **Pengguna** (pola sama seperti import warga, maks 200 baris per batch):
- Kolom: `namaLengkap`, `username`, `email`, `password`, `role`, `kelompokKode`
- **Normalisasi otomatis username** — spasi/strip pada input diubah jadi format titik (tahan salah isi)
- Log hasil per baris (berhasil/gagal + alasan)
- Akses hanya **Superadmin** dan **Kepala Kantor**

#### Perpindahan Jemaat
Pencatatan pindah masuk, pindah keluar, dan meninggal, dengan **2 tahap sign-off** sebelum resmi:
- **Approve** — persetujuan awal oleh `MAJELIS`/`KEPALA_KANTOR`/`SUPERADMIN`, belum mengubah status keanggotaan warga
- **Validate** — finalisasi administratif oleh `KEPALA_KANTOR`/`SUPERADMIN`, baru di tahap ini `warga.statusKeanggotaan` disinkronkan otomatis (MASUK→Aktif, KELUAR→Pindah Keluar, MENINGGAL→Meninggal)
- **Cetak Surat** — generate PDF "Surat Keterangan Pindah/Meninggal Jemaat" (bisa preview draft kapan saja), mencantumkan nama, jabatan, dan tanggal approver serta validator
- **Kirim Email** — lampirkan PDF surat ke email warga (hanya setelah divalidasi)
- **Kirim WhatsApp** — ringkasan teks via `wa.me` (tersedia di semua status)

> Backend (API, PDF, email) sudah selesai. Antarmuka pengelolaan di aplikasi web (`/perpindahan`) sedang dalam pengerjaan.

---

### Sistem

#### Reset Password Mandiri (Self-Service)
- Link **"Lupa password?"** di halaman login desktop & mobile (`/login`, `/m/login`)
- Alur: masukkan username/email → link reset dikirim via email (berlaku 30 menit) → set password baru → login
- Response pesan **generik** (anti user-enumeration) — tidak membocorkan apakah username/email terdaftar
- Rate limit **5 request/15 menit** per IP pada `/auth/forgot-password`
- Token reset di-hash (SHA-256) sebelum disimpan, sekali pakai (langsung invalid setelah dipakai)
- Mode dev: `SMTP_HOST` kosong → email di-log ke console (tidak perlu kredensial SMTP asli untuk testing)

#### Notifikasi Pembaruan Aplikasi
- Saat Anda menjalankan `deploy/2-deploy.sh` di server, pengguna yang sedang membuka aplikasi melihat bar di atas halaman: **"Pembaruan sistem sedang berlangsung. Simpan pekerjaan Anda; halaman mungkin terputus sebentar."**
- Setelah deploy selesai, tab yang masih memakai versi lama melihat bar **"Versi baru tersedia. [Muat ulang]"** (versi git SHA yang tertanam di bundle web dibandingkan dengan versi di server). Bar tidak memblokir pekerjaan pengguna.
- Mekanisme: script deploy menulis flag `.deploy/maintenance` (selalu dihapus lewat `trap`, juga bila deploy gagal; flag lebih dari 30 menit diabaikan) dan `.deploy/version`; frontend memeriksa `GET /api/system/status` setiap 60 detik dan saat tab kembali aktif. Gagal fetch (API sedang restart) tidak mengubah tampilan. Error `ChunkLoadError` (file JS lama sudah hilang) juga memunculkan bar versi baru.
- Endpoint status publik, tidak menyentuh database, dan memiliki limiter sendiri (120/menit) yang dipasang **sebelum** limiter global agar polling tidak menghabiskan jatah login pengguna satu jaringan.
- Mode dev (`npm run dev`): versi bernilai `dev` sehingga bar versi baru tidak pernah muncul. Tab yang sudah terbuka sebelum fitur ini pertama kali di-deploy belum memiliki komponennya, jadi manfaat penuh mulai deploy berikutnya.

#### Wajib Ganti Password Sementara
- Akun bisa ditandai `must_change_password` (kolom di tabel `users`). Akun penatua kelompok diberi password sementara oleh admin dan **wajib menggantinya saat login pertama**
- Setelah login, user ber-flag otomatis diarahkan ke halaman `/ganti-password` (desktop dan `/m`) dan tidak bisa membuka halaman lain sebelum selesai
- Password baru minimal 8 karakter, tidak boleh sama dengan password sementara; flag dikosongkan setelah berhasil (juga setelah reset password via email)
- Catatan: pemaksaan saat ini di sisi frontend; endpoint API belum memblokir akses sebelum password diganti

#### Manajemen Pengguna
- Daftar pengguna: nama, username, email, role, kelompok, status aktif, waktu login terakhir
- Tambah pengguna baru dengan form: **tautan ke warga** (cari warga → nama, WhatsApp, email terisi otomatis; warga yang sudah punya akun tidak bisa dipilih), nama, username, email, No. WhatsApp, password, role, kelompok
- **Password acak** — kolom password dikosongkan → sistem membuat password acak 10 karakter dan akun **wajib ganti password saat login pertama**; password hanya tampil sekali di modal **Info Akun** (tidak disimpan)
- **Notifikasi WhatsApp** — modal Info Akun menyiapkan pesan dari template (Akun Baru / Reset Password) dan tombol **Kirim via WhatsApp** membuka tautan `wa.me` dengan pesan terisi; log pengiriman menyamarkan nomor & password
- **Edit** — ubah semua field kecuali password (tautan warga ikut tersimpan)
- **Reset Password** — kosongkan untuk password acak (lalu kirim via WhatsApp), atau isi manual minimal 8 karakter
- **Toggle Aktif/Nonaktif** — akun nonaktif tidak bisa login
- **Pencarian & filter** — cari nama, username, email, atau kelompok; filter **Role**, **Kelompok** (termasuk "Tanpa kelompok"), dan **Status** (Aktif/Nonaktif); ringkasan "N dari M akun" saat memfilter, tombol Reset, dan pesan jika tidak ada yang cocok
- Akses hanya untuk **Superadmin** dan **Kepala Kantor**

#### Role Jemaat & Profil Saya
Akun **Jemaat** (role `JEMAAT`, wajib ditautkan ke warga lewat form Pengguna) hanya melihat **Profil Saya** dan **Hubungi**; semua route API lain ditolak oleh pagar global `jemaatGuard`.
- **Dapat diubah**: Identitas (nama panggilan, tempat/tanggal lahir, NIK, golongan darah), Kontak (telepon, WhatsApp + centang boleh ditampilkan, email, pendidikan, pekerjaan, catatan jemaat), Alamat (KTP, domisili — centang "berbeda dengan KTP")
- **Alamat Rumah Tangga (KK)** hanya dapat diubah oleh **kepala keluarga**; anggota lain hanya melihat
- **Tidak dapat diubah**: nama lengkap, nomor anggota, status keanggotaan, sakramen, relasi keluarga, status data
- NIK dimasker di tampilan; kosong berarti tidak diubah. Server memakai whitelist ketat (field di luar daftar → 400)
- **Verifikasi staf**: perubahan mengembalikan data ke status Draft dan muncul di **Validasi Data** dengan penanda "Diubah mandiri oleh jemaat"; tercatat di audit log (nilai lama/baru, sumber jemaat)
- **Catatan jemaat** terpisah dari catatan internal; tampil bagi staf di Detail Warga (struktur siap untuk survei/kebutuhan jemaat)

#### Hubungi
Menu untuk **semua role** berisi tombol **Chat WhatsApp** (`wa.me`, langsung membuka aplikasi WhatsApp):
1. **GKJ WhatsApp Center**
2. **Majelis kelompok** — otomatis dari kelompok pengguna/keluarga; tampil hanya bila penatua mencentang "boleh ditampilkan ke jemaat"
3. **Kepala Kantor**
4. **Pendeta** (termasuk Pendeta Emeritus yang aktif)

Kontak 1, 3, 4 diatur di **Pengaturan → Kontak Gereja**. Endpoint hanya mengembalikan nama + tautan, bukan nomor mentah.

#### Log Aktivitas
- Setiap operasi **POST/PUT/PATCH/DELETE** otomatis dicatat ke tabel `activity_log`
- Akses GET pada endpoint sensitif (`/warga`, `/keluarga`, `/users`) juga dicatat
- Data yang dicatat: waktu, method, path, HTTP status, pesan error (jika ada), body snapshot (password & data sensitif disanitasi), IP address, durasi, nama pengguna
- **Filter**: Semua / Error saja / Sukses saja, filter path
- **Klik baris** → expand detail: request body snapshot + pesan error lengkap
- Badge warna per method (POST=biru, PUT=kuning, PATCH=ungu, DELETE=merah) dan status (2xx=hijau, 4xx=oranye, 5xx=merah)
- **Auto-refresh** tiap 30 detik
- Tombol "Bersihkan Log" — hapus entri lebih dari 90 hari

#### Pengaturan
**Tab Rentang Umur Komisi:**
- Konfigurasi min/max usia dan warna per komisi (default: Anak 0–11, Pra-Remaja 12–14, Remaja 15–18, Pemuda 19–35, Dewasa 36–59, Adiyuswa ≥60)
- Edit inline dengan color picker
- Langsung memperbarui chart distribusi di Dashboard

**Tab Template Pesan:**
- Isi pesan WhatsApp untuk **Akun Baru** dan **Reset Password**; placeholder `{{nama}}`, `{{username}}`, `{{password}}`, `{{url_portal}}`, `{{role}}`, `{{kelompok}}`
- Pratinjau langsung dengan data contoh, validasi placeholder salah ketik, tombol kembalikan ke teks bawaan
- Alamat portal (`{{url_portal}}`) dari env `PORTAL_URL` (default `https://jemaat.gkjjakarta.org`)

**Tab Kontak Gereja:**
- GKJ WhatsApp Center, Kepala Kantor, Pendeta, dan Pendeta Emeritus — diinput manual, masing-masing dapat **diaktifkan/dinonaktifkan** (nonaktif tidak tampil di Hubungi)

**Tab Master Kelurahan:**
- 63 kelurahan Jakarta Timur pre-seeded (10 kecamatan: Cakung, Cipayung, Ciracas, Duren Sawit, Jatinegara, Kramat Jati, Makasar, Matraman, Pasar Rebo, Pulo Gadung)
- Tabel searchable + filter per kecamatan
- CRUD: tambah, edit, hapus
- Data dipakai untuk **autocomplete** field kelurahan di form Keluarga

---

## Tampilan Responsif (Mobile Browser)

Seluruh halaman utama (`/dashboard`, `/warga`, `/keluarga`, `/validasi-data`, `/kartu`, `/wilayah`, `/perpindahan`, `/import`, `/pengguna`, `/log`, `/pengaturan`) dan halaman autentikasi (`/login`, lupa/reset/ganti password) kini nyaman dipakai dari browser smartphone, tanpa perlu membuka `/m/...`. Perubahan ini hanya menyentuh layout/tampilan — tidak ada perubahan API, skema database, maupun hak akses.

| Area | Perilaku di layar kecil (< 768px / < 1024px) |
|---|---|
| **Navigasi** | Sidebar menjadi *drawer* geser dari kiri (di bawah 1024px), dibuka lewat tombol ☰ di bar atas; menutup otomatis saat pindah halaman |
| **Daftar data** | Tabel lebar diganti **daftar kartu** (warga, keluarga, wilayah/kelompok, validasi, perpindahan, pengguna, log, kelurahan); tabel tetap dipakai di tablet/desktop |
| **Tombol aksi** | Area ketuk minimal 44px (Detail, Edit, Telepon, Hapus, dll.); tombol ikon diberi `aria-label` |
| **Form & modal** | Modal tampil sebagai *bottom-sheet* dari bawah layar; isian satu kolom; tombol Simpan selebar layar; bar navigasi form Tambah Warga menempel di dasar layar |
| **Input** | Font 16px di HP sehingga iOS Safari tidak memperbesar layar saat mengetik; keypad angka untuk koordinat |
| **Form Tambah Warga** | Lima tab (Identitas, Keanggotaan, Kontak, Keluarga, Alamat) berbagi lebar layar; foto bisa diambil langsung dari kamera atau galeri |
| **Pencarian & filter** | Filter tersusun satu kolom; tombol Filter menjadi ikon |
| **Import Excel** | Dropzone "Ketuk untuk pilih file"; stepper muat di layar; tabel pratinjau digeser ke samping |
| **Dashboard** | Chart dan peta lebih pendek, kartu statistik menyesuaikan lebar |

Implementasi bersama: `components/layout/DashboardShell.tsx` (bar atas + drawer), `Sidebar.tsx`, serta komponen `Modal`, `Pagination`, dan `FormField` yang sudah responsif. Breakpoint memakai Tailwind standar (`sm` 640px, `md` 768px, `lg` 1024px).

> Versi ringkas `/m/...` untuk Penatua Kelompok tetap tersedia (lihat bagian berikut). Halaman `/m/[id]` dipakai oleh tautan QR dan WhatsApp kartu anggota.

---

## Aplikasi Mobile (PWA) untuk Penatua Kelompok

Antarmuka ringkas berbasis browser (`/m/...`), dirancang untuk dipakai penatua saat kunjungan rumah — bisa disimpan sebagai ikon di home screen HP (Add to Home Screen di Safari/Chrome).

| Halaman | Fungsi |
|---|---|
| `/m/login` | Login versi mobile, dengan link "Lupa password?" |
| `/m/forgot-password` | Minta link reset password (self-service) |
| `/m/reset-password` | Set password baru dari link reset yang diterima |
| `/m/warga` | Daftar warga **di kelompok penatua yang login saja** (otomatis ter-scope, di-enforce di backend) — cari nama, tap untuk detail |
| `/m/warga/baru` | Form tambah warga ringkas (6 field): nama, jenis kelamin, status keluarga, kelompok (terkunci ke kelompok penatua), status keanggotaan, WhatsApp — data masuk sebagai **Draft**, dilengkapi & divalidasi staf kantor kemudian |
| `/m/warga/[id]` | Detail + edit terbatas (status keanggotaan, WhatsApp, tanggal lahir, sakramen, alamat domisili) |
| `/m/kartu` | Cari jemaat → tampilkan kartu digital, cocok untuk verifikasi kehadiran ibadah |
| `/m/[id]` | Kartu digital publik (lihat [Halaman Publik](#halaman-publik)) |

Panduan langkah-demi-langkah untuk penatua: lihat [`docs/PANDUAN_PENATUA.md`](docs/PANDUAN_PENATUA.md).

---

## Pengujian (Testing)

Test otomatis berbasis **Vitest** di kedua workspace:

| Layer | Test Files | Tests |
|---|---|---|
| Backend (`apps/api`) | 19 | 287 (role Jemaat: pagar global, Profil Saya, whitelist, NIK, alamat KK kepala keluarga, catatan, audit, akun & WhatsApp: password acak, notifikasi, template, kontak gereja, Hubungi per role, normalisasi nomor, crypto, error handler, auth middleware/service/route, reset & ganti password, import, perpindahan service/route, cakupan dashboard per kelompok, scoping & batas tulis penatua, round-trip edit warga per peran, route dashboard, status sistem, penomoran KK) |
| Frontend (`apps/web`) | 20 | 127 (Profil Saya, payload profil, pembatasan Jemaat di ProtectedRoute, halaman Hubungi, modal Info Akun, Badge, Pagination, ResetPasswordForm, PerpindahanForm, WhatsApp perpindahan, helper Excel, helper & form koordinat, payload & alamat KK, round-trip form ↔ payload, logika versi & UpdateBanner, round-trip form Keluarga) |

```bash
npm run test --workspace=apps/api
npm run test --workspace=apps/web
npm run test:coverage --workspace=apps/api   # atau apps/web
```

Status & rencana coverage berikutnya: lihat [`QA_STATUS.md`](QA_STATUS.md).

---

## Keamanan & Kepatuhan PDP

Sistem ini dirancang untuk memenuhi ketentuan **UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)** Republik Indonesia. Data jemaat yang dikelola mencakup **data pribadi sensitif** (afiliasi keagamaan, Pasal 4 ayat 2 UU PDP), sehingga penanganannya mengikuti standar yang lebih ketat.

### Implementasi yang Telah Diterapkan (Prioritas 1)

#### 1. Enkripsi Data Sensitif at Rest
- **NIK** dienkripsi menggunakan **AES-256-ECB deterministik** sebelum disimpan ke database
- Enkripsi dilakukan di layer aplikasi (`apps/api/src/utils/crypto.ts`) — bahkan jika database diakses langsung, NIK tidak terbaca
- Format penyimpanan: `enc:<BASE64>` (kolom `nik` VARCHAR 64)
- Kunci enkripsi di-derive dari `ENCRYPTION_KEY` di `.env` menggunakan HMAC-SHA256

#### 2. Field Redaction Berbasis Role (Pasal 16)
Setiap response API otomatis meredaksi field sensitif sesuai role pengguna:

| Field | SUPERADMIN / KEPALA_KANTOR | MAJELIS / STAF_ADMIN | PENATUA_KELOMPOK | VIEWER |
|---|:---:|:---:|:---:|:---:|
| NIK | ✅ | ✅ | ❌ disembunyikan | ❌ disembunyikan |
| Koordinat GPS (lat/lng) | ✅ | ❌ disembunyikan | ❌ disembunyikan | ❌ disembunyikan |
| Alamat KTP | ✅ | ✅ | ❌ disembunyikan | ❌ disembunyikan |
| Telepon / WhatsApp / Email | ✅ | ✅ | ✅ | ❌ disembunyikan |

#### 3. Audit Trail Akses Data Pribadi (Pasal 49)
- Setiap akses ke detail warga (`GET /api/warga/:id`) dicatat ke tabel `AuditLog` dengan action **`ACCESS`**
- Data yang dicatat: userId, wargaId yang diakses, IP address, timestamp
- Memungkinkan pembuktian *siapa mengakses data siapa* saat ada permintaan dari regulator

#### 4. Field Consent & Retensi (Pasal 20 & 33)
Tiga field baru pada tabel `Warga`:
- `konsenPDP` — apakah data jemaat ini sudah ada persetujuannya
- `tanggalKonsen` — kapan persetujuan diberikan
- `retensiHingga` — batas waktu data harus dihapus/dianonimkan (relevan untuk warga meninggal/pindah)

#### 5. Sanitasi Log (Pasal 16)
Body snapshot pada `ActivityLog` secara otomatis:
- **Menghapus** field: `nik`, `tanggalLahir`, `tempatLahir`, `alamatKtp`, `alamatDomisili`, `latitude`, `longitude`, `fotoUrl`
- **Memask** field: `password`, `token`, `telepon`, `whatsapp`, `email` → diganti `***`

### Catatan Operasional Penting

> ⚠️ **JANGAN rotasi `ENCRYPTION_KEY` tanpa terlebih dahulu mendekripsi dan re-enkripsi semua NIK di database.** Rotasi kunci tanpa migrasi data akan membuat seluruh data NIK tidak terbaca.

> 🔑 **Password awal akun seed** tidak ada di repository. `npm run db:seed` membaca `SEED_ADMIN_PASSWORD` dan `SEED_PENATUA_PASSWORD` dari environment (minimal 12 karakter). Ganti password superadmin segera setelah login pertama.

> 🔐 **Production:** Gunakan `openssl rand -hex 32` untuk generate `ENCRYPTION_KEY` yang kuat. Simpan di secrets manager (AWS Secrets Manager, Vault, dll.) — JANGAN di file `.env` yang bisa masuk ke repository.

> 🚀 **Deploy ke VPS:** jalankan `bash deploy/2-deploy.sh prod` **dari root repo di server**, jangan `git pull`/`npm install`/`npm audit fix` manual sebagai root — itu membuat file di `.git`, `.next`, dan `package-lock.json` jadi milik root dan membuat deploy berikutnya gagal. Script sudah memperbaiki kepemilikan `.git`/`.next`/`dist` dan mengembalikan `package-lock.json` secara otomatis. Script juga membuat backup database (`pg_dump`) otomatis ke `/var/backups/gkjj` sebelum `prisma db push` dan membatalkan deploy jika backup gagal (lihat [`DEPLOY.md`](DEPLOY.md)); salin backup berkala ke luar VPS.

> 🗓️ **Rilis Sprint 10–11 ke produksi (terjadwal, belum dideploy):** Sprint 10 (akun dari warga, notifikasi WhatsApp, Kontak Gereja, Hubungi) dan Sprint 11 (role Jemaat, Profil Saya) sudah ada di branch `main` tetapi **belum dideploy**. Karena aplikasi sedang dipakai entry data manual, deploy dijadwalkan saat aplikasi tidak digunakan. Perubahan skema **hanya menambah** (4 kolom/tabel baru, nilai enum `JEMAAT`) dan dijalankan oleh `prisma db push` di `deploy/2-deploy.sh` setelah backup otomatis; data lama tidak berubah. Setelah deploy: isi **Pengaturan → Kontak Gereja** dan **Template Pesan** (template bawaan dibuat otomatis saat pertama dibuka), lalu centang "boleh ditampilkan ke jemaat" pada penatua yang bersedia. Alamat portal di pesan WhatsApp memakai env opsional `PORTAL_URL` (default `https://jemaat.gkjjakarta.org`).

> 🛡️ **Keamanan dependensi:** `npm audit --omit=dev` menyisakan temuan yang menunggu upgrade besar (Next 16 untuk `postcss`, Prisma 8 untuk `deepmerge-ts`) serta `uuid` moderate bawaan `exceljs` (fungsi yang rentan tidak dipakai). Hindari `npm audit fix --force` — itu menurunkan `eslint-config-next` dan memaksa Tailwind 4. Format Excel yang didukung hanya `.xlsx` (SheetJS `xlsx` sudah diganti `exceljs`).

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Frontend** | Next.js 15, React 19, Tailwind CSS, TanStack Query, React Hook Form, Zod |
| **Grafik** | Recharts |
| **Peta** | React-Leaflet + OpenStreetMap (gratis, tanpa API key) |
| **QR Code** | qrcode |
| **Excel** | ExcelJS (`exceljs`) — baca/tulis `.xlsx` |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Build Tool** | Turborepo |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |

---

## Struktur Proyek

> Diagram arsitektur (komponen, alur deploy, autentikasi): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

```
Database-Warga-GKJJ/
├── apps/
│   ├── api/                        # Backend Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Skema database
│   │   │   └── seed-master.ts      # Seed kelurahan & komisi config
│   │   ├── tests/                  # Vitest — unit & route test (supertest)
│   │   └── src/
│   │       ├── middleware/
│   │       │   ├── auth.ts         # JWT authentication
│   │       │   ├── errorHandler.ts # Prisma & Zod error mapping
│   │       │   └── activityLogger.ts # Request logging middleware
│   │       ├── routes/
│   │       │   ├── auth.ts         # Login + forgot/reset password
│   │       │   ├── warga.ts        # + PATCH /bulk-status (Validasi Data)
│   │       │   ├── keluarga.ts
│   │       │   ├── wilayah.ts
│   │       │   ├── kelompok.ts
│   │       │   ├── dashboard.ts    # Stats, sebaran, jemaat baru, komisi chart, peta
│   │       │   ├── pengaturan.ts   # Master kelurahan & komisi config
│   │       │   ├── import.ts       # Batch import Excel (warga & pengguna)
│   │       │   ├── users.ts        # Manajemen pengguna + password acak + notifikasi WhatsApp
│   │       │   ├── hubungi.ts      # Menu Hubungi (semua role)
│   │       │   ├── profil.ts       # Profil Saya (khusus role JEMAAT)
│   │       │   ├── logs.ts         # Activity log
│   │       │   ├── perpindahan.ts  # CRUD + approve/validate + surat.pdf + kirim-email
│   │       │   └── public.ts       # Endpoint publik (tanpa auth)
│   │       ├── services/
│   │       │   ├── warga.service.ts # + sanitizeForRole, bulkValidasiWarga
│   │       │   ├── keluarga.service.ts
│   │       │   ├── auth.service.ts  # + forgot/reset password
│   │       │   ├── perpindahan.service.ts # 2 tahap sign-off (approve → validate)
│   │       │   ├── surat.service.ts # Generate PDF surat perpindahan (pdfkit)
│   │       │   └── email.service.ts # Reset password & surat perpindahan (nodemailer)
│   │       └── utils/
│   │           └── crypto.ts       # AES-256 enkripsi/dekripsi NIK (PDP)
│   └── web/                        # Frontend Next.js
│       └── src/
│           ├── app/
│           │   ├── (auth)/login/           # Halaman login
│           │   ├── (auth)/forgot-password/ # Minta link reset password
│           │   ├── (auth)/reset-password/  # Set password baru dari link reset
│           │   ├── (dashboard)/    # Halaman yang memerlukan auth
│           │   │   ├── dashboard/  # Dashboard + chart + peta
│           │   │   ├── warga/      # Data warga + wizard
│           │   │   ├── keluarga/   # Data keluarga + detail
│           │   │   ├── validasi-data/ # Validasi/batalkan validasi massal
│           │   │   ├── kartu/      # Kartu anggota + QR
│           │   │   ├── wilayah/    # Master wilayah & kelompok
│           │   │   ├── import/     # Wizard import Excel (warga & pengguna)
│           │   │   ├── pengguna/   # Manajemen pengguna + Import Pengguna
│           │   │   ├── log/        # Log aktivitas
│           │   │   ├── hubungi/    # Menu Hubungi (wa.me)
│           │   │   ├── profil-saya/ # Profil Saya (role Jemaat)
│           │   │   └── pengaturan/ # Pengaturan sistem (komisi, kelurahan, template pesan, kontak gereja)
│           │   ├── kebijakan-cookie/  # Kebijakan cookie (publik, tanpa auth)
│           │   ├── kebijakan-privasi/ # Kebijakan privasi (publik, tanpa auth)
│           │   └── m/              # PWA mobile untuk Penatua Kelompok
│           │       ├── login/      # Login mobile
│           │       ├── forgot-password/ # Reset password mobile
│           │       ├── reset-password/
│           │       ├── (app)/warga/ # Daftar, tambah, edit warga (kelompok sendiri)
│           │       ├── (app)/kartu/ # Cari & tampilkan kartu digital
│           │       └── [id]/       # Kartu digital publik (tanpa auth)
│           ├── components/
│           │   ├── layout/
│           │   │   ├── DashboardShell.tsx # Bar atas mobile + drawer sidebar
│           │   │   ├── Sidebar.tsx # Navigasi bergroup + v1.0 badge (drawer di mobile)
│           │   │   ├── ProtectedRoute.tsx
│           │   │   └── CookieConsentBanner.tsx # Banner consent site-wide (localStorage)
│           │   └── ui/             # Modal, Badge, Pagination, FormField
│           └── hooks/              # Custom React hooks per domain
├── database/
├── docs/                           # PANDUAN_PRODUK.md, PANDUAN_PENATUA.md, dll.
├── sprints/                        # Sprint plan untuk eksekusi via skill /sprint
├── docker-compose.yml
└── package.json
```

---

## Persyaratan

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker Desktop** (untuk PostgreSQL lokal)

---

## Instalasi & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/pwdaloe/Database-Warga-GKJJ.git
cd Database-Warga-GKJJ
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Database

```bash
docker-compose up -d
```

Menjalankan **PostgreSQL** di `localhost:5435` dan **Redis** di `localhost:6380` (6379 sering bentrok dengan Redis Homebrew lokal; API saat ini belum memakai Redis) (bukan 5432 default — lihat komentar di `docker-compose.yml`, di-remap karena port 5432 sudah dipakai instance PostgreSQL lokal lain, dan 5433/5434 dipakai project lain).

### 4. Konfigurasi Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` — ganti nilai berikut:
- `JWT_SECRET` — string acak minimal 32 karakter
- `ENCRYPTION_KEY` — string hex 64 karakter, generate dengan: `openssl rand -hex 32`

### 5. Push Schema & Seed Data

```bash
cd apps/api
npx prisma db push
npx tsx prisma/seed-master.ts   # Seed kelurahan Jakarta Timur + komisi config
SEED_ADMIN_PASSWORD='...' SEED_PENATUA_PASSWORD='...' npm run db:seed   # superadmin + akun penatua (password wajib dari env)
```

Akun setelah seed:

| Field | Value |
|---|---|
| Username | `superadmin` |
| Password | nilai `SEED_ADMIN_PASSWORD` yang Anda set saat menjalankan seed |

> **Ganti password segera setelah login pertama!**

### 6. Jalankan Development Server

```bash
npm run dev
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **Health Check** | http://localhost:4000/health |

---

## Konfigurasi Environment

### `apps/api/.env`

```env
DATABASE_URL="postgresql://gkjj:gkjj_dev_password@localhost:5435/gkjj_db"
PORT=4000
NODE_ENV=development
JWT_SECRET="ganti-dengan-random-string-minimal-32-karakter"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"

# Enkripsi field sensitif NIK — UU PDP No. 27/2022
# Generate: openssl rand -hex 32
ENCRYPTION_KEY="ganti-dengan-random-hex-64-karakter"

# Email (reset password) — kosongkan SMTP_HOST untuk mode dev (email di-log ke console)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="GKJJ <no-reply@gkjjakarta.org>"
APP_URL="http://localhost:3000"
```

> ⚠️ `ENCRYPTION_KEY` wajib diisi. Tanpa nilai ini, server akan gagal start saat ada operasi baca/tulis NIK.
> `SMTP_HOST` kosong = mode dev (link reset password di-log ke console, tidak benar-benar terkirim). Isi kredensial SMTP asli untuk production.

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## Database

### Model Utama

| Model | Keterangan |
|---|---|
| `Warga` | Biodata individu jemaat — NIK disimpan terenkripsi (AES-256). Field PDP: `konsenPDP`, `tanggalKonsen`, `retensiHingga` |
| `Keluarga` | Data kepala keluarga beserta alamat rumah tangga |
| `Kelompok` | Unit terkecil organisasi gereja |
| `Wilayah` | Kumpulan beberapa kelompok |
| `User` | Akun pengguna sistem |
| `AuditLog` | Log perubahan & akses data (CREATE, UPDATE, DELETE, APPROVE, VALIDATE, IMPORT, **ACCESS**) |
| `Perpindahan` | Pencatatan pindah masuk/keluar/meninggal jemaat — 2 tahap sign-off (`approvedBy`/`validatedBy` mengacu ke `User`) |
| `ActivityLog` | Log seluruh request API mutasi + GET sensitif, beserta status & error |
| `ImportLog` | Riwayat import Excel |
| `MasterKelurahan` | Master data kelurahan (autocomplete alamat) |
| `KomisiConfig` | Konfigurasi rentang usia per komisi untuk chart |

### Perintah Database

```bash
npx prisma db push          # Sync schema ke database
npx prisma db studio        # Buka Prisma Studio GUI (port 5555)
npx prisma generate         # Regenerate Prisma Client
npx tsx prisma/seed-master.ts  # Seed data master
```

---

## API Endpoints

> Referensi lengkap (request/response body, error code per endpoint): [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)

Base URL: `http://localhost:4000/api`

Semua endpoint (kecuali `/auth/login` dan `/public/*`) memerlukan header:
```
Authorization: Bearer <token>
```

### Autentikasi
| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/auth/login` | Login, mendapatkan JWT |
| `GET` | `/auth/me` | Data user yang sedang login |
| `POST` | `/auth/change-password` | Ganti password (menghapus flag wajib-ganti-password) |
| `POST` | `/auth/logout` | Logout |
| `POST` | `/auth/forgot-password` | Minta link reset password (rate limit 5/15 menit, tanpa auth) |
| `POST` | `/auth/reset-password` | Set password baru dari token reset (tanpa auth) |

### Warga
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/warga` | Daftar warga (filter: search, kelompok, wilayah, status, jenis kelamin, dataStatus) |
| `GET` | `/warga/:id` | Detail warga beserta keluarga |
| `POST` | `/warga` | Tambah warga baru (opsional: buat KK baru via `newKeluarga`) |
| `PUT` | `/warga/:id` | Update data warga |
| `DELETE` | `/warga/:id` | Hapus warga |
| `PATCH` | `/warga/bulk-status` | Validasi/batalkan validasi massal (stamp `validatedBy`/`validatedAt`) — Superadmin/Kepala Kantor/Staf Admin |

### Keluarga
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/keluarga` | Daftar keluarga |
| `GET` | `/keluarga/:id` | Detail keluarga + anggota |
| `POST` | `/keluarga` | Tambah keluarga |
| `PUT` | `/keluarga/:id` | Update keluarga |
| `DELETE` | `/keluarga/:id` | Hapus keluarga |
| `POST` | `/keluarga/:id/approve` | Approve keluarga |

### Perpindahan Jemaat
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/perpindahan` | Daftar perpindahan (filter: `jenis`, `search`, paginasi) |
| `GET` | `/perpindahan/:id` | Detail perpindahan |
| `POST` | `/perpindahan` | Catat perpindahan baru — Superadmin/Kepala Kantor/Majelis/Staf Admin |
| `PUT` | `/perpindahan/:id` | Update data perpindahan |
| `POST` | `/perpindahan/:id/approve` | Tahap 1 — persetujuan awal (belum mengubah `statusKeanggotaan`) — Superadmin/Kepala Kantor/Majelis |
| `POST` | `/perpindahan/:id/validate` | Tahap 2 — finalisasi, mengubah `warga.statusKeanggotaan` sesuai jenis — Superadmin/Kepala Kantor |
| `DELETE` | `/perpindahan/:id` | Hapus perpindahan — Superadmin/Kepala Kantor |
| `GET` | `/perpindahan/:id/surat.pdf` | Generate/preview PDF Surat Keterangan Pindah/Meninggal |
| `POST` | `/perpindahan/:id/kirim-email` | Kirim PDF surat ke email warga (hanya setelah divalidasi) |

### Master Data
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET/POST/PUT` | `/wilayah` | CRUD wilayah |
| `PATCH` | `/wilayah/:id/toggle` | Toggle aktif/nonaktif |
| `DELETE` | `/wilayah/:id` | Hapus (jika tidak ada KK) |
| `GET/POST/PUT` | `/kelompok` | CRUD kelompok |
| `PATCH` | `/kelompok/:id/toggle` | Toggle aktif/nonaktif |

### Dashboard
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/dashboard/stats` | Total warga, keluarga, draft + `kelompok` (terisi untuk Penatua Kelompok). Semua endpoint `/dashboard/*` dibatasi ke kelompok penatua |
| `GET` | `/dashboard/komisi-stats` | Distribusi anggota per komisi |
| `GET` | `/dashboard/map` | Koordinat warga + No. Induk/No. Anggota (filter: `?kelurahan=`) |

### Pengaturan
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/pengaturan/kelurahan` | Daftar master kelurahan (`?search=`) |
| `POST/PUT/DELETE` | `/pengaturan/kelurahan/:id` | CRUD kelurahan |
| `GET` | `/pengaturan/komisi` | Daftar komisi config |
| `PUT` | `/pengaturan/komisi/:id` | Update rentang usia komisi |
| `GET/PUT` | `/pengaturan/template-pesan(/:kode)` | Template pesan WhatsApp (`AKUN_BARU`, `RESET_PASSWORD`) — Superadmin/Kepala Kantor |
| `POST` | `/pengaturan/template-pesan/preview` · `/:kode/default` | Pratinjau dengan data contoh · kembalikan ke bawaan |
| `GET/POST/PUT/DELETE` | `/pengaturan/kontak-gereja(/:id)` | Kontak WA Center/Kepala Kantor/Pendeta/Emeritus; `PATCH /:id/toggle` aktif/nonaktif |

### Sistem
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET/POST/PUT` | `/users` | CRUD pengguna |
| `PATCH` | `/users/:id/toggle` | Toggle aktif/nonaktif |
| `POST` | `/users/:id/reset-password` | Reset password pengguna (kosong → acak, respons `passwordBaru`) |
| `POST` | `/users/:id/notifikasi` | Render pesan WhatsApp + tautan `wa.me`, catat log tersamar |
| `GET` | `/hubungi` | Kontak untuk menu Hubungi — semua role login |
| `GET/PUT` | `/profil-saya` | Data diri sendiri (khusus role Jemaat; id dari akun login, whitelist field, perubahan masuk antrean Validasi Data) |
| `GET` | `/logs` | Log aktivitas (filter: status, path, userId) |
| `DELETE` | `/logs` | Hapus log lama (`?days=90`) |
| `POST` | `/import/warga` | Import batch warga dari Excel (max 200 baris per call) |
| `POST` | `/import/pengguna` | Import batch pengguna dari Excel (max 200 baris per call) — Superadmin/Kepala Kantor |

### Publik (tanpa autentikasi)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/public/member/:id` | Info anggota terbatas untuk kartu digital |
| `GET` | `/system/status` | `{ maintenance, message, version }` untuk bar pembaruan aplikasi (baca file `.deploy/*`, limiter 120/menit) |

---

## Role & Hak Akses

| Role | Dashboard | Data Warga | Data Keluarga | Validasi Data | Kartu Anggota | Wilayah | Import | Pengguna | Log | Pengaturan |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `SUPERADMIN` | ✓ | ✓ penuh | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `KEPALA_KANTOR` | ✓ | ✓ penuh | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `MAJELIS` | ✓ | ✓ ¹ | ✓ | — | ✓ | ✓ (baca) | — | — | — | — |
| `STAF_ADMIN` | ✓ | ✓ ¹ | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| `PENATUA_KELOMPOK` | ✓ | ✓ (kelompoknya) ² | ✓ (kelompoknya) | lihat saja (kelompoknya) | ✓ | — | — | — | — | — |
| `VIEWER` | ✓ | — | — | — | — | — | — | — | — | — |

**Catatan field redaction (UU PDP):**
> ¹ **MAJELIS / STAF_ADMIN** — melihat semua field, termasuk koordinat rumah (latitude/longitude)  
> ² **PENATUA_KELOMPOK** — NIK dan Alamat KTP disembunyikan; koordinat rumah boleh dilihat dan diisi. Saat mengedit, nilai NIK/Alamat KTP yang kosong **tidak menimpa** data tersimpan (bisa mengisi/mengubah, tidak bisa menghapus)  
> **VIEWER** — NIK, Alamat KTP, Koordinat GPS, Telepon, WhatsApp, dan Email disembunyikan (read-only); peta Dashboard tidak ditampilkan dan `GET /dashboard/map` mengembalikan daftar kosong
> **JEMAAT** — di luar tabel di atas: hanya **Profil Saya** (data dirinya sendiri) dan **Hubungi**; seluruh endpoint lain ditolak oleh pagar global (`jemaatGuard`). Tidak melihat data warga lain, dashboard, maupun menu Sistem

**Scoping Penatua Kelompok (di-enforce di backend, fail-closed):**
- Baca: daftar/detail Warga & Keluarga, statistik, chart, dan peta Dashboard hanya untuk kelompoknya. Penatua yang **belum punya kelompok** tidak melihat data apa pun (bukan semua data) dan mendapat `403` pada detail.
- Tulis: penatua hanya dapat menambah warga ke KK/kelompok miliknya, membuat/mengubah KK di kelompoknya, dan tidak dapat memindahkan warga atau KK ke kelompok lain (`403`).

---

## Halaman Publik

### Kartu Digital Anggota — `/m/[id]`

Halaman **tanpa login** yang menampilkan kartu keanggotaan digital saat QR code di-scan.

Menampilkan:
- Logo GKJ Jakarta
- Foto atau avatar inisial
- Nama lengkap, nama panggilan
- Nomor anggota (prioritas nomor induk)
- Kelompok, wilayah, penatua
- Status keanggotaan
- Badge Baptis & Sidi

> **Catatan privasi:** Halaman ini TIDAK menampilkan NIK, email, nomor telepon, atau data sensitif lainnya.

**Roadmap QR & Absensi:**
Fondasi URL QR (`{app}/m/{wargaId}`) dirancang untuk mendukung fitur absensi kehadiran ibadah di masa mendatang:
- Anggota scan QR acara → check-in mandiri
- Penatua scan kartu anggota → catat kehadiran
- Laporan kehadiran per acara dan per kelompok

### Kebijakan Cookie & Privasi — `/kebijakan-cookie`, `/kebijakan-privasi`

Halaman **tanpa login**, sesuai UU No. 27/2022 tentang Perlindungan Data Pribadi:
- `/kebijakan-cookie` — kategori cookie & local storage yang dipakai, dasar pemrosesan, kontak
- `/kebijakan-privasi` — data yang dikumpulkan, dasar pemrosesan, 7 hak subjek data (Pasal 5–12 UU PDP), keamanan & retensi, kontak
- Ditautkan dari footer halaman login desktop (`/login`) dan mobile (`/m/login`)

**Cookie Consent Banner** — muncul di kunjungan pertama (site-wide), pilihan "Hanya Esensial" atau "Terima Semua" disimpan di `localStorage` browser pengguna.

---

## Kontak & Bantuan

Untuk pertanyaan teknis atau bantuan penggunaan sistem:

**Email Helpdesk:** [gkjjkeu@outlook.com](mailto:gkjjkeu@outlook.com)

---

## Lisensi

Proyek ini dikembangkan untuk keperluan internal **GKJJ (Gereja Kristen Jawa Jakarta)**.  
Hak cipta © 2026 GKJJ. Seluruh hak dilindungi.
