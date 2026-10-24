import { formatTanggal } from '@/lib/format'
import type { Tahun } from '@/lib/tipe'
import { Pemberitahuan } from './ui'

/** Status jendela pengajuan, selalu terlihat agar pengurus tahu kapan bisa mengubah. */
export function BannerPengajuan({ tahun }: { tahun: Pick<Tahun, 'statusPengajuan' | 'rencanaBuka' | 'rencanaTutup' | 'praMukerTanggal' | 'mukerTanggal'> }) {
  if (tahun.statusPengajuan === 'DIBUKA') {
    return (
      <Pemberitahuan nada="hijau" judul="Pengajuan sedang dibuka">
        {tahun.rencanaTutup ? `Rencana ditutup ${formatTanggal(tahun.rencanaTutup)}. ` : ''}
        {tahun.praMukerTanggal ? `Pra-muker ${formatTanggal(tahun.praMukerTanggal)}` : ''}
        {tahun.mukerTanggal ? `, muker ${formatTanggal(tahun.mukerTanggal)}.` : ''}
      </Pemberitahuan>
    )
  }
  if (tahun.statusPengajuan === 'DITUTUP') {
    return <Pemberitahuan nada="kuning" judul="Pengajuan sudah ditutup">Program tidak dapat diubah. Hubungi sekretariat bila ada perbaikan mendesak.</Pemberitahuan>
  }
  return (
    <Pemberitahuan nada="biru" judul="Pengajuan belum dibuka">
      {tahun.rencanaBuka ? `Rencana dibuka ${formatTanggal(tahun.rencanaBuka)}. ` : ''}Anda sudah dapat melihat daftar program; pengisian dimulai setelah dibuka oleh sekretariat.
    </Pemberitahuan>
  )
}
