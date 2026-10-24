/**
 * Normalisasi nomor WhatsApp ke format internasional tanpa plus (628xxxxxxxxx),
 * sesuai kebutuhan tautan wa.me. Mengembalikan null bila bukan nomor yang valid.
 */
export function normalizeWa(input: string | null | undefined): string | null {
  if (!input) return null
  let digits = input.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  digits = digits.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  else if (digits.startsWith('8')) digits = '62' + digits
  if (!/^62\d{8,13}$/.test(digits)) return null
  return digits
}

/** Tautan wa.me; teks awal opsional. Null bila nomor tidak valid. */
export function waLink(nomor: string | null | undefined, teks?: string): string | null {
  const n = normalizeWa(nomor)
  if (!n) return null
  return teks ? `https://wa.me/${n}?text=${encodeURIComponent(teks)}` : `https://wa.me/${n}`
}

/** 628123456789 → 62812****789 (untuk log) */
export function maskWa(nomor: string): string {
  const n = normalizeWa(nomor) ?? nomor
  if (n.length <= 7) return '***'
  return n.slice(0, 5) + '*'.repeat(n.length - 8) + n.slice(-3)
}
