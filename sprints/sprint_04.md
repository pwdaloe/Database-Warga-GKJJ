# Sprint 4 — Kepatuhan PDP: Cookie Consent, Kebijakan Privasi, Konsen per-Warga

**Status: ✅ SELESAI** — dikerjakan di luar alur `/sprint` normal (permintaan langsung dari user
di tengah sesi lain), baru didokumentasikan retroaktif di sini agar penomoran sprint tetap
konsisten dengan `sprints/sprint_05.md`/`sprint_07.md` (Perpindahan Jemaat) yang sudah lebih dulu
menempati nomor 4-5 sebelum sprint ini digeser.

## Konteks

Sprint ini awalnya tidak diberi nomor (commit `feat: kepatuhan PDP — ...` tanpa label sprint),
karena saat dikerjakan `sprints/sprint_04.md` & `sprint_05.md` sudah lebih dulu diisi rencana
Perpindahan Jemaat dari sesi lain. Setelah disinkronkan, sprint Perpindahan Jemaat digeser ke
Sprint 5 (backend) & Sprint 6 (frontend) — Sprint 6 kemudian digeser lagi ke Sprint 7 saat Sprint 6
disisipkan untuk test coverage `import.ts`/`warga.service.ts` (lihat `sprints/sprint_06.md`,
2026-07-08) — dan pekerjaan PDP ini menempati slot Sprint 4 sesuai urutan pengerjaan aktual (PDP
selesai lebih dulu, sebelum Perpindahan Jemaat mulai dikerjakan).

## Tasks (sudah selesai)

### 1. Halaman Kebijakan Cookie & Kebijakan Privasi
- `apps/web/src/app/kebijakan-cookie/page.tsx` — kategori cookie/local storage, dasar pemrosesan, kontak
- `apps/web/src/app/kebijakan-privasi/page.tsx` — data yang dikumpulkan, dasar pemrosesan, 7 hak subjek data (Pasal 5-12 UU PDP No. 27/2022), keamanan & retensi, kontak

### 2. Cookie Consent Banner
- `apps/web/src/components/layout/CookieConsentBanner.tsx` — banner site-wide, pilihan "Hanya Esensial"/"Terima Semua" tersimpan di `localStorage`, dipasang di `apps/web/src/app/layout.tsx`
- Link ke kedua halaman kebijakan ditambahkan di footer login desktop (`apps/web/src/app/(auth)/login/page.tsx`) & mobile (`apps/web/src/app/m/login/page.tsx`)

### 3. Konsen PDP per-Warga
- Field `konsenPDP`/`tanggalKonsen` (sudah ada di `apps/api/prisma/schema.prisma` sejak awal, sebelumnya tidak terpakai) disambungkan penuh:
  - `apps/api/src/routes/warga.ts` — terima `konsenPDP` di body schema
  - `apps/api/src/services/warga.service.ts` — `tanggalKonsen` **ditentukan server**, bukan dipercaya dari client; hanya diisi ulang saat transisi belum-setuju → setuju, dikosongkan saat consent ditarik, tidak berubah saat edit lain sementara consent sudah aktif
  - Checkbox konsen di `apps/web/src/app/(dashboard)/warga/WargaForm.tsx` (tab Keanggotaan) + tampilan status di `apps/web/src/app/(dashboard)/warga/[id]/page.tsx`
  - `packages/types/src/index.ts` — tambah `konsenPDP`/`tanggalKonsen` ke interface `Warga`

### 4. Skill `/eval` + audit lanjutan
- `.claude/commands/eval.md` — skill baru untuk evaluasi usulan fitur sebelum sprint planning
- `evals/EVAL_pdp-data-warga-jemaat_2026-07-08.md` — audit kepatuhan PDP, menemukan 2 gap belum dikerjakan (lihat di bawah)

## Verifikasi (sudah dijalankan)

```bash
npm run type-check --workspace=apps/api    # ✅ bersih
npm run type-check --workspace=apps/web    # ✅ bersih
npm run build --workspace=apps/web         # ✅ bersih, /kebijakan-cookie & /kebijakan-privasi ter-generate statis
```

Verifikasi manual end-to-end via curl: create warga dengan `konsenPDP: true` → `tanggalKonsen` terisi; tarik consent (`false`) → `tanggalKonsen` null; re-consent → `tanggalKonsen` baru; edit field lain tanpa sentuh consent → `tanggalKonsen` tidak berubah. Semua sesuai ekspektasi.

## Definition of Done

- [x] Halaman `/kebijakan-cookie` dan `/kebijakan-privasi` bisa diakses tanpa login
- [x] Cookie consent banner muncul di kunjungan pertama, pilihan tersimpan
- [x] Checkbox konsen PDP di form warga, `tanggalKonsen` server-authoritative
- [x] Type-check & build bersih di `apps/api` dan `apps/web`
- [x] Skill `/eval` dibuat dan diuji sekali (audit PDP ini sendiri)

## Belum Termasuk Sprint Ini (gap ditemukan saat eval, belum dijadwalkan)

Rujuk `evals/EVAL_pdp-data-warga-jemaat_2026-07-08.md` untuk detail lengkap:

1. **Visibilitas status konsen di list `/warga`** — belum ada badge/filter untuk `konsenPDP` di tabel (effort kecil, S, bisa disisipkan ke sprint mendatang mana pun).
2. **Kebijakan retensi (`retensiHingga`)** — field ada di schema, 0 referensi di kode. Butuh keputusan kebijakan dari pengurus gereja dulu (berapa lama data disimpan setelah `PINDAH_KELUAR`/`MENINGGAL`, hard-delete atau anonimisasi) sebelum bisa dirancang teknis — **NEEDS MORE INFO**, bukan diputuskan sepihak oleh engineering.
3. **Test coverage `warga.route.ts`/`warga.service.ts`** — 0 test ditemukan untuk seluruh endpoint warga (bukan spesifik PDP; ini juga blocker HIGH berulang dari `RETRO.md` retro Sprint 2 & 3, belum ada tindak lanjut). Sebaiknya jadi sprint/task tersendiri lewat `/qa write`.

Belum dinomori sebagai sprint baru — diserahkan ke user untuk memutuskan prioritas relatif terhadap Sprint 5-6 (Perpindahan Jemaat) yang sudah direncanakan.
