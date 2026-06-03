'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2, RotateCcw, Search, Filter, Loader2,
  ShieldCheck, Users, AlertCircle, ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useWargaList } from '@/hooks/useWarga'
import { useValidasiMutations } from '@/hooks/useValidasiWarga'
import { useWilayahKelompok } from '@/hooks/useKeluarga'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type Tab = 'draft' | 'aktif'

const VALIDATOR_ROLES = new Set(['SUPERADMIN', 'KEPALA_KANTOR', 'STAF_ADMIN'])

export default function ValidasiDataPage() {
  const { user } = useAuth()
  const canValidate = user ? VALIDATOR_ROLES.has(user.role) : false

  const [tab, setTab]               = useState<Tab>('draft')
  const [search, setSearch]         = useState('')
  const [wilayahId, setWilayahId]   = useState<number | ''>('')
  const [kelompokId, setKelompokId] = useState<number | ''>('')
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage]             = useState(1)
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{ action: 'validate' | 'revert'; ids: number[] } | null>(null)

  const { data: wilayahData } = useWilayahKelompok()

  const kelompokList = useMemo(() => {
    if (!wilayahId || !wilayahData) return []
    return wilayahData.find((w) => w.id === Number(wilayahId))?.kelompoks ?? []
  }, [wilayahId, wilayahData])

  const filter = {
    page,
    limit: 20,
    search: search || undefined,
    wilayahId: wilayahId ? Number(wilayahId) : undefined,
    kelompokId: kelompokId ? Number(kelompokId) : undefined,
    dataStatus: tab === 'draft' ? 'DRAFT' : 'AKTIF',
  }

  const { data, isLoading } = useWargaList(filter)
  const { bulkStatus } = useValidasiMutations()

  const wargas = data?.data ?? []
  const meta   = data?.meta
  const allIds = wargas.map((w: any) => w.id)
  const allSelected = allIds.length > 0 && allIds.every((id: number) => selected.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        allIds.forEach((id: number) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]))
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetFilter() {
    setWilayahId('')
    setKelompokId('')
    setSearch('')
    setPage(1)
    setSelected(new Set())
  }

  async function execBulk(action: 'validate' | 'revert', ids: number[]) {
    await bulkStatus.mutateAsync({ ids, action })
    setSelected(new Set())
    setConfirmAction(null)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-brand-600" />
            Validasi Data
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Verifikasi data warga sebelum dianggap aktif dalam sistem
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'draft', label: 'Perlu Validasi' },
          { key: 'aktif', label: 'Sudah Divalidasi' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); setSelected(new Set()) }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
            {t.key === 'draft' && meta && tab === 'draft' && (
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {meta.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search & Filter ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama, nomor anggota..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {user?.role !== 'PENATUA_KELOMPOK' && (
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors',
              showFilter ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            )}
          >
            <Filter size={14} />
            Filter
            <ChevronDown size={13} className={cn('transition-transform', showFilter && 'rotate-180')} />
          </button>
        )}
      </div>

      {showFilter && user?.role !== 'PENATUA_KELOMPOK' && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <select
            value={wilayahId}
            onChange={(e) => { setWilayahId(e.target.value ? Number(e.target.value) : ''); setKelompokId(''); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Semua Wilayah</option>
            {wilayahData?.map((w) => (
              <option key={w.id} value={w.id}>{w.kode} — {w.nama}</option>
            ))}
          </select>
          <select
            value={kelompokId}
            onChange={(e) => { setKelompokId(e.target.value ? Number(e.target.value) : ''); setPage(1) }}
            disabled={!wilayahId}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white disabled:opacity-50"
          >
            <option value="">Semua Kelompok</option>
            {kelompokList.map((k) => (
              <option key={k.id} value={k.id}>{k.kode} — {k.nama}</option>
            ))}
          </select>
          <button onClick={resetFilter} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline">
            Reset
          </button>
        </div>
      )}

      {/* ── Bulk action bar ─────────────────────────────────────── */}
      {canValidate && selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl">
          <span className="text-sm font-medium text-brand-800">
            {selected.size} data dipilih
          </span>
          <div className="flex-1" />
          {tab === 'draft' && (
            <button
              onClick={() => setConfirmAction({ action: 'validate', ids: [...selected] })}
              disabled={bulkStatus.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              Validasi Terpilih ({selected.size})
            </button>
          )}
          {tab === 'aktif' && (
            <button
              onClick={() => setConfirmAction({ action: 'revert', ids: [...selected] })}
              disabled={bulkStatus.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Batalkan Validasi ({selected.size})
            </button>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 text-sm text-brand-600 hover:text-brand-800"
          >
            Batal
          </button>
        </div>
      )}

      {/* ── Tabel ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : wargas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={32} className="mb-2 opacity-40" />
            <p className="text-sm">
              {tab === 'draft' ? 'Tidak ada data Draft' : 'Belum ada data yang divalidasi'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {canValidate && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Warga</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kelompok</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Diinput</th>
                {tab === 'aktif' && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Divalidasi</th>
                )}
                {canValidate && (
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {wargas.map((w: any) => {
                const kelompok = w.keluarga?.kelompok
                return (
                  <tr key={w.id} className={cn('hover:bg-gray-50', selected.has(w.id) && 'bg-brand-50')}>
                    {canValidate && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(w.id)}
                          onChange={() => toggleOne(w.id)}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 leading-tight">{w.namaLengkap}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{w.nomorAnggota ?? w.nomorInduk ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {kelompok ? (
                        <div>
                          <div className="text-gray-700">{kelompok.kode} — {kelompok.nama}</div>
                          <div className="text-xs text-gray-400">{kelompok.wilayah?.nama}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-600 text-xs">
                        {format(new Date(w.createdAt), 'd MMM yyyy', { locale: localeId })}
                      </div>
                    </td>
                    {tab === 'aktif' && (
                      <td className="px-4 py-3">
                        {w.validatedAt ? (
                          <div>
                            <div className="text-xs font-medium text-green-700">
                              {w.validatedByUser?.nama ?? '—'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {format(new Date(w.validatedAt), 'd MMM yyyy, HH:mm', { locale: localeId })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    )}
                    {canValidate && (
                      <td className="px-4 py-3 text-right">
                        {tab === 'draft' ? (
                          <button
                            onClick={() => setConfirmAction({ action: 'validate', ids: [w.id] })}
                            disabled={bulkStatus.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} />
                            Validasi
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ action: 'revert', ids: [w.id] })}
                            disabled={bulkStatus.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-50"
                          >
                            <RotateCcw size={12} />
                            Batalkan
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(p) => { setPage(p); setSelected(new Set()) }}
        />
      )}

      {/* ── Dialog konfirmasi ───────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                confirmAction.action === 'validate' ? 'bg-green-100' : 'bg-orange-100',
              )}>
                {confirmAction.action === 'validate'
                  ? <CheckCircle2 size={18} className="text-green-600" />
                  : <AlertCircle size={18} className="text-orange-500" />
                }
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {confirmAction.action === 'validate' ? 'Konfirmasi Validasi' : 'Batalkan Validasi'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {confirmAction.action === 'validate'
                    ? `${confirmAction.ids.length} data warga akan diubah statusnya menjadi Aktif.`
                    : `${confirmAction.ids.length} data warga akan dikembalikan ke status Draft.`
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={bulkStatus.isPending}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => execBulk(confirmAction.action, confirmAction.ids)}
                disabled={bulkStatus.isPending}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50',
                  confirmAction.action === 'validate' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600',
                )}
              >
                {bulkStatus.isPending && <Loader2 size={13} className="animate-spin" />}
                {confirmAction.action === 'validate' ? 'Ya, Validasi' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
