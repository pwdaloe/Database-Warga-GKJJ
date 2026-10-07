'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useKeluargaMutations } from '@/hooks/useKeluarga'

export interface KeluargaHapus { id: number; nomorKeluarga?: string | null; wargas?: unknown[] | null }

/**
 * Konfirmasi hapus KK (Superadmin / Kepala Kantor). KK yang masih punya anggota tidak bisa dihapus
 * (server menolak); pesan penolakan ditampilkan di modal agar tidak terlihat seperti tombol rusak.
 */
export function HapusKeluargaModal({
  keluarga, onClose, onDeleted,
}: { keluarga: KeluargaHapus | null; onClose: () => void; onDeleted?: () => void }) {
  const { remove } = useKeluargaMutations()
  const [error, setError] = useState('')
  const jumlah = keluarga?.wargas?.length ?? 0

  function tutup() { setError(''); onClose() }

  async function hapus() {
    if (!keluarga) return
    setError('')
    try {
      await remove.mutateAsync(keluarga.id)
      onClose()
      onDeleted?.()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Gagal menghapus keluarga')
    }
  }

  return (
    <Modal open={!!keluarga} onClose={tutup} title="Konfirmasi Hapus" size="sm">
      <div className="space-y-4">
        <p className="text-gray-700">
          Hapus keluarga <span className="font-semibold">{keluarga?.nomorKeluarga}</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        {jumlah > 0 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            KK ini masih memiliki {jumlah} anggota dan tidak dapat dihapus. Pindahkan atau hapus anggotanya lebih dulu.
          </p>
        )}
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button onClick={tutup}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition">
            Batal
          </button>
          <button onClick={hapus} disabled={remove.isPending || jumlah > 0}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg transition">
            {remove.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
          </button>
        </div>
      </div>
    </Modal>
  )
}
