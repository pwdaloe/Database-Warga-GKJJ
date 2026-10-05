/**
 * Helper input koordinat (latitude/longitude) yang tahan format lokal:
 * - desimal koma ("-6,2088") dan titik ("-6.2088")
 * - tanda minus unicode (− –) dari hasil salin/tempel
 * - pasangan "lat, lng" dari Google Maps dalam satu tempelan
 */

export interface ParsedCoordinate {
  /** Angka hasil parse; null jika input kosong */
  value: number | null
  /** false jika input tidak kosong tetapi bukan angka yang valid */
  valid: boolean
}

function normalize(raw: string): string {
  return raw.trim().replace(/[−–—]/g, '-').replace(/\s+/g, '')
}

export function parseCoordinateInput(raw: string): ParsedCoordinate {
  const s = normalize(raw)
  if (s === '') return { value: null, valid: true }
  // satu koma tanpa titik → koma sebagai desimal
  const withDot = !s.includes('.') && (s.match(/,/g) ?? []).length === 1 ? s.replace(',', '.') : s
  if (!/^-?\d+(\.\d+)?$/.test(withDot)) return { value: null, valid: false }
  return { value: Number(withDot), valid: true }
}

const NUM = String.raw`-?\d+(?:[.,]\d+)?`

/**
 * Deteksi tempelan berisi dua angka: "-6.2088, 106.8456" (Google Maps),
 * "-6,2088 106,8456" atau "-6.2088; 106.8456".
 */
export function parseCoordinatePair(text: string): [number, number] | null {
  const t = text.trim().replace(/[−–—]/g, '-')
  const m =
    // pemisah ';' atau ", " / "," dengan titik desimal
    t.match(new RegExp(String.raw`^(${NUM})\s*[;]\s*(${NUM})$`)) ??
    t.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/) ??
    // dipisah spasi saja (boleh desimal koma)
    t.match(new RegExp(String.raw`^(${NUM})\s+(${NUM})$`))
  if (!m) return null
  const a = parseCoordinateInput(m[1])
  const b = parseCoordinateInput(m[2])
  return a.valid && b.valid && a.value !== null && b.value !== null ? [a.value, b.value] : null
}
