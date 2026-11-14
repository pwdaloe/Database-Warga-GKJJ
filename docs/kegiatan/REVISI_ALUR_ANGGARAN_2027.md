# Revisi alur penetapan anggaran RKA 2027

*Diskusi 10 Nov 2026. Status: **keputusan disimpan, belum dikerjakan**. Merevisi alur pagu dan pengajuan pada `RENCANA_MVP_MUKER_2026.md`. Titik lanjut: `LANJUTAN.md`.*

## 1. Kondisi sebelum revisi (dari kode, 10 Nov)
- Pagu = satu angka per UPK per tahun (`pagu_unit`), diisi admin/sekretariat lewat Master (`PUT /master/pagu`). Tidak ada pagu bidang.
- Total anggaran UPK **tidak disimpan**; dihitung ulang di dashboard dari RAB program berstatus `DIAJUKAN` (program `DRAFT` ditampilkan terpisah).
- Pagu **tidak mengikat**: `ajukanProgram` hanya memeriksa kelengkapan dan total sumber dana = total RAB. Lebih dari pagu hanya ditandai *Over*.
- Dashboard membandingkan pagu dengan **total RAB** (bukan porsi dana Gereja).
- Tidak ada persetujuan, angka final, riwayat perubahan nilai (`log_audit` hanya mencatat nilai baru), maupun realokasi.
- Koordinator bidang hanya melihat; Majelis, Ministerium, dst. hanya melihat.

## 2. Alur baru

| Tahap | Pelaku | Hasil |
|---|---|---|
| 1. Penetapan pagu | Keuangan (admin) | Pagu besar 2027 dari **Kas Jemaat** (proyeksi persembahan): per bidang, Kemajelisan, Ministerium, pos Penatalayanan. Pagu bidang diinformasikan ke ketua bidang |
| 2. Penyusunan | Pengurus UPK | Program, jadwal, RAB, sumber dana |
| 3. Pra-muker | Ketua bidang + ketua, sekretaris, bendahara tiap UPK (admin membantu) | Rumusan kegiatan dan biaya per UPK, selaras visi dan misi 2027; pembagian pagu bidang ke UPK |
| 4. Muker | Admin atau sekretariat mencatat | Bidang yang kurang: alasan dibahas, dicari jalan tengah (kolaborasi). Bidang yang bisa dikurangi: sisa direalokasi |
| 5. Ditetapkan | Admin | Angka disetujui dikunci |

Kegiatan yang tidak butuh dana Kas Jemaat **tetap dicatat** dengan sumber Swadaya atau Penggalangan (atau Donasi).

## 3. Keputusan Daru (10 Nov)
1. Pagu di level **bidang**. Cara input dan realokasi anggaran antar-UPK dalam satu bidang perlu dirancang (lihat butir terbuka A).
2. **Tiga angka sebelum "disetujui"**: Pagu → Usulan UPK → Rumusan pra-muker → Disetujui muker, **disimpan berdampingan dengan riwayat revisi** (agar proses diskusi penetapan terlihat).
3. Yang mengubah angka: **pra-muker = ketua bidang + admin** (membantu); **muker = hanya admin atau sekretariat**. Dashboard dapat dilihat per bidang dan UPK; **Majelis dan LP4WG melihat seluruh pagu**.
4. **Realokasi** dicatat sebagai transaksi (dari, ke, jumlah, alasan) plus saldo "belum dialokasikan".
5. **Kolaborasi antar-bidang/UPK**: dicatat di satu unit penanggung jawab, sehingga satu program dapat memiliki beberapa pemilik anggaran (tafsiran, butir terbuka C).
6. **Kemajelisan dan Penatalayanan** diadministrasi admin dan bidang Penatalayanan; **Ministerium** diisi admin atau sekretariat.
7. Ada **proyeksi Kas Jemaat 2027** (satu angka) sebagai pembanding total pagu.
8. **Empat jenis sumber dana tetap**: Gereja; Swadaya (sudah ada kas UPK yang dipakai); Penggalangan (kegiatan penggalangan dana, mis. penjualan di bazar); Donasi (persembahan khusus atau donatur untuk kegiatan itu).
9. **Pembanding pagu = porsi dana Gereja**, bukan total RAB.
10. **Dashboard tambahan**: UPK mana yang dapat menjalankan kegiatan dengan porsi pendanaan yang terisi walau **tanpa dana Gereja sama sekali**.
11. Misi 2027 akan diberikan menyusul.
12. Semua data yang ada sekarang **dummy dan boleh dihapus** (migrasi lebih bersih; tetap SQL aditif manual dulu sebelum deploy, pelajaran Sprint 13).
13. Tanggal pra-muker dan muker **sudah diubah Daru di aplikasi** (kemungkinan produksi). Database lokal masih 15 dan 22 Nov (`updated_at` 24 Okt); **tanggal baru belum diverifikasi** (SSH butuh password, user menjalankan perintah VPS sendiri).

## 4. Usulan desain (belum disetujui rinci)

**Klasifikasi program (dashboard "bisa jalan")**: *Mandiri penuh* = dana Gereja 0 dan Swadaya+Penggalangan+Donasi = total RAB; *Campuran*; *Bergantung Kas Jemaat* = dana Gereja = total RAB. Rinci per jenis ditampilkan terpisah (kepastian berbeda: kas UPK sudah ada, penggalangan masih rencana, donasi bergantung donatur). Per UPK dan bidang: dana Gereja diminta vs pagu, kurang atau sisa yang dapat direalokasi.

**Tahap siklus dengan kunci**: Penetapan pagu → Penyusunan UPK → Pra-muker → Muker → Ditetapkan.

**Cakupan data baru (garis besar)**: pagu bidang dan unit anggaran lain; alokasi per UPK dalam bidang; tahap siklus; tiga versi angka program (usulan, rumusan, disetujui) dengan riwayat revisi beralasan; transaksi realokasi; proyeksi Kas Jemaat; pembagian beban program antar-unit; peran baru/hak edit koordinator bidang di pra-muker.

## 5. Butir terbuka (menunggu Daru)
- **A. ✅ Diputuskan 10 Nov:** alokasi per UPK **hanya panduan** (indikatif) untuk memudahkan alokasi 2027 berdasarkan actual; batas keras hanya di level bidang. Ketua bidang membagi di pra-muker; pindah jatah antar-UPK dicatat beralasan.
- **B. ✅ Diputuskan 11 Nov:** pagu **per pos**: 4 pos Penatalayanan, Ministerium, dan Kemajelisan masing-masing punya pagu; nilainya diisi Daru sesuai angka 2027.
- **C. ✅ Diputuskan 10 Nov (Opsi 1, dibagi per program):** satu program punya satu unit penanggung jawab (PJ). **PJ mengusulkan pembagian porsi** dana Gereja ke unit-unit yang ikut; tiap unit menanggung porsinya dari pagu bidangnya. **Hanya PJ yang boleh mengedit program.** **Swadaya ikut dibagi per unit** (kas milik unit masing-masing); **Penggalangan dan Donasi tetap di level program**. Aturan: jumlah porsi dana Gereja semua unit = dana Gereja program, kalau tidak sama program belum bisa diajukan. *Contoh:* Retret Keluarga Muda, PJ Komisi Warga Dewasa, RAB Rp20 jt, dana Gereja Rp12 jt = KWD 6 jt + Komisi Pemuda 4 jt + Komisi Anak 2 jt.
  - **✅ Persetujuan mitra (11 Nov):** unit mitra (atau ketua bidangnya bila lintas bidang) **perlu menyetujui** porsi pembagian anggarannya bila program dijalankan bersama. Asumsi implementasi (belum dikonfirmasi): porsi berstatus *Menunggu* / *Disetujui* / *Ditolak*; program boleh diajukan, tetapi **tidak dapat dikunci/ditetapkan selama ada porsi yang belum disetujui**; dashboard menandai program tersebut.
- **D. ✅ Diputuskan 11 Nov:** UPK tetap dapat mengubah program **sampai pra-muker dikunci**; sesudah itu hanya ketua bidang dan admin (muker: admin atau sekretariat). Satu langkah **"Kunci dan tetapkan"** oleh admin cukup. **Fitur lanjutan (di luar cakupan sekarang): "Penyesuaian anggaran dan kegiatan tengah tahun 2027"**; model riwayat/versi dirancang agar dapat diperluas ke sana.
- **E. ✅ Diputuskan 11 Nov:** klasifikasi dashboard *Mandiri penuh / Campuran / Bergantung Kas Jemaat*, dengan rincian per jenis dana (Gereja, Swadaya, Penggalangan, Donasi).
- **✅ Tanggal baru (diberikan Daru 10 Nov): pra-muker Senin 16 Nov 2026, muker Senin 23 Nov 2026.** Belum dicek ulang di database produksi; lokal masih 15 dan 22 Nov. Query verifikasi:

```bash
sudo -u postgres psql gkjj_kegiatan -c "select tahun,status_pengajuan,rencana_buka,rencana_tutup,pra_muker_tanggal,muker_tanggal from tahun_anggaran"
```

## 6. Data yang perlu disiapkan Daru
| # | Data | Untuk | Mendesak untuk |
|---|---|---|---|
| 1 | Pagu resmi 2027 per bidang, Kemajelisan, Ministerium, dan tiap pos Penatalayanan | Mengganti angka 2026 sementara | Pra-muker |
| 2 | Proyeksi persembahan / Kas Jemaat 2027 | Pembanding total pagu | Pra-muker |
| 3 | Alokasi awal per UPK dalam bidang (boleh sama dengan 2026) | Titik awal ketua bidang | Pra-muker |
| 4 | Nama pengurus tiap UPK (ketua, sekretaris, bendahara; WA, email) dan 7 ketua bidang | Saat ini nama contoh; akun login belum bisa dibuat | Pra-muker |
| 5 | Admin pengelola akun; petugas Penatalayanan yang mengisi pos | Hak akses | Pra-muker |
| 6 | ~~Tanggal pra-muker dan muker baru~~ sudah: 16 dan 23 Nov | Jadwal pengerjaan | selesai |
| 7 | Dokumen misi 2027 | Keterkaitan kegiatan | Sebelum penyusunan |
| 8 | Konfirmasi pemetaan UPK → bidang (masih usulan di `LANJUTAN.md`) | Mengunci struktur | Pra-muker |
| 9 | Apakah Ministerium dan Kepala Kantor juga melihat seluruh pagu (Majelis dan LP4WG sudah diputuskan) | Hak akses dashboard | Rancangan |

## 6b. Struktur master saat ini (lokal, 10 Nov)
7 bidang: Peribadahan (Ibadah, KKG), Pembinaan 1 (Warga Dewasa, PA, Adiyuswa, Dilah, Aksara Kita), Pembinaan 2 (Anak, Remaja, Pemuda), Kesaksian & Pelayanan (Diaken, Kespel, PEJ, LP4WG), Penatalayanan (4 pos), Ministerium (1 pos), Kemajelisan (1 pos). Pagu sementara 14 UPK = angka 2026 (total Rp300.000.000); pos = 0.

## 7. Urutan pengerjaan (usulan, tanggal pasti: pra-muker Sen 16 Nov, muker Sen 23 Nov)
Semua butir keputusan sudah terjawab (11 Nov). Rencana sprint rinci ada di balasan sesi 11 Nov; ringkas:
- **K4, sebelum pra-muker (11–15 Nov)**: pagu bidang (batas keras) + pagu per pos + alokasi indikatif per UPK (memakai `pagu_unit`), proyeksi Kas Jemaat, pembanding porsi dana Gereja, dashboard klasifikasi "bisa jalan", tahap siklus + kunci, hak edit ketua bidang, **snapshot versi per tahap** (Usulan saat UPK dikunci).
- **K5, sebelum muker (16–22 Nov)**: Rumusan/Disetujui berdampingan, riwayat revisi beralasan, realokasi, kolaborasi (porsi per unit + persetujuan mitra), "Kunci dan tetapkan".
- Hapus data dummy produksi dengan konfirmasi Daru (SQL aditif manual dulu; deploy hanya di jadwal sepi).
- Di luar cakupan: penyesuaian tengah tahun 2027.
