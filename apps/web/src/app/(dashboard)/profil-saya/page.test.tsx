import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ProfilData } from '@/lib/profilPayload'

const useProfil = vi.fn()
const mutateAsync = vi.fn()
vi.mock('@/hooks/useProfil', () => ({
  useProfil: () => useProfil(),
  useProfilMutation: () => ({ mutateAsync, isPending: false }),
}))

import ProfilSayaPage from './page'

const base: ProfilData = {
  namaLengkap: 'Ani Wijaya', nomorAnggota: 'WRG00010', jenisKelamin: 'P', statusKeluarga: 'KEPALA',
  namaPanggilan: 'Ani', tempatLahir: 'Solo', tanggalLahir: '1980-02-03', nikMasker: '3171••••••••0001', golonganDarah: 'O',
  telepon: '021111', whatsapp: '081234567890', whatsappBolehDitampilkan: false, email: 'ani@x.id',
  pendidikanTerakhir: 'S1', pekerjaan: 'Guru', alamatKtp: 'Jl. KTP 1', alamatDomisili: null, catatanJemaat: null,
  alamatKeluarga: { alamat: 'Jl. Melati 3', rt: '001', rw: '002', kelurahan: 'R', kecamatan: 'P', kota: 'J', kodePos: '13220', teleponRumah: null },
  bolehUbahAlamatKeluarga: true, menungguVerifikasi: false,
}

beforeEach(() => { useProfil.mockReset(); mutateAsync.mockReset().mockResolvedValue({}) })
const render_ = (over: Partial<ProfilData> = {}) => {
  useProfil.mockReturnValue({ data: { ...base, ...over }, isLoading: false })
  return render(<ProfilSayaPage />)
}

describe('Profil Saya', () => {
  it('nama lengkap tidak dapat diubah; NIK tersimpan hanya tampil dimasker', () => {
    render_()
    expect(screen.getByDisplayValue('Ani Wijaya')).toBeDisabled()
    expect(screen.getByText(/3171••••••••0001/)).toBeInTheDocument()
  })

  it('simpan tanpa mengubah → payload sama dengan data, tanpa NIK, tanpa field di luar whitelist', async () => {
    render_()
    fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/ }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    const payload = mutateAsync.mock.calls[0]![0]
    expect(payload).toMatchObject({ namaPanggilan: 'Ani', tempatLahir: 'Solo', whatsapp: '081234567890', pekerjaan: 'Guru', alamatDomisili: null })
    expect('nik' in payload).toBe(false)
    expect('namaLengkap' in payload).toBe(false)
    expect(payload.alamatKeluarga.alamat).toBe('Jl. Melati 3')
  })

  it('anggota non-kepala: kolom alamat KK terkunci dan tidak dikirim', async () => {
    render_({ statusKeluarga: 'ANAK', bolehUbahAlamatKeluarga: false })
    fireEvent.click(screen.getByRole('tab', { name: /Alamat/ }))
    expect(screen.getByText(/hanya dapat diubah oleh kepala keluarga/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jl. Melati 3')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/ }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect('alamatKeluarga' in mutateAsync.mock.calls[0]![0]).toBe(false)
  })

  it('checkbox domisili: tampil hanya bila dicentang; tidak dicentang → domisili null', async () => {
    render_({ alamatDomisili: 'Jl. Domisili 2' })
    fireEvent.click(screen.getByRole('tab', { name: /Alamat/ }))
    expect(screen.getByLabelText('Alamat Domisili')).toHaveValue('Jl. Domisili 2')
    fireEvent.click(screen.getByLabelText(/domisili berbeda/i))
    expect(screen.queryByLabelText('Alamat Domisili')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/ }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync.mock.calls[0]![0].alamatDomisili).toBeNull()
  })

  it('menampilkan pemberitahuan menunggu verifikasi dan pesan galat server', async () => {
    render_({ menungguVerifikasi: true })
    expect(screen.getByText(/menunggu verifikasi staf/)).toBeInTheDocument()
    mutateAsync.mockRejectedValueOnce({ response: { data: { error: 'NIK sudah terdaftar pada data lain' } } })
    fireEvent.click(screen.getByRole('button', { name: /Simpan Perubahan/ }))
    expect(await screen.findByText(/NIK sudah terdaftar/)).toBeInTheDocument()
  })
})
