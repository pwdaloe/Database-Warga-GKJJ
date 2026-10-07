# Retro Log
<!-- Dikelola otomatis oleh Retro Agent. -->

---

## [2026-10-07] — Retrospektif Sprint 10–11 (+ 2 perbaikan produksi)

**Project**: Database Warga GKJJ
**Scope**: Sprint 10, Sprint 11, dan 2 commit maintenance (`78b3660`, `ad427d7`); 3 deploy ke produksi (`263c59b`, `78b3660`, `ad427d7`)
**Reviewed**: Rabu, 7 Oktober 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 2 sprint (10, 11) + 2 maintenance |
| Total tasks | 15 (8 + 7), 100% selesai |
| Fix commits | 1 (`78b3660`, ditemukan pengguna di produksi) |
| Pertumbuhan tes | API 192 → 293 (+101), web 106 → 131 (+25) |
| Deploy ke produksi | 3, semuanya lancar, backup otomatis tiap deploy |
| Unique blockers baru | 5 |
| Recurring blockers | 2 naik (data-nyata 8x → 9x; verifikasi visual 1x → 4x) |
| Blocker ditutup | 3 (deploy rapuh, kerja di luar sprint, scoping Penatua) |
| Skill gap terdeteksi | 5 |

### 🔁 Pola Blocker Sistemik

#### Bug "data-nyata lolos dari test" — kini **9x**, HIGH, belum resolved (varian baru: integritas relasional)
- **Kejadian baru (2026-10-07)**: Tri Endah Sulantari tampil di dua baris Data Keluarga. Penyebab (dibuktikan dari `activity_log` produksi): Kepala KK dipindah ke KK lain lalu dijadikan Kepala lagi → KK baru. KK lama kosong, `kepala_keluarga_id` masih menunjuk dia.
- **Dampak lebih luas**: pengecekan menemukan **14 KK kosong** di produksi (13 di antaranya dibuat 5 Oktober, sebelum perbaikan; terjadi diam-diam selama entry data berjalan). Semua dibersihkan manual, dan hasil akhir 0 baris.
- **Root cause**: seluruh tes round-trip (Sprint 8) menjaga **field** warga, bukan **relasi**. Tidak ada tes untuk operasi yang memindahkan relasi (pindah KK, jadi Kepala baru), dan tidak ada pemeriksaan integritas data produksi. Ditemukan oleh pengguna, bukan oleh tes atau pemantauan.
- **Eskalasi (sudah ≥3x)**: sudah jadi task nyata di Sprint 8 untuk varian field. Varian relasional wajib jadi task nyata Sprint 12 (lihat Rekomendasi 1).
- **Skill yang perlu diupdate**: `qa.md` (HIGH).

#### Verifikasi visual UI tidak pernah dilakukan — kini **4x** (Sprint 9, 10, 11 + banner), dinaikkan MED → HIGH
- Tiga sprint berturut-turut melaporkan "UI belum divalidasi di browser" dan melanjutkan.
- **Root cause**: `sprint.md` Langkah 6 menyuruh fallback bila "tidak ada browser tool", padahal sesi punya tool **Claude in Chrome** (dimuat lewat ToolSearch). Fallback dipakai tanpa mencoba tool-nya. Akibatnya UI Sprint 10–11 (modal Info Akun, Profil Saya, Hubungi) baru pertama kali dilihat pengguna di produksi.
- **Skill yang perlu diupdate**: `sprint.md` (HIGH). **Eskalasi ≥3x → task nyata** (Rekomendasi 2).

#### Role baru otomatis fail-open — 1x, HIGH, resolved tetapi tidak ditangkap oleh skill
- Banyak route lama hanya memakai `authenticate` tanpa `authorize` (daftar warga, keluarga, dashboard). Role JEMAAT akan lolos ke semua itu walau tidak disebut di `authorize(...)`. Ditemukan lewat penalaran di tengah sprint dan ditutup dengan pagar global `jemaatGuard` + tes matriks (22 jalur, mutation check 13 tes gagal).
- **Root cause**: tidak ada skill yang menanyakan "route mana yang terbuka bagi role baru?". `review.md` dan `security.md` masih memakai pola grep Python (`@router.`, `backend/app/api`) yang tidak cocok untuk Express.
- **Skill yang perlu diupdate**: `security.md`, `review.md` (HIGH).

#### Alur deploy VPS rapuh — 4x → **RESOLVED**
- 3 deploy hari ini lancar: versi terverifikasi lewat `/api/system/status`, `pm2` online, tabel baru terpasang, dump `pg_dump` otomatis dibuat tiap deploy, dua dump disalin ke Mac. Gerbang retro 5 Oktober terpenuhi. Catatan: tidak ada `EACCES` yang dilaporkan, tetapi log penuh tidak ditempel (disimpulkan dari keberhasilan deploy).

#### Pekerjaan di luar `/sprint` tanpa entry CHANGELOG — 2x → **RESOLVED**
- Kedua commit maintenance hari ini memuat entry CHANGELOG di commit yang sama.

### 🐛 Pola Git Bermasalah

- **Fix commits**: hanya 1 dari 6 commit (17%), turun dari 27% pada retro lalu. Satu-satunya fix berasal dari kelas "relasi tidak sinkron" (di atas).
- **File sering diubah ulang** (Sprint 10–Maintenance): `CHANGELOG.md` (4x, wajar), `README.md` (3x), `warga.service.ts`, `users.ts`, `app.ts`, `Sidebar.tsx`, `pengguna/page.tsx` (masing-masing 2x). Tidak ada tanda pengerjaan ulang karena kesalahan.
- **Satu salah langkah dalam sesi**: panduan deploy awal menyebut `prisma migrate deploy` padahal `deploy/2-deploy.sh` memakai `prisma db push`; dikoreksi setelah membaca skrip. Satu asumsi lain ("batch KK 5 Okt adalah data uji") dikoreksi setelah data produksi memperlihatkan warga nyata.

### 🕳️ Gap Skill Coverage

- **Role baru**: lihat di atas; tidak ada skill yang memeriksa. `review.md:119` dan `security.md:87` masih berisi pola Python.
- **Integritas data produksi**: tidak ada skill/pemeriksaan untuk KK kosong, penunjuk kepala basi, warga tanpa KK. Ditemukan setelah 2 hari entry manual.
- **Konflik `sprint.md` vs `CLAUDE.md`**: `sprint.md` Langkah 8 meminta commit otomatis dan Langkah 10 mengirim email, sedangkan `CLAUDE.md` melarang commit tanpa diminta. Sesi menanganinya dengan bertanya; skill tidak mengatur ini.
- **Analisis salinan produksi**: tidak ada prosedur. Perlu `docker postgres:16` (pg_restore Mac versi 15 menolak dump PG16), kunci enkripsi NIK lokal berbeda (null-kan di salinan), migrasi baru harus diterapkan, dan salinan wajib dihapus.
- **Keanehan alat uji**: Vitest 4 menandai promise tertolak dari `vi.fn` sebagai galat tes walau ditangani komponen (2x; tidak ada di `qa.md`).

### ✅ Yang Berjalan Baik

- **Mutation check dipakai konsisten** dan menangkap kerusakan di setiap sprint: profil (2 dan 1 tes gagal), pagar (13), pelepasan kepala KK (4), modal hapus (1).
- **Keputusan desain dikonfirmasi bertahap** (password acak, wa.me, kepala keluarga saja yang ubah KK, verifikasi staf) dan dicatat di dokumen sebelum kode ditulis, sehingga tidak ada pengerjaan ulang fitur.
- **Diagnosis berbasis bukti**: kasus KK ganda ditelusuri dari `activity_log` produksi + salinan backup, bukan tebakan; salinan dihapus setelahnya.
- **Backup sebelum setiap aksi berisiko** (3 backup, 2 disalin keluar VPS) dan **pembersihan data dengan penjaga** (hanya KK tanpa anggota; hasil akhir diverifikasi 0 baris).
- **Verifikasi query nyata di DB lokal** untuk `updateProfil` (baris uji sementara dihapus), menutup keterbatasan tes ber-mock prisma.
- **Gerbang deploy retro 5 Oktober terpenuhi**; aplikasi tetap dipakai entry data saat tiga deploy berjalan.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | sprint.md | Fallback "tidak ada browser tool" dipakai tanpa mencoba tool Claude in Chrome (4x) | Muat tool chrome lewat ToolSearch, jalankan dev server, buka halaman yang disentuh, tangkap layar & console; fallback hanya bila tool benar-benar tidak ada | ⬜ pending |
| HIGH | security.md / review.md | Tidak ada pemeriksaan role baru; pola grep masih Python | Checklist role baru: enumerasi route tanpa `authorize`, pagar global fail-closed + tes matriks; ganti grep Python dengan grep Express | ⬜ pending |
| HIGH | qa.md | Tes round-trip hanya field; tidak ada integritas relasional/audit data produksi; catatan Vitest 4 | Tambah kumpulan query integritas read-only + tes tiap operasi pemindah relasi; catat workaround Vitest 4 | ⬜ pending |
| MED | sprint.md | Langkah 8/10 (commit & email otomatis) bertentangan dengan CLAUDE.md | Commit/email hanya bila diminta atau diizinkan CLAUDE.md | ⬜ pending |
| MED | devops.md | Tidak ada prosedur analisis salinan produksi & gerbang pasca-deploy tertulis | Tambah bagian analisis salinan (docker pg16, null NIK, terapkan migrasi, hapus) dan gerbang pasca-deploy | ⬜ pending |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. **Buat `sprints/sprint_12.md` untuk integritas data (task nyata, bukan saran)**: (a) kumpulan query integritas read-only (KK kosong, `kepala_keluarga_id` tidak cocok dengan KK kepala, warga berstatus KEPALA tanpa KK, duplikat NIK) dan menjalankannya terhadap produksi tiap selesai deploy; (b) tes relasional untuk setiap operasi yang memindahkan warga atau mengganti kepala; (c) pertimbangkan kendala basis data (mis. satu KEPALA aktif per KK) setelah audit data.
2. **Jadikan verifikasi visual gerbang sprint**: jalankan `/improve` untuk `sprint.md`, lalu lakukan satu putaran uji visual atas UI Sprint 10–11 (modal Info Akun, tab Template Pesan & Kontak Gereja, Profil Saya sebagai akun Jemaat uji, Hubungi) di environment dev sebelum menambah fitur baru.
3. **Jalankan `/improve`** untuk lima kandidat skill di atas (tiga HIGH).
4. **Pilih kandidat Sprint 12** bersama Daru: akun Jemaat massal, survei/kebutuhan jemaat, pengingat belum login, penyesuaian `/m`. Jadwalkan juga upgrade Next 16 + Prisma 8 sebagai sprint tersendiri (sisa 6 temuan `npm audit`).
5. **Uji akun Jemaat nyata satu kali di produksi** (buat satu akun uji, login, ubah satu field, lihat muncul di Validasi Data, nonaktifkan akun) — alur ini belum pernah dijalankan end-to-end di lingkungan nyata.

---

## [2026-10-05] — Retrospektif Pasca Sprint 7 (Batch Mobile UI, Keamanan Dependensi, Deploy & Koreksi Data)

**Project**: Database Warga GKJJ
**Scope**: 15 commit `fe362e3..adc6410` + 1 perbaikan belum di-commit (alamat KK Kepala Keluarga), seluruhnya di luar alur `/sprint`
**Reviewed**: Senin, 5 Oktober 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 0 sprint baru (`.current_sprint` = 8, `sprint_08.md` tetap belum ada) |
| Commit sejak retro terakhir | 15 (91 file, +3710/−1138 baris) |
| Fix commits | 4 (`4ac676b`, `d1136b9`, `9d1db86`, `adc6410`) + 1 belum di-commit |
| Pertumbuhan tes | API 108 → 126, web 22 → 69 (+~65 tes) |
| Unique blockers baru | 6 |
| Recurring blockers | 3 (data-nyata 8x, deploy 4x, kerja di luar sprint 2x) |
| Skill gap terdeteksi | 5 |
| Temuan `npm audit` | 31 → 6 (production: 14 → 6, tanpa critical) |

### 🔁 Pola Blocker Sistemik

#### Bug "data-nyata lolos dari test" — kini 8x, HIGH, belum resolved, **eskalasi tidak ditindaklanjuti**
- **Bukti sesi ini (4 kejadian baru, satu kelas masalah):**
  1. Role terbatas (Majelis/Staf/Penatua) menerima `latitude/longitude` (dan NIK/Alamat KTP untuk Penatua) sebagai `null` dari API, form menyimpannya balik → **data tersimpan terhapus diam-diam** (`adc6410`).
  2. Alamat Rumah Tangga (KK) untuk Kepala yang sudah punya KK tampil di form tetapi **dibuang saat simpan** dan tidak dimuat saat edit (perbaikan belum di-commit).
  3. Form edit di Detail Warga tidak memuat foto, Alamat KTP/Domisili, dan koordinat — pemetaan nilai awal terduplikasi di dua halaman dan tidak sinkron.
  4. Nomor warga (WRG vs No. Induk) ditampilkan tidak konsisten di 6 layar (`d1136b9`).
- **Root cause**: tes yang ada memverifikasi lapisan terpisah (service dengan prisma di-mock, form tanpa API). Tidak ada tes alur **simpan → muat ulang → tampil** per peran, dan pemetaan field diduplikasi per layar.
- **Eskalasi**: retro 2026-10-03 mewajibkan ini jadi **task nyata Sprint 8**; sprint itu tidak pernah dibuat, jadi bug serupa muncul lagi 4x dalam 2 hari. Rekomendasi naratif terbukti tidak cukup.
- **Perbaikan yang sudah dikerjakan**: helper bersama `wargaToFormDefaults`/`buildWargaPayload`, redaksi + proteksi tulis di `warga.service.ts`, 40+ tes baru (termasuk tes form end-to-end).
- **Skill yang perlu diupdate**: `qa.md` (HIGH, kandidat yang sama sudah **dua retro tidak diterapkan**), `review.md`.

#### Alur deploy rapuh karena kepemilikan root vs `gkjj` — 4x, HIGH, perbaikan sudah di-push tetapi belum terbukti di deploy nyata
- Kejadian: daemon PM2 hantu (`4ac676b`); objek `.git` milik root (`insufficient permission`); `package-lock.json` ditulis ulang `npm install` sehingga `git pull` berikutnya ditolak (2x); `.next` berisi cache milik root dari runtime PM2 sehingga build `EACCES`.
- **Root cause**: PM2 berjalan sebagai root (disengaja), sedangkan git/npm/build berjalan sebagai `gkjj`; perintah manual sebagai root (`git pull`, `npm audit fix`) mencampur kepemilikan. Tidak ada pre-flight kepemilikan.
- **Skill yang perlu diupdate**: `devops.md` (HIGH). Tidak ada satu pun skill yang mengenal alur VPS (`deploy/2-deploy.sh`).
- **Status**: `9d1db86` + `0b7bd0e` menambah chown/restore lockfile/backup; **belum ada deploy sesudahnya** yang membuktikannya.

#### Pekerjaan di luar `/sprint` tanpa entry CHANGELOG — 2x (retro sebelumnya 4 commit, kini 15)
- Seluruh batch ini (fitur, keamanan, deploy) tidak punya sprint file maupun entry `/pm`. Gate commit-yatim tidak menyentuhnya.
- **Skill**: `pm.md` / `sprint.md` (MED, belum diterapkan sejak retro lalu).

#### Kerentanan dependensi menumpuk tanpa audit berkala — 1x (31 temuan), sebagian resolved
- `npm audit fix` di server gagal (bug arborist) dan berisiko; di Mac berhasil. `xlsx` (SheetJS) tanpa perbaikan di npm → diganti `exceljs`, dengan konsekuensi `.xls` tak lagi didukung. Tersisa 6 temuan (Next/postcss, Prisma/deepmerge-ts, uuid) yang menunggu upgrade mayor.
- **Skill**: `security.md` punya mode `deps` tetapi tidak memuat kebijakan (prod vs dev, larang `--force`, jangan di server).

### 🐛 Pola Git Bermasalah

- **File sering diubah ulang**: `README.md` (6x), `deploy/2-deploy.sh` (3x, tiga masalah izin berbeda), `WargaForm.tsx` (3x), `warga/[id]/page.tsx` (3x).
- **Fix commits**: 4 dari 15 (27%). Tiga di antaranya (`d1136b9`, `adc6410`, perbaikan alamat KK) berasal dari **pemetaan data antar lapisan** yang tidak sinkron, bukan logika baru.
- **Artefak**: `apps/web/tsconfig.tsbuildinfo` ter-track git dan selalu `M` (noise di setiap `git status`); `docs/final-import-pengguna.xlsx` dan `.claude/skills/` tetap untracked (file xlsx kemungkinan berisi kredensial awal — jangan sampai ter-commit).
- **Flaky test**: `import.route.test.ts` (import pengguna) gagal acak sekali saat seluruh suite dijalankan; 8x ulang lulus. Dipantau, belum ada akar masalah.

### 🕳️ Gap Skill Coverage

- **UX/mobile**: `ux.md` memakai path `frontend/src/pages` yang tidak ada di monorepo ini (`apps/web/src/app`), sehingga auditnya kosong; tidak ada pemeriksaan responsif (tabel→kartu, target sentuh 44px, input 16px). Verifikasi tampilan hanya lewat tangkapan layar pengguna.
- **Operasi VPS**: tidak ada skill/pre-flight untuk kepemilikan file, kebersihan `git status` sebelum pull, dan backup sebelum `db push` (kini ada di script, tetapi tidak di skill manapun).
- **Konsistensi scoping lintas endpoint**: dashboard fail-closed untuk Penatua tanpa kelompok, sedangkan `/warga` dan `/keluarga` menampilkan semua data (fail-open). Tidak ada skill yang memeriksa konsistensi ini.
- **Kebijakan PDP vs perilaku nyata**: peta dashboard menampilkan koordinat ke semua role padahal kebijakan menyembunyikannya; baru ketahuan dari laporan pengguna. `security.md`/`eval.md` tidak membandingkan matriks redaksi dengan endpoint.
- **Kerja di luar sprint**: tidak ada jalur "Maintenance" resmi.

### ✅ Yang Berjalan Baik

- **Setiap perbaikan disertai tes** (+~65 tes); tes regresi untuk koordinat, alamat KK, dan proteksi tulis.
- **Dua kali kegagalan hipotesis dicatat jujur**: override `qs` merusak pohon dependensi dan dibatalkan; uji "password salah" di Postgres lokal tidak valid (autentikasi `trust`) dan diulang dengan skenario lain.
- **Backup `pg_dump` otomatis** diuji termasuk jalur gagal, retensi, dan izin sebelum di-push.
- **Subagen paralel dengan kepemilikan file terpisah** (4 agen, 25 file) selesai tanpa konflik; hasil gabungan diverifikasi ulang (`tsc`, tes, build).
- **Fail-closed pada scoping dashboard** dan pengujian peran (`dashboardScope.test.ts`).
- **Konfirmasi sebelum langkah berisiko**: keputusan `/m/*`, kebijakan koordinat, dan pilihan `xlsx` diminta ke pemilik; hasil audit produksi tidak langsung dipakai `--force`.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | qa.md | Hanya pola prisma-mock + input sintetis; 2 retro belum diterapkan; bug data-nyata kini 8x | Wajibkan tes **round-trip** (simpan → muat → tampil) per peran, fixture xlsx realistis, uji pemetaan form↔payload, serialisasi BigInt | ✅ applied (2026-10-05) — tsbuildinfo; 📋 xlsx menunggu keputusan pemilik |
| HIGH | devops.md | Tidak ada pre-flight alur VPS | Cek kepemilikan `.git`/`.next`/`dist`, `git status` bersih sebelum pull, backup terbukti sebelum `db push`, larang `npm audit fix`/`git pull` sebagai root | ✅ applied (2026-10-05) |
| MED | security.md | Mode `deps` tanpa kebijakan | `npm audit --omit=dev`, pisahkan prod/dev, larang `--force` & audit-fix di server, rencana untuk paket tanpa fix; cek konsistensi fail-closed scoping & matriks redaksi PDP vs endpoint | ✅ applied (2026-10-05) |
| MED | ux.md | Path `frontend/src/pages` salah untuk monorepo; tidak ada cek mobile | Deteksi `apps/web/src/app`; subcommand `responsive` (tabel→kartu, target 44px, input 16px, modal bottom-sheet, `min-h-dvh`) | ✅ applied (2026-10-05) |
| MED | pm.md / sprint.md | Kerja di luar sprint tanpa entry (kini 2 retro berturut-turut) | Jalur "Maintenance": entry CHANGELOG otomatis dari `git log` sejak retro terakhir | ✅ applied (2026-10-05) |
| MED | review.md | Duplikasi pemetaan form/payload lolos review | Checklist: field yang tampil di UI harus ikut terkirim dan dimuat balik; pemetaan nilai awal tidak boleh terduplikasi | ✅ applied (2026-10-05) |
| LOW | .gitignore / repo | `tsconfig.tsbuildinfo` ter-track; `docs/final-import-pengguna.xlsx` untracked | `git rm --cached` + `.gitignore`; tentukan nasib file xlsx (kemungkinan kredensial) | ✅ applied (2026-10-05) — tsbuildinfo; 📋 xlsx menunggu keputusan pemilik |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. **Buat `sprints/sprint_08.md` sekarang dan masukkan task nyata** (bukan rekomendasi): (a) tes round-trip per peran untuk form Warga & Keluarga, (b) seragamkan scoping Penatua tanpa kelompok di `/warga` & `/keluarga`, (c) putuskan kebijakan koordinat di peta dashboard. Ini menutup eskalasi yang gagal ditindaklanjuti pada retro 2026-10-03.
2. **Verifikasi deploy berikutnya** sebagai gate: pull tanpa error izin, build tanpa `EACCES`, baris `Backup OK` muncul, file `.dump` tersalin ke luar VPS. Ubah blocker deploy menjadi resolved hanya setelah itu.
3. **Jalankan `/improve`** untuk menerapkan kandidat HIGH (`qa.md`, `devops.md`) — keduanya sudah menimbulkan insiden nyata.
4. **Jadwalkan upgrade Next 16 + Prisma 8** sebagai sprint tersendiri (menutup sisa 6 temuan `npm audit`), bukan `--force`.
5. **Rapikan artefak repo**: lepas `tsconfig.tsbuildinfo` dari git; pastikan `docs/final-import-pengguna.xlsx` tidak pernah di-commit.

---

## [2026-10-03] — Retrospektif Pasca Sprint 7 (Maintenance Import/Logs & Relokasi Folder)

**Project**: Database Warga GKJJ
**Scope**: 5 commit sejak 2026-07-09 (di luar alur `/sprint`) + relokasi folder `~/Documents` → `~/Projects` (2026-10-03)
**Reviewed**: Sabtu, 3 Oktober 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 0 sprint baru (sprint terakhir: 7; `.current_sprint` = 8, belum ada `sprint_08.md`) |
| Commit pasca Sprint 7 | 7 (4 fix/feat import & logs, 1 fix port Redis, 1 chore duplikat, 1 improve skill) |
| Fix commits | 4 pada 2026-07-10 + 1 pada 2026-10-03 |
| Unique blockers baru | 3 |
| Recurring blockers (>=3x) | 1 (bug kelas data-nyata, 4x, HIGH, belum resolved) |
| Skill gap terdeteksi | 5 |

### 🔁 Pola Blocker Sistemik

#### Bug data-nyata lolos dari test — muncul 4 kali dalam satu hari (2026-07-10)
- **Severity**: HIGH (eskalasi otomatis: >=3x, belum resolved)
- **Bukti**: kolom Excel bertipe Number ditolak Zod dan menggagalkan seluruh batch tanpa pesan (`920f44a`); NIK terimpor plaintext padahal jalur manual mengenkripsi AES-256 sesuai UU PDP (`191b61a`); VARCHAR overflow tanpa nama kolom (`191b61a`); `activity_log.id` BigInt gagal `JSON.stringify` di production (`9cb9fac`).
- **Root cause**: Sprint 6 menaikkan coverage `import.ts` ke 91% dengan prisma di-mock dan input string sintetis. Coverage garis tidak menangkap bentuk data nyata, paritas antar jalur tulis, maupun serialisasi tipe BigInt.
- **Catatan serius**: bug NIK plaintext adalah isu kepatuhan PDP. Perlu dicek apakah data hasil import sebelum `191b61a` sudah terenkripsi ulang.
- **Skill yang perlu diupdate**: `qa.md` (HIGH).
- **Tindakan wajib**: jadikan **task nyata Sprint 8**, bukan rekomendasi naratif.

#### Port host bentrok — 2x (Postgres 5433 lalu Redis 6379), resolved
- Redis Homebrew memegang 6379; `gkjj-redis` dipindah ke 6380 (`12d9c70`). API tidak memakai Redis, jadi tidak ada `REDIS_URL` yang perlu diubah.
- **Skill**: `devops.md` perlu cek semua port di `docker-compose.yml`.

#### Relokasi folder: DB lokal kosong setelah pindah — 1x, resolved
- Volume `databasewargagkjj_postgres_data` terpasang benar, tetapi `gkjj_db` tanpa tabel; restore dari dump pra-relokasi memulihkan `warga`=76, `users`=26.
- **Root cause kekosongan belum diketahui pasti.** Baseline `n_live_tup` untuk `users` (29) juga tidak akurat dibanding `count(*)` (26).

### 🐛 Pola Git Bermasalah

- **File sering diubah ulang**: `warga.service.ts` (8x), `routes/warga.ts` (8x), `schema.prisma` (8x), `WargaForm.tsx` (7x), `routes/import.ts` (6x).
- **Commit masalah**: 3 dari 4 fix import menyentuh area yang baru saja "ditutup" Sprint 6.
- **Root cause**: lihat pola data-nyata di atas.
- **Artefak**: `.gitignore 2` dan `.prettierrc 2` (duplikat Finder) sempat ter-commit; sudah dihapus di `8c70e63`.

### 🕳️ Gap Skill Coverage

- **Maintenance di luar `/sprint`** (4 commit 2026-07-10) tidak punya entry CHANGELOG; gate commit yatim hanya menangkap feat besar.
- **Relokasi project** hanya ada sebagai skill `relocate-project` di `.claude/skills/` yang belum di-commit; baseline rowcount-nya berbasis estimasi.
- **Memory ter-track git** (`todo_next_session.md`) masih menunjuk path `~/Documents`.

### ✅ Yang Berjalan Baik

- Backup `pg_dump` sebelum relokasi menjadi penyelamat: restore berhasil dan terverifikasi dengan `count(*)`.
- Asesmen read-only dan konfirmasi sebelum tindakan berisiko (restore, ubah port, hapus duplikat) berjalan sesuai `CLAUDE.md`.
- Commit message fix import menjelaskan root cause dengan jelas.
- Gate RETRO/commit-yatim dari retro sebelumnya tidak diganggu.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | qa.md | Test mock + input sintetis meloloskan bug data nyata | Checklist fixture xlsx realistis, paritas antar jalur tulis, uji serialisasi BigInt | ⬜ pending |
| MED | pm.md / sprint.md | Fix/feat di luar sprint tanpa entry CHANGELOG | Perluas deteksi commit yatim + entry "Maintenance" | ⬜ pending |
| MED | devops.md | Cek port tidak mencakup semua service compose | Loop `lsof` untuk semua port host | ⬜ pending |
| MED | relocate-project | Baseline `n_live_tup`, tanpa cek port & langkah restore | `count(*)` per tabel, cek port, restore standar | ⬜ pending |
| LOW | memory/todo | Path lama di file ter-track | sed path, putuskan tracking `.claude/projects/` | ⬜ pending |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. **Buat Sprint 8 "Hardening Import & Serialisasi"** (wajib, eskalasi >=3x): fixture Excel nyata, test paritas enkripsi NIK import vs manual, test serialisasi BigInt untuk semua route.
2. **Audit data produksi**: periksa apakah NIK hasil import sebelum 2026-07-10 masih plaintext dan rencanakan enkripsi ulang (isu PDP; operasi data produksi, konfirmasi dulu).
3. **Selidiki mengapa volume DB kosong** sebelum relokasi/backup berikutnya, dan commit skill `relocate-project` setelah baseline diperbaiki.

---

## [2026-07-09] — Retrospektif Sprint 6–7 (Test Coverage & Perpindahan Jemaat Frontend)

**Project**: Database Warga GKJJ
**Scope**: Sprint 6 (Test Coverage: Bulk Import & Validasi Warga) dan Sprint 7 (Perpindahan Jemaat: Frontend)
**Reviewed**: Kamis, 9 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 2 sprint (Sprint 6, Sprint 7) |
| Total tasks | 11 tasks (11/11 selesai — 5 di Sprint 6, 6 di Sprint 7) |
| Fix/revert commits (pasca sprint) | 0 |
| Recurring blocker diresolusi siklus ini | 1 (test coverage `import.ts`/`warga.service.ts`, 5x HIGH → **resolved**) |
| Unique blockers baru | 1 (dev server API stale di mesin user, Sprint 7, LOW, workaround diterapkan) |
| Skill gap terdeteksi | 1 baru (fallback verifikasi UI saat tidak ada browser tool) |

### 🎉 Sorotan: Kedua Gate dari `/improve` (2026-07-08) Terbukti Bekerja di Percobaan Pertama

Retro sebelumnya (2026-07-08) menutup dengan dua perbaikan skill yang belum pernah diuji nyata:
gate "baca RETRO.md sebelum mulai sprint" dan gate "cek commit yatim". Sprint 6-7 adalah kesempatan
pertama keduanya benar-benar dijalankan, dan **keduanya bekerja persis seperti dirancang**:

1. **Gate RETRO.md**: saat `/sprint` dijalankan dengan `sprints/.current_sprint = 6` (menunjuk ke
   `sprint_06.md` lama, Perpindahan Jemaat Frontend), agent membaca entry teratas `RETRO.md`,
   mendeteksi rekomendasi "wajib jadi sprint eksplisit" untuk test coverage yang sudah 5x HIGH, dan
   **berhenti untuk minta konfirmasi user** — persis seperti didesain. User memilih "buat sprint dulu",
   agent merenumbering sprint lama jadi `sprint_07.md` dan mengisi `sprint_06.md` baru khusus test
   coverage. Blocker yang mangkrak 5 retro berturut-turut sejak 2026-07-05 akhirnya tuntas hari yang
   sama gate-nya aktif.
2. **Gate commit yatim**: pada eksekusi Sprint 7, gate ini mendeteksi commit `1f2d520` (Sprint 4/PDP,
   2026-07-08) yang belum pernah dapat entry `CHANGELOG.md`, menawarkan backfill ke user, dan setelah
   disetujui menulis entry retroaktif (`b33897f`) sebelum melanjutkan sprint baru. Gap yang
   diidentifikasi di retro sebelumnya tertutup dalam siklus berikutnya, bukan menunggu retro lagi.

Ini validasi konkret bahwa siklus `/retro → /improve → /sprint` benar-benar self-correcting: temuan
retro tidak berhenti di rekomendasi naratif, tapi memaksa tindakan nyata di eksekusi berikutnya.

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` — **RESOLVED** setelah 5x HIGH berturut-turut
- **Status**: ✅ Resolved di Sprint 6 (2026-07-09)
- **Hasil**: `import.ts` naik dari 5.21% → 91.3% lines, `warga.service.ts` dari 3.61% → 97.59% lines.
  44 test baru (18 route + 26 service), semua pass, tidak ada perubahan logic produksi (murni
  penambahan test sesuai batasan sprint).
- **Pelajaran**: akar masalahnya bukan kurangnya tooling (Vitest sudah benar sejak lama), murni gap
  proses — tidak ada mekanisme yang memaksa rekomendasi retro jadi sprint nyata. Gate baru di
  `sprint.md` (lihat sorotan di atas) adalah fix yang tepat sasaran untuk kelas masalah ini,
  bukan cuma untuk kasus ini saja.

#### Dev server API stale (proses lama tanpa hot-reload) — occurrence baru (1x), LOW, resolved dengan workaround
- **Severity**: LOW
- **Root cause**: Dev server `apps/api` milik user di port 4000 adalah proses `tsx` (tanpa flag
  `watch`) yang sudah berjalan sejak 2026-07-05 — empat sprint sebelum Sprint 5-7 (Perpindahan
  Jemaat, Import test coverage) menambahkan route baru. Karena tidak ada hot-reload, proses ini
  tidak pernah mengenali route `/api/perpindahan` sama sekali, mengembalikan 404. Bukan bug kode —
  proses ini murni warisan sesi dev manual user yang lupa di-restart.
- **Penanganan**: Agent dengan tepat **tidak mematikan proses yang bukan dimulai sesi ini** (sesuai
  prinsip kehati-hatian terhadap proses yang mungkin milik pekerjaan user), dan sebagai gantinya
  menjalankan instance verifikasi sementara di port lain (4099), memverifikasi alur end-to-end penuh
  lewat API tersebut, lalu mematikan instance sementara itu sendiri setelah selesai — bersih, tidak
  menyentuh proses user.
- **Skill yang perlu diupdate**: tidak perlu — penanganan ad-hoc ini sudah benar dan aman. Cukup
  dicatat sebagai pola reusable kalau situasi serupa terulang (dev server user stale, jangan
  restart/kill otomatis, pakai port sementara untuk verifikasi).

### 🕳️ Gap Skill Coverage

- **Situasi**: Sprint 7 (frontend, Next.js) tidak punya akses browser tool (tidak ada Playwright/
  Puppeteer/screenshot capability tersedia di sesi ini). DoD sprint file secara eksplisit meminta
  "alur lengkap dicoba manual sekali via `npm run dev`" yang mengasumsikan interaksi browser nyata
  (klik tombol, lihat badge, buka modal). Agent menangani ini dengan baik — verifikasi alur backend
  penuh lewat API langsung (curl), menjalankan seluruh test unit/component, dan **secara eksplisit
  mengungkapkan ke user** bahwa interaksi UI (klik, visual badge/modal) belum tervalidasi visual —
  tapi ini murni inisiatif dari instruksi umum skill `/verify` ("if you can't test the UI, say so
  explicitly"), bukan sesuatu yang diantisipasi `sprint.md` sendiri.
- **Tidak di-handle oleh**: `sprint.md` Langkah 6 ("Jalankan Verifikasi Sprint") — tidak ada
  fallback eksplisit untuk kasus tidak ada browser tool tersedia di sprint frontend.
- **Saran**: tambah catatan di `sprint.md` Langkah 6: kalau tidak ada browser/screenshot tool
  tersedia untuk sprint yang menyentuh `apps/web`, fallback ke (a) type-check + test + build,
  (b) simulasi alur backend end-to-end via curl kalau relevan, (c) **wajib** nyatakan secara
  eksplisit di laporan akhir sprint bahwa interaksi UI belum divalidasi visual — supaya ini jadi
  standar konsisten, bukan tergantung insiatif individual tiap eksekusi.

### 🐛 Pola Git Bermasalah

- **Sejak retro 2026-07-08 (`a05cb27`) sampai sekarang**: 0 fix/revert commit — pola bersih ini
  konsisten sejak Sprint 1 (total sekarang 6 sprint via `/sprint` + Sprint 4 ad-hoc, semuanya 0 fix
  commit susulan).
- **`apps/web/tsconfig.tsbuildinfo`** berubah di 9 commit terpisah sepanjang riwayat — ini file
  build artifact TypeScript yang seharusnya di-`.gitignore`, bukan di-commit berulang. Tidak
  menyebabkan masalah fungsional, tapi murni noise di git history. Bukan gap skill (tidak terkait
  proses sprint), murni housekeeping repo — direkomendasikan dibersihkan sekali oleh user/di sprint
  mendatang, bukan diagendakan sebagai skill improvement.
- **`960a7cf docs: sinkronkan README...`** dan beberapa commit `docs(sprint):` terjadi di luar
  `/sprint` (commit dokumentasi manual antar-sesi) — tidak actionable karena bukan `feat:` (gate
  commit yatim sengaja hanya menyasar `feat:`, bukan `docs:`), dan dokumentasi memang wajar
  dikerjakan di luar alur sprint formal.

### ✅ Yang Berjalan Baik

- **Kedua gate baru dari `/improve` (2026-07-08) tervalidasi bekerja sempurna** pada percobaan
  pertama — lihat sorotan di atas. Ini bukti nyata siklus self-learning proyek ini berfungsi.
- **Zero fix/revert commit** tetap konsisten di seluruh sprint sejak sistem `/sprint` dipakai.
- **Sprint 6 (test coverage) dieksekusi presisi**: coverage naik drastis (>90% untuk kedua file)
  tanpa menyentuh logic produksi sama sekali — persis sesuai batasan yang ditulis di sprint file
  ("murni menambah test, bukan refactor").
- **Renumbering sprint (6→7) ditangani rapi**: semua cross-reference di `sprint_04.md`, `sprint_05.md`
  diupdate konsisten, catatan penomoran ditambahkan di kedua file yang terpengaruh — mengikuti pola
  yang sudah terbukti baik dari renumbering PDP sebelumnya.
- **Penanganan dev server stale milik user dengan hati-hati** (lihat detail di atas) — tidak mengambil
  langkah destruktif (kill proses asing) tanpa izin, memilih workaround yang aman & reversibel.
- **Disclosure jujur soal keterbatasan verifikasi UI** — tidak mengklaim "sudah diverifikasi di
  browser" padahal tidak, melaporkan apa adanya ke user.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| MED | sprint.md | Tidak ada fallback eksplisit di Langkah 6 untuk verifikasi sprint frontend ketika browser tool tidak tersedia | Tambah catatan: fallback ke type-check+test+build & simulasi backend via curl, wajib disclose eksplisit ke user bahwa UI belum divalidasi visual | ✅ applied (2026-07-09) |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. Terapkan kandidat perbaikan MED (fallback verifikasi UI tanpa browser tool) di `sprint.md` —
   dampaknya kecil per-insiden tapi akan terus berulang di setiap sprint frontend selama sesi tidak
   punya akses browser.
2. (Opsional, bukan skill) Bersihkan `apps/web/tsconfig.tsbuildinfo` dari git tracking — tambahkan ke
   `.gitignore` dan `git rm --cached` sekali saja, supaya tidak terus muncul sebagai "modified" di
   commit-commit berikutnya yang tidak terkait.
3. Tidak ada sprint terjadwal berikutnya (Sprint 1-7 semua selesai) — saat merencanakan sprint baru
   lewat `/pm`, pertimbangkan gap dari audit `/eval` Sprint 4 yang belum dijadwalkan: visibilitas
   status konsen PDP di list `/warga`, dan keputusan kebijakan retensi data (`retensiHingga`,
   **NEEDS MORE INFO** dari pengurus gereja).

---

## [2026-07-08] — Retrospektif Sprint 4–5 (Kepatuhan PDP & Perpindahan Jemaat Backend)

**Project**: Database Warga GKJJ
**Scope**: Sprint 4 (Kepatuhan PDP, di luar alur `/sprint`) dan Sprint 5 (Perpindahan Jemaat: Backend)
**Reviewed**: Rabu, 8 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 2 sprint (Sprint 4, Sprint 5) |
| Total tasks | 13 tasks (13/13 selesai — 4 di Sprint 4, 9 di Sprint 5) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers baru | 1 (npm cache EACCES, Sprint 5) — Sprint 4 tidak punya data blocker sama sekali (lihat gap di bawah) |
| Recurring blockers | 1 (test coverage, sekarang **5x** berturut-turut, masih HIGH & unresolved) |
| Skill gap terdeteksi | 3 baru (semua di `sprint.md`) |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — muncul **5 kali**, masih HIGH, masih belum resolved
- **Severity**: HIGH (sejak eskalasi otomatis retro Sprint 2, 2026-07-05)
- **Root cause**: Tidak berubah dari retro sebelumnya — ini murni gap proses, bukan gap tooling.
  `qa.md` sudah benar secara teknis (Vitest, `npm run test --workspace=apps/api -- --coverage`),
  tapi tidak ada satupun dari 5 titik review (2026-07-04, dua kali 2026-07-05, Sprint 3, dan
  sekarang Sprint 4–5) yang benar-benar mengubah rekomendasi ini jadi task nyata di sebuah sprint.
  Sprint 3 murni frontend (tidak menyentuh file ini), Sprint 4 (PDP) fokus cookie
  consent/kebijakan privasi, Sprint 5 menyentuh file **baru** (`perpindahan.service.ts`,
  `surat.service.ts`) bukan `import.ts`/`warga.service.ts` yang lama. Area produksi yang
  menyentuh ~2000 data warga langsung ini sudah **34+ hari** (sejak 2026-07-04) tanpa jaring
  pengaman test sama sekali.
- **Skill yang perlu diupdate**: `sprint.md` — aturan eskalasi di `retro.md` sudah benar sejak
  Sprint 2, tapi tidak ada mekanisme di `sprint.md` yang menutup loop dari "rekomendasi retro"
  ke "sprint file baru benar-benar dibuat". Retro terus mendeteksi, tapi tidak ada yang memaksa
  tindak lanjut sebelum sprint lain jalan duluan.
- **Saran perbaikan**: tambah langkah pre-flight di `sprint.md` yang membaca entry teratas
  `RETRO.md` — kalau ada rekomendasi "wajib jadi task eksplisit" yang belum punya sprint file
  padanan, **berhenti dan minta konfirmasi user** sebelum lanjut ke sprint yang sudah direncanakan
  (lihat detail di tabel Kandidat Perbaikan Skill). Ini blocker paling kritis yang tersisa dari
  seluruh siklus retro sejauh ini — sudah waktunya dipaksa lewat proses, bukan terus mengandalkan
  rekomendasi naratif yang terbukti 5x tidak cukup.

#### npm cache global root-owned (EACCES) — occurrence baru (1x), MED, sudah resolved dengan workaround
- **Severity**: MED
- **Root cause**: Bug npm versi lama meninggalkan file cache root-owned di `~/.npm/_cacache` di
  mesin dev. Muncul saat Sprint 5 menjalankan `npm install pdfkit date-fns` untuk pertama kali.
  Bukan gap skill sebelumnya karena belum pernah terjadi — tapi berpotensi terulang di sesi/mesin
  lain kalau tidak didokumentasikan.
- **Skill yang perlu diupdate**: `sprint.md`, bagian "Jika ada package baru dibutuhkan"
- **Saran perbaikan**: dokumentasikan workaround (`npm install ... --cache <scratchpad>/npm-cache`)
  sebagai pola reusable, dengan catatan eksplisit **jangan** menjalankan `sudo chown` otomatis —
  itu perubahan sistem yang butuh izin eksplisit user. Agent sudah menangani ini dengan benar di
  Sprint 5 (workaround tanpa sudo), tapi ditemukan dari nol di tengah eksekusi karena tidak
  terdokumentasi di manapun.

### 🐛 Pola Git Bermasalah

- **Pasca Sprint 4 (`1f2d520`) & Sprint 5 (`514cc4b`)**: 0 fix/revert commit — konsisten dengan
  Sprint 1–3 sebelumnya (juga 0). Sejak sistem `/sprint` dipakai (Sprint 1 dan seterusnya), **belum
  pernah ada satupun commit "fix:" susulan** untuk pekerjaan yang dihasilkan sprint agent — berbeda
  jauh dengan era pra-sistem yang punya banyak commit "fix:" untuk file yang sama berulang kali
  (`warga.service.ts`/`warga.ts` diubah 8× sepanjang riwayat, kebanyakan sebelum ada `/sprint`).
- **Tidak ada file yang diubah-ubah berulang secara mencurigakan** di Sprint 4–5 — perubahan schema
  Prisma di Sprint 5 (`approvedBy`/`validatedBy` ke `User`) bersih dalam satu migration, tidak ada
  migration susulan untuk memperbaiki migration sebelumnya.
- **Catatan historis (bukan temuan baru)**: dua commit lawas (`f6e606c`, `d3db31b`, keduanya
  3 Juni 2026, sebelum era `/sprint`) punya judul persis sama ("tambah fitur Validasi Data warga")
  dengan diff kecil di antaranya — indikasi commit ganda/koreksi cepat manual oleh user saat itu.
  Tidak actionable sekarang (pra-sistem, sudah lama), dicatat sekadar untuk konteks.

### 🕳️ Gap Skill Coverage

- **Situasi**: Sprint 4 (Kepatuhan PDP) dikerjakan di luar alur `/sprint` normal atas permintaan
  langsung user di tengah sesi lain. Pekerjaannya sendiri solid (commit `1f2d520`, 0 fix commit
  susulan) dan bahkan sudah didokumentasikan retroaktif di `sprints/sprint_04.md` supaya penomoran
  sprint tetap konsisten dengan Sprint 5–6 (Perpindahan Jemaat). **Tapi** karena `sprint.md` tidak
  pernah dijalankan penuh untuk sprint ini, Langkah 10 (tulis `CHANGELOG.md` + kirim email PM)
  tidak pernah terpicu — `CHANGELOG.md` punya lubang total untuk Sprint 4, seolah-olah tidak pernah
  terjadi kalau hanya dilihat dari riwayat PM.
- **Tidak di-handle oleh**: `sprint.md` (mengasumsikan selalu dijalankan dari awal), `pm.md`
  (mode continuous-delivery-nya bisa menangkap ini tapi hanya kalau benar-benar di-invoke — tidak
  ada yang memicunya otomatis setelah kerjaan ad-hoc selesai).
- **Saran**: tambah pengecekan ringan di `sprint.md`/`pm.md` yang membandingkan commit `feat:`
  sejak entry `CHANGELOG.md` terakhir dengan commit yang sudah tertandai `feat(sprint-N)` — kalau
  ada commit "yatim" (feat tanpa entry CHANGELOG), tawarkan backfill retroaktif sebelum lanjut
  sprint baru. Detail di tabel Kandidat Perbaikan Skill.

### ✅ Yang Berjalan Baik

- **Zero fix/revert commit** di seluruh 4 sprint yang lewat `/sprint` (Sprint 1, 2, 3, 5) ditambah
  Sprint 4 yang di luar alur — total 5 rilis fitur beruntun tanpa satupun commit perbaikan susulan.
- **Pre-check schema drift & Prisma consent gate (hasil retro Sprint 2) tervalidasi nyata di
  Sprint 5** — sprint pertama yang menyentuh Prisma lagi sejak perbaikan itu diterapkan. Drift
  check (`prisma migrate diff`) berjalan dan melaporkan "tidak ada drift" dengan benar, migration
  `perpindahan_approver_ke_user` diterapkan bersih tanpa perlu `migrate reset`/consent gate sama
  sekali. Perbaikan skill dari retro sebelumnya terbukti bekerja seperti dirancang.
- **Sprint 5 menangani env issue baru (npm cache EACCES) dengan judgment yang tepat**: tidak
  mencoba `sudo chown` sistem user tanpa izin, memilih workaround lokal (`--cache` folder
  scratchpad sesi) yang reversibel dan tidak menyentuh apapun di luar sesi ini.
- **Test-first discipline konsisten**: Sprint 5 menambahkan 18 test baru (11 service + 7 route)
  yang memetakan 1-ke-1 ke skenario di Definition of Done sprint file (approve/validate/delete
  edge case, role-gating tiap endpoint) — bukan sekadar test generik untuk lolos coverage.
- **Retroaktif dokumentasi sprint (`sprint_04.md`) menunjukkan itikad baik** menjaga konsistensi
  penomoran meski alur kerja menyimpang dari proses normal — gap yang tersisa (CHANGELOG) adalah
  soal tooling/proses, bukan kelalaian.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | sprint.md | Aturan eskalasi retro.md (occurrences≥3 → wajib task eksplisit) tidak punya mekanisme penutup — sudah 3 retro berturut menyatakan "wajib" tapi tidak ada sprint file yang dibuat untuk test coverage `import.ts`/`warga.service.ts` | Tambah pre-flight di sprint.md: baca entry teratas RETRO.md, kalau ada rekomendasi "wajib jadi task eksplisit" tanpa sprint file padanan, berhenti & minta konfirmasi user sebelum lanjut sprint terjadwal | ✅ applied (2026-07-08) |
| MED | sprint.md / pm.md | Kerjaan ad-hoc di luar `/sprint` (Sprint 4/PDP) tidak pernah dapat entry CHANGELOG.md/email PM karena Langkah 10 tidak pernah terpicu | Bandingkan commit `feat:` sejak CHANGELOG terakhir vs commit yang sudah tertandai `feat(sprint-N)`; kalau ada commit "yatim", tawarkan backfill CHANGELOG retroaktif sebelum sprint baru mulai | ✅ applied (2026-07-08) |
| LOW | sprint.md | npm cache global root-owned (EACCES) belum terdokumentasi — ditemukan dari nol di tengah Sprint 5 | Dokumentasikan workaround `--cache <scratchpad>/npm-cache` di bagian "Jika ada package baru dibutuhkan", eksplisit larang `sudo chown` otomatis | ✅ applied (2026-07-08) |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. **Prioritas tertinggi, tidak bisa ditunda lagi**: buat sprint eksplisit untuk test coverage
   `import.ts` (bulk-import Excel) & `warga.service.ts` (bulk-validate) — blocker ini sudah HIGH
   sejak Sprint 2 dan sekarang **5x** review berturut-turut tanpa tindak lanjut nyata. Sarankan
   ini jadi `sprints/sprint_07.md` (setelah Sprint 6/frontend Perpindahan Jemaat selesai), ATAU
   sisipkan sebagai task tambahan sebelum Sprint 6 dieksekusi kalau user ingin ditangani lebih
   cepat. Area ini menyentuh ~2000 data warga produksi langsung tanpa jaring pengaman apapun.
2. Terapkan kandidat perbaikan HIGH (`sprint.md` baca-RETRO-sebelum-mulai) secepatnya — ini akan
   mencegah gap #1 di atas terulang untuk blocker recurring lainnya di masa depan, bukan cuma
   untuk kasus test coverage ini saja.
3. Backfill entry `CHANGELOG.md` untuk Sprint 4 (Kepatuhan PDP) melalui `/pm` supaya riwayat PM
   proyek lengkap — saat ini satu-satunya jejak Sprint 4 ada di `sprints/sprint_04.md` dan git log,
   tidak muncul di `CHANGELOG.md` sama sekali.
4. Jalankan Sprint 6 (Perpindahan Jemaat: Frontend) berikutnya sesuai urutan — tidak ada blocker
   yang menghalangi, dan pre-check Prisma/Docker dari retro Sprint 2 sudah terbukti bekerja baik
   di Sprint 5 kalau Sprint 6 kembali menyentuh backend.

---

## [2026-07-05] — Retrospektif Sprint 3 (wrap-up Sprint 1–3: Reset Password Mandiri)

**Project**: Database Warga GKJJ
**Scope**: Sprint 3, sekaligus wrap-up Sprint 1–3 (seluruh isi `sprints/` sudah selesai)
**Reviewed**: Minggu, 5 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 1 sprint (Sprint 3), + wrap-up Sprint 1–3 |
| Total tasks | 5 tasks (5/5 selesai) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers (Sprint 3) | 0 |
| Recurring blockers (semua sprint) | 1 (test coverage, masih 3x/HIGH, belum ditindaklanjuti) |
| Skill gap terdeteksi | 0 baru di Sprint 3 |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — masih 3x, belum resolved
- Tidak ada progres baru di Sprint 3 (murni frontend, tidak menyentuh file ini). Severity tetap HIGH
  sejak eskalasi otomatis di retro Sprint 2. Masih menunggu jadi task eksplisit di sprint mendatang —
  lihat rekomendasi di bawah, ini poin paling penting yang tersisa dari seluruh siklus reset password.

Tidak ada pola blocker baru dari Sprint 3 — eksekusi bersih tanpa insiden.

### 🐛 Pola Git Bermasalah

- **Pasca Sprint 3 (`cf84b0a`)**: 0 fix/revert commit.
- **Ringkasan 3 sprint (`d63f5a2`, `0e1f457`, `cf84b0a`)**: total 0 fix/revert commit di ketiganya —
  konsisten bersih sejak sistem `/sprint` dipakai (dibandingkan era pra-sistem yang punya banyak
  commit "fix:" susulan untuk file yang sama, mis. `warga.service.ts`/`warga.ts` 7×).

### 🕳️ Gap Skill Coverage

Tidak ada gap baru ditemukan di Sprint 3. Perbaikan dari retro Sprint 2 (`sprint.md`: drift-check
Prisma, Prisma consent gate, port-conflict check; `retro.md`: eskalasi recurring blocker) tidak
sempat diuji ulang di Sprint 3 karena sprint ini tidak menyentuh Prisma/Docker — validasi nyata baru
akan terjadi di sprint berikutnya yang menyentuh backend/migration lagi.

### ✅ Yang Berjalan Baik

- Ketiga sprint (reset password mandiri, end-to-end: backend migration+email+endpoint, lalu
  frontend desktop+mobile) selesai 100% tanpa satupun fix/revert commit susulan.
- Alur `/pm → /sprint → /retro → /improve → /sprint (ulang)` berjalan penuh otonom sesuai instruksi,
  termasuk menangani 2 blocker HIGH di tengah jalan (port conflict, schema drift) dengan konfirmasi
  eksplisit ke user tanpa henti prosesnya.
- Verifikasi end-to-end manual (bukan cuma unit test) benar-benar dijalankan untuk alur reset
  password: forgot-password → link di dev email log → reset-password → login dengan password baru
  → token ditolak saat dipakai ulang. Ini persis skenario yang diminta di DoD sprint 3.
- Skill improvement dari retro Sprint 2 langsung diaplikasikan sebelum lanjut sprint berikutnya
  (siklus self-learning bekerja sesuai desain).

### 🔧 Kandidat Perbaikan Skill

Tidak ada kandidat baru dari Sprint 3. Kandidat lama dari retro Sprint 2 (sprint.md drift-check,
consent gate, port-check; retro.md eskalasi) sudah applied — lihat entry retro sebelumnya.

### 💡 Rekomendasi untuk Siklus Berikutnya

1. **Prioritas utama**: buat sprint baru khusus test coverage `import.ts` (bulk-import Excel) &
   `warga.service.ts` (bulk-validate) — blocker ini HIGH sejak retro Sprint 2 dan sudah 3 review
   berturut-turut tanpa tindak lanjut nyata. Ini area yang langsung menyentuh ~2000 data warga
   produksi tanpa jaring pengaman test sama sekali.
2. Validasi ulang perbaikan `sprint.md` (drift-check Prisma, port-conflict check) di sprint
   berikutnya yang benar-benar menyentuh Prisma/Docker — Sprint 3 tidak jadi kesempatan untuk
   memverifikasi perbaikan itu bekerja seperti diharapkan.
3. Tidak ada sprint baru terdaftar di `sprints/` setelah ini (`sprints/.current_sprint` = 4, tidak
   ada `sprint_04.md`) — perlu dibuat sprint plan baru sebelum `/sprint` bisa dijalankan lagi.

---

## [2026-07-05] — Retrospektif Sprint 2

**Project**: Database Warga GKJJ
**Scope**: Sprint 2
**Reviewed**: Minggu, 5 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 1 sprint (Sprint 2) |
| Total tasks | 8 tasks (8/8 selesai) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers (Sprint 2) | 2 baru (port conflict, schema drift) |
| Recurring blockers (muncul >1x, semua sprint) | 1 (test coverage import.ts/warga.service.ts, sekarang 3x) |
| Skill gap terdeteksi | 3 (sprint.md ×2, devops.md) |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — muncul 3 kali (2026-07-04, 2026-07-05 pagi, 2026-07-05 siang)
- **Severity**: MED (kandidat naik ke HIGH kalau muncul lagi)
- **Root cause**: `qa.md` sudah diperbaiki sejak retro Sprint 1 agar toolingnya cocok (Vitest, `npm run test --workspace=apps/api -- --coverage`), tapi **tidak pernah benar-benar dijalankan**. Ini bukan lagi gap tooling — ini gap proses: rekomendasi PM tidak pernah menjelma jadi task konkret di sprint manapun.
- **Skill yang perlu diupdate**: `retro.md` / `pm.md` (lihat kandidat baru di bawah — usulkan eskalasi otomatis setelah 3x occurrence)
- **Saran perbaikan**: Jadikan ini task eksplisit di sprint berikutnya (atau sprint tersendiri), bukan sekadar catatan naratif yang mudah dilewati.

#### Docker daemon tidak berjalan — sebelumnya muncul 2 kali, **resolved** di Sprint 2
- Daemon aktif & container sehat sepanjang Sprint 2. Ditandai resolved di `learning_log.json`; kalau muncul lagi nanti dihitung ulang dari awal, bukan lanjutan streak lama.

### 🆕 Blocker Baru di Sprint 2 (baru 1x, tapi berpotensi berulang di mesin dev yang sama)

#### Port Postgres (5433) bentrok dengan container project lain di mesin dev
- **Severity**: HIGH (blocking, sebelum di-resolve)
- **Root cause**: `docker-compose.yml` pakai port hardcoded tanpa pre-check ketersediaan port di level OS. Mesin dev ini menjalankan >20 container dari banyak project sekaligus — kolisi port lintas-project adalah risiko nyata, bukan kasus langka.
- **Resolved**: pindah ke port 5435, dikonfirmasi ke user dulu sebelum ubah `docker-compose.yml`/README/`.env.example`.
- **Skill yang perlu diupdate**: `devops.md` — tambah pre-check `lsof` untuk port yang dideklarasikan `docker-compose.yml` sebelum `docker compose up -d`.

#### Schema drift: `schema.prisma` lebih maju dari migration history tercatat
- **Severity**: HIGH (memaksa reset DB dev di tengah sprint)
- **Root cause**: Sejumlah fitur lama (activity_log, master_kelurahan, komisi_config, nomor_induk, dll) sudah ada di `schema.prisma` dan dipakai kode, tapi tidak pernah punya migration file — kemungkinan diterapkan ke environment lain lewat `prisma db push` langsung. `prisma migrate status` melaporkan "up to date" karena hanya membandingkan DB vs migration history tercatat, bukan vs `schema.prisma` — jadi masalah ini baru ketahuan pertengahan sprint saat `migrate dev` menolak jalan & minta reset.
- **Resolved**: migration dipecah dua — satu untuk catch-up drift lama (`sync_schema_with_existing_features`), satu lagi murni untuk fitur sprint ini (`add_password_reset_token`). Reset DB dev dikonfirmasi eksplisit ke user (termasuk melewati Prisma AI-agent consent gate dengan `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`).
- **Skill yang perlu diupdate**: `sprint.md` — tambah pre-check `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ...` sebelum mulai task migration, supaya drift terdeteksi SEBELUM eksekusi dimulai, bukan di tengah jalan.

### 🐛 Pola Git Bermasalah

- **Pasca Sprint 2 (`0e1f457`)**: 0 fix/revert commit — semua error (migration drift, port conflict) diselesaikan **sebelum** commit, bukan lewat commit susulan. Eksekusi bersih.
- Tidak ada file yang di-"fix ulang" pasca Sprint 2 — pola berbeda dari sprint-sprint lama pra-sistem (`warga.service.ts`, `warga.ts` sering direvisi berkali-kali sebelum sistem `/sprint` ada).

### 🕳️ Gap Skill Coverage

- **Situasi**: `sprint.md` Langkah 4 (pre-flight Prisma) cuma cek `migrate status`, tidak cukup untuk mendeteksi schema-ahead-of-migrations drift.
- **Situasi**: `devops.md` tidak cek port availability sebelum `docker compose up` — baru ketahuan gagal setelah dicoba.
- **Situasi**: Tidak ada dokumentasi soal Prisma AI-agent consent gate (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) di skill manapun — kalau tidak familiar, agent bisa bingung/berhenti di error yang sebenarnya straightforward untuk ditangani (minta konfirmasi eksplisit user, lalu jalankan ulang dengan env var itu).
- **Tidak di-handle oleh**: `sprint.md`, `devops.md`.
- **Saran**: Update kedua skill (bukan bikin baru) — lihat tabel kandidat perbaikan di bawah.

### ✅ Yang Berjalan Baik

- Sprint 2 selesai 100% (8/8 task) dalam sekali eksekusi meski ada 2 blocker HIGH di tengah jalan — tidak ada task yang di-skip.
- Migration drift ditangani dengan benar secara arsitektural: dipisah jadi 2 file migration (catch-up vs fitur baru) alih-alih dicampur jadi satu migration raksasa yang membingungkan riwayat.
- Konfirmasi user diminta secara eksplisit dan tepat waktu untuk 2 operasi berisiko (ganti port shared infra, reset DB) — sesuai instruksi `CLAUDE.md` soal operasi berisiko, tidak di-skip meski sedang mode otomatis penuh.
- Prisma AI-agent consent gate dihormati sepenuhnya (tidak dilewati/di-bypass) — konfirmasi baru diminta khusus untuk gate ini, bukan reuse jawaban sebelumnya.
- 46/46 test pass, `type-check` bersih di kedua workspace — tidak ada regresi ke Sprint 1.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | sprint.md | Pre-flight Prisma cuma cek `migrate status`, tidak deteksi schema-ahead-of-migrations drift | Tambah `prisma migrate diff --from-schema-datasource --to-schema-datamodel` sebelum task migration dimulai | ✅ applied (2026-07-05) |
| MED | sprint.md | Tidak ada dokumentasi Prisma AI-agent consent gate | Tambah section penanganan `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` | ✅ applied (2026-07-05) |
| MED | devops.md | Tidak cek port availability sebelum `docker compose up` | Tambah pre-check `lsof` untuk port di `docker-compose.yml` | ✅ applied (2026-07-05) — ternyata devops.md sudah punya check ini, fix diterapkan di sprint.md yang belum memanggilnya |
| MED | retro.md / pm.md | Recurring blocker 3x tanpa tindak lanjut nyata (test coverage) | Auto-usulkan jadi task eksplisit sprint berikutnya setelah occurrence ≥3 | ✅ applied (2026-07-05) — aturan ditambahkan di retro.md, langsung diterapkan: blocker test coverage dinaikkan MED→HIGH |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. Jalankan `/improve` untuk mengaplikasikan 4 perbaikan skill di atas sebelum Sprint 3 dimulai — Sprint 3 murni frontend (tidak sentuh Prisma/Docker), jadi tidak mendesak, tapi sebaiknya tidak menumpuk utang lagi seperti retro Sprint 1.
2. Test coverage `import.ts`/`warga.service.ts` sudah 3x direkomendasikan tanpa tindak lanjut — pertimbangkan buat sebagai sprint kecil tersendiri setelah Sprint 3 selesai, alih-alih terus jadi catatan MED yang lewat begitu saja.
3. Sebelum Sprint 3 (frontend), tidak ada risiko Prisma/Docker — fokus verifikasi `npm run build --workspace=apps/web` karena sprint ini pakai `useSearchParams` yang butuh `<Suspense>` di halaman ter-static-generate (sudah diwanti-wanti di sprint file itu sendiri).

---

## [2026-07-05] — Retrospektif Sprint 1

**Project**: Database Warga GKJJ
**Scope**: Sprint 1 (pertama kali dieksekusi lewat sistem `/sprint`)
**Reviewed**: Minggu, 5 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 1 sprint |
| Total tasks | 4 tasks (4/4 selesai, termasuk 1 opsional) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers (dari CHANGELOG) | 3 |
| Recurring blockers (muncul >1x) | 2 |
| Skill gap terdeteksi | 4 (qa.md, devops.md, sprint.md, pm.md) |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — muncul 2 kali (review 2026-07-04 & 2026-07-05)
- **Severity**: MED
- **Root cause**: `/qa` (khususnya subcommand `coverage`) ditulis untuk stack Python/FastAPI + pytest + pnpm — bukan stack project ini (Express+TypeScript+Prisma di `apps/api`, Next.js di `apps/web`, test runner Vitest, package manager npm workspaces). Perintah seperti `uv run pytest --cov=app`, `cat backend/pytest.ini`, `pnpm run test --coverage` tidak match apapun di repo ini, sehingga rekomendasi PM untuk menambah test coverage di dua area paling berisiko (bulk-import & bulk-validate warga, ~2000 data produksi) tidak pernah benar-benar bisa dieksekusi otomatis lewat skill yang ada.
- **Skill yang perlu diupdate**: `qa.md`
- **Saran perbaikan**: Ganti seluruh referensi pytest/coverage.json/pnpm dengan `npm run test --workspace=apps/api -- --coverage` dan `npm run test --workspace=apps/web -- --coverage` (Vitest coverage provider v8), sesuaikan contoh test dari `@pytest.mark.asyncio` ke pola Vitest + supertest untuk endpoint Express.

#### Docker daemon tidak berjalan — muncul 2 kali (review 2026-07-04 & 2026-07-05)
- **Severity**: LOW
- **Root cause**: Butuh Docker Desktop dinyalakan manual oleh user (Postgres/Redis dev) — bukan gap skill, hanya blocker lingkungan lokal yang berulang dilaporkan.
- **Skill yang perlu diupdate**: tidak ada (di luar kendali agent), cukup dicatat sebagai reminder rutin di `/pm`.

### 🐛 Pola Git Bermasalah

- **File sering diubah ulang (sepanjang riwayat repo)**: `apps/api/src/services/warga.service.ts` (7×), `apps/api/src/routes/warga.ts` (7×), `apps/web/src/app/(dashboard)/warga/WargaForm.tsx` (6×), `apps/api/prisma/schema.prisma` (6×) — area `warga` (core domain) paling sering disentuh, wajar karena ini entitas utama aplikasi.
- **Commit "fix:" pra-sistem sprint**: 6 commit fix (`701e4e3`, `755dcc3`, `8ea312f`, `9e7112d`, `b440bdb`, `3a309dd`, `3d3ac50`, `6202f50`) — semuanya terjadi **sebelum** folder `sprints/` & sistem `/sprint` ada, jadi tidak bisa dikaitkan ke sprint tertentu. Tidak actionable untuk siklus sprint saat ini.
- **Commit duplikat**: `f6e606c` dan `d3db31b` sama-sama berjudul "feat: tambah fitur Validasi Data warga (bulk validate/revert + stamp)" — kemungkinan sisa proses rebase/cherry-pick sebelum sistem sprint berjalan. Tidak berdampak ke Sprint 1, hanya catatan historis.
- **Pasca Sprint 1 (`d63f5a2`)**: 0 fix/revert commit — eksekusi bersih, tidak ada rework.

### 🕳️ Gap Skill Coverage

- **Situasi**: Empat skill inti (`qa.md`, `devops.md`, `sprint.md`, `pm.md`) masih berisi path & tooling dari template generik Python/FastAPI + pnpm (`backend/.venv`, `uv sync`, `frontend/node_modules`, `pnpm install`, `pytest.ini`, `asyncpg`, `bcrypt`/`passlib`) yang tidak pernah diadaptasi ke struktur monorepo project ini (`apps/api`, `apps/web`, npm workspaces, Prisma, Vitest).
- **Tidak di-handle oleh**: keempat skill tersebut secara konsisten — saat menjalankan `/sprint` untuk Sprint 1, seluruh pre-flight check Python (asyncpg, bcrypt, pytest.ini) harus diabaikan manual karena tidak relevan, dan path `backend/`/`frontend/` di `/pm` Langkah 4C juga tidak match sehingga deteksi dependency-blocker harus dicek manual dengan path yang benar.
- **Saran**: Update keempat skill file agar konsisten memakai `apps/api` / `apps/web` sebagai path, `npm` sebagai package manager, dan Vitest sebagai test runner — bukan menulis skill baru, cukup menyesuaikan yang sudah ada (skill-skill ini jelas ditulis generik untuk banyak project, project ini yang perlu di-lock ke stack aktualnya).

### ✅ Yang Berjalan Baik

- Sprint 1 selesai 100% (4/4 task termasuk 1 opsional) dalam sekali eksekusi, tanpa fix/revert commit susulan — DoD sprint tercapai bersih.
- Sprint file (`sprint_01.md`) sangat detail (baris kode, nama fungsi, alasan kenapa backend tidak perlu diubah) — memudahkan eksekusi tanpa ambiguitas, tidak ada task yang perlu ditebak-tebak.
- Verifikasi otomatis (`type-check`, `build`, `test`) di `## Verifikasi` sprint file semuanya bisa langsung dijalankan sesuai isi file (tidak seperti pre-flight check lain yang generik) — karena ditulis khusus untuk project ini oleh commit `6eb989d`, bukan disalin dari template.
- Alur `/pm → /sprint → /retro` berjalan mulus end-to-end tanpa perlu intervensi user di tengah jalan.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | qa.md | Seluruh isi (pytest, coverage.json, pnpm) tidak sesuai stack Express+TS+Prisma/Next.js+Vitest+npm project ini | Ganti ke `npm run test --workspace=apps/api\|apps/web -- --coverage`, contoh test Vitest+supertest | ✅ applied (2026-07-05) |
| HIGH | devops.md | Pre-flight pakai `backend/.venv`, `uv sync`, `pnpm` — path & tooling salah | Ganti ke `apps/api/node_modules`, `apps/web/node_modules`, `npm install`, cek `npx prisma migrate status` | ✅ applied (2026-07-05) |
| HIGH | sprint.md | Pre-flight Python (asyncpg/bcrypt/pytest.ini) & path `frontend/`/`backend/` tidak relevan | Hapus blok Python, ganti path ke `apps/api`/`apps/web`, ganti pnpm→npm | ✅ applied (2026-07-05) |
| MED | pm.md | Langkah 4C cek `backend/.venv`/`frontend/node_modules` dengan `uv`/`pnpm` | Ganti ke `apps/api/node_modules`, `apps/web/node_modules`, cek `apps/api/.env` & `apps/web/.env.local` | ✅ applied (2026-07-05) |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. Jalankan `/improve` untuk mengeksekusi keempat perbaikan skill di atas sebelum Sprint 2 dimulai — Sprint 2 (migration + email service backend) kemungkinan besar akan memicu pre-flight check Python yang salah di `sprint.md` jika belum diperbaiki.
2. Setelah `qa.md` diperbaiki, jalankan `/qa coverage` sungguhan untuk `apps/api/src/services/import.ts` dan `apps/api/src/routes/warga.ts`/`warga.service.ts` — blocker MED ini sudah 2 review berturut-turut tanpa tindak lanjut nyata karena tooling-nya memang belum bisa jalan.
3. Docker daemon check di `/pm`/`/devops` boleh tetap ada sebagai reminder, tapi tidak perlu dianggap blocker berulang di laporan — cukup sekali dicatat sebagai "precondition lokal", bukan risk yang harus muncul di tiap review.

---
