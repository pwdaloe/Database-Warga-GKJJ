'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { format, differenceInYears } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  ArrowLeft, Pencil, Users, MapPin, Phone,
  Crown, UserPlus, Home, Loader2,
} from 'lucide-react'
import { useKeluargaDetail, useKeluargaMutations } from '@/hooks/useKeluarga'
import { useWargaMutations } from '@/hooks/useWarga'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { KeluargaForm } from '../KeluargaForm'
import { WargaForm, type WargaFormData } from '../../warga/WargaForm'
import { cn } from '@/lib/utils'

const STATUS_KK_LABEL: Record<string, string> = {
  KEPALA: 'Kepala KK', ISTRI: 'Istri', ANAK: 'Anak',
  MENANTU: 'Menantu', CUCU: 'Cucu', LAINNYA: 'Lainnya',
}

export default function KeluargaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isRole } = useAuth()

  const [editOpen, setEditOpen] = useState(false)
  const [tambahOpen, setTambahOpen] = useState(false)

  const { data: keluarga, isLoading } = useKeluargaDetail(Number(id))
  const { update } = useKeluargaMutations()
  const { create } = useWargaMutations()

  const canEdit = isRole('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK')

  async function handleEditKK(formData: any) {
    await update.mutateAsync({ id: Number(id), data: formData })
    setEditOpen(false)
  }

  async function handleTambahAnggota(formData: WargaFormData) {
    const {
      newKelompokId, newAlamat, newRt, newRw, newKelurahan,
      newKecamatan, newKota, newKodePos, newTeleponRumah,
      ...wargaFields
    } = formData

    const sanitized = Object.fromEntries(
      Object.entries(wargaFields).map(([k, v]) => [k, v === '' ? null : v])
    )

    await create.mutateAsync(sanitized as any)
    // invalidate keluarga detail agar anggota baru muncul
    qc.invalidateQueries({ queryKey: ['keluarga', Number(id)] })
    setTambahOpen(false)
  }

  // ── Loading & not found ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center text-gray-400">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-brand-600" />
          Memuat data keluarga...
        </div>
      </div>
    )
  }

  if (!keluarga) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Users size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Data keluarga tidak ditemukan</p>
        <button
          onClick={() => router.push('/keluarga')}
          className="mt-4 text-sm text-brand-600 hover:underline"
        >
          Kembali ke Daftar Keluarga
        </button>
      </div>
    )
  }

  const kepala = keluarga.kepalaKeluarga
    ?? keluarga.wargas?.find((w: any) => w.statusKeluarga === 'KEPALA')
  const wargas: any[] = keluarga.wargas ?? []

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Back */}
      <button
        onClick={() => router.push('/keluarga')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Keluarga
      </button>

      {/* ── Header card ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                {keluarga.nomorKeluarga ?? '—'}
              </span>
              <Badge value={keluarga.dataStatus} type="dataStatus" />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin size={14} className="text-brand-500 shrink-0" />
              <span className="font-medium text-gray-800">{keluarga.kelompok?.nama ?? '—'}</span>
              {keluarga.kelompok?.wilayah && (
                <span className="text-gray-400">· {keluarga.kelompok.wilayah.nama}</span>
              )}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700
                border rounded-lg hover:bg-gray-50 transition shrink-0"
            >
              <Pencil size={14} />
              Edit Data KK
            </button>
          )}
        </div>
      </div>

      {/* ── Info row: Kepala + Alamat ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Kepala Keluarga */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Crown size={13} className="text-yellow-500" />
            Kepala Keluarga
          </h2>
          {kepala ? (
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0',
                kepala.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500',
              )}>
                {kepala.namaLengkap.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 leading-tight">{kepala.namaLengkap}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {kepala.nomorAnggota && (
                    <span className="text-xs font-mono text-gray-400">{kepala.nomorAnggota}</span>
                  )}
                  {(kepala.whatsapp || kepala.telepon) && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Phone size={10} />
                      {kepala.whatsapp ?? kepala.telepon}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push(`/warga/${kepala.id}`)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500
                  hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition shrink-0"
              >
                Biodata
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Kepala keluarga belum ditentukan</p>
          )}
        </div>

        {/* Alamat */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Home size={13} />
            Alamat
          </h2>
          {keluarga.alamat || keluarga.kelurahan ? (
            <div className="space-y-0.5 text-sm text-gray-700">
              {keluarga.alamat && <p>{keluarga.alamat}</p>}
              {(keluarga.rt || keluarga.rw || keluarga.kelurahan) && (
                <p className="text-xs text-gray-500">
                  {[
                    keluarga.rt && `RT ${keluarga.rt}`,
                    keluarga.rw && `RW ${keluarga.rw}`,
                    keluarga.kelurahan,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              {(keluarga.kecamatan || keluarga.kota) && (
                <p className="text-xs text-gray-500">
                  {[keluarga.kecamatan, keluarga.kota, keluarga.kodePos].filter(Boolean).join(', ')}
                </p>
              )}
              {keluarga.teleponRumah && (
                <p className="text-xs text-gray-400 flex items-center gap-1 pt-1">
                  <Phone size={10} />
                  {keluarga.teleponRumah}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Alamat belum diisi</p>
          )}
        </div>
      </div>

      {/* ── Tabel Anggota ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users size={15} />
            Anggota Keluarga
            <span className="font-normal text-gray-400">({wargas.length})</span>
          </h2>
          {canEdit && (
            <button
              onClick={() => setTambahOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600
                border border-brand-300 hover:bg-brand-50 rounded-lg transition"
            >
              <UserPlus size={14} />
              Tambah Anggota
            </button>
          )}
        </div>

        {wargas.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Belum ada anggota terdaftar</p>
            <p className="text-xs mt-1">Gunakan tombol "Tambah Anggota" untuk menambahkan</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Nama</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Status KK</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">JK</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Usia</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Sakramen</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Keanggotaan</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wargas.map((w: any) => {
                const isKepala = w.statusKeluarga === 'KEPALA'
                const usiaAnggota = w.tanggalLahir
                  ? differenceInYears(new Date(), new Date(w.tanggalLahir))
                  : null
                return (
                  <tr
                    key={w.id}
                    className={cn('transition', isKepala ? 'bg-yellow-50/50' : 'hover:bg-gray-50')}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                          w.jenisKelamin === 'L' ? 'bg-blue-400' : 'bg-pink-400',
                        )}>
                          {w.namaLengkap.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{w.namaLengkap}</p>
                          {w.namaPanggilan && (
                            <p className="text-xs text-gray-400">&quot;{w.namaPanggilan}&quot;</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        isKepala ? 'text-yellow-700' : 'text-gray-600',
                      )}>
                        {isKepala && <Crown size={11} />}
                        {STATUS_KK_LABEL[w.statusKeluarga] ?? w.statusKeluarga}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-gray-500">
                      {w.jenisKelamin === 'L' ? 'L' : 'P'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {usiaAnggota != null ? (
                        <>
                          <p className="text-sm">{usiaAnggota} th</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(w.tanggalLahir), 'd MMM yyyy', { locale: localeId })}
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 justify-center">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          w.sudahBaptis ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400',
                        )}>Baptis</span>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          w.sudahSidi ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400',
                        )}>Sidi</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge value={w.statusKeanggotaan} type="keanggotaan" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => router.push(`/warga/${w.id}`)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500
                          hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition"
                      >
                        Biodata
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Catatan */}
      {keluarga.catatan && (
        <div className="mt-4 bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Catatan</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{keluarga.catatan}</p>
        </div>
      )}

      {/* ── Modal Edit KK ─────────────────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Data Keluarga"
        size="lg"
      >
        <KeluargaForm
          defaultValues={{
            dataStatus: keluarga.dataStatus,
            kelompokId: keluarga.kelompokId,
            kepalakeluargaId: keluarga.kepalakeluargaId,
            alamat: keluarga.alamat,
            rt: keluarga.rt,
            rw: keluarga.rw,
            kelurahan: keluarga.kelurahan,
            kecamatan: keluarga.kecamatan,
            kota: keluarga.kota,
            kodePos: keluarga.kodePos,
            teleponRumah: keluarga.teleponRumah,
            catatan: keluarga.catatan,
          }}
          wargas={keluarga.wargas ?? []}
          onSubmit={handleEditKK}
          submitLabel="Update Keluarga"
          keluargaId={Number(id)}
        />
      </Modal>

      {/* ── Modal Tambah Anggota ──────────────────────────────── */}
      <Modal
        open={tambahOpen}
        onClose={() => setTambahOpen(false)}
        title="Tambah Anggota Keluarga"
        size="xl"
      >
        <WargaForm
          keluargaIdFixed={Number(id)}
          onSubmit={handleTambahAnggota}
          submitLabel="Simpan Anggota"
        />
      </Modal>
    </div>
  )
}
