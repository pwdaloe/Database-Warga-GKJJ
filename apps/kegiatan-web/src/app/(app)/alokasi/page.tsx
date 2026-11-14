'use client'

import { useAuth } from '@/hooks/useAuth'
import { useDashboard, useMaster } from '@/hooks/useData'
import { Memuat, Pemberitahuan } from '@/components/ui'
import { AlokasiBidang } from '@/components/AlokasiBidang'
import { BannerPengajuan } from '@/components/BannerPengajuan'

export default function HalamanAlokasi() {
  const { user, adalah } = useAuth()
  const master = useMaster()
  const dash = useDashboard()
  if (master.isLoading || dash.isLoading || !user) return <Memuat />
  if (!adalah('KOORDINATOR_BIDANG')) return <Pemberitahuan nada="kuning">Halaman ini untuk ketua bidang. Admin dan sekretariat mengatur pagu dan alokasi di Master data, Struktur & anggaran.</Pemberitahuan>
  if (!user.bidangId) return <Pemberitahuan nada="merah">Akun Anda belum terhubung ke bidang. Hubungi sekretariat.</Pemberitahuan>
  if (master.isError || !master.data) return <Pemberitahuan nada="merah">Tidak dapat memuat data master.</Pemberitahuan>
  const m = master.data

  return (
    <div className="space-y-4">
      <BannerPengajuan tahun={m.tahun} />
      <div>
        <h1 className="text-lg font-bold text-marine-900 sm:text-xl">Alokasi bidang</h1>
        <p className="text-sm text-gray-500">{m.tahun.nama}. Bagi pagu bidang ke UPK sebagai panduan saat pra-muker; batas yang mengikat adalah pagu bidang.</p>
      </div>
      <AlokasiBidang key={m.tahun.id} master={m} dashboard={dash.data} bidangId={user.bidangId} />
    </div>
  )
}
