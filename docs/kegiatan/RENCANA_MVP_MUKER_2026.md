# Rencana MVP kegiatan.gkjjakarta.org untuk Muker 22 November 2026

| | |
|---|---|
| **Status** | Disetujui 24 Okt 2026. **Sprint K1 (butir 1–6 dan sebagian 7) selesai di lokal**; belum dipasang di VPS. Lihat `sprints/sprint_k1.md` |
| **Tanggal** | 2026-10-24 (Sabtu) |
| **Pembaca** | Pemilik produk (Daru); bahan keputusan jalur kerja |
| **Dasar** | Jawaban Daru atas brief (`BRIEF_MODUL_KEGIATAN.md`) dan lima berkas yang diunggah: Matriks Evaluasi Program UPK 2026, Arahan Penyusunan RKA 2027, Contoh Program Kerja UPK (lima bidang), daftar UPK, dan contoh tabel pagu vs pengajuan |

## 0. Keputusan Daru (24 Okt 2026, malam)

1. **Jalur MVP disetujui** (login sendiri, irisan butir 1–8).
2. **Penatalayanan bukan UPK**: biaya kantor dan operasional di luar ministerium dan majelis; fokus **pemeliharaan rumah tangga** dan **kesekretariatan**. Dimodelkan sebagai **unit pengusul berjenis POS** (bukan UPK) di bawah bidang Penatalayanan: *Pemeliharaan Rumah Tangga* dan *Kesekretariatan*. Jadi ada 14 UPK + 2 pos = 16 pengusul.
3. **Visi, misi, dan renstra dijadikan master** yang bisa diperbarui tiap tahun (per tahun anggaran, hierarkis, bisa disalin ke tahun berikutnya). Isi awal: visi dan empat aspek; Daru akan menyusul dengan dokumen misi dan renstra.
4. **Pagu 2027 sementara = angka 2026**, sebagai **field master per UPK per tahun yang dapat diedit** (pos Penatalayanan: kosong sampai diisi).
5. **Pengurus UPK = Badan Pengurus Harian (BPH)**: tiga posisi *Ketua, Sekretaris, Bendahara* per unit, masing-masing dengan **nama, nomor WhatsApp, dan email**. Isi awal berupa posisi dengan nama contoh yang bisa diganti.
6. **Data Excel dari UPK menyusul**; sementara dibuat **data contoh** (diberi tanda `contoh` agar bisa dibuang sekali perintah).

## 0b. Pelajaran dari formulir 2026 (Smartsheet) dan perbaikannya

Formulir 2026 dibaca langsung di `gkjjakarta.org/form-pengajuan-kegiatan-dan-anggaran-2026/`. Isinya: *Bidang* (pilihan, tidak wajib), *Nama Kegiatan*, *Tujuan Kegiatan*, *Indikator Kegiatan* (petunjuknya "tindakan nyata apa yang akan dilakukan", jadi sebenarnya rencana tindakan), *Kategori Waktu* (Sekali Diberikan / Periode / Spesifik Rentang / Tahun), *Volume*, *Satuan Unit* (daftar; bila belum ada hubungi Pokja), *Biaya (Rupiah)*, *Total Kebutuhan Anggaran (Rupiah)* (diketik manual), *Uraian Biaya*, *Dibuat Oleh*, *No WhatsApp Data Entry*, unggah berkas, dan *cc Email*.

| Keterbatasan 2026 | Perbaikan di aplikasi baru |
|---|---|
| Satu pengiriman = satu kegiatan dengan **satu baris biaya** (volume × harga) | Satu **Program** berisi banyak kegiatan dan **banyak baris RAB**; total dihitung server |
| **Total anggaran diketik manual** (bisa tidak sama dengan volume × biaya) | Total tidak dapat diketik; selalu hasil hitung; **sumber dana harus sama dengan total** |
| **Tanpa login**: siapa pun dapat mengirim; *Bidang* tidak wajib; "Dibuat Oleh" teks bebas | Login per pengguna; **UPK terkunci** pada akun; pembuat tercatat otomatis |
| Tidak bisa disunting setelah dikirim; tidak ada draft | **Draft**, sunting sampai pengajuan ditutup, tarik kembali, lalu ajukan ulang |
| Label "Indikator" bercampur dengan rencana tindakan | Bagian terpisah: **rencana kegiatan** dan **indikator (indikator, target, bukti)** |
| Tidak ada sumber dana, target peserta, atau keselarasan visi | Ditambahkan; keselarasan memakai master acuan visi-misi |
| Satuan hanya daftar tetap; minta lewat Pokja | **Master satuan** yang dikelola admin, dan kategori biaya untuk rekap |
| Tidak ada tampilan perbandingan | **Dashboard pagu vs pengajuan** |

Yang **dipertahankan** dari 2026 karena sudah dikenal pengguna: *Kategori Waktu* empat pilihan, *Satuan Unit* dan *Biaya (Rupiah)* sebagai dasar baris RAB, *Uraian Biaya*, nomor WhatsApp pembuat, unggah berkas, dan cc email.

## 1. Temuan yang mengubah rencana

**Waktunya sangat pendek.** Pra-muker **Minggu 15 Nov 2026 (22 hari lagi)**, muker **Minggu 22 Nov 2026 (29 hari lagi)**. Pengurus UPK butuh jendela mengisi yang layak (usul: 8 hari), sehingga aplikasi **harus bisa dipakai paling lambat Minggu 1 Nov**, atau 8 hari dari sekarang. Brief sebelumnya (K1–K4 lengkap) tidak mungkin selesai untuk siklus ini. Yang mungkin adalah irisan sempit yang tepat sasaran.

**Dokumen Anda sudah menetapkan bentuk usulan.** Kita tidak perlu merancang format dari nol:
- Unit pengajuan adalah **Program Kerja** (satu hasil utama), yang memuat beberapa kegiatan/jadwal, bukan kegiatan lepas. Saya menyesuaikan istilah di seluruh rencana.
- Formulir mengikuti **10 bagian** di Contoh Program Kerja: identitas; acuan visi-misi; latar belakang; rumusan kebutuhan; tujuan; rencana kegiatan dan jadwal; indikator (indikator, target, bukti); RAB (komponen, perhitungan, jumlah); evaluasi dan pelaporan; ringkasan untuk formulir RKA (dibuat otomatis dari isian).
- **Daftar periksa 9 butir** (Arahan, slide 14) menjadi syarat sebelum mengajukan.
- **Lima kriteria prioritas** (Dampak, Urgensi, Keselarasan, Kelayakan, Keberlanjutan; Arahan, slide 12) menjadi dasar telaah. Ini menggantikan usulan kriteria saya di brief.
- **Acuan keselarasan = empat aspek visi** (bertumbuh dalam iman, peduli sesama, peduli ciptaan, relevan di kota). Misi dan sasaran strategis bertingkat belum ada di dokumen yang Anda kirim, jadi untuk siklus ini tidak dibuat; lihat pertanyaan 3.
- **Evaluasi 2026**: 46 program di 10 UPK dengan kategori A–D (A 23, B 15, C 8, D 0) dan keputusan arah 2027. Ini menjadi data awal "Program 2026" dan bahan "kelanjutan atau baru".

**Daftar UPK dan contoh dashboard.** 14 UPK. Pada contoh tabel Anda: pagu Rp300.000.000, pengajuan Rp280.680.000, 7 UPK *Over*, 6 *Under*, 1 *Sesuai*. Dua hal yang perlu diperbaiki di dashboard baru:
1. **Empat dari enam "Under" sebenarnya belum mengajukan** (Diaken, Komisi Ibadah, Kespel, Adiyuswa: pengajuan 0). "Under" menyesatkan; kita pakai status terpisah **Belum mengajukan**. Yang benar-benar di bawah pagu hanya Komisi Anak dan Majalah Dilah.
2. **Nama UPK ganda** (kolom "Nama UPK" vs "Anggaran UPK": "Komisi Adiyuswo/Adiyuswa", "Komisi Dewasa/Warga Dewasa", "Komisi Kesenian Gereja/Gerejawi", "Komisi PA/Pemahaman Alkitab", "Pengembangan Ekonomi/Jemaat"). Master UPK menyimpan **nama resmi, singkatan, dan alias** agar satu UPK tidak tercatat dua kali.

> Angka pada gambar saya perlakukan sebagai **contoh format**, bukan pagu resmi 2027. Pagu diisi admin dan dapat diubah.

## 2. Jadwal mundur dari muker

| Tanggal | Tonggak |
|---|---|
| **Sab 24 – Jum 30 Okt** | Bangun inti (login, master, formulir). **Jumat 30 Okt: gerbang go/no-go** (lihat bagian 6) |
| **Min 1 Nov** | Aplikasi live di `kegiatan.gkjjakarta.org`; 2–3 UPK uji coba |
| **Sen 2 – Sen 9 Nov** | **Jendela pengisian UPK** (8 hari) |
| **Sel 10 Nov** | **Pengajuan ditutup dan dikunci**; perbaikan hanya lewat catatan telaah |
| **10 – 14 Nov** | Konsolidasi, telaah koordinator bidang, dashboard untuk pra-muker |
| **Min 15 Nov** | **Pra-muker** |
| **16 – 21 Nov** | Revisi dan finalisasi bahan |
| **Min 22 Nov** | **Muker** (keputusan prioritas bila kebutuhan melebihi kas) |

## 3. Cakupan MVP

**Wajib sebelum 1 Nov (Sprint K1):**

| # | Kemampuan | Catatan |
|---|---|---|
| 1 | **Master**: tahun anggaran 2027; 14 UPK (nama resmi, singkatan, alias, bidang, pagu); 5 bidang; 4 aspek visi | Pagu diisi admin dari tabel Anda |
| 2 | **Akun dan login per pengguna UPK**; peran: Pengurus UPK, Koordinator bidang, Admin/Sekretariat, Majelis (lihat saja) | Akun dibuat admin; kredensial dikirim lewat tautan WhatsApp seperti di sistem jemaat |
| 3 | **Formulir Program Kerja 10 bagian**: simpan draft, banyak program per UPK, jadwal berbaris, indikator berbaris, RAB berbaris (volume × satuan × harga → jumlah otomatis), **sumber dana (gereja / swadaya / penggalangan mandiri / donasi) yang totalnya harus sama dengan RAB** | Ramah HP; pengurus UPK kemungkinan mengisi dari ponsel |
| 4 | **Daftar periksa 9 butir** sebagai syarat mengajukan; **ajukan** mengunci program | |
| 5 | **Ringkasan untuk Formulir RKA** otomatis per program, dan cetak/PDF | Format bagian 10 Contoh Program |

**Wajib sebelum 10 Nov (Sprint K2):**

| # | Kemampuan |
|---|---|
| 6 | **Dashboard pagu vs pengajuan** per UPK (Nilai, Pengajuan, Tersedia, status Under/Over/Sesuai/**Belum mengajukan**), per bidang, per aspek visi, dan **gereja vs mandiri**; rekap dapat diekspor ke Excel |
| 7 | Ekspor Excel seluruh program (satu baris per program dan per baris RAB) untuk bahan Anda sendiri |
| 8 | Data awal **Program 2026** (46 program, kategori A–D, arah 2027) sebagai rujukan "lanjutan" |

**Sebelum pra-muker 15 Nov (Sprint K3, bila waktu ada):** telaah koordinator bidang (komentar, "perlu revisi"/"layak"), skoring lima kriteria, catatan keputusan pra-muker, dan laporan konsolidasi.

**Ditunda dengan sengaja:** SSO dengan sistem jemaat; API agregat potensi peserta dari data jemaat (cukup **cuplikan angka komisi sekali ambil** sebagai petunjuk di formulir); pengajuan dana dan pencairan; LPJ; absensi (Sprint 13B); penggalangan dana bertahap; dashboard publik; versi revisi bertingkat.

## 4. Rancangan teknis ringkas

- **Produk baru** `apps/kegiatan-api` (:4200) dan `apps/kegiatan-web` (:3200) sesuai `docs/PLATFORM.md`; **database terpisah** `gkjj_kegiatan` di PostgreSQL yang sama; tidak menyentuh aplikasi jemaat maupun datanya. Stack sama (Express, Prisma 7 dengan adapter, Next 15, Tailwind, Vitest).
- **Login sendiri untuk siklus ini** (tabel pengguna sendiri, bcrypt, JWT, wajib ganti password sementara). SSO ditunda; saat SSO diputuskan (P1), akun dipetakan lewat email atau username. Risikonya: satu akun lagi per pengurus (±20–40 akun).
- **Satuan data:** `Program` → `KegiatanJadwal[]`, `Indikator[]`, `RabItem[]`, `SumberDana[]`, `AspekVisi[]`; `Upk`, `Bidang`, `Pengguna`, `TahunAnggaran`, `LogAudit`. Uang disimpan sebagai bilangan bulat rupiah (bukan desimal). Total RAB dan total sumber dana dihitung server, tidak dipercaya dari klien.
- **Keamanan:** akses per UPK ditegakkan di server (pengurus hanya melihat dan mengubah programnya sendiri; koordinator bidang membaca bidangnya; admin dan majelis membaca semua); audit log atas perubahan dan pengajuan; program terkunci tidak dapat diubah oleh pengguna biasa.
- **Pemasangan produksi:** penggantian landing `kegiatan` dengan proxy ke aplikasi, PM2 baru, `.env` dan database baru. Perintah di VPS Anda jalankan sendiri (seperti sebelumnya); `jemaat` dan `api` tidak diubah. Memori cukup (4 GB; lihat `docs/PLATFORM.md` bagian 5).
- **Pengujian:** pola yang sama dengan sistem jemaat: tes route per peran (matriks otorisasi), validasi (total sumber = RAB), mutation check untuk aturan uang dan akses, dan verifikasi di browser pada lebar HP.

## 5. Penggunaan data jemaat

Untuk siklus ini hanya **angka agregat sekali ambil**: jumlah warga aktif per komisi usia, per wilayah, dan per status sakramen, diambil dari dashboard jemaat dan ditampilkan sebagai petunjuk "potensi peserta" di formulir. Sebelumnya cek kartu **Kualitas dan Progres Data** di produksi: potensi per komisi dihitung dari tanggal lahir, jadi warga tanpa tanggal lahir menurunkan angkanya. Integrasi API otomatis menyusul setelah muker.

## 6. Risiko dan gerbang keputusan

| Risiko | Mitigasi |
|---|---|
| 8 hari membangun produk baru di VPS produksi | Irisan sempit (bagian 3), tanpa SSO, tanpa integrasi; satu orang kerja terfokus |
| Pengurus UPK sulit mengisi atau lambat | Formulir mengikuti contoh yang sudah dikenal; contoh terisi; admin dapat mengisi atas nama UPK |
| Pagu dan aturan anggaran belum baku | Pagu, kategori RAB, dan sumber dana dapat diubah admin; bukan tertanam di kode |
| Data anggaran sensitif | Akses per UPK, audit log, database terpisah |
| Aplikasi tidak stabil saat jendela pengisian | Pilot 2–3 UPK sebelum dibuka; cadangan database harian; jendela pengisian tidak dibuka sebelum lolos uji |

**Gerbang go/no-go Jumat 30 Okt.** Bila formulir (butir 1–5) belum stabil, **fallback**: siklus 2026 memakai alur Smartsheet atau Excel yang sudah Anda pakai untuk pagu vs pengajuan, dengan templat 10 bagian dari aplikasi (cetak atau ekspor), dan aplikasi dilanjutkan sebagai alat revisi dan pelaksanaan 2027. Keputusan diambil bersama Anda pada hari itu, berdasarkan demo, bukan harapan.

## 7. Keputusan yang saya perlukan

1. **Setujui jalur MVP ini** (login sendiri, irisan butir 1–8), atau pilih fallback sejak sekarang.
2. **Petakan UPK ke bidang** (usulan di bawah; mohon dikoreksi). *Penatalayanan* belum punya UPK pada daftar Anda: siapa pengusulnya?
3. **Misi dan sasaran strategis**: apakah ada dokumen di luar visi dan empat aspek yang Anda kirim? Bila tidak, keselarasan memakai empat aspek visi untuk siklus ini.
4. **Pagu resmi per UPK** untuk 2027 (tabel contoh dipakai sebagai format; konfirmasi angkanya).
5. **Siapa saja pengguna per UPK** (jumlah dan nama) dan **siapa koordinator tiap bidang**; **siapa yang mengelola akun** (admin).
6. **Sekarang dengan 4 UPK tanpa evaluasi 2026** (Komisi Ibadah, Adiyuswa, Perpustakaan Aksara Kita, Komisi PA): apakah ada data program 2026 mereka, atau mulai kosong?

**Usulan pemetaan UPK → bidang (belum dikonfirmasi):**

| Bidang | UPK |
|---|---|
| Peribadahan | Komisi Ibadah; Komisi Kesenian Gereja |
| Pembinaan 1 (warga dewasa) | Komisi Warga Dewasa; Komisi Pemahaman Alkitab; Komisi Adiyuswa; Majalah Dilah; Perpustakaan Aksara Kita |
| Pembinaan 2 (anak, remaja, pemuda) | Komisi Anak; Komisi Remaja; Komisi Pemuda |
| Kesaksian dan Pelayanan | Diaken; Komisi Kespel; Pengembangan Ekonomi Jemaat; LP4WG |
| Penatalayanan | (belum ada UPK pada daftar) |
