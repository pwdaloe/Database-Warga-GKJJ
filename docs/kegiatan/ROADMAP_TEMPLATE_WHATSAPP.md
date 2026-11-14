# Roadmap: template pesan WhatsApp (aplikasi Kegiatan)

*Disusun 14 Nov 2026. Pelengkap `LANJUTAN.md`. Pra-muker 23 Nov, muker 30 Nov 2026.*

## Posisi sekarang (v0.5.0)
- **Akun pengguna > tombol WhatsApp** per akun (admin dan sekretariat). Aplikasi menyusun pesan, admin menekan "Kirim lewat WhatsApp" (tautan `wa.me`), pesan terkirim dari WhatsApp admin sendiri. Tidak ada pengiriman otomatis.
- Dua template, ditulis di kode (`apps/kegiatan-api/src/services/pengguna.service.ts`):
  - **Siap akses** (akun belum ganti password): alamat, username, password sementara. Password **direset** saat tombol ditekan, karena password hanya tersimpan sebagai hash dan tidak bisa dibaca ulang.
  - **Pengingat** (akun sudah ganti password): alamat dan username saja; akun tidak diubah.
- Tombol nonaktif bila nomor kosong atau akun nonaktif. Pengiriman tercatat di jejak audit (`NOTIF_AKSES_WA`, tanpa password).
- **Edit nomor WhatsApp** dari layar Akun (tombol Nomor; nomor tidak valid ditolak, kosong menghapus). Nomor ini milik akun, terpisah dari nomor pada data pengurus.
- Batasan: isi template tidak bisa diubah tanpa rilis, dan tidak ada catatan "sudah dikirim ke siapa".

## Keputusan 14 Nov 2026
**Pengiriman tetap lewat `wa.me` (WhatsApp biasa dari perangkat admin). WhatsApp Business API tidak dipakai karena berbayar.** Semua fase di bawah dirancang tanpa pengiriman otomatis: aplikasi menyiapkan pesan, manusia menekan kirim.

## Fase 1: template terkelola (sebelum muker 30 Nov bila ada waktu)
Tujuan: admin mengatur isi pesan sendiri tanpa menunggu rilis.
- Tabel `template_wa` (kode, judul, isi, aktif, diubah oleh, versi). Penampung di **Master > Dukungan**, di samping nomor bantuan WhatsApp yang sudah ada.
- **Penanda isi**: `{nama}`, `{username}`, `{password}`, `{tautan}`, `{unit}`, `{tanggal_pra_muker}`, `{tanggal_muker}`. Server menolak penanda yang tidak dikenal dan menolak `{password}` pada template yang bukan jenis akses.
- **Pratinjau** dengan data contoh dan tombol "Kembalikan ke bawaan".
- Template awal: *Siap akses*, *Pengingat akses*, *Reset password*.

## Fase 2: kirim terpandu dan catatan pengiriman
Tujuan: menjangkau puluhan pengurus UPK tanpa menekan satu per satu tanpa jejak.
- Tabel `notifikasi_wa` (akun, template, waktu, oleh siapa, status: disiapkan / ditandai terkirim).
- Layar **Kirim akses massal**: filter (belum ganti password, belum pernah masuk, per bidang atau unit), daftar antrean, tombol "Kirim" membuka WhatsApp lalu "Tandai terkirim", penghitung sisa.
- Lencana di daftar akun: "Akses terkirim 14 Nov".
- Template baru: **Pembukaan pengajuan**, **Pengingat tenggat** (H-3, H-1), **Jadwal pra-muker dan muker**, **Pengajuan belum lengkap** (daftar masalah dari server).
- Semua pesan massal **tanpa password**; password hanya di pesan akses per akun.

## Fase 3: pengiriman terpandu yang lebih nyaman (tetap `wa.me`)
Tujuan: mengurangi kerja manual tanpa biaya dan tanpa pengiriman otomatis.
- **Antrean kirim**: tekan "Kirim" membuka WhatsApp, kembali ke aplikasi, otomatis maju ke penerima berikutnya (tombol "Tandai terkirim" dan "Lewati").
- **Salin pesan** dan **bagikan ke WhatsApp Web atau desktop** (`https://web.whatsapp.com/send?phone=...`) untuk admin yang bekerja dari komputer.
- **Pengingat otomatis dalam aplikasi untuk admin**, bukan untuk pengguna: ringkasan di dashboard "12 pengurus belum ganti password, 5 belum diingatkan", dengan pintasan ke antrean.
- **Ganti password dalam pesan dengan tautan sekali pakai** (token kedaluwarsa 24 jam, untuk mengatur password sendiri), agar password mentah tidak lagi tersimpan di riwayat chat. Ini perubahan keamanan, bukan soal pengiriman, dan tetap berjalan lewat `wa.me`.
- Batasan yang diterima: tidak ada status terkirim atau dibaca dari WhatsApp; "terkirim" hanya penanda manual admin.

## Fase 4: notifikasi kejadian terpadu
Menyatu dengan rencana **Notifikasi** (pengumuman admin + notifikasi kejadian, setelah pilot).
- Pemicu yang disiapkan sebagai daftar tugas admin (bukan pengiriman otomatis): kegiatan diajukan, perlu revisi, tahap berganti, tenggat mendekat.
- Pemberitahuan **dalam aplikasi** untuk pengguna (bar atau lonceng) yang tidak butuh WhatsApp sama sekali, dengan WhatsApp `wa.me` sebagai pelengkap.
- Berbagi dengan portal `my` (agenda jemaat) bila keputusan platform bersama diambil.

## Keputusan yang masih terbuka
1. Apakah pesan akses ke pengurus boleh tetap membawa password sementara selama Fase 1-2? (Risiko: pesan tersimpan di riwayat chat. Mitigasi sekarang: wajib ganti password saat masuk pertama; solusi tuntas: tautan sekali pakai di Fase 3.)
2. Perlu Fase 2 (catatan dan antrean) sebelum muker, atau cukup tombol per akun yang sekarang?

## Urutan yang disarankan
Pakai v0.5.0 untuk mengirim akses ke semua pengurus lebih dulu. Lanjut Fase 1 hanya bila isi pesan perlu sering diubah. Fase 2 baru berguna bila jumlah penerima mulai banyak atau pengingat tenggat dibutuhkan; Fase 3-4 dinilai setelah pilot dan muker. Tidak ada fase yang memerlukan biaya langganan.
