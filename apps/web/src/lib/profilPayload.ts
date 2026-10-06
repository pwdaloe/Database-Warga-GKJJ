/**
 * Profil Saya (role Jemaat): satu jalur nilai awal form ⇄ payload API.
 * Server memakai whitelist `.strict()` — payload hanya boleh memuat field di bawah ini.
 */

export interface ProfilData {
  namaLengkap: string; nomorAnggota: string | null; jenisKelamin: string; statusKeluarga: string
  namaPanggilan: string | null; tempatLahir: string | null; tanggalLahir: string | null
  nikMasker: string | null; golonganDarah: string | null
  telepon: string | null; whatsapp: string | null; whatsappBolehDitampilkan: boolean
  email: string | null; pendidikanTerakhir: string | null; pekerjaan: string | null
  alamatKtp: string | null; alamatDomisili: string | null; catatanJemaat: string | null
  alamatKeluarga: AlamatKeluarga | null
  bolehUbahAlamatKeluarga: boolean
  menungguVerifikasi: boolean
}

export interface AlamatKeluarga {
  alamat: string | null; rt: string | null; rw: string | null; kelurahan: string | null
  kecamatan: string | null; kota: string | null; kodePos: string | null; teleponRumah: string | null
}

export interface ProfilForm {
  namaPanggilan: string; tempatLahir: string; tanggalLahir: string; nik: string; golonganDarah: string
  telepon: string; whatsapp: string; whatsappBolehDitampilkan: boolean; email: string
  pendidikanTerakhir: string; pekerjaan: string; catatanJemaat: string
  alamatKtp: string; domisiliBerbeda: boolean; alamatDomisili: string
  kk: Record<keyof AlamatKeluarga, string>
}

const s = (v: string | null | undefined) => v ?? ''
const KK_FIELDS: (keyof AlamatKeluarga)[] = ['alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kota', 'kodePos', 'teleponRumah']

export function profilToFormDefaults(p: ProfilData): ProfilForm {
  return {
    namaPanggilan: s(p.namaPanggilan), tempatLahir: s(p.tempatLahir), tanggalLahir: s(p.tanggalLahir),
    nik: '', // NIK tidak pernah dimuat utuh; kosong = tidak diubah
    golonganDarah: s(p.golonganDarah),
    telepon: s(p.telepon), whatsapp: s(p.whatsapp), whatsappBolehDitampilkan: p.whatsappBolehDitampilkan, email: s(p.email),
    pendidikanTerakhir: s(p.pendidikanTerakhir), pekerjaan: s(p.pekerjaan), catatanJemaat: s(p.catatanJemaat),
    alamatKtp: s(p.alamatKtp), domisiliBerbeda: !!p.alamatDomisili, alamatDomisili: s(p.alamatDomisili),
    kk: Object.fromEntries(KK_FIELDS.map((k) => [k, s(p.alamatKeluarga?.[k])])) as ProfilForm['kk'],
  }
}

const n = (v: string) => (v.trim() === '' ? null : v.trim())

export function buildProfilPayload(f: ProfilForm, bolehUbahAlamatKeluarga: boolean): Record<string, unknown> {
  return {
    namaPanggilan: n(f.namaPanggilan), tempatLahir: n(f.tempatLahir), tanggalLahir: n(f.tanggalLahir),
    ...(f.nik.trim() ? { nik: f.nik.trim() } : {}),
    golonganDarah: n(f.golonganDarah),
    telepon: n(f.telepon), whatsapp: n(f.whatsapp), whatsappBolehDitampilkan: f.whatsappBolehDitampilkan, email: n(f.email),
    pendidikanTerakhir: n(f.pendidikanTerakhir), pekerjaan: n(f.pekerjaan), catatanJemaat: n(f.catatanJemaat),
    alamatKtp: n(f.alamatKtp),
    // Tidak dicentang "berbeda dengan alamat KTP" → domisili dikosongkan
    alamatDomisili: f.domisiliBerbeda ? n(f.alamatDomisili) : null,
    ...(bolehUbahAlamatKeluarga
      ? { alamatKeluarga: Object.fromEntries(KK_FIELDS.map((k) => [k, n(f.kk[k])])) }
      : {}),
  }
}
