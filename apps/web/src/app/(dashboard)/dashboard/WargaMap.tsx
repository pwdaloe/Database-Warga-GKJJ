'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons (Next.js webpack issue)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLOR: Record<string, string> = {
  AKTIF: '#16a34a', NON_AKTIF: '#6b7280', KATEKUMEN: '#2563eb',
  PINDAH_KELUAR: '#ea580c', MENINGGAL: '#dc2626',
}

function makeIcon(status: string) {
  const color = STATUS_COLOR[status] ?? '#6b7280'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="36">
    <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="8" r="3" fill="white"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  })
}

// Auto-fit bounds when data changes
function FitBounds({ points }: { points: Array<{ latitude: number; longitude: number }> }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, points])
  return null
}

interface Point {
  id: number
  namaLengkap: string
  nomorAnggota: string | null
  latitude: number
  longitude: number
  statusKeanggotaan: string
  keluarga: { kelurahan: string | null; kelompok: { nama: string } | null } | null
}

export default function WargaMap({ points }: { points: Point[] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 420 }}>
      <MapContainer
        center={[-6.2088, 106.8456]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 0 && <FitBounds points={points} />}
        {points.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makeIcon(p.statusKeanggotaan)}>
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold text-gray-800">{p.namaLengkap}</p>
                {p.nomorAnggota && <p className="text-xs text-gray-400 font-mono">{p.nomorAnggota}</p>}
                {p.keluarga?.kelompok && (
                  <p className="text-xs text-gray-600 mt-1">{p.keluarga.kelompok.nama}</p>
                )}
                {p.keluarga?.kelurahan && (
                  <p className="text-xs text-gray-500">{p.keluarga.kelurahan}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {points.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(249,250,251,0.85)', fontSize: 14, color: '#6b7280',
            pointerEvents: 'none',
          }}>
            Belum ada warga dengan koordinat rumah terdaftar
          </div>
        )}
      </MapContainer>
    </div>
  )
}
