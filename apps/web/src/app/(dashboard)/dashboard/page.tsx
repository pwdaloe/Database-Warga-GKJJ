'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useKomisiStats, useDashboardMap, useMasterKelurahan } from '@/hooks/usePengaturan'
import { ROLE_LABELS } from '@/lib/auth'
import { Users, Home, AlertCircle, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

// Leaflet harus di-load client-side saja (no SSR)
const WargaMap = dynamic(() => import('./WargaMap'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border text-gray-400 gap-2">
    <Loader2 size={18} className="animate-spin" /> Memuat peta...
  </div>
)})

// ── Custom tooltip chart ─────────────────────────────────────
function KomisiTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const label = d.maxUsia != null ? `${d.minUsia}–${d.maxUsia} tahun` : `≥ ${d.minUsia} tahun`
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-800">{d.nama}</p>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: d.warna }}>{d.jumlah} orang</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: komisiStats = [], isLoading: komisiLoading } = useKomisiStats()
  const { data: kelurahanList = [] } = useMasterKelurahan()
  const [selectedKelurahan, setSelectedKelurahan] = useState('')
  const { data: mapData = [] } = useDashboardMap(selectedKelurahan || undefined)

  // Daftar kelurahan unik dari master
  const kecamatanList = [...new Set(kelurahanList.map((k) => k.kecamatan))].sort()

  const statCards = [
    {
      label: 'Total Warga',
      value: stats?.totalWarga,
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => router.push('/warga'),
    },
    {
      label: 'Total Keluarga',
      value: stats?.totalKeluarga,
      icon: Home,
      color: 'bg-green-500',
      onClick: () => router.push('/keluarga'),
    },
    {
      label: 'Kelompok Aktif',
      value: 22,
      icon: MapPin,
      color: 'bg-purple-500',
    },
    {
      label: 'Perlu Divalidasi',
      value: stats?.wargaDraft,
      icon: AlertCircle,
      color: stats?.wargaDraft ? 'bg-orange-500' : 'bg-gray-400',
      onClick: () => router.push('/warga?dataStatus=DRAFT'),
      highlight: !!(stats?.wargaDraft && stats.wargaDraft > 0),
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.warga?.namaLengkap ?? user?.nama}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {ROLE_LABELS[user?.role ?? '']} · Database Warga Jemaat GKJJ
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={card.onClick}
            className={cn(
              'bg-white rounded-xl shadow-sm border p-5 transition',
              card.onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300',
              card.highlight && 'ring-2 ring-orange-300 border-orange-200',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{card.label}</p>
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            {statsLoading && card.value === undefined ? (
              <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <p className={cn('text-3xl font-bold', card.highlight ? 'text-orange-600' : 'text-gray-900')}>
                {card.value?.toLocaleString('id-ID') ?? '—'}
              </p>
            )}
            {card.highlight && <p className="text-xs text-orange-500 mt-1">Data status Draft</p>}
          </div>
        ))}
      </div>

      {/* ── Chart distribusi komisi ──────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-800">Distribusi Jemaat per Komisi</h2>
            <p className="text-xs text-gray-400 mt-0.5">Berdasarkan usia anggota aktif</p>
          </div>
          <button
            onClick={() => router.push('/pengaturan')}
            className="text-xs text-brand-600 hover:underline"
          >
            Atur rentang umur →
          </button>
        </div>

        {komisiLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Memuat data...
          </div>
        ) : komisiStats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Belum ada data komisi</p>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={komisiStats} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="nama"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v) => v.replace('Komisi ', '')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<KomisiTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {komisiStats.map((entry) => (
                    <Cell key={entry.id} fill={entry.warna} />
                  ))}
                  <LabelList dataKey="jumlah" position="top" style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legenda */}
        {komisiStats.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
            {komisiStats.map((k) => (
              <div key={k.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: k.warna }} />
                {k.nama.replace('Komisi ', '')}
                <span className="text-gray-400">
                  ({k.maxUsia != null ? `${k.minUsia}–${k.maxUsia} th` : `≥${k.minUsia} th`})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Peta warga ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">Peta Lokasi Warga</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mapData.length > 0
                ? `${mapData.length} titik lokasi`
                : 'Hanya warga yang sudah memiliki koordinat rumah yang tampil'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedKelurahan}
              onChange={(e) => setSelectedKelurahan(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Semua Kelurahan</option>
              {kecamatanList.map((kec) => (
                <optgroup key={kec} label={kec}>
                  {kelurahanList
                    .filter((k) => k.kecamatan === kec)
                    .map((k) => (
                      <option key={k.id} value={k.nama}>{k.nama}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <WargaMap points={mapData} />
      </div>
    </div>
  )
}
