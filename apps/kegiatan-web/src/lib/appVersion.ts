/**
 * Versi (kode commit) yang tertanam di bundle ini, diisi `deploy/3-deploy-kegiatan.sh` lewat NEXT_PUBLIC_APP_VERSION.
 * Di mesin dev bernilai 'dev' sehingga bar "versi baru" tidak pernah muncul.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev'

export interface StatusSistem {
  pemeliharaan: { aktif: boolean; pesan: string | null }
  commit: string | null
}

export type StatusBar = 'pemeliharaan' | 'versi-baru' | null

/**
 * - pemeliharaan: deploy sedang berlangsung (penanda di server)
 * - versi-baru: commit di server berbeda dengan yang tertanam di halaman ini, atau file JS gagal dimuat
 *   (tanda khas tab lama setelah deploy)
 * Status tidak diketahui (belum ada respons / gagal) → tidak menampilkan apa pun.
 */
export function turunkanStatusBar(status: StatusSistem | null, versiBundle: string, galatChunk = false): StatusBar {
  if (status?.pemeliharaan?.aktif) return 'pemeliharaan'
  if (galatChunk) return 'versi-baru'
  if (status?.commit && versiBundle !== 'dev' && status.commit !== versiBundle) return 'versi-baru'
  return null
}

/** Pola galat saat file JS lama sudah tidak ada di server setelah deploy. */
export function galatMemuatChunk(nilai: unknown): boolean {
  const teks = typeof nilai === 'string' ? nilai : `${(nilai as { name?: string })?.name ?? ''} ${(nilai as { message?: string })?.message ?? ''}`
  return /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(teks)
}
