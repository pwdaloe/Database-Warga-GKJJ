import { Loader2 } from 'lucide-react'
import type { KualitasData } from '@/hooks/useDashboard'

const fmt = (n: number) => n.toLocaleString('id-ID')
const persen = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10)

const TAHAP = [
  { key: 'draft', label: 'Draft', hint: 'Menunggu verifikasi staf', warna: 'bg-orange-400' },
  { key: 'validasi', label: 'Validasi', hint: 'Menunggu persetujuan', warna: 'bg-yellow-400' },
  { key: 'aktif', label: 'Aktif', hint: 'Data final', warna: 'bg-green-500' },
  { key: 'tidakAktif', label: 'Tidak Aktif', hint: 'Dinonaktifkan', warna: 'bg-gray-400' },
] as const

const KELENGKAPAN = [
  { key: 'tanpaNik', label: 'Belum ada NIK' },
  { key: 'tanpaKontak', label: 'Belum ada telepon / WhatsApp' },
  { key: 'tanpaAlamat', label: 'Belum ada alamat' },
  { key: 'tanpaKoordinat', label: 'Belum ada koordinat rumah' },
  { key: 'tanpaTanggalLahir', label: 'Belum ada tanggal lahir' },
  { key: 'tanpaKeluarga', label: 'Belum masuk KK' },
] as const

export function KualitasDataCard({ data, isLoading }: { data?: KualitasData; isLoading: boolean }) {
  const totalDokumen = data ? data.corong.draft + data.corong.validasi + data.corong.aktif + data.corong.tidakAktif : 0
  const totalAktif = data?.kelengkapan.totalAktif ?? 0

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6" data-testid="kualitas-data-card">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-800">Kualitas &amp; Progres Data</h2>
        <p className="text-xs text-gray-400 mt-0.5">Tahap validasi seluruh warga tercatat; kelengkapan hanya anggota aktif</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24 text-gray-400 gap-2">
          <Loader2 size={18} className="animate-spin" /> Memuat data...
        </div>
      ) : !data || totalDokumen === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Belum ada data warga</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tahap validasi dokumen</h3>
            <div
              className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100"
              role="img"
              aria-label={TAHAP.map((t) => `${t.label} ${fmt(data.corong[t.key])}`).join(', ')}
            >
              {TAHAP.map((t) => (
                <div key={t.key} className={t.warna} style={{ width: `${persen(data.corong[t.key], totalDokumen)}%` }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {TAHAP.map((t) => (
                <li key={t.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.warna}`} />
                    <span className="text-gray-700">{t.label}</span>
                    <span className="text-xs text-gray-400 truncate">{t.hint}</span>
                  </span>
                  <span className="font-semibold text-gray-800 shrink-0" data-testid={`corong-${t.key}`}>
                    {fmt(data.corong[t.key])}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{persen(data.corong[t.key], totalDokumen).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Kelengkapan data anggota aktif ({fmt(totalAktif)})</h3>
            {totalAktif === 0 ? (
              <p className="text-sm text-gray-400">Belum ada anggota aktif</p>
            ) : (
              <ul className="space-y-3">
                {KELENGKAPAN.map((k) => {
                  const n = data.kelengkapan[k.key]
                  const p = persen(n, totalAktif)
                  return (
                    <li key={k.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{k.label}</span>
                        <span className="font-semibold text-gray-800" data-testid={`lengkap-${k.key}`}>
                          {fmt(n)}
                          <span className="ml-1.5 text-xs font-normal text-gray-400">{p.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className={n === 0 ? 'bg-green-500' : 'bg-orange-400'} style={{ width: `${p}%`, height: '100%' }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
