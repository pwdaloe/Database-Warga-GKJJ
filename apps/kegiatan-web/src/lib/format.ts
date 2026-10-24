/** 1500000 → "1.500.000" (tanpa awalan Rp). */
export function formatAngka(n: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}

export function formatRupiah(n: number): string {
  return `${n < 0 ? '−' : ''}Rp ${formatAngka(Math.abs(n))}`
}

/** "Rp 1.500.000" / "1.500.000" / "1500000" → 1500000; kosong → 0; tidak valid → null. */
export function parseRupiah(teks: string): number | null {
  const bersih = teks.replace(/Rp|\s/gi, '').replace(/\./g, '')
  if (bersih === '') return 0
  if (!/^\d+$/.test(bersih)) return null
  const n = Number(bersih)
  return Number.isSafeInteger(n) ? n : null
}

/** Saat mengetik: hanya angka, ditampilkan dengan pemisah ribuan. */
export function formatKetikRupiah(teks: string): string {
  const angka = teks.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return angka === '' ? '' : formatAngka(Number(angka))
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/** "2027-04-10" → "10 April 2027" (tanpa konversi zona waktu). */
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1] ?? ''} ${m[1]}`
}

export function persen(bagian: number, total: number): string {
  if (total === 0) return '—'
  return `${Math.round((bagian / total) * 100)}%`
}
