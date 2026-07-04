# Sprint 1 — Tombol Kirim WhatsApp Template di Kartu Anggota Mobile

## Konteks

Saat ini fungsi kirim kartu anggota via WhatsApp (`kirimWhatsApp()`) hanya ada di versi desktop:
`apps/web/src/app/(dashboard)/kartu/page.tsx` (baris ±141-169). Fungsi ini murni client-side:
menyusun pesan teks dari data warga lalu membuka `https://wa.me/{nomor}?text=...` di tab baru —
**tidak butuh backend/API baru**.

Versi mobile (`apps/web/src/app/m/(app)/kartu/page.tsx`) saat ini, setelah user mencari & tap
hasil, langsung `router.push('/m/${w.id}')` ke halaman publik kartu digital — tanpa tombol kirim
WA sama sekali. Halaman publik `/m/[id]` (`apps/web/src/app/m/[id]/page.tsx`) memanggil endpoint
publik `GET /api/public/member/:id` yang **tidak** mengembalikan nomor telepon/WhatsApp (memang
disengaja untuk privasi) — jadi tombol WA **tidak boleh** ditambahkan di halaman itu.

Nomor WhatsApp/telepon warga **sudah tersedia** di response list warga yang dipakai
`/m/kartu` (`useWargaList` dari `apps/web/src/hooks/useWarga.ts`, yang memanggil endpoint warga
biasa, bukan endpoint publik) — dikonfirmasi field `whatsapp`/`telepon` di-select di
`apps/api/src/services/warga.service.ts` (baris ±82-83) dan **tidak** disembunyikan untuk role
`PENATUA_KELOMPOK` (hanya disembunyikan untuk `VIEWER`, lihat fungsi `sanitizeForRole`). Jadi tidak
perlu perubahan backend sama sekali di sprint ini — murni frontend.

## Tasks

### 1. Ekstrak logika kirim WhatsApp ke helper bersama

Buat file baru `apps/web/src/lib/kartuWhatsapp.ts` berisi:
- `STATUS_KEANGGOTAAN_LABEL` (pindahkan dari `(dashboard)/kartu/page.tsx`, atau import dari tempat
  yang sudah ada kalau ternyata sudah didefinisikan di `@/lib/auth.ts`/lib lain — cek dulu sebelum
  duplikasi)
- `buildWhatsAppMessage(warga: any): string` — logika penyusunan pesan (persis sama isinya dengan
  yang ada sekarang di `kirimWhatsApp()`, jangan ubah wording template)
- `kirimWhatsApp(warga: any): void` — normalisasi nomor (`0` → `62`), validasi nomor kosong
  (`alert` kalau kosong seperti sekarang), lalu `window.open('https://wa.me/...')`

### 2. Update halaman desktop untuk pakai helper bersama

Edit `apps/web/src/app/(dashboard)/kartu/page.tsx`: hapus definisi lokal `kirimWhatsApp` dan
`STATUS_KEANGGOTAAN_LABEL` (kalau dipindah), ganti dengan `import { kirimWhatsApp } from
'@/lib/kartuWhatsapp'`. Pastikan tombol "Kirim via WhatsApp" yang sudah ada tetap berfungsi persis
sama seperti sebelumnya.

### 3. Tambah tombol kirim WA di hasil pencarian mobile

Edit `apps/web/src/app/m/(app)/kartu/page.tsx`:
- Di setiap item hasil pencarian (`wargaList.map(...)`), tambah tombol ikon WhatsApp (pakai
  `MessageCircle` dari `lucide-react`, warna hijau khas WhatsApp) di sebelah ikon `CreditCard` yang
  sudah ada
- `onClick` tombol ini **wajib** `e.stopPropagation()` supaya tidak ikut memicu `onClick` parent
  (yang menavigasi ke `/m/${w.id}`), lalu panggil `kirimWhatsApp(w)` dari helper baru
- Tap di area lain kartu (bukan tombol WA) tetap berperilaku seperti sekarang: navigasi ke halaman
  kartu publik `/m/${w.id}`

### 4. (Opsional, kerjakan jika waktu cukup) Tombol WA di halaman detail warga mobile

Cek `apps/web/src/app/m/(app)/warga/[id]/page.tsx` — jika halaman ini punya data warga lengkap
(termasuk whatsapp/telepon) dan ada area aksi/tombol, tambahkan tombol "Kirim Kartu via WhatsApp"
yang juga memanggil `kirimWhatsApp()` dari helper yang sama. Lewati task ini jika struktur halaman
tidak cocok atau butuh refactor besar — task ini bukan blocker untuk Definition of Done sprint.

## Verifikasi

```bash
npm run type-check --workspace=apps/web
npm run build --workspace=apps/web
npm run test --workspace=apps/web
```

Semua harus sukses tanpa error. Tidak ada test baru yang wajib ditulis untuk sprint ini (logika WA
sudah battle-tested di desktop), tapi kalau ada waktu boleh tambah test ringan untuk
`buildWhatsAppMessage()` (pure function, mudah ditest tanpa render komponen).

## Definition of Done

- [ ] `apps/web/src/lib/kartuWhatsapp.ts` dibuat, berisi logika kirim WA yang sebelumnya ada di
      desktop `kartu/page.tsx`
- [ ] Desktop `kartu/page.tsx` diupdate untuk pakai helper ini (tidak ada duplikasi kode), tombol
      lama tetap berfungsi
- [ ] Mobile `/m/kartu` punya tombol kirim WA langsung di hasil pencarian, tanpa perlu pindah ke
      halaman publik `/m/[id]` dulu
- [ ] Tap tombol WA tidak ikut memicu navigasi ke halaman lain
- [ ] `npm run type-check --workspace=apps/web`, `npm run build --workspace=apps/web`, dan
      `npm run test --workspace=apps/web` semua pass
- [ ] Tidak ada perubahan di backend (`apps/api`) — sprint ini murni frontend
