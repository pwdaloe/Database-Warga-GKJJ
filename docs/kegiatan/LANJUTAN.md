# Titik lanjut: aplikasi Kegiatan (RKA 2027)

*Diperbarui 24 Okt 2026 (malam). Baca ini dulu saat melanjutkan pekerjaan.*

## Posisi sekarang
- **Sprint K1 selesai di lokal dan sudah di main** (`419508b`). **Belum dipasang di VPS.** Produksi `jemaat`/`api` masih di `10222b3` dan tidak tersentuh.
- Landing "sedang disiapkan" masih aktif untuk `my`, `kegiatan`, `majelis`.
- Tanggal: gerbang go/no-go **Jum 30 Okt**; aplikasi live ≤ **Min 1 Nov**; jendela pengisian UPK **2–9 Nov**; pengajuan ditutup **10 Nov**; pra-muker **15 Nov**; muker **22 Nov 2026**.
- Rencana dan keputusan: `RENCANA_MVP_MUKER_2026.md`. Hasil sprint: `../../sprints/sprint_k1.md` (bagian "Hasil pelaksanaan"). Latar jangka menengah: `BRIEF_MODUL_KEGIATAN.md`.

## Langkah berikutnya (urut)
1. **Uji tampilan HP (390 px)** pada formulir, daftar program, dashboard, admin. Belum pernah dilihat; pengurus UPK kemungkinan mengisi dari HP.
2. **Verifikasi yang belum**: tarik kembali dan hapus di browser, ringkasan cetak, tab master selain Tahun, buat akun + tombol WhatsApp.
3. **Pasang di VPS** mengikuti `deploy/DEPLOY_KEGIATAN.md` (Daru menjalankan perintah; Claude memandu satu langkah demi satu). `nginx -t` untuk konfigurasi baru belum pernah dicoba.
4. **Pilot satu UPK** sebelum membuka pengajuan; lalu admin ubah status pengajuan ke *Dibuka*.
5. **K2 (sebelum 10 Nov)**: ekspor Excel (seluruh program dan baris RAB), rekap per kategori biaya, cuplikan angka potensi peserta per komisi dari dashboard jemaat.
6. **K3 (sebelum 15 Nov, bila ada waktu)**: telaah koordinator bidang (komentar, perlu revisi), skoring 5 kriteria (Dampak, Urgensi, Keselarasan, Kelayakan, Keberlanjutan), catatan keputusan pra-muker, laporan konsolidasi.

## Gerbang keputusan
**Jum 30 Okt**: bila formulir belum stabil, fallback ke alur Smartsheet/Excel yang sudah dipakai, dengan templat 10 bagian; aplikasi dilanjutkan untuk revisi dan pelaksanaan 2027.

## Menunggu jawaban Daru
- Pemetaan UPK → bidang di seed adalah **usulan** (Peribadahan: Ibadah, KKG; Pembinaan 1: Warga Dewasa, PA, Adiyuswa, Dilah, Aksara Kita; Pembinaan 2: Anak, Remaja, Pemuda; Kesaksian & Pelayanan: Diaken, Kespel, PEJ, LP4WG; Penatalayanan: 2 pos). Benar?
- Daftar pengurus per UPK (nama, WhatsApp, email) dan koordinator tiap bidang. Excel dari UPK akan menyusul; sementara BPH berisi nama contoh.
- Dokumen misi/renstra (di luar visi dan empat aspek): ada?
- Pagu resmi 2027 (sementara = angka 2026, total Rp300.000.000).
- Siapa admin yang mengelola akun.
- Soal lama: judul surat atestasi jemaat ("Keterangan Pindah Keluar") menunggu istilah baku; 5 warga Pindah Agama (id 736, 739, 836, 1123, 1124) menunggu ditinjau.

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
- `prisma db push` menolak menambah constraint unik ke tabel berisi: terapkan SQL aditif manual sebelum deploy (pelajaran Sprint 13, `DEPLOY.md`).
- Nginx di VPS 1.24: jangan pakai `http2 on;` (pakai `listen 443 ssl http2;`).
- Seluruh perubahan jemaat sebelumnya sudah dideploy; Sprint 13B (absensi QR) dan portal `my` (Sprint 14–17) **tertunda** sampai aplikasi Kegiatan stabil. Sprint 13B kemungkinan dilebur ke aplikasi Kegiatan (sesi absensi per kegiatan); keputusan ulang saat dilanjutkan.
- Aplikasi Kegiatan memakai login sendiri; SSO dengan jemaat belum ada (`../PLATFORM.md` P1).
