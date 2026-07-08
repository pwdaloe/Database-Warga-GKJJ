import PDFDocument from 'pdfkit'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { PerpindahanWithRelations } from './perpindahan.service.js'

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  KEPALA_KANTOR: 'Kepala Kantor',
  MAJELIS: 'Majelis',
  STAF_ADMIN: 'Staf Administrasi',
  PENATUA_KELOMPOK: 'Penatua Kelompok',
  VIEWER: 'Viewer',
}

const JUDUL_SURAT: Record<string, string> = {
  MASUK: 'SURAT KETERANGAN PINDAH MASUK JEMAAT',
  KELUAR: 'SURAT KETERANGAN PINDAH KELUAR JEMAAT',
  MENINGGAL: 'SURAT KETERANGAN KEMATIAN',
}

function formatTanggalIndonesia(date: Date | null): string {
  return date ? format(date, 'd MMMM yyyy', { locale: localeId }) : '-'
}

function signatureLine(nama: string | undefined, role: string | undefined, tanggal: Date | null): string {
  if (!nama) return '_______________'
  const jabatan = role ? (ROLE_LABELS[role] ?? role) : ''
  return `${nama}, ${jabatan}, pada ${formatTanggalIndonesia(tanggal)}`
}

export async function generateSuratPerpindahanPdf(perpindahan: PerpindahanWithRelations): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  // Kop surat
  doc.fontSize(14).font('Helvetica-Bold').text('GEREJA KRISTEN JAWA JAKARTA (GKJJ)', { align: 'center' })
  doc.fontSize(10).font('Helvetica').text('Alamat gereja belum tersedia — placeholder kop surat', { align: 'center' })
  doc.moveDown(0.5)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(1)

  // Judul
  const judul = JUDUL_SURAT[perpindahan.jenis] ?? 'SURAT KETERANGAN PERPINDAHAN JEMAAT'
  doc.fontSize(13).font('Helvetica-Bold').text(judul, { align: 'center', underline: true })
  doc.moveDown(1)

  doc.fontSize(11).font('Helvetica')
  doc.text(`Nomor Surat: ${perpindahan.nomorSurat ?? '-'}`)
  doc.text(`Tanggal Perpindahan: ${formatTanggalIndonesia(perpindahan.tanggalPerpindahan)}`)
  doc.moveDown(1)

  // Isi
  doc.text('Yang bertanda tangan di bawah ini menerangkan bahwa:')
  doc.moveDown(0.5)
  doc.text(`Nama Lengkap       : ${perpindahan.warga.namaLengkap}`)
  doc.text(`Nomor Anggota/Induk: ${perpindahan.warga.nomorAnggota ?? perpindahan.warga.nomorInduk ?? '-'}`)
  doc.text(`Jenis Perpindahan  : ${perpindahan.jenis}`)
  doc.text(`Gereja Asal/Tujuan : ${perpindahan.gerejaAsalTujuan ?? '-'}`)
  if (perpindahan.keterangan) {
    doc.moveDown(0.5)
    doc.text(`Keterangan: ${perpindahan.keterangan}`)
  }
  doc.moveDown(2)

  // Tanda tangan
  doc.text(`Disetujui oleh: ${signatureLine(perpindahan.approvedByUser?.nama, perpindahan.approvedByUser?.role, perpindahan.approvedAt)}`)
  doc.moveDown(1)
  doc.text(`Divalidasi oleh: ${signatureLine(perpindahan.validatedByUser?.nama, perpindahan.validatedByUser?.role, perpindahan.validatedAt)}`)

  doc.end()

  return done
}
