'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  totalPages: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onChange }: Props) {
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
      <p className="text-sm text-gray-500">
        Menampilkan <span className="font-medium">{from}–{to}</span> dari{' '}
        <span className="font-medium">{total}</span> data
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'p-2 rounded-lg text-sm transition',
            page <= 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100',
          )}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1
            : page <= 3 ? i + 1
            : page >= totalPages - 2 ? totalPages - 4 + i
            : page - 2 + i
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'w-8 h-8 rounded-lg text-sm transition',
                p === page
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'p-2 rounded-lg text-sm transition',
            page >= totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100',
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
