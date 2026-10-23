import { Loader2 } from 'lucide-react'
import type { Demografi } from '@/hooks/useDashboard'

const fmt = (n: number) => n.toLocaleString('id-ID')
const fmtPersen = (n: number) => `${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`

export function DemografiCard({ data, isLoading }: { data?: Demografi; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6" data-testid="demografi-card">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800">Komposisi Pria / Wanita</h2>
        <p className="text-xs text-gray-400 mt-0.5">Hanya anggota berstatus aktif</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24 text-gray-400 gap-2">
          <Loader2 size={18} className="animate-spin" /> Memuat data...
        </div>
      ) : !data || data.total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Belum ada data warga aktif</p>
      ) : (
        <>
          <div
            className="flex h-6 w-full overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={`Pria ${fmtPersen(data.persenPria)}, Wanita ${fmtPersen(data.persenWanita)}`}
          >
            <div className="bg-blue-500" style={{ width: `${data.persenPria}%` }} />
            <div className="bg-pink-500" style={{ width: `${data.persenWanita}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Pria
              </div>
              <p className="text-2xl font-bold text-gray-800" data-testid="demografi-pria">{fmt(data.pria)}</p>
              <p className="text-sm text-gray-500">{fmtPersen(data.persenPria)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Wanita
              </div>
              <p className="text-2xl font-bold text-gray-800" data-testid="demografi-wanita">{fmt(data.wanita)}</p>
              <p className="text-sm text-gray-500">{fmtPersen(data.persenWanita)}</p>
            </div>
          </div>
          <p className="mt-3 pt-3 border-t text-xs text-gray-400">Total {fmt(data.total)} warga aktif</p>
        </>
      )}
    </div>
  )
}
