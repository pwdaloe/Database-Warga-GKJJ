'use client'

import { Loader2, MessageCircle, Phone, Users, UserRound, Church } from 'lucide-react'
import { useHubungi, type KontakItem } from '@/hooks/useHubungi'

function Kartu({ judul, icon: Icon, children }: { judul: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border shadow-sm">
      <h2 className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b font-semibold text-gray-900">
        <Icon size={18} className="text-brand-600" /> {judul}
      </h2>
      <div className="divide-y">{children}</div>
    </section>
  )
}

function Baris({ k, badge }: { k: KontakItem; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {k.nama}
          {badge && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{badge}</span>}
        </p>
        {k.keterangan && <p className="text-xs text-gray-500 truncate">{k.keterangan}</p>}
      </div>
      <a href={k.link} target="_blank" rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-2 min-h-11 sm:min-h-0 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
        <MessageCircle size={16} /> Chat WhatsApp
      </a>
    </div>
  )
}

const Kosong = ({ teks }: { teks: string }) => <p className="px-4 sm:px-5 py-4 text-sm text-gray-400">{teks}</p>

export default function HubungiPage() {
  const { data, isLoading } = useHubungi()
  if (isLoading || !data) return <div className="p-8 text-center text-gray-400"><Loader2 className="animate-spin inline" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Phone size={22} className="text-gray-500" /> Hubungi
        </h1>
        <p className="text-gray-500 text-sm mt-1">Ketuk tombol untuk langsung membuka WhatsApp.</p>
      </div>

      <Kartu judul="GKJ WhatsApp Center" icon={MessageCircle}>
        {data.waCenter.length ? data.waCenter.map((k, i) => <Baris key={i} k={k} />) : <Kosong teks="Belum tersedia." />}
      </Kartu>

      <Kartu judul="Majelis Kelompok" icon={Users}>
        {data.majelis
          ? <Baris k={data.majelis} />
          : <Kosong teks="Kontak majelis kelompok Anda belum tersedia. Silakan hubungi GKJ WhatsApp Center." />}
      </Kartu>

      <Kartu judul="Kepala Kantor" icon={UserRound}>
        {data.kepalaKantor.length ? data.kepalaKantor.map((k, i) => <Baris key={i} k={k} />) : <Kosong teks="Belum tersedia." />}
      </Kartu>

      <Kartu judul="Pendeta" icon={Church}>
        {data.pendeta.length
          ? data.pendeta.map((k, i) => <Baris key={i} k={k} badge={k.emeritus ? 'Emeritus' : undefined} />)
          : <Kosong teks="Belum tersedia." />}
      </Kartu>
    </div>
  )
}
