/**
 * Susun payload API dari data WargaForm — satu jalur untuk semua pemanggil form
 * (daftar Warga, Detail Warga, dll.) agar perilakunya sama.
 */

type Keluarga = {
  alamat?: string | null; rt?: string | null; rw?: string | null
  kelurahan?: string | null; kecamatan?: string | null; kota?: string | null
  kodePos?: string | null; teleponRumah?: string | null
} | null | undefined

/** Nilai awal blok "Alamat Rumah Tangga (KK)" dari data KK yang tersimpan */
export function alamatKeluargaDefaults(keluarga: Keluarga) {
  return {
    newAlamat: keluarga?.alamat ?? '',
    newRt: keluarga?.rt ?? '',
    newRw: keluarga?.rw ?? '',
    newKelurahan: keluarga?.kelurahan ?? '',
    newKecamatan: keluarga?.kecamatan ?? '',
    newKota: keluarga?.kota ?? '',
    newKodePos: keluarga?.kodePos ?? '',
    newTeleponRumah: keluarga?.teleponRumah ?? '',
  }
}

export function buildWargaPayload(formData: Record<string, any>): Record<string, any> {
  const {
    newKelompokId, newAlamat, newRt, newRw, newKelurahan,
    newKecamatan, newKota, newKodePos, newTeleponRumah,
    ...wargaFields
  } = formData

  const sanitized: Record<string, any> = Object.fromEntries(
    Object.entries(wargaFields).map(([k, v]) => [k, v === '' ? null : v]),
  )

  const alamat = {
    alamat: newAlamat || null,
    rt: newRt || null,
    rw: newRw || null,
    kelurahan: newKelurahan || null,
    kecamatan: newKecamatan || null,
    kota: newKota || null,
    kodePos: newKodePos || null,
    teleponRumah: newTeleponRumah || null,
  }

  const isKepala = sanitized.statusKeluarga === 'KEPALA'
  const punyaKeluarga = !!sanitized.keluargaId

  return {
    ...sanitized,
    // Kepala baru tanpa KK → buat KK baru beserta alamatnya
    ...(isKepala && !punyaKeluarga && newKelompokId
      ? { newKeluarga: { kelompokId: newKelompokId, ...alamat } }
      : {}),
    // Kepala yang sudah punya KK → perbarui alamat KK-nya
    ...(isKepala && punyaKeluarga ? { alamatKeluarga: alamat } : {}),
  }
}

const tgl = (v?: string | null) => (v ? v.split('T')[0] : v)

/** Nilai awal WargaForm dari data warga di server (dipakai semua halaman yang membuka form edit) */
export function wargaToFormDefaults(w: Record<string, any>) {
  return {
    dataStatus: w.dataStatus,
    keluargaId: w.keluargaId,
    nomorInduk: w.nomorInduk,
    namaLengkap: w.namaLengkap,
    namaPanggilan: w.namaPanggilan,
    jenisKelamin: w.jenisKelamin,
    tempatLahir: w.tempatLahir,
    tanggalLahir: tgl(w.tanggalLahir),
    nik: w.nik,
    golonganDarah: w.golonganDarah,
    statusKeluarga: w.statusKeluarga,
    statusKeanggotaan: w.statusKeanggotaan,
    sudahBaptis: w.sudahBaptis,
    tanggalBaptis: tgl(w.tanggalBaptis),
    tempatBaptis: w.tempatBaptis,
    sudahSidi: w.sudahSidi,
    nomorSidi: w.nomorSidi,
    tanggalSidi: tgl(w.tanggalSidi),
    telepon: w.telepon,
    whatsapp: w.whatsapp,
    email: w.email,
    pendidikanTerakhir: w.pendidikanTerakhir,
    pekerjaan: w.pekerjaan,
    fotoUrl: w.fotoUrl,
    alamatKtp: w.alamatKtp,
    alamatDomisili: w.alamatDomisili,
    latitude: w.latitude,
    longitude: w.longitude,
    catatan: w.catatan,
    konsenPDP: w.konsenPDP,
    ...alamatKeluargaDefaults(w.keluarga),
  }
}
