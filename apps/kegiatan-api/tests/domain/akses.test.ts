import { describe, it, expect } from 'vitest'
import {
  bolehAjukanProgram, bolehBuatProgram, bolehHapusProgram, bolehKelola, bolehLihatProgram, bolehTarikProgram, bolehUbahProgram, cakupanDari,
  type Pelaku,
} from '../../src/domain/akses.js'

const p = (peran: Pelaku['peran'], unitId: number | null = null, bidangId: number | null = null): Pelaku => ({ id: 1, peran, unitId, bidangId })
const draft = (unitId: number, bidangId = 1) => ({ unitId, status: 'DRAFT' as const, unit: { bidangId } })
const diajukan = (unitId: number, bidangId = 1) => ({ unitId, status: 'DIAJUKAN' as const, unit: { bidangId } })

describe('bolehLihatProgram', () => {
  it('admin, sekretariat, majelis melihat semua', () => {
    for (const peran of ['ADMIN', 'SEKRETARIAT', 'MAJELIS'] as const) expect(bolehLihatProgram(p(peran), draft(5, 9))).toBe(true)
  })
  it('pengurus UPK hanya unitnya sendiri', () => {
    expect(bolehLihatProgram(p('PENGURUS_UPK', 5), draft(5))).toBe(true)
    expect(bolehLihatProgram(p('PENGURUS_UPK', 5), draft(6))).toBe(false)
  })
  it('pengurus tanpa unit tidak melihat apa pun (fail-closed)', () => {
    expect(bolehLihatProgram(p('PENGURUS_UPK', null), draft(5))).toBe(false)
  })
  it('koordinator hanya bidangnya; tanpa bidang tidak melihat apa pun', () => {
    expect(bolehLihatProgram(p('KOORDINATOR_BIDANG', null, 1), draft(5, 1))).toBe(true)
    expect(bolehLihatProgram(p('KOORDINATOR_BIDANG', null, 1), draft(5, 2))).toBe(false)
    expect(bolehLihatProgram(p('KOORDINATOR_BIDANG', null, null), draft(5, 1))).toBe(false)
  })
})

describe('cakupanDari', () => {
  it('sesuai peran dan fail-closed', () => {
    expect(cakupanDari(p('ADMIN'))).toEqual({ jenis: 'semua' })
    expect(cakupanDari(p('MAJELIS'))).toEqual({ jenis: 'semua' })
    expect(cakupanDari(p('PENGURUS_UPK', 3))).toEqual({ jenis: 'unit', unitId: 3 })
    expect(cakupanDari(p('PENGURUS_UPK', null))).toEqual({ jenis: 'kosong' })
    expect(cakupanDari(p('KOORDINATOR_BIDANG', null, 2))).toEqual({ jenis: 'bidang', bidangId: 2 })
    expect(cakupanDari(p('KOORDINATOR_BIDANG'))).toEqual({ jenis: 'kosong' })
  })
})

describe('bolehUbahProgram', () => {
  it('pengurus: unit sendiri + DRAFT + pengajuan DIBUKA → boleh', () => {
    expect(bolehUbahProgram(p('PENGURUS_UPK', 5), draft(5), 'DIBUKA').boleh).toBe(true)
  })
  it('pengurus: pengajuan DITUTUP atau BELUM_DIBUKA → ditolak 409', () => {
    for (const s of ['DITUTUP', 'BELUM_DIBUKA'] as const) {
      const k = bolehUbahProgram(p('PENGURUS_UPK', 5), draft(5), s)
      expect(k).toMatchObject({ boleh: false, kode: 409 })
    }
  })
  it('pengurus: unit lain → ditolak 403', () => {
    expect(bolehUbahProgram(p('PENGURUS_UPK', 5), draft(6), 'DIBUKA')).toMatchObject({ boleh: false, kode: 403 })
  })
  it('program yang sudah DIAJUKAN tidak dapat diubah siapa pun (harus ditarik dulu)', () => {
    for (const peran of ['ADMIN', 'SEKRETARIAT', 'PENGURUS_UPK'] as const) {
      expect(bolehUbahProgram(p(peran, 5), diajukan(5), 'DIBUKA')).toMatchObject({ boleh: false, kode: 409 })
    }
  })
  it('admin dan sekretariat boleh mengubah draft unit mana pun, juga saat ditutup', () => {
    for (const peran of ['ADMIN', 'SEKRETARIAT'] as const) {
      expect(bolehUbahProgram(p(peran), draft(9), 'DITUTUP').boleh).toBe(true)
    }
  })
  it('majelis, koordinator, dan pengurus tanpa unit tidak boleh mengubah', () => {
    expect(bolehUbahProgram(p('MAJELIS'), draft(5), 'DIBUKA').boleh).toBe(false)
    expect(bolehUbahProgram(p('KOORDINATOR_BIDANG', null, 1), draft(5, 1), 'DIBUKA').boleh).toBe(false)
    expect(bolehUbahProgram(p('PENGURUS_UPK', null), draft(5), 'DIBUKA').boleh).toBe(false)
  })
})

describe('bolehTarikProgram', () => {
  it('hanya program DIAJUKAN; pengurus hanya saat DIBUKA dan unit sendiri; admin kapan pun', () => {
    expect(bolehTarikProgram(p('PENGURUS_UPK', 5), draft(5), 'DIBUKA')).toMatchObject({ boleh: false, kode: 409 })
    expect(bolehTarikProgram(p('PENGURUS_UPK', 5), diajukan(5), 'DIBUKA').boleh).toBe(true)
    expect(bolehTarikProgram(p('PENGURUS_UPK', 5), diajukan(5), 'DITUTUP')).toMatchObject({ boleh: false, kode: 409 })
    expect(bolehTarikProgram(p('PENGURUS_UPK', 5), diajukan(6), 'DIBUKA')).toMatchObject({ boleh: false, kode: 403 })
    expect(bolehTarikProgram(p('ADMIN'), diajukan(6), 'DITUTUP').boleh).toBe(true)
  })
})

describe('bolehHapusProgram dan bolehBuatProgram', () => {
  it('hapus hanya draft; membuat mengikuti aturan ubah', () => {
    expect(bolehHapusProgram(p('PENGURUS_UPK', 5), diajukan(5), 'DIBUKA').boleh).toBe(false)
    expect(bolehHapusProgram(p('PENGURUS_UPK', 5), draft(5), 'DIBUKA').boleh).toBe(true)
    expect(bolehBuatProgram(p('PENGURUS_UPK', 5), 5, 'DIBUKA').boleh).toBe(true)
    expect(bolehBuatProgram(p('PENGURUS_UPK', 5), 6, 'DIBUKA').boleh).toBe(false)
    expect(bolehBuatProgram(p('PENGURUS_UPK', 5), 5, 'DITUTUP').boleh).toBe(false)
  })
  it('mengajukan memakai aturan yang sama dengan mengubah', () => {
    expect(bolehAjukanProgram(p('PENGURUS_UPK', 5), draft(6), 'DIBUKA').boleh).toBe(false)
  })
})

describe('bolehKelola', () => {
  it('hanya admin dan sekretariat', () => {
    expect(bolehKelola(p('ADMIN'))).toBe(true)
    expect(bolehKelola(p('SEKRETARIAT'))).toBe(true)
    for (const peran of ['MAJELIS', 'KOORDINATOR_BIDANG', 'PENGURUS_UPK'] as const) expect(bolehKelola(p(peran, 1, 1))).toBe(false)
  })
})
