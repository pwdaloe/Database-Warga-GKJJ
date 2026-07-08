'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'cookie_consent'

type ConsentValue = {
  status: 'essential' | 'all'
  date: string
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) setVisible(true)
  }, [])

  function setConsent(status: ConsentValue['status']) {
    const value: ConsentValue = { status, date: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="shrink-0 hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
          <Cookie size={20} />
        </div>
        <p className="text-sm text-gray-600 flex-1 leading-relaxed">
          Kami menggunakan penyimpanan lokal browser untuk fungsi esensial (mis. sesi login).
          Sistem ini tidak memasang cookie pelacakan/analitik pihak ketiga. Selengkapnya di{' '}
          <Link href="/kebijakan-cookie" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
            Kebijakan Cookie
          </Link>{' '}
          dan{' '}
          <Link href="/kebijakan-privasi" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
            Kebijakan Privasi (PDP)
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setConsent('essential')}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Hanya Esensial
          </button>
          <button
            onClick={() => setConsent('all')}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            Terima Semua
          </button>
        </div>
      </div>
    </div>
  )
}
