import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('menampilkan rentang data yang benar', () => {
    render(<Pagination page={2} totalPages={5} total={48} limit={10} onChange={vi.fn()} />)
    expect(screen.getByText('11–20')).toBeInTheDocument()
    expect(screen.getByText('48')).toBeInTheDocument()
  })

  it('memanggil onChange dengan halaman berikutnya saat tombol next diklik', () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={5} total={48} limit={10} onChange={onChange} />)

    fireEvent.click(screen.getAllByRole('button').at(-1)!)

    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('memanggil onChange dengan halaman sebelumnya saat tombol prev diklik', () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={5} total={48} limit={10} onChange={onChange} />)

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('menonaktifkan tombol prev di halaman pertama', () => {
    render(<Pagination page={1} totalPages={5} total={48} limit={10} onChange={vi.fn()} />)
    expect(screen.getAllByRole('button')[0]).toBeDisabled()
  })

  it('menonaktifkan tombol next di halaman terakhir', () => {
    render(<Pagination page={5} totalPages={5} total={48} limit={10} onChange={vi.fn()} />)
    expect(screen.getAllByRole('button').at(-1)).toBeDisabled()
  })

  it('memanggil onChange dengan nomor halaman saat nomor halaman diklik', () => {
    const onChange = vi.fn()
    render(<Pagination page={1} totalPages={5} total={48} limit={10} onChange={onChange} />)

    fireEvent.click(screen.getByText('3'))

    expect(onChange).toHaveBeenCalledWith(3)
  })
})
