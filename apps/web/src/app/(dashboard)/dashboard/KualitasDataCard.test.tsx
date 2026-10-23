import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KualitasDataCard } from './KualitasDataCard'
import type { KualitasData } from '@/hooks/useDashboard'

const DATA: KualitasData = {
  corong: { draft: 74, validasi: 0, aktif: 2, tidakAktif: 0 },
  kelengkapan: { totalAktif: 74, tanpaNik: 74, tanpaKontak: 33, tanpaAlamat: 5, tanpaKoordinat: 73, tanpaTanggalLahir: 70, tanpaKeluarga: 0 },
}

describe('KualitasDataCard', () => {
  it('menampilkan jumlah per tahap validasi dan persennya terhadap seluruh warga tercatat', () => {
    render(<KualitasDataCard isLoading={false} data={DATA} />)
    expect(screen.getByTestId('corong-draft').textContent).toContain('74')
    expect(screen.getByTestId('corong-draft').textContent).toContain('97,4%')
    expect(screen.getByTestId('corong-aktif').textContent).toContain('2,6%')
    expect(screen.getByTestId('corong-validasi').textContent).toContain('0')
  })

  it('menampilkan kelengkapan dengan persen terhadap anggota aktif', () => {
    render(<KualitasDataCard isLoading={false} data={DATA} />)
    expect(screen.getByText(/anggota aktif \(74\)/)).toBeTruthy()
    expect(screen.getByTestId('lengkap-tanpaKontak').textContent).toContain('33')
    expect(screen.getByTestId('lengkap-tanpaKontak').textContent).toContain('44,6%')
    expect(screen.getByTestId('lengkap-tanpaNik').textContent).toContain('100%')
    expect(screen.getByTestId('lengkap-tanpaKeluarga').textContent).toContain('0')
  })

  it('bar corong memuat label aksesibel untuk pembaca layar', () => {
    render(<KualitasDataCard isLoading={false} data={DATA} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Draft 74, Validasi 0, Aktif 2, Tidak Aktif 0')
  })

  it('tanpa anggota aktif: tidak membagi dengan nol', () => {
    render(<KualitasDataCard isLoading={false} data={{ ...DATA, kelengkapan: { ...DATA.kelengkapan, totalAktif: 0, tanpaNik: 0, tanpaKontak: 0, tanpaAlamat: 0, tanpaKoordinat: 0, tanpaTanggalLahir: 0, tanpaKeluarga: 0 } }} />)
    expect(screen.getByText(/Belum ada anggota aktif/)).toBeTruthy()
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull()
  })

  it('tanpa warga sama sekali: pesan kosong', () => {
    render(<KualitasDataCard isLoading={false} data={{ corong: { draft: 0, validasi: 0, aktif: 0, tidakAktif: 0 }, kelengkapan: { ...DATA.kelengkapan, totalAktif: 0 } }} />)
    expect(screen.getByText(/Belum ada data warga/)).toBeTruthy()
  })

  it('memuat: tampilkan indikator', () => {
    render(<KualitasDataCard isLoading />)
    expect(screen.getByText(/Memuat data/)).toBeTruthy()
  })
})
