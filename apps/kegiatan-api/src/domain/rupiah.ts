import { z } from 'zod'

/** Batas atas satu nilai rupiah: 1 triliun. Menjaga hasil kali dan jumlah tetap aman sebagai number (< 2^53). */
export const MAKS_RUPIAH = 1_000_000_000_000

export const rupiah = z
  .number({ invalid_type_error: 'Harus berupa angka' })
  .int('Rupiah harus bilangan bulat tanpa desimal')
  .min(0, 'Tidak boleh negatif')
  .max(MAKS_RUPIAH, 'Melebihi batas wajar (1 triliun)')

/** Volume satu baris RAB: bilangan bulat positif. */
export const volumeSchema = z
  .number({ invalid_type_error: 'Harus berupa angka' })
  .int('Volume harus bilangan bulat')
  .min(1, 'Minimal 1')
  .max(1_000_000, 'Terlalu besar')

/** volume x hargaSatuan memakai BigInt; hasil dibatasi MAKS_RUPIAH. Melempar bila di luar batas. */
export function hitungJumlah(volume: number, hargaSatuan: number): bigint {
  const hasil = BigInt(volume) * BigInt(hargaSatuan)
  if (hasil > BigInt(MAKS_RUPIAH)) throw new RangeError('Jumlah melebihi batas wajar (1 triliun)')
  return hasil
}

export function jumlahkan(nilai: Array<bigint | number>): bigint {
  return nilai.reduce<bigint>((acc, n) => acc + BigInt(n), 0n)
}
