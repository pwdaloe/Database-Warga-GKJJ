'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check, Loader2, MessageCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useNotifikasiAkun, type AppUser, type TemplateKode } from '@/hooks/useUsers'

export interface InfoAkun { user: AppUser; password: string; templateKode: TemplateKode }

/**
 * Menampilkan password awal SEKALI (tidak disimpan di server) + pesan WhatsApp siap kirim (tautan wa.me).
 * Membuka modal ini menyiapkan pesan sekali dan mencatatnya di log (password dimasker).
 */
export function InfoAkunModal({ info, onClose }: { info: InfoAkun | null; onClose: () => void }) {
  const notif = useNotifikasiAkun()
  const [copied, setCopied] = useState(false)
  const siapkan = useRef(notif.mutate)
  siapkan.current = notif.mutate
  const reset = notif.reset

  useEffect(() => {
    if (!info) return
    setCopied(false)
    siapkan.current({ id: info.user.id, templateKode: info.templateKode, password: info.password })
    return () => reset()
  }, [info, reset])

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* abaikan */ }
  }

  const err = (notif.error as any)?.response?.data?.error ?? (notif.error as Error | null)?.message

  return (
    <Modal open={!!info} onClose={onClose} title="Info Akun" size="md">
      {info && (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Password hanya tampil <strong>sekali</strong> ini. Pengguna wajib menggantinya saat login pertama.
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <span className="text-gray-500">Nama</span><span className="font-medium">{info.user.nama}</span>
            <span className="text-gray-500">Username</span><span className="font-mono">{info.user.username}</span>
            <span className="text-gray-500">Password</span>
            <span className="flex items-center gap-2">
              <code className="font-mono text-base font-semibold tracking-wide">{info.password}</code>
              <button type="button" onClick={() => copy(info.password)} aria-label="Salin password"
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </span>
          </div>

          {notif.isPending && <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> Menyiapkan pesan…</p>}
          {err && (
            <p className="text-sm text-red-600">
              {err}. Isi nomor WhatsApp lewat tombol Edit, lalu kirim ulang dari ikon kunci.
            </p>
          )}
          {notif.data && (
            <>
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 border rounded-lg p-3 max-h-56 overflow-auto font-sans">{notif.data.pesan}</pre>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button type="button" onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Tutup</button>
                <a href={notif.data.waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
                  <MessageCircle size={16} /> Kirim via WhatsApp
                </a>
              </div>
            </>
          )}
          {!notif.data && !notif.isPending && (
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Tutup</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
