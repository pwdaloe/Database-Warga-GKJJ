import type { Dukungan } from './tipe'

/** Isi {nama} dan {unit}; placeholder yang tidak dikenal dibiarkan apa adanya. */
export function isiPesan(templat: string, konteks: { nama: string; unit: string | null }): string {
  return templat.replace(/\{nama\}/g, konteks.nama).replace(/\{unit\}/g, konteks.unit ?? 'tanpa unit')
}

/** Tautan wa.me ke pusat bantuan, atau null bila dukungan nonaktif/nomor tidak valid. */
export function tautanDukungan(d: Dukungan | null | undefined, konteks: { nama: string; unit: string | null }): string | null {
  if (!d || !d.aktif || !d.nomor || !/^62\d{8,13}$/.test(d.nomor)) return null
  return `https://wa.me/${d.nomor}?text=${encodeURIComponent(isiPesan(d.pesan, konteks))}`
}
