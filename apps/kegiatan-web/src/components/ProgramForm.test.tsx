import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProgramForm } from './ProgramForm'
import type { Master, Pengguna, ProgramDetail } from '@/lib/tipe'

const push = vi.fn()
const replace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }))

let userAktif: Pengguna
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: userAktif, adalah: (...p: string[]) => p.includes(userAktif.peran) }),
}))

const aksi = {
  buat: { mutateAsync: vi.fn() },
  simpan: { mutateAsync: vi.fn() },
  ajukan: { mutateAsync: vi.fn() },
  tarik: { mutateAsync: vi.fn() },
  hapus: { mutateAsync: vi.fn() },
}
vi.mock('@/hooks/useData', () => ({ useAksiProgram: () => aksi }))

const pengguna = (peran: Pengguna['peran'], unitId: number | null = 5): Pengguna => ({
  id: 1, username: 'u', nama: 'U', email: null, whatsapp: null, peran, unitId, bidangId: null, wajibGantiPassword: false, unit: null, bidang: null,
})

const unit = { id: 5, kode: 'U5', nama: 'Komisi Anak', singkatan: 'Anak', bidangId: 1, jenis: 'UPK' as const }
const master = (statusPengajuan: 'DIBUKA' | 'DITUTUP' | 'BELUM_DIBUKA' = 'DIBUKA'): Master => ({
  tahun: { id: 1, tahun: 2027, nama: 'RKA 2027', statusPengajuan, rencanaBuka: null, rencanaTutup: null, praMukerTanggal: null, mukerTanggal: null, aktif: true },
  tahunList: [], dukungan: { aktif: false, nomor: null, pesan: 'Halo' }, bidang: [], unit: [{ ...unit, alias: [], urutan: 1, aktif: true, pagu: 25_000_000 }], satuan: [{ id: 1, nama: 'Orang', urutan: 0, aktif: true }], kategoriBiaya: [],
  acuan: [
    { id: 1, tahunId: 1, jenis: 'VISI', kode: 'VISI', nama: 'Visi', deskripsi: 'Visi gereja', parentId: null, urutan: 0, aktif: true },
    { id: 2, tahunId: 1, jenis: 'MISI', kode: 'IMAN', nama: 'Bertumbuh dalam iman', deskripsi: null, parentId: 1, urutan: 1, aktif: true },
  ],
  program2026: [], checklist: [{ kode: 'a', label: 'Butir A' }, { kode: 'b', label: 'Butir B' }],
  enum: { kategoriWaktu: ['SEKALI', 'PERIODE', 'RENTANG', 'TAHUN'], sumberDana: ['GEREJA', 'SWADAYA', 'PENGGALANGAN', 'DONASI'], jenisProgram: ['BARU', 'LANJUTAN', 'GABUNGAN'] },
})

const program = (ubah: Partial<ProgramDetail> = {}): ProgramDetail => ({
  id: 10, nomor: '2027-U5-0010', tahun: { id: 1, tahun: 2027, nama: 'RKA 2027', statusPengajuan: 'DIBUKA' }, unit, judul: 'Ibadah Anak', jenisProgram: 'BARU', program2026Id: null,
  latarBelakang: 'L', kebutuhan: 'K', tujuan: 'T', sasaranPenerima: 'S', targetPeserta: 50, evaluasi: 'E', picNama: 'PIC', picWhatsapp: '0812', checklist: {}, status: 'DRAFT',
  diajukanPada: null, isContoh: false, updatedAt: '', acuanIds: [2],
  jadwal: [{ id: 1, nama: 'Ibadah', kategoriWaktu: 'TAHUN', tanggalMulai: null, tanggalSelesai: null, keteranganPeriode: null, lokasi: null, hasilLangsung: null }],
  indikator: [{ id: 1, indikator: 'Hadir', target: '40', bukti: 'Daftar hadir' }],
  rab: [{ id: 1, kategoriId: null, kategori: null, uraian: 'Konsumsi', perhitungan: null, volume: 20, satuan: 'Orang', hargaSatuan: 25_000, jumlah: 500_000 }],
  sumberDana: [{ jenis: 'GEREJA', nilai: 300_000, keterangan: null }],
  totalRab: 500_000, totalSumberDana: 300_000, selisih: 200_000, gereja: 300_000, mandiri: 0, ...ubah,
})

beforeEach(() => {
  vi.clearAllMocks()
  userAktif = pengguna('PENGURUS_UPK', 5)
})

describe('ProgramForm', () => {
  it('menampilkan total anggaran hasil hitung dan selisih sumber dana yang jelas', () => {
    render(<ProgramForm master={master()} awal={program()} />)
    expect(screen.getByTestId('total-rab').textContent).toBe('Rp 500.000')
    expect(screen.getByText(/Sumber dana kurang Rp 200\.000 dari anggaran/)).toBeTruthy()
  })

  it('tombol "isi sisa" mengisi alokasi gereja sehingga selisih hilang', () => {
    render(<ProgramForm master={master()} awal={program({ sumberDana: [] })} />)
    fireEvent.click(screen.getByRole('button', { name: /Isi sisa kebutuhan/ }))
    expect(screen.getByText(/Sumber dana sama dengan anggaran/)).toBeTruthy()
  })

  it('mengubah harga satuan memperbarui total secara langsung (tidak ada kolom total yang bisa diketik)', () => {
    render(<ProgramForm master={master()} awal={program()} />)
    const harga = screen.getAllByRole('textbox').find((el) => (el as HTMLInputElement).value === '25.000') as HTMLInputElement
    fireEvent.change(harga, { target: { value: '50000' } })
    expect(screen.getByTestId('total-rab').textContent).toBe('Rp 1.000.000')
  })

  it('pengurus unit sendiri + pengajuan dibuka: dapat menyimpan dan mengajukan', () => {
    render(<ProgramForm master={master()} awal={program()} />)
    expect(screen.getByRole('button', { name: 'Simpan draft' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Ajukan' })).toBeEnabled()
  })

  it('pengajuan ditutup: formulir terkunci dan tidak ada tombol simpan/ajukan', () => {
    render(<ProgramForm master={master('DITUTUP')} awal={program({ tahun: { id: 1, tahun: 2027, nama: 'RKA 2027', statusPengajuan: 'DITUTUP' } })} />)
    expect(screen.queryByRole('button', { name: 'Simpan draft' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajukan' })).toBeNull()
    expect(screen.getByText('Program tidak dapat diubah')).toBeTruthy()
  })

  it('program unit lain: terkunci untuk pengurus', () => {
    userAktif = pengguna('PENGURUS_UPK', 6)
    render(<ProgramForm master={master()} awal={program()} />)
    expect(screen.queryByRole('button', { name: 'Ajukan' })).toBeNull()
  })

  it('program sudah diajukan: hanya tombol tarik; isian terkunci', () => {
    render(<ProgramForm master={master()} awal={program({ status: 'DIAJUKAN' })} />)
    expect(screen.queryByRole('button', { name: 'Ajukan' })).toBeNull()
    expect(screen.getByRole('button', { name: /Tarik kembali ke draft/ })).toBeTruthy()
    expect(screen.getByText('Program sudah diajukan')).toBeTruthy()
  })

  it('pengajuan sudah ditutup: pengurus tidak boleh menarik, sekretariat boleh', () => {
    const tutup = { tahun: { id: 1, tahun: 2027, nama: 'RKA 2027', statusPengajuan: 'DITUTUP' as const }, status: 'DIAJUKAN' as const }
    const { unmount } = render(<ProgramForm master={master('DITUTUP')} awal={program(tutup)} />)
    expect(screen.queryByRole('button', { name: /Tarik kembali/ })).toBeNull()
    unmount()
    userAktif = pengguna('SEKRETARIAT', null)
    render(<ProgramForm master={master('DITUTUP')} awal={program(tutup)} />)
    expect(screen.getByRole('button', { name: /Tarik kembali/ })).toBeTruthy()
  })

  it('ajukan: menyimpan dahulu lalu mengajukan; daftar masalah dari server ditampilkan', async () => {
    aksi.simpan.mutateAsync.mockResolvedValue(program())
    aksi.ajukan.mutateAsync.mockRejectedValue({ response: { data: { error: 'Program belum lengkap untuk diajukan.', details: { masalah: ['Daftar periksa belum lengkap (2 butir belum dicentang).'] } } } })
    render(<ProgramForm master={master()} awal={program()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }))
    await waitFor(() => expect(screen.getByText('Program belum lengkap untuk diajukan')).toBeTruthy())
    expect(aksi.simpan.mutateAsync).toHaveBeenCalledTimes(1)
    expect(aksi.ajukan.mutateAsync).toHaveBeenCalledWith(10)
    // muncul di daftar masalah server dan di petunjuk lokal
    expect(screen.getAllByText(/2 butir belum dicentang/).length).toBeGreaterThanOrEqual(1)
  })

  it('angka tidak valid tidak dikirim ke server', async () => {
    render(<ProgramForm master={master()} awal={program()} />)
    const volume = screen.getAllByRole('spinbutton').find((el) => (el as HTMLInputElement).value === '20') as HTMLInputElement
    fireEvent.change(volume, { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draft' }))
    await waitFor(() => expect(screen.getByText(/volume harus bilangan bulat/)).toBeTruthy())
    expect(aksi.simpan.mutateAsync).not.toHaveBeenCalled()
  })

  it('program baru oleh pengurus: menyimpan dengan unit milik pengurus lalu pindah ke halaman program', async () => {
    aksi.buat.mutateAsync.mockResolvedValue(program({ id: 77 }))
    render(<ProgramForm master={master()} awal={null} unitIdBaru={5} />)
    fireEvent.change(screen.getAllByRole('textbox')[0]!, { target: { value: 'Retreat Anak' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draft' }))
    await waitFor(() => expect(aksi.buat.mutateAsync).toHaveBeenCalled())
    expect(aksi.buat.mutateAsync.mock.calls[0]![0]).toMatchObject({ judul: 'Retreat Anak', unitId: 5 })
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/program/77'))
  })

  it('judul terlalu pendek ditolak di sisi klien', async () => {
    render(<ProgramForm master={master()} awal={null} unitIdBaru={5} />)
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draft' }))
    await waitFor(() => expect(screen.getByText(/Judul program minimal 3 karakter/)).toBeTruthy())
    expect(aksi.buat.mutateAsync).not.toHaveBeenCalled()
  })
})
