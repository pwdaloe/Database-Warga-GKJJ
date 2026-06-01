'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, differenceInYears } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  ArrowLeft,
  Pencil,
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  Crown,
} from 'lucide-react'
import { useWargaDetail, useWargaMutations } from '@/hooks/useWarga'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { WargaForm } from '../WargaForm'
import { cn } from '@/lib/utils'

type Tab = 'biodata' | 'keluarga'

const STATUS_KELUARGA_ICON: Record<string, string> = {
  KEPALA: '👨',
  ISTRI: '👩',
  ANAK: '🧒',
  MENANTU: '🤝',
  CUCU: '👶',
  LAINNYA: '👤',
}

export default function WargaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isRole } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('biodata')
  const [editOpen, setEditOpen] = useState(false)

  const { data: warga, isLoading } = useWargaDetail(Number(id))
  const { update } = useWargaMutations()

  const canEdit = isRole('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK')

  async function handleEdit(formData: any) {
    await update.mutateAsync({ id: Number(id), data: formData })
    setEditOpen(false)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
          Memuat data warga...
        </div>
      </div>
    )
  }

  if (!warga) {
    return (
      <div className="p-8 text-center text-gray-500">
        <User size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Data warga tidak ditemukan</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-brand-600 hover:underline">
          Kembali
        </button>
      </div>
    )
  }

  const usia = warga.tanggalLahir
    ? differenceInYears(new Date(), new Date(warga.tanggalLahir))
    : null

  const anggotaKeluarga: any[] = warga.keluarga?.wargas ?? []
  const anggotaLain = anggotaKeluarga.filter((a: any) => a.id !== warga.id)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Warga
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {warga.fotoUrl ? (
              <img
                src={warga.fotoUrl}
                alt={warga.namaLengkap}
                className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-gray-100 shadow-sm"
              />
            ) : (
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0',
                warga.jenisKelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500',
              )}>
                {warga.namaLengkap.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{warga.namaLengkap}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {warga.nomorAnggota && (
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {warga.nomorAnggota}
                  </span>
                )}
                {warga.namaPanggilan && (
                  <span className="text-sm text-gray-400">&quot;{warga.namaPanggilan}&quot;</span>
                )}
                <Badge value={warga.statusKeluarga} type="statusKeluarga" />
                <Badge value={warga.statusKeanggotaan} type="keanggotaan" />
                <Badge value={warga.dataStatus} type="dataStatus" />
              </div>
              {warga.keluarga && (
                <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                  <MapPin size={13} />
                  {warga.keluarga.kelompok?.nama}
                  {warga.keluarga.kelompok?.wilayah && (
                    <span className="text-gray-400">· {warga.keluarga.kelompok.wilayah.nama}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition shrink-0"
            >
              <Pencil size={14} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'biodata', label: 'Biodata', icon: User },
          { key: 'keluarga', label: `Anggota Keluarga (${anggotaKeluarga.length})`, icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
              activeTab === key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Biodata */}
      {activeTab === 'biodata' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identitas */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={14} /> Identitas Pribadi
            </h2>
            <dl className="space-y-3">
              <InfoRow label="Jenis Kelamin" value={warga.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
              <InfoRow
                label="Tempat, Tanggal Lahir"
                value={
                  warga.tanggalLahir
                    ? `${warga.tempatLahir ?? '—'}, ${format(new Date(warga.tanggalLahir), 'd MMMM yyyy', { locale: localeId })} (${usia} tahun)`
                    : warga.tempatLahir ?? '—'
                }
              />
              <InfoRow label="NIK" value={warga.nik} mono />
              <InfoRow label="Golongan Darah" value={warga.golonganDarah} />
              <InfoRow label="Pendidikan" value={warga.pendidikanTerakhir} />
              <InfoRow label="Pekerjaan" value={warga.pekerjaan} />
              {warga.nomorInduk && <InfoRow label="No. Induk" value={warga.nomorInduk} mono />}
            </dl>
          </div>

          {/* Sakramen */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <BookOpen size={14} /> Sakramen & Keanggotaan
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Baptis</dt>
                <dd className="text-sm text-gray-800">
                  {warga.sudahBaptis ? (
                    <span>
                      Sudah baptis
                      {warga.tanggalBaptis && (
                        <span className="text-gray-500">
                          {' '}· {format(new Date(warga.tanggalBaptis), 'd MMM yyyy', { locale: localeId })}
                          {warga.tempatBaptis && ` di ${warga.tempatBaptis}`}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">Belum baptis</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Sidi</dt>
                <dd className="text-sm text-gray-800">
                  {warga.sudahSidi ? (
                    <span>
                      Sudah sidi
                      {warga.nomorSidi && <span className="text-gray-500"> · No. {warga.nomorSidi}</span>}
                      {warga.tanggalSidi && (
                        <span className="text-gray-500">
                          {' '}· {format(new Date(warga.tanggalSidi), 'd MMM yyyy', { locale: localeId })}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">Belum sidi</span>
                  )}
                </dd>
              </div>
              <InfoRow label="Status Keanggotaan">
                <Badge value={warga.statusKeanggotaan} type="keanggotaan" />
              </InfoRow>
              <InfoRow label="Status Data">
                <Badge value={warga.dataStatus} type="dataStatus" />
              </InfoRow>
            </dl>
          </div>

          {/* Kontak */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Phone size={14} /> Kontak
            </h2>
            <dl className="space-y-3">
              <InfoRow label="Telepon" value={warga.telepon} />
              <InfoRow label="WhatsApp" value={warga.whatsapp} />
              <InfoRow label="Email" value={warga.email} />
            </dl>
          </div>

          {/* Keluarga ringkas */}
          {warga.keluarga && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <MapPin size={14} /> Keluarga & Wilayah
              </h2>
              <dl className="space-y-3">
                <InfoRow label="No. KK" value={warga.keluarga.nomorKeluarga} mono />
                <InfoRow label="Kepala Keluarga" value={warga.keluarga.kepalaKeluarga?.namaLengkap} />
                <InfoRow label="Kelompok" value={warga.keluarga.kelompok?.nama} />
                <InfoRow label="Wilayah" value={warga.keluarga.kelompok?.wilayah?.nama} />
                <InfoRow
                  label="Alamat"
                  value={[
                    warga.keluarga.alamat,
                    warga.keluarga.rt && `RT ${warga.keluarga.rt}`,
                    warga.keluarga.rw && `RW ${warga.keluarga.rw}`,
                    warga.keluarga.kelurahan,
                    warga.keluarga.kecamatan,
                    warga.keluarga.kota,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                />
              </dl>
            </div>
          )}

          {/* Catatan */}
          {warga.catatan && (
            <div className="bg-white rounded-xl border shadow-sm p-6 md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Catatan</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{warga.catatan}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Anggota Keluarga */}
      {activeTab === 'keluarga' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Info KK */}
          {warga.keluarga && (
            <div className="px-6 py-4 bg-gray-50 border-b flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-gray-500">
                No. KK: <span className="font-mono font-medium text-gray-800">{warga.keluarga.nomorKeluarga ?? '—'}</span>
              </span>
              {warga.keluarga.kepalaKeluarga && (
                <span className="text-gray-500 flex items-center gap-1">
                  <Crown size={13} className="text-yellow-500" />
                  Kepala: <span className="font-medium text-gray-800 ml-1">{warga.keluarga.kepalaKeluarga.namaLengkap}</span>
                </span>
              )}
              <span className="text-gray-500">
                {anggotaKeluarga.length} anggota terdaftar
              </span>
            </div>
          )}

          {anggotaKeluarga.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada anggota keluarga terdaftar</p>
              <p className="text-sm mt-1">Tambahkan warga dan hubungkan ke nomor KK yang sama</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Nama</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Status dalam Keluarga</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Lahir / Usia</th>
                  <th className="px-5 py-3 text-center font-medium text-gray-600">Sakramen</th>
                  <th className="px-5 py-3 text-center font-medium text-gray-600">Keanggotaan</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {anggotaKeluarga.map((a: any) => {
                  const isCurrentWarga = a.id === warga.id
                  const usiaAnggota = a.tanggalLahir
                    ? differenceInYears(new Date(), new Date(a.tanggalLahir))
                    : null
                  return (
                    <tr
                      key={a.id}
                      className={cn('transition', isCurrentWarga ? 'bg-brand-50' : 'hover:bg-gray-50')}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{STATUS_KELUARGA_ICON[a.statusKeluarga] ?? '👤'}</span>
                          <div>
                            <p className={cn('font-medium', isCurrentWarga ? 'text-brand-700' : 'text-gray-900')}>
                              {a.namaLengkap}
                              {isCurrentWarga && (
                                <span className="ml-2 text-xs text-brand-500 font-normal">(ini)</span>
                              )}
                            </p>
                            {a.namaPanggilan && (
                              <p className="text-xs text-gray-400">&quot;{a.namaPanggilan}&quot;</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge value={a.statusKeluarga} type="statusKeluarga" />
                      </td>
                      <td className="px-5 py-3.5">
                        {a.tanggalLahir ? (
                          <div>
                            <p className="text-gray-700">
                              {format(new Date(a.tanggalLahir), 'd MMM yyyy', { locale: localeId })}
                            </p>
                            <p className="text-xs text-gray-400">{usiaAnggota} tahun</p>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5 justify-center">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            a.sudahBaptis ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                          )}>Baptis</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            a.sudahSidi ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                          )}>Sidi</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge value={a.statusKeanggotaan} type="keanggotaan" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!isCurrentWarga && (
                          <button
                            onClick={() => router.push(`/warga/${a.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600
                              hover:bg-gray-50 hover:text-brand-600 transition"
                          >
                            Lihat
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Edit */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit: ${warga.namaLengkap}`}
        size="xl"
      >
        <WargaForm
          defaultValues={{
            dataStatus: warga.dataStatus,
            keluargaId: warga.keluargaId,
            nomorInduk: warga.nomorInduk,
            namaLengkap: warga.namaLengkap,
            namaPanggilan: warga.namaPanggilan,
            jenisKelamin: warga.jenisKelamin,
            tempatLahir: warga.tempatLahir,
            tanggalLahir: warga.tanggalLahir?.split('T')[0],
            nik: warga.nik,
            golonganDarah: warga.golonganDarah,
            statusKeluarga: warga.statusKeluarga,
            statusKeanggotaan: warga.statusKeanggotaan,
            sudahBaptis: warga.sudahBaptis,
            tanggalBaptis: warga.tanggalBaptis?.split('T')[0],
            tempatBaptis: warga.tempatBaptis,
            sudahSidi: warga.sudahSidi,
            nomorSidi: warga.nomorSidi,
            tanggalSidi: warga.tanggalSidi?.split('T')[0],
            telepon: warga.telepon,
            whatsapp: warga.whatsapp,
            email: warga.email,
            pendidikanTerakhir: warga.pendidikanTerakhir,
            pekerjaan: warga.pekerjaan,
            catatan: warga.catatan,
          }}
          onSubmit={handleEdit}
          submitLabel="Update Warga"
        />
      </Modal>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
  children,
}: {
  label: string
  value?: string | null
  mono?: boolean
  children?: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className={cn('text-sm text-gray-800', mono && 'font-mono')}>
        {children ?? (value || <span className="text-gray-300">—</span>)}
      </dd>
    </div>
  )
}
