// Daftar periksa sebelum mengajukan (Arahan Penyusunan RKA 2027, slide 14). Satu sumber untuk API dan web.
export const CHECKLIST_AJUKAN = [
  { kode: 'identitas', label: 'Nama program dan UPK penanggung jawab jelas.' },
  { kode: 'kebutuhan', label: 'Latar belakang menjelaskan kebutuhan, bukan hanya keinginan.' },
  { kode: 'selaras', label: 'Tujuan selaras dengan visi–misi dan mandat bidang.' },
  { kode: 'sasaran', label: 'Sasaran/penerima manfaat teridentifikasi.' },
  { kode: 'realistis', label: 'Kegiatan, jadwal, dan PIC realistis.' },
  { kode: 'indikator', label: 'Indikator dan bukti keberhasilan dapat diperiksa.' },
  { kode: 'anggaran', label: 'Anggaran diturunkan dari kebutuhan nyata dengan dasar hitung jelas.' },
  { kode: 'risiko', label: 'Risiko, koordinasi, dan dukungan yang diperlukan dipertimbangkan.' },
  { kode: 'evaluasi', label: 'Rencana evaluasi dan pelaporan sudah ditetapkan.' },
] as const

export type KodeChecklist = (typeof CHECKLIST_AJUKAN)[number]['kode']
export const KODE_CHECKLIST: readonly string[] = CHECKLIST_AJUKAN.map((c) => c.kode)
