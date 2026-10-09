'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats, useDashboardSebaran, useDashboardTerbaru } from '@/hooks/useDashboard'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { useKomisiStats, useDashboardMap, useMasterKelurahan } from '@/hooks/usePengaturan'
import { ROLE_LABELS } from '@/lib/auth'
import { Users, Home, AlertCircle, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

// Leaflet harus di-load client-side saja (no SSR)
const WargaMap = dynamic(() => import('./WargaMap'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-52 sm:h-64 bg-gray-50 rounded-xl border text-gray-400 gap-2">
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
  const [wilayahId, setWilayahId] = useState<number | undefined>()
  const [kelompokId, setKelompokId] = useState<number | undefined>()
  const filter = { wilayahId, kelompokId }
  const { data: wilayahList = [] } = useWilayahKelompok()
  const { data: stats, isLoading: statsLoading } = useDashboardStats(filter)
  const { data: sebaran = [], isLoading: sebaranLoading } = useDashboardSebaran(filter)
  const { data: terbaru = [], isLoading: terbaruLoading } = useDashboardTerbaru(filter)
  const { data: komisiStats = [], isLoading: komisiLoading } = useKomisiStats(filter)
  const { data: kelurahanList = [] } = useMasterKelurahan()
  const [selectedKelurahan, setSelectedKelurahan] = useState('')
  const { data: mapData = [] } = useDashboardMap(selectedKelurahan || undefined, filter)

  // Penatua Kelompok sudah dibatasi ke satu kelompok — filter tidak relevan
  const showFilter = !stats?.kelompok
  const kelompokOptions = wilayahId
    ? wilayahList.find((w) => w.id === wilayahId)?.kelompoks ?? []
    : wilayahList.flatMap((w) => w.kelompoks)

  // Daftar kelurahan unik dari master
  const kecamatanList = [...new Set(kelurahanList.map((k) => k.kecamatan))].sort()

  const statCards: Array<{
    label: string
    value: number | undefined
    icon: React.ElementType
    color: string
    onClick?: () => void
    highlight?: boolean
    hidden?: boolean
  }> = [
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
      value: stats?.kelompokAktif,
      icon: MapPin,
      color: 'bg-purple-500',
      // Jumlah kelompok hanya relevan untuk yang melihat seluruh jemaat
      hidden: !!stats?.kelompok || !!kelompokId,
    },
    {
      label: 'Perlu Divalidasi',
      value: stats?.wargaDraft,
      icon: AlertCircle,
      color: stats?.wargaDraft ? 'bg-orange-500' : 'bg-gray-400',
      onClick: () => router.push('/warga?dataStatus=DRAFT'),
      highlight: !!(stats?.wargaDraft && stats.wargaDraft > 0),
    },
  ].filter((c) => !c.hidden)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
          Selamat datang, {user?.warga?.namaLengkap ?? user?.nama}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {ROLE_LABELS[user?.role ?? '']} · Database Warga Jemaat GKJJ
        </p>
        {stats?.kelompok && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium">
            <MapPin size={11} />
            Data kelompok Anda: {stats.kelompok.kode} · {stats.kelompok.nama}
          </span>
        )}
      </div>

      {/* Filter dashboard */}
      {showFilter && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <select
            value={wilayahId ?? ''}
            onChange={(e) => {
              setWilayahId(e.target.value ? Number(e.target.value) : undefined)
              setKelompokId(undefined)
            }}
            className="py-3 sm:py-2 px-3 rounded-lg border border-gray-300 text-base sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Semua Wilayah</option>
            {wilayahList.map((w) => <option key={w.id} value={w.id}>{w.kode} · {w.nama}</option>)}
          </select>
          <select
            value={kelompokId ?? ''}
            onChange={(e) => setKelompokId(e.target.value ? Number(e.target.value) : undefined)}
            className="py-3 sm:py-2 px-3 rounded-lg border border-gray-300 text-base sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Semua Kelompok</option>
            {kelompokOptions.map((k) => <option key={k.id} value={k.id}>{k.kode} · {k.nama}</option>)}
          </select>
          {(wilayahId || kelompokId) && (
            <button
              onClick={() => { setWilayahId(undefined); setKelompokId(undefined) }}
              className="text-xs text-brand-600 hover:underline py-2 text-left"
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5',
        statCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
      )}>
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={card.onClick}
            className={cn(
              'bg-white rounded-xl shadow-sm border p-4 sm:p-5 transition',
              card.onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300',
              card.highlight && 'ring-2 ring-orange-300 border-orange-200',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 min-w-0">{card.label}</p>
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

      {/* ── Sebaran jemaat per wilayah & kelompok (kelompok kosong disembunyikan) ── */}
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800">Sebaran Jemaat per Wilayah &amp; Kelompok</h2>
          <p className="text-xs text-gray-400 mt-0.5">Hanya kelompok yang sudah memiliki warga</p>
        </div>
        {sebaranLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Memuat data...
          </div>
        ) : sebaran.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada data warga per kelompok</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sebaran.map((w) => (
              <div key={w.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-2.5 border-b">
                  <p className="font-medium text-gray-800 text-sm min-w-0 break-words">
                    {w.kode} · {w.nama}
                  </p>
                  <p className="text-sm text-gray-600 shrink-0">
                    <span className="font-bold text-gray-900">{w.jumlahWarga.toLocaleString('id-ID')}</span> warga
                    <span className="text-gray-400"> · {w.jumlahKeluarga.toLocaleString('id-ID')} KK</span>
                  </p>
                </div>
                {w.kelompok.length === 0 ? (
                  <p className="text-xs text-gray-400 px-4 py-3">Belum ada kelompok dengan warga</p>
                ) : (
                  <ul className="divide-y">
                    {w.kelompok.map((k) => (
                      <li key={k.id}>
                        <button
                          onClick={() => router.push(`/warga?kelompokId=${k.id}`)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="text-gray-700 min-w-0 break-words">{k.kode} · {k.nama}</span>
                          <span className="shrink-0 text-gray-600">
                            <span className="font-semibold text-gray-900">{k.jumlahWarga.toLocaleString('id-ID')}</span> warga
                            <span className="text-gray-400"> · {k.jumlahKeluarga.toLocaleString('id-ID')} KK</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5 warga terakhir dientry ── */}
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800">Jemaat Baru Dientry</h2>
          <p className="text-xs text-gray-400 mt-0.5">5 data warga terakhir</p>
        </div>
        {terbaruLoading ? (
          <div className="flex items-center justify-center h-24 text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Memuat data...
          </div>
        ) : terbaru.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada data warga</p>
        ) : (
          <ul className="divide-y">
            {terbaru.map((w) => (
              <li key={w.id}>
                <button
                  onClick={() => router.push(`/warga/${w.id}`)}
                  className="w-full text-left py-3 hover:bg-gray-50 px-1 rounded"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900 text-sm min-w-0 break-words">{w.namaLengkap}</p>
                    <p className="text-xs text-gray-400 shrink-0">
                      {new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 break-words">
                    {w.kelompok ? `${w.kelompok.kode} · ${w.kelompok.nama}` : 'Belum ada kelompok'}
                    {w.wilayah && ` · Wilayah ${w.wilayah.nama}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Majelis: {w.majelis ?? '—'}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Chart distribusi komisi ──────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800">Distribusi Jemaat per Komisi</h2>
            <p className="text-xs text-gray-400 mt-0.5">Berdasarkan usia anggota aktif</p>
          </div>
          <button
            onClick={() => router.push('/pengaturan')}
            className="text-xs text-brand-600 hover:underline shrink-0 py-2"
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
          <div className="w-full h-56 sm:h-64">
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

      {/* ── Peta warga (koordinat rumah disembunyikan untuk VIEWER — kebijakan PDP) ── */}
      {user?.role !== 'VIEWER' && (
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800">Peta Lokasi Warga</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mapData.length > 0
                ? `${mapData.length} titik lokasi`
                : 'Hanya warga yang sudah memiliki koordinat rumah yang tampil'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <select
              value={selectedKelurahan}
              onChange={(e) => setSelectedKelurahan(e.target.value)}
              className="w-full sm:w-auto py-3 sm:py-2 px-3 rounded-lg border border-gray-300 text-base sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
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
      )}
    </div>
  )
}
