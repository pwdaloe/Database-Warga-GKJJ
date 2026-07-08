# Eval: Kepatuhan PDP untuk Data Warga Jemaat

**Tanggal**: 2026-07-08
**Diminta oleh**: user (`/eval PDP terkait data warga jemaat`)
**Status**: 🟡 CAMPURAN — sebagian ✅ GO sudah selesai (siap commit), sebagian 🟡 NEEDS MORE INFO, satu ❌ NOT RECOMMENDED untuk saat ini

> **Asumsi**: usulan "PDP terkait data warga jemaat" ditafsirkan sebagai permintaan **audit menyeluruh** kepatuhan UU PDP No. 27/2022 atas data warga jemaat di sistem ini — bukan satu fitur sempit. Karena Sprint 4 (aktif, belum di-commit) sudah mengerjakan sebagian besar area ini, eval ini berfungsi sebagai **audit lanjutan**: apa yang sudah selesai (siap commit) dan apa yang masih jadi gap. Koreksi jika yang dimaksud sesuatu yang lebih spesifik.

---

## Definisi Fitur

- **Problem/kebutuhan**: Sistem ini menyimpan data pribadi ~2000 jemaat (termasuk data spesifik: NIK, tanggal lahir, alamat, foto, status keanggotaan gereja). UU PDP No. 27/2022 mewajibkan dasar pemrosesan yang sah, transparansi, hak subjek data, keamanan, dan batasan retensi.
- **Target pengguna**: Semua role yang mengelola data warga (SUPERADMIN, KEPALA_KANTOR, MAJELIS, STAF_ADMIN, PENATUA_KELOMPOK) sebagai pemroses; jemaat sendiri sebagai subjek data.
- **Perilaku yang diharapkan**: Sistem transparan ke jemaat soal pemrosesan data, mencatat konsen, menerapkan kontrol keamanan, dan punya jalur bagi jemaat menjalankan hak-haknya.
- **Out of scope eksplisit**: Perubahan kebijakan hukum/organisasi gereja (bukan kerja engineering), penanganan insiden kebocoran data secara prosedural (organisasi, bukan kode).

---

## Analisis

**4a. Data yang terlibat**: NIK (spesifik), tanggal lahir, tempat lahir, alamat KTP/domisili, foto, status keanggotaan gereja (tersirat data keagamaan) — semua sudah diklasifikasi sebagai data spesifik di `Warga` model.

**4b. Role & permission**: Pencatatan konsen dilakukan **oleh staf** atas nama jemaat (bukan self-service) — sesuai `authorize('SUPERADMIN','KEPALA_KANTOR','MAJELIS','STAF_ADMIN','PENATUA_KELOMPOK')` di endpoint create/update warga. Ini model yang wajar untuk organisasi yang input datanya manual/paper-based, bukan API publik.

**4c. Dependency**: Menyentuh model `Warga` (konsen), tidak menyentuh `Keluarga`/`Kelompok`/`Wilayah` secara langsung.

**4d. Parity desktop ↔ mobile**: Form lengkap desktop (`WargaForm.tsx`) sudah punya checkbox konsen. Form cepat mobile (`m/(app)/warga/baru/page.tsx`) untuk entry awal oleh penatua **tidak** punya — ini keputusan scope yang sudah diambil sebelumnya (data `DRAFT` dilengkapi lewat form desktop saat validasi), bukan oversight baru.

**4e. Edge case**: Data hasil import Excel dan data lama otomatis `konsenPDP=false` (default) — benar secara compliance (tidak boleh klaim consent retroaktif), tapi menciptakan kebutuhan operasional: staf perlu cara untuk tahu siapa saja yang belum dikonfirmasi consent-nya.

---

## Cek Terhadap Kode Existing

| Komponen | Status | Referensi |
|----------|--------|-----------|
| Enkripsi NIK (AES-256) | ✅ | `apps/api/src/services/warga.service.ts:5,190,257` (`encryptField`/`decryptField`) |
| Redaksi field per role (`sanitizeForRole`) | ✅ | `apps/api/src/services/warga.service.ts:10-28` |
| Audit trail akses data sensitif | ✅ | `apps/api/src/routes/warga.ts:104-114`, `apps/api/src/middleware/activityLogger.ts:5-18` |
| Halaman Kebijakan Cookie | ✅ | `apps/web/src/app/kebijakan-cookie/page.tsx` (belum di-commit) |
| Halaman Kebijakan Privasi (PDP) | ✅ | `apps/web/src/app/kebijakan-privasi/page.tsx` (belum di-commit) |
| Cookie consent banner site-wide | ✅ | `apps/web/src/components/layout/CookieConsentBanner.tsx`, dipasang di `apps/web/src/app/layout.tsx` (belum di-commit) |
| Konsen PDP per-warga: field + timestamp server-side | ✅ | `apps/api/src/services/warga.service.ts` (`createWarga`/`updateWarga`), `apps/api/src/routes/warga.ts:55` (belum di-commit) |
| UI checkbox konsen di form desktop + tampilan detail | ✅ | `apps/web/src/app/(dashboard)/warga/WargaForm.tsx`, `.../[id]/page.tsx` (belum di-commit) |
| `retensiHingga` (batas retensi data) | 🟡 | Field ada di schema `apps/api/prisma/schema.prisma:165` ("hapus setelah tanggal ini") — **0 referensi** di seluruh `apps/api/src` dan `apps/web/src`. Tidak ada UI untuk mengisi, tidak ada job/cron yang mengeksekusi. Tidak ada dependency cron di `apps/api/package.json`. |
| Visibilitas status konsen di list `/warga` | 🟡 | Kolom/badge untuk `sudahBaptis`/`sudahSidi` ada di tabel (`apps/web/src/app/(dashboard)/warga/page.tsx:479-482`), tapi **tidak ada** badge/filter setara untuk `konsenPDP`. Pola filter dropdown sendiri baru ada untuk `dataStatus` (baris 373), belum untuk field boolean lain. |
| Import Excel & konsen | 🟡 | `apps/api/src/routes/import.ts` tidak menyentuh `konsenPDP` sama sekali → default `false` untuk semua data impor (benar secara compliance, tapi tidak ada tracking follow-up). |
| Self-service hak subjek data (akses/koreksi/hapus/tarik consent oleh jemaat sendiri) | ❌ | Tidak ditemukan endpoint atau halaman apa pun. Proses saat ini murni manual: email ke `gkjjkeu@outlook.com` (disebut di `kebijakan-privasi/page.tsx`). |
| Test coverage untuk endpoint/logic warga (termasuk konsen) | ❌ | `find apps/api/tests -iname "*warga*"` → kosong. Tidak ada test file untuk `warga.route.ts`/`warga.service.ts` sama sekali (gap pre-existing, bukan spesifik PDP, tapi relevan karena logic konsen baru ini masuk kategori sensitif). |

---

## Rekomendasi Desain

Untuk 3 gap yang teridentifikasi (🟡🟡❌ di atas, di luar test coverage yang lebih cocok masuk `/qa`):

### 1. Visibilitas status konsen di list `/warga` — direkomendasikan, effort kecil

- **Backend**: tambah query param `konsenPDP` di `GET /api/warga` (pola identik `sudahBaptis`/`sudahSidi` yang sudah ada di `apps/api/src/routes/warga.ts:59,70-71` dan `apps/api/src/services/warga.service.ts` `WargaFilter`).
- **Frontend**: tambah badge di tabel (pola identik badge `sudahBaptis`/`sudahSidi`, `apps/web/src/app/(dashboard)/warga/page.tsx:479-482`) dan opsi filter di panel `showFilter` yang sudah ada (baris 325+).
- Tidak perlu komponen baru, murni reuse pola yang sudah ada di file yang sama.

### 2. `retensiHingga` (retensi & penghapusan data) — 🟡 NEEDS MORE INFO, jangan desain dulu

Sebelum ada rancangan teknis, ini butuh **keputusan kebijakan dari gereja/pengelola data**, bukan keputusan engineering:
- Berapa lama data disimpan setelah status keanggotaan berubah jadi `PINDAH_KELUAR`/`MENINGGAL`?
- Apakah penghapusan data berarti hard-delete, atau anonimisasi (tetap simpan untuk laporan statistik historis tanpa identitas)?
- Siapa yang berwenang menyetujui penghapusan (approval flow, atau otomatis penuh)?

Merancang cron job otomatis tanpa jawaban ini berisiko menghapus data yang seharusnya masih perlu disimpan (atau sebaliknya, menyimpan data yang seharusnya sudah dihapus). **Rekomendasi**: jangan bangun otomasi dulu — cukup catat sebagai kebijakan tertulis dulu (bisa ditambahkan ke `kebijakan-privasi/page.tsx` sebagai statement retensi), baru rancang engineering-nya di sprint terpisah setelah kebijakan jelas.

### 3. Self-service hak subjek data untuk jemaat — ❌ tidak direkomendasikan sekarang

Opsi dibandingkan:

| | Opsi A: Tetap manual (email) | Opsi B: Bangun portal self-service |
|---|---|---|
| Pendekatan | Jemaat kirim email ke pengurus, staf proses manual di sistem | Jemaat login (butuh akun terhubung `wargaId` — kolom `unique` sudah ada di `User` model), lihat/edit data sendiri, ajukan penghapusan |
| Effort relatif | Sudah selesai (hanya dokumentasi) | L–XL: butuh alur login jemaat baru, halaman self-service, approval flow permintaan hapus/akses, notifikasi |
| Risiko | Rendah — proses manual biasa untuk skala ~2000 warga | Sedang — permukaan serangan baru (akun jemaat), kompleksitas approval hapus data yang terhubung ke `Keluarga`/`User` |
| Rekomendasi | 👍 | 👎 (untuk saat ini) |

Skala ~2000 warga dengan proses manual yang sudah didokumentasikan cukup memenuhi kewajiban transparansi UU PDP. Bangun self-service hanya jika volume permintaan hak subjek data terbukti membebani proses manual (belum ada data bahwa ini terjadi).

---

## Estimasi Effort

Catatan kalibrasi: 3 sprint sebelumnya (`sprints/sprint_01.md` s.d. `sprint_03.md`, commit `d63f5a2`, `0e1f457`, `cf84b0a`) dieksekusi oleh agent AI berturut-turut dalam satu hari (10:10–15:32 WIB), sehingga selisih waktu commit **tidak representatif** sebagai estimasi hari-kerja manusia. Kalibrasi effort di bawah pakai jumlah task & kompleksitas relatif terhadap sprint tersebut (Sprint 1 = 4 task/kecil, Sprint 2 = 8 task/sedang, Sprint 3 = 5 task/sedang), bukan durasi kalender.

| Item | Layer | Effort | Catatan |
|------|-------|--------|---------|
| Commit pekerjaan Sprint 4 yang sudah ada (cookie/kebijakan/konsen) | — | Selesai | Tinggal `/sprint` untuk commit + verifikasi, bukan kerja baru |
| Badge + filter konsen PDP di list `/warga` | Backend + Frontend | S (~2-3 jam, mirip 1 task di sprint sebelumnya) | Reuse pola `sudahBaptis`/`sudahSidi` sepenuhnya |
| Kebijakan retensi (`retensiHingga`) | — | **Tidak diestimasi** | Menunggu keputusan kebijakan (lihat NEEDS MORE INFO) sebelum bisa diestimasi teknis |
| Self-service hak subjek data | — | **Tidak direkomendasikan** | Lihat perbandingan opsi di atas |
| Test coverage `warga.route.ts`/`warga.service.ts` | Testing | M (mirip Sprint 2 yang 8 task, karena `warga` adalah endpoint paling kompleks — banyak role, banyak field) | Sebaiknya jadi task `/qa write` terpisah, bukan bagian sprint PDP ini |

**T-shirt size total untuk item yang GO** (poin 1 saja, karena poin 2 & 3 belum bisa/tidak direkomendasikan untuk dieksekusi): **S** (< 1 hari).

---

## Risk & Compliance

- [x] Menambah/mengubah data pribadi spesifik? **Tidak ada perubahan baru** — `konsenPDP` adalah metadata proses (bukan data pribadi baru), data spesifik (NIK dst.) sudah ditangani sebelumnya (enkripsi + redaksi, ✅).
- [x] Menyentuh migration di tabel produksi? **Tidak** — field `konsenPDP`/`tanggalKonsen`/`retensiHingga` sudah ada di schema sejak awal, tidak ada migration baru untuk pekerjaan Sprint 4 ini. DB warga saat ini kosong (0 baris) di environment dev — belum ada risiko data produksi nyata untuk diuji, cek ulang saat data real di-import.
- [x] Mengubah permission/role existing? **Tidak.**
- [x] Butuh test tambahan yang belum ter-cover? **Ya, signifikan** — 0 test untuk seluruh endpoint warga (bukan hanya konsen). Lihat rekomendasi `/qa write` di atas.
- [x] Dampak performa? **Tidak** — field boolean/datetime sederhana, tidak ada query N+1 baru, filter baru (poin 1) mengikuti pola `where` yang sudah efisien di `listWarga()`.

---

## Verdict

**Bagian yang sudah dikerjakan (uncommitted di working tree saat ini) — ✅ GO, siap commit sebagai penyelesaian Sprint 4.** Tidak perlu kerja tambahan untuk area ini; jalankan `/sprint` untuk verifikasi akhir + commit.

**Badge/filter konsen PDP di list `/warga` — ✅ GO, sprint berikutnya (kecil, bisa disisipkan ke sprint manapun berikutnya).** Draft task:

```markdown
### N. Visibilitas Status Konsen PDP di List Warga
- Tambah query param `konsenPDP` (true/false) di `GET /api/warga` (`apps/api/src/routes/warga.ts`,
  `apps/api/src/services/warga.service.ts` `WargaFilter`) — pola identik `sudahBaptis`/`sudahSidi`
- Tambah badge status konsen di tabel `apps/web/src/app/(dashboard)/warga/page.tsx` (pola identik
  badge `sudahBaptis`/`sudahSidi`, baris ~479-482)
- (Opsional) tambah opsi filter di panel `showFilter` yang sudah ada
```

**Retensi data (`retensiHingga`) — 🟡 NEEDS MORE INFO.** Pertanyaan untuk user/pengurus gereja sebelum bisa dirancang:
1. Berapa lama data jemaat non-aktif (`PINDAH_KELUAR`/`MENINGGAL`) disimpan sebelum dihapus/dianonimkan?
2. Hard-delete atau anonimisasi?
3. Perlu approval manual, atau boleh otomatis penuh?

**Self-service hak subjek data — ❌ NOT RECOMMENDED untuk saat ini.** Proses manual (email) yang sudah ada cukup untuk skala saat ini; revisit jika volume permintaan meningkat.

**Rekomendasi tambahan di luar scope PDP langsung**: buka eval/task terpisah untuk test coverage `warga.route.ts`/`warga.service.ts` — lebih cocok lewat `/qa write` daripada dibungkus di sprint PDP ini.

---
*Dibuat otomatis oleh `/eval`. Supersedes: -*
