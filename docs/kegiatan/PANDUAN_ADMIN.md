# Panduan Admin dan Sekretariat: kegiatan.gkjjakarta.org

Peran **Admin** dan **Sekretariat** mengelola master, akun, dan membuka/menutup pengajuan. **Majelis** hanya melihat. **Koordinator bidang** melihat program bidangnya. **Pengurus UPK** hanya mengisi program unitnya.

## Siklus pengajuan
1. **Persiapan**: master diperiksa, akun dikirim, uji dengan satu UPK. Status pengajuan: *Belum dibuka*.
2. **Buka pengajuan**: Master → Tahun & jendela → Status *Dibuka* → Simpan (ada konfirmasi). Pengurus dapat membuat, mengubah, mengajukan, dan menarik.
3. **Tutup pengajuan**: status *Ditutup*. Pengurus tidak dapat lagi mengubah atau menarik. Admin/sekretariat tetap dapat menarik dan mengubah draft atas nama unit (tercatat di audit).
4. **Pra-muker dan muker**: pakai Dashboard (pagu vs pengajuan, per bidang, per visi-misi) dan Ringkasan per program.

Tanggal rencana buka/tutup, pra-muker, dan muker hanya informasi; **yang menentukan adalah status pengajuan**.

## Master (semua dapat diubah, tanpa kode)
- **Unit & pagu**: nama resmi, singkatan, nama lain (alias), bidang, pagu per tahun. Pos non-UPK (mis. Penatalayanan) berjenis *Pos*.
- **Pengurus (BPH)**: Ketua, Sekretaris, Bendahara per unit dengan nama, WhatsApp, email.
- **Visi & misi**: hierarki per tahun; menjadi pilihan "Acuan visi dan misi" di formulir.
- **Satuan** dan **Kategori biaya**: saran pada RAB dan dasar rekap.
- **Tahun baru**: salin pagu dan visi-misi dari tahun lain sebagai nilai awal, lalu ubah.

## Akun
- Buat akun dari menu **Akun**; password sementara tampil **sekali** dengan tombol kirim WhatsApp. Pengguna wajib menggantinya saat masuk pertama.
- **Reset** membuat password sementara baru. **Nonaktifkan** mencabut akses seketika.
- Akun Admin/Sekretariat hanya dapat dikelola oleh Admin.

## Data contoh
Data berlabel *Contoh* (akun dan program) dapat dibuang di server: `npm run db:buang-contoh --workspace=apps/kegiatan-api` (menampilkan jumlah), lalu tambahkan `-- --ya` untuk menghapus. Posisi BPH tetap ada; ganti nama contohnya di menu Pengurus.
