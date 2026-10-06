import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Jalur galat diuji pada tingkat tampilan: hook dimock agar keadaan error bisa ditentukan langsung.
vi.mock('@/hooks/useUsers', () => ({
  useNotifikasiAkun: () => ({
    mutate: vi.fn(), reset: vi.fn(), isPending: false, data: undefined,
    error: { response: { data: { error: 'Pengguna belum memiliki nomor WhatsApp yang valid' } } },
  }),
}))

import { InfoAkunModal } from './InfoAkunModal'

describe('InfoAkunModal — pengguna tanpa nomor WA', () => {
  it('pesan galat jelas, password tetap tampil, tidak ada tombol kirim', () => {
    const info = { user: { id: 9, nama: 'Budi', username: 'budi.s' } as any, password: 'Ab3xK9mQpz', templateKode: 'RESET_PASSWORD' as const }
    render(<InfoAkunModal info={info} onClose={() => {}} />)
    expect(screen.getByText(/belum memiliki nomor WhatsApp/)).toBeInTheDocument()
    expect(screen.getByText('Ab3xK9mQpz')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Kirim via WhatsApp/ })).toBeNull()
  })
})
