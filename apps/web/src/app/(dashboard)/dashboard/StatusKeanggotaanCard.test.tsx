import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusKeanggotaanCard } from './StatusKeanggotaanCard'

const DATA = {
  total: 76,
  data: [
    { status: 'AKTIF' as const, jumlah: 74 }, { status: 'NON_AKTIF' as const, jumlah: 0 }, { status: 'KATEKUMEN' as const, jumlah: 0 },
    { status: 'PINDAH_GEREJA' as const, jumlah: 0 }, { status: 'PINDAH_KELUAR' as const, jumlah: 0 }, { status: 'MENINGGAL' as const, jumlah: 2 },
  ],
}

describe('StatusKeanggotaanCard', () => {
  it('menampilkan semua status dengan jumlah dan persen', () => {
    render(<StatusKeanggotaanCard isLoading={false} data={DATA} />)
    expect(screen.getByTestId('status-AKTIF').textContent).toContain('74')
    expect(screen.getByTestId('status-AKTIF').textContent).toContain('97,4%')
    expect(screen.getByTestId('status-MENINGGAL').textContent).toContain('2,6%')
    expect(screen.getByTestId('status-KATEKUMEN').textContent).toContain('0')
    expect(screen.getByText(/Total 76 warga tercatat/)).toBeTruthy()
  })

  it('Pindah Gereja dan Pindah Agama tampil dengan label baru; "Pindah keluar" tidak lagi ada', () => {
    render(<StatusKeanggotaanCard isLoading={false} data={DATA} />)
    expect(screen.getByText('Pindah Gereja')).toBeTruthy()
    expect(screen.getByText('Pindah Agama')).toBeTruthy()
    expect(screen.queryByText(/Pindah keluar/i)).toBeNull()
    expect(screen.getByTestId('status-PINDAH_GEREJA')).toBeTruthy()
  })

  it('lebar segmen bar sesuai proporsi', () => {
    render(<StatusKeanggotaanCard isLoading={false} data={DATA} />)
    const bar = screen.getByRole('img')
    expect(parseFloat((bar.children[0] as HTMLElement).style.width)).toBeCloseTo(97.37, 1)
    expect((bar.children[1] as HTMLElement).style.width).toBe('0%')
  })

  it('total 0 → pesan kosong, tanpa NaN', () => {
    render(<StatusKeanggotaanCard isLoading={false} data={{ total: 0, data: DATA.data.map((d) => ({ ...d, jumlah: 0 })) }} />)
    expect(screen.getByText(/Belum ada data warga/)).toBeTruthy()
    expect(screen.queryByText(/NaN/)).toBeNull()
  })

  it('memuat: tampilkan indikator', () => {
    render(<StatusKeanggotaanCard isLoading />)
    expect(screen.getByText(/Memuat data/)).toBeTruthy()
  })
})
