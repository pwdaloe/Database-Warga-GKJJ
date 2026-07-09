const JENIS_LABEL: Record<string, string> = {
  MASUK: 'Pindah Masuk', KELUAR: 'Pindah Keluar', MENINGGAL: 'Keterangan Kematian',
}

export function buildPerpindahanWhatsAppMessage(perpindahan: any): string {
  const jenis = JENIS_LABEL[perpindahan.jenis] ?? perpindahan.jenis
  return [
    `Halo ${perpindahan.warga?.namaPanggilan || perpindahan.warga?.namaLengkap}! 🙏`,
    '',
    `Berikut ringkasan surat *${jenis}* Anda dari *Jemaat GKJJ*:`,
    '',
    `📋 *Nama:* ${perpindahan.warga?.namaLengkap}`,
    `📄 *Jenis:* ${jenis}`,
    `🔢 *Nomor Surat:* ${perpindahan.nomorSurat || '-'}`,
    `🏛️ *Gereja Asal/Tujuan:* ${perpindahan.gerejaAsalTujuan || '-'}`,
    '',
    `Surat lengkap (PDF) akan dikirim menyusul via email, atau dapat diambil langsung di kantor gereja. ✝️`,
  ].join('\n')
}

export function kirimPerpindahanWhatsApp(perpindahan: any): void {
  const raw = (perpindahan.warga?.whatsapp || perpindahan.warga?.telepon || '').replace(/\D/g, '')
  const phone = raw.startsWith('0') ? '62' + raw.slice(1) : raw
  if (!phone) {
    alert('Nomor WhatsApp / telepon belum terdaftar untuk warga ini.')
    return
  }
  const msg = buildPerpindahanWhatsAppMessage(perpindahan)
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
}
