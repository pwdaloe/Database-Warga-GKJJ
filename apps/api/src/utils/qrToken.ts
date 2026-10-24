import { randomBytes } from 'node:crypto'

// Token QR kartu anggota: 128 bit acak, 32 karakter hex huruf kecil.
// Format sama dengan DEFAULT kolom warga.qr_token di database (gen_random_uuid() tanpa tanda hubung),
// jadi token dari database dan dari rotasi ini bisa divalidasi dengan satu pola.
const POLA_QR_TOKEN = /^[0-9a-f]{32}$/

export function buatQrToken(): string {
  return randomBytes(16).toString('hex')
}

export function adalahQrTokenValid(nilai: unknown): nilai is string {
  return typeof nilai === 'string' && POLA_QR_TOKEN.test(nilai)
}

/** Samarkan token di jalur URL sebelum dicatat ke log akses. */
export function samarkanQrTokenDiUrl(url: string): string {
  return url.replace(/(\/api\/public\/member\/)[^/?#\s]+/i, '$1[token]')
}
