export type Peran = 'ADMIN' | 'SEKRETARIAT' | 'KOORDINATOR_BIDANG' | 'PENGURUS_UPK' | 'MAJELIS'
export type StatusPengajuan = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP'
export type StatusProgram = 'DRAFT' | 'DIAJUKAN'
export type KategoriWaktu = 'SEKALI' | 'PERIODE' | 'RENTANG' | 'TAHUN'
export type JenisSumberDana = 'GEREJA' | 'SWADAYA' | 'PENGGALANGAN' | 'DONASI'
export type JenisProgram = 'BARU' | 'LANJUTAN' | 'GABUNGAN'
export type StatusPagu = 'BELUM_MENGAJUKAN' | 'UNDER' | 'OVER' | 'SESUAI'

export interface UnitRingkas {
  id: number
  kode: string
  nama: string
  singkatan: string | null
  bidangId: number
  jenis: 'UPK' | 'POS'
}

export interface Pengguna {
  id: number
  username: string
  nama: string
  email: string | null
  whatsapp: string | null
  peran: Peran
  unitId: number | null
  bidangId: number | null
  wajibGantiPassword: boolean
  unit: UnitRingkas | null
  bidang: { id: number; kode: string; nama: string } | null
}

export interface Tahun {
  id: number
  tahun: number
  nama: string
  statusPengajuan: StatusPengajuan
  rencanaBuka: string | null
  rencanaTutup: string | null
  praMukerTanggal: string | null
  mukerTanggal: string | null
  aktif: boolean
}

export interface PengurusBph {
  id: number
  unitId: number
  jabatan: 'KETUA' | 'SEKRETARIS' | 'BENDAHARA'
  nama: string
  whatsapp: string | null
  email: string | null
  aktif: boolean
  isContoh: boolean
}

export interface UnitMaster extends UnitRingkas {
  alias: string[]
  urutan: number
  aktif: boolean
  pagu: number | null
  pengurus?: PengurusBph[]
}

export interface Acuan {
  id: number
  tahunId: number
  jenis: 'VISI' | 'MISI' | 'SASARAN'
  kode: string
  nama: string
  deskripsi: string | null
  parentId: number | null
  urutan: number
  aktif: boolean
}

export interface Master {
  tahun: Tahun
  tahunList: Tahun[]
  bidang: Array<{ id: number; kode: string; nama: string; urutan: number }>
  unit: UnitMaster[]
  satuan: Array<{ id: number; nama: string; urutan: number; aktif: boolean }>
  kategoriBiaya: Array<{ id: number; nama: string; urutan: number; aktif: boolean }>
  acuan: Acuan[]
  program2026: Array<{ id: number; unitId: number; nama: string; kategori: 'A' | 'B' | 'C' | 'D'; bersyarat: boolean; rekomendasi: string | null }>
  checklist: Array<{ kode: string; label: string }>
  enum: { kategoriWaktu: KategoriWaktu[]; sumberDana: JenisSumberDana[]; jenisProgram: JenisProgram[] }
}

export interface ProgramRingkas {
  id: number
  nomor: string | null
  judul: string
  unit: UnitRingkas
  status: StatusProgram
  jenisProgram: JenisProgram
  totalRab: number
  gereja: number
  mandiri: number
  selisih: number
  jumlahKegiatan: number
  diajukanPada: string | null
  updatedAt: string
  isContoh: boolean
}

export interface ProgramDetail {
  id: number
  nomor: string | null
  tahun: { id: number; tahun: number; nama: string; statusPengajuan: StatusPengajuan }
  unit: UnitRingkas
  judul: string
  jenisProgram: JenisProgram
  program2026Id: number | null
  latarBelakang: string | null
  kebutuhan: string | null
  tujuan: string | null
  sasaranPenerima: string | null
  targetPeserta: number | null
  evaluasi: string | null
  picNama: string | null
  picWhatsapp: string | null
  checklist: Record<string, boolean>
  status: StatusProgram
  diajukanPada: string | null
  isContoh: boolean
  updatedAt: string
  acuanIds: number[]
  jadwal: Array<{ id: number; nama: string; kategoriWaktu: KategoriWaktu; tanggalMulai: string | null; tanggalSelesai: string | null; keteranganPeriode: string | null; lokasi: string | null; hasilLangsung: string | null }>
  indikator: Array<{ id: number; indikator: string; target: string; bukti: string }>
  rab: Array<{ id: number; kategoriId: number | null; kategori: string | null; uraian: string; perhitungan: string | null; volume: number; satuan: string; hargaSatuan: number; jumlah: number }>
  sumberDana: Array<{ jenis: JenisSumberDana; nilai: number; keterangan: string | null }>
  totalRab: number
  totalSumberDana: number
  selisih: number
  gereja: number
  mandiri: number
}

export interface BarisDashboardUnit {
  unitId: number
  kode: string
  nama: string
  singkatan: string | null
  jenis: 'UPK' | 'POS'
  bidangId: number
  pagu: number
  pengajuan: number
  draft: number
  tersedia: number
  status: StatusPagu
  jumlahDiajukan: number
  jumlahDraft: number
  gereja: number
  mandiri: number
}

export interface Dashboard {
  tahun: Pick<Tahun, 'id' | 'tahun' | 'nama' | 'statusPengajuan'>
  unit: BarisDashboardUnit[]
  bidang: Array<{ bidangId: number; kode: string; nama: string; jumlahUnit: number; pagu: number; pengajuan: number; tersedia: number; gereja: number; mandiri: number }>
  acuan: Array<{ acuanId: number; kode: string; nama: string; jenis: string; jumlahProgram: number; totalRabTerkait: number }>
  total: { pagu: number; pengajuan: number; draft: number; gereja: number; mandiri: number; jumlahDiajukan: number; jumlahDraft: number; tersedia: number; rasioKemandirian: number | null }
  ringkasStatus: Record<StatusPagu, number>
}
