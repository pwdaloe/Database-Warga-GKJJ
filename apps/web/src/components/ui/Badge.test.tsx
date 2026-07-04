import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('menampilkan label yang benar untuk status keanggotaan yang dikenal', () => {
    render(<Badge value="AKTIF" type="keanggotaan" />)
    expect(screen.getByText('Aktif')).toBeInTheDocument()
  })

  it('menampilkan label yang benar untuk status data', () => {
    render(<Badge value="VALIDASI" type="dataStatus" />)
    expect(screen.getByText('Validasi')).toBeInTheDocument()
  })

  it('menampilkan label yang benar untuk status dalam keluarga', () => {
    render(<Badge value="KEPALA" type="statusKeluarga" />)
    expect(screen.getByText('Kepala Keluarga')).toBeInTheDocument()
  })

  it('fallback ke nilai mentah jika value tidak dikenal di map', () => {
    render(<Badge value="NILAI_ANEH" type="keanggotaan" />)
    expect(screen.getByText('NILAI_ANEH')).toBeInTheDocument()
  })

  it('menggabungkan className tambahan dengan className dari config', () => {
    render(<Badge value="AKTIF" type="keanggotaan" className="custom-class" />)
    expect(screen.getByText('Aktif')).toHaveClass('custom-class')
  })
})
