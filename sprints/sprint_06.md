# Sprint 6 — Perpindahan Jemaat: Frontend (List, Form, Cetak PDF, Email, WhatsApp)

## Konteks

Sprint ini melanjutkan Sprint 5 (API `apps/api/src/routes/perpindahan.ts` sudah tersedia lengkap
dengan endpoint list/create/approve/**validate**/delete/`surat.pdf`/`kirim-email`). **Jangan
jalankan sprint ini kalau Sprint 5 belum selesai** — cek `sprints/.current_sprint`, harus sudah ≥ 5.

Perpindahan Jemaat punya **2 tahap approval** (keputusan produk, lihat `sprints/sprint_05.md`):
approve (persetujuan awal, `MAJELIS`/`KEPALA_KANTOR`/`SUPERADMIN`) lalu validate (finalisasi
administratif, hanya `KEPALA_KANTOR`/`SUPERADMIN` — inilah yang mengubah `statusKeanggotaan`
warga). UI harus merefleksikan 2 tahap ini secara eksplisit, jangan disederhanakan jadi 1 tombol.

Sidebar frontend **sudah** punya link `/perpindahan` (lihat
`apps/web/src/components/layout/Sidebar.tsx` grup "Utilitas") — tidak perlu diubah.

Pola yang wajib diikuti (jangan perkenalkan library/state management baru):
- Data fetching: TanStack Query, ikuti pola `apps/web/src/hooks/useWarga.ts` /
  `apps/web/src/hooks/useKeluarga.ts` (nama hook, query key, invalidasi setelah mutasi)
- Form: `react-hook-form` + `zod` (`@hookform/resolvers/zod`), komponen `InputField`/`SelectField`
  dari `apps/web/src/components/ui/FormField.tsx`
- Tabel & modal: `Modal` dari `components/ui/Modal.tsx`, `Pagination` dari `components/ui/Pagination.tsx`, `Badge` untuk status/jenis
- Role-gating: `useAuth()` hook, sama seperti dipakai di `apps/web/src/app/(dashboard)/warga/page.tsx`
- **Ini fitur dashboard admin, bukan halaman jemaat/mobile** — tidak perlu versi `apps/web/src/app/m/...` (beda dengan fitur kartu anggota yang memang untuk jemaat sendiri). Konsisten dengan fitur admin-only lain (`/wilayah`, `/import`, `/log`) yang juga tidak punya versi mobile.

**Untuk kirim WhatsApp**: ikuti pola `apps/web/src/lib/kartuWhatsapp.ts` (`wa.me` link dengan pesan
teks pre-filled, dibuka via `window.open` — **bukan** integrasi API WhatsApp Business, tidak butuh
kredensial apapun). Karena `wa.me` cuma mendukung teks (tidak bisa attach file), pesan WhatsApp
berisi ringkasan surat, bukan PDF-nya — kalau warga perlu file PDF, arahkan mereka pakai tombol
"Kirim Email" atau minta cetak langsung dari admin.

## Tasks

### 1. Hook data fetching `usePerpindahan.ts`

Buat `apps/web/src/hooks/usePerpindahan.ts` mengikuti pola `useWarga.ts`:

- `usePerpindahanList(filter: { page, limit, jenis?, search? })` — `useQuery`, key
  `['perpindahan', filter]`, panggil `GET /perpindahan`
- `usePerpindahanMutations()` — return object berisi:
  - `create` (`useMutation`, `POST /perpindahan`, invalidate `['perpindahan']` setelah sukses)
  - `update` (`PUT /perpindahan/:id`)
  - `approve` (`POST /perpindahan/:id/approve`)
  - `validate` (`POST /perpindahan/:id/validate`)
  - `remove` (`DELETE /perpindahan/:id`)
  - `kirimEmail` (`POST /perpindahan/:id/kirim-email`) — return message dari response untuk ditampilkan sebagai notifikasi; tangkap error 400 "belum divalidasi" dan tampilkan pesannya apa adanya (backend sudah kasih pesan jelas)

### 2. Lib WhatsApp `perpindahanWhatsapp.ts`

Buat `apps/web/src/lib/perpindahanWhatsapp.ts`, mirror `kartuWhatsapp.ts`:

```ts
const JENIS_LABEL: Record<string, string> = {
  MASUK: 'Pindah Masuk', KELUAR: 'Pindah Keluar', MENINGGAL: 'Keterangan Kematian',
}

export function buildPerpindahanWhatsAppMessage(perpindahan: any): string {
  const jenis = JENIS_LABEL[perpindahan.jenis] ?? perpindahan.jenis
  return [
    `Halo ${perpindahan.warga?.namaPanggilan || perpindahan.warga?.namaLengkap}! 🙏`,
    '',
    `Berikut ringkasan surat *${jenis}* Anda dari *Jemaat GKJJ*:`,
    '',
    `📋 *Nama:* ${perpindahan.warga?.namaLengkap}`,
    `📄 *Jenis:* ${jenis}`,
    `🔢 *Nomor Surat:* ${perpindahan.nomorSurat || '-'}`,
    `🏛️ *Gereja Asal/Tujuan:* ${perpindahan.gerejaAsalTujuan || '-'}`,
    '',
    `Surat lengkap (PDF) akan dikirim menyusul via email, atau dapat diambil langsung di kantor gereja. ✝️`,
  ].join('\n')
}

export function kirimPerpindahanWhatsApp(perpindahan: any): void {
  const raw = (perpindahan.warga?.whatsapp || perpindahan.warga?.telepon || '').replace(/\D/g, '')
  const phone = raw.startsWith('0') ? '62' + raw.slice(1) : raw
  if (!phone) {
    alert('Nomor WhatsApp / telepon belum terdaftar untuk warga ini.')
    return
  }
  const msg = buildPerpindahanWhatsAppMessage(perpindahan)
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
}
```

### 3. Halaman list `apps/web/src/app/(dashboard)/perpindahan/page.tsx`

- Header + tombol "Catat Perpindahan Baru" (buka `Modal` berisi form, role `STAF_ADMIN` ke atas)
- Filter: dropdown jenis (`Semua`/`MASUK`/`KELUAR`/`MENINGGAL`), search box nama warga (debounce sederhana seperti pola di `warga/page.tsx` kalau ada, atau langsung on-change)
- Tabel kolom: Nama Warga, Jenis (Badge warna beda per jenis), Tanggal, Nomor Surat, Status (Badge
  3 kondisi: "Menunggu Approval" abu-abu jika `approvedBy` null, "Disetujui" kuning/biru jika
  `approvedBy` terisi tapi `validatedBy` null, "Divalidasi" hijau jika `validatedBy` terisi), Aksi
- Kolom Aksi (tombol icon, role-gated via `useAuth()`):
  - **Approve** (`CheckCircle2` icon) — hanya tampil kalau `approvedBy` null DAN role `MAJELIS`/`KEPALA_KANTOR`/`SUPERADMIN`. Konfirmasi dulu (`confirm()` browser cukup, ikuti pola sederhana yang sudah ada di project ini untuk aksi konfirmasi kalau ada, kalau tidak ada pola khusus `window.confirm` cukup)
  - **Validate** (`ShieldCheck` icon, tampil terpisah dari Approve) — hanya tampil kalau `approvedBy`
    **sudah terisi** DAN `validatedBy` masih null DAN role `KEPALA_KANTOR`/`SUPERADMIN`. Konfirmasi
    dulu (`window.confirm`) — jelaskan di teks konfirmasi bahwa aksi ini akan mengubah status
    keanggotaan warga, karena ini transaksi yang beneran mengubah data `warga.statusKeanggotaan`.
  - **Cetak Surat** — `window.open(`${API_BASE_URL}/perpindahan/${id}/surat.pdf`, '_blank')`, cek `apps/web/src/lib/api.ts` untuk base URL API yang benar. Tersedia untuk semua status (preview draft juga boleh).
  - **Kirim Email** — hanya **aktif/enabled** kalau `validatedBy` sudah terisi (kalau belum, tombol
    disabled dengan tooltip/title "Validasi dulu sebelum kirim surat resmi" — backend juga sudah
    menolak dengan 400 kalau dipanggil sebelum waktunya, tapi UI sebaiknya sudah mencegah dari awal).
    Kalau enabled, panggil `kirimEmail` mutation, tampilkan hasil message via `alert()` atau toast
    kalau project sudah punya sistem toast (cek dulu apakah ada, kalau tidak `alert()` sudah
    konsisten dengan pola error handling form yang ada)
  - **Kirim WhatsApp** — panggil `kirimPerpindahanWhatsApp(row)`, tersedia untuk semua status (ringkasan teks, bukan surat resmi)
  - **Hapus** — hanya kalau `approvedBy` null DAN role `KEPALA_KANTOR`/`SUPERADMIN`, konfirmasi dulu
- `Pagination` di bawah tabel

### 4. Form catat perpindahan `PerpindahanForm.tsx`

Buat `apps/web/src/app/(dashboard)/perpindahan/PerpindahanForm.tsx` (komponen dipakai di dalam `Modal`):

- Field `wargaId`: pilih warga — cek apakah ada komponen search-select warga yang reusable di project (lihat `WargaForm.tsx` atau hook pencarian warga yang dipakai di form lain, mis. saat assign `kepalaKeluarga`). Reuse kalau ada; kalau tidak ada, buat select sederhana dengan search text yang query `useWargaList` dengan `search` filter dan render hasil sebagai daftar pilihan
- Field `jenis`: `SelectField` dengan opsi `MASUK`/`KELUAR`/`MENINGGAL`
- Field `gerejaAsalTujuan`: `InputField` teks, opsional
- Field `tanggalPerpindahan`: input date, opsional
- Field `nomorSurat`: `InputField` teks, opsional
- Field `keterangan`: textarea, opsional
- Validasi Zod: `wargaId` wajib (`z.number({ required_error: '...' })`), `jenis` wajib (`z.enum([...], { required_error: 'Pilih jenis perpindahan' })`), sisanya optional
- Submit → panggil `create` mutation, tutup modal setelah sukses, tampilkan error dari `err.response.data.error` mengikuti pola `LoginForm.tsx`/form lain di project

### 5. Test component

Buat `apps/web/src/app/(dashboard)/perpindahan/PerpindahanForm.test.tsx` mengikuti pola
`Badge.test.tsx`/`Pagination.test.tsx` (Vitest + React Testing Library). Cover:

- Submit tanpa pilih `wargaId` → muncul pesan error validasi, mutation **tidak** terpanggil (mock hook `usePerpindahanMutations`)
- Submit tanpa pilih `jenis` → muncul pesan error validasi
- Submit dengan data valid → mutation `create` dipanggil dengan payload yang benar

### 6. Test util WhatsApp

Buat `apps/web/src/lib/perpindahanWhatsapp.test.ts` mengikuti pola test util yang sudah ada (kalau
`kartuWhatsapp.ts` punya test, ikuti pola yang sama; kalau belum ada, buat test sederhana untuk
`buildPerpindahanWhatsAppMessage` — assert pesan mengandung nama warga, jenis, dan nomor surat yang benar).

## Verifikasi

```bash
npm run type-check --workspace=apps/web
npm run test --workspace=apps/web
npm run build --workspace=apps/web
```

Semua harus sukses.

## Definition of Done

- [ ] Halaman `/perpindahan` menampilkan list dengan filter jenis dan search nama warga, ter-paginasi
- [ ] Form catat perpindahan baru berfungsi, validasi wajib `wargaId` dan `jenis`
- [ ] Badge status merefleksikan 3 kondisi: Menunggu Approval / Disetujui (approved, belum validated) / Divalidasi
- [ ] Tombol Approve hanya muncul untuk role yang sesuai dan data yang belum di-approve; setelah approve, badge berubah ke "Disetujui" (bukan langsung "Divalidasi"), tabel ter-refresh
- [ ] Tombol Validate hanya muncul untuk data yang sudah approved tapi belum validated, dan role `KEPALA_KANTOR`/`SUPERADMIN` saja; setelah validate, badge berubah ke "Divalidasi" dan `warga.statusKeanggotaan` berubah
- [ ] Tombol Cetak Surat membuka PDF surat di tab baru untuk semua status (termasuk sebelum validated, sebagai preview draft)
- [ ] Tombol Kirim Email disabled sampai `validatedBy` terisi; setelah validated, memanggil endpoint kirim-email dan menampilkan hasil (sukses atau pesan error kalau warga belum punya email)
- [ ] Tombol Kirim WhatsApp membuka `wa.me` dengan pesan ringkasan surat yang benar
- [ ] Tombol Hapus hanya muncul untuk data yang belum di-approve dan role yang sesuai
- [ ] Alur lengkap dicoba manual sekali via `npm run dev`: catat perpindahan baru → approve (cek `warga.statusKeanggotaan` **belum** berubah) → validate (cek `warga.statusKeanggotaan` **baru** berubah di halaman `/warga`) → cetak PDF → kirim email (mode dev, cek log server) → kirim WhatsApp (cek link `wa.me` terbuka dengan pesan benar) — catat hasilnya di ringkasan sprint
- [ ] Semua test baru + lama pass, `type-check` dan `build` bersih di `apps/web`
