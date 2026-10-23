# Sprint 12 — Integritas Data, Chart Demografi, Revisi Keanggotaan

## Konteks

Gabungan tiga hal (keputusan user, 2026-10-17):
- **Integritas data** — rekomendasi 1 retro 2026-10-07: blocker "bug data-nyata lolos dari test" sudah 9x, varian relasional (KK kosong, penunjuk kepala basi) wajib jadi task nyata.
- **Chart demografi Pria/Wanita** — backlog PANDUAN_PRODUK 9.4. Hanya status AKTIF, jumlah + persen, memakai `wargaWhere` (cakupan pengguna + filter wilayah/kelompok).
- **Revisi Keanggotaan** — keputusan 2026-10-12 di PANDUAN_PRODUK 9.4. Kolom baru nullable: `tempat_sidi` (VarChar 150), `sudah_menikah` (Boolean), `tanggal_menikah` (Date), `tempat_menikah` (VarChar 150). Tanggal/tempat menikah hanya boleh terisi bila `sudah_menikah` = true. `nomor_sidi` tetap di DB tapi disembunyikan (belum di-DROP).

Aturan: migrasi DB produksi, deploy, dan commit hanya dengan konfirmasi user.

## Tasks

1. Integritas: modul query integritas read-only (KK kosong, `kepala_keluarga_id` tidak cocok dengan KK kepala, warga KEPALA tanpa KK, duplikat NIK) + skrip/endpoint yang bisa dijalankan terhadap produksi setelah deploy.
2. Integritas: tes relasional untuk operasi yang memindahkan warga atau mengganti kepala, dengan mutation check.
3. Dashboard: `GET /api/dashboard/demografi` (L/P, hanya AKTIF, jumlah + persen, `wargaWhere`) + tes endpoint (cakupan Penatua, filter, status non-aktif dikecualikan).
4. Dashboard web: hook `useDemografi` + chart komposisi Pria/Wanita (jumlah + persen) pada halaman dashboard, ikut filter.
5. Keanggotaan: skema Prisma + migrasi (kolom baru, CHECK constraint tanggal/tempat menikah hanya bila `sudah_menikah`).
6. Keanggotaan: Zod + service Warga + profil-saya + import/export Excel + `packages/types`.
7. Keanggotaan: UI form Warga web dan `/m` (urutan Baptis → Sidi/Baptis Dewasa → Menikah), kartu/detail warga, label baru.
8. Tes round-trip Keanggotaan (simpan → muat ulang, validasi Zod, import/export) dengan mutation check.
9. Verifikasi visual di browser (dashboard + form Warga, desktop dan 390px) dan dokumentasi (PANDUAN_PRODUK, README, CHANGELOG, tracker).

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm test --workspace=apps/api
npm test --workspace=apps/web
npm run build --workspace=apps/web
```

## Definition of Done

- Semua task di atas selesai, type-check/tes/build lulus.
- Query integritas dijalankan terhadap DB lokal dan mengembalikan hasil sesuai.
- UI dilihat langsung di browser (bukan hanya tes komponen).
- Migrasi belum diterapkan ke produksi tanpa konfirmasi user; `nomor_sidi` belum di-DROP.

## Status (2026-10-23)

Task 1–8 selesai dan di-commit (`14636ff`); type-check dan tes lulus (API 312, web 137). Task 9 selesai: dokumentasi dan verifikasi visual di browser (23 Okt: kartu Demografi desktop + 390px, form Keanggotaan 390px; yang belum dicek: form desktop, detail warga, `/m`, simpan ulang). Belum dideploy; migrasi belum diterapkan ke produksi.
