import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const replace = vi.fn()
let pathname = '/dashboard'
let user: any
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => pathname }))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user, loading: false }) }))

import { ProtectedRoute } from './ProtectedRoute'

beforeEach(() => { replace.mockReset(); user = { role: 'JEMAAT', mustChangePassword: false } })

describe('ProtectedRoute — akun Jemaat', () => {
  it.each(['/dashboard', '/warga', '/pengguna', '/keluarga/3'])('%s → dialihkan ke Profil Saya, isi tidak dirender', (p) => {
    pathname = p
    render(<ProtectedRoute><div>ISI RAHASIA</div></ProtectedRoute>)
    expect(replace).toHaveBeenCalledWith('/profil-saya')
    expect(screen.queryByText('ISI RAHASIA')).toBeNull()
  })

  it.each(['/profil-saya', '/hubungi'])('%s → boleh', (p) => {
    pathname = p
    render(<ProtectedRoute><div>ISI</div></ProtectedRoute>)
    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByText('ISI')).toBeInTheDocument()
  })

  it('role lain tidak terpengaruh', () => {
    user = { role: 'STAF_ADMIN', mustChangePassword: false }; pathname = '/warga'
    render(<ProtectedRoute><div>ISI</div></ProtectedRoute>)
    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByText('ISI')).toBeInTheDocument()
  })
})
