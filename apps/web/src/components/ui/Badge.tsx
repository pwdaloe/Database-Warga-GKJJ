import { cn } from '@/lib/utils'

const STATUS_KEANGGOTAAN: Record<string, { label: string; className: string }> = {
  AKTIF:        { label: 'Aktif',         className: 'bg-green-100 text-green-700' },
  NON_AKTIF:    { label: 'Non Aktif',     className: 'bg-gray-100 text-gray-600' },
  KATEKUMEN:    { label: 'Katekumen',     className: 'bg-blue-100 text-blue-700' },
  PINDAH_KELUAR:{ label: 'Pindah Keluar', className: 'bg-orange-100 text-orange-700' },
  MENINGGAL:    { label: 'Meninggal',     className: 'bg-red-100 text-red-700' },
}

const DATA_STATUS: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',    className: 'bg-gray-100 text-gray-600' },
  PENDING:   { label: 'Pending',  className: 'bg-yellow-100 text-yellow-700' },
  APPROVED:  { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  VALIDATED: { label: 'Valid',    className: 'bg-green-100 text-green-700' },
}

const STATUS_KELUARGA_MAP: Record<string, { label: string; className: string }> = {
  KEPALA:   { label: 'Kepala Keluarga', className: 'bg-blue-100 text-blue-700' },
  ISTRI:    { label: 'Istri',           className: 'bg-pink-100 text-pink-700' },
  ANAK:     { label: 'Anak',            className: 'bg-green-100 text-green-700' },
  MENANTU:  { label: 'Menantu',         className: 'bg-teal-100 text-teal-700' },
  CUCU:     { label: 'Cucu',            className: 'bg-purple-100 text-purple-700' },
  LAINNYA:  { label: 'Lainnya',         className: 'bg-gray-100 text-gray-600' },
}

interface BadgeProps {
  value: string
  type: 'keanggotaan' | 'dataStatus' | 'statusKeluarga'
  className?: string
}

export function Badge({ value, type, className }: BadgeProps) {
  const map = type === 'keanggotaan' ? STATUS_KEANGGOTAAN
    : type === 'dataStatus' ? DATA_STATUS
    : STATUS_KELUARGA_MAP

  const config = map[value] ?? { label: value, className: 'bg-gray-100 text-gray-600' }

  return (
    <span className={cn('inline-block text-xs font-medium px-2.5 py-1 rounded-full', config.className, className)}>
      {config.label}
    </span>
  )
}
