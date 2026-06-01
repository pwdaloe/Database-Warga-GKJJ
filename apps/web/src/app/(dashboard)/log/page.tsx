'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  Activity, RefreshCw, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Loader2, Filter,
} from 'lucide-react'
import { useActivityLogs, useLogMutations, type ActivityLogEntry } from '@/hooks/useLogs'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

// ── Badge warna per HTTP status ───────────────────────────────
function StatusBadge({ code }: { code: number }) {
  if (code < 300) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> {code}
    </span>
  )
  if (code < 500) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
      <AlertCircle size={11} /> {code}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
      <XCircle size={11} /> {code}
    </span>
  )
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    POST:   'bg-blue-100 text-blue-700',
    PUT:    'bg-yellow-100 text-yellow-700',
    PATCH:  'bg-purple-100 text-purple-700',
    DELETE: 'bg-red-100 text-red-600',
    GET:    'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded font-mono', colors[method] ?? 'bg-gray-100 text-gray-600')}>
      {method}
    </span>
  )
}

// ── Row expandable ─────────────────────────────────────────────
function LogRow({ entry }: { entry: ActivityLogEntry }) {
  const [open, setOpen] = useState(false)
  const isError = entry.statusCode >= 400

  return (
    <>
      <tr
        className={cn(
          'hover:bg-gray-50 transition cursor-pointer',
          isError && 'bg-red-50/40 hover:bg-red-50',
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">
          {format(new Date(entry.createdAt), 'd MMM HH:mm:ss', { locale: localeId })}
        </td>
        <td className="px-4 py-2.5">
          <MethodBadge method={entry.method} />
        </td>
        <td className="px-4 py-2.5 text-xs font-mono text-gray-700 max-w-[200px] truncate">
          {entry.path}
        </td>
        <td className="px-4 py-2.5">
          <StatusBadge code={entry.statusCode} />
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[280px]">
          {isError && entry.errorMessage ? (
            <span className="text-red-600 font-medium">{entry.errorMessage}</span>
          ) : (
            <span className="text-gray-400 italic">—</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-500">
          {entry.userNama ?? <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-400 text-right font-mono">
          {entry.durasiMs != null ? `${entry.durasiMs}ms` : '—'}
        </td>
        <td className="px-3 py-2.5 text-gray-400">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
      </tr>
      {open && (
        <tr className={cn('border-b', isError ? 'bg-red-50' : 'bg-gray-50')}>
          <td colSpan={8} className="px-6 py-3">
            <div className="space-y-2">
              <div className="flex gap-6 text-xs text-gray-500">
                <span><span className="font-medium text-gray-700">ID:</span> {entry.id}</span>
                <span><span className="font-medium text-gray-700">IP:</span> {entry.ipAddress ?? '—'}</span>
                <span><span className="font-medium text-gray-700">User ID:</span> {entry.userId ?? '—'}</span>
              </div>
              {entry.bodySnapshot && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Request Body Snapshot:</p>
                  <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700 max-h-48">
                    {JSON.stringify(entry.bodySnapshot, null, 2)}
                  </pre>
                </div>
              )}
              {isError && entry.errorMessage && (
                <div className="flex items-start gap-2 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
                  <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{entry.errorMessage}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function LogPage() {
  const [status, setStatus]   = useState<'all' | 'success' | 'error'>('all')
  const [pathFilter, setPath] = useState('')
  const [page, setPage]       = useState(1)
  const [confirmPurge, setConfirmPurge] = useState(false)

  const { data, isLoading, refetch, isFetching } = useActivityLogs({
    status, path: pathFilter || undefined, page, limit: 50,
  })
  const { purge } = useLogMutations()

  const entries = data?.data ?? []
  const meta    = data?.meta

  const errorCount   = entries.filter((e) => e.statusCode >= 400).length
  const successCount = entries.filter((e) => e.statusCode < 400).length

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Activity size={22} className="text-gray-500" />
            Log Aktivitas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta ? `${meta.total.toLocaleString('id-ID')} entri` : 'Memuat...'} · auto-refresh tiap 30 detik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setConfirmPurge(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 size={14} /> Bersihkan Log
          </button>
        </div>
      </div>

      {/* Filter + stats */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {([
            { v: 'all',     label: `Semua` },
            { v: 'error',   label: `Error`, count: meta?.total },
            { v: 'success', label: 'Sukses' },
          ] as const).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => { setStatus(v); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition',
                status === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={pathFilter}
            onChange={(e) => { setPath(e.target.value); setPage(1) }}
            placeholder="Filter path (mis. /warga)"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {entries.length > 0 && (
          <div className="flex gap-3 text-xs text-gray-500 ml-auto">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={12} /> {successCount} sukses
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle size={12} /> {errorCount} error
            </span>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Memuat log...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Activity size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Belum ada log aktivitas</p>
            <p className="text-xs mt-1">Log akan muncul setelah ada operasi tulis (POST/PUT/PATCH/DELETE)</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">Waktu</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Method</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Path</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Pesan Error</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Pengguna</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Durasi</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <LogRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onChange={setPage}
          />
        )}
      </div>

      {/* Modal bersihkan log */}
      {confirmPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Bersihkan Log Lama</h3>
            <p className="text-sm text-gray-600">
              Hapus semua log yang lebih lama dari 90 hari? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmPurge(false)}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={async () => {
                  await purge.mutateAsync(90)
                  setConfirmPurge(false)
                }}
                disabled={purge.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg"
              >
                {purge.isPending && <Loader2 size={14} className="animate-spin" />}
                Hapus Log &gt; 90 Hari
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
