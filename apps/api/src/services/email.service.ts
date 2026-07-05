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
