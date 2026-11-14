# Titik lanjut: aplikasi Kegiatan (RKA 2027)

*Diperbarui 14 Nov 2026 (malam). Baca ini dulu saat melanjutkan pekerjaan.*

## TODO besok (15 Nov 2026), urut prioritas
Produksi sekarang **v0.5.0 / `17c7ed5`** (K4, istilah "kegiatan", kirim akses WhatsApp, edit nomor). Pra-muker **23 Nov**, muker **30 Nov**; status pengajuan RKA 2027 = DIBUKA.
1. **Verifikasi v0.5.0 di produksi** (belum dicoba): Akun pengguna > tombol **Nomor** (simpan, kosongkan, nomor salah ditolak) dan tombol **WhatsApp** (uji dulu di akun sendiri; pada akun "Belum ganti password" tombol ini mereset password). Cek juga tampilan HP 390 px. Verifikasi label baru di `/program/baru`.
2. **Kirim akses ke pengurus UPK**: isi nomor yang kosong lewat tombol Nomor, lalu kirim satu per satu. Catat siapa yang sudah.
3. **Master produksi**: pagu bidang masih sementara (= jumlah alokasi 2026, total Rp300 juta); isi pagu resmi, pagu pos Penatalayanan/Ministerium/Kemajelisan, proyeksi Kas Jemaat (centang "Tahun aktif" sudah dibereskan).
4. **K5 (sebelum 23 Nov untuk yang dibutuhkan pra-muker, sisanya sebelum 30 Nov)**: susun rencana dulu. Isi: Rumusan/Disetujui berdampingan, riwayat revisi beralasan, realokasi, kolaborasi antar-unit dengan persetujuan mitra, "Kunci dan tetapkan". Tentukan mana yang wajib untuk pra-muker.
5. **Jangan lupa**: pindahkan status ke PRA_MUKER hanya saat jendela UPK benar-benar ditutup (potret Usulan otomatis, tidak bisa diulang). Hapus `SEED_ADMIN_PASSWORD` dari `.env` produksi + `pm2 restart gkjj-kegiatan-api`.
6. **Keputusan terbuka** (`ROADMAP_TEMPLATE_WHATSAPP.md`): boleh pesan akses membawa password sementara selama Fase 1-2? Perlu Fase 2 (antrean dan catatan terkirim) sebelum muker?
7. **Belum di-commit (sengaja)**: `AGENTS.md`, `.claude/skills/`, `docs/ANALISA_AGENDA_JEMAAT.md`; putuskan masuk repo atau tidak.

## Update 14 Nov 2026 (K4 dan v0.5.0 sudah dideploy ke produksi)
**v0.5.0 (`17c7ed5`, dideploy 14 Nov malam):** tombol WhatsApp per akun di Akun pengguna (pesan siap-akses atau pengingat, `wa.me`, tanpa WhatsApp Business karena berbayar) dan edit nomor WhatsApp akun. Tanpa perubahan skema. Roadmap template pesan: `ROADMAP_TEMPLATE_WHATSAPP.md`.

K4 (v0.4.0, `3289e73`) live di produksi sejak 14 Nov malam: SQL `deploy/sql/k4-pagu-bidang-siklus.sql` dijalankan manual lebih dulu (lalu `ALTER OWNER` ke `gkjj_kegiatan`, lihat `DEPLOY.md`), baru `3-deploy-kegiatan.sh`. Dashboard 404 diselesaikan dengan mencentang "Tahun aktif" dan mengisi proyeksi Kas Jemaat di Master > Tahun. **Tanggal resmi: pra-muker 23 Nov, muker 30 Nov 2026** (dikonfirmasi Daru 14 Nov). v0.4.1 (`e276dd0`): istilah "program" menjadi "kegiatan", butir jadwal menjadi "aktivitas".

## Update 10 Nov 2026 (K4 selesai di lokal)
Alur anggaran direvisi (lihat `REVISI_ALUR_ANGGARAN_2027.md`). **K4 (v0.4.0) selesai**: pagu bidang, alokasi indikatif, proyeksi Kas Jemaat, tahap siklus (pra-muker/muker/ditetapkan), potret Usulan, dashboard berbasis dana Gereja, halaman Alokasi ketua bidang. **K5** (sebelum muker 30 Nov): Rumusan/Disetujui berdampingan, riwayat revisi beralasan, realokasi, kolaborasi antar-unit dengan persetujuan mitra, "Kunci dan tetapkan". Pra-muker 23 Nov dan muker 30 Nov (sama di produksi). Deploy K4 butuh `deploy/sql/k4-pagu-bidang-siklus.sql` manual dulu.

## Posisi sekarang
- **Aplikasi Kegiatan sudah live di produksi sejak 27 Okt 2026** (`kegiatan.gkjjakarta.org`, kini v0.4.0 / `3289e73`). Database `gkjj_kegiatan` dan pengguna DB sendiri; PM2 `gkjj-kegiatan-api` (:4200) dan `gkjj-kegiatan-web` (:3200); blok Nginx baru aktif, domain `jemaat`, `api`, `my`, `majelis` tidak berubah.
- **Pengajuan masih "Belum dibuka".** Admin sudah dapat masuk; master (pagu, BPH, akun) belum diisi di produksi.
- Tanggal: gerbang go/no-go **Jum 30 Okt**; jendela pengisian UPK **2–9 Nov**; pengajuan ditutup **10 Nov**; pra-muker **23 Nov**; muker **30 Nov 2026** (tanggal awal 15/22 Nov sudah bergeser).
- Rencana dan keputusan: `RENCANA_MVP_MUKER_2026.md`. Hasil sprint: `../../sprints/sprint_k1.md`. Latar jangka menengah: `BRIEF_MODUL_KEGIATAN.md`. Langkah pemasangan: `../../deploy/DEPLOY_KEGIATAN.md`.
- Sudah ditambahkan setelah K1 (27 Okt): layar **Struktur & anggaran**, 7 bidang (termasuk Ministerium dan Kemajelisan), 6 pos biaya (4 di Penatalayanan), peran pengawas baru (LP4WG, Kepala Kantor, Ministerium; Penatua = peran Majelis; Ketua Bidang = Koordinator bidang), seed akun contoh per peran (hanya lokal).
- Tampilan HP 390 px sudah diuji untuk Struktur & anggaran, daftar program, formulir, dan dashboard pada 8 akun: tanpa scroll horizontal, toolbar bawah berfungsi.

## Sudah dikerjakan 27 Okt (v0.2.0, dideploy `97fb897`)
Logo, versi aplikasi dan halaman Apa yang baru, bantuan WhatsApp (Master > Dukungan), perbaikan batas login. Lihat `CHANGELOG.md`. **Notifikasi** (keputusan Daru: gabungan pengumuman admin + notifikasi kejadian, dikerjakan setelah pilot) belum dimulai.

## Langkah berikutnya (urut; daftar lama 27 Okt, yang aktif ada di "TODO besok" di atas)
1. **Isi master di produksi** (layar Struktur & anggaran: pagu per unit dan pos; BPH; akun). Ini hambatan utama sebelum pilot.
2. **Verifikasi yang belum**: tarik kembali dan hapus di browser, ringkasan cetak, tab master selain Tahun dan Struktur, buat akun + tombol WhatsApp.
3. **Pilot satu UPK** sebelum membuka pengajuan; lalu admin ubah status pengajuan ke *Dibuka* (target ≤ 1 Nov, jendela 2 Nov).
4. Hapus `SEED_ADMIN_PASSWORD` dari `.env` produksi dan `pm2 restart gkjj-kegiatan-api`.
5. **K2 (sebelum 10 Nov)**: ekspor Excel (seluruh program dan baris RAB), rekap per kategori biaya, cuplikan angka potensi peserta per komisi dari dashboard jemaat.
6. **K3 (sebelum 15 Nov, bila ada waktu)**: telaah koordinator bidang (komentar, perlu revisi), skoring 5 kriteria (Dampak, Urgensi, Keselarasan, Kelayakan, Keberlanjutan), catatan keputusan pra-muker, laporan konsolidasi.
7. Kecil: angka pada kartu "Per unit" di dashboard HP terbungkus ("Rp" lalu angka); peringatan Nginx `protocol options redefined for [::]:443` (tidak berbahaya, penyeragaman `http2` antar blok bila mau dirapikan).

## Gerbang keputusan
**Jum 30 Okt**: bila formulir belum stabil, fallback ke alur Smartsheet/Excel yang sudah dipakai, dengan templat 10 bagian; aplikasi dilanjutkan untuk revisi dan pelaksanaan 2027.

## Menunggu jawaban Daru
- Pemetaan UPK → bidang di seed adalah **usulan** (dapat diubah sendiri di layar Struktur & anggaran): Peribadahan: Ibadah, KKG; Pembinaan 1: Warga Dewasa, PA, Adiyuswa, Dilah, Aksara Kita; Pembinaan 2: Anak, Remaja, Pemuda; Kesaksian & Pelayanan: Diaken, Kespel, PEJ, LP4WG. Finalisasi di produksi.
- Daftar pengurus per UPK (nama, WhatsApp, email) dan Ketua Bidang. Excel dari UPK akan menyusul; sementara BPH berisi nama contoh.
- Dokumen misi/renstra (di luar visi dan empat aspek): ada?
- Pagu resmi 2027 (sementara = angka 2026, total Rp300.000.000) dan pagu pos Penatalayanan, Ministerium, Kemajelisan (sementara 0). Diisi lewat Master.
- Siapa admin yang mengelola akun.
- Soal lama: judul surat atestasi jemaat ("Keterangan Pindah Keluar") menunggu istilah baku; 5 warga Pindah Agama (id 736, 739, 836, 1123, 1124) menunggu ditinjau.

**Sudah dijawab (27 Okt):** pos Penatalayanan = Biaya Hidup Pendeta dan Karyawan, Biaya Operasional Kantor, Biaya Pemeliharaan Rumah Tangga, Kesekretariatan; Ministerium dan Kemajelisan menjadi bidang; Komisi Pemuda memakai nama panjang; posisi unit di bidang harus dapat diatur dari satu layar master.

## Menjalankan di lokal
```bash
# database dan seed (sekali)
createdb gkjj_kegiatan        # atau lewat psql
cd apps/kegiatan-api && cp .env.example .env     # isi DATABASE_URL, JWT_SECRET, SEED_ADMIN_PASSWORD, SEED_CONTOH_PASSWORD
npx prisma db push && npm run db:seed && npm run db:seed:contoh
# jalankan
npm run dev --workspace=apps/kegiatan-api        # :4200
npm run dev --workspace=apps/kegiatan-web        # :3200
```
Akun contoh lokal (kata sandi dari `SEED_CONTOH_PASSWORD` di `.env`, tidak ada di repo): `sekretariat`, `majelis`, `koord.<bidang>`, `ketua.<kode unit>` (mis. `ketua.koman`). Admin: `admin`. Database lokal sekarang berstatus pengajuan **Dibuka** (diubah saat uji).

## Catatan teknis yang mudah terlupa
- `prisma db push` menolak menambah constraint unik ke tabel berisi: terapkan SQL aditif manual sebelum deploy (pelajaran Sprint 13, `DEPLOY.md`). Menambah nilai enum (mis. peran baru) di database yang sudah berisi: `ALTER TYPE ... ADD VALUE` manual dulu.
- Baris komentar di `.env` jangan memuat kata placeholder yang diperiksa skrip deploy (sudah diperbaiki di `ffc5bd5`).
- Batas login 5 percobaan/15 menit bersifat in-memory: uji otomatis yang login berulang dapat memicu 429; restart API lokal untuk mengatur ulang.
- Nginx di VPS 1.24: jangan pakai `http2 on;` (pakai `listen 443 ssl http2;`).
- Seluruh perubahan jemaat sebelumnya sudah dideploy; Sprint 13B (absensi QR) dan portal `my` (Sprint 14–17) **tertunda** sampai aplikasi Kegiatan stabil. Sprint 13B kemungkinan dilebur ke aplikasi Kegiatan (sesi absensi per kegiatan); keputusan ulang saat dilanjutkan.
- Aplikasi Kegiatan memakai login sendiri; SSO dengan jemaat belum ada (`../PLATFORM.md` P1).
