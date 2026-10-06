# Sprint 11 — Role Jemaat: Profil Saya, Verifikasi Staf, Catatan Jemaat

## Konteks

Fase 4 dari `docs/FITUR_NOTIFIKASI_AKUN_WA.md` (bagian 10, keputusan 13). Bergantung pada Sprint 10 (tautan warga–pengguna, akun dengan password acak, menu Hubungi).

Keputusan yang mengikat:
- Role baru `JEMAAT`, **wajib** tertaut ke warga (tanpa tautan: fail-closed, tidak melihat apa pun).
- Hanya melihat dan mengubah data dirinya. Field boleh diubah (whitelist server, `.strict()`): identitas (nama panggilan, tempat & tanggal lahir, NIK, golongan darah), kontak (telepon, WhatsApp + centang boleh ditampilkan, email, pendidikan terakhir, pekerjaan), alamat (KTP, domisili + centang "berbeda dengan KTP").
- **Alamat KK hanya dapat diubah oleh kepala keluarga**; anggota lain hanya melihat.
- Semua perubahan jemaat masuk **antrean Validasi Data** (staf & Kepala Kantor), tercatat di log dengan sumber "jemaat"; NIK wajib diverifikasi, dimasker di tampilan.
- **Catatan jemaat terpisah** dari catatan internal (`CatatanJemaat` dengan kolom `jenis`, siap untuk survei/kebutuhan jemaat).
- Id warga selalu dari token (`user.wargaId`), **bukan parameter URL** (cegah IDOR).

Pola wajib: tes round-trip per peran dengan mutation check; `authorize(...)` existing tidak menyertakan JEMAAT → verifikasi default tertutup.

## Tasks

1. Skema & migrasi: `UserRole.JEMAAT`, `CatatanJemaat`, penanda sumber perubahan (`diubahOleh`/flag "diubah mandiri") pada warga agar muncul di Validasi Data.
2. API `GET/PUT /api/profil-saya` (+ alamat KK hanya kepala keluarga), skema Zod `.strict()`, NIK: validasi 16 digit, tolak bentrok, wajib verifikasi, perubahan → `dataStatus` kembali ke perlu validasi + audit log (data lama/baru, sumber).
3. Tambahkan `JEMAAT` ke `ROLES`, `packages/types`, Sidebar (hanya Profil Saya + Hubungi), ProtectedRoute, dropdown role (form & import Excel), redirect pasca-login ke Profil Saya.
4. Web: halaman Profil Saya 3 tab (Identitas, Kontak, Alamat) mobile-first; checkbox domisili; kolom alamat KK read-only untuk non-kepala; catatan jemaat.
5. Validasi Data: tampilkan penanda "diubah mandiri oleh jemaat" dan beri akses Kepala Kantor.
6. Tes: JEMAAT ditolak di semua route lain (matriks), tidak bisa membaca/mengubah warga lain (manipulasi id), field di luar whitelist ditolak, anggota non-kepala tidak bisa mengubah alamat KK, JEMAAT tanpa `wargaId` fail-closed, round-trip simpan → muat ulang, mutation check.
7. Dokumentasi, CHANGELOG, tracker.

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm test --workspace=apps/api
npm test --workspace=apps/web
npm run build --workspace=apps/web
```

## Definition of Done

Lihat bagian 14 `docs/FITUR_NOTIFIKASI_AKUN_WA.md`.
