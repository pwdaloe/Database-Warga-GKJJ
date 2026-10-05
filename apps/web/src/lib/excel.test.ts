import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import {
  buildWorkbookBuffer, readSheetRows, normalizeCell, assertXlsx, UnsupportedExcelFormatError,
} from './excel'

describe('excel helper (ExcelJS)', () => {
  it('menulis lalu membaca kembali: string, angka, kosong', async () => {
    const buf = await buildWorkbookBuffer([
      { name: 'Data', rows: [['Nama', 'Usia', 'Telepon'], ['Budi', 30, '08123'], ['Sri', null, '']] },
    ])
    const rows = await readSheetRows(buf)
    expect(rows[0]).toEqual(['Nama', 'Usia', 'Telepon'])
    expect(rows[1]).toEqual(['Budi', 30, '08123'])
    expect(rows[2]).toEqual(['Sri', '', ''])
  })

  it('mempertahankan tipe number (mis. NIK tersimpan sebagai angka)', async () => {
    const buf = await buildWorkbookBuffer([{ name: 'Data', rows: [['NIK'], [3175012345678901]] }])
    const rows = await readSheetRows(buf)
    expect(typeof rows[1][0]).toBe('number')
  })

  it('memilih sheet lewat pickSheet, default sheet pertama', async () => {
    const buf = await buildWorkbookBuffer([
      { name: 'Petunjuk', rows: [['x']] },
      { name: 'Data Pengguna', rows: [['Nama'], ['Rama']] },
    ])
    expect((await readSheetRows(buf))[0]).toEqual(['x'])
    const picked = await readSheetRows(buf, (n) => n.find((s) => s.toLowerCase().includes('data pengguna')))
    expect(picked[1]).toEqual(['Rama'])
  })

  it('melewati baris kosong di awal dan menjaga baris kosong di tengah', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('S')
    ws.getCell('A3').value = 'Header'
    ws.getCell('A4').value = 'a'
    ws.getCell('A6').value = 'b'
    const buf = await wb.xlsx.writeBuffer()
    const rows = await readSheetRows(buf as ArrayBuffer)
    expect(rows.map((r) => r[0])).toEqual(['Header', 'a', '', 'b'])
  })

  it('tanggal dibaca sebagai nomor seri Excel (seperti SheetJS cellDates:false)', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('S')
    ws.getCell('A1').value = 'Lahir'
    ws.getCell('A2').value = new Date(Date.UTC(1990, 0, 1)) // 1 Jan 1990 = serial 32874
    const buf = await wb.xlsx.writeBuffer()
    const rows = await readSheetRows(buf as ArrayBuffer)
    expect(rows[1][0]).toBe(32874)
  })

  it('normalizeCell: richText, formula, hyperlink, error', () => {
    expect(normalizeCell({ richText: [{ text: 'Ha' }, { text: 'lo' }] })).toBe('Halo')
    expect(normalizeCell({ formula: 'A1+1', result: 5 })).toBe(5)
    expect(normalizeCell({ formula: 'A1+1' })).toBe('')
    expect(normalizeCell({ text: 'situs', hyperlink: 'http://x' })).toBe('situs')
    expect(normalizeCell({ error: '#DIV/0!' })).toBe('')
    expect(normalizeCell(undefined)).toBe('')
    expect(normalizeCell(true)).toBe(true)
  })

  it('menolak .xls dengan pesan jelas dan file rusak dengan error terdefinisi', async () => {
    expect(() => assertXlsx({ name: 'data.xls' })).toThrow(UnsupportedExcelFormatError)
    expect(() => assertXlsx({ name: 'data.xlsx' })).not.toThrow()
    await expect(readSheetRows(new Uint8Array([1, 2, 3]))).rejects.toThrow(UnsupportedExcelFormatError)
  })
})
