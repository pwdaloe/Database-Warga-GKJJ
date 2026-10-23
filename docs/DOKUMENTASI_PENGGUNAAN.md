# Dokumentasi Penggunaan — Database Warga GKJJ

**Sistem Informasi Jemaat Gereja Kristen Jawa Jakarta**
**Versi dokumen:** 1.0 · **Tanggal:** 8 Oktober 2026
**Untuk:** seluruh pengguna sistem, dikelompokkan per role

> Dokumen ini ditulis sebagai bahan Claude Design. Setiap bab role berdiri sendiri: pembaca cukup membuka bab role-nya.
> Layar aplikasi bisa berubah antar-rilis, jadi tempat yang cocok untuk tangkapan layar diberi tanda 🖼️.

---

## Daftar Isi

1. [Pengantar Umum](#1-pengantar-umum)
2. [Ringkasan Hak Akses per Role](#2-ringkasan-hak-akses-per-role)
3. [Panduan Superadmin & Kepala Kantor](#3-panduan-superadmin--kepala-kantor)
4. [Panduan Staf Administrasi](#4-panduan-staf-administrasi)
5. [Panduan Majelis](#5-panduan-majelis)
6. [Panduan Penatua Kelompok](#6-panduan-penatua-kelompok)
7. [Panduan Viewer](#7-panduan-viewer)
8. [Panduan Jemaat](#8-panduan-jemaat)
9. [Alur Kerja Lintas Role](#9-alur-kerja-lintas-role)
10. [Roadmap](#10-roadmap)
11. [Lampiran](#11-lampiran)

---

## 1. Pengantar Umum

### 1.1 Apa itu Database Warga GKJJ?

Aplikasi web untuk mengelola data seluruh warga jemaat GKJ Jakarta di satu tempat, mulai dari entry, validasi, kartu anggota, sampai pencatatan perpindahan. Skalanya sekitar 2.000 warga dalam 3 wilayah dan 24 kelompok.

### 1.2 Cara mengakses

| Perangkat | Alamat | Dipakai oleh |
|---|---|---|
| Komputer (desktop) | `https://jemaat.gkjjakarta.org` | Semua role |
| HP (mobile) | `https://jemaat.gkjjakarta.org/m/login` | Penatua Kelompok |
| Kartu digital publik | `https://jemaat.gkjjakarta.org/m/[id]` | Siapa saja yang memindai QR (tanpa login) |

### 1.3 Login

1. Buka alamat aplikasi, lalu isi **Username** dan **Password** dari admin gereja.
2. Klik **Masuk**.
3. **Login pertama:** jika akun dibuat dengan password acak, sistem meminta Anda mengganti password sebelum bisa memakai menu lain.
4. **Lupa password:** klik **Lupa password** di halaman login. Jika tidak berhasil, hubungi Superadmin atau Kepala Kantor.

### 1.4 Istilah penting

| Istilah | Arti |
|---|---|
| **KK** | Kartu Keluarga, yaitu unit keluarga di sistem |
| **Kelompok / Wilayah** | Pembagian jemaat. Satu wilayah punya banyak kelompok, satu kelompok punya satu penatua |
| **Nomor Anggota** | Nomor otomatis dari sistem (contoh: WRG00001) |
| **Draft** | Data baru yang belum diverifikasi |
| **Komisi** | Pengelompokan jemaat menurut usia (Anak, Pra-Remaja, Remaja, Pemuda, Dewasa, Adiyuswa) |
| **Penatua** | Pemimpin satu kelompok jemaat |

### 1.5 Status data

**Status dokumen** menunjukkan kualitas data:

```
DRAFT  →  VALIDASI  →  AKTIF  →  TIDAK AKTIF
```

| Status | Artinya |
|---|---|
| Draft | Baru masuk (dari mobile, Profil Saya, atau entry), belum diverifikasi |
| Validasi | Sedang dicek staf |
| Aktif | Sudah valid dan resmi |
| Tidak Aktif | Dinonaktifkan (pindah, meninggal, dll.) |

**Status keanggotaan** menunjukkan kondisi jemaat: Aktif, Non Aktif, Katekumen, Pindah Gereja (dengan surat atestasi), Pindah Agama, Meninggal. Hanya **Aktif** yang dihitung sebagai anggota aktif.

### 1.6 Perlindungan data pribadi (UU PDP No. 27/2022)

Sistem menyembunyikan data sensitif menurut role:

| Data | Yang bisa melihat |
|---|---|
| NIK | Superadmin, Kepala Kantor |
| Alamat KTP dan koordinat rumah | Semua role kecuali Penatua Kelompok dan Viewer |
| Telepon dan email | Semua role kecuali Viewer |
| Data warga | Penatua hanya melihat kelompoknya sendiri |

Setiap perubahan data tercatat di Log Aktivitas (siapa, kapan, apa).

---

## 2. Ringkasan Hak Akses per Role

| Modul | Superadmin | Kepala Kantor | Majelis | Staf Admin | Penatua | Viewer | Jemaat |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – |
| Data Warga: lihat | ✅ | ✅ | ✅ | ✅ | ✅ (kelompok sendiri) | – | – |
| Data Warga: tambah/edit | ✅ | ✅ | ✅ | ✅ | ✅ | – | – |
| Data Warga: hapus | ✅ | ✅ | – | – | – | – | – |
| Data Keluarga: lihat/edit | ✅ | ✅ | ✅ | ✅ | ✅ | – | – |
| Data Keluarga: hapus KK | ✅ | ✅ | – | – | – | – | – |
| Validasi Data: melihat antrean | ✅ | ✅ | – | ✅ | ✅ (kelompok sendiri) | – | – |
| Validasi Data: **memvalidasi** | ✅ | ✅ | – | ✅ | – | – | – |
| Kartu Anggota | ✅ | ✅ | ✅ | ✅ | ✅ | – | – |
| Perpindahan: catat | ✅ | ✅ | ✅ | ✅ | – | – | – |
| Perpindahan: setujui (tahap 1) | ✅ | ✅ | ✅ | – | – | – | – |
| Perpindahan: validasi akhir (tahap 2) | ✅ | ✅ | – | – | – | – | – |
| Import Excel | ✅ | ✅ | – | ✅ | – | – | – |
| Wilayah & Kelompok | ✅ (kelola) | ✅ (kelola) | lihat | – | – | – | – |
| Pengguna | ✅ | ✅ | – | – | – | – | – |
| Log Aktivitas | ✅ | ✅ | – | – | – | – | – |
| Pengaturan | ✅ | ✅ | – | – | – | – | – |
| Profil Saya | – | – | – | – | – | – | ✅ |
| Hubungi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Catatan validasi:** yang memvalidasi data adalah **Staf Administrasi dan Kepala Kantor** (Superadmin ikut karena memegang akses penuh sistem). Majelis dan Penatua tidak memvalidasi.

---

## 3. Panduan Superadmin & Kepala Kantor

**Peran:** Superadmin adalah admin sistem. Kepala Kantor adalah pimpinan operasional kantor gereja. Keduanya punya akses penuh, termasuk manajemen pengguna, pengaturan, dan penghapusan data. Kepala Kantor juga memberi **validasi akhir (tahap 2)** pada perpindahan jemaat.

**Menu yang tersedia:** Dashboard, Data Warga, Data Keluarga, Validasi Data, Kartu Anggota, Wilayah & Kelompok, Perpindahan, Import Data, Hubungi, Pengguna, Log Aktivitas, Pengaturan.

**Tugas rutin:** mengelola akun pengguna, memantau Log Aktivitas, memvalidasi data, memberi validasi akhir perpindahan, mengatur master data dan template pesan.

### 3.1 Dashboard

1. Login, dan Anda langsung masuk ke Dashboard. 🖼️
2. Baca kartu ringkasan: **Total Warga**, **Total Keluarga**, **Kelompok Aktif**, **Data Perlu Validasi**.
3. Klik sebuah kartu untuk pindah ke halaman terkait.
4. Lihat **Chart Komisi** untuk sebaran jemaat per kelompok usia.
5. Lihat **Peta Lokasi** untuk pin rumah warga yang sudah punya koordinat GPS.

### 3.2 Mengelola pengguna

Buka menu **Pengguna**.

**Menambah pengguna dari data warga (disarankan):**
1. Klik **Tambah Pengguna**. 🖼️
2. Cari dan pilih **warga**. Nama, WhatsApp, dan email terisi otomatis.
3. Isi **username** (tanpa spasi, contoh `nama.kelompok`).
4. Pilih **role** sesuai jabatan. Untuk Penatua Kelompok, kelompok wajib dipilih.
5. Kosongkan kolom password agar sistem membuat **password acak**.
6. Klik **Simpan**.
7. Modal **Info Akun** muncul dengan password yang **hanya tampil sekali**. Klik **Kirim via WhatsApp**, lalu WhatsApp terbuka dengan pesan siap kirim.
8. Pengguna wajib mengganti password saat login pertama.

**Menambah pengguna manual:** isi nama lengkap, username, email, password (minimal 8 karakter), role, dan kelompok bila perlu.

**Mengelola akun yang ada:**
- **Reset password:** klik ikon kunci di baris pengguna. Jika dikosongkan, sistem membuat password acak dan menawarkan kirim ulang via WhatsApp.
- **Nonaktifkan atau aktifkan akun:** klik ikon on/off. Akun nonaktif tidak bisa login, tetapi riwayatnya tetap tersimpan.

> Username tidak boleh mengandung spasi.

### 3.3 Mengelola Data Warga dan Keluarga

Cara kerjanya sama dengan Staf Admin (lihat [4.2](#42-data-warga) dan [4.3](#43-data-keluarga)). Selain itu Anda bisa:
- **Menghapus warga.** Pakai untuk data duplikat. Pindahkan data yang dipertahankan lebih dulu, lalu hapus duplikatnya.
- **Menghapus KK.** Hanya bisa jika KK tidak punya anggota. Tombol **Hapus KK** ada di halaman detail KK, dan pesan galat muncul di modal hapus jika syaratnya belum terpenuhi.
- **Melihat NIK warga.** Role lain tidak bisa.

### 3.4 Validasi data

Lihat [4.4 Validasi Data](#44-validasi-data). Anda punya hak yang sama dengan Staf Admin.

### 3.5 Perpindahan jemaat: validasi akhir

Perpindahan melewati dua tahap persetujuan.

1. Buka **Perpindahan**.
2. Pilih perpindahan berstatus **sudah disetujui Majelis**, lalu buka detailnya.
3. Periksa data warga, jenis perpindahan, tanggal, dan nomor surat.
4. Klik **Validasi**. Status warga berubah sesuai jenis perpindahan, dan **surat PDF** bisa dibuat.
5. Surat bisa dikirim lewat **email** atau **WhatsApp**. Surat tidak bisa dikirim sebelum perpindahan divalidasi.
6. Hanya Superadmin dan Kepala Kantor yang bisa **menghapus** catatan perpindahan.

Lihat alur lengkap di [9.2](#92-perpindahan-jemaat-dua-tahap).

### 3.6 Wilayah & Kelompok

1. Buka **Wilayah & Kelompok**. 🖼️
2. Klik nama wilayah untuk membuka atau menutup daftar kelompok.
3. **Ubah nama wilayah:** klik ikon pensil.
4. **Aktifkan atau nonaktifkan wilayah:** klik tombol toggle.
5. **Tambah kelompok:** klik **+ Tambah Kelompok** di kartu wilayah.
6. **Hapus wilayah:** hanya bisa jika tidak ada KK yang terdaftar.

### 3.7 Import Data Excel

Lihat [4.5 Import Excel](#45-import-excel). Anda juga bisa mengakses fitur ini.

### 3.8 Log Aktivitas

1. Buka **Log Aktivitas**. 🖼️
2. Filter: **Semua**, **Error saja**, atau **Sukses saja**.
3. Klik sebuah baris untuk melihat detail (snapshot data dan pesan error).
4. Log diperbarui otomatis setiap 30 detik.
5. **Bersihkan Log** menghapus entri yang lebih lama dari 90 hari agar performa terjaga.

Setiap baris mencatat waktu, pengguna, operasi (tambah/ubah/hapus/akses), path, status, dan IP address.

### 3.9 Pengaturan

Buka **Pengaturan**. Ada empat bagian:

| Bagian | Fungsi |
|---|---|
| **Rentang Usia Komisi** | Atur batas usia tiap komisi. Chart di Dashboard ikut berubah |
| **Master Kelurahan** | 63 kelurahan Jakarta Timur sudah tersedia. Tambah kelurahan lain bila perlu. Dipakai untuk autocomplete alamat |
| **Template Pesan** | Ubah isi pesan WhatsApp (misalnya pesan info akun). Ada pratinjau dan tombol kembalikan ke default |
| **Kontak Gereja** | Atur isi menu **Hubungi**: WA Center, Kepala Kantor, Pendeta/Emeritus, dan lainnya. Bisa tambah, ubah, aktif/nonaktifkan, hapus |

### 3.10 Menu Hubungi

Lihat [8.3](#83-menu-hubungi). Daftar kontak diatur di **Pengaturan → Kontak Gereja**.

---

## 4. Panduan Staf Administrasi

**Peran:** petugas kantor yang memasukkan, melengkapi, dan **memvalidasi** data jemaat, serta mengimpor data dari Excel dan mencatat perpindahan.

**Menu yang tersedia:** Dashboard, Data Warga, Data Keluarga, Validasi Data, Kartu Anggota, Perpindahan, Import Data, Hubungi.

**Tidak bisa:** menghapus warga atau KK, mengelola pengguna, melihat Log Aktivitas, mengubah Pengaturan, mengelola Wilayah, menyetujui atau memvalidasi perpindahan.

### 4.1 Dashboard

Sama dengan [3.1](#31-dashboard). Perhatikan kartu **Data Perlu Validasi**: klik untuk langsung ke antrean validasi.

### 4.2 Data Warga

**Mencari dan memfilter:**
1. Buka **Data Warga**. 🖼️
2. Ketik di kolom pencarian: nama, nomor anggota, atau nomor telepon.
3. Klik **Filter** untuk menyaring per wilayah, kelompok, status keanggotaan, jenis kelamin, atau status dokumen.

**Menambah warga baru:**
1. Klik **Tambah Warga** di pojok kanan atas.
2. **Tab Identitas:** nama lengkap, foto (opsional), NIK (jika ada), tempat dan tanggal lahir.
3. **Tab Keanggotaan:** status dalam keluarga, status keanggotaan, data baptis dan sidi.
4. **Tab Kontak:** telepon, WhatsApp, email, pendidikan, pekerjaan.
5. **Tab Keluarga:**
   - *Kepala KK baru:* pilih kelompok dan isi alamat. KK dibuat otomatis.
   - *Anggota keluarga:* cari nama kepala keluarga lalu pilih keluarganya.
6. **Tab Alamat:** alamat KTP, alamat domisili jika berbeda, koordinat GPS (opsional).
7. Klik **Simpan & Lanjutkan**.
8. Jika yang diinput Kepala KK, **wizard langkah 2** muncul untuk menambah anggota keluarga satu per satu. Klik **Selesai** di akhir.

> Warga baru otomatis berstatus **Draft** dan perlu divalidasi.

**Mengubah warga:** buka detail warga, ubah data, lalu simpan.

**Aturan pengisian yang baik:**

| Field | Aturan |
|---|---|
| Nama | Huruf kapital di awal tiap kata. Tanpa gelar. Contoh benar: `Budi Santoso` |
| NIK | Tepat 16 digit, tanpa spasi atau tanda hubung |
| WhatsApp/Telepon | `08XXXXXXXXXX` atau `628XXXXXXXXXX` |
| Baptis/Sidi | Centang hanya jika sudah dijalani. Isi tanggal dan tempat jika tahu |
| Pindah Gereja | Lampirkan nomor surat atestasi |
| Pindah Agama | Tanpa surat atestasi; isi keterangan bila ada |
| Meninggal | Isi tanggal jika diketahui |

### 4.3 Data Keluarga

1. Buka **Data Keluarga**. 🖼️ Setiap baris adalah satu KK, berisi nomor KK, kepala keluarga, kelompok, dan jumlah anggota.
2. Klik **Lihat Detail** untuk melihat kepala keluarga, daftar anggota, dan alamat.
3. **Ubah alamat** langsung di halaman detail. Autocomplete kelurahan Jakarta Timur tersedia.
4. Lencana **"KK kosong"** muncul bila semua anggotanya sudah pindah KK.
5. Jika kepala KK dipindahkan ke KK lain, penunjuk kepala lama dibersihkan otomatis.

### 4.4 Validasi Data

Ini tugas utama Staf Admin. Antrean berisi data **Draft** dari entry baru, aplikasi mobile Penatua, dan perubahan Profil Saya dari jemaat.

1. Buka **Validasi Data**. 🖼️
2. Tab **Perlu Validasi** menampilkan data Draft. Gunakan filter untuk menyaring per kelompok.
3. Buka tiap data dan periksa:
   - Nama, jenis kelamin, status dalam keluarga, dan kelompok (lewat KK) sudah terisi.
   - NIK 16 digit bila ada.
   - Nomor WhatsApp, tanggal lahir, dan data sakramen sudah dicek.
4. Lengkapi data yang kurang di Data Warga bila perlu.
5. Klik **Validasi** pada satu baris, atau centang beberapa baris lalu klik **Validasi Terpilih (n)**. Sistem meminta konfirmasi.
6. Salah validasi? Pilih datanya lalu klik **Batalkan Validasi**.

**Menangani data duplikat:** Staf Admin tidak bisa menghapus. Laporkan ke Kepala Kantor atau Superadmin, sebutkan data mana yang dipertahankan.

### 4.5 Import Excel

Dipakai untuk memasukkan banyak warga sekaligus (disarankan di atas 50 data).

**Menyiapkan file:**
1. Buka **Import Data** lalu klik **Download Template**.
2. Template berisi 3 sheet: **Data Warga**, **Petunjuk Pengisian**, dan **Referensi Kelompok**.
3. Kolom wajib minimum: `nama_lengkap`, `jenis_kelamin` (L/P), `status_keluarga`, `kode_kelompok`, `status_keanggotaan`.
4. Anggota satu keluarga memakai **nomor keluarga yang sama**. Kepala KK diletakkan di baris pertama keluarganya.
5. Simpan sebagai **.xlsx** (maksimal 10 MB). Format .xls tidak didukung.

**Menjalankan import (5 langkah):**

| Langkah | Yang dilakukan |
|---|---|
| 1. Upload | Seret file ke area upload atau klik untuk memilih |
| 2. Mapping Kolom | Sistem memetakan kolom otomatis. Periksa, ubah manual, atau lewati kolom |
| 3. Preview & Validasi | Lihat 10 baris pertama. Baris bermasalah berwarna merah. Baca ringkasan valid dan bermasalah |
| 4. Processing | Klik **Mulai Import**. Progress per 100 baris. **Jangan tutup browser** |
| 5. Hasil | Lihat berhasil dan gagal. Unduh **Log Error** (Excel), perbaiki, lalu import ulang baris yang gagal |

**Error yang sering muncul:**

| Pesan | Solusi |
|---|---|
| NIK sudah terdaftar | Cek data yang sudah ada, laporkan duplikat |
| Kode kelompok tidak valid | Pakai kode dari sheet Referensi Kelompok |
| Nama minimal 2 karakter | Lengkapi nama |
| Format tanggal tidak valid | Pakai `YYYY-MM-DD` atau `DD/MM/YYYY` |
| Jenis kelamin tidak valid | Isi `L` atau `P` |

> ⚠️ Import menyentuh data produksi. Jalankan di jadwal sepi dan cek hasil di Data Warga setelahnya.

### 4.6 Kartu Anggota

1. Buka **Kartu Anggota**.
2. Ketik minimal 2 huruf nama, lalu pilih jemaat dari hasil. 🖼️
3. Kartu digital muncul: foto, nama, nomor induk, kelompok, wilayah, penatua, status, lencana baptis dan sidi, serta QR code.
4. Pilih aksi:
   - **Cetak:** jendela print ukuran 85,6 × 72 mm.
   - **Kirim via WhatsApp:** membuka WhatsApp dengan pesan dan tautan kartu.
   - **Buka Data Warga:** menuju biodata lengkap.

QR mengarah ke halaman publik yang bisa dibuka tanpa login. Halaman itu **tidak menampilkan** NIK, email, dan nomor telepon.

### 4.7 Mencatat Perpindahan

1. Buka **Perpindahan** lalu klik **Tambah**. 🖼️
2. Pilih warga dan jenis perpindahan: **Masuk**, **Keluar**, atau **Meninggal**.
3. Isi tanggal, gereja asal atau tujuan, nomor surat, dan keterangan.
4. Simpan. Catatan menunggu **persetujuan Majelis**, lalu **validasi Kepala Kantor**.
5. Setelah divalidasi, Anda bisa membuka **surat PDF** dan mengirimnya lewat **email** atau **WhatsApp**.

Lihat [9.2](#92-perpindahan-jemaat-dua-tahap).

### 4.8 Menu Hubungi

Lihat [8.3](#83-menu-hubungi).

---

## 5. Panduan Majelis

**Peran:** anggota Majelis Gereja. Majelis memantau data jemaat dan **menyetujui perpindahan (tahap 1)**.

**Menu yang tersedia:** Dashboard, Data Warga, Data Keluarga, Kartu Anggota, Wilayah & Kelompok (lihat saja), Perpindahan, Hubungi.

**Tidak bisa:** memvalidasi data (menu Validasi Data tidak tersedia), menghapus data, import Excel, mengelola pengguna dan pengaturan.

### 5.1 Dashboard

Sama dengan [3.1](#31-dashboard). Pakai Chart Komisi dan Peta Lokasi untuk gambaran kondisi jemaat.

### 5.2 Melihat dan mengedit Data Warga dan Keluarga

Cara memakainya sama dengan [4.2](#42-data-warga) dan [4.3](#43-data-keluarga). Majelis bisa mencari, memfilter, menambah, dan mengedit, tetapi **tidak bisa menghapus**. Data baru dari Majelis masuk sebagai Draft dan divalidasi oleh Staf Admin atau Kepala Kantor.

### 5.3 Kartu Anggota

Sama dengan [4.6](#46-kartu-anggota).

### 5.4 Wilayah & Kelompok

Buka **Wilayah & Kelompok** untuk melihat struktur wilayah, kelompok, dan penatuanya. Majelis hanya bisa melihat, tidak bisa mengubah.

### 5.5 Menyetujui Perpindahan (tahap 1)

1. Buka **Perpindahan**. 🖼️
2. Cari catatan yang menunggu persetujuan, lalu buka detailnya.
3. Periksa jenis perpindahan, identitas warga, tanggal, dan keterangan.
4. Klik **Setujui**.
5. Catatan lanjut ke **Kepala Kantor** untuk validasi akhir.

Majelis juga bisa mencatat perpindahan baru dan mengubah catatan yang sudah ada, tetapi tidak bisa memberi validasi akhir.

### 5.6 Menu Hubungi

Lihat [8.3](#83-menu-hubungi).

---

## 6. Panduan Penatua Kelompok

**Peran:** pemimpin satu kelompok jemaat. Penatua melihat dan memperbarui data **kelompoknya sendiri**, terutama saat kunjungan rumah, lewat HP.

**Akses:** utamanya aplikasi mobile (`/m`). Menu desktop (Dashboard, Data Warga, Data Keluarga, Validasi Data [hanya lihat], Kartu Anggota, Hubungi) juga tersedia.

**Tidak bisa:** melihat warga kelompok lain, melihat NIK, alamat KTP, dan koordinat rumah, memvalidasi data, menghapus data, reset password sendiri.

### 6.1 Login dan pasang di HP

1. Buka `https://jemaat.gkjjakarta.org/m/login` di Chrome atau Safari.
2. Isi **Username** dan **Password** dari admin, lalu ketuk **Masuk**.
3. Pasang ikon di layar utama:
   - **iPhone (Safari):** ketuk ikon **Share** → **Add to Home Screen** → **Add**.
   - **Android (Chrome):** ketuk menu ⋮ → **Add to Home Screen** → konfirmasi.
4. **Lupa password:** gunakan **Lupa password** di halaman login. Jika gagal, hubungi Kepala Kantor atau Superadmin.

### 6.2 Mengecek apakah seseorang sudah terdaftar

1. Setelah login, Anda berada di **Data Warga**, yang hanya berisi warga kelompok Anda. 🖼️
2. Ketik nama atau nomor anggota di kolom pencarian, lalu ketuk **Cari**.
3. **Ada di daftar:** ketuk kartunya untuk melihat detail.
4. **Tidak ditemukan:** orang tersebut belum terdaftar. Lanjut ke [6.3](#63-menambah-warga-baru).

Label status: Aktif, Non Aktif, Katekumen, Pindah Gereja, Pindah Agama, Meninggal.

### 6.3 Menambah warga baru

Dipakai saat kunjungan rumah atau bertemu jemaat yang belum tercatat.

1. Di halaman **Data Warga**, ketuk tombol **+** di pojok kanan bawah. 🖼️
2. Isi 6 field:

| Field | Keterangan |
|---|---|
| Nama Lengkap | Sesuai KTP |
| Jenis Kelamin | Laki-laki atau Perempuan |
| Status dalam Keluarga | Bawaan: Lainnya. Staf melengkapi nanti |
| Kelompok | Terisi otomatis dari akun Anda |
| Status Keanggotaan | Bawaan: Non Aktif |
| Nomor WhatsApp | Nomor HP warga |

3. Ketuk **Simpan Data Warga**.
4. Konfirmasi muncul. Data tersimpan sebagai **Draft**, lalu **Staf Admin melengkapi dan memvalidasinya** dari desktop.

### 6.4 Mengubah data warga

1. Cari nama di **Data Warga**, lalu ketuk kartunya.
2. Ketuk **Edit** di pojok kanan atas.
3. Ubah field yang perlu diperbarui: status keanggotaan, WhatsApp, tanggal lahir, sakramen, atau alamat.
4. Ketuk **Simpan Perubahan**.

### 6.5 Kartu Anggota dan mengirimnya

1. Dari menu bawah, ketuk **Kartu Anggota**.
2. Ketik minimal 2 huruf nama, ketuk **Cari**, lalu pilih jemaat. Kartu digital muncul. 🖼️
3. **Kirim ke WhatsApp warga (HP):** ketuk **Share/Bagikan** di browser → pilih **WhatsApp** → pilih kontak.
4. Kartu bisa dipakai untuk verifikasi saat ibadah. QR-nya bisa dipindai.

> Di versi komputer, halaman Kartu Anggota punya tombol **Kirim via WhatsApp** yang langsung membuka WhatsApp dengan pesan siap kirim. Tombol ini tidak ada di versi HP.

### 6.6 Memantau status validasi (desktop)

Di desktop, menu **Validasi Data** menampilkan data kelompok Anda beserta statusnya. Anda hanya melihat, tidak bisa memvalidasi.

### 6.7 Menu Hubungi

Lihat [8.3](#83-menu-hubungi). Gunakan untuk menghubungi WA Center atau Kepala Kantor.

### 6.8 Hal yang perlu diingat

- Data baru dari Anda berstatus Draft sampai divalidasi. Itu normal, bukan error.
- Anda hanya melihat dan mengubah warga kelompok sendiri.
- Penatua tidak bisa menghapus data. Untuk data keliru atau duplikat, hubungi Staf Admin.
- Jangan membagikan username dan password Anda.

---

## 7. Panduan Viewer

**Peran:** akun tamu terbatas untuk pihak yang hanya perlu melihat gambaran umum jemaat.

**Menu yang tersedia:** **Dashboard** dan **Hubungi**.

**Tidak bisa:** membuka daftar warga atau keluarga, melihat data pribadi (NIK, alamat KTP, koordinat, telepon, email), serta menambah, mengubah, atau menghapus data apa pun.

### 7.1 Membaca Dashboard

1. Login di `https://jemaat.gkjjakarta.org`. 🖼️
2. Baca kartu ringkasan: Total Warga, Total Keluarga, Kelompok Aktif, dan Data Perlu Validasi.
3. Lihat **Chart Komisi** untuk sebaran jemaat per usia.
4. Lihat **Peta Lokasi** sebagai gambaran sebaran.

### 7.2 Menu Hubungi

Lihat [8.3](#83-menu-hubungi). Jika memerlukan akses yang lebih luas, ajukan ke Kepala Kantor.

---

## 8. Panduan Jemaat

**Peran:** warga jemaat yang memiliki akun. Jemaat hanya bisa melihat dan memperbarui **data dirinya sendiri** lewat **Profil Saya**, dan membuka menu **Hubungi**.

**Menu yang tersedia:** **Profil Saya** dan **Hubungi**.

### 8.1 Mendapat akun

1. Admin gereja membuat akun dari data warga Anda.
2. Anda menerima pesan **WhatsApp** berisi username dan password sementara.
3. Buka tautan aplikasi dari pesan itu, lalu login.
4. Sistem meminta Anda **mengganti password**. Buat password baru yang hanya Anda ketahui.

Password sementara tampil sekali saja di sisi admin. Jika hilang, minta admin mengirim ulang (reset).

### 8.2 Profil Saya

**Melihat data:**
1. Setelah login Anda langsung ke **Profil Saya**. 🖼️
2. Halaman punya tiga tab: **Identitas**, **Kontak**, **Alamat**.

**Mengubah data:**
1. Pilih tab yang ingin diubah.
2. Ubah field yang diperbolehkan: golongan darah, pendidikan, pekerjaan, NIK, kontak (telepon, WhatsApp, email), alamat, dan catatan atau kebutuhan Anda.
3. Klik **Simpan**.
4. Muncul pesan *"Perubahan tersimpan dan menunggu verifikasi staf gereja."*
5. Staf gereja memeriksa perubahan Anda lewat menu Validasi Data. Selama menunggu, halaman menampilkan keterangan bahwa perubahan Anda sedang diverifikasi.

**Yang perlu diketahui:**
- **Nama lengkap** hanya bisa diubah oleh admin gereja.
- **NIK** disimpan tersamar. Kosongkan kolom jika tidak ingin mengubahnya.
- **Alamat KK** dipakai seluruh anggota keluarga, sehingga hanya **kepala keluarga** yang bisa mengubahnya.
- Kolom **Catatan / kebutuhan** dapat dibaca staf gereja dan bukan catatan internal.

### 8.3 Menu Hubungi

Menu **Hubungi** tersedia untuk **semua role**.

1. Klik **Hubungi** di sidebar. 🖼️
2. Pilih kontak yang dituju: **WA Center**, **Majelis kelompok**, **Kepala Kantor**, atau **Pendeta/Emeritus**.
3. Klik tombol WhatsApp pada kontak untuk membuka percakapan.

Daftar kontak diatur Superadmin atau Kepala Kantor di **Pengaturan → Kontak Gereja**.

---

## 9. Alur Kerja Lintas Role

### 9.1 Entry data sampai valid

```
Penatua (mobile)  ─┐
Jemaat (Profil)   ─┼─►  DRAFT  ─►  Staf Admin / Kepala Kantor memvalidasi  ─►  AKTIF
Staf Admin (entry/import) ─┘
```

| Langkah | Siapa | Di mana |
|---|---|---|
| 1. Data masuk sebagai Draft | Penatua, Jemaat, Staf Admin, Majelis | Mobile `/m`, Profil Saya, Data Warga, Import |
| 2. Melengkapi data | Staf Admin | Data Warga |
| 3. Validasi | Staf Admin atau Kepala Kantor | Validasi Data |
| 4. Data berstatus Aktif | Sistem | – |

### 9.2 Perpindahan jemaat (dua tahap)

```
Staf Admin / Majelis mencatat
        ↓
Majelis menyetujui (tahap 1)
        ↓
Kepala Kantor memvalidasi (tahap 2)
        ↓
Surat PDF dibuat → dikirim via email / WhatsApp
```

| Tahap | Siapa | Hasil |
|---|---|---|
| Pencatatan | Staf Admin, Majelis, Kepala Kantor, Superadmin | Catatan perpindahan dibuat |
| Persetujuan | Majelis (atau Kepala Kantor/Superadmin) | Tahap 1 selesai |
| Validasi akhir | Kepala Kantor (atau Superadmin) | Surat PDF bisa dikirim |

### 9.3 Pembuatan akun dan pengiriman via WhatsApp

1. Superadmin atau Kepala Kantor membuka **Pengguna → Tambah Pengguna**, memilih warga, lalu menyimpan dengan password dikosongkan.
2. Modal **Info Akun** menampilkan password sekali. Admin klik **Kirim via WhatsApp**.
3. Pengguna menerima pesan, login, lalu **mengganti password**.
4. Isi pesan diatur di **Pengaturan → Template Pesan**.

### 9.4 Kartu anggota digital

1. Staf, Majelis, atau Penatua mencari warga di **Kartu Anggota**.
2. Kartu dicetak atau dikirim lewat WhatsApp.
3. Pemegang kartu atau siapa saja bisa memindai QR untuk membuka halaman kartu publik (tanpa data sensitif).

---

## 10. Roadmap

Fitur berikut **belum tersedia** dan masih dalam perencanaan.

| Fitur | Status | Manfaat |
|---|---|---|
| Laporan rekap per kelompok/wilayah (PDF/Excel) | 🗓️ Direncanakan | Rekap data jemaat untuk pelaporan |
| Notifikasi ulang tahun jemaat via WhatsApp | 🗓️ Direncanakan | Daftar dan pengiriman ucapan ulang tahun |
| Pembuatan akun Jemaat massal | 🗓️ Usulan | Satu langkah untuk banyak warga, bukan satu per satu |
| Survei & kebutuhan jemaat | 🗓️ Usulan | Mengumpulkan catatan, kebutuhan, dan survei dari jemaat |
| Pengingat akun yang belum login | 🗓️ Usulan | Mendorong jemaat mengaktifkan akunnya |
| Aplikasi mobile `/m` untuk Jemaat | 🗓️ Usulan | Saat ini Jemaat memakai Profil Saya di web |
| Absensi ibadah via scan QR kartu | 💡 Ide | Pencatatan kehadiran di gerbang gereja |

---

## 11. Lampiran

### 11.1 Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| Menu tertentu tidak muncul | Dibatasi role | Lihat [matriks akses](#2-ringkasan-hak-akses-per-role). Hubungi admin bila perlu |
| Warga tidak muncul di daftar | Belum diinput, atau di luar kelompok Penatua | Cari ulang. Penatua hanya melihat kelompoknya |
| Kartu tanpa foto | Foto belum diunggah | Bukan bug. Unggah foto di Data Warga |
| Login ditolak | Password salah atau akun nonaktif | Reset lewat Lupa password, atau hubungi Superadmin |
| Import berhenti | Browser ditutup atau koneksi putus | Cek hasil di Data Warga, lalu import ulang baris yang belum masuk |
| Tombol Hapus tidak aktif | Role tidak berhak, atau KK masih punya anggota | Hubungi Kepala Kantor atau Superadmin |

### 11.2 Melaporkan bug

Kirim lewat WhatsApp atau email ke tim teknis dengan format berikut.

```
LAPORAN BUG
Tanggal Ditemukan : [tanggal]
Dilaporkan oleh   : [nama + jabatan]
Prioritas         : [Kritis / Tinggi / Sedang / Rendah]

Apa yang terjadi?
Langkah mengulang:
1. ...
Yang diharapkan:
Yang terjadi:
Screenshot / rekaman layar:
Username · Browser · Perangkat · URL halaman:
```

| Prioritas | Kriteria | Target penyelesaian |
|---|---|---|
| 🔴 Kritis | Sistem tidak bisa dipakai, data hilang atau rusak | 24 jam |
| 🟠 Tinggi | Fitur utama tidak berfungsi | 3 hari kerja |
| 🟡 Sedang | Fitur jalan tetapi terganggu | 1 minggu |
| 🟢 Rendah | Kosmetik | Sprint berikutnya |

### 11.3 Mengajukan fitur baru

Kirim email ke Product Owner dengan isi: judul, latar belakang masalah, deskripsi, pengguna yang terdampak, user story ("Sebagai [siapa], saya ingin [apa], agar [manfaat]"), dan kriteria selesai.

### 11.4 Kontak

| Kebutuhan | Kontak |
|---|---|
| Bug kritis atau sistem down | WhatsApp langsung ke tim teknis |
| Bug sedang atau rendah | Email atau WhatsApp dengan format laporan |
| Fitur baru | Email ke Product Owner |
| Reset password | Superadmin atau Kepala Kantor |
| Pertanyaan penggunaan | Dokumen ini, atau Staf Admin |
| Helpdesk | gkjjkeu@outlook.com |

---

*Dokumen internal GKJJ. © 2026 Gereja Kristen Jawa Jakarta — Sistem Informasi Jemaat.*
