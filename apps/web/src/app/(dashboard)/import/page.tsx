'use client'

import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Download, RotateCcw, Loader2, Info,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// ── Field definitions ─────────────────────────────────────────
const IMPORT_FIELDS = [
  { key: 'namaLengkap',        label: 'Nama Lengkap',           required: true  },
  { key: 'jenisKelamin',       label: 'Jenis Kelamin (L/P)',     required: true  },
  { key: 'nomorInduk',         label: 'No. Induk Warga',         required: false },
  { key: 'namaPanggilan',      label: 'Nama Panggilan',          required: false },
  { key: 'nik',                label: 'NIK (16 digit)',           required: false },
  { key: 'tempatLahir',        label: 'Tempat Lahir',            required: false },
  { key: 'tanggalLahir',       label: 'Tanggal Lahir',           required: false },
  { key: 'golonganDarah',      label: 'Golongan Darah (A/B/AB/O)',required: false },
  { key: 'statusKeluarga',     label: 'Status dalam KK',         required: false },
  { key: 'statusKeanggotaan',  label: 'Status Keanggotaan',      required: false },
  { key: 'sudahBaptis',        label: 'Sudah Baptis (Y/N)',      required: false },
  { key: 'tanggalBaptis',      label: 'Tanggal Baptis',          required: false },
  { key: 'tempatBaptis',       label: 'Tempat Baptis',           required: false },
  { key: 'sudahSidi',          label: 'Sudah Sidi (Y/N)',        required: false },
  { key: 'nomorSidi',          label: 'No. Sidi',                required: false },
  { key: 'tanggalSidi',        label: 'Tanggal Sidi',            required: false },
  { key: 'telepon',            label: 'Telepon',                 required: false },
  { key: 'whatsapp',           label: 'WhatsApp',                required: false },
  { key: 'email',              label: 'Email',                   required: false },
  { key: 'pendidikanTerakhir', label: 'Pendidikan Terakhir',     required: false },
  { key: 'pekerjaan',          label: 'Pekerjaan',               required: false },
  { key: 'kelompokKode',       label: 'Kode Kelompok',           required: false },
  { key: 'catatan',            label: 'Catatan',                 required: false },
] as const

type FieldKey = typeof IMPORT_FIELDS[number]['key']

// ── Auto-map heuristic ────────────────────────────────────────
const HEADER_HINTS: Record<string, FieldKey> = {
  'nama lengkap': 'namaLengkap', 'nama': 'namaLengkap', 'full name': 'namaLengkap',
  'jenis kelamin': 'jenisKelamin', 'jk': 'jenisKelamin', 'gender': 'jenisKelamin', 'l/p': 'jenisKelamin',
  'no induk': 'nomorInduk', 'no. induk': 'nomorInduk', 'nomor induk': 'nomorInduk', 'nomer induk': 'nomorInduk',
  'panggilan': 'namaPanggilan', 'nama panggilan': 'namaPanggilan',
  'nik': 'nik', 'ktp': 'nik', 'no ktp': 'nik',
  'tempat lahir': 'tempatLahir', 'ttl': 'tempatLahir',
  'tanggal lahir': 'tanggalLahir', 'tgl lahir': 'tanggalLahir', 'tgl. lahir': 'tanggalLahir', 'dob': 'tanggalLahir',
  'gol darah': 'golonganDarah', 'golongan darah': 'golonganDarah', 'gol. darah': 'golonganDarah',
  'status kk': 'statusKeluarga', 'status keluarga': 'statusKeluarga', 'status dalam kk': 'statusKeluarga',
  'status keanggotaan': 'statusKeanggotaan', 'status': 'statusKeanggotaan',
  'baptis': 'sudahBaptis', 'sudah baptis': 'sudahBaptis',
  'tgl baptis': 'tanggalBaptis', 'tanggal baptis': 'tanggalBaptis',
  'tempat baptis': 'tempatBaptis',
  'sidi': 'sudahSidi', 'sudah sidi': 'sudahSidi',
  'no sidi': 'nomorSidi', 'nomor sidi': 'nomorSidi',
  'tgl sidi': 'tanggalSidi', 'tanggal sidi': 'tanggalSidi',
  'telp': 'telepon', 'telepon': 'telepon', 'hp': 'telepon', 'no hp': 'telepon', 'no. hp': 'telepon',
  'wa': 'whatsapp', 'whatsapp': 'whatsapp', 'no wa': 'whatsapp',
  'email': 'email',
  'pendidikan': 'pendidikanTerakhir', 'pendidikan terakhir': 'pendidikanTerakhir',
  'pekerjaan': 'pekerjaan', 'job': 'pekerjaan',
  'kelompok': 'kelompokKode', 'kode kelompok': 'kelompokKode', 'kelompok kode': 'kelompokKode',
  'catatan': 'catatan', 'keterangan': 'catatan', 'ket': 'catatan',
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim()
    .replace(/\s*\*$/, '')           // strip trailing *
    .replace(/\s*\[wajib\]$/, '')    // strip [wajib]
    .replace(/\s*\(wajib\)$/, '')    // strip (wajib)
    .trim()
}

function autoMap(headers: string[]): Record<string, FieldKey | ''> {
  const result: Record<string, FieldKey | ''> = {}
  for (const h of headers) {
    result[h] = HEADER_HINTS[normalizeHeader(h)] ?? ''
  }
  return result
}

// Format hints per field untuk sheet Petunjuk
const FORMAT_HINTS: Record<string, string> = {
  namaLengkap:         'Nama lengkap, minimal 2 huruf',
  jenisKelamin:        'L = Laki-laki  /  P = Perempuan',
  nomorInduk:          'Nomor induk dari gereja (mis. WRG001)',
  namaPanggilan:       'Nama yang biasa dipanggil',
  nik:                 '16 digit angka dari KTP',
  tempatLahir:         'Kota/kabupaten tempat lahir',
  tanggalLahir:        'Format: dd/mm/yyyy  — contoh: 15/05/1980',
  golonganDarah:       'A, B, AB, atau O',
  statusKeluarga:      'KEPALA / ISTRI / ANAK / MENANTU / CUCU / LAINNYA',
  statusKeanggotaan:   'AKTIF / NON_AKTIF / KATEKUMEN / PINDAH_KELUAR / MENINGGAL',
  sudahBaptis:         'Y = Sudah  /  N = Belum',
  tanggalBaptis:       'Format: dd/mm/yyyy  (isi jika sudah baptis)',
  tempatBaptis:        'Nama gereja/tempat baptis dilaksanakan',
  sudahSidi:           'Y = Sudah  /  N = Belum',
  nomorSidi:           'Nomor sidi dari gereja',
  tanggalSidi:         'Format: dd/mm/yyyy  (isi jika sudah sidi)',
  telepon:             'Nomor telepon — mis. 0812-3456-7890',
  whatsapp:            'Nomor WhatsApp — mis. 0812-3456-7890',
  email:               'Alamat email aktif',
  pendidikanTerakhir:  'SD / SMP / SMA/SMK / D3 / S1 / S2 / S3 / Lainnya',
  pekerjaan:           'Pekerjaan saat ini',
  kelompokKode:        'Kode kelompok (lihat tab "Referensi Kelompok")',
  catatan:             'Informasi tambahan',
}

// ── Template generator (async — fetch kelompok dari DB) ───────
async function downloadTemplate() {
  // Fetch data kelompok untuk sheet referensi
  let kelompokRows: string[][] = []
  try {
    const res = await api.get('/kelompok')
    const list: any[] = res.data.data ?? []
    kelompokRows = list.map((k) => [
      k.kode ?? '',
      k.nama ?? '',
      k.wilayah?.nama ?? '',
      k.penatua_nama_temp ?? '-',
    ])
  } catch {
    kelompokRows = [['(Gagal mengambil data kelompok dari server)', '', '', '']]
  }

  // ── Sheet 1: Data Warga ─────────────────────────────────────
  // Header dengan penanda * untuk field wajib
  const headers = IMPORT_FIELDS.map((f) => f.required ? `${f.label} *` : f.label)

  const sample1 = [
    'Budi Santoso', 'L', 'WRG001', 'Budi', '3175011234567890', 'Jakarta', '15/05/1980',
    'A', 'KEPALA', 'AKTIF', 'Y', '10/03/1985', 'GKJ Rawamangun', 'Y', 'SIDI001', '01/06/2000',
    '08123456789', '08123456789', 'budi@email.com', 'S1', 'Karyawan', 'K01', '',
  ]
  const sample2 = [
    'Sri Wahyu', 'P', 'WRG002', 'Sri', '3175016789012345', 'Surabaya', '20/08/1983',
    'B', 'ISTRI', 'AKTIF', 'Y', '25/07/1987', 'GKJ Surabaya', 'N', '', '',
    '08198765432', '08198765432', 'sri@email.com', 'D3', 'Ibu Rumah Tangga', 'K01', '',
  ]

  const ws1 = XLSX.utils.aoa_to_sheet([headers, sample1, sample2])
  ws1['!cols'] = IMPORT_FIELDS.map((f) => ({ wch: f.required ? 24 : 20 }))
  // Freeze row 1 (header)
  ws1['!freeze'] = { xSplit: 0, ySplit: 1 } as any

  // ── Sheet 2: Petunjuk Pengisian ─────────────────────────────
  const colLetter = (i: number) => String.fromCharCode(65 + i)
  const petunjukHeader = ['No', 'Kolom', 'Nama Field', 'Status', 'Format / Nilai yang Diterima', 'Contoh']
  const petunjukRows = IMPORT_FIELDS.map((f, i) => [
    i + 1,
    colLetter(i),
    f.label.replace(' *', ''),
    f.required ? 'WAJIB ★' : 'Opsional',
    FORMAT_HINTS[f.key] ?? '',
    i < sample1.length ? String(sample1[i] ?? '') : '',
  ])
  const ws2 = XLSX.utils.aoa_to_sheet([petunjukHeader, ...petunjukRows])
  ws2['!cols'] = [
    { wch: 4 },   // No
    { wch: 7 },   // Kolom
    { wch: 28 },  // Nama Field
    { wch: 12 },  // Status
    { wch: 48 },  // Format
    { wch: 22 },  // Contoh
  ]

  // ── Sheet 3: Referensi Kelompok ─────────────────────────────
  const kelompokHeader = ['Kode Kelompok', 'Nama Kelompok', 'Wilayah', 'Penatua / Majelis']
  const ws3 = XLSX.utils.aoa_to_sheet([kelompokHeader, ...kelompokRows])
  ws3['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 20 }, { wch: 30 }]

  // ── Buat workbook ───────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Data Warga')
  XLSX.utils.book_append_sheet(wb, ws2, 'Petunjuk Pengisian')
  XLSX.utils.book_append_sheet(wb, ws3, 'Referensi Kelompok')
  XLSX.writeFile(wb, 'template-import-warga.xlsx')
}

// ── Stepper ───────────────────────────────────────────────────
const STEPS = ['Upload', 'Mapping', 'Preview', 'Proses', 'Hasil']

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition',
            i < current  ? 'bg-brand-600 text-white'
            : i === current ? 'bg-brand-600 text-white ring-4 ring-brand-100'
            : 'bg-gray-100 text-gray-400',
          )}>
            {i < current ? <CheckCircle2 size={16} /> : i + 1}
          </div>
          <span className={cn(
            'mx-2 text-xs font-medium',
            i === current ? 'text-brand-700' : i < current ? 'text-gray-500' : 'text-gray-400',
          )}>{label}</span>
          {i < STEPS.length - 1 && (
            <div className={cn('w-8 h-0.5 mx-1', i < current ? 'bg-brand-400' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function ImportPage() {
  const [step, setStep] = useState(0)
  const [file, setFile]   = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, FieldKey | ''>>({})
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isGenerating, setIsGenerating] = useState(false)

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress]     = useState({ done: 0, total: 0 })
  const [results, setResults]        = useState<{
    total: number; berhasil: number; gagal: number
    log: Array<{ baris: number; status: string; nama: string; nomorAnggota?: string; alasan?: string }>
  } | null>(null)

  // ── Parse Excel ────────────────────────────────────────────
  const parseFile = useCallback((f: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', cellDates: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (aoa.length < 2) { alert('File kosong atau tidak punya data'); return }
      const hdrs = aoa[0].map((h: any) => String(h ?? '').trim()).filter(Boolean)
      const rows = aoa.slice(1).filter((r) => r.some((c: any) => c !== ''))
      setFile(f)
      setHeaders(hdrs)
      setRawRows(rows)
      setMapping(autoMap(hdrs))
      setStep(1)
    }
    reader.readAsArrayBuffer(f)
  }, [])

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseFile(f)
  }

  // ── Build preview rows ────────────────────────────────────
  function buildMappedRow(rawRow: any[]): Record<string, any> {
    const obj: Record<string, any> = {}
    headers.forEach((h, i) => {
      if (mapping[h]) obj[mapping[h]] = rawRow[i]
    })
    return obj
  }

  function validateRow(row: Record<string, any>): string[] {
    const errs: string[] = []
    if (!row.namaLengkap || String(row.namaLengkap).trim().length < 2)
      errs.push('Nama lengkap wajib')
    if (!row.jenisKelamin || !['L','P','LAKI','PEREMPUAN','LAKI-LAKI','WANITA'].includes(
      String(row.jenisKelamin).toUpperCase().trim()))
      errs.push('Jenis kelamin tidak valid')
    return errs
  }

  const mandatoryMapped = IMPORT_FIELDS
    .filter((f) => f.required)
    .every((f) => Object.values(mapping).includes(f.key))

  // ── Run import ────────────────────────────────────────────
  async function runImport() {
    setStep(3)
    setProcessing(true)
    const BATCH = 100
    const allRows = rawRows.map((r, i) => ({ ...buildMappedRow(r), _rowIndex: i + 2 }))
    const batches = []
    for (let i = 0; i < allRows.length; i += BATCH)
      batches.push(allRows.slice(i, i + BATCH))

    const fullLog: any[] = []
    let totalBerhasil = 0, totalGagal = 0
    setProgress({ done: 0, total: allRows.length })

    for (const batch of batches) {
      const res = await api.post('/import/warga', { rows: batch })
      const d = res.data.data
      fullLog.push(...d.log)
      totalBerhasil += d.berhasil
      totalGagal    += d.gagal
      setProgress((p) => ({ ...p, done: p.done + batch.length }))
    }

    setResults({ total: allRows.length, berhasil: totalBerhasil, gagal: totalGagal, log: fullLog })
    setProcessing(false)
    setStep(4)
  }

  // ── Download log ──────────────────────────────────────────
  function downloadLog() {
    if (!results) return
    const rows = [
      ['Baris', 'Status', 'Nama', 'No. Anggota', 'Alasan'],
      ...results.log.map((l) => [l.baris, l.status, l.nama, l.nomorAnggota ?? '', l.alasan ?? '']),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Log Import')
    XLSX.writeFile(wb, `log-import-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  function reset() {
    setStep(0); setFile(null); setHeaders([]); setRawRows([])
    setMapping({}); setResults(null); setProgress({ done: 0, total: 0 })
  }

  // Preview rows (first 10 after mapping)
  const previewRows: Array<Record<string, any> & { _idx: number; _errors: string[] }> =
    rawRows.slice(0, 10).map((r, i) => {
      const mapped = buildMappedRow(r)
      return { ...mapped, _idx: i, _errors: validateRow(mapped) }
    })
  const totalErrors = rawRows.map((r) => validateRow(buildMappedRow(r))).filter((e) => e.length > 0).length

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Data Warga</h1>
        <p className="text-gray-500 text-sm mt-1">Upload file Excel untuk mengimpor data warga secara massal</p>
      </div>

      <Stepper current={step} />

      {/* ── Step 0: Upload ──────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition',
              dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50',
            )}
          >
            <FileSpreadsheet size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-700">Drag & drop file Excel di sini</p>
            <p className="text-sm text-gray-400 mt-1">atau klik untuk memilih file (.xlsx, .xls)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f) }}
            />
          </div>

          {/* Download template */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Info size={16} className="text-blue-500 shrink-0" />
            <div className="flex-1 text-sm text-blue-700">
              Belum punya file Excel? Gunakan template resmi agar header langsung terpetakan otomatis.
            </div>
            <button
              onClick={async () => {
                setIsGenerating(true)
                try { await downloadTemplate() } finally { setIsGenerating(false) }
              }}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition shrink-0"
            >
              {isGenerating
                ? <><Loader2 size={14} className="animate-spin" /> Menyiapkan...</>
                : <><Download size={14} /> Download Template</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Mapping ─────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">File: <span className="text-brand-600">{file?.name}</span></p>
              <p className="text-sm text-gray-400 mt-0.5">{rawRows.length} baris data · {headers.length} kolom</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500">
              Petakan kolom Excel ke field sistem · Field wajib ditandai <span className="text-red-500">*</span>
            </div>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-64">Kolom di Excel</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Contoh Data</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-72">Dipetakan ke Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {headers.map((h) => {
                    const sampleVal = rawRows[0]?.[headers.indexOf(h)]
                    return (
                      <tr key={h} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{h}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs font-mono truncate max-w-[180px]">
                          {String(sampleVal ?? '—')}
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={mapping[h] ?? ''}
                            onChange={(e) => setMapping({ ...mapping, [h]: e.target.value as FieldKey | '' })}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="">— Abaikan kolom ini —</option>
                            {IMPORT_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.required ? '* ' : ''}{f.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {!mandatoryMapped && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <AlertCircle size={15} />
              Field wajib belum dipetakan: {IMPORT_FIELDS.filter((f) => f.required && !Object.values(mapping).includes(f.key)).map((f) => f.label).join(', ')}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={reset} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
              ← Ganti File
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!mandatoryMapped}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg"
            >
              Preview Data <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ─────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{rawRows.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total baris</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{rawRows.length - totalErrors}</p>
              <p className="text-xs text-gray-500 mt-1">Siap diimpor</p>
            </div>
            <div className={cn('rounded-xl border p-4 text-center', totalErrors > 0 ? 'bg-red-50 border-red-200' : 'bg-white')}>
              <p className={cn('text-2xl font-bold', totalErrors > 0 ? 'text-red-600' : 'text-gray-300')}>{totalErrors}</p>
              <p className="text-xs text-gray-500 mt-1">Baris bermasalah</p>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500">
              Preview 10 baris pertama
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">Baris</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">Nama Lengkap</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">JK</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">Tgl Lahir</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">Status KK</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-500">Kelompok</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row) => (
                    <tr key={row._idx} className={cn(row._errors.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50')}>
                      <td className="px-3 py-2 text-gray-400">{(row._idx as number) + 2}</td>
                      <td className="px-3 py-2">
                        {row._errors.length > 0 ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle size={12} />
                            {row._errors[0]}
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">{String(row.namaLengkap ?? '—')}</td>
                      <td className="px-3 py-2 text-gray-600">{String(row.jenisKelamin ?? '—')}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono">{String(row.tanggalLahir ?? '—')}</td>
                      <td className="px-3 py-2 text-gray-600">{String(row.statusKeluarga ?? '—')}</td>
                      <td className="px-3 py-2 text-gray-600">{String(row.kelompokKode ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rawRows.length > 10 && (
              <p className="px-4 py-2 text-xs text-gray-400 border-t">
                ... dan {rawRows.length - 10} baris lainnya
              </p>
            )}
          </div>

          {totalErrors > 0 && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                {totalErrors} baris bermasalah akan dilewati saat import. Baris yang valid tetap akan diproses.
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
              ← Kembali ke Mapping
            </button>
            <button
              onClick={runImport}
              disabled={rawRows.length - totalErrors === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg"
            >
              Mulai Import {rawRows.length - totalErrors} Data <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Processing ──────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-xl border shadow-sm p-10 text-center space-y-5">
          <div className="flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="40" cy="40" r="32" stroke="#4f46e5" strokeWidth="8" fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - (progress.total > 0 ? progress.done / progress.total : 0))}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-brand-600" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">Sedang memproses data...</p>
            <p className="text-gray-500 text-sm mt-1">
              {progress.done} dari {progress.total} baris selesai
              {progress.total > 0 && ` (${Math.round(progress.done / progress.total * 100)}%)`}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 max-w-md mx-auto overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-400">Jangan tutup halaman ini</p>
        </div>
      )}

      {/* ── Step 4: Hasil ───────────────────────────────────── */}
      {step === 4 && results && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-5 text-center">
              <p className="text-3xl font-bold text-gray-800">{results.total}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Diproses</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
              <p className="text-3xl font-bold text-green-600">{results.berhasil}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Berhasil</p>
            </div>
            <div className={cn('rounded-xl border p-5 text-center', results.gagal > 0 ? 'bg-red-50 border-red-200' : 'bg-white')}>
              <p className={cn('text-3xl font-bold', results.gagal > 0 ? 'text-red-600' : 'text-gray-300')}>{results.gagal}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Gagal</p>
            </div>
          </div>

          {/* Log table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Log Import</p>
              <button onClick={downloadLog}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
                <Download size={13} /> Download Log
              </button>
            </div>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-16">Baris</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-28">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Nama</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">No. Anggota</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Alasan Gagal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.log.map((entry, i) => (
                    <tr key={i} className={cn(
                      'transition',
                      entry.status === 'gagal' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50',
                    )}>
                      <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{entry.baris}</td>
                      <td className="px-4 py-2.5">
                        {entry.status === 'berhasil' ? (
                          <span className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
                            <CheckCircle2 size={13} /> Berhasil
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-600 text-xs font-medium">
                            <XCircle size={13} /> Gagal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{entry.nama}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{entry.nomorAnggota ?? '—'}</td>
                      <td className="px-4 py-2.5 text-red-600 text-xs">{entry.alasan ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              <RotateCcw size={14} /> Import File Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
