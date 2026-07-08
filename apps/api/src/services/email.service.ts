import nodemailer from 'nodemailer'

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true })
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export async function sendPasswordResetEmail(to: string, nama: string, resetLink: string) {
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? 'GKJJ <no-reply@gkjjakarta.org>',
    to,
    subject: 'Reset Password — Database Warga GKJJ',
    text: `Halo ${nama},\n\nKlik link berikut untuk reset password Anda (berlaku 30 menit):\n${resetLink}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
    html: `<p>Halo ${nama},</p><p>Klik link berikut untuk reset password Anda (berlaku 30 menit):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Jika Anda tidak meminta ini, abaikan email ini.</p>`,
  })
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV EMAIL] Reset link untuk ${to}: ${resetLink}`)
  }
  return info
}

export async function sendSuratPerpindahanEmail(
  to: string,
  namaWarga: string,
  jenisLabel: string,
  pdfBuffer: Buffer,
) {
  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? 'GKJJ <no-reply@gkjjakarta.org>',
    to,
    subject: `Surat ${jenisLabel} — Database Warga GKJJ`,
    text: `Halo ${namaWarga},\n\nTerlampir surat ${jenisLabel.toLowerCase()} Anda. Simpan email ini sebagai arsip.`,
    html: `<p>Halo ${namaWarga},</p><p>Terlampir surat ${jenisLabel.toLowerCase()} Anda. Simpan email ini sebagai arsip.</p>`,
    attachments: [
      { filename: `surat-${jenisLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
    ],
  })
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV EMAIL] Surat ${jenisLabel} untuk ${to} (attachment ${pdfBuffer.length} bytes, tidak benar-benar terkirim)`)
  }
  return info
}
