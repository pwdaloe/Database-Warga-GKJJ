/**
 * Satu-satunya daftar status keanggotaan di sisi API. Urutan = urutan tampil.
 * Nilai harus sama dengan enum `StatusKeanggotaan` di schema.prisma dan daftar di
 * apps/web/src/lib/statusKeanggotaan.ts (dijaga tes `statusKeanggotaan.sinkron.test.ts`).
 *
 * `dihitungAktif`: dihitung sebagai anggota aktif gereja (dashboard, demografi, komisi, kelengkapan data).
 * Catatan nama: PINDAH_KELUAR dipertahankan sebagai kode DB, tetapi artinya "Pindah Agama" (tanpa surat atestasi).
 * PINDAH_GEREJA = pindah ke gereja lain dengan surat atestasi (hasil Perpindahan jenis KELUAR).
 */
export const STATUS_KEANGGOTAAN_META = [
  { value: 'AKTIF', label: 'Aktif', dihitungAktif: true },
  { value: 'NON_AKTIF', label: 'Non Aktif', dihitungAktif: false },
  { value: 'KATEKUMEN', label: 'Katekumen', dihitungAktif: false },
  { value: 'PINDAH_GEREJA', label: 'Pindah Gereja', dihitungAktif: false },
  { value: 'PINDAH_KELUAR', label: 'Pindah Agama', dihitungAktif: false },
  { value: 'MENINGGAL', label: 'Meninggal', dihitungAktif: false },
] as const

export type StatusKeanggotaanKode = (typeof STATUS_KEANGGOTAAN_META)[number]['value']

export const STATUS_KEANGGOTAAN_VALUES = STATUS_KEANGGOTAAN_META.map((s) => s.value) as unknown as readonly [
  StatusKeanggotaanKode,
  ...StatusKeanggotaanKode[],
]
