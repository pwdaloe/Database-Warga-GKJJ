import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemografiCard } from './DemografiCard'

describe('DemografiCard', () => {
  it('menampilkan jumlah, persen, dan total', () => {
    render(<DemografiCard isLoading={false} data={{ total: 100, pria: 45, wanita: 55, persenPria: 45, persenWanita: 55 }} />)
    expect(screen.getByTestId('demografi-pria').textContent).toBe('45')
    expect(screen.getByTestId('demografi-wanita').textContent).toBe('55')
    expect(screen.getByText('45%')).toBeTruthy()
    expect(screen.getByText('55%')).toBeTruthy()
    expect(screen.getByText(/Total 100 warga aktif/)).toBeTruthy()
  })

  it('lebar bar sesuai persen', () => {
    render(<DemografiCard isLoading={false} data={{ total: 3, pria: 1, wanita: 2, persenPria: 33.3, persenWanita: 66.7 }} />)
    const bar = screen.getByRole('img')
    expect((bar.children[0] as HTMLElement).style.width).toBe('33.3%')
    expect((bar.children[1] as HTMLElement).style.width).toBe('66.7%')
  })

  it('total 0 menampilkan pesan kosong, bukan bar', () => {
    render(<DemografiCard isLoading={false} data={{ total: 0, pria: 0, wanita: 0, persenPria: 0, persenWanita: 0 }} />)
    expect(screen.getByText(/Belum ada data warga aktif/)).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('memuat: tampilkan indikator', () => {
    render(<DemografiCard isLoading />)
    expect(screen.getByText(/Memuat data/)).toBeTruthy()
  })
})
