// Token QR kartu anggota: 32 karakter hex huruf kecil (sama dengan validasi di API).
const POLA_QR_TOKEN = /^[0-9a-f]{32}$/

export function adalahQrTokenValid(nilai: unknown): nilai is string {
  return typeof nilai === 'string' && POLA_QR_TOKEN.test(nilai)
}

/**
 * Tautan kartu digital yang ditanam di QR dan dikirim lewat WhatsApp: `{origin}/m/{token}`.
 * Mengembalikan null bila warga tidak punya token valid (mis. peran tanpa akses Kartu, atau data lama),
 * sehingga pemanggil menampilkan "QR belum tersedia" dan TIDAK jatuh ke id berurutan.
 */
export function tautanKartu(origin: string, warga: { qrToken?: unknown } | null | undefined): string | null {
  const token = warga?.qrToken
  if (!adalahQrTokenValid(token)) return null
  return `${origin.replace(/\/+$/, '')}/m/${token}`
}
