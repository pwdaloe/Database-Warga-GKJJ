# Panduan Produk — Sistem Informasi Jemaat GKJJ
## Database Warga Gereja Kristen Jawa Jakarta

**Versi Dokumen:** 1.0  
**Tanggal:** Juni 2026  
**Dibuat untuk:** Product Owner & Tim Fungsional  

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Pengguna & Hak Akses](#2-pengguna--hak-akses)
3. [Fitur Aplikasi — Step by Step](#3-fitur-aplikasi--step-by-step)
4. [Tahapan Entry Data Awal](#4-tahapan-entry-data-awal)
5. [Proses Cleansing & Validasi Data](#5-proses-cleansing--validasi-data)
6. [Prosedur Import Data dari Excel](#6-prosedur-import-data-dari-excel)
7. [Aplikasi Mobile untuk Penatua](#7-aplikasi-mobile-untuk-penatua)
8. [Prosedur Laporan Bug](#8-prosedur-laporan-bug)
9. [Prosedur Pengajuan Fitur Baru](#9-prosedur-pengajuan-fitur-baru)
10. [Kontak & Eskalasi](#10-kontak--eskalasi)

---

## 1. Gambaran Umum

### Apa itu Sistem Informasi Jemaat GKJJ?

Sistem Informasi Jemaat GKJJ adalah aplikasi berbasis web yang dirancang untuk mengelola data seluruh jemaat Gereja Kristen Jawa Jakarta secara terpusat, akurat, dan aman.

### Masalah yang Diselesaikan

| Kondisi Sebelumnya | Kondisi Sesudah |
|---|---|
| Data tersebar di Excel, sulit dikonsolidasi | Satu database terpusat, dapat diakses tim |
| Tidak ada kontrol akses per wilayah/kelompok | Setiap penatua hanya akses data kelompoknya |
| Kartu anggota cetak manual | Kartu digital dengan QR code, siap cetak |
| Tidak ada audit trail perubahan data | Setiap perubahan tercatat dengan siapa & kapan |
| Data sensitif (NIK) tidak terproteksi | Enkripsi AES-256, sesuai UU PDP No. 27/2022 |

### Lingkungan Akses

- **Desktop (Admin & Staf):** https://jemaat.gkjjakarta.org
- **Mobile (Penatua Kelompok):** https://jemaat.gkjjakarta.org/m/warga
- **Kartu Digital Publik:** https://jemaat.gkjjakarta.org/m/[nomor-anggota]

---

## 2. Pengguna & Hak Akses

### Struktur Role

| Role | Jabatan | Deskripsi Akses |
|---|---|---|
| **SUPERADMIN** | Admin Sistem | Akses penuh seluruh fitur dan pengaturan |
| **KEPALA_KANTOR** | Kepala Kantor Gereja | Akses penuh termasuk manajemen pengguna |
| **MAJELIS** | Majelis Gereja | Baca & edit semua data, tidak bisa hapus |
| **STAF_ADMIN** | Staf Administrasi | Input & edit data, akses import Excel |
| **PENATUA_KELOMPOK** | Penatua Wilayah/Kelompok | Hanya data kelompoknya sendiri, via mobile |
| **VIEWER** | Tamu Terbatas | Lihat dashboard saja, tidak ada akses data sensitif |

### Kebijakan Data Sensitif (UU PDP)

- **NIK** hanya terlihat oleh Superadmin & Kepala Kantor
- **Koordinat rumah** tidak terlihat oleh Penatua Kelompok dan Viewer
- **Alamat KTP** tidak terlihat oleh Penatua Kelompok dan Viewer
- **Nomor telepon & email** tidak terlihat oleh Viewer

---

## 3. Fitur Aplikasi — Step by Step

### 3.1 Dashboard

**Tujuan:** Memberikan gambaran cepat kondisi jemaat.

**Cara menggunakan:**
1. Login → otomatis masuk ke halaman Dashboard
2. Baca ringkasan: Total Warga, Total Keluarga, Kelompok Aktif, Data Perlu Validasi
3. Klik kartu statistik untuk navigasi langsung ke halaman terkait
4. Lihat Chart Komisi — distribusi jemaat berdasarkan usia (Anak, Remaja, Pemuda, Dewasa, Adiyuswa)
5. Lihat Peta Lokasi — pin lokasi rumah warga (hanya yang sudah ada koordinat GPS)

---

### 3.2 Data Warga

**Tujuan:** Mengelola biodata lengkap setiap anggota jemaat.

**Cara melihat daftar warga:**
1. Klik menu **Data Warga** di sidebar
2. Gunakan kolom pencarian untuk cari nama, nomor anggota, NIK, atau nomor telepon
3. Gunakan tombol **Filter** untuk saring per wilayah, kelompok, status keanggotaan, gender, atau status dokumen

**Cara menambah warga baru:**
1. Klik tombol **Tambah Warga** (pojok kanan atas)
2. Isi **Tab Identitas:** nama lengkap, foto (opsional), NIK, tempat/tanggal lahir
3. Isi **Tab Keanggotaan:** status dalam keluarga, status keanggotaan, data baptis & sidi
4. Isi **Tab Kontak:** telepon, WhatsApp, email, pendidikan, pekerjaan
5. Isi **Tab Keluarga:**
   - Jika **Kepala KK baru:** pilih kelompok, isi alamat → KK dibuat otomatis
   - Jika **Anggota keluarga:** cari nama kepala keluarga → pilih keluarga yang ada
6. Isi **Tab Alamat:** alamat KTP, alamat domisili (jika berbeda), koordinat GPS (opsional)
7. Klik **Simpan & Lanjutkan**
8. Jika Kepala KK → Wizard langkah 2 muncul: tambah anggota keluarga satu per satu
9. Klik **Selesai**

> **Catatan:** Warga baru masuk status **Draft** secara otomatis dan perlu divalidasi.

**Status Dokumen (alur validasi):**

```
DRAFT → VALIDASI → AKTIF → TIDAK_AKTIF
```

| Status | Artinya |
|---|---|
| Draft | Data baru masuk, belum diverifikasi |
| Validasi | Sedang dalam proses pengecekan staf |
| Aktif | Data sudah valid dan resmi |
| Tidak Aktif | Data dinonaktifkan (pindah, meninggal, dll.) |

---

### 3.3 Data Keluarga

**Tujuan:** Mengelola unit keluarga (Kartu Keluarga) dalam jemaat.

**Cara melihat & mengelola:**
1. Klik menu **Data Keluarga**
2. Setiap baris adalah satu KK — tampil nomor KK, kepala keluarga, kelompok, jumlah anggota
3. Klik **Lihat Detail** → halaman detail KK: info kepala keluarga, daftar anggota, edit alamat
4. Edit alamat langsung di halaman detail (autocomplete kelurahan Jakarta Timur tersedia)
5. Hapus KK hanya bisa dilakukan jika tidak ada anggota terdaftar

---

### 3.4 Kartu Anggota

**Tujuan:** Cetak atau bagikan kartu keanggotaan digital jemaat.

**Cara menggunakan:**
1. Klik menu **Kartu Anggota**
2. Ketik minimal 2 huruf nama jemaat di kolom pencarian
3. Pilih jemaat dari hasil pencarian
4. Kartu digital muncul — berisi: foto/avatar, nama, nomor induk, kelompok, wilayah, penatua, status, badge baptis & sidi, QR code
5. **Opsi aksi:**
   - **Cetak** → buka jendela print (format 85.6 × 72mm, siap cetak fisik)
   - **Kirim via WhatsApp** → buka WhatsApp dengan pesan otomatis berisi info + link kartu
   - **Buka Data Warga** → navigasi ke biodata lengkap

**QR Code Kartu:**
- QR mengarah ke halaman publik: `https://jemaat.gkjjakarta.org/m/[id]`
- Halaman publik bisa diakses siapa saja tanpa login
- **Tidak menampilkan** NIK, email, atau nomor telepon (proteksi privasi)

---

### 3.5 Wilayah & Kelompok

**Tujuan:** Mengelola struktur organisasi wilayah dan kelompok jemaat.

**Struktur organisasi:**
```
GKJJ
├── Wilayah A
│   ├── Kelompok Cempaka Baru (Penatua: Pramudya Hardjito)
│   ├── Kelompok Utan Kayu
│   └── ...
├── Wilayah B
│   └── ...
└── Wilayah C
    └── ...
```

**Cara mengelola:**
1. Klik menu **Wilayah & Kelompok**
2. Klik wilayah untuk expand/collapse daftar kelompok
3. Edit nama wilayah: klik ikon pensil di baris wilayah
4. Nonaktifkan/Aktifkan wilayah: klik tombol toggle
5. Tambah kelompok baru: klik tombol **+ Tambah Kelompok** di dalam card wilayah
6. Hapus wilayah: hanya bisa jika tidak ada KK yang terdaftar

---

### 3.6 Import Data dari Excel

*(Lihat panduan lengkap di Bab 6)*

**Ringkasan:** Wizard 5 langkah untuk memasukkan data ratusan warga sekaligus dari file Excel.

---

### 3.7 Manajemen Pengguna

**Tujuan:** Mengatur akun pengguna sistem (hanya Superadmin & Kepala Kantor).

**Cara menambah pengguna baru:**
1. Klik menu **Pengguna** → klik **Tambah Pengguna**
2. Isi nama lengkap, username (tanpa spasi), email, password (min. 8 karakter)
3. Pilih role sesuai jabatan
4. Pilih kelompok (wajib untuk Penatua Kelompok)
5. Klik **Simpan**

**Manajemen akun:**
- **Reset Password:** klik ikon kunci di baris pengguna → isi password baru
- **Nonaktifkan Akun:** klik ikon on/off → akun tidak bisa login
- Akun yang dinonaktifkan tidak dihapus dari sistem (riwayat terjaga)

> **Penting:** Username tidak boleh mengandung spasi. Gunakan format: `nama.kelompok` atau `inisial_jabatan`

---

### 3.8 Log Aktivitas

**Tujuan:** Audit trail semua operasi di sistem (diperlukan untuk kepatuhan UU PDP).

**Informasi yang dicatat:**
- Waktu operasi (timestamp)
- Siapa yang melakukan (nama pengguna)
- Operasi apa (tambah/ubah/hapus/akses)
- Di halaman mana (path API)
- Status berhasil/gagal
- IP address

**Cara menggunakan:**
1. Klik menu **Log Aktivitas**
2. Filter: Semua / Error saja / Sukses saja
3. Klik baris log untuk melihat detail (data snapshot & pesan error)
4. Log auto-refresh tiap 30 detik
5. **Bersihkan Log:** hapus entri lebih dari 90 hari (untuk menjaga performa)

---

### 3.9 Pengaturan Sistem

**Sub-menu 1 — Rentang Usia Komisi:**
- Konfigurasi batas usia per komisi (Anak, Pra-Remaja, Remaja, Pemuda, Dewasa, Adiyuswa)
- Perubahan langsung memperbarui chart di Dashboard

**Sub-menu 2 — Master Kelurahan:**
- 63 kelurahan Jakarta Timur sudah tersedia (pre-loaded)
- Tambah kelurahan di luar Jakarta Timur jika diperlukan
- Data digunakan untuk autocomplete field alamat saat input keluarga

---

## 4. Tahapan Entry Data Awal

Panduan ini untuk tim yang akan memasukkan data jemaat pertama kali ke sistem.

### Fase 1 — Persiapan (Sebelum Entry)

**Langkah 1: Siapkan struktur master data**
1. Login sebagai Superadmin
2. Verifikasi data Wilayah & Kelompok sudah lengkap (3 wilayah, 24 kelompok)
3. Jika ada kelompok baru, tambahkan terlebih dahulu melalui menu Wilayah & Kelompok

**Langkah 2: Siapkan akun pengguna**
1. Buat akun untuk setiap Staf Admin yang akan melakukan entry
2. Buat akun untuk setiap Penatua Kelompok
3. Pastikan setiap Penatua sudah ditautkan ke kelompok yang benar

**Langkah 3: Siapkan file Excel**
Lihat format yang diperlukan di Bab 6. Pastikan kolom minimum tersedia:
- Nama Lengkap
- Jenis Kelamin (L/P)
- Kelompok (kode atau nama kelompok)
- Status dalam Keluarga
- Nomor Keluarga (untuk mengelompokkan anggota satu KK)

---

### Fase 2 — Entry Data

**Pilihan A — Import Massal via Excel** *(disarankan untuk data besar)*
- Cocok untuk: 50+ warga
- Waktu: ~1-2 jam per 500 data
- Lihat panduan lengkap di Bab 6

**Pilihan B — Entry Manual satu per satu** *(untuk data kecil atau data susulan)*
- Cocok untuk: kurang dari 50 warga
- Gunakan form **Tambah Warga** di menu Data Warga
- Mulai dari Kepala KK → lanjut ke anggota keluarga (wizard otomatis)

**Urutan entry yang disarankan:**
1. Entry data per kelompok (agar mudah dikontrol)
2. Mulai dari Kepala KK di setiap keluarga
3. Lanjutkan dengan anggota (Istri, Anak, dll.)
4. Lengkapi data sakramen (Baptis & Sidi)
5. Lengkapi data kontak (WhatsApp wajib jika ada)

---

### Fase 3 — Verifikasi Pasca Entry

Setelah entry selesai, lakukan pengecekan:

- [ ] Jumlah total warga sesuai data sumber
- [ ] Tidak ada nama yang terduplikasi
- [ ] Setiap warga sudah terhubung ke keluarga (kelompok)
- [ ] Data Baptis & Sidi terisi untuk yang sudah menjalankan
- [ ] NIK diisi untuk warga yang datanya tersedia
- [ ] Nomor WhatsApp diisi untuk warga yang bisa dihubungi

---

## 5. Proses Cleansing & Validasi Data

### 5.1 Mengapa Data Perlu Di-cleansing?

Data dari Excel/catatan lama sering mengandung:
- Nama yang tidak konsisten (ejaan berbeda, gelar tidak seragam)
- NIK yang salah ketik (harus 16 digit)
- Nomor telepon format beragam
- Status yang tidak diperbarui (warga meninggal masih Aktif)
- Duplikasi data (satu warga masuk dua kali)

### 5.2 Alur Status Dokumen

Setiap warga memiliki **Status Dokumen** yang mencerminkan kualitas datanya:

```
┌─────────┐     Staf verifikasi     ┌──────────┐     Majelis/Admin     ┌───────┐
│  DRAFT  │ ──────────────────────► │ VALIDASI │ ──────────────────────► │ AKTIF │
└─────────┘                         └──────────┘                         └───────┘
     ▲                                                                        │
     │                                                             Jika tidak aktif
     └─────────────────────────────────────────────────────────── ┌────────────────┐
                                                                   │  TIDAK AKTIF   │
                                                                   └────────────────┘
```

### 5.3 Panduan Cleansing per Field

**Nama Lengkap:**
- Gunakan huruf kapital di awal setiap kata
- Hilangkan gelar akademik dari field nama (simpan di catatan jika perlu)
- Contoh BENAR: `Budi Santoso`, `Maria Yuliana`
- Contoh SALAH: `BUDI SANTOSO`, `dr. Maria Yuliana, M.Kes`

**NIK:**
- Harus tepat 16 digit angka
- Tidak boleh ada spasi atau tanda hubung
- Verifikasi dengan KTP fisik jika ragu

**Nomor WhatsApp/Telepon:**
- Format standar: `08XXXXXXXXXX` (tanpa tanda hubung)
- Alternatif: `628XXXXXXXXXX` (format internasional)
- Satu nomor per field (telepon & WhatsApp bisa berbeda)

**Status Keanggotaan:**
- `AKTIF` — jemaat aktif mengikuti kegiatan gereja
- `KATEKUMEN` — sedang mengikuti katekisasi
- `NON_AKTIF` — tidak aktif, masih terdaftar
- `PINDAH_KELUAR` — resmi pindah ke gereja lain (lampirkan nomor surat)
- `MENINGGAL` — sudah meninggal dunia (isi tanggal jika diketahui)

**Status Baptis & Sidi:**
- Centang `Sudah Baptis` hanya jika sudah baptis di gereja
- Centang `Sudah Sidi` hanya jika sudah sidi
- Isi tanggal dan tempat jika data tersedia

### 5.4 Penanganan Data Duplikat

Jika ditemukan warga yang masuk dua kali:
1. Bandingkan kedua data — tentukan mana yang lebih lengkap
2. Pindahkan data dari record yang akan dihapus ke record yang dipertahankan
3. Hapus record duplikat (perlu akses Superadmin/Kepala Kantor)
4. Catat dalam Log Aktivitas alasan penghapusan

### 5.5 Checklist Validasi per Kelompok

Gunakan filter Status Dokumen = **Draft** untuk melihat data yang perlu divalidasi:

| Field | Wajib? | Catatan |
|---|---|---|
| Nama Lengkap | ✅ Wajib | Minimal 2 karakter |
| Jenis Kelamin | ✅ Wajib | L atau P |
| Status dalam Keluarga | ✅ Wajib | Kepala/Istri/Anak/dll |
| Kelompok (via KK) | ✅ Wajib | Harus terhubung ke keluarga |
| Status Keanggotaan | ✅ Wajib | Default: Non Aktif |
| WhatsApp | ⚠️ Disarankan | Untuk komunikasi kelompok |
| Tanggal Lahir | ⚠️ Disarankan | Untuk pengelompokan komisi |
| NIK | ⚠️ Jika ada | 16 digit |
| Sudah Baptis/Sidi | ⚠️ Jika tahu | Data sakramen |
| Alamat | ⚠️ Jika ada | Untuk kunjungan |

---

## 6. Prosedur Import Data dari Excel

### 6.1 Persiapan File Excel

**Langkah 1: Download Template**
1. Login ke sistem → menu **Import Data**
2. Klik tombol **Download Template**
3. Template berisi 3 sheet:
   - **Sheet 1 — Data Warga:** kolom yang harus diisi (field dengan `*` = wajib)
   - **Sheet 2 — Petunjuk Pengisian:** format dan nilai yang diterima per kolom
   - **Sheet 3 — Referensi Kelompok:** daftar kode kelompok yang valid

**Langkah 2: Isi Data di Excel**

Kolom wajib minimum yang harus terisi:
```
nama_lengkap | jenis_kelamin | status_keluarga | kode_kelompok | status_keanggotaan
```

Tips pengisian:
- Ikuti format tepat dari Sheet 2 (contoh: `L` atau `P` untuk jenis kelamin, bukan `Laki-laki`)
- Gunakan kode kelompok dari Sheet 3 (contoh: `A1`, `B5`, `C3`)
- Warga dalam satu keluarga harus punya **nomor keluarga yang sama** di kolom `nomor_keluarga`
- Kepala KK harus ada di baris pertama sebelum anggota keluarganya

**Langkah 3: Simpan sebagai .xlsx atau .xls**

---

### 6.2 Proses Import (Wizard 5 Langkah)

**Langkah 1 — Upload File**
1. Menu **Import Data** → klik area upload atau drag & drop file Excel
2. File diterima: `.xlsx` atau `.xls`, maksimal 10MB

**Langkah 2 — Mapping Kolom**
1. Sistem menampilkan tabel pemetaan kolom Excel ke field sistem
2. Auto-mapping otomatis mendeteksi 50+ pola nama kolom umum
3. Periksa hasil mapping — pastikan setiap kolom terpetakan dengan benar
4. Kolom yang tidak dikenali bisa di-skip atau dipetakan manual

**Langkah 3 — Preview & Validasi**
1. Sistem menampilkan 10 baris pertama sebagai preview
2. Baris bermasalah di-highlight merah
3. Baca summary: berapa baris valid, berapa bermasalah
4. Keputusan:
   - Jika banyak masalah → kembali ke Excel, perbaiki, upload ulang
   - Jika sedikit masalah → lanjut, baris bermasalah akan di-skip

**Langkah 4 — Processing**
1. Klik **Mulai Import**
2. Progress bar real-time (per batch 100 baris)
3. Jangan tutup browser saat proses berjalan
4. Estimasi waktu: ~1 menit per 100 baris

**Langkah 5 — Hasil**
1. Summary: berapa berhasil, berapa gagal
2. Download **Log Error** dalam format Excel untuk melihat baris yang gagal beserta alasannya
3. Perbaiki baris yang gagal, import ulang hanya baris yang gagal

---

### 6.3 Penanganan Error Umum saat Import

| Pesan Error | Penyebab | Solusi |
|---|---|---|
| `NIK sudah terdaftar` | NIK duplikat di sistem | Cek data yang sudah ada, hapus duplikat |
| `Kode kelompok tidak valid` | Kode kelompok salah/tidak ada | Cek Sheet 3 template untuk kode yang benar |
| `Nama minimal 2 karakter` | Nama kosong atau 1 huruf | Lengkapi nama di Excel |
| `Format tanggal tidak valid` | Format tanggal salah | Gunakan format `YYYY-MM-DD` atau `DD/MM/YYYY` |
| `Jenis kelamin tidak valid` | Nilai bukan L atau P | Ganti dengan `L` (Laki-laki) atau `P` (Perempuan) |

---

## 7. Aplikasi Mobile untuk Penatua

### 7.1 Akses Mobile

Buka browser di HP → ketik alamat: `https://jemaat.gkjjakarta.org/m/warga`

**Untuk menyimpan sebagai shortcut di home screen (iPhone):**
1. Buka di Safari → ketuk ikon Share (kotak dengan panah ke atas)
2. Gulir ke bawah → pilih **Add to Home Screen**
3. Nama: `GKJJ Jemaat` → ketuk **Add**
4. Icon GKJ Jakarta akan muncul di home screen

**Untuk menyimpan sebagai shortcut (Android):**
1. Buka di Chrome → ketuk menu titik tiga (⋮)
2. Pilih **Add to Home Screen** → konfirmasi
3. Icon aplikasi muncul di layar utama

---

### 7.2 Fitur Aplikasi Mobile

**Halaman Daftar Warga (`/m/warga`)**
- Tampil semua warga dalam kelompok penatua yang login
- Cari nama dengan kolom pencarian
- Tap kartu warga → masuk ke detail
- Tombol **+** di pojok kanan bawah → tambah warga baru

**Halaman Tambah Warga Baru (`/m/warga/baru`)**

Form ringkas 6 field untuk entry data cepat di lapangan:

| Field | Keterangan |
|---|---|
| Nama Lengkap | Nama sesuai KTP |
| Jenis Kelamin | Pilih Laki-laki atau Perempuan |
| Status dalam Keluarga | Default: Lainnya (untuk validasi nanti) |
| Kelompok | Otomatis terisi dari akun penatua + tampil nama penatua |
| Status Keanggotaan | Default: Non Aktif (perlu validasi staf) |
| Nomor WhatsApp | Nomor HP untuk komunikasi |

> Data masuk sebagai **Draft** → staf kantor melakukan validasi dan melengkapi data via desktop.

**Halaman Detail Warga (`/m/warga/[id]`)**
- Tampil info lengkap warga
- Tap tombol **Edit** → ubah data langsung
- Field yang bisa diedit: status keanggotaan, WhatsApp, tanggal lahir, sakramen, alamat

**Halaman Kartu Anggota (`/m/kartu`)**
- Cari nama jemaat → tap hasil → kartu digital muncul
- Kartu menampilkan QR code yang bisa di-scan
- Cocok untuk verifikasi kehadiran saat ibadah

---

### 7.3 Panduan Penggunaan saat Kunjungan Rumah

**Skenario: Penatua melakukan kunjungan dan menemukan jemaat baru**

1. Buka aplikasi mobile dari home screen HP
2. Login dengan akun penatua
3. Tap tombol **+** → form tambah warga
4. Isi 6 field: nama, jenis kelamin, status, kelompok (otomatis), status keanggotaan, WA
5. Tap **Simpan Data Warga**
6. Konfirmasi muncul → data tersimpan sebagai Draft
7. Staf kantor akan melengkapi dan memvalidasi data via desktop

**Skenario: Penatua update data warga yang sudah ada**

1. Cari nama di halaman Daftar Warga
2. Tap kartu warga
3. Tap **Edit** di pojok kanan atas
4. Ubah field yang perlu diperbarui (misal: nomor WA baru, status keanggotaan)
5. Tap **Simpan Perubahan**

---

## 8. Prosedur Laporan Bug

### 8.1 Definisi Bug

Bug adalah kondisi di mana sistem tidak berfungsi sesuai yang diharapkan, termasuk:
- Tombol tidak berfungsi / tidak merespons
- Data tidak tersimpan atau tersimpan salah
- Tampilan rusak atau tidak terbaca
- Pesan error yang tidak jelas
- Fitur yang seharusnya ada tapi tidak muncul untuk role tertentu

### 8.2 Tingkat Prioritas Bug

| Tingkat | Kriteria | Contoh | Target Penyelesaian |
|---|---|---|---|
| 🔴 **KRITIS** | Sistem tidak bisa digunakan, data hilang/rusak | Login tidak bisa sama sekali, data terhapus sendiri | 24 jam |
| 🟠 **TINGGI** | Fitur utama tidak berfungsi | Tidak bisa simpan data warga, import gagal semua | 3 hari kerja |
| 🟡 **SEDANG** | Fitur berfungsi tapi ada gangguan | Filter tidak akurat, tampilan kartu salah | 1 minggu |
| 🟢 **RENDAH** | Kosmetik atau kenyamanan | Typo di label, warna tidak sesuai | Sprint berikutnya |

### 8.3 Cara Melaporkan Bug

**Informasi wajib dalam laporan bug:**

```
LAPORAN BUG

Tanggal Ditemukan  : [tanggal]
Dilaporkan oleh    : [nama + jabatan]
Tingkat Prioritas  : [Kritis / Tinggi / Sedang / Rendah]

DESKRIPSI MASALAH
Apa yang terjadi?
[Jelaskan dengan singkat masalah yang ditemukan]

LANGKAH REPRODUKSI
Bagaimana cara mengulang masalah ini?
1. Buka halaman [nama halaman]
2. Klik/isi [aksi yang dilakukan]
3. [Aksi selanjutnya]
4. Masalah muncul di sini

YANG DIHARAPKAN
[Apa yang seharusnya terjadi?]

YANG TERJADI
[Apa yang benar-benar terjadi?]

SCREENSHOT / REKAMAN LAYAR
[Lampirkan jika memungkinkan]

INFORMASI TAMBAHAN
- Nama pengguna (username) yang mengalami: [username]
- Browser yang digunakan: [Chrome/Safari/Firefox/dll]
- Perangkat: [Desktop/HP — merk & model jika HP]
- Halaman URL: [copy URL dari browser]
```

**Cara menyampaikan laporan:**
1. Kirim via WhatsApp/email ke kontak teknis (lihat Bab 10)
2. Gunakan format di atas agar penanganan lebih cepat
3. Sertakan screenshot jika memungkinkan

### 8.4 Yang BUKAN Bug (Bukan Perlu Dilaporkan ke Tim Teknis)

Beberapa hal mungkin tampak seperti bug tapi sebenarnya bukan:
- Data tidak muncul karena belum diinput → bukan bug
- Tidak bisa akses menu tertentu → mungkin batasan role, hubungi admin sistem
- Kartu warga tidak ada foto → karena foto belum diupload, bukan bug

---

## 9. Prosedur Pengajuan Fitur Baru

### 9.1 Definisi Fitur Baru vs. Perbaikan

| Jenis | Deskripsi | Contoh |
|---|---|---|
| **Fitur Baru** | Kemampuan yang belum ada sama sekali | Laporan rekap per kelompok, notifikasi ulang tahun |
| **Peningkatan Fitur** | Penyempurnaan fitur yang sudah ada | Tambah kolom di tabel, tambah filter baru |
| **Perbaikan UI** | Tampilan lebih baik, bukan fungsi baru | Warna berbeda, layout lebih rapi |

### 9.2 Template Pengajuan Fitur

```
PENGAJUAN FITUR

Tanggal         : [tanggal]
Diajukan oleh   : [nama + jabatan]
Kategori        : [Fitur Baru / Peningkatan / Perbaikan UI]
Prioritas       : [Tinggi / Sedang / Rendah]

JUDUL FITUR
[Nama singkat fitur yang diusulkan]

LATAR BELAKANG
Masalah apa yang coba diselesaikan oleh fitur ini?
[Jelaskan konteks dan kebutuhan]

DESKRIPSI FITUR
Apa yang diharapkan dari fitur ini?
[Jelaskan fungsi yang diinginkan]

PENGGUNA YANG TERDAMPAK
Siapa yang akan menggunakan fitur ini?
[ ] Superadmin / Kepala Kantor
[ ] Staf Admin
[ ] Majelis
[ ] Penatua Kelompok
[ ] Semua pengguna

ALUR PENGGUNAAN (USER STORY)
Sebagai [siapa], saya ingin [melakukan apa], agar [manfaat yang didapat].

Contoh:
Sebagai Penatua Kelompok, saya ingin melihat daftar warga yang belum sidi,
agar saya bisa menghubungi dan mendorong mereka untuk mengikuti sidi.

KRITERIA SELESAI
Fitur ini dianggap selesai jika:
1. [kondisi pertama]
2. [kondisi kedua]
3. [dst.]

MOCKUP / GAMBARAN (jika ada)
[Lampirkan sketsa atau referensi tampilan jika memungkinkan]
```

### 9.3 Proses Evaluasi Fitur

```
Pengajuan masuk
      ↓
Review oleh Product Owner (1-3 hari)
      ↓
Klarifikasi dengan pemohon jika perlu
      ↓
Prioritisasi dalam backlog
      ↓
      ├── Prioritas Tinggi → Sprint berikutnya
      ├── Prioritas Sedang → 2-4 minggu
      └── Prioritas Rendah → Roadmap jangka panjang
      ↓
Development & Testing
      ↓
Deploy ke testing environment
      ↓
Verifikasi oleh pemohon
      ↓
Deploy ke production
```

### 9.4 Backlog Fitur yang Sedang Direncanakan

| Fitur | Status | Keterangan |
|---|---|---|
| Workflow validasi data via mobile | 🗓️ Planned | Penatua submit → staf validasi |
| Laporan rekap per kelompok/wilayah | 🗓️ Planned | Export PDF/Excel |
| Pencatatan perpindahan jemaat | 🗓️ Planned | Masuk, Keluar, Meninggal + surat |
| Notifikasi ulang tahun jemaat | 🗓️ Planned | WhatsApp otomatis |
| Absensi ibadah via QR scan | 💡 Ide | Scan kartu di gerbang gereja |

---

## 10. Kontak & Eskalasi

### Tim Teknis

| Kebutuhan | Kontak |
|---|---|
| Bug Kritis / Sistem Down | Hubungi langsung via WhatsApp |
| Bug Sedang/Rendah | Email / WhatsApp dengan format laporan |
| Pengajuan Fitur Baru | Email ke Product Owner |
| Reset Password Pengguna | Hubungi Superadmin sistem |
| Pertanyaan Penggunaan | Lihat panduan ini atau tanya Staf Admin |

### Email Helpdesk Sistem
📧 **gkjjkeu@outlook.com**

---

## Lampiran: Daftar Istilah

| Istilah | Arti |
|---|---|
| **KK** | Kartu Keluarga — unit keluarga dalam sistem |
| **NIK** | Nomor Induk Kependudukan (16 digit di KTP) |
| **Nomor Anggota** | Nomor otomatis dari sistem (format: WRG00001) |
| **Nomor Induk** | Nomor resmi yang diberikan gereja |
| **Draft** | Data baru, belum divalidasi |
| **Komisi** | Kelompok pelayanan berdasarkan usia (Anak, Remaja, dll.) |
| **Penatua** | Pemimpin kelompok jemaat di wilayah tertentu |
| **UU PDP** | Undang-Undang No. 27/2022 tentang Perlindungan Data Pribadi |
| **QR Code** | Kode scan di kartu anggota, mengarah ke profil digital |
| **Role** | Tingkatan hak akses pengguna dalam sistem |
| **PWA** | Progressive Web App — aplikasi web yang bisa disimpan di home screen HP |
| **Import** | Proses memasukkan banyak data sekaligus dari file Excel |
| **Cleansing** | Proses membersihkan dan menyeragamkan data |

---

*Dokumen ini dibuat untuk keperluan operasional internal GKJJ.*  
*Versi terbaru selalu tersedia di repository sistem.*  
*© 2026 Gereja Kristen Jawa Jakarta — Sistem Informasi Jemaat*
