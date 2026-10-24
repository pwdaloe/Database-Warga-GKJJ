import QRCode from 'qrcode'
import { STATUS_KEANGGOTAAN_LABEL } from './kartuWhatsapp'
import { STATUS_KEANGGOTAAN_HEX } from './statusKeanggotaan'
import { tautanKartu } from './kartuUrl'

const STATUS_KEANGGOTAAN_COLOR = STATUS_KEANGGOTAAN_HEX
export const STATUS_KK_LABEL: Record<string, string> = {
  KEPALA: 'Kepala KK', ISTRI: 'Istri', ANAK: 'Anak',
  MENANTU: 'Menantu', CUCU: 'Cucu', LAINNYA: 'Lainnya',
}

export function avatarInitial(nama: string) {
  return nama.trim().charAt(0).toUpperCase()
}

// ── ID Card HTML untuk cetak ─────────────────────────────────

export function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function buildIdCardHtml(w: any, origin: string): Promise<string> {
  const kelompok = w.keluarga?.kelompok
  const wilayah = kelompok?.wilayah
  const penatua = kelompok?.penatua_nama_temp ?? null
  const statusColor = STATUS_KEANGGOTAAN_COLOR[w.statusKeanggotaan] ?? '#6b7280'
  const statusLabel = STATUS_KEANGGOTAAN_LABEL[w.statusKeanggotaan] ?? w.statusKeanggotaan
  const validasiDate = (w.dataStatus === 'AKTIF' || w.dataStatus === 'VALIDASI') && w.updatedAt
    ? formatTanggal(w.updatedAt) : null
  const initial = avatarInitial(w.namaLengkap)
  const avatarBg = w.jenisKelamin === 'L' ? '#3b82f6' : '#ec4899'
  const nomorTampil = w.nomorInduk || w.nomorAnggota || '—'
  const avatarHtml = w.fotoUrl
    ? `<img src="${w.fotoUrl}" style="width:52px;height:64px;border-radius:5px;object-fit:cover;flex-shrink:0;" />`
    : `<div class="avatar">${initial}</div>`
  // QR memakai token acak, bukan id berurutan. Tanpa token valid, QR tidak dibuat (bukan jatuh ke id).
  const memberUrl = tautanKartu(origin, w)
  const qrDataUrl = memberUrl
    ? await QRCode.toDataURL(memberUrl, { width: 70, margin: 0, color: { dark: '#1e3a5f', light: '#ffffff' } })
    : null

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Kartu Anggota – ${w.namaLengkap}</title>
<style>
  @page { size: 90mm 72mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { width: 85.6mm; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
  .header { background: #1e3a5f; color: white; padding: 6px 10px; display: flex; align-items: center; gap: 7px; }
  .logo-box { width: 26px; height: 26px; border-radius: 5px; background: white; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo-box img { width: 24px; height: 24px; object-fit: contain; }
  .header-title { font-size: 8.5px; font-weight: 700; letter-spacing: .6px; }
  .header-sub { font-size: 6.5px; opacity: .75; margin-top: 1px; }
  .body { padding: 8px 10px; display: flex; gap: 8px; }
  .avatar { width: 52px; height: 64px; border-radius: 5px; background: ${avatarBg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .nama { font-size: 11px; font-weight: 700; color: #111; line-height: 1.3; }
  .panggilan { font-size: 8.5px; color: #6b7280; font-style: italic; }
  .nomor { font-size: 8px; font-weight: 600; color: #4f46e5; margin-top: 2px; letter-spacing: .4px; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 4px 0; }
  .row { font-size: 7px; color: #374151; line-height: 1.7; display: flex; gap: 4px; }
  .row-label { color: #9ca3af; min-width: 40px; flex-shrink: 0; }
  .status-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${statusColor}; margin-right: 3px; vertical-align: middle; }
  .qr-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px; padding-top: 4px; }
  .qr-col img { width: 56px; height: 56px; }
  .qr-label { font-size: 5.5px; color: #9ca3af; text-align: center; line-height: 1.4; }
  .footer { background: #f8fafc; border-top: 1px solid #e5e7eb; padding: 4px 10px; display: flex; gap: 8px; align-items: center; }
  .badge { font-size: 6.5px; padding: 1.5px 5px; border-radius: 20px; font-weight: 600; }
  .badge-on  { background: #dbeafe; color: #1d4ed8; }
  .badge-off { background: #f1f5f9; color: #94a3b8; }
  .badge-sidi-on { background: #ede9fe; color: #6d28d9; }
  @media print { body { background: white; } .card { box-shadow: none; } }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo-box"><img src="${origin}/logo-gkj.jpg" /></div>
    <div>
      <div class="header-title">Jemaat GKJJ</div>
      <div class="header-sub">Gereja Kristen Jawa Jakarta</div>
    </div>
    <div style="margin-left:auto;font-size:6px;opacity:.6;text-align:right;">Kartu<br>Anggota</div>
  </div>
  <div class="body">
    ${avatarHtml}
    <div class="info">
      <div class="nama">${w.namaLengkap}</div>
      ${w.namaPanggilan ? `<div class="panggilan">"${w.namaPanggilan}"</div>` : ''}
      <div class="nomor">${nomorTampil}</div>
      <hr class="divider">
      <div class="row"><span class="row-label">Kelompok</span><span>${kelompok?.nama ?? '—'}</span></div>
      <div class="row"><span class="row-label">Wilayah</span><span>${wilayah?.nama ?? '—'}</span></div>
      ${penatua ? `<div class="row"><span class="row-label">Penatua</span><span>${penatua}</span></div>` : ''}
      <div class="row"><span class="row-label">Status</span><span><span class="status-dot"></span>${statusLabel}</span></div>
      ${validasiDate ? `<div class="row"><span class="row-label">Validasi</span><span>${validasiDate}</span></div>` : ''}
    </div>
    <div class="qr-col">
      ${qrDataUrl
        ? `<img src="${qrDataUrl}" /><span class="qr-label">Scan kartu<br>digital</span>`
        : `<span class="qr-label">QR belum<br>tersedia</span>`}
    </div>
  </div>
  <div class="footer">
    <span class="badge ${w.sudahBaptis ? 'badge-on' : 'badge-off'}">✓ Baptis</span>
    <span class="badge ${w.sudahSidi ? 'badge-sidi-on' : 'badge-off'}">✓ Sidi</span>
    <span style="margin-left:auto;font-size:6.5px;color:#cbd5e1;">${STATUS_KK_LABEL[w.statusKeluarga] ?? ''}</span>
  </div>
</div>
<script>window.onload = () => { window.print() }</script>
</body>
</html>`
}

