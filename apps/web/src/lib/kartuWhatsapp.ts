export const STATUS_KEANGGOTAAN_LABEL: Record<string, string> = {
  AKTIF: 'Aktif', NON_AKTIF: 'Non Aktif', KATEKUMEN: 'Katekumen',
  PINDAH_KELUAR: 'Pindah Keluar', MENINGGAL: 'Meninggal',
}

export function buildWhatsAppMessage(warga: any): string {
  const kelompok = warga.keluarga?.kelompok
  const wilayah = kelompok?.wilayah
  const nomorTampil = warga.nomorInduk || warga.nomorAnggota || '-'
  const memberUrl = `${window.location.origin}/m/${warga.id}`
  return [
    `Halo ${warga.namaPanggilan || warga.namaLengkap}! 🙏`,
    '',
    `Berikut data keanggotaan Anda di *Jemaat GKJJ*:`,
    '',
    `📋 *Nama:* ${warga.namaLengkap}`,
    `🔢 *No. Induk/Anggota:* ${nomorTampil}`,
    `🏘️ *Kelompok:* ${kelompok?.nama ?? '-'}${wilayah ? ' · ' + wilayah.nama : ''}`,
    `✅ *Status:* ${STATUS_KEANGGOTAAN_LABEL[warga.statusKeanggotaan] ?? warga.statusKeanggotaan}`,
    `${warga.sudahBaptis ? '✓' : '✗'} Baptis   ${warga.sudahSidi ? '✓' : '✗'} Sidi`,
    '',
    `🪪 Kartu digital: ${memberUrl}`,
    '',
    `Untuk informasi lebih lanjut hubungi kantor gereja. ✝️`,
  ].join('\n')
}

export function kirimWhatsApp(warga: any): void {
  const raw = (warga.whatsapp || warga.telepon || '').replace(/\D/g, '')
  const phone = raw.startsWith('0') ? '62' + raw.slice(1) : raw

  if (!phone) {
    alert('Nomor WhatsApp / telepon belum terdaftar untuk anggota ini.')
    return
  }

  const msg = buildWhatsAppMessage(warga)
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
}
