import { describe, it, expect } from 'vitest'
import {
  bolehAjukanProgram, bolehBuatProgram, bolehHapusProgram, bolehKelola, bolehLihatProgram, bolehTarikProgram, bolehUbahAlokasi, bolehUbahPagu, bolehUbahProgram, cakupanDari,
  type Pelaku,
} from '../../src/domain/akses.js'

const p = (peran: Pelaku['peran'], unitId: number | null = null, bidangId: number | null = null): Pelaku => ({ id: 1, peran, unitId, bidangId })
const draft = (unitId: number, bidangId = 1) => ({ unitId, status: 'DRAFT' as const, unit: { bidangId } })
const diajukan = (unitId: number, bidangId = 1) => ({ unitId, status: 'DIAJUKAN' as const, unit: { bidangId } })

describe('bolehLihatProgram', () => {
  it('admin, sekretariat, majelis, dan pengawas (LP4WG, Kepala Kantor, Ministerium) melihat semua', () => {
    for (const peran of ['ADMIN', 'SEKRETARIAT', 'MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM'] as const) expect(bolehLihatProgram(p(peran), draft(5, 9))).toBe(true)
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

describe('pengawas hanya-lihat (MAJELIS, LP4WG, KEPALA_KANTOR, MINISTERIUM)', () => {
  const PENGAWAS = ['MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM'] as const

  it.each(PENGAWAS)('%s: cakupan semua unit tetapi tidak dapat mengelola', (peran) => {
    expect(cakupanDari(p(peran))).toEqual({ jenis: 'semua' })
    expect(bolehKelola(p(peran))).toBe(false)
  })

  it.each(PENGAWAS)('%s: ditolak membuat, mengubah, mengajukan, menarik, dan menghapus program unit mana pun', (peran) => {
    expect(bolehBuatProgram(p(peran, 5), 5, 'DIBUKA').boleh).toBe(false)
    expect(bolehUbahProgram(p(peran, 5), draft(5), 'DIBUKA').boleh).toBe(false)
    expect(bolehAjukanProgram(p(peran, 5), draft(5), 'DIBUKA').boleh).toBe(false)
    expect(bolehTarikProgram(p(peran, 5), diajukan(5), 'DIBUKA').boleh).toBe(false)
    expect(bolehHapusProgram(p(peran, 5), draft(5), 'DIBUKA').boleh).toBe(false)
  })
})

describe('siklus: pra-muker (ketua bidang + admin), muker (admin/sekretariat), ditetapkan (dikunci)', () => {
  const ketua = p('KOORDINATOR_BIDANG', null, 1)
  const upk = p('PENGURUS_UPK', 5, 1)

  it('PRA_MUKER: ketua bidang mengubah program bidangnya berstatus apa pun, bidang lain ditolak', () => {
    expect(bolehUbahProgram(ketua, diajukan(5, 1), 'PRA_MUKER').boleh).toBe(true)
    expect(bolehUbahProgram(ketua, draft(5, 1), 'PRA_MUKER').boleh).toBe(true)
    expect(bolehUbahProgram(ketua, diajukan(9, 2), 'PRA_MUKER')).toMatchObject({ boleh: false, kode: 403 })
    expect(bolehUbahProgram(p('KOORDINATOR_BIDANG', null, null), diajukan(5, 1), 'PRA_MUKER').boleh).toBe(false)
  })
  it('PRA_MUKER: admin dan sekretariat mengubah program berstatus apa pun', () => {
    for (const peran of ['ADMIN', 'SEKRETARIAT'] as const) expect(bolehUbahProgram(p(peran), diajukan(5), 'PRA_MUKER').boleh).toBe(true)
  })
  it('PRA_MUKER: pengurus UPK tidak lagi dapat mengubah (409), pengawas ditolak', () => {
    expect(bolehUbahProgram(upk, draft(5, 1), 'PRA_MUKER')).toMatchObject({ boleh: false, kode: 409 })
    for (const peran of ['MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM'] as const) expect(bolehUbahProgram(p(peran), diajukan(5), 'PRA_MUKER').boleh).toBe(false)
  })
  it('MUKER: hanya admin atau sekretariat; ketua bidang dan pengurus ditolak', () => {
    expect(bolehUbahProgram(p('ADMIN'), diajukan(5), 'MUKER').boleh).toBe(true)
    expect(bolehUbahProgram(p('SEKRETARIAT'), diajukan(5), 'MUKER').boleh).toBe(true)
    expect(bolehUbahProgram(ketua, diajukan(5, 1), 'MUKER')).toMatchObject({ boleh: false, kode: 409 })
    expect(bolehUbahProgram(upk, draft(5, 1), 'MUKER').boleh).toBe(false)
  })
  it('DITETAPKAN: semua ditolak (409), termasuk admin', () => {
    for (const pelaku of [p('ADMIN'), p('SEKRETARIAT'), ketua, upk]) expect(bolehUbahProgram(pelaku, draft(5, 1), 'DITETAPKAN')).toMatchObject({ boleh: false, kode: 409 })
  })
  it('sebelum pra-muker aturan lama tetap: program DIAJUKAN tidak dapat diubah langsung', () => {
    expect(bolehUbahProgram(p('ADMIN'), diajukan(5), 'DIBUKA')).toMatchObject({ boleh: false, kode: 409 })
    expect(bolehUbahProgram(ketua, draft(5, 1), 'DIBUKA').boleh).toBe(false)
  })
  it('tarik kembali tidak berlaku sejak pra-muker (isi diubah langsung)', () => {
    for (const s of ['PRA_MUKER', 'MUKER', 'DITETAPKAN'] as const) expect(bolehTarikProgram(p('ADMIN'), diajukan(5), s)).toMatchObject({ boleh: false, kode: 409 })
  })
  it('mengajukan hanya untuk draft; saat pra-muker ketua bidang boleh mengajukan draft bidangnya', () => {
    expect(bolehAjukanProgram(ketua, draft(5, 1), 'PRA_MUKER').boleh).toBe(true)
    expect(bolehAjukanProgram(ketua, diajukan(5, 1), 'PRA_MUKER')).toMatchObject({ boleh: false, kode: 409 })
  })
  it('ketua bidang membuat program baru hanya untuk unit di bidangnya saat pra-muker', () => {
    expect(bolehBuatProgram(ketua, 5, 'PRA_MUKER', 1).boleh).toBe(true)
    expect(bolehBuatProgram(ketua, 9, 'PRA_MUKER', 2).boleh).toBe(false)
    expect(bolehBuatProgram(ketua, 5, 'DIBUKA', 1).boleh).toBe(false)
  })
  it('menghapus draft saat pra-muker mengikuti hak ubah', () => {
    expect(bolehHapusProgram(ketua, draft(5, 1), 'PRA_MUKER').boleh).toBe(true)
    expect(bolehHapusProgram(ketua, diajukan(5, 1), 'PRA_MUKER').boleh).toBe(false)
  })
})

describe('pagu dan alokasi', () => {
  it('pagu bidang dan pos: admin dan sekretariat sampai ditetapkan; peran lain ditolak', () => {
    for (const peran of ['ADMIN', 'SEKRETARIAT'] as const) {
      for (const s of ['BELUM_DIBUKA', 'DIBUKA', 'DITUTUP', 'PRA_MUKER', 'MUKER'] as const) expect(bolehUbahPagu(p(peran), s).boleh).toBe(true)
      expect(bolehUbahPagu(p(peran), 'DITETAPKAN')).toMatchObject({ boleh: false, kode: 409 })
    }
    for (const peran of ['KOORDINATOR_BIDANG', 'PENGURUS_UPK', 'MAJELIS', 'LP4WG', 'KEPALA_KANTOR', 'MINISTERIUM'] as const) expect(bolehUbahPagu(p(peran, 5, 1), 'PRA_MUKER').boleh).toBe(false)
  })
  it('alokasi UPK: ketua bidang hanya bidangnya dan hanya saat PRA_MUKER', () => {
    const ketua = p('KOORDINATOR_BIDANG', null, 1)
    expect(bolehUbahAlokasi(ketua, 1, 'PRA_MUKER').boleh).toBe(true)
    expect(bolehUbahAlokasi(ketua, 2, 'PRA_MUKER')).toMatchObject({ boleh: false, kode: 403 })
    for (const s of ['DIBUKA', 'DITUTUP', 'MUKER'] as const) expect(bolehUbahAlokasi(ketua, 1, s)).toMatchObject({ boleh: false, kode: 409 })
  })
  it('alokasi UPK: admin dan sekretariat sampai ditetapkan; pengurus UPK tidak pernah', () => {
    expect(bolehUbahAlokasi(p('ADMIN'), 1, 'MUKER').boleh).toBe(true)
    expect(bolehUbahAlokasi(p('SEKRETARIAT'), 1, 'DIBUKA').boleh).toBe(true)
    expect(bolehUbahAlokasi(p('ADMIN'), 1, 'DITETAPKAN')).toMatchObject({ boleh: false, kode: 409 })
    expect(bolehUbahAlokasi(p('PENGURUS_UPK', 5, 1), 1, 'PRA_MUKER').boleh).toBe(false)
  })
})
