# Analisa Fitur: Tautkan Warga ke Pengguna & Notifikasi Akun via WhatsApp

| | |
|---|---|
| **Status** | Request fitur — belum dikerjakan (analisa) |
| **Diajukan oleh** | Daru (Superadmin) |
| **Tanggal** | 2026-10-06 |
| **Kategori** | Peningkatan Fitur (Manajemen Pengguna + Pengaturan Sistem) |
| **Pengguna terdampak** | Superadmin, Kepala Kantor (yang mengelola akun) |

## 1. Latar Belakang

Saat menambah pengguna entry data, nama dan nomor WhatsApp harus diketik ulang padahal orangnya sudah ada di data warga. Setelah akun dibuat, pengguna diberi tahu secara manual bahwa mereka bisa masuk ke portal `jemaat.gkjjakarta.org`.

## 2. Permintaan

1. Saat menambah pengguna, pilih **warga** dari database; **nama** dan **no. WhatsApp** terisi otomatis dari data warga.
2. Kirim **notifikasi WhatsApp** berisi: portal dapat diakses di `jemaat.gkjjakarta.org` beserta **password default**.
3. **Template pesan WhatsApp configurable** (diatur dari menu Sistem, tidak hardcode).

## 3. Kondisi Saat Ini (hasil baca kode)

| Hal | Kondisi |
|---|---|
| Relasi user–warga | `User.wargaId` sudah ada (opsional, unik). API `POST /users` sudah menerima `wargaId`. |
| Form Pengguna | [pengguna/page.tsx](../apps/web/src/app/(dashboard)/pengguna/page.tsx) — nama, username, email, password diketik manual; belum ada pemilih warga yang mengisi otomatis. |
| WhatsApp | `Warga.whatsapp` ada. `User` tidak punya kolom WA. **Tidak ada integrasi pengiriman WA** di kode. |
| Password | Diisi manual (min. 8 karakter) atau dari kolom Excel saat import pengguna. **Tidak ada konsep password default.** |
| Paksa ganti password | `User.mustChangePassword` sudah ada dan sudah diproses di `ProtectedRoute` (web) dan layout mobile. Saat ini baru bernilai `true` lewat jalur tertentu; `POST /users` belum mengaturnya. |
| Konfigurasi sistem | [pengaturan/page.tsx](../apps/web/src/app/(dashboard)/pengaturan/page.tsx) punya tab (Komisi, Kelurahan) — pola yang bisa dipakai untuk tab "Template Pesan". |

## 4. Rancangan Fungsional

### 4.1 Pemilih warga di form Tambah/Ubah Pengguna
- Field **"Tautkan ke warga"** (pencarian nama/nomor anggota, reuse komponen pencarian warga yang sudah ada).
- Setelah dipilih: `nama` terisi dari `namaLengkap`, `whatsapp` dari `Warga.whatsapp`, `email` dari `Warga.email` bila ada. Semua tetap bisa diedit.
- Warga yang sudah punya akun (`wargaId` unik) ditandai dan tidak bisa dipilih lagi.
- Bila warga belum punya WhatsApp: field WA kosong dan wajib diisi manual jika ingin mengirim notifikasi; tawarkan centang **"simpan juga ke data warga"** (ikut audit log).

### 4.2 Nomor WhatsApp pada pengguna
- Sumber utama: `Warga.whatsapp`. Tambah `User.whatsapp` (nullable) hanya sebagai **override / untuk pengguna tanpa warga** (mis. akun staf).
- Normalisasi saat simpan/kirim: `08xx` / `+62` / spasi / strip → `628xx` (format wa.me/API). Validasi panjang dan awalan.

### 4.3 Password default
Permintaan menyebut "password default". Ada tiga opsi; **rekomendasi: opsi B**.

| Opsi | Cara | Catatan |
|---|---|---|
| A | Satu password default global (di Pengaturan) | Paling sederhana, tapi semua akun baru punya password yang sama dan terkirim lewat WA. Aman hanya jika **wajib ganti saat login pertama**. |
| **B (rekomendasi)** | **Password acak per pengguna** (mis. 10 karakter), otomatis dibuat saat akun dibuat, dikirim lewat WA | Tetap "default" dari sudut pandang pengguna (tinggal pakai dari pesan), tapi tidak bisa ditebak dari akun lain. |
| C | Password default global yang diatur di Pengaturan, bisa diganti kapan saja | Varian A dengan konfigurasi. Hindari jika data sensitif (UU PDP). |

Apa pun opsinya: akun baru dengan password default **wajib** `mustChangePassword = true` (mekanisme paksa ganti sudah ada). Password plaintext **tidak disimpan** di DB, hanya ditampilkan/dikirim sekali saat dibuat atau di-reset.

### 4.4 Template pesan (configurable)
- Tab baru **Sistem → Pengaturan → Template Pesan**.
- Tabel `TemplatePesan`: `kode` (mis. `AKUN_BARU`, `RESET_PASSWORD`), `nama`, `isi`, `aktif`, `updatedBy`, `updatedAt`.
- Placeholder: `{{nama}}`, `{{username}}`, `{{password}}`, `{{url_portal}}`, `{{role}}`, `{{kelompok}}`.
- `{{url_portal}}` berasal dari setting (default `https://jemaat.gkjjakarta.org`), bukan hardcode di template.
- Editor dengan **pratinjau** hasil render memakai data contoh, validasi placeholder tidak dikenal, dan tombol "Kembalikan ke default".
- Template bawaan (seed):

```
Shalom {{nama}},

Akun Anda untuk Database Warga GKJ Jakarta sudah dibuat.
Portal : {{url_portal}}
Username : {{username}}
Password : {{password}}

Anda akan diminta mengganti password saat login pertama.
Mohon jangan bagikan password ini kepada siapa pun.
Tuhan memberkati.
```

### 4.5 Pengiriman
Alur: simpan pengguna → dialog **"Kirim notifikasi WhatsApp?"** dengan pratinjau pesan → kirim. Tersedia juga tombol **"Kirim ulang info akun"** di baris pengguna (yang sekaligus meng-reset ke password baru).

Tiga cara kirim — **rekomendasi bertahap**:

| Fase | Cara | Kelebihan | Kekurangan |
|---|---|---|---|
| **1 (rekomendasi mulai)** | Tombol **wa.me click-to-chat** (membuka WhatsApp dengan pesan terisi, admin tekan Kirim) | Tanpa biaya, tanpa vendor, tanpa risiko blokir nomor; cukup untuk puluhan pengguna entry data | Manual per orang; tidak ada status terkirim otomatis |
| 2 | **WhatsApp Business Cloud API** (resmi) | Otomatis, ada status terkirim | Perlu akun Meta Business, template pesan disetujui Meta, biaya per percakapan |
| 3 | Gateway tidak resmi (mis. Fonnte, WAHA) | Murah, cepat | Risiko nomor gereja diblokir, bergantung vendor — **tidak direkomendasikan** |

Rancang `NotifikasiService` dengan antarmuka penyedia (`WaLinkProvider`, nanti `CloudApiProvider`) sehingga pindah fase tidak mengubah form maupun template. Skala pengguna entry data kecil, jadi fase 1 sudah menutup kebutuhan.

### 4.6 Log
Tabel `NotifikasiLog` (userId, templateKode, nomor yang dimasker, status `DIKIRIM_MANUAL/TERKIRIM/GAGAL`, oleh siapa, waktu). Pesan yang berisi password **tidak** disimpan utuh; simpan versi dengan `{{password}}` dimasker. Aksi juga tercatat di Log Aktivitas.

## 5. Rancangan Teknis (ringkas)

**Database (migrasi baru)**
- `User.whatsapp String? @db.VarChar(20)`
- `TemplatePesan` (lihat 4.4), `NotifikasiLog` (lihat 4.6)
- Setting `url_portal` dan (bila opsi A/C) `password_default` — pakai mekanisme setting yang sudah dipakai Pengaturan Komisi, atau tabel `Pengaturan` key–value jika belum ada.

**API (`apps/api`)**
- `POST /users` dan `PUT /users/:id`: terima `whatsapp`; `POST` men-generate password bila kosong (opsi B), set `mustChangePassword: true`, mengembalikan password **sekali** di respons.
- `GET/PUT /pengaturan/template-pesan`, `POST /pengaturan/template-pesan/preview`
- `POST /users/:id/notifikasi` → render template, buat tautan wa.me / panggil provider, catat `NotifikasiLog`.
- Zod untuk semua input; role: SUPERADMIN & KEPALA_KANTOR (sama seperti `usersRouter`).

**Web (`apps/web`)**
- Form Pengguna: pemilih warga + field WA + opsi generate password + dialog kirim.
- Pengaturan: tab Template Pesan.
- Import pengguna Excel: kolom opsional **No. WhatsApp** dan **Kode/ID warga**, plus aksi "kirim massal" (membuat daftar tautan wa.me berurutan).

**Tes**: unit render template & normalisasi nomor; API users (generate password, `mustChangePassword`, warga sudah terpakai); komponen dialog kirim.

## 6. Risiko & Catatan

| Risiko | Mitigasi |
|---|---|
| Password terkirim lewat WhatsApp (plaintext di chat) | Password acak per pengguna + paksa ganti saat login pertama + masa berlaku singkat (opsional) |
| Nomor WA warga salah/kosong/format beda | Normalisasi + validasi + pratinjau nomor sebelum kirim |
| Kepatuhan UU PDP: nomor WA adalah data pribadi | Hanya dipakai untuk tujuan akun; dimasker di log; pengiriman tercatat |
| Pengguna lama dengan password sudah dibagikan | Fitur ini hanya untuk akun baru / reset; tidak mengubah akun yang ada |
| Mobile (`/m`) ikut kena paksa ganti password | Sudah ditangani di layout mobile (`mustChangePassword`) |

## 7. Estimasi

| Fase | Isi | Perkiraan |
|---|---|---|
| 1 | Pemilih warga, `User.whatsapp`, password acak + `mustChangePassword`, template + pratinjau, kirim via wa.me, log | ± 1 sprint |
| 2 | Import Excel (kolom WA/warga) + kirim massal | ± 0,5 sprint |
| 3 | WhatsApp Cloud API (butuh akun Meta Business & persetujuan template) | Menyusul, tergantung kesiapan akun |

## 8. Keputusan (divalidasi Daru, 2026-10-06)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Password default | **Acak per pengguna**, wajib ganti password saat login pertama (`mustChangePassword = true`). Tidak ada password global. |
| 2 | Template pesan | Dua template bawaan: **Akun Baru** dan **Reset Password**. Template pengingat ditunda. |
| 3 | Nomor WA | Sumber utama adalah field **WhatsApp di tab Kontak** pada form Warga ([WargaForm.tsx](../apps/web/src/app/(dashboard)/warga/WargaForm.tsx)). Prioritas: lengkapi nomor di tab Kontak warga lebih dulu; form Pengguna membaca dari sana. Jika diisi manual saat membuat pengguna, nomor boleh ikut disimpan ke data warga (centang opsional, tercatat di audit log). |
| 4 | Pengiriman | Hanya **Superadmin dan Kepala Kantor**. |
| 5 | Cara kirim fase 1 | **Tautan wa.me** (manual tekan Kirim). WhatsApp Business API menyusul. |

Konsekuensi: opsi A/C pada 4.3 dan fase 3 (Cloud API) tidak dikerjakan sekarang; kolom `User.whatsapp` tetap hanya sebagai override untuk akun tanpa warga.

## 9. Kriteria Selesai (fase 1)

1. Memilih warga di form Tambah Pengguna mengisi nama & WA otomatis; warga yang sudah punya akun tidak bisa dipilih.
2. Template pesan dapat diubah dari Sistem → Pengaturan, dengan pratinjau, tanpa deploy ulang.
3. Setelah akun dibuat, admin dapat membuka WhatsApp dengan pesan terisi (nama, portal `jemaat.gkjjakarta.org`, username, password).
4. Login pertama pengguna baru memaksa ganti password.
5. Pengiriman tercatat di log tanpa menyimpan password.

---

# Tambahan Request (2026-10-06): Role Jemaat & Halaman Hubungi

Akun yang dibuat lewat fitur di atas tidak hanya untuk petugas entry data, tetapi juga untuk **jemaat biasa** yang mengelola data dirinya sendiri. Bagian ini menambahkan role baru dan satu menu.

## 10. Role Pengguna "Jemaat"

### 10.1 Prinsip
- Role baru `JEMAAT` pada enum `UserRole` (saat ini: SUPERADMIN, KEPALA_KANTOR, MAJELIS, STAF_ADMIN, PENATUA_KELOMPOK, VIEWER).
- **Wajib tertaut ke warga** (`User.wargaId`). Jemaat tanpa tautan tidak melihat apa pun (fail-closed, sama seperti penatua tanpa kelompok).
- Jemaat **hanya melihat dan mengubah data dirinya sendiri**. Tidak ada daftar warga, dashboard, kelompok, import, maupun menu Sistem.

### 10.2 Data yang boleh diubah (whitelist di server)

| Tab | Field | Catatan |
|---|---|---|
| Identitas | Nama panggilan, tempat lahir, tanggal lahir, NIK, golongan darah | Nama lengkap dan jenis kelamin hanya dilihat |
| Kontak | Telepon, WhatsApp, email, pendidikan terakhir, pekerjaan, catatan | Nomor WA diset sama normalisasinya dengan 4.2 |
| Alamat | Alamat Rumah Tangga (KK), Alamat KTP, Alamat Domisili | Domisili tampil jika dicentang **"berbeda dengan alamat KTP"**; bila tidak dicentang, domisili dikosongkan (perilaku sama dengan form Warga sekarang) |

**Tidak boleh diubah oleh Jemaat:** nama lengkap, nomor anggota/induk, status keanggotaan, data baptis/sidi, relasi keluarga/status dalam keluarga, status data (`dataStatus`), konsen PDP, koordinat rumah, dan data warga lain (termasuk anggota keluarganya).

### 10.3 Perubahan yang perlu keputusan (risiko data)
1. **Alamat KK milik Keluarga, bukan Warga.** Satu alamat KK dipakai semua anggota. Jika semua jemaat bebas mengubahnya, satu orang bisa mengubah alamat anggota lain. Opsi (rekomendasi: **A**):
   - **A.** Alamat KK hanya bisa diubah oleh **kepala keluarga**; anggota lain hanya melihat.
   - B. Semua anggota boleh, perubahan masuk antrean verifikasi.
2. **Perubahan oleh jemaat perlu diverifikasi staf.** Rekomendasi: setelah jemaat menyimpan, `dataStatus` kembali ke status "perlu validasi" dan muncul di menu Validasi Data, dengan penanda "diubah mandiri oleh jemaat", agar kerja cleansing staf tidak tertimpa data yang belum diperiksa.
3. **NIK** adalah data sensitif (terenkripsi AES-256, unik). Perubahan NIK dari jemaat: tampilkan dimasker, validasi 16 digit, tolak jika bentrok dengan warga lain, dan **selalu** masuk antrean verifikasi.
4. **Catatan**: field ini juga dipakai staf. Pisahkan "catatan dari jemaat" dari catatan internal agar catatan staf tidak terbaca atau tertimpa jemaat (rekomendasi). Alternatif sederhana: jemaat tidak melihat catatan internal.

### 10.4 Catatan jemaat & pengembangan survei
Catatan jemaat disimpan terpisah dari `Warga.catatan` (internal). Rekomendasi: tabel `CatatanJemaat` (`wargaId`, `jenis`, `isi`, `createdAt`, `updatedAt`) dengan kolom `jenis` (mis. `CATATAN`, nanti `KEBUTUHAN`, `SURVEI`) agar survei dan kebutuhan jemaat bisa ditambahkan tanpa mengubah struktur. Fase ini hanya mengaktifkan jenis `CATATAN`; staf dapat membacanya, jemaat tidak melihat catatan internal.

### 10.5 Rancangan teknis
- **API khusus** `GET/PUT /api/profil-saya` (+ `/profil-saya/keluarga`): id warga diambil dari token (`user.wargaId`), **bukan dari parameter URL**, supaya tidak bisa membuka data warga lain (IDOR). Jangan memakai ulang rute `/warga/:id` untuk role ini.
- Skema Zod terpisah berisi hanya field whitelist 10.2 (`.strict()` agar field lain ditolak), bukan skema form Warga penuh.
- Tambahkan `JEMAAT` ke: enum Prisma + migrasi, `ROLES` di [users.ts](../apps/api/src/routes/users.ts), tipe di `packages/types`, [Sidebar.tsx](../apps/web/src/components/layout/Sidebar.tsx), [ProtectedRoute.tsx](../apps/web/src/components/layout/ProtectedRoute.tsx), dropdown role di form Pengguna dan import Excel. Semua `authorize(...)` yang ada tidak menyertakan JEMAAT, jadi default-nya tertutup; verifikasi dengan tes.
- Setelah login, Jemaat diarahkan ke **Profil Saya** (bukan Dashboard).
- Form profil: 3 tab (Identitas, Kontak, Alamat) memakai ulang komponen input form Warga bila memungkinkan; tampilan mobile-first karena jemaat umumnya memakai ponsel.
- Setiap perubahan tercatat di audit log (data lama/baru) dan ditandai sumbernya "jemaat".
- Pembuatan akun jemaat memakai alur yang sama dengan bagian 4 (pilih warga, password acak, template Akun Baru lewat wa.me). Pendaftaran mandiri tidak termasuk request ini.

## 11. Menu "Hubungi"

Menu baru di sidebar kiri (terlihat untuk role JEMAAT; untuk role lain opsional/tidak ditampilkan). Berisi empat kartu kontak, masing-masing dengan tombol **Chat WhatsApp**:

| # | Kontak | Sumber data | Catatan |
|---|---|---|---|
| 1 | **GKJ WhatsApp Center** | Setting (Pengaturan) | Nomor tunggal, configurable |
| 2 | **Majelis kelompok** (nama lengkap + WA) | Otomatis: kelompok dari keluarga jemaat → `Kelompok.penatua` → `Warga.namaLengkap` + `Warga.whatsapp` | Hanya majelis kelompok jemaat itu sendiri. Jika kelompok belum punya penatua tertaut atau penatua belum punya WA, tampilkan pesan "belum tersedia, hubungi WhatsApp Center" |
| 3 | **Kepala Kantor** (nama + WA) | Setting **Kontak Gereja**, input manual (keputusan 13.4) | Bisa lebih dari satu |
| 4 | **Pendeta** (nama + WA) | Setting (Pengaturan) | Belum ada role/model Pendeta di sistem, jadi dikelola sebagai kontak konfigurasi (bisa lebih dari satu pendeta) |

**Yang perlu dibangun:** tabel `KontakGereja` (`kode`, `label`, `nama`, `whatsapp`, `urutan`, `aktif`) untuk item 1, 3, dan 4, dengan tab baru **Sistem → Pengaturan → Kontak Gereja**. Item 1, 3, dan 4 dikelola manual. Item 2 dihitung dinamis di API `GET /api/hubungi` (data minimal: nama dan WA, bukan seluruh record warga/pengguna).

**Format tautan:** `https://wa.me/<nomor 628xx>` dengan teks awal opsional, mis. `?text=Shalom, saya {nama} dari {kelompok}`. Di ponsel membuka aplikasi WhatsApp langsung; di desktop membuka WhatsApp Web. Nomor dinormalisasi (`08xx`/`+62` menjadi `628xx`) dengan fungsi yang sama seperti 4.2, sehingga tautan tidak pernah rusak karena format.

**Privasi (UU PDP):** nomor majelis dan kepala kantor ditampilkan ke jemaat, jadi mereka perlu **setuju** nomornya dipakai untuk fungsi ini (sekali konfirmasi). Jemaat hanya melihat kontak yang relevan dengan dirinya, tidak ada daftar penuh.

## 12. Estimasi Tambahan

| Fase | Isi | Perkiraan |
|---|---|---|
| 4 | Role JEMAAT, API Profil Saya, halaman profil 3 tab, antrean verifikasi perubahan | ± 1 sprint |
| 5 | Menu Hubungi + tab Pengaturan Kontak Gereja | ± 0,5 sprint |

Fase 4 bergantung pada fase 1 (relasi warga–pengguna dan pembuatan akun). Fase 5 bisa dikerjakan terpisah.

## 13. Keputusan (tambahan, divalidasi Daru 2026-10-06)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Alamat KK | Hanya **kepala keluarga** yang boleh mengubah. Anggota lain hanya melihat. |
| 2 | Verifikasi | Semua perubahan data oleh jemaat masuk **antrean Validasi Data** untuk diperiksa **staf dan Kepala Kantor**, dan perubahannya tercatat di log (data lama/baru, sumber "jemaat"). NIK tetap wajib diverifikasi. |
| 3 | Catatan | Jemaat punya **catatan sendiri, terpisah dari catatan internal**. Struktur dibuat bisa dikembangkan untuk **survei dan kebutuhan jemaat** ke depan (lihat 10.5). |
| 4 | Kontak di menu konfigurasi | Nomor WhatsApp Center, **Kepala Kantor**, dan Pendeta **diinput manual** di Sistem → Pengaturan → Kontak Gereja (tidak diambil otomatis dari akun). Hanya **majelis kelompok** yang tetap otomatis dari data kelompok. |

Dampak ke rancangan: baris "Kepala Kantor" pada tabel 11 berubah dari otomatis menjadi manual lewat `KontakGereja`; perubahan jemaat memakai antrean Validasi Data yang sudah ada (perlu penanda sumber "jemaat" dan akses Kepala Kantor ke antrean itu).

**Masih terbuka:**
1. Berapa pendeta yang ditampilkan? (Karena manual, daftar bisa lebih dari satu; cukup sebutkan.)
2. Menu Hubungi hanya untuk role Jemaat, atau semua role?
3. Persetujuan majelis, Kepala Kantor, dan pendeta atas nomor WA yang ditampilkan ke jemaat: cukup konfirmasi di luar sistem, atau dicatat di sistem? Karena nomor diinput manual di Kontak Gereja, saran saya cukup konfirmasi di luar sistem untuk ketiganya; untuk majelis kelompok (nomor diambil dari data warga) saran saya tambahkan centang "boleh ditampilkan ke jemaat".

### Keputusan lanjutan (2026-10-06)

- **Daftar Pendeta** dapat diaktifkan/dinonaktifkan per orang dan mendukung **Pendeta Emeritus** (jenis kontak tersendiri, ditandai "Emeritus").
- Menu **Hubungi tampil untuk semua role**.
- Majelis kelompok hanya tampil bila penatua mencentang **"boleh ditampilkan ke jemaat"** (tab Kontak form Warga).
- **Status implementasi:** fase 1 dan fase 5 selesai di **Sprint 10**; fase 4 (Role Jemaat) dijadwalkan di **Sprint 11**.

## 14. Kriteria Selesai (tambahan)

1. Akun role Jemaat hanya dapat membuka Profil Saya dan Hubungi; akses ke URL/API lain ditolak (tes otomatis).
2. Jemaat dapat mengubah hanya field pada 10.2; field lain dan data warga lain ditolak oleh server meski permintaan dimanipulasi.
3. Checkbox "domisili berbeda dengan alamat KTP" berperilaku sama dengan form Warga.
4. Perubahan jemaat tercatat di audit log dan muncul di antrean validasi staf.
5. Halaman Hubungi menampilkan 4 kontak; semua tombol membuka `wa.me` dengan nomor ternormalisasi, dan kontak yang kosong menampilkan pesan pengganti, bukan tautan rusak.
