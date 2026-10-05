/**
 * Nilai awal & payload API untuk KeluargaForm — satu jalur untuk semua halaman yang memakai form ini
 * (daftar Keluarga, Detail Keluarga), agar pemetaan tidak terduplikasi dan tidak saling menyimpang.
 */

/** Bentuk data KK dari API (hanya field yang dipakai form) */
type Keluarga = Record<string, any>

export function keluargaToFormDefaults(k: Keluarga) {
  return {
    dataStatus: k.dataStatus,
    kelompokId: k.kelompokId,
    kepalakeluargaId: k.kepalakeluargaId,
    alamat: k.alamat,
    rt: k.rt,
    rw: k.rw,
    kelurahan: k.kelurahan,
    kecamatan: k.kecamatan,
    kota: k.kota,
    kodePos: k.kodePos,
    teleponRumah: k.teleponRumah,
    catatan: k.catatan,
  }
}

/** String kosong → null (kolom kosong menyimpan NULL, bukan ''), field lain apa adanya */
export function buildKeluargaPayload(formData: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v]))
}
