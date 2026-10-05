import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Nomor yang ditampilkan untuk warga: utamakan No. Induk Warga (resmi dari gereja);
 * No. Anggota otomatis (WRG…) hanya cadangan sementara selama No. Induk belum diisi.
 */
export function nomorWarga(
  w?: { nomorInduk?: string | null; nomorAnggota?: string | null } | null,
): string | null {
  return w?.nomorInduk || w?.nomorAnggota || null
}
