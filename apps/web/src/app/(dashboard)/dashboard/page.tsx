'use client'

import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/auth'
import { Users, Home, MapPin, TrendingUp } from 'lucide-react'

const STAT_CARDS = [
  { label: 'Total Warga', value: '—', icon: Users, color: 'bg-blue-500' },
  { label: 'Total Keluarga', value: '—', icon: Home, color: 'bg-green-500' },
  { label: 'Kelompok Aktif', value: '22', icon: MapPin, color: 'bg-purple-500' },
  { label: 'Warga Baru (bulan ini)', value: '—', icon: TrendingUp, color: 'bg-orange-500' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.warga?.namaLengkap ?? user?.nama} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {ROLE_LABELS[user?.role ?? '']} · Database Warga Jemaat GKJJ
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{card.label}</p>
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder konten */}
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Statistik & grafik akan tampil di sini</p>
        <p className="text-sm mt-1">Setelah data warga diimport</p>
      </div>
    </div>
  )
}
