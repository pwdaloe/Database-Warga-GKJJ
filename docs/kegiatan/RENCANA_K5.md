# Rencana K5: rumusan, realokasi, kolaborasi, penetapan

*Disusun 16 Nov 2026. Berdasarkan `REVISI_ALUR_ANGGARAN_2027.md` (keputusan A–E) dan kode K4 (v0.5.0). Status: **rencana, belum disetujui**. Pra-muker 23 Nov, muker 30 Nov 2026.*

## 1. Titik awal (sudah ada dari K4)
- Tahap siklus `StatusPengajuan`: DIBUKA → DITUTUP → PRA_MUKER → MUKER → DITETAPKAN; hak ubah per tahap di `src/domain/akses.ts`.
- `ProgramVersi` (potret JSON + total RAB + dana Gereja, unik per program dan tahap) dengan enum `USULAN | RUMUSAN | DISETUJUI`. Baru USULAN yang terisi otomatis saat masuk PRA_MUKER (`potretUsulanTahun`).
- Pagu bidang, pagu pos, alokasi indikatif per UPK (`PaguUnit`), proyeksi Kas Jemaat, dashboard berbasis dana Gereja.
- Belum ada: pembanding berdampingan, riwayat revisi beralasan, realokasi, porsi per unit, persetujuan mitra, "Kunci dan tetapkan".

## 2. Pembagian: wajib pra-muker (23 Nov) vs sebelum muker (30 Nov)

| Paket | Isi | Dibutuhkan untuk |
|---|---|---|
| **K5a** | Potret RUMUSAN + layar **Usulan vs Rumusan** berdampingan, **riwayat revisi beralasan** (setiap ubah di pra-muker mewajibkan alasan) | Pra-muker: ketua bidang dan admin mengedit dan terlihat selisihnya dari usulan UPK |
| **K5b** | **Realokasi** (dari, ke, jumlah, alasan) + saldo "belum dialokasikan" per bidang | Pra-muker (ketua bidang membagi pagu bidang ke UPK) dan muker |
| **K5c** | **Kolaborasi**: unit PJ, porsi per unit, persetujuan mitra, aturan jumlah porsi = dana Gereja | Bisa menyusul; di pra-muker dicatat manual di deskripsi bila belum siap |
| **K5d** | **Kunci dan tetapkan**: potret DISETUJUI, kolom Disetujui berdampingan, ekspor angka final | Muker 30 Nov |

Usulan urutan: **K5a → K5b → K5d → K5c**. K5c paling berisiko (mengubah model data dan aturan ajukan), jadi diletakkan terakhir dan boleh digeser setelah muker bila waktu habis (keputusan butir 3 di bawah).

## 3. Rancangan teknis

### K5a Rumusan dan riwayat revisi
- **Kapan potret RUMUSAN dibuat:** saat tahap pindah PRA_MUKER → MUKER (pra-muker "ditutup"), sama pola dengan `potretUsulanTahun`; tidak menimpa potret yang sudah ada. Selama PRA_MUKER, angka "Rumusan" ditampilkan **langsung dari data program berjalan**; baru dibekukan saat masuk MUKER.
- **Tabel baru `program_revisi`**: `id, program_id, tahap (enum TahapVersi), pengguna_id, alasan (varchar 500, wajib), ringkasan_perubahan, total_rab_sebelum/sesudah, dana_gereja_sebelum/sesudah, created_at`. Dibuat di dalam transaksi `simpanProgram` bila tahun berstatus PRA_MUKER atau MUKER; alasan wajib (Zod), ditolak 400 bila kosong. Model ini dirancang agar bisa dipakai penyesuaian tengah tahun (butir D).
- **API:** `GET /program/:id/revisi`; `GET /program/:id/versi` (usulan/rumusan/disetujui + selisih).
- **Web:** pada halaman program, tab "Perbandingan" (tiga kolom, selisih berwarna) dan "Riwayat revisi"; saat menyimpan di pra-muker/muker muncul dialog alasan. Daftar program mendapat kolom Δ terhadap Usulan.

### K5b Realokasi
- **Tabel `realokasi_anggaran`**: `id, tahun_id, dari_unit_id, ke_unit_id, jumlah, alasan, pengguna_id, created_at`. Lingkup: antar-UPK dalam satu bidang (ketua bidang, pra-muker) dan antar-bidang (admin/sekretariat, muker). Saldo "belum dialokasikan" = pagu bidang − jumlah alokasi UPK (sudah dihitung di K4; tinggal ditampilkan sebagai kartu dan dipakai validasi).
- **Aturan:** batas keras tetap di pagu bidang (butir A); realokasi antar-UPK hanya mengubah `PaguUnit.nilai` (panduan) sekaligus mencatat transaksi; realokasi antar-bidang mengubah `PaguBidang.nilai` dan wajib alasan. Keduanya atomik dalam satu transaksi, dengan `log_audit`.
- **Web:** layar `alokasi` yang sudah ada diberi tombol "Pindahkan jatah" dan tabel riwayat transaksi.

### K5d Kunci dan tetapkan
- Admin menekan **Kunci dan tetapkan** (hanya dari tahap MUKER): satu transaksi yang (1) membuat potret DISETUJUI untuk setiap program DIAJUKAN, (2) menolak bila ada porsi mitra berstatus Menunggu (setelah K5c), (3) memindah status ke DITETAPKAN. Tidak bisa diulang; hanya admin yang dapat membuka kembali (aturan sudah ada di `master.ts:51`).
- Ekspor Excel angka final (Usulan | Rumusan | Disetujui per kegiatan dan per UPK) untuk dokumen muker.
- Dashboard: kartu "Disetujui vs pagu" dan "Selisih terhadap usulan".

### K5c Kolaborasi (porsi antar-unit)
- **Tabel `program_porsi`**: `id, program_id, unit_id, dana_gereja, swadaya, status (MENUNGGU|DISETUJUI|DITOLAK), diputuskan_oleh, diputuskan_pada, catatan`. Unit PJ = `program_kerja.unit_id` (sudah ada); porsi PJ otomatis DISETUJUI.
- **Aturan:** jumlah `dana_gereja` semua porsi = dana Gereja program, jumlah `swadaya` = swadaya program; kalau tidak sama program belum bisa diajukan (tambah ke `periksaKelengkapan`). Hanya PJ yang boleh mengedit program. Persetujuan mitra oleh pengurus unit mitra (atau ketua bidangnya bila lintas bidang). Program boleh diajukan, tetapi tidak dapat dikunci selama ada porsi Menunggu/Ditolak.
- **Dampak ke dashboard:** perhitungan "dana Gereja diminta per UPK" berpindah dari `program_kerja.unit_id` ke jumlah porsi per unit. Ini bagian paling halus; perlu uji angka total sebelum dan sesudah.
- **Web:** bagian "Pembagian antar-unit" pada formulir; kotak "Menunggu persetujuan Anda" pada dashboard unit mitra.

## 4. Migrasi dan deploy (pelajaran Sprint 13)
- Semua tabel baru bersifat aditif. Siapkan `deploy/sql/k5-*.sql` (CREATE TABLE, CREATE TYPE bila ada enum baru, `ALTER OWNER` ke `gkjj_kegiatan`) dan jalankan manual di VPS **sebelum** `3-deploy-kegiatan.sh`. Enum baru dibuat dengan `CREATE TYPE`, bukan `ADD VALUE`, sehingga tidak ada risiko transaksi.
- Deploy hanya di jadwal sepi, setelah konfirmasi Anda. Perkiraan: K5a+K5b satu deploy (target sebelum 22 Nov agar siap pra-muker 23 Nov), K5d satu deploy (sebelum 30 Nov), K5c bila jadi satu deploy sendiri.
- Per rilis: entri di `apps/kegiatan-api/src/constants/rilis.ts` dan naikkan `version` di `package.json` kegiatan-api dan kegiatan-web (v0.6.0 untuk K5a+b, dst.), lalu `CHANGELOG.md`.
- Tes: tambahkan tes hak akses per tahap (ketua bidang vs admin vs UPK) dan tes angka (selisih, saldo, jumlah porsi).

## 5. Keputusan yang saya butuhkan sebelum mulai
1. **Urutan dan potongan setuju?** K5a → K5b → K5d → K5c, dengan K5c boleh digeser setelah muker.
2. **Kapan potret RUMUSAN dibekukan:** usulan saya saat masuk MUKER (selama PRA_MUKER angkanya hidup). Setuju?
3. **Bila waktu sempit, K5c dikorbankan?** Alternatif sementara: kolaborasi dicatat di kolom catatan program dan dibagi manual lewat realokasi.
4. **Realokasi antar-bidang:** sah dilakukan admin/sekretariat saat muker lewat `PaguBidang`, atau cukup mengubah pagu bidang langsung dengan alasan?
5. **Alasan revisi wajib** untuk setiap simpan di pra-muker, atau hanya bila total RAB/dana Gereja berubah? (Usulan: hanya bila angka berubah, perubahan teks tidak wajib alasan.)

## 6. Yang tetap di luar cakupan
Penyesuaian anggaran dan kegiatan tengah tahun 2027 (model `program_revisi` sudah disiapkan agar bisa diperluas), SSO dengan aplikasi jemaat, WhatsApp Business API.
