import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Kartu({ judul, aksi, children, className }: { judul?: ReactNode; aksi?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-xl border bg-white shadow-sm', className)}>
      {(judul || aksi) && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-marine-900 sm:text-base">{judul}</h2>
          {aksi}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

type Varian = 'utama' | 'sekunder' | 'bahaya' | 'hantu'
const VARIAN: Record<Varian, string> = {
  utama: 'bg-marine-700 text-white hover:bg-marine-600 disabled:bg-marine-700/50',
  sekunder: 'border bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50',
  bahaya: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/50',
  hantu: 'text-marine-700 hover:bg-marine-50 disabled:opacity-50',
}

export function Tombol({ varian = 'utama', sibuk, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian; sibuk?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || sibuk}
      className={clsx('inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed', VARIAN[varian], className)}
    >
      {sibuk && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

const kontrol = 'w-full rounded-lg border bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-marine-500 focus:outline-none focus:ring-2 focus:ring-marine-500/20 disabled:bg-gray-100 disabled:text-gray-500'

export function Bidang({ label, petunjuk, galat, wajib, children, className }: { label: string; petunjuk?: string; galat?: string | undefined; wajib?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1 block text-sm font-medium text-gray-800">
        {label}
        {wajib && <span className="text-red-600"> *</span>}
      </span>
      {petunjuk && <span className="mb-1.5 block text-xs text-gray-500">{petunjuk}</span>}
      {children}
      {galat && <span className="mt-1 block text-xs text-red-600">{galat}</span>}
    </label>
  )
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(kontrol, p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={clsx(kontrol, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={clsx(kontrol, 'resize-y', p.className)} />

type Nada = 'abu' | 'biru' | 'hijau' | 'kuning' | 'merah'
const NADA: Record<Nada, string> = {
  abu: 'bg-gray-100 text-gray-700',
  biru: 'bg-blue-100 text-blue-800',
  hijau: 'bg-green-100 text-green-800',
  kuning: 'bg-amber-100 text-amber-800',
  merah: 'bg-red-100 text-red-800',
}
export const Lencana = ({ nada = 'abu', children }: { nada?: Nada; children: ReactNode }) => (
  <span className={clsx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', NADA[nada])}>{children}</span>
)

export function Pemberitahuan({ nada = 'biru', judul, children }: { nada?: Exclude<Nada, 'abu'>; judul?: string; children?: ReactNode }) {
  const kelas = { biru: 'border-blue-200 bg-blue-50 text-blue-900', hijau: 'border-green-200 bg-green-50 text-green-900', kuning: 'border-amber-200 bg-amber-50 text-amber-900', merah: 'border-red-200 bg-red-50 text-red-900' }[nada]
  return (
    <div role={nada === 'merah' ? 'alert' : 'status'} className={clsx('rounded-lg border px-4 py-3 text-sm', kelas)}>
      {judul && <p className="font-semibold">{judul}</p>}
      {children && <div className={judul ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}

export function Memuat({ teks = 'Memuat…' }: { teks?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
      <Loader2 size={20} className="animate-spin" />
      {teks}
    </div>
  )
}
