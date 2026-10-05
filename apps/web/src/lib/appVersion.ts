/**
 * Versi aplikasi untuk deteksi "versi baru tersedia".
 * NEXT_PUBLIC_APP_VERSION (git SHA) ditanam saat build oleh deploy/2-deploy.sh;
 * di mesin dev bernilai 'dev' sehingga bar versi baru tidak pernah muncul.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev'

export interface SystemStatus {
  maintenance: boolean
  message: string | null
  version: string | null
}

export type BannerState = 'maintenance' | 'new-version' | null

/**
 * - maintenance: deploy sedang berlangsung (flag di server)
 * - new-version: versi di server berbeda dengan versi yang tertanam di halaman ini,
 *   atau chunk JS gagal dimuat (tanda khas tab lama setelah deploy)
 * Status tidak diketahui (belum ada respons / gagal fetch) → tidak menampilkan apa pun.
 */
export function deriveBannerState(
  status: SystemStatus | null,
  appVersion: string,
  chunkError = false,
): BannerState {
  if (status?.maintenance) return 'maintenance'
  if (chunkError) return 'new-version'
  if (status?.version && appVersion !== 'dev' && status.version !== appVersion) return 'new-version'
  return null
}

/** Pola error yang muncul saat file JS lama sudah tidak ada di server setelah deploy */
export function isChunkLoadError(value: unknown): boolean {
  const text =
    typeof value === 'string'
      ? value
      : `${(value as any)?.name ?? ''} ${(value as any)?.message ?? ''}`
  return /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(text)
}
