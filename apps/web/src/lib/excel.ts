/**
 * Helper baca/tulis Excel (.xlsx) berbasis ExcelJS.
 * Menggantikan SheetJS `xlsx` (kerentanan prototype pollution + ReDoS tanpa perbaikan di npm).
 * ExcelJS dimuat lazy (dynamic import) agar tidak membebani bundle halaman lain.
 */

export type CellValue = string | number | boolean | null | undefined

export interface SheetSpec {
  name: string
  rows: CellValue[][]
  /** Lebar kolom (satuan karakter, seperti `wch` di SheetJS) */
  colWidths?: number[]
  /** Bekukan baris pertama (header) */
  freezeHeader?: boolean
}

export class UnsupportedExcelFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedExcelFormatError'
  }
}

async function loadExcelJS() {
  const mod: any = await import('exceljs')
  return mod.default ?? mod
}

/** Tanggal → nomor seri Excel (sama dengan perilaku SheetJS `cellDates: false`) */
function dateToSerial(d: Date): number {
  return d.getTime() / 86_400_000 + 25_569
}

/** Ratakan nilai sel ExcelJS menjadi string | number | boolean ('' jika kosong) */
export function normalizeCell(v: any): string | number | boolean {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return dateToSerial(v)
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text ?? '').join('')
    if ('result' in v) return normalizeCell(v.result)          // formula
    if ('formula' in v || 'sharedFormula' in v) return ''      // formula tanpa hasil
    if ('text' in v) return normalizeCell(v.text)              // hyperlink
    if ('error' in v) return ''
    return ''
  }
  return v
}

/** Bangun file .xlsx sebagai bytes (terpisah dari download agar mudah dites) */
export async function buildWorkbookBuffer(sheets: SheetSpec[]): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  for (const spec of sheets) {
    const ws = wb.addWorksheet(spec.name, {
      views: spec.freezeHeader ? [{ state: 'frozen', ySplit: 1 }] : undefined,
    })
    spec.rows.forEach((row) => ws.addRow(row.map((c) => (c === undefined ? null : c))))
    spec.colWidths?.forEach((w, i) => { ws.getColumn(i + 1).width = w })
    if (spec.freezeHeader && ws.rowCount > 0) ws.getRow(1).font = { bold: true }
  }
  return wb.xlsx.writeBuffer()
}

/** Buat file .xlsx lalu unduh lewat browser */
export async function downloadWorkbook(filename: string, sheets: SheetSpec[]): Promise<void> {
  const buffer = await buildWorkbookBuffer(sheets)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Pesan jika pengguna mengunggah Excel lama (.xls) yang tidak didukung ExcelJS */
export function assertXlsx(file: { name: string }) {
  if (/\.xls$/i.test(file.name)) {
    throw new UnsupportedExcelFormatError(
      'Format .xls (Excel lama) tidak didukung. Buka file di Excel lalu pilih "Simpan sebagai" → .xlsx, kemudian unggah ulang.',
    )
  }
}

/**
 * Baca sheet sebagai array-of-arrays (baris × kolom mulai kolom A).
 * Sel kosong → ''. Tanggal → nomor seri Excel. Baris kosong di awal dilewati.
 * @param pickSheet pilih sheet dari daftar nama; default sheet pertama
 */
export async function readSheetRows(
  data: ArrayBuffer | Uint8Array,
  pickSheet?: (sheetNames: string[]) => string | undefined,
): Promise<any[][]> {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(data as any)
  } catch {
    throw new UnsupportedExcelFormatError(
      'File tidak dapat dibaca. Pastikan file berformat .xlsx yang valid.',
    )
  }
  const names: string[] = wb.worksheets.map((w: any) => w.name)
  const target = (pickSheet?.(names) ?? names[0])
  const ws = wb.getWorksheet(target) ?? wb.worksheets[0]
  if (!ws) return []

  const colCount: number = ws.columnCount
  const rows: any[][] = []
  ws.eachRow({ includeEmpty: true }, (row: any, rowNumber: number) => {
    const cells: any[] = []
    for (let c = 1; c <= colCount; c++) cells.push(normalizeCell(row.getCell(c).value))
    rows[rowNumber - 1] = cells
  })
  // eachRow dengan includeEmpty tetap bisa menyisakan lubang; isi dengan baris kosong
  const dense = Array.from({ length: rows.length }, (_, i) =>
    rows[i] ?? new Array(colCount).fill(''),
  )
  // Lewati baris kosong di awal agar baris pertama = header
  const firstUsed = dense.findIndex((r) => r.some((c) => c !== ''))
  return firstUsed < 0 ? [] : dense.slice(firstUsed)
}
