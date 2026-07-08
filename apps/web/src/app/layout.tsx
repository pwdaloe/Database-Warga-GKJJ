import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Database Warga GKJJ',
  description: 'Sistem Informasi Jemaat Gereja Kristen Jawa Jakarta',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'GKJJ Jemaat',
    statusBarStyle: 'default',
  },
  icons: { apple: '/logo-gkj.jpg' },
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
        <Providers>{children}</Providers>
        <CookieConsentBanner />
      </body>
    </html>
  )
}
