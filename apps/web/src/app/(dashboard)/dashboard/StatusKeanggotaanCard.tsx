import { Loader2 } from 'lucide-react'
import type { StatusKeanggotaanData, StatusKeanggotaanKey } from '@/hooks/useDashboard'

const fmt = (n: number) => n.toLocaleString('id-ID')

const LABEL: Record<StatusKeanggotaanKey, { label: string; warna: string }> = {
  AKTIF: { label: 'Aktif', warna: 'bg-green-500' },
  NON_AKTIF: { label: 'Non-aktif', warna: 'bg-gray-400' },
  KATEKUMEN: { label: 'Katekumen', warna: 'bg-blue-400' },
  PINDAH_KELUAR: { label: 'Pindah keluar', warna: 'bg-orange-400' },
  MENINGGAL: { label: 'Meninggal', warna: 'bg-slate-600' },
}

export function StatusKeanggotaanCard({ data, isLoading }: { data?: StatusKeanggotaanData; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6" data-testid="status-keanggotaan-card">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800">Status Keanggotaan</h2>
        <p className="text-xs text-gray-400 mt-0.5">Seluruh warga tercatat</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24 text-gray-400 gap-2">
          <Loader2 size={18} className="animate-spin" /> Memuat data...
        </div>
      ) : !data || data.total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Belum ada data warga</p>
      ) : (
        <>
          <div
            className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={data.data.map((d) => `${LABEL[d.status].label} ${fmt(d.jumlah)}`).join(', ')}
          >
            {data.data.map((d) => (
              <div key={d.status} className={LABEL[d.status].warna} style={{ width: `${(d.jumlah / data.total) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {data.data.map((d) => (
              <li key={d.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${LABEL[d.status].warna}`} />
                  <span className="text-gray-700">{LABEL[d.status].label}</span>
                </span>
                <span className="font-semibold text-gray-800" data-testid={`status-${d.status}`}>
                  {fmt(d.jumlah)}
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    {((d.jumlah / data.total) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 pt-3 border-t text-xs text-gray-400">Total {fmt(data.total)} warga tercatat</p>
        </>
      )}
    </div>
  )
}
