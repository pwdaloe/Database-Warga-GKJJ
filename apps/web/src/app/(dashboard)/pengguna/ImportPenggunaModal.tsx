'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useQueryClient } from '@tanstack/react-query'
import {
  Upload, Loader2, CheckCircle2, XCircle, Download, FileSpreadsheet, AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/auth'
import { cn } from '@/lib/utils'

const ROLES = ['SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER']

type ParsedRow = {
  rowIndex: number
  namaLengkap: string
  username: string
  email: string
  password: string
  role: string
  kelompokKode: string
}

type ResultLog = {
  baris: number; status: 'berhasil' | 'gagal'
  nama: string; username?: string; alasan?: string
}

function normUsername(v: string) {
  return v.trim().toLowerCase().replace(/\s*-\s*/g, '.').replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '')
}

function validateRow(r: ParsedRow): string[] {
  const errs: string[] = []
  if (r.namaLengkap.trim().length < 2) errs.push('Nama lengkap wajib diisi')
  if (normUsername(r.username).length < 3) errs.push('Username tidak valid')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) errs.push('Email tidak valid')
  if (r.password.length < 8) errs.push('Password minimal 8 karakter')
  if (!ROLES.includes(r.role.trim().toUpperCase())) errs.push('Role tidak valid')
  return errs
}

async function downloadTemplate() {
  let kelompokRows: string[][] = []
  try {
    const res = await api.get('/kelompok')
    const list: any[] = res.data.data ?? []
    kelompokRows = list.map((k) => [k.kode ?? '', k.nama ?? '', k.wilayah?.nama ?? '', k.penatua_nama_temp ?? '-'])
  } catch {
    kelompokRows = [['(Gagal mengambil data kelompok dari server)', '', '', '']]
  }

  const headers = ['Nama Lengkap *', 'Username *', 'Email *', 'Password *', 'Role *', 'Kode Kelompok']
  const sample1 = ['Rama Wicaksana', 'rama.wicaksana', 'rama.wicaksana@gkjj.org', 'GantiPass123!', 'PENATUA_KELOMPOK', 'A1']
  const sample2 = ['Siti Aminah', 'siti.aminah', 'siti.aminah@gkjj.org', 'GantiPass123!', 'STAF_ADMIN', '']

  const ws1 = XLSX.utils.aoa_to_sheet([headers, sample1, sample2])
  ws1['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 14 }]

  const roleRows = ROLES.map((r) => [r, ROLE_LABELS[r] ?? r])
  const ws2 = XLSX.utils.aoa_to_sheet([['Kode Role', 'Label'], ...roleRows])
  ws2['!cols'] = [{ wch: 20 }, { wch: 22 }]

  const ws3 = XLSX.utils.aoa_to_sheet([['Kode Kelompok', 'Nama Kelompok', 'Wilayah', 'Penatua / Majelis'], ...kelompokRows])
  ws3['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 20 }, { wch: 30 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Data Pengguna')
  XLSX.utils.book_append_sheet(wb, ws2, 'Referensi Role')
  XLSX.utils.book_append_sheet(wb, ws3, 'Referensi Kelompok')
  XLSX.writeFile(wb, 'template-import-pengguna.xlsx')
}

export function ImportPenggunaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [processing, setProcessing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<{ total: number; berhasil: number; gagal: number; log: ResultLog[] } | null>(null)

  function reset() {
    setFileName(''); setRows([]); setResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function parseFile(f: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('data pengguna')) ?? wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      const dataRows = aoa.slice(1).filter((r) => r.some((c: any) => String(c ?? '').trim() !== ''))
      const parsed: ParsedRow[] = dataRows.map((r, i) => ({
        rowIndex: i + 2,
        namaLengkap: String(r[0] ?? '').trim(),
        username: String(r[1] ?? '').trim(),
        email: String(r[2] ?? '').trim(),
        password: String(r[3] ?? '').trim(),
        role: String(r[4] ?? '').trim(),
        kelompokKode: String(r[5] ?? '').trim(),
      }))
      setFileName(f.name)
      setRows(parsed)
      setResults(null)
    }
    reader.readAsArrayBuffer(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseFile(f)
  }

  const validCount = rows.filter((r) => validateRow(r).length === 0).length

  async function runImport() {
    setProcessing(true)
    try {
      const payload = rows.map((r) => ({
        namaLengkap: r.namaLengkap,
        username: r.username,
        email: r.email,
        password: r.password,
        role: r.role,
        kelompokKode: r.kelompokKode || undefined,
        _rowIndex: r.rowIndex,
      }))
      const res = await api.post('/import/pengguna', { rows: payload })
      setResults(res.data.data)
      qc.invalidateQueries({ queryKey: ['users'] })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Pengguna dari Excel" size="xl">
      <div className="space-y-5">
        {!results && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Upload file Excel hasil isian template untuk membuat banyak akun pengguna sekaligus.
            </p>
            <button
              onClick={async () => { setIsGenerating(true); try { await downloadTemplate() } finally { setIsGenerating(false) } }}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-lg shrink-0"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download Template
            </button>
          </div>
        )}

        {!results && rows.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 py-14 border-2 border-dashed rounded-xl cursor-pointer transition',
              dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-300',
            )}
          >
            <FileSpreadsheet size={32} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Klik atau seret file .xlsx ke sini</p>
            <p className="text-xs text-gray-400">Sheet pertama bernama "Data Pengguna", baris 1 = header</p>
            <input
              ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f) }}
            />
          </div>
        )}

        {!results && rows.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">
                <span className="font-medium">{fileName}</span> · {rows.length} baris terbaca ·{' '}
                <span className={validCount === rows.length ? 'text-green-600' : 'text-orange-600'}>
                  {validCount} valid
                </span>
              </p>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Ganti file
              </button>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Baris</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Nama</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Username</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Kelompok</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r) => {
                      const errs = validateRow(r)
                      return (
                        <tr key={r.rowIndex} className={errs.length ? 'bg-red-50/50' : ''}>
                          <td className="px-3 py-2 text-gray-400">{r.rowIndex}</td>
                          <td className="px-3 py-2">{r.namaLengkap || <span className="text-red-400 italic">kosong</span>}</td>
                          <td className="px-3 py-2 font-mono">{normUsername(r.username) || <span className="text-red-400 italic">kosong</span>}</td>
                          <td className="px-3 py-2">{r.email}</td>
                          <td className="px-3 py-2">{r.role}</td>
                          <td className="px-3 py-2">{r.kelompokKode || '—'}</td>
                          <td className="px-3 py-2">
                            {errs.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> Valid</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500" title={errs.join(', ')}>
                                <AlertTriangle size={12} /> {errs[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={runImport}
                disabled={processing || rows.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg"
              >
                {processing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Import {rows.length} Pengguna
              </button>
            </div>
          </>
        )}

        {results && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{results.total}</p>
                <p className="text-xs text-gray-500">Total baris</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{results.berhasil}</p>
                <p className="text-xs text-green-600">Berhasil</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{results.gagal}</p>
                <p className="text-xs text-red-500">Gagal</p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Baris</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Nama</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.log.map((l) => (
                      <tr key={l.baris}>
                        <td className="px-3 py-2 text-gray-400">{l.baris}</td>
                        <td className="px-3 py-2">{l.nama}</td>
                        <td className="px-3 py-2">
                          {l.status === 'berhasil' ? (
                            <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> Berhasil</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500"><XCircle size={12} /> Gagal</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {l.status === 'berhasil' ? `username: ${l.username}` : l.alasan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={reset} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
                Import File Lain
              </button>
              <button onClick={handleClose} className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
                Selesai
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
