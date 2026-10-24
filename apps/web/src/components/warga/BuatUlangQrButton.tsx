'use client'

import { useState } from 'react'
import { QrCode, Loader2 } from 'lucide-react'
import { useWargaMutations } from '@/hooks/useWarga'

// Peran yang boleh membuat ulang QR (sama dengan penjaga di API: PERAN_ROTASI_QR)
export const PERAN_ROTASI_QR = ['SUPERADMIN', 'KEPALA_KANTOR', 'STAF_ADMIN']

export function BuatUlangQrButton({ wargaId, nama }: { wargaId: number; nama: string }) {
  const { rotateQr } = useWargaMutations()
  const [pesan, setPesan] = useState<{ jenis: 'ok' | 'error'; teks: string } | null>(null)

  async function handleClick() {
    const yakin = window.confirm(
      `Buat ulang QR kartu ${nama}?\n\nQR lama (kartu cetak atau tautan yang sudah dikirim) langsung tidak berlaku. ` +
      'Cetak ulang kartu atau kirim ulang tautan ke yang bersangkutan.',
    )
    if (!yakin) return
    setPesan(null)
    try {
      await rotateQr.mutateAsync(wargaId)
      setPesan({ jenis: 'ok', teks: 'QR baru dibuat. QR lama sudah tidak berlaku.' })
    } catch (e: any) {
      setPesan({ jenis: 'error', teks: e?.response?.data?.error ?? 'Gagal membuat QR baru. Coba lagi.' })
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={rotateQr.isPending}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition shrink-0 whitespace-nowrap disabled:opacity-60"
      >
        {rotateQr.isPending ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
        Buat ulang QR
      </button>
      {pesan && (
        <p role="status" className={pesan.jenis === 'ok' ? 'text-xs text-green-700' : 'text-xs text-red-600'}>
          {pesan.teks}
        </p>
      )}
    </div>
  )
}
