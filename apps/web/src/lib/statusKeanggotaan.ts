/**
 * Satu-satunya daftar status keanggotaan di sisi web. Urutan = urutan tampil.
 * Nilai harus sama dengan enum `StatusKeanggotaan` di schema.prisma dan daftar di
 * apps/api/src/constants/statusKeanggotaan.ts (dijaga tes `statusKeanggotaan.sinkron.test.ts` di apps/api).
 *
 * `dihitungAktif`: dihitung sebagai anggota aktif gereja.
 * PINDAH_KELUAR dipertahankan sebagai kode DB tetapi artinya "Pindah Agama" (tanpa surat atestasi).
 * PINDAH_GEREJA = pindah ke gereja lain dengan surat atestasi.
 */
export const STATUS_KEANGGOTAAN_META = [
  { value: 'AKTIF', label: 'Aktif', dihitungAktif: true, badge: 'bg-green-100 text-green-700', soft: 'text-green-600 bg-green-50', hex: '#16a34a', bar: 'bg-green-500' },
  { value: 'NON_AKTIF', label: 'Non Aktif', dihitungAktif: false, badge: 'bg-gray-100 text-gray-600', soft: 'text-gray-500 bg-gray-100', hex: '#6b7280', bar: 'bg-gray-400' },
  { value: 'KATEKUMEN', label: 'Katekumen', dihitungAktif: false, badge: 'bg-blue-100 text-blue-700', soft: 'text-blue-600 bg-blue-50', hex: '#2563eb', bar: 'bg-blue-400' },
  { value: 'PINDAH_GEREJA', label: 'Pindah Gereja', dihitungAktif: false, badge: 'bg-indigo-100 text-indigo-700', soft: 'text-indigo-600 bg-indigo-50', hex: '#4f46e5', bar: 'bg-indigo-400' },
  { value: 'PINDAH_KELUAR', label: 'Pindah Agama', dihitungAktif: false, badge: 'bg-orange-100 text-orange-700', soft: 'text-orange-600 bg-orange-50', hex: '#ea580c', bar: 'bg-orange-400' },
  { value: 'MENINGGAL', label: 'Meninggal', dihitungAktif: false, badge: 'bg-red-100 text-red-700', soft: 'text-red-600 bg-red-50', hex: '#dc2626', bar: 'bg-slate-600' },
] as const

export type StatusKeanggotaanKode = (typeof STATUS_KEANGGOTAAN_META)[number]['value']

export const STATUS_KEANGGOTAAN_VALUES = STATUS_KEANGGOTAAN_META.map((s) => s.value) as unknown as readonly [
  StatusKeanggotaanKode,
  ...StatusKeanggotaanKode[],
]

/** Untuk <select>/SelectField: { value, label }. */
export const STATUS_KEANGGOTAAN_OPTIONS: ReadonlyArray<{ value: string; label: string }> =
  STATUS_KEANGGOTAAN_META.map((s) => ({ value: s.value, label: s.label }))

export const STATUS_KEANGGOTAAN_LABEL: Record<string, string> =
  Object.fromEntries(STATUS_KEANGGOTAAN_META.map((s) => [s.value, s.label]))

export const STATUS_KEANGGOTAAN_BADGE: Record<string, string> =
  Object.fromEntries(STATUS_KEANGGOTAAN_META.map((s) => [s.value, s.badge]))

export const STATUS_KEANGGOTAAN_SOFT: Record<string, string> =
  Object.fromEntries(STATUS_KEANGGOTAAN_META.map((s) => [s.value, s.soft]))

export const STATUS_KEANGGOTAAN_HEX: Record<string, string> =
  Object.fromEntries(STATUS_KEANGGOTAAN_META.map((s) => [s.value, s.hex]))

export const STATUS_KEANGGOTAAN_BAR: Record<string, string> =
  Object.fromEntries(STATUS_KEANGGOTAAN_META.map((s) => [s.value, s.bar]))
